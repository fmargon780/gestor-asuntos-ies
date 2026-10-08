/* ============================================================
   carpetas-perdidas-buscar.js — encontrar la carpeta de un asunto que ha perdido la suya
   (fila 303, docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md, apartados 1, 2 y 4).

   Sin pantalla y sin escribir nada. Para un asunto perdido, las candidatas son:
     - todas las carpetas de asuntos abiertos, tengan o no asunto apuntado;
     - todas las del ARCHIVO, de cualquier curso: las del índice guardado y, aunque el índice exista, las de
       la carpeta de esa persona leída directamente (el índice puede estar sin hacer o atrasado).

   Cada candidata: { nombre, donde: 'abiertos' | 'archivo', categoria, tercero, ruta, tieneAsunto, entrada?, handle? }.
   `tieneAsunto` en las del ARCHIVO se sabe con `completar` (lee su `_ficha.json`).

   Se carga después de js/archivo-indice.js, js/ficha-archivo.js y js/parecido-de-carpetas.js.
   ============================================================ */
var CarpetasPerdidasBuscar = (function () {

  var TOPE = 30;

  function n(t) { return window.U && U.normalizar ? U.normalizar(String(t || '')) : String(t || '').toLowerCase(); }

  function fichas() { return (App.E.registro && App.E.registro.asuntos) || {}; }

  function deAbiertos() {
    var registro = fichas();
    return (App.E.listaAbiertos || []).map(function (a) {
      return { nombre: a.nombre, donde: 'abiertos', categoria: '', tercero: '', ruta: '', tieneAsunto: !!registro[a.nombre] };
    });
  }

  /* Lo guardado en el índice del ARCHIVO. `hay`: false si el índice no está hecho. */
  async function deIndice() {
    var r = window.IndiceArchivo ? await IndiceArchivo.leerDisco({ todos: true }) : { ok: false };
    if (!r.ok) return { hay: false, lista: [] };
    var registro = fichas();
    return {
      hay: true,
      lista: r.datos.asuntos.map(function (e) {
        return {
          nombre: e.nombre, donde: 'archivo', categoria: e.categoria || '', tercero: e.tercero || '',
          ruta: e.ruta || ((e.categoria || '') + ' / ' + (e.tercero || '')), entrada: e,
          tieneAsunto: registro[e.nombre] ? true : null
        };
      })
    };
  }

  /* Los datos de contexto que sirven a todos los asuntos perdidos de una vez: se leen una sola vez. */
  async function contexto() {
    var indice = await deIndice();
    return { abiertos: deAbiertos(), archivo: indice.lista, indiceHecho: indice.hay };
  }

  /* La carpeta de la persona en el ARCHIVO (`ARCHIVO/<categoría>/<tercero>`), leída directamente: una sola
     carpeta por asunto perdido. La categoría y el tercero salen de la ficha y, si no, del nombre. */
  async function deLaPersona(clave) {
    var salida = [];
    if (!App.E.archivo || !window.Carpetas || !window.Nombres) return salida;
    var ficha = fichas()[clave] || {};
    var leido = Nombres.leer(clave, App.E.tipos);
    var tercero = ficha.tercero || Nombres.terceroDeResto(leido.resto);
    if (!tercero) return salida;
    var categorias = [];
    [ficha.categoria, leido.categoria].forEach(function (c) { if (c && categorias.indexOf(c) === -1) categorias.push(c); });
    try {
      (await Carpetas.subcarpetas(App.E.archivo)).forEach(function (c) {
        if (categorias.indexOf(c.nombre) === -1 && !Carpetas.esCarpetaTemporalDeSincronizacion(c.nombre)) categorias.push(c.nombre);
      });
    } catch (e) { return salida; }
    var nombresDelTercero = [tercero];
    if (Nombres.acortarNombrePila && Nombres.acortarNombrePila(tercero) !== tercero) nombresDelTercero.push(Nombres.acortarNombrePila(tercero));
    var registro = fichas();
    for (var i = 0; i < categorias.length; i++) {
      for (var j = 0; j < nombresDelTercero.length; j++) {
        var carpetaTercero = null;
        try {
          var cat = await App.E.archivo.getDirectoryHandle(categorias[i]);
          carpetaTercero = await cat.getDirectoryHandle(nombresDelTercero[j]);
        } catch (e) { carpetaTercero = null; }
        if (!carpetaTercero) continue;
        var hijas = [];
        try { hijas = await Carpetas.subcarpetas(carpetaTercero); } catch (e) { hijas = []; }
        hijas.forEach(function (h) {
          if (Carpetas.esCarpetaTemporalDeSincronizacion(h.nombre)) return;
          var l = Nombres.leer(h.nombre, App.E.tipos);
          if (!l.fecha) return;
          salida.push({
            nombre: h.nombre, donde: 'archivo', categoria: categorias[i], tercero: nombresDelTercero[j],
            ruta: categorias[i] + ' / ' + nombresDelTercero[j], handle: h.handle, padre: carpetaTercero,
            tieneAsunto: registro[h.nombre] ? true : null
          });
        });
        break;   /* la carpeta de esta categoría ya está leída */
      }
    }
    return salida;
  }

  /* Todas las candidatas de un asunto perdido, sin repetir (si una está en el índice y también leída
     directamente, vale la leída: lleva su manejador). */
  async function candidatas(clave, ctx) {
    ctx = ctx || await contexto();
    var porNombre = {};
    ctx.abiertos.concat(ctx.archivo).forEach(function (c) { porNombre[c.nombre] = c; });
    (await deLaPersona(clave)).forEach(function (c) {
      var previa = porNombre[c.nombre];
      if (previa && previa.entrada) c.entrada = previa.entrada;
      if (!previa || previa.donde === 'archivo') porNombre[c.nombre] = c;
    });
    delete porNombre[clave];
    return Object.keys(porNombre).map(function (k) { return porNombre[k]; });
  }

  /* La carpeta (manejador) de una candidata del ARCHIVO. */
  async function carpetaDe(c) {
    if (c.handle) return c.handle;
    if (c.donde === 'abiertos') { try { return await App.E.abiertos.getDirectoryHandle(c.nombre); } catch (e) { return null; } }
    var e = c.entrada || { nombre: c.nombre, categoria: c.categoria, tercero: c.tercero, ruta: c.ruta, sueltoEn: '' };
    var r = window.IndiceArchivo ? await IndiceArchivo.resolverHandle(e) : null;
    if (r) { c.handle = r.handle; c.padre = r.padre; }
    return r ? r.handle : null;
  }

  /* ¿La carpeta ya tiene su propio asunto? En abiertos, si está apuntado; en el ARCHIVO, si lo está o lleva
     `_ficha.json`. Pone `tieneAsunto` en la candidata. */
  async function completar(c) {
    if (c.tieneAsunto === true || c.tieneAsunto === false) return c.tieneAsunto;
    var tiene = !!fichas()[c.nombre];
    if (!tiene && window.FichaArchivo) {
      var h = await carpetaDe(c);
      if (h) { try { tiene = !!(await FichaArchivo.leer(h)); } catch (e) { tiene = false; } }
    }
    c.tieneAsunto = tiene;
    return tiene;
  }

  /* Apartado 2: de cada asunto perdido, la carpeta que encaja si es la única; y ninguna carpeta se propone
     para dos asuntos a la vez. `claves`: los asuntos perdidos. Devuelve { propuestas: [{ clave, carpeta }],
     indiceHecho }. */
  async function proponer(claves) {
    var ctx = await contexto();
    var provisional = [];
    for (var i = 0; i < claves.length; i++) {
      var lista = await candidatas(claves[i], ctx);
      var encajan = window.ParecidoDeCarpetas ? ParecidoDeCarpetas.encajes(claves[i], lista, App.E.tipos) : [];
      if (encajan.length === 1) provisional.push({ clave: claves[i], carpeta: encajan[0] });
    }
    var veces = {};
    provisional.forEach(function (p) { veces[p.carpeta.nombre] = (veces[p.carpeta.nombre] || 0) + 1; });
    var propuestas = provisional.filter(function (p) { return veces[p.carpeta.nombre] === 1; });
    for (var k = 0; k < propuestas.length; k++) await completar(propuestas[k].carpeta);
    return { propuestas: propuestas, indiceHecho: ctx.indiceHecho };
  }

  /* Apartado 4: las candidatas ordenadas de más a menos parecida y, si se escribe algo, solo las que tienen
     todas las palabras (sin importar mayúsculas ni tildes). Como mucho `TOPE`. */
  function buscar(clave, lista, texto) {
    var palabras = n(texto).split(/\s+/).filter(Boolean);
    var ordenadas = window.ParecidoDeCarpetas
      ? ParecidoDeCarpetas.ordenar(clave, lista, App.E.tipos)
      : lista.map(function (c) { return { nombre: c.nombre, candidato: c, claro: false }; });
    var encajan = window.ParecidoDeCarpetas
      ? ParecidoDeCarpetas.encajes(clave, lista, App.E.tipos).map(function (c) { return c.nombre; }) : [];
    var unica = encajan.length === 1 ? encajan[0] : '';
    var coinciden = ordenadas.filter(function (o) {
      var donde = o.candidato.donde === 'archivo' ? (o.candidato.categoria + ' ' + o.candidato.tercero) : '';
      var busca = n(o.nombre + ' ' + donde);
      return palabras.every(function (p) { return busca.indexOf(p) !== -1; });
    });
    /* La que encaja, siempre arriba; los empates de las que encajan, también. */
    coinciden.sort(function (a, b) {
      var ea = encajan.indexOf(a.nombre) !== -1 ? 1 : 0, eb = encajan.indexOf(b.nombre) !== -1 ? 1 : 0;
      return eb - ea;
    });
    return {
      total: coinciden.length,
      resultados: coinciden.slice(0, TOPE).map(function (o) { return { candidato: o.candidato, parece: o.nombre === unica }; }),
      mas: Math.max(0, coinciden.length - TOPE)
    };
  }

  /* Cuántos documentos tiene dentro (solo de la elegida): no cuentan las fichas de la propia app (`_ficha.json`),
     el historial de hitos ni el índice del expediente. La carpeta y un nivel más. */
  async function contarDocumentos(c) {
    var h = await carpetaDe(c);
    if (!h) return null;
    var historial = window.Hitos && Hitos.NOMBRE_HISTORIAL;
    async function contar(dir, nivel) {
      var n = 0;
      for await (var pareja of dir.entries()) {
        var nombre = pareja[0];
        if (Carpetas.esCarpetaTemporalDeSincronizacion(nombre)) continue;
        if (pareja[1].kind === 'file') {
          if (nombre.charAt(0) === '_' || nombre === historial || (window.IndiceExpediente && IndiceExpediente.es(nombre))) continue;
          n++;
        } else if (nivel < 1) {
          n += await contar(pareja[1], nivel + 1);
        }
      }
      return n;
    }
    try { return await contar(h, 0); } catch (e) { return null; }
  }

  return {
    TOPE: TOPE, contexto: contexto, candidatas: candidatas, proponer: proponer, buscar: buscar,
    completar: completar, carpetaDe: carpetaDe, contarDocumentos: contarDocumentos,
    /* para las pruebas */
    _deLaPersona: deLaPersona
  };
})();
window.CarpetasPerdidasBuscar = CarpetasPerdidasBuscar;
