/* ============================================================
   unir-asuntos-pantalla.js — la pantalla de Duplicados: una columna por asunto y un bloque por grupo, con sus botones. Salió de js/unir-asuntos.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada: comparte lo
   necesario por `UnirAsuntos._interno`. Se carga justo después de
   js/unir-asuntos.js.
   ============================================================ */
(function () {
  var I = window.UnirAsuntos._interno;
  function $(id) { return document.getElementById(id); }

  /* ---------- la pantalla de Duplicados ----------

     La crea este fichero, dinámicamente: no está en index.html ni en
     el menú de la izquierda. Solo se llega a ella desde el aviso. */

  App.PANTALLAS.push('duplicados');

  I.pantallaConstruida = false;

  function construirPantalla() {
    if (I.pantallaConstruida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-duplicados';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera">' +
        '<h2>Posibles duplicados</h2>' +
        '<div class="acciones">' +
          '<button type="button" id="dup-pantalla-volver" class="boton">← Volver a asuntos abiertos</button>' +
        '</div>' +
      '</header>' +
      '<p class="explica">Asuntos que coinciden en tercero, tipo y año académico, y que parece que ' +
      'son la misma gestión repetida por error. El grupo y el texto libre del nombre no cuentan ' +
      'para esta comparación.</p>' +
      '<div id="duplicados-lista"></div>';
    contenido.appendChild(seccion);
    $('dup-pantalla-volver').onclick = function () { App.ir('abiertos'); };
    I.pantallaConstruida = true;
  }

  /* Se construye ya, al cargar el script: App.ir espera que exista
     #pantalla-<cada nombre de App.PANTALLAS>, así que la sección tiene
     que estar en el DOM desde el principio (oculta), no solo la
     primera vez que se visita. El script se carga con el body ya
     parseado, así que main.contenido ya existe en este punto. */
  construirPantalla();

  function irADuplicados() {
    construirPantalla();
    App.ir('duplicados');
    pintarPantallaDuplicados();
  }

  /* ---------- una columna por asunto, dentro de un grupo ---------- */

  function lineaDatos(a) {
    var f = a.ficha || {};
    var trozos = [];
    if (a.leido && a.leido.fecha) trozos.push('Abierto el ' + U.fechaLegible(a.leido.fecha));
    trozos.push(window.EstadoHito ? EstadoHito.textoDeNombre(a.nombre) : 'Sin hitos');   /* fila 129 */
    var via = App.textoVia ? App.textoVia(f) : '';
    if (via) trozos.push(via);
    var p = App.plazoDe ? App.plazoDe(a) : null;
    if (p) trozos.push(p.texto);
    return trozos.join('  ·  ');
  }

  function columnaDeAsunto(a) {
    var col = document.createElement('div');
    col.className = 'columna-duplicado';

    var nombre = document.createElement('button');
    nombre.type = 'button';
    nombre.className = 'columna-nombre';
    nombre.textContent = a.nombre;
    nombre.title = 'Abrir la ficha de este asunto';
    nombre.onclick = function () { App.abrirFicha(a, 'abierto'); };
    col.appendChild(nombre);

    var datos = document.createElement('div');
    datos.className = 'columna-datos';
    datos.textContent = lineaDatos(a);
    col.appendChild(datos);

    var rotuloDocs = document.createElement('div');
    rotuloDocs.className = 'columna-rotulo';
    rotuloDocs.textContent = 'Documentos';
    col.appendChild(rotuloDocs);

    var docs = document.createElement('div');
    docs.className = 'columna-documentos';
    docs.textContent = 'Leyendo…';
    col.appendChild(docs);

    Carpetas.ficheros(a.handle).then(function (lista) {
      docs.innerHTML = '';
      if (!lista.length) {
        docs.innerHTML = '<p class="nota">Sin documentos.</p>';
        return;
      }
      lista.forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'columna-documento';
        b.textContent = f.nombre;
        b.onclick = function () { Visor.abrir(f.handle, f.nombre); };
        docs.appendChild(b);
      });
    }).catch(function () { docs.innerHTML = '<p class="nota">No he podido leer la carpeta.</p>'; });

    var rotuloNotas = document.createElement('div');
    rotuloNotas.className = 'columna-rotulo';
    rotuloNotas.textContent = 'Notas';
    col.appendChild(rotuloNotas);

    var notas = document.createElement('div');
    notas.className = 'columna-notas';
    var todas = (window.Notas ? window.Notas.de(a) : []).slice();
    if (!todas.length) {
      notas.innerHTML = '<p class="nota">Sin notas.</p>';
    } else {
      var ultimas = todas.slice(-3).reverse();
      notas.innerHTML = ultimas.map(function (n) {
        return '<div class="columna-nota">' +
          '<div class="columna-nota-cabeza">' +
            (n.quien ? '<span class="nota-quien">' + U.escapar(n.quien) + '</span>' : '') +
            '<span class="nota-cuando">' + U.escapar(window.Notas.cuando(n.cuando)) + '</span>' +
          '</div>' +
          '<div class="columna-nota-texto">' + U.escapar(n.texto) + '</div>' +
        '</div>';
      }).join('');
      if (todas.length > 3) {
        var mas = document.createElement('p');
        mas.className = 'nota';
        mas.textContent = 'y ' + (todas.length - 3) + ' más.';
        notas.appendChild(mas);
      }
    }
    col.appendChild(notas);

    return col;
  }

  /* ---------- un grupo entero, con sus botones ---------- */

  function bloqueDeGrupo(grupo) {
    var d = document.createElement('div');
    d.className = 'grupo-duplicado';

    var cab = document.createElement('div');
    cab.className = 'grupo-duplicado-cabecera';
    cab.innerHTML = '<strong>Parecen el mismo asunto.</strong>';

    var unir = document.createElement('button');
    unir.type = 'button';
    unir.className = 'boton boton-principal';
    unir.textContent = 'Unir';
    unir.onclick = function () { I.unirAsuntos(grupo); };
    cab.appendChild(unir);

    var noSon = document.createElement('button');
    noSon.type = 'button';
    noSon.className = 'boton';
    noSon.textContent = 'No son el mismo';
    noSon.title = 'No volver a avisar de este grupo';
    noSon.onclick = async function () {
      noSon.disabled = true;
      try {
        await I.descartarGrupo(grupo);
        U.aviso('No se volverá a avisar de este grupo. Puedes deshacerlo en Ajustes, ' +
          '"Duplicados descartados".', 'bueno');
        pintarPantallaDuplicados();
        I.pintarAviso();
      } catch (e) {
        noSon.disabled = false;
        U.aviso('No he podido descartarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
    cab.appendChild(noSon);

    d.appendChild(cab);

    var columnas = document.createElement('div');
    columnas.className = 'grupo-columnas';
    grupo.forEach(function (a) { columnas.appendChild(columnaDeAsunto(a)); });
    d.appendChild(columnas);

    return d;
  }

  function pintarPantallaDuplicados() {
    var caja = $('duplicados-lista');
    if (!caja) return;
    var grupos = I.gruposActivos();
    caja.innerHTML = '';
    if (!grupos.length) {
      caja.innerHTML = '<div class="vacio">No hay ningún posible duplicado ahora mismo.</div>';
      return;
    }
    grupos.forEach(function (g) { caja.appendChild(bloqueDeGrupo(g)); });
  }

  I.irADuplicados = irADuplicados;
  I.pintarPantallaDuplicados = pintarPantallaDuplicados;
})();
