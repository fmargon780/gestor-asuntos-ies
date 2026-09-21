/* Prueba en navegador de verdad de "Meter en un asunto": llevar un
   documento suelto de "Por clasificar" a un asunto que ya existe.

   Fila 12 de docs/COLA.md (docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. Ojo: ese
   disco rechaza siempre el move() del navegador, así que el traslado
   pasa por el camino de copiar, comprobar el tamaño y borrar, que es
   el que se usa de verdad en las carpetas de Dropbox. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';
const OTRO = '260910 PERMISO 26-27 Ordóñez Gil, Rafael 677B';

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

/* Dos asuntos abiertos, y tres documentos sueltos en la raíz de
   asuntos abiertos: lo que deja ahí el equipo directivo. */
await pagina.evaluate(async ([nombre, otro]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [nombre]: { tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL',
                  situacion: 'A LA ESPERA DEL TERCERO' },
      [otro]: { tercero: 'Ordóñez Gil, Rafael 677B', categoria: 'PERSONAL',
                situacion: 'EN EL DEPARTAMENTO' }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(otro, { create: true });

  const raiz = window.__disco.abiertos._hijos;
  raiz.set('Escrito de Ordóñez Gil, Rafael.pdf',
    window.__disco.fich('Escrito de Ordóñez Gil, Rafael.pdf', 'el escrito'));
  raiz.set('Conciliación FL.pdf', window.__disco.fich('Conciliación FL.pdf', 'el impreso'));
  raiz.set('Otro papel cualquiera.pdf',
    window.__disco.fich('Otro papel cualquiera.pdf', 'un papel'));
}, [ASUNTO, OTRO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

async function enLaRaiz() {
  return pagina.evaluate(async () => {
    const n = [];
    for await (const p of window.__disco.abiertos.entries()) {
      if (p[1].kind === 'file') n.push(p[0]);
    }
    return n.sort();
  });
}
async function dentroDe(nombre) {
  return pagina.evaluate(async (n) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(n);
    const d = [];
    for await (const p of c.entries()) d.push(p[0]);
    return d.sort();
  }, nombre);
}
function tarjetaDe(nombre) {
  return pagina.locator('#lista-sueltos .tarjeta-suelto').filter({ hasText: nombre });
}
async function elUltimoAviso() {
  return pagina.locator('#mensajes .mensaje').last().textContent();
}

/* ============================================================
   1. LA TARJETA TRAE EL BOTÓN NUEVO, Y NO PIERDE LOS DE ANTES
   ============================================================ */
/* Desde la fila 22 (docs/SEPARAR-Y-UNIR-PDF.md, 17-sep-2026), un PDF
   lleva además Separar/Unir/Sacar páginas (y desde la fila 57,
   docs/HUECO-PARA-SELLO-Y-FIRMA.md, 18-sep-2026, también "Ajustar
   tamaño", llamado "Preparar el documento" hasta la fila 58): se
   comprueban aparte en pruebas/separar-unir-navegador.mjs, aquí solo
   que sigan estando.

   Desde la fila 36 (docs/FILAS-QUE-NO-SE-ESTRUJAN.md, 17-sep-2026), a
   la vista solo quedan "Crear asunto con él" y "Meter en un asunto":
   el resto (Abrir, Separar, Unir, Sacar páginas, Ajustar tamaño y
   Borrar) vive dentro del menú de tres puntos (U.menuDeAcciones), que
   este selector también alcanza (".acciones .boton" no distingue
   profundidad), en ese orden. */
await comprobar('1. los botones de una tarjeta de "Por clasificar"',
  tarjetaDe('Conciliación FL.pdf').locator('.acciones .boton').allTextContents(),
  ['Crear asunto con él', 'Meter en un asunto', 'Abrir', 'Separar', 'Unir', 'Sacar páginas',
    'Ajustar tamaño', 'Borrar']);

/* ============================================================
   7. PULSAR LA TARJETA LA ABRE EN EL VISOR (fila 86)
   ============================================================ */
await tarjetaDe('Otro papel cualquiera.pdf').locator('.tarjeta-texto').click();
await pagina.waitForSelector('#visor-lateral:not(.oculto)');
await comprobar('7. pulsar la tarjeta abre el documento en el visor',
  pagina.locator('#visor-lateral:not(.oculto)').count(), 1);
await comprobar('con el nombre que toca',
  pagina.locator('#visor-lateral').textContent().then(t => t.indexOf('Otro papel cualquiera.pdf') !== -1), true);

/* Pulsar un botón de la fila no tiene que abrir nada aparte, ni el
   menú de tres puntos. */
await pagina.evaluate(() => window.Visor.cerrar());
await tarjetaDe('Otro papel cualquiera.pdf').locator('.fila-menu-btn').click();
await comprobar('pulsar el menú de tres puntos no abre el visor',
  pagina.locator('#visor-lateral:not(.oculto)').count(), 0);
await pagina.keyboard.press('Escape');

/* ============================================================
   6. LA PUNTUACIÓN DE PARECIDO
   ============================================================ */
await comprobar('6. manda el asunto cuyo tercero sale en el nombre del fichero',
  pagina.evaluate(() => {
    const l = App.parecidoDelSuelto('Escrito de Ordóñez Gil, Rafael.pdf');
    return l.length ? l[0].nombre : '';
  }), OTRO);

/* ============================================================
   4. SI YA HAY UNO CON ESE NOMBRE EN EL DESTINO, NO SE PISA
   ============================================================ */
await pagina.evaluate(async (n) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(n);
  c._hijos.set('Conciliación FL.pdf',
    window.__disco.fich('Conciliación FL.pdf', 'el que ya estaba dentro'));
}, OTRO);

