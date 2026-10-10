/* ============================================================
   demo/copia-alumnado.js — la copia del alumnado, para ver la fecha real
   del listado (fila 324, docs/FECHA-REAL-DEL-LISTADO.md, punto 5).

     ?demo=1&auto=1&copiaalumnado=aldia | vieja | sinfecha

   En los tres, este ordenador no tiene señalada la carpeta de la base de
   datos de alumnado y guarda una copia válida de ALUMNADO-BD.json hecha
   hace 5 días. RegAlum.csv es siempre el recién copiado (hoy); cambia lo
   que dice su apunte de «Lo que tengo ahora»:
     aldia:    fecha real de hace 10 días (la copia es más nueva: sale bien)
     vieja:    fecha real de ayer (la copia es más vieja: ámbar, dos fechas)
     sinfecha: sin apunte (sale bien y manda la base de datos)

   Sin `copiaalumnado=` este fichero no hace nada.
   ============================================================ */
(function () {
  'use strict';
  var m = /(?:^|[?&])copiaalumnado=([^&]*)/.exec(location.search);
  var caso = m ? decodeURIComponent(m[1]) : '';
  if (['aldia', 'vieja', 'sinfecha'].indexOf(caso) === -1) return;

  var DIA = 86400000;

  async function construir() {
    try {
      var curso = U.cursoActual();
      /* El listado se copió hoy (otras partes de la demostración lo envejecen). */
      (await App.E.datos.getFileHandle('RegAlum.csv'))._modificado = Date.now();
      await AlumnadoBD.guardar({
        acuerdo: AlumnadoBD.ACUERDO, generado: new Date(Date.now() - 5 * DIA).toISOString(), origen: 'bd-alumnado-ies',
        cursoAcademico: curso,
        campos: [{ clave: 'pil', etiqueta: 'PIL', apartado: 'Otros datos', tipo: 'si-no' }],
        alumnos: [{ idEscolar: '2100001', matriculado: true, datos: { pil: false } }]
      });
      if (caso !== 'sinfecha') {
        await DatosQueTengo.apuntar('RegAlum.csv', {
          via: 'carpeta', nombreOriginal: 'RegAlum.csv',
          fechaOriginal: new Date(Date.now() - (caso === 'aldia' ? 10 : 1) * DIA).toISOString()
        });
      }
      if (window.Datos && Datos.olvidar) Datos.olvidar('ALUMNADO');
      /* La comprobación al entrar ya se hizo, antes de que existiera la copia: se repite. */
      if (window.ComprobacionEntrada) await ComprobacionEntrada.comprobar();
    } catch (e) { console.error('copiaalumnado:', e); }
  }

  window.Demo = window.Demo || {};
  window.Demo.copiaAlumnado = { construir: construir };
})();
