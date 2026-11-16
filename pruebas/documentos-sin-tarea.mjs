/* Fila 680 (16-nov-2026, docs/680-DOCUMENTOS-SIN-HITO-NI-TAREA.md): el hito y la tarea de un documento son opcionales, por ahora.
   Con Chromium real y la copia de pruebas (?demo=1&auto=1&latido=hoy: dos sueltos de la bandeja, la matrícula de Pablo con hitos y el
   asunto «PEDIDO Imprenta Sol», sin hitos). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&latido=hoy';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Bandeja && BandejaNucleo.correos() && BandejaNucleo.correos().length >= 3 && App.E.sueltos.length >= 3, null, { timeout: 60000 });
await pagina.waitForTimeout(2000);

const PABLO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /MATRICULA Aguilar Ponce, Pablo/.test(x))[0]);
const PEDIDO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /PEDIDO Imprenta Sol/.test(x))[0]);

const avisos = () => pagina.evaluate(() => window.__av);
await pagina.evaluate(() => { window.__av = []; const o = U.aviso; U.aviso = function (t) { window.__av.push(t); return o.apply(this, arguments); }; });

async function abrirSuelto(nombre, asunto) {
  await pagina.evaluate(([n, a]) => {
    const s = App.E.sueltos.filter((x) => x.nombre === n)[0];
    window.__p = App.meterSueltoEnAsuntoElegido(s, { nombre: a, ficha: App.E.registro.asuntos[a] });
  }, [nombre, asunto]);
  await pagina.waitForSelector('#doc-tarea-bloque h4', { timeout: 15000 });
  await pagina.waitForTimeout(300);
}
const bloque = () => pagina.evaluate(() => document.querySelector('#doc-tarea-bloque').innerText.replace(/\n+/g, ' | '));
const enAbiertos = (n) => pagina.evaluate(async (n) => { try { await App.E.abiertos.getFileHandle(n); return true; } catch (e) { return false; } }, n);
const enCarpeta = (asunto, patron) => pagina.evaluate(async ([a, p]) => {
  const d = await App.E.abiertos.getDirectoryHandle(a);
  return (await Carpetas.ficheros(d)).map((f) => f.nombre).filter((x) => new RegExp(p).test(x));
}, [asunto, patron]).then((l) => l.map((x) => x.replace(/^\d{6} /, 'FECHA ').replace(/D26-\d{5}/, 'D26-N')));
const tareas = (asunto) => pagina.evaluate(async (n) => {
  const a = { nombre: n, ficha: App.E.registro.asuntos[n], leido: Nombres.leer(n, App.E.tipos) };
  return (await Hitos.hitosDe(n)).map((h) => Hitos.guionDe(a, h).map((g) => (g.hecho ? '[x] ' : '[ ] ') + g.texto));
}, asunto);

console.log('--- 1. un suelto de la bandeja, en un asunto con hitos, sin hito ni tarea ---');
await abrirSuelto('justificante.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.waitForTimeout(300);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('1. entra en la carpeta y sale de la bandeja, sin aviso rojo', Promise.all([enAbiertos('justificante.pdf'), enCarpeta(PABLO, 'FACTURA D26-000(1[0-9]|2[0-9])'),
  avisos().then((l) => l.filter((t) => /Elige|Añade antes/.test(t)))]), [false, ['FECHA FACTURA D26-N.pdf'], []]);
await comprobar('1. no cuelga de ninguna tarea (queda «sin tarea»)', pagina.evaluate(async ([n, a]) => {
  const ap = { nombre: n, ficha: App.E.registro.asuntos[n] };
  return DocumentoATarea.sinTarea(await Hitos.hitosDe(n), (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(n))).map((f) => f.nombre).filter((x) => /FACTURA/.test(x))[0]);
}, [PABLO, 0]), true);

console.log('--- 2. un suelto de la bandeja, en un asunto sin hitos ---');
await abrirSuelto('solicitud escaneada.pdf', PEDIDO);
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.waitForTimeout(300);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('2. entra en la carpeta del asunto sin hitos, sin aviso rojo', Promise.all([enAbiertos('solicitud escaneada.pdf'), enCarpeta(PEDIDO, 'FACTURA'),
  avisos().then((l) => l.filter((t) => /Elige|Añade antes|crea antes/.test(t)))]), [false, ['FECHA FACTURA D26-N.pdf'], []]);

console.log('--- 3. «Añadir documento»: preguntar() ---');
await comprobar('3. sin hitos no pregunta y devuelve «sin tarea»', pagina.evaluate(async (n) => {
  const a = { nombre: n, ficha: App.E.registro.asuntos[n] };
  return DocumentoATarea.preguntar(a, { nombre: 'x.pdf', tipo: 'FACTURA', colgar: false });
}, PEDIDO), { sinTarea: true, hitoId: '', tareaId: null });
await comprobar('3. con hitos, «Sin tarea» es la primera opción y devuelve «sin tarea»', (async () => {
  pagina.evaluate((n) => { window.__r = DocumentoATarea.preguntar({ nombre: n, ficha: App.E.registro.asuntos[n] }, { nombre: 'x.pdf', tipo: 'FACTURA', colgar: false }); }, PABLO);
  await pagina.waitForSelector('.pt-capa .pt-op');
  const primera = await pagina.evaluate(() => document.querySelector('.pt-op').innerText.split('\n')[0]);
  await pagina.click('.pt-sin');
  await pagina.click('#pt-ok');
  const r = await pagina.evaluate(() => window.__r);
  return [primera, !!r.sinTarea, r.tareaId];
})(), ['Sin tarea', true, null]);
await comprobar('3. al colgar, «Sin tarea» no se ofrece', (async () => {
  pagina.evaluate((n) => { window.__r = DocumentoATarea.preguntar({ nombre: n, ficha: App.E.registro.asuntos[n] }, { nombre: 'x.pdf', tipo: 'FACTURA', colgar: true }); }, PABLO);
  await pagina.waitForSelector('.pt-capa .pt-op');
  const n = await pagina.locator('.pt-sin').count();
  await pagina.click('#pt-cancelar');
  return [n, await pagina.evaluate(() => window.__r)];
})(), [0, null]);

console.log('--- 4. elegirPaso con el documento de otra tarea ---');
await comprobar('4. sin ninguna libre, devuelve la primera «Registrar»', pagina.evaluate(() => {
  const h = { guionDocumento: { a: { doc: 'uno.pdf' }, b: { doc: 'dos.pdf' } } };
  const r = TareasConDocumento.elegirPaso(h, [{ id: 'a' }, { id: 'b' }], 'registrar', 'otro.pdf');
  return r && r.id;
}), 'a');

console.log(errores.length ? 'ERRORES EN LA CONSOLA:\n' + errores.join('\n') : 'bien   sin errores en la consola');
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallo(s).' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
