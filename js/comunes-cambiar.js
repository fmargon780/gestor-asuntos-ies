/* ============================================================
   comunes-cambiar.js — «Cambiar la tarea» y «Cambiar el hito» (fila 531,
   docs/531-TAREAS-E-HITOS-COMUNES.md, punto 7).

   Una ventana propia (nunca un `U.preguntar`: también sale desde el editor de
   la guía, que ya es uno) con el nombre (y la plantilla, en una tarea de
   generar o comunicar; la explicación, en un hito) y un aviso, antes de
   guardar, de en qué tipos se usa: «Cambiará en todos. Los otros asuntos
   abiertos siguen como están.»

   Al guardar: la lista común (principal: si falla, rojo) → los asuntos
   abiertos de esos tipos se quedan como estaban (js/comunes-guardado.js ›
   fijarEnAbiertos) → las guías de esos tipos con el retrato nuevo (sin
   repartirlo a los abiertos). Si algo de lo último falla, ámbar.

   ComunesCambiar.tarea(t, { claveActual, tipoEnEdicion, alCambiar(nueva) })
   ComunesCambiar.hito(h, { claveActual, tipoEnEdicion, alCambiar(nuevo), asunto, hitoDelAsunto })
   `tipoEnEdicion`: el tipo cuya guía está abierta en el editor (se cambia en
   memoria, con `alCambiar`; su guía en disco la guarda el propio editor).
   ============================================================ */
