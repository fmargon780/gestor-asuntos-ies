/* Prueba en navegador de verdad de la pantalla de Inicio (27-sep-2026,
   fila 209, docs/INICIO-EN-PESTANAS.md): dos columnas ("Ha llegado" +
   el tablón, siempre a la vista, a la izquierda; pestañas y una sola
   tabla a la derecha) en vez de los tres bloques + tablón + tabla de
   abajo + plegados de la fila 191/192 (docs/INICIO-CUATRO-BLOQUES.md).

   No hace falta pasar por una guía ni por Hitos.marcar para levantar
   los datos: basta con las carpetas de los asuntos, su ficha en
   asuntos.json y hitos.json escrito a mano, con el mismo esquema que
   ya normaliza js/hitos.js.

   Datos de prueba:
     - Un tipo TRASLADO (tipos.json), con `organo: SECRETARIA`.
     - Asunto A: hito actual responsable Administración, VENCIDO
       (fecha de ayer); también `ficha.limite` de ayer (para el aviso
       de "vencidos" de la franja de arriba). Tiene que salir el
       primero en "En Administración", vencido.
     - Asunto D: hito actual responsable Administración, SIN FECHA.
       Tiene que salir en "En Administración" con "Sin plazo" (fila
       209, apartado 2: ya no hace falta fecha para entrar ahí), detrás
       del vencido.
     - Asunto B: hito actual responsable "El tutor del alumnado" (la
       familia), esperando desde hace 20 días. Tiene que salir en "En
       espera", con "Familia" en "Le toca a" (nunca el nombre real: fila
       209, apartado 3bis) y los días en rojo (desde 15).
     - Asunto C: sin hitos, sin novedades desde hace 75 días. Tiene que
       salir en "Dormidos".
     - Un documento suelto en la carpeta de abiertos: tiene que salir
       en "Ha llegado", a la izquierda, junto al tablón.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
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

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CLAVE_A = '260901 TRASLADO 26-27 Uno Vencido, Ana 1111';
const CLAVE_B = '260902 TRASLADO 26-27 Dos Espera, Bea 2222';
const CLAVE_C = '260903 TRASLADO 26-27 Tres Dormido, Cris 3333';
const CLAVE_D = '260904 TRASLADO 26-27 Cuatro Sinplazo, Dani 4444';
const FECHA_AYER = isoHaceDias(1);
const DESDE_VEINTE = isoHaceDias(20);
const NOTA_VIEJA = new Date(Date.now() - 75 * 86400000).toISOString();

await pagina.evaluate(async ({ CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D, FECHA_AYER, DESDE_VEINTE, NOTA_VIEJA }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE_A, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_B, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_C, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_D, { create: true });
  /* Un papel suelto, de los de "Ha llegado". */
  abiertos._hijos.set('260926 escaneo del director.pdf',
    window.__disco.fich('260926 escaneo del director.pdf', 'un papel'));

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' }]);

  const fAsuntos = await g.getFileHandle('asuntos.json', { create: true });
  const jAsuntos = JSON.parse(await (await fAsuntos.getFile()).text() || '{"asuntos":{}}');
  jAsuntos.asuntos[CLAVE_A] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Vencido, Ana 1111', abiertoPor: 'Francisco', limite: FECHA_AYER };
  jAsuntos.asuntos[CLAVE_B] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Dos Espera, Bea 2222', abiertoPor: 'Francisco' };
  jAsuntos.asuntos[CLAVE_C] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Tres Dormido, Cris 3333', abiertoPor: 'Francisco', notaEl: NOTA_VIEJA };
  jAsuntos.asuntos[CLAVE_D] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Cuatro Sinplazo, Dani 4444', abiertoPor: 'Francisco' };
  await escribir('asuntos.json', jAsuntos);

  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: {
      [CLAVE_A]: { creados: '2026-09-01', hitos: [
        { id: 'a1', titulo: 'Revisar el expediente', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }
      ] },
      [CLAVE_B]: { creados: '2026-09-02', hitos: [
        { id: 'b1', titulo: 'Esperar respuesta de la familia', estado: 'encurso', responsable: 'tutor', desde: DESDE_VEINTE }
      ] },
      [CLAVE_D]: { creados: '2026-09-04', hitos: [
        { id: 'd1', titulo: 'Sin plazo todavía', estado: 'pendiente', responsable: 'administracion' }
      ] }
    }
  });

  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE_A, CLAVE_B, CLAVE_C, CLAVE_D, FECHA_AYER, DESDE_VEINTE, NOTA_VIEJA });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-ha-llegado-lista .tarjeta-suelto');
await pagina.waitForSelector('#tablon');

/* ================= 1. LA PESTAÑA DICE "INICIO"; SIN "ME TOCA" ================= */

console.log('--- 1. la pestaña dice "Inicio", sin "Me toca"/"Esperamos a otros" ---');
await comprobar('la pestaña de siempre dice "Inicio"',
  pagina.locator('.pestana[data-pantalla="abiertos"] span').first().textContent(), 'Inicio');
