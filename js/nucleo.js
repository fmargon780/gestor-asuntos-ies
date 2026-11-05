/* ============================================================
   nucleo.js — el corazón de la aplicación.

   Aquí están el estado, el arranque, los ficheros de configuración de
   _GESTOR y el cambio de pantalla.

   Todo lo demás cuelga del objeto App, que se crea aquí. Cada fichero
   añade sus funciones a App, y así se llaman entre ellos sin que
   ninguno tenga que ser gigante.
   ============================================================ */

/* Todo cuelga de aquí. */
var App = {};

App.E = {
  abiertos: null,      /* carpeta de asuntos abiertos */
  archivo: null,       /* carpeta ARCHIVO */
  gestor: null,        /* _GESTOR, dentro de la de abiertos */
  datos: null,         /* _GESTOR/datos */
  usuario: '',
  tipos: [],
  tiposDocumento: [],
  estados: [],         /* estados de tramitación, compartidos en _GESTOR */
  campos: { propios: [], porTipo: {} },   /* los campos de cada tipo de asunto, ver js/campos.js */
  registro: { asuntos: {} },
  listaAbiertos: [],
  vista: 'departamento',   /* cuál de las tres tarjetas está elegida */
  listaArchivo: [],
  sueltos: [],         /* documentos sueltos en la carpeta de abiertos */
  reciales: {},        /* los que han llegado con la aplicación abierta */
  recienArchivados: {},
  ocupados: {},         /* asuntos con una acción larga en marcha: archivar, reabrir, renombrar, unir (fila 100) */  /* claves archivadas por este ordenador hace un instante (fila 90) */
  pendiente: null,     /* el suelto que se va a meter en el asunto que se está creando */
  nuevo: { tipo: null, categoria: null, tercero: null },
  /* Cuántas veces se ha preparado "Nuevo asunto" desde cero en esta
     sesión (fila 220, docs/CREAR-ASUNTO-DESDE-TODOS-LOS-SITIOS.md):
     App.prepararNuevo la sube en cada visita; lo mira quien complete
     algo en segundo plano para ese formulario (la lectura de un
     adjunto de correo, js/bandeja-adjuntos-lector.js) para no tocar un
     formulario que ya es de otra visita. */
  nuevoVisita: 0,
  archivoVisitado: false   /* fila 175: el Archivo carga solo la primera vez de la sesión */
};

/* Sale de la lista única de js/nombres.js (fila 166). */
App.DESCRIPCION_CATEGORIA = {};
if (typeof Nombres !== 'undefined') Nombres.CATEGORIAS.forEach(function (c) { App.DESCRIPCION_CATEGORIA[c] = Nombres.textoCategoria(c, 'descripcion'); });

App.CARPETA_GESTOR = '_GESTOR';
App.FICHERO_TIPOS = 'tipos.json';
App.FICHERO_TIPOS_DOC = 'tipos-documento.json';
App.FICHERO_ASUNTOS = 'asuntos.json';
App.FICHERO_ESTADOS = 'estados.json';
App.FICHERO_CAMPOS = 'campos.json';

App.TITULO = 'Gestor de Asuntos';
App.SEGUNDOS_ENTRE_MIRADAS = 20;

/* App.VERSION vive en js/version.js, cargado justo después de este
   fichero: así cambiar la versión no obliga a resubir nucleo.js
   entero, que es de los ficheros más grandes. */

/* El atajo de siempre para coger un elemento de la página. Es global
   para todos los ficheros de la aplicación, y también cuelga de App
   para que lo use el puente. */
function $(id) { return document.getElementById(id); }
App.$ = $;

/* ==========================================================
   ARRANQUE
   ========================================================== */

