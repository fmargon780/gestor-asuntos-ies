/* ============================================================
   hitos-comunicar.js — el botón "Comunicar" de un hito (18-sep-2026,
   fila 60, docs/COMUNICAR-DESDE-EL-HITO.md).

   El texto vive en la guía del tipo (comunicacion.correo/seneca, por
   paso), no en el hito: aquí solo se lee por `origenGuia`, se rellenan
   sus huecos con los datos del asunto (los mismos de siempre,
   `Plantillas.valoresDeAsunto`) y se abre el cuadro de Correo o de
   Séneca ya con eso puesto, reutilizando `window.CorreoNucleo` (que
   fila 59 ya dejó preparado para recibir un texto ya resuelto, con
   "Pedir lo que falta"): nada de un camino nuevo para copiar o abrir
   Gmail, ni para dejar el rastro.

   Como js/hitos-requisitos.js: enganchado a window.Hitos (aunque aquí
   no añade ningún método al modelo, porque nada de esto se guarda en
   el hito — sección 3 del encargo), y con la pintura del botón en la
   ficha en el mismo fichero.

   Se carga después de js/hitos-requisitos.js y de js/correo.js.
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* Busca un paso (o un subpaso, dentro de una opción) por su id, en
     la guía tal y como está en memoria (síncrono, como en
     js/hitos-requisitos.js: no hace falta releer nada del disco). */
  /* A cualquier profundidad, desde la fila 95 (preguntas dentro de las
     respuestas). */
  function buscarPasoEnGuia(pasos, id) {
    for (var i = 0; i < (pasos || []).length; i++) {
      var p = pasos[i];
      if (p.id === id) return p;
      for (var j = 0; j < (p.opciones || []).length; j++) {
        var enc = buscarPasoEnGuia((p.opciones[j] && p.opciones[j].pasos) || [], id);
        if (enc) return enc;
      }
    }
    return null;
  }

  function tieneTexto(canal) { return !!(canal && canal.cuerpo && canal.cuerpo.trim()); }

  function comunicacionDe(a, hito) {
    if (!hito.origenGuia) return null;
    var pasos = (window.GuiasDelCentro && window.GuiasDelCentro.pasosDe(tipoDe(a))) || [];
    var origen = buscarPasoEnGuia(pasos, hito.origenGuia);
    return (origen && origen.comunicacion) || null;
  }

  var AMBOS_CANALES = ['correo', 'seneca'];

  /* Los canales que ofrece el botón de este hito. Síncrona, para
     poder decidir de un vistazo, al pintar la fila del hito, cuántos
     hacen falta (uno: abre directo; dos: el menú Correo/Séneca).

     Desde la fila 103 (23-sep-2026, docs/EL-HITO-MESA-DE-TRABAJO.md,
     sección 3), "Comunicar" sale siempre (salvo decision/noaplica,
     que ya lo decide botonHTML): con texto propio del paso, solo los
     canales que lo tengan, como hasta ahora; sin ninguno con texto
     (o sin comunicación propia del paso), los dos, porque entonces
     el cuadro se abre con el desplegable de plantillas del tipo, que
     vale para cualquiera de los dos. */
  function canalesDe(a, hito) {
    var c = comunicacionDe(a, hito);
    if (!c) return AMBOS_CANALES.slice();
    var salida = [];
    if (tieneTexto(c.correo)) salida.push('correo');
    if (tieneTexto(c.seneca)) salida.push('seneca');
    return salida.length ? salida : AMBOS_CANALES.slice();
  }

  /* ==========================================================
     EL DESTINATARIO (sección 5.1 del encargo)
     ========================================================== */

  var RE_CORREO = /[^\s,;<>()"]+@[^\s,;<>()"]+\.[A-Za-z]{2,}/g;

  /* Todas las direcciones que traiga cualquier columna de esa persona,
     como en js/correo-cuadro.js (`correosDe`, no expuesta desde allí:
     se repite aquí, es media docena de líneas). */
  function correosDePersona(persona) {
    var salida = [], vistos = {};
    if (!persona) return salida;
    Object.keys(persona.campos || {}).forEach(function (columna) {
      var trozos = String(persona.campos[columna] || '').match(RE_CORREO);
      if (!trozos) return;
      trozos.forEach(function (dir) {
        var clave = dir.toLowerCase();
        if (!vistos[clave]) { vistos[clave] = true; salida.push(dir); }
      });
    });
    return salida;
  }

  function tercero(a) {
    var f = a.ficha || {}, l = a.leido || {};
    if (f.tercero) return f.tercero;
    if (l.resto && window.Nombres) return Nombres.terceroDeResto(l.resto);
    return a.nombre;
  }

  function soloElNombre(texto) {
    return String(texto || '').replace(/\s+\S*\d\S*\s*$/, '').trim();
  }

  /* La persona (tercero) del asunto, tal y como la trae su CSV, como
     ya hace js/correo.js con la suya (`buscarPersona`, tampoco
     expuesta). */
  async function buscarPersonaDelAsunto(a) {
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = tercero(a);
    if (!categoria || !quien || !window.Datos || !window.App || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, quien, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, soloElNombre(quien), 1);
      return lista.length ? lista[0] : null;
    } catch (e) { return null; }
  }

  /* Devuelve { nombre, correoPreferente }: `nombre` para la constancia
     ("Comunicado a <nombre> por correo…"), `correoPreferente` para que
     js/correo.js proponga esa dirección en el cuadro de Correo (una, o
     varias separadas por coma: `LoPide.elegirDestinatarios`, que ya usa
     el cuadro de Correo, vuelca una lista así entera en "Otro correo"
     en cuanto no encuentra ninguna igual entre las de la ficha del
     tercero — que es justo el caso de un tutor o un relacionado, una
     persona distinta). En Séneca no hay manera de marcar un usuario
     IdEA concreto desde aquí: el cuadro se abre con la lista de
     siempre, sin marcar nada por su cuenta (nunca se bloquea el botón
     por eso, sección 5.1). */
  async function resolverDestinatario(a, hito) {
    var nombreTercero = soloElNombre(tercero(a));

    if (hito.responsable === 'tutor') {
      var persona = await buscarPersonaDelAsunto(a);
      if (persona && window.LoPide) {
        var t1 = LoPide.datosDeTutor(persona.campos, 1);
        if (t1.correo || t1.nombre) return { nombre: t1.nombre || 'el tutor legal 1', correoPreferente: t1.correo };
        var t2 = LoPide.datosDeTutor(persona.campos, 2);
        if (t2.correo || t2.nombre) return { nombre: t2.nombre || 'el tutor legal 2', correoPreferente: t2.correo };
      }
      return { nombre: 'el tutor', correoPreferente: '' };
    }

    if (hito.responsable === 'relacionado') {
      var relacionados = (a.ficha && a.ficha.relacionados) || [];
      if (!relacionados.length) return { nombre: nombreTercero, correoPreferente: '' };
      var resueltos = [];
      try { resueltos = (window.CorreoGrupos && await CorreoGrupos.resolverMiembros(relacionados)) || []; }
      catch (e) { resueltos = []; }
      var correos = [];
      resueltos.forEach(function (m) {
        correosDePersona(m.persona).forEach(function (dir) { if (correos.indexOf(dir) === -1) correos.push(dir); });
      });
      return {
        nombre: relacionados.map(function (r) { return r.nombre; }).join(', '),
        correoPreferente: correos.join(', ')
      };
    }

    /* Responsable del centro, o sin responsable: el tercero del asunto. */
    return { nombre: nombreTercero, correoPreferente: '' };
  }

  /* ==========================================================
     ABRIR EL CUADRO YA RELLENO (secciones 4-5 del encargo)
     ========================================================== */

  /* Los documentos ya apuntados a este hito que siguen de verdad en
     la carpeta (fila 103, sección 3): son los que van premarcados en
     "Documentos de este asunto" del cuadro de Correo. Solo tiene
     sentido en Correo, nunca en Séneca (ahí no hay adjuntos). */
  async function documentosDelHitoEnCarpeta(a, hito) {
    if (!(hito.documentos || []).length) return [];
    try {
      var enCarpeta = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; });
      return hito.documentos.filter(function (d) { return enCarpeta.indexOf(d) !== -1; });
    } catch (e) { return []; }
  }

  /* `opciones` (fila 109, la mesa del hito): { correos: [...] } manda
     sobre el destinatario resuelto, y { adjuntos: [...] } sobre los
     documentos premarcados. */
  async function comunicar(a, hito, canal, opciones) {
    var c = comunicacionDe(a, hito);
    var mensaje = c && c[canal];
    var destinatario = await resolverDestinatario(a, hito);
    if (opciones && opciones.correos && opciones.correos.length) destinatario.correoPreferente = opciones.correos.join(', ');
    if (opciones && opciones.nombres && opciones.nombres.length) destinatario.nombre = opciones.nombres.join(', ');

    var extra = {
      correoPreferente: destinatario.correoPreferente,
      comunicarHito: { claveAsunto: a.nombre, idHito: hito.id, nombreDestinatario: destinatario.nombre }
    };

    /* Con texto propio del paso: igual que hasta ahora, con los
       huecos ya resueltos. Sin él (fila 103): el cuadro se abre con
       el desplegable de plantillas del tipo, como el "Comunicar" de
       la cabecera, pero conservando el destinatario y la constancia
       de arriba. */
    if (mensaje && tieneTexto(mensaje)) {
      var valores = {};
      /* Con el hito (fila 102): {{HITO}} y {{PLAZO DEL HITO}} también aquí. */
      try { valores = await Plantillas.valoresDeAsunto(a, { hito: hito, conLoQueFalta: false }); } catch (e) { valores = {}; }
      extra.asuntoListo = Plantillas.rellenar(mensaje.asunto || '', valores).texto;
      extra.medioListo = Plantillas.rellenar(mensaje.cuerpo || '', valores).texto;
    }

    if (canal !== 'seneca') {
      extra.adjuntosMarcados = (opciones && opciones.adjuntos) ? opciones.adjuntos.slice() : await documentosDelHitoEnCarpeta(a, hito);
    }

    if (!window.CorreoNucleo || !window.CorreoNucleo.abrirCuadro) return;
    window.CorreoNucleo.abrirCuadro(a, canal === 'seneca', extra);
  }

  /* ==========================================================
     EL BOTÓN EN LA FICHA (sección 5)
     ========================================================== */

  var ETIQUETA_CANAL = { correo: 'Correo electrónico', seneca: 'Mensaje de Séneca' };

  /* Desde la fila 103: sale siempre, salvo en un hito "decision" o
     "noaplica" (mismo criterio que "Generar documento"). Antes solo
     salía si el paso tenía comunicación propia; canalesDe ya se
     encarga de ofrecer los dos canales cuando no la tiene. */
  function botonHTML(a, hito) {
    if (!hito || hito.clase === 'decision' || hito.estado === 'noaplica') return '';
    return '<button type="button" class="boton hito-comunicar-boton">Comunicar</button>';
  }

  function engancharBoton(div, a, hito) {
    var boton = div.querySelector('.hito-comunicar-boton');
    if (!boton) return;
    var canales = canalesDe(a, hito);
    if (canales.length === 1) {
      boton.onclick = function () { comunicar(a, hito, canales[0]); };
      return;
    }
    if (canales.length > 1 && window.FichaMenus) {
      FichaMenus.montar(boton, canales.map(function (canal) {
        return { texto: ETIQUETA_CANAL[canal], alPulsar: function () { comunicar(a, hito, canal); } };
      }));
    }
  }

  window.HitosComunicar = {
    canalesDe: canalesDe,
    comunicar: comunicar,
    resolverDestinatario: resolverDestinatario,
    buscarPersonaDelAsunto: buscarPersonaDelAsunto,
    correosDePersona: correosDePersona,
    botonHTML: botonHTML,
    engancharBoton: engancharBoton
  };
})();
