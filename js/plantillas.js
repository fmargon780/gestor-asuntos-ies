/* ============================================================
   plantillas.js — plantillas de correo, de mensaje de Séneca y de
   documento de Word (16-sep-2026, docs/PLANTILLAS-DE-CORREO.md y
   docs/PLANTILLAS-DE-DOCUMENTO.md).

   Una plantilla de correo es solo el cuerpo del medio: el saludo y la
   firma los sigue poniendo js/correo.js, solos. La misma plantilla
   sirve para el correo y para el mensaje de Séneca. Se crean en
   Ajustes, pegadas al tipo de asunto, y se guardan en
   _GESTOR/plantillas.json, compartido con el compañero.

   Desde la fila 17 de docs/COLA.md, el mismo fichero y el mismo motor
   de huecos sirven también para las plantillas de documento de Word
   (`js/docx.js` y `js/plantillas-documento.js`, que cuelgan de la
   clave `documentos`): es el gemelo en papel de las de correo, con la
   misma sintaxis de una sola llave.

   Este fichero solo trae el módulo `Plantillas`: leer y guardar
   `plantillas.json`, montar los valores de un asunto y rellenar los
   huecos de un texto. Lo usan js/correo.js, js/docx.js y
   js/plantillas-documento.js. El bloque "Plantillas de correo" de
   Ajustes vive en js/plantillas-ajustes.js, y el bloque "Plantillas
   de documento" en js/plantillas-documento.js: los dos aparte, para
   no hacer crecer más este fichero. Desde la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), los valores de un asunto
   (`valoresDeAsunto`) viven en js/plantillas-valores.js.
   ============================================================ */
