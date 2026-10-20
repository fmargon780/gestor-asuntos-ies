/* Prueba de la fila 376 (docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md): el tutor y las tutorías vienen solo de las fichas
   `hecho/tutorias` del Centro de datos, de todos los cursos; el Gestor ya no lee el PDF de la función tutorial.
   Chromium real, con el disco de mentira de pruebas/navegador.mjs y datos inventados.

   1. COMPARAR ANTES DE QUITAR: los mismos datos de dos cursos, dichos como PDF de Séneca (leído por el lector de siempre)
      y como fichas del Centro de datos, dan la misma tabla TUTORIAS, el mismo tutor de cada grupo y las mismas filas de
      cada persona.
   2. Se toman las partes de todos los cursos (no solo el actual), byte a byte, con su apunte `hecho-tutorias|curso`;
      el PDF de la función tutorial que haya en el índice como listado ya no se toma.
   3. Huella que no coincide: no se copia ni se apunta. Misma huella dos veces: no se vuelve a copiar.
   4. `acuerdoHecho: 2`: no se toma y sale el aviso ámbar una sola vez.
   5. Un PDF suelto de un curso que el Centro de datos no trae: aviso ámbar «Súbelo al Centro de datos» y no se lee;
      uno de un curso que sí trae no da aviso y tampoco se lee.
   6. «Tablas de datos»: sale la línea «Las tutorías se suben al Centro de datos» y no hay forma de subir el PDF.
   7. El Certificado de función tutorial de quien fue tutor en dos cursos lleva los periodos de los dos. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
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
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv',
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\nPrimera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014\r\n'));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2500);
await pagina.evaluate(() => {
  window.__avisos = [];
  const original = U.aviso;
  U.aviso = function (texto, clase) { window.__avisos.push([texto, clase || '']); return original.apply(this, arguments); };
  const fijar = (dir, nombre, tipo) => {
    const h = dir._hijos.get(nombre);
    if (h) { const t = Date.now(); h.getFile = async () => new File([h._texto], nombre, { type: tipo || 'text/plain', lastModified: t }); }
  };
  const t = Carpetas.escribirTexto, b = Carpetas.escribirBytes;
  Carpetas.escribirTexto = async function (dir, nombre) { const r = await t.apply(this, arguments); fijar(dir, nombre); return r; };
  Carpetas.escribirBytes = async function (dir, nombre, bytes, tipo) { const r = await b.apply(this, arguments); fijar(dir, nombre, tipo); return r; };
});

const CURSO = await pagina.evaluate(() => U.cursoActual());
const [a1, a2] = CURSO.split('-').map(Number);
const PREVIO = String(a1 - 1).padStart(2, '0') + '-' + String(a2 - 1).padStart(2, '0');
const LARGO = (c) => '20' + c.slice(0, 2) + '/20' + c.slice(3);
const AHORA = Date.now();
const MIN = 60000;

/* ---- los datos inventados: lo que dice cada curso, en una sola lista que luego se dice de dos maneras ---- */
const ATENCION = 'Pedagogía Terapéutica, Audición y Lenguaje o Diversificación';
const FILA = (curso, grupo, empleado, dni, desde, hasta, sustituto = false) => ({ curso, grupo, empleado, dni, desde, hasta, sustituto });
const Y = 2000 + a1;   /* el año en que empieza el curso de hoy */
const D = (anio, mes, dia) => anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
const SPEC = [
  FILA(PREVIO, '3º A', 'Otero Campos, Marta', '11223344A', D(Y - 1, 9, 1), D(Y, 8, 31)),
  FILA(PREVIO, '1º ESO B', 'Reyes Palma, Fernando', '22334455B', D(Y - 1, 9, 1), D(Y, 1, 9)),
  FILA(PREVIO, '1º ESO B', 'Uceda Molina, Patricia', '33445566C', D(Y, 1, 10), D(Y, 8, 31), true),
  FILA(PREVIO, null, 'Vidal Cano, Ramón', '44556677D', D(Y - 1, 9, 1), D(Y, 8, 31)),
  FILA(CURSO, '4º A', 'Otero Campos, Marta', '11223344A', D(Y, 9, 1), D(Y + 1, 8, 31)),
  FILA(CURSO, '1º Bach A', 'Cabello Ruiz, Esperanza', '77889900G', D(Y, 9, 1), D(Y + 1, 8, 31)),
  FILA(CURSO, '2º B', 'Reyes Palma, Fernando', '22334455B', D(Y, 9, 1), D(Y + 1, 8, 31)),
  FILA(CURSO, '2º B', 'Uceda Molina, Patricia', '33445566C', D(Y, 9, 1), D(Y + 1, 8, 31)),
  FILA(CURSO, null, 'Vidal Cano, Ramón', '44556677D', D(Y, 9, 1), D(Y + 1, 8, 31))
];
const ficha = (curso) => {
  const grupos = [];
  SPEC.filter(f => f.curso === curso && f.grupo).forEach(f => {
    let r = grupos.find(g => g.id === f.grupo);
    if (!r) { r = { id: f.grupo, datos: { unidad: f.grupo, tutores: [] } }; grupos.push(r); }
    const [ap, nom] = f.empleado.split(', ');
    r.datos.tutores.push({ id: f.dni, documento: f.dni, empleado: f.empleado, apellidos: ap, nombre: nom, periodo: '', desde: f.desde, hasta: f.hasta, sustituto: f.sustituto, hoy: false });
  });
  return { acuerdoHecho: 1, conjunto: 'tutorias', parte: 'curso', cursoEscolar: curso, generado: new Date(AHORA).toISOString(), origen: 'centro-de-datos-ies',
    hoy: D(Y, 10, 1), campos: [], avisos: [], registros: grupos,
    funcionesSinGrupo: SPEC.filter(f => f.curso === curso && !f.grupo).map(f => ({ id: f.dni, documento: f.dni, empleado: f.empleado, desde: f.desde, hasta: f.hasta, sustituto: f.sustituto })) };
};

