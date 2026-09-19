/* ============================================================
   archivo-indice.js — el índice guardado del ARCHIVO (17-sep-2026,
   fila 44, docs/BUSCADOR-ARCHIVO-INDICE.md).

   Hasta ahora, entrar en la pantalla ARCHIVO recorría el archivo
   entero cada vez (categoría → tercero → asunto) y la búsqueda era
   un `indexOf` sobre un solo texto. Aquí vive el índice que arregla
   eso: `_GESTOR/indice-archivo.json`, compartido entre los dos
   ordenadores.

   Igual que `js/presencia.js` con `presencia.json`: se lee y se
   escribe DIRECTO con `Carpetas`, nunca con `Copias.guardar`. No
   entra en las copias de seguridad, ni en la papelera, ni en la
   fusión de conflictos de Dropbox: se puede rehacer entero en
   cualquier momento con "Reconstruir el índice", así que no hace
   falta protegerlo como a los catorce ficheros de verdad.

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

   Va cargado después de `js/carpetas.js`, `js/nombres.js` y
   `js/nucleo.js` (usa `App.E`), y antes de `js/asuntos-archivar.js`
   (alta y baja al archivar/reabrir), de `js/archivo-personas.js`
   (la pantalla) y de `js/ficha-archivo.js`.
   ============================================================ */
