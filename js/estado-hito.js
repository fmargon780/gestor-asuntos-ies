/* ============================================================
   estado-hito.js — el estado del asunto, a la vista (fila 129,
   24-sep-2026, docs/EL-HITO-ES-EL-ESTADO.md).

   El estado del asunto es su hito actual (Hitos.estadoDelAsunto, que
   cuenta en js/hitos-a-quien.js). Aquí, lo que se ve y se pulsa:

     - La marca «Paso N de M · título» (o «Listo para archivar», o
       «Sin hitos») en la tarjeta de Asuntos abiertos y en la cabecera
       de la ficha. Pulsarla abre la mesa de ese hito. En el ARCHIVO,
       «Archivado · se quedó en: …» o «Archivado · terminado».
     - «Esperando a…» en la cabecera de la ficha: pone el asunto en
       Pendiente de terceros aunque su hito actual sea nuestro. Se
       guarda en el hito actual (`esperandoA`, `esperandoDesde`,
       `esperandoMotivo` y los ficheros que había, `esperandoFicheros`),
       por Hitos.cambiar, nunca en la ficha. Se quita al llegar un
       fichero nuevo a la carpeta del asunto, al marcar hecho ese hito
       (Hitos.marcar) o a mano con «Ya ha llegado».
     - «Estamos en este paso» (en la lista de hitos y en la mesa): da
       por hechos los anteriores sin terminar (Hitos.situarEn).
     - La guía mínima de un tipo sin guía: Tramitar (nos toca),
       Esperar respuesta (esperamos al tercero) y Archivar (nos toca).

   Se carga después de js/hitos-a-quien.js. No envuelve nada: la lista
   (js/asuntos-lista.js) y la ficha (js/ficha-asunto.js) lo llaman, y se
   entera de los cambios por Hitos.alCambiar y Hitos.alLeer.
   ============================================================ */
