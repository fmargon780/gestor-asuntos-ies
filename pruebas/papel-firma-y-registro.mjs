/* Prueba de la fila 704 de docs/COLA.md (docs/704-PAPEL-FIRMA-Y-REGISTRO.md): poner a la firma y registrar un papel.
   Elegir el papel al añadir y en la guía, la línea con el recorrido y sin casilla, «Generar documento» y «Añadir documento»,
   los pasos que se marcan solos con la prueba del documento (generado, firmado, registrado), «Marcar el paso a mano»,
   la firma que manda en la plantilla, «Quitar el documento», la unión de un documento que llega por otro camino y la tarea
   hecha con todos los pasos. Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). 
   «Poner a la firma» (espera con el día propuesto), el número de días de Ajustes, el fin de la espera con el PDF firmado,
   «Registrar» (ruta copiada, «Falta el sellado», el asunto sigue en Administración), el sellado, dos papeles a la vez y la
   espera vencida. Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). */

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

const TIPO = 'PRUEBA PAPEL A LA FIRMA';
const A = await pagina.evaluate(() => App.E.listaAbiertos[0].nombre);
await pagina.evaluate(async ([tipo, a]) => {
  App.E.tipos.push({ tipo: tipo, categoria: 'ALUMNADO', sinHitos: true });
  await App.guardarTipos();
  for (const t of ['COMUNICACION', 'DNI']) if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t);
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


async function inicio(p) { await pagina.evaluate(async (x) => { App.ir('abiertos'); InicioTabla.cambiar(x); await InicioTabla.pintar(); }, p); await pagina.waitForTimeout(500); }
const textoFila = async (p) => { await inicio(p); const f = pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + A + '"]'); return (await f.count()) ? (await f.innerText()).replace(/\s+/g, ' ').trim() : null; };
const espera = () => pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; return Hitos.guionDe(null, h).map((g) => g.espera ? [g.texto, g.espera.paso, g.espera.nombre, g.espera.volver] : null); }, A);
const sello = () => pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; return Hitos.guionDe(null, h).map((g) => !!(g.papelDoc && g.papelDoc.pideSello)); }, A);
const aceptarSiHay = async () => { await pagina.waitForTimeout(300); };

