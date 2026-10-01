/* ============================================================
   nombres-topes.js — cuánto hueco queda de verdad para el nombre de
   un asunto o de un documento, contando la ruta completa dentro de
   Dropbox (fila 177, docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2).

   Hasta esta fila, `Nombres.TOPE_ASUNTO` (150) y `Nombres.TOPE_DOCUMENTO`
   (120) miraban solo el nombre. La ruta real de un documento archivado es

       <Dropbox>/<ruta de ARCHIVO>/<CATEGORÍA>/<tercero>/<asunto>/Versiones previas/<documento>.pdf

   y puede pasar de los 260 caracteres que Windows deja sincronizar sin
   avisar. `Nombres.topes()` calcula el hueco de verdad a partir de:

     - la parte de dentro de Dropbox de la carpeta ARCHIVO
       (`_GESTOR/rutas.json`, leída por `js/copiar-ruta.js`: es la que
       manda, porque es la más larga de las dos);
     - dónde está Dropbox en este ordenador (`localStorage`, o 45
       caracteres por defecto: `C:\Users\<nombre largo>\Dropbox\`);
     - la categoría (la más larga de `Nombres.CATEGORIAS`, si no se
       conoce ya cuál es);
     - el nombre del tercero, si ya se conoce (si no, una estimación
       con la categoría, nunca exacta: este fichero no recorre el
       catálogo de terceros);
     - la subcarpeta `Versiones previas/`.

   **Sin `_GESTOR/rutas.json` todavía señalado** (la carpeta ARCHIVO no
   aparece en `RutaCarpetas.comunConocido('archivo')`, porque nadie ha
   pulsado el botón «Ruta» ni abierto el bloque de Ajustes → El centro
   todavía en este ordenador desde que se creó `rutas.json`), no hay
   con qué calcular: se devuelven los topes fijos de siempre, tal
   cual, como pide el encargo.

   Va cargado justo después de `js/nombres.js`, antes de `js/plazos.js`.
   No depende de `js/copiar-ruta.js` en el orden de carga (se consulta
   con `window.RutaCarpetas`, por si acaso algún día se necesitara
   antes: hoy `copiar-ruta.js` carga antes en `index.html`).
   ============================================================ */
