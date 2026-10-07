/* ============================================================
   ajustes-reparto.js — Ajustes en cuatro pestañas (fila 288,
   docs/AJUSTES-EN-CUATRO-PESTANAS.md).

   Las pestañas son «Lo de cada día», «El centro», «Este ordenador» y
   «Problemas»; las reparaciones de vez en cuando viven en Herramientas,
   bajo «Puesta a punto y reparaciones».

   No se toca ningún módulo de sección: cada uno sigue colgando su bloque
   donde siempre (`#ajustes-tab-centro`, `#ajustes-tab-mantenimiento`…).
   Este módulo tiene una sola tabla (`TABLA`: bloque → pestaña, orden y
   otras palabras para el buscador) y, cada vez que aparece un bloque,
   lo lleva a su sitio. `#ajustes-tab-mantenimiento` ya no es una pestaña:
   es un sitio de paso que no se ve.

   Un bloque que no está en la tabla (lo cuelga un módulo nuevo) no puede
   quedarse en un sitio que no se ve: va al final de «El centro».

   También lleva `App.irASeccionDeAjustes`, el salto común que usan el
   buscador, la comprobación al entrar, los avisos de Inicio y demás:
   busca la sección, mira en qué pestaña está (o si está en Herramientas),
   la abre, la deja a la vista y la resalta un momento.
   ============================================================ */