var ComunesCambiar = (function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function ventana(titulo, cuerpo, alGuardar) {
    var capa = document.createElement('div');
    capa.className = 'capa capa-campos';
    capa.innerHTML = '<div class="cuadro" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '" style="max-width:560px;width:100%">' +
      '<h3>' + esc(titulo) + '</h3><div id="cc-cuerpo" style="overflow:auto">' + cuerpo + '</div><div id="cc-err"></div>' +
      '<div class="cuadro-botones"><button type="button" class="boton" id="cc-cancelar">Cancelar</button> <button type="button" class="boton boton-principal" id="cc-guardar">Guardar</button></div></div>';
    document.body.appendChild(capa);
    function cerrar() { document.removeEventListener('keydown', tecla, true); if (capa.parentNode) capa.parentNode.removeChild(capa); }
    function tecla(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(); } }
    document.addEventListener('keydown', tecla, true);
    capa.querySelector('#cc-cancelar').onclick = cerrar;
    capa.querySelector('#cc-guardar').onclick = async function () {
      var b = capa.querySelector('#cc-guardar');
      b.disabled = true;
      var error = await alGuardar(capa);
      if (error) { b.disabled = false; capa.querySelector('#cc-err').innerHTML = '<div class="aviso aviso-ambar">' + esc(error) + '</div>'; return; }
      cerrar();
    };
    return capa;
  }

  function avisoUsos(que, tipos) {
    return '<div class="aviso aviso-ambar comunes-aviso-usos" id="cc-usos">' + que + ' ' + esc(Comunes.textoUsos(tipos)) +
      (tipos.length ? ': ' + esc(tipos.join(', ')) : '') + '. Cambiará en todos. Los otros asuntos abiertos siguen como están.</div>';
  }

  async function datos() {
    var listas = await ComunesGuardado.leer();
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con las guías que hay */ }
    return { listas: listas, guias: GuiasDelCentro.todas() };
  }

  /* El camino común de guardar: lista → asuntos abiertos → guías. `r`: lo que devuelve Comunes.cambiar…EnGuias; `antes`: para fijar. */
  async function repartir(r, o) {
    try {
      if (r.antes) await ComunesGuardado.fijarEnAbiertos(r.antes, o.claveActual);
      var tipos = r.tipos.filter(function (t) { return t !== o.tipoEnEdicion; });
      await ComunesGuardado.repartirEnGuias(r.guias, tipos, o.claveActual);
    } catch (e) { U.accesorio('Está cambiado en la lista, pero no he podido ponerlo al día en todas las guías', e); }
  }

  async function tarea(t, o) {
    o = o || {};
    var d;
    try { d = await datos(); } catch (e) { U.fallo('No he podido leer la lista', e); return; }
    var uso = Comunes.usos(d.guias).tareas[t.id] || [];
    var conPlantilla = t.accion === 'generar' || t.accion === 'comunicar';
    var pls = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    var plantillas = pls ? ((t.accion === 'comunicar' ? pls.lista : pls.documentos) || []).filter(function (p) { return Plantillas.enUso(p) || p.id === (t.receta && t.receta.plantilla); }) : [];
    var actual = (t.receta && t.receta.plantilla) || '';
    var cuerpo = avisoUsos('Esta tarea', uso) +
      '<label class="et" for="cc-nombre">Nombre</label><input id="cc-nombre" class="campo" value="' + esc(t.nombre) + '">' +
      (conPlantilla ? '<label class="et" for="cc-pl">Plantilla</label><select id="cc-pl" class="campo"><option value="">Sin plantilla fija</option>' +
        plantillas.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === actual ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select>' : '') +
      (t.accion === 'copiar' && window.TareaCopiarEditor ? TareaCopiarEditor.formularioHTML(t.receta) : '');   /* fila 552 */
    var capa = ventana('Cambiar la tarea', cuerpo, async function (c) {
      var nombre = c.querySelector('#cc-nombre').value.trim();
      if (!nombre) return 'Ponle un nombre.';
      var pl = c.querySelector('#cc-pl'), nueva = JSON.parse(JSON.stringify(t));
      nueva.nombre = nombre;
      if (t.accion === 'copiar' && window.TareaCopiarEditor) {   /* fila 552 */
        var rc = TareaCopiarEditor.leer(c);
        if (!rc || !rc.carpeta) return 'Elige la carpeta de destino.';
        nueva.receta = rc;
      }
      if (pl) { var r0 = Object.assign({}, t.receta || {}); if (pl.value) r0.plantilla = pl.value; else delete r0.plantilla; nueva.receta = r0; }
      if (Comunes.existeIgual('tareas', d.listas.tareas, nueva, t.id)) return 'Ya hay otra tarea con ese nombre.';
      try { nueva = await ComunesGuardado.reemplazar('tareas', nueva); } catch (e) { U.fallo('No he podido guardar el cambio', e); return 'No se ha guardado.'; }
      await repartir(Comunes.cambiarTareaEnGuias(d.guias, nueva), o);
      if (o.alCambiar) o.alCambiar(nueva);
      U.aviso('Tarea cambiada' + (uso.length ? ' en ' + uso.length + (uso.length === 1 ? ' tipo.' : ' tipos.') : '.'), 'bueno');
      if (window.HitosPanel) HitosPanel.programarRepintado();
      return '';
    });
    if (t.accion === 'copiar' && window.TareaCopiarEditor) TareaCopiarEditor.enganchar(capa);   /* fila 552 */
    var n = capa.querySelector('#cc-nombre'); n.focus(); n.setSelectionRange(n.value.length, n.value.length);
  }

  async function hito(h, o) {
    o = o || {};
    var d;
    try { d = await datos(); } catch (e) { U.fallo('No he podido leer la lista', e); return; }
    var uso = Comunes.usos(d.guias).hitos[h.id] || [];
    var cuerpo = avisoUsos('Este hito', uso) +
      '<label class="et" for="cc-nombre">Nombre</label><input id="cc-nombre" class="campo" value="' + esc(h.nombre) + '">' +
      '<label class="et" for="cc-exp">Explicación</label><input id="cc-exp" class="campo" value="' + esc(h.explicacion) + '">';
    var capa = ventana('Cambiar el hito', cuerpo, async function (c) {
      var nombre = c.querySelector('#cc-nombre').value.trim();
      if (!nombre) return 'Ponle un nombre.';
      var nuevo = Object.assign({}, h, { nombre: nombre, explicacion: c.querySelector('#cc-exp').value.trim() });
      if (Comunes.existeIgual('hitos', d.listas.hitos, nuevo, h.id)) return 'Ya hay otro hito con ese nombre.';
      try { nuevo = await ComunesGuardado.reemplazar('hitos', nuevo); } catch (e) { U.fallo('No he podido guardar el cambio', e); return 'No se ha guardado.'; }
      await repartir(Comunes.cambiarHitoEnGuias(d.guias, nuevo), o);
      /* En este asunto el cambio se ve siempre; en los demás abiertos, los hitos siguen con su nombre de antes. */
      if (o.asunto && o.hitoDelAsunto) {
        try {
          await Hitos.cambiar(function (x) {
            var e = x.porAsunto[o.asunto], k = e && Hitos.buscar(e.hitos, o.hitoDelAsunto);
            if (k) { k.titulo = nuevo.nombre; k.cuerpo = window.Guias ? Guias.limpiar(nuevo.explicacion) : nuevo.explicacion; }
            return x;
          });
        } catch (e) { U.accesorio('Está cambiado en la lista, pero no he podido ponerlo al día en este asunto', e); }
      }
      if (o.alCambiar) o.alCambiar(nuevo);
      U.aviso('Hito cambiado' + (uso.length ? ' en ' + uso.length + (uso.length === 1 ? ' tipo.' : ' tipos.') : '.'), 'bueno');
      if (window.HitosPanel) HitosPanel.programarRepintado();
      return '';
    });
    var n = capa.querySelector('#cc-nombre'); n.focus(); n.setSelectionRange(n.value.length, n.value.length);
  }

  return { tarea: tarea, hito: hito };
})();
window.ComunesCambiar = ComunesCambiar;
