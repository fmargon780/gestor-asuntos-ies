/* Prueba de "El hito, mesa de trabajo" — segunda tanda (23-sep-2026,
   fila 103 de docs/COLA.md, docs/EL-HITO-MESA-DE-TRABAJO.md), sin
   navegador donde se puede (secciones 1 y 2 se comprueban además en
   el navegador de verdad, dentro de pruebas/hitos.mjs y
   pruebas/quedarse-en-el-asunto.mjs, que ya ejercitaban el camino
   viejo "Apuntar un documento" y ahora ejercitan el nuevo menú).

   Comprueba, todo puro, con un disco de mentira en memoria (como
   pruebas/comunicar-desde-hito.mjs):

   1. `HitosDocumentoMenu.ficherosNuevos`: la resta "antes/después",
      con repetidos y con un fichero que desaparece.
   2. Cuándo sale el botón de cada hito: `HitosAnadir.botonHTML` y
      `HitosComunicar.botonHTML` en un hito "decision", uno "noaplica"
      y uno normal; y, para Comunicar, con y sin texto propio del
      paso (con texto, solo ese canal; sin él, los dos).
   3. `extra.adjuntosMarcados` (`CorreoAdjuntos.pintarBloque`): marca
      solo los nombres que de verdad siguen en la carpeta; sin la
      lista, nada sale marcado.
   4. La línea del historial con y sin documentos
      (`CorreoNucleo.sufijoDocumentos`). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

function nodoFalso() {
  return {
    appendChild: function () {}, setAttribute: function () {}, remove: function () {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {} },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; }
  };
}
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null, setTimeout, clearTimeout,
  document: {
    addEventListener: function () {},
    getElementById: function () { return nodoFalso(); },
    createElement: function () { return nodoFalso(); },
    querySelector: function () { return null; }
  }
};
vm.createContext(contexto);
/* Mismo cuidado que pruebas/comunicar-desde-hito.mjs: en el navegador
   `window` ES el global, así que hay que poner `App` en los dos
   sitios antes de cargar nada, y copiar en los dos sentidos después. */
contexto.App = contexto.window.App = { E: { usuario: 'Francisco', datos: {} } };
for (const f of [
  'util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'copias.js', 'nombres.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'dni.js', 'lo-pide.js', 'destinatarios.js',
  'plantillas.js', 'plantillas-valores.js', 'guias.js', 'hitos.js', 'hitos-archivo.js', 'correo.js', 'correo-grupos.js', 'correo-rastro.js', 'correo-adjuntos.js',
  'hitos-comunicar.js', 'hitos-anadir.js', 'hitos-documento-menu.js'
]) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
Object.keys(contexto.window).forEach(function (k) { if (!(k in contexto)) contexto[k] = contexto.window[k]; });
['U', 'Carpetas', 'Copias', 'Nombres', 'Datos', 'Dni', 'LoPide', 'Plantillas', 'Guias', 'Hitos', 'CorreoAdjuntos']
  .forEach(function (k) { if (contexto[k] !== undefined && contexto.window[k] === undefined) contexto.window[k] = contexto[k]; });

const { U } = contexto;
const HitosAnadir = contexto.window.HitosAnadir;
const HitosComunicar = contexto.window.HitosComunicar;
const HitosDocumentoMenu = contexto.window.HitosDocumentoMenu;
const CorreoAdjuntos = contexto.window.CorreoAdjuntos;
const CorreoNucleo = contexto.window.CorreoNucleo;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ================= 1 · la resta "ficheros nuevos" ================= */
console.log('--- 1. HitosDocumentoMenu.ficherosNuevos ---');
comprobar('nada nuevo cuando no cambia nada',
  HitosDocumentoMenu.ficherosNuevos(['a.pdf', 'b.pdf'], ['a.pdf', 'b.pdf']), []);
comprobar('un fichero nuevo aparece',
  HitosDocumentoMenu.ficherosNuevos(['a.pdf'], ['a.pdf', 'b.pdf']), ['b.pdf']);
comprobar('con repetidos en "después", no se repite en el resultado',
  HitosDocumentoMenu.ficherosNuevos(['a.pdf'], ['a.pdf', 'b.pdf', 'b.pdf']), ['b.pdf']);
comprobar('un fichero que desaparece no cuenta como nuevo, y no revienta',
  HitosDocumentoMenu.ficherosNuevos(['a.pdf', 'b.pdf'], ['a.pdf']), []);
comprobar('separar un PDF en tres: los tres trozos son nuevos, el original ya no está',
  HitosDocumentoMenu.ficherosNuevos(
    ['260923 SOLICITUD.pdf'],
    ['260923 SOLICITUD (1 de 3).pdf', '260923 SOLICITUD (2 de 3).pdf', '260923 SOLICITUD (3 de 3).pdf']),
  ['260923 SOLICITUD (1 de 3).pdf', '260923 SOLICITUD (2 de 3).pdf', '260923 SOLICITUD (3 de 3).pdf']);
comprobar('sin nada antes ni después, no revienta', HitosDocumentoMenu.ficherosNuevos(null, null), []);

/* ================= 2 · cuándo sale cada botón ================= */
console.log('--- 2. HitosAnadir/HitosComunicar: decision, noaplica, normal ---');
const asuntoFalso = { nombre: 'asuntoFalso', ficha: { tipo: 'X' }, leido: { tipo: 'X' } };
const hitoDecision = { id: 'd1', clase: 'decision', estado: 'pendiente' };
const hitoNoAplica = { id: 'n1', clase: 'paso', estado: 'noaplica' };
const hitoNormalSinTexto = { id: 'p1', clase: 'paso', estado: 'pendiente', origenGuia: null };

