/* ============================================================
   grupos.js — grupos propios de personas, guardados con nombre.

   "Equipo directivo", "tutores de 1º", "los del departamento de
   Lengua": una lista de terceros que se monta una vez y se usa
   muchas, tanto para relacionar de golpe con un asunto
   (js/relacionados.js) como para poner los destinatarios de un
   correo (js/correo.js).

   Se guardan en el decimotercero de los ficheros compartidos,
   `_GESTOR/grupos.json` (17-sep-2026, fila 21 de docs/COLA.md,
   docs/GRUPOS-DE-PERSONAS.md):

       { "grupos": [
           { "id": "g...", "nombre": "Equipo directivo",
             "miembros": [ { "categoria": "PERSONAL", "nombre": "..." } ],
             "creadoPor": "...", "creadoEl": "2026-09-17T09:14:00" }
       ] }

   Un miembro es siempre { categoria, nombre }, igual que
   `ficha.relacionados`: no se guarda la ficha entera de la persona,
   así que si cambia de teléfono o de correo el grupo no hay que
   tocarlo. Si la persona desaparece de las listas, el grupo se queda
   con su nombre igual (js/ajustes.js la pinta en gris): nunca se toca
   un grupo sin que se lo manden.
   ============================================================ */
var Grupos = (function () {

  var FICHERO = 'grupos.json';
  var lista = [];

  function nuevoId() {
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  async function cargar() {
    var leido = null;
    try { leido = await Carpetas.leerJson(App.E.gestor, FICHERO); } catch (e) { leido = null; }
    lista = (leido && Array.isArray(leido.grupos)) ? leido.grupos : [];
    if (!leido) await Copias.guardar(App.E.gestor, FICHERO, { grupos: lista });
    return lista;
  }

  /* Como App.fusionarConDisco, pero para el fichero { grupos: [...] }
     en vez de una lista suelta: se relee antes de escribir, por si el
     compañero ha creado o cambiado un grupo desde el otro ordenador
     mientras tanto. Lo suyo que no tengamos (por id) se suma. */
  async function guardar() {
    var disco = null;
    try { disco = await Carpetas.leerJson(App.E.gestor, FICHERO); } catch (e) { disco = null; }
    var deDisco = (disco && Array.isArray(disco.grupos)) ? disco.grupos : [];
    var claves = {};
    lista.forEach(function (g) { claves[g.id] = true; });
    var extra = deDisco.filter(function (g) { return !claves[g.id]; });
    lista = lista.concat(extra);
    await Copias.guardar(App.E.gestor, FICHERO, { grupos: lista });
  }

  function porId(id) {
    return lista.filter(function (g) { return g.id === id; })[0] || null;
  }

  function usuarioActual() {
    return (window.Gestor && Gestor.usuario && Gestor.usuario()) || (App.E && App.E.usuario) || '';
  }

  async function crear(nombre, miembros) {
    var g = {
      id: nuevoId(), nombre: nombre, miembros: (miembros || []).slice(),
      creadoPor: usuarioActual(), creadoEl: U.ahora()
    };
    lista.push(g);
    await guardar();
    return g;
  }

  async function renombrar(id, nombreNuevo) {
    var g = porId(id);
    if (!g) return;
    g.nombre = nombreNuevo;
    await guardar();
  }

  async function ponerMiembros(id, miembros) {
    var g = porId(id);
    if (!g) return;
    g.miembros = miembros.slice();
    await guardar();
  }

  /* Borrar pasa por la papelera, como todo lo demás desde la fila 7. */
  async function borrar(id) {
    var g = porId(id);
    if (!g) return;
    lista = lista.filter(function (x) { return x.id !== id; });
    await guardar();
    if (window.Papelera) await Papelera.mandarDato('grupo', g.nombre, null, { grupo: g });
  }

  async function devolver(ficha) {
    var g = ficha.datos && ficha.datos.grupo;
    if (!g || !g.id) return { ok: false, motivo: 'No se sabe qué grupo era.' };
    if (porId(g.id)) return { ok: false, motivo: 'Ese grupo ya está en la lista.' };
    var repetido = lista.some(function (x) { return U.normalizar(x.nombre) === U.normalizar(g.nombre); });
    if (repetido) return { ok: false, motivo: 'Ya hay un grupo llamado "' + g.nombre + '".' };
    lista.push(g);
    await guardar();
    return { ok: true };
  }

  return {
    FICHERO: FICHERO,
    cargar: cargar,
    lista: function () { return lista; },
    porId: porId,
    crear: crear,
    renombrar: renombrar,
    ponerMiembros: ponerMiembros,
    borrar: borrar,
    devolver: devolver
  };
})();
window.Grupos = Grupos;
