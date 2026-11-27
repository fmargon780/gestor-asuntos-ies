/* ============================================================
   persona-del-asunto-calidad.js — «En calidad de» de la persona elegida, en la ficha
   (fila 773, docs/773-PERSONA-ELEGIDA-COMPLETA.md; sale del tema 765).

   Debajo de la persona elegida de «Campos de este asunto» sale «En calidad de: <valor>»
   (padre, madre, alumna…: el que puso la app al elegirla, js/persona-del-asunto.js) con
   su propio «Cambiar». Lo escrito se guarda como el dato «En calidad de <campo>» del
   asunto, que usan todas sus plantillas; dejarlo vacío vuelve al valor de la app.

     fila(a, nombreCampo, g, hito)    la fila de la ficha
     filaHtml(f)                      su HTML
     sinDato(filas)                   quita la fila suelta del dato «En calidad de <campo>»
     enganchar(caja, a)               el «Cambiar» (lo llama js/ficha-campos-lista-vacia.js)
   ============================================================ */
var PersonaCalidad = (function () {

  function norm(t) { return U.normalizar(String(t === undefined || t === null ? '' : t).trim()); }

  function escrito(a, nombreCampo) {
    if (!window.DatosDelAsunto) return '';
    var c = DatosDelAsunto.camposDelAsunto(a).filter(function (x) { return norm(x.nombre) === norm('En calidad de ' + nombreCampo); })[0];
    return c ? String(DatosDelAsunto.valorGuardado(a, c.clave) || '').trim() : '';
  }

  /* Lo escrito a mano, o si no lo que puso la app al elegir a la persona. */
  function actual(a, nombreCampo, g) { return escrito(a, nombreCampo) || (g && g.persona && g.persona.calidad) || ''; }

  function fila(a, nombreCampo, g, hito) {
    return { titulo: 'En calidad de', valor: actual(a, nombreCampo, g), calidad: nombreCampo, hito: hito };
  }

  function abierto() { var N = window.FichaNucleo; return !N || N.modoActual === 'abierto'; }

  function filaHtml(f) {
    return '<div class="ficha-dato ficha-dato-calidad"><span>' + U.escapar(f.titulo) + '</span><span class="ficha-dato-valor-lista">' +
      (f.valor ? U.escapar(f.valor) : '<span class="suave">sin decir</span>') +
      (abierto() ? ' <button type="button" class="boton boton-chico ficha-calidad-cambiar" data-campo="' + U.escapar(f.calidad) +
        '" data-valor="' + U.escapar(f.valor) + '" title="Cambiar «En calidad de» de «' + U.escapar(f.calidad) + '»">Cambiar</button>' : '') +
      '</span></div>';
  }

  /* El dato «En calidad de <campo>» ya se enseña en su fila: no se repite suelto. */
  function sinDato(filas) {
    var personas = {};
    filas.forEach(function (f) { if (f.calidad) personas[norm(f.calidad)] = true; });
    return filas.filter(function (f) {
      var m = /^En calidad de (.+)$/i.exec(String(f.titulo || ''));
      return !(f.soloAqui && m && personas[norm(m[1])]);
    });
  }

  function enganchar(caja, a) {
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-calidad-cambiar'), function (boton) {
      boton.onclick = async function () {
        var campo = boton.dataset.campo, antes = boton.dataset.valor || '';
        var espera = U.preguntar('En calidad de · ' + campo,
          '<label class="etiqueta" for="persona-calidad">En calidad de «' + U.escapar(campo) + '» (por ejemplo, tutora legal)</label>' +
          '<input id="persona-calidad" class="campo" autocomplete="off">' +
          '<p class="explica">Si lo dejas vacío, vuelve el que puso la app.</p>', 'Guardar');
        var caja2 = document.getElementById('persona-calidad');
        if (caja2) { caja2.value = antes; caja2.focus(); }
        var aceptar = document.getElementById('cuadro-aceptar');
        var texto = '';
        function recoger() { texto = caja2 ? caja2.value.trim() : ''; }
        if (aceptar) aceptar.addEventListener('click', recoger, true);
        var ok = await espera;
        if (aceptar) aceptar.removeEventListener('click', recoger, true);
        if (!ok || texto === antes) return;
        try {
          var r = await DatosDelAsunto.guardar(a, 'En calidad de ' + campo, texto);
          if (!r.ok) { U.aviso(r.aviso, 'ambar'); return; }
          U.aviso('«En calidad de» guardado en el asunto.', 'bueno');
          if (window.DatosDelAsuntoVista) DatosDelAsuntoVista.alGuardarAlgo(a);
        } catch (e) { U.fallo('No he podido guardar «En calidad de»', e); }
      };
    });
  }

  return { fila: fila, filaHtml: filaHtml, sinDato: sinDato, enganchar: enganchar, actual: actual };
})();
window.PersonaCalidad = PersonaCalidad;
