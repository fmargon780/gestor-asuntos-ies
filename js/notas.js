/* ============================================================
   notas.js — el diario de cada asunto.

   Aquí se apunta lo que va pasando en una gestión: la llamada del
   martes, que falta un papel, que la madre pasará el viernes. No es
   la guía: la guía dice los pasos que hay que dar en un asunto de
   ese tipo, y esto cuenta lo que ha pasado en este asunto concreto.

   Cada nota queda con la fecha, la hora y quién la escribió, y se
   añade debajo de las anteriores. No se sobrescriben: son el rastro
   de la tramitación.

   Se guardan en la ficha del asunto, dentro de _GESTOR/asuntos.json,
   así que las ve todo el que abra la aplicación sobre la carpeta
   compartida.

   En el ARCHIVO las notas se leen, pero no se escriben, igual que
   pasa con el nombre de la carpeta.
   ============================================================ */
(function () {

  var FICHERO_ASUNTOS = 'asuntos.json';

  function $(id) { return document.getElementById(id); }

  function notasDe(a) {
    var n = a && a.ficha && a.ficha.notas;
    return Array.isArray(n) ? n : [];
  }

  /* La fecha y la hora en que se escribió, en cristiano. */
  function cuando(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES') + ' · ' +
           String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }

  /* ---------- el botón de cada asunto ---------- */

  function botonDeTarjeta(a, modo) {
    var notas = notasDe(a);
    var b = document.createElement('button');
    b.className = 'boton' + (notas.length ? ' boton-marcado' : '');
    b.textContent = notas.length ? 'Notas ' + notas.length : 'Notas';

    var ultima = notas[notas.length - 1];
    b.title = ultima
      ? 'Última nota, ' + cuando(ultima.cuando) + ': ' + ultima.texto
      : 'Apuntar lo que va pasando en este asunto';

    b.onclick = function () { abrirNotas(a, modo); };
    return b;
  }

  /* ---------- guardar una nota ----------

     Antes de añadir se relee el fichero compartido, por si el
     compañero ha escrito otra nota desde el otro ordenador mientras
     tanto: así se añade a la suya en vez de pisarla. */

  async function notasFrescas(a) {
    try {
      var g = window.Gestor.carpetaGestor();
      if (g) {
        var registro = await Carpetas.leerJson(g, FICHERO_ASUNTOS);
        var ficha = registro && registro.asuntos ? registro.asuntos[a.nombre] : null;
        if (ficha && Array.isArray(ficha.notas)) return ficha.notas.slice();
      }
    } catch (e) { /* si no se puede leer, se sigue con lo que hay en memoria */ }
    return notasDe(a).slice();
  }

  async function anadirNota(a, texto) {
    var lista = await notasFrescas(a);
    lista.push({
      texto: texto,
      quien: window.Gestor.usuario() || '',
      cuando: U.ahora()
    });
    await window.Gestor.anotar(a.nombre, {
      notas: lista,
      notaEl: U.ahora(),
      notaPor: window.Gestor.usuario() || ''
    });
    return lista;
  }

  /* ---------- la ventana ---------- */

  function pintarLista(notas) {
    if (!notas.length) {
      return '<div class="vacio">Todavía no hay ninguna nota en este asunto.</div>';
    }
    /* La más reciente arriba: es la que casi siempre se busca. */
    return notas.slice().reverse().map(function (n) {
      return '<div class="nota-fila">' +
               '<div class="nota-cabeza">' +
                 '<span class="nota-cuando">' + U.escapar(cuando(n.cuando)) + '</span>' +
                 (n.quien ? '<span class="nota-quien">' + U.escapar(n.quien) + '</span>' : '') +
               '</div>' +
               '<div class="nota-texto">' + U.escapar(n.texto) + '</div>' +
             '</div>';
    }).join('');
  }

  async function abrirNotas(a, modo) {
    var notas = notasDe(a);
    var sePuedeEscribir = (modo === 'abierto');

    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-medio');

    var cuerpo =
      (sePuedeEscribir
        ? '<div class="nota-nueva">' +
            '<textarea id="nota-texto" class="campo" rows="3" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<div class="nota-botonera">' +
              '<span class="nota-aviso" id="nota-aviso">Las notas no se borran: ' +
              'son el rastro de la tramitación.</span>' +
              '<button type="button" id="nota-anadir" class="boton boton-principal">Añadir nota</button>' +
            '</div>' +
          '</div>'
        : '<p class="explica">Este asunto está archivado. Sus notas se leen, ' +
          'pero ya no se escriben.</p>') +
      '<div id="notas-lista" class="notas-lista">' + pintarLista(notas) + '</div>';

    var esperar = U.preguntar('Notas de ' + a.nombre, cuerpo, 'Cerrar', true);

    if (sePuedeEscribir) {
      var campo = $('nota-texto');
      var boton = $('nota-anadir');
      var guardando = false;

      async function guardar() {
        var texto = (campo.value || '').trim();
        if (!texto) { campo.focus(); return; }
        if (guardando) return;
        guardando = true;
        boton.disabled = true;
        try {
          notas = await anadirNota(a, texto);
          campo.value = '';
          $('notas-lista').innerHTML = pintarLista(notas);
          $('nota-aviso').textContent = notas.length === 1
            ? '1 nota guardada.'
            : notas.length + ' notas guardadas.';
        } catch (e) {
          U.aviso('No he podido guardar la nota: ' + e.message, 'malo');
        }
        boton.disabled = false;
        guardando = false;
        campo.focus();
      }

      boton.onclick = guardar;

      /* Control + Intro guarda, como en el correo. El Intro suelto
         hace punto y aparte, que es lo que se espera de un recuadro
         de varias líneas. */
      campo.onkeydown = function (ev) {
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault();
          guardar();
        }
      };

      if (campo) { try { campo.focus(); } catch (e) {} }
    }

    await esperar;
    if (cuadro) cuadro.classList.remove('cuadro-medio');

    /* Se repinta la lista para que el botón enseñe la cuenta nueva. */
    await window.Gestor.recargar();
  }

  /* ---------- arranque ---------- */

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.botonesDeTarjeta.push(botonDeTarjeta);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
