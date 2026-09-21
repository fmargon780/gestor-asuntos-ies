/* Prueba en navegador de verdad de la fila 90
   (docs/ARCHIVAR-SIN-AVISOS-FALSOS.md): al archivar un asunto desde su
   propia ficha no deben salir avisos rojos sobrantes.

   1. Archivar desde la ficha abierta no da el aviso de "otro
      ordenador" (App.reengancharFicha, disparado por App.verAbiertos
      dentro de la propia App.cerrarAsunto, ya no confunde el archivado
      de este ordenador con uno ajeno).
   2. Si Dropbox está sincronizando la carpeta justo al escribir
      _ficha.json, Carpetas.escribirTexto reintenta sola y el archivado
      no da ningún aviso de más.
   3. Si los reintentos también fallan, el aviso es ámbar, en
      castellano y dice que no se ha perdido nada (nunca el
      InvalidStateError del navegador, en inglés), y la ficha sigue en
      asuntos.json.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, como
   pruebas/archivar-atascos.mjs: se parchea el manejador de la carpeta
   ARCHIVO para que la escritura de un fichero concreto, en cualquier
   carpeta de ahí para abajo, falle un número de veces antes de salir
   bien (ver hazQueFalleEnElArchivo, más abajo). */
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

/* Crea la carpeta del asunto en Abiertos y su ficha en asuntos.json
   (con categoria/tercero puestos, para que App.cerrarAsunto no tenga
   que preguntar "¿Dónde va esta carpeta?"), y la deja cargada en
   memoria como si se acabase de entrar. */
async function crearAsuntoAbierto(nombre, tercero) {
  await pagina.evaluate(async ([nombre, tercero]) => {
    await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    const actual = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json') || { asuntos: {} };
    actual.asuntos[nombre] = { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: tercero, estado: 'abierto', notas: [] };
    await window.Carpetas.guardarJson(window.App.E.gestor, 'asuntos.json', actual);
    await window.App.cargarRegistro();
  }, [nombre, tercero]);
}

/* Abre la ficha de 'nombre' desde la lista de Abiertos (clic de verdad,
   igual que Francisco), pulsa "Archivar el asunto" y acepta el cuadro
   de confirmación. Espera al aviso verde: el archivado en sí (mover la
   carpeta) siempre sale antes que el intento de escribir _ficha.json,
   así que este aviso llega mucho antes de que los reintentos (hasta
   3,5 s de esperas reales) hayan podido terminar. */
async function archivarDesdeLaFicha(nombre) {
  await pagina.click('#btn-recargar');
  await pagina.waitForSelector('#lista-abiertos .tarjeta');
  await pagina.click(`#lista-abiertos .tarjeta:has-text("${nombre}") .nombre-pulsable`);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('button:has-text("Archivar el asunto")');
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('.mensaje.bueno');
}

/* Hace que, dentro del árbol de `window.__disco.archivo` (nunca en
   Abiertos), crear un fichero llamado `nombreFichero` (la primera vez
   que `getFileHandle(..., {create:true})` lo trae a la vida) falle
   `fallos` veces con InvalidStateError antes de escribir de verdad.

   No basta con cambiar `window.__disco.fich`: `dir.getFileHandle` de
   pruebas/navegador.mjs llama a la función `fich` de su propio cierre,
   no a esa propiedad (que solo existe para que otras pruebas puedan
   fabricar ficheros sueltos a mano). Aquí se parchea el propio
   manejador de la carpeta ARCHIVO, en cascada: cada carpeta que se
   obtenga de ahí para abajo (la categoría, el tercero, el asunto ya
   archivado) queda igual de vigilada, así no hace falta saber de
   antemano qué carpetas va a crear el archivado de verdad. Cada
   reintento de Carpetas.escribirTexto vuelve a pedir el manejador del
   fichero, pero como ya existe tras el primer intento, siempre es el
   MISMO objeto (con el mismo contador), igual que en el disco de
   verdad. */
async function hazQueFalleEnElArchivo(nombreFichero, fallos) {
  await pagina.evaluate(([nombreFichero, fallos]) => {
    let quedan = fallos;
    function vigilar(dirHandle) {
      const getDirDeVerdad = dirHandle.getDirectoryHandle.bind(dirHandle);
      dirHandle.getDirectoryHandle = async function (n, o) {
        return vigilar(await getDirDeVerdad(n, o));
      };
      const getFileDeVerdad = dirHandle.getFileHandle.bind(dirHandle);
      dirHandle.getFileHandle = async function (n, o) {
        const h = await getFileDeVerdad(n, o);
        if (n === nombreFichero) {
          const escribirDeVerdad = h.createWritable.bind(h);
          h.createWritable = async function () {
            if (quedan > 0) {
              quedan--;
              const e = new Error('Dropbox está sincronizando');
              e.name = 'InvalidStateError';
              throw e;
            }
            return escribirDeVerdad();
          };
        }
        return h;
      };
      return dirHandle;
    }
    vigilar(window.__disco.archivo);
  }, [nombreFichero, fallos]);
}

/* Los avisos de un escenario anterior tardan hasta 4,5 s (9 s los
   rojos) en quitarse solos: se borran a mano entre escenarios para que
   cada uno compruebe solo los suyos. */
