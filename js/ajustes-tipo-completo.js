/* ============================================================
   ajustes-tipo-completo.js — la lista de comprobación de arriba de la
   pantalla de un tipo (27-sep-2026, fila 198,
   docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md, apartado 1).

   Siempre visible, encima de las dos columnas de secciones
   (js/ajustes-tipo.js): una línea por cosa, marcada o vacía. Cada
   línea es un enlace que despliega la sección que toca (`AjustesPlegado.
   seccionDelTipo`, aquí repetido con un selector propio para no
   depender de un export nuevo). Si todo está marcado, se pliega sola
   en una línea verde.

   Se repinta sola: `js/ajustes-plegado.js` llama a `pintar(tipo)` al
   final de `resumirTipo()`, que ya se dispara al abrir la pantalla y
   tras cualquier cambio o clic dentro de ella (`alCambiar`). No hace
   falta ningún enganche propio. Para no entrar en bucle con ese mismo
   observador (que vigila mutaciones DENTRO de #pantalla-tipo-asunto,
   donde vive esta caja), `pintar` no toca el DOM si la lista sale
   igual que la última vez (una firma en `dataset.firma`).

   «Generar un documento» y «Comunicar» (la tarea, no la sección de
   Ajustes) son líneas del guion de un hito (`paso.guion`, fila 109,
   js/guias-guion.js): `accion === 'generar'` o `'comunicar'`, con la
   plantilla (si la tiene) en `receta.plantilla`. Se recorren también
   las preguntas (hitos y tareas) y las opciones, con el número del
   hito de arriba (1, 2…), nunca el de una sub-pregunta.
   ============================================================ */
