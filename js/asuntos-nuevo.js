/* ============================================================
   asuntos-nuevo.js — la pantalla de crear un asunto.

   Categoría, tipo, tercero y los detalles, con la vista previa del
   nombre que quedará. También el alta de un tercero que todavía no
   está en las listas.
   ============================================================ */

/* El curso académico del campo se sigue calculando solo de la fecha de
   inicio mientras el usuario no lo haya cambiado a mano. */
App.cursoNuevoAuto = '';

App.actualizarCursoNuevo = function () {
  var actual = $('campo-curso').value.trim();
  if (!actual || actual === App.cursoNuevoAuto) {
    App.cursoNuevoAuto = U.cursoDeFecha($('campo-fecha').value);
    $('campo-curso').value = App.cursoNuevoAuto;
  }
};

/* La fecha límite del asunto nuevo se calcula sola: fecha de inicio
   más los días de plazo que el tipo tenga puestos en Ajustes. Se deja
   de calcular en cuanto el usuario la cambia a mano. */
App.limiteNuevoAuto = '';

App.actualizarLimiteNuevo = function () {
  var campo = $('campo-limite');
  var nota = $('nota-limite');
  var dias = App.plazoDeTipo(App.E.nuevo.tipo || '');

  if (campo.value && campo.value !== App.limiteNuevoAuto) {
    /* Puesta a mano: no se toca. */
  } else if (dias) {
    App.limiteNuevoAuto = Plazos.sumarDias($('campo-fecha').value, dias);
    campo.value = App.limiteNuevoAuto;
  } else {
    if (campo.value === App.limiteNuevoAuto) campo.value = '';
    App.limiteNuevoAuto = '';
  }

  if (dias && App.E.nuevo.tipo) {
    nota.textContent = App.E.nuevo.tipo + ' tiene ' + dias +
      ' días de plazo en Ajustes. Puedes cambiar la fecha.';
    nota.classList.remove('oculto');
  } else {
    nota.textContent = '';
    nota.classList.add('oculto');
  }
};

App.prepararNuevo = function () {
  if (!$('campo-fecha').value) $('campo-fecha').value = U.hoyIso();
  App.pintarEstadoNuevo();
  App.actualizarLimiteNuevo();
  App.actualizarCursoNuevo();
  App.pintarPendiente();
  App.pintarCategorias();
  if (App.E.nuevo.categoria) App.pintarTipos();
  App.refrescarVista();
};

/* El estado con el que nace el asunto. Se propone el primero de la
   lista de Ajustes, que es el primer paso del trámite. */
App.pintarEstadoNuevo = function () {
  var sel = $('campo-estado');
  var antes = sel.value;
  sel.innerHTML = '<option value="">Sin estado</option>' +
    App.E.estados.map(function (e) {
      return '<option value="' + U.escapar(e.nombre) + '">' + U.escapar(e.nombre) + '</option>';
    }).join('');
  var primero = App.E.estados.length ? App.E.estados[0].nombre : '';
  sel.value = antes || primero;
  if (sel.selectedIndex === -1) sel.value = primero;

  var via = $('campo-via');
  if (!via.options.length) {
    via.innerHTML = '<option value="">Sin indicar</option>' +
      Nombres.VIAS.map(function (v) {
        return '<option value="' + v.clave + '">' + U.escapar(v.texto) + '</option>';
      }).join('');
  }
};

/* Primero la categoría. Con cuatro botones se llega a los diez tipos
   que hacen falta, en vez de enseñar los cuarenta de golpe. */
App.pintarCategorias = function () {
  var caja = $('categorias-lista');
  caja.innerHTML = '';
  Nombres.CATEGORIAS.forEach(function (cat) {
    var cuantos = App.E.tipos.filter(function (t) { return t.categoria === cat; }).length;
    var b = document.createElement('button');
    b.className = 'categoria-boton' + (App.E.nuevo.categoria === cat ? ' elegido' : '');
    b.setAttribute('data-categoria', cat);
    b.innerHTML = U.escapar(cat) +
      '<small>' + U.escapar(App.DESCRIPCION_CATEGORIA[cat]) + ' · ' + cuantos + ' tipos</small>';
    b.onclick = function () { App.elegirCategoria(cat); };
    caja.appendChild(b);
  });
};

App.elegirCategoria = function (cat) {
  App.E.nuevo.categoria = cat;
  App.E.nuevo.tipo = null;
  App.E.nuevo.tercero = null;
  App.pintarCategorias();
  App.pintarTipos();
  $('bloque-tipos').classList.remove('oculto');
  $('bloque-tercero').classList.add('oculto');
  $('bloque-detalles').classList.add('oculto');
};

