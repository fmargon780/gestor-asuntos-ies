/* ============================================================
   encargos-llegada.js — los encargos llegan a Administración (7-oct-2026,
   fila 289, docs/ENCARGOS-DE-DIRECTIVOS.md, apartado 4).

   «Ha llegado: … · N encargos» (js/inicio.js) abre «Ver todo» solo con los
   encargos; con «Ver todo» entero, los sin atender van arriba, antes de la
   bandeja de correo. Cada uno es una tarjeta con tres botones:
     1. «Crear asunto con él»: «Nuevo asunto» llega con el tercero, la fecha
        límite y «Quién lo pide» ya puestos; el tipo lo elige Administración.
     2. «Guardar en un asunto que ya existe»: el mismo selector de asunto de
        los documentos sueltos.
     3. «No procede»: pide el motivo (obligatorio) y lo guarda.
   Al crear o guardar en un asunto: el encargo pasa a `asunto`, se añade a
   `ficha.encargos`, el texto queda como nota («Encargo de <nombre>
   (<órgano>): <texto>») y sus documentos pasan uno detrás de otro por el
   cuadro de ponerles nombre; después se borra su carpeta.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var motivoAbierto = '';        /* el encargo cuya fila de «No procede» está desplegada */
  var pendienteDeNombrar = null; /* { nombre, id, nombres } tras crear el asunto */

  /* ---------- el asunto ---------- */

  async function nombreLibre(destino, nombre) {
    return (await Carpetas.existeFichero(destino, nombre)) ? Carpetas.nombreLibreConSufijo(destino, nombre) : nombre;
  }

  /* Lo que pasa cuando un encargo se lleva a un asunto: nota, `ficha.encargos`, documentos, estado y carpeta fuera.
     Devuelve los nombres con los que han entrado los documentos. */
  async function atender(e, asunto, destino) {
    var f = Encargos.porId(e.id) || e;
    if (window.Notas) {
      try { await Notas.anadir({ nombre: asunto.nombre }, 'Encargo de ' + f.de + (f.organo ? ' (' + f.organo + ')' : '') + ': ' + f.texto, { encargo: f.id }); }
      catch (e1) { /* la nota es lo menos importante */ }
    }
    await App.anotarLista(asunto.nombre, 'encargos', { anadir: [{ id: f.id, de: f.de, cuando: f.cuando }] });
    var nombres = [];
    var origen = await Encargos.carpetaDe(f.id);
    for (var i = 0; origen && i < f.documentos.length; i++) {
      try {
        var libre = await nombreLibre(destino, f.documentos[i]);
        await Carpetas.moverFichero(origen, f.documentos[i], destino, libre);
        nombres.push(libre);
      } catch (e2) { U.accesorio('El documento «' + f.documentos[i] + '» no ha podido entrar en el asunto', e2); }
    }
    await Encargos.marcarAsunto(f.id, asunto);
    if (origen) await Encargos.borrarCarpeta(f.id);
    return nombres;
  }

  /* Los documentos ya dentro, uno detrás de otro por el cuadro de ponerles nombre (como los adjuntos de un correo). */
  async function nombrarDocumentos(asunto, id, nombres) {
    if (!nombres || !nombres.length) return;
    var completo = Object.assign({
      leido: Nombres.leer(asunto.nombre, App.E.tipos),
      ficha: (App.E.registro.asuntos || {})[asunto.nombre] || {}
    }, asunto);
    try {
      await App.verDocumentos(completo, { ponerNombre: nombres[0], serieAdjuntos: { idCorreo: 'encargo-' + id, restantes: nombres.slice(1) } });
    } catch (e) { /* los documentos ya están dentro: solo falta ponerles nombre */ }
  }

  /* ---------- 1. «Crear asunto con él» ---------- */

  async function terceroDe(e) {
    var a = e.afecta;
    if (!a || !a.nombre || !a.categoria) return null;
    try {
      var hallados = (await App.buscarEnCategorias(a.nombre, [a.categoria], 10))[0].resultados;
      var mismos = hallados.filter(function (p) { return p.nombre === a.nombre; });
      return mismos.filter(function (p) { return !a.clave || String(p.id || p.documento || p.nif || '') === a.clave; })[0] || mismos[0] || null;
    } catch (err) { return null; }
  }

  async function crearAsunto(e) {
    var tercero = await terceroDe(e);
    try { if (window.Perfil) await Perfil.cargar(); } catch (err) { /* sin correo, pero se sigue */ }
    App.nuevoAsuntoCon({
      limite: e.paraCuando || '',
      loPide: { nombre: e.de, categoria: '', relacion: e.organo, correo: (window.Perfil && Perfil.correoDe(e.de)) || '', telefono: '', via: '', fecha: U.hoyIso() }
    });
    App.E.nuevo.encargo = e;
    if (tercero) App.fijarTercero(tercero); else App.pintarLoPideNuevo(null);
    App.pintarPendiente();
  }

  /* El recordatorio de «Nuevo asunto» (App.pintarPendiente lo llama): de dónde viene lo que hay rellenado. */
  function avisoDeNuevo(caja) {
    var e = App.E.nuevo && App.E.nuevo.encargo;
    if (!caja || !e || App.E.pendiente) return false;
    caja.classList.remove('oculto');
    caja.innerHTML = '<strong>Este asunto viene de un encargo.</strong>' +
      '<p>' + U.escapar(e.de) + (e.organo ? ' (' + U.escapar(e.organo) + ')' : '') + ' lo ha pedido desde la aplicación. ' +
      'Al crearlo, el texto del encargo quedará como nota y sus documentos entrarán en la carpeta.</p>';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'boton'; b.textContent = 'Este asunto no es de ese encargo';
    b.onclick = function () { App.E.nuevo.encargo = null; App.pintarPendiente(); };
    caja.appendChild(b);
    return true;
  }

  /* Tras crear el asunto (js/asuntos-nuevo-crear.js): el cuadro de ponerle nombre a sus documentos. */
  async function alTerminarDeCrear(recien) {
    var p = pendienteDeNombrar;
    pendienteDeNombrar = null;
    if (p && recien && p.nombre === recien.nombre) await nombrarDocumentos(recien, p.id, p.nombres);
  }

  if (window.Gestor && Gestor.alCrearAsunto) {
    Gestor.alCrearAsunto.push(async function (nombre, datos) {
      var e = App.E.nuevo && App.E.nuevo.encargo;
      if (!e) return;
      var f = Encargos.porId(e.id);
      if (!f || f.estado !== 'sin-atender') { U.aviso('Ese encargo ya lo ha atendido otra persona.', 'ambar'); return; }
      try {
        var nombres = await atender(f, { nombre: nombre, numero: datos.numero || '' }, await App.E.abiertos.getDirectoryHandle(nombre));
        pendienteDeNombrar = { nombre: nombre, id: f.id, nombres: nombres };
      } catch (err) { U.accesorio('Asunto creado, pero no he podido terminar de llevar el encargo', err); }
    });
  }

  /* ---------- 2. «Guardar en un asunto que ya existe» ---------- */

  function sugeridos(e) {
    var E = window.ElegirAsunto;
    var quien = U.normalizar((e.afecta && (e.afecta.nombre || e.afecta.texto)) || '');
    var palabras = U.normalizar(e.texto).split(/[^a-z0-9ñ]+/).filter(function (p) { return p.length >= 5; });
    return E.mejores(E.todos().map(function (x) {
      var puntos = E.puntosPorPalabras(palabras, x.nombre) + E.puntosDeBase(x.nombre, x.ficha);
      if (quien && E.terceroDentroDe(x.ficha, quien)) puntos += 40;
      return { nombre: x.nombre, ficha: x.ficha, puntos: puntos };
    }));
  }

  async function guardarEnExistente(e) {
    var E = window.ElegirAsunto;
    var elegido = await E.elegir({
      titulo: 'Guardar el encargo en un asunto',
      cabecera: '<p class="explica">' + U.escapar(e.de) + ': ' + U.escapar(String(e.texto).slice(0, 140)) +
        '<br><span class="suave">Se apuntará en el asunto que elijas y sus documentos entrarán en su carpeta.</span></p>',
      sugeridos: sugeridos(e)
    });
    if (!elegido) return;
    var ficha = elegido.ficha || {};
    if (E.estaArchivado(ficha)) {
      var que = await E.preguntarSiReabrir(elegido, {
        explica: '<p>Si el encargo es de una gestión que vuelve a moverse, lo normal es reabrir el asunto.</p>',
        reabrir: 'Reabrir y guardarlo aquí', sinReabrir: 'Guardarlo sin reabrir'
      });
      if (!que) return;
      if (que === 'reabrir') {
        try {
          var dentro = await Carpetas.bajar(App.E.archivo, [ficha.categoria, ficha.tercero], false);
          await App.reabrirAsunto({ nombre: elegido.nombre, padre: dentro, ficha: ficha });
        } catch (err) { U.aviso('No encuentro la carpeta de ese asunto en el ARCHIVO: ' + U.mensajeDeError(err), 'malo'); return; }
        if (!(await Carpetas.existe(App.E.abiertos, elegido.nombre))) return;
        ficha = {};
      }
    }
    var nombres;
    try {
      var destino = await E.carpetaDelAsunto(elegido.nombre, ficha);
      var fresca = (App.E.registro.asuntos || {})[elegido.nombre] || {};
      nombres = await atender(e, { nombre: elegido.nombre, numero: fresca.numero || '' }, destino);
    } catch (err2) { U.fallo('No he podido guardar el encargo en ese asunto', err2); return; }
    try { await App.verAbiertos(); } catch (e3) { /* solo pintar */ }
    var completo = { nombre: elegido.nombre, ficha: (App.E.registro.asuntos || {})[elegido.nombre] || {} };
    await nombrarDocumentos(completo, e.id, nombres);
    if (window.Navegacion) Navegacion.avisoConIr('Encargo guardado en ' + elegido.nombre + '.', 'bueno', elegido.nombre);
    else U.aviso('Encargo guardado en ' + elegido.nombre + '.', 'bueno');
  }

  /* ---------- 3. «No procede» ---------- */

  async function confirmarNoProcede(e) {
    var campo = $('encargo-motivo-' + e.id);
    var motivo = campo ? campo.value.trim() : '';
    if (!motivo) { U.aviso('Escribe el motivo: lo verá quien hizo el encargo.', 'ambar'); if (campo) campo.focus(); return; }
    try { await Encargos.noProcede(e.id, motivo); }
    catch (err) { U.fallo('No he podido guardar que no procede', err); return; }
    motivoAbierto = '';
    pintar();
  }

  /* ---------- las tarjetas ---------- */

  async function abrirDocumento(e, nombre) {
    try {
      var carpeta = await Encargos.carpetaDe(e.id);
      var f = await (await carpeta.getFileHandle(nombre)).getFile();
      if (window.Lector) Lector.abrir({ titulo: nombre, pie: 'Encargo de ' + e.de, blob: f });
    } catch (err) { U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(err), 'ambar'); }
  }

  function boton(texto, alPulsar, principal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton' + (principal ? ' boton-principal' : '');
    b.textContent = texto;
    b.onclick = function () { return U.mientrasGuarda(b, alPulsar); };
    return b;
  }

  function tarjeta(e) {
    var d = document.createElement('div');
    d.className = 'encargo-tarjeta';
    d.dataset.encargo = e.id;
    var afecta = e.afecta ? (e.afecta.texto || (e.afecta.nombre + (e.afecta.unidad ? ' · ' + e.afecta.unidad : ''))) : '';
    d.innerHTML =
      '<div class="encargo-quien"><strong>' + U.escapar(e.de) + '</strong>' + (e.organo ? ' · ' + U.escapar(e.organo) : '') +
        ' <span class="suave">· ' + U.escapar(Encargos.fechaLegible(e.cuando)) + '</span></div>' +
      '<div class="encargo-texto-entero">' + U.escapar(e.texto) + '</div>' +
      (afecta ? '<div class="encargo-dato"><span class="suave">A quién afecta:</span> ' + U.escapar(afecta) + '</div>' : '') +
      (e.paraCuando ? '<div class="encargo-dato"><span class="suave">Para cuándo:</span> ' + U.escapar(Encargos.fechaLegible(e.paraCuando)) + '</div>' : '') +
      (e.documentos.length ? '<div class="encargo-dato encargo-docs"><span class="suave">Documentos:</span> </div>' : '');
    var docs = d.querySelector('.encargo-docs');
    e.documentos.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'enlace encargo-doc'; b.textContent = n;
      b.onclick = function () { abrirDocumento(e, n); };
      docs.appendChild(b);
      docs.appendChild(document.createTextNode(' '));
    });
    var acciones = document.createElement('div');
    acciones.className = 'acciones encargo-acciones';
    acciones.appendChild(boton('Crear asunto con él', function () { return crearAsunto(e); }, true));
    acciones.appendChild(boton('Guardar en un asunto que ya existe', function () { return guardarEnExistente(e); }));
    var no = document.createElement('button');
    no.type = 'button'; no.className = 'boton'; no.textContent = 'No procede';
    no.onclick = function () { motivoAbierto = motivoAbierto === e.id ? '' : e.id; pintar(); };
    acciones.appendChild(no);
    d.appendChild(acciones);
    if (motivoAbierto === e.id) {
      var fila = document.createElement('div');
      fila.className = 'encargo-motivo';
      fila.innerHTML = '<label class="etiqueta" for="encargo-motivo-' + U.escapar(e.id) + '">Motivo (lo verá quien hizo el encargo)</label>' +
        '<input id="encargo-motivo-' + U.escapar(e.id) + '" class="campo" placeholder="Por qué no procede">';
      fila.appendChild(boton('Confirmar que no procede', function () { return confirmarNoProcede(e); }));
      d.appendChild(fila);
    }
    return d;
  }

  function pintar() {
    var zona = $('zona-encargos');
    if (!zona) return;
    var lista = Encargos.sinAtender().sort(function (a, b) { return String(a.cuando).localeCompare(String(b.cuando)); });
    var q = U.normalizar(($('buscar-abiertos') || {}).value || '');
    if (q) lista = lista.filter(function (e) { return U.normalizar(e.de + ' ' + e.texto).indexOf(q) !== -1; });
    zona.classList.toggle('oculto', !lista.length);
    U.conservandoLoEscrito(zona, function () {
      zona.innerHTML = '';
      if (!lista.length) return;
      var titulo = document.createElement('h3');
      titulo.className = 'encargos-titulo';
      titulo.textContent = lista.length === 1 ? '1 encargo sin atender' : lista.length + ' encargos sin atender';
      zona.appendChild(titulo);
      lista.forEach(function (e) { zona.appendChild(tarjeta(e)); });
    });
  }

  Encargos.alCambiar.push(function () {
    pintar();
    if (window.Inicio && Inicio.repintar) Inicio.repintar();
  });

  window.EncargosLlegada = { pintar: pintar, avisoDeNuevo: avisoDeNuevo, alTerminarDeCrear: alTerminarDeCrear, nombrarDocumentos: nombrarDocumentos, _atender: atender };
})();
