/* ============================================================
   guias-enganche.js — pone las guías dentro de la aplicación.

   guias.js sabe pintar y escribir una guía, pero no sabe nada de la
   aplicación. Este fichero es el que la enchufa: guarda las guías en
   _GESTOR/guias.json, pone el botón de cada tipo en Ajustes, y la
   enseña como recordatorio al crear un asunto. Los hitos, ya con sus
   casillas, se ven y se marcan dentro de la ficha del asunto
   (js/ficha-asunto.js), no desde la tarjeta de la lista.

   Lo que se marca como hecho se guarda en la ficha del asunto, en
   asuntos.json, así que lo ve todo el que abra la aplicación.

   Desde el 10-sep-2026 la guía también se escribe **desde la ficha de
   un asunto**, sin ir a Ajustes: es ahí, tramitando, donde uno se da
   cuenta de qué hitos faltan. Ese botón lo pone js/ficha-asunto.js y
   llama aquí, a `window.GuiasDelCentro.escribir`, para que las guías se
   sigan guardando en un solo sitio.
   ============================================================ */
(function () {

  var FICHERO = 'guias.json';

  var guias = {};        /* { "MATRICULA": [pasos], ... } */
  var yaLeido = false;

  function $(id) { return document.getElementById(id); }

  function pasosDe(tipo) {
    return (guias && guias[tipo]) ? guias[tipo] : [];
  }

  var fechaVista = 0;          /* fecha de guias.json cuando se leyó por última vez (fila 273) */
  var ultimaLectura = 0;       /* cuándo, por si el disco no da fechas */
  var lecturaCompartida = null;

  async function cargar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    try {
      fechaVista = await Carpetas.fechaFichero(g, FICHERO);
      ultimaLectura = Date.now();
      var leido = await Carpetas.leerJson(g, FICHERO);
      guias = (leido && typeof leido === 'object') ? leido : {};
    } catch (e) {
      /* Fila 235: si la lectura falla, se queda la última guía buena en
         memoria (antes se vaciaba, y lo siguiente que se guardara desde
         un asunto partía de una guía en blanco). */
      if (!guias || typeof guias !== 'object') guias = {};
      U.aviso('No he podido leer las guías: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* Fila 273 (docs/GUIA-SIEMPRE-AL-DIA.md): pone la copia en memoria igual que
     el disco, para que una ventana abierta desde hace horas no cree ni
     complete hitos con una guía vieja. Barata (mira la fecha del fichero y solo
     lee si ha cambiado; sin fecha, como mucho una lectura cada 3 s), callada
     (si falla, se queda la copia que había) y sin pisar un guardado en marcha.
     Dos llamadas a la vez comparten la misma lectura. Devuelve si ha cambiado algo. */
  function ponerAlDia() {
    if (lecturaCompartida) return lecturaCompartida;
    var lectura = (async function () {
      try {
        var g = window.Gestor && window.Gestor.carpetaGestor();
        if (!g || (window.ColaGuardado && ColaGuardado.hayGuardado())) return false;
        var fecha = await Carpetas.fechaFichero(g, FICHERO);
        if (fecha ? fecha === fechaVista : Date.now() - ultimaLectura < 3000) return false;
        var leido = await Carpetas.leerJson(g, FICHERO);
        var nuevas = (leido && typeof leido === 'object') ? leido : {};
        var cambio = JSON.stringify(nuevas) !== JSON.stringify(guias);
        guias = nuevas; fechaVista = fecha; ultimaLectura = Date.now();
        return cambio;
      } catch (e) { return false; }
    })();
    lecturaCompartida = lectura;
    var soltar = function () { if (lecturaCompartida === lectura) lecturaCompartida = null; };
    lectura.then(soltar, soltar);
    return lectura;
  }

  /* Al entrar en «Nuevo asunto»: si la guía había cambiado, se repinta su resumen. */
  async function alEntrarEnNuevo() {
    if (await ponerAlDia()) pintarGuiaNuevo();
  }

  /* Fila 176, punto 4: releer justo antes de escribir y tocar solo el
     tipo que se está guardando, dentro de la cola (como campos.json).
     Antes, 'guardar' escribía el objeto 'guias' entero tal y como se
     había cargado al ABRIR el editor: si los dos ordenadores editaban
     guías de tipos distintos la misma tarde, el segundo en guardar
     borraba la del primero, sin conflicto de Dropbox de por medio (el
     fichero no llegaba a chocar: los dos lo escribían con datos
     completos, solo que uno de ellos, viejo). */
  function conFichero(cambiar) {
    var hacer = async function () {
      var g = window.Gestor.carpetaGestor();
      if (!g) return;
      var leido = await Carpetas.leerJson(g, FICHERO);
      var datos = (leido && typeof leido === 'object') ? leido : {};
      cambiar(datos);
      guias = datos;
      await Copias.guardar(g, FICHERO, datos);
    };
    return window.ColaGuardado ? ColaGuardado.poner(FICHERO, hacer) : hacer();
  }

  function guardarTipo(nombreTipo, pasos) {
    return conFichero(function (datos) {
      if (pasos && pasos.length) datos[nombreTipo] = pasos; else delete datos[nombreTipo];
    });
  }

  /* ---------- la guía como recordatorio, al crear el asunto ----------

     Fila 197 (docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md, punto 2): al pulsar
     un tipo, arriba de la parrilla sale el resumen de su guía en una
     línea (Guias.resumenDeTipo); pulsable, despliega la guía entera
     -lo que antes se enseñaba siempre al fondo del formulario, en el
     mismo `#guia-nuevo`- y se vuelve a plegar. */

  function pintarGuiaNuevo() {
    var caja = $('guia-nuevo');
    var resumenCaja = $('guia-resumen-nuevo');
    if (!caja || !resumenCaja) return;
    caja.className = 'oculto';
    caja.innerHTML = '';

    var elegido = document.querySelector('#tipos-lista .tipo-boton.elegido');
    var tipo = elegido ? (elegido.dataset.tipo || elegido.textContent.trim()) : '';
    if (!tipo) {
      resumenCaja.className = 'guia-resumen oculto';
      resumenCaja.textContent = '';
      resumenCaja.onclick = null;
      return;
    }

    var tipoObj = (window.App && App.E.tipos || []).filter(function (t) { return t.tipo === tipo; })[0] || { tipo: tipo };
    var resumen = Guias.resumenDeTipo(tipoObj);
    resumenCaja.className = 'guia-resumen' + (resumen.pasos.length ? '' : ' guia-resumen-vacia');
    resumenCaja.textContent = resumen.texto;

    if (!resumen.pasos.length) { resumenCaja.onclick = null; return; }
    resumenCaja.onclick = function () {
      var abierta = !caja.classList.contains('oculto');
      if (abierta) {
        caja.className = 'oculto';
        caja.innerHTML = '';
      } else {
        caja.className = 'guia-caja';
        caja.innerHTML = '<div class="guia-rotulo">Hitos de un asunto ' + U.escapar(tipo) + '</div>' +
                         Guias.vista(resumen.pasos, [], false);
      }
    };
  }

  /* ---------- la tabla de Ajustes ---------- */

  function pintarTabla() {
    var caja = $('tabla-guias');
    if (!caja) return;
    caja.innerHTML = '';

    var tipos = window.Gestor.tipos();
    if (!tipos.length) {
      caja.innerHTML = '<div class="vacio">Primero hacen falta tipos de asunto, ' +
                       'aquí mismo en Ajustes.</div>';
      return;
    }

    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = tipos.filter(function (t) { return t.categoria === cat; });
      if (!deEsta.length) return;
      var t = document.createElement('h4');
      t.textContent = cat;
      t.style.cssText = 'margin:16px 0 4px;font-size:13px;color:#5d6b7a';
      caja.appendChild(t);

      deEsta.forEach(function (tipo) {
        var pasos = pasosDe(tipo.tipo);
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(tipo.tipo) + '</span>' +
          '<span class="suave" style="flex:1">' +
          (pasos.length
            ? (pasos.length === 1 ? '1 hito' : pasos.length + ' hitos')
            : 'sin guía todavía') + '</span>';

        var b = document.createElement('button');
        b.className = 'boton' + (pasos.length ? ' boton-marcado' : '');
        b.textContent = pasos.length ? 'Cambiar la guía' : 'Escribir la guía';
        b.onclick = function () { escribirGuia(tipo.tipo); };
        f.appendChild(b);

        caja.appendChild(f);
      });
    });
  }

  /* Abre el cuadro de escribir la guía de un tipo y la guarda.
     Devuelve true si se ha guardado algo, false si se ha cancelado o si
     ha fallado.

     **Se relee el fichero antes de abrir el cuadro.** El compañero puede
     haber escrito otra guía desde el otro ordenador mientras tanto, y sin
     releer se guardaría encima de la suya. Es la misma precaución que
     toma App.anotar con asuntos.json. */
  /* `opciones.irA` (fila 113): abrir el cuadro ya en ese hito (desde el mapa). */
  async function escribirGuia(nombreTipo, opciones) {
    if (!nombreTipo) return false;
    try {
      await cargar();
      yaLeido = true;
    } catch (e) { /* si no se puede releer, se sigue con lo que hay */ }

    /* Las personas y los papeles de Ajustes › Hitos, para el
       responsable y para «Esperamos a…» de cada hito (fila 129: ya no
       hay estados escritos a mano). Si algo falla al leerlas, los
       desplegables salen vacíos y el resto del cuadro sigue igual. */
    var opcionesResp = [];
    try {
      if (window.Hitos) {
        var datosHitos = await window.Hitos.leer();
        /* Fila 159: en la guía, «Administración» en vez de las personas. */
        opcionesResp = (window.HitosAdministracion ? HitosAdministracion.paraGuia(datosHitos.ajustes) : datosHitos.ajustes.responsables)
          .concat(window.Hitos.PAPELES);
      }
    } catch (e) { /* sin desplegable de responsable, pero se sigue */ }

    /* Las plantillas de documento, una vez antes de abrir el cuadro
       (fila 102, «Documentos de este hito»). */
    if (window.GuiasDocumentos) await GuiasDocumentos.precargar();
    var pasos = await Guias.editar(nombreTipo, pasosDe(nombreTipo), opcionesResp, [], opciones);
    if (pasos === null || pasos === false || pasos === undefined) return false;

    if (pasos.length) guias[nombreTipo] = pasos;
    else delete guias[nombreTipo];

    try {
      await guardarTipo(nombreTipo, pasos);
    } catch (e) {
      U.aviso('No he podido guardarla: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    var llegados = await llevarAAbiertos(nombreTipo, pasos);
    try {
      pintarTabla();
      pintarGuiaNuevo();
      await window.Gestor.recargar();
      U.aviso(pasos.length
        ? 'Guía de ' + nombreTipo + ' guardada: ' + pasos.length + ' hitos.' +
          (llegados ? ' Los hitos nuevos han llegado a ' +
            (llegados === 1 ? '1 asunto abierto.' : llegados + ' asuntos abiertos.') : '')
        : nombreTipo + ' se queda sin guía.', 'bueno');
      return true;
    } catch (e) {
      U.accesorio('Guía guardada, pero no he podido repintar la pantalla', e);
      return true;
    }
  }

  /* Guarda una lista de pasos ya decidida, sin abrir el cuadro de
     editar (20-sep-2026, fila 79, apartado 4.4): lo usa "Ver el
     cambio", que ya ha hecho su propia pregunta (Traer el cambio /
     Dejarlo como está) y solo necesita que el resultado quede escrito.
     Se relee antes de escribir, como escribirGuia. */
  async function guardarPasos(nombreTipo, pasosNuevos) {
    try { await cargar(); } catch (e) { /* se sigue con lo que hay */ }
    if (pasosNuevos.length) guias[nombreTipo] = pasosNuevos; else delete guias[nombreTipo];
    await guardarTipo(nombreTipo, pasosNuevos);
    /* Fila 255: los campos de un paso que ya no está pasan a ser del asunto. */
    if (window.CamposDeHito) {
      try { await CamposDeHito.limpiarMarcas(nombreTipo, pasosNuevos); }
      catch (e) { U.accesorio('La guía se ha guardado, pero no he podido soltar los campos de un hito borrado', e); }
    }
    var llegados = await llevarAAbiertos(nombreTipo, pasosNuevos);
    if (llegados) {
      U.aviso('Los hitos nuevos de ' + nombreTipo + ' han llegado a ' +
        (llegados === 1 ? '1 asunto abierto.' : llegados + ' asuntos abiertos.'), 'bueno');
    }
    pintarTabla();
    pintarGuiaNuevo();
    await window.Gestor.recargar();
    return llegados;
  }

  /* Fila 118 (docs/GUIA-NUEVA-LLEGA-A-LOS-ASUNTOS.md): los hitos nuevos
     de la guía, a los asuntos abiertos de ese tipo que ya tienen hitos
     (js/hitos-sincronizar.js). La guía ya está guardada: si esto
     falla, ámbar, nunca rojo. Devuelve a cuántos asuntos ha llegado. */
  async function llevarAAbiertos(nombreTipo, pasos) {
    if (!pasos || !pasos.length || !window.Hitos || !Hitos.llevarGuiaAAbiertos) return 0;
    try {
      var n = await Hitos.llevarGuiaAAbiertos(nombreTipo, pasos);
      if (n && window.HitosPanel) HitosPanel.programarRepintado();
      return n;
    } catch (e) {
      U.accesorio('Guía guardada, pero no he podido llevar los hitos nuevos a los asuntos abiertos', e);
      return 0;
    }
  }

  /* Fila 120 (docs/GUION-DESDE-EL-HITO.md): relee guias.json, deja que
     `cambiar` toque una copia de los pasos del tipo y la guarda por
     guardarPasos. Si `cambiar` devuelve false, no se guarda nada. */
  async function cambiarPasos(nombreTipo, cambiar) {
    try { await cargar(); } catch (e) { /* se sigue con lo que hay */ }
    var copia = JSON.parse(JSON.stringify(pasosDe(nombreTipo)));
    if (cambiar(copia) === false) return false;
    await guardarPasos(nombreTipo, copia);
    return true;
  }

  /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md): si el tipo no tiene guía,
     le pone `pasosNuevos` (la guía mínima de js/estado-hito.js) como
     guía normal, editable después como cualquier otra. Relee antes; si
     el otro ordenador ya le puso una, se queda la suya. Sin llevarla a
     los abiertos ni recargar: quien llama crea los hitos él mismo. */
  async function asegurarGuia(nombreTipo, pasosNuevos) {
    /* La comprobación de "¿sigue vacío?" va DENTRO de conFichero, sobre
       el mismo releído que escribe: si se hiciera antes (con cargar())
       y el otro ordenador acabara de ponerle una guía mientras tanto,
       esto la pisaría igual. */
    await conFichero(function (datos) {
      if (!(datos[nombreTipo] && datos[nombreTipo].length)) {
        datos[nombreTipo] = Guias.normalizar(pasosNuevos || []);
      }
    });
    try { pintarTabla(); } catch (e2) { /* solo pintar */ }
    return pasosDe(nombreTipo).slice();
  }

  /* Lo que usa la ficha de un asunto para escribir la guía de su tipo
     sin pasar por Ajustes. Las guías viven en un solo sitio, y es este
     fichero el que las lleva: si la ficha escribiera por su cuenta, las
     dos copias se quedarían distintas. */
  window.GuiasDelCentro = {
    escribir: escribirGuia,
    pasosDe: function (tipo) { return pasosDe(tipo).slice(); },
    guardarPasos: guardarPasos,
    cambiarPasos: cambiarPasos,
    ponerAlDia: ponerAlDia, alEntrarEnNuevo: alEntrarEnNuevo,   /* fila 273 */
    recargar: cargar,   /* fila 138: tras pasar «lo que hay que reunir» al guion */
    asegurarGuia: asegurarGuia,
    _guardarTipo: guardarTipo   /* para pruebas/datos-entre-ordenadores.mjs (fila 176) */
  };

  /* ---------- arranque ---------- */

  async function arrancar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    yaLeido = true;
    await cargar();
    pintarTabla();
    pintarGuiaNuevo();
    await window.Gestor.recargar();
  }

  function enganchar() {
    if (!window.Gestor) return;

    /* Al elegir el tipo en Nuevo asunto, se enseña su guía debajo. */
    var lista = $('tipos-lista');
    if (lista) {
      lista.addEventListener('click', function () {
        setTimeout(pintarGuiaNuevo, 0);
      });
    }

    window.Gestor.alRefrescar.push(function () {
      if (!yaLeido && window.Gestor.carpetaGestor()) arrancar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
