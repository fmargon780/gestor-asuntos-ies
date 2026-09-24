/* ============================================================
   unir-asuntos.js — unir dos asuntos duplicados que ya existen.

   js/duplicados.js se ocupa de la creación de un asunto nuevo: si dos
   carpetas del mismo tercero, tipo y año académico ya existen porque
   se crearon antes de que hubiera parada al crear (o porque se
   crearon a mano), aquí se ofrece unirlas.

   Hasta el 11-sep-2026 esto salía como una franja amarilla encima de
   la lista de asuntos abiertos, una por cada grupo. Con pocos casos
   iba bien, pero con muchos se comía la pantalla antes de ver ni un
   asunto. Ahora los duplicados tienen su propia pantalla:

   - En la cabecera de "Asuntos abiertos", junto al botón "Tablón",
     sale un aviso de una sola línea ("3 posibles duplicados —
     Revisar") si hay alguno; si no hay ninguno, no sale nada.
   - Al pulsarlo se entra en la pantalla "Duplicados" (no está en el
     menú de la izquierda: solo se llega desde ese aviso). Cada grupo
     se ve en columnas, una por asunto, con su nombre (enlaza a su
     ficha), su fecha de apertura, estado, vía y plazo, sus documentos
     (se abren en el visor de siempre) y sus últimas notas.
   - "Unir" hace exactamente lo mismo que hacía el botón de la franja:
     esa lógica no se ha tocado.
   - "No son el mismo" descarta ESE grupo para siempre (o hasta que se
     diga lo contrario): se guarda en _GESTOR/no-duplicados.json, un
     fichero compartido más, con copia de seguridad como los demás.
     Se guarda por la firma exacta del grupo (los nombres de sus
     carpetas, ordenados): si más adelante se crea un tercer asunto
     que encaje en el mismo tercero+tipo+curso, el grupo cambia de
     firma y vuelve a avisar, porque ya no es el mismo grupo que se
     descartó.
   - Los grupos descartados se pueden volver a avisar desde Ajustes,
     en el bloque "Duplicados descartados" que pone este mismo fichero
     (sin tocar js/ajustes.js): "Volver a avisar" por cada uno.

   Cargado justo después de js/asuntos-lista.js, que es quien define
   App.pintarAbiertos: aquí se envuelve, igual que hacen otros módulos
   de la aplicación con otras funciones de App. La pantalla y el
   bloque de Ajustes los crea este fichero por su cuenta, así que
   index.html no necesita más marcado que el enlace a
   css/unir-asuntos.css y el propio <script>.

   Desde la fila 133 (24-sep-2026, docs/PARTIR-FICHEROS-GRANDES.md) la
   pantalla de Duplicados vive en js/unir-asuntos-pantalla.js y la
   unión de verdad en js/unir-asuntos-unir.js, que se cargan justo
   después y comparten lo necesario por `UnirAsuntos._interno` (I).
   ============================================================ */
