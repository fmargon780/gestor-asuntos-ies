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
   guardar el correo dentro de ese asunto en vez de crear otro.

   La carpeta de la bandeja se señala una vez en Ajustes. Mientras no
   se señale, este módulo no enseña nada y la aplicación funciona como
   siempre.

   La ficha se escribe la última en Drive, así que un correo se lee
   solo cuando su .json existe: nunca se coge uno a medio guardar.
   ============================================================ */
(function () {

  var CLAVE = 'bandeja';           /* dónde se recuerda la carpeta */
  var SEGUNDOS_ENTRE_MIRADAS = 90;

  var carpeta = null;
  var correos = [];
  var pendiente = null;            /* el correo que se está convirtiendo */
  var ultimaMirada = 0;
  var arrancado = false;
  var mirando = false;

  function $(id) { return document.getElementById(id); }

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
      U.aviso('No he podido usar esa carpeta: ' + e.message, 'malo');
    }
  }

  async function olvidarCarpeta() {
    carpeta = null;
    correos = [];
    try { await Almacen.guardar(CLAVE, null); } catch (e) {}
    pintarBloqueAjustes();
    pintarBandeja();
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
      if (!(await tienePermiso(false))) { correos = null; pintarBandeja(); return; }
      var lista = await Carpetas.ficheros(carpeta);
      var salida = [];
      for (var i = 0; i < lista.length; i++) {
        var n = lista[i].nombre;
        if (!/\.json$/i.test(n)) continue;
        var d = await Carpetas.leerJson(carpeta, n);
        if (!d || !d.id) continue;
        salida.push({ fichero: n, datos: d });
      }
      salida.sort(function (a, b) {
        var fa = String(a.datos.fecha || ''), fb = String(b.datos.fecha || '');
        return fa < fb ? -1 : (fa > fb ? 1 : 0);
      });
      correos = salida;
      ultimaMirada = ahora;
      pintarBandeja();
    } catch (e) {
      correos = null;
      pintarBandeja();
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

  /* La carpeta de un asunto que ya existe. Si está archivado, hay que
     bajar por ARCHIVO / CATEGORÍA / TERCERO. */
  async function carpetaDelAsunto(nombre, ficha) {
    if (!estaArchivado(ficha)) return App.E.abiertos.getDirectoryHandle(nombre);
    if (!App.E.archivo) throw new Error('No hay carpeta de ARCHIVO señalada.');
    var dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
    return dentro.getDirectoryHandle(nombre);
  }

  async function guardarEnAsunto(item, elAsunto) {
    var d = item.datos;
    var destino;
    try {
      destino = await carpetaDelAsunto(elAsunto.nombre, elAsunto.ficha);
    } catch (e) {
      U.aviso('No encuentro la carpeta de ese asunto: ' + e.message, 'malo');
      return;
    }
    var metidos = await meterLosFicheros(d, destino);
    try {
      await window.Notas.anadir({ nombre: elAsunto.nombre, ficha: {} },
        'Respuesta por correo de ' +
        ((d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido') +
        ', recibida el ' + fechaLegible(d.fechaUltimo || d.fecha) + '.' +
        (d.enlace ? '\nEn Gmail: ' + d.enlace : ''));
    } catch (e) { /* la nota es lo menos importante */ }
    await borrarDeLaBandeja(item);
    U.aviso(metidos
      ? 'Guardado en ' + elAsunto.nombre + '.'
      : 'Anotado en ' + elAsunto.nombre + '.', 'bueno');
    if (window.Gestor && window.Gestor.recargar) window.Gestor.recargar();
  }

  /* ==========================================================
     LA BANDEJA EN PANTALLA
     ========================================================== */

  function caja() {
    var c = $('bandeja-correos');
    if (c) return c;
    var paneles = document.querySelector('#pantalla-abiertos .paneles');
    if (!paneles || !paneles.parentNode) return null;
    c = document.createElement('div');
    c.id = 'bandeja-correos';
    c.className = 'oculto';
    paneles.parentNode.insertBefore(c, paneles.nextSibling);
    return c;
  }

  function fechaLegible(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function sobre() {
    return '<svg class="tarjeta-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/>' +
      '<path d="m3.6 6.4 8.4 6 8.4-6"/></svg>';
  }

  function pintarBandeja() {
    var c = caja();
    if (!c) return;
    c.innerHTML = '';

    if (!carpeta) { c.className = 'oculto'; return; }

    if (correos === null) {
      c.className = 'aviso aviso-ambar';
      c.innerHTML = '<strong>La bandeja de correos necesita permiso otra vez.</strong>' +
        '<p>El navegador pide el permiso de nuevo cada vez que se abre la aplicación.</p>';
      var dar = document.createElement('button');
      dar.className = 'boton boton-principal';
      dar.textContent = 'Dar permiso a la bandeja';
      dar.onclick = async function () {
        if (await tienePermiso(true)) { ultimaMirada = 0; await mirar(true); }
        else U.aviso('Sin permiso no puedo leer los correos.', 'malo');
      };
      c.appendChild(dar);
      return;
    }

    if (!correos.length) { c.className = 'oculto'; return; }

    c.className = 'bandeja';

    var cabecera = document.createElement('div');
    cabecera.className = 'rotulo-lista';
    cabecera.innerHTML = '<span class="rotulo-icono rotulo-icono-correo">' + sobre() + '</span>' +
      '<span>Correos por convertir en asunto</span>' +
      '<span class="cuenta-lista">' + correos.length + '</span>';
    var mirarYa = document.createElement('button');
    mirarYa.className = 'boton';
    mirarYa.style.marginLeft = 'auto';
    mirarYa.textContent = 'Mirar ahora';
    mirarYa.onclick = function () { ultimaMirada = 0; mirar(true); };
    cabecera.appendChild(mirarYa);
    c.appendChild(cabecera);

    var lista = document.createElement('div');
    lista.className = 'lista';
    correos.forEach(function (item) { lista.appendChild(tarjeta(item)); });
    c.appendChild(lista);
  }

  function tarjeta(item) {
    var d = item.datos;
    var div = document.createElement('div');
    div.className = 'tarjeta tarjeta-correo';

    var de = (d.de && (d.de.nombre || d.de.correo)) || 'Remitente desconocido';
    var pie = [de, fechaLegible(d.fecha),
               d.mensajes > 1 ? d.mensajes + ' mensajes' : '',
               (d.adjuntos && d.adjuntos.length)
                 ? (d.adjuntos.length === 1 ? '1 documento' : d.adjuntos.length + ' documentos')
                 : ''].filter(Boolean).join('  ·  ');

    div.innerHTML = sobre() +
      '<div class="tarjeta-texto">' +
        '<div class="tarjeta-nombre">' + U.escapar(d.asunto || '(sin asunto)') + '</div>' +
        '<div class="tarjeta-pie">' + U.escapar(pie) + '</div>' +
        '<div class="tarjeta-pie propuesta-correo"></div>' +
      '</div>';

    /* Si el asunto del correo lleva dentro el nombre de un asunto que
       ya existe, es una respuesta: no hay que crear nada nuevo. */
    var yaEsta = asuntoQueYaExiste(d);
    var linea = div.querySelector('.propuesta-correo');

    if (yaEsta) {
      linea.innerHTML = '<span class="marca-tipo">Respuesta de</span>' +
        U.escapar(yaEsta.nombre) +
        (estaArchivado(yaEsta.ficha) ? '  ·  <strong>asunto archivado</strong>' : '');
    } else {
      /* La propuesta se calcula al pintar, sin esperar: primero sale la
         tarjeta y un momento después lo que se ha reconocido. */
      proponer(d).then(function (p) {
        if (!linea) return;
        if (!p.tercero && !p.tipo) {
          linea.textContent = 'Sin reconocer: elegirás tú el tercero y el tipo.';
          return;
        }
        var trozos = [];
        if (p.tipo) trozos.push(p.tipo.tipo);
        if (p.tercero) trozos.push(App.textoTercero(p.tercero));
        linea.innerHTML = '<span class="marca-tipo">Propuesta</span>' + U.escapar(trozos.join('  ·  '));
      }).catch(function () {});
    }

    var acciones = document.createElement('div');
    acciones.className = 'acciones';

    if (yaEsta) {
      var guardar = document.createElement('button');
      guardar.className = 'boton boton-principal';
      guardar.textContent = 'Guardar en ese asunto';
      guardar.onclick = function () { guardarEnAsunto(item, yaEsta); };
      acciones.appendChild(guardar);
    }

    var crear = document.createElement('button');
    crear.className = 'boton' + (yaEsta ? '' : ' boton-principal');
    crear.textContent = yaEsta ? 'Crear uno nuevo' : 'Crear el asunto';
    crear.onclick = function () { llevarANuevo(item); };
    acciones.appendChild(crear);

    if (d.enlace) {
      var ver = document.createElement('button');
      ver.className = 'boton';
      ver.textContent = 'Ver el correo';
      ver.onclick = function () { window.open(d.enlace, '_blank'); };
      acciones.appendChild(ver);
    }

    var fuera = document.createElement('button');
    fuera.className = 'boton';
    fuera.textContent = 'Descartar';
    fuera.onclick = function () { descartar(item); };
    acciones.appendChild(fuera);

    div.appendChild(acciones);
    return div;
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

  async function meterLosFicheros(d, destino) {
    var metidos = 0;
    if (d.pdf) {
      try {
        var comoPdf = await nombreLibre(destino, U.aAaMmDd(d.fechaUltimo || d.fecha) + ' CORREO.pdf');
        await copiarALaCarpeta(d.pdf, destino, comoPdf);
        metidos++;
      } catch (e) { U.aviso('El PDF del correo no ha podido entrar: ' + e.message, 'malo'); }
    }
    for (var i = 0; i < (d.adjuntos || []).length; i++) {
      try {
        var suyo = await nombreLibre(destino, sinElId(d.adjuntos[i], d.id));
        await copiarALaCarpeta(d.adjuntos[i], destino, suyo);
        metidos++;
      } catch (e) { /* un adjunto que falle no puede parar lo demás */ }
    }
    return metidos;
  }

  async function engancharCorreo(item, nombreAsunto) {
    var d = item.datos;
    var destino = await App.E.abiertos.getDirectoryHandle(nombreAsunto);
    var metidos = await meterLosFicheros(d, destino);

    try {
      var texto = 'Abierto desde un correo de ' +
        ((d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido') +
        (d.de && d.de.correo && d.de.nombre ? ' <' + d.de.correo + '>' : '') +
        ', recibido el ' + fechaLegible(d.fecha) + '.' +
        '\nAsunto del correo: ' + (d.asunto || '(sin asunto)') +
        (d.enlace ? '\nEn Gmail: ' + d.enlace : '');
      await window.Notas.anadir({ nombre: nombreAsunto, ficha: {} }, texto);
    } catch (e) { /* la nota es lo menos importante de todo esto */ }

    await borrarDeLaBandeja(item);
    U.aviso(metidos
      ? 'Asunto creado con el correo dentro.'
      : 'Asunto creado. El correo sale ya de la bandeja.', 'bueno');
  }

  async function borrarDeLaBandeja(item) {
    var d = item.datos;
    var fuera = [item.fichero];
    if (d.pdf) fuera.push(d.pdf);
    (d.adjuntos || []).forEach(function (a) { fuera.push(a); });
    for (var i = 0; i < fuera.length; i++) {
      try { await carpeta.removeEntry(fuera[i]); } catch (e) { /* ya no estaba */ }
    }
    correos = (correos || []).filter(function (x) { return x.fichero !== item.fichero; });
    if (pendiente && pendiente.fichero === item.fichero) { pendiente = null; pintarAvisoPendiente(); }
    pintarBandeja();
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
    var comoEra = boton.onclick;
    boton.onclick = async function () {
      var item = pendiente;
      var nombre = '';
      var existiaAntes = true;
      if (item && App.E.nuevo.tipo && App.E.nuevo.tercero) {
        try {
          nombre = Nombres.montar(App.datosDelFormulario());
          existiaAntes = nombre ? await Carpetas.existe(App.E.abiertos, nombre) : true;
        } catch (e) { nombre = ''; }
      }
      await comoEra.apply(this, arguments);
      if (!item || !nombre || existiaAntes) return;
      try {
        if (!(await Carpetas.existe(App.E.abiertos, nombre))) return;
        await engancharCorreo(item, nombre);
      } catch (e) {
        U.aviso('El asunto está creado, pero el correo no ha podido entrar: ' + e.message, 'malo');
      }
    };
  }

  /* ==========================================================
     EL BLOQUE DE AJUSTES
     ========================================================== */

  function bloqueDeAjustes() {
    var ya = $('bloque-bandeja');
    if (ya) return ya;
    var pantalla = $('pantalla-ajustes');
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
      '</span></div>';

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
  }

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
