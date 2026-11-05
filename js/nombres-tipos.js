/* ============================================================
   nombres-tipos.js — los tipos y categorías por defecto y cómo se ven (fila 536: trozo de js/nombres.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/nombres.js.
   ============================================================ */
var NombresNucleo = NombresNucleo || {};
(function () {

  var I = NombresNucleo;
  function montarAsunto() { return I.montarAsunto.apply(this, arguments); }

  /* Propuesta de partida. Se guarda en _GESTOR/tipos.json la primera vez
     y a partir de ahí manda el fichero, no esta lista. */
  var POR_DEFECTO = [
    { tipo: 'MATRICULA', categoria: 'ALUMNADO' },
    { tipo: 'BAJA', categoria: 'ALUMNADO' },
    { tipo: 'TRASLADO', categoria: 'ALUMNADO' },
    { tipo: 'SANCION', categoria: 'ALUMNADO' },
    { tipo: 'ABSENTISMO', categoria: 'ALUMNADO' },
    { tipo: 'CERTIFICADO', categoria: 'ALUMNADO' },
    { tipo: 'TITULO', categoria: 'ALUMNADO' },
    { tipo: 'BECA', categoria: 'ALUMNADO' },
    { tipo: 'TRANSPORTE', categoria: 'ALUMNADO' },
    { tipo: 'SEGURO ESCOLAR', categoria: 'ALUMNADO' },
    { tipo: 'RECLAMACION', categoria: 'ALUMNADO' },
    { tipo: 'ACCIDENTE', categoria: 'ALUMNADO' },
    { tipo: 'CONVALIDACION', categoria: 'ALUMNADO' },
    { tipo: 'DOCUMENTACION', categoria: 'ALUMNADO' },

    { tipo: 'TOMA POSESION', categoria: 'PERSONAL' },
    { tipo: 'CESE', categoria: 'PERSONAL' },
    { tipo: 'PERMISO', categoria: 'PERSONAL' },
    { tipo: 'LICENCIA', categoria: 'PERSONAL' },
    { tipo: 'BAJA MEDICA', categoria: 'PERSONAL' },
    { tipo: 'NOMINA', categoria: 'PERSONAL' },
    { tipo: 'FORMACION', categoria: 'PERSONAL' },
    { tipo: 'CERTIFICADO PERSONAL', categoria: 'PERSONAL' },

    { tipo: 'COMPRA', categoria: 'EMPRESAS' },
    { tipo: 'FACTURA', categoria: 'EMPRESAS' },
    { tipo: 'PRESUPUESTO', categoria: 'EMPRESAS' },
    { tipo: 'CONTRATO', categoria: 'EMPRESAS' },
    { tipo: 'MANTENIMIENTO', categoria: 'EMPRESAS' },
    { tipo: 'SUMINISTRO', categoria: 'EMPRESAS' },
    { tipo: 'OBRA', categoria: 'EMPRESAS' },
    { tipo: 'GARANTIA', categoria: 'EMPRESAS' },

    { tipo: 'CONVENIO', categoria: 'OTROS' },
    { tipo: 'SUBVENCION', categoria: 'OTROS' },
    { tipo: 'INSPECCION', categoria: 'OTROS' },
    { tipo: 'CONSEJO ESCOLAR', categoria: 'OTROS' },
    { tipo: 'ACTIVIDAD EXTRAESCOLAR', categoria: 'OTROS' },
    { tipo: 'PROYECTO', categoria: 'OTROS' },
    { tipo: 'CORRESPONDENCIA', categoria: 'OTROS' }
  ];

  /* Las categorías de tercero. Es la ÚNICA lista: todo lo que enseña o
     recorre categorías (botones, desplegables, buscadores, la bandeja)
     lee esta (fila 166, docs/TUTORES-LEGALES-COMO-TERCERO.md). Una
     categoría nueva se añade aquí (al final: los botones se reconocen
     por su sitio) y en TEXTOS_CATEGORIA, y su carpeta del ARCHIVO se
     llama igual. */
  var CATEGORIAS = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS', 'TUTORES LEGALES', 'ADMINISTRACIONES'];

  /* Cómo se nombra cada categoría en pantalla: `lista` (el desplegable
     de Personas y empresas), `descripcion` (el botón de Nuevo asunto) y
     `tercero` (la etiqueta del buscador del tercero). */
  var TEXTOS_CATEGORIA = {
    'ALUMNADO': { lista: 'Alumnado', descripcion: 'Alumnos y alumnas', tercero: 'Alumno o alumna' },
    'TUTORES LEGALES': { lista: 'Tutores legales', descripcion: 'Padres, madres y tutores del alumnado',
                         tercero: 'Tutor o tutora legal' },
    'PERSONAL': { lista: 'Personal', descripcion: 'Profesorado y personal del centro', tercero: 'Persona del centro' },
    'EMPRESAS': { lista: 'Empresas', descripcion: 'Proveedores y empresas', tercero: 'Empresa' },
    'OTROS': { lista: 'Otros', descripcion: 'Todo lo demás', tercero: 'Tercero' },
    'ADMINISTRACIONES': { lista: 'Administraciones', descripcion: 'Organismos y centros educativos',
                          tercero: 'Organismo o centro educativo' }
  };

  function textoCategoria(categoria, que) {
    var t = TEXTOS_CATEGORIA[categoria];
    return (t && t[que || 'lista']) || String(categoria || '');
  }

  /* Rellena un <select> con las categorías (valor = la categoría; texto,
     el de `que`, o la categoría en mayúsculas si `que` es 'clave'),
     conservando lo elegido si sigue existiendo. */
  function opcionesCategorias(select, que) {
    if (!select) return;
    var antes = select.value;
    select.innerHTML = CATEGORIAS.map(function (c) {
      var texto = que === 'clave' ? c : textoCategoria(c, que);
      return '<option value="' + c + '">' + U.escapar(texto) + '</option>';
    }).join('');
    if (antes && CATEGORIAS.indexOf(antes) !== -1) select.value = antes;
  }

  /* El nombre corto de un tipo (20-sep-2026, fila 79, apartado 4.9,
     docs/BIBLIOTECA-DE-HITOS.md): lo que entra en el nombre de la
     carpeta y de los documentos. Vacío, se usa el nombre de siempre.
     Cambiar el nombre corto no toca las carpetas ya creadas: solo
     afecta a lo que se monta a partir de ahora. Un solo sitio: todo lo
     que hoy mete `tipo.tipo` en un nombre de carpeta o de documento
     pasa por aquí. */
  function tipoParaCarpeta(tipo) {
    return (tipo && tipo.nombreCorto) ? tipo.nombreCorto : ((tipo && tipo.tipo) || '');
  }

  /* Lo que se ENSEÑA de un tipo en los filtros «Por tipo de asunto» y
     en la etiqueta de la tarjeta (fila 97, docs/NOMBRE-CORTO-EN-LOS-FILTROS.md):
     el nombre corto si lo tiene, el de siempre si no. `nombreTipo` es el
     nombre de verdad (el largo, el que devuelve `leer`), y es el que
     sigue sirviendo para agrupar y filtrar. */
  function tipoParaVer(nombreTipo, tipos) {
    var t = (tipos || []).filter(function (x) { return x.tipo === nombreTipo; })[0];
    return t ? tipoParaCarpeta(t) : (nombreTipo || '');
  }

  /* Los dos nombres de un tipo, para el buscador: el largo y el corto
     (fila 97). Se resuelve al buscar, desde la lista de tipos de hoy. */
  function nombresDeTipo(nombreTipo, tipos) {
    var corto = tipoParaVer(nombreTipo, tipos);
    return corto && corto !== nombreTipo ? [nombreTipo || '', corto] : [nombreTipo || ''];
  }

  /* Monta el nombre de la carpeta a partir de sus piezas.
     El tercero va siempre el último. El grupo, si se pide, va detrás
     del año académico y delante de los campos y de la descripción.
     `datos.campos`, si viene, es una lista de valores ya elegidos
     (los que el usuario ha marcado "Añadir al nombre" y que no están
     vacíos), en el orden en que deben salir: aquí solo se limpian y
     se colocan, uno detrás de otro. */
  function montar(datos) { return montarAsunto(datos).nombre; }

  I.POR_DEFECTO = POR_DEFECTO;
  I.CATEGORIAS = CATEGORIAS;
  I.TEXTOS_CATEGORIA = TEXTOS_CATEGORIA;
  I.textoCategoria = textoCategoria;
  I.opcionesCategorias = opcionesCategorias;
  I.tipoParaCarpeta = tipoParaCarpeta;
  I.tipoParaVer = tipoParaVer;
  I.nombresDeTipo = nombresDeTipo;
  I.montar = montar;
})();
