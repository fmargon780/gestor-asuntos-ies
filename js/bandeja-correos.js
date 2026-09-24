/* ============================================================
   bandeja-correos.js — los correos que esperan a ser un asunto.

   En Gmail, a un correo se le pone la etiqueta GESTOR. Un script de
   Google Apps Script lo recoge cada pocos minutos y deja tres cosas
   en una carpeta de Drive llamada GESTOR-BANDEJA:

     <id>.json          la ficha del correo
     <id> - correo.pdf  el hilo entero en PDF
     <id> - <nombre>    cada documento adjunto

   Este módulo lee esa carpeta y enseña los correos arriba, en la
   pantalla de asuntos abiertos. De cada uno propone el asunto ya
   montado: quién es el tercero, de qué tipo es y con qué fecha.

   Al pulsar "Crear el asunto" no se crea nada por su cuenta: se
   rellena la pantalla de siempre, y el asunto lo crea él con el botón
   de siempre. Después, el PDF del correo y sus adjuntos entran solos
   en la carpeta recién creada, se apunta una nota con el remitente, y
   el correo desaparece de la bandeja.

   Hay un caso que no es un asunto nuevo: la respuesta a un correo que
   salió de aquí. Como esos correos llevan por asunto el nombre de la
   carpeta, al volver se reconocen, y entonces la tarjeta ofrece
   guardar el correo dentro de ese asunto en vez de crear otro. Si ese
   asunto ya estaba archivado, se ofrece reabrirlo.

   Desde el 16-sep-2026 hay algo más fuerte que esa adivinación por
   texto: la huella del hilo. Al guardar un correo en un asunto se
   apunta el identificador de su hilo en la ficha del asunto, y a
   partir de ahí ese hilo es suyo, se llame el asunto como se llame.
   Y si nada encaja, el botón "Elegir asunto" deja escogerlo a mano de
   la lista entera (js/bandeja-enlace.js). Nunca se guarda nada solo:
   siempre hay que pulsar.

   La carpeta de la bandeja se señala una vez en Ajustes. Mientras no
   se señale, este módulo no enseña nada y la aplicación funciona como
   siempre.

   La ficha se escribe la última en Drive, así que un correo se lee
   solo cuando su .json existe: nunca se coge uno a medio guardar.

   24-sep-2026 (fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md): este fichero
   ya NO vigila "encargos de correo" (el viejo "Borrador en camino").
   Mandar documentos por correo ahora envía de verdad, en el momento,
   desde js/correo-cuadro.js + js/correo-enviar.js: no hay nada que
   dejar en esta carpeta ni que revisar cada 15 segundos. Solo queda
   `limpiarEnviosViejos`, que se ejecuta una vez al arrancar por si
   quedara algún encargo `.envio.json`/`.listo.json`/`.error.json`
   suelto de antes de esta fila.
   ============================================================ */
