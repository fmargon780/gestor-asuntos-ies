/* ============================================================
   archivo-indice.js — el índice guardado del ARCHIVO (17-sep-2026,
   fila 44, docs/BUSCADOR-ARCHIVO-INDICE.md).

   Hasta ahora, entrar en la pantalla ARCHIVO recorría el archivo
   entero cada vez (categoría → tercero → asunto) y la búsqueda era
   un `indexOf` sobre un solo texto. Aquí vive el índice que arregla
   eso: leer, guardar, añadir y quitar una entrada, y resolver la
   carpeta de una entrada guardada. Recorrer el disco de verdad
   («Reconstruir el índice») vive en `js/archivo-indice-construir.js`,
   que se carga justo después y añade `construir` y `recuentoActual`
   a este mismo `IndiceArchivo` (este fichero llegó a 435 líneas; se
   partió en la fila 177, docs/ARCHIVO-POR-CURSO-Y-RUTAS.md).

   Igual que `js/presencia.js` con `presencia.json`: se lee y se
   escribe DIRECTO con `Carpetas`, nunca con `Copias.guardar`. No
   entra en las copias de seguridad, ni en la papelera, ni en la
   fusión de conflictos de Dropbox: se puede rehacer entero en
   cualquier momento con "Reconstruir el índice", así que no hace
   falta protegerlo como a los dieciocho ficheros de verdad.

   ============================================================
   EL ÍNDICE POR CURSO ACADÉMICO (fila 177, 26-sep-2026)
   ============================================================

   Con unos 50 asuntos abiertos y más de 200 archivados en cuatro días,
   el archivo crece varios miles por curso: guardar el índice entero en
   un solo fichero, y reescribirlo entero cada vez que se archiva algo,
   acabaría pesando varios megabytes. Así que:

     - `_GESTOR/indice-archivo.json` (`FICHERO_RESUMEN`) es ahora un
       RESUMEN pequeño: `{ version, hechoEl, hechoPor, cursos: [...],
       recuento }`. Es lo único que se lee al entrar en el ARCHIVO.
     - `_GESTOR/indice-archivo/<curso>.json` (dentro de `CARPETA`), uno
       por curso académico (`2025-26.json`, `2026-27.json`…), lleva el
       índice de verdad de ese curso: `{ version, hechoEl, hechoPor,
       asuntos }`.
     - El curso de un asunto sale de la fecha de su nombre de carpeta
       (las seis primeras cifras, AAMMDD): del 1 de septiembre al 31 de
       agosto, con `U.cursoDeFecha` (la misma cuenta que ya usaba
       `js/cuentas.js`). Sin fecha reconocible, el curso actual.
     - `leerDisco()` sin argumentos devuelve solo el curso ACTUAL;
       `leerDisco({ curso: '2025-26' })`, uno concreto; `leerDisco({
       todos: true })`, todos los cursos juntos, para quien necesite
       verlo entero (Cuentas, fichas huérfanas, las sugerencias de «Por
       clasificar», los duplicados de "relacionados" y el plazo de
       conservación: ver la lista de ficheros que llaman a `leerDisco`
       en `docs/ARCHIVO-POR-CURSO-Y-RUTAS.md`).
     - `anadirEntrada` y `quitarEntrada` escriben SOLO el fichero del
       curso que toca (calculado del propio nombre de la carpeta):
       archivar ya no reescribe miles de entradas de otros cursos.
     - «Reconstruir el índice» (`js/archivo-indice-construir.js`)
       reconstruye todos los cursos a la vez, un fichero por curso, y
       el resumen.
     - **Migración sin manos**: si al leer el resumen resulta que
       todavía es el formato antiguo (lleva `asuntos` directamente, en
       vez de `cursos`), se parte solo en cursos la primera vez que se
       entra (`migrarSiHaceFalta`, más abajo) y el fichero viejo se
       aparta a `_GESTOR/copias/indice-archivo-antiguo-AAMMDD.json`. Si
       el otro ordenador todavía lleva la aplicación vieja y vuelve a
       escribir el formato antiguo encima, la siguiente entrada lo
       vuelve a partir: no se pierde nada, porque el índice siempre se
       puede rehacer entero con "Reconstruir el índice".
     - El índice sigue **fuera de los dieciocho** ficheros protegidos,
       por el mismo motivo de siempre: se reconstruye entero cuando
       haga falta, así que no necesita copia de seguridad, papelera ni
       fusión de conflictos. La subcarpeta `indice-archivo/` se salta
       en `Conflictos.revisar` igual que se saltaba el fichero de hoy.

   Va cargado después de `js/carpetas.js`, `js/nombres.js` y
   `js/nucleo.js` (usa `App.E`), y antes de
   `js/archivo-indice-construir.js`, de `js/asuntos-archivar.js`
   (alta y baja al archivar/reabrir), de `js/archivo-personas.js`
   (la pantalla) y de `js/ficha-archivo.js`.
   ============================================================ */
