/* ============================================================
   campos-clases.js — las clases de un campo propio: Texto libre, Lista
   cerrada, Importe en euros, Número y Fecha (1-oct-2026, fila 244,
   docs/CAMPOS-IMPORTE-NUMERO-FECHA.md).

   Todo lo que lee o enseña el valor de un campo propio pasa por aquí
   (`leer`, `mostrar`): nadie formatea por su cuenta. FUNCIONES PURAS.

   - Importe en euros: solo cifras, coma o punto como separador decimal,
     signo menos permitido. Se guarda con dos decimales (`1234.50`) y se ve
     siempre `1.234,50 €`.
   - Número: igual, con decimales y negativos, sin ceros de sobra. Se guarda
     `1234.5` y se ve `1.234,5`.
   - Fecha: se guarda `AAAA-MM-DD` y se ve `01/10/2026`.
   - Vacío vale en las tres.

   Un valor que no encaja con su clase (por ejemplo «unos 30 euros» en un
   campo que antes era texto) NO se borra: se queda tal cual y se enseña en
   ámbar para corregirlo.
   ============================================================ */
var CamposClases = (function () {

  var CLASES = [
    { id: 'texto', nombre: 'Texto libre' },
    { id: 'lista', nombre: 'Lista cerrada' },
    { id: 'importe', nombre: 'Importe en euros' },
    { id: 'numero', nombre: 'Número' },
    { id: 'fecha', nombre: 'Fecha' }
  ];

  function esValida(clase) { return CLASES.some(function (c) { return c.id === clase; }); }
  function esNueva(clase) { return clase === 'importe' || clase === 'numero' || clase === 'fecha'; }
  function nombreDe(clase) {
    var c = CLASES.filter(function (x) { return x.id === clase; })[0];
    return c ? c.nombre : 'Texto libre';
  }

  /* «12», «12,50», «12,50 €», «1.234,56», «1.200», «125.50», «-80» → número; si no, null. */
  function numeroDe(texto) {
    var t = String(texto === null || texto === undefined ? '' : texto)
      .replace(/€|euros?/gi, '').replace(/[\s ]/g, '').replace(/−/g, '-');
    if (!t) return null;
    var n;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) n = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d+(,\d+)?$/.test(t)) n = t.replace(',', '.');
    else if (/^-?\d+\.\d+$/.test(t)) n = t;
    else return null;
    var v = parseFloat(n);
    return isFinite(v) ? v : null;
  }

  function dos(n) { return (n < 10 ? '0' : '') + n; }

  /* «2026-10-01», «1/10/2026», «01-10-26» → 'AAAA-MM-DD' de una fecha que existe; si no, ''. */
  function fechaDe(texto) {
    var t = String(texto === null || texto === undefined ? '' : texto).trim();
    var a, m, d;
    var iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    var es = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
    if (iso) { a = +iso[1]; m = +iso[2]; d = +iso[3]; }
    else if (es) { d = +es[1]; m = +es[2]; a = es[3].length === 2 ? 2000 + (+es[3]) : +es[3]; }
    else return '';
    var f = new Date(a, m - 1, d);
    if (f.getFullYear() !== a || f.getMonth() !== m - 1 || f.getDate() !== d) return '';
    return a + '-' + dos(m) + '-' + dos(d);
  }

  /* Una cifra al estilo español: punto de miles, coma decimal. `decimales`: número fijo; null = sin ceros de sobra. */
  function formatoEs(n, decimales) {
    var negativo = n < 0;
    var s = Math.abs(n).toFixed(decimales === null ? 10 : decimales);
    if (decimales === null) s = s.replace(/\.?0+$/, '');
    var partes = s.split('.');
    var entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negativo && +s !== 0 ? '-' : '') + entero + (partes[1] ? ',' + partes[1] : '');
  }

  /* { ok, valor } — `valor` ya en la forma que se guarda. Vacío es válido. */
  function leer(clase, texto) {
    var t = String(texto === null || texto === undefined ? '' : texto).trim();
    if (!esNueva(clase) || !t) return { ok: true, valor: t };
    if (clase === 'fecha') {
      var iso = fechaDe(t);
      return iso ? { ok: true, valor: iso } : { ok: false, valor: t };
    }
    var n = numeroDe(t);
    if (n === null) return { ok: false, valor: t };
    return { ok: true, valor: clase === 'importe' ? n.toFixed(2) : String(+n.toFixed(10)) };
  }

  /* Lo que se ve: `1.234,50 €`, `1.234,5`, `01/10/2026`. Lo que no encaja, tal cual. */
  function mostrar(clase, valor) {
    var t = String(valor === null || valor === undefined ? '' : valor).trim();
    var r = leer(clase, t);
    if (!esNueva(clase) || !t || !r.ok) return t;
    if (clase === 'fecha') { var p = r.valor.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
    return clase === 'importe' ? formatoEs(parseFloat(r.valor), 2) + ' €' : formatoEs(parseFloat(r.valor), null);
  }

  /* ¿Un valor escrito que no encaja con su clase? (el ámbar) */
  function noEncaja(clase, valor) {
    var t = String(valor === null || valor === undefined ? '' : valor).trim();
    return esNueva(clase) && !!t && !leer(clase, t).ok;
  }

  /* El aviso en ámbar y su ayuda al pasar el ratón. */
  function avisoDeAmbar(clase) {
    if (clase === 'fecha') return 'Escribe una fecha, por ejemplo 01/10/2026';
    return 'Escribe solo la cifra, por ejemplo 125,50';
  }
  function ayudaDeAmbar(clase) {
    if (clase === 'importe') return 'No es un importe: corrígelo';
    if (clase === 'numero') return 'No es un número: corrígelo';
    return 'No es una fecha: corrígela';
  }

  /* Al cambiar un campo a otra clase: el valor ya convertido si se entiende, tal cual si no.
     `valores`: la lista de la clase «lista» nueva, si lo es. { valor, entendido } */
  function convertir(claseNueva, valorViejo, valores) {
    var t = String(valorViejo === null || valorViejo === undefined ? '' : valorViejo).trim();
    if (!t) return { valor: t, entendido: true };
    if (claseNueva === 'lista') {
      var enLista = (valores || []).filter(function (v) { return v === t; })[0];
      return enLista !== undefined ? { valor: t, entendido: true } : { valor: valorViejo, entendido: false };
    }
    var r = leer(claseNueva, t);
    return r.ok ? { valor: r.valor, entendido: true } : { valor: valorViejo, entendido: false };
  }

  /* ---------- el control de un campo en pantalla (Nuevo asunto, Cambiar el asunto, el paso del valor de la fila 245) ---------- */

  /* El HTML del control: lista → desplegable; fecha → calendario; importe y número →
     caja con teclado numérico; texto → caja. `valor`: lo guardado. */
  function htmlControl(id, clase, valores, valor) {
    var t = String(valor === null || valor === undefined ? '' : valor);
    if (clase === 'lista') {
      return '<select id="' + id + '" class="campo"><option value="">Sin elegir</option>' +
        (valores || []).map(function (v) {
          return '<option value="' + U.escapar(v) + '"' + (v === t ? ' selected' : '') + '>' + U.escapar(v) + '</option>';
        }).join('') + '</select>';
    }
    if (clase === 'fecha') {
      var iso = fechaDe(t);
      return '<input id="' + id + '" type="date" class="campo" value="' + (iso || '') + '">';
    }
    var visto = esNueva(clase) ? mostrar(clase, t) : t;
    return '<input id="' + id + '" class="campo" autocomplete="off"' + (esNueva(clase) ? ' inputmode="decimal"' : '') +
      ' value="' + U.escapar(visto) + '">';
  }

  /* Lo escrito en el control: { ok, valor (como se guarda), texto (como se ve, para el nombre) }. */
  function leerControl(el, clase) {
    var bruto = el ? String(el.value || '') : '';
    if (clase === 'fecha') {
      var iso = fechaDe(bruto);
      return { ok: true, valor: iso, texto: iso ? mostrar('fecha', iso) : '' };
    }
    var r = leer(clase, bruto);
    return { ok: r.ok, valor: r.ok ? r.valor : '', texto: r.ok ? mostrar(clase, r.valor) : bruto.trim() };
  }

  /* Importe y número: al salir de la caja se reescribe ya formateada; si no se entiende, la
     caja se pone en ámbar con su aviso. `alCambiar` (opcional) se llama tras cada cambio. */
  function engancharControl(el, clase, alCambiar) {
    if (!el || (clase !== 'importe' && clase !== 'numero')) return;
    function aviso() {
      var a = el.nextElementSibling;
      return (a && a.classList.contains('campo-aviso-ambar')) ? a : null;
    }
    function repintar(alSalir, sinAvisar) {
      var r = leer(clase, el.value);
      if (r.ok) {
        el.classList.remove('campo-ambar'); el.title = '';
        var a = aviso(); if (a) a.remove();
        if (alSalir && r.valor) el.value = mostrar(clase, r.valor);
      } else {
        el.classList.add('campo-ambar'); el.title = ayudaDeAmbar(clase);
        if (!aviso()) {
          var s = document.createElement('div');
          s.className = 'campo-aviso-ambar';
          s.textContent = avisoDeAmbar(clase);
          el.parentNode.insertBefore(s, el.nextSibling);
        }
      }
      if (alCambiar && !sinAvisar) alCambiar();
    }
    /* Un valor ya guardado que no encaja sale en ámbar desde el principio. */
    if (noEncaja(clase, el.value)) repintar(false, true);
    el.addEventListener('blur', function () { repintar(true); });
    el.addEventListener('input', function () { if (el.classList.contains('campo-ambar')) repintar(false); });
  }

  return {
    htmlControl: htmlControl, leerControl: leerControl, engancharControl: engancharControl,
    CLASES: CLASES, esValida: esValida, esNueva: esNueva, nombreDe: nombreDe,
    numeroDe: numeroDe, fechaDe: fechaDe, formatoEs: formatoEs,
    leer: leer, mostrar: mostrar, noEncaja: noEncaja,
    avisoDeAmbar: avisoDeAmbar, ayudaDeAmbar: ayudaDeAmbar, convertir: convertir
  };
})();
window.CamposClases = CamposClases;
