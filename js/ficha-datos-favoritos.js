/* ============================================================
   ficha-datos-favoritos.js — hasta 3 datos del tercero, junto al
   nombre del asunto, y el cuadro «Elegir datos» (fila 272,
   docs/DATOS-FAVORITOS-EN-LA-FICHA.md).

   La parte sin pantalla (qué datos hay, qué se ha elegido, dónde se
   guarda) vive en js/datos-favoritos.js. Aquí solo se pinta:
   - `FichaDatosFavoritos.html(a)`: el bloque, con su sitio reservado
     desde el primer pintado (los datos del tercero llegan tarde);
   - `FichaDatosFavoritos.alPintar(caja, a)`: lo rellena cuando llegan
     y engancha el botón. Lleva contador de turno: si se cambia de
     asunto mientras llegan, los del anterior no se pintan.
   El botón es un botón más de la ficha: en modo consulta y en «solo
   consultar» lo apaga js/ficha-consulta.js con todos los demás.
   ============================================================ */
(function () {

  var turno = 0;

  function $(id) { return document.getElementById(id); }

  function categoriaDe(a) {
    return (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
  }

  function recortar(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  /* Sin clase de tercero, no hay nada que enseñar ni que elegir. */
  function html(a) {
    if (!categoriaDe(a)) return '';
    return '<div class="ficha-favoritos" id="ficha-favoritos">' +
      '<span class="fav-datos" id="ficha-favoritos-datos"></span>' +
      '<button type="button" class="boton fav-elegir" id="fav-elegir" title="Elige hasta 3 datos para verlos aquí, en todos los asuntos de ' +
        U.escapar(Nombres.textoCategoria(categoriaDe(a)).toLowerCase()) + '">Elegir datos</button>' +
    '</div>';
  }

  async function cargar(a) {
    var categoria = categoriaDe(a);
    var r = { categoria: categoria, persona: null, fuente: null };
    if (!categoria) return r;
    try {
      if (window.FichaTercero) {
        var d = await FichaTercero.datosBasicos(a);
        r.persona = d.persona;
      }
    } catch (e) { /* sin persona: solo el botón */ }
    try { if (App.E.datos) r.fuente = await Datos.cargar(App.E.datos, categoria); } catch (e2) { /* sin cabecera */ }
    return r;
  }

  function pintarDatos(caja, r) {
    var lista = DatosFavoritos.visibles(r.persona, r.categoria, r.fuente);
    caja.innerHTML = lista.map(function (f) {
      var completo = f.titulo + ': ' + f.valor;
      return '<span class="fav-dato" title="' + U.escapar(completo) + '"><span class="fav-nombre">' + U.escapar(f.titulo) +
        ':</span> <span class="fav-valor">' + U.escapar(recortar(f.valor, 40)) + '</span></span>';
    }).join('<span class="fav-sep"> · </span>');
  }

  async function alPintar(caja, a) {
    var yo = ++turno;
    var datos = $('ficha-favoritos-datos');
    var boton = $('fav-elegir');
    if (!datos || !boton) return;
    boton.onclick = function () { return elegir(a); };
    var r = await cargar(a);
    if (yo !== turno || !datos.isConnected) return;
    pintarDatos(datos, r);
  }

  /* ---------- el cuadro «Elegir datos» ---------- */

  async function elegir(a) {
    var categoria = categoriaDe(a);
    if (!categoria) return;
    var r = await cargar(a);
    var clase = Nombres.textoCategoria(categoria);
    var guardados = DatosFavoritos.elegidos(categoria);
    var todas = DatosFavoritos.filas(r.persona, categoria, r.fuente);
    var por = {};
    todas.forEach(function (f) { por[f.clave] = f; });
    guardados.forEach(function (k) {
      if (!por[k]) { por[k] = { clave: k, titulo: k, valor: '', ausente: true }; todas.push(por[k]); }
    });
    /* Arriba los marcados, en el orden en que se marcaron; el resto, por orden alfabético. */
    var resto = todas.filter(function (f) { return guardados.indexOf(f.clave) === -1; })
      .sort(function (x, y) { return x.titulo.localeCompare(y.titulo, 'es'); });
    var orden = guardados.map(function (k) { return por[k]; }).concat(resto);

    var filas = orden.map(function (f) {
      return '<label class="fav-fila" data-texto="' + U.escapar(U.normalizar(f.titulo)) + '">' +
        '<input type="checkbox" data-clave="' + U.escapar(f.clave) + '"> ' +
        '<span class="fav-fila-nombre">' + U.escapar(f.titulo) + (f.ausente ? ' (ya no está en el fichero)' : '') + '</span>' +
        (f.valor ? ' <span class="fav-fila-valor">— ' + U.escapar(recortar(f.valor, 40)) + '</span>' : '') +
      '</label>';
    }).join('');
    var promesa = U.preguntar('Elegir datos · ' + clase,
      '<p class="explica">Marca hasta ' + DatosFavoritos.MAXIMO + '. Se verán junto al nombre en todos los asuntos de ' +
        U.escapar(clase.toLowerCase()) + ', en todos los ordenadores del centro.</p>' +
      (orden.length > 12 ? '<input type="search" id="fav-buscar" class="campo" placeholder="Buscar…" autocomplete="off">' : '') +
      '<div id="fav-lista" class="fav-lista">' + filas + '</div>' +
      '<p class="nota oculto" id="fav-maximo">Máximo ' + DatosFavoritos.MAXIMO + '</p>', 'Guardar');

    var marcados = guardados.slice();
    var lista = $('fav-lista');
    function repasar() {
      var lleno = marcados.length >= DatosFavoritos.MAXIMO;
      Array.prototype.forEach.call(lista.querySelectorAll('input'), function (c) {
        c.checked = marcados.indexOf(c.dataset.clave) !== -1;
        c.disabled = lleno && !c.checked;
      });
      $('fav-maximo').classList.toggle('oculto', !lleno);
    }
    Array.prototype.forEach.call(lista.querySelectorAll('input'), function (c) {
      c.onchange = function () {
        var i = marcados.indexOf(c.dataset.clave);
        if (c.checked && i === -1 && marcados.length < DatosFavoritos.MAXIMO) marcados.push(c.dataset.clave);
        else if (!c.checked && i !== -1) marcados.splice(i, 1);
        repasar();
      };
    });
    var buscar = $('fav-buscar');
    if (buscar) {
      buscar.oninput = function () {
        var q = U.normalizar(buscar.value);
        Array.prototype.forEach.call(lista.querySelectorAll('.fav-fila'), function (l) {
          l.classList.toggle('oculto', !!q && l.dataset.texto.indexOf(q) === -1);
        });
      };
    }
    repasar();

    var ok = await promesa;
    if (!ok) return;
    try {
      await DatosFavoritos.guardar(categoria, marcados);
    } catch (e) {
      U.fallo('No he podido guardar los datos', e);
      return;
    }
    U.aviso('Datos de la ficha guardados.', 'bueno');
    var caja = $('ficha-favoritos-datos');
    if (caja && N_actual() === a) pintarDatos(caja, r);
  }

  function N_actual() { return window.FichaNucleo && FichaNucleo.actual; }

  window.FichaDatosFavoritos = { html: html, alPintar: alPintar, elegir: elegir };
})();
