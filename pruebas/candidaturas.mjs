/* Prueba de la fila 347 (15-oct-2026, docs/CANDIDATURAS-CONSEJO-ESCOLAR.md): candidaturas a las elecciones al Consejo Escolar.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. En Ajustes, la pantalla de un tipo lleva la casilla «Lleva candidaturas» y se guarda al marcarla.
   2. En un asunto de un tipo con la marca, el cuadro de nombre lleva «¿De quién es esta candidatura?»; en uno sin la marca, no.
   3. Cuatro documentos: un alumno, un tutor legal, un docente y un no docente quedan relacionados y cada uno en su sector.
   4. «No es una candidatura» guarda el documento sin crear candidatura; el mismo alumno otra vez: aviso «Ya tiene candidatura»
      y no se crea otra. Sin elegir nada, no se guarda.
   5. Estados en la tarjeta: Admitida, Excluida (pide el motivo y lo enseña), Retirada, Presentada.
   6. Lista provisional y definitiva (con aviso de lo que queda sin resolver): quién sale y quién no, sin DNI ni número escolar.
   7. El PDF queda guardado en el asunto con su nombre fijo. */
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
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const TIPO = 'ELECCIONES CONSEJO ESCOLAR';
const avisos = () => pagina.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const limpiarAvisos = () => pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((e) => e.remove()));

/* ===== 1. La casilla en Ajustes ===== */
console.log('--- 1. la casilla del tipo ---');
await pagina.evaluate(async (T) => {
  const t = await App.crearTipo({ nombre: T, categoria: 'OTROS' });
  window.__tipo = t;
}, TIPO);
await pagina.evaluate((T) => { App.abrirTipoDeAsunto(App.E.tipos.filter((t) => t.tipo === T)[0]); }, TIPO);
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => { document.querySelectorAll('#pantalla-tipo-asunto details').forEach((d) => { d.open = true; }); });
const casilla = pagina.locator('#pantalla-tipo-asunto label.interruptor', { hasText: 'Lleva candidaturas' });
await comprobar('1. la casilla «Lleva candidaturas» está y sin marcar', [await casilla.count(), await casilla.locator('input').isChecked()], [1, false]);
await casilla.locator('input').check();
await pagina.waitForTimeout(800);
await comprobar('1. al marcarla, el tipo la guarda', pagina.evaluate((T) => App.E.tipos.filter((t) => t.tipo === T)[0].candidaturas, TIPO), true);

/* El asunto de las elecciones, y un asunto de otro tipo para ver que ahí no cambia nada. */
await pagina.evaluate(async (T) => {
  const tipo = App.E.tipos.filter((t) => t.tipo === T)[0];
  const numero = (await Numeros.reservar('asuntos', '')).numero;
  const montado = Nombres.montarAsunto({ fecha: U.hoyIso(), tipo: Nombres.tipoParaCarpeta(tipo), categoria: 'OTROS', curso: '', grupo: '', campos: [], descripcion: '', tercero: 'ELECCIONES 2026', numero: numero });
  await Carpetas.crear(App.E.abiertos, montado.nombre);
  await App.anotar(montado.nombre, { estado: 'abierto', tipo: tipo.tipo, categoria: 'OTROS', tercero: 'ELECCIONES 2026', descripcion: '', abiertoEl: U.ahora(), abiertoPor: 'Revisor', numero: numero });
  await App.verAbiertos();
  window.__nombre = montado.nombre;
}, TIPO);
const asunto = () => pagina.evaluate(() => Gestor.asuntos().filter((x) => x.nombre === window.__nombre)[0].nombre);
await comprobar('1. el asunto de las elecciones existe', asunto().then((n) => n.indexOf('ELECCIONES') !== -1 || n.length > 5), true);

