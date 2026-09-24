/* ============================================================
   hitos-ajustes.js — el bloque "Hitos" de Ajustes (16-sep-2026).

   Un bloque propio, sin tocar js/ajustes.js, como hicieron
   js/copias.js y js/papelera.js (y, más recientemente, el bloque
   "Conflictos de Dropbox" de js/conflictos.js, que sigue exactamente
   el mismo patrón: crea su <details> dentro de #pantalla-ajustes y se
   repinta enganchado a window.Gestor.alRefrescar).

   Dos cosas, las dos guardadas en `ajustes` dentro de hitos.json:

     1. Responsables: alta, baja y cambio de nombre de las personas del
        centro, y su marca "Administración" (fila 104). Los papeles (tercero/tutor/relacionado) se listan pero
        no se pueden tocar: los resuelve la aplicación sola.
     2. Días no lectivos: una caja de texto, una fecha por línea, en
        cualquiera de los formatos habituales (U.aFecha ya los admite:
        DD/MM/AAAA, DD-MM-AAAA o AAAA-MM-DD). Se guardan normalizadas.

   Se carga después de js/ajustes.js (y, en la práctica, después de
   js/hitos-archivo.js, que es quien añade a Hitos las funciones de
   guardar responsables y no lectivos).
   ============================================================ */
