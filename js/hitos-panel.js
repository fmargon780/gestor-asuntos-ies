/* ============================================================
   hitos-panel.js — pinta los hitos en la ficha del asunto (16-sep-2026).

   js/ficha-asunto.js pinta la guía del tipo dentro de #ficha-guia,
   dentro del bloque "Guía del procedimiento". Aquí se ENVUELVE eso,
   sin tocar ese fichero: cuando el asunto tiene hitos, la lista de
   hitos sustituye a la lista de pasos; el botón de "Escribir/Cambiar
   la guía" que pone pintarGuia (siempre el último hijo, un <p
   class="nota">) se conserva donde está.

   pintarGuia es una función privada de ficha-asunto.js: no hay
   ninguna función de App que envolver para saber cuándo termina de
   pintar. Por eso se usa un MutationObserver sobre #ficha-guia, tal y
   como recomienda docs/CONTEXTO.md para un panel que se repinta
   entero. Se engancha a App.abrirFicha (esa sí es pública) para saber
   de qué asunto se trata y si está abierto o archivado.

   Este fichero es la orquestación: el observador, el repintado y el
   bloque de entrada para un asunto sin hitos todavía. Cómo se pinta
   cada hito por dentro —la fila, el cuerpo desplegado, el cambio de
   rama— vive en js/hitos-panel-lista.js, para no pasar de las 400
   líneas aquí (misma regla que separó js/hitos.js de
   js/hitos-archivo.js). Los dos ficheros se hablan por
   window.HitosPanel: este expone programarRepintado, pedirYAnadirHito
   y observadorPausar/observadorReanudar (para el añadido a mano de
   "Cambiar de rama", que no pasa por un repintado entero); el otro
   expone HitosPanelLista.bloqueDeHitos.

   Se carga después de js/ficha-asunto.js, y antes de
   js/hitos-panel-lista.js.
   ============================================================ */
