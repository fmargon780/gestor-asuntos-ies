/* ============================================================
   conservacion.js — cuánto tiempo se guarda cada asunto (fila 136,
   25-sep-2026, docs/PLAZO-DE-CONSERVACION.md).

   La ley de protección de datos pide no guardar datos personales más de
   lo necesario, y la Junta publica los plazos de cada serie en sus
   tablas de valoración. Cada tipo de asunto puede llevar su plazo, y la
   aplicación AVISA cuando un archivado lo ha cumplido. **Nunca borra
   nada sola**: solo se manda a la papelera pulsando.

   El dato:
   - `conservarAnios` en cada tipo de `tipos.json` (entero; vacío = sin
     plazo, y entonces nunca avisa). Se pone en «Datos del tipo»
     (`filaDeTipo`).
   - Cada entrada del índice del ARCHIVO guarda `archivadoEl` (de
     `cerradoEl`). Sin él, la fecha del nombre de la carpeta, marcada
     como aproximada.
   - `conservarHasta` (AAAA-MM-DD) en la ficha del archivado (y en su
     entrada del índice) manda sobre el cálculo: lo pone «Conservar más
     tiempo…».

   El aviso: al entrar, una vez al día como mucho, un aviso ámbar si hay
   alguno; y en Ajustes › Problemas, la tarjeta «N asuntos archivados han
   cumplido su plazo de conservación» (solo si hay), con la lista y dos
   botones (fila 291).
   ============================================================ */