(function () {

  /* "C:\Users\<usuario>\Dropbox\": una estimación con un nombre de
     usuario de Windows razonablemente largo. Si la ruta apuntada en
     este ordenador (`gestor-ruta-dropbox`) es más larga, manda ella. */
  var RAIZ_DROPBOX_POR_DEFECTO = 45;
  var SUBCARPETA_VERSIONES = 'Versiones previas';
  var TOPE_TOTAL_RUTA = 240;
  var MINIMO_ASUNTO = 40;
  var MINIMO_DOCUMENTO = 30;

  function raizDeEsteOrdenador() {
    var apuntada = '';
    try { apuntada = (window.localStorage && window.localStorage.getItem('gestor-ruta-dropbox')) || ''; }
    catch (e) { apuntada = ''; }
    return Math.max(RAIZ_DROPBOX_POR_DEFECTO, apuntada.length);
  }

  function categoriaMasLarga() {
    var categorias = (window.Nombres && Nombres.CATEGORIAS) || [];
    return categorias.reduce(function (a, b) { return String(b || '').length > a.length ? String(b) : a; }, '');
  }

  /* `tercero` y `categoria`, si se conocen ya (se está creando o
     editando el asunto de alguien concreto), se pasan tal cual; sin
     ellos, se estima con la categoría más larga, como aproximación. */
  function topes(tercero, categoria) {
    var fijos = { asunto: Nombres.TOPE_ASUNTO, documento: Nombres.TOPE_DOCUMENTO };

    var comunArchivo = (window.RutaCarpetas && RutaCarpetas.comunConocido)
      ? RutaCarpetas.comunConocido('archivo') : '';
    if (!comunArchivo) return fijos;   /* rutas.json aún no señalado: los fijos de siempre */

    var cat = categoria || categoriaMasLarga();
    var terceroTexto = tercero || cat;

    /* <Dropbox>/<comunArchivo>/<categoria>/<tercero>/<ASUNTO> */
    var piezasHastaElAsunto = [comunArchivo, cat, terceroTexto].filter(Boolean);
    var ocupadoHastaElAsunto = raizDeEsteOrdenador() + piezasHastaElAsunto.join('/').length +
      piezasHastaElAsunto.length;   /* una barra "/" antes de cada pieza, incluido el propio asunto */
    var disponibleAsunto = TOPE_TOTAL_RUTA - ocupadoHastaElAsunto;
    var topeAsunto = Math.max(Math.min(fijos.asunto, disponibleAsunto), MINIMO_ASUNTO);

    /* Un documento vive un nivel más adentro: dentro de la propia
       carpeta del asunto, y encima en «Versiones previas/» cuando es
       una versión anterior (el caso de ruta más larga, que es el que
       hay que respetar). Como el nombre real del asunto puede
       recortarse hasta `topeAsunto`, se usa ese tope como estimación
       de su largo: nunca exacto, pero nunca se queda corto de más. */
    var ocupadoHastaElDocumento = ocupadoHastaElAsunto + 1 + topeAsunto + 1 + SUBCARPETA_VERSIONES.length;
    var disponibleDocumento = TOPE_TOTAL_RUTA - ocupadoHastaElDocumento;
    var topeDocumento = Math.max(Math.min(fijos.documento, disponibleDocumento), MINIMO_DOCUMENTO);

    return { asunto: topeAsunto, documento: topeDocumento };
  }

  /* ============================================================
     FILA 239 (docs/NOMBRES-FIJOS-CON-NUMERO.md): la estructura fija.

     El nombre de un asunto nuevo (`AAMMDD A26-0137 TIPO Tercero`) y el
     de un documento nuevo (`AAMMDD TIPO D26-01234.ext`) tienen un largo
     conocido de antemano y NUNCA se recortan. Lo único que se mira es si
     la ruta completa cabe, con el peor documento posible dentro:

       <Dropbox>/<ARCHIVO>/<CATEGORÍA>/<tercero>/<asunto>/_Previas/<documento>

     Sin `_GESTOR/rutas.json` señalado todavía no hay con qué calcular:
     se da por bueno (`conocido: false`). El mismo cálculo, con los peores
     casos de todo el centro, lo enseña Ajustes → El centro («Largo de las
     rutas», `Nombres.medidor`).
     ============================================================ */
  var SUBCARPETA_PREVIAS = '_Previas';
  var LARGO_EXTENSION = 5;          /* «.docx» */
  var LARGO_NUMERO_DOCUMENTO = 9;   /* D26-01234 */
  var LARGO_FECHA = 6;              /* AAMMDD */

  /* El documento más largo que puede salir: fecha, tipo corto, número y
     extensión, con un espacio entre cada pieza. */
  function peorDocumento(largoTipoDocumento) {
    return LARGO_FECHA + 1 + largoTipoDocumento + 1 + LARGO_NUMERO_DOCUMENTO + LARGO_EXTENSION;
  }

  function largoDelTipoDeDocumentoMasLargo() {
    var lista = (window.App && App.E && App.E.tiposDocumento) || [];
    var mayor = 0;
    lista.forEach(function (t) {
      var c = (window.Nombres && Nombres.cortoDeTipoDocumento) ? Nombres.cortoDeTipoDocumento(t) : t;
      if (String(c).length > mayor) mayor = String(c).length;
    });
    return mayor || 12;
  }

  /* Cuántos caracteres de la ruta quedan libres con este asunto dentro
     (el peor documento incluido). `cabe` es false si son menos de cero. */
  function cabeEnRuta(nombreAsunto, tercero, categoria, largoTipoDocumento) {
    var comun = (window.RutaCarpetas && RutaCarpetas.comunConocido) ? RutaCarpetas.comunConocido('archivo') : '';
    if (!comun) return { conocido: false, cabe: true, margen: null };
    var cat = categoria || categoriaMasLarga();
    var piezas = [comun, cat, tercero || cat, nombreAsunto, SUBCARPETA_PREVIAS,
      'x'.repeat(peorDocumento(largoTipoDocumento || largoDelTipoDeDocumentoMasLargo()))];
    var ocupado = raizDeEsteOrdenador() + piezas.join('/').length;
    var margen = TOPE_TOTAL_RUTA - ocupado;
    return { conocido: true, cabe: margen >= 0, margen: margen };
  }

  function terceroMasLargo(lista, categoria) {
    var mayor = '';
    (lista || []).forEach(function (p) {
      var t = (window.App && App.textoTercero) ? App.textoTercero(Object.assign({ categoria: categoria }, p)) : String(p.nombre || '');
      if (window.Nombres && Nombres.acortarNombrePila) t = Nombres.acortarNombrePila(t);
      if (t.length > mayor.length) mayor = t;
    });
    return mayor;
  }

  /* El peor caso de todo el centro, para Ajustes y la comprobación al
     entrar. Asíncrono: recorre los catálogos de terceros. Nunca lanza. */
  async function medidor() {
    var comun = (window.RutaCarpetas && RutaCarpetas.comunConocido) ? RutaCarpetas.comunConocido('archivo') : '';
    var categoria = categoriaMasLarga();
    var tercero = '';
    var categoriaDelTercero = categoria;
    try {
      var cats = (window.Nombres && Nombres.CATEGORIAS) || [];
      for (var i = 0; i < cats.length; i++) {
        var fuente = (window.Datos && App.E && App.E.datos) ? await Datos.cargar(App.E.datos, cats[i]) : null;
        var t = fuente ? terceroMasLargo(fuente.lista, cats[i]) : '';
        if (t.length > tercero.length) { tercero = t; categoriaDelTercero = cats[i]; }
      }
    } catch (e) { /* sin catálogo: se sigue con lo que haya */ }

    var tipos = (window.App && App.E && App.E.tipos) || [];
    var tipoAsunto = '';
    tipos.forEach(function (t) {
      var n = Nombres.tipoParaCarpeta(t);
      if (n.length > tipoAsunto.length) tipoAsunto = n;
    });
    var largoTipoDoc = largoDelTipoDeDocumentoMasLargo();
    var asuntoPeor = [ 'x'.repeat(LARGO_FECHA), 'A00-0000', tipoAsunto.toUpperCase(), tercero ].filter(Boolean).join(' ');
    var r = cabeEnRuta(asuntoPeor, tercero, categoria, largoTipoDoc);
    var partes = [
      { clave: 'dropbox', texto: 'dónde está Dropbox en este ordenador', largo: raizDeEsteOrdenador() },
      { clave: 'archivo', texto: 'la ruta de la carpeta ARCHIVO', largo: comun.length + 1 },
      { clave: 'categoria', texto: 'la categoría más larga', largo: categoria.length + 1 },
      { clave: 'tercero', texto: 'el tercero más largo (' + tercero + ')', largo: tercero.length + 1 },
      { clave: 'tipo', texto: 'el tipo de asunto más largo (' + tipoAsunto + ')', largo: tipoAsunto.length },
      { clave: 'previas', texto: 'la subcarpeta de previas', largo: SUBCARPETA_PREVIAS.length + 1 },
      { clave: 'documento', texto: 'el tipo de documento más largo', largo: largoTipoDoc }
    ];
    var masOcupa = partes.slice().sort(function (a, b) { return b.largo - a.largo; })[0];
    return {
      conocido: r.conocido, margen: r.margen, tope: TOPE_TOTAL_RUTA,
      categoria: categoria, tercero: tercero, categoriaDelTercero: categoriaDelTercero,
      tipoAsunto: tipoAsunto, largoTipoDocumento: largoTipoDoc, previas: SUBCARPETA_PREVIAS,
      peorAsunto: asuntoPeor, peorDocumento: peorDocumento(largoTipoDoc),
      partes: partes, masOcupa: masOcupa
    };
  }

  window.Nombres = window.Nombres || {};
  window.Nombres.topes = topes;
  window.Nombres.cabeEnRuta = cabeEnRuta;
  window.Nombres.medidor = medidor;
  window.Nombres.SUBCARPETA_PREVIAS = SUBCARPETA_PREVIAS;
})();
