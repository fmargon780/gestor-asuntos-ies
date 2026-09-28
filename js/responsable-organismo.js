/* ============================================================
   responsable-organismo.js — una Administración como responsable de un
   hito (28-sep-2026, fila 205, docs/RESPONSABLE-UNA-ADMINISTRACION.md).

   A veces quien resuelve un procedimiento no es el centro, sino otro
   organismo (la Delegación Territorial de Educación). Al final de la lista
   de responsables sale «Una Administración…»: se elige un organismo o un
   centro dado de alta en la categoría ADMINISTRACIONES (con su
   departamento, si tiene y se quiere).

   Cómo se guarda: el responsable del hito (o el «Responsable por
   defecto» de un paso de la guía o de un modelo de la biblioteca) es
   `adm:<id del organismo>` o `adm:<id del organismo>:<id del
   departamento>`. En el hito, junto al id va `responsableNombre`, una
   copia del nombre, para que se siga leyendo aunque el organismo se
   borre (en la guía y en la biblioteca solo va el id: el hito nace con
   su copia). Si el organismo existe, manda su nombre de ahora (el
   corto; con departamento, «Corto · Departamento»).

   Nunca es de Administración (Hitos.esDeAdministracion, js/hitos-a-quien.js):
   el asunto pasa a «Pendiente de terceros» y la cabecera dice «Esperando
   a Delegación Territorial». Las listas fijas (Hitos.RESPONSABLES_DEFECTO,
   Hitos.PAPELES) no cambian; esto se engancha por puntos previstos, sin
   envolver nada. Carga después de js/administraciones-ficha.js y de
   js/hitos.js.
   ============================================================ */