/* Abre el cuadro de nombre de un documento que entra. */
async function entra(nombreFichero, frag) {
  await pagina.evaluate(([nombre, frag]) => {
    const a = frag ? Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0] : Gestor.asuntos().filter((x) => x.nombre === window.__nombre)[0];
    window.__abierto = Documentos.abrir(a, { ficheroSoltado: new File(['contenido de prueba'], nombre, { type: 'application/pdf' }) });
  }, [nombreFichero, frag || '']);
  await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
  await pagina.waitForTimeout(600);
}
async function cerrarCuadro() {
  await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); });
  await pagina.waitForTimeout(400);
}
/* Elige a alguien en el buscador del campo. */
async function elegir(categoria, texto, trozo) {
  await pagina.click('#cand-picker .categoria-mini-boton:text-is("' + categoria + '")');
  await pagina.fill('#cand-picker #rel-buscar', texto);
  await pagina.waitForSelector('#cand-picker #rel-resultados > div:not(.explica)', { timeout: 10000 });
  await pagina.locator('#cand-picker #rel-resultados > div', { hasText: trozo || texto }).first().click();
  await pagina.waitForTimeout(300);
}
const candidaturas = () => pagina.evaluate(() => {
  const f = App.E.registro.asuntos[window.__nombre] || {};
  return (f.candidaturas || []).map((c) => [c.persona.nombre, c.sector, c.estado, c.motivo, c.documentos.length]);
});
const relacionados = () => pagina.evaluate(() => ((App.E.registro.asuntos[window.__nombre] || {}).relacionados || []).map((r) => r.categoria + '|' + r.nombre).sort());

/* ===== 2. El campo del cuadro ===== */
console.log('--- 2. el campo del cuadro de nombre ---');
await entra('solicitud alumno.pdf');
await comprobar('2. sale «¿De quién es esta candidatura?» con el buscador y «No es una candidatura»', pagina.evaluate(() => [
  !!document.getElementById('cand-campo'), document.querySelector('#cand-campo .etiqueta').textContent, !!document.querySelector('#cand-picker #rel-categorias'),
  document.querySelector('#cand-no').parentNode.textContent]), [true, '¿De quién es esta candidatura?', true, 'No es una candidatura']);
await comprobar('2. el tipo de documento arranca en SOLICITUD DE CANDIDATURA', pagina.locator('#doc-tipo').inputValue(), 'SOLICITUD DE CANDIDATURA');
await cerrarCuadro();
await entra('justificante.pdf', 'Aguilar Ponce, Marina');
await comprobar('2. en un asunto de un tipo sin la marca, el campo no sale', pagina.locator('#cand-campo').count(), 0);
await cerrarCuadro();

/* ===== 3. Cuatro sectores ===== */
console.log('--- 3. los cuatro sectores ---');
const tutor = await pagina.evaluate(async () => {
  const l = (await Datos.cargar(App.E.datos, 'TUTORES LEGALES')).lista || [];
  return l.length ? l[0].nombre : '';
});
await comprobar('3. hay algún tutor legal en la demostración', !!tutor, true);
const gente = [
  ['ALUMNADO', 'Aguilar Ponce', 'solicitud alumna.pdf', 'Marina'],
  ['TUTORES LEGALES', tutor.split(',')[0], 'solicitud madre.pdf', tutor.split(',')[0]],
  ['PERSONAL', 'Otero Campos', 'solicitud profesora.pdf'],
  ['EMPRESAS', 'Copister', 'solicitud copisteria.pdf', 'Copister', 'PAS']
];
for (const [cat, texto, fichero, trozo, sector] of gente) {
  await entra(fichero);
  await elegir(cat, texto, trozo);
  if (sector) {
    await comprobar('3. una categoría que no encaja pide el sector a mano y avisa', pagina.evaluate(() => [!document.getElementById('cand-sector-fila').classList.contains('oculto'), /elige el sector a mano/.test(document.getElementById('cand-aviso').textContent)]), [true, true]);
    await pagina.click('#doc-guardar');
    await pagina.waitForTimeout(600);
    await comprobar('3. sin sector no se guarda', avisos().then((m) => m.filter((t) => /Elige el sector/.test(t)).length > 0), true);
    await limpiarAvisos();
    await pagina.selectOption('#cand-sector', sector);
  }
  await pagina.click('#doc-guardar');
  await pagina.waitForTimeout(2500);
  await cerrarCuadro();
}
const c3 = await candidaturas();
await comprobar('3. cada una en su sector', c3.map((c) => [c[0].split(',')[0].slice(0, 6), c[1]]).sort(), [
  ['Aguila', 'Alumnado'], [tutor.split(',')[0].slice(0, 6), 'Madres y padres'], ['Otero ', 'Profesorado'], ['Copist', 'PAS']].sort());
