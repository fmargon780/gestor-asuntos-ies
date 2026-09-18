/* Prueba de terceros relacionados (docs/TERCEROS-RELACIONADOS.md), en un
   navegador de verdad, con el mismo disco de mentira que usa
   navegador.mjs.

   Se lee el fichero de esa prueba y se le saca la preparación (el
   disco y el almacén de mentira), para no mantener dos copias. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const textoNavegador = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const inicioMarca = 'const preparacion = `';
const finMarca = '`;\n\nconst DIRECCION';
const iInicio = textoNavegador.indexOf(inicioMarca) + inicioMarca.length;
const iFin = textoNavegador.indexOf(finMarca);
const preparacion = textoNavegador.slice(iInicio, iFin);

const DIRECCION = process.env.DIRECCION || 'http://localhost:8123/index.html';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(DIRECCION);

/* Sondeo manual desde Node, en vez de page.waitForFunction: algunas
   operaciones de esta prueba se disparan desde un onclick que no se
   espera (patrón ya existente en el resto de la aplicación), así que
   hay que reintentar hasta que el resultado en el disco se estabilice. */
async function esperarHasta(fnEnPagina, arg, intentos, esperaMs) {
  intentos = intentos || 40;
  esperaMs = esperaMs || 150;
  for (let i = 0; i < intentos; i++) {
    const ok = await pagina.evaluate(fnEnPagina, arg).catch(() => false);
    if (ok) return true;
    await new Promise(r => setTimeout(r, esperaMs));
  }
  return false;
}

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- arrancar, igual que en navegador.mjs, con datos de sobra
   para poder relacionar alumnado, personal y una entidad de OTROS ---------- */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;1º de E.S.O.;1º A;2026;Matriculada;14/03/2013;600111222;tutor.marina@correo.es',
    'Bermúdez Ortiz, Álvaro;1140501;1º de E.S.O.;1º C;2026;Matriculado;02/09/2014;600333444;tutor.alvaro@correo.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));

  const per = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"',
    '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","01/09/2011",""',
    '"Sánchez Alegría, María José","07862312S","Dibujo P.E.S.","01/09/2005",""'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', per));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* ---------- asunto B: sin relacionados, para el escenario 1 ---------- */

async function crearAsunto(categoriaIndice, botonTipo, buscarTexto) {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(' + categoriaIndice + ')');
  await pagina.getByRole('button', { name: botonTipo, exact: true }).click();
  await pagina.fill('#buscar-tercero', buscarTexto);
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', '2026-09-07');
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
}

await crearAsunto(1, 'CERTIFICADO', 'alvaro');   /* asunto B: Bermúdez Ortiz */

/* 1) Archivar un asunto SIN relacionados se comporta exactamente igual
   que siempre: no sale ningún cuadro de "Avisar a los relacionados". */
await pagina.getByRole('button', { name: 'Archivar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('sin relacionados, el cuadro es directamente el de archivar',
  pagina.locator('#cuadro-titulo').textContent(), 'Archivar el asunto');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#lista-abiertos .vacio, #lista-abiertos .tarjeta');

/* ---------- asunto A: con relacionados, para el resto de escenarios ---------- */

await crearAsunto(1, 'MATRICULA', 'marina');   /* asunto A: Aguilar Ponce, Marina */
/* El nombre real de la carpeta, del disco: la tarjeta lleva además las
   marcas de tipo y estado pegadas en el mismo texto. */
const nombreAsuntoA = await pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return nombres.filter(n => n[0] !== '_')[0];
});

await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
/* "Personas y entidades relacionadas" vive plegada (fila 51,
   18-sep-2026, docs/FICHA-DISPOSICION.md): hay que desplegarla antes
   de poder pulsar nada de dentro. */
await pagina.click('#ficha-plegable-relacionados > summary');
await pagina.waitForSelector('#ficha-relacionados #rel-anadir');

async function anadirRelacionadoBuscando(categoria, textoBuscar) {
  await pagina.click('#rel-anadir');
  await pagina.waitForSelector('#rel-picker');
  await pagina.click('.categoria-mini-boton:has-text("' + categoria + '")');
  await pagina.fill('#rel-buscar', textoBuscar);
  await pagina.waitForSelector('#rel-resultados .resultado');
  await pagina.click('#rel-resultados .resultado');
}

/* 2) Añadir dos relacionados de PERSONAL, y que queden en asuntos.json. */
await anadirRelacionadoBuscando('PERSONAL', 'aguado');
await pagina.waitForSelector('.relacionado-fila');
await anadirRelacionadoBuscando('PERSONAL', 'sanchez alegria');
await pagina.waitForTimeout(200);
await comprobar('se ven las dos filas de relacionados',
  pagina.locator('.relacionado-fila').count(), 2);
