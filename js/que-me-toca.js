/* ============================================================
   que-me-toca.js — pantalla "Qué me toca" (16-sep-2026, fila 16).

   Los hitos de la fila 15 (js/hitos.js) se ven dentro de cada asunto,
   uno a uno. Esta pantalla los cruza todos: los hitos `pendiente` y
   `encurso` de TODOS los asuntos abiertos, sin tener que entrar en
   ellos. Se calcula leyendo Hitos.leer() una vez y
   window.Gestor.asuntos(), cruzando por la clave del asunto.

   Vive entera en su propio fichero, con el mismo patrón que la
   pantalla "Duplicados" en js/unir-asuntos.js: no está en index.html
   más que su <script> y su <link>, se registra con App.PANTALLAS.push
   y la sección se crea a mano, ya al cargar el script (App.ir espera
   que #pantalla-<nombre> ya exista).

   A diferencia de "Duplicados", esta SÍ tiene entrada en la barra de
   la izquierda (js/barra.js la añade y le pone la cuenta de vencidos).

   Los tres bloques (sección 2 de docs/QUE-ME-TOCA.md):
     - "En tu tejado": responsable `yo`/`companero` CON fecha límite,
       ordenados por Plazos.diasHasta (los vencidos arriba). El color
       es el de siempre: se reutiliza Plazos.de/.marca-plazo tal cual
       (css/plazos.css), sin inventar otra escala.
     - "Esperando a otros": cualquier otro responsable (tenga fecha o
       no: se ordena por días parado desde `desde`, no por fecha).
     - "Sin fecha": el resto —sin fecha límite, o sin un responsable
       que encaje arriba—, plegado con <details>. Así no se pierde
       nada: cada hito sale en un bloque, y solo en uno.
   ============================================================ */
