/* ============================================================
   generar-enviar-cabecera.js — «Generar documento ▾» y «Enviar ▾» en la cabecera del asunto
   (17-nov-2026, fila 695, docs/695-GENERAR-Y-ENVIAR-SIN-TAREA.md).

   Siempre a la vista, junto al botón del teléfono, tenga el asunto hitos o no. No piden ni crean ninguna tarea
   ni ningún hito, y no marcan nada solos: se genera con `PlantillasDocumento.generar(a, p, 'abierto', {})` (sin `hito`
   ni `idPasoGuion`) y se envía con el cuadro de siempre (`CorreoNucleo.abrirCuadro`, sin `comunicarHito`, para que
   js/correo-rastro.js no marque ninguna tarea). Con «solo consultar» no salen. La llama js/ficha-asunto.js.
   ============================================================ */
var GenerarEnviarCabecera = (function () {

  var turno = 0;

  function consulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }

  function boton(texto, clase) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ' + clase;
    b.textContent = texto;
    return b;
  }

  async function generar(a, p, b) {
    try {
      await U.mientrasGuarda(b, function () { return PlantillasDocumento.generar(a, p, 'abierto', {}); });
    } catch (e) { U.fallo('No he podido generar el documento', e); }
  }

  /* «Otra plantilla…» (fila 697): todas las plantillas de documento del centro que están en uso, con el buscador de
     siempre (js/plantilla-buscar.js), en el cuadro compartido #capa. Generar con una de otro tipo no la asocia a este. */
  function otraPlantilla(a, b, hacer) {
    var capa = document.getElementById('capa');
    if (!capa || !window.PlantillaBuscar || !capa.classList.contains('oculto')) return;   /* un solo cuadro a la vez */
    var aceptar = document.getElementById('cuadro-aceptar');
    document.getElementById('cuadro-titulo').textContent = 'Otra plantilla';
    document.getElementById('cuadro-cuerpo').innerHTML = '<p class="explica">Busca entre todas las plantillas del centro.</p><div id="pd-otra-caja" class="pd-buscar-caja"></div>';
    aceptar.classList.add('oculto');
    var cancelar = document.getElementById('cuadro-cancelar');
    cancelar.textContent = 'Cancelar';
    cancelar.classList.remove('oculto');   /* un cuadro anterior sin «Cancelar» lo deja escondido */
    capa.classList.remove('oculto');
    function cerrar() {
      capa.classList.add('oculto');
      aceptar.classList.remove('oculto');
      document.getElementById('cuadro-cancelar').onclick = null;
    }
    document.getElementById('cuadro-cancelar').onclick = cerrar;
    PlantillaBuscar.montar(document.getElementById('pd-otra-caja'), function (p) { cerrar(); (hacer || generar)(a, p, b); });
  }

  /* «+ Nueva plantilla…» (fila 697): el editor de plantillas de documento de siempre, con el tipo del asunto. Al
     guardar, el menú se vuelve a montar y la nueva sale entre las del tipo. */
  function nuevaPlantilla(a, b, alGuardar) {
    var tipo = PlantillasDocumento.tipoDelAsunto ? PlantillasDocumento.tipoDelAsunto(a) : '';
    var preset = ((window.App && App.E && App.E.tipos) || []).filter(function (t) { return t.tipo === tipo; })[0] || null;
    PlantillasDocumento.abrirCuadroDePlantillaDoc(null, preset, function () {
      if (window.Plantillas && Plantillas.olvidar) Plantillas.olvidar();
      if (alGuardar) alGuardar();   /* fila 703: la tarea de papel vuelve a pintar su botón */
      else if (b.isConnected) montarGenerar(a, b, ++turno);
    }).catch(function (e) { U.fallo('No he podido abrir el editor de plantillas', e); });
  }

  /* El menú de plantillas se monta cuando están leídas; si el asunto ya no es el de la ficha, no se toca nada.
     Siempre lleva, tras las del tipo, «Otra plantilla…» y «+ Nueva plantilla…» (fila 697). */
  async function montarGenerar(a, b, mio) {
    var lista = [];
    try { lista = await PlantillasDocumento.plantillasDelAsunto(a); } catch (e) { lista = []; }
    if (mio !== turno || !b.isConnected) return;
    var opciones = lista.map(function (p) {
      return { texto: p.nombre, alPulsar: function () { generar(a, p, b); } };
    });
    opciones.push({ texto: 'Otra plantilla…', alPulsar: function () { otraPlantilla(a, b); } });
    opciones.push({ texto: '+ Nueva plantilla…', alPulsar: function () { nuevaPlantilla(a, b); } });
    var viejo = b.parentNode;   /* al volver a montar (tras «+ Nueva plantilla…») se quita el menú anterior */
    if (viejo && viejo.classList && viejo.classList.contains('ficha-menu-envoltorio')) {
      viejo.parentNode.insertBefore(b, viejo);
      viejo.parentNode.removeChild(viejo);
    }
    FichaMenus.montar(b, opciones);
  }

  function montarEnviar(a, b) {
    FichaMenus.montar(b, [
      { texto: 'Correo', alPulsar: function () { CorreoNucleo.abrirCuadro(a, false, {}); } },
      { texto: 'Séneca', alPulsar: function () { CorreoNucleo.abrirCuadro(a, true, {}); } }
    ]);
  }

  /* Pone los dos botones dentro de `sitio`. Con «solo consultar» no pone nada. */
  function pintar(sitio, a) {
    if (!sitio || !a || consulta()) return;
    var mio = ++turno;
    var g = boton('Generar documento ▾', 'ficha-generar-cab');
    var e = boton('Enviar ▾', 'ficha-enviar-cab');
    sitio.appendChild(g);
    sitio.appendChild(e);
    if (window.FichaMenus && window.PlantillasDocumento) montarGenerar(a, g, mio);
    if (window.FichaMenus && window.CorreoNucleo) montarEnviar(a, e);
  }

  return { pintar: pintar, otraPlantilla: otraPlantilla, nuevaPlantilla: nuevaPlantilla };
})();
window.GenerarEnviarCabecera = GenerarEnviarCabecera;
