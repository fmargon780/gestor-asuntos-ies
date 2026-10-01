/* Prueba en navegador de verdad de la fila 213 (docs/BOTON-DE-SOPORTE.md):
   el botón «Soporte», su ventana y el campo del buzón en Ajustes.

   1. El botón está siempre a la vista, abajo a la derecha.
   2. Validación: sin tipo o sin texto no se envía y se dice qué falta.
   3. Sin dirección de buzón: aviso claro y el texto se queda.
   4. La dirección se guarda en _GESTOR (asuntos.json → ajustesAvisos).
   5. Enviar un error: lleva app, repo, tipo, texto, pantalla (solo su
      nombre), quién, fecha, versión y los últimos errores.
   6. Si el buzón falla, aviso y el texto NO se pierde; al reintentar,
      «Recibido. Gracias» y la ventana se cierra.
   7. Una mejora no lleva errores.
   8. Captura grande pegada/soltada: se reduce (≤ 1.500 px, JPEG), se ve
      en pequeño, se puede quitar y va en el envío.
   9. ✕, Cancelar y Escape cierran.
   10. Con un buzón sin internet (petición cortada): aviso, texto intacto.
   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
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

/* 1. Ya en la pantalla de entrada el botón está. */
await comprobarQue('1. el botón sale en la pantalla de entrada', pagina.locator('#btn-soporte').isVisible());

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

await comprobar('1. abajo a la derecha, sin salirse de la pantalla',
  pagina.evaluate(() => { const r = document.getElementById('btn-soporte').getBoundingClientRect();
    return [r.right > innerWidth - 40, r.bottom > innerHeight - 40, r.right <= innerWidth, r.bottom <= innerHeight]; }),
  [true, true, true, true]);
await comprobar('1. el texto del botón es «Soporte»', pagina.locator('#btn-soporte').textContent(), 'Soporte');

async function abrir() {
  await pagina.click('#btn-soporte');
  await pagina.waitForSelector('#capa-soporte');
}
const mensaje = () => pagina.locator('#soporte-mensaje').textContent();

/* 2. Validación. */
await abrir();
await pagina.click('#soporte-enviar');
await comprobarQue('2. sin tipo, dice que elija', (await mensaje()).indexOf('Elige primero') === 0);
await pagina.click('.soporte-tipo[data-tipo="error"]');
await pagina.click('#soporte-enviar');
await comprobarQue('2. sin texto, dice que lo cuente', (await mensaje()).indexOf('Cuéntalo') === 0);
await comprobar('2. la ventana sigue abierta', pagina.locator('#capa-soporte').count(), 1);
await comprobar('2. como el usuario ya es conocido, no pide el nombre', pagina.locator('#soporte-nombre').count(), 0);

/* 3. Sin dirección. */
await pagina.fill('#soporte-texto', 'No me deja archivar el asunto');
await pagina.click('#soporte-enviar');
await comprobarQue('3. sin buzón configurado lo dice', (await mensaje()).indexOf('aún no está configurado') > -1);
await comprobar('3. el texto sigue en la ventana', pagina.inputValue('#soporte-texto'), 'No me deja archivar el asunto');
await comprobar('3. el botón Enviar vuelve a estar activo', pagina.locator('#soporte-enviar').isEnabled(), true);

/* 9. Cerrar de las tres maneras. */
await pagina.click('#soporte-x');
await comprobar('9. ✕ cierra', pagina.locator('#capa-soporte').count(), 0);
await abrir();
await pagina.click('#soporte-cancelar');
await comprobar('9. Cancelar cierra', pagina.locator('#capa-soporte').count(), 0);
await abrir();
await pagina.keyboard.press('Escape');
await comprobar('9. Escape cierra', pagina.locator('#capa-soporte').count(), 0);

/* 4. La dirección se guarda en Ajustes → El centro. */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.evaluate(() => { document.getElementById('bloque-soporte').open = true; });
await pagina.fill('#soporte-url', 'http://no-vale');
await pagina.press('#soporte-url', 'Tab');
await pagina.waitForTimeout(200);
await comprobar('4. una dirección sin https:// se rechaza',
  pagina.evaluate(() => (App.E.registro.ajustesAvisos || {}).urlSoporte || ''), '');
await pagina.fill('#soporte-url', 'https://buzon.prueba/exec');
await pagina.press('#soporte-url', 'Tab');
await pagina.waitForTimeout(400);
await comprobar('4. la dirección buena se guarda en el registro compartido',
  pagina.evaluate(() => App.E.registro.ajustesAvisos.urlSoporte), 'https://buzon.prueba/exec');