function limpiarAvisos() {
  return pagina.evaluate(() => document.querySelectorAll('.mensaje').forEach((m) => m.remove()));
}

console.log('--- 1. archivar desde la ficha abierta: sin el aviso de "otro ordenador" ---');
const NOMBRE1 = '260921 MATRICULA 26-27 Noventa Uno, Ana 1112223';
await crearAsuntoAbierto(NOMBRE1, 'Noventa Uno, Ana 1112223');
await archivarDesdeLaFicha(NOMBRE1);

await comprobar('1. avisa en verde de que se ha archivado',
  pagina.locator('.mensaje.bueno').filter({ hasText: 'Asunto archivado.' }).count(), 1);
await comprobar('1. no sale el aviso de "otro ordenador" (era un falso positivo: lo ha archivado este mismo)',
  pagina.locator('.mensaje.malo').filter({ hasText: 'otro ordenador' }).count(), 0);
await comprobar('1. no queda ningún otro aviso rojo',
  pagina.locator('.mensaje.malo').count(), 0);
await comprobar('1. ha vuelto a la lista de abiertos',
  pagina.evaluate(() => document.getElementById('pantalla-asunto').classList.contains('oculto')), true);

await limpiarAvisos();
console.log('--- 2. Dropbox sincronizando dos veces y a la tercera sale bien: sin ningún aviso de más ---');
const NOMBRE2 = '260921 MATRICULA 26-27 Noventa Dos, Ana 1112224';
await crearAsuntoAbierto(NOMBRE2, 'Noventa Dos, Ana 1112224');
await hazQueFalleEnElArchivo('_ficha.json', 2);
await archivarDesdeLaFicha(NOMBRE2);
/* Dos fallos reintentados de verdad esperan 0,5 s y 1 s antes de salir
   bien: se deja tiempo de sobra para que el tercer intento termine. */
await pagina.waitForTimeout(2200);

await comprobar('2. avisa en verde de que se ha archivado, sin más avisos',
  pagina.locator('.mensaje.bueno').filter({ hasText: 'Asunto archivado.' }).count(), 1);
await comprobar('2. ningún aviso ámbar ni rojo sobre la ficha',
  pagina.locator('.mensaje.ambar, .mensaje.malo').count(), 0);
await comprobar('2. _ficha.json ha llegado a escribirse de verdad, tras los reintentos',
  pagina.evaluate(async (tercero) => {
    const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
    const ter = await cat.getDirectoryHandle(tercero);
    const asunto = await ter.getDirectoryHandle('260921 MATRICULA 26-27 Noventa Dos, Ana 1112224');
    const f = await window.FichaArchivo.leer(asunto);
    return f && f.estado;
  }, 'Noventa Dos, Ana 1112224'), 'cerrado');

await limpiarAvisos();
console.log('--- 3. Dropbox sincronizando todo el rato: aviso ámbar, en castellano, y no se pierde la ficha ---');
const NOMBRE3 = '260921 MATRICULA 26-27 Noventa Tres, Ana 1112225';
await crearAsuntoAbierto(NOMBRE3, 'Noventa Tres, Ana 1112225');
await hazQueFalleEnElArchivo('_ficha.json', 99);
await archivarDesdeLaFicha(NOMBRE3);

await comprobar('3. avisa en verde de que el asunto se ha archivado (eso sí ha salido bien)',
  pagina.locator('.mensaje.bueno').filter({ hasText: 'Asunto archivado.' }).count(), 1);

/* Los tres reintentos (0,5 s + 1 s + 2 s) tardan hasta 3,5 s reales en
   agotarse antes de que salga el aviso ámbar: se espera a que salga,
   en vez de una pausa fija que podría no bastar. */
await pagina.waitForSelector('.mensaje.ambar', { timeout: 8000 });
await comprobar('3. avisa en ámbar, en castellano, de que la ficha no se ha guardado todavía',
  pagina.locator('.mensaje.ambar').filter({
    hasText: 'Su ficha no se ha podido guardar todavía dentro de la carpeta porque Dropbox la estaba sincronizando'
  }).count(), 1);
await comprobar('3. el aviso dice que no se ha perdido nada',
  pagina.locator('.mensaje.ambar').filter({ hasText: 'No se ha perdido nada' }).count(), 1);
await comprobar('3. ningún aviso en inglés (InvalidStateError) ni ningún aviso rojo',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.mensaje')).some(
    (m) => /InvalidStateError|state had changed/i.test(m.textContent))), false);
await comprobar('3. no sale ningún aviso rojo',
  pagina.locator('.mensaje.malo').count(), 0);
await comprobar('3. la ficha no se ha perdido: sigue en asuntos.json, con el estado cerrado',
  pagina.evaluate(async (nombre) => {
    const registro = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json');
    const f = registro.asuntos[nombre];
    return f && f.estado;
  }, NOMBRE3), 'cerrado');
await comprobar('3. y no hay _ficha.json (la escritura ha fallado de verdad)',
  pagina.evaluate(async (tercero) => {
    const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
    const ter = await cat.getDirectoryHandle(tercero);
    const asunto = await ter.getDirectoryHandle('260921 MATRICULA 26-27 Noventa Tres, Ana 1112225');
    return await window.FichaArchivo.leer(asunto);
  }, 'Noventa Tres, Ana 1112225'), null);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
