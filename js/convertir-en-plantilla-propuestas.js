/* ============================================================
   convertir-en-plantilla-propuestas.js — los cambios que propone la app
   al convertir un documento de un asunto en plantilla (fila 280,
   docs/CONVERTIR-EN-PLANTILLA.md, apartados 4 y 5).

   Pura: del texto del documento y de lo que se sabe del asunto, la lista
   de líneas con sus cuatro grupos:
     datos   «Datos de este asunto» (la regla de la fila 270,
             PlantillaDeLoEscrito.cambiarDatos, sin tildes y con el «lugar
             y fecha» antes que la fecha sola);
     firma   «Quien firma» (quien ocupaba cada cargo en la fecha del
             documento: el primero que sale es `{{FIRMANTE}}`, el de otro
             cargo `{{VISTO BUENO}}`);
     genero  «Para que sirva con hombre y con mujer» (solo una forma doble
             que `Genero.resolver` devuelve idéntica al texto de partida);
     quitar  «Quitar» (lo de la cabecera antigua, por el membrete).
   Cada línea lleva lo que había (`buscar`), lo que se pone (`poner`), su
   etiqueta en palabras y las veces que sale. `tambien` dice de qué otra
   línea cuelga (el «D.» pegado al nombre de quien firma).
   ============================================================ */