await comprobar('4. y está en asuntos.json del disco',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const j = JSON.parse(await (await (await g.getFileHandle('asuntos.json')).getFile()).text());
    return (j.ajustesAvisos || {}).urlSoporte;
  }), 'https://buzon.prueba/exec');

/* El buzón de mentira. */
const recibidos = [];
let modo = 'falla';
await pagina.route('https://buzon.prueba/**', async (ruta) => {
  if (modo === 'corta') return ruta.abort();
  if (modo === 'falla') return ruta.fulfill({ status: 200, contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, motivo: 'Drive no responde.' }) });
  recibidos.push(JSON.parse(ruta.request().postData()));
  return ruta.fulfill({ status: 200, contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, colaApuntada: true, fila: 300 }) });
});

await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
/* Un error de la app, para ver que viaja. */
await pagina.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'fallo de prueba', filename: 'js/x.js', lineno: 7 })));

/* 6. Falla el buzón: el texto no se pierde. */
await abrir();
await pagina.click('.soporte-tipo[data-tipo="error"]');
await pagina.fill('#soporte-texto', 'No me deja archivar el asunto');
await pagina.click('#soporte-enviar');
await pagina.waitForFunction(() => document.getElementById('soporte-mensaje').textContent.indexOf('Drive no responde') > -1);
await comprobar('6. si el buzón falla, dice por qué y el texto sigue', pagina.inputValue('#soporte-texto'), 'No me deja archivar el asunto');
await comprobar('6. sigue habiendo ventana', pagina.locator('#capa-soporte').count(), 1);

/* 10. Sin conexión. */
modo = 'corta';
await pagina.click('#soporte-enviar');
await pagina.waitForFunction(() => document.getElementById('soporte-mensaje').textContent.indexOf('No he podido contactar') > -1);
await comprobar('10. sin conexión el texto sigue', pagina.inputValue('#soporte-texto'), 'No me deja archivar el asunto');

/* 8. Una captura grande soltada en la ventana. */
await pagina.evaluate(async () => {
  const l = document.createElement('canvas'); l.width = 3000; l.height = 1000;
  const c = l.getContext('2d'); c.fillStyle = '#c33'; c.fillRect(0, 0, 3000, 1000);
  const blob = await new Promise(r => l.toBlob(r, 'image/png'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'captura.png', { type: 'image/png' }));
  document.getElementById('capa-soporte').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});
await pagina.waitForSelector('.soporte-vista');
await comprobar('8. la captura se ve en pequeño', pagina.locator('.soporte-vista').isVisible(), true);
await comprobar('8. se ha reducido a 1.500 px de ancho',
  pagina.evaluate(() => document.querySelector('.soporte-vista').naturalWidth), 1500);
await pagina.click('#soporte-quitar');
await comprobar('8. se puede quitar', pagina.locator('.soporte-vista').count(), 0);
await pagina.evaluate(async () => {
  const l = document.createElement('canvas'); l.width = 800; l.height = 400;
  const c = l.getContext('2d'); c.fillStyle = '#36c'; c.fillRect(0, 0, 800, 400);
  const blob = await new Promise(r => l.toBlob(r, 'image/png'));
  const dt = new DataTransfer();
  dt.items.add(new File([blob], 'otra.png', { type: 'image/png' }));
  document.getElementById('capa-soporte').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});
await pagina.waitForSelector('.soporte-vista');
await comprobar('8. una imagen pequeña no se agranda',
  pagina.evaluate(() => document.querySelector('.soporte-vista').naturalWidth), 800);

