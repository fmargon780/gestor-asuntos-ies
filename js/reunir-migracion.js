/* ============================================================
   reunir-migracion.js — «lo que hay que reunir» pasa al guion (fila
   138, 25-sep-2026, docs/UNA-SOLA-LISTA-EN-EL-HITO.md).

   Dentro de un hito había dos listas de comprobación que hacían lo
   mismo: el guion y «lo que hay que reunir». Se queda una, el guion:
   algo que hay que reunir es una línea más, con `reunir: 'documento' |
   'dato'` y `obligatorio`. Aquí se hace el paso de lo que ya había, UNA
   sola vez, con la marca `_GESTOR/reunir-migrado.json` (fuera de los
   dieciocho de las copias, como `estado-migrado.json`):

   - Cada requisito de cada paso de `guias.json` (y de cada modelo de
     `hitos-biblioteca.json`) pasa al final del guion de ese paso, con
     id `reunir-<id del requisito>`.
   - Cada requisito de cada hito de `hitos.json` (los de los asuntos
     abiertos: los archivados no están ahí) pasa a su guion
     conservando si estaba hecho, el valor, el documento, quién y cuándo:
     como estado de la línea del paso (`guionHecho`) si su paso de la
     guía la tiene, o como línea propia del asunto (`guionPropio`) si no.
   - Los requisitos viejos NO se borran de los ficheros: se dejan de
     leer, por si hay que deshacer.
   - Cada fichero, en su fila de `ColaGuardado`, y con copia
     (`Copias.guardar`). Hacerlo dos veces no duplica nada (por el id).

   `pasoAGuion` también lo usa la biblioteca de hitos al meter un modelo
   viejo en una guía (js/hitos-biblioteca.js).
   ============================================================ */
