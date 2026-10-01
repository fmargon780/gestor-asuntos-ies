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

/* Fila 241 (docs/EXPORTAR-ASUNTOS.md): el filtro «Fechas» (Desde, Hasta),
   sobre la fecha de inicio del asunto (la del nombre de la carpeta,
   AAMMDD). Los dos extremos entran; cualquiera puede ir vacío. */
App.fechasDelFiltro = function () {
  var d = $('filtro-fecha-desde'), h = $('filtro-fecha-hasta');
  return { desde: d ? d.value : '', hasta: h ? h.value : '' };
};

/* AAMMDD (el nombre de la carpeta) → 'AAAA-MM-DD', o '' si no es una fecha. */
App.fechaIsoDeNombre = function (aammdd) {
  var m = String(aammdd || '').match(/^(\d{2})(\d{2})(\d{2})$/);
  return m ? '20' + m[1] + '-' + m[2] + '-' + m[3] : '';
};

/* ¿La fecha de inicio (ISO) cae dentro de Desde–Hasta? Sin ningún
   extremo, todo pasa; con alguno, un asunto sin fecha no pasa. */
App.pasaFiltroFechas = function (iso, desde, hasta) {
  if (!desde && !hasta) return true;
  if (!iso) return false;
  if (desde && iso < desde) return false;
  if (hasta && iso > hasta) return false;
  return true;
};

/* «del 1-oct-2026 al 31-oct-2026», «desde el 1-oct-2026», «hasta el 31-oct-2026». */
App.textoDeFechas = function (desde, hasta) {
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function bonita(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? parseInt(m[3], 10) + '-' + MESES[parseInt(m[2], 10) - 1] + '-' + m[1] : String(iso || '');
  }
  if (desde && hasta) return 'del ' + bonita(desde) + ' al ' + bonita(hasta);
  if (desde) return 'desde el ' + bonita(desde);
  if (hasta) return 'hasta el ' + bonita(hasta);
  return '';
};

/* Los seis filtros de "Filtros" en Inicio (Responsable, Situación,
   Plazo, Lo encarga, Tipo de asunto y Fechas), en un solo sitio (fila 216,
   docs/FILTROS-EN-TODAS-LAS-PESTANAS.md): los usan tanto
   App.listaAbiertosFiltrada ("Todos los abiertos") como
   InicioTabla.calcular ("En Administración", "En espera" y "Dormidos").
   `hito` es el hito actual del asunto si ya se conoce (el de
   QueMeToca.clasificar, en "En Administración"/"En espera"); si no se
   pasa, se calcula aquí (Hitos.hitoActualDeAsunto), pero solo si hace
   falta para el filtro de Responsable, para que también valga en
   "Todos los abiertos" y "Dormidos". Un asunto sin hito actual no pasa
   si hay un responsable elegido. */
App.pasaFiltrosInicio = function (a, hito) {
  var filtro = $('filtro-estado').value;
  var plazo = $('filtro-plazo').value;
  var organo = $('filtro-organo') ? $('filtro-organo').value : '';   /* fila 134 */
  var tipo = $('filtro-tipo-asunto') ? $('filtro-tipo-asunto').value : '';   /* fila 192 */
  var resp = window.QueMeToca ? QueMeToca.leerFiltroResponsable() : '';

  if (!Plazos.pasaFiltro(a.ficha.limite || '', plazo)) return false;
  if (organo && window.TiposOrgano && !TiposOrgano.pasaFiltro(App.tipoDeAsunto(a), organo)) return false;
  if (tipo && App.tipoDeAsunto(a) !== tipo) return false;
  var fechas = App.fechasDelFiltro();
  if (!App.pasaFiltroFechas(App.fechaIsoDeNombre(a.leido && a.leido.fecha), fechas.desde, fechas.hasta)) return false;   /* fila 241 */
  if (!App.pasaFiltroMonton(a, filtro)) return false;
  if (resp) {
    if (hito === undefined && window.Hitos && Hitos.hitoActualDeAsunto) hito = Hitos.hitoActualDeAsunto(a);
    if (!hito || !window.HitosAdministracion) return false;
    var ajustes = (window.Hitos && Hitos.ultimosLeidos && Hitos.ultimosLeidos()) ? Hitos.ultimosLeidos().ajustes : null;
    if (!HitosAdministracion.cuentaPara(hito.responsable, resp, ajustes)) return false;
  }
  return true;
};

