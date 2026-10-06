/* Prueba de la fila 278 de docs/COLA.md (docs/INFORME-AGRUPADO.md): el informe en PDF de
   «Exportar», agrupado por una o dos columnas. Con Chromium real y los datos inventados
   de la copia de pruebas (?demo=1&auto=1). */
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

console.log('--- 1. el cálculo ---');
const TABLA = `(() => {
  const cols = [{ id: 'tipo', titulo: 'Tipo', clase: 'texto' }, { id: 'limite', titulo: 'Plazo', clase: 'fecha' },
    { id: 'imp', titulo: 'Importe', clase: 'numero', sufijo: ' €' }, { id: 'tercero', titulo: 'Tercero', clase: 'texto' }];
  const t = (v) => ({ k: 'texto', v }), f = (v) => /^\\d{4}-/.test(v) ? { k: 'fecha', v } : { k: 'texto', v }, n = (v) => v === null ? { k: 'texto', v: '' } : { k: 'numero', v };
  const filas = [
    [t('Cert'), f('2026-10-05'), n(10), t('Reservado')],
    [t('  CERT '), f('2026-10-20'), n(20.5), t('Ana')],
    [t('Acta'), f(''), n(null), t('Luis')],
    [t('Grupo 10'), f('2026-09-01'), n(1), t('Eva')],
    [t('Grupo 2'), f('2026-11-02'), n(2), t('Eva')],
    [t(''), f('texto suelto'), n(3), t('Reservado')]
  ];
  return { columnas: cols, filas, total: filas.length, sumas: { 2: 36.5 } };
})()`;
await comprobar('por Tipo: sin distinguir mayúsculas ni espacios, «Grupo 2» antes que «Grupo 10», «Sin dato» el último', pagina.evaluate((src) => {
  const r = ExportarAgrupar.agrupar(eval(src), ['tipo']);
  return r.bloques.map((b) => b.titulo + ' ' + b.n);
}, TABLA), ['Tipo: Acta 1', 'Tipo: Cert 2', 'Tipo: Grupo 2 1', 'Tipo: Grupo 10 1', 'Tipo: Sin dato 1']);
await comprobar('por Plazo: un bloque por mes en orden de calendario, los textos sueltos después, «Sin dato» al final', pagina.evaluate((src) => {
  const r = ExportarAgrupar.agrupar(eval(src), ['limite']);
  return r.bloques.map((b) => b.titulo);
}, TABLA), ['Plazo: Septiembre de 2026', 'Plazo: Octubre de 2026', 'Plazo: Noviembre de 2026', 'Plazo: texto suelto', 'Plazo: Sin dato']);
await comprobar('dos niveles: Tipo y, dentro, Plazo; las columnas de agrupar no salen en las tablas', pagina.evaluate((src) => {
  const t = eval(src);
  const r = ExportarAgrupar.agrupar(t, ['tipo', 'limite']);
  return [r.niveles.map((x) => x.titulo), r.posiciones, r.bloques[1].hijos.map((h) => h.titulo + ' ' + h.n), ExportarAgrupar.textoDeAgrupado(r)];
}, TABLA), [['Tipo', 'Plazo'], [2, 3], ['Plazo: Octubre de 2026 2'], 'Agrupado por: Tipo y Plazo']);
await comprobar('la línea de cierre lleva el valor, los asuntos y la suma de cada columna de cantidades que sale', pagina.evaluate((src) => {
  const t = eval(src);
  const r = ExportarAgrupar.agrupar(t, ['tipo']);
  return [ExportarAgrupar.lineaDeCierre(t, r, r.bloques[1]), ExportarAgrupar.lineaDeCierre(t, r, r.bloques[0])];
}, TABLA), ['Cert: 2 asuntos · Total Importe: 30,50 €', 'Acta: 1 asunto · Total Importe: 0,00 €']);
await comprobar('agrupando por la única columna que había, no se quita ninguna de las tablas', pagina.evaluate(() => {
  const t = { columnas: [{ id: 'a', titulo: 'A', clase: 'texto' }], filas: [[{ k: 'texto', v: 'x' }]], total: 1, sumas: {} };
  return ExportarAgrupar.agrupar(t, ['a']).posiciones;
}), [0]);
await comprobar('un asunto reservado va a su bloque «Reservado»', pagina.evaluate((src) => ExportarAgrupar.agrupar(eval(src), ['tercero']).bloques.map((b) => b.texto), TABLA),
  ['Ana', 'Eva', 'Luis', 'Reservado']);

