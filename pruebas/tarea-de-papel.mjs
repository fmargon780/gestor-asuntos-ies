/* Prueba de la fila 703 de docs/COLA.md (docs/703-TAREA-DE-PAPEL.md): la tarea de papel, una línea que sigue al documento.
   Elegir el papel al añadir y en la guía, la línea con el recorrido y sin casilla, «Generar documento» y «Añadir documento»,
   los pasos que se marcan solos con la prueba del documento (generado, firmado, registrado), «Marcar el paso a mano»,
   la firma que manda en la plantilla, «Quitar el documento», la unión de un documento que llega por otro camino y la tarea
   hecha con todos los pasos. Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const TIPO = 'PRUEBA TAREA DE PAPEL';
const A = await pagina.evaluate(() => App.E.listaAbiertos[0].nombre);
await pagina.evaluate(async ([tipo, a]) => {
  App.E.tipos.push({ tipo: tipo, categoria: 'ALUMNADO', sinHitos: true });
  await App.guardarTipos();
  if (!App.E.tiposDocumento.some((t) => t === 'COMUNICACION')) App.E.tiposDocumento.push('COMUNICACION');
  /* COMUNICACION: lo hacemos, firma Secretaría con visto bueno de Dirección, se registra y se envía por iPasen. */
  await RecorridoTipo.poner('COMUNICACION', { entra: false, firma: 'Secretaría, con visto bueno de Dirección', registro: true, envia: true, aquien: 'Familia', via: 'iPasen' });
  await RecorridoTipo.poner('DNI', { entra: true, registro: false });
  await Hitos.cambiar((d) => { delete d.porAsunto[a]; return d; });
  await Hitos.crearDesdeGuia(a, tipo);
}, [TIPO, A]);

const HOY = await pagina.evaluate(() => U.hoyIso());
async function abrirFicha(clave) {
  await pagina.evaluate(async () => { App.ir('abiertos'); InicioTabla.cambiar('todos'); await InicioTabla.pintar(); });
  await pagina.waitForTimeout(400);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .ash', { timeout: 10000 });
  await pagina.waitForTimeout(500);
}
const tareas = () => pagina.locator('#ficha-guia .ash-tarea');
const panel = () => pagina.locator('#ficha-guia .ash-panel').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const linea = (n) => tareas().nth(n).locator('.tp-recorrido').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const hito = () => pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; return Hitos.guionDe(null, h).map((g) => ({ texto: g.texto, papel: g.papel, hecho: g.hecho, doc: (g.papelDoc || {}).numero || '' })); }, A);
async function anotarDoc(numero, tipo, datos) {
  await pagina.evaluate(async ([k, n, t, d]) => { await DocumentosDatos.anotar(k, n, Object.assign({ tipo: t, fecha: U.hoyIso(), registros: [], campos: [], texto: '' }, d || {})); }, [A, numero, tipo, datos]);
}
async function repintar() { await abrirFicha(A); }

console.log('--- elegir el papel al añadir la tarea ---');
await abrirFicha(A);
await comprobar('1. «+ Añadir tarea» ofrece «Sin papel» y «Papel: <tipo>»', pagina.evaluate(() => { const o = Array.from(document.querySelectorAll('.ash-anadir-papel option')).map((x) => x.textContent); return [o[0], o.indexOf('Papel: COMUNICACION') !== -1]; }), ['Sin papel', true]);
await pagina.fill('.ash-anadir-texto', 'Comunicar la medida a la familia');
await pagina.selectOption('.ash-anadir-papel', 'COMUNICACION');
await pagina.click('.ash-anadir-boton');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea').length === 1, null, { timeout: 8000 });
await pagina.fill('.ash-anadir-texto', 'Comprobar el DNI de quien firma');
await pagina.click('.ash-anadir-boton');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea').length === 2, null, { timeout: 8000 });
await comprobar('2. la tarea de papel se guarda con su tipo; la otra, sin papel', hito().then((l) => l.map((g) => [g.texto, g.papel])), [['Comunicar la medida a la familia', 'COMUNICACION'], ['Comprobar el DNI de quien firma', '']]);
await comprobar('3. la tarea de papel no lleva casilla; la otra, sí', Promise.all([tareas().nth(0).locator('.ash-casilla').count(), tareas().nth(1).locator('.ash-casilla').count()]), [0, 1]);
await comprobar('4. la línea enseña el tipo y los pasos de su recorrido, sin ✓', linea(0), 'COMUNICACION Generado › Firmado › Registrado › Enviado');
await comprobar('5. el icono 📄 va delante', tareas().nth(0).locator('.tp-icono').innerText(), '📄');
await comprobar('6. el botón del paso que toca es «Generar documento»', tareas().nth(0).locator('.tp-boton').innerText().then((t) => t.replace(' ▾', '')), 'Generar documento');
await comprobar('7. el panel dice qué toca y el siguiente paso', panel().then((t) => t.indexOf('Ahora toca: Comunicar la medida a la familia Siguiente paso: Generar documento.') === 0), true);
await comprobar('8. sin plantilla del tipo, el botón abre «Otra plantilla…» y «+ Nueva plantilla…»', (async () => {
  await tareas().nth(0).locator('.tp-boton').click();
  await pagina.waitForTimeout(300);
  const t = await pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')).map((x) => x.textContent));
  await pagina.keyboard.press('Escape');
  return ['Otra plantilla…', '+ Nueva plantilla…'].every((x) => t.indexOf(x) !== -1);
})(), true);

