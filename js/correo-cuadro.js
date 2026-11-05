/* ============================================================
   correo-cuadro.js — el cuadro de "Correo electrónico" de un asunto
   (18-sep-2026, fila 58, docs/AJUSTES-DE-USO-2026-09-18.md, 5),
   sacado de js/correo.js (que pasaba de las 800 líneas) para que se
   vea entero, igual que se hizo con Séneca en la fila 53
   (js/seneca-cuadro.js).

   Este fichero es dueño de todo lo que solo usa el cuadro de Correo:
   a quién se escribe (`elegidos`), la copia oculta de los grupos
   (`cco`/`ccoSinCorreo`), qué documentos se han adjuntado por última
   vez, y —desde el 24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md)—
   el botón "Enviar" y el resumen que lo confirma. Lo que necesita de
   js/correo.js —el asunto del mensaje, el cuerpo con su plantilla, a
   quién se escribe en palabras, apuntar el rastro— se usa a través de
   `window.CorreoNucleo` (mismo patrón que ya usaba js/seneca-cuadro.js).

   EL BOTÓN "ENVIAR" (fila 115): sustituye a "Preparar borrador con los
   documentos". La aplicación ya NO deja nunca todo listo sin más: al
   pulsar "Enviar" se pinta, dentro del mismo cuadro (nunca un segundo
   cuadro encima: regla de U.preguntar), un resumen de lo que se va a
   mandar — Para, Copia oculta, Asunto, primeras líneas del texto y los
   documentos con su tamaño — con "Confirmar y enviar" y "Volver". El
   formulario (`#correo-formulario`) y el resumen (`#correo-resumen`)
   son dos bloques HERMANOS dentro del mismo `#correo-caja`: "Enviar" y
   "Volver" solo alternan cuál de los dos se ve (con la clase `oculto`),
   sin volver a montar el formulario ni perder nada de lo escrito a
   mano. Al confirmar, `window.CorreoEnviar` llama a la aplicación web
   de Apps Script; si falla, el aviso sale en rojo dentro del propio
   resumen y el formulario sigue intacto detrás, listo para reintentar
   sin haber perdido el texto. "Abrir en Gmail" y "Abrir en el correo
   del ordenador" se quedan, como botones secundarios.

   Va después de js/correo.js, js/correo-adjuntos.js y
   js/correo-enviar.js en index.html. */
