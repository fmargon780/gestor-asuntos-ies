/* ============================================================
   tipos-cortos.js — el nombre corto de los tipos, con tope de 25
   caracteres (30-sep-2026, fila 239, docs/NOMBRES-FIJOS-CON-NUMERO.md,
   apartado 5).

   Dos cosas:

   - `TiposDocumentoCortos`: los tipos de documento son texto suelto, sin
     sitio donde apuntar un nombre corto; los nombres cortos se guardan
     aparte, en `_GESTOR/tipos-documento-cortos.json`
     ({ cortos: { "SOLICITUD DE MATRÍCULA": "SOLIC MATRÍCULA" } }).
     `Nombres.cortoDeTipoDocumento` lo consulta al montar un nombre.

   - `TiposLargos`: los tipos (de asunto y de documento) cuyo nombre
     corto pasa de 25 siguen usándose con su nombre entero, sin bloquear
     nada. La comprobación al entrar («⚠ N por configurar») los cuenta y
     «Arreglarlo» abre UNA lista con todos, cada uno con su casilla de
     nombre corto y su contador; se guarda al cambiar, sin botón.

   Acortar un tipo NO renombra nada de lo que ya existe.
   ============================================================ */
var TiposDocumentoCortos = (function () {

  var FICHERO = 'tipos-documento-cortos.json';
  var TOPE = 25;
  var mapa = {};

  function gestor() { return window.App && App.E && App.E.gestor; }
  function clave(tipo) { return U.normalizar(tipo); }

  async function leerDisco() {
    var g = gestor();
    var r = g ? await Carpetas.leerJson(g, FICHERO) : null;
    return { cortos: (r && r.cortos && typeof r.cortos === 'object') ? r.cortos : {} };
  }

  async function cargar() {
    try { mapa = (await leerDisco()).cortos; }
    catch (e) { mapa = {}; }   /* roto o ilegible: se sigue con los nombres enteros */
  }

  /* El nombre corto de un tipo de documento, o '' si no lo tiene. */
  function de(tipo) {
    var k = clave(tipo);
    var hallado = '';
    Object.keys(mapa).forEach(function (t) { if (clave(t) === k) hallado = mapa[t]; });
    return hallado;
  }

  /* Guarda (o, con '', quita) el nombre corto, releyendo antes el
     fichero por si el otro ordenador ha tocado algo. */
  function poner(tipo, corto) {
    corto = U.limpiarNombre(corto || '').toUpperCase();
    if (corto.length > TOPE) return Promise.reject(new Error('El nombre corto no puede pasar de ' + TOPE + ' caracteres.'));
    var hacer = async function () {
      var d = await leerDisco();
      Object.keys(d.cortos).forEach(function (t) { if (clave(t) === clave(tipo)) delete d.cortos[t]; });
      if (corto) d.cortos[tipo] = corto;
      if (gestor()) await Copias.guardar(gestor(), FICHERO, d);
      mapa = d.cortos;
    };
    return App.enFila ? App.enFila(FICHERO, hacer) : hacer();
  }

  /* Cuadro para cambiar el nombre corto de un tipo de documento. */
  async function editar(tipo) {
    var promesa = U.preguntar('Nombre corto: ' + tipo,
      '<p class="explica">Lo que entra en el nombre de los documentos nuevos de este tipo. ' +
      'Si lo dejas vacío, se usa el nombre entero. Cambiarlo no renombra ningún documento que ya exista.</p>' +
      '<label class="etiqueta">Nombre corto</label>' +
      '<input id="tdoc-corto" class="campo" maxlength="' + TOPE + '" value="' + U.escapar(de(tipo)) + '" placeholder="Igual que el nombre del tipo">' +
      '<div id="tdoc-corto-cuenta" class="nota"></div>', 'Guardar');
    var campo = document.getElementById('tdoc-corto');
    function cuenta() {
      document.getElementById('tdoc-corto-cuenta').textContent =
        U.limpiarNombre(campo.value).length + ' de ' + TOPE + ' caracteres';
    }
    campo.oninput = cuenta;
    cuenta();
    if (!await promesa) return false;
    try { await poner(tipo, campo.value); }
    catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); return false; }
    U.aviso('Nombre corto guardado.', 'bueno');
    if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
    return true;
  }

  return { FICHERO: FICHERO, TOPE: TOPE, cargar: cargar, de: de, poner: poner, editar: editar };
})();
window.TiposDocumentoCortos = TiposDocumentoCortos;

