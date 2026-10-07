/* ============================================================
   perfil-ajustes.js — la sección «Quién usa la aplicación» de Ajustes →
   El centro (7-oct-2026, fila 287, docs/PERFIL-DIRECTIVO.md, apartado 2).

   Una fila por nombre de `usuarios.json`: nombre, desplegable «Perfil»
   (Administración, Dirección, Secretaría, Jefatura de Estudios) y «Correo»
   (opcional). Se guarda al cambiar, sin botón «Guardar». «+ Añadir persona»
   escribe un nombre nuevo en `usuarios.json`. Solo la ve Administración (un
   directivo no tiene Ajustes). Como js/hitos-ajustes.js: se cuelga solo.
   ============================================================ */
var PerfilAjustes = (function () {

  function $(id) { return document.getElementById(id); }

  function bloque() {
    var ya = $('bloque-perfiles');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-centro');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-perfiles';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Quién usa la aplicación</span>' +
        '<span class="bloque-pie" id="perfiles-pie"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Cada nombre de la lista de entrada es de Administración (lo de siempre) o de uno de los ' +
        'órganos del centro. Quien entra con un nombre de Dirección, Secretaría o Jefatura de Estudios ve solo ' +
        'Inicio y Archivo, con los asuntos de su órgano, y no cambia nada.</p>' +
        '<div id="tabla-perfiles" class="lista"></div>' +
        '<div class="alta-tipo">' +
          '<input id="nueva-persona-perfil" class="campo" placeholder="NOMBRE" style="max-width:260px">' +
          '<button type="button" id="btn-anadir-persona-perfil" class="boton">+ Añadir persona</button>' +
        '</div>' +
      '</div>';
    pantalla.appendChild(d);
    $('btn-anadir-persona-perfil').onclick = anadir;
    return d;
  }

  async function pintar() {
    if (!bloque() || !window.Perfil || !window.Usuarios) return;
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g) return;
    await Perfil.cargar();
    var nombres = await Usuarios.cargar(g);
    var caja = $('tabla-perfiles');
    if (!caja) return;
    $('perfiles-pie').textContent = Perfil.resumen(nombres);
    caja.innerHTML = '';
    if (!nombres.length) { caja.innerHTML = '<div class="vacio">Todavía no ha entrado nadie.</div>'; return; }
    nombres.forEach(function (n) {
      var f = document.createElement('div');
      f.className = 'fila-tipo perfil-fila';
      f.dataset.nombre = n;
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(n) + '</span>' +
        '<select class="campo perfil-elegir" title="Perfil">' + Perfil.PERFILES.map(function (p) {
          return '<option value="' + p.valor + '"' + (Perfil.perfilDe(n) === p.valor ? ' selected' : '') + '>' + U.escapar(p.texto) + '</option>';
        }).join('') + '</select>' +
        '<input class="campo perfil-correo" placeholder="Correo (opcional)" value="' + U.escapar(Perfil.correoDe(n)) + '">';
      var sel = f.querySelector('.perfil-elegir'), cor = f.querySelector('.perfil-correo');
      sel.onchange = function () { cambiar(n, { perfil: sel.value }); };
      cor.onchange = function () { cambiar(n, { correo: cor.value }); };
      caja.appendChild(f);
    });
  }

  async function cambiar(nombre, cambios) {
    try { await Perfil.guardar(nombre, cambios); }
    catch (e) { U.fallo('No he podido guardarlo', e); }
    pintar();
  }

  async function anadir() {
    var campo = $('nueva-persona-perfil');
    var nombre = (campo && campo.value || '').trim();
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!nombre || !g) return;
    try { await Usuarios.anadirSiHaceFalta(g, nombre); campo.value = ''; }
    catch (e) { U.fallo('No he podido añadirla', e); return; }
    pintar();
  }

  function enganchar() {
    if (!window.Gestor) return;
    Gestor.alRefrescar.push(function () {
      if (window.App && App.pantallaALaVista && !App.pantallaALaVista('ajustes')) return;
      if (Gestor.carpetaGestor() && !(window.Perfil && Perfil.esDirectivo())) pintar();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar); else enganchar();

  return { pintar: pintar, bloque: bloque };
})();
window.PerfilAjustes = PerfilAjustes;
