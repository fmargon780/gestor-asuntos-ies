/* ============================================================
   ficha-persona-reparto.js — qué tarjeta de la ficha de una persona
   lleva cada dato (fila 252, docs/FICHA-DE-PERSONA-EN-TARJETAS.md).

   Las dos tablas de reglas viven aquí y en ningún otro sitio:
   - APARTADO_A_TARJETA: los datos de la base de datos de alumnado, por
     su `apartado` (docs/ACUERDO-ALUMNADO.md). Un apartado que no esté en
     la tabla va a «Otros datos del fichero»: así uno nuevo aparece solo.
   - REGLAS_DE_TITULO: las filas del RegAlum (y de cualquier otro CSV del
     alumnado), por el título de su columna.
   `alumno(persona)` devuelve, por tarjeta, { filas: [{ titulo, valor }],
   tablas: [{ titulo, html, n }] }. Un dato que está en las dos fuentes
   sale una sola vez (unir ya pone el de la base en la columna del RegAlum
   que se llama igual, así que aquí basta con no repetirlo).
   ============================================================ */
var FichaPersonaReparto = (function () {

  var APARTADO_A_TARJETA = {
    'identidad': 'datos', 'contacto': 'familia', 'matricula': 'matricula', 'materias': 'materias',
    'historia': 'trayectoria', 'procedencia': 'procedencia', 'apoyos': 'procedencia',
    'reparto definitivo': 'procedencia', 'observaciones': 'otros'
  };

  /* En este orden: la primera que encaja manda. `null` = no va a ninguna
     tarjeta de datos (lo enseña ya la cabecera o la tarjeta de familia). */
  var REGLAS_DE_TITULO = [
    { re: /^dni$|^documento$|^nie$|^nif$|^alumno(\/a)?$|^nombre$|^n.? ?id\.? escolar$|^nº ?id\.? escolar$/, tarjeta: null },
    { re: /tutor.*unidad|unidad.*tutor/, tarjeta: 'matricula' },
    { re: /tutor|padre|madre|responsable|familia/, tarjeta: null },
    { re: /telefono|movil|correo|e-?mail/, tarjeta: null },
    { re: /^(primer|segundo) apellido$|^apellidos?$/, tarjeta: null },
    { re: /^edad|^matricula$|^grupo$|^curso$|ultima matricula|^unidad|estado.*matricula|ano de la matricula|ensenanza/, tarjeta: 'matricula' },
    { re: /nacimiento|nacionalidad|sexo|genero|domicilio|direccion|localidad|provincia|codigo postal|^c\.? ?p\.?$/, tarjeta: 'datos' }
  ];

  function norm(t) { return U.normalizar(String(t || '')); }

  /* Dos títulos que son el mismo dato en el RegAlum y en la base. */
  var SINONIMOS = { 'unidad': 'grupo' };
  function claveDeTitulo(t) { var n = norm(t); return SINONIMOS[n] || n; }

  function tarjetaDeTitulo(titulo) {
    var t = norm(titulo);
    for (var i = 0; i < REGLAS_DE_TITULO.length; i++) {
      if (REGLAS_DE_TITULO[i].re.test(t)) return REGLAS_DE_TITULO[i].tarjeta;
    }
    return 'otros';
  }

  function tarjetaDeApartado(apartado) {
    return APARTADO_A_TARJETA[norm(apartado)] || 'otros';
  }

  /* Los que ya enseña la cabecera: nombre, apellidos y documento. */
  function esDeCabecera(c) {
    return /^(nombre|apellidos?|primer apellido|segundo apellido|documento|dni|nie|nif)$/.test(norm(c.etiqueta || c.clave)) ||
           /^(nombre|apellido1|apellido2|apellidos|documento|dni)$/.test(norm(c.clave));
  }

  function alumno(p) {
    var por = {};
    function de(id) { return por[id] || (por[id] = { filas: [], tablas: [], bd: false }); }

    var vistos = {};
    var dest = Datos.destacadosAlumno(p);
    dest.destacados.concat(dest.resto).forEach(function (f) {
      if (!f || f.valor === '' || f.valor === undefined || f.valor === null) return;
      var id = tarjetaDeTitulo(f.titulo);
      if (!id || vistos[claveDeTitulo(f.titulo)]) return;   /* el primero manda: una sola vez */
      vistos[claveDeTitulo(f.titulo)] = true;
      de(id).filas.push({ titulo: f.titulo, valor: String(f.valor) });
    });

    var datos = window.AlumnadoBD && AlumnadoBD.enMemoria();
    if (datos && p.bd && window.AlumnadoBDVer) {
      var columnas = {};
      Object.keys(p.campos || {}).forEach(function (k) { columnas[norm(k)] = true; });
      var hayTutores = Datos.tutoresDe(p).length > 0;
      AlumnadoBDVer.apartados(datos).forEach(function (ap) {
        var id = tarjetaDeApartado(ap.nombre);
        ap.campos.forEach(function (c) {
          var v = p.bd[c.clave];
          if (AlumnadoBDVer.vacio(v)) return;
          if (esDeCabecera(c)) return;
          if (c.tipo === 'tabla') {
            var t = de(id); t.bd = true;
            t.tablas.push({ titulo: c.etiqueta || c.clave, html: AlumnadoBDVer.tablaHtml(c, v), n: v.length });
            return;
          }
          if (columnas[norm(c.etiqueta || c.clave)] || vistos[claveDeTitulo(c.etiqueta || c.clave)]) return;   /* ya está, una sola vez */
          if (id === 'familia' && hayTutores && /tutor|padre|madre|responsable/.test(norm(c.etiqueta || c.clave))) return;
          var tj = de(id); tj.bd = true;
          tj.filas.push({ titulo: c.etiqueta || c.clave, valor: AlumnadoBDVer.texto(c, v) });
        });
      });
    }
    return por;
  }

  return { alumno: alumno, tarjetaDeTitulo: tarjetaDeTitulo, tarjetaDeApartado: tarjetaDeApartado,
           APARTADO_A_TARJETA: APARTADO_A_TARJETA };
})();
window.FichaPersonaReparto = FichaPersonaReparto;
