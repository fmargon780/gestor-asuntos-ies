/* Prueba de la fila 307 de docs/COLA.md (docs/INFORME-EN-PDF-QUE-PIERDE-ASUNTOS.md): el informe en PDF de
   «Exportar» no pierde asuntos al pasar de página, un asunto muy alto se reparte, la app cuenta antes de
   guardar o imprimir y «Imprimir» saca una hoja por página. Con Chromium real y la copia de demostración
   (?demo=1&auto=1), con el membrete puesto. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1000 } });
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

/* Lo que mide cada página, de verdad (en el navegador): si desborda y cuántas filas de asunto se ven enteras. */
const MEDIR = `(() => {
  const pags = Array.from(document.querySelectorAll('#exportar-visor section.exportar-pagina'));
  let visibles = 0, desbordan = 0;
  pags.forEach((p) => {
    const cs = getComputedStyle(p), r = p.getBoundingClientRect();
    const limite = r.bottom - parseFloat(cs.paddingBottom) + 0.5;
    const cont = p.querySelector('.exportar-contenido');
    if (cont.getBoundingClientRect().bottom > limite) desbordan++;
    p.querySelectorAll('tr.exportar-fila').forEach((f) => { if (f.getBoundingClientRect().bottom <= limite) visibles++; });
  });
  const esperado = document.querySelector('.exportar-total-n') ? parseInt(document.querySelector('.exportar-total-n').textContent, 10) : -1;
  const cierre = document.querySelector('.exportar-pie span:last-child');
  return { paginas: pags.length, visibles, desbordan, esperado, filas: document.querySelectorAll('tr.exportar-fila').length,
    pieN: pags.length ? parseInt(pags[0].querySelector('.exportar-pie span:last-child').textContent.replace(/.* de /, ''), 10) : 0,
    aviso: !!document.querySelector('#exportar-visor .exportar-aviso:not(.oculto)') };
})()`;
const medir = () => pagina.evaluate(MEDIR);
async function bien(titulo) {
  await pagina.waitForTimeout(2000);
  const m = await medir();
  await comprobar(titulo + ': ninguna página desborda, se ven todos los asuntos y no hay aviso',
    Promise.resolve([m.desbordan, m.visibles === m.esperado && m.filas === m.esperado, m.pieN === m.paginas, m.aviso]), [0, true, true, false]);
  return m;
}

async function abrirExportar() {
  await pagina.click('#btn-exportar');
  await pagina.click('#btn-exportar-pdf');
  await pagina.waitForSelector('#capa:not(.oculto) #exp-columnas');
}
async function informe({ agrupar1 = '', agrupar2 = '', hitos = false, soloCinco = false }) {
  await abrirExportar();
  await pagina.check('#exp-archivados');
  await pagina.waitForFunction(() => !document.getElementById('exp-nota') || document.getElementById('exp-nota').classList.contains('oculto'));
  if (soloCinco) {
    await pagina.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#exp-columnas input[data-col]'));
      c.forEach((x, i) => { if (x.checked !== (i < 5)) x.click(); });
    });
  }
  if (agrupar1) await pagina.selectOption('#exp-agrupar-1', agrupar1);
  if (agrupar2) await pagina.selectOption('#exp-agrupar-2', agrupar2);
  if (hitos) await pagina.check('#exp-hitos');
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#exportar-visor:not(.oculto) section.exportar-pagina', { timeout: 20000 });
}
const cerrar = () => pagina.click('.exportar-cerrar');
const paginasPdf = () => pagina.evaluate(async () => {
  const b = await ExportarInforme.hacerPdf();
  const d = await PDFLib.PDFDocument.load(await b.arrayBuffer());
  return d.getPageCount();
});

console.log('--- 1. la demostración, con todas las opciones ---');
const casos = [
  ['sin agrupar', {}],
  ['sin agrupar, con hitos', { hitos: true }],
  ['agrupado por Tipo', { agrupar1: 'tipo' }],
  ['agrupado por Tipo y dentro por Le toca a', { agrupar1: 'tipo', agrupar2: 'leToca' }],
  ['agrupado por Tipo con hitos', { agrupar1: 'tipo', hitos: true }],
  ['vertical (cinco columnas)', { soloCinco: true }],
];
for (const [nombre, op] of casos) {
  await informe(op);
  const m = await bien(nombre);
  if (nombre === 'sin agrupar' || nombre === 'agrupado por Tipo con hitos') {
    await comprobar(nombre + ': «Guardar PDF» tiene tantas páginas como el pie dice', paginasPdf(), m.pieN);
  }
  await cerrar();
}

