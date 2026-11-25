/* ============================================================
   ficha-campos-lista-vacia.js — en «Campos del asunto», un dato de lista
   que todavía no tiene valor sale con su desplegable «Elegir…», para
   rellenarlo ahí mismo (fila 592, docs/592-BAJA-MATRICULA.md; era el límite
   apuntado al cerrar la fila 576).

   - `fila(cfg, a)`: la fila para un campo del tipo que es de lista y está
     vacío; null si no lo es (o es de un hito: ese se rellena en su hito).
   - `filaHtml(f)`: la fila pintada (la llama js/ficha-asunto.js).
   - `alPintar(caja, a)`: engancha los desplegables tras pintar la ficha
     (lo llama `CampoDesdeElAsunto.alPintar`). Guarda con
     `DatosDelAsunto.guardar`, como cualquier otro dato.
   En un asunto que no está abierto (consulta, archivo) el desplegable sale
   apagado.

   Fila 738: un dato de lista que YA tiene valor sale con su valor y un
   «Cambiar» (solo en un asunto abierto) que lo vuelve el mismo desplegable,
   con el valor de ahora elegido. Al elegir otro se guarda al momento, se
   anota en el registro del asunto («<dato>: de <antes> a <ahora>») y la ficha
   se repinta: la lista de tareas se recalcula sola con el «Solo si» nuevo.
   ============================================================ */
