/* Prueba en navegador de verdad de "que no se dupliquen los asuntos"
   (docs/NO-DUPLICAR-ASUNTOS.md, 11-sep-2026) y de "los duplicados, a
   su propia pantalla" (docs/UNIR-VER-DENTRO.md, 11-sep-2026).

   Lo que tiene que pasar:
     - el caso real (dos carpetas de TRANSPORTE del mismo alumno, mismo
       curso, que solo se diferencian en el grupo) para al crear y
       avisa;
     - dos MATRICULA del mismo alumno en cursos distintos NO avisan: se
       crea directamente;
     - con varios candidatos, el de partida es el abierto más
       reciente, y "Abrir el que ya existe" lleva a su ficha sin crear
       nada nuevo;
     - con un candidato archivado, "Abrir el que ya existe" lleva a su
       carpeta en el ARCHIVO;
     - ya no hay franja encima de la lista de asuntos abiertos: en su
       lugar, un aviso de una sola línea junto al botón "Tablón", que
       lleva a la pantalla de Duplicados;
     - esa pantalla enseña cada grupo en columnas, con el nombre como
       enlace a la ficha, sus documentos (se abren en el visor) y sus
       últimas notas;
     - "Unir" seguido desde ahí hace lo mismo de siempre: junta
       ficheros y notas y borra el que sobra;
     - si hay un fichero con el mismo nombre en las dos carpetas, no se
       mueve ni se borra nada, y desde ahí se puede descartar el grupo
       con "No son el mismo";
     - un grupo descartado deja de avisar, pero vuelve a avisar solo
       si cambia quién lo forma (se crea un tercer asunto que encaja);
     - en Ajustes, "Duplicados descartados" lista lo descartado y deja
       "Volver a avisar".

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

function crearCarpeta(nombre) {
  return pagina.evaluate((n) => window.__disco.abiertos.getDirectoryHandle(n, { create: true }), nombre);
}

function nombresDeAbiertos() {
  return pagina.evaluate(async () => {
    const nombres = [];
    for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
    return nombres;
  });
}

async function darDeAltaAlumno(nombre, id) {
  await pagina.getByRole('button', { name: '+ Dar de alta un solicitante' }).click();
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.fill('.alta-campo[data-campo="Nombre"]', nombre);
  await pagina.fill('.alta-campo[data-campo="Nº Id. Escolar"]', id);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
}

async function leerJson(nombre) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombre);
}

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

await comprobar('sin duplicados de partida, el aviso no se ve',
  pagina.locator('#btn-duplicados').isHidden(), true);

/* ============================================================
   1. EL CASO REAL: mismo tercero, tipo y curso, solo cambia el grupo
   ============================================================ */
console.log('--- el caso real: TRANSPORTE con y sin grupo en el nombre ---');

const EXISTENTE = '260904 TRANSPORTE 26-27 1ºD State, Ricardo Catalán 7731644';
const NUEVA = '260904 TRANSPORTE 26-27 State, Ricardo Catalán 7731644';
await crearCarpeta(EXISTENTE);
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#lista-abiertos .tarjeta');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
await pagina.getByRole('button', { name: 'TRANSPORTE', exact: true }).click();
await pagina.fill('#buscar-tercero', 'State');
await pagina.waitForTimeout(300);
await darDeAltaAlumno('State, Ricardo Catalán', '7731644');
await pagina.fill('#campo-fecha', '2026-09-04');
await pagina.waitForTimeout(150);
await comprobar('el curso se calcula solo, 26-27', pagina.locator('#campo-curso').inputValue(), '26-27');

await pagina.click('#btn-crear');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('sale el aviso de que el asunto ya existe',
  pagina.locator('#cuadro-titulo').textContent(), 'Este asunto ya existe');
await comprobar('dice el nombre de la carpeta que ya hay',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf(EXISTENTE) !== -1), true);
await comprobar('el botón destacado es "Abrir el que ya existe"',
  pagina.locator('#dup-abrir').textContent(), 'Abrir el que ya existe');
await comprobar('el de crear otro queda como el discreto',
  pagina.locator('#cuadro-aceptar').evaluate(b => b.classList.contains('boton-principal')), false);

