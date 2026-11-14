/* ============================================================
   anadir-tarea.js — el formulario de una tarea: «+ Añadir tarea» y «Cambiar…»
   (fila 660, docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md; pantalla de prueba docs/pantallas/650.html).
   Es el mismo formulario cuando se añade una tarea a un hito, cuando se cambia una y cuando se escribe la
   primera tarea de un hito nuevo (js/anadir-hito.js).

   1. «Qué se hace» es una casilla que se busca escribiendo, también por el sitio: al escribir «correo»
      sale «Enviar · Correo electrónico», y al elegirlo se rellenan el qué y el dónde. Salen las parejas de
      acción y sitio que ya usan las tareas comunes del centro, más cada acción con el sitio que propone.
   2. Después, «sobre qué» según la acción: plantilla (Generar documento y Enviar), «Qué documento»
      (Registrar, Poner a la firma, Añadir documento) o «A quién» (Llamar), y «Dónde se hace»
      (js/donde-campo.js). «Generar documento» puede quedarse en «Sin plantilla por ahora (se marca a mano)».
   3. Salen las tareas comunes que hacen lo mismo (misma acción, sobre lo mismo y en el mismo sitio), se
      llamen como se llamen, con «Añadir esta».
   4. La app propone el nombre; se puede cambiar.
   5. Si la nueva es igual o parecida a una común, avisa con «Usar esa» y «Crear la mía igualmente».
      Sin «sobre qué» se compara por el nombre y el sitio.

   `montar(hueco, op)`: op = { modo: 'nueva' | 'cambiar', inicial, comunes, botones, alCambiar(res), alUsar(tarea),
   alAnadir(res), alCancelar() }. Devuelve { resultado(), listo(), intentar() }.
   `resultado()`: { nombre, accion, receta, donde, tipoDocumento, aQuien } (o null si falta lo mínimo).
   ============================================================ */
