/* ============================================================
   plantilla-correo-pantalla.js — la plantilla de correo, como un correo nuevo
   (27-nov-2026, fila 771, docs/758-CORREOS-MAS-COMODOS.md, parte 1).

   La ventana «Nueva plantilla» / «Cambiar plantilla» de Ajustes, y el editor que se abre desde el cuadro de Correo o de
   Séneca («Guardar como plantilla nueva», «Cambiar plantilla»), ocupan toda la pantalla:
     - arriba, el título y los botones; debajo, en una línea, lo que no es el correo (Categoría, Tipo y Nombre);
     - a la izquierda, el correo en el orden en que se lee: Para, Copia, Copia oculta, Asunto, Saludo, Texto y Firma
       (el Texto crece con lo escrito, sin barra propia); debajo, «Texto para Séneca» y el adjunto;
     - a la derecha, «Así le llega»: el correo entero como lo verá quien lo recibe, que cambia mientras se escribe.
   Cada columna se desplaza por su cuenta (regla común `.capa > .cuadro`); nada obliga a bajar para ver los botones.

   Los identificadores de los campos son los de siempre (`pl-…` en Ajustes, `pl2-…` en el editor en línea): lo que se
   guarda no cambia. El editor de la guía (js/guias-plantilla.js) sigue con su columna estrecha.

       PlantillaCorreoPantalla.cuerpoHTML({ p, existente, titulo, herramientas, linea, cambiosHTML, texto })
       PlantillaCorreoPantalla.enganchar({ p, valores, saludoDeSiempre, firmaGeneral, asuntoModelo, nombreAsunto })
          -> { pintar }
       PlantillaCorreoPantalla.muestra(categoria, tipo): los valores del asunto de ejemplo, los mismos en «Así sale» y «Así le llega»
   ============================================================ */
