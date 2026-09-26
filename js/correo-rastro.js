/* ============================================================
   correo-rastro.js — el rastro que queda en el asunto al escribir por
   Correo o Séneca (la nota, «a quién», dejar a la espera). Salió de
   js/correo.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada: comparte el
   estado del cuadro por `CorreoNucleo._interno`. Se carga justo
   después de js/correo-grupos.js.
   ============================================================ */
(function () {
  var I = window.CorreoNucleo._interno;
  function $(id) { return document.getElementById(id); }

  /* ---------- el rastro que queda en el asunto ----------

     Se escribe una sola vez por cada vez que se abre el cuadro: da
     igual que se copie el cuerpo y además se abra Gmail. En un asunto
     archivado no se escribe nada, porque sus notas ya no se tocan.
     "Para" y la copia oculta salen de js/correo-cuadro.js (fila 58, que
     ahora es dueño de esos dos datos), a través de `window.CorreoCuadro`. */

  /* "Comunicar" desde un hito (fila 60, sección 5.3 del encargo): la
     misma línea sirve para la nota del asunto y para el historial del
     hito (ver apuntarElRastro, más abajo). Pura, para poder probarla
     sin abrir ningún cuadro (`CorreoNucleo.textoDeComunicarHito`). */
  function textoDeComunicarHito(nombreDestinatario, esSeneca) {
    return 'Comunicado a ' + (nombreDestinatario || 'el tercero') + ' por ' +
      (esSeneca ? 'Séneca' : 'correo') + ' · ' + U.fechaLegible(U.aAaMmDd(U.hoyIso()));
  }

  /* "· con N documentos: a, b" (fila 103, sección 3): el mismo trozo
     para la nota de un correo normal y para la constancia de
     "Comunicar" desde un hito, pura para poder probarla sin abrir
     ningún cuadro (CorreoNucleo.sufijoDocumentos). Vacía sin nada que
     añadir, para no dejar puntos suspendidos de sobra. */
  function sufijoDocumentos(nombres) {
    if (!nombres || !nombres.length) return '';
    return ' · con ' + nombres.length + ' documento' + (nombres.length === 1 ? '' : 's') +
      ': ' + nombres.join(', ');
  }

  /* "Correo enviado a X" (fila 115): a quién, en la misma forma que ya
     usa el resto de la nota (Para, o "en copia oculta a N personas" si
     Para viene vacío). Pura salvo por leer window.CorreoCuadro, igual
     que el resto de textoDeLaNota. */
  function quienHaRecibidoElEnvio() {
    var cc = window.CorreoCuadro;
    var para = cc ? cc.paraDelCuadro() : '';
    if (para) return para;
    var direccionesCco = cc ? cc.ccoDirecciones() : [];
    if (direccionesCco.length) {
      return 'en copia oculta a ' + direccionesCco.length +
        (direccionesCco.length === 1 ? ' persona' : ' personas');
    }
    return 'el tercero';
  }

  function textoDeLaNota() {
    if (I.comunicarHitoActual) {
      /* La constancia en el historial del hito incluye los documentos
         (fila 103, sección 3): mismo dato que ya lee "Documentos de
         este asunto" (window.CorreoCuadro.documentosAdjuntados), así
         que aparecen igual haya o no texto propio del paso. */
      var documentosDelHito = (!I.porSeneca && window.CorreoCuadro) ? CorreoCuadro.documentosAdjuntados() : [];
      /* Si esta comunicación de hito ha salido por el envío real de
         Correo (fila 115), la nota dice "enviado", igual que fuera de
         un hito. */
      if (!I.porSeneca && I.envioRealizado) {
        return 'Correo enviado a ' + (I.comunicarHitoActual.nombreDestinatario || 'el tercero') +
          sufijoDocumentos(documentosDelHito);
      }
      return textoDeComunicarHito(I.comunicarHitoActual.nombreDestinatario, I.porSeneca) + sufijoDocumentos(documentosDelHito);
    }

    /* Un envío real (fila 115): "Correo enviado a X · con N documentos: …". */
    if (!I.porSeneca && I.envioRealizado) {
      var cc2 = window.CorreoCuadro;
      return 'Correo enviado a ' + quienHaRecibidoElEnvio() +
        sufijoDocumentos(cc2 ? cc2.documentosAdjuntados() : []);
    }

    /* En Séneca el campo del asunto es #seneca-asunto (js/seneca-cuadro.js,
       fila 53): #correo-asunto ya no existe en ese cuadro. */
    var campoAsunto = $('correo-asunto') || $('seneca-asunto');
    var asunto = campoAsunto ? campoAsunto.value : '';
    var cola = asunto ? ' — asunto: "' + asunto + '"' : '';
    if (I.porSeneca) {
      return 'Mensaje por Séneca a ' + (aQuien(I.viendo) || 'el tercero') + cola;
    }
    var cc = window.CorreoCuadro;
    var para = cc ? cc.paraDelCuadro() : '';
    var base = 'Correo ' + (para ? 'a ' + para : 'preparado') + cola;
    var direccionesCco = cc ? cc.ccoDirecciones() : [];
    if (direccionesCco.length) {
      base += ' · en copia oculta a ' + direccionesCco.length +
        (direccionesCco.length === 1 ? ' persona' : ' personas');
    }
    return base + sufijoDocumentos(cc ? cc.documentosAdjuntados() : []);
  }

  /* A quién se le va a escribir, dicho en palabras. En Séneca no hay
     direcciones que enseñar: lo que ayuda es acordarse de a quién hay
     que marcar en su lista. Si el asunto trae "Lo pide" (17-sep-2026,
     fila 28), manda ese nombre: es a quien hay que contestar, y puede
     no ser el propio interesado. */
  function aQuien(a) {
    if (I.comunicarHitoActual && I.comunicarHitoActual.nombreDestinatario) return I.comunicarHitoActual.nombreDestinatario;
    var deLoPide = window.LoPide && a && a.ficha && a.ficha.loPide && a.ficha.loPide.nombre;
    if (deLoPide) return deLoPide;
    var categoria = I.categoriaDe(a);
    var nombre = I.soloElNombre(I.terceroDe(a));
    if (!nombre) return '';
    if (categoria === 'ALUMNADO') return 'los tutores legales de ' + nombre;
    return nombre;
  }

  /* A quién se espera después de escribir a alguien de fuera (fila 129,
     docs/EL-HITO-ES-EL-ESTADO.md: ya no hay estados escritos a mano, se
     deja el asunto «Esperando a…», js/estado-hito.js): la familia en
     ALUMNADO, el tercero en lo demás. */
  function esperaTrasCorreo(a) {
    var cat = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    return cat === 'ALUMNADO' ? { id: 'tutor', nombre: 'la familia' } : { id: 'tercero', nombre: 'el tercero' };
  }

  function yaEsperando(a) {
    var l = (window.App && typeof App.ladoDe === 'function') ? App.ladoDe(a) : null;
    return !!(l && l.esperando);
  }

  async function apuntarElRastro(a) {
    if (I.yaApuntado) { pintarRastro(a, ''); return; }
    I.yaApuntado = true;

    if (I.modoDelAsunto === 'archivado' || !window.Notas) {
      pintarRastro(a, '');
      return;
    }
    try {
      var texto = textoDeLaNota();
      await window.Notas.anadir(a, texto);
      /* "Comunicar" desde un hito (fila 60, sección 5.3): la misma
         línea, además, en el historial del propio hito. No crítico: si
         falla, el mensaje ya se ha preparado y la nota ya ha quedado. */
      if (I.comunicarHitoActual && window.Hitos && typeof Hitos.anadirNota === 'function') {
        try {
          await Hitos.anadirNota(I.comunicarHitoActual.claveAsunto, I.comunicarHitoActual.idHito, texto);
          /* Fila 150: si se sabe qué paso del guion lo pidió (el botón
             «Comunicar» de ese paso, no el de la cabecera), se marca ese
             mismo, no «el primero pendiente». */
          if (I.comunicarHitoActual.idPasoGuion && Hitos.marcarGuion) {
            await Hitos.marcarGuion(I.comunicarHitoActual.claveAsunto, I.comunicarHitoActual.idHito, I.comunicarHitoActual.idPasoGuion, { hecho: true });
          } else if (Hitos.marcarGuionPorAccion) {
            await Hitos.marcarGuionPorAccion(a, I.comunicarHitoActual.idHito, 'comunicar');   /* fila 109 */
          }
          if (window.HitosPanel) window.HitosPanel.programarRepintado();
        } catch (e) { /* no crítico */ }
      }
      I.algoCambiado = true;
      pintarRastro(a, 'Apuntado en las notas del asunto.');
    } catch (e) {
      pintarRastro(a, 'No he podido apuntarlo en el asunto: ' + U.mensajeDeError(e));
    }
  }

  function pintarRastro(a, aviso) {
    var caja = $('correo-caja');
    if (!caja) return;
    var sitio = $('correo-rastro');
    if (!sitio) {
      sitio = document.createElement('div');
      sitio.id = 'correo-rastro';
      sitio.className = 'aviso aviso-ambar';
      sitio.style.marginTop = '14px';
      caja.appendChild(sitio);
    }

    var espera = esperaTrasCorreo(a);
    var puedeEsperar = I.modoDelAsunto !== 'archivado' && window.EstadoHito && !yaEsperando(a);

    /* El recordatorio de guardar el PDF del hilo solo hace falta
       cuando el correo NO ha salido por aquí (fila 115): un envío real
       ya deja su propio hilo enganchado, y la respuesta entra sola. */
    sitio.innerHTML = '<strong>' + U.escapar(aviso || 'Rastro del correo') + '</strong>' +
      (I.envioRealizado ? '' :
        '<p>Acuérdate de guardar el PDF del hilo en el asunto: en la tarjeta ' +
        'Documentos, "+ Añadir documento".</p>');

    if (!puedeEsperar) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.style.marginTop = '8px';
    b.textContent = 'Dejar el asunto esperando a ' + espera.nombre;
    b.onclick = async function () {
      b.disabled = true;
      try {
        await EstadoHito.ponerEsperando(a, espera.id, 'Correo enviado');
        I.algoCambiado = true;
        b.textContent = 'Hecho: esperando a ' + espera.nombre;
      } catch (e) {
        b.disabled = false;
        U.aviso('No he podido dejarlo en espera: ' + U.mensajeDeError(e), 'malo');
      }
    };
    sitio.appendChild(b);
  }

  I.aQuien = aQuien;
  window.CorreoNucleo.aQuien = aQuien;
  window.CorreoNucleo.apuntarElRastro = apuntarElRastro;
  window.CorreoNucleo.textoDeComunicarHito = textoDeComunicarHito;
  window.CorreoNucleo.sufijoDocumentos = sufijoDocumentos;
})();
