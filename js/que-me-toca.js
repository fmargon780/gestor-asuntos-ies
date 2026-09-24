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
     - "En tu tejado": responsable de Administración (fila 104) CON fecha límite,
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

  /* Fila 104: "de Administración" sale de la marca de cada responsable
     en Ajustes › Hitos (Hitos.esDeAdministracion), no de `yo`/`companero`
     a pelo. Sin responsable sigue yendo a "Sin fecha", como siempre. */
  function esMio(idResponsable, ajustes) {
    return !!idResponsable && Hitos.esDeAdministracion(idResponsable, ajustes);
  }

  async function reunir() {
    var datos = await Hitos.leer();
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var items = [];
    asuntos.forEach(function (a) {
      var entrada = datos.porAsunto[a.nombre];
      if (!entrada || !entrada.hitos.length) return;
      Hitos.visibles(entrada.hitos).forEach(function (h) {
        if (h.estado !== 'pendiente' && h.estado !== 'encurso') return;
        /* 20-sep-2026, fila 79, apartado 4.6: un hito solo informativo
           no reclama trabajo, así que no sale aquí. */
        if (h.soloInformativo) return;
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

  function clasificar(items, ajustes) {
    var tejado = [], otros = [], sinFecha = [];
    items.forEach(function (it) {
      var h = it.hito;
      if (esMio(h.responsable, ajustes) && h.fecha) tejado.push(it);
      else if (h.responsable && !esMio(h.responsable, ajustes)) otros.push(it);
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
      /* Con la tarjeta de Hitos abierta en grande (fila 107). */
      if (window.FichaTarjetas) FichaTarjetas.abrirAlEntrar('hitos');
      App.abrirFicha(a, 'abierto');
    };
    return b;
  }

  /* ---------- los asuntos dormidos (19-sep-2026, fila 68,
     docs/AVISOS-QUE-FALTAN.md, 2) ----------

     "No ha pasado nada" = ni nota, ni cambio de estado, ni edición de
     la ficha, tomando la fecha más reciente de `notaEl`, `situacionEl`
     y `editadoEl` (o `abiertoEl` si el asunto no ha tenido ninguna
     de las anteriores todavía). El encargo pide explícitamente NO
     mirar el documento más nuevo de la carpeta: costaría un recorrido
     del disco por cada asunto, solo para pintar esta pantalla. */
  var DIAS_DORMIDO_POR_DEFECTO = 60;

  App.diasDormido = function () {
    var n = App.E.registro.ajustesAvisos && App.E.registro.ajustesAvisos.diasDormido;
    return (typeof n === 'number' && n > 0) ? n : DIAS_DORMIDO_POR_DEFECTO;
  };

  App.guardarDiasDormido = async function (n) {
    await App.guardarRegistroFresco(function (registro) {
      registro.ajustesAvisos = registro.ajustesAvisos || {};
      registro.ajustesAvisos.diasDormido = n;
    });
  };

  /* El campo de Ajustes → El centro. Lo llama App.pintarAjustesCentro
     (js/ajustes-centro.js). */
  App.pintarDiasDormido = function () {
    var campo = $('dias-dormido');
    if (!campo) return;
    campo.value = String(App.diasDormido());
    campo.onchange = async function () {
      var n = parseInt(campo.value, 10);
      if (isNaN(n) || n < 1) { campo.value = String(App.diasDormido()); return; }
      try {
        await App.guardarDiasDormido(n);
        U.aviso('Avisará de los dormidos a partir de ' + n + ' días.', 'bueno');
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
  };

  function ultimaActividad(ficha) {
    return [ficha.notaEl, ficha.situacionEl, ficha.editadoEl, ficha.abiertoEl]
      .filter(Boolean).sort().pop() || '';
  }

  function diasDesdeIso(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  /* Los abiertos sin novedades desde hace `App.diasDormido()` días o
     más, sin los que se han ocultado a propósito y todavía no toca
     volver a avisar de ellos (`ficha.dormidoOcultoHasta`). */
  function reunirDormidos() {
    var umbral = App.diasDormido();
    var hoy = U.hoyIso();
    var asuntos = window.Gestor ? window.Gestor.asuntos() : [];
    var salida = [];
    asuntos.forEach(function (a) {
      var f = a.ficha || {};
      if (f.dormidoOcultoHasta && f.dormidoOcultoHasta > hoy) return;
      var ultima = ultimaActividad(f);
      if (!ultima) return;
      var dias = diasDesdeIso(ultima);
      if (dias >= umbral) salida.push({ asunto: a, dias: dias });
    });
    salida.sort(function (a, b) { return b.dias - a.dias; });
    return salida;
  }

  function bloqueDormidos(lista) {
    if (!lista.length) return null;
    var d = document.createElement('div');
    d.className = 'qmt-bloque qmt-bloque-dormidos';
    d.innerHTML = '<h3 class="qmt-bloque-titulo">Dormidos ' +
      '<span class="cuenta-lista">' + lista.length + '</span></h3>';
    var caja = document.createElement('div');
    caja.className = 'qmt-lista';
    lista.forEach(function (it) {
      var a = it.asunto;
      var tercero = terceroDe(a);
      var fila = document.createElement('div');
      fila.className = 'qmt-fila qmt-fila-dormido';
      fila.style.cursor = 'default';
      fila.innerHTML =
        '<span class="qmt-fila-titulo">' + U.escapar(a.nombre) + '</span>' +
        (tercero ? '<span class="qmt-fila-tercero">' + U.escapar(tercero) + '</span>' : '') +
        '<span class="qmt-fila-espera">Sin novedades desde hace ' + it.dias + ' días</span>';

      var abrir = document.createElement('button');
      abrir.type = 'button';
      abrir.className = 'boton';
      abrir.textContent = 'Abrir';
      abrir.onclick = function () { App.abrirFicha(a, 'abierto'); };
      fila.appendChild(abrir);

      var ocultar = document.createElement('button');
      ocultar.type = 'button';
      ocultar.className = 'boton';
      ocultar.textContent = 'Ocultar por 30 días';
      ocultar.onclick = async function () {
        var hasta = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
        try {
          await App.anotar(a.nombre, { dormidoOcultoHasta: hasta });
          pintar();
        } catch (e) {
          U.aviso('No he podido ocultarlo: ' + U.mensajeDeError(e), 'malo');
        }
      };
      fila.appendChild(ocultar);

      caja.appendChild(fila);
    });
    d.appendChild(caja);
    return d;
  }

  /* ---------- el aviso de aspirantes sin Nº de identificación escolar ----------

     17-sep-2026, fila 42, sección 5 de
     docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md. Un aviso, no un hito: sin
     fecha límite ni responsable, mientras queden aspirantes dados de
     alta sin número. Se pulsa y lleva a Personas y empresas, en
     Alumnado, donde salen marcados como "Solicitante". */
  async function contarAspirantesSinNumero() {
    try {
      var datos = await Datos.cargar(App.E.datos, 'ALUMNADO');
      return (datos.lista || []).filter(function (p) { return p.solicitante && !p.id; }).length;
    } catch (e) { return 0; }
  }

  function bloqueAspirantes(n) {
    if (!n) return null;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qmt-fila qmt-aviso-aspirantes';
    b.textContent = n + ' ' + (n === 1 ? 'aspirante' : 'aspirantes') +
      ' sin Nº de identificación escolar';
    b.onclick = function () {
      if ($('filtro-personas')) $('filtro-personas').value = 'ALUMNADO';
      if ($('buscar-personas')) $('buscar-personas').value = '';
      App.ir('personas');
      if (App.pintarPersonas) App.pintarPersonas();
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
    var g = clasificar(items, datos.ajustes);
    var nAspirantes = await contarAspirantesSinNumero();

    var bloques = [bloqueAspirantes(nAspirantes), bloqueTejado(g.tejado),
                   bloqueOtros(g.otros, datos.ajustes), bloqueDormidos(reunirDormidos()),
                   bloqueSinFecha(g.sinFecha)]
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
      /* La cuenta de vencidos no relee hitos.json en cada repintado de
         la lista (fila 101): solo si este ordenador ha cambiado algún
         hito desde la última cuenta, o si han pasado dos minutos (lo
         que haya tocado el otro ordenador). */
      var ultimaCuenta = 0;
      window.Gestor.alRefrescar.push(function () {
        var ahora = Date.now();
        var cambio = window.Hitos && Hitos.ultimoCambioLocal ? Hitos.ultimoCambioLocal() : ahora;
        if (ultimaCuenta && cambio < ultimaCuenta && ahora - ultimaCuenta < 2 * 60 * 1000) return;
        ultimaCuenta = ahora;
        reunir().then(function (d) { pintarCuenta(d.items); }).catch(function () {});
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  window.QueMeToca = {
    abrir: abrir,
    /* para las pruebas */
    _reunirDormidos: reunirDormidos
  };

})();