App.pintarTipos = function () {
  var caja = $('tipos-lista');
  caja.innerHTML = '';
  var deEsta = App.E.tipos.filter(function (t) { return t.categoria === App.E.nuevo.categoria; });
  if (!deEsta.length) {
    caja.innerHTML = '<div class="vacio">Esta categoría no tiene ningún tipo todavía. ' +
                     'Se añaden en Ajustes.</div>';
    return;
  }
  deEsta.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'tipo-boton' + (App.E.nuevo.tipo === t.tipo ? ' elegido' : '');
    b.textContent = t.tipo;
    b.onclick = function () { App.elegirTipo(t); };
    caja.appendChild(b);
  });
};

App.elegirTipo = function (t) {
  App.E.nuevo.tipo = t.tipo;
  App.E.nuevo.categoria = t.categoria;
  App.E.nuevo.tercero = null;
  App.pintarTipos();
  $('bloque-tercero').classList.remove('oculto');
  $('bloque-detalles').classList.add('oculto');
  $('etiqueta-tercero').textContent = {
    ALUMNADO: 'Alumno o alumna', PERSONAL: 'Persona del centro',
    EMPRESAS: 'Empresa', OTROS: 'Con quién es el asunto'
  }[t.categoria];
  $('buscar-tercero').value = '';
  $('resultados-tercero').innerHTML = '';
  $('tercero-elegido').classList.add('oculto');
  App.actualizarLimiteNuevo();
  $('buscar-tercero').focus();
};

$('ir-a-ajustes').onclick = function () { App.ir('ajustes'); };

App.temporizador = null;
$('buscar-tercero').oninput = function () {
  clearTimeout(App.temporizador);
  App.temporizador = setTimeout(App.buscarTercero, 180);
};

App.buscarTercero = async function () {
  if (!App.E.nuevo.categoria) return;
  var texto = $('buscar-tercero').value;
  var caja = $('resultados-tercero');
  if (U.normalizar(texto).length < 2) { caja.innerHTML = ''; return; }
  caja.innerHTML = '<div class="explica">Buscando…</div>';
  var fuente = await Datos.cargar(App.E.datos, App.E.nuevo.categoria);
  var encontrados = Datos.buscar(fuente.lista, texto, 30);
  caja.innerHTML = '';

  if (!encontrados.length) {
    var vacio = document.createElement('div');
    vacio.className = 'vacio';
    if (App.E.nuevo.categoria === 'ALUMNADO') {
      vacio.innerHTML = (fuente.fichero
        ? 'Nadie con ese nombre en ' + U.escapar(fuente.fichero) + '.'
        : 'Todavía no está el fichero RegAlum.csv en la carpeta _GESTOR/datos.') +
        '<br>Si es un solicitante que aún no se ha matriculado, dale de alta aquí.';
    } else if (App.E.nuevo.categoria === 'PERSONAL') {
      vacio.innerHTML = fuente.fichero
        ? 'Nadie con ese nombre en ' + U.escapar(fuente.fichero) +
          ' ni en las altas a mano.'
        : 'Todavía no hay ningún fichero RelPerCen en la carpeta _GESTOR/datos.';
    } else {
      vacio.textContent = 'No está en la lista todavía.';
    }
    caja.appendChild(vacio);
    caja.appendChild(App.botonAlta(texto));
    return;
  }

  encontrados.forEach(function (p) {
    var d = document.createElement('div');
    d.className = 'resultado';
    d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.fijarTercero(p); };
    caja.appendChild(d);
  });
  caja.appendChild(App.botonAlta(texto));
};

/* Lo que se lee debajo del nombre de un alumno, tanto en el buscador
   del formulario como en la pantalla de Personas. Si ya no está
   matriculado hay que decirlo: es la diferencia entre poner el grupo
   bueno y poner uno de hace tres cursos. */
App.pieAlumno = function (p) {
  if (p.matriculado) {
    return [p.unidad, p.curso, p.id ? 'Nº ' + p.id : ''].filter(Boolean).join('  ·  ');
  }
  if (p.solicitante) {
    return ['Solicitante, todavía sin matricular',
            p.id ? 'Nº ' + p.id : 'sin Nº de identificación escolar'].join('  ·  ');
  }
  var trozos = ['No matriculado este curso'];
  if (p.anoUltima) {
    trozos.push('última matrícula: ' + U.cursoDeAno(p.anoUltima) +
                (p.unidadUltima ? ' ' + p.unidadUltima : ''));
  }
  if (p.id) trozos.push('Nº ' + p.id);
  return trozos.join('  ·  ');
};