var ResponsableOrganismo = (function () {

  var PREFIJO = 'adm:';
  /* Valor del desplegable de una guía para «Una Administración…»: no es un
     responsable, solo abre el buscador. */
  var OPCION = '__adm__';
  var TEXTO = 'Una Administración…';
  var CAT = 'ADMINISTRACIONES';

  /* Lo último visto de cada `responsableNombre` (id → nombre), para
     nombrar al organismo aunque ya no esté dado de alta. Lo llena el
     normalizador de hitos (js/hitos.js). */
  var copias = {};

  function A() { return window.Administraciones; }

  /* ---------- el id ---------- */

  function esOrganismo(id) {
    return typeof id === 'string' && id.indexOf(PREFIJO) === 0 && id.length > PREFIJO.length;
  }

  function crearId(idOrganismo, idDepartamento) {
    return PREFIJO + idOrganismo + (idDepartamento ? ':' + idDepartamento : '');
  }

  function partes(id) {
    if (!esOrganismo(id)) return null;
    var t = id.slice(PREFIJO.length).split(':');
    return { organismo: t[0], departamento: t[1] || '' };
  }

  /* ---------- el nombre ---------- */

  /* El nombre de ahora, o '' si el organismo (o su departamento) ya no está. */
  function nombreVivo(id) {
    var p = partes(id), adm = A();
    if (!p || !adm) return '';
    var o = adm.organismoPorId(adm.enMemoria(), p.organismo);
    if (!o) return '';
    var nombre = o.corto || o.oficial || '';
    if (!p.departamento) return nombre;
    var dep = adm.departamentoPorId(o, p.departamento);
    return dep && dep.nombre ? nombre + ' · ' + dep.nombre : '';
  }

  /* Lo que se enseña: el de ahora; si no, la copia guardada; si no, la de
     la última vez que se vio; y como último recurso, un texto genérico. */
  function nombreDe(id, copia) {
    return nombreVivo(id) || String(copia || '') || copias[id] || TEXTO.replace('…', '');
  }

  /* Para los normalizadores: devuelve la copia que hay que guardar junto
     al id ('' si no es un organismo) y la recuerda. */
  function copia(id, nombre) {
    if (!esOrganismo(id)) return '';
    var n = String(nombre || '') || nombreVivo(id);
    if (n) copias[id] = n;
    return n;
  }

  /* Lo que devuelve Hitos.resolverResponsable para este id. */
  function resolver(id) {
    return { texto: nombreDe(id, ''), resuelto: true };
  }

  /* Los organismos que son responsables de algún hito de esta lista de
     hitos (para el filtro de Inicio): [{id, nombre}], sin repetir. */
  function usadosEn(hitos) {
    var vistos = {}, salida = [];
    (hitos || []).forEach(function (h) {
      var id = h && h.responsable;
      if (!esOrganismo(id) || vistos[id]) return;
      vistos[id] = true;
      salida.push({ id: id, nombre: nombreDe(id, h.responsableNombre) });
    });
    return salida.sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
  }

  /* ---------- el buscador (dentro de un cuadro o en línea) ---------- */

  async function cargar() {
    var adm = A();
    if (!adm) return;
    try { await adm.leer(App.E.datos); } catch (e) { /* se sigue con lo que haya */ }
  }

  function personas() {
    var adm = A(), d = adm.enMemoria();
    return d.organismos.map(function (o) { return adm.persona(o, d); });
  }

  /* Pinta el buscador dentro de `caja`. `opciones.alElegir(r)` (si se da)
     pone un botón «Elegir» propio y recibe { id, nombre }; sin ella,
     quien lo monta lee la elección con `.leer()` (el cuadro de la mesa).
     `opciones.alCancelar` (si se da) pone un «Cancelar» en línea. */
  function montarBuscador(caja, opciones) {
    opciones = opciones || {};
    var adm = A();
    var elegido = null;   /* el organismo pulsado (persona) */
    caja.classList.add('ro-buscador');
    caja.innerHTML =
      '<input type="search" class="campo ro-buscar" placeholder="Buscar un organismo o un centro…" autocomplete="off">' +
      '<div class="ro-lista"></div>' +
      '<div class="ro-eleccion oculto"></div>';
    var buscar = caja.querySelector('.ro-buscar');
    var lista = caja.querySelector('.ro-lista');
    var eleccion = caja.querySelector('.ro-eleccion');

    function departamentoElegido() {
      var s = caja.querySelector('.ro-dep');
      return s ? s.value : '';
    }

    function resultado() {
      if (!elegido) return null;
      var dep = departamentoElegido();
      var id = crearId(elegido.idOrganismo, dep);
      return { id: id, nombre: nombreVivo(id) || elegido.corto };
    }

    function pintarEleccion() {
      if (!elegido) { eleccion.classList.add('oculto'); eleccion.innerHTML = ''; return; }
      var o = adm.organismoPorId(adm.enMemoria(), elegido.idOrganismo);
      var deps = o ? adm.aplanar(o) : [];
      eleccion.classList.remove('oculto');
      eleccion.innerHTML =
        '<p class="ro-elegido">Elegida: <strong>' + U.escapar(elegido.corto) + '</strong></p>' +
        (deps.length
          ? '<label class="etiqueta">Departamento <span class="suave">(opcional)</span></label>' +
            '<select class="campo ro-dep"><option value="">Sin departamento</option>' +
            deps.map(function (d) {
              return '<option value="' + U.escapar(d.id) + '">' + U.escapar(new Array(d.nivel + 1).join('— ') + d.nombre) + '</option>';
            }).join('') + '</select>'
          : '') +
        ((opciones.alElegir || opciones.alCancelar)
          ? '<div class="ro-botones">' +
            (opciones.alElegir ? '<button type="button" class="boton boton-principal ro-elegir">Elegir</button>' : '') +
            (opciones.alCancelar ? '<button type="button" class="boton ro-cancelar">Cancelar</button>' : '') +
            '</div>'
          : '');
      var b = eleccion.querySelector('.ro-elegir');
      if (b) b.onclick = function () { opciones.alElegir(resultado()); };
      b = eleccion.querySelector('.ro-cancelar');
      if (b) b.onclick = function () { opciones.alCancelar(); };
    }

    function pintarLista() {
      lista.innerHTML = '';
      var todas = personas();
      if (!todas.length) {
        lista.innerHTML = '<p class="explica">No hay ninguna Administración dada de alta.</p>' +
          '<button type="button" class="boton ro-alta">Dar de alta una Administración</button>';
        var alta = lista.querySelector('.ro-alta');
        if (alta) alta.onclick = async function () {
          var f = window.App && App.ALTAS_DE_CATEGORIA && App.ALTAS_DE_CATEGORIA[CAT];
          if (!f) return;
          var p = await f('');
          if (p) { await cargar(); pintarLista(); }
        };
        return;
      }
      var n = window.AdministracionesFicha.pintarLista(lista, { lista: todas }, buscar.value, function (p) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ro-organismo' + (elegido && elegido.idOrganismo === p.idOrganismo ? ' ro-marcado' : '');
        b.dataset.id = p.idOrganismo;
        b.innerHTML = '<span class="ro-nombre">' + U.escapar(p.corto) + '</span>' +
          '<span class="ro-pie suave">' + U.escapar(adm.pie(p)) + '</span>';
        b.onclick = function () {
          elegido = p;
          Array.prototype.forEach.call(lista.querySelectorAll('.ro-organismo'), function (x) {
            x.classList.toggle('ro-marcado', x === b);
          });
          pintarEleccion();
        };
        return b;
      });
      if (!n) lista.innerHTML = '<p class="explica">Ninguna Administración coincide con lo escrito.</p>';
    }

    buscar.oninput = pintarLista;
    pintarLista();
    return { leer: resultado, enfocar: function () { buscar.focus(); } };
  }

  /* El cuadro de la mesa del hito: devuelve { id, nombre } o null. */
  async function elegir() {
    await cargar();
    var promesa = U.preguntar('Una Administración',
      '<p class="explica">Elige quién resuelve este hito. El asunto quedará «Esperando a…» esa Administración.</p>' +
      '<div id="ro-caja"></div>', 'Elegir');
    var b = montarBuscador(document.getElementById('ro-caja'), {});
    b.enfocar();
    var ok = await promesa;
    if (!ok) return null;
    var r = b.leer();
    if (!r) { U.aviso('No has elegido ninguna Administración.', 'ambar'); return null; }
    return r;
  }

  /* ---------- el desplegable del editor de guías ---------- */

  /* Las dos opciones que se añaden al final del desplegable del paso `p`:
     su organismo (si ya lo tiene) y «Una Administración…». */
  function opcionesExtra(p) {
    var id = p && p.responsable;
    var propia = esOrganismo(id)
      ? '<option value="' + U.escapar(id) + '" selected>' + U.escapar(nombreDe(id, '')) + '</option>'
      : '';
    return propia + '<option value="' + OPCION + '">' + TEXTO + '</option>';
  }

  /* Al elegir «Una Administración…» en un desplegable: el desplegable
     vuelve a lo de antes y se abre el buscador debajo, en línea (un cuadro
     nuevo cerraría el editor de la guía con lo que tuviera sin guardar). */
  async function alCambiarSelect(select) {
    var anterior = ('anterior' in select.dataset) ? select.dataset.anterior
      : (Array.prototype.filter.call(select.options, function (x) { return x.defaultSelected; })[0] || { value: '' }).value;
    select.value = anterior;
    if (select.parentNode.querySelector('.ro-en-linea')) return;
    await cargar();
    var caja = document.createElement('div');
    caja.className = 'ro-en-linea';
    select.insertAdjacentElement('afterend', caja);
    function cerrar() { if (caja.parentNode) caja.parentNode.removeChild(caja); }
    var b = montarBuscador(caja, {
      alElegir: function (r) {
        var op = Array.prototype.filter.call(select.options, function (x) { return x.value === r.id; })[0];
        if (!op) {
          op = document.createElement('option');
          op.value = r.id;
          select.insertBefore(op, select.querySelector('option[value="' + OPCION + '"]'));
        }
        op.textContent = r.nombre;
        select.value = r.id;
        select.dataset.anterior = r.id;
        cerrar();
      },
      alCancelar: cerrar
    });
    b.enfocar();
  }

  if (typeof document !== 'undefined') {
    /* Se recuerda el valor de antes de cada cambio para poder volver a él. */
    document.addEventListener('focusin', function (ev) {
      var t = ev.target;
      if (t && t.matches && t.matches('select.paso-responsable')) t.dataset.anterior = t.value === OPCION ? (t.dataset.anterior || '') : t.value;
    });
    document.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.matches || !t.matches('select.paso-responsable')) return;
      if (t.value === OPCION) alCambiarSelect(t);
      else t.dataset.anterior = t.value;
    });
  }

  return {
    PREFIJO: PREFIJO, OPCION: OPCION, TEXTO: TEXTO,
    esOrganismo: esOrganismo, crearId: crearId, partes: partes,
    nombreDe: nombreDe, copia: copia, resolver: resolver, usadosEn: usadosEn,
    elegir: elegir, montarBuscador: montarBuscador,
    opcionesExtra: opcionesExtra
  };
})();
window.ResponsableOrganismo = ResponsableOrganismo;
