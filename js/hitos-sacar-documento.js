/* ============================================================
   hitos-sacar-documento.js — quitar un documento de su hito, o pasarlo a
   otro, desde cualquier sitio (fila 282, docs/QUITAR-UN-DOCUMENTO-DE-SU-HITO.md).

   Una sola manera de hacerlo, para la ficha («Asociar a un hito»), el «⋯» de
   la mesa del hito, «Mover a otro hito», «Apuntar un documento» y los
   documentos de otros hitos o sin hito de la mesa:

     quitar(a, nombres)          -> deja cada documento sin hito, en TODOS en los
                                    que esté apuntado (con sus gemelos de ese hito)
     mover(a, nombres, destino)  -> lo deja solo en `destino` (si no estaba en
                                    ninguno, lo asocia)

   La tarea que se marcó sola con el documento («reunir un documento») SE
   QUEDA marcada: el aviso lo dice y trae «Desmarcar». La aplicación no
   deshace nada sin que se vea. No envuelve nada; no llama a
   `HitosRequisitos.desmarcarPorDocumento` salvo desde ese botón.

   `engancharAjenos(fila, a, h, hitos)`: el «⋯» de las filas «De otros hitos» y
   «En la carpeta, sin hito» de la mesa («Traer a este hito», «Quitar de su
   hito»).
   ============================================================ */
