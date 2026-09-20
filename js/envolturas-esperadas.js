/* ============================================================
   envolturas-esperadas.js — la lista de las envolturas que debe
   haber, y el aviso si falta alguna (19-sep-2026, fila 70,
   docs/ENVOLTURAS-COMPROBADAS.md).

   Se carga EL ÚLTIMO de todos los <script> de index.html, después
   incluso de js/inicio.js: cuando este fichero se ejecuta, todos los
   demás ya han corrido de arriba abajo (`U.envolver` se llama al
   cargar cada fichero, no al usarlo), así que U.envolturasAplicadas()
   y U.envolturasFallidas() ya tienen la foto completa y no hace falta
   esperar a nada más.

   No impide entrar: una envoltura de menos casi nunca es motivo para
   no poder trabajar (sección 3.2 del encargo). Solo avisa, en rojo,
   en la propia pantalla de entrada, y dentro de Ajustes →
   Mantenimiento con la lista completa.

   Regla nueva para no crecer más sin apuntarlo aquí (sección 3.3):
   un módulo nuevo NO envuelve. Se engancha por un punto previsto
   (`window.Gestor.alRefrescar` y los que haya) o se le añade uno.
   Envolver solo si no hay más remedio, y entonces con `U.envolver` y
   apuntándolo AQUÍ, en esta misma lista. */