console.log('--- los pasos se marcan solos con su prueba ---');
await pagina.evaluate(async ([k, n]) => {
  const h = (await Hitos.hitosDe(k))[0], g = Hitos.guionDe(null, h)[0];
  await TareaPapel.asignar({ nombre: k }, h, g, { numero: n, nombre: '260101 COMUNICACION ' + n + '.docx', firmas: 0 });
}, [A, 'D26-90001']);
await anotarDoc('D26-90001', 'COMUNICACION');
await repintar();
await comprobar('9. con el documento, «Generado» sale con ✓ y toca «Firmado»', Promise.all([linea(0), tareas().nth(0).locator('.tp-paso.toca').innerText()]), ['COMUNICACION ✓ Generado › Firmado › Registrado › Enviado', 'Firmado']);
await comprobar('10. el botón de generar ya no está (no hay botón de firmar en esta fila)', tareas().nth(0).locator('.tp-boton').count(), 0);
await comprobar('11. el panel dice qué falta', panel().then((t) => /Siguiente paso|Falta: firmado\./.test(t)), true);
await anotarDoc('D26-90001', 'COMUNICACION', { firmas: 1 });
await repintar();
await comprobar('12. con una sola firma, «Firmado» sigue sin salir (el tipo pide dos)', linea(0), 'COMUNICACION ✓ Generado › Firmado › Registrado › Enviado');
await anotarDoc('D26-90001', 'COMUNICACION', { firmas: 2 });
await repintar();
await comprobar('13. con las dos firmas, «Firmado» sale con ✓ y toca «Registrado»', Promise.all([linea(0), tareas().nth(0).locator('.tp-paso.toca').innerText()]), ['COMUNICACION ✓ Generado › ✓ Firmado › Registrado › Enviado', 'Registrado']);
await anotarDoc('D26-90001', 'COMUNICACION', { registros: [{ ano: '26', sentido: 'S', modo: 'M', numero: '1234', codigo: '26SM1234' }] });
await repintar();
await comprobar('14. con el registro, «Registrado» sale con ✓ y toca «Enviado»', Promise.all([linea(0), tareas().nth(0).locator('.tp-paso.toca').innerText()]), ['COMUNICACION ✓ Generado › ✓ Firmado › ✓ Registrado › Enviado', 'Enviado']);
await comprobar('15. sin todos los pasos la tarea no está hecha', hito().then((l) => l[0].hecho), false);

