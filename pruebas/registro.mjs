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
       "Gestionar documentos".

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
await pagina.getByRole('button', { name: 'Gestionar documentos', exact: true }).click();
await pagina.waitForSelector('#doc-anadir');
await pagina.click('#doc-anadir');
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

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
