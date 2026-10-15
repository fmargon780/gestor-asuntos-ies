/* ============================================================
   plantilla-va-a-revision.js — la revisión única de las plantillas de correo que ya existen
   (15-oct-2026, fila 348, docs/CORREO-AL-TUTOR-DEL-GRUPO.md, apartado 5).

   Una sola vez, al entrar tras publicar la fila 348: a cada plantilla de correo sin «Va a:» se le pone el que le toca
   (`PlantillaVaA.deducir`: el nombre habla del tutor o tutora → «El tutor o tutora del grupo»; sin tipo de asunto →
   «Quien lo pide»; el resto → «La familia»), y a las del tutor se les pone «Buenas:» de saludo si ya traían uno.
   Después sale un cuadro con la lista: cada plantilla, su «Va a» y un desplegable para cambiarlo ahí mismo (se guarda
   al cambiar); «Hecho» lo cierra. No vuelve a salir: la marca vive en `_GESTOR/plantillas-va-a.json` (compartido por los
   dos ordenadores), no en `localStorage`. En «solo consultar» no hace nada y espera a otra entrada. En la copia de
   pruebas no se lanza sola (cambiaría las plantillas de todas las pruebas): se abre con el botón «A quién va cada
   plantilla» de Herramientas → Plantillas, que hace lo mismo cuantas veces haga falta.
   ============================================================ */
var PlantillaVaARevision = (function () {

  var FICHERO = 'plantillas-va-a.json';
  var corriendo = false;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }
  function soloConsulta() { return !!(window.SoloConsulta && SoloConsulta.activo()); }
  function gestor() { return window.App && App.E && App.E.gestor; }

  async function leerMarca() {
    try { return (await Carpetas.leerJson(gestor(), FICHERO)) || {}; } catch (e) { return {}; }
  }

  async function ponerMarca() {
    var hacer = async function () {
      await Copias.guardar(gestor(), FICHERO, { revisada: U.hoyIso(), por: App.E.usuario || '' });
    };
    return App.enFila ? App.enFila(FICHERO, hacer) : hacer();
  }

  /* A las plantillas de correo sin «Va a:», el que les toca. Devuelve las que ha tocado. */
  async function aplicar() {
    var tocadas = [];
    await Plantillas.guardar(gestor(), function (actual) {
      (actual.lista || []).forEach(function (p) {
        if (PlantillaVaA.valido(p.vaA)) return;
        p.vaA = PlantillaVaA.deducir(p);
        if (p.vaA === 'tutor') p.texto = PlantillaVaA.conSaludoBuenas(p.texto);
        tocadas.push(p.id);
      });
      return actual;
    });
    return tocadas;
  }

  /* ---------- el cuadro con la lista ---------- */

  function tablaHtml(lista) {
    if (!lista.length) return '<p class="explica">Todavía no hay ninguna plantilla de correo.</p>';
    return '<table class="pt-tabla va-a-tabla"><thead><tr><th>Plantilla</th><th>Tipo de asunto</th><th>Va a</th></tr></thead><tbody>' +
      lista.map(function (p) {
        return '<tr data-id="' + esc(p.id) + '"><td>' + esc(p.nombre) + '</td><td>' + (p.tipo ? esc(p.tipo) : '<span class="suave">Cualquier tipo</span>') + '</td><td>' +
          '<select class="campo va-a-select" aria-label="A quién va ' + esc(p.nombre) + '"' + (soloConsulta() ? ' disabled' : '') + '>' +
          PlantillaVaA.ORDEN.map(function (v) { return '<option value="' + v + '"' + (v === p.vaA ? ' selected' : '') + '>' + esc(PlantillaVaA.texto(v)) + '</option>'; }).join('') +
          '</select></td></tr>';
      }).join('') + '</tbody></table>';
  }

  async function guardarUno(id, vaA) {
    await Plantillas.guardar(gestor(), function (actual) {
      var p = (actual.lista || []).filter(function (x) { return x.id === id; })[0];
      if (p) {
        p.vaA = vaA;
        if (vaA === 'tutor') p.texto = PlantillaVaA.conSaludoBuenas(p.texto);
      }
      return actual;
    });
  }

  /* Enseña la lista. Se queda hasta que se pulsa «Hecho». */
  async function mostrar() {
    var datos = await Plantillas.cargar(gestor());
    var lista = (datos.lista || []).slice().sort(function (a, b) { return U.normalizar(a.nombre) < U.normalizar(b.nombre) ? -1 : 1; });
    var promesa = U.preguntar('A quién va cada plantilla de correo',
      '<p class="explica">Al preparar un correo con una plantilla, «Para» se rellena solo con esto. Cámbialo aquí si alguna no va a quien dice; se guarda al cambiar.</p>' +
      '<div id="va-a-lista">' + tablaHtml(lista) + '</div>', 'Hecho', true);
    Array.prototype.forEach.call(document.querySelectorAll('#va-a-lista .va-a-select'), function (s) {
      s.onchange = async function () {
        var id = s.closest('tr').getAttribute('data-id');
        try { await guardarUno(id, s.value); U.aviso('Guardado.', 'bueno'); }
        catch (e) { U.fallo('No he podido guardarlo', e); }
      };
    });
    await promesa;
  }

  /* La revisión de verdad: aplica, deja la marca y enseña la lista. `forzar`: desde el botón, sin mirar la marca. */
  async function pasada(forzar) {
    if (corriendo || !gestor() || !window.Plantillas || !window.PlantillaVaA) return false;
    if (soloConsulta()) return false;
    corriendo = true;
    try {
      if (!forzar && (await leerMarca()).revisada) return false;
      var capa = $('capa');
      if (!forzar && capa && !capa.classList.contains('oculto')) return false;   /* hay otro cuadro abierto: otra entrada */
      var tocadas = await aplicar();
      if (!forzar) await ponerMarca();
      /* Sin ninguna plantilla de correo no hay nada que enseñar. */
      if (!forzar && !tocadas.length && !((await Plantillas.cargar(gestor())).lista || []).length) return true;
      await mostrar();
      if (window.PlantillasPantalla && PlantillasPantalla.recargar) { try { PlantillasPantalla.recargar(); } catch (e0) { /* solo pintar */ } }
      return true;
    } finally { corriendo = false; }
  }

  /* Al entrar: en segundo plano, nunca con un guardado en marcha; no en la copia de pruebas. */
  var yaMirado = false;
  function alEntrar() {
    if (yaMirado || !gestor() || !window.Gestor || !Gestor.carpetaGestor()) return;
    if (/[?&]demo=1/.test(String(location.search)) || (window.Demo && typeof Demo.montando === 'boolean')) return;   /* la copia de pruebas */
    yaMirado = true;
    var intentos = 0;
    (function turno() {
      setTimeout(async function () {
        if (window.ColaGuardado && ColaGuardado.hayGuardado() && ++intentos < 10) return turno();
        try { await pasada(false); }
        catch (e) { U.accesorio('No he podido revisar a quién va cada plantilla de correo', e); }
      }, 6000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return { FICHERO: FICHERO, pasada: pasada, aplicar: aplicar, mostrar: mostrar, leerMarca: leerMarca };
})();
window.PlantillaVaARevision = PlantillaVaARevision;
