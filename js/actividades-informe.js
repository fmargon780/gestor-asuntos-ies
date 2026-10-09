/* ============================================================
   actividades-informe.js — el aviso al claustro de una actividad
   extraescolar, con su informe en PDF (9-oct-2026, fila 309,
   docs/ACTIVIDADES-EXTRAESCOLARES-AVISO.md).

   - El informe: los datos de la actividad y el alumnado que va, por
     unidades. `datos` (pura) lo prepara; `pdfDe` lo dibuja con pdf-lib y
     el membrete del centro, como el PDF de liquidación
     (js/por-liquidar-liquidar.js); `guardar` lo deja en la carpeta del
     asunto con el nombre de siempre (fila 239), tipo INFORME ACTIVIDAD.
   - «Avisar al claustro» / «Volver a avisar» (`avisar`): genera el
     informe y abre el cuadro de Correo de siempre con el informe ya
     marcado, la plantilla «Aviso de actividad extraescolar» y el grupo del
     profesorado en la copia oculta. Nada sale sin que alguien pulse
     «Enviar».
   - Que se sepa que se avisó (`alEnviar`) y cuándo hay que volver a
     avisar (`cambios`): `ficha.avisosActividad`.
   - Los huecos {{ACTIVIDAD…}} de las plantillas (`valores`).
   ============================================================ */
