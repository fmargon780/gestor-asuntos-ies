/* ============================================================
   horario.js — «Sus profesores» de un asunto (fila 572,
   docs/572-SUS-PROFESORES-POR-ALUMNO.md). Es el enganche que dejó previsto
   la fila 555 en js/correo-para.js: `Horario.profesoresDeUnidades(a, ctx)`.

   Lee las fichas que deja el Centro de datos (js/centro-de-datos-profesorado.js
   las copia a `_GESTOR/datos`):
     - `PROFESORADO-ALUMNOS-HECHO <curso>.json`: de cada alumno, los profesores de las materias de su matrícula.
     - `PROFESORADO-GRUPOS-HECHO <curso>.json`: quién da cada materia en cada grupo.

   - Alumno: su ficha de `profesorado-alumnos` (su `id` es el del alumno). Un asunto con varios alumnos relacionados: los de todos.
   - Asunto de grupo: todos los profesores de ese grupo (`profesorado-grupos`).
   - Un profesor que da dos o más materias sale una sola vez, con todas («Matemáticas y Física y Química»).
   - El correo del profesor: su ficha del personal (`fichaId` del dato, o su nombre si no hay dos iguales) o, si no tiene,
     el que alguien escribió a mano (`CorreosAMano`). Sin él, sale igual y se le pide.
   - Sin el dato de ese curso: no sale nadie.
   - Curso: el del asunto; si no tiene, el actual.
   ============================================================ */
