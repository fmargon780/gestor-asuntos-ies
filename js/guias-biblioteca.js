/* ============================================================
   guias-biblioteca.js — la pintura de la biblioteca de hitos del
   centro (20-sep-2026, fila 79, docs/BIBLIOTECA-DE-HITOS.md).

   El modelo vive en js/hitos-biblioteca.js; aquí solo la pantalla:

     1. El panel "+ Traer de la biblioteca", dentro del propio cuadro
        de la guía (nunca un segundo U.preguntar: "solo hay un cuadro
        de diálogo", regla de siempre).
     2. El botón "Guardar en la biblioteca" de cada paso, con su propio
        panel en línea (mismo patrón que "guia-enlace-fila" de
        js/guias.js) mientras el cuadro de la guía sigue abierto.
     3. La revisión automática al pulsar Guardar (apartado 4.3): pasa
        DESPUÉS de que el cuadro de la guía se haya cerrado (U.preguntar
        ya ha resuelto su promesa y ha ocultado #capa), así que aquí sí
        puede abrir un U.preguntar por cada paso cambiado, uno detrás
        de otro.
     4. El aviso de los demás tipos (apartado 4.4) y su "Ver el
        cambio", llamados desde js/ajustes-tipo.js.
     5. El bloque de Ajustes → El centro, colgado solo (mismo patrón
        que js/hitos-ajustes.js).

   Se carga después de js/hitos-biblioteca.js y de js/hitos-normativa.js.
   ============================================================ */