var FichaCamposListaVacia = (function () {

  function fila(cfg, a, actual) {
    if (!cfg || cfg.hito || cfg.soloAqui || !window.Campos) return null;
    /* Fila 747: la persona elegida de «Una persona del asunto» sale con su «Cambiar»; las opciones se leen al pulsarlo. */
    if (actual && Campos.claseDeCampo(cfg, App.E.campos) === 'personaAsunto') {
      var np = Campos.nombreDeCampo(cfg, App.E.campos);
      return { titulo: np, valor: actual, elegir: { nombre: np, valores: [], persona: true } };
    }
    if (Campos.claseDeCampo(cfg, App.E.campos) !== 'lista') return null;
    var propio = cfg.origen === 'propio' ? Campos.propioDe(cfg.id, App.E.campos) : null;
    var valores = (propio && propio.valores) || [];
    if (!valores.length) return null;
    var nombre = Campos.nombreDeCampo(cfg, App.E.campos);
    return { titulo: nombre, valor: actual || '', elegir: { nombre: nombre, valores: valores.slice() } };
  }

  function abierto() {
    var N = window.FichaNucleo;
    return !N || N.modoActual === 'abierto';
  }

  function filaHtml(f) {
    if (f.valor) {   /* fila 738: con valor, su texto y «Cambiar» (solo si el asunto está abierto) */
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span class="ficha-dato-valor-lista">' + U.escapar(f.valor) +
        (abierto() ? ' <button type="button" class="boton boton-chico ficha-dato-cambiar" data-nombre="' + U.escapar(f.elegir.nombre) +
          '" data-valor="' + U.escapar(f.valor) + '" data-valores="' + U.escapar(JSON.stringify(f.elegir.valores)) + (f.elegir.persona ? '" data-persona="1' : '') +
          '" title="Cambiar «' + U.escapar(f.titulo) + '»">Cambiar</button>' : '') + '</span></div>';
    }
    return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span><span>' +
      '<select class="campo ficha-dato-elegir" data-nombre="' + U.escapar(f.elegir.nombre) + '"' + (abierto() ? '' : ' disabled') + '>' +
      '<option value="">Elegir…</option>' +
      f.elegir.valores.map(function (v) { return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>'; }).join('') +
      '</select></span></div>';
  }

  /* Fila 747: el «Cambiar» de la persona elegida de un campo «solo aquí» (las personas se leen al pulsarlo). */
  function cambiarPersonaHtml(f) {
    return abierto() ? ' <button type="button" class="boton boton-chico ficha-dato-cambiar" data-persona="1" data-nombre="' + U.escapar(f.titulo) +
      '" data-valor="' + U.escapar(f.valor) + '" data-valores="[]" title="Cambiar «' + U.escapar(f.titulo) + '»">Cambiar</button>' : '';
  }

  function alPintar(caja, a) {
    engancharCambiar(caja, a);
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-dato-elegir'), function (el) {
      el.onchange = async function () {
        if (el.dataset.guardando || !el.value) return;
        el.dataset.guardando = '1';
        var nombre = el.dataset.nombre;
        try {
          var r = await DatosDelAsunto.guardar(a, nombre, el.value);
          if (!r.ok) { U.aviso(r.aviso, 'ambar'); el.value = ''; return; }
          U.aviso('«' + nombre + '» guardado en el asunto.', 'bueno');
          if (window.DatosDelAsuntoVista) DatosDelAsuntoVista.alGuardarAlgo(a);
        } catch (e) { U.fallo('No he podido guardar «' + nombre + '»', e); el.value = ''; }
        finally { delete el.dataset.guardando; }
      };
    });
  }

  /* Fila 738: «Cambiar» pone el desplegable en el sitio del texto. Elegir lo mismo, o soltarlo sin elegir, lo deja como estaba. */
  function engancharCambiar(caja, a) {
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-dato-cambiar'), function (boton) {
      boton.onclick = async function () {
        var sitio = boton.parentNode, nombre = boton.dataset.nombre, antes = boton.dataset.valor, valores = [];
        try { valores = JSON.parse(boton.dataset.valores) || []; } catch (e) { valores = []; }
        var elegida = antes;   /* lo que lleva el desplegable cuando se abre */
        if (boton.dataset.persona && window.PersonaDelAsunto) {   /* fila 747: las personas del asunto, con su relación */
          try {
            var valoresAsunto = await Plantillas.valoresDeAsunto(a);
            var personas = PersonaDelAsunto.personas(a, valoresAsunto);
            valores = personas.map(PersonaDelAsunto.etiqueta);
            var actualP = personas.filter(function (p) { return U.normalizar(p.nombre) === U.normalizar(antes); })[0];
            if (actualP) elegida = PersonaDelAsunto.etiqueta(actualP);
          } catch (e0) { U.accesorio('No he podido leer las personas del asunto', e0); return; }
        }
        if (valores.indexOf(elegida) === -1) valores.unshift(elegida);
        var sel = document.createElement('select');
        sel.className = 'campo ficha-dato-elegir';
        sel.dataset.nombre = nombre;
        sel.innerHTML = valores.map(function (v) { return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>'; }).join('');
        sel.value = elegida;
        var vuelve = function () { sitio.textContent = ''; sitio.appendChild(document.createTextNode(antes + ' ')); sitio.appendChild(boton); };
        sitio.textContent = '';
        sitio.appendChild(sel);
        sel.onblur = function () { if (!sel.dataset.guardando && sel.parentNode === sitio) vuelve(); };
        sel.onchange = async function () {
          if (sel.dataset.guardando) return;
          if (!sel.value || sel.value === antes || sel.value === elegida) { sel.value = elegida; vuelve(); return; }
          sel.dataset.guardando = '1';
          var ahora = sel.value;
          try {
            var r = await DatosDelAsunto.guardar(a, nombre, ahora);
            if (!r.ok) { U.aviso(r.aviso, 'ambar'); sel.value = elegida; delete sel.dataset.guardando; vuelve(); return; }
            U.aviso('«' + nombre + '» guardado en el asunto.', 'bueno');
            var ahoraTexto = boton.dataset.persona ? (r.valor || ahora) : ahora;
            if (window.Notas) { try { await Notas.anadirAuto(a, nombre + ': de ' + antes + ' a ' + ahoraTexto); } catch (e2) { U.accesorio('Guardado, pero no he podido anotarlo en el registro', e2); } }
            if (window.DatosDelAsuntoVista) DatosDelAsuntoVista.alGuardarAlgo(a);
          } catch (e) { U.fallo('No he podido guardar «' + nombre + '»', e); sel.value = elegida; delete sel.dataset.guardando; vuelve(); }
        };
        sel.focus();
      };
    });
  }

  return { fila: fila, filaHtml: filaHtml, cambiarPersonaHtml: cambiarPersonaHtml, alPintar: alPintar, engancharCambiar: engancharCambiar };
})();
window.FichaCamposListaVacia = FichaCamposListaVacia;
