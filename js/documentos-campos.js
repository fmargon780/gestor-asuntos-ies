/* ============================================================
   documentos-campos.js — los campos propios de un tipo de DOCUMENTO,
   que entran solos en el nombre del fichero (23-sep-2026, fila 96,
   docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md).

   No son los campos del tipo de ASUNTO (esos siguen fuera del nombre
   de los documentos, a propósito): son del propio papel. Se definen
   una vez por tipo de documento, en Ajustes → El centro → Tipos de
   documento (menú ⋮ → «Campos del nombre»), y se guardan en
   `_GESTOR/campos.json`, clave `porTipoDocumento` (js/campos.js).

   El nombre queda:  AAMMDD [REGISTRO] TIPO [CAMPOS] [TEXTO ADICIONAL].ext
   (Nombres.montarDocumento, con `datos.campos` ya en orden).

   Lo usa js/documentos.js, en el cuadro de poner nombre (nombrar uno
   nuevo y renombrar). Registrar no pregunta nada: los campos ya van
   dentro del resto del nombre que Documentos.leerNombre devuelve como
   texto adicional, y así viajan tal cual.

   `DocCampos.campos(tipoDoc)`             la lista configurada
   `DocCampos.reconocer(campos, resto)`    { valores, resto }: saca del
       principio del texto adicional los valores de lista que se
       reconozcan tal cual, en orden. No adivina nada más.
   `DocCampos.enOrden(campos, valores)`    los valores, para el nombre
   `DocCampos.faltaObligatorio(campos, valores)`  el primer nombre vacío
   ============================================================ */
