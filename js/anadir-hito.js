/* ============================================================
   anadir-hito.js — «+ Añadir hito», paso a paso (fila 660,
   docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md; pantalla de prueba docs/pantallas/650.html).
   Sustituye a «Crear un hito» y a «Elegir un hito» (la ventana de la lista común).

   1. Solo las fases, en botones (las de js/fases.js: las fijas y las del centro; las nuevas se crean en
      Ajustes → El centro → «Fases», nunca aquí).
   2. Elegida una, queda en una línea («Fase: … · Cambiar») y salen solo los hitos comunes de esa fase, cada
      uno con sus tareas a la vista y «Añadir este». «+ Hito nuevo de esta fase» pasa al paso 3.
   3. Solo el formulario: el nombre (propone el de la fase) y su primera tarea (js/anadir-tarea.js), con
      «Ver los hitos de esta fase (n)» para volver. El hito nuevo nace con su primera tarea.
   - Si el hito ya está en este asunto: «Ya está en este asunto» y «¿Lo añades otra vez?» («Añadirlo otra vez», «Cancelar»).
   - Si el hito nuevo es igual o parecido a uno común de esa fase (mismo nombre o mismas tareas): aviso con «Usar ese».
   - «Va detrás de» elige dónde entra (por defecto, al final).
   - A dónde va lo que se añade lo dice la marca de la guía (js/marca-guia.js), y el pie de la ventana lo dice:
     encendida, a este asunto y a la guía del tipo (y el hito nuevo, a la lista común, con su fase); apagada, solo aquí.
   ============================================================ */