(function () {

  var CLAVE = 'bandeja';           /* dónde se recuerda la carpeta */
  var SEGUNDOS_ENTRE_MIRADAS = 90;

  /* La lista de hilos que el recolector de Apps Script tiene que seguir
     vigilando aunque ya no lleven la etiqueta GESTOR. La escribe esta
     aplicación; el script solo la lee. Ver la sección "LA HUELLA DEL
     HILO", más abajo. */
  var FICHERO_SEGUIDOS = 'seguidos.json';

  var carpeta = null;
  var correos = [];
  var pendiente = null;            /* el correo que se está convirtiendo */
  var ultimaMirada = 0;
  var arrancado = false;
  var mirando = false;

  function $(id) { return document.getElementById(id); }

  /* La bandeja en pantalla —la barra plegable, la caja, cada tarjeta—
     vive en js/bandeja-pantalla.js (17-sep-2026, fila 27, para no
     pasar de las 1.478 líneas aquí): se habla con ella por
     window.BandejaPantalla.pintar(), llamado cada vez que `correos`
     puede haber cambiado. */
  function repintarPantalla() {
    if (window.BandejaPantalla) window.BandejaPantalla.pintar();
  }

  /* ==========================================================
     LA CARPETA
     ========================================================== */

  async function recordarCarpeta() {
    try { carpeta = await Almacen.leer(CLAVE); } catch (e) { carpeta = null; }
  }

  async function elegirCarpeta() {
    try {
      var h = await window.showDirectoryPicker({ id: 'gestor-bandeja', mode: 'readwrite' });
      carpeta = h;
      await Almacen.guardar(CLAVE, h);
      pintarBloqueAjustes();
      ultimaMirada = 0;
      await mirar(true);
      U.aviso('Bandeja de correos señalada: ' + h.name, 'bueno');
    } catch (e) {
      if (e.name === 'AbortError') return;
      U.aviso('No he podido usar esa carpeta: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function olvidarCarpeta() {
    carpeta = null;
    correos = [];
    try { await Almacen.guardar(CLAVE, null); } catch (e) {}
    pintarBloqueAjustes();
    repintarPantalla();
  }

  /* Chrome solo devuelve el permiso sin preguntar si ya lo tenía. Para
     volver a pedirlo hace falta que él acabe de pulsar algo, y por eso
     hay un botón. */
  function tienePermiso(pedir) {
    if (!carpeta) return Promise.resolve(false);
    return Carpetas.permiso(carpeta, !!pedir).catch(function () { return false; });
  }

  /* ==========================================================
     LEER LA BANDEJA
     ========================================================== */

  async function mirar(aLaFuerza) {
    if (!carpeta || mirando) return;
    var ahora = Date.now();
    if (!aLaFuerza && ahora - ultimaMirada < SEGUNDOS_ENTRE_MIRADAS * 1000) return;
    mirando = true;
    try {
      if (!(await tienePermiso(false))) { correos = null; repintarPantalla(); return; }
      var lista = await Carpetas.ficheros(carpeta);
      var salida = [];
      for (var i = 0; i < lista.length; i++) {
        var n = lista[i].nombre;
        if (!/\.json$/i.test(n)) continue;
        /* Restos del viejo "Borrador en camino" (antes de la fila 115),
           por si quedara alguno sin limpiar todavía: no son correos que
           recoger. */
        if (/\.(envio|listo|error)\.json$/i.test(n)) continue;
        if (n === FICHERO_SEGUIDOS) continue;   /* ese lo escribimos nosotros */
        var d = await Carpetas.leerJson(carpeta, n);
        if (!d || !d.id) continue;
        /* Las fechas se dejan en AAAA-MM-DD, que es lo que entienden
           U.aAaMmDd y fechaLegible. Si el script del correo escribiera
           la hora también, el nombre del PDF saldría como
           "260909T10:00:00.000Z CORREO.pdf". */
        d.fecha = soloElDia(d.fecha);
        d.fechaUltimo = soloElDia(d.fechaUltimo);
        salida.push({ fichero: n, datos: d });
      }
      salida.sort(function (a, b) {
        var fa = String(a.datos.fecha || ''), fb = String(b.datos.fecha || '');
        return fa < fb ? -1 : (fa > fb ? 1 : 0);
      });
      correos = salida;
      ultimaMirada = ahora;
      repintarPantalla();
    } catch (e) {
      correos = null;
      repintarPantalla();
    }
    mirando = false;
  }

  /* ==========================================================
     LA PROPUESTA

     De un correo salen tres cosas: con quién es el asunto, de qué
     tipo es, y con qué fecha nace.
     ========================================================== */

  /* Las direcciones que trae el correo se buscan en los CSV. En el
     alumnado están las de los tutores legales, y Séneca llama a esas
     columnas de maneras distintas, así que se busca por la arroba y no
     por el título de la columna. */
  function personaConEseCorreo(lista, buscadas) {
    for (var i = 0; i < lista.length; i++) {
      var campos = lista[i].campos || {};
      for (var titulo in campos) {
        var valor = String(campos[titulo] === null || campos[titulo] === undefined ? '' : campos[titulo]);
        if (valor.indexOf('@') === -1) continue;
        var trozos = valor.split(/[;,\s]+/);
        for (var t = 0; t < trozos.length; t++) {
          var c = U.normalizar(trozos[t]);
          if (c && buscadas.indexOf(c) !== -1) return lista[i];
        }
      }
    }
    return null;
  }

  async function buscarTercero(datos) {
    var buscadas = (datos.correos || []).map(function (c) { return U.normalizar(c); });
    if (datos.de && datos.de.correo) buscadas.push(U.normalizar(datos.de.correo));
    if (!buscadas.length) return null;
    var categorias = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS'];
    for (var i = 0; i < categorias.length; i++) {
      try {
        var fuente = await Datos.cargar(App.E.datos, categorias[i]);
        var p = personaConEseCorreo(fuente.lista || [], buscadas);
        if (p) return p;
      } catch (e) { /* si un CSV no está, se sigue con el siguiente */ }
    }
    return null;
  }

  /* Todos los que tengan alguna de las direcciones del correo, no solo
     el primero. Lo usa la puntuación de parecido de js/bandeja-enlace.js
     para saber de quién es el correo sin volver a leer los CSV. */
  async function personasDelCorreo(datos) {
    var buscadas = (datos.correos || []).map(function (c) { return U.normalizar(c); });
    if (datos.de && datos.de.correo) buscadas.push(U.normalizar(datos.de.correo));
    if (!buscadas.length) return [];
    var salida = [];
    var categorias = ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS'];
    for (var i = 0; i < categorias.length; i++) {
      try {
        var fuente = await Datos.cargar(App.E.datos, categorias[i]);
        var lista = fuente.lista || [];
        for (var j = 0; j < lista.length; j++) {
          var uno = personaConEseCorreo([lista[j]], buscadas);
          if (uno) salida.push(uno);
        }
      } catch (e) { /* si un CSV no está, se sigue con el siguiente */ }
    }
    return salida;
  }

  /* El tipo se busca entre los del centro: si el nombre del tipo
     aparece escrito en el correo, ese es. Gana el más largo, para que
     "MATRICULA SOBREVENIDA" mande sobre "MATRICULA". */
  function adivinarTipo(datos, categoria) {
    var texto = U.normalizar((datos.asunto || '') + ' ' + (datos.texto || ''));
    if (!texto) return null;
    var mejor = null;
    (App.E.tipos || []).forEach(function (t) {
      if (categoria && t.categoria !== categoria) return;
      var h = U.normalizar(t.tipo);
      if (h.length < 4) return;
      if (texto.indexOf(h) === -1) return;
      if (!mejor || h.length > U.normalizar(mejor.tipo).length) mejor = t;
    });
    return mejor;
  }

  async function proponer(datos) {
    var tercero = await buscarTercero(datos);
    var categoria = tercero ? (tercero.categoria || null) : null;
    return { tercero: tercero, categoria: categoria, tipo: adivinarTipo(datos, categoria) };
  }

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
    if (!carpeta) return;
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
      await Carpetas.escribirTexto(carpeta, FICHERO_SEGUIDOS,
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

  /* Leer el correo sin salir de la aplicación.

     Gmail no se deja meter dentro de otra página: Google lo prohíbe.
     Pero el script guarda el hilo entero en PDF, y ese PDF sí se puede
     enseñar. Sale en el panel de la derecha, con la aplicación a la
     izquierda, igual que se hace con los documentos. */
  async function leerElCorreo(d) {
    if (!window.Lector) return;
    var elPdf = d.pdf || d.pdfMensaje;
    if (!carpeta || !elPdf) { U.aviso('Este correo no trae su PDF.', 'malo'); return; }
    try {
      var h = await carpeta.getFileHandle(elPdf);
      var fichero = await h.getFile();
      var botones = [];
      if (d.enlace) {
        botones.push({
          texto: 'Abrir en Gmail',
          alPulsar: function () { window.open(enlaceAGmail(d), '_blank'); }
        });
      }
      window.Lector.abrir({
        titulo: d.asunto || 'Correo',
        pie: [(d.de && (d.de.nombre || d.de.correo)) || '', fechaLegible(d.fecha)]
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
    if (!estaArchivado(ficha)) return App.E.abiertos.getDirectoryHandle(nombre);
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
      await apuntarHuella(elAsunto.nombre, d);
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
    await apuntarHuella(elAsunto.nombre, d);
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
     UTILIDADES DE FECHA Y DE ICONO

     Las usa tanto lo de aquí abajo (notas, nombres de fichero) como
     js/bandeja-pantalla.js, que pinta la bandeja en pantalla
     (17-sep-2026, fila 27): por eso están expuestas en window.Bandeja,
     más abajo, en vez de vivir allí.
     ========================================================== */

  /* Se queda con el AAAA-MM-DD, venga la hora detrás o no. */
  function soloElDia(iso) {
    var t = String(iso || '');
    return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : t;
  }

  function fechaLegible(iso) {
    var p = soloElDia(iso).split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "17-sep-2026 · 09:14", para "lo metió Juan el...". */
  function fechaHoraLegible(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '-' + MESES_CORTOS[d.getMonth()] + '-' + d.getFullYear() +
      ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function sobre() {
    return '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/>' +
      '<path d="m3.6 6.4 8.4 6 8.4-6"/></svg>';
  }

  /* ==========================================================
     DEL CORREO A LA PANTALLA DE NUEVO ASUNTO
     ========================================================== */

  function descripcionDe(asunto) {
    var t = U.limpiarNombre(String(asunto || '').replace(/^\s*(re|rv|fwd|fw)\s*:\s*/i, ''));
    return t.length > 60 ? t.slice(0, 60).trim() : t;
  }

  function ponerViaCorreo(direccion) {
    var sel = $('campo-via');
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (U.normalizar(sel.options[i].textContent).indexOf('correo') !== -1) {
        sel.value = sel.options[i].value;
        break;
      }
    }
    var dato = $('campo-via-dato');
    if (dato && !dato.value.trim()) dato.value = direccion || '';
  }

  async function llevarANuevo(item) {
    var d = item.datos;
    pendiente = item;
    App.ir('nuevo');

    var p = await proponer(d);
    if (p.categoria) App.elegirCategoria(p.categoria);
    if (p.tipo) App.elegirTipo(p.tipo);
    if (p.tercero) App.fijarTercero(p.tercero);

    if (d.fecha) $('campo-fecha').value = d.fecha;
    App.actualizarCursoNuevo();
    App.actualizarLimiteNuevo();
    if (!$('campo-descripcion').value.trim()) $('campo-descripcion').value = descripcionDe(d.asunto);
    ponerViaCorreo(d.de && d.de.correo);
    App.refrescarVista();
    pintarAvisoPendiente();

    if (!p.tercero) {
      U.aviso('No reconozco al remitente: elige tú con quién es el asunto.', 'malo');
      var buscador = $('buscar-tercero');
      if (buscador && p.categoria) buscador.focus();
    }
  }

  /* Un recordatorio arriba de la pantalla de nuevo asunto, para que se
     vea de dónde viene lo que hay rellenado. */
  function pintarAvisoPendiente() {
    var sitio = $('aviso-pendiente');
    if (!sitio) return;
    var mio = $('aviso-correo-pendiente');
    if (!pendiente) { if (mio) mio.remove(); return; }
    if (!mio) {
      mio = document.createElement('div');
      mio.id = 'aviso-correo-pendiente';
      mio.className = 'aviso aviso-ambar';
      sitio.parentNode.insertBefore(mio, sitio);
    }
    var d = pendiente.datos;
    mio.innerHTML = '<strong>Este asunto viene de un correo.</strong>' +
      '<p>' + U.escapar(d.asunto || '') + ' — de ' +
      U.escapar((d.de && (d.de.nombre || d.de.correo)) || '') + '.' +
      ' Al crearlo, el PDF del correo y sus documentos entrarán en la carpeta.</p>';
    var soltar = document.createElement('button');
    soltar.className = 'boton';
    soltar.textContent = 'Este asunto no es de ese correo';
    soltar.onclick = function () { pendiente = null; pintarAvisoPendiente(); };
    mio.appendChild(soltar);
  }

  /* ==========================================================
     LO QUE PASA DESPUÉS DE CREAR EL ASUNTO
     ========================================================== */

  async function copiarALaCarpeta(nombreOrigen, destino, nombreDestino) {
    var h = await carpeta.getFileHandle(nombreOrigen);
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
    return U.aAaMmDd(soloElDia(d.fechaUltimo || d.fecha)) + ' ADJUNTO' +
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
      texto: comoEmpieza + ' ' + quien + ' · ' + fechaLegible(d.fechaUltimo || d.fecha) +
             (d.asunto ? '\n' + d.asunto : '') + (cola || ''),
      extra: {
        correo: d.id,
        enlace: d.enlace ? enlaceAGmail(d) : '',
        enlaceTexto: 'Abrir en Gmail'
      }
    };
  }

  /* El asunto del correo, recortado, para que el nombre del documento
     diga de qué va sin ocupar la línea entera. Se corta por una
     palabra, no por la mitad de una. */
  function trozoDelAsunto(d) {
    var t = U.limpiarNombre(sinElRe((d && d.asunto) || ''));
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
    var dia = U.aAaMmDd(soloElDia(d.fechaUltimo || d.fecha));
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

    await apuntarHuella(nombreAsunto, d);
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
      try { await carpeta.removeEntry(fuera[i]); } catch (e) { /* ya no estaba */ }
    }
    correos = (correos || []).filter(function (x) { return x.fichero !== item.fichero; });
    if (pendiente && pendiente.fichero === item.fichero) { pendiente = null; pintarAvisoPendiente(); }
    repintarPantalla();
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
        var item = pendiente;
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

  /* ==========================================================
     EL BLOQUE DE AJUSTES
     ========================================================== */

  function bloqueDeAjustes() {
    var ya = $('bloque-bandeja');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-bandeja';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Bandeja de correos</span>' +
        '<span class="bloque-pie">La carpeta de Drive donde caen los correos etiquetados en Gmail</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">En Gmail le pones a un correo la etiqueta <code>GESTOR</code>. ' +
        'Un script lo recoge y deja su ficha en la carpeta <code>GESTOR-BANDEJA</code> de tu Drive. ' +
        'Señálala aquí una vez y los correos saldrán arriba, en la pantalla de asuntos abiertos, ' +
        'con el asunto ya propuesto.</p>' +
        '<div id="estado-bandeja" class="lista"></div>' +
        '<div class="alta-tipo" id="botones-bandeja"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    var estado = $('estado-bandeja');
    var botones = $('botones-bandeja');
    if (!estado || !botones) return;

    estado.innerHTML = '<div class="fila-tipo"><span class="nombre-tipo">' +
      (carpeta ? U.escapar(carpeta.name) : 'Sin señalar') + '</span>' +
      '<span class="suave">' +
      (carpeta ? 'Los correos aparecen en la pantalla de asuntos abiertos.'
               : 'Mientras no la señales, esto no hace nada.') +
      '</span></div>' +
      (carpeta ? '<div class="fila-tipo" id="fila-ultimo-correo"><span class="suave">Mirando…</span></div>' : '');
    if (carpeta) pintarUltimoCorreoRecogido();

    botones.innerHTML = '';
    var elegir = document.createElement('button');
    elegir.className = 'boton' + (carpeta ? '' : ' boton-principal');
    elegir.textContent = carpeta ? 'Cambiar la carpeta' : 'Señalar la carpeta de correos';
    elegir.onclick = elegirCarpeta;
    botones.appendChild(elegir);

    if (carpeta) {
      var quitar = document.createElement('button');
      quitar.className = 'boton';
      quitar.textContent = 'Dejar de usarla';
      quitar.onclick = olvidarCarpeta;
      botones.appendChild(quitar);
    }
  }

  /* ---------- "último correo recogido" (fila 18, punto 4) ----------

     El 17-sep-2026, montando la fila 18, se descubrió que el
     recolector llevaba seis días dejando los correos en una carpeta
     GESTOR-BANDEJA distinta de la que leía la aplicación (alguien
     había movido la de verdad dentro de otra, y el script, que solo
     busca en la raíz del Drive, se creó una nueva sin decir nada). En
     pantalla no se veía ningún error: la bandeja estaba siempre vacía.

     Se mira la fecha del propio fichero más nuevo de la carpeta (da
     igual si es un .json, un PDF o un adjunto): si el recolector deja
     de escribir aquí, esta fecha deja de moverse, aunque el .json de
     cada correo se lea bien. Más de tres días, aviso. */
  var DIAS_DE_AVISO_BANDEJA = 3;

  async function ultimoFicheroRecogido() {
    if (!carpeta) return null;
    var lista;
    try { lista = await Carpetas.ficheros(carpeta); } catch (e) { return null; }
    var masNuevo = 0;
    for (var i = 0; i < lista.length; i++) {
      try {
        var f = await lista[i].handle.getFile();
        if (f.lastModified > masNuevo) masNuevo = f.lastModified;
      } catch (e) { /* un fichero raro no debe tumbar esto */ }
    }
    return masNuevo || null;
  }

  async function pintarUltimoCorreoRecogido() {
    var t = await ultimoFicheroRecogido();
    var fila = $('fila-ultimo-correo');
    if (!fila) return;   /* se ha repintado el bloque, o se ha cerrado Ajustes, mientras tanto */

    if (!t) {
      fila.innerHTML = '<span class="suave">Todavía no ha llegado ningún correo a esta carpeta.</span>';
      return;
    }
    var dias = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (dias > DIAS_DE_AVISO_BANDEJA) {
      fila.innerHTML = '<span class="aviso-en-linea">Último correo recogido: hace ' + dias + ' días. ' +
        'Si esperabas correos, comprueba que el recolector está dejándolos en esta carpeta y no en ' +
        'otra con el mismo nombre.</span>';
    } else {
      fila.innerHTML = '<span class="suave">Último correo recogido: ' +
        U.escapar(fechaHoraLegible(new Date(t).toISOString())) + '</span>';
    }
  }

  /* ==========================================================
     LIMPIAR LOS RESTOS DEL VIEJO "BORRADOR EN CAMINO"
     (16-sep-2026 → 24-sep-2026, fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md)

     Hasta esta fila, `_GESTOR/envios.json` guardaba los encargos vivos
     de "mandar documentos por correo" (un borrador que montaba Apps
     Script), y la carpeta de la bandeja tenía sus copias de documentos
     y sus `<id>.envio.json`/`.listo.json`/`.error.json`. Ese mecanismo
     ha desaparecido: ahora el correo sale en el momento
     (js/correo-cuadro.js + js/correo-enviar.js). Esta limpieza se
     ejecuta una sola vez por arranque, y no hace nada si no queda
     ningún encargo viejo: no vigila nada, no repinta ninguna tarjeta. */

  async function limpiarEnviosViejos() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    try {
      var g = window.Gestor.carpetaGestor();
      var lista = await Carpetas.leerJson(g, 'envios.json');
      if (!Array.isArray(lista) || !lista.length) return;

      if (carpeta && (await tienePermiso(false))) {
        for (var i = 0; i < lista.length; i++) {
          var id = lista[i] && lista[i].id;
          if (!id) continue;
          var restos = [id + '.envio.json', id + '.listo.json', id + '.error.json'];
          for (var j = 0; j < restos.length; j++) {
            try { await carpeta.removeEntry(restos[j]); } catch (e) { /* ya no estaba */ }
          }
        }
        try {
          var ficherosBandeja = await Carpetas.ficheros(carpeta);
          for (var k = 0; k < ficherosBandeja.length; k++) {
            var nombreFichero = ficherosBandeja[k].nombre;
            var esCopiaDeUnEncargo = lista.some(function (item) {
              return item && item.id && nombreFichero.indexOf(item.id + ' - ') === 0;
            });
            if (esCopiaDeUnEncargo) { try { await carpeta.removeEntry(nombreFichero); } catch (e) {} }
          }
        } catch (e) { /* si no se puede listar, se deja como esté: no es crítico */ }
      }

      await Copias.guardar(g, 'envios.json', []);
    } catch (e) { /* limpieza accesoria de un mecanismo que ya no existe: si falla, no pasa nada */ }
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  async function arrancar() {
    if (arrancado) return;
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    arrancado = true;
    await recordarCarpeta();
    pintarBloqueAjustes();
    engancharElBotonDeCrear();
    await mirar(true);
    await limpiarEnviosViejos();
    await escribirSeguidos();
  }

  /* ==========================================================
     LO QUE USAN LOS DEMÁS FICHEROS DE LA BANDEJA
     ========================================================== */

  /* Pide el permiso otra vez y, si lo da, fuerza una mirada. Lo usa el
     botón de "La bandeja de correos necesita permiso otra vez", en
     js/bandeja-pantalla.js. Devuelve si ha quedado con permiso. */
  async function pedirPermiso() {
    if (!(await tienePermiso(true))) return false;
    ultimaMirada = 0;
    await mirar(true);
    return true;
  }

  /* `window.Bandeja` lo usan tres ficheros aparte, para no seguir
     engordando este: js/bandeja-enlace.js (el elegidor de asuntos a
     mano de un correo), js/correo-adjuntos.js (mandar documentos por
     correo) y js/bandeja-pantalla.js (la bandeja en pantalla,
     17-sep-2026, fila 27). A ninguno se le enseña nada más que esto. */
  window.Bandeja = {
    sinElRe: sinElRe,
    estaArchivado: estaArchivado,
    personasDelCorreo: personasDelCorreo,
    guardarEnAsunto: guardarEnAsunto,
    reabrirYGuardar: reabrirYGuardar,
    asuntoDelHilo: asuntoDelHilo,
    escribirSeguidos: escribirSeguidos,
    carpeta: function () { return carpeta; },
    /* Para js/bandeja-pantalla.js. */
    correos: function () { return correos; },
    asuntoDeLaMatricula: asuntoDeLaMatricula,
    asuntoDeEsteCorreo: asuntoDeEsteCorreo,
    proponer: proponer,
    llevarANuevo: llevarANuevo,
    leerElCorreo: leerElCorreo,
    enlaceAGmail: enlaceAGmail,
    descartar: descartar,
    borrarDeLaBandeja: borrarDeLaBandeja,
    mirarDeNuevo: function (aLaFuerza) { ultimaMirada = 0; return mirar(aLaFuerza !== false); },
    pedirPermiso: pedirPermiso,
    soloElDia: soloElDia,
    fechaLegible: fechaLegible,
    fechaHoraLegible: fechaHoraLegible,
    sobre: sobre
  };

  var enganchado = false;

  function enganchar() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(function () {
      if (!arrancado) { arrancar(); return; }
      mirar(false);
    });
  }

  /* El puente ya está puesto cuando se carga este fichero. Por si algún
     día cambiara el orden, se reintenta al terminar la página. */
  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

})();
