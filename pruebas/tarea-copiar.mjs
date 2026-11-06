/* Fila 552 (6-nov-2026, docs/552-COPIAR-A-OTRA-CARPETA.md; tema 550): la tarea «Copiar a otra carpeta».
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1).

   1. «Qué hace» ofrece «Copiar a otra carpeta»; el formulario enseña Carpeta, Qué copia y Nombre con «Saldrá así: …»;
      «Insertar campo» abre la ventana de elegir campo y mete la marca en el nombre.
   2. El nombre: campos rellenos, un campo vacío no deja huecos dobles, caracteres no válidos fuera, la extensión del documento.
   3. Llega el registrado: el fichero aparece en la carpeta con ese nombre y la tarea queda hecha con «Copiado a …».
   4. Un fichero con el mismo nombre en la carpeta no se pisa: la copia lleva « (2)».
   5. Sin permiso: no se copia, la tarea queda pendiente con el aviso ámbar y «Dar permiso»; al darlo se copia y se marca.
   6. En «solo consultar» no se escribe nada. Sin tarea de registrar en el hito, no se copia sola. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForTimeout(3000);

/* ===== 1. El formulario ===== */
console.log('--- 1. el formulario ---');
await comprobar('1. «Qué hace» de la lista común ofrece «Copiar a otra carpeta»',
  pagina.evaluate(() => Comunes.HACE.some((h) => h.valor === 'copiar' && h.texto === 'Copiar a otra carpeta')), true);
const form = await pagina.evaluate(async () => {
  const caja = document.createElement('div');
  caja.id = 'prueba-form';
  caja.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff;padding:10px;width:600px';
  caja.innerHTML = TareaCopiarEditor.formularioHTML(null);
  document.body.appendChild(caja);
  TareaCopiarEditor.enganchar(caja);
  await new Promise((ok) => setTimeout(ok, 800));
  const t = caja.innerText;
  return [/Carpeta/.test(t), /Qué copia/.test(t), /Nombre del fichero copiado/.test(t), /Saldrá así: /.test(t),
    !!caja.querySelector('.tcp-elegir'), !!caja.querySelector('.tcp-insertar')];
});
await comprobar('1. enseña Carpeta, Qué copia, Nombre, «Saldrá así» y los dos botones', form, [true, true, true, true, true, true]);
await pagina.locator('#prueba-form .tcp-patron').fill('Ausencia {alumno} X');
await pagina.waitForTimeout(800);
await comprobar('1. «Saldrá así» cambia al escribir y lleva la extensión',
  pagina.locator('#prueba-form .tcp-ejemplo').innerText(), 'Saldrá así: Ausencia X.pdf');
await pagina.locator('#prueba-form .tcp-insertar').click();
await pagina.waitForSelector('.cuadro-campos', { timeout: 10000 });
await comprobar('1. «Insertar campo» abre la ventana de elegir campo', pagina.locator('.cuadro-campos').count(), 1);
await pagina.locator('.cuadro-campos .campos-fila-campo').first().click();
await pagina.waitForTimeout(800);
await comprobar('1. el campo elegido queda dentro del nombre',
  pagina.locator('#prueba-form .tcp-patron').inputValue().then((v) => /\{[^{}]+\}/.test(v)), true);
await comprobar('1. la receta que sale del formulario sin carpeta no tiene carpeta',
  pagina.evaluate(() => (TareaCopiarEditor.leer(document.getElementById('prueba-form')) || {}).carpeta || ''), '');

await pagina.evaluate(() => { const f = document.getElementById('prueba-form'); if (f) f.remove(); });

/* ===== 2. El nombre ===== */
console.log('--- 2. el nombre ---');
await comprobar('2. campo vacío sin huecos dobles, sin caracteres no válidos, con extensión',
  pagina.evaluate(() => TareaCopiar.nombreDe('Ausencia {grupo}  {nombre} / 5:A?', { grupo: '', nombre: 'Vidal Soto' }, '261105 X D26-1.pdf')),
  'Ausencia Vidal Soto 5 A.pdf');
