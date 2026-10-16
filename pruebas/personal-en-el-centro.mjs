/* Prueba de la fila 340 (13-oct-2026, docs/PERSONAL-EN-EL-CENTRO.md): quién está «en el centro».

   Datos inventados, con el disco de mentira de pruebas/navegador.mjs. Se escriben listados en `_GESTOR/datos` y se
   lee con Datos.cargar(…, 'PERSONAL'):
   1. Docentes y no docentes de este curso, sin cese: en el centro.
   2. Cese ayer: fuera, con «cesó el …». Cese hoy y cese dentro de un mes: en el centro.
   3. Alguien que solo sale en un listado de otro curso, de su clase: «su último curso aquí: …».
   4. Los no docentes solo subidos hasta el curso pasado (hay docentes de este curso): siguen en el centro.
   5. Un listado sin año no sube el curso por encima del de hoy.
   6. Una parte del Centro de datos que solo trae docentes no hace desaparecer el listado de no docentes del mismo curso.
   7. Lo mismo en el buscador (piePersona) y en la ficha (motivoFuera) para quien ya se fue. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(2500);

const CURSO = await pagina.evaluate(() => U.cursoActual());
const [a1, a2] = CURSO.split('-').map(Number);
const PREVIO = String(a1 - 1).padStart(2, '0') + '-' + String(a2 - 1).padStart(2, '0');
const fechaEn = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); };
const CAB = 'Empleado/a;DNI/Pasaporte;Puesto;Fecha de cese';
const csv = (filas) => [CAB].concat(filas.map(f => f.join(';'))).join('\r\n') + '\r\n';
const fila = (nombre, dni, puesto, cese) => [nombre, dni, puesto, cese || ''];

async function escribir(ficheros, partes) {
  await pagina.evaluate(async ([ficheros, partes]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const d = await g.getDirectoryHandle('datos', { create: true });
    for (const k of Array.from(d._hijos.keys())) if (/^(RelPerCen|PERSONAL-HECHO)/.test(k)) d._hijos.delete(k);
    for (const [n, t] of Object.entries(ficheros)) d._hijos.set(n, window.__disco.fich(n, t));
    for (const [n, t] of Object.entries(partes || {})) d._hijos.set(n, window.__disco.fich(n, t));
    Datos.olvidar();
  }, [ficheros, partes]);
}
const quien = (nombres) => pagina.evaluate(async (nombres) => {
  Datos.olvidar();
  const p = await Datos.cargar(App.E.datos, 'PERSONAL');
  const r = {};
  nombres.forEach(n => { const x = p.lista.filter(y => y.nombre === n)[0]; r[n] = x ? [x.enElCentro, x.esteCurso, x.cursoUltimo] : null; });
  return { r, curso: p.curso };
}, nombres);

console.log('--- 1 a 5: listados ---');
await escribir({
  ['RelPerCen ' + CURSO + '.csv']: csv([
    fila('Docente Uno, Ana', '10000001A', 'Matemáticas'),
    fila('Docente Ayer, Berta', '10000002B', 'Lengua', fechaEn(-1)),
    fila('Docente Hoy, Carlos', '10000003C', 'Música', fechaEn(0)),
    fila('Docente Mes, Dani', '10000004D', 'Inglés', fechaEn(30))]),
  ['RelPerCen ' + PREVIO + '.csv']: csv([
    fila('Docente Viejo, Luis', '10000005E', 'Física'),
    fila('Docente Uno, Ana', '10000001A', 'Matemáticas')]),
  ['RelPerCenNodocente ' + PREVIO + '.csv']: csv([fila('Nodocente Nora, Nora', '20000001F', 'Ordenanza')]),
  'RelPerCen.csv': csv([fila('Docente Sinaño, Sara', '10000006G', 'Dibujo')])
});
let q = await quien(['Docente Uno, Ana', 'Docente Ayer, Berta', 'Docente Hoy, Carlos', 'Docente Mes, Dani', 'Docente Viejo, Luis', 'Nodocente Nora, Nora', 'Docente Sinaño, Sara']);
comprobar('1. sin cese: en el centro', q.r['Docente Uno, Ana'].slice(0, 2), [true, true]);
comprobar('2. cese ayer: fuera, y se sabe que sale este curso (cesó)', q.r['Docente Ayer, Berta'].slice(0, 2), [false, true]);
comprobar('2. cese hoy: en el centro', q.r['Docente Hoy, Carlos'][0], true);
comprobar('2. cese dentro de un mes: en el centro', q.r['Docente Mes, Dani'][0], true);
comprobar('3. solo de otro curso: fuera, con su último curso', q.r['Docente Viejo, Luis'], [false, false, PREVIO]);
comprobar('4. los no docentes solo subidos hasta el curso pasado siguen en el centro', q.r['Nodocente Nora, Nora'].slice(0, 2), [true, true]);
comprobar('5. un listado sin año no sube el curso por encima del de hoy', q.curso, CURSO);
comprobar('5. y su gente cuenta como de este curso', q.r['Docente Sinaño, Sara'].slice(0, 2), [true, true]);

console.log('--- 6: una parte del Centro de datos que solo trae docentes ---');
const celdas = (f) => CAB.split(';').map((c, i) => ({ columna: c, valor: f[i] })).filter(c => c.valor);
const reg = (f, tipo) => ({ id: f[1], datos: { empleado: f[0], documento: f[1], tipoPersonal: tipo, puesto: f[2], fechaCese: f[3], celdas: celdas(f) } });
const parte = { acuerdoHecho: 1, conjunto: 'personal', parte: 'curso', cursoEscolar: CURSO, generado: new Date(Date.now() - 86400000 * 400).toISOString(), origen: 'centro-de-datos-ies', campos: [], avisos: [],
  registros: [reg(fila('Docente Parte, Pía', '10000007H', 'Biología'), 'docente')] };
await escribir({
  ['RelPerCenNodocente ' + CURSO + '.csv']: csv([fila('Nodocente Pepe, Pepe', '20000002J', 'Conserje')])
}, { ['PERSONAL-HECHO ' + CURSO + '.json']: JSON.stringify(parte) });
q = await quien(['Docente Parte, Pía', 'Nodocente Pepe, Pepe']);
comprobar('6. la parte de docentes entra', q.r['Docente Parte, Pía'].slice(0, 2), [true, true]);
comprobar('6. el listado de no docentes del mismo curso no se descarta', q.r['Nodocente Pepe, Pepe'].slice(0, 2), [true, true]);

console.log('--- 7: el motivo, en el buscador y en la ficha ---');
const textos = await pagina.evaluate(() => ({
  cesó: App.piePersona({ nombre: 'x', enElCentro: false, esteCurso: true, fechaCese: '01/01/2020', puesto: 'Música', deSeneca: true }),
  viejo: App.piePersona({ nombre: 'x', enElCentro: false, esteCurso: false, cursoUltimo: '25-26', puesto: 'Física', deSeneca: true }),
  dentro: App.piePersona({ nombre: 'x', enElCentro: true, esteCurso: true, puesto: 'Física', deSeneca: true }),
  motivo: App.motivoFuera({ esteCurso: false, cursoUltimo: '25-26' })
}));
comprobar('7. buscador: cesó el …', textos.cesó, 'Música  ·  Ya no está en el centro (cesó el 01/01/2020)');
comprobar('7. buscador: su último curso aquí', textos.viejo, 'Física  ·  Ya no está en el centro (su último curso aquí: 25-26)');
comprobar('7. buscador: quien está, sin aviso', textos.dentro, 'Física');
comprobar('7. la ficha usa el mismo motivo', textos.motivo, ' (su último curso aquí: 25-26)');

console.log('--- 8: fila 354, datos de personal de cursos posteriores al de hoy ---');
const SIGUIENTE = String(a1 + 1).padStart(2, '0') + '-' + String(a2 + 1).padStart(2, '0');
const parteSig = { acuerdoHecho: 1, conjunto: 'personal', parte: 'curso', cursoEscolar: SIGUIENTE, generado: new Date().toISOString(), origen: 'centro-de-datos-ies', campos: [], avisos: [],
  registros: [reg(fila('Docente Otro, Otto', '10000009K', 'Latín'), 'no-docente')] };
const parteHoySinClase = { acuerdoHecho: 1, conjunto: 'personal', parte: 'curso', cursoEscolar: CURSO, generado: new Date().toISOString(), origen: 'centro-de-datos-ies', campos: [], avisos: [],
  registros: [reg(fila('Parte Pili, Pili', '10000010L', 'Física'), '')] };
await escribir({
  ['RelPerCenNodocente ' + CURSO + '.csv']: csv([
    fila('Marmolejo, Paco', '20000003G', 'Auxiliar administrativo/a'),
    fila('Nodocente Cesado, Cesar', '20000004H', 'Limpieza', fechaEn(-3))]),
  ['RelPerCen ' + CURSO + '.csv']: csv([
    fila('Docente Doble, Dora', '10000008J', 'Dibujo', fechaEn(-3)),
    fila('Docente Hoy, Hugo', '10000011M', 'Música')]),
  ['RelPerCenNodocente ' + SIGUIENTE + '.csv']: csv([fila('Nodocente Futura, Fina', '20000005J', 'Conserje')]),
  ['RelPerCenNodocente.csv']: csv([fila('Nodocente Sinaño, Nico', '20000006K', 'Conserje')])
}, { ['PERSONAL-HECHO ' + SIGUIENTE + '.json']: JSON.stringify(parteSig) });
q = await quien(['Marmolejo, Paco', 'Nodocente Cesado, Cesar', 'Docente Doble, Dora', 'Docente Hoy, Hugo']);
comprobar('8. no docente de hoy, sin cese, con datos de un curso posterior de su clase: en el centro', q.r['Marmolejo, Paco'].slice(0, 2), [true, true]);
comprobar('8. con cese pasado en el curso de hoy: fuera, y se sabe que sale este curso (cesó)', q.r['Nodocente Cesado, Cesar'].slice(0, 2), [false, true]);
comprobar('8. docente en el curso de hoy con cese pasado, en un solo listado: fuera (cesó)', q.r['Docente Doble, Dora'].slice(0, 2), [false, true]);
comprobar('8. docente de hoy sin cese con datos posteriores de otra clase: en el centro', q.r['Docente Hoy, Hugo'].slice(0, 2), [true, true]);
await escribir({}, { ['PERSONAL-HECHO ' + SIGUIENTE + '.json']: JSON.stringify(parteSig), ['PERSONAL-HECHO ' + CURSO + '.json']: JSON.stringify(parteHoySinClase) });
q = await quien(['Parte Pili, Pili']);
comprobar('8. fila de una parte de hoy sin clase, con otra parte de un curso posterior: en el centro', q.r['Parte Pili, Pili'].slice(0, 2), [true, true]);

console.log('--- 9: el mismo curso en dos listados con distinta fecha de cese ---');
await escribir({
  ['RelPerCen ' + CURSO + '.csv']: csv([fila('Doble Listado, Dora', '10000012N', 'Dibujo', fechaEn(-3)), fila('Doble Listado, Cese', '10000013P', 'Dibujo', fechaEn(-3))]),
  ['RelPerCenNodocente ' + CURSO + '.csv']: csv([fila('Doble Listado, Dora', '10000012N', 'Dibujo'), fila('Doble Listado, Cese', '10000013P', 'Dibujo', fechaEn(10))]),
  ['RelPerCen ' + SIGUIENTE + '.csv']: csv([fila('Otro, Alguien', '10000014Q', 'Dibujo')])
});
q = await quien(['Doble Listado, Dora', 'Doble Listado, Cese']);
comprobar('9. docente con cese y no docente sin cese: manda el que no tiene cese', q.r['Doble Listado, Dora'].slice(0, 2), [true, true]);
comprobar('9. dos ceses: manda el más tarde', q.r['Doble Listado, Cese'].slice(0, 2), [true, true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
