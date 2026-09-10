/* ============================================================
   dni.js — el DNI del alumnado, y el aviso de que falta.

   Debajo del nombre de un alumno ya salen su grupo y su curso. Aquí se
   le añade el DNI, y se le deja buscar por él.

   Y algo más útil todavía: **cuando no consta y por edad ya debería
   tenerlo, se avisa**. En España el DNI es obligatorio a partir de los
   catorce años (Real Decreto 1553/2005, artículo 1). Tener delante al
   alumno o a su familia por otra gestión es la mejor ocasión para
   pedírselo.

   De dónde sale el DNI: del propio RegAlum.csv de Séneca. Séneca no
   siempre saca esa columna, y cuando la saca no siempre se llama
   igual, así que aquí se busca por el título: DNI, NIF, NIE,
   documento, identidad o pasaporte. Se dejan fuera las columnas de los
   tutores, que traen el documento del padre o de la madre.

   **Si la descarga no trae ninguna columna así, no se enseña nada ni se
   avisa de nada.** Mejor callar que dar por perdido un DNI que sí está,
   solo que no se ha descargado.

   Este fichero no toca ninguna pantalla: envuelve tres funciones que ya
   existen, `Datos.cargar`, `App.pieAlumno` y `Datos.destacadosAlumno`.
   Por eso el DNI sale a la vez en el buscador de Nuevo asunto, en
   Personas y empresas y en el contacto de la ficha de un asunto.
   ============================================================ */
