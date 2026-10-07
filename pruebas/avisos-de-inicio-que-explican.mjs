/* Fila 292 (docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartados 5 y 6): los dos avisos de Inicio que no
   avisaban, y «Borrados que se fusionan», cuya lista salía siempre vacía.
   Chromium real con la copia de pruebas (?demo=1&auto=1).

   1. «N asuntos que se repiten toca crearlos» abre un cuadro con la lista y «Crear N asuntos» / «Cancelar».
      Cancelar no crea ninguno; Crear sí.
   2. «N aspirantes sin Nº de identificación escolar» lleva a la lista, y encima sale la línea que dice qué hacer;
      la línea se quita al cambiar de lista.
   3. Herramientas → «Borrados que se fusionan»: la lista sale con lo recordado, y su texto no nombra ficheros. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForSelector('[data-aviso="recurrentes"]', { timeout: 30000 });
await pagina.waitForSelector('[data-aviso="aspirantes"]', { timeout: 30000 });
await pagina.waitForTimeout(800);

const facturas = () => pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((k) => /FACTURA/.test(k)).length);

console.log('--- 1. los asuntos que se repiten ---');
await comprobar('1. el aviso lo dice', pagina.locator('[data-aviso="recurrentes"]').textContent(), '1 asunto que se repite toca crearlo');
const antes = await facturas();
await pagina.click('[data-aviso="recurrentes"]');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('1. se abre un cuadro con la lista (tipo y tercero) y los botones «Crear 1 asunto» y «Cancelar»',
  pagina.evaluate(() => [document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent,
    [...document.querySelectorAll('#cuadro-cuerpo li')].map((l) => l.textContent)]),
  ['Crear 1 asunto', 'Cancelar', ['FACTURA · Copistería Central 99887766X']]);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(500);
await comprobar('1. «Cancelar»: no se ha creado ninguno y el aviso sigue', [await facturas(), await pagina.locator('[data-aviso="recurrentes"]').count()], [antes, 1]);
await pagina.click('[data-aviso="recurrentes"]');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction((n) => Object.keys(App.E.registro.asuntos).filter((k) => /FACTURA/.test(k)).length === n, antes + 1, { timeout: 15000 });
await comprobar('1. «Crear»: se crea y el aviso desaparece', pagina.waitForFunction(() => !document.querySelector('[data-aviso="recurrentes"]'), null, { timeout: 15000 }).then(() => true), true);

console.log('--- 2. los aspirantes sin número ---');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(800);
await pagina.waitForSelector('[data-aviso="aspirantes"]');
await comprobar('2. el aviso lo dice', pagina.locator('[data-aviso="aspirantes"]').textContent(), '1 aspirante sin Nº de identificación escolar');
await comprobar('2. antes de pulsar, la línea no se ve', pagina.locator('#personas-aviso-aspirantes').isHidden(), true);
await pagina.click('[data-aviso="aspirantes"]');
await pagina.waitForTimeout(500);
await comprobar('2. lleva a la lista de alumnado y encima sale la línea con lo que hay que hacer',
  pagina.evaluate(() => [!document.getElementById('pantalla-personas').classList.contains('oculto'), document.getElementById('filtro-personas').value,
    document.getElementById('personas-aviso-aspirantes').offsetParent !== null, document.getElementById('personas-aviso-aspirantes').textContent,
    !!(document.getElementById('personas-aviso-aspirantes').compareDocumentPosition(document.getElementById('lista-personas')) & Node.DOCUMENT_POSITION_FOLLOWING)]),
  [true, 'ALUMNADO', true, 'Cuando tengas su Nº de identificación escolar, escríbelo en su ficha. Sus carpetas cambian de nombre solas.', true]);
await pagina.fill('#buscar-personas', 'Quintana');
await pagina.waitForTimeout(300);
await comprobar('2. al buscar, la línea se quita', pagina.locator('#personas-aviso-aspirantes').isHidden(), true);

console.log('--- 3. Borrados que se fusionan ---');
await pagina.evaluate(() => App.ir('herramientas'));
await pagina.waitForTimeout(1000);
await comprobar('3. la lista sale con lo recordado: tipos de documento y estados con un borrado',
  pagina.evaluate(() => [...document.querySelectorAll('#tabla-borrados-fusion .fila-tipo')].map((f) => [f.querySelector('.nombre-tipo').textContent, f.querySelector('.suave').textContent])),
  [['Tipos de asunto borrados', 'Ninguno'], ['Estados borrados', '1 borrado'], ['Tipos de documento borrados', '1 borrado'],
   ['Asuntos que se repiten, quitados', 'Ninguno'], ['Asuntos archivados, unidos o con otro nombre', 'Ninguno']]);
await comprobar('3. el texto no nombra ningún fichero ni dice «json»',
  pagina.evaluate(() => /json|\.js\b|\.csv|_GESTOR|lápida/i.test(document.getElementById('bloque-borrados-fusion').textContent)), false);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
