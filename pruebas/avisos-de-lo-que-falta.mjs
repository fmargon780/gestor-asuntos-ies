/* Fila 524 (5-nov-2026, docs/524-AVISOS-DE-LO-QUE-FALTA.md; tema 516): avisos de lo que falta por firmar o registrar.
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1).

   1. Marcar un hito: cuadro «Falta por hacer en este hito» solo con lo de ese hito; «Volver» no lo marca; «igualmente» sí.
   2. Marcar sin pendientes: sin cuadro. Desmarcar: sin cuadro.
   3. Archivar: «Falta por hacer en este asunto» con lo de todo el asunto (también la casilla de otro hito); «Volver» no archiva.
   4. Enviar: solo lo de los documentos adjuntos; «Enviar igualmente».
   5. «No aplica», «Comunicar» y sin acción no salen. 6. «falta 1 de 2 firmas». 7. «Sin registrar» solo con casilla o tarea de registrar. */
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

const DOC_A = '261105 RESOLUCION D26-09101.pdf';
const DOC_B = '261105 INFORME D26-09102.pdf';
const DOC_C = '261105 PENDIENTE D26-09103.pdf';
const DOC_D = '261105 OTRO HITO D26-09104.pdf';
const DOC_E = '261105 SIN CASILLA D26-09105.pdf';

/* Prepara 'Vidal Soto': el primer hito pendiente con tareas de todos los tipos y un segundo hito con una casilla. */
const prep = await pagina.evaluate(async ([A, B, C, D, E]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const hs = (await Hitos.hitosDe(a.nombre)).filter((x) => x.clase !== 'decision');
  const h = hs[0], h2 = hs[1];
  for (const g of Hitos.guionDe(a, h)) await Hitos.marcarGuion(a.nombre, h.id, g.id, { noaplica: true });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Firmar resolución', { accion: 'firmar', receta: { firmas: '2' } });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Registrar informe', { accion: 'registrar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Registrar sin documento', { accion: 'registrar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Registrar no aplica', { accion: 'registrar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Comunicar al tutor', { accion: 'comunicar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Sin acción alguna', {});
  const g = Hitos.guionDe(a, (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === h.id)[0]);
  const id = (t) => g.filter((x) => x.texto === t)[0].id;
  await TareasConDocumento.asignar(a.nombre, h.id, id('Firmar resolución'), A);
  await TareasConDocumento.asignar(a.nombre, h.id, id('Registrar informe'), B);
  await Hitos.marcarGuion(a.nombre, h.id, id('Registrar no aplica'), { noaplica: true });
  await Hitos.cambiar((d) => {
    const e = d.porAsunto[a.nombre];
    const x = Hitos.buscar(e.hitos, h.id), y = Hitos.buscar(e.hitos, h2.id);
    x.documentos = [A, B, C, E]; y.documentos = [D];
    return d;
  });
  await App.anotarLista(a.nombre, 'pendientesRegistro', { anadir: [C, D] });
  return { hito: h.id, hito2: h2.id, nombre: a.nombre, notaAplica: id('Registrar no aplica') };
}, [DOC_A, DOC_B, DOC_C, DOC_D, DOC_E]);

const falta = (alcance) => pagina.evaluate(async ([alcance, idH]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const hs = await Hitos.hitosDe(a.nombre);
  const h = hs.filter((x) => x.id === idH)[0];
  return AvisosFalta.queFalta(a, hs, alcance.tipo === 'hito' ? { tipo: 'hito', hito: h } : alcance);
}, [alcance, prep.hito]);

console.log('--- la función ---');
await comprobar('5-6. el hito: firmar con «falta 2 de 2», registrar, sin documento y la casilla; no salen «No aplica», «Comunicar» ni sin acción',
  falta({ tipo: 'hito' }),
  ['Firmar: ' + DOC_A + ' (faltan 2 de 2 firmas)', 'Registrar: ' + DOC_B, 'Registrar sin documento (sin documento)', 'Registrar: ' + DOC_C]);
await comprobar('3. el asunto suma la casilla de otro hito',
  falta({ tipo: 'asunto' }),
  ['Firmar: ' + DOC_A + ' (faltan 2 de 2 firmas)', 'Registrar: ' + DOC_B, 'Registrar sin documento (sin documento)', 'Registrar: ' + DOC_C, 'Registrar: ' + DOC_D]);
await comprobar('4. los adjuntos: solo lo de esos documentos',
  falta({ tipo: 'docs', docs: [DOC_B, DOC_E, DOC_D] }), ['Registrar: ' + DOC_B, 'Registrar: ' + DOC_D]);
await comprobar('4. adjuntos sin nada pendiente: nada', falta({ tipo: 'docs', docs: [DOC_E] }), []);
await pagina.evaluate(async ([doc]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  await DocumentosFirmados.alLlegar(a, doc, 'firmado', 1, '_Previas');
}, [DOC_A]);
await comprobar('6. con una de dos firmas: «falta 1 de 2 firmas»', (await falta({ tipo: 'hito' }))[0], 'Firmar: ' + DOC_A + ' (falta 1 de 2 firmas)');
await comprobar('7. «Sin registrar» solo en la casilla y en la tarea de registrar',
  pagina.evaluate(async ([A, B, C, D, E]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    const hs = await Hitos.hitosDe(a.nombre);
    return [A, B, C, D, E].map((n) => AvisosFalta.sinRegistrar(a, hs, n));
  }, [DOC_A, DOC_B, DOC_C, DOC_D, DOC_E]), [false, true, true, true, false]);

/* ===== los cuadros ===== */
const cuadros = () => pagina.evaluate(() => window.__cuadros.slice());
async function preparaCuadros(respuesta) {
  await pagina.evaluate((r) => {
    window.__cuadros = [];
    if (!window.__preguntarOriginal) window.__preguntarOriginal = U.preguntar;
    U.preguntar = function (titulo, cuerpo, aceptar, sinCancelar, cancelar) {
      window.__cuadros.push({ titulo, aceptar, cancelar: cancelar || null, lineas: [...new DOMParser().parseFromString(cuerpo, 'text/html').querySelectorAll('li')].map((l) => l.textContent) });
      return Promise.resolve(r);
    };
  }, respuesta);
}
const estadoHito = () => pagina.evaluate(async ([idH]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  return (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0].estado;
}, [prep.hito]);
const marcar = (checked) => pagina.evaluate(async ([idH, checked]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0];
  const c = document.createElement('input'); c.type = 'checkbox'; c.checked = checked;
  const ok = await HitosPanelLista.marcarDesdeCasilla(c, a, h);
  return [ok, c.checked];
}, [prep.hito, checked]);

console.log('--- 1. marcar el hito ---');
await preparaCuadros(false);
await comprobar('1. «Volver»: no se marca', await marcar(true), [false, false]);
const c1 = await cuadros();
await comprobar('1. el cuadro es el del hito, con «Marcar como hecho igualmente» y «Volver», sin la casilla de otro hito',
  [c1.length, c1[0].titulo, c1[0].aceptar, c1[0].cancelar, c1[0].lineas.some((l) => l.indexOf(DOC_D) !== -1), c1[0].lineas.length],
  [1, 'Falta por hacer en este hito', 'Marcar como hecho igualmente', 'Volver', false, 4]);
await comprobar('1. el hito sigue sin marcar', (await estadoHito()) !== 'hecho', true);
await preparaCuadros(true);
await comprobar('1. «igualmente»: se marca', (await marcar(true))[0], true);
await comprobar('1. y queda hecho', await estadoHito(), 'hecho');
await preparaCuadros(true);
await marcar(false);
await comprobar('2. desmarcar: sin cuadro', (await cuadros()).length, 0);
await comprobar('2. y queda pendiente', await estadoHito(), 'pendiente');
await pagina.evaluate(async ([idH, nombre, DOC_C, DOC_D]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === nombre)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0];
  for (const g of Hitos.guionDe(a, h)) await Hitos.marcarGuion(a.nombre, idH, g.id, { noaplica: true });
  await App.anotarLista(a.nombre, 'pendientesRegistro', { quitar: [DOC_C, DOC_D] });
}, [prep.hito, prep.nombre, DOC_C, DOC_D]);
await preparaCuadros(true);
await marcar(true);
await comprobar('2. marcar sin pendientes: sin cuadro de lo que falta', (await cuadros()).filter((c) => /Falta por hacer/.test(c.titulo)).length, 0);

