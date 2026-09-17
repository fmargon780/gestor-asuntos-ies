/* ============================================================
   lector-documentos.js — qué se puede sacar del texto de un
   documento suelto en "Por clasificar" (17-sep-2026, fila 41,
   docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md).

   Una sola función pública, `analizar(texto, contexto)`, **pura**: no
   toca el disco, ni la pantalla, ni pdf.js. Recibe el texto ya
   extraído del PDF (js/registro-lector.js, `textoDe`) y las listas con
   las que cotejar, y devuelve lo que ha encontrado. Nunca decide: solo
   propone. Sin OCR, sin ningún servicio de internet, sin aprendizaje
   automático — el tipo se acierta contando coincidencias de palabras
   clave, nada más.

   `contexto` es:
     { tipos:    [{ tipo, categoria, palabrasClave: [...] }, ...],
       alumnado: [{ nombre, documento, persona }, ...],
       personal: [{ nombre, documento, persona }, ...],
       empresas: [{ nombre, documento, persona }, ...] }

   Quien llama (js/documentos-sueltos-lector.js) es quien monta esas
   tres listas a partir de lo que ya carga la aplicación (RegAlum.csv,
   personal.csv, empresas.csv): aquí no se sabe nada de dónde vienen,
   ni de `window.Dni` ni de `Datos.cargar`, para que esta función se
   pueda probar con listas de mentira, sin cargar nada de eso.
   `persona` es el objeto tal cual, el mismo que espera
   `App.fijarTercero` (js/asuntos-nuevo.js): así, si se acepta la
   propuesta, no hace falta reconstruirlo.

   Devuelve:
     { registro:   lo que dé RegistroLector.buscarEnTexto, o null
       fecha:      'dd/mm/aaaa', o '' si no aparece ninguna
       documentos: [{ clase: 'DNI'|'NIE'|'NIF'|'ESCOLAR', valor }, ...]
       tercero:    { categoria, nombre, persona, por: 'documento'|'nombre' } | null
       tipo:       { tipo, categoria } | null }
   ============================================================ */
