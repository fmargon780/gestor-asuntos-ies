/* ============================================================
   base-filas.js — de un asunto a sus filas de las tablas, y el código
   fijo de cada persona (fila 334, docs/DATOS-2-TABLAS-PARA-INFORMES.md).

   Funciones puras: reciben la ficha, los hitos y la entrada del índice y
   devuelven { asunto, hitos, personas, documentos, gente }. Las usa
   `Base.ponerAlDia` (lo archivado) y `Base.leer` con `conAbiertos` (lo
   abierto): una regla, un sitio.

   El código de una persona (`P-` y doce cifras hexadecimales) sale de un
   SHA-256 de `categoria|clase|valor`, con la clase y el valor que mejor la
   identifican (Nº escolar, NIF, código, nombre con los cuatro caracteres
   del documento). Los dos ordenadores calculan el mismo sin ponerse de
   acuerdo. No es un secreto: solo evita que el DNI o el Nº escolar
   aparezcan en las tablas. El SHA-256 va escrito aquí (síncrono, vale
   también sin https) y se comprueba con la prueba de los vectores.
   ============================================================ */
var BaseFilas = (function () {

  /* ---------- SHA-256 ---------- */
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  function utf8(texto) {
    var s = unescape(encodeURIComponent(String(texto)));
    var b = [];
    for (var i = 0; i < s.length; i++) b.push(s.charCodeAt(i));
    return b;
  }

  function sha256(texto) {
    var m = utf8(texto), largo = m.length * 8;
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    for (var s = 56; s >= 0; s -= 8) m.push(s >= 32 ? 0 : (largo >>> s) & 0xff);   /* el largo cabe en 32 bits */
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64);
    function rotar(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var o = 0; o < m.length; o += 64) {
      for (var i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var s0 = rotar(w[i - 15], 7) ^ rotar(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotar(w[i - 2], 17) ^ rotar(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var t1 = (hh + (rotar(e, 6) ^ rotar(e, 11) ^ rotar(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        var t2 = ((rotar(a, 2) ^ rotar(a, 13) ^ rotar(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  /* ---------- el código de una persona ---------- */

  function hueso(t) { return (window.U && U.hueso) ? U.hueso(t) : String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  /* El nombre de la carpeta de un tercero es «Apellidos, Nombre <identificador>»: el identificador es lo último. */
  function partir(nombre) {
    var t = String(nombre || '').trim();
    var m = /^(.*?)\s+([A-Za-z0-9]{4,15})$/.exec(t);
    if (m && /\d/.test(m[2])) return { nombre: m[1], ident: m[2].toUpperCase() };
    return { nombre: t, ident: '' };
  }

  function claseYValor(categoria, nombre) {
    var p = partir(nombre);
    var cat = String(categoria || '').toUpperCase();
    if (cat === 'ALUMNADO' && /^\d{5,}$/.test(p.ident)) return { clase: 'nie', valor: p.ident };
    if (cat === 'EMPRESAS' && p.ident) return { clase: 'nif', valor: p.ident };
    if (/ADMINISTRACION/.test(cat) && p.ident) return { clase: 'codigo', valor: p.ident };
    if (p.ident) return { clase: 'nombre-doc', valor: hueso(p.nombre) + '|' + p.ident.slice(-4) };
    return { clase: 'nombre', valor: hueso(p.nombre || nombre) };
  }

  function codigoDe(categoria, nombre) {
    var cv = claseYValor(categoria, nombre);
    return 'P-' + sha256(String(categoria || '').toUpperCase() + '|' + cv.clase + '|' + cv.valor).slice(0, 12);
  }

  /* ---------- las filas ---------- */

  function diasEntre(desde, hasta) {
    var a = Date.parse(String(desde || '').slice(0, 10)), b = Date.parse(String(hasta || '').slice(0, 10));
    if (isNaN(a) || isNaN(b)) return '';
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  /* Un campo propio se guarda como «propio:<id>»; su nombre y su clase están en `campos.json` (App.E.campos.propios). */
  function datosDelCampo(clave) {
    var m = /^propio:(.+)$/.exec(String(clave));
    var propios = (window.App && App.E && App.E.campos && App.E.campos.propios) || [];
    var p = m ? propios.filter(function (x) { return x && x.id === m[1]; })[0] : null;
    return p ? { nombre: p.nombre || clave, clase: p.clase || 'texto' } : { nombre: clave, clase: 'texto' };
  }

  function camposDe(ficha) {
    var campos = (ficha && ficha.campos) || {};
    return Object.keys(campos).map(function (k) {
      var d = datosDelCampo(k);
      var v = campos[k] && campos[k].valor;
      if ((d.clase === 'importe' || d.clase === 'numero') && v !== '' && v !== undefined && v !== null && isFinite(Number(v))) v = Number(v);
      return { nombre: d.nombre, clase: d.clase, valor: v === undefined ? '' : v };
    });
  }

  /* Los hitos en el orden en que se ven; los de la rama elegida de una pregunta, detrás de ella. */
  function aplanar(hitos, salida) {
    salida = salida || [];
    (hitos || []).forEach(function (h) {
      if (!h) return;
      salida.push(h);
      if (h.clase === 'decision') {
        (h.opciones || []).forEach(function (o) {
          if (o.id === h.elegida) aplanar(o.hitos, salida);
        });
      }
    });
    return salida;
  }

  function filasDeHitos(id, hitos) {
    return aplanar(hitos).map(function (h, i) {
      var elegida = '';
      if (h.clase === 'decision') {
        var o = (h.opciones || []).filter(function (x) { return x.id === h.elegida; })[0];
        elegida = o ? String(o.texto || '') : '';
      }
      var hechoEl = h.hechoEl ? String(h.hechoEl).slice(0, 10) : '';
      return {
        asunto: id, orden: i + 1, id: h.id || '', titulo: h.titulo || '', origen: h.origenGuia || '', clase: h.clase || '',
        estado: h.estado || '', desde: h.desde ? String(h.desde).slice(0, 10) : '', hechoEl: hechoEl,
        fecha: h.fecha ? String(h.fecha).slice(0, 10) : '', dias: hechoEl && h.desde ? diasEntre(h.desde, hechoEl) : '',
        responsable: h.responsable || '', sinRespuesta: !!h.sinRespuesta, elegida: elegida, documentos: (h.documentos || []).length
      };
    });
  }

  function filasDeDocumentos(id, ficha, entrada) {
    var salida = [];
    var datos = (ficha && ficha.documentos) || {};
    var conNumero = {};
    Object.keys(datos).forEach(function (n) {
      var d = datos[n] || {};
      conNumero[n] = true;
      salida.push({
        asunto: id, nombre: '', numero: n, tipo: d.tipo || '', fecha: d.fecha ? String(d.fecha).slice(0, 10) : '',
        registros: (d.registros || []).map(function (r) { return r && r.codigo; }).filter(Boolean), hito: d.hito || ''
      });
    });
    /* Los de antes de la fila 239 no tienen número ni datos en la ficha: solo el nombre que guarda el índice. */
    ((entrada && entrada.documentos) || []).forEach(function (nombre) {
      if (/^_|^HISTORIAL DE TRAMITACION|^DONDE ESTA/i.test(String(nombre))) return;   /* no son documentos del asunto */
      var m = /\b([DS]\d{2}-\d{4,6})\b/.exec(String(nombre));
      if (m && conNumero[m[1]]) { var f = salida.filter(function (s) { return s.numero === m[1]; })[0]; if (f && !f.nombre) f.nombre = nombre; return; }
      var r = String(nombre).match(/\d{2}[ES][MA]\d{4,6}/g) || [];
      salida.push({ asunto: id, nombre: nombre, numero: '', tipo: '', fecha: '', registros: r, hito: '' });
    });
    return salida;
  }

  function filasDePersonas(id, ficha, entrada, gente) {
    var salida = [], vistos = {};
    function poner(papel, categoria, nombre) {
      if (!nombre) return '';
      var codigo = codigoDe(categoria, nombre);
      var cv = claseYValor(categoria, nombre);
      gente[codigo] = { categoria: String(categoria || ''), nombre: String(nombre), clase: cv.clase };
      if (!vistos[papel + codigo]) { vistos[papel + codigo] = true; salida.push({ asunto: id, codigo: codigo, papel: papel, categoria: String(categoria || '') }); }
      return codigo;
    }
    var tercero = (entrada && entrada.tercero) || (ficha && ficha.tercero) || '';
    var categoria = (entrada && entrada.categoria) || (ficha && ficha.categoria) || '';
    var codigoTercero = poner(/^GRUPO /.test(tercero) ? 'grupo' : 'tercero', categoria, tercero);
    ((ficha && ficha.relacionados) || (entrada && entrada.relacionados) || []).forEach(function (r) {
      if (r && r.nombre) poner('relacionado', r.categoria || categoria, r.nombre);
    });
    var loPide = (ficha && ficha.loPide) || (entrada && entrada.loPideNombre ? { nombre: entrada.loPideNombre, categoria: entrada.loPideCategoria } : null);
    if (loPide && loPide.nombre) poner('lo-pide', loPide.categoria || categoria, loPide.nombre);
    return { filas: salida, codigoTercero: codigoTercero };
  }

  function organoDe(tipo) {
    try { return (window.TiposOrgano && tipo) ? (TiposOrgano.deNombre(tipo) || '') : ''; } catch (e) { return ''; }
  }

  /* `entrada` es la del índice del ARCHIVO (o la montada de un abierto, `entradaDeAbierto`). */
  function filasDe(ficha, hitos, entrada, opciones) {
    ficha = ficha || {}; entrada = entrada || {};
    var clave = entrada.nombre || '';
    var numero = entrada.numero || ficha.numero || '';
    var id = numero || clave;
    var gente = {};
    var p = filasDePersonas(id, ficha, entrada, gente);
    var tipo = entrada.tipo || ficha.tipo || '';
    var abiertoEl = ficha.abiertoEl || entrada.abiertoEl || '';
    var cerradoEl = ficha.cerradoEl || entrada.cerradoEl || '';
    var asunto = {
      id: id, clave: clave, numero: numero, tipo: tipo, categoria: entrada.categoria || ficha.categoria || '', organo: organoDe(tipo),
      persona: p.codigoTercero, curso: entrada.curso || ficha.curso || '',
      grupo: (typeof ficha.grupo === 'string' ? ficha.grupo : entrada.grupo) || '',
      abiertoEl: abiertoEl ? String(abiertoEl).slice(0, 10) : '', cerradoEl: cerradoEl ? String(cerradoEl).slice(0, 10) : '',
      dias: abiertoEl && cerradoEl ? diasEntre(abiertoEl, cerradoEl) : '',
      via: ficha.via || entrada.via || '', loPideCategoria: (ficha.loPide && ficha.loPide.categoria) || entrada.loPideCategoria || '',
      loPideRelacion: (ficha.loPide && ficha.loPide.relacion) || entrada.loPideRelacion || '',
      terminado: !!(ficha.terminado || entrada.terminado), seQuedoEn: ficha.seQuedoEn || entrada.seQuedoEn || '',
      reservado: typeof ficha.reservado === 'boolean' ? ficha.reservado : !!entrada.reservado,
      deGrupo: /^GRUPO /.test(entrada.tercero || ficha.tercero || ''), incompleto: !!(opciones && opciones.incompleto),
      campos: camposDe(ficha)
    };
    return { asunto: asunto, hitos: filasDeHitos(id, hitos), personas: p.filas, documentos: filasDeDocumentos(id, ficha, entrada), gente: gente };
  }

  return { sha256: sha256, codigoDe: codigoDe, claseYValor: claseYValor, filasDe: filasDe, aplanar: aplanar, diasEntre: diasEntre };
})();
window.BaseFilas = BaseFilas;
