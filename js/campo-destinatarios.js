/* ============================================================
   campo-destinatarios.js — un campo de destinatarios que se rellena escribiendo
   (6-nov-2026, fila 555, docs/555-A-QUIEN-VA-CADA-CORREO.md).

   Lo usan el cuadro de Correo (Para, Copia, Copia oculta de un asunto: js/correo-para.js) y el editor de plantillas
   (los mismos tres campos, con papeles: js/plantilla-papeles.js). Este fichero solo pinta y maneja el campo; de dónde
   salen las opciones, y qué pasa al elegir, lo dice quien lo monta:

     CampoDestinatarios.html(id, rotulo)     la caja vacía, para meterla donde toque
     CampoDestinatarios.montar(id, cfg)      la engancha; devuelve { repintar() }
       cfg.opciones()       [{ id, nombre, rol, correo, buscar, sinCorreo, nota }] lo que se puede elegir
       cfg.elegidos()       [{ id, nombre, correo, vez }] las pastillas puestas
       cfg.alElegir(id)     se ha elegido una opción
       cfg.alQuitar(id)     se ha quitado una pastilla
       cfg.alCambiarVez(id, correo)   (opcional) un correo solo para este envío; '' = volver al guardado
       cfg.sinResultado(texto)        (opcional) el aviso cuando lo escrito no encaja con nadie
       cfg.alRelacionar(texto)        (opcional, fila 562) el aviso lleva el botón «Relacionar a alguien con el asunto»; al
                                      pulsarlo se llama con lo escrito. Sin esta opción (editor de plantillas) no sale el botón.

   Escribir saca las opciones que encajan (sin tildes ni mayúsculas, todas las palabras). Flechas e Intro eligen;
   Retroceso con la casilla vacía quita la última pastilla.
   ============================================================ */
