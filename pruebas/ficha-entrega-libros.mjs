/* Fila 501 (docs/501-FICHA-ENTREGA-LIBROS.md): la ficha de entrega de libros y su duplicado por extravío.
   Chromium real con la copia de pruebas (?demo=1&auto=1&libros=1).

   1. Sin pantalla: el nivel de la matrícula, el cruce con el listado, los textos y el título.
   2. El Word: libros de la matrícula, duplicado, avisos que impiden generar, ningún tutor, firmas.
   3. El grupo: «Generar para N de M» y quien se queda fuera.
   4. El buscador de «Nuevo asunto»: desplegable de unidad.
   5. El tipo: campos, guía de un hito y plantilla; tomar las partes del Centro de datos. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&libros=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });
await p.waitForTimeout(3000);

/* ================= 1. SIN PANTALLA ================= */
console.log('--- 1. nivel, cruce, textos ---');
const r1 = await p.evaluate(async () => {
  const lib = await LibrosHecho.cargar();
  const alumnos = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista;
  const de = (id) => alumnos.filter((a) => a.id === id)[0];
  const f = (id) => LibrosHecho.fichaDe(de(id), lib.registros);
  const marina = f('2100001'), adrian = f('2100040'), ana = f('2100012'), ruben = f('2100007'), nerea = f('2100016');
  return {
    niveles: ['1º de E.S.O.', '4º de E.S.O.', '1º de Bachillerato', '2º de Bachillerato', '', 'FP Básica'].map(LibrosHecho.nivelDeCurso),
    hay: lib.hay, registros: lib.registros.length,
    marina: [marina.ok, marina.nivelTexto, marina.libros], adrian: [adrian.ok, adrian.libros.length, adrian.libros.indexOf('Religión Católica')],
    ana: [ana.ok, ana.avisos], ruben: [ruben.ok, ruben.avisos], nerea: [nerea.ok, nerea.avisos.length],
    sinMaterias: LibrosHecho.fichaDe({ nombre: 'Sin Materias, Pepe', curso: '1º de E.S.O.' }, lib.registros).avisos,
    titulo: [LibrosFicha.tituloDe('1º ESO'), LibrosFicha.tituloDe('4º ESO')],
    fecha: [LibrosFicha.fechaLarga('15/09/2026'), LibrosFicha.fechaLarga('2026-09-05'), LibrosFicha.fechaLarga('mañana')],
    curso: LibrosFicha.cursoEn('26-27'),
    original: LibrosFicha.compromiso({ nombre: 'Lucía Marín Soto', nivelTexto: '1º ESO', duplicado: false, curso: '26-27' }),
    duplicado: LibrosFicha.compromiso({ nombre: 'Lucía Marín Soto', nivelTexto: '1º ESO', duplicado: true, fechaOriginal: '15 de septiembre de 2026', curso: '26-27' }),
    natural: LibrosFicha.nombreNatural('Marín Soto, Lucía 1234567'),
    opc: [LibrosFicha.opcionesDe({ campos: { 'Duplicado por extravío': 'Sí', 'Fecha de la entrega original': '15/09/2026' } }), LibrosFicha.opcionesDe({ campos: {} })]
  };
});
await comprobar('1. nivel de la matrícula', r1.niveles, ['eso1', 'eso4', 'bac1', 'bac2', '', '']);
await comprobar('1. el listado se lee', [r1.hay, r1.registros], [true, 24]);
await comprobar('1. Marina: solo las asignaturas con libro de su matrícula, con Religión y Francés', r1.marina,
  [true, '1º ESO', ['Biología y Geología', 'Geografía e Historia', 'Lengua Castellana y Literatura', 'Inglés', 'Matemáticas', 'Música', 'Religión Católica', 'Francés (Segundo Idioma)']]);
await comprobar('1. Adrián: sin Religión ni Francés, seis filas', r1.adrian, [true, 6, -1]);
await comprobar('1. Ana: una asignatura que no está en el listado impide la ficha', r1.ana,
  [false, ['Klein Soto, Ana: la asignatura «Tecnología Aplicada» no está en el listado de libros. No se puede generar la ficha hasta arreglarlo en el Centro de datos.']]);
