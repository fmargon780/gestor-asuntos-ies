/* Prueba de la fila 162 de docs/COLA.md (docs/ESTADO-SIGUE-A-LOS-HITOS.md),
   con el caso que vio Francisco: cinco hitos, los dos primeros hechos, el
   3 («Puesta a la firma») de Secretaría (sin marca de Administración) y el
   4 («Registro de Salida») en curso y de Administración.

   Primero, con las funciones de verdad en la página (sin pantalla):
   1. El estado es «Paso 3 de 5 · Puesta a la firma», con espera automática
      a Secretaría (antes ganaba el 4, por estar en curso y ser nuestro).
   2. Al marcar el 3, «Paso 4 de 5 · Registro de Salida», sin espera.
   3. Una espera a mano manda sobre la automática, y se quita de un hito
      en cuanto deja de ser el actual (limpiarEsperasViejas).
   Parte de navegador:
   4. La cabecera de la ficha dice «Paso 3 de 5 · Puesta a la firma» y
      «Esperando a Secretaría», sin «Ya ha llegado»; la lista lleva «Paso
      actual» en el 3 y «Saltar a este paso» en los de después; al marcar
      el 3, la cabecera se pone al día sola. */
import { chromium } from 'playwright';
import fs from 'fs';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- parte de navegador ---------- */
const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const ASUNTO = '260924 CERTIFICADO 26-27 Inventada Uno, Eva 9990001';
const GUIAS = { CERTIFICADO: [
  { id: 'h1', titulo: 'Recibir la solicitud', cuerpo: '', opciones: [] },
  { id: 'h2', titulo: 'Confección del Certificado', cuerpo: '', opciones: [] },
  { id: 'h3', titulo: 'Puesta a la firma', cuerpo: '', opciones: [], responsable: 'secretaria' },
  { id: 'h4', titulo: 'Registro de Salida', cuerpo: '', opciones: [] },
  { id: 'h5', titulo: 'Envío del certificado', cuerpo: '', opciones: [] }
] };
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, a1]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
}, [GUIAS, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (a1) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CERTIFICADO', categoria: 'ALUMNADO',
    tercero: 'Inventada Uno, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
/* ---------- las funciones, en la página ---------- */
const r = await pagina.evaluate(() => {
  const H = window.Hitos;
  const ajustes = { responsables: [{ id: 'secretaria', nombre: 'Secretaría', administracion: false },
                                   { id: 'admin', nombre: 'Administración', administracion: true }] };
  function caso() {
    return [
      { id: 'h1', titulo: 'Recibir la solicitud', estado: 'hecho', responsable: 'admin' },
      { id: 'h2', titulo: 'Confección del Certificado', estado: 'hecho', responsable: 'admin' },
      { id: 'h3', titulo: 'Puesta a la firma', estado: 'pendiente', responsable: 'secretaria' },
      { id: 'h4', titulo: 'Registro de Salida', estado: 'encurso', responsable: 'admin' },
      { id: 'h5', titulo: 'Envío del certificado', estado: 'pendiente', responsable: 'admin' }
    ];
  }
  const out = {};
  let l = H.ladoDelAsunto(caso(), ajustes);
  out.uno = [l.texto, l.esperando && l.esperando.nombre, l.esperando && l.esperando.auto, l.lado];
  const marcado = caso(); marcado[2].estado = 'hecho';
  l = H.ladoDelAsunto(marcado, ajustes);
  out.dos = [l.texto, l.esperando, l.lado];
  const aMano = caso(); aMano[2].esperandoA = 'tercero'; aMano[2].esperandoDesde = '2026-09-20';
  l = H.ladoDelAsunto(aMano, ajustes);
  out.tres = [l.esperando.a, !!l.esperando.auto];
  aMano[2].estado = 'hecho';
  H.limpiarEsperasViejas({ ajustes, porAsunto: { X: { hitos: aMano } } });
  out.cuatro = aMano[2].esperandoA === undefined;
  return out;
});
comprobar('1. el primer hito sin terminar, aunque otro esté en curso y sea nuestro; espera automática a Secretaría',
  r.uno, ['Paso 3 de 5 · Puesta a la firma', 'Secretaría', true, 'terceros']);
comprobar('2. al marcar el 3, el 4, sin espera', r.dos, ['Paso 4 de 5 · Registro de Salida', null, 'administracion']);
comprobar('3. la espera a mano manda', r.tres, ['tercero', false]);
comprobar('3. y se quita en cuanto ese hito deja de ser el actual', r.cuatro, true);

await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#ficha-guia .hito[data-id="h5"]', { state: 'attached' });
await pagina.evaluate(async (a1) => {
  await Hitos.cambiar((d) => {
    d.ajustes.responsables = (d.ajustes.responsables || []).filter((r) => r.id !== 'secretaria')
      .concat([{ id: 'secretaria', nombre: 'Secretaría', administracion: false }]);
    return d;
  });
  await Hitos.marcar(a1, 'h1', 'hecho', '');
  await Hitos.marcar(a1, 'h2', 'hecho', '');
  await Hitos.guardarCampos(a1, 'h3', { responsable: 'secretaria' });
  await Hitos.marcar(a1, 'h4', 'encurso', '');
  HitosPanel.programarRepintado();
}, ASUNTO);
await pagina.waitForTimeout(900);
const cabecera = () => pagina.evaluate(() => [
  (document.querySelector('#ficha-estado-hito .marca-hito') || {}).textContent,
  ((document.querySelector('#ficha-estado-hito .marca-esperando') || {}).textContent || '').replace(/ desde el .*$/, ''),
  !!document.querySelector('#ficha-estado-hito .boton-ya-llegado')]);
comprobar('4. la cabecera: el paso 3 y «Esperando a Secretaría», sin «Ya ha llegado»', await cabecera(),
  ['Paso 3 de 5 · Puesta a la firma', 'Esperando a Secretaría', false]);
comprobar('4. «Paso actual» solo en el 3; «Saltar a este paso» en el 4 y el 5',
  await pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .hito')).map((h) =>
    [h.dataset.id, !!h.querySelector(':scope > .hito-linea .etiqueta-paso-actual'), (h.querySelector(':scope > .hito-linea .hito-situar') || {}).textContent || ''])),
  [['h1', false, ''], ['h2', false, ''], ['h3', true, ''], ['h4', false, 'Saltar a este paso'], ['h5', false, 'Saltar a este paso']]);
await pagina.evaluate(async (a1) => { await Hitos.marcar(a1, 'h3', 'hecho', ''); }, ASUNTO);
await pagina.waitForTimeout(800);
comprobar('4. al marcar el 3, la cabecera se pone al día sola', await cabecera(), ['Paso 4 de 5 · Registro de Salida', '', false]);

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