/* El mismo curso dicho como PDF de Séneca (lo que se leía hasta la fila 376). */
const pdfDe = (curso) => pagina.evaluate(async ([curso, spec, atencion]) => {
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const doc = await PDFLib.PDFDocument.create();
  const letra = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const p = doc.addPage([595, 1100]);
  let y = 1050;
  const linea = (trozos, salto) => { trozos.forEach(([x, t]) => p.drawText(t, { x, y, size: 8, font: letra })); y -= (salto || 14); };
  const X = { unidad: 40, nombre: 110, dni: 330, periodo: 420 };
  const periodo = (f) => f.desde.split('-').reverse().join('/') + ' - ' + f.hasta.split('-').reverse().join('/');
  const nombre = (f) => f.empleado + (f.sustituto ? ' (Sustituto/a)' : '');
  const del = spec.filter(f => f.curso === curso);
  const largo = '20' + curso.slice(0, 2) + '/20' + curso.slice(3);
  linea([[40, 'Relación de funciones tutoriales']]);
  linea([[40, 'D./Dña. Directora del centro certifica que durante el curso escolar ' + largo + ' han ejercido:']], 20);
  linea([[40, 'Funciones tutoriales procedentes de tutorías de unidades']]);
  linea([[X.unidad, 'Unidad'], [X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
  del.filter(f => f.grupo).forEach(f => linea([[X.unidad, f.grupo], [X.nombre, nombre(f)], [X.dni, f.dni], [X.periodo, periodo(f)]]));
  y -= 6;
  linea([[40, 'Funciones tutoriales correspondientes a Pedagogía Terapéutica, Audición y Lenguaje y Diversificación Curricular']]);
  linea([[X.nombre, 'Empleado/a'], [X.dni, 'D.N.I.'], [X.periodo, 'Periodo']]);
  del.filter(f => !f.grupo).forEach(f => linea([[X.nombre, nombre(f)], [X.dni, f.dni], [X.periodo, periodo(f)]]));
  linea([[40, 'Pág. 1 de 1'], [300, 'Ref.Doc.: CerFunTut']]);
  return await TablasDatosLeer.tutoriasDePdf(await doc.save(), 'Función Tutorial ' + largo.replace('/', '-') + '.pdf');
}, [curso, SPEC, ATENCION]);

const ordenar = (filas) => filas.map(f => JSON.stringify(f)).sort();

/* ---- montar la carpeta del Centro de datos ---- */
async function montar(spec) {
  await pagina.evaluate(async (spec) => {
    const raiz = window.__disco.archivo;
    raiz._hijos.delete('CENTRO DE DATOS');
    const centro = await raiz.getDirectoryHandle('CENTRO DE DATOS', { create: true });
    const sha = async (texto) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)))).map(b => b.toString(16).padStart(2, '0')).join('');
    const poner = async (ruta, texto) => {
      const partes = ruta.split('/');
      let d = centro;
      for (let i = 0; i < partes.length - 1; i++) d = await d.getDirectoryHandle(partes[i], { create: true });
      const f = window.__disco.fich(partes[partes.length - 1], texto);
      f.getFile = async () => new File([texto], partes[partes.length - 1], { lastModified: Date.now() });
      d._hijos.set(partes[partes.length - 1], f);
    };
    const lista = [];
    for (const l of spec.listados || []) {
      await poner(l.ruta, l.texto);
      lista.push({ clave: l.clave, variante: l.variante || '', titulo: l.clave, fichero: l.fichero, ruta: l.ruta, tipo: 'pdf', cursoEscolar: l.cursoEscolar || '',
        ambito: '', subido: l.subido, subidoPor: 'direccion@centro-inventado.es', resumen: '', huella: l.huella });
    }
    const hechos = [];
    for (const p of spec.partes || []) {
      const texto = JSON.stringify(p.obj);
      const ruta = 'hecho/tutorias/' + p.obj.cursoEscolar + '/curso.json';
      await poner(ruta, texto);
      hechos.push({ conjunto: 'tutorias', parte: 'curso', cursoEscolar: p.obj.cursoEscolar, acuerdoHecho: p.acuerdoHecho || 1, ruta, idDrive: '', hecho: p.hecho,
        huella: p.huella === 'mala' ? 'f'.repeat(64) : (p.huella || await sha(texto)), registros: p.obj.registros.length, bytes: texto.length, alDia: true, fuentes: [] });
    }
    const indice = { contrato: 2, ocupado: false, actualizado: new Date().toISOString(), cursoActual: U.cursoActual(), web: '', listados: lista, capacidades: ['hechos'], hechos };
    centro._hijos.set('indice.json', window.__disco.fich('indice.json', JSON.stringify(indice)));
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, centro);
  }, spec);
}

