/* ============================================================
   datos-que-tengo-ver.js — el recuadro «Lo que tengo ahora» de
   Herramientas → «Traer el alumnado» (fila 319,
   docs/LO-QUE-TENGO-AHORA.md). El dato vive en js/datos-que-tengo.js.

   - Tabla a todo el ancho, una fila por fichero: qué es, de cuándo es
     (día y hora), cuántos trae, por dónde llegó y si hay otro más nuevo
     en alguna carpeta señalada de este ordenador.
   - Solo se calcula con el bloque abierto y a la vista, y el último
     repintado gana (contador de turno).
   - El pie del título del bloque dice las fechas sin abrirlo.
   - «Traerlo» y «Dar permiso» no piden nada solos: salen de una pulsación.
   ============================================================ */
var DatosQueTengoVer = (function () {

  var PIE_DE_ANTES = 'Ficheros de Séneca y datos de la base de datos de alumnado';
  var turno = 0;
  var anterioresAbiertos = false;
  var pieEn = 0;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(t); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function dia(v) { return DatosQueTengo.fechaHora(v).split(' · ')[0]; }

  function bloque() { return $('bloque-traer-alumnado'); }
  function abierto() { var b = bloque(); return !!(b && b.open && b.offsetParent); }

  /* «en el Centro de datos» / «en la carpeta de la base de datos de alumnado» */
  function enDonde(donde) { return 'en ' + (/^carpeta/.test(donde) ? 'la ' : 'el ') + donde; }

  function celdaMasNuevo(f, m) {
    if (!m) return '<span class="dqt-gris">Mirando…</span>';
    var apagado = soloConsulta() ? ' disabled' : '';
    if (m.estado === 'al-dia') return '<span class="dqt-verde">No. Mirado en: ' + esc((m.mirado || []).join(' y ')) + '.</span>';
    if (m.estado === 'mas-nuevo') {
      if (m.motivo) return '<span class="dqt-ambar">Sí, pero no vale: ' + esc(m.motivo) + '.</span>';
      return '<span class="dqt-ambar">Sí: ' + esc(enDonde(m.donde)) + ' hay uno del ' + esc(DatosQueTengo.fechaHora(m.fecha)) + '.</span>' +
        '<br><button type="button" class="boton" data-traer="' + esc(m.donde) + '"' + apagado + '>Traerlo</button>';
    }
    if (m.estado === 'sin-permiso') {
      return '<span class="dqt-ambar">No lo puedo mirar: el navegador pide otra vez el permiso de la carpeta.</span>' +
        '<br><button type="button" class="boton" data-dar-permiso="' + esc(m.id) + '"' + apagado + '>Dar permiso</button>';
    }
    if (m.estado === 'no-se-puede') return '<span class="' + (m.ambar ? 'dqt-ambar' : 'dqt-gris') + '">' + esc(m.frase || 'No lo puedo mirar ahora.') + '</span>';
    return '<span class="dqt-gris">No hay ninguna carpeta señalada en este ordenador. Se actualiza a mano, o lo trae el otro ordenador.</span>';
  }

  function filaHtml(f, m) {
    var nombre = '<strong>' + esc(f.titulo) + '</strong><span class="dqt-nombre">' + esc(f.nombre) + '</span>';
    if (!f.hay) {
      return '<tr data-fila="' + esc(f.id) + '"><td>' + nombre + '</td><td colspan="3" class="' + (f.id === 'alumnado' ? 'dqt-rojo' : 'dqt-gris') + '">Todavía no hay ninguno.</td>' +
        '<td>' + celdaMasNuevo(f, m) + '</td></tr>';
    }
    var fecha = f.fechaEsDeLaCopia ? 'En el gestor desde el ' + DatosQueTengo.fechaHora(f.fecha) : DatosQueTengo.fechaHora(f.fecha);
    return '<tr data-fila="' + esc(f.id) + '"><td>' + nombre + '</td><td>' + esc(fecha) + '</td><td>' + esc(f.cuantos) + '</td>' +
      '<td>' + esc(DatosQueTengo.porDondeLlego(f)) + '</td><td>' + celdaMasNuevo(f, m) + '</td></tr>';
  }

  function tablaHtml(filas, mirada) {
    var vigentes = filas.filter(function (f) { return !f.anterior; });
    var anteriores = filas.filter(function (f) { return f.anterior; });
    var html = vigentes.map(function (f) { return filaHtml(f, mirada && mirada[f.id]); }).join('');
    if (anteriores.length) {
      html += '<tr class="dqt-anteriores"><td colspan="5"><button type="button" class="enlace" id="dqt-anteriores">' +
        (anterioresAbiertos ? 'Ocultar los ' : 'y ') + anteriores.length + (anteriores.length === 1 ? ' fichero' : ' ficheros') + ' de cursos anteriores</button></td></tr>';
      if (anterioresAbiertos) html += anteriores.map(function (f) { return filaHtml(f, mirada && mirada[f.id]); }).join('');
    }
    return '<table class="dqt-tabla"><thead><tr><th>Qué</th><th>Fecha del fichero</th><th>Cuántos</th><th>Por dónde llegó</th><th>¿Hay otro más nuevo?</th></tr></thead><tbody>' + html + '</tbody></table>';
  }

  /* Plan del núcleo (fila 323): quién hace el alumnado de la base de datos depende de la copia. */
  function notas() {
    var cd = window.AlumnadoBD && AlumnadoBD.hechoPor(AlumnadoBD.enMemoria());
    return '<div class="dqt-notas">' +
      '<p>Para actualizar el alumnado o el personal: descarga el fichero de Séneca y pulsa «Traer ficheros de Séneca». No hay que guardarlo en ninguna carpeta concreta. ' +
      (cd ? 'El alumnado de la base de datos lo hace el Centro de datos, él solo: no hay que pulsar nada.'
          : 'El alumnado de la base de datos lo hace la base de datos de alumnado, al pulsar allí «Actualizar los datos».') + '</p>' +
      '<p>Solo puedo comparar con las carpetas señaladas en este ordenador. Si has cambiado algo en Séneca después de la fecha de la tabla, hay que volver a descargarlo.</p></div>';
  }

  function cabecera() {
    return '<div class="dqt-cabecera"><span class="dqt-titulo">Lo que tengo ahora</span>' +
      '<button type="button" class="boton" id="dqt-volver-a-mirar">Volver a mirar</button></div>';
  }

  /* ---------- las pulsaciones ---------- */

  function traerDe(donde) {
    return /^carpeta/.test(donde) ? AlumnadoBD.traer(true, true) : CentroDeDatos.traer({ avisar: true, pedir: true });
  }

  function enlazar(caja) {
    var mirar = $('dqt-volver-a-mirar');
    if (mirar) mirar.onclick = function () { DatosQueTengo.olvidarMirada(); return repintar(true); };
    var ant = $('dqt-anteriores');
    if (ant) ant.onclick = function () { anterioresAbiertos = !anterioresAbiertos; repintar(); };
    Array.prototype.forEach.call(caja.querySelectorAll('[data-traer]'), function (b) {
      b.onclick = function () {
        return U.mientrasGuarda(b, async function () { await traerDe(b.dataset.traer); DatosQueTengo.olvidarMirada(); await repintar(true); });
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-dar-permiso]'), function (b) {
      b.onclick = function () {
        var id = b.dataset.darPermiso;
        /* La petición sale dentro de la propia pulsación, sin esperas antes. */
        var pedido = window.PermisosCarpetas ? PermisosCarpetas.pedir(id) : Promise.resolve(false);
        return U.mientrasGuarda(b, async function () {
          if (await pedido) {
            U.aviso('Permiso dado a la carpeta ' + (id === 'alumnado' ? 'de la base de datos de alumnado' : 'del Centro de datos') + '.', 'bueno');
            await (id === 'alumnado' ? AlumnadoBD.traer(false, false) : CentroDeDatos.traer({ avisar: false, pedir: false }));
          } else U.aviso('Sin permiso no puedo mirar la carpeta ' + (id === 'alumnado' ? 'de la base de datos de alumnado' : 'del Centro de datos') + '.', 'ambar');
          DatosQueTengo.olvidarMirada();
          await repintar(true);
        });
      };
    });
  }

  /* ---------- pintar ---------- */

  async function repintar(fresco) {
    var caja = $('herramientas-lo-que-tengo');
    if (!caja || !abierto()) return;
    var mio = ++turno;
    if (window.ColaGuardado && ColaGuardado.hayGuardado && ColaGuardado.hayGuardado() && !fresco) { setTimeout(function () { repintar(); }, 1500); return; }
    var filas;
    try { filas = await DatosQueTengo.estado(); } catch (e) { return; }
    if (mio !== turno) return;
    var yaMirada = DatosQueTengo.enMemoriaLaMirada();
    caja.innerHTML = '<div class="dqt-caja">' + cabecera() + tablaHtml(filas, fresco ? null : yaMirada) + notas() + '</div>';
    enlazar(caja);
    pintarPie(filas, yaMirada);
    var mirada;
    try { mirada = await DatosQueTengo.mirarSiHayMasNuevo(!!fresco); } catch (e) { return; }
    if (mio !== turno) return;
    caja.innerHTML = '<div class="dqt-caja">' + cabecera() + tablaHtml(filas, mirada) + notas() + '</div>';
    enlazar(caja);
    pintarPie(filas, mirada);
  }

  /* El pie del título: «Alumnado del 9-oct-2026 · personal del 15-sep-2026» y, si ya se sabe, «· hay algo más nuevo». */
  function pintarPie(filas, mirada) {
    var b = bloque();
    var pie = b && b.querySelector('summary .bloque-pie');
    if (!pie) return;
    var alu = filas.filter(function (f) { return f.hay && (f.id === 'alumnado' || f.id === 'alumnado-bd'); })[0];
    var per = filas.filter(function (f) { return f.hay && f.clave === 'personal' && !f.anterior; })[0];
    var trozos = [];
    if (alu) trozos.push('Alumnado del ' + dia(alu.fecha));
    if (per) trozos.push((alu ? 'personal' : 'Personal') + ' del ' + dia(per.fecha));
    pie.textContent = trozos.length ? trozos.join(' · ') : PIE_DE_ANTES;
    var hay = mirada && Object.keys(mirada).some(function (k) { return mirada[k].estado === 'mas-nuevo' && !mirada[k].motivo; });
    if (hay) {
      var s = document.createElement('span');
      s.className = 'dqt-pie-ambar';
      s.textContent = ' · hay algo más nuevo';
      pie.appendChild(s);
    }
  }

  /* Con el bloque cerrado: solo las fechas (nada de mirar carpetas de fuera). */
  async function pieSolo() {
    var b = bloque();
    if (!b || !b.offsetParent || abierto() || !window.DatosQueTengo || !App.E || !App.E.datos) return;
    if (Date.now() - pieEn < 20000) return;
    pieEn = Date.now();
    try { pintarPie(await DatosQueTengo.estado(), DatosQueTengo.enMemoriaLaMirada()); } catch (e) { /* se queda como estaba */ }
  }

  function arrancar() {
    var b = bloque();
    if (b && !$('herramientas-lo-que-tengo')) {
      var hueco = document.createElement('div');
      hueco.id = 'herramientas-lo-que-tengo';
      var cuerpo = b.querySelector('.bloque-cuerpo');
      if (cuerpo) cuerpo.insertBefore(hueco, cuerpo.firstChild);
    }
    if (b) b.addEventListener('toggle', function () { if (b.open) repintar(); });
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(function () { if (abierto()) repintar(); else pieSolo(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  return { repintar: repintar };
})();
window.DatosQueTengoVer = DatosQueTengoVer;
