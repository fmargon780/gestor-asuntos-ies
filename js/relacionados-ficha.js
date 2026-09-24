/* ============================================================
   relacionados-ficha.js — el bloque «Relacionados» de la ficha del asunto, y copiar el nombre en orden normal.

   Sacado tal cual de js/relacionados.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de js/relacionados.js.
   ============================================================ */
(function () {
  if (typeof Relacionados === 'undefined') return;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     COPIAR EL NOMBRE EN ORDEN NORMAL

     Hasta que existan las plantillas, Francisco escribe los documentos
     a mano y necesita el nombre tal como se escribe, no como se
     guarda. De alumnado y personal se guarda «Apellidos, Nombre
     <código>»: aquí se quita el código pegado al final (el Nº de
     identificación escolar, o las cuatro cifras del documento del
     personal — siempre en mayúsculas, nunca como lleva un nombre de
     pila) y se da la vuelta a los apellidos y el nombre. En empresas
     no hay nada que dar la vuelta: se copia la razón social tal cual.
     ========================================================== */

  function nombreEnOrdenNormal(r) {
    var texto = String((r && r.nombre) || '').trim();
    if (!texto || r.categoria === 'EMPRESAS' || r.categoria === 'OTROS') return texto;

    var coma = texto.indexOf(',');
    if (coma === -1) return texto;
    var apellidos = texto.slice(0, coma).trim();
    var palabras = texto.slice(coma + 1).trim().split(/\s+/);
    var ultima = palabras[palabras.length - 1] || '';
    if (palabras.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) palabras.pop();

    return (palabras.join(' ') + ' ' + apellidos).trim();
  }

  function copiarNombreDelRelacionado(r, boton) {
    var texto = nombreEnOrdenNormal(r);
    if (!texto) return;
    U.copiar(texto, boton, { avisoFallo: 'No he podido copiarlo. Es ' + texto + '.' });
  }

  /* ==========================================================
     PINTAR EL BLOQUE DE LA FICHA
     ========================================================== */

  function pintarEnFicha(caja, a, abierto, alCambiar) {
    var lista = (a.ficha && a.ficha.relacionados) || [];


    var filas = lista.map(function (r, i) {
      return '<div class="relacionado-fila">' +
               '<span class="marca-tipo">' + U.escapar(r.categoria) + '</span>' +
               '<span>' + U.escapar(r.nombre) + '</span>' +
               '<button type="button" class="boton rel-copiar" data-i="' + i + '" ' +
                 'title="Copiar el nombre en orden normal, para pegarlo en un documento">Copiar</button>' +
               (abierto
                 ? '<button type="button" class="boton rel-quitar" data-i="' + i + '">Quitar</button>'
                 : '') +
             '</div>';
    }).join('');

    caja.innerHTML =
      (lista.length ? filas : '<p class="explica">Nadie relacionado con este asunto todavía.</p>') +
      (abierto
        ? '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<button type="button" class="boton" id="rel-anadir">+ Añadir relacionado</button>' +
            '<button type="button" class="boton" id="rel-anadir-varios">+ Añadir varios</button>' +
          '</div>'
        : (lista.length
            ? '<p class="nota">El asunto está archivado: la lista ya no se puede cambiar.</p>'
            : ''));

    Array.prototype.forEach.call(caja.querySelectorAll('.rel-copiar'), function (b) {
      b.onclick = function () {
        var i = parseInt(b.dataset.i, 10);
        if (lista[i]) copiarNombreDelRelacionado(lista[i], b);
      };
    });

    if (!abierto) return;

    var btnAnadir = caja.querySelector('#rel-anadir');
    if (btnAnadir) {
      btnAnadir.onclick = async function () {
        var cambiado = await Relacionados.agregarRelacionado(a);
        if (cambiado && alCambiar) alCambiar();
      };
    }

    var btnAnadirVarios = caja.querySelector('#rel-anadir-varios');
    if (btnAnadirVarios) {
      btnAnadirVarios.onclick = async function () {
        var cambiado = await Relacionados.agregarVarios(a);
        if (cambiado && alCambiar) alCambiar();
      };
    }

    Array.prototype.forEach.call(caja.querySelectorAll('.rel-quitar'), function (b) {
      b.onclick = async function () {
        var i = parseInt(b.dataset.i, 10);
        var nueva = lista.slice();
        nueva.splice(i, 1);
        try {
          await App.anotar(a.nombre, { relacionados: nueva });
          if (alCambiar) alCambiar();
        } catch (e) {
          U.aviso('No he podido quitarlo: ' + U.mensajeDeError(e), 'malo');
        }
      };
    });
  }

  Relacionados.pintarEnFicha = pintarEnFicha;
})();