var LectorDocumentos = (function () {

  /* ---------- lo común: normalizar y trocear en palabras ---------- */

  function normalizarTexto(v) {
    return String(v === null || v === undefined ? '' : v)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  /* Palabras enteras, sin tildes ni mayúsculas: así "baja" no dispara
     con "trabaja" (docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md, punto 2.5). */
  function palabrasDe(texto) {
    return normalizarTexto(texto).split(/[^a-z0-9ñ]+/).filter(Boolean);
  }

  /* ---------- 1. el registro de Séneca ---------- */

  function buscarRegistro(texto) {
    try {
      if (typeof RegistroLector !== 'undefined' && RegistroLector.buscarEnTexto) {
        return RegistroLector.buscarEnTexto(texto) || null;
      }
    } catch (e) { /* nunca debe reventar por esto */ }
    return null;
  }

  /* ---------- 2. la fecha del documento ---------- */

  var MESES = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
    agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
  };

  function aDosCifras(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

  /* La del sello si la hay; si no, la primera fecha del texto en
     dd/mm/aaaa, dd-mm-aaaa o "17 de septiembre de 2026". Nunca la de
     hoy: si no aparece ninguna, se deja vacía. */
  function buscarFecha(texto, registro) {
    if (registro && registro.fecha) return registro.fecha;
    var t = String(texto || '');

    var m = t.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (m) return aDosCifras(m[1]) + '/' + aDosCifras(m[2]) + '/' + m[3];

    var m2 = t.match(/\b(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})\b/i);
    if (m2) {
      var mes = MESES[normalizarTexto(m2[2])];
      if (mes) return aDosCifras(m2[1]) + '/' + aDosCifras(mes) + '/' + m2[3];
    }
    return '';
  }

  /* ---------- 3. los documentos de identidad ---------- */

  /* La letra del DNI (y, con el número ya convertido, la del NIE): se
     comprueba antes de dar el documento por bueno. */
  var LETRA_DOCUMENTO = 'TRWAGMYFPDXBNJZSQVHLCKE';

  function letraValida(numero, letra) {
    var n = parseInt(numero, 10);
    if (isNaN(n)) return false;
    return LETRA_DOCUMENTO.charAt(n % 23) === String(letra || '').toUpperCase();
  }

  function documentosDelTexto(texto) {
    var t = String(texto || '');
    var vistos = {};
    var salida = [];
    function anadir(clase, valor) {
      var clave = clase + ':' + valor;
      if (vistos[clave]) return;
      vistos[clave] = true;
      salida.push({ clase: clase, valor: valor });
    }

    /* DNI: ocho cifras y una letra, con la letra comprobada. */
    var reDni = /\b(\d{8})[\s-]?([A-Za-z])\b/g, m;
    while ((m = reDni.exec(t))) {
      if (letraValida(m[1], m[2])) anadir('DNI', m[1] + m[2].toUpperCase());
    }

    /* NIE: X/Y/Z, siete cifras y una letra. Para comprobar la letra, la
       X/Y/Z se cambia por 0/1/2 y se aplica la misma tabla que el DNI. */
    var reNie = /\b([XYZxyz])[\s-]?(\d{7})[\s-]?([A-Za-z])\b/g;
    while ((m = reNie.exec(t))) {
      var prefijo = { X: '0', Y: '1', Z: '2' }[m[1].toUpperCase()];
      if (letraValida(prefijo + m[2], m[3])) {
        anadir('NIE', m[1].toUpperCase() + m[2] + m[3].toUpperCase());
      }
    }

    /* NIF de empresa: letra + siete cifras + control (cifra o letra).
       Aquí no se comprueba el dígito de control: cada letra tiene su
       propia fórmula, y no lo pide la instrucción (solo DNI y NIE). */
    var reNif = /\b([ABCDEFGHJNPQRSUVW])[\s-]?(\d{7})[\s-]?([0-9A-J])\b/gi;
    while ((m = reNif.exec(t))) {
      anadir('NIF', m[1].toUpperCase() + m[2] + m[3].toUpperCase());
    }

    /* Nº de identificación escolar: no tiene una forma fija que se
       pueda comprobar, así que se recogen las tiradas de cifras
       razonables y luego, al cotejar, solo cuentan las que coincidan
       con un alumno de verdad. Los DNI y NIE de arriba ya se han
       quedado con su letra pegada, así que no chocan con esto (no hay
       límite de palabra entre una cifra y una letra pegada). */
    var reEscolar = /\b(\d{5,10})\b/g;
    while ((m = reEscolar.exec(t))) anadir('ESCOLAR', m[1]);

    return salida;
  }

  /* ---------- 4. el tercero ---------- */

  function limpiarDocumento(v) {
    return String(v === null || v === undefined ? '' : v).toUpperCase().replace(/[^0-9A-Z]/g, '');
  }

  function candidatosDe(lista, categoria) {
    return (lista || []).map(function (p) {
      return {
        categoria: categoria,
        nombre: p && p.nombre,
        documento: limpiarDocumento(p && p.documento),
        persona: p && (p.persona !== undefined ? p.persona : p)
      };
    }).filter(function (c) { return c.nombre; });
  }

  /* "García Pérez, Ana" -> "ana garcía pérez" (como suele venir escrito
     dentro de un documento, con el nombre delante). */
  function formaInvertida(nombre) {
    var partes = String(nombre || '').split(',');
    if (partes.length < 2) return '';
    return normalizarTexto(partes[1] + ' ' + partes[0]).replace(/\s+/g, ' ').trim();
  }

  function formaDirecta(nombre) {
    return normalizarTexto(nombre).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escaparRegExp(v) { return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function nombreEnTexto(nombre, textoNormalizado) {
    var formas = [formaDirecta(nombre), formaInvertida(nombre)];
    for (var i = 0; i < formas.length; i++) {
      var forma = formas[i];
      if (!forma) continue;
      var re = new RegExp('\\b' + escaparRegExp(forma) + '\\b');
      if (re.test(textoNormalizado)) return true;
    }
    return false;
  }

  /* Un documento de identidad que cuadra vale más que un nombre que
     cuadra: solo se prueba por nombre si no hay ningún documento que
     coincida. Si cuadran dos terceros distintos (por documento, o si
     no por nombre), no se propone ninguno: se deja el hueco. */
  function elegirTercero(documentos, texto, contexto) {
    var candidatos = candidatosDe(contexto.alumnado, 'ALUMNADO')
      .concat(candidatosDe(contexto.personal, 'PERSONAL'))
      .concat(candidatosDe(contexto.empresas, 'EMPRESAS'));

    var valoresTexto = documentos.map(function (d) { return d.valor; });
    var porDocumento = {};
    candidatos.forEach(function (c) {
      if (!c.documento) return;
      if (valoresTexto.indexOf(c.documento) === -1) return;
      porDocumento[c.categoria + '|' + c.nombre] = c;
    });
    var listaDoc = Object.keys(porDocumento).map(function (k) { return porDocumento[k]; });
    if (listaDoc.length === 1) {
      return { categoria: listaDoc[0].categoria, nombre: listaDoc[0].nombre,
               persona: listaDoc[0].persona, por: 'documento' };
    }
    if (listaDoc.length > 1) return null;

    var textoNorm = normalizarTexto(texto);
    var porNombre = {};
    candidatos.forEach(function (c) {
      if (!nombreEnTexto(c.nombre, textoNorm)) return;
      porNombre[c.categoria + '|' + c.nombre] = c;
    });
    var listaNom = Object.keys(porNombre).map(function (k) { return porNombre[k]; });
    if (listaNom.length === 1) {
      return { categoria: listaNom[0].categoria, nombre: listaNom[0].nombre,
               persona: listaNom[0].persona, por: 'nombre' };
    }
    return null;
  }

  /* ---------- 5. el tipo de asunto ---------- */

  /* Cuántas de las palabras clave del tipo (más su propio nombre)
     aparecen, por palabras enteras, en el texto. Una palabra clave con
     varias palabras ("baja médica") cuenta si están todas, no hace
     falta que estén seguidas. */
  function contarCoincidencias(palabrasDelTexto, terminos) {
    var presentes = {};
    palabrasDelTexto.forEach(function (p) { presentes[p] = true; });
    var total = 0;
    (terminos || []).forEach(function (termino) {
      var piezas = palabrasDe(termino);
      if (!piezas.length) return;
      var todas = piezas.every(function (p) { return presentes[p]; });
      if (todas) total++;
    });
    return total;
  }

  /* Gana el tipo con más coincidencias. Si empatan dos, no se propone
     ninguno: mejor un hueco que un acierto a medias. */
  function elegirTipo(palabrasDelTexto, tipos) {
    var puntuados = (tipos || []).map(function (t) {
      var terminos = (t.palabrasClave || []).concat([t.tipo]);
      return { tipo: t.tipo, categoria: t.categoria,
               puntos: contarCoincidencias(palabrasDelTexto, terminos) };
    }).filter(function (x) { return x.puntos > 0; });

    if (!puntuados.length) return null;
    puntuados.sort(function (a, b) { return b.puntos - a.puntos; });
    if (puntuados.length > 1 && puntuados[0].puntos === puntuados[1].puntos) return null;
    return { tipo: puntuados[0].tipo, categoria: puntuados[0].categoria };
  }

  /* ---------- la función pública ---------- */

  function analizar(texto, contexto) {
    texto = String(texto === null || texto === undefined ? '' : texto);
    contexto = contexto || {};

    var registro = buscarRegistro(texto);
    var fecha = buscarFecha(texto, registro);
    var documentos = documentosDelTexto(texto);
    var tercero = elegirTercero(documentos, texto, contexto);
    var tipo = elegirTipo(palabrasDe(texto), contexto.tipos);

    return { registro: registro, fecha: fecha, documentos: documentos,
             tercero: tercero, tipo: tipo };
  }

  return { analizar: analizar };
})();
