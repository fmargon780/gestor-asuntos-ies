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

     Un recuadro por paso, y una sola barra de formato arriba que
     actúa sobre el recuadro en el que se está escribiendo (desde la
     fila 122, en js/guias-barra.js).
     ========================================================== */

  /* 'listaResponsables' es [{id,nombre}], personas de Ajustes más los
     papeles fijos; 'listaEstados' es una lista de nombres de
     estados.json. Las dos son opcionales: sin ellas, los desplegables
     salen vacíos, pero el resto del cuadro funciona igual (una guía
     vieja no tiene por qué dejar de escribirse). */
  /* `opciones.irA` (fila 113): el id de un paso; el cuadro se abre ya en
     su nivel y con él desplegado (lo usa el mapa, js/guias-mapa.js). */
  function editar(nombreTipo, lista, listaResponsables, listaEstados, opciones) {
    var pasos = G.normalizar(lista);
    /* Fila 95 (docs/PREGUNTAS-DENTRO-DE-LAS-RESPUESTAS.md): el nivel que
       se ve (la guía entera, o los pasos de una opción de una pregunta
       de dentro) y el camino hasta él, como carpetas. Todo lo que
       pinta, recoge o añade trabaja sobre `nivel`; guardar, sobre
       `pasos`, la guía entera, esté donde esté Francisco. Cada paso del
       camino es { pregunta, opcion, lista } (lista: los pasos de esa
       opción, el mismo array que hay dentro del árbol). */
    var nivel = pasos;
    var opcionesResp = listaResponsables || [];
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');
    GuiasBarra.reiniciar();
    /* Qué `<details>` estaban abiertos antes del último pintar(): lo lee
       `restaurarAbierto`, más abajo, y lo usan tanto `pintar()` como
       `GuiasOpcionesEditor.caja()` (fila 60, ver la nota junto a detallesAbiertos). */
    var abiertos = {};
    /* El acordeón (fila 122, js/guias-plegado.js): un solo paso abierto. */
    var plegado = GuiasPlegado.crear({ nivel: function () { return nivel; }, recoger: recoger, responsables: opcionesResp });
    /* Lo que la caja de opciones (js/guias-opciones-editor.js) toma prestado. */
    var opcionesCtx = {
      nivel: function () { return nivel; }, recoger: recoger, pintar: pintar,
      entrar: function (p, op) { entrar(p, op); }, prepararRecuadro: prepararRecuadro,
      restaurar: function (det, pos, idSub) { restaurarAbierto(det, abiertos, pos, idSub); }, plegado: plegado
    };

    var esperar = U.preguntar('Guía de ' + nombreTipo,
      '<p class="explica">Los pasos que hay que dar en un asunto de este tipo, en el orden ' +
      'del trámite. En cada asunto, cada paso es un hito, con sus tareas, sus documentos y ' +
      'su plazo.</p>' +
      '<div id="guia-camino" class="guia-camino"></div>' +
      GuiasBarra.html() +
      '<div id="guia-pasos"></div>' +
      '<div class="guia-anadir-fila">' +
        '<button type="button" class="boton boton-ancho" id="guia-anadir">Añadir un paso</button>' +
        (window.GuiasMapa ? '<button type="button" class="boton boton-ancho" id="guia-ver-mapa">Ver mapa</button>' : '') +
        (window.GuiasBiblioteca
          ? '<button type="button" class="boton boton-ancho" id="guia-traer-biblioteca">+ Traer de la biblioteca</button>' +
            GuiasBiblioteca.panelTraerHTML()
          : '') +
      '</div>' +
      (window.GuiasMapa ? GuiasMapa.panelHTML() : ''),
      'Guardar');

    /* Fila 175, punto 7: si algún paso tiene días de plazo escritos
       pero ningún «desde» elegido, «Guardar» no cierra el cuadro (los
       días se perderían sin que nadie se entere, ver recoger() más
       abajo): avisa, abre ese paso y pone el foco en su «desde». */
    (function () {
      var aceptar = $('cuadro-aceptar');
      var cerrarDeVerdad = aceptar.onclick;
      aceptar.onclick = function () {
        var falta = pasoConDiasSinDesde();
        if (!falta) { cerrarDeVerdad(); return; }
        U.aviso('El paso «' + falta.titulo + '» tiene días de plazo, pero no dice desde cuándo. ' +
          'Elige "desde" o borra los días.', 'malo');
        plegado.abrir(falta.caja.dataset.pasoId);
        plegado.aplicar();
        var detalles = falta.caja.querySelector(':scope > .paso-extra');
        if (detalles) detalles.open = true;
        if (falta.caja.scrollIntoView) falta.caja.scrollIntoView({ block: 'nearest' });
        falta.desdeSel.focus();
      };
    })();

    if (window.GuiasBiblioteca) {
      GuiasBiblioteca.engancharPanelTraer(cuadro, $('guia-traer-biblioteca'), function (modelo) {
        recoger();
        nivel.push(HitosBiblioteca.modeloAPaso(modelo));
        plegado.abrir(nivel[nivel.length - 1].id);   /* fila 122: sale abierto */
        pintar();
        plegado.alTitulo(nivel[nivel.length - 1].id);
      });
    }

    GuiasBarra.enganchar();

    /* ---------- responsable, estado y plazo por defecto (sección 11) ----------

       "Desde qué paso" solo puede ser OTRO paso del mismo nivel (el
       que se está viendo: la guía entera o los pasos de una opción,
       fila 95). Se reconstruye en cada pintado, con los pasos tal y
       como están en ese momento. */
    function pasoExtraHTML(p, i) {
      var otros = nivel.filter(function (x, k) { return k !== i; });
      return '<details class="paso-extra">' +
        '<summary>Responsable, a quién le toca y plazo <span class="suave">(opcional)</span></summary>' +
        '<div class="paso-extra-cuerpo">' +
          '<label class="etiqueta">Responsable por defecto</label>' +
          '<select class="campo paso-responsable"><option value="">(sin responsable)</option>' +
          opcionesResp.map(function (r) {
            return '<option value="' + U.escapar(r.id) + '"' + (r.id === p.responsable ? ' selected' : '') +
              '>' + U.escapar(r.nombre) + '</option>';
          }).join('') + '</select>' +
          /* Fila 129: a quién le toca este paso (js/guias-toca.js). */
          (window.GuiasToca ? GuiasToca.html(p, opcionesResp) : '') +
          '<label class="etiqueta">Plazo</label>' +
          '<div class="paso-plazo-fila">' +
            '<input type="number" min="1" class="campo paso-plazo-dias" placeholder="días" value="' +
            (p.plazo ? p.plazo.dias : '') + '">' +
            (window.GuiasPlazo ? GuiasPlazo.html(p) : '<span class="suave">días</span>') +   /* fila 131 */
            '<span class="suave">desde</span>' +
            '<select class="campo paso-plazo-desde"><option value="">(sin plazo)</option>' +
            otros.map(function (o) {
              return '<option value="' + U.escapar(o.id) + '"' +
                (p.plazo && p.plazo.desde === o.id ? ' selected' : '') + '>' +
                U.escapar(o.titulo || 'Paso sin título') + '</option>';
            }).join('') + '</select>' +
          '</div>' +
        '</div>' +
      '</details>';
    }

    /* ---------- la lista de pasos ---------- */

    /* Fila 175, punto 7: el mismo criterio que recoger() (más abajo)
       para saber si un paso se va a quedar sin plazo por no tener
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
          return { caja: caja, desdeSel: desdeSel, titulo: (tituloEl && tituloEl.value.trim()) || 'Paso sin título' };
        }
      }
      return null;
    }

    /* Se lee todo lo escrito antes de repintar o de guardar. Ojo con los
       selectores: los recuadros de las opciones están DENTRO del de su
       paso, así que hay que pedir solo los hijos directos (`:scope >`).
       Sin eso, el paso se leería a sí mismo y a sus opciones a la vez.

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
        nivel[i].plazo = (!isNaN(dias) && dias > 0 && desdeSel && desdeSel.value)
          ? { dias: dias, desde: desdeSel.value, cuenta: window.GuiasPlazo ? GuiasPlazo.leer(caja) : 'habiles' } : null;

        /* "Lo que hay que reunir" (18-sep-2026, fila 59): solo en los
           pasos que no son pregunta (ver pintar()), así que un paso que
           SÍ lo sea se queda con lo que ya tuviera (vacío, si nunca lo
           tuvo). */
        if (window.GuiasRequisitos && caja.querySelector(':scope > .paso-requisitos')) {
          nivel[i].requisitos = GuiasRequisitos.leer(caja);
        }

        /* "Comunicación de este paso" (18-sep-2026, fila 60): mismo
           criterio que arriba, solo en los pasos que no son pregunta. */
        if (window.GuiasComunicacion && caja.querySelector(':scope > .paso-comunicacion')) {
          nivel[i].comunicacion = GuiasComunicacion.leer(caja, nivel[i].id);
        }
        if (window.GuiasDocumentos && caja.querySelector(':scope > .paso-documentos')) {
          nivel[i].plantillasDocumento = GuiasDocumentos.leer(caja);   /* fila 102 */
        }
        if (window.GuiasGuion && caja.querySelector(':scope > .paso-guion')) nivel[i].guion = GuiasGuion.leer(caja);   /* fila 109 */

        /* "Solo informativo" y "Normativa" (20-sep-2026, fila 79): igual,
           solo en los pasos que no son pregunta. */
        var soloInfEl = caja.querySelector(':scope > .paso-solo-informativo-fila .paso-solo-informativo');
        if (soloInfEl) nivel[i].soloInformativo = soloInfEl.checked;
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
           rehacerlos: un paso de una opción puede llevar más cosas de
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
            sp.titulo = sc.querySelector(':scope > .paso-cabecera > .subpaso-titulo').value.trim();
            var cuerpoEl = sc.querySelector(':scope > .subpaso-cuerpo');
            if (cuerpoEl) sp.cuerpo = G.limpiar(cuerpoEl.innerHTML);
            if (window.GuiasRequisitos && sc.querySelector(':scope > .paso-requisitos')) sp.requisitos = GuiasRequisitos.leer(sc);
            if (window.GuiasComunicacion && sc.querySelector(':scope > .paso-comunicacion')) {
              sp.comunicacion = GuiasComunicacion.leer(sc, sp.id);
            }
            if (window.GuiasDocumentos && sc.querySelector(':scope > .paso-documentos')) {
              sp.plantillasDocumento = GuiasDocumentos.leer(sc);   /* fila 102 */
            }
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
      caja.innerHTML = '';
      GuiasBarra.reiniciar();
      pintarCamino();
      if (!nivel.length) {
        caja.innerHTML = '<div class="vacio">Todavía no hay ningún paso. ' +
                         'Añade el primero aquí abajo.</div>';
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
            '<input class="campo paso-titulo" value="' + U.escapar(p.titulo) + '" ' +
            'placeholder="Título corto del paso">' +
          '</div>' +
          '<div class="paso-cuerpo" contenteditable="true" ' +
          'data-vacio="Explicación del paso">' + G.limpiar(p.cuerpo) + '</div>';

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

        boton('↑', 'Subir este paso', function () {
          recoger();
          if (i === 0) return;
          var x = nivel[i - 1]; nivel[i - 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i - 1].id);   /* fila 122: abierto o cerrado, como estaba */
        }).disabled = (i === 0);

        boton('↓', 'Bajar este paso', function () {
          recoger();
          if (i === nivel.length - 1) return;
          var x = nivel[i + 1]; nivel[i + 1] = nivel[i]; nivel[i] = x;
          pintar();
          plegado.seguir(nivel[i + 1].id);
        }).disabled = (i === nivel.length - 1);

        boton('Quitar', 'Quitar este paso', function () {
          recoger();
          nivel.splice(i, 1);
          pintar();
        }, 'boton-peligro');

        d.querySelector('.paso-cabecera').appendChild(mandos);

        var cuerpo = d.querySelector('.paso-cuerpo');
        prepararRecuadro(cuerpo);

        d.insertAdjacentHTML('beforeend', pasoExtraHTML(p, i));
        restaurarAbierto(d.querySelector(':scope > .paso-extra'), abiertos, i, '');

        var pregunta = G.esPregunta(p);
        /* Los bloques de dentro de un paso que no es pregunta (fila 133:
           en js/guias-paso-bloques.js, con el mismo contexto que las opciones). */
        GuiasPasoBloques.anadir(d, p, i, pregunta, opcionesCtx);

        /* ---- la casilla de "esto es una pregunta" ---- */
        var fila = document.createElement('label');
        fila.className = 'interruptor paso-es-pregunta-fila';
        fila.innerHTML = '<input type="checkbox" class="paso-es-pregunta"' +
          (pregunta ? ' checked' : '') + '>' +
          '<span>Este paso es una pregunta: el trámite sigue por un camino o por otro</span>';
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

        caja.appendChild(d);
      });
      plegado.aplicar();   /* fila 122: el paso abierto sigue abierto tras repintar */
    }

    /* Al pegar desde Word o desde una web, solo el texto: así no se
       cuela el formato de fuera. */
    function prepararRecuadro(cuerpo) {
      cuerpo.onfocus = function () { GuiasBarra.escribiendoEn(cuerpo); };
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
       que hay en pantalla; pulsar un paso lleva a él. */
    if (window.GuiasMapa && $('guia-ver-mapa')) {
      $('guia-ver-mapa').onclick = function () {
        recoger();
        GuiasMapa.pintarEnPanel($('guia-mapa-panel'), pasos, irAPaso);
      };
    }
    /* Desde el mapa, el paso al que se va sale abierto (fila 122). */
    function irAPaso(id) {
      plegado.abrirAlLlegar(id);
      var ok = niveles.irAPaso(id);
      plegado.abrirAlLlegar(null);
      return ok;
    }
    if (opciones && opciones.irA) irAPaso(opciones.irA);

    return esperar.then(async function (ok) {
      if (ok) recoger();
      cuadro.classList.remove('cuadro-medio');
      GuiasBarra.reiniciar();
      if (!ok) return null;
      /* Apartado 4.3: el cuadro de la guía ya está cerrado (U.preguntar
         ha resuelto y ocultado #capa), así que aquí sí se puede volver
         a abrir un cuadro, uno por cada paso cambiado. */
      if (window.GuiasBiblioteca) {
        try { await GuiasBiblioteca.revisarAlGuardar(pasos); } catch (e) { /* no crítico: se guarda igual */ }
      }
      return G.normalizar(pasos);
    });
  }

  Object.assign(G, {
    editar: editar
  });
})();