var ConvertirEnPlantillaPropuestas = (function () {

  var ARTICULOS = [['el', 'la'], ['los', 'las'], ['del', 'de la'], ['al', 'a la'], ['un', 'una'], ['unos', 'unas']];
  /* Palabras con género que se proponen en su forma doble (la raíz, sin la -o/-a). */
  var RAICES = ['alumn', 'hij', 'interesad', 'matriculad', 'nacid', 'admitid', 'excluid', 'domiciliad', 'empadronad',
    'inscrit', 'aprobad', 'suspendid', 'beneficiari', 'escolarizad', 'destinatari', 'adjudicatari'];
  var TRATAMIENTOS = [['D.', 'D./Dña.'], ['Dña.', 'D./Dña.'], ['Don', 'Don/Doña'], ['Doña', 'Don/Doña']];

  function sin(t) { return window.DocxSustituir.normalizar(t); }
  function escaparRe(t) { return String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* La etiqueta de un hueco, en palabras (la de Plantillas.HUECOS). */
  function etiquetaDe(hueco) {
    var dentro = String(hueco).replace(/^\{\{?|\}?\}$/g, '').trim();
    if (/^campo\s*:/i.test(dentro)) return 'Campo «' + dentro.replace(/^campo\s*:/i, '').trim() + '»';
    var h = (window.Plantillas ? Plantillas.HUECOS : []).filter(function (x) { return sin(x.clave) === sin(dentro); })[0];
    if (/^firmante$/i.test(dentro)) return 'Quien firma el documento';
    if (/^visto bueno$/i.test(dentro)) return 'Quien da el visto bueno';
    return h ? h.etiqueta : dentro;
  }

  /* El nombre de una persona en sus dos órdenes: «Apellidos, Nombre» y «Nombre Apellidos». */
  function variantesDeNombre(persona) {
    var p = String(persona || '').trim(), salida = [];
    if (!p) return salida;
    salida.push(p);
    var coma = p.indexOf(',');
    if (coma !== -1) salida.push((p.slice(coma + 1).trim() + ' ' + p.slice(0, coma).trim()).trim());
    return salida;
  }

  function contieneNombre(texto, nombre) {
    return !!nombre && window.DocxSustituir.contar(texto, nombre) > 0;
  }

  /* ---------- a) datos de este asunto ---------- */

  function lineasDeDatos(texto, valores) {
    var r = PlantillaDeLoEscrito.cambiarDatos(texto, valores, { sinTildes: true, extra: ['lugarYFecha'] });
    return r.cambios.map(function (c, i) {
      var minusculas = c.dato.toLowerCase();
      return {
        id: 'datos' + i, grupo: 'datos', buscar: c.dato, poner: c.hueco, etiqueta: etiquetaDe(c.hueco),
        veces: window.DocxSustituir.contar(texto, c.dato),
        nota: (c.dato === c.dato.toUpperCase() && c.dato !== minusculas) ? '(estaba en mayúsculas)' : ''
      };
    });
  }

  /* ---------- b) quien firma ---------- */

  /* cargos: [{ id, nombre, persona, sexo, tratamiento }] (quien los ocupaba en la fecha del documento). */
  function lineasDeFirma(texto, cargos) {
    var hallados = [];
    (cargos || []).forEach(function (c) {
      variantesDeNombre(c.persona).forEach(function (v) {
        var m = window.DocxSustituir.buscarTodos(texto, v)[0];
        if (m) hallados.push({ cargo: c, escrito: texto.slice(m.ini, m.fin), pos: m.ini, variante: v });
      });
    });
    hallados.sort(function (a, b) { return a.pos - b.pos; });
    var salida = [], primero = hallados[0] || null, otro = null;
    if (primero) {
      otro = hallados.filter(function (h) { return h.cargo.id !== primero.cargo.id && sin(h.cargo.persona) !== sin(primero.cargo.persona); })[0] || null;
      salida.push({ id: 'firma0', grupo: 'firma', buscar: primero.escrito, poner: '{{FIRMANTE}}', etiqueta: etiquetaDe('{{FIRMANTE}}'),
        veces: window.DocxSustituir.contar(texto, primero.escrito), nota: 'cargo: ' + primero.cargo.nombre, cargo: primero.cargo });
    }
    if (otro) {
      salida.push({ id: 'firma1', grupo: 'firma', buscar: otro.escrito, poner: '{{VISTO BUENO}}', etiqueta: etiquetaDe('{{VISTO BUENO}}'),
        veces: window.DocxSustituir.contar(texto, otro.escrito), nota: 'cargo: ' + otro.cargo.nombre, cargo: otro.cargo });
    }
    return salida;
  }

  /* ---------- c) hombre y mujer ---------- */

  function conMayuscula(modelo, texto) {
    return modelo.charAt(0) === modelo.charAt(0).toUpperCase() && modelo.charAt(0) !== modelo.charAt(0).toLowerCase()
      ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
  }

  /* Solo si `Genero.resolver`, con el sexo, devuelve exactamente el texto de partida. */
  function vale(doble, original, sexo) {
    return !!sexo && window.Genero.resolver(doble, { tercero: sexo, firmante: sexo }).texto === original;
  }

  /* `datos` y `firma`: las líneas de arriba (el «D.» pegado a un nombre se cambia junto con ese nombre y cuelga de su línea). */
  function lineasDeGenero(parrafos, valores, datos, firma, firmanteSexo) {
    var sexo = valores && valores.sexos ? valores.sexos.tercero : '';
    var salida = [], vistos = {};
    function meter(l) {
      if (vistos[l.buscar]) return;
      vistos[l.buscar] = true;
      l.id = 'genero' + salida.length; l.grupo = 'genero'; l.etiqueta = 'Con hombre y con mujer'; l.nota = l.nota || '';
      salida.push(l);
    }
    var reArticulo = '(?:(?:el|la|los|las|del|de la|al|a la|un|una|unos|unas)\\s+)?';
    var reRaices = new RegExp('(?<![\\p{L}])(' + reArticulo + ')((?:' + RAICES.join('|') + ')(?:os|as|o|a))(?![\\p{L}])', 'giu');
    var nombres = [valores && valores.nombreNatural, valores && valores.nombre].filter(Boolean);
    var firmanteEscrito = firma && firma[0] ? firma[0] : null;
    parrafos.forEach(function (par) {
      var m;
      if (sexo && nombres.some(function (n) { return contieneNombre(par, n); })) {
        reRaices.lastIndex = 0;
        while ((m = reRaices.exec(par))) {
          var articulo = m[1].trim(), palabra = m[2], plural = /s$/i.test(palabra);
          var doble = palabra.replace(/(os|as|o|a)$/i, '') + (plural ? 'os/as' : 'o/a');
          if (articulo) {
            var pareja = ARTICULOS.filter(function (p) { return p[0] === articulo.toLowerCase() || p[1] === articulo.toLowerCase(); })[0];
            if (!pareja) continue;
            doble = conMayuscula(articulo, pareja[0] + '/' + pareja[1]) + ' ' + doble;
          }
          var original = (articulo ? articulo + ' ' : '') + palabra;
          if (vale(doble, original, sexo)) meter({ buscar: original, poner: doble, mostrar: original, mostrarPoner: doble });
        }
        /* El tratamiento pegado al nombre del tercero: «D. Carla Espejo Montes». */
        nombres.forEach(function (n) {
          var datosLinea = datos.filter(function (l) { return sin(l.buscar) === sin(n); })[0];
          if (!datosLinea) return;
          TRATAMIENTOS.forEach(function (t) {
            var re = new RegExp('(?<![\\p{L}\\p{N}])(' + escaparRe(t[0]) + ')\\s+(' + escaparRe(n) + ')(?![\\p{L}\\p{N}_])', 'giu');
            var mm;
            while ((mm = re.exec(par))) {
              if (vale(t[1], mm[1], sexo)) {
                meter({ buscar: mm[1] + ' ' + mm[2], poner: t[1] + ' ' + datosLinea.poner, mostrar: mm[1], mostrarPoner: t[1], tambien: datosLinea.id });
              }
            }
          });
        });
      }
      /* El tratamiento pegado al nombre de quien firma, con su marca. */
      if (firmanteEscrito && firmanteSexo) {
        TRATAMIENTOS.forEach(function (t) {
          var re = new RegExp('(?<![\\p{L}\\p{N}])(' + escaparRe(t[0]) + ')\\s+(' + escaparRe(firmanteEscrito.buscar) + ')(?![\\p{L}\\p{N}_])', 'giu');
          var mm;
          while ((mm = re.exec(par))) {
            if (window.Genero.resolver(t[1] + ':firmante', { firmante: firmanteSexo }).texto === mm[1]) {
              meter({ buscar: mm[1] + ' ' + mm[2], poner: t[1] + ':firmante ' + firmanteEscrito.poner, mostrar: mm[1],
                mostrarPoner: t[1] + ':firmante', tambien: firmanteEscrito.id });
            }
          }
        });
      }
    });
    var todo = parrafos.join('\n');
    salida.forEach(function (l) { l.veces = window.DocxSustituir.contar(todo, l.buscar); });
    return salida;
  }

  /* ---------- d) quitar: lo de la cabecera antigua ---------- */

  /* parrafos: [{ texto, imagen }] del cuerpo; devuelve las líneas «Quitar» (índices de párrafo). */
  function lineasDeQuitar(parrafos, centro) {
    var claves = ['junta de andalucia', 'consejeria'];
    if (centro && centro.nombre) claves.push(sin(centro.nombre));
    if (centro && centro.codigo) claves.push(sin(centro.codigo));
    var salida = [];
    for (var i = 0; i < parrafos.length; i++) {
      var p = parrafos[i], t = String(p.texto || '').trim();
      if (!t && !p.imagen) continue;                       /* un párrafo vacío no se propone, pero no corta la cabecera */
      var rotulo = t && t.split(/\s+/).length < 12 && claves.some(function (c) { return sin(t).indexOf(c) !== -1; });
      if (!(p.imagen && !t) && !rotulo) break;               /* el primero de texto normal */
      salida.push({ id: 'quitar' + i, grupo: 'quitar', indice: i, buscar: t || '(imagen)', poner: '', etiqueta: 'Quitar',
        veces: 1, nota: t ? '' : '(solo una imagen)' });
    }
    return salida;
  }

  /* Fila 281: de un PDF sin Word, además, lo que se repite en todas las páginas y los sellos de firma y de registro
     que el PDF lleva como texto. `repetidos`: [bool] por párrafo del cuerpo. */
  var SELLOS = /Firmado digitalmente|Firmado por|C[oó]digo seguro de verificaci[oó]n|\bCSV\b|Verificaci[oó]n|AutoFirma|huella|\b\d{2}[ES][MA]\d{4,6}\b/i;

  function lineasDeQuitarPdf(parrafos, repetidos) {
    var salida = [];
    parrafos.forEach(function (p, i) {
      var t = String(p.texto || '').trim();
      if (!t) return;
      var repite = !!(repetidos && repetidos[i]), sello = SELLOS.test(t);
      if (!repite && !sello) return;
      salida.push({ id: 'quitar' + i, grupo: 'quitar', indice: i, buscar: t.length > 70 ? t.slice(0, 70) + '…' : t, poner: '', etiqueta: 'Quitar',
        veces: 1, nota: repite ? '(se repite en todas las páginas)' : '(sello de firma o de registro)' });
    });
    return salida;
  }

  /* ---------- todo junto ---------- */

  /* entrada: { cuerpo: [{ texto, imagen }], pies: [texto], valores, cargos, centro, tieneMembrete, desdePdf, repetidos }. */
  function proponer(entrada) {
    var cuerpo = entrada.cuerpo || [], pies = entrada.pies || [];
    var textos = cuerpo.map(function (p) { return p.texto; }).concat(pies);
    var todo = textos.join('\n');
    var datos = lineasDeDatos(todo, entrada.valores || {});
    var firma = lineasDeFirma(todo, entrada.cargos || []);
    var cargoFirma = firma[0] && firma[0].cargo;
    var firmanteSexo = entrada.firmanteSexo || (cargoFirma && (cargoFirma.sexo || window.Genero.sexoDeTratamiento(cargoFirma.tratamiento))) || '';
    var genero = lineasDeGenero(textos, entrada.valores || {}, datos, firma, firmanteSexo);
    var quitar = entrada.tieneMembrete ? [] : lineasDeQuitar(cuerpo, entrada.centro);
    if (entrada.desdePdf) {
      var ya = {};
      quitar.forEach(function (l) { ya[l.indice] = true; });
      quitar = quitar.concat(lineasDeQuitarPdf(cuerpo, entrada.repetidos).filter(function (l) { return !ya[l.indice]; }))
        .sort(function (a, b) { return a.indice - b.indice; });
    }
    return { datos: datos, firma: firma, genero: genero, quitar: quitar, lineas: datos.concat(firma, genero, quitar) };
  }

  return {
    proponer: proponer, lineasDeDatos: lineasDeDatos, lineasDeFirma: lineasDeFirma, lineasDeGenero: lineasDeGenero,
    lineasDeQuitar: lineasDeQuitar, lineasDeQuitarPdf: lineasDeQuitarPdf, etiquetaDe: etiquetaDe, variantesDeNombre: variantesDeNombre
  };
})();
window.ConvertirEnPlantillaPropuestas = ConvertirEnPlantillaPropuestas;
