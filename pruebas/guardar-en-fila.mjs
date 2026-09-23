/* Prueba en navegador de verdad de la fila 99 (docs/GUARDAR-EN-FILA.md):
   guardar en fila y sin trabajo de más.

   1. Diez guardados del mismo día escriben UNA copia en copias/, con
      el contenido de antes del primero.
   2. Dos App.anotar lanzados a la vez sobre campos distintos dejan los
      dos cambios (y dos Hitos.cambiar, también).
   3. Una lectura que falla una vez con NotReadableError sale bien al
      reintentar.
   4. Una lectura vacía de asuntos.json, cuando antes tenía asuntos, no
      escribe nada: error claro, y el fichero sigue como estaba.
   5. Archivar una carpeta con un fichero «(conflicted copy)» lo
      conserva en el destino.
   6. Mientras hay un guardado en marcha, ColaGuardado.hayGuardado() lo
      dice (las tareas de fondo se saltan su pasada).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const A = '260920 SOLICITUD Uno, Ana 1150001';

/* ---------- 1. una sola copia al día, la de antes del primero ---------- */
console.log('--- 1. la copia del día ---');
const r1 = await pagina.evaluate(async (A) => {
  const g = App.E.gestor;
  await App.anotar(A, { situacion: 'ANTES' });
  /* Se borran las copias que haya, y se lee lo que hay ahora en disco:
     es lo que tiene que quedar en la copia de hoy. */
  const copias = await g.getDirectoryHandle('copias', { create: true });
  for (const [n] of Array.from(copias._hijos)) copias._hijos.delete(n);
  const antes = JSON.parse(await Carpetas.leerTexto(g, 'asuntos.json'));
  /* El primer anotar de arriba crea asuntos.json (no había nada que
     copiar). A partir de aquí, el primero de los diez hace la copia del
     día con lo de antes, y los otros nueve no deben tocarla. */
  /* Como el navegador de verdad: pedir como CARPETA algo que es un
     fichero falla (el disco de mentira no lo distinguía, y por eso el
     fallo de la copia del día no se veía en las pruebas). */
  const dirOriginal = copias.getDirectoryHandle.bind(copias);
  copias.getDirectoryHandle = async (n, o) => {
    const x = copias._hijos.get(n);
    if (x && x.kind === 'file') { const e = new Error('es un fichero'); e.name = 'TypeMismatchError'; throw e; }
    return dirOriginal(n, o);
  };
  let escrituras = 0;
  const original = copias.getFileHandle.bind(copias);
  copias.getFileHandle = async (n, o) => { if (o && o.create && n.indexOf('asuntos-') === 0) escrituras++; return original(n, o); };
  for (let i = 0; i < 10; i++) await App.anotar(A, { situacion: 'PASO ' + i });
  copias.getFileHandle = original;
  const deAsuntos = Array.from(copias._hijos.keys()).filter(n => n.indexOf('asuntos-') === 0);
  const copia = deAsuntos.length ? JSON.parse(await Carpetas.leerTexto(copias, deAsuntos[0])) : null;
  return { cuantas: deAsuntos.length, escrituras, igual: JSON.stringify(copia) === JSON.stringify(antes) };
}, A);
await comprobar('diez guardados dejan una sola copia de asuntos.json', Promise.resolve(r1.cuantas), 1);
await comprobar('y se escribe una sola vez', Promise.resolve(r1.escrituras <= 1), true);
await comprobar('con el contenido de antes del primer guardado', Promise.resolve(r1.igual), true);

/* ---------- 2. dos guardados a la vez ---------- */
console.log('--- 2. dos guardados a la vez ---');
await comprobar('dos App.anotar a la vez sobre campos distintos dejan los dos',
  pagina.evaluate(async (A) => {
    await Promise.all([App.anotar(A, { via: 'correo' }), App.anotar(A, { situacion: 'EN TRÁMITE' })]);
    const r = JSON.parse(await Carpetas.leerTexto(App.E.gestor, 'asuntos.json'));
    return [r.asuntos[A].via, r.asuntos[A].situacion, App.E.registro.asuntos[A].via, App.E.registro.asuntos[A].situacion];
  }, A), ['correo', 'EN TRÁMITE', 'correo', 'EN TRÁMITE']);
