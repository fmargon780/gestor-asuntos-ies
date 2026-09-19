/* ============================================================
   envolturas-esperadas.js — la lista de las envolturas que tienen
   que existir (19-sep-2026, fila 70, docs/ENVOLTURAS-COMPROBADAS.md).

   La aplicación está construida "envolviendo" funciones (`U.envolver`,
   en js/util.js): un fichero se guarda la que había y la sustituye por
   una suya que llama a la vieja por dentro. Eso descansa en que
   index.html cargue cada fichero en el orden justo: uno que envuelve
   tiene que ir después del que define la función, y si se cuela en el
   sitio equivocado, la envoltura no se aplica **sin que salte ningún
   error**.

   Este fichero va **el último de todos** en index.html: para cuando se
   ejecuta, ya han corrido todos los `U.envolver` que hay. Aquí se
   compara la lista de abajo (lo que tiene que estar) con
   `U.envolturasAplicadas()` (lo que se ha apuntado de verdad). Si
   falta alguna, sale un aviso rojo en la pantalla de entrada, diciendo
   cuáles: no impide entrar (una envoltura de menos casi nunca es
   motivo para no poder trabajar), pero avisa el mismo día en vez de
   dos semanas después.

   REGLA (docs/CONTEXTO-CORTO.md, sección 6): un módulo nuevo no
   envuelve. Se engancha por un punto previsto (`window.Gestor.
   alRefrescar` y los que haya) o se le añade uno. Envolver solo si no
   hay más remedio, y entonces con `U.envolver`, apuntándolo aquí. */
