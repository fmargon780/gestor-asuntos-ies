/* ============================================================
   hitos-panel.js — pinta los hitos en la ficha del asunto (17-sep-2026).

   Los pasos de la guía SON los hitos (docs/HITOS-SON-LA-GUIA.md): no
   hay "la guía" por un lado y "los hitos" por otro. js/ficha-asunto.js
   deja dentro de #ficha-guia, en el bloque "Hitos", solo un <p
   class="nota" id="ficha-guia-nota"> con el botón de escribir o
   cambiar la guía del tipo; todo lo demás de ese hueco —la lista de
   hitos, o el aviso de que no hay ninguno todavía— lo pinta este
   fichero, conservando esa nota donde esté.

   Si el asunto está abierto y todavía no tiene hitos, y su tipo tiene
   pasos de guía, se crean solos, importando lo que ya estuviera
   marcado en pasosHechos/pasosElegidos (Hitos.crearDesdeGuiaImportando).
   Sin botón, sin preguntar.

   pintarGuia es una función privada de ficha-asunto.js: no hay
   ninguna función de App que envolver para saber cuándo termina de
   pintar. Por eso se usa un MutationObserver sobre #ficha-guia, tal y
   como recomienda docs/CONTEXTO.md para un panel que se repinta
   entero. Se engancha a App.abrirFicha (esa sí es pública) para saber
   de qué asunto se trata y si está abierto o archivado.

   Este fichero es la orquestación: el observador y el repintado. Cómo
   se pinta cada hito por dentro —la fila, el cuerpo desplegado, el
   cambio de rama— vive en js/hitos-panel-lista.js, para no pasar de
   las 400 líneas aquí (misma regla que separó js/hitos.js de
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

  /* Cerrojo por clave de asunto: repintar() es async y el observador
     repinta cada 30 ms, así que dos pasadas podrían colarse antes de
     que hitos.json quedara escrito y ambas verían "sin hitos todavía"
     (sección "Trampas" de docs/HITOS-SON-LA-GUIA.md). Mientras la
     clave esté aquí dentro, no se vuelve a intentar crear. */
  var creandoDesdeGuia = {};

  /* La pantalla "Qué me toca" (fila 16) pide desplegar un hito
     concreto justo al abrir esta ficha: guarda aquí el par (clave del
     asunto, id del hito) y se aplica en el siguiente repintado, para
     no depender de en qué orden se cargan los dos ficheros. */
  var pendienteDesplegar = null;

  function $(id) { return document.getElementById(id); }

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* El compañero tiene el mando (js/presencia.js): en "solo mirar" no
     se escribe nada, así que tampoco se crean hitos solos. */
  function enConsulta() {
    var raiz = $('ficha-asunto-cuerpo');
    return !!(raiz && raiz.classList.contains('ficha-consulta'));
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

  /* modoActual/abierto reflejan cómo se abrió la ficha, no si el
     asunto sigue abierto AHORA MISMO: archivarlo no vuelve a llamar a
     App.abrirFicha, así que un repintado que se cuele mientras se
     archiva (por ejemplo, por la vigilancia de presencia) vería
     "abierto" aunque el asunto ya se esté cerrando. Se comprueba
     también contra App.E.registro, que sí se actualiza al momento. */
  function sigueAbiertoDeVerdad(clave) {
    var asuntos = App.E && App.E.registro && App.E.registro.asuntos;
    var ficha = asuntos && asuntos[clave];
    /* Sin ficha en el registro no es "archivado": es un asunto que
       todavía no ha pasado nunca por App.anotar (por ejemplo, recién
       encontrado al escanear la carpeta). Solo bloquea un 'cerrado'
       explícito, igual que hace el resto de la aplicación al leer
       a.ficha (siempre con "|| {}"). */
    return !ficha || ficha.estado !== 'cerrado';
  }

  /* Si el asunto está abierto, no tiene hitos todavía y su tipo tiene
     pasos de guía, los crea importando lo ya marcado. Si la guía
     todavía no se ha leído (GuiasDelCentro.pasosDe devuelve []), no
     crea nada y no lo marca de ninguna forma: el próximo repintado
     lo volverá a intentar solo. */
  async function crearSiToca(a, clave, tipo, abierto) {
    if (!abierto || enConsulta() || creandoDesdeGuia[clave] || !sigueAbiertoDeVerdad(clave)) return null;
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipo)) || [];
    if (!pasos.length) return null;
    creandoDesdeGuia[clave] = true;
    try {
      var hechos = (a.ficha && a.ficha.pasosHechos) || [];
      var elegidos = (a.ficha && a.ficha.pasosElegidos) || {};
      return await Hitos.crearDesdeGuiaImportando(clave, tipo, hechos, elegidos);
    } catch (e) {
      return null;   /* no crítico: se reintenta en el próximo repintado */
    } finally {
      delete creandoDesdeGuia[clave];
    }
  }

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

    var hitos = entrada ? entrada.hitos : [];
    if (!errorLectura && !hitos.length) {
      var creados = await crearSiToca(a, clave, tipo, abierto);
      if (actual !== a) return;
      if (creados && creados.length) hitos = creados;
    }

    var caja = $('ficha-guia');
    if (!caja) return;
    cajaObservada = caja;

    /* Lo que se pinta aquí abajo muta el propio #ficha-guia, que es lo
       que vigila el MutationObserver: sin desconectarlo durante el
       repintado, cada repintado se detectaría a sí mismo como un
       cambio y se repintaría sin parar. Se desconecta justo antes de
       tocar el DOM y se vuelve a enganchar al terminar. */
    repintando = true;
    if (observador) observador.disconnect();
    try {
      var nota = $('ficha-guia-nota');
      if (nota && nota.parentNode === caja) nota.remove();
      caja.innerHTML = '';
      if (!errorLectura && hitos.length) {
        caja.className = 'hitos-panel';
        caja.appendChild(HitosPanelLista.bloqueDeHitos(a, hitos, datos.ajustes, abierto));
        aplicarDesplegarPendiente(caja, clave);
      } else {
        pintarVacio(caja, a, abierto, errorLectura);
      }
      if (nota) caja.appendChild(nota);
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

  /* ---------- sin hitos todavía ----------

     Pasa por aquí un asunto archivado, uno con error de lectura, o uno
     cuyo tipo no tiene guía (o cuya guía no ha terminado de cargar: el
     próximo repintado lo reintenta, sin avisar de nada mientras
     tanto). */
  function pintarVacio(caja, a, abierto, errorLectura) {
    caja.className = 'explica';
    if (errorLectura) {
      caja.textContent = 'No he podido leer los hitos: ' + errorLectura.message;
      return;
    }
    if (!abierto) {
      caja.textContent = 'Este asunto no tiene hitos.';
      return;
    }
    var p = document.createElement('p');
    p.className = 'explica';
    p.textContent = 'Este tipo no tiene guía. Puedes ir apuntando los hitos a mano.';
    caja.appendChild(p);
    caja.appendChild(botonAnadirAMano(a));
  }

  function botonAnadirAMano(a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-ancho';
    b.textContent = '+ Añadir el primer hito';
    b.onclick = function () { pedirYAnadirHito(a); };
    return b;
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
