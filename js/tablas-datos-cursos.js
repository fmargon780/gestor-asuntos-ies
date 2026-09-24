/* ============================================================
   tablas-datos-cursos.js — entender lo que se escribe en el campo
   «Cursos que pide» del tipo DESEMPEÑO FUNCIÓN TUTORIAL (24-sep-2026,
   fila 123, docs/CERTIFICADO-TUTORIA-DEL-CENTRO.md). Pura, sin pantalla.

   `TablasDatosCursos.entender(texto)` devuelve:
   - `null` si está vacío (se sacan todos los periodos);
   - `{ entendido: true, anios: [2017, 2018, …] }` con el año en que
     empieza cada curso pedido;
   - `{ entendido: false }` si no se entiende (se sacan todos y se avisa).
   Formatos: «2017-2018», «2017/18», «17-18», «2017» (el curso que empieza
   ese año); varios separados por coma, punto y coma o «y»; y rangos
   «2017-2018 a 2019-2020» (también con «hasta»).
   `TablasDatosCursos.anioDe(curso)`: el año en que empieza un curso de la
   tabla («2025/2026» → 2025).
   ============================================================ */
var TablasDatosCursos = (function () {

  function anio(t) {
    var n = parseInt(t, 10);
    if (isNaN(n)) return NaN;
    if (t.length === 2) return n > 50 ? 1900 + n : 2000 + n;
    return n;
  }

  /* Un curso suelto → el año en que empieza; NaN si no lo es. */
  function unCurso(t) {
    t = String(t || '').trim().replace(/^(el\s+)?curso\s+/i, '');
    var m = t.match(/^(\d{2}|\d{4})\s*[-\/]\s*(\d{2}|\d{4})$/);
    if (m) {
      var a = anio(m[1]), b = anio(m[2]);
      return (b - a === 1 || (m[2].length === 2 && (b % 100) === ((a + 1) % 100))) ? a : NaN;
    }
    if (/^\d{4}$/.test(t)) return anio(t);
    return NaN;
  }

  function entender(texto) {
    var t = String(texto || '').trim();
    if (!t) return null;
    var anios = [];
    var trozos = t.split(/\s*(?:,|;|\s+y\s+)\s*/i).filter(Boolean);
    for (var i = 0; i < trozos.length; i++) {
      var rango = trozos[i].split(/\s+(?:a|hasta)\s+/i);
      if (rango.length > 2) return { entendido: false };
      var desde = unCurso(rango[0]);
      var hasta = rango.length === 2 ? unCurso(rango[1]) : desde;
      if (isNaN(desde) || isNaN(hasta) || hasta < desde || hasta - desde > 60) return { entendido: false };
      for (var a = desde; a <= hasta; a++) if (anios.indexOf(a) === -1) anios.push(a);
    }
    return anios.length ? { entendido: true, anios: anios.sort() } : { entendido: false };
  }

  function anioDe(curso) {
    var m = String(curso || '').match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  return { entender: entender, anioDe: anioDe };
})();
window.TablasDatosCursos = TablasDatosCursos;
