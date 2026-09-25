/* Prueba de las filas 142 y 144 (docs/ALUMNADO-BD-DESDE-DRIVE.md): el
   alumnado de la base de datos, desde la carpeta de Drive
   (js/alumnado-bd.js, js/alumnado-bd-ver.js).

   Todos los alumnos son INVENTADOS (docs/ACUERDO-ALUMNADO.md: nunca
   datos de verdad, ni en pruebas):
     - «Primera, Lucía» (9990001), matriculada en 1º ESO, con materias
       (tabla), centro de procedencia «CEIP Inventado Uno» y un dato de
       un tipo que el gestor no conoce (sale como texto).
     - «Otra, Marta» (9990009), 1º ESO, de otro centro: no entra en el grupo.
     - «Antiguo, Pablo» (9990002), ya no matriculado, con su historia.
     - Y un archivo con `acuerdo: 99`, que se rechaza entero.

   Se comprueba: validar; sin copia, todo como antes; con la carpeta
   señalada, un archivo que no vale no se copia; el bueno se copia a
   _GESTOR/datos por la cola; repetirlo con el mismo `generado` no copia;
   el RegAlum sigue siendo la base y el archivo suma y manda; una tarjeta
   por apartado; los huecos (DATO y TABLA) y su lista agrupada; el grupo
   «Curso = 1º ESO y Centro de procedencia = …»; los bloques de Ajustes,
   sin caja de dirección; y que no se llama a ninguna dirección web. */
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
await pagina.addInitScript(() => {
  window.__llamadasWeb = 0;
  const original = window.fetch;
  window.fetch = function (url) {
    if (/script\.google/.test(String(url))) window.__llamadasWeb++;
    return original.apply(this, arguments);
  };
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const CAMPOS = [
  { clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' },
  { clave: 'unidad', etiqueta: 'Unidad', apartado: 'Matrícula', tipo: 'texto' },
  { clave: 'materias', etiqueta: 'Materias matriculadas', apartado: 'Matrícula', tipo: 'tabla',
    columnas: [{ clave: 'materia', etiqueta: 'Materia' }, { clave: 'situacion', etiqueta: 'Situación' }] },
  { clave: 'centroProcedencia', etiqueta: 'Centro de procedencia', apartado: 'Procedencia', tipo: 'texto' },
  { clave: 'fechaAlta', etiqueta: 'Fecha de alta', apartado: 'Procedencia', tipo: 'fecha' },
  { clave: 'pil', etiqueta: 'PIL', apartado: 'Historia', tipo: 'si-no' },
  { clave: 'pendientes', etiqueta: 'Pendientes', apartado: 'Historia', tipo: 'lista' },
  { clave: 'rareza', etiqueta: 'Marca rara', apartado: 'Jefatura', tipo: 'color-inventado' }
];
const BUENO = {
  acuerdo: 2, generado: '2099-09-20T08:00:00+02:00', origen: 'bd-alumnado-ies', cursoAcademico: '2026-2027',
  campos: CAMPOS,
  alumnos: [
    { idEscolar: '9990001', matriculado: true, datos: {
      curso: '1º ESO', unidad: '1º ESO B', centroProcedencia: 'CEIP Inventado Uno', fechaAlta: '2026-09-01', pil: false,
      pendientes: [], rareza: 'violeta',
      materias: [{ materia: 'Lengua inventada', situacion: 'Matriculada' }, { materia: 'Matemáticas inventadas', situacion: 'Matriculada' }] } },
    { idEscolar: '9990009', matriculado: true, datos: { curso: '1º ESO', unidad: '1º ESO A', centroProcedencia: 'CEIP Inventado Dos' } },
    { idEscolar: '9990002', matriculado: false, datos: { curso: '4º ESO', centroProcedencia: 'CEIP Inventado Uno', pil: true, pendientes: ['Física 3º', 'Francés 3º'] } }
  ]
};
const RECHAZADO = { acuerdo: 99, generado: '2099-09-21T08:00:00Z', campos: [], alumnos: [{ idEscolar: '9990003', datos: {} }] };

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento',
    'Primera, Lucía;9990001;1º de E.S.O.;1º ESO C;2026;Matriculada;04/03/2014',
    'Otra, Marta;9990009;1º de E.S.O.;1º ESO A;2026;Matriculada;01/01/2014',
    'Antiguo, Pablo;9990002;4º de E.S.O.;4º ESO A;2026;Matriculado;05/06/2010'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2200);

console.log('--- validar ---');
await comprobar('validar: el archivo bueno vale; acuerdo 99 y el viejo acuerdo 1 no',
  pagina.evaluate(([b, r]) => [AlumnadoBD.validar(b).ok, AlumnadoBD.validar(r).motivo, AlumnadoBD.validar({ acuerdo: 1, alumnos: [] }).ok], [BUENO, RECHAZADO]),
  [true, 'viene con el acuerdo 99, y este gestor conoce el 2', false]);

console.log('--- sin copia, todo como antes ---');
await comprobar('sin copia: el alumnado sale del RegAlum, sin tarjetas nuevas',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const p = f.lista.find((x) => x.id === '9990001');
    return { n: f.lista.length, unidad: p.unidad, bd: f.bd, tarjetas: AlumnadoBDVer.tarjetas(p).length };
  }), { n: 3, unidad: '1º ESO C', bd: null, tarjetas: 0 });

