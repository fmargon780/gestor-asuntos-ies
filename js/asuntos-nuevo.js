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

/* ---------- los campos del tipo, ya rellenos con el tercero ----------

   Después de elegir el tipo y el tercero sale un bloque "Datos del
   asunto" con los campos que ese tipo tenga puestos en Ajustes
   (js/campos.js), en su mismo orden, ya rellenos con lo que se sepa
   de este tercero: la unidad, el puesto, el curso calculado... Si el
   dato viene vacío -la modalidad de un alumno de la ESO-, el campo
   sale vacío y se puede escribir a mano: no es un error.

   Cada uno lleva al lado su "Añadir al nombre", que nace como esté
   puesto en Ajustes pero se puede cambiar aquí, solo para este asunto. */

App.filaCampoNuevo = function (item) {
  var cfg = item.cfg;
  var fila = document.createElement('div');
  fila.className = 'campo-fila';

  var etiqueta = document.createElement('label');
  etiqueta.className = 'etiqueta';
  etiqueta.textContent = item.nombre + (cfg.obligatorio ? ' *' : '');
  fila.appendChild(etiqueta);

  var entrada;
  if (cfg.origen === 'propio' && cfg.clase === 'lista') {
    entrada = document.createElement('select');
    entrada.className = 'campo';
    entrada.innerHTML = '<option value="">Sin elegir</option>' +
      (cfg.valores || []).map(function (v) {
        return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>';
      }).join('');
  } else {
    entrada = document.createElement('input');
    entrada.className = 'campo';
    entrada.value = item.valorInicial || '';
  }
  entrada.oninput = App.refrescarVista;
  entrada.onchange = App.refrescarVista;
  fila.appendChild(entrada);

  var interruptor = document.createElement('label');
  interruptor.className = 'interruptor interruptor-fila';
  var casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = cfg.enNombre !== false;
  casilla.onchange = App.refrescarVista;
  interruptor.appendChild(casilla);
  var span = document.createElement('span');
  span.textContent = 'Añadir al nombre';
  interruptor.appendChild(span);
  fila.appendChild(interruptor);

  item.entradaEl = entrada;
  item.casillaEl = casilla;
  return fila;
};

/* Se llama al fijar el tercero: hasta entonces no hay de quién sacar
   los valores de partida. Un tipo sin campos puestos en Ajustes se
   comporta exactamente igual que antes de este cambio: el bloque ni
   siquiera se enseña. */
App.pintarCamposDelTipo = function () {
  var caja = $('bloque-campos');
  var contenedor = $('campos-lista-nuevo');
  var tipo = App.E.nuevo.tipo;
  var persona = App.E.nuevo.tercero;
  var lista = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];

  if (!lista.length) {
    caja.classList.add('oculto');
    contenedor.innerHTML = '';
    App.E.nuevo.configCampos = [];
    return;
  }

  caja.classList.remove('oculto');
  contenedor.innerHTML = '';
  App.E.nuevo.configCampos = lista.map(function (cfg) {
    /* `porTipo` no guarda la clase ni los valores de un campo propio
       (solo su id): hay que mirarlos en `propios`, que es donde de
       verdad viven y donde pueden cambiar. Sin esto, un campo propio
       de lista siempre salía como texto libre. */
    var cfgParaPintar = cfg;
    if (cfg.origen === 'propio') {
      var p = Campos.propioDe(cfg.id, App.E.campos);
      if (p) cfgParaPintar = Object.assign({}, cfg, { clase: p.clase, valores: p.valores });
    }
    return {
      cfg: cfgParaPintar,
      clave: Campos.claveDeCampo(cfg),
      nombre: Campos.nombreDeCampo(cfg, App.E.campos),
      valorInicial: Campos.valorInicial(cfg, persona, App.E.campos)
    };
  });
  App.E.nuevo.configCampos.forEach(function (item) {
    contenedor.appendChild(App.filaCampoNuevo(item));
  });

  /* Si el tipo ya trae la unidad o el curso calculado, el interruptor
     viejo de "Añadir el grupo" se esconde: si no, el grupo saldría dos
     veces en el nombre. */
  if (Campos.usaUnidadOCurso(lista, App.E.campos)) {
    $('bloque-grupo').classList.add('oculto');
    $('campo-grupo').checked = false;
  }
};

