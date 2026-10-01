/* Fila 241 (1-oct-2026, docs/EXPORTAR-ASUNTOS.md): el filtro «Fechas» de
   Inicio y «Exportar ▾» (hoja de cálculo e informe en PDF). Con Chromium
   real y los datos inventados de la copia de pruebas (?demo=1&auto=1):
   hay cobros del seguro escolar (tipo con campo «Importe»), cuatro abiertos (tres ya «Por liquidar», fila 249)
   y tres archivados, y un asunto reservado (CERTIFICADO de Herrera). */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const requerir = createRequire(import.meta.url);
const JSZip = requerir('../js/lib/jszip.min.js');

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

function isoHaceDias(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");   /* fila 248: la ventana «Qué hay de nuevo» no tapa la prueba */
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

/* ================= LO PURO ================= */

await comprobar('leerNumero entiende «12», «12,50», «12,50 €» y «1.234,00»',
  pagina.evaluate(() => ['12', '12,50', '12,50 €', '1.234,00', '1234.5', 'doce', '', '1,2,3'].map((t) => ExportarAsuntos.leerNumero(t))),
  [12, 12.5, 12.5, 1234, 1234.5, null, null, null]);
await comprobar('formatoNumero escribe a la española',
  pagina.evaluate(() => [1234.5, 345, 0, 1234567.891, -2.5].map((n) => ExportarAsuntos.formatoNumero(n))),
  ['1.234,50', '345,00', '0,00', '1.234.567,89', '-2,50']);
await comprobar('pasaFiltroFechas: los dos extremos entran, sin extremos todo pasa, sin fecha no pasa',
  pagina.evaluate(() => [
    App.pasaFiltroFechas('2026-10-01', '2026-10-01', '2026-10-31'), App.pasaFiltroFechas('2026-10-31', '2026-10-01', '2026-10-31'),
    App.pasaFiltroFechas('2026-09-30', '2026-10-01', '2026-10-31'), App.pasaFiltroFechas('2026-11-01', '2026-10-01', ''),
    App.pasaFiltroFechas('', '', ''), App.pasaFiltroFechas('', '2026-10-01', '')]),
  [true, true, false, true, true, false]);
await comprobar('textoDeFechas',
  pagina.evaluate(() => [App.textoDeFechas('2026-10-01', '2026-10-31'), App.textoDeFechas('2026-10-01', ''), App.textoDeFechas('', '2026-10-31')]),
  ['del 1-oct-2026 al 31-oct-2026', 'desde el 1-oct-2026', 'hasta el 31-oct-2026']);
await comprobar('una columna de campo es de cantidades por su contenido, no por su nombre',
  pagina.evaluate(() => {
    const regs = [{ reservado: false, campos: { Raro: '12,50', Texto: 'hola' } }, { reservado: false, campos: { Raro: '1.234,00 €', Texto: '3' } }, { reservado: false, campos: { Raro: '', Texto: '' } }];
    const t = ExportarAsuntos.tabla(regs, ExportarAsuntos.columnasDeCampos(regs, []));
    return [t.columnas.map((c) => c.titulo + ':' + c.clase), t.sumas, t.total];
  }),
  [['Raro:numero', 'Texto:texto'], { 0: 1246.5 }, 3]);

/* ================= EL FILTRO «FECHAS» ================= */

const cuentaTodos = await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto]').count();
await pagina.click('#btn-filtros');
await comprobar('el filtro «Fechas» está en «Filtros», con Desde y Hasta', pagina.locator('#filtro-fecha-desde, #filtro-fecha-hasta').count(), 2);
await pagina.fill('#filtro-fecha-desde', isoHaceDias(6));
await pagina.fill('#filtro-fecha-hasta', isoHaceDias(1));
await pagina.waitForFunction((n) => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length < n, cuentaTodos);
await comprobar('con Desde y Hasta solo salen los asuntos iniciados entre esos días (los dos extremos entran)',
  pagina.locator('#inicio-tabla-cuerpo tr[data-asunto]').count(), 5);