var CampoDestinatarios = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')); }

  function html(id, rotulo) {
    return '<div class="cdest" id="' + id + '" data-campo="' + id + '">' +
      '<label class="etiqueta cdest-rotulo" for="' + id + '-escribir">' + esc(rotulo) + '</label>' +
      '<div class="cdest-caja campo">' +
        '<span class="cdest-pastillas"></span>' +
        '<input type="text" class="cdest-escribir" id="' + id + '-escribir" autocomplete="off" aria-label="' + esc(rotulo) + '">' +
      '</div>' +
      '<div class="cdest-lista oculto" role="listbox"></div>' +
      '<div class="cdest-edicion oculto"></div>' +
      '<p class="nota cdest-aviso oculto"></p>' +
    '</div>';
  }

  function montar(id, cfg) {
    var raiz = document.getElementById(id);
    if (!raiz) return { repintar: function () {} };
    var pastillas = raiz.querySelector('.cdest-pastillas');
    var entrada = raiz.querySelector('.cdest-escribir');
    var lista = raiz.querySelector('.cdest-lista');
    var edicion = raiz.querySelector('.cdest-edicion');
    var aviso = raiz.querySelector('.cdest-aviso');
    var visibles = [];
    var activa = 0;

    function ocultarLista() { lista.className = 'cdest-lista oculto'; lista.innerHTML = ''; visibles = []; }
    function decir(texto) { aviso.textContent = texto || ''; aviso.className = 'nota cdest-aviso' + (texto ? '' : ' oculto'); }
    /* Fila 562: el aviso de «no encaja con nadie» con su botón para relacionar a esa persona con el asunto. */
    function decirConBoton(texto, escrito) {
      aviso.className = 'nota cdest-aviso';
      aviso.textContent = texto + ' ';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-chico cdest-relacionar';
      b.textContent = 'Relacionar a alguien con el asunto';
      b.onmousedown = function (ev) { ev.preventDefault(); };
      b.onclick = function () { cfg.alRelacionar(escrito); };
      aviso.appendChild(b);
    }

    function repintar() {
      var puestos = cfg.elegidos();
      pastillas.innerHTML = puestos.map(function (p) {
        return '<span class="cdest-pastilla' + (p.vez ? ' cdest-vez' : '') + '" data-id="' + esc(p.id) + '">' +
          '<button type="button" class="cdest-texto" title="Escribir otro correo solo para este envío">' +
            '<strong>' + esc(p.nombre) + '</strong>' + (p.correo ? ' <span class="suave">' + esc(p.correo) + '</span>' : '') +
            (p.vez ? ' <span class="cdest-vez-rotulo">(solo esta vez)</span>' : '') + '</button>' +
          '<button type="button" class="cdest-quitar" aria-label="Quitar a ' + esc(p.nombre) + '">×</button></span>';
      }).join('');
      Array.prototype.forEach.call(pastillas.querySelectorAll('.cdest-pastilla'), function (el) {
        var pid = el.getAttribute('data-id');
        el.querySelector('.cdest-quitar').onclick = function () { cfg.alQuitar(pid); repintar(); entrada.focus(); };
        el.querySelector('.cdest-texto').onclick = function () { if (cfg.alCambiarVez) abrirEdicion(pid); };
      });
    }

    function abrirEdicion(pid) {
      var p = cfg.elegidos().filter(function (x) { return x.id === pid; })[0];
      if (!p) return;
      edicion.className = 'cdest-edicion';
      edicion.innerHTML = '<p class="nota" style="margin:6px 0 4px">Otro correo para <strong>' + esc(p.nombre) + '</strong>, solo para este envío (el guardado no cambia):</p>' +
        '<input type="email" class="campo cdest-vez-correo" value="' + esc(p.vez || '') + '" placeholder="correo@ejemplo.com"> ' +
        '<button type="button" class="boton boton-chico cdest-vez-usar">Usar este</button> ' +
        (p.vez ? '<button type="button" class="boton boton-chico cdest-vez-volver">Volver al guardado</button> ' : '') +
        '<button type="button" class="boton boton-chico cdest-vez-cancelar">Cancelar</button>';
      var campo = edicion.querySelector('.cdest-vez-correo');
      campo.focus();
      function cerrar() { edicion.className = 'cdest-edicion oculto'; edicion.innerHTML = ''; }
      edicion.querySelector('.cdest-vez-usar').onclick = function () {
        var m = String(campo.value || '').match(Destinatarios.RE_CORREO);
        if (!m || m.length !== 1) { decir('Escribe una sola dirección de correo válida.'); return; }
        decir(''); cfg.alCambiarVez(pid, m[0]); cerrar(); repintar();
      };
      var volver = edicion.querySelector('.cdest-vez-volver');
      if (volver) volver.onclick = function () { cfg.alCambiarVez(pid, ''); cerrar(); repintar(); };
      edicion.querySelector('.cdest-vez-cancelar').onclick = cerrar;
      campo.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); edicion.querySelector('.cdest-vez-usar').click(); } };
    }

    function pintarLista() {
      var texto = norm(entrada.value).trim();
      decir('');
      if (!texto) { ocultarLista(); return; }
      var palabras = texto.split(/\s+/);
      var yaPuestos = {};
      cfg.elegidos().forEach(function (p) { yaPuestos[p.id] = true; });
      visibles = cfg.opciones().filter(function (o) {
        if (yaPuestos[o.id]) return false;
        var pajar = norm((o.buscar || '') + ' ' + o.nombre + ' ' + (o.rol || ''));
        return palabras.every(function (w) { return pajar.indexOf(w) !== -1; });
      });
      if (!visibles.length) {
        ocultarLista();
        var sin = cfg.sinResultado ? cfg.sinResultado(entrada.value) : '';
        if (!sin) {
          var nadie = /@/.test(entrada.value) ? 'Nadie de este asunto tiene esa dirección.' : 'Nadie de este asunto se llama así.';
          if (cfg.alRelacionar) { decirConBoton(nadie + ' Para escribirle, relaciónalo con el asunto:', entrada.value); return; }
          sin = /@/.test(entrada.value)
            ? 'Solo se escribe a personas de este asunto. Para escribir a alguien más, relaciónalo antes con el asunto.'
            : 'Nadie de este asunto se llama así. Para escribir a alguien más, relaciónalo antes con el asunto.';
        }
        decir(sin);
        return;
      }
      activa = 0;
      lista.className = 'cdest-lista';
      lista.innerHTML = visibles.map(function (o, i) {
        return '<button type="button" class="cdest-opcion' + (i === 0 ? ' cdest-activa' : '') + (o.sinCorreo ? ' cdest-sin-correo' : '') + '" data-i="' + i + '"' +
          (o.sinCorreo ? ' aria-disabled="true"' : '') + '>' +
          '<strong>' + esc(o.nombre) + '</strong>' + (o.rol ? ' <span class="suave">· ' + esc(o.rol) + '</span>' : '') +
          (o.correo ? '<br><span class="suave">' + esc(o.correo) + '</span>' : '') +
          (o.sinCorreo ? '<br><span class="cdest-aviso-sin">Sin correo: no se puede añadir</span>' : '') +
          (o.nota ? '<br><span class="suave">' + esc(o.nota) + '</span>' : '') + '</button>';
      }).join('');
      Array.prototype.forEach.call(lista.querySelectorAll('.cdest-opcion'), function (b) {
        b.onmousedown = function (ev) { ev.preventDefault(); };
        b.onclick = function () { elegir(parseInt(b.getAttribute('data-i'), 10)); };
      });
    }

    function marcarActiva() {
      Array.prototype.forEach.call(lista.querySelectorAll('.cdest-opcion'), function (b, i) {
        b.classList.toggle('cdest-activa', i === activa);
      });
    }

    function elegir(i) {
      var o = visibles[i];
      if (!o) return;
      if (o.sinCorreo) { decir('Sin correo: no se puede añadir a ' + o.nombre + '.'); return; }
      entrada.value = '';
      ocultarLista();
      decir('');
      cfg.alElegir(o.id);
      repintar();
      entrada.focus();
    }

    entrada.oninput = pintarLista;
    entrada.onkeydown = function (ev) {
      if (ev.key === 'ArrowDown' && visibles.length) { ev.preventDefault(); activa = Math.min(visibles.length - 1, activa + 1); marcarActiva(); }
      else if (ev.key === 'ArrowUp' && visibles.length) { ev.preventDefault(); activa = Math.max(0, activa - 1); marcarActiva(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); if (visibles.length) elegir(activa); }
      else if (ev.key === 'Escape') { ocultarLista(); }
      else if (ev.key === 'Backspace' && !entrada.value) {
        var puestos = cfg.elegidos();
        if (puestos.length) { cfg.alQuitar(puestos[puestos.length - 1].id); repintar(); }
      }
    };
    entrada.onblur = function () { setTimeout(ocultarLista, 150); };

    repintar();
    return { repintar: repintar };
  }

  return { html: html, montar: montar };
})();
window.CampoDestinatarios = CampoDestinatarios;