var EstadoHito = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t == null ? '' : String(t)); }

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* '2026-09-24…' → '24-sep'. */
  function fechaCorta(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3 || !MESES[parseInt(p[1], 10) - 1]) return '';
    return parseInt(p[2], 10) + '-' + MESES[parseInt(p[1], 10) - 1];
  }

  function estadoDe(a) {
    if (window.App && typeof App.ladoDe === 'function') return App.ladoDe(a);
    return Hitos.ladoDeAsunto(a);
  }

  /* ---------- los textos ---------- */

  function textoEsperando(e) {
    if (!e) return '';
    return 'Esperando a ' + e.nombre + (fechaCorta(e.desde) ? ' desde el ' + fechaCorta(e.desde) : '');
  }

  /* La ficha de un asunto del ARCHIVO (o la del índice). */
  function textoArchivado(ficha) {
    var f = ficha || {};
    if (f.terminado) return 'Archivado · terminado';
    if (f.seQuedoEn) return 'Archivado · se quedó en: ' + f.seQuedoEn;
    /* Archivado antes de la fila 129: su estado viejo, como dato histórico. */
    if (f.situacion) return 'Archivado · ' + f.situacion;
    return 'Archivado';
  }

  /* El estado de un asunto abierto por su nombre, con lo último leído
     de hitos.json (para quien no tiene el asunto entero a mano). */
  function textoDeNombre(nombre) {
    var datos = window.Hitos && Hitos.ultimosLeidos();
    var entrada = datos && datos.porAsunto[nombre];
    return Hitos.estadoDelAsunto(entrada ? entrada.hitos : [], datos ? datos.ajustes : null).texto;
  }

  /* ---------- la marca de la tarjeta y de la cabecera ---------- */

  function marcaHTML(a, modo, lado) {
    if (modo === 'archivado') {
      return '<span class="marca-hito marca-hito-archivado">' + esc(textoArchivado(a.ficha)) + '</span>';
    }
    if (modo !== 'abierto') return '';
    var l = lado || estadoDe(a);
    var clase = l.listo ? ' marca-hito-listo' : l.sinHitos ? ' marca-hito-sin'
      : (l.lado === 'terceros' ? ' marca-hito-terceros' : '');
    var texto = l.texto || Hitos.textoDelEstado(l);
    var html = l.hito
      ? '<button type="button" class="marca-hito' + clase + '" data-hito="' + esc(l.hito) +
        '" title="Abrir este hito">' + esc(texto) + '</button>'
      : '<span class="marca-hito' + clase + '">' + esc(texto) + '</span>';
    if (l.esperando) {
      html += '<span class="marca-esperando" title="' + esc(l.esperando.motivo || 'Puesto a mano con «Esperando a…»') + '">' +
        esc(textoEsperando(l.esperando)) + '</span>';
    }
    return html;
  }

  function engancharMarca(div, a, modo) {
    if (modo !== 'abierto') return;
    var b = div.querySelector('button.marca-hito[data-hito]');
    if (b) b.onclick = function (ev) { ev.stopPropagation(); abrirHito(a, b.dataset.hito); };
  }

  /* Abre la mesa de ese hito: en la ficha, si ya está abierta; si no,
     se abre la ficha y entra directa en la mesa (como "Qué me toca"). */
  function abrirHito(a, idHito) {
    if (window.App && App.fichaAbierta && App.fichaAbierta() === a.nombre && window.HitoMesa) {
      HitoMesa.abrir(a, idHito);
      return;
    }
    if (window.HitosPanel && HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(a.nombre, idHito);
    App.abrirFicha(a, 'abierto');
  }

  /* ---------- la cabecera de la ficha ---------- */

  var enFicha = null;   /* el asunto cuya cabecera está pintada */

  function pintarEnFicha(caja, a) {
    enFicha = a;
    var cont = document.createElement('div');
    cont.className = 'ficha-estado-hito';
    cont.id = 'ficha-estado-hito';
    caja.appendChild(cont);
    pintarCaja(cont, a);
    if (window.Hitos && !Hitos.ultimosLeidos()) Hitos.leer().catch(function () { /* se queda como está */ });
    revisarLlegadas([a], true);
  }

  function firmaDe(l) {
    return [l.texto, l.hito, l.lado, l.esperando ? l.esperando.a + l.esperando.desde : ''].join('|');
  }

  function pintarCaja(cont, a) {
    var l = estadoDe(a);
    cont.dataset.firma = firmaDe(l);
    cont.innerHTML = marcaHTML(a, 'abierto', l);
    engancharMarca(cont, a, 'abierto');
    if (l.esperando) {
      cont.appendChild(boton('Ya ha llegado', 'Quitar «Esperando a…»: el asunto vuelve a su montón', 'boton-ya-llegado',
        function (ev) { yaHaLlegado(a, ev.currentTarget); }));
    } else if (l.hito) {
      cont.appendChild(boton('Esperando a…', 'Dejar el asunto en Pendiente de terceros hasta que llegue algo',
        'boton-esperando', function (ev) { pedirEsperando(a, ev.currentTarget); }));
    }
  }

  function boton(texto, ayuda, clase, alPulsar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ' + clase;
    b.textContent = texto;
    b.title = ayuda;
    b.onclick = alPulsar;
    return b;
  }

  /* Tras cada lectura o escritura de hitos.json: solo la marca, y solo
     si ha cambiado (nada de repintar la ficha entera). */
  function refrescarFicha() {
    var cont = $('ficha-estado-hito');
    if (!cont || !enFicha || !App.fichaAbierta || App.fichaAbierta() !== enFicha.nombre) return;
    if (cont.querySelector('[data-guardando]')) return;
    if (firmaDe(estadoDe(enFicha)) === cont.dataset.firma) return;
    pintarCaja(cont, enFicha);
  }

  /* ---------- «Esperando a…» ---------- */

  function aQuienSePuedeEsperar(ajustes) {
    if (window.GuiasToca) return GuiasToca.aQuien((ajustes && ajustes.responsables) || []);
    return [{ id: 'tercero', nombre: 'Tercero' }, { id: 'tutor', nombre: 'Familia' }];
  }

  async function pedirEsperando(a, control) {
    var datos = await Hitos.leer();
    var entrada = datos.porAsunto[a.nombre];
    var l = Hitos.estadoDelAsunto(entrada ? entrada.hitos : [], datos.ajustes);
    if (!l.hito) { U.aviso('Este asunto no tiene ningún paso abierto que poner en espera.', 'ambar'); return; }
    var defecto = ((a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria)) === 'ALUMNADO' ? 'tutor' : 'tercero';
    var ok = await U.preguntar('Esperando a…',
      '<p class="explica">El asunto pasa a «Pendiente de terceros» aunque el paso «' + esc(l.titulo) +
      '» sea nuestro. Vuelve solo a su montón cuando llegue un documento nuevo a su carpeta, ' +
      'cuando se marque hecho este paso o con «Ya ha llegado».</p>' +
      '<label class="etiqueta">A quién esperamos</label>' +
      '<select id="esperando-a" class="campo">' + aQuienSePuedeEsperar(datos.ajustes).map(function (r) {
        return '<option value="' + esc(r.id) + '"' + (r.id === defecto ? ' selected' : '') + '>' + esc(r.nombre) + '</option>';
      }).join('') + '</select>' +
      '<label class="etiqueta">Motivo <span class="suave">(opcional)</span></label>' +
      '<input id="esperando-motivo" class="campo" placeholder="Por ejemplo: que traiga el impreso firmado">',
      'Poner en espera');
    if (!ok) return;
    var quien = $('esperando-a').value;
    var motivo = $('esperando-motivo').value.trim();
    try {
      await U.mientrasGuarda(control || null, function () { return ponerEsperando(a, quien, motivo); });
    } catch (e) {
      U.fallo('No he podido ponerlo en espera', e);
      return;
    }
    U.aviso('Asunto esperando a ' + Hitos.nombreDeEspera(quien, datos.ajustes) + '.', 'bueno');
    repintar();
  }

  /* Función pura: pone «Esperando a…» en el hito actual de `hitos` (y
     lo quita de cualquier otro). Devuelve ese hito, o null si no hay. */
  function ponerEsperaEn(hitos, ajustes, quien, motivo, ficheros, cuando) {
    var l = Hitos.aQuienLeToca(hitos, ajustes);
    var h = l.hito ? Hitos.buscar(hitos, l.hito) : null;
    if (!h) return null;
    quitarEsperaDeLista(hitos);
    h.esperandoA = String(quien || 'tercero');
    h.esperandoDesde = cuando || U.ahora();
    if (motivo) h.esperandoMotivo = String(motivo);
    h.esperandoFicheros = (ficheros || []).map(String);
    return h;
  }

  /* Función pura: quita «Esperando a…» de todos los hitos. Cuántos. */
  function quitarEsperaDeLista(hitos) {
    var n = 0;
    (function recorrer(lista) {
      (lista || []).forEach(function (h) {
        if (h.esperandoA) { Hitos.quitarEspera(h); n++; }
        if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { recorrer(o.hitos); });
      });
    })(hitos);
    return n;
  }

  async function ponerEsperando(a, quien, motivo) {
    var ficheros = await nombresDeLaCarpeta(a);
    var puesto = null;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[a.nombre];
      if (entrada) puesto = ponerEsperaEn(entrada.hitos, d.ajustes, quien, motivo, ficheros);
      return d;
    });
    if (!puesto) throw new Error('Este asunto no tiene ningún paso abierto que poner en espera.');
    return puesto;
  }

  async function quitarEsperando(clave) {
    var n = 0;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto[clave];
      if (entrada) n = quitarEsperaDeLista(entrada.hitos);
      return d;
    });
    return n;
  }

  async function yaHaLlegado(a, control) {
    try {
      await U.mientrasGuarda(control || null, function () { return quitarEsperando(a.nombre); });
    } catch (e) {
      U.fallo('No he podido quitar «Esperando a…»', e);
      return;
    }
    U.aviso('El asunto vuelve a su montón.', 'bueno');
    repintar();
  }

  function repintar() {
    try {
      if (typeof App.repintarAccionesFicha === 'function') App.repintarAccionesFicha();
      if (typeof App.pintarAbiertos === 'function') App.pintarAbiertos();
    } catch (e) { /* solo pintar */ }
  }

  /* ---------- se quita solo al llegar un documento ---------- */

  function esFicheroDelSistema(nombre) {
    return /^[._~]/.test(nombre) || /^desktop\.ini$/i.test(nombre) || /^thumbs\.db$/i.test(nombre);
  }

  async function nombresDeLaCarpeta(a) {
    if (!a || !a.handle) return [];
    try {
      return (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; })
        .filter(function (n) { return !esFicheroDelSistema(n); });
    } catch (e) { return []; }
  }

  /* Función pura: los ficheros de `ahora` que no estaban en `antes`. */
  function llegados(antes, ahora) {
    var habia = {};
    (antes || []).forEach(function (n) { habia[n] = true; });
    return (ahora || []).filter(function (n) { return !habia[n] && !esFicheroDelSistema(n); });
  }

  var revisadoEl = 0;
  var revisando = false;

  /* Mira la carpeta de los asuntos que están «Esperando a…» (solo esos):
     si ha llegado algún fichero que no estaba, se quita la espera. */
  async function revisarLlegadas(lista, yaMismo) {
    if (revisando || !window.Hitos || !Hitos.ultimosLeidos()) return;
    var ahora = Date.now();
    if (!yaMismo && ahora - revisadoEl < 60 * 1000) return;
    if (!yaMismo) revisadoEl = ahora;
    var datos = Hitos.ultimosLeidos();
    var pendientes = (lista || []).filter(function (a) {
      var entrada = datos.porAsunto[a && a.nombre];
      var l = entrada ? Hitos.aQuienLeToca(entrada.hitos, datos.ajustes) : null;
      if (!l || !l.esperando) return false;
      var h = Hitos.buscar(entrada.hitos, l.hito);
      return !!(h && Array.isArray(h.esperandoFicheros) && a.handle);
    });
    if (!pendientes.length) return;
    revisando = true;
    try {
      for (var i = 0; i < pendientes.length; i++) {
        var a = pendientes[i];
        var entrada = datos.porAsunto[a.nombre];
        var h = Hitos.buscar(entrada.hitos, Hitos.aQuienLeToca(entrada.hitos, datos.ajustes).hito);
        var nuevos = llegados(h.esperandoFicheros, await nombresDeLaCarpeta(a));
        if (!nuevos.length) continue;
        try { await quitarEsperando(a.nombre); } catch (e) { continue; }
        var texto = 'Ha llegado «' + nuevos[0] + '» a ' + a.nombre + ': ya no está «Esperando a…».';
        if (window.Navegacion && Navegacion.avisoConIr) Navegacion.avisoConIr(texto, 'bueno', a.nombre);
        else U.aviso(texto, 'bueno');
      }
    } finally {
      revisando = false;
    }
  }

  /* ---------- «Estamos en este paso» ---------- */

  /* Función pura: ¿hay algo antes de este hito que dar por hecho? */
  function puedeSituar(hitos, idHito) {
    var vis = Hitos.visibles(hitos || []);
    for (var i = 0; i < vis.length; i++) {
      if (vis[i].id === idHito) return i > 0 && vis.slice(0, i).some(function (h) {
        return h.clase !== 'decision' && h.estado !== 'hecho' && h.estado !== 'noaplica';
      });
    }
    return false;
  }

  function botonSituarHTML(clase) {
    return '<button type="button" class="boton ' + clase + '" title="Dar por hechos los pasos anteriores que sigan sin terminar">' +
      'Estamos en este paso</button>';
  }

  async function situar(a, idHito, control) {
    var ok = await U.preguntar('Estamos en este paso',
      '<p class="explica">Los pasos anteriores que sigan sin terminar se dan por hechos, con una nota en ' +
      'su historial. Las preguntas sin responder se quedan como están. No se borra nada: se puede ' +
      'deshacer hito a hito.</p>', 'Estamos aquí');
    if (!ok) return;
    var r;
    try {
      r = await U.mientrasGuarda(control || null, function () { return Hitos.situarEn(a.nombre, idHito); });
    } catch (e) {
      U.fallo('No he podido situar el asunto', e);
      return;
    }
    var l = r && r.estado;
    U.aviso(l && l.hito ? 'Asunto en el paso ' + l.n + ': ' + l.titulo + '.' : 'Asunto al día.', 'bueno');
    if (window.HitosPanel) HitosPanel.programarRepintado();
    repintar();
  }

  /* ---------- la guía mínima ---------- */

  function pasosMinimos() {
    return [
      { id: U.nuevoId('g'), titulo: 'Tramitar', toca: 'nos' },
      { id: U.nuevoId('g'), titulo: 'Esperar respuesta', toca: 'espera', tocaA: 'tercero' },
      { id: U.nuevoId('g'), titulo: 'Archivar', toca: 'nos' }
    ];
  }

  /* ¿Es la guía mínima tal cual se creó (nadie la ha tocado)? Una guía
     así cede siempre ante una de verdad (js/tipos-nombre.js, al juntar
     dos guías al renombrar un tipo). */
  function esGuiaMinima(pasos) {
    var titulos = ['Tramitar', 'Esperar respuesta', 'Archivar'];
    return Array.isArray(pasos) && pasos.length === 3 && pasos.every(function (p, i) {
      return p && p.titulo === titulos[i] && !(p.opciones && p.opciones.length) && !p.cuerpo &&
        !(p.guion && p.guion.length) && !(p.requisitos && p.requisitos.length) &&
        !(p.plantillasDocumento && p.plantillasDocumento.length) && !p.responsable;
    });
  }

  async function guiaMinima(tipo) {
    if (!tipo || !window.GuiasDelCentro || !GuiasDelCentro.asegurarGuia) return [];
    return GuiasDelCentro.asegurarGuia(tipo, pasosMinimos());
  }

  /* ---------- engancharse ---------- */

  if (window.Hitos) {
    Hitos.alCambiar.push(function () { refrescarFicha(); });
    if (Hitos.alLeer) Hitos.alLeer.push(function () { refrescarFicha(); });
  }

  function enganchar() {
    if (!window.Gestor || !window.Gestor.alRefrescar) return;
    window.Gestor.alRefrescar.push(function () {
      if (!window.Gestor.carpetaGestor() || !window.App || !App.E) return;
      revisarLlegadas(App.E.listaAbiertos || [], false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return {
    marcaHTML: marcaHTML, engancharMarca: engancharMarca, abrirHito: abrirHito,
    pintarEnFicha: pintarEnFicha, textoArchivado: textoArchivado, textoDeNombre: textoDeNombre,
    textoEsperando: textoEsperando, fechaCorta: fechaCorta,
    pedirEsperando: pedirEsperando, ponerEsperando: ponerEsperando, quitarEsperando: quitarEsperando,
    ponerEsperaEn: ponerEsperaEn, quitarEsperaDeLista: quitarEsperaDeLista, llegados: llegados,
    revisarLlegadas: revisarLlegadas, aQuienSePuedeEsperar: aQuienSePuedeEsperar,
    puedeSituar: puedeSituar, botonSituarHTML: botonSituarHTML, situar: situar,
    pasosMinimos: pasosMinimos, guiaMinima: guiaMinima, esGuiaMinima: esGuiaMinima
  };
})();
window.EstadoHito = EstadoHito;