console.log('--- 2. la ventana ---');
async function abrirExportar(opcion) {
  await pagina.click('#btn-exportar');
  await pagina.click(opcion === 'hoja' ? '#btn-exportar-hoja' : '#btn-exportar-pdf');
  await pagina.waitForSelector('#capa:not(.oculto) #exp-columnas');
}
const informe = () => pagina.locator('#exportar-visor').innerText();
async function exportarYEsperar() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#exportar-visor:not(.oculto) section.exportar-pagina', { timeout: 20000 });
  await pagina.waitForTimeout(300);
}
const cerrarInforme = () => pagina.click('.exportar-cerrar');
const titulosAgrupar = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#exp-agrupar-1 option')).map((o) => o.textContent));

await abrirExportar('hoja');
await comprobar('1. en la hoja de cálculo no hay desplegables de agrupar', pagina.locator('#exp-agrupar-1').count(), 0);
await pagina.click('#cuadro-cancelar');
await abrirExportar('pdf');
await comprobar('2. «Agrupar por» e «Y dentro, por», en «(sin agrupar)»; el segundo apagado', pagina.evaluate(() => [
  document.getElementById('exp-agrupar-1').value, document.getElementById('exp-agrupar-2').value, document.getElementById('exp-agrupar-2').disabled]), ['', '', true]);
await comprobar('2. ofrece exactamente las columnas marcadas', pagina.evaluate(() => {
  const marcadas = Array.from(document.querySelectorAll('#exp-columnas input:checked')).map((c) => c.parentNode.textContent.trim());
  const ofrecidas = Array.from(document.querySelectorAll('#exp-agrupar-1 option')).map((o) => o.textContent).slice(1);
  return JSON.stringify(marcadas) === JSON.stringify(ofrecidas) && marcadas.length > 0;
}), true);
await exportarYEsperar();
await comprobar('3. sin agrupar: una sola tabla, sin títulos de bloque, y el total al final', pagina.evaluate(() => [
  document.querySelectorAll('#exportar-visor .exportar-tabla').length, document.querySelectorAll('#exportar-visor .exportar-bloque-titulo').length,
  /\d+ asuntos?/.test(document.querySelector('#exportar-visor .exportar-totales').textContent)]), [1, 0, true]);
const totalSin = await pagina.locator('#exportar-visor .exportar-totales').innerText();
await cerrarInforme();

console.log('--- 4 y 5. agrupar por Tipo ---');
await abrirExportar('pdf');
await pagina.selectOption('#exp-agrupar-1', 'tipo');
await exportarYEsperar();
await comprobar('4. la línea de filtros termina en «Agrupado por: Tipo»', pagina.locator('#exportar-visor .exportar-filtros').textContent().then((t) => /Agrupado por: Tipo$/.test(t.trim())), true);
await comprobar('4. títulos «Tipo: …» en orden alfabético y las tablas sin la columna «Tipo»', pagina.evaluate(() => {
  const t = Array.from(document.querySelectorAll('#exportar-visor .exportar-bloque-titulo')).map((e) => e.textContent.replace(' (continúa)', ''));
  const unicos = t.filter((x, i) => t.indexOf(x) === i);
  const orden = unicos.every((x, i) => i === 0 || unicos[i - 1].localeCompare(x, 'es', { sensitivity: 'base' }) <= 0);
  const cab = Array.from(document.querySelectorAll('#exportar-visor .exportar-tabla thead th')).map((e) => e.textContent);
  return [unicos.length > 1, unicos.every((x) => /^Tipo: /.test(x)), orden, cab.indexOf('Tipo') === -1];
}), [true, true, true, true]);
await comprobar('4. cada bloque termina con su valor y «N asuntos», y N coincide con las filas', pagina.evaluate(() => {
  const cierres = Array.from(document.querySelectorAll('#exportar-visor .exportar-cierre'));
  const filas = document.querySelectorAll('#exportar-visor tbody.exportar-asunto').length;
  const suma = cierres.reduce((a, c) => a + parseInt((c.textContent.match(/: (\d+) asuntos?/) || [0, 0])[1], 10), 0);
  return [cierres.length > 1, suma === filas];
}), [true, true]);
await comprobar('5. la suma de los bloques es el «N asuntos» del total, que sigue saliendo', pagina.evaluate(() => {
  const filas = document.querySelectorAll('#exportar-visor tbody.exportar-asunto').length;
  return document.querySelector('#exportar-visor .exportar-total-n').textContent.trim() === filas + (filas === 1 ? ' asunto' : ' asuntos');
}), true);
await cerrarInforme();

