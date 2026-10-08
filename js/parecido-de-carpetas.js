/* ============================================================
   parecido-de-carpetas.js — cuánto se parecen dos nombres de asunto o de
   carpeta (fila 292, docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, apartado 3).

   Sin pantalla. La usan «Buscar su carpeta» (js/fichas-huerfanas.js) y
   «Son de este asunto…» (js/hitos-de-asuntos-perdidos.js): dado un nombre
   que ya no existe y una lista de candidatos, los ordena de más a menos
   parecido y dice si el primero es un parecido claro.

   Los cinco criterios, de más a menos peso:
     1. el mismo número del asunto (A26-0137);
     2. el mismo tercero (su Nº de identificación escolar, los cuatro
        últimos caracteres de su documento o su NIF, que van al final del
        nombre);
     3. el mismo tipo de asunto;
     4. la misma fecha de inicio (AAMMDD);
     5. palabras del nombre en común.

   Parecido claro: el mismo número, o el mismo tercero y el mismo tipo, sin
   otra candidata que empate con ella. Con empate se ordena y no se marca
   ninguna.
   ============================================================ */
var ParecidoDeCarpetas = (function () {

  var PESO = { numero: 10000, tercero: 1000, tipo: 100, fecha: 10, palabra: 1 };

  function norm(t) {
    return window.U && U.normalizar ? U.normalizar(String(t || '')) : String(t || '').toLowerCase();
  }

  /* Un nombre, desmontado en sus partes. `tipos` (opcional): la lista de tipos de la aplicación,
     para reconocer tipos de más de una palabra. */
  function analizar(nombre, tipos) {
    var texto = String(nombre || '').trim();
    var r = { fecha: '', numero: '', tipo: '', id: '', palabras: [] };
    var m = texto.match(/^(\d{6})\s+(.*)$/);
    var resto = texto;
    if (m) { r.fecha = m[1]; resto = m[2]; }
    var mn = resto.match(/^(A\d{2}-\d{4})\s+(.*)$/);
    if (mn) { r.numero = mn[1]; resto = mn[2]; }
    else { var suelto = texto.match(/A\d{2}-\d{4}/); if (suelto) r.numero = suelto[0]; }

    if (window.Nombres && Nombres.leer && tipos && tipos.length) {
      try { var l = Nombres.leer(texto, tipos); if (l && l.tipo) r.tipo = norm(l.tipo); } catch (e) { /* se prueba abajo */ }
    }
    if (!r.tipo) { var mt = resto.match(/^([A-ZÁÉÍÓÚÜÑ0-9._-]{2,})\s/); if (mt) r.tipo = norm(mt[1]); }

    var trozos = resto.split(/\s+/).filter(Boolean);
    var ultimo = trozos[trozos.length - 1] || '';
    if (trozos.length > 1 && /^[0-9A-Za-z]{4,}$/.test(ultimo) && /\d/.test(ultimo)) r.id = ultimo.toUpperCase();

    var yaCuentan = {};
    [r.tipo, norm(r.id)].forEach(function (x) { if (x) yaCuentan[x] = true; });
    norm(resto).split(/[^a-z0-9]+/).forEach(function (p) {
      if (p.length > 2 && !yaCuentan[p] && !/^\d+$/.test(p) && r.palabras.indexOf(p) === -1) r.palabras.push(p);
    });
    return r;
  }

  /* El mismo documento o número: iguales, o uno de cuatro caracteres que es el final del otro. */
  function mismoTercero(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length === 4 && b.length > 4) return b.slice(-4) === a;
    if (b.length === 4 && a.length > 4) return a.slice(-4) === b;
    return false;
  }

  /* Cómo se parecen dos nombres: { puntos, numero, tercero, tipo, fecha, palabras (cuántas) }. */
  function puntuar(viejo, nuevo, tipos) {
    var a = analizar(viejo, tipos), b = analizar(nuevo, tipos);
    var r = {
      numero: !!(a.numero && a.numero === b.numero),
      tercero: mismoTercero(a.id, b.id),
      tipo: !!(a.tipo && (a.tipo === b.tipo || a.tipo + 's' === b.tipo || b.tipo + 's' === a.tipo)) ||   /* FACTURAS ≈ FACTURA: carpetas cambiadas a mano */
        tipoCompatible(viejo, nuevo, tipos),   /* fila 303: abreviado, nombre corto o antiguo */
      fecha: !!(a.fecha && a.fecha === b.fecha),
      palabras: a.palabras.filter(function (p) { return b.palabras.indexOf(p) !== -1; }).length
    };
    r.puntos = (r.numero ? PESO.numero : 0) + (r.tercero ? PESO.tercero : 0) + (r.tipo ? PESO.tipo : 0) +
      (r.fecha ? PESO.fecha : 0) + r.palabras * PESO.palabra;
    return r;
  }

  /* ---------- fila 303 (docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md, apartado 2): cuándo «encaja» ---------- */

  /* El tipo de un nombre, en bruto: las palabras en mayúsculas que siguen a la fecha (y al número) hasta el
     año o el tercero. `resto` es lo que queda detrás. Sirve para tipos que la app no reconoce, como
     «TRAS. MATR. VIVA». */
  function tipoEnBruto(nombre) {
    var texto = String(nombre || '').trim();
    var m = texto.match(/^\d{6}\s+(.*)$/);
    var resto = m ? m[1] : texto;
    var mn = resto.match(/^A\d{2}-\d{4}\s+(.*)$/);
    if (mn) resto = mn[1];
    var trozos = resto.split(/\s+/).filter(Boolean), i = 0;
    while (i < trozos.length && /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9._\/-]*$/.test(trozos[i]) && !/^\d{2}[-\/]\d{2}$/.test(trozos[i])) i++;
    return { texto: trozos.slice(0, i).join(' '), resto: trozos.slice(i).join(' ') };
  }

  /* Todos los nombres con los que se puede llamar al tipo de ese nombre: si la app lo reconoce, el nombre, el
     corto y los antiguos; si no, el que está escrito. Y lo que queda detrás (año, grupo, tercero). */
  function tipoYResto(nombre, tipos) {
    var bruto = tipoEnBruto(nombre);
    var salida = { nombres: bruto.texto ? [bruto.texto] : [], resto: bruto.resto };
    if (window.Nombres && Nombres.leer && tipos && tipos.length) {
      try {
        var l = Nombres.leer(nombre, tipos);
        if (l && l.reconocido && l.tipo) {
          var t = tipos.filter(function (x) { return x.tipo === l.tipo; })[0] || { tipo: l.tipo };
          salida.nombres = [t.tipo, t.nombreCorto].concat(t.alias || []).filter(Boolean);
          salida.resto = l.resto;
        }
      } catch (e) { /* se queda con lo escrito */ }
    }
    return salida;
  }

  function palabrasDeTipo(t) { return norm(t).replace(/\./g, ' ').split(/\s+/).filter(Boolean); }

  /* Uno es el otro abreviado: mismas palabras, y cada una de un nombre es el principio de la del otro. */
  function abreviado(a, b) {
    var pa = palabrasDeTipo(a), pb = palabrasDeTipo(b);
    if (!pa.length || pa.length !== pb.length) return false;
    return pa.every(function (p, i) { return p.indexOf(pb[i]) === 0 || pb[i].indexOf(p) === 0; });
  }

  /* ¿El tipo de un nombre NO es otro distinto del de otro? Es el mismo, uno es el nombre corto o antiguo del
     otro, o uno es el otro abreviado. */
  function tipoCompatible(viejo, nuevo, tipos) {
    var a = tipoYResto(viejo, tipos).nombres, b = tipoYResto(nuevo, tipos).nombres;
    return a.some(function (x) {
      return b.some(function (y) { return norm(x) === norm(y) || abreviado(x, y); });
    });
  }

  /* ¿Esta carpeta encaja con este asunto perdido? El mismo número; o la misma fecha, el mismo tercero y un
     tipo que no es otro distinto. */
  function encaja(viejo, nuevo, tipos) {
    var a = analizar(viejo, tipos), b = analizar(nuevo, tipos);
    if (a.numero && a.numero === b.numero) return true;
    if (!a.fecha || a.fecha !== b.fecha) return false;
    var quitar = function (resto) { return norm(window.Nombres && Nombres.terceroDeResto ? Nombres.terceroDeResto(resto) : resto); };
    var ta = quitar(tipoYResto(viejo, tipos).resto), tb = quitar(tipoYResto(nuevo, tipos).resto);
    var mismo = mismoTercero(a.id, b.id) || (!a.id && !b.id && ta !== '' && ta === tb);
    return !!mismo && tipoCompatible(viejo, nuevo, tipos);
  }

  /* De las candidatas, las que encajan. Solo vale proponer una si es la única. */
  function encajes(viejo, candidatos, tipos) {
    return (candidatos || []).filter(function (c) { return encaja(viejo, c.nombre, tipos); });
  }

  /* ¿Se parece de verdad, o solo comparten algo suelto? */
  function seParece(r) {
    return r.numero || r.tercero || (r.tipo && (r.fecha || r.palabras >= 1)) || r.palabras >= 2;
  }

  function esClaro(r) { return !!(r.numero || (r.tercero && r.tipo)); }

  /* `candidatos`: [{ nombre, ... }]. Devuelve la misma lista ordenada de más a menos parecida, cada uno
     como { nombre, candidato, parecido, puntos, claro }; `claro` solo en el primero, y solo si no hay empate. */
  function ordenar(viejo, candidatos, tipos) {
    var lista = (candidatos || []).map(function (c) {
      var p = puntuar(viejo, c.nombre, tipos);
      return { nombre: c.nombre, candidato: c, parecido: p, puntos: p.puntos, claro: false };
    });
    lista.sort(function (x, y) {
      if (y.puntos !== x.puntos) return y.puntos - x.puntos;
      return x.nombre < y.nombre ? -1 : x.nombre > y.nombre ? 1 : 0;
    });
    if (lista.length && esClaro(lista[0].parecido) && !(lista.length > 1 && lista[1].puntos === lista[0].puntos)) {
      lista[0].claro = true;
    }
    return lista;
  }

  /* El que más se parece, o null si ninguno se parece de verdad (para proponer sin que se pida). */
  function mejor(viejo, candidatos, tipos) {
    var lista = ordenar(viejo, candidatos, tipos);
    return lista.length && seParece(lista[0].parecido) ? lista[0] : null;
  }

  return { analizar: analizar, puntuar: puntuar, ordenar: ordenar, mejor: mejor, seParece: seParece, esClaro: esClaro, PESO: PESO,
    encaja: encaja, encajes: encajes, tipoCompatible: tipoCompatible };
})();
window.ParecidoDeCarpetas = ParecidoDeCarpetas;