(function () {
  if (typeof window.Hitos === 'undefined') return;

  function $(id) { return document.getElementById(id); }

  function isoDeFecha(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  /* ---------- el bloque, creado una sola vez ---------- */

  function bloqueDeAjustes() {
    var ya = $('bloque-hitos');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña "El centro",
       no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-centro');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-hitos';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Hitos</span>' +
        '<span class="bloque-pie">Responsables, festivos y días no lectivos, para los hitos de los asuntos</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<h4 class="hitos-subtitulo">Responsables</h4>' +
        '<p class="explica">Personas del centro que pueden tener un hito en su tejado. Los papeles ' +
        '(el tercero del asunto, su tutor, un relacionado) se resuelven solos y no se pueden tocar.</p>' +
        '<div class="alta-tipo">' +
          '<input id="nuevo-responsable" class="campo" placeholder="NOMBRE" style="max-width:260px">' +
          '<button id="btn-anadir-responsable" class="boton">Añadir</button>' +
        '</div>' +
        '<div id="tabla-responsables" class="lista"></div>' +
        /* Fila 131 (docs/PLAZOS-BIEN-CONTADOS.md): los festivos, aparte. */
        '<h4 class="hitos-subtitulo">Festivos</h4>' +
        '<p class="explica">Una fecha por línea (DD/MM/AAAA). Nacionales, de Andalucía y locales. ' +
        'Cuentan para todos los plazos.</p>' +
        '<textarea id="hitos-festivos" class="campo" rows="5" ' +
        'placeholder="12/10/2026&#10;08/12/2026"></textarea>' +
        '<button id="btn-guardar-festivos" class="boton" style="margin-top:8px">Guardar festivos</button>' +
        '<div id="aviso-festivos" class="aviso-en-vivo"></div>' +
        '<h4 class="hitos-subtitulo">Días no lectivos</h4>' +
        '<p class="explica">Una fecha por línea (DD/MM/AAAA, o como te resulte cómodo). Vacaciones y ' +
        'días sin clase del calendario escolar. Solo cuentan para los plazos en días lectivos. Un ' +
        'festivo no hace falta repetirlo aquí. Se pega una vez por curso.</p>' +
        '<textarea id="hitos-no-lectivos" class="campo" rows="6" ' +
        'placeholder="24/12/2026&#10;25/12/2026"></textarea>' +
        '<button id="btn-guardar-no-lectivos" class="boton" style="margin-top:8px">Guardar días no lectivos</button>' +
        '<div id="aviso-no-lectivos" class="aviso-en-vivo"></div>' +
      '</div>';
    pantalla.appendChild(d);

    $('btn-anadir-responsable').onclick = anadirResponsable;
    $('nuevo-responsable').onkeydown = function (ev) { if (ev.key === 'Enter') anadirResponsable(); };
    $('btn-guardar-no-lectivos').onclick = guardarNoLectivos;
    $('btn-guardar-festivos').onclick = guardarFestivos;
    return d;
  }

  /* ---------- responsables ---------- */

  async function anadirResponsable() {
    var campo = $('nuevo-responsable');
    var nombre = (campo.value || '').trim();
    if (!nombre) return;
    var datos = await Hitos.leer();
    var nombres = datos.ajustes.responsables.map(function (r) { return r.nombre; });
    var ok = await U.dejaCrear(nombre, nombres, 'responsable');
    if (!ok) return;
    try {
      var id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
      await Hitos.anadirResponsable(id, nombre);
      campo.value = '';
      U.aviso('Responsable añadido.', 'bueno');
      pintar();
    } catch (e) {
      U.aviso('No he podido añadirlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function renombrar(r) {
    var ok = await U.preguntar('Cambiar el nombre',
      '<label class="etiqueta">Nombre</label>' +
      '<input id="responsable-nuevo-nombre" class="campo" value="' + U.escapar(r.nombre) + '">',
      'Guardar');
    if (!ok) return;
    var nombre = ($('responsable-nuevo-nombre') && $('responsable-nuevo-nombre').value.trim()) || '';
    if (!nombre || nombre === r.nombre) return;
    var datos = await Hitos.leer();
    var otros = datos.ajustes.responsables.filter(function (x) { return x.id !== r.id; }).map(function (x) { return x.nombre; });
    var vale = await U.dejaCrear(nombre, otros, 'responsable');
    if (!vale) return;
    try {
      await Hitos.renombrarResponsable(r.id, nombre);
      pintar();
    } catch (e) {
      U.aviso('No he podido cambiarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function quitar(r) {
    var ok = await U.preguntar('Quitar responsable',
      '<p><strong>' + U.escapar(r.nombre) + '</strong></p>' +
      '<p class="nota">Los hitos que ya lo tuvieran puesto se quedan como están, con su nombre.</p>',
      'Quitar');
    if (!ok) return;
    try {
      await Hitos.quitarResponsable(r.id);
      U.aviso('Responsable quitado.', 'bueno');
      pintar();
    } catch (e) {
      U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  function filaResponsable(r, esPapel) {
    var f = document.createElement('div');
    f.className = 'fila-tipo';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(r.nombre) + '</span>' +
      '<span class="suave" style="flex:1">' + (esPapel ? 'Papel · se resuelve solo · siempre terceros' : 'Persona del centro') + '</span>';
    if (!esPapel) {
      /* Fila 104: si es de Administración. Decide en qué montón de
         Asuntos abiertos sale un asunto cuyo hito abierto lo tiene él. */
      var etiqueta = document.createElement('label');
      etiqueta.className = 'interruptor interruptor-fila';
      etiqueta.title = 'Marcado: un asunto cuyo hito abierto lo tiene esta persona sale en ' +
        '"Pendiente de Administración". Sin marcar, en "Pendiente de terceros".';
      var casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.className = 'responsable-administracion';
      casilla.checked = !!r.administracion;
      casilla.onchange = async function () {
        try {
          await U.mientrasGuarda(casilla, function () { return Hitos.marcarAdministracion(r.id, casilla.checked); });
        } catch (e) {
          U.fallo('No he podido guardar la marca de Administración', e);
        }
        pintar();
      };
      etiqueta.appendChild(casilla);
      var texto = document.createElement('span');
      texto.textContent = 'Administración';
      etiqueta.appendChild(texto);
      f.appendChild(etiqueta);
      var ren = document.createElement('button');
      ren.type = 'button'; ren.className = 'boton'; ren.textContent = 'Renombrar';
      ren.onclick = function () { renombrar(r); };
      f.appendChild(ren);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'boton boton-peligro'; b.textContent = 'Quitar';
      b.onclick = function () { quitar(r); };
      f.appendChild(b);
    }
    return f;
  }

  /* ---------- festivos (fila 131) y días no lectivos ---------- */

  function fechasDeLaCaja(id) {
    var lineas = ($(id).value || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var vistos = {}, buenas = [], malas = 0;
    lineas.forEach(function (l) {
      var f = U.aFecha(l);
      if (!f || isNaN(f.getTime())) { malas++; return; }
      var iso = isoDeFecha(f);
      if (!vistos[iso]) { vistos[iso] = true; buenas.push(iso); }
    });
    return { buenas: buenas, malas: malas };
  }

  async function guardarFestivos() {
    var r = fechasDeLaCaja('hitos-festivos');
    try {
      await Hitos.guardarFestivos(r.buenas);
      $('aviso-festivos').textContent = r.buenas.length + (r.buenas.length === 1 ? ' festivo guardado.' : ' festivos guardados.') +
        (r.malas ? ' (' + r.malas + (r.malas === 1 ? ' línea no se ha entendido.)' : ' líneas no se han entendido.)') : '');
      U.aviso('Festivos guardados.', 'bueno');
      pintar();
    } catch (e) {
      U.fallo('No he podido guardarlos', e);
    }
  }

  async function guardarNoLectivos() {
    var texto = $('hitos-no-lectivos').value || '';
    var lineas = texto.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var vistos = {}, buenas = [], malas = 0;
    lineas.forEach(function (l) {
      var f = U.aFecha(l);
      if (!f || isNaN(f.getTime())) { malas++; return; }
      var iso = isoDeFecha(f);
      if (!vistos[iso]) { vistos[iso] = true; buenas.push(iso); }
    });
    try {
      await Hitos.guardarNoLectivos(buenas);
      var av = $('aviso-no-lectivos');
      av.textContent = buenas.length + ' día' + (buenas.length === 1 ? '' : 's') + ' no lectivo' +
        (buenas.length === 1 ? '' : 's') + ' guardado' + (buenas.length === 1 ? '' : 's') + '.' +
        (malas ? ' (' + malas + ' línea' + (malas === 1 ? '' : 's') + ' no se ha entendido.)' : '');
      U.aviso('Días no lectivos guardados.', 'bueno');
      pintar();
    } catch (e) {
      U.aviso('No he podido guardarlos: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- pintar ---------- */

  async function pintar() {
    var d = bloqueDeAjustes();
    if (!d) return;
    var caja = $('tabla-responsables');
    var datos;
    try { datos = await Hitos.leer(); }
    catch (e) {
      caja.innerHTML = '<div class="vacio">No he podido leer los hitos: ' + U.escapar(U.mensajeDeError(e)) + '</div>';
      return;
    }
    caja.innerHTML = '';
    datos.ajustes.responsables.forEach(function (r) { caja.appendChild(filaResponsable(r, false)); });
    Hitos.PAPELES.forEach(function (p) { caja.appendChild(filaResponsable(p, true)); });

    var caja2 = $('hitos-no-lectivos');
    if (caja2 && document.activeElement !== caja2) {
      caja2.value = datos.ajustes.noLectivos.map(function (iso) { return Plazos.legible(iso); }).join('\n');
    }
    var caja3 = $('hitos-festivos');
    if (caja3 && document.activeElement !== caja3) {
      caja3.value = (datos.ajustes.festivos || []).map(function (iso) { return Plazos.legible(iso); }).join('\n');
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    /* Solo con Ajustes a la vista (fila 101): si no, cada repintado de
       la lista releía hitos.json para nada. Al abrir Ajustes ya se pinta. */
    window.Gestor.alRefrescar.push(function () {
      var p = document.getElementById('pantalla-ajustes');
      if (p && p.classList.contains('oculto')) return;
      if (window.Gestor.carpetaGestor()) pintar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
