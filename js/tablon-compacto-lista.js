/* ============================================================
   tablon-compacto-lista.js — las notas en lista, la cabecera plegada y la casilla «solo para mí» (fila 536: trozo de js/tablon-compacto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/tablon-compacto.js.
   ============================================================ */
var TablonCompactoNucleo = TablonCompactoNucleo || {};
(function () {

  var I = TablonCompactoNucleo;
  I.S = I.S || {};
  function alternarPliegue() { return I.alternarPliegue.apply(this, arguments); }
  function legible() { return I.legible.apply(this, arguments); }
  function urgencia() { return I.urgencia.apply(this, arguments); }
  function alternarTodas() { return I.alternarTodas.apply(this, arguments); }
  function pintar() { return I.pintar.apply(this, arguments); }
  function marcarHecha() { return I.marcarHecha.apply(this, arguments); }
  function borrarNota() { return I.borrarNota.apply(this, arguments); }
  function papel() { return I.papel.apply(this, arguments); }
  function boton() { return I.boton.apply(this, arguments); }
  function pasarAAsunto() { return I.pasarAAsunto.apply(this, arguments); }

  /* ---------- cada fila compacta ----------

     Una línea: color a la izquierda, texto cortado con «…»
     (css/tablon.css), y el menú de siempre (⋮) con las mismas cuatro
     acciones que llevaba cada "papel" entero. Pulsar la fila, fuera del
     menú, abre el mismo menú (no hay sitio para tenerlas siempre a la
     vista, como pide el encargo). */
  function filaCompacta(n) {
    var fila = document.createElement('div');
    fila.className = 'tablon-fila-compacta color-' + n.color;
    fila.dataset.nota = n.id;

    if (n.para) {
      var u = urgencia(n);
      var marca = document.createElement('span');
      marca.className = 'tablon-fila-compacta-fecha' + (u === 0 ? ' papel-atrasada' : (u === 1 ? ' papel-hoy' : ''));
      marca.textContent = u === 0 ? 'Atrasada' : (u === 1 ? 'Hoy' : legible(n.para));
      /* Fila 372: con hora, relojito y hora; pasada, en gris y sin «Atrasada». */
      if (n.hora) {
        marca.textContent = TablonHora.marca(n);
        marca.className = 'tablon-fila-compacta-fecha' + (TablonHora.pasada(n) ? ' tablon-pasada' : (u === 1 ? ' papel-hoy' : ''));
      }
      fila.appendChild(marca);
    }
    if (n.privada) {
      var candado = document.createElement('span');
      candado.className = 'tablon-fila-compacta-privada';
      candado.setAttribute('data-ayuda-clave', 'solo-para-mi');
      candado.textContent = '🔒';
      fila.appendChild(candado);
    }

    var texto = document.createElement('span');
    texto.className = 'tablon-fila-compacta-texto';
    texto.textContent = n.texto;
    texto.title = n.texto;
    fila.appendChild(texto);

    var menu = U.menuDeAcciones([
      boton('Hecha', function () { marcarHecha(n); }, true),
      boton('Cambiar', function () { I.S.editando = n.id; alternarTodas(); }),
      boton('A asunto', function () { pasarAAsunto(n); }),
      boton('Borrar', function () { borrarNota(n); })
    ]);
    fila.appendChild(menu);

    fila.onclick = function (ev) {
      if (ev.target.closest('button, .fila-menu-envoltorio')) return;
      var btn = menu.querySelector('.fila-menu-btn');
      if (btn) btn.click();
    };
    return fila;
  }

  /* ---------- la lista entera, por encima de la página ---------- */

  function overlayTodas(pendientes, hechas) {
    var ov = document.createElement('div');
    ov.className = 'tablon-overlay';

    var cab = document.createElement('div');
    cab.className = 'tablon-overlay-cabecera';
    var titulo = document.createElement('span');
    titulo.className = 'tablon-titulo';
    titulo.textContent = 'Tablón';
    cab.appendChild(titulo);
    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'tablon-overlay-cerrar';
    cerrar.setAttribute('data-ayuda-clave', 'cerrar');
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '✕';
    cerrar.onclick = alternarTodas;
    cab.appendChild(cerrar);
    ov.appendChild(cab);

    if (!pendientes.length) {
      var vacio = document.createElement('div');
      vacio.className = 'tablon-vacio';
      vacio.textContent = 'Sin notas pendientes.';
      ov.appendChild(vacio);
    } else {
      pendientes.forEach(function (n) { ov.appendChild(papel(n)); });
    }

    if (hechas.length) {
      var ver = document.createElement('button');
      ver.type = 'button';
      ver.className = 'enlace tablon-ver-hechas';
      ver.textContent = I.S.verHechas
        ? 'Esconder las hechas (' + hechas.length + ')'
        : 'Ver las hechas (' + hechas.length + ')';
      ver.onclick = function () { I.S.verHechas = !I.S.verHechas; pintar(); };
      ov.appendChild(ver);
      if (I.S.verHechas) {
        hechas.slice().reverse().forEach(function (n) { ov.appendChild(papel(n)); });
      }
    }
    return ov;
  }

  function cabecera(cuantas) {
    var h = document.createElement('div');
    h.className = 'tablon-cabecera';
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'tablon-pliega';
    b.className = 'tablon-pliega';
    b.setAttribute('data-ayuda-clave', 'plegar-el-tablon');
    b.setAttribute('aria-expanded', 'true');
    b.innerHTML = '<span class="tablon-titulo">Tablón</span>' +
                  '<span class="cuenta-lista">' + cuantas + '</span><span>▾</span>';
    b.onclick = alternarPliegue;
    h.appendChild(b);
    return h;
  }

  /* La línea de cuando está plegado: «Tablón (N) ▸» y el texto, recortado,
     de la nota pendiente más reciente (la de creación más nueva) que ve
     este usuario. */
  function lineaPlegada(pendientes) {
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'tablon-plegado';
    b.className = 'tablon-plegado';
    b.setAttribute('aria-expanded', 'false');
    var mas = null;
    pendientes.forEach(function (n) {
      if (!mas || (n.creado || '') > (mas.creado || '')) mas = n;
    });
    var t = document.createElement('span');
    t.className = 'tablon-titulo';
    t.textContent = 'Tablón (' + pendientes.length + ') ▸';
    b.appendChild(t);
    if (mas) {
      var x = document.createElement('span');
      x.className = 'tablon-plegado-texto';
      x.textContent = String(mas.texto).replace(/\s+/g, ' ');
      b.appendChild(x);
    }
    b.onclick = alternarPliegue;
    return b;
  }

  /* ---------- escribir una nota ---------- */

  /* La casilla de "Solo para mí". Se usa en dos sitios: al escribir una
     nota nueva y al cambiar una que ya está puesta. */
  function casillaSoloParaMi(id, marcada, alCambiar) {
    var etiqueta = document.createElement('label');
    etiqueta.className = 'tablon-solo-mia';
    etiqueta.setAttribute('data-ayuda-clave', 'la-veras-solo-tu-en-este');

    var casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.id = id;
    casilla.checked = !!marcada;
    if (alCambiar) casilla.onchange = function () { alCambiar(casilla.checked); };
    etiqueta.appendChild(casilla);

    var texto = document.createElement('span');
    texto.textContent = 'Solo para mí';
    etiqueta.appendChild(texto);
    return etiqueta;
  }

  I.filaCompacta = filaCompacta;
  I.overlayTodas = overlayTodas;
  I.cabecera = cabecera;
  I.lineaPlegada = lineaPlegada;
  I.casillaSoloParaMi = casillaSoloParaMi;
})();
