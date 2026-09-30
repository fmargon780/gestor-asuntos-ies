/* Prueba en navegador de verdad de la fila 206 de docs/COLA.md
   (docs/HITOS-DESDE-EL-ASUNTO.md): crear, cambiar y borrar hitos desde
   la mesa de un asunto, con «Colocar después de» y el reparto a la
   guía y a los asuntos abiertos, solo donde el hito está vacío.

   A. Crear con guía: llega en su sitio a otro asunto abierto del tipo.
   B. Crear solo en este asunto: no toca la guía ni el otro asunto.
   C. Cambiar (con guía): se cambia y se mueve en el vacío; el que
      tiene trabajo no se toca.
   D. Borrar: apagado con trabajo; con la casilla, se va de la guía y
      del abierto vacío, se queda en el que tiene trabajo.
   E. (fila 224) Crear buscando en la biblioteca: al escribir parte de
      un título que ya existe ahí, sale para elegirlo; al elegirlo, el
      hito nace con lo del modelo (aquí, su responsable) y también en
      la guía. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO_1 = '260912 CONVALIDACION 26-27 Actual, Uno 9990101';
const ASUNTO_2 = '260913 CONVALIDACION 26-27 Vacio, Dos 9990102';
const ASUNTO_3 = '260914 CONVALIDACION 26-27 Trabajo, Tres 9990103';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Comunicar', cuerpo: '', opciones: [] },
    { id: 'c2', titulo: 'Resolver', cuerpo: '', opciones: [] }
  ]
};
const BIBLIOTECA = {
  version: 1,
  modelos: [
    { id: 'm1', nombre: 'Firma de Secretaría', titulo: 'Firma de Secretaría', responsable: 'secretaria',
      guion: [{ id: 'bg1', texto: 'Comprobar el sello', explicacion: '', accion: '' }] }
  ]
};

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, biblioteca, a1, a2, a3]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, t] of [['guias.json', guias], ['hitos-biblioteca.json', biblioteca]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(t)); await w.close();
  }
  for (const n of [a1, a2, a3]) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [GUIAS, BIBLIOTECA, ASUNTO_1, ASUNTO_2, ASUNTO_3]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2, a3]) => {
  for (const [n, tercero] of [[a1, 'Actual, Uno 9990101'], [a2, 'Vacio, Dos 9990102'], [a3, 'Trabajo, Tres 9990103']]) {
    await App.anotar(n, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
      tercero: tercero, curso: '26-27', grupo: '', descripcion: '', campos: {} });
  }
  await App.verAbiertos();
}, [ASUNTO_1, ASUNTO_2, ASUNTO_3]);

function leerHitos(clave) {
  return pagina.evaluate(async (clave) => {
    const d = await Hitos.leer();
    return (d.porAsunto[clave] || { hitos: [] }).hitos.map((h) => ({ id: h.id, titulo: h.titulo, origenGuia: h.origenGuia || null }));
  }, clave);
}

function leerGuia() {
  return pagina.evaluate(async () => {
    const g = await Carpetas.leerJson(App.E.gestor, 'guias.json');
    return (g.CONVALIDACION || []).map((p) => ({ id: p.id, titulo: p.titulo }));
  });
}

/* Mientras una mesa está abierta, esconde las filas de los demás
   hitos (docs/contexto/HITO-MESA.md): para ir a otro, hay que usar su
   celda de la tira de arriba, o cerrar la mesa primero. */
async function irAHito(idHito) {
  const yaAbierta = await pagina.locator('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]').count();
  if (!yaAbierta) {
    const tira = pagina.locator('.mesa-tira-hito[data-id="' + idHito + '"]');
    if (await tira.count()) {
      await tira.first().click();
    } else {
      await pagina.evaluate(() => { if (window.HitoMesa) HitoMesa.cerrar(); });
      await pagina.waitForTimeout(150);
      await pagina.locator('#ficha-guia .hito[data-id="' + idHito + '"] .hito-titulo').click();
    }
    await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]');
  }
  await pagina.waitForTimeout(300);
}

