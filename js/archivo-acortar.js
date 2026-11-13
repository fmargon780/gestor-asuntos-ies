/* ============================================================
   archivo-acortar.js — el botón «Acortar las carpetas del archivo» de Herramientas (fila 648,
   docs/648-CARPETAS-ARCHIVADAS-MAS-CORTAS.md).

   Cuenta las carpetas archivadas con número que todavía llevan el nombre de la persona detrás, avisa de que la otra
   persona tiene que estar fuera de la app y de que Google Drive tardará un rato, y las acorta de una en una
   (`ArchivoNombreCorto.acortarUna`, que relee cada carpeta antes de tocarla). Las que no puede se quedan como estaban
   y se dicen al final, con su persona y el motivo. Si se corta a medias, se vuelve a pulsar y sigue con las que faltan.
   ============================================================ */
var ArchivoAcortar = (function () {

  var TITULO = 'Acortar las carpetas del archivo';
  var corriendo = false;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function cuadroDeAviso(lista) {
    return '<p>Hay <strong>' + plural(lista.length, 'carpeta archivada', 'carpetas archivadas') + '</strong> con número que ' +
      'todavía llevan el nombre de la persona detrás. Dentro de la carpeta de cada persona ya se sabe de quién es, así que ' +
      'se les quita ese nombre para acortar las rutas.</p>' +
      '<p class="aviso aviso-ambar">La otra persona que use el Gestor tiene que estar fuera de la aplicación mientras ' +
      'dura. Google Drive tardará un rato en ponerse al día en los dos ordenadores.</p>' +
      '<p class="nota">Si se corta a medias, se vuelve a pulsar y sigue con las que faltan.</p>';
  }

  function cuadroDeResultado(hechas, fallos, cortado) {
    var html = '<p>' + (hechas === 1 ? 'Se ha acortado 1 carpeta.' : 'Se han acortado ' + hechas + ' carpetas.') + '</p>';
    if (cortado) html += '<p class="aviso aviso-ambar">' + esc(cortado) + '</p>';
    if (fallos.length) {
      html += '<p class="aviso aviso-ambar">' + (fallos.length === 1 ? 'Esta no ha podido y se queda como estaba:' :
        'Estas ' + fallos.length + ' no han podido y se quedan como estaban:') + '</p><ul>' +
        fallos.map(function (f) {
          return '<li><strong>' + esc(f.tercero) + '</strong> · ' + esc(f.nombre) + ': ' + esc(f.motivo) + '</li>';
        }).join('') + '</ul>';
    }
    return html;
  }

  async function acortar() {
    if (corriendo) return;
    if (window.SoloConsulta && SoloConsulta.activo()) {
      U.aviso('Este ordenador está en «solo consulta»: no se puede acortar ninguna carpeta del archivo.', 'ambar');
      return;
    }
    if (!App.E.archivo) { U.aviso('Primero hay que señalar la carpeta ARCHIVO.', 'ambar'); return; }
    corriendo = true;
    var boton = $('acortar-archivo-boton'), progreso = $('acortar-archivo-progreso');
    try {
      if (boton) boton.disabled = true;
      var lista;
      try { lista = await ArchivoNombreCorto.pendientes(); }
      catch (e) { U.fallo('No he podido mirar las carpetas del archivo', e); return; }
      if (!lista.length) {
        await U.preguntar(TITULO, '<p>No queda ninguna carpeta por acortar.</p>', 'Entendido', true);
        return;
      }
      var ok = await U.preguntar(TITULO, cuadroDeAviso(lista), 'Acortar las ' + lista.length + ' carpetas');
      if (!ok) return;

      var hechas = 0, fallos = [], cortado = '';
      if (progreso) progreso.classList.remove('oculto');
      for (var i = 0; i < lista.length; i++) {
        if (progreso) progreso.textContent = 'Acortando… ' + (i + 1) + ' de ' + lista.length;
        try {
          var r = await ArchivoNombreCorto.acortarUna(lista[i].padre, lista[i].categoria, lista[i].nombre);
          if (r.estado === 'acortada') hechas++;
        } catch (e) {
          if (window.SoloConsulta && SoloConsulta.esError && SoloConsulta.esError(e)) {
            cortado = 'Este ordenador ha pasado a «solo consulta»: no se ha tocado nada más. Quedan por acortar ' +
              (lista.length - i) + '.';
            break;
          }
          fallos.push({ tercero: lista[i].tercero, nombre: lista[i].nombre, motivo: U.mensajeDeError(e) });
        }
      }
      if (progreso) progreso.classList.add('oculto');
      await U.preguntar(TITULO, cuadroDeResultado(hechas, fallos, cortado), 'Entendido', true);
      try { if (typeof App.verArchivo === 'function' && App.E.listaArchivo) App.E.listaArchivo = null; } catch (e) { /* solo refrescar */ }
    } finally {
      corriendo = false;
      if (boton) boton.disabled = false;
      if (progreso) progreso.classList.add('oculto');
    }
  }

  function montar() {
    var puesta = $('herramientas-puesta-cuerpo');
    if (!puesta || $('bloque-acortar-archivo')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-acortar-archivo';
    det.innerHTML = '<summary><span class="bloque-titulo">' + TITULO + '</span>' +
      '<span class="bloque-pie">Quita el nombre de la persona de las carpetas archivadas con número</span></summary>' +
      '<div class="bloque-cuerpo"><p class="explica">Una carpeta archivada con número ya está dentro de la carpeta de su persona; ' +
      'con este botón se les quita el nombre de la persona a las que todavía lo llevan, para que las rutas salgan más cortas. ' +
      'Las de antes de tener número no se tocan.</p>' +
      '<button type="button" class="boton" id="acortar-archivo-boton" data-solo-lectura>' + TITULO + '</button>' +
      '<div id="acortar-archivo-progreso" class="explica oculto"></div></div>';
    puesta.appendChild(det);
    $('acortar-archivo-boton').onclick = acortar;
  }

  function arrancar() { montar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

  return { acortar: acortar, montar: montar, TITULO: TITULO };
})();
window.ArchivoAcortar = ArchivoAcortar;
