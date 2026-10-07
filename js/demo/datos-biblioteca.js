/* ============================================================
   demo/datos-biblioteca.js — una guía con seis hitos de la biblioteca, cuatro ya distintos de su modelo
   (fila 297, docs/PREGUNTA-DE-LA-BIBLIOTECA-AL-GUARDAR.md), y un asunto de ese tipo: sirve para ver que, al guardar
   «Cambiar la guía», la pregunta de la biblioteca solo sale por lo que se ha cambiado esta vez. Los hitos 1, 3 y 4 cambian
   el responsable, el 2 la explicación; el 5 y el 6 son iguales a su modelo. Todo inventado.
   Lo llama js/demo/datos.js al montar los asuntos.
   ============================================================ */
(function () {
  'use strict';

  var TIPO = 'Medida disciplinaria por conducta gravemente perjudicial';
  var IDS = ['b7', 'b8', 'b9', 'b10', 'b11', 'b12'];

  async function construir(o) {
    var datos = await App.leerFicheroDeLaApp('datos-biblioteca/biblioteca-centro.json', 'json');
    var modelos = IDS.map(function (id) {
      return HitosBiblioteca._normalizarModelo(datos.modelos.filter(function (m) { return m.id === id; })[0]);
    });
    await HitosBiblioteca.cambiar(function (d) {
      modelos.forEach(function (m) { if (!HitosBiblioteca.buscar(d, m.id)) d.modelos.push(m); });
      return d;
    });
    var pasos = modelos.map(function (m) { return HitosBiblioteca.modeloAPaso(m, ''); });
    /* Cuatro ya distintos de su modelo (nadie los ha escrito a mano: así llegan guías de verdad). */
    pasos[0].responsable = 'Secretaría';
    pasos[1].cuerpo = '<p>Explicación propia de este tipo.</p>';
    pasos[2].responsable = 'Secretaría';
    pasos[3].responsable = 'Dirección';
    var tipo = await o.crearTipoConGuia(TIPO, 'ALUMNADO', pasos, null);
    /* Otro tipo que usa el primer modelo: la pregunta dice «(lo usan 1 tipo más)». */
    await o.crearTipoConGuia('Parte de incidencia', 'ALUMNADO', [HitosBiblioteca.modeloAPaso(modelos[0], '')], null);
    await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Aguilar Ponce, Marina', id: '2100001' }), o.hace(2), {});
  }

  window.Demo = window.Demo || {};
  window.Demo.biblioteca = { construir: construir };
})();
