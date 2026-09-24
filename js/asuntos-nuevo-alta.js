/* ============================================================
   asuntos-nuevo-alta.js — Nuevo asunto: el alta de un tercero que no está en la lista, y el buscador de terceros reutilizable.

   Sacado tal cual de js/asuntos-nuevo.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de él.
   ============================================================ */

/* ---------- alta de un tercero que no está en la lista ---------- */

/* La aclaración de cada categoría, encima de los campos. */
App.ACLARA_ALTA = {
  ALUMNADO: 'Para quien ha pedido plaza y todavía no está matriculado. Si ya ' +
            'tiene Nº de identificación escolar, ponlo: así su carpeta se ' +
            'llamará igual el día que se matricule.',
  EMPRESAS: 'La razón social es el nombre fiscal, el que viene en las facturas. ' +
            'El nombre comercial es el rótulo del negocio, cuando es distinto: ' +
            'la papelería de un autónomo, por ejemplo. Se podrá buscar por los ' +
            'dos, y en el nombre de la carpeta seguirá yendo la razón social.'
};

/* El cuadro de los datos de un tercero. Lo usan el alta y también el
   botón de cambiarlos de js/archivo-personas.js: los campos son los
   mismos, y así no hay dos cuadros que se puedan quedar distintos.

   `valores` trae lo que ya se sabe; con el cuadro vacío es un alta.
   Devuelve lo escrito, o null si se cancela. */
App.cuadroDeTercero = async function (categoria, valores, titulo, botonar) {
  var def = Datos.LISTAS[categoria];
  if (!def) return null;
  valores = valores || {};
  var campos = def.cabecera.map(function (c) {
    return '<label class="etiqueta">' + U.escapar(c) + '</label>' +
           '<input class="campo alta-campo" data-campo="' + U.escapar(c) + '" value="' +
           U.escapar(valores[c] || '') + '">';
  }).join('');
  var aclara = App.ACLARA_ALTA[categoria]
    ? '<p class="explica">' + U.escapar(App.ACLARA_ALTA[categoria]) + '</p>'
    : '';
  var ok = await U.preguntar(titulo, aclara + campos, botonar || 'Guardar');
  if (!ok) return null;
  var puestos = {};
  Array.prototype.forEach.call(document.querySelectorAll('.alta-campo'), function (i) {
    puestos[i.dataset.campo] = i.value.trim();
  });
  if (!puestos[def.cabecera[0]]) { U.aviso('Hace falta al menos el nombre.', 'malo'); return null; }
  return puestos;
};

App.altaTercero = async function (categoria, sugerencia) {
  var def = Datos.LISTAS[categoria];
  if (!def) return;
  var titulo = categoria === 'ALUMNADO'
    ? 'Dar de alta un solicitante'
    : 'Dar de alta en ' + categoria;
  var deEntrada = {};
  deEntrada[def.cabecera[0]] = sugerencia || '';
  var valores = await App.cuadroDeTercero(categoria, deEntrada, titulo);
  if (!valores) return;
  await Datos.anadirALista(App.E.datos, categoria, valores);
  U.aviso('Dado de alta.', 'bueno');
  $('buscar-tercero').value = valores[def.cabecera[0]];
  App.buscarTercero();
};

/* ---------- el buscador de terceros, reutilizable ----------

   Lo mismo que hay dentro de "Nuevo asunto" (categoría + buscador +
   resultados + alta), pero como una pieza que se puede montar en
   cualquier otra pantalla: js/relacionados.js lo usa para elegir un
   tercero relacionado, sin repetir la lógica de búsqueda.

   `contenedor` es un elemento vacío donde se pinta todo.
   `categoriaInicial` puede venir puesta, o null para empezar sin
   categoría elegida.
   `alElegir(categoria, persona, textoBuscado)` se llama cuando el
   usuario pulsa un resultado (persona no es null) o pide dar de alta
   uno nuevo (persona es null, y textoBuscado trae lo que había
   escrito). El alta de verdad la hace quien llama, con
   App.cuadroDeTercero: así aquí no se abren dos cuadros a la vez.

   `opciones.multiple` (17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md):
   cada resultado lleva una casilla en vez de pulsarse directamente, y
   abajo sale una barra fija con la cuenta y "Añadir los N señalados".
   Lo señalado no se pierde al cambiar de búsqueda ni de categoría (vive
   en `estado.marcados`, fuera de `buscar()`). En este modo `alElegir`
   se llama UNA VEZ, con la lista de señalados (`{categoria, nombre,
   persona}`), al pulsar ese botón; no hay "dar de alta" aquí, porque no
   tiene sentido en un alta en bloque. Devuelve `{ marcar(lista),
   marcados() }` para que quien llama pueda señalar desde fuera (los
   atajos de alumnado, "meter un grupo entero"): en el modo de siempre
   no devuelve nada, como hasta hoy. */