console.log('--- marcar el paso a mano ---');
await tareas().nth(0).locator('.ash-menu-boton').click();
await comprobar('16. el ⋮ ofrece «Marcar el paso a mano» y «Quitar el documento»', pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')).map((x) => x.textContent).filter((t) => /mano|Quitar/.test(t))), ['Marcar el paso a mano', 'Quitar el documento']);
await pagina.locator('.ficha-menu:not(.oculto) .tp-mano-opcion').click();
await pagina.waitForFunction(() => /Listo para cerrar|Ahora toca: Comprobar/.test(document.querySelector('#ficha-guia .ash-panel').innerText), null, { timeout: 8000 });
await comprobar('17. marca solo el paso que tocaba, con quién y qué día', pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; const m = h.guionHecho[Object.keys(h.guionHecho).filter((i) => h.guionHecho[i].papelDoc)[0]].papelDoc.manual; return [Object.keys(m), !!m.enviado.quien || m.enviado.quien === '', /^\d{4}-/.test(m.enviado.cuando)]; }, A), [['enviado'], true, true]);
await comprobar('18. con todos los pasos hechos la tarea queda hecha y el panel pasa a la siguiente', Promise.all([hito().then((l) => l[0].hecho), panel().then((t) => t.indexOf('Ahora toca: Comprobar el DNI de quien firma') === 0)]), [true, true]);
await comprobar('19. la otra tarea sigue con su casilla, sin hacer', hito().then((l) => [l[1].hecho, l[1].papel]), [false, '']);

console.log('--- quitar el documento ---');
await tareas().nth(0).locator('.ash-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .tp-quitar-opcion').click();
await pagina.waitForFunction(() => document.querySelector('#ficha-guia .tp-boton'), null, { timeout: 8000 });
await comprobar('20. «Quitar el documento» suelta el documento y la tarea vuelve a pedirlo, sin borrarlo', Promise.all([
  hito().then((l) => [l[0].doc, l[0].hecho]), pagina.evaluate((k) => !!DocumentosDatos.de(App.E.registro.asuntos[k], 'D26-90001'), A), tareas().nth(0).locator('.tp-boton').innerText().then((t) => t.replace(' ▾', ''))]),
  [['', false], true, 'Generar documento']);
await comprobar('21. el documento soltado no vuelve a unirse solo', (async () => { await repintar(); return hito().then((l) => l[0].doc); })(), '');

console.log('--- un documento que llega por otro camino ---');
await anotarDoc('D26-90002', 'COMUNICACION');
await repintar();
await pagina.waitForTimeout(800);
await comprobar('22. con una sola tarea de ese tipo sin documento, se une solo', hito().then((l) => l[0].doc), 'D26-90002');
await pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; await TareaPapel.anadir({ nombre: k }, h, 'Otra comunicación', 'COMUNICACION'); await TareaPapel.anadir({ nombre: k }, h, 'Otra más', 'COMUNICACION'); }, A);
await anotarDoc('D26-90003', 'COMUNICACION');
await repintar();
await pagina.waitForTimeout(800);
await comprobar('23. con varias tareas del tipo sin documento, se queda sin tarea', hito().then((l) => l.filter((g) => g.doc === 'D26-90003').length), 0);

console.log('--- la firma de la plantilla manda ---');
await comprobar('24. una plantilla con firmante y visto bueno pide 2 firmas, solo firmante 1, sin firmante 0 (vale la del tipo)', pagina.evaluate(() => [TareaPapel.firmasDePlantilla({ firmante: 'Dirección', vistoBueno: 'Secretaría' }), TareaPapel.firmasDePlantilla({ firmante: 'Dirección' }), TareaPapel.firmasDePlantilla({})]), [2, 1, 0]);
await comprobar('25. con 1 firma de la plantilla, un documento con 1 firma da «Firmado» aunque el tipo pida 2', pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k))[0], g = Hitos.guionDe(null, h).filter((x) => x.texto === 'Otra comunicación')[0];
  await TareaPapel.asignar({ nombre: k }, h, g, { numero: 'D26-90004', nombre: '', firmas: 1 });
  await DocumentosDatos.anotar(k, 'D26-90004', { tipo: 'COMUNICACION', fecha: U.hoyIso(), firmas: 1, registros: [], campos: [], texto: '' });
  const h2 = (await Hitos.hitosDe(k))[0], g2 = Hitos.guionDe(null, h2).filter((x) => x.texto === 'Otra comunicación')[0];
  return TareaPapel.estado({ nombre: k }, g2).pasos.map((p) => p.hecho);
}, A), [true, true, false, false]);

