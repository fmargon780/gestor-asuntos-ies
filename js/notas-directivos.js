/* ============================================================
   notas-directivos.js — las notas de los directivos en un asunto (7-oct-2026,
   fila 290, docs/NOTAS-DE-DIRECTIVOS.md).

   Una nota de directivo es una nota de `ficha.notas` con `deDirectivo: true`;
   lleva además `organo`, `documentos` (nombres de fichero), `carpeta` (donde
   esperan, `_GESTOR/notas-directivos/<carpeta>/`) y, cuando Administración la
   ha visto, `vistaPor` y `vistaEl`. «Sin ver» es la que no tiene `vistaPor`.

   - El directivo: la tarjeta «Notas» de su ficha lleva una caja, «Adjuntar
     documento» y «Enviar». Guarda por `Perfil.escribir` (vía `Encargos.escribir`):
     los documentos en su carpeta de espera y la nota por `App.anotarLista`.
   - Administración: un trozo en el cuadro de avisos de Inicio («N notas de
     directivos»), una marca en la fila de la tabla y, en la ficha, la nota sin
     ver resaltada y arriba, con «Vista» y «Guardar en el asunto» en cada
     documento (por el cuadro de ponerle nombre, como los de un encargo).
   - Al archivar un asunto con notas sin ver se pregunta antes.
   Los botones se enlazan por delegación (la lista se repinta muchas veces).
   ============================================================ */
