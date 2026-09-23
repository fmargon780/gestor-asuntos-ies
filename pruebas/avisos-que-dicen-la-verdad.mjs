/* Prueba en navegador de verdad de la fila 100
   (docs/AVISOS-QUE-DICEN-LA-VERDAD.md): lo principal y lo accesorio por
   separado. Si falla solo lo accesorio, el dato está guardado y el
   aviso es ámbar, nunca rojo.

   1. Marcar un hito, con el paso accesorio (poner el estado del
      asunto que trae el siguiente hito) fallando.
   2. Cambiar el estado, con el repintado de la lista fallando.
   3. Archivar, con el borrado de la carpeta original fallando (un
      documento abierto en otro programa): la carpeta ya está en el
      ARCHIVO y el aviso es ámbar. Mientras dura, el asunto está
      ocupado y un segundo archivado no arranca.
   4. El desplegable de estado de la ficha sigue apagado mientras dura
      el guardado, aunque el modo consulta repase los controles.
   5. Un cuadro sobre otro: el primero se da por cancelado.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
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

/* Se apuntan todos los avisos, con su color. */
await pagina.evaluate(() => {
  window.__avisos = [];
  const comoEra = U.aviso;
  U.aviso = function (texto, clase) { window.__avisos.push({ texto: texto, clase: clase || '' }); return comoEra(texto, clase); };
});
const avisos = () => pagina.evaluate(() => { const a = window.__avisos.slice(); window.__avisos = []; return a; });
const colores = (lista) => lista.map(a => a.clase);

const A = '260920 SOLICITUD Uno, Ana 1150001';
await pagina.evaluate(async (A) => {
  await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  await App.anotar(A, { tercero: 'Uno, Ana 1150001', categoria: 'ALUMNADO', situacion: 'PENDIENTE' });
  await App.verAbiertos();
}, A);

/* ---------- 1. marcar un hito ---------- */
console.log('--- 1. marcar un hito con el paso accesorio fallando ---');
const r1 = await pagina.evaluate(async (A) => {
  await Hitos.cambiar(d => {
    d.porAsunto[A] = { creados: U.hoyIso(), hitos: [
      Hitos.normalizarHito({ id: 'h1', titulo: 'Recoger', estado: 'encurso' }),
      Hitos.normalizarHito({ id: 'h2', titulo: 'Tramitar', estadoAsunto: 'EN TRÁMITE' })
    ] };
  });
  window.__avisos = [];
  const anotar = App.anotar;
  App.anotar = async function () { const e = new Error('disco lento'); e.name = 'NotReadableError'; throw e; };
  try { await Hitos.marcar(A, 'h1', 'hecho'); } finally { App.anotar = anotar; }
  const h = (await Hitos.hitosDe(A)).map(x => x.id + ':' + x.estado);
  return h;
}, A);
await comprobar('el hito ha quedado guardado', Promise.resolve(r1), ['h1:hecho', 'h2:encurso']);
const a1 = await avisos();
await comprobar('el aviso es ámbar, no rojo', Promise.resolve(colores(a1)), ['ambar']);
await comprobar('y dice qué ha fallado, en castellano',
  Promise.resolve(a1[0] && a1[0].texto.indexOf('Hito guardado, pero no he podido poner el estado') === 0 &&
    a1[0].texto.indexOf('Dropbox') > -1), true);

/* ---------- 2. cambiar el estado ---------- */
console.log('--- 2. cambiar el estado con el repintado fallando ---');
const r2 = await pagina.evaluate(async (A) => {
  const pintar = App.pintarAbiertos;
  App.pintarAbiertos = function () { throw new Error('repintado roto'); };
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  try { await App.ponerEstado(a, 'EN TRÁMITE'); } finally { App.pintarAbiertos = pintar; }
  const r = JSON.parse(await Carpetas.leerTexto(App.E.gestor, 'asuntos.json'));
  return r.asuntos[A].situacion;
}, A);
await comprobar('el estado está guardado', Promise.resolve(r2), 'EN TRÁMITE');
await comprobar('el aviso es ámbar, no rojo', avisos().then(colores), ['ambar']);

