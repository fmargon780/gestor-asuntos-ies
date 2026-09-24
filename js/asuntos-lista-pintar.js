/* ============================================================
   asuntos-lista-pintar.js — pintar la lista de asuntos abiertos y la tarjeta de cada asunto.

   Sacado tal cual de js/asuntos-lista.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de él.
   ============================================================ */

App.pintarAbiertos = function () {
  if (window.Reservados) Reservados.pintarBoton();   /* «Mostrar reservados» (fila 135) */
  if (!App.listaALaVista()) { App.E.listaPendiente = true; return; }
  App.E.listaPendiente = false;
  App.pintarCuentas();
  /* Varias palabras sueltas, en cualquier orden (fila 73,
     docs/BUSCAR-EN-LAS-NOTAS.md, punto 2.1): mismo criterio que ya
     usa el buscador del ARCHIVO (App.pintarArchivo). */
  var palabras = U.normalizar($('buscar-abiertos').value).split(' ').filter(Boolean);
  var rotulo = $('cuenta-lista-abiertos');
  var orden = App.ordenElegido();
  $('orden-abiertos').value = orden;
  var filtro = $('filtro-estado').value;
  var plazo = $('filtro-plazo').value;
  var organo = $('filtro-organo') ? $('filtro-organo').value : '';   /* fila 134 */

  /* Primero, el montón entero: lo que pasa el buscador y los filtros.
     Sobre esto se cuentan las tarjetas de tipo. */
  var monton = App.E.listaAbiertos.filter(function (a) {
    if (!App.deLaVista(a, App.E.vista)) return false;
    if (palabras.length) {
      /* Un reservado tapado solo sale por su nombre de carpeta (fila 135). */
      var busca = (window.Reservados && Reservados.tapar(a)) ? Reservados.textoDeBusqueda(a) : a.busca;
      if (!palabras.every(function (p) { return busca.indexOf(p) !== -1; })) return false;
    }
    if (!Plazos.pasaFiltro(a.ficha.limite || '', plazo)) return false;
    if (organo && window.TiposOrgano && !TiposOrgano.pasaFiltro(App.tipoDeAsunto(a), organo)) return false;
    return App.pasaFiltroMonton(a, filtro);
  });

  /* Si el tipo elegido ya no está en el montón, se vuelve a todos: si
     no, la lista se quedaría vacía sin que se vea por qué. */
  if (App.tipoElegido && !monton.some(function (a) {
    return App.tipoDeAsunto(a) === App.tipoElegido;
  })) App.tipoElegido = '';

  App.pintarGruposTipo(monton);

  var lista = App.tipoElegido
    ? monton.filter(function (a) { return App.tipoDeAsunto(a) === App.tipoElegido; })
    : monton;

  lista.sort(App.ORDENES[orden]);
  if (rotulo) rotulo.textContent = lista.length;
  var caja = $('lista-abiertos');
  var alto = window.scrollY;   /* fila 119: la lista se queda a la misma altura */
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">' + App.textoVacio() + '</div>';
    App.avisarALosModulos();
    return;
  }
  lista.forEach(function (a) {
    var tapado = window.Reservados && Reservados.tapar(a);
    a._fragmento = tapado ? null : App.fragmentoDeNota(a, palabras);
    var tarjeta = App.tarjetaAsunto(a, 'abierto');
    caja.appendChild(window.Reservados ? Reservados.enTarjeta(tarjeta, a) : tarjeta);
  });
  if (window.scrollY !== alto) window.scrollTo(0, alto);
  App.avisarALosModulos();
};

/* Si el asunto ha salido en la búsqueda SOLO por una nota (ninguna de
   las palabras buscadas está en `buscaSinNotas`), el trocito de la
   nota donde aparece, para enseñar por qué ha salido (fila 73,
   docs/BUSCAR-EN-LAS-NOTAS.md, punto 2.3). null si no hay búsqueda, o
   si ya se explica solo (el nombre, el tercero...). Vale tanto para
   asuntos abiertos como archivados: los dos traen `busca`,
   `buscaSinNotas` y `notasTexto`. */
App.fragmentoDeNota = function (a, palabras) {
  if (!window.Notas) return null;
  return Notas.fragmentoSiSoloEnNota(a.busca, a.buscaSinNotas, a.notasTexto, palabras);
};