(function () {
  if (typeof App === 'undefined' || typeof App.abrirFicha !== 'function') return;

  var actual = null;
  var modoActual = 'abierto';
  var observador = null;
  var cajaObservada = null;
  var repintando = false;
  var pendiente = null;

  /* La pantalla "Qué me toca" (fila 16) pide desplegar un hito
     concreto justo al abrir esta ficha: guarda aquí el par (clave del
     asunto, id del hito) y se aplica en el siguiente repintado, para
     no depender de en qué orden se cargan los dos ficheros. */
  var pendienteDesplegar = null;

  function $(id) { return document.getElementById(id); }

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  (function envolverAbrirFicha() {
    var comoEra = App.abrirFicha;
    App.abrirFicha = function (a, modo) {
      actual = a;
      modoActual = modo || 'abierto';
      comoEra(a, modo);
      asegurarObservador();
      programarRepintado();
    };
  })();

  function asegurarObservador() {
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    if (observador) observador.disconnect();
    observador = new MutationObserver(function () {
      if (repintando) return;
      programarRepintado();
    });
    observador.observe(raiz, { childList: true, subtree: true });
  }

  function programarRepintado() {
    if (pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(function () { pendiente = null; repintar(); }, 30);
  }

  /* Mientras el asunto no tenga hitos, #ficha-guia NO SE TOCA: se deja
     tal cual lo pinta js/ficha-asunto.js (con las casillas de
     siempre, pasosHechos y pasosElegidos, exactamente como hasta
     hoy). El botón de entrada ("Crear los hitos de la guía", o "+
     Añadir el primer hito" si el tipo no tiene guía) sale en un
     bloque propio y aparte, justo debajo. Solo cuando el asunto YA
     tiene hitos se sustituye el contenido de #ficha-guia por la lista
     de hitos, conservando el botón de escribir/cambiar la guía. */
  async function repintar() {
    var a = actual;
    if (!a) return;
    var abierto = modoActual === 'abierto';
    var clave = a.nombre;
    var tipo = tipoDe(a);

    var datos = null, entrada = null, errorLectura = null;
    try { datos = await Hitos.leer(); entrada = datos.porAsunto[clave] || null; }
    catch (e) { errorLectura = e; }

    if (actual !== a) return;   /* se ha cambiado de ficha mientras leíamos */
    var caja = $('ficha-guia');
    if (!caja) return;
    cajaObservada = caja;

    var hitos = entrada ? entrada.hitos : [];

    /* Lo que se pinta aquí abajo muta el propio #ficha-guia, que es lo
       que vigila el MutationObserver: sin desconectarlo durante el
       repintado, cada repintado se detectaría a sí mismo como un
       cambio y se repintaría sin parar. Se desconecta justo antes de
       tocar el DOM y se vuelve a enganchar al terminar. */
    repintando = true;
    if (observador) observador.disconnect();
    try {
      if (!errorLectura && hitos.length) {
        quitarBloqueDeEntrada();
        var botonGuia = (caja.lastElementChild && caja.lastElementChild.classList.contains('nota'))
          ? caja.lastElementChild : null;
        if (botonGuia) botonGuia.remove();
        caja.innerHTML = '';
        caja.className = 'hitos-panel';
        caja.appendChild(HitosPanelLista.bloqueDeHitos(a, hitos, datos.ajustes, abierto));
        if (botonGuia) caja.appendChild(botonGuia);
        aplicarDesplegarPendiente(caja, clave);
      } else {
        pintarBloqueDeEntrada(a, tipo, abierto, errorLectura);
      }
    } finally {
      repintando = false;
      asegurarObservador();
    }
  }

  /* Busca la fila de ese hito entre las que se acaban de pintar,
     quita 'oculto' a su cuerpo y hace scroll hasta ella. Si la ficha
     que se ha abierto no es la que pidió el despliegue (clave
     distinta), no hace nada: se queda pendiente por si toca luego. */
  function aplicarDesplegarPendiente(caja, clave) {
    if (!pendienteDesplegar || pendienteDesplegar.clave !== clave) return;
    var idHito = pendienteDesplegar.idHito;
    pendienteDesplegar = null;
    var filas = caja.querySelectorAll('.hito');
    for (var i = 0; i < filas.length; i++) {
      if (filas[i].dataset.id !== idHito) continue;
      var cuerpo = filas[i].querySelector('.hito-cuerpo');
      if (cuerpo) cuerpo.classList.remove('oculto');
      filas[i].scrollIntoView({ block: 'center' });
      break;
    }
  }

  /* ---------- el bloque de entrada, aparte de #ficha-guia ----------

     Se cuelga justo debajo del bloque "Guía del procedimiento", como
     hermano suyo dentro de .ficha-izquierda. Al no vivir dentro de
     #ficha-guia, no interfiere para nada con lo que pinta
     js/ficha-asunto.js ahí (importante: pruebas/guias.mjs abre una
     ficha sin hitos y espera ver la guía de siempre, con sus
     casillas). */

  function bloqueDeEntrada() {
    var ya = $('hitos-entrada');
    if (ya) return ya;
    var guiaBloque = caja0();
    if (!guiaBloque || !guiaBloque.parentNode) return null;
    var div = document.createElement('div');
    div.id = 'hitos-entrada';
    div.className = 'ficha-bloque';
    guiaBloque.parentNode.insertBefore(div, guiaBloque.nextSibling);
    return div;
  }

  function caja0() {
    var c = $('ficha-guia');
    return c ? c.closest('.ficha-bloque') : null;
  }

  function quitarBloqueDeEntrada() {
    var d = $('hitos-entrada');
    if (d) d.remove();
  }

  function pintarBloqueDeEntrada(a, tipo, abierto, errorLectura) {
    var d = bloqueDeEntrada();
    if (!d) return;
    d.innerHTML = '<h3 class="ficha-titulo">Hitos</h3>';
    if (errorLectura) {
      var av = document.createElement('p');
      av.className = 'explica';
      av.textContent = 'No he podido leer los hitos: ' + errorLectura.message;
      d.appendChild(av);
      return;
    }
    if (!abierto) {
      d.remove();   /* archivado y sin hitos: no hay nada que ofrecer aquí */
      return;
    }
    var pasosGuia = (window.GuiasDelCentro && tipo) ? window.GuiasDelCentro.pasosDe(tipo) : [];
    d.appendChild(pasosGuia.length ? botonCrearDesdeGuia(a, tipo) : botonAnadirAMano(a));
  }

  /* ---------- el botón para asuntos viejos (sección 3.2) ---------- */

  function botonCrearDesdeGuia(a, tipo) {
    var caja = document.createElement('div');
    var p = document.createElement('p');
    p.className = 'explica';
    p.textContent = 'Este asunto todavía se gobierna por la guía de siempre, más abajo.';
    caja.appendChild(p);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-principal';
    b.textContent = 'Crear los hitos de la guía';
    b.onclick = async function () {
      b.disabled = true;
      try {
        var hechos = (a.ficha && a.ficha.pasosHechos) || [];
        var elegidos = (a.ficha && a.ficha.pasosElegidos) || {};
        await Hitos.crearDesdeGuiaImportando(a.nombre, tipo, hechos, elegidos);
        U.aviso('Hitos creados desde la guía.', 'bueno');
        programarRepintado();
      } catch (e) {
        U.aviso('No he podido crear los hitos: ' + e.message, 'malo');
        b.disabled = false;
      }
    };
    caja.appendChild(b);
    return caja;
  }

  function botonAnadirAMano(a) {
    var caja = document.createElement('div');
    var p = document.createElement('p');
    p.className = 'explica';
    p.textContent = 'Este tipo no tiene guía. Puedes ir apuntando los hitos a mano.';
    caja.appendChild(p);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = '+ Añadir el primer hito';
    b.onclick = function () { pedirYAnadirHito(a); };
    caja.appendChild(b);
    return caja;
  }

  async function pedirYAnadirHito(a) {
    var ok = await U.preguntar('Añadir un hito',
      '<label class="etiqueta">Título</label>' +
      '<input id="hito-nuevo-titulo" class="campo" placeholder="Por ejemplo: Firma del director">',
      'Añadir');
    if (!ok) return;
    var titulo = ($('hito-nuevo-titulo') && $('hito-nuevo-titulo').value.trim()) || '';
    if (!titulo) return;
    try {
      await Hitos.anadirHito(a.nombre, titulo);
      programarRepintado();
    } catch (e) {
      U.aviso('No he podido añadir el hito: ' + e.message, 'malo');
    }
  }

  /* Puente hacia js/hitos-panel-lista.js: cómo se pinta cada hito por
     dentro no necesita saber nada del observador ni de cuándo se abrió
     la ficha, solo poder pedir un repintado, ofrecer "+ Añadir un
     hito" y, para "Cambiar de rama" (que añade botones a mano, fuera
     de un repintado entero), pausar el observador un instante. */
  window.HitosPanel = {
    programarRepintado: function () { programarRepintado(); },
    pedirYAnadirHito: function (a) { pedirYAnadirHito(a); },
    observadorPausar: function () { if (observador) observador.disconnect(); },
    observadorReanudar: function () { asegurarObservador(); },
    /* Para "Qué me toca" (fila 16): llamar justo antes de App.abrirFicha(a, 'abierto'). */
    desplegarAlAbrir: function (clave, idHito) {
      pendienteDesplegar = (clave && idHito) ? { clave: clave, idHito: idHito } : null;
    }
  };
})();