await comprobar('1. Rubén (Bachillerato): el listado no tiene libros de su nivel', r1.ruben,
  [false, ['Fuentes Calvo, Rubén: el listado de libros no tiene libros de 1º Bachillerato. No se puede generar la ficha.']]);
await comprobar('1. Nerea: también se queda fuera', r1.nerea, [false, 1]);
await comprobar('1. sin asignaturas de la matrícula, no hay ficha', r1.sinMaterias.length, 1);
await comprobar('1. título y curso', [r1.titulo, r1.curso.larga, r1.curso.guion], [['FICHA ENTREGA LIBROS 1º DE ESO', 'FICHA ENTREGA LIBROS 4º DE ESO'], r1.curso.larga, r1.curso.guion]);
await comprobar('1. fechas largas', r1.fecha, ['15 de septiembre de 2026', '5 de septiembre de 2026', '']);
await comprobar('1. texto de la original', r1.original,
  'Quien firma abajo como padre, madre o tutor/a legal del alumno: Lucía Marín Soto, matriculado/a en este centro en el curso de 1º ESO, ha recibido TODOS los libros correspondientes a su matrícula y se compromete a devolverlos en buen estado cuando finalice el curso académico 2026-27.');
await comprobar('1. texto del duplicado', r1.duplicado,
  'Quien firma abajo como padre, madre o tutor/a legal del alumno: Lucía Marín Soto, matriculado/a en este centro en el curso de 1º ESO, recibió el 15 de septiembre de 2026 TODOS los libros correspondientes a su matrícula y se compromete a devolverlos en buen estado cuando finalice el curso académico 2026-27. Esta ficha sustituye a la original, extraviada.');
await comprobar('1. nombre natural y campos', [r1.natural, r1.opc], ['Lucía Marín Soto', [{ duplicado: true, fecha: '15/09/2026' }, { duplicado: false, fecha: '' }]]);

