/* Prueba en navegador de verdad de "Registrar un documento en un paso".

   Lo que tiene que pasar:
     - un documento sin registro lleva botón Registrar, en la ficha del asunto;
     - al registrarlo se elige la copia sellada, se escribe solo el número,
       y el nombre se monta con la fecha, el tipo y el texto adicional del
       original;
     - el original se queda donde estaba, y los dos aparecen en la lista;
     - se apunta una nota con el código del registro;
     - un documento que ya lleva registro no tiene botón Registrar;
     - la casilla "Pendiente de registro" deja una marca ámbar que
       desaparece al registrarlo, tanto desde la ficha como desde
       "Gestionar documentos";
     - si la copia sellada es un PDF con el sello de Séneca dentro, el
       cuadro sale ya relleno, con la línea verde de aviso; si no lleva
       sello, o no es un PDF, el cuadro sale vacío como siempre.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

/* Un PDF mínimo, válido, con una sola página y un solo trozo de texto
   dentro (el sello). No hace falta un PDF de verdad: el de muestra no
   se sube al repositorio porque lleva datos personales, y esto basta
   para que pdf.js lo lea igual. Todo el contenido es ASCII, así que
   los desplazamientos del xref son también longitudes de la cadena. */
function pdfConTexto(texto) {
  const escapado = String(texto).replace(/([()\\])/g, '\\$1');
  const stream = 'BT /F1 8 Tf 20 750 Td (' + escapado + ') Tj ET';
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 0; i < objetos.length; i++) {
    offsets.push(pdf.length);
    pdf += (i + 1) + ' 0 obj\n' + objetos[i] + '\nendobj\n';
  }
  const inicioXref = pdf.length;
  let xref = 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  pdf += xref;
  pdf += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\n' +
         'startxref\n' + inicioXref + '\n%%EOF';
  return pdf;
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'documentos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

/* El cuadro pone el foco después de mirar si el PDF trae sello (js/registro.js,
   `aplicarSelloYFoco`, con un pequeño retraso a propósito): en una máquina lenta
   tarda algo más, así que se espera a que llegue (hasta 3 s) antes de mirarlo. */
async function focoEn(id) {
  await pagina.waitForFunction((x) => document.activeElement && document.activeElement.id === x, id, { timeout: 3000 }).catch(() => {});
  return pagina.evaluate(() => document.activeElement && document.activeElement.id);
}

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Un documento sin registro va envuelto en .ficha-documento-fila, con
   la marca ámbar y el botón Registrar al lado; uno que ya tiene
   registro no lleva ese envoltorio, y no hace falta que lo lleve. */
function filaDeDocumento(nombre) {
  return pagina.evaluate((n) => {
    const botones = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento'));
    const boton = botones.find(b => b.textContent.indexOf(n) !== -1);
    if (!boton) return null;
    const fila = boton.closest('.ficha-documento-fila') || boton.parentElement;
    return {
      pendiente: fila.textContent.indexOf('Sin registrar') !== -1,
      registrar: Array.from(fila.querySelectorAll('button')).some(b => b.textContent.trim() === 'Registrar')
    };
  }, nombre);
}

const NOMBRE_ASUNTO = '260911 COMPRA Proveedor de Prueba SL 12345678A';
const FACTURA = '260911 FACTURA Referencia 123.pdf';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* Un asunto con un documento ya dentro, sin pasar por el formulario de
   Nuevo asunto: aquí solo hace falta el asunto y el documento, no cómo
   se han creado. */
await pagina.evaluate(async (datos) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto, { create: true });
  carpeta._hijos.set(datos.factura, window.__disco.fich(datos.factura, 'la factura original'));
}, { asunto: NOMBRE_ASUNTO, factura: FACTURA });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');

console.log('--- antes de registrar ---');
await comprobar('el documento sin registro lleva botón Registrar y sin marca de pendiente',
  filaDeDocumento(FACTURA), { pendiente: false, registrar: true });

console.log('--- registrar desde la ficha del asunto ---');
await pagina.getByRole('button', { name: 'Registrar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el título del cuadro dice qué documento se registra',
  pagina.locator('#cuadro-titulo').textContent().then(t => t.indexOf(FACTURA) !== -1), true);
await comprobar('el fichero elegido no es un PDF con sello: el cuadro sale vacío',
  pagina.locator('#reg-sello').textContent(), '');
await comprobar('y el foco entra en los cuatro dígitos',
  focoEn('reg-numero'), 'reg-numero');

await pagina.fill('#reg-numero', '1234');
await pagina.check('input[name="reg-sentido"][value="E"]');
await pagina.check('input[name="reg-modo"][value="M"]');
await pagina.waitForTimeout(150);
await comprobar('el nombre se monta con la fecha y el tipo del original, más el registro',
  pagina.locator('#reg-vista').textContent(), '260911 26EM1234 FACTURA Referencia 123.pdf');

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('el registrado se guarda junto al original', pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const nombres = [];
  for await (const p of carpeta.entries()) nombres.push(p[0]);
  return nombres.sort();
}, NOMBRE_ASUNTO), [FACTURA, '260911 26EM1234 FACTURA Referencia 123.pdf'].sort());

