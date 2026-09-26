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
     - si hay un fichero con el mismo nombre en las dos carpetas, la
       unión sigue adelante: el que venía en la carpeta que se va
       entra con "(2)" al final, y no se pierde ni se borra nada
       (fila 75, docs/HUECOS-ENCONTRADOS-FILA-69.md, 1);
     - "No son el mismo" descarta un grupo aunque no choque ningún
       fichero, y un grupo descartado deja de avisar, pero vuelve a
       avisar solo si cambia quién lo forma (se crea un tercer asunto
       que encaja);
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

/* Fila 173, punto 3: dar de alta deja el tercero elegido, sin pulsar
   ningún resultado. */
async function darDeAltaAlumno(nombre, id) {
  await pagina.getByRole('button', { name: '+ Dar de alta un solicitante' }).click();
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.fill('.alta-campo[data-campo="Nombre"]', nombre);
  await pagina.fill('.alta-campo[data-campo="Nº Id. Escolar"]', id);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
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
/* Fila 119: crear abre la ficha del asunto; se vuelve a la lista. */
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.click('#ficha-volver');
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
await comprobar('lleva a la ficha del asunto elegido', pagina.locator('.ficha-nombre-texto').textContent(), NUEVA);
await comprobar('no se ha creado una tercera carpeta',
  nombresDeAbiertos().then(n => n.filter(x => x.indexOf('TRANSPORTE') !== -1).length), 2);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ============================================================
   4. UN CANDIDATO ARCHIVADO: "Abrir" lleva a su ficha de archivado (fila 119)
   ============================================================ */
console.log('--- un candidato archivado lleva a su ficha de archivado ---');

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
/* Fila 119: abre directamente su ficha de archivado. */
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(300);
await comprobar('lleva a la ficha del archivado', pagina.locator('.ficha-nombre-texto').textContent(), ARCHIVADO);
await comprobar('en modo archivo (con «Reabrir el asunto»)',
  pagina.getByRole('button', { name: 'Reabrir el asunto', exact: true }).count(), 1);
await comprobar('no se ha creado una cuarta carpeta abierta',
  nombresDeAbiertos().then(n => n.filter(x => x.indexOf('TRANSPORTE') !== -1).length), 2);
await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-asunto.oculto', { state: 'attached' });

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
  pagina.locator('.ficha-nombre-texto').textContent(), NUEVA);
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
   8. FICHERO QUE CHOCA: YA NO PARA LA UNIÓN, SE RENOMBRA CON "(2)"
   (fila 75, docs/HUECOS-ENCONTRADOS-FILA-69.md, 1)
   ============================================================ */
console.log('--- unir con un fichero del mismo nombre en las dos carpetas: se renombra, no se para ---');

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
await comprobar('de partida, el de nombre más largo (con el grupo)',
  pagina.evaluate(() => {
    const m = document.querySelector('input[name="unir-cual"]:checked');
    return m ? m.closest('.dup-opcion').textContent.trim() : null;
  }), SANC_A);
await pagina.click('#cuadro-aceptar');   /* acepta "¿Cuál se queda?" con el de partida (SANC_A) */
await pagina.waitForTimeout(500);

await comprobar('ya no aparece ningún cuadro de bloqueo: la unión ha terminado sola',
  pagina.locator('#capa').isHidden(), true);

await comprobar('las dos carpetas quedan en una sola: la que se va desaparece', pagina.evaluate(async (datos) => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return [nombres.indexOf(datos.a) !== -1, nombres.indexOf(datos.b) !== -1];
}, { a: SANC_A, b: SANC_B }), [true, false]);

await comprobar('los dos ficheros quedan en la carpeta que se queda, el segundo con "(2)"',
  pagina.evaluate(async (nombre) => {
    const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre);
    const dentro = [];
    for await (const p of carpeta.entries()) dentro.push(p[0]);
    return dentro.sort();
  }, SANC_A), ['mismo (2).pdf', 'mismo.pdf'].sort());

await comprobar('el que ya estaba (de SANC_A) conserva su nombre y su contenido', pagina.evaluate(async (nombre) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre);
  const h = await carpeta.getFileHandle('mismo.pdf');
  return (await (await h.getFile()).text());
}, SANC_A), 'contenido A');

