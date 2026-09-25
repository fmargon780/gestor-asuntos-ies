/* Prueba en navegador de verdad de la fila 153 de docs/COLA.md
   (docs/ENVIAR-DOCUMENTO-POR-SENECA.md): el «Enviar ▾» de un documento
   del hito, en la mesa.

   1. El enlace dice «Enviar ▾» y abre un menú con «Por correo» y
      «Por Séneca» (no una acción directa).
   2. «Por correo» abre el cuadro de Correo con ese documento ya
      marcado entre los adjuntos.
   3. «Por Séneca» abre el cuadro de Séneca con el documento señalado
      («Adjunta este documento en Séneca: …», con «Copiar el nombre»).
   4. Al terminar (Séneca), se marca el paso del guion con
      `accion: 'comunicar'` de ese hito — la misma regla de la fila 150.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Tres, Eva 9990003';
const DOCUMENTO = '260910 SOLICITUD Inventada Tres.pdf';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Comunicar', cuerpo: '', opciones: [],
      guion: [ { id: 'g1', texto: 'Avisar a la familia', explicacion: '', accion: 'comunicar' } ] }
  ]
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, asunto, documento]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  const fh = await carpeta.getFileHandle(documento, { create: true });
  const wf = await fh.createWritable(); await wf.write('contenido de mentira'); await wf.close();
}, [GUIAS, ASUNTO, DOCUMENTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([asunto, documento]) => {
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Tres, Eva 9990003', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await Hitos.anadirDocumento(asunto, 'c1', documento);
  await App.verAbiertos();
}, [ASUNTO, DOCUMENTO]);

async function abrirMesa() {
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(300);
  var yaAbierta = await pagina.evaluate(() => {
    var m = document.querySelector('.hito-en-mesa[data-id="c1"]');
    return !!(m && m.offsetParent);
  });
  if (!yaAbierta) {
    await pagina.locator('#ficha-guia .hito[data-id="c1"] .hito-titulo').click();
  }
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]:visible');
  await pagina.waitForTimeout(300);
  /* La tarjeta grande de «Documentos del hito» (no el resumen cerrado):
     ahí es donde vive de verdad la fila de cada documento, con «Enviar ▾». */
  await pagina.evaluate(() => { if (window.HitoMesa) HitoMesa.abrirTarjeta('docs'); });
  await pagina.waitForTimeout(200);
}

await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Tres' }).first().click();
await abrirMesa();

/* ---------- 1. «Enviar ▾» sale como menú ---------- */
console.log('--- 1. «Enviar ▾» ---');
await comprobarQue('el enlace dice «Enviar ▾»',
  pagina.evaluate(() => {
    const b = document.querySelector('.hito-en-mesa .mesa-doc-enviar');
    return !!b && b.textContent.trim() === 'Enviar ▾';
  }));
await pagina.click('.hito-en-mesa .mesa-doc-enviar');
await pagina.waitForTimeout(150);
await comprobar('el menú trae «Por correo» y «Por Séneca»',
  pagina.evaluate(() => {
    const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
    return menu ? Array.from(menu.querySelectorAll('.ficha-menu-opcion')).map((o) => o.textContent.trim()) : null;
  }), ['Por correo', 'Por Séneca']);

/* ---------- 2. «Por correo»: el documento ya va marcado ---------- */
console.log('--- 2. Por correo ---');
await pagina.evaluate(() => {
  const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
  const opcion = menu && Array.from(menu.querySelectorAll('.ficha-menu-opcion')).find((o) => /correo/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario');
await comprobarQue('el documento sale ya marcado entre los adjuntos',
  pagina.evaluate((doc) => {
    const c = Array.from(document.querySelectorAll('.adjunto-marca')).find((x) => x.value === doc);
    return !!c && c.checked;
  }, DOCUMENTO));
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.waitForTimeout(300);
await abrirMesa();

/* ---------- 3 y 4. «Por Séneca»: el documento señalado, y al terminar
   se marca el paso del guion ---------- */
console.log('--- 3 y 4. Por Séneca ---');
await pagina.click('.hito-en-mesa .mesa-doc-enviar');
await pagina.waitForTimeout(150);
await pagina.evaluate(() => {
  const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
  const opcion = menu && Array.from(menu.querySelectorAll('.ficha-menu-opcion')).find((o) => /Séneca/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #seneca-formulario');
await comprobarQue('el cuadro de Séneca señala el documento a adjuntar',
  pagina.evaluate((doc) => {
    const linea = document.querySelector('.seneca-doc-adjuntar');
    return !!linea && linea.textContent.indexOf(doc) > -1;
  }, DOCUMENTO));
await comprobar('«Copiar el nombre» copia el nombre del documento',
  pagina.evaluate(async () => {
    document.getElementById('seneca-copiar-doc').click();
    await new Promise((r) => setTimeout(r, 100));
    return navigator.clipboard.readText();
  }), DOCUMENTO);
await pagina.click('#seneca-copiar-texto');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

await comprobar('se marca el paso del guion (accion: comunicar) al terminar por Séneca',
  pagina.evaluate(async (asunto) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === asunto)[0];
    const datos = await Hitos.leer();
    const entrada = datos.porAsunto[asunto];
    const h = entrada && Hitos.buscar(entrada.hitos, 'c1');
    if (!a || !h) return false;
    const paso = Hitos.guionDe(a, h).find((g) => g.id === 'g1');
    return !!(paso && paso.hecho);
  }, ASUNTO), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