var AnadirHito = (function () {

  var abierta = null;
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function N() { return window.HitosDesdeElAsuntoNucleo; }
  function tipoDe(a) { return DondeSeGuarda.tipoDe(a); }
  function repintar() { if (window.HitosPanel) HitosPanel.programarRepintado(); }

  function cerrar() {
    if (!abierta) return;
    var c = abierta;
    abierta = null;
    document.removeEventListener('keydown', c.tecla, true);
    if (c.capa.parentNode) c.capa.parentNode.removeChild(c.capa);
    if (c.alCerrar) { try { c.alCerrar(); } catch (e) { /* quien llama no puede romper el cierre */ } }   /* fila 661 */
  }

  function etiquetaDe(t) {
    var d = Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(t));
    return Comunes.textoDeHace(t.accion || '') + (d ? ' · ' + d : '');
  }

  /* ---------- meter el hito en el asunto (y, con la marca encendida, en la guía) ---------- */

  /* `hc`: { nombre, explicacion, responsable? }; `tareas`: las tareas (de la lista común o nuevas, con `id`; las nuevas, `suelta: true`). */
  async function meter(a, hc, tareas, idAncla) {
    var tipo = tipoDe(a), nucleo = N(), G = window.HitosDesdeElAsuntoGuia;
    var nivel = nucleo.nivelSuperior(await Hitos.hitosDe(a.nombre));
    var sinHitos = !nivel.length;
    if (window.MarcaGuia && MarcaGuia.enGuia(a)) {
      var idPasoAncla = nucleo.pasoAnclaDeHito(nivel, idAncla);
      var antes = await G.instantanea(tipo, a.nombre);
      var pasos = copia(GuiasDelCentro.pasosDe(tipo));
      var hito = Object.assign({ id: 'tmp-h' }, hc, { tareas: tareas.map(function (t) { return t.id; }) });
      var paso = Comunes.pasoDeHito(hito, tareas);
      if (!hc.id) delete paso.comun;                     /* un hito que no está en la lista común no lleva su marca */
      paso.guion.forEach(function (g, i) { if (tareas[i] && tareas[i].suelta) delete g.comun; });
      nucleo.colocarTrasAncla(pasos, paso, idPasoAncla);
      await GuiasDelCentro.guardarPasos(tipo, pasos, { claveActual: a.nombre });
      if (sinHitos && Hitos.crearDesdeGuia) await Hitos.crearDesdeGuia(a.nombre, tipo);   /* un asunto sin hitos no recibe los de la guía solo */
      await nucleo.avisarGuia(tipo, a, antes, nucleo.repartoDe(), function () { return G.desenlazar(a.nombre, paso.id); });
    } else {
      var nuevo = Hitos.normalizarHito({ titulo: hc.nombre, cuerpo: hc.explicacion || '', clase: 'paso', estado: 'pendiente', responsable: hc.responsable || '' });
      nuevo.guionPropio = tareas.map(function (t) {
        var g = Comunes.lineaDeTarea(t);
        delete g.comun;
        g.id = U.nuevoId('gp');
        return g;
      });
      var resultado = null;
      await Hitos.cambiar(function (d) {
        var entrada = d.porAsunto[a.nombre] || { creados: U.hoyIso(), hitos: [] };
        nucleo.colocarTrasAncla(entrada.hitos, nuevo, idAncla);
        resultado = Hitos.recomputeEnCurso(entrada.hitos);
        d.porAsunto[a.nombre] = entrada;
        return d;
      });
      if (resultado) await Hitos.aplicarEstadoDelHito(a.nombre, resultado);
      U.aviso('Hito «' + hc.nombre + '» añadido solo a este asunto.', 'bueno');
    }
    repintar();
  }

  /* ---------- la ventana ---------- */

  /* `alCerrar` (fila 661, opcional): se llama al cerrarse la ventana, se haya añadido un hito o se haya cancelado (el cuadro de
     la bandeja mira entonces si hay un hito nuevo). */
  async function abrir(a, idAnclaPorDefecto, alCerrar) {
    cerrar();
    try { await Fases.cargar(); } catch (e) { /* con las fijas */ }
    try { await SitiosGuardado.cargar(); } catch (e2) { /* con los de partida */ }
    if (window.Plantillas && Plantillas.cargarReciente && window.App && App.E && App.E.gestor) { try { await Plantillas.cargarReciente(App.E.gestor); } catch (e3) { /* sin plantillas */ } }
    var listas, nivel;
    try {
      listas = await ComunesGuardado.leer();
      nivel = N().nivelSuperior(await Hitos.hitosDe(a.nombre));
    } catch (e4) { U.fallo('No he podido leer los hitos', e4); return; }
    var tipo = tipoDe(a);
    var st = { paso: 'fase', f: '', detras: idAnclaPorDefecto !== undefined ? idAnclaPorDefecto : (nivel.length ? nivel[nivel.length - 1].id : ''), aviso: '' };

    var capa = document.createElement('div');
    capa.className = 'capa capa-campos anadir-hito-capa';
    capa.innerHTML = '<div class="cuadro cuadro-campos" role="dialog" aria-modal="true" aria-label="Añadir hito"></div>';
    document.body.appendChild(capa);
    var cuadro = capa.firstChild;
    function tecla(ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); cerrar(); } }
    document.addEventListener('keydown', tecla, true);
    abierta = { capa: capa, tecla: tecla, alCerrar: alCerrar };

    function hitosDeLaFase() { return listas.hitos.filter(function (h) { return h.fase === st.f; }); }
    function tareasDe(hc) { return (hc.tareas || []).map(function (id) { return Comunes.buscar(listas.tareas, id); }).filter(Boolean); }
    function yaEsta(nombre) { return nivel.some(function (x) { return norm(x.titulo || '') === norm(nombre); }); }
    function detrasHTML() {
      if (!nivel.length) return '';
      var numerados = Hitos.numerados ? Hitos.numerados(nivel) : nivel;
      return '<span class="campos-elegir-para"><label class="suave pequeno" for="ah-detras">Va detrás de</label> <select id="ah-detras" class="campo">' +
        '<option value=""' + (st.detras === '' ? ' selected' : '') + '>Al principio</option>' +
        nivel.map(function (x, i) {
          var n = numerados.indexOf(x) + 1;
          return '<option value="' + esc(x.id) + '"' + (x.id === st.detras ? ' selected' : '') + '>' + (n ? n + '. ' : '') + esc(x.titulo || 'Hito') + (i === nivel.length - 1 ? ' (al final)' : '') + '</option>';
        }).join('') + '</select></span>';
    }

    function hecho() { cerrar(); }
    async function meterYCerrar(hc, tareas) {
      try { await meter(a, hc, tareas, st.detras); hecho(); }
      catch (e) { U.fallo('No he podido añadir el hito', e); }
    }
    /* Un hito de la lista que ya está en el asunto: avisa y deja añadirlo otra vez (a veces hace falta, por ejemplo dos esperas). */
    function meterSiNoEsta(hc, tareas, hueco) {
      if (!yaEsta(hc.nombre) || !hueco) { meterYCerrar(hc, tareas); return; }
      hueco.innerHTML = '<div class="aviso aviso-ambar">«' + esc(hc.nombre) + '» ya está en este asunto. ¿Lo añades otra vez?' +
        '<div class="botones"><button type="button" class="boton boton-chico boton-principal" data-x="otra">Añadirlo otra vez</button> ' +
        '<button type="button" class="boton boton-chico" data-x="no">Cancelar</button></div></div>';
      hueco.querySelector('[data-x="otra"]').onclick = function () { meterYCerrar(hc, tareas); };
      hueco.querySelector('[data-x="no"]').onclick = function () { hueco.innerHTML = ''; };
    }

    function pintar() {
      var cuerpo;
      if (st.paso === 'fase') {
        cuerpo = '<div class="paso-tit"><strong>¿En qué fase?</strong></div><div class="ah-fases">' + Fases.todas().map(function (f) {
          return '<button type="button" class="boton ah-fase" data-f="' + esc(f.id) + '">' + esc(f.nombre) + '</button>';
        }).join(' ') + '</div>';
      } else {
        var l = hitosDeLaFase();
        cuerpo = '<div class="ah-elegida">Fase: <b>' + esc(Fases.texto(st.f)) + '</b> <button type="button" class="enlace" id="ah-cambiar-fase">Cambiar</button>' +
          (st.paso === 'nuevo' ? ' · Hito nuevo <button type="button" class="enlace" id="ah-volver">Ver los hitos de esta fase (' + l.length + ')</button>' : '') + '</div>';
        if (st.paso === 'hitos') {
          cuerpo += '<div class="paso-tit"><strong>Hitos de esta fase, con sus tareas</strong></div>' + (l.length ? l.map(function (hc, k) {
            var ts = tareasDe(hc);
            return '<div class="ah-hito"><div class="ah-hito-cuerpo"><b>' + esc(hc.nombre) + '</b>' +
              (ts.length ? '<ul>' + ts.map(function (t) { return '<li>' + esc(t.nombre) + ' <span class="suave">' + esc(etiquetaDe(t)) + '</span></li>'; }).join('') + '</ul>' : '<div class="suave">Sin tareas.</div>') +
              (yaEsta(hc.nombre) ? '<div><span class="marca-solo-aqui">Ya está en este asunto</span></div>' : '') + '<div data-aviso="' + k + '"></div></div>' +
              '<button type="button" class="boton boton-chico" data-usar="' + k + '">Añadir este</button></div>';
          }).join('') : '<p class="suave">Ningún hito de esta fase todavía.</p>') +
            '<p><button type="button" class="boton" id="ah-nuevo">+ Hito nuevo de esta fase</button></p>';
        } else cuerpo += '<div id="ah-hueco-nuevo"></div>';
      }
      cuadro.innerHTML = '<div class="campos-elegir-cab"><div class="campos-elegir-titulo"><h3>Añadir hito</h3>' +
        '<button type="button" class="boton" id="ah-cerrar" style="margin-left:auto">Cerrar</button></div></div>' +
        '<div class="campos-elegir-cuerpo" style="grid-template-columns:minmax(0,1fr)"><div class="campos-elegir-centro" id="ah-centro">' + cuerpo + '</div></div>' +
        '<div class="campos-elegir-pie">' + detrasHTML() + '<span class="suave ah-alcance">' + esc(window.MarcaGuia ? MarcaGuia.alcance(a) : '') + '</span></div>';
      cuadro.querySelector('#ah-cerrar').onclick = cerrar;
      var detras = cuadro.querySelector('#ah-detras');
      if (detras) detras.onchange = function () { st.detras = detras.value; };
      Array.prototype.forEach.call(cuadro.querySelectorAll('.ah-fase'), function (b) { b.onclick = function () { st.f = b.dataset.f; st.paso = 'hitos'; pintar(); }; });
      var x = cuadro.querySelector('#ah-cambiar-fase'); if (x) x.onclick = function () { st.paso = 'fase'; pintar(); };
      x = cuadro.querySelector('#ah-volver'); if (x) x.onclick = function () { st.paso = 'hitos'; pintar(); };
      x = cuadro.querySelector('#ah-nuevo'); if (x) x.onclick = function () { st.paso = 'nuevo'; pintar(); };
      Array.prototype.forEach.call(cuadro.querySelectorAll('[data-usar]'), function (b) {
        b.onclick = function () {
          var hc = hitosDeLaFase()[+b.dataset.usar];
          meterSiNoEsta(hc, tareasDe(hc), cuadro.querySelector('[data-aviso="' + b.dataset.usar + '"]'));
        };
      });
      if (st.paso === 'nuevo') hitoNuevo(hitosDeLaFase());
    }

    /* El formulario del hito nuevo: su nombre y su primera tarea. */
    function hitoNuevo(delaFase) {
      var hueco = cuadro.querySelector('#ah-hueco-nuevo');
      hueco.innerHTML = '<div class="at-form"><label class="dato"><span class="etiqueta">Nombre del hito</span><input type="text" class="campo" id="ah-nombre" value="' + esc(st.nombre != null ? st.nombre : Fases.texto(st.f)) + '" autocomplete="off"></label>' +
        '<div class="paso-tit"><strong>Su primera tarea</strong></div><div id="ah-tarea"></div><div id="ah-aviso"></div>' +
        '<p><button type="button" class="boton boton-principal" id="ah-crear" disabled>Crear el hito</button></p></div>';
      var tarea = null, usada = null;
      var ctl = AnadirTarea.montar(hueco.querySelector('#ah-tarea'), { modo: 'nueva', comunes: listas.tareas, inicial: st.tarea,
        alCambiar: function (r) { st.tarea = r; hueco.querySelector('#ah-crear').disabled = !(r && r.elegida && r.nombre); },
        alUsar: function (t) { usada = t; crear(false); },
        alAnadir: function () { crear(false); } });
      hueco.querySelector('#ah-nombre').oninput = function () { st.nombre = this.value; };
      hueco.querySelector('#ah-crear').onclick = function () { usada = null; crear(false); };

      async function crear(forzar) {
        var nombre = (hueco.querySelector('#ah-nombre').value || '').trim() || Fases.texto(st.f);
        tarea = usada || ctl.resultado();
        if (!tarea) return;
        var tareaNombre = usada ? usada.nombre : tarea.nombre;
        /* Hito igual: misma fase y el mismo nombre o la misma tarea como única tarea. */
        var gemelo = delaFase.filter(function (h) {
          return norm(h.nombre) === norm(nombre) || (usada && h.tareas.length === 1 && h.tareas[0] === usada.id) ||
            (h.tareas.length === 1 && norm((Comunes.buscar(listas.tareas, h.tareas[0]) || {}).nombre || '') === norm(tareaNombre));
        })[0];
        var aviso = hueco.querySelector('#ah-aviso');
        if (gemelo && !forzar) {
          aviso.innerHTML = '<div class="aviso aviso-ambar">Ya hay un hito igual o parecido en esta fase: <b>«' + esc(gemelo.nombre) + '»</b>.' +
            '<div class="botones"><button type="button" class="boton boton-chico boton-principal" id="ah-usar-ese">Usar ese</button> ' +
            '<button type="button" class="boton boton-chico" id="ah-igual">Crear el mío igualmente</button></div></div>';
          aviso.querySelector('#ah-usar-ese').onclick = function () { meterSiNoEsta(gemelo, tareasDe(gemelo), aviso); };
          aviso.querySelector('#ah-igual').onclick = function () { crear(true); };
          return;
        }
        try {
          var enGuia = window.MarcaGuia && MarcaGuia.enGuia(a), t = usada;
          if (!t) {
            t = { id: 'tmp-t1', nombre: tarea.nombre, accion: tarea.accion, receta: tarea.receta, donde: tarea.donde || undefined, tipoDocumento: tarea.tipoDocumento, aQuien: tarea.aQuien, suelta: true };
            if (enGuia) {   /* con la marca encendida, la tarea y el hito entran también en la lista común, para que otros los encuentren */
              try { t = Object.assign({}, await ComunesGuardado.anadir('tareas', t)); } catch (e) { /* ya hay una con ese nombre: queda suelta */ }
            }
          }
          var hc = { nombre: nombre, explicacion: '', fase: st.f };
          if (enGuia) {
            try {
              var guardado = await ComunesGuardado.anadir('hitos', Object.assign({}, hc, { tareas: t.suelta ? [] : [t.id] }));
              hc.id = guardado.id;
            } catch (e2) { /* nombre repetido en la lista: el hito entra en la guía sin su marca de común */ }
          }
          await meterYCerrar(hc, [t]);
        } catch (e3) { U.fallo('No he podido crear el hito', e3); }
      }
    }

    pintar();
    var primero = cuadro.querySelector('.ah-fase');
    if (primero) primero.focus();
  }

  return { abrir: abrir, cerrar: cerrar };
})();
window.AnadirHito = AnadirHito;
