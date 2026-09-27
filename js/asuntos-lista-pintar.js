/* ============================================================
   asuntos-lista-pintar.js — pintar la tabla "Todos los asuntos
   abiertos" y la tarjeta de cada asunto del ARCHIVO.

   Hasta la fila 192 (docs/INICIO-CUATRO-BLOQUES.md, apartado 5), aquí
   se pintaba la lista de tarjetas de "Asuntos abiertos" (un montón a
   la vez). Ahora App.pintarAbiertos pinta la TABLA de Inicio
   (#inicio-tabla-cuerpo, App.filaTablaAsunto), sin montones: todos los
   asuntos abiertos a la vez, con los filtros de siempre (Situación,
   Plazo, Lo encarga, Tipo de asunto) y el buscador de la cabecera,
   reutilizando el mismo mecanismo simple de nombre+tipo+tercero que
   "Me toca"/"Esperamos a otros" (js/inicio.js, decisión 5 de la fila
   192): se abandona el filtro rico por palabras+notas.

   App.tarjetaAsunto, más abajo, sigue viva solo para el ARCHIVO
   (js/archivo-personas.js).

   Sacado tal cual de js/asuntos-lista.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md). Se carga justo detrás de él.
   ============================================================ */

/* Nombre, tipo y tercero de un asunto, ya normalizados: tapado, sin el
   tercero (Reservados.textoDeBusqueda), igual que en js/inicio.js
   (App.textoDelAsunto de ese fichero). Se repite aquí, pequeña, para no
   depender del orden de carga entre los dos ficheros. */
App.textoBusquedaSimple = function (a) {
  if (window.Reservados && Reservados.tapar(a)) return Reservados.textoDeBusqueda(a);
  var tercero = window.QueMeToca ? QueMeToca.terceroDe(a) : '';
  return U.normalizar([a.nombre, a.leido && a.leido.tipo, tercero].filter(Boolean).join(' '));
};

App.pintarAbiertos = function () {
  if (window.Reservados) Reservados.pintarBoton();   /* «Mostrar reservados» (fila 135) */
  if (!App.listaALaVista()) { App.E.listaPendiente = true; return; }
  App.E.listaPendiente = false;
  App.pintarFiltroTipoAsunto(App.E.listaAbiertos);

  var texto = U.normalizar($('buscar-abiertos').value);
  var rotulo = $('cuenta-lista-abiertos');
  var orden = App.ordenElegido();
  $('orden-abiertos').value = orden;
  var filtro = $('filtro-estado').value;
  var plazo = $('filtro-plazo').value;
  var organo = $('filtro-organo') ? $('filtro-organo').value : '';   /* fila 134 */
  var tipo = $('filtro-tipo-asunto') ? $('filtro-tipo-asunto').value : '';   /* fila 192 */

  var lista = App.E.listaAbiertos.filter(function (a) {
    if (texto && App.textoBusquedaSimple(a).indexOf(texto) === -1) return false;
    if (!Plazos.pasaFiltro(a.ficha.limite || '', plazo)) return false;
    if (organo && window.TiposOrgano && !TiposOrgano.pasaFiltro(App.tipoDeAsunto(a), organo)) return false;
    if (tipo && App.tipoDeAsunto(a) !== tipo) return false;
    return App.pasaFiltroMonton(a, filtro);
  });

  lista.sort(App.ORDENES[orden]);
  if (rotulo) rotulo.textContent = lista.length;
  var caja = $('inicio-tabla-cuerpo');
  var alto = window.scrollY;   /* fila 119: la lista se queda a la misma altura */
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<tr><td colspan="7" class="vacio">' + App.textoVacio() + '</td></tr>';
    App.avisarALosModulos();
    return;
  }
  lista.forEach(function (a) { caja.appendChild(App.filaTablaAsunto(a)); });
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
  if ($('buscar-abiertos').value.trim() || $('filtro-estado').value || $('filtro-plazo').value ||
      ($('filtro-organo') && $('filtro-organo').value) ||
      ($('filtro-tipo-asunto') && $('filtro-tipo-asunto').value)) {
    return 'Ningún asunto coincide con lo que buscas.';
  }
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
    editar.textContent = 'Cambiar';
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

/* ============================================================
   LA TABLA "TODOS LOS ASUNTOS ABIERTOS" (fila 192, apartado 5)
   ============================================================ */

/* El filtro «Tipo de asunto» (antes las tarjetas «Por tipo de
   asunto», App.pintarGruposTipo): mismos montones
   (App.montonesPorTipo), un <select> en vez de tarjetas. Guarda y
   restaura el valor elegido, igual que App.pintarFiltroEstado. */
App.pintarFiltroTipoAsunto = function (lista) {
  var sel = $('filtro-tipo-asunto');
  if (!sel) return;
  var antes = sel.value;
  var grupos = App.montonesPorTipo(lista);
  sel.innerHTML = ['<option value="">Todos</option>'].concat(
    grupos.map(function (g) {
      var texto = Nombres.tipoParaVer(g.tipo, App.E.tipos);
      return '<option value="' + U.escapar(g.tipo) + '" title="' + U.escapar(g.tipo) + '">' +
        U.escapar(texto) + '</option>';
    })
  ).join('');
  sel.value = antes;
  if (sel.selectedIndex === -1) sel.value = '';
};

