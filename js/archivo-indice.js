/* ============================================================
   archivo-indice.js — el índice guardado del ARCHIVO (17-sep-2026,
   fila 44, docs/BUSCADOR-ARCHIVO-INDICE.md).

   Hasta ahora, entrar en la pantalla ARCHIVO recorría el archivo
   entero cada vez (categoría → tercero → asunto) y la búsqueda era
   un `indexOf` sobre un solo texto. Aquí vive el índice que arregla
   eso.

   Fila 177 (26-sep-2026, docs/ARCHIVO-POR-CURSO-Y-RUTAS.md): con
   varios miles de asuntos por curso, un solo `_GESTOR/indice-archivo.json`
   con todos dentro pesaría demasiado, y se reescribía entero cada vez
   que se archivaba un asunto más. Ahora vive partido:

   - `_GESTOR/indice-archivo.json` es un RESUMEN pequeño:
     `{ version, hechoEl, cursos: ['2026-27', '2025-26', …], recuento }`.
     Es lo único que se lee al entrar en Archivo.
   - `_GESTOR/indice-archivo/<curso>.json` (uno por curso académico,
     '2026-27', '2025-26'…) lleva la lista de verdad, con la misma
     forma que antes: `{ version, hechoEl, hechoPor, recuento, asuntos }`.
   - El curso de un asunto sale de la fecha de su carpeta (AAMMDD): del
     1 de septiembre al 31 de agosto. `anadirEntrada`/`quitarEntrada` lo
     calculan del nombre y solo tocan el fichero de ESE curso: archivar
     ya no reescribe miles de entradas de golpe.
   - Un `indice-archivo.json` antiguo (con `asuntos` dentro, del formato
     de antes de esta fila) se migra solo, la primera vez que se lee
     algo de aquí en la sesión: se parte por curso, y el fichero viejo
     se aparta a `_GESTOR/copias/indice-archivo-antiguo-AAMMDD.json`. Si
     el otro ordenador todavía lleva la versión vieja y lo vuelve a
     escribir en el formato antiguo, la próxima lectura lo vuelve a
     partir: no se pierde nada, porque el índice siempre se puede
     reconstruir con "Reconstruir el índice".

   Igual que `js/presencia.js`: se lee y se escribe DIRECTO con
   `Carpetas`, nunca con `Copias.guardar`. No entra en las copias de
   seguridad, ni en la papelera, ni en la fusión de conflictos de
   Dropbox (`js/conflictos.js` la salta, igual que el fichero de antes):
   se puede rehacer entero en cualquier momento con "Reconstruir el
   índice".

   Antes de escribir, como hace `Grupos.guardar`, se relee el disco y
   se fusiona: el compañero puede haber archivado o reabierto un
   asunto desde el otro ordenador mientras tanto.

   Hasta la fila 64 no guardaba nada de la ficha del asunto: el estado,
   la vía, quién lo pidió, los relacionados y los campos propios se
   leían al buscar, de `App.E.registro.asuntos`. Desde que la ficha de
   un archivado vive en su propia carpeta (`_ficha.json`,
   js/ficha-archivo.js) y ya no está en `asuntos.json`, esos pocos
   campos se guardan aquí mismo, en cada entrada (`entradaDe`, más
   abajo): tomados de la ficha en memoria al archivar, o releídos de
   `_ficha.json` al reconstruir el índice entero.

   Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): recorrer el disco entero
   para reconstruir el índice (`construir`, `recuentoActual`,
   `recuentosIguales`) vive en js/archivo-indice-construir.js, cargado
   justo después, y llama a las funciones públicas de aquí
   (`IndiceArchivo.entradaDe`); no hace falta compartir nada por dentro.

   Va cargado después de `js/carpetas.js`, `js/nombres.js` y
   `js/nucleo.js` (usa `App.E`), y antes de `js/asuntos-archivar.js`
   (alta y baja al archivar/reabrir), de `js/archivo-personas.js`
   (la pantalla) y de `js/ficha-archivo.js`.
   ============================================================ */
