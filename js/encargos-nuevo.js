/* ============================================================
   encargos-nuevo.js — la pantalla «Nuevo encargo» del directivo (7-oct-2026,
   fila 289, docs/ENCARGOS-DE-DIRECTIVOS.md, apartado 2).

   Cuatro cosas, a todo el ancho y sin desplazamiento: «¿Qué necesitas?»
   (obligatorio), «¿A quién afecta?» (el buscador de «Nuevo asunto», que enseña
   solo el nombre y, en el alumnado, su unidad; «No está en la lista» deja
   escribirlo), «¿Para cuándo?» y «Documentos». «Enviar el encargo» guarda por
   `Perfil.escribir` (js/encargos.js) y pasa a «Mis encargos». Si falla, lo
   escrito se queda en el cuadro.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  App.PANTALLAS.push('encargo-nuevo');

  var afecta = null;      /* { nombre, categoria, clave, unidad } | { texto } | null */
  var ficheros = [];      /* los File elegidos */
  var temporizador = null;
  var turno = 0;

  function construir() {
    var contenido = document.querySelector('main.contenido');
    if (!contenido || $('pantalla-encargo-nuevo')) return;
    var s = document.createElement('section');
    s.id = 'pantalla-encargo-nuevo';
    s.className = 'pantalla oculto';
    s.innerHTML =
      '<header class="cabecera"><h2>Nuevo encargo</h2></header>' +
      '<p class="explica">Dile a Administración lo que necesitas. Ellos lo convierten en asunto y tú ves en «Mis encargos» cómo va.</p>' +
      '<div class="encargo-nuevo">' +
        '<div class="encargo-columna">' +
          '<label class="etiqueta" for="encargo-texto">¿Qué necesitas?</label>' +
          '<textarea id="encargo-texto" class="campo" placeholder="Cuéntalo con tus palabras."></textarea>' +
          '<p id="encargo-error" class="encargo-error oculto" role="alert"></p>' +
        '</div>' +
        '<div class="encargo-columna">' +
          '<label class="etiqueta" for="encargo-buscar">¿A quién afecta? <span class="suave">(opcional)</span></label>' +
          '<div id="encargo-afecta-elegido" class="encargo-elegido oculto"></div>' +
          '<div id="encargo-afecta-buscar">' +
            '<input id="encargo-buscar" class="campo" autocomplete="off" placeholder="Busca por nombre">' +
            '<div id="encargo-resultados" class="encargo-resultados"></div>' +
            '<button type="button" id="encargo-a-mano" class="enlace" data-puerta-perfil="1">No está en la lista</button>' +
            '<input id="encargo-afecta-texto" class="campo oculto" placeholder="Escribe a quién afecta">' +
          '</div>' +
          '<label class="etiqueta" for="encargo-para">¿Para cuándo? <span class="suave">(opcional)</span></label>' +
          '<input type="date" id="encargo-para" class="campo">' +
          '<label class="etiqueta">Documentos <span class="suave">(opcional)</span></label>' +
          '<div id="encargo-soltar" class="encargo-soltar">Suelta aquí los ficheros o ' +
            '<button type="button" id="encargo-elegir" class="enlace" data-puerta-perfil="1">elígelos</button>' +
            '<input type="file" id="encargo-ficheros" multiple class="oculto">' +
            '<ul id="encargo-lista-ficheros" class="encargo-ficheros"></ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="encargo-pie"><button type="button" id="encargo-enviar" class="boton boton-principal" data-puerta-perfil="1">Enviar el encargo</button></div>';
    contenido.appendChild(s);

    $('encargo-buscar').oninput = function () { clearTimeout(temporizador); temporizador = setTimeout(buscar, 180); };
    $('encargo-a-mano').onclick = function () { $('encargo-afecta-texto').classList.remove('oculto'); $('encargo-afecta-texto').focus(); };
    $('encargo-afecta-texto').oninput = function () {
      var t = $('encargo-afecta-texto').value.trim();
      afecta = t ? { texto: t } : null;
    };
    $('encargo-elegir').onclick = function () { $('encargo-ficheros').click(); };
    $('encargo-ficheros').onchange = function (ev) { anadir(ev.target.files); ev.target.value = ''; };
    var soltar = $('encargo-soltar');
    soltar.ondragover = function (ev) { ev.preventDefault(); soltar.classList.add('encima'); };
    soltar.ondragleave = function () { soltar.classList.remove('encima'); };
    soltar.ondrop = function (ev) { ev.preventDefault(); soltar.classList.remove('encima'); anadir(ev.dataTransfer && ev.dataTransfer.files); };
    $('encargo-enviar').onclick = function () { return U.mientrasGuarda($('encargo-enviar'), enviar); };
  }

  function anadir(lista) {
    Array.prototype.forEach.call(lista || [], function (f) { ficheros.push(f); });
    pintarFicheros();
  }

  function pintarFicheros() {
    var ul = $('encargo-lista-ficheros');
    ul.innerHTML = '';
    ficheros.forEach(function (f, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + U.escapar(f.name) + '</span> ';
      var quitar = document.createElement('button');
      quitar.type = 'button'; quitar.className = 'enlace'; quitar.textContent = 'Quitar'; quitar.setAttribute('data-puerta-perfil', '1');
      quitar.onclick = function () { ficheros.splice(i, 1); pintarFicheros(); };
      li.appendChild(quitar);
      ul.appendChild(li);
    });
  }

  /* El buscador de «Nuevo asunto» (App.buscarEnCategorias), con el resultado reducido a lo que necesita un directivo. */
  async function buscar() {
    var texto = $('encargo-buscar').value;
    var caja = $('encargo-resultados');
    var mio = ++turno;
    if (U.normalizar(texto).length < 2) { caja.innerHTML = ''; return; }
    var porCategoria = await App.buscarEnCategorias(texto, Nombres.CATEGORIAS.slice(), 5);
    if (mio !== turno) return;
    caja.innerHTML = '';
    var hay = false;
    porCategoria.forEach(function (c) {
      c.resultados.forEach(function (p) {
        hay = true;
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'encargo-resultado';
        d.setAttribute('data-puerta-perfil', '1');
        d.dataset.nombre = p.nombre;
        d.textContent = p.nombre + (c.categoria === 'ALUMNADO' && p.unidad ? ' · ' + p.unidad : '');
        d.onclick = function () { elegir({ nombre: p.nombre, categoria: c.categoria, clave: String(p.id || p.documento || p.nif || ''), unidad: c.categoria === 'ALUMNADO' ? String(p.unidad || '') : '' }); };
        caja.appendChild(d);
      });
    });
    if (!hay) caja.innerHTML = '<div class="vacio">Nadie con ese nombre en la lista.</div>';
  }

  function elegir(a) {
    afecta = a;
    $('encargo-afecta-buscar').classList.add('oculto');
    var caja = $('encargo-afecta-elegido');
    caja.classList.remove('oculto');
    caja.innerHTML = '<strong>' + U.escapar(a.nombre) + (a.unidad ? ' · ' + U.escapar(a.unidad) : '') + '</strong> ';
    var cambiar = document.createElement('button');
    cambiar.type = 'button'; cambiar.className = 'enlace'; cambiar.textContent = 'Cambiar'; cambiar.setAttribute('data-puerta-perfil', '1');
    cambiar.onclick = function () { dejarSinElegir(); $('encargo-buscar').focus(); };
    caja.appendChild(cambiar);
  }

  function dejarSinElegir() {
    afecta = null;
    $('encargo-afecta-elegido').classList.add('oculto');
    $('encargo-afecta-buscar').classList.remove('oculto');
    $('encargo-buscar').value = '';
    $('encargo-resultados').innerHTML = '';
    $('encargo-afecta-texto').value = '';
    $('encargo-afecta-texto').classList.add('oculto');
  }

  function decir(texto) {
    var p = $('encargo-error');
    p.textContent = texto || '';
    p.classList.toggle('oculto', !texto);
  }

  async function enviar() {
    var texto = $('encargo-texto').value.trim();
    if (!texto) {
      decir('Escribe qué necesitas.');
      $('encargo-texto').focus();
      return;
    }
    decir('');
    try {
      await Encargos.enviar({ texto: texto, afecta: afecta, paraCuando: $('encargo-para').value, ficheros: ficheros.slice() });
    } catch (e) {
      U.fallo('No he podido enviar el encargo', e);   /* lo escrito se queda en el cuadro */
      return;
    }
    U.aviso('Encargo enviado a Administración.', 'bueno');
    limpiar();
    if (window.EncargosMios) EncargosMios.abrir();
  }

  function limpiar() {
    $('encargo-texto').value = '';
    $('encargo-para').value = '';
    ficheros = [];
    pintarFicheros();
    dejarSinElegir();
    decir('');
  }

  function abrir() {
    App.ir('encargo-nuevo');
    var t = $('encargo-texto');
    if (t) t.focus();
  }

  construir();
  var pestana = document.querySelector('.pestana[data-pantalla="encargo-nuevo"]');
  if (pestana) pestana.onclick = abrir;

  window.EncargosNuevo = { abrir: abrir, _limpiar: limpiar };
})();
