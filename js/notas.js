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

  /* Una nota puede traer un enlace: el correo del que salió, por
     ejemplo. Se enseña como botón, nunca escrito dentro del texto.
     Una dirección de Gmail ocupa cuatro líneas y no la lee nadie. */
  function enlaceDeNota(n) {
    var url = String((n && n.enlace) || '');
    if (!/^https?:\/\//i.test(url)) return '';
    return '<div class="nota-botones">' +
             '<a class="boton nota-boton" target="_blank" rel="noopener" href="' +
             U.escapar(url) + '">' +
             U.escapar((n && n.enlaceTexto) || 'Abrir el enlace') + '</a>' +
           '</div>';
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

  /* `extra` es opcional. Sirve para que una nota lleve algo más que
     su texto: el enlace al correo del que salió, y el identificador
     de ese correo, que es lo que luego evita apuntarlo dos veces. */
  async function anadirNota(a, texto, extra) {
    var lista = await notasFrescas(a);
    var nota = {
      texto: texto,
      quien: window.Gestor.usuario() || '',
      cuando: U.ahora()
    };
    if (extra) Object.keys(extra).forEach(function (k) {
      if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') nota[k] = extra[k];
    });
    lista.push(nota);
    await window.Gestor.anotar(a.nombre, {
      notas: lista,
      notaEl: U.ahora(),
      notaPor: window.Gestor.usuario() || ''
    });
    return lista;
  }

  /* Como `anadirNota`, pero para las notas que van atadas a un mismo
     hecho y no deben acumularse: el registro de un documento
     (js/registro.js, js/registro-sellado.js). Si ya hay una nota con
     ese mismo `campoClave`/`valorClave` (por ejemplo, el mismo
     documento original), se sustituye en su sitio; si no, se añade al
     final como cualquier otra. */
  async function sustituirNota(a, texto, campoClave, valorClave, extra) {
    var lista = await notasFrescas(a);
    var nota = {
      texto: texto,
      quien: window.Gestor.usuario() || '',
      cuando: U.ahora()
    };
    nota[campoClave] = valorClave;
    if (extra) Object.keys(extra).forEach(function (k) {
      if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') nota[k] = extra[k];
    });
    var indice = -1;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i][campoClave] === valorClave) { indice = i; break; }
    }
    if (indice === -1) lista.push(nota); else lista[indice] = nota;
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
               enlaceDeNota(n) +
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

  /* ---------- lo que se deja a la vista ----------

     La ficha del asunto enseña las notas dentro de la pantalla, sin
     ventana. Para no escribir dos veces lo mismo, usa estas piezas. */

  /* ¿Este asunto tiene ya apuntado este correo? Se mira en el fichero
     compartido, no en lo que hay en memoria: el correo puede haberlo
     guardado el compañero desde el otro ordenador. */
  async function yaTieneCorreo(a, id) {
    if (!id) return false;
    var lista = await notasFrescas(a);
    return lista.some(function (n) { return n && n.correo === id; });
  }

  /* ---------- la caja de escribir directa, en la ficha del asunto ----------

     (17-sep-2026, fila 37, docs/FICHA-DEL-ASUNTO-NUEVA.md.) Antes había
     que escribir y pulsar "Añadir nota"; ahora se escribe y se guarda
     sola, como el tablón: un segundo después de la última tecla
     (`U.mientrasGuarda` mientras se guarda), sin perder lo que se esté
     escribiendo si la ficha se repinta por otro motivo mientras tanto
     (quien llama envuelve esto en `U.conservandoLoEscrito`, igual que
     ya hacía antes con el cuadro de botón). */
  var ESPERA_GUARDADO = 1000;

  /* El temporizador pendiente vive fuera de pintarBloqueFicha, no
     dentro: la ficha entera puede repintarse (llega un documento, por
     ejemplo) mientras el segundo de espera todavía corre, y ese
     repintado crea un <textarea> nuevo. Sin esto, el temporizador
     viejo seguiría apuntando al campo de antes —ya fuera del DOM,
     pero vivo en memoria— y acabaría guardando su texto una segunda
     vez, por su cuenta, cuando el campo nuevo ya hubiera guardado el
     suyo. Solo hay una ficha abierta a la vez, así que basta con una
     variable de módulo. */
  var pendienteGuardado = null;

  function pintarBloqueFicha(caja, a, abierto, alGuardar) {
    if (pendienteGuardado) { clearTimeout(pendienteGuardado); pendienteGuardado = null; }
    if (!caja) return;
    var notas = notasDe(a);

    caja.innerHTML =
      (abierto
        ? '<div class="nota-nueva">' +
            '<textarea id="ficha-nota-texto" class="campo" rows="2" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<span class="nota-aviso" id="ficha-nota-aviso">Las notas no se borran. ' +
              'Se guarda sola, un segundo después de dejar de escribir.</span>' +
          '</div>'
        : '<p class="explica">Asunto archivado: las notas se leen, pero ya no se escriben.</p>') +
      '<div id="ficha-notas-lista" class="notas-lista">' + pintarLista(notas) + '</div>';

    if (!abierto) return;

    var campo = $('ficha-nota-texto');

    function programar() {
      if (pendienteGuardado) clearTimeout(pendienteGuardado);
      pendienteGuardado = setTimeout(function () { pendienteGuardado = null; guardar(); }, ESPERA_GUARDADO);
    }

    async function guardar() {
      var texto = (campo.value || '').trim();
      if (!texto) return;
      await U.mientrasGuarda(campo, async function () {
        var lista;
        try {
          lista = await anadirNota(a, texto);
        } catch (e) {
          U.aviso('No he podido guardar la nota: ' + e.message, 'malo');
          return;
        }
        /* La ficha puede haberse repintado entera mientras se guardaba
           (otro campo con el mismo id, ya no el de aquí): no se toca
           nada que no sea de esta caja. */
        if ($('ficha-nota-texto') !== campo) return;
        campo.value = '';
        var lst = $('ficha-notas-lista');
        if (lst) lst.innerHTML = pintarLista(lista);
        var aviso = $('ficha-nota-aviso');
        if (aviso) {
          aviso.textContent = lista.length === 1 ? '1 nota guardada.' : lista.length + ' notas guardadas.';
        }
        if (alGuardar) alGuardar();
      });
    }

    campo.oninput = programar;
    campo.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        if (pendienteGuardado) { clearTimeout(pendienteGuardado); pendienteGuardado = null; }
        guardar();
      }
    };
    /* Si queda algo escrito, el segundo de espera se pone en marcha
       igual, para que ese texto no se quede sin guardar para siempre
       si nadie vuelve a tocar el teclado. No se comprueba aquí mismo:
       quien llama a pintarBloqueFicha es U.conservandoLoEscrito, y
       todavía no ha restaurado el valor de antes del repintado (lo
       hace con una asignación directa, justo después de que esta
       función termine, sin disparar "input"). Un setTimeout(0) deja
       pasar ese turno y comprueba ya con el valor de verdad. */
    setTimeout(function () {
      if ($('ficha-nota-texto') === campo && campo.value.trim()) programar();
    }, 0);
  }

  window.Notas = {
    de: notasDe,
    frescas: notasFrescas,
    anadir: anadirNota,
    sustituir: sustituirNota,
    pintar: pintarLista,
    cuando: cuando,
    yaTieneCorreo: yaTieneCorreo,
    pintarBloqueFicha: pintarBloqueFicha
  };

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