var CorreoCuadro = (function () {
  var I = CorreoCuadroNucleo;
  function $() { return I.$.apply(this, arguments); }
  function n() { return I.n.apply(this, arguments); }
  function paraDelCuadro() { return I.paraDelCuadro.apply(this, arguments); }
  function ccoDelCuadro() { return I.ccoDelCuadro.apply(this, arguments); }
  function cuerpoHtml() { return I.cuerpoHtml.apply(this, arguments); }
  function enganchar() { return I.enganchar.apply(this, arguments); }
  function matriculasDelUltimoHilo() { return I.matriculasDelUltimoHilo.apply(this, arguments); }
  function ultimoHiloDelAsunto() { return I.ultimoHiloDelAsunto.apply(this, arguments); }
  function primerasLineas() { return I.primerasLineas.apply(this, arguments); }
  function marcasDeAdjuntos() { return I.marcasDeAdjuntos.apply(this, arguments); }

  function engancharEnviar(a) {
    var boton = $('correo-enviar');
    if (!boton) return;
    var conectado = window.CorreoEnviar && CorreoEnviar.tieneConexion();
    if (!conectado) {
      boton.textContent = 'Conecta el envío en Ajustes → Enviar correo';
      boton.onclick = function () { if (window.CorreoEnviar) CorreoEnviar.irAAjustes(); };
      return;
    }
    boton.textContent = 'Enviar';
    boton.onclick = function () { alPulsarEnviar(a); };
  }

  async function alPulsarEnviar(a) {
    var para = paraDelCuadro();
    var ccoTexto = ccoDelCuadro();
    if (!para && !ccoTexto) { U.aviso('Elige a quién se lo mandas.', 'malo'); return; }

    var marcadas = marcasDeAdjuntos();
    var totalBytes = (window.CorreoAdjuntos && CorreoAdjuntos.totalBytesDe) ? CorreoAdjuntos.totalBytesDe(marcadas) : 0;
    if (totalBytes > (window.CorreoAdjuntos ? CorreoAdjuntos.MAXIMO_BYTES : 20 * 1024 * 1024)) {
      var tl = window.CorreoAdjuntos ? CorreoAdjuntos.tamanoLegible(totalBytes) : (totalBytes + ' B');
      U.aviso('Eso pesa ' + tl + '. Gmail no admite más de 20 MB.', 'malo');
      return;
    }

    /* Fila 524: lo que falta por firmar o registrar de los documentos que adjuntas; se avisa, no se impide. */
    var falta = [];
    if (window.AvisosFalta && marcadas.length) { try { falta = await AvisosFalta.deLosAdjuntos(a, marcadas); } catch (e) { falta = []; } }

    pintarResumen(a, {
      para: para,
      cco: ccoTexto,
      asunto: $('correo-asunto') ? $('correo-asunto').value : '',
      cuerpo: $('correo-cuerpo-texto') ? $('correo-cuerpo-texto').value : '',
      adjuntos: marcadas,
      falta: falta
    });
  }

  /* Sale DENTRO del mismo cuadro (regla de U.preguntar: nunca un
     segundo cuadro encima). `#correo-formulario` y `#correo-resumen`
     son hermanos: se alterna cuál se ve, así que "Volver" no pierde
     nada de lo escrito a mano, sin tener que volver a montar nada. */
  function pintarResumen(a, datos) {
    var formulario = $('correo-formulario');
    var resumen = $('correo-resumen');
    if (!formulario || !resumen) return;

    var listaTam = (window.CorreoAdjuntos && CorreoAdjuntos.listaConTamanos) ? CorreoAdjuntos.listaConTamanos() : [];
    var porNombre = {};
    listaTam.forEach(function (f) { porNombre[f.nombre] = f.tam; });
    var tl = window.CorreoAdjuntos ? CorreoAdjuntos.tamanoLegible : function (b) { return b + ' B'; };
    var etiquetaConfirmar = (datos.falta && datos.falta.length) ? 'Enviar igualmente' : 'Confirmar y enviar';

    resumen.innerHTML =
      '<h3 style="margin-top:0">Vas a mandar este correo</h3>' +
      '<p><strong>Para:</strong> ' +
        (datos.para ? U.escapar(datos.para) : '<span class="suave">(nadie en Para; va en copia oculta)</span>') +
      '</p>' +
      (datos.cco ? '<p><strong>Copia oculta:</strong> ' + U.escapar(datos.cco) + '</p>' : '') +
      '<p><strong>Asunto:</strong> ' + U.escapar(datos.asunto) + '</p>' +
      '<p class="nota" style="white-space:pre-wrap">' + U.escapar(primerasLineas(datos.cuerpo)) + '</p>' +
      (datos.adjuntos.length
        ? '<p><strong>Documentos</strong></p><ul>' + datos.adjuntos.map(function (nombre) {
            return '<li>' + U.escapar(nombre) + (porNombre[nombre] !== undefined ? ' · ' + tl(porNombre[nombre]) : '') + '</li>';
          }).join('') + '</ul>'
        : '<p class="nota">Sin documentos adjuntos.</p>') +
      /* Fila 524: el cuadro «Falta por hacer en lo que vas a enviar», dentro de este mismo cuadro (un solo cuadro a la vez). */
      (datos.falta && datos.falta.length
        ? '<div class="aviso aviso-ambar" id="correo-falta"><p><strong>Falta por hacer en lo que vas a enviar</strong></p>' +
          (window.AvisosFalta ? AvisosFalta.listaHtml(datos.falta) : '') + '</div>'
        : '') +
      '<div id="correo-resumen-aviso"></div>' +
      '<div class="correo-botones" style="margin-top:14px">' +
        '<button type="button" class="boton boton-principal" id="correo-confirmar-envio">' + etiquetaConfirmar + '</button>' +
        '<button type="button" class="boton" id="correo-resumen-volver">Volver</button>' +
      '</div>';

    formulario.className = 'oculto';
    resumen.className = '';

    $('correo-resumen-volver').onclick = function () {
      resumen.className = 'oculto';
      formulario.className = '';
    };
    /* Fila 130: un identificador por cuadro de confirmación; si se vuelve
       a pulsar aquí mismo, el mismo (el script no manda dos veces). */
    var idEnvio = CorreoEnviar.nuevoIdEnvio ? CorreoEnviar.nuevoIdEnvio() : '';
    $('correo-confirmar-envio').onclick = function () { confirmarEnvio(a, datos, idEnvio); };
  }

  async function confirmarEnvio(a, datos, idEnvio) {
    var boton = $('correo-confirmar-envio');
    var volver = $('correo-resumen-volver');
    var avisoEl = $('correo-resumen-aviso');
    if (avisoEl) avisoEl.innerHTML = '';
    if (boton) { boton.disabled = true; boton.textContent = 'Enviando…'; }
    if (volver) volver.disabled = true;

    try {
      var adjuntosBase64 = [];
      for (var i = 0; i < datos.adjuntos.length; i++) {
        var origen = await a.handle.getFileHandle(datos.adjuntos[i]);
        var fichero = await origen.getFile();
        var base64 = await CorreoAdjuntos.aBase64(fichero);
        adjuntosBase64.push({ nombre: datos.adjuntos[i], tipo: fichero.type || 'application/octet-stream', base64: base64 });
      }

      var respuesta = await CorreoEnviar.enviar({
        para: datos.para,
        cco: datos.cco,
        asunto: datos.asunto,
        cuerpo: datos.cuerpo,
        hilo: ultimoHiloDelAsunto(a),
        matriculas: matriculasDelUltimoHilo(a),
        adjuntos: adjuntosBase64,
        idEnvio: idEnvio || ''
      });
      if (!respuesta || !respuesta.ok) {
        var fallo = new Error((respuesta && respuesta.motivo) || 'El envío no ha salido bien.');
        fallo.sinSaber = !!(respuesta && respuesta.sinSaber);
        throw fallo;
      }

      I.S.documentosAdjuntados = datos.adjuntos.slice();
      /* Fila 195 (docs/AVISOS-A-QUIEN-LO-PIDE.md): tras enviar de
         verdad, "Esta vez no" ya no pinta nada. */
      var interno = n()._interno;
      if (interno && $('cuadro-aceptar') && (interno.avisoLoPide || $('cuadro-aceptar').textContent === 'Todavía no')) $('cuadro-aceptar').textContent = 'Cerrar';   /* fila 285: tras enviar, ya no es «Todavía no» */
      if (respuesta.hilo) { try { await anadirHiloAlAsunto(a, respuesta.hilo, datos.asunto, respuesta.matricula ? [respuesta.matricula] : []); } catch (e) { /* accesorio */ } }
      if (n().marcarEnvioRealizado) n().marcarEnvioRealizado();
      if (n().apuntarElRastro) n().apuntarElRastro(a);
      if (interno && interno.avisoActividad && window.ActividadesInforme) { var av = interno.avisoActividad; interno.avisoActividad = null; await ActividadesInforme.alEnviar(a, av); }   /* fila 309 */
      /* Fila 236 (docs/CORREO-ENVIADO-EN-PDF.md): el correo enviado, como PDF en el asunto. */
      if (window.CorreoEnviadoPdf) await CorreoEnviadoPdf.alEnviar(a, datos, respuesta);

      var resumen = $('correo-resumen');
      if (resumen) {
        resumen.innerHTML = '<p class="aviso aviso-ambar"><strong>Correo enviado a ' +
          U.escapar(datos.para || datos.cco || 'la cuenta') + '.</strong></p>';
      }
      U.aviso('Correo enviado a ' + (datos.para || datos.cco || '') + '.', 'bueno');
    } catch (e) {
      if (avisoEl) {
        /* Fila 130: si venció el tiempo, no se sabe si ha salido: ámbar. */
        avisoEl.innerHTML = e && e.sinSaber
          ? '<p class="aviso aviso-ambar">' + U.escapar(e.message) + '</p>'
          : '<p class="aviso aviso-rojo">No he podido enviarlo: ' + U.escapar(U.mensajeDeError(e)) + '</p>';
      }
      if (boton) { boton.disabled = false; boton.textContent = (datos.falta && datos.falta.length) ? 'Enviar igualmente' : 'Confirmar y enviar'; }
      if (volver) volver.disabled = false;
    }
  }

  /* Deja el hilo del correo enviado enganchado al asunto (como un
     correo guardado desde la bandeja): así la respuesta del tercero
     entra sola. No crítico: si falla, el correo ya ha salido. */
  /* Fila 176: fundido con App.anotarLista, no mandado entero. */
  async function anadirHiloAlAsunto(a, hiloId, asuntoTexto, matriculas) {
    var huella = {
      id: hiloId, asunto: String(asuntoTexto || a.nombre).toLowerCase(), visto: 1,
      matriculas: matriculas || [], metidoPor: App.E.usuario, metidoEl: U.ahora()
    };
    await App.anotarLista(a.nombre, 'hilos', { anadir: [huella] });
    if (a.ficha) a.ficha.hilos = App.unirPorIdentidad(a.ficha.hilos, [huella], App.IDENTIDAD_LISTA.hilos);
    if (window.Bandeja && window.Bandeja.escribirSeguidos) await window.Bandeja.escribirSeguidos();
  }

  I.engancharEnviar = engancharEnviar;

  /* ---------- lo que usa js/correo.js ----------

     `textoDeLaNota` (js/correo.js) necesita "a quién" y "con cuántos
     documentos" para el rastro que se apunta en las notas del asunto;
     js/correo-adjuntos.js ya no lee "Para"/la copia oculta del DOM: se
     lee aquí mismo, al enviar. */
  return {
    cuerpoHtml: cuerpoHtml,
    enganchar: enganchar,
    pintarResumen: pintarResumen,   /* fila 524: la prueba pinta el resumen */
    paraDelCuadro: paraDelCuadro,
    ccoDirecciones: function () { return Object.keys(I.S.cco); },
    documentosAdjuntados: function () { return I.S.documentosAdjuntados; }
  };
})();
window.CorreoCuadro = CorreoCuadro;
