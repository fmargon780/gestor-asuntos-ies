/* ============================================================
   hitos-anadir.js — «Añadir documento» dentro de un hito (23-sep-2026,
   fila 103, docs/EL-HITO-MESA-DE-TRABAJO.md, 1).

   Sustituye al botón «Apuntar un documento» de la fila 31: un solo
   botón con el menú pequeño de js/ficha-menus.js y tres caminos.

     1. Desde el ordenador: el cuadro de siempre de «Añadir documento»
        (js/documentos.js, `Documentos.abrir(a, { anadir: fichero })`).
     2. Desde «Por clasificar»: se elige un suelto, entra en la carpeta
        del asunto por el mismo camino que «Meter en un asunto»
        (`App.llevarSueltoA`, js/documentos-sueltos.js) y se abre el
        cuadro de ponerle nombre (`Documentos.abrir(a, { nombre })`).
     3. Uno que ya está en la carpeta: el cuadro de la fila 31,
        `HitosDocumentos.abrir(a, h)`, sin cambios.

   Lo que se añade así queda unido a ESE hito solo (`apuntar`, que usa
   también js/hitos-documento-menu.js) y marca su casilla de «Lo que
   hay que reunir» (no crítico). Nunca se rellena nada solo en el
   cuadro de nombrar.

   Mismo patrón que js/hitos-generar.js: lo llama js/hitos-panel-lista.js
   (`botonHTML`, `engancharBoton`) dentro de `.hito-botones`. Se carga
   después de js/hitos-generar.js.
   ============================================================ */
window.HitosAnadir = (function () {

  /* Apunta `nombres` al hito, marca su casilla de «Lo que hay que
     reunir» y deja el hito desplegado al repintar. El documento ya está
     en la carpeta: si falla apuntarlo, es accesorio (ámbar, fila 100). */
  async function apuntar(a, hito, nombres) {
    var lista = (nombres || []).filter(function (n, i, todos) { return n && todos.indexOf(n) === i; });
    try {
      for (var i = 0; i < lista.length; i++) {
        await Hitos.anadirDocumento(a.nombre, hito.id, lista[i]);
      }
    } catch (e) {
      U.accesorio('Guardado, pero no he podido apuntarlo en el hito', e);
    }
    if (window.HitosRequisitos) {
      for (var j = 0; j < lista.length; j++) {
        try { await HitosRequisitos.marcarPorDocumento(a.nombre, hito.id, lista[j]); } catch (e2) { /* no crítico */ }
      }
    }
    repintar(a, hito);
  }

  /* El hito sigue abierto, y la lista de documentos de la ficha se pone
     al día (un documento nuevo en la carpeta). */
  function repintar(a, hito) {
    if (window.HitosPanel) {
      if (HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(a.nombre, hito.id);
      HitosPanel.programarRepintado();
    }
    if (window.FichaDocumentos) {
      try { FichaDocumentos.pintar(a); } catch (e) { /* se pondrá al día en el próximo repintado */ }
    }
  }

  /* ---------- 1. Desde el ordenador ---------- */

  async function desdeElOrdenador(a, hito) {
    var fichero;
    try { fichero = await Carpetas.elegirFichero(a.handle); }
    catch (e) {
      if (e && e.name === 'AbortError') return;
      U.fallo('No he podido abrir ese fichero', e);
      return;
    }
    var nombres = await Documentos.abrir(a, { anadir: fichero });
    if (nombres.length) await apuntar(a, hito, nombres);
    else repintar(a, hito);
  }

  /* ---------- 2. Desde «Por clasificar» ---------- */

  function sueltos() {
    return (window.App && App.E && App.E.sueltos) || [];
  }

  async function elegirSuelto() {
    var lista = sueltos().slice().sort(function (x, y) {
      return String(x.nombre).localeCompare(String(y.nombre), 'es');
    });
    if (!lista.length) return null;
    var cuerpo = '<p class="explica">Entrará en la carpeta de este asunto, saldrá de «Por clasificar» ' +
      'y después podrás ponerle nombre.</p>' +
      '<div id="hitoanadir-sueltos">' + lista.map(function (s, i) {
        return '<label class="hitosdoc-fila"><input type="radio" name="hitoanadir-suelto" value="' + i + '"' +
          (i === 0 ? ' checked' : '') + '><span>' + U.escapar(s.nombre) + '</span></label>';
      }).join('') + '</div>';
    var ok = await U.preguntar('Añadir desde «Por clasificar»', cuerpo, 'Meterlo aquí');
    if (!ok) return null;
    var marcado = document.querySelector('#hitoanadir-sueltos input:checked');
    return marcado ? lista[Number(marcado.value)] : null;
  }

  async function desdePorClasificar(a, hito) {
    var s = await elegirSuelto();
    if (!s) return;
    var dentro = await App.llevarSueltoA(s, a.nombre, a.ficha || {}, { sinCuadro: true });
    if (!dentro) return;
    var nombres = await Documentos.abrir(a, { nombre: s.nombre });
    await apuntar(a, hito, nombres.length ? nombres : [s.nombre]);
  }

  /* ---------- 3. Uno que ya está en la carpeta ---------- */

  async function yaEnLaCarpeta(a, hito) {
    if (window.HitosPanel && HitosPanel.desplegarAlAbrir) HitosPanel.desplegarAlAbrir(a.nombre, hito.id);
    await HitosDocumentos.abrir(a, hito);
  }

  /* ---------- el botón ---------- */

  function botonHTML(a, hito) {
    if (!hito || hito.clase === 'decision' || hito.estado === 'noaplica') return '';
    return '<button type="button" class="boton hito-doc-anadir" title="Traer un documento a este hito">' +
      'Añadir documento</button>';
  }

  function conAviso(hacer, a, hito) {
    return async function () {
      try { await hacer(a, hito); }
      catch (e) { U.fallo('No he podido añadir el documento', e); }
    };
  }

  function engancharBoton(div, a, hito) {
    var b = div.querySelector('.hito-doc-anadir');
    if (!b || !window.FichaMenus) return;
    var haySueltos = sueltos().length > 0;
    FichaMenus.montar(b, [
      { texto: 'Desde el ordenador', clase: 'hito-anadir-ordenador', alPulsar: conAviso(desdeElOrdenador, a, hito) },
      { texto: 'Desde «Por clasificar»' + (haySueltos ? '' : ' (no hay ninguno)'), clase: 'hito-anadir-sueltos',
        deshabilitado: !haySueltos, alPulsar: conAviso(desdePorClasificar, a, hito) },
      { texto: 'Uno que ya está en la carpeta', clase: 'hito-anadir-carpeta', alPulsar: conAviso(yaEnLaCarpeta, a, hito) }
    ]);
  }

  return { botonHTML: botonHTML, engancharBoton: engancharBoton, apuntar: apuntar, repintar: repintar };
})();
