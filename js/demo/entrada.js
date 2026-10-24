/* ============================================================
   demo/entrada.js — la carpeta de entrada de documentos sueltos, en
   la copia de pruebas (fila 455, docs/PASAR-A-DRIVE.md).

   Un segundo disco de mentira para la entrada, apagado por defecto.
   Interruptor en la dirección:
     ?demo=1&auto=1&entrada=1      la carpeta de entrada está señalada y
                                   trae dos documentos que NO están en
                                   «asuntos vivos»
     ?demo=1&auto=1&entrada=falta  está señalada, pero su carpeta no se
                                   encuentra (error al abrirla)
   Sin `entrada=` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Demo) return;

  var valor = new URLSearchParams(window.location.search).get('entrada') || '';

  window.Demo.prepararEntrada = async function (disco) {
    if (!valor) return;
    var carpeta = window.Demo.carpetaDeMentira('ENTRADA DEL CENTRO');
    if (valor === 'falta') {
      var perdida = function () { var e = new Error('no existe la carpeta de entrada'); e.name = 'NotFoundError'; return e; };
      carpeta.entries = function () { throw perdida(); };
      carpeta.values = carpeta.entries;
    } else {
      await Carpetas.escribirBytes(carpeta, 'Oficio de la entrada.pdf', 'oficio de la entrada', 'application/pdf');
      await Carpetas.escribirBytes(carpeta, 'Escrito llegado a la entrada.pdf', 'escrito de la entrada', 'application/pdf');
    }
    disco.entrada = carpeta;
    await Almacen.guardar('entrada', carpeta);
  };
})();