var Horario = (function () {

  var ACUERDO_MAXIMO = 1;
  var memoria = {};

  function norm(t) { return String(window.U ? U.normalizar(String(t || '')) : String(t || '').toLowerCase()).replace(/[.,;]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function claveDeUnidad(u) {
    return window.TutorDelGrupo ? TutorDelGrupo.claveDeUnidad(u) : norm(u).replace(/[\s.\-_º°ª]+/g, '');
  }
  function olvidar() { memoria = {}; }

  /* ---------- funciones puras ---------- */

  /* «Matemáticas» + «Física y Química» -> «Matemáticas y Física y Química». */
  function textoDeMaterias(materias) { return (materias || []).join(' y '); }

  /* PURA. De las líneas { profesor, materia, fichaId } -> un profesor una sola vez, con sus materias (sin repetir) y la primera ficha que traiga.
     Devuelve [{ clave, nombre, materias, fichaId }] en el orden en que salen. */
  function juntar(lineas) {
    var salida = [], por = {};
    (lineas || []).forEach(function (l) {
      var nombre = String((l && l.profesor) || '').trim();
      if (!nombre) return;
      var k = norm(nombre);
      var p = por[k];
      if (!p) { p = por[k] = { clave: k, nombre: nombre, materias: [], fichaId: '' }; salida.push(p); }
      var m = String(l.materia || '').trim();
      if (m && !p.materias.some(function (x) { return norm(x) === norm(m); })) p.materias.push(m);
      if (!p.fichaId && l.fichaId) p.fichaId = String(l.fichaId);
    });
    return salida;
  }

  function registrosDe(parte) { return (parte && Array.isArray(parte.registros)) ? parte.registros : []; }

  /* PURA. La ficha (fichaId) del profesor en esa unidad y materia, según `profesorado-grupos`. */
  function fichaIdDe(grupos, unidad, materia, profesor) {
    var u = claveDeUnidad(unidad), m = norm(materia), p = norm(profesor);
    var r = registrosDe(grupos).filter(function (x) {
      var d = (x && x.datos) || {};
      return claveDeUnidad(d.unidad) === u && norm(d.materia) === m && norm(d.profesor) === p && d.fichaId;
    })[0];
    return r ? String(r.datos.fichaId) : '';
  }

  /* PURA. Las líneas de un alumno: de su ficha de `profesorado-alumnos`, con la ficha del personal que dice `profesorado-grupos`. */
  function lineasDeAlumno(registro, grupos) {
    var d = (registro && registro.datos) || {};
    return (Array.isArray(d.profesores) ? d.profesores : []).map(function (f) {
      return { profesor: f && f.profesor, materia: f && f.materia, fichaId: fichaIdDe(grupos, d.unidad, f && f.materia, f && f.profesor) };
    });
  }

  /* PURA. Las líneas de una unidad: todos los de `profesorado-grupos` de ese grupo. */
  function lineasDeUnidad(unidad, grupos) {
    var u = claveDeUnidad(unidad);
    return registrosDe(grupos).filter(function (x) { return claveDeUnidad(((x && x.datos) || {}).unidad) === u; })
      .map(function (x) { return { profesor: x.datos.profesor, materia: x.datos.materia, fichaId: x.datos.fichaId }; });
  }

  /* PURA. El registro de un alumno en `profesorado-alumnos`: por su `id` y, si no, por su nombre. */
  function registroDelAlumno(alumnos, persona) {
    var regs = registrosDe(alumnos);
    var id = String((persona && persona.id) || '');
    var r = id ? regs.filter(function (x) { return String(x.id) === id; })[0] : null;
    if (r) return r;
    var n = norm(persona && persona.nombre);
    return n ? regs.filter(function (x) { return norm(((x && x.datos) || {}).alumno) === n; })[0] || null : null;
  }

  /* PURA. El curso corto («26-27») que dice un asunto, o ''. */
  function cursoCorto(texto) {
    var t = String(texto || '');
    var m = /(\d{4})\D+(\d{4})/.exec(t);
    if (m) return m[1].slice(2) + '-' + m[2].slice(2);
    m = /^(\d{2})\D(\d{2})$/.exec(t.trim());
    return m ? m[1] + '-' + m[2] : '';
  }

  /* PURA. De los profesores juntados y el personal ({ nombre, documento, ... }) -> la persona del personal de cada uno, o null. */
  function personaDe(p, personal) {
    var doc = function (x) { return String(x || '').toUpperCase().replace(/[\s.\-]/g, ''); };
    if (p.fichaId) {
      var porId = personal.filter(function (x) { return doc(x.documento) === doc(p.fichaId); })[0];
      if (porId) return porId;
    }
    var iguales = personal.filter(function (x) { return norm(x.nombre) === p.clave; });
    return iguales.length === 1 ? iguales[0] : null;
  }

  /* ---------- lo que se lee ---------- */

  function valida(parte, conjunto) {
    return !!parte && parte.conjunto === conjunto && Array.isArray(parte.registros) && !(Number(parte.acuerdoHecho) > ACUERDO_MAXIMO);
  }

  async function leerParte(curso, prefijo, conjunto) {
    var clave = prefijo + curso;
    if (memoria[clave] !== undefined) return memoria[clave];
    var parte = null;
    try {
      var d = window.App && App.E && App.E.datos;
      if (d) { parte = await Carpetas.leerJson(d, prefijo + curso + '.json'); if (!valida(parte, conjunto)) parte = null; }
    } catch (e) { parte = null; }
    memoria[clave] = parte;
    return parte;
  }

  async function personalDelCentro() {
    try { return ((await Datos.cargar(App.E.datos, 'PERSONAL')).lista) || []; } catch (e) { return []; }
  }

  /* Los profesores de un asunto: [{ clave, nombre, materia, claveCorreo, correos }]. `ctx`: { persona, relacionados: [{ nombre, persona }] }.
     Nunca lanza: lo que no se pueda saber, no sale. */
  async function profesoresDeUnidades(a, ctx) {
    try {
      var f = (a && a.ficha) || {};
      var curso = cursoCorto(f.curso || (a && a.curso)) || U.cursoActual();
      var alumnos = await leerParte(curso, 'PROFESORADO-ALUMNOS-HECHO ', 'profesorado-alumnos');
      var grupos = await leerParte(curso, 'PROFESORADO-GRUPOS-HECHO ', 'profesorado-grupos');
      if (!alumnos && !grupos) return [];
      var alumnado = [];
      if (ctx && ctx.persona && ctx.persona.categoria === 'ALUMNADO') alumnado.push(ctx.persona);
      ((ctx && ctx.relacionados) || []).forEach(function (r) { if (r && r.persona && r.persona.categoria === 'ALUMNADO') alumnado.push(r.persona); });
      var lineas = [];
      if (window.AsuntoDeGrupo && AsuntoDeGrupo.esGrupo(a)) {
        var unidades = {};
        alumnado.forEach(function (p) { if (p.unidad) unidades[claveDeUnidad(p.unidad)] = p.unidad; });
        var propia = f.grupo && f.grupo.nombre;
        if (propia && lineasDeUnidad(propia, grupos).length) unidades[claveDeUnidad(propia)] = propia;
        Object.keys(unidades).forEach(function (k) { lineas = lineas.concat(lineasDeUnidad(unidades[k], grupos)); });
      } else {
        alumnado.forEach(function (p) {
          var r = registroDelAlumno(alumnos, p);
          if (r) lineas = lineas.concat(lineasDeAlumno(r, grupos));
        });
      }
      var juntos = juntar(lineas);
      if (!juntos.length) return [];
      var personal = await personalDelCentro();
      var aMano = window.CorreosAMano ? await CorreosAMano.leerTodos() : {};
      return juntos.map(function (p) {
        var ficha = personaDe(p, personal);
        var correos = ficha && window.Destinatarios ? Destinatarios.direccionesDe(ficha) : [];
        var claveCorreo = ficha && window.TablasDatosLeer ? TablasDatosLeer.clave(ficha.documento) : '';
        if (!correos.length && claveCorreo && aMano[claveCorreo] && aMano[claveCorreo].correo) correos = [aMano[claveCorreo].correo];
        return { clave: p.clave, nombre: p.nombre, materia: textoDeMaterias(p.materias), claveCorreo: claveCorreo || '', correos: correos };
      });
    } catch (e) { return []; }
  }

  return {
    profesoresDeUnidades: profesoresDeUnidades, olvidar: olvidar,
    juntar: juntar, textoDeMaterias: textoDeMaterias, fichaIdDe: fichaIdDe, lineasDeAlumno: lineasDeAlumno, lineasDeUnidad: lineasDeUnidad,
    registroDelAlumno: registroDelAlumno, cursoCorto: cursoCorto, personaDe: personaDe
  };
})();
window.Horario = Horario;
