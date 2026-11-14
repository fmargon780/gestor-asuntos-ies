/* ============================================================
   donde-campo.js — las casillas «Dónde se hace», «Qué documento» y «A quién» de una tarea
   (fila 659, docs/659-DONDE-SE-HACE-Y-NOMBRES.md; pantalla de prueba docs/pantallas/650.html).

   Las tres se buscan escribiendo (casilla con lista) y todas son opcionales:
     - «Dónde se hace»: el sitio (y la zona) de js/sitios.js, con «Ver todos los sitios…» debajo
       (js/sitios-ventana.js). Al cambiar «Qué se hace» propone el sitio de esa acción.
     - «Qué documento»: solo en Registrar, Poner a la firma y Añadir documento (la lista de tipos
       de documento de la app).
     - «A quién»: solo en Llamar (Tercero, Familia, Relacionado, Sus profesores).
   Se usa en la guía del tipo (js/guias-guion-editor.js), en «Cambiar la tarea» de la lista común
   (js/comunes-cambiar.js) y en «+ Añadir tarea» y «Cambiar…» de un asunto
   (js/tareas-con-documento-vista.js).

   `html(g)` pinta, `leer(raiz)` devuelve { donde, tipoDocumento, aQuien } (sin lo que no toca a la acción),
   `enganchar(raiz, alCambiar)` y `alCambiarAccion(raiz, nueva, previa)` lo ponen al día,
   `etiquetaHTML(g)` es el texto que lleva la tarea en la mesa del hito.
   ============================================================ */
