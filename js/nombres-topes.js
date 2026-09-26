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

  window.Nombres = window.Nombres || {};
  window.Nombres.topes = topes;
})();
