/* Fila 647 (17-nov-2026): la ventana de Windows para elegir un archivo (registrar un documento
   y «Traer datos») recibe en `startIn` la carpeta de verdad, no la envuelta (fechas de Drive o
   «solo consultar»): con la envuelta el navegador la rechaza. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.waitForFunction(() => window.Carpetas && window.FechasOrigen && window.SoloConsulta && window.TraerDatos && window.U);

let fallos = 0;
function comprobarQue(t, c, d) { if (!c) { fallos++; console.log('FALLA  ' + t + (d ? '\n   ' + d : '')); } else console.log('bien   ' + t); }

const r = await pagina.evaluate(async () => {
  const avisos = [];
  U.aviso = (t, tipo) => avisos.push(tipo + ':' + t);
  const sal = {};
  const verdadera = { kind: 'directory', name: 'asunto', entries() {}, getFileHandle() {} };
  const fichero = { kind: 'file', name: 'x.pdf' };
  let llamadas = [];
  // como el navegador: rechaza todo lo que no sea la carpeta de verdad
  window.showOpenFilePicker = async o => {
    llamadas.push(o.startIn === verdadera);
    if (o.startIn && o.startIn !== verdadera) throw new TypeError("'[object FileSystemDirectoryHandle]' is not a valid enum value of type WellKnownDirectory.");
    return [fichero];
  };
  // (a) envuelta por las fechas de Drive
  FechasOrigen.fijar({ 'x.pdf': { c: 1, f: 1 } });
  const envuelta = FechasOrigen.envolver(verdadera, '');
  sal.distinta = envuelta !== verdadera;
  sal.a = { h: (await Carpetas.elegirFichero(envuelta)) === fichero, llamadas: llamadas.slice(), avisos: avisos.slice() };
  // (b) envuelta además por «solo consultar»
  llamadas = []; avisos.length = 0;
  SoloConsulta.guardar(true);
  const doble = SoloConsulta.proteger(envuelta);
  sal.dobleDistinta = doble !== envuelta;
  sal.b = { h: (await Carpetas.elegirFichero(doble)) === fichero, llamadas: llamadas.slice(), avisos: avisos.slice() };
  // (c) «Traer datos»
  llamadas = []; avisos.length = 0;
  App.E.datos = doble;
  // el cuadro se cierra sin elegir (si no, «Traer datos» pregunta qué es el fichero y espera)
  window.showOpenFilePicker = async o => { llamadas.push(o.startIn === verdadera); const e = new Error('x'); e.name = 'AbortError'; throw e; };
  await TraerDatos.traer();
  sal.c = { llamadas: llamadas.slice() };
  SoloConsulta.guardar(false);
  return sal;
});

comprobarQue('la carpeta de la prueba va de verdad envuelta', r.distinta && r.dobleDistinta, JSON.stringify(r));
comprobarQue('(a) registrar con la carpeta envuelta por las fechas: una sola llamada, con la carpeta de verdad y sin aviso',
  r.a.h && JSON.stringify(r.a.llamadas) === '[true]' && r.a.avisos.length === 0, JSON.stringify(r.a));
comprobarQue('(b) lo mismo con «solo consultar»',
  r.b.h && JSON.stringify(r.b.llamadas) === '[true]' && r.b.avisos.length === 0, JSON.stringify(r.b));
comprobarQue('(c) «Traer datos» pide la ventana con la carpeta de verdad', JSON.stringify(r.c.llamadas) === '[true]', JSON.stringify(r.c));

await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('todo bien');