/* ---------- 3. archivar ---------- */
console.log('--- 3. archivar con el borrado del original fallando ---');
await pagina.evaluate(async (A) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  c._hijos.set('papel.pdf', window.__disco.fich('papel.pdf', 'uno'));
  const abiertos = window.__disco.abiertos;
  const quitar = abiertos.removeEntry.bind(abiertos);
  abiertos.removeEntry = async function (n, o) {
    if (n === A) { const e = new Error('abierto en Acrobat'); e.name = 'NoModificationAllowedError'; throw e; }
    return quitar(n, o);
  };
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  window.__archivando = App.cerrarAsunto(a);
}, A);
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('mientras dura, el asunto está ocupado', pagina.evaluate((A) => !!App.E.ocupados[A], A), true);
await pagina.evaluate((A) => {
  window.__segundo = App.cerrarAsunto(App.E.listaAbiertos.filter(x => x.nombre === A)[0]);
}, A);
await pagina.waitForTimeout(100);
await comprobar('un segundo archivado no arranca (aviso ámbar de acción en marcha)',
  pagina.evaluate(() => window.__avisos.some(a => a.clase === 'ambar' && a.texto.indexOf('ya tiene una acción en marcha') > -1)), true);
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => Promise.all([window.__archivando, window.__segundo]));
const a3 = await avisos();
await comprobar('la carpeta ya está en el ARCHIVO',
  pagina.evaluate(async (A) => {
    const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
    const ter = await cat.getDirectoryHandle('Uno, Ana 1150001');
    return !!(await ter.getDirectoryHandle(A)) ;
  }, A), true);
await comprobar('ningún aviso rojo', Promise.resolve(a3.filter(a => a.clase === 'malo').map(a => a.texto)), []);
await comprobar('verde de archivado y ámbar de la copia vieja',
  Promise.resolve([a3.some(a => a.clase === 'bueno' && a.texto.indexOf('Asunto archivado') === 0),
                   a3.some(a => a.clase === 'ambar' && a.texto.indexOf('queda una copia vieja') > -1)]), [true, true]);
await comprobar('al terminar, ya no está ocupado', pagina.evaluate((A) => !!App.E.ocupados[A], A), false);

/* ---------- 4. el desplegable sigue apagado mientras guarda ---------- */
console.log('--- 4. el control se queda apagado mientras guarda ---');
const B = '260921 SOLICITUD Dos, Luis 1150002';
await pagina.evaluate(async (B) => {
  await window.__disco.abiertos.getDirectoryHandle(B, { create: true });
  await App.anotar(B, { tercero: 'Dos, Luis 1150002', categoria: 'ALUMNADO', situacion: 'PENDIENTE' });
  await App.verAbiertos();
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === B)[0], 'abierto');
}, B);
await pagina.waitForSelector('#ficha-acciones select.campo-estado');
const r4 = await pagina.evaluate(async (B) => {
  const anotar = App.anotar;
  let soltar;
  App.anotar = function (c, d) { return new Promise(r => { soltar = () => r(anotar(c, d)); }); };
  const sel = document.querySelector('#ficha-acciones select.campo-estado');
  sel.value = 'EN TRÁMITE';
  sel.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 20));
  /* Algo nuevo en la ficha: el modo consulta repasa los controles. */
  document.getElementById('ficha-asunto-cuerpo').appendChild(document.createElement('div'));
  await new Promise(r => setTimeout(r, 120));
  const durante = sel.disabled;
  soltar();
  App.anotar = anotar;
  await new Promise(r => setTimeout(r, 300));
  return durante;
}, B);
await comprobar('el desplegable sigue apagado mientras guarda', Promise.resolve(r4), true);
await avisos();

/* ---------- 5. un cuadro sobre otro ---------- */
console.log('--- 5. un cuadro sobre otro ---');
await comprobar('el primero se da por cancelado',
  pagina.evaluate(async () => {
    const primero = U.preguntar('Uno', '<p>uno</p>', 'Vale');
    const segundo = U.preguntar('Dos', '<p>dos</p>', 'Vale');
    const r1 = await Promise.race([primero, new Promise(r => setTimeout(() => r('colgado'), 300))]);
    document.getElementById('cuadro-aceptar').click();
    const r2 = await segundo;
    return [r1, r2];
  }), [false, true]);

const noEsperados = errores.filter(e => e.indexOf('DEPURAR') === -1);
if (noEsperados.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + noEsperados.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
