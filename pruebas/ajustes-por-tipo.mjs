/* Prueba en navegador de verdad de la pantalla propia de un tipo de
   asunto (17-sep-2026, fila 39 de docs/COLA.md, docs/AJUSTES-POR-TIPO.md).

   Antes de este cambio, Ajustes era una sola pantalla larguísima con
   once bloques uno detrás de otro. Ahora tiene tres pestañas arriba
   (Tipos de asunto · El centro · Mantenimiento) y pulsar una tarjeta
   de tipo abre su PANTALLA ENTERA, a dos columnas, con sus secciones
   ya desplegadas: Datos del tipo, Campos, Pasos del trámite, Palabras
   clave (17-sep-2026, fila 41), Plantillas de correo y de Séneca,
   Plantilla de documento de Word, Plazo y Se repite.

   Lo que comprueba:
     1. Las tres pestañas de Ajustes existen y cambian de contenido.
     2. Pulsar una tarjeta de tipo abre su pantalla entera, con todas
        las secciones a la vista, sin plegar.
     3. Cambiar algo en dos secciones (Plazo y Campos) lo guarda de
        verdad, en tipos.json y en campos.json.
     4. Volver a la lista (botón "← Volver", que pone solo js/
        usabilidad.js) no pierde ni la categoría ni el texto del
        buscador que había antes de entrar.
     5. La tecla Escape hace lo mismo que el botón de volver.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/ajustes-agil.mjs y pruebas/campos.mjs. Corre a 1905 píxeles,
   el ancho del monitor del trabajo. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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

async function leerJson(nombreFichero) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombreFichero);
}

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');

/* ================================================================
   1. Las tres pestañas de Ajustes.
   ================================================================ */
console.log('--- 1. las tres pestañas de Ajustes ---');

await comprobar('la pestaña "Tipos de asunto" empieza activa',
  pagina.locator('.pestana-ajustes.activa').textContent(), 'Tipos de asunto');
await comprobar('la lista de tipos se ve de partida',
  pagina.locator('#ajustes-tab-tipos').isVisible(), true);
await comprobar('"El centro" empieza oculta', pagina.locator('#ajustes-tab-centro').isVisible(), false);

await pagina.click('[data-ajustes-pestana="centro"]');
await comprobar('"El centro" pasa a verse', pagina.locator('#ajustes-tab-centro').isVisible(), true);
await comprobar('"Tipos de asunto" se oculta', pagina.locator('#ajustes-tab-tipos').isVisible(), false);
await pagina.evaluate(() => document.querySelectorAll('#ajustes-tab-centro details').forEach((d) => { d.open = true; }));
await comprobar('"El centro" trae Campos propios, Grupos y Datos del centro, y ya no Estados (fila 129)',
  pagina.locator('#ajustes-tab-centro').textContent().then((t) =>
    t.indexOf('Estados del asunto') === -1 && t.indexOf('Campos propios') !== -1 &&
    t.indexOf('Grupos de personas') !== -1 && t.indexOf('Datos del centro y firma') !== -1), true);

await pagina.click('[data-ajustes-pestana="mantenimiento"]');
await comprobar('"Mantenimiento" pasa a verse', pagina.locator('#ajustes-tab-mantenimiento').isVisible(), true);
await pagina.evaluate(() => document.querySelectorAll('#ajustes-tab-mantenimiento details').forEach((d) => { d.open = true; }));
await comprobar('"Mantenimiento" trae Copias, Papelera y las carpetas de este ordenador',
  pagina.locator('#ajustes-tab-mantenimiento').textContent().then((t) =>
    t.indexOf('Copias de seguridad') !== -1 && t.indexOf('Papelera') !== -1 &&
    t.indexOf('Carpetas de este ordenador') !== -1), true);

/* Se vuelve a "Tipos de asunto" y se cambia a EMPRESAS, para abrir
   luego COMPRA: así la prueba 4 puede comprobar de verdad que la
   categoría sobrevive a entrar y salir de un tipo. */
await pagina.click('[data-ajustes-pestana="tipos"]');
await pagina.selectOption('#nueva-categoria', 'EMPRESAS');
await comprobar('la categoría EMPRESAS queda puesta', pagina.locator('#nueva-categoria').inputValue(), 'EMPRESAS');
await pagina.fill('#buscar-tipos', '');

/* ================================================================
   2. Pulsar una tarjeta abre la pantalla entera del tipo, con las
      siete secciones a la vista, sin plegar.
   ================================================================ */
console.log('--- 2. la pantalla de un tipo, con sus siete secciones ---');

const tarjetaCompra = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'COMPRA' });
await tarjetaCompra.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');

await comprobar('el nombre del tipo sale en la cabecera',
  pagina.locator('#tipo-asunto-nombre').textContent(), 'COMPRA');
await comprobar('la categoría sale al lado',
  pagina.locator('#tipo-asunto-categoria').textContent(), 'EMPRESAS');
await comprobar('la pantalla de Ajustes ha quedado oculta detrás',
  pagina.locator('#pantalla-ajustes').isHidden(), true);

