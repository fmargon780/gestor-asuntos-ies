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
await comprobarQue('pide la ruta en un cuadro, con su nota',
  pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent === 'Ruta de la carpeta' &&
    !!document.querySelector('#capa .nota')));
await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
await pagina.fill('#ruta-pedida-ficha', 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await comprobar('al guardar, se guarda la ruta apuntada',
  pagina.evaluate(() => localStorage.getItem('gestor-ruta-abiertos')), 'C:\\Users\\francisco\\Dropbox\\IES\\ASUNTOS ABIERTOS\\');
await comprobar('y se copia ya la ruta completa, en formato file:///',
  pagina.evaluate(() => navigator.clipboard.readText()),
  'file:///C:/Users/francisco/Dropbox/IES/ASUNTOS%20ABIERTOS/' + encodeURIComponent(ABIERTO));

/* ---------- 2. ruta de Windows ya apuntada, asunto abierto ---------- */
console.log('--- 2. ruta de Windows ---');
await comprobar('con la ruta ya guardada, copia file:/// entero',
  copiarRuta(), 'file:///C:/Users/francisco/Dropbox/IES/ASUNTOS%20ABIERTOS/' + encodeURIComponent(ABIERTO));
await comprobar('y no en la carpeta compartida',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const nombres = []; for await (const p of g.entries()) nombres.push(p[0]);
    const textos = [];
    for (const n of nombres) {
      try { const f = await (await g.getFileHandle(n)).getFile(); textos.push(await f.text()); } catch (e) { /* carpeta */ }
    }
    return textos.some(t => t.indexOf('ASUNTOS ABIERTOS') > -1);
  }), false);

/* ---------- 5. modo consulta ---------- */
await comprobar('lleva la clase que el modo consulta deja encendida (copiar no cambia nada)',
  pagina.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila')).find(x => x.textContent.trim() === 'Ruta');
    return b.classList.contains('boton-copiar-fila') && !b.disabled;
  }), true);

/* ---------- 3. archivado, ruta estilo Linux ---------- */
console.log('--- 3. archivado ---');
await pagina.evaluate(() => localStorage.setItem('gestor-ruta-archivo', '/home/francisco/Dropbox/ARCHIVO/'));
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
await pagina.evaluate(() => localStorage.removeItem('gestor-ruta-abiertos'));
await abrirAbierto();

/* Abrir el cuadro de Correo desde la cabecera de la ficha ("Comunicar"). */
await pagina.evaluate(() => {
  const boton = Array.from(document.querySelectorAll('button, .enlace')).find(b => /^Comunicar/.test(b.textContent.trim()));
  if (boton) boton.click();
});
await pagina.waitForTimeout(150);
await pagina.evaluate(() => {
  const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
  const opcion = menu && Array.from(menu.querySelectorAll('.ficha-menu-opcion')).find((o) => /Correo/.test(o.textContent));
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
await pagina.fill('#correo-ruta-en-linea input', '/home/francisco/Dropbox/ASUNTOS/');
await pagina.click('#ruta-en-linea-guardar');
await pagina.waitForFunction(() => document.getElementById('correo-ruta-en-linea').classList.contains('oculto'));
await comprobar('guarda la ruta',
  pagina.evaluate(() => localStorage.getItem('gestor-ruta-abiertos')), '/home/francisco/Dropbox/ASUNTOS/');
await comprobarQue('y no se pierde el "Otro correo" escrito a mano',
  pagina.evaluate(() => document.getElementById('correo-otro').value === 'alguien@example.com'));
await comprobarQue('ni lo escrito a mano en el cuerpo',
  pagina.evaluate(() => document.getElementById('correo-cuerpo-texto').value.indexOf('PRUEBA A MANO') > -1));
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

/* Séneca: el botón también sale, y sin ruta el campo también en línea. */
await pagina.evaluate(() => localStorage.removeItem('gestor-ruta-abiertos'));
await pagina.evaluate(() => {
  const boton = Array.from(document.querySelectorAll('button, .enlace')).find(b => /^Comunicar/.test(b.textContent.trim()));
  if (boton) boton.click();
});
await pagina.waitForTimeout(150);
await pagina.evaluate(() => {
  const menu = Array.from(document.querySelectorAll('.ficha-menu')).find((m) => m.offsetParent);
  const opcion = menu && Array.from(menu.querySelectorAll('.ficha-menu-opcion')).find((o) => /Séneca/.test(o.textContent));
  if (opcion) opcion.click();
});
await pagina.waitForSelector('#capa:not(.oculto) #seneca-formulario');
await comprobarQue('el botón «Ruta» sale en la cabecera del cuadro de Séneca (desde la ficha)',
  pagina.evaluate(() => !!document.querySelector('#seneca-ruta-lugar .boton-copiar-fila')));
await pagina.evaluate(() => { document.getElementById('seneca-cuerpo-texto').value += ' PRUEBA SENECA'; });
await pagina.click('#seneca-ruta-lugar .boton-copiar-fila');
await pagina.waitForSelector('#seneca-ruta-en-linea:not(.oculto) input');
await pagina.fill('#seneca-ruta-en-linea input', '/home/francisco/Dropbox/ASUNTOS/');
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
await pagina.goto(urlReal);
await comprobarQue('la URL codifica el # (si no, la ruta se cortaría ahí)', urlReal.indexOf('%23') > -1);
await comprobarQue('Chromium abre la carpeta de verdad: se ve el fichero de dentro, no una búsqueda',
  pagina.locator('body', { hasText: 'marca-de-la-prueba.txt' }).count().then(n => n > 0));
fs.rmSync(base, { recursive: true, force: true });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