var GuiasBiblioteca = (function () {

  function usuario() { return (window.App && App.E && App.E.usuario) || ''; }

  /* ==========================================================
     LA COMPARACIÓN, CAMPO A CAMPO (un solo componente, para 4.3 y 4.4)
     ========================================================== */

  function comparacionHTML(diffs) {
    return '<table class="tabla-comparacion">' +
      '<thead><tr><th></th><th>Este tipo</th><th>La biblioteca</th></tr></thead><tbody>' +
      diffs.map(function (d) {
        return '<tr><td>' + U.escapar(d.etiqueta) + '</td><td>' + U.escapar(d.antes) +
          '</td><td>' + U.escapar(d.despues) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  /* ==========================================================
     1. "+ TRAER DE LA BIBLIOTECA" (apartado 4.1)

     Un panel dentro del propio cuadro de la guía: se engancha justo
     detrás del botón que lo abre, oculto de partida, y se rellena cada
     vez que se abre (la biblioteca puede haber cambiado desde el otro
     ordenador). `alElegir(modelo)` recibe el modelo elegido; quien
     llama decide qué hacer con él (insertarlo como paso nuevo).
     ========================================================== */

  function resumenDeModelo(m) {
    var trozos = [];
    if (m.responsable) trozos.push(m.responsable);
    if (m.plazo && m.plazo.dias) trozos.push((typeof Plazos !== 'undefined' && Plazos.textoPlazo ? Plazos.textoPlazo(m.plazo) : m.plazo.dias + ' días') + ' de plazo');   /* fila 131 */
    /* Fila 138: lo que hay que reunir son líneas del guion. */
    var n = (m.guion || []).filter(function (g) { return g && g.reunir; }).length;
    if (n) trozos.push(n + (n === 1 ? ' cosa que reunir' : ' cosas que reunir'));
    return trozos.join(' · ') || 'Sin más datos';
  }

  function panelTraerHTML() {
    return '<div class="biblioteca-panel oculto" id="biblioteca-panel-traer">' +
      '<input type="search" class="campo" id="biblioteca-buscar" placeholder="Buscar por nombre">' +
      '<div class="biblioteca-panel-lista" id="biblioteca-panel-lista"></div>' +
      '<button type="button" class="boton" id="biblioteca-panel-cerrar">Cerrar</button>' +
      '</div>';
  }

  /* `cuadro` es el nodo raíz del cuadro de la guía (donde ya está
     insertado panelTraerHTML()). `botonAbrir` lo abre y lo cierra;
     `alElegir` recibe el modelo elegido y el panel se cierra solo. */
  async function engancharPanelTraer(cuadro, botonAbrir, alElegir) {
    var panel = cuadro.querySelector('#biblioteca-panel-traer');
    var buscar = cuadro.querySelector('#biblioteca-buscar');
    var lista = cuadro.querySelector('#biblioteca-panel-lista');
    if (!panel || !botonAbrir) return;

    var modelos = [];

    function pintarLista() {
      var q = U.normalizar(buscar.value || '');
      var filtrados = modelos.filter(function (m) { return !q || U.normalizar(m.nombre).indexOf(q) !== -1; });
      lista.innerHTML = filtrados.length ? '' :
        '<div class="vacio">' + (modelos.length ? 'Nada encontrado.' : 'La biblioteca está vacía todavía.') + '</div>';
      filtrados.forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'biblioteca-panel-item';
        b.innerHTML = '<span class="nombre-tipo">' + U.escapar(m.nombre) + '</span>' +
          '<span class="suave">' + U.escapar(resumenDeModelo(m)) + '</span>';
        b.onclick = function () {
          panel.classList.add('oculto');
          alElegir(m);
        };
        lista.appendChild(b);
      });
    }

    botonAbrir.onclick = async function () {
      var abrir = panel.classList.contains('oculto');
      panel.classList.toggle('oculto');
      if (!abrir) return;
      lista.innerHTML = '<div class="vacio">Leyendo…</div>';
      try { modelos = (await HitosBiblioteca.leer()).modelos; } catch (e) { modelos = []; }
      pintarLista();
      buscar.value = '';
      buscar.focus();
    };
    buscar.oninput = pintarLista;
    var cerrar = cuadro.querySelector('#biblioteca-panel-cerrar');
    if (cerrar) cerrar.onclick = function () { panel.classList.add('oculto'); };
  }

  /* ==========================================================
     2. "GUARDAR EN LA BIBLIOTECA" DE UN PASO (apartados 4.2 y 4.3)

     Un panel en línea, con el mismo patrón que "guia-enlace-fila" de
     js/guias.js: el cuadro de la guía sigue abierto, así que no se
     puede abrir un segundo U.preguntar. `paso` es pasos[i] tal y como
     está ahora mismo (ya releído con recoger()); `onGuardado(origen)`
     recibe el `origenBiblioteca` nuevo (o null si se canceló, o si el
     paso no ha cambiado nada).
     ========================================================== */

  function botonHTML() {
    return '<button type="button" class="boton paso-guardar-biblioteca" ' +
      'title="Guardar este paso en la biblioteca del centro">Guardar en la biblioteca</button>' +
      '<div class="biblioteca-panel-fila oculto">' +
        '<div class="biblioteca-panel-fila-nombre">' +
          '<label class="etiqueta">Nombre en la biblioteca</label>' +
          '<input class="campo biblioteca-nombre-nuevo">' +
          '<button type="button" class="boton boton-principal biblioteca-nombre-ok">Crear el modelo</button>' +
        '</div>' +
        '<div class="biblioteca-panel-fila-diff oculto">' +
          '<div class="biblioteca-diff-cuerpo"></div>' +
          '<button type="button" class="boton boton-principal biblioteca-diff-subir">Subir también a la biblioteca</button>' +
          '<button type="button" class="boton biblioteca-diff-solo">Solo en este tipo</button>' +
        '</div>' +
        '<button type="button" class="boton biblioteca-panel-fila-cancelar">Cancelar</button>' +
      '</div>';
  }

  /* `raiz` es el `.paso-editor` de este paso, ya con botonHTML()
     insertado dentro de `.paso-mandos`. `estado` decide qué hueco del
     panel se ve: 'nuevo' (4.2, primera vez) o 'diff' (4.2 → 4.3, ya
     viene de la biblioteca y ha cambiado). Sin ninguno de los dos, el
     botón entero no se pinta (lo decide quien llama, más abajo). */
  function engancharBoton(raiz, paso, modelo, diffs, onGuardado) {
    var boton = raiz.querySelector('.paso-guardar-biblioteca');
    var panel = raiz.querySelector('.biblioteca-panel-fila');
    if (!boton || !panel) return;
    var esNuevo = !paso.origenBiblioteca;

    boton.onclick = function () {
      panel.classList.remove('oculto');
      panel.querySelector('.biblioteca-panel-fila-nombre').classList.toggle('oculto', !esNuevo);
      panel.querySelector('.biblioteca-panel-fila-diff').classList.toggle('oculto', esNuevo);
      if (esNuevo) {
        var campo = panel.querySelector('.biblioteca-nombre-nuevo');
        campo.value = paso.titulo || '';
        campo.focus();
      } else {
        panel.querySelector('.biblioteca-diff-cuerpo').innerHTML = comparacionHTML(diffs);
      }
    };

    panel.querySelector('.biblioteca-panel-fila-cancelar').onclick = function () {
      panel.classList.add('oculto');
    };

    panel.querySelector('.biblioteca-nombre-ok').onclick = async function () {
      var nombre = panel.querySelector('.biblioteca-nombre-nuevo').value.trim();
      if (!nombre) return;
      var m = await HitosBiblioteca.crearDesdePaso(paso, nombre, usuario());
      panel.classList.add('oculto');
      onGuardado({ id: m.id, revision: m.revision, divergido: false });
    };

    panel.querySelector('.biblioteca-diff-subir').onclick = async function () {
      var m = await HitosBiblioteca.actualizarDesdePaso(modelo.id, paso, usuario());
      panel.classList.add('oculto');
      onGuardado(m ? { id: m.id, revision: m.revision, divergido: false } : paso.origenBiblioteca);
    };

    panel.querySelector('.biblioteca-diff-solo').onclick = function () {
      panel.classList.add('oculto');
      /* "Queda marcado como cambiado aquí": conserva la revision que
         ya tenía y no vuelve a avisar de este mismo cambio. */
      onGuardado({ id: paso.origenBiblioteca.id, revision: paso.origenBiblioteca.revision, divergido: true });
    };
  }

  /* ==========================================================
     3. LA REVISIÓN AL PULSAR GUARDAR (apartado 4.3)

     Se llama DESPUÉS de que el U.preguntar de la guía haya cerrado
     #capa (su promesa ya está resuelta): aquí sí se puede abrir un
     U.preguntar por cada paso cambiado, uno detrás de otro. Muta
     `pasos` en el sitio; no devuelve nada.
     ========================================================== */

  function pasosConOrigen(pasos) {
    /* Solo los de arriba: normativa y soloInformativo (y por tanto la
       comparación) no existen en los subpasos de una opción. */
    return (pasos || []).filter(function (p) { return p.origenBiblioteca && !p.origenBiblioteca.divergido; });
  }

  async function revisarAlGuardar(pasos) {
    var biblioteca = await HitosBiblioteca.leer();
    var candidatos = pasosConOrigen(pasos);
    for (var i = 0; i < candidatos.length; i++) {
      var paso = candidatos[i];
      var modelo = HitosBiblioteca.buscar(biblioteca, paso.origenBiblioteca.id);
      if (!modelo) continue;
      var diffs = HitosBiblioteca.diferencias(paso, modelo);
      if (!diffs.length) continue;

      $('cuadro-cancelar').textContent = 'Solo en este tipo';
      var subir = await U.preguntar('"' + modelo.nombre + '" ha cambiado',
        '<p class="explica">Este paso ya no es igual que su modelo en la biblioteca.</p>' +
        comparacionHTML(diffs), 'Subir también a la biblioteca');
      $('cuadro-cancelar').textContent = 'Cancelar';

      if (subir) {
        var m = await HitosBiblioteca.actualizarDesdePaso(modelo.id, paso, usuario());
        paso.origenBiblioteca = m ? { id: m.id, revision: m.revision, divergido: false } : paso.origenBiblioteca;
        biblioteca = await HitosBiblioteca.leer();   /* para que el siguiente paso vea la revisión nueva */
      } else {
        paso.origenBiblioteca = { id: paso.origenBiblioteca.id, revision: paso.origenBiblioteca.revision, divergido: true };
      }
    }
  }

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     4. EL AVISO EN LOS DEMÁS TIPOS (apartado 4.4)
     ========================================================== */

  /* `pasos` son los de UN tipo (GuiasDelCentro.pasosDe(tipo.tipo)).
     Devuelve solo los que están desactualizados, con su modelo y sus
     diferencias ya calculadas, listos para pintar. */
  async function pasosDesactualizados(pasos) {
    var biblioteca = await HitosBiblioteca.leer();
    var salida = [];
    pasosConOrigen(pasos).forEach(function (p) {
      var modelo = HitosBiblioteca.buscar(biblioteca, p.origenBiblioteca.id);
      if (!modelo || p.origenBiblioteca.revision >= modelo.revision) return;
      var diffs = HitosBiblioteca.diferencias(p, modelo);
      if (diffs.length) salida.push({ paso: p, modelo: modelo, diffs: diffs });
    });
    return salida;
  }

  /* "Ver el cambio": Traer el cambio / Dejarlo como está. Devuelve el
     paso ya actualizado (o el mismo, con la revision al día) para que
     quien llama vuelva a guardar la guía entera con GuiasDelCentro. */
  async function abrirComparacion(entrada) {
    $('cuadro-cancelar').textContent = 'Dejarlo como está';
    var traer = await U.preguntar('"' + entrada.modelo.nombre + '" ha cambiado en la biblioteca',
      comparacionHTML(entrada.diffs), 'Traer el cambio');
    $('cuadro-cancelar').textContent = 'Cancelar';

    if (traer) {
      var idDeAntes = entrada.paso.id;
      var informativoDeAntes = entrada.paso.soloInformativo;
      Object.assign(entrada.paso, HitosBiblioteca.modeloAPaso(entrada.modelo));
      /* El id del paso no cambia (sigue siendo el mismo dentro de la
         guía); "la marca soloInformativo del tipo se conserva, no la
         pisa el modelo" (apartado 4.4). */
      entrada.paso.id = idDeAntes;
      entrada.paso.soloInformativo = informativoDeAntes;
    } else {
      entrada.paso.origenBiblioteca = { id: entrada.modelo.id, revision: entrada.modelo.revision, divergido: false };
    }
    return entrada.paso;
  }

  /* ==========================================================
     5. EL BLOQUE DE AJUSTES → EL CENTRO
     ========================================================== */

  function bloqueDeAjustes() {
    var ya = document.getElementById('bloque-biblioteca-hitos');
    if (ya) return ya;
    var pantalla = document.getElementById('ajustes-tab-centro');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-biblioteca-hitos';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Biblioteca de hitos</span>' +
        '<span class="bloque-pie">Los pasos del trámite que se repiten entre tipos de asunto</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<div class="alta-tipo">' +
          '<input id="biblioteca-nuevo-nombre" class="campo" placeholder="Nombre del modelo">' +
          '<button id="btn-anadir-modelo-biblioteca" class="boton">Crear desde cero</button>' +
        '</div>' +
        '<div id="tabla-biblioteca" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    $('btn-anadir-modelo-biblioteca').onclick = crearDesdeCero;
    return d;
  }

  async function crearDesdeCero() {
    var nombre = ($('biblioteca-nuevo-nombre').value || '').trim();
    if (!nombre) return;
    try {
      await HitosBiblioteca.crearDesdeCero(nombre, usuario());
      $('biblioteca-nuevo-nombre').value = '';
      U.aviso('Modelo creado. Ábrelo para escribir el resto.', 'bueno');
      pintarAjustes();
    } catch (e) { U.aviso('No he podido crearlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  /* El mismo editor de un paso que ya existe, para no escribir un
     segundo formulario (apartado 4.5): un modelo, aquí, no es más que
     un paso sin id de guía, así que Guias.editar() sirve igual con una
     lista de un solo elemento. Al guardar, solo hace falta el primero. */
  async function editarModelo(m) {
    if (window.GuiasDocumentos) await GuiasDocumentos.precargar();   /* fila 102 */
    /* Fila 159: el responsable por defecto de un modelo, como en la guía. */
    var opcionesResp = [];
    try {
      var aj = (await Hitos.leer()).ajustes;
      opcionesResp = (window.HitosAdministracion ? HitosAdministracion.paraGuia(aj) : aj.responsables).concat(Hitos.PAPELES);
    } catch (e) { opcionesResp = []; }
    var pasos = await Guias.editar(m.nombre, [{
      id: m.id, titulo: m.titulo, cuerpo: m.explicacion, opciones: [],
      responsable: m.responsable, estadoAsunto: m.estadoAsunto, plazo: m.plazo,
      requisitos: m.requisitos, comunicacion: m.comunicacion,
      soloInformativo: m.soloInformativo, normativa: m.normativa,
      /* Sin estos dos, editar un modelo los perdía (fila 102). */
      formularios: m.formularios, plantillasDocumento: m.plantillasDocumento,
      guion: m.guion   /* fila 109 */
    }], opcionesResp, [], { irA: m.id });   /* fila 122: el único paso, ya abierto */
    if (!pasos || !pasos.length) return;
    try {
      await HitosBiblioteca.editar(m.id, pasos[0], usuario());
      pintarAjustes();
      U.aviso('Modelo guardado.', 'bueno');
    } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function borrarModelo(m) {
    var guias = null;
    try { guias = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { guias = null; }
    var enUso = HitosBiblioteca.tiposQueUsan(m.id, guias || {});
    var aviso = enUso.length
      ? '<p class="nota">Está en uso en: <strong>' + enUso.map(U.escapar).join(', ') + '</strong>. ' +
        'Los pasos ya insertados en esos tipos se quedan como están, sin este vínculo.</p>'
      : '';
    var ok = await U.preguntar('Borrar de la biblioteca',
      '<p><strong>' + U.escapar(m.nombre) + '</strong></p>' + aviso, 'Borrar');
    if (!ok) return;
    try {
      await HitosBiblioteca.borrar(m.id);
      pintarAjustes();
      U.aviso('Modelo borrado.', 'bueno');
    } catch (e) { U.aviso('No he podido borrarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  async function pintarAjustes() {
    var d = bloqueDeAjustes();
    if (!d) return;
    var caja = $('tabla-biblioteca');
    var datos;
    try { datos = await HitosBiblioteca.leer(); }
    catch (e) { caja.innerHTML = '<div class="vacio">No he podido leer la biblioteca: ' + U.escapar(U.mensajeDeError(e)) + '</div>'; return; }
    caja.innerHTML = '';
    if (!datos.modelos.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún modelo.</div>';
      return;
    }
    datos.modelos.forEach(function (m) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(m.nombre) + '</span>' +
        '<span class="suave" style="flex:1">' + U.escapar(resumenDeModelo(m)) + '</span>';
      var editarBtn = document.createElement('button');
      editarBtn.type = 'button'; editarBtn.className = 'boton'; editarBtn.textContent = 'Editar';
      editarBtn.onclick = function () { editarModelo(m); };
      f.appendChild(editarBtn);
      var borrarBtn = document.createElement('button');
      borrarBtn.type = 'button'; borrarBtn.className = 'boton boton-peligro'; borrarBtn.textContent = 'Borrar';
      borrarBtn.onclick = function () { borrarModelo(m); };
      f.appendChild(borrarBtn);
      caja.appendChild(f);
    });
  }

  (function enganchar() {
    function hacerlo() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (App.pantallaALaVista && !App.pantallaALaVista('ajustes')) return;   /* fila 101 */
        if (window.Gestor.carpetaGestor()) pintarAjustes();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hacerlo);
    else hacerlo();
  })();

  return {
    panelTraerHTML: panelTraerHTML, engancharPanelTraer: engancharPanelTraer,
    botonHTML: botonHTML, engancharBoton: engancharBoton,
    revisarAlGuardar: revisarAlGuardar,
    pasosDesactualizados: pasosDesactualizados, abrirComparacion: abrirComparacion,
    comparacionHTML: comparacionHTML
  };
})();
window.GuiasBiblioteca = GuiasBiblioteca;