const SECCIONES = ['Datos del tipo', 'Campos', 'Pasos del trámite', 'Palabras clave',
  'Plantillas de correo y de Séneca', 'Plantilla de documento de Word', 'Plazo', 'Se repite'];
await pagina.waitForTimeout(300);
/* Fila 105 (docs/AJUSTES-PLEGADO.md): las ocho secciones nacen
   plegadas, cada una con su título; para el resto de esta prueba se
   despliegan todas. */
await comprobar('están las ocho secciones, plegadas, cada una con su título',
  pagina.locator('#tipo-asunto-cuerpo .tipo-asunto-seccion > summary .bloque-titulo').allTextContents().then((titulos) => {
    const mismos = SECCIONES.every((s) => titulos.indexOf(s) !== -1);
    return mismos && titulos.length === SECCIONES.length;
  }), true);
await comprobar('ninguna sale desplegada la primera vez',
  pagina.locator('#pantalla-tipo-asunto details[open]').count(), 0);
await pagina.evaluate(() => document.querySelectorAll('#pantalla-tipo-asunto details').forEach((d) => { d.open = true; }));

await comprobar('las dos columnas están, una a cada lado',
  pagina.evaluate(() => {
    const c1 = document.getElementById('tipo-asunto-col-1').getBoundingClientRect();
    const c2 = document.getElementById('tipo-asunto-col-2').getBoundingClientRect();
    return c1.left < c2.left;
  }), true);

/* ================================================================
   3. Cambiar algo en dos secciones: Plazo y Campos.
   ================================================================ */
console.log('--- 3. cambiar el Plazo y los Campos, y que se guarden de verdad ---');

/* La que tiene el campo del plazo (desde la fila 102, la tabla de huecos
   de las plantillas también dice «Plazo del hito», y .last() ya no valía). */
const seccionPlazo = pagina.locator('.tipo-asunto-seccion').filter({ has: pagina.locator('.campo-plazo') }).last();
await seccionPlazo.locator('.campo-plazo').fill('12');
await seccionPlazo.locator('.campo-plazo').blur();
await pagina.waitForTimeout(300);
await comprobar('el plazo de COMPRA se guarda en tipos.json',
  leerJson('tipos.json').then((t) => t.filter((x) => x.tipo === 'COMPRA')[0].plazo), 12);

/* Fila 56, 18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md: el
   catálogo ya no está desplegado en la sección, se abre con
   "+ Añadir campo" (pestaña "De la ficha", la que sale de partida). */
await pagina.click('#campos-btn-anadir');
await pagina.waitForSelector('#campos-catalogo-ficha-lista .fila-tipo');
await pagina.locator('#campos-catalogo-ficha-lista .fila-tipo').first().getByRole('button', { name: 'Añadir' }).click();
await pagina.click('#campos-catalogo-volver');
await pagina.waitForSelector('#campos-puestos');
await comprobar('el campo elegido pasa a la lista de puestos',
  pagina.locator('#campos-puestos .fila-tipo').count(), 1);
await pagina.click('#campos-guardar');
await pagina.waitForTimeout(300);
await comprobar('se guarda un campo de COMPRA en campos.json',
  leerJson('campos.json').then((j) => (j.porTipo.COMPRA || []).length), 1);

/* ================================================================
   4. Volver a la lista sin perder la categoría ni el buscador.
   ================================================================ */
console.log('--- 4. volver sin perder la categoría ni el buscador ---');

await pagina.click('#pantalla-tipo-asunto .boton-volver');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');

await comprobar('la pestaña "Tipos de asunto" sigue activa', pagina.locator('.pestana-ajustes.activa').textContent(), 'Tipos de asunto');
await comprobar('la categoría sigue en EMPRESAS', pagina.locator('#nueva-categoria').inputValue(), 'EMPRESAS');
await comprobar('COMPRA sigue en la rejilla',
  pagina.locator('#tabla-tipos .tarjeta-tipo-nombre').allTextContents().then((n) => n.indexOf('COMPRA') !== -1), true);

/* Ahora con el buscador escrito, para probar que ESE tampoco se
   pierde: se busca "fac" (encuentra FACTURA, de EMPRESAS también). */
await pagina.fill('#buscar-tipos', 'fac');
await pagina.waitForTimeout(150);
const tarjetaFactura = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'FACTURA' });
await tarjetaFactura.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.click('#pantalla-tipo-asunto .boton-volver');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await comprobar('el buscador sigue con "fac" escrito', pagina.locator('#buscar-tipos').inputValue(), 'fac');
await comprobar('solo se ve FACTURA (el buscador sigue filtrando)',
  pagina.locator('#tabla-tipos .tarjeta-tipo-nombre').allTextContents(), ['FACTURA']);
await pagina.fill('#buscar-tipos', '');

/* ================================================================
   5. Escape hace lo mismo que "← Volver".
   ================================================================ */
console.log('--- 5. Escape vuelve a la lista igual que el botón ---');

await tarjetaCompra.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#pantalla-ajustes:not(.oculto)');
await comprobar('Escape también deja la categoría en EMPRESAS', pagina.locator('#nueva-categoria').inputValue(), 'EMPRESAS');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