/* Dos dibujos para que se vea de un golpe qué es cada fila:
   una carpeta para los asuntos, una hoja para los documentos sueltos. */
App.ICONO_CARPETA =
  '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.6h8.8A1.5 1.5 0 0 1 21 9.1v9A1.5 1.5 0 0 1 19.5 19.6h-15A1.5 1.5 0 0 1 3 18.1z"/></svg>';

App.ICONO_DOCUMENTO =
  '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M13.8 3H7A1.5 1.5 0 0 0 5.5 4.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.7z"/>' +
  '<path d="M13.8 3v4.7h4.7"/></svg>';

App.textoVacio = function () {
  if (!App.E.listaAbiertos.length) return 'No hay asuntos abiertos. Crea el primero en "Nuevo asunto".';
  if (App.tipoElegido) return 'No queda ningún asunto de tipo ' + App.tipoElegido + ' en este montón.';
  if ($('buscar-abiertos').value.trim() || $('filtro-estado').value || $('filtro-plazo').value ||
      ($('filtro-organo') && $('filtro-organo').value)) {
    return 'Ningún asunto coincide con lo que buscas.';
  }
  if (App.E.vista === 'espera') return 'No hay nada esperando a terceros. Mejor así.';
  return 'Nada pendiente de gestionar aquí ahora mismo.';
};

