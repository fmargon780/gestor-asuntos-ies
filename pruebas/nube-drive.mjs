/* Prueba en navegador de verdad de la fila 456 de docs/COLA.md (docs/PASAR-A-DRIVE.md,
   «Fila 456»): rutas y textos que valen para Dropbox y para Google Drive.

   1. Con Dropbox (como hoy), el botón «Ruta» copia la misma ruta que antes.
   2. Con Google Drive («Mi unidad»), copia una ruta con «Mi unidad» y sin «Dropbox».
   3. `partir` reconoce «Mi unidad» y «My Drive»; `nubeDeRuta` dice cuál es.
   4. La clave nueva `gestor-ruta-nube` manda; la vieja `gestor-ruta-dropbox` se sigue leyendo.
   5. `Nombres.topes` toma el largo de la raíz de la ruta real; sin ruta y con Drive, 40.
   6. Ajustes y la comprobación al entrar ya no dicen «Carpetas de Dropbox».
   7. Un `.gdoc` (y los demás ficheros propios de Google) no sale en la lista de documentos del
      asunto, ni en «Por clasificar». Un PDF al lado sí.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const ABIERTO = '260918 SOLICITUD 26-27 Pérez Ruiz, Ana 1150055';
const TERCERO = 'Pérez Ruiz, Ana 1150055';
const GUIAS = { SOLICITUD: [{ id: 'h1', titulo: 'Tramitar', cuerpo: '', opciones: [], responsable: '' }] };

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([ABIERTO, TERCERO]) => {
  async function fichero(dir, nombre) { const h = await dir.getFileHandle(nombre, { create: true }); const w = await h.createWritable(); await w.write('%PDF-1.4\n%%EOF'); await w.close(); }
  const ab = await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await fichero(ab, '261019 FACTURA D26-00259.pdf');
  for (const n of ['Cuentas.gdoc', 'Hoja.GSHEET', 'Diapos.gslides', 'Formulario.gform', 'Dibujo.gdraw', 'Mapa.gmap', 'Sitio.gsite', 'Pizarra.gjam']) await fichero(ab, n);
  await fichero(window.__disco.abiertos, 'Suelto bueno.pdf');
  await fichero(window.__disco.abiertos, 'Suelto de Google.gdoc');
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO', tipo: 'SOLICITUD' });
  await App.verAbiertos();
}, [ABIERTO, TERCERO]);

async function escribirRutas(contenido) {
  await pagina.evaluate(async (c) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const h = await g.getFileHandle('rutas.json', { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(c)); await w.close();
  }, contenido);
}
async function abrirAbierto() {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(150);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ABIERTO + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.ficha-copiar-fila');
}
async function copiarRuta() {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Ruta")');
  await pagina.waitForFunction(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .some((x) => x.textContent.trim() === 'Copiado'));
  const texto = await pagina.evaluate(() => navigator.clipboard.readText());
  await pagina.waitForTimeout(1500);
  return texto;
}

/* ---------- 1. Dropbox, como hoy ---------- */
console.log('--- 1. Dropbox ---');
await escribirRutas({ abiertos: 'IES/ASUNTOS ABIERTOS', archivo: 'ARCHIVO' });
await pagina.evaluate(() => { localStorage.clear(); localStorage.setItem('gestor-ruta-nube', 'C:\\Users\\francisco\\Dropbox'); });
await abrirAbierto();
await comprobar('1. «Ruta» copia la ruta de siempre',
  copiarRuta(), 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\' + ABIERTO);
await comprobar('la nube en uso es Dropbox', pagina.evaluate(() => RutaCarpetas.nombreNube()), 'Dropbox');

/* ---------- 4. la clave vieja se sigue leyendo ---------- */
console.log('--- 4. clave vieja ---');
await pagina.evaluate(() => { localStorage.clear(); localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\vieja\\Dropbox'); });
await comprobar('4. sin la clave nueva, vale la vieja',
  pagina.evaluate(() => RutaCarpetas.dropboxDeEsteOrdenador().valor), 'C:\\Users\\vieja\\Dropbox');
await pagina.evaluate(() => localStorage.setItem('gestor-ruta-nube', 'C:\\Users\\nueva\\Dropbox'));
await comprobar('4. con las dos, manda la nueva',
  pagina.evaluate(() => RutaCarpetas.dropboxDeEsteOrdenador().valor), 'C:\\Users\\nueva\\Dropbox');

/* ---------- 2. Google Drive ---------- */
console.log('--- 2. Google Drive ---');
await escribirRutas({ nube: 'drive', abiertos: 'ADMINISTRACIÓN/ASUNTOS ABIERTOS', archivo: 'ADMINISTRACIÓN/ARCHIVO' });
await pagina.evaluate(() => { localStorage.clear(); localStorage.setItem('gestor-ruta-nube', 'G:\\Mi unidad'); });
const RUTA_DRIVE = 'G:\\Mi unidad\\ADMINISTRACIÓN\\ASUNTOS ABIERTOS\\' + ABIERTO;
await comprobar('2. «Ruta» copia una ruta de «Mi unidad»', copiarRuta(), RUTA_DRIVE);
await comprobarQue('2. y no lleva «Dropbox»', Promise.resolve(RUTA_DRIVE.indexOf('Dropbox') === -1));
await comprobar('la nube en uso es Google Drive', pagina.evaluate(() => RutaCarpetas.nombreNube()), 'Google Drive');

/* ---------- 3. partir ---------- */
console.log('--- 3. reconocer la nube ---');
await comprobar('«Mi unidad» en Windows',
  pagina.evaluate(() => RutaCarpetas.partir('G:\\Mi unidad\\ADMINISTRACIÓN\\ARCHIVO')),
  { dropbox: 'G:\\Mi unidad', comun: 'ADMINISTRACIÓN/ARCHIVO' });
await comprobar('«My Drive» en inglés',
  pagina.evaluate(() => RutaCarpetas.partir('G:\\My Drive\\ADMINISTRACION\\ARCHIVO')),
  { dropbox: 'G:\\My Drive', comun: 'ADMINISTRACION/ARCHIVO' });
await comprobar('en una dirección file://',
  pagina.evaluate(() => RutaCarpetas.partir('file:///G:/Mi%20unidad/ADMINISTRACI%C3%93N/ARCHIVO')),
  { dropbox: 'G:\\Mi unidad', comun: 'ADMINISTRACIÓN/ARCHIVO' });
await comprobar('nubeDeRuta',
  pagina.evaluate(() => [RutaCarpetas.nubeDeRuta('G:\\Mi unidad\\A'), RutaCarpetas.nubeDeRuta('C:\\Users\\x\\Dropbox\\A'), RutaCarpetas.nubeDeRuta('C:\\Users\\x\\A')]),
  ['drive', 'dropbox', '']);

/* ---------- 5. topes ---------- */
console.log('--- 5. el largo de la raíz ---');
const topeCon = (ruta, nube) => pagina.evaluate(async ([ruta, nube]) => {
  localStorage.clear();
  if (ruta) localStorage.setItem('gestor-ruta-nube', ruta);
  await RutaCarpetas.cargarComun();
  return Nombres.topes('Pérez Ruiz, Ana 1150055', 'ALUMNADO').asunto;
}, [ruta, nube]);
const conRutaLarga = await topeCon('C:\\Users\\un-usuario-con-nombre-muy-largo-de-verdad\\Google Drive\\Mi unidad', 'drive');
const conRutaCorta = await topeCon('G:\\Mi unidad', 'drive');
await comprobarQue('5. una raíz real más larga deja menos hueco que una corta', Promise.resolve(conRutaLarga < conRutaCorta));
const LARGO = 'ADMINISTRACIÓN/' + 'REGISTROS DEL CENTRO '.repeat(5) + 'ARCHIVO';   /* largo, para que el tope fijo no tape la diferencia */
await escribirRutas({ nube: 'drive', archivo: LARGO });
const sinRutaDrive = await topeCon('', 'drive');
await escribirRutas({ archivo: LARGO });
const sinRutaDropbox = await topeCon('', 'dropbox');
await comprobarQue('5. sin ruta conocida, con Drive (40) cabe más que con Dropbox (45)', Promise.resolve(sinRutaDrive > sinRutaDropbox));

/* ---------- 6. textos ---------- */
console.log('--- 6. textos ---');
await pagina.evaluate(() => { localStorage.clear(); localStorage.setItem('gestor-ruta-nube', 'G:\\Mi unidad'); });
await pagina.evaluate(() => ComprobacionEntrada.comprobar());
const titulos = await pagina.evaluate(() => ComprobacionEntrada.filas().map((f) => f.titulo));
await comprobarQue('6. la comprobación dice «Carpetas de la app»', Promise.resolve(titulos.indexOf('Carpetas de la app') !== -1));
await comprobarQue('6. y «Ruta de la nube en este ordenador»', Promise.resolve(titulos.indexOf('Ruta de la nube en este ordenador') !== -1));
await comprobarQue('6. y ya no dice «Carpetas de Dropbox»', Promise.resolve(titulos.indexOf('Carpetas de Dropbox') === -1));
await pagina.evaluate(() => { RutaCarpetas.ponerBloque(); return RutaCarpetas.pintarBloque(); });
await comprobarQue('6. el bloque de rutas de Ajustes no dice «Dropbox en este ordenador»',
  pagina.evaluate(() => { const b = document.getElementById('bloque-rutas'); return !!b && b.textContent.indexOf('Dropbox en este ordenador') === -1 && /nube/.test(b.textContent); }));

/* ---------- 7. ficheros de Google ---------- */
console.log('--- 7. ficheros de Google ---');
await abrirAbierto();
await pagina.waitForSelector('#ficha-documentos .ficha-documento-fila');
const textoDocs = await pagina.evaluate(() => document.getElementById('ficha-documentos').textContent);
await comprobarQue('7. el PDF sale en la lista del asunto', Promise.resolve(textoDocs.indexOf('FACTURA') !== -1));
await comprobarQue('7. el .gdoc no sale', Promise.resolve(!/gdoc/i.test(textoDocs)));
await comprobarQue('7. ni ningún otro fichero propio de Google',
  Promise.resolve(!/gsheet|gslides|gform|gdraw|gmap|gsite|gjam/i.test(textoDocs)));
await comprobar('7. la cuenta de documentos cuenta solo el PDF', pagina.evaluate(() => document.getElementById('ficha-cuenta-docs').textContent.trim()), '1');
await comprobar('7. en «Por clasificar» solo el suelto bueno',
  pagina.evaluate(async () => { await App.verAbiertos(); return (App.E.sueltos || []).map((f) => f.nombre); }), ['Suelto bueno.pdf']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
