/* ============================================================
   marca-guia.js — la marca «Los cambios en hitos y tareas van también a la guía»
   (fila 660, docs/660-CREAR-HITOS-Y-TAREAS-DESDE-EL-ASUNTO.md, tema 650 parte 4).

   Una sola marca encima de los hitos del asunto, con el tipo al lado. Encendida: lo que se
   añade o cambia (hitos y tareas: añadir, cambiar, borrar, subir y bajar) lo tendrán también los
   próximos asuntos de ese tipo (va a la guía). Apagada: se queda solo en este asunto. Los demás
   asuntos abiertos del tipo no cambian.

   Nace encendida si la guía del tipo está vacía o solo tiene «Tramitar · Esperar respuesta» (o la
   mínima de antes); apagada en los demás. Después cada asunto recuerda cómo la dejó quien lo usa:
   `a.ficha.marcaGuia` (true | false). Sin tipo, no hay guía: la marca no sale y todo se queda aquí.

   `enGuia(a)` es lo que preguntan los demás ficheros para saber a dónde va un cambio.
   ============================================================ */
var MarcaGuia = (function () {

  function tipoDe(a) { return window.DondeSeGuarda ? DondeSeGuarda.tipoDe(a) : ((a && ((a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo))) || ''); }
  function esc(t) { return U.escapar(String(t == null ? '' : t)); }

  /* ¿La guía del tipo está vacía o solo trae lo mínimo («Tramitar · Esperar respuesta»)? */
  function guiaPorEstrenar(tipo) {
    var pasos = (window.GuiasDelCentro && GuiasDelCentro.pasosDe(tipo)) || [];
    if (!pasos.length) return true;
    var t = pasos.map(function (p) { return U.normalizar(p.titulo || ''); }).join('|');
    var solo = pasos.every(function (p) { return !(p.opciones && p.opciones.length) && !(p.guion && p.guion.length) && !p.cuerpo; });
    return solo && (t === 'tramitar|esperar respuesta' || t === 'tramitar|esperar respuesta|archivar');
  }

  function aplica(a) { return !!tipoDe(a) && !(a && a.ficha && a.ficha.tipoUnidoDe); }

  /* Lo que vale la marca ahora: lo que dejó quien lo usa o, si nunca la tocó, la regla de arriba. */
  function valor(a) {
    if (!aplica(a)) return false;
    var v = a && a.ficha && a.ficha.marcaGuia;
    return typeof v === 'boolean' ? v : guiaPorEstrenar(tipoDe(a));
  }

  /* ¿Los cambios de este asunto van a la guía? */
  function enGuia(a) { return aplica(a) && valor(a); }

  function texto(a) {
    return valor(a)
      ? 'Encendida: lo que añadas o cambies aquí lo tendrán también los próximos asuntos de este tipo.'
      : 'Apagada: lo que añadas o cambies se queda solo en este asunto.';
  }

  /* Al pie de cada ventana o formulario: a dónde irá el cambio. */
  function alcance(a) {
    var t = tipoDe(a);
    return enGuia(a)
      ? 'Irá a este asunto y a la guía de ' + (window.DondeSeGuarda ? DondeSeGuarda.nombreCortoDe(t) : t) + ': lo tendrán también los próximos asuntos.'
      : 'Irá solo a este asunto' + (aplica(a) ? ': la guía no cambia.' : '.');
  }

  async function poner(a, v) {
    await App.anotar(a.nombre, { marcaGuia: !!v });
    if (a.ficha) a.ficha.marcaGuia = !!v;
  }

  /* La franja de encima de los hitos. `abierto`: solo en un asunto abierto (en un archivado no se cambia nada). */
  function pintar(a, abierto) {
    var caja = document.getElementById('ficha-marca-guia');
    if (!caja) return;
    if (!abierto || !aplica(a)) { caja.innerHTML = ''; return; }
    var t = tipoDe(a), on = valor(a);
    /* «Después, cada asunto recuerda cómo la dejó quien lo usa»: el valor de nacimiento se guarda la primera vez que se ve, para que no cambie solo
       cuando la guía cambie (por ejemplo, al crear el primer hito de un tipo nuevo). */
    if (a && a.ficha && typeof a.ficha.marcaGuia !== 'boolean' && !(window.SoloConsulta && SoloConsulta.activo())) poner(a, on).catch(function () { /* se recalcula la próxima vez */ });
    caja.innerHTML = '<label class="interruptor marca-guia-interruptor"><input type="checkbox" class="marca-guia-casilla"' + (on ? ' checked' : '') + '>' +
      '<span>Los cambios en hitos y tareas van también a la guía</span></label>' +
      ' <span class="marca-guia-tipo suave">de ' + esc(window.DondeSeGuarda ? DondeSeGuarda.nombreCortoDe(t) : t) + '</span>' +
      '<div class="marca-guia-texto nota">' + esc(texto(a)) + '</div>';
    var c = caja.querySelector('.marca-guia-casilla');
    c.onchange = async function () {
      c.disabled = true;
      try { await poner(a, c.checked); } catch (e) { U.fallo('No he podido guardar la marca', e); c.checked = !c.checked; }
      c.disabled = false;
      caja.querySelector('.marca-guia-texto').textContent = texto(a);
    };
  }

  return { aplica: aplica, valor: valor, enGuia: enGuia, texto: texto, alcance: alcance, poner: poner, pintar: pintar, guiaPorEstrenar: guiaPorEstrenar };
})();
window.MarcaGuia = MarcaGuia;
