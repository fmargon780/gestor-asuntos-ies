/* ============================================================
   hacer-este-hito-sello.js — «Hacer este hito», la parte del PDF sellado
   y del aviso de Inicio (6-oct-2026, fila 285, docs/HACER-ESTE-HITO.md,
   apartados 4 y 5).

   - Cuando un asunto tiene UN solo hito esperando el PDF sellado
     (`cadena.estado === 'esperando-sello'`) y en su carpeta aparece UN solo
     papel con sello, lo asocia al documento del hito sin preguntar
     (`RegistroSellado.asociar`, el de siempre). Con dudas (más de un sellado,
     más de un hito esperando, un sello anterior al día en que se generó el
     documento, el documento ya no está) no decide: queda el aviso ámbar de
     siempre de la ficha.
   - Marca la tarea de registrar; si la siguiente es comunicar, el hito pasa a
     «listo para enviar». Nunca abre un cuadro por sorpresa.
   - Una pasada de fondo, solo sobre los asuntos con una cadena esperando, al
     entrar y en cada refresco. Como escribe (renombra): no corre en solo
     consulta, ni con un guardado en marcha, ni en un asunto donde el
     compañero tiene el mando, ni dos veces a la vez.
   - El aviso «N listos para enviar» de Inicio y las coletillas de «Hito actual».
   ============================================================ */
var HacerEsteHitoSello = (function () {

  var corriendo = false;
  var ultimaPasada = 0;
  var ESPERA_ENTRE_PASADAS = 15000;

  function esperandoDe(hitos) {
    return (hitos || []).filter(function (h) { return h && h.cadena && h.cadena.estado === 'esperando-sello'; });
  }

  function diaDe(texto) {
    var f = texto ? U.aFecha(texto) : null;
    if (!f || isNaN(f.getTime())) return null;
    return new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
  }

  /* ¿Cuadra el sello con este hito? Sin fecha de sello, sí; con ella, no puede ser anterior al día de la cadena. */
  function selloValido(sello, cadena) {
    var dSello = diaDe(sello && sello.fecha);
    var cuando = cadena && cadena.cuando ? new Date(cadena.cuando) : null;
    if (dSello === null || !cuando || isNaN(cuando.getTime())) return true;
    return dSello >= new Date(cuando.getFullYear(), cuando.getMonth(), cuando.getDate()).getTime();
  }

  /* Devuelve los sellados que siguen sin resolver (todos, si no ha decidido nada). */
  async function resolver(a, detectados) {
    if (!detectados || detectados.length !== 1) return detectados || [];
    var hitos;
    try { hitos = await Hitos.hitosDe(a.nombre); } catch (e) { return detectados; }
    var esperando = esperandoDe(hitos);
    if (esperando.length !== 1) return detectados;
    var h = esperando[0], d = detectados[0], doc = h.cadena.documento;
    if (!doc || !selloValido(d.sello, h.cadena)) return detectados;
    try {
      var lista = await Carpetas.ficheros(a.handle);
      if (!lista.some(function (f) { return f.nombre === doc; })) return detectados;
      var nuevo = await RegistroSellado.asociar(a, d.nombre, doc, d.sello);
      if (!nuevo) return detectados;
      if (h.cadena.tarea) {
        try { await Hitos.marcarGuion(a.nombre, h.id, h.cadena.tarea, { hecho: true }); }
        catch (e1) { U.accesorio('Documento registrado, pero no he podido marcar la tarea', e1); }
      }
      var h2 = await HacerEsteHito._fresco(a, h.id);
      var sig = h2 ? HacerEsteHito.tareasDe(a, h2)[0] : null;
      var cadena = sig && sig.accion === 'comunicar'
        ? { estado: 'listo-para-enviar', tarea: sig.id, documento: nuevo, quien: h.cadena.quien || '', cuando: U.ahora() } : null;
      await HacerEsteHito._guardarCadena(a, h, cadena);
      if (window.HitosPanel && HitosPanel.programarRepintado) HitosPanel.programarRepintado();
    } catch (e) {
      U.accesorio('No he podido colocar el PDF sellado', e);
      return detectados;
    }
    return [];
  }

  /* Lo que usa la ficha antes de pintar su aviso ámbar. */
  async function alDetectar(a, detectados) {
    try { return await resolver(a, detectados); } catch (e) { return detectados; }
  }

  async function pasada() {
    if (corriendo || !window.Hitos || !window.RegistroSellado || !window.Gestor || !Gestor.carpetaGestor()) return;
    if (window.SoloConsulta && SoloConsulta.activo()) return;
    if (window.ColaGuardado && ColaGuardado.hayGuardado()) return;
    if (Date.now() - ultimaPasada < ESPERA_ENTRE_PASADAS) return;
    corriendo = true;
    ultimaPasada = Date.now();
    try {
      var datos = await Hitos.leer();
      var porAsunto = datos.porAsunto || {};
      var abiertos = Gestor.asuntos ? Gestor.asuntos() : [];
      for (var i = 0; i < abiertos.length; i++) {
        var a = abiertos[i];
        var entrada = porAsunto[a.nombre];
        if (!entrada || !esperandoDe(entrada.hitos).length) continue;
        if (window.Presencia && Presencia.ocupantePor && Presencia.ocupantePor(a.nombre)) continue;
        var detectados = await RegistroSellado.detectar(a);
        await resolver(a, detectados);
      }
    } catch (e) { /* es una mirada de fondo: sin respuesta, se vuelve a mirar en el siguiente refresco */
    } finally { corriendo = false; }
  }

  /* ---------- Inicio ---------- */

  function cadenasDe(hitos, estado) {
    return (hitos || []).filter(function (h) { return h && h.cadena && h.cadena.estado === estado; });
  }

  async function avisar() {
    if (!window.AvisosLinea || !window.Hitos) return;
    try {
      var datos = await Hitos.leer();
      var abiertos = Gestor.asuntos ? Gestor.asuntos() : [];
      var listos = abiertos.filter(function (a) {
        var e = (datos.porAsunto || {})[a.nombre];
        return e && cadenasDe(e.hitos, 'listo-para-enviar').length;
      });
      AvisosLinea.registrar('listos-para-enviar', listos.length ? listos.length + ' listos para enviar' : '', false, null, listos);
    } catch (e) { /* un aviso de más o de menos, nunca un error */ }
  }

  /* « · listo para enviar» / « · esperando el sello», detrás del hito actual (síncrono: usa lo ya leído). */
  function coletillaHTML(a) {
    var datos = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    var e = datos && datos.porAsunto ? datos.porAsunto[a.nombre] : null;
    if (!e) return '';
    if (cadenasDe(e.hitos, 'listo-para-enviar').length) return ' <span class="suave marca-cadena">· listo para enviar</span>';
    if (cadenasDe(e.hitos, 'esperando-sello').length) return ' <span class="suave marca-cadena">· esperando el sello</span>';
    return '';
  }

  function alRefrescar() {
    avisar();
    pasada();
    if (window.GrupoRegistro) GrupoRegistro.pasada();   /* fila 294: los PDF sellados de un trabajo en bloque */
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alRefrescar);

  return { alDetectar: alDetectar, resolver: resolver, pasada: pasada, avisar: avisar, coletillaHTML: coletillaHTML,
           _reiniciar: function () { ultimaPasada = 0; } };
})();
window.HacerEsteHitoSello = HacerEsteHitoSello;
