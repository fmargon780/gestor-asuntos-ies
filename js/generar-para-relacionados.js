/* ============================================================
   generar-para-relacionados.js — un documento para cada relacionado
   (25-sep-2026, fila 171, docs/DOCUMENTO-PARA-CADA-RELACIONADO.md).

   El certificado de participación en una actividad extraescolar se
   hace para cada profesor que acompañó. Un asunto por actividad, los
   profesores como relacionados, y en la mesa del hito, junto a cada
   plantilla de «Generar documento ▾», un «… para cada relacionado (N)»:

     - Un documento por relacionado, con la misma plantilla. Lo de la
       persona sale de ella (`Plantillas.valoresDePersona`); lo del
       asunto, del centro y los firmantes, igual para todos.
     - Lo que falte del asunto se pregunta UNA vez (js/word-faltan.js);
       lo que falte de una persona se dice al final, sin parar el lote.
     - Cada uno se llama como siempre, con el nombre de la persona al
       final del texto adicional.
     - Al terminar, un resumen con «Enviar a cada uno»: un correo por
       persona con su documento adjunto (js/correo-enviar.js), nunca dos
       veces el mismo documento a la misma persona (`ficha.enviosPorPersona`
       y el `idEnvio` fijo). Quien no tiene correo sale en la lista, para
       Séneca.

   Se engancha por la llamada que le hace js/hito-mesa-documentos.js al
   pintar las plantillas (`botonHTML` y `enganchar`): no envuelve nada.
   ============================================================ */
