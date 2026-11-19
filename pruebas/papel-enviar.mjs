/* Prueba de la fila 705 de docs/COLA.md (docs/705-PAPEL-ENVIAR.md): el paso «Enviado» de una tarea de papel.
   «Marcar enviado» (en mano, postal, tablón, iPasen: sin ventana, con quién, día y vía, y la línea del Registro),
   «Corregir el envío» del ⋮, «Enviar correo» (abre el correo a quien dice el recorrido, con el documento adjunto y sin
   plantilla si no hay ninguna; cerrado sin enviar no apunta nada; enviado de verdad apunta el paso solo y no ofrece dejar
   el asunto esperando) y la tarea hecha con todos los pasos. Con Chromium real y los datos inventados (?demo=1&auto=1). */

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

const TIPO = 'PRUEBA PAPEL ENVIAR';
const A = await pagina.evaluate(() => App.E.listaAbiertos[0].nombre);
await pagina.evaluate(async ([tipo, a]) => {
  App.E.tipos.push({ tipo: tipo, categoria: 'ALUMNADO', sinHitos: true });
  await App.guardarTipos();
  if (App.E.tiposDocumento.indexOf('COMUNICACION') === -1) App.E.tiposDocumento.push('COMUNICACION');
  await RecorridoTipo.poner('COMUNICACION', { entra: false, firma: 'Dirección', registro: true, envia: true, aquien: 'Familia', via: 'En mano' });
  await Hitos.cambiar((d) => { delete d.porAsunto[a]; return d; });
  await Hitos.crearDesdeGuia(a, tipo);
}, [TIPO, A]);

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
const hecha = () => pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k))[0]; return Hitos.guionDe(null, h).map((g) => !!g.hecho); }, A);
const enviadoDe = (n) => pagina.evaluate(([k, num]) => { const d = DocumentosDatos.de(App.E.registro.asuntos[k], num); return d && d.enviado ? { a: d.enviado.a, cuando: d.enviado.cuando, via: d.enviado.via, aMano: !!d.enviado.aMano, quien: !!d.enviado.quien } : null; }, [A, n]);
const registro = () => pagina.evaluate((k) => ((App.E.registro.asuntos[k] || {}).notas || []).map((n) => n.texto || ''), A);
async function anotarDoc(numero, datos) {
  await pagina.evaluate(async ([k, n, d]) => { await DocumentosDatos.anotar(k, n, Object.assign({ tipo: 'COMUNICACION', fecha: U.hoyIso(), registros: [], campos: [], texto: '' }, d || {})); }, [A, numero, datos]);
}
const HOY = await pagina.evaluate(() => U.hoyIso());

console.log('--- Marcar enviado ---');
await abrirFicha(A);
for (const t of ['Carta uno', 'Carta dos']) { await pagina.fill('.ash-anadir-texto', t); await pagina.selectOption('.ash-anadir-papel', 'COMUNICACION'); await pagina.click('.ash-anadir-boton'); await pagina.waitForFunction((n) => document.querySelectorAll('#ficha-guia .ash-tarea').length >= n, t === 'Carta uno' ? 1 : 2, { timeout: 8000 }); }
await pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k))[0], l = Hitos.guionDe(null, h);
  await TareaPapel.asignar({ nombre: k }, h, l[0], { numero: 'D26-92001', nombre: 'a.docx', firmas: 1 });
  await TareaPapel.asignar({ nombre: k }, h, l[1], { numero: 'D26-92002', nombre: 'b.docx', firmas: 1 });
}, A);
await anotarDoc('D26-92001', { firmas: 1, registros: [{ ano: 26, sentido: 'S', modo: 'M', numero: 1, codigo: '26SM0001' }] });
await anotarDoc('D26-92002', { firmas: 1, registros: [{ ano: 26, sentido: 'S', modo: 'M', numero: 2, codigo: '26SM0002' }] });
await abrirFicha(A);
await pagina.waitForSelector('#ficha-guia .tp-boton', { timeout: 15000 });
await comprobar('1. con todo hecho menos el envío, el botón es «Marcar enviado» (vía En mano)', tareas().nth(0).locator('.tp-boton').innerText(), 'Marcar enviado');
await comprobar('2. y el panel lo dice', panel().then((t) => t.indexOf('Siguiente paso: Marcar enviado.') !== -1), true);
await tareas().nth(0).locator('.tp-boton').click();
await pagina.waitForFunction(() => document.querySelector('#ficha-guia .ash-tarea .tp-recorrido .tp-paso:last-child.hecho'), null, { timeout: 8000 });
await comprobar('3. «Marcar enviado» no abre ninguna ventana', pagina.evaluate(() => !!document.querySelector('#capa') && document.querySelector('#capa').classList.contains('oculto')), true);
await comprobar('4. «Enviado» queda con ✓ y la tarea, hecha', Promise.all([linea(0), hecha()]), ['COMUNICACION ✓ Generado › ✓ Firmado › ✓ Registrado › ✓ Enviado', [true, false]]);
await comprobar('5. en la ficha del documento queda a quién, el día de hoy, la vía y quién', enviadoDe('D26-92001'), { a: 'la familia', cuando: HOY, via: 'En mano', aMano: true, quien: true });
await comprobar('6. en el Registro queda la línea «Enviado en mano a la familia · quién · día»', registro().then((l) => l.filter((t) => /^Enviado en mano a la familia · .+ · \d{1,2}-[a-z]{3}: Carta uno$/.test(t)).length), 1);