var IndiceArchivo = (function () {

  /* El resumen, en la raíz de _GESTOR (mismo nombre de siempre: quien
     todavía no ha migrado sigue viendo "un fichero", no dos). */
  var FICHERO_RESUMEN = 'indice-archivo.json';
  /* La subcarpeta con un fichero por curso. */
  var CARPETA = 'indice-archivo';
  /* 2 (19-sep-2026, fila 73): las entradas llevan el texto de las notas.
     3 (19-sep-2026, fila 74): además llevan si el tipo se ha reconocido,
     quién lo pidió y las fechas de apertura y cierre. Sigue siendo el
     número de versión de CADA ENTRADA (y del resumen): cada subida deja
     sin ellas a un índice viejo, que se reconstruye solo. La fila 177 no
     cambia el formato de una entrada, solo dónde vive: no hace falta
     subir la versión por eso. */
  var VERSION = 3;

  function gestor() { return window.App && App.E && App.E.gestor; }

  /* ==========================================================
     EL CURSO ACADÉMICO DE UNA ENTRADA
     ========================================================== */

  /* El nombre de una carpeta de asunto siempre empieza por AAMMDD (es
     lo que la reconoce como tal, ver Nombres.leer): de ahí sale el
     curso, sin tener que guardar la fecha aparte en ningún sitio. Sin
     una fecha reconocible (un nombre raro, colado a mano), el curso
     actual: mejor eso que perder la entrada. */
  function cursoDeNombre(nombre) {
    var m = String(nombre || '').match(/^(\d{2})(\d{2})(\d{2})/);
    if (!m) return U.cursoActual();
    var iso = '20' + m[1] + '-' + m[2] + '-' + m[3];
    return U.cursoDeFecha(iso) || U.cursoActual();
  }

  function nombreFicheroCurso(curso) { return curso + '.json'; }

  /* ==========================================================
     LEER Y ESCRIBIR, DIRECTO (sin Copias.guardar)
     ========================================================== */

  function leerResumenDisco() {
    var g = gestor();
    if (!g) return Promise.resolve(null);
    return Carpetas.leerJson(g, FICHERO_RESUMEN).catch(function () { return null; });
  }

  function escribirResumenDisco(resumen) {
    var g = gestor();
    if (!g) return Promise.resolve();
    return Carpetas.escribirTexto(g, FICHERO_RESUMEN, JSON.stringify(resumen));
  }

  /* La carpeta `indice-archivo/`. Sin crearla, devuelve null si
     todavía no existe (para no crearla sin querer solo por mirar). */
  async function carpetaDeCursos(crear) {
    var g = gestor();
    if (!g) return null;
    if (crear) return Carpetas.crear(g, CARPETA);
    try { return await g.getDirectoryHandle(CARPETA); }
    catch (e) { return null; }
  }

  async function leerCursoDisco(curso) {
    var carpeta = await carpetaDeCursos(false);
    if (!carpeta) return null;
    try { return await Carpetas.leerJson(carpeta, nombreFicheroCurso(curso)); }
    catch (e) { return null; }
  }

  async function escribirCursoDisco(curso, datos) {
    var carpeta = await carpetaDeCursos(true);
    await Carpetas.escribirTexto(carpeta, nombreFicheroCurso(curso), JSON.stringify(datos));
  }

  /* ==========================================================
     MIGRACIÓN SIN MANOS DEL FORMATO ANTIGUO
     ========================================================== */

  /* El formato de antes de esta fila tenía el índice entero, con
     `asuntos`, en el propio `indice-archivo.json` de la raíz. Si eso
     es lo que hay (en vez de `cursos`), se parte en cursos la primera
     vez que se entra, dentro de la misma fila de guardado que todo lo
     demás (por si dos ordenadores entran casi a la vez). */
  async function migrarSiHaceFalta() {
    var viejo = await leerResumenDisco();
    if (!viejo || !Array.isArray(viejo.asuntos)) return;   /* ya migrado, o no hay nada todavía */
    return enFila(migrarYa);
  }

  async function migrarYa() {
    /* Puede que otra sesión ya lo haya partido justo antes de que a
       esta le tocara su turno en la fila: se vuelve a comprobar. */
    var actual = await leerResumenDisco();
    if (!actual || !Array.isArray(actual.asuntos)) return;

    var porCurso = {};
    actual.asuntos.forEach(function (a) {
      var curso = cursoDeNombre(a.nombre);
      (porCurso[curso] = porCurso[curso] || []).push(a);
    });
    var cursos = Object.keys(porCurso).sort();
    if (!cursos.length) cursos = [U.cursoActual()];

    for (var i = 0; i < cursos.length; i++) {
      var curso = cursos[i];
      await escribirCursoDisco(curso, {
        version: VERSION, hechoEl: actual.hechoEl, hechoPor: actual.hechoPor,
        asuntos: porCurso[curso] || []
      });
    }

    var resumenNuevo = {
      version: VERSION, hechoEl: actual.hechoEl, hechoPor: actual.hechoPor,
      cursos: cursos, recuento: actual.recuento || {}
    };

    /* Se aparta el viejo ANTES de sustituirlo: si algo falla justo
       después, no se pierde y se puede volver a intentar. Si no se
       puede apartar (la carpeta `copias/` no se deja crear, por
       ejemplo), se sigue igual: lo importante es no perder el índice,
       no guardar el rastro de la migración. */
    var g = gestor();
    try {
      var carpetaCopias = await Carpetas.crear(g, 'copias');
      var dosDigitos = function (n) { return String(n).padStart(2, '0'); };
      var hoy = new Date();
      var fecha = String(hoy.getFullYear()).slice(2) + dosDigitos(hoy.getMonth() + 1) + dosDigitos(hoy.getDate());
      await Carpetas.moverFichero(g, FICHERO_RESUMEN, carpetaCopias, 'indice-archivo-antiguo-' + fecha + '.json');
    } catch (e) { /* no se ha podido apartar: se sobrescribe igual, justo debajo */ }

    await escribirResumenDisco(resumenNuevo);
  }

  /* ==========================================================
     LEER (curso actual, un curso concreto, o todos)
     ========================================================== */

  /* { ok: true, datos } si el índice se puede usar; si no,
     { ok: false, motivo: 'no-existe' | 'sin-carpeta' }.
     `datos` siempre lleva `{ version, hechoEl, hechoPor, recuento,
     asuntos, cursos, curso }`: `recuento` y `cursos` son los del
     resumen (iguales pidas lo que pidas); `curso` es '' cuando se ha
     pedido `todos: true`. Un curso sin ningún archivado todavía
     (empieza el curso, o se elige uno de los primeros) no es un
     índice roto: `asuntos` sale vacío, sin más. */
  async function leerDisco(opciones) {
    opciones = opciones || {};
    var g = gestor();
    if (!g) return { ok: false, motivo: 'sin-carpeta' };

    await migrarSiHaceFalta();

    var resumen = await leerResumenDisco();
    if (!resumen || !Array.isArray(resumen.cursos)) return { ok: false, motivo: 'no-existe' };

    if (opciones.todos) {
      var todos = [];
      for (var i = 0; i < resumen.cursos.length; i++) {
        var datosCurso = await leerCursoDisco(resumen.cursos[i]);
        if (datosCurso && Array.isArray(datosCurso.asuntos)) todos = todos.concat(datosCurso.asuntos);
      }
      return { ok: true, datos: {
        version: VERSION, hechoEl: resumen.hechoEl, hechoPor: resumen.hechoPor,
        recuento: resumen.recuento || {}, asuntos: todos, cursos: resumen.cursos.slice(), curso: ''
      } };
    }

    var curso = opciones.curso || U.cursoActual();
    var datosCurso = await leerCursoDisco(curso);
    var asuntosDelCurso = (datosCurso && Array.isArray(datosCurso.asuntos)) ? datosCurso.asuntos : [];
    return { ok: true, datos: {
      version: VERSION,
      hechoEl: (datosCurso && datosCurso.hechoEl) || resumen.hechoEl,
      hechoPor: (datosCurso && datosCurso.hechoPor) || resumen.hechoPor,
      recuento: resumen.recuento || {}, asuntos: asuntosDelCurso,
      cursos: resumen.cursos.slice(), curso: curso
    } };
  }

  /* ==========================================================
     ESCRIBIR: guardar (reconstruir), añadir y quitar una entrada
     ========================================================== */

  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): los tres que
     escriben el índice, en fila con los demás guardados de este
     fichero (y ahora también con la migración: `migrarYa` pasa por
     aquí, así que nunca se cruza con un `anadirEntrada` a mitad). */
  function enFila(fn) { return window.ColaGuardado ? ColaGuardado.poner(FICHERO_RESUMEN, fn) : fn(); }

  function guardar(datos) { return enFila(function () { return guardarYa(datos); }); }
  function anadirEntrada(entrada) { return enFila(function () { return anadirEntradaYa(entrada); }); }
  function quitarEntrada(nombre) { return enFila(function () { return quitarEntradaYa(nombre); }); }

  /* Guarda un índice recién reconstruido ENTERO (lo que devuelve
     `IndiceArchivo.construir()`, con todos los asuntos juntos, de
     cualquier curso): lo parte por curso y escribe cada fichero,
     releyendo antes el de ese curso y sumando lo que hubiera y no
     esté en lo recién construido (el compañero puede haber archivado
     algo de ese mismo curso mientras tanto, igual que antes). */
  async function guardarYa(datos) {
    var porCurso = {};
    (datos.asuntos || []).forEach(function (a) {
      var curso = cursoDeNombre(a.nombre);
      (porCurso[curso] = porCurso[curso] || []).push(a);
    });
    var cursos = Object.keys(porCurso).sort();

    for (var i = 0; i < cursos.length; i++) {
      var curso = cursos[i];
      var previo = await leerCursoDisco(curso);
      var deDisco = (previo && Array.isArray(previo.asuntos)) ? previo.asuntos : [];
      var claves = {};
      porCurso[curso].forEach(function (a) { claves[a.nombre] = true; });
      var extra = deDisco.filter(function (a) { return !claves[a.nombre]; });
      await escribirCursoDisco(curso, {
        version: VERSION, hechoEl: datos.hechoEl, hechoPor: datos.hechoPor,
        asuntos: porCurso[curso].concat(extra)
      });
    }

    /* El resumen también se relee: si el compañero ha guardado mientras
       tanto un curso que esta reconstrucción no ha visto (raro, porque
       "Reconstruir" recorre el disco entero), se conserva en la lista. */
    var resumenPrevio = await leerResumenDisco();
    var cursosResumen = cursos.slice();
    ((resumenPrevio && resumenPrevio.cursos) || []).forEach(function (c) {
      if (cursosResumen.indexOf(c) === -1) cursosResumen.push(c);
    });
    cursosResumen.sort();
    await escribirResumenDisco({
      version: VERSION, hechoEl: datos.hechoEl, hechoPor: datos.hechoPor,
      cursos: cursosResumen, recuento: datos.recuento || {}
    });
    return datos;
  }

  /* Añade (o sustituye, si ya estaba) una sola entrada, sin tocar el
     resto: para cuando se archiva un asunto. Solo reescribe el
     fichero de SU curso (calculado de su propio nombre). Si el índice
     todavía no existe (nunca se ha hecho "Reconstruir el índice"), no
     se crea uno a medias: se queda sin hacer nada, como antes. */
  async function anadirEntradaYa(entrada) {
    var g = gestor();
    if (!g) return;
    var resumen = await leerResumenDisco();
    if (!resumen || !Array.isArray(resumen.cursos)) return;

    var curso = cursoDeNombre(entrada.nombre);
    var previo = await leerCursoDisco(curso);
    var asuntos = (previo && Array.isArray(previo.asuntos)) ? previo.asuntos : [];
    asuntos = asuntos.filter(function (a) { return a.nombre !== entrada.nombre; });
    asuntos.push(entrada);
    await escribirCursoDisco(curso, {
      version: VERSION, hechoEl: resumen.hechoEl, hechoPor: resumen.hechoPor, asuntos: asuntos
    });

    /* Un curso que empieza (el primer asunto que se archiva de él) no
       está todavía en la lista del resumen: se añade. */
    if (resumen.cursos.indexOf(curso) === -1) {
      resumen.cursos = resumen.cursos.concat([curso]).sort();
      await escribirResumenDisco(resumen);
    }
  }

  /* Quita una entrada por el nombre de su carpeta: para cuando se
     reabre un asunto. Solo toca el fichero de su curso. Igual de
     silencioso si el índice no existe. */
  async function quitarEntradaYa(nombre) {
    var g = gestor();
    if (!g) return;
    var resumen = await leerResumenDisco();
    if (!resumen || !Array.isArray(resumen.cursos)) return;

    var curso = cursoDeNombre(nombre);
    var previo = await leerCursoDisco(curso);
    if (!previo || !Array.isArray(previo.asuntos)) return;
    var antes = previo.asuntos.length;
    previo.asuntos = previo.asuntos.filter(function (a) { return a.nombre !== nombre; });
    if (previo.asuntos.length === antes) return;   /* no estaba: nada que escribir */
    await escribirCursoDisco(curso, previo);
  }

  function recuentosIguales(a, b) {
    a = a || {}; b = b || {};
    var clavesA = Object.keys(a), clavesB = Object.keys(b);
    if (clavesA.length !== clavesB.length) return false;
    for (var i = 0; i < clavesA.length; i++) {
      if ((a[clavesA[i]] || 0) !== (b[clavesA[i]] || 0)) return false;
    }
    return true;
  }

  /* ==========================================================
     EL TEXTO DE BÚSQUEDA DE UNA ENTRADA (punto 7 del encargo de la
     fila 44)
     ========================================================== */

  /* Junta lo del índice (que desde la fila 64 ya trae lo poco que hace
     falta de la ficha, ver entradaDe en archivo-indice-construir.js) y
     lo normaliza una sola vez. `conNotas` a false se queda fuera el
     texto de las notas: lo usa `App.fragmentoDeNota` (fila 73) para
     saber si una palabra buscada solo aparece por una nota, no por el
     resto de la ficha. */
  function textoDeBusqueda(entrada, conNotas) {
    var partes = [
      entrada.nombre, entrada.categoria, entrada.tercero, entrada.ruta,
      entrada.tipo, entrada.curso, entrada.grupo
    ].concat(
      /* El nombre corto del tipo (fila 97), resuelto al buscar desde la
         lista de tipos de hoy: sin subir la VERSION del índice. */
      entrada.tipo && window.Nombres && window.App && App.E && App.E.tipos
        ? Nombres.nombresDeTipo(entrada.tipo, App.E.tipos).slice(1) : []
    ).concat(entrada.documentos || []).concat(entrada.registros || []);

    partes.push(entrada.situacion || '');
    if (entrada.via) {
      var v = window.Nombres && Nombres.via(entrada.via);
      partes.push(v ? v.texto : entrada.via);
    }
    partes.push(entrada.viaDato || '', entrada.loPideNombre || '', entrada.camposTexto || '');
    if (conNotas !== false) partes.push(entrada.notas || '');
    (entrada.relacionados || []).forEach(function (r) { if (r && r.nombre) partes.push(r.nombre); });

    return U.normalizar(partes.join(' '));
  }

  /* ==========================================================
     RESOLVER LA CARPETA DE UNA ENTRADA, A PARTIR DE LO GUARDADO

     El índice no guarda manejadores de carpeta (no se puede: no
     sobreviven a un JSON). Cuando de verdad hace falta la carpeta de
     un asunto archivado (abrir sus documentos, por ejemplo), se
     resuelve aquí, con lo que el índice sí sabe: categoría, tercero,
     ruta y si estaba descolocado.
     ========================================================== */
  async function resolverHandle(entrada) {
    try {
      var archivo = App.E.archivo;
      var padre;
      if (entrada.sueltoEn === 'bajo la categoría') {
        padre = await archivo.getDirectoryHandle(entrada.categoria);
      } else if (entrada.sueltoEn) {
        var segmentos = String(entrada.ruta || '').split(' / ').filter(Boolean);
        padre = archivo;
        for (var i = 0; i < segmentos.length; i++) {
          padre = await padre.getDirectoryHandle(segmentos[i]);
        }
      } else {
        padre = await archivo.getDirectoryHandle(entrada.categoria);
        padre = await padre.getDirectoryHandle(entrada.tercero);
      }
      var handle = await padre.getDirectoryHandle(entrada.nombre);
      return { handle: handle, padre: padre };
    } catch (e) {
      return null;
    }
  }

  return {
    FICHERO_RESUMEN: FICHERO_RESUMEN, CARPETA: CARPETA, VERSION: VERSION,
    leerDisco: leerDisco, guardar: guardar,
    anadirEntrada: anadirEntrada, quitarEntrada: quitarEntrada,
    recuentosIguales: recuentosIguales,
    textoDeBusqueda: textoDeBusqueda, resolverHandle: resolverHandle,
    /* Para archivo-indice-construir.js (y para las pruebas). */
    _cursoDeNombre: cursoDeNombre, _nombreFicheroCurso: nombreFicheroCurso
  };
})();
window.IndiceArchivo = IndiceArchivo;