async function limpiar() {
  await pagina.evaluate(async () => {
    const datos = App.E.datos;
    for (const k of [...datos._hijos.keys()]) if (/^(TUTORIAS-HECHO|Función Tutorial)/.test(k)) datos._hijos.delete(k);
    App.E.gestor._hijos.delete('centro-de-datos.json');
    App.E.gestor._hijos.delete('datos-origen.json');
    await CentroDeDatos.leerApuntes(true);
    TablasDatos.olvidar();
    window.__avisos.length = 0;
  });
}
const escribir = (nombre, texto) => pagina.evaluate(async ([n, t]) => { await Carpetas.escribirTexto(App.E.datos, n, t); }, [nombre, texto]);
const ficheros = () => pagina.evaluate(() => [...App.E.datos._hijos.keys()].filter(k => /^(TUTORIAS-HECHO|Función Tutorial)/.test(k)).sort());
const apuntesCD = () => pagina.evaluate(async () => Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).filter(k => /tutorias/.test(k)).sort());
const traer = (op = {}) => pagina.evaluate(async (op) => { const r = await CentroDeDatos.traer(Object.assign({ avisar: false, pedir: true }, op)); return [r.ok, r.tomados, r.fallos]; }, op);
const tabla = () => pagina.evaluate(async () => { TablasDatos.olvidar(); const d = await TablasDatos.cargar(); return { t: d.tablas.TUTORIAS || null, errores: d.errores }; });

