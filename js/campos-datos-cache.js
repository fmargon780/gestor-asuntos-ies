/* ============================================================
   campos-datos-cache.js — los datos de una persona que no están en su
   ficha (fila 529, docs/529-CREAR-CAMPOS-POR-PASOS.md).

   Un campo creado a partir de otros puede partir de cualquier campo de
   la lista (el nº escolar, el DNI, los tutores, una tabla de datos…),
   pero esos valores se sacan de forma asíncrona (`CamposListaDatos.ejemplo`)
   y el cálculo (`Calculo.evaluar`) es síncrono. Por eso se leen antes y
   se guardan aquí, por persona y por campo: `valor(id, persona)` los
   da al instante, y '' si todavía no se han leído.

   Una origen de este tipo es `{ clase: 'dato', id: 'h:nie', nombre: '…' }`.
   ============================================================ */
var CamposDatosCache = (function () {

  var guardados = {};
  function llave(id, persona) { return ((persona && persona.nombre) || '') + '|' + id; }

  function valor(id, persona) { var v = guardados[llave(id, persona)]; return v == null ? '' : v; }
  function tiene(id, persona) { return guardados[llave(id, persona)] !== undefined; }
  function poner(id, persona, v) { guardados[llave(id, persona)] = String(v == null ? '' : v); }

  /* Los ids de datos de otra parte que usa una receta, también los de los calculados de los que sale. */
  function idsDe(receta, config, vistos) {
    vistos = vistos || {};
    var ids = [];
    var origenes = window.Calculo ? Calculo.origenesDe(receta) : [];
    origenes.forEach(function (o) {
      if (!o) return;
      if (o.clase === 'dato' && o.id) ids.push(o.id);
      if (o.clase === 'calculado' && !vistos[o.id]) {
        vistos[o.id] = true;
        var r = ((config && config.calculados) || []).filter(function (x) { return x.id === o.id; })[0];
        if (r) ids = ids.concat(idsDe(r, config, vistos));
      }
    });
    return ids;
  }

  /* Lee y guarda estos datos para esta persona (`item`: { categoria, nombre, persona }). */
  async function precargar(ids, item, lista) {
    var pendientes = ids.filter(function (id, i) { return ids.indexOf(id) === i && !tiene(id, item.persona); });
    if (!pendientes.length) return;
    var todos = lista;
    if (!todos) { try { todos = await CamposListaDatos.lista(); } catch (e) { todos = []; } }
    for (var i = 0; i < pendientes.length; i++) {
      var campo = todos.filter(function (c) { return c.id === pendientes[i]; })[0];
      var v = '';
      try { v = campo ? await CamposListaDatos.ejemplo(campo, item) : ''; } catch (e) { v = ''; }
      poner(pendientes[i], item.persona, v);
    }
  }

  return { valor: valor, tiene: tiene, poner: poner, idsDe: idsDe, precargar: precargar };
})();
window.CamposDatosCache = CamposDatosCache;
