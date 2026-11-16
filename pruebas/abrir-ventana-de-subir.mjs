/* Fila 678 (16-nov-2026): al subir un documento la ventana de Windows tiene que abrirse
   siempre o avisar; nunca silencio. Prueba la función Carpetas.elegirFichero (reintento
   sin carpeta de inicio + aviso) y que Documentos.abrir con irDirectoAAnadir pide la
   ventana en la misma pulsación, antes de leer la carpeta. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.waitForFunction(() => window.Carpetas && window.Documentos && window.U);

let fallos = 0;
function comprobarQue(t, c, d) { if (!c) { fallos++; console.log('FALLA  ' + t + (d ? '\n   ' + d : '')); } else console.log('bien   ' + t); }

const r = await pagina.evaluate(async () => {
  const avisos = [];
  U.aviso = (t, tipo) => avisos.push(tipo + ':' + t);
  const sal = {};
  const carpeta = { kind: 'directory', name: 'asunto' };
  const fichero = { kind: 'file', name: 'x.pdf' };
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  // (a) falla con startIn (no es cancelar): se repite sin startIn y avisa
  let llamadas = [];
  window.showOpenFilePicker = async o => { llamadas.push(!!o.startIn); if (o.startIn) { const e = new Error('no'); e.name = 'NotAllowedError'; throw e; } return [fichero]; };
  sal.a = { h: (await Carpetas.elegirFichero(carpeta)) === fichero, llamadas, avisos: avisos.slice() };
  // (a2) cancelar muy deprisa con startIn = no se abrió: también se repite
  avisos.length = 0; llamadas = [];
  window.showOpenFilePicker = async o => { llamadas.push(!!o.startIn); if (o.startIn) { const e = new Error('x'); e.name = 'AbortError'; throw e; } return [fichero]; };
  sal.a2 = { h: (await Carpetas.elegirFichero(carpeta)) === fichero, llamadas, avisos: avisos.slice() };
  // (b) cancelar de verdad (tarda): sigue sin avisar y lanza AbortError
  avisos.length = 0; llamadas = [];
  window.showOpenFilePicker = async o => { llamadas.push(!!o.startIn); await esperar(450); const e = new Error('x'); e.name = 'AbortError'; throw e; };
  try { await Carpetas.elegirFichero(carpeta); sal.b = { lanza: false }; } catch (e) { sal.b = { lanza: e.name, llamadas, avisos: avisos.slice() }; }
  // (c) si falla igual sin startIn, lanza ese error
  avisos.length = 0;
  window.showOpenFilePicker = async () => { const e = new Error('roto'); e.name = 'SecurityError'; throw e; };
  try { await Carpetas.elegirFichero(carpeta); sal.c = { lanza: false }; } catch (e) { sal.c = { lanza: e.name }; }
  // (d) Documentos.abrir pide la ventana en la misma pulsación
  avisos.length = 0;
  let pedida = 0, conInicio = 0;
  window.showOpenFilePicker = async o => { pedida++; if (o && o.startIn) conInicio++; const e = new Error('bloqueado'); e.name = 'NotAllowedError'; throw e; };
  const p = Documentos.abrir({ nombre: 'Prueba', handle: window.__disco.abiertos }, { irDirectoAAnadir: true }).catch(() => {});
  sal.d = { pedidaAlMomento: pedida };
  await Promise.race([p, esperar(1500)]);
  sal.d.avisos = avisos.slice();
  sal.d.conInicio = conInicio;
  return sal;
});

comprobarQue('(a) con carpeta de inicio que falla: se repite sin ella y se avisa',
  r.a.h && JSON.stringify(r.a.llamadas) === '[true,false]' && r.a.avisos.length === 1 && /No he podido abrir la carpeta del asunto; elige el archivo\./.test(r.a.avisos[0]), JSON.stringify(r.a));
comprobarQue('(a2) cancelar en menos de 300 ms cuenta como no abierta', r.a2.h && JSON.stringify(r.a2.llamadas) === '[true,false]' && r.a2.avisos.length === 1, JSON.stringify(r.a2));
comprobarQue('(b) cancelar de verdad no avisa ni repite', r.b.lanza === 'AbortError' && JSON.stringify(r.b.llamadas) === '[true]' && r.b.avisos.length === 0, JSON.stringify(r.b));
comprobarQue('(c) si falla también sin carpeta, lanza el error', r.c.lanza === 'SecurityError', JSON.stringify(r.c));
comprobarQue('(d) abrir pide la ventana al momento', r.d.pedidaAlMomento === 1, JSON.stringify(r.d));
comprobarQue('(d) fila 686: la ventana se pide sin carpeta de inicio y sin aviso naranja', r.d.conInicio === 0 && !r.d.avisos.some(a => /^ambar:/.test(a)), JSON.stringify(r.d));
comprobarQue('(d) un error que no es cancelar sale en rojo con su nombre', r.d.avisos.some(a => /^malo:No he podido abrir ese fichero/.test(a)), JSON.stringify(r.d));

await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('todo bien');
