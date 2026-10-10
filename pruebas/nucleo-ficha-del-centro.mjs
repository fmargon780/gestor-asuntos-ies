/* Prueba de la fila 323 (docs/NUCLEO-GESTOR-FICHA-DEL-CENTRO-DE-DATOS.md, plan del núcleo): el Gestor acepta
   `ALUMNADO-BD.json` venga de quien venga (`bd-alumnado-ies` o `centro-de-datos-ies`) y un índice del contrato 2
   con lo que añade el plan (`capacidades`, `hechos`, `hecho/`, la clave `entrega`). Chromium real, la copia de
   pruebas (`?demo=1&auto=1`) y carpetas de mentira (`Demo.carpetaDeMentira`); todo inventado.

   1. Un fichero del Centro de datos (con `dueno` y campos que no conoce) vale y la copia lo conserva entero.
   2. Ese fichero y el de `bd-alumnado-ies` dan lo mismo en tarjetas, tabla y huecos; solo cambia el pie.
   3. Con otro `origen`, o sin él, los textos son los de hoy.
   4. Un índice con lo nuevo: se toman solo alumnado y ficha, sin ámbar ni errores.
   5. La entrada `alumnado-bd` dentro de `hecho/` se toma igual.
   6. El relevo: la copia del Centro de datos sustituye a la de ayer de la base de datos de alumnado.
   7. Una carpeta de la base de datos con un fichero más viejo no pisa la copia.
   8. Una parte de `hecho/` (sin `acuerdo`) con dos entradas `alumnado-bd`: no se toma nada y sale el ámbar de siempre.
   9. La copia de pruebas con `nucleo=1`. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(parametros) {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1 && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(BASE + '?demo=1&auto=1' + (parametros || ''));
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForTimeout(2500);
  await pagina.evaluate(() => {
    window.__avisos = [];
    const original = U.aviso;
    U.aviso = function (texto, clase) { window.__avisos.push([texto, clase || '']); return original.apply(this, arguments); };
  });
  return pagina;
}

const CURSO = '2026-2027';
let ID = '';   /* el primer alumno de la copia de pruebas */
const dia = (n) => new Date(Date.now() + n * 86400000).toISOString();

/* El fichero de la ficha. `cambios` se mezcla encima. */
function ficha(origen, generado, cambios) {
  const campos = [
    { clave: 'pil', etiqueta: 'PIL', apartado: 'Otros datos', tipo: 'si-no' },
    { clave: 'curso', etiqueta: 'Curso', apartado: 'Matrícula', tipo: 'texto' },
    { clave: 'materias', etiqueta: 'Materias matriculadas', apartado: 'Matrícula', tipo: 'tabla',
      columnas: [{ clave: 'materia', etiqueta: 'Materia' }] }
  ];
  if (origen === 'centro-de-datos-ies') {
    campos[0].dueno = 'bd-alumnado-ies'; campos[1].dueno = 'centro-de-datos-ies'; campos[2].dueno = 'centro-de-datos-ies';
    campos[1].campoNuevo = 'ignorar';
  }
  const f = { acuerdo: 2, generado, cursoAcademico: CURSO, campos,
    alumnos: [{ idEscolar: ID, matriculado: true, datos: { pil: true, curso: '1º ESO', materias: [{ materia: 'Lengua inventada' }] } }] };
  if (origen) f.origen = origen;
  if (origen === 'centro-de-datos-ies') { f.cosaNueva = { x: 1 }; f.alumnos[0].otraCosa = 'ignorar'; }
  return Object.assign(f, cambios || {});
}

/* Monta una carpeta «CENTRO DE DATOS» de mentira. `ficheros`: [{ ruta, texto }]; `listados`: entradas del índice (a pelo);
   `indice`: campos que se añaden al índice. */
async function montar(p, ficheros, listados, indice) {
  await p.evaluate(async ([ficheros, listados, indice, curso]) => {
    const dir = Demo.carpetaDeMentira('CD' + Math.random());
    for (const f of ficheros) {
      const partes = f.ruta.split('/');
      let d = dir;
      for (let i = 0; i < partes.length - 1; i++) d = await d.getDirectoryHandle(partes[i], { create: true });
      await Carpetas.escribirTexto(d, partes[partes.length - 1], f.texto);
    }
    await Carpetas.escribirTexto(dir, 'indice.json', JSON.stringify(Object.assign(
      { contrato: 2, actualizado: new Date().toISOString(), cursoActual: curso, ocupado: false, web: '', listados }, indice || {})));
    await Almacen.guardar(CentroDeDatos.CLAVE_CARPETA, dir);
  }, [ficheros, listados, indice || null, CURSO]);
}