await comprobar('«Filtros (1)» cuenta Fechas como uno', pagina.locator('#btn-filtros').textContent(), 'Filtros (1)');
await comprobar('la línea de filtros dice «Fechas: del … al …»',
  pagina.locator('#barra-filtros, .filtros-barra, .chip').allTextContents().then((t) => t.join(' ').indexOf('Fechas: del ') !== -1), true);
await comprobar('las cuatro pestañas cuentan solo lo de las fechas',
  pagina.locator('.inicio-pestana[data-pestana="todos"] .cuenta-lista').textContent(), '5');
await pagina.click('.boton-limpiar');
await pagina.waitForFunction((n) => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length === n, cuentaTodos);
await comprobar('«Limpiar todo» quita las fechas', pagina.locator('#filtro-fecha-desde').inputValue(), '');

/* ================= HOJA DE CÁLCULO ================= */

async function abrirExportar(opcion) {
  await pagina.click('#btn-exportar');
  await pagina.click(opcion === 'hoja' ? '#btn-exportar-hoja' : '#btn-exportar-pdf');
  await pagina.waitForSelector('#capa:not(.oculto) #exp-columnas');
}

await abrirExportar('hoja');
await comprobar('la ventana lleva «Incluir también los archivados» desmarcada', pagina.locator('#exp-archivados').isChecked(), false);
await comprobar('la primera vez van marcadas las columnas de la tabla de Inicio',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#exp-columnas input:checked')).map((c) => c.dataset.col)),
  ['limite', 'tercero', 'tipo', 'hitoActual', 'leToca', 'inicio']);
const [descarga] = await Promise.all([pagina.waitForEvent('download'), pagina.click('#cuadro-aceptar')]);
const rutaXlsx = await descarga.path();
const libro = await JSZip.loadAsync(fs.readFileSync(rutaXlsx));
const hoja1 = await libro.file('xl/worksheets/sheet1.xml').async('string');
const hoja2 = await libro.file('xl/worksheets/sheet2.xml').async('string');
const nombresDeHojas = await libro.file('xl/workbook.xml').async('string');
await comprobar('el fichero se llama AAMMDD Asuntos.xlsx', /^\d{6} Asuntos\.xlsx$/.test(descarga.suggestedFilename()), true);
await comprobar('tiene la pestaña «Asuntos» y la pestaña «Hitos»', /name="Asuntos"/.test(nombresDeHojas) && /name="Hitos"/.test(nombresDeHojas), true);
await comprobar('en «Asuntos» hay una fila por asunto, la cabecera y la línea del total',
  (hoja1.match(/<row /g) || []).length, cuentaTodos + 2);
await comprobar('al final de «Asuntos» sale «N asuntos»', hoja1.indexOf(cuentaTodos + ' asuntos') !== -1, true);
await comprobar('en «Hitos» hay filas de hitos', (hoja2.match(/<row /g) || []).length > 1, true);
await comprobar('las fechas son fechas (número de serie con formato), no texto', /<c r="[A-Z]+2" s="2"><v>\d+<\/v><\/c>/.test(hoja1), true);

/* ================= INFORME EN PDF, CON ARCHIVADOS ================= */

await pagina.selectOption('#filtro-tipo-asunto', 'SEGURO ESCOLAR');
await pagina.waitForFunction(() => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length === 4);
await abrirExportar('pdf');
await comprobar('se recuerda la última elección de columnas, por separado para el PDF (la hoja no la cambió)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#exp-columnas input:checked')).map((c) => c.dataset.col)),
  ['limite', 'tercero', 'tipo', 'hitoActual', 'leToca', 'inicio']);
await pagina.check('#exp-archivados');
await pagina.waitForSelector('#exp-columnas input[data-col="campo:Importe"]');
await pagina.waitForFunction(() => !document.getElementById('exp-nota') || document.getElementById('exp-nota').classList.contains('oculto'));
await comprobar('con archivados, la columna «Situación» va siempre (marcada y fija)',
  pagina.evaluate(() => { const c = document.querySelector('#exp-columnas input[data-col="situacion"]'); return [c.checked, c.disabled]; }), [true, true]);