/* Lo que se lee debajo del nombre de alguien del centro. Si ya cesó
   hay que decirlo: sus asuntos viejos siguen ahí, pero abrirle uno
   nuevo casi siempre es una equivocación. */
App.piePersona = function (p) {
  var trozos = [];
  if (p.puesto) trozos.push(p.puesto);
  if (!p.enElCentro) {
    var porque = p.fechaCese && p.esteCurso
      ? ' (cesó el ' + p.fechaCese + ')'
      : (p.cursoUltimo ? ' (su último curso aquí: ' + p.cursoUltimo + ')' : '');
    trozos.push('Ya no está en el centro' + porque);
  }
  if (p.documento) trozos.push(p.documento);
  if (!p.deSeneca) trozos.push('alta a mano');
  return trozos.join('  ·  ');
};

App.pieDe = function (p) {
  if (p.categoria === 'ALUMNADO') return App.pieAlumno(p);
  if (p.categoria === 'PERSONAL') return App.piePersona(p);
  return [p.documento, p.nif, p.referencia, p.campos['Puesto'] || ''].filter(Boolean).join('  ·  ');
};

App.botonAlta = function (texto) {
  var b = document.createElement('button');
  b.className = 'boton';
  b.style.marginTop = '6px';
  b.textContent = App.E.nuevo.categoria === 'ALUMNADO'
    ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
  b.onclick = function () { App.altaTercero(App.E.nuevo.categoria, texto); };
  return b;
};

App.fijarTercero = function (p) {
  App.E.nuevo.tercero = p;
  var texto = App.textoTercero(p);
  $('resultados-tercero').innerHTML = '';
  $('buscar-tercero').value = '';
  var caja = $('tercero-elegido');
  caja.className = 'elegido';
  caja.innerHTML = '<div class="elegido-caja"><div><strong>' + U.escapar(texto) + '</strong></div>' +
                   '<button class="boton" id="btn-cambiar-tercero">Cambiar</button></div>';
  caja.classList.remove('oculto');
  $('btn-cambiar-tercero').onclick = function () {
    App.E.nuevo.tercero = null;
    caja.classList.add('oculto');
    $('bloque-detalles').classList.add('oculto');
    $('buscar-tercero').focus();
  };

  /* El grupo solo tiene sentido en el alumnado, y solo en quien sigue
     matriculado este curso. Al que ya no está no se le ofrece. */
  var grupo = (p.categoria === 'ALUMNADO' && p.matriculado)
    ? Nombres.grupoCompacto(p.unidad, p.curso) : '';
  if (grupo) {
    $('grupo-vista').textContent = '(' + grupo + ')';
    $('bloque-grupo').classList.remove('oculto');
  } else {
    $('campo-grupo').checked = false;
    $('bloque-grupo').classList.add('oculto');
  }
  var avisa = (p.categoria === 'ALUMNADO' && !p.matriculado) ||
              (p.categoria === 'PERSONAL' && !p.enElCentro);
  if (avisa) {
    caja.querySelector('.elegido-caja > div').innerHTML +=
      '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
  }

  $('bloque-detalles').classList.remove('oculto');
  App.refrescarVista();
};

App.grupoDelTercero = function () {
  var p = App.E.nuevo.tercero;
  if (!p || p.categoria !== 'ALUMNADO') return '';
  return Nombres.grupoCompacto(p.unidad, p.curso);
};

App.textoTercero = function (p) {
  if (p.categoria === 'ALUMNADO') return Nombres.terceroAlumno(p);
  if (p.categoria === 'PERSONAL') return Nombres.terceroPersonal(p);
  if (p.categoria === 'EMPRESAS') return Nombres.terceroEmpresa({ nombre: p.nombre, nif: p.nif });
  return U.limpiarNombre(p.nombre + (p.referencia ? ' ' + p.referencia : ''));
};

$('campo-fecha').oninput = function () {
  App.actualizarCursoNuevo();
  App.actualizarLimiteNuevo();
  App.refrescarVista();
};
['campo-curso', 'campo-descripcion'].forEach(function (id) {
  $(id).oninput = function () { App.refrescarVista(); };
});
$('campo-grupo').onchange = function () { App.refrescarVista(); };

App.datosDelFormulario = function () {
  return {
    fecha: $('campo-fecha').value,
    tipo: App.E.nuevo.tipo || '',
    curso: $('campo-curso').value.trim(),
    grupo: $('campo-grupo').checked ? App.grupoDelTercero() : '',
    descripcion: $('campo-descripcion').value.trim(),
    tercero: App.E.nuevo.tercero ? App.textoTercero(App.E.nuevo.tercero) : ''
  };
};

