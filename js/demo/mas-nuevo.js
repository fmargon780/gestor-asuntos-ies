/* ============================================================
   demo/mas-nuevo.js — «hay otro más nuevo» en la copia de pruebas
   (fila 319, docs/LO-QUE-TENGO-AHORA.md, punto 6).

     ?demo=1&auto=1&masnuevo=alumnado,personal

   La carpeta del Centro de datos de mentira queda señalada sola, con
   permiso. Primero se toma lo que trae (como al entrar de verdad) y,
   pasados unos segundos, el índice anuncia listados MÁS NUEVOS de esas
   claves (alumnado, personal, alumnado-bd) sin coger: en Herramientas →
   «Traer el alumnado» esas filas salen en ámbar con «Traerlo».

   Todo vive aquí: el código de producción no sabe nada de esto.
   Sin `masnuevo=` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Demo) return;
  var m = /(?:^|[?&])masnuevo=([^&]*)/.exec(location.search);
  var claves = m ? decodeURIComponent(m[1]).split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
  if (!claves.length) return;

  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

  /* Se llama (sin esperar) cuando la demostración ya está montada. */
  window.Demo.prepararMasNuevo = async function (disco) {
    try {
      await window.Demo.llenarCentro(disco.centro);
      await Almacen.guardar('centro-de-datos-carpeta', disco.centro);
      await CentroDeDatos.traer({ avisar: false, pedir: false });
      /* Que acabe cualquier guardado y la pasada de entrada del Centro de datos antes de anunciar lo nuevo. */
      for (var i = 0; i < 20 && window.ColaGuardado && ColaGuardado.hayGuardado(); i++) await esperar(500);
      await esperar(3500);
      var indice = await Carpetas.leerJson(disco.centro, 'indice.json');
      var subido = new Date(Date.now() + 2 * 86400000).toISOString();
      indice.listados.forEach(function (e) {
        if (claves.indexOf(e.clave) === -1) return;
        e.subido = subido;
        e.huella = 'demo-nuevo-' + e.clave + '-' + subido;
      });
      await Carpetas.escribirTexto(disco.centro, 'indice.json', JSON.stringify(indice));
      window.Demo.masNuevoListo = true;
      if (window.DatosQueTengo) DatosQueTengo.olvidarMirada();
    } catch (e) { console.error('masnuevo:', e); }
  };
})();
