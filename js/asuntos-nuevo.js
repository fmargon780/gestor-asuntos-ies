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

/* El estado en blanco de "Nuevo asunto": una sola forma, para que
   App.prepararNuevo (al entrar) y App.crearAsuntoDelFormulario (al
   terminar, js/asuntos-nuevo-crear.js) dejen siempre exactamente lo
   mismo detrás (fila 220). */
App.nuevoEnBlanco = function () {
  return { tipo: null, categoria: null, tercero: null, terceroPropuesto: null,
           configCampos: [], viaInicial: null, departamento: null,
           numero: '', pidiendoNumero: false, fallaNumero: '',
           tipoEnLinea: false };   /* fila 257: llega con el tipo reconocido → línea «Tipo de asunto: X · Cambiar» */   /* fila 239: el número de asunto previsto */
};

/* Fila 220 (docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md): preparar el
   formulario desde cero cada vez que se entra. App.ir('nuevo') es el
   único camino a esta pantalla (directo, o dentro de
   App.nuevoAsuntoCon/App.crearAsuntoConPropuesta): así que esta es la
   única función que lo prepara, y ninguna entrada puede pintar nada
   por su cuenta ni saltársela.

   Antes de esta fila solo se repintaba, sin limpiar lo que hubiera
   quedado de la visita anterior (tipo, tercero, categoría, campos
   propios, lo escrito a mano): esa era la causa de "unas veces sí y
   otras no" según por dónde se entrara, y a veces de que "Crear el
   asunto" se quedara sin poderse pulsar sin decir por qué (por
   ejemplo, una descripción larga de la vez anterior que, sumada al
   tercero y tipo nuevos, ya no cabía en la ruta de Dropbox).

   App.E.pendiente (el documento suelto que viaja con el asunto que se
   está creando) no se toca aquí a propósito: quien lo trae lo deja
   puesto ANTES de llamar a App.ir('nuevo') (js/documentos-sueltos.js,
   js/asuntos-nuevo-crear.js). */
App.prepararNuevo = function () {
  App.E.nuevoVisita++;
  App.E.nuevo = App.nuevoEnBlanco();
  App.loPideNuevoControles = null;
  App.limiteNuevoAuto = '';
  App.fechaLoPideAuto = '';
  App.cursoNuevoAuto = '';

  $('buscar-tercero').value = '';
  $('resultados-tercero').innerHTML = '';
  $('tercero-elegido').classList.add('oculto');
  $('tercero-elegido').innerHTML = '';
  $('campo-fecha').value = U.hoyIso();
  $('campo-curso').value = '';
  $('campo-descripcion').value = '';
  $('campo-limite').value = '';
  /* Fila 231: pase lo que pase antes (Cancelar, Volver), las tres partes
     fijas del formulario salen siempre a la vista. */
  ['bloque-tercero', 'bloque-tipos', 'bloque-detalles'].forEach(function (id) {
    $(id).classList.remove('oculto');
  });
  $('bloque-campos').classList.add('oculto');
  $('campos-lista-nuevo').innerHTML = '';
  $('lopide-caja-nuevo').innerHTML = '';
  /* El resumen de la guía (js/guias-enganche.js) se engancha por el
     clic de verdad sobre un botón de tipo (delegado en #tipos-lista):
     al repintar la parrilla desde aquí, sin ningún tipo elegido, no
     hay clic que lo repinte solo, así que se deja limpio a mano. */
  var resumenGuia = $('guia-resumen-nuevo');
  if (resumenGuia) { resumenGuia.className = 'guia-resumen oculto'; resumenGuia.textContent = ''; resumenGuia.onclick = null; }
  var cajaGuia = $('guia-nuevo');
  if (cajaGuia) { cajaGuia.className = 'oculto'; cajaGuia.innerHTML = ''; }

  App.actualizarCursoNuevo();
  App.actualizarLimiteNuevo();
  App.pintarPendiente();
  App.pintarCategorias();
  App.pintarTipos();
  App.refrescarVista();
  /* Fila 239: el número del asunto se calcula ya, para que esté cuando se elija la persona y el tipo. */
  if (App.pedirNumeroNuevo) App.pedirNumeroNuevo();
};

/* Fila 197 (docs/NUEVO-ASUNTO-PERSONA-PRIMERO.md): las pastillas de
   categoría ya no eligen antes de nada (los dos bloques, persona y
   tipo, están a la vista los dos a la vez): son solo un filtro del
   buscador único de la izquierda. Pulsar una la enciende o la apaga
   (App.E.nuevo.categoria = esa categoría, o null si estaba encendida);
   ninguna encendida busca en todas.

   Fila 215 (docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md): además del
   buscador, la pastilla filtra también la parrilla de tipos
   (categoriaDeLaParrilla), así que aquí se repinta y se deja el
   cursor en el buscador de personas, justo debajo. */
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
    b.onclick = function () { App.pulsarCategoriaNuevo(cat); };
    caja.appendChild(b);
  });
};

