/* ============================================================
   nombres-montar.js — montar el nombre de un asunto, con sus topes y el grupo (fila 536: trozo de js/nombres.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/nombres.js.
   ============================================================ */
var NombresNucleo = NombresNucleo || {};
(function () {

  var I = NombresNucleo;
  function acortarNombrePila() { return I.acortarNombrePila.apply(this, arguments); }

  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): los nombres no
     pasan de un largo seguro (Windows no sincroniza rutas de más de 260
     caracteres). Carpeta de asunto: 150 como mucho; nombre de documento:
     120, más la extensión. */
  var TOPE_ASUNTO = 150;
  var TOPE_DOCUMENTO = 120;

  /* Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2): con la ruta
     de la carpeta ARCHIVO ya señalada, el hueco de verdad lo calcula
     `Nombres.topes()` (js/nombres-topes.js, cargado justo después de
     este fichero), contando la ruta completa dentro de Dropbox. Sin
     ella, se quedan los fijos de arriba, tal cual. */
  function topesDeHoy(tercero, categoria) {
    if (typeof window !== 'undefined' && window.Nombres && typeof window.Nombres.topes === 'function') {
      return window.Nombres.topes(tercero, categoria);
    }
    return { asunto: TOPE_ASUNTO, documento: TOPE_DOCUMENTO };
  }

  function unir(partes) { return U.limpiarNombre(partes.filter(function (p) { return p; }).join(' ')); }

  /* `antes` y `despues` no se tocan nunca; `medio` se recorta desde el
     final (lo último de `medio`, lo primero que se acorta). */
  function ajustarAlTope(antes, medio, despues, tope) {
    var m = medio.filter(function (p) { return p; });
    var recortado = false;
    var nombre = unir(antes.concat(m, despues));
    while (nombre.length > tope && m.length) {
      recortado = true;
      var i = m.length - 1;
      var queda = m[i].length - (nombre.length - tope);
      if (queda >= 3) m[i] = U.limpiarNombre(m[i].slice(0, queda));
      else m.splice(i, 1);
      nombre = unir(antes.concat(m, despues));
    }
    /* Fila 177: ni la fecha, el tipo, el año académico, el grupo ni el
       tercero se recortan nunca, así que si ellos solos ya pasan del
       tope (una ruta de Dropbox larga y un tercero largo, sobre todo),
       el nombre se queda sin caber por mucho que se recorte el texto
       libre. Quien llama tiene que avisar y no crear nada, en vez de
       guardar un nombre que luego no sincroniza. */
    return { nombre: nombre, recortado: recortado, noCabe: nombre.length > tope };
  }

  /* El nombre de la carpeta y si ha habido que recortarlo. Se recorta
     primero la descripción (el texto libre) y después los campos del
     tipo, por el final. Nunca la fecha, el tipo, el año académico, el
     grupo ni el tercero con su número. */
  function montarAsunto(datos) {
    /* Fila 239 (docs/NOMBRES-FIJOS-CON-NUMERO.md): con número de asunto,
       la estructura es fija, `AAMMDD A26-0137 TIPO Tercero`, y NUNCA se
       recorta: año académico, grupo, campos y texto libre no entran en
       el nombre (siguen en la ficha). Sin número (asuntos de antes), la
       estructura de siempre. */
    if (datos.numero) {
      var corto = acortarNombrePila(datos.tercero);
      var fijo = unir([U.aAaMmDd(datos.fecha), datos.numero, U.limpiarNombre(datos.tipo).toUpperCase(),
        corto]);
      var cabe = typeof window !== 'undefined' && window.Nombres && typeof window.Nombres.cabeEnRuta === 'function'
        ? window.Nombres.cabeEnRuta(fijo, corto, datos.categoria) : { cabe: true };
      return { nombre: fijo, recortado: false, noCabe: !cabe.cabe, margen: cabe.margen };
    }
    var antes = [U.aAaMmDd(datos.fecha), U.limpiarNombre(datos.tipo).toUpperCase()];
    if (datos.curso) antes.push(U.limpiarNombre(datos.curso));
    if (datos.grupo) antes.push(U.limpiarNombre(datos.grupo));
    var medio = (datos.campos || []).map(function (v) { return U.limpiarNombre(v); });
    if (datos.descripcion) medio.push(U.limpiarNombre(datos.descripcion));
    var tope = topesDeHoy(datos.tercero, datos.categoria).asunto;
    return ajustarAlTope(antes, medio, [U.limpiarNombre(datos.tercero)], tope);
  }

  /* ---------- la abreviatura del grupo ----------

     Séneca escribe la unidad larga: "1º A", "1º de E.S.O. A",
     "2º Bachillerato B". En el nombre de una carpeta eso ocupa demasiado.

     La abreviatura lleva tres cosas: el nivel, la etapa y la letra.
     La etapa NO se escribe en la ESO, porque es lo normal en el centro,
     pero SÍ en Bachillerato y en Formación Profesional. Si no se escribiera,
     un 1ºA de Bachillerato y un 1ºA de la ESO se llamarían igual, y son
     dos grupos distintos.

         1º A          (ESO)            ->  1ºA
         2º Bach B     (Bachillerato)   ->  2ºBachB
         1º CFGM A     (FP)             ->  1ºFPA                       */
  function sinTildes(v) { return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function etapaDe(texto) {
    if (/bach/i.test(texto)) return 'Bach';
    if (/\bfp\b|ciclo|c\.?f\.?g|formacion profesional/i.test(texto)) return 'FP';
    if (/\bpmar\b|diversificacion/i.test(texto)) return 'Div';
    return '';
  }

  /* Se quitan las palabras de la etapa para que no estorben al buscar el
     nivel y la letra. */
  function sinPalabrasDeEtapa(texto) {
    return texto
      .replace(/\bde\b/gi, ' ')
      .replace(/e\.?\s?s\.?\s?o\.?/gi, ' ')
      .replace(/educacion secundaria obligatoria/gi, ' ')
      .replace(/bachillerato|bachiller|bach\.?/gi, ' ')
      .replace(/c\.?f\.?g\.?[ms]?|ciclo formativo|formacion profesional|\bfp\b/gi, ' ')
      .replace(/\bpmar\b|diversificacion/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function grupoCompacto(unidad, curso) {
    var texto = sinTildes(unidad);
    var deCurso = sinTildes(curso);
    var junto = (texto + ' ' + deCurso);

    var etapa = etapaDe(junto);
    var limpio = sinPalabrasDeEtapa(texto);

    var nivel = limpio.match(/([1-6])/);
    var letra = limpio.match(/(?:^|[\s\-º.])([A-Za-z])\s*$/);
    if (!nivel) {
      var nivelCurso = deCurso.match(/([1-6])/);
      if (nivelCurso) nivel = nivelCurso;
    }
    if (!nivel) return U.limpiarNombre(String(unidad || '')).replace(/\s+/g, '');

    return nivel[1] + 'º' + etapa + (letra ? letra[1].toUpperCase() : '');
  }

  /* El nivel y la enseñanza de una unidad, sueltos (17-sep-2026, fila 21,
     docs/GRUPOS-DE-PERSONAS.md): hacen falta para los atajos de "toda una
     unidad/nivel/enseñanza" al elegir grupos de alumnado. Reutiliza el
     mismo análisis de texto que `grupoCompacto`, para no tener dos sitios
     que entiendan "1º de E.S.O. A" de forma distinta. */
  var ENSENANZA_DE_ETAPA = {
    Bach: 'Bachillerato',
    FP: 'Formación Profesional',
    Div: 'PMAR',
    '': 'E.S.O.'
  };

  function nivelYEnsenanza(unidad) {
    var texto = sinTildes(unidad);
    var etapa = etapaDe(texto);
    var limpio = sinPalabrasDeEtapa(texto);
    var nivel = limpio.match(/([1-6])/);
    if (!nivel) return { nivel: '', ensenanza: '' };
    return { nivel: nivel[1] + 'º', ensenanza: ENSENANZA_DE_ETAPA[etapa] };
  }

  I.TOPE_ASUNTO = TOPE_ASUNTO;
  I.TOPE_DOCUMENTO = TOPE_DOCUMENTO;
  I.topesDeHoy = topesDeHoy;
  I.unir = unir;
  I.ajustarAlTope = ajustarAlTope;
  I.montarAsunto = montarAsunto;
  I.grupoCompacto = grupoCompacto;
  I.nivelYEnsenanza = nivelYEnsenanza;
})();
