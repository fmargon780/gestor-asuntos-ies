/* ============================================================
   tablas-datos-pantalla.js — lo que se ve de las tablas de datos
   (24-sep-2026, fila 110, docs/TABLAS-DE-DATOS.md):

   - Ajustes → Mantenimiento, bloque «Tablas de datos» (solo lectura):
     cada tabla, de qué ficheros sale, qué cursos cubre y cuántas filas;
     los ficheros que no se han podido leer, con el motivo; «Volver a leer».
   - Ficha del tercero, plegable «Datos de las tablas»: por cada tabla con
     filas de esa persona, una tablita compacta. Sin ninguna, no se pinta.

   El dato vive en js/tablas-datos.js.
   ============================================================ */
(function () {
  function $(id) { return document.getElementById(id); }

  function bloque() {
    var ya = $('bloque-tablas-datos');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-tablas-datos';
    d.innerHTML =
      '<summary><span class="bloque-titulo">Tablas de datos</span>' +
        '<span class="bloque-pie">Las tutorías de Séneca y lo que dejes en la subcarpeta Tablas de los datos</span></summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Los PDF «Función Tutorial» de Séneca (uno por curso) y cualquier CSV o Excel de ' +
        '<code>_GESTOR/datos/Tablas</code>. Se unen a cada persona por su DNI y sirven para los huecos ' +
        '<code>{{ESPECIALIDAD}}</code>, <code>{{TABLA TUTORIAS}}</code>, <code>{{DATO …}}</code> y <code>{{TABLA …}}</code>.</p>' +
        '<div id="tablas-datos-lista" class="lista"></div>' +
        '<button type="button" class="boton" id="tablas-datos-releer" style="margin-top:8px">Volver a leer</button>' +
      '</div>';
    pantalla.appendChild(d);
    $('tablas-datos-releer').onclick = async function () {
      TablasDatos.olvidar();
      await U.mientrasGuarda($('tablas-datos-releer'), function () { return pintar(); });
    };
    return d;
  }

  async function pintar() {
    if (!bloque() || !window.TablasDatos) return;
    var caja = $('tablas-datos-lista');
    var r;
    try { r = await TablasDatos.lista(); }
    catch (e) { caja.innerHTML = '<div class="vacio">No he podido leer las tablas: ' + U.escapar(U.mensajeDeError(e)) + '</div>'; return; }
    var filas = r.tablas.map(function (t) {
      return '<div class="fila-tipo"><span class="nombre-tipo">' + U.escapar(t.nombre === 'TUTORIAS' ? 'Tutorías' : t.nombre) + '</span>' +
        '<span class="suave" style="flex:1">' + U.escapar(t.filas + (t.filas === 1 ? ' fila' : ' filas') +
          (t.cursos.length ? ' · cursos ' + t.cursos.join(', ') : '') + ' · ' + t.ficheros.join(', ')) + '</span></div>';
    });
    /* El profesorado sale de los RelPerCen (no se lee otra vez). */
    try {
      var personal = await Datos.cargar(App.E.datos, 'PERSONAL');
      if (personal && personal.ficheros && personal.ficheros.length) {
        filas.push('<div class="fila-tipo"><span class="nombre-tipo">Profesorado</span><span class="suave" style="flex:1">' +
          U.escapar(personal.ficheros.map(function (f) { return f.fichero + ' (' + f.curso + ')'; }).join(', ')) + '</span></div>');
      }
    } catch (e) { /* sin RelPerCen */ }
    caja.innerHTML = (filas.length ? filas.join('') : '<div class="vacio">Todavía no hay ninguna tabla de datos.</div>') +
      r.errores.map(function (e) {
        return '<div class="aviso aviso-ambar" style="margin-top:6px"><strong>' + U.escapar(e.fichero) + ':</strong> ' + U.escapar(e.motivo) + '</div>';
      }).join('');
  }

  /* ---------- en la ficha del tercero ---------- */

  async function pintarEnFicha(caja, persona) {
    if (!caja || !persona || !window.TablasDatos) return;
    var d;
    try { d = await TablasDatos.cargar(); } catch (e) { return; }
    var html = '';
    for (var nombre in d.tablas) {
      var t = d.tablas[nombre];
      var filas = await TablasDatos.filasDe(nombre, persona);
      if (!filas.length) continue;
      var columnas = nombre === 'TUTORIAS' ? TablasDatos.COLUMNAS_TUTORIAS : t.cabecera;
      html += '<div class="tablas-ficha-tabla"><div class="suave">' + U.escapar(nombre === 'TUTORIAS' ? 'Tutorías' : nombre) + '</div>' +
        '<table class="tablas-ficha"><tr>' + columnas.map(function (c) { return '<th>' + U.escapar(c) + '</th>'; }).join('') + '</tr>' +
        filas.map(function (f) {
          return '<tr>' + TablasDatos.celdasDe(nombre, f, columnas).map(function (c) { return '<td>' + U.escapar(c) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</table></div>';
    }
    if (!html || !caja.isConnected) return;
    var seccion = caja.querySelector('.ficha-bloque') || caja;
    var det = document.createElement('details');
    det.className = 'tablas-en-ficha';
    det.innerHTML = '<summary>Datos de las tablas</summary>' + html;
    seccion.appendChild(det);
  }

  window.TablasDatosPantalla = { pintar: pintar, pintarEnFicha: pintarEnFicha };
})();
