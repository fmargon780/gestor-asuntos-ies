/* ============================================================
   tablon-compacto-pintar.js — pintar el tablón y la lista de todas las notas (fila 536: trozo de js/tablon-compacto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/tablon-compacto.js.
   ============================================================ */
var TablonCompactoNucleo = TablonCompactoNucleo || {};
(function () {

  var I = TablonCompactoNucleo;
  I.S = I.S || {};
  function estaPlegado() { return I.estaPlegado.apply(this, arguments); }
  function $() { return I.$.apply(this, arguments); }
  function ordenar() { return I.ordenar.apply(this, arguments); }
  function filaCompacta() { return I.filaCompacta.apply(this, arguments); }
  function overlayTodas() { return I.overlayTodas.apply(this, arguments); }
  function cabecera() { return I.cabecera.apply(this, arguments); }
  function lineaPlegada() { return I.lineaPlegada.apply(this, arguments); }
  function formulario() { return I.formulario.apply(this, arguments); }

  /* Fila 212: el tablón cuelga de la propia cabecera de Inicio
     (#inicio-tablon-hueco, entre "+ Nuevo asunto" y el buscador),
     compacto; si por lo que fuera ese hueco no existiera todavía, se
     cuelga de #pantalla-abiertos como antes, para no romper nada. */
  function columna() {
    var c = $('tablon');
    if (c) return c;
    var padre = $('inicio-tablon-hueco') || $('pantalla-abiertos');
    if (!padre) return null;
    c = document.createElement('aside');
    c.id = 'tablon';
    padre.appendChild(c);
    return c;
  }

  /* Cuánto se ve plegado: como mucho tres notas pendientes, una por
     renglón, cortadas con «…» (apartado 3). El resto, y las hechas, se
     ven con "y N más" / "Ver las hechas", que despliegan
     `overlayTodas` por encima de la página (`I.S.verTodas`), sin empujar
     nada hacia abajo. */
  var TOPE_COMPACTO = 3;

  /* Si el campo de la nota nueva está abierto de verdad (con foco, o
     con algo ya escrito o con fecha puesta), o si se ha pulsado para
     abrirlo (`I.S.notaAbierta`): entonces se ven también el resto de
     opciones (colores, fecha, "Solo para mí", "Pegar la nota"). Cerrado,
     es solo el campo de una línea con su placeholder. */
  I.S.notaAbierta = false;

  /* La lista entera, por encima de la página. */
  I.S.verTodas = false;
  I.S.cerrarOverlaySiFuera = null, I.S.cerrarOverlayConEscape = null;

  function alternarTodas() {
    I.S.verTodas = !I.S.verTodas;
    pintar();
    if (I.S.verTodas) {
      /* En un turno aparte, para que el propio click que ha abierto el
         overlay no lo cierre también por "fuera". */
      setTimeout(function () {
        if (!I.S.verTodas) return;
        document.addEventListener('mousedown', I.S.cerrarOverlaySiFuera, true);
        document.addEventListener('keydown', I.S.cerrarOverlayConEscape, true);
      }, 0);
    } else {
      document.removeEventListener('mousedown', I.S.cerrarOverlaySiFuera, true);
      document.removeEventListener('keydown', I.S.cerrarOverlayConEscape, true);
    }
  }
  I.S.cerrarOverlaySiFuera = function (e) {
    var ov = document.querySelector('.tablon-overlay');
    if (ov && !ov.contains(e.target)) alternarTodas();
  };
  I.S.cerrarOverlayConEscape = function (e) { if (e.key === 'Escape') alternarTodas(); };

  /* Lo consulta js/tablon.js antes de releer el fichero en cada vuelta
     de window.Gestor.alRefrescar: mientras se escribe o se edita, el
     repintado del refresco automático no debe quitarle el sitio al
     cursor. */
  function ocupado() {
    var campo = $('tablon-texto');
    if (campo && campo === document.activeElement) return true;
    return !!I.S.editando;
  }

  function pintar() {
    var c = columna();
    if (!c) return;

    /* Lo que se esté escribiendo no se pierde al repintar: si el campo
       ya no está en el DOM (la columna se ha destruido por fuera),
       se rellena del I.S.borrador guardado en estas variables. */
    var campoTexto = $('tablon-texto');
    var escrito = campoTexto ? campoTexto.value : I.S.borrador;
    var campoFecha = $('tablon-para');
    var fechaPuesta = campoFecha ? campoFecha.value : I.S.borradorFecha;
    var campoHora = $('tablon-hora'), campoAntes = $('tablon-antes');
    var horaPuesta = campoHora ? campoHora.value : I.S.borradorHora;
    var antesPuesto = campoAntes ? Number(campoAntes.value) : I.S.borradorAntes;

    /* Tampoco se pierde el foco ni el cursor: ni del campo de la nota
       nueva, ni del de una nota que se esté cambiando ahora mismo. */
    var activo = document.activeElement;
    var enNueva = activo === campoTexto;
    var enEdicion = !enNueva && !!activo && activo.tagName === 'TEXTAREA' && c.contains(activo);
    var cursorInicio = null, cursorFin = null;
    if (enNueva || enEdicion) {
      cursorInicio = activo.selectionStart;
      cursorFin = activo.selectionEnd;
    }

    /* Las notas privadas de otro no salen aquí. */
    var mias = Tablon.notas().filter(Tablon.laVeo);
    var pendientes = ordenar(mias.filter(function (n) { return !n.hecha; }));
    var hechas = mias.filter(function (n) { return n.hecha; });

    var abierta = I.S.notaAbierta || enNueva || !!escrito || !!fechaPuesta;

    /* Plegado: una sola línea. Con algo escrito o una nota en edición no
       se pliega a la fuerza (se perdería el sitio del cursor). */
    if (estaPlegado() && !enNueva && !enEdicion && !escrito && !fechaPuesta && !I.S.editando && !I.S.verTodas) {
      c.className = 'tablon-compacto tablon-cerrado';
      c.innerHTML = '';
      c.appendChild(lineaPlegada(pendientes));
      return;
    }

    c.className = 'tablon-compacto';
    c.innerHTML = '';
    c.appendChild(cabecera(pendientes.length));
    c.appendChild(formulario(escrito, fechaPuesta, abierta, horaPuesta, antesPuesto));

    var fallo = Tablon.fallo();
    if (fallo) {
      var malo = document.createElement('div');
      malo.className = 'tablon-vacio';
      malo.textContent = 'No he podido leer las notas: ' + fallo;
      c.appendChild(malo);
    } else if (!pendientes.length && !hechas.length) {
      var vacio = document.createElement('div');
      vacio.className = 'tablon-vacio';
      vacio.textContent = 'Sin notas. Lo que no es un asunto, aquí.';
      c.appendChild(vacio);
    } else {
      pendientes.slice(0, TOPE_COMPACTO).forEach(function (n) { c.appendChild(filaCompacta(n)); });
      var deMas = pendientes.length - TOPE_COMPACTO;
      if (deMas > 0 || hechas.length) {
        var verMas = document.createElement('button');
        verMas.type = 'button';
        verMas.className = 'enlace tablon-ver-mas';
        verMas.textContent = deMas > 0 ? 'y ' + deMas + ' más' : 'Ver las hechas (' + hechas.length + ')';
        verMas.onclick = alternarTodas;
        c.appendChild(verMas);
      }
    }

    if (I.S.verTodas) c.appendChild(overlayTodas(pendientes, hechas));

    /* Se devuelve el foco y el cursor a donde estaban. */
    if (enNueva) {
      var campoNuevo = $('tablon-texto');
      if (campoNuevo) {
        campoNuevo.focus();
        try { campoNuevo.setSelectionRange(cursorInicio, cursorFin); } catch (e) {}
      }
    } else if (enEdicion) {
      var editado = c.querySelector('.papel textarea.campo');
      if (editado) {
        editado.focus();
        try { editado.setSelectionRange(cursorInicio, cursorFin); } catch (e) {}
      }
    }
  }

  I.alternarTodas = alternarTodas;
  I.ocupado = ocupado;
  I.pintar = pintar;
})();
