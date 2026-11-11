/* ============================================================
   demo/datos.js — el juego de datos inventados de la copia de pruebas
   (fila 222, docs/COPIA-DE-PRUEBAS.md).

   Nada se fabrica a mano en el formato interno de la aplicación: los
   CSV de Séneca (RegAlum, RelPerCen) se escriben directos, como los
   escribiría de verdad la exportación del centro, pero los tipos, las
   guías, las plantillas y los propios asuntos se crean llamando a las
   MISMAS funciones que usan las pantallas (`App.crearTipo`,
   `GuiasDelCentro.guardarPasos`, `App.anotar`, `Hitos.marcar`,
   `Plantillas.guardar`...), para no arriesgarse a escribir un JSON que
   luego la aplicación no reconozca.

   Nombres, empresas y demás son inventados a propósito: ningún dato
   real de ninguna persona.

   `Demo.datos.construir()` se llama UNA vez, justo después de "entrar"
   con las carpetas de mentira ya activas (App.E.gestor / App.E.abiertos
   / App.E.archivo ya puestos por el paso normal de entrada). No hace
   falta volver a llamarla: "Volver a empezar" recarga la página entera
   (`Demo.reiniciar()`), y con el disco vacío todo se vuelve a construir
   desde cero.
   ============================================================ */
(function () {
  'use strict';

  window.Demo = window.Demo || {};
  window.Demo.datos = window.Demo.datos || {};
  /* Fila 560: las piezas que se cargan antes (datos-ficheros, datos-tipos, datos-resto, datos-asuntos) dejan aquí lo suyo. */
  var I = window.Demo.datos._interno = window.Demo.datos._interno || {};
  var hace = I.hace;
  var escribirDatos = I.escribirDatos;
  var crearTipos = I.crearTipos;
  var crearPlantillas = I.crearPlantillas;
  var crearTipoConGuia = I.crearTipoConGuia;
  var crearAsunto = I.crearAsunto;
  var crearFichaSinCarpeta = I.crearFichaSinCarpeta;
  var crearAsuntosAbiertos = I.crearAsuntosAbiertos;
  var crearArchivados = I.crearArchivados;
  var crearTablon = I.crearTablon;
  var crearPapelera = I.crearPapelera;
  var crearSueltos = I.crearSueltos;
  var crearBandeja = I.crearBandeja;

  /* ---------- todo junto ---------- */

  var construido = false;

  async function construir(disco) {
    if (construido) return;
    construido = true;
    window.Demo = window.Demo || {};
    window.Demo.montando = true;   /* fila 284: ninguna pasada de fondo recarga la app a mitad del montaje */
    try { await montar(disco); } finally { window.Demo.montando = false; }
  }

  async function montar(disco) {
    /* La entrada normal ya ha sembrado tipos.json con Nombres.POR_DEFECTO
       (fichero vacío la primera vez): se vacía antes de poner los tipos
       propios de la demo, para no mezclar treinta y tantos tipos reales
       con los cuatro inventados. */
    App.E.tipos = [];
    await Carpetas.guardarJson(App.E.gestor, App.FICHERO_TIPOS, []);
    await escribirDatos();
    /* Fila 375: el teléfono y el correo del centro, como si ya vinieran del Centro de datos (sin señalar su carpeta). */
    try {
      if (window.CentroDeDatos) await CentroDeDatos.apuntarConfiguracion({ actualizado: '', actualizadoPor: '', tomadoEl: new Date().toISOString(), vienen: [], telefono: '958000000', direccionDelCentro: 'secretaria@centro-demo.es', web: '' });
    } catch (e) { /* sin esos dos datos, los huecos salen en blanco */ }
    /* Fila 249: quien ocupa Secretaría, para «Recibe» al liquidar. */
    try { if (window.Cargos) await Cargos.anadirOcupante('secretaria', 'Fernando Reyes Palma', '2020-09-01', 'H'); } catch (e) { /* sin cargo, «Recibe» sale vacío */ }
    try { if (window.Demo.cargos) await Demo.cargos.escribir(); } catch (e) { /* sin cargos de Dirección */ }   /* fila 330 */
    /* La entrada normal ya ha podido leer (y guardar en caché, vacíos)
       los CSV de personas al pintar Inicio, antes de que estos
       existieran: se tira esa caché para que la próxima lectura sí los
       encuentre. */
    if (window.Datos && Datos.olvidar) Datos.olvidar();
    var tipos = await crearTipos();
    await crearPlantillas();
    if (window.Demo.plantillasPantalla) await Demo.plantillasPantalla.construir();   /* fila 320: plantillas de Word para la pantalla «Plantillas» */
    await crearAsuntosAbiertos(tipos);
    await crearArchivados(tipos);
    if (window.Demo.grupo) await Demo.grupo.construir({ tipo: tipos['CERTIFICADO DE NOTAS'], crearAsunto: crearAsunto, hace: hace });   /* fila 293 */
    if (window.Demo.actividades) await Demo.actividades.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 306 */
    if (window.Demo.biblioteca) await Demo.biblioteca.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 297 */
    if (window.Demo.tutor) await Demo.tutor.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 299 */
    if (window.Demo.orden) await Demo.orden.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 300 */
    if (window.Demo.soloSi) await Demo.soloSi.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 576 */
    if (window.Demo.baja) await Demo.baja.construir({ crearTipoConGuia: crearTipoConGuia, crearAsunto: crearAsunto, hace: hace });   /* fila 592 */
    var sinCarpeta = await crearFichaSinCarpeta(tipos);   /* fila 288: «Problemas» tiene algo que enseñar */
    if (window.Demo.problemas) await Demo.problemas.construir(tipos, sinCarpeta);   /* fila 291: y más (js/demo/datos-problemas.js) */
    await crearTablon();
    await crearPapelera();
    await crearSueltos();
    await crearBandeja(disco);
    /* Fila 284: la copia de pruebas lleva festivos puestos (sin ellos, la pasada avisa en ámbar de que faltan). */
    await Hitos.guardarFestivos(['2026-10-12', '2026-12-08', '2026-12-25', '2027-01-01', '2027-01-06']);
    /* Fila 284: la pasada de los plazos legales, ya con la guía de arriba montada (sale su línea verde). */
    if (window.PlazosDelCentro) {
      var plazos = await PlazosDelCentro.pasada({ forzar: true });
      if (plazos) PlazosDelCentro.avisar(plazos);
    }
    if (window.Demo.baja) await Demo.baja.alAcabar();   /* fila 592: BAJA pasa a BAJA MATRICULA (antes de recargar) */
    /* Fila 285: ya recargado, la pasada que coloca el PDF sellado (sale «1 listos para enviar»). */
    if (window.Gestor && Gestor.recargar) await Gestor.recargar();
    if (window.Demo.libros) await Demo.libros.construir();   /* fila 501: ?libros=1 */
    if (window.Demo.copiaAlumnado) await Demo.copiaAlumnado.construir();   /* fila 324: ?copiaalumnado= (al final: «Problemas» envejece el RegAlum) */
    if (window.Demo.tutor) await Demo.tutor.alAcabar();   /* fila 299: «Informar al tutor/a» (antes que la pasada de abajo, para no coincidir con ella) */
    if (window.Demo.hacer) await Demo.hacer.alAcabar();
  }

  window.Demo.datos.construir = construir;
})();