App.refrescarVista = function () {
  if (!App.E.nuevo.tipo || !App.E.nuevo.tercero) return;
  var d = App.datosDelFormulario();
  var nombre = Nombres.montar(d);
  $('vista-nombre').textContent = nombre;
  $('vista-ruta').textContent = 'En ' + App.E.abiertos.name +
    '. Al cerrarlo irá a ' + App.E.archivo.name + ' / ' + App.E.nuevo.categoria + ' / ' + d.tercero;
  $('btn-crear').disabled = !nombre || nombre.length < 8;
};

$('btn-crear').onclick = async function () {
  var d = App.datosDelFormulario();
  var nombre = Nombres.montar(d);
  if (!nombre) return;
  try {
    if (await Carpetas.existe(App.E.abiertos, nombre)) {
      U.aviso('Ya hay un asunto abierto con ese mismo nombre.', 'malo');
      return;
    }
    var carpeta = await Carpetas.crear(App.E.abiertos, nombre);
    await App.anotar(nombre, {
      estado: 'abierto', tipo: d.tipo, categoria: App.E.nuevo.categoria,
      tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
      situacion: $('campo-estado').value,
      via: $('campo-via').value,
      viaDato: $('campo-via-dato').value.trim(),
      limite: $('campo-limite').value,
      abiertoEl: U.ahora(), abiertoPor: App.E.usuario
    });

    /* Si el asunto se ha empezado desde un documento suelto, ese
       documento se mete ahora en la carpeta recién creada. */
    var traido = App.E.pendiente;
    if (traido) {
      try {
        await Carpetas.moverFichero(App.E.abiertos, traido.nombre, carpeta);
      } catch (e2) {
        U.aviso('El asunto está creado, pero el documento no ha podido entrar: ' +
                e2.message, 'malo');
        traido = null;
      }
      App.E.pendiente = null;
      App.pintarPendiente();
    }

    U.aviso('Asunto creado.', 'bueno');
    navigator.clipboard.writeText(nombre).catch(function () {});
    App.E.nuevo = { tipo: null, categoria: null, tercero: null };
    $('campo-descripcion').value = '';
    $('campo-estado').value = App.E.estados.length ? App.E.estados[0].nombre : '';
    $('campo-via').value = '';
    $('campo-via-dato').value = '';
    $('campo-limite').value = '';
    App.limiteNuevoAuto = '';
    $('campo-grupo').checked = false;
    $('bloque-tipos').classList.add('oculto');
    $('bloque-grupo').classList.add('oculto');
    $('bloque-tercero').classList.add('oculto');
    $('bloque-detalles').classList.add('oculto');
    await App.verAbiertos();
    App.ir('abiertos');

    /* Con el documento ya dentro, se abre el cuadro de siempre para
       ponerle el nombre que le toca. */
    if (traido) {
      var recien = App.E.listaAbiertos.filter(function (a) { return a.nombre === nombre; })[0];
      if (recien) await App.verDocumentos(recien);
    }
  } catch (e) {
    U.aviso('No he podido crear la carpeta: ' + e.message, 'malo');
  }
};

/* ---------- alta de un tercero que no está en la lista ---------- */

App.altaTercero = async function (categoria, sugerencia) {
  var def = Datos.LISTAS[categoria];
  if (!def) return;
  var campos = def.cabecera.map(function (c, i) {
    return '<label class="etiqueta">' + U.escapar(c) + '</label>' +
           '<input class="campo alta-campo" data-campo="' + U.escapar(c) + '" value="' +
           (i === 0 ? U.escapar(sugerencia || '') : '') + '">';
  }).join('');
  var titulo = categoria === 'ALUMNADO'
    ? 'Dar de alta un solicitante'
    : 'Dar de alta en ' + categoria;
  var aclara = categoria === 'ALUMNADO'
    ? '<p class="explica">Para quien ha pedido plaza y todavía no está ' +
      'matriculado. Si ya tiene Nº de identificación escolar, ponlo: así su ' +
      'carpeta se llamará igual el día que se matricule.</p>'
    : '';
  var ok = await U.preguntar(titulo, aclara + campos, 'Guardar');
  if (!ok) return;
  var valores = {};
  Array.prototype.forEach.call(document.querySelectorAll('.alta-campo'), function (i) {
    valores[i.dataset.campo] = i.value.trim();
  });
  if (!valores[def.cabecera[0]]) { U.aviso('Hace falta al menos el nombre.', 'malo'); return; }
  await Datos.anadirALista(App.E.datos, categoria, valores);
  U.aviso('Dado de alta.', 'bueno');
  $('buscar-tercero').value = valores[def.cabecera[0]];
  App.buscarTercero();
};