await comprobar('2. un campo que no se sabe no se deja a medias',
  pagina.evaluate(() => TareaCopiar.nombreDe('Aus {noexiste} 1', {}, 'a.pdf')), 'Aus 1.pdf');
await comprobar('2. sin nombre, el mismo del documento',
  pagina.evaluate(() => TareaCopiar.nombreDe('', {}, '261105 RESOLUCION D26-09101.pdf')), '261105 RESOLUCION D26-09101.pdf');

/* ===== 3 a 6. Llega el registrado ===== */
const FRAG = 'Vidal Soto';
const prep = await pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const reg = await Hitos.anadirGuionPropio(a.nombre, h.id, 'Registrar el escrito', { accion: 'registrar', receta: null });
  const cop = await Hitos.anadirGuionPropio(a.nombre, h.id, 'Copiar a Ausencias', {
    accion: 'copiar', receta: { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: 'Registro {nombre}' } });
  const destino = await App.E.archivo.getDirectoryHandle('Ausencias', { create: true });
  await TareaCopiar.recordar({ carpetaId: 'cp-prueba' }, destino);
  const carpeta = a.handle;
  for (const n of ['261105 ESCRITO D26-09201.pdf', '261105 ESCRITO D26-09202.pdf', '261105 ESCRITO D26-09203.pdf']) await Carpetas.escribirBytes(carpeta, n, new Uint8Array([37, 80, 68, 70]), 'application/pdf');
  const g = Hitos.guionDe(a, (await Hitos.hitosDe(a.nombre))[0]);
  const ids = g.filter((x) => x.accion === 'copiar' || x.accion === 'registrar').map((x) => [x.accion, x.id, x.texto]);
  return { clave: a.nombre, hito: h.id, ids, recetaGuardada: g.filter((x) => x.accion === 'copiar').map((x) => x.receta)[0] };
}, FRAG);
const idCopiar = prep.ids.filter((x) => x[0] === 'copiar')[0][1];
console.log('--- 3. llega el registrado ---');
await comprobar('3. la tarea nace con su receta', prep.recetaGuardada, { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: 'Registro {nombre}' });
const estado = (id) => pagina.evaluate(async ([clave, hito, id]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === clave)[0];
  const h = (await Hitos.hitosDe(clave)).filter((x) => x.id === hito)[0];
  const g = Hitos.guionDe(a, h).filter((x) => x.id === id)[0];
  const d = await App.E.archivo.getDirectoryHandle('Ausencias');
  const ficheros = []; for await (const [n] of d.entries()) ficheros.push(n);
  return { hecha: g.hecho, copia: g.copia, ficheros: ficheros.sort() };
}, [prep.clave, prep.hito, id]);
const registrar = (doc) => pagina.evaluate(async ([clave, hito, doc]) => {
  await Hitos.marcarGuionPorAccion(clave, hito, 'registrar', doc);
  await new Promise((ok) => setTimeout(ok, 800));
}, [prep.clave, prep.hito, doc]);
await registrar('261105 ESCRITO D26-09201.pdf');
const e3 = await estado(idCopiar);
await comprobar('3. el fichero aparece en la carpeta con el nombre de los campos', e3.ficheros.length === 1 && /^Registro .+\.pdf$/.test(e3.ficheros[0]), true);
await comprobar('3. la tarea queda hecha con su línea «Copiado a Ausencias como «…».»',
  [e3.hecha, e3.copia && e3.copia.texto === 'Copiado a Ausencias como «' + e3.ficheros[0] + '».'], [true, true]);

