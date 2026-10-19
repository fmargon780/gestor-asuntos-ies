/* Prueba de la fila 342 (13-oct-2026, docs/REPARTIR-CON-FILTRO.md): repartir con un filtro del alumnado.

   Con navegador y el disco de mentira: 10 alumnos (8 del CEIP Jorge Guillén, de dos niveles, y 2 de otro
   centro) y la base de datos de alumnado. Un asunto sin relacionados y un PDF de 6 trozos (4 con alumnos del
   filtro, 1 con uno de fuera, 1 sin nombre): dos criterios a la vez, nada por orden, el alumno asignado
   desaparece de las demás listas, la línea de cuentas, «Asignarlo igualmente» y quién queda relacionado.
   Lo mismo, en corto, con el cuadro de varios ficheros. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
async function comprobarP(titulo, promesa, esperado) { comprobar(titulo, await promesa, esperado); }
async function esperar(fn, arg, veces) {
  for (let i = 0; i < (veces || 150); i++) {
    if (await pagina.evaluate(fn, arg)) return true;
    await pagina.waitForTimeout(100);
  }
  return false;
}

const ALUMNOS = [
  ['Aranda Bel, Ana', '9100001', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO'],
  ['Blanco Cid, Berta', '9100002', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO'],
  ['Campos Díaz, Carlos', '9100003', '1º de E.S.O.', '1º ESO A', 'CEIP Jorge Guillén', '1º ESO'],
  ['Duran Eco, Daniel', '9100004', '1º de E.S.O.', '1º ESO B', 'CEIP Jorge Guillén', '1º ESO'],
  ['Egea Fon, Elena', '9100005', '1º de E.S.O.', '1º ESO B', 'CEIP Jorge Guillén', '1º ESO'],
  ['Fuentes Gil, Felipe', '9100006', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO'],
  ['Gómez Hoz, Gala', '9100007', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO'],
  ['Herrera Ibáñez, Hugo', '9100008', '2º de E.S.O.', '2º ESO A', 'CEIP Jorge Guillén', '2º ESO'],
  ['Iglesias Jaén, Irene', '9100009', '1º de E.S.O.', '1º ESO A', 'CEIP Otro Colegio', '1º ESO'],
  ['Jiménez Kent, Jorge', '9100010', '2º de E.S.O.', '2º ESO A', 'CEIP Otro Colegio', '2º ESO']
];
const BD = {
  acuerdo: 2, generado: '2099-09-20T08:00:00+02:00', origen: 'bd-alumnado-ies', cursoAcademico: '2026-2027',
  campos: [
    { clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' },
    { clave: 'centroProcedencia', etiqueta: 'Centro de procedencia', apartado: 'Procedencia', tipo: 'texto' }
  ],
  alumnos: ALUMNOS.map(a => ({ idEscolar: a[1], matriculado: true, datos: { curso: a[5], centroProcedencia: a[4] } }))
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

const ORIGEN = '261013 ENVIO DE COLEGIO Colegio Jorge Guillén';
const PDF = '261013 26EM0200 INFORMES.pdf';
const ORIGEN2 = '261013 ENVIO DE COLEGIO Colegio Segundo';
const FICHEROS = ['Cuestionario Egea Fon Elena.pdf', 'Cuestionario Fuentes Gil Felipe.pdf', 'Cuestionario Jiménez Kent Jorge.pdf', 'escaneo raro.pdf'];

await pagina.evaluate(async ([origen, origen2, pdf, ficheros]) => {
  await App.crearTipo({ nombre: 'ENVIO DE COLEGIO', categoria: 'OTROS' });
  await App.crearTipo({ nombre: 'CUESTIONARIO ALTAS CAPACIDADES', categoria: 'ALUMNADO' });
  ['OFICIO', 'CUESTIONARIO'].forEach(t => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.guardarTiposDocumento();
  const tipo = App.E.tipos.filter(t => t.tipo === 'ENVIO DE COLEGIO')[0];
  tipo.repartirTipo = 'CUESTIONARIO ALTAS CAPACIDADES';
  tipo.repartirTipoDocumento = 'CUESTIONARIO';
  await App.guardarTipos();
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  async function pdfEn(c, nombre, textos) {
    const d = await PDFLib.PDFDocument.create();
    const f = await d.embedFont(PDFLib.StandardFonts.Helvetica);
    textos.forEach(t => { const p = d.addPage([300, 400]); p.drawText(t, { x: 20, y: 350, size: 12, font: f }); });
    const h = await c.getFileHandle(nombre, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([await d.save()])); await w.close();
  }
  const c = await window.__disco.abiertos.getDirectoryHandle(origen, { create: true });
  await pdfEn(c, pdf, ['Informe de Ana Aranda Bel', 'Informe de Berta Blanco Cid', 'Informe de Carlos Campos Díaz',
    'Informe de Daniel Duran Eco', 'Informe de Irene Iglesias Jaén', 'Informe sin nombre ninguno']);
  await App.anotar(origen, { estado: 'abierto', tipo: 'ENVIO DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio Jorge Guillén', relacionados: [] });
  const c2 = await window.__disco.abiertos.getDirectoryHandle(origen2, { create: true });
  await pdfEn(c2, 'oficio.pdf', ['Oficio']);
  for (const f of ficheros) await pdfEn(c2, f, ['Cuestionario']);
  await App.anotar(origen2, { estado: 'abierto', tipo: 'ENVIO DE COLEGIO', categoria: 'OTROS', tercero: 'Colegio Segundo', relacionados: [] });
  await App.verAbiertos();
}, [ORIGEN, ORIGEN2, PDF, FICHEROS]);

console.log('--- el cuadro de un PDF en trozos ---');
await pagina.evaluate(async ([origen, pdf]) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  const h = await a.handle.getFileHandle(pdf);
  Repartir.abrir({ asunto: a, handle: h, nombre: pdf, dir: a.handle, alTerminar() {} });
}, [ORIGEN, PDF]);
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await comprobarP('1. hay una zona «Filtrar el alumnado», sin criterios', pagina.evaluate(() => [
  document.querySelector('.repartir-filtro summary').textContent.trim(), document.querySelectorAll('.bd-grupo-cond').length]), ['Filtrar el alumnado', 0]);
await pagina.fill('#repartir-por', '1');
await pagina.dispatchEvent('#repartir-por', 'change');
await pagina.waitForFunction(() => document.querySelectorAll('.repartir-trozo').length === 6);
await pagina.evaluate(() => { document.querySelector('.repartir-filtro').open = true; });
const poner = async (id, valor) => { await pagina.fill('#' + id, valor); await pagina.press('#' + id, 'Enter'); };   /* fila 350: se elige escribiendo */
await poner('rf-dato', 'centroProcedencia');
await poner('rf-valor', 'CEIP Jorge Guillén');
await pagina.waitForSelector('.bd-grupo-cond');
await comprobarP('1. con un criterio (centro de procedencia): 8 alumnos', pagina.locator('.repartir-filtro-resumen').textContent(), '8 alumnos en el filtro');
await poner('rf-nivel', '1º');
await pagina.waitForFunction(() => document.querySelectorAll('.bd-grupo-cond').length === 2);
await comprobarP('1. con dos criterios (centro y nivel): solo los que cumplen los dos, 5', pagina.locator('.repartir-filtro-resumen').textContent(), '5 alumnos en el filtro');

