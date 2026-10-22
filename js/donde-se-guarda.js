/* ============================================================
   donde-se-guarda.js — el bloque «¿Dónde se guarda?» (30-sep-2026,
   fila 235, docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, punto 1).

   Desde la fila 416 (docs/HITOS-UN-SOLO-SITIO.md) los hitos y las tareas
   ya no preguntan dónde se guardan: la guía manda. Este bloque lo siguen
   usando los CAMPOS de un hito o del asunto (js/campo-desde-el-asunto.js,
   js/campos-de-hito.js, filas 245 y 255):

     (•) En el tipo <tipo corto>   ← marcada siempre al abrirse
         Llegará a N asuntos abiertos de este tipo.
     ( ) Solo en este asunto

   Este fichero sabe pintar el bloque, leer la elección, llevar el
   teclado (flechas cambian la opción, Intro acepta, Escape cancela, que
   ya hace js/usabilidad.js) y abrir el emergente pequeño. También da los
   ayudantes que comparten los hitos: `tipoDe`, `nombreCortoDe`,
   `otrosAbiertos`, `introAcepta`.

   Funciones puras: `textoConsecuencia`, `bloqueHTML`.
   ============================================================ */
window.DondeSeGuarda = (function () {

  function $(id) { return document.getElementById(id); }

  function tipoDe(a) {
    var t = (window.App && typeof App.tipoDeAsunto === 'function') ? App.tipoDeAsunto(a)
      : ((a && a.leido && a.leido.tipo) || (a && a.ficha && a.ficha.tipo) || '');
    /* `App.tipoDeAsunto` devuelve «Sin tipo» si no tiene: sin tipo no hay guía. */
    return (window.App && t === App.SIN_TIPO) ? '' : t;
  }

  function nombreCortoDe(tipo) {
    return (window.Nombres && window.App) ? Nombres.tipoParaVer(tipo, App.E.tipos) : tipo;
  }

  /* Los demás asuntos abiertos del mismo tipo (sin el actual, y sin los
     que han pasado por «Unir con otro tipo», fila 207). */
  function otrosAbiertos(a) {
    if (!window.Gestor || typeof Gestor.asuntos !== 'function') return [];
    var tipo = tipoDe(a);
    return Gestor.asuntos().filter(function (x) {
      return x.nombre !== a.nombre && tipoDe(x) === tipo && !(x.ficha && x.ficha.tipoUnidoDe);
    }).map(function (x) { return x.nombre; });
  }

  /* PURA. Las líneas de letra pequeña de debajo de «A la guía de…» (hoy solo
     la usan los campos de un hito, filas 245 y 255).
     o = { otros, hitoCampo: { titulo } | null }
     Fila 245: con `o.vacio` (un campo nuevo) la frase acaba en «, vacío». */
  function textoConsecuencia(o) {
    var lineas = [];
    /* Fila 255: un campo que se añade a un hito. */
    if (o.hitoCampo) {
      return [o.otros
        ? 'El hito «' + o.hitoCampo.titulo + '» lo tendrá en ' + (o.otros === 1 ? '1 asunto abierto' : o.otros + ' asuntos abiertos') + ' de este tipo, vacío.'
        : 'No hay más asuntos abiertos de este tipo. Valdrá para los próximos.'];
    }
    if (!o.otros) {
      lineas.push('No hay más asuntos abiertos de este tipo. Valdrá para los próximos.');
    } else {
      lineas.push('Llegará a ' + (o.otros === 1 ? '1 asunto abierto' : o.otros + ' asuntos abiertos') + ' de este tipo' +
        (o.vacio ? ', vacío.' : '.'));
    }
    return lineas;
  }

  /* PURA. El bloque entero. o = lo de `textoConsecuencia` + tipoCorto.
     Fila 245: `o.opcionTipo` cambia el texto de la primera opción («En el
     tipo X», para un campo); su valor sigue siendo 'guia'. */
  function bloqueHTML(o) {
    var notas = textoConsecuencia(o).map(function (t) {
      return '<span class="dsg-nota">' + U.escapar(t) + '</span>';
    }).join('');
    return '<div class="dsg" role="radiogroup" aria-label="¿Dónde se guarda?">' +
      '<div class="etiqueta">¿Dónde se guarda?</div>' +
      '<label class="dsg-opcion">' +
        '<input type="radio" name="dsg-donde" value="guia" checked> ' +
        '<span>' + U.escapar(o.opcionTipo || ('A la guía de ' + (o.tipoCorto || ''))) + '</span></label>' +
      '<div class="dsg-notas">' + notas + '</div>' +
      '<label class="dsg-opcion"><input type="radio" name="dsg-donde" value="aqui"> ' +
        '<span>Solo en este asunto</span></label>' +
      '</div>';
  }

  /* Lo elegido ahora mismo: 'guia' o 'aqui'. Sin bloque en pantalla, 'aqui'. */
  function elegido() {
    var marcada = document.querySelector('#cuadro-cuerpo input[name="dsg-donde"]:checked');
    return marcada && marcada.value === 'guia' ? 'guia' : 'aqui';
  }

  /* Teclado del bloque (una vez pintado dentro del cuadro): flechas
     arriba y abajo cambian la opción, Intro acepta la marcada. Escape
     cancela sin guardar: lo hace js/usabilidad.js con cualquier cuadro. */
  function enganchar() {
    var radios = Array.prototype.slice.call(document.querySelectorAll('#cuadro-cuerpo input[name="dsg-donde"]'));
    if (!radios.length) return;
    radios.forEach(function (r) {
      r.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
          ev.preventDefault();
          var libres = radios.filter(function (x) { return !x.disabled; });
          if (libres.length < 2) return;
          var otro = libres[(libres.indexOf(r) + 1) % libres.length];
          otro.checked = true;
          otro.focus();
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          var aceptar = $('cuadro-aceptar');
          if (aceptar) aceptar.click();
        }
      });
    });
    var marcada = radios.filter(function (x) { return x.checked; })[0];
    if (marcada && !document.querySelector('#cuadro-cuerpo input:not([type="radio"])')) marcada.focus();
  }

  /* Lo mismo para un campo de texto del cuadro: Intro acepta. */
  function introAcepta(campo) {
    if (!campo) return;
    campo.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' || ev.isComposing) return;
      ev.preventDefault();
      var aceptar = $('cuadro-aceptar');
      if (aceptar) aceptar.click();
    });
  }

  /* El emergente pequeño de las tareas (punto 3). `o`:
       cuerpoHtml (lo que sale arriba: el texto de la tarea), aceptar ('Guardar'),
       titulo, y lo de `bloqueHTML`.
     Devuelve 'guia', 'aqui' o null (Escape o Cancelar: no se guarda nada). */
  async function preguntar(o) {
    var esperar = U.preguntar(o.titulo || '¿Dónde se guarda?',
      (o.cuerpoHtml || '') + bloqueHTML(o), o.aceptar || 'Guardar');
    enganchar();
    var ok = await esperar;
    return ok ? elegido() : null;
  }

  return {
    tipoDe: tipoDe,
    nombreCortoDe: nombreCortoDe,
    otrosAbiertos: otrosAbiertos,
    textoConsecuencia: textoConsecuencia,
    bloqueHTML: bloqueHTML,
    elegido: elegido,
    enganchar: enganchar,
    introAcepta: introAcepta,
    preguntar: preguntar
  };
})();