/* ================= 1. COMPARAR: PDF y fichas dicen lo mismo ================= */
console.log('--- 1. el mismo dato, por el PDF y por las fichas ---');
await limpiar();
const filasPdf = (await pdfDe(PREVIO)).concat(await pdfDe(CURSO));
await comprobar('1. el PDF de Séneca (lector de siempre) da las 9 líneas de los dos cursos', filasPdf.length, SPEC.length);
await escribir('TUTORIAS-HECHO ' + PREVIO + '.json', JSON.stringify(ficha(PREVIO)));
await escribir('TUTORIAS-HECHO ' + CURSO + '.json', JSON.stringify(ficha(CURSO)));
const t1 = await tabla();
await comprobar('1. la tabla TUTORIAS de las fichas lleva las mismas filas que la del PDF, de los dos cursos',
  ordenar(t1.t.filas), ordenar(filasPdf));
await comprobar('1. y los dos cursos, con el curso como «2025/2026» y no «25-26»', t1.t.cursos, [LARGO(PREVIO), LARGO(CURSO)]);
await comprobar('1. sin errores ni avisos', t1.errores, []);
await comprobar('1. las líneas de funcionesSinGrupo entran con el grupo de atención a la diversidad',
  t1.t.filas.filter(f => f.grupo === ATENCION).map(f => [f.curso, f.nombre, f.dni]),
  [[LARGO(PREVIO), 'Vidal Cano, Ramón', '44556677D'], [LARGO(CURSO), 'Vidal Cano, Ramón', '44556677D']]);
await comprobar('1. el (Sustituto/a) no se queda en el nombre',
  t1.t.filas.filter(f => f.dni === '33445566C').map(f => f.nombre), ['Uceda Molina, Patricia', 'Uceda Molina, Patricia']);
const decidir = (filas, unidad) => pagina.evaluate(([filas, unidad, hoy]) => {
  const r = TutorDelGrupo.decidir({ esAlumnado: true, unidad, hayTabla: true, filas, hoy, grupoAtencion: TablasDatosLeer.GRUPO_ATENCION, correosPorClave: {}, recordados: {} });
  return [r.motivo, r.tutores.map(t => t.nombre)];
}, [filas, unidad, D(Y, 10, 1)]);
for (const u of ['2º B', '4º A', '1º Bach A', '1º ESO B']) {
  await comprobar('1. el tutor de ' + u + ' el 1 de octubre es el mismo por el PDF y por las fichas', await decidir(t1.t.filas, u), await decidir(filasPdf, u));
}
await comprobar('1. el tutor de 2º B (dos a la vez) y el de 4º A, a la vista', [(await decidir(t1.t.filas, '2º B'))[1], (await decidir(t1.t.filas, '4º A'))[1]],
  [['Reyes Palma, Fernando', 'Uceda Molina, Patricia'], ['Otero Campos, Marta']]);
await comprobar('1. las filas de cada persona (Otero Campos, Marta) son las mismas por los dos caminos',
  pagina.evaluate(async (pdf) => {
    const p = { nombre: 'Otero Campos, Marta', documento: '11223344A' };
    const deFichas = (await TablasDatos.filasDe('TUTORIAS', p)).map(f => TablasDatos.celdasDe('TUTORIAS', f, TablasDatos.COLUMNAS_TUTORIAS));
    const deElPdf = pdf.filter(f => f.clave === '11223344').sort((a, b) => a.curso.localeCompare(b.curso)).map(f => TablasDatos.celdasDe('TUTORIAS', f, TablasDatos.COLUMNAS_TUTORIAS));
    return [deFichas.length, JSON.stringify(deFichas) === JSON.stringify(deElPdf), deFichas.map(c => c[0])];
  }, filasPdf), [2, true, ['Tutoría 3º A', 'Tutoría 4º A']]);

/* ================= 2. SE TOMAN LAS PARTES DE TODOS LOS CURSOS ================= */
console.log('--- 2. se toman las partes de todos los cursos ---');
await limpiar();
const P_ACTUAL = ficha(CURSO), P_PREVIO = ficha(PREVIO);
await montar({ listados: [{ clave: 'tutorias', fichero: 'Función Tutorial ' + LARGO(CURSO).replace('/', '-') + '.pdf', ruta: 'listados/tutorias/Función Tutorial ' + LARGO(CURSO).replace('/', '-') + '.pdf', texto: '%PDF-1.4 inventado', cursoEscolar: CURSO,
                 subido: new Date(AHORA + 5 * MIN).toISOString(), huella: 'inv-pdf' }],
  partes: [{ obj: P_ACTUAL, hecho: new Date(AHORA + 10 * MIN).toISOString() }, { obj: P_PREVIO, hecho: new Date(AHORA + 10 * MIN).toISOString() }] });