App.arrancar = async function () {
  if (!Carpetas.soportado()) {
    $('aviso-navegador').classList.remove('oculto');
    $('paso-carpetas').classList.add('oculto');
    return;
  }
  var a = await Almacen.leer('abiertos');
  var b = await Almacen.leer('archivo');
  var u = await Almacen.leer('usuario');
  if (a) { App.E.abiertos = a; App.marcarCarpeta('estado-abiertos', a.name); }
  if (b) { App.E.archivo = b; App.marcarCarpeta('estado-archivo', b.name); }
  if (u) { App.E.usuario = u; $('campo-usuario').value = u; }
  App.ponerVersion();
  App.revisarArranque();
  App.pintarListaUsuarios();
};

/* ---------- la lista de nombres de quien entra (19-sep-2026, fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 2) ----------

   Un desplegable con los nombres ya usados, más "Otro…" para escribir
   uno nuevo. Si la lista está vacía (primera vez, o sin permiso
   todavía sobre la carpeta), no se pinta nada y el campo de texto se
   comporta exactamente como hasta ahora. El campo de texto sigue
   siendo la fuente de verdad que lee btn-entrar: el desplegable solo
   le escribe el valor elegido y se aparta. */
App.pintarListaUsuarios = async function () {
  var lista = $('campo-usuario-lista');
  var campo = $('campo-usuario');
  if (!lista || !campo || !App.E.abiertos) return;
  var tienePermiso = await Carpetas.permiso(App.E.abiertos, false);
  if (!tienePermiso) return;

  /* Fila 459: sin crear `_GESTOR`. Si las carpetas se pasaron a Drive desde otro ordenador, aquí (Dropbox) ya no
     debe aparecer nada; en una carpeta recién señalada, sin `_GESTOR` no hay usuarios que enseñar. */
  var gestor;
  try { gestor = await App.E.abiertos.getDirectoryHandle(App.CARPETA_GESTOR); }
  catch (e) { return; }
  var nombres = await Usuarios.cargar(gestor);
  if (!nombres.length) return;

  lista.innerHTML = '';
  nombres.forEach(function (n) {
    var op = document.createElement('option');
    op.value = n;
    op.textContent = n;
    lista.appendChild(op);
  });
  var otro = document.createElement('option');
  otro.value = '';
  otro.textContent = 'Otro…';
  lista.appendChild(otro);

  var actual = campo.value.trim();
  if (actual && nombres.indexOf(actual) !== -1) {
    lista.value = actual;
    campo.classList.add('oculto');
  } else {
    lista.value = '';
    campo.classList.remove('oculto');
  }
  lista.classList.remove('oculto');

  lista.onchange = function () {
    if (lista.value) {
      campo.value = lista.value;
      campo.classList.add('oculto');
    } else {
      campo.value = '';
      campo.classList.remove('oculto');
      campo.focus();
    }
  };
};

/* El texto de la versión, con «· copia sin internet» añadido cuando
   se abre desde el disco (file://, fila 89, docs/COPIA-SIN-INTERNET.md),
   para saber cuál se está usando. Una sola función para las dos
   pantallas que pintan App.VERSION, en vez de repetir la condición. */
App.textoVersion = function () {
  return App.VERSION + (location.protocol === 'file:' ? ' · copia sin internet' : '');
};

/* La versión, también en la pantalla de entrada. Así se puede ver sin
   entrar si el navegador se ha quedado con una copia vieja. */
App.ponerVersion = function () {
  var nota = document.querySelector('#paso-carpetas .nota');
  if (!nota || nota.querySelector('.version')) return;
  var v = document.createElement('span');
  v.className = 'version suave';
  v.textContent = 'Versión ' + App.textoVersion();
  nota.appendChild(document.createElement('br'));
  nota.appendChild(v);
};

App.marcarCarpeta = function (id, nombre) {
  var d = $(id);
  d.textContent = nombre;
  d.classList.add('puesta');
};

App.revisarArranque = function () {
  $('btn-entrar').disabled = !(App.E.abiertos && App.E.archivo);
};

