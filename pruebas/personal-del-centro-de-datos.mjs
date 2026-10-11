/* Prueba de la fila 327 (docs/PERSONAL-DEL-CENTRO-DE-DATOS.md): el personal ya preparado por el Centro de datos.
   Chromium real, con el disco de mentira de pruebas/navegador.mjs y datos inventados.

   1. Un índice sin `hechos`: `elegir` y lo que se toma son los de hoy; ningún PERSONAL-HECHO…json.
   2. Con parte del personal de este curso y listados de este curso y del anterior (este sin parte): se copia la parte,
      NO se copia el listado de este curso, SÍ el del anterior.
   3. La huella no coincide con los bytes: no se copia ni se apunta. Con la buena, sí.
   4. La misma huella dos veces: la segunda no copia nada ni saca aviso verde.
   5. `acuerdoHecho: 2`: no se toma y sale el aviso ámbar una sola vez.
   6. `cargarPersonal` con una parte y el RelPerCen del mismo curso (con una persona de más): la de más no sale y las
      demás salen igual que desde el CSV.
   7. Un RelPerCen apuntado a mano con fecha real posterior al `generado`: manda el CSV; con fecha anterior o sin apunte,
      manda la parte.
   8. Quien viene sin DNI sale en la lista, con su puesto, y se encuentra por su nombre.
   9. Dos cursos (CSV el anterior, parte este): una persona en los dos sale una vez, con los dos cursos y los datos de este.
   10. Problemas: tres tarjetas con sus líneas si los avisos son del curso más alto; ninguna si son de otro; se quitan.
   11. «Lo que tengo ahora»: una fila por parte leída, «Lo hace el propio Centro de datos.», ninguna del RelPerCen no leído.
   12. En solo consulta no se copia nada y el personal se lee de lo que haya. */
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

/* ---- el disco de mentira, con fechas estables en lo que se escribe ---- */
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
  /* Lo que se escribe lleva una fecha fija (como el disco de verdad), para que el apunte de «por dónde llegó» valga. */
  const fijar = (dir, nombre, tipo) => {
    const h = dir._hijos.get(nombre);
    if (h) { const t = Date.now(); h.getFile = async () => new File([h._texto], nombre, { type: tipo || 'text/plain', lastModified: t }); }
  };
  const t = Carpetas.escribirTexto, b = Carpetas.escribirBytes;
  Carpetas.escribirTexto = async function (dir, nombre) { const r = await t.apply(this, arguments); fijar(dir, nombre); return r; };
  Carpetas.escribirBytes = async function (dir, nombre, bytes, tipo) { const r = await b.apply(this, arguments); fijar(dir, nombre, tipo); return r; };
  const c = Carpetas.copiarFicheroEn;
  Carpetas.copiarFicheroEn = async function (dir, h, nombre) { const r = await c.apply(this, arguments); fijar(dir, nombre); return r; };
  window.__fijar = fijar;
});

const CURSO = await pagina.evaluate(() => U.cursoActual());
const [a1, a2] = CURSO.split('-').map(Number);
const PREVIO = String(a1 - 1).padStart(2, '0') + '-' + String(a2 - 1).padStart(2, '0');
const AHORA = Date.now();
const MIN = 60000;