const filas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => [
  f.querySelector('.repartir-tercero').value, ((f.querySelector('.repartir-marca') || {}).textContent || ''),
  (f.querySelector('.repartir-aviso-lectura') || {}).textContent || '', !!f.querySelector('.repartir-igualmente')]));
const nombre = (n) => { const a = ALUMNOS.filter(x => x[0] === n)[0]; return n + ' ' + a[1]; };
const f1 = await filas();
await comprobarP('2 y 4. los 4 trozos con alumno del filtro llevan el suyo; el de fuera, sin asignar y en ámbar con «Asignarlo igualmente»; el sin nombre, sin asignar',
  [f1.map(x => x[0]), f1[4][2], f1[4][3], f1[5][2], f1[5][3]], [
    ['Aranda Bel, Ana', 'Blanco Cid, Berta', 'Campos Díaz, Carlos', 'Duran Eco, Daniel', '', ''].map(n => n ? nombre(n) : ''),
    'Está fuera del filtro: ' + nombre('Iglesias Jaén, Irene'), true, '', false]);

const opciones = (i) => pagina.evaluate((i) => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo')[i].querySelectorAll('.repartir-tercero option'), o => o.textContent), i);
await comprobarP('3. en un trozo sin alumno, la lista ofrece solo al del filtro que aún no tiene documento', opciones(5),
  ['Sin asignar', 'Se queda en este asunto', nombre('Egea Fon, Elena')]);
await pagina.evaluate(() => { const s = document.querySelectorAll('.repartir-trozo')[0].querySelector('.repartir-tercero'); s.value = ''; s.dispatchEvent(new Event('change')); });
await comprobarP('3. al quitar el alumno del primer trozo, vuelve a salir en los demás', opciones(5),
  ['Sin asignar', 'Se queda en este asunto', nombre('Aranda Bel, Ana'), nombre('Egea Fon, Elena')]);

console.log('--- la línea de cuentas ---');
const cuentas = () => pagina.locator('.repartir-cuentas-linea').textContent();
await comprobarP('5. documentos sin alumno y alumnos del filtro sin documento', cuentas(), 'Documentos sin alumno: 3 · Alumnos del filtro sin documento: 2');
await pagina.click('[data-cuenta="docs"]');
await comprobarP('5. al pulsar la primera cifra salen los documentos', pagina.evaluate(() =>
  Array.prototype.map.call(document.querySelectorAll('.repartir-cuentas-lista li'), l => l.textContent)), ['Trozo 1, pág. 1', 'Trozo 5, pág. 5', 'Trozo 6, pág. 6']);
await pagina.click('[data-cuenta="alumnos"]');
await comprobarP('5. y al pulsar la segunda, los alumnos', pagina.evaluate(() =>
  Array.prototype.map.call(document.querySelectorAll('.repartir-cuentas-lista li'), l => l.textContent)), [nombre('Aranda Bel, Ana'), nombre('Egea Fon, Elena')]);
/* se vuelve a asignar al primero y se asigna «igualmente» al de fuera */
await pagina.evaluate((n) => { const s = document.querySelectorAll('.repartir-trozo')[0].querySelector('.repartir-tercero'); s.value = n; s.dispatchEvent(new Event('change')); }, nombre('Aranda Bel, Ana'));
await pagina.click('.repartir-igualmente');
await comprobarP('4. «Asignarlo igualmente» lo asigna y lo deja marcado «Fuera del filtro»', pagina.evaluate(() => {
  const f = document.querySelectorAll('.repartir-trozo')[4];
  return [f.querySelector('.repartir-tercero').value, (f.querySelector('.repartir-fuera') || {}).textContent || '', !!f.querySelector('.repartir-igualmente')];
}), [nombre('Iglesias Jaén, Irene'), 'Fuera del filtro', false]);
await comprobarP('5. la línea se pone al día', cuentas(), 'Documentos sin alumno: 1 · Alumnos del filtro sin documento: 1');

console.log('--- terminar con un trozo sin alumno ---');
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await comprobarP('6. deja terminar aunque no cuadre, y avisa del trozo sin repartir', pagina.locator('#cuadro-cuerpo').textContent().then(t =>
  t.indexOf('Se van a crear 5 asuntos de tipo CUESTIONARIO ALTAS CAPACIDADES') !== -1 && t.indexOf('1 trozo se queda sin repartir') !== -1), true);
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 400);
await comprobarP('6. termina sin fallos', pagina.locator('#repartir-progreso').textContent(), 'Hecho.');
const relacionados = (origen) => pagina.evaluate(async (origen) => {
  const r = await Carpetas.leerJson(App.E.gestor, 'asuntos.json');
  return ((r.asuntos[origen] || {}).relacionados || []).map(x => x.nombre).sort();
}, origen);
await comprobarP('6. quedan relacionados solo los 5 que recibieron trozo (no Egea, que era del filtro y no recibió)', relacionados(ORIGEN),
  ['Aranda Bel, Ana', 'Blanco Cid, Berta', 'Campos Díaz, Carlos', 'Duran Eco, Daniel', 'Iglesias Jaén, Irene'].map(nombre).sort());
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