var ActividadesInforme = (function () {

  var TIPO_DOCUMENTO = 'INFORME ACTIVIDAD';
  var GENERADO_DE = 'informe-actividad';
  var NOMBRE_PLANTILLA = 'Aviso de actividad extraescolar';
  var TEXTO_PLANTILLA = 'Os adjuntamos el informe de la actividad «{{ACTIVIDAD}}», que se celebra {{ACTIVIDAD FECHAS}} en {{ACTIVIDAD LUGAR}}. ' +
    'En él está el alumnado que participa, por unidades, y el profesorado que lo acompaña.';

  function esc(t) { return U.escapar(String(t === undefined || t === null ? '' : t)); }
  function porNombre(a, b) { var x = U.normalizar(a), y = U.normalizar(b); return x < y ? -1 : (x > y ? 1 : 0); }
  function soloElNombre(t) { return String(t || '').replace(/\s+\S*\d\S*\s*$/, '').trim(); }
  function natural(t) { return window.Plantillas && Plantillas.nombreNaturalDe ? Plantillas.nombreNaturalDe(t, 'PERSONAL') : String(t || ''); }

  /* ---------- lo que lleva el informe (puro) ---------- */

  /* `a`: el asunto (su ficha lleva el alumnado); `act`: la actividad del registro; `todos`: el alumnado matriculado. */
  function datos(a, act, todos) {
    var ficha = (a && a.ficha) || {};
    var rel = (ficha.relacionados || []).filter(function (r) { return r && r.categoria === 'ALUMNADO'; });
    var porTexto = {};
    (todos || []).forEach(function (p) { porTexto[App.textoTercero(p)] = p; });
    var van = [], sin = [];
    rel.forEach(function (r) {
      var p = porTexto[r.nombre];
      if (p && String(p.unidad || '').trim()) van.push({ nombre: soloElNombre(p.nombre || r.nombre), unidad: String(p.unidad).trim() });
      else sin.push(soloElNombre(p ? p.nombre : r.nombre));
    });
    var unidades = Actividades.unidadesDe(van, todos || []).map(function (u) {
      return {
        unidad: u.unidad, titulo: u.unidad + ' · van ' + u.van + ' de ' + u.de,
        nombres: van.filter(function (p) { return p.unidad === u.unidad; }).map(function (p) { return p.nombre; }).sort(porNombre)
      };
    });
    var filas = [['Fecha', Actividades.fechasLegibles(act)], ['Salida', act.salida], ['Regreso', act.regreso], ['Lugar', act.lugar], ['Departamento', act.departamento]]
      .filter(function (f) { return f[1]; });
    function nombresDe(papel) { return act.profesorado.filter(function (p) { return papel === 'organiza' ? p.papel === 'organiza' : p.papel !== 'organiza'; }).map(function (p) { return natural(p.nombre); }); }
    return {
      titulo: 'Actividad extraescolar', nombre: act.nombre, filas: filas,
      organiza: nombresDe('organiza'), acompana: nombresDe('acompana'),
      total: rel.length, unidades: unidades, sinUnidad: sin.sort(porNombre)
    };
  }

  /* Quién ha entrado o salido desde el último aviso. `ahora`: los nombres del alumnado de ahora; `ultimo`: el último aviso. */
  function cambios(ahora, ultimo) {
    var antes = (ultimo && ultimo.personas) || [], dentro = {}, estaban = {};
    antes.forEach(function (n) { estaban[n] = true; });
    (ahora || []).forEach(function (n) { dentro[n] = true; });
    return {
      mas: (ahora || []).filter(function (n) { return !estaban[n]; }),
      menos: antes.filter(function (n) { return !dentro[n]; })
    };
  }

  function textoCambios(c) {
    var partes = [];
    if (c.mas.length) partes.push(c.mas.length + (c.mas.length === 1 ? ' persona más' : ' personas más'));
    if (c.menos.length) partes.push(c.menos.length + ' menos');
    return partes.length ? 'La lista ha cambiado desde el aviso: ' + partes.join(', ') + '.' : '';
  }

  /* Los huecos {{ACTIVIDAD…}} de una actividad (claves como las de js/plantillas.js). */
  function valores(act) {
    if (!act) return {};
    return {
      'actividad': act.nombre, 'actividad fechas': Actividades.fechasLegibles(act), 'actividad lugar': act.lugar,
      'actividad departamento': act.departamento, 'actividad salida': act.salida, 'actividad regreso': act.regreso,
      'actividad alumnado': String(act.alumnado), 'actividad profesorado': act.profesorado.map(function (p) { return natural(p.nombre); }).join(', ')
    };
  }

  /* ---------- el PDF ---------- */

  var EXTRA_WINANSI = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
  function limpio(t) {
    return String(t || '').normalize('NFC').split('').map(function (c) {
      var n = c.charCodeAt(0);
      if (n === 9) return ' ';
      if ((n >= 32 && n <= 126) || (n >= 160 && n <= 255) || EXTRA_WINANSI.indexOf(c) !== -1) return c;
      return '?';
    }).join('');
  }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function fechaHora(d) { return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes()); }

  async function pdfDe(d) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var negrita = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    var gris = PDFLib.rgb(0.35, 0.35, 0.35), negro = PDFLib.rgb(0, 0, 0), raya = PDFLib.rgb(0.75, 0.75, 0.75);
    var ANCHO = 595.28, ALTO = 841.89, M = 40, FIN = M + 30;
    var pagina, y, imagen = null;
    if (window.Membrete && Membrete.montar) {
      try { var m = await Membrete.montar({ conLogoCentro: true }); if (m && m.bytes) imagen = await doc.embedPng(m.bytes); }
      catch (e) { imagen = null; }
    }
    function texto(t, x, yy, tam, f, color) { pagina.drawText(limpio(t), { x: x, y: yy, size: tam, font: f || normal, color: color || negro }); }
    function nuevaPagina() { pagina = doc.addPage([ANCHO, ALTO]); y = ALTO - M; }
    function sitio(alto) { if (y - alto < FIN) nuevaPagina(); }
    function lineasDe(t, f, tam, ancho) {
      var palabras = limpio(t).split(/\s+/).filter(Boolean), salida = [], linea = '';
      palabras.forEach(function (p) {
        var prueba = linea ? linea + ' ' + p : p;
        if (f.widthOfTextAtSize(prueba, tam) <= ancho || !linea) linea = prueba; else { salida.push(linea); linea = p; }
      });
      if (linea) salida.push(linea);
      return salida;
    }

    nuevaPagina();
    if (imagen) {
      var anchoImg = ANCHO - 2 * M, altoImg = anchoImg * imagen.height / imagen.width;
      pagina.drawImage(imagen, { x: M, y: y - altoImg, width: anchoImg, height: altoImg });
      y -= altoImg + 12;
    }
    texto(d.titulo, M, y, 18, negrita); y -= 22;
    lineasDe(d.nombre, negrita, 12.5, ANCHO - 2 * M).forEach(function (l) { texto(l, M, y, 12.5, negrita); y -= 16; });
    y -= 6;

    /* Los datos, en dos columnas. */
    var mitad = (ANCHO - 2 * M) / 2, filasDatos = Math.ceil(d.filas.length / 2), yIni = y;
    d.filas.forEach(function (f, i) {
      var col = i < filasDatos ? 0 : 1, fila = col === 0 ? i : i - filasDatos, x = M + col * mitad, yy = yIni - fila * 15;
      var etiqueta = f[0] + ': ';
      texto(etiqueta, x, yy, 10.5, negrita);
      lineasDe(f[1], normal, 10.5, mitad - 10 - negrita.widthOfTextAtSize(limpio(etiqueta), 10.5)).slice(0, 1)
        .forEach(function (l) { texto(l, x + negrita.widthOfTextAtSize(limpio(etiqueta), 10.5), yy, 10.5, normal); });
    });
    y = yIni - filasDatos * 15 - 6;

    /* El profesorado. */
    [['Organiza', d.organiza], ['Acompaña', d.acompana]].forEach(function (par) {
      if (!par[1].length) return;
      var etiqueta = par[0] + ': ', ancho = ANCHO - 2 * M - negrita.widthOfTextAtSize(limpio(etiqueta), 10.5);
      var lineas = lineasDe(par[1].join(', '), normal, 10.5, ancho);
      sitio(lineas.length * 14);
      texto(etiqueta, M, y, 10.5, negrita);
      lineas.forEach(function (l, i) { texto(l, M + negrita.widthOfTextAtSize(limpio(etiqueta), 10.5), y, 10.5, normal); y -= 14; });
    });
    y -= 8;
    sitio(40);
    texto('Alumnado que va: ' + d.total, M, y, 13, negrita); y -= 8;
    pagina.drawLine({ start: { x: M, y: y }, end: { x: ANCHO - M, y: y }, thickness: 0.6, color: raya });
    y -= 18;

    /* Cada unidad, con sus nombres en tres columnas (de arriba abajo). Si cabe entera en una página, no se parte. */
    var grupos = d.unidades.map(function (u) { return { titulo: u.titulo, nombres: u.nombres }; });
    if (d.sinUnidad.length) grupos.push({ titulo: 'Sin unidad', nombres: d.sinUnidad });
    var FILA = 12.5, ANCHO_COL = (ANCHO - 2 * M) / 3, UTIL = ALTO - 2 * M - 30;
    grupos.forEach(function (g) {
      /* Reparto en tres columnas lo más parejo posible (de arriba abajo): 4 nombres, 2 + 1 + 1. */
      var tam = [0, 1, 2].map(function (c) { return Math.floor(g.nombres.length / 3) + (c < g.nombres.length % 3 ? 1 : 0); });
      var filas = tam[0], alto = 22 + filas * FILA;
      if (alto <= UTIL) sitio(alto); else sitio(22 + FILA);
      texto(g.titulo, M, y, 11, negrita); y -= 15;
      var inicio = [0, tam[0], tam[0] + tam[1]];
      for (var r = 0; r < filas; r++) {
        sitio(FILA);
        for (var c = 0; c < 3; c++) {
          var n = r < tam[c] ? g.nombres[inicio[c] + r] : '';
          if (!n) continue;
          var s = limpio(n);
          if (normal.widthOfTextAtSize(s, 9) > ANCHO_COL - 8) {
            while (s.length > 1 && normal.widthOfTextAtSize(s + '...', 9) > ANCHO_COL - 8) s = s.slice(0, -1);
            s += '...';
          }
          texto(s, M + c * ANCHO_COL, y, 9, normal);
        }
        y -= FILA;
      }
      y -= 8;
    });

    var ahora = fechaHora(new Date()), paginas = doc.getPages();
    paginas.forEach(function (p, i) {
      pagina = p;
      var num = 'Página ' + (i + 1) + ' de ' + paginas.length;
      texto(num, ANCHO - M - normal.widthOfTextAtSize(num, 8), 28, 8, normal, gris);
      texto('Generado el ' + ahora, M, 28, 8, normal, gris);
    });
    doc.setTitle(limpio('Actividad extraescolar: ' + d.nombre));
    return doc.save();
  }

  /* ---------- guardarlo en el asunto ---------- */

  async function asegurarTipoDeDocumento() {
    if (!window.App || !App.E || !Array.isArray(App.E.tiposDocumento)) return;
    if (App.E.tiposDocumento.indexOf(TIPO_DOCUMENTO) !== -1) return;
    if (window.Borrados && Borrados.revivir) await Borrados.revivir(App.E.gestor, 'tiposDocumento', TIPO_DOCUMENTO);
    App.E.tiposDocumento.push(TIPO_DOCUMENTO);
    await App.guardarTiposDocumento();
  }

  /* Devuelve el nombre del PDF guardado en la carpeta del asunto. */
  async function guardar(a, bytes) {
    if (!a || !a.handle) throw new Error('No encuentro la carpeta del asunto.');
    try { await asegurarTipoDeDocumento(); } catch (e) { U.accesorio('No he podido dar de alta el tipo de documento ' + TIPO_DOCUMENTO, e); }
    var fecha = U.hoyIso();
    var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
    var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: TIPO_DOCUMENTO, extension: 'pdf', numeroDoc: numeroDoc });
    await Carpetas.escribirBytes(a.handle, nombre, bytes, 'application/pdf');
    try {
      await DocumentosDatos.anotar(a.nombre, numeroDoc, { tipo: TIPO_DOCUMENTO, fecha: fecha, registros: [], campos: [], texto: '', generadoDe: GENERADO_DE });
    } catch (e) { U.accesorio('El informe está guardado, pero no he podido apuntar sus datos en la ficha', e); }
    return nombre;
  }

  /* ---------- la plantilla de correo y el grupo ---------- */

  /* La plantilla «Aviso de actividad extraescolar»: se crea sola si no existe, colgada del tipo del asunto. Nunca pisa una. */
  async function asegurarPlantilla(a) {
    var gestor = App.E.gestor;
    var datosP = await Plantillas.cargar(gestor);
    var hay = (datosP.lista || []).filter(function (p) { return p.nombre === NOMBRE_PLANTILLA; })[0];
    if (hay) return hay.id;
    var tipo = App.tipoDeAsunto(a);
    var categoria = (window.Nombres && Nombres.categoriaDeTipo) ? Nombres.categoriaDeTipo(App.E.tipos, tipo) : '';
    var id = Plantillas.idNuevo();
    await Plantillas.guardar(gestor, function (actual) {
      if (!actual.lista.some(function (p) { return p.nombre === NOMBRE_PLANTILLA; })) {
        actual.lista.push({ id: id, tipo: tipo, categoria: categoria, nombre: NOMBRE_PLANTILLA, texto: TEXTO_PLANTILLA });
      }
      return actual;
    });
    var despues = (await Plantillas.cargar(gestor)).lista.filter(function (p) { return p.nombre === NOMBRE_PLANTILLA; })[0];
    return despues ? despues.id : id;
  }

  /* El grupo que recibe el aviso: el elegido en Ajustes o, si no, el que se llame «Profesorado» o «Claustro». */
  function grupoDeAviso() {
    var lista = (window.Grupos && Grupos.lista()) || [];
    var id = (App.E.registro && App.E.registro.ajustesAvisos || {}).grupoActividades;
    var g = id ? lista.filter(function (x) { return x.id === id; })[0] : null;
    if (!g) g = lista.filter(function (x) { var n = U.normalizar(x.nombre); return n === 'profesorado' || n === 'claustro'; })[0];
    return g || null;
  }

  /* ---------- «Avisar al claustro» ---------- */

  function alumnadoDeAhora(a) {
    return ((a.ficha && a.ficha.relacionados) || []).filter(function (r) { return r && r.categoria === 'ALUMNADO'; }).map(function (r) { return r.nombre; });
  }

  function ultimoAviso(a) {
    var l = (a.ficha && a.ficha.avisosActividad) || [];
    return l.length ? l[l.length - 1] : null;
  }

  function fechaDelAviso(av) { return Actividades.fechaCorta(String(av.cuando || '').slice(0, 10)); }

  /* Genera el informe y abre el cuadro de Correo. `volver`: es un aviso que sustituye a otro. */
  async function avisar(a, act) {
    var ultimo = ultimoAviso(a);
    var nombreInforme;
    try {
      var todos = await Actividades.alumnadoMatriculado();
      var bytes = await pdfDe(datos(a, act, todos));
      nombreInforme = await guardar(a, bytes);
      if (window.FichaDocumentos) { try { FichaDocumentos.pintar(a); } catch (e2) { /* solo pintar */ } }   /* que «Documentos de la carpeta» ya lo enseñe */
    } catch (e) { U.fallo('No he podido preparar el informe de la actividad', e); return; }
    var idPlantilla = '';
    try { idPlantilla = await asegurarPlantilla(a); } catch (e) { U.accesorio('No he podido preparar la plantilla del aviso', e); }
    try { await Grupos.cargar(); } catch (e) { /* se usa lo que haya */ }
    var grupo = grupoDeAviso();
    var extra = {
      adjuntosMarcados: [nombreInforme], plantilla: idPlantilla, grupoInicial: grupo ? grupo.id : '',
      asuntoListo: 'Actividad extraescolar: ' + act.nombre + ' (' + Actividades.fechasLegibles(act) + ')',
      saludo: ultimo ? 'Este aviso sustituye al enviado el ' + fechaDelAviso(ultimo) + '.\n\nBuenas:' : 'Buenas:',
      avisoActividad: { informe: nombreInforme, personas: alumnadoDeAhora(a) }
    };
    if (!grupo) {
      extra.avisoAmbar = 'No hay ningún grupo con el profesorado. Créalo en Ajustes → Grupos de personas.';
      extra.avisoEnlace = { texto: 'Ir a Grupos de personas', alPulsar: function () {
        var cerrar = document.getElementById('cuadro-aceptar');
        if (cerrar) cerrar.click();
        App.irASeccionDeAjustes('#bloque-grupos-personas');
      } };
    }
    await CorreoNucleo.abrirCuadro(a, false, extra);
  }

  /* Tras enviarse de verdad el correo abierto desde «Avisar al claustro» (lo llama js/correo-cuadro.js). */
  async function alEnviar(a, aviso) {
    if (!a || !aviso) return;
    var nuevo = { cuando: U.ahora(), quien: App.E.usuario || '', documento: aviso.informe || '', personas: aviso.personas || [] };
    try {
      await App.anotarLista(a.nombre, 'avisosActividad', { anadir: [nuevo], identidad: function (x) { return (x && x.cuando) || ''; } });
      a.ficha = (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha;
      if (window.ActividadesFicha && ActividadesFicha.pintar) ActividadesFicha.pintar(a);
    } catch (e) { U.accesorio('El aviso ha salido, pero no he podido apuntarlo en el asunto', e); }
  }

  /* ---------- lo que dice la tarjeta ---------- */

  /* { linea, ambar, boton }: «Aviso enviado el …» / «Sin avisar al claustro», y si la lista ha cambiado desde el aviso. */
  function estadoDelAviso(a) {
    var ultimo = ultimoAviso(a);
    if (!ultimo) return { linea: 'Sin avisar al claustro', ambar: '', boton: 'Avisar al claustro' };
    var c = cambios(alumnadoDeAhora(a), ultimo);
    return { linea: 'Aviso enviado el ' + fechaDelAviso(ultimo), ambar: textoCambios(c), boton: textoCambios(c) ? 'Volver a avisar' : 'Avisar al claustro' };
  }

  /* ---------- Ajustes → El centro ---------- */

  function pintarAjustes() {
    var campo = document.getElementById('grupo-aviso-actividades');
    if (!campo || !window.Grupos) return;
    var actual = (App.E.registro && App.E.registro.ajustesAvisos || {}).grupoActividades || '';
    campo.innerHTML = '<option value="">(el grupo «Profesorado» o «Claustro»)</option>' +
      Grupos.lista().map(function (g) { return '<option value="' + esc(g.id) + '"' + (g.id === actual ? ' selected' : '') + '>' + esc(g.nombre) + '</option>'; }).join('');
    campo.onchange = async function () {
      try {
        await App.guardarRegistroFresco(function (registro) {
          registro.ajustesAvisos = registro.ajustesAvisos || {};
          registro.ajustesAvisos.grupoActividades = campo.value;
        });
        U.aviso('Guardado.', 'bueno');
      } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    };
  }

  return {
    TIPO_DOCUMENTO: TIPO_DOCUMENTO, NOMBRE_PLANTILLA: NOMBRE_PLANTILLA, GENERADO_DE: GENERADO_DE,
    datos: datos, cambios: cambios, textoCambios: textoCambios, valores: valores, pdfDe: pdfDe, guardar: guardar,
    asegurarPlantilla: asegurarPlantilla, grupoDeAviso: grupoDeAviso, avisar: avisar, alEnviar: alEnviar,
    estadoDelAviso: estadoDelAviso, pintarAjustes: pintarAjustes
  };
})();
window.ActividadesInforme = ActividadesInforme;