await comprobar('los dos relacionados se han guardado en asuntos.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const clave = Object.keys(j.asuntos).find(k => k.indexOf('MATRICULA') !== -1);
  const rel = (j.asuntos[clave].relacionados || []).map(r => r.categoria + ' · ' + r.nombre);
  return rel.sort();
}), ['PERSONAL · Aguado Ranea, Marcos Antonio 591R', 'PERSONAL · Sánchez Alegría, María José 312S']);

/* 3) El propio tercero del asunto no se puede añadir como relacionado. */
await pagina.click('#rel-anadir');
await pagina.waitForSelector('#rel-picker');
await pagina.click('.categoria-mini-boton:has-text("ALUMNADO")');
await pagina.fill('#rel-buscar', 'marina');
await pagina.waitForSelector('#rel-resultados .resultado');
await pagina.click('#rel-resultados .resultado');
await pagina.waitForTimeout(200);
await comprobar('avisa de que es el propio tercero',
  pagina.locator('.mensaje.malo').last().textContent()
    .then(t => t.indexOf('propio tercero') !== -1), true);
await comprobar('y no se añade una tercera fila',
  pagina.locator('.relacionado-fila').count(), 2);

/* 4a) El mismo relacionado, exactamente igual, no se puede añadir dos veces. */
await pagina.click('#rel-anadir');
await pagina.waitForSelector('#rel-picker');
await pagina.click('.categoria-mini-boton:has-text("PERSONAL")');
await pagina.fill('#rel-buscar', 'aguado');
await pagina.waitForSelector('#rel-resultados .resultado');
await pagina.click('#rel-resultados .resultado');
await pagina.waitForTimeout(200);
await comprobar('avisa de que ya está en la lista',
  pagina.locator('.mensaje.malo').last().textContent()
    .then(t => t.indexOf('ya está en la lista') !== -1), true);
await comprobar('sigue habiendo solo dos filas',
  pagina.locator('.relacionado-fila').count(), 2);

/* 4b) Un nombre casi igual, dado de alta a mano en OTROS, avisa y deja
   cancelar sin añadirlo. */
await pagina.click('#rel-anadir');
await pagina.waitForSelector('#rel-picker');
await pagina.click('.categoria-mini-boton:has-text("OTROS")');
await pagina.fill('#rel-buscar', 'Contratista Ruidoso');
await pagina.waitForTimeout(300);
await pagina.getByRole('button', { name: '+ Dar de alta uno nuevo' }).click();
await pagina.waitForSelector('.alta-campo[data-campo="Nombre"]');
await pagina.fill('.alta-campo[data-campo="Nombre"]', 'Contratista Ruidoso');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('.relacionado-fila >> nth=2');
await comprobar('el de alta se suma como tercera fila',
  pagina.locator('.relacionado-fila').count(), 3);

await pagina.click('#rel-anadir');
await pagina.waitForSelector('#rel-picker');
await pagina.click('.categoria-mini-boton:has-text("OTROS")');
await pagina.fill('#rel-buscar', 'Contratista Ruidosoo');
await pagina.waitForTimeout(300);
await pagina.getByRole('button', { name: '+ Dar de alta uno nuevo' }).click();
await pagina.waitForSelector('.alta-campo[data-campo="Nombre"]');
await pagina.fill('.alta-campo[data-campo="Nombre"]', 'Contratista Ruidosoo');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#cuadro-titulo:has-text("¿Es otro de verdad?")');
await comprobar('avisa de que se parece a uno que ya está',
  pagina.locator('#cuadro-cuerpo').textContent()
    .then(t => t.indexOf('Contratista Ruidoso') !== -1), true);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(200);
await comprobar('al cancelar, sigue habiendo solo tres filas',
  pagina.locator('.relacionado-fila').count(), 3);

/* Se quita el de OTROS, que ya ha cumplido su papel, para dejar solo
   los dos de PERSONAL de cara al archivado. */
await pagina.locator('.relacionado-fila').nth(2).getByRole('button', { name: 'Quitar' }).click();
await pagina.waitForTimeout(200);
await comprobar('vuelve a haber dos relacionados', pagina.locator('.relacionado-fila').count(), 2);

/* 5) Archivar el asunto pregunta por los relacionados y deja la nota
   en la carpeta de cada uno, con el texto y la ruta correctos. */