console.log('--- poner a la firma ---');
await abrirFicha(A);
for (const t of ['Carta uno', 'Carta dos']) { await pagina.fill('.ash-anadir-texto', t); await pagina.selectOption('.ash-anadir-papel', 'COMUNICACION'); await pagina.click('.ash-anadir-boton'); await pagina.waitForFunction((n) => document.querySelectorAll('#ficha-guia .ash-tarea').length >= n, t === 'Carta uno' ? 1 : 2, { timeout: 8000 }); }
await pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k))[0], l = Hitos.guionDe(null, h);
  await TareaPapel.asignar({ nombre: k }, h, l[0], { numero: 'D26-91001', nombre: 'a.docx' });
  await TareaPapel.asignar({ nombre: k }, h, l[1], { numero: 'D26-91002', nombre: 'b.docx' });
  for (const n of ['D26-91001', 'D26-91002']) await DocumentosDatos.anotar(k, n, { tipo: 'COMUNICACION', fecha: U.hoyIso(), registros: [], campos: [], texto: '' });
}, A);
await abrirFicha(A);
await comprobar('1. con el documento generado, el botón es «Poner a la firma»', tareas().nth(0).locator('.tp-boton').innerText(), 'Poner a la firma');
await comprobar('2. el día propuesto es hoy más los días hábiles de Ajustes (1) y el número nace en 1', pagina.evaluate(async () => [(await Hitos.leer()).ajustes.diasFirma, TareaPapel.diaPropuesto() === Plazos.sumarPlazo(U.hoyIso(), 1, 'habiles', (await Hitos.leer()).ajustes.festivos, (await Hitos.leer()).ajustes.noLectivos)]), [1, true]);
await comprobar('3. el día propuesto salta fin de semana y festivos', pagina.evaluate(() => [Plazos.sumarPlazo('2026-11-20', 1, 'habiles', [], []), Plazos.sumarPlazo('2026-11-20', 1, 'habiles', ['2026-11-23'], [])]), ['2026-11-23', '2026-11-24']);
await pagina.evaluate(() => Hitos.guardarDiasFirma(3));
await comprobar('4. cambiando el número en Ajustes, el día propuesto cambia', pagina.evaluate(async () => { const d = await Hitos.leer(); return TareaPapel.diaPropuesto() === Plazos.sumarPlazo(U.hoyIso(), 3, 'habiles', d.ajustes.festivos, d.ajustes.noLectivos) && d.ajustes.diasFirma === 3; }), true);
await pagina.evaluate(() => Hitos.guardarDiasFirma(1));
await comprobar('5. el número se ve y se guarda en Ajustes › El centro › «Calendario y responsables»', (async () => {
  await pagina.evaluate(() => { App.ir('ajustes'); });
  await pagina.waitForSelector('#hitos-dias-firma', { state: 'attached', timeout: 10000 });
  await pagina.waitForTimeout(600);
  const v = await pagina.evaluate(() => document.getElementById('hitos-dias-firma').value);
  await pagina.evaluate(() => { const c = document.getElementById('hitos-dias-firma'); c.value = '2'; document.getElementById('btn-guardar-dias-firma').click(); });
  await pagina.waitForTimeout(800);
  const g = await pagina.evaluate(async () => (await Hitos.leer()).ajustes.diasFirma);
  await pagina.evaluate(() => Hitos.guardarDiasFirma(1));
  return [v, g, await pagina.evaluate(() => /Días hábiles para volver a mirar un documento puesto a la firma/.test(document.getElementById('bloque-hitos').innerText))];
})(), ['1', 2, true]);
await abrirFicha(A);
await tareas().nth(0).locator('.tp-boton').click();
await pagina.waitForSelector('#ficha-guia .ash-espera', { timeout: 8000 });
const DIA = await pagina.evaluate(() => TareaPapel.diaPropuesto());
await comprobar('6. «Poner a la firma» deja la tarea esperando a quien firma, con el día propuesto', espera().then((l) => l[0]), ['Carta uno', 'firmado', 'Secretaría y Dirección', DIA]);
await comprobar('7. el paso dice «A la firma» y toca', tareas().nth(0).locator('.tp-paso.toca').innerText(), 'A la firma');
await comprobar('8. bajo la tarea: a la firma de quién, desde cuándo y cuándo volver; sin «Ya ha llegado» ni cambiar a quién', Promise.all([
  tareas().nth(0).locator('.ash-espera-texto').innerText().then((t) => /^A la firma de Secretaría y Dirección desde el \d+-\w{3} · volver a mirarlo el \d+-\w{3}$/.test(t.replace(/\s+/g, ' ').trim())),
  tareas().nth(0).locator('.ash-espera button').allTextContents()]), [true, ['Cambiar el día', 'Dejar de esperar']]);
await comprobar('9. el panel dice a quién espera', panel().then((t) => /^A la firma de Secretaría y Dirección · volver a mirarlo el/.test(t)), true);
await comprobar('10. el asunto está en «En espera»', textoFila('esp').then((t) => !!t && /Esperando a Secretaría y Dirección/.test(t)), true);
await comprobar('11. y no en «En Administración»', textoFila('adm'), null);

console.log('--- llega el PDF firmado ---');
await pagina.evaluate((k) => DocumentosDatos.anotar(k, 'D26-91002', { tipo: 'COMUNICACION', fecha: U.hoyIso(), firmas: 2, registros: [], campos: [], texto: '' }), A);
await abrirFicha(A);
await pagina.waitForTimeout(800);
await comprobar('12. con dos papeles, el firmado de uno no toca al otro: la espera de «Carta uno» sigue', espera().then((l) => [!!l[0], !!l[1]]), [true, false]);
await comprobar('13. «Carta dos» marca «Firmado» con su documento', linea(1), 'COMUNICACION ✓ Generado › ✓ Firmado › Registrado › Enviado');
await pagina.evaluate((k) => DocumentosDatos.anotar(k, 'D26-91001', { tipo: 'COMUNICACION', fecha: U.hoyIso(), firmas: 2, registros: [], campos: [], texto: '' }), A);
await abrirFicha(A);
await pagina.waitForTimeout(800);
await comprobar('14. al guardar el PDF firmado, «Firmado» se marca y la espera desaparece', Promise.all([espera().then((l) => !l[0]), linea(0)]), [true, 'COMUNICACION ✓ Generado › ✓ Firmado › Registrado › Enviado']);
await comprobar('15. el asunto vuelve a «En Administración»', textoFila('adm').then((t) => !!t), true);