var HitosSacarDocumento = (function () {

  function recorte(t) { t = String(t || ''); return t.length > 60 ? t.slice(0, 60) + '…' : t; }

  /* Todos los hitos del asunto, a cualquier profundidad (las ramas de una decisión). */
  function todos(hitos) {
    var salida = [];
    (function recorrer(lista) {
      (lista || []).forEach(function (h) {
        salida.push(h);
        (h.opciones || []).forEach(function (o) { recorrer(o && o.hitos); });
      });
    })(hitos);
    return salida;
  }

  /* «N · título», como en la etiqueta de «De otros hitos». */
  function etiqueta(h, hitos) {
    var numerados = window.Hitos && Hitos.numerados ? Hitos.numerados(hitos || []) : [];
    var n = numerados.indexOf(h) + 1;
    return (n ? n + ' · ' : '') + (h.titulo || 'Hito');
  }

  function claveGemelo(n) { return window.HitoMesaDocumentos ? HitoMesaDocumentos.claveGemelo(n) : String(n); }

  /* Los nombres de este hito que son el documento o sus gemelos (el «SIN SELLAR» y el Word del mismo documento). */
  function conGemelos(h, nombre) {
    var k = claveGemelo(nombre);
    return (h.documentos || []).filter(function (x) { return x === nombre || claveGemelo(x) === k; });
  }

  function estaEn(h, nombre) { return conGemelos(h, nombre).indexOf(nombre) !== -1; }

  async function repintar(a) {
    if (window.HitosPanel) HitosPanel.programarRepintado();
    if (window.FichaDocumentos && window.App && App.fichaAbierta && App.fichaAbierta() === a.nombre) {
      try { FichaDocumentos.pintar(a); } catch (e) { /* solo pintar */ }
    }
  }

  /* Quita `nombre` (y sus gemelos) de un hito. Devuelve { tarea, idHito } si dejó una tarea marcada, o null. */
  async function sacarDe(a, h, nombre) {
    var nombres = conGemelos(h, nombre);
    var tarea = null;
    if (window.Hitos && Hitos.tareaMarcadaPorDocumento) {
      for (var i = 0; i < nombres.length && !tarea; i++) {
        var t = Hitos.tareaMarcadaPorDocumento(a, h, nombres[i]);
        if (t) tarea = { texto: t.texto, documento: nombres[i] };
      }
    }
    for (var j = 0; j < nombres.length; j++) await Hitos.quitarDocumento(a.nombre, h.id, nombres[j]);
    return tarea ? { texto: tarea.texto, documento: tarea.documento, idHito: h.id } : null;
  }

  /* El aviso verde, con «Desmarcar» si alguna tarea sigue marcada. */
  function avisar(a, texto, tareas) {
    var accion = null;
    if (tareas.length && window.HitosRequisitos) {
      accion = { boton: 'Desmarcar', alPulsar: async function () {
        try {
          for (var i = 0; i < tareas.length; i++) await HitosRequisitos.desmarcarPorDocumento(a.nombre, tareas[i].idHito, tareas[i].documento);
        } catch (e) { U.fallo('No he podido desmarcarla', e); }
        repintar(a);
      } };
    }
    U.aviso(texto, 'bueno', accion);
  }

  async function quitar(a, nombres) {
    var hitos, tareas = [], quitados = 0;
    try {
      hitos = await Hitos.hitosDe(a.nombre);
      for (var i = 0; i < nombres.length; i++) {
        var hallado = false;
        for (var k = 0, lista = todos(hitos); k < lista.length; k++) {
          if (!estaEn(lista[k], nombres[i])) continue;
          hallado = true;
          var t = await sacarDe(a, lista[k], nombres[i]);
          if (t) tareas.push(t);
        }
        if (hallado) quitados++;
      }
    } catch (e) { U.fallo('No he podido quitarlo del hito', e); await repintar(a); return { quitados: quitados, tareas: tareas }; }
    var texto;
    if (nombres.length === 1) {
      texto = 'Quitado del hito.' + (tareas.length ? ' La tarea «' + recorte(tareas[0].texto) + '» sigue marcada.' : '');
    } else {
      texto = 'Quitados ' + quitados + ' documentos del hito.' + (tareas.length ? ' Siguen marcadas ' + tareas.length + (tareas.length === 1 ? ' tarea.' : ' tareas.') : '');
    }
    avisar(a, texto, tareas);
    await repintar(a);
    return { quitados: quitados, tareas: tareas };
  }

  async function mover(a, nombres, destino) {
    var hitos, tareas = [], movidos = 0, asociados = 0, nombreDestino = '';
    try {
      hitos = await Hitos.hitosDe(a.nombre);
      var dest = todos(hitos).filter(function (x) { return x.id === destino.id; })[0] || destino;
      nombreDestino = etiqueta(dest, hitos);
      for (var i = 0; i < nombres.length; i++) {
        var nombre = nombres[i], aAnadir = [nombre], estabaEnOtro = false, estabaEnDestino = estaEn(dest, nombre);
        var lista = todos(hitos);
        for (var k = 0; k < lista.length; k++) {
          if (lista[k].id === dest.id || !estaEn(lista[k], nombre)) continue;
          estabaEnOtro = true;
          conGemelos(lista[k], nombre).forEach(function (g) { if (aAnadir.indexOf(g) === -1) aAnadir.push(g); });
          var t = await sacarDe(a, lista[k], nombre);
          if (t) tareas.push(t);
        }
        if (estabaEnDestino && !estabaEnOtro) continue;   /* ya estaba solo ahí: nada que hacer */
        for (var m = 0; m < aAnadir.length; m++) await Hitos.anadirDocumento(a.nombre, dest.id, aAnadir[m]);
        if (estabaEnOtro) movidos++; else asociados++;
        if (window.HitosRequisitos) {
          try { await HitosRequisitos.marcarPorDocumento(a.nombre, dest.id, nombre); } catch (e2) { U.accesorio('Movido, pero no he podido marcar su tarea', e2); }
        }
      }
    } catch (e) { U.fallo('No he podido moverlo', e); await repintar(a); return { movidos: movidos, asociados: asociados, tareas: tareas }; }
    var total = movidos + asociados;
    if (total) {
      var texto;
      if (total === 1 && movidos === 1) {
        texto = 'Movido a «' + nombreDestino + '».' + (tareas.length ? ' En el hito de antes, la tarea «' + recorte(tareas[0].texto) + '» sigue marcada.' : '');
      } else if (total === 1) {
        texto = 'Asociado a «' + nombreDestino + '».';
      } else {
        texto = 'Movidos ' + total + ' documentos a «' + nombreDestino + '».' + (tareas.length ? ' Siguen marcadas ' + tareas.length + (tareas.length === 1 ? ' tarea' : ' tareas') + ' de los hitos de antes.' : '');
      }
      avisar(a, texto, tareas);
    }
    await repintar(a);
    return { movidos: movidos, asociados: asociados, tareas: tareas };
  }

  /* ---------- el «⋯» de las filas de otros hitos y sin hito (la mesa) ---------- */

  function engancharAjenos(fila, a, h, hitos) {
    if (!window.FichaMenus) return;
    Array.prototype.forEach.call(fila.querySelectorAll('.mesa-doc-ajeno .mesa-doc-menu-ajeno'), function (boton) {
      var nombre = boton.closest('.mesa-doc').dataset.doc;
      var deOtroHito = boton.closest('.mesa-doc').dataset.hitoOrigen !== '';
      var opciones = [];
      if (h.clase !== 'decision') opciones.push({ texto: 'Traer a este hito', alPulsar: function () { mover(a, [nombre], h); } });
      if (deOtroHito) {
        if (opciones.length) opciones.push({ raya: true });
        opciones.push({ texto: 'Quitar de su hito', clase: 'ficha-menu-peligro', alPulsar: function () { quitar(a, [nombre]); } });
      }
      if (!opciones.length) { boton.remove(); return; }
      FichaMenus.montar(boton, opciones);
    });
  }

  return { quitar: quitar, mover: mover, engancharAjenos: engancharAjenos, etiqueta: etiqueta, conGemelos: conGemelos };
})();
window.HitosSacarDocumento = HitosSacarDocumento;