async function ponerEnDrive(datos) {
  await pagina.evaluate(async (datos) => {
    const drive = await window.__disco.archivo.getDirectoryHandle('Datos de matrícula', { create: true });
    drive._hijos.set('ALUMNADO-BD.json', window.__disco.fich('ALUMNADO-BD.json', JSON.stringify(datos)));
    await Almacen.guardar(AlumnadoBD.CLAVE_CARPETA, drive);
  }, datos);
}

console.log('--- la carpeta de Drive ---');
await ponerEnDrive(RECHAZADO);
await comprobar('acuerdo 99 en Drive: no se copia y se sigue sin copia',
  pagina.evaluate(async () => {
    const r = await AlumnadoBD.traer(false, true);
    let copia = true;
    try { await App.E.datos.getFileHandle('ALUMNADO-BD.json'); } catch (e) { copia = false; }
    return [r.ok, copia, !!(await AlumnadoBD.leer())];
  }), [false, false, false]);

await ponerEnDrive(BUENO);
await comprobar('el archivo bueno se copia a _GESTOR/datos; otra vez con la misma fecha, ya no',
  pagina.evaluate(async () => {
    const r1 = await AlumnadoBD.traer(false, true);
    const copia = JSON.parse(await Carpetas.leerTexto(App.E.datos, 'ALUMNADO-BD.json'));
    const r2 = await AlumnadoBD.traer(false, true);
    return [r1.copiado, r1.cuantos, copia.acuerdo, r2.ok, r2.copiado];
  }), [true, 3, 2, true, false]);

console.log('--- unir con el RegAlum ---');
await comprobar('el RegAlum sigue siendo la base; el archivo suma y manda (matriculado y la columna «Unidad»)',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const p = f.lista.find((x) => x.id === '9990002');
    return { n: f.lista.length, lucia: [l.nombre, l.campos['Unidad'], l.bd.centroProcedencia],
             pablo: [p.matriculado, p.unidad], bd: [f.bd.unidos, f.bd.manda], matriculados: f.matriculados };
  }), { n: 3, lucia: ['Primera, Lucía', '1º ESO B', 'CEIP Inventado Uno'], pablo: [false, ''], bd: [3, true], matriculados: 2 });

await comprobar('si el archivo es más viejo que el RegAlum, no manda (solo rellena lo que falta)',
  pagina.evaluate(async () => {
    const p = { id: '9990002', matriculado: true, unidad: '4º ESO A', campos: { 'Unidad': '4º ESO A', 'Centro de procedencia': '' } };
    const r = await AlumnadoBD.unir([p], { '9990002': p }, new Date('2100-01-01'));
    return [r.manda, p.matriculado, p.unidad, p.campos['Centro de procedencia']];
  }), [false, true, '4º ESO A', 'CEIP Inventado Uno']);

console.log('--- la ficha ---');
await comprobar('una tarjeta plegada por apartado, cada tipo a su manera y la fecha al pie',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const caja = document.createElement('div');
    const v = FichaTerceroAlumno.ventana(l, Datos.resumenDeTercero(l, 'ALUMNADO'), null);
    caja.innerHTML = v.html;
    document.body.appendChild(caja);
    v.montar(caja);
    const ts = Array.from(caja.querySelectorAll('.vt-tarjeta-bd'));
    const salida = {
      apartados: ts.map((t) => t.querySelector('summary span').textContent),
      plegadas: ts.every((t) => !t.open),
      datos: Array.from(caja.querySelectorAll('.vt-tarjeta-bd .ficha-dato')).map((d) => d.children[0].textContent + '=' + d.children[1].textContent),
      materias: Array.from(caja.querySelectorAll('.vt-tarjeta-bd .bd-tabla tbody tr')).map((tr) => tr.textContent),
      pie: ts[0] && ts[0].querySelector('.nota').textContent,
      viejaSinSalir: !caja.querySelector('.vt-tarjeta-academica')
    };
    caja.remove();
    return salida;
  }), {
    apartados: ['Matrícula', 'Procedencia', 'Historia', 'Jefatura'],
    plegadas: true,
    datos: ['Curso=1º ESO', 'Unidad=1º ESO B', 'Centro de procedencia=CEIP Inventado Uno', 'Fecha de alta=01-09-2026', 'PIL=No', 'Marca rara=violeta'],
    materias: ['Lengua inventadaMatriculada', 'Matemáticas inventadasMatriculada'],
    pie: 'Datos de la base de datos de alumnado del 20-09-2099',
    viejaSinSalir: true
  });

