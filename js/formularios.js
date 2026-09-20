/* ============================================================
   formularios.js — el catálogo de formularios oficiales, a un clic
   (20-sep-2026, fila 82, docs/FORMULARIOS-OFICIALES.md).

   El catálogo (29 entradas hoy) viene copiado, tal cual, de
   `fmargon780/normativa-escolarizacion` a `datos/formularios.json`,
   del propio sitio web: la aplicación trabaja sobre ficheros del
   ordenador y la red del centro bloquea direcciones que no hacen
   falta, así que depender de otra web para pintar una pantalla sería
   frágil. Se lee con `fetch` relativo, una sola vez por sesión
   (`cargar`, con `cache`); el botón "Actualizar el catálogo" de
   Ajustes → Mantenimiento vuelve a leerlo (por si se ha publicado una
   versión nueva de la aplicación con más formularios).

   Cada entrada: `{ n, norma, via, u, nota }`. `via` es
   'descarga'|'centro'|'protocolo'|'seneca' (`etiquetaDeVia`).

   Este fichero trae, todo junto, como ya hicieron js/cargos.js y
   js/membrete.js con lo suyo:
     1. El modelo: cargar/buscar/etiquetaDeVia.
     2. El editor embebido (buscador + casillas) que se pinta DENTRO
        del `<details>` de normativa de un paso de guía
        (js/guias.js + js/hitos-normativa.js) y de la sección "Datos
        del tipo" de un tipo de asunto (js/ajustes-tipo.js).
     3. La lista de solo lectura de un hito vivo (js/hitos-panel-lista.js).
     4. La línea "Formularios" de la ficha del asunto (envuelve
        App.abrirFicha, como ya hacen js/correo.js y compañía).
     5. La pantalla propia "Formularios" (catálogo entero, buscable),
        con su entrada en la barra (js/barra.js).
     6. El botón "Actualizar el catálogo" de Ajustes → Mantenimiento.

   Se carga después de js/hitos-normativa.js (el bloque de normativa
   ya tiene que existir) y de js/ficha-asunto.js (envuelve
   App.abrirFicha: apuntado en js/envolturas-esperadas.js).
   ============================================================ */
