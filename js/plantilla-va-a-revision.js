/* ============================================================
   plantilla-va-a-revision.js — el paso, una sola vez, de «Va a:» a los papeles de cada plantilla de correo
   (6-nov-2026, fila 555, docs/555-A-QUIEN-VA-CADA-CORREO.md; sustituye a la revisión con lista de la fila 348).

   Al entrar tras publicar la fila 555, a cada plantilla de correo se le pasa su «Va a:» a papeles (`PlantillaPapeles.migrar`):
   «La familia» → Para: Tutores legales (tipos de alumnado) o El interesado; «El tutor o tutora» → Para: Tutor/a del grupo con
   saludo «Buenas:»; «Quien lo pide» → Para: Quien lo pide; sin «Va a» → sin papeles. Sin lista de revisión. No vuelve a salir:
   la marca vive en `_GESTOR/plantillas-papeles.json` (compartido por los dos ordenadores), no en `localStorage`. En «solo
   consultar» no hace nada y espera a otra entrada. En la copia de pruebas no se lanza sola.
   ============================================================ */
var PlantillaVaARevision = (function () {

  var FICHERO = 'plantillas-papeles.json';
  var corriendo = false;

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

  /* Pasa a papeles las plantillas que aún no lo están. Devuelve las que ha tocado. */
  async function aplicar() {
    var tocadas = [];
    await Plantillas.guardar(gestor(), function (actual) {
      (actual.lista || []).forEach(function (p) { if (PlantillaPapeles.migrar(p)) tocadas.push(p.id); });
      return actual;
    });
    return tocadas;
  }

  /* `forzar`: sin mirar la marca. */
  async function pasada(forzar) {
    if (corriendo || !gestor() || !window.Plantillas || !window.PlantillaPapeles) return false;
    if (soloConsulta()) return false;
    corriendo = true;
    try {
      if (!forzar && (await leerMarca()).revisada) return false;
      await aplicar();
      if (!forzar) await ponerMarca();
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
        catch (e) { U.accesorio('No he podido pasar las plantillas de correo a los destinatarios nuevos', e); }
      }, 6000);
    })();
  }
  if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(alEntrar);

  return { FICHERO: FICHERO, pasada: pasada, aplicar: aplicar, leerMarca: leerMarca };
})();
window.PlantillaVaARevision = PlantillaVaARevision;