await comprobar('se apunta la nota con el código del registro', pagina.evaluate(async (asunto) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const ficha = j.asuntos[asunto];
  return ficha && ficha.notas && ficha.notas[0] && ficha.notas[0].texto;
}, NOMBRE_ASUNTO), 'Registrado 26EM1234 · ' + FACTURA);

await comprobar('el nuevo documento, ya con registro, no lleva botón Registrar',
  filaDeDocumento('260911 26EM1234 FACTURA Referencia 123.pdf'), { pendiente: false, registrar: false });
await comprobar('el original, sin registro en su nombre, lo sigue pudiendo llevar',
  filaDeDocumento(FACTURA), { pendiente: false, registrar: true });

console.log('--- un documento con la casilla "Pendiente de registro" ---');
/* Desde la fila 168, «+ Añadir documento» en la cabecera del bloque va
   directo al cuadro de añadir (antes «Documentos ▾» y luego «Añadir»). */
await pagina.click('.ficha-documentos-anadir');
await pagina.waitForSelector('#doc-vista');
await pagina.fill('#doc-fecha', '2026-09-11');
await pagina.selectOption('#doc-tipo', 'SOLICITUD');
await pagina.fill('#doc-curso', 'Prueba pendiente');
await comprobar('la casilla se ofrece cuando el documento no lleva registro',
  pagina.locator('#doc-pendiente-registro').isVisible(), true);
await pagina.check('#doc-pendiente-registro');
await pagina.waitForTimeout(100);
await pagina.click('#doc-guardar');
await pagina.waitForSelector('#doc-cuerpo .fila-documento');
await comprobar('la marca ámbar sale también dentro de "Gestionar documentos"',
  pagina.locator('#doc-cuerpo .marca-sin-registrar').count(), 1);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

const SOLICITUD = '260911 SOLICITUD Prueba pendiente.pdf';
await comprobar('la marca ámbar y el botón destacado salen en la ficha',
  filaDeDocumento(SOLICITUD), { pendiente: true, registrar: true });

console.log('--- registrarlo quita la marca de pendiente ---');
await pagina.evaluate((n) => {
  const filas = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
  const fila = filas.find(f => f.textContent.indexOf(n) !== -1);
  Array.from(fila.querySelectorAll('button')).find(b => b.textContent.trim() === 'Registrar').click();
}, SOLICITUD);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('#reg-numero', '99');
await pagina.check('input[name="reg-sentido"][value="S"]');
await pagina.check('input[name="reg-modo"][value="A"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('al registrarlo, la marca de pendiente desaparece',
  filaDeDocumento('260911 26SA0099 SOLICITUD Prueba pendiente.pdf'), { pendiente: false, registrar: false });

await comprobar('y se ha quitado de "pendientesRegistro" en la ficha del asunto', pagina.evaluate(async (asunto) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const ficha = j.asuntos[asunto];
  return (ficha && ficha.pendientesRegistro) || [];
}, NOMBRE_ASUNTO), []);

console.log('--- leer el sello de Séneca, del propio PDF ---');

/* Vuelve a la ficha para que "Gestionar documentos" no siga abierto,
   deja un documento nuevo en la carpeta y pone la copia sellada que
   elegirá el selector de ficheros (siempre el mismo fichero de
   mentira, window.__disco.externo). */
async function prepararDocumentoYSello(nombreOriginal, textoSello) {
  await pagina.evaluate(async (datos) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(datos.asunto);
    carpeta._hijos.set(datos.nombre, window.__disco.fich(datos.nombre, 'el original'));
    window.__disco.externo = window.__disco.fich('sello.pdf', datos.pdf, 'application/pdf');
  }, { asunto: NOMBRE_ASUNTO, nombre: nombreOriginal, pdf: pdfConTexto(textoSello) });

  /* Se vuelve a abrir la ficha para que la lista de documentos se
     relea con el fichero recién dejado en la carpeta. */
  await pagina.click('#ficha-volver');
  await pagina.waitForSelector('#lista-abiertos .nombre-pulsable');
  await pagina.click('#lista-abiertos .nombre-pulsable');
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');
}

console.log('--- entrada, serie manual ---');
await prepararDocumentoYSello('260911 CERTIFICADO Con sello entrada.pdf',
  '2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02');
await pagina.evaluate((n) => {
  const filas = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
  const fila = filas.find(f => f.textContent.indexOf(n) !== -1);
  Array.from(fila.querySelectorAll('button')).find(b => b.textContent.trim() === 'Registrar').click();
}, '260911 CERTIFICADO Con sello entrada.pdf');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#reg-sello.aviso-bueno');

