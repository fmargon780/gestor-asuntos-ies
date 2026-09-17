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
     arriba puede haber dejado de tener razón. El aviso trae su propio
     botón de volver a mirar: se pulsa solo. */
  function repasarLaPantalla() {
    try { Datos.olvidar(); } catch (e) {}
    var panel = document.getElementById('panel-frescura');
    if (panel) {
      var botones = panel.querySelectorAll('button');
      for (var i = 0; i < botones.length; i++) {
        if (botones[i].textContent.indexOf('vuelve a mirar') !== -1) { botones[i].click(); break; }
      }
    }
    if (window.Gestor && window.Gestor.recargar) window.Gestor.recargar();
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
      var destino = clase.nombre(h.name);
      try {
        await Carpetas.copiarFicheroEn(datos, h, destino);
        traidos.push(destino);
      } catch (e) {
        U.aviso('No he podido traer ' + h.name + ': ' + e.message, 'malo');
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

  /* ---------- el botón de Ajustes ---------- */

  function ponerEnAjustes() {
    var caja = document.getElementById('estado-datos');
    if (!caja || document.getElementById('btn-traer-datos')) return;
    var fila = document.createElement('div');
    fila.className = 'alta-tipo';
    var b = botonNuevo('Traer ficheros de Séneca', true);
    b.id = 'btn-traer-datos';
    fila.appendChild(b);
    var nota = document.createElement('span');
    nota.className = 'suave';
    nota.textContent = 'Elige el fichero donde lo tengas bajado; se copia solo a _GESTOR/datos.';
    fila.appendChild(nota);
    caja.parentNode.insertBefore(fila, caja);
  }

  /* ---------- el botón del aviso de arriba ----------

     El aviso se vuelve a pintar entero cada vez que cambia, así que el
     botón se pone otra vez cada vez que eso pasa. */

  function ponerEnElAviso() {
    var panel = document.getElementById('panel-frescura');
    if (!panel || panel.classList.contains('oculto')) return;
    if (panel.querySelector('.btn-traer-aviso')) return;
    var botones = panel.querySelector('.avisos-botones');
    if (!botones) return;
    var b = botonNuevo('Traer el fichero desde donde lo tengas', true);
    b.className += ' btn-traer-aviso';
    botones.insertBefore(b, botones.firstChild);
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

  arrancar();
  if (!document.getElementById('btn-traer-datos')) {
    document.addEventListener('DOMContentLoaded', arrancar);
  }

})();