/* Pulsar una pastilla es una decisión explícita de categoría: manda
   siempre sobre la parrilla de tipos (fila 220), aunque ya hubiera una
   persona elegida o propuesta de otra categoría. Antes,
   categoriaDeLaParrilla() daba prioridad al tercero sobre la pastilla:
   con una persona ya elegida, pulsar una pastilla de otra categoría no
   cambiaba nada visible, y parecía que el botón no hacía nada. Ahora
   se olvida, igual que un tipo de otra categoría se olvida al fijar un
   tercero nuevo (App.fijarTercero). */
App.pulsarCategoriaNuevo = function (cat) {
  var nueva = App.E.nuevo.categoria === cat ? null : cat;
  if (nueva) {
    if (App.E.nuevo.tercero && App.E.nuevo.tercero.categoria !== nueva) {
      App.E.nuevo.tercero = null;
      $('tercero-elegido').classList.add('oculto');
      $('tercero-elegido').innerHTML = '';
    }
    if (App.E.nuevo.terceroPropuesto && App.E.nuevo.terceroPropuesto.categoria !== nueva) {
      App.E.nuevo.terceroPropuesto = null;
    }
    if (App.E.nuevo.tipo) {
      var t = App.E.tipos.filter(function (x) { return x.tipo === App.E.nuevo.tipo; })[0];
      if (!t || t.categoria !== nueva) App.E.nuevo.tipo = null;
    }
  }
  App.elegirCategoria(nueva);
  App.pintarTipos();
  App.buscarTercero();
  App.refrescarVista();
  $('buscar-tercero').focus();
};

/* Fija el filtro de categoría del buscador (null = todas) y repinta
   las pastillas. Ya NO toca el tipo ni el tercero elegidos: eso lo
   decide cada camino por su cuenta (elegirTipo, marcarTipoElegido,
   fijarTercero, nuevoAsuntoCon). */
App.elegirCategoria = function (cat) {
  App.E.nuevo.categoria = cat || null;
  App.pintarCategorias();
};

/* «Para: Nombre del tercero» encima de la parrilla, cuando
   App.nuevoAsuntoCon ha llegado con un tercero pero sin tipo (fila 173,
   punto 1): espera a que se elija el tipo para fijarlo. */
function pintarTerceroPropuesto() {
  var caja = $('tercero-propuesto-nuevo');
  if (!caja) return;
  var p = App.E.nuevo.terceroPropuesto;
  if (!p) { caja.classList.add('oculto'); caja.innerHTML = ''; return; }
  caja.classList.remove('oculto');
  caja.innerHTML = '<span>Para: <strong>' + U.escapar(App.textoTercero(p)) +
    '</strong> · Elige el tipo de asunto</span> ' +
    '<button type="button" class="enlace" id="btn-otra-persona-nuevo">Otra persona</button>';
  $('btn-otra-persona-nuevo').onclick = function () {
    App.E.nuevo.terceroPropuesto = null;
    pintarTerceroPropuesto();
  };
}

/* La categoría a la que se limita la parrilla, por este orden (fila
   215): la de la persona elegida; si no, la de la que está propuesta
   y esperando tipo (fila 173); si no, la pastilla pulsada
   (App.E.nuevo.categoria); si no hay nada de eso, null y se ven todos
   los tipos. */
function categoriaDeLaParrilla() {
  if (App.E.nuevo.tercero) return App.E.nuevo.tercero.categoria;
  if (App.E.nuevo.terceroPropuesto) return App.E.nuevo.terceroPropuesto.categoria;
  return App.E.nuevo.categoria || null;
}
App.categoriaDeLaParrilla = categoriaDeLaParrilla;   /* fila 257: js/tipo-en-linea.js */

/* Fila 197: con persona elegida, solo los tipos de su categoría (como
   antes); sin persona, todos, con la categoría de cada uno en pequeño
   (vía `data-categoria`, que css/estilos.css enseña con ::after, sin
   tocar el nombre accesible del botón, que sigue siendo solo el
   tipo). */
