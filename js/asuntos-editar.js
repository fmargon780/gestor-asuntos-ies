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
    descripcion: a.ficha.descripcion || '',
    tercero: a.ficha.tercero || ''
  };
  if (deFicha.tercero && Nombres.montar(deFicha) === a.nombre) return deFicha;

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
    descripcion: '',
    tercero: U.limpiarNombre(resto)
  };
};

App.editarAsunto = async function (a) {
  var p = App.piezasDelAsunto(a);

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
    '<label class="etiqueta">Descripción corta <span class="suave">(opcional)</span></label>' +
    '<input id="ed-descripcion" class="campo" value="' + U.escapar(p.descripcion) + '">' +
    '<label class="etiqueta">Tercero</label>' +
    '<input id="ed-tercero" class="campo" value="' + U.escapar(p.tercero) + '">' +
    '<div class="vista-previa">' +
      '<div class="vista-rotulo">Se llamará</div>' +
      '<div id="ed-vista" class="vista-nombre"></div>' +
      '<div class="vista-ruta">Ahora se llama: ' + U.escapar(a.nombre) + '</div>' +
    '</div>', 'Guardar');

  function piezasDelCuadro() {
    return {
      fecha: $('ed-fecha').value,
      tipo: $('ed-tipo').value,
      curso: $('ed-curso').value.trim(),
      grupo: $('ed-grupo').value.trim(),
      descripcion: $('ed-descripcion').value.trim(),
      tercero: $('ed-tercero').value.trim()
    };
  }

  function refrescar() { $('ed-vista').textContent = Nombres.montar(piezasDelCuadro()); }

  ['ed-fecha', 'ed-curso', 'ed-tipo', 'ed-grupo', 'ed-descripcion', 'ed-tercero']
    .forEach(function (id) { $(id).oninput = refrescar; $(id).onchange = refrescar; });
  refrescar();

  var ok = await promesa;
  if (!ok) return;

  var d = piezasDelCuadro();
  if (!d.tercero) { U.aviso('Hace falta el tercero: va siempre al final del nombre.', 'malo'); return; }
  var nombreNuevo = Nombres.montar(d);
  if (!nombreNuevo || nombreNuevo.length < 8) { U.aviso('Ese nombre se queda demasiado corto.', 'malo'); return; }

  var datos = {
    tipo: d.tipo, categoria: Nombres.categoriaDeTipo(App.E.tipos, d.tipo),
    tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
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
    await Carpetas.guardarJson(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);

    await App.verAbiertos();
    U.aviso('Asunto editado. La carpeta ya se llama como querías.', 'bueno');
  } catch (e) {
    U.aviso('No se ha podido editar: ' + e.message, 'malo');
  }
};
