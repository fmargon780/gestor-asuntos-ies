/* ============================================================
   hitos-a-quien.js — a quién le toca mover un asunto (fila 104,
   23-sep-2026, docs/ESTADO-POR-EL-HITO.md).

   Desde que el hito es la mesa de trabajo (filas 102 y 103), el hito
   abierto ya dice a quién le toca. Aquí sale de él, solo, en qué
   montón va el asunto en Asuntos abiertos: "Pendiente de
   Administración" o "Pendiente de terceros".

     - Cada responsable de Ajustes › Hitos lleva la marca
       `administracion` (hitos.json → ajustes.responsables). Los papeles
       fijos (tercero, tutor, relacionado) son siempre terceros. Un
       hito sin responsable es de Administración: alguien de la casa
       tiene que decidir. Un nombre que no está en la lista (escrito a
       mano, o de un responsable ya quitado), de terceros.
     - Un asunto sin hitos va por su estado manual: la marca de cada
       estado de estados.json (`espera`, "Depende de otros" de siempre,
       que en Ajustes se enseña al revés, como "Administración").

   Va aparte de js/hitos.js para no pasar de las 400 líneas allí. Se
   engancha al mismo objeto Hitos. Se carga después de js/hitos-archivo.js
   (usa Hitos.resolverResponsable).
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  /* El nombre corto de cada papel fijo, para la tarjeta. */
  var PAPELES_CORTOS = { tercero: 'Tercero', tutor: 'Tutor legal', relacionado: 'Relacionado' };

  function esPapel(id) {
    return Hitos.PAPELES.some(function (p) { return p.id === id; });
  }

  /* ¿Es de Administración este responsable? El ÚNICO sitio que lo
     decide: lo usan esta lista, "Qué me toca" y la biblioteca de hitos. */
  function esDeAdministracion(idResponsable, ajustes) {
    if (!idResponsable) return true;
    if (esPapel(idResponsable)) return false;
    var aj = Hitos.normalizarAjustes(ajustes);
    var r = aj.responsables.filter(function (x) { return x.id === idResponsable; })[0];
    return !!(r && r.administracion);
  }

  function ladoDeHito(h, ajustes) {
    if (h.clase === 'decision' && !h.elegida) return 'administracion';
    return esDeAdministracion(h.responsable, ajustes) ? 'administracion' : 'terceros';
  }

  function nombreVisible(idResponsable, ajustes, contexto) {
    if (!idResponsable) return '';
    if (PAPELES_CORTOS[idResponsable]) return PAPELES_CORTOS[idResponsable];
    if (typeof Hitos.resolverResponsable !== 'function') return idResponsable;
    var r = Hitos.resolverResponsable(idResponsable, Hitos.normalizarAjustes(ajustes), contexto);
    return (r && r.texto) || idResponsable;
  }

  /* Función pura. El primer hito visible sin terminar (ni hecho ni "no
     aplica"), saltando los "solo informativo" y las preguntas ya
     respondidas. Si hay otros en curso a la vez y alguno es de
     Administración, gana Administración. Todos terminados: toca
     archivarlo, Administración. Sin hitos: `lado: null`. */
  function aQuienLeToca(hitos, ajustes, contexto) {
    if (!hitos || !hitos.length) return { lado: null, quien: '', hito: null };
    var abiertos = Hitos.visibles(hitos).filter(function (h) {
      if (h.estado === 'hecho' || h.estado === 'noaplica') return false;
      if (h.soloInformativo) return false;
      if (h.clase === 'decision' && h.elegida) return false;
      return true;
    });
    if (!abiertos.length) return { lado: 'administracion', quien: '', hito: null };
    var candidatos = [abiertos[0]].concat(abiertos.slice(1).filter(function (h) { return h.estado === 'encurso'; }));
    var h = candidatos.filter(function (x) { return ladoDeHito(x, ajustes) === 'administracion'; })[0] || candidatos[0];
    var lado = ladoDeHito(h, ajustes);
    return {
      lado: lado,
      quien: lado === 'terceros' ? nombreVisible(h.responsable, ajustes, contexto) : '',
      hito: h.id,
      desde: h.desde || ''
    };
  }

  /* Función pura. El montón de un asunto: por su hito si tiene; si no,
     por la marca de su estado manual; sin estado, Administración. */
  function ladoDelAsunto(hitos, ajustes, situacion, estados) {
    var r = aQuienLeToca(hitos, ajustes);
    if (r.lado) return r;
    var e = (estados || []).filter(function (x) { return x.nombre === situacion; })[0];
    return { lado: (e && e.espera) ? 'terceros' : 'administracion', quien: '', hito: null, porEstado: true };
  }

  /* Para la lista: lo último leído de hitos.json, sin ir al disco. */
  function ladoDeAsunto(a) {
    var datos = Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto[a.nombre];
    return ladoDelAsunto(entrada ? entrada.hitos : [], datos ? datos.ajustes : null,
      (a.ficha && a.ficha.situacion) || '', (window.App && App.E && App.E.estados) || []);
  }

  async function marcarAdministracion(id, si) {
    return (await Hitos.cambiar(function (d) {
      var r = d.ajustes.responsables.filter(function (x) { return x.id === id; })[0];
      if (r) r.administracion = !!si;
      return d;
    })).ajustes;
  }

  Object.assign(Hitos, {
    esDeAdministracion: esDeAdministracion, aQuienLeToca: aQuienLeToca,
    ladoDelAsunto: ladoDelAsunto, ladoDeAsunto: ladoDeAsunto,
    marcarAdministracion: marcarAdministracion
  });

  /* ---------- la lista, al día sin releer en cada repintado ----------

     Se relee hitos.json una vez al pintar la lista, y después por
     window.Gestor.alRefrescar solo si han pasado dos minutos (lo que
     haya tocado el otro ordenador). Lo que cambia este ordenador llega
     solo por Hitos.alCambiar. Solo se repinta si algún asunto cambia de
     montón o de "quién lo tiene". */
  var firma = null;
  var leidoEl = 0;

  function firmaActual() {
    if (!window.App || !App.E || !App.E.listaAbiertos) return '';
    return App.E.listaAbiertos.map(function (a) {
      var l = ladoDeAsunto(a);
      return a.nombre + '|' + l.lado + '|' + l.quien;
    }).join('\n');
  }

  function repintarSiCambia() {
    var f = firmaActual();
    if (f === firma) return;
    firma = f;
    if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
  }

  Hitos.alCambiar.push(function () { repintarSiCambia(); });

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!window.Gestor.carpetaGestor()) return;
      var ahora = Date.now();
      if (Hitos.ultimosLeidos() && ahora - leidoEl < 2 * 60 * 1000) return;
      leidoEl = ahora;
      Hitos.leer().then(repintarSiCambia).catch(function () { /* se queda por estado */ });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();
})();