console.log('--- el cuadro de varios ficheros ---');
await pagina.evaluate(async (origen) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === origen)[0];
  RepartirFicheros.abrir({ asunto: a, alTerminar() {} });
}, ORIGEN2);
await pagina.waitForSelector('.repartir-elegir');
await pagina.evaluate((sueltos) => {
  Array.prototype.forEach.call(document.querySelectorAll('.repartir-elegir-fila'), l => {
    if (sueltos.some(s => l.textContent.indexOf(s) !== -1)) { const c = l.querySelector('input'); c.checked = true; c.dispatchEvent(new Event('change')); }
  });
}, FICHEROS);
await pagina.click('#repartir-seguir');
await pagina.waitForSelector('.repartir-lista .repartir-trozo');
await pagina.evaluate(() => { document.querySelector('.repartir-filtro').open = true; });
await poner('rf-dato', 'centroProcedencia');
await poner('rf-valor', 'CEIP Jorge Guillén');
await pagina.waitForSelector('.bd-grupo-cond');
await comprobarP('7. el filtro del cuadro de ficheros: 8 alumnos', pagina.locator('.repartir-filtro-resumen').textContent(), '8 alumnos en el filtro');
const ordenadas = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.repartir-trozo'), f => [
  f.querySelector('strong').textContent, f.querySelector('.repartir-tercero').value, (f.querySelector('.repartir-aviso-lectura') || {}).textContent || '']).sort((x, y) => x[0] < y[0] ? -1 : 1));
