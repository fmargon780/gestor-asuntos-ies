/* Prueba en navegador de verdad de la fila 341 (docs/CUADROS-CON-BOTONES-A-LA-VISTA.md): la regla común de los cuadros.
   Con la ventana baja (1280×700) y mucho contenido, el pie con sus botones está dentro de la pantalla, se puede pulsar
   y solo se desplaza el cuerpo. Se prueban: «Avisar a los relacionados» (el cuadro del aviso, 80 personas), «Añadir
   varios relacionados» y el cuadro común con un texto larguísimo, solo y con cada una de las clases de cuadro ancho,
   medio y alto. Sin la regla común de css/estilos.css, esta prueba falla. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const contexto = await navegador.newContext({ viewport: { width: 1280, height: 700 } });
const pagina = await contexto.newPage();
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.goto(BASE + '?demo=1&auto=1');
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForFunction(() => App.E.listaAbiertos && App.E.listaAbiertos.length > 5 && !(window.Demo && Demo.montando), null, { timeout: 60000 });
await pagina.waitForTimeout(1500);

/* ¿Están los botones (los del pie común o los que se indican) dentro de la pantalla y a la vista de verdad? */
const pie = (ids) => pagina.evaluate((ids) => {
  const salida = {};
  ids.forEach((id) => {
    const b = document.getElementById(id);
    if (!b || !b.offsetParent) { salida[id] = 'no se ve'; return; }
    const r = b.getBoundingClientRect();
    const dentro = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const encima = document.elementFromPoint(x, y);
    salida[id] = dentro && encima && (encima === b || b.contains(encima)) ? 'bien' : 'fuera o tapado (' + Math.round(r.top) + '-' + Math.round(r.bottom) + ')';
  });
  return salida;
}, ids);
const cuadroCabe = () => pagina.evaluate(() => {
  const c = document.querySelector('#capa > .cuadro').getBoundingClientRect();
  return c.top >= 0 && c.bottom <= window.innerHeight;
});
const cerrar = () => pagina.evaluate(() => { document.getElementById('cuadro-cancelar').click(); });
const cerrado = () => pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- 1. «Avisar a los relacionados» con 80 personas (el cuadro del aviso) ---');
await pagina.evaluate(() => {
  const lista = [];
  for (let i = 0; i < 80; i++) lista.push({ categoria: 'ALUMNADO', nombre: 'Apellido' + i + ' Segundo, Nombre ' + i + ' 00000' + (100 + i) });
  window.__fin = Relacionados.confirmarRelacionadosAlArchivar({ ficha: { relacionados: lista } }).then((r) => { window.__r = r; });
});
await pagina.waitForSelector('.rel-confirmar-lista');
comprobar('1. Cancelar y «Archivar el asunto» se ven y se pueden pulsar', await pie(['cuadro-cancelar', 'cuadro-aceptar']), { 'cuadro-cancelar': 'bien', 'cuadro-aceptar': 'bien' });
comprobar('1. el cuadro cabe en la pantalla', await cuadroCabe(), true);
comprobar('1. el cuerpo se desplaza por dentro', await pagina.evaluate(() => { const c = document.getElementById('cuadro-cuerpo'); return c.scrollHeight > c.clientHeight; }), true);
await pagina.evaluate(() => { document.getElementById('cuadro-cuerpo').scrollTop = 99999; });
comprobar('1. desplazado hasta el final, los botones siguen a la vista', await pie(['cuadro-cancelar', 'cuadro-aceptar']), { 'cuadro-cancelar': 'bien', 'cuadro-aceptar': 'bien' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__r !== undefined);
comprobar('1. Aceptar devuelve las 80 marcadas', await pagina.evaluate(() => window.__r.length), 80);

console.log('--- 2. «Añadir varios relacionados» ---');
await pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter((x) => x.ficha && x.ficha.categoria === 'ALUMNADO')[0] || App.E.listaAbiertos[0];
  window.__fin2 = Relacionados.agregarVarios(a);
});
await pagina.waitForSelector('#rel-cancelar');
comprobar('2. Cancelar y el botón principal se ven', await pie(['rel-cancelar', 'rel-marcados-anadir']), { 'rel-cancelar': 'bien', 'rel-marcados-anadir': 'bien' });
comprobar('2. el cuadro cabe en la pantalla', await cuadroCabe(), true);
await pagina.click('#rel-cancelar');
await pagina.waitForTimeout(300);

console.log('--- 3. el cuadro común con un texto larguísimo, con cada clase de cuadro ---');
const juegos = [[], ['cuadro-ancho'], ['cuadro-medio'], ['cuadro-alto'], ['cuadro-ancho', 'cuadro-repartir']];
for (const clases of juegos) {
  const nombre = clases.length ? clases.join('+') : 'sin clase';
  await pagina.evaluate((clases) => {
    const cuadro = document.querySelector('#capa > .cuadro');
    clases.forEach((c) => cuadro.classList.add(c));
    let html = '';
    for (let i = 0; i < 120; i++) html += '<p>Línea ' + i + ' de un cuadro con muchísimo contenido para que no quepa.</p>';
    window.__p = U.preguntar('Cuadro largo', html, 'Aceptar').then((r) => { cuadro.classList.remove.apply(cuadro.classList, clases); window.__pr = r; });
  }, clases);
  await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo');
  comprobar('3. (' + nombre + ') los botones se ven y se pueden pulsar', await pie(['cuadro-cancelar', 'cuadro-aceptar']), { 'cuadro-cancelar': 'bien', 'cuadro-aceptar': 'bien' });
  comprobar('3. (' + nombre + ') el cuadro cabe en la pantalla', await cuadroCabe(), true);
  await pagina.click('#cuadro-cancelar');
  await pagina.waitForTimeout(200);
  comprobar('3. (' + nombre + ') Cancelar cierra', await cerrado(), true);
}

console.log('--- 4. pantalla estrecha ---');
await pagina.setViewportSize({ width: 390, height: 640 });
await pagina.evaluate(() => {
  let html = '';
  for (let i = 0; i < 120; i++) html += '<p>Línea ' + i + ' de un cuadro con muchísimo contenido para que no quepa.</p>';
  U.preguntar('Cuadro largo', html, 'Aceptar');
});
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo');
comprobar('4. en el móvil los botones se ven', await pie(['cuadro-cancelar', 'cuadro-aceptar']), { 'cuadro-cancelar': 'bien', 'cuadro-aceptar': 'bien' });
comprobar('4. el cuadro no se sale de lado ni tiene desplazamiento de lado por dentro', await pagina.evaluate(() => { const c = document.querySelector('#capa > .cuadro'), b = document.getElementById('cuadro-cuerpo'), r = c.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth && b.scrollWidth <= b.clientWidth; }), true);
await pagina.click('#cuadro-cancelar');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