await tarjetaDe('Conciliación FL.pdf').getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#enlace-todos');
await pagina.fill('#enlace-buscar', 'Ordóñez');
await pagina.waitForTimeout(300);
await pagina.click('#enlace-todos .enlace-asunto');
await pagina.waitForTimeout(700);

await comprobar('4. avisa de que ya hay uno con ese nombre',
  elUltimoAviso().then(t => t.indexOf('sigue en Por clasificar') !== -1), true);
await comprobar('y el documento no se ha movido de la raíz',
  enLaRaiz().then(l => l.indexOf('Conciliación FL.pdf') !== -1), true);
await comprobar('ni se ha pisado el que ya estaba dentro',
  pagina.evaluate(async (n) => {
    const c = await window.__disco.abiertos.getDirectoryHandle(n);
    const h = await c.getFileHandle('Conciliación FL.pdf');
    return (await (await h.getFile()).text());
  }, OTRO), 'el que ya estaba dentro');

/* ============================================================
   5. SI EL TRASLADO FALLA, EL DOCUMENTO SE QUEDA DONDE ESTABA
   ============================================================ */
await pagina.evaluate(async (n) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(n);
  const antes = c.getFileHandle.bind(c);
  c._comoEra = antes;
  c.getFileHandle = async function (nombre, o) {
    if (o && o.create) throw new Error('el disco se ha puesto tonto');
    return antes(nombre, o);
  };
}, OTRO);

await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await tarjetaDe('Otro papel cualquiera.pdf')
  .getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#enlace-todos');
await pagina.fill('#enlace-buscar', 'Ordóñez');
await pagina.waitForTimeout(300);
await pagina.click('#enlace-todos .enlace-asunto');
await pagina.waitForTimeout(700);

await comprobar('5. si el traslado falla, se avisa',
  elUltimoAviso(),
  'El documento no ha podido entrar en el asunto. Sigue en Por clasificar.');
await comprobar('y el documento sigue en la raíz',
  enLaRaiz().then(l => l.indexOf('Otro papel cualquiera.pdf') !== -1), true);
await comprobar('y no se ha abierto el cuadro de ponerle nombre',
  pagina.locator('#doc-anadir').count(), 0);

await pagina.evaluate(async (n) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(n);
  c.getFileHandle = c._comoEra;
}, OTRO);

/* ============================================================
   2 y 3. ELEGIR UN ASUNTO ABIERTO: SE MUEVE Y SE ABRE EL CUADRO
   ============================================================ */
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');
await tarjetaDe('Escrito de Ordóñez Gil, Rafael.pdf')
  .getByRole('button', { name: 'Meter en un asunto' }).click();
await pagina.waitForSelector('#enlace-todos');

/* El asunto de Ordóñez sale arriba, en "Podrían encajar": su tercero
   está escrito en el nombre del fichero. */
await comprobar('el asunto que encaja sale en "Podrían encajar"',
  pagina.locator('#cuadro-cuerpo .enlace-bloque').first()
    .locator('.enlace-asunto').first().getAttribute('data-nombre'), OTRO);

await pagina.click('#cuadro-cuerpo .enlace-bloque .enlace-asunto');
await pagina.waitForTimeout(900);

await comprobar('2. el documento ha entrado en la carpeta del asunto',
  dentroDe(OTRO), ['Conciliación FL.pdf', 'Escrito de Ordóñez Gil, Rafael.pdf'].sort());
await comprobar('y ya no está en la raíz',
  enLaRaiz().then(l => l.indexOf('Escrito de Ordóñez Gil, Rafael.pdf') !== -1), false);

await pagina.waitForSelector('#doc-anadir');
await comprobar('3. se abre el cuadro de ponerle nombre',
  pagina.locator('#cuadro-titulo').textContent(), OTRO);
await comprobar('y lista los documentos que hay ahora en la carpeta',
  pagina.locator('#doc-cuerpo .nombre-documento').allTextContents()
    .then(l => l.sort()),
  ['Conciliación FL.pdf', 'Escrito de Ordóñez Gil, Rafael.pdf'].sort());
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

/* La tarjeta ha desaparecido de "Por clasificar". */
await comprobar('la tarjeta se va de "Por clasificar"',
  tarjetaDe('Escrito de Ordóñez Gil, Rafael.pdf').count(), 0);

/* "Crear asunto con él" sigue estando, y sigue haciendo lo suyo. */
await comprobar('"Crear asunto con él" sigue en su sitio',
  tarjetaDe('Otro papel cualquiera.pdf')
    .getByRole('button', { name: 'Crear asunto con él' }).count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
