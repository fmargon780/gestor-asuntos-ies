/* ============================================================
   tipo-al-vuelo.js — crear un tipo de asunto sin salir de Nuevo
   asunto (fila 128, docs/TIPO-DESDE-EL-ASUNTO.md).

   El botón "+ Crear tipo nuevo" y su panel de cuatro datos (nombre,
   nombre corto, categoría y, desde la fila 134, quién lo encarga) viven en Nuevo asunto, junto al buscador
   de tipos. No es un segundo cuadro de diálogo (#capa ya lo usa Nuevo
   asunto si hiciera falta): es un panel desplegable, dentro de la
   misma pantalla.

   Se engancha a js/tipos-buscador.js llamando a TipoAlVuelo.repintar()
   al final de su aplicar() — no se envuelve nada. Guarda con
   App.crearTipo (js/ajustes.js) y deja el tipo elegido con
   App.marcarTipoElegido (js/asuntos-nuevo.js), que no toca el tercero
   ni lo demás escrito.
   ============================================================ */
(function () {

  var contenedor = null;
  var boton = null;
  var panel = null;
  var abierto = false;

  function $(id) { return document.getElementById(id); }

  function alPulsarFuera(e) { if (contenedor && !contenedor.contains(e.target)) cerrar(); }
  function alPulsarTecla(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }

  function construir() {
    contenedor = document.createElement('div');
    contenedor.className = 'tipo-al-vuelo';

    boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'btn-crear-tipo-al-vuelo';
    boton.textContent = '+ Crear tipo nuevo';
    boton.onclick = function () { abrirPanel(); };
    contenedor.appendChild(boton);

    panel = document.createElement('div');
    panel.id = 'tipo-al-vuelo-panel';
    panel.className = 'tipo-al-vuelo-panel oculto';
    panel.innerHTML =
      '<label class="etiqueta" for="tipo-al-vuelo-nombre">Nombre</label>' +
      '<input class="campo" id="tipo-al-vuelo-nombre" placeholder="NOMBRE DEL TIPO">' +
      '<div class="aviso-en-vivo" id="tipo-al-vuelo-aviso"></div>' +
      '<label class="etiqueta" for="tipo-al-vuelo-corto">Nombre corto ' +
        '<span class="suave">(opcional)</span></label>' +
      '<input class="campo" id="tipo-al-vuelo-corto" placeholder="Igual que el nombre de arriba">' +
      '<label class="etiqueta" for="tipo-al-vuelo-categoria">Categoría</label>' +
      '<select class="campo" id="tipo-al-vuelo-categoria">' +
        Nombres.CATEGORIAS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
      '</select>' +
      /* Fila 134: quién lo encarga, opcional (js/tipos-organo.js). */
      (window.TiposOrgano
        ? '<label class="etiqueta" for="tipo-al-vuelo-organo">Quién lo encarga ' +
            '<span class="suave">(opcional)</span></label>' +
          '<select class="campo" id="tipo-al-vuelo-organo">' + TiposOrgano.opcionesHtml('') + '</select>'
        : '') +
      '<div class="tipo-al-vuelo-botones">' +
        '<button type="button" class="boton boton-principal" id="tipo-al-vuelo-crear">Crear</button>' +
        '<button type="button" class="boton" id="tipo-al-vuelo-cancelar">Cancelar</button>' +
      '</div>';
    contenedor.appendChild(panel);

    /* `panel` todavía no está en el documento (contenedor se cuelga en
       repintar()): buscar dentro de él, no con $() (document.getElementById,
       que solo encuentra lo que ya cuelga del documento). */
    panel.querySelector('#tipo-al-vuelo-nombre').oninput = pintarAviso;
    panel.querySelector('#tipo-al-vuelo-cancelar').onclick = function () { cerrar(); };
    panel.querySelector('#tipo-al-vuelo-crear').onclick = function () { crear(); };
  }

  function abrirPanel() {
    if (!contenedor) construir();
    abierto = true;
    panel.classList.remove('oculto');
    boton.classList.add('oculto');
    $('tipo-al-vuelo-nombre').value = U.limpiarNombre(($('buscar-tipo') && $('buscar-tipo').value) || '').toUpperCase();
    $('tipo-al-vuelo-corto').value = '';
    $('tipo-al-vuelo-categoria').value = App.E.nuevo.categoria || Nombres.CATEGORIAS[0];
    if ($('tipo-al-vuelo-organo')) $('tipo-al-vuelo-organo').value = '';
    pintarAviso();
    document.addEventListener('mousedown', alPulsarFuera, true);
    document.addEventListener('keydown', alPulsarTecla, true);
    $('tipo-al-vuelo-nombre').focus();
  }

  function cerrar() {
    if (!abierto) return;
    abierto = false;
    panel.classList.add('oculto');
    boton.classList.remove('oculto');
    document.removeEventListener('mousedown', alPulsarFuera, true);
    document.removeEventListener('keydown', alPulsarTecla, true);
  }

  /* El mismo aviso en vivo de Ajustes (App.pintarAvisoNuevoTipo), pero
     con "Usar este" en vez de "Verlo": aquí no hace falta ir a
     Ajustes, basta con dejarlo elegido. */
  function pintarAviso() {
    var campo = $('tipo-al-vuelo-nombre'), aviso = $('tipo-al-vuelo-aviso'), crearBtn = $('tipo-al-vuelo-crear');
    if (!campo || !aviso) return;
    var nombre = U.limpiarNombre(campo.value).toUpperCase();
    if (!nombre) { aviso.className = 'aviso-en-vivo'; aviso.innerHTML = ''; crearBtn.disabled = false; return; }

    var nombres = App.E.tipos.map(function (t) { return t.tipo; });
    var cerca = U.parecidos(nombre, nombres);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      var tipoExistente = App.E.tipos.filter(function (t) { return t.tipo === mismo.nombre; })[0];
      aviso.className = 'aviso-en-vivo aviso-en-vivo-malo';
      aviso.innerHTML = 'Ya existe: ' + U.escapar(mismo.nombre) + ', en ' + U.escapar(tipoExistente.categoria) +
        '. <button type="button" class="enlace" id="tipo-al-vuelo-usar-existente">Usar este</button>';
      crearBtn.disabled = true;
      $('tipo-al-vuelo-usar-existente').onclick = function () { usarExistente(tipoExistente); };
      return;
    }
    crearBtn.disabled = false;
    if (cerca.length) {
      aviso.className = 'aviso-en-vivo aviso-en-vivo-ambar';
      aviso.textContent = 'Se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ');
    } else {
      aviso.className = 'aviso-en-vivo'; aviso.innerHTML = '';
    }
  }

  function usarExistente(tipo) {
    cerrar();
    App.marcarTipoElegido(tipo);
    U.aviso('Ya existía. Elegido: ' + tipo.tipo + '.', 'bueno');
  }

  async function crear() {
    var campoNombre = $('tipo-al-vuelo-nombre');
    var nombre = U.limpiarNombre(campoNombre.value).toUpperCase();
    if (!nombre) { campoNombre.focus(); return; }
    var categoria = $('tipo-al-vuelo-categoria').value;
    var nombreCorto = U.limpiarNombre($('tipo-al-vuelo-corto').value).toUpperCase();
    var hay = App.E.tipos.map(function (t) { return t.tipo; });

    await U.mientrasGuarda($('tipo-al-vuelo-crear'), async function () {
      if (!await U.dejaCrear(nombre, hay, 'tipo')) return;
      var datos = { nombre: nombre, categoria: categoria };
      if (nombreCorto) datos.nombreCorto = nombreCorto;
      if ($('tipo-al-vuelo-organo') && $('tipo-al-vuelo-organo').value) datos.organo = $('tipo-al-vuelo-organo').value;
      var tipo;
      try {
        tipo = await App.crearTipo(datos);
      } catch (e) {
        U.fallo('No he podido crear el tipo', e);
        return;
      }
      cerrar();
      App.marcarTipoElegido(tipo);
      U.aviso('Tipo creado. Su guía, campos y plantillas se añaden en Ajustes.', 'bueno');
    });
  }

  /* Llamado desde js/tipos-buscador.js, al final de aplicar(): con
     texto en el buscador, un botón destacado justo debajo (puede que
     haya parecidos que no valgan, no solo cuando no hay ninguno); sin
     texto, uno discreto al final de la parrilla. Mueve siempre el
     mismo nodo: no se pierde el panel a medio rellenar por un
     repintado de en medio. */
  function repintar() {
    var lista = $('tipos-lista');
    if (!lista) return;
    if (!contenedor) construir();

    var cajaBuscador = lista.parentNode && lista.parentNode.querySelector('.buscador-tipos');
    var conTexto = !!(cajaBuscador && $('buscar-tipo') && $('buscar-tipo').value.trim());

    contenedor.classList.toggle('tipo-al-vuelo-destacado', conTexto);
    contenedor.classList.toggle('tipo-al-vuelo-discreto', !conTexto);
    boton.classList.toggle('boton', conTexto);
    boton.classList.toggle('enlace', !conTexto);

    if (conTexto) {
      cajaBuscador.parentNode.insertBefore(contenedor, cajaBuscador.nextSibling);
    } else {
      lista.appendChild(contenedor);
    }
  }

  window.TipoAlVuelo = { repintar: repintar };

})();
