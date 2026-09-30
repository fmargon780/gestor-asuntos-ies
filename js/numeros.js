/* ============================================================
   numeros.js — el número único de cada asunto y de cada documento
   (30-sep-2026, fila 239, docs/NOMBRES-FIJOS-CON-NUMERO.md).

   Asunto:     A26-0137   (A, año natural de dos cifras, cuatro cifras)
   Documento:  D26-01234  (D, año natural de dos cifras, cinco cifras)

   El contador vive en `_GESTOR/numeros.json`:
       { asuntos: { "26": 137 }, documentos: { "26": 1234 } }
   y vuelve a 1 cada 1 de enero. Dos ordenadores a la vez: antes de dar
   un número se relee el fichero del disco y se comprueba que no
   aparece ya en ninguna ficha ni en el índice del ARCHIVO; si aparece,
   se salta al siguiente libre. Un número dado no se reutiliza nunca.

   Todo el acceso al fichero va por `ColaGuardado` (en fila con los
   demás) y se guarda con `Copias.guardar`.

   Parte pura (sin disco): `formato`, `leer`, `anoDe`, `siguienteLibre`.
   ============================================================ */
var Numeros = (function () {

  var FICHERO = 'numeros.json';
  var RE_ASUNTO = /^A(\d{2})-(\d{4})$/;
  var RE_DOCUMENTO = /^D(\d{2})-(\d{5})$/;
  /* Para buscar dentro de un nombre de carpeta o de documento. */
  var RE_ASUNTO_EN_NOMBRE = /(?:^|\s)(A\d{2}-\d{4})(?=\s|$)/;
  var RE_DOCUMENTO_EN_NOMBRE = /(?:^|\s)(D\d{2}-\d{5})(?=\s|\.|$)/;

  var CIFRAS = { asuntos: 4, documentos: 5 };
  var LETRA = { asuntos: 'A', documentos: 'D' };

  /* ---------- parte pura ---------- */

  function dos(n) { return String(n).padStart(2, '0'); }

  /* Las dos últimas cifras del año natural de `fecha` (Date o AAAA-MM-DD);
     sin fecha, el de hoy. Es el año de la creación real, no el de la
     fecha de inicio del asunto. */
  function anoDe(fecha) {
    var f = fecha instanceof Date ? fecha : (/^\d{4}/.test(String(fecha || '')) ? new Date(String(fecha).slice(0, 10) + 'T12:00:00') : new Date());
    if (isNaN(f.getTime())) f = new Date();
    return dos(f.getFullYear() % 100);
  }

  function formato(clase, ano, n) {
    return LETRA[clase] + dos(ano) + '-' + String(n).padStart(CIFRAS[clase], '0');
  }

  /* 'A26-0137' -> { clase: 'asuntos', ano: '26', n: 137 }; si no es un número, null. */
  function leer(texto) {
    var t = String(texto || '').trim();
    var m = RE_ASUNTO.exec(t);
    if (m) return { clase: 'asuntos', ano: m[1], n: parseInt(m[2], 10) };
    m = RE_DOCUMENTO.exec(t);
    if (m) return { clase: 'documentos', ano: m[1], n: parseInt(m[2], 10) };
    return null;
  }

  function delNombreDeAsunto(nombre) {
    var m = RE_ASUNTO_EN_NOMBRE.exec(String(nombre || ''));
    return m ? m[1] : '';
  }

  function delNombreDeDocumento(nombre) {
    var m = RE_DOCUMENTO_EN_NOMBRE.exec(String(nombre || ''));
    return m ? m[1] : '';
  }

  /* El primer número libre del año: el mayor entre el contador y lo
     ya ocupado, más uno. `ocupados`: lista de textos ('A26-0137'). */
  function siguienteLibre(clase, ano, contador, ocupados) {
    var mayor = Number(contador) || 0;
    (ocupados || []).forEach(function (t) {
      var l = leer(t);
      if (l && l.clase === clase && l.ano === ano && l.n > mayor) mayor = l.n;
    });
    return mayor + 1;
  }

  /* ---------- disco ---------- */

  var enMemoria = { asuntos: {}, documentos: {} };   /* sin _GESTOR (pruebas sueltas) */

  function gestor() { return window.App && App.E && App.E.gestor; }

  async function leerContadores() {
    var g = gestor();
    if (!g) return { asuntos: Object.assign({}, enMemoria.asuntos), documentos: Object.assign({}, enMemoria.documentos) };
    var r = await Carpetas.leerJson(g, FICHERO);
    return {
      asuntos: (r && r.asuntos && typeof r.asuntos === 'object') ? r.asuntos : {},
      documentos: (r && r.documentos && typeof r.documentos === 'object') ? r.documentos : {}
    };
  }

  async function guardarContadores(c) {
    var g = gestor();
    if (!g) { enMemoria = { asuntos: c.asuntos, documentos: c.documentos }; return; }
    await Copias.guardar(g, FICHERO, { asuntos: c.asuntos, documentos: c.documentos });
  }

  /* Todo lo ya dado que se puede ver: las fichas (abiertas y archivadas),
     sus documentos y el índice del ARCHIVO. */
  async function ocupados(clase) {
    var lista = [];
    try {
      var registro = (window.App && App.leerRegistroDelDisco && gestor()) ? await App.leerRegistroDelDisco()
        : ((window.App && App.E && App.E.registro) || { asuntos: {} });
      Object.keys(registro.asuntos || {}).forEach(function (nombre) {
        var f = registro.asuntos[nombre] || {};
        if (clase === 'asuntos') {
          if (f.numero) lista.push(f.numero);
          var dn = delNombreDeAsunto(nombre);
          if (dn) lista.push(dn);
        } else {
          Object.keys(f.documentos || {}).forEach(function (k) { lista.push(k); });
        }
      });
    } catch (e) { /* sin registro que mirar: queda el contador */ }
    if (clase === 'asuntos' && window.IndiceArchivo && IndiceArchivo.leerDisco && gestor()) {
      try {
        var r = await IndiceArchivo.leerDisco({ todos: true });
        if (r && r.ok) r.datos.asuntos.forEach(function (e) {
          var n = delNombreDeAsunto(e.nombre);
          if (n) lista.push(n);
        });
      } catch (e2) { /* sin índice */ }
    }
    return lista;
  }

  /* El siguiente número SIN gastarlo (para enseñar el nombre mientras se
     escribe). Devuelve el texto, p. ej. 'A26-0138'. */
  async function proximo(clase, fecha) {
    var ano = anoDe(fecha);
    var c = await leerContadores();
    var n = siguienteLibre(clase, ano, c[clase][ano], await ocupados(clase));
    return formato(clase, ano, n);
  }

  /* Gasta un número de verdad. `esperado` (el que se enseñó en la vista
     previa) se respeta si sigue libre; si otro ordenador se lo ha quedado,
     se da el siguiente y `cambio` sale a true para que quien llama lo diga.
     Devuelve { numero, cambio }. */
  function reservar(clase, esperado, fecha) {
    var ano = anoDe(fecha);
    return App.enFila ? App.enFila(FICHERO, hacer) : hacer();

    async function hacer() {
      var c = await leerContadores();
      var usados = await ocupados(clase);
      var libre = siguienteLibre(clase, ano, c[clase][ano], usados);
      var quiero = libre, cambio = false;
      var e = leer(esperado);
      if (e && e.clase === clase && e.ano === ano) {
        if (e.n >= libre) quiero = e.n;   /* el esperado sigue libre (o más alto, por un hueco) */
        else cambio = true;
      }
      c[clase][ano] = quiero;
      await guardarContadores(c);
      return { numero: formato(clase, ano, quiero), cambio: cambio };
    }
  }

  /* ---------- el mismo fichero, el mismo número ----------

     Un mismo documento puede guardarse en varios asuntos (añadir desde
     el ordenador el mismo fichero dos veces): todas las copias llevan el
     mismo número. Se recuerda, en ESTE ordenador, el número que se dio a
     cada fichero de origen (nombre, tamaño y fecha). */
  var CLAVE_ORIGEN = 'gestor-numeros-de-origen';
  var MAXIMO_ORIGENES = 300;

  function claveDeOrigen(fichero) {
    if (!fichero || !fichero.name) return '';
    return [fichero.name, fichero.size, fichero.lastModified].join('|');
  }

  function leerOrigenes() {
    try { var v = JSON.parse(window.localStorage.getItem(CLAVE_ORIGEN) || '{}'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }

  function deOrigen(clave) { return clave ? (leerOrigenes()[clave] || '') : ''; }

  function recordarOrigen(clave, numero) {
    if (!clave || !numero) return;
    var v = leerOrigenes();
    delete v[clave];
    v[clave] = numero;
    var claves = Object.keys(v);
    while (claves.length > MAXIMO_ORIGENES) delete v[claves.shift()];
    try { window.localStorage.setItem(CLAVE_ORIGEN, JSON.stringify(v)); } catch (e) { /* sin memoria: no se recuerda */ }
  }

  return {
    claveDeOrigen: claveDeOrigen, deOrigen: deOrigen, recordarOrigen: recordarOrigen,
    FICHERO: FICHERO, RE_ASUNTO: RE_ASUNTO, RE_DOCUMENTO: RE_DOCUMENTO,
    anoDe: anoDe, formato: formato, leer: leer, siguienteLibre: siguienteLibre,
    delNombreDeAsunto: delNombreDeAsunto, delNombreDeDocumento: delNombreDeDocumento,
    proximo: proximo, reservar: reservar, _ocupados: ocupados
  };
})();
