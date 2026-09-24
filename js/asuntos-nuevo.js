/* ============================================================
   asuntos-nuevo.js — la pantalla de crear un asunto.

   Categoría, tipo, tercero y los detalles, con la vista previa del
   nombre que quedará. También el alta de un tercero que todavía no
   está en las listas.

   Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
   cambiar nada de lo que hace. Aquí, la fecha y el curso, categorías,
   tipos y el buscador de terceros; los campos del tipo y el tercero
   elegido, en js/asuntos-nuevo-campos.js; el nombre y crear, en
   js/asuntos-nuevo-crear.js; el alta de un tercero y el buscador
   reutilizable, en js/asuntos-nuevo-alta.js. Se cargan en ese orden.
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

/* La vía de comunicación con la que nace el asunto. Desde la fila 129
   (docs/EL-HITO-ES-EL-ESTADO.md) ya no se elige estado: el estado del
   asunto es su hito actual. El nombre se queda por quien ya lo llama. */
App.pintarEstadoNuevo = function () {
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
  App.loPideNuevoControles = null;
  $('etiqueta-tercero').textContent = {
    ALUMNADO: 'Alumno o alumna', PERSONAL: 'Persona del centro',
    EMPRESAS: 'Empresa', OTROS: 'Con quién es el asunto'
  }[t.categoria];
  $('buscar-tercero').value = '';
  $('resultados-tercero').innerHTML = '';
  $('tercero-elegido').classList.add('oculto');
  App.E.nuevo.configCampos = [];
  $('bloque-campos').classList.add('oculto');
  $('campos-lista-nuevo').innerHTML = '';
  App.actualizarLimiteNuevo();
  $('buscar-tercero').focus();
};

/* Deja un tipo elegido, exactamente como si se hubiera pulsado su
   botón, pero SIN tocar el tercero, los campos ni lo escrito (fila
   128, docs/TIPO-DESDE-EL-ASUNTO.md): lo usa "+ Crear tipo nuevo"
   (js/tipo-al-vuelo.js) al crear un tipo desde el propio buscador, que
   puede llegar con un tercero y unos campos ya rellenos. Si todavía no
   se había elegido tercero, se revela ese bloque igual que
   App.elegirTipo; si ya estaba a la vista, se deja tal cual. */
App.marcarTipoElegido = function (t) {
  App.E.nuevo.tipo = t.tipo;
  App.E.nuevo.categoria = t.categoria;
  App.pintarTipos();
  if ($('bloque-tercero').classList.contains('oculto')) {
    $('bloque-tercero').classList.remove('oculto');
    $('etiqueta-tercero').textContent = {
      ALUMNADO: 'Alumno o alumna', PERSONAL: 'Persona del centro',
      EMPRESAS: 'Empresa', OTROS: 'Con quién es el asunto'
    }[t.categoria];
  }
  App.actualizarLimiteNuevo();
  App.refrescarVista();
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
    d.className = App.claseDeResultado(p);
    if (p.id) d.dataset.nie = p.id;
    d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.fijarTercero(p); };
    caja.appendChild(d);
  });
  caja.appendChild(App.botonAlta(texto));
};

/* La fila de un resultado se marca cuando abrirle un asunto casi
   siempre es una equivocación: el alumno que ya no está matriculado y
   la persona del centro que ya cesó. En una lista de veinte nombres
   parecidos eso se pasa por alto. El color lo pone
   css/tipos-buscador.css. */
App.claseDeResultado = function (p) {
  var fuera = (p.categoria === 'ALUMNADO' && !p.matriculado && !p.solicitante) ||
              (p.categoria === 'PERSONAL' && p.enElCentro === false);
  return 'resultado' + (fuera ? ' resultado-aviso' : '');
};

/* Lo que se lee debajo del nombre de un alumno, tanto en el buscador
   del formulario como en la pantalla de Personas. Si ya no está
   matriculado hay que decirlo: es la diferencia entre poner el grupo
   bueno y poner uno de hace tres cursos.

   El Nº de identificación escolar NO se escribe aquí: al lado sale el
   botón de copiarlo, que ya lo lleva escrito, y salía dos veces
   seguidas. Lo pone js/copiar.js, que lo saca de data-nie. */
App.pieAlumno = function (p) {
  if (p.matriculado) {
    return [p.unidad, p.curso].filter(Boolean).join('  ·  ');
  }
  if (p.solicitante) {
    return ['Solicitante, todavía sin matricular',
            p.id ? '' : 'pendiente de número'].filter(Boolean).join('  ·  ');
  }
  var trozos = ['No matriculado este curso'];
  if (p.anoUltima) {
    trozos.push('última matrícula: ' + U.cursoDeAno(p.anoUltima) +
                (p.unidadUltima ? ' ' + p.unidadUltima : ''));
  }
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
  if (!p.deSeneca) trozos.push('alta a mano');
  var texto = trozos.join('  ·  ');
  if (p.documento) texto += (texto ? '  ·  ' : '') + 'DNI ' + p.documento;
  return texto;
};

/* Lo que se lee debajo del nombre de una empresa. El rótulo del negocio
   va primero: cuando se ha buscado por él, es lo que explica por qué
   sale esa razón social y no otra. */
App.pieEmpresa = function (p) {
  var rotulo = p.comercial || (p.campos && p.campos['Nombre comercial']) || '';
  return [rotulo ? 'Rótulo: ' + rotulo : '', p.nif].filter(Boolean).join('  ·  ');
};

App.pieDe = function (p) {
  if (p.categoria === 'ALUMNADO') return App.pieAlumno(p);
  if (p.categoria === 'PERSONAL') return App.piePersona(p);
  if (p.categoria === 'EMPRESAS') return App.pieEmpresa(p);
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