App.pintarTipos = function () {
  pintarTerceroPropuesto();
  if (App.pintarLineaDeTipo) App.pintarLineaDeTipo();   /* fila 257: js/tipo-en-linea.js */
  var caja = $('tipos-lista');
  caja.innerHTML = '';
  var categoriaPersona = categoriaDeLaParrilla();
  var deEsta = categoriaPersona
    ? App.E.tipos.filter(function (t) { return t.categoria === categoriaPersona; })
    : App.E.tipos.slice();
  caja.classList.toggle('tipos-todas-categorias', !categoriaPersona);
  if (!deEsta.length) {
    caja.innerHTML = '<div class="vacio">' + (categoriaPersona
      ? 'Esta categoría no tiene ningún tipo todavía. Se añaden en Ajustes.'
      : 'Todavía no hay ningún tipo de asunto. Se añaden en Ajustes.') + '</div>';
    return;
  }
  deEsta.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'tipo-boton' + (App.E.nuevo.tipo === t.tipo ? ' elegido' : '');
    b.setAttribute('data-categoria', t.categoria);
    /* `data-tipo`: el nombre de verdad, sin la categoría, para quien lo
       lea del DOM en vez del estado (js/tipos-buscador.js,
       js/tipos-organo.js, js/guias-enganche.js). `aria-hidden` en la
       etiqueta: el nombre ACCESIBLE del botón (el que usa
       getByRole/exact en las pruebas) sigue siendo solo el tipo,
       aunque se vea también la categoría. */
    b.dataset.tipo = t.tipo;
    b.innerHTML = U.escapar(t.tipo) +
      (categoriaPersona ? '' : ' <small aria-hidden="true">' + U.escapar(t.categoria) + '</small>');
    b.onclick = function () { App.elegirTipo(t); };
    caja.appendChild(b);
  });
};

/* Fila 197: con persona ya elegida, un tipo siempre es de su misma
   categoría (la parrilla solo enseña esos), así que nunca se borra: se
   vuelve a fijar, para que los campos del tipo nuevo se rellenen con
   sus datos (fila 173, docs/NUEVO-ASUNTO-SIN-REPETIR.md, punto 2). Sin
   persona, elegir un tipo deja el buscador de la izquierda filtrado a
   su categoría (el camino «tipo primero»), y si había una persona
   propuesta de su misma categoría (fila 173, punto 1), se aplica. */
App.elegirTipo = function (t) {
  var terceroActual = App.E.nuevo.tercero;
  var propuesto = App.E.nuevo.terceroPropuesto;
  var seAplicaPropuesto = !terceroActual && propuesto && propuesto.categoria === t.categoria;
  App.E.nuevo.tipo = t.tipo;
  App.elegirCategoria(t.categoria);
  App.E.nuevo.terceroPropuesto = null;
  App.pintarTipos();
  App.loPideNuevoControles = null;
  App.E.nuevo.configCampos = [];
  $('bloque-campos').classList.add('oculto');
  $('campos-lista-nuevo').innerHTML = '';
  App.actualizarLimiteNuevo();
  if (terceroActual) {
    App.fijarTercero(terceroActual);
  } else if (seAplicaPropuesto) {
    App.fijarTercero(propuesto);
  } else {
    App.buscarTercero();
    App.refrescarVista();
  }
};

/* Lleva a Nuevo asunto con lo que ya se sabe, sin volver a pedirlo
   (fila 173, docs/NUEVO-ASUNTO-SIN-REPETIR.md, punto 1). Todo opcional:
   - con tipo: lo elige y fija el tercero, sin pulsar Crear.
   - sin tipo: dejа el tercero esperando (App.E.nuevo.terceroPropuesto),
     con la categoría ya elegida, hasta que se elija un tipo.
   - fecha va a «Fecha de inicio»; descripcion, a «Descripción corta».
   - viaInicial ({via, viaDato}), a «Lo pide» (punto 4: los asuntos que
     llegan de la bandeja de correo siguen entrando con «Correo
     electrónico» y la dirección del remitente). */
App.nuevoAsuntoCon = function (opciones) {
  opciones = opciones || {};
  var tercero = opciones.tercero || null;
  var tipoObj = opciones.tipo
    ? App.E.tipos.filter(function (t) { return t.tipo === opciones.tipo; })[0] || null
    : null;
  var categoria = tercero ? tercero.categoria : (tipoObj ? tipoObj.categoria : null);

  App.ir('nuevo');
  App.E.nuevo.viaInicial = opciones.viaInicial || null;
  if (categoria) App.elegirCategoria(categoria);

  if (tipoObj) {
    App.elegirTipo(tipoObj);
    App.E.nuevo.tipoEnLinea = true;   /* fila 257: el tipo ya viene reconocido: una línea con «Cambiar», no la parrilla */
    App.pintarTipos();
    if (tercero) App.fijarTercero(tercero);
  } else if (tercero) {
    App.E.nuevo.terceroPropuesto = tercero;
    App.pintarTipos();
  }

  if (opciones.fecha) $('campo-fecha').value = opciones.fecha;
  App.actualizarCursoNuevo();
  App.actualizarLimiteNuevo();
  if (opciones.descripcion) $('campo-descripcion').value = opciones.descripcion;
  App.refrescarVista();
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
  if (!App.E.nuevo.tercero) App.elegirCategoria(t.categoria);
  App.pintarTipos();
  App.actualizarLimiteNuevo();
  App.refrescarVista();
};

