/* ============================================================
   centro-de-datos-profesorado.js — tomar los dos conjuntos de profesorado
   que el Centro de datos deja ya preparados (fila 572,
   docs/572-SUS-PROFESORES-POR-ALUMNO.md; contrato:
   docs/CENTRO-DE-DATOS-CONTRATO-2.md, «profesorado-grupos» y
   «profesorado-alumnos»).

   Igual que js/centro-de-datos-tutorias.js. `CentroDeDatos.traer` lo llama
   después de las tutorías, con las mismas condiciones de siempre.

   - Las partes son las entradas de `indice.hechos` con `conjunto:
     "profesorado-grupos"` o `"profesorado-alumnos"` y `parte: "curso"`.
     Se toman todos los cursos que traiga el índice.
   - Una se toma si su `huella` es distinta de la apuntada para ese conjunto
     y curso (`hecho-profesorado-grupos|<curso>`…) y su `hecho` no es
     anterior al apuntado. Se comprueba la huella (SHA-256 de los bytes).
   - Se copia byte a byte a `_GESTOR/datos/PROFESORADO-GRUPOS-HECHO <curso>.json`
     o `PROFESORADO-ALUMNOS-HECHO <curso>.json` (lo lee js/horario.js) y se
     apunta con `DatosQueTengo.apuntar`.
   - `acuerdoHecho` mayor que 1: no se toma ninguna, con un aviso ámbar
     una vez por sesión.
   ============================================================ */
var CentroDeDatosProfesorado = (function () {

  var ACUERDO_MAXIMO = 1;
  var CONJUNTOS = {
    'profesorado-grupos': { clave: 'hecho-profesorado-grupos', prefijo: 'PROFESORADO-GRUPOS-HECHO ', resumen: ' grupos' },
    'profesorado-alumnos': { clave: 'hecho-profesorado-alumnos', prefijo: 'PROFESORADO-ALUMNOS-HECHO ', resumen: ' alumnos' }
  };
  var avisadoAcuerdo = false;

  function llave(conjunto, curso) { return CONJUNTOS[conjunto].clave + '|' + curso; }
  function nombreDe(conjunto, curso) { return CONJUNTOS[conjunto].prefijo + curso + '.json'; }
  function ms(v) { var t = new Date(v || '').getTime(); return isNaN(t) ? 0 : t; }

  /* Las entradas de partes de profesorado de un índice, con curso de la forma «26-27». */
  function partes(indice) {
    return ((indice && indice.hechos) || []).filter(function (e) {
      return e && CONJUNTOS[e.conjunto] && e.parte === 'curso' && e.ruta && /^\d{2}-\d{2}$/.test(String(e.cursoEscolar || ''));
    });
  }

  function demasiadoNuevo(e) { return Number(e.acuerdoHecho) > ACUERDO_MAXIMO; }

  function haceFalta(e, apuntes) {
    var ap = apuntes && apuntes.tomado && apuntes.tomado[llave(e.conjunto, e.cursoEscolar)];
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
  async function tomar(dir, indice, apuntes, op) {
    var salida = { cursos: [], nuevos: {}, fallos: [], subido: '' };
    var todas = partes(indice);
    if (!todas.length) return salida;
    if (todas.some(demasiadoNuevo)) {
      if (!avisadoAcuerdo) { avisadoAcuerdo = true; U.aviso('El profesorado del Centro de datos es más nuevo que esta aplicación.', 'ambar'); }
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
          if (op && op.avisar) U.accesorio('No he podido traer el profesorado del curso ' + e.cursoEscolar, new Error('su huella no coincide; lo intentaré más tarde'));
          continue;
        }
        var nombre = nombreDe(e.conjunto, e.cursoEscolar);
        await Carpetas.escribirBytes(datos, nombre, bytes, 'application/json');
        if (window.DatosQueTengo) {
          await DatosQueTengo.apuntar(nombre, { via: 'centro-de-datos', fechaOriginal: e.hecho, subidoPor: 'centro-de-datos-ies', nombreOriginal: String(e.ruta).split('/').pop() });
        }
        salida.nuevos[llave(e.conjunto, e.cursoEscolar)] = {
          huella: e.huella, subido: e.hecho || '', fichero: String(e.ruta), resumen: (e.registros || 0) + CONJUNTOS[e.conjunto].resumen,
          subidoPor: 'centro-de-datos-ies', tomadoEl: new Date().toISOString(), tomadoPor: (window.App && App.E && App.E.usuario) || ''
        };
        if (salida.cursos.indexOf(e.cursoEscolar) === -1) salida.cursos.push(e.cursoEscolar);
        if (ms(e.hecho) > ms(salida.subido)) salida.subido = e.hecho;
      } catch (x) {
        salida.fallos.push('Profesorado ' + e.cursoEscolar + ': ' + U.mensajeDeError(x));
      }
    }
    if (salida.cursos.length && window.Horario) Horario.olvidar();
    return salida;
  }

  return { CONJUNTOS: CONJUNTOS, llave: llave, nombreDe: nombreDe, partes: partes, haceFalta: haceFalta, tomar: tomar };
})();
window.CentroDeDatosProfesorado = CentroDeDatosProfesorado;
