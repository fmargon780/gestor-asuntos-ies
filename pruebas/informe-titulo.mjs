/* Prueba de la fila 308 de docs/COLA.md (docs/TITULO-DEL-INFORME-EN-PDF.md): la casilla «Título» del informe
   en PDF de «Exportar», el título en la hoja, en la barra del visor y en el nombre del fichero.
   Con Chromium real y la copia de demostración (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1000 } });
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const aammdd = (() => { const d = new Date(); return String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); })();

async function abrirVentana(destino) {
  await pagina.click('#btn-exportar');
  await pagina.click(destino === 'pdf' ? '#btn-exportar-pdf' : '#btn-exportar-hoja');
  await pagina.waitForSelector('#capa:not(.oculto) #exp-columnas');
}
async function informe(titulo, agrupar) {
  await abrirVentana('pdf');
  if (titulo !== null) await pagina.fill('#exp-titulo', titulo);
  if (agrupar) await pagina.selectOption('#exp-agrupar-1', agrupar);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForSelector('#exportar-visor h1.exportar-titulo', { timeout: 20000 });
  await pagina.waitForTimeout(2000);
}
const leer = () => pagina.evaluate(() => ({
  h1: document.querySelector('#exportar-visor h1.exportar-titulo').textContent,
  html: document.querySelector('#exportar-visor h1.exportar-titulo').innerHTML,
  barra: document.querySelector('#exportar-visor .word-visor-nombre').textContent,
  fichero: ExportarInforme.nombrePdf()
}));
async function cerrar() { await pagina.evaluate(() => ExportarInforme.cerrar()); }

/* 1. La casilla en el PDF y no en la hoja */
await abrirVentana('pdf');
await comprobar('1. el PDF trae la casilla «Título» con «Listado de asuntos»', await pagina.inputValue('#exp-titulo'), 'Listado de asuntos');
await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa.oculto', { state: 'attached' }).catch(() => {});
await abrirVentana('hoja');
await comprobar('1. la hoja de cálculo no la trae', await pagina.locator('#exp-titulo').count(), 0);
await pagina.keyboard.press('Escape');

/* 2. Sin tocar */
await informe(null);
let r = await leer();
await comprobar('2. sin tocar: h1, barra y fichero', [r.h1, r.barra, r.fichero], ['Listado de asuntos', 'Listado de asuntos', aammdd + ' Listado de asuntos.pdf']);
await cerrar();

/* 3. Un título propio, también en el fichero que se descarga */
await informe('Cobros de matricula por unidad');
r = await leer();
await comprobar('3. título propio: h1, barra y fichero', [r.h1, r.barra, r.fichero], ['Cobros de matricula por unidad', 'Cobros de matricula por unidad', aammdd + ' Cobros de matricula por unidad.pdf']);
const [descarga] = await Promise.all([pagina.waitForEvent('download', { timeout: 60000 }), pagina.click('#exportar-visor .exportar-guardar-pdf')]);
await comprobar('3. el fichero descargado lleva el título', descarga.suggestedFilename(), aammdd + ' Cobros de matricula por unidad.pdf');
await cerrar();

/* 4. Signos raros y espacios */
await informe('  Cobros 1º/2º: «ESO» <b>  ');
r = await leer();
await comprobar('4. el h1 va tal cual y sin negrita', [r.h1, r.html.indexOf('<b>') === -1], ['Cobros 1º/2º: «ESO» <b>', true]);
await comprobar('4. el fichero no lleva / : < >', /[\/:<>]/.test(r.fichero.replace(/\.pdf$/, '')), false);
await cerrar();

/* 5. Vacío y solo espacios */
for (const t of ['', '    ']) {
  await informe(t);
  r = await leer();
  await comprobar('5. «' + t + '» da el título de siempre', [r.h1, r.barra, r.fichero], ['Listado de asuntos', 'Listado de asuntos', aammdd + ' Listado de asuntos.pdf']);
  await cerrar();
}

/* 6. Un título de 120 caracteres con «Agrupar por» */
const largo = ('Palabra '.repeat(15)).trim().slice(0, 120);
await informe(largo, 'tipo');
const m = await pagina.evaluate(() => {
  const pags = Array.from(document.querySelectorAll('#exportar-visor section.exportar-pagina'));
  let visibles = 0, desbordan = 0;
  pags.forEach((p) => {
    const cs = getComputedStyle(p), rr = p.getBoundingClientRect();
    const limite = rr.bottom - parseFloat(cs.paddingBottom) + 0.5;
    if (p.querySelector('.exportar-contenido').getBoundingClientRect().bottom > limite) desbordan++;
    p.querySelectorAll('tr.exportar-fila').forEach((f) => { if (f.getBoundingClientRect().bottom <= limite) visibles++; });
  });
  const n = document.querySelector('.exportar-total-n');
  return { desbordan, ok: n ? visibles === parseInt(n.textContent, 10) : false, aviso: !!document.querySelector('#exportar-visor .exportar-aviso:not(.oculto)') };
});
await comprobar('6. título largo: nada desborda, se ven todos, sin aviso', [m.desbordan, m.ok, m.aviso], [0, true, false]);
await cerrar();

/* 7. No se recuerda */
await abrirVentana('pdf');
await comprobar('7. al volver a abrir, otra vez «Listado de asuntos»', await pagina.inputValue('#exp-titulo'), 'Listado de asuntos');
await pagina.keyboard.press('Escape');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? 'FALLAN ' + fallos : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