console.log('--- 6. se recuerda, y se vacía si se desmarca la columna ---');
await abrirExportar('pdf');
await comprobar('6. recuerda «Tipo»', pagina.locator('#exp-agrupar-1').inputValue(), 'tipo');
await pagina.uncheck('#exp-columnas input[data-col="tipo"]');
await comprobar('6. desmarcada, vuelve a «(sin agrupar)» y «Tipo» ya no es opción', [await pagina.locator('#exp-agrupar-1').inputValue(), (await titulosAgrupar()).indexOf('Tipo')], ['', -1]);
await pagina.check('#exp-columnas input[data-col="tipo"]');

console.log('--- 7. dos niveles ---');
await pagina.check('#exp-columnas input[data-col="organo"]');
await pagina.selectOption('#exp-agrupar-1', 'organo');
await comprobar('7. «Y dentro, por» se enciende y no ofrece «Lo encarga»', pagina.evaluate(() => [
  document.getElementById('exp-agrupar-2').disabled, Array.from(document.querySelectorAll('#exp-agrupar-2 option')).map((o) => o.textContent).indexOf('Lo encarga')]), [false, -1]);
await pagina.selectOption('#exp-agrupar-2', 'tipo');
await exportarYEsperar();
await comprobar('7. títulos de fuera y de dentro, tablas sin esas columnas, cierres de dentro y de fuera', pagina.evaluate(() => {
  const ext = document.querySelectorAll('#exportar-visor .exportar-bloque-exterior').length, int = document.querySelectorAll('#exportar-visor .exportar-bloque-interior').length;
  const cab = Array.from(document.querySelectorAll('#exportar-visor .exportar-tabla thead th')).map((e) => e.textContent);
  const ci = document.querySelectorAll('#exportar-visor .exportar-cierre-interior').length, ce = document.querySelectorAll('#exportar-visor .exportar-cierre-exterior').length;
  const t1 = document.querySelector('#exportar-visor .exportar-bloque-exterior').textContent, t2 = document.querySelector('#exportar-visor .exportar-bloque-interior').textContent;
  return [ext > 0, int >= ext, cab.indexOf('Tipo') === -1 && cab.indexOf('Lo encarga') === -1, ci >= ce && ce > 0, /^Lo encarga: /.test(t1), /^Tipo: /.test(t2)];
}), [true, true, true, true, true, true]);
await cerrarInforme();

console.log('--- 8. por fechas ---');
await abrirExportar('pdf');
await pagina.selectOption('#exp-agrupar-1', 'limite');
await pagina.selectOption('#exp-agrupar-2', '');
await exportarYEsperar();
await comprobar('8. los bloques del plazo se titulan con el mes y el año, en orden de calendario, «Sin dato» al final', pagina.evaluate(() => {
  const t = Array.from(document.querySelectorAll('#exportar-visor .exportar-bloque-titulo')).map((e) => e.textContent.replace(' (continúa)', '')).filter((x, i, l) => l.indexOf(x) === i);
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const con = t.filter((x) => !/Sin dato$/.test(x));
  const valores = con.map((x) => { const m = x.match(/^Plazo: (\w+) de (\d{4})$/); return m ? parseInt(m[2], 10) * 12 + meses.indexOf(m[1]) : -1; });
  return [con.every((x) => /^Plazo: \w+ de \d{4}$/.test(x)), valores.every((v, i) => i === 0 || valores[i - 1] <= v), t.indexOf('Plazo: Sin dato') === -1 || t.indexOf('Plazo: Sin dato') === t.length - 1];
}), [true, true, true]);
await cerrarInforme();