await pagina.click('#cuadro-aceptar');   /* "Crear otro de todas formas" */
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('las dos carpetas conviven',
  nombresDeAbiertos().then(n => n.filter(x => x.indexOf('TRANSPORTE') !== -1).sort()),
  [EXISTENTE, NUEVA].sort());

/* ============================================================
   2. CURSOS DISTINTOS: no es el mismo asunto
   ============================================================ */
console.log('--- dos MATRICULA del mismo alumno, cursos distintos: no avisa ---');

const NEG_EXISTENTE = '250115 MATRICULA 24-25 Negativo Prueba, Ana 5551234';
await crearCarpeta(NEG_EXISTENTE);
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(200);

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Negativo');
await pagina.waitForTimeout(300);
await darDeAltaAlumno('Negativo Prueba, Ana', '5551234');
await pagina.fill('#campo-fecha', '2026-09-05');
await pagina.waitForTimeout(150);
await comprobar('el curso del segundo caso es 26-27', pagina.locator('#campo-curso').inputValue(), '26-27');

await pagina.click('#btn-crear');
await pagina.waitForTimeout(400);
await comprobar('con el curso distinto no sale el cuadro', pagina.locator('#capa').isHidden(), true);
await comprobar('la carpeta se crea directamente', nombresDeAbiertos().then(n =>
  n.some(x => x.indexOf('MATRICULA') !== -1 && x.indexOf('26-27') !== -1 && x.indexOf('Negativo Prueba') !== -1)), true);

/* ============================================================
   3. VARIOS CANDIDATOS ABIERTOS: el más reciente, y "Abrir"
   ============================================================ */
console.log('--- con dos candidatos abiertos, "Abrir el que ya existe" lleva a la ficha ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'TRANSPORTE', exact: true }).click();
await pagina.fill('#buscar-tercero', 'State');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-04');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('de partida se elige el abierto más reciente',
  pagina.evaluate(() => {
    const m = document.querySelector('input[name="dup-cual"]:checked');
    return m ? m.closest('.dup-opcion').textContent.trim() : null;
  }), NUEVA);

await pagina.click('#dup-abrir');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('lleva a la ficha del asunto elegido', pagina.locator('.ficha-nombre').textContent(), NUEVA);
await comprobar('no se ha creado una tercera carpeta',
  nombresDeAbiertos().then(n => n.filter(x => x.indexOf('TRANSPORTE') !== -1).length), 2);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ============================================================
   4. UN CANDIDATO ARCHIVADO: "Abrir" lleva a su carpeta en el ARCHIVO
   ============================================================ */
console.log('--- un candidato archivado lleva al ARCHIVO ---');

const ARCHIVADO = '250115 TRANSPORTE 26-27 Reserva State, Ricardo Catalán 7731644';
await pagina.evaluate(async (nombre) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle('State, Ricardo Catalán 7731644', { create: true });
  await ter.getDirectoryHandle(nombre, { create: true });
}, ARCHIVADO);

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'TRANSPORTE', exact: true }).click();
await pagina.fill('#buscar-tercero', 'State');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-04');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('con tres candidatos, salen los tres',
  pagina.locator('input[name="dup-cual"]').count(), 3);
await comprobar('el archivado lleva su marca',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('en el ARCHIVO') !== -1), true);

await pagina.check('input[name="dup-cual"][value="2"]');
await pagina.click('#dup-abrir');
await pagina.waitForSelector('#pantalla-archivo:not(.oculto)');
await pagina.waitForTimeout(500);
await comprobar('el buscador del archivo se rellena con su nombre',
  pagina.locator('#buscar-archivo').inputValue(), ARCHIVADO);
await comprobar('y el archivo lo enseña', pagina.locator('#lista-archivo .tarjeta').count(), 1);
await comprobar('no se ha creado una cuarta carpeta abierta',
  nombresDeAbiertos().then(n => n.filter(x => x.indexOf('TRANSPORTE') !== -1).length), 2);

/* ============================================================
   5. EL AVISO JUNTO A "TABLÓN": YA NO HAY FRANJA
   ============================================================ */
