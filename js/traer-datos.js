/* ============================================================
   traer-datos.js — el botón "Traer ficheros de Séneca".

   Hasta ahora, para actualizar el alumnado había que bajar el fichero
   de Séneca y acertar con la carpeta: _GESTOR/datos, dentro de la
   carpeta de asuntos abiertos. Es fácil dejarlo un piso más arriba.

   Con este botón se elige el fichero donde esté —Descargas, el
   escritorio, un pendrive— y la aplicación guarda una copia en su
   sitio, con el nombre que le toca. El fichero original no se toca.

   Se pueden elegir varios de una vez: el de alumnado y los dos de
   personal salen juntos de Séneca.

   El botón sale en dos sitios: en Ajustes, dentro de "Ficheros de
   datos", y en el propio aviso rojo de cuando falta el RegAlum.
   ============================================================ */
(function () {

  /* Qué nombre le toca a cada fichero dentro de _GESTOR/datos.

     El alumnado se guarda siempre como RegAlum.csv: así hay uno solo y
     el nuevo pisa al viejo, que es lo que se quiere.

     Los de personal conservan su nombre, porque el curso viene escrito
     en él (RelPerCen 26-27.csv) y la aplicación lo lee de ahí. */
  var CLASES = [
    { clave: 'ALUMNADO', prefijo: 'regalum', rotulo: 'Alumnado matriculado (RegAlum)',
      nombre: function () { return 'RegAlum.csv'; } },
    { clave: 'PERSONAL', prefijo: 'relpercen', rotulo: 'Personal del centro (RelPerCen)',
      nombre: function (original) { return original; } }
  ];

  function claseDe(nombre) {
    var n = U.normalizar(nombre);
    for (var i = 0; i < CLASES.length; i++) {
      if (n.indexOf(CLASES[i].prefijo) === 0) return CLASES[i];
    }
    return null;
  }

  /* Cuando el nombre no dice qué es, se pregunta. */
  async function preguntarQueEs(nombre) {
    var ok = await U.preguntar(
      '¿Qué fichero es este?',
      '<p>' + U.escapar(nombre) + ' no tiene nombre de fichero de Séneca.</p>' +
      '<div class="opciones">' +
        CLASES.map(function (c, i) {
          return '<label class="opcion"><input type="radio" name="que-fichero" value="' + c.clave + '"' +
                 (i === 0 ? ' checked' : '') + '><span>' + c.rotulo + '</span></label>';
        }).join('') +
      '</div>' +
      '<p class="nota">Si no es ninguno de los dos, cancela: aquí solo van los ficheros de datos.</p>',
      'Traerlo');
    if (!ok) return null;
    var marcado = document.querySelector('input[name="que-fichero"]:checked');
    var clave = marcado ? marcado.value : CLASES[0].clave;
    for (var i = 0; i < CLASES.length; i++) {
      if (CLASES[i].clave === clave) return CLASES[i];
    }
    return null;
  }

  /* `carpetaInicio` es la carpeta de datos, si ya se conoce
     (17-sep-2026, fila 20): no es de donde vienen los CSV, pero es la
     única carpeta de la aplicación que este botón tiene a mano, y
     sirve igual para no empezar siempre en la misma carpeta de
     Windows. Sin ella, se abre donde el navegador quiera, como
     siempre. */
  function elegirFicheros(carpetaInicio) {
    var opciones = {
      multiple: true,
      types: [{ description: 'Ficheros CSV de Séneca', accept: { 'text/csv': ['.csv'] } }]
    };
    if (carpetaInicio) opciones.startIn = carpetaInicio;
    return window.showOpenFilePicker(opciones);
  }

  /* Después de traer ficheros, lo leído antes ya no vale y el aviso de
     arriba puede haber dejado de tener razón. Fila 193: el botón de
     "vuelve a mirar" ya no vive en el aviso (que ahora es un trozo más
     de la franja de js/avisos-linea.js), sino en el propio bloque de
     Mantenimiento (js/frescura.js, #btn-frescura-repasar): se pulsa
     solo, igual que antes. */
  function repasarLaPantalla() {
    try { Datos.olvidar(); } catch (e) {}
    var boton = document.getElementById('btn-frescura-repasar');
    if (boton) boton.click();
    if (window.Gestor && window.Gestor.recargar) window.Gestor.recargar();
    if (window.DatosQueTengoVer) DatosQueTengoVer.repintar();   /* fila 319: la tabla «Lo que tengo ahora» */
  }

  /* Fila 312: copia un fichero (el que sea, venga de donde venga) a `_GESTOR/datos` con el nombre que le toca.
     `clave`: 'ALUMNADO' o 'PERSONAL' si ya se sabe qué es; si no, se mira por su nombre. Devuelve el nombre puesto. */
  async function copiarUno(h, clase, nombreDestino, origen) {
    if (typeof clase === 'string') clase = CLASES.filter(function (c) { return c.clave === clase; })[0];
    clase = clase || claseDe(h.name);
    if (!clase) throw new Error(h.name + ' no tiene nombre de fichero de Séneca');
    var destino = nombreDestino || clase.nombre(h.name);   /* fila 317: el Centro de datos puede decidir el nombre */
    await Carpetas.copiarFicheroEn(App.E.datos, h, destino);
    /* Fila 319: se apunta por dónde llegó. Sin `origen`, a mano, con la fecha del fichero elegido (cuándo se bajó de Séneca). */
    if (window.DatosQueTengo) {
      var o = origen;
      if (!o) {
        var modificado = 0;
        try { modificado = (await h.getFile()).lastModified; } catch (e) { modificado = 0; }
        o = { via: 'a-mano', fechaOriginal: modificado };
      }
      await DatosQueTengo.apuntar(destino, Object.assign({ nombreOriginal: h.name }, o));
    }
    return destino;
  }

  async function traer() {
    var datos = App.E.datos;
    if (!datos) { U.aviso('Todavía no hay carpeta de datos.', 'malo'); return; }

    var elegidos;
    try {
      elegidos = await elegirFicheros(datos);
    } catch (e) {
      return;   /* ha cerrado el cuadro: no hay nada que decir */
    }

    var traidos = [];
    for (var i = 0; i < elegidos.length; i++) {
      var h = elegidos[i];
      var clase = claseDe(h.name);
      if (!clase) clase = await preguntarQueEs(h.name);
      if (!clase) continue;
      try {
        traidos.push(await copiarUno(h, clase));
      } catch (e) {
        U.aviso('No he podido traer ' + h.name + ': ' + U.mensajeDeError(e), 'malo');
      }
    }

    if (!traidos.length) return;
    repasarLaPantalla();
    U.aviso(traidos.length === 1
      ? traidos[0] + ' ya está en su sitio.'
      : 'Ya están en su sitio: ' + traidos.join(', ') + '.', 'bueno');
  }

  function botonNuevo(texto, principal) {
    var b = document.createElement('button');
    b.className = 'boton' + (principal ? ' boton-principal' : '');
    b.textContent = texto;
    b.onclick = traer;
    return b;
  }

  /* ---------- el botón de Ajustes ----------

     Fila 200, apartado 7, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md: ya
     no se mete junto a "Ficheros de datos" (El centro), sino dentro
     del bloque "Traer el alumnado" de la pestaña "Herramientas", junto
     al botón de la BD de alumnado (js/alumnado-bd.js). */

  function ponerEnAjustes() {
    var caja = document.getElementById('herramientas-traer-seneca');
    if (!caja || document.getElementById('btn-traer-datos')) return;
    var fila = document.createElement('div');
    fila.className = 'alta-tipo';
    var b = botonNuevo('Traer ficheros de Séneca', true);
    b.id = 'btn-traer-datos';
    fila.appendChild(b);
    var nota = document.createElement('span');
    nota.className = 'suave';
    nota.textContent = 'Elige el fichero donde lo tengas descargado. La aplicación lo coloca sola.';
    fila.appendChild(nota);
    caja.appendChild(fila);
  }

  /* ---------- el botón del aviso de arriba ----------

     Fila 193, apartado 1: el aviso de fichero viejo ya no tiene caja
     propia, es el trozo "frescura" de la franja única de
     js/avisos-linea.js (#avisos-linea). La franja se vuelve a pintar
     entera cada vez que cambia, así que el botón se pone otra vez
     cada vez que eso pasa, igual que antes. */

  function ponerEnElAviso() {
    var caja = document.getElementById('avisos-linea');
    if (!caja || caja.classList.contains('oculto')) return;
    if (!caja.querySelector('[data-aviso="frescura"]')) return;
    if (caja.querySelector('.btn-traer-aviso')) return;
    var b = botonNuevo('Traer el fichero desde donde lo tengas', false);
    b.className += ' btn-traer-aviso';
    var ocultar = document.getElementById('avisos-linea-ocultar');
    if (ocultar) caja.insertBefore(b, ocultar); else caja.appendChild(b);
  }

  function vigilarElAviso() {
    var sitio = document.getElementById('pantalla-abiertos') || document.body;
    if (!sitio || typeof MutationObserver !== 'function') return;
    new MutationObserver(function () { ponerEnElAviso(); }).observe(sitio, {
      childList: true, subtree: true
    });
  }

  function arrancar() {
    ponerEnAjustes();
    ponerEnElAviso();
    vigilarElAviso();
  }

  window.TraerDatos = { copiarUno: copiarUno, repasar: repasarLaPantalla };

  arrancar();
  if (!document.getElementById('btn-traer-datos')) {
    document.addEventListener('DOMContentLoaded', arrancar);
  }

})();
