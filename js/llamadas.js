/* ============================================================
   llamadas.js — llamar por teléfono: el dato y su guardado (13-nov-2026, fila 639,
   docs/639-LLAMAR-POR-TELEFONO.md; tema 565; pantalla de prueba docs/pantallas/565.html).

   Cada llamada es una línea del registro con sus datos aparte (`llamada`):
     { id, sentido ('emitida'|'recibida'), con (texto: «Ortega Lima, Rosa (madre) · 650 111 222»), persona,
       telefono, resultado ('si'|'no'), comentario, hito, hitoTitulo, tarea, tareaTexto,
       corregida?: { cuando, quien } }
   La línea es { texto, quien (quien la apunta), cuando (ISO de la LLAMADA, no de apuntarla), auto: true, llamada }.
   Dónde vive (nada se guarda dos veces):
     - Con tarea: en `h.notas` de su hito (`hitos.json`). La lista bajo la tarea sale de ahí.
     - Sin tarea: en `ficha.notas` del asunto (`App.anotarLista`).
   Corregir una llamada no la borra: cambia la propia llamada (con la marca `corregida`) y deja en el registro una línea
   nueva «Llamada del … corregida. Antes: …». Una llamada no se puede borrar.

   La ventana, js/llamadas-ventana.js; los teléfonos, js/llamadas-personas.js; los botones y las listas, js/llamadas-vista.js.
   ============================================================ */