var GenerarParaRelacionados = (function () {

  function relacionadosDe(a) {
    return ((a && a.ficha && a.ficha.relacionados) || []).filter(function (r) { return r && r.nombre && r.categoria; });
  }

  /* El nombre sin el código pegado detrás (Nº escolar, 4 del documento, NIF). */
  function soloElNombre(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* ---------- en la mesa del hito ---------- */

  function botonHTML(a) {
    var n = relacionadosDe(a).length;
    if (!n) return '';
    return '<button type="button" class="boton boton-chico mesa-plantilla-cada" ' +
      'title="Un documento para cada relacionado del asunto, con sus datos">… para cada relacionado (' + n + ')</button>';
  }

  function enganchar(caja, a, h, plantillas) {
    Array.prototype.forEach.call(caja.querySelectorAll('.mesa-plantilla-cada'), function (b) {
      b.onclick = async function () {
        var id = b.closest('.mesa-plantilla').dataset.id;
        var p = (plantillas || []).filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        /* Sin `U.mientrasGuarda`: dentro hay cuadros (lo que falta, el
           resumen), y esa ayuda es solo para la escritura. Apagado
           mientras dura, para no lanzar dos lotes. */
        b.disabled = true;
        try { await generar(a, p, h); }
        catch (e) { U.fallo('No he podido generar los documentos', e); }
        finally { b.disabled = false; }
      };
    });
  }

  /* ---------- lo que falta: del asunto o de la persona ---------- */

  var DE_LA_PERSONA = ['nombre', 'nombreNatural', 'dni', 'referencia', 'telefono', 'correo',
    'tutor1', 'tutor1telefono', 'tutor1correo', 'tutor2', 'tutor2telefono', 'tutor2correo'];

  function etiquetasDeLaPersona() {
    var huecos = (window.Plantillas && Plantillas.HUECOS) || [];
    return DE_LA_PERSONA.map(function (c) {
      var h = huecos.filter(function (x) { return x.clave === c; })[0];
      return h ? h.etiqueta : c;
    }).concat(['Especialidad']);
  }

  function esDeLaPersona(falta, etiquetas) {
    return etiquetas.indexOf(falta) !== -1 || /^el sexo de la persona/i.test(falta) || /^el sexo del tutor/i.test(falta);
  }

  /* Cómo se dice cada falta de una persona, en corto. */
  function queFalta(f) {
    var dni = etiquetasDeLaPersona()[DE_LA_PERSONA.indexOf('dni')];
    if (f === dni) return 'el DNI';
    if (f === 'Especialidad') return 'la especialidad';
    if (/^el sexo de la persona/i.test(f)) return 'el sexo (en su ficha, «Datos y contacto»)';
    return 'el dato «' + (window.WordFaltan ? WordFaltan.legible(f) : f) + '»';
  }

  /* «A 2 personas les falta el DNI. A 1 persona le falta la especialidad.» */
  function frasesDeFaltas(porPersona) {
    var cuenta = {}, orden = [];
    porPersona.forEach(function (x) {
      x.faltan.forEach(function (f) {
        var q = queFalta(f);
        if (!cuenta[q]) { cuenta[q] = 0; orden.push(q); }
        cuenta[q]++;
      });
    });
    return orden.map(function (q) {
      var n = cuenta[q];
      return 'A ' + n + (n === 1 ? ' persona le falta ' : ' personas les falta ') + q + '.';
    });
  }

  /* ---------- generar el lote ---------- */

  async function generar(a, plantillaDoc, h) {
    var personas = relacionadosDe(a);
    if (!personas.length) { U.aviso('Este asunto no tiene relacionados.', 'ambar'); return; }
    var I = (window.PlantillasDocumento && PlantillasDocumento._interno) || {};
    if (!I.leerConMembrete) return;
    var base = await I.leerConMembrete(plantillaDoc);
    if (!base) return;

    var fecha = U.hoyIso();
    var etiquetas = etiquetasDeLaPersona();
    var todos = [];
    for (var i = 0; i < personas.length; i++) {
      var rel = personas[i];
      var copia = Plantillas.asuntoParaPersona(a, rel);
      var valores = await Plantillas.valoresDePersona(a, rel, { fecha: fecha, plantilla: plantillaDoc, hito: h || null });
      var buffer = base;
      var tablas = null;
      if (window.TablasDatos) {
        try { tablas = await TablasDatos.prepararDocumento(base, copia, valores); buffer = tablas.buffer; }
        catch (e) { tablas = null; }
      }
      var r = await Docx.rellenar(buffer, valores);
      todos.push({ rel: rel, valores: valores, buffer: buffer, tablas: tablas, resultado: r });
    }

    /* Lo del asunto que falta, una sola vez para todos. */
    var delAsunto = [];
    todos.forEach(function (x) {
      var deTablas = (x.tablas && x.tablas.faltan) || [];
      x.resultado.faltan.forEach(function (f) {
        if (deTablas.indexOf(f) !== -1 || esDeLaPersona(f, etiquetas) || delAsunto.indexOf(f) !== -1) return;
        delAsunto.push(f);
      });
    });
    var aMano = null;
    if (delAsunto.length && window.WordFaltan) {
      var resp = await WordFaltan.preguntar(delAsunto);
      if (resp.accion === 'cancelar') { U.aviso('No se ha generado nada.', 'ambar'); return; }
      if (resp.accion === 'generar' && Object.keys(resp.aMano).length) aMano = resp.aMano;
    }

    var yaEsta;
    try { yaEsta = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { yaEsta = []; }

    var hechos = [], yaEstaban = [], fallidos = [], faltasPorPersona = [];
    for (var j = 0; j < todos.length; j++) {
      var x = todos[j];
      try {
        var resultado = x.resultado;
        if (aMano) {
          resultado = await Docx.rellenar(x.buffer, Object.assign({}, x.valores, { aMano: aMano }));
        }
        if (x.tablas && window.TablasDatos) resultado = await TablasDatos.resaltarResultado(resultado, x.tablas.faltan);
        var nombreDoc = Nombres.montarDocumento({
          fecha: fecha, tipo: plantillaDoc.tipoDocumento || 'DOCUMENTO',
          curso: ((plantillaDoc.texto || '') + ' ' + soloElNombre(x.rel.nombre)).trim(), extension: 'docx'
        });
        if (yaEsta.indexOf(nombreDoc) !== -1 || hechos.some(function (d) { return d.nombre === nombreDoc; })) {
          yaEstaban.push({ rel: x.rel, nombre: nombreDoc, correo: x.valores.correo || '', valores: x.valores });
          continue;
        }
        await I.guardarBlobEnCarpeta(a.handle, nombreDoc, resultado.blob);
        var faltanDeEl = resultado.faltan.filter(function (f) { return esDeLaPersona(f, etiquetas); });
        if (faltanDeEl.length) faltasPorPersona.push({ rel: x.rel, faltan: faltanDeEl });
        hechos.push({ rel: x.rel, nombre: nombreDoc, correo: x.valores.correo || '', valores: x.valores });
      } catch (e) {
        fallidos.push({ rel: x.rel, motivo: U.mensajeDeError(e) });
      }
    }

    await apuntar(a, h, plantillaDoc, hechos);
    return resumen(a, h, plantillaDoc, hechos, yaEstaban, fallidos, faltasPorPersona);
  }

  /* Lo accesorio: la nota del asunto, los documentos en el hito y el paso
     del guion. Si falla, en ámbar: los documentos ya están guardados. */
  async function apuntar(a, h, plantillaDoc, hechos) {
    if (!hechos.length) return;
    try {
      if (window.Notas) await Notas.anadir(a, 'Generados ' + hechos.length + ' «' + (plantillaDoc.nombre || plantillaDoc.tipoDocumento) + '», uno por relacionado');
      if (h && window.Hitos) {
        for (var i = 0; i < hechos.length; i++) await Hitos.anadirDocumento(a.nombre, h.id, hechos[i].nombre);
        await Hitos.anadirNota(a.nombre, h.id, 'Generados ' + hechos.length + ' documentos, uno por relacionado');
        if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, h.id, 'generar');
      }
    } catch (e) { U.accesorio('Documentos generados, pero no he podido apuntarlos en el hito', e); }
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
  }

  function nombreDe(rel) { return U.escapar(soloElNombre(rel.nombre) || rel.nombre); }

  async function resumen(a, h, plantillaDoc, hechos, yaEstaban, fallidos, faltasPorPersona) {
    var n = hechos.length;
    var frases = frasesDeFaltas(faltasPorPersona);
    var titulo = n + (n === 1 ? ' documento generado' : ' documentos generados');
    var html = '<p class="generar-cada-resumen"><strong>' + titulo + '.</strong>' +
      (frases.length ? ' ' + U.escapar(frases.join(' ')) : '') + '</p>';
    if (faltasPorPersona.length) {
      html += '<ul class="generar-cada-faltas">' + faltasPorPersona.map(function (x) {
        return '<li>' + nombreDe(x.rel) + ': falta ' + U.escapar(x.faltan.map(queFalta).join(', ')) + '</li>';
      }).join('') + '</ul>';
    }
    if (yaEstaban.length) {
      html += '<p class="nota">Ya estaban en la carpeta (no se han vuelto a hacer): ' +
        yaEstaban.map(function (x) { return nombreDe(x.rel); }).join(', ') + '.</p>';
    }
    if (fallidos.length) {
      html += '<p class="aviso aviso-rojo">No he podido hacer el de: ' +
        fallidos.map(function (x) { return nombreDe(x.rel) + ' (' + U.escapar(x.motivo) + ')'; }).join(', ') + '.</p>';
    }
    /* Los que ya estaban también se pueden mandar (a quien no lo tenga ya). */
    var paraEnviar = hechos.concat(yaEstaban);
    var sinCorreo = paraEnviar.filter(function (x) { return !x.correo; });
    if (sinCorreo.length) {
      html += '<p class="nota">Sin correo (mándaselo por Séneca): ' + sinCorreo.map(function (x) { return nombreDe(x.rel); }).join(', ') + '.</p>';
    }
    var conCorreo = paraEnviar.filter(function (x) { return x.correo; });
    var puedeEnviar = conCorreo.length && window.CorreoEnviar && CorreoEnviar.tieneConexion();
    if (conCorreo.length && !puedeEnviar) {
      html += '<p class="nota">Para «Enviar a cada uno», conecta antes el envío de correo en Ajustes › Mantenimiento.</p>';
    }
    U.aviso(titulo + (frases.length ? '. ' + frases.join(' ') : '.'), frases.length || fallidos.length ? 'ambar' : 'bueno');
    var ok = await U.preguntar(titulo, html, puedeEnviar ? 'Enviar a cada uno…' : 'Cerrar', !puedeEnviar);
    if (ok && puedeEnviar) await enviarACadaUno(a, h, conCorreo);
    return { hechos: hechos, yaEstaban: yaEstaban, fallidos: fallidos, faltas: faltasPorPersona };
  }

  /* ---------- un correo a cada uno ---------- */

  /* Un identificador fijo por asunto, documento y correo: el script no
     manda dos veces el mismo (js/correo-enviar.js, fila 130). */
  function idEnvioDe(a, documento, correo) {
    var t = a.nombre + '|' + documento + '|' + String(correo).toLowerCase();
    var h = 0;
    for (var i = 0; i < t.length; i++) { h = ((h << 5) - h + t.charCodeAt(i)) | 0; }
    return 'env-rel-' + (h >>> 0).toString(36) + '-' + t.length.toString(36);
  }

  function yaEnviado(ficha, documento, correo) {
    return ((ficha && ficha.enviosPorPersona) || []).some(function (e) {
      return e.documento === documento && String(e.correo).toLowerCase() === String(correo).toLowerCase();
    });
  }

  async function plantillaDeCorreo(a) {
    try {
      var datos = await Plantillas.cargar(App.E.gestor);
      var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
      var tipo = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
      var lista = Plantillas.deTipo(datos, categoria, tipo) || [];
      return lista.filter(function (p) { return /certificado|env[ií]o/i.test(p.nombre); })[0] || lista[0] || null;
    } catch (e) { return null; }
  }

  function saludoPara(x) {
    var natural = x.valores.nombreNatural || soloElNombre(x.rel.nombre);
    return x.rel.categoria === 'EMPRESAS' || x.rel.categoria === 'ADMINISTRACIONES' ? 'Buenos días:' : 'Hola, ' + natural + ':';
  }

  function cuerpoPara(x, plantilla) {
    var medio = plantilla ? Plantillas.rellenar(plantilla.texto, x.valores).texto
      : 'Le enviamos adjunto el documento «' + x.nombre.replace(/\.[A-Za-z0-9]{1,8}$/, '') + '».';
    return saludoPara(x) + '\n\n' + medio + '\n\n' + (x.valores.firma || '');
  }

  async function enviarACadaUno(a, h, conCorreo) {
    await App.cargarRegistro();
    var ficha = (App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || {};
    var pendientes = conCorreo.filter(function (x) { return !yaEnviado(ficha, x.nombre, x.correo); });
    var repetidos = conCorreo.length - pendientes.length;
    if (!pendientes.length) { U.aviso('Ya se había enviado a todos su documento.', 'ambar'); return; }
    var plantilla = await plantillaDeCorreo(a);
    var ok = await U.preguntar('Enviar a cada uno',
      '<p>Se mandará <strong>un correo a cada persona</strong>, con su documento adjunto' +
      (plantilla ? ' y el texto de «' + U.escapar(plantilla.nombre) + '»' : '') + ':</p>' +
      '<ul class="generar-cada-envios">' + pendientes.map(function (x) {
        return '<li>' + nombreDe(x.rel) + ' — ' + U.escapar(x.correo) + '</li>';
      }).join('') + '</ul>' +
      (repetidos ? '<p class="nota">' + repetidos + (repetidos === 1 ? ' ya lo tenía' : ' ya lo tenían') + ': no se le manda otra vez.</p>' : ''),
      'Confirmar y enviar');
    if (!ok) return;

    var enviados = [], fallos = [];
    for (var i = 0; i < pendientes.length; i++) {
      var x = pendientes[i];
      try {
        var fichero = await (await a.handle.getFileHandle(x.nombre)).getFile();
        var base64 = await CorreoAdjuntos.aBase64(fichero);
        var r = await CorreoEnviar.enviar({
          para: x.correo, cco: '', asunto: (window.CorreoNucleo && CorreoNucleo.asuntoDelCorreo) ? CorreoNucleo.asuntoDelCorreo(a) : a.nombre,
          cuerpo: cuerpoPara(x, plantilla), hilo: '',
          adjuntos: [{ nombre: x.nombre, tipo: fichero.type || 'application/octet-stream', base64: base64 }],
          idEnvio: idEnvioDe(a, x.nombre, x.correo)
        });
        if (!r || !r.ok) throw new Error((r && r.motivo) || 'El envío no ha salido bien.');
        enviados.push({ documento: x.nombre, correo: x.correo, cuando: U.ahora(), quien: App.E.usuario || '' });
      } catch (e) { fallos.push(nombreDe(x.rel) + ' (' + U.mensajeDeError(e) + ')'); }
    }

    if (enviados.length) {
      try {
        await App.cargarRegistro();
        var actual = (App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || {};
        await App.anotar(a.nombre, { enviosPorPersona: (actual.enviosPorPersona || []).concat(enviados) });
        if (window.Notas) await Notas.anadir(a, 'Correo enviado a ' + enviados.map(function (e) { return e.correo; }).join(', ') + ', cada uno con su documento');
      } catch (e) { U.accesorio('Enviados, pero no he podido apuntarlo en el asunto', e); }
    }
    if (fallos.length) U.aviso((enviados.length ? enviados.length + ' enviados. ' : '') + 'No he podido enviar a: ' + fallos.join(', ') + '.', 'malo');
    else U.aviso(enviados.length + (enviados.length === 1 ? ' correo enviado.' : ' correos enviados, uno a cada persona.'), 'bueno');
  }

  return {
    relacionadosDe: relacionadosDe, botonHTML: botonHTML, enganchar: enganchar, generar: generar,
    _interno: { idEnvioDe: idEnvioDe, yaEnviado: yaEnviado, cuerpoPara: cuerpoPara, esDeLaPersona: esDeLaPersona }
  };
})();
window.GenerarParaRelacionados = GenerarParaRelacionados;
