/* ============================================================
   nombres.js — cómo se llama una carpeta de asunto.

   El nombre es la ficha del asunto. Si siempre se monta igual,
   el archivo se puede leer entero años después sin más ayuda.

       AAMMDD  TIPO  [AÑO ACADÉMICO]  [GRUPO]  [CAMPOS]  [DESCRIPCIÓN]  TERCERO

   Ejemplo:  260907 MATRICULA 26-27 3ºA Cordero Navas, Lucía 1139877

   Desde el 11-sep-2026, entre el grupo y la descripción pueden entrar
   los campos que el tipo de asunto tenga configurados en Ajustes (ver
   js/campos.js), en su mismo orden: unidad, modalidad, lo que sea.
   Quien decide qué valores entran ahí es quien llama a `montar`; este
   fichero solo los limpia y los coloca. El interruptor viejo del grupo
   y los campos no suelen darse a la vez: si el tipo ya lleva la unidad
   o el curso como campo, el interruptor del grupo se esconde (lo hace
   js/asuntos-nuevo.js), para que no salga dos veces.
   ============================================================ */
var Nombres = (function () {
  var I = NombresNucleo;
  var POR_DEFECTO = I.POR_DEFECTO;
  var CATEGORIAS = I.CATEGORIAS;
  var TEXTOS_CATEGORIA = I.TEXTOS_CATEGORIA;
  function textoCategoria() { return I.textoCategoria.apply(this, arguments); }
  function opcionesCategorias() { return I.opcionesCategorias.apply(this, arguments); }
  function tipoParaCarpeta() { return I.tipoParaCarpeta.apply(this, arguments); }
  function tipoParaVer() { return I.tipoParaVer.apply(this, arguments); }
  function nombresDeTipo() { return I.nombresDeTipo.apply(this, arguments); }
  function montar() { return I.montar.apply(this, arguments); }
  var TOPE_ASUNTO = I.TOPE_ASUNTO;
  var TOPE_DOCUMENTO = I.TOPE_DOCUMENTO;
  function topesDeHoy() { return I.topesDeHoy.apply(this, arguments); }
  function unir() { return I.unir.apply(this, arguments); }
  function ajustarAlTope() { return I.ajustarAlTope.apply(this, arguments); }
  function montarAsunto() { return I.montarAsunto.apply(this, arguments); }
  function grupoCompacto() { return I.grupoCompacto.apply(this, arguments); }
  function nivelYEnsenanza() { return I.nivelYEnsenanza.apply(this, arguments); }
  function leer() { return I.leer.apply(this, arguments); }
  function acortarNombrePila() { return I.acortarNombrePila.apply(this, arguments); }
  function claveDeTercero() { return I.claveDeTercero.apply(this, arguments); }
  function carpetaDeTercero() { return I.carpetaDeTercero.apply(this, arguments); }
  function terceroAlumno() { return I.terceroAlumno.apply(this, arguments); }
  function terceroDeResto() { return I.terceroDeResto.apply(this, arguments); }
  function cursoYGrupoDeResto() { return I.cursoYGrupoDeResto.apply(this, arguments); }
  function terceroPersonal() { return I.terceroPersonal.apply(this, arguments); }
  function terceroTutor() { return I.terceroTutor.apply(this, arguments); }
  function terceroAdministracion() { return I.terceroAdministracion.apply(this, arguments); }
  function terceroEmpresa() { return I.terceroEmpresa.apply(this, arguments); }

  /* 'espera' quiere decir que el trabajo está fuera del departamento:
     lo nuestro está hecho y toca esperar a que otro conteste, firme o
     traiga algo. Esos asuntos se enseñan aparte, para no mezclarlos con
     los que hay que gestionar hoy. */
  var ESTADOS_POR_DEFECTO = [
    { nombre: 'PENDIENTE',               espera: false },
    { nombre: 'EN TRÁMITE',              espera: false },
    { nombre: 'ENVIADO A FIRMA',         espera: true  },
    { nombre: 'FIRMADO',                 espera: false },
    { nombre: 'A LA ESPERA DEL TERCERO', espera: true  },
    { nombre: 'RESUELTO',                espera: false }
  ];

  /* ============================================================
     LA VÍA DE COMUNICACIÓN PREFERENTE

     Es de cada asunto, no del tercero: los datos estables de la persona
     ya están en su ficha. Aquí se apunta lo que ha dicho para ESTE
     asunto, y no siempre habrá algo que apuntar.
     ============================================================ */

  var VIAS = [
    { clave: 'TELEFONO',   texto: 'Teléfono',           corto: 'Teléfono' },
    { clave: 'CORREO',     texto: 'Correo electrónico', corto: 'Correo' },
    { clave: 'IPASEN',     texto: 'iPasen / Séneca',    corto: 'iPasen' },
    { clave: 'PRESENCIAL', texto: 'En persona',         corto: 'En persona' }
  ];

  function via(clave) {
    for (var i = 0; i < VIAS.length; i++) {
      if (VIAS[i].clave === clave) return VIAS[i];
    }
    return null;
  }

  var TIPOS_DOCUMENTO_POR_DEFECTO = [
    'SOLICITUD', 'FACTURA', 'CERTIFICADO', 'MATRICULA', 'RESOLUCION',
    'NOTIFICACION', 'INFORME', 'ACTA', 'COMUNICACION', 'JUSTIFICANTE',
    'PRESUPUESTO', 'ALBARAN', 'CONTRATO', 'RECURSO', 'ANEXO'
  ];

  /* El código del registro de Séneca.

     Séneca lleva cuatro series distintas, y el mismo número se repite
     cada año, así que el código las distingue todas:

         26 E M 1234
         |  | | |
         |  | | +-- los cuatro dígitos del asiento
         |  | +---- M manual, A automático
         |  +------ E entrada, S salida
         +--------- los dos últimos dígitos del año                     */
  function codigoRegistro(r) {
    if (!r) return '';
    var numero = String(r.numero || '').replace(/\D/g, '');
    if (!numero) return '';
    while (numero.length < 4) numero = '0' + numero;
    var ano = String(r.ano || '').replace(/\D/g, '');
    if (ano.length > 2) ano = ano.slice(-2);
    if (ano.length !== 2) return '';
    return ano + (r.sentido === 'S' ? 'S' : 'E') + (r.modo === 'A' ? 'A' : 'M') + numero;
  }

  /* El nombre corto de un tipo de documento (fila 239): lo que entra en
     el nombre del fichero. Sin nombre corto, el tipo entero. */
  function cortoDeTipoDocumento(tipo) {
    var c = (typeof window !== 'undefined' && window.TiposDocumentoCortos) ? window.TiposDocumentoCortos.de(tipo) : '';
    return c || String(tipo || '');
  }

  function montarDocumento(datos) { return montarDocumentoAjustado(datos).nombre; }

  /* El nombre del documento y si ha habido que recortarlo (fila 130): se
     recorta el texto adicional (`curso`) y, si no basta, los campos del
     tipo por el final. La fecha, el registro y el tipo no se tocan. */
  function montarDocumentoAjustado(datos) {
    /* Fila 239: con número de documento, `AAMMDD TIPO D26-01234.ext`; el
       registro, los campos y el texto adicional no entran en el nombre
       (viven en la ficha del asunto). Sin número, la de siempre. */
    if (datos.numeroDoc) {
      var extFija = String(datos.extension || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
      var cortoTipo = cortoDeTipoDocumento(datos.tipo);
      var nomFijo = unir([U.aAaMmDd(datos.fecha), U.limpiarNombre(cortoTipo).toUpperCase(), datos.numeroDoc]);
      return { nombre: nomFijo + (extFija ? '.' + extFija : ''), recortado: false, noCabe: false };
    }
    var antes = [U.aAaMmDd(datos.fecha)];
    if (datos.codigo) antes.push(U.limpiarNombre(datos.codigo));
    antes.push(U.limpiarNombre(datos.tipo).toUpperCase());
    /* Los campos del tipo de documento (fila 96,
       docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md), ya en orden: entre el
       tipo y el texto adicional. */
    var medio = (datos.campos || []).map(function (v) { return U.limpiarNombre(v); });
    if (datos.curso) medio.push(U.limpiarNombre(datos.curso));
    var tope = topesDeHoy(datos.tercero, datos.categoria).documento;
    var r = ajustarAlTope(antes, medio, [], tope);
    var ext = String(datos.extension || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    return { nombre: r.nombre + (ext ? '.' + ext : ''), recortado: r.recortado, noCabe: r.noCabe };
  }

  function extensionDe(nombre) {
    var m = String(nombre || '').match(/\.([A-Za-z0-9]{1,8})$/);
    return m ? m[1].toLowerCase() : '';
  }

  function categoriaDeTipo(tipos, tipo) {
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(tipos[i].tipo) === U.normalizar(tipo)) return tipos[i].categoria;
    }
    return 'OTROS';
  }

  /* Fila 493: las clases de tercero que admite un tipo, en el orden de CATEGORIAS. Un tipo sin
     `categorias` (guardado antes de esta fila, o por otro ordenador) admite solo su `categoria`. */
  function categoriasDe(t) {
    var l = t && Array.isArray(t.categorias) ? t.categorias.filter(function (c) { return CATEGORIAS.indexOf(c) !== -1; }) : [];
    if (!l.length) return [t && t.categoria ? t.categoria : 'OTROS'];
    return CATEGORIAS.filter(function (c) { return l.indexOf(c) !== -1; });
  }

  function categoriasDeTipo(tipos, tipo) {
    for (var i = 0; i < tipos.length; i++) {
      if (U.normalizar(tipos[i].tipo) === U.normalizar(tipo)) return categoriasDe(tipos[i]);
    }
    return ['OTROS'];
  }

  /* Deja `categorias` puesta y `categoria` igual a la primera (lo que lee todo lo demás). */
  function fijarCategorias(t, lista) {
    t.categorias = CATEGORIAS.filter(function (c) { return lista.indexOf(c) !== -1; });
    if (!t.categorias.length) t.categorias = [t.categoria || 'OTROS'];
    t.categoria = t.categorias[0];
    return t;
  }

  return {
    categoriasDe: categoriasDe, categoriasDeTipo: categoriasDeTipo, fijarCategorias: fijarCategorias,
    POR_DEFECTO: POR_DEFECTO, CATEGORIAS: CATEGORIAS, TEXTOS_CATEGORIA: TEXTOS_CATEGORIA,
    textoCategoria: textoCategoria, opcionesCategorias: opcionesCategorias, terceroTutor: terceroTutor,
    terceroAdministracion: terceroAdministracion,
    ESTADOS_POR_DEFECTO: ESTADOS_POR_DEFECTO, VIAS: VIAS, via: via,
    montar: montar, leer: leer, categoriaDeTipo: categoriaDeTipo, tipoParaCarpeta: tipoParaCarpeta,
    tipoParaVer: tipoParaVer, nombresDeTipo: nombresDeTipo,
    grupoCompacto: grupoCompacto, nivelYEnsenanza: nivelYEnsenanza,
    TIPOS_DOCUMENTO_POR_DEFECTO: TIPOS_DOCUMENTO_POR_DEFECTO,
    codigoRegistro: codigoRegistro, montarDocumento: montarDocumento,
    montarAsunto: montarAsunto, montarDocumentoAjustado: montarDocumentoAjustado,
    TOPE_ASUNTO: TOPE_ASUNTO, TOPE_DOCUMENTO: TOPE_DOCUMENTO,
    extensionDe: extensionDe, cortoDeTipoDocumento: cortoDeTipoDocumento,
    acortarNombrePila: acortarNombrePila, claveDeTercero: claveDeTercero, carpetaDeTercero: carpetaDeTercero,
    terceroAlumno: terceroAlumno, terceroDeResto: terceroDeResto,
    cursoYGrupoDeResto: cursoYGrupoDeResto,
    terceroPersonal: terceroPersonal, terceroEmpresa: terceroEmpresa
  };
})();
