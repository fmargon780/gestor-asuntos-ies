/* ============================================================
   correo-adjuntos.js — los documentos que se marcan para ir con el
   correo del asunto.

   Hasta el 24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md) esto
   copiaba los documentos a GESTOR-BANDEJA y dejaba un encargo para que
   Apps Script montara un borrador en Gmail cada minuto: un mecanismo
   que fallaba en silencio (los encargos se quedaban sin recoger) y que
   obligaba a Francisco a irse del asunto a buscar el borrador. Ahora
   los documentos marcados se leen aquí mismo, se pasan a base64 y
   viajan en la llamada que hace js/correo-cuadro.js a la aplicación
   web de Apps Script (js/correo-enviar.js), que manda el correo en el
   momento. Este fichero ya no toca GESTOR-BANDEJA ni `envios.json`.

   Pinta el bloque "Documentos de este asunto" dentro del cuadro de
   Correo (nunca en el de Séneca: allí no hay adjuntos) y deja las
   utilidades para pesarlos y leerlos que usa js/correo-cuadro.js al
   enviar.
   ============================================================ */
var CorreoAdjuntos = (function () {

  var MAXIMO_BYTES = 20 * 1024 * 1024;

  var ultimaLista = [];   /* [{nombre, tam}], de lo último que se ha pintado */

  function $(id) { return document.getElementById(id); }

  function tamanoLegible(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* ---------- el bloque dentro del cuadro de Correo ---------- */

  /* Devuelve el HTML del bloque, o cadena vacía si el asunto no tiene
     ningún documento (entonces el bloque no se pinta). `marcados`
     (fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, sección 3): nombres
     que nacen ya marcados —los documentos de un hito, al "Comunicar"
     desde él—; sin él, todos desmarcados, como siempre. Solo marca
     los que de verdad están en la lista de la carpeta. */
  async function pintarBloque(a, marcados) {
    ultimaLista = [];
    if (!a || !a.handle) return '';
    var ficheros;
    try { ficheros = await Carpetas.ficheros(a.handle); } catch (e) { return ''; }
    if (!ficheros.length) return '';

    for (var i = 0; i < ficheros.length; i++) {
      var tam = 0;
      try { tam = (await ficheros[i].handle.getFile()).size; } catch (e) { /* se enseña sin tamaño */ }
      ultimaLista.push({ nombre: ficheros[i].nombre, tam: tam });
    }

    var marcadosLista = marcados || [];
    var filas = ultimaLista.map(function (f) {
      var marcado = marcadosLista.indexOf(f.nombre) !== -1;
      return '<label class="correo-fila">' +
        '<input type="checkbox" class="adjunto-marca" value="' + U.escapar(f.nombre) + '"' +
          (marcado ? ' checked' : '') + '>' +
        '<span><strong>' + U.escapar(f.nombre) + '</strong>' +
        '<span class="suave"> · ' + tamanoLegible(f.tam) + '</span></span>' +
        '</label>';
    }).join('');

    /* Desmarcados de partida: lo normal es mandar uno, no todos. */
    return '<label class="etiqueta">Documentos de este asunto</label>' +
      '<div id="adjuntos-lista">' + filas + '</div>';
  }

  /* ---------- lo que usa js/correo-cuadro.js al enviar ---------- */

  /* Copia de la última lista pintada, con nombre y tamaño de cada
     documento del asunto (no solo los marcados). */
  function listaConTamanos() { return ultimaLista.slice(); }

  function totalBytesDe(nombres) {
    var porNombre = {};
    ultimaLista.forEach(function (f) { porNombre[f.nombre] = f.tam; });
    var total = 0;
    (nombres || []).forEach(function (n) { total += porNombre[n] || 0; });
    return total;
  }

  /* El fichero, en base64 sin el prefijo "data:...;base64,". */
  function aBase64(file) {
    return new Promise(function (resolve, reject) {
      var lector = new FileReader();
      lector.onload = function () {
        var resultado = String(lector.result || '');
        var coma = resultado.indexOf(',');
        resolve(coma !== -1 ? resultado.slice(coma + 1) : resultado);
      };
      lector.onerror = function () { reject(lector.error || new Error('No se ha podido leer el fichero.')); };
      lector.readAsDataURL(file);
    });
  }

  return {
    pintarBloque: pintarBloque,
    listaConTamanos: listaConTamanos,
    totalBytesDe: totalBytesDe,
    tamanoLegible: tamanoLegible,
    aBase64: aBase64,
    MAXIMO_BYTES: MAXIMO_BYTES
  };
})();
window.CorreoAdjuntos = CorreoAdjuntos;