console.log('--- 2. muchos asuntos y un asunto altísimo ---');
const FABRICAR = `async (op) => {
  const cols = [{ id: 'tipo', titulo: 'Tipo', clase: 'texto' }, { id: 'tercero', titulo: 'Tercero', clase: 'texto' }, { id: 'imp', titulo: 'Importe', clase: 'numero', sufijo: ' €' },
    { id: 'a', titulo: 'A', clase: 'texto' }, { id: 'b', titulo: 'B', clase: 'texto' }, { id: 'c', titulo: 'C', clase: 'texto' }, { id: 'd', titulo: 'D', clase: 'texto' }];
  const filas = [], registros = [];
  for (let i = 0; i < op.n; i++) {
    filas.push([{ k: 'texto', v: i < op.n / 3 ? 'Alfa' : (i < op.n * 2 / 3 ? 'Beta' : 'Gamma') }, { k: 'texto', v: 'Tercero ' + i }, { k: 'numero', v: i },
      { k: 'texto', v: 'a' + i }, { k: 'texto', v: 'b' + i }, { k: 'texto', v: 'c' + i }, { k: 'texto', v: 'd' + i }]);
    const nh = op.alto === i ? 80 : (op.hitos ? 1 + (i % 4) : 0);
    registros.push({ abierto: i % 5 !== 0, hitos: Array.from({ length: nh }, (_, h) => ({ n: h + 1, titulo: 'Hito número ' + (h + 1) + ' del asunto ' + i, estado: 'Hecho', responsable: 'Secretaría', plazo: '2026-10-05', terminado: '' })) });
  }
  const tabla = { columnas: cols, filas, total: op.n, sumas: { 2: 1 } };
  await ExportarInforme.abrir({ tabla, registros, filtros: {}, conHitos: !!(op.hitos || op.alto !== undefined), incluyeArchivados: true, por: 'prueba',
    agrupado: op.agrupar ? ExportarAgrupar.agrupar(tabla, ['tipo']) : null });
}`;
for (const [nombre, op] of [
  ['300 asuntos sin agrupar', { n: 300 }],
  ['300 asuntos agrupados con hitos', { n: 300, agrupar: true, hitos: true }],
]) {
  await pagina.evaluate(`(${FABRICAR})(${JSON.stringify(op)})`);
  await bien(nombre);
  await cerrar();
}
for (const agrupar of [false, true]) {
  const nombre = 'un asunto con 80 hitos' + (agrupar ? ' (agrupado)' : '');
  await pagina.evaluate(`(${FABRICAR})(${JSON.stringify({ n: 12, alto: 5, agrupar })})`);
  const m = await bien(nombre);
  await comprobar(nombre + ': se reparte en varias páginas con «(continúa)», cuenta como uno y la fila repetida no cuenta', pagina.evaluate(() => [
    document.querySelectorAll('tr.exportar-fila-continua').length >= 1, /\(continúa\)/.test(document.querySelector('tr.exportar-fila-continua').textContent),
    document.querySelectorAll('tr.exportar-fila').length, document.querySelector('.exportar-total-n').textContent.trim()]), [true, true, 12, '12 asuntos']);
  await comprobar(nombre + ': salen sus 80 hitos', pagina.evaluate(() => document.querySelectorAll('.exportar-hitos div').length >= 80), true);
  if (!agrupar) {
    console.log('--- 3. imprimir ---');
    await pagina.emulateMedia({ media: 'print' });
    const pdf = await pagina.pdf({ preferCSSPageSize: true, printBackground: true });
    await pagina.emulateMedia({ media: 'screen' });
    const hojas = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    await comprobar('imprimir: tantas hojas como páginas del informe', Promise.resolve(hojas), m.paginas);
  }
  await cerrar();
}

console.log('--- 4. un informe roto avisa y no deja guardar ---');
await pagina.evaluate(`(${FABRICAR})(${JSON.stringify({ n: 30 })})`);
await pagina.waitForTimeout(1500);
await comprobar('4. entero: sin aviso y con los dos botones encendidos', pagina.evaluate(() => [
  !!document.querySelector('#exportar-visor .exportar-aviso:not(.oculto)'), document.querySelector('.exportar-guardar-pdf').disabled, document.querySelector('.exportar-imprimir').disabled]), [false, false, false]);
await pagina.evaluate(() => { document.querySelectorAll('tr.exportar-fila td')[0].style.paddingBottom = '500px'; });
await pagina.evaluate(() => ExportarInforme.revisar());
await comprobar('4. roto: aviso rojo con el texto pedido y los dos botones apagados', pagina.evaluate(() => {
  const a = document.querySelector('#exportar-visor .exportar-aviso:not(.oculto)');
  return [a ? /^Este listado no está completo: se ven \d+ de 30 asuntos\. No lo guardes ni lo imprimas; avisa con el botón «Soporte»\.$/.test(a.textContent.trim()) : null,
    document.querySelector('.exportar-guardar-pdf').disabled, document.querySelector('.exportar-imprimir').disabled];
}), [true, true, true]);
await cerrar();

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
