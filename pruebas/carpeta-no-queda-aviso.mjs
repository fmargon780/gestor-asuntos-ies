/* Prueba de la fila 609 (docs/609-AVISO-SI-LA-CARPETA-NO-QUEDA.md): en la pantalla
   de entrada, si al pulsar el botón de una carpeta esta no queda señalada, sale
   siempre un aviso en rojo con lo que dice Chrome (también «cancelado»); si queda
   señalada pero no se puede recordar, aviso ámbar y «Entrar» se enciende igual. */
import { chromium } from 'playwright';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.waitForFunction(() => window.App && App.pedirCarpeta && window.Carpetas && window.Almacen);

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Sustituye el cuadro de Chrome y el guardado; recoge los avisos. */
async function intento(elegir, guardar) {
  return pagina.evaluate(async ([elegir, guardar]) => {
    const avisos = [];
    const aviso0 = U.aviso, elegir0 = Carpetas.elegir, guardar0 = Almacen.guardar, warn0 = console.warn;
    U.aviso = (t, c) => { avisos.push([c || '', t]); };
    console.warn = () => {};
    Carpetas.elegir = async () => {
      if (elegir.error) { const e = new Error(elegir.mensaje); e.name = elegir.error; throw e; }
      return { name: 'CarpetaDePrueba', kind: 'directory' };
    };
    Almacen.guardar = async () => { if (guardar) { const e = new Error('IDB cerrada'); e.name = 'InvalidStateError'; throw e; } };
    App.E.abiertos = null;
    document.getElementById('btn-entrar').disabled = true;
    try { await App.pedirCarpeta('abiertos', 'gestor-abiertos', 'estado-abiertos'); }
    finally { U.aviso = aviso0; Carpetas.elegir = elegir0; Almacen.guardar = guardar0; console.warn = warn0; }
    return { avisos, puesta: !!App.E.abiertos };
  }, [elegir, guardar]);
}

let r = await intento({ error: 'AbortError', mensaje: 'The user aborted a request.' }, false);
comprobar('cancelado: un aviso rojo', r.avisos.length === 1 && r.avisos[0][0], 'malo');
comprobar('cancelado: dice lo de Chrome tal cual y el botón Soporte', r.avisos[0][1],
  'La carpeta no ha quedado señalada. Chrome dice: AbortError: The user aborted a request.. Si has cerrado el cuadro tú, no pasa nada; si no, manda este aviso con el botón «Soporte».');
comprobar('cancelado: no queda señalada', r.puesta, false);

r = await intento({ error: 'NotAllowedError', mensaje: 'Permission denied' }, false);
comprobar('otro fallo: aviso rojo', r.avisos.length === 1 && r.avisos[0][0], 'malo');
comprobar('otro fallo: lleva el texto de hoy y lo de Chrome', /^No he podido usar esa carpeta: .*Chrome dice: NotAllowedError: Permission denied$/.test(r.avisos[0][1]), true);

r = await intento({}, true);
comprobar('no se recuerda: un aviso ámbar', r.avisos.length === 1 && r.avisos[0][0], 'ambar');
comprobar('no se recuerda: dice lo de Chrome', r.avisos[0][1],
  'La carpeta está señalada, pero este navegador no la va a recordar. Chrome dice: InvalidStateError: IDB cerrada');
comprobar('no se recuerda: queda señalada', r.puesta, true);

r = await intento({}, false);
comprobar('todo bien: sin avisos y señalada', [r.avisos.length, r.puesta], [0, true]);

comprobar('sin errores de página', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
