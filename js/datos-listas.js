/* ============================================================
   datos-listas.js — escribir las listas de terceros dados de alta a
   mano (fila 130, 24-sep-2026, docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md).

   `solicitantes.csv`, `personal.csv`, `empresas.csv` y `otros.csv`, en
   `_GESTOR/datos`. Estas cuatro funciones vivían en js/datos.js; se
   cuelgan de `Datos` con los mismos nombres, así que quien las llama no
   cambia. Lo nuevo:

     - Cada una va por `ColaGuardado.poner(<fichero del CSV>, …)`: dos
       altas seguidas en el mismo fichero ya no se pisan.
     - Relee el CSV DENTRO de la cola, justo antes de escribir (se olvida
       lo guardado en memoria), no fuera: así suma lo que haya escrito
       el otro ordenador.

   Entre dos ordenadores, la copia en conflicto que deje Dropbox la une
   js/conflictos.js (fusionarCsv).

   Se carga justo después de js/datos.js.
   ============================================================ */
(function () {
  if (typeof Datos === 'undefined' || !Datos._interno) return;

  var I = Datos._interno;
  var LISTAS = Datos.LISTAS;

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }

  function claveDe(categoria) {
    return (categoria === 'PERSONAL' || categoria === 'ALUMNADO') ? categoria + '_MANUAL' : categoria;
  }

  /* Lo que hay en el fichero ahora mismo, sin lo guardado en memoria. */
  function releer(dirDatos, categoria) {
    var clave = claveDe(categoria);
    delete I.CACHE[clave];
    return I.cargarLista(dirDatos, categoria, clave);
  }

  function olvidar(categoria) {
    delete I.CACHE[claveDe(categoria)];
    delete I.CACHE[categoria];
  }

  function filaDe(def, campos) {
    return def.cabecera.map(function (c) { return campos[c] || ''; });
  }

  function porNombre(a, b) { return U.normalizar(a[0]) < U.normalizar(b[0]) ? -1 : 1; }

  /* Da de alta un tercero nuevo y lo escribe en su CSV. Un solicitante
     (categoría ALUMNADO) se marca con el curso de hoy, aunque quien lo
     dé de alta no lo escriba: así se puede saber más adelante de qué
     curso es, sin preguntárselo a nadie (fila 66, 2.4). */
  async function anadirALista(dirDatos, categoria, valores) {
    var def = LISTAS[categoria];
    if (categoria === 'ALUMNADO' && !valores['Curso de alta']) {
      valores = Object.assign({}, valores, { 'Curso de alta': U.cursoActual() });
    }
    await enFila(def.fichero, async function () {
      var actual = await releer(dirDatos, categoria);
      var filas = actual.lista.map(function (p) { return filaDe(def, p.campos); });
      filas.push(filaDe(def, valores));
      filas.sort(porNombre);
      await Carpetas.escribirTexto(dirDatos, def.fichero, Datos.aCsv(def.cabecera, filas));
      olvidar(categoria);
    });
    return Datos.cargar(dirDatos, categoria);
  }

  /* Cambia los datos de un tercero que ya está dado de alta a mano.
     Se busca por el nombre que tenía antes, que es la primera columna
     del fichero. Si no aparece, se añade como uno nuevo: así un cambio
     nunca hace desaparecer a nadie.

     Ojo: esto NO renombra las carpetas de sus asuntos. El nombre de una
     carpeta es el rastro del día en que se creó. */
  async function guardarEnLista(dirDatos, categoria, nombreAntes, valores) {
    var def = LISTAS[categoria];
    await enFila(def.fichero, async function () {
      var actual = await releer(dirDatos, categoria);
      var buscado = U.normalizar(nombreAntes || '');
      var estaba = false;
      var filas = actual.lista.map(function (p) {
        if (!estaba && U.normalizar(p.nombre) === buscado) {
          estaba = true;
          return filaDe(def, valores);
        }
        return filaDe(def, p.campos);
      });
      if (!estaba) filas.push(filaDe(def, valores));
      filas.sort(porNombre);
      await Carpetas.escribirTexto(dirDatos, def.fichero, Datos.aCsv(def.cabecera, filas));
      olvidar(categoria);
    });
    return Datos.cargar(dirDatos, categoria);
  }

  /* Quita a alguien de la lista de dados de alta a mano (papelera,
     11-sep-2026). Se busca por su nombre, igual que guardarEnLista.
     Solo tiene sentido para quien se dio de alta a mano: quitar a
     alguien de Séneca de aquí no tendría ningún efecto, porque el
     fichero de Séneca no lo escribe la aplicación. */
  function quitarDeLista(dirDatos, categoria, nombre) {
    var def = LISTAS[categoria];
    return enFila(def.fichero, async function () {
      var actual = await releer(dirDatos, categoria);
      var buscado = U.normalizar(nombre || '');
      var quitado = null;
      var filas = [];
      actual.lista.forEach(function (p) {
        if (!quitado && U.normalizar(p.nombre) === buscado) { quitado = p; return; }
        filas.push(filaDe(def, p.campos));
      });
      if (!quitado) return null;
      await Carpetas.escribirTexto(dirDatos, def.fichero, Datos.aCsv(def.cabecera, filas));
      olvidar(categoria);
      return quitado;
    });
  }

  /* `solicitantes.csv` no se limpia nunca solo: arrastraría a todos los
     aspirantes de todos los cursos. Se apartan (no se borran) a
     `solicitantes-anteriores.csv` los que se dieron de alta en un curso
     que no es el de hoy. */
  function apartarSolicitantesAnteriores(dirDatos) {
    var def = LISTAS.ALUMNADO;
    return enFila(def.fichero, async function () {
      var actual = await releer(dirDatos, 'ALUMNADO');
      var quedan = [], apartados = [];
      actual.lista.forEach(function (p) {
        (I.esDeCursoAnterior(p.campos) ? apartados : quedan).push(p);
      });
      if (!apartados.length) return 0;

      await Carpetas.escribirTexto(dirDatos, def.fichero,
        Datos.aCsv(def.cabecera, quedan.map(function (p) { return filaDe(def, p.campos); })));

      var anteriores = I.FICHERO_SOLICITANTES_ANTERIORES;
      var textoAnteriores = await Carpetas.leerTexto(dirDatos, anteriores);
      var filasAnteriores = textoAnteriores ? Datos.aTabla(textoAnteriores).filas.slice(1) : [];
      apartados.forEach(function (p) { filasAnteriores.push(filaDe(def, p.campos)); });
      await Carpetas.escribirTexto(dirDatos, anteriores, Datos.aCsv(def.cabecera, filasAnteriores));

      olvidar('ALUMNADO');
      return apartados.length;
    });
  }

  Datos.anadirALista = anadirALista;
  Datos.guardarEnLista = guardarEnLista;
  Datos.quitarDeLista = quitarDeLista;
  Datos.apartarSolicitantesAnteriores = apartarSolicitantesAnteriores;
})();
