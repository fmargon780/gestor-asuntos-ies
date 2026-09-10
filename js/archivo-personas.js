/* ============================================================
   archivo-personas.js — las dos pantallas de consulta.

   El ARCHIVO de asuntos cerrados y la ficha de personas y empresas,
   con todos los asuntos de cada una.
   ============================================================ */

/* ==========================================================
   PANTALLA: ARCHIVO
   ========================================================== */

App.verArchivo = async function () {
  $('explica-archivo').textContent = 'Leyendo el archivo…';
  var salida = [];
  var categorias = await Carpetas.subcarpetas(App.E.archivo);
  for (var i = 0; i < categorias.length; i++) {
    var terceros = await Carpetas.subcarpetas(categorias[i].handle);
    for (var j = 0; j < terceros.length; j++) {
      var asuntos = await Carpetas.subcarpetas(terceros[j].handle);
      for (var k = 0; k < asuntos.length; k++) {
        salida.push({
          nombre: asuntos[k].nombre, handle: asuntos[k].handle, padre: terceros[j].handle,
          ruta: categorias[i].nombre + ' / ' + terceros[j].nombre,
          leido: Nombres.leer(asuntos[k].nombre, App.E.tipos),
          ficha: App.E.registro.asuntos[asuntos[k].nombre] || {},
          busca: U.normalizar(asuntos[k].nombre + ' ' + categorias[i].nombre + ' ' + terceros[j].nombre)
        });
      }
    }
  }
  salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
  App.E.listaArchivo = salida;
  $('explica-archivo').textContent = salida.length + ' asuntos archivados.';
  App.pintarArchivo();
};

App.pintarArchivo = function () {
  var q = U.normalizar($('buscar-archivo').value);
  var lista = App.E.listaArchivo.filter(function (a) { return !q || a.busca.indexOf(q) !== -1; });
  var caja = $('lista-archivo');
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
    return;
  }
  lista.slice(0, 300).forEach(function (a) { caja.appendChild(App.tarjetaAsunto(a, 'archivado')); });
  if (lista.length > 300) {
    var mas = document.createElement('div');
    mas.className = 'explica';
    mas.textContent = 'Se muestran los 300 primeros de ' + lista.length + '. Afina la búsqueda.';
    caja.appendChild(mas);
  }
};

$('buscar-archivo').oninput = function () { App.pintarArchivo(); };
$('btn-recargar-archivo').onclick = function () { App.verArchivo(); };

/* ==========================================================
   PANTALLA: PERSONAS
   ========================================================== */

App.personasCargadas = null;

App.pintarPersonas = async function () {
  var categoria = $('filtro-personas').value;
  var fuente = await Datos.cargar(App.E.datos, categoria);
  App.personasCargadas = fuente;
  App.buscarPersonas();
};

App.buscarPersonas = function () {
  if (!App.personasCargadas) return;
  var texto = $('buscar-personas').value;
  var caja = $('lista-personas');
  var lista = U.normalizar(texto).length >= 2
    ? Datos.buscar(App.personasCargadas.lista, texto, 60)
    : App.personasCargadas.lista.slice(0, 60);
  caja.innerHTML = '';
  if (!lista.length) {
    caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
  }
  lista.forEach(function (p) {
    var d = document.createElement('div');
    d.className = App.claseDeResultado(p);
    if (p.id) d.dataset.nie = p.id;
    d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.verFicha(p); };
    caja.appendChild(d);
  });
  var b = document.createElement('button');
  b.className = 'boton';
  b.textContent = $('filtro-personas').value === 'ALUMNADO'
    ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
  b.onclick = function () { App.altaDesdePersonas(); };
  caja.appendChild(b);
};

App.altaDesdePersonas = async function () {
  await App.altaTercero($('filtro-personas').value, $('buscar-personas').value.trim());
  Datos.olvidar($('filtro-personas').value);
  App.pintarPersonas();
};