App.pintarBuscadorDeTercero = function (contenedor, categoriaInicial, alElegir, opciones) {
  var multiple = !!(opciones && opciones.multiple);
  var estado = { categoria: categoriaInicial || null, marcados: {} };
  if (multiple && opciones.marcadosIniciales) {
    opciones.marcadosIniciales.forEach(function (m) {
      estado.marcados[m.categoria + '|' + m.nombre] = m;
    });
    resolverPerdidos(opciones.marcadosIniciales);
  }

  /* Un marcado inicial (los miembros de un grupo al editarlo) puede ya
     no estar en las listas de hoy: alguien se ha ido, o se ha borrado
     a mano. Se marca como "perdido" para que la barra lo diga, sin
     quitarlo de nada (docs/GRUPOS-DE-PERSONAS.md, "Personas que ya no
     están"). Los que traigan `persona` (los atajos de alumnado, ya
     resueltos) no hace falta comprobarlos. */
  async function resolverPerdidos(iniciales) {
    var porCategoria = {};
    iniciales.forEach(function (m) {
      if (m.persona) return;
      if (!porCategoria[m.categoria]) porCategoria[m.categoria] = [];
      porCategoria[m.categoria].push(m);
    });
    for (var categoria in porCategoria) {
      var fuente = null;
      try { fuente = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null; }
      catch (e) { fuente = null; }
      porCategoria[categoria].forEach(function (m) {
        var clave = m.categoria + '|' + m.nombre;
        var entrada = estado.marcados[clave];
        if (!entrada) return;   /* se ha quitado con la × mientras se leía */
        var encontrado = !!(fuente && fuente.lista.some(function (p) { return App.textoTercero(p) === m.nombre; }));
        if (!encontrado) entrada.perdido = true;
      });
    }
    pintarBarra();
  }

  contenedor.innerHTML =
    '<div class="categorias-mini" id="rel-categorias"></div>' +
    '<div id="rel-buscador" class="oculto">' +
      '<input id="rel-buscar" class="campo" placeholder="Escribe tres letras del nombre">' +
      '<div id="rel-resultados" class="resultados"></div>' +
    '</div>' +
    (multiple ? '<div id="rel-marcados-barra" class="marcados-barra oculto"></div>' : '');

  var cajaCategorias = contenedor.querySelector('#rel-categorias');
  var cajaBuscador = contenedor.querySelector('#rel-buscador');
  var campoBuscar = contenedor.querySelector('#rel-buscar');
  var cajaResultados = contenedor.querySelector('#rel-resultados');
  var cajaBarra = multiple ? contenedor.querySelector('#rel-marcados-barra') : null;

  function listaDeMarcados() {
    return Object.keys(estado.marcados).map(function (k) { return estado.marcados[k]; });
  }

  /* La cuenta, la lista de nombres (cada uno con su × para quitarlo
     sin tener que volver a buscarlo) y el botón de añadir. Un
     marcado puede no salir nunca en ningún resultado de búsqueda —por
     ejemplo, un miembro de un grupo que ya no está en las listas—, así
     que quitarlo desde aquí es la única manera: nunca se pierde ni se
     borra solo. */
  function pintarBarra() {
    if (!multiple) return;
    var lista = listaDeMarcados();
    if (!lista.length) { cajaBarra.className = 'marcados-barra oculto'; cajaBarra.innerHTML = ''; return; }
    cajaBarra.className = 'marcados-barra';
    cajaBarra.innerHTML =
      '<div class="marcados-cabecera">' +
        '<span class="marcados-cuenta">' + lista.length +
          (lista.length === 1 ? ' señalado' : ' señalados') + '</span>' +
        '<button type="button" class="boton boton-principal" id="rel-marcados-anadir">' +
          'Añadir los ' + lista.length + ' señalados</button>' +
      '</div>' +
      '<div class="marcados-lista">' + lista.map(function (m) {
        var clave = m.categoria + '|' + m.nombre;
        return '<span class="marcado-chip' + (m.perdido ? ' marcado-chip-perdido' : '') + '"' +
          (m.perdido ? ' title="Ya no está en las listas: se conserva igual, hasta que lo quites tú"' : '') + '>' +
          U.escapar(m.nombre) +
          '<button type="button" class="marcado-quitar" data-clave="' + U.escapar(clave) + '" ' +
          'title="Quitarlo de lo señalado">×</button></span>';
      }).join('') + '</div>';

    contenedor.querySelector('#rel-marcados-anadir').onclick = function () { alElegir(listaDeMarcados()); };
    Array.prototype.forEach.call(cajaBarra.querySelectorAll('.marcado-quitar'), function (b) {
      var clave = b.dataset.clave;
      b.onclick = function () {
        delete estado.marcados[clave];
        pintarBarra();
        Array.prototype.forEach.call(cajaResultados.querySelectorAll('.resultado-casilla'), function (c) {
          if (c.dataset.clave === clave) c.checked = false;
        });
      };
    });
  }

  function marcar(lista) {
    lista.forEach(function (m) { estado.marcados[m.categoria + '|' + m.nombre] = m; });
    pintarBarra();
    Array.prototype.forEach.call(cajaResultados.querySelectorAll('.resultado-casilla'), function (c) {
      if (estado.marcados[c.dataset.clave] !== undefined) c.checked = true;
    });
  }

  function pintarCategorias() {
    cajaCategorias.innerHTML = '';
    Nombres.CATEGORIAS.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'categoria-mini-boton' + (estado.categoria === cat ? ' elegido' : '');
      b.textContent = cat;
      b.onclick = function () {
        estado.categoria = cat;
        pintarCategorias();
        cajaBuscador.classList.remove('oculto');
        campoBuscar.value = '';
        cajaResultados.innerHTML = '';
        campoBuscar.focus();
        if (opciones && opciones.alCambiarCategoria) opciones.alCambiarCategoria(cat);
      };
      cajaCategorias.appendChild(b);
    });
  }

  var temporizador = null;
  async function buscar() {
    var texto = campoBuscar.value;
    if (U.normalizar(texto).length < 2) { cajaResultados.innerHTML = ''; return; }
    cajaResultados.innerHTML = '<div class="explica">Buscando…</div>';
    var fuente = await Datos.cargar(App.E.datos, estado.categoria);
    var encontrados = Datos.buscar(fuente.lista, texto, 30);
    cajaResultados.innerHTML = '';

    encontrados.forEach(function (p) {
      var d = document.createElement('div');
      var nombre = App.textoTercero(p);

      if (multiple) {
        var clave = estado.categoria + '|' + nombre;
        d.className = App.claseDeResultado(p) + ' resultado-marcable';
        d.innerHTML =
          '<label>' +
            '<input type="checkbox" class="resultado-casilla" data-clave="' + U.escapar(clave) + '"' +
              (estado.marcados[clave] !== undefined ? ' checked' : '') + '>' +
            '<span><div>' + U.escapar(p.nombre) + '</div>' +
            '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div></span>' +
          '</label>';
        d.querySelector('.resultado-casilla').onchange = function (ev) {
          if (ev.target.checked) estado.marcados[clave] = { categoria: estado.categoria, nombre: nombre, persona: p };
          else delete estado.marcados[clave];
          pintarBarra();
        };
      } else {
        d.className = App.claseDeResultado(p);
        d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                      '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
        d.onclick = function () { alElegir(estado.categoria, p, texto); };
      }
      cajaResultados.appendChild(d);
    });

    if (!multiple) {
      var alta = document.createElement('button');
      alta.type = 'button';
      alta.className = 'boton';
      alta.style.marginTop = '6px';
      alta.textContent = estado.categoria === 'ALUMNADO'
        ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
      alta.onclick = function () { alElegir(estado.categoria, null, texto); };
      cajaResultados.appendChild(alta);
    }
  }

  campoBuscar.oninput = function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscar, 180);
  };

  pintarCategorias();
  if (estado.categoria) cajaBuscador.classList.remove('oculto');
  pintarBarra();

  if (multiple) return { marcar: marcar, marcados: listaDeMarcados };
};