/* La lista de "Todos los abiertos", filtrada y SIN ordenar todavía
   (fila 209, docs/INICIO-EN-PESTANAS.md): la usa App.pintarAbiertos
   para pintar la pestaña, y js/inicio-tabla.js para el número de su
   pestaña aunque no sea la activa ahora mismo, sin repintar la tabla
   dos veces. Incluye el filtro-de-aviso (el chip "Filtrado por…") si
   hay uno activo (js/inicio-tabla.js, InicioTabla.avisoActivo). */
App.listaAbiertosFiltrada = function () {
  var texto = U.normalizar($('buscar-abiertos').value);
  var aviso = (window.InicioTabla && InicioTabla.avisoActivo) ? InicioTabla.avisoActivo() : null;

  return App.E.listaAbiertos.filter(function (a) {
    if (texto && App.textoBusquedaSimple(a).indexOf(texto) === -1) return false;
    if (aviso && !aviso.nombres.has(a.nombre)) return false;
    return App.pasaFiltrosInicio(a);
  });
};

/* Pinta la pestaña "Todos los abiertos" (fila 209): sigue siendo LA
   función que la pinta de verdad, con su nombre de siempre, porque
   js/unir-asuntos.js la envuelve (U.envolver(App, 'App.pintarAbiertos', ...))
   para repintar el aviso de duplicados detrás de cada pintado.
   js/inicio-tabla.js la llama cuando esa es la pestaña activa. */