function entrada(clave, ruta, extra) {
  return Object.assign({ clave, variante: '', titulo: clave, fichero: ruta.split('/').pop(), ruta, tipo: 'json', cursoEscolar: '', ambito: '',
    periodo: '', alumno: '', subido: dia(1), subidoPor: 'direccion@centro-inventado.es', via: 'pagina', bytes: 0, filas: 0, resumen: '',
    huella: 'h-' + clave + '-' + Math.random() }, extra || {});
}

const traer = (p) => p.evaluate(async () => {
  window.__avisos.length = 0;
  const r = await CentroDeDatos.traer({ avisar: true, pedir: true });
  await new Promise((x) => setTimeout(x, 1200));
  return { tomados: r.tomados, ambar: window.__avisos.filter((a) => a[1] === 'ambar').map((a) => a[0]) };
});

/* Lo que se ve de la ficha: tarjetas, tabla, huecos y los tres textos. */
async function ver(p) {
  const base = await p.evaluate(async (id) => {
    const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
    const l = f.lista.find((x) => x.id === id);
    const caja = document.createElement('div');
    const v = FichaTerceroAlumno.ventana(l, Datos.resumenDeTercero(l, 'ALUMNADO'), null);
    caja.innerHTML = v.html;
    document.body.appendChild(caja);
    v.montar(caja);
    const ficha = {
      tarjetas: Array.from(caja.querySelectorAll('.fp-tarjeta')).map((t) => t.dataset.tarjeta + ':' + t.querySelector('.fp-titulo').textContent),
      datos: Array.from(caja.querySelectorAll('.fp-tarjeta .ficha-dato')).map((d) => d.children[0].textContent + '=' + d.children[1].textContent),
      pie: (caja.querySelector('.fp-tarjeta .nota') || {}).textContent || ''
    };
    caja.remove();
    const sueltas = AlumnadoBDVer.tarjetas(l);
    const fila = (await TablasDatos.filasDe('ALUMNADO BD', l))[0];
    return {
      ficha, pieSuelto: sueltas.length ? sueltas[0].querySelector('.nota').textContent : '',
      sueltas: sueltas.map((d) => d.querySelector('summary').textContent),
      tabla: fila ? [fila.celdas['PIL'], fila.celdas['Curso']] : null,
      huecos: AlumnadoBDVer.huecos().map((h) => h.clave)
    };
  }, ID);
  await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-traer-alumnado').open = true; });
  await p.waitForSelector('.dqt-tabla', { timeout: 20000 });
  await p.waitForFunction(() => !document.querySelector('.dqt-tabla').textContent.includes('Mirando'), null, { timeout: 20000 });
  const tabla = await p.evaluate(() => {
    const r = document.querySelector('.dqt-tabla [data-fila="alumnado-bd"]');
    return { porDonde: r ? r.children[3].innerText.replace(/\s+/g, ' ').trim() : null, nota: document.querySelector('.dqt-notas p').innerText.replace(/\s+/g, ' ') };
  });
  return Object.assign(base, tabla);
}
const sinTextos = (v) => JSON.stringify(Object.assign({}, v, { pieSuelto: 0, porDonde: 0, nota: 0, ficha: Object.assign({}, v.ficha, { pie: 0 }) }));
const FRASE_BD = /El alumnado de la base de datos lo hace la base de datos de alumnado, al pulsar allí «Actualizar los datos»\./;
const FRASE_CD = /El alumnado de la base de datos lo hace el Centro de datos, él solo: no hay que pulsar nada\./;
const leerCopia = (p) => p.evaluate(async () => JSON.parse(await Carpetas.leerTexto(App.E.datos, 'ALUMNADO-BD.json')));