var NotasDirectivos = (function () {

  var CARPETA = 'notas-directivos';

  function $(id) { return document.getElementById(id); }

  function esDe(n) { return !!(n && n.deDirectivo); }
  function notasDe(a) { var n = a && a.ficha && a.ficha.notas; return Array.isArray(n) ? n : []; }
  function idDe(n) { return String((n && n.cuando) || '') + '|' + String((n && n.texto) || ''); }
  function sinVer(a) { return notasDe(a).filter(function (n) { return esDe(n) && !n.vistaPor; }); }
  function quien(n) { return esDe(n) ? String(n.quien || '') + (n.organo ? ' (' + n.organo + ')' : '') : ''; }
  function activa() { return !!(window.Perfil && Perfil.esDirectivo()); }
  function documentosDe(n) { return Array.isArray(n && n.documentos) ? n.documentos : []; }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* ---------- el HTML de la lista ---------- */

  function documentosHtml(n, conBotones) {
    var docs = documentosDe(n);
    if (!docs.length || !n.carpeta) return '';
    return '<div class="nota-directivo-docs">' + docs.map(function (d) {
      return '<span class="nota-directivo-doc" data-nd-doc="' + U.escapar(d) + '" data-nd-carpeta="' + U.escapar(n.carpeta) + '">' +
        '<button type="button" class="enlace" data-puerta-perfil="1" data-nd-abrir="' + U.escapar(d) + '">' + U.escapar(d) + '</button>' +
        (conBotones ? ' <button type="button" class="boton nota-directivo-guardar" data-nd-guardar="' + U.escapar(d) + '">Guardar en el asunto</button>' : '') +
      '</span>';
    }).join(' ') + '</div>';
  }

  /* Las notas sin ver, resaltadas y arriba. Administración lleva «Vista»; el directivo solo las ve. */
  function htmlSinVer(a, notas) {
    var lista = (notas || notasDe(a)).filter(function (n) { return esDe(n) && !n.vistaPor; });
    if (!lista.length) return '';
    var admin = !activa();
    return lista.slice().reverse().map(function (n) {
      return '<div class="nota-fila registro-linea nota-directivo nota-directivo-sin-ver" data-nd-id="' + U.escapar(idDe(n)) + '">' +
        '<div class="nota-cabeza"><span class="nota-cuando">' + U.escapar(window.Notas ? Notas.cuando(n.cuando) : n.cuando) + '</span>' +
          '<span class="nota-quien">' + U.escapar(quien(n)) + '</span><span class="nota-directivo-etiqueta">Sin ver</span></div>' +
        '<div class="nota-texto">' + U.escapar(n.texto) + '</div>' + documentosHtml(n, admin) +
        (admin ? '<div class="nota-botones"><button type="button" class="boton boton-principal" data-nd-vista="1">Vista</button></div>' : '') +
      '</div>';
    }).join('');
  }

  function sinLasSinVer(notas) { return (notas || []).filter(function (n) { return !(esDe(n) && !n.vistaPor); }); }

  /* ---------- la caja del directivo ---------- */

  function cajaHtml() {
    return '<div class="nota-nueva nota-directivo-caja">' +
        '<textarea id="nota-directivo-texto" class="campo" rows="2" data-puerta-perfil="1" placeholder="Escribe una nota para Administración…"></textarea>' +
        '<ul id="nota-directivo-ficheros" class="encargo-ficheros"></ul>' +
        '<div class="nota-botonera">' +
          '<span class="nota-aviso" id="nota-directivo-aviso"></span>' +
          '<button type="button" id="nota-directivo-adjuntar" class="boton" data-puerta-perfil="1">Adjuntar documento</button>' +
          '<input type="file" id="nota-directivo-fichero" multiple class="oculto" data-puerta-perfil="1">' +
          '<button type="button" id="nota-directivo-enviar" class="boton boton-principal" data-puerta-perfil="1">Enviar</button>' +
        '</div>' +
      '</div>';
  }

  var ficheros = [];   /* los File elegidos para la nota que se está escribiendo */

  function pintarFicheros() {
    var ul = $('nota-directivo-ficheros');
    if (!ul) return;
    ul.innerHTML = '';
    ficheros.forEach(function (f, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + U.escapar(f.name) + '</span> ';
      var q = document.createElement('button');
      q.type = 'button'; q.className = 'enlace'; q.textContent = 'Quitar'; q.setAttribute('data-puerta-perfil', '1');
      q.onclick = function () { ficheros.splice(i, 1); pintarFicheros(); };
      li.appendChild(q);
      ul.appendChild(li);
    });
  }

  function decir(texto, mal) {
    var s = $('nota-directivo-aviso');
    if (!s) return;
    s.textContent = texto || '';
    s.classList.toggle('nota-directivo-error', !!(texto && mal));
  }

  function nombreSeguro(nombre, usados) {
    var limpio = String(nombre || 'documento').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() || 'documento';
    var punto = limpio.lastIndexOf('.');
    var base = punto > 0 ? limpio.slice(0, punto) : limpio, ext = punto > 0 ? limpio.slice(punto) : '';
    var n = limpio, i = 2;
    while (usados.indexOf(n) !== -1) n = base + ' (' + (i++) + ')' + ext;
    return n;
  }

  /* La nota y sus documentos, por la única puerta de un directivo. `App.anotarLista` escribe por `App.E.gestor`
     (envuelto): mientras dura la puerta se le pone la carpeta sin envolver, y se devuelve. */
  async function enviar(a, texto, adjuntos) {
    var id = Encargos._nuevoId(App.E.usuario);
    var nombres = [];
    var nota = { texto: texto, quien: App.E.usuario || '', cuando: U.ahora(), deDirectivo: true,
      organo: Perfil.textoDe(Perfil.organo()) };
    await Encargos.escribir(async function (g) {
      var hechoCarpeta = false;
      if (adjuntos.length) {
        var carpeta = await Carpetas.crear(await Carpetas.crear(g, CARPETA), id);
        hechoCarpeta = true;
        for (var i = 0; i < adjuntos.length; i++) {
          var nombre = nombreSeguro(adjuntos[i].name, nombres);
          await Carpetas.escribirBytes(carpeta, nombre, await adjuntos[i].arrayBuffer(), adjuntos[i].type);
          nombres.push(nombre);
        }
        nota.documentos = nombres; nota.carpeta = id;
      }
      var envuelto = App.E.gestor;
      App.E.gestor = g;
      try {
        await App.anotarLista(a.nombre, 'notas', { anadir: [nota], extra: { notaEl: nota.cuando, notaPor: nota.quien } });
      } catch (e) {
        if (hechoCarpeta) { try { await (await Carpetas.crear(g, CARPETA)).removeEntry(id, { recursive: true }); } catch (e2) { /* no estorba */ } }
        throw e;
      } finally { App.E.gestor = envuelto; }
    });
    return nota;
  }

  async function repintarFicha(a) {
    try {
      var lista = await Notas.frescas(a);
      if (a.ficha) a.ficha.notas = lista;
      if (window.FichaNucleo && FichaNucleo.pintarNotas && $('ficha-notas')) FichaNucleo.pintarNotas(a, true);
    } catch (e) { /* solo pintar */ }
    registrarAviso();
    if (window.Inicio && Inicio.repintar) { try { Inicio.repintar(); } catch (e2) { /* solo pintar */ } }
  }

  async function alEnviar(a) {
    var campo = $('nota-directivo-texto');
    var texto = campo ? campo.value.trim() : '';
    if (!texto) { decir('Escribe la nota antes de enviarla.', true); if (campo) campo.focus(); return; }
    decir('');
    try { await enviar(a, texto, ficheros.slice()); }
    catch (e) { U.fallo('No he podido enviar la nota', e); return; }   /* el texto se queda en la caja */
    ficheros = [];
    if (campo) campo.value = '';   /* si no, el repintado conservaría lo escrito */
    U.aviso('Nota enviada a Administración.', 'bueno');
    await repintarFicha(a);
  }

  /* Lo llama js/notas.js al pintar la tarjeta de un directivo. */
  function enlazarCaja(caja, a) {
    var enviarB = $('nota-directivo-enviar');
    if (!enviarB) return;
    pintarFicheros();
    enviarB.onclick = function () { return U.mientrasGuarda(enviarB, function () { return alEnviar(a); }); };
    $('nota-directivo-adjuntar').onclick = function () { $('nota-directivo-fichero').click(); };
    $('nota-directivo-fichero').onchange = function (ev) {
      Array.prototype.forEach.call(ev.target.files || [], function (f) { ficheros.push(f); });
      ev.target.value = '';
      pintarFicheros();
    };
  }

  /* ---------- Administración: los documentos ---------- */

  function raizDe(carpeta) {
    return App.E.gestor.getDirectoryHandle(CARPETA).then(function (d) { return d.getDirectoryHandle(carpeta); });
  }

  /* Los documentos de la nota que siguen esperando en su carpeta. */
  async function pendientes(n) {
    var docs = documentosDe(n), salida = [];
    if (!docs.length || !n.carpeta) return salida;
    var dir = null;
    try { dir = await raizDe(n.carpeta); } catch (e) { return salida; }
    for (var i = 0; i < docs.length; i++) {
      try { if (await Carpetas.existeFichero(dir, docs[i])) salida.push(docs[i]); } catch (e2) { /* no está */ }
    }
    return salida;
  }

  async function abrirDocumento(n, nombre) {
    try {
      var dir = await raizDe(n.carpeta);
      var f = await (await dir.getFileHandle(nombre)).getFile();
      if (window.Lector) Lector.abrir({ titulo: nombre, pie: 'Nota de ' + quien(n), blob: f });
    } catch (e) {
      if (e && e.name === 'NotFoundError') U.aviso('Ese documento ya está guardado en el asunto.', 'ambar');
      else U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(e), 'ambar');
    }
  }

  /* Los documentos a la carpeta del asunto, uno detrás de otro por el cuadro de ponerles nombre (el paso de los encargos).
     Guardado el último, se borra la carpeta de espera. */
  async function guardarDocumentos(a, n, nombres) {
    var dir;
    try { dir = await raizDe(n.carpeta); } catch (e) { U.aviso('Ese documento ya está guardado en el asunto.', 'ambar'); return; }
    var destino = await App.E.abiertos.getDirectoryHandle(a.nombre);
    var dentro = [];
    for (var i = 0; i < nombres.length; i++) {
      try {
        var libre = (await Carpetas.existeFichero(destino, nombres[i])) ? await Carpetas.nombreLibreConSufijo(destino, nombres[i]) : nombres[i];
        await Carpetas.moverFichero(dir, nombres[i], destino, libre);
        dentro.push(libre);
      } catch (e2) { U.accesorio('El documento «' + nombres[i] + '» no ha podido entrar en el asunto', e2); }
    }
    if (!(await pendientes(n)).length) {
      try { await (await App.E.gestor.getDirectoryHandle(CARPETA)).removeEntry(n.carpeta, { recursive: true }); } catch (e3) { /* ya no estaba */ }
    }
    if (dentro.length && window.EncargosLlegada) {
      var entero = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === a.nombre; })[0] || { nombre: a.nombre };   /* con su carpeta */
      await EncargosLlegada.nombrarDocumentos(entero, 'nota-' + n.carpeta, dentro);
    }
  }

  async function marcarVista(a, n, notaVieja) {
    var nueva = Object.assign({}, notaVieja, { vistaPor: App.E.usuario || '', vistaEl: U.ahora() });
    await App.anotarLista(a.nombre, 'notas', { anadir: [nueva] });   /* misma identidad `cuando|texto`: se sustituye en su sitio */
  }

  /* «Vista», con aviso si quedan documentos sin guardar. */
  async function alPulsarVista(a, id) {
    var lista = await Notas.frescas(a);
    var n = lista.filter(function (x) { return idDe(x) === id; })[0];
    if (!n) return;
    var faltan = await pendientes(n);
    if (faltan.length) {
      var cancelar = $('cuadro-cancelar');
      if (cancelar) cancelar.textContent = 'Guardarlos ahora';
      var deTodosModos = await U.preguntar('Notas de directivos',
        '<p>' + U.escapar('Tiene ' + plural(faltan.length, 'documento', 'documentos') + ' sin guardar en el asunto.') + '</p>',
        'Marcar como vista de todos modos');
      if (cancelar) cancelar.textContent = 'Cancelar';
      if (!deTodosModos) { await guardarDocumentos(a, n, faltan); await repintarFicha(a); return; }
    }
    try { await marcarVista(a, n, n); }
    catch (e) { U.fallo('No he podido marcar la nota como vista', e); return; }
    await repintarFicha(a);
  }

  /* El asunto de una lista de notas: el de la ficha abierta o, si no, el del registro. */
  function asuntoDe(raiz) {
    var caja = raiz.closest('[data-clave]');
    var clave = caja && caja.dataset.clave;
    var f = window.FichaNucleo && FichaNucleo.actual;
    if (f && f.nombre === clave) return f;
    return clave ? { nombre: clave, ficha: (App.E.registro.asuntos || {})[clave] || {} } : null;
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-nd-vista], [data-nd-guardar], [data-nd-abrir]');
    if (!b) return;
    var a = asuntoDe(b);
    if (!a) return;
    var fila = b.closest('[data-nd-id]');
    var id = fila ? fila.dataset.ndId : '';
    var doc = b.closest('[data-nd-doc]');
    if (b.hasAttribute('data-nd-vista')) { U.mientrasGuarda(b, function () { return alPulsarVista(a, id); }); return; }
    var buscar = function () {
      return Notas.frescas(a).then(function (lista) {
        return lista.filter(function (x) { return esDe(x) && x.carpeta === (doc && doc.dataset.ndCarpeta); })[0];
      });
    };
    var nombre = doc && doc.dataset.ndDoc;
    if (b.hasAttribute('data-nd-abrir')) { buscar().then(function (n) { if (n) abrirDocumento(n, nombre); }); return; }
    U.mientrasGuarda(b, function () {
      return buscar().then(function (n) { return n && guardarDocumentos(a, n, [nombre]).then(function () { return repintarFicha(a); }); });
    });
  });

  /* Tras pintar la lista: a los documentos que ya no esperan se les quita «Guardar en el asunto». */
  async function afinar(raiz) {
    var docs = raiz ? raiz.querySelectorAll('[data-nd-doc]') : [];
    if (!docs.length) return;
    var a = asuntoDe(raiz);
    if (!a) return;
    var notas = notasDe(a);
    for (var i = 0; i < docs.length; i++) {
      var el = docs[i];
      var n = notas.filter(function (x) { return esDe(x) && x.carpeta === el.dataset.ndCarpeta; })[0];
      if (!n) continue;
      var faltan = await pendientes(n);
      var guardar = el.querySelector('[data-nd-guardar]');
      if (guardar && faltan.indexOf(el.dataset.ndDoc) === -1) guardar.remove();
    }
  }

  /* ---------- Inicio: el aviso y la marca ---------- */

  function registrarAviso() {
    if (!window.AvisosLinea) return;
    var asuntos = [], n = 0;
    if (!activa() && window.App && App.E) {
      (App.E.listaAbiertos || []).forEach(function (a) {
        var c = sinVer(a).length;
        if (c) { n += c; asuntos.push(a); }
      });
    }
    AvisosLinea.registrar('notas-directivos', n ? plural(n, 'nota de directivo', 'notas de directivos') : '', false, null, asuntos);
  }

  /* La marca de la fila de Inicio (solo para Administración). */
  function marca(a) {
    if (activa() || !sinVer(a).length) return null;
    var s = document.createElement('span');
    s.className = 'marca-nota-directivo';
    s.title = 'Nota de un directivo sin ver';
    s.setAttribute('aria-label', 'Nota de un directivo sin ver');
    s.textContent = '✎';
    return s;
  }

  /* ---------- archivar ---------- */

  /* true si se puede seguir archivando; false si Administración prefiere verlas antes. */
  async function antesDeArchivar(a) {
    if (activa()) return true;
    var n = sinVer(a).length;
    if (!n) return true;
    var cancelar = $('cuadro-cancelar');
    if (cancelar) cancelar.textContent = 'Verlas';
    var archivar = await U.preguntar('Notas de directivos',
      '<p>' + U.escapar('Tiene ' + plural(n, 'nota de directivo', 'notas de directivos') + ' sin ver.') + '</p>', 'Archivar de todos modos');
    if (cancelar) cancelar.textContent = 'Cancelar';
    if (!archivar && window.App && App.abrirFicha) { try { App.abrirFicha(a, 'abierto'); } catch (e) { /* solo mirar */ } }
    return archivar;
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(registrarAviso);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar); else enganchar();

  return {
    CARPETA: CARPETA, esDe: esDe, quien: quien, sinVer: sinVer, activa: activa, idDe: idDe,
    documentosHtml: documentosHtml, htmlSinVer: htmlSinVer, sinLasSinVer: sinLasSinVer, cajaHtml: cajaHtml, enlazarCaja: enlazarCaja,
    afinar: afinar, registrarAviso: registrarAviso, marca: marca, antesDeArchivar: antesDeArchivar, enviar: enviar, pendientes: pendientes
  };
})();
window.NotasDirectivos = NotasDirectivos;
