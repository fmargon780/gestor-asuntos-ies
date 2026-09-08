/* ============================================================
   app.js — la aplicación: pantallas, botones y trabajo.
   ============================================================ */
(function () {

  var E = {
    abiertos: null,      /* carpeta de asuntos abiertos */
    archivo: null,       /* carpeta ARCHIVO */
    gestor: null,        /* _GESTOR, dentro de la de abiertos */
    datos: null,         /* _GESTOR/datos */
    usuario: '',
    tipos: [],
    tiposDocumento: [],
    estados: [],         /* estados de tramitación, compartidos en _GESTOR */
    registro: { asuntos: {} },
    listaAbiertos: [],
    vista: 'departamento',   /* cuál de las tres tarjetas está elegida */
    listaArchivo: [],
    sueltos: [],         /* documentos sueltos en la carpeta de abiertos */
    reciales: {},        /* los que han llegado con la aplicación abierta */
    pendiente: null,     /* el suelto que se va a meter en el asunto que se está creando */
    nuevo: { tipo: null, categoria: null, tercero: null }
  };

  var DESCRIPCION_CATEGORIA = {
    ALUMNADO: 'Alumnos y alumnas',
    PERSONAL: 'Profesorado y personal del centro',
    EMPRESAS: 'Proveedores y empresas',
    OTROS: 'Todo lo demás'
  };

  var CARPETA_GESTOR = '_GESTOR';
  var FICHERO_TIPOS = 'tipos.json';
  var FICHERO_TIPOS_DOC = 'tipos-documento.json';
  var FICHERO_ASUNTOS = 'asuntos.json';
  var FICHERO_ESTADOS = 'estados.json';

  var TITULO = 'Gestor de Asuntos';
  var SEGUNDOS_ENTRE_MIRADAS = 20;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  async function arrancar() {
    if (!Carpetas.soportado()) {
      $('aviso-navegador').classList.remove('oculto');
      $('paso-carpetas').classList.add('oculto');
      return;
    }
    var a = await Almacen.leer('abiertos');
    var b = await Almacen.leer('archivo');
    var u = await Almacen.leer('usuario');
    if (a) { E.abiertos = a; marcarCarpeta('estado-abiertos', a.name); }
    if (b) { E.archivo = b; marcarCarpeta('estado-archivo', b.name); }
    if (u) { E.usuario = u; $('campo-usuario').value = u; }
    revisarArranque();
  }

  function marcarCarpeta(id, nombre) {
    var d = $(id);
    d.textContent = nombre;
    d.classList.add('puesta');
  }

  function revisarArranque() {
    $('btn-entrar').disabled = !(E.abiertos && E.archivo);
  }

  /* Si el usuario cierra el cuadro de elegir carpeta, el navegador devuelve
     AbortError y no hay nada que decir. Cualquier otro fallo sí se cuenta:
     callarlo dejaría el botón de Entrar apagado sin explicación. */
  async function pedirCarpeta(cual, idCuadro, idEstado) {
    try {
      var h = await Carpetas.elegir(idCuadro);
      E[cual] = h;
      marcarCarpeta(idEstado, h.name);
      revisarArranque();
      await Almacen.guardar(cual, h);
    } catch (e) {
      if (e.name === 'AbortError') return;
      U.aviso('No he podido usar esa carpeta: ' + e.message, 'malo');
    }
  }

  $('btn-abiertos').onclick = function () {
    pedirCarpeta('abiertos', 'gestor-abiertos', 'estado-abiertos');
  };

  $('btn-archivo').onclick = function () {
    pedirCarpeta('archivo', 'gestor-archivo', 'estado-archivo');
  };

  $('btn-entrar').onclick = async function () {
    try {
      var ok1 = await Carpetas.permiso(E.abiertos, true);
      var ok2 = await Carpetas.permiso(E.archivo, true);
      if (!ok1 || !ok2) {
        U.aviso('Sin permiso sobre alguna de las dos carpetas. Vuelve a elegirla.', 'malo');
        return;
      }
      E.usuario = $('campo-usuario').value.trim();
      await Almacen.guardar('usuario', E.usuario);

      E.gestor = await Carpetas.crear(E.abiertos, CARPETA_GESTOR);
      E.datos = await Carpetas.crear(E.gestor, 'datos');
      await cargarTipos();
      await cargarTiposDocumento();
      await cargarEstados();
      await cargarRegistro();

      Documentos.configurar({
        tipos: function () { return E.tiposDocumento; },
        curso: function (fecha) { return U.cursoDeFecha(fecha); }
      });

      $('arranque').classList.add('oculto');
      $('aplicacion').classList.remove('oculto');
      $('usuario-pie').textContent = E.usuario ? 'Sesión de ' + E.usuario : '';
      E.vista = vistaGuardada();
      await verAbiertos();
      irVista(E.vista);
      vigilarLaCarpeta();
    } catch (e) {
      U.aviso('No he podido entrar: ' + e.message, 'malo');
    }
  };

  /* ==========================================================
     CONFIGURACIÓN COMPARTIDA (_GESTOR)
     ========================================================== */

  async function cargarTipos() {
    var t = await Carpetas.leerJson(E.gestor, FICHERO_TIPOS);
    if (!t || !t.length) {
      t = Nombres.POR_DEFECTO.slice();
      await Carpetas.guardarJson(E.gestor, FICHERO_TIPOS, t);
    }
    E.tipos = t;
  }

  async function cargarTiposDocumento() {
    var t = await Carpetas.leerJson(E.gestor, FICHERO_TIPOS_DOC);
    if (!t || !t.length) {
      t = Nombres.TIPOS_DOCUMENTO_POR_DEFECTO.slice();
      await Carpetas.guardarJson(E.gestor, FICHERO_TIPOS_DOC, t);
    }
    E.tiposDocumento = t;
  }

  async function guardarTiposDocumento() {
    E.tiposDocumento.sort();
    await Carpetas.guardarJson(E.gestor, FICHERO_TIPOS_DOC, E.tiposDocumento);
  }

  /* Los estados de tramitación. Se guardan en el orden en que los pone
     el usuario, que es el orden del trámite: no se ordenan solos.

     Cada estado es { nombre, espera }. Las primeras versiones guardaban
     solo el nombre, así que aquí se admiten las dos formas y el fichero
     se deja ya con la nueva. */
  function normalizarEstados(lista) {
    var deFabrica = {};
    Nombres.ESTADOS_POR_DEFECTO.forEach(function (e) { deFabrica[e.nombre] = e.espera; });
    return (lista || []).map(function (e) {
      if (typeof e === 'string') return { nombre: e, espera: !!deFabrica[e] };
      return { nombre: String((e && e.nombre) || ''), espera: !!(e && e.espera) };
    }).filter(function (e) { return e.nombre; });
  }

  async function cargarEstados() {
    var leido = await Carpetas.leerJson(E.gestor, FICHERO_ESTADOS);
    var eraTexto = !!(leido && leido.length && typeof leido[0] === 'string');
    var e = normalizarEstados(leido);
    if (!e.length) e = Nombres.ESTADOS_POR_DEFECTO.map(function (x) {
      return { nombre: x.nombre, espera: x.espera };
    });
    E.estados = e;
    if (!leido || !leido.length || eraTexto) await guardarEstados();
  }

  /* El sitio que ocupa un estado en la lista, y si es de los que
     significan "esto ya no depende de nosotros". */
  function posDeEstado(nombre) {
    for (var i = 0; i < E.estados.length; i++) {
      if (E.estados[i].nombre === nombre) return i;
    }
    return -1;
  }

  function esDeEspera(nombre) {
    var i = posDeEstado(nombre);
    return i !== -1 && !!E.estados[i].espera;
  }

  async function guardarEstados() {
    await Carpetas.guardarJson(E.gestor, FICHERO_ESTADOS, E.estados);
  }

  async function guardarTipos() {
    E.tipos.sort(function (a, b) {
      var ka = a.categoria + ' ' + a.tipo, kb = b.categoria + ' ' + b.tipo;
      return ka < kb ? -1 : (ka > kb ? 1 : 0);
    });
    await Carpetas.guardarJson(E.gestor, FICHERO_TIPOS, E.tipos);
  }

  async function cargarRegistro() {
    var r = await Carpetas.leerJson(E.gestor, FICHERO_ASUNTOS);
    E.registro = (r && r.asuntos) ? r : { asuntos: {} };
  }

  /* Se relee antes de escribir, por si el compañero ha tocado algo
     desde el otro ordenador mientras tanto. */
  async function anotar(clave, datos) {
    await cargarRegistro();
    var antes = E.registro.asuntos[clave] || {};
    E.registro.asuntos[clave] = Object.assign(antes, datos);
    await Carpetas.guardarJson(E.gestor, FICHERO_ASUNTOS, E.registro);
    refrescarFichas();
  }

  /* Al releer el registro, las tarjetas ya pintadas se quedan con la
     ficha vieja. Aquí se les vuelve a enganchar la buena. */
  function refrescarFichas() {
    E.listaAbiertos.forEach(function (a) { a.ficha = E.registro.asuntos[a.nombre] || {}; });
    E.listaArchivo.forEach(function (a) { a.ficha = E.registro.asuntos[a.nombre] || {}; });
  }

  /* ==========================================================
     NAVEGACIÓN
     ========================================================== */

  var PANTALLAS = ['abiertos', 'nuevo', 'archivo', 'personas', 'ajustes'];

  Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
    b.onclick = function () { ir(b.dataset.pantalla); };
  });

  function ir(cual) {
    PANTALLAS.forEach(function (p) {
      $('pantalla-' + p).classList.toggle('oculto', p !== cual);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.pestana'), function (b) {
      b.classList.toggle('activa', b.dataset.pantalla === cual);
    });
    if (cual === 'nuevo') prepararNuevo();
    if (cual === 'ajustes') pintarAjustes();
    if (cual === 'personas') pintarPersonas();
  }

  /* ==========================================================
     PANTALLA: ASUNTOS ABIERTOS
     ========================================================== */

  /* Se lee la carpeta entera de una vez: las carpetas son los asuntos,
     y los ficheros sueltos son trabajo que todavía no tiene carpeta. */
  async function verAbiertos(yaLeido) {
    var hay = yaLeido || await Carpetas.contenido(E.abiertos);

    E.listaAbiertos = hay.carpetas
      .filter(function (c) { return c.nombre.charAt(0) !== '_'; })
      .map(function (c) {
        var leido = Nombres.leer(c.nombre, E.tipos);
        var ficha = E.registro.asuntos[c.nombre] || {};
        return { nombre: c.nombre, handle: c.handle, leido: leido, ficha: ficha,
                 busca: U.normalizar(c.nombre) };
      });

    E.sueltos = hay.ficheros.filter(function (f) { return esDocumentoDeTrabajo(f.nombre); });

    /* Un documento que ya se ha metido en su carpeta deja de estar recién
       llegado: se quita del contador de la pestaña del navegador. */
    Object.keys(E.reciales).forEach(function (n) {
      var sigue = E.sueltos.some(function (f) { return f.nombre === n; });
      if (!sigue) delete E.reciales[n];
    });
    actualizarTitulo();

    $('cuenta-abiertos').textContent = E.listaAbiertos.length || '';
    pintarFiltroEstado();
    pintarCuentas();
    pintarAbiertos();
    await pintarSueltos();
  }

  /* Windows y Dropbox dejan por ahí ficheros suyos que no son trabajo
     de nadie, y Word deja los temporales que empiezan por ~$. */
  var FICHEROS_DEL_SISTEMA = ['desktop.ini', 'thumbs.db', '.ds_store', 'icon\r'];

  function esDocumentoDeTrabajo(nombre) {
    var n = String(nombre || '');
    if (!n) return false;
    if (n.charAt(0) === '.' || n.charAt(0) === '_') return false;
    if (n.indexOf('~$') === 0) return false;
    if (FICHEROS_DEL_SISTEMA.indexOf(n.toLowerCase()) !== -1) return false;
    return true;
  }

  /* Cómo se ordenan los asuntos abiertos.

     Por defecto, del más antiguo al más reciente: lo que lleva más
     tiempo abierto es lo que hay que mirar primero. El orden elegido se
     recuerda en este ordenador. */
  var ORDENES = {
    'fecha-asc':  function (a, b) { return clave(a.leido.fecha) < clave(b.leido.fecha) ? -1 : 1; },
    'fecha-desc': function (a, b) { return clave(a.leido.fecha) > clave(b.leido.fecha) ? -1 : 1; },
    'tipo':       function (a, b) { return texto(a, 'tipo') < texto(b, 'tipo') ? -1 : 1; },
    'tercero':    function (a, b) { return texto(a, 'tercero') < texto(b, 'tercero') ? -1 : 1; },
    'estado':     function (a, b) {
      var d = posEstado(a) - posEstado(b);
      if (d) return d;
      return clave(a.leido.fecha) < clave(b.leido.fecha) ? -1 : 1;
    }
  };

  /* El sitio que ocupa el estado del asunto en la lista de Ajustes.
     Los que no tienen estado, o tienen uno que ya se quitó, al final. */
  function posEstado(a) {
    var i = posDeEstado(a.ficha.situacion || '');
    return i === -1 ? 9999 : i;
  }

  /* Un asunto sin fecha en el nombre se va al final en los dos sentidos. */
  function clave(fecha) {
    return /^\d{6}$/.test(fecha) ? fecha : '999999';
  }

  function texto(a, cual) {
    if (cual === 'tipo') return U.normalizar(a.leido.tipo || 'zzz');
    return U.normalizar(a.ficha.tercero || a.leido.resto || 'zzz');
  }

  /* Cada estado se pinta de un color, según el sitio que ocupa en la
     lista. Hay seis colores y se van repitiendo. */
  function colorEstado(situacion) {
    var i = posDeEstado(situacion);
    return 'estado-' + (i === -1 ? 'x' : (i % 6));
  }

  function nombreVia(clave) {
    var v = Nombres.via(clave);
    return v ? v.texto : (clave || '');
  }

  /* "Teléfono: 600 11 22 33", para el pie de la tarjeta. */
  function textoVia(ficha) {
    if (!ficha || !ficha.via) return '';
    var n = nombreVia(ficha.via);
    return ficha.viaDato ? n + ': ' + ficha.viaDato : n;
  }

  /* Guarda el estado que se acaba de elegir en el desplegable. */
  async function ponerEstado(a, situacion) {
    try {
      await anotar(a.nombre, {
        situacion: situacion,
        situacionEl: U.ahora(),
        situacionPor: E.usuario
      });
      pintarAbiertos();
    } catch (e) {
      U.aviso('No he podido guardar el estado: ' + e.message, 'malo');
    }
  }

  /* Cuadro para apuntar por dónde prefiere hablar el tercero EN ESTE
     asunto. Se guarda en la carpeta del centro, así que lo ve todo el
     que abra la aplicación sobre ella. */
  async function editarVia(a) {
    var actual = a.ficha.via || '';
    var opciones = '<option value="">Sin indicar</option>' +
      Nombres.VIAS.map(function (v) {
        return '<option value="' + v.clave + '"' + (v.clave === actual ? ' selected' : '') +
               '>' + U.escapar(v.texto) + '</option>';
      }).join('');

    var ok = await U.preguntar('Vía de comunicación preferente',
      '<p class="explica">Es solo de este asunto. Los datos de siempre de la persona ' +
      'están en su ficha; aquí va lo que haya dicho para esta gestión.</p>' +
      '<label class="etiqueta">Por dónde prefiere que le hablemos</label>' +
      '<select id="via-clave" class="campo">' + opciones + '</select>' +
      '<label class="etiqueta">Teléfono, correo o aclaración <span class="suave">(opcional)</span></label>' +
      '<input id="via-dato" class="campo" value="' + U.escapar(a.ficha.viaDato || '') + '" ' +
      'placeholder="Por ejemplo: 600 11 22 33">',
      'Guardar');
    if (!ok) return;

    try {
      await anotar(a.nombre, {
        via: $('via-clave').value,
        viaDato: $('via-dato').value.trim(),
        viaEl: U.ahora(),
        viaPor: E.usuario
      });
      pintarAbiertos();
      pintarArchivo();
      U.aviso('Vía de comunicación guardada.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarla: ' + e.message, 'malo');
    }
  }

  /* ---------- editar un asunto ya creado ----------

     Cambiar la fecha, el tipo, el año, el grupo, la descripción o el
     tercero quiere decir cambiarle el nombre a la carpeta, porque el
     nombre ES la ficha del asunto. Solo se hace en los asuntos abiertos:
     el nombre de una carpeta archivada es el rastro de aquel día. */

  /* Saca las piezas del asunto para rellenar el cuadro.

     Si el asunto lo creó la aplicación, sus piezas están en la ficha, y
     se usan tal cual siempre que vuelvan a montar el nombre que tiene la
     carpeta hoy. Si no cuadran, o si la carpeta se creó a mano, se leen
     del propio nombre: el año académico y el grupo se reconocen por su
     forma, y todo lo demás se deja en el tercero, para no partir por la
     mitad algo que no se sabe partir. */
  function piezasDelAsunto(a) {
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
  }

  async function editarAsunto(a) {
    var p = piezasDelAsunto(a);

    var hayTipo = E.tipos.some(function (t) { return t.tipo === p.tipo; });
    var opciones = '';
    if (p.tipo && !hayTipo) {
      opciones += '<option value="' + U.escapar(p.tipo) + '" selected>' +
                  U.escapar(p.tipo) + ' (no está en la lista)</option>';
    }
    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = E.tipos.filter(function (t) { return t.categoria === cat; });
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
      tipo: d.tipo, categoria: Nombres.categoriaDeTipo(E.tipos, d.tipo),
      tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
      editadoEl: U.ahora(), editadoPor: E.usuario
    };

    try {
      if (nombreNuevo === a.nombre) {
        await anotar(a.nombre, datos);
        await verAbiertos();
        U.aviso('Asunto actualizado.', 'bueno');
        return;
      }
      if (await Carpetas.existe(E.abiertos, nombreNuevo)) {
        U.aviso('Ya hay otro asunto abierto que se llama así.', 'malo');
        return;
      }
      await Carpetas.renombrar(E.abiertos, a.nombre, nombreNuevo);

      /* La ficha viaja con la carpeta: se copia a la clave nueva y se
         borra la vieja, para no dejar dos fichas del mismo asunto. */
      await cargarRegistro();
      var antes = E.registro.asuntos[a.nombre] || {};
      E.registro.asuntos[nombreNuevo] = Object.assign({}, antes, datos);
      delete E.registro.asuntos[a.nombre];
      await Carpetas.guardarJson(E.gestor, FICHERO_ASUNTOS, E.registro);

      await verAbiertos();
      U.aviso('Asunto editado. La carpeta ya se llama como querías.', 'bueno');
    } catch (e) {
      U.aviso('No se ha podido editar: ' + e.message, 'malo');
    }
  }

  /* ---------- las tres tarjetas de arriba ----------

     El trabajo de la pantalla se reparte en tres montones, según dónde
     esté ahora mismo: papeles que aún no son un asunto, asuntos que nos
     toca mover, y asuntos que dependen de que conteste otro. Se ve un
     montón cada vez, para no mezclarlos. */

  var VISTAS = ['clasificar', 'departamento', 'espera'];
  var DIAS_DE_AVISO = 15;

  function vistaGuardada() {
    var v = '';
    try { v = window.localStorage.getItem('vista-abiertos') || ''; } catch (e) {}
    return VISTAS.indexOf(v) !== -1 ? v : 'departamento';
  }

  function irVista(cual) {
    E.vista = VISTAS.indexOf(cual) !== -1 ? cual : 'departamento';
    try { window.localStorage.setItem('vista-abiertos', E.vista); } catch (e) {}

    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
      b.classList.toggle('activo', b.dataset.vista === E.vista);
    });
    var esClasificar = E.vista === 'clasificar';
    $('zona-clasificar').classList.toggle('oculto', !esClasificar);
    $('zona-asuntos').classList.toggle('oculto', esClasificar);
    /* Ordenar y filtrar por estado solo tiene sentido con asuntos. */
    $('filtro-estado').parentNode.querySelectorAll('#filtro-estado, #orden-abiertos')
      .forEach(function (el) { el.classList.toggle('oculto', esClasificar); });
    Array.prototype.forEach.call(document.querySelectorAll('.etiqueta-en-linea'), function (el) {
      el.classList.toggle('oculto', esClasificar);
    });

    pintarAbiertos();
    pintarSueltos();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
    b.onclick = function () { irVista(b.dataset.vista); };
  });

  /* Cuántos días lleva un asunto en el estado que tiene puesto. */
  function diasEnEstado(a) {
    var d = new Date(a.ficha.situacionEl || a.ficha.abiertoEl || '');
    if (isNaN(d.getTime())) return -1;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }

  function deLaVista(a, vista) {
    if (vista === 'espera') return esDeEspera(a.ficha.situacion || '');
    return !esDeEspera(a.ficha.situacion || '');
  }

  function pintarCuentas() {
    var enEspera = E.listaAbiertos.filter(function (a) { return deLaVista(a, 'espera'); });
    $('cuenta-clasificar').textContent = E.sueltos.length;
    $('cuenta-departamento').textContent = E.listaAbiertos.length - enEspera.length;
    $('cuenta-espera').textContent = enEspera.length;

    var viejo = enEspera.some(function (a) { return diasEnEstado(a) >= DIAS_DE_AVISO; });
    $('cuenta-espera').classList.toggle('cuenta-roja', viejo);
    $('cuenta-clasificar').classList.toggle('cuenta-ambar', E.sueltos.length > 0);
  }

  /* El desplegable de arriba que deja ver solo los asuntos que están en
     un estado. Se rehace cada vez porque la lista de estados se puede
     cambiar en Ajustes. */
  function pintarFiltroEstado() {
    var sel = $('filtro-estado');
    var antes = sel.value;
    sel.innerHTML = '<option value="">Todos los estados</option>' +
      '<option value="__sin__">Sin estado</option>' +
      E.estados.map(function (e) {
        return '<option value="' + U.escapar(e.nombre) + '">' + U.escapar(e.nombre) + '</option>';
      }).join('');
    sel.value = antes;
    if (sel.selectedIndex === -1) sel.value = '';
  }

  function ordenElegido() {
    var v = '';
    try { v = window.localStorage.getItem('orden-abiertos') || ''; } catch (e) {}
    return ORDENES[v] ? v : 'fecha-asc';
  }

  function pintarAbiertos() {
    pintarCuentas();
    var q = U.normalizar($('buscar-abiertos').value);
    var rotulo = $('cuenta-lista-abiertos');
    var orden = ordenElegido();
    $('orden-abiertos').value = orden;
    var filtro = $('filtro-estado').value;
    var lista = E.listaAbiertos.filter(function (a) {
      if (!deLaVista(a, E.vista)) return false;
      if (q && a.busca.indexOf(q) === -1) return false;
      if (filtro === '__sin__') return !a.ficha.situacion;
      if (filtro) return a.ficha.situacion === filtro;
      return true;
    });
    lista.sort(ORDENES[orden]);
    if (rotulo) rotulo.textContent = lista.length;
    var caja = $('lista-abiertos');
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">' + textoVacio() + '</div>';
      return;
    }
    lista.forEach(function (a) { caja.appendChild(tarjetaAsunto(a, 'abierto')); });
  }

  /* Dos dibujos para que se vea de un golpe qué es cada fila:
     una carpeta para los asuntos, una hoja para los documentos sueltos. */
  var ICONO_CARPETA =
    '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.6h8.8A1.5 1.5 0 0 1 21 9.1v9A1.5 1.5 0 0 1 19.5 19.6h-15A1.5 1.5 0 0 1 3 18.1z"/></svg>';

  var ICONO_DOCUMENTO =
    '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M13.8 3H7A1.5 1.5 0 0 0 5.5 4.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.7z"/>' +
    '<path d="M13.8 3v4.7h4.7"/></svg>';

  function textoVacio() {
    if (!E.listaAbiertos.length) return 'No hay asuntos abiertos. Crea el primero en "Nuevo asunto".';
    if ($('buscar-abiertos').value.trim() || $('filtro-estado').value) {
      return 'Ningún asunto coincide con lo que buscas.';
    }
    if (E.vista === 'espera') return 'No hay nada esperando a terceros. Mejor así.';
    return 'Nada pendiente de gestionar aquí ahora mismo.';
  }

  function tarjetaAsunto(a, modo) {
    var div = document.createElement('div');
    div.className = 'tarjeta tarjeta-asunto';
    var tercero = a.ficha.tercero || '';
    var situacion = a.ficha.situacion || '';
    var via = textoVia(a.ficha);
    var pie = [];
    if (a.leido.fecha) pie.push('Abierto el ' + U.fechaLegible(a.leido.fecha));
    if (tercero) pie.push(tercero);
    else if (a.leido.resto) pie.push(a.leido.resto);
    if (via) pie.push(via);
    if (modo === 'archivado' && a.ruta) pie.push(a.ruta);

    var dias = (modo === 'abierto' && esDeEspera(situacion)) ? diasEnEstado(a) : -1;
    var esperaLarga = dias >= DIAS_DE_AVISO;
    if (dias === 0) pie.push('en espera desde hoy');
    else if (dias === 1) pie.push('en espera desde ayer');
    else if (dias > 1) pie.push('en espera desde hace ' + dias + ' días');

    div.innerHTML = ICONO_CARPETA +
      '<div class="tarjeta-texto">' +
        '<div class="tarjeta-nombre">' +
          (a.leido.tipo ? '<span class="marca-tipo">' + U.escapar(a.leido.tipo) + '</span>' : '') +
          (situacion ? '<span class="marca-estado ' + colorEstado(situacion) + '">' +
                       U.escapar(situacion) + '</span>' : '') +
          U.escapar(a.nombre) +
        '</div>' +
        '<div class="tarjeta-pie' + (esperaLarga ? ' pie-aviso' : '') + '">' +
          U.escapar(pie.join('  ·  ')) + '</div>' +
      '</div>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';

    /* En los asuntos abiertos, el estado se cambia aquí mismo y la vía
       de comunicación se apunta con el botón de al lado. En el archivo
       no: allí lo que hay es el rastro de lo que se hizo. */
    if (modo === 'abierto') {
      var sel = document.createElement('select');
      sel.className = 'campo campo-estado';
      sel.title = 'Estado del asunto';
      var lista = E.estados.map(function (e) { return e.nombre; });
      if (situacion && lista.indexOf(situacion) === -1) lista.push(situacion);
      sel.innerHTML = '<option value="">Sin estado</option>' +
        lista.map(function (e) {
          return '<option value="' + U.escapar(e) + '"' + (e === situacion ? ' selected' : '') +
                 '>' + U.escapar(e) + '</option>';
        }).join('');
      sel.onchange = function () { ponerEstado(a, sel.value); };
      acciones.appendChild(sel);

      var bvia = document.createElement('button');
      bvia.className = 'boton' + (a.ficha.via ? ' boton-marcado' : '');
      var v = Nombres.via(a.ficha.via);
      bvia.textContent = v ? v.corto : (a.ficha.via || 'Vía');
      bvia.title = via || 'Apuntar la vía de comunicación preferente';
      bvia.onclick = function () { editarVia(a); };
      acciones.appendChild(bvia);

      var editar = document.createElement('button');
      editar.className = 'boton';
      editar.textContent = 'Editar';
      editar.title = 'Cambiar la fecha, el tipo, la descripción o el tercero';
      editar.onclick = function () { editarAsunto(a); };
      acciones.appendChild(editar);
    }

    var copiar = document.createElement('button');
    copiar.className = 'boton';
    copiar.textContent = 'Copiar nombre';
    copiar.title = 'Para pegarlo como asunto del correo';
    copiar.onclick = function () {
      navigator.clipboard.writeText(a.nombre).then(function () {
        U.aviso('Nombre copiado.', 'bueno');
      });
    };
    acciones.appendChild(copiar);

    var ver = document.createElement('button');
    ver.className = 'boton';
    ver.textContent = 'Documentos';
    ver.onclick = function () { verDocumentos(a); };
    acciones.appendChild(ver);

    var principal = document.createElement('button');
    principal.className = 'boton boton-principal';
    principal.textContent = modo === 'abierto' ? 'Cerrar' : 'Reabrir';
    principal.onclick = function () {
      if (modo === 'abierto') cerrarAsunto(a); else reabrirAsunto(a);
    };
    acciones.appendChild(principal);

    div.appendChild(acciones);
    return div;
  }

  async function verDocumentos(a) {
    await Documentos.abrir(a);
  }

  $('buscar-abiertos').oninput = function () {
    pintarAbiertos();
    pintarSueltos();
  };
  $('filtro-estado').onchange = function () { pintarAbiertos(); };

  $('orden-abiertos').onchange = function () {
    try { window.localStorage.setItem('orden-abiertos', this.value); } catch (e) {}
    pintarAbiertos();
  };
  $('btn-recargar').onclick = function () { verAbiertos(); };

  /* ==========================================================
     DOCUMENTOS SIN CLASIFICAR

     Un fichero suelto en la carpeta de asuntos abiertos es trabajo que
     todavía no tiene carpeta: casi siempre, algo que ha dejado ahí el
     equipo directivo. Se enseñan arriba del todo, y los que llegan con
     la aplicación abierta se marcan como nuevos.
     ========================================================== */

  async function pintarSueltos() {
    var q = U.normalizar($('buscar-abiertos').value);
    var lista = E.sueltos.filter(function (s) {
      return !q || U.normalizar(s.nombre).indexOf(q) !== -1;
    });

    var cuantosNuevos = Object.keys(E.reciales).length;
    $('btn-sueltos-visto').classList.toggle('oculto', !cuantosNuevos);
    var rotulo = $('nuevos-sueltos');
    rotulo.textContent = cuantosNuevos === 1 ? '1 nuevo' : cuantosNuevos + ' nuevos';
    rotulo.classList.toggle('oculto', !cuantosNuevos);
    pintarCuentas();

    /* Saber la fecha de cada documento obliga a abrirlo, así que solo se
       hace cuando esta lista está a la vista. */
    if (E.vista !== 'clasificar') return;

    var caja = $('lista-sueltos');
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">' + (E.sueltos.length
        ? 'Ningún documento coincide con lo que buscas.'
        : 'No hay documentos sueltos. Todo lo que ha llegado está ya dentro de su asunto.') +
        '</div>';
      return;
    }

    var conFecha = lista.length <= 40;
    for (var i = 0; i < lista.length; i++) {
      var s = lista[i];
      var pie = '';
      if (conFecha) {
        try {
          var f = await s.handle.getFile();
          var d = new Date(f.lastModified);
          pie = isNaN(d.getTime()) ? ''
              : 'Puesto ahí el ' + d.toLocaleDateString('es-ES') + ' a las ' +
                String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0');
        } catch (e) { pie = ''; }
      }
      caja.appendChild(tarjetaSuelto(s, pie, !!E.reciales[s.nombre]));
    }
  }

  function tarjetaSuelto(s, pie, esNuevo) {
    var div = document.createElement('div');
    div.className = 'tarjeta tarjeta-suelto' + (esNuevo ? ' tarjeta-nueva' : '');
    var ext = Nombres.extensionDe(s.nombre);
    div.innerHTML = ICONO_DOCUMENTO +
      '<div class="tarjeta-texto">' +
        '<div class="tarjeta-nombre">' +
          (esNuevo ? '<span class="marca-nueva">NUEVO</span>' : '') +
          (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
          U.escapar(s.nombre) +
        '</div>' +
        '<div class="tarjeta-pie">' + U.escapar(pie) + '</div>' +
      '</div>';

    var acciones = document.createElement('div');
    acciones.className = 'acciones';

    var ver = document.createElement('button');
    ver.className = 'boton';
    ver.textContent = 'Abrir';
    ver.title = 'Lo abre en otra pestaña para verlo';
    ver.onclick = function () { abrirSuelto(s); };
    acciones.appendChild(ver);

    var crear = document.createElement('button');
    crear.className = 'boton boton-principal';
    crear.textContent = 'Crear asunto con él';
    crear.onclick = function () { empezarAsuntoCon(s); };
    acciones.appendChild(crear);

    div.appendChild(acciones);
    return div;
  }

  async function abrirSuelto(s) {
    try {
      var f = await s.handle.getFile();
      var url = URL.createObjectURL(f);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      U.aviso('No he podido abrir el documento: ' + e.message, 'malo');
    }
  }

  function empezarAsuntoCon(s) {
    E.pendiente = s;
    delete E.reciales[s.nombre];
    actualizarTitulo();
    ir('nuevo');
  }

  function pintarPendiente() {
    var caja = $('aviso-pendiente');
    if (!E.pendiente) { caja.classList.add('oculto'); caja.innerHTML = ''; return; }
    caja.classList.remove('oculto');
    caja.innerHTML = '<strong>Este asunto se crea con un documento.</strong>' +
      '<p>' + U.escapar(E.pendiente.nombre) + ' se meterá dentro de la carpeta nueva. ' +
      'Después se abrirá el cuadro para ponerle el nombre.</p>';
    var b = document.createElement('button');
    b.className = 'boton';
    b.textContent = 'Dejarlo donde está';
    b.onclick = function () { E.pendiente = null; pintarPendiente(); };
    caja.appendChild(b);
  }

  $('btn-sueltos-visto').onclick = function () {
    E.reciales = {};
    actualizarTitulo();
    pintarSueltos();
  };

  /* ---------- mirar cada poco si ha llegado algo ----------

     El navegador no avisa solo cuando aparece un fichero, así que hay
     que ir a mirar. Solo se leen los nombres de la carpeta, no se abre
     nada, y por eso no se nota aunque haya cientos de asuntos.

     Mientras la pestaña esté cerrada no hay aviso: esto solo funciona
     con la aplicación abierta. */
  var mirando = false;

  function vigilarLaCarpeta() {
    setInterval(mirarLaCarpeta, SEGUNDOS_ENTRE_MIRADAS * 1000);
    window.addEventListener('focus', mirarLaCarpeta);
  }

  async function mirarLaCarpeta() {
    if (!E.abiertos || mirando) return;
    if ($('aplicacion').classList.contains('oculto')) return;
    mirando = true;
    try {
      var hay = await Carpetas.contenido(E.abiertos);

      var antes = E.sueltos.map(function (f) { return f.nombre; });
      var ahora = hay.ficheros
        .filter(function (f) { return esDocumentoDeTrabajo(f.nombre); })
        .map(function (f) { return f.nombre; });
      var llegados = ahora.filter(function (n) { return antes.indexOf(n) === -1; });

      var carpetasAntes = E.listaAbiertos.map(function (a) { return a.nombre; }).join('|');
      var carpetasAhora = hay.carpetas
        .filter(function (c) { return c.nombre.charAt(0) !== '_'; })
        .map(function (c) { return c.nombre; }).join('|');

      var algoCambia = llegados.length || antes.length !== ahora.length ||
                       carpetasAntes !== carpetasAhora;
      if (!algoCambia) return;

      llegados.forEach(function (n) { E.reciales[n] = true; });
      await verAbiertos(hay);

      if (llegados.length === 1) {
        U.aviso('Ha llegado un documento nuevo: ' + llegados[0], 'bueno');
      } else if (llegados.length > 1) {
        U.aviso('Han llegado ' + llegados.length + ' documentos nuevos.', 'bueno');
      }
    } catch (e) {
      /* Si se ha perdido el permiso sobre la carpeta, ya se verá al
         pulsar cualquier botón. Aquí no se molesta al usuario. */
    } finally {
      mirando = false;
    }
  }

  /* El contador de la pestaña del navegador, para enterarse aunque se
     esté trabajando en otra ventana. */
  function actualizarTitulo() {
    var n = Object.keys(E.reciales).length;
    document.title = n ? '(' + n + ') ' + TITULO : TITULO;
  }

  /* ---------- cerrar un asunto ---------- */

  async function cerrarAsunto(a) {
    var categoria = a.ficha.categoria || a.leido.categoria || '';
    var tercero = a.ficha.tercero || '';

    if (!categoria || !tercero) {
      var opciones = Nombres.CATEGORIAS.map(function (c) {
        return '<option value="' + c + '"' + (c === categoria ? ' selected' : '') + '>' + c + '</option>';
      }).join('');
      var ok = await U.preguntar('¿Dónde va esta carpeta?',
        '<p class="explica">Este asunto no lo creó la aplicación, así que hace falta saber ' +
        'en qué parte del archivo va.</p>' +
        '<label class="etiqueta">Categoría</label>' +
        '<select id="cierre-categoria" class="campo">' + opciones + '</select>' +
        '<label class="etiqueta">Carpeta del tercero</label>' +
        '<input id="cierre-tercero" class="campo" value="' + U.escapar(Nombres.terceroDeResto(a.leido.resto)) + '">' +
        '<p class="nota">Se creará dentro de la categoría si todavía no existe.</p>',
        'Continuar');
      if (!ok) return;
      categoria = $('cierre-categoria').value;
      tercero = U.limpiarNombre($('cierre-tercero').value);
      if (!tercero) { U.aviso('Hace falta el nombre de la carpeta del tercero.', 'malo'); return; }
    }

    var confirmar = await U.preguntar('Cerrar el asunto',
      '<p>Se llevará la carpeta a:</p>' +
      '<div class="vista-previa"><div class="vista-nombre">' +
        U.escapar(E.archivo.name + ' / ' + categoria + ' / ' + tercero) +
      '</div></div>' +
      '<p class="nota">Se copia primero y se comprueba que ha llegado todo. ' +
      'Si algo falla, la carpeta se queda donde está.</p>', 'Cerrar el asunto');
    if (!confirmar) return;

    try {
      var destino = await Carpetas.bajar(E.archivo, [categoria, tercero], true);
      var n = await Carpetas.mover(E.abiertos, a.nombre, destino);
      await anotar(a.nombre, {
        estado: 'cerrado', categoria: categoria, tercero: tercero,
        cerradoEl: U.ahora(), cerradoPor: E.usuario, ficheros: n
      });
      U.aviso('Asunto cerrado y archivado.', 'bueno');
      await verAbiertos();
    } catch (e) {
      U.aviso('No se ha podido cerrar: ' + e.message, 'malo');
    }
  }

  /* ---------- reabrir ---------- */

  async function reabrirAsunto(a) {
    var confirmar = await U.preguntar('Reabrir el asunto',
      '<p>La carpeta volverá a <strong>' + U.escapar(E.abiertos.name) + '</strong>.</p>',
      'Reabrir');
    if (!confirmar) return;
    try {
      await Carpetas.mover(a.padre, a.nombre, E.abiertos);
      await anotar(a.nombre, { estado: 'abierto', reabiertoEl: U.ahora(), reabiertoPor: E.usuario });
      U.aviso('Asunto reabierto.', 'bueno');
      await verAbiertos();
      await verArchivo();
    } catch (e) {
      U.aviso('No se ha podido reabrir: ' + e.message, 'malo');
    }
  }

  /* ==========================================================
     PANTALLA: NUEVO ASUNTO
     ========================================================== */

  /* El curso académico del campo se sigue calculando solo de la fecha de
     inicio mientras el usuario no lo haya cambiado a mano. */
  var cursoNuevoAuto = '';

  function actualizarCursoNuevo() {
    var actual = $('campo-curso').value.trim();
    if (!actual || actual === cursoNuevoAuto) {
      cursoNuevoAuto = U.cursoDeFecha($('campo-fecha').value);
      $('campo-curso').value = cursoNuevoAuto;
    }
  }

  function prepararNuevo() {
    if (!$('campo-fecha').value) $('campo-fecha').value = U.hoyIso();
    pintarEstadoNuevo();
    actualizarCursoNuevo();
    pintarPendiente();
    pintarCategorias();
    if (E.nuevo.categoria) pintarTipos();
    refrescarVista();
  }

  /* Primero la categoría. Con cuatro botones se llega a los diez tipos
     que hacen falta, en vez de enseñar los cuarenta de golpe. */
  /* El estado con el que nace el asunto. Se propone el primero de la
     lista de Ajustes, que es el primer paso del trámite. */
  function pintarEstadoNuevo() {
    var sel = $('campo-estado');
    var antes = sel.value;
    sel.innerHTML = '<option value="">Sin estado</option>' +
      E.estados.map(function (e) {
        return '<option value="' + U.escapar(e.nombre) + '">' + U.escapar(e.nombre) + '</option>';
      }).join('');
    var primero = E.estados.length ? E.estados[0].nombre : '';
    sel.value = antes || primero;
    if (sel.selectedIndex === -1) sel.value = primero;

    var via = $('campo-via');
    if (!via.options.length) {
      via.innerHTML = '<option value="">Sin indicar</option>' +
        Nombres.VIAS.map(function (v) {
          return '<option value="' + v.clave + '">' + U.escapar(v.texto) + '</option>';
        }).join('');
    }
  }

  function pintarCategorias() {
    var caja = $('categorias-lista');
    caja.innerHTML = '';
    Nombres.CATEGORIAS.forEach(function (cat) {
      var cuantos = E.tipos.filter(function (t) { return t.categoria === cat; }).length;
      var b = document.createElement('button');
      b.className = 'categoria-boton' + (E.nuevo.categoria === cat ? ' elegido' : '');
      b.setAttribute('data-categoria', cat);
      b.innerHTML = U.escapar(cat) +
        '<small>' + U.escapar(DESCRIPCION_CATEGORIA[cat]) + ' · ' + cuantos + ' tipos</small>';
      b.onclick = function () { elegirCategoria(cat); };
      caja.appendChild(b);
    });
  }

  function elegirCategoria(cat) {
    E.nuevo.categoria = cat;
    E.nuevo.tipo = null;
    E.nuevo.tercero = null;
    pintarCategorias();
    pintarTipos();
    $('bloque-tipos').classList.remove('oculto');
    $('bloque-tercero').classList.add('oculto');
    $('bloque-detalles').classList.add('oculto');
  }

  function pintarTipos() {
    var caja = $('tipos-lista');
    caja.innerHTML = '';
    var deEsta = E.tipos.filter(function (t) { return t.categoria === E.nuevo.categoria; });
    if (!deEsta.length) {
      caja.innerHTML = '<div class="vacio">Esta categoría no tiene ningún tipo todavía. ' +
                       'Se añaden en Ajustes.</div>';
      return;
    }
    deEsta.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'tipo-boton' + (E.nuevo.tipo === t.tipo ? ' elegido' : '');
      b.textContent = t.tipo;
      b.onclick = function () { elegirTipo(t); };
      caja.appendChild(b);
    });
  }

  function elegirTipo(t) {
    E.nuevo.tipo = t.tipo;
    E.nuevo.categoria = t.categoria;
    E.nuevo.tercero = null;
    pintarTipos();
    $('bloque-tercero').classList.remove('oculto');
    $('bloque-detalles').classList.add('oculto');
    $('etiqueta-tercero').textContent = {
      ALUMNADO: 'Alumno o alumna', PERSONAL: 'Persona del centro',
      EMPRESAS: 'Empresa', OTROS: 'Con quién es el asunto'
    }[t.categoria];
    $('buscar-tercero').value = '';
    $('resultados-tercero').innerHTML = '';
    $('tercero-elegido').classList.add('oculto');
    $('buscar-tercero').focus();
  }

  $('ir-a-ajustes').onclick = function () { ir('ajustes'); };

  var temporizador = null;
  $('buscar-tercero').oninput = function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(buscarTercero, 180);
  };

  async function buscarTercero() {
    if (!E.nuevo.categoria) return;
    var texto = $('buscar-tercero').value;
    var caja = $('resultados-tercero');
    if (U.normalizar(texto).length < 2) { caja.innerHTML = ''; return; }
    caja.innerHTML = '<div class="explica">Buscando…</div>';
    var fuente = await Datos.cargar(E.datos, E.nuevo.categoria);
    var encontrados = Datos.buscar(fuente.lista, texto, 30);
    caja.innerHTML = '';

    if (!encontrados.length) {
      var vacio = document.createElement('div');
      vacio.className = 'vacio';
      if (E.nuevo.categoria === 'ALUMNADO') {
        vacio.innerHTML = (fuente.fichero
          ? 'Nadie con ese nombre en ' + U.escapar(fuente.fichero) + '.'
          : 'Todavía no está el fichero RegAlum.csv en la carpeta _GESTOR/datos.') +
          '<br>Si es un solicitante que aún no se ha matriculado, dale de alta aquí.';
      } else if (E.nuevo.categoria === 'PERSONAL') {
        vacio.innerHTML = fuente.fichero
          ? 'Nadie con ese nombre en ' + U.escapar(fuente.fichero) +
            ' ni en las altas a mano.'
          : 'Todavía no hay ningún fichero RelPerCen en la carpeta _GESTOR/datos.';
      } else {
        vacio.textContent = 'No está en la lista todavía.';
      }
      caja.appendChild(vacio);
      caja.appendChild(botonAlta(texto));
      return;
    }

    encontrados.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'resultado';
      d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                    '<div class="resultado-pie">' + U.escapar(pieDe(p)) + '</div>';
      d.onclick = function () { fijarTercero(p); };
      caja.appendChild(d);
    });
    caja.appendChild(botonAlta(texto));
  }

  /* Lo que se lee debajo del nombre de un alumno, tanto en el buscador
     del formulario como en la pantalla de Personas. Si ya no está
     matriculado hay que decirlo: es la diferencia entre poner el grupo
     bueno y poner uno de hace tres cursos. */
  function pieAlumno(p) {
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
  }

  /* Lo que se lee debajo del nombre de alguien del centro. Si ya cesó
     hay que decirlo: sus asuntos viejos siguen ahí, pero abrirle uno
     nuevo casi siempre es una equivocación. */
  function piePersona(p) {
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
  }

  function pieDe(p) {
    if (p.categoria === 'ALUMNADO') return pieAlumno(p);
    if (p.categoria === 'PERSONAL') return piePersona(p);
    return [p.documento, p.nif, p.referencia, p.campos['Puesto'] || ''].filter(Boolean).join('  ·  ');
  }

  function botonAlta(texto) {
    var b = document.createElement('button');
    b.className = 'boton';
    b.style.marginTop = '6px';
    b.textContent = E.nuevo.categoria === 'ALUMNADO'
      ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
    b.onclick = function () { altaTercero(E.nuevo.categoria, texto); };
    return b;
  }

  function fijarTercero(p) {
    E.nuevo.tercero = p;
    var texto = textoTercero(p);
    $('resultados-tercero').innerHTML = '';
    $('buscar-tercero').value = '';
    var caja = $('tercero-elegido');
    caja.className = 'elegido';
    caja.innerHTML = '<div class="elegido-caja"><div><strong>' + U.escapar(texto) + '</strong></div>' +
                     '<button class="boton" id="btn-cambiar-tercero">Cambiar</button></div>';
    caja.classList.remove('oculto');
    $('btn-cambiar-tercero').onclick = function () {
      E.nuevo.tercero = null;
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
        '<div class="resultado-pie">' + U.escapar(pieDe(p)) + '</div>';
    }

    $('bloque-detalles').classList.remove('oculto');
    refrescarVista();
  }

  function grupoDelTercero() {
    var p = E.nuevo.tercero;
    if (!p || p.categoria !== 'ALUMNADO') return '';
    return Nombres.grupoCompacto(p.unidad, p.curso);
  }

  function textoTercero(p) {
    if (p.categoria === 'ALUMNADO') return Nombres.terceroAlumno(p);
    if (p.categoria === 'PERSONAL') return Nombres.terceroPersonal(p);
    if (p.categoria === 'EMPRESAS') return Nombres.terceroEmpresa({ nombre: p.nombre, nif: p.nif });
    return U.limpiarNombre(p.nombre + (p.referencia ? ' ' + p.referencia : ''));
  }

  $('campo-fecha').oninput = function () { actualizarCursoNuevo(); refrescarVista(); };
  ['campo-curso', 'campo-descripcion'].forEach(function (id) {
    $(id).oninput = refrescarVista;
  });
  $('campo-grupo').onchange = refrescarVista;

  function datosDelFormulario() {
    return {
      fecha: $('campo-fecha').value,
      tipo: E.nuevo.tipo || '',
      curso: $('campo-curso').value.trim(),
      grupo: $('campo-grupo').checked ? grupoDelTercero() : '',
      descripcion: $('campo-descripcion').value.trim(),
      tercero: E.nuevo.tercero ? textoTercero(E.nuevo.tercero) : ''
    };
  }

  function refrescarVista() {
    if (!E.nuevo.tipo || !E.nuevo.tercero) return;
    var d = datosDelFormulario();
    var nombre = Nombres.montar(d);
    $('vista-nombre').textContent = nombre;
    $('vista-ruta').textContent = 'En ' + E.abiertos.name +
      '. Al cerrarlo irá a ' + E.archivo.name + ' / ' + E.nuevo.categoria + ' / ' + d.tercero;
    $('btn-crear').disabled = !nombre || nombre.length < 8;
  }

  $('btn-crear').onclick = async function () {
    var d = datosDelFormulario();
    var nombre = Nombres.montar(d);
    if (!nombre) return;
    try {
      if (await Carpetas.existe(E.abiertos, nombre)) {
        U.aviso('Ya hay un asunto abierto con ese mismo nombre.', 'malo');
        return;
      }
      var carpeta = await Carpetas.crear(E.abiertos, nombre);
      await anotar(nombre, {
        estado: 'abierto', tipo: d.tipo, categoria: E.nuevo.categoria,
        tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
        situacion: $('campo-estado').value,
        via: $('campo-via').value,
        viaDato: $('campo-via-dato').value.trim(),
        abiertoEl: U.ahora(), abiertoPor: E.usuario
      });

      /* Si el asunto se ha empezado desde un documento suelto, ese
         documento se mete ahora en la carpeta recién creada. */
      var traido = E.pendiente;
      if (traido) {
        try {
          await Carpetas.moverFichero(E.abiertos, traido.nombre, carpeta);
        } catch (e2) {
          U.aviso('El asunto está creado, pero el documento no ha podido entrar: ' +
                  e2.message, 'malo');
          traido = null;
        }
        E.pendiente = null;
        pintarPendiente();
      }

      U.aviso('Asunto creado.', 'bueno');
      navigator.clipboard.writeText(nombre).catch(function () {});
      E.nuevo = { tipo: null, categoria: null, tercero: null };
      $('campo-descripcion').value = '';
      $('campo-estado').value = E.estados.length ? E.estados[0].nombre : '';
      $('campo-via').value = '';
      $('campo-via-dato').value = '';
      $('campo-grupo').checked = false;
      $('bloque-tipos').classList.add('oculto');
      $('bloque-grupo').classList.add('oculto');
      $('bloque-tercero').classList.add('oculto');
      $('bloque-detalles').classList.add('oculto');
      await verAbiertos();
      ir('abiertos');

      /* Con el documento ya dentro, se abre el cuadro de siempre para
         ponerle el nombre que le toca. */
      if (traido) {
        var recien = E.listaAbiertos.filter(function (a) { return a.nombre === nombre; })[0];
        if (recien) await verDocumentos(recien);
      }
    } catch (e) {
      U.aviso('No he podido crear la carpeta: ' + e.message, 'malo');
    }
  };

  /* ---------- alta de un tercero que no está en la lista ---------- */

  async function altaTercero(categoria, sugerencia) {
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
    await Datos.anadirALista(E.datos, categoria, valores);
    U.aviso('Dado de alta.', 'bueno');
    $('buscar-tercero').value = valores[def.cabecera[0]];
    buscarTercero();
  }

  /* ==========================================================
     PANTALLA: ARCHIVO
     ========================================================== */

  async function verArchivo() {
    $('explica-archivo').textContent = 'Leyendo el archivo…';
    var salida = [];
    var categorias = await Carpetas.subcarpetas(E.archivo);
    for (var i = 0; i < categorias.length; i++) {
      var terceros = await Carpetas.subcarpetas(categorias[i].handle);
      for (var j = 0; j < terceros.length; j++) {
        var asuntos = await Carpetas.subcarpetas(terceros[j].handle);
        for (var k = 0; k < asuntos.length; k++) {
          salida.push({
            nombre: asuntos[k].nombre, handle: asuntos[k].handle, padre: terceros[j].handle,
            ruta: categorias[i].nombre + ' / ' + terceros[j].nombre,
            leido: Nombres.leer(asuntos[k].nombre, E.tipos),
            ficha: E.registro.asuntos[asuntos[k].nombre] || {},
            busca: U.normalizar(asuntos[k].nombre + ' ' + categorias[i].nombre + ' ' + terceros[j].nombre)
          });
        }
      }
    }
    salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
    E.listaArchivo = salida;
    $('explica-archivo').textContent = salida.length + ' asuntos archivados.';
    pintarArchivo();
  }

  function pintarArchivo() {
    var q = U.normalizar($('buscar-archivo').value);
    var lista = E.listaArchivo.filter(function (a) { return !q || a.busca.indexOf(q) !== -1; });
    var caja = $('lista-archivo');
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
      return;
    }
    lista.slice(0, 300).forEach(function (a) { caja.appendChild(tarjetaAsunto(a, 'archivado')); });
    if (lista.length > 300) {
      var mas = document.createElement('div');
      mas.className = 'explica';
      mas.textContent = 'Se muestran los 300 primeros de ' + lista.length + '. Afina la búsqueda.';
      caja.appendChild(mas);
    }
  }

  $('buscar-archivo').oninput = pintarArchivo;
  $('btn-recargar-archivo').onclick = function () { verArchivo(); };

  /* ==========================================================
     PANTALLA: PERSONAS
     ========================================================== */

  var personasCargadas = null;

  async function pintarPersonas() {
    var categoria = $('filtro-personas').value;
    var fuente = await Datos.cargar(E.datos, categoria);
    personasCargadas = fuente;
    buscarPersonas();
  }

  function buscarPersonas() {
    if (!personasCargadas) return;
    var texto = $('buscar-personas').value;
    var caja = $('lista-personas');
    var lista = U.normalizar(texto).length >= 2
      ? Datos.buscar(personasCargadas.lista, texto, 60)
      : personasCargadas.lista.slice(0, 60);
    caja.innerHTML = '';
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Nada que mostrar.</div>';
    }
    lista.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'resultado';
      d.innerHTML = '<div>' + U.escapar(p.nombre) + '</div>' +
                    '<div class="resultado-pie">' + U.escapar(pieDe(p)) + '</div>';
      d.onclick = function () { verFicha(p); };
      caja.appendChild(d);
    });
    var b = document.createElement('button');
    b.className = 'boton';
    b.textContent = $('filtro-personas').value === 'ALUMNADO'
      ? '+ Dar de alta un solicitante' : '+ Dar de alta uno nuevo';
    b.onclick = function () { altaDesdePersonas(); };
    caja.appendChild(b);
  }

  async function altaDesdePersonas() {
    await altaTercero($('filtro-personas').value, $('buscar-personas').value.trim());
    Datos.olvidar($('filtro-personas').value);
    pintarPersonas();
  }

  function verFicha(p) {
    var caja = $('ficha-persona');

    function pintarFilas(filas) {
      return filas.map(function (f) {
        return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' +
               U.escapar(f.valor) + '</span></div>';
      }).join('');
    }

    var html = '<h4>' + U.escapar(p.nombre) + '</h4>';

    if (p.categoria === 'ALUMNADO') {
      /* Lo que se consulta a diario va arriba: la edad de hoy, si sigue
         matriculado, el grupo y los datos de contacto de los tutores
         legales. El resto del fichero de Séneca sigue estando, más abajo. */
      var d = Datos.destacadosAlumno(p);
      html += pintarFilas(d.destacados);
      if (d.resto.length) {
        html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
                'Ver los demás datos del fichero (' + d.resto.length + ')</button></p>' +
                '<div id="resto-ficha" class="oculto">' + pintarFilas(d.resto) + '</div>';
      }
    } else if (p.categoria === 'PERSONAL') {
      /* Igual que en el alumnado: arriba el puesto, si sigue en el centro
         y por dónde se le localiza; el resto del fichero, debajo. */
      var dp = Datos.destacadosPersona(p);
      html += pintarFilas(dp.destacados);
      if (dp.resto.length) {
        html += '<p class="nota"><button type="button" class="enlace" id="ver-resto">' +
                'Ver los demás datos del fichero (' + dp.resto.length + ')</button></p>' +
                '<div id="resto-ficha" class="oculto">' + pintarFilas(dp.resto) + '</div>';
      }
    } else {
      html += pintarFilas(Object.keys(p.campos).map(function (c) {
        return { titulo: c, valor: p.campos[c] };
      }));
    }

    html += '<p class="nota"><button type="button" class="boton" id="ver-sus-asuntos">' +
            'Ver sus asuntos</button></p><div id="asuntos-del-tercero"></div>';

    caja.innerHTML = html;

    if ($('ver-resto')) {
      $('ver-resto').onclick = function () {
        $('resto-ficha').classList.toggle('oculto');
      };
    }
    $('ver-sus-asuntos').onclick = function () { verAsuntosDeTercero(p); };
  }

  /* Todos los asuntos de una persona o empresa, los abiertos y los
     archivados, en una sola lista. */
  async function verAsuntosDeTercero(p) {
    var caja = $('asuntos-del-tercero');
    caja.innerHTML = '<p class="explica">Buscando…</p>';
    var texto = textoTercero(p);
    var clave = U.normalizar(texto);
    var salida = [];

    var abiertas = await Carpetas.subcarpetas(E.abiertos);
    abiertas.forEach(function (c) {
      if (c.nombre.charAt(0) === '_') return;
      if (U.normalizar(c.nombre).indexOf(clave) === -1) return;
      salida.push({ nombre: c.nombre, donde: 'Abierto' });
    });

    try {
      var cat = await E.archivo.getDirectoryHandle(p.categoria);
      var ter = await cat.getDirectoryHandle(texto);
      var cerradas = await Carpetas.subcarpetas(ter);
      cerradas.forEach(function (c) {
        salida.push({ nombre: c.nombre, donde: 'Archivado' });
      });
    } catch (e) { /* todavía no tiene carpeta en el archivo */ }

    salida.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });

    if (!salida.length) {
      caja.innerHTML = '<div class="vacio">Todavía no hay ningún asunto suyo.</div>';
      return;
    }
    caja.innerHTML = salida.map(function (a) {
      var leido = Nombres.leer(a.nombre, E.tipos);
      var ficha = E.registro.asuntos[a.nombre] || {};
      var situacion = ficha.situacion || '';
      return '<div class="resultado"><div>' +
             (leido.tipo ? '<span class="marca-tipo">' + U.escapar(leido.tipo) + '</span>' : '') +
             (situacion ? '<span class="marca-estado ' + colorEstado(situacion) + '">' +
                          U.escapar(situacion) + '</span>' : '') +
             U.escapar(a.nombre) + '</div>' +
             '<div class="resultado-pie">' + a.donde +
             (leido.fecha ? '  ·  ' + U.fechaLegible(leido.fecha) : '') + '</div></div>';
    }).join('');
  }

  $('filtro-personas').onchange = pintarPersonas;
  $('buscar-personas').oninput = buscarPersonas;

  /* ==========================================================
     PANTALLA: AJUSTES
     ========================================================== */

  /* ---------- cambiarle el nombre a un tipo de asunto ----------

     Los asuntos ABIERTOS se renombran: son pocos y es el trabajo vivo.

     El ARCHIVO no se toca. Renombrar allí obligaría a copiar y borrar
     carpeta por carpeta, con Dropbox resincronizando de fondo, y el
     nombre de una carpeta archivada es el rastro de lo que se hizo aquel
     día. En su lugar, el nombre viejo se guarda como alias del tipo: las
     carpetas antiguas se siguen reconociendo y se enseñan con el nombre
     nuevo, sin mover un solo fichero. */
  async function renombrarTipo(tipo) {
    var ok = await U.preguntar('Cambiar el nombre del tipo',
      '<label class="etiqueta">Nombre nuevo</label>' +
      '<input id="tipo-nuevo-nombre" class="campo" value="' + U.escapar(tipo.tipo) + '">' +
      '<p class="nota">Se cambiará en los asuntos abiertos que lo usen. ' +
      'Las carpetas del archivo no se tocan: se seguirán llamando como se llaman, ' +
      'y el buscador las encontrará igual.</p>', 'Cambiar');
    if (!ok) return;

    var nombreNuevo = U.limpiarNombre($('tipo-nuevo-nombre').value).toUpperCase();
    if (!nombreNuevo || nombreNuevo === tipo.tipo) return;

    var repetido = E.tipos.some(function (t) {
      return t !== tipo && U.normalizar(t.tipo) === U.normalizar(nombreNuevo);
    });
    if (repetido) { U.aviso('Ya hay otro tipo con ese nombre.', 'malo'); return; }

    var nombreViejo = tipo.tipo;
    var afectadas = E.listaAbiertos.filter(function (a) {
      return a.leido.reconocido && a.leido.tipo === nombreViejo;
    });

    var cambiadas = 0, fallos = [];
    for (var i = 0; i < afectadas.length; i++) {
      var a = afectadas[i];
      var nombreCarpeta = a.nombre.replace(a.nombre.slice(7, 7 + nombreViejo.length), nombreNuevo);
      try {
        await Carpetas.renombrar(E.abiertos, a.nombre, nombreCarpeta);
        var ficha = E.registro.asuntos[a.nombre];
        if (ficha) {
          ficha.tipo = nombreNuevo;
          await anotar(nombreCarpeta, ficha);
        }
        cambiadas++;
      } catch (e) {
        fallos.push(a.nombre + ': ' + e.message);
      }
    }

    tipo.alias = tipo.alias || [];
    if (tipo.alias.indexOf(nombreViejo) === -1) tipo.alias.push(nombreViejo);
    tipo.tipo = nombreNuevo;
    await guardarTipos();

    await verAbiertos();
    pintarAjustes();

    if (fallos.length) {
      U.aviso('Cambiadas ' + cambiadas + ' carpetas. ' + fallos.length + ' no se han podido.', 'malo');
    } else {
      U.aviso('Tipo renombrado. Carpetas abiertas cambiadas: ' + cambiadas + '.', 'bueno');
    }
  }

  async function pintarAjustes() {
    var caja = $('tabla-tipos');
    caja.innerHTML = '';
    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = E.tipos.filter(function (t) { return t.categoria === cat; });
      if (!deEsta.length) return;
      var t = document.createElement('h4');
      t.textContent = cat;
      t.style.cssText = 'margin:16px 0 4px;font-size:13px;color:#5d6b7a';
      caja.appendChild(t);
      deEsta.forEach(function (tipo) {
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(tipo.tipo) + '</span>' +
          ((tipo.alias && tipo.alias.length)
            ? '<span class="suave">antes: ' + U.escapar(tipo.alias.join(', ')) + '</span>' : '');
        var editar = document.createElement('button');
        editar.className = 'boton';
        editar.textContent = 'Cambiar el nombre';
        editar.onclick = function () { renombrarTipo(tipo); };
        f.appendChild(editar);
        var quitar = document.createElement('button');
        quitar.className = 'boton boton-peligro';
        quitar.textContent = 'Quitar';
        quitar.onclick = async function () {
          E.tipos = E.tipos.filter(function (x) { return x.tipo !== tipo.tipo; });
          await guardarTipos();
          pintarAjustes();
        };
        f.appendChild(quitar);
        caja.appendChild(f);
      });
    });

    pintarTablaEstados();

    var estado = $('estado-datos');
    estado.innerHTML = '';
    var alumnado = await Datos.cargar(E.datos, 'ALUMNADO');

    /* Cómo queda abreviado cada grupo. Es lo único de esta pantalla que
       hay que mirar con datos reales delante: si un grupo de Bachillerato
       o de un ciclo saliera mal, se ve aquí de un vistazo. */
    var grupos = $('tabla-grupos');
    grupos.innerHTML = '';
    var unidades = Datos.unidadesDistintas(alumnado.lista);
    if (!unidades.length) {
      grupos.innerHTML = '<div class="vacio">Todavía no hay alumnado cargado.</div>';
    } else {
      unidades.forEach(function (u) {
        var d = document.createElement('div');
        d.className = 'fila-tipo';
        d.innerHTML = '<span class="suave" style="flex:1">' + U.escapar(u.unidad) +
                      '  ·  ' + u.cuantos + ' alumnos</span>' +
                      '<span class="nombre-tipo">' +
                      U.escapar(Nombres.grupoCompacto(u.unidad, u.curso)) + '</span>';
        grupos.appendChild(d);
      });
    }

    var tdoc = $('tabla-tipos-documento');
    tdoc.innerHTML = '';
    E.tiposDocumento.forEach(function (nombre) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(nombre) + '</span>';
      var quitar = document.createElement('button');
      quitar.className = 'boton boton-peligro';
      quitar.textContent = 'Quitar';
      quitar.onclick = async function () {
        E.tiposDocumento = E.tiposDocumento.filter(function (x) { return x !== nombre; });
        await guardarTiposDocumento();
        pintarAjustes();
      };
      f.appendChild(quitar);
      tdoc.appendChild(f);
    });

    estado.appendChild(filaEstado('RegAlum.csv (alumnado)',
      alumnado.fichero
        ? alumnado.fichero + '  ·  curso ' + (alumnado.curso || 'sin determinar') +
          '  ·  ' + alumnado.matriculados + ' matriculados de ' + alumnado.lista.length +
          ' que hay en el fichero'
        : 'No está. Déjalo en _GESTOR/datos y vuelve a entrar.'));

    /* Qué columnas ha reconocido del RegAlum. Si un día Séneca le cambia
       el título a una, aquí se ve cuál falta, y así se entiende por qué
       la aplicación deja de ofrecer el grupo o la edad. */
    if (alumnado.fichero) {
      if (alumnado.sinAnos) {
        estado.appendChild(filaEstado('Año de la matrícula',
          'El fichero no trae años. Se toma como la foto del curso de hoy: ' +
          'todo el que no esté anulado ni trasladado cuenta como matriculado.'));
      }
      if (alumnado.faltan && alumnado.faltan.length) {
        estado.appendChild(filaEstado('Columnas que no encuentro',
          alumnado.faltan.join(', ') + '  ·  el fichero trae: ' +
          (alumnado.cabecera || []).join(', ')));
      } else {
        estado.appendChild(filaEstado('Columnas del RegAlum',
          'Las reconozco todas.'));
      }
      if (alumnado.solicitantes) {
        estado.appendChild(filaEstado('solicitantes.csv',
          alumnado.solicitantes + ' dados de alta a mano, todavía sin matricular'));
      }
    }
    var personal = await Datos.cargar(E.datos, 'PERSONAL');
    if (!personal.ficheros.length) {
      estado.appendChild(filaEstado('RelPerCen (personal)',
        'No hay ninguno. Déjalos en _GESTOR/datos y vuelve a entrar.'));
    } else {
      personal.ficheros.forEach(function (r) {
        estado.appendChild(filaEstado(r.fichero,
          'curso ' + r.curso + '  ·  ' + r.filas + ' personas'));
      });
      estado.appendChild(filaEstado('Personal en total',
        personal.enElCentro + ' en el centro (curso ' + personal.curso + ') de ' +
        personal.lista.length + ' fichas' +
        (personal.manuales ? '  ·  ' + personal.manuales + ' de alta a mano' : '')));
    }
    for (var cat in Datos.LISTAS) {
      if (cat === 'PERSONAL' || cat === 'ALUMNADO') continue;
      var l = await Datos.cargar(E.datos, cat);
      estado.appendChild(filaEstado(Datos.LISTAS[cat].fichero, l.lista.length + ' fichas'));
    }

    var carp = $('estado-carpetas');
    carp.innerHTML = '';
    carp.appendChild(filaEstado('Asuntos abiertos', E.abiertos.name));
    carp.appendChild(filaEstado('Archivo', E.archivo.name));
  }

  /* ---------- los estados del asunto, en Ajustes ----------

     Van en el orden del trámite, no en orden alfabético, así que se
     pueden subir y bajar con las flechas. */

  function pintarTablaEstados() {
    var caja = $('tabla-estados');
    caja.innerHTML = '';
    if (!E.estados.length) {
      caja.innerHTML = '<div class="vacio">No hay ningún estado. Añade el primero aquí arriba.</div>';
      return;
    }
    E.estados.forEach(function (estado, i) {
      var nombre = estado.nombre;
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="marca-estado ' + colorEstado(nombre) + '">' +
                    U.escapar(nombre) + '</span>' +
                    '<span class="nombre-tipo suave">' + cuantosCon(nombre) + '</span>';

      /* Esta casilla es la que decide en cuál de las tres tarjetas de
         arriba aparece el asunto. */
      var etiqueta = document.createElement('label');
      etiqueta.className = 'interruptor interruptor-fila';
      var casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.checked = !!estado.espera;
      casilla.onchange = async function () {
        estado.espera = casilla.checked;
        await guardarEstados();
        pintarTablaEstados();
        pintarAbiertos();
      };
      etiqueta.appendChild(casilla);
      var texto = document.createElement('span');
      texto.textContent = 'Depende de otros';
      texto.title = 'Con esto marcado, el asunto sale en "A la espera de terceros"';
      etiqueta.appendChild(texto);
      f.appendChild(etiqueta);

      var subir = document.createElement('button');
      subir.className = 'boton';
      subir.textContent = '▲';
      subir.title = 'Subirlo un puesto';
      subir.disabled = (i === 0);
      subir.onclick = function () { moverEstado(i, -1); };
      f.appendChild(subir);

      var bajar = document.createElement('button');
      bajar.className = 'boton';
      bajar.textContent = '▼';
      bajar.title = 'Bajarlo un puesto';
      bajar.disabled = (i === E.estados.length - 1);
      bajar.onclick = function () { moverEstado(i, 1); };
      f.appendChild(bajar);

      var editar = document.createElement('button');
      editar.className = 'boton';
      editar.textContent = 'Cambiar el nombre';
      editar.onclick = function () { renombrarEstado(nombre); };
      f.appendChild(editar);

      var quitar = document.createElement('button');
      quitar.className = 'boton boton-peligro';
      quitar.textContent = 'Quitar';
      quitar.onclick = function () { quitarEstado(nombre); };
      f.appendChild(quitar);

      caja.appendChild(f);
    });
  }

  /* Cuántos asuntos están ahora mismo en ese estado. */
  function contarCon(nombre) {
    var n = 0;
    Object.keys(E.registro.asuntos).forEach(function (k) {
      if (E.registro.asuntos[k].situacion === nombre) n++;
    });
    return n;
  }

  function cuantosCon(nombre) {
    var n = contarCon(nombre);
    if (!n) return 'Ningún asunto';
    return n === 1 ? '1 asunto' : n + ' asuntos';
  }

  async function moverEstado(i, salto) {
    var j = i + salto;
    if (j < 0 || j >= E.estados.length) return;
    var guardado = E.estados[i];
    E.estados[i] = E.estados[j];
    E.estados[j] = guardado;
    await guardarEstados();
    pintarTablaEstados();
    pintarFiltroEstado();
    pintarAbiertos();
  }

  /* Al cambiarle el nombre a un estado hay que cambiarlo también en los
     asuntos que lo tienen puesto, abiertos y archivados. */
  async function renombrarEstado(viejo) {
    var ok = await U.preguntar('Cambiar el nombre del estado',
      '<label class="etiqueta">Nombre nuevo</label>' +
      '<input id="estado-nuevo-nombre" class="campo" value="' + U.escapar(viejo) + '">' +
      '<p class="nota">Se cambiará también en los asuntos que estén en este estado. ' +
      'Las carpetas no se tocan: el estado no forma parte del nombre.</p>', 'Cambiar');
    if (!ok) return;

    var nuevo = U.limpiarNombre($('estado-nuevo-nombre').value).toUpperCase();
    if (!nuevo || nuevo === viejo) return;
    var repetido = E.estados.some(function (e) {
      return e.nombre !== viejo && U.normalizar(e.nombre) === U.normalizar(nuevo);
    });
    if (repetido) { U.aviso('Ya hay otro estado con ese nombre.', 'malo'); return; }

    try {
      E.estados.forEach(function (e) { if (e.nombre === viejo) e.nombre = nuevo; });
      await guardarEstados();

      await cargarRegistro();
      var n = 0;
      Object.keys(E.registro.asuntos).forEach(function (k) {
        if (E.registro.asuntos[k].situacion === viejo) {
          E.registro.asuntos[k].situacion = nuevo;
          n++;
        }
      });
      await Carpetas.guardarJson(E.gestor, FICHERO_ASUNTOS, E.registro);
      refrescarFichas();

      pintarAjustes();
      pintarFiltroEstado();
      pintarAbiertos();
      U.aviso('Estado renombrado. Asuntos cambiados: ' + n + '.', 'bueno');
    } catch (e) {
      U.aviso('No he podido cambiarlo: ' + e.message, 'malo');
    }
  }

  async function quitarEstado(nombre) {
    var n = contarCon(nombre);
    var ok = await U.preguntar('Quitar el estado',
      '<p>Se quita <strong>' + U.escapar(nombre) + '</strong> de la lista.</p>' +
      (n ? '<p class="nota">Hay ' + n + ' asunto' + (n === 1 ? '' : 's') +
           ' en este estado. Se quedarán sin estado, y podrás ponerles otro.</p>'
         : '<p class="nota">No hay ningún asunto en este estado.</p>'), 'Quitar');
    if (!ok) return;

    try {
      E.estados = E.estados.filter(function (e) { return e.nombre !== nombre; });
      await guardarEstados();

      if (n) {
        await cargarRegistro();
        Object.keys(E.registro.asuntos).forEach(function (k) {
          if (E.registro.asuntos[k].situacion === nombre) E.registro.asuntos[k].situacion = '';
        });
        await Carpetas.guardarJson(E.gestor, FICHERO_ASUNTOS, E.registro);
        refrescarFichas();
      }

      pintarAjustes();
      pintarFiltroEstado();
      pintarAbiertos();
      U.aviso('Estado quitado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido quitarlo: ' + e.message, 'malo');
    }
  }

  function filaEstado(titulo, valor) {
    var d = document.createElement('div');
    d.className = 'fila-tipo';
    d.innerHTML = '<span class="nombre-tipo">' + U.escapar(titulo) + '</span>' +
                  '<span class="suave">' + U.escapar(valor) + '</span>';
    return d;
  }

  $('btn-anadir-tipo').onclick = async function () {
    var nombre = U.limpiarNombre($('nuevo-tipo').value).toUpperCase();
    if (!nombre) return;
    var repetido = E.tipos.some(function (t) { return U.normalizar(t.tipo) === U.normalizar(nombre); });
    if (repetido) { U.aviso('Ese tipo ya está en la lista.', 'malo'); return; }
    E.tipos.push({ tipo: nombre, categoria: $('nueva-categoria').value });
    await guardarTipos();
    $('nuevo-tipo').value = '';
    pintarAjustes();
    U.aviso('Tipo añadido.', 'bueno');
  };

  $('btn-anadir-estado').onclick = async function () {
    var nombre = U.limpiarNombre($('nuevo-estado').value).toUpperCase();
    if (!nombre) return;
    var repetido = E.estados.some(function (e) { return U.normalizar(e.nombre) === U.normalizar(nombre); });
    if (repetido) { U.aviso('Ese estado ya está en la lista.', 'malo'); return; }
    E.estados.push({ nombre: nombre, espera: false });
    await guardarEstados();
    $('nuevo-estado').value = '';
    pintarTablaEstados();
    pintarFiltroEstado();
    U.aviso('Estado añadido.', 'bueno');
  };

  $('btn-anadir-tipo-doc').onclick = async function () {
    var nombre = U.limpiarNombre($('nuevo-tipo-doc').value).toUpperCase();
    if (!nombre) return;
    var repetido = E.tiposDocumento.some(function (t) {
      return U.normalizar(t) === U.normalizar(nombre);
    });
    if (repetido) { U.aviso('Ese tipo de documento ya está en la lista.', 'malo'); return; }
    E.tiposDocumento.push(nombre);
    await guardarTiposDocumento();
    $('nuevo-tipo-doc').value = '';
    pintarAjustes();
    U.aviso('Tipo de documento añadido.', 'bueno');
  };

  $('btn-olvidar').onclick = async function () {
    var ok = await U.preguntar('Volver a elegir las carpetas',
      '<p>Se olvidan las carpetas de <strong>este</strong> ordenador. ' +
      'No se borra ni se mueve nada.</p>', 'Olvidar');
    if (!ok) return;
    await Almacen.borrar('abiertos');
    await Almacen.borrar('archivo');
    location.reload();
  };

  /* ========================================================== */
  arrancar();
})();