var PlantillaCorreoPantalla = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function $(id) { return document.getElementById(id); }

  /* Los valores de un asunto de ejemplo de ese tipo (o inventado si no hay ninguno abierto): lo que usan «Así sale» del
     Asunto y «Así le llega». `datosDeMuestra` sale de js/plantillas-ajustes.js. */
  function muestra(categoria, tipo) {
    var base = window.AsuntoExtracto ? AsuntoExtracto.muestra() : {};
    var datos = (window.PlantillasAjustes && PlantillasAjustes._interno.datosDeMuestra) ? PlantillasAjustes._interno.datosDeMuestra(categoria, tipo) : {};
    return Object.assign({}, base, datos);
  }

  /* El cuerpo de la ventana. `titulo` y `herramientas`: la cabecera propia (el editor en línea); la ventana de Ajustes no las pasa,
     porque su título y sus botones son los del cuadro (`U.preguntar`). `linea`: lo que va en la línea de debajo del título. */
  function cuerpoHTML(o) {
    var P = window.PlantillasAjustes, I = P._interno, PP = window.PlantillaPapeles, p = o.p, e = o.existente;
    return (o.titulo ? '<div class="pcp-cab"><h3 class="pcp-titulo">' + esc(o.titulo) + '</h3><div class="pcp-herr">' + o.herramientas + '</div></div>' : '') +
      '<div class="pcp-linea">' + o.linea + '</div>' +
      '<div id="' + p + '-aviso"></div>' +
      '<div class="pcp-dos"><div class="pcp-izq" id="' + p + '-izq">' +
        '<div class="pcp-correo">' +
          (PP ? PP.destinatariosHTML(p, e) : '') +
          I.campoAsuntoHTML(p + '-asunto', e) +
          (PP ? PP.antesDelTextoHTML(p, e) : '') +
          P.campoDeTextoHTML(p + '-texto', p + '-insertar-hueco', 'Texto', o.texto != null ? o.texto : ((e && e.texto) || ''), 12) +
          (PP ? PP.firmaHTML(p, e) : '') +
        '</div>' +
        (o.cambiosHTML || '') +
        I.campoSenecaHTML(p, e && e.textoSeneca) +
        (window.PlantillaAdjuntar ? PlantillaAdjuntar.selectHTML(p + '-adjuntar', e && e.adjuntar) : '') +
      '</div>' +
      '<div class="pcp-der"><h4 class="pcp-llega-titulo">Así le llega</h4>' +
        '<p class="nota">Con los datos de un asunto de este tipo, o de muestra si no hay ninguno.</p>' +
        '<div class="pcp-llega" id="' + p + '-llega">' +
          '<div class="pcp-llega-asunto"><span class="pcp-llega-rotulo">Asunto</span> <b id="' + p + '-llega-asunto"></b></div>' +
          '<div class="pcp-pre" id="' + p + '-llega-saludo"></div>' +
          '<div class="pcp-pre" id="' + p + '-previa"></div>' +
          '<div class="pcp-pre" id="' + p + '-llega-firma"></div>' +
        '</div></div></div>';
  }

  /* El Texto crece con lo escrito: sin barra de desplazamiento propia. */
  function crecer(ta) {
    if (!ta || !ta.isConnected) return;
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight + 2) + 'px';
  }

  /* Pone en marcha la ventana: el crecimiento del Texto y «Así le llega».
     `o.valores()`: los valores del asunto (objeto o promesa); `o.saludoDeSiempre(v)`: el saludo que sale con el campo vacío;
     `o.firmaGeneral(v)`: la firma que sale con el campo vacío; `o.asuntoModelo()`: el asunto general del centro;
     `o.alTenerValores(v)`: se llama cada vez que «Así le llega» recibe los valores (el «Así sale» del Asunto se repinta con ellos). */
  function enganchar(o) {
    var p = o.p, turno = 0, ultimos = null;
    var izq = $(p + '-izq');
    if (!izq) return { pintar: function () {} };

    function valor(id) { var el = $(id); return el ? el.value : ''; }

    function pintar() {
      var mio = ++turno;
      Promise.resolve().then(function () { return o.valores(); }).catch(function () { return {}; }).then(function (v) {
        if (mio !== turno || !$(p + '-previa')) return;
        v = v || {};
        ultimos = v;
        function rel(t) { return Plantillas.rellenar(String(t || ''), v).texto; }
        var modelo = valor(p + '-asunto').trim() || (o.asuntoModelo ? o.asuntoModelo() : '');
        var asunto = '';
        if (o.nombreAsunto && !v['numero del asunto']) asunto = o.nombreAsunto;   /* un asunto de antes, sin número: el nombre de la carpeta */
        else { try { asunto = AsuntoExtracto.asiSale(modelo, { unaLinea: true, valores: v }); } catch (e) { asunto = ''; } }
        var saludo = valor(p + '-saludo').trim();
        var firma = valor(p + '-firma').replace(/\s+$/, '');
        $(p + '-llega-asunto').textContent = asunto;
        $(p + '-llega-saludo').textContent = saludo ? rel(saludo) : (o.saludoDeSiempre ? o.saludoDeSiempre(v) : '');
        $(p + '-previa').textContent = rel(valor(p + '-texto')) || '(vacío)';
        $(p + '-llega-firma').textContent = firma ? rel(firma) : (o.firmaGeneral ? o.firmaGeneral(v) : '');
        if (o.alTenerValores) o.alTenerValores(v);
      });
    }

    var texto = $(p + '-texto');
    if (texto) { texto.style.overflow = 'hidden'; texto.style.resize = 'none'; }
    /* Cualquier campo de la izquierda: el Texto crece y «Así le llega» se rehace (los huecos insertados lanzan `input`). */
    izq.addEventListener('input', function (ev) {
      if (ev.target === texto) crecer(texto);
      pintar();
    });
    function alCambiarElAncho() { if (!izq.isConnected) { window.removeEventListener('resize', alCambiarElAncho); return; } crecer(texto); }
    window.addEventListener('resize', alCambiarElAncho);
    crecer(texto);
    pintar();
    return { pintar: pintar, crecer: function () { crecer(texto); }, ultimos: function () { return ultimos; } };
  }

  return { cuerpoHTML: cuerpoHTML, enganchar: enganchar, muestra: muestra, crecer: crecer };
})();
window.PlantillaCorreoPantalla = PlantillaCorreoPantalla;
