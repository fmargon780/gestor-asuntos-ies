/* Prueba en navegador de verdad de "que no se dupliquen los asuntos"
   (docs/NO-DUPLICAR-ASUNTOS.md, 11-sep-2026).

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
     - en la lista de asuntos abiertos, dos que coinciden en tercero,
       tipo y año académico sacan la franja "Parecen el mismo asunto",
       con un botón Unir;
     - unir de verdad: los ficheros de los dos aparecen juntos, las
       notas se combinan (con la nota de la unión al final), los pasos
       de la guía se copian si el que se queda no tenía, y la carpeta
       que se va desaparece;
     - si hay un fichero con el mismo nombre en las dos carpetas, no se
       mueve ni se borra nada, y se avisa de cuál choca.

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

/* --- entrar --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

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
   5. LA FRANJA DE UNIR, Y UNIR DE VERDAD
   ============================================================ */
console.log('--- la franja "Parecen el mismo asunto", y unir ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');

/* Un documento distinto en cada carpeta, y una nota en cada una, para
   comprobar que la unión de verdad los junta. */
await pagina.evaluate(async (datos) => {
  const cE = await window.__disco.abiertos.getDirectoryHandle(datos.existente);
  cE._hijos.set('260904 SOLICITUD Transporte.pdf', window.__disco.fich('260904 SOLICITUD Transporte.pdf', 'a'));
  const cN = await window.__disco.abiertos.getDirectoryHandle(datos.nueva);
  cN._hijos.set('260905 CERTIFICADO Direccion.pdf', window.__disco.fich('260905 CERTIFICADO Direccion.pdf', 'b'));
}, { existente: EXISTENTE, nueva: NUEVA });

await pagina.evaluate(async (datos) => {
  await window.App.anotar(datos.existente, {
    notas: [{ texto: 'Nota del primero', quien: 'Francisco', cuando: '2026-09-04T10:00:00.000Z' }]
  });
  await window.App.anotar(datos.nueva, {
    notas: [{ texto: 'Nota del segundo', quien: 'Francisco', cuando: '2026-09-05T10:00:00.000Z' }],
    pasosHechos: ['paso-uno']
  });
}, { existente: EXISTENTE, nueva: NUEVA });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#franja-unir .franja-unir-fila');
await comprobar('la franja avisa de los dos que se parecen',
  pagina.locator('#franja-unir').textContent().then(t =>
    t.indexOf('Parecen el mismo asunto') !== -1 && t.indexOf(EXISTENTE) !== -1 && t.indexOf(NUEVA) !== -1), true);

await pagina.locator('#franja-unir .franja-unir-fila').filter({ hasText: EXISTENTE })
  .getByRole('button', { name: 'Unir', exact: true }).click();
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
}, EXISTENTE), ['Nota del primero', 'Nota del segundo', 'Unido con la carpeta «' + NUEVA + '» el ' + fechaHoyTexto]);

await comprobar('los pasos hechos se copian del otro, porque este no tenía ninguno', pagina.evaluate(async (nombre) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return (j.asuntos[nombre] && j.asuntos[nombre].pasosHechos) || [];
}, EXISTENTE), ['paso-uno']);

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await comprobar('la franja desaparece tras unir',
  pagina.locator('#franja-unir .franja-unir-fila').count(), 0);

/* ============================================================
   6. UNIR CON FICHEROS QUE CHOCAN: no se mueve ni se borra nada
   ============================================================ */
console.log('--- unir con un fichero del mismo nombre en las dos carpetas ---');

const SANC_A = '260906 SANCION 26-27 1ºA Choque, Pedro 9998887';
const SANC_B = '260906 SANCION 26-27 Choque, Pedro 9998887';
await pagina.evaluate(async (datos) => {
  const a = await window.__disco.abiertos.getDirectoryHandle(datos.a, { create: true });
  a._hijos.set('mismo.pdf', window.__disco.fich('mismo.pdf', 'contenido A'));
  const b = await window.__disco.abiertos.getDirectoryHandle(datos.b, { create: true });
  b._hijos.set('mismo.pdf', window.__disco.fich('mismo.pdf', 'contenido B'));
}, { a: SANC_A, b: SANC_B });

await pagina.click('#btn-recargar');
await pagina.waitForSelector('#franja-unir .franja-unir-fila');
await pagina.locator('#franja-unir .franja-unir-fila').filter({ hasText: SANC_A })
  .getByRole('button', { name: 'Unir', exact: true }).click();
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

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
