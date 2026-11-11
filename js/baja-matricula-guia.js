/* ============================================================
   baja-matricula-guia.js — las tareas, los hitos y la guía del tipo BAJA
   MATRICULA (fila 592, docs/592-BAJA-MATRICULA.md). Lo llama
   js/baja-matricula.js después de dar de alta el tipo, sus datos y sus
   plantillas.

   - Las tareas y los hitos van a las listas comunes (fila 531): si ya hay
     uno igual (mismo nombre, lo que hace y su receta; el hito, además, con
     las mismas tareas) se reutiliza; si no, se crea.
   - La guía del tipo se sustituye por la de seis hitos. Se guarda sin
     llevarla a los asuntos abiertos: siguen con los hitos que tenían.
   ============================================================ */
var BajaMatriculaGuia = (function () {

  function n(t) { return U.normalizar(String(t || '')).trim(); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  /* La receta de una tarea del contenido, con los nombres ya cambiados por los id de este centro. */
  function recetaDe(d, ids) {
    var r = d.receta ? copia(d.receta) : {};
    if (d.accion === 'pedir') {
      r.campos = (d.campos || []).map(function (nombre) { return { origen: 'propio', id: ids.campos[nombre] }; }).filter(function (c) { return c.id; });
    }
    if (d.plantilla) {
      if (!ids.plantillas[d.plantilla]) throw new Error('Falta la plantilla «' + d.plantilla + '».');
      r.plantilla = ids.plantillas[d.plantilla];
    }
    return Object.keys(r).length ? r : null;
  }

  function mismaTarea(a, b) {
    return n(a.nombre) === n(b.nombre) && (a.accion || '') === (b.accion || '') &&
      JSON.stringify(a.receta || null) === JSON.stringify(b.receta || null);
  }

  /* Las tareas en la lista común. Devuelve { clave: id } y cuántas son nuevas. */
  async function ponerTareas(datos, ids) {
    var porClave = {}, nuevas = 0;
    await ComunesGuardado.cambiar('tareas', function (lista) {
      datos.tareas.forEach(function (d) {
        var t = Comunes.normalizarTarea({ nombre: d.nombre, accion: d.accion, receta: recetaDe(d, ids), explicacion: d.explicacion });
        var ya = lista.filter(function (x) { return mismaTarea(x, t); })[0];
        if (ya) { porClave[d.clave] = ya.id; return; }
        lista.push(t); nuevas++;
        porClave[d.clave] = t.id;
      });
      return lista;
    });
    return { ids: porClave, nuevas: nuevas };
  }

  function claveDeTarea(x) { return typeof x === 'string' ? x : x.tarea; }

  /* Los hitos en la lista común. Devuelve { id del contenido: id común } y cuántos son nuevos. */
  async function ponerHitos(datos, tareas) {
    var porId = {}, nuevos = 0;
    await ComunesGuardado.cambiar('hitos', function (lista) {
      datos.guia.forEach(function (d) {
        var ids = d.tareas.map(function (x) { return tareas[claveDeTarea(x)]; });
        var ya = lista.filter(function (x) { return n(x.nombre) === n(d.nombre) && (x.tareas || []).join(',') === ids.join(','); })[0];
        if (ya) { porId[d.id] = ya.id; return; }
        var h = Comunes.normalizarHito({ nombre: d.nombre, explicacion: d.explicacion, tareas: ids });
        lista.push(h); nuevos++;
        porId[d.id] = h.id;
      });
      return lista;
    });
    return { ids: porId, nuevos: nuevos };
  }

  /* La guía: un paso por hito, con sus líneas y sus «Solo si». */
  function pasosDe(datos, hitos, listas) {
    return datos.guia.map(function (d) {
      var h = Comunes.buscar(listas.hitos, hitos[d.id]);
      var paso = Comunes.pasoDeHito(h, listas.tareas);
      paso.id = d.id;
      paso.responsable = d.responsable || '';
      if (d.soloSi) paso.soloSi = copia(d.soloSi);
      d.tareas.forEach(function (x, i) {
        if (typeof x !== 'string' && x.soloSi && paso.guion[i]) paso.guion[i].soloSi = copia(x.soloSi);
      });
      return paso;
    });
  }

  /* Los asuntos abiertos de este tipo que ya tienen hitos siguen con los que tenían: los pasos nuevos se apuntan como ya
     conocidos, para que ni al guardar la guía ni al abrir su ficha (la red de seguridad de js/hitos-sincronizar.js) lleguen. */
  async function dejarEnPazLosAbiertos(tipo, pasos) {
    if (!window.Hitos || !Hitos.cambiar) return;
    var claves = (App.E.listaAbiertos || []).filter(function (a) { return a.leido && a.leido.tipo === tipo.tipo; }).map(function (a) { return a.nombre; });
    if (!claves.length) return;
    var ids = pasos.map(function (p) { return p.id; });
    await Hitos.cambiar(function (d) {
      claves.forEach(function (c) {
        var e = d.porAsunto && d.porAsunto[c];
        if (!e || !(e.hitos || []).length) return;
        var ya = Array.isArray(e.pasosConocidos) ? e.pasosConocidos.slice() : [];
        ids.forEach(function (id) { if (ya.indexOf(id) === -1) ya.push(id); });
        e.pasosConocidos = ya;
      });
      return d;
    });
  }

  /* `ids`: { campos: nombre -> id del campo propio, plantillas: nombre -> id }. Devuelve cuántas tareas, hitos y pasos. */
  async function poner(datos, tipo, ids) {
    var t = await ponerTareas(datos, ids);
    var h = await ponerHitos(datos, t.ids);
    var listas = await ComunesGuardado.leer();
    var pasos = pasosDe(datos, h.ids, listas);
    await dejarEnPazLosAbiertos(tipo, pasos);
    await GuiasDelCentro.guardarPasos(tipo.tipo, pasos, { sinLlevar: true });
    return { tareas: t.nuevas, hitos: h.nuevos, pasos: pasos.length };
  }

  return { poner: poner, _pasosDe: pasosDe };
})();
window.BajaMatriculaGuia = BajaMatriculaGuia;