async function abrirMesaDe(nombreCorto, idHito) {
  await pagina.locator('.tarjeta-nombre', { hasText: nombreCorto }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(300);
  await irAHito(idHito);
}

async function volver() {
  await pagina.click('#ficha-volver');
  await pagina.waitForTimeout(300);
}

async function abrirMas() {
  await pagina.click('.hito-en-mesa .mesa-mas');
  await pagina.waitForSelector('.ficha-menu:not(.oculto)');
}

async function elegirDelMenu(texto) {
  await abrirMas();
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: texto }).first().click();
  await pagina.waitForSelector('#capa:not(.oculto)');
}

/* ========== A. Crear con guía: en su sitio, y llega a otro abierto ========== */

await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Crear');
await pagina.fill('#hda-titulo', 'Recabar la documentación');
await pagina.selectOption('#hda-despues', 'c1');
/* Fila 235: ya no hay casilla; el bloque «¿Dónde se guarda?» sale con la guía marcada. */
await comprobar('A. sin la casilla vieja «También en la guía»',
  pagina.evaluate(() => !document.querySelector('#hda-tambien-guia')), true);
await comprobar('A. «A la guía de …» marcada, y dice a cuántos abiertos llega',
  pagina.evaluate(() => ({
    marcada: document.querySelector('input[name="dsg-donde"]:checked').value,
    nota: (document.querySelector('.dsg-nota') || {}).textContent
  })), { marcada: 'guia', nota: 'Llegará a 2 asuntos abiertos de este tipo.' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

const trasCrearA1 = await leerHitos(ASUNTO_1);
await comprobar('A. el hito nuevo entra justo detrás de c1, en este asunto',
  Promise.resolve(trasCrearA1.map((h) => h.titulo)), ['Comunicar', 'Recabar la documentación', 'Resolver']);
const idNuevo = trasCrearA1[1].origenGuia;
await comprobar('A. nace con origenGuia (va también a la guía)', Promise.resolve(!!idNuevo), true);
await comprobar('A. la guía tiene el paso nuevo en el mismo sitio',
  leerGuia().then((g) => g.map((p) => p.titulo)), ['Comunicar', 'Recabar la documentación', 'Resolver']);
await comprobar('A. llega también al otro asunto abierto, vacío, en su sitio',
  leerHitos(ASUNTO_2).then((hs) => hs.map((h) => h.titulo)), ['Comunicar', 'Recabar la documentación', 'Resolver']);
await comprobar('A. y al tercero también',
  leerHitos(ASUNTO_3).then((hs) => hs.map((h) => h.titulo)), ['Comunicar', 'Recabar la documentación', 'Resolver']);

/* Se apunta trabajo en ASUNTO_3, en el hito nuevo: a partir de aquí no
   se debe tocar más que su título de nacimiento. */
await pagina.evaluate(async ([a3, id]) => {
  const d = await Hitos.leer();
  const h = Hitos.buscar(d.porAsunto[a3].hitos, id);
  await Hitos.anadirNota(a3, h.id, 'Ya he empezado a mirarlo.');
}, [ASUNTO_3, idNuevo]);

/* ========== B. Crear solo en este asunto: no toca la guía ni el otro ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Crear');
await pagina.fill('#hda-titulo', 'Nota solo mía');
await pagina.check('input[name="dsg-donde"][value="aqui"]');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('B. el hito solo-asunto no lleva origenGuia',
  leerHitos(ASUNTO_1).then((hs) => { const h = hs.filter((x) => x.titulo === 'Nota solo mía')[0]; return h ? h.origenGuia : 'NO ESTA'; }), null);
await comprobar('B. no ha llegado a la guía',
  leerGuia().then((g) => g.some((p) => p.titulo === 'Nota solo mía')), false);
await comprobar('B. ni al otro asunto abierto',
  leerHitos(ASUNTO_2).then((hs) => hs.some((h) => h.titulo === 'Nota solo mía')), false);

/* ========== C. Cambiar (con guía): el vacío se mueve y se renombra; el que tiene trabajo, no ========== */

await volver();
await abrirMesaDe('Actual', idNuevo);
await elegirDelMenu('Cambiar');
await pagina.fill('#hda-titulo', 'Recabar y comprobar la documentación');
await pagina.selectOption('#hda-despues', '');   /* Al principio */
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('C. en este asunto: título cambiado y movido al principio',
  leerHitos(ASUNTO_1).then((hs) => hs.map((h) => h.titulo)),
  ['Recabar y comprobar la documentación', 'Comunicar', 'Nota solo mía', 'Resolver']);
await comprobar('C. en el asunto vacío: también cambia y se mueve',
  leerHitos(ASUNTO_2).then((hs) => hs.map((h) => h.titulo)),
  ['Recabar y comprobar la documentación', 'Comunicar', 'Resolver']);
await comprobar('C. en el asunto con trabajo: se queda como estaba',
  leerHitos(ASUNTO_3).then((hs) => hs.map((h) => h.titulo)),
  ['Comunicar', 'Recabar la documentación', 'Resolver']);
await comprobar('C. la guía también cambia y se mueve',
  leerGuia().then((g) => g.map((p) => p.titulo)),
  ['Recabar y comprobar la documentación', 'Comunicar', 'Resolver']);

/* ========== D. Borrar: apagado con trabajo; vacío se va, con trabajo se queda ========== */

await volver();
await abrirMesaDe('Trabajo', idNuevo);
await abrirMas();
await comprobar('D. «Borrar» apagado en el que tiene trabajo',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Borrar' }).first().isDisabled(), true);
await pagina.keyboard.press('Escape');
await volver();

await abrirMesaDe('Actual', idNuevo);
await elegirDelMenu('Borrar');
await pagina.waitForSelector('input[name="dsg-donde"]');
await comprobar('D. «Borrar» lleva las dos opciones, con «A la guía» marcada',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('input[name="dsg-donde"]'), (r) => r.value + (r.checked ? '*' : ''))),
  ['guia*', 'aqui']);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('D. se va de este asunto', leerHitos(ASUNTO_1).then((hs) => hs.some((h) => h.id === idNuevo)), false);
await comprobar('D. se va del asunto vacío', leerHitos(ASUNTO_2).then((hs) => hs.some((h) => h.id === idNuevo)), false);
await comprobar('D. se queda en el que tenía trabajo', leerHitos(ASUNTO_3).then((hs) => hs.some((h) => h.id === idNuevo)), true);
await comprobar('D. se va de la guía', leerGuia().then((g) => g.some((p) => p.id === idNuevo)), false);

/* ========== E. Crear buscando en la biblioteca (fila 224) ========== */

await volver();
await abrirMesaDe('Actual', 'c1');
await elegirDelMenu('Crear');
await pagina.fill('#hda-titulo', 'Firma');
await pagina.waitForSelector('.hda-biblioteca-resultados:not(.oculto) .hda-biblioteca-opcion');
await comprobar('E. sale el modelo de la biblioteca que casa con lo escrito',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.hda-biblioteca-opcion'), (b) => b.textContent)),
  ['Firma de Secretaría']);
await pagina.click('.hda-biblioteca-opcion');
await comprobar('E. al elegirlo, el título del campo pasa a ser el suyo',
  pagina.inputValue('#hda-titulo'), 'Firma de Secretaría');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

const trasBiblioteca = await leerHitos(ASUNTO_1);
const nuevoDeBiblioteca = trasBiblioteca.filter((h) => h.titulo === 'Firma de Secretaría')[0];
await comprobar('E. el hito nace con el título del modelo', Promise.resolve(!!nuevoDeBiblioteca), true);
await comprobar('E. nace también en la guía', Promise.resolve(!!(nuevoDeBiblioteca && nuevoDeBiblioteca.origenGuia)), true);
await comprobar('E. y con el responsable del modelo', pagina.evaluate(async (idOrigen) => {
  const g = await Carpetas.leerJson(App.E.gestor, 'guias.json');
  const p = g.CONVALIDACION.filter((x) => x.id === idOrigen)[0];
  return p ? p.responsable : null;
}, nuevoDeBiblioteca.origenGuia), 'secretaria');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await pagina.close();

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
