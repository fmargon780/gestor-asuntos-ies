/* ============================================================
   tercero-renombrar.js — fila 266
   (docs/CAMBIAR-DATOS-DEL-TERCERO-DESDE-EL-ASUNTO.md).

   Cuando se cambian los datos de un tercero dado de alta a mano y
   cambia su texto (App.textoTercero: el NIF, la razón social, el
   nombre, el documento, el Nº escolar), ese texto va en el nombre de
   la carpeta de cada asunto suyo y en la carpeta suya del ARCHIVO.
   Aquí vive todo lo que viene después de guardar los datos:

     1. `preparar`: qué carpetas cambiarían (asuntos abiertos y la del
        ARCHIVO) para enseñarlas antes en el cuadro de «Adelante».
     2. `preguntar`: el cuadro «Cambia el nombre de las carpetas».
     3. `aplicar`: renombrar los asuntos abiertos (siempre por
        AsuntoRenombrar), la carpeta del ARCHIVO (y su índice) y los
        demás sitios donde figura el texto viejo: relacionados de
        otros asuntos abiertos, grupos y asuntos recurrentes.

   Los asuntos ya archivados no se tocan: conservan su nombre, tal como
   se cerraron. App.cambiarDatosDelTercero (js/archivo-personas.js) lo
   llama; este fichero no envuelve nada.
   ============================================================ */
