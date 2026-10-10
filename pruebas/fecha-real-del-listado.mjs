/* Fila 324 (docs/FECHA-REAL-DEL-LISTADO.md): para comparar el listado de matrícula con la copia del alumnado se usa
   la fecha real del listado (la de Séneca, apuntada en datos-origen.json), no el día en que se copió.
     1. DatosQueTengo.fechaReal. 2. La «Comprobación al entrar». 3. Quién manda al cargar el alumnado.
     4. El aviso de alumnado viejo (Frescura).
   Con Chromium real y la copia de pruebas (`copiaalumnado=`). Sin pausas fijas: espera a condiciones. */
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
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(BASE + '?demo=1&auto=1' + (parametros || ''));
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  /* La demostración ya montada: el apunte de la copia está escrito. */
  await pagina.waitForFunction(() => window.Demo && !window.Demo.montando && window.DatosQueTengo && App.E.datos, null, { timeout: 30000 });
  return pagina;
}
/* La fila «Base de datos de alumnado» de la comprobación al entrar. */
const filaComprobacion = (p) => p.evaluate(async () => {
  await ComprobacionEntrada.comprobar();
  const f = ComprobacionEntrada.filas().filter((x) => x.id === 'alumnado')[0];
  return { estado: f.estado, frase: f.frase };
});
const manda = (p) => p.evaluate(async () => { Datos.olvidar('ALUMNADO'); return (await Datos.cargar(App.E.datos, 'ALUMNADO')).bd.manda; });
const DIA = 86400000;

/* ---------- 1. fechaReal ---------- */
console.log('--- 1. DatosQueTengo.fechaReal ---');
let p = await abrir('&copiaalumnado=aldia');
await comprobar('1. con apunte válido da su fecha original (hace 10 días)', p.evaluate(async () => {
  const t = await DatosQueTengo.fechaReal('RegAlum.csv');
  return Math.abs(Date.now() - t - 10 * 86400000) < 120000;
}), true);
await comprobar('1. sin apunte de ese fichero, 0', p.evaluate(() => DatosQueTengo.fechaReal('RelPerCen.csv')), 0);
await comprobar('1. con la marca que ya no coincide, 0', p.evaluate(async () => {
  await DatosQueTengo.apuntar('RegAlum.csv', { via: 'carpeta', fechaOriginal: new Date(Date.now() - 2 * 86400000).toISOString(), marca: '2000-01-01T00:00:00.000Z' });
  return DatosQueTengo.fechaReal('RegAlum.csv');
}), 0);
await comprobar('1. sin fechaOriginal, 0', p.evaluate(async () => {
  await DatosQueTengo.apuntar('RegAlum.csv', { via: 'carpeta', fechaOriginal: '' });
  return DatosQueTengo.fechaReal('RegAlum.csv');
}), 0);
await comprobar('1. no llama a Datos.cargar ni a estado(), y no lanza', p.evaluate(async () => {
  let llamadas = 0;
  const c = Datos.cargar, e = DatosQueTengo.estado;
  Datos.cargar = function () { llamadas++; return c.apply(this, arguments); };
  DatosQueTengo.estado = function () { llamadas++; return e.apply(this, arguments); };
  const antes = App.E.datos;
  const t = await DatosQueTengo.fechaReal('RegAlum.csv');
  App.E.datos = null;
  const sinDatos = await DatosQueTengo.fechaReal('RegAlum.csv');
  App.E.datos = antes;
  Datos.cargar = c; DatosQueTengo.estado = e;
  return [llamadas, t, sinDatos];
}), [0, 0, 0]);
await p.close();

/* ---------- 2. la comprobación al entrar ---------- */
console.log('--- 2. la comprobación al entrar ---');
p = await abrir('&copiaalumnado=aldia');
await comprobar('2. al día (copia de hace 5 días, listado de hace 10): bien, sin «vieja»', filaComprobacion(p).then((f) => [f.estado, f.frase, /vieja/.test(f.frase)]), ['bien', 'Se usa la copia que hay guardada.', false]);
await p.close();

