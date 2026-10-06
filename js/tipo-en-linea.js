/* ============================================================
   tipo-en-linea.js — el tipo de asunto en una línea, con buscador
   (fila 257, docs/TIPO-EN-UNA-LINEA-AL-CAMBIAR.md).

   En «Cambiar el asunto» (y en «Nuevo asunto» cuando llega con el tipo
   ya reconocido) el tipo no es un desplegable ni una parrilla: es una
   línea con su nombre y «Cambiar», como el tercero. «Cambiar» abre una
   caja vacía; al escribir salen como mucho 8 tipos parecidos (de todas
   las categorías, con la suya en pequeño, los más usados primero) y
   «y N más: sigue escribiendo» si hay más. Elegir uno vuelve a la
   línea; la ✕ y Esc dejan el que había, sin cerrar el cuadro entero.

   Estado propio, local a cada llamada de `TipoEnLinea.montar`: no toca
   App.E.nuevo (eso lo hace quien llama, en `alElegir`). Compara con
   BuscarOCrear.coincidencias (sin tildes, sin mayúsculas, en cualquier
   orden de palabras) sobre el nombre, el nombre corto y los alias.
   ============================================================ */
window.TipoEnLinea = (function () {

  var MAXIMO = 8;

  function usos() { return App.usosDeTipos ? App.usosDeTipos() : {}; }

  /* Los tipos que se parecen a `texto`, los más usados primero.
     `categoria`, si viene, limita la búsqueda a esa categoría. */
  function buscar(texto, categoria) {
    var tipos = (App.E.tipos || []).filter(function (t) { return !categoria || t.categoria === categoria; });
    var deNombre = {};   /* nombre (o corto, o alias) -> tipos que lo llevan */
    tipos.forEach(function (t) {
      [t.tipo, t.nombreCorto].concat(t.alias || []).forEach(function (n) {
        if (!n) return;
        (deNombre[n] = deNombre[n] || []).push(t);
      });
    });
    var dentro = BuscarOCrear.coincidencias(texto, Object.keys(deNombre));
    var vistos = [], salida = [];
    dentro.forEach(function (n) {
      deNombre[n].forEach(function (t) {
        if (vistos.indexOf(t.tipo) === -1) { vistos.push(t.tipo); salida.push(t); }
      });
    });
    var cuenta = usos();
    salida.sort(function (a, b) {
      var ca = cuenta[a.tipo] || 0, cb = cuenta[b.tipo] || 0;
      if (cb !== ca) return cb - ca;
      return a.tipo < b.tipo ? -1 : 1;
    });
    return salida;
  }

  /* opciones: { prefijo (ids), rotulo ('' o 'Tipo de asunto:'), tipo (nombre actual),
       fueraDeLista (bool), categoria() (filtro o null), alElegir(tipoObj), alCrear(nombre)
       (si falta, no se ofrece crear) }.
     Devuelve { tipo(), poner(nombre), abierta() }. */
  function montar(caja, o) {
    var estado = { tipo: o.tipo || '', buscando: false };
    var cierraConEsc = null;

    function objeto(nombre) {
      return (App.E.tipos || []).filter(function (t) { return t.tipo === nombre; })[0] || null;
    }

    function pintarLinea() {
      quitarEsc();
      estado.buscando = false;
      var t = objeto(estado.tipo);
      var marca = t
        ? '<span class="resultado-categoria">' + U.escapar(t.categoria) + '</span>'
        : (estado.tipo ? ' <span class="suave">(no está en la lista)</span>' : '');
      caja.innerHTML = '<div class="elegido"><div class="elegido-caja">' +
        '<div>' + (o.rotulo ? U.escapar(o.rotulo) + ' ' : '') +
        '<strong id="' + o.prefijo + '-nombre">' + U.escapar(estado.tipo || '—') + '</strong>' + marca + '</div>' +
        '<button type="button" class="boton" id="' + o.prefijo + '-cambiar">Cambiar</button></div></div>';
      caja.querySelector('#' + o.prefijo + '-cambiar').onclick = pintarBuscador;
    }

    function quitarEsc() {
      if (cierraConEsc) { document.removeEventListener('keydown', cierraConEsc, true); cierraConEsc = null; }
    }

    function elegir(t) {
      estado.tipo = t.tipo;
      pintarLinea();
      if (o.alElegir) o.alElegir(t);
    }

    function pintarBuscador() {
      estado.buscando = true;
      caja.innerHTML =
        '<div class="tipo-buscar-fila">' +
          '<input id="' + o.prefijo + '-buscar" class="campo" autocomplete="off" ' +
            'placeholder="Escribe para buscar un tipo" aria-label="Buscar un tipo de asunto">' +
          '<button type="button" class="boton" id="' + o.prefijo + '-dejar" ' +
            'title="Dejar el tipo que había" aria-label="Dejar el tipo que había">✕</button>' +
        '</div>' +
        '<div class="resultados tipo-buscar-resultados" id="' + o.prefijo + '-resultados"></div>' +
        '<div id="' + o.prefijo + '-crear"></div>';
      var input = caja.querySelector('#' + o.prefijo + '-buscar');
      var lista = caja.querySelector('#' + o.prefijo + '-resultados');
      var activo = -1;

      function marcar(i) {
        var items = lista.querySelectorAll('.tipo-resultado');
        activo = items.length ? (i + items.length) % items.length : -1;
        Array.prototype.forEach.call(items, function (el, k) { el.classList.toggle('tipo-resultado-activo', k === activo); });
        if (items[activo] && items[activo].scrollIntoView) items[activo].scrollIntoView({ block: 'nearest' });
      }

      function pintar() {
        lista.innerHTML = '';
        activo = -1;
        var texto = input.value;
        var zona = caja.querySelector('#' + o.prefijo + '-crear');
        zona.innerHTML = '';
        if (!U.limpiarNombre(texto)) return;
        var cat = o.categoria ? o.categoria() : null;
        var hallados = buscar(texto, cat);
        hallados.slice(0, MAXIMO).forEach(function (t) {
          var d = document.createElement('div');
          d.className = 'resultado tipo-resultado';
          d.dataset.tipo = t.tipo;
          d.innerHTML = U.escapar(t.tipo) + '<span class="resultado-categoria">' + U.escapar(t.categoria) + '</span>';
          d.onclick = function () { elegir(t); };
          lista.appendChild(d);
        });
        if (hallados.length > MAXIMO) {
          var mas = document.createElement('div');
          mas.className = 'nota tipo-resultado-mas';
          mas.textContent = 'y ' + (hallados.length - MAXIMO) + ' más: sigue escribiendo';
          lista.appendChild(mas);
        } else if (!hallados.length && !o.alCrear) {
          var vacio = document.createElement('div');
          vacio.className = 'vacio';
          vacio.textContent = 'Ningún tipo se parece a eso.';
          lista.appendChild(vacio);
        }
        if (o.alCrear) {
          BuscarOCrear.pintarZona({
            zona: zona, texto: texto, deTipos: true,
            nombres: (App.E.tipos || []).map(function (t) { return t.tipo; }),
            detalle: function (n) { var t = objeto(n); return t ? t.categoria : ''; },
            ver: function (n) { var t = objeto(n); if (t) elegir(t); },
            crear: function (n) { o.alCrear(n); }
          });
        }
      }

      input.oninput = pintar;
      input.onkeydown = function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); marcar(activo + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(activo < 0 ? -1 : activo - 1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          var items = lista.querySelectorAll('.tipo-resultado');
          var el = items[activo >= 0 ? activo : 0];
          if (el) el.click();
        }
      };
      caja.querySelector('#' + o.prefijo + '-dejar').onclick = pintarLinea;

      /* Esc cierra solo la búsqueda, no el cuadro entero: se atiende
         antes que el Escape general (js/usabilidad.js). */
      quitarEsc();
      cierraConEsc = function (e) {
        if (e.key !== 'Escape') return;
        /* Si el cuadro ya se ha cerrado o cambiado por otro, este oyente sobra. */
        if (!caja.isConnected || caja.offsetParent === null) { quitarEsc(); return; }
        e.stopPropagation();
        e.preventDefault();
        pintarLinea();
      };
      document.addEventListener('keydown', cierraConEsc, true);
      input.focus();
    }

    pintarLinea();

    return {
      tipo: function () { return estado.tipo; },
      abierta: function () { return estado.buscando; },
      poner: function (nombre) { estado.tipo = nombre; if (!estado.buscando) pintarLinea(); }
    };
  }

  /* «Ninguno es el que busco: crear «…»» desde «Cambiar el asunto»,
     con el cuadro de edición ya cerrado (ver App.editarAsunto): parecidos,
     categoría (la del tipo que tenía, cambiable) y App.crearTipo.
     Devuelve el nombre del tipo creado, o null si se ha dejado. */
  async function crearDesdeEdicion(nombre, categoriaPropuesta) {
    var elegido = null;
    var parecidos = await TiposParecidos.confirmarNombre(nombre, {
      boton: 'Usar este', seguir: 'Crear de todas formas', alPulsar: function (t) { elegido = t; }
    });
    if (elegido) return elegido.tipo;   /* «Usar este»: ese tipo queda elegido y no se crea ninguno */
    if (!parecidos) return null;
    var categoria = await BuscarOCrear.preguntarCategoria(nombre, categoriaPropuesta || Nombres.CATEGORIAS[0]);
    if (!categoria) return null;
    var t = await App.crearTipo({ nombre: nombre, categoria: categoria, parecidos: parecidos });
    U.aviso('Tipo añadido.', 'bueno');
    return t.tipo;
  }

  /* «Nuevo asunto» con el tipo ya reconocido (App.nuevoAsuntoCon con
     `tipo`): en vez del buscador y la parrilla, la línea «Tipo de asunto:
     X · Cambiar». Se repinta desde App.pintarTipos; mientras se está
     buscando no se toca. «Nuevo asunto» en blanco no pasa por aquí. */
  var controlNuevo = null;
  App.pintarLineaDeTipo = function () {
    var caja = document.getElementById('tipo-linea-nuevo');
    var bloque = document.getElementById('bloque-tipos');
    if (!caja || !bloque) return;
    var activa = !!(App.E.nuevo && App.E.nuevo.tipoEnLinea && App.E.nuevo.tipo);
    bloque.classList.toggle('tipo-en-linea', activa);
    caja.classList.toggle('oculto', !activa);
    if (!activa) { caja.innerHTML = ''; controlNuevo = null; return; }
    if (controlNuevo && controlNuevo.abierta()) return;
    controlNuevo = montar(caja, {
      prefijo: 'nuevo-tipo', rotulo: 'Tipo de asunto:', tipo: App.E.nuevo.tipo,
      categoria: function () { return App.categoriaDeLaParrilla ? App.categoriaDeLaParrilla() : null; },
      alElegir: function (t) { App.elegirTipo(t); }
    });
  };

  return { montar: montar, buscar: buscar, crearDesdeEdicion: crearDesdeEdicion };
})();
