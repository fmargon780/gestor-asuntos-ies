/* ============================================================
   hitos-normativa.js — el bloque "Normativa" (20-sep-2026, fila 79,
   apartado 4.7, docs/BIBLIOTECA-DE-HITOS.md).

   Dos cosas, aparte de js/guias.js y de js/hitos-biblioteca.js para no
   engordar ninguno de los dos:

     1. El editor de referencias, dentro del editor de un paso de guía
        (mismo patrón imperativo que js/guias-requisitos.js: leer todo
        lo escrito, mutar el array, volver a pintar).
     2. La lista de solo lectura, que se pinta igual en el cuerpo de un
        hito (js/hitos-panel-lista.js) y en la vista de solo lectura de
        los pasos de un tipo (Guias.vista, sección 3 de su pantalla).

   La dirección base del sistema de normativa (Ajustes › El centro) se
   guarda con los demás Datos del centro, en _GESTOR/plantillas.json
   (js/plantillas-ajustes.js). Aquí se guarda una copia en memoria,
   refrescada por window.Gestor.alRefrescar como hace js/hitos-
   ajustes.js con sus propios ajustes: así el enlace se puede montar
   sin esperar a una lectura en cada repintado.

   CÓMO SE USA (desde js/guias.js)

     d.insertAdjacentHTML('beforeend', HitosNormativa.bloqueHTML(p.normativa));
     HitosNormativa.enganchar(d, function (mutador) {
       recoger(); mutador(pasos[i].normativa); pintar();
     });
     pasos[i].normativa = HitosNormativa.leer(caja);   // en recoger()

   Se carga después de js/hitos-biblioteca.js.
   ============================================================ */
var HitosNormativa = (function () {

  function nuevoId() { return U.nuevoId('n'); }

  /* ---------- la dirección base, en caché ---------- */

  var direccionBaseCache = '';

  function direccionBase() { return direccionBaseCache; }

  async function refrescar() {
    if (!window.App || !App.E || !App.E.gestor || !window.Plantillas) return;
    try {
      var datos = await Plantillas.cargar(App.E.gestor);
      direccionBaseCache = (datos && datos.direccionNormativa) || '';
    } catch (e) { /* se sigue con lo que hubiera en caché */ }
  }

  (function enganchar() {
    function hacerlo() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () { if (window.Gestor.carpetaGestor()) refrescar(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hacerlo);
    else hacerlo();
  })();

  /* ---------- el desplegable de bloques ---------- */

  function opcionesBloqueHTML(actual) {
    var bloques = (window.HitosBiblioteca && HitosBiblioteca.BLOQUES_NORMATIVA) || [];
    return '<option value="">(sin bloque: solo texto, o enlace propio)</option>' +
      bloques.map(function (b) {
        return '<option value="' + U.escapar(b.clave) + '"' + (b.clave === actual ? ' selected' : '') +
          '>' + U.escapar(b.nombre) + '</option>';
      }).join('');
  }

  /* ---------- el editor ---------- */

  function filaEditorHTML(r) {
    return '<div class="normativa-fila" data-id="' + U.escapar(r.id) + '">' +
      '<input class="campo normativa-cita" value="' + U.escapar(r.cita) +
        '" placeholder="Cita: Decreto 327/2010, art. 40.1">' +
      '<select class="campo normativa-bloque">' + opcionesBloqueHTML(r.bloque) + '</select>' +
      '<input class="campo normativa-clave" value="' + U.escapar(r.clave) + '" placeholder="Clave: ROC-40.1">' +
      '<input class="campo normativa-url" value="' + U.escapar(r.url) +
        '" placeholder="O un enlace directo, si no está en el sistema de normativa">' +
      '<button type="button" class="boton boton-peligro normativa-quitar" title="Quitar la referencia">✕</button>' +
      '</div>';
  }

  /* `formulariosHTML` (20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md):
     el buscador de formularios de `js/formularios.js` se pinta DENTRO
     de este mismo `<details>`, junto a la normativa, para no alargar
     más la pantalla del paso. Se pasa ya montado (o `''`, sin
     `js/formularios.js` cargado) para no acoplar este fichero a ese. */
  function bloqueHTML(normativa, formulariosHTML) {
    var lista = normativa || [];
    return '<details class="paso-normativa">' +
      '<summary>Normativa' + (lista.length ? ' (' + lista.length + ')' : '') + '</summary>' +
      '<div class="normativa-lista">' + lista.map(filaEditorHTML).join('') + '</div>' +
      '<button type="button" class="boton boton-ancho normativa-anadir">+ Añadir referencia</button>' +
      (formulariosHTML || '') +
      '</details>';
  }

  /* Sin normalizar del todo (eso lo hace Guias.normalizarNormativa al
     guardar, como con los requisitos): solo lee lo que hay escrito en
     el DOM, fila a fila. */
  function leer(raiz) {
    var filas = raiz.querySelectorAll(':scope > .paso-normativa > .normativa-lista > .normativa-fila');
    return Array.prototype.map.call(filas, function (fila) {
      return {
        id: fila.dataset.id || nuevoId(),
        cita: fila.querySelector('.normativa-cita').value.trim(),
        bloque: fila.querySelector('.normativa-bloque').value,
        clave: fila.querySelector('.normativa-clave').value.trim(),
        url: fila.querySelector('.normativa-url').value.trim()
      };
    });
  }

  function enganchar(raiz, alCambiar) {
    var det = raiz.querySelector(':scope > .paso-normativa');
    if (!det) return;

    var anadir = det.querySelector(':scope > .normativa-anadir');
    if (anadir) {
      anadir.onclick = function () {
        alCambiar(function (lista) {
          lista.push({ id: nuevoId(), cita: '', bloque: '', clave: '', url: '' });
        });
      };
    }

    var filas = det.querySelectorAll(':scope > .normativa-lista > .normativa-fila');
    Array.prototype.forEach.call(filas, function (fila, idx) {
      var quitar = fila.querySelector('.normativa-quitar');
      if (quitar) quitar.onclick = function () {
        alCambiar(function (lista) { lista.splice(idx, 1); });
      };
    });
  }

  /* ---------- la lista de solo lectura ----------

     Se ve igual en un hito normal y en uno informativo, y en la
     sección 3 (vista de solo lectura) de la pantalla de un tipo. Cada
     línea, la cita; si tiene enlace, se abre en pestaña nueva. */
  function listaHTML(normativa) {
    var lista = (normativa || []).filter(function (r) { return r && r.cita; });
    if (!lista.length) return '';
    var base = direccionBase();
    return '<div class="hito-normativa"><span class="hito-normativa-titulo">Normativa</span>' +
      lista.map(function (r) {
        var enlace = window.HitosBiblioteca ? HitosBiblioteca.enlaceDeNormativa(r, base) : '';
        return enlace
          ? '<a class="hito-normativa-linea" href="' + U.escapar(enlace) +
            '" target="_blank" rel="noopener">' + U.escapar(r.cita) + '</a>'
          : '<span class="hito-normativa-linea">' + U.escapar(r.cita) + '</span>';
      }).join('') + '</div>';
  }

  return {
    direccionBase: direccionBase, refrescar: refrescar,
    bloqueHTML: bloqueHTML, leer: leer, enganchar: enganchar, listaHTML: listaHTML
  };
})();
window.HitosNormativa = HitosNormativa;