console.log('--- registrar ---');
await pagina.evaluate(() => {
  window.__rutas = [];
  Carpetas.ficheros = async () => [{ nombre: '261118 COMUNICACION D26-91001.docx' }, { nombre: '261118 COMUNICACION D26-91001.pdf' }];
  RutaCarpetas.botonDocumento = (a, modo, doc) => ({ click: () => window.__rutas.push(doc.nombre) });
});
await abrirFicha(A);
await comprobar('16. el botón del paso que toca es «Registrar»', tareas().nth(0).locator('.tp-boton').innerText(), 'Registrar');
await tareas().nth(0).locator('.tp-boton').click();
await pagina.waitForFunction(() => document.querySelector('#ficha-guia .tp-paso.toca') && /Falta el sellado/.test(document.querySelector('#ficha-guia .tp-paso.toca').innerText), null, { timeout: 8000 });
await comprobar('17. copia la ruta del PDF del documento, como «Ruta»', pagina.evaluate(() => window.__rutas), ['261118 COMUNICACION D26-91001.pdf']);
await comprobar('18. el paso dice «Falta el sellado» y la tarea ya no ofrece «Registrar»', Promise.all([tareas().nth(0).locator('.tp-paso.toca').innerText(), tareas().nth(0).locator('.tp-boton').count()]), ['Falta el sellado', 0]);
await comprobar('19. el panel dice «Falta guardar el PDF sellado.»', panel().then((t) => t.indexOf('Falta guardar el PDF sellado.') !== -1), true);
await comprobar('20. el asunto sigue en «En Administración»', textoFila('adm').then((t) => !!t), true);
await pagina.evaluate((k) => DocumentosDatos.anotar(k, 'D26-91001', { tipo: 'COMUNICACION', fecha: U.hoyIso(), firmas: 2, registros: [{ ano: '26', sentido: 'S', modo: 'M', numero: '77', codigo: '26SM0077' }], campos: [], texto: '' }), A);
await abrirFicha(A);
await comprobar('21. al guardar el PDF sellado, «Registrado» se marca solo', linea(0), 'COMUNICACION ✓ Generado › ✓ Firmado › ✓ Registrado › Enviado');

console.log('--- la espera vence ---');
await pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0], g = Hitos.guionDe(null, h)[0]; await TareaPapel.marcarAMano({ nombre: k }, h, g); await TareaPapel.sincronizar({ nombre: k }, h); }, A);   /* «Carta uno» queda hecha: la que toca es «Carta dos» */
await pagina.evaluate(async ([k, hoy]) => { const h = (await Hitos.hitosDe(k))[0], g = Hitos.guionDe(null, h)[1]; await TareaPapel.asignar({ nombre: k }, h, g, { numero: 'D26-91003', nombre: '' }); await DocumentosDatos.anotar(k, 'D26-91003', { tipo: 'COMUNICACION', fecha: U.hoyIso(), registros: [], campos: [], texto: '' }); await Hitos.cambiar((d) => { const x = Hitos.buscar(d.porAsunto[k].hitos, h.id); x.guionHecho[g.id].espera = { quien: 'firma', nombre: 'Dirección', paso: 'firmado', desde: hoy, volver: hoy }; return d; }); }, [A, HOY]);
await abrirFicha(A);
await comprobar('22. con el día llegado, el panel manda reclamar la firma', panel().then((t) => t.indexOf('Toca volver a mirar la firma: Carta dos') === 0), true);
await comprobar('23. y Inicio dice «Reclamar a Dirección»', textoFila('adm').then((t) => !!t && /Reclamar a Dirección/.test(t)), true);
await comprobar('24. «Cambiar el día» pasa a «Seguir esperando…» y no hay «Ya ha llegado»', tareas().nth(1).locator('.ash-espera button').allTextContents(), ['Seguir esperando…', 'Dejar de esperar']);

console.log('--- lo de siempre ---');
await comprobar('25. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