const r2 = await traer();
await comprobar('2. se toman las tutorías, y el PDF del listado no', [r2[0], r2[1], r2[2]], [true, ['tutorias'], []]);
await comprobar('2. se copian las dos fichas (este curso y el anterior) y ningún PDF', await ficheros(),
  ['TUTORIAS-HECHO ' + PREVIO + '.json', 'TUTORIAS-HECHO ' + CURSO + '.json'].sort());
await comprobar('2. byte a byte',
  pagina.evaluate(async (n) => JSON.parse(await Carpetas.leerTexto(App.E.datos, n)).registros.length, 'TUTORIAS-HECHO ' + CURSO + '.json'), P_ACTUAL.registros.length);
await comprobar('2. apuntadas con la llave hecho-tutorias|curso', await apuntesCD(), ['hecho-tutorias|' + PREVIO, 'hecho-tutorias|' + CURSO].sort());
await comprobar('2. un aviso verde que nombra la función tutorial',
  pagina.evaluate(() => window.__avisos.filter(a => /^Traído/.test(a[0])).map(a => /Función tutorial \(/.test(a[0]))), [true]);
const t2 = await tabla();
await comprobar('2. y la tabla ya sale de lo traído, con los dos cursos', [t2.t.cursos, t2.t.filas.length], [[LARGO(PREVIO), LARGO(CURSO)], SPEC.length]);
await comprobar('2. el apunte de «tutorias» lo ve la línea gris de Tablas de datos',
  pagina.evaluate(async () => !!CentroDeDatos.apunteDe(await CentroDeDatos.leerApuntes(true), 'tutorias')), true);

/* ================= 3. LA HUELLA, Y NO REPETIR ================= */
console.log('--- 3. la huella ---');
await limpiar();
await montar({ partes: [{ obj: P_ACTUAL, hecho: new Date(AHORA + 20 * MIN).toISOString(), huella: 'mala' }] });
await traer({ avisar: true });
await comprobar('3. con la huella mala no se copia ni se apunta', [await ficheros(), await apuntesCD()], [[], []]);
await montar({ partes: [{ obj: P_ACTUAL, hecho: new Date(AHORA + 20 * MIN).toISOString() }] });
await traer();
await comprobar('3. con la buena, sí', [await ficheros(), await apuntesCD()], [['TUTORIAS-HECHO ' + CURSO + '.json'], ['hecho-tutorias|' + CURSO]]);
await pagina.evaluate(() => { window.__avisos.length = 0; });
const r3 = await traer();
await comprobar('3. la misma huella otra vez: no se toma nada y no hay aviso verde', [r3[1], await pagina.evaluate(() => window.__avisos.filter(a => /^Traído/.test(a[0])).length)], [[], 0]);

/* ================= 4. ACUERDO MÁS NUEVO ================= */
console.log('--- 4. acuerdoHecho 2 ---');
await limpiar();
await montar({ partes: [{ obj: P_ACTUAL, hecho: new Date(AHORA + 30 * MIN).toISOString(), acuerdoHecho: 2 }] });
await traer();
await traer();
await comprobar('4. no se toma y el aviso ámbar sale una sola vez',
  [await ficheros(), await pagina.evaluate(() => window.__avisos.filter(a => /tutorías del Centro de datos son más nuevas/.test(a[0])).map(a => a[1]))], [[], ['ambar']]);

/* ================= 5. UN PDF SUELTO ================= */
console.log('--- 5. un PDF suelto ---');
await limpiar();
await escribir('TUTORIAS-HECHO ' + CURSO + '.json', JSON.stringify(P_ACTUAL));
await escribir('Función Tutorial ' + LARGO(CURSO).replace('/', '-') + '.pdf', '%PDF-1.4 inventado');
await escribir('Función Tutorial 1999-2000.pdf', '%PDF-1.4 inventado');
const t5 = await tabla();
await comprobar('5. el PDF de un curso que el Centro de datos trae no da aviso; el de uno que no trae, sí, en ámbar y con la frase pedida',
  t5.errores, [{ fichero: 'Función Tutorial 1999-2000.pdf', motivo: 'El curso 1999-2000 está en un PDF suelto, pero no en el Centro de datos. Súbelo al Centro de datos.' }]);
await comprobar('5. y no se lee: la tabla es solo la de la ficha', t5.t.filas.length, SPEC.filter(f => f.curso === CURSO).length);
await comprobar('5. sin ficha de ningún curso, un PDF suelto no da tabla (no hay vuelta atrás al PDF)',
  pagina.evaluate(async () => { for (const k of [...App.E.datos._hijos.keys()]) if (/^TUTORIAS-HECHO/.test(k)) App.E.datos._hijos.delete(k); TablasDatos.olvidar(); const d = await TablasDatos.cargar(); return [!!d.tablas.TUTORIAS, d.errores.length]; }), [false, 2]);

/* ================= 6. LA PANTALLA ================= */
console.log('--- 6. Tablas de datos ---');
await pagina.evaluate(async () => { await TablasDatosPantalla.pintar(); });
await comprobar('6. sale la línea «Las tutorías se suben al Centro de datos» y no se sube ningún PDF',
  pagina.evaluate(() => {
    const b = document.getElementById('bloque-tablas-datos');
    return [b ? (b.querySelector('#tablas-datos-tutorias-linea') || {}).textContent : null,
            b ? [...b.querySelectorAll('input[type=file]')].map(i => i.accept) : null,
            b ? /PDF/.test(b.querySelector('.bloque-cuerpo > p:nth-of-type(2)').textContent) : null];
  }), ['Las tutorías se suben al Centro de datos.', ['.csv'], false]);

/* ================= 7. EL CERTIFICADO DE DOS CURSOS ================= */
console.log('--- 7. el certificado de función tutorial ---');
await limpiar();
await escribir('TUTORIAS-HECHO ' + PREVIO + '.json', JSON.stringify(P_PREVIO));
await escribir('TUTORIAS-HECHO ' + CURSO + '.json', JSON.stringify(P_ACTUAL));
const cert = (persona) => pagina.evaluate(async (persona) => {
  const buffer = new Uint8Array(await (await fetch('plantillas/certificado-funcion-tutorial.docx')).arrayBuffer());
  TablasDatos.olvidar();
  window.FichaTercero.datosBasicos = async () => ({ persona, categoria: 'PERSONAL' });
  const valores = { centro: 'IES de Prueba', campos: {} };
  const prep = await TablasDatos.prepararDocumento(buffer, { nombre: 'x', ficha: {} }, valores);
  const res = await Docx.rellenar(prep.buffer, valores);
  const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
  const tbl = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/) || [''])[0];
  const texto = (x) => (x.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('');
  return (tbl.match(/<w:tr>[\s\S]*?<\/w:tr>/g) || []).map((f) => (f.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(texto));
}, persona);
const celdas = (curso, grupo, desde, hasta) => [grupo === ATENCION ? 'Tutoría de ' + grupo : 'Tutoría ' + grupo, curso.replace('/', '-'), desde, hasta];
await comprobar('7. Otero Campos, Marta (tutora en dos cursos): la cabecera y los periodos de los dos cursos',
  await cert({ nombre: 'Otero Campos, Marta', documento: '11223344A', puesto: 'Matemáticas P.E.S.' }), [
    ['Cargo', 'Curso', 'Toma de posesión', 'Cese'],
    celdas(LARGO(PREVIO), '3º A', '01/09/' + (Y - 1), '31/08/' + Y),
    celdas(LARGO(CURSO), '4º A', '01/09/' + Y, '31/08/' + (Y + 1))]);
await comprobar('7. Vidal Cano, Ramón (sin grupo, dos cursos): los dos periodos de atención a la diversidad',
  (await cert({ nombre: 'Vidal Cano, Ramón', documento: '44556677D', puesto: 'Pedagogía Terapéutica' })).length, 3);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? fallos + ' fallos.' : 'Todo bien.');
process.exit(fallos ? 1 : 0);
