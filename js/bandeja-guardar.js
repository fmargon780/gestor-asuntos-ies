/* ============================================================
   bandeja-guardar.js — leer el correo, guardarlo en un asunto (o reabrirlo) y lo que pasa después de crear el asunto.

   Sacado tal cual de js/bandeja-correos.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la bandeja (la carpeta, los correos, el pendiente) y lo
   de los demás ficheros de la bandeja se piden a `window.BandejaNucleo`
   (N). Se carga justo detrás de js/bandeja-correos.js.
   ============================================================ */
(function () {
  var N = window.BandejaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* Leer el correo sin salir de la aplicación.

     Gmail no se deja meter dentro de otra página: Google lo prohíbe.
     Pero el script guarda el hilo entero en PDF, y ese PDF sí se puede
     enseñar. Sale en el panel de la derecha, con la aplicación a la
     izquierda, igual que se hace con los documentos. */
  async function leerElCorreo(d) {
    if (!window.Lector) return;
    var elPdf = d.pdf || d.pdfMensaje;
    if (!N.carpeta() || !elPdf) { U.aviso('Este correo no trae su PDF.', 'malo'); return; }
    try {
      var h = await N.carpeta().getFileHandle(elPdf);
      var fichero = await h.getFile();
      var botones = [];
      if (d.enlace) {
        botones.push({
          texto: 'Abrir en Gmail',
          alPulsar: function () { window.open(N.enlaceAGmail(d), '_blank'); }
        });
      }
      window.Lector.abrir({
        titulo: d.asunto || 'Correo',
        pie: [(d.de && (d.de.nombre || d.de.correo)) || '', N.fechaLegible(d.fecha)]
             .filter(Boolean).join('  ·  '),
        blob: fichero,
        botones: botones
      });
    } catch (e) {
      U.aviso('No he podido abrir el correo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* La carpeta de un asunto que ya existe. Si está archivado, hay que
     bajar por ARCHIVO / CATEGORÍA / TERCERO. */
  async function carpetaDelAsunto(nombre, ficha) {
    if (!N.estaArchivado(ficha)) return App.E.abiertos.getDirectoryHandle(nombre);
    if (!App.E.archivo) throw new Error('No hay carpeta de ARCHIVO señalada.');
    var dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
    return dentro.getDirectoryHandle(nombre);
  }

  async function guardarEnAsunto(item, elAsunto, reabierto) {
    var d = item.datos;
    var destino;
    try {
      destino = await carpetaDelAsunto(elAsunto.nombre, reabierto ? {} : elAsunto.ficha);
    } catch (e) {
      U.aviso('No encuentro la carpeta de ese asunto: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    /* Si ese mismo correo ya está apuntado en el asunto, no se repite
       nada: ni la nota ni los ficheros. Antes salía dos veces la misma
       nota y el PDF entraba otra vez como "CORREO (2).pdf". */
    var yaEstaba = false;
    try {
      yaEstaba = await window.Notas.yaTieneCorreo({ nombre: elAsunto.nombre, ficha: {} }, d.id);
    } catch (e) { /* si no se puede mirar, se sigue y se guarda */ }
    if (yaEstaba) {
      /* La huella sí se refresca: puede que el hilo traiga mensajes
         nuevos aunque el correo ya estuviera apuntado. */
      await N.apuntarHuella(elAsunto.nombre, d);
      await borrarDeLaBandeja(item);
      U.aviso('Ese correo ya estaba en ' + elAsunto.nombre + '. No lo he repetido.', 'bueno');
      if (window.Gestor && window.Gestor.recargar) window.Gestor.recargar();
      return;
    }

    var metidos = await meterLosFicheros(d, destino, elAsunto.nombre);
    try {
      var apunte = notaDelCorreo(d, 'Correo de',
        reabierto ? '\nCon este correo se ha reabierto el asunto.' : '');
      await window.Notas.anadir({ nombre: elAsunto.nombre, ficha: {} },
        apunte.texto, apunte.extra);
    } catch (e) { /* la nota es lo menos importante */ }
    await N.apuntarHuella(elAsunto.nombre, d);
    await borrarDeLaBandeja(item);
    var texto = metidos ? 'Guardado en ' + elAsunto.nombre + '.' : 'Anotado en ' + elAsunto.nombre + '.';
    /* Fila 119: se queda en la bandeja, con «Ir al asunto». */
    if (window.Navegacion) Navegacion.avisoConIr(texto, 'bueno', elAsunto.nombre);
    else U.aviso(texto, 'bueno');
    if (window.Gestor && window.Gestor.recargar) window.Gestor.recargar();
  }

  /* Una respuesta a un asunto archivado casi siempre quiere decir que
     la gestión ha vuelto a moverse. Se ofrece reabrirlo: la carpeta
     vuelve a los asuntos abiertos y el correo entra ya dentro.

     El reabrir es el de siempre, el mismo del botón de la pantalla de
     Archivo, con su cuadro de confirmación. Si él cancela, la carpeta
     no habrá llegado a los abiertos y aquí no se hace nada más: el
     correo se queda en la bandeja. */
  async function reabrirYGuardar(item, elAsunto) {
    if (typeof App.reabrirAsunto !== 'function') {
      U.aviso('Esta versión de la aplicación no sabe reabrir asuntos.', 'malo');
      return;
    }
    var ficha = elAsunto.ficha || {};
    var dentro;
    try {
      dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
    } catch (e) {
      U.aviso('No encuentro la carpeta de ese asunto en el ARCHIVO: ' + U.mensajeDeError(e), 'malo');
      return;
    }
    await App.reabrirAsunto({ nombre: elAsunto.nombre, padre: dentro, ficha: ficha });
    if (!(await Carpetas.existe(App.E.abiertos, elAsunto.nombre))) return;
    await guardarEnAsunto(item, elAsunto, true);
  }

  /* ==========================================================
     LO QUE PASA DESPUÉS DE CREAR EL ASUNTO
     ========================================================== */

  async function copiarALaCarpeta(nombreOrigen, destino, nombreDestino) {
    var h = await N.carpeta().getFileHandle(nombreOrigen);
    await Carpetas.copiarFicheroEn(destino, h, nombreDestino);
  }

  function sinElId(nombre, id) {
    var p = String(id || '') + ' - ';
    return nombre.indexOf(p) === 0 ? nombre.slice(p.length) : nombre;
  }

  /* Un nombre que no pise a otro. En un asunto con varios correos, el
     segundo PDF del mismo día sería "260907 CORREO (2).pdf". */
  async function nombreLibre(destino, nombre) {
    var punto = nombre.lastIndexOf('.');
    var tronco = punto > 0 ? nombre.slice(0, punto) : nombre;
    var extension = punto > 0 ? nombre.slice(punto) : '';
    var intento = nombre;
    for (var n = 2; n < 50; n++) {
      try {
        await destino.getFileHandle(intento);
      } catch (e) {
        return intento;          /* no existe: está libre */
      }
      intento = tronco + ' (' + n + ')' + extension;
    }
    return intento;
  }

  /* Con qué nombre entra un adjunto en la carpeta del asunto.

     Gmail los manda como venían: "1000082963.jpg",
     "LITNAC2026050413001031751487.pdf". Dentro de la carpeta esos
     nombres no dicen nada y se mezclan con los papeles del expediente.
     Se les pone delante la fecha del correo y la palabra ADJUNTO, y se
     les recorta el nombre de origen a lo que quepa. */
  function nombreDeAdjunto(nombre, d) {
    var limpio = sinElId(nombre, d.id);
    var punto = limpio.lastIndexOf('.');
    var tronco = punto > 0 ? limpio.slice(0, punto) : limpio;
    var extension = punto > 0 ? limpio.slice(punto) : '';
    /* Fila 130: la extensión también se limpia y no pasa de 10 caracteres;
       si no parece una extensión de verdad, se quita. */
    extension = extension.replace(/[\\/:*?"<>|\s]/g, '');
    if (!/^\.[A-Za-z0-9]{1,9}$/.test(extension)) { tronco = limpio; extension = ''; }
    tronco = tronco.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
    if (tronco.length > 40) tronco = tronco.slice(0, 40).trim();
    return U.aAaMmDd(N.soloElDia(d.fechaUltimo || d.fecha)) + ' ADJUNTO' +
           (tronco ? ' ' + tronco : '') + extension;
  }

  /* La nota que deja un correo en el asunto.

     Una línea con quién escribe y cuándo, y debajo el asunto del
     correo. El enlace a Gmail NO se escribe en el texto: se guarda
     aparte y la nota lo enseña como botón. Escrito, ocupaba cuatro
     líneas de letra ilegible.

     `correo` es el identificador del correo. Es lo que luego permite
     saber que ese correo ya está en el asunto y no repetirlo. */
  function notaDelCorreo(d, comoEmpieza, cola) {
    var quien = (d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido';
    return {
      texto: comoEmpieza + ' ' + quien + ' · ' + N.fechaLegible(d.fechaUltimo || d.fecha) +
             (d.asunto ? '\n' + d.asunto : '') + (cola || ''),
      extra: {
        correo: d.id,
        enlace: d.enlace ? N.enlaceAGmail(d) : '',
        enlaceTexto: 'Abrir en Gmail'
      }
    };
  }

  /* El asunto del correo, recortado, para que el nombre del documento
     diga de qué va sin ocupar la línea entera. Se corta por una
     palabra, no por la mitad de una. */
  function trozoDelAsunto(d) {
    var t = U.limpiarNombre(N.sinElRe((d && d.asunto) || ''));
    if (t.length > 40) {
      t = t.slice(0, 40);
      var espacio = t.lastIndexOf(' ');
      if (espacio > 20) t = t.slice(0, espacio);
    }
    return t.replace(/[,;:.\-\s]+$/, '').trim();
  }

  /* El PDF del hilo entero se sustituye, no se acumula: si no, cada
     respuesta dejaría otra copia del hilo completo dentro de la
     carpeta. El anterior va a la papelera por el camino de siempre,
     nunca se borra a pelo. */
  async function apartarElHiloViejo(destino, nombreAsunto, trozo) {
    if (!window.Papelera || !nombreAsunto) return;
    var marca = ' HILO' + (trozo ? ' ' + trozo : '');
    var lista = [];
    try { lista = await Carpetas.ficheros(destino); } catch (e) { return; }
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      if (!/^\d{6} HILO/.test(n)) continue;
      if (n.indexOf(marca) !== 6) continue;
      try {
        await window.Papelera.mandarDocumentoDeAsunto(
          { nombre: nombreAsunto, handle: destino }, n);
      } catch (e) { /* si no se puede apartar, se queda y el nuevo entra al lado */ }
    }
  }

  async function meterLosFicheros(d, destino, nombreAsunto) {
    var metidos = 0;
    var dia = U.aAaMmDd(N.soloElDia(d.fechaUltimo || d.fecha));
    var trozo = trozoDelAsunto(d);

    /* El mensaje nuevo, él solo, cuando el recolector lo deja aparte.
       Así cada correo es su propio documento dentro del asunto. */
    if (d.pdfMensaje) {
      try {
        var comoCorreo = await nombreLibre(destino,
          dia + ' CORREO' + (trozo ? ' ' + trozo : '') + '.pdf');
        await copiarALaCarpeta(d.pdfMensaje, destino, comoCorreo);
        metidos++;
      } catch (e) { /* si no está, queda el hilo entero, que lo lleva dentro */ }
    }

    if (d.pdf) {
      try {
        var comoHilo = dia + ' HILO' + (trozo ? ' ' + trozo : '') + '.pdf';
        await apartarElHiloViejo(destino, nombreAsunto, trozo);
        await copiarALaCarpeta(d.pdf, destino, await nombreLibre(destino, comoHilo));
        metidos++;
      } catch (e) { U.aviso('El PDF del correo no ha podido entrar: ' + U.mensajeDeError(e), 'malo'); }
    }
    for (var i = 0; i < (d.adjuntos || []).length; i++) {
      try {
        var suyo = await nombreLibre(destino, nombreDeAdjunto(d.adjuntos[i], d));
        await copiarALaCarpeta(d.adjuntos[i], destino, suyo);
        metidos++;
      } catch (e) { /* un adjunto que falle no puede parar lo demás */ }
    }
    return metidos;
  }

  async function engancharCorreo(item, nombreAsunto) {
    var d = item.datos;
    var destino = await App.E.abiertos.getDirectoryHandle(nombreAsunto);
    var metidos = await meterLosFicheros(d, destino, nombreAsunto);

    try {
      var apunte = notaDelCorreo(d, 'Asunto abierto con el correo de');
      await window.Notas.anadir({ nombre: nombreAsunto, ficha: {} },
        apunte.texto, apunte.extra);
    } catch (e) { /* la nota es lo menos importante de todo esto */ }

    await N.apuntarHuella(nombreAsunto, d);
    await borrarDeLaBandeja(item);
    U.aviso(metidos
      ? 'Asunto creado con el correo dentro.'
      : 'Asunto creado. El correo sale ya de la bandeja.', 'bueno');
  }

  async function borrarDeLaBandeja(item) {
    var d = item.datos;
    var fuera = [item.fichero];
    if (d.pdf) fuera.push(d.pdf);
    if (d.pdfMensaje) fuera.push(d.pdfMensaje);
    (d.adjuntos || []).forEach(function (a) { fuera.push(a); });
    for (var i = 0; i < fuera.length; i++) {
      try { await N.carpeta().removeEntry(fuera[i]); } catch (e) { /* ya no estaba */ }
    }
    N.ponerCorreos((N.correos() || []).filter(function (x) { return x.fichero !== item.fichero; }));
    if (N.pendiente() && N.pendiente().fichero === item.fichero) { N.ponerPendiente(null); N.pintarAvisoPendiente(); }
    N.repintarPantalla();
  }

  async function descartar(item) {
    var d = item.datos;
    var ok = await U.preguntar('Descartar este correo',
      '<p>Se quita de la bandeja sin crear ningún asunto.</p>' +
      '<p class="nota">' + U.escapar(d.asunto || '') + '</p>' +
      '<p class="nota">El correo sigue en tu Gmail, con la etiqueta GESTOR/Hecho. ' +
      'Si vuelves a ponerle la etiqueta GESTOR, volverá a la bandeja.</p>',
      'Descartar');
    if (!ok) return;
    await borrarDeLaBandeja(item);
    U.aviso('Correo descartado.', 'bueno');
  }

  /* El botón de crear es el de siempre. Aquí solo se mira si el asunto
     se ha creado de verdad para meterle el correo dentro. */
  function engancharElBotonDeCrear() {
    var boton = $('btn-crear');
    if (!boton || boton.dataset.conCorreo) return;
    boton.dataset.conCorreo = 'si';
    /* Fuera de la lista de envolturas-esperadas.js a propósito: esta
       solo se aplica cuando la bandeja de Gmail ha arrancado (con la
       cuenta configurada), no al cargar la página para todo el mundo,
       así que un aviso al arrancar daría un falso positivo constante
       en quien no usa la bandeja. Por eso el nombre y el fichero no
       van como texto suelto: así la comprobación de la fila 70 no la
       cuenta ni la echa en falta. */
    var ETIQUETA = 'boton(#btn-crear).onclick';
    var FICHERO = 'bandeja-correos.js';
    U.envolver(boton, ETIQUETA, FICHERO, function (comoEra) {
      return async function () {
        var item = N.pendiente();
        var nombre = '';
        var existiaAntes = true;
        if (item && App.E.nuevo.tipo && App.E.nuevo.tercero) {
          try {
            nombre = nombreDeCarpetaPropuesto(App.datosDelFormulario());
            existiaAntes = nombre ? await Carpetas.existe(App.E.abiertos, nombre) : true;
          } catch (e) { nombre = ''; }
        }
        await comoEra.apply(this, arguments);
        if (!item || !nombre || existiaAntes) return;
        try {
          if (!(await Carpetas.existe(App.E.abiertos, nombre))) return;
          await engancharCorreo(item, nombre);
        } catch (e) {
          U.aviso('El asunto está creado, pero el correo no ha podido entrar: ' + U.mensajeDeError(e), 'ambar');
        }
      };
    });
  }

  Object.assign(window.Bandeja, {
    leerElCorreo: leerElCorreo,
    guardarEnAsunto: guardarEnAsunto,
    reabrirYGuardar: reabrirYGuardar,
    descartar: descartar,
    borrarDeLaBandeja: borrarDeLaBandeja
  });
  Object.assign(N, {
    engancharElBotonDeCrear: engancharElBotonDeCrear
  });
})();