/* Los valores tal y como están ahora mismo en la pantalla, uno por
   campo configurado. Sirve tanto para la vista previa y la validación
   como para lo que se guarda en la ficha del asunto. */
App.valoresCamposActuales = function () {
  return (App.E.nuevo.configCampos || []).map(function (item) {
    var valor = (item.entradaEl ? item.entradaEl.value : '').trim();
    var enNombre = !!(item.casillaEl && item.casillaEl.checked);
    return { clave: item.clave, nombre: item.nombre, valor: valor,
             enNombre: enNombre, obligatorio: !!item.cfg.obligatorio };
  });
};

/* Antes de crear: si falta un campo obligatorio, no se crea, se dice
   cuál es y se enfoca. */
App.validarCamposObligatorios = function () {
  var items = App.E.nuevo.configCampos || [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.cfg.obligatorio && !(item.entradaEl.value || '').trim()) {
      U.aviso('Hace falta rellenar "' + item.nombre + '".', 'malo');
      item.entradaEl.focus();
      return false;
    }
  }
  return true;
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

  App.pintarCamposDelTipo();
  App.pintarLoPideNuevo(p);

  $('bloque-detalles').classList.remove('oculto');
  App.refrescarVista();
};

/* "Lo pide (opcional)": quién ha pedido esta gestión, por qué vía y en
   qué fecha (17-sep-2026, fila 28, docs/LO-PIDE.md). Toda la lógica de
   los controles vive en js/lo-pide.js; aquí solo se monta, con el
   tercero recién elegido, y se guarda lo que devuelva `leer()` en
   `App.loPideNuevoControles`, para que `App.datosDelFormulario()` lo
   lea. Se repinta cada vez que cambia el tercero. */