var Conservacion = (function () {

  var ENLACE = 'https://www.juntadeandalucia.es/organismos/culturapatrimoniohistoricoydeporte/areas/cultura/archivos/cavad/tablas-valoracion.html';
  var CLAVE_DIA = 'gestor-conservacion-revisado';

  function $(id) { return document.getElementById(id); }
  function tipos() { return (window.App && App.E && App.E.tipos) || []; }

  function tipoPorNombre(nombre, lista) {
    if (!nombre) return null;
    lista = lista || tipos();
    return lista.filter(function (t) { return t.tipo === nombre; })[0] ||
      lista.filter(function (t) { return (t.alias || []).indexOf(nombre) !== -1; })[0] || null;
  }

  function aniosDeTipo(tipo) {
    var n = parseInt(tipo && tipo.conservarAnios, 10);
    return n > 0 ? n : 0;
  }

  /* 2024-02-29 + 1 año = 2025-02-28. */
  function sumarAnios(iso, n) {
    var p = String(iso).split('-').map(Number);
    var d = new Date(p[0] + n, p[1] - 1, p[2]);
    if (d.getMonth() !== p[1] - 1) d = new Date(p[0] + n, p[1], 0);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function isoDeAammdd(f) {
    return /^\d{6}$/.test(f || '') ? '20' + f.slice(0, 2) + '-' + f.slice(2, 4) + '-' + f.slice(4, 6) : '';
  }

  function legible(iso) { return iso ? iso.split('-').reverse().join('-') : ''; }

  /* El plazo de una entrada del índice, o null si su tipo no tiene. */
  function plazoDe(e, listaTipos, hoy) {
    var anios = aniosDeTipo(tipoPorNombre(e.tipo, listaTipos));
    if (!anios) return null;
    var base = e.archivadoEl || String(e.cerradoEl || '').slice(0, 10);
    var aproximada = false;
    if (!base) { base = isoDeAammdd(e.fecha); aproximada = true; }
    if (!base) return null;
    var hasta = e.conservarHasta || sumarAnios(base, anios);
    return { anios: anios, archivadoEl: base, aproximada: aproximada, hasta: hasta,
             porPeticion: !!e.conservarHasta, cumplido: hasta < (hoy || U.hoyIso()) };
  }

  function cumplidos(entradas, listaTipos, hoy) {
    var salida = [];
    (entradas || []).forEach(function (e) {
      var p = plazoDe(e, listaTipos, hoy);
      if (p && p.cumplido) salida.push({ entrada: e, plazo: p });
    });
    salida.sort(function (a, b) { return a.plazo.hasta < b.plazo.hasta ? -1 : 1; });
    return salida;
  }

  async function leerCumplidos() {
    if (!window.IndiceArchivo) return { ok: false, lista: [] };
    /* Fila 177: el plazo de conservación mira archivados de cualquier
       curso, no solo el actual. */
    var r = await IndiceArchivo.leerDisco({ todos: true });
    if (!r.ok) return { ok: false, lista: [] };
    return { ok: true, lista: cumplidos(r.datos.asuntos, tipos()) };
  }

  /* ---------- la pantalla de un tipo ---------- */

  function filaDeTipo(tipo) {
    var fila = document.createElement('div');
    fila.className = 'tipo-conservar-fila';
    fila.innerHTML =
      '<label class="etiqueta-en-linea">Conservar ' +
        '<input type="number" min="1" step="1" class="campo campo-plazo tipo-conservar-anios" placeholder="—"> ' +
        'años después de archivar</label>' +
      '<p class="nota">Vacío: sin plazo, y no avisa nunca. Cuando un archivado lo cumpla, sale en ' +
        'Ajustes › Problemas; nunca se borra nada solo. Plazos de referencia: ' +
        '<a href="' + ENLACE + '" target="_blank" rel="noopener">tablas de valoración de la Junta de Andalucía</a>.</p>';
    var campo = fila.querySelector('.tipo-conservar-anios');
    campo.value = aniosDeTipo(tipo) || '';
    campo.onchange = async function () {
      var n = parseInt(campo.value, 10);
      if (!(n > 0)) n = 0;
      campo.value = n || '';
      var t = tipoPorNombre(tipo.tipo) || tipo;
      var antes = aniosDeTipo(t);
      if (n === antes) return;
      [t, tipo].forEach(function (x) { if (n) x.conservarAnios = n; else delete x.conservarAnios; });
      campo.disabled = true;
      try {
        await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });
        U.aviso(tipo.tipo + (n ? ': se conserva ' + n + (n === 1 ? ' año' : ' años') + ' después de archivar.' : ': sin plazo de conservación.'), 'bueno');
      } catch (e) {
        [t, tipo].forEach(function (x) { if (antes) x.conservarAnios = antes; else delete x.conservarAnios; });
        campo.value = antes || '';
        U.fallo('No he podido guardarlo', e);
      }
      campo.disabled = false;
    };
    return fila;
  }

  /* ---------- la tarjeta de «Problemas» ----------

     Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): ya no es una sección de Ajustes sino la tarjeta
     «N asuntos archivados han cumplido su plazo de conservación» (solo si hay), con la lista y los
     dos botones de siempre. */

  var ultimaLista = [];

  function textoPlazo(p) {
    if (p.porPeticion) return 'conservar hasta el ' + legible(p.hasta);
    return p.anios + (p.anios === 1 ? ' año' : ' años') + ' · cumplido el ' + legible(p.hasta);
  }

  var turno = 0;   /* si llegan dos cálculos a la vez, solo vale el último */

  async function pintar() {
    var mio = ++turno;
    var r;
    try { r = await leerCumplidos(); } catch (e) { r = { ok: false, lista: [] }; }
    if (mio !== turno) return;
    ultimaLista = r.lista;
    if (!window.Problemas || !window.ProblemasTextos) return;
    if (!ultimaLista.length) { Problemas.registrar('conservacion', null); return; }
    var d = ProblemasTextos.conservacion(ultimaLista.map(function (x) {
      var e = x.entrada, p = x.plazo;
      return { nombre: e.nombre, dato: e.nombre,
        detalle: (e.tipo ? e.tipo + ' · ' : '') + 'Archivado el ' + legible(p.archivadoEl) + (p.aproximada ? ' (aprox.)' : '') + ' · ' + textoPlazo(p) };
    }));
    d.acciones[0].alPulsar = function (indices) { return mandarElegidos(indices); };
    d.acciones[1].alPulsar = function (indices) { return conservarMas(indices); };
    Problemas.registrar('conservacion', d);
  }

  function elegidos(indices) {
    return (indices || []).map(function (i) { return ultimaLista[i]; }).filter(Boolean);
  }

  async function mandarElegidos(indices) {
    var lista = elegidos(indices);
    if (!lista.length) { U.aviso('Elige antes alguno de la lista.', 'ambar'); return; }
    if (!window.Papelera || !Papelera.mandarArchivado) { U.aviso('La papelera no está disponible ahora mismo.', 'malo'); return; }
    var ok = await U.preguntar('Mandar a la papelera',
      '<p>Se ' + (lista.length === 1 ? 'manda <strong>1 asunto</strong>' : 'mandan <strong>' + lista.length + ' asuntos</strong>') +
      ' del ARCHIVO a la papelera, con su carpeta entera.</p>' +
      '<p class="nota">Desde la papelera se pueden devolver a su sitio, como cualquier otro borrado.</p>',
      'Mandar a la papelera');
    if (!ok) return;
    var bien = 0, fallos = [];
    for (var i = 0; i < lista.length; i++) {
      try { await Papelera.mandarArchivado(lista[i].entrada); bien++; }
      catch (e) { fallos.push(lista[i].entrada.nombre + ': ' + U.mensajeDeError(e)); }
    }
    if (bien) U.aviso(bien + (bien === 1 ? ' asunto mandado' : ' asuntos mandados') + ' a la papelera.', 'bueno');
    if (fallos.length) U.aviso('No he podido con ' + fallos.length + ': ' + fallos.join(' · '), 'malo');
    await pintar();
    if (typeof App.pintarPapelera === 'function') { try { await App.pintarPapelera(); } catch (e) { /* solo pintar */ } }
  }

  async function conservarMas(indices) {
    var lista = elegidos(indices);
    if (!lista.length) { U.aviso('Elige antes alguno de la lista.', 'ambar'); return; }
    var anios = 1;
    var ok = await U.preguntar('Conservar más tiempo',
      '<p>¿Cuántos años más, contando desde hoy?</p>' +
      '<input type="number" min="1" step="1" value="1" class="campo campo-plazo" id="conservar-mas-anios">',
      'Conservar');
    var campo = $('conservar-mas-anios');
    if (campo) anios = parseInt(campo.value, 10);
    if (!ok) return;
    if (!(anios > 0)) { U.aviso('Pon un número de años.', 'ambar'); return; }
    var hasta = sumarAnios(U.hoyIso(), anios);
    var bien = 0, fallos = [];
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i].entrada;
      try {
        var sitio = await IndiceArchivo.resolverHandle(e);
        if (!sitio) throw new Error('no encuentro su carpeta en el ARCHIVO');
        var ficha = (await FichaArchivo.leer(sitio.handle)) || {};
        ficha.conservarHasta = hasta;
        await FichaArchivo.escribir(sitio.handle, ficha);
        await IndiceArchivo.anadirEntrada(Object.assign({}, e, { conservarHasta: hasta }));
        bien++;
      } catch (err) { fallos.push(e.nombre + ': ' + U.mensajeDeError(err)); }
    }
    if (bien) U.aviso(bien + (bien === 1 ? ' asunto se conserva' : ' asuntos se conservan') + ' hasta el ' + legible(hasta) + '.', 'bueno');
    if (fallos.length) U.aviso('No he podido con ' + fallos.length + ': ' + fallos.join(' · '), 'malo');
    await pintar();
  }

  /* ---------- al entrar, una vez al día como mucho ---------- */

  var yaMirado = false;

  async function revisarAlEntrar() {
    if (yaMirado) return;
    yaMirado = true;
    var hoy = U.hoyIso();
    try { if (window.localStorage.getItem(CLAVE_DIA) === hoy) return; } catch (e) { /* sin memoria: se mira igual */ }
    var r;
    try { r = await leerCumplidos(); } catch (e) { return; }
    if (!r.ok) return;
    try { window.localStorage.setItem(CLAVE_DIA, hoy); } catch (e) { /* no pasa nada */ }
    var n = r.lista.length;
    if (n) {
      U.aviso(n + (n === 1 ? ' asunto del ARCHIVO ha cumplido' : ' asuntos del ARCHIVO han cumplido') +
        ' su plazo de conservación. Lo tienes en Ajustes › Problemas.', 'ambar');
    }
  }

  if (window.Gestor && window.Gestor.alRefrescar) {
    window.Gestor.alRefrescar.push(function () { if (!yaMirado && App.E && App.E.gestor) revisarAlEntrar(); });
  }

  if (window.Problemas) Problemas.calculador('conservacion', pintar, 10 * 60 * 1000);

  return {
    ENLACE: ENLACE,
    sumarAnios: sumarAnios, plazoDe: plazoDe, cumplidos: cumplidos, leerCumplidos: leerCumplidos,
    filaDeTipo: filaDeTipo, pintar: pintar, revisarAlEntrar: revisarAlEntrar
  };
})();
window.Conservacion = Conservacion;
