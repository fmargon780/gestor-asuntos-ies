/* ============================================================
   guias-editor.js — escribir la guía: el cuadro del editor.

   Sacado tal cual de js/guias.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Lo del modelo (normalizar, limpiar, esPregunta…) se pide a `Guias` (G).
   Se carga justo detrás de js/guias.js.
   ============================================================ */
(function () {
  var G = window.Guias || Guias;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     ESCRIBIR LA GUÍA

     Un recuadro por hito, y una sola barra de formato arriba que
     actúa sobre el recuadro en el que se está escribiendo (desde la
     fila 122, en js/guias-barra.js).
     ========================================================== */

  /* 'listaResponsables' es [{id,nombre}], personas de Ajustes más los
     papeles fijos; 'listaEstados' es una lista de nombres de
     estados.json. Las dos son opcionales: sin ellas, los desplegables
     salen vacíos, pero el resto del cuadro funciona igual (una guía
     vieja no tiene por qué dejar de escribirse). */
  /* `opciones.irA` (fila 113): el id de un hito; el cuadro se abre ya en
     su nivel y con él desplegado (lo usa el mapa, js/guias-mapa.js). */
  function editar(nombreTipo, lista, listaResponsables, listaEstados, opciones) {
    var pasos = G.normalizar(lista);
    var tipoInfo = ((window.App && App.E && App.E.tipos) || []).filter(function (t) { return t.tipo === nombreTipo; })[0];
    return G.convertirDocumentosYComunicacion(pasos, nombreTipo, tipoInfo ? tipoInfo.categoria : '')
      .catch(function () { /* sin poder convertir ahora, se abre el editor igual */ })
      .then(function () { return abrirCuadro(); });

    function abrirCuadro() {
    /* Fila 95 (docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md): el nivel que
       se ve (la guía entera, o los hitos de una opción de una pregunta
       de dentro) y el camino hasta él, como carpetas. Todo lo que
       pinta, recoge o añade trabaja sobre `nivel`; guardar, sobre
       `pasos`, la guía entera, esté donde esté Francisco. Cada hito del
       camino es { pregunta, opcion, lista } (lista: los hitos de esa
       opción, el mismo array que hay dentro del árbol). */
    var nivel = pasos;
    var opcionesResp = listaResponsables || [];
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-guia');   /* fila 463: a todo lo ancho, en dos columnas */
    GuiasBarra.reiniciar();
    /* Qué `<details>` estaban abiertos antes del último pintar(): lo lee
       `restaurarAbierto`, más abajo, y lo usan tanto `pintar()` como
       `GuiasOpcionesEditor.caja()` (fila 60, ver la nota junto a detallesAbiertos). */
    var abiertos = {};
    if (window.GuiasColumnas) GuiasColumnas.reiniciar();   /* fila 463 */
    /* El hito elegido (fila 122, js/guias-plegado.js; desde la fila 463, la lista de la izquierda). */
    var plegado = GuiasPlegado.crear({ nivel: function () { return nivel; }, recoger: recoger, responsables: opcionesResp,
      alElegir: function () { colocarBarra(); } });
    /* Lo que la caja de opciones (js/guias-opciones-editor.js) toma prestado. */
    var opcionesCtx = {
      nivel: function () { return nivel; }, recoger: recoger, pintar: pintar,
      entrar: function (p, op) { entrar(p, op); }, prepararRecuadro: prepararRecuadro,
      restaurar: function (det, pos, idSub) { restaurarAbierto(det, abiertos, pos, idSub); }, plegado: plegado,
      /* Fila 195: para el desplegable "Con la plantilla:" de "Avisar
         a quien lo pide" (js/guias-paso-bloques.js). */
      nombreTipo: nombreTipo
    };

    /* Fila 463: a todo lo ancho, en dos columnas. A la izquierda, la lista de
       hitos del nivel que se ve (y el camino, si se ha entrado en una pregunta);
       a la derecha, el hito elegido. Cada columna se desplaza por su cuenta. */
    var esperar = U.preguntar('Guía de ' + nombreTipo,
      '<div class="guia-cab">' +
        '<h3 class="guia-cab-titulo">Guía de ' + U.escapar(nombreTipo) + '</h3>' +
        '<div class="guia-cab-herr">' +
          (window.GuiasMapa ? '<button type="button" class="boton" id="guia-ver-mapa">Ver mapa</button>' : '') +
          (window.GuiasBiblioteca ? '<button type="button" class="boton" id="guia-traer-biblioteca">+ Traer un hito de otro tipo</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="guia-dos-col">' +
        '<div class="guia-col-izq" id="guia-col-izq">' +
          '<div id="guia-camino" class="guia-camino"></div>' +
          '<div id="guia-lista" class="guia-lista"></div>' +
          '<button type="button" class="boton boton-ancho" id="guia-anadir">+ Añadir un hito</button>' +
        '</div>' +
        '<div class="guia-col-der" id="guia-col-der">' +
          (window.GuiasBiblioteca ? GuiasBiblioteca.panelTraerHTML() : '') +
          (window.GuiasMapa ? GuiasMapa.panelHTML() : '') +
          '<div id="guia-vacio-der" class="vacio oculto">Añade el primer hito</div>' +
          '<div id="guia-pasos"></div>' +
        '</div>' +
      '</div>',
      'Guardar');

    /* La barra de formato es un solo nodo: vive junto a la explicación del
       hito elegido (colocarBarra) y se va al recuadro donde se escribe. */
    var barraCaja = window.GuiasColumnas ? GuiasColumnas.cajaDeBarra(GuiasBarra.html()) : null;
    if (barraCaja) barraCaja.classList.add('ap-campo', 'ap-explicacion');
    function colocarBarra() {
      if (!barraCaja) return;
      var sel = plegado.elegido();
      var cuerpo = sel && sel.querySelector(':scope > .paso-cuerpo');
      if (cuerpo) cuerpo.insertAdjacentElement('beforebegin', barraCaja);
      else if (barraCaja.parentNode) barraCaja.parentNode.removeChild(barraCaja);
    }

    /* Fila 175, punto 7: si algún hito tiene días de plazo escritos
       pero ningún «desde» elegido, «Guardar» no cierra el cuadro (los
       días se perderían sin que nadie se entere, ver recoger() más
       abajo): avisa, abre ese hito y pone el foco en su «desde». */
    (function () {
      var aceptar = $('cuadro-aceptar');
      var cerrarDeVerdad = aceptar.onclick;
      aceptar.onclick = function () {
        var falta = pasoConDiasSinDesde();
        if (!falta) { cerrarDeVerdad(); return; }
        U.aviso('El hito «' + falta.titulo + '» tiene días de plazo, pero no dice desde cuándo. ' +
          'Elige "desde" o borra los días.', 'malo');
        plegado.abrir(falta.caja.dataset.pasoId);
        plegado.aplicar();
        if (falta.caja.scrollIntoView) falta.caja.scrollIntoView({ block: 'nearest' });
        falta.desdeSel.focus();
      };
    })();

    if (window.GuiasBiblioteca) {
      GuiasBiblioteca.engancharPanelTraer(cuadro, $('guia-traer-biblioteca'), function (elegido) {
        recoger();
        /* Fila 417: una copia suelta (id nuevo, sin vínculo con el original). */
        nivel.push(GuiasBiblioteca.pasoDeElegido(elegido, nivel.length ? nivel[nivel.length - 1].id : ''));
        plegado.abrir(nivel[nivel.length - 1].id);   /* fila 122: sale abierto */
        pintar();
        plegado.alTitulo(nivel[nivel.length - 1].id);
      }, nombreTipo);
    }

    if (barraCaja) $('guia-col-der').insertBefore(barraCaja, $('guia-pasos'));   /* para que enganchar() encuentre sus botones */
    GuiasBarra.enganchar();

    /* ---------- responsable, estado y plazo por defecto (sección 11) ----------

       "Desde qué hito" solo puede ser OTRO hito del mismo nivel (el
       que se está viendo: la guía entera o los hitos de una opción,
       fila 95). Se reconstruye en cada pintado, con los hitos tal y
       como están en ese momento. */
    function pasoExtraHTML(p, i) {
      var otros = nivel.filter(function (x, k) { return k !== i; });
      /* Fila 463, A4: todo en una fila (baja a dos si no cabe), cada cosa con su rótulo. */
      return '<div class="paso-extra">' +
        '<div class="paso-extra-cuerpo">' +
          '<label class="dato dato-responsable"><span class="etiqueta">Responsable</span>' +
          '<select class="campo paso-responsable"><option value="">(sin responsable)</option>' +
          opcionesResp.map(function (r) {
            return '<option value="' + U.escapar(r.id) + '"' + (r.id === p.responsable ? ' selected' : '') +
              '>' + U.escapar(r.nombre) + '</option>';
          }).join('') + (window.ResponsableOrganismo ? ResponsableOrganismo.opcionesExtra(p) : '') + '</select></label>' +
          /* Fila 129: a quién le toca este hito (js/guias-toca.js); siempre a la vista (fila 463). */
          (window.GuiasToca ? '<div class="dato paso-toca-bloque">' + GuiasToca.html(p, opcionesResp) + '</div>' : '') +
          '<div class="paso-plazo-fila">' +
            '<label class="dato dato-plazo-dias"><span class="etiqueta">Plazo (días)</span>' +
            '<input type="number" min="1" class="campo paso-plazo-dias" placeholder="' +
            (p.plazo && p.plazo.cuenta === 'meses' ? 'meses' : 'días') + '" value="' +
            (p.plazo ? p.plazo.dias : '') + '"></label>' +
            (window.GuiasPlazo ? '<label class="dato dato-cuenta"><span class="etiqueta">Cómo se cuentan</span>' + GuiasPlazo.html(p) + '</label>' : '') +   /* fila 131 */
            (opciones && opciones.esModelo
              /* Fila 284: un modelo de la biblioteca no dice desde qué hito; cada guía lo decide al traerlo. */
              ? '<span class="suave paso-plazo-desde-fijo">desde que se termine el hito de arriba, en cada guía</span>'
              : '<label class="dato dato-desde"><span class="etiqueta">Desde</span>' +
                '<select class="campo paso-plazo-desde"><option value="">(sin plazo)</option>' +
                otros.map(function (o) {
                  return '<option value="' + U.escapar(o.id) + '"' +
                    (p.plazo && p.plazo.desde === o.id ? ' selected' : '') + '>' +
                    U.escapar(o.titulo || 'Hito sin título') + '</option>';
                }).join('') + '</select></label>') +
          '</div>' +
        '</div>' +
      '</div>';
    }

    /* ---------- la lista de hitos ---------- */

    /* Fila 175, punto 7: el mismo criterio que recoger() (más abajo)
       para saber si un hito se va a quedar sin plazo por no tener
       «desde», pero ANTES de recoger() (que lo perdería sin avisar).
       Solo mira el nivel que se está viendo: los demás ya pasaron por
       este mismo aviso al salir de él (GuiasNiveles llama a recoger()
       al cambiar de nivel). */
    function pasoConDiasSinDesde() {
      var cajas = Array.prototype.slice.call($('guia-pasos').children);
      for (var k = 0; k < cajas.length; k++) {
        var caja = cajas[k];
        var i = parseInt(caja.dataset.pos, 10);
        if (isNaN(i) || !nivel[i]) continue;
        var diasInp = caja.querySelector(':scope > .paso-extra .paso-plazo-dias');
        var desdeSel = caja.querySelector(':scope > .paso-extra .paso-plazo-desde');
        var dias = diasInp ? parseInt(diasInp.value, 10) : NaN;
        if (!isNaN(dias) && dias > 0 && desdeSel && !desdeSel.value) {
          var tituloEl = caja.querySelector(':scope > .paso-cabecera .paso-titulo');
          return { caja: caja, desdeSel: desdeSel, titulo: (tituloEl && tituloEl.value.trim()) || 'Hito sin título' };
        }
      }
      return null;
    }

    /* Se lee todo lo escrito antes de repintar o de guardar. Ojo con los
       selectores: los recuadros de las opciones están DENTRO del de su
       hito, así que hay que pedir solo los hijos directos (`:scope >`).
       Sin eso, el hito se leería a sí mismo y a sus opciones a la vez.

       Los identificadores viajan en el `data-id` del propio recuadro,
       no por su posición: si no, al mover o quitar una opción se
       perdería lo que ya estuviera marcado en un asunto. */
    function recoger() {
      Array.prototype.forEach.call($('guia-pasos').children, function (caja) {
        var i = parseInt(caja.dataset.pos, 10);
        if (isNaN(i) || !nivel[i]) return;
        nivel[i].titulo = caja.querySelector(':scope > .paso-cabecera .paso-titulo').value.trim();
        nivel[i].cuerpo = G.limpiar(caja.querySelector(':scope > .paso-cuerpo').innerHTML);

        /* Los tres campos nuevos (16-sep-2026, hitos), siempre en los
           mismos hijos directos, se lean o no lean las opciones. */
        var respSel = caja.querySelector(':scope > .paso-extra .paso-responsable');
        nivel[i].responsable = respSel ? respSel.value : '';
        if (window.GuiasToca) GuiasToca.leer(caja, nivel[i]);   /* fila 129 */
        var diasInp = caja.querySelector(':scope > .paso-extra .paso-plazo-dias');
        var desdeSel = caja.querySelector(':scope > .paso-extra .paso-plazo-desde');
        var dias = diasInp ? parseInt(diasInp.value, 10) : NaN;
        var desdeValor = desdeSel ? desdeSel.value : ((opciones && opciones.esModelo) ? '-' : '');
        nivel[i].plazo = (!isNaN(dias) && dias > 0 && desdeValor)
          ? { dias: dias, desde: desdeSel ? desdeSel.value : '', cuenta: window.GuiasPlazo ? GuiasPlazo.leer(caja) : 'habiles' } : null;

        /* "Lo que hay que reunir" (18-sep-2026, fila 59): solo en los
           hitos que no son pregunta (ver pintar()), así que un hito que
           SÍ lo sea se queda con lo que ya tuviera (vacío, si nunca lo
           tuvo). */
        if (window.GuiasRequisitos && caja.querySelector(':scope > .paso-requisitos')) {
          nivel[i].requisitos = GuiasRequisitos.leer(caja);
        }

        if (window.GuiasGuion && caja.querySelector(':scope > .paso-guion')) nivel[i].guion = GuiasGuion.leer(caja);   /* fila 109 */

        /* "Solo informativo" y "Normativa" (20-sep-2026, fila 79): igual,
           solo en los hitos que no son pregunta. */
        var soloInfEl = caja.querySelector(':scope > .paso-solo-informativo-fila .paso-solo-informativo');
        if (soloInfEl) nivel[i].soloInformativo = soloInfEl.checked;
        var variosEl = caja.querySelector(':scope > .paso-varios-documentos-fila .paso-varios-documentos');   /* fila 414 */
        if (variosEl) nivel[i].variosDocumentos = variosEl.checked;
        /* «Avisar a quien lo pide» (fila 195). */
        var avisoLoPideEl = caja.querySelector(':scope > .paso-avisar-lopide-fila .paso-avisar-lopide');
        if (avisoLoPideEl) {
          nivel[i].avisarLoPide = avisoLoPideEl.checked;
          var avisoSelEl = caja.querySelector(':scope > .paso-avisar-lopide-plantilla .paso-avisar-lopide-select');
          nivel[i].avisarLoPidePlantilla = avisoSelEl ? avisoSelEl.value : '';
        }
        /* «Texto para los documentos de este hito» y «Tipo de documento
           que suele salir de aquí» (fila 201): igual, solo en los hitos
           que no son pregunta. */
        var textoDocEl = caja.querySelector(':scope > .paso-texto-documentos-fila .paso-texto-documentos');
        if (textoDocEl) nivel[i].textoDocumentos = textoDocEl.value.trim();
        var tipoDocEl = caja.querySelector(':scope > .paso-texto-documentos-fila .paso-tipo-documento');
        if (tipoDocEl) nivel[i].tipoDocumento = tipoDocEl.value;
        if (window.HitosNormativa && caja.querySelector(':scope > .paso-normativa')) {
          nivel[i].normativa = HitosNormativa.leer(caja);
        }
        /* Formularios oficiales (20-sep-2026, fila 82): el editor vive
           DENTRO del mismo `<details>` de normativa. */
        if (window.Formularios && caja.querySelector(':scope > .paso-normativa .formularios-editor')) {
          nivel[i].formularios = Formularios.leerEditor(
            caja.querySelector(':scope > .paso-normativa .formularios-editor'));
        }

        var marca = caja.querySelector(':scope > .paso-es-pregunta-fila .paso-es-pregunta');
        if (!marca || !marca.checked) { nivel[i].opciones = []; return; }

        /* Se actualizan los objetos que ya había (por su id), sin
           rehacerlos: un hito de una opción puede llevar más cosas de
           las que se ven aquí (su plazo, sus propias opciones si es una
           pregunta de dentro, fila 95), y rehacerlo las perdería. */
        var viejas = nivel[i].opciones || [];
        nivel[i].opciones = Array.prototype.slice.call(
          caja.querySelectorAll(':scope > .paso-opciones > .opcion-editor')
        ).map(function (oc) {
          var o = viejas.filter(function (x) { return x.id === oc.dataset.id; })[0] ||
            { id: oc.dataset.id || G.nuevoId(), titulo: '', pasos: [] };
          o.titulo = oc.querySelector(':scope > .opcion-cabecera > .opcion-titulo').value.trim();
          var viejos = o.pasos || [];
          o.pasos = Array.prototype.slice.call(
            oc.querySelectorAll(':scope > .opcion-pasos > .subpaso-editor')
          ).map(function (sc) {
            var sp = viejos.filter(function (x) { return x.id === sc.dataset.id; })[0] || subpasoNuevo(sc.dataset.id);
            sp.titulo = sc.querySelector(':scope > .paso-cabecera .subpaso-titulo').value.trim();
            var cuerpoEl = sc.querySelector(':scope > .subpaso-cuerpo');
            if (cuerpoEl) sp.cuerpo = G.limpiar(cuerpoEl.innerHTML);
            if (window.GuiasRequisitos && sc.querySelector(':scope > .paso-requisitos')) sp.requisitos = GuiasRequisitos.leer(sc);
            if (window.GuiasGuion && sc.querySelector(':scope > .paso-guion')) sp.guion = GuiasGuion.leer(sc);   /* fila 109 */
            var esPreg = sc.querySelector(':scope > .paso-es-pregunta-fila .subpaso-es-pregunta');
            if (esPreg && !esPreg.checked) sp.opciones = [];
            return sp;
          });
          return o;
        });
      });
    }

    function subpasoNuevo(id) {
      return { id: id || G.nuevoId(), titulo: '', cuerpo: '', opciones: [], requisitos: [], comunicacion: null };
    }

    /* ---------- entrar y salir de una pregunta de dentro (fila 95) ----------
       En js/guias-niveles.js desde la fila 113. */
    var niveles = GuiasNiveles.crear({ pasos: pasos, nombreTipo: nombreTipo, recoger: recoger, pintar: pintar,
      alCambiar: function (lista) { nivel = lista; abiertos = {}; plegado.alCambiarDeNivel(); } });
    var entrar = niveles.entrar, pintarCamino = niveles.pintarCamino;

    /* Qué secciones plegables estaban abiertas antes de repintar (fila 60):
       desde la fila 133, en js/guias-paso-bloques.js. */
    var detallesAbiertos = GuiasPasoBloques.detallesAbiertos;
    var restaurarAbierto = GuiasPasoBloques.restaurarAbierto;

    function pintar() {
      var caja = $('guia-pasos');
      abiertos = detallesAbiertos(caja);
      if (barraCaja && barraCaja.parentNode) barraCaja.parentNode.removeChild(barraCaja);   /* que no se vaya con el repintado */
      caja.innerHTML = '';
      GuiasBarra.reiniciar();
      pintarCamino();
      if (!nivel.length) {
        plegado.aplicar();   /* fila 463: la columna derecha dice «Añade el primer hito» */
        return;
      }
      nivel.forEach(function (p, i) {
        var d = document.createElement('div');
        d.className = 'paso-editor';
        d.dataset.pos = i;
        d.dataset.pasoId = p.id;   /* fila 122, js/guias-plegado.js */
        d.innerHTML =
          '<div class="paso-cabecera">' +
            '<span class="paso-numero">' + (i + 1) + '</span>' +
            '<label class="dato dato-titulo"><span class="etiqueta">Título del hito</span>' +
            '<input class="campo paso-titulo" value="' + U.escapar(p.titulo) + '" ' +
            'placeholder="Título corto del hito"></label>' +
          '</div>' +
          '<div class="paso-cuerpo" contenteditable="true" ' +
          'data-vacio="Explicación del hito">' + G.limpiar(p.cuerpo) + '</div>';

        var mandos = document.createElement('div');
        mandos.className = 'paso-mandos';

        function boton(texto, titulo, hacer, clase) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'boton' + (clase ? ' ' + clase : '');
          b.textContent = texto;
          b.title = titulo;
          b.onclick = hacer;
          mandos.appendChild(b);
          return b;
        }

        boton('↑', 'Subir este hito', function () {
          recoger();
          if (i === 0) return;
          var x = nivel[i - 1]; nivel[i - 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i - 1].id);   /* fila 122: abierto o cerrado, como estaba */
        }).disabled = (i === 0);

        boton('↓', 'Bajar este hito', function () {
          recoger();
          if (i === nivel.length - 1) return;
          var x = nivel[i + 1]; nivel[i + 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i + 1].id);
        }).disabled = (i === nivel.length - 1);

        boton('Quitar', 'Quitar este hito', function () {
          recoger();
          nivel.splice(i, 1);
          pintar();
        }, 'boton-peligro');

        d.querySelector('.paso-cabecera').appendChild(mandos);

        var cuerpo = d.querySelector('.paso-cuerpo');
        prepararRecuadro(cuerpo);

        d.insertAdjacentHTML('beforeend', pasoExtraHTML(p, i));

        var pregunta = G.esPregunta(p);
        /* Los bloques de dentro de un hito que no es pregunta (fila 133:
           en js/guias-paso-bloques.js, con el mismo contexto que las opciones). */
        GuiasPasoBloques.anadir(d, p, i, pregunta, opcionesCtx);

        /* ---- la casilla de "esto es una pregunta" ---- */
        var fila = document.createElement('label');
        fila.className = 'interruptor paso-es-pregunta-fila';
        fila.innerHTML = '<input type="checkbox" class="paso-es-pregunta"' +
          (pregunta ? ' checked' : '') + '>' +
          '<span>Este hito es una pregunta: el trámite sigue por un camino o por otro</span>';
        d.appendChild(fila);

        fila.querySelector('.paso-es-pregunta').onchange = function () {
          recoger();
          if (this.checked && !nivel[i].opciones.length) {
            nivel[i].opciones = [
              { id: G.nuevoId(), titulo: '', pasos: [] },
              { id: G.nuevoId(), titulo: '', pasos: [] }
            ];
          }
          pintar();
        };

        if (pregunta) d.appendChild(GuiasOpcionesEditor.caja(opcionesCtx, p, i));

        /* Fila 463: datos, tareas y apartados con título, en su orden. */
        if (window.GuiasColumnas) GuiasColumnas.montar(d, p, { sub: false });

        caja.appendChild(d);
      });
      plegado.aplicar();   /* fila 122: el hito elegido sigue elegido tras repintar */
    }

    /* Al pegar desde Word o desde una web, solo el texto: así no se
       cuela el formato de fuera. */
    function prepararRecuadro(cuerpo) {
      cuerpo.onfocus = function () {
        GuiasBarra.escribiendoEn(cuerpo);
        /* Fila 463: la barra, justo encima del recuadro donde se escribe. */
        if (barraCaja && barraCaja.nextElementSibling !== cuerpo) cuerpo.insertAdjacentElement('beforebegin', barraCaja);
      };
      cuerpo.onpaste = function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t);
      };
    }

    $('guia-anadir').onclick = function () {
      recoger();
      var nuevo = { id: G.nuevoId(), titulo: '', cuerpo: '', opciones: [] };
      nivel.push(nuevo);
      plegado.abrir(nuevo.id);   /* fila 122: el nuevo, abierto; los demás, cerrados */
      pintar();
      plegado.alTitulo(nuevo.id);
    };

    plegado.enganchar();
    pintar();
    /* El mapa (fila 113): panel dentro del mismo cuadro, dibujado con lo
       que hay en pantalla; pulsar un hito lleva a él. */
    if (window.GuiasMapa && $('guia-ver-mapa')) {
      $('guia-ver-mapa').onclick = function () {
        recoger();
        GuiasMapa.pintarEnPanel($('guia-mapa-panel'), pasos, irAPaso);
      };
    }
    /* Desde el mapa, el hito al que se va sale abierto (fila 122). */
    function irAPaso(id) {
      plegado.abrirAlLlegar(id);
      var ok = niveles.irAPaso(id);
      plegado.abrirAlLlegar(null);
      return ok;
    }
    if (opciones && opciones.irA) irAPaso(opciones.irA);

    return esperar.then(async function (ok) {
      if (ok) recoger();
      cuadro.classList.remove('cuadro-guia');
      GuiasBarra.reiniciar();
      if (!ok) return null;
      return G.normalizar(pasos);
    });
    }   /* fin de abrirCuadro() */
  }

  Object.assign(G, {
    editar: editar
  });
})();