/* ===== 4. No se pisa ===== */
console.log('--- 4. no se pisa ---');
const nombreUno = e3.ficheros[0];
await pagina.evaluate(async ([clave, hito, id]) => { await Hitos.marcarGuion(clave, hito, id, { hecho: false }); }, [prep.clave, prep.hito, idCopiar]);
await pagina.evaluate(async ([clave, hito, ids]) => {   /* otra tarea de registrar pendiente para el segundo documento */
  await Hitos.anadirGuionPropio(clave, hito, 'Registrar el segundo escrito', { accion: 'registrar', receta: null });
}, [prep.clave, prep.hito]);
await registrar('261105 ESCRITO D26-09202.pdf');
const e4 = await estado(idCopiar);
await comprobar('4. el de antes sigue y la copia nueva lleva « (2)»',
  [e4.ficheros.includes(nombreUno), e4.ficheros.length, e4.ficheros.some((n) => /\(2\)\.pdf$/.test(n))], [true, 2, true]);
await comprobar('4. la línea de la tarea lo dice', /\(2\)\.pdf».$/.test((e4.copia || {}).texto || ''), true);

/* ===== 5. Sin permiso ===== */
console.log('--- 5. sin permiso ---');
await pagina.evaluate(async ([clave, hito, id]) => {
  await Hitos.marcarGuion(clave, hito, id, { hecho: false });
  await Hitos.anadirGuionPropio(clave, hito, 'Registrar el tercer escrito', { accion: 'registrar', receta: null });
  const d = await App.E.archivo.getDirectoryHandle('Ausencias');
  window.__sinPermiso = true;
  d.queryPermission = () => Promise.resolve(window.__sinPermiso ? 'prompt' : 'granted');
  d.requestPermission = () => Promise.resolve(window.__sinPermiso ? 'denied' : 'granted');
}, [prep.clave, prep.hito, idCopiar]);
await registrar('261105 ESCRITO D26-09203.pdf');
const e5 = await estado(idCopiar);
await comprobar('5. sin permiso no se copia (siguen 2) y queda pendiente con su texto',
  [e5.ficheros.length, e5.hecha, e5.copia && e5.copia.pendiente], [2, false, 'Pendiente: falta permiso sobre la carpeta.']);
await pagina.click('button.pestana[data-pantalla="abiertos"]');
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + FRAG + '"] .tarjeta-nombre').first().click();
await pagina.waitForTimeout(1200);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(500);
if (!(await pagina.locator('#ficha-guia.con-mesa').count())) await pagina.locator('#ficha-guia .hito .hito-titulo').first().click();
await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
await pagina.waitForTimeout(1000);
await comprobar('5. sale el aviso ámbar con «Dar permiso»',
  pagina.evaluate((id) => { const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="' + id + '"]'); const av = p && p.querySelector('.aviso-ambar'); return [!!av, av ? av.innerText : '', !!(p && p.querySelector('.tcp-dar-permiso'))]; }, idCopiar),
  [true, 'Pendiente: falta permiso sobre la carpeta. Dar permiso', true]);
await pagina.evaluate(() => { window.__sinPermiso = false; });
await pagina.locator('.hito-en-mesa .guion-paso[data-id="' + idCopiar + '"] .tcp-dar-permiso').click();
await pagina.waitForTimeout(1500);
const e5b = await estado(idCopiar);
await comprobar('5. al darlo se copia (3 ficheros) y se marca', [e5b.ficheros.length, e5b.hecha, /^Copiado a Ausencias como «/.test((e5b.copia || {}).texto || '')], [3, true, true]);
await comprobar('5. el aviso ámbar se va',
  pagina.evaluate((id) => !document.querySelector('.hito-en-mesa .guion-paso[data-id="' + id + '"] .tcp-dar-permiso'), idCopiar), true);

/* ===== 6. Solo consultar, y sin tarea de registrar ===== */
console.log('--- 6. casos que no copian ---');
const e6 = await pagina.evaluate(async ([clave, hito, id]) => {
  await Hitos.marcarGuion(clave, hito, id, { hecho: false });
  await Hitos.anotarCopia(clave, hito, id, null, false);
  await Hitos.anadirGuionPropio(clave, hito, 'Registrar el cuarto escrito', { accion: 'registrar', receta: null });
  const antes = Demo.escrituras ? Demo.escrituras() : -1;
  const d = await App.E.archivo.getDirectoryHandle('Ausencias');
  const n0 = (await (async () => { const l = []; for await (const [n] of d.entries()) l.push(n); return l; })()).length;
  const original = SoloConsulta.activo;
  SoloConsulta.activo = () => true;
  await Hitos.marcarGuionPorAccion(clave, hito, 'registrar', '261105 ESCRITO D26-09201.pdf');
  await new Promise((ok) => setTimeout(ok, 800));
  SoloConsulta.activo = original;
  const l = []; for await (const [n] of d.entries()) l.push(n);
  return [n0, l.length];
}, [prep.clave, prep.hito, idCopiar]);
await comprobar('6. en «solo consultar» no se escribe en la carpeta de destino', e6[0], e6[1]);
const e6b = await pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1 && x.nombre.indexOf('Vidal') === -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Copiar sin registrar', { accion: 'copiar', receta: { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: '' } });
  const d = await App.E.archivo.getDirectoryHandle('Ausencias');
  const antes = []; for await (const [n] of d.entries()) antes.push(n);
  await Hitos.marcarGuionPorAccion(a.nombre, h.id, 'anadir');
  await new Promise((ok) => setTimeout(ok, 500));
  const despues = []; for await (const [n] of d.entries()) despues.push(n);
  return [antes.length, despues.length];
}, 'a');
await comprobar('6. sin tarea de registrar en el hito no se copia sola', e6b[0], e6b[1]);

