/* ============================================================
   lista-nuevo-listas.js — lo propio de cada lista del «+ Nuevo…» (fila 615,
   docs/615-LISTAS-EDITABLES.md). Lo común (el cuadro, el aviso de parecidos y el
   escucha de los desplegables) está en js/lista-nuevo.js; las plantillas, en
   js/guias-plantilla-nueva.js.

   - Responsable y «Esperamos a…»: la lista de responsables de Ajustes › Hitos
     (`Hitos.anadirResponsable`, con la clase y sin la marca de Administración,
     como «Añadir» de Ajustes). Lo creado sale ya en todos los desplegables que hay
     abiertos y, en el editor de la guía, en los que se pinten después.
   - Tipo de documento: `App.E.tiposDocumento`, como Ajustes › Tipos de documento.
   - Campo de lista («Cuándo se hace»): la lista de campos de la app
     (`campos.json`), añadido también al tipo de la guía.
   ============================================================ */
window.ListaNuevoListas = (function () {
  var LN = window.ListaNuevo;
  var DONDE_RESP = 'los responsables (Ajustes › Hitos)';
  var NOTA_RESP = 'Se guarda en Ajustes › Hitos y sale en todas las guías y asuntos.';

  function opcionesDe(sel) {
    var OPCION = window.ResponsableOrganismo ? ResponsableOrganismo.OPCION : null;
    return Array.prototype.filter.call(sel.options, function (o) { return o.value && o.value !== LN.NUEVO && o.value !== OPCION; });
  }
  function tiene(sel, valor) { return !!sel && Array.prototype.some.call(sel.options, function (o) { return o.value === valor; }); }

  /* ---------- responsables ---------- */

  /* Los nombres cortos con que se ve cada papel fijo en «Esperamos a…». */
  var CORTOS = { tercero: 'Tercero', tutor: 'Familia', relacionado: 'Relacionado', profesores: 'Sus profesores' };

  /* Lo que ya hay en la lista: lo que ofrece el desplegable (se puede usar) y lo demás de Ajustes › Hitos y los papeles. */
  async function responsablesConocidos(sel) {
    var salida = [], vistos = {};
    function anadir(valor, nombre, donde, usable) {
      if (vistos[valor + '|' + nombre]) return;
      vistos[valor + '|' + nombre] = true;
      salida.push({ valor: valor, nombre: nombre, donde: donde, usable: usable });
    }
    if (sel) opcionesDe(sel).forEach(function (o) { anadir(o.value, o.textContent, DONDE_RESP, true); });
    var datos = null;
    try { datos = await Hitos.leer(); } catch (e) { /* solo con lo que ofrece el desplegable */ }
    ((datos && datos.ajustes && datos.ajustes.responsables) || []).forEach(function (r) {
      anadir(r.id, r.nombre, DONDE_RESP, !sel || tiene(sel, r.id));
    });
    (Hitos.PAPELES || []).forEach(function (p) {
      anadir(p.id, p.nombre, 'los papeles fijos de la app', !sel || tiene(sel, p.id));
      if (CORTOS[p.id]) anadir(p.id, CORTOS[p.id], 'los papeles fijos de la app', !sel || tiene(sel, p.id));
    });
    return salida;
  }

  /* Los desplegables de la guía llevan los papeles al final: lo creado va antes de ellos. */
  function antesDeLosPapeles(sel) {
    var ids = (Hitos.PAPELES || []).map(function (p) { return p.id; });
    return Array.prototype.filter.call(sel.options, function (o) { return ids.indexOf(o.value) !== -1; })[0] || null;
  }

  /* La lista de responsables del editor de la guía (la misma matriz que usan sus desplegables al repintarse). */
  var deLaGuia = null;
  function responsablesDeLaGuia(lista) { deLaGuia = lista || null; }

  function dejarEnLaPagina(r) {
    Array.prototype.forEach.call(document.querySelectorAll('select.paso-responsable'), function (s) {
      if (tieneNuevoOpcion(s)) LN.ponerOpcion(s, r.id, r.nombre, antesDeLosPapeles);
    });
    Array.prototype.forEach.call(document.querySelectorAll('select.paso-toca-a'), function (s) {
      if (tieneNuevoOpcion(s)) LN.ponerOpcion(s, r.id, r.nombre);
    });
    if (deLaGuia && !deLaGuia.some(function (x) { return x.id === r.id; })) {
      var i = deLaGuia.findIndex(function (x) { return x.clase === 'papel'; });
      if (i === -1) deLaGuia.push({ id: r.id, nombre: r.nombre, clase: 'centro' });
      else deLaGuia.splice(i, 0, { id: r.id, nombre: r.nombre, clase: 'centro' });
    }
  }
  function tieneNuevoOpcion(s) { return !!s.querySelector('option[value="' + LN.NUEVO + '"]'); }

  /* El cuadro de «Nuevo responsable». `sel` es el desplegable de donde viene (o null, en el menú de la mesa).
     Devuelve { id, nombre } del responsable elegido o creado, o null. */
  async function cuadroResponsable(sel) {
    var existentes = await responsablesConocidos(sel);
    var r = await LN.pedir({
      titulo: 'Nuevo responsable', etiqueta: 'Nombre del responsable', nota: NOTA_RESP, existentes: existentes,
      alCrear: async function (nombre) {
        var id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
        await Hitos.anadirResponsable(id, nombre);
        return { id: id, nombre: nombre };
      }
    });
    if (!r) return null;
    if (r.usado) return { id: r.usado.valor, nombre: r.usado.nombre, usado: true };
    return { id: r.creado.id, nombre: r.creado.nombre };
  }

  async function nuevoResponsable(sel) {
    var r = await cuadroResponsable(sel);
    if (!r) return;
    if (!r.usado) dejarEnLaPagina(r);
    else if (!tiene(sel, r.id)) return;
    LN.elegir(sel, r.id);
    if (!r.usado) U.aviso('Responsable «' + r.nombre + '» añadido.', 'bueno');
  }

  /* Para el menú «Responsable» de la mesa del hito: devuelve el elemento del menú. `alElegir(id)`. */
  function itemDeMenuResponsable(alElegir) {
    if (!LN.disponible()) return [];
    return [{ texto: '+ Nuevo responsable…', clase: 'mesa-resp-nuevo', alPulsar: async function () {
      var r = await cuadroResponsable(null);
      if (!r) return;
      if (!r.usado) U.aviso('Responsable «' + r.nombre + '» añadido.', 'bueno');
      alElegir(r.id);
    } }];
  }

  /* ---------- tipos de documento ---------- */

  async function nuevoTipoDocumento(sel) {
    var existentes = ((window.App && App.E && App.E.tiposDocumento) || []).map(function (t) {
      return { valor: t, nombre: t, donde: 'los tipos de documento (Ajustes)', usable: tiene(sel, t) };
    });
    var r = await LN.pedir({
      titulo: 'Nuevo tipo de documento', etiqueta: 'Nombre del tipo de documento', limpiar: U.limpiarNombre,
      nota: 'Se guarda en Ajustes › Tipos de documento y sale en todos los documentos.', existentes: existentes,
      alCrear: async function (nombre) {
        var n = U.limpiarNombre(nombre).toUpperCase();
        await Borrados.revivir(App.E.gestor, 'tiposDocumento', n);
        if (App.E.tiposDocumento.indexOf(n) === -1) App.E.tiposDocumento.push(n);
        await App.guardarTiposDocumento();
        return { valor: n, nombre: n };
      }
    });
    if (!r) return;
    var valor = r.usado ? r.usado.valor : r.creado.valor;
    if (r.creado) {
      Array.prototype.forEach.call(document.querySelectorAll('select.paso-tipo-documento'), function (s) {
        LN.ponerOpcion(s, valor, valor);
      });
      U.aviso('Tipo de documento «' + valor + '» añadido.', 'bueno');
    }
    LN.elegir(sel, valor);
  }

  /* ---------- campos de lista («Cuándo se hace») ---------- */

  function configDe() { return (window.App && App.E && App.E.campos) || { propios: [], porTipo: {} }; }

  /* Todos los campos de lista de la app, con los tipos que los usan. */
  function listaDeCampos(tipo) {
    var c = configDe();
    return (c.propios || []).filter(function (p) { return p.clase === 'lista'; }).map(function (p) {
      var usos = Object.keys(c.porTipo || {}).filter(function (t) {
        return (c.porTipo[t] || []).some(function (x) { return x.origen === 'propio' && x.id === p.id; });
      });
      return { valor: p.id, nombre: p.nombre, valores: (p.valores || []).slice(), usable: true,
        donde: 'la lista de campos' + (usos.length ? ' (lo usa ' + usos.join(', ') + ')' : '') };
    });
  }

  /* Los nombres de todos los campos que ya tiene el tipo (de cualquier clase). */
  function nombresDelTipo(tipo) {
    var c = configDe();
    return ((c.porTipo && c.porTipo[tipo]) || []).map(function (x) { return Campos.nombreDeCampo(x, c); });
  }

  /* Un solo guardado de campos.json: el campo nuevo (si lo es) y su puesta en el tipo. */
  function escribirCampo(tipo, campo) {
    if (campo.nuevo) campo.id = 'p' + Date.now() + Math.floor(Math.random() * 100000);
    return App.enFila('campos.json', async function () {
      var config = await Campos.leer(App.E.gestor);
      if (campo.nuevo) {
        config = await Campos.guardarPropios(App.E.gestor, function (propios) {
          propios.push({ id: campo.id, nombre: campo.nombre, clase: 'lista', valores: campo.valores, grupo: 'Asunto' });
          return propios;
        });
      }
      var lista = ((config.porTipo && config.porTipo[tipo]) || []).slice();
      if (!lista.some(function (e) { return Campos.claveDeCampo(e) === 'propio:' + campo.id; })) {
        lista.push({ origen: 'propio', id: campo.id, obligatorio: false, enNombre: false });
      }
      return Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista);
    }).then(function (config) { App.E.campos = config; });
  }

  async function nuevoCampoDeLista(sel) {
    var tipo = window.GuiasCuando ? GuiasCuando.tipoActual() : '';
    if (!tipo) return;
    var r = await LN.pedir({
      titulo: 'Nuevo campo de lista', etiqueta: 'Nombre del campo', conOpciones: true, errorVacio: 'Escribe el nombre del campo.',
      nota: 'Se añade a la lista de campos y al tipo ' + tipo + '.',
      existentes: listaDeCampos(tipo), propios: nombresDelTipo(tipo),
      textoYaEsta: function (n) { return 'Ya hay un campo «' + n + '» en este tipo.'; },
      validar: function (n, ops) {
        var unicas = ops.filter(function (o, i) { return ops.findIndex(function (x) { return LN.norm(x) === LN.norm(o); }) === i; });
        return unicas.length < 2 ? 'Escribe al menos dos opciones, una por línea.' : '';
      },
      alCrear: async function (nombre, ops) {
        var valores = ops.filter(function (o, i) { return ops.findIndex(function (x) { return LN.norm(x) === LN.norm(o); }) === i; });
        await escribirCampo(tipo, { nuevo: true, nombre: nombre, valores: valores });
        return { nombre: nombre };
      }
    });
    if (!r) return;
    var nombre;
    if (r.usado) { await escribirCampo(tipo, { nuevo: false, id: r.usado.valor, nombre: r.usado.nombre }); nombre = r.usado.nombre; }
    else nombre = r.creado.nombre;
    /* Sale ya en los demás «Cuándo se hace» de la guía, y en este queda elegido. */
    Array.prototype.forEach.call(document.querySelectorAll('select.cuando-campo'), function (s) {
      LN.ponerOpcion(s, nombre, 'Solo si el campo «' + nombre + '» vale…');
    });
    U.aviso(r.usado ? 'Campo «' + nombre + '» añadido a este tipo.' : 'Campo «' + nombre + '» creado.', 'bueno');
    LN.elegir(sel, nombre);
  }

  /* ---------- a quién atiende cada desplegable ---------- */

  LN.registrar('select.paso-responsable, select.paso-toca-a', nuevoResponsable);
  LN.registrar('select.paso-tipo-documento', nuevoTipoDocumento);
  LN.registrar('select.cuando-campo', nuevoCampoDeLista);

  return { responsablesDeLaGuia: responsablesDeLaGuia, itemDeMenuResponsable: itemDeMenuResponsable,
           listaDeCampos: listaDeCampos, nombresDelTipo: nombresDelTipo };
})();
