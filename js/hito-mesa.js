/* ============================================================
   hito-mesa.js — el hito entero, en la columna izquierda de «Trabajo»
   (24-sep-2026, fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md; fila 425,
   docs/FICHA-VISTA-DE-TRABAJO.md).

   Dentro de la pestaña «Trabajo» (js/ficha-tarjetas.js), la lista de
   hitos es compacta: una línea por hito. Al entrar en un asunto se abre
   la mesa del hito actual (el primero sin hacer); con todos hechos, la
   lista. Pulsar un hito de la lista, o una celda de la tira, abre su
   mesa: la cabecera (camino, título, etiquetas de estado, plazo y
   responsable, «Marcar hito como hecho», menú «Hito ▾» y la tira de
   hitos) y, debajo, de arriba abajo y en una sola columna, lo que pinta
   js/hitos-panel-lista.js en el cuerpo del hito: tareas, campos,
   documentos del hito y registro. (Fila 638: la cabecera es el nombre, «Marcar
   como hecho» y «Hito ▾», con su línea debajo; el hito lleva solo sus tareas y
   no hay botones sueltos de generar ni de comunicar.)

   No hay pantalla nueva: la mesa es el mismo `.hito` con su
   `.hito-cuerpo` visible y la clase `con-mesa` en `#ficha-guia`, que
   esconde los demás. El hito abierto se recuerda aquí (por asunto), así
   que un repintado no la cierra: js/hitos-panel.js llama a `aplicar`
   después de cada repintado.

   - Escape (js/usabilidad.js, `cerrarSiAbierta`) vuelve a la lista.
   - Desde "Qué me toca" (`HitosPanel.desplegarAlAbrir`) se entra
     directo en la mesa de ese hito.

   Las columnas las rellenan js/hito-mesa-guion.js y
   js/hito-mesa-documentos.js.
   ============================================================ */