console.log('--- el aviso de una línea junto a Tablón, sin franja encima de la lista ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);

await comprobar('ya no existe ninguna franja encima de la lista',
  pagina.locator('#franja-unir').count(), 0);
await comprobar('el aviso se ve, con el grupo de TRANSPORTE',
  pagina.locator('#btn-duplicados').isVisible(), true);
await comprobar('dice cuántos posibles duplicados hay',
  pagina.locator('#btn-duplicados').textContent(), '⚠ 1 posible duplicado — Revisar');

/* ============================================================
   6. LA PANTALLA DE DUPLICADOS: COLUMNAS, DOCUMENTOS Y NOTAS
   ============================================================ */
console.log('--- la pantalla de Duplicados: columnas, documentos y notas ---');

/* Un documento distinto en cada carpeta, para comprobar que se abren
   en el visor de siempre. Y varias notas en EXISTENTE, para comprobar
   que solo salen las 3 últimas y el "y N más". */
await pagina.evaluate(async (datos) => {
  const cE = await window.__disco.abiertos.getDirectoryHandle(datos.existente);
  cE._hijos.set('260904 SOLICITUD Transporte.pdf', window.__disco.fich('260904 SOLICITUD Transporte.pdf', 'a'));
  const cN = await window.__disco.abiertos.getDirectoryHandle(datos.nueva);
  cN._hijos.set('260905 CERTIFICADO Direccion.pdf', window.__disco.fich('260905 CERTIFICADO Direccion.pdf', 'b'));
}, { existente: EXISTENTE, nueva: NUEVA });

await pagina.evaluate(async (datos) => {
  await window.App.anotar(datos.existente, {
    notas: [
      { texto: 'Nota 1', quien: 'Francisco', cuando: '2026-09-04T09:00:00.000Z' },
      { texto: 'Nota 2', quien: 'Francisco', cuando: '2026-09-04T09:05:00.000Z' },
      { texto: 'Nota 3', quien: 'Francisco', cuando: '2026-09-04T09:10:00.000Z' },
      { texto: 'Nota 4', quien: 'Francisco', cuando: '2026-09-04T09:15:00.000Z' }
    ]
  });
  await window.App.anotar(datos.nueva, {
    notas: [{ texto: 'Nota del segundo', quien: 'Francisco', cuando: '2026-09-05T10:00:00.000Z' }],
    pasosHechos: ['paso-uno']
  });
}, { existente: EXISTENTE, nueva: NUEVA });

await pagina.click('#btn-recargar');
await pagina.click('#btn-duplicados');
await pagina.waitForSelector('#pantalla-duplicados:not(.oculto)');
await comprobar('se sale de la pantalla de asuntos abiertos',
  pagina.locator('#pantalla-abiertos').isHidden(), true);
await comprobar('el grupo se ve con sus dos columnas',
  pagina.locator('.columna-duplicado').count(), 2);
await comprobar('el nombre de cada asunto sale como enlace',
  pagina.locator('.columna-nombre').allTextContents(), [EXISTENTE, NUEVA]);

const columnaExistente = pagina.locator('.columna-duplicado').filter({ hasText: EXISTENTE });
await pagina.waitForFunction(() =>
  document.querySelectorAll('.columna-documento').length >= 2);
await comprobar('el documento de cada asunto sale en su columna',
  columnaExistente.locator('.columna-documento').first().textContent(),
  '260904 SOLICITUD Transporte.pdf');
await comprobar('solo salen las 3 notas más recientes, la última primero',
  columnaExistente.locator('.columna-nota-texto').allTextContents(),
  ['Nota 4', 'Nota 3', 'Nota 2']);
await comprobar('y avisa de cuántas quedan sin enseñar',
  columnaExistente.locator('.columna-nota ~ p.nota').textContent(), 'y 1 más.');

/* el documento se abre en el visor de siempre */
await columnaExistente.locator('.columna-documento').first().click();
await pagina.waitForTimeout(200);
await comprobar('el documento se abre en el visor lateral',
  pagina.evaluate(() => document.body.classList.contains('con-visor')), true);
await comprobar('con el nombre del documento',
  pagina.locator('#visor-nombre').textContent(), '260904 SOLICITUD Transporte.pdf');
await pagina.click('#visor-cerrar');

/* el nombre lleva a la ficha del asunto */
await pagina.locator('.columna-nombre').filter({ hasText: NUEVA }).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('el nombre de la columna abre la ficha de ese asunto',
  pagina.locator('.ficha-nombre').textContent(), NUEVA);
await pagina.click('#ficha-volver');

/* ============================================================
   7. UNIR SIGUE FUNCIONANDO IGUAL, DESDE LA PANTALLA DE DUPLICADOS
   ============================================================ */
console.log('--- unir, desde la pantalla de Duplicados ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.click('#btn-duplicados');
await pagina.waitForSelector('#pantalla-duplicados:not(.oculto)');

await pagina.getByRole('button', { name: 'Unir', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('pregunta cuál se queda', pagina.locator('#cuadro-titulo').textContent(), '¿Cuál se queda?');
await comprobar('de partida, el de nombre más largo',
  pagina.evaluate(() => {
    const m = document.querySelector('input[name="unir-cual"]:checked');
    return m ? m.closest('.dup-opcion').textContent.trim() : null;
  }), EXISTENTE);

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);

await comprobar('la carpeta del que se va ha desaparecido', pagina.evaluate(async (nombre) => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return nombres.indexOf(nombre) === -1;
}, NUEVA), true);

await comprobar('los ficheros de los dos están juntos en el que se queda', pagina.evaluate(async (nombre) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre);
  const dentro = [];
  for await (const p of carpeta.entries()) dentro.push(p[0]);
  return dentro.sort();
}, EXISTENTE), ['260904 SOLICITUD Transporte.pdf', '260905 CERTIFICADO Direccion.pdf'].sort());

