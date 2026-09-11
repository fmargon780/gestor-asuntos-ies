/* Prueba en navegador de verdad de lo que deja un correo dentro de un
   asunto: la nota corta con su botón, los adjuntos con nombre de la
   casa, que un correo no entre dos veces, y los documentos en dos
   grupos dentro de la ficha.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';

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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* El asunto ya existe, con su solicitud dentro y su ficha en asuntos.json. */
await pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: { [nombre]: { tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL',
                           situacion: 'A LA ESPERA DEL TERCERO' } }
  })));
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  carpeta._hijos.set('260903 26EA0412 SOLICITUD.pdf',
    window.__disco.fich('260903 26EA0412 SOLICITUD.pdf', 'la solicitud'));
  carpeta._hijos.set('Conciliación FL.pdf',
    window.__disco.fich('Conciliación FL.pdf', 'el impreso'));
}, ASUNTO);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La bandeja de correos: una carpeta de mentira, colgada de la raíz de
   mentira para que sea del mismo molde, y el selector de carpetas
   apañado para devolverla cuando la aplicación la pida. */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});

function correoDeMentira() {
  return {
    id: 'hilo-123',
    asunto: 'Re: ' + ASUNTO,
    fecha: '2026-09-09T10:00:00.000Z',
    fechaUltimo: '2026-09-09T10:00:00.000Z',
    mensajes: 2,
    de: { nombre: 'Mercedes Pacheco', correo: 'mercedes@correo.es' },
    correos: ['mercedes@correo.es'],
    enlace: 'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123',
    pdf: 'hilo-123 - hilo.pdf',
    adjuntos: ['hilo-123 - LITNAC2026050413001031751487.pdf', 'hilo-123 - 1000082963.jpg']
  };
}

async function dejarElCorreo(datos) {
  await pagina.evaluate((d) => {
    const b = window.__bandeja;
    b._hijos.set('hilo-123.json', window.__disco.fich('hilo-123.json', JSON.stringify(d)));
    b._hijos.set(d.pdf, window.__disco.fich(d.pdf, 'el hilo en pdf'));
    d.adjuntos.forEach(a => b._hijos.set(a, window.__disco.fich(a, 'un adjunto')));
  }, datos);
}

await dejarElCorreo(correoDeMentira());

/* Señalar la carpeta en Ajustes. */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(400);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(800);

await comprobar('el correo sale en la bandeja',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 1);
await comprobar('lo reconoce como respuesta del asunto',
  pagina.locator('#bandeja-correos .propuesta-correo').textContent(),
  'Respuesta de' + ASUNTO);

console.log('--- guardando el correo en el asunto ---');
await pagina.getByRole('button', { name: 'Guardar en ese asunto' }).click();
await pagina.waitForTimeout(900);

async function ficherosDelAsunto() {
  return pagina.evaluate(async (nombre) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(nombre);
    return Array.from(c._hijos.keys()).sort();
  }, ASUNTO);
}
async function notasDelAsunto() {
  return pagina.evaluate(async (nombre) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    const t = await (await f.getFile()).text();
    return (JSON.parse(t).asuntos[nombre].notas || []);
  }, ASUNTO);
}

await comprobar('los ficheros que hay ahora en la carpeta', ficherosDelAsunto(), [
  '260903 26EA0412 SOLICITUD.pdf',
  '260909 ADJUNTO 1000082963.jpg',
  '260909 ADJUNTO LITNAC2026050413001031751487.pdf',
  '260909 CORREO.pdf',
  'Conciliación FL.pdf'
]);

const notas = await notasDelAsunto();
await comprobar('hay una sola nota', notas.length, 1);
await comprobar('el texto de la nota', notas[0] && notas[0].texto,
  'Correo de Mercedes Pacheco · 09/09/2026\nRe: ' + ASUNTO);
await comprobar('la nota no lleva la dirección escrita',
  (notas[0] && notas[0].texto || '').indexOf('http'), -1);
await comprobar('la nota guarda el enlace aparte', notas[0] && notas[0].enlace,
  'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123');
await comprobar('y de qué correo viene', notas[0] && notas[0].correo, 'hilo-123');

console.log('--- el mismo correo otra vez ---');
await dejarElCorreo(correoDeMentira());
/* La bandeja se ha quedado vacía y ya no hay botón de "Mirar ahora":
   se vuelve a señalar la carpeta, que también la hace mirar. */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(600);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(600);
await pagina.getByRole('button', { name: 'Guardar en ese asunto' }).click();
await pagina.waitForTimeout(900);

await comprobar('no se repiten los ficheros', ficherosDelAsunto(), [
  '260903 26EA0412 SOLICITUD.pdf',
  '260909 ADJUNTO 1000082963.jpg',
  '260909 ADJUNTO LITNAC2026050413001031751487.pdf',
  '260909 CORREO.pdf',
  'Conciliación FL.pdf'
]);
await comprobar('ni la nota', (await notasDelAsunto()).length, 1);

console.log('--- la ficha del asunto ---');
await pagina.evaluate(() => { App.verAbiertos(); });
await pagina.waitForTimeout(600);
/* El asunto está "A LA ESPERA DEL TERCERO", así que vive en esa tarjeta. */
await pagina.click('.panel[data-vista="espera"]');
await pagina.waitForTimeout(300);
await pagina.click('#lista-abiertos .tarjeta-nombre');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(600);

await comprobar('los documentos salen en dos grupos',
  pagina.locator('#ficha-documentos .ficha-grupo-docs').allTextContents(),
  ['Del expediente  (2)', 'Llegados por correo  (3)']);
await comprobar('y en este orden',
  pagina.locator('#ficha-documentos .ficha-documento').allTextContents(),
  ['PDF260903 26EA0412 SOLICITUD.pdf', 'PDFConciliación FL.pdf',
   'JPG260909 ADJUNTO 1000082963.jpg',
   'PDF260909 ADJUNTO LITNAC2026050413001031751487.pdf',
   'PDF260909 CORREO.pdf']);

await comprobar('la nota enseña un botón para abrir el correo',
  pagina.locator('#ficha-notas .nota-boton').textContent(), 'Abrir en Gmail');
await comprobar('y el botón lleva a Gmail',
  pagina.locator('#ficha-notas .nota-boton').getAttribute('href'),
  'https://mail.google.com/mail/u/0/#search/rfc822msgid:abc123');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
