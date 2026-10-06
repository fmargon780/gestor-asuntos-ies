/* ============================================================
   guias-biblioteca.js — la pintura de la biblioteca de hitos del
   centro (20-sep-2026, fila 79, docs/BIBLIOTECA-DE-HITOS.md).

   El modelo vive en js/hitos-biblioteca.js; aquí solo la pantalla:

     1. El panel "+ Traer de la biblioteca", dentro del propio cuadro
        de la guía (nunca un segundo U.preguntar: "solo hay un cuadro
        de diálogo", regla de siempre).
     2. El botón "Guardar en la biblioteca" de cada hito, con su propio
        panel en línea (mismo patrón que "guia-enlace-fila" de
        js/guias.js) mientras el cuadro de la guía sigue abierto.
     3. La revisión automática al pulsar Guardar (apartado 4.3): pasa
        DESPUÉS de que el cuadro de la guía se haya cerrado (U.preguntar
        ya ha resuelto su promesa y ha ocultado #capa), así que aquí sí
        puede abrir un U.preguntar por cada hito cambiado, uno detrás
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
     ordenador). `alElegir(modelo)` recibe el hito de la biblioteca elegido; quien
     llama decide qué hacer con él (insertarlo como hito nuevo).
     ========================================================== */

  function resumenDeModelo(m) {
    var trozos = [];
    if (m.responsable) trozos.push(m.responsable);
    if (m.plazo && m.plazo.dias) trozos.push((typeof Plazos !== 'undefined' && Plazos.textoPlazo ? Plazos.textoPlazo(m.plazo) : m.plazo.dias + ' días') + ' de plazo');   /* fila 131 */
    /* Fila 138: lo que hay que reunir son líneas de la tarea. */
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
     `alElegir` recibe el hito de la biblioteca elegido y el panel se cierra solo. */
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
     2. "GUARDAR EN LA BIBLIOTECA" DE UN HITO (apartados 4.2 y 4.3)

     Un panel en línea, con el mismo patrón que "guia-enlace-fila" de
     js/guias.js: el cuadro de la guía sigue abierto, así que no se
     puede abrir un segundo U.preguntar. `paso` es pasos[i] tal y como
     está ahora mismo (ya releído con recoger()); `onGuardado(origen)`
     recibe el `origenBiblioteca` nuevo (o null si se canceló, o si el
     hito no ha cambiado nada).
     ========================================================== */

  function botonHTML() {
    return '<button type="button" class="boton paso-guardar-biblioteca" ' +
      'title="Guardar este hito en la biblioteca del centro">Guardar en la biblioteca</button>' +
      '<div class="paso-guardar-biblioteca-ayuda suave">Para poder usarlo en otros tipos</div>' +
      '<div class="biblioteca-panel-fila oculto">' +
        '<div class="biblioteca-panel-fila-nombre">' +
          '<label class="etiqueta">Nombre en la biblioteca</label>' +
          '<input class="campo biblioteca-nombre-nuevo">' +
          '<button type="button" class="boton boton-principal biblioteca-nombre-ok">Crear</button>' +
        '</div>' +
        /* Apartado 3, punto 3: si ya hay un modelo parecido por el
           título, se pregunta antes de crear uno igual. */
        '<div class="biblioteca-panel-fila-parecido oculto">' +
          '<p class="biblioteca-parecido-texto"></p>' +
          '<button type="button" class="boton biblioteca-parecido-usar">Usar ese</button>' +
          '<button type="button" class="boton boton-principal biblioteca-parecido-crear">Crear otro</button>' +
        '</div>' +
        '<div class="biblioteca-panel-fila-diff oculto">' +
          '<p class="biblioteca-panel-fila-pregunta"></p>' +
          '<div class="biblioteca-diff-cuerpo"></div>' +
          '<button type="button" class="boton boton-principal biblioteca-diff-subir">También en la biblioteca</button>' +
          '<button type="button" class="boton biblioteca-diff-solo">Solo aquí</button>' +
        '</div>' +
        '<button type="button" class="boton biblioteca-panel-fila-cancelar">Cancelar</button>' +
      '</div>';
  }

  /* `raiz` es el `.paso-editor` de este hito, ya con botonHTML()
     insertado dentro de `.paso-mandos`. `estado` decide qué hueco del
     panel se ve: 'nuevo' (4.2, primera vez) o 'diff' (4.2 → 4.3, ya
     viene de la biblioteca y ha cambiado). Sin ninguno de los dos, el
     botón entero no se pinta (lo decide quien llama, más abajo).
     `nombreTipo` (fila 201, apartado 3.2): para la pregunta de una
     sola frase cuando el hito ha cambiado. */
  function engancharBoton(raiz, paso, modelo, diffs, nombreTipo, onGuardado) {
    var boton = raiz.querySelector('.paso-guardar-biblioteca');
    var panel = raiz.querySelector('.biblioteca-panel-fila');
    if (!boton || !panel) return;
    var esNuevo = !paso.origenBiblioteca;

    boton.onclick = function () {
      panel.classList.remove('oculto');
      panel.querySelector('.biblioteca-panel-fila-nombre').classList.toggle('oculto', !esNuevo);
      panel.querySelector('.biblioteca-panel-fila-parecido').classList.add('oculto');
      panel.querySelector('.biblioteca-panel-fila-diff').classList.toggle('oculto', esNuevo);
      if (esNuevo) {
        panel.querySelector('.biblioteca-panel-fila-nombre').classList.remove('oculto');
        var campo = panel.querySelector('.biblioteca-nombre-nuevo');
        campo.value = paso.titulo || '';
        campo.focus();
      } else {
        panel.querySelector('.biblioteca-diff-cuerpo').innerHTML = comparacionHTML(diffs);
        var preguntaEl = panel.querySelector('.biblioteca-panel-fila-pregunta');
        preguntaEl.textContent = GuiasBiblioteca.preguntaCambioSoloAqui(nombreTipo, 0);
        GuiasBiblioteca.otrosTiposQueUsan(modelo.id, nombreTipo).then(function (otros) {
          if (panel.isConnected) preguntaEl.textContent = GuiasBiblioteca.preguntaCambioSoloAqui(nombreTipo, otros);
        });
      }
    };

    panel.querySelector('.biblioteca-panel-fila-cancelar').onclick = function () {
      panel.classList.add('oculto');
    };

    /* Apartado 3, punto 3: antes de crear un modelo nuevo, si hay uno
       parecido por el título, se pregunta "¿Crear otro o usar ese?". */
    panel.querySelector('.biblioteca-nombre-ok').onclick = async function () {
      var nombre = panel.querySelector('.biblioteca-nombre-nuevo').value.trim();
      if (!nombre) return;
      var biblioteca = await HitosBiblioteca.leer();
      var nombres = biblioteca.modelos.map(function (m) { return m.nombre; });
      var cerca = U.parecidos(nombre, nombres)[0];
      var parecido = cerca ? biblioteca.modelos.filter(function (m) { return m.nombre === cerca.nombre; })[0] : null;

      if (parecido) {
        panel.querySelector('.biblioteca-panel-fila-nombre').classList.add('oculto');
        var fp = panel.querySelector('.biblioteca-panel-fila-parecido');
        fp.classList.remove('oculto');
        fp.querySelector('.biblioteca-parecido-texto').textContent =
          'Ya hay uno parecido: «' + parecido.nombre + '». ¿Crear otro o usar ese?';
        fp.querySelector('.biblioteca-parecido-crear').onclick = async function () {
          var m = await HitosBiblioteca.crearDesdePaso(paso, nombre, usuario());
          panel.classList.add('oculto');
          onGuardado({ id: m.id, revision: m.revision, divergido: false });
        };
        fp.querySelector('.biblioteca-parecido-usar').onclick = function () {
          panel.classList.add('oculto');
          /* Se usa el que ya está: este paso queda ligado a él, pero
             marcado como cambiado (su contenido es el que Francisco ha
             escrito aquí, no el del modelo), igual que "Solo aquí". */
          onGuardado({ id: parecido.id, revision: parecido.revision, divergido: true });
        };
        return;
      }

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
     U.preguntar por cada hito cambiado, uno detrás de otro. Muta
     `pasos` en el sitio; no devuelve nada.
     ========================================================== */

  function pasosConOrigen(pasos) {
    /* Solo los de arriba: normativa y soloInformativo (y por tanto la
       comparación) no existen en los subpasos de una opción. */
    return (pasos || []).filter(function (p) { return p.origenBiblioteca && !p.origenBiblioteca.divergido; });
  }

  /* `nombreTipo` (fila 201, apartado 3.2): la pregunta se reescribe en
     una sola frase, con el nombre del tipo y cuántos otros tipos usan
     ya ese modelo. */
  async function revisarAlGuardar(pasos, nombreTipo) {
    var biblioteca = await HitosBiblioteca.leer();
    var candidatos = pasosConOrigen(pasos);
    for (var i = 0; i < candidatos.length; i++) {
      var paso = candidatos[i];
      var modelo = HitosBiblioteca.buscar(biblioteca, paso.origenBiblioteca.id);
      if (!modelo) continue;
      var diffs = HitosBiblioteca.diferencias(paso, modelo);
      if (!diffs.length) continue;

      var otros = await GuiasBiblioteca.otrosTiposQueUsan(modelo.id, nombreTipo);
      $('cuadro-cancelar').textContent = 'Solo aquí';
      var subir = await U.preguntar(GuiasBiblioteca.preguntaCambioSoloAqui(nombreTipo, otros),
        comparacionHTML(diffs), 'También en la biblioteca');
      $('cuadro-cancelar').textContent = 'Cancelar';

      if (subir) {
        var m = await HitosBiblioteca.actualizarDesdePaso(modelo.id, paso, usuario());
        paso.origenBiblioteca = m ? { id: m.id, revision: m.revision, divergido: false } : paso.origenBiblioteca;
        biblioteca = await HitosBiblioteca.leer();   /* para que el siguiente hito vea la revisión nueva */
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
     hito ya actualizado (o el mismo, con la revision al día) para que
     quien llama vuelva a guardar la guía entera con GuiasDelCentro. */
  async function abrirComparacion(entrada) {
    $('cuadro-cancelar').textContent = 'Cancelar';
    var traer = await U.preguntar('"' + entrada.modelo.nombre + '" ha cambiado en la biblioteca',
      comparacionHTML(entrada.diffs), 'Traer el cambio');
    $('cuadro-cancelar').textContent = 'Cancelar';

    if (traer) {
      var idDeAntes = entrada.paso.id;
      var informativoDeAntes = entrada.paso.soloInformativo;
      Object.assign(entrada.paso, HitosBiblioteca.modeloAPaso(entrada.modelo,
        entrada.paso.plazo && entrada.paso.plazo.desde));   /* fila 284: el «desde» de la guía se queda */
      /* El id del hito no cambia (sigue siendo el mismo dentro de la
         guía); "la marca soloInformativo del tipo se conserva, no la
         pisa el modelo" (apartado 4.4). */
      entrada.paso.id = idDeAntes;
      entrada.paso.soloInformativo = informativoDeAntes;
    } else {
      entrada.paso.origenBiblioteca = { id: entrada.modelo.id, revision: entrada.modelo.revision, divergido: false };
    }
    return entrada.paso;
  }

  /* Las secciones 6, 7 y 8 (apartados 2 y 3 de
     docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md: la etiqueta de origen, el
     buscador al escribir el título y la guardia de parecidos del texto
     de los documentos) viven en js/guias-biblioteca-guardias.js, que
     extiende este mismo `GuiasBiblioteca` (416 líneas: partir antes de
     seguir metiendo código, fila 201). */

  return {
    panelTraerHTML: panelTraerHTML, engancharPanelTraer: engancharPanelTraer,
    botonHTML: botonHTML, engancharBoton: engancharBoton,
    revisarAlGuardar: revisarAlGuardar,
    pasosDesactualizados: pasosDesactualizados, abrirComparacion: abrirComparacion,
    comparacionHTML: comparacionHTML, resumenDeModelo: resumenDeModelo
  };
})();
window.GuiasBiblioteca = GuiasBiblioteca;
