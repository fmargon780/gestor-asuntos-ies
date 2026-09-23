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

  /* ---------- buscar dentro de las notas (19-sep-2026, fila 73,
     docs/BUSCAR-EN-LAS-NOTAS.md) ---------- */

  var TOPE_TEXTO_BUSQUEDA = 2000;

  /* El texto de todas las notas de un asunto, unido y recortado: lo
     que hace falta para meter en el "busca" de la tarjeta (abierto) o
     en el índice (archivado). Una nota de 50.000 caracteres no debe
     poder reventar nada: se recorta aquí, antes de guardar o buscar. */
  function textoParaBuscar(ficha) {
    var texto = notasDe({ ficha: ficha }).map(function (n) { return (n && n.texto) || ''; }).join(' ');
    return texto.length > TOPE_TEXTO_BUSQUEDA ? texto.slice(0, TOPE_TEXTO_BUSQUEDA) : texto;
  }

  /* Un trozo del texto de las notas alrededor de la primera palabra de
     `palabras` (ya normalizadas) que aparezca en él, para enseñar por
     qué ha salido el asunto en la búsqueda cuando ha sido solo por una
     nota (punto 2.3 del encargo). Devuelve { antes, palabra, despues }
     (sin escapar: quien pinta decide cómo), o null si ninguna
     palabra aparece en el texto. */
  function fragmentoDeBusqueda(texto, palabras) {
    if (!texto || !palabras || !palabras.length) return null;
    var trozos = String(texto).split(/\s+/).filter(Boolean);
    for (var i = 0; i < trozos.length; i++) {
      var normal = U.normalizar(trozos[i]);
      var coincide = palabras.some(function (p) { return normal.indexOf(p) !== -1; });
      if (!coincide) continue;
      var desde = Math.max(0, i - 6);
      var hasta = Math.min(trozos.length, i + 7);
      return {
        antes: (desde > 0 ? '… ' : '') + trozos.slice(desde, i).join(' '),
        palabra: trozos[i],
        despues: trozos.slice(i + 1, hasta).join(' ') + (hasta < trozos.length ? ' …' : '')
      };
    }
    return null;
  }

  /* Si el asunto ha salido en la búsqueda SOLO por una nota (ninguna
     palabra buscada está en `buscaSinNotas`), el trocito de la nota
     donde aparece; si no, null. Puro, sin DOM: lo llama
     App.fragmentoDeNota (js/asuntos-lista.js), que le pasa lo que ya
     tiene calculado el asunto. */
  function fragmentoSiSoloEnNota(busca, buscaSinNotas, notasTexto, palabras) {
    if (!palabras || !palabras.length) return null;
    var soloEnNota = palabras.some(function (p) {
      return (busca || '').indexOf(p) !== -1 && (buscaSinNotas || '').indexOf(p) === -1;
    });
    if (!soloEnNota) return null;
    return fragmentoDeBusqueda(notasTexto || '', palabras);
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
          U.aviso('No he podido guardar la nota: ' + U.mensajeDeError(e), 'malo');
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

     17-sep-2026, fila 37 (docs/FICHA-DEL-ASUNTO-NUEVA.md, 2): se
     escribe encima de la lista, sin ventana aparte, al estilo del
     tablón (js/tablon.js). Hasta la fila 58 (18-sep-2026,
     docs/AJUSTES-DE-USO-2026-09-18.md, 3) se guardaba sola cada
     segundo desde la última tecla: Francisco veía la nota guardada
     antes de terminar la frase. Ahora **no** se guarda mientras se
     escribe: solo al pulsar *Guardar*, o al salir del recuadro
     (perder el foco) si hay algo escrito. Si se intenta salir de la
     ficha con texto sin guardar, `confirmarSalirDeFicha` avisa antes
     de tirarlo (la usa `$('ficha-volver').onclick`, en
     js/ficha-asunto.js).

     Mientras se sigue escribiendo (aunque la ficha se repinte sola
     por en medio, fila 34) el texto se va guardando EN LA MISMA nota,
     con `sustituirNota` y una clave de sesión (`borradorAbierto`, un
     único borrador a la vez: solo hay una ficha abierta en pantalla).
     Al volver a abrir cualquier ficha (`App.abrirFicha`, en
     js/ficha-asunto.js) se llama a `olvidarBorrador()`: la próxima
     vez que se escriba algo, nace una nota nueva. */

  var borradorAbierto = null;        /* { asunto, id } | null */
  var borradorUltimoGuardado = '';   /* lo que ya quedó guardado del borrador actual */
  var guardandoBorrador = null;      /* la promesa del guardado en marcha, o null */
  var cajaAsuntoActual = null;       /* el asunto de la caja de la ficha, mientras esté abierto */

  function olvidarBorrador() {
    borradorAbierto = null;
    borradorUltimoGuardado = '';
    guardandoBorrador = null;
  }

  function idDelBorrador(a) {
    if (borradorAbierto && borradorAbierto.asunto === a.nombre) return borradorAbierto.id;
    var id = 'b' + Date.now() + Math.floor(Math.random() * 1000);
    borradorAbierto = { asunto: a.nombre, id: id };
    borradorUltimoGuardado = '';
    return id;
  }

  /* `alGuardar`, si se pasa, se llama justo después de guardar de
     verdad (`js/ficha-asunto.js` le pasa su `apuntarHuella`). Sin esto,
     guardar la nota deja la huella de la ficha desactualizada
     (`a.ficha.notas` cambia por dentro sin que nadie lo apunte), y el
     próximo repintado en segundo plano (`App.reengancharFicha`, cada
     pocos segundos) se cree que algo ha cambiado DE VERDAD y rehace la
     ficha entera sin que haga falta, con el riesgo de llevarse por
     delante una nota de un hito que se esté escribiendo a la vez en
     otro campo. Apuntar la huella aquí evita ese repintado de más.

     Encadenada, no con un simple "si ya hay uno en marcha, no hagas
     nada" (18-sep-2026, fila 58): abrir el aviso de "Tienes una nota
     sin guardar" (`confirmarSalirDeFicha`, más abajo) le quita el foco
     al campo —el propio cuadro pone el cursor en su primer campo—, así
     que el `onblur` de aquí abajo dispara su propio guardado justo
     antes de que se pulse "Guardar y salir". Con un simple booleano,
     esa segunda llamada se encontraba el guardado del blur a medias y
     se saltaba entera, sin esperar a que terminara: `volverALaLista()`
     podía llegar a llamarse con el guardado de verdad todavía en el
     aire. Encadenar la promesa hace que cualquiera que la espere
     (`await guardarBorrador(...)`) espere de verdad a que el disco
     quede escrito, venga la llamada de donde venga. */
  function guardarBorrador(a, campo, aviso, alGuardar) {
    var previo = guardandoBorrador || Promise.resolve();
    var propia = previo.then(function () {
      var texto = (campo.value || '').trim();
      if (!texto || texto === borradorUltimoGuardado) return;
      var id = idDelBorrador(a);
      return U.mientrasGuarda(campo, function () { return sustituirNota(a, texto, 'borrador', id); })
        .then(function (lista) {
          borradorUltimoGuardado = texto;
          var listaCaja = $('ficha-notas-lista');
          if (listaCaja) listaCaja.innerHTML = pintarLista(lista);
          if (aviso) {
            aviso.textContent = lista.length === 1 ? '1 nota guardada.' : lista.length + ' notas guardadas.';
          }
          if (alGuardar) alGuardar();
        })
        .catch(function (e) {
          if (aviso) aviso.textContent = 'No he podido guardar la nota: ' + U.mensajeDeError(e);
        });
    });
    guardandoBorrador = propia;
    propia.then(function () { if (guardandoBorrador === propia) guardandoBorrador = null; });
    return propia;
  }

  function pintarCajaDeNota(caja, a, abierto, alGuardar) {
    var notas = notasDe(a);
    cajaAsuntoActual = abierto ? a : null;

    caja.innerHTML =
      (abierto
        ? '<div class="nota-nueva">' +
            '<textarea id="ficha-nota-texto" class="campo" rows="2" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<div class="nota-botonera">' +
              '<span class="nota-aviso" id="ficha-nota-aviso">Se guarda al pulsar Guardar, o al ' +
                'salir del recuadro si hay algo escrito.</span>' +
              '<button type="button" id="ficha-nota-guardar" class="boton boton-principal">Guardar</button>' +
            '</div>' +
          '</div>'
        : '<p class="explica">Asunto archivado: las notas se leen, pero ya no se escriben.</p>') +
      '<div id="ficha-notas-lista" class="notas-lista">' + pintarLista(notas) + '</div>';

    if (!abierto) return;

    var campo = $('ficha-nota-texto');
    var aviso = $('ficha-nota-aviso');

    $('ficha-nota-guardar').onclick = function () { guardarBorrador(a, campo, aviso, alGuardar); };

    /* Perder el foco guarda, si hay algo escrito: es el único disparador
       además del botón, desde la fila 58. */
    campo.onblur = function () {
      if ((campo.value || '').trim()) guardarBorrador(a, campo, aviso, alGuardar);
    };
    /* Control + Intro sigue guardando al momento, como antes. */
    campo.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        guardarBorrador(a, campo, aviso, alGuardar);
      }
    };
  }

  /* La usa js/ficha-asunto.js (`pintarNotas`), envuelta ella misma en
     `U.conservandoLoEscrito` para que lo que se esté escribiendo, el
     foco y el cursor sobrevivan a un repintado (fila 34). `alGuardar`
     es opcional: `App.abrirFicha` le pasa su `apuntarHuella` para que
     guardar la nota no deje la huella de la ficha atrasada. */
  function pintarEnFicha(caja, a, abierto, alGuardar) {
    if (!caja) return;
    return U.conservandoLoEscrito(caja, function () { return pintarCajaDeNota(caja, a, abierto, alGuardar); });
  }

  /* ---------- salir de la ficha con una nota sin guardar ----------

     18-sep-2026, fila 58 (docs/AJUSTES-DE-USO-2026-09-18.md, 3):
     `js/ficha-asunto.js` la llama antes de volver a la lista (botón
     "← Volver" y Escape, que pulsa ese mismo botón). Sin nada
     pendiente, resuelve enseguida y no interrumpe nada. */
  async function confirmarSalirDeFicha() {
    var campo = $('ficha-nota-texto');
    if (!campo || !cajaAsuntoActual) return true;
    var texto = (campo.value || '').trim();
    if (!texto || texto === borradorUltimoGuardado) return true;

    var cancelar = $('cuadro-cancelar');
    if (cancelar) cancelar.textContent = 'Salir sin guardar';
    var guardarYSalir = await U.preguntar('Tienes una nota sin guardar',
      '<p class="explica">Hay texto sin guardar en la nota de este asunto.</p>', 'Guardar y salir');
    if (cancelar) cancelar.textContent = 'Cancelar';

    if (guardarYSalir) await guardarBorrador(cajaAsuntoActual, campo, $('ficha-nota-aviso'), null);
    return true;
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
    olvidarBorrador: olvidarBorrador,
    confirmarSalirDeFicha: confirmarSalirDeFicha,
    textoParaBuscar: textoParaBuscar,
    fragmentoDeBusqueda: fragmentoDeBusqueda,
    fragmentoSiSoloEnNota: fragmentoSiSoloEnNota
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
