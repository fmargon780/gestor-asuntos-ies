/* Prueba en navegador de verdad de las filas 98 y 152 de docs/COLA.md
   (docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md, docs/RUTA-QUE-NO-VA-A-BING.md):
   el botón «Ruta» de la ficha del asunto y de los cuadros de Comunicar.

   1. Sin ruta apuntada: ya NO copia el nombre suelto (eso es lo que
      buscaba Bing). Pide la ruta en ese momento; al guardar, copia ya
      la ruta completa, en formato `file:///`.
   2. Con ruta de Windows, asunto abierto: `file:///C:/...`.
   3. Asunto archivado, con ruta estilo Linux: `file:///home/...`.
   4. La ruta se guarda en este ordenador (localStorage), no en _GESTOR.
   5. En modo consulta el botón sigue encendido.
   6. La conversión a `file:///` con rutas de Windows, de red (`\\`) y
      de Linux, con espacios, `#`, coma y acentos.
   7. Chromium abre de verdad una carpeta con esos caracteres al navegar
      a la ruta copiada (no una búsqueda): prueba con el sistema de
      ficheros real, no con el disco de mentira de la aplicación.
   8. Sin ruta, desde el cuadro de Séneca: el campo sale en línea y no
      se pierde el cuerpo ni el «Para» (Correo).
   9. El botón «Ruta» sale en el cuadro de Correo y en el de Séneca,
      abiertos desde la ficha y desde la mesa del hito («Comunicar ▾»).
   10. Sigue en verde pruebas/seneca-cuadro-ancho.mjs (prueba aparte).
   Fila 161 (docs/RUTA-SIN-PREGUNTAR.md): la ruta se parte por el trozo
   `Dropbox`: lo de detrás, en `_GESTOR/rutas.json` para todo el centro;
   lo de delante, deducido (copia sin internet) o en este ordenador.
   11. El cuadro nombra la carpeta que pide; al pegar, se parte bien.
   12. En la web, con una ruta completa antigua: no pregunta y rellena
       `rutas.json`.
   13. `partir` con `Dropbox (Personal)`, acentos y `file:`.
   14. Servida como `file://` desde `.../Dropbox (Personal)/ADMINISTRACIÓN/
       REGISTROS/Gestor de Asuntos - aplicación/`, con `rutas.json`
       relleno: «Ruta» copia la ruta completa sin abrir ningún cuadro.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';
import os from 'os';
import path from 'path';

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
const ARCHIVADO = '250110 MATRICULA 25-26 Pérez Ruiz, Ana 1150055';
const TERCERO = 'Pérez Ruiz, Ana 1150055';

const GUIAS = {
  SOLICITUD: [
    { id: 'h1', titulo: 'Tramitar', cuerpo: '', opciones: [], responsable: '' }
  ]
};

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
await pagina.evaluate(async ([ABIERTO, ARCHIVADO, TERCERO]) => {
  await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO', tipo: 'SOLICITUD' });
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO', { create: true });
  const ter = await cat.getDirectoryHandle(TERCERO, { create: true });
  await ter.getDirectoryHandle(ARCHIVADO, { create: true });
  await App.verAbiertos();
}, [ABIERTO, ARCHIVADO, TERCERO]);

async function leerRutasJson() {
  return pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    try { return JSON.parse(await (await (await g.getFileHandle('rutas.json')).getFile()).text()); }
    catch (e) { return null; }
  });
}

async function abrirAbierto() {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(150);
  await pagina.locator('.tarjeta-nombre', { hasText: ABIERTO }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.ficha-copiar-fila');
}

async function copiarRuta() {
  await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
  await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Ruta")');
  await pagina.waitForFunction(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .some((x) => x.textContent.trim() === 'Copiado'));
  const texto = await pagina.evaluate(() => navigator.clipboard.readText());
  await pagina.waitForTimeout(1500);   /* que el botón vuelva a decir «Ruta» */
  return texto;
}

/* ---------- 1. sin ruta apuntada: ya no copia el nombre suelto ---------- */
console.log('--- 1. sin ruta apuntada (ficha) ---');
await abrirAbierto();
await comprobar('el botón «Ruta» va detrás de «Asunto»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'))
    .map(b => b.textContent.trim()).slice(0, 2)), ['Asunto', 'Ruta']);
