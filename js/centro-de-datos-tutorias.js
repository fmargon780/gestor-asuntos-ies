/* ============================================================
   centro-de-datos-tutorias.js — tomar las partes de tutorías que el
   Centro de datos deja ya preparadas (fila 376,
   docs/TUTOR-DESDE-EL-CENTRO-DE-DATOS.md; contrato: conjunto `tutorias`).

   Igual que js/centro-de-datos-personal.js. `CentroDeDatos.traer` lo
   llama después del personal, con las mismas condiciones de siempre
   (carpeta, permiso, contrato, no `ocupado`, no solo consulta).

   - Las partes son las entradas de `indice.hechos` con
     `conjunto: "tutorias"` y `parte: "curso"`. Se toman **todos los
     cursos** que traiga el índice (el certificado necesita los pasados).
   - Una se toma si su `huella` es distinta de la apuntada para ese curso y
     su `hecho` no es anterior al apuntado (apunte `hecho-tutorias|<curso>`
     en `_GESTOR/centro-de-datos.json`).
   - Se comprueba la huella (SHA-256 de los bytes del fichero): si no
     coincide, no se copia ni se apunta.
   - Se copia byte a byte a `_GESTOR/datos/TUTORIAS-HECHO <curso>.json`
     (lo lee js/tablas-datos-tutorias.js) y se apunta por dónde llegó.
   - El PDF de la función tutorial que el Centro de datos tenga como listado
     ya no se toma (`CentroDeDatos.elegir` lo deja fuera).
   - `acuerdoHecho` mayor que 1: no se toma ninguna, y sale un aviso ámbar
     una vez por sesión.
   ============================================================ */
var CentroDeDatosTutorias = (function () {

  var CLAVE = 'hecho-tutorias';
  var ACUERDO_MAXIMO = 1;
  var avisadoAcuerdo = false;

  function llave(curso) { return CLAVE + '|' + curso; }
  function nombreDe(curso) { return window.TablasDatosTutorias ? TablasDatosTutorias.nombreDe(curso) : 'TUTORIAS-HECHO ' + curso + '.json'; }
  function ms(v) { var t = new Date(v || '').getTime(); return isNaN(t) ? 0 : t; }

  /* Las entradas de partes de tutorías de un índice, con curso de la forma «26-27». */
  function partes(indice) {
    return ((indice && indice.hechos) || []).filter(function (e) {
      return e && e.conjunto === 'tutorias' && e.parte === 'curso' && e.ruta && /^\d{2}-\d{2}$/.test(String(e.cursoEscolar || ''));
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

  /* Devuelve { cursos: [curso…], nuevos: { llave: apunte }, fallos: [texto…], subido: 'fecha' }. */
  async function tomar(dir, indice, apuntes, op, ctx) {
    var salida = { cursos: [], nuevos: {}, fallos: [], subido: '' };
    var todas = partes(indice);
    if (!todas.length) return salida;
    if (todas.some(demasiadoNuevo)) {
      if (!avisadoAcuerdo) { avisadoAcuerdo = true; U.aviso('Las tutorías del Centro de datos son más nuevas que esta aplicación.', 'ambar'); }
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
          if (op && op.avisar) U.accesorio('No he podido traer las tutorías del curso ' + e.cursoEscolar, new Error('su huella no coincide; lo intentaré más tarde'));
          continue;
        }
        var nombre = nombreDe(e.cursoEscolar);
        await Carpetas.escribirBytes(datos, nombre, bytes, 'application/json');
        if (window.DatosQueTengo) {
          await DatosQueTengo.apuntar(nombre, { via: 'centro-de-datos', fechaOriginal: e.hecho, subidoPor: 'centro-de-datos-ies', nombreOriginal: String(e.ruta).split('/').pop() });
        }
        salida.nuevos[llave(e.cursoEscolar)] = {
          huella: e.huella, subido: e.hecho || '', fichero: String(e.ruta), resumen: (e.registros || 0) + ' grupos',
          subidoPor: 'centro-de-datos-ies', tomadoEl: new Date().toISOString(), tomadoPor: (window.App && App.E && App.E.usuario) || ''
        };
        salida.cursos.push(e.cursoEscolar);
        if (ms(e.hecho) > ms(salida.subido)) salida.subido = e.hecho;
      } catch (x) {
        salida.fallos.push('Tutorías ' + e.cursoEscolar + ': ' + U.mensajeDeError(x));
      }
    }
    if (salida.cursos.length && ctx) ctx.tablas = true;   /* CentroDeDatosReparto.terminar vuelve a leer las tablas y las pinta */
    return salida;
  }

  return { CLAVE: CLAVE, llave: llave, nombreDe: nombreDe, partes: partes, haceFalta: haceFalta, tomar: tomar };
})();
window.CentroDeDatosTutorias = CentroDeDatosTutorias;
