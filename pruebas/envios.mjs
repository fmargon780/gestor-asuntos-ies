/* Prueba en navegador de verdad de "enviar el correo desde el asunto,
   con sus documentos" (docs/ENVIAR-DESDE-EL-ASUNTO.md, 24-sep-2026,
   fila 115 de docs/COLA.md). Sustituye a la prueba del borrador con
   documentos (16-sep-2026): ya no hay ningún borrador que montar.

   Lo que tiene que pasar:
     1. Sin ninguna dirección conectada, el botón "Enviar" lleva a
        Ajustes → Enviar correo, sin llamar a nada.
     2. Con la dirección conectada, "Enviar" abre el resumen (Para,
        Asunto, primeras líneas, documentos con su tamaño) DENTRO del
        mismo cuadro; "Volver" conserva todo lo escrito, marcado y
        editado a mano.
     3. Más de 20 MB: aviso, sin abrir el resumen y sin llamar a nada.
     4. "Confirmar y enviar" llama a la aplicación web simulada (mock
        de `fetch`, nunca una URL real) con el cuerpo correcto —clave
        en la propia dirección, asunto, cuerpo, hilo y los documentos
        en base64— y, si responde `ok`, sale aviso verde, la nota en el
        asunto dice "Correo enviado a…" y el hilo que trae la respuesta
        queda enganchado en `hilos`.
     5. Si la aplicación web responde con error, aviso rojo con el
        motivo y el formulario sigue intacto detrás, listo para
        reintentar.
     6. En ningún momento sale una tarjeta "Borrador en camino".

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 } });
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

const CON_HILO = '260910 CONTRATO 26-27 Empresa Test SL';
const SIN_HILO = '260901 FACTURA 26-27 Otra Empresa SL';
const GRANDE = '260905 FACTURA 26-27 Empresa Grande SL';
const URL_ENVIO = 'https://script.google.test/macros/s/FAKE/exec?k=clave-de-prueba';

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

/* ---------- el mock de la aplicación web (nunca una URL real) ---------- */

let llamadas = [];
let proximaRespuesta = { ok: true, hilo: 'hilo-nuevo-001', matricula: 'matricula-001' };
await pagina.route(URL_ENVIO.split('?')[0] + '**', async (route) => {
  const peticion = route.request();
  let cuerpo = {};
  try { cuerpo = JSON.parse(peticion.postData() || '{}'); } catch (e) { cuerpo = {}; }
  llamadas.push({ url: peticion.url(), metodo: peticion.method(),
    contentType: peticion.headers()['content-type'] || '', cuerpo: cuerpo });
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(proximaRespuesta) });
});

/* ---------- utilidades ---------- */

async function abrirCorreoDe(nombreAsunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre', { hasText: nombreAsunto }).click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  /* Fila 154: con hitos, «Comunicar» de arriba va escondido (vive en la mesa del hito); su menú se pulsa por debajo. */
  await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
  await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.waitForSelector('#adjuntos-lista .correo-fila');
}

async function cerrarCuadro() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#capa', { state: 'hidden' });
}

function hilosDe(nombreAsunto) {
  return pagina.evaluate(async (nombre) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    return (j.asuntos[nombre] && j.asuntos[nombre].hilos) || [];
  }, nombreAsunto);
}

function notasDe(nombreAsunto) {
  return pagina.evaluate(async (nombre) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    return (j.asuntos[nombre] && j.asuntos[nombre].notas) || [];
  }, nombreAsunto);
}

/* ========================================================
   1 · sin ninguna dirección conectada: "Enviar" lleva a Ajustes
   ======================================================== */
await pagina.evaluate(() => { try { window.localStorage.removeItem('gestor-envio-correo'); } catch (e) {} });
await abrirCorreoDe(CON_HILO);
await comprobar('sin conexión, el botón dice a dónde ir',
  pagina.locator('#correo-enviar').textContent(), 'Conecta el envío en Ajustes → Enviar correo');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await pagina.waitForTimeout(200);
await comprobarQue('lleva al bloque "Enviar correo" de Ajustes, abierto',
  pagina.evaluate(() => { const b = document.getElementById('bloque-envio-correo'); return !!b && b.open; }));
await comprobar('ninguna llamada a la aplicación web todavía', llamadas.length, 0);

/* ========================================================
   ahora se conecta (como si Francisco hubiera pegado la dirección)
   ======================================================== */
await pagina.fill('#envio-correo-url', URL_ENVIO);
await pagina.click('#envio-correo-guardar');
await comprobar('el resumen del bloque pasa a "Conectado"',
  pagina.locator('#envio-correo-resumen').textContent(), 'Conectado');

/* ========================================================
   2 · con dos documentos marcados, "Enviar" abre el resumen; "Volver"
   conserva lo escrito y lo marcado
   ======================================================== */
await abrirCorreoDe(CON_HILO);
await comprobar('con conexión, el botón dice "Enviar"', pagina.locator('#correo-enviar').textContent(), 'Enviar');

await pagina.fill('#correo-otro', 'proveedor@correo.es');
await pagina.fill('#correo-cuerpo-texto', 'Le adjunto los documentos del contrato.\nUn saludo.');
await pagina.check('.adjunto-marca >> nth=0');
await pagina.check('.adjunto-marca >> nth=1');
await pagina.click('#correo-enviar');

await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await comprobarQue('el formulario queda oculto detrás del resumen',
  pagina.evaluate(() => document.getElementById('correo-formulario').className.indexOf('oculto') !== -1));
