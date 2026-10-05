/* ============================================================
   tercero-cambiar-datos.js — cambiar los datos de un tercero dado de
   alta a mano (sacado de js/archivo-personas.js en la fila 266, que lo
   amplía: desde la ficha del asunto y con las carpetas siguiendo al
   nuevo texto, js/tercero-renombrar.js).
   ============================================================ */
(function () {
  function $(id) { return document.getElementById(id); }

/* ---------- cambiar los datos de un tercero ----------

   Hasta el 10-sep-2026 un tercero se daba de alta y ya no se podía
   tocar. En cuanto apareció el nombre comercial de las empresas eso
   dejó de valer: las que ya estaban dadas de alta no tenían dónde
   ponerlo, y la única salida habría sido abrir el CSV a mano. Justo lo
   que no queremos.

   **Solo los dados de alta a mano.** Lo que viene de Séneca no se toca
   desde aquí: se corrige en Séneca y se vuelve a descargar el fichero,
   o el cambio se perdería en la siguiente descarga. */

App.sePuedeCambiarElTercero = function (p) {
  if (!p || !p.categoria) return false;
  if (!Datos.LISTAS[p.categoria]) return false;
  if (p.categoria === 'ALUMNADO' && !p.solicitante) return false;   /* el matriculado viene de Séneca (fila 266) */
  return p.deSeneca !== true;
};

/* Fila 266: se llama desde Personas y empresas y desde la ficha de un
   asunto: un solo camino. Si cambia el texto del tercero (App.textoTercero),
   antes de guardar nada se enseña la lista de carpetas que cambian
   (js/tercero-renombrar.js) y, con «Adelante», se guardan los datos y se
   renombran. Devuelve { nombres: { viejo: nuevo } } (los asuntos abiertos
   que han cambiado de nombre) o null si no se ha guardado nada. */
App.cambiarDatosDelTercero = async function (p, boton) {
  var def = Datos.LISTAS[p.categoria];
  var nombreAntes = p.nombre;

  var valores = {};
  def.cabecera.forEach(function (c) { valores[c] = (p.campos && p.campos[c]) || ''; });
  valores[def.cabecera[0]] = nombreAntes;

  var puestos = await App.cuadroDeTercero(
    p.categoria, valores, 'Cambiar los datos de ' + nombreAntes, 'Guardar los cambios');
  if (!puestos) return null;

  var info = {
    categoria: p.categoria, textoAntes: App.textoTercero(p),
    textoDespues: TerceroRenombrar.textoDeValores(p.categoria, puestos)
  };
  var cambiaElTexto = info.textoAntes !== info.textoDespues;

  /* Antes de guardar nada: la lista de carpetas que cambian. «Cancelar»: no se guarda nada. */
  var plan = { afectados: [], archivo: null };
  if (cambiaElTexto) {
    try { plan = await TerceroRenombrar.preparar(info); }
    catch (e0) { U.accesorio('No he podido mirar qué carpetas llevan su nombre', e0); }
    if (!(await TerceroRenombrar.preguntar(info, plan))) return null;
  }

  var guardada = null;
  try {
    guardada = await U.mientrasGuarda(boton || null, function () {
      return Datos.guardarEnLista(App.E.datos, p.categoria, nombreAntes, puestos);
    });
  } catch (e) {
    U.fallo('No he podido guardar el cambio', e);
    return null;
  }
  Datos.olvidar(p.categoria);

  var nombreNuevo = puestos[def.cabecera[0]] || nombreAntes;
  info.personaNueva = ((guardada && guardada.lista) || []).filter(function (x) {
    return U.normalizar(x.nombre) === U.normalizar(nombreNuevo);
  })[0] || null;

  var resultado = { renombrados: 0, saltados: [], fallos: [], nombres: {} };
  if (cambiaElTexto) {
    try { await U.mientrasGuarda(boton || null, async function () { resultado = await TerceroRenombrar.aplicar(info, plan); }); }
    catch (e2) { U.accesorio('Los datos están guardados, pero no he podido cambiar el nombre de las carpetas', e2); }
  }
  if (!resultado.fallos.length && !resultado.saltados.length) {
    U.aviso(resultado.renombrados
      ? 'Datos cambiados. ' + resultado.renombrados + ' carpeta' + (resultado.renombrados === 1 ? '' : 's') + ' con el nombre nuevo.'
      : 'Datos cambiados.', 'bueno');
  }

  /* Las listas de Inicio y de Personas, con el nombre nuevo. */
  if (cambiaElTexto && App.verAbiertos) { try { await App.verAbiertos(); } catch (e3) { /* se pondrá al día al recargar */ } }
  return { nombres: resultado.nombres, nombreNuevo: nombreNuevo };
};

/* Desde Personas y empresas: tras cambiar, la ficha de la persona se repinta. */
App.cambiarDatosDesdePersonas = async function (p) {
  var r = await App.cambiarDatosDelTercero(p, $('cambiar-tercero'));
  if (!r) return;
  await App.pintarPersonas();
  /* Fila 252: la ficha abierta se pone al día con lo que se acaba de guardar. */
  try {
    var nuevo = ((App.personasCargadas && App.personasCargadas.lista) || []).filter(function (x) { return x.nombre === r.nombreNuevo; })[0];
    if (nuevo) App.verFicha(nuevo);
  } catch (e) { /* la ficha se pondrá al día al elegir otra vez a la persona */ }
};
})();