App.tarjetaAsunto = function (a, modo) {
  var div = document.createElement('div');
  div.className = 'tarjeta tarjeta-asunto';
  var tercero = a.ficha.tercero || '';
  var via = App.textoVia(a.ficha);
  var pie = [];
  if (a.leido.fecha) pie.push('Abierto el ' + U.fechaLegible(a.leido.fecha));
  if (tercero) pie.push(tercero);
  else if (a.leido.resto) pie.push(a.leido.resto);
  if (via) pie.push(via);
  if (modo === 'archivado' && a.ruta) pie.push(a.ruta);

  var lado = (modo === 'abierto') ? App.ladoDe(a) : null;
  var dias = (lado && lado.lado === 'terceros') ? App.diasEnEstado(a) : -1;
  var esperaLarga = dias >= App.DIAS_DE_AVISO;
  if (lado && lado.esperando) { /* ya lo dice su marca: «Esperando a Familia desde el 24-sep» */ }
  else if (dias === 0) pie.push('en espera desde hoy');
  else if (dias === 1) pie.push('en espera desde ayer');
  else if (dias > 1) pie.push('en espera desde hace ' + dias + ' días');

  /* El plazo se ve de dos formas: una etiqueta de color arriba, junto
     al tipo y al estado, y la fecha completa en el pie. En el archivo
     no se enseña: allí ya no vence nada. */
  var p = (modo === 'abierto') ? App.plazoDe(a) : null;
  if (p) pie.push('Fecha límite ' + Plazos.legible(p.limite));

  /* Si ha salido en la búsqueda solo por una nota, el trocito donde
     está la palabra, con ella marcada (fila 73, punto 2.3): si no,
     Francisco ve el asunto en los resultados y no sabe por qué. */
  var fragmento = a._fragmento;
  var notaEncontrada = fragmento
    ? '<div class="tarjeta-nota-encontrada">' + U.escapar(fragmento.antes) +
      ' <mark>' + U.escapar(fragmento.palabra) + '</mark> ' + U.escapar(fragmento.despues) + '</div>'
    : '';

  div.innerHTML = App.ICONO_CARPETA +
    '<div class="tarjeta-texto">' +
      '<div class="tarjeta-nombre">' +
        (a.leido.tipo ? '<span class="marca-tipo" title="' + U.escapar(a.leido.tipo) + '">' +
                        U.escapar(Nombres.tipoParaVer(a.leido.tipo, App.E.tipos)) + '</span>' : '') +
        (p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '') +
        (lado && lado.lado === 'terceros' && lado.quien && !lado.esperando
          ? '<span class="marca-quien" title="Lo tiene ahora">' + U.escapar(lado.quien) + '</span>' : '') +
        U.escapar(a.nombre) +
      '</div>' +
      /* Fila 129: el estado es el hito actual (js/estado-hito.js), en su
         propia línea: pulsar el nombre sigue abriendo la ficha. */
      (window.EstadoHito ? '<div class="tarjeta-hito">' + EstadoHito.marcaHTML(a, modo, lado) + '</div>' : '') +
      '<div class="tarjeta-pie' + (esperaLarga ? ' pie-aviso' : '') + '">' +
        U.escapar(pie.join('  ·  ')) + '</div>' +
      notaEncontrada +
    '</div>';

  var acciones = document.createElement('div');
  acciones.className = 'acciones';

  /* En los asuntos abiertos, la vía de comunicación se apunta aquí
     (fila 129: el estado ya no se elige a mano; es el hito actual). En
     el archivo no: allí lo que hay es el rastro de lo que se hizo. */
  if (modo === 'abierto') {
    var bvia = document.createElement('button');
    bvia.className = 'boton' + (a.ficha.via ? ' boton-marcado' : '');
    var v = Nombres.via(a.ficha.via);
    bvia.textContent = v ? v.corto : (a.ficha.via || 'Vía');
    bvia.title = via || 'Apuntar la vía de comunicación preferente';
    bvia.onclick = function () { App.editarVia(a); };
    acciones.appendChild(bvia);

    var bplazo = document.createElement('button');
    bplazo.className = 'boton' + (p ? ' boton-marcado' : '');
    bplazo.textContent = 'Plazo';
    bplazo.title = p ? 'Fecha límite ' + Plazos.legible(p.limite) + ' · ' + p.texto
                     : 'Poner una fecha límite a este asunto';
    bplazo.onclick = function () { App.editarPlazo(a); };
    acciones.appendChild(bplazo);

    var editar = document.createElement('button');
    editar.className = 'boton';
    editar.textContent = 'Editar';
    editar.title = 'Cambiar la fecha, el tipo, la descripción o el tercero';
    editar.onclick = function () { App.editarAsunto(a); };
    acciones.appendChild(editar);
  }

  var copiar = document.createElement('button');
  copiar.className = 'boton';
  copiar.textContent = 'Copiar nombre';
  copiar.title = 'Para pegarlo como asunto del correo';
  copiar.onclick = function () {
    U.copiar(a.nombre).then(function (ok) {
      if (ok) U.aviso('Nombre copiado.', 'bueno');
    });
  };
  acciones.appendChild(copiar);

  var ver = document.createElement('button');
  ver.className = 'boton';
  ver.textContent = 'Documentos';
  ver.onclick = function () { App.verDocumentos(a); };
  acciones.appendChild(ver);

  var principal = document.createElement('button');
  principal.className = 'boton boton-principal';
  principal.textContent = modo === 'abierto' ? 'Cerrar' : 'Reabrir';
  principal.onclick = async function () {
    await U.mientrasGuarda(principal, function () {
      return modo === 'abierto' ? App.cerrarAsunto(a) : App.reabrirAsunto(a);
    });
  };
  acciones.appendChild(principal);

  div.appendChild(acciones);
  if (window.EstadoHito) EstadoHito.engancharMarca(div, a, modo);
  /* Con una acción larga en marcha sobre este asunto (fila 100,
     App.conOcupado), la tarjeta sale con sus botones apagados aunque
     se repinte. */
  if (App.E.ocupados && App.E.ocupados[a.nombre]) {
    div.classList.add('tarjeta-ocupada');
    Array.prototype.forEach.call(div.querySelectorAll('button, select'), function (b) { b.disabled = true; });
  }
  return div;
};

App.verDocumentos = async function (a, opciones) {
  await Documentos.abrir(a, opciones);
};

$('buscar-abiertos').oninput = function () {
  App.pintarAbiertos();
  App.pintarSueltos();
};
$('filtro-estado').onchange = function () { App.pintarAbiertos(); };
$('filtro-plazo').onchange = function () { App.pintarAbiertos(); };
if ($('filtro-organo')) $('filtro-organo').onchange = function () { App.pintarAbiertos(); };

$('orden-abiertos').onchange = function () {
  try { window.localStorage.setItem('orden-abiertos', this.value); } catch (e) {}
  App.pintarAbiertos();
};
$('btn-recargar').onclick = function () { App.verAbiertos(); };
