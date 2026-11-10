/* Prueba de la fila 573 (docs/573-FECHA-DE-REGISTRO.md): la fecha de registro de cada documento registrado.
   Chromium real con la copia de pruebas (?demo=1&auto=1).
   1. Las funciones puras: el sello a ISO, lo que se enseña, el listado manda sobre el sello.
   2. La línea del documento: «Registro 26EM0123 · 03/11/2026» (solo el código si no hay fecha); el demo trae uno con fecha distinta de la del documento.
   3. La ficha: el registro con sello guarda su fecha; el listado la corrige y manda; el sello no pisa al listado; sin listado queda la del sello.
   4. La mesa del hito enseña la misma fecha.
   5. Plantillas: «fecha de registro» está en la lista de marcas y sale con el código del mismo documento (también con nombre nuevo).
   6. Plazos: «desde su registro» se guarda (y sin elegir, sin `base`); al hacer el hito cuenta desde el registro o desde hoy;
      al llegar la fecha se recalcula, salvo con la fecha puesta a mano. */
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false && window.FechaDeRegistro && window.FechaDeRegistroPlazos, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);

console.log('--- 1. funciones puras ---');
await comprobar('1. sello a ISO, y a la inversa', pagina.evaluate(() => [FechaDeRegistro.isoDeSello('03/11/2026'), FechaDeRegistro.isoDeSello('mal'), FechaDeRegistro.legible('2026-11-03')]), ['2026-11-03', '', '03/11/2026']);
await comprobar('1. lo que se enseña', pagina.evaluate(() => [FechaDeRegistro.texto({ codigo: '26EM0123', fecha: '2026-11-03' }), FechaDeRegistro.texto({ codigo: '26EM0123' }), FechaDeRegistro.texto({})]), ['Registro 26EM0123 · 03/11/2026', 'Registro 26EM0123', '']);
await comprobar('1. el listado manda sobre el sello, y el sello no pisa al listado', pagina.evaluate(() => {
  const F = FechaDeRegistro;
  const delSello = F.conFecha({ codigo: 'X' }, '2026-11-03', 'sello');
  const delListado = F.conFecha(delSello, '2026-11-04', 'listado');
  const otraVezSello = F.conFecha(delListado, '2026-11-05', 'sello');
  return [delSello.fecha, delListado.fecha + delListado.fuente, otraVezSello === delListado]; }), ['2026-11-03', '2026-11-04listado', true]);
await comprobar('1. aplicar el listado a los registros de un documento', pagina.evaluate(() => {
  const r = FechaDeRegistro.aplicarListado([{ codigo: 'A', fecha: '2026-11-03', fuente: 'sello' }, { codigo: 'B' }], { A: { fecha: '2026-11-04' }, C: { fecha: '2026-11-09' } });
  return [r.cambiado, r.registros.map((x) => (x.fecha || '-') + ':' + (x.fuente || '-'))]; }), [true, ['2026-11-04:listado', '-:-']]);

console.log('--- 2. la línea del documento ---');
await comprobar('2. con fecha y sin fecha', pagina.evaluate(() => {
  const a = { ficha: { documentos: { 'D26-00001': { tipo: 'X', registros: [{ codigo: '26EM0123', fecha: '2026-11-03' }] }, 'D26-00002': { tipo: 'X', registros: [{ codigo: '26EM0124' }] } } } };
  return [DocumentosDatos.linea(a, '261030 X D26-00001.pdf'), DocumentosDatos.linea(a, '261030 X D26-00002.pdf')]; }), ['Registro 26EM0123 · 03/11/2026', 'Registro 26EM0124']);
await comprobar('2. el demo trae un documento con la fecha de registro distinta de la del documento', pagina.evaluate(() => {
  const a = Gestor.asuntos().filter((x) => x.ficha && Object.keys(x.ficha.documentos || {}).some((n) => ((x.ficha.documentos[n] || {}).registros || []).some((r) => r.codigo && r.fecha)))[0];
  if (!a) return null;
  const n = Object.keys(a.ficha.documentos).filter((k) => (a.ficha.documentos[k].registros || []).some((r) => r.fecha))[0];
  const d = a.ficha.documentos[n];
  return [d.registros[0].fecha !== d.fecha, /^Registro \S+ · \d\d\/\d\d\/\d{4}$/.test(DocumentosDatos.resumen(d).split(' · ').slice(0, 2).join(' · '))]; }), [true, true]);

