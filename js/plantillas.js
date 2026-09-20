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
   no hacer crecer más este fichero.
   ============================================================ */
var Plantillas = (function () {

  var ARCHIVO = 'plantillas.json';
  var POR_DEFECTO_FIRMA = 'Un saludo.\n{usuario}\n{centro}';
  var POR_DEFECTO_CENTRO = 'IES Fuente Lucena';
  /* 20-sep-2026, fila 79, apartado 4.7: la dirección base del sistema
     de normativa del centro, para montar el enlace de una referencia.
     Vacía, las citas se ven sin enlace y no se rompe nada. */
  var POR_DEFECTO_NORMATIVA = 'https://normativa-escolarizacion.vercel.app';
  /* La caja del nombre de la Consejería sobre la imagen del membrete
     (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md): todo en
     porcentaje del ancho o del alto de la imagen, para que valga igual
     si el membrete se cambia por otro de distinto tamaño. La usa
     js/membrete.js. */
  var POR_DEFECTO_MEMBRETE_CAJA = { x: 10.3, y: 43.2, ancho: 20.7, alto: 10.0 };

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
    { clave: 'dni', etiqueta: 'DNI del alumnado' },
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
    { clave: 'formularios', etiqueta: 'Los formularios oficiales del tipo y de sus hitos, uno por línea' }
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
      /* El membrete (20-sep-2026, fila 81): la imagen vive en
         _GESTOR/PLANTILLAS/membrete.png (ver js/membrete.js), aquí
         solo el nombre de la Consejería y dónde escribirlo encima. */
      consejeria: l.consejeria || '',
      membreteCaja: (l.membreteCaja && typeof l.membreteCaja === 'object')
        ? Object.assign({}, POR_DEFECTO_MEMBRETE_CAJA, l.membreteCaja) : Object.assign({}, POR_DEFECTO_MEMBRETE_CAJA),
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
    return cache;
  }

  function olvidar() { cache = null; }

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
    return nuevo;
  }

  function deTipo(datos, categoria, tipo) {
    return ((datos && datos.lista) || []).filter(function (p) {
      return p.categoria === categoria && p.tipo === tipo;
    });
  }

  /* Las plantillas de documento de Word colgadas de un tipo. Una misma
     plantilla puede colgar de varios tipos, cada uno con su fila en
     `documentos` (docs/PLANTILLAS-DE-DOCUMENTO.md, 3.4). */
  function documentosDeTipo(datos, categoria, tipo) {
    return ((datos && datos.documentos) || []).filter(function (p) {
      return p.categoria === categoria && p.tipo === tipo;
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
  function resolverUnHueco(clave, valores, faltan) {
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
    if (!valor) faltan.push(nombreDeHueco(real));
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
    var conDobles = resolverHuecosDobles(conLoQueFalta, valores, faltan);
    var salida = conDobles.replace(/\{([^{}]+)\}/g, function (todo, dentro) {
      var clave = dentro.trim();
      var r = resolverUnHueco(clave, valores, faltan);
      if (!r.encontrado) { faltan.push(clave); return todo; }
      return r.valor;
    });
    return { texto: salida, faltan: faltan };
  }

  /* ==========================================================
     LOS VALORES DE UN ASUNTO (docs/PLANTILLAS-DE-DOCUMENTO.md, 3.1
     y 3.2)

     Hasta el 16-sep-2026 esto era `valoresDePlantilla()`, privada de
     js/correo.js, y solo traía lo que hacía falta para el correo:
     nombre, grupo, curso, tipo, hoy, limite, usuario, centro y
     `campos`. Aquí se amplía con lo que hace falta para las
     plantillas de documento —el DNI, los tutores, la referencia según
     la categoría, la fecha en letra, los datos del centro...— y se
     hace pública, para que js/docx.js y js/plantillas-documento.js la
     usen igual que js/correo.js.

     Un solo sitio que sepa de dónde sale cada valor: los teléfonos,
     correos y tutores se leen del CSV **por el título de su columna**
     (como js/dni.js), nunca por su posición y nunca desde
     `persona.campos` para saber si una columna EXISTE (esa solo trae
     las que tienen dato). Lo que no se encuentre se queda vacío: lo
     dice `Plantillas.rellenar` en `faltan`, no esta función. */

  function categoriaDelAsunto(a) {
    return (a && ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria))) || '';
  }

  function tipoDelAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    return l.tipo || f.tipo || '';
  }

  function terceroDelAsunto(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    if (f.tercero) return f.tercero;
    if (l.resto && window.Nombres) return Nombres.terceroDeResto(l.resto);
    return '';
  }

  /* El nombre sin el número de identificación ni el NIF pegado detrás:
     lo mismo que hace hoy js/correo.js para el saludo. */
  function soloElNombreDe(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* El grupo y el año académico, si la carpeta no tiene ficha (se creó
     a mano) se sacan del propio nombre, igual que en js/correo.js. */
  function piezasDelNombreDe(a) {
    var f = (a && a.ficha) || {}, l = (a && a.leido) || {};
    var resto = String(l.resto || '');
    var curso = f.curso || (resto.match(/\b(\d{2}[-\/]\d{2})\b/) || [])[1] || '';
    var grupo = f.grupo || (resto.match(/\b(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\b/i) || [])[1] || '';
    return { curso: curso, grupo: grupo };
  }

  /* {nombreNatural}: "Nombre Apellido1 Apellido2", sin el código que
     va pegado al final (el mismo que se le quita en
     Relacionados.nombreEnOrdenNormal). En empresas y otros no hay nada
     que dar la vuelta: se deja tal cual. */
  function nombreNaturalDe(texto, categoria) {
    var t = String(texto || '').trim();
    if (!t || categoria === 'EMPRESAS' || categoria === 'OTROS') return t;
    var coma = t.indexOf(',');
    if (coma === -1) return t;
    var apellidos = t.slice(0, coma).trim();
    var palabras = t.slice(coma + 1).trim().split(/\s+/);
    var ultima = palabras[palabras.length - 1] || '';
    if (palabras.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) palabras.pop();
    return (palabras.join(' ') + ' ' + apellidos).trim();
  }

  /* {referencia}: cambia según la categoría (3.2). */
  function referenciaDe(categoria, persona) {
    if (!persona) return '';
    if (categoria === 'ALUMNADO') return persona.id || '';
    if (categoria === 'PERSONAL') {
      var doc = String(persona.documento || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
      return doc.slice(-4);
    }
    if (categoria === 'EMPRESAS') return persona.nif || '';
    if (categoria === 'OTROS') return persona.referencia || '';
    return '';
  }

  var RE_TELEFONO = /telefono|movil/;
  var RE_CORREO = /correo|e-?mail/;

  /* El primer valor de `campos` cuyo título case con el patrón, leído
     por el título como js/dni.js y js/via-contacto.js. */
  function primerValorQueParezca(campos, patron) {
    var claves = Object.keys(campos || {});
    for (var i = 0; i < claves.length; i++) {
      if (!patron.test(U.normalizar(claves[i]))) continue;
      var v = String(campos[claves[i]] || '').trim();
      if (v) return v;
    }
    return '';
  }

  /* {tutor1}/{tutor2} y sus teléfonos y correos: solo alumnado. Desde
     el 17-sep-2026 (fila 28, docs/LO-PIDE.md) vive en js/lo-pide.js
     (`LoPide.opciones` también la necesita, para ofrecer "Tutor legal
     1/2" en "Lo pide"): aquí solo se llama, con lo de siempre si el
     módulo no ha cargado (por ejemplo, en una prueba que no lo carga). */
  function datosDeTutor(campos, numero) {
    if (window.LoPide) return LoPide.datosDeTutor(campos, numero);
    return { nombre: '', telefono: '', correo: '' };
  }

  /* El campo propio (js/campos.js) de un tipo de asunto, como nombre
     -> valor: lo mismo que hacía `camposDelAsunto` en js/correo.js. */
  function camposDelAsuntoDe(a) {
    if (!window.Campos || !window.App || !App.E) return {};
    var guardados = (a.ficha && a.ficha.campos) || {};
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipoDelAsunto(a)]) || [];
    var salida = {};
    config.forEach(function (cfg) {
      var g = guardados[Campos.claveDeCampo(cfg)];
      if (g && g.valor) salida[Campos.nombreDeCampo(cfg, App.E.campos)] = g.valor;
    });
    return salida;
  }

  var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                       'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function fechaLargaDe(d) {
    d = d || new Date();
    return d.getDate() + ' de ' + MESES_LARGOS[d.getMonth()] + ' de ' + d.getFullYear();
  }

  /* {registro}: el código de registro (`26EM1234`) del documento más
     reciente de la carpeta que ya lo lleve en el nombre, sin depender
     de js/documentos.js ni de la lista de tipos de documento. Si el
     asunto no tiene carpeta a mano (`a.handle`), o ningún documento
     está registrado, se queda vacío. */
  function ultimoRegistroDe(nombres) {
    var candidatos = (nombres || []).map(function (n) {
      var m = String(n || '').match(/^\d{6}\s+(\d{2}[ES][MA]\d{4,6})\b/);
      return m ? { nombre: n, codigo: m[1] } : null;
    }).filter(Boolean);
    if (!candidatos.length) return '';
    candidatos.sort(function (a, b) { return a.nombre < b.nombre ? 1 : -1; });
    return candidatos[0].codigo;
  }

  async function registroDelAsunto(a) {
    if (!a || !a.handle || !window.Carpetas) return '';
    try {
      var lista = await Carpetas.ficheros(a.handle);
      return ultimoRegistroDe(lista.map(function (f) { return f.nombre; }));
    } catch (e) { return ''; }
  }

  /* La persona (tercero) de este asunto, tal y como la trae el CSV de
     su categoría: es de ahí de donde salen el DNI, la referencia, los
     teléfonos, los correos y los tutores. `null` si no se encuentra o
     si no hay carpeta de datos señalada (por ejemplo, en las pruebas
     de lógica). */
  async function personaDelAsunto(categoria, terceroTexto) {
    if (!categoria || !terceroTexto || !window.Datos || !window.App || !App.E || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, terceroTexto, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, terceroTexto.replace(/[\s\d]+$/, ''), 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, soloElNombreDe(terceroTexto), 1);
      return lista.length ? lista[0] : null;
    } catch (e) { return null; }
  }

  /* Los datos del centro (firma, centro, localidad, dirección, código,
     cargo), ya normalizados. Se releen aquí en vez de fiarse de
     `cache`, para que valga aunque quien llame no haya llamado antes a
     `Plantillas.cargar`. */
  async function datosDelCentro() {
    if (window.App && App.E && App.E.gestor) {
      try { return await cargar(App.E.gestor); } catch (e) { /* sigue con lo que haya en cache */ }
    }
    return cache || limpio(null);
  }

  /* La función de la que habla 3.1: un solo argumento, el asunto tal y
     como lo trae `App.E.listaAbiertos`/`App.E.listaArchivo` (con
     `.ficha`, `.leido` y, si tiene carpeta, `.handle`). Async porque
     el DNI, los tutores y el registro salen de ficheros. */
  async function valoresDeAsunto(asunto, opciones) {
    var op = opciones || {};
    var a = asunto || {};
    var categoria = categoriaDelAsunto(a);
    var terceroTexto = terceroDelAsunto(a);
    var f = a.ficha || {};
    var p = piezasDelNombreDe(a);
    var datosCentro = await datosDelCentro();

    var persona = await personaDelAsunto(categoria, terceroTexto);
    var registro = await registroDelAsunto(a);

    var valores = {
      nombre: soloElNombreDe(terceroTexto),
      nombreNatural: nombreNaturalDe(terceroTexto, categoria),
      grupo: p.grupo,
      curso: p.curso,
      tipo: tipoDelAsunto(a),
      referencia: referenciaDe(categoria, persona),
      dni: (categoria === 'ALUMNADO' && window.Dni && persona) ? (Dni.de(persona) || '') : '',
      telefono: persona ? primerValorQueParezca(persona.campos, RE_TELEFONO) : '',
      correo: persona ? primerValorQueParezca(persona.campos, RE_CORREO) : '',
      tutor1: '', tutor1telefono: '', tutor1correo: '',
      tutor2: '', tutor2telefono: '', tutor2correo: '',
      descripcion: f.descripcion || '',
      estado: f.situacion || '',
      registro: registro,
      hoy: U.fechaLegible(U.aAaMmDd(U.hoyIso())),
      hoyLargo: fechaLargaDe(),
      lugarYFecha: (datosCentro.localidad ? 'En ' + datosCentro.localidad + ', a ' : 'A ') + fechaLargaDe(),
      limite: f.limite ? U.fechaLegible(U.aAaMmDd(f.limite)) : '',
      usuario: (window.App && App.E && App.E.usuario) || '',
      centro: datosCentro.centro || POR_DEFECTO_CENTRO,
      localidad: datosCentro.localidad || '',
      direccionCentro: datosCentro.direccion || '',
      codigoCentro: datosCentro.codigo || '',
      cargo: datosCentro.cargo || '',
      consejeria: datosCentro.consejeria || '',
      campos: camposDelAsuntoDe(a)
    };

    /* {{FORMULARIOS}} (20-sep-2026, fila 83, docs/PLANTILLAS-DEL-CENTRO.md,
       parte 3): los del tipo y de los hitos del asunto (fila 82), uno
       por línea, con su nombre y su dirección si la tiene. Sin
       ninguno, el hueco se queda vacío (nunca una línea suelta). */
    if (window.Formularios) {
      try {
        var clavesFormularios = await Formularios.clavesDelAsunto(a);
        var catalogoFormularios = await Formularios.cargar();
        valores.formularios = clavesFormularios.map(function (c) {
          var ficha = catalogoFormularios[c];
          if (!ficha) return '';
          return ficha.u ? (ficha.n + ' — ' + ficha.u) : ficha.n;
        }).filter(Boolean).join('\n');
      } catch (e) { valores.formularios = ''; }
    } else {
      valores.formularios = '';
    }

    /* {{FIRMANTE}} y compañía (20-sep-2026, fila 81): quien ocupaba el
       cargo firmante/de visto bueno de la PLANTILLA en la fecha del
       documento (la de hoy, salvo que `opciones.fecha` diga otra).
       `opciones.plantilla` es la fila de `documentos[]` que se está
       generando; sin ella (por ejemplo, para el correo, que no lleva
       firmante), estos huecos se quedan vacíos, como cualquier otro
       dato que falte. */
    var fechaDelDocumento = op.fecha || U.hoyIso();
    valores.firmante = ''; valores['cargo firmante'] = ''; valores['tratamiento firmante'] = '';
    valores['visto bueno'] = ''; valores['cargo visto bueno'] = ''; valores['tratamiento visto bueno'] = '';
    if (op.plantilla && window.Cargos) {
      if (op.plantilla.firmante) {
        var firmante = await Cargos.enFecha(op.plantilla.firmante, fechaDelDocumento);
        if (firmante) {
          valores.firmante = firmante.persona;
          valores['cargo firmante'] = firmante.nombre;
          valores['tratamiento firmante'] = firmante.tratamiento;
        }
      }
      if (op.plantilla.vistoBueno) {
        var vistoBueno = await Cargos.enFecha(op.plantilla.vistoBueno, fechaDelDocumento);
        if (vistoBueno) {
          valores['visto bueno'] = vistoBueno.persona;
          valores['cargo visto bueno'] = vistoBueno.nombre;
          valores['tratamiento visto bueno'] = vistoBueno.tratamiento;
        }
      }
    }

    /* {quienlopide} y compañía (17-sep-2026, fila 28, docs/LO-PIDE.md):
       vacíos, como cualquier otro hueco, cuando el asunto no tiene el
       dato; así salen en "Faltan datos" sin nada especial que hacer
       aquí. */
    var loPideDato = f.loPide || null;
    valores.quienlopide = loPideDato ? (loPideDato.nombre || '') : '';
    valores.quienlopiderelacion = loPideDato ? (loPideDato.relacion || '') : '';
    var viaLoPide = (loPideDato && loPideDato.via && window.Nombres) ? Nombres.via(loPideDato.via) : null;
    valores.quienlopidevia = viaLoPide ? viaLoPide.texto : '';
    valores.quienlopidefecha = (loPideDato && loPideDato.fecha)
      ? U.fechaLegible(U.aAaMmDd(loPideDato.fecha)) : '';

    if (categoria === 'ALUMNADO' && persona) {
      var t1 = datosDeTutor(persona.campos, 1);
      var t2 = datosDeTutor(persona.campos, 2);
      valores.tutor1 = t1.nombre; valores.tutor1telefono = t1.telefono; valores.tutor1correo = t1.correo;
      valores.tutor2 = t2.nombre; valores.tutor2telefono = t2.telefono; valores.tutor2correo = t2.correo;
    }

    /* {firma}: el texto de la firma del centro, ya con sus propios
       huecos ({usuario}, {centro}...) sustituidos por lo de arriba. */
    valores.firma = rellenar(datosCentro.firma || POR_DEFECTO_FIRMA, valores).texto;

    return valores;
  }

  var API = {
    ARCHIVO: ARCHIVO, HUECOS: HUECOS,
    POR_DEFECTO_FIRMA: POR_DEFECTO_FIRMA, POR_DEFECTO_CENTRO: POR_DEFECTO_CENTRO,
    POR_DEFECTO_NORMATIVA: POR_DEFECTO_NORMATIVA, POR_DEFECTO_MEMBRETE_CAJA: POR_DEFECTO_MEMBRETE_CAJA,
    cargar: cargar, olvidar: olvidar, guardar: guardar,
    deTipo: deTipo, idNuevo: idNuevo, rellenar: rellenar, tieneLoQueFalta: tieneLoQueFalta,
    documentosDeTipo: documentosDeTipo, idNuevoDocumento: idNuevoDocumento,
    valoresDeAsunto: valoresDeAsunto
  };

  /* El bloque "Plantillas de correo" de Ajustes vive en
     js/plantillas-ajustes.js: este fichero creció con el motor de las
     plantillas de documento (fila 17 de docs/COLA.md) y pasaba de las
     450 líneas, así que el bloque de pantalla se sacó de aquí sin
     cambiar lo que hace. El bloque "Plantillas de documento" es
     hermano, en js/plantillas-documento.js. */

  return API;
})();