var HitoMesa = (function () {

  var abierta = null;   /* { clave, idHito } */
  var ultimo = null;    /* { caja, a, hitos, ajustes, abierto } del último pintado */
  /* Fila 425: el asunto en el que se pidió ver la lista de hitos (← Hitos); ahí no se abre el hito solo. */
  var listaElegida = null;

  function $(id) { return document.getElementById(id); }

  function hitoPorId(hitos, id) { return window.Hitos ? Hitos.buscar(hitos || [], id) : null; }

  /* ---------- abrir y cerrar ---------- */

  function abrir(a, idHito) {
    var otro = !abierta || abierta.clave !== a.nombre || abierta.idHito !== idHito;
    listaElegida = null;
    abierta = { clave: a.nombre, idHito: idHito };
    /* Fila 164: los documentos de otros hitos se pintan solo en el de la mesa. */
    if (otro && window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    if (ultimo && ultimo.a && ultimo.a.nombre === a.nombre) {
      aplicar(ultimo.caja, ultimo.a, ultimo.hitos, ultimo.ajustes, ultimo.abierto);
    }
    if (window.FichaTarjetas && FichaTarjetas.abierta && FichaTarjetas.abierta() !== 'trabajo' && FichaTarjetas.abrir) {
      FichaTarjetas.abrir('trabajo');
    }
    window.scrollTo(0, 0);
  }

  /* Para "Qué me toca": se abrirá en cuanto se pinte ese asunto. */
  function abrirAlPintar(clave, idHito) {
    listaElegida = null;
    abierta = { clave: clave, idHito: idHito };
  }

  /* Fila 425: al entrar en una ficha, el hito de partida es el actual. Si es otra ficha (no el repintado
     de la que ya estaba a la vista), se olvida lo que se hubiera abierto o elegido antes. */
  function alEntrarEnLaFicha(a, mismaALaVista) {
    if (mismaALaVista) return;
    abierta = null;
    listaElegida = null;
  }

  function cerrar() {
    if (abierta) listaElegida = abierta.clave;
    abierta = null;
    if (ultimo) aplicar(ultimo.caja, ultimo.a, ultimo.hitos, ultimo.ajustes, ultimo.abierto);
  }

  function estaAbierta() {
    var caja = $('ficha-guia');
    return !!(abierta && caja && caja.classList.contains('con-mesa') && caja.offsetParent);
  }

  function cerrarSiAbierta() {
    if (!estaAbierta()) return false;
    cerrar();
    return true;
  }

  /* ---------- después de cada repintado de los hitos ---------- */

  function aplicar(caja, a, hitos, ajustes, abierto) {
    if (!caja) return;
    ultimo = { caja: caja, a: a, hitos: hitos, ajustes: ajustes, abierto: abierto };
    /* Fila 425: sin hito pedido, el actual (el primero sin hacer); con todos hechos, la lista. */
    if (a && (!abierta || abierta.clave !== a.nombre) && listaElegida !== a.nombre && window.EstadoHito && EstadoHito.idActual) {
      var porDefecto = EstadoHito.idActual(hitos, ajustes);
      if (porDefecto) abierta = { clave: a.nombre, idHito: porDefecto };
    }
    var fila = null;
    if (abierta && a && abierta.clave === a.nombre) {
      fila = caja.querySelector('.hito[data-id="' + abierta.idHito + '"]');
      if (!fila || !fila.querySelector('.hito-cuerpo')) fila = null;
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.hito'), function (f) {
      var enMesa = f === fila;
      f.classList.toggle('hito-en-mesa', enMesa);
      var cuerpo = f.querySelector(':scope > .hito-cuerpo');
      if (cuerpo) cuerpo.classList.toggle('oculto', !enMesa);
    });
    caja.classList.toggle('con-mesa', !!fila);
    var columnas = $('trabajo-columnas');
    if (columnas) columnas.classList.toggle('con-hito', !!fila);
    if (window.FichaDocumentos && FichaDocumentos.marcarHito) FichaDocumentos.marcarHito(a, hitos, fila ? abierta.idHito : null, !!(fila && abierto));   /* fila 425: «Hito N» y casillas en la carpeta */
    if (!fila) {
      var tiraVacia = document.getElementById('ficha-tira');
      if (tiraVacia) tiraVacia.innerHTML = '';   /* fila 637: sin hito abierto, no hay fila de hitos */
      if (window.HitoMesaDocumentos && HitoMesaDocumentos.soltarAlHito) HitoMesaDocumentos.soltarAlHito(null);
      if (window.FichaTarjetas && FichaTarjetas.alCambiarLaMesa) FichaTarjetas.alCambiarLaMesa();
      return;
    }
    var h = hitoPorId(hitos, abierta.idHito);
    pintarCabecera(fila, a, h, hitos, ajustes, abierto);
    if (window.HitoMesaGuion) HitoMesaGuion.pintar(fila, a, h, abierto, hitos);
    if (window.HitoMesaDocumentos) HitoMesaDocumentos.enganchar(fila, a, h, hitos, abierto);
    if (window.FichaTarjetas && FichaTarjetas.alCambiarLaMesa) FichaTarjetas.alCambiarLaMesa();
  }

  /* Fila 638: «Esperando a…» (y lo que cambia sola la espera al llegar un documento) se ve en la línea del hito: se pone al día solo
     esa línea, con lo último leído de hitos.json, sin volver a leer nada ni repintar el hito entero. */
  function refrescarLinea() {
    if (!abierta || !ultimo || !ultimo.a || ultimo.a.nombre !== abierta.clave || !window.HitoMesaLinea || !window.Hitos || !Hitos.ultimosLeidos) return false;
    var datos = Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto ? datos.porAsunto[ultimo.a.nombre] : null;
    var fila = ultimo.caja && ultimo.caja.querySelector('.hito.hito-en-mesa');
    var cab = fila && fila.querySelector(':scope > .hito-cuerpo > .mesa-cabecera');
    var linea = cab && cab.querySelector('.mesa-linea');
    var h = entrada ? hitoPorId(entrada.hitos, abierta.idHito) : null;
    if (!linea || !h) return false;
    ultimo.hitos = entrada.hitos;
    ultimo.ajustes = datos.ajustes;
    linea.outerHTML = HitoMesaLinea.html(ultimo.a, h, entrada.hitos, datos.ajustes, ultimo.abierto);
    HitoMesaLinea.enganchar(cab, ultimo.a, h, entrada.hitos, datos.ajustes, ultimo.abierto);
    return true;
  }

  /* Tras marcar un hito como hecho (fila 173, punto 5): al hito que
     haya quedado en curso, con los datos recién guardados (no los del
     último `aplicar`, que son de antes de marcar). Sin ninguno en
     curso, `pintarCabecera` ya enseña "Todos los hitos están hechos.":
     aquí no hay que hacer nada más. */
  function irAlSiguienteTrasMarcar(a) {
    if (!window.Hitos || !Hitos.ultimosLeidos || !window.EstadoHito || !EstadoHito.idActual) return;
    var datos = Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
    var hitosFrescos = entrada ? entrada.hitos : [];
    var siguiente = EstadoHito.idActual(hitosFrescos, datos.ajustes);
    if (siguiente) abrir(a, siguiente);
  }

  /* ---------- la cabecera de la mesa ---------- */

  /* "Vence el 15-oct · quedan N días hábiles", con los no lectivos de
     Ajustes › Hitos; colores de Plazos.de. */
  /* `cuenta` (fila 131): cómo se cuenta el plazo de este hito, para
     «quedan N días hábiles / lectivos / naturales». Hábiles si no dice. */
  function textoPlazo(fecha, ajustes, cuenta) {
    if (!fecha) return { texto: 'Sin plazo', clase: 'mesa-etq-gris' };
    var p = Plazos.de(fecha);
    var quedan = 0;
    var modo = Plazos.cuentaValida ? Plazos.cuentaValida(cuenta) : 'habiles';
    if (modo === 'meses') modo = 'naturales';   /* fila 284: lo que queda de un plazo en meses se dice en días */
    if (p && p.dias > 0) {
      quedan = Plazos.diasQueQuedan(U.hoyIso(), fecha, modo, (ajustes && ajustes.festivos) || [], (ajustes && ajustes.noLectivos) || []);
    }
    var corto = Plazos.etiquetaVencimiento ? Plazos.etiquetaVencimiento(fecha).texto : Plazos.legible(fecha);
    var texto = p && p.dias > 0
      ? corto.replace(/ · quedan \d+ días?$/, '') + ' · quedan ' + Plazos.textoDias(quedan, modo)
      : corto;
    var clase = !p ? 'mesa-etq-gris' : (p.clase === 'plazo-vencido' ? 'mesa-etq-rojo' : p.clase === 'plazo-cerca' ? 'mesa-etq-ambar' : 'mesa-etq-verde');
    return { texto: texto, clase: clase };
  }

  /* Fila 638 (docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md): la cabecera del hito es su nombre, «Marcar como hecho» (solo
     en el hito actual) y «Hito ▾»; debajo, su línea (js/hito-mesa-linea.js). Ya no hay «Generar documento ▾», «Comunicar ▾»
     ni «Hacer este hito»: todo documento y toda comunicación salen de una tarea (js/hito-mesa-guion.js). */
  function pintarCabecera(fila, a, h, hitos, ajustes, abierto) {
    var cab = fila.querySelector(':scope > .hito-cuerpo > .mesa-cabecera');
    if (!cab || !h) return;
    var visibles = Hitos.visibles(hitos).filter(function (x) { return x.estado !== 'noaplica' && !x.delTipoAnterior; });
    /* Fila 154: los números, con la misma cuenta que «Hito N de M» (sin los «solo informativo», que en la tira
       salen sin número). */
    var numerados = Hitos.numerados ? Hitos.numerados(hitos) : visibles;
    function numeroDe(x) { return numerados.indexOf(x) + 1; }
    var n = numeroDe(h);
    var guion = Hitos.guionDe ? Hitos.guionDe(a, h) : [];
    var cuenta = Hitos.cuentaGuion ? Hitos.cuentaGuion(guion) : { hechos: 0, total: 0 };
    var completo = cuenta.total > 0 && cuenta.hechos === cuenta.total && h.estado !== 'hecho';
    var decision = h.clase === 'decision';
    var esElActual = !!(window.EstadoHito && EstadoHito.idActual && EstadoHito.idActual(hitos, ajustes) === h.id);
    /* Fila 173, punto 5: sin ningún hito en curso (todos hechos o "No aplica"), se enseña aquí mismo, se esté viendo el
       hito que se esté viendo, con un atajo para archivar. */
    var todoHecho = abierto && window.EstadoHito && EstadoHito.idActual && EstadoHito.idActual(hitos, ajustes) === null;
    /* Fila 637: la fila de hitos va a todo el ancho, debajo de la cabecera de la ficha (`#ficha-tira`,
       js/ficha-tarjetas.js), con el hito actual marcado y «+ Añadir hito» al final. */
    var tira = document.getElementById('ficha-tira');
    if (tira) {
      tira.innerHTML = visibles.map(function (x) {
        var num = numeroDe(x) ? numeroDe(x) + '. ' : 'i · ';
        return '<button type="button" class="mesa-tira-hito' + (x.id === h.id ? ' actual' : '') +
          (x.estado === 'hecho' ? ' hecho' : '') + '" data-id="' + U.escapar(x.id) + '" title="' + U.escapar(num + (x.titulo || '')) + '">' +
          (x.estado === 'hecho' ? '✓ ' : '') + num + U.escapar(x.titulo || '') + '</button>';
      }).join('') +
        /* Fila 553: «+ Añadir hito», al final de la fila. */
        (abierto && window.ComunesAsunto ? '<button type="button" class="mesa-tira-anadir comunes-anadir-hito">+ Añadir hito</button>' : '');
      Array.prototype.forEach.call(tira.querySelectorAll('.mesa-tira-hito'), function (b) {
        b.onclick = function () { abrir(a, b.dataset.id); };
      });
      var anadirHito = tira.querySelector('.mesa-tira-anadir');
      if (anadirHito) anadirHito.onclick = function () { ComunesAsunto.anadirHito(a); };
    }
    var puedeMarcar = abierto && !decision && (esElActual || h.estado === 'hecho');
    cab.innerHTML =
      '<div class="mesa-titulo-fila">' +
        '<h3 class="mesa-titulo" title="' + (n ? 'Hito ' + n + ' de ' + numerados.length : 'Hito solo informativo') + '">' + U.escapar(h.titulo || '') + '</h3>' +
        (window.HitosDesdeElAsunto ? HitosDesdeElAsunto.marcaSoloAquiHTML(a, h) : '') +
        '<div class="mesa-acciones">' +
          (abierto && !decision && window.Esperas ? Esperas.botonHTML(a, h) : '') +   /* fila 286 */
          (puedeMarcar
            ? '<button type="button" class="boton' + (h.estado === 'hecho' ? '' : ' boton-principal') + (completo ? ' mesa-hecho-resaltado' : '') + ' mesa-marcar-hecho">' +
              (h.estado === 'hecho' ? 'Hecho ✓ (desmarcar)' : 'Marcar como hecho') + '</button>' : '') +
          (abierto ? '<button type="button" class="boton mesa-mas" data-ayuda-clave="menu-del-hito">Hito ▾</button>' : '') +
        '</div>' +
      '</div>' +
      (window.HitoMesaLinea ? HitoMesaLinea.html(a, h, hitos, ajustes, abierto) : '') +
      (todoHecho ? '<div class="mesa-todo-hecho aviso aviso-verde">Todos los hitos están hechos. ' +
        /* Fila 249: en un tipo que hay que liquidar, no se archiva: se pasa a «Por liquidar». */
        (window.PorLiquidar && PorLiquidar.exige(a) && PorLiquidar.estaPorLiquidar(a)
          ? 'El asunto está en «Por liquidar».'
          : '<button type="button" class="boton boton-principal mesa-archivar-asunto">' +
            (window.PorLiquidar ? PorLiquidar.textoDelBoton(a) : 'Archivar el asunto') + '</button>') +
        '</div>' : '');

    if (abierto && window.Esperas) Esperas.enganchar(cab, a, h);
    var archivarBtn = cab.querySelector('.mesa-archivar-asunto');
    if (archivarBtn) archivarBtn.onclick = function () {
      /* Lo mismo que el botón de la cabecera de la ficha (fila 106, js/ficha-asunto.js): se pulsa el de verdad, para no
         repetir su guardado ni su navegación al terminar. */
      var real = document.querySelector('#ficha-archivar button');
      if (real) { real.click(); return; }
      U.mientrasGuarda(archivarBtn, function () { return ArchivarFondo.archivar(a); });
    };
    if (window.HitoMesaLinea) HitoMesaLinea.enganchar(cab, a, h, hitos, ajustes, abierto);
    if (!abierto || !window.FichaMenus) return;

    /* "Marcar como hecho": pulsa por debajo la misma casilla de siempre (así sigue avisando de lo obligatorio sin
       reunir), y cuando el guardado termina y se ha marcado (no al desmarcar), pasa al hito que haya quedado en curso
       (fila 173, punto 5). */
    var marcarBtn = cab.querySelector('.mesa-marcar-hecho');
    if (marcarBtn) marcarBtn.onclick = async function () {
      var casilla = fila.querySelector(':scope > .hito-linea .hito-casilla');
      if (!casilla) return;
      var seMarca = !casilla.checked;
      casilla.checked = seMarca;
      var ok = window.HitosPanelLista && HitosPanelLista.marcarDesdeCasilla
        ? await HitosPanelLista.marcarDesdeCasilla(casilla, a, h)
        : false;
      if (ok && seMarca) irAlSiguienteTrasMarcar(a);
    };

    var mas = cab.querySelector('.mesa-mas');
    var opcionesMas = [];
    /* Fila 224: arriba, sin repetir la palabra, Cambiar · Borrar (fila 553: sin «Crear»). Nunca en un hito-pregunta
       (las preguntas se siguen escribiendo en Ajustes). Fila 638: ya no están «Dejarlo solo informativo» (sigue en la
       guía del tipo) ni «Enviar estado»; el responsable se cambia en «Cambiar». */
    if (window.HitosDesdeElAsunto && !decision) {
      opcionesMas.push({ texto: 'Cambiar', clase: 'mesa-hda-cambiar', alPulsar: function () { HitosDesdeElAsunto.abrirCambiar(a, h); } });
      var puedeBorrar = HitosDesdeElAsunto.sinTrabajo(h, a);
      opcionesMas.push({ texto: 'Borrar', clase: 'ficha-menu-peligro', deshabilitado: !puedeBorrar,
        title: puedeBorrar ? '' : 'Tiene trabajo: no se puede borrar',
        alPulsar: function () { HitosDesdeElAsunto.abrirBorrar(a, h); } });
      /* Fila 416: un hito «solo aquí» (sin paso en la guía) se puede llevar entero a la guía, sin preguntar. */
      if (HitosDesdeElAsunto.esSoloAqui(a, h) && window.HitosDesdeElAsuntoGuia &&
          HitosDesdeElAsunto.nivelSuperior(hitos).some(function (x) { return x.id === h.id; })) {
        opcionesMas.push({ texto: 'Pasar a la guía', clase: 'mesa-hda-pasar', alPulsar: function () { HitosDesdeElAsunto.pasarALaGuia(a, h); } });
      }
      opcionesMas.push({ raya: true });
    }
    /* Fila 129: dar por hechos los anteriores (js/estado-hito.js). */
    if (window.EstadoHito && EstadoHito.puedeSituar(hitos, h.id)) opcionesMas.push({ texto: 'Saltar a este hito…', clase: 'mesa-situar', alPulsar: function () {
      EstadoHito.situar(a, h.id, mas);
    } });
    if (window.GuiasDelCentro && GuiasDelCentro.escribir) opcionesMas.push({ texto: 'Cambiar la guía…', clase: 'mesa-cambiar-guia', alPulsar: function () { cambiarLaGuia(a); } });
    if (mas) FichaMenus.montar(mas, opcionesMas);
  }

  function tipoDe(a) { return (a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || ''; }

  /* «Cambiar la guía…» del menú ···, con la advertencia de siempre. */
  async function cambiarLaGuia(a) {
    var tipo = tipoDe(a);
    if (!tipo) return;
    var ok = await U.preguntar('Cambiar la guía',
      '<p>Vale para todos los asuntos ' + U.escapar(tipo) + ', no solo para este.</p>', 'Cambiar la guía');
    if (!ok) return;
    var hecho = await GuiasDelCentro.escribir(tipo);
    if (hecho && window.HitosPanel) HitosPanel.programarRepintado();
  }

  /* Fila 638: ya no hay desplegables en la cabecera (Escape y `usabilidad.js` los siguen preguntando: nunca hay uno abierto). */
  function cerrarPanelSiAbierto() { return false; }

  return {
    abrir: abrir, abrirAlPintar: abrirAlPintar, cerrar: cerrar, aplicar: aplicar,
    cerrarSiAbierta: cerrarSiAbierta, estaAbierta: estaAbierta,
    abierta: function () { return abierta; }, textoPlazo: textoPlazo, refrescarLinea: refrescarLinea,
    cerrarPanelSiAbierto: cerrarPanelSiAbierto,
    alEntrarEnLaFicha: alEntrarEnLaFicha
  };
})();
window.HitoMesa = HitoMesa;