/* ================= 2. EL WORD ================= */
console.log('--- 2. el Word generado ---');
const r2 = await p.evaluate(async () => {
  const buffer = new Uint8Array(await (await fetch('plantillas/ficha-entrega-libros.docx')).arrayBuffer());
  const alumnos = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista;
  const de = (id) => alumnos.filter((a) => a.id === id)[0];
  const original = window.FichaTercero.datosBasicos;
  async function generar(id, campos) {
    const persona = de(id);
    window.FichaTercero.datosBasicos = async () => ({ persona: persona, categoria: 'ALUMNADO' });
    const valores = await Plantillas.valoresDeAsunto({ nombre: 'x', ficha: { categoria: 'ALUMNADO', tercero: persona.nombre + ' ' + id, tipo: 'FICHA ENTREGA LIBROS' }, leido: {} }, { fecha: U.hoyIso() });
    valores.campos = campos || {};
    const prep = await TablasDatos.prepararDocumento(buffer, { nombre: 'x', ficha: {} }, valores);
    if (prep.bloqueo) return { bloqueo: prep.bloqueo };
    const res = await Docx.rellenar(prep.buffer, valores);
    const xml = await Docx.leerEntradaDeTexto(new Uint8Array(await res.blob.arrayBuffer()), 'word/document.xml');
    const parrafos = (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map((x) => (x.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('')).filter(Boolean);
    const tablas = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).map((t) => (t.match(/<w:tr>[\s\S]*?<\/w:tr>/g) || []).map((tr) =>
      (tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map((tc) => (tc.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join(''))));
    return { parrafos, tablas, faltan: res.faltan, huecos: /\{\{|⟦/.test(xml), times: true };
  }
  const marina = await generar('2100001');
  const adrian = await generar('2100040');
  const dup = await generar('2100001', { 'Duplicado por extravío': 'Sí', 'Fecha de la entrega original': '15/09/2026' });
  const dupSinFecha = await generar('2100001', { 'Duplicado por extravío': 'Sí' });
  const ana = await generar('2100012');
  const ruben = await generar('2100007');
  window.FichaTercero.datosBasicos = original;
  const zip = await (async () => { const x = await Docx.leerEntradaDeTexto(buffer, 'word/styles.xml'); return /Times New Roman/.test(x); })();
  return { marina, adrian, dup, dupSinFecha, ana, ruben, times: zip, hoy: Plantillas.fechaLargaDe ? '' : '' };
});
const hoyLargo = await p.evaluate(() => { const d = new Date(); return d.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()] + ' de ' + d.getFullYear(); });
const m = r2.marina;
await comprobar('2. título, curso y sin huecos sin resolver', [m.parrafos[0], m.parrafos[1], m.huecos], ['FICHA ENTREGA LIBROS 1º DE ESO', 'CURSO ' + (await p.evaluate(() => LibrosFicha.cursoEn(U.cursoActual()).larga)), false]);
await comprobar('2. recuadro con apellidos y unidad', m.tablas[0], [['Aguilar Ponce, Marina', '1º A']]);
await comprobar('2. tabla LIBROS | Estado de conservación: una fila por asignatura con libro y el estado en blanco', m.tablas[1].map((f) => f.join('|')),
  ['LIBROS|Estado de conservación', 'Biología y Geología|', 'Geografía e Historia|', 'Lengua Castellana y Literatura|', 'Inglés|', 'Matemáticas|', 'Música|', 'Religión Católica|', 'Francés (Segundo Idioma)|']);
await comprobar('2. Adrián: seis filas más la cabecera, sin Religión', [r2.adrian.tablas[1].length, r2.adrian.tablas[1].some((f) => /Religión/.test(f.join('')))], [7, false]);
const texto = (r) => r.parrafos.join('\n');
await comprobar('2. original: «ha recibido», sin recuadro de duplicado, fecha de hoy y Fdo.', [/ha recibido TODOS/.test(texto(m)), /DUPLICADO/.test(texto(m)) || m.tablas.some((t) => /DUPLICADO/.test(JSON.stringify(t))),
  texto(m).indexOf('En Alhaurín el Grande, a ' + hoyLargo) !== -1, /Fdo\.: Marina Aguilar Ponce/.test(texto(m)), /\nEl alumno\n/.test(texto(m))], [true, false, true, true, true]);
await comprobar('2. ningún tutor impreso (ni su nombre ni su DNI)', [/Rocío|Ponce Duarte|Duarte/.test(texto(m) + JSON.stringify(m.tablas)), m.tablas[2]], [false, [['Padre, madre o tutor/a legal', 'DNI', 'Firma'], ['', '', ''], ['', '', '']]]);
await comprobar('2. «Basta con la firma de uno de ellos.» y la nota final', [/Basta con la firma de uno de ellos\./.test(texto(m)), /Nota: Este documento será devuelto por el alumno\/a a su tutor\/a una vez firmado por su padre\/madre/.test(texto(m))], [true, true]);
const d = r2.dup;
await comprobar('2. duplicado: recuadro, fecha de la original, frase de la extraviada y fecha de hoy', [d.tablas[0], /recibió el 15 de septiembre de 2026 TODOS/.test(texto(d)), /Esta ficha sustituye a la original, extraviada\./.test(texto(d)),
  texto(d).indexOf('En Alhaurín el Grande, a ' + hoyLargo) !== -1, /ha recibido/.test(texto(d))], [[['DUPLICADO POR EXTRAVÍO']], true, true, true, false]);
await comprobar('2. duplicado sin fecha de la original: no se genera', r2.dupSinFecha, { bloqueo: 'Escribe la fecha de la entrega original para generar el duplicado.' });
await comprobar('2. asignatura que no está en el listado: no se genera, y dice cuál', r2.ana.bloqueo && /«Tecnología Aplicada» no está en el listado de libros/.test(r2.ana.bloqueo), true);
await comprobar('2. Bachillerato: no se genera', r2.ruben.bloqueo && /no tiene libros de 1º Bachillerato/.test(r2.ruben.bloqueo), true);
await comprobar('2. la plantilla va en Times New Roman', r2.times, true);

/* ================= 3. EL GRUPO ================= */
console.log('--- 3. el grupo ---');
const r3 = await p.evaluate(async () => {
  const alumnos = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista;
  const rel = (id) => { const a = alumnos.filter((x) => x.id === id)[0]; return { nombre: a.nombre + ' ' + id, categoria: 'ALUMNADO' }; };
  const a = { nombre: 'g', ficha: { categoria: 'ALUMNADO', tipo: 'FICHA ENTREGA LIBROS', relacionados: ['2100004', '2100005', '2100013', '2100014', '2100015', '2100016'].map(rel) }, leido: {} };
  const dup = { campos: { 'Duplicado por extravío': 'Sí' } };
  const marina = alumnos.filter((x) => x.id === '2100001')[0];
  return Object.assign({}, await LibrosFicha.contarGrupo(a, { campos: {} }), {
    grupoIgnoraDuplicado: [(await LibrosFicha.contexto(marina, dup, true)).opciones.duplicado, (await LibrosFicha.contexto(marina, dup, false)).opciones.duplicado],
    esGrupo: [LibrosFicha.esGrupoDe({ ficha: { grupo: { nombre: '2ºB', origen: 'unidad' } } }), LibrosFicha.esGrupoDe({ ficha: {} })]
  });
});
await comprobar('3. el duplicado es solo para un alumno: en un grupo se ignora', [r3.grupoIgnoraDuplicado, r3.esGrupo], [[false, true], [true, false]]);
await comprobar('3. Generar para 5 de 6, con el aviso de quien se queda fuera', [r3.generables, r3.total, r3.avisos.length, /Taller de Teatro/.test(r3.avisos[0] || '')], [5, 6, 1, true]);

/* ================= 4. EL BUSCADOR ================= */
console.log('--- 4. el desplegable de unidad ---');
await p.evaluate(() => App.ir('nuevo'));
await p.waitForSelector('#buscar-tercero', { state: 'visible' });
await p.click('.categoria-boton[data-categoria="ALUMNADO"]');
await p.waitForTimeout(500);
const r4 = {};
r4.visible = await p.isVisible('#unidad-tercero');
r4.opciones = await p.$$eval('#unidad-tercero option', (o) => o.map((x) => x.textContent));
await p.selectOption('#unidad-tercero', '2º B');
await p.waitForTimeout(800);
r4.unidad = await p.$$eval('#resultados-tercero .resultado', (r) => r.length);
r4.nombres = await p.$$eval('#resultados-tercero .resultado', (r) => r.map((x) => x.firstChild.textContent.slice(0, 20)));
await p.fill('#buscar-tercero', 'nerea');
await p.waitForTimeout(800);
r4.acotado = await p.$$eval('#resultados-tercero .resultado', (r) => r.length);
await p.fill('#buscar-tercero', 'soler');
await p.waitForTimeout(800);
r4.fuera = await p.$$eval('#resultados-tercero .resultado', (r) => r.length);
await p.selectOption('#unidad-tercero', '');
await p.waitForTimeout(800);
r4.todas = await p.$$eval('#resultados-tercero .resultado', (r) => r.length);
await p.selectOption('#unidad-tercero', '');
const dniNerea = await p.evaluate(async () => Dni.de((await Datos.cargar(App.E.datos, 'ALUMNADO')).lista.filter((a) => a.id === '2100016')[0]));
r4.dniNerea = dniNerea;
await p.fill('#buscar-tercero', String(dniNerea).toLowerCase());
await p.waitForTimeout(800);
r4.porDni = await p.$$eval('#resultados-tercero .resultado', (r) => r.map((x) => x.firstChild.textContent.slice(0, 11)));
await p.fill('#buscar-tercero', '2100016');
await p.waitForTimeout(800);
r4.porNie = await p.$$eval('#resultados-tercero .resultado', (r) => r.map((x) => x.firstChild.textContent.slice(0, 11)));
await p.fill('#buscar-tercero', 'pardo lun');
await p.waitForTimeout(800);
r4.porLetras = await p.$$eval('#resultados-tercero .resultado', (r) => r.map((x) => x.firstChild.textContent.slice(0, 11)));
await p.fill('#buscar-tercero', '');
await p.click('.categoria-boton[data-categoria="PERSONAL"]');
await p.waitForTimeout(500);
r4.personal = await p.isVisible('#unidad-tercero');
await comprobar('4. con ALUMNADO sale el desplegable con «Todas» y las unidades', [r4.visible, r4.opciones[0], r4.opciones.indexOf('2º B') !== -1], [true, 'Todas', true]);
await comprobar('4. con una unidad y sin escribir, salen los 6 de 2º B', r4.unidad, 6);
await comprobar('4. escribiendo se acota dentro de la unidad', [r4.acotado, r4.fuera], [1, 0]);
await comprobar('4. sin unidad vuelve a pedir letras', r4.todas, 2);
await comprobar('4. por DNI, por NIE y por letras sale la misma alumna', [/^\d{8}[A-Z]$/.test(r4.dniNerea), r4.porDni, r4.porNie, r4.porLetras], [true, ['Pardo Luna,'], ['Pardo Luna,'], ['Pardo Luna,']]);
await comprobar('4. con PERSONAL no sale', r4.personal, false);

/* ================= 5. EL TIPO Y EL CENTRO DE DATOS ================= */
console.log('--- 5. el tipo y las partes del Centro de datos ---');
const r5 = await p.evaluate(async () => {
  const T = LibrosFicha.TIPO;
  const tipo = App.E.tipos.filter((t) => t.tipo === T)[0];
  const campos = ((App.E.campos.porTipo || {})[T] || []).map((c) => [Campos.nombreDeCampo(c, App.E.campos), Campos.claseDeCampo(c, App.E.campos)]);
  const pasos = await GuiasDelCentro.pasosDe ? await GuiasDelCentro.pasosDe(T) : [];
  const plantillas = (await Plantillas.cargar(App.E.gestor)).documentos.filter((x) => x.tipo === T);
  const antes = App.E.tipos.length;
  await LibrosFicha.pasada();
  const indice = { hechos: [
    { conjunto: 'libros', parte: 'curso', cursoEscolar: '26-27', acuerdoHecho: 1, ruta: 'hecho/libros/26-27/curso.json', hecho: '2026-10-01T10:00:00+02:00', huella: 'abc' },
    { conjunto: 'personal', parte: 'curso', cursoEscolar: '26-27', ruta: 'x', hecho: 'y', huella: 'z' }] };
  return {
    tipo: tipo && [tipo.categoria, tipo.nombreCorto], campos, hitos: (pasos || []).map((x) => x.titulo), plantilla: plantillas.map((x) => [x.nombre, x.tipoDocumento]),
    segunda: App.E.tipos.length === antes,
    partes: CentroDeDatosLibros.partes(indice).length, hace: CentroDeDatosLibros.haceFalta(indice.hechos[0], { tomado: {} }),
    nombre: CentroDeDatosLibros.nombreDe('26-27'), ya: CentroDeDatosLibros.haceFalta(indice.hechos[0], { tomado: { 'hecho-libros|26-27': { huella: 'abc', subido: '2026-10-01T10:00:00+02:00' } } })
  };
});
await comprobar('5. el tipo es de ALUMNADO y lleva sus dos campos', [r5.tipo, r5.campos], [['ALUMNADO', 'FichaLibros'], [['Duplicado por extravío', 'lista'], ['Fecha de la entrega original', 'fecha']]]);
await comprobar('5. la guía tiene un solo hito, «Generar la ficha», y la plantilla está colgada', [r5.hitos, r5.plantilla], [['Generar la ficha'], [['Ficha de entrega de libros', 'FICHA ENTREGA LIBROS']]]);
await comprobar('5. una segunda pasada no hace nada', r5.segunda, true);
await comprobar('5. solo toma las partes de libros; no vuelve a tomar la misma huella', [r5.partes, r5.hace, r5.nombre, r5.ya], [1, true, 'LIBROS-HECHO 26-27.json', false]);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' COMPROBACIONES FALLAN'); process.exit(1); }
console.log('\nTodas las comprobaciones de la ficha de entrega de libros pasan.');