console.log('--- Corregir el envío ---');
await tareas().nth(0).locator('.ash-menu-boton, [aria-haspopup="menu"], .ash-mas').first().click().catch(() => {});
const opciones = await pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .ash-tarea:first-child [role="menuitem"], #ficha-guia .ash-tarea:first-child .menu-opcion, .ficha-menu:not(.oculto) button')).map((b) => b.textContent.trim()));
await comprobar('7. el ⋮ ofrece «Corregir el envío»', opciones.indexOf('Corregir el envío') !== -1, true);
await pagina.locator('.tp-corregir-opcion').first().click();
await pagina.waitForSelector('#pe-dia', { timeout: 5000 });
await pagina.fill('#pe-dia', '2026-11-16');
await pagina.selectOption('#pe-via', 'Tablón');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => !document.querySelector('#capa') || document.querySelector('#capa').classList.contains('oculto'), null, { timeout: 5000 });
await pagina.waitForTimeout(600);
await comprobar('8. el día y la vía quedan corregidos', enviadoDe('D26-92001').then((e) => e && [e.cuando, e.via]), ['2026-11-16', 'Tablón']);
await comprobar('9. y el Registro lo cuenta', registro().then((l) => l.filter((t) => /^Envío corregido: Enviado en el tablón a la familia · .+ · 16-nov: Carta uno$/.test(t)).length), 1);

await comprobar('9b. «a el» se dice «al» (tutor o tutora del grupo)', pagina.evaluate(() => PapelEnviado.linea({ via: 'iPasen', a: 'el tutor o tutora del grupo', quien: 'Ana', cuando: '2026-11-17' })), 'Enviado por iPasen al tutor o tutora del grupo · Ana · 17-nov');

console.log('--- Enviar correo ---');
await pagina.evaluate(async () => { await RecorridoTipo.poner('COMUNICACION', { entra: false, firma: 'Dirección', registro: true, envia: true, aquien: 'Interesado', via: 'Correo electrónico' }); });
await abrirFicha(A);
await comprobar('10. con la vía Correo electrónico, el botón de la segunda tarea es «Enviar correo»', tareas().nth(1).locator('.tp-boton').innerText(), 'Enviar correo');
const FICHERO = '261119 COMUNICACION D26-92002.pdf';
await pagina.evaluate((f) => { const orig = Carpetas.ficheros; Carpetas.ficheros = async function (h) { const r = await orig.apply(this, arguments).catch(() => []); return r.concat([{ nombre: f, handle: null }]); }; window.__origFicheros = orig; }, FICHERO);
await tareas().nth(1).locator('.tp-boton').click();
await pagina.waitForSelector('#correo-formulario', { timeout: 15000 });
await comprobar('11. el correo se abre con el documento de la tarea adjunto', pagina.evaluate((f) => Array.from(document.querySelectorAll('#correo-formulario .adjunto-marca:checked')).map((c) => c.value), FICHERO), [FICHERO]);
await comprobar('12. sin plantilla que adjunte ese papel, no hay plantilla elegida', pagina.evaluate(() => { const s = document.getElementById('correo-plantilla'); return s ? s.value : ''; }), '');
console.log('   (Para: ' + JSON.stringify(await pagina.evaluate(() => CorreoPara.nombres('para'))) + ')');
await comprobar('13. y «Para» lleva solo al interesado, que es a quien dice el recorrido', pagina.evaluate(() => { const n = CorreoPara.nombres('para'), c = CorreoPara.candidatos().filter((x) => x.papel === 'interesado' && !x.sinCorreo).map((x) => x.nombre); return n.length > 0 && n.every((x) => c.indexOf(x) !== -1); }), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.querySelector('#capa').classList.contains('oculto'), null, { timeout: 5000 });
await pagina.waitForTimeout(500);
await comprobar('14. cerrado el correo sin enviar, no se apunta nada', enviadoDe('D26-92002'), null);
await comprobar('15. y la tarea sigue sin hacer', hecha(), [true, false]);

await tareas().nth(1).locator('.tp-boton').click();
await pagina.waitForSelector('#correo-formulario', { timeout: 15000 });
await pagina.evaluate(async (f) => {   /* el correo sale de verdad: lo mismo que hace el cuadro al recibir la confirmación del envío */
  const a = CorreoNucleo._interno.viendo;
  CorreoCuadroNucleo.S.documentosAdjuntados = [f];
  CorreoNucleo.marcarEnvioRealizado();
  await CorreoNucleo.apuntarElRastro(a);
}, FICHERO);
await comprobar('16. enviado de verdad, el documento queda enviado por correo y no «a mano»', enviadoDe('D26-92002').then((e) => e && [e.via, e.aMano, e.quien]), ['Correo electrónico', false, true]);
await comprobar('17. en un asunto lista de tareas no se ofrece «Dejar el asunto esperando a…»', pagina.evaluate(() => !Array.from(document.querySelectorAll('#correo-rastro button')).some((b) => /esperando/i.test(b.textContent))), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.querySelector('#capa').classList.contains('oculto'), null, { timeout: 5000 });
await abrirFicha(A);
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea .tp-boton').length === 0, null, { timeout: 8000 }).catch(() => {});
await comprobar('18. las dos tareas quedan hechas y el panel dice «Listo para cerrar»', Promise.all([hecha(), panel().then((t) => /Listo para cerrar/.test(t))]), [[true, true], true]);

console.log('--- lo de siempre ---');
await comprobar('19. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
