/* ============================================================
   entrada.js — la carpeta de entrada de documentos sueltos
   (fila 455, docs/PASAR-A-DRIVE.md).

   «Por clasificar» y la vigilancia de js/documentos-vigilancia.js
   leen los documentos sueltos de una carpeta: la de entrada. Hasta
   ahora era siempre la raíz de «asuntos abiertos». Con el handle
   `entrada` puede ser otra carpeta (la que el resto del centro usa para
   dejar documentos a Administración, aunque los asuntos estén en otra
   nube).

   Tres casos:
     'abiertos'  — sin senalar y sin `nube: "drive"` en _GESTOR/rutas.json:
                   la entrada es la raíz de abiertos (lo de siempre).
     'propia'    — `entrada` senalada y se puede abrir.
     'no-esta'   — no hay sitio: `entrada` senalada pero la carpeta no se
                   encuentra, o sin senalar con `nube: "drive"`. «Por
                   clasificar» dice FRASE_NO_ESTA, sin error ni aviso.

   Si `entrada` es la misma carpeta que abiertos (isSameEntry), se trata
   como 'abiertos'.
   ============================================================ */
var Entrada = (function () {
  'use strict';

  var CLAVE = 'entrada';
  var FRASE_NO_ESTA = 'Los documentos por clasificar solo se ven en el instituto.';

  var propia = null;        /* el handle recordado, o null */
  var estado = 'abiertos';  /* 'abiertos' | 'propia' | 'no-esta' */
  var cargada = false;
  var noEsta = false;       /* la última lectura no pudo abrir la carpeta de entrada */

  async function esLaMisma(a, b) {
    if (window.FechasOrigen) { a = FechasOrigen.crudo(a); b = FechasOrigen.crudo(b); }   /* fila 458: sin la envoltura de las fechas */
    try { return !!(a && b && a.isSameEntry && await a.isSameEntry(b)); } catch (e) { return false; }
  }

  async function nubeDeRutas() {
    try {
      if (!window.App || !App.E || !App.E.gestor) return '';
      var r = await Carpetas.leerJson(App.E.gestor, 'rutas.json');
      return (r && r.nube) ? String(r.nube) : '';
    } catch (e) { return ''; }
  }

  /* Lee lo recordado. Se llama al entrar (y al senalar o quitar la carpeta). */
  async function cargar() {
    try { propia = (await Almacen.leer(CLAVE)) || null; } catch (e) { propia = null; }
    if (propia && window.SoloConsulta) propia = SoloConsulta.proteger(propia);   /* como las otras carpetas */
    cargada = true;
    return decidir();
  }

  async function decidir() {
    noEsta = false;
    if (propia) {
      if (await esLaMisma(propia, App.E.abiertos)) { estado = 'abiertos'; return estado; }
      estado = 'propia';
      return estado;
    }
    estado = (await nubeDeRutas()) === 'drive' ? 'no-esta' : 'abiertos';
    return estado;
  }

  /* La carpeta de donde salen los sueltos, o null si no se ve. */
  function dir() {
    if (estado === 'propia') return propia;
    if (estado === 'abiertos') return App.E.abiertos;
    return null;
  }

  /* Lo que lee «Por clasificar»: { ficheros, carpetas, noEsta }. `abiertosLeido` es lo ya leído de
     la raíz de abiertos (se reutiliza si la entrada es esa misma carpeta). Nunca lanza: si la
     carpeta de entrada no se abre, devuelve noEsta y la app sigue. */
  async function leer(abiertosLeido) {
    if (!cargada) await cargar();
    if (estado === 'abiertos') {
      var h = abiertosLeido || await Carpetas.contenido(App.E.abiertos);
      return { ficheros: h.ficheros, carpetas: h.carpetas, noEsta: false };
    }
    if (estado === 'no-esta') { noEsta = true; return { ficheros: [], carpetas: [], noEsta: true }; }
    try {
      var c = await Carpetas.contenido(propia);
      noEsta = false;
      return { ficheros: c.ficheros, carpetas: c.carpetas, noEsta: false };
    } catch (e) {
      noEsta = true;
      return { ficheros: [], carpetas: [], noEsta: true };
    }
  }

  async function senalar(handle) {
    propia = handle || null;
    if (propia) await Almacen.guardar(CLAVE, propia); else await Almacen.borrar(CLAVE);
    cargada = true;
    return decidir();
  }

  async function elegir() {
    var h = await window.showDirectoryPicker({ id: 'gestor-entrada', mode: 'readwrite' });
    return senalar(h);
  }

  /* El nombre para enseñar en Ajustes. */
  function nombre() { return propia ? propia.name : ''; }

  return {
    CLAVE: CLAVE, FRASE_NO_ESTA: FRASE_NO_ESTA,
    cargar: cargar, leer: leer, dir: dir, elegir: elegir, quitar: function () { return senalar(null); },
    estado: function () { return estado; }, senalada: function () { return !!propia; },
    carpetaSenalada: function () { return propia; }, nombre: nombre,
    noSeVe: function () { return estado === 'no-esta' || noEsta; }
  };
})();
window.Entrada = Entrada;
