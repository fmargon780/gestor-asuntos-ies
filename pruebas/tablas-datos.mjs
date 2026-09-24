/* Prueba de las tablas de datos (24-sep-2026, fila 110 de docs/COLA.md,
   docs/TABLAS-DE-DATOS.md). En navegador de verdad, porque hacen falta
   pdf-lib (para dibujar un PDF de ejemplo) y pdf.js (para leerlo).
   Nombres y DNI inventados.

     1. Un PDF con la misma disposición que el de Séneca (dos bloques,
        nombre partido en dos líneas, «(Sustituto/a)», un punto suelto,
        tres periodos de la misma persona en el mismo grupo) -> filas.
     2. {{TABLA TUTORIAS}} dentro de un .docx -> <w:tbl> con cuatro
        columnas y las filas.
     3. {{ESPECIALIDAD}} sin dato -> «[falta: Especialidad]» en amarillo y
        en «faltan»; con dato, el puesto del RelPerCen.
     4. Un CSV en Latin-1 y un .xlsx mínimo en `Tablas/` -> se leen con su
        cabecera, y {{DATO …}} trae su valor. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ---------- 1. el PDF de funciones tutoriales ---------- */
console.log('--- 1. el PDF de Séneca, leído por posiciones ---');
const filas1 = await pagina.evaluate(async () => {
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const doc = await PDFLib.PDFDocument.create();
  const fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  let y = 800;
  function linea(trozos, salto) {
    trozos.forEach(([x, t]) => p.drawText(t, { x, y, size: 8, font: fuente }));
    y -= (salto || 14);
  }
  const X = { unidad: 40, nombre: 110, dni: 330, periodo: 420 };
  linea([[40, 'Relación de funciones tutoriales']]);
  linea([[40, 'D./Dña. Directora del centro certifica que durante el curso escolar 2025/2026 han ejercido:']], 20);
  linea([[40, 'Funciones tutoriales procedentes de tutorías de unidades']]);
  linea([[X.unidad, 'Unidad'], [X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
  linea([[X.unidad, '1º ESO A'], [X.nombre, 'Pérez Gómez, Juana'], [X.dni, '11111111H'], [X.periodo, '01/09/2025 - 31/08/2026']]);
  linea([[X.unidad, '2º ESO B'], [X.nombre, 'Martínez Barrientos, María del'], [X.dni, '22222222J'], [X.periodo, '01/09/2025 - 15/11/2025']], 10);
  linea([[X.nombre, 'Carmen']]);
  linea([[X.unidad, '2º ESO B'], [X.nombre, 'Martínez Barrientos, María del'], [X.dni, '22222222J'], [X.periodo, '10/01/2026 - 20/03/2026']], 10);
  linea([[X.nombre, 'Carmen']]);
  linea([[X.unidad, '2º ESO B'], [X.nombre, 'Martínez Barrientos, María del'], [X.dni, '22222222J'], [X.periodo, '10/04/2026 - 31/08/2026']], 10);
  linea([[X.nombre, 'Carmen']]);
  linea([[X.unidad, '3º ESO C'], [X.nombre, 'Cueto Carretero, María Antonia'], [X.dni, '33333333P'], [X.periodo, '16/11/2025 - 09/01/2026']], 10);
  linea([[X.nombre, '(Sustituto/a)']]);
  linea([[X.unidad, '4º ESO A'], [X.nombre, 'Manhaes Panini ., Andre'], [X.dni, 'X4444444L'], [X.periodo, '01/09/2025 - 31/08/2026']], 20);
  linea([[40, 'Funciones tutoriales correspondientes a Pedagogía Terapéutica, Audición y Lenguaje y Diversificación Curricular']]);
  linea([[X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
  linea([[X.nombre, 'Pérez Gómez, Juana'], [X.dni, '11111111H'], [X.periodo, '01/09/2025 - 31/08/2026']], 30);
  linea([[40, 'Pág. 1 de 1'], [300, 'Ref.Doc.: CerFunTut']]);
  const bytes = await doc.save();
  const filas = await TablasDatosLeer.tutoriasDePdf(bytes, 'Función Tutorial 2025-2026.pdf');
  /* Se deja en la carpeta de datos para lo de más abajo, dos veces (bajado dos veces). */
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const datos = await g.getDirectoryHandle('datos', { create: true });
  for (const n of ['Función Tutorial 2025-2026.pdf', 'Función Tutorial 2025-2026 (1).pdf']) {
    const h = await datos.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(new Blob([bytes])); await w.close();
  }
  return filas;
});
await comprobar('1. siete filas: cinco de unidades y una de atención a la diversidad (más los tres periodos)',
  Promise.resolve(filas1.length), 7);
await comprobar('1. la primera fila, entera',
  Promise.resolve(filas1[0]), { curso: '2025/2026', grupo: '1º ESO A', nombre: 'Pérez Gómez, Juana', dni: '11111111H',
    desde: '2025-09-01', hasta: '2026-08-31', clave: '11111111' });
await comprobar('1. el nombre partido en dos líneas se une, en las tres filas de la misma persona',
  Promise.resolve(filas1.filter((f) => f.dni === '22222222J').map((f) => [f.nombre, f.grupo, f.desde])), [
    ['Martínez Barrientos, María del Carmen', '2º ESO B', '2025-09-01'],
    ['Martínez Barrientos, María del Carmen', '2º ESO B', '2026-01-10'],
    ['Martínez Barrientos, María del Carmen', '2º ESO B', '2026-04-10']]);
await comprobar('1. sin «(Sustituto/a)»',
  Promise.resolve(filas1.filter((f) => f.dni === '33333333P')[0].nombre), 'Cueto Carretero, María Antonia');
await comprobar('1. sin el punto suelto',
  Promise.resolve(filas1.filter((f) => f.dni === 'X4444444L')[0].nombre), 'Manhaes Panini, Andre');
await comprobar('1. el segundo bloque, con su grupo',
  Promise.resolve(filas1[filas1.length - 1].grupo), 'Pedagogía Terapéutica, Audición y Lenguaje o Diversificación');

/* ---------- 2 y 3. los huecos en un .docx ---------- */
console.log('--- 2 y 3. {{TABLA TUTORIAS}} y {{ESPECIALIDAD}} en el certificado ---');
const r23 = await pagina.evaluate(async () => {
  const buffer = new Uint8Array(await (await fetch('plantillas/certificado-funcion-tutorial.docx')).arrayBuffer());
  TablasDatos.olvidar();
  const lista = await TablasDatos.lista();
  const juana = { nombre: 'Pérez Gómez, Juana', documento: '11111111H', puesto: '' };
  const conPuesto = { nombre: 'Martínez Barrientos, María del Carmen', documento: '22222222J', puesto: 'Biología y Geología (Inglés) P.E.S.' };
  async function generar(persona) {
    window.FichaTercero.datosBasicos = async () => ({ persona: persona, categoria: 'PERSONAL' });
    const valores = { centro: 'IES de Prueba' };
    const prep = await TablasDatos.prepararDocumento(buffer, { nombre: 'x', ficha: {} }, valores);
    let res = await Docx.rellenar(prep.buffer, valores);
    res = await TablasDatos.resaltarResultado(res, prep.faltan);
    const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
    return { xml, faltan: res.faltan };
  }
  const a = await generar(juana);
  const b = await generar(conPuesto);
  const tbl = (a.xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/) || [''])[0];
  const tblB = (b.xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/) || [''])[0];
  return {
    tablas: lista.tablas.map((t) => [t.nombre, t.filas]),
    columnas: (tbl.match(/<w:gridCol /g) || []).length,
    filasJuana: (tbl.match(/<w:tr>/g) || []).length,
    cabecera: /Curso escolar[\s\S]*Grupo[\s\S]*Desde[\s\S]*Hasta/.test(tbl),
    negrita: /<w:b\/>/.test(tbl),
    filasB: (tblB.match(/<w:tr>/g) || []).length,
    huecoTablaQueda: /TABLA TUTORIAS/.test(a.xml),
    faltaEnAmarillo: /<w:highlight w:val="yellow"\/><\/w:rPr><w:t xml:space="preserve">\[falta: Especialidad\]<\/w:t>/.test(a.xml),
    faltanA: a.faltan.indexOf('Especialidad') !== -1,
    especialidadB: b.xml.indexOf('Biología y Geología (Inglés) P.E.S.') !== -1,
    faltanB: b.faltan.indexOf('Especialidad') === -1
  };
});
await comprobar('2. la tabla de tutorías, leída de los dos PDF sin repetir', Promise.resolve(r23.tablas), [['TUTORIAS', 7]]);
await comprobar('2. <w:tbl> con cuatro columnas', Promise.resolve(r23.columnas), 4);
await comprobar('2. cabecera en negrita (Curso escolar · Grupo · Desde · Hasta)', Promise.resolve([r23.cabecera, r23.negrita]), [true, true]);
await comprobar('2. Juana: la cabecera y sus dos periodos (unidad y atención a la diversidad)', Promise.resolve(r23.filasJuana), 3);
await comprobar('2. María del Carmen: la cabecera y sus tres periodos', Promise.resolve(r23.filasB), 4);
await comprobar('2. el hueco ya no queda escrito', Promise.resolve(r23.huecoTablaQueda), false);
await comprobar('3. sin especialidad: «[falta: Especialidad]» en amarillo', Promise.resolve(r23.faltaEnAmarillo), true);
await comprobar('3. y en la lista de «faltan»', Promise.resolve(r23.faltanA), true);
await comprobar('3. con especialidad: el puesto tal cual, y nada falta', Promise.resolve([r23.especialidadB, r23.faltanB]), [true, true]);

/* ---------- 4. CSV en Latin-1 y .xlsx en Tablas/ ---------- */
console.log('--- 4. CSV en Latin-1 y Excel en Tablas/ ---');
const r4 = await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const datos = await g.getDirectoryHandle('datos', { create: true });
  const tablas = await datos.getDirectoryHandle('Tablas', { create: true });
  /* Latin-1 de verdad: un byte por letra. */
  const csv = 'Nombre;DNI;Departamento\r\nPérez Gómez, Juana;11111111H;Matemáticas\r\n';
  const latin1 = new Uint8Array(Array.from(csv).map((c) => c.charCodeAt(0)));
  let h = await tablas.getFileHandle('Departamentos.csv', { create: true });
  let w = await h.createWritable(); await w.write(new Blob([latin1])); await w.close();
  /* Un .xlsx mínimo, montado como ZIP sin comprimir (lo mismo que hace scripts/hacer-plantillas.mjs). */
  const hoja = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
    '<row r="2"><c r="A2" t="inlineStr"><is><t>11111111H</t></is></c><c r="B2" t="s"><v>2</v></c></row></sheetData></worksheet>';
  const compartidos = '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<si><t>D.N.I.</t></si><si><t>Cargo</t></si><si><t>Jefa de Departamento</t></si></sst>';
  const I = Docx.interno;
  const entradas = [['xl/worksheets/sheet1.xml', hoja], ['xl/sharedStrings.xml', compartidos]];
  const partes = [], centrales = [];
  let offset = 0;
  for (const [n, t] of entradas) {
    const datosB = new TextEncoder().encode(t);
    const nombreBytes = new TextEncoder().encode(n);
    const crc = I.crc32(datosB);
    const local = I.cabeceraLocal({ crc, tam: datosB.length, nombreBytes, tiempoDos: 0, fechaDos: 0 });
    partes.push(local, datosB);
    centrales.push(I.entradaCentral({ crc, tam: datosB.length, nombreBytes, tiempoDos: 0, fechaDos: 0, atributosExternos: 0, offset }));
    offset += local.length + datosB.length;
  }
  const dir = I.concatenar(centrales);
  const xlsx = I.concatenar(partes.concat([dir, I.finDeDirectorio(entradas.length, dir.length, offset)]));
  h = await tablas.getFileHandle('Cargos.xlsx', { create: true });
  w = await h.createWritable(); await w.write(new Blob([xlsx])); await w.close();

  TablasDatos.olvidar();
  const d = await TablasDatos.cargar();
  const persona = { nombre: 'Pérez Gómez, Juana', documento: '11111111H' };
  const valores = {};
  window.FichaTercero.datosBasicos = async () => ({ persona, categoria: 'PERSONAL' });
  return {
    csvCab: d.tablas.DEPARTAMENTOS && d.tablas.DEPARTAMENTOS.cabecera,
    csvDato: d.tablas.DEPARTAMENTOS && d.tablas.DEPARTAMENTOS.filas[0].celdas.Departamento,
    xlsxCab: d.tablas.CARGOS && d.tablas.CARGOS.cabecera,
    xlsxFilas: (await TablasDatos.filasDe('Cargos', persona)).map((f) => f.celdas.Cargo),
    dato: Plantillas.rellenar('{{DATO DEPARTAMENTOS: Departamento}}', await (async () => {
      const texto = '{{DATO DEPARTAMENTOS: Departamento}}';
      const huecos = ['DATO DEPARTAMENTOS: Departamento'];
      const filas = await TablasDatos.filasDe('DEPARTAMENTOS', persona);
      valores.datosTablas = {}; valores.datosTablas[U.normalizar(huecos[0])] = TablasDatos.celdasDe('DEPARTAMENTOS', filas[0], ['Departamento'])[0];
      return valores;
    })()).texto,
    errores: d.errores
  };
});
await comprobar('4. el CSV en Latin-1, con su cabecera y las tildes bien', Promise.resolve([r4.csvCab, r4.csvDato]),
  [['Nombre', 'DNI', 'Departamento'], 'Matemáticas']);
await comprobar('4. el .xlsx, con su cabecera', Promise.resolve(r4.xlsxCab), ['D.N.I.', 'Cargo']);
await comprobar('4. y unido a la persona por su DNI', Promise.resolve(r4.xlsxFilas), ['Jefa de Departamento']);
await comprobar('4. {{DATO …}} trae su valor', Promise.resolve(r4.dato), 'Matemáticas');
await comprobar('4. sin ficheros que no se hayan podido leer', Promise.resolve(r4.errores), []);

await comprobar('sin errores en la página', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
