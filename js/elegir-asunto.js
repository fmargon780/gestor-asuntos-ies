/* ============================================================
   elegir-asunto.js — el cuadro para escoger un asunto a mano.

   Lo usan dos sitios distintos, y por eso vive aparte:

     - La bandeja de correos (js/bandeja-enlace.js), con su botón
       "Elegir asunto".
     - "Por clasificar" (js/documentos-sueltos.js), con su botón
       "Meter en un asunto".

   El cuadro es siempre el mismo y tiene dos bloques:

     - "Podrían encajar": como mucho cinco asuntos, los que más puntos
       sacan. Si ninguno llega al mínimo, este bloque no se pinta. La
       puntuación NO se calcula aquí: cada sitio sabe medir su propio
       parecido (un correo tiene remitente y texto; un documento suelto
       solo tiene el nombre del fichero) y le pasa la lista ya hecha.
     - "Todos los asuntos": la lista entera con buscador, los abiertos
       primero y los archivados después, con su etiqueta "Archivado".

   Lo que sí es común está aquí abajo: la lista completa, el buscador,
   el orden, las filas, el cuadro de "está archivado" y las piezas de
   puntuación que las dos comparten (los trozos del nombre del tercero,
   si el asunto se movió hace poco, y los puntos de base).

   Solo hay un cuadro de diálogo en toda la aplicación (U.preguntar,
   sobre #capa), así que aquí nunca se abre uno mientras otro espera:
   el de elegir se cierra antes de abrir el de reabrir.
   ============================================================ */
