/* Prueba con navegador de la fila 282 de docs/COLA.md (docs/QUITAR-UN-DOCUMENTO-DE-SU-HITO.md):
   quitar un documento de su hito, o pasarlo a otro, desde cualquier sitio (js/hitos-sacar-documento.js).
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1), en el asunto de
   Aguilar Ponce, Marina (MATRICULA): sus dos primeros hitos llevan una tarea de «reunir un documento».
   1-6: la lógica (la tarea se queda marcada, «Desmarcar», mover, asociar, dos hitos, gemelos);
   7: «Mover a otro hito» de la barra de marcados; 8: los menús de la mesa y de la ficha. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1600, height: 1000 } });
const pagina = await contexto.newPage();
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 30000 });
await pagina.waitForTimeout(3000);
await pagina.evaluate(async () => {
  window.__avisos = [];
  const o = U.aviso;
  U.aviso = function (m, t, accion) { window.__avisos.push(String(m) + '|' + t + '|' + (accion && accion.boton ? accion.boton : '')); window.__accion = accion || null; return o.apply(this, arguments); };
  const a = App.E.listaAbiertos.filter((x) => /Aguilar Ponce, Marina/.test(x.nombre))[0];
  for (const n of ['prueba uno.pdf', 'prueba uno.docx', 'prueba dos.pdf']) await Carpetas.escribirBytes(a.handle, n, new TextEncoder().encode('x'), 'application/octet-stream');
  window.__h = {
    a: () => App.E.listaAbiertos.filter((x) => /Aguilar Ponce, Marina/.test(x.nombre))[0],
    hitos: async () => Hitos.visibles(await Hitos.hitosDe(window.__h.a().nombre)),
    docs: async () => (await window.__h.hitos()).map((h) => h.documentos.slice().sort()),
    tarea: async (i) => { const hs = await window.__h.hitos(); const g = Hitos.guionDe(window.__h.a(), hs[i]).filter((x) => x.reunir === 'documento')[0]; return g ? [g.hecho, g.documento] : null; },
    limpiar: async () => {
      const A = window.__h.a();
      for (const h of await window.__h.hitos()) {
        for (const d of h.documentos.slice()) { await Hitos.quitarDocumento(A.nombre, h.id, d); try { await HitosRequisitos.desmarcarPorDocumento(A.nombre, h.id, d); } catch (e) { /* ya sin marca */ } }
      }
      window.__avisos = [];
    }
  };
});
const H = (f, ...args) => pagina.evaluate(([nombre, a]) => window.__h[nombre](...a), [f, args]);
const avisos = () => pagina.evaluate(() => window.__avisos.slice());
const anadir = (i, d, marcar) => pagina.evaluate(async ([i, d, marcar]) => {
  const A = window.__h.a(), hs = await window.__h.hitos();
  await Hitos.anadirDocumento(A.nombre, hs[i].id, d);
  if (marcar) await HitosRequisitos.marcarPorDocumento(A.nombre, hs[i].id, d);
}, [i, d, marcar]);
const quitar = (nombres) => pagina.evaluate((n) => HitosSacarDocumento.quitar(window.__h.a(), n).then((r) => ({ quitados: r.quitados, tareas: r.tareas.length })), nombres);
const mover = (nombres, i) => pagina.evaluate(async ([n, i]) => { const hs = await window.__h.hitos(); return HitosSacarDocumento.mover(window.__h.a(), n, hs[i]).then((r) => ({ movidos: r.movidos, asociados: r.asociados, tareas: r.tareas.length })); }, [nombres, i]);
const UNO = 'prueba uno.pdf', UNO_W = 'prueba uno.docx', DOS = 'prueba dos.pdf';

console.log('--- 1. quitar: la tarea se queda marcada, con su aviso ---');
await anadir(1, UNO, true);
await comprobar('1. antes: está en el hito 2 y su tarea de reunir, marcada con él', [(await H('docs'))[1], await H('tarea', 1)], [[UNO], [true, UNO]]);
await comprobar('1. «quitar» lo deja sin hito y devuelve esa tarea', quitar([UNO]), { quitados: 1, tareas: 1 });
await comprobar('1. no está en ningún hito y la tarea sigue marcada', [(await H('docs')).flat(), await H('tarea', 1)], [[], [true, UNO]]);
await comprobar('1. el aviso verde lo dice y lleva «Desmarcar»', (await avisos()).slice(-1), ['Quitado del hito. La tarea «Reunir el libro de familia» sigue marcada.|bueno|Desmarcar']);

console.log('--- 2. «Desmarcar» ---');
await pagina.evaluate(() => window.__accion.alPulsar());
await pagina.waitForTimeout(500);
await comprobar('2. la tarea queda sin marcar', H('tarea', 1), [false, '']);
await H('limpiar');