var Plantillas = (function () {

  var ARCHIVO = 'plantillas.json';
  var POR_DEFECTO_FIRMA = 'Un saludo.\n{usuario}\n{centro}';
  var POR_DEFECTO_CENTRO = 'IES Fuente Lucena';
  /* 20-sep-2026, fila 79, apartado 4.7: la dirección base del sistema
     de normativa del centro, para montar el enlace de una referencia.
     Vacía, las citas se ven sin enlace y no se rompe nada. */
  var POR_DEFECTO_NORMATIVA = 'https://normativa-escolarizacion.vercel.app';
  /* Fila 149 (docs/MEMBRETE-LETRA-DEL-MANUAL.md): la Consejería del
     membrete, si Ajustes la deja vacía (nombre vigente desde julio de 2026). */
  var POR_DEFECTO_CONSEJERIA = 'Consejería de Educación';

  /* Los huecos que se conocen, con el nombre en cristiano que se
     enseña en Ajustes y en el aviso de "Faltan datos". `{campo:LO QUE
     SEA}` es aparte: vale para cualquier campo propio del tipo.

     Desde la fila 17, sirve también para las plantillas de documento:
     `Plantillas.valoresDeAsunto` monta el valor de cada uno. */
  var HUECOS = [
    { clave: 'nombre', etiqueta: 'Nombre del tercero' },
    { clave: 'nombreNatural', etiqueta: 'Nombre del tercero, en orden normal' },
    { clave: 'grupo', etiqueta: 'Grupo' },
    { clave: 'curso', etiqueta: 'Año académico' },
    { clave: 'tipo', etiqueta: 'Tipo de asunto' },
    { clave: 'referencia', etiqueta: 'Nº escolar, documento o NIF del tercero' },
    { clave: 'dni', etiqueta: 'DNI del alumnado o del personal' },
    { clave: 'telefono', etiqueta: 'Teléfono del tercero' },
    { clave: 'correo', etiqueta: 'Correo del tercero' },
    { clave: 'tutor1', etiqueta: 'Nombre del primer tutor' },
    { clave: 'tutor1telefono', etiqueta: 'Teléfono del primer tutor' },
    { clave: 'tutor1correo', etiqueta: 'Correo del primer tutor' },
    { clave: 'tutor2', etiqueta: 'Nombre del segundo tutor' },
    { clave: 'tutor2telefono', etiqueta: 'Teléfono del segundo tutor' },
    { clave: 'tutor2correo', etiqueta: 'Correo del segundo tutor' },
    { clave: 'descripcion', etiqueta: 'Descripción del asunto' },
    { clave: 'estado', etiqueta: 'Estado de tramitación' },
    { clave: 'registro', etiqueta: 'Nº de registro de Séneca del asunto' },
    { clave: 'hoy', etiqueta: 'Fecha de hoy' },
    { clave: 'hoyLargo', etiqueta: 'Fecha de hoy, en letra' },
    { clave: 'lugarYFecha', etiqueta: 'Lugar y fecha, en letra' },
    { clave: 'limite', etiqueta: 'Fecha límite' },
    { clave: 'usuario', etiqueta: 'Quien firma' },
    { clave: 'centro', etiqueta: 'Nombre del centro' },
    { clave: 'localidad', etiqueta: 'Localidad del centro' },
    { clave: 'provincia', etiqueta: 'Provincia del centro' },
    { clave: 'direccionCentro', etiqueta: 'Dirección del centro' },
    { clave: 'codigoCentro', etiqueta: 'Código del centro' },
    { clave: 'cargo', etiqueta: 'Cargo de quien firma' },
    { clave: 'firma', etiqueta: 'Firma completa, ya rellena' },
    /* "Lo pide" (17-sep-2026, fila 28, docs/LO-PIDE.md): quién ha
       pedido esta gestión, si se ha apuntado. */
    { clave: 'quienlopide', etiqueta: 'Quien lo pide' },
    { clave: 'quienlopiderelacion', etiqueta: 'Quien lo pide: qué es del interesado' },
    { clave: 'quienlopidevia', etiqueta: 'Quien lo pide: por dónde lo pidió' },
    { clave: 'quienlopidefecha', etiqueta: 'Quien lo pide: fecha' },
    /* "Pedir lo que falta" (18-sep-2026, fila 59, docs/REQUISITOS-DE-HITO.md,
       sección 7): un hueco distinto, con doble llave a propósito, para
       que se note que no es un dato del asunto como los demás, sino un
       bloque de varias líneas que solo tiene texto cuando se abre el
       cuadro de Correo o de Séneca desde el botón "Pedir lo que falta"
       de un hito. Fuera de ese camino se sustituye por nada, nunca se
       deja escrito: ver `tieneLoQueFalta` y `rellenar`, más abajo. Su
       `clave` lleva ya las llaves para que el botón "Insertar hueco"
       (js/huecos-buscador.js, que lee este mismo catálogo) meta el
       texto exacto sin tocar ese fichero. */
    { clave: '{LO QUE FALTA}', etiqueta: 'Lo que hay que reunir, sin marcar (desde un hito)' },
    /* Los firmantes y el membrete (20-sep-2026, fila 81,
       docs/FIRMANTES-Y-MEMBRETE.md): con doble llave, como {{LO QUE
       FALTA}}, porque se resuelven aparte (`resolverHuecosDobles`, más
       abajo) antes de que la sustitución normal los vea; así un
       nombre con espacio ("CARGO FIRMANTE") no deja restos de llave
       suelta. {{MEMBRETE}} no está en este catálogo: no es un dato de
       texto, lo consume `Docx.ponerImagen` antes de llegar aquí. */
    /* Desde un hito (23-sep-2026, fila 102, docs/DOCUMENTOS-DESDE-EL-HITO.md):
       fuera de ese camino se sustituyen por nada y no cuentan como dato
       que falta (SIN_FALTA, más abajo). `{hecho:TÍTULO DE OTRO HITO}`
       va aparte, como `{campo:...}`. */
    { clave: 'hito', etiqueta: 'El hito desde el que se genera o se comunica' },
    { clave: 'plazo del hito', etiqueta: 'La fecha límite de ese hito' },
    { clave: 'firmante', etiqueta: 'Quien firma el documento (según el cargo, en su fecha)' },
    { clave: 'cargo firmante', etiqueta: 'El cargo de quien firma' },
    { clave: 'tratamiento firmante', etiqueta: 'El tratamiento de quien firma ("El Director")' },
    { clave: 'visto bueno', etiqueta: 'Quien da el visto bueno' },
    { clave: 'cargo visto bueno', etiqueta: 'El cargo del visto bueno' },
    { clave: 'tratamiento visto bueno', etiqueta: 'El tratamiento del visto bueno' },
    { clave: 'consejeria', etiqueta: 'El nombre de la Consejería, para el membrete' },
    /* 20-sep-2026, fila 83, docs/PLANTILLAS-DEL-CENTRO.md, parte 3:
       los formularios oficiales del tipo y de los hitos del asunto
       (fila 82), uno por línea. Doble llave, como el resto de este
       grupo. */
    { clave: 'formularios', etiqueta: 'Los formularios oficiales del tipo y de sus hitos, uno por línea' },
    /* Las tablas de datos (24-sep-2026, fila 110, docs/TABLAS-DE-DATOS.md,
       js/tablas-datos.js): la especialidad (el puesto en los RelPerCen) y
       la tabla de periodos de tutoría del tercero. Los generales,
       {{DATO <tabla>: <columna>}} y {{TABLA <tabla>: <col1> | <col2>}}, van
       aparte, como {campo:...}. Sin dato, «[falta: …]» en amarillo. */
    { clave: 'especialidad', etiqueta: 'Especialidad del profesor (del RelPerCen)' },
    /* Fila 123 (docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md): la de quien firma y
       la de quien da el visto bueno, buscados en el personal por su nombre. */
    { clave: 'especialidad firmante', etiqueta: 'Especialidad de quien firma (del RelPerCen)' },
    { clave: 'especialidad visto bueno', etiqueta: 'Especialidad de quien da el visto bueno (del RelPerCen)' },
    { clave: '{TABLA TUTORIAS}', etiqueta: 'Tabla de periodos de tutoría: cargo, curso, toma de posesión y cese' },
    { clave: '{DATO tabla: columna}', etiqueta: 'Un dato suelto de una tabla de datos (el de su curso más reciente)' },
    { clave: '{TABLA tabla: columna | columna}', etiqueta: 'Una tabla de datos entera, con esas columnas' }
  ];

  var cache = null;

  function limpio(leido) {
    var l = (leido && typeof leido === 'object') ? leido : {};
    return {
      firma: l.firma || POR_DEFECTO_FIRMA,
      centro: l.centro || POR_DEFECTO_CENTRO,
      localidad: l.localidad || '',
      direccion: l.direccion || '',
      codigo: l.codigo || '',
      /* 20-sep-2026, fila 84, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md:
         para el hueco {{PROVINCIA}} de un impreso oficial. Solo se usa
         ahí (no entra en Plantillas.HUECOS: los impresos rellenan
         casillas de PDF por su nombre, no huecos de texto). */
      provincia: l.provincia || '',
      cargo: l.cargo || '',
      direccionNormativa: (typeof l.direccionNormativa === 'string') ? l.direccionNormativa : POR_DEFECTO_NORMATIVA,
      /* El membrete (fila 149): lo dibuja entero js/membrete.js; aquí solo
         el nombre de la Consejería (el del centro es `centro`). Las claves
         `membreteCaja` que queden de la fila 81 se ignoran. */
      consejeria: l.consejeria || '',
      lista: Array.isArray(l.lista) ? l.lista : [],
      /* Plantillas de documento de Word (docs/PLANTILLAS-DE-DOCUMENTO.md,
         3.4): { id, categoria, tipo, nombre, fichero, tipoDocumento,
         texto }. Un fichero viejo sin esta clave sigue cargando igual. */
      documentos: Array.isArray(l.documentos) ? l.documentos : []
    };
  }

  /* Si el fichero no existe todavía, sale lo de siempre (la firma y el
     centro que hasta hoy estaban escritos en js/correo.js) y no falla
     nada: se crea de verdad al primer guardado.

     Se relee cada vez, sin guardar en caché entre llamadas: es un
     fichero compartido con el compañero, y el cuadro de Correo lo pide
     una vez por apertura, así que releerlo no cuesta nada y evita que
     un cambio suyo se quede sin ver. `cache` solo sirve para que el
     propio bloque de Ajustes, mientras está abierto, no tenga que
     volver a leer el fichero en cada tecla de su buscador. */
  async function cargar(gestor) {
    var leido = null;
    try { leido = gestor ? await Carpetas.leerJson(gestor, ARCHIVO) : null; } catch (e) { leido = null; }
    cache = limpio(leido);
    cacheEl = Date.now();
    return cache;
  }

  /* Para lo que se pregunta a menudo y solo PINTA (el botón «Generar
     documento» de la ficha, que antes releía el fichero en cada tanda
     de cambios de la pantalla): lo leído hace menos de `ms`, sin
     volver al disco (fila 101, docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md).
     Guardar lo pone al día; `olvidar` lo tira. */
  var cacheEl = 0;
  function cargarReciente(gestor, ms) {
    if (cache && Date.now() - cacheEl < (ms || 60000)) return Promise.resolve(cache);
    return cargar(gestor);
  }

  function olvidar() { cache = null; cacheEl = 0; }

  /* Como Campos.guardarPropios: relee lo de verdad (no lo que hubiera
     en caché, que puede estar viejo si el compañero ha guardado algo
     mientras tanto), aplica `mutar` y guarda. */
  async function guardar(gestor, mutar) {
    var leido = null;
    try { leido = await Carpetas.leerJson(gestor, ARCHIVO); } catch (e) { leido = null; }
    var actual = limpio(leido);
    var nuevo = mutar(actual) || actual;
    await Copias.guardar(gestor, ARCHIVO, nuevo);
    cache = nuevo;
    cacheEl = Date.now();
    return nuevo;
  }

  /* Fila 126: casa con el tipo por cualquiera de sus nombres (el de hoy,
     el corto o uno de antes, js/tipos-nombre.js). */
  function nombresDelTipo(tipo) {
    return window.TiposNombre ? TiposNombre.nombresDe(tipo) : [U.normalizar(tipo || '')];
  }

  function deTipo(datos, categoria, tipo) {
    var nombres = nombresDelTipo(tipo);
    return ((datos && datos.lista) || []).filter(function (p) {
      return p.categoria === categoria && (p.tipo === tipo || nombres.indexOf(U.normalizar(p.tipo || '')) !== -1);
    });
  }

  /* Las plantillas de documento de Word colgadas de un tipo. Una misma
     plantilla puede colgar de varios tipos, cada uno con su fila en
     `documentos` (docs/PLANTILLAS-DE-DOCUMENTO.md, 3.4). */
  /* Una plantilla de documento por su id, con lo último que se leyó
     (síncrona, para pintar). `undefined` si todavía no se ha leído
     nada; `null` si no existe (borrada). Fila 102. */
  function documentoPorId(id) {
    if (!cache) return undefined;
    return (cache.documentos || []).filter(function (d) { return d.id === id; })[0] || null;
  }

  function documentosDeTipo(datos, categoria, tipo) {
    var nombres = nombresDelTipo(tipo);
    return ((datos && datos.documentos) || []).filter(function (p) {
      /* Sin tildes ni mayúsculas (fila 123): «DESEMPEÑO FUNCION TUTORIAL»
         casa con la plantilla de «DESEMPEÑO FUNCIÓN TUTORIAL». */
      return p.categoria === categoria && nombres.indexOf(U.normalizar(p.tipo || '')) !== -1;
    });
  }

  function idNuevo() { return 'pl-' + Date.now() + Math.floor(Math.random() * 1000); }
  function idNuevoDocumento() { return 'pd-' + Date.now() + Math.floor(Math.random() * 1000); }

  function nombreDeHueco(clave) {
    var h = HUECOS.filter(function (x) { return x.clave === clave; })[0];
    return h ? h.etiqueta : clave;
  }

  /* Las llaves se comparan sin mayúsculas ni acentos, nunca al
     sustituir: el valor que trae el campo se escribe tal cual. */
  function buscarCampo(campos, nombre) {
    var normal = U.normalizar(nombre);
    var clave = Object.keys(campos || {}).filter(function (k) { return U.normalizar(k) === normal; })[0];
    return clave ? campos[clave] : '';
  }

  /* Sustituye {hueco} y {campo:LO QUE SEA} de un texto.

     `valores` trae lo que se sepa del asunto: nombre, grupo, curso,
     tipo, hoy, limite, usuario, centro, y `campos` (un objeto nombre
     de campo -> valor). Un hueco sin valor se deja vacío —nunca se
     escribe {grupo} en lo que le llega al tercero— y se apunta en
     `faltan`; uno que no se reconozca se deja tal cual (para no
     romper nada) y también se apunta. */
  /* Los huecos "conocidos" son todos los del catálogo: así, añadir uno
     a HUECOS basta para que rellenar() lo trate como tal (vacío si no
     hay dato, nunca dejado tal cual). */
  var CONOCIDOS = HUECOS.map(function (h) { return h.clave; });

  /* `{{LO QUE FALTA}}` (18-sep-2026, fila 59, sección 7 del encargo):
     va con dos llaves a propósito, para poder sustituirlo ANTES que el
     resto (con una sola pasada de regex nunca se distinguiría de un
     hueco corriente que se llamase "LO QUE FALTA"), y para poder
     sustituirlo siempre —incluso por nada, cuando `valores.loQueFalta`
     no llega— sin que cuente como un dato que falta. */
  function reLoQueFalta(conG) {
    return new RegExp('\\{\\{\\s*LO QUE FALTA\\s*\\}\\}', 'i' + (conG ? 'g' : ''));
  }

  function tieneLoQueFalta(texto) {
    return reLoQueFalta(false).test(String(texto || ''));
  }

  /* Resuelve un hueco ya reconocido (o "{campo:...}"), y apunta en
     `faltan` si no hay dato. Común a la llave sencilla y a la doble
     (`resolverHuecosDobles`, más abajo). */
  var SIN_FALTA = ['hito', 'plazo del hito'];

  /* Fila 155 (docs/WORD-DENTRO-DE-LA-APP.md, A): lo escrito a mano en
     «Faltan datos para este documento», por el mismo nombre con el que
     salió en `faltan` (el hueco tal cual, o el campo sin «campo:»).
     Solo para ese documento: no se guarda en ninguna ficha. */
  function escritoAMano(clave, valores) {
    var aMano = valores && valores.aMano;
    if (!aMano) return null;
    var candidatos = [clave, clave.replace(/^campo\s*:/i, '').trim()];
    for (var i = 0; i < candidatos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(aMano, candidatos[i]) && String(aMano[candidatos[i]]).trim()) return String(aMano[candidatos[i]]);
    }
    return null;
  }

  function resolverUnHueco(clave, valores, faltan) {
    var escrito = escritoAMano(clave, valores);
    if (escrito !== null) return { encontrado: true, valor: escrito };
    /* {hecho:TÍTULO} (fila 102): la fecha en que se marcó hecho otro
       hito del asunto, buscado por su título sin mayúsculas ni tildes.
       Fuera del camino de un hito (sin `valores.hechos`), vacío y sin
       contar como dato que falta. */
    if (/^hecho\s*:/i.test(clave)) {
      var titulo = clave.replace(/^hecho\s*:/i, '').trim();
      if (!valores.hechos) return { encontrado: true, valor: '' };
      var fechaHecho = valores.hechos[U.normalizar(titulo)] || '';
      if (!fechaHecho) faltan.push('hecho: ' + titulo);
      return { encontrado: true, valor: fechaHecho };
    }
    /* Las tablas de datos (fila 110): js/tablas-datos.js ya las ha
       resuelto en `valores.datosTablas` (o metido la tabla en su sitio).
       Fuera de un documento, nada y sin contar como falta. */
    if (/^(dato|tabla)\s/i.test(clave)) {
      return { encontrado: true, valor: (valores.datosTablas && valores.datosTablas[U.normalizar(clave)]) || '' };
    }
    if (/^campo\s*:/i.test(clave)) {
      var nombreCampo = clave.replace(/^campo\s*:/i, '').trim();
      var valorCampo = buscarCampo(valores.campos, nombreCampo);
      if (!valorCampo) faltan.push(nombreCampo);
      return { encontrado: true, valor: valorCampo || '' };
    }
    /* Sin espacios en ninguno de los dos lados: así "{{NOMBRE NATURAL}}"
       (20-sep-2026, fila 83, la forma en la que se escriben los huecos
       en las plantillas del centro, con doble llave y en mayúsculas
       sueltas) encuentra la clave `nombreNatural` del catálogo, sin
       tener que mantener dos formas del mismo nombre. */
    function sinEspacios(t) { return U.normalizar(t).replace(/\s+/g, ''); }
    var real = CONOCIDOS.filter(function (c) { return sinEspacios(c) === sinEspacios(clave); })[0];
    if (!real) return { encontrado: false, valor: '' };
    var valor = valores[real] || '';
    /* Fila 155: sin dato, lo escrito a mano con el nombre con el que salió en `faltan`. */
    if (!valor) { var aMano = escritoAMano(nombreDeHueco(real), valores); if (aMano !== null) valor = aMano; }
    if (!valor && SIN_FALTA.indexOf(real) === -1) faltan.push(nombreDeHueco(real));
    return { encontrado: true, valor: valor };
  }

  /* {{FIRMANTE}}, {{CARGO FIRMANTE}}, {{CONSEJERIA}}... (20-sep-2026,
     fila 81) y, más adelante, {{FORMULARIOS}} (fila 82): con doble
     llave, resueltos ANTES de la llave sencilla. Así un nombre con
     espacio ("CARGO FIRMANTE") no deja las llaves de fuera sueltas en
     el papel: si no se reconoce, se deja tal cual (por si algún día
     queda una llave doble sin resolver, como {{MEMBRETE}} si se
     escribiera en un sitio que no sea `word/document.xml`). */
  function resolverHuecosDobles(texto, valores, faltan) {
    return String(texto || '').replace(/\{\{([^{}]+)\}\}/g, function (todo, dentro) {
      var r = resolverUnHueco(dentro.trim(), valores, faltan);
      return r.encontrado ? r.valor : todo;
    });
  }

  function rellenar(texto, valores) {
    valores = valores || {};
    var conLoQueFalta = String(texto || '').replace(reLoQueFalta(true), function () {
      return valores.loQueFalta || '';
    });
    var faltan = [];
    /* Fila 111 (js/genero.js): con los sexos del asunto, «alumno/a» se
       queda en la forma que toca; sin el dato, tal cual y en `faltan`. */
    if (valores.sexos && window.Genero) {
      var g = Genero.resolver(conLoQueFalta, valores.sexos);
      conLoQueFalta = g.texto;
      Object.keys(g.sinResolver).forEach(function (q) { faltan.push(Genero.dondePonerlo(q, valores.categoria)); });
    }
    var conDobles = resolverHuecosDobles(conLoQueFalta, valores, faltan);
    var salida = conDobles.replace(/\{([^{}]+)\}/g, function (todo, dentro) {
      var clave = dentro.trim();
      var r = resolverUnHueco(clave, valores, faltan);
      if (!r.encontrado) { faltan.push(clave); return todo; }
      return r.valor;
    });
    return { texto: salida, faltan: faltan };
  }


  var API = {
    ARCHIVO: ARCHIVO, HUECOS: HUECOS,
    POR_DEFECTO_FIRMA: POR_DEFECTO_FIRMA, POR_DEFECTO_CENTRO: POR_DEFECTO_CENTRO,
    POR_DEFECTO_NORMATIVA: POR_DEFECTO_NORMATIVA, POR_DEFECTO_CONSEJERIA: POR_DEFECTO_CONSEJERIA,
    cargar: cargar, cargarReciente: cargarReciente, olvidar: olvidar, guardar: guardar,
    documentoPorId: documentoPorId, enMemoria: function () { return cache; },
    deTipo: deTipo, idNuevo: idNuevo, rellenar: rellenar, tieneLoQueFalta: tieneLoQueFalta,
    documentosDeTipo: documentosDeTipo, idNuevoDocumento: idNuevoDocumento,
    /* Fila 133: lo que usa js/plantillas-valores.js (valoresDeAsunto, que
       vive allí y se cuelga de este mismo objeto con su nombre de siempre). */
    _interno: {
      POR_DEFECTO_CENTRO: POR_DEFECTO_CENTRO, POR_DEFECTO_CONSEJERIA: POR_DEFECTO_CONSEJERIA, POR_DEFECTO_FIRMA: POR_DEFECTO_FIRMA,
      cargar: cargar, limpio: limpio, rellenar: rellenar
    }
  };

  /* El bloque "Plantillas de correo" de Ajustes vive en
     js/plantillas-ajustes.js: este fichero creció con el motor de las
     plantillas de documento (fila 17 de docs/COLA.md) y pasaba de las
     450 líneas, así que el bloque de pantalla se sacó de aquí sin
     cambiar lo que hace. El bloque "Plantillas de documento" es
     hermano, en js/plantillas-documento.js. */

  return API;
})();