await comprobar('no hay "Me toca" en pantalla',
  pagina.locator('#pantalla-abiertos').textContent().then(t => t.indexOf('Me toca') !== -1), false);
await comprobar('ni "Esperamos a otros"',
  pagina.locator('#pantalla-abiertos').textContent().then(t => t.indexOf('Esperamos a otros') !== -1), false);
await comprobar('sí "En Administración" y "En espera"',
  pagina.locator('#inicio-pestanas').textContent().then(t => t.indexOf('En Administración') !== -1 && t.indexOf('En espera') !== -1), true);

/* ================= 2. "HA LLEGADO" Y EL TABLÓN, A LA IZQUIERDA, SIEMPRE A LA VISTA ================= */

console.log('--- 2. "Ha llegado" y el tablón, a la izquierda, sin pulsar nada ---');
await comprobar('"Ha llegado" se ve', pagina.locator('#inicio-ha-llegado').isVisible(), true);
await comprobar('el suelto sale en "Ha llegado"',
  pagina.locator('#inicio-ha-llegado-lista').textContent().then(t => t.indexOf('escaneo del director.pdf') !== -1), true);
await comprobar('el tablón se ve', pagina.locator('#tablon').isVisible(), true);
await comprobar('los dos viven en la misma columna izquierda',
  pagina.evaluate(() => document.getElementById('inicio-lado').contains(document.getElementById('tablon'))), true);
await comprobar('al entrar, la pestaña activa es "Todos los abiertos"',
  pagina.locator('.inicio-pestana.activa').getAttribute('data-pestana'), 'todos');
await comprobar('con las cuatro filas', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 4);

/* ================= 3. "EN ADMINISTRACIÓN": VENCIDO PRIMERO, SIN FECHA CON "SIN PLAZO" ================= */

console.log('--- 3. "En Administración": el vencido primero, el sin fecha con "Sin plazo" ---');
await pagina.click('.inicio-pestana[data-pestana="adm"]');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-hito="a1"]');
await comprobar('dos filas en "En Administración" (A y D)',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 2);
await comprobar('el badge rojo de la pestaña dice "1" (solo A está vencido)',
  pagina.locator('.inicio-pestana[data-pestana="adm"] .cuenta-roja').textContent(), '1');
await comprobar('la primera fila es la de A (vencida)',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().getAttribute('data-hito'), 'a1');
await comprobar('con la etiqueta "Vencido"',
  pagina.locator('#inicio-tabla-cuerpo tr[data-hito="a1"] .marca-plazo').textContent()
    .then(t => t.indexOf('Vencido') === 0), true);
await comprobar('D, sin fecha, sale detrás con "Sin plazo"',
  pagina.locator('#inicio-tabla-cuerpo tr[data-hito="d1"] .marca-plazo').textContent(), 'Sin plazo');
await comprobar('D es la segunda fila (el vencido va primero)',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').nth(1).getAttribute('data-hito'), 'd1');

console.log('--- 3b. pulsar la fila abre la mesa del hito, no la ficha a secas ---');
await pagina.click('#inicio-tabla-cuerpo tr[data-hito="a1"]');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('se abre la ficha de A', pagina.locator('.ficha-nombre-texto').textContent(), CLAVE_A);
await comprobar('con la mesa del hito a1 ya desplegada',
  pagina.locator('#ficha-guia .hito[data-id="a1"] .hito-cuerpo').getAttribute('class')
    .then(c => c === null || c.indexOf('oculto') === -1), true);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(300);

/* ================= 4. "EN ESPERA": B, CON "FAMILIA" Y LOS DÍAS EN ROJO ================= */

console.log('--- 4. "En espera": B, esperando a la familia, en rojo (20 días) ---');
await pagina.click('.inicio-pestana[data-pestana="esp"]');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-hito="b1"]');
await comprobar('una fila en "En espera"', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 1);
await comprobar('"Le toca a" dice "Familia" (nunca el nombre real: fila 209, apartado 3bis)',
  pagina.locator('#inicio-tabla-cuerpo tr[data-hito="b1"] td').nth(4).textContent(), 'Familia');
await comprobar('20 días, en rojo (desde 15)',
  pagina.locator('#inicio-tabla-cuerpo tr[data-hito="b1"] .marca-plazo').getAttribute('class')
    .then(c => c.indexOf('inicio-dias-rojo') !== -1 && c.indexOf('20') === -1), true);
await comprobar('el texto dice "20 días"',
  pagina.locator('#inicio-tabla-cuerpo tr[data-hito="b1"] .marca-plazo').textContent(), '20 días');

await pagina.click('#inicio-tabla-cuerpo tr[data-hito="b1"]');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('pulsar la fila de "En espera" abre la ficha (no la mesa)', pagina.locator('.ficha-nombre-texto').textContent(), CLAVE_B);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(300);