console.log('--- 3. mover del hito 2 al 1 ---');
await anadir(1, UNO, true);
await comprobar('3. «mover» lo deja solo en el hito 1', mover([UNO], 0), { movidos: 1, asociados: 0, tareas: 1 });
await comprobar('3. está solo en el 1, la tarea del 2 sigue marcada y la del 1 se marca', [await H('docs').then((d) => d.map((x) => x.length)), await H('tarea', 1), await H('tarea', 0)], [[1, 0, 0], [true, UNO], [true, UNO]]);
await comprobar('3. aviso: «Movido a…» con la tarea de antes y «Desmarcar»', (await avisos()).filter((a) => /^Movido/.test(a)).slice(-1), ['Movido a «1 · Recibir la solicitud». En el hito de antes, la tarea «Reunir el libro de familia» sigue marcada.|bueno|Desmarcar']);
await H('limpiar');

console.log('--- 4. sin hito: se asocia ---');
await comprobar('4. «mover» a un documento sin hito lo asocia, sin tarea de antes', mover([DOS], 0), { movidos: 0, asociados: 1, tareas: 0 });
await comprobar('4. aviso «Asociado a…»', (await avisos()).filter((a) => /^Asociado/.test(a)).slice(-1), ['Asociado a «1 · Recibir la solicitud».|bueno|']);
await comprobar('4. y si ya estaba solo ahí, no hace nada', [(await mover([DOS], 0)), (await H('docs'))[0]], [{ movidos: 0, asociados: 0, tareas: 0 }, [DOS]]);
await H('limpiar');

console.log('--- 5. un documento en dos hitos ---');
await anadir(0, UNO, false); await anadir(1, UNO, false);
await comprobar('5. «quitar» lo saca de los dos', [(await quitar([UNO])).quitados, (await H('docs')).flat()], [1, []]);
await anadir(0, UNO, false); await anadir(1, UNO, false);
await mover([UNO], 1);
await comprobar('5. «mover» al hito 2 lo deja solo en el 2', (await H('docs')).map((x) => x.length), [0, 1, 0]);
await H('limpiar');

console.log('--- 6. los gemelos salen y se mueven juntos ---');
await anadir(0, UNO, false); await anadir(0, UNO_W, false);
await quitar([UNO]);
await comprobar('6. «quitar» el PDF quita también su Word apuntado', (await H('docs')).flat(), []);
await anadir(0, UNO, false); await anadir(0, UNO_W, false);
await mover([UNO], 1);
await comprobar('6. «mover» el PDF mueve también su Word', (await H('docs')).map((x) => x.slice()), [[], [UNO_W, UNO].sort(), []]);
await H('limpiar');