var DondeCampo = (function () {

  var contador = 0;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')); }

  function tiposDeDocumento() { return (window.App && App.E && App.E.tiposDocumento) || []; }
  function papeles() { return window.GuiasToca ? GuiasToca.aQuien([]) : [{ id: 'tercero', nombre: 'Tercero' }, { id: 'tutor', nombre: 'Familia' }, { id: 'relacionado', nombre: 'Relacionado' }, { id: 'profesores', nombre: 'Sus profesores' }]; }

  function listaHTML(id, valores) {
    return '<datalist id="' + id + '">' + valores.map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('') + '</datalist>';
  }
  function textosDeSitios() { return Sitios.opciones(Sitios.datos()).map(function (o) { return o.texto; }); }

  /* El contenido del bloque para esta acción: `g` = { accion, donde, tipoDocumento, aQuien }. */
  function cuerpoHTML(g) {
    var n = ++contador, accion = (g && g.accion) || '';
    if (window.SitiosGuardado) SitiosGuardado.cargar();
    /* Una tarea de Enviar de antes, sin sitio, enseña el que dice su vía; mientras no se toque, no se escribe en ella. */
    var propio = Sitios.normalizarDonde(g && g.donde), efectivo = propio || Sitios.dondeDe(g), texto = Sitios.textoDe(Sitios.datos(), efectivo);
    var html = '<label class="dato donde-fila"><span class="etiqueta">Dónde se hace</span>' +
      '<input type="text" class="campo donde-sitio" list="dc-sitios-' + n + '" value="' + esc(texto) + '"' + (!propio && efectivo ? ' data-heredado="1" data-inicial="' + esc(texto) + '"' : '') +
      ' placeholder="Escribe para buscar…" autocomplete="off"></label>' +
      listaHTML('dc-sitios-' + n, textosDeSitios()) +
      '<button type="button" class="enlace donde-ver-todos">Ver todos los sitios…</button>';
    if (Sitios.usaDocumento(accion)) {
      html += '<label class="dato donde-fila"><span class="etiqueta">Qué documento</span>' +
        '<input type="text" class="campo donde-documento" list="dc-doc-' + n + '" value="' + esc((g && g.tipoDocumento) || '') + '" placeholder="Escribe para buscar…" autocomplete="off"></label>' +
        listaHTML('dc-doc-' + n, tiposDeDocumento());
    }
    if (Sitios.usaAQuien(accion)) {
      var p = papeles().filter(function (x) { return x.id === (g && g.aQuien); })[0];
      html += '<label class="dato donde-fila"><span class="etiqueta">A quién</span>' +
        '<input type="text" class="campo donde-a-quien" list="dc-quien-' + n + '" value="' + esc(p ? p.nombre : '') + '" placeholder="Escribe para buscar…" autocomplete="off"></label>' +
        listaHTML('dc-quien-' + n, papeles().map(function (x) { return x.nombre; }));
    }
    return html;
  }

  /* El bloque entero, con la acción en `data-accion` para saber qué casillas lleva. */
  function html(g) {
    return '<div class="guion-fila-linea donde-campo" data-accion="' + esc((g && g.accion) || '') + '">' + cuerpoHTML(g) + '</div>';
  }

  function leer(raiz) {
    var b = raiz && (raiz.classList && raiz.classList.contains('donde-campo') ? raiz : raiz.querySelector('.donde-campo'));
    if (!b) return {};
    var accion = b.dataset.accion || '', salida = {};
    var s = b.querySelector('.donde-sitio');
    if (s && !(s.dataset.heredado === '1' && s.value === s.dataset.inicial)) { var d = Sitios.deTexto(Sitios.datos(), s.value); if (d) salida.donde = d; }
    var doc = b.querySelector('.donde-documento');
    if (doc && Sitios.usaDocumento(accion)) {
      var t = tiposDeDocumento().filter(function (x) { return norm(x) === norm(doc.value); })[0];
      if (t) salida.tipoDocumento = t;
    }
    var q = b.querySelector('.donde-a-quien');
    if (q && Sitios.usaAQuien(accion)) {
      var p = papeles().filter(function (x) { return norm(x.nombre) === norm(q.value); })[0];
      if (p) salida.aQuien = p.id;
    }
    return salida;
  }

  /* Lo que hay en la casilla y no es ninguna de las opciones se borra al salir de ella. */
  function enganchar(raiz, alCambiar) {
    var b = raiz && (raiz.classList && raiz.classList.contains('donde-campo') ? raiz : raiz.querySelector('.donde-campo'));
    if (!b) return;
    function limpiar(c, valida) {
      c.addEventListener('change', function () {
        if (c.value && !valida(c.value)) c.value = '';
        if (alCambiar) alCambiar(leer(b));
      });
      c.addEventListener('focus', function () { if (c.select) c.select(); });
    }
    var s = b.querySelector('.donde-sitio');
    if (s) limpiar(s, function (v) { return !!Sitios.deTexto(Sitios.datos(), v); });
    var d = b.querySelector('.donde-documento');
    if (d) limpiar(d, function (v) { return tiposDeDocumento().some(function (x) { return norm(x) === norm(v); }); });
    var q = b.querySelector('.donde-a-quien');
    if (q) limpiar(q, function (v) { return papeles().some(function (x) { return norm(x.nombre) === norm(v); }); });
    var ver = b.querySelector('.donde-ver-todos');
    if (ver) ver.onclick = function () {
      if (!window.SitiosVentana) return;
      SitiosVentana.abrir({
        alElegir: function (donde) { if (s) s.value = Sitios.textoDe(Sitios.datos(), donde); if (alCambiar) alCambiar(leer(b)); },
        alCerrar: function () {
          var lista = b.querySelector('datalist');
          if (lista) lista.innerHTML = textosDeSitios().map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('');
          if (s && s.value && !Sitios.deTexto(Sitios.datos(), s.value)) { s.value = ''; if (alCambiar) alCambiar(leer(b)); }
        }
      });
    };
  }

  /* «Qué se hace» ha cambiado: el sitio pasa al que propone la acción nueva (si no se había tocado: vacío o el de la acción de antes)
     y salen o se van «Qué documento» y «A quién». `previa` es la acción de antes. */
  function alCambiarAccion(raiz, nueva, previa) {
    var b = raiz && (raiz.classList && raiz.classList.contains('donde-campo') ? raiz : raiz.querySelector('.donde-campo'));
    if (!b) return;
    var actual = leer(b), datos = Sitios.datos();
    var deAntes = Sitios.propuesto(datos, previa);
    var sitio = b.querySelector('.donde-sitio');
    var d = actual.donde || (sitio && sitio.dataset.heredado === '1' ? Sitios.deTexto(datos, sitio.value) : null);
    if (!d || (deAntes && Sitios.igualDonde(d, deAntes))) d = Sitios.propuesto(datos, nueva) || null;
    var g = { accion: nueva || '', donde: d, tipoDocumento: Sitios.usaDocumento(nueva) ? actual.tipoDocumento : '', aQuien: Sitios.usaAQuien(nueva) ? actual.aQuien : '' };
    b.dataset.accion = g.accion;
    b.innerHTML = cuerpoHTML(g);
    enganchar(b, b._alCambiar);
  }

  /* Engancha y recuerda el aviso para volver a engancharlo tras `alCambiarAccion`. */
  function ponerAlDia(raiz, alCambiar) {
    var b = raiz && (raiz.classList && raiz.classList.contains('donde-campo') ? raiz : raiz.querySelector('.donde-campo'));
    if (!b) return;
    b._alCambiar = alCambiar;
    enganchar(b, alCambiar);
  }

  /* Lo que lleva la tarea en la mesa del hito, junto a su acción: «Séneca · Registro», «Registrar de entrada»… */
  function etiquetaHTML(g) {
    var t = Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(g));
    return t ? '<span class="guion-tarea-donde" title="Dónde se hace">' + esc(t) + '</span>' : '';
  }

  return { html: html, cuerpoHTML: cuerpoHTML, leer: leer, enganchar: ponerAlDia, alCambiarAccion: alCambiarAccion, etiquetaHTML: etiquetaHTML };
})();
window.DondeCampo = DondeCampo;
