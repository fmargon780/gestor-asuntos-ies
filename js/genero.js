/* ============================================================
   genero.js — el masculino o el femenino, solo, en las plantillas
   (24-sep-2026, fila 111, docs/GENERO-EN-PLANTILLAS.md).

   Las plantillas se escriben con las formas dobles de siempre: «el/la
   alumno/a», «interesado/a», «D./Dña.», «Don/Doña», «los/las»… Al
   rellenar (correo, mensaje de Séneca o documento de Word: todo pasa por
   `Plantillas.rellenar`), aquí se deja solo la forma que toca según el
   sexo de la persona. Sin el dato, la forma doble se queda tal cual, con
   su barra: nunca se elige una por defecto.

   DE QUIÉN: por defecto, del tercero del asunto. Para otra persona, la
   forma doble lleva detrás dos puntos y quién es, pegado:
     el/la:tutor1 hijo/a:tutor1      (tutor legal 1; también :tutor2)
     El/La:firmante Director/a:firmante   (quien firma; también :vistobueno)
   Además, un cargo con barra («Director/a», «Secretario/a», «Jefe/a»…) y
   el artículo que lleve justo delante son de quien firma sin marcar nada.

   QUÉ SE RECONOCE: pares de palabras conocidos (el/la, los/las, del/de la,
   al/a la, un/una, D./Dña., Don/Doña, Sr./Sra., padre/madre, él/ella…) y
   palabras con terminación alternativa «/a» o «/as» (alumno/a,
   profesor/a, jefe/a, alumnos/as, profesores/as). Lo demás no se toca:
   fechas, «y/o», fracciones, registros, rutas, correos y direcciones web.

   Los sexos de cada persona (`sexosDeAsunto`) salen del RegAlum (columna
   «Sexo» del alumno y de cada tutor, js/datos-tutores.js), de la casilla
   Hombre/Mujer de la ficha del tercero (`_GESTOR/sexos.json`) y del
   ocupante de cada cargo (js/cargos.js, `sexo`).
   ============================================================ */
