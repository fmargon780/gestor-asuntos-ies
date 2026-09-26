/* ============================================================
   papelera-ajustes.js — el bloque «Papelera» de Ajustes: cuánto ocupa, cuánto hace, cada fila y sus botones.

   Sacado tal cual de js/papelera.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo compartido se pide a `Papelera._interno` (I). Se carga justo
   detrás de js/papelera.js.
   ============================================================ */
(function () {
  if (typeof Papelera === 'undefined' || !Papelera._interno) return;
  var I = Papelera._interno;

  function $(id) { return document.getElementById(id); }

  /* ---------- cuánto ocupa (fila 68, docs/AVISOS-QUE-FALTAN.md, 3) ----------

     Solo se llama para el aviso de lo viejo, nunca al pintar la lista
     entera: recorrer cada carpeta cuesta. */
  async function tamanoDeCarpeta(handle) {
    var total = 0;
    for await (var par of handle.entries()) {
      var h = par[1];
      if (h.kind === 'file') {
        try { total += (await h.getFile()).size; } catch (e) { /* seguimos */ }
      } else if (h.kind === 'directory') {
        total += await tamanoDeCarpeta(h);
      }
    }
    return total;
  }

  /* Cuánto ocupan en total, en bytes, las cosas de `viejas` (una lista
     de fichas de la papelera, como las que devuelve `leer()` filtradas
     por `_diasDesde`). Lo que no tenga carpeta (un tipo, un estado…)
     no ocupa nada aparte: solo cuenta el propio índice. */
  async function tamanoDeViejas(viejas) {
    var pap;
    try { pap = await I.carpetaPapelera(); } catch (e) { return 0; }
    var total = 0;
    for (var i = 0; i < viejas.length; i++) {
      if (!viejas[i].carpeta) continue;
      try {
        var h = await pap.getDirectoryHandle(viejas[i].carpeta);
        total += await tamanoDeCarpeta(h);
      } catch (e) { /* puede que ya no esté */ }
    }
    return total;
  }

  /* ---------- cuánto hace ----------

     En lenguaje llano, para la pantalla de la papelera. */
  function haceCuanto(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var dias = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'ayer';
    return 'hace ' + dias + ' días';
  }

  function diasDesde(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  var ICONOS = {
    documento: '📄', suelto: '📄', asunto: '📁', archivado: '📁', tipo: '📋', estado: '📋',
    'tipo-documento': '📋', 'campo-propio': '📋', tercero: '📋', 'nota-tablon': '📋', grupo: '👥'
  };

  function deDonde(ficha) {
    if (ficha.clase === 'documento') return 'Documento de ' + ((ficha.origen && ficha.origen.asunto) || '?');
    if (ficha.clase === 'suelto') return 'Documento suelto';
    if (ficha.clase === 'asunto') return 'Asunto abierto';
    if (ficha.clase === 'archivado') return 'Asunto del ARCHIVO (plazo de conservación cumplido)';
    if (ficha.clase === 'tipo') return 'Tipo de asunto';
    if (ficha.clase === 'estado') return 'Estado del asunto';
    if (ficha.clase === 'tipo-documento') return 'Tipo de documento';
    if (ficha.clase === 'campo-propio') return 'Campo propio';
    if (ficha.clase === 'tercero') return 'Persona o empresa' +
      ((ficha.origen && ficha.origen.categoria) ? ' (' + ficha.origen.categoria + ')' : '');
    if (ficha.clase === 'nota-tablon') return 'Nota del tablón';
    if (ficha.clase === 'grupo') return 'Grupo de personas';
    return '';
  }

  /* ---------- el buscador (fila 172, docs/PAPELERA-BUSCADOR.md) ----------

     Palabras sueltas, en cualquier orden, igual que el buscador de
     asuntos (js/asuntos-lista-pintar.js): una ficha se queda si su
     texto de búsqueda contiene TODAS las palabras escritas, sin
     distinguir mayúsculas ni tildes (U.normalizar). */

  /* AAMMDD y dd/mm/aaaa a partir de la fecha ISO de la ficha (U.ahora()),
     para que "2609" o "26/09" encuentren lo borrado ese día. */
  function textoFechaBusqueda(iso) {
    var aammdd = U.aAaMmDd(String(iso || '').slice(0, 10));
    if (!aammdd) return '';
    return aammdd + ' ' + U.fechaLegible(aammdd);
  }

  /* "De dónde salía": la ruta o el asunto de origen, según la clase. */
  function origenTexto(ficha) {
    var o = ficha.origen;
    if (!o) return '';
    return [o.asunto, o.ruta, o.categoria, o.tercero, o.sueltoEn].filter(Boolean).join(' ');
  }

  function textoBusqueda(ficha) {
    return U.normalizar([
      ficha.nombre, deDonde(ficha), origenTexto(ficha), ficha.quien || '',
      haceCuanto(ficha.cuando), textoFechaBusqueda(ficha.cuando)
    ].join(' '));
  }

  /* ---------- el bloque de Ajustes ---------- */

  /* Lo escrito en la caja se conserva al repintarse la lista (tras
     devolver o borrar una línea, o si llega un cambio del compañero):
     U.conservandoLoEscrito envuelve todo el bloque, no solo la lista. */
  App.pintarPapelera = function () {
    return U.conservandoLoEscrito($('bloque-papelera'), pintarPapeleraDeVerdad);
  };

  async function pintarPapeleraDeVerdad() {
    var caja = $('tabla-papelera');
    var avisoViejas = $('aviso-papelera-vieja');
    var campoBuscar = $('buscar-papelera');
    var cuentaBuscar = $('cuenta-papelera');
    if (!caja) return;

    var lista;
    try {
      lista = await I.leer();
    } catch (e) {
      caja.innerHTML = '<div class="vacio">No he podido leer la papelera: ' + U.escapar(U.mensajeDeError(e)) + '</div>';
      if (avisoViejas) avisoViejas.classList.add('oculto');
      if (cuentaBuscar) cuentaBuscar.textContent = '';
      return;
    }

    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">La papelera está vacía.</div>';
      if (avisoViejas) avisoViejas.classList.add('oculto');
      if (cuentaBuscar) cuentaBuscar.textContent = '';
      return;
    }

    var palabras = campoBuscar ? U.normalizar(campoBuscar.value).split(' ').filter(Boolean) : [];
    var listaFiltrada = palabras.length
      ? lista.filter(function (f) {
          var busca = textoBusqueda(f);
          return palabras.every(function (p) { return busca.indexOf(p) !== -1; });
        })
      : lista;

    if (cuentaBuscar) {
      cuentaBuscar.textContent = palabras.length ? (listaFiltrada.length + ' de ' + lista.length) : String(lista.length);
    }

    /* El aviso de "más de 30 días" y su botón actúan sobre la papelera
       ENTERA, nunca sobre lo filtrado (punto 9 del encargo). */
    var viejas = lista.filter(function (f) { return diasDesde(f.cuando) > I.DIAS_AVISO; });
    if (avisoViejas) {
      if (viejas.length) {
        avisoViejas.classList.remove('oculto');
        avisoViejas.innerHTML = '<strong>Hay ' + viejas.length + ' cosa' + (viejas.length === 1 ? '' : 's') +
          ' en la papelera desde hace más de ' + I.DIAS_AVISO + ' días.</strong> ';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'boton boton-peligro';
        btn.textContent = 'Borrar del todo lo de más de ' + I.DIAS_AVISO + ' días' +
          (palabras.length ? ' (de toda la papelera)' : '');
        btn.onclick = async function () {
          var ok = await U.preguntar('Borrar del todo',
            '<p>Se borran del todo ' + viejas.length + ' cosas de más de ' + I.DIAS_AVISO + ' días.</p>' +
            '<p class="nota">Esto sí lo quita de verdad. Dropbox aún lo guarda 30 días más en su ' +
            'propia papelera.</p>', 'Borrar del todo');
          if (!ok) return;
          for (var i = 0; i < viejas.length; i++) {
            try { await I.borrarDelTodo(viejas[i]); } catch (e) { /* seguimos con las demás */ }
          }
          U.aviso('Borradas del todo.', 'bueno');
          App.pintarPapelera();
        };
        avisoViejas.appendChild(btn);
      } else {
        avisoViejas.classList.add('oculto');
        avisoViejas.innerHTML = '';
      }
    }

    caja.innerHTML = '';
    if (!listaFiltrada.length) {
      caja.innerHTML = '<div class="vacio">Nada en la papelera con esas palabras.</div>';
      return;
    }
    listaFiltrada.forEach(function (ficha) { caja.appendChild(filaDePapelera(ficha)); });
  }

  if ($('buscar-papelera')) {
    $('buscar-papelera').oninput = function () { App.pintarPapelera(); };
  }

  /* Ver un documento sin sacarlo de la papelera (17-sep-2026, fila 86):
     mismo camino que ya usa devolverDocumento para llegar hasta él. */
  async function abrirDesdeLaPapelera(ficha) {
    try {
      var pap = await I.carpetaPapelera();
      var sub = await pap.getDirectoryHandle(ficha.carpeta);
      var h = await sub.getFileHandle(ficha.nombre);
      await window.Visor.abrir(h, ficha.nombre, { marcador: 'papelera:' + ficha.id });
    } catch (e) {
      U.aviso('No he podido abrirlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  var CLASES_CON_FICHERO = { documento: true, suelto: true };

  function filaDePapelera(ficha) {
    var f = document.createElement('div');
    f.className = 'fila-tipo fila-papelera';

    if (CLASES_CON_FICHERO[ficha.clase] && ficha.carpeta && window.Visor) {
      f.classList.add('fila-papelera-pulsable');
      f.title = 'Pulsa para verlo sin sacarlo de la papelera';
      f.onclick = function (ev) {
        if (ev.target.closest('button, a, input, select, textarea, label')) return;
        abrirDesdeLaPapelera(ficha);
      };
    }

    var icono = document.createElement('span');
    icono.className = 'papelera-icono';
    icono.textContent = ICONOS[ficha.clase] || '📄';
    f.appendChild(icono);

    var texto = document.createElement('span');
    texto.style.flex = '1';
    texto.innerHTML = '<span class="nombre-tipo">' + U.escapar(ficha.nombre) + '</span>' +
      '<br><span class="suave">' + U.escapar(deDonde(ficha)) + '  ·  ' +
      U.escapar(ficha.quien || 'alguien') + '  ·  ' + U.escapar(haceCuanto(ficha.cuando)) + '</span>';
    f.appendChild(texto);

    var devolver_ = document.createElement('button');
    devolver_.type = 'button';
    devolver_.className = 'boton';
    devolver_.textContent = 'Devolver a su sitio';
    devolver_.onclick = function () { pulsarDevolver(ficha); };
    f.appendChild(devolver_);

    var borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'boton boton-peligro';
    borrar.textContent = 'Borrar del todo';
    borrar.style.marginLeft = 'auto';
    borrar.onclick = async function () {
      var ok = await U.preguntar('Borrar del todo',
        '<p><strong>' + U.escapar(ficha.nombre) + '</strong></p>' +
        '<p class="nota">Esto sí lo quita de verdad. Dropbox aún lo guarda 30 días más en su ' +
        'propia papelera.</p>', 'Borrar del todo');
      if (!ok) return;
      try {
        await I.borrarDelTodo(ficha);
        U.aviso('Borrado del todo.', 'bueno');
        App.pintarPapelera();
      } catch (e) {
        U.aviso('No he podido borrarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
    f.appendChild(borrar);

    return f;
  }

  async function pulsarDevolver(ficha) {
    var r = await I.devolver(ficha);
    if (r.ok) {
      App.pintarPapelera();
      if (typeof App.verAbiertos === 'function') { try { await App.verAbiertos(); } catch (e) {} }
      /* Fila 119: un asunto devuelto, con «Ir al asunto» (ya con la lista al día). */
      if (ficha.clase === 'asunto' && window.Navegacion) Navegacion.avisoConIr(ficha.nombre + ' devuelto a su sitio.', 'bueno', ficha.nombre);
      else U.aviso((ficha.nombre) + ' devuelto a su sitio.', 'bueno');
      if (typeof App.pintarAjustes === 'function') { try { await App.pintarAjustes(); } catch (e) {} }
      return;
    }
    if (r.ofrecerSuelto) {
      var ok = await U.preguntar('El asunto ya no existe',
        '<p>' + U.escapar(r.motivo) + '</p>' +
        '<p class="nota">¿Lo llevo a "Por clasificar", como documento suelto?</p>', 'Llevarlo ahí');
      if (ok) {
        try {
          await I.devolverDocumentoComoSuelto(ficha);
          U.aviso('Llevado a Por clasificar.', 'bueno');
          App.pintarPapelera();
          if (typeof App.verAbiertos === 'function') await App.verAbiertos();
        } catch (e) {
          U.aviso('No he podido devolverlo: ' + U.mensajeDeError(e), 'malo');
        }
      }
      return;
    }
    await U.preguntar('No se puede devolver', '<p>' + U.escapar(r.motivo) + '</p>', 'Vale', true);
  }

  /* ---------- el cuadro de confirmación de siempre ----------

     Uno solo, título fijo, sin escribir nada para confirmar. */
  async function preguntarBorrar(nombre, notaExtra) {
    return U.preguntar('¿Mandar a la papelera?',
      '<p><strong>' + U.escapar(nombre) + '</strong></p>' +
      (notaExtra || '') +
      '<p class="nota">Se podrá recuperar desde Ajustes › Papelera.</p>',
      'Sí, a la papelera');
  }

  /* ---------- botones que faltaban por poner ----------

     Documento suelto y persona/empresa dada de alta a mano no tenían
     ningún botón de borrar todavía: se añaden envolviendo lo que ya
     pinta la tarjeta, igual que hace js/dni.js con el pie del alumno. */

  function botonBorrar(alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-peligro';
    b.textContent = 'Borrar';
    b.style.marginLeft = 'auto';
    b.onclick = alPulsar;
    return b;
  }

  U.envolver(App, 'App.tarjetaSuelto', 'papelera.js', function (comoEra) {
    return function (s, pie, esNuevo) {
      var div = comoEra(s, pie, esNuevo);
      var acciones = div.querySelector('.acciones');
      if (!acciones) return div;
      var borrar = botonBorrar(async function () {
        var ok = await preguntarBorrar(s.nombre);
        if (!ok) return;
        try {
          await I.mandarSuelto(s);
        } catch (e) {
          U.fallo('No he podido mandarlo a la papelera', e);
          return;
        }
        U.aviso('Documento mandado a la papelera.', 'bueno');
        try { await App.verAbiertos(); }
        catch (e2) { U.accesorio('Documento en la papelera, pero no he podido poner la lista al día', e2); }
      });
      /* Entra el último del menú de tres puntos que ya monta
         js/documentos-sueltos.js (17-sep-2026, fila 36); sin menú (no
         debería darse: "Abrir" siempre lo crea), se cae en la fila. */
      var menu = acciones.querySelector('.fila-menu');
      if (menu) menu.appendChild(borrar);
      else acciones.appendChild(borrar);
      return div;
    };
  });

  U.envolver(App, 'App.verFicha', 'papelera.js', function (comoEra) {
    return function (p) {
      comoEra(p);
      if (!App.sePuedeCambiarElTercero || !App.sePuedeCambiarElTercero(p)) return;
      var botones = $('ver-sus-asuntos');
      if (!botones || !botones.parentNode) return;
      var caja = botones.parentNode;
      caja.appendChild(botonBorrar(async function () {
        var enUso = 0;
        try {
          var todo = await window.Duplicados.delTercero(p.categoria, p.nombre);
          enUso = (todo.abiertos.length || 0) + (todo.archivados.length || 0);
        } catch (e) { enUso = 0; }
        if (enUso) {
          await U.preguntar('No se puede borrar',
            '<p>' + U.escapar(p.nombre) + ' tiene ' + enUso + ' asunto' + (enUso === 1 ? '' : 's') +
            '. No se puede borrar mientras tenga alguno.</p>', 'Vale', true);
          return;
        }
        var ok = await preguntarBorrar(p.nombre);
        if (!ok) return;
        try {
          await I.mandarDato('tercero', p.nombre, { categoria: p.categoria },
            { campos: Object.assign({}, p.campos) });
          await Datos.quitarDeLista(App.E.datos, p.categoria, p.nombre);
          Datos.olvidar(p.categoria);
          U.aviso('Mandado a la papelera.', 'bueno');
          App.pintarPersonas();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
        }
      }));
    };
  });

  Object.assign(Papelera, {
    preguntarBorrar: preguntarBorrar,
    botonBorrar: botonBorrar,
    haceCuanto: haceCuanto,
    tamanoDeViejas: tamanoDeViejas,
    _diasDesde: diasDesde
  });
})();