App.verFicha = function (p) {
  var caja = $('ficha-persona');

  function pintarFilas(filas) {
    return filas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' +
             U.escapar(f.valor) + '</span></div>';
    }).join('');
  }

  var html = '<h4>' + U.escapar(p.nombre) + '</h4>';

  if (p.categoria === 'ALUMNADO') {
    /* Lo que se consulta a diario va arriba: la edad de hoy, si sigue
       matriculado, el grupo y los datos de contacto de los tutores
       legales. El resto del fichero de Séneca sigue estando, más abajo. */
    var d = Datos.destacadosAlumno(p);
    html += pintarFilas(d.destacados);
    if (d.resto.length) {
      html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
              'Ver los demás datos del fichero (' + d.resto.length + ')</button></p>' +
              '<div id="resto-ficha" class="oculto">' + pintarFilas(d.resto) + '</div>';
    }
  } else if (p.categoria === 'PERSONAL') {
    /* Igual que en el alumnado: arriba el puesto, si sigue en el centro
       y por dónde se le localiza; el resto del fichero, debajo. */
    var dp = Datos.destacadosPersona(p);
    html += pintarFilas(dp.destacados);
    if (dp.resto.length) {
      html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
              'Ver los demás datos del fichero (' + dp.resto.length + ')</button></p>' +
              '<div id="resto-ficha" class="oculto">' + pintarFilas(dp.resto) + '</div>';
    }
  } else {
    html += pintarFilas(Object.keys(p.campos).map(function (c) {
      return { titulo: c, valor: p.campos[c] };
    }));
  }

  html += '<p class="nota"><button type="button" class="boton" id="ver-sus-asuntos">' +
          'Ver sus asuntos</button></p><div id="asuntos-del-tercero"></div>';

  caja.innerHTML = html;

  if ($('ver-resto')) {
    $('ver-resto').onclick = function () {
      $('resto-ficha').classList.toggle('oculto');
    };
  }
  $('ver-sus-asuntos').onclick = function () { App.verAsuntosDeTercero(p); };
};

/* Todos los asuntos de una persona o empresa, los abiertos y los
   archivados, en una sola lista. */
App.verAsuntosDeTercero = async function (p) {
  var caja = $('asuntos-del-tercero');
  caja.innerHTML = '<p class="explica">Buscando…</p>';
  var texto = App.textoTercero(p);
  var clave = U.normalizar(texto);
  var salida = [];

  var abiertas = await Carpetas.subcarpetas(App.E.abiertos);
  abiertas.forEach(function (c) {
    if (c.nombre.charAt(0) === '_') return;
    if (U.normalizar(c.nombre).indexOf(clave) === -1) return;
    salida.push({ nombre: c.nombre, donde: 'Abierto' });
  });

  try {
    var cat = await App.E.archivo.getDirectoryHandle(p.categoria);
    var ter = await cat.getDirectoryHandle(texto);
    var cerradas = await Carpetas.subcarpetas(ter);
    cerradas.forEach(function (c) {
      salida.push({ nombre: c.nombre, donde: 'Archivado' });
    });
  } catch (e) { /* todavía no tiene carpeta en el archivo */ }

  salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });

  if (!salida.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay ningún asunto suyo.</div>';
    return;
  }
  caja.innerHTML = salida.map(function (a) {
    var leido = Nombres.leer(a.nombre, App.E.tipos);
    var ficha = App.E.registro.asuntos[a.nombre] || {};
    var situacion = ficha.situacion || '';
    return '<div class="resultado"><div>' +
           (leido.tipo ? '<span class="marca-tipo">' + U.escapar(leido.tipo) + '</span>' : '') +
           (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                        U.escapar(situacion) + '</span>' : '') +
           U.escapar(a.nombre) + '</div>' +
           '<div class="resultado-pie">' + a.donde +
           (leido.fecha ? '  ·  ' + U.fechaLegible(leido.fecha) : '') + '</div></div>';
  }).join('');
};

$('filtro-personas').onchange = function () { App.pintarPersonas(); };
$('buscar-personas').oninput = function () { App.buscarPersonas(); };
