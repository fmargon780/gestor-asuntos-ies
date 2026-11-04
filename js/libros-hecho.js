/* ============================================================
   libros-hecho.js — los libros de texto que el Centro de datos deja ya
   preparados, y el cruce con la matrícula de un alumno (fila 501,
   docs/501-FICHA-ENTREGA-LIBROS.md; el acuerdo, en
   docs/CENTRO-DE-DATOS-CONTRATO-2.md, «El conjunto `libros`»).

   - Las partes (`hecho/libros/<curso>/curso.json`) las copia
     js/centro-de-datos-libros.js a `_GESTOR/datos/LIBROS-HECHO <curso>.json`.
   - `cargar()`: los registros del curso de hoy (o, si no hay, el curso más reciente que haya).
   - `fichaDe(persona, registros)`: PURA. Qué libros lleva la ficha de ese alumno, cruzando su nivel y las
     asignaturas de su matrícula (situación MATR o CONV) con el listado de su nivel. Si algo no cuadra, no hay
     ficha y `avisos` dice por qué (siempre en rojo, y se arregla en el Centro de datos).
   ============================================================ */
var LibrosHecho = (function () {

  var RE_FICHERO = /^LIBROS-HECHO (\d{2}-\d{2})\.json$/i;
  var NIVELES_TEXTO = { eso1: '1º ESO', eso2: '2º ESO', eso3: '3º ESO', eso4: '4º ESO', bac1: '1º Bachillerato', bac2: '2º Bachillerato' };

  function nombreDe(curso) { return 'LIBROS-HECHO ' + curso + '.json'; }
  function norm(t) { return U.normalizar(t); }

  /* ¿Vale como parte de libros? */
  function vale(parte) {
    return !!parte && typeof parte === 'object' && parte.conjunto === 'libros' && Array.isArray(parte.registros);
  }

  /* «bac1c» y «bac1h» son «bac1»: el listado de Bachillerato puede venir por modalidad. */
  function nivelDelListado(n) {
    var t = norm(n);
    if (/^bac1/.test(t)) return 'bac1';
    if (/^bac2/.test(t)) return 'bac2';
    return t;
  }

  /* «1º de E.S.O.» → eso1; «2º de Bachillerato» → bac2; lo que no se entienda, vacío. */
  function nivelDeCurso(curso) {
    var m = /(\d)\s*[ºo°.]?\D*?(e\.?\s?s\.?\s?o|bach)/i.exec(norm(curso));
    if (!m) return '';
    return (/^b/i.test(m[2]) ? 'bac' : 'eso') + m[1];
  }

  function nivelTexto(nivel) { return NIVELES_TEXTO[nivel] || ''; }

  /* Las partes de `_GESTOR/datos` → { curso: parte }, solo las que valen. Una rota se ignora. */
  async function partes() {
    var salida = {};
    var dir = window.App && App.E && App.E.datos;
    if (!dir) return salida;
    var lista = await Carpetas.ficheros(dir);
    for (var i = 0; i < lista.length; i++) {
      var m = RE_FICHERO.exec(lista[i].nombre);
      if (!m) continue;
      var parte = null;
      try { parte = await Carpetas.leerJson(dir, lista[i].nombre); } catch (e) { parte = null; }
      if (vale(parte)) salida[m[1]] = parte;
    }
    return salida;
  }

  /* Los registros (`datos`) del curso de hoy; si no hay parte de hoy, los del curso más reciente. */
  async function cargar() {
    var todas = await partes();
    var cursos = Object.keys(todas).sort();
    if (!cursos.length) return { curso: '', registros: [], hay: false };
    var hoy = U.cursoActual();
    var curso = todas[hoy] ? hoy : cursos[cursos.length - 1];
    return {
      curso: curso, hay: true,
      registros: todas[curso].registros.map(function (r) { return (r && r.datos) || {}; }).filter(function (d) { return d.materia; })
    };
  }

  /* Las materias de la matrícula del alumno que cuentan: [texto]. `null` si no se sabe ninguna. */
  function materiasDe(persona) {
    var filas = persona && persona.bd && persona.bd.materias;
    if (!Array.isArray(filas) || !filas.length) return null;
    var salida = [];
    filas.forEach(function (f) {
      var materia = f && (f.materia || f.Materia || f.asignatura);
      if (!materia) return;
      var sit = norm(f.situacion || f.Situacion || 'MATR');
      if (sit && sit.indexOf('matr') !== 0 && sit.indexOf('conv') !== 0) return;
      salida.push(String(materia).trim());
    });
    return salida;
  }

  /* PURA. { ok, avisos: [texto], nivel, nivelTexto, libros: [asignatura] }.
     `registros`: los `datos` de los registros del curso (js/libros-hecho.js `cargar`). */
  function fichaDe(persona, registros) {
    var nombre = (persona && persona.nombre) || 'El alumno';
    var r = { ok: false, avisos: [], nivel: '', nivelTexto: '', libros: [] };
    var nivel = nivelDeCurso(persona && persona.curso);
    if (!nivel) { r.avisos.push(nombre + ': no sé de qué curso es su matrícula. No se puede generar la ficha.'); return r; }
    r.nivel = nivel;
    r.nivelTexto = nivelTexto(nivel);
    var delNivel = (registros || []).filter(function (d) { return nivelDelListado(d.nivel) === nivel; });
    if (!delNivel.some(function (d) { return d.conLibro; })) {
      r.avisos.push(nombre + ': el listado de libros no tiene libros de ' + r.nivelTexto + '. No se puede generar la ficha.');
      return r;
    }
    var materias = materiasDe(persona);
    if (!materias || !materias.length) {
      r.avisos.push(nombre + ': no tengo las asignaturas de su matrícula (vienen del Centro de datos). No se puede generar la ficha.');
      return r;
    }
    var vistos = {};
    materias.forEach(function (m) {
      var clave = norm(m);
      var filas = delNivel.filter(function (d) { return norm(d.materia) === clave; });
      if (!filas.length) {
        r.avisos.push(nombre + ': la asignatura «' + m + '» no está en el listado de libros. No se puede generar la ficha hasta arreglarlo en el Centro de datos.');
        return;
      }
      if (vistos[clave] || !filas.some(function (d) { return d.conLibro; })) return;
      vistos[clave] = true;
      r.libros.push(String(filas[0].materia).trim());
    });
    if (!r.avisos.length && !r.libros.length) {
      r.avisos.push(nombre + ': ninguna de sus asignaturas tiene libro en el listado. No se puede generar la ficha.');
    }
    r.ok = !r.avisos.length;
    return r;
  }

  return {
    RE_FICHERO: RE_FICHERO, nombreDe: nombreDe, vale: vale, partes: partes, cargar: cargar,
    nivelDeCurso: nivelDeCurso, nivelTexto: nivelTexto, materiasDe: materiasDe, fichaDe: fichaDe
  };
})();
window.LibrosHecho = LibrosHecho;