console.log('--- 3. archivar ---');
await pagina.evaluate(async ([idH, nombre, C, D]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre === nombre)[0];
  await Hitos.anadirGuionPropio(a.nombre, idH, 'Firmar otra vez', { accion: 'firmar', receta: null });
  await App.anotarLista(a.nombre, 'pendientesRegistro', { anadir: [D] });
}, [prep.hito, prep.nombre, DOC_C, DOC_D]);
await preparaCuadros(false);
await pagina.evaluate(async (nombre) => { const a = Gestor.asuntos().filter((x) => x.nombre === nombre)[0]; await App.cerrarAsunto(a); }, prep.nombre);
const c3 = await cuadros();
await comprobar('3. el cuadro es el del asunto, con «Archivar igualmente» y «Volver»; «Volver» no archiva (un solo cuadro)',
  [c3.length, c3[0].titulo, c3[0].aceptar, c3[0].cancelar, c3[0].lineas.some((l) => l.indexOf(DOC_D) !== -1)],
  [1, 'Falta por hacer en este asunto', 'Archivar igualmente', 'Volver', true]);

console.log('--- 4. enviar ---');
await comprobar('4. el resumen del correo con adjunto pendiente: cuadro «Falta por hacer en lo que vas a enviar» y «Enviar igualmente»',
  pagina.evaluate(async ([D, E]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    document.body.insertAdjacentHTML('beforeend', '<div id="prueba-correo"><div id="correo-formulario"></div><div id="correo-resumen" class="oculto"></div></div>');
    const pinta = async (docs) => {
      const falta = await AvisosFalta.deLosAdjuntos(a, docs);
      CorreoCuadro.pintarResumen(a, { para: 'x@y.es', cco: '', asunto: 'a', cuerpo: 'b', adjuntos: docs, falta });
      const r = document.getElementById('correo-resumen');
      return [!!r.querySelector('#correo-falta'), document.getElementById('correo-confirmar-envio').textContent, r.querySelectorAll('#correo-falta li').length, !!document.getElementById('correo-resumen-volver')];
    };
    const con = await pinta([D]); const sin = await pinta([E]);
    document.getElementById('prueba-correo').remove();
    return { con, sin };
  }, [DOC_D, DOC_E]),
  { con: [true, 'Enviar igualmente', 1, true], sin: [false, 'Confirmar y enviar', 0, true] });

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
