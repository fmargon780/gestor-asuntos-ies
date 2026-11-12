/* ============================================================
   plantillas-ajustes-editor.js — el editor de plantilla en línea, dentro del cuadro de Correo o de Séneca.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/plantillas-ajustes.js sin cambiar nada de lo que se ve; el código
   es el de siempre, movido tal cual).

   Se carga DESPUÉS de js/plantillas-ajustes.js: le cuelga `PlantillasAjustes.montarEditorEnLinea` y usa lo suyo
   (`PlantillasAjustes._interno`).
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var P = window.PlantillasAjustes;
  var cargar = P.cargar;
  var campoDeTextoHTML = P.campoDeTextoHTML;
  var engancharCampoDeTexto = P.engancharCampoDeTexto;
  var campoSenecaHTML = P._interno.campoSenecaHTML;
  var filaDePlantilla = P._interno.filaDePlantilla;
  var campoAsuntoHTML = P._interno.campoAsuntoHTML;
  var engancharAsunto = P._interno.engancharAsunto;

  /* ---------- el editor en línea, dentro del cuadro de Correo o de
     Séneca (25-sep-2026, fila 151, docs/PLANTILLA-DESDE-EL-CUADRO.md)

     A diferencia de `abrirCuadroDePlantilla`, no abre un `U.preguntar`
     (solo hay una capa de diálogo, y ya la está usando el cuadro de
     Correo o de Séneca): se monta dentro de `contenedor`, un bloque
     hermano del formulario del cuadro, que ese mismo fichero esconde y
     vuelve a enseñar. El tipo y la categoría son los del asunto abierto,
     no se preguntan. Reutiliza `campoDeTextoHTML`/`engancharCampoDeTexto`
     (el mismo "Insertar hueco" de arriba); la vista previa usa los datos
     reales del asunto en el que se está, con `Plantillas.valoresDeAsunto`. */

  /* `inicial` (fila 270, js/plantilla-de-lo-escrito.js): { texto, cambios } de
     «Guardar como plantilla nueva»: el texto de partida, la lista de datos
     cambiados por su hueco y la nota de que el saludo y la firma no entran. */
  function cuerpoEditorEnLineaHTML(existente, inicial) {
    return '<label class="etiqueta" style="margin-top:0">Nombre de la plantilla</label>' +
      '<input id="pl2-nombre" class="campo" value="' + U.escapar((existente && existente.nombre) || '') + '">' +
      campoAsuntoHTML('pl2-asunto', existente) +
      (window.PlantillaPapeles ? PlantillaPapeles.antesDelTextoHTML('pl2', existente) : '') +
      campoDeTextoHTML('pl2-texto', 'pl2-insertar-hueco', 'Texto', inicial ? inicial.texto : ((existente && existente.texto) || ''), 6) +
      (window.PlantillaPapeles ? PlantillaPapeles.despuesDelTextoHTML('pl2', existente) : '') +
      (inicial ? '<div id="pl2-cambios"></div>' : '') +
      campoSenecaHTML('pl2', existente && existente.textoSeneca) +
      (window.PlantillaAdjuntar ? PlantillaAdjuntar.selectHTML('pl2-adjuntar', existente && existente.adjuntar) : '') +
      '<label class="etiqueta">Vista previa</label>' +
      '<div class="vista-previa"><div class="vista-nombre" id="pl2-previa"></div></div>' +
      '<div id="pl2-aviso"></div>' +
      '<div class="correo-botones" style="margin-top:14px">' +
        '<button type="button" class="boton boton-principal" id="pl2-guardar">Guardar</button>' +
        '<button type="button" class="boton" id="pl2-cancelar">Cancelar</button>' +
      '</div>';
  }

  /* `a`: el asunto abierto (de ahí salen el tipo, la categoría y los
     datos de la vista previa). `existente`: la plantilla a editar, o
     `null` para crear una nueva. `alGuardar(plantillaGuardada)` se
     llama al terminar bien; `alCancelar()`, al pulsar Cancelar. */
  /* La lista «He cambiado estos datos por su hueco» (fila 270): una línea por
     cambio, con «Deshacer» (devuelve el dato en todos los sitios de ese hueco);
     pulsar la línea deja seleccionado el hueco en el texto; si el hueco desaparece
     del texto a mano, su línea desaparece sola. Devuelve el manejador de `input`
     del texto. */
  function montarCambios(cambios, alCambiar) {
    var caja = $('pl2-cambios');
    var vivos = (cambios || []).slice();
    function pintar() {
      if (!caja) return;
      if (!vivos.length) { caja.innerHTML = ''; return; }
      caja.innerHTML = '<p class="nota">He cambiado estos datos por su campo variable. Revísalos:</p>';
      vivos.forEach(function (c) {
        var fila = document.createElement('div');
        fila.className = 'pl2-cambio';
        fila.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer';
        var t = document.createElement('span');
        t.textContent = c.dato + ' → ' + c.hueco;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'boton boton-chico'; b.textContent = 'Deshacer';
        b.onclick = function (ev) {
          ev.stopPropagation();
          var campo = $('pl2-texto');
          campo.value = campo.value.split(c.hueco).join(c.dato);
          vivos = vivos.filter(function (x) { return x !== c; });
          pintar();
          alCambiar();
        };
        fila.onclick = function () {
          var campo = $('pl2-texto');
          var i = campo.value.indexOf(c.hueco);
          if (i === -1) return;
          campo.focus();
          campo.setSelectionRange(i, i + c.hueco.length);
        };
        fila.appendChild(t); fila.appendChild(b);
        caja.appendChild(fila);
      });
    }
    pintar();
    return function () {
      var texto = $('pl2-texto').value;
      var antes = vivos.length;
      vivos = vivos.filter(function (c) { return texto.indexOf(c.hueco) !== -1; });
      if (vivos.length !== antes) pintar();
      alCambiar();
    };
  }

  function montarEditorEnLinea(contenedor, a, existente, alGuardar, alCancelar, inicial) {
    contenedor.innerHTML = cuerpoEditorEnLineaHTML(existente, inicial);
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
    function tipoDelAsunto() { return tipo; }
    /* Fila 627: «Así sale» con los datos reales del asunto en el que se está (si tiene número del asunto). */
    engancharAsunto('pl2-asunto', tipoDelAsunto, function () {
      var v = window.CorreoNucleo && CorreoNucleo.valoresDelCuadro ? CorreoNucleo.valoresDelCuadro() : null;
      return v && v['numero del asunto'] ? v : null;
    });
    engancharCampoDeTexto('pl2-texto', 'pl2-insertar-hueco', window.PlantillaPapeles ? PlantillaPapeles.camposDeTexto('pl2') : [], tipoDelAsunto);
    if (window.PlantillaPapeles) PlantillaPapeles.enganchar('pl2');
    engancharCampoDeTexto('pl2-texto-seneca', 'pl2-insertar-hueco-seneca', [], tipoDelAsunto);

    /* Con el cuadro abierto desde un hito, la vista previa lleva también el hito (fila 270). */
    var hitoDelCuadro = (window.CorreoNucleo && CorreoNucleo._interno && CorreoNucleo._interno.hitoActual) || undefined;
    function pintarPrevia() {
      Plantillas.valoresDeAsunto(a, hitoDelCuadro ? { hito: hitoDelCuadro } : undefined).then(function (valores) {
        var r = Plantillas.rellenar($('pl2-texto').value, valores || {});
        if ($('pl2-previa')) $('pl2-previa').textContent = r.texto || '(vacío)';
      }).catch(function () { if ($('pl2-previa')) $('pl2-previa').textContent = '(vacío)'; });
    }
    var alCambiarTexto = pintarPrevia;
    if (inicial) alCambiarTexto = montarCambios(inicial.cambios, pintarPrevia);
    $('pl2-texto').oninput = alCambiarTexto;
    pintarPrevia();
    if (inicial) $('pl2-nombre').focus();

    $('pl2-cancelar').onclick = function () { if (typeof alCancelar === 'function') alCancelar(); };
    $('pl2-guardar').onclick = async function () {
      var nombre = $('pl2-nombre').value.trim();
      var texto = $('pl2-texto').value;
      var textoSeneca = $('pl2-texto-seneca') ? $('pl2-texto-seneca').value : '';
      var asunto2 = $('pl2-asunto') ? $('pl2-asunto').value : '';
      var adjuntar2 = window.PlantillaAdjuntar ? PlantillaAdjuntar.leer('pl2-adjuntar') : '';
      var papeles2 = window.PlantillaPapeles ? PlantillaPapeles.leer('pl2') : null;
      if (!nombre || !texto.trim()) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">Hace falta el nombre y el texto.</p>';
        return;
      }
      /* Fila 270: no dos plantillas con el mismo nombre en un tipo de asunto. */
      var yaEsta = ((Plantillas.enMemoria() || {}).lista || []).some(function (x) {
        return (!existente || x.id !== existente.id) && x.categoria === categoria &&
          U.normalizar(x.tipo || '') === U.normalizar(tipo) && U.normalizar(x.nombre || '') === U.normalizar(nombre);
      });
      if (yaEsta) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">Ya hay una plantilla con ese nombre en este tipo de asunto.</p>';
        return;
      }
      try {
        var guardada = null;
        await Plantillas.guardar(App.E.gestor, function (actual) {
          if (existente) {
            var i = actual.lista.findIndex(function (x) { return x.id === existente.id; });
            if (i !== -1) {
              actual.lista[i] = filaDePlantilla(existente.id, tipo, categoria, nombre, texto, textoSeneca, adjuntar2, actual.lista[i], papeles2, asunto2);
              guardada = actual.lista[i];
            }
          } else {
            guardada = filaDePlantilla(Plantillas.idNuevo(), tipo, categoria, nombre, texto, textoSeneca, adjuntar2, null, papeles2, asunto2);
            actual.lista.push(guardada);
          }
          return actual;
        });
        await cargar();
        if (typeof alGuardar === 'function') alGuardar(guardada);
      } catch (e) {
        $('pl2-aviso').innerHTML = '<p class="aviso aviso-rojo">No he podido guardarlo: ' + U.escapar(U.mensajeDeError(e)) + '</p>';
      }
    };
  }

  /* Fila 151: el editor de plantilla dentro del cuadro de Correo o de Séneca, sin U.preguntar. */
  P.montarEditorEnLinea = montarEditorEnLinea;

})();