await comprobarP('7. cada fichero con su alumno del filtro; el de fuera, en ámbar; el raro, sin asignar', ordenadas(), [
  ['Cuestionario Egea Fon Elena.pdf', nombre('Egea Fon, Elena'), ''],
  ['Cuestionario Fuentes Gil Felipe.pdf', nombre('Fuentes Gil, Felipe'), ''],
  ['Cuestionario Jiménez Kent Jorge.pdf', '', 'Está fuera del filtro: ' + nombre('Jiménez Kent, Jorge')],
  ['escaneo raro.pdf', '', '']]);
await comprobarP('7. cuentas: 2 ficheros sin alumno y 6 alumnos del filtro sin fichero', cuentas(), 'Documentos sin alumno: 2 · Alumnos del filtro sin documento: 6');
await pagina.selectOption('.repartir-tipo', 'CUESTIONARIO ALTAS CAPACIDADES');
await pagina.dispatchEvent('.repartir-tipo', 'change');
await pagina.selectOption('.repartir-tipodoc', 'CUESTIONARIO');
await pagina.dispatchEvent('.repartir-tipodoc', 'change');
await pagina.click('#repartir-ir');
await pagina.waitForSelector('#repartir-confirmar');
await pagina.click('#repartir-confirmar');
await esperar(() => /^Hecho/.test((document.getElementById('repartir-progreso') || {}).textContent || ''), null, 400);
await comprobarP('7. termina sin fallos', pagina.locator('#repartir-progreso').textContent(), 'Hecho.');
await comprobarP('7. quedan relacionados solo los 2 que recibieron fichero', relacionados(ORIGEN2),
  ['Egea Fon, Elena', 'Fuentes Gil, Felipe'].map(nombre).sort());

/* Fila 373: el filtro del alumnado enseña todas las personas, sin cortar en 200. */
const f373 = await pagina.evaluate(async () => {
  const lista = [];
  for (let i = 1; i <= 250; i++) lista.push({ nombre: 'Apellido' + String(i).padStart(3, '0') + ', Nombre', unidad: '1º ESO A', matriculado: true, idEscolar: '8' + String(i).padStart(6, '0') });
  const f = await RepartirFiltro.crear({ lista: lista }, []);
  f.conds.push({ tipo: 'unidad', valor: '1º ESO A' });
  const caja = document.createElement('div'); caja.innerHTML = RepartirFiltro.html(f); document.body.appendChild(caja);
  const r = { casillas: caja.querySelectorAll('.cc-lista input').length, sinMas: caja.textContent.indexOf('más (cuentan igual)') === -1, cuenta: caja.querySelector('.cc-cuenta').textContent };
  caja.remove();
  return r;
});
comprobar('8. filtro del alumnado con 250 personas: salen las 250 y no sale «más (cuentan igual)»', f373, { casillas: 250, sinMas: true, cuenta: '250 de 250 marcadas' });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