var Genero = (function () {

  var QUIENES = ['tercero', 'tutor1', 'tutor2', 'firmante', 'vistobueno'];
  var PARES = [
    ['el', 'la'], ['los', 'las'], ['del', 'de la'], ['al', 'a la'], ['un', 'una'], ['unos', 'unas'],
    ['D.', 'Dña.'], ['D.', 'D.ª'], ['Don', 'Doña'], ['Sr.', 'Sra.'], ['señor', 'señora'], ['padre', 'madre'],
    ['él', 'ella'], ['este', 'esta'], ['estos', 'estas'], ['ese', 'esa'], ['esos', 'esas'],
    ['aquel', 'aquella'], ['nacido', 'nacida'], ['hijo', 'hija'], ['niño', 'niña']
  ];
  var CARGOS = /^(director|vicedirector|subdirector|secretario|jefe|orientador|coordinador|administrador|auxiliar|presidente|vocal)/i;

  function escaparRe(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* Los pares, de más largo a más corto (para que «del/de la» gane a «del»). */
  var ALT_PARES = PARES.map(function (p) { return escaparRe(p[0]) + '\\/' + escaparRe(p[1]); })
    .sort(function (a, b) { return b.length - a.length; }).join('|');
  var LETRA = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñªº';
  var RE = new RegExp('(^|[^' + LETRA + '0-9\\/.:@])(' + ALT_PARES + '|[' + LETRA + ']{2,}\\/as?)(?::(' + QUIENES.join('|') + '))?(?![' + LETRA + '0-9\\/])', 'gi');
  /* Lo que no se toca: direcciones web, correos, rutas (dos barras o más en una misma palabra). */
  var RE_PROTEGIDO = /(\{[^{}]*\}|https?:\/\/\S+|www\.\S+|\S+@\S+|\S*\/\S*\/\S*)/g;

  function capitalizarComo(modelo, texto) {
    var c = modelo.charAt(0);
    return c && c === c.toUpperCase() && c !== c.toLowerCase() ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
  }

  /* De «alumno/a» -> ['alumno', 'alumna']; de un par conocido, sus dos lados
     tal como están escritos. null si no es una forma doble de verdad. */
  function formas(doble) {
    var partes = doble.split('/');
    var izq = partes[0], der = partes.slice(1).join('/');
    var par = PARES.filter(function (p) { return p[0].toLowerCase() === izq.toLowerCase() && p[1].toLowerCase() === der.toLowerCase(); })[0];
    if (par) return [izq, der];
    var suf = der.toLowerCase();
    if (suf !== 'a' && suf !== 'as') return null;
    var m = izq, f = null, bajo = m.toLowerCase();
    if (suf === 'as' && /os$/.test(bajo)) f = m.slice(0, -2) + 'as';
    else if (suf === 'as' && /es$/.test(bajo)) f = m.slice(0, -2) + 'as';
    else if (suf === 'a' && /o$/.test(bajo)) f = m.slice(0, -1) + 'a';
    else if (suf === 'a' && /e$/.test(bajo)) f = m.slice(0, -1) + 'a';
    else if (suf === 'a' && /[rlnzsd]$/.test(bajo)) f = m + 'a';
    if (!f) return null;
    return [m, f];
  }

  /* Pura: `sexos` = { tercero: 'M'|'H'|'', tutor1, tutor2, firmante, vistobueno }.
     Devuelve { texto, sinResolver: { quien: n } }. */
  function resolver(texto, sexos) {
    texto = String(texto === null || texto === undefined ? '' : texto);
    if (texto.indexOf('/') === -1) return { texto: texto, sinResolver: {} };
    sexos = sexos || {};
    var protegidos = [];
    RE_PROTEGIDO.lastIndex = 0;
    var m;
    while ((m = RE_PROTEGIDO.exec(texto))) protegidos.push([m.index, m.index + m[0].length]);
    function estaProtegido(i) { return protegidos.some(function (p) { return i >= p[0] && i < p[1]; }); }

    var encontrados = [];
    RE.lastIndex = 0;
    while ((m = RE.exec(texto))) {
      var inicio = m.index + m[1].length;
      if (estaProtegido(inicio)) continue;
      var f = formas(m[2]);
      if (!f) continue;
      encontrados.push({ inicio: inicio, fin: m.index + m[0].length, formas: f, quien: m[3] ? m[3].toLowerCase() : '' });
      if (m[0].length === m[1].length) RE.lastIndex++;
    }
    /* Un cargo con barra, y el artículo justo delante, son de quien firma. */
    encontrados.forEach(function (e, i) {
      if (e.quien) return;
      if (CARGOS.test(e.formas[0])) {
        e.quien = 'firmante';
        var antes = encontrados[i - 1];
        if (antes && !antes.quien && /^\s+$/.test(texto.slice(antes.fin, e.inicio)) &&
            PARES.some(function (p) { return p[0].toLowerCase() === antes.formas[0].toLowerCase(); })) antes.quien = 'firmante';
      }
    });

    var sinResolver = {};
    var salida = texto;
    for (var k = encontrados.length - 1; k >= 0; k--) {
      var e = encontrados[k];
      var quien = e.quien || 'tercero';
      var sexo = sexos[quien] || '';
      var elegido;
      if (sexo === 'H') elegido = e.formas[0];
      else if (sexo === 'M') elegido = e.formas[1];
      else {
        sinResolver[quien] = (sinResolver[quien] || 0) + 1;
        elegido = e.formas[0] + '/' + e.formas[1].slice(sufijoComun(e.formas));
      }
      salida = salida.slice(0, e.inicio) + capitalizarComo(e.formas[0], elegido) + salida.slice(e.fin);
    }
    return { texto: salida, sinResolver: sinResolver };
  }

  /* Sin resolver, la forma se deja como estaba escrita (sin la marca «:quien»):
     «alumno/a», no «alumno/alumna». */
  function sufijoComun(par) {
    var a = par[0], b = par[1];
    if (PARES.some(function (p) { return p[1].toLowerCase() === b.toLowerCase() && p[0].toLowerCase() === a.toLowerCase(); })) return 0;
    var i = 0;
    while (i < a.length && i < b.length && a.charAt(i).toLowerCase() === b.charAt(i).toLowerCase()) i++;
    return i;
  }

  /* ---------- los sexos de cada persona ---------- */

  var FICHERO = 'sexos.json';
  var cache = null;

  function claveDe(persona, categoria) {
    if (!persona) return '';
    var id = String(persona.documento || persona.nif || '').replace(/\D/g, '') || persona.id;
    return (categoria || persona.categoria || '') + ':' + (id || U.normalizar(persona.nombre || ''));
  }

  async function leer() {
    var g = window.App && App.E && App.E.gestor;
    if (!g) return {};
    try { cache = (await Carpetas.leerJson(g, FICHERO)) || {}; } catch (e) { cache = cache || {}; }
    return cache;
  }

  /* Guardar la casilla Hombre/Mujer de una persona (se relee antes de escribir). */
  async function guardar(persona, categoria, sexo) {
    var g = App.E.gestor;
    var datos = {};
    try { datos = (await Carpetas.leerJson(g, FICHERO)) || {}; } catch (e) { datos = {}; }
    var k = claveDe(persona, categoria);
    if (sexo === 'M' || sexo === 'H') datos[k] = sexo; else delete datos[k];
    await Copias.guardar(g, FICHERO, datos);
    cache = datos;
    return datos;
  }

  /* El sexo que trae el propio fichero (el RegAlum del alumno: columna «Sexo»). */
  function sexoDelFichero(persona) {
    var campos = (persona && persona.campos) || {};
    var clave = Object.keys(campos).filter(function (k) {
      var t = U.normalizar(k);
      return /^(sexo|genero)$/.test(t.trim());
    })[0];
    return clave && window.Datos && Datos.sexoNormalizado ? Datos.sexoNormalizado(campos[clave]) : '';
  }

  async function sexoDe(persona, categoria) {
    if (!persona || categoria === 'EMPRESAS' || categoria === 'ADMINISTRACIONES') return '';
    var delFichero = sexoDelFichero(persona);
    if (delFichero) return delFichero;
    var datos = cache || await leer();
    return datos[claveDe(persona, categoria)] || '';
  }

  /* Del tratamiento del cargo, si ya lo dice («La Directora», «Dña.»). */
  function sexoDeTratamiento(t) {
    var n = String(t || '').trim();
    if (/\//.test(n)) return '';
    if (/^(la|doña|dña|sra)\b/i.test(n)) return 'M';
    if (/^(el|don|d\.|sr)\b/i.test(n)) return 'H';
    return '';
  }

  /* Todos los de un asunto, para `valores.sexos` (lo llama Plantillas.valoresDeAsunto). */
  async function sexosDeAsunto(persona, categoria, firmante, vistoBueno) {
    var s = { tercero: '', tutor1: '', tutor2: '', firmante: '', vistobueno: '' };
    s.tercero = await sexoDe(persona, categoria);
    if (persona && categoria === 'ALUMNADO' && window.Datos && Datos.tutoresDe) {
      Datos.tutoresDe(persona).forEach(function (t) { if (t.numero === 1 || t.numero === 2) s['tutor' + t.numero] = t.sexo || ''; });
    }
    if (firmante) s.firmante = firmante.sexo || sexoDeTratamiento(firmante.tratamiento);
    if (vistoBueno) s.vistobueno = vistoBueno.sexo || sexoDeTratamiento(vistoBueno.tratamiento);
    return s;
  }

  /* Para el aviso: de quién falta el dato y dónde ponerlo. */
  function dondePonerlo(quien, categoria) {
    if (quien === 'tutor1' || quien === 'tutor2') return 'el sexo del tutor legal ' + quien.slice(-1) + ' (columna «Sexo» de ese tutor en el RegAlum.csv)';
    if (quien === 'firmante') return 'el sexo de quien firma (Ajustes → El centro → Cargos del centro)';
    if (quien === 'vistobueno') return 'el sexo de quien da el visto bueno (Ajustes → El centro → Cargos del centro)';
    return 'el sexo de la persona del asunto (en su ficha, «Datos y contacto» → Sexo' +
      (categoria === 'ALUMNADO' ? ', o la columna «Sexo» del RegAlum.csv' : '') + ')';
  }

  /* La casilla Sexo de «Datos y contacto» (la llama js/ficha-tercero.js).
     No sale si el sexo ya viene en el fichero (el RegAlum) ni para empresas. */
  async function pintarEnFicha(caja, persona, categoria) {
    var bloque = caja && caja.querySelector('.ficha-bloque');
    if (!bloque || !persona || categoria === 'EMPRESAS' || categoria === 'ADMINISTRACIONES' || sexoDelFichero(persona)) return;
    var actual = await sexoDe(persona, categoria);
    var p = document.createElement('p');
    p.className = 'tercero-detalle genero-casilla';
    p.innerHTML = '<label>Sexo, para las plantillas: <select class="campo">' +
      '<option value="">Sin decir</option><option value="H">Hombre</option><option value="M">Mujer</option></select></label>';
    var sel = p.querySelector('select');
    sel.value = actual;
    sel.onchange = async function () {
      try { await guardar(persona, categoria, sel.value); U.aviso('Guardado.', 'bueno'); }
      catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
    };
    bloque.appendChild(p);
  }

  return {
    pintarEnFicha: pintarEnFicha, resolver: resolver, formas: formas, QUIENES: QUIENES,
    leer: leer, guardar: guardar, sexoDe: sexoDe, claveDe: claveDe, sexoDelFichero: sexoDelFichero,
    sexoDeTratamiento: sexoDeTratamiento, sexosDeAsunto: sexosDeAsunto, dondePonerlo: dondePonerlo
  };
})();
window.Genero = Genero;