await comprobar('3. todas «Presentada» y con un documento', c3.every((c) => c[2] === 'Presentada' && c[4] === 1), true);
await comprobar('3. las cuatro personas quedan relacionadas con el asunto', (await relacionados()).length, 4);

/* ===== 4. No es una candidatura / ya tiene / sin elegir ===== */
console.log('--- 4. no es una candidatura, ya tiene, sin elegir ---');
await entra('acta de la junta.pdf');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(800);
await comprobar('4. sin elegir nada, no guarda y lo dice', avisos().then((m) => m.filter((t) => /Elige de quién es la candidatura/.test(t)).length > 0), true);
await limpiarAvisos();
await pagina.check('#cand-no');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await cerrarCuadro();
await comprobar('4. «No es una candidatura»: el documento se guarda y no hay candidatura nueva', pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre === window.__nombre)[0];
  const f = (await Carpetas.ficheros(a.handle)).map((x) => x.nombre);
  return [f.length, ((App.E.registro.asuntos[a.nombre] || {}).candidaturas || []).length];
}), [5, 4]);
await entra('segunda solicitud alumna.pdf');
await elegir('ALUMNADO', 'Aguilar Ponce', 'Marina');
await comprobar('4. «Ya tiene candidatura»', pagina.locator('#cand-aviso').textContent().then((t) => /Ya tiene candidatura/.test(t)), true);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await cerrarCuadro();
const c4 = await candidaturas();
await comprobar('4. no se crea una segunda, y la suya ya lleva dos documentos', [c4.length, c4.filter((c) => /Aguilar/.test(c[0]))[0][4]], [4, 2]);

