/* ============================================================
   datos-personal-hecho.js — una parte del personal ya preparada por el
   Centro de datos, convertida en las filas de siempre (fila 327,
   docs/PERSONAL-DEL-CENTRO-DE-DATOS.md; la forma de la parte está en
   docs/ACUERDO-PERSONAL.md).

   No lee nada del disco: `js/datos-personal.js` (`cargarPersonal`) le pasa
   la parte ya leída y la mete por el mismo bucle que las filas de un
   RelPerCen.

   - `vale(parte)`: ¿se puede usar? Si no, se ignora, como si no estuviera.
   - `filasDe(parte)`: una fila por registro, con la forma que dejaba un
     RelPerCen: { nombre, documento, puesto, cese, campos, tipoPersonal,
     puestos } y, por cada aviso `personal-sin-id`, la de quien viene sin
     DNI (con `sinDocumento: true`).
   - `avisosDe(parte)`: los avisos de la parte, cada uno con su curso.
   ============================================================ */
var DatosPersonalHecho = (function () {

  var ACUERDO_MAXIMO = 1;

  function norma(t) { return window.U && U.normalizar ? U.normalizar(t) : String(t || '').toLowerCase(); }
  function texto(v) { return v === undefined || v === null ? '' : String(v).trim(); }

  function vale(parte) {
    return !!parte && typeof parte === 'object' && parte.conjunto === 'personal' &&
      !(Number(parte.acuerdoHecho) > ACUERDO_MAXIMO) && Array.isArray(parte.registros);
  }

  /* El valor de una casilla por el título de su columna (sin mayúsculas ni acentos), o undefined. */
  function celda(celdas, titulo) {
    var buscado = norma(titulo);
    for (var i = 0; i < celdas.length; i++) {
      if (celdas[i] && norma(celdas[i].columna) === buscado) return texto(celdas[i].valor);
    }
    return undefined;
  }

  function camposDe(celdas) {
    var campos = {};
    celdas.forEach(function (c) {
      var v = c ? texto(c.valor) : '';
      if (v && c.columna) campos[String(c.columna).trim()] = v;
    });
    return campos;
  }

  function filaDeRegistro(r) {
    var d = (r && r.datos) || {};
    var celdas = Array.isArray(d.celdas) ? d.celdas : [];
    var campos = camposDe(celdas);
    var nombre = texto(d.empleado) || texto(campos['Empleado/a']);
    if (!nombre) return null;
    var documento = texto(d.documento) || texto(campos['DNI/Pasaporte']) || texto(r.id);
    var puesto = celda(celdas, 'Puesto');
    var cese = celda(celdas, 'Fecha de cese');
    if (puesto === undefined) puesto = texto(d.puesto);
    if (cese === undefined) cese = texto(d.fechaCese);
    if (!celdas.length) {   /* sin casillas: lo mínimo, con los títulos de Séneca */
      campos = {};
      [['Empleado/a', nombre], ['DNI/Pasaporte', documento], ['Puesto', puesto], ['Especialidad', d.especialidad], ['Situación', d.situacion],
        ['Fecha de cese', cese], ['Teléfono', d.telefono], ['Correo electrónico', d.correo]].forEach(function (p) {
        var v = texto(p[1]);
        if (v) campos[p[0]] = v;
      });
    }
    var fila = { nombre: nombre, documento: documento, puesto: puesto, cese: cese, campos: campos };
    if (d.tipoPersonal) fila.tipoPersonal = d.tipoPersonal;
    if (Array.isArray(d.puestos)) fila.puestos = d.puestos;
    return fila;
  }

  /* Quien viene sin DNI sigue saliendo, con el nombre y el puesto que trae el aviso. */
  function filaSinDocumento(a) {
    var d = (a && a.datos) || {};
    var nombre = texto(d.empleado);
    if (!nombre) return null;
    var puesto = texto(d.puesto);
    var campos = { 'Empleado/a': nombre };
    if (puesto) campos['Puesto'] = puesto;
    return { nombre: nombre, documento: '', puesto: puesto, cese: '', campos: campos, sinDocumento: true };
  }

  function filasDe(parte) {
    if (!vale(parte)) return [];
    var filas = [];
    parte.registros.forEach(function (r) { var f = filaDeRegistro(r); if (f) filas.push(f); });
    (Array.isArray(parte.avisos) ? parte.avisos : []).forEach(function (a) {
      if (a && a.tipo === 'personal-sin-id') { var f = filaSinDocumento(a); if (f) filas.push(f); }
    });
    return filas;
  }

  /* Los avisos de la parte, cada uno con su curso: { tipo, id, datos, curso }. */
  function avisosDe(parte) {
    if (!vale(parte)) return [];
    return (Array.isArray(parte.avisos) ? parte.avisos : []).filter(function (a) { return a && a.tipo; }).map(function (a) {
      return { tipo: a.tipo, id: a.id || '', datos: a.datos || {}, curso: parte.cursoEscolar || '' };
    });
  }

  return { vale: vale, filasDe: filasDe, avisosDe: avisosDe };
})();
window.DatosPersonalHecho = DatosPersonalHecho;
