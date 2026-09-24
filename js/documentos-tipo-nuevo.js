/* ============================================================
   documentos-tipo-nuevo.js — crear un tipo de documento sin salir del cuadro.

   Sacado tal cual de js/documentos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado del cuadro y lo de los demás ficheros se pide a
   `Documentos._interno` (N). Se carga justo detrás de js/documentos.js.
   ============================================================ */
(function () {
  if (typeof Documentos === 'undefined' || !Documentos._interno) return;
  var N = Documentos._interno;

  function $(id) { return document.getElementById(id); }

  /* ---------- crear un tipo sin salir del cuadro ----------

     La comparación de nombres parecidos vive en util.js, porque la usan
     también las listas de Ajustes: aquí solo se pinta el resultado. */

  function parecidos(nombre, lista) {
    return U.parecidos(nombre, lista);
  }

  function cerrarCuadroDeTipoNuevo() {
    var caja = $('doc-tipo-nuevo');
    if (caja) caja.parentNode.removeChild(caja);
  }

  function abrirCuadroDeTipoNuevo() {
    var sel = $('doc-tipo');
    if (!sel || $('doc-tipo-nuevo')) return;

    var caja = document.createElement('div');
    caja.id = 'doc-tipo-nuevo';
    caja.style.cssText = 'margin:8px 0 4px;padding:10px 12px;border:1px solid #d7dee6;' +
                         'border-radius:8px;background:#f7f9fb';
    caja.innerHTML =
      '<label class="etiqueta">Nombre del tipo nuevo</label>' +
      '<input id="doc-tipo-nombre" class="campo" autocomplete="off" ' +
        'placeholder="Por ejemplo: DILIGENCIA">' +
      '<div id="doc-tipo-aviso" class="nota"></div>' +
      '<div id="doc-tipo-botones" style="display:flex;gap:8px;justify-content:flex-end;' +
        'margin-top:8px">' +
        '<button type="button" class="boton" id="doc-tipo-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="doc-tipo-crear">Crear y usar</button>' +
      '</div>';
    sel.parentNode.insertBefore(caja, sel.nextSibling);

    $('doc-tipo-nombre').oninput = pintarAvisoDeTipo;
    $('doc-tipo-nombre').onkeydown = function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); crearYUsarTipo(); }
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrarCuadroDeTipoNuevo(); }
    };
    $('doc-tipo-cancelar').onclick = cerrarCuadroDeTipoNuevo;
    $('doc-tipo-crear').onclick = crearYUsarTipo;
    pintarAvisoDeTipo();
    $('doc-tipo-nombre').focus();
  }

  function usarTipoDeLaLista(tipo) {
    var sel = $('doc-tipo');
    sel.value = tipo;
    N.ultimoTipo = tipo;
    cerrarCuadroDeTipoNuevo();
    N.pintarCamposDelTipo();
  }

  /* El aviso que va debajo del campo. Dice una de tres cosas: que el
     tipo ya existe, que hay otros que se le parecen, o que se va a
     crear. Los parecidos salen como botones: pulsarlos usa el que ya
     está, que es lo que se quiere casi siempre. */
  function pintarAvisoDeTipo() {
    var campo = $('doc-tipo-nombre');
    var aviso = $('doc-tipo-aviso');
    var crear = $('doc-tipo-crear');
    if (!campo || !aviso || !crear) return;

    var limpio = U.limpiarNombre(campo.value).toUpperCase();
    aviso.innerHTML = '';

    function decir(texto) {
      var p = document.createElement('div');
      p.textContent = texto;
      aviso.appendChild(p);
    }

    function botonUsar(tipo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.style.margin = '6px 6px 0 0';
      b.textContent = 'Usar ' + tipo;
      b.onclick = function () { usarTipoDeLaLista(tipo); };
      aviso.appendChild(b);
    }

    if (!limpio) {
      crear.disabled = true;
      decir('Escribe el nombre del tipo.');
      return;
    }

    var lista = parecidos(limpio, N.ctx.tipos());
    var mismo = lista.filter(function (p) { return p.igual; })[0];

    if (mismo) {
      crear.disabled = true;
      decir('Ese tipo ya está en la lista, escrito así: ' + mismo.nombre + '.');
      botonUsar(mismo.nombre);
      return;
    }

    crear.disabled = false;
    if (lista.length) {
      decir('Ojo, hay tipos que se le parecen. Si es el mismo, usa el que ya está:');
      lista.slice(0, 4).forEach(function (p) { botonUsar(p.nombre); });
    } else {
      decir('Se creará ' + limpio + ', y queda en la lista del centro para todos.');
    }
  }

  async function crearYUsarTipo() {
    var campo = $('doc-tipo-nombre');
    if (!campo) return;
    var limpio = U.limpiarNombre(campo.value).toUpperCase();
    if (!limpio) return;
    if (typeof N.ctx.crearTipo !== 'function') {
      U.aviso('Desde aquí no se pueden crear tipos. Se crean en Ajustes.', 'malo');
      return;
    }
    try {
      await N.ctx.crearTipo(limpio);
      var sel = $('doc-tipo');
      sel.innerHTML = N.opcionesDeTipo(limpio);
      sel.value = limpio;
      N.ultimoTipo = limpio;
      cerrarCuadroDeTipoNuevo();
      N.pintarCamposDelTipo();
      U.aviso('Tipo de documento ' + limpio + ' añadido a la lista del centro.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  Object.assign(Documentos, {
    parecidos: parecidos
  });

  Object.assign(N, {
    parecidos: parecidos,
    abrirCuadroDeTipoNuevo: abrirCuadroDeTipoNuevo
  });
})();
