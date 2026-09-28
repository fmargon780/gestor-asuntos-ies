/* ============================================================
   tablon.js — el tablón de notas rápidas: leer, guardar y quién ve
   qué. Todo lo que es pantalla (la columna compacta, cada nota, el
   formulario) vive en js/tablon-compacto.js, que se carga justo
   detrás (fila 212, docs/INICIO-A-TODO-EL-ANCHO.md: este fichero
   pasaba de 600 líneas al meter ahí también el modo compacto).

   No todo lo que llega es un asunto. "Llamar a fulano", "el director
   dice que el lunes hay claustro", "preguntar en Séneca por lo del
   transporte". Eso antes acababa en un papel encima de la mesa.

   Las notas se guardan en _GESTOR/tablon.json, dentro de la carpeta de
   asuntos abiertos: las ve el compañero desde su ordenador, igual que
   los asuntos. Antes de escribir se vuelve a leer el fichero, para no
   pisar lo que él haya puesto mientras tanto.

   Una nota puede marcarse "Solo para mí": entonces sale únicamente en
   el tablón de quien la escribió. No es un secreto —el fichero está en
   la carpeta compartida y quien lo abra la leería—, es para no llenarle
   el tablón al otro de recordatorios que no son suyos.
   ============================================================ */
(function () {

  var FICHERO = 'tablon.json';

  var COLORES = ['amarillo', 'azul', 'verde', 'rosa'];

  var notas = [];
  var arrancado = false;
  var fallo = '';           /* lo último que ha ido mal al leer o escribir */

  function $(id) { return document.getElementById(id); }

  function pintarVista() { if (window.TablonVista) TablonVista.pintar(); }

  /* ---------- leer y escribir ---------- */

  function normalizar(leido) {
    var lista = (leido && leido.notas) || [];
    return lista.filter(function (n) { return n && n.texto; }).map(function (n) {
      return {
        id: String(n.id || ''),
        texto: String(n.texto || ''),
        color: COLORES.indexOf(n.color) === -1 ? 'amarillo' : n.color,
        autor: String(n.autor || ''),
        creado: String(n.creado || ''),
        para: /^\d{4}-\d{2}-\d{2}$/.test(n.para || '') ? n.para : '',
        privada: !!n.privada,
        hecha: !!n.hecha,
        hechaPor: String(n.hechaPor || ''),
        hechaEl: String(n.hechaEl || '')
      };
    });
  }

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }

  async function leer() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return [];
    var leido = await Carpetas.leerJson(g, FICHERO);
    return normalizar(leido);
  }

  /* Todo cambio pasa por aquí: se relee el fichero, se aplica el cambio
     sobre lo que hay ahora mismo, y se escribe. Así dos ordenadores no
     se borran las notas el uno al otro. */
  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): leer, cambiar y
     escribir, en fila con los demás guardados de tablon.json. */
  async function cambiar(hacer) {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      var lista = await enFila(FICHERO, async function () {
        var l = await leer();
        l = hacer(l) || l;
        await Copias.guardar(g, FICHERO, { notas: l });
        return l;
      });
      notas = lista;
      pintarVista();
    } catch (e) {
      U.aviso('No he podido guardar la nota: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- quién soy, y qué notas veo ----------

     Una nota privada es de quien la escribió. Se comparan los nombres
     con los que se entra en la aplicación, sin mayúsculas ni tildes. */

  function quienSoy() {
    return (window.Gestor && window.Gestor.usuario && window.Gestor.usuario()) || '';
  }

  function laVeo(n) {
    if (!n.privada) return true;
    return U.normalizar(n.autor) === U.normalizar(quienSoy());
  }

  /* ---------- arranque ---------- */

  /* La columna se pinta ANTES de leer el fichero. Si la lectura falla,
     el tablón sigue estando ahí y lo dice, en vez de no aparecer y dejar
     a uno mirando la pantalla sin saber qué ha pasado. */
  async function refrescar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    pintarVista();
    try {
      notas = await leer();
      fallo = '';
      pintarVista();
    } catch (e) {
      fallo = U.mensajeDeError(e) || 'no he podido leer las notas';
      pintarVista();
    }
  }

  var enganchado = false;

  function enganchar() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(function () {
      if (!window.Gestor.carpetaGestor()) return;
      if (!arrancado) { arrancado = true; refrescar(); return; }
      /* Mientras se escribe una nota, o se está cambiando una ya
         puesta, no se relee: el repintado no debe quitarle el sitio al
         cursor (TablonVista.ocupado, en js/tablon-compacto.js). */
      if (window.TablonVista && TablonVista.ocupado && TablonVista.ocupado()) return;
      refrescar();
    });
  }

  /* El puente ya está puesto cuando se carga este fichero. Por si algún
     día cambiara el orden, se reintenta al terminar la página. */
  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

  /* Lo que usa js/tablon-compacto.js (la pantalla) y las pruebas (fila
     130: el mismo cambiar() que usan los botones). */
  window.Tablon = {
    _cambiar: cambiar,
    notas: function () { return notas; },
    fallo: function () { return fallo; },
    laVeo: laVeo,
    quienSoy: quienSoy,
    cambiar: cambiar
  };

})();
