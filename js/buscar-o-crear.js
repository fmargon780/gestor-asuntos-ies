/* ============================================================
   buscar-o-crear.js — la caja única «Buscar o crear» de Ajustes
   (fila 250, docs/BUSCAR-O-CREAR-EN-AJUSTES.md).

   La usan Tipos de asunto y Tipos de documento. Dos cosas:
   - `coincidencias(texto, nombres)`: los nombres que se parecen a lo
     escrito (sin tildes, sin mayúsculas, en cualquier orden de
     palabras, o con la errata de U.parecidos).
   - `pintarZona(opciones)`: debajo de la lista, el botón «Ninguno es
     el que busco: crear «…»» (nunca con la caja vacía), o, si el
     nombre ya existe tal cual, «Ya existe: …» con «Verlo».
   `confirmarParecidos` es el cuadro «¿Seguro que no es ninguno de
   estos?» que sale antes de crear si hay parecidos.
   ============================================================ */
window.BuscarOCrear = (function () {

  function palabras(texto) {
    return U.normalizar(texto || '').split(/[\s,.;:\-_/]+/).filter(Boolean);
  }

  function coincide(nombre, texto, parecidos) {
    var n = U.normalizar(nombre);
    var t = U.normalizar(texto || '');
    if (t && n.indexOf(t) !== -1) return true;
    var ps = palabras(texto);
    if (ps.length > 1 && ps.every(function (p) { return n.indexOf(p) !== -1; })) return true;
    return parecidos.indexOf(nombre) !== -1;
  }

  function coincidencias(texto, nombres) {
    var limpio = U.limpiarNombre(texto || '');
    if (!limpio) return nombres.slice();
    var cerca = U.parecidos(limpio, nombres).map(function (p) { return p.nombre; });
    return nombres.filter(function (n) { return coincide(n, texto, cerca); });
  }

  /* Los que se parecen de verdad: los de U.parecidos y, además, los
     mismos con las palabras en otro orden («MÉDICA BAJA» y «BAJA MEDICA»). */
  function cercanos(nombre, nombres) {
    var lista = U.parecidos(nombre, nombres).map(function (p) { return p.nombre; });
    var clave = palabras(nombre).sort().join(' ');
    nombres.forEach(function (n) {
      if (lista.indexOf(n) === -1 && palabras(nombre).length > 1 && palabras(n).sort().join(' ') === clave) lista.push(n);
    });
    return lista;
  }

  /* opciones: { zona, texto, nombres, queEs, detalle(nombre), ver(nombre), crear(nombre) } */
  function pintarZona(o) {
    var zona = o.zona;
    if (!zona) return;
    zona.innerHTML = '';
    var nombre = U.limpiarNombre(o.texto || '').toUpperCase();
    if (!nombre) return;

    var mismo = U.parecidos(nombre, o.nombres).filter(function (p) { return p.igual; })[0];
    if (mismo) {
      var donde = o.detalle ? o.detalle(mismo.nombre) : '';
      var aviso = document.createElement('div');
      aviso.className = 'aviso-en-vivo aviso-en-vivo-malo';
      aviso.innerHTML = 'Ya existe: ' + U.escapar(mismo.nombre) + (donde ? ', en ' + U.escapar(donde) : '') +
        '. <button type="button" class="enlace" data-bc="ver">Verlo</button>';
      aviso.querySelector('[data-bc="ver"]').onclick = function () { o.ver(mismo.nombre); };
      zona.appendChild(aviso);
      return;
    }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-crear-o-buscar';
    b.dataset.bc = 'crear';
    b.textContent = 'Ninguno es el que busco: crear «' + nombre + '»';
    b.onclick = function () { o.crear(nombre); };
    zona.appendChild(b);
  }

  /* El cuadro de parecidos. Devuelve una promesa: true = crearlo
     igualmente; false = cancelar. Si se pulsa uno de la lista, se
     cancela y se llama a `ver(nombre)`. Sin parecidos no pregunta. */
  function confirmarParecidos(nombre, nombres, queEs, ver) {
    var cerca = cercanos(nombre, nombres).slice(0, 4).map(function (n) { return { nombre: n }; });
    if (!cerca.length) return Promise.resolve(true);
    var promesa = U.preguntar('¿Seguro que no es ninguno de estos?',
      '<p>Vas a crear ' + U.escapar(queEs) + ' <strong>' + U.escapar(nombre) + '</strong>.</p>' +
      '<p>Ya hay ' + (cerca.length === 1 ? 'uno que se le parece' : 'otros que se le parecen') +
      ' (pulsa uno para ir a él):</p>' +
      '<ul class="lista-repetidos">' + cerca.map(function (p) {
        return '<li><button type="button" class="enlace" data-bc-ir="' + U.escapar(p.nombre) + '">' +
          U.escapar(p.nombre) + '</button></li>';
      }).join('') + '</ul>' +
      '<p class="nota">Si es el mismo con otro nombre, cancela y usa el que ya está.</p>',
      'Crearlo igualmente');
    var cuerpo = document.getElementById('cuadro-cuerpo');
    Array.prototype.forEach.call(cuerpo.querySelectorAll('[data-bc-ir]'), function (b) {
      b.onclick = function () {
        var destino = b.getAttribute('data-bc-ir');
        document.getElementById('cuadro-cancelar').click();
        if (ver) ver(destino);
      };
    });
    return promesa;
  }

  /* El cuadro de la categoría de un tipo de asunto: la de la pestaña
     que se está viendo, cambiable. Devuelve la categoría o null. */
  async function preguntarCategoria(nombre, porDefecto) {
    var ok = await U.preguntar('¿En qué categoría?',
      '<p>El tipo nuevo <strong>' + U.escapar(nombre) + '</strong> irá a:</p>' +
      '<select id="bc-categoria" class="campo">' + Nombres.CATEGORIAS.map(function (c) {
        return '<option value="' + c + '"' + (c === porDefecto ? ' selected' : '') + '>' + c + '</option>';
      }).join('') + '</select>',
      'Crear');
    if (!ok) return null;
    var sel = document.getElementById('bc-categoria');
    return sel ? sel.value : porDefecto;
  }

  return {
    coincidencias: coincidencias,
    pintarZona: pintarZona,
    confirmarParecidos: confirmarParecidos,
    preguntarCategoria: preguntarCategoria
  };
})();
