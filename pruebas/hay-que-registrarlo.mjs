/* Fila 670 (14-nov-2026, docs/667-HAY-QUE-REGISTRARLO.md; tema 667): la casilla «Hay que registrarlo» crea (o usa) la tarea «Registrar».

   Con Chromium real y los datos de la copia de pruebas (?demo=1&auto=1&latido=hoy: la matrícula de Pablo con tareas de «Añadir documento»
   y «Registrar», y el asunto «PEDIDO Imprenta Sol», sin hitos).

   1. El cuadro (bandeja): sale «Hay que registrarlo», no «Pendiente de registro», y se oculta al marcar «Está registrado en Séneca».
   2. Guardar desde la bandeja con la casilla: tarea «Registrar» nueva en el hito elegido, con el documento colgado y sin hacer; «Sin registrar».
   3. Un hito con una tarea «Registrar» que espera ese tipo: no se crea otra; el documento cuelga de la que había.
   4. Escribir el número a mano: la tarea «Registrar» queda hecha.
   5. Un cuadro abierto sin hito: «Hito» con «+ Añadir hito»; sin elegirlo no guarda y lo dice.
   6. Las marcas antiguas pasan solas a tareas «Registrar»; las de un documento ya registrado, sin tarea.
   7. Los avisos de lo que falta salen de esas tareas. */
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
/* Las tareas «Registrar» de un asunto: [{ hito, texto, hecho, doc, tipo }]. */
const registrar = (asunto) => pagina.evaluate(async (n) => {
  const a = { nombre: n, ficha: App.E.registro.asuntos[n], leido: Nombres.leer(n, App.E.tipos) };
  const salida = [];
  (await Hitos.hitosDe(n)).forEach((h, i) => Hitos.guionDe(a, h).forEach((g) => {
    if (g.accion !== 'registrar') return;
    const e = TareasConDocumento.de(h, g.id);
    salida.push({ hito: i + 1, texto: g.texto, hecho: !!g.hecho, doc: ((e && e.doc) || '').replace(/^\d{6} /, 'FECHA ').replace(/D26-\d{5}/, 'D26-N'), tipo: g.tipoDocumento || '' });
  }));
  return salida;
}, asunto);
const sinRegistrar = (asunto, patron) => pagina.evaluate(async ([n, p]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const d = await App.E.abiertos.getDirectoryHandle(n);
  const hs = await Hitos.hitosDe(n);
  return (await Carpetas.ficheros(d)).map((f) => f.nombre).filter((x) => new RegExp(p).test(x)).map((x) => AvisosFalta.sinRegistrar(a, hs, x));
}, [asunto, patron]);

console.log('--- 1. el cuadro ---');
await abrirSuelto('justificante.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'JUSTIFICANTE');
await pagina.waitForTimeout(300);
await comprobar('1. sale «Hay que registrarlo» y ninguna pantalla dice «Pendiente de registro»; en la bandeja no sale el desplegable «Hito» propio',
  pagina.evaluate(() => [document.querySelector('#doc-fila-hay-que-registrar').innerText.trim(), document.querySelector('#doc-hay-que-registrar').checked,
    document.body.innerText.indexOf('Pendiente de registro'), !!document.querySelector('#doc-registrar-hito')]), ['Hay que registrarlo', false, -1, false]);
await pagina.check('#doc-hay-registro');
await comprobar('1. al marcar «Está registrado en Séneca» se oculta', pagina.evaluate(() => document.querySelector('#doc-fila-hay-que-registrar').classList.contains('oculto')), true);
await pagina.uncheck('#doc-hay-registro');
await comprobar('1. y al desmarcarlo vuelve', pagina.evaluate(() => document.querySelector('#doc-fila-hay-que-registrar').classList.contains('oculto')), false);

console.log('--- 2. guardar con «Hay que registrarlo» ---');
const antes = await registrar(PABLO);
await pagina.check('#doc-hay-que-registrar');
await comprobar('2. marcarla no crea nada hasta «Guardar»', registrar(PABLO), antes);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3500);
await comprobar('2. aparece en ese hito la tarea «Registrar», sin hacer, con el documento colgado',
  registrar(PABLO).then((l) => l.filter((x) => x.doc.indexOf('JUSTIFICANTE') !== -1)),
  [{ hito: 2, texto: 'Registrar', hecho: false, doc: 'FECHA JUSTIFICANTE D26-N.pdf', tipo: 'JUSTIFICANTE' }]);
await comprobar('2. y el documento sale «Sin registrar»', sinRegistrar(PABLO, 'JUSTIFICANTE D26-000(1[0-9]|2[0-9])'), [true]);

console.log('--- 3. un hito con una tarea «Registrar» que espera ese tipo ---');
await pagina.evaluate(async (n) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const h = (await Hitos.hitosDe(n))[2];
  await Hitos.anadirGuionPropio(n, h.id, 'Registrar la factura', { accion: 'registrar', tipoDocumento: 'FACTURA' });
}, PABLO);
const antes3 = (await registrar(PABLO)).length;
await abrirSuelto('escaneo_0012.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.selectOption('#dtb-hito', { index: 3 });
await pagina.waitForTimeout(200);
await pagina.check('#doc-tarea-bloque input[value="nueva"]');
await pagina.check('#doc-hay-que-registrar');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3500);
const despues3 = await registrar(PABLO);
await comprobar('3. no se crea otra tarea «Registrar»: el documento cuelga de la que esperaba la factura',
  [despues3.length, despues3.filter((x) => x.texto === 'Registrar la factura').map((x) => [x.hecho, x.doc])], [antes3, [[false, 'FECHA FACTURA D26-N.pdf']]]);

