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

   Fila 435 (23-oct-2026, docs/DOCUMENTOS-CON-PERSONA-Y-LINEA-DE-DATOS.md, parte A): clase nueva
   «Persona de las listas» (`clase: 'persona'`, `listas: [categorías]`). Su valor no es un texto:
   es `{ categoria, nombre (App.textoTercero), visible }` si se eligió de las listas, o
   `{ visible, manual: true }` si se escribió a mano. `DocCampos.textoDe(v)` devuelve siempre el
   texto que se enseña; `DocCampos.relacionar(asunto, campos, valores)` añade sola a la persona
   elegida a «Personas y entidades relacionadas».
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

  /* El texto que se enseña de un valor: el propio texto, o la parte visible de una persona. */
  function textoDe(v) {
    if (!v) return '';
    if (typeof v === 'object') return String(v.visible || '').trim();
    return String(v).trim();
  }

  function valorParaNombre(c, v) {
    if (!v) return '';
    if (c.clase === 'persona') return U.limpiarNombre(textoDe(v));
    if (c.clase === 'fecha') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? U.aAaMmDd(v) : v;
    return v;
  }

  function enOrden(lista, valores) {
    return (lista || []).map(function (c) { return valorParaNombre(c, (valores || {})[c.id]); })
      .filter(Boolean);
  }

  function faltaObligatorio(lista, valores) {
    var falta = (lista || []).filter(function (c) {
      return c.obligatorio && !textoDe((valores || {})[c.id]);
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
      if (c.clase === 'persona') {
        var pv = (v && typeof v === 'object') ? v : (v ? { visible: String(v), manual: true } : null);
        control = '<span class="doc-persona">' +
          CajaConSugerencias.html('doc-persona-' + c.id, {
            placeholder: 'Escribe dos letras del nombre', valor: pv ? textoDe(pv) : ''
          }) + ' <span class="suave doc-persona-mano oculto">escrito a mano</span></span>';
      } else if (c.clase === 'lista') {
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
    lista.forEach(function (c) {
      if (c.clase === 'persona') engancharPersona(caja, c, (valores || {})[c.id]);
    });
  }

  /* La caja de búsqueda de un campo «Persona de las listas»: sugiere solo de las listas marcadas, con la
     lista al lado, y deja escribir a mano. El valor vive en el propio <input> (data-persona = la elegida). */
  function engancharPersona(caja, c, valor) {
    var entrada = caja.querySelector('#doc-persona-' + c.id);
    if (!entrada) return;
    var marca = entrada.parentNode.parentNode.querySelector('.doc-persona-mano');
    entrada.setAttribute('data-doc-campo', c.id);
    entrada.setAttribute('data-doc-clase', 'persona');
    if (valor && typeof valor === 'object' && !valor.manual && valor.categoria) {
      entrada.setAttribute('data-persona', JSON.stringify(valor));
    }
    var cargadas = {};
    var listas = (c.listas || []).slice();
    var ctl = null;
    listas.forEach(function (cat) {
      if (!window.Datos || !window.App || !App.E || !App.E.datos) return;
      Promise.resolve(Datos.cargar(App.E.datos, cat)).then(function (f) {
        cargadas[cat] = f;
        if (ctl && document.activeElement === entrada) ctl.repintar();
      }).catch(function () { /* esa lista no se pudo leer: no sugiere de ella */ });
    });
    function fuente(texto) {
      var salida = [];
      listas.forEach(function (cat) {
        var f = cargadas[cat];
        if (!f) return;
        Datos.buscar(f.lista, texto, 6).forEach(function (p) {
          var pie = App.pieDe ? App.pieDe(p) : '';
          salida.push({
            valor: cat + '|' + p.nombre, texto: p.nombre,
            detalle: Nombres.textoCategoria(cat, 'lista') + (pie ? ' · ' + pie : ''),
            persona: { categoria: cat, nombre: App.textoTercero(p), visible: p.nombre }
          });
        });
      });
      return salida;
    }
    function repintarMarca() {
      var v = valorDeEntrada(entrada);
      marca.classList.toggle('oculto', !(v && v.manual));
    }
    ctl = CajaConSugerencias.enganchar(caja, 'doc-persona-' + c.id, {
      fuente: fuente, minimo: 2,
      alElegir: function (o) {
        entrada.setAttribute('data-persona', JSON.stringify(o.persona));
        repintarMarca();
        if (entrada.onchange) entrada.onchange();
      }
    });
    entrada.addEventListener('input', repintarMarca);
    repintarMarca();
  }

  /* '' si está vacío; la persona elegida si el texto sigue siendo el suyo; si no, lo escrito a mano. */
  function valorDeEntrada(el) {
    var texto = (el.value || '').trim();
    if (!texto) return '';
    var guardada = el.getAttribute('data-persona');
    if (guardada) {
      try {
        var p = JSON.parse(guardada);
        if (p && U.normalizar(p.visible) === U.normalizar(texto)) return p;
      } catch (e) { /* se trata como escrito a mano */ }
    }
    return { visible: texto, manual: true };
  }

  function leerDe(caja) {
    var valores = {};
    if (!caja) return valores;
    Array.prototype.forEach.call(caja.querySelectorAll('[data-doc-campo]'), function (el) {
      valores[el.getAttribute('data-doc-campo')] = el.getAttribute('data-doc-clase') === 'persona'
        ? valorDeEntrada(el) : (el.value || '').trim();
    });
    return valores;
  }

  /* ---------- en Ajustes: editar los campos de un tipo ---------- */

  async function editar(tipoDoc) {
    var lista = campos(tipoDoc).map(function (c) { return Object.assign({}, c, { valores: c.valores.slice() }); });

    function abrir() {
      var promesa = U.preguntar('Campos del nombre: ' + tipoDoc,
        '<p class="explica">Se anotan en cada documento de este tipo y salen debajo de su nombre. ' +
        'Un campo obligatorio vacío no deja guardar el documento.</p>' +
        '<div id="doccampos-lista"></div>' +
        '<button type="button" class="boton" id="doccampos-anadir">+ Añadir un campo</button>',
        'Guardar');
      document.getElementById('doccampos-anadir').onclick = function () {
        recoger();
        lista.push({ id: U.nuevoId('d'), nombre: '', clase: 'texto', valores: [], obligatorio: false });
        pintarLista();
        var nombres = document.querySelectorAll('#doccampos-lista .doccampos-nombre');
        if (nombres.length) nombres[nombres.length - 1].focus();
      };
      pintarLista();
      return promesa;
    }

    function recoger() {
      Array.prototype.forEach.call(document.querySelectorAll('#doccampos-lista [data-i]'), function (fila) {
        var c = lista[Number(fila.getAttribute('data-i'))];
        if (!c) return;
        c.nombre = fila.querySelector('.doccampos-nombre').value;
        c.clase = fila.querySelector('.doccampos-clase').value;
        c.obligatorio = fila.querySelector('.doccampos-obligatorio').checked;
        var val = fila.querySelector('.doccampos-valores');
        c.valores = val ? val.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
        if (c.clase === 'persona') {
          c.listas = Array.prototype.map.call(fila.querySelectorAll('.doccampos-lista-chk:checked'),
            function (x) { return x.value; });
        } else {
          delete c.listas;
        }
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
              ['texto', 'lista', 'fecha', 'persona'].map(function (k) {
                return '<option value="' + k + '"' + (c.clase === k ? ' selected' : '') + '>' +
                  { texto: 'Texto', lista: 'Lista cerrada', fecha: 'Fecha', persona: 'Persona de las listas' }[k] + '</option>';
              }).join('') + '</select>' +
            (c.clase === 'lista'
              ? '<input class="campo doccampos-valores" placeholder="Valores, separados por comas" value="' +
                U.escapar(c.valores.join(', ')) + '">' : '') +
            (c.clase === 'persona' ? '<div class="doccampos-listas"><span class="suave">Busca en:</span> ' +
              Nombres.CATEGORIAS.map(function (k) {
                return '<label class="interruptor"><input type="checkbox" class="doccampos-lista-chk" value="' + U.escapar(k) + '"' +
                  ((c.listas || []).indexOf(k) !== -1 ? ' checked' : '') + '><span>' +
                  U.escapar(Nombres.textoCategoria(k, 'lista')) + '</span></label>';
              }).join(' ') + '</div>' : '') +
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

    /* Un campo «Persona de las listas» sin ninguna lista marcada no deja guardar: se vuelve a abrir. */
    while (true) {
      var ok = await abrir();
      if (!ok) return false;
      recoger();
      var sinLista = lista.filter(function (c) { return c.clase === 'persona' && c.nombre.trim() && !(c.listas || []).length; })[0];
      if (!sinLista) break;
      U.aviso('Marca al menos una lista en «' + sinLista.nombre.trim() + '».', 'malo');
    }
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

  /* Fila 435: tras guardar un documento, las personas elegidas de las listas pasan sin preguntar a «Personas y
     entidades relacionadas» del asunto (como js/candidaturas.js). Las escritas a mano no; el titular tampoco;
     nunca se quita ninguna. */
  async function relacionar(asunto, lista, valores) {
    if (!asunto || !window.App || !App.anotarLista) return [];
    var ficha = asunto.ficha || {};
    var categoriaPrincipal = ficha.categoria || (asunto.leido && asunto.leido.categoria) || '';
    var titular = U.normalizar(ficha.tercero || '');
    var yaEstan = (ficha.relacionados || []).map(function (r) { return r.categoria + '|' + U.normalizar(r.nombre); });
    var nuevos = [];
    (lista || []).forEach(function (c) {
      var v = c.clase === 'persona' ? (valores || {})[c.id] : null;
      if (!v || typeof v !== 'object' || v.manual || !v.categoria || !v.nombre) return;
      var clave = v.categoria + '|' + U.normalizar(v.nombre);
      if (v.categoria === categoriaPrincipal && titular && U.normalizar(v.nombre) === titular) return;
      if (yaEstan.indexOf(clave) !== -1) return;
      yaEstan.push(clave);
      nuevos.push({ categoria: v.categoria, nombre: v.nombre, visible: v.visible });
    });
    if (!nuevos.length) return [];
    await App.anotarLista(asunto.nombre, 'relacionados',
      { anadir: nuevos.map(function (p) { return { categoria: p.categoria, nombre: p.nombre }; }) });
    U.aviso(nuevos.map(function (p) { return p.visible || p.nombre; }).join(', ') +
      ' añadido a las personas relacionadas del asunto.', 'bueno');
    return nuevos;
  }

  return {
    textoDe: textoDe, relacionar: relacionar,
    campos: campos, reconocer: reconocer, enOrden: enOrden, faltaObligatorio: faltaObligatorio,
    pintar: pintar, leerDe: leerDe, editar: editar
  };
})();
