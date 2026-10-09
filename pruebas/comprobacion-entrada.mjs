/* Prueba en navegador de verdad de «Comprobación al entrar» (29-sep-2026,
   fila 204, docs/COMPROBACION-AL-ENTRAR.md).

     1. Falta casi todo: al entrar sale solo el panel, con una fila por
        cosa; la marca de la barra lateral pasa a ámbar/roja con el
        número; «Arreglarlo» cierra el panel y deja a la vista el bloque
        de Ajustes donde se configura.
     2. «No lo uso en este ordenador» aparta la cosa (y se guarda);
        «Volver a revisarla» la devuelve.
     3. Todo bien (lo que no se usa, omitido): marca verde y ninguna
        fila en rojo.
     4. Una comprobación que no se puede hacer sale en gris con el
        motivo, y cuenta como «falta algo».

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => { window.__COMPROBACION_ABRIR_PANEL__ = true; });
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= 1. FALTA CASI TODO ================= */

console.log('--- 1. falta casi todo: sale el panel solo ---');
await pagina.waitForSelector('#capa:not(.oculto)', { timeout: 10000 });
await comprobar('el panel se titula «Comprobación al entrar»', pagina.locator('#cuadro-titulo').textContent(), 'Comprobación al entrar');
await comprobar('hay una fila por cosa (once en la web: sin la de la copia; la 239 añade los nombres cortos y el largo de las rutas; la 312, el Centro de datos)', pagina.locator('.comprobacion-fila').count(), 11);
await comprobar('la de carpetas está bien', pagina.locator('.comprobacion-fila[data-id="carpetas"]').textContent().then((t) => /Bien/.test(t)), true);
await comprobar('la de la bandeja falta', pagina.locator('.comprobacion-fila[data-id="bandeja"]').textContent().then((t) => /Falta/.test(t) && /Arreglarlo/.test(t)), true);
await comprobar('el botón de cerrar dice «Ahora no»', pagina.locator('#cuadro-cancelar').textContent(), 'Ahora no');
const faltan = await pagina.locator('.comprobacion-fila:has-text("Falta")').count();
await comprobar('la marca cuenta lo que falta', pagina.locator('#comprobacion-marca').textContent(), '⚠ ' + faltan + ' por configurar');

console.log('--- «Arreglarlo» de los festivos deja el bloque Hitos abierto (fila 204, revisor 2) ---');
await pagina.click('.comprobacion-fila[data-id="centro-festivos"] [data-arreglar]');
await pagina.waitForSelector('#capa.oculto', { state: 'attached' });
await pagina.waitForTimeout(2500);
await comprobar('el bloque Hitos sigue abierto tras asentarse la pantalla',
  pagina.evaluate(() => { const d = document.getElementById('bloque-hitos'); return !!d && d.open; }), true);
await comprobar('y los festivos están a la vista', pagina.locator('#hitos-festivos').isVisible(), true);

await pagina.click('#comprobacion-marca');
await pagina.waitForSelector('#capa:not(.oculto)');

console.log('--- «Arreglarlo» lleva al bloque de Ajustes ---');
await pagina.click('.comprobacion-fila[data-id="bandeja"] [data-arreglar]');
await pagina.waitForSelector('#capa.oculto', { state: 'attached' });
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await pagina.waitForFunction(() => { const e = document.querySelector('#estado-bandeja'); const d = e && e.closest('details'); return d && d.open; });
await comprobar('Ajustes, con el bloque de la bandeja abierto', pagina.locator('#estado-bandeja').isVisible(), true);
await comprobar('el cuadro se ha cerrado', pagina.locator('#capa').isHidden(), true);

/* ================= 2. «NO LO USO EN ESTE ORDENADOR» ================= */

console.log('--- 2. «No lo uso en este ordenador» ---');
await pagina.click('#comprobacion-marca');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('.comprobacion-fila[data-id="bandeja"] [data-omitir]');
await pagina.waitForFunction(() => /No se usa aquí/.test((document.querySelector('.comprobacion-fila[data-id="bandeja"]') || {}).textContent || ''));
await comprobar('la fila sale como «No se usa aquí»', pagina.locator('.comprobacion-fila[data-id="bandeja"] .comprobacion-estado').textContent(), 'No se usa aquí');
await comprobar('se guarda en este ordenador',
  pagina.evaluate(() => JSON.parse(localStorage.getItem('gestor-comprobacion-omitidas'))), ['bandeja']);