/* ---- los ficheros inventados ---- */
const CAB = ['Empleado/a', 'DNI/Pasaporte', 'Puesto', 'Fecha de toma de posesión', 'Fecha de cese'];
const PERSONAS = {
  A: ['Aguado Prieto, Sonia', '11111111A', 'Matemáticas P.E.S.', '01/09/2015', ''],
  B: ['Bermejo Lara, Iván', '22222222B', 'Lengua P.E.S.', '01/09/2010', ''],
  C: ['Cañas Roldán, Eva', '33333333C', 'Orientación', '01/09/2020', ''],
  D: ['Delgado Pinto, Hugo', '44444444D', 'Ordenanza', '01/09/2012', ''],
  X: ['Ximénez Ortega, Lía', '55555555E', 'Música P.E.S.', '01/09/2018', ''],
  X2: ['Ximénez Ortega, Lía', '55555555E', 'Música y Coro P.E.S.', '01/09/2018', '']
};
const csv = (filas) => [CAB].concat(filas.map(k => PERSONAS[k])).map(f => f.join(';')).join('\r\n') + '\r\n';
const registro = (k, tipo = 'docente') => {
  const f = PERSONAS[k];
  return { id: f[1].toUpperCase(), datos: { empleado: f[0], documento: f[1], tipoPersonal: tipo, puesto: f[2], fechaTomaPosesion: '', fechaCese: '',
    celdas: CAB.map((c, i) => ({ columna: c, valor: f[i] })).filter(c => c.valor) } };
};
const parte = (curso, claves, generadoMin, avisos = [], extra = {}) => Object.assign({ acuerdoHecho: 1, conjunto: 'personal', parte: 'curso', cursoEscolar: curso,
  generado: new Date(AHORA + generadoMin * MIN).toISOString(), origen: 'centro-de-datos-ies', campos: [], registros: claves.map(k => registro(k)), avisos }, extra);

/* Monta la carpeta «CENTRO DE DATOS» y la señala. `spec`: { listados: [{ clave, variante, fichero, ruta, texto, cursoEscolar, ambito, subido, huella }],
   partes: [{ obj, huella?: 'mala' | cadena, hecho, acuerdoHecho? }], sinHechos } */
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
    for (const l of spec.listados) {
      await poner(l.ruta, l.texto);
      lista.push({ clave: l.clave, variante: l.variante || '', titulo: l.clave, fichero: l.fichero, ruta: l.ruta, tipo: 'csv', cursoEscolar: l.cursoEscolar || '',
        ambito: l.ambito || '', subido: l.subido, subidoPor: 'direccion@centro-inventado.es', resumen: '', huella: l.huella });
    }
    const hechos = [];
    for (const p of spec.partes || []) {
      const texto = JSON.stringify(p.obj);
      const ruta = 'hecho/personal/' + p.obj.cursoEscolar + '/curso.json';
      await poner(ruta, texto);
      hechos.push({ conjunto: 'personal', parte: 'curso', cursoEscolar: p.obj.cursoEscolar, acuerdoHecho: p.acuerdoHecho || 1, ruta, idDrive: '', hecho: p.hecho,
        huella: p.huella === 'mala' ? 'f'.repeat(64) : (p.huella || await sha(texto)), registros: p.obj.registros.length, bytes: texto.length, alDia: true, fuentes: [] });
    }
    const indice = { contrato: 2, ocupado: false, actualizado: new Date().toISOString(), cursoActual: U.cursoActual(), web: '', listados: lista };
    if (!spec.sinHechos) { indice.capacidades = ['hechos']; indice.hechos = hechos; }
    centro._hijos.set('indice.json', window.__disco.fich('indice.json', JSON.stringify(indice)));
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, centro);
  }, spec);
}

