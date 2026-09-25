/* ============================================================
   generar-para-relacionados.js — un documento para cada relacionado
   (25-sep-2026, fila 171, docs/DOCUMENTO-PARA-CADA-RELACIONADO.md).

   Pensado para el certificado de participación de cada profesor en
   una actividad extraescolar: un asunto por actividad, los profesores
   como terceros relacionados, y aquí un documento por persona con la
   misma plantilla, y (si se quiere) un correo a cada uno con el suyo.

   - Los huecos de la persona salen del relacionado
     (`Plantillas.valoresParaPersona`, js/plantillas-valores.js); los
     del asunto, del centro y los firmantes, iguales para todos.
   - Lo que falta del asunto se pregunta UNA vez (js/word-faltan.js);
     lo que falta de una persona (su DNI…) se dice al final, por
     persona, sin parar el lote.
   - Cada documento va a la carpeta del asunto con el nombre de
     siempre y el nombre de la persona como texto adicional.
   - «Enviar a cada uno»: un correo por persona, con su documento
     adjunto (js/correo-enviar.js) y la plantilla de correo del tipo.
     El identificador de cada envío sale del asunto, el documento y el
     correo: el script no manda dos veces el mismo.

   Lo llama la mesa del hito (js/hito-mesa-documentos.js, «… para cada
   relacionado (N)»). No envuelve nada.
   ============================================================ */