await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Ruta")');
await pagina.waitForSelector('#capa:not(.oculto) #ruta-pedida-ficha');
await comprobarQue('11. pide la ruta en un cuadro que nombra la carpeta, con su nota',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent === 'Ruta de la carpeta ASUNTOS ABIERTOS' &&
    /ruta de la carpeta ASUNTOS ABIERTOS de este ordenador/.test(document.querySelector('#capa .etiqueta').textContent) &&
    /explorador de archivos/.test(document.querySelector('#capa .nota').textContent)));
await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
await pagina.fill('#ruta-pedida-ficha', 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('11. al guardar, lo de delante de Dropbox queda en este ordenador',
  pagina.evaluate(() => localStorage.getItem('gestor-ruta-dropbox')), 'C:\\Users\\francisco\\Dropbox');
await pagina.waitForTimeout(300);
await comprobar('11. y lo de detrás, en _GESTOR/rutas.json para todo el centro',
  leerRutasJson(), { abiertos: 'IES/ASUNTOS ABIERTOS', _esquema: 1 });
await comprobar('y se copia ya la ruta completa, en formato file:///',
  pagina.evaluate(() => navigator.clipboard.readText()),
  'file:///C:/Users/francisco/Dropbox/IES/ASUNTOS%20ABIERTOS/' + encodeURIComponent(ABIERTO));

/* ---------- 2. ruta de Windows ya apuntada, asunto abierto ---------- */
console.log('--- 2. ruta de Windows ---');
await comprobar('con la ruta ya guardada, copia file:/// entero',
  copiarRuta(), 'file:///C:/Users/francisco/Dropbox/IES/ASUNTOS%20ABIERTOS/' + encodeURIComponent(ABIERTO));
await comprobar('la parte de este ordenador no va a la carpeta compartida',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const nombres = []; for await (const p of g.entries()) nombres.push(p[0]);
    const textos = [];
    for (const n of nombres) {
      try { const f = await (await g.getFileHandle(n)).getFile(); textos.push(await f.text()); } catch (e) { /* carpeta */ }
    }
    return textos.some(t => t.indexOf('francisco') > -1);
  }), false);

/* ---------- 5. modo consulta ---------- */
await comprobar('lleva la clase que el modo consulta deja encendida (copiar no cambia nada)',
  pagina.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila')).find(x => x.textContent.trim() === 'Ruta');
    return b.classList.contains('boton-copiar-fila') && !b.disabled;
  }), true);

/* ---------- 3. archivado, ruta estilo Linux ---------- */
console.log('--- 3. archivado ---');
/* 12. En la web, sin la parte de este ordenador pero con una ruta
   completa antigua: no pregunta, y `rutas.json` se rellena solo. */
await pagina.evaluate(() => {
  localStorage.removeItem('gestor-ruta-dropbox');
  localStorage.setItem('gestor-ruta-archivo', '/home/francisco/Dropbox/ARCHIVO/');
});
await pagina.evaluate(async ([ARCHIVADO, TERCERO]) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle(TERCERO);
  const h = await ter.getDirectoryHandle(ARCHIVADO);
  App.abrirFicha({
    nombre: ARCHIVADO, handle: h, padre: ter, ruta: 'ALUMNADO / ' + TERCERO,
    categoria: 'ALUMNADO', tercero: TERCERO, sueltoEn: '',
    leido: Nombres.leer(ARCHIVADO, App.E.tipos), ficha: { categoria: 'ALUMNADO', tercero: TERCERO }
  }, 'archivado');
}, [ARCHIVADO, TERCERO]);
await pagina.waitForSelector('.ficha-copiar-fila');
await comprobar('copia file:///home/... con ARCHIVO / categoría / tercero / nombre',
  copiarRuta(), 'file:///home/francisco/Dropbox/ARCHIVO/ALUMNADO/' + encodeURIComponent(TERCERO) + '/' + encodeURIComponent(ARCHIVADO));