await comprobar('la línea verde dice que se ha leído del sello',
  pagina.locator('#reg-sello').textContent(), 'Leído del sello de Séneca.');
await comprobar('el año, entrada, manual y el número salen solos',
  pagina.evaluate(() => ({
    ano: document.getElementById('reg-ano').value,
    sentido: document.querySelector('input[name="reg-sentido"]:checked').value,
    modo: document.querySelector('input[name="reg-modo"]:checked').value,
    numero: document.getElementById('reg-numero').value
  })), { ano: '26', sentido: 'E', modo: 'M', numero: '0368' });
await comprobar('el foco va directo al botón de aceptar: solo hay que confirmar',
  focoEn('cuadro-aceptar'), 'cuadro-aceptar');

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('se guarda con el código leído del sello', pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const nombres = [];
  for await (const p of carpeta.entries()) nombres.push(p[0]);
  return nombres.indexOf('260911 26EM0368 CERTIFICADO Con sello entrada.pdf') !== -1;
}, NOMBRE_ASUNTO), true);
await comprobar('la nota lleva también la fecha del sello', pagina.evaluate(async (asunto) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const notas = (j.asuntos[asunto] && j.asuntos[asunto].notas) || [];
  return notas.some(n => n.texto === 'Registrado 26EM0368 el 10/09/2026 · 260911 CERTIFICADO Con sello entrada.pdf');
}, NOMBRE_ASUNTO), true);

console.log('--- salida, serie automática ---');
await prepararDocumentoYSello('260911 CERTIFICADO Con sello salida.pdf',
  '2026/29700692/A000000000099SALIDAFecha: 01/09/2026 09:00:00');
await pagina.evaluate((n) => {
  const filas = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
  const fila = filas.find(f => f.textContent.indexOf(n) !== -1);
  Array.from(fila.querySelectorAll('button')).find(b => b.textContent.trim() === 'Registrar').click();
}, '260911 CERTIFICADO Con sello salida.pdf');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#reg-sello.aviso-bueno');
await comprobar('sale la salida y la serie automática',
  pagina.evaluate(() => ({
    sentido: document.querySelector('input[name="reg-sentido"]:checked').value,
    modo: document.querySelector('input[name="reg-modo"]:checked').value,
    numero: document.getElementById('reg-numero').value
  })), { sentido: 'S', modo: 'A', numero: '0099' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('se guarda con el registro de salida', pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const nombres = [];
  for await (const p of carpeta.entries()) nombres.push(p[0]);
  return nombres.indexOf('260911 26SA0099 CERTIFICADO Con sello salida.pdf') !== -1;
}, NOMBRE_ASUNTO), true);

console.log('--- un número de más de cuatro cifras, se deja entero y avisa ---');
await prepararDocumentoYSello('260911 CERTIFICADO Con sello largo.pdf',
  '2026/29700692/M000000012345ENTRADAFecha: 05/09/2026 08:30:00');
await pagina.evaluate((n) => {
  const filas = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
  const fila = filas.find(f => f.textContent.indexOf(n) !== -1);
  Array.from(fila.querySelectorAll('button')).find(b => b.textContent.trim() === 'Registrar').click();
}, '260911 CERTIFICADO Con sello largo.pdf');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForSelector('#reg-sello.aviso-bueno');
await comprobar('el número se deja entero, sin recortar',
  pagina.locator('#reg-numero').inputValue(), '12345');
await comprobar('y avisa de que tiene más de cuatro cifras',
  pagina.locator('#mensajes').textContent().then(t => t.indexOf('más de cuatro cifras') !== -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('se guarda con el número completo', pagina.evaluate(async (asunto) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(asunto);
  const nombres = [];
  for await (const p of carpeta.entries()) nombres.push(p[0]);
  return nombres.indexOf('260911 26EM12345 CERTIFICADO Con sello largo.pdf') !== -1;
}, NOMBRE_ASUNTO), true);

console.log('--- un PDF sin sello no rellena nada ---');
await prepararDocumentoYSello('260911 CERTIFICADO Sin sello.pdf', 'Un PDF cualquiera, sin el texto del sello.');
await pagina.evaluate((n) => {
  const filas = Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
  const fila = filas.find(f => f.textContent.indexOf(n) !== -1);
  Array.from(fila.querySelectorAll('button')).find(b => b.textContent.trim() === 'Registrar').click();
}, '260911 CERTIFICADO Sin sello.pdf');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(600);
await comprobar('el cuadro sale vacío, como siempre',
  pagina.locator('#reg-sello').textContent(), '');
await comprobar('y el foco entra en los cuatro dígitos',
  focoEn('reg-numero'), 'reg-numero');
await pagina.click('#cuadro-cancelar');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