var TerceroRenombrar = (function () {

  /* El texto del tercero tal como quedará con los datos del cuadro,
     antes de guardar nada. */
  function textoDeValores(categoria, puestos) {
    var def = Datos.LISTAS[categoria];
    return App.textoTercero({
      categoria: categoria, nombre: puestos[def.cabecera[0]] || '',
      nif: puestos['NIF'] || '', referencia: puestos['Referencia'] || '',
      documento: puestos['Documento'] || '', id: puestos['Nº Id. Escolar'] || ''
    });
  }

  /* Una carpeta de asunto abierto es de ese tercero si termina en su texto. */
  function esDelTercero(nombre, texto) {
    return nombre === texto || nombre.slice(-(texto.length + 1)) === ' ' + texto;
  }

  /* La carpeta del tercero en el ARCHIVO, con el nombre que tiene hoy
     (el texto entero o el corto de fila 247) y el que tendrá. */
  async function carpetasDelArchivo(categoria, textoAntes, textoDespues) {
    if (!App.E.archivo || !window.Duplicados) return null;
    var dirCategoria;
    try { dirCategoria = await App.E.archivo.getDirectoryHandle(categoria); }
    catch (e) { return null; }
    var existentes = (await Carpetas.subcarpetas(dirCategoria)).map(function (c) { return c.nombre; });
    var viejo = existentes.indexOf(textoAntes) !== -1 ? textoAntes : Nombres.carpetaDeTercero(textoAntes, existentes);
    if (existentes.indexOf(viejo) === -1) return null;
    var nuevo = Nombres.carpetaDeTercero(textoDespues, existentes.filter(function (n) { return n !== viejo; }));
    return { dirCategoria: dirCategoria, viejo: viejo, nuevo: nuevo, nuevoYaExiste: existentes.indexOf(nuevo) !== -1 };
  }

  /* info: { categoria, textoAntes, textoDespues }.
     Devuelve { afectados: [nombres de carpeta abierta], archivo: {…}|null }. */
  async function preparar(info) {
    var abiertas = await Carpetas.subcarpetas(App.E.abiertos);
    var afectados = abiertas.map(function (c) { return c.nombre; }).filter(function (n) {
      return n.charAt(0) !== '_' && esDelTercero(n, info.textoAntes);
    });
    var archivo = await carpetasDelArchivo(info.categoria, info.textoAntes, info.textoDespues);
    if (archivo && archivo.viejo === archivo.nuevo) archivo = null;
    return { afectados: afectados, archivo: archivo };
  }

  /* El cuadro de «Adelante». Sin carpetas que cambiar no sale: true. */
  async function preguntar(info, plan) {
    if (!plan.afectados.length && !plan.archivo) return true;
    var lista = plan.afectados.length
      ? '<label class="etiqueta">Asuntos abiertos (' + plan.afectados.length + ')</label>' +
        '<ul class="lista-carpetas" style="max-height:' + (plan.afectados.length > 12 ? '16em' : 'none') +
        ';overflow-y:auto;margin:4px 0 10px;padding-left:20px">' +
        plan.afectados.map(function (n) { return '<li>' + U.escapar(n) + '</li>'; }).join('') + '</ul>'
      : '';
    var archivo = plan.archivo
      ? '<p class="explica">Su carpeta del archivo cambia de nombre. ' +
        'Los asuntos archivados de dentro se quedan como están.</p>'
      : '';
    var promesa = U.preguntar('Cambia el nombre de las carpetas',
      '<p class="explica">El nombre de este tercero pasa de «' + U.escapar(info.textoAntes) + '» a «' +
      U.escapar(info.textoDespues) + '». Las carpetas de sus asuntos llevan ese nombre, así que cambian también.</p>' +
      lista + archivo, 'Adelante');
    var cuadro = document.querySelector('#capa .cuadro');
    if (cuadro) cuadro.classList.add('cuadro-ancho');
    var ok = await promesa;
    if (cuadro) cuadro.classList.remove('cuadro-ancho');
    return !!ok;
  }

  /* ---------- paso 3: los asuntos abiertos ---------- */

  async function renombrarAbiertos(info, plan, resultado) {
    try { if (window.Presencia && Presencia.refrescarCache) await Presencia.refrescarCache(); } catch (e) { /* se usa la caché */ }
    for (var i = 0; i < plan.afectados.length; i++) {
      var viejo = plan.afectados[i];
      var nuevo = viejo.slice(0, viejo.length - info.textoAntes.length) + info.textoDespues;
      if ((App.E.ocupados && App.E.ocupados[viejo]) || (window.Presencia && Presencia.ocupantePor(viejo))) {
        resultado.saltados.push(viejo);
        continue;
      }
      try {
        if (await Carpetas.existe(App.E.abiertos, nuevo)) { resultado.fallos.push(viejo + ' (ya hay otra con el nombre nuevo)'); continue; }
        await App.conOcupado(viejo, async function () {
          /* Antes de tocar la carpeta: la ficha abierta con el nombre viejo sigue al nuevo sin aviso rojo. */
          (App.E.recienRenombrados = App.E.recienRenombrados || {})[viejo] = nuevo;
          try { await Carpetas.renombrar(App.E.abiertos, viejo, nuevo); }
          catch (eR) { delete App.E.recienRenombrados[viejo]; throw eR; }
          var extra = { tercero: info.textoDespues, editadoEl: U.ahora(), editadoPor: App.E.usuario };
          if (info.personaNueva) extra.contacto = Datos.fotoDeContacto(info.personaNueva, info.categoria);
          await AsuntoRenombrar.mover(viejo, nuevo, extra);
        });
        resultado.renombrados++;
        resultado.nombres[viejo] = nuevo;
      } catch (e) { resultado.fallos.push(viejo + ': ' + U.mensajeDeError(e)); }
    }
  }

  /* ---------- paso 4: la carpeta del ARCHIVO y su índice ---------- */

  async function renombrarArchivo(plan, categoria, resultado) {
    var a = plan.archivo;
    if (!a) return;
    try {
      /* Se vuelve a mirar: entre el cuadro y ahora la carpeta nueva puede haber aparecido. */
      var yaExiste = await Carpetas.existe(a.dirCategoria, a.nuevo);
      if (yaExiste) await Carpetas.fusionarEn(a.dirCategoria, a.viejo, a.dirCategoria, a.nuevo);
      else await Carpetas.renombrar(a.dirCategoria, a.viejo, a.nuevo);
    } catch (e) {
      resultado.fallos.push('la carpeta ' + a.viejo + ' del archivo: ' + U.mensajeDeError(e));
      return;
    }
    try { if (window.IndiceArchivo) await IndiceArchivo.cambiarTercero(categoria, a.viejo, a.nuevo); }
    catch (e2) { resultado.fallos.push('el índice del archivo (Reconstruir el índice lo arregla): ' + U.mensajeDeError(e2)); }
  }

  /* ---------- paso 5: los demás sitios con el texto viejo ---------- */

  async function ponerAlDia(info, resultado) {
    var viejo = info.textoAntes, nuevo = info.textoDespues, cat = info.categoria;

    /* Relacionados de los asuntos abiertos. */
    try {
      var abiertas = (await Carpetas.subcarpetas(App.E.abiertos)).map(function (c) { return c.nombre; });
      for (var i = 0; i < abiertas.length; i++) {
        var ficha = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[abiertas[i]];
        var rel = ficha && Array.isArray(ficha.relacionados) ? ficha.relacionados : [];
        if (!rel.some(function (r) { return r && r.categoria === cat && r.nombre === viejo; })) continue;
        await App.anotarLista(abiertas[i], 'relacionados',
          { quitar: [{ categoria: cat, nombre: viejo }], anadir: [{ categoria: cat, nombre: nuevo }] });
      }
    } catch (e) { resultado.fallos.push('los relacionados de otros asuntos: ' + U.mensajeDeError(e)); }

    /* Grupos. */
    try {
      if (window.Grupos) {
        await Grupos.cargar();
        var grupos = Grupos.lista().slice();
        for (var g = 0; g < grupos.length; g++) {
          var miembros = grupos[g].miembros || [];
          if (!miembros.some(function (m) { return m && m.categoria === cat && m.nombre === viejo; })) continue;
          var nuevos = [], vistos = {};
          miembros.forEach(function (m) {
            var m2 = (m && m.categoria === cat && m.nombre === viejo) ? Object.assign({}, m, { nombre: nuevo }) : m;
            var k = (m2.categoria || '') + '|' + (m2.nombre || '');
            if (!vistos[k]) { vistos[k] = true; nuevos.push(m2); }
          });
          await Grupos.ponerMiembros(grupos[g].id, nuevos);
        }
      }
    } catch (e2) { resultado.fallos.push('los grupos: ' + U.mensajeDeError(e2)); }

    /* Asuntos recurrentes. */
    try {
      await App.enFila('recurrentes.json', async function () {
        var lista = null;
        try { lista = await Carpetas.leerJson(App.E.gestor, 'recurrentes.json'); } catch (e) { lista = null; }
        if (!Array.isArray(lista)) return;
        var cambiados = 0;
        lista.forEach(function (r) { if (r && r.tercero === viejo) { r.tercero = nuevo; cambiados++; } });
        if (!cambiados) return;
        await Copias.guardar(App.E.gestor, 'recurrentes.json', lista);
        if (window.Recurrentes && Recurrentes._cargar) { try { await Recurrentes._cargar(); } catch (e) { /* se relee al volver */ } }
      });
    } catch (e3) { resultado.fallos.push('los asuntos recurrentes: ' + U.mensajeDeError(e3)); }
  }

  /* Pasos 3, 4 y 5, ya con los datos guardados. Los datos quedan
     guardados pase lo que pase aquí: lo que falla avisa en ámbar. */
  async function aplicar(info, plan) {
    var resultado = { renombrados: 0, saltados: [], fallos: [], nombres: {} };
    await renombrarAbiertos(info, plan, resultado);
    await renombrarArchivo(plan, info.categoria, resultado);
    await ponerAlDia(info, resultado);

    if (resultado.fallos.length) {
      U.accesorio('Los datos están guardados, pero no he podido cambiar: ' + resultado.fallos.join('; '));
    }
    if (resultado.saltados.length) {
      U.aviso(resultado.saltados.length + ' asunto(s) no han cambiado de nombre porque están abiertos en otro ordenador: ' +
        resultado.saltados.join(', ') + '. Cuando queden libres, cámbialos con «Cambiar el asunto».', 'ambar');
    }
    return resultado;
  }

  return {
    textoDeValores: textoDeValores, preparar: preparar, preguntar: preguntar, aplicar: aplicar,
    _esDelTercero: esDelTercero
  };
})();
window.TerceroRenombrar = TerceroRenombrar;
