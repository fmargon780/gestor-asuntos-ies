/* ============================================================
   asuntos-editar.js — editar un asunto ya creado.

   Va en su propio fichero porque es lo más delicado de la aplicación:
   cambiar cualquiera de sus datos significa cambiarle el nombre a la
   carpeta, y eso hay que hacerlo con cuidado.

   Solo se hace en los asuntos abiertos: el nombre de una carpeta
   archivada es el rastro de aquel día.
   ============================================================ */

/* Saca las piezas del asunto para rellenar el cuadro.

   Si el asunto lo creó la aplicación, sus piezas están en la ficha, y
   se usan tal cual siempre que vuelvan a montar el nombre que tiene la
   carpeta hoy. Si no cuadran, o si la carpeta se creó a mano, se leen
   del propio nombre: el año académico y el grupo se reconocen por su
   forma, y todo lo demás se deja en el tercero, para no partir por la
   mitad algo que no se sabe partir. */
App.piezasDelAsunto = function (a) {
  var fecha = /^\d{6}$/.test(a.leido.fecha)
    ? '20' + a.leido.fecha.slice(0, 2) + '-' + a.leido.fecha.slice(2, 4) + '-' + a.leido.fecha.slice(4, 6)
    : '';

  var deFicha = {
    fecha: fecha,
    tipo: a.ficha.tipo || a.leido.tipo || '',
    curso: a.ficha.curso || '',
    grupo: a.ficha.grupo || '',
    campos: (a.ficha.campos && typeof a.ficha.campos === 'object') ? a.ficha.campos : {},
    descripcion: a.ficha.descripcion || '',
    tercero: a.ficha.tercero || ''
  };
  var comprobacion = Nombres.montar(Object.assign({}, deFicha,
    { campos: App.valoresGuardadosParaNombre(deFicha.tipo, deFicha.campos) }));
  if (deFicha.tercero && comprobacion === a.nombre) return deFicha;

  var resto = a.leido.resto || '';
  var mCurso = resto.match(/^(\d{2}[-\/]\d{2})\s+/);
  var curso = mCurso ? mCurso[1].replace('/', '-') : '';
  if (mCurso) resto = resto.slice(mCurso[0].length);
  var mGrupo = resto.match(/^(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\s+/i);
  var grupo = mGrupo ? mGrupo[1] : '';
  if (mGrupo) resto = resto.slice(mGrupo[0].length);

  return {
    fecha: fecha,
    tipo: a.leido.tipo || '',
    curso: curso,
    grupo: grupo,
    campos: deFicha.campos,
    descripcion: '',
    tercero: U.limpiarNombre(resto)
  };
};

/* Los valores ya guardados de un asunto (`ficha.campos`), en el orden
   configurado para su tipo y solo los que están marcados "Añadir al
   nombre". Sirve tanto para comprobar si el nombre de hoy cuadra con
   lo guardado, como para volver a montarlo tras una edición. */
App.valoresGuardadosParaNombre = function (tipo, camposGuardados) {
  var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
  var guardados = camposGuardados || {};
  return config
    .map(function (cfg) { return guardados[Campos.claveDeCampo(cfg)]; })
    .filter(function (g) { return g && g.enNombre && g.valor; })
    .map(function (g) { return g.valor; });
};

/* Los campos del cuadro de editar: los mismos que tiene puestos el
   tipo en Ajustes, rellenos con lo que se guardó (no se vuelve a
   preguntar al tercero: si algo cambió desde entonces, se corrige a
   mano, igual que el resto del formulario). Si al cambiar el tipo en
   el propio cuadro hubiera otro juego de campos, aquí se sigue
   enseñando el del tipo con el que se abrió: cambiar el tipo de un
   asunto ya abierto es raro, y no merece la pena releer el catálogo
   de otra categoría en mitad de la edición. */
App.pintarCamposEditar = function (tipo, guardados) {
  var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
  if (!config.length) return { html: '', items: [] };

  var items = config.map(function (cfg) {
    var clave = Campos.claveDeCampo(cfg);
    var g = (guardados && guardados[clave]) || {};
    /* Igual que al crear el asunto: la clase y los valores de un
       campo propio de lista viven en `propios`, no en `porTipo`. */
    var cfgParaPintar = cfg;
    if (cfg.origen === 'propio') {
      var p = Campos.propioDe(cfg.id, App.E.campos);
      if (p) cfgParaPintar = Object.assign({}, cfg, { clase: p.clase, valores: p.valores });
    }
    return { cfg: cfgParaPintar, clave: clave, nombre: Campos.nombreDeCampo(cfg, App.E.campos),
             valor: g.valor || '', enNombre: g.enNombre !== false };
  });

  var filas = items.map(function (it, i) {
    var idBase = 'ed-campo-' + i;
    var control = (it.cfg.origen === 'propio' && it.cfg.clase === 'lista')
      ? '<select id="' + idBase + '" class="campo"><option value="">Sin elegir</option>' +
        (it.cfg.valores || []).map(function (v) {
          return '<option value="' + U.escapar(v) + '"' + (v === it.valor ? ' selected' : '') + '>' +
                 U.escapar(v) + '</option>';
        }).join('') + '</select>'
      : '<input id="' + idBase + '" class="campo" value="' + U.escapar(it.valor) + '">';
    return '<div class="campo-fila">' +
      '<label class="etiqueta">' + U.escapar(it.nombre) + (it.cfg.obligatorio ? ' *' : '') + '</label>' +
      control +
      '<label class="interruptor interruptor-fila"><input type="checkbox" id="' + idBase + '-en"' +
        (it.enNombre ? ' checked' : '') + '><span>Añadir al nombre</span></label>' +
      '</div>';
  }).join('');

  return {
    html: '<label class="etiqueta">Datos del asunto</label>' +
          '<div id="ed-campos" class="campos-lista">' + filas + '</div>',
    items: items
  };
};

/* ---------- cuando llega el Nº de identificación escolar de un aspirante ----------

   17-sep-2026, fila 42, docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md,
   sección 4. Un aspirante se pudo dar de alta sin Nº de identificación
   escolar (carpeta con solo apellidos y nombre); cuando Francisco lo
   escribe en su ficha, hay que renombrar solas las carpetas de sus
   asuntos ABIERTOS. Las archivadas no se tocan: su nombre es el rastro
   del día en que se cerraron.

   Mismo camino que App.editarAsunto: Carpetas.renombrar y mover la
   ficha de la clave vieja a la nueva en App.E.registro.asuntos. Antes de
   tocar nada, enseña la lista y espera "Adelante" (U.preguntar). */
App.renombrarAsuntosAbiertosDelTercero = async function (categoria, textoAntes, textoDespues) {
  if (!textoAntes || !textoDespues || textoAntes === textoDespues) return;

  var abiertas = await Carpetas.subcarpetas(App.E.abiertos);
  var afectados = abiertas.filter(function (c) {
    if (c.nombre.charAt(0) === '_') return false;
    return c.nombre === textoAntes || c.nombre.slice(-(textoAntes.length + 1)) === ' ' + textoAntes;
  });
  if (!afectados.length) return;

  var lista = afectados.map(function (c) { return '<li>' + U.escapar(c.nombre) + '</li>'; }).join('');
  var ok = await U.preguntar('Renombrar las carpetas de sus asuntos abiertos',
    '<p class="explica">Ya tiene Nº de identificación escolar. Se van a renombrar estas ' +
    afectados.length + ' carpetas de asuntos abiertos suyos. Las archivadas no se tocan.</p>' +
    '<ul>' + lista + '</ul>', 'Adelante');
  if (!ok) return;

  await App.cargarRegistro();
  var renombrados = 0;
  for (var i = 0; i < afectados.length; i++) {
    var nombreViejo = afectados[i].nombre;
    var nombreNuevo = nombreViejo.slice(0, nombreViejo.length - textoAntes.length) + textoDespues;
    try {
      if (await Carpetas.existe(App.E.abiertos, nombreNuevo)) continue;   /* ya está así, no se toca */
      await Carpetas.renombrar(App.E.abiertos, nombreViejo, nombreNuevo);
      var antes = App.E.registro.asuntos[nombreViejo] || {};
      App.E.registro.asuntos[nombreNuevo] = Object.assign({}, antes, { tercero: textoDespues });
      delete App.E.registro.asuntos[nombreViejo];
      renombrados++;
    } catch (e) { /* uno que falle no frena a los demás */ }
  }
  if (renombrados) await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
  U.aviso(renombrados + ' carpeta' + (renombrados === 1 ? '' : 's') + ' renombrada' +
    (renombrados === 1 ? '' : 's') + '.', 'bueno');
};

App.editarAsunto = async function (a) {
  var p = App.piezasDelAsunto(a);
  var bloqueCampos = App.pintarCamposEditar(p.tipo, p.campos);

  var hayTipo = App.E.tipos.some(function (t) { return t.tipo === p.tipo; });
  var opciones = '';
  if (p.tipo && !hayTipo) {
    opciones += '<option value="' + U.escapar(p.tipo) + '" selected>' +
                U.escapar(p.tipo) + ' (no está en la lista)</option>';
  }
  Nombres.CATEGORIAS.forEach(function (cat) {
    var deEsta = App.E.tipos.filter(function (t) { return t.categoria === cat; });
    if (!deEsta.length) return;
    opciones += '<optgroup label="' + cat + '">' +
      deEsta.map(function (t) {
        return '<option value="' + U.escapar(t.tipo) + '"' +
               (t.tipo === p.tipo ? ' selected' : '') + '>' + U.escapar(t.tipo) + '</option>';
      }).join('') + '</optgroup>';
  });

  /* Con los campos del tipo de más, el cuadro puede quedarse más alto
     que la pantalla: se deja bajar por dentro, para que el botón de
     Guardar siga alcanzable. */
  var cuadroEditar = document.querySelector('#capa .cuadro');
  if (cuadroEditar) cuadroEditar.classList.add('cuadro-alto');

  var promesa = U.preguntar('Editar el asunto',
    '<p class="explica">Al guardar se le cambia el nombre a la carpeta. ' +
    'Se copia primero y se comprueba que ha llegado todo; si algo fallara, ' +
    'la carpeta se queda como está.</p>' +
    '<div class="dos-columnas">' +
      '<div><label class="etiqueta">Fecha de inicio</label>' +
      '<input id="ed-fecha" type="date" class="campo" value="' + U.escapar(p.fecha) + '"></div>' +
      '<div><label class="etiqueta">Año académico <span class="suave">(opcional)</span></label>' +
      '<input id="ed-curso" class="campo" value="' + U.escapar(p.curso) + '" placeholder="26-27"></div>' +
    '</div>' +
    '<label class="etiqueta">Tipo de asunto</label>' +
    '<select id="ed-tipo" class="campo">' + opciones + '</select>' +
    '<label class="etiqueta">Grupo <span class="suave">(opcional)</span></label>' +
    '<input id="ed-grupo" class="campo" value="' + U.escapar(p.grupo) + '" placeholder="1ºA">' +
    bloqueCampos.html +
    '<label class="etiqueta">Descripción corta <span class="suave">(opcional)</span></label>' +
    '<input id="ed-descripcion" class="campo" value="' + U.escapar(p.descripcion) + '">' +
    '<label class="etiqueta">Tercero</label>' +
    '<input id="ed-tercero" class="campo" value="' + U.escapar(p.tercero) + '">' +
    '<div class="vista-previa">' +
      '<div class="vista-rotulo">Se llamará</div>' +
      '<div id="ed-vista" class="vista-nombre"></div>' +
      '<div class="vista-ruta">Ahora se llama: ' + U.escapar(a.nombre) + '</div>' +
    '</div>', 'Guardar');

  var itemsCampos = bloqueCampos.items;

  function valorEditado(item, i) {
    var el = $('ed-campo-' + i);
    return el ? (el.value || '').trim() : '';
  }
  function enNombreEditado(i) {
    var el = $('ed-campo-' + i + '-en');
    return !!(el && el.checked);
  }

  function camposParaNombre() {
    return itemsCampos
      .map(function (item, i) { return { valor: valorEditado(item, i), enNombre: enNombreEditado(i) }; })
      .filter(function (v) { return v.enNombre && v.valor; })
      .map(function (v) { return v.valor; });
  }

  function piezasDelCuadro() {
    return {
      fecha: $('ed-fecha').value,
      tipo: $('ed-tipo').value,
      curso: $('ed-curso').value.trim(),
      grupo: $('ed-grupo').value.trim(),
      campos: camposParaNombre(),
      descripcion: $('ed-descripcion').value.trim(),
      tercero: $('ed-tercero').value.trim()
    };
  }

  function refrescar() { $('ed-vista').textContent = Nombres.montar(piezasDelCuadro()); }

  ['ed-fecha', 'ed-curso', 'ed-tipo', 'ed-grupo', 'ed-descripcion', 'ed-tercero']
    .forEach(function (id) { $(id).oninput = refrescar; $(id).onchange = refrescar; });
  itemsCampos.forEach(function (item, i) {
    var el = $('ed-campo-' + i);
    var enEl = $('ed-campo-' + i + '-en');
    if (el) { el.oninput = refrescar; el.onchange = refrescar; }
    if (enEl) enEl.onchange = refrescar;
  });
  refrescar();

  var ok = await promesa;
  if (cuadroEditar) cuadroEditar.classList.remove('cuadro-alto');
  if (!ok) return;

  /* Obligatorio quiere decir que el asunto no se guarda sin él, igual
     que al crearlo. */
  for (var i = 0; i < itemsCampos.length; i++) {
    if (itemsCampos[i].cfg.obligatorio && !valorEditado(itemsCampos[i], i)) {
      U.aviso('Hace falta rellenar "' + itemsCampos[i].nombre + '".', 'malo');
      return;
    }
  }

  var d = piezasDelCuadro();
  if (!d.tercero) { U.aviso('Hace falta el tercero: va siempre al final del nombre.', 'malo'); return; }
  var nombreNuevo = Nombres.montar(d);
  if (!nombreNuevo || nombreNuevo.length < 8) { U.aviso('Ese nombre se queda demasiado corto.', 'malo'); return; }

  var camposGuardados = {};
  itemsCampos.forEach(function (item, i) {
    camposGuardados[item.clave] = { valor: valorEditado(item, i), enNombre: enNombreEditado(i) };
  });

  var datos = {
    tipo: d.tipo, categoria: Nombres.categoriaDeTipo(App.E.tipos, d.tipo),
    tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
    campos: camposGuardados,
    editadoEl: U.ahora(), editadoPor: App.E.usuario
  };

  try {
    if (nombreNuevo === a.nombre) {
      await App.anotar(a.nombre, datos);
      await App.verAbiertos();
      U.aviso('Asunto actualizado.', 'bueno');
      return;
    }
    if (await Carpetas.existe(App.E.abiertos, nombreNuevo)) {
      U.aviso('Ya hay otro asunto abierto que se llama así.', 'malo');
      return;
    }
    await Carpetas.renombrar(App.E.abiertos, a.nombre, nombreNuevo);

    /* La ficha viaja con la carpeta: se copia a la clave nueva y se
       borra la vieja, para no dejar dos fichas del mismo asunto. */
    await App.cargarRegistro();
    var antes = App.E.registro.asuntos[a.nombre] || {};
    App.E.registro.asuntos[nombreNuevo] = Object.assign({}, antes, datos);
    delete App.E.registro.asuntos[a.nombre];
    await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);

    await App.verAbiertos();
    U.aviso('Asunto editado. La carpeta ya se llama como querías.', 'bueno');
  } catch (e) {
    U.aviso('No se ha podido editar: ' + e.message, 'malo');
  }
};
