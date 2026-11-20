/* ============================================================
   demo/datos-aula.js — lo que necesita la fila 723 (docs/723-AULA-CONVIVENCIA-NOTA-Y-SEGUIMIENTO.md)
   en la copia de pruebas, solo con `?demo=1&auto=1&aula=1`:
     - el tipo «EXPULSIÓN AULA CONVICENCIA» (alumnado, alias «EXPULSIÓN CASA») con su guía genérica de
       antes y un asunto abierto suyo, con hitos;
     - al acabar de montar, la pasada de js/aula-convivencia.js (el tipo pasa a «Sin hitos», con sus dos
       datos, sus dos tipos de documento con recorrido, sus dos plantillas y su lista de tres tareas);
     - y dos asuntos nuevos de ese tipo: uno con «Primer día» y «Días lectivos» puestos y otro sin ellos.
   Todo inventado. `Demo.aula.construir({ crearTipoConGuia, crearAsunto, hace })` y `Demo.aula.alAcabar()`
   los llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  var o = null;

  function pedido() { return /(?:^|[?&])aula=1(?:&|$)/.test(location.search); }

  async function construir(opciones) {
    if (!pedido()) return;
    o = opciones;
    var tipo = await o.crearTipoConGuia('EXPULSIÓN AULA CONVICENCIA', 'ALUMNADO', [
      { id: 'ex-1', titulo: 'Tramitar', cuerpo: '<p>Preparar y enviar.</p>', responsable: 'yo' },
      { id: 'ex-2', titulo: 'Esperar respuesta', cuerpo: '<p>De la familia.</p>', responsable: 'yo' },
      { id: 'ex-3', titulo: 'Archivar', cuerpo: '<p>Cuando esté todo.</p>', responsable: 'yo' }
    ], null);
    tipo.alias = ['EXPULSIÓN CASA'];
    tipo.nombreCorto = 'EXPUL. AULA CONVICENCIA';
    await App.guardarTipos();
    await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Soto Lara, Daniel', id: '2100081' }), o.hace(12), { abiertoEl: o.hace(12) + 'T09:00:00.000Z' });
  }

  async function ponerDato(clave, nombreCampo, valor) {
    var campos = await Campos.leer(App.E.gestor);
    var propio = (campos.propios || []).filter(function (p) { return p.nombre === nombreCampo; })[0];
    if (!propio) return;
    await CampoDesdeElAsunto._i.escribirEnAsunto({ nombre: clave }, Campos.claveDeCampo({ origen: 'propio', id: propio.id }), { valor: valor });
  }

  /* Ya montado todo lo demás: la pasada, y los dos asuntos nuevos (ya con la guía de tres tareas). */
  async function alAcabar() {
    if (!pedido() || !window.AulaConvivencia || !o) return;
    var r = null;
    for (var i = 0; i < 40 && !r; i++) {   /* la pasada espera a que no haya un guardado en marcha */
      r = await AulaConvivencia.pasada({ forzar: true });
      if (!r) await new Promise(function (ok) { setTimeout(ok, 250); });
    }
    if (!r) return;
    var tipo = App.E.tipos.filter(function (t) { return t.tipo === 'EXPULSIÓN AULA CONVICENCIA'; })[0];
    var con = await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Rubio Vega, Marina', id: '2100082' }), o.hace(1), { abiertoEl: o.hace(1) + 'T09:00:00.000Z' });
    await o.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Lara Pardo, Hugo', id: '2100083' }), o.hace(0), { abiertoEl: o.hace(0) + 'T09:00:00.000Z' });
    await ponerDato(con, 'Primer día', '2026-11-23');
    await ponerDato(con, 'Días lectivos', '3');
    U.aviso('El tipo «' + r.tipo + '» ya lleva su guía de tareas, con la nota a la familia.', 'bueno');
  }

  window.Demo = window.Demo || {};
  window.Demo.aula = { construir: construir, alAcabar: alAcabar };
})();