/* ---------- 1 y 2 ---------- */
console.log('--- 1 y 2. el fichero del Centro de datos ---');
let p = await abrir('');
ID = await p.evaluate(async () => (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista[0].id);
await montar(p, [{ ruta: 'hecho/alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha('centro-de-datos-ies', dia(1))) }],
  [entrada('alumnado-bd', 'hecho/alumnado-bd/ALUMNADO-BD.json', { subidoPor: 'centro-de-datos-ies', via: 'hecho' })]);
await comprobar('1. se toma y no hay ámbar', traer(p), { tomados: ['alumnado-bd'], ambar: [] });
const copia = await leerCopia(p);
await comprobar('1. la copia conserva `origen`, `dueno` y lo que no conoce',
  [copia.origen, copia.campos[0].dueno, copia.campos[1].campoNuevo, copia.cosaNueva, copia.alumnos[0].otraCosa], ['centro-de-datos-ies', 'bd-alumnado-ies', 'ignorar', { x: 1 }, 'ignorar']);
const delCentro = await ver(p);
await comprobar('2. con el fichero del Centro de datos hay tarjetas y datos', [delCentro.ficha.tarjetas.length > 0, delCentro.tabla], [true, ['Sí', '1º ESO']]);
await comprobar('2. los tres textos nuevos',
  [delCentro.ficha.pie, delCentro.pieSuelto, delCentro.porDonde, FRASE_CD.test(delCentro.nota), FRASE_BD.test(delCentro.nota)],
  [`Datos del Centro de datos del ${copia.generado.slice(8, 10)}-${copia.generado.slice(5, 7)}-${copia.generado.slice(0, 4)}`,
   `Datos del Centro de datos del ${copia.generado.slice(8, 10)}-${copia.generado.slice(5, 7)}-${copia.generado.slice(0, 4)}`,
   'Del Centro de datos. Lo hace el propio Centro de datos.', true, false]);
await p.close();

p = await abrir('');
await montar(p, [{ ruta: 'alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha('bd-alumnado-ies', dia(1))) }], [entrada('alumnado-bd', 'alumnado-bd/ALUMNADO-BD.json')]);
await traer(p);
const delaBD = await ver(p);
await comprobar('2. con el de la base de datos de alumnado sale lo mismo (tarjetas, datos, tabla y huecos)', sinTextos(delaBD), sinTextos(delCentro));
await comprobar('2. y sus textos son los de hoy',
  [/^Datos de la base de datos de alumnado del /.test(delaBD.ficha.pie), /^Datos de la base de datos de alumnado del /.test(delaBD.pieSuelto), /^Del Centro de datos\. Lo subió direccion\.$/.test(delaBD.porDonde), FRASE_BD.test(delaBD.nota)],
  [true, true, true, true]);
await p.close();

/* ---------- 3 ---------- */
console.log('--- 3. otro origen o ninguno ---');
for (const origen of ['otra-aplicacion', '']) {
  p = await abrir('');
  await montar(p, [{ ruta: 'alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha(origen, dia(1))) }], [entrada('alumnado-bd', 'alumnado-bd/ALUMNADO-BD.json')]);
  await comprobar('3. origen «' + origen + '»: se toma', traer(p), { tomados: ['alumnado-bd'], ambar: [] });
  const v = await ver(p);
  await comprobar('3. origen «' + origen + '»: los textos son los de hoy', [/^Datos de la base de datos de alumnado del /.test(v.ficha.pie), /^Datos de la base de datos de alumnado del /.test(v.pieSuelto), FRASE_BD.test(v.nota)], [true, true, true]);
  await p.close();
}

/* ---------- 4 y 5 ---------- */
console.log('--- 4 y 5. el índice con lo del plan ---');
for (const ruta of ['alumnado-bd/ALUMNADO-BD.json', 'hecho/alumnado-bd/ALUMNADO-BD.json']) {
  p = await abrir('');
  const con = await (async () => {
    await montar(p, [
      { ruta, texto: JSON.stringify(ficha('centro-de-datos-ies', dia(1))) },
      { ruta: 'alumnado/bd-alumnado-ies/entrega.json', texto: '{"entrega":"inventada"}' },
      { ruta: 'hecho/alumnado-bd/parte.json', texto: JSON.stringify({ acuerdoHecho: 1, id: 'p1', registros: [] }) }],
    [entrada('alumnado-bd', ruta, { subidoPor: 'centro-de-datos-ies', via: 'hecho' }),
     entrada('entrega', 'alumnado/bd-alumnado-ies/entrega.json', { variante: 'alumnado/bd-alumnado-ies', subidoPor: 'bd-alumnado-ies' })],
    { capacidades: ['alumnado-bd', 'cosa-nueva'], hechos: [{ clave: 'alumnado-bd', alDia: false, partes: 1 }] });
    const r = await traer(p);
    const ent = await p.evaluate(async () => { const n = []; for await (const [k] of App.E.datos.entries()) n.push(k); return n.filter((x) => /^ENTREGA/i.test(x)); });
    const apuntes = await p.evaluate(async () => Object.keys((await CentroDeDatos.leerApuntes(true)).tomado).sort());
    return [r, ent, apuntes];
  })();
  await comprobar('4/5. «' + ruta + '»: solo alumnado y ficha, sin ENTREGA en _GESTOR/datos ni ámbar', con, [{ tomados: ['alumnado-bd'], ambar: [] }, [], ['alumnado-bd|']]);
  await p.close();
}
/* el bloque de Ajustes cuenta los mismos listados con y sin la entrada `entrega` */
const cuenta = async (conEntrega) => {
  const pg = await abrir('');
  const l = [entrada('alumnado-bd', 'alumnado-bd/ALUMNADO-BD.json')];
  if (conEntrega) l.push(entrada('entrega', 'alumnado/bd-alumnado-ies/entrega.json', { variante: 'alumnado/bd-alumnado-ies' }));
  await montar(pg, [{ ruta: 'alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha('centro-de-datos-ies', dia(1))) },
    { ruta: 'alumnado/bd-alumnado-ies/entrega.json', texto: '{}' }], l);
  await pg.click('.pestana[data-pantalla="ajustes"]');
  await pg.click('[data-ajustes-pestana="ordenador"]');
  await pg.evaluate(async () => { await App.pintarAjustes(); CentroDeDatosVer.pintar(); });
  await pg.waitForFunction(() => /para el gestor/.test((document.getElementById('centro-de-datos-indice') || {}).textContent || ''), null, { timeout: 15000 });
  const t = await pg.evaluate(() => document.getElementById('centro-de-datos-indice').textContent);
  await pg.close();
  return t.match(/(\d+) listados? para el gestor/)[0];
};
await comprobar('4. Ajustes cuenta los mismos listados con y sin la entrada `entrega`', (await cuenta(true)) === (await cuenta(false)), true);

/* ---------- 6 y 7 ---------- */
console.log('--- 6 y 7. el relevo ---');
p = await abrir('');
await montar(p, [{ ruta: 'alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha('bd-alumnado-ies', dia(1))) }], [entrada('alumnado-bd', 'alumnado-bd/ALUMNADO-BD.json')]);
await traer(p);
await comprobar('6. antes del relevo: textos de la base de datos de alumnado', (await ver(p)).porDonde, 'Del Centro de datos. Lo subió direccion.');
await montar(p, [{ ruta: 'hecho/alumnado-bd/ALUMNADO-BD.json', texto: JSON.stringify(ficha('centro-de-datos-ies', dia(3))) }],
  [entrada('alumnado-bd', 'hecho/alumnado-bd/ALUMNADO-BD.json', { subido: dia(3), subidoPor: 'centro-de-datos-ies', via: 'hecho' })]);
await comprobar('6. llega la del Centro de datos de hoy: la sustituye', traer(p), { tomados: ['alumnado-bd'], ambar: [] });
await comprobar('6. la copia es la nueva', (await leerCopia(p)).origen, 'centro-de-datos-ies');
const relevo = await ver(p);
await comprobar('6. y los tres textos pasan a los nuevos', [/^Datos del Centro de datos del /.test(relevo.ficha.pie), /^Datos del Centro de datos del /.test(relevo.pieSuelto), relevo.porDonde, FRASE_CD.test(relevo.nota)],
  [true, true, 'Del Centro de datos. Lo hace el propio Centro de datos.', true]);
/* 7: una carpeta de la base de datos con un fichero más viejo */
await p.evaluate(async (viejo) => {
  const dir = Demo.carpetaDeMentira('BD');
  await Carpetas.guardarJson(dir, 'ALUMNADO-BD.json', viejo);
  await Almacen.guardar('alumnado-bd-carpeta', dir);
}, ficha('bd-alumnado-ies', dia(-5)));
await comprobar('7. el fichero viejo no se copia', p.evaluate(async () => { const r = await AlumnadoBD.traer(false, true); return [r.ok, r.copiado]; }), [true, false]);
await comprobar('7. la copia sigue siendo la del Centro de datos', (await leerCopia(p)).origen, 'centro-de-datos-ies');
const tras = await ver(p);
await comprobar('7. y la tabla no dice que haya otro más nuevo', p.evaluate(() => /^No\./.test(document.querySelector('.dqt-tabla [data-fila="alumnado-bd"]').lastElementChild.textContent.trim())), true);
await p.close();

/* ---------- 8 ---------- */
console.log('--- 8. una parte de hecho/ y dos entradas ---');
p = await abrir('');
const parte = JSON.stringify({ acuerdoHecho: 1, id: 'p1', registros: [{ id: 'r1' }] });
await montar(p, [{ ruta: 'hecho/alumnado-bd/a.json', texto: parte }, { ruta: 'hecho/alumnado-bd/b.json', texto: parte }],
  [entrada('alumnado-bd', 'hecho/alumnado-bd/a.json'), entrada('alumnado-bd', 'hecho/alumnado-bd/b.json')]);
await comprobar('8. no se toma nada y sale el ámbar de siempre', traer(p),
  { tomados: [], ambar: ['En el Centro de datos hay más de un listado de alumnado de la base de datos. No he traído ninguno.'] });
await comprobar('8. sin copia de la ficha', p.evaluate(async () => { try { await App.E.datos.getFileHandle('ALUMNADO-BD.json'); return true; } catch (e) { return false; } }), false);
await p.close();
p = await abrir('');
await montar(p, [{ ruta: 'hecho/alumnado-bd/a.json', texto: parte }], [entrada('alumnado-bd', 'hecho/alumnado-bd/a.json')]);
const unaParte = await traer(p);
await comprobar('8. una sola entrada que es una parte (sin `acuerdo`): no vale como ficha, no se copia', [unaParte.tomados, unaParte.ambar.length > 0], [[], true]);
await comprobar('8. y no deja copia', p.evaluate(async () => { try { await App.E.datos.getFileHandle('ALUMNADO-BD.json'); return true; } catch (e) { return false; } }), false);
await p.close();

/* ---------- 9 ---------- */
console.log('--- 9. la copia de pruebas ---');
async function demoCompleta(parametros) {
  const pg = await abrir(parametros);
  await pg.evaluate(() => CentroDeDatos.senalarCarpeta());
  await pg.waitForFunction(() => window.__avisos.some((a) => /^Traído del Centro de datos/.test(a[0])), null, { timeout: 30000 });
  await pg.waitForTimeout(1500);
  await pg.click('.pestana[data-pantalla="ajustes"]');
  await pg.click('[data-ajustes-pestana="ordenador"]');
  await pg.evaluate(async () => { await App.pintarAjustes(); CentroDeDatosVer.pintar(); });
  await pg.waitForFunction(() => /para el gestor/.test((document.getElementById('centro-de-datos-indice') || {}).textContent || ''), null, { timeout: 15000 });
  const r = await pg.evaluate(() => ({ verde: window.__avisos.filter((a) => a[1] === 'bueno').map((a) => a[0]).filter((t) => /^Traído del Centro de datos/.test(t)).length,
    ambar: window.__avisos.filter((a) => a[1] === 'ambar').length, carpeta: document.getElementById('centro-de-datos-indice').textContent }));
  return [pg, r];
}
ID = '2100099';   /* la alumna que suma la carpeta de mentira, con datos de la ficha */
let [hoy, rHoy] = await demoCompleta('');
const vHoy = await ver(hoy);
await comprobar('9. sin `nucleo`: el aviso verde, ningún ámbar y los textos de hoy', [rHoy.verde, rHoy.ambar, /^Del Centro de datos\. Lo subió direccion\.$/.test(vHoy.porDonde), FRASE_BD.test(vHoy.nota)], [1, 0, true, true]);
let [nuc, rNuc] = await demoCompleta('&nucleo=1');
const vNuc = await ver(nuc);
await comprobar('9. con `nucleo=1`: el aviso verde y ningún ámbar', [rNuc.verde, rNuc.ambar], [1, 0]);
await comprobar('9. y el mismo número de listados para el gestor', rNuc.carpeta.match(/(\d+) listados? para el gestor/)[0], rHoy.carpeta.match(/(\d+) listados? para el gestor/)[0]);
await comprobar('9. los tres textos son los del Centro de datos', [vNuc.porDonde, FRASE_CD.test(vNuc.nota), /^Datos del Centro de datos del /.test(vNuc.ficha.pie)],
  ['Del Centro de datos. Lo hace el propio Centro de datos.', true, true]);
await comprobar('9. y las tarjetas, la tabla y los huecos son los mismos', sinTextos(vNuc), sinTextos(vHoy));
await hoy.close(); await nuc.close();

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); } else console.log('bien   sin errores de consola');
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