/* Si el usuario cierra el cuadro de elegir carpeta, el navegador devuelve
   AbortError y no hay nada que decir. Cualquier otro fallo sí se cuenta:
   callarlo dejaría el botón de Entrar apagado sin explicación. */
App.pedirCarpeta = async function (cual, idCuadro, idEstado) {
  try {
    var h = await Carpetas.elegir(idCuadro);
    App.E[cual] = h;
    App.marcarCarpeta(idEstado, h.name);
    App.revisarArranque();
    await Almacen.guardar(cual, h);
  } catch (e) {
    if (e.name === 'AbortError') return;
    U.aviso('No he podido usar esa carpeta: ' + U.mensajeDeError(e), 'malo');
  }
};

$('btn-abiertos').onclick = async function () {
  await App.pedirCarpeta('abiertos', 'gestor-abiertos', 'estado-abiertos');
  App.pintarListaUsuarios();
};

$('btn-archivo').onclick = function () {
  App.pedirCarpeta('archivo', 'gestor-archivo', 'estado-archivo');
};

$('btn-entrar').onclick = async function () {
  var M = window.Medidas ? Medidas.tiempo : function () { return function () {}; };   /* fila 332: cuánto tarda entrar */
  try {
    /* Fila 287 (docs/PERFIL-DIRECTIVO.md): el perfil se lee ANTES de proteger nada y sin crear nada. */
    if (window.Perfil) await Perfil.leerAntes(App.E.abiertos, $('campo-usuario').value.trim());
    /* Fila 260: en solo consulta, las dos carpetas van protegidas (js/solo-consulta.js). */
    if (window.SoloConsulta) {
      App.E.abiertos = SoloConsulta.proteger(App.E.abiertos);
      App.E.archivo = SoloConsulta.proteger(App.E.archivo);
    }
    var ok1 = await Carpetas.permiso(App.E.abiertos, true);
    var ok2 = await Carpetas.permiso(App.E.archivo, true);
    if (!ok1 || !ok2) {
      U.aviso('Sin permiso sobre alguna de las dos carpetas. Vuelve a elegirla.', 'malo');
      return;
    }
    /* Fila 459 (docs/PASAR-A-DRIVE.md): antes de crear nada, ¿las carpetas se pasaron a Drive desde otro ordenador, o esta
       es la copia sin internet vieja? Sale una franja y la entrada se para hasta señalar las de Drive. */
    if (window.CarpetasEnDrive && await CarpetasEnDrive.alEntrar(App.E.abiertos)) return;
    if (window.PermisosCarpetas) await PermisosCarpetas.pedirAlEntrar();   /* fila 318: el permiso de las carpetas recordadas */
    if (window.ActualizarCopia && ActualizarCopia.alEntrar && await ActualizarCopia.alEntrar()) return;   /* fila 325 */
    /* Fila 458 (docs/PASAR-A-DRIVE.md): si otro ordenador está pasando las carpetas a Drive, aquí solo se consulta. */
    if (window.PasarADrive && await PasarADrive.alEntrar(App.E.abiertos) && window.SoloConsulta) {
      App.E.abiertos = SoloConsulta.proteger(App.E.abiertos);
      App.E.archivo = SoloConsulta.proteger(App.E.archivo);
    }
    var finTotal = M('entrar.total');   /* después de los permisos y de la actualización (ahí espera a una persona) */
    App.E.usuario = $('campo-usuario').value.trim();
    await Almacen.guardar('usuario', App.E.usuario);

    App.E.gestor = await Carpetas.crear(App.E.abiertos, App.CARPETA_GESTOR);
    App.E.datos = await Carpetas.crear(App.E.gestor, 'datos');

    /* Fila 458: tras «Pasar a Drive», las fechas de modificación de antes de la copia (js/fechas-de-origen.js). */
    if (window.FechasOrigen && await FechasOrigen.cargar(App.E.gestor)) {
      App.E.abiertos = FechasOrigen.envolver(App.E.abiertos, 'abiertos/');
      App.E.archivo = FechasOrigen.envolver(App.E.archivo, 'archivo/');
      App.E.gestor = FechasOrigen.envolver(App.E.gestor, 'abiertos/' + App.CARPETA_GESTOR + '/');
      App.E.datos = FechasOrigen.envolver(App.E.datos, 'abiertos/' + App.CARPETA_GESTOR + '/datos/');
    }

    /* Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2): se lee
       `_GESTOR/rutas.json` ya de entrada, sin esperar a que alguien
       pulse el botón «Ruta» o abra Ajustes → El centro, para que
       `Nombres.topes()` pueda usar la ruta real desde el primer nombre
       que se proponga. Si falla, no pasa nada: los topes se quedan
       fijos, como siempre. */
    if (window.RutaCarpetas) RutaCarpetas.cargarComun().catch(function () { /* se queda con los topes fijos */ });

    var finComprobar = M('entrar.comprobar');
    var rotos = await Copias.comprobarTodos(App.E.gestor);
    finComprobar();
    if (rotos.length) {
      App.avisoFicherosRotos(rotos);
      return;
    }
    $('aviso-roto').classList.add('oculto');

    /* Después de comprobarTodos, nunca antes ni en paralelo: si esto
       escribiera a la vez que comprobarTodos lee, podría pillar
       usuarios.json a medio escribir y darlo por roto (pasó de
       verdad, fila 72). Se espera, para no dejarlo escribiendo de
       fondo mientras ya se está leyendo el resto de ficheros. */
    if (window.Usuarios && !(window.SoloConsulta && SoloConsulta.activo())) await Usuarios.anadirSiHaceFalta(App.E.gestor, App.E.usuario);   /* fila 260: en solo consulta no se apunta el nombre */

    var finCargar = M('entrar.cargar');
    await App.cargarTipos();
    await App.cargarTiposDocumento();
    if (window.TiposDocumentoCortos) await TiposDocumentoCortos.cargar();   /* fila 239 */
    await App.cargarCampos();
    if (window.Grupos) await Grupos.cargar();
    await App.cargarRegistro();
    if (window.InicioColumnas) await InicioColumnas.cargar();   /* fila 368: el orden de columnas de esta persona, antes del primer pintado */
    finCargar();

    Documentos.configurar({
      tipos: function () { return App.E.tiposDocumento; },
      curso: function (fecha) { return U.cursoDeFecha(fecha); },
      /* Para poder crear un tipo de documento desde el propio cuadro,
         sin ir a Ajustes. Se guarda en _GESTOR, así que lo ve todo el
         que abra la aplicación. */
      crearTipo: async function (nombre) {
        await Borrados.revivir(App.E.gestor, 'tiposDocumento', nombre);
        if (App.E.tiposDocumento.indexOf(nombre) === -1) App.E.tiposDocumento.push(nombre);
        await App.guardarTiposDocumento();
        return nombre;
      }
    });

    $('arranque').classList.add('oculto');
    $('aplicacion').classList.remove('oculto');
    $('usuario-pie').textContent = (App.E.usuario ? 'Sesión de ' + App.E.usuario + '  ·  ' : '') +
                                   'versión ' + App.textoVersion();
    App.E.vista = App.vistaGuardada();
    var finLista = M('entrar.lista');
    if (window.Medidas) Medidas.entrando = true;   /* esta lista es la de entrar, no un repintado */
    await App.verAbiertos();
    if (window.Medidas) Medidas.entrando = false;
    finLista();
    App.irVista(App.E.vista);
    finTotal();
    App.vigilarLaCarpeta();
    if (window.SoloConsulta) SoloConsulta.alEntrar();   /* fila 260 */
    if (window.NovedadesVentana) {   /* fila 248 */
      NovedadesVentana.hacerPulsable();
      NovedadesVentana.alEntrar();
    }
  } catch (e) {
    U.aviso('No he podido entrar: ' + U.mensajeDeError(e), 'malo');
  }
};
