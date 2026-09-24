/* ============================================================
   util-parecidos.js — los nombres que se parecen (U.parecidos,
   U.dejaCrear). Salió de js/util.js en la fila 133 (24-sep-2026,
   docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada. Se carga justo
   después de js/util.js.
   ============================================================ */
(function () {
  var aviso = U.aviso, preguntar = U.preguntar, escapar = U.escapar;

  /* ============================================================
     NOMBRES QUE SE PARECEN

     Sirve para que una lista del centro —tipos de asunto, estados,
     tipos de documento— no acabe con FACTURA, Facturas y
     FACTURA-RECTIFICATIVA conviviendo. Cada nombre se reduce a su
     hueso: sin tildes, sin mayúsculas, sin espacios ni guiones ni
     puntos, y sin la S del plural. Dos nombres con el mismo hueso son
     el mismo nombre escrito de dos maneras.
     ============================================================ */

  function hueso(texto) {
    return String(texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function huesoSinPlural(texto) {
    return hueso(texto).replace(/e?s$/, '');
  }

  /* Cuántas letras hay que cambiar para pasar de una palabra a la otra.
     Sirve para cazar la errata: FACTURA y FCATURA están a dos. */
  function distancia(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var fila = [];
    for (var j = 0; j <= b.length; j++) fila[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var anterior = fila[0];
      fila[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var guardar = fila[k];
        fila[k] = Math.min(
          fila[k] + 1,
          fila[k - 1] + 1,
          anterior + (a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1)
        );
        anterior = guardar;
      }
    }
    return fila[b.length];
  }

  /* Los nombres de la lista que se parecen al que se está escribiendo.
     'igual' quiere decir que es el mismo escrito de otra manera, y
     entonces no hay nada que crear: se usa el que ya está. */
  function parecidos(nombre, lista) {
    var h = hueso(nombre);
    var hp = huesoSinPlural(nombre);
    if (!h) return [];
    var salida = [];
    (lista || []).forEach(function (t) {
      var k = hueso(t);
      var kp = huesoSinPlural(t);
      if (!k) return;
      var d = distancia(h, k);
      var largo = Math.max(h.length, k.length);
      var igual = (k === h) || (kp === hp);
      var cerca = igual ||
                  (largo >= 6 ? d <= 2 : d <= 1) ||
                  (h.length >= 4 && k.length >= 4 && (k.indexOf(h) !== -1 || h.indexOf(k) !== -1));
      if (cerca) salida.push({ nombre: t, igual: igual, distancia: d });
    });
    salida.sort(function (a, b) {
      if (a.igual !== b.igual) return a.igual ? -1 : 1;
      return a.distancia - b.distancia;
    });
    return salida;
  }

  /* La guardia completa, para las pantallas que añaden a una lista.
     Devuelve una promesa: true si se puede crear, false si no.

     - Si ya está escrito de otra manera, no deja y dice cuál es.
     - Si solo se parece, avisa y deja decidir.
     - Si no se parece a nada, pasa sin molestar. */
  function dejaCrear(nombre, lista, queEs) {
    var cerca = parecidos(nombre, lista);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      aviso('Ese ' + queEs + ' ya está en la lista, escrito así: ' + mismo.nombre + '.', 'malo');
      return Promise.resolve(false);
    }
    if (!cerca.length) return Promise.resolve(true);
    return preguntar('¿Es otro de verdad?',
      '<p>Vas a añadir <strong>' + escapar(nombre) + '</strong>.</p>' +
      '<p>Ya hay ' + (cerca.length === 1 ? 'uno que se le parece' : 'otros que se le parecen') + ':</p>' +
      '<ul class="lista-repetidos">' +
        cerca.slice(0, 4).map(function (p) { return '<li>' + escapar(p.nombre) + '</li>'; }).join('') +
      '</ul>' +
      '<p class="nota">Si es el mismo con otro nombre, cancela y usa el que ya está. ' +
      'La lista la veis los dos, y dos nombres para lo mismo se acaban pagando.</p>',
      'Añadirlo igualmente');
  }

  /* Traduce al castellano los errores que lanza el navegador al tocar
     el disco (17-sep-2026, fila 45): un NotFoundError en inglés no le
     dice nada a quien lo lee. Un solo sitio para traducir, por
     `e.name`; los errores nuestros ya están en castellano y se
     devuelven tal cual. Los usan `App.cerrarAsunto` y
     `App.reabrirAsunto` en su `catch`: nunca más un mensaje en inglés
     en pantalla. */

  U.parecidos = parecidos;
  U.dejaCrear = dejaCrear;
})();
