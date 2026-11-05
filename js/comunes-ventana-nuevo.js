/* ============================================================
   comunes-ventana-nuevo.js — crear una tarea o un hito nuevos dentro de la
   ventana de la lista común (fila 531, punto 5; trozo de
   js/comunes-ventana.js, que se carga antes).

   Tarea nueva: nombre y lo que hace; si genera o comunica, su plantilla,
   que puede ser nueva con el editor de plantillas de siempre (la ventana se
   cierra mientras se escribe y vuelve con la plantilla ya elegida). Hito
   nuevo: nombre, explicación y tareas de la lista. Al escribir el nombre
   salen las parecidas, para no duplicar. «Crear y añadir» guarda en la lista
   común y llama a `elegir`.
   ============================================================ */
(function () {

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function plantillasDe(accion) {
    var d = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    var lista = d ? (accion === 'comunicar' ? d.lista : d.documentos) || [] : [];
    return lista.filter(function (p) { return !window.Plantillas || Plantillas.enUso(p); });
  }

  function parecidasHTML(par) {
    return par.length ? '<div class="aviso aviso-ambar">¿Es alguna de estas? <span class="en-linea" style="margin-top:4px">' +
      par.map(function (x) { return '<button type="button" class="campos-pastilla" data-par="' + esc(x.id) + '">' + esc(x.nombre) + '</button>'; }).join('') + '</span></div>' : '';
  }

  /* Abre el editor de plantillas de siempre; al guardar, vuelve la ventana con la plantilla nueva elegida. */
  function plantillaNueva(c) {
    var n = c.st.nuevo, antes = plantillasDe(n.accion).map(function (p) { return p.id; });
    var tipoObj = c.tipo ? ((window.App && App.E && App.E.tipos) || []).filter(function (x) { return U.normalizar(x.tipo || '') === U.normalizar(c.tipo); })[0] || null : null;
    async function alGuardar() {
      try { await Plantillas.cargar(App.E.gestor); } catch (e) { /* se vuelve con lo que haya */ }
      var nueva = plantillasDe(n.accion).filter(function (p) { return antes.indexOf(p.id) === -1; })[0];
      if (nueva) n.plantilla = nueva.id;
      c.reabrir();
    }
    c.cerrar();
    if (n.accion === 'comunicar') PlantillasAjustes.abrirCuadroDePlantilla(null, tipoObj, alGuardar);
    else PlantillasDocumento.abrirCuadroDePlantillaDoc(null, tipoObj, alGuardar);
  }

  function formularioTarea(n) {
    var conPlantilla = n.accion === 'generar' || n.accion === 'comunicar';
    return '<div class="mitad"><div><label class="et" for="cn-hace">Qué hace</label><select id="cn-hace" class="campo">' +
      Comunes.HACE.map(function (h) { return '<option value="' + esc(h.valor) + '"' + (h.valor === n.accion ? ' selected' : '') + '>' + esc(h.texto) + '</option>'; }).join('') + '</select></div>' +
      (conPlantilla ? '<div><label class="et" for="cn-pl">Plantilla</label><select id="cn-pl" class="campo"><option value="">Sin plantilla fija</option>' +
        plantillasDe(n.accion).map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === n.plantilla ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') +
        '<option value="__nueva">Plantilla nueva…</option></select></div>' : '') + '</div>';
  }

  function formularioHito(n, listas) {
    return '<div><label class="et" for="cn-exp">Explicación</label><input id="cn-exp" class="campo" value="' + esc(n.explicacion) + '"></div>' +
      '<div><strong class="pequeno">Tareas del hito</strong>' +
      (n.tareas.length ? '<ul class="lista-usos">' + n.tareas.map(function (id, j) {
        var t = Comunes.buscar(listas.tareas, id);
        return '<li>' + esc(t ? t.nombre : id) + ' <button type="button" class="boton boton-chico" data-qt="' + j + '">Quitar</button></li>';
      }).join('') + '</ul>' : '<p class="suave pequeno" style="margin:4px 0">Ninguna todavía.</p>') +
      '<label class="et" for="cn-at" style="margin-top:6px">Añadir una tarea de la lista</label><select id="cn-at" class="campo"><option value="">Elige una tarea</option>' +
      listas.tareas.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.nombre) + '</option>'; }).join('') + '</select></div>';
  }

  /* `c`: { clase, st, listas, tipo, volver(), elegir(x), reabrir(), cerrar() } (js/comunes-ventana.js). */
  function pintarNuevo(caja, c) {
    var tarea = c.clase === 'tarea', n = c.st.nuevo, lista = tarea ? c.listas.tareas : c.listas.hitos;
    caja.innerHTML = '<div class="panel" style="border:0;padding:4px"><h4 style="margin:0 0 6px">' + (tarea ? 'Tarea nueva' : 'Hito nuevo') + '</h4>' +
      '<div><label class="et" for="cn-nombre">Nombre</label><input id="cn-nombre" class="campo" value="' + esc(n.nombre) + '" autocomplete="off"></div>' +
      '<div id="cn-par">' + parecidasHTML(Comunes.parecidas(n.nombre, lista)) + '</div>' +
      (tarea ? formularioTarea(n) : formularioHito(n, c.listas)) +
      '<div id="cn-err"></div><div class="en-linea" style="margin-top:8px"><button type="button" class="boton boton-principal" id="cn-crear">Crear y añadir</button> <button type="button" class="boton" id="cn-volver">Volver</button></div></div>';

    function repintarParecidas() {
      var p = caja.querySelector('#cn-par');
      if (p) { p.innerHTML = parecidasHTML(Comunes.parecidas(n.nombre, lista)); enganchaParecidas(); }
    }
    function enganchaParecidas() {
      Array.prototype.forEach.call(caja.querySelectorAll('[data-par]'), function (b) {
        b.onclick = function () { c.elegir(Comunes.buscar(lista, b.getAttribute('data-par'))); };
      });
    }
    enganchaParecidas();
    var nombre = caja.querySelector('#cn-nombre');
    nombre.oninput = function () { n.nombre = nombre.value; repintarParecidas(); };
    nombre.focus(); nombre.setSelectionRange(nombre.value.length, nombre.value.length);
    caja.querySelector('#cn-volver').onclick = c.volver;

    if (tarea) {
      caja.querySelector('#cn-hace').onchange = function (ev) { n.accion = ev.target.value; n.plantilla = ''; pintarNuevo(caja, c); };
      var pl = caja.querySelector('#cn-pl');
      if (pl) pl.onchange = function () {
        if (pl.value === '__nueva') { plantillaNueva(c); return; }
        n.plantilla = pl.value;
      };
    } else {
      var exp = caja.querySelector('#cn-exp');
      exp.oninput = function () { n.explicacion = exp.value; };
      caja.querySelector('#cn-at').onchange = function (ev) {
        if (ev.target.value) { n.tareas.push(ev.target.value); pintarNuevo(caja, c); }
      };
      Array.prototype.forEach.call(caja.querySelectorAll('[data-qt]'), function (b) {
        b.onclick = function () { n.tareas.splice(+b.getAttribute('data-qt'), 1); pintarNuevo(caja, c); };
      });
    }

    caja.querySelector('#cn-crear').onclick = async function () {
      var texto = String(n.nombre || '').trim();
      var error = !texto ? 'Ponle un nombre.' : Comunes.existeNombre(lista, texto) ? 'Ya existe con ese nombre.' : '';
      if (error) { caja.querySelector('#cn-err').innerHTML = '<div class="aviso aviso-ambar">' + esc(error) + '</div>'; return; }
      var boton = caja.querySelector('#cn-crear');
      boton.disabled = true;
      try {
        var elemento = tarea
          ? { nombre: texto, accion: n.accion, receta: n.plantilla ? { plantilla: n.plantilla } : null }
          : { nombre: texto, explicacion: n.explicacion, tareas: n.tareas };
        var guardado = await ComunesGuardado.anadir(tarea ? 'tareas' : 'hitos', elemento);
        c.elegir(guardado);
      } catch (e) { boton.disabled = false; U.fallo('No he podido crearla', e); }
    };
  }

  window.ComunesVentana.pintarNuevo = pintarNuevo;
})();