/* Lo de siempre entre pruebas: sin personal en `_GESTOR/datos`, sin apuntes y la memoria al día. */
async function limpiar() {
  await pagina.evaluate(async () => {
    const datos = App.E.datos;
    for (const k of [...datos._hijos.keys()]) if (/^(PERSONAL-HECHO|RelPerCen)/.test(k)) datos._hijos.delete(k);
    App.E.gestor._hijos.delete('centro-de-datos.json');
    App.E.gestor._hijos.delete('datos-origen.json');
    await CentroDeDatos.leerApuntes(true);
    await DatosQueTengo.leerApuntes(true);
    DatosQueTengo.olvidarMirada();
    Datos.olvidar();
    window.__avisos.length = 0;
  });
}
const escribir = (nombre, texto) => pagina.evaluate(async ([n, t]) => { await Carpetas.escribirTexto(App.E.datos, n, t); }, [nombre, texto]);
const ficheros = () => pagina.evaluate(() => [...App.E.datos._hijos.keys()].filter(k => /^(PERSONAL-HECHO|RelPerCen)/.test(k)).sort());
const apuntesCD = () => pagina.evaluate(async () => Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).filter(k => /^hecho-personal/.test(k)).sort());
const traer = (op = {}) => pagina.evaluate(async (op) => { const r = await CentroDeDatos.traer(Object.assign({ avisar: false, pedir: true }, op)); return [r.ok, r.tomados, r.fallos]; }, op);
const traidos = () => pagina.evaluate(() => window.__avisos.filter(a => /^Traído/.test(a[0])).map(a => a[0]));
const personal = () => pagina.evaluate(async () => { Datos.olvidar(); const p = await Datos.cargar(App.E.datos, 'PERSONAL'); return p; });
const DE = (r) => r.lista.map(p => ({ nombre: p.nombre, documento: p.documento, puesto: p.puesto, fechaCese: p.fechaCese, campos: p.campos, cursos: p.cursos, enElCentro: p.enElCentro, busca: p.busca }));
const nombres = (lista) => lista.map(p => p.nombre).sort();
const huellaDe = (texto) => pagina.evaluate(async (t) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))).map(b => b.toString(16).padStart(2, '0')).join(''), texto);
const listadoCsv = (curso, claves, ambito = 'docentes') => ({ clave: 'personal', variante: curso + '/' + ambito, fichero: 'RelPerCen ' + curso + '.csv', ruta: 'listados/personal/' + curso + '/' + ambito + '/RelPerCen ' + curso + '.csv',
  texto: csv(claves), cursoEscolar: curso, ambito, subido: new Date(AHORA + 5 * MIN).toISOString(), huella: 'inv-' + curso + '-' + ambito });

/* ================= 1. SIN `hechos` ================= */
console.log('--- 1. un índice sin hechos ---');
await limpiar();
await montar({ sinHechos: true, listados: [listadoCsv(CURSO, ['A', 'B'])] });
await comprobar('1. elegir trae el listado de siempre, y se copia con su nombre de siempre; no hay ningún PERSONAL-HECHO',
  pagina.evaluate(async () => { const dir = await CentroDeDatos.carpeta(); const r = await CentroDeDatos.leerIndice(dir); return CentroDeDatos.elegir(r.indice).lista.map(e => e.fichero); }), ['RelPerCen ' + CURSO + '.csv']);
await traer();
await comprobar('1. tras traer: el RelPerCen está, y ningún PERSONAL-HECHO', await ficheros(), ['RelPerCen ' + CURSO + '.csv']);

/* ================= 2. CON PARTE ================= */
console.log('--- 2. con parte de este curso ---');
await limpiar();
const P2 = parte(CURSO, ['A', 'B', 'C'], 10);
await montar({ listados: [listadoCsv(CURSO, ['A', 'B']), listadoCsv(PREVIO, ['D'])], partes: [{ obj: P2, hecho: P2.generado }] });
await comprobar('2. elegir deja solo el listado del curso que no tiene parte',
  pagina.evaluate(async () => { const dir = await CentroDeDatos.carpeta(); const r = await CentroDeDatos.leerIndice(dir); return CentroDeDatos.elegir(r.indice).lista.map(e => e.cursoEscolar); }), [PREVIO]);
const r2 = await traer();
await comprobar('2. se toma el personal', [r2[0], r2[1].includes('personal'), r2[2]], [true, true, []]);
await comprobar('2. se copia la parte y el listado del curso anterior; el de este curso no',
  await ficheros(), ['PERSONAL-HECHO ' + CURSO + '.json', 'RelPerCen ' + PREVIO + '.csv']);
