/* Prueba en navegador de verdad de "Preparar informe para dirección"
   (27-sep-2026, fila 196, docs/AVISOS-A-QUIEN-LO-PIDE.md, apartado 4):

     - en Cuentas, el botón abre el cuadro de Correo sin destinatario,
       con el asunto "Informe de asuntos · <fecha>" y un texto con los
       cinco apartados (por órgano, vencidos, esperando a otros,
       cerrados desde el último informe, tiempo medio);
     - tras enviarlo de verdad, queda escrita la fecha en
       _GESTOR/informes.json.

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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CLAVE = '260901 TRASLADO 26-27 Uno Reves, Ana 1111';
const AYER = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

await pagina.evaluate(async ({ CLAVE, AYER }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE, { create: true });
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }
  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' }]);
  await escribir('asuntos.json', {
    asuntos: { [CLAVE]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Reves, Ana 1111', limite: AYER } }
  });
  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE, AYER });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);

/* ================= CONECTAR EL ENVÍO (mock, nunca una URL real) ================= */

const URL_ENVIO = 'https://script.google.test/macros/s/FAKE/exec?k=clave-de-prueba';
let llamadas = [];
await pagina.route(URL_ENVIO.split('?')[0] + '**', async (route) => {
  const peticion = route.request();
  let cuerpo = {};
  try { cuerpo = JSON.parse(peticion.postData() || '{}'); } catch (e) { cuerpo = {}; }
  llamadas.push(cuerpo);
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
});

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await pagina.waitForTimeout(200);
await pagina.evaluate(() => {
  if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('mantenimiento');
  const d = document.getElementById('bloque-envio-correo');
  if (d) d.open = true;
});
await pagina.fill('#envio-correo-url', URL_ENVIO);
await pagina.click('#envio-correo-guardar');
await pagina.waitForSelector('#envio-correo-resumen:has-text("Conectado")');

/* ================= "PREPARAR INFORME PARA DIRECCIÓN" ================= */
console.log('--- "Preparar informe para dirección" abre el cuadro, con los cinco apartados ---');

await pagina.click('#pestana-cuentas');
await pagina.waitForSelector('#pantalla-cuentas:not(.oculto)');
await pagina.click('#btn-informe-direccion');
await pagina.waitForSelector('#correo-formulario');

await comprobar('sin destinatario de partida',
  pagina.inputValue('#correo-otro'), '');
await comprobar('el asunto es "Informe de asuntos · <fecha>"',
  pagina.inputValue('#correo-asunto').then(t => t.indexOf('Informe de asuntos · ') === 0), true);

const cuerpo = await pagina.inputValue('#correo-cuerpo-texto');
await comprobar('1. por quién lo encarga', cuerpo.indexOf('Secretaría') !== -1, true);
await comprobar('2. vencidos', cuerpo.indexOf('Vencidos') !== -1, true);
await comprobar('2. con el asunto vencido', cuerpo.indexOf('Uno Reves') !== -1, true);
await comprobar('3. esperando a otros', cuerpo.indexOf('Esperando a otros') !== -1, true);
await comprobar('4. cerrados desde el último informe', cuerpo.indexOf('Cerrados desde el') !== -1, true);

await pagina.fill('#correo-otro', 'direccion@ejemplo.com');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('#correo-resumen .aviso-ambar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });

const informes = await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('informes.json');
  return JSON.parse(await (await h.getFile()).text());
});
await comprobar('tras enviarlo, informes.json guarda la fecha de hoy',
  informes.ultimoEnviado, new Date().toISOString().slice(0, 10));

/* ================= FIN ================= */

if (errores.length) { fallos++; console.log('FALLA  errores de consola:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