var AjustesReparto = (function () {

  var CONTENEDORES = {
    dia: 'ajustes-tab-dia',
    centro: 'ajustes-tab-centro',
    ordenador: 'ajustes-tab-ordenador',
    problemas: 'ajustes-tab-problemas',
    herramientas: 'herramientas-puesta-cuerpo'
  };

  /* Sitios donde los módulos cuelgan sus bloques: se vigilan. */
  var DE_PASO = ['ajustes-tab-mantenimiento', 'ajustes-tab-tipos', 'ajustes-tab-centro', 'ajustes-tab-dia',
    'ajustes-tab-ordenador', 'herramientas-puesta-cuerpo'];

  var LINEAS = {
    dia: 'Lo que se cambia a menudo. Vale para todos los ordenadores del centro.',
    centro: 'Lo que se pone una vez, o una vez por curso. Vale para todos los ordenadores del centro.',
    ordenador: 'Lo de esta pestaña se guarda solo en este ordenador. En otro ordenador hay que ponerlo otra vez.',
    problemas: 'Lo que la aplicación ha encontrado mal y hay que arreglar.'
  };

  /* La tabla. El orden de cada pestaña es el de esta lista. `dentro`: va dentro de otra
     sección (no suelta). `otras`: palabras con las que también se encuentra. */
  var TABLA = [
    /* Lo de cada día */
    { id: 'bloque-tipos-documento', donde: 'dia', otras: 'tipos de documento, documentos' },
    { id: 'bloque-grupos-personas', donde: 'dia', otras: 'grupos, personas, clases' },
    { id: 'bloque-biblioteca-hitos', donde: 'dia', otras: 'hitos, tareas, plazos, guías, biblioteca' },
    { id: 'bloque-tipos-organo', donde: 'dia', otras: 'órgano, dirección, secretaría, jefatura, encarga' },
    /* El centro */
    { id: 'bloque-datos-centro', donde: 'centro', otras: 'nombre del instituto, código, dirección, localidad, provincia, firma' },
    { id: 'bloque-cargos', donde: 'centro', otras: 'director, secretaria, jefatura, quién firma' },
    { id: 'bloque-perfiles', donde: 'centro', otras: 'usuarios, directivos, perfil, correo, quién entra' },
    { id: 'bloque-membrete', donde: 'centro', otras: 'logo, cabecera, Junta, Consejería' },
    { id: 'bloque-sello', donde: 'centro', otras: 'tamaño, centímetros, sello de registro' },
    { id: 'bloque-hitos', donde: 'centro', otras: 'festivos, días no lectivos, vacaciones, responsables, plazos, hitos' },
    { id: 'bloque-dias-aviso', donde: 'centro', otras: 'dormidos, vencimiento, antelación, papelera, registro' },
    { id: 'bloque-copias', donde: 'centro', otras: 'copia, restaurar, recuperar, caducidad' },
    { id: 'bloque-impresos', donde: 'centro', otras: 'casillas, PDF, anexo, catálogo, formularios' },
    { id: 'bloque-alumnado-personal', donde: 'centro', otras: 'RegAlum, RelPerCen, Séneca, CSV, fichero viejo, épocas, grupos, unidades, alumnado, personal' },
    { id: 'bloque-soporte', donde: 'centro', otras: 'soporte, avisos, mejoras, dirección del buzón' },
    /* Este ordenador */
    { id: 'bloque-carpetas', donde: 'ordenador', otras: 'Dropbox, abiertos, ARCHIVO, señalar carpetas, solo consultar' },
    { id: 'bloque-rutas', donde: 'ordenador', otras: 'ruta, copiar ruta, dónde está Dropbox' },
    { id: 'bloque-largo-rutas', donde: 'ordenador', otras: 'largo, caracteres, nombre largo' },
    { id: 'bloque-alumnado-bd', donde: 'ordenador', otras: 'base de datos, Drive, matrícula' },
    { id: 'bloque-bandeja', donde: 'ordenador', otras: 'Gmail, Drive, correos que llegan, etiqueta GESTOR' },
    { id: 'bloque-envio-correo', donde: 'ordenador', otras: 'Gmail, script, enviar, cuenta' },
    { id: 'bloque-seneca', donde: 'ordenador', otras: 'marcador, favoritos, mensaje de Séneca' },
    /* Herramientas → Puesta a punto y reparaciones */
    { id: 'bloque-plantillas-centro', donde: 'herramientas', otras: 'plantillas, Word, correo, preparar' },
    { id: 'bloque-cargar-biblioteca', donde: 'herramientas', otras: 'biblioteca, tipos, guías, tareas, cargar, instituto' },
    { id: 'bloque-fichas-archivo', donde: 'herramientas', otras: 'fichas, ARCHIVO, poner en orden' },
    { id: 'bloque-contacto-migracion', donde: 'herramientas', otras: 'contacto, teléfono, correo, abiertos' },
    { id: 'bloque-versiones-previas', donde: 'herramientas', otras: 'versiones, previas, Word, antiguas' },
    { id: 'bloque-duplicados-descartados', donde: 'herramientas', otras: 'duplicados, descartados, unir' },
    { id: 'bloque-pasar-administraciones', donde: 'herramientas', otras: 'administraciones, terceros, pasar' },
    { id: 'bloque-borrados-fusion', donde: 'herramientas', otras: 'borrados, fusionan, resucitar' },
    /* Dentro de otra sección */
    { id: 'bloque-formularios', dentro: '#bloque-impresos > .bloque-cuerpo' },
    { id: 'bloque-ficheros-datos', dentro: '#alumnado-personal-cuerpo', orden: 1 },
    { id: 'bloque-frescura', dentro: '#alumnado-personal-cuerpo', orden: 2 },
    { id: 'bloque-abreviar-grupos', dentro: '#alumnado-personal-cuerpo', orden: 3 }
  ];

  function $(id) { return document.getElementById(id); }

  function conocido(id) {
    for (var i = 0; i < TABLA.length; i++) if (TABLA[i].id === id) return TABLA[i];
    return null;
  }

  /* Mueve `nodos` (en ese orden) al principio de `cont`, detrás de lo fijo; solo toca los que
     no están ya en su sitio (mover un nodo, aunque sea al mismo sitio, despierta a los observadores). */
  function ordenar(cont, nodos) {
    var ancla = cont.firstElementChild;
    while (ancla && ancla.dataset.fijo) ancla = ancla.nextElementSibling;
    nodos.forEach(function (n) {
      if (n !== ancla) cont.insertBefore(n, ancla);
      ancla = n.nextElementSibling;
    });
  }

  var enMarcha = false;

  function repartir() {
    if (enMarcha) return;
    enMarcha = true;
    try {
      /* Los que no están en la tabla y están en un sitio de paso: al final de «El centro». */
      ['ajustes-tab-mantenimiento', 'ajustes-tab-tipos', 'ajustes-tab-dia'].forEach(function (cid) {
        var cont = $(cid);
        if (!cont) return;
        Array.prototype.slice.call(cont.children).forEach(function (n) {
          if (n.matches && n.matches('details.bloque-ajustes') && !conocido(n.id)) {
            var centro = $('ajustes-tab-centro');
            if (centro) centro.appendChild(n);
          }
        });
      });

      Object.keys(CONTENEDORES).forEach(function (donde) {
        var cont = $(CONTENEDORES[donde]);
        if (!cont) return;
        var nodos = [];
        TABLA.forEach(function (e) {
          if (e.donde !== donde) return;
          var n = $(e.id);
          if (n) nodos.push(n);
        });
        ordenar(cont, nodos);
      });

      /* Las que van dentro de otra sección. */
      var grupos = {};
      TABLA.forEach(function (e) {
        if (!e.dentro) return;
        var n = $(e.id);
        if (!n) return;
        (grupos[e.dentro] = grupos[e.dentro] || []).push({ n: n, orden: e.orden || 0 });
      });
      Object.keys(grupos).forEach(function (sel) {
        var cont = document.querySelector(sel);
        if (!cont) return;
        grupos[sel].forEach(function (g) {
          if (g.n.parentNode !== cont) cont.appendChild(g.n);
        });
        /* En su orden, tras lo que la sección lleve de suyo. */
        grupos[sel].sort(function (a, b) { return a.orden - b.orden; });
        var ultimo = null;
        grupos[sel].forEach(function (g) {
          if (ultimo && g.n.previousElementSibling !== ultimo) cont.insertBefore(g.n, ultimo.nextSibling);
          ultimo = g.n;
        });
      });

      if (window.AjustesPlegado && AjustesPlegado.registrarTodos) AjustesPlegado.registrarTodos();
      actualizarProblemas();
    } finally { enMarcha = false; }
  }

  /* ---------- la pestaña «Problemas» ----------

     Fila 291: son tarjetas que pinta js/problemas.js (con la cuenta, el punto ámbar y «Todo en
     orden»). Aquí solo queda ponerlas al día cuando se reparte. */

  function actualizarProblemas() {
    if (window.Problemas) Problemas.pintar();
  }

  /* ---------- el salto común ---------- */

  function abrirAncestros(el) {
    var d = el.closest('details');
    while (d) {
      if (!d.open) d.open = true;
      d = d.parentElement && d.parentElement.closest('details');
    }
  }

  /* Va a la sección (selector o elemento): a su pestaña de Ajustes o a Herramientas, la abre,
     la deja a la vista y la resalta un momento. Devuelve falso si no existe todavía. */
  function irASeccion(que) {
    var el = typeof que === 'string' ? document.querySelector(que) : que;
    if (!el) return false;
    var enHerr = !!el.closest('#pantalla-herramientas');
    if (enHerr) {
      var herr = $('pantalla-herramientas');
      if (herr && herr.classList.contains('oculto') && App.ir) App.ir('herramientas');
    } else {
      var aj = $('pantalla-ajustes');
      if (aj && aj.classList.contains('oculto') && App.ir) App.ir('ajustes');
      var tab = el.closest('.ajustes-tab');
      if (tab && App.cambiarPestanaAjustes) App.cambiarPestanaAjustes(tab.id.replace('ajustes-tab-', ''));
    }
    /* Algunos bloques se pliegan solos al terminar de cargar (js/ajustes-plegado.js recoloca lo
       que recordaba): se vuelve a abrir un par de veces más, hasta que asienten. */
    abrirAncestros(el);
    setTimeout(function () { abrirAncestros(el); }, 400);
    setTimeout(function () { abrirAncestros(el); }, 1500);
    setTimeout(function () {
      if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    var det = el.closest('details') || el;
    det.classList.remove('destello');
    void det.offsetWidth;
    det.classList.add('destello');
    setTimeout(function () { det.classList.remove('destello'); }, 1600);
    return true;
  }

  /* ---------- arranque ---------- */

  var pendiente = null;
  function pronto() {
    if (pendiente) return;
    pendiente = setTimeout(function () { pendiente = null; repartir(); }, 0);
  }

  function arrancar() {
    repartir();
    if (window.MutationObserver) {
      DE_PASO.forEach(function (cid) {
        var cont = $(cid);
        if (cont) new MutationObserver(pronto).observe(cont, { childList: true });
      });
    }
    /* Los enlaces de arriba de «Alumnado y personal» y el de «Copias de seguridad». */
    function enlace(id, selector) {
      var b = $(id);
      if (b) b.onclick = function () { irASeccion(selector); };
    }
    enlace('alumnado-enlace-traer', '#bloque-traer-alumnado');
    enlace('alumnado-enlace-carpeta-bd', '#bloque-alumnado-bd');
    enlace('copias-enlace-restaurar', '#bloque-restaurar-copia');
  }

  App.irASeccionDeAjustes = irASeccion;
  arrancar();

  return { TABLA: TABLA, LINEAS: LINEAS, repartir: repartir, irASeccion: irASeccion, actualizarProblemas: actualizarProblemas };
})();