await comprobar('2. la parte se copia byte a byte', pagina.evaluate(async (n) => (await Carpetas.leerTexto(App.E.datos, n)), 'PERSONAL-HECHO ' + CURSO + '.json').then(t => JSON.parse(t).registros.length), 3);
await comprobar('2. se apunta con la llave hecho-personal|curso', await apuntesCD(), ['hecho-personal|' + CURSO]);
await comprobar('2. un solo aviso verde, que nombra el personal', (await traidos()).map(t => /Personal \(/.test(t) && /^Traído del Centro de datos: /.test(t)), [true]);

/* ================= 11 (aquí, con lo recién traído). LO QUE TENGO AHORA ================= */
console.log('--- 11. lo que tengo ahora ---');
await escribir('RelPerCen ' + CURSO + '.csv', csv(['A', 'B', 'C', 'D']));   /* un listado de este curso que no se lee: la parte manda */
await pagina.evaluate(() => { Datos.olvidar(); DatosQueTengo.olvidarMirada(); });
await comprobar('11. una fila «Personal curso» por parte leída y ninguna del RelPerCen que no se lee',
  pagina.evaluate(async () => (await DatosQueTengo.estado()).filter(f => f.clave === 'personal').map(f => [f.titulo, f.nombre, DatosQueTengo.porDondeLlego(f)])),
  [['Personal ' + CURSO, 'PERSONAL-HECHO ' + CURSO + '.json', 'Del Centro de datos. Lo hace el propio Centro de datos.'], ['Personal ' + PREVIO, 'RelPerCen ' + PREVIO + '.csv', 'Del Centro de datos. Lo subió direccion.']]);

/* ================= 3. LA HUELLA ================= */
console.log('--- 3. la huella ---');
await limpiar();
const P3 = parte(CURSO, ['A', 'B'], 20);
await montar({ listados: [], partes: [{ obj: P3, hecho: P3.generado, huella: 'mala' }] });
await traer({ avisar: true });
await comprobar('3. con la huella mala no se copia ni se apunta', [await ficheros(), await apuntesCD()], [[], []]);
await montar({ listados: [], partes: [{ obj: P3, hecho: P3.generado }] });
await traer();
await comprobar('3. con la buena sí', [await ficheros(), await apuntesCD()], [['PERSONAL-HECHO ' + CURSO + '.json'], ['hecho-personal|' + CURSO]]);

/* ================= 4. LA MISMA HUELLA DOS VECES ================= */
console.log('--- 4. la misma huella ---');
await pagina.evaluate(() => { window.__avisos.length = 0; });
const r4 = await traer();
await comprobar('4. la segunda vez no toma nada ni saca aviso verde', [r4[1].includes('personal'), await traidos()], [false, []]);

/* ================= 5. ACUERDO MÁS NUEVO ================= */
console.log('--- 5. acuerdoHecho 2 ---');
await limpiar();
const P5 = parte(CURSO, ['A'], 30, [], { acuerdoHecho: 2 });
await montar({ listados: [], partes: [{ obj: P5, hecho: P5.generado, acuerdoHecho: 2 }] });
await traer(); await traer({ avisar: true });
await comprobar('5. no se toma ni se apunta, y el aviso ámbar sale una sola vez',
  [await ficheros(), await apuntesCD(), await pagina.evaluate(() => window.__avisos.filter(a => a[0] === 'El personal del Centro de datos es más nuevo que esta aplicación.').map(a => a[1]))], [[], [], ['ambar']]);

/* ================= 6. LEER DE LA PARTE ================= */
console.log('--- 6. cargarPersonal ---');
await limpiar();
await escribir('RelPerCen ' + CURSO + '.csv', csv(['A', 'B', 'C', 'D']));
const delCsv = DE(await personal());
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify(parte(CURSO, ['A', 'B', 'C'], -60)));
const conParte = await personal();
await comprobar('6. la persona de más del CSV no sale', nombres(conParte.lista).includes(PERSONAS.D[0]), false);
await comprobar('6. las de la parte salen igual que desde el CSV (nombre, documento, puesto, cese, campos, cursos, enElCentro y busca)',
  DE(conParte), delCsv.filter(p => p.nombre !== PERSONAS.D[0]));