await pagina.getByRole('button', { name: 'Archivar el asunto', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro es el de avisar a los relacionados',
  pagina.locator('#cuadro-titulo').textContent(), 'Avisar a los relacionados');
await comprobar('las dos casillas salen marcadas de entrada',
  pagina.locator('.rel-marcar:checked').count(), 2);
await pagina.click('#cuadro-aceptar');
/* Y detrás, el cuadro de siempre de archivar (categoría y tercero ya
   los sabe, porque el asunto se creó con la aplicación). */
await pagina.waitForSelector('#cuadro-titulo:has-text("Archivar el asunto")');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#lista-abiertos .vacio, #lista-abiertos .tarjeta');

const NOMBRE_MARCADOR = '(RELACIONADO) ' + nombreAsuntoA;
async function leerMarcadorEnPagina(categoria, tercero, nombreMarcador) {
  return pagina.evaluate(async ([c, n, m]) => {
    try {
      const cat = await window.__disco.archivo.getDirectoryHandle(c);
      const ter = await cat.getDirectoryHandle(n);
      const marcador = await ter.getDirectoryHandle(m);
      const h = await marcador.getFileHandle('DONDE ESTA ESTE ASUNTO.txt');
      return await (await h.getFile()).text();
    } catch (e) { return null; }
  }, [categoria, tercero, nombreMarcador]);
}

/* Archivar deja las notas de forma asíncrona, después de mover la
   carpeta: se espera a que las dos existan antes de comprobar nada. */
await esperarHasta(async (m) => {
  try {
    const cat1 = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
    const ter1 = await cat1.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
    await ter1.getDirectoryHandle(m);
    const ter2 = await cat1.getDirectoryHandle('Sánchez Alegría, María José 312S');
    await ter2.getDirectoryHandle(m);
    return true;
  } catch (e) { return false; }
}, NOMBRE_MARCADOR);

await comprobar('6) se crea la carpeta ARCHIVO/PERSONAL de Aguado, que no existía',
  leerMarcadorEnPagina('PERSONAL', 'Aguado Ranea, Marcos Antonio 591R', NOMBRE_MARCADOR)
    .then(t => t !== null), true);
await comprobar('y la nota dice dónde está el asunto de verdad',
  leerMarcadorEnPagina('PERSONAL', 'Aguado Ranea, Marcos Antonio 591R', NOMBRE_MARCADOR)
    .then(t => t.indexOf('ALUMNADO / Aguilar Ponce, Marina 1140233 / ' + nombreAsuntoA) !== -1), true);
await comprobar('lo mismo para Sánchez Alegría',
  leerMarcadorEnPagina('PERSONAL', 'Sánchez Alegría, María José 312S', NOMBRE_MARCADOR)
    .then(t => t !== null && t.indexOf('ALUMNADO / Aguilar Ponce, Marina 1140233 / ' + nombreAsuntoA) !== -1), true);
await comprobar('en la nota no hay ningún documento del asunto: solo el fichero de texto',
  pagina.evaluate(async ([c, n, m]) => {
    const cat = await window.__disco.archivo.getDirectoryHandle(c);
    const ter = await cat.getDirectoryHandle(n);
    const marcador = await ter.getDirectoryHandle(m);
    const dentro = [];
    for await (const p of marcador.entries()) dentro.push(p[0]);
    return dentro;
  }, ['PERSONAL', 'Aguado Ranea, Marcos Antonio 591R', NOMBRE_MARCADOR]),
  ['DONDE ESTA ESTE ASUNTO.txt']);

/* 9a) La ficha de Aguado Ranea, con el asunto ya archivado, dice que
   está relacionado con él. */
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.selectOption('#filtro-personas', 'PERSONAL');
await pagina.waitForTimeout(250);
await pagina.fill('#buscar-personas', 'aguado');
await pagina.waitForTimeout(250);
await pagina.click('#lista-personas .resultado');
await comprobar('la ficha de Aguado dice que está relacionado (archivado)',
  pagina.locator('.ficha-relacionado-de').textContent()
    .then(t => t.indexOf(nombreAsuntoA) !== -1 && t.indexOf('Archivado') !== -1), true);

/* 7) Reabrir el asunto borra las dos notas, pero la lista de
   relacionados sigue en la ficha. */
await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForSelector('#lista-archivo .tarjeta');
await comprobar('las notas no aparecen como asuntos en el Archivo',
  pagina.locator('#lista-archivo .tarjeta').count(), 2);
await pagina.locator('#lista-archivo .tarjeta').filter({ hasText: 'MATRICULA' })
  .getByRole('button', { name: 'Reabrir', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await esperarHasta(async () => {
  try {
    const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
    const uno = await cat.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
    const dos = await cat.getDirectoryHandle('Sánchez Alegría, María José 312S');
    for await (const p of uno.entries()) if (p[0].indexOf('RELACIONADO') !== -1) return false;
    for await (const p of dos.entries()) if (p[0].indexOf('RELACIONADO') !== -1) return false;
    return true;
  } catch (e) { return false; }
});

await comprobar('al reabrir, las dos notas desaparecen',
  pagina.evaluate(async () => {
    const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
    const uno = await cat.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
    const dos = await cat.getDirectoryHandle('Sánchez Alegría, María José 312S');
    const hay1 = await uno.getDirectoryHandle('__x__').then(() => true).catch(() => false);
    let notaUno = false, notaDos = false;
    for await (const p of uno.entries()) if (p[0].indexOf('RELACIONADO') !== -1) notaUno = true;
    for await (const p of dos.entries()) if (p[0].indexOf('RELACIONADO') !== -1) notaDos = true;
    return [notaUno, notaDos];
  }), [false, false]);

await comprobar('pero la lista de relacionados sigue en la ficha del asunto', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const clave = Object.keys(j.asuntos).find(k => k.indexOf('MATRICULA') !== -1);
  return (j.asuntos[clave].relacionados || []).length;
}), 2);

/* 8) Si alguien ha metido algo más en la carpeta-nota, no se borra: se
   archiva otra vez, se le mete un fichero de más dentro de una de las
   dos notas, y se reabre. */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.getByRole('button', { name: 'Archivar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');   /* avisar a los relacionados, las dos marcadas */
await pagina.waitForSelector('#cuadro-titulo:has-text("Archivar el asunto")');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#lista-abiertos .vacio, #lista-abiertos .tarjeta');

/* Archivar deja la nota de forma asíncrona, después de mover la
   carpeta: se espera a que exista antes de meterle el fichero de más. */
await esperarHasta(async (m) => {
  try {
    const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
    const ter = await cat.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
    await ter.getDirectoryHandle(m);
    return true;
  } catch (e) { return false; }
}, NOMBRE_MARCADOR);

await pagina.evaluate(async ([m]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
  const ter = await cat.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
  const marcador = await ter.getDirectoryHandle(m);
  marcador._hijos.set('algo que alguien ha metido.pdf', window.__disco.fich('algo que alguien ha metido.pdf', 'x'));
}, [NOMBRE_MARCADOR]);

await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForSelector('#lista-archivo .tarjeta');
await pagina.locator('#lista-archivo .tarjeta').filter({ hasText: 'MATRICULA' })
  .getByRole('button', { name: 'Reabrir', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await esperarHasta(async () => {
  try {
    const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
    const dos = await cat.getDirectoryHandle('Sánchez Alegría, María José 312S');
    for await (const p of dos.entries()) if (p[0].indexOf('RELACIONADO') !== -1) return false;
    return true;
  } catch (e) { return false; }
});

await comprobar('la carpeta con el fichero de más NO se ha borrado', pagina.evaluate(async ([m]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
  const ter = await cat.getDirectoryHandle('Aguado Ranea, Marcos Antonio 591R');
  return ter.getDirectoryHandle(m).then(() => true).catch(() => false);
}, [NOMBRE_MARCADOR]), true);
await comprobar('la del otro relacionado, sin nada de más, sí se ha borrado', pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('PERSONAL');
  const ter = await cat.getDirectoryHandle('Sánchez Alegría, María José 312S');
  for await (const p of ter.entries()) if (p[0].indexOf('RELACIONADO') !== -1) return true;
  return false;
}), false);
await comprobar('y se avisa de que no se ha podido borrar esa',
  pagina.locator('.mensaje.malo').last().textContent()
    .then(t => t.indexOf('Aguado Ranea') !== -1 && t.indexOf('no la he borrado') !== -1), true);

/* 9b) Y mientras el asunto sigue abierto, la ficha de Sánchez Alegría
   también dice que está relacionada (esta vez, "Abierto"). */
await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.fill('#buscar-personas', 'sanchez alegria');
await pagina.waitForTimeout(250);
await pagina.click('#lista-personas .resultado');
await comprobar('la ficha de Sánchez Alegría dice que está relacionada (abierto)',
  pagina.locator('.ficha-relacionado-de').textContent()
    .then(t => t.indexOf(nombreAsuntoA) !== -1 && t.indexOf('Abierto') !== -1), true);

await comprobar('sin errores de consola', Promise.resolve(errores), []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de relacionados pasan.');
process.exit(fallos ? 1 : 0);