/* 5 y 6. Ahora sí llega. */
modo = 'bien';
await pagina.click('#soporte-enviar');
await pagina.waitForSelector('#capa-soporte', { state: 'detached' });
await comprobarQue('6. «Recibido. Gracias»', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#mensajes .mensaje')).some(m => m.textContent === 'Recibido. Gracias')));
await comprobar('5. llega un solo aviso', recibidos.length, 1);
const r = recibidos[0] || {};
await comprobar('5. app y repositorio', [r.app, r.repo], ['Gestor de Asuntos', 'fmargon780/gestor-asuntos-ies']);
await comprobar('5. tipo y texto', [r.tipo, r.texto], ['error', 'No me deja archivar el asunto']);
await comprobar('5. pantalla (solo el nombre) y quién', [r.pantalla, r.quien], ['Inicio', 'Francisco']);
await comprobarQue('5. fecha con hora y versión', /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(r.fecha || '') && /\d{4}/.test(r.version || ''));
await comprobarQue('5. lleva el último error de la consola', (r.errores || '').indexOf('fallo de prueba (x.js:7)') > -1);
await comprobarQue('5. lleva la captura en JPEG', (r.captura || '').indexOf('/9j/') === 0);

/* 7. Una mejora no lleva errores ni captura, y no pide el nombre. */
await abrir();
await pagina.click('.soporte-tipo[data-tipo="mejora"]');
await pagina.fill('#soporte-texto', 'Estaría bien poder ordenar por fecha');
await pagina.click('#soporte-enviar');
await pagina.waitForSelector('#capa-soporte', { state: 'detached' });
const m = recibidos[1] || {};
await comprobar('7. mejora: tipo', m.tipo, 'mejora');
await comprobar('7. mejora: sin errores y sin captura', [m.errores === undefined, m.captura === undefined], [true, true]);

/* Pantalla de un asunto: solo el nombre de la pantalla. */
await comprobar('pantalla en Ajustes se llama Ajustes',
  pagina.evaluate(() => { App.ir('ajustes'); return Soporte.abrir && document.querySelector('.pantalla:not(.oculto)').id; }), 'pantalla-ajustes');

/* 11. Fila 240 (docs/SOPORTE-TEXTO-SIN-LIMITE.md): sin límite, cuadro grande con guion. */
modo = 'bien';
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await abrir();
await comprobar('11. el cuadro no tiene tope de tamaño y abre con 14 renglones',
  pagina.evaluate(() => { const t = document.getElementById('soporte-texto'); return [t.maxLength, t.rows]; }), [-1, 14]);
await comprobarQue('11. el guion gris sugiere qué contar',
  pagina.evaluate(() => { const p = document.getElementById('soporte-texto').placeholder;
    return p.indexOf('Cuéntalo con todo el detalle que quieras; no hay límite de tamaño. Te sugerimos:') === 0 &&
      ['· Qué pasa o qué propones', '· En qué pantalla o en qué paso', '· Qué esperabas que pasara, o cómo lo harías tú',
       '· Casos y ejemplos concretos', '· Otras posibilidades o variantes que se te ocurran'].every((l) => p.indexOf(l) > -1); }));
await comprobar('11. el contador empieza en «0 palabras»', pagina.locator('#soporte-palabras').textContent(), '0 palabras');
await comprobar('11. la ventana es ancha (hasta unos 900 px)',
  pagina.evaluate(() => Math.round(document.querySelector('.soporte-cuadro').getBoundingClientRect().width)), 900);
const alto0 = await pagina.evaluate(() => document.getElementById('soporte-texto').getBoundingClientRect().height);
await pagina.fill('#soporte-texto', 'una palabra');
await comprobar('11. «N palabras», y «1 palabra» en singular',
  [await pagina.locator('#soporte-palabras').textContent(), await pagina.evaluate(() => Soporte.textoPalabras(1)), await pagina.evaluate(() => Soporte.contarPalabras('uno dos\ntres  cuatro'))],
  ['2 palabras', '1 palabra', 4]);
await pagina.fill('#soporte-texto', Array.from({ length: 60 }, (_, i) => 'Línea ' + i + ' de un texto largo').join('\n'));
const medidas = await pagina.evaluate(() => ({
  alto: document.getElementById('soporte-texto').getBoundingClientRect().height,
  maximo: innerHeight - 400,
  botones: document.getElementById('soporte-enviar').getBoundingClientRect().bottom <= innerHeight }));
await comprobarQue('11. crece al escribir, sin pasar de casi toda la altura, y los botones siguen a la vista',
  medidas.alto > alto0 && medidas.alto <= medidas.maximo + 2 && medidas.botones, JSON.stringify([alto0, medidas]));
/* Un texto de 50.000 caracteres se envía y llega entero. */
const largo = 'palabra '.repeat(6250);   /* 50.000 caracteres */
await pagina.click('.soporte-tipo[data-tipo="mejora"]');
await pagina.fill('#soporte-texto', largo);
await pagina.click('#soporte-enviar');
await pagina.waitForSelector('#capa-soporte', { state: 'detached' });
await comprobar('11. un texto de 50.000 caracteres llega entero', (recibidos[recibidos.length - 1] || {}).texto.length, largo.trim().length);

/* La petición cortada a propósito (punto 10) deja su propio aviso. */
const propios = errores.filter(t => t.indexOf('ERR_FAILED') === -1);
if (propios.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + propios.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
