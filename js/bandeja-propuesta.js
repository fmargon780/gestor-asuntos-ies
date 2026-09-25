/* ============================================================
   bandeja-propuesta.js — de un correo, la propuesta de asunto (tercero, tipo y fecha) y llevarla a Nuevo asunto.

   Sacado tal cual de js/bandeja-correos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la bandeja (la carpeta, los correos, el pendiente) y lo
   de los demás ficheros de la bandeja se piden a `window.BandejaNucleo`
   (N). Se carga justo detrás de js/bandeja-correos.js.
   ============================================================ */
(function () {
  var N = window.BandejaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     LA PROPUESTA

     De un correo salen tres cosas: con quién es el asunto, de qué
     tipo es, y con qué fecha nace.
     ========================================================== */

  /* Las direcciones que trae el correo se buscan en los CSV. En el
     alumnado están las de los tutores legales, y Séneca llama a esas
     columnas de maneras distintas, así que se busca por la arroba y no
     por el título de la columna. */
  function personaConEseCorreo(lista, buscadas) {
    for (var i = 0; i < lista.length; i++) {
      var campos = lista[i].campos || {};
      for (var titulo in campos) {
        var valor = String(campos[titulo] === null || campos[titulo] === undefined ? '' : campos[titulo]);
        if (valor.indexOf('@') === -1) continue;
        var trozos = valor.split(/[;,\s]+/);
        for (var t = 0; t < trozos.length; t++) {
          var c = U.normalizar(trozos[t]);
          if (c && buscadas.indexOf(c) !== -1) return lista[i];
        }
      }
    }
    return null;
  }

  async function buscarTercero(datos) {
    var buscadas = (datos.correos || []).map(function (c) { return U.normalizar(c); });
    if (datos.de && datos.de.correo) buscadas.push(U.normalizar(datos.de.correo));
    if (!buscadas.length) return null;
    var categorias = Nombres.CATEGORIAS;
    for (var i = 0; i < categorias.length; i++) {
      try {
        var fuente = await Datos.cargar(App.E.datos, categorias[i]);
        var p = personaConEseCorreo(fuente.lista || [], buscadas);
        if (p) return p;
      } catch (e) { /* si un CSV no está, se sigue con el siguiente */ }
    }
    /* Fila 167: un organismo, por el correo de uno de sus departamentos o por su dominio. */
    if (window.Administraciones) {
      try {
        var adm = await Datos.cargar(App.E.datos, Administraciones.CATEGORIA);
        var crudos = (datos.correos || []).concat(datos.de && datos.de.correo ? [datos.de.correo] : []);
        var org = Administraciones.porDominio(adm.lista || [], crudos);
        if (org) return org;
      } catch (e) { /* sin administraciones.json, nada */ }
    }
    return null;
  }

  /* Todos los que tengan alguna de las direcciones del correo, no solo
     el primero. Lo usa la puntuación de parecido de js/bandeja-enlace.js
     para saber de quién es el correo sin volver a leer los CSV. */
  async function personasDelCorreo(datos) {
    var buscadas = (datos.correos || []).map(function (c) { return U.normalizar(c); });
    if (datos.de && datos.de.correo) buscadas.push(U.normalizar(datos.de.correo));
    if (!buscadas.length) return [];
    var salida = [];
    var categorias = Nombres.CATEGORIAS;
    for (var i = 0; i < categorias.length; i++) {
      try {
        var fuente = await Datos.cargar(App.E.datos, categorias[i]);
        var lista = fuente.lista || [];
        for (var j = 0; j < lista.length; j++) {
          var uno = personaConEseCorreo([lista[j]], buscadas);
          if (uno) salida.push(uno);
        }
      } catch (e) { /* si un CSV no está, se sigue con el siguiente */ }
    }
    return salida;
  }

  /* El tipo se busca entre los del centro: si el nombre del tipo
     aparece escrito en el correo, ese es. Gana el más largo, para que
     "MATRICULA SOBREVENIDA" mande sobre "MATRICULA". */
  function adivinarTipo(datos, categoria) {
    var texto = U.normalizar((datos.asunto || '') + ' ' + (datos.texto || ''));
    if (!texto) return null;
    var mejor = null;
    (App.E.tipos || []).forEach(function (t) {
      if (categoria && t.categoria !== categoria) return;
      var h = U.normalizar(t.tipo);
      if (h.length < 4) return;
      if (texto.indexOf(h) === -1) return;
      if (!mejor || h.length > U.normalizar(mejor.tipo).length) mejor = t;
    });
    return mejor;
  }

  async function proponer(datos) {
    var tercero = await buscarTercero(datos);
    var categoria = tercero ? (tercero.categoria || null) : null;
    return { tercero: tercero, categoria: categoria, tipo: adivinarTipo(datos, categoria) };
  }

  /* ==========================================================
     DEL CORREO A LA PANTALLA DE NUEVO ASUNTO
     ========================================================== */

  function descripcionDe(asunto) {
    var t = U.limpiarNombre(String(asunto || '').replace(/^\s*(re|rv|fwd|fw)\s*:\s*/i, ''));
    return t.length > 60 ? t.slice(0, 60).trim() : t;
  }

  function ponerViaCorreo(direccion) {
    var sel = $('campo-via');
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (U.normalizar(sel.options[i].textContent).indexOf('correo') !== -1) {
        sel.value = sel.options[i].value;
        break;
      }
    }
    var dato = $('campo-via-dato');
    if (dato && !dato.value.trim()) dato.value = direccion || '';
  }

  async function llevarANuevo(item) {
    var d = item.datos;
    N.ponerPendiente(item);
    App.ir('nuevo');

    var p = await proponer(d);
    if (p.categoria) App.elegirCategoria(p.categoria);
    if (p.tipo) App.elegirTipo(p.tipo);
    if (p.tercero) App.fijarTercero(p.tercero);

    if (d.fecha) $('campo-fecha').value = d.fecha;
    App.actualizarCursoNuevo();
    App.actualizarLimiteNuevo();
    if (!$('campo-descripcion').value.trim()) $('campo-descripcion').value = descripcionDe(d.asunto);
    ponerViaCorreo(d.de && d.de.correo);
    App.refrescarVista();
    pintarAvisoPendiente();

    if (!p.tercero) {
      U.aviso('No reconozco al remitente: elige tú con quién es el asunto.', 'malo');
      var buscador = $('buscar-tercero');
      if (buscador && p.categoria) buscador.focus();
    }
  }

  /* Un recordatorio arriba de la pantalla de nuevo asunto, para que se
     vea de dónde viene lo que hay rellenado. */
  function pintarAvisoPendiente() {
    var sitio = $('aviso-pendiente');
    if (!sitio) return;
    var mio = $('aviso-correo-pendiente');
    if (!N.pendiente()) { if (mio) mio.remove(); return; }
    if (!mio) {
      mio = document.createElement('div');
      mio.id = 'aviso-correo-pendiente';
      mio.className = 'aviso aviso-ambar';
      sitio.parentNode.insertBefore(mio, sitio);
    }
    var d = N.pendiente().datos;
    mio.innerHTML = '<strong>Este asunto viene de un correo.</strong>' +
      '<p>' + U.escapar(d.asunto || '') + ' — de ' +
      U.escapar((d.de && (d.de.nombre || d.de.correo)) || '') + '.' +
      ' Al crearlo, el PDF del correo y sus documentos entrarán en la carpeta.</p>';
    var soltar = document.createElement('button');
    soltar.className = 'boton';
    soltar.textContent = 'Este asunto no es de ese correo';
    soltar.onclick = function () { N.ponerPendiente(null); pintarAvisoPendiente(); };
    mio.appendChild(soltar);
  }

  Object.assign(window.Bandeja, {
    personasDelCorreo: personasDelCorreo,
    proponer: proponer,
    llevarANuevo: llevarANuevo
  });
  Object.assign(N, {
    pintarAvisoPendiente: pintarAvisoPendiente
  });
})();
