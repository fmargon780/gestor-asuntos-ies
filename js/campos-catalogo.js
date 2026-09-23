/* ============================================================
   campos-catalogo.js — el panel de "+ Añadir campo" (fila 56,
   18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md).

   Antes, la sección Campos de la pantalla de un tipo enseñaba el
   catálogo entero desplegado, debajo de la lista de campos puestos.
   Ahora ese catálogo se va a un panel aparte, con tres pestañas (De
   la ficha · Míos · Calculados) y un botón "← Volver a los campos
   del tipo". Es un panel dentro de la propia sección, no un cuadro
   emergente: solo hay un `U.preguntar` (docs/CONTEXTO-CORTO.md) y no
   se puede abrir un segundo mientras el primero espera.

   `js/ajustes-tipo.js` sigue siendo dueño de `lista` (los campos ya
   puestos en el tipo, todavía sin guardar) y de cuándo se vuelve al
   listado; este fichero solo pinta el panel y llama a `opciones.onCambio()`
   cada vez que `lista` cambia (añadir, o quitar al borrar un propio o
   un calculado que este tipo tuviera puesto), para que la pantalla
   del tipo sepa que hay algo sin guardar. Los campos propios y los calculados
   (que SÍ se guardan al crearlos o cambiarlos, no al pulsar "Guardar
   campos") se leen y se escriben aquí, con `Campos.guardarPropios` /
   `Campos.guardarCalculados`, actualizando `App.E.campos` cada vez.
   ============================================================ */