const hoy = new Date();
const fechaHoyTexto = String(hoy.getDate()).padStart(2, '0') + '/' +
  String(hoy.getMonth() + 1).padStart(2, '0') + '/' + hoy.getFullYear();

await comprobar('las notas de los dos se combinan, y se apunta la unión', pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const notas = (j.asuntos[nombre] && j.asuntos[nombre].notas) || [];
  return notas.map(n => n.texto);
}, EXISTENTE), ['Nota 1', 'Nota 2', 'Nota 3', 'Nota 4', 'Nota del segundo',
  'Unido con la carpeta «' + NUEVA + '» el ' + fechaHoyTexto]);

await comprobar('los pasos hechos se copian del otro, porque este no tenía ninguno', pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return (j.asuntos[nombre] && j.asuntos[nombre].pasosHechos) || [];
}, EXISTENTE), ['paso-uno']);

await comprobar('tras unir, la pantalla de Duplicados se queda al día, sin ese grupo',
  pagina.locator('#duplicados-lista .vacio').textContent(),
  'No hay ningún posible duplicado ahora mismo.');
await comprobar('y el aviso de la cabecera se esconde',
  pagina.locator('#btn-duplicados').isHidden(), true);

await pagina.click('#dup-pantalla-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ============================================================
   8. FICHERO QUE CHOCA, Y "NO SON EL MISMO"
   ============================================================ */
console.log('--- unir con un fichero del mismo nombre en las dos carpetas, y descartar el grupo ---');

const SANC_A = '260906 SANCION 26-27 1ºA Choque, Pedro 9998887';
const SANC_B = '260906 SANCION 26-27 Choque, Pedro 9998887';
await pagina.evaluate(async (datos) => {
  const a = await window.__disco.abiertos.getDirectoryHandle(datos.a, { create: true });
  a._hijos.set('mismo.pdf', window.__disco.fich('mismo.pdf', 'contenido A'));
  const b = await window.__disco.abiertos.getDirectoryHandle(datos.b, { create: true });
  b._hijos.set('mismo.pdf', window.__disco.fich('mismo.pdf', 'contenido B'));
}, { a: SANC_A, b: SANC_B });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#btn-duplicados:not(.oculto)');
await pagina.click('#btn-duplicados');
await pagina.waitForSelector('#pantalla-duplicados:not(.oculto)');

await pagina.getByRole('button', { name: 'Unir', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');   /* acepta "¿Cuál se queda?" con el de partida */
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('avisa de que no se puede unir todavía',
  pagina.locator('#cuadro-titulo').textContent(), 'No se puede unir todavía');
await comprobar('dice cuál fichero choca',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('mismo.pdf') !== -1), true);
await comprobar('este cuadro no lleva botón de cancelar',
  pagina.locator('#cuadro-cancelar').isHidden(), true);

await pagina.click('#cuadro-aceptar');   /* "Entendido" */
await pagina.waitForTimeout(300);

await comprobar('las dos carpetas siguen ahí, sin tocar', pagina.evaluate(async (datos) => {
  const a = await window.__disco.abiertos.getDirectoryHandle(datos.a);
  const b = await window.__disco.abiertos.getDirectoryHandle(datos.b);
  const na = []; for await (const p of a.entries()) na.push(p[0]);
  const nb = []; for await (const p of b.entries()) nb.push(p[0]);
  return [na, nb];
}, { a: SANC_A, b: SANC_B }), [['mismo.pdf'], ['mismo.pdf']]);

/* como no se ha podido unir, se descarta el grupo desde ahí mismo */
await pagina.getByRole('button', { name: 'No son el mismo', exact: true }).click();
await pagina.waitForTimeout(300);
await comprobar('el grupo desaparece de la pantalla tras descartarlo',
  pagina.locator('#duplicados-lista .vacio').textContent(),
  'No hay ningún posible duplicado ahora mismo.');
await comprobar('se guarda el descarte, con quién lo hizo y los dos nombres', leerJson('no-duplicados.json'),
  { descartados: [{
    firma: [SANC_A, SANC_B].sort().join(''),
    nombres: [SANC_A, SANC_B].sort(),
    el: await pagina.evaluate(async () => {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const h = await g.getFileHandle('no-duplicados.json');
      const j = JSON.parse(await (await h.getFile()).text());
      return j.descartados[0].el;
    }),
    por: 'Francisco'
  }] });

await pagina.click('#dup-pantalla-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('el aviso ya no sale: el único grupo estaba descartado',
  pagina.locator('#btn-duplicados').isHidden(), true);

/* ============================================================
   9. EL GRUPO DESCARTADO VUELVE A AVISAR SI CAMBIA QUIÉN LO FORMA
   ============================================================ */
console.log('--- un tercer asunto que encaja hace que el grupo (ya distinto) vuelva a avisar ---');

const SANC_C = '260907 SANCION 26-27 1ºB Choque, Pedro 9998887';
await crearCarpeta(SANC_C);
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);

await comprobar('con un tercer miembro el grupo ya no es el que se descartó, y vuelve a avisar',
  pagina.locator('#btn-duplicados').isVisible(), true);
await pagina.click('#btn-duplicados');
await pagina.waitForSelector('#pantalla-duplicados:not(.oculto)');
await comprobar('el grupo sale con los tres asuntos',
  pagina.locator('.columna-duplicado').count(), 3);

await pagina.click('#dup-pantalla-volver');

/* ============================================================
   10. AJUSTES: "DUPLICADOS DESCARTADOS", Y "VOLVER A AVISAR"
   ============================================================ */
console.log('--- Ajustes: Duplicados descartados, y Volver a avisar ---');

await pagina.click('.pestana[data-pantalla="ajustes"]');
/* 17-sep-2026, fila 39: "Duplicados descartados" vive en la pestaña
   "Mantenimiento". */
await pagina.evaluate(() => App.cambiarPestanaAjustes('mantenimiento'));
await pagina.waitForSelector('#bloque-duplicados-descartados');
await pagina.evaluate(() => { document.getElementById('bloque-duplicados-descartados').open = true; });
await comprobar('Ajustes lista el grupo descartado, con sus dos nombres',
  pagina.locator('#tabla-duplicados-descartados').textContent()
    .then(t => t.indexOf(SANC_A) !== -1 && t.indexOf(SANC_B) !== -1), true);

await pagina.getByRole('button', { name: 'Volver a avisar', exact: true }).click();
await pagina.waitForTimeout(300);
await comprobar('ya no queda ningún descarte', leerJson('no-duplicados.json'), { descartados: [] });
await comprobar('y Ajustes lo dice',
  pagina.locator('#tabla-duplicados-descartados .vacio').textContent(), 'Ninguno.');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