(function () {

  /* Las envolturas de hoy. `fichero` es el nombre del propio
     fichero que envuelve (sin "js/" delante, como lo pasa cada
     llamada a U.envolver); `nombre`, el mismo texto que se lee en
     Ajustes → Mantenimiento. */
  var ESPERADAS = [
    { fichero: 'archivo-personas.js', nombre: 'App.verDocumentos' },
    { fichero: 'avisos-que-faltan.js', nombre: 'App.verAbiertos' },
    { fichero: 'bandeja-adjuntos-lector.js', nombre: 'window.Bandeja.llevarANuevo' },
    { fichero: 'copiar.js', nombre: 'App.tarjetaAsunto' },
    { fichero: 'copiar.js', nombre: 'App.abrirFicha' },
    { fichero: 'copiar.js', nombre: 'App.buscarPersonas' },
    { fichero: 'copiar.js', nombre: 'App.buscarTercero' },
    { fichero: 'copiar.js', nombre: 'App.verFicha' },
    { fichero: 'correo.js', nombre: 'App.abrirFicha' },
    { fichero: 'dni.js', nombre: 'Datos.cargar' },
    { fichero: 'dni.js', nombre: 'App.pieAlumno' },
    { fichero: 'dni.js', nombre: 'Datos.destacadosAlumno' },
    { fichero: 'documentos-sueltos-lector.js', nombre: 'App.tarjetaSuelto' },
    { fichero: 'duplicados.js', nombre: 'App.refrescarVista' },
    { fichero: 'duplicados.js', nombre: 'boton(#btn-crear).onclick' },
    { fichero: 'ficha-archivo.js', nombre: 'App.cerrarAsunto' },
    { fichero: 'ficha-archivo.js', nombre: 'App.reabrirAsunto' },
    { fichero: 'ficha-asunto.js', nombre: 'App.verAbiertos' },
    { fichero: 'ficha-asunto.js', nombre: 'App.tarjetaAsunto' },
    { fichero: 'ficha-nombre-acciones.js', nombre: 'App.abrirFicha' },
    { fichero: 'formularios.js', nombre: 'App.abrirFicha' },
    { fichero: 'hitos-archivo.js', nombre: 'App.cerrarAsunto' },
    { fichero: 'hitos-archivo.js', nombre: 'App.reabrirAsunto' },
    { fichero: 'hitos-panel.js', nombre: 'App.abrirFicha' },
    { fichero: 'hitos.js', nombre: 'App.anotar' },
    { fichero: 'otros-del-tercero.js', nombre: 'App.abrirFicha' },
    { fichero: 'papelera.js', nombre: 'App.tarjetaSuelto' },
    { fichero: 'papelera.js', nombre: 'App.verFicha' },
    { fichero: 'plantillas-documento.js', nombre: 'App.abrirFicha' },
    { fichero: 'presencia.js', nombre: 'App.vigilarLaCarpeta' },
    { fichero: 'presencia.js', nombre: 'App.tarjetaAsunto' },
    { fichero: 'puente.js', nombre: 'App.tarjetaAsunto' },
    { fichero: 'relacionados.js', nombre: 'App.cerrarAsunto' },
    { fichero: 'relacionados.js', nombre: 'App.reabrirAsunto' },
    { fichero: 'relacionados.js', nombre: 'App.verArchivo' },
    { fichero: 'relacionados.js', nombre: 'window.Duplicados.delTercero' },
    { fichero: 'relacionados.js', nombre: 'App.verFicha' },
    { fichero: 'rescate-datos.js', nombre: 'App.cargarTipos' },
    { fichero: 'tipos-buscador.js', nombre: 'App.pintarTipos' },
    { fichero: 'unir-asuntos.js', nombre: 'App.pintarAbiertos' },
    { fichero: 'via-contacto.js', nombre: 'App.refrescarVista' },
    { fichero: 'via-contacto.js', nombre: 'App.editarVia' },
    { fichero: 'via-contacto.js', nombre: 'LoPide.controles' }
  ];

  function clave(e) { return e.fichero + ' :: ' + e.nombre; }

  /* Compara la lista de arriba con lo que U.envolver ha apuntado de
     verdad. Devuelve las que faltan (con el motivo, si se sabe), las
     que sobran (aplicadas pero no apuntadas aquí: alguien se ha
     olvidado de añadirlas a esta lista) y las dos listas de U tal
     cual, por si hace falta el detalle completo. */
  function comprobar() {
    var aplicadas = (window.U && U.envolturasAplicadas) ? U.envolturasAplicadas() : [];
    var fallidas = (window.U && U.envolturasFallidas) ? U.envolturasFallidas() : [];

    var aplicadasPorClave = {};
    aplicadas.forEach(function (a) { aplicadasPorClave[clave(a)] = true; });
    var fallidasPorClave = {};
    fallidas.forEach(function (f) { fallidasPorClave[clave(f)] = f.motivo; });

    var faltan = [];
    ESPERADAS.forEach(function (e) {
      if (aplicadasPorClave[clave(e)]) return;
      faltan.push({
        fichero: e.fichero,
        nombre: e.nombre,
        motivo: fallidasPorClave[clave(e)] || 'no se ha llegado a aplicar (puede que el fichero ni se haya cargado)'
      });
    });

    var esperadasPorClave = {};
    ESPERADAS.forEach(function (e) { esperadasPorClave[clave(e)] = true; });
    var sobran = aplicadas.filter(function (a) { return !esperadasPorClave[clave(a)]; });

    return { esperadas: ESPERADAS, aplicadas: aplicadas, fallidas: fallidas, faltan: faltan, sobran: sobran };
  }

  /* ---------- el aviso rojo de la pantalla de entrada ---------- */

  function avisar() {
    var r = comprobar();
    var caja = document.getElementById('aviso-envolturas');
    if (!caja) return;
    if (!r.faltan.length) { caja.classList.add('oculto'); caja.innerHTML = ''; return; }

    caja.classList.remove('oculto');
    var U2 = window.U;
    var escapar = (U2 && U2.escapar) ? U2.escapar : function (v) { return String(v); };
    caja.innerHTML = '<strong>' +
      (r.faltan.length === 1 ? 'Una envoltura no se ha aplicado.' : r.faltan.length + ' envolturas no se han aplicado.') +
      '</strong>' +
      '<p>Puede que algún botón o algún aviso haga menos de lo que debería. Se puede entrar y ' +
      'seguir trabajando igual: avisa a quien lleve el código antes de que se olvide.</p>' +
      '<ul class="lista-repetidos">' +
      r.faltan.map(function (f) {
        return '<li>' + escapar(f.fichero) + ' → ' + escapar(f.nombre) +
               '<div class="suave">' + escapar(f.motivo) + '</div></li>';
      }).join('') +
      '</ul>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avisar);
  } else {
    avisar();
  }

  /* ---------- Ajustes → Mantenimiento: la lista completa ---------- */

  function $(id) { return document.getElementById(id); }

  function bloqueDeAjustes() {
    var ya = $('bloque-envolturas');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-envolturas';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Envolturas de la aplicación</span>' +
        '<span class="bloque-pie" id="envolturas-pie"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">La aplicación se construye "envolviendo" funciones de unos ficheros ' +
        'con otros, y eso depende del orden en que se cargan (docs/ENVOLTURAS-COMPROBADAS.md). ' +
        'Esta lista es la comprobación de que todas las envolturas que debe haber se han ' +
        'aplicado de verdad.</p>' +
        '<div id="envolturas-cuerpo"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  App.pintarEnvolturas = function () {
    var d = bloqueDeAjustes();
    if (!d) return;
    var r = comprobar();
    var U2 = window.U;
    var escapar = (U2 && U2.escapar) ? U2.escapar : function (v) { return String(v); };

    $('envolturas-pie').textContent = r.faltan.length
      ? r.faltan.length + ' de ' + r.esperadas.length + ' sin aplicar'
      : 'las ' + r.esperadas.length + ' aplicadas';

    var cuerpo = $('envolturas-cuerpo');
    cuerpo.innerHTML = '';
    r.esperadas.forEach(function (e) {
      var falta = r.faltan.filter(function (f) { return f.fichero === e.fichero && f.nombre === e.nombre; })[0];
      var fila = document.createElement('div');
      fila.className = 'fila-tipo';
      fila.innerHTML =
        '<span class="nombre-tipo">' + (falta ? '✗' : '✓') + '</span>' +
        '<span class="suave" style="flex:1">' + escapar(e.fichero) + ' → ' + escapar(e.nombre) +
        (falta ? '  —  ' + escapar(falta.motivo) : '') + '</span>';
      cuerpo.appendChild(fila);
    });
    if (r.sobran.length) {
      var aviso = document.createElement('p');
      aviso.className = 'aviso aviso-ambar';
      aviso.textContent = r.sobran.length + ' envoltura' + (r.sobran.length === 1 ? '' : 's') +
        ' aplicada' + (r.sobran.length === 1 ? '' : 's') + ' que no está' +
        (r.sobran.length === 1 ? '' : 'n') + ' en esta lista: falta apuntarla' +
        (r.sobran.length === 1 ? '' : 's') + ' en js/envolturas-esperadas.js.';
      cuerpo.appendChild(aviso);
    }
  };

  /* Para las pruebas y para Ajustes → Mantenimiento. */
  window.EnvolturasEsperadas = { LISTA: ESPERADAS, comprobar: comprobar, avisar: avisar };
})();
