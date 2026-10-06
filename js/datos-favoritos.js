/* ============================================================
   datos-favoritos.js — los datos del tercero que se ven junto al
   nombre del asunto (fila 272, docs/DATOS-FAVORITOS-EN-LA-FICHA.md).

   La parte sin pantalla: qué datos tiene cada clase de tercero, qué
   datos ha elegido el centro para verlos (hasta 3 por clase, una sola
   elección para todos los ordenadores) y el valor de cada uno para una
   persona concreta. Lo pinta js/ficha-datos-favoritos.js.

   La elección vive en `registro.ajustesAvisos.datosFavoritos`
   (`{ 'ALUMNADO': ['unidad'], … }`), en `_GESTOR`, como los demás
   ajustes del centro. Una clase sin clave usa lo de fábrica (la unidad
   para el alumnado, nada para las demás); una clase con lista vacía es
   que alguien eligió no ver ninguno.
   ============================================================ */
var DatosFavoritos = (function () {

  var MAXIMO = 3;
  var DE_FABRICA = { 'ALUMNADO': ['unidad'] };
  /* Dos títulos que son el mismo dato (el grupo del alumno es su unidad). */
  var SINONIMOS = { 'grupo': 'unidad' };
  /* Ya están en el nombre del asunto: no se ofrecen. */
  var FUERA = /^(nombre|apellidos?|primer apellido|segundo apellido|alumno(\/a)?|razon social)$/;

  function clave(titulo) {
    var n = U.normalizar(String(titulo || ''));
    return SINONIMOS[n] || n;
  }

  /* Lo elegido para una clase, en el orden en que se marcó. */
  function elegidos(categoria) {
    var ajustes = App.E && App.E.registro && App.E.registro.ajustesAvisos;
    var m = ajustes && ajustes.datosFavoritos;
    if (m && Array.isArray(m[categoria])) return m[categoria].slice(0, MAXIMO);
    return (DE_FABRICA[categoria] || []).slice();
  }

  /* Solo se toca la clase que se ha cambiado. */
  async function guardar(categoria, claves) {
    await App.guardarRegistroFresco(function (registro) {
      registro.ajustesAvisos = registro.ajustesAvisos || {};
      var m = registro.ajustesAvisos.datosFavoritos;
      if (!m || typeof m !== 'object') m = registro.ajustesAvisos.datosFavoritos = {};
      m[categoria] = claves.slice(0, MAXIMO);
    });
  }

  /* Todos los datos que la app tiene de un tercero de esa clase, con su
     valor (vacío si esta persona no lo tiene): `[{ clave, titulo, valor }]`.
     La lista sale también de las columnas que existen en el fichero
     (`fuente.cabecera`), no solo de las que esta persona tiene rellenas. */
  function filas(persona, categoria, fuente) {
    var salida = [], indice = {};
    function meter(titulo, valor) {
      var k = clave(titulo);
      if (!k || FUERA.test(k)) return;
      /* La unidad de un alumno es la de este curso: no la de una fila vieja del fichero. */
      if (k === 'unidad' && categoria === 'ALUMNADO' && indice[k] !== undefined) return;
      var v = (valor === undefined || valor === null) ? '' : String(valor).trim();
      var titulo2 = k === 'unidad' ? 'Unidad' : String(titulo);
      if (indice[k] === undefined) { indice[k] = salida.length; salida.push({ clave: k, titulo: titulo2, valor: v }); }
      else if (!salida[indice[k]].valor && v) salida[indice[k]].valor = v;   /* el primero con valor manda */
    }
    try {
      if (persona) {
        if (categoria === 'ALUMNADO') {
          meter('Unidad', persona.matriculado ? persona.unidad : '');
          var da = Datos.destacadosAlumno(persona);
          da.destacados.concat(da.resto).forEach(function (f) { if (f) meter(f.titulo, f.valor); });
          if (window.FichaPersonaReparto) {
            var reparto = FichaPersonaReparto.alumno(persona);
            Object.keys(reparto).forEach(function (id) {
              reparto[id].filas.forEach(function (f) { meter(f.titulo, f.valor); });
            });
          }
          var bd = window.AlumnadoBD && AlumnadoBD.enMemoria();
          if (bd && window.AlumnadoBDVer) {
            AlumnadoBDVer.apartados(bd).forEach(function (ap) {
              ap.campos.forEach(function (c) { if (c.tipo !== 'tabla') meter(c.etiqueta || c.clave, ''); });
            });
          }
        } else if (categoria === 'PERSONAL') {
          var dp = Datos.destacadosPersona(persona);
          dp.destacados.concat(dp.resto).forEach(function (f) { if (f) meter(f.titulo, f.valor); });
        } else {
          meter('NIF', persona.nif);
          meter('Nombre comercial', persona.comercial);
          meter('Referencia', persona.referencia);
          meter('Documento', persona.documento);
        }
        var campos = persona.campos || {};
        Object.keys(campos).forEach(function (c) { meter(c, campos[c]); });
      }
    } catch (e) { /* sin esos datos: queda lo que ya se ha podido meter */ }
    ((fuente && fuente.cabecera) || []).forEach(function (t) { meter(t, ''); });
    return salida;
  }

  /* Lo que se ve junto al nombre: `[{ titulo, valor }]` de lo elegido que
     esta persona tiene, en el orden elegido. */
  function visibles(persona, categoria, fuente) {
    var todas = filas(persona, categoria, fuente);
    var por = {};
    todas.forEach(function (f) { por[f.clave] = f; });
    return elegidos(categoria).map(function (k) { return por[k]; })
      .filter(function (f) { return f && f.valor; });
  }

  return { MAXIMO: MAXIMO, clave: clave, elegidos: elegidos, guardar: guardar, filas: filas, visibles: visibles };
})();
window.DatosFavoritos = DatosFavoritos;