App.loPideNuevoControles = null;
App.pintarLoPideNuevo = function (persona) {
  if (!window.LoPide) return;
  App.loPideNuevoControles = LoPide.controles($('lopide-caja-nuevo'), persona, null);
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
  var camposParaNombre = App.valoresCamposActuales()
    .filter(function (v) { return v.enNombre && v.valor; })
    .map(function (v) { return v.valor; });
  var loPide = App.loPideNuevoControles ? App.loPideNuevoControles.leer() : null;
  var d = {
    fecha: $('campo-fecha').value,
    tipo: App.E.nuevo.tipo || '',
    curso: $('campo-curso').value.trim(),
    grupo: $('campo-grupo').checked ? App.grupoDelTercero() : '',
    campos: camposParaNombre,
    descripcion: $('campo-descripcion').value.trim(),
    tercero: App.E.nuevo.tercero ? App.textoTercero(App.E.nuevo.tercero) : ''
  };
  /* Solo se añade la clave si hay nombre: dejarlo todo en blanco es
     válido, y entonces el asunto nace sin `loPide` (docs/LO-PIDE.md, 3). */
  if (loPide && loPide.nombre) d.loPide = loPide;
  return d;
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

/* Las rutas muy largas dan problemas en un Dropbox sincronizado: se
   avisa y se deja decidir, en vez de cortar el nombre a lo tonto. */
App.LARGO_MAXIMO_NOMBRE = 180;

$('btn-crear').onclick = async function () {
  if (!App.validarCamposObligatorios()) return;
  var d = App.datosDelFormulario();
  var nombre = Nombres.montar(d);
  if (!nombre) return;

  if (nombre.length > App.LARGO_MAXIMO_NOMBRE) {
    var seguir = await U.preguntar('El nombre es muy largo',
      '<p>Este nombre tiene ' + nombre.length + ' caracteres:</p>' +
      '<p class="nota">' + U.escapar(nombre) + '</p>' +
      '<p>Las rutas muy largas dan problemas en un Dropbox sincronizado.</p>', 'Crear igual');
    if (!seguir) return;
  }

  try {
    if (await Carpetas.existe(App.E.abiertos, nombre)) {
      U.aviso('Ya hay un asunto abierto con ese mismo nombre.', 'malo');
      return;
    }
    var carpeta = await Carpetas.crear(App.E.abiertos, nombre);

    var camposParaGuardar = {};
    App.valoresCamposActuales().forEach(function (v) {
      camposParaGuardar[v.clave] = { valor: v.valor, enNombre: v.enNombre };
    });

    var datosNuevoAsunto = {
      estado: 'abierto', tipo: d.tipo, categoria: App.E.nuevo.categoria,
      tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
      campos: camposParaGuardar,
      situacion: $('campo-estado').value,
      via: $('campo-via').value,
      viaDato: $('campo-via-dato').value.trim(),
      limite: $('campo-limite').value,
      abiertoEl: U.ahora(), abiertoPor: App.E.usuario
    };
    if (d.loPide) datosNuevoAsunto.loPide = d.loPide;
    await App.anotar(nombre, datosNuevoAsunto);

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
    App.E.nuevo = { tipo: null, categoria: null, tercero: null, configCampos: [] };
    $('campo-descripcion').value = '';
    $('campo-estado').value = App.E.estados.length ? App.E.estados[0].nombre : '';
    $('campo-via').value = '';
    $('campo-via-dato').value = '';
    $('campo-limite').value = '';
    App.limiteNuevoAuto = '';
    $('campo-grupo').checked = false;
    App.loPideNuevoControles = null;
    $('lopide-caja-nuevo').innerHTML = '';
    $('bloque-tipos').classList.add('oculto');
    $('bloque-grupo').classList.add('oculto');
    $('bloque-campos').classList.add('oculto');
    $('campos-lista-nuevo').innerHTML = '';
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

/* Crea un asunto entero de un tirón, reutilizando tal cual el mismo
   camino manual (categoría → tipo → tercero → "Crear"), con el
   documento ya enganchado en App.E.pendiente: lo usa el botón
   "Aceptar" de "Por clasificar" (js/documentos-sueltos-lector.js,
   17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md) para
   la propuesta que ha leído del documento. No se escribe ningún otro
   camino: se llama a los mismos App.elegirCategoria/elegirTipo/
   fijarTercero de siempre y se dispara el mismo botón "Crear", con su
   aviso de duplicado (js/duplicados.js) funcionando exactamente igual. */
App.crearAsuntoConPropuesta = async function (tipo, tercero, documentoSuelto) {
  App.E.pendiente = documentoSuelto;
  delete App.E.reciales[documentoSuelto.nombre];
  App.actualizarTitulo();
  App.ir('nuevo');
  App.elegirCategoria(tipo.categoria);
  App.elegirTipo(tipo);
  App.fijarTercero(tercero);
  await $('btn-crear').onclick();
};

/* ---------- alta de un tercero que no está en la lista ---------- */

/* La aclaración de cada categoría, encima de los campos. */
App.ACLARA_ALTA = {
  ALUMNADO: 'Para quien ha pedido plaza y todavía no está matriculado. Si ya ' +
            'tiene Nº de identificación escolar, ponlo: así su carpeta se ' +
            'llamará igual el día que se matricule.',
  EMPRESAS: 'La razón social es el nombre fiscal, el que viene en las facturas. ' +
            'El nombre comercial es el rótulo del negocio, cuando es distinto: ' +
            'la papelería de un autónomo, por ejemplo. Se podrá buscar por los ' +
            'dos, y en el nombre de la carpeta seguirá yendo la razón social.'
};

/* El cuadro de los datos de un tercero. Lo usan el alta y también el
   botón de cambiarlos de js/archivo-personas.js: los campos son los
   mismos, y así no hay dos cuadros que se puedan quedar distintos.

   `valores` trae lo que ya se sabe; con el cuadro vacío es un alta.
   Devuelve lo escrito, o null si se cancela. */
App.cuadroDeTercero = async function (categoria, valores, titulo, botonar) {
  var def = Datos.LISTAS[categoria];
  if (!def) return null;
  valores = valores || {};
  var campos = def.cabecera.map(function (c) {
    return '<label class="etiqueta">' + U.escapar(c) + '</label>' +
           '<input class="campo alta-campo" data-campo="' + U.escapar(c) + '" value="' +
           U.escapar(valores[c] || '') + '">';
  }).join('');
  var aclara = App.ACLARA_ALTA[categoria]
    ? '<p class="explica">' + U.escapar(App.ACLARA_ALTA[categoria]) + '</p>'
    : '';
  var ok = await U.preguntar(titulo, aclara + campos, botonar || 'Guardar');
  if (!ok) return null;
  var puestos = {};
  Array.prototype.forEach.call(document.querySelectorAll('.alta-campo'), function (i) {
    puestos[i.dataset.campo] = i.value.trim();
  });
  if (!puestos[def.cabecera[0]]) { U.aviso('Hace falta al menos el nombre.', 'malo'); return null; }
  return puestos;
};

App.altaTercero = async function (categoria, sugerencia) {
  var def = Datos.LISTAS[categoria];
  if (!def) return;
  var titulo = categoria === 'ALUMNADO'
    ? 'Dar de alta un solicitante'
    : 'Dar de alta en ' + categoria;
  var deEntrada = {};
  deEntrada[def.cabecera[0]] = sugerencia || '';
  var valores = await App.cuadroDeTercero(categoria, deEntrada, titulo);
  if (!valores) return;
  await Datos.anadirALista(App.E.datos, categoria, valores);
  U.aviso('Dado de alta.', 'bueno');
  $('buscar-tercero').value = valores[def.cabecera[0]];
  App.buscarTercero();
};

/* ---------- el buscador de terceros, reutilizable ----------

   Lo mismo que hay dentro de "Nuevo asunto" (categoría + buscador +
   resultados + alta), pero como una pieza que se puede montar en
   cualquier otra pantalla: js/relacionados.js lo usa para elegir un
   tercero relacionado, sin repetir la lógica de búsqueda.

   `contenedor` es un elemento vacío donde se pinta todo.
   `categoriaInicial` puede venir puesta, o null para empezar sin
   categoría elegida.
   `alElegir(categoria, persona, textoBuscado)` se llama cuando el
   usuario pulsa un resultado (persona no es null) o pide dar de alta
   uno nuevo (persona es null, y textoBuscado trae lo que había
   escrito). El alta de verdad la hace quien llama, con
   App.cuadroDeTercero: así aquí no se abren dos cuadros a la vez.

   `opciones.multiple` (17-sep-2026, fila 21, docs/GRUPOS-DE-PERSONAS.md):
   cada resultado lleva una casilla en vez de pulsarse directamente, y
   abajo sale una barra fija con la cuenta y "Añadir los N señalados".
   Lo señalado no se pierde al cambiar de búsqueda ni de categoría (vive
   en `estado.marcados`, fuera de `buscar()`). En este modo `alElegir`
   se llama UNA VEZ, con la lista de señalados (`{categoria, nombre,
   persona}`), al pulsar ese botón; no hay "dar de alta" aquí, porque no
   tiene sentido en un alta en bloque. Devuelve `{ marcar(lista),
   marcados() }` para que quien llama pueda señalar desde fuera (los
   atajos de alumnado, "meter un grupo entero"): en el modo de siempre
   no devuelve nada, como hasta hoy. */
App.pintarBuscadorDeTercero = function (contenedor, categoriaInicial, alElegir, opciones) {
  var multiple = !!(opciones && opciones.multiple);
  var estado = { categoria: categoriaInicial || null, marcados: {} };
  if (multiple && opciones.marcadosIniciales) {
    opciones.marcadosIniciales.forEach(function (m) {
      estado.marcados[m.categoria + '|' + m.nombre] = m;
    });
    resolverPerdidos(opciones.marcadosIniciales);
  }

  /* Un marcado inicial (los miembros de un grupo al editarlo) puede ya
     no estar en las listas de hoy: alguien se ha ido, o se ha borrado
     a mano. Se marca como "perdido" para que la barra lo diga, sin
     quitarlo de nada (docs/GRUPOS-DE-PERSONAS.md, "Personas que ya no
     están"). Los que traigan `persona` (los atajos de alumnado, ya
     resueltos) no hace falta comprobarlos. */
  async function resolverPerdidos(iniciales) {
    var porCategoria = {};
    iniciales.forEach(function (m) {
      if (m.persona) return;
      if (!porCategoria[m.categoria]) porCategoria[m.categoria] = [];
      porCategoria[m.categoria].push(m);
    });
    for (var categoria in porCategoria) {
      var fuente = null;
      try { fuente = App.E.datos ? await Datos.cargar(App.E.datos, categoria) : null; }
      catch (e) { fuente = null; }
      porCategoria[categoria].forEach(function (m) {
        var clave = m.categoria + '|' + m.nombre;
        var entrada = estado.marcados[clave];
        if (!entrada) return;   /* se ha quitado con la × mientras se leía */
        var encontrado = !!(fuente && fuente.lista.some(function (p) { return App.textoTercero(p) === m.nombre; }));
        if (!encontrado) entrada.perdido = true;
      });
    }
    pintarBarra();
  }

  contenedor.innerHTML =
    '<div class="categorias-mini" id="rel-categorias"></div>' +
    '<div id="rel-buscador" class="oculto">' +
      '<input id="rel-buscar" class="campo" placeholder="Escribe tres letras del nombre">' +
      '<div id="rel-resultados" class="resultados"></div>' +
    '</div>' +
    (multiple ? '<div id="rel-marcados-barra" class="marcados-barra oculto"></div>' : '');

  var cajaCategorias = contenedor.querySelector('#rel-categorias');
  var cajaBuscador = contenedor.querySelector('#rel-buscador');
  var campoBuscar = contenedor.querySelector('#rel-buscar');
  var cajaResultados = contenedor.querySelector('#rel-resultados');
  var cajaBarra = multiple ? contenedor.querySelector('#rel-marcados-barra') : null;

  function listaDeMarcados() {
    return Object.keys(estado.marcados).map(function (k) { return estado.marcados[k]; });
  }

  /* La cuenta, la lista de nombres (cada uno con su × para quitarlo
     sin tener que volver a buscarlo) y el botón de añadir. Un
     marcado puede no salir nunca en ningún resultado de búsqueda —por
     ejemplo, un miembro de un grupo que ya no está en las listas—, así
     que quitarlo desde aquí es la única manera: nunca se pierde ni se
     borra solo. */
  function pintarBarra() {
    if (!multiple) return;
    var lista = listaDeMarcados();
    if (!lista.length) { cajaBarra.className = 'marcados-barra oculto'; cajaBarra.innerHTML = ''; return; }
    cajaBarra.className = 'marcados-barra';
    cajaBarra.innerHTML =
      '<div class="marcados-cabecera">' +
        '<span class="marcados-cuenta">' + lista.length +
          (lista.length === 1 ? ' señalado' : ' señalados') + '</span>' +
        '<button type="button" class="boton boton-principal" id="rel-marcados-anadir">' +
          'Añadir los ' + lista.length + ' señalados</button>' +
      '</div>' +
      '<div class="marcados-lista">' + lista.map(function (m) {
        var clave = m.categoria + '|' + m.nombre;
        return '<span class="marcado-chip' + (m.perdido ? ' marcado-chip-perdido' : '') + '"' +
          (m.perdido ? ' title="Ya no está en las listas: se conserva igual, hasta que lo quites tú"' : '') + '>' +
          U.escapar(m.nombre) +
          '<button type="button" class="marcado-quitar" data-clave="' + U.escapar(clave) + '" ' +
          'title="Quitarlo de lo señalado">×</button></span>';
      }).join('') + '</div>';

    contenedor.querySelector('#rel-marcados-anadir').onclick = function () { alElegir(listaDeMarcados()); };
    Array.prototype.forEach.call(cajaBarra.querySelectorAll('.marcado-quitar'), function (b) {
      var clave = b.dataset.clave;
      b.onclick = function () {
        delete estado.marcados[clave];
        pintarBarra();
        Array.prototype.forEach.call(cajaResultados.querySelectorAll('.resultado-casilla'), function (c) {
          if (c.dataset.clave === clave) c.checked = false;
        });
      };
    });
  }

  function marcar(lista) {
    lista.forEach(function (m) { estado.marcados[m.categoria + '|' + m.nombre] = m; });
    pintarBarra();
    Array.prototype.forEach.call(cajaResultados.querySelectorAll('.resultado-casilla'), function (c) {
      if (estado.marcados[c.dataset.clave] !== undefined) c.checked = true;
    });
  }

  function pintarCategorias() {
    cajaCategorias.innerHTML = '';
    Nombres.CATEGORIAS.forEach(function (cat) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'categoria-mini-boton' + (estado.categoria === cat ? ' elegido' : '');
      b.textContent = cat;
      b.onclick = function () {
        estado.categoria = cat;
        pintarCategorias();
        cajaBuscador.classList.remove('oculto');
        campoBuscar.value = '';
        cajaResultados.innerHTML = '';
        campoBuscar.focus();
        if (opciones && opciones.alCambiarCategoria) opciones.alCambiarCategoria(cat);
      };
      cajaCategorias.appendChild(b);
    });
  }

  var temporizador = null;
  async function buscar() {
    var texto = campoBuscar.value;
    if (U.normalizar(texto).length < 2) { cajaResultados.innerHTML = ''; return; }
    cajaResultados.innerHTML = '<div class="explica">Buscando…</div>';
    var fuente = await Datos.cargar(App.E.datos, estado.categoria);
    var encontrados = Datos.buscar(fuente.lista, texto, 30);
    cajaResultados.innerHTML = '';

    encontrados.forEach(function (p) {
      var d = document.createElement('div');
      var nombre = App.textoTercero(p);

      if (multiple) {
        var clave = estado.categoria + '|' + nombre;
        d.className = App.claseDeResultado(p) + ' resultado-marcable';
        d.innerHTML =
          '<label>' +
            '<input type="checkbox" class="resultado-casilla" data-clave="' + U.escapar(clave) + '"' +
              (estado.marcados[clave] !== undefined ? ' checked' : '') + '>' +
            '<span><div>' + U.escapar(p.nombre) + '</div>' +
            '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div></span>' +
          '</label>';
        d.querySelector('.resultado-casilla').onchange = function (ev) {
          if (ev.target.checked) estado.marcados[clave] = { categoria: estado.categoria, nombre: nombre, persona: p };
          else delete estado.marcados[clave];
          pintarBarra();
        };
      } else {
        d.className = App.claseDeResultado(p);
        d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                      '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
        d.onclick = function () { alElegir(estado.categoria, p, texto); };
      }
      cajaResultados.appendChild(d);
    });

    if (!multiple) {
      var alta = document.createElement('button');
      alta.type = 'button';
      alta.className = 'boton';
      alta.style.marginTop = '6px';
      alta.textContent = estado.categoria === 'ALUMNADO'
        ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
      alta.onclick = function () { alElegir(estado.categoria, null, texto); };
      cajaResultados.appendChild(alta);
    }
  }

  campoBuscar.oninput = function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscar, 180);
  };

  pintarCategorias();
  if (estado.categoria) cajaBuscador.classList.remove('oculto');
  pintarBarra();

  if (multiple) return { marcar: marcar, marcados: listaDeMarcados };
};
