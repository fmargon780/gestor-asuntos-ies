/* ============================================================
   encargos-mios.js — la pantalla «Mis encargos» del directivo (7-oct-2026,
   fila 289, docs/ENCARGOS-DE-DIRECTIVOS.md, apartado 3).

   Una tabla con sus encargos, del más nuevo al más viejo: Fecha, Qué pedí
   (pulsarlo lo enseña entero con sus documentos), A quién afecta, Para cuándo
   y Cómo va: «Sin atender» (con «Retirar»), «En marcha · Hito N de M · título»
   (pulsarlo abre la ficha del asunto, en consulta), «Terminado» y «No procede:
   motivo». Se pone al día con el vistazo periódico (Encargos.alCambiar).
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  App.PANTALLAS.push('encargos-mios');

  var abiertos = {};     /* los encargos con su texto desplegado, por id */

  function construir() {
    var contenido = document.querySelector('main.contenido');
    if (!contenido || $('pantalla-encargos-mios')) return;
    var s = document.createElement('section');
    s.id = 'pantalla-encargos-mios';
    s.className = 'pantalla oculto';
    s.innerHTML = '<header class="cabecera"><h2>Mis encargos</h2></header>' +
      '<div id="encargos-mios-cuerpo"></div>';
    contenido.appendChild(s);
  }

  function visible() { return !!$('pantalla-encargos-mios') && !$('pantalla-encargos-mios').classList.contains('oculto'); }

  function resumen(texto) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    return t.length > 90 ? t.slice(0, 88).trim() + '…' : t;
  }

  function textoAfecta(e) {
    if (!e.afecta) return '';
    if (e.afecta.texto) return e.afecta.texto;
    return e.afecta.nombre + (e.afecta.unidad ? ' · ' + e.afecta.unidad : '');
  }

  async function abrirDocumento(e, nombre) {
    try {
      var carpeta = await Encargos.carpetaDe(e.id);
      if (!carpeta) { U.aviso('Ese documento ya no está.', 'ambar'); return; }
      var f = await (await carpeta.getFileHandle(nombre)).getFile();
      if (window.Lector) Lector.abrir({ titulo: nombre, pie: 'Encargo del ' + Encargos.fechaLegible(e.cuando), blob: f });
    } catch (err) { U.aviso('No he podido abrir el documento: ' + U.mensajeDeError(err), 'ambar'); }
  }

  function detalle(e) {
    var tr = document.createElement('tr');
    tr.className = 'encargo-detalle';
    var td = document.createElement('td');
    td.colSpan = 5;
    var html = '<div class="encargo-texto-entero">' + U.escapar(e.texto) + '</div>';
    if (e.documentos.length) html += '<div class="encargo-docs">Documentos: </div>';
    td.innerHTML = html;
    var cajaDocs = td.querySelector('.encargo-docs');
    e.documentos.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'enlace encargo-doc'; b.textContent = n;
      b.onclick = function () { abrirDocumento(e, n); };
      cajaDocs.appendChild(b);
      cajaDocs.appendChild(document.createTextNode(' '));
    });
    tr.appendChild(td);
    return tr;
  }

  function celdaComoVa(e) {
    var td = document.createElement('td');
    td.className = 'encargo-estado encargo-estado-' + e.estado;
    if (e.estado === 'sin-atender') {
      td.appendChild(document.createTextNode(Encargos.TEXTO_ESTADO[e.estado] + ' '));
      var r = document.createElement('button');
      r.type = 'button'; r.className = 'boton'; r.textContent = 'Retirar'; r.setAttribute('data-puerta-perfil', '1');
      r.onclick = function () { retirar(e, r); };
      td.appendChild(r);
    } else if (e.estado === 'asunto') {
      var a = Encargos.asuntoDe(e);
      var h = a ? Encargos.hitoDe(a.nombre) : null;
      var texto = Encargos.TEXTO_ESTADO.asunto + (h ? ' · Hito ' + h.n + ' de ' + h.m + (h.titulo ? ' · ' + h.titulo : '') : '');
      if (a && a.abierto) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'enlace'; b.textContent = texto; b.setAttribute('data-puerta-perfil', '1');
        b.onclick = function () {
          var abierto = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === a.nombre; })[0];
          if (!abierto) return;
          if (window.Navegacion) Navegacion.trasVolverA('encargos-mios');
          App.abrirFicha(abierto, 'abierto');
        };
        td.appendChild(b);
      } else td.textContent = texto;
    } else if (e.estado === 'terminado') {
      td.textContent = Encargos.TEXTO_ESTADO.terminado;
    } else {
      td.textContent = Encargos.TEXTO_ESTADO['no-procede'] + (e.motivo ? ': ' + e.motivo : '');
    }
    return td;
  }

  async function retirar(e, boton) {
    await U.mientrasGuarda(boton, async function () {
      try {
        if (!(await Encargos.retirar(e.id))) U.aviso('Administración ya lo ha cogido: no se puede retirar.', 'ambar');
      } catch (err) { U.fallo('No he podido retirar el encargo', err); }
    });
  }

  async function pintar() {
    var caja = $('encargos-mios-cuerpo');
    if (!caja) return;
    if (window.Hitos && Hitos.leer && !(Hitos.ultimosLeidos && Hitos.ultimosLeidos())) { try { await Hitos.leer(); } catch (e) { /* sin hitos: solo «En marcha» */ } }
    var lista = Encargos.deDirectivo(App.E.usuario);
    if (!lista.length) {
      caja.innerHTML = '<div class="vacio">Todavía no has hecho ningún encargo. Empieza por «Nuevo encargo».</div>';
      return;
    }
    var tabla = document.createElement('table');
    tabla.className = 'tabla encargos-tabla';
    tabla.innerHTML = '<thead><tr><th>Fecha</th><th>Qué pedí</th><th>A quién afecta</th><th>Para cuándo</th><th>Cómo va</th></tr></thead>';
    var cuerpo = document.createElement('tbody');
    lista.forEach(function (e) {
      var tr = document.createElement('tr');
      tr.dataset.encargo = e.id;
      tr.dataset.estado = e.estado;
      tr.innerHTML = '<td>' + U.escapar(Encargos.fechaLegible(e.cuando)) + '</td>';
      var tdQue = document.createElement('td');
      var que = document.createElement('button');
      que.type = 'button'; que.className = 'enlace encargo-que'; que.textContent = resumen(e.texto);
      que.setAttribute('data-puerta-perfil', '1');
      que.onclick = function () { if (abiertos[e.id]) delete abiertos[e.id]; else abiertos[e.id] = true; pintar(); };
      tdQue.appendChild(que);
      tr.appendChild(tdQue);
      tr.insertAdjacentHTML('beforeend', '<td>' + U.escapar(textoAfecta(e)) + '</td><td>' + U.escapar(Encargos.fechaLegible(e.paraCuando)) + '</td>');
      tr.appendChild(celdaComoVa(e));
      cuerpo.appendChild(tr);
      if (abiertos[e.id]) cuerpo.appendChild(detalle(e));
    });
    tabla.appendChild(cuerpo);
    caja.innerHTML = '';
    caja.appendChild(tabla);
  }

  function abrir() {
    App.ir('encargos-mios');
    return pintar();
  }

  construir();
  Encargos.alCambiar.push(function () { if (visible()) pintar(); });
  var pestana = document.querySelector('.pestana[data-pantalla="encargos-mios"]');
  if (pestana) pestana.onclick = abrir;
  /* Con la ficha de un asunto abierta desde aquí, «Volver» llega a esta pantalla sin pasar por `abrir`. */
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { if (visible()) pintar(); });

  window.EncargosMios = { abrir: abrir, pintar: pintar };
})();