var CamposCatalogo = (function () {

  var pestanaActual = 'ficha';

  function $(raiz, id) { return raiz.querySelector('#' + id); }

  function clavesUsadas(lista) {
    var u = {};
    (lista || []).forEach(function (c) { u[Campos.claveDeCampo(c)] = true; });
    return u;
  }

  /* ---------- abrir y pintar ---------- */

  function abrir(cuerpo, tipo, lista, opciones) {
    pestanaActual = 'ficha';
    pintar(cuerpo, tipo, lista, opciones);
  }

  async function pintar(cuerpo, tipo, lista, opciones) {
    var usadas = clavesUsadas(lista);
    var catalogoEntero = await Campos.catalogoDeCategoria(App.E.datos, tipo.categoria, App.E.campos);
    var deFicha = catalogoEntero.filter(function (c) { return c.origen === 'fichero' && !usadas[Campos.claveDeCampo(c)]; });
    var mios = (App.E.campos.propios || []).slice();
    /* Los calculados de Francisco, más "Curso" de respaldo si todavía
       no se ha migrado a campos.json (fila 56, sección 7: eso solo
       pasa la primera vez que el fichero YA existe; con uno recién
       empezado, `App.E.campos.calculados` puede seguir sin él). Sin
       esto, la pestaña Calculados se veía vacía hasta guardar algo,
       aunque el catálogo de "De la ficha"/tipo sí lo ofreciera. */
    var calculadosDeUsuario2 = (App.E.campos.calculados || []).filter(function (c) {
      return c.categorias.indexOf(tipo.categoria) !== -1;
    });
    var idsDeUsuario2 = {};
    calculadosDeUsuario2.forEach(function (c) { idsDeUsuario2[c.id] = true; });
    var calculadosDeFabrica2 = Campos.CALCULADOS.filter(function (c) {
      return c.categorias.indexOf(tipo.categoria) !== -1 && !idsDeUsuario2[c.id] && c.id === 'curso';
    }).map(function () { return Campos.RECETA_CURSO_DE_FABRICA; });
    var calculados = calculadosDeUsuario2.concat(calculadosDeFabrica2);

    cuerpo.innerHTML =
      '<div class="pestanas-categoria" id="campos-catalogo-pestanas">' +
        pestanaHtml('ficha', 'De la ficha', deFicha.length) +
        pestanaHtml('mios', 'Míos', mios.length) +
        pestanaHtml('calculados', 'Calculados', calculados.length) +
      '</div>' +
      '<button type="button" class="boton" id="campos-catalogo-volver" style="margin:10px 0">' +
      '← Volver a los campos del tipo</button>' +
      '<div id="campos-catalogo-cuerpo"></div>';

    Array.prototype.forEach.call(cuerpo.querySelectorAll('.pestana-categoria'), function (b) {
      b.onclick = function () { pestanaActual = b.dataset.pestana; pintar(cuerpo, tipo, lista, opciones); };
    });
    $(cuerpo, 'campos-catalogo-volver').onclick = function () { opciones.onVolver(); };

    var interior = $(cuerpo, 'campos-catalogo-cuerpo');
    if (pestanaActual === 'ficha') pintarFicha(interior, deFicha, lista, opciones);
    else if (pestanaActual === 'mios') pintarMios(interior, tipo, mios, lista, opciones, cuerpo);
    else pintarCalculados(interior, tipo, calculados, lista, opciones, cuerpo);
  }

  function pestanaHtml(id, etiqueta, cuenta) {
    return '<button type="button" class="pestana-categoria' + (pestanaActual === id ? ' activa' : '') +
      '" data-pestana="' + id + '">' + U.escapar(etiqueta) +
      ' <span class="pestana-cuenta">' + cuenta + '</span></button>';
  }

  function reabrir(cuerpo, tipo, lista, opciones) { pintar(cuerpo, tipo, lista, opciones); }

  /* ---------- pestaña "De la ficha" ---------- */

  function pintarFicha(interior, deFicha, lista, opciones) {
    interior.innerHTML =
      '<input id="campos-catalogo-buscar" class="campo" placeholder="Buscar un campo…" style="margin-bottom:8px">' +
      '<div id="campos-catalogo-ficha-lista" class="campos-catalogo-rejilla"></div>';
    var buscar = $(interior, 'campos-catalogo-buscar');
    function repintarLista() { pintarListaFicha($(interior, 'campos-catalogo-ficha-lista'), deFicha, buscar.value, lista, opciones); }
    buscar.oninput = repintarLista;
    repintarLista();
  }

  function pintarListaFicha(cont, deFicha, filtro, lista, opciones) {
    var q = U.normalizar(filtro || '');
    var visibles = deFicha.filter(function (c) { return !q || U.normalizar(c.nombre).indexOf(q) !== -1; });
    if (!visibles.length) {
      cont.innerHTML = '<div class="vacio">Nada que añadir' + (filtro ? ' con ese texto' : '') + '.</div>';
      return;
    }
    cont.innerHTML = '';
    visibles.slice(0, 120).forEach(function (c) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(c.nombre) + '</span>';
      var anadir = document.createElement('button');
      anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir';
      anadir.onclick = function () {
        lista.push({ origen: 'fichero', columna: c.columna, obligatorio: false, enNombre: false });
        opciones.onCambio();
        /* Se queda en el propio panel (no vuelve al listado), y sin
           perder lo escrito en el buscador: se quita la fila de aquí
           mismo, sin volver a pedir el catálogo entero. */
        var i = deFicha.indexOf(c);
        if (i !== -1) deFicha.splice(i, 1);
        pintarListaFicha(cont, deFicha, filtro, lista, opciones);
      };
      f.appendChild(anadir);
      cont.appendChild(f);
    });
  }

  /* ---------- pestaña "Míos" ---------- */

  function pintarMios(interior, tipo, mios, lista, opciones, cuerpo) {
    var usadas = clavesUsadas(lista);
    interior.innerHTML = '<div id="campos-mios-lista" class="lista"></div>' +
      '<div id="campos-propio-nuevo" style="margin-top:8px"></div>' +
      '<button type="button" class="boton" id="campos-mios-crear" style="margin-top:8px">+ Crear un campo propio</button>';

    var cont = $(interior, 'campos-mios-lista');
    if (!mios.length) {
      cont.innerHTML = '<div class="vacio">Todavía no hay ningún campo propio.</div>';
    } else {
      cont.innerHTML = '';
      mios.forEach(function (p) {
        var yaPuesto = usadas['propio:' + p.id];
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(p.nombre) + '</span>' +
          '<span class="suave">' + (p.clase === 'lista' ? 'lista: ' + p.valores.join(', ') : 'texto libre') + '</span>';

        var anadir = document.createElement('button');
        anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir';
        anadir.disabled = !!yaPuesto;
        anadir.title = yaPuesto ? 'Ya está puesto en este tipo' : '';
        anadir.onclick = function () {
          lista.push({ origen: 'propio', id: p.id, obligatorio: false, enNombre: false });
          opciones.onCambio();
          reabrir(cuerpo, tipo, lista, opciones);
        };
        f.appendChild(anadir);

        var cambiar = document.createElement('button');
        cambiar.type = 'button'; cambiar.className = 'boton'; cambiar.textContent = 'Cambiar';
        cambiar.onclick = function () { abrirFormularioPropio(interior, tipo, lista, opciones, cuerpo, p); };
        f.appendChild(cambiar);

        var borrar = document.createElement('button');
        borrar.type = 'button'; borrar.className = 'boton boton-peligro'; borrar.textContent = 'Borrar';
        borrar.onclick = function () { borrarPropio(p, tipo, lista, opciones, cuerpo); };
        f.appendChild(borrar);

        cont.appendChild(f);
      });
    }

    $(interior, 'campos-mios-crear').onclick = function () { abrirFormularioPropio(interior, tipo, lista, opciones, cuerpo, null); };
  }

  function abrirFormularioPropio(interior, tipo, lista, opciones, cuerpo, existente) {
    var caja = $(interior, 'campos-propio-nuevo');
    if (!caja) return;
    var d = document.createElement('div');
    d.className = 'campos-propio-form';
    d.innerHTML =
      '<label class="etiqueta">Nombre del campo</label>' +
      '<input id="propio-nombre" class="campo" autocomplete="off" value="' + (existente ? U.escapar(existente.nombre) : '') + '">' +
      '<label class="etiqueta">Clase</label>' +
      '<select id="propio-clase" class="campo">' +
      '<option value="texto"' + (existente && existente.clase !== 'lista' ? ' selected' : '') + '>Texto libre</option>' +
      '<option value="lista"' + (existente && existente.clase === 'lista' ? ' selected' : '') + '>Lista cerrada</option></select>' +
      '<div id="propio-valores-caja"' + (existente && existente.clase === 'lista' ? '' : ' class="oculto"') + '>' +
      '<label class="etiqueta">Valores, uno por línea</label>' +
      '<textarea id="propio-valores" class="campo" rows="3">' +
      (existente && existente.valores ? U.escapar(existente.valores.join('\n')) : '') + '</textarea></div>' +
      '<div id="propio-aviso" class="nota"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
      '<button type="button" class="boton" id="propio-cancelar">Cancelar</button>' +
      '<button type="button" class="boton boton-principal" id="propio-crear">' +
      (existente ? 'Guardar los cambios' : 'Crear y añadir') + '</button>' +
      '</div>';
    caja.innerHTML = '';
    caja.appendChild(d);

    function avisoPropio() {
      var campo = $(d, 'propio-nombre');
      var aviso = $(d, 'propio-aviso');
      var crear = $(d, 'propio-crear');
      var nombre = campo.value.trim();
      if (!nombre) { crear.disabled = true; aviso.textContent = 'Escribe el nombre del campo.'; return; }
      var otros = (App.E.campos.propios || [])
        .filter(function (p) { return !existente || p.id !== existente.id; })
        .map(function (p) { return p.nombre; });
      var cerca = U.parecidos(nombre, otros);
      var mismo = cerca.filter(function (p) { return p.igual; })[0];
      if (mismo) { crear.disabled = true; aviso.textContent = 'Ya hay un campo propio así, escrito: ' + mismo.nombre + '.'; return; }
      crear.disabled = false;
      aviso.textContent = cerca.length
        ? 'Ojo, se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ') + '.'
        : 'Vale para cualquier tipo de asunto.';
    }
    $(d, 'propio-clase').onchange = function () {
      $(d, 'propio-valores-caja').classList.toggle('oculto', $(d, 'propio-clase').value !== 'lista');
    };
    $(d, 'propio-nombre').oninput = avisoPropio;
    $(d, 'propio-cancelar').onclick = function () { d.remove(); };
    $(d, 'propio-crear').onclick = function () {
      U.mientrasGuarda($(d, 'propio-crear'), async function () {
        var nombre = $(d, 'propio-nombre').value.trim();
        if (!nombre) return;
        var clase = $(d, 'propio-clase').value === 'lista' ? 'lista' : 'texto';
        var valores = clase === 'lista'
          ? $(d, 'propio-valores').value.split('\n').map(function (v) { return v.trim(); }).filter(Boolean)
          : [];
        try {
          if (existente) {
            App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) {
              var p = propios.filter(function (x) { return x.id === existente.id; })[0];
              if (p) { p.nombre = nombre; p.clase = clase; p.valores = valores; }
              return propios;
            });
            U.aviso('Campo propio ' + nombre + ' guardado.', 'bueno');
          } else {
            var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000), nombre: nombre, clase: clase, valores: valores };
            App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) { propios.push(nuevo); return propios; });
            lista.push({ origen: 'propio', id: nuevo.id, obligatorio: false, enNombre: false });
            opciones.onCambio();
            U.aviso('Campo propio ' + nombre + ' creado.', 'bueno');
          }
          reabrir(cuerpo, tipo, lista, opciones);
        } catch (e) { U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo'); }
      });
    };
    avisoPropio();
    $(d, 'propio-nombre').focus();
  }

  async function borrarPropio(p, tipo, lista, opciones, cuerpo) {
    var otros = Campos.tiposQueUsanPropio(App.E.campos, p.id).filter(function (t) { return t !== tipo.tipo; });
    var texto = otros.length
      ? 'Se usa en ' + otros.length + (otros.length === 1 ? ' tipo más' : ' tipos más') + ' (' + otros.join(', ') +
        '), y se quitará también de ahí. ¿Borrar "' + p.nombre + '"?'
      : '¿Borrar el campo propio "' + p.nombre + '"?';
    var ok = await U.preguntar('Borrar campo propio', '<p>' + U.escapar(texto) + '</p>', 'Borrar');
    if (!ok) return;
    try {
      App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) {
        return propios.filter(function (x) { return x.id !== p.id; });
      });
      /* De la lista de ESTE tipo se quita aquí mismo, en memoria: como
         el resto de `lista`, no se escribe hasta "Guardar campos", para
         no pisar otros cambios sin guardar (orden, obligatorio…). De
         los demás tipos, que no tienen nada sin guardar pendiente
         aquí, sí se quita ya, escribiendo su `porTipo` de verdad. */
      var teniaEsteTipo = false;
      for (var i = lista.length - 1; i >= 0; i--) {
        if (lista[i].origen === 'propio' && lista[i].id === p.id) { lista.splice(i, 1); teniaEsteTipo = true; }
      }
      if (teniaEsteTipo) opciones.onCambio();
      for (var j = 0; j < otros.length; j++) {
        var configTipo = ((App.E.campos.porTipo || {})[otros[j]] || []).filter(function (c) {
          return !(c.origen === 'propio' && c.id === p.id);
        });
        await Campos.guardarConfigDeTipo(App.E.gestor, otros[j], configTipo);
      }
      U.aviso('Campo propio borrado.', 'bueno');
      reabrir(cuerpo, tipo, lista, opciones);
    } catch (e) { U.aviso('No he podido borrarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  /* ---------- pestaña "Calculados" ---------- */

  function pintarCalculados(interior, tipo, calculados, lista, opciones, cuerpo) {
    var usadas = clavesUsadas(lista);
    interior.innerHTML = '<div id="campos-calc-lista" class="lista"></div>' +
      '<div id="campos-calc-editor" style="margin-top:8px"></div>' +
      '<button type="button" class="boton" id="campos-calc-crear" style="margin-top:8px">+ Crear un campo calculado</button>';

    var cont = $(interior, 'campos-calc-lista');
    if (!calculados.length) {
      cont.innerHTML = '<div class="vacio">Todavía no hay ningún campo calculado para esta categoría.</div>';
    } else {
      cont.innerHTML = '';
      calculados.forEach(function (c) {
        var yaPuesto = usadas['calculado:' + c.id];
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(c.nombre) + '</span>' +
          '<span class="suave">' + U.escapar((window.Calculo && Calculo.describir(c, App.E.campos)) || '') + '</span>';

        var anadir = document.createElement('button');
        anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir';
        anadir.disabled = !!yaPuesto;
        anadir.title = yaPuesto ? 'Ya está puesto en este tipo' : '';
        anadir.onclick = function () {
          lista.push({ origen: 'calculado', id: c.id, obligatorio: false, enNombre: false });
          opciones.onCambio();
          reabrir(cuerpo, tipo, lista, opciones);
        };
        f.appendChild(anadir);

        var cambiar = document.createElement('button');
        cambiar.type = 'button'; cambiar.className = 'boton'; cambiar.textContent = 'Cambiar';
        cambiar.onclick = function () { abrirEditorCalculado(interior, tipo, lista, opciones, cuerpo, c); };
        f.appendChild(cambiar);

        var duplicar = document.createElement('button');
        duplicar.type = 'button'; duplicar.className = 'boton'; duplicar.textContent = 'Duplicar';
        duplicar.onclick = function () {
          var copia = Object.assign({}, c, { id: null, nombre: c.nombre + ' (copia)' });
          abrirEditorCalculado(interior, tipo, lista, opciones, cuerpo, copia);
        };
        f.appendChild(duplicar);

        var borrar = document.createElement('button');
        borrar.type = 'button'; borrar.className = 'boton boton-peligro'; borrar.textContent = 'Borrar';
        borrar.onclick = function () { borrarCalculado(c, tipo, lista, opciones, cuerpo); };
        f.appendChild(borrar);

        cont.appendChild(f);
      });
    }

    $(interior, 'campos-calc-crear').onclick = function () { abrirEditorCalculado(interior, tipo, lista, opciones, cuerpo, null); };
  }

  function abrirEditorCalculado(interior, tipo, lista, opciones, cuerpo, existente) {
    var caja = $(interior, 'campos-calc-editor');
    if (!caja || !window.CamposCalculadosEditor) return;
    CamposCalculadosEditor.abrir(caja, {
      tipo: tipo,
      existente: existente,
      alGuardar: function (calculadoGuardado, esNuevo) {
        if (esNuevo) {
          lista.push({ origen: 'calculado', id: calculadoGuardado.id, obligatorio: false, enNombre: false });
          opciones.onCambio();
        }
        reabrir(cuerpo, tipo, lista, opciones);
      },
      alCancelar: function () { caja.innerHTML = ''; }
    });
  }

  async function borrarCalculado(c, tipo, lista, opciones, cuerpo) {
    var otros = Campos.tiposQueUsanCalculado(App.E.campos, c.id).filter(function (t) { return t !== tipo.tipo; });
    var texto = otros.length
      ? 'Se usa en ' + otros.length + (otros.length === 1 ? ' tipo más' : ' tipos más') + ' (' + otros.join(', ') +
        '), y se quitará también de ahí. ¿Borrar "' + c.nombre + '"?'
      : '¿Borrar el campo calculado "' + c.nombre + '"?';
    var ok = await U.preguntar('Borrar campo calculado', '<p>' + U.escapar(texto) + '</p>', 'Borrar');
    if (!ok) return;
    try {
      App.E.campos = await Campos.guardarCalculados(App.E.gestor, function (calculados) {
        return calculados.filter(function (x) { return x.id !== c.id; });
      });
      /* Igual que en borrarPropio: de este tipo se quita en memoria,
         sin escribir todavía (para no pisar otros cambios sin
         guardar); de los demás, que no tienen nada pendiente aquí, sí
         se escribe ya. */
      var teniaEsteTipo = false;
      for (var i = lista.length - 1; i >= 0; i--) {
        if (lista[i].origen === 'calculado' && lista[i].id === c.id) { lista.splice(i, 1); teniaEsteTipo = true; }
      }
      if (teniaEsteTipo) opciones.onCambio();
      for (var j = 0; j < otros.length; j++) {
        var configTipo = ((App.E.campos.porTipo || {})[otros[j]] || []).filter(function (x) {
          return !(x.origen === 'calculado' && x.id === c.id);
        });
        await Campos.guardarConfigDeTipo(App.E.gestor, otros[j], configTipo);
      }
      U.aviso('Campo calculado borrado.', 'bueno');
      reabrir(cuerpo, tipo, lista, opciones);
    } catch (e) { U.aviso('No he podido borrarlo: ' + U.mensajeDeError(e), 'malo'); }
  }

  return { abrir: abrir };
})();
window.CamposCatalogo = CamposCatalogo;
