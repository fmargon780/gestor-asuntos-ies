/* ============================================================
   plantillas-fichero.js — los .docx de las plantillas de Word: traer uno
   del ordenador, comprobarlo, guardarlo con un nombre libre y sustituir el
   de una plantilla (10-oct-2026, fila 320, docs/PANTALLA-DE-PLANTILLAS.md,
   puntos 4 y 5).

   Los .docx viven en `_GESTOR/PLANTILLAS`. Aquí nunca se borra uno: al
   sustituir, el de antes se queda donde estaba (y «Deshacer» vuelve a él).
   Primero se escribe el fichero y después `plantillas.json`.
   ============================================================ */
var PlantillasFichero = (function () {

  function sin(t) { return U.normalizar(t || ''); }
  function carpeta() { return PlantillasDocumento._interno.carpetaDePlantillas(); }

  /* Un nombre que no pise a ninguno de la carpeta: «Nombre.docx», «Nombre (2).docx»… */
  async function ficheroLibre(dir, base) {
    var existentes = (await Carpetas.ficheros(dir)).map(function (f) { return sin(f.nombre); });
    var nombre = base + '.docx', n = 2;
    while (existentes.indexOf(sin(nombre)) !== -1) { nombre = base + ' (' + n + ').docx'; n++; }
    return nombre;
  }

  /* De «Mi certificado (3).docx» a «Mi certificado (3)»: sin ruta ni extensión ni caracteres que Windows no admite. */
  function baseDe(nombre) {
    var b = String(nombre || 'plantilla').replace(/^.*[\\/]/, '').replace(/\.docx$/i, '').replace(/[<>:"|?*]/g, ' ').replace(/\s+/g, ' ').trim();
    return b || 'plantilla';
  }

  /* Elige un .docx del ordenador. Devuelve el File, o null si se cierra el cuadro sin elegir. Un <input type="file">,
     para que las pruebas y el revisor puedan darle un fichero. */
  function elegirWord() {
    return new Promise(function (resolver) {
      var entrada = document.createElement('input');
      entrada.type = 'file';
      entrada.accept = '.docx';
      entrada.style.display = 'none';
      var hecho = false;
      function fin(valor) { if (hecho) return; hecho = true; if (entrada.parentNode) entrada.parentNode.removeChild(entrada); resolver(valor); }
      entrada.addEventListener('change', function () { fin(entrada.files && entrada.files[0] ? entrada.files[0] : null); });
      entrada.addEventListener('cancel', function () { fin(null); });
      document.body.appendChild(entrada);
      entrada.click();
    });
  }

  /* ¿Se puede abrir como Word? Un .docx es un ZIP con `word/document.xml`. { ok } o { ok: false, motivo }. */
  async function comprobarWord(file) {
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var entradas = Docx.leerDirectorioCentral(bytes);
      if (!entradas.some(function (e) { return e.nombre === 'word/document.xml'; })) return { ok: false, motivo: 'no es un documento de Word' };
      return { ok: true };
    } catch (e) { return { ok: false, motivo: 'no es un documento de Word' }; }
  }

  /* Elige, comprueba y guarda un .docx en `_GESTOR/PLANTILLAS` con un nombre libre.
     Devuelve el nombre guardado, o null (cerrado el cuadro, o avisado el problema). `antesDeEscribir(nombre)` puede
     devolver false para no escribir nada (la pregunta de «Sustituir el fichero»). */
  async function traerWord(antesDeEscribir) {
    var file = await elegirWord();
    if (!file) return null;
    var c = await comprobarWord(file);
    if (!c.ok) { U.aviso('No he podido usar «' + file.name + '»: ' + c.motivo + '.', 'malo'); return null; }
    try {
      var dir = await carpeta();
      var nombre = await ficheroLibre(dir, baseDe(file.name));
      if (antesDeEscribir && (await antesDeEscribir(nombre)) === false) return null;
      await PlantillasDocumento._interno.guardarBlobEnCarpeta(dir, nombre, file);
      return nombre;
    } catch (e) {
      U.aviso('No he podido guardar el Word: ' + U.mensajeDeError(e), 'malo');
      return null;
    }
  }

  /* ¿Qué otras plantillas de Word usan el mismo fichero? */
  function otrasConElMismoFichero(datos, p) {
    return ((datos && datos.documentos) || []).filter(function (x) { return x.id !== p.id && x.fichero === p.fichero; });
  }

  /* «Sustituir el fichero…» de una plantilla de Word. `alTerminar()` repinta la lista. */
  async function sustituir(p, alTerminar) {
    var datos = await Plantillas.cargar(App.E.gestor);
    var otras = otrasConElMismoFichero(datos, p);
    var alcance = 'sola';
    var nuevo = await traerWord(async function () {
      if (!otras.length) return true;
      var eleccion = '';
      var cuerpo = '<p>Este Word lo usan también: ' + U.escapar(otras.map(function (x) { return x.nombre; }).join(', ')) + '.</p>' +
        '<p><button type="button" class="boton" id="pf-solo-esta">Solo en esta</button></p>';
      var promesa = U.preguntar('Sustituir el fichero', cuerpo, 'En todas');
      var solo = document.getElementById('pf-solo-esta');
      if (solo) solo.onclick = function () { eleccion = 'sola'; document.getElementById('cuadro-cancelar').click(); };
      var ok = await promesa;
      if (ok) { alcance = 'todas'; return true; }
      if (eleccion === 'sola') { alcance = 'sola'; return true; }
      return false;   /* Cancelar: no se escribe nada */
    });
    if (!nuevo) return false;
    var antes = {};
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.documentos.forEach(function (x) {
          if (x.id === p.id || (alcance === 'todas' && x.fichero === p.fichero)) { antes[x.id] = x.fichero; x.fichero = nuevo; }
        });
        return actual;
      });
    } catch (e) { U.aviso('No he podido sustituir el fichero: ' + U.mensajeDeError(e), 'malo'); return false; }
    U.aviso('Fichero sustituido.', 'bueno', {
      boton: 'Deshacer',
      alPulsar: async function () {
        try {
          await Plantillas.guardar(App.E.gestor, function (actual) {
            actual.documentos.forEach(function (x) { if (antes[x.id] !== undefined && x.fichero === nuevo) x.fichero = antes[x.id]; });
            return actual;
          });
          U.aviso('Fichero devuelto al de antes.', 'bueno');
        } catch (e) { U.aviso('No he podido deshacerlo: ' + U.mensajeDeError(e), 'malo'); }
        if (typeof alTerminar === 'function') alTerminar();
      }
    });
    if (typeof alTerminar === 'function') alTerminar();
    return true;
  }

  return { ficheroLibre: ficheroLibre, baseDe: baseDe, elegirWord: elegirWord, comprobarWord: comprobarWord, traerWord: traerWord,
    otrasConElMismoFichero: otrasConElMismoFichero, sustituir: sustituir };
})();
window.PlantillasFichero = PlantillasFichero;