await comprobar('6. el resumen dice de dónde sale', conParte.ficheros.map(f => [f.fichero, f.curso, f.filas, !!f.hecho]), [['PERSONAL-HECHO ' + CURSO + '.json', CURSO, 3, true]]);

/* ================= 7. LO SUBIDO A MANO ================= */
console.log('--- 7. lo subido a mano ---');
const apuntarMano = (dias) => pagina.evaluate(async ([curso, dias]) => {
  await DatosQueTengo.apuntar('RelPerCen ' + curso + '.csv', { via: 'a-mano', nombreOriginal: 'RelPerCen.csv', fechaOriginal: Date.now() + dias * 86400000 });
  Datos.olvidar();
}, [CURSO, dias]);
await escribir('RelPerCen ' + CURSO + '.csv', csv(['A', 'B', 'C', 'D']));   /* se escribe de nuevo: fecha estable */
await apuntarMano(1);   /* un día después de lo preparado (que es de hace una hora) */
await comprobar('7. con fecha real posterior al `generado`, manda el listado (sale la persona de más)', nombres((await personal()).lista).includes(PERSONAS.D[0]), true);
await apuntarMano(-3);
await comprobar('7. con fecha real anterior, manda la parte', nombres((await personal()).lista).includes(PERSONAS.D[0]), false);
await pagina.evaluate(() => { App.E.gestor._hijos.delete('datos-origen.json'); });
await pagina.evaluate(async () => { await DatosQueTengo.leerApuntes(true); Datos.olvidar(); });
await comprobar('7. sin apunte, manda la parte', nombres((await personal()).lista).includes(PERSONAS.D[0]), false);
await pagina.evaluate(async (curso) => { await DatosQueTengo.apuntar('RelPerCen ' + curso + '.csv', { via: 'centro-de-datos', nombreOriginal: 'x', fechaOriginal: Date.now() + 86400000 }); Datos.olvidar(); }, CURSO);
await comprobar('7. un listado que no es «a mano», aunque sea más nuevo, no gana', nombres((await personal()).lista).includes(PERSONAS.D[0]), false);

/* ================= 8. SIN DNI ================= */
console.log('--- 8. sin DNI ---');
await limpiar();
const P8 = parte(CURSO, ['A'], -60, [{ tipo: 'personal-sin-id', id: '', datos: { empleado: 'Sinpapeles Rey, Marcos', puesto: 'Ordenanza', listado: 'no-docentes' } }]);
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify(P8));
const p8 = await personal();
await comprobar('8. sale en la lista, sin documento, con su puesto, y se encuentra por su nombre',
  p8.lista.filter(p => /sinpapeles/.test(p.busca)).map(p => [p.nombre, p.documento, p.puesto, !!p.sinDocumento, p.enElCentro, p.campos]),
  [['Sinpapeles Rey, Marcos', '', 'Ordenanza', true, true, { 'Empleado/a': 'Sinpapeles Rey, Marcos', 'Puesto': 'Ordenanza' }]]);

/* ================= 9. DOS CURSOS ================= */
console.log('--- 9. dos cursos ---');
await limpiar();
await escribir('RelPerCen ' + PREVIO + '.csv', csv(['X', 'D']));
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify({ ...parte(CURSO, ['A'], -60), registros: [registro('X2'), registro('A')] }));
const p9 = await personal();
await comprobar('9. una persona en los dos cursos sale una vez, con los dos y los datos del más reciente',
  p9.lista.filter(p => p.documento === '55555555E').map(p => [p.nombre, p.puesto, p.cursos, p.enElCentro]), [[PERSONAS.X[0], PERSONAS.X2[2], [PREVIO, CURSO], true]]);
await comprobar('9. y quien solo sale en el curso anterior ya no está en el centro', p9.lista.filter(p => p.documento === '44444444D').map(p => [p.cursos, p.enElCentro]), [[[PREVIO], false]]);

