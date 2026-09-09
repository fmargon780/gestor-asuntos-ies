/* ============================================================
   rescate-datos.js — los CSV que aparecen un piso más arriba.

   Los ficheros de datos van en _GESTOR/datos. Es fácil dejarlos por
   error en _GESTOR, o en la propia carpeta de asuntos abiertos: se
   parecen, y el cuadro de guardar del navegador enseña las tres.
   Cuando eso pasa, la aplicación decía que no había ningún RegAlum.csv
   aunque el fichero estuviera ahí al lado.

   Así que ahora, al entrar, se mira también en esos dos sitios. Lo que
   se encuentre con nombre de fichero de datos se lleva solo a
   _GESTOR/datos y se avisa de ello.

   El traslado lo hace Carpetas.moverFichero: copia, comprueba que la
   copia pesa lo mismo, y solo entonces borra el original. Si algo sale
   mal, el fichero se queda donde estaba.

   Va antes de que nadie lea los datos: se engancha a App.cargarTipos,
   que es lo primero que hace la aplicación después de abrir _GESTOR.
   ============================================================ */
(function () {

  /* Nombres de fichero que son datos, y no un documento de un asunto.
     Se compara con el principio del nombre, sin mayúsculas ni tildes. */
  var DE_SENECA = ['regalum', 'relpercen'];
  var DE_LA_CASA = ['personal', 'empresas', 'otros', 'solicitantes'];

  function esDeDatos(nombre, prefijos) {
    if (!/\.csv$/i.test(nombre)) return false;
    var n = U.normalizar(nombre);
    for (var i = 0; i < prefijos.length; i++) {
      if (n.indexOf(prefijos[i]) === 0) return true;
    }
    return false;
  }

  async function fecha(dir, nombre) {
    try {
      var h = await dir.getFileHandle(nombre);
      var f = await h.getFile();
      return f.lastModified || 0;
    } catch (e) { return 0; }
  }

  /* Trae a datos los ficheros de datos que haya en 'dir'.
     Si en datos ya hay uno con ese nombre, solo se trae el de fuera si
     es más nuevo: el de dentro es el que está en uso. */
  async function traerDesde(dir, prefijos, datos, movidos) {
    if (!dir || dir === datos) return;
    var lista = await Carpetas.ficheros(dir);
    for (var i = 0; i < lista.length; i++) {
      var nombre = lista[i].nombre;
      if (!esDeDatos(nombre, prefijos)) continue;
      var deFuera = await fecha(dir, nombre);
      var deDentro = await fecha(datos, nombre);
      if (deDentro && deDentro >= deFuera) continue;
      try {
        await Carpetas.moverFichero(dir, nombre, datos);
        movidos.push(nombre);
      } catch (e) { /* se queda donde estaba; no se pierde nada */ }
    }
  }

  async function rescatar() {
    var datos = App.E.datos;
    if (!datos) return;
    var movidos = [];
    await traerDesde(App.E.gestor, DE_SENECA.concat(DE_LA_CASA), datos, movidos);
    await traerDesde(App.E.abiertos, DE_SENECA, datos, movidos);
    if (!movidos.length) return;
    var texto = movidos.length === 1
      ? 'He llevado ' + movidos[0] + ' a _GESTOR/datos, que es donde va.'
      : 'He llevado ' + movidos.length + ' ficheros de datos a _GESTOR/datos, que es donde van.';
    setTimeout(function () { U.aviso(texto, 'bueno'); }, 900);
  }

  /* Se cuela justo antes de que la aplicación lea su configuración.
     Un fallo aquí no puede impedir entrar. */
  var comoEra = App.cargarTipos;
  App.cargarTipos = async function () {
    try { await rescatar(); } catch (e) { /* seguimos entrando */ }
    return comoEra.apply(this, arguments);
  };

})();
