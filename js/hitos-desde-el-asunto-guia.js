/* ============================================================
   hitos-desde-el-asunto-guia.js — lo que hay detrás de «¿Dónde se
   guarda?» cuando la respuesta es «A la guía» (30-sep-2026, fila 235,
   docs/GUARDAR-EN-LA-GUIA-AL-ACEPTAR.md, puntos 4 y 5).

   - `llevarHitoEntero(a, h)`: un hito que solo existe en este asunto
     (sin paso en la guía) entra en la guía del tipo con su título,
     plazo, responsable y TODAS sus tareas, detrás del hito anterior que
     venga de la guía (o al principio). La guía conserva todo lo que ya
     tenía: solo se añade. En este asunto el hito queda enlazado con el
     paso nuevo, con los mismos ids en las tareas, así que lo marcado no
     se pierde; a los demás abiertos del tipo llega por el camino de
     siempre (fila 118, `GuiasDelCentro.guardarPasos`).
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

  /* De los otros asuntos abiertos del tipo que tienen el hito de origen
     `idOrigen`, cuántos tienen trabajo en él (no se tocarán). */
  async function conTrabajo(tipo, idOrigen, claveActual) {
    if (!idOrigen) return 0;
    var datos = await Hitos.leer();
    var n = 0;
    HitosDesdeElAsunto.clavesAbiertasDelTipo(tipo).forEach(function (c) {
      if (c === claveActual) return;
      var e = datos.porAsunto[c];
      var h = e && (e.hitos || []).filter(function (x) { return x.origenGuia === idOrigen && !x.delTipoAnterior; })[0];
      if (h && !HitosDesdeElAsunto.estaVacio(h, c)) n++;
    });
    return n;
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
        if (!igual(reg.antes.pasos, reg.despues.pasos)) await GuiasDelCentro.guardarPasos(reg.tipo, copia(reg.antes.pasos));
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

  /* El hito propio `h` entra en la guía del tipo con todas sus tareas.
     Devuelve { paso, hitoAntes } (`hitoAntes`: copia del hito como era,
     para «Deshacer»). Si algo falla, el hito se queda como estaba. */
  async function llevarHitoEntero(a, h) {
    var tipo = DondeSeGuarda.tipoDe(a);
    var D = HitosDesdeElAsunto;
    var hitos = await Hitos.hitosDe(a.nombre);
    var nivel = D.nivelSuperior(hitos);
    var ids = nivel.map(function (x) { return x.id; });
    var i = ids.indexOf(h.id);
    if (i === -1) throw new Error('Este hito está dentro de una pregunta: en la guía se cambia desde Ajustes.');
    var actual = nivel[i];
    var hitoAntes = copia(actual);
    var idAncla = D.pasoAnclaDeHito(nivel, i > 0 ? nivel[i - 1].id : '');
    var tareas = (actual.guionPropio || []).filter(function (g) { return !g.enLugarDe; })
      .map(function (g) { return { id: g.id, texto: g.texto }; });
    var paso = Guias.normalizar([{
      titulo: actual.titulo, cuerpo: actual.cuerpo || '', responsable: actual.responsable || '', plazo: actual.plazo || null,
      toca: actual.toca, tocaA: actual.tocaA, guion: tareas
    }])[0];
    if (!paso) throw new Error('El hito no tiene título.');
    await GuiasDelCentro.recargar();
    var pasos = copia(GuiasDelCentro.pasosDe(tipo));
    D.colocarTrasAncla(pasos, paso, idAncla);
    /* Primero se enlaza aquí, para que el reparto a los abiertos (que
       incluye a este asunto) no le ponga un hito repetido. */
    await Hitos.cambiar(function (d) {
      var e = d.porAsunto[a.nombre];
      var x = e && Hitos.buscar(e.hitos, h.id);
      if (x) { x.origenGuia = paso.id; x.guionPropio = []; }
      return d;
    });
    try {
      await GuiasDelCentro.guardarPasos(tipo, pasos);
    } catch (err) {
      await dejarComoEstaba(a.nombre, hitoAntes);
      throw err;
    }
    return { paso: paso, hitoAntes: hitoAntes };
  }

  /* Devuelve el hito de este asunto a la copia `hitoAntes` (mismo id). */
  async function dejarComoEstaba(clave, hitoAntes) {
    await Hitos.cambiar(function (d) {
      var e = d.porAsunto[clave];
      if (!e) return d;
      var lista = e.hitos;
      (function sustituir(ls) {
        for (var i = 0; i < ls.length; i++) {
          if (ls[i].id === hitoAntes.id) { ls[i] = copia(hitoAntes); return true; }
          if (ls[i].clase === 'decision') {
            for (var j = 0; j < (ls[i].opciones || []).length; j++) if (sustituir(ls[i].opciones[j].hitos || [])) return true;
          }
        }
        return false;
      })(lista);
      return d;
    });
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
    conTrabajo: conTrabajo,
    textoGuardado: textoGuardado,
    avisarConDeshacer: avisarConDeshacer,
    deshacer: deshacer,
    llevarHitoEntero: llevarHitoEntero,
    dejarComoEstaba: dejarComoEstaba,
    desenlazar: desenlazar
  };
})();