await comprobar('la marca ya cuenta una menos', pagina.locator('#comprobacion-marca').textContent(), '⚠ ' + (faltan - 1) + ' por configurar');
await pagina.click('.comprobacion-fila[data-id="bandeja"] [data-revisar]');
await pagina.waitForFunction(() => /Falta/.test((document.querySelector('.comprobacion-fila[data-id="bandeja"]') || {}).textContent || ''));
await comprobar('«Volver a revisarla» la devuelve', pagina.evaluate(() => localStorage.getItem('gestor-comprobacion-omitidas')), '[]');
await pagina.click('#cuadro-cancelar');
await comprobar('«Ahora no» cierra', pagina.locator('#capa').isHidden(), true);
await comprobar('y el botón vuelve a decir «Cancelar»', pagina.locator('#cuadro-cancelar').textContent(), 'Cancelar');

/* ================= 3. TODO BIEN ================= */

console.log('--- 3. todo bien: marca verde ---');
await pagina.evaluate(async () => {
  const hoy = new Date();
  const ano = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  async function escribir(n, o) { const h = await g.getFileHandle(n, { create: true }); const w = await h.createWritable(); await w.write(JSON.stringify(o)); await w.close(); }
  await escribir('plantillas.json', { centro: 'IES Prueba', codigo: '23000000', localidad: 'Lucena', direccion: 'C/ Uno 1', provincia: 'Córdoba' });
  await escribir('cargos.json', { version: 1, cargos: [
    { id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'El Director', ocupantes: [{ persona: 'Ana Pérez', desde: '2000-01-01' }] },
    { id: 'secretaria', nombre: 'Secretaría', orden: 4, tratamiento: 'El Secretario', ocupantes: [{ persona: 'Luis Gil', desde: '2000-01-01' }] }
  ] });
  await escribir('hitos.json', { ajustes: { festivos: [ano + '-12-06'] }, porAsunto: {} });
  localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\yo\\Dropbox');
  localStorage.setItem('gestor-ruta-abiertos', 'C:\\Users\\yo\\Dropbox\\A\\ASUNTOS ABIERTOS');
  localStorage.setItem('gestor-ruta-archivo', 'C:\\Users\\yo\\Dropbox\\A\\ARCHIVO');
  localStorage.setItem('gestor-envio-correo', 'https://script.google.com/macros/s/AKfycbx/exec?k=abc');
  const bandeja = await window.__disco.abiertos.getDirectoryHandle('BANDEJA', { create: true });
  bandeja.values = async function* () { for (const par of bandeja._hijos) yield par[1]; };
  await Almacen.guardar('bandeja', bandeja);
  ComprobacionEntrada.omitir('alumnado');
  ComprobacionEntrada.omitir('centro-de-datos');   /* fila 312: este ordenador no usa el Centro de datos */
});
await pagina.evaluate(() => ComprobacionEntrada.comprobar());
const filas = await pagina.evaluate(() => ComprobacionEntrada.filas().map((f) => f.id + ':' + f.estado));
console.log('   ' + filas.join(' '));
await comprobar('ninguna falta', filas.filter((f) => /:(falta|sin-comprobar)$/.test(f)), []);
await comprobar('la marca dice «✓ Todo configurado»', pagina.locator('#comprobacion-marca').textContent(), '✓ Todo configurado');
await pagina.click('#comprobacion-marca');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('pulsarla abre el panel con todo en verde',
  pagina.locator('.comprobacion-fila:not(.comprobacion-bien):not(.comprobacion-omitida)').count(), 0);
await pagina.click('#cuadro-cancelar');

/* ================= 4. NO SE PUEDE COMPROBAR ================= */

console.log('--- 4. una cosa que no se puede comprobar sale en gris con el motivo ---');
await pagina.evaluate(() => { Plantillas.cargar = async function () { throw new Error('no se puede leer el fichero'); }; });
await pagina.evaluate(() => ComprobacionEntrada.comprobar());
await comprobar('la marca cuenta como «falta algo»', pagina.locator('#comprobacion-marca').textContent(), '⚠ 1 por configurar');
await pagina.click('#comprobacion-marca');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('la fila sale gris con el motivo',
  pagina.locator('.comprobacion-fila[data-id="centro-datos"] .comprobacion-texto').textContent(),
  'Datos del centro Sin comprobarNo he podido comprobarlo: no se puede leer el fichero.');
await pagina.click('#cuadro-cancelar');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