console.log('--- 3. la ficha: sello, listado ---');
const A = await pagina.evaluate(() => Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Jimenez Rubio') !== -1)[0].nombre);
const ficha = (num) => pagina.evaluate(([a, n]) => JSON.parse(JSON.stringify(App.E.registro.asuntos[a].documentos[n] || {})).registros, [A, num]);
await pagina.evaluate(async (a) => {
  await DocumentosDatos.anotar(a, 'D26-90001', { tipo: 'INFORME', fecha: '2026-10-30', anadirRegistro: { ano: '26', sentido: 'E', modo: 'M', numero: '0900', codigo: '26EM0900', fecha: '2026-11-03', fuente: 'sello' } });
  await DocumentosDatos.anotar(a, 'D26-90002', { tipo: 'INFORME', fecha: '2026-10-30', anadirRegistro: { ano: '26', sentido: 'E', modo: 'M', numero: '0901', codigo: '26EM0901' } });
}, A);
await comprobar('3. el registro con sello guarda su fecha (la del sello)', ficha('D26-90001').then((r) => [r[0].fecha, r[0].fuente]), ['2026-11-03', 'sello']);
await comprobar('3. sin sello ni listado, sin fecha', ficha('D26-90002').then((r) => r[0].fecha || ''), '');
await comprobar('3. el listado de Séneca rellena la que falta y corrige la del sello', pagina.evaluate(async () => {
  const original = ControlRegistro.cargar;
  ControlRegistro.cargar = async () => ({ control: {}, apuntes: { '26EM0900': { fecha: '2026-11-04' }, '26EM0901': { fecha: '2026-11-05' } } });
  const tocados = await FechaDeRegistro.repasar();
  ControlRegistro.cargar = original; return tocados.length; }), 1);
await comprobar('3. mandan las del listado', Promise.all([ficha('D26-90001'), ficha('D26-90002')]).then(([a, b]) => [a[0].fecha + a[0].fuente, b[0].fecha + b[0].fuente]), ['2026-11-04listado', '2026-11-05listado']);
await comprobar('3. el sello de después no pisa al listado', pagina.evaluate(async (a) => {
  await DocumentosDatos.anotar(a, 'D26-90001', { anadirRegistro: { codigo: '26EM0900', fecha: '2026-11-01', fuente: 'sello' } });
  return App.E.registro.asuntos[a].documentos['D26-90001'].registros[0].fecha; }, A), '2026-11-04');

console.log('--- 5. plantillas ---');
await comprobar('5. «fecha de registro» está entre las marcas', pagina.evaluate(() => Plantillas.HUECOS.some((h) => h.clave === 'fecha de registro')), true);
await comprobar('5. sale con el código y la fecha del mismo documento (nombre nuevo)', pagina.evaluate(async () => {
  const a = { nombre: 'X', ficha: { tipo: 'INFORME', tercero: 'Prueba', documentos: {
    'D26-00001': { tipo: 'X', fecha: '2026-10-01', registros: [{ codigo: '26EM0100', fecha: '2026-10-02' }] },
    'D26-00002': { tipo: 'X', fecha: '2026-10-30', registros: [{ codigo: '26EM0123', fecha: '2026-11-03' }] } } } };
  const v = await Plantillas.valoresDeAsunto(a);
  return [v.registro, v['fecha de registro']]; }), ['26EM0123', '03/11/2026']);
await comprobar('5. sin fecha, la marca queda vacía', pagina.evaluate(async () => {
  const v = await Plantillas.valoresDeAsunto({ nombre: 'X', ficha: { tipo: 'INFORME', tercero: 'Prueba', documentos: { 'D26-00002': { tipo: 'X', registros: [{ codigo: '26EM0123' }] } } } });
  return [v.registro, v['fecha de registro']]; }), ['26EM0123', '']);

console.log('--- 6. plazos ---');
await comprobar('6. un plazo «desde su registro» se conserva al normalizar; sin elegir, no lleva `base`', pagina.evaluate(() => {
  const n = (p) => Hitos.normalizarHito({ titulo: 'x', plazo: p }).plazo;
  const g = (p) => Guias.normalizar([{ titulo: 'x', plazo: p }])[0].plazo;
  return [n({ dias: 3, desde: 'a', base: 'registro' }).base, n({ dias: 3, desde: 'a' }).base || null, g({ dias: 3, desde: 'a', base: 'registro' }).base, g({ dias: 3, desde: 'a', base: 'hecho' }).base || null]; }), ['registro', null, 'registro', null]);
await comprobar('6. el selector del plazo: dos opciones, y lee la elegida', pagina.evaluate(() => {
  const d = document.createElement('div'); d.innerHTML = GuiasPlazo.htmlBase({ plazo: { base: 'registro' } }, 'b');
  const s = d.querySelector('select');
  return [[...s.options].map((o) => o.textContent), GuiasPlazo.leerBaseSelect(s), GuiasPlazo.leerBaseSelect(Object.assign(document.createElement('select'), { innerHTML: '<option value="hecho">h</option>' }))]; }),
  [['desde que se hace', 'desde su registro'], 'registro', 'hecho']);
await comprobar('6. el cuadro de crear/cambiar un hito desde el asunto trae la misma elección y la lee', pagina.evaluate(() => {
  const N = window.HitosDesdeElAsuntoNucleo;
  const caja = document.createElement('div');
  caja.innerHTML = N.cuerpoFormulario({ nivel: [{ id: 'a', titulo: 'A' }], idPropio: 'g', responsables: [], plazo: { dias: 2, desde: 'a', cuenta: 'habiles', base: 'registro' } });
  document.body.appendChild(caja);
  const sel = caja.querySelector('#hda-plazo-base');
  const r = [!!sel, sel && sel.value, N.leerFormulario ? (N.leerFormulario().plazo || {}).base : null];
  caja.remove(); return r; }), [true, 'registro', 'registro']);

/* El hito de origen (H) con su documento registrado y el hito (G) que cuenta desde su registro. */
const montar = (base, manual) => pagina.evaluate(async ([a, base, manual]) => {
  await Hitos.cambiar((d) => {
    const hs = d.porAsunto[a].hitos;
    const H = hs[0], G = hs[1];
    H.estado = 'pendiente'; delete H.hechoEl; H.documentos = ['261030 INFORME D26-90003.pdf'];
    G.plazo = { dias: 3, desde: H.id, cuenta: 'naturales' }; if (base) G.plazo.base = base;
    G.fecha = '2000-01-01'; G.fechaManual = !!manual;
    return d;
  });
}, [A, base, manual]);
const hito = () => pagina.evaluate((a) => Hitos.ultimosLeidos ? null : null, A);
const fechaG = () => pagina.evaluate(async (a) => (await Hitos.hitosDe(a))[1].fecha, A);
const hacerH = () => pagina.evaluate(async (a) => { const hs = await Hitos.hitosDe(a); await Hitos.marcar(a, hs[0].id, 'hecho'); }, A);
const sumar = (iso, n) => pagina.evaluate(([i, n]) => Plazos.sumarPlazo(i, n, 'naturales', [], []), [iso, n]);
const hoy = await pagina.evaluate(() => U.hoyIso());
await pagina.evaluate(async (a) => { await DocumentosDatos.anotar(a, 'D26-90003', { tipo: 'INFORME', fecha: '2026-10-30', registros: [{ ano: '26', sentido: 'E', modo: 'M', numero: '0903', codigo: '26EM0903' }] }); }, A);

await montar('registro', false);
await hacerH();
await comprobar('6. «desde su registro» sin fecha de registro: cuenta desde hoy', fechaG(), await sumar(hoy, 3));
await pagina.evaluate(async (a) => { await DocumentosDatos.anotar(a, 'D26-90003', { registros: [{ ano: '26', sentido: 'E', modo: 'M', numero: '0903', codigo: '26EM0903', fecha: '2026-11-03', fuente: 'listado' }] }); await FechaDeRegistroPlazos.recalcular([a]); }, A);
await comprobar('6. al llegar la fecha de registro (listado), se recalcula solo', fechaG(), await sumar('2026-11-03', 3));
await montar('registro', false);
await hacerH();
await comprobar('6. con la fecha de registro ya puesta, al hacer el hito cuenta desde el registro, no desde hoy', fechaG(), await sumar('2026-11-03', 3));
await montar('registro', true);
await pagina.evaluate(async (a) => { await FechaDeRegistroPlazos.recalcular([a]); }, A);
await comprobar('6. con la fecha del hito puesta a mano, no se toca', fechaG(), '2000-01-01');
await montar('', false);
await hacerH();
await comprobar('6. sin elegir (guías de antes), «desde que se hace»: cuenta desde hoy', fechaG(), await sumar(hoy, 3));

console.log('--- 4. la mesa del hito ---');
await comprobar('4. la columna de registro enseña código y fecha', pagina.evaluate(() => {
  const a = { ficha: { documentos: { 'D26-00001': { tipo: 'X', registros: [{ codigo: '26EM0123', fecha: '2026-11-03' }] } } } };
  const d = document.createElement('div'); d.innerHTML = HitoMesaDocumentos.datosDeLaLinea ? HitoMesaDocumentos.datosDeLaLinea(a, '261030 X D26-00001.pdf', false) : '';
  const t = d.querySelector('.mesa-doc-registro'); return t ? t.textContent : null; }), '26EM0123 · 03/11/2026');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