await pagina.check('#exp-columnas input[data-col="campo:Importe"]');
await pagina.uncheck('#exp-columnas input[data-col="hitoActual"]');
await pagina.check('#exp-hitos');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#exportar-visor:not(.oculto) section.exportar-pagina', { timeout: 20000 });
const informe = await pagina.locator('#exportar-visor').innerText();
await comprobar('el informe se abre en el visor, con título y los tres botones',
  pagina.evaluate(() => [
    document.querySelector('#exportar-visor .exportar-titulo').textContent,
    !!document.querySelector('.exportar-guardar-pdf'), !!document.querySelector('.exportar-imprimir'), !!document.querySelector('.exportar-cerrar')]),
  ['Listado de asuntos', true, true, true]);
await comprobar('lleva el membrete (imagen o, sin ella, el rótulo de la Junta)',
  pagina.locator('#exportar-visor .exportar-membrete, #exportar-visor .exportar-membrete-texto').count().then((n) => n > 0), true);
await comprobar('sale el asunto archivado, marcado «Archivado»', (informe.match(/Archivado/g) || []).length >= 3, true);
await comprobar('y los abiertos, marcados «Abierto»', (informe.match(/Abierto/g) || []).length >= 2, true);
await comprobar('al final, «7 asuntos»', informe.indexOf('7 asuntos') !== -1, true);
await comprobar('y el total del importe, a la española', informe.indexOf('Total Importe: 6,72 €') !== -1, true);
await comprobar('con «Incluir los hitos», debajo de cada asunto salen sus hitos', pagina.locator('#exportar-visor .exportar-hitos').count().then((n) => n > 0), true);
await comprobar('la línea de filtros dice la pestaña, el tipo y que incluye los archivados',
  pagina.locator('#exportar-visor .exportar-filtros').textContent().then((t) => t.indexOf('Tipo:') !== -1 && t.indexOf('Incluye también los archivados') !== -1), true);
await pagina.click('.exportar-cerrar');
await comprobar('«Cerrar» cierra el visor', pagina.locator('#exportar-visor').isHidden(), true);

/* ================= ASUNTO RESERVADO ================= */

await pagina.selectOption('#filtro-tipo-asunto', 'CERTIFICADO');
await pagina.waitForFunction(() => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length === 4);
await abrirExportar('pdf');
await pagina.check('#exp-columnas input[data-col="carpeta"]');
await pagina.check('#exp-columnas input[data-col="loPide"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#exportar-visor:not(.oculto) section.exportar-pagina');
const informe2 = await pagina.locator('#exportar-visor').innerText();
await comprobar('un asunto reservado sale como «Reservado», sin su nombre ni su identificador ni el de su carpeta',
  [informe2.indexOf('Reservado') !== -1, informe2.indexOf('Herrera') === -1, informe2.indexOf('2100009') === -1],
  [true, true, true]);
await comprobar('y el que no es reservado sí enseña su tercero', informe2.indexOf('Espejo') !== -1, true);
await pagina.click('.exportar-cerrar');

/* ================= NADA QUE EXPORTAR ================= */

await pagina.fill('#filtro-fecha-desde', '2020-01-01');
await pagina.fill('#filtro-fecha-hasta', '2020-01-31');
await pagina.waitForFunction(() => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length === 0);
await abrirExportar('hoja');
await comprobar('sin asuntos y sin archivados, el botón avisa y no deja exportar',
  pagina.evaluate(() => [document.getElementById('cuadro-aceptar').disabled, document.getElementById('exp-nota').textContent]),
  [true, 'No hay asuntos que exportar con estos filtros']);
await pagina.click('#cuadro-cancelar');
await comprobar('al cancelar, el botón del cuadro vuelve a estar activo', pagina.locator('#cuadro-aceptar').isEnabled(), true);

await comprobar('la consola no tiene errores', errores, []);

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobación(es) fallan.'); process.exit(1); }
console.log('\nTodo bien.');
