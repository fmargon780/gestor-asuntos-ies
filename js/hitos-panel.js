/* ============================================================
   hitos-panel.js — el bloque "Hitos" de la ficha del asunto
   (17-sep-2026, fila 26, docs/HITOS-SON-LA-GUIA.md).

   Hasta hoy había dos zonas: la guía como texto con casillas, pintada
   por js/ficha-asunto.js, y los hitos como un añadido aparte debajo.
   Francisco nunca quiso dos cosas: los pasos de la guía SON los
   hitos. Este fichero pinta ahora el bloque entero, sustituyendo del
   todo lo que antes era "la guía": la guía deja de leerse como texto
   en cualquier asunto ya abierto.

   pintarGuia ya no existe en js/ficha-asunto.js: no hay ninguna
   función de App que envolver para saber cuándo repintar. Por eso se
   sigue usando un MutationObserver sobre #ficha-guia, tal y como
   recomienda docs/CONTEXTO.md para un panel que se repinta entero. Se
   engancha a App.abrirFicha (esa sí es pública) para saber de qué
   asunto se trata y si está abierto o archivado.

   Lo nuevo de hoy es que, al abrir la ficha de un asunto abierto cuyo
   tipo tiene guía y que todavía no tiene hitos, los hitos se crean
   SOLOS, importando lo que el asunto ya tuviera marcado
   (pasosHechos/pasosElegidos). Sin botón, sin preguntar nada. Un
   candado por clave de asunto evita crearlos dos veces: el propio
   observador repinta cada 30 ms y repintar() es async, así que sin
   candado dos pasadas podrían colarse antes de que hitos.json
   terminara de escribirse.

   Cómo se pinta cada hito por dentro —la fila, el cuerpo desplegado,
   el cambio de rama— sigue viviendo en js/hitos-panel-lista.js, sin
   tocar (misma regla que separó js/hitos.js de js/hitos-archivo.js).
   Los dos ficheros se hablan por window.HitosPanel: este expone
   programarRepintado, pedirYAnadirHito y
   observadorPausar/observadorReanudar (para el añadido a mano de
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
  var repintando = false;
  var pendiente = null;

  /* Candado de creación: mientras se están creando los hitos de una
     clave, ningún otro repintado de esa misma clave vuelve a
     intentarlo (trampa de la doble creación, docs/HITOS-SON-LA-GUIA.md). */
  var creandoParaClave = {};

  /* Si la guía todavía no se ha leído (guias-enganche.js la lee una
     sola vez, al arrancar), se reintenta una vez, 500 ms después, en
     vez de dejarlo así para siempre: nunca se marca el asunto como
     "ya probado". */
  var reintentadoParaClave = {};

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

  async function repintar() {
    var a = actual;
    if (!a) return;
    var abierto = modoActual === 'abierto';
    var clave = a.nombre;
    var tipo = tipoDe(a);

    /* En modo consulta (el compañero tiene el mando de este asunto,
       fila 24) no se escribe nada: ni crear hitos solos, aunque el
       tipo tenga guía. Lectura sin await, contra la copia en memoria
       de js/presencia.js. */
    var enConsulta = !!(window.Presencia && Presencia.ocupantePor(clave));

    var datos = null, entrada = null, errorLectura = null;
    try { datos = await Hitos.leer(); entrada = datos.porAsunto[clave] || null; }
    catch (e) { errorLectura = e; }
    if (actual !== a) return;   /* se ha cambiado de ficha mientras leíamos */

    var hitos = entrada ? entrada.hitos : [];
    var pasosGuia = (abierto && tipo && window.GuiasDelCentro) ? window.GuiasDelCentro.pasosDe(tipo) : [];

    if (!errorLectura && !hitos.length && abierto && !enConsulta && !creandoParaClave[clave]) {
      if (pasosGuia.length) {
        creandoParaClave[clave] = true;
        try {
          var hechos = (a.ficha && a.ficha.pasosHechos) || [];
          var elegidos = (a.ficha && a.ficha.pasosElegidos) || {};
          await Hitos.crearDesdeGuiaImportando(clave, tipo, hechos, elegidos);
          datos = await Hitos.leer();
          entrada = datos.porAsunto[clave] || null;
          hitos = entrada ? entrada.hitos : [];
        } catch (e) {
          errorLectura = e;
        } finally {
          delete creandoParaClave[clave];
        }
        if (actual !== a) return;
      } else if (!reintentadoParaClave[clave]) {
        reintentadoParaClave[clave] = true;
        setTimeout(function () {
          delete reintentadoParaClave[clave];
          if (actual && actual.nombre === clave) programarRepintado();
        }, 500);
      }
    }

    var caja = $('ficha-guia');
    if (!caja) return;

    /* Lo que se pinta aquí abajo muta el propio #ficha-guia, que es lo
       que vigila el MutationObserver: sin desconectarlo durante el
       repintado, cada repintado se detectaría a sí mismo como un
       cambio y se repintaría sin parar. Se desconecta justo antes de
       tocar el DOM y se vuelve a enganchar al terminar. */
    repintando = true;
    if (observador) observador.disconnect();
    try {
      caja.innerHTML = '';

      if (errorLectura) {
        caja.className = 'explica';
        var av = document.createElement('p');
        av.textContent = 'No he podido leer los hitos: ' + errorLectura.message;
        caja.appendChild(av);
        return;
      }

      if (hitos.length) {
        caja.className = 'hitos-panel';
        caja.appendChild(HitosPanelLista.bloqueDeHitos(a, hitos, datos.ajustes, abierto));
        aplicarDesplegarPendiente(caja, clave);
      } else if (abierto) {
        caja.className = 'hitos-panel';
        caja.appendChild(bloqueSinHitos(a));
      } else {
        caja.className = 'explica';
        caja.textContent = 'Este asunto no tiene hitos.';
      }

      /* El enlace de escribir o cambiar la guía, siempre al final:
         solo en un asunto abierto y con el tipo reconocido. */
      if (abierto && tipo && window.GuiasDelCentro) {
        caja.appendChild(notaEscribirGuia(a, tipo, pasosGuia.length > 0));
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

  /* ---------- el asunto sin hitos todavía ----------

     Si el tipo no tiene guía (o todavía no se ha podido leer),
     "+ Añadir el primer hito" para ir apuntando a mano. Si el tipo sí
     tiene guía, este bloque no se ve nunca: repintar() ya los ha
     creado más arriba antes de llegar aquí. */

  function bloqueSinHitos(a) {
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

  /* ---------- el enlace de escribir o cambiar la guía ----------

     Es tramitando un asunto cuando uno se da cuenta de qué pasos
     faltan, y desde el 10-sep-2026 se puede escribir la guía sin salir
     a Ajustes. Lo guarda js/guias-enganche.js, que es quien lleva
     guias.json: aquí solo se llama a window.GuiasDelCentro.escribir. */
  function notaEscribirGuia(a, tipo, tienePasos) {
    var fila = document.createElement('p');
    fila.className = 'nota';

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = tienePasos ? 'Cambiar la guía' : 'Escribir la guía de ' + tipo;
    b.onclick = async function () {
      b.disabled = true;
      var hecho = await window.GuiasDelCentro.escribir(tipo);
      b.disabled = false;
      if (hecho) programarRepintado();
    };
    fila.appendChild(b);

    var aviso = document.createElement('span');
    aviso.className = 'suave';
    aviso.style.marginLeft = '8px';
    aviso.textContent = 'Vale para todos los asuntos ' + tipo + ', no solo para este.';
    fila.appendChild(aviso);

    return fila;
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