console.log('--- el papel en la guía y «Añadir documento» ---');
await comprobar('26. la guía conserva el papel de cada frase', pagina.evaluate(() => GuiasGuion.normalizar([{ id: 'a1', texto: 'Comunicar', papel: 'COMUNICACION' }, { id: 'a2', texto: 'Otra' }]).map((g) => g.papel || '')), ['COMUNICACION', '']);
await comprobar('27. un asunto nuevo recibe el papel de la tarea de la guía', pagina.evaluate(() => AsuntoSinHitosGuia.darTareas({}, [{ id: 'x1', texto: 'Comunicar', papel: 'COMUNICACION' }]) === 1 && (function () { const h = {}; AsuntoSinHitosGuia.darTareas(h, [{ id: 'x1', texto: 'Comunicar', papel: 'COMUNICACION' }]); return h.guionPropio[0].papel; })()), 'COMUNICACION');
await pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k))[0];
  await TareaPapel.anadir({ nombre: k }, h, 'Recibir el DNI', 'DNI');
  window.__abierto = null; Documentos.abrir = async (a, o) => { window.__abierto = o; };
}, A);
await repintar();
await comprobar('28. una tarea de papel que nos llega pide «Recibido» y su botón es «Añadir documento»', (async () => {
  const i = (await hito()).findIndex((g) => g.texto === 'Recibir el DNI');
  return [await linea(i), await tareas().nth(i).locator('.tp-boton').innerText()];
})(), ['DNI Recibido', 'Añadir documento']);
await comprobar('29. «Añadir documento» abre la ventana de Windows directamente', (async () => {
  const i = (await hito()).findIndex((g) => g.texto === 'Recibir el DNI');
  await tareas().nth(i).locator('.tp-boton').click();
  await pagina.waitForTimeout(500);
  return pagina.evaluate(() => window.__abierto && window.__abierto.irDirectoAAnadir);
})(), true);

console.log('--- «Generar documento» con una sola plantilla del tipo ---');
await pagina.evaluate(async (k) => {
  const p = { id: 'pl1', nombre: 'Comunicación de prueba', tipoDocumento: 'COMUNICACION', firmante: 'Dirección', vistoBueno: '' };
  PlantillasDocumento.plantillasDelAsunto = async () => [p];
  window.__generadas = [];
  PlantillasDocumento.generar = async (a, pl, modo, op) => { window.__generadas.push([pl.id, Object.keys(op || {}).length]); await DocumentosDatos.anotar(a.nombre, 'D26-90005', { tipo: 'COMUNICACION', fecha: U.hoyIso(), registros: [], campos: [], texto: '' }); return { nombre: '260101 COMUNICACION D26-90005.docx', numero: 'D26-90005', plantilla: pl }; };
}, A);
await pagina.evaluate(async (k) => {   /* el documento suelto D26-90003 se lo queda «Otra más»; «Tercera» queda sin documento */
  let h = (await Hitos.hitosDe(k))[0];
  await TareaPapel.asignar({ nombre: k }, h, Hitos.guionDe(null, h).filter((x) => x.texto === 'Otra más')[0], { numero: 'D26-90003', nombre: '' });
  await TareaPapel.anadir({ nombre: k }, h, 'Tercera', 'COMUNICACION');
}, A);
await repintar();
const iOtra = (await hito()).findIndex((g) => g.texto === 'Tercera');
await comprobar('32. con una sola plantilla del tipo, el botón la abre directamente (sin menú)', tareas().nth(iOtra).locator('.tp-boton').innerText(), 'Generar documento');
await tareas().nth(iOtra).locator('.tp-boton').click();
await pagina.waitForTimeout(1200);
await comprobar('33. genera con esa plantilla, sin hito ni tarea de por medio', pagina.evaluate(() => window.__generadas), [['pl1', 0]]);
await comprobar('34. el documento queda en la tarea que se pulsó, con la firma de la plantilla (1)', pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; const g = Hitos.guionDe(null, h).filter((x) => x.texto === 'Tercera')[0]; return [g.papelDoc.numero, g.papelDoc.firmas]; }, A), ['D26-90005', 1]);

console.log('--- lo de siempre ---');
await comprobar('30. un asunto con hitos no cambia', pagina.evaluate(async () => { const d = await Hitos.leer(); const k = Object.keys(d.porAsunto).filter((n) => !(d.porAsunto[n].hitos || []).some((h) => h.listaDeTareas))[0]; return !k || !JSON.stringify(d.porAsunto[k]).includes('papelDoc'); }), true);
await comprobar('31. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