/* ===== 5. La tarjeta y los estados ===== */
console.log('--- 5. la tarjeta y los estados ---');
await pagina.evaluate(() => App.abrirFicha(Gestor.asuntos().filter((x) => x.nombre === window.__nombre)[0], 'abierto'));
await pagina.waitForSelector('#ficha-candidaturas', { state: 'attached', timeout: 15000 });
await pagina.evaluate(() => FichaTarjetas.abrir('candidaturas'));
await pagina.waitForSelector('#ficha-candidaturas .cand-bloque', { timeout: 15000 });
await comprobar('5. el sector PAS sale solo para el personal no docente', pagina.evaluate(() => [Candidaturas.sectorDe('PERSONAL', { tipoPersonal: 'no-docente' }), Candidaturas.sectorDe('PERSONAL', {})]), ['PAS', '']);
await comprobar('5. el resumen', pagina.evaluate(() => document.getElementById('ficha-candidaturas').dataset.resumen), '4 candidaturas · Alumnado 1 · Madres y padres 1 · Profesorado 1 · PAS 1');
await comprobar('5. cuatro bloques, uno por sector', pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#ficha-candidaturas .cand-bloque'), (b) => b.dataset.sector)), ['Alumnado', 'Madres y padres', 'Profesorado', 'PAS']);
const estado = (frag) => pagina.locator('.cand-fila', { hasText: frag }).locator('.cand-estado');
await estado('Aguilar').selectOption('Admitida');
await pagina.waitForTimeout(1200);
await estado('Otero').selectOption('Retirada');
await pagina.waitForTimeout(1200);
await estado('Copist').selectOption('Excluida');
await pagina.waitForSelector('#cand-motivo');
await pagina.fill('#cand-motivo', 'Presentada fuera de plazo');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('5. Admitida, Retirada y Excluida con motivo, y una Presentada', candidaturas().then((l) => l.map((c) => [c[0].split(',')[0].slice(0, 6), c[2], c[3]]).sort()),
  [['Aguila', 'Admitida', ''], [tutor.split(',')[0].slice(0, 6), 'Presentada', ''], ['Otero ', 'Retirada', ''], ['Copist', 'Excluida', 'Presentada fuera de plazo']].sort());
await comprobar('5. la excluida enseña su motivo en la fila', pagina.locator('.cand-fila', { hasText: 'Copist' }).locator('.cand-motivo').textContent(), 'Motivo: Presentada fuera de plazo');

/* ===== 6. Las listas ===== */
console.log('--- 6. las listas ---');
const datos = (tipo) => pagina.evaluate((tipo) => {
  const c = App.E.registro.asuntos[window.__nombre].candidaturas;
  const d = CandidaturasLista.datosDe(c, tipo);
  return { sinResolver: d.sinResolver, sectores: d.sectores.map((s) => [s.sector, s.lista.map((n) => n.split(',')[0]), s.excluidas.map((x) => x.motivo)]) };
}, tipo);
const prov = await datos('provisional');
await comprobar('6. provisional: la admitida y la presentada salen; la excluida, aparte con su motivo; la retirada no', [
  prov.sectores[0], prov.sectores[1][1].length, prov.sectores[2], prov.sectores[3]],
  [['Alumnado', ['Aguilar Ponce'], []], 1, ['Profesorado', [], []], ['PAS', [], ['Presentada fuera de plazo']]]);
const def = await datos('definitiva');
await comprobar('6. definitiva: solo la admitida y avisa de 1 sin resolver', [def.sinResolver, def.sectores[0][1], def.sectores[1][1]], [1, ['Aguilar Ponce'], []]);

console.log('--- 7. el PDF ---');
await pagina.locator('.cand-lista-btn').click();
await pagina.locator('.fila-menu button', { hasText: 'Lista definitiva' }).click();
await pagina.waitForSelector('#cuadro-titulo:text("sin resolver")', { timeout: 10000 });
await comprobar('7. antes de sacar la definitiva avisa de lo que queda sin resolver', pagina.locator('#cuadro-titulo').textContent(), 'Hay 1 candidatura sin resolver');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(4000);
const pdf = await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre === window.__nombre)[0];
  const f = (await Carpetas.ficheros(a.handle)).filter((x) => /LISTA CANDIDATURAS/.test(x.nombre));
  if (!f.length) return null;
  const bytes = new Uint8Array(await (await f[0].handle.getFile()).arrayBuffer());
  const L = await PdfHerramientas.cargarPdfLib();
  const doc = await L.PDFDocument.load(bytes);
  return { nombre: f[0].nombre, paginas: doc.getPageCount(), titulo: doc.getTitle() };
});
await comprobar('7. guardado en el asunto como «AAMMDD LISTA CANDIDATURAS D26-….pdf»', pdf && /^\d{6} LISTA CANDIDATURAS D\d{2}-\d+\.pdf$/.test(pdf.nombre), true);
await comprobar('7. título del PDF', pdf && pdf.titulo, 'Lista definitiva de candidaturas');
await comprobar('7. y no lleva ningún dato personal además del nombre', pagina.evaluate(() => {
  const d = CandidaturasLista.datosDe(App.E.registro.asuntos[window.__nombre].candidaturas, 'provisional');
  return /\d/.test(JSON.stringify(d.sectores)) ? JSON.stringify(d.sectores) : false;
}), false);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
