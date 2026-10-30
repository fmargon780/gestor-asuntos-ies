/* ============================================================
   ajustes-tipo-clases.js — «Clases de tercero» de un tipo (fila 493,
   docs/493-varias-clases-de-tercero.md).

   En «Datos del tipo», una casilla por clase de tercero (Alumnado,
   Tutores legales, Personal, Empresas, Otros, Administraciones). Se
   guarda al cambiar, sin botón. La última marcada no se puede
   desmarcar: un tipo admite siempre al menos una. El tipo guarda
   `categorias` (en el orden de Nombres.CATEGORIAS) y `categoria`, igual
   a la primera, que es lo que lee todo lo demás.
   ============================================================ */
var AjustesTipoClases = (function () {

  function textoMarca(tipo) {
    return Nombres.categoriasDe(tipo).map(function (c) { return Nombres.textoCategoria(c, 'lista'); }).join(' · ');
  }

  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.className = 'fila-tipo tipo-clases-fila';
    fila.innerHTML = '<span class="nombre-tipo">Clases de tercero</span><span class="tipo-clases-casillas"></span>';
    var caja = fila.querySelector('.tipo-clases-casillas');
    var casillas = [];

    function repintar() {
      var marcadas = Nombres.categoriasDe(tipo);
      casillas.forEach(function (c) {
        c.input.checked = marcadas.indexOf(c.clase) !== -1;
        c.input.disabled = c.input.checked && marcadas.length === 1;   /* la última no se apaga */
      });
    }

    /* El orden de la pantalla de prueba; lo guardado va siempre en el de Nombres.CATEGORIAS. */
    ['ALUMNADO', 'TUTORES LEGALES', 'PERSONAL', 'EMPRESAS', 'OTROS', 'ADMINISTRACIONES'].forEach(function (clase) {
      var l = document.createElement('label');
      l.className = 'tipo-clases-casilla';
      var i = document.createElement('input');
      i.type = 'checkbox';
      i.setAttribute('data-clase', clase);
      l.appendChild(i);
      l.appendChild(document.createTextNode(' ' + Nombres.textoCategoria(clase, 'lista')));
      caja.appendChild(l);
      casillas.push({ clase: clase, input: i });
      i.onchange = async function () {
        var antes = Nombres.categoriasDe(tipo);
        var despues = Nombres.CATEGORIAS.filter(function (c) {
          return c === clase ? i.checked : antes.indexOf(c) !== -1;
        });
        if (!despues.length) { repintar(); return; }
        var t = (App.E.tipos || []).filter(function (x) { return x.tipo === tipo.tipo; })[0] || tipo;
        var previo = { categoria: t.categoria, categorias: t.categorias };
        [t, tipo].forEach(function (x) { Nombres.fijarCategorias(x, despues); });
        repintar();
        casillas.forEach(function (c) { c.input.disabled = true; });
        try {
          await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });
          marcar(tipo);
          U.aviso(tipo.tipo + ': ' + textoMarca(tipo) + '.', 'bueno');
        } catch (e) {
          [t, tipo].forEach(function (x) { x.categoria = previo.categoria; x.categorias = previo.categorias; });
          U.fallo('No he podido guardarlo', e);
        }
        repintar();
      };
    });
    repintar();
    return fila;
  }

  /* La marca de la cabecera, junto al nombre del tipo: todas sus clases. */
  function marcar(tipo) {
    var m = document.getElementById('tipo-asunto-categoria');
    if (m) m.textContent = Nombres.categoriasDe(tipo).join(' · ');
    if (window.AjustesPlegado && AjustesPlegado.resumirTipo) AjustesPlegado.resumirTipo();
  }

  return { filaDeTipo: filaDeTipo, marcar: marcar };
})();
window.AjustesTipoClases = AjustesTipoClases;