var Formularios = (function () {

  var URL_DATOS = 'datos/formularios.json';
  var cache = null;

  async function cargar() {
    if (cache) return cache;
    try {
      var resp = await fetch(URL_DATOS);
      if (!resp.ok) throw new Error('no encuentro ' + URL_DATOS + ' (' + resp.status + ')');
      cache = await resp.json();
    } catch (e) {
      cache = {};
    }
    return cache;
  }

  /* Para "Actualizar el catálogo": vuelve a leer el fichero. */
  async function actualizar() {
    cache = null;
    return cargar();
  }

  /* Sin efectos: filtra por nombre y por norma, sin mayúsculas ni
     tildes (U.normalizar, la misma que usa U.parecidos). Con el texto
     vacío, da el catálogo entero. */
  function buscar(catalogo, texto) {
    var q = U.normalizar(texto || '');
    return Object.keys(catalogo || {}).filter(function (clave) {
      if (!q) return true;
      var f = catalogo[clave] || {};
      return U.normalizar(f.n).indexOf(q) !== -1 || U.normalizar(f.norma).indexOf(q) !== -1;
    });
  }

  var VIAS = {
    descarga: { texto: 'Se descarga', clase: 'via-descarga' },
    centro: { texto: 'Lo emite el centro', clase: 'via-centro' },
    protocolo: { texto: 'Protocolo, sin impreso', clase: 'via-protocolo' },
    seneca: { texto: 'Se genera en Séneca', clase: 'via-seneca' }
  };

  function etiquetaDeVia(via) {
    return VIAS[via] || { texto: via ? String(via) : '(sin vía)', clase: 'via-protocolo' };
  }

  /* ==========================================================
     EL EDITOR EMBEBIDO (buscador + casillas)

     Se usa en dos sitios: el editor de un paso de guía (dentro del
     `<details>` de normativa) y la sección "Datos del tipo". Los dos
     leen lo marcado con `leerEditor`, pasándole el propio
     `.formularios-editor` (o cualquier contenedor que lo tenga
     dentro).
     ========================================================== */

  function filaEditorHTML(clave, f, marcado) {
    return '<label class="formularios-fila">' +
      '<input type="checkbox" class="formularios-casilla" data-clave="' + U.escapar(clave) + '"' +
      (marcado ? ' checked' : '') + '>' +
      '<span>' + U.escapar(f.n) + '</span>' +
      '<span class="suave"> — ' + U.escapar(f.norma) + '</span>' +
      '</label>';
  }

  function filasEditorHTML(catalogo, seleccionadas) {
    var marcadas = {};
    (seleccionadas || []).forEach(function (c) { marcadas[c] = true; });
    return Object.keys(catalogo).sort(function (a, b) {
      return (catalogo[a].n < catalogo[b].n) ? -1 : 1;
    }).map(function (c) { return filaEditorHTML(c, catalogo[c], !!marcadas[c]); }).join('');
  }

  function leerEditor(contenedor) {
    if (!contenedor) return [];
    var casillas = contenedor.querySelectorAll('.formularios-casilla:checked');
    return Array.prototype.map.call(casillas, function (c) { return c.dataset.clave; });
  }

  function engancharBuscador(editor) {
    if (!editor) return;
    var buscarInput = editor.querySelector('.formularios-buscar');
    var filas = editor.querySelectorAll('.formularios-fila');
    if (!buscarInput) return;
    buscarInput.oninput = function () {
      var q = U.normalizar(buscarInput.value);
      Array.prototype.forEach.call(filas, function (fila) {
        fila.classList.toggle('oculto', !!q && U.normalizar(fila.textContent).indexOf(q) === -1);
      });
    };
  }

  /* Para el editor de un paso de guía (js/guias.js, síncrono: nunca se
     espera a nada al pintar un paso). Usa lo que ya haya en `cache`;
     si el catálogo todavía no ha llegado (poco probable: es un
     fichero del propio sitio, pedido al cargar la página), se avisa
     y basta con volver a abrir el editor para que salga entero. El
     buscador se engancha aparte, con `engancharEmbebido`, porque este
     fichero solo pinta HTML en texto (`d.insertAdjacentHTML`, igual
     que `HitosNormativa.bloqueHTML`), sin nodos todavía. */
  function bloqueEmbebidoHTML(seleccionadas) {
    if (!cache) cargar();   /* de fondo, para la próxima vez */
    var catalogo = cache || {};
    if (!Object.keys(catalogo).length) {
      return '<div class="formularios-editor"><p class="suave">Catálogo de formularios: cargando o no ' +
        'disponible. Vuelve a abrir este paso en un momento.</p></div>';
    }
    return '<div class="formularios-editor">' +
      '<input class="campo formularios-buscar" placeholder="Buscar un formulario…">' +
      '<div class="formularios-editor-lista">' + filasEditorHTML(catalogo, seleccionadas) + '</div>' +
      '</div>';
  }

  /* `raiz` es el nodo ya en el documento que CONTIENE el
     `.formularios-editor` (el `d` del paso, en js/guias.js). */
  function engancharEmbebido(raiz) {
    if (!raiz) return;
    engancharBuscador(raiz.querySelector('.formularios-editor'));
  }

  /* Para "Datos del tipo" (js/ajustes-tipo.js): async de verdad (no
     hay ningún `pintar()` imperativo esperando), con guardado
     automático en cada casilla, como el resto de esa sección. */
  async function pintarEditorAsync(contenedor, seleccionadas, alCambiar) {
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="suave">Cargando el catálogo…</p>';
    var catalogo = await cargar();
    if (!Object.keys(catalogo).length) {
      contenedor.innerHTML = '<p class="suave">No he podido leer el catálogo de formularios.</p>';
      return;
    }
    contenedor.innerHTML =
      '<input class="campo formularios-buscar" placeholder="Buscar un formulario…">' +
      '<div class="formularios-editor-lista">' + filasEditorHTML(catalogo, seleccionadas) + '</div>';
    engancharBuscador(contenedor);
    Array.prototype.forEach.call(contenedor.querySelectorAll('.formularios-casilla'), function (c) {
      c.onchange = function () { alCambiar(leerEditor(contenedor)); };
    });
  }

  /* ==========================================================
     LA LISTA DE SOLO LECTURA (un hito vivo, js/hitos-panel-lista.js)

     Un formulario de vía "descarga"/"centro" se pinta como un enlace
     de aspecto de botón (hay algo que abrir); uno de vía
     "protocolo"/"seneca" se pinta como aviso, con su nota debajo si
     la tiene: no hay ningún impreso que descargar, así que no debe
     parecer un botón de descarga (docs/FORMULARIOS-OFICIALES.md,
     parte 2). Sin efectos aparte de leer `cache`: si el catálogo no
     ha llegado todavía, una clave sin dato no se pinta (mejor nada
     que una línea rota).
     ========================================================== */

  function filaListaHTML(clave) {
    var f = (cache || {})[clave];
    if (!f) return '';
    var e = etiquetaDeVia(f.via);
    var esImpreso = (f.via === 'descarga' || f.via === 'centro');
    var cabecera = (esImpreso && f.u)
      ? '<a class="formularios-chip ' + e.clase + '" href="' + U.escapar(f.u) +
        '" target="_blank" rel="noopener">' + U.escapar(f.n) + '</a>'
      : '<span class="formularios-chip ' + e.clase + '">' + U.escapar(f.n) + ' · ' + U.escapar(e.texto) +
        (!esImpreso && f.u ? ' — <a href="' + U.escapar(f.u) + '" target="_blank" rel="noopener">ver</a>' : '') +
        '</span>';
    var nota = f.nota ? '<div class="formularios-nota suave">' + U.escapar(f.nota) + '</div>' : '';
    /* `data-clave-formulario` (20-sep-2026, fila 84,
       docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md): el punto donde
       js/formularios-rellenar.js cuelga el botón "Preparar para el
       tercero" de los que tienen PDF (`f.f`), sin tener que envolver
       nada de este fichero. */
    return '<div class="formularios-fila-lectura" data-clave-formulario="' + U.escapar(clave) + '">' +
      cabecera + nota + '</div>';
  }

  function listaHTML(claves, titulo) {
    var lista = (claves || []).filter(Boolean);
    if (!lista.length) return '';
    var filas = lista.map(filaListaHTML).filter(Boolean).join('');
    if (!filas) return '';
    return '<div class="hito-formularios"><span class="hito-normativa-titulo">' +
      U.escapar(titulo || 'Formularios') + '</span>' + filas + '</div>';
  }

  /* ==========================================================
     LOS FORMULARIOS DE UN ASUNTO (ficha, "Datos del trámite"):
     los de todos sus hitos VISIBLES (la rama en curso, no las
     bifurcaciones sin elegir), sin repetir, en el orden de los hitos,
     más los del tipo de asunto, sin repetir tampoco entre los dos.
     ========================================================== */

  function tipoDelAsunto(asunto) {
    var f = (asunto && asunto.ficha) || {}, l = (asunto && asunto.leido) || {};
    return l.tipo || f.tipo || '';
  }

  async function clavesDelAsunto(asunto) {
    var nombreTipo = tipoDelAsunto(asunto);
    var tipoObj = (window.App && App.E && App.E.tipos || []).filter(function (t) { return t.tipo === nombreTipo; })[0];
    var deTipo = (tipoObj && tipoObj.formularios) || [];

    var deHitos = [];
    if (window.Hitos && asunto && asunto.nombre) {
      try {
        var datos = await Hitos.leer();
        var lista = Hitos.hitosDe(datos, asunto.nombre);
        Hitos.visibles(lista).forEach(function (h) {
          (h.formularios || []).forEach(function (c) { deHitos.push(c); });
        });
      } catch (e) { /* sin hitos legibles, se sigue solo con los del tipo */ }
    }

    var vistos = {}, unicas = [];
    deHitos.concat(deTipo).forEach(function (c) {
      if (!c || vistos[c]) return;
      vistos[c] = true;
      unicas.push(c);
    });
    return unicas;
  }

  /* ---------- la línea en la ficha del asunto ---------- */

  var asuntoActualEnFicha = null;

  async function pintarEnFicha(asunto) {
    var fila = document.getElementById('ficha-formularios-fila');
    var valor = document.getElementById('ficha-formularios-valor');
    if (!fila || !valor) return;
    await cargar();
    var claves = await clavesDelAsunto(asunto);
    if (!claves.length) { fila.classList.add('oculto'); valor.innerHTML = ''; return; }
    valor.innerHTML = claves.map(function (c) {
      var f = cache[c];
      if (!f) return '';
      var e = etiquetaDeVia(f.via);
      var chip = f.u
        ? '<a class="formularios-chip ' + e.clase + '" href="' + U.escapar(f.u) +
          '" target="_blank" rel="noopener">' + U.escapar(f.n) + '</a>'
        : '<span class="formularios-chip ' + e.clase + '">' + U.escapar(f.n) + '</span>';
      /* Ver la nota de filaListaHTML: mismo punto para el botón
         "Preparar para el tercero" (fila 84). */
      return '<span data-clave-formulario="' + U.escapar(c) + '">' + chip + '</span>';
    }).filter(Boolean).join(' ');
    fila.classList.remove('oculto');
  }

  (function enganchar() {
    var nueva = U.envolver(App, 'App.abrirFicha', 'formularios.js', function (comoEra) {
      return function (a, modo) {
        asuntoActualEnFicha = a;
        comoEra(a, modo);
        pintarEnFicha(a);
      };
    });
    if (!nueva) return;
    var pantalla = document.getElementById('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { if (asuntoActualEnFicha) pintarEnFicha(asuntoActualEnFicha); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

  /* ==========================================================
     LA PANTALLA PROPIA "FORMULARIOS"
     ========================================================== */

  var pantallaConstruida = false;

  function filaCatalogoHTML(f) {
    var e = etiquetaDeVia(f.via);
    return '<div class="fila-tipo">' +
      '<span class="formularios-chip ' + e.clase + '">' + U.escapar(e.texto) + '</span>' +
      '<span style="flex:1">' + U.escapar(f.n) +
      (f.nota ? '<div class="suave">' + U.escapar(f.nota) + '</div>' : '') + '</span>' +
      (f.u ? '<a class="boton" href="' + U.escapar(f.u) + '" target="_blank" rel="noopener">Abrir</a>' : '') +
      '</div>';
  }

  async function pintarPantalla() {
    var caja = document.getElementById('formularios-pantalla-cuerpo');
    if (!caja) return;
    var catalogo = await cargar();
    var buscarInput = document.getElementById('formularios-buscar-pantalla');
    var claves = buscar(catalogo, buscarInput ? buscarInput.value : '');
    if (!claves.length) { caja.innerHTML = '<div class="vacio">Sin resultados, o sin catálogo.</div>'; return; }

    var porNorma = {};
    claves.forEach(function (c) {
      var norma = catalogo[c].norma || '(sin norma)';
      (porNorma[norma] = porNorma[norma] || []).push(c);
    });
    caja.innerHTML = Object.keys(porNorma).sort().map(function (norma) {
      var filas = porNorma[norma].sort(function (a, b) { return catalogo[a].n < catalogo[b].n ? -1 : 1; });
      return '<h3 class="formularios-norma">' + U.escapar(norma) + '</h3><div class="lista">' +
        filas.map(function (c) { return filaCatalogoHTML(catalogo[c]); }).join('') + '</div>';
    }).join('');
  }

  function construirPantalla() {
    if (pantallaConstruida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-formularios';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera">' +
        '<h2>Formularios</h2>' +
        '<div class="acciones">' +
          '<input id="formularios-buscar-pantalla" class="campo" placeholder="Buscar por nombre o norma…">' +
          '<button type="button" id="formularios-volver" class="boton boton-volver">← Volver</button>' +
        '</div>' +
      '</header>' +
      '<p class="explica">El catálogo de formularios e impresos oficiales del trámite de ' +
      'escolarización y convivencia, agrupado por norma.</p>' +
      '<div id="formularios-pantalla-cuerpo" class="explica">Cargando…</div>';
    contenido.appendChild(seccion);
    document.getElementById('formularios-volver').onclick = function () { App.ir('abiertos'); };
    document.getElementById('formularios-buscar-pantalla').oninput = function () { pintarPantalla(); };
    if (App.PANTALLAS.indexOf('formularios') === -1) App.PANTALLAS.push('formularios');
    pantallaConstruida = true;
  }
  if (typeof document !== 'undefined' && document.querySelector) construirPantalla();

  async function abrir() {
    construirPantalla();
    App.ir('formularios');
    await pintarPantalla();
  }

  /* ==========================================================
     AJUSTES → MANTENIMIENTO: "ACTUALIZAR EL CATÁLOGO"
     ========================================================== */

  (function () {
    function $(id) { return document.getElementById(id); }

    function bloque() {
      var ya = $('bloque-formularios');
      if (ya) return ya;
      var pantalla = $('ajustes-tab-mantenimiento');
      if (!pantalla) return null;
      var d = document.createElement('details');
      d.className = 'bloque-ajustes';
      d.id = 'bloque-formularios';
      d.innerHTML =
        '<summary>' +
          '<span class="bloque-titulo">Formularios oficiales</span>' +
          '<span class="bloque-pie" id="formularios-pie">El catálogo de impresos del trámite</span>' +
        '</summary>' +
        '<div class="bloque-cuerpo">' +
          '<p class="explica">El catálogo viaja con la propia aplicación (no se descarga nada de ' +
          'internet): se actualiza solo cuando se publique una versión nueva. Este botón lo vuelve ' +
          'a leer, por si acaba de publicarse.</p>' +
          '<button type="button" class="boton" id="btn-actualizar-formularios">Actualizar el catálogo</button>' +
        '</div>';
      pantalla.appendChild(d);
      $('btn-actualizar-formularios').onclick = async function () {
        var boton = $('btn-actualizar-formularios');
        try {
          var catalogo = await U.mientrasGuarda(boton, function () { return actualizar(); });
          var n = Object.keys(catalogo).length;
          $('formularios-pie').textContent = n
            ? n + ' formulario' + (n === 1 ? '' : 's') + ' en el catálogo'
            : 'No he podido leer el catálogo';
          U.aviso(n ? n + ' formularios en el catálogo.' : 'No he podido leer el catálogo.', n ? 'bueno' : 'malo');
        } catch (e) {
          U.aviso('No he podido actualizarlo: ' + e.message, 'malo');
        }
      };
      return d;
    }

    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () { if (window.Gestor.carpetaGestor()) bloque(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  cargar();   /* de fondo, en cuanto carga el script: para cuando haga falta */

  return {
    cargar: cargar, actualizar: actualizar, buscar: buscar, etiquetaDeVia: etiquetaDeVia,
    bloqueEmbebidoHTML: bloqueEmbebidoHTML, engancharEmbebido: engancharEmbebido,
    leerEditor: leerEditor, pintarEditorAsync: pintarEditorAsync,
    listaHTML: listaHTML, clavesDelAsunto: clavesDelAsunto,
    abrir: abrir
  };
})();
window.Formularios = Formularios;
