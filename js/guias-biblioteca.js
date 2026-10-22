/* ============================================================
   guias-biblioteca.js — «+ Traer un hito de otro tipo» (fila 417,
   docs/HITOS-UN-SOLO-SITIO.md, parte B; antes «+ Traer de la biblioteca»,
   20-sep-2026, fila 79).

   La biblioteca ya no es un almacén aparte, es un buscador: un panel
   dentro del propio cuadro de la guía (nunca un segundo U.preguntar:
   «solo hay un cuadro de diálogo») con los hitos de las guías de los
   demás tipos, agrupados por tipo, y al final «Sin tipo» (los modelos
   de _GESTOR/hitos-biblioteca.json que ninguna guía usa), cada uno con
   su «Quitar». Elegir uno es traer una copia suelta (el modelo está en
   js/hitos-biblioteca.js). Ya no hay etiqueta de origen, ni pregunta al
   guardar, ni «Guardar en la biblioteca», ni avisos «Ver el cambio».

   Se carga después de js/hitos-biblioteca.js y de js/hitos-normativa.js.
   ============================================================ */
var GuiasBiblioteca = (function () {

  function resumenDeModelo(m) {
    var trozos = [];
    if (m.responsable) trozos.push(m.responsable);
    if (m.plazo && m.plazo.dias) trozos.push((typeof Plazos !== 'undefined' && Plazos.textoPlazo ? Plazos.textoPlazo(m.plazo) : m.plazo.dias + ' días') + ' de plazo');   /* fila 131 */
    /* Fila 138: lo que hay que reunir son líneas de la tarea. */
    var n = (m.guion || []).filter(function (g) { return g && g.reunir; }).length;
    if (n) trozos.push(n + (n === 1 ? ' cosa que reunir' : ' cosas que reunir'));
    return trozos.join(' · ') || 'Sin más datos';
  }

  function panelTraerHTML() {
    return '<div class="biblioteca-panel oculto" id="biblioteca-panel-traer">' +
      '<input type="search" class="campo" id="biblioteca-buscar" placeholder="Buscar un hito por su título">' +
      '<div class="biblioteca-panel-lista" id="biblioteca-panel-lista"></div>' +
      '<button type="button" class="boton" id="biblioteca-panel-cerrar">Cerrar</button>' +
      '</div>';
  }

  /* Todas las guías y los modelos sin tipo, tal como están ahora. */
  async function leerFuentes(tipoActual) {
    var guias = (window.GuiasDelCentro && GuiasDelCentro.todas) ? GuiasDelCentro.todas() : {};
    var grupos = HitosBiblioteca.hitosDeOtrosTipos(guias, tipoActual).map(function (g) {
      return { nombre: g.tipo, sinTipo: false, items: g.hitos.map(function (p) {
        return { titulo: p.titulo, resumen: resumenDeModelo(p), hito: p };
      }) };
    });
    var biblioteca = { modelos: [] };
    try { biblioteca = await HitosBiblioteca.leer(); } catch (e) { /* sin biblioteca legible, solo las guías */ }
    var sueltos = HitosBiblioteca.modelosSinTipo(biblioteca, guias);
    if (sueltos.length) {
      grupos.push({ nombre: 'Sin tipo', sinTipo: true, items: sueltos.map(function (m) {
        return { titulo: m.nombre, resumen: resumenDeModelo(m), modelo: m };
      }) });
    }
    return grupos;
  }

  /* `cuadro` es el nodo raíz del cuadro de la guía (donde ya está insertado
     panelTraerHTML()). `botonAbrir` lo abre y lo cierra. `alElegir(elegido)`
     recibe `{ hito }` (un hito de otra guía) o `{ modelo }` (uno de «Sin
     tipo»); el panel se cierra solo y quien llama hace la copia suelta.
     `tipoActual` es el tipo cuya guía se escribe (no se ofrece a sí mismo). */
  async function engancharPanelTraer(cuadro, botonAbrir, alElegir, tipoActual) {
    var panel = cuadro.querySelector('#biblioteca-panel-traer');
    var buscar = cuadro.querySelector('#biblioteca-buscar');
    var lista = cuadro.querySelector('#biblioteca-panel-lista');
    if (!panel || !botonAbrir) return;

    var grupos = [];

    function pintarLista() {
      var q = U.normalizar(buscar.value || '');
      lista.innerHTML = '';
      var hubo = false;
      grupos.forEach(function (g) {
        var items = g.items.filter(function (it) { return !q || U.normalizar(it.titulo).indexOf(q) !== -1; });
        if (!items.length) return;
        hubo = true;
        var cab = document.createElement('div');
        cab.className = 'biblioteca-panel-grupo' + (g.sinTipo ? ' biblioteca-panel-sin-tipo' : '');
        cab.textContent = g.nombre;
        lista.appendChild(cab);
        items.forEach(function (it) {
          var fila = document.createElement('div');
          fila.className = 'biblioteca-panel-fila-item';
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'biblioteca-panel-item';
          b.innerHTML = '<span class="nombre-tipo">' + U.escapar(it.titulo) + '</span>' +
            '<span class="suave">' + U.escapar(it.resumen) + '</span>';
          b.onclick = function () {
            panel.classList.add('oculto');
            alElegir(it.modelo ? { modelo: it.modelo } : { hito: it.hito });
          };
          fila.appendChild(b);
          if (it.modelo) fila.appendChild(botonQuitar(it.modelo, fila));
          lista.appendChild(fila);
        });
      });
      if (!hubo) {
        lista.innerHTML = '<div class="vacio">' + (grupos.length ? 'Nada encontrado.' : 'Todavía no hay hitos en otros tipos.') + '</div>';
      }
    }

    /* «Quitar» de un «Sin tipo»: se confirma en la propia fila (no hay un
       segundo cuadro): el primer toque pide confirmar, el segundo lo borra. */
    function botonQuitar(modelo, fila) {
      var q = document.createElement('button');
      q.type = 'button';
      q.className = 'boton boton-peligro biblioteca-quitar';
      q.textContent = 'Quitar';
      var armado = false;
      q.onclick = async function () {
        if (!armado) {
          armado = true;
          q.textContent = '¿Seguro? Quitar';
          setTimeout(function () { if (q.isConnected && armado) { armado = false; q.textContent = 'Quitar'; } }, 5000);
          return;
        }
        q.disabled = true;
        try {
          await HitosBiblioteca.borrar(modelo.id);
          grupos.forEach(function (g) { g.items = g.items.filter(function (it) { return !it.modelo || it.modelo.id !== modelo.id; }); });
          grupos = grupos.filter(function (g) { return g.items.length; });
          pintarLista();
          U.aviso('Quitado.', 'bueno');
        } catch (e) { q.disabled = false; U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo'); }
      };
      return q;
    }

    botonAbrir.onclick = async function () {
      var abrir = panel.classList.contains('oculto');
      panel.classList.toggle('oculto');
      if (!abrir) return;
      lista.innerHTML = '<div class="vacio">Leyendo…</div>';
      try { grupos = await leerFuentes(tipoActual); } catch (e) { grupos = []; }
      pintarLista();
      buscar.value = '';
      buscar.focus();
    };
    buscar.oninput = pintarLista;
    var cerrar = cuadro.querySelector('#biblioteca-panel-cerrar');
    if (cerrar) cerrar.onclick = function () { panel.classList.add('oculto'); };
  }

  /* Del elegido en el panel al hito nuevo de la guía (copia suelta). */
  function pasoDeElegido(elegido, desde) {
    return elegido.modelo ? HitosBiblioteca.copiaSueltaDeModelo(elegido.modelo, desde)
                          : HitosBiblioteca.copiaSuelta(elegido.hito, desde);
  }

  return {
    panelTraerHTML: panelTraerHTML, engancharPanelTraer: engancharPanelTraer,
    pasoDeElegido: pasoDeElegido, resumenDeModelo: resumenDeModelo
  };
})();
window.GuiasBiblioteca = GuiasBiblioteca;