await comprobar('el que venía chocando (de SANC_B) es el que lleva el sufijo', pagina.evaluate(async (nombre) => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle(nombre);
  const h = await carpeta.getFileHandle('mismo (2).pdf');
  return (await (await h.getFile()).text());
}, SANC_A), 'contenido B');

await comprobar('tras la unión, ya no queda ningún posible duplicado',
  pagina.locator('#duplicados-lista .vacio').textContent(),
  'No hay ningún posible duplicado ahora mismo.');

await pagina.click('#dup-pantalla-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');

/* ============================================================
   9. "NO SON EL MISMO": DESCARTA UN GRUPO SIN NECESIDAD DE CHOQUE
   ============================================================ */
console.log('--- "No son el mismo" descarta el grupo, sin que haga falta ningún fichero repetido ---');

const DESC_A = '260908 BECA 26-27 1ºC Distinto, Marta 1112223';
const DESC_B = '260908 BECA 26-27 Distinto, Marta 1112223';
await crearCarpeta(DESC_A);
await crearCarpeta(DESC_B);
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#btn-duplicados:not(.oculto)');
await pagina.click('#btn-duplicados');
await pagina.waitForSelector('#pantalla-duplicados:not(.oculto)');

await pagina.getByRole('button', { name: 'No son el mismo', exact: true }).click();
await pagina.waitForTimeout(300);
await comprobar('el grupo desaparece de la pantalla tras descartarlo',
  pagina.locator('#duplicados-lista .vacio').textContent(),
  'No hay ningún posible duplicado ahora mismo.');
await comprobar('se guarda el descarte, con quién lo hizo y los dos nombres', leerJson('no-duplicados.json'),
  { descartados: [{
    firma: [DESC_A, DESC_B].sort().join(''),
    nombres: [DESC_A, DESC_B].sort(),
    el: await pagina.evaluate(async () => {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const h = await g.getFileHandle('no-duplicados.json');
      const j = JSON.parse(await (await h.getFile()).text());
      return j.descartados[0].el;
    }),
    por: 'Francisco'
  }], _esquema: 1 });

await pagina.click('#dup-pantalla-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('el aviso ya no sale: el único grupo estaba descartado',
  pagina.locator('#btn-duplicados').isHidden(), true);

/* ============================================================
   10. EL GRUPO DESCARTADO VUELVE A AVISAR SI CAMBIA QUIÉN LO FORMA
   ============================================================ */
console.log('--- un tercer asunto que encaja hace que el grupo (ya distinto) vuelva a avisar ---');

const DESC_C = '260909 BECA 26-27 1ºD Distinto, Marta 1112223';
await crearCarpeta(DESC_C);
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
   11. AJUSTES: "DUPLICADOS DESCARTADOS", Y "VOLVER A AVISAR"
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
    .then(t => t.indexOf(DESC_A) !== -1 && t.indexOf(DESC_B) !== -1), true);

await pagina.getByRole('button', { name: 'Volver a avisar', exact: true }).click();
await pagina.waitForTimeout(300);
await comprobar('ya no queda ningún descarte', leerJson('no-duplicados.json'), { descartados: [], _esquema: 1 });
await comprobar('y Ajustes lo dice',
  pagina.locator('#tabla-duplicados-descartados .vacio').textContent(), 'Ninguno.');

/* ============================================================
   12. FILA 163: EL RECUADRO DE LO QUE YA TIENE EL TERCERO
   (docs/AVISO-DE-PARECIDOS-AL-CREAR.md)
   ============================================================ */
console.log('--- fila 163: el recuadro de lo que ya tiene el tercero ---');
const LUIS = 'Parecido Prueba, Luis 4440001';
const P_ROJO = '260910 TRANSPORTE 26-27 ' + LUIS;
const P_MAT = '260901 MATRICULA 26-27 ' + LUIS;
const P_BECA = '260902 BECA 26-27 ' + LUIS;
await pagina.evaluate(async ([luis, nombres]) => {
  for (const n of nombres) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(luis, { create: true });
  for (const n of ['260905 TRANSPORTE 26-27 ' + luis, '260826 TRANSPORTE 26-27 ' + luis, '260912 BECA 26-27 ' + luis]) {
    await ter.getDirectoryHandle(n, { create: true });
  }
}, [LUIS, [P_ROJO, P_MAT, P_BECA]]);
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await pagina.evaluate(async (n) => { await App.anotar(n, { reservado: true }); }, P_BECA);