console.log('--- 7. la barra de marcados de la mesa ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.locator('#inicio-tabla-cuerpo .nombre-pulsable', { hasText: 'Aguilar Ponce, Marina' }).first().click();
await pagina.waitForSelector('#ficha-documentos', { state: 'attached' });
await pagina.waitForTimeout(1500);
/* Marcar la única tarea de un hito puede ofrecer «Este hito ya está completo»: se cierra. */
const cerrarCuadro = async () => { await pagina.waitForTimeout(600); if (await pagina.locator('#capa:not(.oculto)').count()) { await pagina.click('#cuadro-cancelar'); await pagina.waitForTimeout(300); } };
const abrirMesa = async (i) => {
  await pagina.evaluate(async (i) => { const hs = await window.__h.hitos(); HitoMesa.abrir(window.__h.a(), hs[i].id); }, i);
  await pagina.waitForTimeout(800);
  await pagina.evaluate(() => HitoMesa.abrirTarjeta('documentos'));
  await pagina.waitForSelector('.hito-en-mesa .mesa-docs-apartado', { timeout: 10000 });
  await cerrarCuadro();
};
await anadir(1, UNO, false);
await abrirMesa(0);
await comprobar('7. en la mesa del hito 1, «uno» sale en «De otros hitos» y «dos» en «sin hito»', pagina.evaluate((n) => ({
  otros: Array.from(document.querySelectorAll('.hito-en-mesa .mesa-doc-ajeno')).filter((f) => f.dataset.hitoOrigen).map((f) => f.dataset.doc),
  sueltos: Array.from(document.querySelectorAll('.hito-en-mesa .mesa-doc-ajeno')).filter((f) => !f.dataset.hitoOrigen).map((f) => f.dataset.doc).filter((d) => d === n) }), DOS),
  { otros: [UNO], sueltos: [DOS] });
await pagina.locator('.hito-en-mesa .mesa-doc-ajeno', { hasText: UNO }).locator('.mesa-doc-marca').check();
await pagina.click('.hito-en-mesa .mesa-sel-mover');
await pagina.waitForSelector('#mesa-mover-destino');
await comprobar('7. el desplegable lleva, el primero, «Este hito (…)»', pagina.locator('#mesa-mover-destino option').first().textContent(), 'Este hito (1 · Recibir la solicitud)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('7. el documento queda en un solo hito (el 1)', (await H('docs')).map((x) => x.length), [1, 0, 0]);
await H('limpiar');

console.log('--- 8. los menús de la mesa y de la ficha ---');
await anadir(1, UNO, true);
await abrirMesa(0);
const ajeno = pagina.locator('.hito-en-mesa .mesa-doc-ajeno', { hasText: UNO }).first();
await comprobar('8. la fila «De otros hitos» lleva «Abrir», «Enviar ▾» y «⋯»', ajeno.evaluate((f) => Array.from(f.querySelectorAll('.mesa-doc-acciones button')).filter((b) => !b.closest('.ficha-menu')).map((b) => b.textContent)), ['Abrir', 'Enviar ▾', '⋯']);
await cerrarCuadro();
await ajeno.locator('.mesa-doc-menu-ajeno').click();
await comprobar('8. «⋯»: «Traer a este hito» y «Quitar de su hito»', pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(), ['Traer a este hito', 'Quitar de su hito']);
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Quitar de su hito' }).click();
await pagina.waitForTimeout(1200);
await comprobar('8. «Quitar de su hito»: avisa, deja la tarea marcada y el documento pasa a «sin hito»', [(await avisos()).slice(-1)[0], await H('tarea', 1),
  await pagina.locator('.hito-en-mesa .mesa-doc-ajeno', { hasText: UNO }).first().getAttribute('data-hito-origen')],
  ['Quitado del hito. La tarea «Reunir el libro de familia» sigue marcada.|bueno|Desmarcar', [true, UNO], '']);
const suelto = pagina.locator('.hito-en-mesa .mesa-doc-ajeno', { hasText: UNO }).first();
await suelto.locator('.mesa-doc-menu-ajeno').click();
await comprobar('8. en «sin hito», el «⋯» solo trae «Traer a este hito»', pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(), ['Traer a este hito']);
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').click();
await pagina.waitForTimeout(1200);
await cerrarCuadro();
await comprobar('8. «Traer a este hito»: «Asociado a…» y sube a los documentos del hito', [(await avisos()).slice(-2)[0].startsWith('Marcado') || (await avisos()).some((a) => /^Asociado a «1 · Recibir la solicitud»\.\|bueno\|$/.test(a)), (await H('docs'))[0]], [true, [UNO]]);
await comprobar('8. en la ficha, «Asociar a un hito» lleva «Quitar del hito», una raya y los hitos, sin «Ninguno»', pagina.evaluate(async () => {
  FichaTarjetas.abrir('documentos');
  const fila = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).filter((f) => f.textContent.indexOf('prueba uno.pdf') !== -1)[0];
  fila.querySelector('.ficha-documento-asociar').click();
  const menu = fila.querySelector('.ficha-menu:not(.oculto)');
  return Array.from(menu.children).map((x) => x.tagName === 'HR' ? '—' : x.textContent);
}).then((l) => [l[0], l[1], l.some((t) => /Ninguno/.test(t)), l.slice(2).map((t) => t.replace(/^✓ /, ''))]), ['Quitar del hito', '—', false, ['Recibir la solicitud', 'Comprobar la documentación', 'Registrar la matrícula en Séneca']]);
await pagina.keyboard.press('Escape');
await pagina.evaluate(async () => { const f = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).filter((x) => x.textContent.indexOf('prueba uno.pdf') !== -1)[0]; f.querySelector('.ficha-documento-asociar').click(); });
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Quitar del hito' }).click();
await pagina.waitForTimeout(1200);
await comprobar('8. «Quitar del hito» desde la ficha: avisa y no queda en ninguno', [(await avisos()).slice(-1)[0].split('|')[0].startsWith('Quitado del hito.'), (await H('docs')).flat()], [true, []]);
await pagina.evaluate(async () => { const f = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).filter((x) => x.textContent.indexOf('prueba uno.pdf') !== -1)[0]; f.querySelector('.ficha-documento-asociar').click(); });
await comprobar('8. sin hito, el menú de la ficha solo trae los hitos', pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').allTextContents(), ['Recibir la solicitud', 'Comprobar la documentación', 'Registrar la matrícula en Séneca']);
await pagina.keyboard.press('Escape');
await H('limpiar');

console.log('--- 9. en modo consulta, las filas ajenas no llevan «⋯» ---');
await anadir(1, UNO, false);
await pagina.evaluate(() => SoloConsulta.guardar(true));
await pagina.evaluate(() => HitosPanel.programarRepintado());
await pagina.waitForTimeout(800);
await pagina.evaluate(async () => { const hs = await window.__h.hitos(); HitoMesa.abrir(window.__h.a(), hs[0].id); });
await pagina.waitForTimeout(1200);
await pagina.evaluate(() => HitoMesa.abrirTarjeta('documentos'));
await comprobar('9. las filas «De otros hitos» y «sin hito» no llevan «⋯»', pagina.locator('.hito-en-mesa .mesa-doc-menu-ajeno').count(), 0);
await pagina.evaluate(() => SoloConsulta.guardar(false));

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? fallos + ' fallos' : 'todo bien');
process.exit(fallos ? 1 : 0);
