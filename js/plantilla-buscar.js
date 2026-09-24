/* ============================================================
   plantilla-buscar.js — «Buscar otra plantilla…»: cualquier plantilla de
   documento del centro, de cualquier tipo y categoría, desde cualquier
   hito (24-sep-2026, fila 126, docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md).

   `montar(caja, alElegir)` pinta dentro de `caja` (nunca un cuadro
   aparte) un campo de buscar y la lista, que se filtra al escribir. Lo
   usan la mesa del hito (js/hito-mesa-documentos.js) y el cuadro de
   elegir plantilla del botón «Generar documento» del hito
   (js/plantillas-documento.js). Generar es cosa de quien llama.
   ============================================================ */
var PlantillaBuscar = (function () {

  var TOPE = 40;

  function textoDe(p) {
    return U.normalizar([p.nombre, p.tipo, p.categoria, p.tipoDocumento, p.texto].join(' '));
  }

  /* Pura: las que tienen todas las palabras, por nombre. */
  function filtrar(catalogo, texto) {
    var palabras = U.normalizar(texto || '').split(' ').filter(Boolean);
    return (catalogo || []).filter(function (p) {
      var t = textoDe(p);
      return palabras.every(function (w) { return t.indexOf(w) !== -1; });
    }).sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
  }

  async function catalogo() {
    var datos = null;
    try { datos = await Plantillas.cargarReciente(App.E.gestor, 60000); } catch (e) { datos = Plantillas.enMemoria(); }
    return (datos && datos.documentos) || [];
  }

  async function montar(caja, alElegir) {
    caja.innerHTML = '<input type="search" class="campo plantilla-buscar-campo" placeholder="Escribe para buscar entre todas las plantillas">' +
      '<div class="plantilla-buscar-lista"></div>';
    var campo = caja.querySelector('.plantilla-buscar-campo');
    var lista = caja.querySelector('.plantilla-buscar-lista');
    var todas = await catalogo();
    function pintar() {
      var encontradas = filtrar(todas, campo.value);
      if (!encontradas.length) {
        lista.innerHTML = '<p class="explica">' + (todas.length ? 'Ninguna plantilla tiene esas palabras.' :
          'Todavía no hay plantillas de documento.') + '</p>';
        return;
      }
      lista.innerHTML = '';
      encontradas.slice(0, TOPE).forEach(function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'plantilla-buscar-opcion';
        b.dataset.id = p.id;
        b.innerHTML = '<span>' + U.escapar(p.nombre) + '</span><span class="suave">' +
          U.escapar([p.categoria, p.tipo].filter(Boolean).join(' · ')) + '</span>';
        b.onclick = function () { alElegir(p, b); };
        lista.appendChild(b);
      });
      if (encontradas.length > TOPE) {
        lista.insertAdjacentHTML('beforeend', '<p class="explica">Y ' + (encontradas.length - TOPE) + ' más: afina la búsqueda.</p>');
      }
    }
    campo.oninput = pintar;
    pintar();
    campo.focus();
  }

  return { filtrar: filtrar, montar: montar };
})();
window.PlantillaBuscar = PlantillaBuscar;
