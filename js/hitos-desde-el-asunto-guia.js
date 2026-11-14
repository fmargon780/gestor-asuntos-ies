/* ============================================================
   hitos-desde-el-asunto-guia.js — lo que hay detrás de guardar en la
   guía desde un asunto (30-sep-2026, fila 235,
   docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, puntos 4 y 5; desde la fila 416
   ya no hay pregunta «¿Dónde se guarda?», la guía manda).

   - «Deshacer» (punto 5): el aviso verde de después lleva un botón que
     deja la guía y los demás asuntos como estaban antes de ese guardado
     y, en este asunto, el cambio se queda «solo aquí». Para poder hacerlo
     se guarda en memoria lo de antes (`instantanea`); si al deshacer algo
     ya ha cambiado por otro lado, no se pisa: aviso ámbar.

   Carga después de js/hitos-desde-el-asunto.js y js/donde-se-guarda.js.
   ============================================================ */
window.HitosDesdeElAsuntoGuia = (function () {

  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /* Lo que hay ahora, para poder dejarlo como estaba: la guía entera
     del tipo y las entradas de hitos de los DEMÁS asuntos abiertos del
     tipo (las de este asunto las arregla cada caso a su manera). */
  async function instantanea(tipo, claveActual) {
    try { await GuiasDelCentro.recargar(); } catch (e) { /* se sigue con lo que hay */ }
    var datos = await Hitos.leer();
    var otros = {};
    HitosDesdeElAsunto.clavesAbiertasDelTipo(tipo).forEach(function (c) {
      if (c !== claveActual && datos.porAsunto[c]) otros[c] = copia(datos.porAsunto[c]);
    });
    return { pasos: copia(GuiasDelCentro.pasosDe(tipo)), otros: otros };
  }

  /* La frase verde de después, cuando ha ido a la guía. */
  function textoGuardado(tipoCorto, otros, saltados) {
    var t = 'Guardado en la guía de ' + tipoCorto +
      (otros ? ' y en ' + (otros === 1 ? '1 asunto abierto' : otros + ' asuntos abiertos') : '') + '.';
    if (saltados) t += ' En ' + saltados + ' no se ha tocado porque ya ' + (saltados === 1 ? 'tenía' : 'tenían') + ' trabajo.';
    return t;
  }

  /* `reg` = { tipo, claveActual, antes, despues, aqui }: dos instantáneas
     (de antes y de justo después de guardar) y `aqui()`, que deja el
     cambio «solo en este asunto». */
  async function deshacer(reg) {
    var parcial = false;
    try {
      var ahora = await instantanea(reg.tipo, reg.claveActual);
      var claves = Object.keys(reg.antes.otros).concat(Object.keys(reg.despues.otros))
        .filter(function (c, i, l) { return l.indexOf(c) === i; });
      var porRestaurar = claves.filter(function (c) {
        if (igual(reg.antes.otros[c], reg.despues.otros[c])) return false;
        if (!igual(ahora.otros[c], reg.despues.otros[c])) { parcial = true; return false; }
        return true;
      });
      if (porRestaurar.length) {
        await Hitos.cambiar(function (d) {
          porRestaurar.forEach(function (c) {
            if (reg.antes.otros[c]) d.porAsunto[c] = copia(reg.antes.otros[c]);
            else delete d.porAsunto[c];
          });
          return d;
        });
      }
      if (igual(ahora.pasos, reg.despues.pasos)) {
        if (!igual(reg.antes.pasos, reg.despues.pasos)) await GuiasDelCentro.guardarPasos(reg.tipo, copia(reg.antes.pasos), { sinLlevar: true });   /* fila 416: los asuntos ya se han restaurado arriba */
      } else {
        parcial = true;
      }
      if (reg.aqui) await reg.aqui();
    } catch (e) {
      U.fallo('No he podido deshacerlo', e);
      return;
    }
    if (window.HitosPanel) HitosPanel.programarRepintado();
    if (parcial) U.aviso('No he podido deshacerlo del todo: algo ha cambiado por otro lado y no lo he pisado.', 'ambar');
    else U.aviso('Deshecho: se queda solo en este asunto.', 'bueno');
  }

  /* El aviso verde con «Deshacer» (8 s). `despues` se toma aquí, justo
     tras guardar. */
  async function avisarConDeshacer(texto, reg) {
    try { reg.despues = await instantanea(reg.tipo, reg.claveActual); } catch (e) { reg.despues = null; }
    if (!reg.despues) { U.aviso(texto, 'bueno'); return; }
    U.aviso(texto, 'bueno', { boton: 'Deshacer', alPulsar: function () { deshacer(reg); } });
  }

  /* Quita el enlace con la guía de un hito de este asunto (el hito sigue
     aquí, como propio). Lo usa «Deshacer» de un hito recién creado. */
  async function desenlazar(clave, idPaso) {
    await Hitos.cambiar(function (d) {
      var e = d.porAsunto[clave];
      if (!e) return d;
      (function recorrer(ls) {
        ls.forEach(function (x) {
          if (x.origenGuia === idPaso) x.origenGuia = null;
          if (x.clase === 'decision') (x.opciones || []).forEach(function (o) { recorrer(o.hitos || []); });
        });
      })(e.hitos);
      return d;
    });
  }

  return {
    instantanea: instantanea,
    textoGuardado: textoGuardado,
    avisarConDeshacer: avisarConDeshacer,
    deshacer: deshacer,
    desenlazar: desenlazar
  };
})();
