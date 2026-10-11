/* ============================================================
   problemas-personal.js — los avisos del personal, en Ajustes › Problemas
   (fila 327, docs/PERSONAL-DEL-CENTRO-DE-DATOS.md, apartado 5).

   El Centro de datos deja, junto a cada parte del personal, lo que no
   cuadra (`avisos`). Aquí solo salen los del curso más reciente (los de
   cursos antiguos no se pueden corregir en Séneca): una tarjeta por clase
   de aviso, con una línea por persona.

     personal-sin-dni       ← personal-sin-id
     personal-dos-listados  ← personal-en-dos-listados
     personal-listado       ← personal-fichero

   Los avisos llevan datos de personas: nunca van a un registro de errores
   ni a «Avisar por Soporte». Los textos, en js/problemas-textos.js.
   ============================================================ */
(function () {
  if (!window.Problemas || !window.ProblemasTextos) return;

  var CLASES = [
    { id: 'personal-sin-dni', tipo: 'personal-sin-id', texto: 'personalSinDni' },
    { id: 'personal-dos-listados', tipo: 'personal-en-dos-listados', texto: 'personalDosListados' },
    { id: 'personal-listado', tipo: 'personal-fichero', texto: 'personalListado' }
  ];
  var LISTADOS = { 'docentes': 'docentes', 'no-docentes': 'no docentes', 'todo': 'todo el personal' };

  function listado(d) { return LISTADOS[d && d.listado] || ''; }

  /* La línea de una persona o de un listado, según la clase. */
  function elementoDe(tipo, a) {
    var d = a.datos || {};
    if (tipo === 'personal-sin-id') {
      return { nombre: d.empleado || 'Sin nombre', detalle: [d.puesto, listado(d)].filter(Boolean).join(' · ') };
    }
    if (tipo === 'personal-en-dos-listados') return { nombre: d.empleado || 'Sin nombre' };
    return { nombre: listado(d) || 'Un listado', detalle: d.detalle || '' };
  }

  async function mirarDeNuevo() {
    if (window.CentroDeDatos) await CentroDeDatos.traer({ avisar: true, pedir: true });
    Datos.olvidar('PERSONAL');
    await calcular(true);
  }

  async function calcular() {
    var datos = window.App && App.E && App.E.datos;
    if (!datos || !window.Datos) return;
    var personal = await Datos.cargar(datos, 'PERSONAL');
    var avisos = (personal && personal.avisos) || [];
    CLASES.forEach(function (c) {
      var elementos = avisos.filter(function (a) { return a.tipo === c.tipo && a.curso === personal.curso; })
        .map(function (a) { return elementoDe(c.tipo, a); });
      var desc = null;
      if (elementos.length) {
        desc = ProblemasTextos[c.texto](elementos);
        desc.acciones[0].alPulsar = mirarDeNuevo;
      }
      Problemas.registrar(c.id, desc);
    });
  }

  Problemas.calculador('personal', calcular);
})();