await comprobar('dos Hitos.cambiar a la vez tampoco se pisan',
  pagina.evaluate(async () => {
    await Promise.all([
      Hitos.cambiar(d => { d.porAsunto.X = { creados: '', hitos: [] }; }),
      Hitos.cambiar(d => { d.porAsunto.Y = { creados: '', hitos: [] }; })
    ]);
    const d = await Hitos.leer();
    return ['X', 'Y'].map(k => !!d.porAsunto[k]);
  }), [true, true]);

/* ---------- 3. leer con NotReadableError una vez ---------- */
console.log('--- 3. reintentar al leer ---');
await comprobar('una lectura que falla una vez con NotReadableError sale bien',
  pagina.evaluate(async () => {
    const g = App.E.gestor;
    const h = await g.getFileHandle('asuntos.json');
    const original = h.getFile;
    let veces = 0;
    h.getFile = async () => {
      veces++;
      if (veces === 1) { const e = new Error('ocupado'); e.name = 'NotReadableError'; throw e; }
      return original();
    };
    try {
      const t = await Carpetas.leerJson(g, 'asuntos.json');
      return [veces, !!(t && t.asuntos)];
    } finally { h.getFile = original; }
  }), [2, true]);

/* ---------- 4. lectura vacía con registro ---------- */
console.log('--- 4. una lectura vacía no escribe ---');
const r4 = await pagina.evaluate(async (A) => {
  App.LECTURA_VACIA_ESPERAS_MS = [10, 10];
  const g = App.E.gestor;
  const h = await g.getFileHandle('asuntos.json');
  const bueno = h._texto;
  const original = h.getFile;
  /* Dropbox a mitad de cambiar el fichero: llega sin asuntos. */
  h.getFile = async () => new Blob(['{}']);
  let error = '';
  let escrito = false;
  const w = h.createWritable;
  h.createWritable = async () => { escrito = true; return w(); };
  try { await App.anotar(A, { situacion: 'DESPUÉS' }); } catch (e) { error = e.name + ': ' + e.message; }
  h.getFile = original;
  h.createWritable = w;
  return { error, escrito, igual: h._texto === bueno };
}, A);
await comprobar('da un error claro', Promise.resolve(r4.error.indexOf('LecturaVacia: asuntos.json ha llegado vacío') === 0), true);
await comprobar('no escribe nada', Promise.resolve(r4.escrito), false);
await comprobar('el fichero sigue como estaba', Promise.resolve(r4.igual), true);

/* ---------- 5. la copia en conflicto viaja al archivar ---------- */
console.log('--- 5. la copia en conflicto no se pierde ---');
const B = '260921 SOLICITUD Dos, Luis 1150002';
const CONFLICTO = 'papel (Francisco\'s conflicted copy 2026-09-23).pdf';
const r5 = await pagina.evaluate(async ([B, CONFLICTO]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(B, { create: true });
  c._hijos.set('papel.pdf', window.__disco.fich('papel.pdf', 'uno'));
  c._hijos.set(CONFLICTO, window.__disco.fich(CONFLICTO, 'dos'));
  const destino = await Carpetas.bajar(App.E.archivo, ['ALUMNADO', 'Dos, Luis 1150002'], true);
  await Carpetas.mover(App.E.abiertos, B, destino);
  const d = await destino.getDirectoryHandle(B);
  return Array.from(d._hijos.keys()).sort();
}, [B, CONFLICTO]);
await comprobar('el fichero «(conflicted copy)» llega al destino', Promise.resolve(r5), [CONFLICTO, 'papel.pdf'].sort());

/* ---------- 6. el contador de guardado en marcha ---------- */
console.log('--- 6. hay un guardado en marcha ---');
await comprobar('mientras se guarda, hayGuardado() dice que sí; al terminar, que no',
  pagina.evaluate(async (A) => {
    const p = App.anotar(A, { situacion: 'OTRA' });
    const durante = ColaGuardado.hayGuardado();
    await p;
    await new Promise(r => setTimeout(r, 0));
    return [durante, ColaGuardado.hayGuardado()];
  }, A), [true, false]);

const noEsperados = errores.filter(e => e.indexOf('asuntos.json ha llegado vacío') === -1);
if (noEsperados.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + noEsperados.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
