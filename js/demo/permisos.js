/* ============================================================
   demo/permisos.js — carpetas sin permiso en la copia de pruebas
   (fila 318, docs/PERMISOS-DE-CARPETAS-AL-ENTRAR.md, punto 4).

   Para que el revisor pueda ver «Dar permiso» sin los cuadros del
   navegador de verdad:

     ?demo=1&auto=1&sinpermiso=alumnado,bandeja,centro-de-datos
         Esas carpetas de mentira existen, están recordadas y EMPIEZAN
         SIN PERMISO: queryPermission da 'prompt' hasta que se llama a
         requestPermission, que da 'granted' y a partir de ahí lo
         recuerda (hasta recargar).
     &niega=bandeja
         Para esos id, requestPermission da 'denied'.

   Con `auto=1` no hay pulsación en «Entrar»: no se pide nada al entrar
   (Demo.sinPulsacion). Sin `sinpermiso=` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Demo) return;

  function lista(nombre) {
    var m = new RegExp('(?:^|[?&])' + nombre + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]).split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
  }

  var sinPermiso = lista('sinpermiso');
  var niega = lista('niega');

  function simular(h, id) {
    var estado = 'prompt';
    h.queryPermission = function () { return Promise.resolve(estado); };
    h.requestPermission = function () {
      if (niega.indexOf(id) !== -1) return Promise.resolve('denied');
      estado = 'granted';
      return Promise.resolve('granted');
    };
  }

  window.Demo.permisosSimulados = function () { return sinPermiso.length > 0; };
  window.Demo.sinPulsacion = function () { return /(^|[?&])auto=1(&|$)/.test(location.search); };

  /* Antes de entrar: deja recordadas las carpetas de mentira, sin permiso. */
  window.Demo.prepararPermisos = async function (disco) {
    if (!sinPermiso.length) return;
    window.Demo.montando = true;   /* hasta que acabe de montarse (js/demo/datos.js): el panel no sale a medias */
    if (sinPermiso.indexOf('bandeja') !== -1) {
      simular(disco.bandeja, 'bandeja');
      await Almacen.guardar('bandeja', disco.bandeja);
    }
    if (sinPermiso.indexOf('centro-de-datos') !== -1) {
      simular(disco.centro, 'centro-de-datos');
      if (window.Demo.llenarCentro) await window.Demo.llenarCentro(disco.centro);
      await Almacen.guardar('centro-de-datos-carpeta', disco.centro);
    }
    if (sinPermiso.indexOf('alumnado') !== -1) {
      var alumnado = window.Demo.carpetaDeMentira('ALUMNADO-BD');
      await Carpetas.guardarJson(alumnado, 'ALUMNADO-BD.json', {
        acuerdo: AlumnadoBD.ACUERDO, generado: new Date().toISOString(), origen: 'demo', campos: [], alumnos: []
      });
      simular(alumnado, 'alumnado');
      await Almacen.guardar('alumnado-bd-carpeta', alumnado);
    }
  };
})();
