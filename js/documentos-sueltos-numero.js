/* ============================================================
   documentos-sueltos-numero.js — un documento de «Por clasificar» que
   lleva el número de un asunto propone guardarse en ese asunto
   (fila 760, docs/760-DOCUMENTO-CON-NUMERO-A-SU-ASUNTO.md).

   El número (A26-0588) se busca con la misma función que usa la
   bandeja de correos (Bandeja.asuntoPorNumeroEnElTexto): primero en el
   nombre del fichero, que se mira al pintar la tarjeta, y si no está,
   en el texto del PDF, que ya lee js/documentos-sueltos-lector.js (él
   llama a `aplicar` cuando lo encuentra). La tarjeta dice «Es de» y el
   asunto; con el asunto abierto, el botón principal es «Guardar en ese
   asunto»; con el asunto archivado, «Reabrir y guardar aquí» y «Guardar
   sin reabrir». «Crear asunto con él» y «Guardar en un asunto» siguen
   ahí, sin destacar. Nunca se guarda nada sin pulsar.
   ============================================================ */
(function () {
  if (typeof App.tarjetaSuelto !== 'function') return;

  /* El asunto cuyo número lleva el nombre del fichero (sin la extensión), o null. */
  function delNombre(nombre) {
    if (!window.Bandeja || !Bandeja.asuntoPorNumeroEnElTexto) return null;
    return Bandeja.asuntoPorNumeroEnElTexto(String(nombre || '').replace(/\.[A-Za-z0-9]{1,8}$/, ' '));
  }

  function boton(texto, principal, clave, alPulsar) {
    var b = document.createElement('button');
    b.className = 'boton' + (principal ? ' boton-principal' : '');
    b.dataset.accionSuelto = clave;
    b.textContent = texto;
    b.onclick = async function () {
      if (b.disabled) return;
      b.disabled = true;   /* no se puede pulsar dos veces (fila 100) */
      try { await alPulsar(); }
      catch (e) { U.fallo('No he podido guardarlo en el asunto', e); }
      finally { b.disabled = false; }
    };
    return b;
  }

  /* Pone en la tarjeta `div` la propuesta del asunto `asunto` ({nombre, ficha}). Se puede llamar más de una vez. */
  function aplicar(div, s, asunto) {
    var texto = div && div.querySelector('.tarjeta-texto');
    var acciones = div && div.querySelector('.acciones');
    if (!texto || !acciones || !asunto) return;
    Array.prototype.slice.call(div.querySelectorAll('.propuesta-numero, [data-accion-suelto^="numero"]'))
      .forEach(function (el) { el.parentNode.removeChild(el); });
    div.dataset.asuntoPorNumero = asunto.nombre;

    var cerrado = !!(window.Bandeja && Bandeja.estaArchivado(asunto.ficha));
    var linea = document.createElement('div');
    linea.className = 'tarjeta-pie propuesta-numero';
    linea.innerHTML = '<span class="marca-tipo">Es de</span>' + U.escapar(asunto.nombre) +
      (cerrado ? '  ·  <strong>asunto cerrado</strong>' : '');
    var pie = texto.querySelector('.tarjeta-pie');
    if (pie && pie.nextSibling) texto.insertBefore(linea, pie.nextSibling); else texto.appendChild(linea);

    var elegido = function () { return { nombre: asunto.nombre, ficha: asunto.ficha }; };
    var primero = acciones.firstChild;
    var nuevos = cerrado
      ? [boton('Reabrir y guardar aquí', true, 'numero-reabrir', function () { return App.meterSueltoEnAsuntoElegido(s, elegido(), undefined, 'reabrir'); }),
         boton('Guardar sin reabrir', false, 'numero-guardar', function () { return App.meterSueltoEnAsuntoElegido(s, elegido(), undefined, 'guardar'); })]
      : [boton('Guardar en ese asunto', true, 'numero-guardar', function () { return App.meterSueltoEnAsuntoElegido(s, elegido()); })];
    nuevos.forEach(function (b) { acciones.insertBefore(b, primero); });

    var crear = acciones.querySelector('[data-accion-suelto="crear"]');
    if (crear) crear.className = 'boton';   /* sin destacar: la propuesta puede equivocarse */
  }

  U.envolver(App, 'App.tarjetaSuelto', 'documentos-sueltos-numero.js', function (comoEra) {
    return function (s, pie, esNuevo, compacta) {
      var div = comoEra(s, pie, esNuevo, compacta);
      var asunto = delNombre(s.nombre);
      if (!asunto && window.LectorDeSueltos && LectorDeSueltos.asuntoPorNumero) asunto = LectorDeSueltos.asuntoPorNumero(s.nombre);
      if (asunto) aplicar(div, s, asunto);
      return div;
    };
  });

  window.SueltoConNumero = { delNombre: delNombre, aplicar: aplicar };
})();
