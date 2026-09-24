/* ============================================================
   bandeja-huella.js — ¿es la respuesta de un asunto que ya existe?, la huella del hilo y el enlace a Gmail.

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

  var FICHERO_SEGUIDOS = N.FICHERO_SEGUIDOS;

  /* ==========================================================
     ¿ES LA RESPUESTA DE UN ASUNTO QUE YA EXISTE?

     Los correos que se mandan desde la aplicación llevan por asunto el
     nombre de la carpeta. Cuando el tercero contesta, ese nombre vuelve
     dentro del "Re:". Si no se mirara, la bandeja propondría crear otra
     carpeta para la misma gestión, con la fecha de hoy, y nadie se
     daría cuenta.

     Se mira contra asuntos.json, que tiene todos: los abiertos y los ya
     archivados.
     ========================================================== */

  function sinElRe(texto) {
    var t = String(texto || '');
    var antes;
    do { antes = t; t = t.replace(/^\s*(re|rv|fwd|fw)\s*:\s*/i, ''); } while (t !== antes);
    return t;
  }

  function asuntoQueYaExiste(datos) {
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var titulo = U.normalizar(sinElRe(datos.asunto));
    if (titulo.length < 12) return null;
    var mejor = null;
    Object.keys(registro).forEach(function (nombre) {
      var n = U.normalizar(nombre);
      if (n.length < 12) return;
      if (titulo.indexOf(n) === -1) return;
      if (!mejor || n.length > U.normalizar(mejor.nombre).length) {
        mejor = { nombre: nombre, ficha: registro[nombre] || {} };
      }
    });
    return mejor;
  }

  function estaArchivado(ficha) {
    return String((ficha && ficha.estado) || '') === 'cerrado';
  }


  /* ==========================================================
     LA HUELLA DEL HILO

     Adivinar el asunto por el texto solo funciona mientras el asunto
     del correo siga llevando dentro el nombre de la carpeta. En cuanto
     alguien cambia el asunto al contestar, o el hilo se lo empieza el
     tercero, se pierde el rastro.

     Así que cuando un correo entra en un asunto se apunta la huella de
     su hilo en la ficha del asunto, dentro de _GESTOR/asuntos.json:

       hilos: [ { id: '<id del hilo>', asunto: '<asunto limpio>', visto: 2,
                  matriculas: [ ... ], metidoPor: '...', metidoEl: '...' } ]

     `visto` es cuántos mensajes tenía el hilo la última vez. Con eso el
     recolector de Apps Script sabe si han llegado respuestas nuevas
     (ver apps-script/gestor-correos.gs y `seguidos.json`).

     `matriculas` son los Message-ID del correo que se guardó (el mismo
     en todos los buzones, al contrario que `id`, que es de cada uno):
     con ellos el buzón del compañero reconoce que un correo suyo es el
     mismo que este, aunque su identificador de hilo sea otro (fila 18,
     "Un mismo correo en dos buzones"). `metidoPor` y `metidoEl` son
     quién lo guardó y cuándo, para la línea gris de "ya está".

     La huella por identificador de hilo manda sobre la de matrícula, y
     las dos mandan sobre la adivinación por texto: si el hilo ya es
     conocido, da igual cómo venga escrito el asunto.

     `hilos`, `matriculas`, `metidoPor` y `metidoEl` son opcionales. Los
     asuntos de antes de esto no los tienen, y todo sigue funcionando
     igual que siempre. */

  function asuntoDelHilo(id) {
    if (!id) return null;
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var nombres = Object.keys(registro);
    for (var i = 0; i < nombres.length; i++) {
      var ficha = registro[nombres[i]] || {};
      var hilos = Array.isArray(ficha.hilos) ? ficha.hilos : [];
      for (var h = 0; h < hilos.length; h++) {
        if (hilos[h] && hilos[h].id === id) {
          return { nombre: nombres[i], ficha: ficha, huella: hilos[h], porHuella: true };
        }
      }
    }
    return null;
  }

  /* Igual que asuntoDelHilo, pero buscando por matrícula: para cada
     asunto, si alguna matrícula de sus hilos coincide con alguna de
     las que trae el correo, ese es. */
  function asuntoDeLaMatricula(matriculas) {
    if (!matriculas || !matriculas.length) return null;
    var registro = (App.E.registro && App.E.registro.asuntos) || {};
    var nombres = Object.keys(registro);
    for (var i = 0; i < nombres.length; i++) {
      var ficha = registro[nombres[i]] || {};
      var hilos = Array.isArray(ficha.hilos) ? ficha.hilos : [];
      for (var h = 0; h < hilos.length; h++) {
        var suyas = hilos[h] && hilos[h].matriculas;
        if (!Array.isArray(suyas)) continue;
        if (suyas.some(function (m) { return m && matriculas.indexOf(m) !== -1; })) {
          return { nombre: nombres[i], ficha: ficha, huella: hilos[h], porHuella: true };
        }
      }
    }
    return null;
  }

  /* La huella por hilo (propio o del que se contesta), la huella por
     matrícula, y solo entonces el texto. */
  function asuntoDeEsteCorreo(d) {
    if (!d) return null;
    return asuntoDelHilo(d.id) || asuntoDelHilo(d.respuestaDe) ||
      asuntoDeLaMatricula(d.matriculas) || asuntoQueYaExiste(d);
  }

  function asuntoLimpioDelCorreo(d) {
    return sinElRe((d && d.asunto) || '').trim().toLowerCase();
  }

  /* Apunta la huella en el asunto de destino y la quita de cualquier
     otro que la tuviera: un asunto puede tener varios hilos, pero un
     hilo pertenece a un solo asunto.

     App.anotar relee asuntos.json antes de escribirlo y lo guarda con
     Copias.guardar, así que no hace falta hacerlo aquí a mano. */
  async function apuntarHuella(nombreAsunto, d) {
    if (!d || !d.id || !nombreAsunto) return;
    try {
      await App.cargarRegistro();
      var registro = App.E.registro.asuntos || {};
      var otros = Object.keys(registro);
      for (var i = 0; i < otros.length; i++) {
        if (otros[i] === nombreAsunto) continue;
        var suyos = registro[otros[i]] && registro[otros[i]].hilos;
        if (!Array.isArray(suyos)) continue;
        var quedan = suyos.filter(function (h) { return !h || h.id !== d.id; });
        if (quedan.length !== suyos.length) await App.anotar(otros[i], { hilos: quedan });
      }

      await App.cargarRegistro();
      var ficha = App.E.registro.asuntos[nombreAsunto] || {};
      var hilos = Array.isArray(ficha.hilos) ? ficha.hilos.slice() : [];
      var huella = {
        id: d.id,
        asunto: asuntoLimpioDelCorreo(d),
        visto: parseInt(d.mensajes, 10) || 1,
        matriculas: Array.isArray(d.matriculas) ? d.matriculas.filter(Boolean) : [],
        metidoPor: App.E.usuario,
        metidoEl: U.ahora()
      };
      var sitio = -1;
      hilos.forEach(function (h, n) { if (h && h.id === d.id) sitio = n; });
      if (sitio === -1) hilos.push(huella); else hilos[sitio] = huella;
      await App.anotar(nombreAsunto, { hilos: hilos });
    } catch (e) {
      U.aviso('El correo está guardado, pero no he podido apuntar el hilo: ' + U.mensajeDeError(e), 'ambar');
    }
    await escribirSeguidos();
  }

  /* El fichero que lee el recolector de Apps Script. Se reescribe
     entero cada vez que cambia alguna huella: es corto y así nunca se
     queda a medias. Si no se puede escribir, el script sigue haciendo
     lo de siempre con la etiqueta GESTOR.

     Las matrículas de todas las huellas que compartan identificador de
     hilo se juntan sin repetir: así el recolector del otro buzón puede
     encontrar el hilo local por cualquiera de ellas (ver
     apps-script/gestor-correos.gs, hiloDeSeguido). */
  async function escribirSeguidos() {
    if (!N.carpeta()) return;
    try {
      var registro = (App.E.registro && App.E.registro.asuntos) || {};
      var porId = {};
      Object.keys(registro).forEach(function (nombre) {
        var hilos = (registro[nombre] || {}).hilos;
        if (!Array.isArray(hilos)) return;
        hilos.forEach(function (h) {
          if (!h || !h.id) return;
          var e = porId[h.id] || (porId[h.id] = { visto: 0, asunto: '', matriculas: {} });
          e.visto = parseInt(h.visto, 10) || e.visto || 1;
          e.asunto = h.asunto || e.asunto;
          (h.matriculas || []).forEach(function (m) { if (m) e.matriculas[m] = true; });
        });
      });
      var lista = Object.keys(porId).map(function (id) {
        var e = porId[id];
        return { id: id, visto: e.visto, asunto: e.asunto, matriculas: Object.keys(e.matriculas) };
      });
      await Carpetas.escribirTexto(N.carpeta(), FICHERO_SEGUIDOS,
        JSON.stringify({ hilos: lista }, null, 2));
    } catch (e) { /* el script sigue con su trabajo normal sin quejarse */ }
  }

  /* ==========================================================
     EL ENLACE QUE ABRE EL CORREO EN GMAIL

     La primera versión del script guardaba la dirección con
     #all/<identificador del hilo>, y esa no abre nada: Gmail contesta
     "la conversación que has solicitado no se ha podido cargar". El
     script ya guarda una búsqueda por el Message-ID, que sí funciona,
     pero los correos recogidos antes se quedaron con la mala.

     Así que cuando llega una de las malas se cambia aquí por una
     búsqueda del asunto y del remitente. No abre la conversación de
     golpe, pero la deja delante en la lista de resultados.
     ========================================================== */

  function enlaceAGmail(d) {
    var enlace = String((d && d.enlace) || '');
    if (enlace && enlace.indexOf('#all/') === -1) return enlace;

    var asunto = sinElRe((d && d.asunto) || '').trim();
    if (!asunto) return enlace;

    var base = enlace.split('#')[0] || 'https://mail.google.com/mail/u/0/';
    var busca = 'subject:"' + asunto.replace(/"/g, '') + '"';
    if (d.de && d.de.correo) busca += ' from:' + d.de.correo;
    return base + '#search/' + encodeURIComponent(busca);
  }

  Object.assign(window.Bandeja, {
    sinElRe: sinElRe,
    estaArchivado: estaArchivado,
    asuntoDelHilo: asuntoDelHilo,
    escribirSeguidos: escribirSeguidos,
    asuntoDeLaMatricula: asuntoDeLaMatricula,
    asuntoDeEsteCorreo: asuntoDeEsteCorreo,
    enlaceAGmail: enlaceAGmail
  });
  Object.assign(N, {
    sinElRe: sinElRe,
    estaArchivado: estaArchivado,
    apuntarHuella: apuntarHuella,
    escribirSeguidos: escribirSeguidos,
    enlaceAGmail: enlaceAGmail
  });
})();
