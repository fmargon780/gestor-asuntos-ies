/* ============================================================
   donde-se-guarda.js — el bloque «¿Dónde se guarda?» (30-sep-2026,
   fila 235, docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, punto 1).

   Toda creación, cambio o borrado de un hito o de una tarea hecho desde
   un asunto pregunta, antes de guardarse, dónde se guarda. La pregunta
   es siempre la misma y sale sola:

     (•) A la guía de <tipo corto>   ← marcada siempre al abrirse
         Llegará a N asuntos abiertos de este tipo.
     ( ) Solo en este asunto

   Este fichero solo sabe pintar el bloque, leer la elección, llevar el
   teclado (flechas cambian la opción, Intro acepta, Escape cancela, que
   ya hace js/usabilidad.js) y abrir el emergente pequeño de las tareas.
   Lo que se hace después con cada elección vive en
   js/hitos-desde-el-asunto.js (hitos) y js/donde-se-guarda-tareas.js
   (tareas).

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

  /* PURA. Las líneas de letra pequeña de debajo de «A la guía».
     o = { otros, conTrabajo, hitoNuevo: { titulo, tareas } | null, apagada: texto | '' } */
  function textoConsecuencia(o) {
    if (o.apagada) return [o.apagada];
    var lineas = [];
    if (o.hitoNuevo) {
      var n = o.hitoNuevo.tareas || 0;
      lineas.push('El hito «' + (o.hitoNuevo.titulo || '') + '» todavía no está en la guía: irá con ' +
        (n === 1 ? 'su tarea' : n === 0 ? 'sus tareas (ninguna)' : 'sus ' + n + ' tareas') + '.');
    }
    if (!o.otros) {
      lineas.push('No hay más asuntos abiertos de este tipo. Valdrá para los próximos.');
    } else {
      lineas.push('Llegará a ' + (o.otros === 1 ? '1 asunto abierto' : o.otros + ' asuntos abiertos') + ' de este tipo.');
      if (o.conTrabajo) {
        lineas.push('En ' + o.conTrabajo + ' no se tocará, porque ya ' + (o.conTrabajo === 1 ? 'tiene' : 'tienen') + ' trabajo.');
      }
    }
    return lineas;
  }

  /* PURA. El bloque entero. o = lo de `textoConsecuencia` + tipoCorto. */
  function bloqueHTML(o) {
    var apagada = !!o.apagada;
    var notas = textoConsecuencia(o).map(function (t) {
      return '<span class="dsg-nota">' + U.escapar(t) + '</span>';
    }).join('');
    return '<div class="dsg" role="radiogroup" aria-label="¿Dónde se guarda?">' +
      '<div class="etiqueta">¿Dónde se guarda?</div>' +
      '<label class="dsg-opcion' + (apagada ? ' dsg-apagada' : '') + '">' +
        '<input type="radio" name="dsg-donde" value="guia"' + (apagada ? ' disabled' : ' checked') + '> ' +
        '<span>A la guía de ' + U.escapar(o.tipoCorto || '') + '</span></label>' +
      '<div class="dsg-notas">' + notas + '</div>' +
      '<label class="dsg-opcion"><input type="radio" name="dsg-donde" value="aqui"' + (apagada ? ' checked' : '') + '> ' +
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