window.GenerarParaRelacionados = (function () {

  function relacionadosDe(a) {
    return ((a && a.ficha && a.ficha.relacionados) || []).filter(function (r) { return r && r.nombre; });
  }

  function cuantos(a) { return relacionadosDe(a).length; }

  function soloElNombre(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* Los huecos que son de la persona: si faltan, se dicen al final por
     persona, nunca se preguntan para todos (sería el mismo DNI para
     todos). Por la etiqueta con la que salen en `faltan`. */
  var DE_PERSONA = ['nombre', 'nombreNatural', 'referencia', 'dni', 'telefono', 'correo', 'especialidad',
    'tutor1', 'tutor1telefono', 'tutor1correo', 'tutor2', 'tutor2telefono', 'tutor2correo'];

  function esDePersona(falta) {
    var n = U.normalizar(falta);
    if (/^(dato|tabla)\s/.test(n)) return true;
    return DE_PERSONA.some(function (c) {
      var h = (Plantillas.HUECOS || []).filter(function (x) { return x.clave === c; })[0];
      return U.normalizar(c) === n || (h && U.normalizar(h.etiqueta) === n);
    });
  }

  /* Pura, para las pruebas: separa lo que falta en lo del asunto (una
     sola vez, sin repetir) y lo de cada persona. */
  function repartirFaltan(porPersona) {
    var delAsunto = [], dePersona = [];
    porPersona.forEach(function (x) {
      var suyas = [];
      (x.faltan || []).forEach(function (f) {
        if (esDePersona(f)) { if (suyas.indexOf(f) === -1) suyas.push(f); }
        else if (delAsunto.indexOf(f) === -1) delAsunto.push(f);
      });
      if (suyas.length) dePersona.push({ nombre: x.nombre, faltan: suyas });
    });
    return { delAsunto: delAsunto, dePersona: dePersona };
  }

  function nombreDelDocumento(plantillaDoc, rel, fechaIso) {
    return Nombres.montarDocumento({
      fecha: fechaIso,
      tipo: plantillaDoc.tipoDocumento || 'DOCUMENTO',
      curso: ((plantillaDoc.texto || '') + ' ' + soloElNombre(rel.nombre)).trim(),
      extension: 'docx'
    });
  }

  async function leerPlantilla(plantillaDoc) {
    var carpeta = await PlantillasDocumento._interno.carpetaDePlantillas();
    var handle = await carpeta.getFileHandle(plantillaDoc.fichero);
    var buffer = await (await handle.getFile()).arrayBuffer();
    if (window.Membrete) {
      try {
        var membrete = await Membrete.montar({ conLogoCentro: plantillaDoc.conLogoCentro !== false });
        if (membrete) buffer = await Docx.ponerImagen(buffer, 'MEMBRETE', membrete.bytes, membrete.ancho, membrete.alto);
      } catch (e) { /* sin membrete, igual */ }
    }
    return buffer;
  }

  /* Rellena la plantilla para una persona; `aMano`, lo escrito para el asunto. */
  async function rellenarPara(base, a, rel, plantillaDoc, hito, aMano) {
    var falso = Plantillas.asuntoConPersona(a, rel);
    var valores = await Plantillas.valoresParaPersona(a, rel, { fecha: U.hoyIso(), plantilla: plantillaDoc, hito: hito });
    if (aMano) valores.aMano = aMano;
    var buffer = base, tablas = null;
    if (window.TablasDatos) {
      try { tablas = await TablasDatos.prepararDocumento(base, falso, valores); buffer = tablas.buffer; }
      catch (e) { tablas = null; }
    }
    var r = await Docx.rellenar(buffer, valores);
    if (tablas) r = await TablasDatos.resaltarResultado(r, tablas.faltan);
    return { blob: r.blob, faltan: r.faltan || [], correo: valores.correo || '', nombreNatural: valores.nombreNatural || soloElNombre(rel.nombre) };
  }

  async function guardarBlob(dir, nombre, blob) {
    var h = await dir.getFileHandle(nombre, { create: true });
    var w = await h.createWritable();
    await w.write(blob);
    await w.close();
  }

  async function generar(a, plantillaDoc, hito) {
    var rels = relacionadosDe(a);
    if (!rels.length) { U.aviso('Este asunto no tiene relacionados.', 'ambar'); return null; }
    var base;
    try { base = await leerPlantilla(plantillaDoc); }
    catch (e) { U.fallo('No he podido leer la plantilla «' + plantillaDoc.fichero + '»', e); return null; }

    /* 1. Una pasada en memoria: qué falta de cada uno. */
    var primera = [];
    for (var i = 0; i < rels.length; i++) {
      primera.push(Object.assign({ rel: rels[i], nombre: soloElNombre(rels[i].nombre) },
        await rellenarPara(base, a, rels[i], plantillaDoc, hito, null)));
    }
    var reparto = repartirFaltan(primera);

    /* 2. Lo del asunto se pregunta una vez, para todos. */
    var aMano = null;
    if (reparto.delAsunto.length && window.WordFaltan) {
      var r = await WordFaltan.preguntar(reparto.delAsunto);
      if (r.accion === 'cancelar') { U.aviso('No se ha generado nada.', 'ambar'); return null; }
      if (r.accion === 'generar' && Object.keys(r.aMano).length) aMano = r.aMano;
    }

    /* 3. Guardar uno por persona. */
    var yaEsta = [];
    try { yaEsta = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { yaEsta = []; }
    var hechos = [], saltados = [];
    for (var j = 0; j < primera.length; j++) {
      var x = primera[j];
      var nombreDoc = nombreDelDocumento(plantillaDoc, x.rel, U.hoyIso());
      if (yaEsta.indexOf(nombreDoc) !== -1) { saltados.push(x.nombre + ' (ya estaba «' + nombreDoc + '»)'); continue; }
      try {
        var hecho = aMano ? Object.assign(x, await rellenarPara(base, a, x.rel, plantillaDoc, hito, aMano)) : x;
        await guardarBlob(a.handle, nombreDoc, hecho.blob);
        yaEsta.push(nombreDoc);
        hechos.push({ rel: x.rel, nombre: x.nombre, nombreNatural: hecho.nombreNatural, correo: hecho.correo, documento: nombreDoc });
      } catch (e) {
        saltados.push(x.nombre + ' (' + U.mensajeDeError(e) + ')');
      }
    }

    /* 4. Lo accesorio: la nota y el hito. */
    if (hechos.length) {
      try { if (window.Notas) await Notas.anadir(a, 'Generados ' + hechos.length + ' documentos «' + plantillaDoc.nombre + '», uno por relacionado'); }
      catch (e) { /* ya están guardados */ }
      if (hito && window.Hitos) {
        try {
          for (var k = 0; k < hechos.length; k++) await Hitos.anadirDocumento(a.nombre, hito.id, hechos[k].documento);
          await Hitos.anadirNota(a.nombre, hito.id, 'Generados ' + hechos.length + ' «' + plantillaDoc.nombre + '», uno por relacionado');
          if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, hito.id, 'generar');
        } catch (e) { U.accesorio('Documentos generados, pero no he podido apuntarlos en el hito', e); }
        if (window.HitosPanel && HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(a.nombre, hito.id);
      }
      if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    }

    var resultado = { hechos: hechos, saltados: saltados, faltanDePersona: reparto.dePersona };
    await resumen(a, plantillaDoc, resultado);
    return resultado;
  }

  /* ---------- el resumen, con «Enviar a cada uno» ---------- */

  function textoResumen(r, plantillaDoc) {
    var tipo = String(plantillaDoc.tipoDocumento || 'documento').toLowerCase();
    var lineas = [r.hechos.length + ' ' + (r.hechos.length === 1 ? tipo + ' generado' : tipo + 's generados') + '.'];
    /* Agrupado por dato: «A 2 personas les falta el DNI». */
    var porDato = {};
    r.faltanDePersona.forEach(function (p) {
      p.faltan.forEach(function (f) { (porDato[f] = porDato[f] || []).push(p.nombre); });
    });
    Object.keys(porDato).forEach(function (f) {
      var n = porDato[f].length;
      var dato = /^dni\b/i.test(U.normalizar(f)) ? 'el DNI' : f;
      lineas.push((n === 1 ? 'A 1 persona le falta ' : 'A ' + n + ' personas les falta ') + dato + ': ' + porDato[f].join('; ') + '.');
    });
    if (r.saltados.length) lineas.push('Sin generar: ' + r.saltados.join('; ') + '.');
    return lineas;
  }

  async function resumen(a, plantillaDoc, r) {
    var lineas = textoResumen(r, plantillaDoc);
    var puedeEnviar = r.hechos.length && window.CorreoEnviar;
    var html = lineas.map(function (l) { return '<p class="explica">' + U.escapar(l) + '</p>'; }).join('') +
      (puedeEnviar ? '<p><button type="button" class="boton boton-principal" id="gpr-enviar">Enviar a cada uno</button></p>' +
        '<div id="gpr-envio"></div>' : '');
    var esperar = U.preguntar('Un documento para cada relacionado', html, 'Cerrar', true);
    var boton = document.getElementById('gpr-enviar');
    if (boton) boton.onclick = function () { prepararEnvio(a, r, boton); };
    await esperar;
  }

  /* El correo de cada uno: la plantilla de correo del tipo (la que habla
     de certificado, si hay varias), con saludo y firma, como el cuadro de Correo. */
  function elegirPlantillaCorreo(a) {
    var lista = (window.CorreoNucleo && CorreoNucleo.plantillasDelTipo) ? (CorreoNucleo.plantillasDelTipo(a) || []) : [];
    return lista.filter(function (p) { return /certificad/i.test(p.nombre); })[0] || lista[0] || null;
  }

  async function correoPara(a, hecho, plantillaCorreo) {
    var valores = await Plantillas.valoresParaPersona(a, hecho.rel, {});
    var medio = plantillaCorreo ? Plantillas.rellenar(plantillaCorreo.texto, valores).texto : '';
    var saludo = hecho.rel.categoria === 'PERSONAL' ? 'Hola, ' + soloElNombre(valores.nombreNatural || hecho.nombre) + ':' : 'Buenos días:';
    return {
      para: hecho.correo,
      asunto: a.nombre + ' · ' + (valores.nombreNatural || hecho.nombre),
      cuerpo: saludo + '\n\n' + (medio ? medio + '\n\n' : '') + (valores.firma || '')
    };
  }

  /* Siempre el mismo para el mismo asunto, documento y correo. */
  function idEnvioDe(a, hecho) {
    var t = a.nombre + '|' + hecho.documento + '|' + String(hecho.correo).toLowerCase();
    var h1 = 5381, h2 = 52711;
    for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); h1 = Math.imul(h1, 33) ^ c; h2 = Math.imul(h2, 31) ^ c; }
    return 'env-rel-' + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + '-' + t.length.toString(36);
  }

  var enviados = {};   /* idEnvio → true, en esta sesión: nunca dos veces */

  function prepararEnvio(a, r, boton) {
    var caja = document.getElementById('gpr-envio');
    if (!caja) return;
    var con = r.hechos.filter(function (h) { return h.correo; });
    var sin = r.hechos.filter(function (h) { return !h.correo; });
    if (!CorreoEnviar.tieneConexion || !CorreoEnviar.tieneConexion()) {
      caja.innerHTML = '<p class="aviso aviso-ambar">Para enviar hace falta conectar el envío en Ajustes › Mantenimiento.</p>';
      return;
    }
    caja.innerHTML = '<p class="explica">Se va a mandar un correo a cada una de estas personas, con su documento:</p>' +
      '<ul>' + con.map(function (h) { return '<li>' + U.escapar(h.nombre + ' — ' + h.correo) + '</li>'; }).join('') + '</ul>' +
      (sin.length ? '<p class="aviso aviso-ambar">Sin correo (para Séneca): ' + U.escapar(sin.map(function (h) { return h.nombre; }).join('; ')) + '.</p>' : '') +
      (con.length ? '<p><button type="button" class="boton boton-principal" id="gpr-confirmar">Confirmar y enviar</button></p>' : '') +
      '<div id="gpr-envio-aviso"></div>';
    boton.classList.add('oculto');
    var confirmar = document.getElementById('gpr-confirmar');
    if (confirmar) confirmar.onclick = function () { enviarTodos(a, con, confirmar); };
  }

  async function enviarTodos(a, con, confirmar) {
    confirmar.disabled = true;
    confirmar.textContent = 'Enviando…';
    var plantillaCorreo = elegirPlantillaCorreo(a);
    var bien = [], mal = [];
    for (var i = 0; i < con.length; i++) {
      var h = con[i];
      var id = idEnvioDe(a, h);
      if (enviados[id]) { bien.push(h.nombre + ' (ya enviado)'); continue; }
      try {
        var datos = await correoPara(a, h, plantillaCorreo);
        var fichero = await (await a.handle.getFileHandle(h.documento)).getFile();
        var respuesta = await CorreoEnviar.enviar({
          para: datos.para, cco: '', asunto: datos.asunto, cuerpo: datos.cuerpo, hilo: '',
          adjuntos: [{ nombre: h.documento, tipo: fichero.type || 'application/octet-stream', base64: await CorreoAdjuntos.aBase64(fichero) }],
          idEnvio: id
        });
        if (!respuesta || !respuesta.ok) throw new Error((respuesta && respuesta.motivo) || 'El envío no ha salido bien.');
        enviados[id] = true;
        bien.push(h.nombre);
      } catch (e) {
        mal.push(h.nombre + ': ' + U.mensajeDeError(e));
      }
    }
    if (bien.length && window.Notas) {
      try { await Notas.anadir(a, 'Enviado por correo a cada relacionado su documento: ' + bien.join('; ')); } catch (e) { /* accesorio */ }
    }
    var aviso = document.getElementById('gpr-envio-aviso');
    if (aviso) {
      aviso.innerHTML = (bien.length ? '<p class="aviso aviso-bueno">Enviado a ' + U.escapar(bien.join('; ')) + '.</p>' : '') +
        (mal.length ? '<p class="aviso aviso-rojo">No ha salido: ' + U.escapar(mal.join('; ')) + '</p>' : '');
    }
    confirmar.textContent = mal.length ? 'Volver a intentar los que faltan' : 'Enviado';
    confirmar.disabled = !mal.length;
    if (mal.length) {
      var quedan = con.filter(function (h) { return !enviados[idEnvioDe(a, h)]; });
      confirmar.onclick = function () { enviarTodos(a, quedan, confirmar); };
    }
  }

  return {
    cuantos: cuantos, generar: generar,
    /* Para las pruebas. */
    repartirFaltan: repartirFaltan, nombreDelDocumento: nombreDelDocumento, textoResumen: textoResumen, idEnvioDe: idEnvioDe
  };
})();