/* El <tr> de un asunto en la tabla: Asunto (pulsable, con candado si
   es reservado), Tipo (con el nombre largo al pasar el ratón, como
   antes), Hito actual (EstadoHito.marcaHTML, clic incluido), Le toca a
   (quién tiene ahora el hito, o Administración), Plazo, Abierto y, al
   final, el menú de tres puntos con «Copiar el nombre» y «Archivar». */
App.filaTablaAsunto = function (a) {
  var tr = document.createElement('tr');
  tr.className = 'inicio-tabla-fila';

  var tapado = window.Reservados && Reservados.tapar(a);
  if (tapado) tr.classList.add('inicio-tabla-fila-tapada');
  var candado = window.Reservados ? Reservados.candadoHtml(a) : '';
  var nombreVer = window.Reservados ? Reservados.nombreParaVer(a) : a.nombre;

  var tdNombre = document.createElement('td');
  tdNombre.className = 'inicio-tabla-nombre';
  var spanNombre = document.createElement('span');
  /* «.tarjeta-nombre» se mantiene (además de «.nombre-pulsable», la
     nueva) por compatibilidad: es como muchas pruebas de pruebas/
     encuentran y pulsan el nombre de un asunto abierto, sin acotar por
     «#lista-abiertos» (que ya no existe). */
  spanNombre.className = 'nombre-pulsable tarjeta-nombre';
  spanNombre.title = 'Abrir la ficha de este asunto';
  spanNombre.innerHTML = candado + U.escapar(nombreVer);
  spanNombre.onclick = function () { App.abrirFicha(a, 'abierto'); };
  tdNombre.appendChild(spanNombre);
  tr.appendChild(tdNombre);

  var tdTipo = document.createElement('td');
  if (a.leido.tipo) {
    tdTipo.innerHTML = '<span class="marca-tipo" title="' + U.escapar(a.leido.tipo) + '">' +
      U.escapar(Nombres.tipoParaVer(a.leido.tipo, App.E.tipos)) + '</span>';
  }
  tr.appendChild(tdTipo);

  var lado = App.ladoDe(a);
  var tdHito = document.createElement('td');
  tdHito.className = 'inicio-tabla-hito';
  tdHito.innerHTML = window.EstadoHito ? EstadoHito.marcaHTML(a, 'abierto', lado) : '';
  tr.appendChild(tdHito);
  if (window.EstadoHito) EstadoHito.engancharMarca(tdHito, a, 'abierto');

  var tdQuien = document.createElement('td');
  var quien = lado.esperando ? lado.esperando.nombre
    : (lado.lado === 'terceros' ? lado.quien : 'Administración');
  tdQuien.textContent = quien || '';
  tr.appendChild(tdQuien);

  var p = App.plazoDe(a);
  var tdPlazo = document.createElement('td');
  tdPlazo.innerHTML = p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '';
  tr.appendChild(tdPlazo);

  var tdAbierto = document.createElement('td');
  tdAbierto.textContent = a.leido.fecha ? U.fechaCorta(U.fechaLegible(a.leido.fecha)) : '';
  tr.appendChild(tdAbierto);

  var tdMenu = document.createElement('td');
  tdMenu.className = 'inicio-tabla-menu';
  var copiar = document.createElement('button');
  copiar.type = 'button';
  copiar.textContent = 'Copiar el nombre';
  copiar.onclick = function () {
    U.copiar(a.nombre).then(function (ok) { if (ok) U.aviso('Nombre copiado.', 'bueno'); });
  };
  var archivar = document.createElement('button');
  archivar.type = 'button';
  archivar.textContent = 'Archivar';
  archivar.onclick = async function () {
    await U.mientrasGuarda(archivar, function () { return App.cerrarAsunto(a); });
  };
  tdMenu.appendChild(U.menuDeAcciones([copiar, archivar]));
  tr.appendChild(tdMenu);

  /* Con una acción larga en marcha sobre este asunto (fila 100,
     App.conOcupado), la fila sale con sus botones apagados aunque se
     repinte. */
  if (App.E.ocupados && App.E.ocupados[a.nombre]) {
    tr.classList.add('inicio-tabla-fila-ocupada');
    Array.prototype.forEach.call(tr.querySelectorAll('button'), function (b) { b.disabled = true; });
  }

  return tr;
};

$('buscar-abiertos').oninput = function () {
  App.pintarAbiertos();
  App.pintarSueltos();
};
$('filtro-estado').onchange = function () { App.pintarAbiertos(); };
$('filtro-plazo').onchange = function () { App.pintarAbiertos(); };
if ($('filtro-organo')) $('filtro-organo').onchange = function () { App.pintarAbiertos(); };
if ($('filtro-tipo-asunto')) $('filtro-tipo-asunto').onchange = function () { App.pintarAbiertos(); };

$('orden-abiertos').onchange = function () {
  try { window.localStorage.setItem('orden-abiertos', this.value); } catch (e) {}
  App.pintarAbiertos();
};
$('btn-recargar').onclick = function () { App.verAbiertos(); };
