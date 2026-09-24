/* ============================================================
   plantillas-centro.js — el botón «Cargar las plantillas del centro»
   (fila 83; sacado de js/plantillas-documento.js en la fila 126,
   docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md, que además hace que no duplique).
   ============================================================ */
(function () {

  function carpetaDePlantillas() {
    return Carpetas.crear(App.E.gestor, 'PLANTILLAS');
  }

  /* ==========================================================
     "CARGAR LAS PLANTILLAS DEL CENTRO" (20-sep-2026, fila 83,
     docs/PLANTILLAS-DEL-CENTRO.md)

     Lee `plantillas/indice.json` del propio sitio web, descarga cada
     `.docx` de documento y lo escribe en `_GESTOR/PLANTILLAS`, y da de
     alta la fila que le toque en `plantillas.json` (`documentos` para
     las de documento, `lista` para las de correo, con su `texto` ya
     como cuerpo). Fusiona y no pisa: si ya hay una con el mismo
     `nombre` y `tipo`, se deja como está. Mismo patrón que "Cargar la
     biblioteca del centro" (fila 80, js/cargar-biblioteca.js).
     ========================================================== */

  var URL_INDICE_PLANTILLAS = 'plantillas/indice.json';

  async function cargarPlantillasDelCentro() {
    var indice = await App.leerFicheroDeLaApp(URL_INDICE_PLANTILLAS, 'json');

    var actual = await Plantillas.cargar(App.E.gestor);
    var yaDocumento = {};
    (actual.documentos || []).forEach(function (p) { yaDocumento[p.tipo + '|' + p.nombre] = true; });
    var yaCorreo = {};
    (actual.lista || []).forEach(function (p) { yaCorreo[p.tipo + '|' + p.nombre] = true; });

    var nuevosDocumentos = [], nuevosCorreo = [], retipar = [];
    var documentosYaEstaban = 0, correoYaEstaban = 0;

    for (var i = 0; i < indice.length; i++) {
      var e = indice[i];
      var clave = e.tipo + '|' + e.nombre;

      if (e.clase === 'documento') {
        if (yaDocumento[clave]) { documentosYaEstaban++; continue; }
        /* Fila 126: la misma plantilla (nombre y fichero) colgada de otro
           tipo no se duplica: se pasa al tipo del índice, salvo que ese
           tipo sea el mismo con otro nombre (corto o de antes). */
        var gemela = (actual.documentos || []).filter(function (p) {
          return U.normalizar(p.nombre) === U.normalizar(e.nombre) && p.fichero === e.fichero;
        })[0];
        if (gemela) {
          var mismoTipo = window.TiposNombre && TiposNombre.nombresDe(e.tipo).indexOf(U.normalizar(gemela.tipo || '')) !== -1;
          if (!mismoTipo) retipar.push({ id: gemela.id, tipo: e.tipo, categoria: e.categoria });
          documentosYaEstaban++;
          continue;
        }
        var bytes;
        try { bytes = await App.leerFicheroDeLaApp('plantillas/' + e.fichero, 'binario'); }
        catch (err) { continue; }   /* no debería pasar; se salta sin romper las demás */
        var carpeta = await carpetaDePlantillas();
        await Carpetas.escribirBytes(carpeta, e.fichero, bytes);
        /* Un `id` fijo del índice (fila 124) se respeta si nadie lo usa ya:
           así lo puede citar un paso de la biblioteca del centro. */
        var idFijo = e.id && !(actual.documentos || []).some(function (p) { return p.id === e.id; }) ? e.id : '';
        nuevosDocumentos.push({
          id: idFijo || Plantillas.idNuevoDocumento(), tipo: e.tipo, categoria: e.categoria, nombre: e.nombre,
          fichero: e.fichero, tipoDocumento: e.tipoDocumento, texto: e.texto || '',
          firmante: e.firmante || '', vistoBueno: e.vistoBueno || ''
        });
      } else {
        if (yaCorreo[clave]) { correoYaEstaban++; continue; }
        nuevosCorreo.push({
          id: Plantillas.idNuevo(), tipo: e.tipo, categoria: e.categoria, nombre: e.nombre,
          texto: e.cuerpo || ''
        });
      }
    }

    if (nuevosDocumentos.length || nuevosCorreo.length || retipar.length) {
      await Plantillas.guardar(App.E.gestor, function (a) {
        retipar.forEach(function (x) {
          (a.documentos || []).forEach(function (p) { if (p.id === x.id) { p.tipo = x.tipo; p.categoria = x.categoria; } });
        });
        a.documentos = (a.documentos || []).concat(nuevosDocumentos);
        a.lista = (a.lista || []).concat(nuevosCorreo);
        return a;
      });
    }

    /* Y las repetidas que ya hubiera (fila 126): se queda la unida a un
       paso de guía; la otra, a la papelera. */
    var quitadas = 0;
    if (window.TiposNombre) {
      try { quitadas = await TiposNombre.quitarRepetidas(); } catch (e) { quitadas = 0; }
    }

    return {
      repetidasQuitadas: quitadas,
      documentosNuevos: nuevosDocumentos.length, documentosYaEstaban: documentosYaEstaban,
      correoNuevos: nuevosCorreo.length, correoYaEstaban: correoYaEstaban
    };
  }

  (function () {
    function $$(id) { return document.getElementById(id); }

    function bloque() {
      var ya = $$('bloque-plantillas-centro');
      if (ya) return ya;
      var pantalla = $$('ajustes-tab-mantenimiento');
      if (!pantalla) return null;
      var d = document.createElement('details');
      d.className = 'bloque-ajustes';
      d.id = 'bloque-plantillas-centro';
      d.innerHTML =
        '<summary>' +
          '<span class="bloque-titulo">Plantillas del centro</span>' +
          '<span class="bloque-pie">Los textos de documento y de correo ya preparados para el instituto</span>' +
        '</summary>' +
        '<div class="bloque-cuerpo">' +
          '<p class="explica">Cuelga de cada tipo de asunto sus plantillas de documento y de correo, con ' +
          'la norma citada, el membrete y el pie de firma. Se puede pulsar más de una vez: nada de lo ' +
          'que ya tengas escrito se toca.</p>' +
          '<button type="button" class="boton boton-principal" id="btn-cargar-plantillas-centro">' +
          'Cargar las plantillas del centro</button>' +
          '<div id="resultado-plantillas-centro"></div>' +
        '</div>';
      pantalla.appendChild(d);
      $$('btn-cargar-plantillas-centro').onclick = ejecutar;
      return d;
    }

    async function ejecutar() {
      var boton = $$('btn-cargar-plantillas-centro');
      var salida = $$('resultado-plantillas-centro');
      try {
        var r = await U.mientrasGuarda(boton, cargarPlantillasDelCentro);
        salida.innerHTML = '<ul class="lista-repetidos">' +
          '<li>' + (r.documentosNuevos
            ? r.documentosNuevos + ' plantilla(s) de documento nueva(s)'
            : 'Ninguna plantilla de documento nueva') +
          (r.documentosYaEstaban ? ', ' + r.documentosYaEstaban + ' ya estaban' : '') + '.</li>' +
          '<li>' + (r.correoNuevos
            ? r.correoNuevos + ' plantilla(s) de correo nueva(s)'
            : 'Ninguna plantilla de correo nueva') +
          (r.correoYaEstaban ? ', ' + r.correoYaEstaban + ' ya estaban' : '') + '.</li>' +
          (r.repetidasQuitadas ? '<li>' + r.repetidasQuitadas + ' plantilla(s) repetida(s), a la papelera.</li>' : '') +
          '</ul>';
        U.aviso('Plantillas cargadas.', 'bueno');
        if (typeof App.pintarAjustes === 'function') App.pintarAjustes();
      } catch (e) {
        U.aviso('No he podido cargarlas: ' + U.mensajeDeError(e), 'malo');
      }
    }

    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () { if (window.Gestor.carpetaGestor()) bloque(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  window.PlantillasCentro = { cargar: cargarPlantillasDelCentro };
})();
