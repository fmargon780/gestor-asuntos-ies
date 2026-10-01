/* ============================================================
   usabilidad.js — la comodidad de la pantalla.

   Aquí vive todo lo que hace la aplicación más cómoda de usar, y
   nada más: el botón de Volver, el de Cancelar, las etiquetas de lo
   que se está filtrando, la vista compacta de los asuntos abiertos y
   la tecla Escape.

   No toca las carpetas, ni los datos, ni los nombres: de eso se
   sigue encargando la propia aplicación. Aquí solo se mira y se pulsa
   lo que ya hay en la página, así que se puede leer y cambiar sin
   miedo a estropear el trabajo de verdad.

   Se carga ANTES que el resto de la aplicación, para que sus escuchas
   se enteren de las cosas antes de que la pantalla cambie.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  function recordar(clave, valor) {
    try { window.localStorage.setItem(clave, valor); } catch (e) {}
  }

  function recordado(clave) {
    try { return window.localStorage.getItem(clave); } catch (e) { return null; }
  }

  /* ==========================================================
     1. BOTONES QUE NO ESTABAN EN LA PÁGINA

     Se añaden desde aquí para no repetirlos en el html.
     ========================================================== */

  /* Cada cabecera se parte en dos: a la izquierda el botón de Volver y
     el título; a la derecha, lo que ya hubiera. Inicio no lleva Volver
     (fila 194: es la pantalla de llegada, no hay «atrás» desde ahí). */
  function prepararCabeceras() {
    Array.prototype.forEach.call(document.querySelectorAll('.pantalla .cabecera'), function (cab) {
      var titulo = cab.querySelector('h2');
      if (!titulo) return;
      var pantalla = cab.closest('.pantalla');
      if (pantalla && pantalla.id === 'pantalla-abiertos') return;
      var izq = document.createElement('div');
      izq.className = 'cabecera-izq';
      var volver = document.createElement('button');
      volver.type = 'button';
      volver.className = 'boton boton-volver';
      volver.textContent = '← Volver';
      volver.title = 'Volver a la pantalla anterior';
      /* Nuevo asunto ya tiene su propio Cancelar (deja el formulario
         limpio, devuelve el documento suelto pendiente…): el Volver de
         su cabecera hace lo mismo, no un volver a pelo. */
      volver.onclick = (pantalla && pantalla.id === 'pantalla-nuevo')
        ? cancelarNuevo
        : function () { if (window.Navegacion) Navegacion.volver('abiertos'); };
      cab.insertBefore(izq, titulo);
      izq.appendChild(volver);
      izq.appendChild(titulo);
    });
  }

  prepararCabeceras();

  /* Los tres buscadores pasan a ser campos de búsqueda: así el propio
     navegador les pone su aspa para vaciarlos de un clic. */
  ['buscar-abiertos', 'buscar-archivo', 'buscar-personas'].forEach(function (id) {
    var c = $(id);
    if (c) c.type = 'search';
  });

  /* La barra que dice qué se está filtrando, justo debajo de la
     cabecera de Asuntos abiertos. */
  var barraFiltros = document.createElement('div');
  barraFiltros.id = 'filtros-puestos';
  barraFiltros.className = 'filtros-puestos oculto';
  var pantallaAbiertos = $('pantalla-abiertos');
  if (pantallaAbiertos && pantallaAbiertos.querySelector('.cabecera')) {
    pantallaAbiertos.querySelector('.cabecera').insertAdjacentElement('afterend', barraFiltros);
  }

  /* Cancelar, en la cabecera de Nuevo asunto: vale desde el primer
     paso, sin tener que llegar al final del formulario. */
  var cancelarArriba = document.createElement('button');
  cancelarArriba.type = 'button';
  cancelarArriba.className = 'boton';
  cancelarArriba.textContent = 'Cancelar';
  cancelarArriba.title = 'Dejar este asunto sin crear y volver';
  cancelarArriba.onclick = cancelarNuevo;
  var cabNuevo = $('pantalla-nuevo') && $('pantalla-nuevo').querySelector('.cabecera');
  if (cabNuevo) {
    var acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.appendChild(cancelarArriba);
    cabNuevo.appendChild(acciones);
  }

  /* Y otro Cancelar abajo, al lado de Crear el asunto, que es donde
     se busca cuando uno se arrepiente al final. */
  var btnCrear = $('btn-crear');
  if (btnCrear) {
    var fila = document.createElement('div');
    fila.className = 'botones-formulario';
    btnCrear.parentNode.insertBefore(fila, btnCrear);
    var cancelarAbajo = document.createElement('button');
    cancelarAbajo.type = 'button';
    cancelarAbajo.className = 'boton';
    cancelarAbajo.textContent = 'Cancelar';
    cancelarAbajo.onclick = cancelarNuevo;
    btnCrear.classList.remove('boton-ancho');
    fila.appendChild(cancelarAbajo);
    fila.appendChild(btnCrear);
  }

  /* ==========================================================
     2. VOLVER

     Fila 194: el «Volver» de todas las pantallas (menos Inicio) usa
     js/navegacion.js, el mismo mecanismo que ya usaba la ficha de
     asunto, enganchado ahora dentro de la propia App.ir (js/nucleo.js).
     Ya no hace falta un historial propio aquí.
     ========================================================== */

  /* ==========================================================
     3. CANCELAR EL ASUNTO QUE SE ESTABA CREANDO
     ========================================================== */

  function cancelarNuevo() {
    /* Si se había traído un documento suelto, se le dice a la
       aplicación que lo deje donde estaba. */
    var dejarlo = $('aviso-pendiente') &&
      $('aviso-pendiente').querySelector('.boton');
    if (dejarlo && !$('aviso-pendiente').classList.contains('oculto')) dejarlo.click();

    ['campo-descripcion', 'campo-via-dato', 'buscar-tercero'].forEach(function (id) {
      if ($(id)) $(id).value = '';
    });
    if ($('resultados-tercero')) $('resultados-tercero').innerHTML = '';
    /* Fila 231: solo se esconde lo que empieza escondido. bloque-tipos,
       bloque-tercero y bloque-detalles están siempre a la vista desde las
       filas 197 y 215; esconderlos aquí dejaba la siguiente entrada a
       Nuevo asunto sin buscador ni parrilla. */
    ['bloque-grupo', 'tercero-elegido']
      .forEach(function (id) { if ($(id)) $(id).classList.add('oculto'); });
    Array.prototype.forEach.call(document.querySelectorAll('.categoria-boton.elegido'),
      function (b) { b.classList.remove('elegido'); });

    if (window.Navegacion) Navegacion.volver('abiertos');
    else {
      var p = document.querySelector('.pestana[data-pantalla="abiertos"]');
      if (p) p.click();
    }
  }

  /* ¿Hay algo escrito en Nuevo asunto que se perdería al salir? Solo
     se mira lo que de verdad cuesta volver a escribir. */
  function hayCambiosSinGuardarEnNuevo() {
    if ($('campo-descripcion') && $('campo-descripcion').value.trim()) return true;
    if ($('tercero-elegido') && !$('tercero-elegido').classList.contains('oculto')) return true;
    if (document.querySelector('.categoria-boton.elegido')) return true;
    return false;
  }

  /* Escape en Nuevo asunto: si no hay nada escrito, sale sin más. Si
     hay algo, pregunta antes de tirarlo (el mismo cuadro de siempre). */
  function salirDeNuevoConEscape() {
    if (!hayCambiosSinGuardarEnNuevo()) { cancelarNuevo(); return; }
    U.preguntar('¿Salir sin guardar?',
      '<p>Se perderá lo escrito en este asunto nuevo.</p>', 'Salir sin guardar')
      .then(function (si) { if (si) cancelarNuevo(); });
  }

  /* ==========================================================
     5. LO QUE SE ESTÁ FILTRANDO

     Una lista corta sin saber por qué es un susto. Cada filtro puesto
     se enseña con su aspa, con el recuento al lado, y hay un botón
     para quitarlos todos de una vez.
     ========================================================== */

  function avisarDelCambio(campo) {
    campo.dispatchEvent(new Event((campo.tagName === 'SELECT' || campo.type === 'date') ? 'change' : 'input',
                                  { bubbles: true }));
  }

  function etiqueta(texto, alQuitar) {
    var s = document.createElement('span');
    s.className = 'chip';
    s.appendChild(document.createTextNode(texto));
    var x = document.createElement('button');
    x.type = 'button';
    x.className = 'chip-x';
    x.textContent = '×';
    x.title = 'Quitar este filtro';
    x.onclick = alQuitar;
    s.appendChild(x);
    return s;
  }

  function limpiarFiltros() {
    var q = $('buscar-abiertos'), f = $('filtro-estado'), p = $('filtro-plazo');
    if (f && f.value) { f.value = ''; avisarDelCambio(f); }
    if (p && p.value) { p.value = ''; avisarDelCambio(p); }
    var o = $('filtro-organo');
    if (o && o.value) { o.value = ''; avisarDelCambio(o); }
    var t = $('filtro-tipo-asunto');
    if (t && t.value) { t.value = ''; avisarDelCambio(t); }
    var r = $('inicio-me-toca-responsable');   /* fila 216 */
    if (r && r.value) { r.value = ''; avisarDelCambio(r); }
    var fd = $('filtro-fecha-desde'), fh = $('filtro-fecha-hasta');   /* fila 241 */
    if (fd && fd.value) { fd.value = ''; avisarDelCambio(fd); }
    if (fh && fh.value) { fh.value = ''; avisarDelCambio(fh); }
    if (q && q.value) { q.value = ''; avisarDelCambio(q); }
  }

  /* Lo que dice cada opción del desplegable de plazo, para escribirlo
     igual en su etiqueta. */
  function textoDelPlazo(sel) {
    var op = sel.options[sel.selectedIndex];
    return op ? op.textContent : sel.value;
  }

  function pintarFiltros() {
    var q = $('buscar-abiertos'), f = $('filtro-estado'), p = $('filtro-plazo');
    if (!q || !f) return;
    var texto = q.value.trim();
    var estado = f.value;
    var plazo = p ? p.value : '';
    var o = $('filtro-organo'), organo = o ? o.value : '';   /* fila 134 */
    var ti = $('filtro-tipo-asunto'), tipo = ti ? ti.value : '';   /* fila 192 */
    var r = $('inicio-me-toca-responsable'), resp = r ? r.value : '';   /* fila 216 */
    var fd = $('filtro-fecha-desde'), fh = $('filtro-fecha-hasta');   /* fila 241 */
    var fDesde = fd ? fd.value : '', fHasta = fh ? fh.value : '';
    barraFiltros.innerHTML = '';
    if (!texto && !estado && !plazo && !organo && !tipo && !resp && !fDesde && !fHasta) { barraFiltros.classList.add('oculto'); return; }
    barraFiltros.classList.remove('oculto');

    if (texto) {
      barraFiltros.appendChild(etiqueta('Busca: ' + texto, function () {
        q.value = '';
        avisarDelCambio(q);
      }));
    }
    if (estado) {
      barraFiltros.appendChild(etiqueta('Situación: ' + textoDelPlazo(f),
        function () {
          f.value = '';
          avisarDelCambio(f);
        }));
    }

    if (plazo) {
      barraFiltros.appendChild(etiqueta('Plazo: ' + textoDelPlazo(p), function () {
        p.value = '';
        avisarDelCambio(p);
      }));
    }

    if (organo) {
      barraFiltros.appendChild(etiqueta('Lo encarga: ' + textoDelPlazo(o), function () {
        o.value = '';
        avisarDelCambio(o);
      }));
    }

    if (tipo) {
      barraFiltros.appendChild(etiqueta('Tipo: ' + textoDelPlazo(ti), function () {
        ti.value = '';
        avisarDelCambio(ti);
      }));
    }

    if (resp) {
      barraFiltros.appendChild(etiqueta('Responsable: ' + textoDelPlazo(r), function () {
        r.value = '';
        avisarDelCambio(r);
      }));
    }

    if (fDesde || fHasta) {
      barraFiltros.appendChild(etiqueta('Fechas: ' + App.textoDeFechas(fDesde, fHasta), function () {
        if (fd.value) { fd.value = ''; avisarDelCambio(fd); }
        if (fh.value) { fh.value = ''; avisarDelCambio(fh); }
      }));
    }

    var cuantos = document.querySelectorAll('#inicio-tabla-cuerpo .inicio-tabla-fila').length;
    var total = ($('cuenta-abiertos') && $('cuenta-abiertos').textContent.trim()) || '';
    var cuenta = document.createElement('span');
    cuenta.className = 'filtros-cuenta';
    cuenta.textContent = total ? cuantos + ' de ' + total : cuantos + ' asuntos';
    barraFiltros.appendChild(cuenta);

    var limpiar = document.createElement('button');
    limpiar.type = 'button';
    limpiar.className = 'boton boton-limpiar';
    limpiar.textContent = 'Limpiar todo';
    limpiar.title = 'Quitar la búsqueda y los filtros';
    limpiar.onclick = limpiarFiltros;
    barraFiltros.appendChild(limpiar);
  }

  /* Cada vez que la aplicación repinta la tabla, se repasan la vista y
     las etiquetas. Así siempre dicen lo que hay de verdad en pantalla. */
  if ($('inicio-tabla-cuerpo')) {
    new MutationObserver(function () {
      pintarFiltros();
    }).observe($('inicio-tabla-cuerpo'), { childList: true });
  }

  /* ==========================================================
     6. LA TECLA ESCAPE

     Con un cuadro abierto, lo cierra. Con el visor de un documento
     abierto, lo cierra (el lector de correos se cierra solo, en
     js/lector.js). Con el cursor en un buscador, lo vacía. Si no hay
     nada de eso, vuelve a la pantalla anterior, igual que el botón
     «Volver» o «Cancelar» que ya tenga la pantalla a la vista.
     ========================================================== */

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;

    var capa = $('capa');
    if (capa && !capa.classList.contains('oculto')) {
      var cancelar = $('cuadro-cancelar');
      var aceptar = $('cuadro-aceptar');
      ev.preventDefault();
      if (cancelar && !cancelar.classList.contains('oculto')) cancelar.click();
      else if (aceptar) aceptar.click();
      return;
    }

    /* El lector de correos vigila su propia tecla Escape. */
    if (document.body.classList.contains('con-lector')) return;

    if (document.body.classList.contains('con-visor')) {
      ev.preventDefault();
      if (window.Visor) Visor.cerrar();
      return;
    }

    var donde = document.activeElement;
    if (donde && donde.type === 'search' && donde.value) {
      ev.preventDefault();
      donde.value = '';
      avisarDelCambio(donde);
      return;
    }

    var pantallaVisible = document.querySelector('.pantalla:not(.oculto)');
    if (!pantallaVisible) return;
    if (pantallaVisible.id === 'pantalla-nuevo') {
      ev.preventDefault();
      salirDeNuevoConEscape();
      return;
    }
    /* En la ficha, con una tarjeta abierta en grande, el primer Escape
       vuelve a la cuadrícula (fila 107, js/ficha-tarjetas.js). */
    /* Fila 145: un desplegable de la cabecera de la mesa, antes que la mesa. */
    if (pantallaVisible.id === 'pantalla-asunto' && window.HitoMesa && HitoMesa.cerrarPanelSiAbierto && HitoMesa.cerrarPanelSiAbierto()) {
      ev.preventDefault();
      return;
    }
    /* Fila 147: con otra tarjeta de la mesa en grande, vuelve al guion. */
    if (pantallaVisible.id === 'pantalla-asunto' && window.HitoMesa && HitoMesa.volverAlGuionSiOtra && HitoMesa.volverAlGuionSiOtra()) {
      ev.preventDefault();
      return;
    }
    /* Con la mesa de un hito abierta, el primero vuelve a la lista de hitos (fila 109). */
    if (pantallaVisible.id === 'pantalla-asunto' && window.HitoMesa && HitoMesa.cerrarSiAbierta()) {
      ev.preventDefault();
      return;
    }
    if (pantallaVisible.id === 'pantalla-asunto' && window.FichaTarjetas && FichaTarjetas.cerrarSiAbierta()) {
      ev.preventDefault();
      return;
    }
    var salida = pantallaVisible.querySelector(
      '.boton-volver:not(.oculto), #ficha-volver, #dup-pantalla-volver');
    if (salida) { ev.preventDefault(); salida.click(); }
  });

  /* El cursor se pone solo en el primer campo del cuadro que se abre. */
  if ($('capa')) {
    new MutationObserver(function () {
      if ($('capa').classList.contains('oculto')) return;
      var primero = $('cuadro-cuerpo') &&
        $('cuadro-cuerpo').querySelector('input, select, textarea');
      if (primero) { try { primero.focus(); } catch (e) {} }
    }).observe($('capa'), { attributes: true, attributeFilter: ['class'] });
  }

  /* ========================================================== */
})();
