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

   El botón vive en Herramientas, dentro de "Traer el alumnado" (fila
   200, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md, apartado 7; antes
   vivía en Ajustes → El centro → "Ficheros de datos"). Lo cuelga
   js/alumnado-bd.js, justo después de crear ese bloque, llamando a
   `TraerDatos.ponerEnAjustes()`; el aviso rojo de cuando falta el
   RegAlum (js/frescura.js) sigue llevando a "Ficheros de datos", que
   ahora solo enseña el estado, sin este botón.
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
     arriba (fila 193: js/frescura.js) puede haber dejado de tener
     razón: se le pide que vuelva a mirar directamente. */
  function repasarLaPantalla() {
    try { Datos.olvidar(); } catch (e) {}
    if (window.Frescura) window.Frescura.repasar();
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

  /* ---------- el botón de Herramientas ----------

     Fila 200: el sitio de siempre («Traer el alumnado ahora», de
     js/alumnado-bd.js) es la áncora; se llama desde ahí, no solo,
     porque ese bloque se cuelga él mismo la primera vez que se pinta
     Ajustes o Herramientas. */

  function ponerEnAjustes() {
    var ancla = document.getElementById('alumnado-bd-traer');
    if (!ancla || document.getElementById('btn-traer-datos')) return;
    var fila = document.createElement('div');
    fila.className = 'alta-tipo';
    var b = botonNuevo('Traer ficheros de Séneca', false);
    b.id = 'btn-traer-datos';
    fila.appendChild(b);
    var nota = document.createElement('span');
    nota.className = 'suave';
    nota.textContent = 'Elige el fichero donde lo tengas bajado; se copia solo a _GESTOR/datos.';
    fila.appendChild(nota);
    ancla.parentNode.insertBefore(fila, ancla.nextSibling);
  }

  window.TraerDatos = { ponerEnAjustes: ponerEnAjustes };

})();
