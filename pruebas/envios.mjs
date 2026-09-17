/* Prueba en navegador de verdad de "mandar los documentos de un asunto
   por correo" (docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md, 16-sep-2026,
   fila 13 de docs/COLA.md).

   Lo que tiene que pasar:
     1. Marcar dos documentos y preparar deja en la bandeja las dos
        copias y el .envio.json.
     2. El encargo lleva el hilo del asunto cuando lo tiene, y cadena
        vacía cuando el asunto no tiene hilos.
     3. Si lo marcado suma más de 20 MB no se prepara nada y sale el
        aviso.
     4. Cuando aparece <id>.listo.json, la tarjeta pasa a "Abrir el
        borrador en Gmail" y el encargo sale de envios.json.
     5. Con <id>.error.json, sale el motivo y el encargo desaparece.
     6. Un .envio.json en la carpeta no aparece como un correo en la
        bandeja.

   Reutiliza el disco de mentira de pruebas/navegador.mjs y el montaje
   de la bandeja de mentira de pruebas/correos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
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

const CON_HILO = '260910 CONTRATO 26-27 Empresa Test SL';
const SIN_HILO = '260901 FACTURA 26-27 Otra Empresa SL';
const GRANDE = '260905 FACTURA 26-27 Empresa Grande SL';

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ({ conHilo, sinHilo, grande }) => {
  const abiertos = window.__disco.abiertos;

  const registro = { asuntos: {} };
  registro.asuntos[conHilo] = {
    estado: 'abierto', tipo: 'CONTRATO', categoria: 'EMPRESAS', tercero: 'Empresa Test SL',
    hilos: [{ id: 'hilo-abc', asunto: 'contrato', visto: 1 }]
  };
  registro.asuntos[sinHilo] = {
    estado: 'abierto', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Otra Empresa SL'
  };
  registro.asuntos[grande] = {
    estado: 'abierto', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Empresa Grande SL'
  };

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('asuntos.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify(registro));
  await w.close();

  const cA = await abiertos.getDirectoryHandle(conHilo, { create: true });
  cA._hijos.set('260901 docA.pdf', window.__disco.fich('260901 docA.pdf', 'el documento A'));
  cA._hijos.set('260902 docB.pdf', window.__disco.fich('260902 docB.pdf', 'el documento B'));

  const cB = await abiertos.getDirectoryHandle(sinHilo, { create: true });
  cB._hijos.set('260903 docC.pdf', window.__disco.fich('260903 docC.pdf', 'el documento C'));

  const cG = await abiertos.getDirectoryHandle(grande, { create: true });
  cG._hijos.set('260905 docGrande.pdf',
    window.__disco.fich('260905 docGrande.pdf', 'x'.repeat(21 * 1024 * 1024)));
}, { conHilo: CON_HILO, sinHilo: SIN_HILO, grande: GRANDE });

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* --- señalar la bandeja, igual que pruebas/correos.mjs --- */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(400);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(400);

/* ---------- utilidades ---------- */

function nombresDeBandeja() {
  return pagina.evaluate(() => Array.from(window.__bandeja._hijos.keys()).sort());
}

function leerDeBandeja(nombre) {
  return pagina.evaluate(async (n) => {
    const h = await window.__bandeja.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombre);
}

function listaDeEnvios() {
  return pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('envios.json');
    return JSON.parse(await (await h.getFile()).text());
  });
}

async function idDelUltimoEnvio() {
  const lista = await listaDeEnvios();
  return lista.length ? lista[lista.length - 1].id : null;
}

/* Simula lo que dejaría el script de Apps Script al terminar. */
function dejarListo(id, enlace) {
  return pagina.evaluate(({ id, enlace }) => {
    window.__bandeja._hijos.set(id + '.listo.json',
      window.__disco.fich(id + '.listo.json', JSON.stringify({ id, hecho: 'ahora', enlace })));
  }, { id, enlace });
}

function dejarError(id, motivo) {
  return pagina.evaluate(({ id, motivo }) => {
    window.__bandeja._hijos.set(id + '.error.json',
      window.__disco.fich(id + '.error.json', JSON.stringify({ id, motivo })));
  }, { id, motivo });
}

async function abrirCorreoDe(nombreAsunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: nombreAsunto }).click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('.boton-correo');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#adjuntos-lista .correo-fila');
}

async function cerrarCuadro() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#capa', { state: 'hidden' });
}

/* ========================================================
   1 y 2 · dos documentos, con hilo
   ======================================================== */
await abrirCorreoDe(CON_HILO);
await pagina.fill('#correo-otro', 'proveedor@correo.es');
await pagina.check('.adjunto-marca >> nth=0');
await pagina.check('.adjunto-marca >> nth=1');
await pagina.click('#adjuntos-preparar');
await pagina.waitForSelector('.mensaje.bueno:has-text("Borrador en camino")');
await pagina.waitForTimeout(300);

