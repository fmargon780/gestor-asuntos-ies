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

  /* ---------- la caja de escribir directa, en la ficha del asunto ----------

     17-sep-2026, fila 37 (docs/FICHA-DEL-ASUNTO-NUEVA.md, 2). Antes
     había que escribir y pulsar "Añadir nota"; ahora se escribe
     encima y se guarda sola, al estilo del tablón (js/tablon.js): sin
     botón, con un retardo de un segundo desde la última tecla
     (`RETARDO_AUTOGUARDADO`), nunca una escritura por pulsación.

     Mientras se sigue escribiendo (aunque la ficha se repinte sola
     por en medio, fila 34) el texto se va guardando EN LA MISMA nota,
     con `sustituirNota` y una clave de sesión (`borradorAbierto`, un
     único borrador a la vez: solo hay una ficha abierta en pantalla).
     Al volver a abrir cualquier ficha (`App.abrirFicha`, en
     js/ficha-asunto.js) se llama a `olvidarBorrador()`: la próxima
     vez que se escriba algo, nace una nota nueva. */

  var RETARDO_AUTOGUARDADO = 1000;
  var borradorAbierto = null;   /* { asunto, id } | null */
  var pendienteAutoguardado = null;

  function olvidarBorrador() {
    borradorAbierto = null;
    if (pendienteAutoguardado) { clearTimeout(pendienteAutoguardado); pendienteAutoguardado = null; }
  }

  function idDelBorrador(a) {
    if (borradorAbierto && borradorAbierto.asunto === a.nombre) return borradorAbierto.id;
    var id = 'b' + Date.now() + Math.floor(Math.random() * 1000);
    borradorAbierto = { asunto: a.nombre, id: id };
    return id;
  }

  /* `alGuardar`, si se pasa, se llama justo después de guardar de
     verdad (`js/ficha-asunto.js` le pasa su `apuntarHuella`). Sin esto,
     el guardado automático deja la huella de la ficha desactualizada
     (`a.ficha.notas` cambia por dentro sin que nadie lo apunte), y el
     próximo repintado en segundo plano (`App.reengancharFicha`, cada
     pocos segundos) se cree que algo ha cambiado DE VERDAD y rehace la
     ficha entera sin que haga falta, con el riesgo de llevarse por
     delante una nota de un hito que se esté escribiendo a la vez en
     otro campo. Apuntar la huella aquí evita ese repintado de más. */
  async function guardarBorrador(a, campo, aviso, alGuardar) {
    var texto = (campo.value || '').trim();
    if (!texto) return;
    var id = idDelBorrador(a);
    try {
      var lista = await U.mientrasGuarda(campo, function () {
        return sustituirNota(a, texto, 'borrador', id);
      });
      var listaCaja = $('ficha-notas-lista');
      if (listaCaja) listaCaja.innerHTML = pintarLista(lista);
      if (aviso) {
        aviso.textContent = lista.length === 1 ? '1 nota guardada.' : lista.length + ' notas guardadas.';
      }
      if (alGuardar) alGuardar();
    } catch (e) {
      if (aviso) aviso.textContent = 'No he podido guardar la nota: ' + e.message;
    }
  }

  function pintarCajaAutoguardado(caja, a, abierto, alGuardar) {
    var notas = notasDe(a);

    caja.innerHTML =
      (abierto
        ? '<div class="nota-nueva">' +
            '<textarea id="ficha-nota-texto" class="campo" rows="2" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<span class="nota-aviso" id="ficha-nota-aviso">Las notas no se borran. Se guardan ' +
              'solas, sin tener que pulsar nada.</span>' +
          '</div>'
        : '<p class="explica">Asunto archivado: las notas se leen, pero ya no se escriben.</p>') +
      '<div id="ficha-notas-lista" class="notas-lista">' + pintarLista(notas) + '</div>';

    if (!abierto) return;

    var campo = $('ficha-nota-texto');
    var aviso = $('ficha-nota-aviso');

    function programar() {
      if (pendienteAutoguardado) clearTimeout(pendienteAutoguardado);
      pendienteAutoguardado = setTimeout(function () {
        pendienteAutoguardado = null;
        guardarBorrador(a, campo, aviso, alGuardar);
      }, RETARDO_AUTOGUARDADO);
    }

    campo.oninput = programar;
    campo.onblur = function () {
      if (!pendienteAutoguardado) return;
      clearTimeout(pendienteAutoguardado);
      pendienteAutoguardado = null;
      guardarBorrador(a, campo, aviso, alGuardar);
    };
    /* Control + Intro sigue guardando al momento, sin esperar al
       segundo de retardo: la misma tecla que hacía "Añadir nota". */
    campo.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        if (pendienteAutoguardado) { clearTimeout(pendienteAutoguardado); pendienteAutoguardado = null; }
        guardarBorrador(a, campo, aviso, alGuardar);
      }
    };
  }

  /* La usa js/ficha-asunto.js (`pintarNotas`), envuelta ella misma en
     `U.conservandoLoEscrito` para que lo que se esté escribiendo, el
     foco y el cursor sobrevivan a un repintado (fila 34). `alGuardar`
     es opcional: `App.abrirFicha` le pasa su `apuntarHuella` para que
     el guardado automático no deje la huella de la ficha atrasada. */
  function pintarEnFicha(caja, a, abierto, alGuardar) {
    if (!caja) return;
    return U.conservandoLoEscrito(caja, function () { return pintarCajaAutoguardado(caja, a, abierto, alGuardar); });
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

  window.Notas = {
    de: notasDe,
    frescas: notasFrescas,
    anadir: anadirNota,
    sustituir: sustituirNota,
    pintar: pintarLista,
    cuando: cuando,
    yaTieneCorreo: yaTieneCorreo,
    pintarEnFicha: pintarEnFicha,
    olvidarBorrador: olvidarBorrador
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
