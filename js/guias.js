/* ============================================================
   guias.js — la guía del procedimiento de cada tipo de asunto.

   Cada tipo de asunto (MATRICULA, COMPRA, SANCION...) puede llevar
   una lista de pasos. Cada paso tiene un título corto y una
   explicación debajo, con negrita, viñetas y enlaces.

   Los pasos van en el orden del trámite, como los estados: se suben
   y se bajan con las flechas.

   Se guardan en _GESTOR/guias.json, dentro de la carpeta de asuntos
   abiertos, así que los ve todo el que abra la aplicación.

   En cada asunto abierto la guía se enseña con casillas, para ir
   marcando lo que ya está hecho. Lo marcado se guarda en la ficha
   del asunto, en asuntos.json.
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

  /* Los pasos, tal y como se guardan: id, título y cuerpo. */
  function normalizar(lista) {
    return (lista || []).map(function (p) {
      if (typeof p === 'string') return { id: nuevoId(), titulo: p, cuerpo: '' };
      return {
        id: (p && p.id) || nuevoId(),
        titulo: String((p && p.titulo) || ''),
        cuerpo: limpiar((p && p.cuerpo) || '')
      };
    }).filter(function (p) { return p.titulo || tieneTexto(p.cuerpo); });
  }

  function cuantos(lista) { return (lista || []).length; }

  /* ==========================================================
     ENSEÑAR LA GUÍA
     ========================================================== */

  /* La guía en modo lectura. Sin casillas sirve de recordatorio
     (por ejemplo, al crear el asunto); con casillas, de lista de
     control dentro del asunto. */
  function vista(lista, hechos, conCasillas) {
    var pasos = normalizar(lista);
    if (!pasos.length) return '';
    var marcados = hechos || [];
    return '<ol class="guia-lectura">' + pasos.map(function (p, i) {
      var hecho = marcados.indexOf(p.id) !== -1;
      var casilla = conCasillas
        ? '<input type="checkbox" class="paso-casilla" data-paso="' + U.escapar(p.id) + '"' +
          (hecho ? ' checked' : '') + '>'
        : '<span class="paso-numero">' + (i + 1) + '</span>';
      return '<li class="paso-lectura' + (hecho ? ' paso-hecho' : '') + '">' +
             '<label class="paso-linea">' + casilla +
             '<span class="paso-titulo-texto">' + U.escapar(p.titulo || 'Paso ' + (i + 1)) + '</span>' +
             '</label>' +
             (tieneTexto(p.cuerpo) ? '<div class="paso-cuerpo-texto">' + limpiar(p.cuerpo) + '</div>' : '') +
             '</li>';
    }).join('') + '</ol>';
  }

  function hechosDe(lista, hechos) {
    var pasos = normalizar(lista);
    var marcados = hechos || [];
    var n = 0;
    pasos.forEach(function (p) { if (marcados.indexOf(p.id) !== -1) n++; });
    return n;
  }

  /* La guía de un asunto, en su propio cuadro y con casillas.
     'alMarcar' recibe la lista completa de pasos marcados cada vez
     que se toca una casilla, para que la guarde quien la abrió. */
  async function abrir(titulo, lista, hechos, alMarcar) {
    var marcados = (hechos || []).slice();
    var pasos = normalizar(lista);
    var cuadro = document.querySelector('#capa .cuadro');
    cuadro.classList.add('cuadro-medio');

    var esperar = U.preguntar(titulo,
      '<p class="explica" id="guia-cuenta"></p>' +
      '<div id="guia-cuerpo">' + vista(pasos, marcados, true) + '</div>',
      'Cerrar', true);

    function contar() {
      $('guia-cuenta').textContent =
        hechosDe(pasos, marcados) + ' de ' + pasos.length + ' pasos hechos. ' +
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

    await esperar;
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

    function recoger() {
      Array.prototype.forEach.call(document.querySelectorAll('#guia-pasos .paso-editor'),
        function (caja) {
          var i = parseInt(caja.dataset.pos, 10);
          if (isNaN(i) || !pasos[i]) return;
          pasos[i].titulo = caja.querySelector('.paso-titulo').value.trim();
          pasos[i].cuerpo = limpiar(caja.querySelector('.paso-cuerpo').innerHTML);
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
        cuerpo.onfocus = function () { editando = cuerpo; };
        /* Al pegar desde Word o desde una web, solo el texto: así no se
           cuela el formato de fuera. */
        cuerpo.onpaste = function (ev) {
          ev.preventDefault();
          var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
          document.execCommand('insertText', false, t);
        };

        caja.appendChild(d);
      });
    }

    $('guia-anadir').onclick = function () {
      recoger();
      pasos.push({ id: nuevoId(), titulo: '', cuerpo: '' });
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
    cuantos: cuantos, vista: vista, hechosDe: hechosDe,
    abrir: abrir, editar: editar
  };
})();
