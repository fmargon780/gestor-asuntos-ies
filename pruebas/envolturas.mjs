/* Prueba de la fila 70 (docs/ENVOLTURAS-COMPROBADAS.md): las
   envolturas de la aplicación, apuntadas y comprobadas al arrancar.

   En navegador de verdad (hace falta cargar index.html entera, con
   los 103 ficheros de programa en su orden real): reutiliza el disco
   de mentira de pruebas/navegador.mjs, igual que pruebas/tipos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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
function comprobarSincrono(titulo, real, esperado) {
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
/* Alguna envoltura (js/bandeja-correos.js) no se aplica hasta que el
   arranque de verdad ha terminado; envolturas-esperadas.js espera 1,5s
   antes de comprobar por primera vez, así que aquí se espera un poco
   más antes de dar por bueno el resultado. */
await pagina.waitForTimeout(1800);

/* ================================================================
   1. Al arrancar, las envolturas esperadas están todas aplicadas y
   no sale ningún aviso.
   ================================================================ */
console.log('--- 1. al arrancar, todas aplicadas, sin aviso ---');

await comprobar('ninguna falta', pagina.evaluate(() => window.EnvolturasEsperadas.faltantes().length), 0);
await comprobar('ninguna fallida', pagina.evaluate(() => window.EnvolturasEsperadas.fallidasEsperadas().length), 0);
await comprobar('no sale el aviso rojo', pagina.locator('#aviso-envolturas').count(), 0);

/* ================================================================
   2. Si se quita a mano una de la lista de aplicadas, sale el aviso
   rojo y dice cuál falta.
   ================================================================ */
console.log('--- 2. quitando una a mano, sale el aviso ---');

await pagina.evaluate(() => {
  window.__envolturasOriginal = window.U.envolturasAplicadas;
  window.U.envolturasAplicadas = function () {
    return window.__envolturasOriginal().filter(function (e) {
      return !(e.etiqueta === 'App.abrirFicha' && e.fichero === 'js/correo.js');
    });
  };
  window.EnvolturasEsperadas.pintarAviso();
});

await comprobar('ahora sí sale el aviso rojo', pagina.locator('#aviso-envolturas').count(), 1);
await comprobar('el aviso es rojo', pagina.locator('#aviso-envolturas').getAttribute('class'), 'aviso aviso-rojo');
await comprobar('dice cuál falta', pagina.locator('#aviso-envolturas').innerText().then(t => t.indexOf('App.abrirFicha') !== -1 && t.indexOf('js/correo.js') !== -1), true);

/* Se deshace el parche, para no dejar el resto de la prueba con el
   aviso puesto (recargar la página no vale aquí: el disco y el
   almacén de mentira de pruebas/navegador.mjs viven dentro del propio
   `addInitScript`, que se vuelve a ejecutar desde cero en cada
   navegación, así que un reload perdería las carpetas ya señaladas). */
await pagina.evaluate(() => {
  window.U.envolturasAplicadas = window.__envolturasOriginal;
  window.EnvolturasEsperadas.pintarAviso();
});
await comprobar('al deshacer el parche, el aviso desaparece', pagina.locator('#aviso-envolturas').count(), 0);

/* ================================================================
   3. Envolver una función que no existe queda apuntado como fallo,
   no revienta la carga.
   ================================================================ */
console.log('--- 3. envolver algo que no existe no revienta ---');

await comprobar('no revienta y se apunta como fallo', pagina.evaluate(() => {
  var antes = window.U.envolturasFallidas().length;
  var reventado = false;
  try {
    window.U.envolver('Cosa.inventada', {}, 'inventada', 'js/no-existe.js', function (comoEra) { return comoEra; });
  } catch (e) { reventado = true; }
  var despues = window.U.envolturasFallidas();
  return { reventado: reventado, subioEnUno: despues.length === antes + 1, ultima: despues[despues.length - 1] };
}), { reventado: false, subioEnUno: true, ultima: { etiqueta: 'Cosa.inventada', fichero: 'js/no-existe.js' } });

/* ================================================================
   4. La cuenta de js/envolturas-esperadas.js coincide con los
   U.envolver que hay de verdad en js/. La más útil de las cuatro:
   salta sola si alguien añade una envoltura y se olvida de apuntarla.
   ================================================================ */
console.log('--- 4. la lista coincide con los U.envolver que hay en js/ ---');

const ficheros = fs.readdirSync(new URL('../js/', import.meta.url))
  .filter(function (n) { return n.endsWith('.js') && n !== 'envolturas-esperadas.js'; });
let enElCodigo = 0;
ficheros.forEach(function (n) {
  const texto = fs.readFileSync(new URL('../js/' + n, import.meta.url), 'utf8');
  const m = texto.match(/U\.envolver\(/g);
  enElCodigo += m ? m.length : 0;
});
const listaEsperada = await pagina.evaluate(() => window.EnvolturasEsperadas.LISTA.length);
comprobarSincrono('el número de U.envolver(...) en js/ coincide con LISTA', listaEsperada, enElCodigo);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
