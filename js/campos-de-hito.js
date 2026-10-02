/* ============================================================
   campos-de-hito.js — campos de un hito (2-oct-2026, fila 255,
   docs/CAMPOS-DE-UN-HITO.md).

   Un campo de un hito es un campo del asunto que lleva, además, la marca
   de a qué hito pertenece (`hito`: el id del paso de la guía, o el del
   propio hito si es «solo de este asunto»). Su valor sigue en
   `ficha.campos` (un solo valor por asunto). Aquí viven:

   - las funciones puras: `repartir` (campos entre «sin hito» y los hitos
     del asunto) y `marcaDe`;
   - la tarjeta «Campos de este hito» de la mesa del hito (`tarjetaHtml`,
     `enganchar`): los campos del hito para rellenar ahí mismo, con su «⋮»
     y «+ Añadir campo» (que abre el panel de js/campo-desde-el-asunto.js
     con el hito de destino);
   - lo que la ficha necesita para poner los campos bajo el nombre de su
     hito (`hitosDelAsunto`).
   ============================================================ */
window.CamposDeHito = (function () {

  function marcaDe(h) { return (h && (h.origenGuia || h.id)) || ''; }

  function esDeHito(c, h) { return !!(c && c.hito && (c.hito === h.origenGuia || c.hito === h.id)); }

  /* PURA. Reparte los campos de un asunto entre «sin hito» y los hitos del
     asunto (`hitos`: los visibles, con `id`, `origenGuia` y `titulo`). Si la
     marca apunta a un hito que el asunto no tiene: con valor
     (`tieneValor(clave)`), se ve con los del asunto; sin valor, no se ve ni
     se pide. { sinHito: [campo], porHito: [{ hito, campos }] } (solo hitos con campos). */
  function repartir(campos, hitos, tieneValor) {
    var sinHito = [];
    var porId = {};
    var orden = [];
    (hitos || []).forEach(function (h) {
      var e = { hito: h, campos: [] };
      orden.push(e);
      porId[h.id] = e;
      if (h.origenGuia && !porId[h.origenGuia]) porId[h.origenGuia] = e;
    });
    (campos || []).forEach(function (c) {
      if (!c.hito) { sinHito.push(c); return; }
      var e = porId[c.hito];
      if (e) e.campos.push(c);
      else if (tieneValor && tieneValor(c)) sinHito.push(c);
    });
    return { sinHito: sinHito, porHito: orden.filter(function (e) { return e.campos.length; }) };
  }

  /* Los hitos visibles del asunto, de lo último leído (sin esperar al disco). */
  function hitosDelAsunto(nombre) {
    var datos = window.Hitos && Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    if (!datos || !datos.porAsunto) return null;   /* todavía sin leer */
    var e = datos.porAsunto[nombre];
    return e ? Hitos.visibles(e.hitos) : [];
  }

  function fichaDe(a) {
    return (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {};
  }

  /* Los campos de este hito, ya con su valor y su clase. */
  function camposDe(a, h) {
    var tipo = DondeSeGuarda.tipoDe(a);
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var ficha = fichaDe(a);
    var guardados = (ficha.campos && !Array.isArray(ficha.campos)) ? ficha.campos : {};
    return Campos.camposDeAsunto(config, ficha).filter(function (c) { return esDeHito(c, h); }).map(function (c) {
      var clave = Campos.claveDeCampo(c);
      var clase = Campos.claseDeCampo(c, App.E.campos);
      var p = c.origen === 'propio' ? Campos.propioDe(c.id, App.E.campos) : null;
      return { cfg: c, clave: clave, nombre: Campos.nombreDeCampo(c, App.E.campos), clase: clase,
               valores: p && p.valores, valor: (guardados[clave] && guardados[clave].valor) || '', soloAqui: !!c.soloAqui };
    });
  }

  function enConsulta() { return !!(window.FichaNucleo && FichaNucleo.ocupacionActual) || !!(window.SoloConsulta && SoloConsulta.activo()); }

  /* ---------- la tarjeta de la mesa ---------- */

  function tarjetaHtml(a, h, abierto) {
    var campos = camposDe(a, h);
    var editable = !!abierto && !enConsulta();
    var filas = campos.map(function (f, i) {
      var control = editable
        ? CamposClases.htmlControl('mch-' + h.id + '-' + i, f.clase, f.valores, f.valor)
        : '<span class="mesa-campo-hito-valor">' + (f.valor ? U.escapar(Campos.mostrarValor(f.clase, f.valor)) : '<span class="suave">sin valor</span>') + '</span>';
      return '<div class="mesa-campo-hito campo-fila" data-clave="' + U.escapar(f.clave) + '" data-clase="' + f.clase + '">' +
        '<label class="etiqueta">' + U.escapar(f.nombre) +
          (f.soloAqui ? ' <span class="marca-solo-aqui">solo aquí</span>' : '') + '</label>' +
        control +
        (editable ? '<button type="button" class="campo-hito-menu" data-clave="' + U.escapar(f.clave) +
          '" data-nombre="' + U.escapar(f.nombre) + '" title="Más opciones">⋮</button>' : '') +
        '</div>';
    }).join('');
    return '<section class="mesa-bloque mesa-campos-hito' + (campos.length ? '' : ' mesa-campos-hito-vacia') + '">' +
      '<div class="mesa-bloque-cabecera"><span class="mesa-bloque-titulo">Campos de este hito</span>' +
      (editable ? '<button type="button" class="boton mesa-campo-hito-anadir">+ Añadir campo</button>' : '') +
      '</div>' + filas + '</section>';
  }

  function hitoDestino(a, h) {
    return { marca: marcaDe(h), titulo: h.titulo || '', enGuia: !!h.origenGuia && !h.delTipoAnterior };
  }

  async function guardarValor(a, f, texto, el) {
    var leido = CamposClases.leerControl(el, f.clase);
    if (!leido.ok) {
      el.classList.add('campo-ambar');
      U.aviso('Revisa «' + f.nombre + '»: ' + CamposClases.avisoDeAmbar(f.clase) + '.', 'ambar');
      return;
    }
    el.classList.remove('campo-ambar');
    if (leido.valor === f.valor) return;
    try {
      await CampoDesdeElAsunto._i.escribirEnAsunto(a, f.clave, { valor: leido.valor });
      f.valor = leido.valor;
      U.aviso('«' + f.nombre + '» guardado.', 'bueno');
      CampoDesdeElAsunto._i.repintar(a);
    } catch (e) { U.fallo('No he podido guardar «' + f.nombre + '»', e); }
  }

  /* «Quitar de este hito»: el campo pasa a ser del asunto, con su valor. */
  async function quitarDelHito(a, h, f) {
    var I = CampoDesdeElAsunto._i;
    try {
      var tipo = DondeSeGuarda.tipoDe(a);
      var estaEnElTipo = tipo && I.configDelTipo(tipo).some(function (c) { return Campos.claveDeCampo(c) === f.clave && c.hito; });
      var donde = 'aqui';
      if (estaEnElTipo && hitoDestino(a, h).enGuia) {
        var r = await DondeSeGuarda.preguntar(Object.assign({
          titulo: 'Quitar «' + f.nombre + '» del hito «' + h.titulo + '»', aceptar: 'Guardar'
        }, { tipoCorto: DondeSeGuarda.nombreCortoDe(tipo), opcionTipo: 'En el tipo ' + DondeSeGuarda.nombreCortoDe(tipo),
             otros: DondeSeGuarda.otrosAbiertos(a).length }));
        if (r === null) return;
        donde = r === 'guia' ? 'tipo' : 'aqui';
      }
      if (donde === 'tipo') await I.quitarHitoEnElTipo(tipo, f.clave);
      /* La entrada de la ficha: sin hito. Si el campo es del tipo y solo se quita aquí, `hito: ''` lo dice. */
      var entrada = Object.assign({}, I.entradaLimpia(f.cfg), { hito: undefined });
      delete entrada.hito;
      if (estaEnElTipo && donde === 'aqui') entrada.hito = '';
      if (f.soloAqui || (estaEnElTipo && donde === 'aqui')) await I.escribirEnAsunto(a, f.clave, { anadir: entrada });
      else await I.escribirEnAsunto(a, f.clave, { quitar: true });
      I.repintar(a);
      U.aviso('«' + f.nombre + '» ya es un campo del asunto, sin hito.', 'bueno');
    } catch (e) { U.fallo('No he podido quitarlo del hito', e); }
  }

  function enganchar(div, a, h, abierto) {
    var caja = div.querySelector('.mesa-campos-hito');
    if (!caja || !abierto || enConsulta()) return;
    var campos = camposDe(a, h);
    var anadir = caja.querySelector('.mesa-campo-hito-anadir');
    if (anadir) anadir.onclick = function () { CampoDesdeElAsunto.abrir(a, hitoDestino(a, h)); };
    Array.prototype.forEach.call(caja.querySelectorAll('.mesa-campo-hito'), function (fila) {
      var f = campos.filter(function (x) { return x.clave === fila.dataset.clave; })[0];
      if (!f) return;
      var el = fila.querySelector('input.campo, select.campo');
      if (el) {
        CamposClases.engancharControl(el, f.clase);
        el.onchange = function () { guardarValor(a, f, el.value, el); };
        el.onkeydown = function (ev) { if (ev.key === 'Enter' && el.tagName === 'INPUT') { ev.preventDefault(); el.blur(); } };
      }
      var menu = fila.querySelector('.campo-hito-menu');
      if (menu && window.FichaMenus) {
        var I = CampoDesdeElAsunto._i;
        var opciones = [{ texto: 'Quitar de este hito', alPulsar: function () { quitarDelHito(a, h, f); } }];
        if (f.soloAqui) {
          opciones.push({ texto: 'Pasar al tipo', deshabilitado: !DondeSeGuarda.tipoDe(a),
            title: DondeSeGuarda.tipoDe(a) ? '' : 'Este asunto no tiene tipo',
            alPulsar: function () { I.pasarAlTipo(a, f.clave); } });
          opciones.push({ texto: 'Quitar', clase: 'ficha-menu-peligro', alPulsar: function () { I.quitar(a, f.clave, f.nombre); } });
        }
        FichaMenus.montar(menu, opciones);
      }
    });
  }

  /* ---------- la guía del tipo ---------- */

  function aplanar(pasos, salida) {
    (pasos || []).forEach(function (p) {
      salida.push({ id: p.id, titulo: p.titulo || '' });
      (p.opciones || []).forEach(function (o) { aplanar(o.pasos, salida); });
    });
    return salida;
  }

  /* Los pasos de la guía de un tipo, en orden: { id, titulo }. */
  function pasosDeLaGuia(tipo) {
    return window.GuiasDelCentro ? aplanar(GuiasDelCentro.pasosDe(tipo), []) : [];
  }

  /* Al guardarse la guía de un tipo: los campos cuyo paso ya no existe pasan a ser del
     asunto, sin hito (no se borra ninguno). */
  async function limpiarMarcas(tipo, pasos) {
    if (!pasos || !pasos.length) return;
    var ids = {};
    aplanar(pasos, []).forEach(function (p) { ids[p.id] = true; });
    var cambio = false;
    await App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
      if (!lista.some(function (c) { return c.hito && !ids[c.hito]; })) return;
      cambio = true;
      App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista.map(function (c) {
        if (!c.hito || ids[c.hito]) return c;
        var n = Object.assign({}, c); delete n.hito; return n;
      }));
    });
    return cambio;
  }

  return { pasosDeLaGuia: pasosDeLaGuia, limpiarMarcas: limpiarMarcas, marcaDe: marcaDe, esDeHito: esDeHito, repartir: repartir, hitosDelAsunto: hitosDelAsunto,
           camposDe: camposDe, tarjetaHtml: tarjetaHtml, enganchar: enganchar };
})();