comprobar('HitosAnadir: nada en un hito "decision"', HitosAnadir.botonHTML(asuntoFalso, hitoDecision), '');
comprobar('HitosAnadir: nada en un hito "noaplica"', HitosAnadir.botonHTML(asuntoFalso, hitoNoAplica), '');
comprobar('HitosAnadir: sale en un hito normal',
  HitosAnadir.botonHTML(asuntoFalso, hitoNormalSinTexto).indexOf('Añadir documento') !== -1, true);

comprobar('HitosComunicar: nada en un hito "decision"', HitosComunicar.botonHTML(asuntoFalso, hitoDecision), '');
comprobar('HitosComunicar: nada en un hito "noaplica"', HitosComunicar.botonHTML(asuntoFalso, hitoNoAplica), '');
comprobar('HitosComunicar: sale en un hito normal sin texto propio (antes no salía)',
  HitosComunicar.botonHTML(asuntoFalso, hitoNormalSinTexto).indexOf('Comunicar') !== -1, true);
comprobar('sin texto propio, se ofrecen los dos canales',
  HitosComunicar.canalesDe(asuntoFalso, hitoNormalSinTexto), ['correo', 'seneca']);

/* Con texto propio (solo correo): el botón también sale, y el canal
   se queda reducido a ese, como hasta ahora. */
contexto.window.GuiasDelCentro = {
  pasosDe: function (tipo) {
    if (tipo !== 'X') return [];
    return [{ id: 'p1', comunicacion: { correo: { asunto: '', cuerpo: 'Hola.' }, seneca: { asunto: '', cuerpo: '' } } }];
  }
};
const hitoConTexto = { id: 'p1', clase: 'paso', estado: 'pendiente', origenGuia: 'p1' };
comprobar('con texto propio, el botón también sale',
  HitosComunicar.botonHTML(asuntoFalso, hitoConTexto).indexOf('Comunicar') !== -1, true);
comprobar('y con texto propio, solo el canal que lo tiene',
  HitosComunicar.canalesDe(asuntoFalso, hitoConTexto), ['correo']);

/* ================= 3 · extra.adjuntosMarcados ================= */
console.log('--- 3. CorreoAdjuntos.pintarBloque con y sin adjuntosMarcados ---');
function ficheroFalso(nombre, texto) {
  return {
    kind: 'file', name: nombre,
    async getFile() { return { size: texto.length }; }
  };
}
function carpetaFalsa(ficherosPorNombre) {
  return {
    kind: 'directory',
    async *entries() {
      for (const nombre of Object.keys(ficherosPorNombre)) yield [nombre, ficherosPorNombre[nombre]];
    }
  };
}
function marcadoEnHtml(html, nombre) {
  const re = new RegExp('value="' + nombre.replace(/\./g, '\\.') + '"([^>]*)>');
  const m = html.match(re);
  return !!(m && m[1].indexOf('checked') !== -1);
}
const asuntoConDocs = { handle: carpetaFalsa({
  'a.pdf': ficheroFalso('a.pdf', 'uno'), 'b.pdf': ficheroFalso('b.pdf', 'dos')
}) };

const htmlSinMarcar = await CorreoAdjuntos.pintarBloque(asuntoConDocs);
comprobar('sin adjuntosMarcados, nada sale marcado',
  [marcadoEnHtml(htmlSinMarcar, 'a.pdf'), marcadoEnHtml(htmlSinMarcar, 'b.pdf')], [false, false]);

const htmlMarcado = await CorreoAdjuntos.pintarBloque(asuntoConDocs, ['a.pdf', 'c.pdf']);
comprobar('con adjuntosMarcados, solo se marca el que existe (a.pdf), nunca el que no (c.pdf)',
  [marcadoEnHtml(htmlMarcado, 'a.pdf'), marcadoEnHtml(htmlMarcado, 'b.pdf')], [true, false]);
comprobar('un nombre marcado que no está en la carpeta no revienta nada (ni deja una fila suya)',
  htmlMarcado.indexOf('c.pdf') === -1, true);

/* ================= 4 · la línea del historial, con y sin documentos ================= */
console.log('--- 4. CorreoNucleo.sufijoDocumentos ---');
comprobar('sin documentos, no añade nada', CorreoNucleo.sufijoDocumentos([]), '');
comprobar('sin documentos (null), tampoco', CorreoNucleo.sufijoDocumentos(null), '');
comprobar('con uno, en singular', CorreoNucleo.sufijoDocumentos(['a.pdf']), ' · con 1 documento: a.pdf');
comprobar('con varios, en plural y con los nombres',
  CorreoNucleo.sufijoDocumentos(['a.pdf', 'b.pdf']), ' · con 2 documentos: a.pdf, b.pdf');

const hoy = U.fechaLegible(U.aAaMmDd(U.hoyIso()));
comprobar('la constancia de un hito, sin documentos, es la de siempre',
  CorreoNucleo.textoDeComunicarHito('Pérez García, Ana', false) + CorreoNucleo.sufijoDocumentos([]),
  'Comunicado a Pérez García, Ana por correo · ' + hoy);
comprobar('la constancia de un hito, con documentos, termina en "· con N documentos: ..."',
  CorreoNucleo.textoDeComunicarHito('Pérez García, Ana', false) + CorreoNucleo.sufijoDocumentos(['260923 SOLICITUD.pdf']),
  'Comunicado a Pérez García, Ana por correo · ' + hoy + ' · con 1 documento: 260923 SOLICITUD.pdf');

/* ---------- final ---------- */
console.log(fallos ? '\n' + fallos + ' comprobaciones han fallado.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