await comprobarQue('12. sin abrir ningún cuadro',
  pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')));
await comprobar('12. y rutas.json queda relleno con lo de detrás de Dropbox',
  leerRutasJson(), { abiertos: 'IES/ASUNTOS ABIERTOS', _esquema: 1, archivo: 'ARCHIVO' });

/* ---------- 13. partir por el trozo Dropbox ---------- */
console.log('--- 13. partir ---');
await comprobar('Windows con Dropbox (Personal) y acentos',
  pagina.evaluate(() => RutaCarpetas.partir('C:\\Users\\José\\Dropbox (Personal)\\ADMINISTRACIÓN\\ASUNTOS ABIERTOS\\')),
  { dropbox: 'C:\\Users\\José\\Dropbox (Personal)', comun: 'ADMINISTRACIÓN/ASUNTOS ABIERTOS' });
await comprobar('una ruta file: codificada',
  pagina.evaluate(() => RutaCarpetas.partir('file:///C:/Users/x/Dropbox/ADMINISTRACI%C3%93N/ARCHIVO')),
  { dropbox: 'C:/Users/x/Dropbox', comun: 'ADMINISTRACIÓN/ARCHIVO' });
await comprobar('sin trozo Dropbox: null',
  pagina.evaluate(() => RutaCarpetas.partir('D:\\Datos\\ASUNTOS')), null);
await comprobar('un trozo que solo empieza por Dropbox no vale',
  pagina.evaluate(() => RutaCarpetas.partir('/home/x/DropboxViejo/ARCHIVO')), null);

/* ---------- 6. la conversión a file:///, con casos difíciles ---------- */
console.log('--- 6. conversión a file:/// ---');
await comprobar('Windows, con espacios',
  pagina.evaluate(() => RutaCarpetas.comoFileUrl('C:\\Users\\x\\Dropbox\\ASUNTOS ABIERTOS', ['Una carpeta'])),
  'file:///C:/Users/x/Dropbox/ASUNTOS%20ABIERTOS/Una%20carpeta');
await comprobar('de red (\\\\servidor)',
  pagina.evaluate(() => RutaCarpetas.comoFileUrl('\\\\servidor\\recurso', ['X'])),
  'file://servidor/recurso/X');
await comprobar('Linux',
  pagina.evaluate(() => RutaCarpetas.comoFileUrl('/home/francisco', ['Y'])),
  'file:///home/francisco/Y');
await comprobar('con #, coma y acentos, todo codificado',
  pagina.evaluate(() => RutaCarpetas.comoFileUrl('/home/francisco', ['Núñez, José #1'])),
  'file:///home/francisco/' + encodeURIComponent('Núñez, José #1'));
await comprobar('una ruta ya en formato file: se respeta tal cual',
  pagina.evaluate(() => RutaCarpetas.comoFileUrl('file:///srv/asuntos/', ['X', 'Y'])),
  'file:///srv/asuntos/X/Y');
await comprobar('un archivado sin ruta del índice usa categoría y tercero',
  pagina.evaluate(() => RutaCarpetas.de({ nombre: 'N', categoria: 'PERSONAL', tercero: 'T' }, 'archivado').texto),
  'file:///home/francisco/Dropbox/ARCHIVO/PERSONAL/T/N');
await comprobar('una ruta de red (\\\\servidor) va con \\ (RutaCarpetas.unir, sin tocar)',
  pagina.evaluate(() => RutaCarpetas.unir('\\\\servidor\\compartida', ['ALUMNADO', 'X'])), '\\\\servidor\\compartida\\ALUMNADO\\X');

/* ---------- 8 y 9. el botón «Ruta» en los cuadros de Comunicar ---------- */
console.log('--- 8 y 9. el botón «Ruta» en los cuadros ---');
await pagina.evaluate(() => { localStorage.removeItem('gestor-ruta-dropbox'); localStorage.removeItem('gestor-ruta-archivo'); });
await abrirAbierto();

/* Abrir el cuadro de Correo desde la cabecera de la ficha ("Comunicar"). */
/* Fila 154: con hitos, «Comunicar» de arriba va escondido; su menú se pulsa por debajo. */
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.evaluate(() => {
  const opcion = Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion'))
    .find((o) => /Correo/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario');
await comprobarQue('el botón «Ruta» sale en la cabecera del cuadro de Correo (desde la ficha)',
  pagina.evaluate(() => !!document.querySelector('#correo-ruta-lugar .boton-copiar-fila')));

/* Escribir algo a mano en "Otro correo" y en el cuerpo, para comprobar
   que pedir la ruta en línea no lo pierde. */
await pagina.fill('#correo-otro', 'alguien@example.com');
await pagina.evaluate(() => { const c = document.getElementById('correo-cuerpo-texto'); c.value = c.value + ' PRUEBA A MANO'; });
await pagina.click('#correo-ruta-lugar .boton-copiar-fila');
await pagina.waitForSelector('#correo-ruta-en-linea:not(.oculto) input');
await comprobarQue('pedir la ruta sale EN LÍNEA (no un segundo cuadro)',
  pagina.evaluate(() => document.getElementById('capa').querySelectorAll('.cuadro').length === 1));
await comprobarQue('11. en línea, también nombra la carpeta',
  pagina.evaluate(() => /ASUNTOS ABIERTOS/.test(document.querySelector('#correo-ruta-en-linea .etiqueta').textContent)));
await pagina.fill('#correo-ruta-en-linea input', '/home/francisco/Dropbox/OTRA/');
await pagina.click('#ruta-en-linea-guardar');
await pagina.waitForTimeout(200);
await comprobarQue('una ruta que no acaba en la carpeta pedida no se guarda (sigue abierto)',
  pagina.evaluate(() => !document.getElementById('correo-ruta-en-linea').classList.contains('oculto') &&
    !localStorage.getItem('gestor-ruta-dropbox')));
await pagina.fill('#correo-ruta-en-linea input', '/home/francisco/Dropbox/IES/ASUNTOS ABIERTOS/');
await pagina.click('#ruta-en-linea-guardar');
await pagina.waitForFunction(() => document.getElementById('correo-ruta-en-linea').classList.contains('oculto'));
await comprobar('guarda la parte de este ordenador',
  pagina.evaluate(() => localStorage.getItem('gestor-ruta-dropbox')), '/home/francisco/Dropbox');
await comprobarQue('y no se pierde el "Otro correo" escrito a mano',
  pagina.evaluate(() => document.getElementById('correo-otro').value === 'alguien@example.com'));
await comprobarQue('ni lo escrito a mano en el cuerpo',
  pagina.evaluate(() => document.getElementById('correo-cuerpo-texto').value.indexOf('PRUEBA A MANO') > -1));
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

/* Séneca: el botón también sale, y sin ruta el campo también en línea. */
await pagina.evaluate(() => localStorage.removeItem('gestor-ruta-dropbox'));
/* Fila 154: con hitos, «Comunicar» de arriba va escondido; su menú se pulsa por debajo. */
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.evaluate(() => {
  const opcion = Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion'))
    .find((o) => /Séneca/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #seneca-formulario');
await comprobarQue('el botón «Ruta» sale en la cabecera del cuadro de Séneca (desde la ficha)',
  pagina.evaluate(() => !!document.querySelector('#seneca-ruta-lugar .boton-copiar-fila')));
await pagina.evaluate(() => { document.getElementById('seneca-cuerpo-texto').value += ' PRUEBA SENECA'; });
await pagina.click('#seneca-ruta-lugar .boton-copiar-fila');
await pagina.waitForSelector('#seneca-ruta-en-linea:not(.oculto) input');
await pagina.fill('#seneca-ruta-en-linea input', '/home/francisco/Dropbox/IES/ASUNTOS ABIERTOS/');
await pagina.click('#ruta-en-linea-guardar');
await pagina.waitForFunction(() => document.getElementById('seneca-ruta-en-linea').classList.contains('oculto'));
await comprobarQue('no se pierde lo escrito a mano en el mensaje de Séneca',
  pagina.evaluate(() => document.getElementById('seneca-cuerpo-texto').value.indexOf('PRUEBA SENECA') > -1));
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

/* ---------- 9 (mesa del hito): el botón «Ruta» también ahí ---------- */
console.log('--- 9. desde la mesa del hito ---');
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);
await pagina.locator('#ficha-guia .hito[data-id="h1"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="h1"]');
await pagina.waitForTimeout(300);
await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
await pagina.waitForSelector('.hito-en-mesa .mesa-preparar-correo');
await pagina.waitForTimeout(200);
await pagina.click('.hito-en-mesa .mesa-preparar-correo');
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario');
await comprobarQue('el botón «Ruta» sale también abierto desde «Comunicar ▾» de la mesa del hito',
  pagina.evaluate(() => !!document.querySelector('#correo-ruta-lugar .boton-copiar-fila')));
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

/* ---------- 7. Chromium abre de verdad una carpeta con esos caracteres,
   no una búsqueda: carpeta real en el disco, no el de mentira de la
   app. Al final, porque navegar de verdad reinicia el disco de mentira
   (`preparacion` se vuelve a ejecutar en cada navegación). */
console.log('--- 7. abre de verdad la carpeta, con # sin romper la ruta ---');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'gestor-ruta-'));
const nombreDificil = 'Carpeta con espacios, café #1';
const carpetaReal = path.join(base, nombreDificil);
fs.mkdirSync(carpetaReal);
fs.writeFileSync(path.join(carpetaReal, 'marca-de-la-prueba.txt'), 'hola');
const urlReal = await pagina.evaluate(([base, nombre]) => RutaCarpetas.comoFileUrl(base, [nombre]), [base, nombreDificil]);
const erroresDelListado = errores.length;
await pagina.goto(urlReal);
await comprobarQue('la URL codifica el # (si no, la ruta se cortaría ahí)', urlReal.indexOf('%23') > -1);
/* El Chromium de GitHub Actions (headless shell) abre la carpeta pero no
   pinta su lista (sus propios scripts fallan: «addRow is not defined»),
   así que se comprueba que se ha quedado en esa carpeta entera, sin
   cortar en el # ni buscar nada; y, si pinta la lista, que sale el fichero. */
await comprobarQue('Chromium abre la carpeta de verdad (la ruta entera, no una búsqueda)',
  Promise.resolve(pagina.url().startsWith('file://') &&
    decodeURIComponent(new URL(pagina.url()).pathname).replace(/\/+$/, '') === carpetaReal.replace(/\/+$/, '')));
const conLista = await pagina.evaluate(() => !!document.querySelector('#tbody, table'));
if (conLista && errores.length === erroresDelListado) {
  await comprobarQue('y se ve el fichero de dentro',
    pagina.locator('body', { hasText: 'marca-de-la-prueba.txt' }).count().then(n => n > 0));
}
errores.splice(erroresDelListado);
fs.rmSync(base, { recursive: true, force: true });

/* ---------- 14. la copia sin internet, servida como file:// desde
   dentro de Dropbox: la parte de este ordenador sale de su dirección
   y «Ruta» copia sin preguntar. ---------- */
console.log('--- 14. copia sin internet (file://) ---');
const raiz = new URL('..', import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gestor-161-'));
const dentro = path.join(tmp, 'Users', 'Propietario', 'Dropbox (Personal)', 'ADMINISTRACIÓN', 'REGISTROS');
fs.mkdirSync(dentro, { recursive: true });
const app = path.join(dentro, 'Gestor de Asuntos - aplicación');
fs.symlinkSync(raiz, app, 'dir');
const erroresAntes = errores.length;
await pagina.goto('file://' + app.split('/').map(encodeURIComponent).join('/') + '/index.html');
await pagina.evaluate(() => {
  window.__copiado = null;
  navigator.clipboard.writeText = (t) => { window.__copiado = t; return Promise.resolve(); };
});
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (guias) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, t] of [['guias.json', JSON.stringify(guias)],
                        ['rutas.json', JSON.stringify({ abiertos: 'ADMINISTRACIÓN/ASUNTOS ABIERTOS', archivo: 'ADMINISTRACIÓN/ARCHIVO' })]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(t); await w.close();
  }
}, GUIAS);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([ABIERTO, TERCERO]) => {
  await window.__disco.abiertos.getDirectoryHandle(ABIERTO, { create: true });
  await App.anotar(ABIERTO, { tercero: TERCERO, categoria: 'ALUMNADO', tipo: 'SOLICITUD' });
  await App.verAbiertos();
}, [ABIERTO, TERCERO]);
await abrirAbierto();
await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("Ruta")');
await pagina.waitForFunction(() => window.__copiado !== null);
const baseEsperada = path.join(tmp, 'Users', 'Propietario', 'Dropbox (Personal)');
await comprobar('14. copia la ruta completa, deducida de la propia dirección',
  pagina.evaluate(() => window.__copiado),
  'file:///' + baseEsperada.split('/').filter(Boolean).map(encodeURIComponent).join('/') +
  '/ADMINISTRACI%C3%93N/ASUNTOS%20ABIERTOS/' + encodeURIComponent(ABIERTO));
await comprobarQue('14. sin abrir ningún cuadro',
  pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')));
await comprobar('14. en Ajustes, «Dropbox en este ordenador» sale deducido, sin campo',
  pagina.evaluate(async () => { await RutaCarpetas.pintarBloque(); return [!!document.getElementById('ruta-dropbox'),
    (document.getElementById('ruta-dropbox-deducida') || {}).textContent.indexOf('Dropbox (Personal)') > -1]; }), [false, true]);
fs.rmSync(tmp, { recursive: true, force: true });
/* Desde `file://` la aplicación no puede leer sus propios datos (la
   copia de verdad los lleva en `copia-datos/`): esos avisos no cuentan. */
errores.splice(erroresAntes);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