(function () {

  var CLAVE_FILTRO = 'gestor-que-me-toca-responsable';

  function $(id) { return document.getElementById(id); }

  function leerFiltro() {
    try { return window.localStorage.getItem(CLAVE_FILTRO) || ''; } catch (e) { return ''; }
  }
  function guardarFiltro(v) {
    try { window.localStorage.setItem(CLAVE_FILTRO, v); } catch (e) {}
  }

  /* ==========================================================
     REUNIR LOS HITOS DE TODOS LOS ASUNTOS ABIERTOS
     ========================================================== */

  /* Igual que terceroDe() de js/unir-asuntos.js. */
  function terceroDe(a) {
    if (a.ficha && a.ficha.tercero) return a.ficha.tercero;
    if (a.leido && a.leido.resto && window.Nombres) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  /* Igual que contextoResponsable() de js/hitos-panel-lista.js: lo que
     necesita Hitos.resolverResponsable para resolver "tercero" y
     "relacionado". */
  function contextoResponsable(a) {
    var f = a.ficha || {};
    return { tercero: f.tercero || (a.leido && a.leido.resto) || '', relacionados: f.relacionados || [], tutor: null };
  }

  function esMio(idResponsable) { return idResponsable === 'yo' || idResponsable === 'companero'; }

  async function reunir() {
    var datos = await Hitos.leer();
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var items = [];
    asuntos.forEach(function (a) {
      var entrada = datos.porAsunto[a.nombre];
      if (!entrada || !entrada.hitos.length) return;
      Hitos.visibles(entrada.hitos).forEach(function (h) {
        if (h.estado !== 'pendiente' && h.estado !== 'encurso') return;
        items.push({ asunto: a, hito: h });
      });
    });
    return { ajustes: datos.ajustes, items: items };
  }

  /* Días que lleva parado desde 'desde' (0 si no tiene: un hito
     "pendiente" que todavía no ha llegado a estar en curso no lo
     tiene, y no por eso hay que tratarlo como el más urgente). */
  function diasParado(h) {
    if (!h.desde) return 0;
    var d = Plazos.diasHasta(h.desde);
    return d === null ? 0 : Math.max(0, -d);
  }

  function clasificar(items) {
    var tejado = [], otros = [], sinFecha = [];
    items.forEach(function (it) {
      var h = it.hito;
      if (esMio(h.responsable) && h.fecha) tejado.push(it);
      else if (h.responsable && !esMio(h.responsable)) otros.push(it);
      else sinFecha.push(it);
    });
    tejado.sort(function (a, b) {
      return (Plazos.diasHasta(a.hito.fecha) || 0) - (Plazos.diasHasta(b.hito.fecha) || 0);
    });
    otros.sort(function (a, b) { return diasParado(b.hito) - diasParado(a.hito); });
    return { tejado: tejado, otros: otros, sinFecha: sinFecha };
  }

  function vencidos(items) {
    return items.filter(function (it) {
      var p = it.hito.fecha ? Plazos.de(it.hito.fecha) : null;
      return p && p.clase === 'plazo-vencido';
    }).length;
  }

  /* ==========================================================
     LA PANTALLA
     ========================================================== */

  App.PANTALLAS.push('que-me-toca');

  var construida = false;

  function construirPantalla() {
    if (construida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-que-me-toca';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera">' +
        '<h2>Qué me toca</h2>' +
        '<div class="acciones">' +
          '<label class="etiqueta-en-linea" for="qmt-responsable">Responsable</label>' +
          '<select id="qmt-responsable" class="campo"><option value="">Todos</option></select>' +
          '<button type="button" id="qmt-volver" class="boton boton-volver">← Volver</button>' +
        '</div>' +
      '</header>' +
      '<p class="explica">Los hitos pendientes y en curso de todos los asuntos abiertos, cruzados ' +
        'en una sola pantalla.</p>' +
      '<div id="qmt-cuerpo"></div>';
    contenido.appendChild(seccion);
    $('qmt-volver').onclick = function () { App.ir('abiertos'); };
    $('qmt-responsable').onchange = function () {
      guardarFiltro(this.value);
      pintar();
    };
    construida = true;
  }
  construirPantalla();

  function abrir() {
    construirPantalla();
    App.ir('que-me-toca');
    pintar();
  }

  /* ---------- pintar el filtro y la cuenta de la barra ---------- */

  function pintarFiltro(ajustes) {
    var sel = $('qmt-responsable');
    if (!sel) return;
    var actual = leerFiltro();
    sel.innerHTML = ['<option value="">Todos</option>'].concat(
      (ajustes.responsables || []).map(function (r) {
        return '<option value="' + U.escapar(r.id) + '">' + U.escapar(r.nombre) + '</option>';
      })
    ).join('');
    sel.value = actual;
    if (sel.value !== actual) sel.value = '';   /* el guardado ya no existe */
  }

  function pintarCuenta(items) {
    var el = $('cuenta-que-me-toca');
    if (!el) return;
    var n = vencidos(items);
    el.textContent = n ? String(n) : '';
    el.classList.toggle('oculto', !n);
  }

  /* ---------- una fila, un hito ---------- */

  function filaDeHito(it, extraHtml) {
    var h = it.hito, a = it.asunto;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qmt-fila';
    b.dataset.asunto = a.nombre;
    b.dataset.hito = h.id;
    var tercero = terceroDe(a);
    b.innerHTML =
      '<span class="qmt-fila-titulo">' + U.escapar(h.titulo || '(sin título)') + '</span>' +
      '<span class="qmt-fila-asunto">' + U.escapar(a.nombre) + '</span>' +
      (tercero ? '<span class="qmt-fila-tercero">' + U.escapar(tercero) + '</span>' : '') +
      (extraHtml || '');
    b.onclick = function () {
      if (window.HitosPanel) window.HitosPanel.desplegarAlAbrir(a.nombre, h.id);
      App.abrirFicha(a, 'abierto');
    };
    return b;
  }

  /* ---------- los tres bloques ---------- */

  function bloqueTejado(lista) {
    if (!lista.length) return null;
    var d = document.createElement('div');
    d.className = 'qmt-bloque qmt-bloque-tejado';
    d.innerHTML = '<h3 class="qmt-bloque-titulo">En tu tejado ' +
      '<span class="cuenta-lista">' + lista.length + '</span></h3>';
    var caja = document.createElement('div');
    caja.className = 'qmt-lista';
    lista.forEach(function (it) {
      var p = Plazos.de(it.hito.fecha);
      var fila = filaDeHito(it, '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>');
      fila.classList.add(p.clase);
      caja.appendChild(fila);
    });
    d.appendChild(caja);
    return d;
  }

  function textoParado(dias, desde) {
    if (!desde) return 'sin empezar todavía';
    if (dias === 0) return 'parado desde hoy';
    return dias === 1 ? 'lleva 1 día parado' : 'lleva ' + dias + ' días parado';
  }

  function bloqueOtros(lista, ajustes) {
    if (!lista.length) return null;
    var d = document.createElement('div');
    d.className = 'qmt-bloque qmt-bloque-otros';
    d.innerHTML = '<h3 class="qmt-bloque-titulo">Esperando a otros ' +
      '<span class="cuenta-lista">' + lista.length + '</span></h3>';
    var caja = document.createElement('div');
    caja.className = 'qmt-lista';
    lista.forEach(function (it) {
      var h = it.hito;
      var contexto = contextoResponsable(it.asunto);
      var r = Hitos.resolverResponsable(h.responsable, ajustes, contexto);
      var quien = r ? r.texto : h.responsable;
      var dias = diasParado(h);
      var extra = '<span class="qmt-fila-espera" data-dias="' + dias + '">Espera a ' +
        U.escapar(quien) + ' · ' + textoParado(dias, h.desde) + '</span>';
      caja.appendChild(filaDeHito(it, extra));
    });
    d.appendChild(caja);
    return d;
  }

  function bloqueSinFecha(lista) {
    if (!lista.length) return null;
    var det = document.createElement('details');
    det.className = 'qmt-bloque qmt-sinfecha';
    det.innerHTML = '<summary>Sin fecha <span class="cuenta-lista">' + lista.length + '</span></summary>';
    var caja = document.createElement('div');
    caja.className = 'qmt-lista';
    lista.forEach(function (it) { caja.appendChild(filaDeHito(it)); });
    det.appendChild(caja);
    return det;
  }

  /* ---------- el repintado entero ---------- */

  async function pintar() {
    var caja = $('qmt-cuerpo');
    if (!caja) return;
    var datos = await reunir();
    pintarFiltro(datos.ajustes);
    pintarCuenta(datos.items);

    var filtro = leerFiltro();
    var items = filtro ? datos.items.filter(function (it) { return it.hito.responsable === filtro; }) : datos.items;
    var g = clasificar(items);

    var bloques = [bloqueTejado(g.tejado), bloqueOtros(g.otros, datos.ajustes), bloqueSinFecha(g.sinFecha)]
      .filter(function (b) { return b; });

    caja.innerHTML = '';
    if (!bloques.length) {
      caja.innerHTML = '<div class="vacio">No hay ningún hito pendiente en los asuntos abiertos.</div>';
      return;
    }
    bloques.forEach(function (b) { caja.appendChild(b); });
  }

  /* ---------- la cuenta de la barra, siempre al día ----------

     Igual que el aviso de duplicados (js/unir-asuntos.js): enganchado
     a window.Gestor.alRefrescar, para que la cuenta de vencidos esté
     bien aunque no se haya visitado la pantalla todavía. */
  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        reunir().then(function (d) { pintarCuenta(d.items); }).catch(function () {});
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  window.QueMeToca = { abrir: abrir };

})();