var ReunirMigracion = (function () {

  var MARCA = 'reunir-migrado.json';
  var hecho = false, corriendo = false;

  function idDe(r) { return 'reunir-' + r.id; }

  function lineaDe(r) {
    return { id: idDe(r), texto: String(r.texto || '').trim(), explicacion: '', accion: '', normativa: null,
             reunir: r.clase === 'documento' ? 'documento' : 'dato', obligatorio: !!r.obligatorio };
  }

  /* Pone al final del guion del paso las líneas de sus requisitos que
     todavía no estén. Devuelve cuántas ha puesto. Un paso-pregunta no
     tiene requisitos (se resuelve eligiendo). */
  function pasoAGuion(paso) {
    if (!paso || !Array.isArray(paso.requisitos) || !paso.requisitos.length) return 0;
    if (paso.opciones && paso.opciones.length) return 0;
    paso.guion = Array.isArray(paso.guion) ? paso.guion : [];
    var ya = {};
    paso.guion.forEach(function (g) { if (g && g.id) ya[g.id] = true; });
    var puestas = 0;
    paso.requisitos.forEach(function (r) {
      if (!r || !r.id || !String(r.texto || '').trim() || ya[idDe(r)]) return;
      paso.guion.push(lineaDe(r));
      ya[idDe(r)] = true;
      puestas++;
    });
    return puestas;
  }

  function recorrerPasos(pasos, fn) {
    (pasos || []).forEach(function (p) {
      if (!p) return;
      fn(p);
      (p.opciones || []).forEach(function (o) { recorrerPasos(o && o.pasos, fn); });
    });
  }

  function recorrerHitos(hitos, fn) {
    (hitos || []).forEach(function (h) {
      if (!h) return;
      fn(h);
      if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrerHitos(o && o.hitos, fn); });
    });
  }

  function buscarPaso(pasos, id) {
    var enc = null;
    recorrerPasos(pasos, function (p) { if (!enc && p.id === id) enc = p; });
    return enc;
  }

  /* Los requisitos del hito, a su guion. `pasoGuia`: su paso de la guía
     ya pasado por pasoAGuion (o null). Devuelve cuántos ha movido (en
     una segunda pasada, ninguno). */
  function hitoAGuion(h, pasoGuia) {
    if (!h || !Array.isArray(h.requisitos) || !h.requisitos.length || h.clase === 'decision') return 0;
    var enElPaso = {};
    ((pasoGuia && pasoGuia.guion) || []).forEach(function (g) { if (g && g.id) enElPaso[g.id] = true; });
    h.guionHecho = (h.guionHecho && typeof h.guionHecho === 'object') ? h.guionHecho : {};
    h.guionPropio = Array.isArray(h.guionPropio) ? h.guionPropio : [];
    var propias = {};
    h.guionPropio.forEach(function (g) { if (g && g.id) propias[g.id] = true; });
    var movidos = 0;
    h.requisitos.forEach(function (r) {
      if (!r || !r.id || !String(r.texto || '').trim()) return;
      var id = idDe(r);
      var nuevo = false;
      if (!enElPaso[id] && !propias[id]) {
        var l = lineaDe(r);
        h.guionPropio.push({ id: id, texto: l.texto, reunir: l.reunir, obligatorio: l.obligatorio });
        propias[id] = true;
        nuevo = true;
      }
      if ((r.hecho || r.valor || r.documento) && !h.guionHecho[id]) {
        var e = { hecho: !!r.hecho };
        if (r.valor) e.valor = r.valor;
        if (r.documento) e.documento = r.documento;
        if (r.quien) e.quien = r.quien;
        if (r.cuando) e.cuando = r.cuando;
        h.guionHecho[id] = e;
        nuevo = true;
      }
      if (nuevo) movidos++;
    });
    return movidos;
  }

  /* ---------- una sola vez, al entrar ---------- */

  function enFila(fichero, fn) { return window.ColaGuardado ? ColaGuardado.poner(fichero, fn) : fn(); }

  async function hacer() {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g) return null;
    if (await Carpetas.existeFichero(g, MARCA)) { hecho = true; return null; }
    var cuenta = { pasos: 0, modelos: 0, hitos: 0 };

    var guias = null;
    await enFila('guias.json', async function () {
      guias = (await Carpetas.leerJson(g, 'guias.json')) || {};
      Object.keys(guias).forEach(function (tipo) {
        recorrerPasos(guias[tipo], function (p) { cuenta.pasos += pasoAGuion(p); });
      });
      if (cuenta.pasos) await Copias.guardar(g, 'guias.json', guias);
    });
    if (cuenta.pasos && window.GuiasDelCentro && GuiasDelCentro.recargar) {
      try { await GuiasDelCentro.recargar(); } catch (e) { /* se relee al volver a entrar */ }
    }

    await enFila('hitos-biblioteca.json', async function () {
      var bib = await Carpetas.leerJson(g, 'hitos-biblioteca.json');
      var modelos = bib && (Array.isArray(bib) ? bib : bib.modelos);
      if (!Array.isArray(modelos)) return;
      modelos.forEach(function (m) { cuenta.modelos += pasoAGuion(m); });
      if (cuenta.modelos) await Copias.guardar(g, 'hitos-biblioteca.json', bib);
    });

    if (window.Hitos && Hitos.cambiar) {
      var tipos = (window.App && App.E && App.E.tipos) || [];
      await Hitos.cambiar(function (d) {
        Object.keys((d && d.porAsunto) || {}).forEach(function (clave) {
          var leido = window.Nombres ? Nombres.leer(clave, tipos) : {};
          var pasos = (leido && leido.tipo && guias && guias[leido.tipo]) || [];
          recorrerHitos(d.porAsunto[clave].hitos, function (h) {
            cuenta.hitos += hitoAGuion(h, h.origenGuia ? buscarPaso(pasos, h.origenGuia) : null);
          });
        });
        return d;
      });
    }

    await Carpetas.guardarJson(g, MARCA, { hechoEl: U.ahora(), hechoPor: (App.E && App.E.usuario) || '',
      pasos: cuenta.pasos, modelos: cuenta.modelos, hitos: cuenta.hitos });
    hecho = true;
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    return cuenta;
  }

  function intentar() {
    if (hecho || corriendo) return;
    if (!window.Gestor || !Gestor.carpetaGestor() || !App.E || !App.E.listaAbiertos) return;
    corriendo = true;
    /* Un poco después de entrar, como js/estado-migracion.js: que las guías ya estén leídas. */
    setTimeout(function () {
      hacer().catch(function (e) {
        U.accesorio('No he podido pasar «lo que hay que reunir» al guion (se intentará al volver a entrar)', e);
        hecho = true;
      }).then(function () { corriendo = false; });
    }, 2000);
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(intentar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { MARCA: MARCA, pasoAGuion: pasoAGuion, hitoAGuion: hitoAGuion, hacer: hacer };
})();
window.ReunirMigracion = ReunirMigracion;