(function () {

  var EDAD_OBLIGATORIA = 14;

  var TITULO_BUENO = /(^|[^a-z])(dni|nif|nie)([^a-z]|$)|documento|identidad|pasaporte/;
  var TITULO_DE_OTRO = /tutor|padre|madre|responsable|familia|escolar|matricula/;

  /* Un DNI son ocho cifras y una letra. Un NIE es X, Y o Z, siete
     cifras y una letra. Un pasaporte no tiene forma fija, así que se
     admite cualquier cosa de seis o más caracteres que lleve alguna
     letra: así no se cuela un número suelto. */
  function pareceUnDocumento(valor) {
    var t = String(valor || '').replace(/[\s.\-\/]/g, '').toUpperCase();
    if (t.length < 6 || t.length > 20) return false;
    if (/^\d{8}[A-Z]$/.test(t)) return true;
    if (/^[XYZ]\d{7}[A-Z]$/.test(t)) return true;
    return /^[A-Z0-9]+$/.test(t) && /[A-Z]/.test(t);
  }

  /* El documento del alumno, tal y como viene escrito en el CSV.
     Cadena vacía si no consta. */
  function documentoDe(alumno) {
    var campos = (alumno && alumno.campos) || {};
    var claves = Object.keys(campos);
    for (var i = 0; i < claves.length; i++) {
      if (!esTituloDeDocumento(claves[i])) continue;
      var valor = String(campos[claves[i]] || '').trim();
      if (pareceUnDocumento(valor)) return valor;
    }
    return '';
  }

  function esTituloDeDocumento(titulo) {
    var t = U.normalizar(titulo);
    return !TITULO_DE_OTRO.test(t) && TITULO_BUENO.test(t);
  }

  /* ¿Trae la descarga alguna columna de documento? Si no la trae, no
     hay nada que avisar: el DNI puede existir y no estar aquí.

     Hay que mirarlo en la CABECERA del CSV, no en la ficha del alumno:
     de la ficha se caen las columnas que vienen vacías, que son justo
     las de los alumnos a los que les falta el DNI. La cabecera se
     guarda aquí al cargar el fichero, un poco más abajo. */
  var cabeceraAlumnado = null;

  function hayColumnaDeDocumento(alumno) {
    if (cabeceraAlumnado && cabeceraAlumnado.some(esTituloDeDocumento)) return true;
    return Object.keys((alumno && alumno.campos) || {}).some(esTituloDeDocumento);
  }

  /* Cuántos años tiene hoy. Cadena vacía si no se sabe. */
  function edadDe(alumno) {
    return U.edadDesde((alumno && alumno.fechaNac) || '');
  }

  /* Le falta el DNI y por edad ya tendría que tenerlo. */
  function faltaElDni(alumno) {
    if (!alumno || alumno.categoria !== 'ALUMNADO') return false;
    if (documentoDe(alumno)) return false;
    if (!hayColumnaDeDocumento(alumno)) return false;
    var edad = edadDe(alumno);
    return edad !== '' && edad >= EDAD_OBLIGATORIA;
  }

  function textoDeAviso(alumno) {
    return 'FALTA EL DNI (' + edadDe(alumno) + ' años, ya debería tenerlo)';
  }

  /* ---------- 0. quedarse con la cabecera del RegAlum ----------

     Datos.cargar devuelve, además de la lista, los títulos de las
     columnas tal y como venían. Es lo único que dice si Séneca sacó o
     no la columna del documento. */

  if (typeof Datos !== 'undefined' && typeof Datos.cargar === 'function') {
    var comoEraCargar = Datos.cargar;
    Datos.cargar = async function (dir, categoria) {
      var r = await comoEraCargar(dir, categoria);
      if (categoria === 'ALUMNADO' && r) {
        if (r.cabecera) cabeceraAlumnado = r.cabecera;
        meterElDniEnLaBusqueda(r.lista);
      }
      return r;
    };
  }

  /* El buscador compara con `p.busca`, que trae el nombre y el número
     de identificación escolar. Aquí se le añade el DNI, para poder
     buscar a alguien escribiendo su documento.

     La lista viene de una caché y se carga muchas veces, así que cada
     alumno se marca para no añadirlo dos veces. */
  function meterElDniEnLaBusqueda(lista) {
    (lista || []).forEach(function (p) {
      if (!p || p.dniEnLaBusqueda) return;
      var doc = documentoDe(p);
      if (!doc) return;
      p.busca = (p.busca || '') + ' ' + U.normalizar(doc) + ' ' +
                U.normalizar(doc.replace(/[\s.\-\/]/g, ''));
      p.dniEnLaBusqueda = true;
    });
  }

  /* ---------- 1. la línea de debajo del nombre ----------

     La pinta `App.pieAlumno`, en js/asuntos-nuevo.js, y la usan el
     buscador de Nuevo asunto y la lista de Personas y empresas. */

  if (typeof App !== 'undefined' && typeof App.pieAlumno === 'function') {
    var comoEraElPie = App.pieAlumno;
    App.pieAlumno = function (p) {
      var texto = comoEraElPie(p);
      var doc = documentoDe(p);
      if (doc) return texto + '  ·  DNI ' + doc;
      if (faltaElDni(p)) return texto + '  ·  ' + textoDeAviso(p);
      return texto;
    };
  }

  /* ---------- 2. la ficha del alumno ----------

     La monta `Datos.destacadosAlumno`. El DNI entra justo detrás de la
     edad, que es el dato con el que se lee. */

  if (typeof Datos !== 'undefined' && typeof Datos.destacadosAlumno === 'function') {
    var comoEraLaFicha = Datos.destacadosAlumno;
    Datos.destacadosAlumno = function (alumno) {
      var r = comoEraLaFicha(alumno);
      var fila = null;

      var doc = documentoDe(alumno);
      if (doc) fila = { titulo: 'DNI', valor: doc };
      else if (faltaElDni(alumno)) {
        fila = { titulo: 'DNI', valor: 'No consta. Con ' + edadDe(alumno) +
                 ' años ya debería tenerlo: buena ocasión para pedírselo.' };
      }
      if (!fila) return r;

      /* Detrás de la edad si está; si no, arriba del todo. */
      var donde = 0;
      for (var i = 0; i < r.destacados.length; i++) {
        if (U.normalizar(r.destacados[i].titulo).indexOf('edad') === 0) { donde = i + 1; break; }
      }
      r.destacados.splice(donde, 0, fila);

      /* Y que no salga otra vez abajo, entre el resto de columnas. */
      r.resto = r.resto.filter(function (f) {
        return !(doc && String(f.valor).trim() === doc);
      });
      return r;
    };
  }

  /* Para que lo puedan usar otros módulos y las pruebas. */
  window.Dni = {
    EDAD_OBLIGATORIA: EDAD_OBLIGATORIA,
    de: documentoDe,
    falta: faltaElDni,
    hayColumna: hayColumnaDeDocumento,
    /* solo para las pruebas: olvidar lo que se sabe de la cabecera */
    olvidarLaCabecera: function () { cabeceraAlumnado = null; }
  };

})();
