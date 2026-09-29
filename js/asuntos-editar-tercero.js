/* ============================================================
   asuntos-editar-tercero.js — el tercero de «Cambiar el asunto», con
   buscador (fila 219, docs/TERCERO-CON-BUSCADOR-AL-CAMBIAR.md).

   Antes, el tercero de este cuadro era un campo de texto libre
   (#ed-tercero): se podía escribir cualquier cosa, sin encaje con
   ningún tercero dado de alta. Ahora es el mismo buscador de «Nuevo
   asunto» (App.buscarEnCategorias, App.claseDeResultado, App.pieDe,
   App.LISTAS_DE_CATEGORIA), en todas las categorías a la vez y sin
   pastillas (aquí no hace falta filtrar: el tipo de asunto ya se
   elige en otro campo del mismo cuadro).

   A propósito, este módulo nunca toca App.E.nuevo ni los elementos de
   Nuevo asunto (#buscar-tercero, #resultados-tercero...): es su
   propio estado, local a la llamada de App.montarTerceroEditar. Así lo
   pedía la propia fila: «hoy el alta está pensada para App.E.nuevo;
   hay que hacer que funcione también desde este cuadro sin ensuciarlo».

   El «Dar de alta» de aquí NO llama a App.altaTercero directamente
   (que abriría su propio cuadro con U.preguntar): este buscador vive
   YA dentro del cuadro «Cambiar el asunto», también hecho con
   U.preguntar, y un segundo U.preguntar abierto mientras el primero
   sigue esperando le roba la respuesta al de fuera (U.preguntar solo
   deja uno a la vez: `cuadroEsperando`, en js/util.js). Por eso, un
   botón de alta de aquí solo avisa hacia afuera (`alPedirAlta`); es
   js/asuntos-editar.js quien cierra su propio cuadro primero (con el
   propio botón Cancelar, ordenadamente, sin robar nada) y ya con el
   camino libre llama a App.altaTercero, para volver a abrir «Cambiar
   el asunto» con lo de antes y el recién creado ya elegido. */

/* Monta el buscador dentro de `caja` (un <div> vacío del cuadro de
   editar) y engancha sus eventos. `terceroTextoActual` es el texto
   guardado hoy (puede no encajar con ningún tercero de las listas: un
   asunto antiguo, o uno creado a mano). `elegidoInicial`, si viene, es
   una persona ya elegida de antes (al volver a abrir el cuadro tras un
   alta) y manda sobre `terceroTextoActual`.

   `alElegir(persona)` se llama solo cuando el usuario elige una
   persona ya existente, nunca al montar ni al reabrir el buscador: así
   quien llama puede rehacer el aviso de categoría y el desplegable de
   Administraciones sin repetirlos en cada tecla de los demás campos
   del cuadro. `alPedirAlta(categoria, texto)` se llama al pulsar un
   botón de "Dar de alta": quien monta decide qué hacer (ver arriba).

   Devuelve `{ terceroElegido() }`: null mientras no se haya elegido
   ninguno (el tercero no cambia al guardar, punto 3 de la fila). */
App.montarTerceroEditar = function (caja, terceroTextoActual, alElegir, alPedirAlta, elegidoInicial) {
  var estado = { elegido: elegidoInicial || null };
  var temporizador = null;

  function pintarElegido() {
    var texto = estado.elegido ? App.textoTercero(estado.elegido) : terceroTextoActual;
    var categoriaHtml = estado.elegido
      ? '<span class="resultado-categoria">' + U.escapar(Nombres.textoCategoria(estado.elegido.categoria, 'lista')) + '</span>'
      : '';
    caja.innerHTML = '<div class="elegido"><div class="elegido-caja">' +
      '<div><strong>' + U.escapar(texto) + '</strong>' + categoriaHtml + '</div>' +
      '<button type="button" class="boton" id="ed-tercero-cambiar">Cambiar</button></div></div>';
    caja.querySelector('#ed-tercero-cambiar').onclick = pintarBuscador;
  }

  function pintarBuscador() {
    caja.innerHTML =
      '<input id="ed-tercero-buscar" class="campo" placeholder="Escribe dos letras del nombre">' +
      '<div id="ed-tercero-resultados" class="resultados"></div>';
    var input = caja.querySelector('#ed-tercero-buscar');
    input.oninput = function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(buscar, 180);
    };
    input.focus();
  }

  function elegir(p) {
    estado.elegido = p;
    pintarElegido();
    alElegir(p);
  }

  /* Los mismos textos que App.botonesAlta (js/asuntos-nuevo-alta.js),
     pero sin llamar a App.altaTercero: aquí solo se avisa hacia
     afuera (ver la cabecera del fichero). */
  function botonesAlta(texto) {
    return Nombres.CATEGORIAS.filter(App.admiteAlta).map(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.style.marginTop = '6px';
      b.style.marginRight = '6px';
      b.textContent = cat === 'ALUMNADO'
        ? '+ Dar de alta un solicitante'
        : '+ Dar de alta en ' + Nombres.textoCategoria(cat, 'lista');
      b.onclick = function () { alPedirAlta(cat, texto); };
      return b;
    });
  }

  async function buscar() {
    var input = caja.querySelector('#ed-tercero-buscar');
    if (!input) return;   /* se ha vuelto a pulsar «Cambiar» mientras se buscaba */
    var texto = input.value;
    var resultados = caja.querySelector('#ed-tercero-resultados');
    if (U.normalizar(texto).length < 2) { resultados.innerHTML = ''; return; }
    resultados.innerHTML = '<div class="explica">Buscando…</div>';

    var porCategoria = await App.buscarEnCategorias(texto, Nombres.CATEGORIAS.slice(), 8);
    if (caja.querySelector('#ed-tercero-buscar') !== input) return;   /* el cuadro ha cambiado mientras tanto */
    resultados.innerHTML = '';

    var total = 0;
    porCategoria.forEach(function (p) { total += p.resultados.length; });

    function tarjeta(p) {
      var d = document.createElement('div');
      d.className = App.claseDeResultado(p);
      if (p.id) d.dataset.nie = p.id;
      d.innerHTML = '<div>' + U.escapar(p.nombre) +
        '<span class="resultado-categoria">' + U.escapar(Nombres.textoCategoria(p.categoria, 'lista')) + '</span></div>' +
        '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
      d.onclick = function () { elegir(p); };
      return d;
    }

    if (!total) {
      var vacio = document.createElement('div');
      vacio.className = 'vacio';
      vacio.textContent = 'Nadie con ese nombre en ninguna categoría.';
      resultados.appendChild(vacio);
      botonesAlta(texto).forEach(function (b) { resultados.appendChild(b); });
      return;
    }

    porCategoria.forEach(function (p) {
      if (!p.resultados.length) return;
      /* Fila 167: Administraciones se enseña agrupada, como en «Nuevo asunto». */
      var propia = App.LISTAS_DE_CATEGORIA && App.LISTAS_DE_CATEGORIA[p.categoria];
      if (propia) propia(resultados, { lista: p.resultados }, '', tarjeta);
      else p.resultados.forEach(function (r) { resultados.appendChild(tarjeta(r)); });
    });

    botonesAlta(texto).forEach(function (b) { resultados.appendChild(b); });
  }

  pintarElegido();

  return { terceroElegido: function () { return estado.elegido; } };
};
