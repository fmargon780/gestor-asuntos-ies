/* ============================================================
   ficha-consulta.js — no pisarse en un mismo asunto: el aviso de presencia y el modo consulta.

   Sacado tal cual de js/ficha-asunto.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la ficha (el asunto que se ve, su modo, la huella…) y lo
   de los demás ficheros de la ficha se piden a `window.FichaNucleo` (N).
   Se carga justo detrás de js/ficha-asunto.js.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* ---------- no pisarse en un mismo asunto (17-sep-2026, fila 24) ----------

     El aviso, arriba del todo, y el botón de tomar el mando. Apagar
     los controles que modifican es cosa de aplicarModoConsulta, un
     poco más abajo: entre los dos no hace falta tocar nada de lo que
     ya pinta cada bloque (guía, hitos, notas, correo, plantillas...). */

  function pintarPresencia() {
    var caja = $('ficha-presencia');
    if (!caja) return;
    if (!N.ocupacionActual) { caja.className = 'oculto'; caja.innerHTML = ''; return; }

    caja.className = 'aviso aviso-ambar aviso-presencia';
    caja.innerHTML = '';   /* se vacía antes: si no, el aviso salía repetido (fila 101) */
    var texto = document.createElement('div');
    texto.innerHTML = '<strong>' + U.escapar(N.ocupacionActual.usuario) + ' está en este asunto ahora ' +
      'mismo.</strong> Estás mirando, no puedes modificar.';
    caja.appendChild(texto);

    var tomar = document.createElement('button');
    tomar.type = 'button';
    tomar.className = 'boton boton-presencia-tomar';
    tomar.textContent = 'Tomar el mando';
    tomar.onclick = async function () {
      var ok = await U.preguntar('Tomar el mando',
        '<p>¿Seguro? ' + U.escapar(N.ocupacionActual.usuario) + ' podría estar escribiendo ahora ' +
        'mismo.</p>', 'Tomar el mando');
      if (!ok || !N.actual) return;
      try {
        await Presencia.tomarElMando(N.actual.nombre);
        N.ocupacionActual = null;
      } catch (e) {
        U.fallo('No he podido tomar el mando', e);
      } finally {
        N.pintar();
      }
    };
    caja.appendChild(tomar);
  }

  /* Apaga (o enciende) todo lo que modifica dentro de la ficha, sin
     que este fichero, ni ningún otro, tenga que marcar uno a uno sus
     propios botones: se recorre lo que haya pintado dentro de
     #ficha-asunto-cuerpo ahora mismo, sea de quien sea. Lo que solo
     lee (abrir un documento, volver, copiar un nombre, desplegar un
     hito, tomar el mando) se queda siempre encendido. */
  function esControlDeSoloLectura(el) {
    if (el.id === 'ficha-volver') return true;
    if (el.id === 'ficha-volver-al-origen') return true;
    if (el.classList.contains('ficha-documento')) return true;
    if (el.classList.contains('hito-desplegar')) return true;
    if (el.classList.contains('marca-hito')) return true;   /* fila 129: abre la mesa del hito */
    if (el.classList.contains('boton-presencia-tomar')) return true;
    /* El disparador de los tres puntos del nombre (18-sep-2026, fila
       52, docs/CABECERA-DEL-ASUNTO.md, 5): en modo consulta el menú se
       tiene que poder abrir igual, porque una de sus opciones —copiar
       el nombre— sigue funcionando; las otras dos se apagan solas, ya
       dentro del menú, por texto (más abajo en este mismo método). */
    if (el.classList.contains('ficha-nombre-menu-boton')) return true;
    /* La fila de copiar de un gesto (18-sep-2026, fila 58,
       docs/AJUSTES-DE-USO-2026-09-18.md, 1): copiar no cambia nada del
       asunto, así que sigue activa en consulta. */
    if (el.classList.contains('boton-copiar-fila') || el.classList.contains('hitos-ver-mapa')) return true;
    /* Las pestañas, los chips de documentos y los nombres del resumen de
       las tarjetas (fila 107) solo abren o cambian de vista. */
    if (el.closest('.ficha-tarjetas-pestanas, .ficha-tarjeta-franja, .ficha-tarjeta-resumen')) return true;
    var texto = (el.textContent || '').trim();
    return texto === 'Copiar';
  }

  function aplicarModoConsulta() {
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    var enConsulta = !!N.ocupacionActual;
    raiz.classList.toggle('ficha-consulta', enConsulta);
    /* Solo toca lo que él mismo apaga (fila 100): antes ponía
       disabled=false en TODO, y volvía a encender un botón que estaba
       «Guardando…» o las casillas de hito de un asunto archivado. */
    Array.prototype.forEach.call(raiz.querySelectorAll('button, select, input, textarea'), function (el) {
      if (el.dataset.guardando) return;
      if (enConsulta && !esControlDeSoloLectura(el)) {
        if (!el.disabled) { el.disabled = true; el.dataset.apagadoPorConsulta = '1'; }
      } else if (el.dataset.apagadoPorConsulta) {
        el.disabled = false;
        delete el.dataset.apagadoPorConsulta;
      }
    });
  }

  /* La mitad de la ficha se pinta sola, después de este `pintar()`:
     la guía, los documentos, los relacionados son async, y los hitos
     (js/hitos-panel.js), "Generar documento" y "Correo" se cuelgan por
     su cuenta, con su propio MutationObserver o con un pequeño
     retraso. Aplicar el modo consulta una sola vez, al final de
     `pintar()`, se comería todo lo que sale después. Un observador
     sobre el propio #ficha-asunto-cuerpo (el mismo patrón que
     js/hitos-panel.js, con el mismo aviso de docs/CONTEXTO.md sobre
     los MutationObserver) lo vuelve a aplicar cada vez que aparece
     algo nuevo. Solo se observa una vez: el contenedor no se destruye
     entre una ficha y otra, solo su contenido. */
  var observadorConsulta = null;
  var pendienteConsulta = null;

  function programarModoConsulta() {
    if (pendienteConsulta) clearTimeout(pendienteConsulta);
    pendienteConsulta = setTimeout(function () { pendienteConsulta = null; aplicarModoConsulta(); }, 30);
  }

  function asegurarObservadorConsulta() {
    if (observadorConsulta) return;
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    observadorConsulta = new MutationObserver(programarModoConsulta);
    observadorConsulta.observe(raiz, { childList: true, subtree: true });
  }

  Object.assign(N, {
    aplicarModoConsulta: aplicarModoConsulta,
    asegurarObservadorConsulta: asegurarObservadorConsulta,
    pintarPresencia: pintarPresencia
  });
})();