(function () {

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* ---------- recorrer la guía entera (hitos, preguntas y sub-hitos) ---------- */

  function recorrerPasos(pasos, numeroDeArriba, visitar) {
    (pasos || []).forEach(function (p, i) {
      var numero = numeroDeArriba || (i + 1);
      visitar(p, numero);
      (p.opciones || []).forEach(function (o) { recorrerPasos(o.pasos, numero, visitar); });
    });
  }

  function tareasDelGuion(guion, numero, salida) {
    (guion || []).forEach(function (g) {
      if (g.pregunta) { (g.opciones || []).forEach(function (o) { tareasDelGuion(o.lineas, numero, salida); }); }
      else salida.push({ tarea: g, hito: numero });
    });
  }

  /* Todas las tareas del guion de la guía entera, cada una con el
     número del hito de arriba al que pertenece. */
  function tareasDeLaGuia(pasos) {
    var salida = [];
    recorrerPasos(pasos, null, function (p, numero) { tareasDelGuion(p.guion, numero, salida); });
    return salida;
  }

  /* «Avisar a quien lo pide», puesto en un hito concreto (fila 195). */
  function avisosDelHito(pasos) {
    var salida = [];
    recorrerPasos(pasos, null, function (p, numero) {
      if (p.avisarLoPide) salida.push({ plantilla: p.avisarLoPidePlantilla, hito: numero });
    });
    return salida;
  }

  /* ---------- «Nombre corto»: siempre marcado, salvo que el nombre
     efectivo (el corto, o si no hay, el de arriba) dé problema: muy
     largo o repetido con otro tipo. Mismo criterio que el aviso en
     vivo de "Datos del tipo". ---------- */
  function nombreCortoProblema(tipo) {
    var texto = U.limpiarNombre(tipo.nombreCorto || tipo.tipo).toUpperCase();
    if (!texto) return false;
    if (texto.length > 16) return true;
    var otros = (App.E.tipos || []).filter(function (t) { return t !== tipo; })
      .map(function (t) { return U.limpiarNombre(t.nombreCorto || t.tipo).toUpperCase(); });
    return otros.some(function (o) { return U.normalizar(o) === U.normalizar(texto); });
  }

  /* ---------- la lista entera, para un tipo ---------- */

  function construirLista(tipo) {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo.tipo)) || [];
    var tareas = tareasDeLaGuia(pasos);
    var avisos = avisosDelHito(pasos);
    var deGenerar = tareas.filter(function (t) { return t.tarea.accion === 'generar'; });
    var deComunicar = tareas.filter(function (t) { return t.tarea.accion === 'comunicar'; });

    var lista = [];
    lista.push({ id: 'datos', titulo: 'Nombre corto', ok: !nombreCortoProblema(tipo) });
    lista.push({ id: 'datos', titulo: 'Quién lo encarga', ok: !!tipo.organo });
    lista.push({ id: 'pasos', titulo: 'Guía (' + plural(pasos.length, 'hito', 'hitos') + ')', ok: pasos.length > 0 });

    if (deGenerar.length) {
      var faltaDoc = deGenerar.filter(function (t) { return !(t.tarea.receta && t.tarea.receta.plantilla); })[0];
      lista.push({
        id: 'word', titulo: 'Plantilla de documento', ok: !faltaDoc,
        detalle: faltaDoc ? ('el hito ' + faltaDoc.hito + ' la necesita') : ''
      });
    }

    var avisoDeCierre = tipo.avisarLoPideCierre;
    if (deComunicar.length || avisos.length || avisoDeCierre) {
      var faltaComunicar = deComunicar.filter(function (t) { return !(t.tarea.receta && t.tarea.receta.plantilla); })[0];
      var faltaAviso = avisos.filter(function (a) { return !a.plantilla; })[0];
      var faltaCierre = avisoDeCierre && !tipo.avisarLoPideCierrePlantilla;
      var falta = faltaComunicar || faltaAviso;
      lista.push({
        id: 'correo', titulo: 'Plantilla de correo', ok: !falta && !faltaCierre,
        detalle: falta ? ('el hito ' + falta.hito + ' la necesita')
          : (faltaCierre ? 'al cerrar el asunto la necesita' : '')
      });
    }

    lista.push({ id: 'plazo', titulo: 'Plazo', ok: !!tipo.plazo });
    lista.push({ id: 'palabras', titulo: 'Palabras clave', ok: !!(tipo.palabrasClave && tipo.palabrasClave.length) });
    lista.push({ id: 'datos', titulo: 'Plazo de conservación', ok: !!tipo.conservarAnios });
    return lista;
  }

  /* ---------- abrir la sección que toca una línea ---------- */

  function abrirSeccion(id) {
    var det = document.querySelector('#pantalla-tipo-asunto details[data-seccion="' + id + '"]');
    if (!det) return;
    det.open = true;
    if (det.scrollIntoView) det.scrollIntoView({ block: 'center' });
  }

  /* ---------- pintar ---------- */

  function pintar(tipo) {
    var caja = document.getElementById('tipo-asunto-checklist');
    if (!caja || !tipo) return;
    var lista = construirLista(tipo);
    var firma = JSON.stringify(lista);
    if (caja.dataset.firma === firma) return;   /* nada ha cambiado: no tocar el DOM (ver cabecera) */
    caja.dataset.firma = firma;

    var faltan = lista.filter(function (x) { return !x.ok; });
    if (!faltan.length) {
      caja.innerHTML = '<div class="tipo-asunto-checklist-completo">✓ Este tipo está completo</div>';
      return;
    }

    caja.innerHTML = '<div class="tipo-asunto-checklist-lista"></div>';
    var cont = caja.querySelector('.tipo-asunto-checklist-lista');
    lista.forEach(function (item) {
      var fila = document.createElement('button');
      fila.type = 'button';
      fila.className = 'tipo-asunto-checklist-item' + (item.ok ? ' hecho' : '');
      fila.innerHTML = '<span class="tipo-asunto-checklist-marca">' + (item.ok ? '☑' : '☐') + '</span>' +
        ' <span>' + U.escapar(item.titulo) + (item.detalle ? ' — ' + U.escapar(item.detalle) : '') + '</span>';
      fila.onclick = function () { abrirSeccion(item.id); };
      cont.appendChild(fila);
    });
  }

  window.AjustesTipoCompleto = { pintar: pintar, construirLista: construirLista };
})();