$('ir-a-ajustes').onclick = function () { App.ir('ajustes'); };

App.temporizador = null;
$('buscar-tercero').oninput = function () {
  clearTimeout(App.temporizador);
  App.temporizador = setTimeout(App.buscarTercero, 180);
};

/* Fila 197: el buscador único de "Nuevo asunto" busca en todas las
   categorías a la vez (o solo en la que esté marcada como filtro,
   App.E.nuevo.categoria), mezclando los resultados con su etiqueta de
   categoría a la derecha (css .resultado-categoria). La carga y la
   búsqueda de cada categoría, y el orden de ALUMNADO (matriculados
   antes que antiguos), viven en App.buscarEnCategorias
   (js/asuntos-nuevo-alta.js), para reusar Datos.cargar/Datos.buscar
   sin repetirlos aquí. */
App.buscarTercero = async function () {
  var texto = $('buscar-tercero').value;
  var caja = $('resultados-tercero');
  if (U.normalizar(texto).length < 2) { caja.innerHTML = ''; return; }
  caja.innerHTML = '<div class="explica">Buscando…</div>';

  var filtro = App.E.nuevo.categoria;
  var categorias = filtro ? [filtro] : Nombres.CATEGORIAS.slice();
  var porCategoria = await App.buscarEnCategorias(texto, categorias, filtro ? 30 : 8);
  caja.innerHTML = '';

  var total = 0;
  porCategoria.forEach(function (p) { total += p.resultados.length; });

  if (!total) {
    var vacio = document.createElement('div');
    vacio.className = 'vacio';
    var fuenteUnica = filtro && porCategoria[0] && porCategoria[0].fuente;
    if (filtro === 'ALUMNADO') {
      vacio.innerHTML = (fuenteUnica && fuenteUnica.fichero
        ? 'Nadie con ese nombre en ' + U.escapar(fuenteUnica.fichero) + '.'
        : 'Todavía no está el fichero RegAlum.csv en la carpeta _GESTOR/datos.') +
        '<br>Si es un solicitante que aún no se ha matriculado, dale de alta aquí.';
    } else if (filtro === 'PERSONAL') {
      vacio.innerHTML = fuenteUnica && fuenteUnica.fichero
        ? 'Nadie con ese nombre en ' + U.escapar(fuenteUnica.fichero) +
          ' ni en las altas a mano.'
        : 'Todavía no hay ningún fichero RelPerCen en la carpeta _GESTOR/datos.';
    } else if (filtro === 'TUTORES LEGALES') {
      vacio.textContent = 'Nadie con ese nombre entre los tutores legales del RegAlum.csv. ' +
        'Busca por su nombre, su DNI, su teléfono o su correo.';
    } else if (filtro) {
      vacio.textContent = 'No está en la lista todavía.';
    } else {
      vacio.textContent = 'Nadie con ese nombre en ninguna categoría.';
    }
    caja.appendChild(vacio);
    if (filtro) { if (App.admiteAlta(filtro)) caja.appendChild(App.botonAlta(texto)); }
    else App.botonesAlta(texto).forEach(function (b) { caja.appendChild(b); });
    return;
  }

  function tarjeta(p) {
    var d = document.createElement('div');
    d.className = App.claseDeResultado(p);
    if (p.id) d.dataset.nie = p.id;
    d.innerHTML = '<div>' + U.escapar(p.nombre) +
                  '<span class="resultado-categoria">' + U.escapar(Nombres.textoCategoria(p.categoria, 'lista')) + '</span></div>' +
                  '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
    d.onclick = function () { App.fijarTercero(p); };
    return d;
  }

  porCategoria.forEach(function (p) {
    if (!p.resultados.length) return;
    /* Fila 167: una categoría con su propia lista (Administraciones, agrupada). */
    var propia = App.LISTAS_DE_CATEGORIA && App.LISTAS_DE_CATEGORIA[p.categoria];
    if (propia) propia(caja, { lista: p.resultados }, '', tarjeta);
    else p.resultados.forEach(function (r) { caja.appendChild(tarjeta(r)); });
  });

  if (filtro) { if (App.admiteAlta(filtro)) caja.appendChild(App.botonAlta(texto)); }
  else App.botonesAlta(texto).forEach(function (b) { caja.appendChild(b); });
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
  if (p.categoria === 'TUTORES LEGALES' && window.TutoresLegales) return TutoresLegales.pie(p);
  if (p.categoria === 'ADMINISTRACIONES' && window.Administraciones) return Administraciones.pie(p);
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
