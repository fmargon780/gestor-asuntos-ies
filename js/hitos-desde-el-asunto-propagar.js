/* ============================================================
   hitos-desde-el-asunto-propagar.js — avisos de «solo en este asunto» y propagar cambios y borrados a los asuntos del tipo (fila 535: trozo de js/hitos-desde-el-asunto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga después de js/hitos-desde-el-asunto-formulario.js.
   ============================================================ */
(function () {

  var I = window.HitosDesdeElAsuntoNucleo = window.HitosDesdeElAsuntoNucleo || {};
  function estaVacio() { return I.estaVacio.apply(this, arguments); }
  function colocarTrasAncla() { return I.colocarTrasAncla.apply(this, arguments); }
  function tipoDe() { return I.tipoDe.apply(this, arguments); }
  function nombreCortoDe() { return I.nombreCortoDe.apply(this, arguments); }

  var SOLO_AQUI = 'Guardado solo en este asunto.';
  var SOLO_AQUI_EN_PREGUNTA = 'Guardado solo en este asunto: dentro de una pregunta no se puede cambiar la guía desde aquí.';

  /* Fila 416: un hito que solo existe en este asunto (sin paso en la guía
     de su tipo) lleva la marca «solo aquí». Sin tipo, todos lo son: no se marca. */
  function esSoloAqui(a, h) {
    var tipo = tipoDe(a);
    if (!tipo || !h || h.delTipoAnterior) return false;
    if (h.origenGuia && Hitos.pasoDeGuia && Hitos.pasoDeGuia(a, h)) return false;
    return true;
  }

  function marcaSoloAquiHTML(a, h) {
    return esSoloAqui(a, h)
      ? ' <span class="marca-solo-aqui" data-ayuda-clave="solo-aqui-hito">solo aquí</span>' : '';
  }

  function pasoEsDeNivelSuperior(pasos, idPaso) {
    return (pasos || []).some(function (p) { return p.id === idPaso; });
  }

  /* Los asuntos abiertos del mismo tipo (incluido, si está en la
     lista, el propio `claveActual`): fila 207, un asunto que ha
     pasado por "Unir con otro tipo" no recibe nada de su guía vieja. */
  function clavesAbiertasDelTipo(tipo) {
    if (!window.Gestor || typeof Gestor.asuntos !== 'function') return [];
    return Gestor.asuntos().filter(function (a) {
      return tipoDe(a) === tipo && !(a.ficha && a.ficha.tipoUnidoDe);
    }).map(function (a) { return a.nombre; });
  }

  /* Fila 235: la frase verde de después y su «Deshacer». `base` es lo
     que se dice si el cambio se queda solo en este asunto. */
  async function avisarGuia(tipo, a, antes, r, aqui) {
    await HitosDesdeElAsuntoGuia.avisarConDeshacer(
      HitosDesdeElAsuntoGuia.textoGuardado(nombreCortoDe(tipo), r.otros || 0, r.saltados || 0),
      { tipo: tipo, claveActual: a.nombre, antes: antes, aqui: aqui });
  }

  /* Lo que el último guardado de la guía ha repartido (fila 416). */
  function repartoDe() { return GuiasDelCentro.ultimoReparto ? GuiasDelCentro.ultimoReparto() : { otros: 0, saltados: 0 }; }

  /* ==========================================================
     PROPAGAR UN CAMBIO (título/explicación/responsable/plazo/posición) A LOS
     ASUNTOS ABIERTOS: en el propio (siempre) y en los demás, solo si
     el hito sigue vacío. Nunca toca el ARCHIVO ni la biblioteca.
     ========================================================== */

  async function propagarCambio(tipo, idOrigen, campos, idAncla, claveActual, soloActual) {
    var claves = soloActual ? [claveActual] : clavesAbiertasDelTipo(tipo);
    var tocados = 0, saltados = 0, enCurso = [];
    await Hitos.cambiar(function (d) {
      tocados = 0; saltados = 0; enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada) return;
        var lista = entrada.hitos;
        var h = lista.filter(function (x) { return x.origenGuia === idOrigen && !x.delTipoAnterior; })[0];
        if (!h) return;
        var esActual = clave === claveActual;
        /* Fila 299 (`soloTitulo`, js/informar-al-tutor.js): cambiar solo el nombre del hito, en todos los abiertos. */
        if (!esActual && !campos.soloTitulo && !estaVacio(h, clave)) { saltados++; return; }
        h.titulo = campos.titulo;
        if (!campos.soloTitulo) {
          h.cuerpo = campos.cuerpo;
          h.responsable = campos.responsable;
          if (window.ResponsableOrganismo && ResponsableOrganismo.esOrganismo(h.responsable)) {
            h.responsableNombre = ResponsableOrganismo.copia(h.responsable, null);
          } else {
            delete h.responsableNombre;
          }
          h.plazo = campos.plazo;
          h.variosDocumentos = !!campos.variosDocumentos;
          delete h.variosPropio;
          colocarTrasAncla(lista, h, idAncla);
        }
        tocados++;
        var r = Hitos.recomputeEnCurso(lista);
        if (r) enCurso.push({ clave: clave, hito: r });
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    return { tocados: tocados, saltados: saltados };
  }

  /* Quita el hito de origen `idOrigen` de los asuntos abiertos donde
     siga vacío (el actual, siempre); en los que tienen trabajo, se
     queda. El id sigue en `pasosConocidos` (Hitos.leer lo completa
     solo), así que la fila 118 no lo vuelve a traer. */
  async function propagarBorrado(tipo, idOrigen, claveActual, soloActual) {
    var claves = soloActual ? [claveActual] : clavesAbiertasDelTipo(tipo);
    var tocados = 0, saltados = 0, enCurso = [];
    await Hitos.cambiar(function (d) {
      tocados = 0; saltados = 0; enCurso = [];
      claves.forEach(function (clave) {
        var entrada = d.porAsunto[clave];
        if (!entrada) return;
        var lista = entrada.hitos;
        var i = -1;
        for (var k = 0; k < lista.length; k++) {
          if (lista[k].origenGuia === idOrigen && !lista[k].delTipoAnterior) { i = k; break; }
        }
        if (i === -1) return;
        var esActual = clave === claveActual;
        if (!esActual && !estaVacio(lista[i], clave)) { saltados++; return; }
        lista.splice(i, 1);
        tocados++;
        var r = Hitos.recomputeEnCurso(lista);
        if (r) enCurso.push({ clave: clave, hito: r });
      });
      return d;
    });
    for (var i = 0; i < enCurso.length; i++) await Hitos.aplicarEstadoDelHito(enCurso[i].clave, enCurso[i].hito);
    return { tocados: tocados, saltados: saltados };
  }

  function repintar() {
    if (window.HitosPanel) HitosPanel.programarRepintado();
  }

  I.SOLO_AQUI = SOLO_AQUI;
  I.SOLO_AQUI_EN_PREGUNTA = SOLO_AQUI_EN_PREGUNTA;
  I.esSoloAqui = esSoloAqui;
  I.marcaSoloAquiHTML = marcaSoloAquiHTML;
  I.pasoEsDeNivelSuperior = pasoEsDeNivelSuperior;
  I.clavesAbiertasDelTipo = clavesAbiertasDelTipo;
  I.avisarGuia = avisarGuia;
  I.repartoDe = repartoDe;
  I.propagarCambio = propagarCambio;
  I.propagarBorrado = propagarBorrado;
  I.repintar = repintar;
})();
