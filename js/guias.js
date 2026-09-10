/* ============================================================
   guias.js — la guía del procedimiento de cada tipo de asunto.

   Cada tipo de asunto (MATRICULA, COMPRA, SANCION...) puede llevar
   una lista de pasos. Cada paso tiene un título corto y una
   explicación debajo, con negrita, viñetas y enlaces.

   Un paso puede ser además una PREGUNTA con opciones: se elige una y
   el trámite sigue por los pasos de esa opción.

   Los pasos van en el orden del trámite, como los estados: se suben
   y se bajan con las flechas.

   Se guardan en _GESTOR/guias.json, dentro de la carpeta de asuntos
   abiertos, así que los ve todo el que abra la aplicación.

   En cada asunto abierto la guía se enseña con casillas, para ir
   marcando lo que ya está hecho. Lo marcado y lo elegido se guardan en
   la ficha del asunto, en asuntos.json.
   ============================================================ */
var Guias = (function () {

  function $(id) { return document.getElementById(id); }

  function nuevoId() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  }

  /* ==========================================================
     LIMPIEZA DEL TEXTO CON FORMATO

     El cuerpo de un paso se escribe en un recuadro con formato, y
     se guarda como HTML en un fichero compartido. Antes de guardarlo
     y antes de enseñarlo se pasa por aquí: solo sobreviven las
     etiquetas de la lista, y de los enlaces solo los que llevan a
     una página web o a un correo. Todo lo demás se queda en texto.
     ========================================================== */

  var PERMITIDAS = {
    B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u',
    UL: 'ul', OL: 'ol', LI: 'li', BR: 'br', P: 'p', DIV: 'div', A: 'a'
  };

  function copiarNodos(origen, destino) {
    var hijos = origen.childNodes;
    for (var i = 0; i < hijos.length; i++) {
      var n = hijos[i];
      if (n.nodeType === 3) {
        destino.appendChild(document.createTextNode(n.nodeValue));
        continue;
      }
      if (n.nodeType !== 1) continue;

      var nueva = PERMITIDAS[n.tagName.toUpperCase()];
      if (!nueva) { copiarNodos(n, destino); continue; }

      if (nueva === 'a') {
        var href = n.getAttribute('href') || '';
        if (!/^(https?:\/\/|mailto:)/i.test(href)) { copiarNodos(n, destino); continue; }
        var enlace = document.createElement('a');
        enlace.setAttribute('href', href);
        enlace.setAttribute('target', '_blank');
        enlace.setAttribute('rel', 'noopener noreferrer');
        copiarNodos(n, enlace);
        destino.appendChild(enlace);
        continue;
      }

      var el = document.createElement(nueva);
      copiarNodos(n, el);
      destino.appendChild(el);
    }
  }

  function limpiar(html) {
    var doc = new DOMParser().parseFromString(
      '<div id="raiz">' + String(html === null || html === undefined ? '' : html) + '</div>',
      'text/html');
    var raiz = doc.getElementById('raiz');
    var destino = document.createElement('div');
    if (raiz) copiarNodos(raiz, destino);
    return destino.innerHTML;
  }

  /* ¿Este cuerpo dice algo, o son etiquetas vacías? */
  function tieneTexto(html) {
    var d = document.createElement('div');
    d.innerHTML = limpiar(html);
    if (d.querySelector('a')) return true;
    return d.textContent.replace(/\s+/g, '') !== '';
  }

  /* Los pasos, tal y como se guardan: id, título, cuerpo y, si el paso
     es una pregunta, sus opciones.

     Una PREGUNTA es un paso con `opciones`. Cada opción tiene su nombre
     y su propia lista de pasos. Al elegir una dentro de un asunto solo
     salen los pasos de esa opción; los de la otra ni se ven. Ejemplo
     suyo: "¿Cómo hemos recibido la factura?" → en mano (sello, firma,
     entregar a Fátima) o digitalmente (a la firma del director).

     Las opciones no llevan opciones dentro: una bifurcación por paso
     es lo que se entiende de un vistazo. */
  function normalizarOpciones(lista) {
    return (lista || []).map(function (o) {
      return {
        id: (o && o.id) || nuevoId(),
        titulo: String((o && o.titulo) || ''),
        pasos: normalizar((o && o.pasos) || []).map(function (sp) {
          return { id: sp.id, titulo: sp.titulo, cuerpo: sp.cuerpo, opciones: [] };
        })
      };
    }).filter(function (o) { return o.titulo || o.pasos.length; });
  }

  function normalizar(lista) {
    return (lista || []).map(function (p) {
      if (typeof p === 'string') {
        return { id: nuevoId(), titulo: p, cuerpo: '', opciones: [] };
      }
      return {
        id: (p && p.id) || nuevoId(),
        titulo: String((p && p.titulo) || ''),
        cuerpo: limpiar((p && p.cuerpo) || ''),
        opciones: normalizarOpciones(p && p.opciones)
      };
    }).filter(function (p) {
      return p.titulo || tieneTexto(p.cuerpo) || p.opciones.length;
    });
  }

  function esPregunta(p) { return !!(p && p.opciones && p.opciones.length); }

  function cuantos(lista) { return (lista || []).length; }

  /* ==========================================================
     ENSEÑAR LA GUÍA
     ========================================================== */

  /* La guía en modo lectura. Sin casillas sirve de recordatorio
     (por ejemplo, al crear el asunto); con casillas, de lista de
     control dentro del asunto. */
  function vista(lista, hechos, conCasillas, elegidas) {
    var pasos = normalizar(lista);
    if (!pasos.length) return '';
    var marcados = hechos || [];
    var elegido = elegidas || {};
    return '<ol class="guia-lectura">' + pasos.map(function (p, i) {
      return unPaso(p, i, marcados, elegido, conCasillas);
    }).join('') + '</ol>';
  }

  function unPaso(p, i, marcados, elegidas, conCasillas) {
    var pregunta = esPregunta(p);
    var cual = pregunta ? String(elegidas[p.id] || '') : '';
    /* Una pregunta cuenta como hecha en cuanto se elige una opción. */
    var hecho = pregunta ? !!cual : marcados.indexOf(p.id) !== -1;
    var conCuerpo = tieneTexto(p.cuerpo);

    var control;
    if (!conCasillas) control = '<span class="paso-numero">' + (i + 1) + '</span>';
    else if (pregunta) control = '<span class="paso-numero paso-marca-pregunta">?</span>';
    else control = '<input type="checkbox" class="paso-casilla" data-paso="' +
                   U.escapar(p.id) + '"' + (hecho ? ' checked' : '') + '>';

    /* Un paso marcado se pliega y se queda solo con su título tachado:
       con cuatro pasos explicados, la guía se comía la pantalla. El
       botoncito de la esquina lo vuelve a abrir para releerlo. Solo
       tiene sentido donde hay casillas, que es dentro de un asunto.
       En una pregunta no se pliega: hay que seguir viendo qué se
       preguntaba. */
    var verlo = (conCasillas && conCuerpo && !pregunta)
      ? '<button type="button" class="paso-ver" ' +
        'title="Ver o esconder la explicación de este paso">ver</button>'
      : '';

    var titulo = '<span class="paso-titulo-texto">' +
                 U.escapar(p.titulo || 'Paso ' + (i + 1)) + '</span>';
    /* La pregunta no lleva <label>: no hay casilla que marcar, y con
       label el clic en el título no haría nada. */
    var cabecera = pregunta
      ? '<div class="paso-linea">' + control + titulo + '</div>'
      : '<label class="paso-linea">' + control + titulo + '</label>';

    var ramas = '';
    if (pregunta) {
      /* Los botones de elegir, y debajo TODAS las ramas ya pintadas.
         Solo se ve la elegida: así elegir es enseñar y esconder, sin
         volver a pintar nada y sin perder lo que ya estuviera marcado
         en la otra rama. */
      ramas =
        '<div class="guia-opciones">' + p.opciones.map(function (o) {
          return '<button type="button" class="guia-opcion' +
                 (o.id === cual ? ' elegida' : '') + '" data-paso="' + U.escapar(p.id) +
                 '" data-opcion="' + U.escapar(o.id) + '">' +
                 U.escapar(o.titulo || 'Opción') + '</button>';
        }).join('') +
        /* El aviso se pinta siempre y se enseña o se esconde: si solo se
           pintara al haber respuesta, no aparecería al responder, que es
           justo cuando hace falta. */
        (conCasillas
          ? '<span class="guia-opcion-nota' + (cual ? '' : ' oculto') +
            '">Vuelve a pulsarla para cambiar la respuesta.</span>'
          : '') +
        '</div>' +
        '<div class="guia-ramas">' + p.opciones.map(function (o) {
          var dentro = o.pasos.length
            ? vista(o.pasos, marcados, conCasillas, elegidas)
            : '<p class="explica">Con elegir esta opción basta: no hay más pasos.</p>';
          return '<div class="guia-rama' + (o.id === cual ? ' rama-activa' : '') +
                 '" data-opcion="' + U.escapar(o.id) + '">' + dentro + '</div>';
        }).join('') + '</div>';
    }

    return '<li class="paso-lectura' + (hecho ? ' paso-hecho' : '') +
           (pregunta ? ' paso-pregunta' : '') + '">' +
           cabecera + verlo +
           (conCuerpo ? '<div class="paso-cuerpo-texto">' + limpiar(p.cuerpo) + '</div>' : '') +
           ramas +
           '</li>';
  }

  /* Quién se entera de que se ha elegido una opción, para guardarlo en
     la ficha del asunto. Solo hay una guía en pantalla a la vez, así
     que con un solo hueco basta; el cuadro de la guía se guarda el
     anterior y lo devuelve al cerrarse. */
  var alElegirOpcion = null;

  function cuandoSeElige(fn) {
    var antes = alElegirOpcion;
    alElegirOpcion = fn || null;
    return antes;
  }

  /* Los enganches de lo que se pulsa dentro de una guía: plegar un paso
     hecho y elegir una opción. Van una sola vez sobre el documento
     entero, y no en cada sitio que pinta una guía: la guía sale en la
     ficha del asunto y en su propio cuadro, y así los dos se comportan
     igual sin repetir código.

     Con `closest` basta: el clic puede caer en el botón o en algo de
     dentro. */
  function engancharLaGuia() {
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.paso-ver') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      b.textContent = li.classList.toggle('paso-abierto') ? 'esconder' : 'ver';
    });

    /* Elegir una opción de una pregunta. Se apaga la otra rama y se
       enciende la elegida, sin volver a pintar nada. Volver a pulsar la
       que ya estaba elegida deja la pregunta sin responder, que es como
       se cambia de idea. */
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('.guia-opcion') : null;
      if (!b) return;
      ev.preventDefault();
      var li = b.closest('.paso-lectura');
      if (!li) return;
      var nueva = b.classList.contains('elegida') ? '' : String(b.dataset.opcion || '');

      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-opciones .guia-opcion'),
        function (x) { x.classList.toggle('elegida', !!nueva && x.dataset.opcion === nueva); });
      Array.prototype.forEach.call(li.querySelectorAll(':scope > .guia-ramas > .guia-rama'),
        function (r) { r.classList.toggle('rama-activa', !!nueva && r.dataset.opcion === nueva); });
      li.classList.toggle('paso-hecho', !!nueva);

      var nota = li.querySelector(':scope > .guia-opciones .guia-opcion-nota');
      if (nota) nota.classList.toggle('oculto', !nueva);

      if (alElegirOpcion) alElegirOpcion(String(b.dataset.paso || ''), nueva);
    });

    /* Al desmarcar, el paso se abre solo otra vez: así el botón no se
       queda diciendo "esconder" sobre un paso que ya está abierto. */
    document.addEventListener('change', function (ev) {
      var c = ev.target;
      if (!c || !c.classList || !c.classList.contains('paso-casilla')) return;
      var li = c.closest ? c.closest('.paso-lectura') : null;
      if (!li) return;
      li.classList.remove('paso-abierto');
      var b = li.querySelector('.paso-ver');
      if (b) b.textContent = 'ver';
    });
  }
  engancharLaGuia();

  /* Cuántos pasos hay y cuántos están hechos, contando solo la rama
     elegida de cada pregunta: los pasos de la opción que no se ha
     elegido no se hacen, así que tampoco se cuentan. La pregunta en sí
     cuenta como un paso, hecho en cuanto se responde. */
  function cuenta(lista, hechos, elegidas) {
    var pasos = normalizar(lista);
    var marcados = hechos || [];
    var elegido = elegidas || {};
    var total = 0, n = 0;
    pasos.forEach(function (p) {
      total++;
      if (esPregunta(p)) {
        var cual = elegido[p.id];
        if (!cual) return;
        n++;
        var rama = p.opciones.filter(function (o) { return o.id === cual; })[0];
        if (!rama) return;
        var c = cuenta(rama.pasos, marcados, elegido);
        total += c.total;
        n += c.hechos;
        return;
      }
      if (marcados.indexOf(p.id) !== -1) n++;
    });
    return { hechos: n, total: total };
  }

  function hechosDe(lista, hechos, elegidas) {
    return cuenta(lista, hechos, elegidas).hechos;
  }

  /* La guía de un asunto, en su propio cuadro y con casillas.
     'alMarcar' recibe la lista completa de pasos marcados cada vez
     que se toca una casilla, para que la guarde quien la abrió. */
  async function abrir(titulo, lista, hechos, alMarcar, elegidas, alElegir) {
    var marcados = (hechos || []).slice();
    var elegido = Object.assign({}, elegidas || {});
    var pasos = normalizar(lista);
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');

    var esperar = U.preguntar(titulo,
      '<p class="explica" id="guia-cuenta"></p>' +
      '<div id="guia-cuerpo">' + vista(pasos, marcados, true, elegido) + '</div>',
      'Cerrar', true);

    function contar() {
      var c = cuenta(pasos, marcados, elegido);
      $('guia-cuenta').textContent =
        c.hechos + ' de ' + c.total + ' pasos hechos. ' +
        'Lo que marques aquí lo ve todo el que abra la aplicación.';
    }
    contar();

    Array.prototype.forEach.call(document.querySelectorAll('#guia-cuerpo .paso-casilla'),
      function (c) {
        c.onchange = function () {
          var id = c.dataset.paso;
          var i = marcados.indexOf(id);
          if (c.checked && i === -1) marcados.push(id);
          if (!c.checked && i !== -1) marcados.splice(i, 1);
          c.closest('.paso-lectura').classList.toggle('paso-hecho', c.checked);
          contar();
          if (alMarcar) alMarcar(marcados.slice());
        };
      });

    /* El hueco de las opciones se toma prestado mientras el cuadro está
       abierto y se devuelve al cerrarlo, para no dejar sin él a la
       ficha del asunto que hay debajo. */
    var antes = cuandoSeElige(function (idPaso, idOpcion) {
      if (idOpcion) elegido[idPaso] = idOpcion;
      else delete elegido[idPaso];
      contar();
      if (alElegir) alElegir(Object.assign({}, elegido));
    });

    await esperar;
    cuandoSeElige(antes);
    cuadro.classList.remove('cuadro-medio');
    return marcados;
  }

  /* ==========================================================
     ESCRIBIR LA GUÍA

     Un recuadro por paso, y una sola barra de formato arriba que
     actúa sobre el recuadro en el que se está escribiendo.
     ========================================================== */

  var editando = null;      /* el recuadro donde está el cursor */
  var rangoGuardado = null; /* lo que había seleccionado al pedir un enlace */

  function mandar(orden, valor) {
    if (!editando) { U.aviso('Pon antes el cursor en el texto de un paso.'); return; }
    editando.focus();
    try { document.execCommand(orden, false, valor || null); } catch (e) {}
  }

  function BARRA() {
    return '<div class="guia-barra">' +
      '<button type="button" class="boton" id="guia-negrita" title="Negrita"><strong>N</strong></button>' +
      '<button type="button" class="boton" id="guia-vinetas" title="Lista con viñetas">Viñetas</button>' +
      '<button type="button" class="boton" id="guia-enlace" title="Poner un enlace">Enlace</button>' +
      '<button type="button" class="boton" id="guia-quitar" title="Quitar el formato">Quitar formato</button>' +
      '</div>' +
      '<div class="guia-enlace-fila oculto" id="guia-enlace-fila">' +
      '<input id="guia-enlace-url" class="campo" placeholder="https://…  o  correo@centro.es">' +
      '<button type="button" class="boton boton-principal" id="guia-enlace-poner">Poner</button>' +
      '<button type="button" class="boton" id="guia-enlace-quitar">Cancelar</button>' +
      '</div>';
  }

  function editar(nombreTipo, lista) {
    var pasos = normalizar(lista);
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');
    editando = null;
    rangoGuardado = null;

    var esperar = U.preguntar('Guía de ' + nombreTipo,
      '<p class="explica">Los pasos que hay que dar en un asunto de este tipo. ' +
      'Van en el orden del trámite. Dentro de cada asunto salen con una casilla ' +
      'para ir marcando lo que ya está hecho.</p>' +
      BARRA() +
      '<div id="guia-pasos"></div>' +
      '<button type="button" class="boton boton-ancho" id="guia-anadir">Añadir un paso</button>',
      'Guardar');

    /* ---------- la barra de formato ---------- */

    function sinPerderElCursor(id, hacer) {
      var b = $(id);
      b.onmousedown = function (ev) { ev.preventDefault(); };
      b.onclick = hacer;
    }

    sinPerderElCursor('guia-negrita', function () { mandar('bold'); });
    sinPerderElCursor('guia-vinetas', function () { mandar('insertUnorderedList'); });
    sinPerderElCursor('guia-quitar', function () { mandar('removeFormat'); });
    sinPerderElCursor('guia-enlace', function () {
      if (!editando) { U.aviso('Pon antes el cursor en el texto de un paso.'); return; }
      var sel = window.getSelection();
      rangoGuardado = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
      $('guia-enlace-fila').classList.remove('oculto');
      $('guia-enlace-url').value = '';
      $('guia-enlace-url').focus();
    });

    $('guia-enlace-quitar').onclick = function () {
      $('guia-enlace-fila').classList.add('oculto');
    };

    $('guia-enlace-poner').onclick = function () {
      var url = $('guia-enlace-url').value.trim();
      if (!url) return;
      if (url.indexOf('@') !== -1 && !/^mailto:/i.test(url) && url.indexOf(' ') === -1 &&
          !/^https?:\/\//i.test(url)) url = 'mailto:' + url;
      if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url;
      $('guia-enlace-fila').classList.add('oculto');
      if (!editando) return;
      editando.focus();
      if (rangoGuardado) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rangoGuardado);
        if (rangoGuardado.collapsed) {
          document.execCommand('insertHTML', false,
            '<a href="' + U.escapar(url) + '">' + U.escapar(url) + '</a>');
        } else {
          document.execCommand('createLink', false, url);
        }
      }
      rangoGuardado = null;
    };

    /* ---------- la lista de pasos ---------- */

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
        if (isNaN(i) || !pasos[i]) return;
        pasos[i].titulo = caja.querySelector(':scope > .paso-cabecera .paso-titulo').value.trim();
        pasos[i].cuerpo = limpiar(caja.querySelector(':scope > .paso-cuerpo').innerHTML);

        var marca = caja.querySelector(':scope > .paso-es-pregunta-fila .paso-es-pregunta');
        if (!marca || !marca.checked) { pasos[i].opciones = []; return; }

        pasos[i].opciones = Array.prototype.slice.call(
          caja.querySelectorAll(':scope > .paso-opciones > .opcion-editor')
        ).map(function (oc) {
          return {
            id: oc.dataset.id || nuevoId(),
            titulo: oc.querySelector(':scope > .opcion-cabecera > .opcion-titulo').value.trim(),
            pasos: Array.prototype.slice.call(
              oc.querySelectorAll(':scope > .opcion-pasos > .subpaso-editor')
            ).map(function (sc) {
              return {
                id: sc.dataset.id || nuevoId(),
                titulo: sc.querySelector(':scope > .paso-cabecera > .subpaso-titulo').value.trim(),
                cuerpo: limpiar(sc.querySelector(':scope > .subpaso-cuerpo').innerHTML),
                opciones: []
              };
            })
          };
        });
      });
    }

    function pintar() {
      var caja = $('guia-pasos');
      caja.innerHTML = '';
      editando = null;
      if (!pasos.length) {
        caja.innerHTML = '<div class="vacio">Todavía no hay ningún paso. ' +
                         'Añade el primero aquí abajo.</div>';
        return;
      }
      pasos.forEach(function (p, i) {
        var d = document.createElement('div');
        d.className = 'paso-editor';
        d.dataset.pos = i;
        d.innerHTML =
          '<div class="paso-cabecera">' +
            '<span class="paso-numero">' + (i + 1) + '</span>' +
            '<input class="campo paso-titulo" value="' + U.escapar(p.titulo) + '" ' +
            'placeholder="Título corto del paso">' +
          '</div>' +
          '<div class="paso-cuerpo" contenteditable="true" ' +
          'data-vacio="Explicación del paso">' + limpiar(p.cuerpo) + '</div>';

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
          var x = pasos[i - 1]; pasos[i - 1] = pasos[i]; pasos[i] = x;
          pintar();
        }).disabled = (i === 0);

        boton('↓', 'Bajar este paso', function () {
          recoger();
          if (i === pasos.length - 1) return;
          var x = pasos[i + 1]; pasos[i + 1] = pasos[i]; pasos[i] = x;
          pintar();
        }).disabled = (i === pasos.length - 1);

        boton('Quitar', 'Quitar este paso', function () {
          recoger();
          pasos.splice(i, 1);
          pintar();
        }, 'boton-peligro');

        d.querySelector('.paso-cabecera').appendChild(mandos);

        var cuerpo = d.querySelector('.paso-cuerpo');
        prepararRecuadro(cuerpo);

        /* ---- la casilla de "esto es una pregunta" ---- */
        var pregunta = esPregunta(p);
        var fila = document.createElement('label');
        fila.className = 'interruptor paso-es-pregunta-fila';
        fila.innerHTML = '<input type="checkbox" class="paso-es-pregunta"' +
          (pregunta ? ' checked' : '') + '>' +
          '<span>Este paso es una pregunta: el trámite sigue por un camino o por otro</span>';
        d.appendChild(fila);

        fila.querySelector('.paso-es-pregunta').onchange = function () {
          recoger();
          if (this.checked && !pasos[i].opciones.length) {
            pasos[i].opciones = [
              { id: nuevoId(), titulo: '', pasos: [] },
              { id: nuevoId(), titulo: '', pasos: [] }
            ];
          }
          pintar();
        };

        if (pregunta) d.appendChild(cajaDeOpciones(p, i));

        caja.appendChild(d);
      });
    }

    /* Al pegar desde Word o desde una web, solo el texto: así no se
       cuela el formato de fuera. */
    function prepararRecuadro(cuerpo) {
      cuerpo.onfocus = function () { editando = cuerpo; };
      cuerpo.onpaste = function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t);
      };
    }

    /* Las opciones de un paso-pregunta, cada una con sus propios pasos.
       Todo lo que cambia la lista hace lo mismo: recoger lo escrito,
       tocar el array y volver a pintar. */
    function cajaDeOpciones(p, i) {
      var caja = document.createElement('div');
      caja.className = 'paso-opciones';

      var explica = document.createElement('p');
      explica.className = 'explica';
      explica.textContent = 'Dentro del asunto se elige una opción, y solo salen los ' +
                            'pasos de la elegida.';
      caja.appendChild(explica);

      p.opciones.forEach(function (o, j) {
        var oc = document.createElement('div');
        oc.className = 'opcion-editor';
        oc.dataset.id = o.id;
        oc.innerHTML =
          '<div class="opcion-cabecera">' +
            '<input class="campo opcion-titulo" value="' + U.escapar(o.titulo) + '" ' +
            'placeholder="Nombre de la opción. Por ejemplo: la hemos recibido en mano">' +
          '</div>' +
          '<div class="opcion-pasos"></div>';

        var quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'boton boton-peligro';
        quitar.textContent = 'Quitar la opción';
        quitar.title = 'Quitar esta opción y sus pasos';
        quitar.onclick = function () {
          recoger();
          pasos[i].opciones.splice(j, 1);
          pintar();
        };
        oc.querySelector('.opcion-cabecera').appendChild(quitar);

        var dentro = oc.querySelector('.opcion-pasos');
        o.pasos.forEach(function (sp, k) {
          var sc = document.createElement('div');
          sc.className = 'subpaso-editor';
          sc.dataset.id = sp.id;
          sc.innerHTML =
            '<div class="paso-cabecera">' +
              '<input class="campo subpaso-titulo" value="' + U.escapar(sp.titulo) + '" ' +
              'placeholder="Título corto del paso">' +
            '</div>' +
            '<div class="paso-cuerpo subpaso-cuerpo" contenteditable="true" ' +
            'data-vacio="Explicación del paso">' + limpiar(sp.cuerpo) + '</div>';

          var fuera = document.createElement('button');
          fuera.type = 'button';
          fuera.className = 'boton boton-peligro';
          fuera.textContent = 'Quitar';
          fuera.onclick = function () {
            recoger();
            pasos[i].opciones[j].pasos.splice(k, 1);
            pintar();
          };
          sc.querySelector('.paso-cabecera').appendChild(fuera);
          prepararRecuadro(sc.querySelector('.subpaso-cuerpo'));
          dentro.appendChild(sc);
        });

        var mas = document.createElement('button');
        mas.type = 'button';
        mas.className = 'boton boton-ancho';
        mas.textContent = '+ Añadir un paso a esta opción';
        mas.onclick = function () {
          recoger();
          pasos[i].opciones[j].pasos.push({ id: nuevoId(), titulo: '', cuerpo: '', opciones: [] });
          pintar();
        };
        oc.appendChild(mas);

        caja.appendChild(oc);
      });

      var otra = document.createElement('button');
      otra.type = 'button';
      otra.className = 'boton boton-ancho';
      otra.textContent = '+ Añadir otra opción';
      otra.onclick = function () {
        recoger();
        pasos[i].opciones.push({ id: nuevoId(), titulo: '', pasos: [] });
        pintar();
      };
      caja.appendChild(otra);

      return caja;
    }

    $('guia-anadir').onclick = function () {
      recoger();
      pasos.push({ id: nuevoId(), titulo: '', cuerpo: '', opciones: [] });
      pintar();
      var cajas = document.querySelectorAll('#guia-pasos .paso-titulo');
      if (cajas.length) cajas[cajas.length - 1].focus();
    };

    pintar();

    return esperar.then(function (ok) {
      if (ok) recoger();
      cuadro.classList.remove('cuadro-medio');
      editando = null;
      rangoGuardado = null;
      if (!ok) return null;
      return normalizar(pasos);
    });
  }

  return {
    nuevoId: nuevoId, limpiar: limpiar, normalizar: normalizar,
    cuantos: cuantos, vista: vista, hechosDe: hechosDe, cuenta: cuenta,
    esPregunta: esPregunta, cuandoSeElige: cuandoSeElige,
    abrir: abrir, editar: editar
  };
})();