console.log('--- las plantillas ---');
await comprobar('DATO y TABLA, unidos por Nº escolar',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === '9990001');
    const p = f.lista.find((x) => x.id === '9990002');
    const fila = (await TablasDatos.filasDe('ALUMNADO BD', l))[0];
    const materias = await TablasDatos.filasDe('ALUMNADO BD Materias matriculadas', l);
    const pab = (await TablasDatos.filasDe('ALUMNADO BD', p))[0];
    return [fila.celdas['Centro de procedencia'], materias.map((m) => m.celdas['Materia']), pab.celdas['Pendientes'], pab.celdas['PIL']];
  }), ['CEIP Inventado Uno', ['Lengua inventada', 'Matemáticas inventadas'], 'Física 3º, Francés 3º', 'Sí']);

await comprobar('los huecos, agrupados por apartado',
  pagina.evaluate(() => AlumnadoBDVer.huecos().slice(0, 4).map((h) => h.grupo + ' | {' + h.clave + '}')), [
    'Alumnado · Matrícula | {{DATO ALUMNADO BD: Curso}}',
    'Alumnado · Matrícula | {{DATO ALUMNADO BD: Unidad}}',
    'Alumnado · Matrícula | {{TABLA ALUMNADO BD Materias matriculadas}}',
    'Alumnado · Procedencia | {{DATO ALUMNADO BD: Centro de procedencia}}'
  ]);

console.log('--- los grupos ---');
await comprobar('Curso = 1º ESO y Centro de procedencia = CEIP Inventado Uno: solo Lucía; con antiguos por centro, también Pablo',
  pagina.evaluate(async () => {
    const d = await AlumnadoBD.leer();
    const uno = AlumnadoBDVer.filtrar(d, [{ clave: 'curso', valor: '1º ESO' }, { clave: 'centroProcedencia', valor: 'CEIP Inventado Uno' }], false);
    const conAntiguos = AlumnadoBDVer.filtrar(d, [{ clave: 'centroProcedencia', valor: 'CEIP Inventado Uno' }], true);
    const lista = AlumnadoBDVer.filtrar(d, [{ clave: 'pendientes', valor: 'Francés 3º' }], true);
    return [uno.map((a) => a.idEscolar), conAntiguos.map((a) => a.idEscolar), lista.map((a) => a.idEscolar),
            AlumnadoBDVer.valoresDe(d, 'centroProcedencia', false)];
  }), [['9990001'], ['9990001', '9990002'], ['9990002'], ['CEIP Inventado Dos', 'CEIP Inventado Uno']]);

await comprobar('«Por datos del alumnado» en pantalla: elegir los dos datos y añadir',
  pagina.evaluate(async () => {
    const fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const caja = document.createElement('div');
    document.body.appendChild(caja);
    let marcados = [];
    await AlumnadoBDVer.pintarGrupo(caja, fuente, (l) => { marcados = l; });
    const poner = (id, v) => { const s = caja.querySelector('#' + id); s.value = v; s.onchange(); };
    poner('bd-grupo-dato', 'curso'); poner('bd-grupo-valor', '1º ESO');
    poner('bd-grupo-dato', 'centroProcedencia'); poner('bd-grupo-valor', 'CEIP Inventado Uno');
    const cuantos = caja.querySelector('#bd-grupo-cuantos').textContent;
    caja.querySelector('#bd-grupo-anadir').click();
    caja.remove();
    return [cuantos, marcados.map((p) => p.nombre)];
  }), ['Salen 1', ['Primera, Lucía']]);

console.log('--- Ajustes ---');
await comprobar('Ajustes: la carpeta en El centro (sin caja de dirección) y «Traer» en Mantenimiento',
  pagina.evaluate(async () => {
    await App.pintarAjustes();
    await new Promise((r) => setTimeout(r, 300));
    return {
      centro: !!document.querySelector('#ajustes-tab-centro #bloque-alumnado-bd'),
      carpeta: document.getElementById('alumnado-bd-carpeta').textContent,
      sinDireccion: !document.getElementById('alumnado-bd-url'),
      traer: !!document.querySelector('#ajustes-tab-mantenimiento #alumnado-bd-traer'),
      copia: document.getElementById('alumnado-bd-copia').textContent,
      web: window.__llamadasWeb
    };
  }), { centro: true, carpeta: 'Carpeta señalada: Datos de matrícula.', sinDireccion: true, traer: true,
        copia: 'Última copia: 3 alumnos y 8 datos, del 20-09-2099.', web: 0 });

/* Los avisos ámbar del archivo que se rechaza a propósito no son errores. */
const deVerdad = errores.filter((e) => e.indexOf('alumnado') === -1);
if (deVerdad.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + deVerdad.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