window.ElegirAsunto = (function () {

  var MINIMO = 40;
  var CUANTOS = 5;
  var DIAS_RECIENTE = 30;
  var CUANTOS_EN_LA_LISTA = 200;

  function $(id) { return document.getElementById(id); }

  function estaArchivado(ficha) {
    return String((ficha && ficha.estado) || '') === 'cerrado';
  }

  /* ==========================================================
     LAS PIEZAS DE PUNTUACIÓN QUE COMPARTEN LOS DOS
     ========================================================== */

  /* "Pacheco Pérez, Mercedes 019G" -> apellidos y nombre por separado,
     sin el código pegado al final (el Nº de identificación escolar, o
     las cuatro cifras del documento del personal). */
  function trozosDelTercero(tercero) {
    var t = String(tercero || '').trim();
    if (!t) return null;
    var coma = t.indexOf(',');
    if (coma === -1) return { apellidos: U.normalizar(t), nombre: '' };
    var apellidos = U.normalizar(t.slice(0, coma));
    var resto = t.slice(coma + 1).trim().split(/\s+/).filter(Boolean);
    var ultima = resto[resto.length - 1] || '';
    if (resto.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) resto.pop();
    return { apellidos: apellidos, nombre: U.normalizar(resto.join(' ')) };
  }

  /* ¿El nombre del tercero del asunto está escrito dentro de este
     texto? Apellidos y nombre, en cualquier orden. */
  function terceroDentroDe(ficha, texto) {
    var trozos = trozosDelTercero(ficha && ficha.tercero);
    if (!trozos || !trozos.apellidos) return false;
    if (texto.indexOf(trozos.apellidos) === -1) return false;
    return !trozos.nombre || texto.indexOf(trozos.nombre) !== -1;
  }

  /* Cuándo se creó o se movió por última vez. La fecha de creación va
     delante del nombre de la carpeta, en AAMMDD; la del último
     movimiento, en la ficha, cuando hay notas. */
  function cuandoSeMovio(nombre, ficha) {
    var cuando = 0;
    var m = String(nombre || '').match(/^(\d{2})(\d{2})(\d{2})(\D|$)/);
    if (m) {
      var f = new Date(2000 + parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      if (!isNaN(f.getTime())) cuando = f.getTime();
    }
    var nota = new Date((ficha && ficha.notaEl) || '');
    if (!isNaN(nota.getTime()) && nota.getTime() > cuando) cuando = nota.getTime();
    return cuando;
  }

  function esReciente(nombre, ficha) {
    var cuando = cuandoSeMovio(nombre, ficha);
    if (!cuando) return false;
    return (Date.now() - cuando) <= DIAS_RECIENTE * 86400000;
  }

  /* +15 si el asunto está abierto, +10 si se movió hace poco. Es lo
     mismo para un correo que para un documento suelto. */
  function puntosDeBase(nombre, ficha) {
    var puntos = 0;
    if (!estaArchivado(ficha)) puntos += 15;
    if (esReciente(nombre, ficha)) puntos += 10;
    return puntos;
  }

  /* +10 por cada palabra que esté dentro del nombre del asunto. */
  function puntosPorPalabras(palabras, nombre) {
    var enElNombre = U.normalizar(nombre);
    var puntos = 0;
    (palabras || []).forEach(function (p) {
      if (p && enElNombre.indexOf(p) !== -1) puntos += 10;
    });
    return puntos;
  }

  /* Deja solo los que pasan del mínimo, de mayor a menor, y como mucho
     cinco. Es el remate de las dos puntuaciones. */
  function mejores(lista) {
    return lista
      .filter(function (x) { return x.puntos > MINIMO; })
      .sort(function (a, b) {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return a.nombre < b.nombre ? -1 : 1;
      })
      .slice(0, CUANTOS);
  }

  /* ==========================================================
     LA LISTA COMPLETA
     ========================================================== */

  function todosLosAsuntos() {
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var lista = Object.keys(registro).map(function (nombre) {
      return { nombre: nombre, ficha: registro[nombre] || {} };
    });
    lista.sort(function (a, b) {
      var ca = estaArchivado(a.ficha) ? 1 : 0;
      var cb = estaArchivado(b.ficha) ? 1 : 0;
      if (ca !== cb) return ca - cb;           /* abiertos primero */
      return a.nombre < b.nombre ? -1 : 1;
    });
    return lista;
  }

  /* Fila 175, punto 6b: la puntuación sigue ordenando la lista (en
     `ordenar`, más abajo); solo deja de pintarse aquí. */
  function filaDeAsunto(x) {
    var pie = [
      (x.ficha.tercero || ''),
      (estaArchivado(x.ficha) ? 'Archivado' : 'Abierto')
    ].filter(Boolean).join('  ·  ');
    return '<button type="button" class="resultado enlace-asunto" data-nombre="' +
             U.escapar(x.nombre) + '">' +
             (estaArchivado(x.ficha)
               ? '<span class="marca-tipo enlace-archivado">Archivado</span>' : '') +
             U.escapar(x.nombre) +
             '<span class="resultado-pie">' + U.escapar(pie) + '</span>' +
           '</button>';
  }

  /* ==========================================================
     EL CUADRO

     Se monta sobre #capa, igual que hace js/relacionados.js: se
     esconde el botón de Aceptar, porque aquí se elige pulsando en la
     fila, y Cancelar es el de siempre.

     opciones = { titulo, cabecera (HTML), sugeridos: [{nombre, ficha,
     puntos}] }. Devuelve {nombre, ficha} o null si se cancela.
     ========================================================== */

  function elegir(opciones) {
    var o = opciones || {};
    var sugeridos = o.sugeridos || [];

    return new Promise(function (resolver) {
      var resuelto = false;
      function unaVez(v) { if (!resuelto) { resuelto = true; resolver(v); } }

      var todos = todosLosAsuntos();
      var capa = $('capa');
      var cuadro = document.querySelector('#capa .cuadro');
      if (cuadro) cuadro.classList.add('cuadro-medio');

      $('cuadro-titulo').textContent = o.titulo || 'Elegir el asunto';
      $('cuadro-cuerpo').innerHTML =
        (o.cabecera || '') +
        (sugeridos.length
          ? '<div class="enlace-bloque"><div class="etiqueta">Podrían encajar</div>' +
            '<div class="lista enlace-lista">' +
            sugeridos.map(function (x) { return filaDeAsunto(x); }).join('') +
            '</div></div>'
          : '') +
        '<div class="enlace-bloque"><div class="etiqueta">Todos los asuntos</div>' +
        '<input id="enlace-buscar" class="campo" placeholder="Buscar por nombre o tercero">' +
        '<div class="lista enlace-lista" id="enlace-todos"></div></div>';

      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
        if (cuadro) cuadro.classList.remove('cuadro-medio');
      }

      $('cuadro-cancelar').onclick = function () { cerrar(); unaVez(null); };

      function engancharFilas(caja) {
        Array.prototype.forEach.call(caja.querySelectorAll('.enlace-asunto'), function (b) {
          b.onclick = function () {
            var nombre = b.dataset.nombre;
            cerrar();
            unaVez({ nombre: nombre, ficha: (App.E.registro.asuntos || {})[nombre] || {} });
          };
        });
      }

      function pintarTodos() {
        var busca = U.normalizar(($('enlace-buscar') || {}).value || '');
        var caja = $('enlace-todos');
        var vistos = todos.filter(function (x) {
          if (!busca) return true;
          return U.normalizar(x.nombre + ' ' + (x.ficha.tercero || '')).indexOf(busca) !== -1;
        });
        caja.innerHTML = vistos.length
          ? vistos.slice(0, CUANTOS_EN_LA_LISTA).map(function (x) {
              return filaDeAsunto(x);
            }).join('')
          : '<div class="vacio">Ningún asunto con eso.</div>';
        engancharFilas(caja);
      }

      engancharFilas($('cuadro-cuerpo'));
      pintarTodos();
      var buscador = $('enlace-buscar');
      if (buscador) {
        buscador.oninput = pintarTodos;
        try { buscador.focus(); } catch (e) {}
      }
    });
  }

  /* El asunto elegido está archivado: se pregunta qué hacer con él.
     Este cuadro se abre cuando el otro ya está cerrado, nunca encima.

     opciones = { explica (HTML), reabrir: texto del botón principal,
     sinReabrir: texto del otro }. Devuelve 'reabrir', 'guardar' o
     null. */
  function preguntarSiReabrir(elAsunto, opciones) {
    var o = opciones || {};

    return new Promise(function (resolver) {
      var resuelto = false;
      function unaVez(v) { if (!resuelto) { resuelto = true; resolver(v); } }

      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Ese asunto está archivado';
      $('cuadro-cuerpo').innerHTML =
        '<p class="explica">' + U.escapar(elAsunto.nombre) + '</p>' +
        (o.explica || '') +
        '<div class="alta-tipo">' +
          '<button type="button" id="enlace-reabrir" class="boton boton-principal">' +
            U.escapar(o.reabrir || 'Reabrir y guardar aquí') + '</button>' +
          '<button type="button" id="enlace-sin-reabrir" class="boton">' +
            U.escapar(o.sinReabrir || 'Guardar sin reabrir') + '</button>' +
        '</div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrar() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }

      $('cuadro-cancelar').onclick = function () { cerrar(); unaVez(null); };
      $('enlace-reabrir').onclick = function () { cerrar(); unaVez('reabrir'); };
      $('enlace-sin-reabrir').onclick = function () { cerrar(); unaVez('guardar'); };
    });
  }

  /* La carpeta donde vive un asunto: en asuntos abiertos, o dentro del
     ARCHIVO, en su categoría y su tercero. */
  async function carpetaDelAsunto(nombre, ficha) {
    if (!estaArchivado(ficha)) return App.E.abiertos.getDirectoryHandle(nombre);
    if (!App.E.archivo) throw new Error('No hay carpeta de ARCHIVO señalada.');
    var dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
    return dentro.getDirectoryHandle(nombre);
  }

  return {
    MINIMO: MINIMO, CUANTOS: CUANTOS, DIAS_RECIENTE: DIAS_RECIENTE,
    estaArchivado: estaArchivado,
    trozosDelTercero: trozosDelTercero,
    terceroDentroDe: terceroDentroDe,
    cuandoSeMovio: cuandoSeMovio,
    esReciente: esReciente,
    puntosDeBase: puntosDeBase,
    puntosPorPalabras: puntosPorPalabras,
    mejores: mejores,
    todos: todosLosAsuntos,
    elegir: elegir,
    preguntarSiReabrir: preguntarSiReabrir,
    carpetaDelAsunto: carpetaDelAsunto
  };
})();