p = await abrir('&copiaalumnado=vieja');
const vieja = await filaComprobacion(p);
const fechas = await p.evaluate(async () => {
  const copia = await AlumnadoBD.leer();
  return [DatosQueTengo.fechaHora(copia.generado), DatosQueTengo.fechaHora(await DatosQueTengo.fechaReal('RegAlum.csv'))];
});
await comprobar('2. vieja: en ámbar («falta») con las dos fechas, «más vieja» y «Actualizar los datos»', [vieja.estado, vieja.frase.includes(fechas[0]), vieja.frase.includes(fechas[1]), /más vieja/.test(vieja.frase), /«Actualizar los datos»/.test(vieja.frase), /otro ordenador/.test(vieja.frase)], ['falta', true, true, true, true, false]);
await comprobar('2. vieja: las fechas llevan día y hora y son distintas', [/\d{1,2}-[a-z]{3}-\d{4} · \d{2}:\d{2}/.test(fechas[0]), /\d{1,2}-[a-z]{3}-\d{4} · \d{2}:\d{2}/.test(fechas[1]), fechas[0] !== fechas[1]], [true, true, true]);
await p.evaluate(async () => { const c = await AlumnadoBD.leer(); await AlumnadoBD.guardar(Object.assign({}, c, { origen: 'centro-de-datos-ies' })); });
const vCentro = await filaComprobacion(p);
await comprobar('2. vieja y hecha por el Centro de datos: la frase manda subir el listado al Centro de datos', [vCentro.estado, /^La copia del alumnado que hace el Centro de datos es del /.test(vCentro.frase), /Hay que subir ese listado al Centro de datos: él hace la copia nueva\.$/.test(vCentro.frase), vCentro.frase.includes(fechas[0]), vCentro.frase.includes(fechas[1])], ['falta', true, true, true, true]);
await p.close();

p = await abrir('&copiaalumnado=sinfecha');
await comprobar('2. sin fecha real apuntada: bien, sin la palabra «vieja»', filaComprobacion(p).then((f) => [f.estado, /vieja/.test(f.frase)]), ['bien', false]);
await p.close();

p = await abrir('');
await comprobar('2. sin el parámetro nuevo no hay copia de la base de datos en la demostración', p.evaluate(async () => !(await AlumnadoBD.leer())), true);
await p.close();

/* ---------- 3. quién manda al cargar el alumnado ---------- */
console.log('--- 3. quién manda ---');
p = await abrir('&copiaalumnado=aldia');
await comprobar('3. listado copiado hoy pero de fecha real anterior a la copia: manda la base de datos', manda(p), true);
await p.close();
p = await abrir('&copiaalumnado=vieja');
await comprobar('3. fecha real posterior a la copia: no manda', manda(p), false);
await p.close();
p = await abrir('&copiaalumnado=sinfecha');
await comprobar('3. sin apunte: manda la base de datos', manda(p), true);
await p.close();

/* ---------- 4. el aviso de alumnado viejo ---------- */
console.log('--- 4. el aviso de alumnado viejo ---');
p = await abrir('&copiaalumnado=sinfecha');
const aviso = (pagina) => pagina.evaluate(async () => {
  AlumnadoBD.fechaGenerado = async () => null;   /* sin copia de la base de datos: solo cuenta el listado */
  await Frescura.repasar();
  const d = document.getElementById('bloque-frescura');
  return d ? d.dataset.aviso : null;
});
await comprobar('4. sin apunte: se cuentan los días desde la copia (hoy), sin aviso', aviso(p), '');
await p.evaluate(() => DatosQueTengo.apuntar('RegAlum.csv', { via: 'carpeta', fechaOriginal: new Date(Date.now() - 400 * 86400000).toISOString() }));
await comprobar('4. con fecha real de hace 400 días y copia de hoy: avisa con 400 días', aviso(p), '400 días');
await p.close();

await navegador.close();
if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