var TiposLargos = (function () {

  var TOPE = TiposDocumentoCortos.TOPE;

  /* Los tipos cuyo nombre corto efectivo pasa de 25:
     [{ clase: 'asunto'|'documento', nombre, corto, largo }] */
  function lista() {
    var salida = [];
    ((window.App && App.E && App.E.tipos) || []).forEach(function (t) {
      var efectivo = Nombres.tipoParaCarpeta(t);
      if (efectivo.length > TOPE) salida.push({ clase: 'asunto', nombre: t.tipo, corto: t.nombreCorto || '', largo: efectivo.length });
    });
    ((window.App && App.E && App.E.tiposDocumento) || []).forEach(function (t) {
      var efectivo = Nombres.cortoDeTipoDocumento(t);
      if (efectivo.length > TOPE) salida.push({ clase: 'documento', nombre: t, corto: TiposDocumentoCortos.de(t), largo: efectivo.length });
    });
    return salida;
  }

  function fila(t, i) {
    return '<div class="tipo-largo-fila" data-i="' + i + '">' +
      '<div><strong>' + U.escapar(t.nombre) + '</strong> <span class="suave">· tipo de ' +
        (t.clase === 'asunto' ? 'asunto' : 'documento') + '</span></div>' +
      '<input class="campo tipo-largo-corto" data-i="' + i + '" maxlength="' + TOPE + '" value="' + U.escapar(t.corto) +
        '" placeholder="Nombre corto (máximo ' + TOPE + ')" aria-label="Nombre corto de ' + U.escapar(t.nombre) + '">' +
      '<div class="nota tipo-largo-cuenta" data-i="' + i + '"></div></div>';
  }

  async function guardarUno(t, texto) {
    var corto = U.limpiarNombre(texto).toUpperCase();
    if (corto.length > TOPE) throw new Error('El nombre corto no puede pasar de ' + TOPE + ' caracteres.');
    if (t.clase === 'asunto') {
      var obj = App.E.tipos.filter(function (x) { return x.tipo === t.nombre; })[0];
      if (!obj) throw new Error('Ese tipo ya no existe.');
      var otros = App.E.tipos.filter(function (x) { return x !== obj; }).map(function (x) { return x.nombreCorto || x.tipo; });
      if (corto && otros.some(function (o) { return U.normalizar(o) === U.normalizar(corto); })) {
        throw new Error('Ya lo usa otro tipo: no puede repetirse.');
      }
      obj.nombreCorto = corto;
      await App.guardarTipos();
    } else {
      await TiposDocumentoCortos.poner(t.nombre, corto);
    }
  }

  /* UNA sola lista con todos los tipos largos, de asunto y de documento;
     se guarda al cambiar cada casilla (sin botón «Guardar»). */
  function abrir() {
    var todos = lista();
    if (!todos.length) { U.aviso('Ningún tipo pasa de ' + TOPE + ' caracteres.', 'bueno'); return Promise.resolve(); }
    var promesa = U.preguntar('Tipos con el nombre demasiado largo',
      '<p class="explica">El nombre corto de un tipo entra en el nombre de las carpetas y de los documentos nuevos, ' +
      'y no puede pasar de ' + TOPE + ' caracteres. Los que ya existen se siguen usando con su nombre entero; ' +
      'acortarlos no cambia el nombre de nada de lo que ya existe. Se guarda al salir de cada casilla.</p>' +
      '<div id="tipos-largos-lista">' + todos.map(fila).join('') + '</div>', 'Cerrar', true);
    Array.prototype.forEach.call(document.querySelectorAll('.tipo-largo-corto'), function (campo) {
      var i = Number(campo.dataset.i);
      var cuenta = document.querySelector('.tipo-largo-cuenta[data-i="' + i + '"]');
      function pintar() { cuenta.textContent = U.limpiarNombre(campo.value).length + ' de ' + TOPE + ' caracteres'; }
      campo.oninput = pintar;
      campo.onchange = async function () {
        try {
          await guardarUno(todos[i], campo.value);
          todos[i].corto = U.limpiarNombre(campo.value).toUpperCase();
          var fila = campo.closest('.tipo-largo-fila');
          var efectivo = todos[i].corto || todos[i].nombre;
          if (efectivo.length <= TOPE && fila) fila.classList.add('tipo-largo-hecho');
          U.aviso('Nombre corto guardado.', 'bueno');
        } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
        pintar();
      };
      pintar();
    });
    return promesa;
  }

  return { TOPE: TOPE, lista: lista, abrir: abrir };
})();
window.TiposLargos = TiposLargos;