(function () {
  var I = {};
  /* Lo que usan js/unir-asuntos-pantalla.js y js/unir-asuntos-unir.js. */
  I.pintarAviso = pintarAviso; I.gruposActivos = gruposActivos; I.descartarGrupo = descartarGrupo;

  var FICHERO_DESCARTES = 'no-duplicados.json';
  var SEPARADOR_FIRMA = '';

  function $(id) { return document.getElementById(id); }

  /* ---------- quién es cada asunto, para agrupar ----------

     Igual que antes de este cambio: sin tercero o sin tipo no hay
     nada fiable que comparar, así que esos asuntos no entran en
     ningún grupo. */

  function terceroDe(a) {
    if (a.ficha && a.ficha.tercero) return a.ficha.tercero;
    if (a.leido && a.leido.resto && window.Nombres) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  function tipoDe(a) {
    if (App.tipoDeAsunto) return App.tipoDeAsunto(a);
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function cursoDe(a) {
    return window.Duplicados ? window.Duplicados.cursoDe(a.nombre) : '';
  }

  function claveDe(a) {
    var tercero = U.normalizar(terceroDe(a));
    var tipo = U.normalizar(tipoDe(a));
    if (!tercero || !tipo) return '';
    return tercero + '|' + tipo + '|' + U.normalizar(cursoDe(a));
  }

  function todosLosGrupos() {
    var por = {};
    (App.E.listaAbiertos || []).forEach(function (a) {
      var k = claveDe(a);
      if (!k) return;
      (por[k] = por[k] || []).push(a);
    });
    return Object.keys(por).map(function (k) { return por[k]; })
      .filter(function (g) { return g.length > 1; });
  }

  /* La firma de un grupo: los nombres de sus carpetas, ordenados y
     unidos. Si el grupo gana o pierde un miembro, la firma cambia, y
     un descarte guardado con la firma vieja deja de encajar: por eso
     un grupo descartado vuelve a avisar solo si cambia quién lo forma. */
  function firmaDe(grupo) {
    return grupo.map(function (a) { return a.nombre; }).slice().sort().join(SEPARADOR_FIRMA);
  }

  /* ---------- los descartes: "no son el mismo" ----------

     _GESTOR/no-duplicados.json, un fichero compartido más: se lee al
     entrar y se relee justo antes de escribir, como todo lo que se
     comparte entre los dos ordenadores del centro. */

  var descartes = [];       /* [{ firma, nombres, el, por }] */
  var descartesLeidos = false;

  function normalizarDescartes(leido) {
    var lista = (leido && leido.descartados) || [];
    return lista.filter(function (d) { return d && d.firma && Array.isArray(d.nombres); }).map(function (d) {
      return {
        firma: String(d.firma),
        nombres: d.nombres.map(function (n) { return String(n); }),
        el: String(d.el || ''),
        por: String(d.por || '')
      };
    });
  }

  async function cargarDescartes() {
    if (!App.E.gestor) return;
    try {
      var leido = await Carpetas.leerJson(App.E.gestor, FICHERO_DESCARTES);
      descartes = normalizarDescartes(leido);
    } catch (e) {
      descartes = [];
    }
    descartesLeidos = true;
  }

  async function guardarDescartes(lista) {
    await Copias.guardar(App.E.gestor, FICHERO_DESCARTES, { descartados: lista });
    descartes = lista;
  }

  function estaDescartado(grupo) {
    var firma = firmaDe(grupo);
    return descartes.some(function (d) { return d.firma === firma; });
  }

  /* Se relee el fichero justo antes de escribir: el compañero puede
     haber descartado o devuelto otro grupo desde el otro ordenador
     mientras tanto. */
  async function descartarGrupo(grupo) {
    var firma = firmaDe(grupo);
    await cargarDescartes();
    if (descartes.some(function (d) { return d.firma === firma; })) return;   /* ya estaba */
    var lista = descartes.concat([{
      firma: firma,
      nombres: grupo.map(function (a) { return a.nombre; }).slice().sort(),
      el: U.ahora(),
      por: App.E.usuario || ''
    }]);
    await guardarDescartes(lista);
  }

  async function volverAAvisar(firma) {
    await cargarDescartes();
    var lista = descartes.filter(function (d) { return d.firma !== firma; });
    await guardarDescartes(lista);
  }

  /* Los grupos que de verdad hay que enseñar: los que se parecen y no
     se han descartado. */
  function gruposActivos() {
    return todosLosGrupos().filter(function (g) { return !estaDescartado(g); });
  }

  /* ---------- el aviso de una línea, junto a "Tablón" ---------- */

  var botonAviso = null;

  function cajaDelAviso() {
    if (botonAviso && botonAviso.parentNode) return botonAviso;
    var acciones = document.querySelector('#pantalla-abiertos .cabecera .acciones');
    if (!acciones) return null;
    botonAviso = document.createElement('button');
    botonAviso.type = 'button';
    botonAviso.id = 'btn-duplicados';
    botonAviso.className = 'boton boton-ambar oculto';
    botonAviso.onclick = function () { I.irADuplicados(); };
    var antesDe = $('btn-tablon') || $('btn-recargar');
    if (antesDe && antesDe.parentNode === acciones) acciones.insertBefore(botonAviso, antesDe);
    else acciones.appendChild(botonAviso);
    return botonAviso;
  }

  function pintarAviso() {
    var b = cajaDelAviso();
    if (!b) return;
    var n = gruposActivos().length;
    if (!n) { b.classList.add('oculto'); return; }
    b.textContent = '⚠ ' + (n === 1 ? '1 posible duplicado' : n + ' posibles duplicados') + ' — Revisar';
    b.classList.remove('oculto');
  }

  U.envolver(App, 'App.pintarAbiertos', 'unir-asuntos.js', function (comoEra) {
    return function () {
      comoEra();
      try { pintarAviso(); } catch (e) { /* el aviso nunca estorba */ }
    };
  });

  /* Al abrir o cerrar sesión, cambiar de asunto, etc. el aviso también
     debe repasarse: se engancha al refresco general de los módulos,
     igual que hacen frescura.js y conflictos.js. */
  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (!descartesLeidos && App.E.gestor) { cargarDescartes().then(pintarAviso); return; }
        try { pintarAviso(); } catch (e) {}
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  /* ---------- el bloque de Ajustes: "Duplicados descartados" ----------

     Lo crea este mismo módulo, enganchado al refresco general de la
     aplicación (igual que frescura.js y conflictos.js), sin tocar
     js/ajustes.js. */

  function bloqueDeAjustes() {
    var ya = $('bloque-duplicados-descartados');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-duplicados-descartados';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Duplicados descartados</span>' +
        '<span class="bloque-pie" id="duplicados-descartados-pie">Grupos marcados como "No son el mismo"</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Cuando en la pantalla de Duplicados se dice que dos asuntos ' +
        '"No son el mismo", ese grupo deja de avisar. Aquí se puede volver a avisar de ' +
        'cualquiera de ellos. Si entre tanto se crea otro asunto que encaje en el mismo ' +
        'grupo, vuelve a avisar solo, sin hacer falta nada de esto.</p>' +
        '<div id="tabla-duplicados-descartados" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    var pie = $('duplicados-descartados-pie');
    if (pie) pie.textContent = descartes.length
      ? descartes.length + (descartes.length === 1 ? ' grupo descartado' : ' grupos descartados')
      : 'Grupos marcados como "No son el mismo"';

    var caja = $('tabla-duplicados-descartados');
    if (!caja) return;
    caja.innerHTML = '';
    if (!descartes.length) {
      caja.innerHTML = '<div class="vacio">Ninguno.</div>';
      return;
    }
    descartes.forEach(function (d) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(d.nombres.join('  ·  ')) + '</span>' +
        '<span class="suave" style="flex:1">' +
        U.escapar((d.por ? 'Descartado por ' + d.por : 'Descartado') +
          (d.el ? ', ' + (window.Notas ? window.Notas.cuando(d.el) : d.el) : '')) +
        '</span>';
      var volver = document.createElement('button');
      volver.className = 'boton';
      volver.textContent = 'Volver a avisar';
      volver.onclick = async function () {
        volver.disabled = true;
        try {
          await volverAAvisar(d.firma);
          pintarBloqueAjustes();
          pintarAviso();
          U.aviso('Se volverá a avisar de ese grupo si sigue pareciendo el mismo.', 'bueno');
        } catch (e) {
          volver.disabled = false;
          U.aviso('No he podido deshacerlo: ' + U.mensajeDeError(e), 'malo');
        }
      };
      f.appendChild(volver);
      caja.appendChild(f);
    });
  }

  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (!$('pantalla-ajustes')) return;
        if (!descartesLeidos && App.E.gestor) {
          cargarDescartes().then(pintarBloqueAjustes);
          return;
        }
        try { pintarBloqueAjustes(); } catch (e) {}
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  /* Para pruebas/unir-asuntos.mjs (fila 69, docs/PRUEBAS-QUE-FALTAN.md,
     2.2): la unión de verdad, sin fingir un segundo camino aparte. */
  window.UnirAsuntos = { _interno: I };

})();
