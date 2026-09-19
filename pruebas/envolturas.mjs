/* Prueba de la fila 70 (19-sep-2026, docs/ENVOLTURAS-COMPROBADAS.md):
   la alarma de las envolturas que faltan por aplicar.

   No hace falta "entrar" (elegir carpetas): U.envolver se llama al
   CARGAR cada fichero, no al usar la aplicación, así que la
   comprobación ya está hecha en cuanto la página termina de cargar
   los 108 <script>, antes de que nadie toque nada.

   Sin disco de mentira: esta prueba no toca carpetas ni ficheros, solo
   mira lo que ha apuntado U.envolver al cargar la página de verdad. */
import { chromium } from 'playwright';
import fs from 'fs';
import { fileURLToPath } from 'node:url';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.waitForFunction(() => window.EnvolturasEsperadas && window.U);

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, real) {
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

/* ============================================================
   1. Al arrancar, las envolturas esperadas están todas aplicadas y
      no sale ningún aviso.
   ============================================================ */
console.log('--- al arrancar ---');

const r1 = await pagina.evaluate(() => window.EnvolturasEsperadas.comprobar());
comprobar('no falta ninguna envoltura esperada', r1.faltan, []);
comprobarQue('hay al menos 40 envolturas aplicadas (la lista completa)', r1.aplicadas.length >= 40);

const ocultoAlEmpezar = await pagina.evaluate(() =>
  document.getElementById('aviso-envolturas').classList.contains('oculto'));
comprobarQue('el aviso rojo de la pantalla de entrada está oculto', ocultoAlEmpezar);

/* ============================================================
   2. Si se quita a mano una de la lista de aplicadas, sale el aviso
      rojo y dice cuál falta. Se finge quitando la respuesta de
      U.envolturasAplicadas (sin tocar el registro de verdad, para no
      desmontar el resto de la aplicación) y se vuelve a llamar a
      EnvolturasEsperadas.avisar().
   ============================================================ */
console.log('\n--- si falta una ---');

const r2 = await pagina.evaluate(() => {
  const original = window.U.envolturasAplicadas;
  const unaCualquiera = window.EnvolturasEsperadas.LISTA[0];
  window.U.envolturasAplicadas = function () {
    return original().filter(function (a) {
      return !(a.fichero === unaCualquiera.fichero && a.nombre === unaCualquiera.nombre);
    });
  };
  window.EnvolturasEsperadas.avisar();
  const caja = document.getElementById('aviso-envolturas');
  const salida = {
    visible: !caja.classList.contains('oculto'),
    dice: caja.textContent.indexOf(unaCualquiera.fichero) !== -1 &&
          caja.textContent.indexOf(unaCualquiera.nombre) !== -1
  };
  /* se deja como estaba, para no estropear el resto de la prueba */
  window.U.envolturasAplicadas = original;
  window.EnvolturasEsperadas.avisar();
  return salida;
});
comprobarQue('el aviso rojo aparece', r2.visible);
comprobarQue('dice el fichero y el nombre de la que falta', r2.dice);

const ocultoOtraVez = await pagina.evaluate(() =>
  document.getElementById('aviso-envolturas').classList.contains('oculto'));
comprobarQue('y se vuelve a ocultar al restaurar', ocultoOtraVez);

/* ============================================================
   3. Envolver una función que no existe queda apuntado como fallo,
      no revienta la carga.
   ============================================================ */
console.log('\n--- envolver algo que no existe ---');

const r3 = await pagina.evaluate(() => {
  const antesFallidas = window.U.envolturasFallidas().length;
  let lanzo = false;
  let resultado;
  try {
    resultado = window.U.envolver({}, 'App.noExisteDeVerdad', 'prueba-envolturas.js', function (comoEra) {
      return function () { return comoEra(); };
    });
  } catch (e) { lanzo = true; }
  const despuesFallidas = window.U.envolturasFallidas();
  return {
    lanzo: lanzo,
    devolvioUndefined: resultado === undefined,
    seApunto: despuesFallidas.length === antesFallidas + 1,
    laUltima: despuesFallidas[despuesFallidas.length - 1]
  };
});
comprobarQue('no lanza ninguna excepción', !r3.lanzo);
comprobarQue('no devuelve ninguna función', r3.devolvioUndefined);
comprobarQue('queda una fallida más', r3.seApunto);
comprobar('con el fichero y el nombre correctos', r3.laUltima && { fichero: r3.laUltima.fichero, nombre: r3.laUltima.nombre },
  { fichero: 'prueba-envolturas.js', nombre: 'App.noExisteDeVerdad' });

/* La aplicación sigue viva después de esto: se puede seguir usando. */
comprobarQue('la aplicación sigue respondiendo después del fallo',
  await pagina.evaluate(() => typeof App.ir === 'function'));

/* ============================================================
   4. La cuenta de envolturas-esperadas.js coincide con los
      U.envolver que hay en js/. Esta es la más útil de las cuatro:
      salta sola cuando alguien añade una envoltura y se olvida de
      apuntarla. Comprobación de fuente, sin navegador.
   ============================================================ */
console.log('\n--- la lista coincide con el código ---');

const raiz = fileURLToPath(new URL('../js/', import.meta.url));
const ficheros = fs.readdirSync(raiz).filter(function (f) { return f.endsWith('.js') && f !== 'util.js'; });
let sitiosDeVerdad = 0;
const enElCodigoNoEnLaLista = [];
const listaDeVerdad = await pagina.evaluate(() => window.EnvolturasEsperadas.LISTA);
const enLaListaClave = {};
listaDeVerdad.forEach(function (e) { enLaListaClave[e.fichero + ' :: ' + e.nombre] = true; });

ficheros.forEach(function (f) {
  const texto = fs.readFileSync(raiz + f, 'utf8');
  const re = /U\.envolver\(\s*[^,]+,\s*'([^']+)'\s*,\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(texto))) {
    sitiosDeVerdad++;
    const nombre = m[1];
    const fichero = m[2];
    if (!enLaListaClave[fichero + ' :: ' + nombre]) {
      enElCodigoNoEnLaLista.push(fichero + ' → ' + nombre);
    }
  }
});

comprobar('el número de U.envolver(...) en js/ coincide con la lista', sitiosDeVerdad, listaDeVerdad.length);
comprobar('y no hay ninguna en el código que falte en la lista', enElCodigoNoEnLaLista, []);

if (errores.length) { fallos++; console.log('\nERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