/* ================= 10. PROBLEMAS ================= */
console.log('--- 10. problemas ---');
await limpiar();
const AVISOS = [
  { tipo: 'personal-sin-id', id: '', datos: { empleado: 'Sinpapeles Rey, Marcos', puesto: 'Ordenanza', listado: 'no-docentes' } },
  { tipo: 'personal-en-dos-listados', id: '11111111A', datos: { empleado: PERSONAS.A[0] } },
  { tipo: 'personal-fichero', id: '', datos: { listado: 'docentes', detalle: 'En el listado falta la columna Teléfono.' } }
];
const tarjetas = () => pagina.evaluate(async () => { Datos.olvidar(); await Problemas.recalcular('personal'); return Problemas.ids().filter(i => /^personal/.test(i)); });
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify(parte(CURSO, ['A', 'B'], -60, AVISOS)));
await comprobar('10. con los avisos en el curso más alto salen las tres tarjetas', await tarjetas(), ['personal-sin-dni', 'personal-dos-listados', 'personal-listado']);
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="problemas"]');
await pagina.waitForTimeout(600);
await comprobar('10. cada tarjeta lleva su título y su línea',
  pagina.evaluate(() => ['personal-sin-dni', 'personal-dos-listados', 'personal-listado'].map(id => { const t = document.querySelector('[data-problema="' + id + '"]'); return [t.querySelector('.problema-titulo').textContent, [...t.querySelectorAll('.problema-elemento')].map(e => e.innerText.replace(/\s+/g, ' ').trim())]; })),
  [['1 persona del personal viene sin DNI', ['Sinpapeles Rey, Marcos Ordenanza · no docentes']],
    ['1 persona sale como docente y como no docente', [PERSONAS.A[0]]],
    ['Un listado de personal trae algo que revisar', ['docentes En el listado falta la columna Teléfono.']]]);
await comprobar('10. las tres traen los tres pasos y «Vuelve a mirar», sin «Avisar por Soporte»',
  pagina.evaluate(() => ['personal-sin-dni', 'personal-dos-listados', 'personal-listado'].map(id => { const t = document.querySelector('[data-problema="' + id + '"]');
    return [t.querySelectorAll('ol.problema-pasos li').length, [...t.querySelectorAll('button')].map(b => b.textContent)]; })),
  [[3, ['Vuelve a mirar']], [3, ['Vuelve a mirar']], [3, ['Vuelve a mirar']]]);
await escribir('PERSONAL-HECHO ' + PREVIO + '.json', JSON.stringify(parte(PREVIO, ['D'], -90, AVISOS)));
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify(parte(CURSO, ['A', 'B'], -60, [])));
await comprobar('10. con los avisos en un curso que no es el más alto, ninguna (y las de antes se quitan)', await tarjetas(), []);

/* ================= 12. SOLO CONSULTA ================= */
console.log('--- 12. solo consulta ---');
await limpiar();
const P12 = parte(CURSO, ['A', 'B'], 40);
await montar({ listados: [], partes: [{ obj: P12, hecho: P12.generado }] });
const r12 = await pagina.evaluate(async () => { const o = SoloConsulta.activo; SoloConsulta.activo = () => true; try { const r = await CentroDeDatos.traer({ avisar: false, pedir: true }); return [r.ok, r.motivo]; } finally { SoloConsulta.activo = o; } });
await comprobar('12. en solo consulta no se copia nada', [r12, await ficheros(), await apuntesCD()], [[false, 'solo consulta'], [], []]);
await escribir('PERSONAL-HECHO ' + CURSO + '.json', JSON.stringify(parte(CURSO, ['A', 'B'], -60)));
await comprobar('12. y el personal se lee de lo que haya', nombres((await personal()).lista), [PERSONAS.A[0], PERSONAS.B[0]]);

const deVerdad = errores.filter(e => !/Failed to load resource/.test(e));
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