App.pintarAbiertos = function () {
  if (window.Reservados) Reservados.pintarBoton();   /* «Mostrar reservados» (fila 135) */
  if (!App.listaALaVista()) { App.E.listaPendiente = true; return; }
  App.E.listaPendiente = false;
  App.pintarFiltroTipoAsunto(App.E.listaAbiertos);

  var rotulo = $('cuenta-lista-abiertos');
  var orden = App.ordenElegido();
  $('orden-abiertos').value = orden;

  var lista = App.listaAbiertosFiltrada();
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
  lista.forEach(function (a) { caja.appendChild(App.filaTablaAsunto(a, { pestana: 'todos' })); });
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
      ($('filtro-tipo-asunto') && $('filtro-tipo-asunto').value) ||
      App.fechasDelFiltro().desde || App.fechasDelFiltro().hasta) {
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

/* Los días de espera de la pestaña "En espera" (fila 209; antes
   filaEsperamos, js/inicio.js): rojo desde 15 días, ámbar desde 7. */
var DIAS_ESPERA_ROJO = 15;
var DIAS_ESPERA_AMBAR = 7;
function claseDias(dias) {
  if (dias >= DIAS_ESPERA_ROJO) return 'inicio-dias-rojo';
  if (dias >= DIAS_ESPERA_AMBAR) return 'inicio-dias-ambar';
  return '';
}

/* La columna "Le toca a", para las cuatro pestañas (fila 209, apartado
   3bis de docs/INICIO-EN-PESTANAS.md): arregla la fuga de privacidad
   que tenía filaEsperamos en js/inicio.js (llamaba a
   Hitos.resolverResponsable directamente, que para el papel "tercero"
   devuelve el nombre real, sin pasar por Reservados). `lado.quien` y
   `lado.esperando.nombre` ya vienen de Hitos.ladoDeAsunto →
   nombreVisible (js/hitos-a-quien.js), que para los tres papeles fijos
   (tercero, tutor, relacionado) da siempre un nombre genérico del
   papel, nunca el nombre real de la persona: así que hoy no hay fuga
   por ese camino. Aun así, si el asunto está tapado y quien "le toca"
   es uno de esos tres papeles, se fuerza aquí el nombre genérico (en
   vez de fiarse de lo que traiga `lado`), para que un cambio futuro en
   cómo se calcula `lado` no pueda volver a abrir la fuga. */
var PAPEL_GENERICO = { tercero: 'Tercero', tutor: 'Familia', relacionado: 'Relacionado' };

App.textoLeTocaA = function (a, lado) {
  if (!lado || lado.lado !== 'terceros') return 'Administración';
  var tapado = window.Reservados && Reservados.tapar(a);
  var idResp = lado.esperando ? lado.esperando.a : '';
  if (tapado && PAPEL_GENERICO[idResp]) return PAPEL_GENERICO[idResp];
  return lado.esperando ? lado.esperando.nombre : (lado.quien || '');
};

/* El <tr> de un asunto en la tabla única de Inicio (fila 209): Plazo,
   Tercero (pulsable, con candado si es reservado), Tipo, Hito actual
   (EstadoHito.marcaHTML, clic incluido), Le toca a, Inicio (fecha de
   apertura) y, al final, el menú de tres puntos con «Copiar el
   nombre» y «Archivar».

   `opciones`: { pestana: 'adm'|'esp'|'todos'|'dorm', hito, dias }.
   - pestana 'adm': `hito` es el hito de Administración de este asunto
     (para la columna Plazo y para pulsar la fila, que abre su mesa).
   - pestana 'esp': `hito` es el hito que espera a otro, `dias` los que
     lleva esperando (columna Plazo).
   - pestana 'dorm': `dias` son los que lleva sin novedades (para la
     columna Plazo, solo si el asunto no tiene plazo propio). */
App.filaTablaAsunto = function (a, opciones) {
  opciones = opciones || {};
  var pestana = opciones.pestana || 'todos';

  var tr = document.createElement('tr');
  tr.className = 'inicio-tabla-fila';
  tr.dataset.asunto = a.nombre;
  if (opciones.hito) tr.dataset.hito = opciones.hito.id;

  var tapado = window.Reservados && Reservados.tapar(a);
  if (tapado) tr.classList.add('inicio-tabla-fila-tapada');

  /* ---------- Plazo ---------- */
  var tdPlazo = document.createElement('td');
  if (pestana === 'adm' && opciones.hito) {
    var pm = Plazos.etiquetaMeToca(opciones.hito.fecha);
    var textoPlazo = pm.clase ? pm.texto : 'Sin plazo';   /* "Sin fecha" → "Sin plazo" */
    tdPlazo.innerHTML = '<span class="marca-plazo' + (pm.clase ? ' ' + pm.clase : '') + '">' +
      U.escapar(textoPlazo) + '</span>';
  } else if (pestana === 'esp' && typeof opciones.dias === 'number') {
    var claseEspera = claseDias(opciones.dias);
    var textoEspera = opciones.dias === 1 ? '1 día' : opciones.dias + ' días';
    tdPlazo.innerHTML = '<span class="marca-plazo' + (claseEspera ? ' ' + claseEspera : '') + '">' +
      U.escapar(textoEspera) + '</span>';
  } else {
    var p = App.plazoDe(a);
    if (p) {
      tdPlazo.innerHTML = '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>';
    } else if (pestana === 'dorm' && typeof opciones.dias === 'number') {
      tdPlazo.innerHTML = '<span class="marca-plazo">Sin novedades desde hace ' + opciones.dias + ' días</span>';
    }
  }
  tr.appendChild(tdPlazo);

  /* ---------- Tercero ---------- */
  var tdTercero = document.createElement('td');
  tdTercero.className = 'inicio-tabla-tercero';
  var spanTercero = document.createElement('span');
  /* «.tarjeta-nombre» se mantiene (además de «.nombre-pulsable», la
     nueva) por compatibilidad: es como muchas pruebas de pruebas/
     encuentran y pulsan el asunto abierto, sin acotar por columna. */
  spanTercero.className = 'nombre-pulsable tarjeta-nombre';
  spanTercero.title = pestana === 'adm' ? 'Abrir este hito' : 'Abrir la ficha de este asunto';
  /* El candado se enseña siempre que el asunto sea reservado
     (Reservados.es), tapado o no; lo que cambia con `tapado` es si se
     enseña también el tercero de verdad o el texto genérico. */
  var candadoTercero = window.Reservados ? Reservados.candadoHtml(a) : '';
  if (tapado) {
    spanTercero.innerHTML = candadoTercero + '<b>Reservado</b>';
  } else {
    spanTercero.innerHTML = candadoTercero + '<b>' + U.escapar(QueMeToca.terceroDe(a) || a.nombre) + '</b>';
  }
  tdTercero.appendChild(spanTercero);
  tr.appendChild(tdTercero);

  /* ---------- Tipo ---------- */
  var tdTipo = document.createElement('td');
  if (a.leido.tipo) {
    tdTipo.innerHTML = '<span class="marca-tipo" title="' + U.escapar(a.leido.tipo) + '">' +
      U.escapar(Nombres.tipoParaVer(a.leido.tipo, App.E.tipos)) + '</span>';
  }
  /* Fila 239: el número del asunto, junto al tipo. */
  var numeroDeAsunto = (a.ficha && a.ficha.numero) || (a.leido && a.leido.numero) || '';
  if (numeroDeAsunto) tdTipo.innerHTML += '<span class="marca-numero" title="Número del asunto">' + U.escapar(numeroDeAsunto) + '</span>';
  tr.appendChild(tdTipo);

  /* ---------- Hito actual ---------- */
  var lado = App.ladoDe(a);
  var tdHito = document.createElement('td');
  tdHito.className = 'inicio-tabla-hito';
  tdHito.innerHTML = window.EstadoHito ? EstadoHito.marcaHTML(a, 'abierto', lado) : '';
  tr.appendChild(tdHito);
  if (window.EstadoHito) EstadoHito.engancharMarca(tdHito, a, 'abierto');

  /* ---------- Le toca a ---------- */
  var tdQuien = document.createElement('td');
  tdQuien.textContent = App.textoLeTocaA(a, lado);
  tr.appendChild(tdQuien);

  /* ---------- Inicio ---------- */
  var tdInicio = document.createElement('td');
  tdInicio.textContent = a.leido.fecha ? U.fechaCorta(U.fechaLegible(a.leido.fecha)) : '';
  tr.appendChild(tdInicio);

  /* ---------- ⋮ ---------- */
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

  /* Pulsar la fila entera (para que "Le toca a" e "Inicio" también
     abran, no solo el nombre): en "En Administración", la mesa del
     hito; en las demás, la ficha. Los botones de dentro (el menú, el
     propio "Hito actual") paran la propagación o quedan fuera de esta
     comprobación, así que no abren nada por debajo. */
  tr.onclick = function (ev) {
    if (ev.target.closest('button, .inicio-tabla-menu, a, input, select, textarea')) return;
    if (pestana === 'adm' && opciones.hito) QueMeToca.abrirMesaDelHito(a, opciones.hito);
    else App.abrirFicha(a, 'abierto');
  };

  /* Con una acción larga en marcha sobre este asunto (fila 100,
     App.conOcupado), la fila sale con sus botones apagados aunque se
     repinte. */
  if (App.E.ocupados && App.E.ocupados[a.nombre]) {
    tr.classList.add('inicio-tabla-fila-ocupada');
    Array.prototype.forEach.call(tr.querySelectorAll('button'), function (b) { b.disabled = true; });
  }

  return tr;
};

/* Fila 209: la tabla es una sola, pero solo una pestaña está activa
   cada vez (js/inicio-tabla.js, InicioTabla). Estos filtros (Situación,
   Plazo, Lo encarga, Tipo de asunto, el buscador y "Ordenar") solo
   afectan de verdad a la pestaña "Todos los abiertos" (App.pintarAbiertos,
   sin cambios en su filtrado), pero repintar SIEMPRE esa pestaña
   directamente, sin mirar cuál está activa, dejaría la tabla enseñando
   "Todos los abiertos" aunque las pestañas siguieran marcando otra
   como activa. Por eso pasan por InicioTabla.pintar(), que repinta la
   pestaña que de verdad está activa (y esa, si es "todos", ya llama a
   App.pintarAbiertos() por dentro). */
function repintarLaPestanaActiva() {
  if (window.InicioTabla) InicioTabla.pintar();
  else App.pintarAbiertos();
}
/* La usa también el filtro Responsable (js/inicio-tabla.js), que no
   vive en este fichero: fila 216, punto 4. */
App.repintarLaPestanaActiva = repintarLaPestanaActiva;

$('buscar-abiertos').oninput = function () {
  repintarLaPestanaActiva();
  App.pintarSueltos();
};
$('filtro-estado').onchange = function () { repintarLaPestanaActiva(); };
$('filtro-plazo').onchange = function () { repintarLaPestanaActiva(); };
if ($('filtro-organo')) $('filtro-organo').onchange = function () { repintarLaPestanaActiva(); };
if ($('filtro-tipo-asunto')) $('filtro-tipo-asunto').onchange = function () { repintarLaPestanaActiva(); };
['filtro-fecha-desde', 'filtro-fecha-hasta'].forEach(function (id) {   /* fila 241 */
  if ($(id)) $(id).onchange = function () { repintarLaPestanaActiva(); };
});

$('orden-abiertos').onchange = function () {
  try { window.localStorage.setItem('orden-abiertos', this.value); } catch (e) {}
  repintarLaPestanaActiva();
};

/* Pulsar la cabecera "Inicio" de la tabla ordena por fecha de inicio,
   y otra vez, al revés (fila 209, boceto docs/boceto-inicio-2.html). */
if ($('th-inicio')) {
  $('th-inicio').classList.add('inicio-th-pulsable');
  $('th-inicio').onclick = function () {
    var nuevo = App.ordenElegido() === 'fecha-asc' ? 'fecha-desc' : 'fecha-asc';
    $('orden-abiertos').value = nuevo;
    try { window.localStorage.setItem('orden-abiertos', nuevo); } catch (e) {}
    repintarLaPestanaActiva();
  };
}
$('btn-recargar').onclick = function () { App.verAbiertos(); };
