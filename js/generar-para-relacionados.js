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
     - Al terminar, un resumen que remite a «Enviar…» de la lista de personas
       (fila 295: el envío a todos vive en js/grupo-enviar.js).

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

  /* Fila 239: si este documento (misma plantilla, misma persona y mismo día) ya
     se generó y sigue en la carpeta, su nombre; si no, ''. */
  function nombreYaGenerado(a, nombresEnCarpeta, clave, fecha) {
    var docs = (a.ficha && a.ficha.documentos) || {};
    var numeros = Object.keys(docs).filter(function (n) { return docs[n].generadoDe === clave && docs[n].fecha === fecha; });
    for (var i = 0; i < numeros.length; i++) {
      var halladas = nombresEnCarpeta.filter(function (f) { return f.indexOf(numeros[i]) !== -1; });
      /* Fila 294: con su PDF hecho, es el PDF el que cuenta; un Word solo (se paró a medias) es «sin PDF». */
      var hallado = halladas.filter(function (f) { return /\.pdf$/i.test(f); })[0] || halladas[0];
      if (hallado) return hallado;
    }
    return '';
  }

  /* ---------- generar el lote ---------- */

  function claveDeGenerado(plantillaDoc, rel) {
    return (plantillaDoc.id || plantillaDoc.nombre || plantillaDoc.tipoDocumento || '') + '|' + (rel.categoria || '') + '|' + rel.nombre;
  }

  /* El Word ya rellenado de una persona (con lo que se ha escrito a mano y las tablas resaltadas). */
  async function resultadoDe(x, aMano) {
    var resultado = x.resultado;
    if (aMano) resultado = await Docx.rellenar(x.buffer, Object.assign({}, x.valores, { aMano: aMano }));
    if (x.tablas && window.TablasDatos) resultado = await TablasDatos.resaltarResultado(resultado, x.tablas.faltan);
    return resultado;
  }

  /* `opciones.soloA` (fila 294, «Volver a generar»): solo esa persona. */
  async function generar(a, plantillaDoc, h, opciones) {
    var personas = relacionadosDe(a);
    if (opciones && opciones.soloA) {
      personas = personas.filter(function (r) { return r.categoria === opciones.soloA.categoria && r.nombre === opciones.soloA.nombre; });
    }
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

    /* Fila 294: antes de hacer todos, uno de muestra (con una sola persona, no). */
    var porHacer = todos.filter(function (x) {
      var ya = nombreYaGenerado(a, yaEsta, claveDeGenerado(plantillaDoc, x.rel), fecha);
      return !ya || !/\.pdf$/i.test(ya);
    });
    if (window.GrupoGenerar && porHacer.length > 1) {
      var blobMuestra = (await resultadoDe(porHacer[0], aMano)).blob;
      var sigue = await GrupoGenerar.muestra(blobMuestra, soloElNombre(porHacer[0].rel.nombre) || porHacer[0].rel.nombre, porHacer.length);
      if (!sigue) { U.aviso('No se ha generado nada.', 'ambar'); return; }
    }

    var hechos = [], yaEstaban = [], fallidos = [], faltasPorPersona = [], parado = false;
    var barra = window.GrupoGenerar ? GrupoGenerar.barra(todos.length) : null;
    for (var j = 0; j < todos.length; j++) {
      var x = todos[j];
      if (barra) { if (barra.parado()) { parado = true; break; } barra.avanzar(j + 1); }
      try {
        var resultado = await resultadoDe(x, aMano);
        /* Fila 239: cada documento lleva su número, y la persona (antes en
           el nombre) va a la ficha. Para no repetirlo si se vuelve a pulsar,
           se recuerda de quién y de qué plantilla salió. */
        var textoDoc = ((plantillaDoc.texto || '') + ' ' + soloElNombre(x.rel.nombre)).trim();
        var claveGenerado = claveDeGenerado(plantillaDoc, x.rel);
        var yaHecho = nombreYaGenerado(a, yaEsta, claveGenerado, fecha);
        if (yaHecho && window.GrupoGenerar && !/\.pdf$/i.test(yaHecho)) {
          /* Fila 294: tiene el Word pero no el PDF (se paró a medias): solo se le hace el PDF. */
          var soloPdf = await GrupoGenerar.soloElPdf(a, yaHecho);
          hechos.push({ rel: x.rel, nombre: soloPdf, correo: x.valores.correo || '', valores: x.valores, claveGenerado: claveGenerado });
          continue;
        }
        if (yaHecho || hechos.some(function (d) { return d.claveGenerado === claveGenerado; })) {
          yaEstaban.push({ rel: x.rel, nombre: yaHecho, correo: x.valores.correo || '', valores: x.valores });
          continue;
        }
        var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
        var nombreDoc = Nombres.montarDocumento({
          fecha: fecha, tipo: plantillaDoc.tipoDocumento || 'DOCUMENTO',
          curso: textoDoc, extension: 'docx', numeroDoc: numeroDoc
        });
        await I.guardarBlobEnCarpeta(a.handle, nombreDoc, resultado.blob);
        if (window.DocumentosDatos) {
          try {
            await DocumentosDatos.anotar(a.nombre, numeroDoc, {
              tipo: plantillaDoc.tipoDocumento || 'DOCUMENTO', fecha: fecha, registros: [], campos: [],
              texto: textoDoc, generadoDe: claveGenerado, hito: h && h.id ? h.id : ''
            });
          } catch (eDatos) { /* accesorio */ }
        }
        var faltanDeEl = resultado.faltan.filter(function (f) { return esDeLaPersona(f, etiquetas); });
        if (faltanDeEl.length) faltasPorPersona.push({ rel: x.rel, faltan: faltanDeEl });
        /* Fila 294: su PDF, con el mismo nombre y su referencia; en el hito se apunta el PDF, no el Word. */
        if (window.GrupoGenerar) {
          try { nombreDoc = await GrupoGenerar.hacerPdf(a, nombreDoc, resultado.blob, numeroDoc); }
          catch (ePdf) {
            fallidos.push({ rel: x.rel, motivo: 'su Word está hecho, pero no el PDF: ' + U.mensajeDeError(ePdf) });
            continue;
          }
        }
        hechos.push({ rel: x.rel, nombre: nombreDoc, correo: x.valores.correo || '', valores: x.valores, claveGenerado: claveGenerado });
      } catch (e) {
        fallidos.push({ rel: x.rel, motivo: U.mensajeDeError(e) });
      }
    }

    if (barra) barra.quitar();
    if (window.GrupoGenerar) await GrupoGenerar.ordenar(a);   /* los Word con su PDF pasan a «Versiones previas» */
    await apuntar(a, h, plantillaDoc, hechos);
    var salida = await resumen(a, h, plantillaDoc, hechos, yaEstaban, fallidos, faltasPorPersona, parado ? todos.length : 0);
    if (window.PersonasDelGrupo) PersonasDelGrupo.repintar(a);   /* fila 293: la tabla «Personas del grupo» se pone al día sola */
    return salida;
  }

  /* Lo accesorio: la nota del asunto, los documentos en el hito y el paso
     del guion. Si falla, en ámbar: los documentos ya están guardados. */
  async function apuntar(a, h, plantillaDoc, hechos) {
    if (!hechos.length) return;
    try {
      if (window.Notas && !(h && window.Hitos)) await Notas.anadirAuto(a, 'Generados ' + hechos.length + ' «' + (plantillaDoc.nombre || plantillaDoc.tipoDocumento) + '», uno por relacionado');
      if (h && window.Hitos) {
        for (var i = 0; i < hechos.length; i++) await Hitos.anadirDocumento(a.nombre, h.id, hechos[i].nombre);
        await Hitos.anadirNota(a.nombre, h.id, 'Generados ' + hechos.length + ' documentos, uno por relacionado');
        if (Hitos.marcarGuionPorAccion) await Hitos.marcarGuionPorAccion(a, h.id, 'generar');
      }
    } catch (e) { U.accesorio('Documentos generados, pero no he podido apuntarlos en el hito', e); }
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
  }

  function nombreDe(rel) { return U.escapar(soloElNombre(rel.nombre) || rel.nombre); }

  async function resumen(a, h, plantillaDoc, hechos, yaEstaban, fallidos, faltasPorPersona, paradoDeTotal) {
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
    if (paradoDeTotal) {
      html += '<p class="nota">Lo has parado: se han hecho ' + n + ' de ' + paradoDeTotal + '. Vuelve a pulsar «Generar para todos» para terminar; no se repite ninguno.</p>';
    }
    if (yaEstaban.length) {
      html += '<p class="nota">Ya estaban en la carpeta (no se han vuelto a hacer): ' +
        yaEstaban.map(function (x) { return nombreDe(x.rel); }).join(', ') + '.</p>';
    }
    if (fallidos.length) {
      html += '<p class="aviso aviso-rojo">No he podido hacer el de: ' +
        fallidos.map(function (x) { return nombreDe(x.rel) + ' (' + U.escapar(x.motivo) + ')'; }).join(', ') + '.</p>';
    }
    html += '<p class="nota">Para enviarlos: «Enviar…», en la lista de personas.</p>';
    U.aviso(titulo + (frases.length ? '. ' + frases.join(' ') : '.'), frases.length || fallidos.length ? 'ambar' : 'bueno');
    await U.preguntar(titulo, html, 'Cerrar', true);
    return { hechos: hechos, yaEstaban: yaEstaban, fallidos: fallidos, faltas: faltasPorPersona };
  }

  return {
    relacionadosDe: relacionadosDe, botonHTML: botonHTML, enganchar: enganchar, generar: generar,
    _interno: { esDeLaPersona: esDeLaPersona }
  };
})();
window.GenerarParaRelacionados = GenerarParaRelacionados;