var IndiceArchivo = (function () {

  var FICHERO = 'indice-archivo.json';
  var CARPETA = 'indice-archivo';
  /* 2 (fila 73): el texto de las notas. 3 (fila 74): tipo reconocido,
     quién lo pidió, fechas de apertura y cierre. 4 (fila 177): el
     resumen del propio FICHERO cambia de forma (ya no lleva 'asuntos'),
     y cada curso vive en su propio fichero dentro de CARPETA. Cada
     subida de VERSION deja sin ellas a un índice viejo, que se
     reconstruye solo. */
  var VERSION = 4;

  function gestor() { return window.App && App.E && App.E.gestor; }
  function usuario() { return (window.App && App.E && App.E.usuario) || ''; }

  /* ==========================================================
     EL CURSO ACADÉMICO DE UN ASUNTO
     ========================================================== */

  /* Del 1 de septiembre al 31 de agosto, como App.frescura y como
     Cuentas. 'aammdd' es la fecha de seis cifras que ya guarda el
     nombre de la carpeta (Nombres.leer(nombre, tipos).fecha). Sin una
     fecha reconocible (una carpeta hecha a mano, sin las seis cifras
     delante), al curso actual: hay que meterla en algún fichero, y
     "actual" es la mejor suposición sin inventar una fecha. */
  function cursoDeAnoYMes(ano, mes) {
    var inicio = mes < 9 ? ano - 1 : ano;
    return inicio + '-' + String((inicio + 1) % 100).padStart(2, '0');
  }

  function cursoActual() {
    var hoy = new Date();
    return cursoDeAnoYMes(hoy.getFullYear(), hoy.getMonth() + 1);
  }

  function cursoDeAAMMDD(aammdd) {
    var s = String(aammdd || '');
    if (!/^\d{6}$/.test(s)) return cursoActual();
    var ano = 2000 + parseInt(s.slice(0, 2), 10);
    var mes = parseInt(s.slice(2, 4), 10);
    if (!mes || mes < 1 || mes > 12) return cursoActual();
    return cursoDeAnoYMes(ano, mes);
  }

  function cursoDeEntrada(entrada) {
    return cursoDeAAMMDD(entrada && entrada.fecha);
  }

  /* ==========================================================
     LEER Y ESCRIBIR, DIRECTO (sin Copias.guardar)
     ========================================================== */

  function carpetaCursos() { return Carpetas.crear(gestor(), CARPETA); }

  async function leerResumenDisco() {
    var g = gestor();
    if (!g) return null;
    try { return await Carpetas.leerJson(g, FICHERO); } catch (e) { return null; }
  }

  function escribirResumenDisco(datos) {
    return Carpetas.escribirTexto(gestor(), FICHERO, JSON.stringify(datos));
  }

  async function leerCursoDisco(curso) {
    var c = await carpetaCursos();
    try { return await Carpetas.leerJson(c, curso + '.json'); } catch (e) { return null; }
  }

  async function escribirCursoDisco(curso, datos) {
    var c = await carpetaCursos();
    await Carpetas.escribirTexto(c, curso + '.json', JSON.stringify(datos));
  }

  function unirPorNombre(a, b) {
    var vistos = {}, salida = [];
    (a || []).concat(b || []).forEach(function (e) {
      if (!e || !e.nombre || vistos[e.nombre]) return;
      vistos[e.nombre] = true;
      salida.push(e);
    });
    return salida;
  }

  /* ---------- migración sin manos del formato de antes de la fila 177 ---------- */

  function selloHoy() {
    var d = new Date();
    function dos(n) { return String(n).padStart(2, '0'); }
    return String(d.getFullYear()).slice(2) + dos(d.getMonth() + 1) + dos(d.getDate());
  }

  var migradoComprobado = false;

  async function asegurarMigrado() {
    if (migradoComprobado) return;
    migradoComprobado = true;
    var g = gestor();
    if (!g) return;
    var actual = await leerResumenDisco();
    if (!actual || !Array.isArray(actual.asuntos)) return;   /* ya es el resumen nuevo, o no hay nada */

    var porCurso = {};
    actual.asuntos.forEach(function (e) {
      var curso = cursoDeEntrada(e);
      (porCurso[curso] = porCurso[curso] || []).push(e);
    });
    var cursos = Object.keys(porCurso);
    for (var i = 0; i < cursos.length; i++) {
      var c = cursos[i];
      var yaHabia = await leerCursoDisco(c);
      await escribirCursoDisco(c, {
        version: VERSION, hechoEl: actual.hechoEl || U.ahora(), hechoPor: actual.hechoPor || usuario(),
        recuento: actual.recuento || {}, asuntos: unirPorNombre((yaHabia && yaHabia.asuntos) || [], porCurso[c])
      });
    }

    try {
      var copias = await Carpetas.crear(g, 'copias');
      await Carpetas.escribirTexto(copias, 'indice-archivo-antiguo-' + selloHoy() + '.json', JSON.stringify(actual));
    } catch (e) { /* si no se puede copiar, no pasa nada: ya está partido por curso */ }

    await escribirResumenDisco({
      version: VERSION, hechoEl: actual.hechoEl || U.ahora(),
      cursos: cursos.sort().reverse(), recuento: actual.recuento || {}
    });
  }

  /* ==========================================================
     LA API PÚBLICA DE LECTURA Y ESCRITURA

     { ok: true, datos } si el índice se puede usar; si no,
     { ok: false, motivo: 'no-existe' | 'roto' | 'version' | 'sin-carpeta' }.
     Los tres primeros motivos se tratan igual en la pantalla: "El
     índice no está hecho."

     Sin 'opciones', solo el curso actual. `{ curso: '2025-26' }`, ese
     curso concreto. `{ todos: true }`, todos los cursos juntos (lo
     necesitan Cuentas, fichas huérfanas, las sugerencias de "Por
     clasificar", "Repartir un PDF" y el plazo de conservación: miran
     el archivo entero, no solo el curso que se esté viendo en pantalla).
     ========================================================== */

  async function leerDisco(opciones) {
    var g = gestor();
    if (!g) return { ok: false, motivo: 'sin-carpeta' };
    try { await asegurarMigrado(); } catch (e) { /* si falla, se sigue con lo que haya */ }

    var resumen;
    try { resumen = await leerResumenDisco(); }
    catch (e) { return { ok: false, motivo: 'roto' }; }
    if (!resumen) return { ok: false, motivo: 'no-existe' };
    if (resumen.version !== VERSION || !Array.isArray(resumen.cursos)) {
      return { ok: false, motivo: 'version' };
    }

    var cursos = (opciones && opciones.todos) ? resumen.cursos.slice()
      : [(opciones && opciones.curso) || cursoActual()];

    var asuntos = [];
    var hechoEl = resumen.hechoEl, hechoPor = '';
    for (var i = 0; i < cursos.length; i++) {
      if (resumen.cursos.indexOf(cursos[i]) === -1) continue;   /* ese curso no tiene nada archivado */
      var datos;
      try { datos = await leerCursoDisco(cursos[i]); } catch (e) { datos = null; }
      if (!datos || !Array.isArray(datos.asuntos)) continue;
      asuntos = asuntos.concat(datos.asuntos);
      hechoPor = datos.hechoPor || hechoPor;
    }

    return {
      ok: true,
      datos: { version: VERSION, hechoEl: hechoEl, hechoPor: hechoPor, recuento: resumen.recuento || {}, asuntos: asuntos },
      cursos: resumen.cursos.slice()
    };
  }

  async function guardarCursoYa(curso, entradasNuevas, datos) {
    var yaHabia = await leerCursoDisco(curso);
    var deDisco = (yaHabia && yaHabia.asuntos) || [];
    var claves = {};
    entradasNuevas.forEach(function (a) { claves[a.nombre] = true; });
    var extra = deDisco.filter(function (a) { return !claves[a.nombre]; });
    await escribirCursoDisco(curso, {
      version: VERSION, hechoEl: datos.hechoEl, hechoPor: datos.hechoPor,
      recuento: datos.recuento, asuntos: entradasNuevas.concat(extra)
    });
  }

  /* Guarda un índice recién reconstruido ENTERO (js/archivo-indice-
     construir.js, "Reconstruir el índice"): parte 'datos.asuntos' por
     curso y escribe cada fichero, más el resumen. Cada curso se funde
     con lo que ya hubiera en su fichero, por si el compañero archivó
     algo mientras se reconstruía (el mismo cuidado que antes de la
     fila 177, ahora curso a curso). */
  async function guardar(datos) {
    var porCurso = {};
    (datos.asuntos || []).forEach(function (e) {
      var curso = cursoDeEntrada(e);
      (porCurso[curso] = porCurso[curso] || []).push(e);
    });
    var cursos = Object.keys(porCurso);
    for (var i = 0; i < cursos.length; i++) {
      var c = cursos[i];
      /* En la cola de ESE curso: para no pisar un anadirEntrada/
         quitarEntrada del mismo curso que llegue justo mientras dura
         la reconstrucción entera (que puede tardar). */
      await enFila(function () { return guardarCursoYa(c, porCurso[c], datos); }, c);
    }
    /* Un curso que ya no tiene ningún asunto (el único que había se ha
       vuelto a abrir justo antes de reconstruir) sigue en 'cursos' si
       su fichero sigue existiendo con algo dentro: no se borra nada
       aquí, "Reconstruir" no quita cursos, solo los pone al día. */
    var resumenViejo = await leerResumenDisco();
    var todos = {};
    (resumenViejo && Array.isArray(resumenViejo.cursos) ? resumenViejo.cursos : []).forEach(function (c) { todos[c] = true; });
    cursos.forEach(function (c) { todos[c] = true; });
    await escribirResumenDisco({
      version: VERSION, hechoEl: datos.hechoEl, cursos: Object.keys(todos).sort().reverse(), recuento: datos.recuento
    });
    return datos;
  }

  /* Añade (o sustituye, si ya estaba) una sola entrada, sin tocar el
     resto: para cuando se archiva un asunto. Solo reescribe el fichero
     de SU curso. Si el índice todavía no existe (el resumen no está
     hecho), no se crea uno a medias: se queda sin hacer nada, como
     pedía siempre el encargo. */
  function anadirEntrada(entrada) {
    return enFila(function () { return anadirEntradaYa(entrada); }, cursoDeEntrada(entrada));
  }
  function quitarEntrada(nombre) {
    return enFila(function () { return quitarEntradaYa(nombre); }, cursoDeAAMMDD(String(nombre || '').slice(0, 6)));
  }

  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): en fila con los
     demás guardados de este fichero. Como ahora cada anadir/quitar toca
     un curso distinto, la clave de la cola es el propio nombre del
     fichero de curso: dos altas de cursos distintos no se esperan
     entre sí. */
  function enFila(fn, clave) {
    return window.ColaGuardado ? ColaGuardado.poner('indice-archivo:' + (clave || ''), fn) : fn();
  }

  async function anadirEntradaYa(entrada) {
    var g = gestor();
    if (!g) return;
    try { await asegurarMigrado(); } catch (e) { /* se sigue igual */ }
    var resumen = await leerResumenDisco();
    if (!resumen || !Array.isArray(resumen.cursos)) return;   /* el índice no está hecho: no se crea a medias */
    var curso = cursoDeEntrada(entrada);

    var previo = await leerCursoDisco(curso);
    var asuntos = (previo && Array.isArray(previo.asuntos)) ? previo.asuntos : [];
    asuntos = asuntos.filter(function (a) { return a.nombre !== entrada.nombre; });
    asuntos.push(entrada);
    await escribirCursoDisco(curso, {
      version: VERSION, hechoEl: (previo && previo.hechoEl) || resumen.hechoEl || U.ahora(),
      hechoPor: (previo && previo.hechoPor) || usuario(), recuento: resumen.recuento || {}, asuntos: asuntos
    });

    if (resumen.cursos.indexOf(curso) === -1) {
      resumen.cursos.push(curso);
      resumen.cursos.sort().reverse();
      await escribirResumenDisco(resumen);
    }
  }

  /* Quita una entrada por el nombre de su carpeta: para cuando se
     reabre un asunto. El curso sale del propio nombre (misma cuenta
     que al archivar): no hace falta buscar en todos los ficheros. */
  async function quitarEntradaYa(nombre) {
    var g = gestor();
    if (!g) return;
    try { await asegurarMigrado(); } catch (e) { /* se sigue igual */ }
    var curso = cursoDeAAMMDD(String(nombre || '').slice(0, 6));
    var previo = await leerCursoDisco(curso);
    if (!previo || !Array.isArray(previo.asuntos)) return;
    var antes = previo.asuntos.length;
    previo.asuntos = previo.asuntos.filter(function (a) { return a.nombre !== nombre; });
    if (previo.asuntos.length === antes) return;   /* no estaba ahí: nada que escribir */
    await escribirCursoDisco(curso, previo);
  }

  /* ==========================================================
     LOS DOCUMENTOS DE LA CARPETA Y SUS REGISTROS DE SÉNECA
     ========================================================== */

  /* Solo los nombres, nunca el contenido: la carpeta del asunto y un
     nivel más, si tiene subcarpetas (ficheros escaneados aparte, por
     ejemplo). */
  async function nombresDeDocumentos(handle) {
    var salida = [];
    var contenido = await Carpetas.contenido(handle);
    contenido.ficheros.forEach(function (f) {
      if (Carpetas.esCarpetaTemporalDeSincronizacion(f.nombre)) return;
      if (window.IndiceExpediente && IndiceExpediente.es(f.nombre)) return;   /* fila 137 */
      salida.push(f.nombre);
    });
    for (var i = 0; i < contenido.carpetas.length; i++) {
      var sub = contenido.carpetas[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(sub.nombre)) continue;
      var subFicheros = await Carpetas.ficheros(sub.handle);
      subFicheros.forEach(function (f) { salida.push(f.nombre); });
    }
    return salida;
  }

  /* 26EM1234: año + serie (E/S) + serie (M/A) + hasta seis cifras.
     El mismo patrón que ya reconoce `js/plantillas.js`
     (`ultimoRegistroDe`), pero buscado en cualquier sitio del nombre,
     no solo justo detrás de la fecha. */
  var RE_REGISTRO = /\d{2}[ES][MA]\d{4,6}/g;

  function registrosDeNombres(nombres) {
    var vistos = {}, salida = [];
    (nombres || []).forEach(function (n) {
      var m = String(n || '').match(RE_REGISTRO);
      if (!m) return;
      m.forEach(function (r) { if (!vistos[r]) { vistos[r] = true; salida.push(r); } });
    });
    return salida;
  }

  /* ==========================================================
     UNA ENTRADA DEL ÍNDICE
     ========================================================== */

  /* Lo poco de la ficha que hace falta para pintar la tarjeta y para
     buscar (fila 64, docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): desde
     que la ficha de un archivado vive en su propia carpeta
     (`_ficha.json`) y no en `asuntos.json`, se guarda aquí, tomada de
     la ficha en el momento de archivar o releída de `_ficha.json` al
     reconstruir el índice. */
  function camposDeFicha(ficha) {
    var campos = (ficha && ficha.campos) || {};
    return Object.keys(campos).map(function (c) { return campos[c] && campos[c].valor; })
      .filter(Boolean).join(' ');
  }

  function relacionadosDeFicha(ficha) {
    return ((ficha && ficha.relacionados) || []).filter(function (r) { return r && r.nombre; });
  }

  /* `handle` es la carpeta del asunto ya localizada; `sueltoEn` es ''
     para un asunto en su sitio, o el texto del punto 5 del encargo
     para uno descolocado. `fichaConocida` es la ficha en memoria, si
     ya se tiene (al archivar); si no se pasa (al reconstruir el
     índice desde cero), se intenta leer `_ficha.json` de la propia
     carpeta. */
  async function entradaDe(handle, nombre, categoria, tercero, ruta, sueltoEn, tipos, fichaConocida) {
    var leido = Nombres.leer(nombre, tipos);
    var cursoGrupo = Nombres.cursoYGrupoDeResto(leido.resto);
    var documentos = await nombresDeDocumentos(handle);
    var ficha = fichaConocida;
    if (ficha === undefined && window.FichaArchivo) {
      try { ficha = await FichaArchivo.leer(handle); } catch (e) { ficha = null; }
    }
    ficha = ficha || {};
    return {
      nombre: nombre, categoria: categoria, tercero: tercero, ruta: ruta,
      fecha: leido.fecha || '', tipo: leido.tipo || '', reconocido: !!leido.reconocido,
      curso: cursoGrupo.curso, grupo: cursoGrupo.grupo,
      documentos: documentos, registros: registrosDeNombres(documentos),
      sueltoEn: sueltoEn || '',
      situacion: ficha.situacion || '', via: ficha.via || '', viaDato: ficha.viaDato || '',
      /* Fila 129: dónde se quedó al archivar (js/hitos-archivo.js). */
      seQuedoEn: ficha.seQuedoEn || '', terminado: !!ficha.terminado,
      loPideNombre: (ficha.loPide && ficha.loPide.nombre) || '',
      /* Fila 74, docs/CUENTAS-DE-FIN-DE-CURSO.md: categoría y relación
         de quien lo pidió (para agrupar "familia"/"alumnado"/"centro"/
         "empresa" en Cuentas.js, sin guardar su nombre otra vez: ya
         está en loPideNombre, arriba), y las fechas de apertura y
         cierre del asunto (para "cuánto se tarda"). */
      loPideCategoria: (ficha.loPide && ficha.loPide.categoria) || '',
      loPideRelacion: (ficha.loPide && ficha.loPide.relacion) || '',
      abiertoEl: ficha.abiertoEl || '', cerradoEl: ficha.cerradoEl || '',
      relacionados: relacionadosDeFicha(ficha), camposTexto: camposDeFicha(ficha),
      /* Fila 73, docs/BUSCAR-EN-LAS-NOTAS.md: el texto de las notas,
         recortado (Notas.textoParaBuscar ya lo recorta a 2.000
         caracteres), para poder buscar dentro de ellas sin tener que
         abrir la carpeta. */
      notas: window.Notas ? Notas.textoParaBuscar(ficha) : '',
      /* Fila 135: solo si la ficha lo dice (sin el dato, manda el tipo). */
      reservado: typeof ficha.reservado === 'boolean' ? ficha.reservado : undefined,
      /* Fila 136 (js/conservacion.js): el día en que se archivó (sin él,
         se usa la fecha del nombre, como aproximada) y, si se ha pedido
         «Conservar más tiempo», hasta cuándo. */
      archivadoEl: ficha.cerradoEl ? String(ficha.cerradoEl).slice(0, 10) : undefined,
      conservarHasta: ficha.conservarHasta || undefined
    };
  }

  /* ==========================================================
     EL TEXTO DE BÚSQUEDA DE UNA ENTRADA (punto 7 del encargo)
     ========================================================== */

  /* Junta lo del índice (que desde la fila 64 ya trae lo poco que hace
     falta de la ficha, ver entradaDe) y lo normaliza una sola vez.
     `conNotas` a false se queda fuera el texto de las notas: lo usa
     `App.fragmentoDeNota` (fila 73) para saber si una palabra buscada
     solo aparece por una nota, no por el resto de la ficha. */
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
    FICHERO: FICHERO, CARPETA: CARPETA, VERSION: VERSION,
    cursoActual: cursoActual, cursoDeAAMMDD: cursoDeAAMMDD, cursoDeEntrada: cursoDeEntrada,
    leerDisco: leerDisco, guardar: guardar,
    anadirEntrada: anadirEntrada, quitarEntrada: quitarEntrada,
    entradaDe: entradaDe,
    textoDeBusqueda: textoDeBusqueda, resolverHandle: resolverHandle
  };
})();
window.IndiceArchivo = IndiceArchivo;
