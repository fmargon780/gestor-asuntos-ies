/* ============================================================
   centro-de-datos-libros.js — tomar la lista de libros de texto que el
   Centro de datos deja ya preparada (fila 501, docs/501-FICHA-ENTREGA-LIBROS.md;
   el acuerdo, en docs/CENTRO-DE-DATOS-CONTRATO-2.md, «El conjunto `libros`»).

   Igual que js/centro-de-datos-personal.js: `CentroDeDatos.traer` lo llama
   después del personal, con las mismas condiciones de siempre.

   - Las partes son las entradas de `indice.hechos` con `conjunto: "libros"` y
     `parte: "curso"`. Sin `hechos`, no hace nada.
   - Una se toma si su `huella` es distinta de la apuntada para ese curso y su
     `hecho` no es anterior al apuntado (apunte `hecho-libros|<curso>`).
   - Se comprueba la huella (SHA-256); si no coincide, no se copia ni se apunta.
   - Se copia byte a byte a `_GESTOR/datos/LIBROS-HECHO <curso>.json`
     (la lee js/libros-hecho.js).
   - `acuerdoHecho` mayor que 1: no se toma ninguna.
   ============================================================ */
var CentroDeDatosLibros = (function () {

  var CLAVE = 'hecho-libros';
  var ACUERDO_MAXIMO = 1;
  var avisadoAcuerdo = false;

  function llave(curso) { return CLAVE + '|' + curso; }
  function nombreDe(curso) { return 'LIBROS-HECHO ' + curso + '.json'; }
  function ms(v) { var t = new Date(v || '').getTime(); return isNaN(t) ? 0 : t; }

  /* Las entradas de partes de libros de un índice, con curso de la forma «26-27». */
  function partes(indice) {
    return ((indice && indice.hechos) || []).filter(function (e) {
      return e && e.conjunto === 'libros' && e.parte === 'curso' && e.ruta && /^\d{2}-\d{2}$/.test(String(e.cursoEscolar || ''));
    });
  }

  function demasiadoNuevo(e) { return Number(e.acuerdoHecho) > ACUERDO_MAXIMO; }

  /* ¿Hay que tomar esta parte? Huella distinta de la apuntada y `hecho` no anterior al apuntado. */
  function haceFalta(e, apuntes) {
    var ap = apuntes && apuntes.tomado && apuntes.tomado[llave(e.cursoEscolar)];
    if (!ap) return true;
    if (e.huella && ap.huella === e.huella) return false;
    return ms(e.hecho) >= ms(ap.subido);
  }

  /* Las que se tomarían ahora (para «Lo que tengo ahora»). Con acuerdo más nuevo, ninguna. */
  function pendientes(indice, apuntes) {
    return partes(indice).filter(function (e) { return !demasiadoNuevo(e) && haceFalta(e, apuntes); });
  }

  async function sha256(bytes) {
    if (!window.crypto || !crypto.subtle) throw new Error('este navegador no puede comprobar la huella');
    var h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return Array.prototype.map.call(h, function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  async function llegarAlFichero(dir, ruta) {
    var trozos = String(ruta || '').split('/').filter(Boolean);
    var actual = dir;
    for (var i = 0; i < trozos.length - 1; i++) actual = await actual.getDirectoryHandle(trozos[i]);
    return actual.getFileHandle(trozos[trozos.length - 1]);
  }

  /* Devuelve { cursos: [curso…], nuevos: { llave: apunte }, fallos: [texto…], resumen: 'fecha corta' | '' }.
     `op.avisar`: una huella que no coincide se dice también en ámbar. */
  async function tomar(dir, indice, apuntes, op) {
    var salida = { cursos: [], nuevos: {}, fallos: [], subido: '' };
    var todas = partes(indice);
    if (!todas.length) return salida;
    if (todas.some(demasiadoNuevo)) {
      if (!avisadoAcuerdo) { avisadoAcuerdo = true; U.aviso('Los libros de texto del Centro de datos son más nuevos que esta aplicación.', 'ambar'); }
      return salida;
    }
    var datos = window.App && App.E && App.E.datos;
    for (var i = 0; i < todas.length; i++) {
      var e = todas[i];
      if (!haceFalta(e, apuntes)) continue;
      try {
        if (!datos) throw new Error('todavía no hay carpeta de datos');
        var h = await llegarAlFichero(dir, e.ruta);
        var bytes = await (await h.getFile()).arrayBuffer();
        var huella = await sha256(bytes);
        if (!e.huella || huella !== String(e.huella).toLowerCase()) {
          if (op && op.avisar) U.accesorio('No he podido traer los libros de texto del curso ' + e.cursoEscolar, new Error('su huella no coincide; lo intentaré más tarde'));
          continue;
        }
        var nombre = nombreDe(e.cursoEscolar);
        await Carpetas.escribirBytes(datos, nombre, bytes, 'application/json');
        if (window.DatosQueTengo) {
          await DatosQueTengo.apuntar(nombre, { via: 'centro-de-datos', fechaOriginal: e.hecho, subidoPor: 'centro-de-datos-ies', nombreOriginal: String(e.ruta).split('/').pop() });
        }
        salida.nuevos[llave(e.cursoEscolar)] = {
          huella: e.huella, subido: e.hecho || '', fichero: String(e.ruta), resumen: (e.registros || 0) + ' asignaturas',
          subidoPor: 'centro-de-datos-ies', tomadoEl: new Date().toISOString(), tomadoPor: (window.App && App.E && App.E.usuario) || ''
        };
        salida.cursos.push(e.cursoEscolar);
        if (ms(e.hecho) > ms(salida.subido)) salida.subido = e.hecho;
      } catch (x) {
        salida.fallos.push('Libros de texto ' + e.cursoEscolar + ': ' + U.mensajeDeError(x));
      }
    }
    return salida;
  }

  return { CLAVE: CLAVE, llave: llave, nombreDe: nombreDe, partes: partes, haceFalta: haceFalta, pendientes: pendientes, tomar: tomar };
})();
window.CentroDeDatosLibros = CentroDeDatosLibros;
