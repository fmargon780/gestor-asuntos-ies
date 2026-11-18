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
  window.showOpenFilePicker = async o => { llamadas.push(o.startIn === verdadera); await new Promise(r => setTimeout(r, 400)); const e = new Error('x'); e.name = 'AbortError'; throw e; };   // cancelar de verdad tarda más de 300 ms
  await TraerDatos.traer();
  sal.c = { llamadas: llamadas.slice() };
  // (d) «Traer datos»: la carpeta se rechaza -> se repite sin carpeta, con aviso ámbar
  llamadas = []; avisos.length = 0;
  window.showOpenFilePicker = async o => {
    llamadas.push(!!o.startIn);
    if (o.startIn) throw new TypeError('carpeta rechazada');
    await new Promise(r => setTimeout(r, 400));
    const e = new Error('x'); e.name = 'AbortError'; throw e;   // y ahí cierra el cuadro: sin más avisos
  };
  await TraerDatos.traer();
  sal.d = { llamadas: llamadas.slice(), avisos: avisos.slice() };
  // (e) no se abre de ninguna forma -> aviso rojo
  llamadas = []; avisos.length = 0;
  window.showOpenFilePicker = async o => { llamadas.push(!!o.startIn); throw new TypeError('no hay ventana'); };
  await TraerDatos.traer();
  sal.e = { llamadas: llamadas.slice(), avisos: avisos.slice() };
  SoloConsulta.guardar(false);
  return sal;
});

comprobarQue('la carpeta de la prueba va de verdad envuelta', r.distinta && r.dobleDistinta, JSON.stringify(r));
comprobarQue('(a) registrar con la carpeta envuelta por las fechas: una sola llamada, con la carpeta de verdad y sin aviso',
  r.a.h && JSON.stringify(r.a.llamadas) === '[true]' && r.a.avisos.length === 0, JSON.stringify(r.a));
comprobarQue('(b) lo mismo con «solo consultar»',
  r.b.h && JSON.stringify(r.b.llamadas) === '[true]' && r.b.avisos.length === 0, JSON.stringify(r.b));
comprobarQue('(c) «Traer datos» pide la ventana con la carpeta de verdad', JSON.stringify(r.c.llamadas) === '[true]', JSON.stringify(r.c));

comprobarQue('(d) «Traer datos» con la carpeta rechazada: repite sin carpeta y avisa en ámbar',
  JSON.stringify(r.d.llamadas) === '[true,false]' && r.d.avisos.length === 1 && r.d.avisos[0].startsWith('ambar:No he podido abrir la carpeta'), JSON.stringify(r.d));
comprobarQue('(e) «Traer datos» sin poder abrir la ventana: aviso rojo con el motivo',
  JSON.stringify(r.e.llamadas) === '[true,false]' && r.e.avisos.length === 2 && r.e.avisos[1].startsWith('malo:No he podido abrir la ventana') , JSON.stringify(r.e));
await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('todo bien');