/* ================= 5. "DORMIDOS" ================= */

console.log('--- 5. "Dormidos": C, sin novedades desde hace 75 días ---');
await pagina.click('.inicio-pestana[data-pestana="dorm"]');
await pagina.waitForSelector('#inicio-tabla-cuerpo .inicio-tabla-fila[data-asunto="' + CLAVE_C + '"]');
await comprobar('una fila en "Dormidos"', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 1);
await comprobar('es C', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().getAttribute('data-asunto'), CLAVE_C);
await comprobar('el número junto al nombre de la pestaña',
  pagina.locator('.inicio-pestana[data-pestana="dorm"] .cuenta-lista').textContent(), '1');

/* ================= 6. PULSAR EL AVISO DE VENCIDOS FILTRA LA TABLA ================= */

console.log('--- 6. pulsar el aviso de vencidos filtra la tabla; "Quitar" lo devuelve ---');
await pagina.waitForSelector('[data-aviso="vencidos"]');
await pagina.click('[data-aviso="vencidos"]');
await pagina.waitForTimeout(300);
await comprobar('cambia a la pestaña "Todos los abiertos"',
  pagina.locator('.inicio-pestana.activa').count(), 0);   /* ninguna pestaña activa: manda el chip */
await comprobar('sale el chip "Filtrado por…"', pagina.locator('#inicio-filtrado-por').isVisible(), true);
await comprobar('la tabla deja solo el vencido', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 1);
await comprobar('y es A', pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().getAttribute('data-asunto'), CLAVE_A);

await pagina.click('#inicio-quitar-filtro');
await pagina.waitForTimeout(200);
await comprobar('el chip desaparece', pagina.locator('#inicio-filtrado-por').isHidden(), true);
await comprobar('vuelven las cuatro filas ("Todos los abiertos")',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count(), 4);

/* ================= 7. "RESPONSABLE" DENTRO DE "FILTROS", NO A LA VISTA ================= */

console.log('--- 7. "Responsable" vive dentro de "Filtros", no a la vista ---');
await comprobar('con los filtros plegados, no se ve', pagina.locator('#inicio-me-toca-responsable').isVisible(), false);
await comprobar('está dentro de #filtros-abiertos',
  pagina.evaluate(() => !!document.querySelector('#filtros-abiertos #inicio-me-toca-responsable')), true);
if (await pagina.locator('#filtros-abiertos').isHidden()) await pagina.click('#btn-filtros');
await comprobar('con "Filtros" abierto, ahí está, con su etiqueta',
  pagina.locator('#filtros-abiertos').textContent().then(t => t.indexOf('Responsable') !== -1), true);
await pagina.click('#btn-filtros');

/* ================= 8. LA COLUMNA "TERCERO", NO LA DEL NOMBRE DE CARPETA ================= */

console.log('--- 8. la tabla tiene "Tercero", no el nombre entero de la carpeta ---');
const cabeceras = await pagina.locator('#inicio-todos-asuntos thead th').allTextContents();
await comprobar('las columnas son Plazo, Tercero, Tipo, Hito actual, Le toca a, Inicio',
  cabeceras.slice(0, 6), ['Plazo', 'Tercero', 'Tipo', 'Hito actual', 'Le toca a', 'Inicio']);
await comprobar('ninguna columna se llama "Asunto"', cabeceras.indexOf('Asunto'), -1);
const filaA = pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + CLAVE_A + '"]');
await comprobar('la celda Tercero de A enseña el tercero, no el nombre entero de la carpeta',
  filaA.locator('.inicio-tabla-tercero').textContent().then(t => t.indexOf('Uno Vencido, Ana') !== -1 && t.indexOf(CLAVE_A) === -1), true);

/* ================= 9. ORDENAR POR "FECHA DE INICIO" CAMBIA EL ORDEN ================= */

console.log('--- 9. "Ordenar" por Fecha de inicio cambia el orden ---');
await comprobar('por defecto (los más antiguos arriba), A (260901) va primero',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().getAttribute('data-asunto'), CLAVE_A);
await pagina.selectOption('#orden-abiertos', 'fecha-desc');
await pagina.waitForTimeout(200);
await comprobar('con "los más recientes arriba", D (260904) va primero',
  pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').first().getAttribute('data-asunto'), CLAVE_D);
await pagina.selectOption('#orden-abiertos', 'fecha-asc');
await pagina.waitForTimeout(200);

/* ================= 10. SIN "#inicio-legado" NI LOS PLEGADOS VIEJOS ================= */

console.log('--- 10. sin la zona legado ni los plegados "Dormidos"/"Sin fecha" de antes ---');
await comprobar('sin "#inicio-legado"', pagina.locator('#inicio-legado').count(), 0);
await comprobar('sin "#inicio-plegados"', pagina.locator('#inicio-plegados').count(), 0);
await comprobar('sin "#inicio-sinfecha"', pagina.locator('#inicio-sinfecha').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