window.DocCampos = (function () {

  function campos(tipoDoc) {
    if (!tipoDoc || !window.App || !App.E || !window.Campos) return [];
    return Campos.camposDeDocumento(App.E.campos, tipoDoc);
  }

  /* Solo los de clase "lista", en su orden, y solo si el valor está
     justo al principio de lo que queda, entero (seguido de un espacio
     o del final). Al primero que no esté, se para. */
  function reconocer(lista, resto) {
    var valores = {};
    var queda = String(resto || '').trim();
    for (var i = 0; i < (lista || []).length; i++) {
      var c = lista[i];
      if (c.clase !== 'lista') break;
      var enc = null;
      c.valores.slice().sort(function (a, b) { return b.length - a.length; }).some(function (v) {
        var limpio = U.limpiarNombre(v);
        var trozo = queda.slice(0, limpio.length);
        var despues = queda.charAt(limpio.length);
        if (limpio && U.normalizar(trozo) === U.normalizar(limpio) && (despues === '' || despues === ' ')) {
          enc = v;
          return true;
        }
        return false;
      });
      if (!enc) break;
      valores[c.id] = enc;
      queda = queda.slice(U.limpiarNombre(enc).length).trim();
    }
    return { valores: valores, resto: queda };
  }

  function valorParaNombre(c, v) {
    if (!v) return '';
    if (c.clase === 'fecha') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? U.aAaMmDd(v) : v;
    return v;
  }

  function enOrden(lista, valores) {
    return (lista || []).map(function (c) { return valorParaNombre(c, (valores || {})[c.id]); })
      .filter(Boolean);
  }

  function faltaObligatorio(lista, valores) {
    var falta = (lista || []).filter(function (c) {
      return c.obligatorio && !String((valores || {})[c.id] || '').trim();
    })[0];
    return falta ? falta.nombre : '';
  }

  /* ---------- en el cuadro de poner nombre ---------- */

  /* Pinta los campos de `lista` en `caja`, con `valores` de partida.
     Cada control lleva data-doc-campo con el id del campo. */
  function pintar(caja, lista, valores) {
    if (!caja) return;
    if (!lista.length) { caja.innerHTML = ''; return; }
    caja.innerHTML = '<div class="doc-campos-tipo">' + lista.map(function (c) {
      var v = (valores || {})[c.id] || '';
      var control;
      if (c.clase === 'lista') {
        control = '<select class="campo" data-doc-campo="' + U.escapar(c.id) + '">' +
          '<option value="">Sin elegir</option>' +
          c.valores.map(function (x) {
            return '<option value="' + U.escapar(x) + '"' + (x === v ? ' selected' : '') + '>' + U.escapar(x) + '</option>';
          }).join('') + '</select>';
      } else {
        control = '<input class="campo" data-doc-campo="' + U.escapar(c.id) + '"' +
          (c.clase === 'fecha' ? ' type="date"' : '') + ' value="' + U.escapar(v) + '">';
      }
      return '<div><label class="etiqueta">' + U.escapar(c.nombre) +
        (c.obligatorio ? ' *' : ' <span class="suave">(opcional)</span>') + '</label>' + control + '</div>';
    }).join('') + '</div>';
  }

  function leerDe(caja) {
    var valores = {};
    if (!caja) return valores;
    Array.prototype.forEach.call(caja.querySelectorAll('[data-doc-campo]'), function (el) {
      valores[el.getAttribute('data-doc-campo')] = (el.value || '').trim();
    });
    return valores;
  }

  /* ---------- en Ajustes: editar los campos de un tipo ---------- */

  async function editar(tipoDoc) {
    var lista = campos(tipoDoc).map(function (c) { return Object.assign({}, c, { valores: c.valores.slice() }); });

    var promesa = U.preguntar('Campos del nombre: ' + tipoDoc,
      '<p class="explica">Entran en el nombre del documento, en este orden, entre el tipo y el ' +
      'texto adicional. Un campo obligatorio vacío no deja guardar el documento.</p>' +
      '<div id="doccampos-lista"></div>' +
      '<button type="button" class="boton" id="doccampos-anadir">+ Añadir un campo</button>',
      'Guardar');

    function recoger() {
      Array.prototype.forEach.call(document.querySelectorAll('#doccampos-lista [data-i]'), function (fila) {
        var c = lista[Number(fila.getAttribute('data-i'))];
        if (!c) return;
        c.nombre = fila.querySelector('.doccampos-nombre').value;
        c.clase = fila.querySelector('.doccampos-clase').value;
        c.obligatorio = fila.querySelector('.doccampos-obligatorio').checked;
        var val = fila.querySelector('.doccampos-valores');
        c.valores = val ? val.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
      });
    }

    function pintarLista() {
      var caja = document.getElementById('doccampos-lista');
      if (!caja) return;
      if (!lista.length) {
        caja.innerHTML = '<p class="nota">Este tipo todavía no tiene campos.</p>';
      } else {
        caja.innerHTML = lista.map(function (c, i) {
          return '<div class="doccampos-fila" data-i="' + i + '">' +
            '<input class="campo doccampos-nombre" placeholder="Nombre del campo" value="' + U.escapar(c.nombre) + '">' +
            '<select class="campo doccampos-clase">' +
              ['texto', 'lista', 'fecha'].map(function (k) {
                return '<option value="' + k + '"' + (c.clase === k ? ' selected' : '') + '>' +
                  { texto: 'Texto', lista: 'Lista cerrada', fecha: 'Fecha' }[k] + '</option>';
              }).join('') + '</select>' +
            (c.clase === 'lista'
              ? '<input class="campo doccampos-valores" placeholder="Valores, separados por comas" value="' +
                U.escapar(c.valores.join(', ')) + '">' : '') +
            '<label class="interruptor"><input type="checkbox" class="doccampos-obligatorio"' +
              (c.obligatorio ? ' checked' : '') + '><span>Obligatorio</span></label>' +
            '<button type="button" class="boton" data-subir="' + i + '" title="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" class="boton" data-bajar="' + i + '" title="Bajar"' + (i === lista.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button type="button" class="boton" data-quitar="' + i + '">Quitar</button>' +
            '</div>';
        }).join('');
      }
      Array.prototype.forEach.call(caja.querySelectorAll('.doccampos-clase'), function (sel) {
        sel.onchange = function () { recoger(); pintarLista(); };
      });
      Array.prototype.forEach.call(caja.querySelectorAll('[data-subir]'), function (b) {
        b.onclick = function () {
          recoger(); var i = Number(b.getAttribute('data-subir'));
          var x = lista[i]; lista[i] = lista[i - 1]; lista[i - 1] = x; pintarLista();
        };
      });
      Array.prototype.forEach.call(caja.querySelectorAll('[data-bajar]'), function (b) {
        b.onclick = function () {
          recoger(); var i = Number(b.getAttribute('data-bajar'));
          var x = lista[i]; lista[i] = lista[i + 1]; lista[i + 1] = x; pintarLista();
        };
      });
      Array.prototype.forEach.call(caja.querySelectorAll('[data-quitar]'), function (b) {
        b.onclick = function () { recoger(); lista.splice(Number(b.getAttribute('data-quitar')), 1); pintarLista(); };
      });
    }

    document.getElementById('doccampos-anadir').onclick = function () {
      recoger();
      lista.push({ id: U.nuevoId('d'), nombre: '', clase: 'texto', valores: [], obligatorio: false });
      pintarLista();
      var nombres = document.querySelectorAll('#doccampos-lista .doccampos-nombre');
      if (nombres.length) nombres[nombres.length - 1].focus();
    };
    pintarLista();

    var ok = await promesa;
    if (!ok) return false;
    recoger();
    try {
      App.E.campos = await Campos.guardarCamposDeDocumento(App.E.gestor, tipoDoc, lista);
      U.aviso('Campos de ' + tipoDoc + ' guardados.', 'bueno');
      if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
      return true;
    } catch (e) {
      U.aviso('No he podido guardar los campos: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
  }

  return {
    campos: campos, reconocer: reconocer, enOrden: enOrden, faltaObligatorio: faltaObligatorio,
    pintar: pintar, leerDe: leerDe, editar: editar
  };
})();