await comprobar('el resumen enseña el "Para"',
  pagina.locator('#correo-resumen').textContent().then(t => t.indexOf('proveedor@correo.es') !== -1), true);
await comprobar('el resumen enseña las primeras líneas del cuerpo',
  pagina.locator('#correo-resumen').textContent().then(t => t.indexOf('Le adjunto los documentos') !== -1), true);
await comprobar('el resumen lista los dos documentos con su tamaño',
  pagina.locator('#correo-resumen li').count(), 2);
await comprobarQue('el resumen dice el tamaño de cada documento',
  pagina.locator('#correo-resumen li').first().textContent().then(t => /·\s*\d/.test(t)));

await pagina.click('#correo-resumen-volver');
await pagina.waitForSelector('#correo-formulario:not(.oculto)');
await comprobar('"Volver" conserva el correo escrito a mano',
  pagina.locator('#correo-otro').inputValue(), 'proveedor@correo.es');
await comprobar('"Volver" conserva el cuerpo escrito a mano',
  pagina.locator('#correo-cuerpo-texto').inputValue(), 'Le adjunto los documentos del contrato.\nUn saludo.');
await comprobar('"Volver" conserva los documentos marcados',
  pagina.locator('.adjunto-marca:checked').count(), 2);
await comprobar('todavía ninguna llamada a la aplicación web', llamadas.length, 0);

/* ========================================================
   4 · Confirmar y enviar: la llamada lleva lo correcto, y responde ok
   ======================================================== */
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('.mensaje.bueno:has-text("Correo enviado a")');

await comprobar('se ha hecho una sola llamada a la aplicación web', llamadas.length, 1);
const llamada1 = llamadas[0];
await comprobar('con Content-Type: text/plain, para no disparar CORS',
  llamada1.contentType.indexOf('text/plain') === 0, true);
await comprobar('el cuerpo lleva el destinatario escrito a mano', llamada1.cuerpo.para, 'proveedor@correo.es');
await comprobar('el cuerpo lleva el hilo del asunto', llamada1.cuerpo.hilo, 'hilo-abc');
await comprobar('el cuerpo lleva los dos documentos en base64', (llamada1.cuerpo.adjuntos || []).length, 2);
await comprobarQue('cada adjunto lleva su base64 y su nombre',
  Promise.resolve((llamada1.cuerpo.adjuntos || []).every(a => a.nombre && a.base64 && a.base64.length > 0)));
await comprobar('la clave va en la propia dirección, no hace falta releerla del cuerpo',
  llamada1.url.indexOf('k=clave-de-prueba') !== -1, true);

await comprobar('la nota del asunto dice "Correo enviado a…"',
  notasDe(CON_HILO).then(ns => ns.length && ns[ns.length - 1].texto.indexOf('Correo enviado a proveedor@correo.es') === 0), true);
await comprobar('el hilo que trae la respuesta queda enganchado',
  hilosDe(CON_HILO).then(hs => hs.some(h => h.id === 'hilo-nuevo-001')), true);

await cerrarCuadro();

/* ========================================================
   3 · más de 20 MB: aviso, sin abrir el resumen ni llamar a nada
   ======================================================== */
llamadas = [];
await abrirCorreoDe(GRANDE);
await pagina.fill('#correo-otro', 'proveedor@correo.es');
await pagina.check('.adjunto-marca >> nth=0');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('.mensaje.malo:has-text("20 MB")');
await comprobar('el resumen no se ha abierto', pagina.locator('#correo-resumen:not(.oculto)').count(), 0);
await comprobar('no se ha llamado a la aplicación web', llamadas.length, 0);
await cerrarCuadro();

/* ========================================================
   5 · la aplicación web responde con error: aviso rojo, y el
   formulario sigue intacto detrás para reintentar
   ======================================================== */
llamadas = [];
proximaRespuesta = { ok: false, motivo: 'La cuenta no ha podido mandarlo.' };
await abrirCorreoDe(SIN_HILO);
await pagina.fill('#correo-otro', 'compras@correo.es');
await pagina.check('.adjunto-marca >> nth=0');
await pagina.click('#correo-enviar');
await pagina.waitForSelector('#correo-resumen:not(.oculto)');
await pagina.click('#correo-confirmar-envio');
await pagina.waitForSelector('#correo-resumen-aviso .aviso-rojo:has-text("La cuenta no ha podido mandarlo.")');

await comprobar('sin hilo en el asunto, se ha llamado igualmente', llamadas.length, 1);
await comprobar('el encargo sin hilo manda cadena vacía', llamadas[0].cuerpo.hilo, '');
await comprobarQue('"Confirmar y enviar" se puede volver a pulsar',
  pagina.evaluate(() => !document.getElementById('correo-confirmar-envio').disabled));
await pagina.click('#correo-resumen-volver');
await comprobar('el correo escrito a mano sigue ahí, listo para reintentar',
  pagina.locator('#correo-otro').inputValue(), 'compras@correo.es');
await comprobar('nada se ha apuntado en las notas', notasDe(SIN_HILO).then(ns => ns.length), 0);
await cerrarCuadro();

/* ========================================================
   6 · nunca sale "Borrador en camino"
   ======================================================== */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(300);
await comprobar('no existe ninguna tarjeta "Borrador en camino"',
  pagina.locator('.tarjeta-nombre:has-text("Borrador en camino")').count(), 0);
await comprobar('no hay ningún botón "Preparar borrador"',
  pagina.getByRole('button', { name: 'Preparar borrador con los documentos' }).count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