var AnadirTarea = (function () {

  var contador = 0;
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function norm(t) { return U.normalizar(String(t || '')).replace(/\b(el|la|los|las|de|del|al|a|en|un|una)\b/g, ' ').replace(/\s+/g, ' ').trim(); }

  function textoDe(accion) { return Comunes.textoDeHace(accion || ''); }
  function acciones() { return Comunes.HACE.filter(function (h) { return h.valor !== 'copiar'; }); }   /* «Copiar a otra carpeta» solo se crea en la lista común */

  /* Las entradas de la casilla «Qué se hace»: { texto, accion, donde } (donde: { sitio, zona? } o null). */
  function entradas(comunes) {
    var vistas = {}, lista = [], d = Sitios.datos();
    function poner(accion, donde) {
      var t = textoDe(accion) + (donde ? ' · ' + Sitios.textoDe(d, donde) : '');
      if (vistas[t] || (donde && !Sitios.textoDe(d, donde))) return;
      vistas[t] = true;
      lista.push({ texto: t, accion: accion, donde: donde });
    }
    acciones().forEach(function (h) { poner(h.valor, Sitios.propuesto(d, h.valor)); });
    (comunes || []).forEach(function (t) { if (t.accion !== 'copiar') poner(t.accion || '', Sitios.dondeDe(t)); });
    return lista;
  }

  function plantillasDe(accion) {
    var d = window.Plantillas && Plantillas.enMemoria ? Plantillas.enMemoria() : null;
    var l = d ? (accion === 'comunicar' ? d.lista : d.documentos) || [] : [];
    return l.filter(function (p) { return !window.Plantillas || Plantillas.enUso(p); });
  }
  function conPlantilla(accion) { return accion === 'generar' || accion === 'comunicar'; }

  function sobreHTML(accion, receta) {
    /* Lo que ya traía la tarea de siempre: «Entrada o salida» de Registrar y «Firmas necesarias» de Poner a la firma. */
    if ((accion === 'registrar' || accion === 'firmar') && window.GuiasGuion) return GuiasGuion.recetaHTML({ accion: accion, receta: receta || null }, false);
    if (!conPlantilla(accion)) return '';
    var actual = (receta && receta.plantilla) || '';
    return '<label class="dato"><span class="etiqueta">' + (accion === 'generar' ? 'Con qué plantilla' : 'Con qué plantilla de correo') + '</span>' +
      '<select class="campo at-plantilla"><option value="">' + (accion === 'generar' ? 'Sin plantilla por ahora (se marca a mano)' : 'Sin plantilla fija') + '</option>' +
      plantillasDe(accion).map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === actual ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select></label>';
  }

  /* La receta de la tarea: lo que ya traía (`base`: «a», la vía de antes, los campos…) con lo elegido ahora encima. `caja`: el hueco del formulario. */
  function recetaDe(accion, base, caja) {
    function v(c) { var e = caja && caja.querySelector(c); return e ? e.value : undefined; }
    var r = Object.assign({}, base || {}), pl = v('.at-plantilla');
    if (accion === 'generar') { r.plantilla = pl || ''; r.sinPlantilla = pl ? '' : true; }
    else if (accion === 'comunicar') r.plantilla = pl !== undefined ? pl : (r.plantilla || '');
    else if (accion === 'registrar') { var s = v('.guion-receta-sentido'); if (s !== undefined) r.sentido = s; }
    else if (accion === 'firmar') { var f = v('.guion-receta-firmas'); if (f !== undefined) r.firmas = f === '1' ? '' : f; }
    return window.GuiasGuion ? GuiasGuion.normalizarReceta(accion, r) : null;
  }

  function nombrePlantilla(accion, id) {
    var p = plantillasDe(accion).filter(function (x) { return x.id === id; })[0];
    return p ? p.nombre : '';
  }

  /* El nombre que propone la app. */
  function proponer(r) {
    var doc = (r.tipoDocumento || '').toLowerCase(), pl = nombrePlantilla(r.accion, r.receta && r.receta.plantilla);
    var papel = r.aQuien && window.GuiasToca ? GuiasToca.nombreDe(r.aQuien, []) : '';
    switch (r.accion) {
      case 'generar': return pl ? 'Generar: ' + pl : 'Generar el documento';
      case 'registrar': return 'Registrar ' + (doc || 'el documento');
      case 'anadir': return 'Añadir ' + (doc || 'el documento') + ' al asunto';
      case 'firmar': return 'Poner a la firma ' + (doc || 'el documento');
      case 'comunicar': return pl ? 'Enviar: ' + pl.charAt(0).toLowerCase() + pl.slice(1) : 'Enviar';
      case 'llamar': return papel ? 'Llamar: ' + papel.toLowerCase() : 'Llamar';
      case '': return '';
      default: return textoDe(r.accion);
    }
  }

  /* «Hace lo mismo»: misma acción, mismo sitio y, si la acción tiene «sobre qué», lo mismo sobre ello. */
  function mismoSobre(accion, t, r) {
    if (conPlantilla(accion)) return ((t.receta && t.receta.plantilla) || '') === ((r.receta && r.receta.plantilla) || '');
    if (Sitios.usaDocumento(accion)) return (t.tipoDocumento || '') === (r.tipoDocumento || '');
    if (Sitios.usaAQuien(accion)) return (t.aQuien || '') === (r.aQuien || '');
    return true;
  }
  function haceLoMismo(comunes, r) {
    var tiene = conPlantilla(r.accion) || Sitios.usaDocumento(r.accion) || Sitios.usaAQuien(r.accion);
    return (comunes || []).filter(function (t) {
      return (t.accion || '') === r.accion && Sitios.igualDonde(Sitios.dondeDe(t), r.donde) && mismoSobre(r.accion, t, r) &&
        (tiene || !r.nombre || norm(t.nombre) === norm(r.nombre) || Comunes.parecidas(r.nombre, [t], 1).length > 0);
    });
  }

  /* Una común igual o parecida a lo que se va a crear: el mismo nombre o la que hace lo mismo. */
  function parecida(comunes, r) {
    var n = norm(r.nombre);
    return (comunes || []).filter(function (t) { return norm(t.nombre) === n; })[0] || haceLoMismo(comunes, r)[0] || null;
  }

  function montar(hueco, op) {
    op = op || {};
    var n = ++contador, comunes = op.comunes || [], nueva = op.modo !== 'cambiar';
    var ini = op.inicial || {};
    var st = { elegida: ini.elegida !== undefined ? !!ini.elegida : (ini.accion !== undefined), accion: ini.accion || '', receta: ini.receta || null, donde: ini.donde || null,
      tipoDocumento: ini.tipoDocumento || '', aQuien: ini.aQuien || '', nombre: ini.nombre || '', tocado: ini.tocado !== undefined ? !!ini.tocado : !!ini.nombre, comun: null };
    var lista = entradas(comunes);
    var textoInicial = st.elegida ? (textoDe(st.accion) + (Sitios.dondeDe(st) ? ' · ' + Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(st)) : '')) : '';

    hueco.innerHTML = '<div class="at-form">' +
      '<label class="dato"><span class="etiqueta">Qué se hace</span><input type="text" class="campo at-que" data-clave="at-que" list="at-que-' + n + '" value="' + esc(textoInicial) + '" ' +
        'placeholder="Escribe qué o dónde: «correo», «llamar»…" autocomplete="off"></label>' +
      '<datalist id="at-que-' + n + '">' + lista.map(function (e) { return '<option value="' + esc(e.texto) + '"></option>'; }).join('') + '</datalist>' +
      '<div class="at-sobre"></div><div class="at-donde"></div>' +
      (nueva ? '<div class="at-comunes"></div><label class="dato at-nombre-fila"><span class="etiqueta">Nombre de la tarea (te lo propone la app; puedes cambiarlo)</span>' +
        '<input type="text" class="campo at-nombre" data-clave="at-nombre" autocomplete="off"></label><div class="at-aviso"></div>' : '') +
      (op.botones ? '<div class="tcd-botones"><button type="button" class="boton boton-chico boton-principal at-anadir" disabled>Añadir</button>' +
        '<button type="button" class="boton boton-chico at-cancelar">Cancelar</button></div>' : '') +
      '</div>';
    function q(c) { return hueco.querySelector(c); }

    function leerDelDom() {
      var d = window.DondeCampo ? DondeCampo.leer(q('.at-donde')) : {};
      st.donde = d.donde || null; st.tipoDocumento = d.tipoDocumento || ''; st.aQuien = d.aQuien || '';
      st.receta = st.elegida ? recetaDe(st.accion, st.receta, q('.at-sobre')) : null;
    }
    function resultado() {
      if (!st.elegida) return null;
      var r = { accion: st.accion, receta: st.receta, donde: st.donde, tipoDocumento: st.tipoDocumento, aQuien: st.aQuien };
      if (nueva) r.nombre = st.nombre.trim();
      return r;
    }
    function listo() { var r = resultado(); return !!r && (!nueva || !!r.nombre); }

    function pintarComunes() {
      var c = q('.at-comunes');
      if (!c) return;
      if (!st.elegida) { c.innerHTML = ''; return; }
      var l = haceLoMismo(comunes, resultado());
      c.innerHTML = '<div class="at-comunes-titulo">' + (l.length ? 'Tareas que ya hacen esto (' + l.length + '), se llamen como se llamen:' : 'Ninguna tarea hace esto todavía: crea la tuya abajo.') + '</div>' +
        l.map(function (t, k) {
          var d = Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(t));
          return '<div class="at-comun"><span class="at-comun-nombre">' + esc(t.nombre) + '</span><span class="suave"> ' + esc(textoDe(t.accion) + (d ? ' · ' + d : '')) + '</span> ' +
            '<button type="button" class="boton boton-chico" data-usar="' + k + '">Añadir esta</button></div>';
        }).join('');
      Array.prototype.forEach.call(c.querySelectorAll('[data-usar]'), function (b) {
        b.onclick = function () { if (op.alUsar) op.alUsar(l[+b.dataset.usar]); };
      });
    }

    function refrescar(desdeNombre) {
      leerDelDom();
      var nom = q('.at-nombre');
      if (nom && !st.tocado && !desdeNombre) { st.nombre = proponer(Object.assign({ accion: st.accion }, st)); nom.value = st.nombre; }
      if (q('.at-aviso') && !desdeNombre) q('.at-aviso').innerHTML = '';
      pintarComunes();
      var b = q('.at-anadir');
      if (b) b.disabled = !listo();
      if (op.alCambiar) op.alCambiar(Object.assign({}, resultado() || {}, { elegida: st.elegida, nombre: st.nombre, tocado: st.tocado }));
    }

    function pintarSobre() {
      q('.at-sobre').innerHTML = st.elegida ? sobreHTML(st.accion, st.receta) : '';
      q('.at-donde').innerHTML = st.elegida && window.DondeCampo ? DondeCampo.html({ accion: st.accion, donde: st.donde, receta: st.receta, tipoDocumento: st.tipoDocumento, aQuien: st.aQuien }) : '';
      q('.at-sobre').onchange = function () { refrescar(false); };
      if (window.DondeCampo && st.elegida) DondeCampo.enganchar(q('.at-donde'), function () { refrescar(false); });
    }

    var que = q('.at-que');
    que.onfocus = function () { this.select(); };
    que.addEventListener('input', function () {
      var e = lista.filter(function (x) { return x.texto === que.value; })[0];
      if (!e) return;   /* mientras se escribe, no se hace nada: se elige de la lista */
      var misma = st.elegida && st.accion === e.accion;
      st.elegida = true; st.accion = e.accion; st.donde = e.donde; st.receta = misma ? st.receta : null; st.tipoDocumento = misma ? st.tipoDocumento : ''; st.aQuien = misma ? st.aQuien : '';
      pintarSobre();
      refrescar(false);
    });
    que.addEventListener('change', function () {
      if (!lista.some(function (x) { return x.texto === que.value; })) { que.value = ''; st.elegida = false; st.accion = ''; pintarSobre(); refrescar(false); }
    });

    var nom = q('.at-nombre');
    if (nom) {
      nom.value = st.nombre;
      nom.oninput = function () { st.nombre = nom.value; st.tocado = true; q('.at-aviso').innerHTML = ''; var b = q('.at-anadir'); if (b) b.disabled = !listo(); if (op.alCambiar) op.alCambiar(Object.assign({}, resultado() || {}, { elegida: st.elegida, nombre: st.nombre, tocado: true })); };
      nom.onkeydown = function (ev) { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); intentar(); } };
    }

    /* «Añadir»: si es igual o parecida a una común, avisa (con «Usar esa» y «Crear la mía igualmente»); si no, lo da por hecho. */
    function intentar(forzar) {
      if (!listo()) return;
      var r = resultado(), p = nueva ? parecida(comunes, r) : null;
      if (p && !forzar) {
        var d = Sitios.textoDe(Sitios.datos(), Sitios.dondeDe(p));
        q('.at-aviso').innerHTML = '<div class="aviso aviso-ambar">Ya hay una tarea igual o parecida: <b>«' + esc(p.nombre) + '»</b> (' + esc(textoDe(p.accion) + (d ? ' · ' + d : '')) + ').' +
          '<div class="botones"><button type="button" class="boton boton-chico boton-principal at-usar-esa">Usar esa</button> ' +
          '<button type="button" class="boton boton-chico at-crear-igual">Crear la mía igualmente</button></div></div>';
        q('.at-usar-esa').onclick = function () { if (op.alUsar) op.alUsar(p); };
        q('.at-crear-igual').onclick = function () { intentar(true); };
        return;
      }
      if (op.alAnadir) op.alAnadir(r);
    }
    var anadir = q('.at-anadir'), cancelar = q('.at-cancelar');
    if (anadir) anadir.onclick = function () { intentar(); };
    if (cancelar) cancelar.onclick = function () { if (op.alCancelar) op.alCancelar(); };

    pintarSobre();
    if (nueva) pintarComunes();
    if (anadir) anadir.disabled = !listo();
    return { resultado: resultado, listo: listo, intentar: intentar, estado: function () { return st; } };
  }

  return { montar: montar, entradas: entradas, proponer: proponer, haceLoMismo: haceLoMismo, parecida: parecida, recetaDe: recetaDe };
})();
window.AnadirTarea = AnadirTarea;
