/* ============================================================
   hitos-a-quien.js — el estado del asunto es su hito actual (fila 104,
   23-sep-2026, docs/ESTADO-POR-EL-HITO.md; desde la fila 129,
   24-sep-2026, docs/EL-HITO-ES-EL-ESTADO.md, sin estados a mano).

   El hito actual dice en qué paso va el asunto («Paso N de M · título»)
   y a quién le toca moverlo: en qué montón va en Asuntos abiertos,
   "Pendiente de Administración" o "Pendiente de terceros".

     - Cada paso de la guía puede decir «Nos toca» o «Esperamos a…»
       (`toca`/`tocaA`, heredado por sus hitos): esa marca manda.
     - Sin marca, el responsable: cada responsable de Ajustes › Hitos
       lleva la marca `administracion` (hitos.json → ajustes.responsables).
       Los papeles fijos (tercero, tutor, relacionado) son siempre
       terceros. Un hito sin responsable es de Administración: alguien
       de la casa tiene que decidir. Un nombre que no está en la lista
       (escrito a mano, o de un responsable ya quitado), de terceros.
     - «Esperando a…» (`esperandoA`, puesto a mano en el hito actual,
       js/estado-hito.js) manda sobre todo lo demás.
     - Un asunto sin hitos va a Administración: el estado escrito a mano
       ya no se lee (`ficha.situacion` se queda quieta en asuntos.json).

   Va aparte de js/hitos.js para no pasar de las 400 líneas allí. Se
   engancha al mismo objeto Hitos. Se carga después de js/hitos-archivo.js
   (usa Hitos.resolverResponsable).
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  /* El nombre corto de cada papel fijo, para la tarjeta. */
  var PAPELES_CORTOS = { tercero: 'Tercero', tutor: 'Familia', relacionado: 'Relacionado' };

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

  /* A quién espera un hito: lo puesto a mano, la marca del paso o el
     responsable, por ese orden. '' si le toca a la casa. */
  function esperaDeHito(h) {
    if (h.esperandoA) return h.esperandoA;
    if (h.toca === 'espera') return h.tocaA || h.responsable || 'tercero';
    return h.responsable;
  }

  function ladoDeHito(h, ajustes) {
    if (h.clase === 'decision' && !h.elegida) return 'administracion';
    if (h.esperandoA) return 'terceros';
    if (h.toca === 'nos') return 'administracion';
    if (h.toca === 'espera') return 'terceros';
    return esDeAdministracion(h.responsable, ajustes) ? 'administracion' : 'terceros';
  }

  function nombreVisible(idResponsable, ajustes, contexto) {
    if (!idResponsable) return '';
    if (PAPELES_CORTOS[idResponsable]) return PAPELES_CORTOS[idResponsable];
    if (typeof Hitos.resolverResponsable !== 'function') return idResponsable;
    var r = Hitos.resolverResponsable(idResponsable, Hitos.normalizarAjustes(ajustes), contexto);
    return (r && r.texto) || idResponsable;
  }

  /* Los hitos que cuentan para «Paso N de M»: los visibles, sin los
     «solo informativo», los «no aplica» ni los del tipo anterior. Fila
     154: es la única cuenta, la misma para la marca del asunto, la
     pestaña «Hitos N/M» y la tira y el «Hito N de M» de la mesa
     (`Hitos.numerados`; en la tira, un informativo sale sin número). */
  function contables(hitos) {
    return Hitos.visibles(hitos || []).filter(function (h) {
      return !h.soloInformativo && h.estado !== 'noaplica' && !h.delTipoAnterior;
    });
  }

  /* Función pura. El hito actual: SIEMPRE el primer hito visible sin
     terminar (ni hecho ni "no aplica"), saltando los "solo informativo"
     y las preguntas ya respondidas (fila 162, docs/ESTADO-SIGUE-A-LOS-
     HITOS.md: ya no «gana Administración» si hay otro en curso). Todos
     terminados: listo para archivar, Administración. Sin hitos: `lado:
     null`. «Esperando a…»: la puesta a mano en ese hito; si no hay, la
     del responsable del paso cuando no es de Administración (`auto`).
     Devuelve { lado, quien, hito, desde, titulo, n, m, esperando,
     listo, sinHitos }. */
  function aQuienLeToca(hitos, ajustes, contexto) {
    if (!hitos || !hitos.length) return { lado: null, quien: '', hito: null, sinHitos: true, esperando: null };
    var cuentan = contables(hitos);
    var abiertos = Hitos.visibles(hitos).filter(function (h) {
      if (h.estado === 'hecho' || h.estado === 'noaplica') return false;
      if (h.soloInformativo) return false;
      if (h.clase === 'decision' && h.elegida) return false;
      return true;
    });
    if (!abiertos.length) {
      return { lado: 'administracion', quien: '', hito: null, listo: true, n: cuentan.length, m: cuentan.length, esperando: null };
    }
    var h = abiertos[0];
    var lado = ladoDeHito(h, ajustes);
    var esperando = h.esperandoA
      ? { a: h.esperandoA, nombre: nombreVisible(h.esperandoA, ajustes, contexto),
          desde: h.esperandoDesde || '', motivo: h.esperandoMotivo || '' }
      : esperaAutomatica(h, ajustes, contexto);
    return {
      lado: lado,
      quien: lado === 'terceros' ? nombreVisible(esperaDeHito(h), ajustes, contexto) : '',
      hito: h.id,
      desde: h.esperandoA ? (h.esperandoDesde || '') : (h.desde || ''),
      titulo: h.titulo || '',
      n: cuentan.indexOf(h) + 1,
      m: cuentan.length,
      esperando: esperando
    };
  }

  /* Fila 162: «Esperando a <responsable>» sale solo cuando el paso es de
     alguien que no es de Administración (y no es una pregunta ni un
     paso marcado «Nos toca»). No se guarda: es el paso. */
  function esperaAutomatica(h, ajustes, contexto) {
    if (!h.responsable || h.clase === 'decision' || h.toca === 'nos') return null;
    if (esDeAdministracion(h.responsable, ajustes)) return null;
    return { a: h.responsable, nombre: nombreVisible(h.responsable, ajustes, contexto),
             desde: h.desde || '', motivo: 'Es el responsable de este paso', auto: true };
  }

  /* Fila 162: la espera puesta a mano vale solo mientras su hito sea el
     actual. Función pura, sobre los datos de hitos.json: la quita de
     cualquier otro hito. La llama Hitos.cambiar antes de guardar. */
  function limpiarEsperasViejas(datos) {
    Object.keys((datos && datos.porAsunto) || {}).forEach(function (k) {
      var entrada = datos.porAsunto[k];
      if (!entrada || !entrada.hitos) return;
      var actual = aQuienLeToca(entrada.hitos, datos.ajustes).hito;
      (function recorrer(lista) {
        (lista || []).forEach(function (x) {
          if (x.esperandoA && x.id !== actual) quitarEspera(x);
          if (x.clase === 'decision') (x.opciones || []).forEach(function (o) { recorrer(o.hitos); });
        });
      })(entrada.hitos);
    });
    return datos;
  }

  /* Función pura. El texto del estado: «Paso N de M · título», «Listo
     para archivar» o «Sin hitos». */
  function textoDelEstado(r) {
    if (!r || r.sinHitos) return 'Sin hitos';
    if (r.listo) return 'Listo para archivar';
    return 'Paso ' + (r.n || 1) + ' de ' + Math.max(r.m || 0, r.n || 1) + (r.titulo ? ' · ' + r.titulo : '');
  }

  /* Función pura. El montón de un asunto: por su hito actual; sin
     hitos, Administración (fila 129: el estado manual ya no se lee). */
  function ladoDelAsunto(hitos, ajustes, contexto) {
    var r = aQuienLeToca(hitos, ajustes, contexto);
    if (!r.lado) r.lado = 'administracion';
    r.texto = textoDelEstado(r);
    return r;
  }

  /* Para la lista: lo último leído de hitos.json, sin ir al disco. */
  function ladoDeAsunto(a) {
    var datos = Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto[a.nombre];
    return ladoDelAsunto(entrada ? entrada.hitos : [], datos ? datos.ajustes : null);
  }

  /* Función pura (punto 7, «Estamos en este paso»): da por hechos todos
     los hitos visibles anteriores a `idHito` que sigan sin terminar, con
     `nota` en su historial, y deja `idHito` en curso. Las preguntas se
     quedan como están (una sin responder corta la lista: lo que va
     detrás ni se ve). Devuelve cuántos se han dado por hechos, o -1 si
     el hito no está entre los visibles. */
  function situarLista(hitos, idHito, nota, quien) {
    var vis = Hitos.visibles(hitos);
    var pos = -1;
    vis.forEach(function (h, i) { if (h.id === idHito) pos = i; });
    if (pos === -1) return -1;
    var hoy = U.hoyIso();
    var n = 0;
    vis.slice(0, pos).forEach(function (h) {
      if (h.clase === 'decision') return;
      if (h.estado === 'hecho' || h.estado === 'noaplica') return;
      h.estado = 'hecho';
      h.hechoEl = hoy;
      h.notas.push({ texto: nota, quien: quien || '', cuando: U.ahora() });
      quitarEspera(h);
      n++;
    });
    var destino = vis[pos];
    if (destino.estado === 'pendiente') { destino.estado = 'encurso'; destino.desde = hoy; }
    return n;
  }

  function quitarEspera(h) {
    delete h.esperandoA; delete h.esperandoDesde; delete h.esperandoMotivo; delete h.esperandoFicheros;
  }

  /* Marca «Dado por hecho al situar el asunto (<fecha>, <quién>)». */
  async function situarEn(clave, idHito) {
    var quien = (window.App && App.E && App.E.usuario) || '';
    var hoy = U.hoyIso().split('-');
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var fecha = parseInt(hoy[2], 10) + '-' + meses[parseInt(hoy[1], 10) - 1] + '-' + hoy[0];
    var nota = 'Dado por hecho al situar el asunto (' + fecha + (quien ? ', ' + quien : '') + ')';
    var n = -1;
    var datos = await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (!entrada) return d;
      n = situarLista(entrada.hitos, idHito, nota, quien);
      return d;
    });
    var entrada = datos.porAsunto[clave];
    return { hechos: n, estado: ladoDelAsunto(entrada ? entrada.hitos : [], datos.ajustes) };
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
    textoDelEstado: textoDelEstado, nombreDeEspera: nombreVisible,
    situarLista: situarLista, situarEn: situarEn, quitarEspera: quitarEspera,
    marcarAdministracion: marcarAdministracion, numerados: contables,
    limpiarEsperasViejas: limpiarEsperasViejas
  });

  /* ---------- la lista, al día sin releer en cada repintado ----------

     Se relee hitos.json una vez al pintar la lista, y después por
     window.Gestor.alRefrescar solo si han pasado dos minutos (lo que
     haya tocado el otro ordenador). Lo que cambia este ordenador llega
     solo por Hitos.alCambiar. Solo se repinta si algún asunto cambia de
     montón, de "quién lo tiene" o de paso. */
  var firma = null;
  var leidoEl = 0;

  function firmaActual() {
    if (!window.App || !App.E || !App.E.listaAbiertos) return '';
    return App.E.listaAbiertos.map(function (a) {
      var l = ladoDeAsunto(a);
      return a.nombre + '|' + l.lado + '|' + l.quien + '|' + l.texto + '|' + (l.esperando ? l.esperando.desde : '');
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