var EnvolturasEsperadas = (function () {

  var LISTA = [
    { etiqueta: 'App.cerrarAsunto', fichero: 'js/hitos-archivo.js' },
    { etiqueta: 'App.reabrirAsunto', fichero: 'js/hitos-archivo.js' },
    { etiqueta: 'App.cerrarAsunto', fichero: 'js/relacionados.js' },
    { etiqueta: 'App.reabrirAsunto', fichero: 'js/relacionados.js' },
    { etiqueta: 'App.verArchivo', fichero: 'js/relacionados.js' },
    { etiqueta: 'window.Duplicados.delTercero', fichero: 'js/relacionados.js' },
    { etiqueta: 'App.verFicha', fichero: 'js/relacionados.js' },
    { etiqueta: 'App.cerrarAsunto', fichero: 'js/ficha-archivo.js' },
    { etiqueta: 'App.reabrirAsunto', fichero: 'js/ficha-archivo.js' },
    { etiqueta: 'window.Bandeja.llevarANuevo', fichero: 'js/bandeja-adjuntos-lector.js' },
    { etiqueta: 'App.verAbiertos', fichero: 'js/avisos-que-faltan.js' },
    { etiqueta: 'App.tarjetaSuelto', fichero: 'js/documentos-sueltos-lector.js' },
    { etiqueta: 'App.cargarTipos', fichero: 'js/rescate-datos.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/ficha-nombre-acciones.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/hitos-panel.js' },
    { etiqueta: 'App.pintarTipos', fichero: 'js/tipos-buscador.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/correo.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/otros-del-tercero.js' },
    { etiqueta: 'App.refrescarVista', fichero: 'js/via-contacto.js' },
    { etiqueta: 'App.editarVia', fichero: 'js/via-contacto.js' },
    { etiqueta: 'LoPide.controles', fichero: 'js/via-contacto.js' },
    { etiqueta: 'Datos.cargar', fichero: 'js/dni.js' },
    { etiqueta: 'App.pieAlumno', fichero: 'js/dni.js' },
    { etiqueta: 'Datos.destacadosAlumno', fichero: 'js/dni.js' },
    { etiqueta: 'App.verAbiertos', fichero: 'js/ficha-asunto.js' },
    { etiqueta: 'App.tarjetaAsunto', fichero: 'js/ficha-asunto.js' },
    { etiqueta: 'App.anotar', fichero: 'js/hitos.js' },
    { etiqueta: 'App.pintarAbiertos', fichero: 'js/unir-asuntos.js' },
    { etiqueta: 'App.vigilarLaCarpeta', fichero: 'js/presencia.js' },
    { etiqueta: 'App.tarjetaAsunto', fichero: 'js/presencia.js' },
    { etiqueta: 'btn-crear.onclick', fichero: 'js/bandeja-correos.js' },
    { etiqueta: 'App.tarjetaAsunto', fichero: 'js/puente.js' },
    { etiqueta: 'App.tarjetaSuelto', fichero: 'js/papelera.js' },
    { etiqueta: 'App.verFicha', fichero: 'js/papelera.js' },
    { etiqueta: 'App.refrescarVista', fichero: 'js/duplicados.js' },
    { etiqueta: 'App.tarjetaAsunto', fichero: 'js/copiar.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/copiar.js' },
    { etiqueta: 'App.buscarPersonas', fichero: 'js/copiar.js' },
    { etiqueta: 'App.buscarTercero', fichero: 'js/copiar.js' },
    { etiqueta: 'App.verFicha', fichero: 'js/copiar.js' },
    { etiqueta: 'App.verDocumentos', fichero: 'js/archivo-personas.js' },
    { etiqueta: 'App.abrirFicha', fichero: 'js/plantillas-documento.js' }
  ];

  function clave(e) { return e.etiqueta + ' (' + e.fichero + ')'; }

  /* Las que tenían que aplicarse y no se han apuntado: el fallo que
     este fichero existe para no dejar pasar en silencio. */
  function faltantes() {
    var vistas = {};
    U.envolturasAplicadas().forEach(function (e) { vistas[clave(e)] = true; });
    return LISTA.filter(function (e) { return !vistas[clave(e)]; });
  }

  /* Las que se han apuntado de verdad pero no están en esta lista:
     alguien ha añadido una envoltura y se ha olvidado de apuntarla
     aquí (o de quitarla de aquí al borrarla). */
  function deMas() {
    var esperadas = {};
    LISTA.forEach(function (e) { esperadas[clave(e)] = true; });
    return U.envolturasAplicadas().filter(function (e) { return !esperadas[clave(e)]; });
  }

  /* Las que han fallado al aplicarse (la función que tenían que
     envolver no existía): U.envolver ya las apunta como fallo, aquí
     solo se cuentan las que además estaban en esta lista. */
  function fallidasEsperadas() {
    var esperadas = {};
    LISTA.forEach(function (e) { esperadas[clave(e)] = true; });
    return U.envolturasFallidas().filter(function (e) { return esperadas[clave(e)]; });
  }

  /* ---------- el aviso en la pantalla de entrada ---------- */

  function pintarAviso() {
    var faltan = faltantes().concat(fallidasEsperadas());
    var contenedor = document.getElementById('paso-carpetas');
    if (!contenedor) return;

    var ya = document.getElementById('aviso-envolturas');
    if (ya) ya.parentNode.removeChild(ya);
    if (!faltan.length) return;

    var vistas = {};
    var unicas = faltan.filter(function (e) {
      var k = clave(e);
      if (vistas[k]) return false;
      vistas[k] = true;
      return true;
    });

    var d = document.createElement('div');
    d.id = 'aviso-envolturas';
    d.className = 'aviso aviso-rojo';
    d.innerHTML = '<strong>Falta' + (unicas.length === 1 ? '' : 'n') + ' ' + unicas.length +
      ' envoltura' + (unicas.length === 1 ? '' : 's') + ' de la aplicación.</strong>' +
      '<p>Avisa antes de seguir trabajando: alguna función no está haciendo todo lo que debería.</p>' +
      '<ul>' + unicas.map(function (e) {
        return '<li>' + U.escapar(e.etiqueta) + ' — revisa ' + U.escapar(e.fichero) + '</li>';
      }).join('') + '</ul>';
    contenedor.appendChild(d);
  }

  /* ---------- el bloque de Ajustes → Mantenimiento ---------- */

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
        '<span class="bloque-titulo">Las envolturas de la aplicación</span>' +
        '<span class="bloque-pie" id="envolturas-pie"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">La aplicación está hecha de módulos que se enganchan unos a otros ' +
        '"envolviendo" funciones. El orden de los ficheros en <code>index.html</code> importa: si ' +
        'uno se carga en el sitio equivocado, la envoltura no se aplica, y aquí sale marcada como ' +
        'fallo en vez de perderse en silencio.</p>' +
        '<div id="tabla-envolturas" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  App.pintarEnvolturas = function () {
    bloqueDeAjustes();
    var faltan = faltantes().concat(fallidasEsperadas());
    var pie = $('envolturas-pie');
    if (pie) pie.textContent = faltan.length
      ? faltan.length + (faltan.length === 1 ? ' envoltura que falta' : ' envolturas que faltan')
      : 'Las ' + LISTA.length + ' están aplicadas';

    var caja = $('tabla-envolturas');
    if (!caja) return;
    caja.innerHTML = '';
    var faltantesClaves = {};
    faltan.forEach(function (e) { faltantesClaves[clave(e)] = true; });

    LISTA.forEach(function (e) {
      var falta = !!faltantesClaves[clave(e)];
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(e.etiqueta) + '</span>' +
        '<span class="suave" style="flex:1">' + U.escapar(e.fichero) + '</span>' +
        '<span class="' + (falta ? 'tercero-falta-dni' : 'suave') + '">' +
        (falta ? 'FALTA' : 'Aplicada') + '</span>';
      caja.appendChild(f);
    });

    var deMasLista = deMas();
    if (deMasLista.length) {
      var aviso = document.createElement('div');
      aviso.className = 'explica';
      aviso.textContent = deMasLista.length + ' envoltura' + (deMasLista.length === 1 ? '' : 's') +
        ' aplicada' + (deMasLista.length === 1 ? '' : 's') + ' de más, sin apuntar en esta lista: ' +
        deMasLista.map(clave).join(', ');
      caja.appendChild(aviso);
    }
  };

  /* No se comprueba en el instante: alguna envoltura (la de
     js/bandeja-correos.js, por ejemplo) no se aplica hasta después de
     entrar, cuando ya hay carpetas señaladas (`arrancar()`, enganchada
     a `window.Gestor.alRefrescar`, que se dispara tras el primer
     `App.verAbiertos()`). Un segundo y medio es tiempo de sobra para
     que el arranque de verdad haya terminado, y sigue siendo "el
     mismo día", que es lo único que pide el encargo. */
  setTimeout(pintarAviso, 1500);
  if (window.Gestor) window.Gestor.alRefrescar.push(pintarAviso);

  return {
    LISTA: LISTA, faltantes: faltantes, deMas: deMas, fallidasEsperadas: fallidasEsperadas,
    pintarAviso: pintarAviso
  };
})();
window.EnvolturasEsperadas = EnvolturasEsperadas;