var Llamadas = (function () {

  function quien() { return (window.Gestor && Gestor.usuario && Gestor.usuario()) || (window.App && App.E && App.E.usuario) || ''; }

  /* El texto de la línea, como lo ve la usuaria en el registro. */
  function textoDe(l) {
    var rec = l.sentido === 'recibida';
    var t = (rec ? 'Llamada recibida de ' : 'Llamada a ') + (l.con || '') + (rec ? '' : ': ' + (l.resultado === 'si' ? 'hablado' : 'no contesta')) + '.';
    if (l.comentario) t += ' ' + l.comentario;
    if (l.tareaTexto) t += ' Tarea: ' + l.tareaTexto;
    return t;
  }

  /* El día y la hora de la llamada (`cuando`, ISO) como se ven. */
  function legible(iso) { return window.Notas ? Notas.cuando(iso) : String(iso || ''); }

  /* De los campos del cuadro («2026-11-13», «04:25») al ISO de la llamada; '' si no es una fecha. */
  function isoDe(dia, hora) {
    var d = new Date(String(dia || '') + 'T' + String(hora || '') + ':00');
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }

  /* Al revés: { dia: 'AAAA-MM-DD', hora: 'HH:MM' } en hora local. */
  function camposDe(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return { dia: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), hora: p(d.getHours()) + ':' + p(d.getMinutes()) };
  }

  /* Las llamadas apuntadas bajo una tarea, la más reciente arriba (por la hora de la llamada). */
  function deTarea(h, idTarea) {
    return ((h && h.notas) || []).filter(function (n) { return n && n.llamada && n.llamada.tarea === idTarea; })
      .sort(function (x, y) { return x.cuando < y.cuando ? 1 : x.cuando > y.cuando ? -1 : 0; });
  }

  function cuenta(lista) {
    var con = lista.filter(function (n) { return n.llamada.resultado === 'si'; }).length;
    return (lista.length === 1 ? '1 llamada' : lista.length + ' llamadas') + ' · ' + con + ' con respuesta';
  }

  /* ---------- dónde se guarda ---------- */

  function repintar(a) {
    if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    var caja = document.getElementById('ficha-notas');
    if (a && caja && window.FichaNucleo && FichaNucleo.pintarNotas && FichaNucleo.actual && FichaNucleo.actual.nombre === a.nombre) {
      Promise.resolve(window.Notas && Notas.frescas ? Notas.frescas(a) : null).then(function (lista) {
        if (lista && a.ficha) a.ficha.notas = lista;
        try { FichaNucleo.pintarNotas(a, FichaNucleo.modoActual === 'abierto'); } catch (e) { /* solo pintar */ }
      }, function () { /* solo pintar */ });
    }
  }

  async function anadirLinea(a, nota, idHito) {
    if (idHito) {
      await Hitos.cambiar(function (d) {
        var e = d.porAsunto[a.nombre];
        var h = e && Hitos.buscar(e.hitos, idHito);
        if (h) { h.notas = h.notas || []; h.notas.push(nota); }
        return d;
      });
    } else {
      await window.Gestor.anotarLista(a.nombre, 'notas', { anadir: [nota], extra: { notaEl: U.ahora(), notaPor: nota.quien } });
    }
  }

  /* La llamada nueva. `r`: { sentido, con, persona, telefono, resultado, comentario, cuando (ISO) }; `tarea`: { h, g } o null. Devuelve la línea. */
  async function apuntar(a, r, tarea) {
    var llamada = { id: U.nuevoId('ll'), sentido: r.sentido, con: r.con, persona: r.persona || '', telefono: r.telefono || '',
      resultado: r.sentido === 'recibida' ? 'si' : r.resultado, comentario: r.comentario || '' };
    if (tarea) { llamada.hito = tarea.h.id; llamada.hitoTitulo = tarea.h.titulo || ''; llamada.tarea = tarea.g.id; llamada.tareaTexto = tarea.g.texto; }
    var nota = { texto: textoDe(llamada), quien: quien(), cuando: r.cuando, auto: true, llamada: llamada };
    await anadirLinea(a, nota, tarea ? tarea.h.id : '');
    return nota;
  }

  /* Con «He hablado» (o recibida), la tarea de llamar pendiente se marca sola. Devuelve true si la ha marcado. */
  async function marcarSiHablado(a, tarea, resultado) {
    if (!tarea || tarea.g.accion !== 'llamar' || tarea.g.hecho || resultado !== 'si') return false;
    await Hitos.marcarGuion(a.nombre, tarea.h.id, tarea.g.id, { hecho: true });
    if (window.RegistroAsunto) await RegistroAsunto.auto(a, 'Tarea hecha: ' + tarea.g.texto, tarea.h);
    return true;
  }

  /* El aviso de después de apuntar. */
  function avisoDe(tarea, marcada, esDelActual) {
    if (marcada) return 'Llamada apuntada. La tarea «' + tarea.g.texto + '» queda hecha; si hay que seguir llamando, desmárcala.';
    if (tarea) return 'Llamada apuntada en la tarea «' + tarea.g.texto + '»' + (esDelActual ? '' : ' del hito «' + (tarea.h.titulo || '') + '»') + ' y en el Registro.';
    return 'Llamada apuntada en el Registro.';
  }

  /* ---------- corregir ---------- */

  /* Busca la línea de una llamada por su id: { nota, hito (o null) }. Lee lo último del disco. */
  async function buscar(a, id) {
    var hitos = await Hitos.hitosDe(a.nombre);
    var enc = null;
    (window.RegistroAsunto ? RegistroAsunto.aplanar(hitos) : hitos).forEach(function (h) {
      (h.notas || []).forEach(function (n) { if (!enc && n && n.llamada && n.llamada.id === id) enc = { nota: n, hito: h }; });
    });
    if (enc) return enc;
    var lista = window.Notas && Notas.frescas ? await Notas.frescas(a) : ((a.ficha && a.ficha.notas) || []);
    var n = lista.filter(function (x) { return x && x.llamada && x.llamada.id === id; })[0];
    return n ? { nota: n, hito: null } : null;
  }

  /* Guarda los cambios de una llamada: la deja con lo nuevo y la marca «corregida», y apunta la línea de «Antes». `r`: lo mismo que `apuntar`.
     Devuelve { cambio: bool, marcada: bool }. */
  async function corregir(a, enc, r) {
    var vieja = enc.nota, antes = vieja.llamada;
    var llamada = Object.assign({}, antes, { sentido: r.sentido, con: r.con, persona: r.persona || '', telefono: r.telefono || '',
      resultado: r.sentido === 'recibida' ? 'si' : r.resultado, comentario: r.comentario || '' });
    var igual = textoDe(llamada) === textoDe(antes) && r.cuando === vieja.cuando;
    if (igual) return { cambio: false, marcada: false };
    llamada.corregida = { cuando: U.ahora(), quien: quien() };
    var nueva = Object.assign({}, vieja, { texto: textoDe(llamada), cuando: r.cuando, llamada: llamada });
    var lineaAntes = 'Llamada del ' + legible(vieja.cuando) + ' corregida. Antes: ' + vieja.texto;
    if (enc.hito) {
      await Hitos.cambiar(function (d) {
        var e = d.porAsunto[a.nombre];
        var h = e && Hitos.buscar(e.hitos, enc.hito.id);
        var i = h ? (h.notas || []).findIndex(function (n) { return n && n.llamada && n.llamada.id === antes.id; }) : -1;
        if (i !== -1) h.notas[i] = nueva;
        return d;
      });
      await RegistroAsunto.auto(a, lineaAntes, enc.hito);
    } else {
      await window.Gestor.anotarLista(a.nombre, 'notas', { quitar: [vieja], anadir: [nueva] });
      await RegistroAsunto.auto(a, lineaAntes);
    }
    /* De «No contesta» a «He hablado» en una tarea de llamar pendiente: se marca sola. Al revés no se desmarca. */
    var marcada = false;
    if (enc.hito && antes.resultado !== 'si' && llamada.resultado === 'si' && antes.tarea) {
      var g = Hitos.guionDe(a, enc.hito).filter(function (x) { return x.id === antes.tarea; })[0];
      if (g) marcada = await marcarSiHablado(a, { h: enc.hito, g: g }, 'si');
    }
    return { cambio: true, marcada: marcada };
  }

  return { textoDe: textoDe, legible: legible, isoDe: isoDe, camposDe: camposDe, deTarea: deTarea, cuenta: cuenta, quien: quien,
           apuntar: apuntar, marcarSiHablado: marcarSiHablado, avisoDe: avisoDe, buscar: buscar, corregir: corregir, repintar: repintar };
})();
window.Llamadas = Llamadas;
