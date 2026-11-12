/* ============================================================
   campos-guardar.js — leer y guardar campos.json y los campos de un asunto (fila 536: trozo de js/campos.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/campos.js.
   ============================================================ */
var CamposNucleo = CamposNucleo || {};
(function () {

  var I = CamposNucleo;
  var FICHERO = I.FICHERO;
  function normalizarListaCalculados() { return I.normalizarListaCalculados.apply(this, arguments); }
  function normalizarCampoDeTipo() { return I.normalizarCampoDeTipo.apply(this, arguments); }
  function normalizarListaDeDocumento() { return I.normalizarListaDeDocumento.apply(this, arguments); }
  function normalizar() { return I.normalizar.apply(this, arguments); }
  var RECETA_CURSO_DE_FABRICA = I.RECETA_CURSO_DE_FABRICA;

  /* Lee el fichero de la carpeta del centro. Si no existe, o si no hay
     carpeta todavía (las pruebas de lógica, por ejemplo), se devuelve
     la forma vacía: así el resto del código no tiene que comprobar
     nada antes de usarla.

     La primera vez que se lee sin una receta calculada con id "curso"
     (fila 56, sección 7), se añade y se guarda, pero SOLO si el
     fichero ya existía: no se crea `campos.json` solo para esto. Si
     dos sesiones leen a la vez y las dos escriben, `guardarCalculados`
     relee antes de guardar y `normalizarListaCalculados` descarta el
     id repetido: como mucho se pisan la una a la otra, nunca queda
     "curso" duplicado. */
  async function leer(gestor) {
    if (!gestor) return normalizar(null);
    var leido = await Carpetas.leerJson(gestor, FICHERO);
    var normalizado = normalizar(leido);
    if (leido && !normalizado.calculados.some(function (c) { return c.id === 'curso'; })) {
      /* Escribe directo con Copias.guardar, sin pasar por
         guardarCalculados (que a su vez llama a leer()): así no hay
         ninguna recursión, y `leido` ya está fresco (se acaba de leer
         dos líneas más arriba, sin ningún `await` de por medio). */
      normalizado.calculados = normalizado.calculados.concat([RECETA_CURSO_DE_FABRICA]);
      try { await Copias.guardar(gestor, FICHERO, normalizado); }
      catch (e) { /* si no se puede guardar ahora, CALCULADOS sigue de respaldo (punto 7) */ }
    }
    return normalizado;
  }

  /* ---------- guardar ----------

     Como todo fichero compartido, se relee justo antes de escribir:
     dos ordenadores pueden estar tocando cosas distintas del mismo
     fichero. Cada función solo toca su propio trozo (los campos
     propios, o los campos de UN tipo), para que dos cambios sobre
     partes distintas no se pisen. */

  async function guardarPropios(gestor, mutar) {
    var actual = await leer(gestor);
    var lista = mutar(actual.propios.slice());
    actual.propios = normalizar({ propios: lista || actual.propios, porTipo: actual.porTipo }).propios;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* Gemela de `guardarPropios`, para los campos calculados (fila 56).
     Relee lo de verdad antes de escribir, y solo toca su propio
     trozo. */
  async function guardarCalculados(gestor, mutar) {
    var actual = await leer(gestor);
    var lista = mutar(actual.calculados.slice());
    actual.calculados = normalizarListaCalculados(lista || actual.calculados);
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* No se pone aquí en la cola de `campos.json` (`ColaGuardado`, fila
     99): `js/tipos-nombre.js` ya llama a esta función varias veces
     seguidas desde DENTRO de su propia fila (`App.enFila('campos.json',
     ...)`), y una cola dentro de otra cola del mismo fichero se
     bloquearía esperándose a sí misma (aviso de cola-guardado.js). Quien
     pueda llamarla varias veces seguidas sin ese envoltorio (fila 198,
     apartado 2: guardar en cada cambio de la sección Campos de
     js/ajustes-tipo.js) se pone en la cola él mismo, por fuera. */
  async function guardarConfigDeTipo(gestor, claveTipo, listaCampos) {
    var actual = await leer(gestor);
    actual.porTipo = actual.porTipo || {};
    if (listaCampos && listaCampos.length) {
      actual.porTipo[claveTipo] = listaCampos.map(normalizarCampoDeTipo);
    } else {
      delete actual.porTipo[claveTipo];
    }
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* Fila 629: qué datos de siempre pide al crear UN tipo (`datosAlCrear`). Relee antes de escribir y solo
     toca su trozo. Como `guardarConfigDeTipo`, quien lo llame seguido se pone en la cola de `campos.json`. */
  async function guardarDatosAlCrear(gestor, claveTipo, claves) {
    var actual = await leer(gestor);
    var mapa = Object.assign({}, actual.datosAlCrear || {});
    mapa[claveTipo] = claves || [];
    mapa = I.normalizarDatosAlCrear(mapa);
    if (Object.keys(mapa).length) actual.datosAlCrear = mapa;
    else delete actual.datosAlCrear;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* Los datos que pide al crear un tipo: lista de claves, vacía si no pide ninguno. PURA. */
  function datosAlCrearDe(config, tipo) {
    return ((config && config.datosAlCrear) || {})[tipo] || [];
  }

  /* Un tipo cambia de nombre o se une a otro: lo que pedía al crear pasa al nuevo (se suman, sin repetir). */
  async function moverDatosAlCrear(gestor, viejo, nuevo) {
    var actual = await leer(gestor);
    var origen = (actual.datosAlCrear || {})[viejo] || [];
    if (!origen.length) return actual;
    var suma = ((actual.datosAlCrear || {})[nuevo] || []).concat(origen);
    var mapa = Object.assign({}, actual.datosAlCrear);
    delete mapa[viejo];
    mapa[nuevo] = suma;
    mapa = I.normalizarDatosAlCrear(mapa);
    if (Object.keys(mapa).length) actual.datosAlCrear = mapa;
    else delete actual.datosAlCrear;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  /* Los campos de UN tipo de documento (fila 96). Relee antes de
     escribir y solo toca su trozo, como guardarConfigDeTipo. */
  async function guardarCamposDeDocumento(gestor, tipoDoc, listaCampos) {
    var actual = await leer(gestor);
    var porTipoDocumento = Object.assign({}, actual.porTipoDocumento || {});
    var lista = normalizarListaDeDocumento(listaCampos);
    if (lista.length) porTipoDocumento[tipoDoc] = lista;
    else delete porTipoDocumento[tipoDoc];
    if (Object.keys(porTipoDocumento).length) actual.porTipoDocumento = porTipoDocumento;
    else delete actual.porTipoDocumento;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  function camposDeDocumento(config, tipoDoc) {
    var m = (config && config.porTipoDocumento) || {};
    return m[tipoDoc] || [];
  }

  /* El «Texto por defecto» de UN tipo de documento (fila 201). Relee
     antes de escribir y solo toca su trozo, como guardarCamposDeDocumento. */
  async function guardarTextoPorDefectoDeDocumento(gestor, tipoDoc, texto) {
    var actual = await leer(gestor);
    var mapa = Object.assign({}, actual.textoPorTipoDocumento || {});
    var limpio = String(texto || '').trim();
    if (limpio) mapa[tipoDoc] = limpio;
    else delete mapa[tipoDoc];
    if (Object.keys(mapa).length) actual.textoPorTipoDocumento = mapa;
    else delete actual.textoPorTipoDocumento;
    await Copias.guardar(gestor, FICHERO, actual);
    return actual;
  }

  function textoPorDefectoDeDocumento(config, tipoDoc) {
    var m = (config && config.textoPorTipoDocumento) || {};
    return m[tipoDoc] || '';
  }

  /* ---------- identidad de un campo ----------

     Una clave estable, para guardarlo en la ficha del asunto y para
     saber si dos entradas del catálogo son "el mismo campo". */
  function claveDeCampo(c) {
    if (!c) return '';
    if (c.origen === 'fichero') return 'fichero:' + c.columna;
    return c.origen + ':' + c.id;
  }

  /* Los campos de UN asunto (fila 245, docs/CAMPO-DESDE-EL-ASUNTO.md):
     los del tipo (`listaDelTipo`, lo que hay en `porTipo`) más los «solo
     aquí» de su ficha (`ficha.camposPropiosDelAsunto`, la misma forma que
     una entrada de `porTipo`). PURA. Los «solo aquí» llevan `soloAqui:
     true`, nunca son obligatorios ni van al nombre, y si el tipo ya tiene
     el mismo campo (alguien lo añadió luego desde Ajustes) vale el del
     tipo: deja de ser «solo aquí» sin perder su valor. */
  function camposDeAsunto(listaDelTipo, ficha) {
    var salida = (listaDelTipo || []).slice();
    var vistas = {};
    salida.forEach(function (c, i) { vistas[claveDeCampo(c)] = i + 1; });
    ((ficha && ficha.camposPropiosDelAsunto) || []).forEach(function (c) {
      var k = claveDeCampo(c);
      if (!c) return;
      if (vistas[k]) {
        /* Fila 255: un campo del tipo sin hito al que este asunto le ha puesto hito
           (solo en la ficha): vale el del tipo, con la marca de hito de aquí. */
        var del = salida[vistas[k] - 1];
        if (c.hito !== undefined && c.hito !== (del.hito || '')) {
          var puesto = Object.assign({}, del);
          if (c.hito) puesto.hito = c.hito; else delete puesto.hito;   /* `hito: ''`: sin hito, solo en este asunto */
          salida[vistas[k] - 1] = puesto;
        }
        return;
      }
      vistas[k] = salida.length + 1;
      salida.push(Object.assign({}, c, { obligatorio: false, enNombre: false, soloAqui: true }));
    });
    return salida;
  }

  I.leer = leer;
  I.guardarPropios = guardarPropios;
  I.guardarCalculados = guardarCalculados;
  I.guardarConfigDeTipo = guardarConfigDeTipo;
  I.guardarDatosAlCrear = guardarDatosAlCrear;
  I.datosAlCrearDe = datosAlCrearDe;
  I.moverDatosAlCrear = moverDatosAlCrear;
  I.guardarCamposDeDocumento = guardarCamposDeDocumento;
  I.camposDeDocumento = camposDeDocumento;
  I.guardarTextoPorDefectoDeDocumento = guardarTextoPorDefectoDeDocumento;
  I.textoPorDefectoDeDocumento = textoPorDefectoDeDocumento;
  I.claveDeCampo = claveDeCampo;
  I.camposDeAsunto = camposDeAsunto;
})();
