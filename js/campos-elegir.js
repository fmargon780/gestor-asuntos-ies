/* ============================================================
   campos-elegir.js — la ventana de «Campo variable» (fila 528,
   docs/528-LISTA-DE-CAMPOS.md, puntos 8 a 10). Sustituye al buscador
   pequeño de js/huecos-buscador.js, que sigue siendo quien monta el
   botón y mete el texto donde estaba el cursor (`HuecosBuscador.montar`).

   Arriba: buscador en todos los grupos (campo, tabla o columna) y los
   campos más usados en ese tipo de asunto. A la izquierda, los grupos;
   en el centro, los campos del grupo, cada uno con un ejemplo y su
   tabla. Primero salen los que sirven para la clase de persona del
   tipo; los demás, tras «Ver N de otra clase de persona». Abajo,
   «+ Campo manual nuevo» y «+ Crear a partir de otros»: el campo se
   crea sin salir de la plantilla y queda insertado.

   CamposElegir.abrir({ tipo: 'nombre del tipo' | función, alElegir(campo) })
   ============================================================ */
var CamposElegir = (function () {

  var abierto = null;

  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  function categoriaDelTipo(nombre) {
    var q = U.normalizar(nombre || '');
    if (!q) return '';
    var t = ((window.App && App.E && App.E.tipos) || []).filter(function (x) { return U.normalizar(x.tipo || '') === q; })[0];
    return t ? t.categoria : '';
  }

  function cerrar() {
    if (!abierto) return;
    var a = abierto;
    abierto = null;
    document.removeEventListener('keydown', a.tecla, true);
    if (a.capa.parentNode) a.capa.parentNode.removeChild(a.capa);
  }

  /* Los campos que más se usan en las plantillas de ese tipo, de más a menos (solo los que se usan de verdad). */
  function masUsados(lista, textos, tipo) {
    var q = U.normalizar(tipo || '');
    var propios = textos.filter(function (t) { return !q || U.normalizar(t.tipo || '') === q; });
    return lista.map(function (c) {
      var m = U.normalizar(c.marca);
      return { c: c, n: propios.filter(function (t) { return U.normalizar(t.texto).indexOf(m) !== -1; }).length };
    }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6).map(function (x) { return x.c; });
  }

  async function abrir(ctx) {
    cerrar();
    var tipo = typeof ctx.tipo === 'function' ? ctx.tipo() : (ctx.tipo || '');
    var categoria = categoriaDelTipo(tipo);
    var entrada = await CamposListaDatos.entrada();
    var lista = CamposLista.reunir(entrada);
    var personas = await CamposListaDatos.personas(categoria === 'PERSONAL' ? 'PERSONAL' : 'ALUMNADO');
    var persona = personas[0];
    var usados = masUsados(lista, entrada.textos, tipo);
    var st = { q: '', g: 'Persona', verOtros: false, modo: 'lista', sel: 0 };

    var capa = document.createElement('div');
    capa.className = 'capa capa-campos';
    capa.innerHTML = '<div class="cuadro cuadro-campos" role="dialog" aria-modal="true" aria-label="Elegir un campo"></div>';
    document.body.appendChild(capa);
    var cuadro = capa.firstChild;

    function tecla(ev) {
      if (ev.key !== 'Escape') return;
      ev.preventDefault(); ev.stopPropagation();
      cerrar();
    }
    document.addEventListener('keydown', tecla, true);
    abierto = { capa: capa, tecla: tecla };
    capa.addEventListener('mousedown', function (ev) { if (ev.target === capa) cerrar(); });

    function elegir(campo) { cerrar(); ctx.alElegir(campo); }
    function porId(id) { return lista.filter(function (c) { return c.id === id; })[0]; }

    /* Los ejemplos se calculan una vez, al abrir: así filtrar al escribir es inmediato y Enter elige siempre lo que se ve. */
    var ejemplos = {};
    for (var i = 0; i < lista.length; i++) ejemplos[lista[i].id] = await CamposListaDatos.ejemplo(lista[i], persona);

    function pintar() {
      var q = st.q.trim();
      var visibles = q ? CamposLista.buscar(lista, q) : lista.filter(function (c) { return c.grupo === st.g; });
      var buenos = visibles.filter(function (c) { return CamposLista.sirveParaClase(c, categoria); });
      var otros = visibles.filter(function (c) { return !CamposLista.sirveParaClase(c, categoria); });
      function fila(c) {
        var ej = ejemplos[c.id];
        return '<button type="button" class="campos-fila-campo" data-id="' + esc(c.id) + '"><span class="campos-fila-nombre">' + esc(c.nombre) +
          (q ? ' <span class="suave pequeno">· ' + esc(c.grupo) + '</span>' : '') + '</span>' +
          '<span class="campos-fila-ej suave pequeno">' + (ej ? '→ ' + esc(ej) : '<em>sin dato</em>') + '</span>' +
          '<span class="campos-etq' + (c.origen === 'Manual' ? ' etq-manual' : c.origen === 'Calculado' ? ' etq-calculado' : '') + '">' + esc(CamposLista.rutaCorta(c) || c.origen) + '</span></button>';
      }
      var centro;
      if (st.modo === 'manual') centro = '<div id="ce-manual"></div>';
      else if (st.modo === 'calculado') centro = '<div id="ce-calculado"></div>';
      else {
        centro = (buenos.length ? buenos.map(fila).join('') : (otros.length ? '' : '<p class="suave" style="margin:6px">' + (q ? 'Ningún campo con ese nombre. Puedes crearlo abajo.' : 'Este grupo no tiene campos.') + '</p>')) +
          (otros.length ? (st.verOtros ? '<p class="suave pequeno" style="margin:10px 6px 2px">Son de otra clase de persona: en este tipo pueden salir vacíos.</p>' + otros.map(fila).join('')
            : '<button type="button" class="boton" id="ce-ver-otros" style="margin-top:8px">Ver ' + otros.length + ' de otra clase de persona</button>') : '');
      }
      cuadro.innerHTML =
        '<div class="campos-elegir-cab"><div class="campos-elegir-titulo"><h3>Elegir un campo</h3>' + (tipo ? '<span class="suave pequeno">para ' + esc(tipo) + '</span>' : '') +
        '<button type="button" class="boton" id="ce-cerrar" style="margin-left:auto">Cerrar</button></div>' +
        '<input type="search" id="ce-buscar" class="campo" placeholder="Buscar por campo, tabla o columna" aria-label="Buscar por campo, tabla o columna" autocomplete="off" value="' + esc(st.q) + '">' +
        '<div class="campos-elegir-usados"><span class="suave pequeno">Los más usados en este tipo:</span> ' +
        (usados.length ? usados.map(function (c) { return '<button type="button" class="campos-pastilla" data-id="' + esc(c.id) + '">' + esc(c.nombre) + '</button>'; }).join('') : '<span class="suave pequeno">todavía ninguno</span>') + '</div></div>' +
        '<div class="campos-elegir-cuerpo"><div class="campos-elegir-grupos">' +
        CamposLista.GRUPOS.map(function (g) {
          var n = lista.filter(function (c) { return c.grupo === g && CamposLista.sirveParaClase(c, categoria); }).length;
          return '<button type="button" class="campos-grupo' + (!q && st.g === g && st.modo === 'lista' ? ' on' : '') + '" data-g="' + esc(g) + '"><span>' + esc(g) + '</span><span>' + n + '</span></button>';
        }).join('') + '</div><div class="campos-elegir-centro" id="ce-centro">' + centro + '</div></div>' +
        '<div class="campos-elegir-pie"><span class="suave pequeno">' + (persona ? 'Ejemplos con ' + esc(persona.nombre) : '') + '</span>' +
        '<span><button type="button" class="boton" id="ce-nuevo-manual">+ Campo manual nuevo</button> <button type="button" class="boton" id="ce-nuevo-calculado">+ Crear a partir de otros</button></span></div>';

      var b = cuadro.querySelector('#ce-buscar');
      b.oninput = function () { st.q = b.value; st.modo = 'lista'; st.sel = 0; pintar(); var n = cuadro.querySelector('#ce-buscar'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      var ordenVisible = buenos.concat(st.verOtros ? otros : []);
      var filas = cuadro.querySelectorAll('.campos-fila-campo');
      function marcar(i) {
        if (!ordenVisible.length) return;
        st.sel = (i + ordenVisible.length) % ordenVisible.length;
        Array.prototype.forEach.call(filas, function (f, n) { f.classList.toggle('elegido', n === st.sel); });
        if (filas[st.sel] && filas[st.sel].scrollIntoView) filas[st.sel].scrollIntoView({ block: 'nearest' });
      }
      marcar(st.sel < ordenVisible.length ? st.sel : 0);
      b.onkeydown = function (ev) {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); marcar(st.sel + 1); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); marcar(st.sel - 1); }
        else if (ev.key === 'Enter') { ev.preventDefault(); if (ordenVisible[st.sel]) elegir(ordenVisible[st.sel]); }
      };
      cuadro.querySelector('#ce-cerrar').onclick = cerrar;
      Array.prototype.forEach.call(cuadro.querySelectorAll('[data-id]'), function (x) { x.onclick = function () { elegir(porId(x.getAttribute('data-id'))); }; });
      Array.prototype.forEach.call(cuadro.querySelectorAll('.campos-grupo'), function (x) { x.onclick = function () { st.g = x.getAttribute('data-g'); st.q = ''; st.modo = 'lista'; st.verOtros = false; st.sel = 0; pintar(); }; });
      var vo = cuadro.querySelector('#ce-ver-otros');
      if (vo) vo.onclick = function () { st.verOtros = true; pintar(); };
      cuadro.querySelector('#ce-nuevo-manual').onclick = function () { st.modo = 'manual'; pintar(); };
      cuadro.querySelector('#ce-nuevo-calculado').onclick = function () { st.modo = 'calculado'; pintar(); };
      if (st.modo === 'manual') {
        CamposManualNuevo.pintar(cuadro.querySelector('#ce-manual'), {
          textoCrear: 'Crear e insertar',
          existentes: function () { return lista; },
          alCrear: function (p) { cerrar(); ctx.alElegir({ nombre: p.nombre, marca: CamposLista.marcaDeCampo(p.nombre), id: 'p:' + p.id }); },
          alCancelar: function () { st.modo = 'lista'; pintar(); }
        });
      } else if (st.modo === 'calculado') {
        /* Hasta la fila 529, el editor de siempre. */
        CamposCalculadosEditor.abrir(cuadro.querySelector('#ce-calculado'), {
          existente: null,
          alGuardar: function (cal) { cerrar(); ctx.alElegir({ nombre: cal.nombre, marca: CamposLista.marcaDeCampo(cal.nombre), id: 'c:' + cal.id }); },
          alCancelar: function () { st.modo = 'lista'; pintar(); }
        });
      } else {
        var enfocar = cuadro.querySelector('#ce-buscar');
        if (enfocar && !pintar.yaEnfocado) { enfocar.focus(); pintar.yaEnfocado = true; }
      }
    }
    pintar();
  }

  return { abrir: abrir, cerrar: cerrar, categoriaDelTipo: categoriaDelTipo };
})();
window.CamposElegir = CamposElegir;
