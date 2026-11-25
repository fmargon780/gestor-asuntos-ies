/* ============================================================
   recurrentes-tercero.js — elegir el tercero de un asunto que se repite
   (fila 746, aviso de Francisco del 25-nov-2026).

   Antes el tercero se escribía a mano. Ahora se elige con el mismo
   buscador de «Nuevo asunto» (App.pintarBuscadorDeTercero), solo entre
   las clases de tercero que admite el tipo elegido, y si no está se da
   de alta con el mismo cuadro de siempre (App.cuadroDeTercero).

   Lo que se guarda es lo mismo que antes: el nombre del tercero tal
   cual va al final de la carpeta (App.textoTercero) y su clase. Los
   que ya estaban apuntados no cambian.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* Pinta en `sitio` el tercero ya elegido (con «Cambiar») o el buscador.
     `op.tipo`: el tipo de asunto elegido (objeto), o null.
     `op.elegido`: { categoria, tercero } o null. Si su clase ya no la
     admite el tipo, se olvida.
     `op.alCambiar(elegido)`: cuando se elige uno o se pulsa «Cambiar».
     `op.alPedirAlta(categoria, texto)`: cuando se pide dar de alta uno nuevo.
     Devuelve el tercero que queda elegido. */
  function montar(sitio, op) {
    var categorias = op.tipo ? Nombres.categoriasDe(op.tipo) : Nombres.CATEGORIAS.slice();
    var elegido = op.elegido && categorias.indexOf(op.elegido.categoria) !== -1 ? op.elegido : null;
    sitio.innerHTML = '';

    if (elegido) {
      var caja = document.createElement('div');
      caja.className = 'elegido-caja';
      caja.innerHTML = '<div><strong>' + U.escapar(elegido.tercero) + '</strong></div>';
      var cambiar = document.createElement('button');
      cambiar.type = 'button';
      cambiar.className = 'boton';
      cambiar.id = 'rec-tercero-cambiar';
      cambiar.textContent = 'Cambiar';
      cambiar.onclick = function () {
        montar(sitio, { tipo: op.tipo, elegido: null, alCambiar: op.alCambiar, alPedirAlta: op.alPedirAlta });
        op.alCambiar(null);
      };
      caja.appendChild(cambiar);
      sitio.appendChild(caja);
      return elegido;
    }

    var admite = document.createElement('p');
    admite.className = 'nota';
    admite.id = 'rec-tercero-admite';
    admite.textContent = (op.tipo ? op.tipo.tipo : 'Cualquier tipo') + ' admite: ' +
      categorias.map(function (c) { return Nombres.textoCategoria(c, 'lista'); }).join(' · ') + '.';
    var buscador = document.createElement('div');
    buscador.id = 'rec-tercero-buscador';
    sitio.appendChild(admite);
    sitio.appendChild(buscador);

    App.pintarBuscadorDeTercero(buscador, categorias.length === 1 ? categorias[0] : null,
      function (categoria, persona, texto) {
        if (!persona) { op.alPedirAlta(categoria, texto); return; }
        var nuevo = { categoria: categoria, tercero: App.textoTercero(persona) };
        montar(sitio, { tipo: op.tipo, elegido: nuevo, alCambiar: op.alCambiar, alPedirAlta: op.alPedirAlta });
        op.alCambiar(nuevo);
      }, { categorias: categorias });
    return null;
  }

  /* Da de alta uno nuevo con el cuadro de siempre. Se llama con el cuadro
     de «Asunto que se repite» ya cerrado (nunca dos cuadros a la vez).
     Devuelve { categoria, tercero } o null si se cancela o falla. */
  async function darDeAlta(categoria, texto) {
    var def = Datos.LISTAS[categoria];
    if (!def) return null;
    var deEntrada = {};
    deEntrada[def.cabecera[0]] = texto || '';
    var titulo = categoria === 'ALUMNADO' ? 'Dar de alta un solicitante' : 'Dar de alta en ' + categoria;
    var valores = await App.cuadroDeTercero(categoria, deEntrada, titulo);
    if (!valores) return null;
    try {
      var fuente = await Datos.anadirALista(App.E.datos, categoria, valores);
      var encontrados = Datos.buscar(fuente.lista, valores[def.cabecera[0]], 1);
      return encontrados[0] ? { categoria: categoria, tercero: App.textoTercero(encontrados[0]) } : null;
    } catch (e) {
      U.aviso('No he podido darlo de alta: ' + U.mensajeDeError(e), 'malo');
      return null;
    }
  }

  window.RecurrenteTercero = { montar: montar, darDeAlta: darDeAlta };
})();