const idConHilo = await idDelUltimoEnvio();
const bandejaTrasPrimero = await nombresDeBandeja();
await comprobar('las dos copias han entrado en la bandeja',
  bandejaTrasPrimero.filter(n => n.indexOf(idConHilo + ' - ') === 0).sort(),
  [idConHilo + ' - 260901 docA.pdf', idConHilo + ' - 260902 docB.pdf'].sort());
await comprobar('el .envio.json ha entrado también',
  bandejaTrasPrimero.includes(idConHilo + '.envio.json'), true);

const encargoConHilo = await leerDeBandeja(idConHilo + '.envio.json');
await comprobar('el encargo lleva el hilo del asunto', encargoConHilo.hilo, 'hilo-abc');
await comprobar('el encargo lleva el destinatario escrito a mano', encargoConHilo.para, 'proveedor@correo.es');
await comprobar('el encargo lleva los dos adjuntos', (encargoConHilo.adjuntos || []).length, 2);
await comprobar('la lista de encargos vivos trae uno', listaDeEnvios().then(l => l.length), 1);

await cerrarCuadro();

/* ========================================================
   2 (segunda mitad) · sin hilo
   ======================================================== */
await abrirCorreoDe(SIN_HILO);
await pagina.fill('#correo-otro', 'compras@correo.es');
await pagina.check('.adjunto-marca >> nth=0');
await pagina.click('#adjuntos-preparar');
await pagina.waitForSelector('.mensaje.bueno:has-text("Borrador en camino")');
await pagina.waitForTimeout(300);

const idSinHilo = await idDelUltimoEnvio();
const encargoSinHilo = await leerDeBandeja(idSinHilo + '.envio.json');
await comprobar('sin hilos en el asunto, el encargo lleva el hilo vacío', encargoSinHilo.hilo, '');
await cerrarCuadro();

/* ========================================================
   6 · un .envio.json no es un correo
   ======================================================== */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(300);
await comprobar('los .envio.json no salen como correos en la bandeja',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 0);

/* ========================================================
   3 · más de 20 MB
   ======================================================== */
await abrirCorreoDe(GRANDE);
await pagina.check('.adjunto-marca >> nth=0');
await pagina.click('#adjuntos-preparar');
await pagina.waitForSelector('#adjuntos-aviso .aviso-rojo');
await comprobar('el aviso dice que pesa de más', pagina.locator('#adjuntos-aviso').textContent()
  .then(t => t.indexOf('20 MB') !== -1), true);

const bandejaTrasElGrande = await nombresDeBandeja();
await comprobar('nada del documento grande ha entrado en la bandeja',
  bandejaTrasElGrande.some(n => n.indexOf('docGrande') !== -1), false);
await comprobar('la lista de encargos vivos sigue con los mismos dos', listaDeEnvios().then(l => l.length), 2);
await cerrarCuadro();

/* ========================================================
   4 · llega el .listo.json
   ======================================================== */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(300);
await comprobar('sale la tarjeta "Borrador en camino"',
  pagina.locator('#bandeja-envios .tarjeta').count(), 2);

await dejarListo(idConHilo, 'https://mail.google.com/mail/u/?authuser=francisco%40centro.es#drafts');
await pagina.evaluate(() => window.Bandeja.avisarEnvioNuevo());
await pagina.waitForSelector('#bandeja-envios button:has-text("Abrir el borrador en Gmail")');

await comprobar('sigue habiendo dos encargos, uno listo y otro esperando',
  listaDeEnvios().then(l => l.length), 2);

await pagina.click('#bandeja-envios button:has-text("Abrir el borrador en Gmail")');
await pagina.waitForTimeout(400);

await comprobar('el encargo listo ha salido de la lista de vivos',
  listaDeEnvios().then(l => l.map(x => x.id)), [idSinHilo]);
await comprobar('el .listo.json se ha borrado de la bandeja',
  nombresDeBandeja().then(l => l.includes(idConHilo + '.listo.json')), false);

/* ========================================================
   5 · llega el .error.json
   ======================================================== */
await dejarError(idSinHilo, 'La dirección de correo no es válida.');
await pagina.evaluate(() => window.Bandeja.avisarEnvioNuevo());
await pagina.waitForSelector('#bandeja-envios .aviso-rojo:has-text("La dirección de correo no es válida.")');

await pagina.click('#bandeja-envios button:has-text("Entendido")');
await pagina.waitForTimeout(400);

await comprobar('no queda ningún encargo vivo', listaDeEnvios(), []);
await comprobar('ya no sale ninguna tarjeta de "Borrador en camino"',
  pagina.locator('#bandeja-envios .tarjeta').count(), 0);
await comprobar('el .error.json se ha borrado de la bandeja',
  nombresDeBandeja().then(l => l.includes(idSinHilo + '.error.json')), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