console.log('--- 4. el número escrito a mano ---');
await abrirSuelto('solicitud escaneada.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.selectOption('#dtb-hito', { index: 3 });
await pagina.waitForTimeout(200);
await pagina.check('#doc-tarea-bloque input[value="nueva"]');
await pagina.check('#doc-hay-registro');
await pagina.fill('#doc-numero', '1234');
await pagina.waitForTimeout(200);
await pagina.evaluate(async (n) => {
  const h = (await Hitos.hitosDe(n))[2];
  await Hitos.anadirGuionPropio(n, h.id, 'Registrar la solicitud', { accion: 'registrar' });
}, PABLO);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3500);
await comprobar('4. la tarea «Registrar» sin documento del hito queda hecha al guardar con el número', registrar(PABLO).then((l) => l.filter((x) => x.texto === 'Registrar la solicitud').map((x) => x.hecho)), [true]);

console.log('--- 5. un cuadro abierto sin hito ---');
await pagina.evaluate(async ([n]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const d = await App.E.abiertos.getDirectoryHandle(n);
  await Carpetas.escribirBytes(d, '261114 FACTURA suelta.pdf', new Uint8Array([37, 80, 68, 70]), 'application/pdf');
  window.__abierto = App.verDocumentos(a, { ponerNombre: '261114 FACTURA suelta.pdf' });
}, [PEDIDO]);
await pagina.waitForSelector('#doc-vista', { timeout: 15000 });
await pagina.waitForTimeout(500);
await comprobar('5. sin hito, al marcar la casilla sale «Hito» con «+ Añadir hito»', (async () => {
  await pagina.check('#doc-hay-que-registrar');
  return pagina.evaluate(() => { const c = document.querySelector('#doc-registrar-hito'); return [!c.classList.contains('oculto'), c.innerText.replace(/\n+/g, ' | ')]; });
})(), [true, 'Hito | No hay hitos | + Añadir hito | La tarea «Registrar» va a ese hito.']);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(800);
/* Fila 680: sin hito ya no corta; se guarda y queda la marca antigua «Sin registrar» (la pasa a tarea `migrar` cuando haya hito). */
await comprobar('5. sin hito se guarda sin aviso rojo y queda «Sin registrar»', pagina.evaluate(async (n) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const lista = ((App.E.registro.asuntos[a.nombre] || a.ficha || {}).pendientesRegistro || []);
  return [(window.__av || []).slice(-1)[0] !== 'Elige el hito en el que hay que registrar el documento.', lista.length >= 1];
}, PEDIDO), [true, true]);
await pagina.evaluate(() => { const v = document.getElementById('doc-volver'); if (v) v.click(); });
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); });
await pagina.waitForTimeout(300);

console.log('--- 6. las marcas antiguas pasan solas a tareas ---');
const DOC_VIEJO = '261001 INFORME D26-09201.pdf';
const DOC_REGISTRADO = '261002 26EM0099 INFORME ref.pdf';
await pagina.evaluate(async ([n, A, B]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const d = await App.E.abiertos.getDirectoryHandle(n);
  await Carpetas.escribirBytes(d, A, new Uint8Array([37, 80, 68, 70]), 'application/pdf');
  await Carpetas.escribirBytes(d, B, new Uint8Array([37, 80, 68, 70]), 'application/pdf');
  await App.anotarLista(n, 'pendientesRegistro', { anadir: [A, B] });
}, [PABLO, DOC_VIEJO, DOC_REGISTRADO]);
const tareasAntes = (await registrar(PABLO)).length;
await pagina.evaluate(async (n) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  await HayQueRegistrarlo.migrar(a);
}, PABLO);
const l6 = await registrar(PABLO);
await comprobar('6. el documento sin registro tiene su tarea «Registrar»; el ya registrado, no (solo se le quita la marca)',
  [l6.length - tareasAntes, l6.filter((x) => x.doc.indexOf('INFORME') !== -1).map((x) => [x.texto, x.hecho])], [1, [['Registrar', false]]]);
await comprobar('6. la lista antigua queda vacía', pagina.evaluate((n) => (App.E.registro.asuntos[n].pendientesRegistro || []).length, PABLO), 0);
await comprobar('6. y sigue saliendo «Sin registrar»', sinRegistrar(PABLO, 'INFORME D26-09201'), [true]);

console.log('--- 7. los avisos salen de las tareas ---');
await comprobar('7. el aviso de lo que falta nombra la tarea «Registrar» con su documento',
  pagina.evaluate(async (n) => {
    const a = Gestor.asuntos().filter((x) => x.nombre === n)[0];
    return AvisosFalta.queFalta(a, await Hitos.hitosDe(n), { tipo: 'asunto' }).filter((l) => /INFORME D26-09201/.test(l));
  }, PABLO), ['Registrar: ' + DOC_VIEJO]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? `\n${fallos} comprobaciones fallan.` : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