/* ===== 7. La guía y «Cambiar la tarea» ===== */
console.log('--- 7. la guía y «Cambiar la tarea» ---');
await comprobar('7. el editor de la guía pinta el formulario y la receta vuelve entera',
  pagina.evaluate(() => {
    const r = { carpeta: 'Ausencias', carpetaId: 'cp-x', patron: 'A {nombre}' };
    const caja = document.createElement('div');
    caja.innerHTML = GuiasGuion.recetaHTML({ accion: 'copiar', receta: r }, false);
    const b = caja.querySelector('.guion-receta-copiar');
    return [!!b, !!caja.querySelector('.tcp-elegir'), TareaCopiarEditor.leerGuia(b), GuiasGuion.normalizarReceta('copiar', TareaCopiarEditor.leerGuia(b)),
      GuiasGuion.normalizarReceta('copiar', { patron: 'solo patrón' }).carpetaId];
  }), [true, true, { carpeta: 'Ausencias', carpetaId: 'cp-x', patron: 'A {nombre}' }, { carpeta: 'Ausencias', carpetaId: 'cp-x', patron: 'A {nombre}' }, '']);
const comun = await pagina.evaluate(async () => {
  const t = await ComunesGuardado.anadir('tareas', { nombre: 'Copiar a Ausencias (prueba)', accion: 'copiar', receta: { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: 'Ausencia {nombre}' } });
  return t;
});
await comprobar('7. la tarea común guarda su receta', comun.receta, { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: 'Ausencia {nombre}' });
await pagina.evaluate((t) => { ComunesCambiar.tarea(t, {}); }, comun);
await pagina.waitForSelector('.capa-campos .tcp-form', { timeout: 10000 });
await comprobar('7. «Cambiar la tarea» enseña la carpeta y el nombre',
  pagina.evaluate(() => [document.querySelector('.capa-campos .tcp-carpeta').textContent, document.querySelector('.capa-campos .tcp-patron').value]), ['Ausencias', 'Ausencia {nombre}']);
await pagina.locator('.capa-campos .tcp-patron').fill('Falta {nombre}');
await pagina.locator('#cc-guardar').click();
await pagina.waitForTimeout(1500);
await comprobar('7. al guardar queda el nombre nuevo y la misma carpeta',
  pagina.evaluate(async () => { const l = await ComunesGuardado.leer(); return l.tareas.filter((x) => x.nombre === 'Copiar a Ausencias (prueba)')[0].receta; }),
  { carpeta: 'Ausencias', carpetaId: 'cp-prueba', patron: 'Falta {nombre}' });

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
