/* Prueba de la fila 345 (15-oct-2026, docs/FILTRO-EN-ANADIR-VARIOS-Y-EXPORTAR.md): el filtro del alumnado en
   «Añadir varios relacionados» y «Exportar la lista ▾» (Excel y PDF) dentro del filtro.

   Con navegador y el disco de mentira: 10 alumnos (1º y 2º de ESO, repetidores y no) y la base de datos de
   alumnado con el dato «Repetidor» (sí/no). Se mira que elegir un criterio no señala a nadie, que dos criterios
   dejan solo a los que cumplen los dos, que «Señalar los N» los pasa al pie y «Añadir al asunto los N» los
   relaciona, que quitar un criterio no quita a los ya señalados, y la exportación a Excel y a PDF; además, el
   botón sale en el filtro del cuadro de reparto y en el de Etiquetas (alumnado y personal). */
import fs from 'node:fs';
import { chromium } from 'playwright';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
async function esperar(fn, arg, veces) {
  for (let i = 0; i < (veces || 150); i++) {
    if (await pagina.evaluate(fn, arg)) return true;
    await pagina.waitForTimeout(100);
  }
  return false;
}

/* nombre, id, curso, unidad, centro, nivel, repetidor */
const ALUMNOS = [
  ['Aranda Bel, Ana', '9100001', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO', 'Sí'],
  ['Blanco Cid, Berta', '9100002', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO', 'No'],
  ['Campos Díaz, Carlos', '9100003', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO', 'No'],
  ['Duran Eco, Daniel', '9100004', '1º de E.S.O.', '1º ESO B', 'CEIP Jorge Guillén', '1º ESO', 'Sí'],
  ['Egea Fon, Elena', '9100005', '1º de E.S.O.', '1º ESO B', 'CEIP Jorge Guillén', '1º ESO', 'No'],
  ['Fuentes Gil, Felipe', '9100006', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO', 'No'],
  ['Gómez Hoz, Gala', '9100007', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO', 'Sí'],
  ['Herrera Ibáñez, Hugo', '9100008', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO', 'No'],
  ['Iglesias Jaén, Irene', '9100009', '1º de E.S.O.', '1º ESO A', 'CEIP Otro Colegio', '1º ESO', 'No'],
  ['Jiménez Kent, Jorge', '9100010', '2º de E.S.O.', '2º ESO A', 'CEIP Otro Colegio', '2º ESO', 'No']
];
const BD = {
  acuerdo: 2, generado: '2099-09-20T08:00:00+02:00', origen: 'bd-alumnado-ies', cursoAcademico: '2026-2027',
  campos: [
    { clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' },
    { clave: 'repetidor', etiqueta: 'Repetidor', apartado: 'Matrícula', tipo: 'texto' }
  ],
  alumnos: ALUMNOS.map(a => ({ idEscolar: a[1], matriculado: true, datos: { curso: a[5], repetidor: a[6] } }))
};

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([alumnos, bd]) => {
  const csv = ['Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento']
    .concat(alumnos.map(a => [a[0], a[1], a[2], a[3], '2026', 'Matriculado', '04/03/2013'].join(';'))).join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
  d._hijos.set('ALUMNADO-BD.json', window.__disco.fich('ALUMNADO-BD.json', JSON.stringify(bd)));
}, [ALUMNOS, BD]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2200);

const ASUNTO = '261015 ASUNTO DE GRUPO Prueba';
await pagina.evaluate(async (nombre) => {
  await App.crearTipo({ nombre: 'ASUNTO DE GRUPO', categoria: 'OTROS' });
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await App.anotar(nombre, { estado: 'abierto', tipo: 'ASUNTO DE GRUPO', categoria: 'OTROS', tercero: 'Prueba', relacionados: [] });
  await App.verAbiertos();
  window.__nombre = nombre;
  const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
  window.__hecho = undefined;
  Relacionados.agregarVarios(a).then(r => { window.__hecho = r; });
}, ASUNTO);

console.log('--- 1. la zona del filtro sustituye a los atajos ---');
await pagina.waitForSelector('#rel-cancelar');
await pagina.click('.categoria-mini-boton:has-text("ALUMNADO")');
await pagina.waitForSelector('#rel-atajos .repartir-filtro', { timeout: 10000 });
comprobar('1. sale «Filtrar el alumnado»', await pagina.locator('#rel-atajos .repartir-filtro summary').textContent().then(t => t.indexOf('Filtrar el alumnado') !== -1), true);
comprobar('1. ya no están los atajos que señalaban al elegir', await pagina.evaluate(() =>
  [document.getElementById('atajo-unidad'), document.getElementById('atajo-nivel'), document.getElementById('bd-grupo-dato'), document.querySelector('.atajos-rotulo')].every(e => !e)), true);
const senalados = () => pagina.evaluate(() => document.querySelectorAll('#varios-pie .marcado-chip').length);
const cuenta = () => pagina.locator('#rel-atajos .repartir-filtro-resumen').textContent();

console.log('--- 2. un criterio no señala a nadie ---');
/* Fila 350: los criterios se eligen escribiendo; con la caja vacía y el foco dentro salen todos los valores. */
const elegir = async (id, valor) => { await pagina.fill('#' + id, valor); await pagina.press('#' + id, 'Enter'); };
await pagina.click('#rf-nivel');
const niv = await pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#rf-nivel ~ .csg-lista li[data-i] span:first-child'), o => o.textContent).filter(Boolean));
await pagina.keyboard.press('Escape');
const nivel1 = niv.filter(v => v.indexOf('1') !== -1)[0];
comprobar('2. hay un nivel de 1º', !!nivel1, true);
await elegir('rf-nivel', nivel1);
comprobar('2. la cuenta dice 6 alumnos en el filtro y nadie está señalado', [await cuenta(), await senalados()], ['6 alumnos en el filtro', 0]);
comprobar('2. «Señalar los 6» está a la vista', await pagina.locator('#rf-senalar').textContent(), 'Señalar los 6');

/* Fila 350: la lista con casillas del resultado; solo las marcadas se señalan. */
comprobar('2. la lista trae las 6 personas, todas marcadas', await pagina.evaluate(() => [document.querySelectorAll('#rel-atajos .cc-lista input[type=checkbox]').length, document.querySelectorAll('#rel-atajos .cc-lista input:checked').length, document.querySelector('#rel-atajos .cc-cuenta').textContent]), [6, 6, '6 de 6 marcadas']);
await pagina.uncheck('#rel-atajos .cc-lista input[type=checkbox] >> nth=0');
comprobar('2. desmarcar una baja la cuenta y «Señalar los 5»', [await pagina.locator('#rel-atajos .cc-cuenta').textContent(), await pagina.locator('#rf-senalar').textContent(), await cuenta()], ['5 de 6 marcadas', 'Señalar los 5', '5 alumnos en el filtro']);
await pagina.click('#rel-atajos [data-cc="todas"]');
comprobar('2. «Marcar todas» vuelve a 6', await pagina.locator('#rf-senalar').textContent(), 'Señalar los 6');

console.log('--- 3. un segundo criterio ---');
await elegir('rf-dato', 'repetidor');
await elegir('rf-valor', 'No');
comprobar('3. la cuenta baja a los que cumplen los dos', [await cuenta(), await senalados()], ['4 alumnos en el filtro', 0]);

console.log('--- 4. señalar y añadir ---');
await pagina.click('#rf-senalar');
await pagina.waitForTimeout(300);
comprobar('4. los 4 pasan al pie', await senalados(), 4);

console.log('--- 5. quitar un criterio no quita a los señalados ---');
await pagina.click('#rel-atajos [data-quitar="1"]');
comprobar('5. con solo el nivel, la cuenta vuelve a 6 y siguen los 4 señalados', [await cuenta(), await senalados()], ['6 alumnos en el filtro', 4]);
await pagina.click('#rel-atajos [data-quitar="0"]');
comprobar('5. sin criterios, la cuenta se apaga y los señalados siguen', [await pagina.locator('#rf-senalar').isDisabled(), await senalados()], [true, 4]);

console.log('--- 6. exportar ---');
comprobar('6. sin criterios, «Exportar la lista ▾» está apagado', await pagina.locator('#rel-atajos .filtro-exportar-boton').isDisabled(), true);
await elegir('rf-nivel', nivel1);
await elegir('rf-dato', 'repetidor');
await elegir('rf-valor', 'No');
comprobar('6. con criterios, está encendido', await pagina.locator('#rel-atajos .filtro-exportar-boton').isDisabled(), false);
await pagina.click('#rel-atajos .filtro-exportar-boton');
const [descarga] = await Promise.all([pagina.waitForEvent('download', { timeout: 20000 }), pagina.click('#rel-atajos [data-fx="excel"]')]);
const hoy = await pagina.evaluate(() => FiltroExportar.nombreDeFichero('xlsx'));
comprobar('6. el Excel se llama AAMMDD Lista filtrada.xlsx', descarga.suggestedFilename(), hoy);
const ruta = await descarga.path();
const b64 = fs.readFileSync(ruta).toString('base64');
const hoja = await pagina.evaluate(async (b64) => {
  const z = await window.JSZip.loadAsync(b64, { base64: true });
  const xml = await z.file('xl/worksheets/sheet1.xml').async('string');
  const filas = (xml.match(/<row [\s\S]*?<\/row>/g) || []).map(r => (r.match(/<t [^>]*>([\s\S]*?)<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')));
  return { filas: filas, negrita: /<c r="A1" t="inlineStr" s="1">/.test(xml), fija: /state="frozen"/.test(xml) };
}, b64);
comprobar('6. el Excel: título en negrita y fijo, una fila por alumno del filtro, por unidad y apellidos',
  [hoja.negrita, hoja.fija, hoja.filas], [true, true, [
    ['Apellidos y nombre', 'Nº escolar', 'Unidad', 'Nivel', 'Repetidor'],
    ['Blanco Cid, Berta', '9100002', '1º ESO A', nivel1, 'No'],
    ['Campos Díaz, Carlos', '9100003', '1º ESO A', nivel1, 'No'],
    ['Iglesias Jaén, Irene', '9100009', '1º ESO A', nivel1, 'No'],
    ['Egea Fon, Elena', '9100005', '1º ESO B', nivel1, 'No']]]);

await pagina.click('#rel-atajos .filtro-exportar-boton');
await pagina.click('#rel-atajos [data-fx="pdf"]');
await pagina.waitForSelector('#exportar-visor:not(.oculto) section.exportar-pagina', { timeout: 20000 });
await pagina.waitForTimeout(1200);
const visor = await pagina.evaluate(() => {
  const v = document.getElementById('exportar-visor');
  return { titulo: v.querySelector('.exportar-titulo').textContent, filtros: v.querySelector('.exportar-filtros').textContent,
    membrete: !!v.querySelector('.exportar-membrete, .exportar-membrete-texto'), fecha: v.querySelector('.exportar-fecha').textContent.length > 5,
    filas: v.querySelectorAll('tr.exportar-fila').length, total: v.querySelector('.exportar-total-n').textContent,
    cabeza: Array.prototype.map.call(v.querySelectorAll('thead th'), t => t.textContent),
    botones: ['.exportar-guardar-pdf', '.exportar-imprimir'].map(q => !!v.querySelector(q) && !v.querySelector(q).disabled),
    aviso: v.querySelector('.exportar-aviso').classList.contains('oculto') };
});
comprobar('6. el visor: título, criterios, membrete, fecha, 4 filas y «4 alumnos»',
  [visor.titulo, visor.filtros, visor.membrete, visor.fecha, visor.filas, visor.total, visor.aviso],
  ['Lista filtrada', 'Nivel: ' + nivel1 + ' · Repetidor: No', true, true, 4, '4 alumnos', true]);
comprobar('6. el visor: columnas fijas y «Guardar PDF» e «Imprimir» a mano', [visor.cabeza, visor.botones], [['Apellidos y nombre', 'Nº escolar', 'Unidad', 'Nivel', 'Repetidor'], [true, true]]);
const nombrePdf = await pagina.evaluate(() => ExportarInforme.nombrePdf());
comprobar('6. el PDF se llama AAMMDD Lista filtrada.pdf', nombrePdf, await pagina.evaluate(() => FiltroExportar.nombreDeFichero('pdf')));
await pagina.click('#exportar-visor .exportar-cerrar');

console.log('--- 7. añadir al asunto ---');
await pagina.click('#rel-marcados-anadir');
await pagina.waitForFunction(() => window.__hecho !== undefined, null, { timeout: 15000 });
comprobar('7. los 4 señalados quedan relacionados con el asunto', await pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === window.__nombre)[0];
  const f = (App.E.registro.asuntos || {})[window.__nombre] || (a && a.ficha) || {};
  return (f.relacionados || []).length;
}), 4);

console.log('--- 8. el mismo botón en reparto y en Etiquetas ---');
await pagina.evaluate(async () => {
  window.__rep = await RepartirFiltro.crear({ lista: (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista }, []);
  const caja = document.createElement('div'); caja.id = 'caja-prueba';
  caja.innerHTML = RepartirFiltro.html(window.__rep);
  document.body.appendChild(caja);
});
comprobar('8. el filtro de reparto lleva el botón y NO lleva «Señalar los N»', await pagina.evaluate(() =>
  [!!document.querySelector('#caja-prueba .filtro-exportar-boton'), !!document.querySelector('#caja-prueba #rf-senalar')]), [true, false]);
await pagina.evaluate(() => document.getElementById('caja-prueba').remove());
await pagina.evaluate(() => App.ir('herramientas'));
await pagina.waitForSelector('#bloque-etiquetas');
await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
await pagina.click('#etiquetas-abrir');
await pagina.waitForSelector('.et-hoja', { timeout: 15000 });
comprobar('8. Etiquetas, alumnado: el botón sale en el filtro', await pagina.locator('#etiquetas-vista .filtro-exportar-boton').count(), 1);
await pagina.click('.et-pestana[data-clase="personal"]');
await pagina.waitForSelector('#et-pclase', { timeout: 10000 });
comprobar('8. Etiquetas, personal: el botón sale y está apagado sin criterio', [await pagina.locator('#etiquetas-vista .filtro-exportar-boton').count(), await pagina.locator('#etiquetas-vista .filtro-exportar-boton').isDisabled()], [1, true]);
comprobar('8. Etiquetas, personal: sin personal en el centro de la prueba, un criterio no enciende el botón', await pagina.evaluate(() => {
  return null;
}).then(async () => { await pagina.fill('#et-pclase', 'Docente'); await pagina.press('#et-pclase', 'Enter');
  return pagina.evaluate(() => document.querySelector('#etiquetas-vista .filtro-exportar-boton').disabled); }), true);
comprobar('8. la lista de personal: Apellidos y nombre · Puesto · una columna por criterio, por apellidos', await pagina.evaluate(() => {
  const l = FiltroExportar.listaDePersonal([{ nombre: 'Zapata, Luis', puesto: 'Conserje' }, { nombre: 'Álvarez, Eva', puesto: 'Profesora' }],
    [{ texto: 'Clase de personal: Docente', columna: 'Clase de personal', valor: () => 'Docente' }]);
  return [l.columnas, l.filas, l.criterios];
}), [['Apellidos y nombre', 'Puesto', 'Clase de personal'], [['Álvarez, Eva', 'Profesora', 'Docente'], ['Zapata, Luis', 'Conserje', 'Docente']], ['Clase de personal: Docente']]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