var IndiceArchivo = (function () {

  var FICHERO = 'indice-archivo.json';
  var VERSION = 1;

  function gestor() { return window.App && App.E && App.E.gestor; }

  /* ==========================================================
     LEER Y ESCRIBIR EL FICHERO, DIRECTO (sin Copias.guardar)
     ========================================================== */

  /* { ok: true, datos } si el índice se puede usar; si no,
     { ok: false, motivo: 'no-existe' | 'roto' | 'version' | 'sin-carpeta' }.
     Los tres primeros motivos se tratan igual en la pantalla: "El
     índice no está hecho." */
  async function leerDisco() {
    var g = gestor();
    if (!g) return { ok: false, motivo: 'sin-carpeta' };
    var datos;
    try { datos = await Carpetas.leerJson(g, FICHERO); }
    catch (e) { return { ok: false, motivo: 'roto' }; }
    if (!datos) return { ok: false, motivo: 'no-existe' };
    if (datos.version !== VERSION || !Array.isArray(datos.asuntos)) {
      return { ok: false, motivo: 'version' };
    }
    return { ok: true, datos: datos };
  }

  function escribirDisco(datos) {
    var g = gestor();
    if (!g) return Promise.resolve();
    return Carpetas.escribirTexto(g, FICHERO, JSON.stringify(datos));
  }

  /* Guarda un índice recién reconstruido ENTERO: relee el disco y
     fusiona por nombre de carpeta de asunto, como Grupos.guardar. Lo
     que haya en disco y no esté en lo recién construido (el compañero
     archivó algo mientras tanto) se suma. */
  async function guardar(datos) {
    var previo = null;
    try { previo = await Carpetas.leerJson(gestor(), FICHERO); } catch (e) { previo = null; }
    var deDisco = (previo && Array.isArray(previo.asuntos)) ? previo.asuntos : [];
    var claves = {};
    datos.asuntos.forEach(function (a) { claves[a.nombre] = true; });
    var extra = deDisco.filter(function (a) { return !claves[a.nombre]; });
    datos.asuntos = datos.asuntos.concat(extra);
    await escribirDisco(datos);
    return datos;
  }

  /* Añade (o sustituye, si ya estaba) una sola entrada, sin tocar el
     resto: para cuando se archiva un asunto (punto 6.3 del encargo).
     Si el índice todavía no existe, no se crea uno a medias: se
     queda sin hacer nada, como pide el encargo. */
  async function anadirEntrada(entrada) {
    var g = gestor();
    if (!g) return;
    var previo = null;
    try { previo = await Carpetas.leerJson(g, FICHERO); } catch (e) { previo = null; }
    if (!previo || !Array.isArray(previo.asuntos)) return;
    previo.asuntos = previo.asuntos.filter(function (a) { return a.nombre !== entrada.nombre; });
    previo.asuntos.push(entrada);
    await escribirDisco(previo);
  }

  /* Quita una entrada por el nombre de su carpeta: para cuando se
     reabre un asunto. Igual de silencioso si el índice no existe. */
  async function quitarEntrada(nombre) {
    var g = gestor();
    if (!g) return;
    var previo = null;
    try { previo = await Carpetas.leerJson(g, FICHERO); } catch (e) { previo = null; }
    if (!previo || !Array.isArray(previo.asuntos)) return;
    var antes = previo.asuntos.length;
    previo.asuntos = previo.asuntos.filter(function (a) { return a.nombre !== nombre; });
    if (previo.asuntos.length === antes) return;   /* no estaba: nada que escribir */
    await escribirDisco(previo);
  }

  /* ==========================================================
     LEER EL AÑO ACADÉMICO Y EL GRUPO DEL NOMBRE DE LA CARPETA

     Mismos patrones que ya usa `Nombres.terceroDeResto` para
     quitarlos del principio del resto (aquí se capturan en vez de
     quitarse). Lo que no se reconozca se deja en blanco: nada se
     inventa.
     ========================================================== */
  var RE_CURSO_RESTO = /^(\d{2}[-\/]\d{2})\s+/;
  var RE_GRUPO_RESTO = /^(\d[ºo°](?:Bach|FP|Div)?[A-Za-z]?)\s+/i;

  function cursoYGrupoDeResto(resto) {
    var t = String(resto || '');
    var curso = '', grupo = '';
    var m1 = t.match(RE_CURSO_RESTO);
    if (m1) { curso = m1[1]; t = t.slice(m1[0].length); }
    var m2 = t.match(RE_GRUPO_RESTO);
    if (m2) grupo = m2[1];
    return { curso: curso, grupo: grupo };
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
      if (!Carpetas.esCarpetaTemporalDeSincronizacion(f.nombre)) salida.push(f.nombre);
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
    var cursoGrupo = cursoYGrupoDeResto(leido.resto);
    var documentos = await nombresDeDocumentos(handle);
    var ficha = fichaConocida;
    if (ficha === undefined && window.FichaArchivo) {
      try { ficha = await FichaArchivo.leer(handle); } catch (e) { ficha = null; }
    }
    ficha = ficha || {};
    return {
      nombre: nombre, categoria: categoria, tercero: tercero, ruta: ruta,
      fecha: leido.fecha || '', tipo: leido.tipo || '',
      curso: cursoGrupo.curso, grupo: cursoGrupo.grupo,
      documentos: documentos, registros: registrosDeNombres(documentos),
      sueltoEn: sueltoEn || '',
      situacion: ficha.situacion || '', via: ficha.via || '', viaDato: ficha.viaDato || '',
      loPideNombre: (ficha.loPide && ficha.loPide.nombre) || '',
      relacionados: relacionadosDeFicha(ficha), camposTexto: camposDeFicha(ficha)
    };
  }

  /* ==========================================================
     RECORRER EL ARCHIVO ENTERO (construir el índice, o el
     recuento barato para saber si se ha quedado corto)
     ========================================================== */

  /* ¿Esta carpeta, justo debajo de la categoría o de un tercero, es
     un asunto (tiene fecha y tipo) en vez de una carpeta normal? El
     mismo criterio para los dos casos descolocados del punto 5. */
  function pareceAsunto(nombreCarpeta, tipos) {
    var leido = Nombres.leer(nombreCarpeta, tipos);
    return !!(leido.fecha && leido.tipo);
  }

  /* Recorre el archivo entero UNA VEZ y devuelve el índice completo,
     sin guardarlo. `onProgreso(nombreCategoria, totalHastaAhora)` se
     llama al terminar cada categoría, para la línea de estado. */
  async function construir(onProgreso) {
    var archivo = App.E.archivo;
    var tipos = App.E.tipos;
    var categorias = await Carpetas.subcarpetas(archivo);
    var asuntos = [];
    var recuento = {};

    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(cat.nombre)) continue;
      var nivel2 = await Carpetas.subcarpetas(cat.handle);
      var contadorTerceros = 0;

      for (var j = 0; j < nivel2.length; j++) {
        var item2 = nivel2[j];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(item2.nombre)) continue;

        if (pareceAsunto(item2.nombre, tipos)) {
          /* Un asunto archivado a mano justo debajo de la categoría
             (punto 5.1 del encargo): tercero vacío. */
          asuntos.push(await entradaDe(
            item2.handle, item2.nombre, cat.nombre, '', cat.nombre, 'bajo la categoría', tipos));
          continue;
        }

        contadorTerceros++;
        var nivel3 = await Carpetas.subcarpetas(item2.handle);
        var rutaTercero = cat.nombre + ' / ' + item2.nombre;

        for (var k = 0; k < nivel3.length; k++) {
          var item3 = nivel3[k];
          if (Carpetas.esCarpetaTemporalDeSincronizacion(item3.nombre)) continue;

          if (pareceAsunto(item3.nombre, tipos)) {
            asuntos.push(await entradaDe(
              item3.handle, item3.nombre, cat.nombre, item2.nombre, rutaTercero, '', tipos));
            continue;
          }

          /* No parece un asunto: puede ser una carpeta de más que
             esconde el asunto un nivel más adentro (punto 5.2). Se
             mira un nivel más antes de rendirse. */
          var nivel4 = await Carpetas.subcarpetas(item3.handle);
          var huboAlguno = false;
          var rutaExtra = rutaTercero + ' / ' + item3.nombre;
          for (var m = 0; m < nivel4.length; m++) {
            var item4 = nivel4[m];
            if (Carpetas.esCarpetaTemporalDeSincronizacion(item4.nombre)) continue;
            if (pareceAsunto(item4.nombre, tipos)) {
              huboAlguno = true;
              asuntos.push(await entradaDe(
                item4.handle, item4.nombre, cat.nombre, item2.nombre, rutaExtra, rutaExtra, tipos));
            }
          }
          if (!huboAlguno) {
            /* Ni lo uno ni lo otro: se enseña igual, como hacía el
               recorrido de siempre (que tampoco miraba el nombre). */
            asuntos.push(await entradaDe(
              item3.handle, item3.nombre, cat.nombre, item2.nombre, rutaTercero, '', tipos));
          }
        }
      }

      recuento[cat.nombre] = contadorTerceros;
      if (onProgreso) onProgreso(cat.nombre, asuntos.length);
    }

    return {
      version: VERSION, hechoEl: U.ahora(), hechoPor: (App.E && App.E.usuario) || '',
      recuento: recuento, asuntos: asuntos
    };
  }

  /* El recuento de ahora mismo, barato: solo categorías y carpetas de
     tercero (un nivel), sin entrar en los asuntos. Para el punto 6.2:
     si no cuadra con el `recuento` guardado, el índice puede haberse
     quedado corto. */
  async function recuentoActual() {
    var archivo = App.E.archivo;
    var tipos = App.E.tipos;
    var categorias = await Carpetas.subcarpetas(archivo);
    var recuento = {};
    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      if (Carpetas.esCarpetaTemporalDeSincronizacion(cat.nombre)) continue;
      var nivel2 = await Carpetas.subcarpetas(cat.handle);
      var n = 0;
      for (var j = 0; j < nivel2.length; j++) {
        var item2 = nivel2[j];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(item2.nombre)) continue;
        if (!pareceAsunto(item2.nombre, tipos)) n++;
      }
      recuento[cat.nombre] = n;
    }
    return recuento;
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
     EL TEXTO DE BÚSQUEDA DE UNA ENTRADA (punto 7 del encargo)
     ========================================================== */

  /* Junta lo del índice (que desde la fila 64 ya trae lo poco que hace
     falta de la ficha, ver entradaDe) y lo normaliza una sola vez. */
  function textoDeBusqueda(entrada) {
    var partes = [
      entrada.nombre, entrada.categoria, entrada.tercero, entrada.ruta,
      entrada.tipo, entrada.curso, entrada.grupo
    ].concat(entrada.documentos || []).concat(entrada.registros || []);

    partes.push(entrada.situacion || '');
    if (entrada.via) {
      var v = window.Nombres && Nombres.via(entrada.via);
      partes.push(v ? v.texto : entrada.via);
    }
    partes.push(entrada.viaDato || '', entrada.loPideNombre || '', entrada.camposTexto || '');
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
    FICHERO: FICHERO, VERSION: VERSION,
    leerDisco: leerDisco, guardar: guardar,
    anadirEntrada: anadirEntrada, quitarEntrada: quitarEntrada,
    entradaDe: entradaDe, construir: construir,
    recuentoActual: recuentoActual, recuentosIguales: recuentosIguales,
    textoDeBusqueda: textoDeBusqueda, resolverHandle: resolverHandle
  };
})();
window.IndiceArchivo = IndiceArchivo;
