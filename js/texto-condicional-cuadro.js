/* ============================================================
   texto-condicional-cuadro.js — el cuadro «Texto condicional» y el recuadro
   «Insertar» (fila 510, docs/510-PARRAFOS-SEGUN-EL-ASUNTO.md).

   El cuadro tiene dos desplegables, «Campo del asunto» (solo los campos de
   lista del tipo) y «Valor» (sus opciones), y los botones «Cancelar» y
   «Poner la marca». Va colgado del <body>, como el de «Campo variable»
   (js/huecos-buscador.js), porque en el editor de plantillas de correo ya
   hay un cuadro abierto debajo. Si el tipo no tiene campos de lista, lo dice.

   Lo usan: el editor de plantillas de correo (js/plantillas-ajustes.js, con
   `montarBoton`) y «Retocar» una plantilla de Word
   (js/plantilla-retocar-pantalla.js, con `abrir`).
   ============================================================ */
var TextoCondicionalCuadro = (function () {

  var ANCHO = 360;
  var abierto = null;

  function cerrar() {
    if (!abierto) return;
    var c = abierto;
    abierto = null;
    document.removeEventListener('mousedown', c.alPulsarFuera, true);
    document.removeEventListener('keydown', c.alPulsarTecla, true);
    window.removeEventListener('resize', c.alMover, true);
    if (c.caja && c.caja.parentNode) c.caja.parentNode.removeChild(c.caja);
  }

  function colocar(caja, ancla) {
    var r = ancla.getBoundingClientRect();
    var ancho = Math.min(ANCHO, window.innerWidth - 16);
    caja.style.width = ancho + 'px';
    caja.style.left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8)) + 'px';
    var alto = caja.offsetHeight || 220;
    caja.style.top = (r.bottom + 6 + alto <= window.innerHeight - 8 ? r.bottom + 6 : Math.max(8, r.top - 6 - alto)) + 'px';
  }

  /* `o`: { ancla: el elemento junto al que se abre, tipo: () => nombre del tipo de asunto,
     alPoner: (campo, valor) => void, ficha: (opcional) la ficha del asunto }. */
  function abrir(o) {
    cerrar();
    var campos = TextoCondicional.camposDeLista(typeof o.tipo === 'function' ? o.tipo() : o.tipo, o.ficha);
    var caja = document.createElement('div');
    caja.className = 'huecos-cuadro texto-cond-cuadro';
    caja.id = 'texto-cond-cuadro';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-label', 'Texto condicional');
    if (!campos.length) {
      caja.innerHTML =
        '<p class="huecos-vacio" id="tc-sin-campos">Este tipo de asunto no tiene campos de lista. Un texto condicional necesita ' +
        'un campo de lista del asunto (por ejemplo, «Sí» o «No»): créalo en los campos del tipo, en Ajustes.</p>' +
        '<div class="texto-cond-botones"><button type="button" class="boton" id="tc-cancelar">Cerrar</button></div>';
    } else {
      caja.innerHTML =
        '<div class="texto-cond-fila"><label class="etiqueta" for="tc-campo">Campo del asunto</label>' +
          '<select id="tc-campo" class="campo">' + campos.map(function (c, i) {
            return '<option value="' + i + '">' + U.escapar(c.nombre) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="texto-cond-fila"><label class="etiqueta" for="tc-valor">Valor</label><select id="tc-valor" class="campo"></select></div>' +
        '<p class="huecos-pie">Salen solo los campos de lista de este tipo de asunto. La marca se pone al principio del párrafo ' + (o.dondeVa ? 'donde está lo ' + o.dondeVa : 'donde está el cursor') + '.</p>' +
        '<div class="texto-cond-botones"><button type="button" class="boton" id="tc-cancelar">Cancelar</button>' +
        '<button type="button" class="boton boton-principal" id="tc-poner">Poner la marca</button></div>';
    }
    document.body.appendChild(caja);

    var selCampo = caja.querySelector('#tc-campo'), selValor = caja.querySelector('#tc-valor');
    function pintarValores() {
      if (!selCampo) return;
      selValor.innerHTML = campos[+selCampo.value].valores.map(function (v) {
        return '<option>' + U.escapar(v) + '</option>';
      }).join('');
    }
    if (selCampo) { pintarValores(); selCampo.addEventListener('change', pintarValores); }
    caja.querySelector('#tc-cancelar').onclick = cerrar;
    var poner = caja.querySelector('#tc-poner');
    if (poner) poner.onclick = function () {
      var campo = campos[+selCampo.value].nombre, valor = selValor.value;
      cerrar();
      if (valor === '' || valor === undefined) return;
      o.alPoner(campo, valor);
    };

    function alPulsarTecla(ev) {
      if (ev.key !== 'Escape') return;
      ev.preventDefault();
      ev.stopPropagation();
      cerrar();
    }
    function alPulsarFuera(ev) { if (!caja.contains(ev.target) && !(o.ancla && o.ancla.contains(ev.target))) cerrar(); }
    function alMover() { colocar(caja, o.ancla); }
    abierto = { caja: caja, alPulsarTecla: alPulsarTecla, alPulsarFuera: alPulsarFuera, alMover: alMover };
    document.addEventListener('mousedown', alPulsarFuera, true);
    document.addEventListener('keydown', alPulsarTecla, true);
    window.addEventListener('resize', alMover, true);
    colocar(caja, o.ancla);
    var primero = selCampo || caja.querySelector('#tc-cancelar');
    if (primero) primero.focus();
  }

  /* El botón «Texto condicional» de un campo de texto de plantilla de correo: pone la marca en el párrafo donde está el
     cursor y lo cuenta debajo (`aviso`, un elemento). `tipo`: () => nombre del tipo de asunto de la plantilla. */
  function montarBoton(o) {
    var boton = o.boton, campo = o.campo;
    if (!boton || !campo) return;
    boton.addEventListener('mousedown', function (ev) { ev.preventDefault(); });   /* el texto no pierde el cursor */
    boton.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (abierto) { cerrar(); return; }
      var posicion = campo.selectionStart;
      abrir({
        ancla: boton, tipo: o.tipo,
        alPoner: function (nombre, valor) {
          var r = TextoCondicional.ponerEnTexto(campo.value, posicion, nombre, valor);
          campo.value = r.texto;
          campo.focus();
          try { campo.selectionStart = campo.selectionEnd = r.cursor; } catch (e) { /* ya está puesto */ }
          campo.dispatchEvent(new Event('input', { bubbles: true }));
          if (o.aviso) o.aviso.textContent = TextoCondicional.avisoDeMarca(nombre, valor);
        }
      });
    });
  }

  return { abrir: abrir, cerrar: cerrar, montarBoton: montarBoton, abierto: function () { return !!abierto; } };
})();
window.TextoCondicionalCuadro = TextoCondicionalCuadro;
