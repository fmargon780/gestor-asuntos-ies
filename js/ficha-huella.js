/* ============================================================
   ficha-huella.js — la ficha se repinta solo si algo ha cambiado (la huella), y se reengancha al releer la carpeta.

   Sacado tal cual de js/ficha-asunto.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la ficha (el asunto que se ve, su modo, la huella…) y lo
   de los demás ficheros de la ficha se piden a `window.FichaNucleo` (N).
   Se carga justo detrás de js/ficha-asunto.js.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* Cada vez que se relee la carpeta (App.verAbiertos, envuelta más
     abajo), el asunto que tenía la ficha en la mano deja de ser el
     mismo objeto. Aquí se vuelve a coger de la lista fresca, por su
     nombre, y se repinta en su sitio: así un repaso automático de la
     carpeta (`App.mirarLaCarpeta`) o guardar un documento dentro del
     asunto nunca echan a Francisco a la lista, solo refrescan lo que
     tienen delante. Si el asunto ya no está en absoluto (se ha
     archivado o borrado desde el otro ordenador), entonces sí se
     vuelve, con un aviso de una línea.

     ...pero solo se repinta SI DE VERDAD HA CAMBIADO ALGO (17-sep-2026,
     fila 34). Antes se repintaba en cada pasada: bastaba con que el
     compañero dejara un papel suelto en "Por clasificar" para que la
     ficha abierta se rehiciera entera y se llevara por delante la nota
     a medio escribir. Ahora se compara una huella de texto del asunto
     con la de lo que ya se está enseñando. */

  /* La huella va en dos mitades a propósito. Los hitos no los pinta
     este fichero, sino js/hitos-panel.js dentro de #ficha-guia: si solo
     han cambiado ellos, repintar la ficha entera sería tirar abajo
     media pantalla para nada, y de paso se llevaría por delante la
     nota de hito a medio escribir. Con las dos mitades separadas, un
     cambio de hitos se le pide al panel de hitos, que ya sabe
     conservar lo suyo. */
  /* Lo último que se leyó de la carpeta de la ficha, para poder poner
     la huella al día sin volver al disco (App.repintarAccionesFicha). */

  function huellaFichaSin(a, listaFicheros) {
    return [a.nombre, JSON.stringify(a.leido || {}), JSON.stringify(a.ficha || {}), listaFicheros].join('\n');
  }

  async function huellaDe(a) {
    if (!a) return { ficha: '', hitos: '' };
    var lista;
    try {
      var ficheros = await Carpetas.ficheros(a.handle);
      lista = ficheros.map(function (f) { return f.nombre; }).join('|');
    } catch (e) { lista = 'carpeta-ilegible'; }
    if (a === N.actual) N.ultimaListaFicheros = lista;
    var trozos = [huellaFichaSin(a, lista)];

    var hitos;
    try {
      var datos = window.Hitos ? await window.Hitos.leer() : null;
      var entrada = datos && datos.porAsunto[a.nombre];
      hitos = JSON.stringify(entrada ? entrada.hitos : []);
    } catch (e) { hitos = 'hitos-ilegibles'; }

    return { ficha: trozos.join('\n'), hitos: hitos };
  }

  /* Después de pintar se apunta la huella de lo que ha quedado en
     pantalla, para que la siguiente pasada tenga con qué comparar. */
  function apuntarHuella() {
    var a = N.actual;
    return huellaDe(a).then(function (huella) { if (N.actual === a) N.huellaPintada = huella; });
  }

  App.reengancharFicha = function () {
    if (!N.fichaVisible() || N.modoActual !== 'abierto') return Promise.resolve();
    var mismo = App.E.listaAbiertos.filter(function (x) { return x.nombre === N.actual.nombre; })[0];
    if (!mismo) {
      /* Si este mismo ordenador lo acaba de archivar (fila 90,
         docs/ARCHIVAR-SIN-AVISOS-FALSOS.md), el aviso verde de
         App.cerrarAsunto ya lo ha dicho: no hace falta este otro en rojo. */
      if (App.E.recienArchivados[N.actual.nombre]) {
        delete App.E.recienArchivados[N.actual.nombre];
      } else {
        U.aviso('Este asunto ya no está en Asuntos abiertos: puede que se haya archivado o ' +
          'borrado desde el otro ordenador.', 'malo');
      }
      N.volverALaLista();
      return Promise.resolve();
    }
    /* Los datos frescos se le meten DENTRO al objeto que la ficha ya
       tiene en la mano, en vez de cambiarlo por el nuevo, y es ese el
       que se queda en la lista. Los botones ya pintados se quedaron
       con el objeto de su repintado: mientras la pantalla se deja
       quieta (que desde la fila 34 es lo normal), cambiarlo por otro
       los dejaría apuntando a datos viejos —Archivar, por ejemplo,
       volvía a preguntar "¿Dónde va esta carpeta?" con la categoría ya
       puesta—. Con esto, un asunto es un solo objeto en toda la
       aplicación, y quien lo tenga cogido ve siempre lo último. */
    if (mismo !== N.actual) {
      N.actual.handle = mismo.handle;
      N.actual.leido = mismo.leido;
      N.actual.ficha = mismo.ficha;
      N.actual.busca = mismo.busca;
      App.E.listaAbiertos[App.E.listaAbiertos.indexOf(mismo)] = N.actual;
    }

    var elDeLaFicha = N.actual;
    return huellaDe(elDeLaFicha).then(function (huella) {
      if (N.actual !== elDeLaFicha || !N.fichaVisible()) return;
      var antes = N.huellaPintada || { ficha: null, hitos: null };
      N.huellaPintada = huella;
      /* Nada ha cambiado: la pantalla se deja quieta. Esto es lo que
         quita el temblor de cada 20 segundos. */
      if (huella.ficha === antes.ficha && huella.hitos === antes.hitos) return;
      if (huella.ficha !== antes.ficha) { N.pintar(); return; }
      /* Solo han cambiado los hitos (el otro ordenador ha marcado uno,
         por ejemplo): se repinta su panel, no la ficha entera. */
      if (window.HitosPanel) window.HitosPanel.programarRepintado();
    });
  };

  /* App.verAbiertos (js/asuntos-lista.js) relee la carpeta entera y
     crea asuntos nuevos cada vez: se envuelve aquí, en vez de tocar
     ese fichero, para que cualquiera de sus llamadas —el barrido
     automático, el botón "Recargar", meter un suelto o un correo en
     un asunto, añadir un tipo que faltaba— reenganche sola la ficha
     si hay una abierta, sin repetir el apaño en cada sitio. */
  U.envolver(App, 'App.verAbiertos', 'ficha-huella.js', function (comoEra) {
    return async function (yaLeido) {
      await comoEra(yaLeido);
      await App.reengancharFicha();
    };
  });

  Object.assign(N, {
    apuntarHuella: apuntarHuella,
    huellaFichaSin: huellaFichaSin
  });
})();