console.log('--- 9 y 11. importes y hitos ---');
await abrirExportar('pdf');
await pagina.check('#exp-archivados');
await pagina.waitForSelector('#exp-columnas input[data-col="campo:Importe"]');
await pagina.waitForFunction(() => !document.getElementById('exp-nota') || document.getElementById('exp-nota').classList.contains('oculto'));
await comprobar('13. con archivados, lo elegido no se pierde y «Situación» sale entre las opciones', [await pagina.locator('#exp-agrupar-1').inputValue(), (await titulosAgrupar()).some((x) => /^Situación/.test(x))], ['limite', true]);
await pagina.check('#exp-columnas input[data-col="campo:Importe"]');
await pagina.selectOption('#exp-agrupar-1', 'tipo');
await pagina.check('#exp-hitos');
await exportarYEsperar();
await comprobar('9. el cierre del seguro escolar lleva «Total Importe» y el total general no cambia', pagina.evaluate(() => {
  const c = Array.from(document.querySelectorAll('#exportar-visor .exportar-cierre')).filter((e) => /SEGURO ESCOLAR/.test(e.textContent));
  const total = document.querySelector('#exportar-visor .exportar-totales').textContent;
  return [c.length > 0, /Total Importe: [\d.,]+ €/.test(c[0] ? c[0].textContent : ''), /Total Importe: 6,72 €/.test(total)];
}), [true, true, true]);
await comprobar('11. con hitos, salen debajo de cada asunto, dentro de su bloque', pagina.evaluate(() => document.querySelectorAll('#exportar-visor tbody.exportar-asunto .exportar-hitos').length > 0), true);
await comprobar('14. «Guardar PDF» descarga el fichero', (async () => {
  const [descarga] = await Promise.all([pagina.waitForEvent('download', { timeout: 60000 }), pagina.click('.exportar-guardar-pdf')]);
  return /^\d{6} Listado de asuntos\.pdf$/.test(descarga.suggestedFilename());
})(), true);
await cerrarInforme();

console.log('--- 10. un asunto reservado ---');
await pagina.click('#btn-filtros');
await pagina.selectOption('#filtro-tipo-asunto', 'CERTIFICADO');
await pagina.waitForFunction(() => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length === 2);
await abrirExportar('pdf');
await pagina.selectOption('#exp-agrupar-1', 'tercero');
await exportarYEsperar();
const inf = await informe();
await comprobar('10. el reservado va al bloque «Tercero: Reservado» y su nombre no sale en ningún sitio', [inf.indexOf('Tercero: Reservado') !== -1, inf.indexOf('Herrera') === -1, inf.indexOf('2100009') === -1], [true, true, true]);
await cerrarInforme();

console.log('--- 12. el corte de páginas ---');
await comprobar('12. con muchos asuntos: ningún título suelto, cierres con su último asunto, «(continúa)» arriba', pagina.evaluate(async () => {
  const cols = [{ id: 'tipo', titulo: 'Tipo', clase: 'texto' }, { id: 'tercero', titulo: 'Tercero', clase: 'texto' }, { id: 'imp', titulo: 'Importe', clase: 'numero', sufijo: ' €' }];
  const filas = [], registros = [];
  for (let i = 0; i < 70; i++) {
    filas.push([{ k: 'texto', v: i < 33 ? 'Alfa' : (i < 50 ? 'Beta' : 'Gamma') }, { k: 'texto', v: 'Tercero ' + i }, { k: 'numero', v: i }]);
    registros.push({ abierto: true, hitos: [] });
  }
  const tabla = { columnas: cols, filas, total: 70, sumas: { 2: 2415 } };
  await ExportarInforme.abrir({ tabla, registros, filtros: {}, conHitos: false, incluyeArchivados: false, por: 'prueba', agrupado: ExportarAgrupar.agrupar(tabla, ['tipo']) });
  const paginas = Array.from(document.querySelectorAll('#exportar-visor section.exportar-pagina'));
  let tituloSuelto = false, cierreSuelto = false, continua = 0;
  paginas.forEach((p) => {
    const hijos = Array.from(p.querySelector('.exportar-contenido').children);
    const ult = hijos[hijos.length - 1];
    if (ult && ult.classList.contains('exportar-bloque-titulo')) tituloSuelto = true;
    hijos.forEach((h, i) => {
      if (h.classList.contains('exportar-cierre') && i > 0 && hijos[i - 1].classList.contains('exportar-cierre') === false && !hijos[i - 1].classList.contains('exportar-tabla')) cierreSuelto = true;
      if (h.classList.contains('exportar-bloque-titulo') && /\(continúa\)/.test(h.textContent)) continua++;
    });
  });
  const r = [paginas.length > 1, tituloSuelto, cierreSuelto, continua > 0];
  document.querySelector('.exportar-cerrar').click();
  return r;
}), [true, false, false, true]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