const recuadro = () => pagina.evaluate(() => {
  const c = document.getElementById('aviso-duplicado');
  if (!c || c.classList.contains('oculto')) return null;
  return Array.from(c.querySelectorAll('.parecidos-bloque')).map((b) => [b.querySelector('strong').textContent,
    Array.from(b.querySelectorAll('.parecido')).map((x) => x.className.replace(/.*(parecido-[a-z-]+).*/, '$1') + ':' + x.textContent)]);
});

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
await pagina.getByRole('button', { name: 'TRANSPORTE', exact: true }).click();
await pagina.fill('#buscar-tercero', 'Nadie');
await pagina.waitForTimeout(300);
await darDeAltaAlumno('Nadie Prueba, Eva', '4440009');
await pagina.waitForTimeout(400);
await comprobar('163.1 un tercero sin asuntos: no sale nada', recuadro(), null);

await pagina.fill('#buscar-tercero', 'Parecido');
await pagina.waitForTimeout(300);
await darDeAltaAlumno('Parecido Prueba, Luis', '4440001');
await pagina.fill('#campo-fecha', '2026-09-15');
await pagina.waitForTimeout(500);
const bloquesLuis = await recuadro();
await comprobar('163.3 y 163.4: rojo arriba el abierto del mismo tipo; el archivado a 10 días sí (el de 20 y el de otro tipo, no); el resto, en gris',
  Promise.resolve(bloquesLuis && bloquesLuis.map((b) => [b[0], b[1].map((x) => x.split(':')[0])])),
  [['Ya tiene abierto un asunto de este tipo', ['parecido-mismo-tipo']],
   ['Archivado hace poco, del mismo tipo', ['parecido-archivado']],
   ['Otros asuntos abiertos de este tercero', ['parecido-otro', 'parecido-otro']]]);
await comprobar('163.4 el archivado es el de 10 días',
  Promise.resolve(bloquesLuis && bloquesLuis[1][1][0].indexOf('260905 TRANSPORTE') > -1), true);
await comprobar('163.6 el reservado sale tapado, con candado',
  Promise.resolve(bloquesLuis && bloquesLuis[2][1].some((x) => x.indexOf('🔒') > -1 && x.indexOf('reservado') > -1 && x.indexOf('Parecido') === -1)), true);

await pagina.fill('#campo-fecha', '2026-08-30');
await pagina.waitForTimeout(500);
await comprobar('163.5 al cambiar la fecha se recalculan los archivados (ahora los dos de agosto y septiembre)',
  recuadro().then((b) => b && b.filter((x) => x[0].indexOf('Archivado') === 0).map((x) => x[1].length)[0]), 2);

await pagina.evaluate(() => { App.E.nuevo.tipo = ''; App.refrescarVista(); });
await pagina.waitForTimeout(500);
await comprobar('163.2 sin tipo: solo el bloque gris, con todos sus abiertos',
  recuadro().then((b) => b && b.map((x) => [x[0], x[1].length])), [['Otros asuntos abiertos de este tercero', 3]]);
await comprobar('y la nota al pie',
  pagina.locator('#aviso-duplicado .parecidos-pie').textContent(), 'Es solo un aviso. Si es otra gestión, créalo sin más.');

await pagina.evaluate(() => { App.E.nuevo.tipo = 'TRANSPORTE'; App.refrescarVista(); });
await pagina.fill('#campo-descripcion', 'texto a mano');
await pagina.waitForTimeout(500);
await pagina.click('#aviso-duplicado .parecido-mismo-tipo');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('163 pulsar un abierto del recuadro abre su ficha', pagina.locator('.ficha-nombre-texto').textContent(), P_ROJO);
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.waitForTimeout(400);
await comprobar('163 y al volver a «Nuevo asunto», lo escrito sigue ahí',
  pagina.evaluate(() => [document.getElementById('campo-descripcion').value, document.getElementById('campo-fecha').value, App.E.nuevo.tipo, !!App.E.nuevo.tercero]),
  ['texto a mano', '2026-08-30', 'TRANSPORTE', true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
