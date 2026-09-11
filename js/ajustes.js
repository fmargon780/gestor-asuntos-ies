/* ============================================================
   ajustes.js — la pantalla de Ajustes.

   Los tipos de asunto con sus plazos, los estados de tramitación y
   los tipos de documento. Los bloques de los avisos y de los asuntos
   que se repiten los pintan sus propios módulos.
   ============================================================ */

/* ---------- cambiarle el nombre a un tipo de asunto ----------

   Los asuntos ABIERTOS se renombran: son pocos y es el trabajo vivo.

   El ARCHIVO no se toca. Renombrar allí obligaría a copiar y borrar
   carpeta por carpeta, con Dropbox resincronizando de fondo, y el
   nombre de una carpeta archivada es el rastro de lo que se hizo aquel
   día. En su lugar, el nombre viejo se guarda como alias del tipo: las
   carpetas antiguas se siguen reconociendo y se enseñan con el nombre
   nuevo, sin mover un solo fichero. */
App.renombrarTipo = async function (tipo) {
  var ok = await U.preguntar('Cambiar el nombre del tipo',
    '<label class="etiqueta">Nombre nuevo</label>' +
    '<input id="tipo-nuevo-nombre" class="campo" value="' + U.escapar(tipo.tipo) + '">' +
    '<p class="nota">Se cambiará en los asuntos abiertos que lo usen. ' +
    'Las carpetas del archivo no se tocan: se seguirán llamando como se llaman, ' +
    'y el buscador las encontrará igual.</p>', 'Cambiar');
  if (!ok) return;

  var nombreNuevo = U.limpiarNombre($('tipo-nuevo-nombre').value).toUpperCase();
  if (!nombreNuevo || nombreNuevo === tipo.tipo) return;

  var repetido = App.E.tipos.some(function (t) {
    return t !== tipo && U.normalizar(t.tipo) === U.normalizar(nombreNuevo);
  });
  if (repetido) { U.aviso('Ya hay otro tipo con ese nombre.', 'malo'); return; }

  var nombreViejo = tipo.tipo;
  var afectadas = App.E.listaAbiertos.filter(function (a) {
    return a.leido.reconocido && a.leido.tipo === nombreViejo;
  });

  var cambiadas = 0, fallos = [];
  for (var i = 0; i < afectadas.length; i++) {
    var a = afectadas[i];
    var nombreCarpeta = a.nombre.replace(a.nombre.slice(7, 7 + nombreViejo.length), nombreNuevo);
    try {
      await Carpetas.renombrar(App.E.abiertos, a.nombre, nombreCarpeta);
      var ficha = App.E.registro.asuntos[a.nombre];
      if (ficha) {
        ficha.tipo = nombreNuevo;
        await App.anotar(nombreCarpeta, ficha);
      }
      cambiadas++;
    } catch (e) {
      fallos.push(a.nombre + ': ' + e.message);
    }
  }

  tipo.alias = tipo.alias || [];
  if (tipo.alias.indexOf(nombreViejo) === -1) tipo.alias.push(nombreViejo);
  tipo.tipo = nombreNuevo;
  await App.guardarTipos();

  await App.verAbiertos();
  App.pintarAjustes();

  if (fallos.length) {
    U.aviso('Cambiadas ' + cambiadas + ' carpetas. ' + fallos.length + ' no se han podido.', 'malo');
  } else {
    U.aviso('Tipo renombrado. Carpetas abiertas cambiadas: ' + cambiadas + '.', 'bueno');
  }
};

App.pintarAjustes = async function () {
  var caja = $('tabla-tipos');
  caja.innerHTML = '';
  Nombres.CATEGORIAS.forEach(function (cat) {
    var deEsta = App.E.tipos.filter(function (t) { return t.categoria === cat; });
    if (!deEsta.length) return;
    var t = document.createElement('h4');
    t.textContent = cat;
    t.style.cssText = 'margin:16px 0 4px;font-size:13px;color:#5d6b7a';
    caja.appendChild(t);
    deEsta.forEach(function (tipo) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(tipo.tipo) + '</span>' +
        ((tipo.alias && tipo.alias.length)
          ? '<span class="suave">antes: ' + U.escapar(tipo.alias.join(', ')) + '</span>' : '');

      /* Los días de plazo de este tipo. En blanco, el tipo no pone
         fecha límite y el asunto nace sin plazo. */
      var etiquetaPlazo = document.createElement('label');
      etiquetaPlazo.className = 'plazo-tipo';
      var casilla = document.createElement('input');
      casilla.type = 'number';
      casilla.min = '0';
      casilla.className = 'campo campo-plazo';
      casilla.value = (tipo.plazo ? String(tipo.plazo) : '');
      casilla.placeholder = '—';
      casilla.title = 'Días de plazo para resolver este tipo de asunto. ' +
                      'Déjalo en blanco si no tiene plazo.';
      casilla.onchange = async function () {
        var n = parseInt(casilla.value, 10);
        if (!isNaN(n) && n > 0) tipo.plazo = n; else delete tipo.plazo;
        await App.guardarTipos();
        U.aviso(tipo.plazo ? tipo.tipo + ': ' + tipo.plazo + ' días de plazo.'
                           : tipo.tipo + ' se queda sin plazo.', 'bueno');
      };
      etiquetaPlazo.appendChild(casilla);
      var diasTexto = document.createElement('span');
      diasTexto.className = 'suave';
      diasTexto.textContent = 'días de plazo';
      etiquetaPlazo.appendChild(diasTexto);
      f.appendChild(etiquetaPlazo);

      var campos = document.createElement('button');
      campos.className = 'boton';
      campos.textContent = 'Campos';
      campos.title = 'Qué datos lleva este tipo de asunto, y cuáles van al nombre de la carpeta';
      campos.onclick = function () { App.abrirCamposDeTipo(tipo); };
      f.appendChild(campos);

      var editar = document.createElement('button');
      editar.className = 'boton';
      editar.textContent = 'Cambiar el nombre';
      editar.onclick = function () { App.renombrarTipo(tipo); };
      f.appendChild(editar);
      var quitar = document.createElement('button');
      quitar.className = 'boton boton-peligro';
      quitar.textContent = 'Quitar';
      quitar.onclick = async function () {
        App.E.tipos = App.E.tipos.filter(function (x) { return x.tipo !== tipo.tipo; });
        await App.guardarTipos();
        App.pintarAjustes();
      };
      f.appendChild(quitar);
      caja.appendChild(f);
    });
  });

  App.pintarTablaEstados();
  App.pintarCamposPropios();

  var estado = $('estado-datos');
  estado.innerHTML = '';
  var alumnado = await Datos.cargar(App.E.datos, 'ALUMNADO');

  /* Cómo queda abreviado cada grupo. Es lo único de esta pantalla que
     hay que mirar con datos reales delante: si un grupo de Bachillerato
     o de un ciclo saliera mal, se ve aquí de un vistazo. */
  var grupos = $('tabla-grupos');
  grupos.innerHTML = '';
  var unidades = Datos.unidadesDistintas(alumnado.lista);
  if (!unidades.length) {
    grupos.innerHTML = '<div class="vacio">Todavía no hay alumnado cargado.</div>';
  } else {
    unidades.forEach(function (u) {
      var d = document.createElement('div');
      d.className = 'fila-tipo';
      d.innerHTML = '<span class="suave" style="flex:1">' + U.escapar(u.unidad) +
                    '  ·  ' + u.cuantos + ' alumnos</span>' +
                    '<span class="nombre-tipo">' +
                    U.escapar(Nombres.grupoCompacto(u.unidad, u.curso)) + '</span>';
      grupos.appendChild(d);
    });
  }

  var tdoc = $('tabla-tipos-documento');
  tdoc.innerHTML = '';
  App.E.tiposDocumento.forEach(function (nombre) {
    var f = document.createElement('div');
    f.className = 'fila-tipo';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(nombre) + '</span>';
    var quitar = document.createElement('button');
    quitar.className = 'boton boton-peligro';
    quitar.textContent = 'Quitar';
    quitar.onclick = async function () {
      App.E.tiposDocumento = App.E.tiposDocumento.filter(function (x) { return x !== nombre; });
      await App.guardarTiposDocumento();
      App.pintarAjustes();
    };
    f.appendChild(quitar);
    tdoc.appendChild(f);
  });

  estado.appendChild(App.filaEstado('RegAlum.csv (alumnado)',
    alumnado.fichero
      ? alumnado.fichero + '  ·  curso ' + (alumnado.curso || 'sin determinar') +
        '  ·  ' + alumnado.matriculados + ' matriculados de ' + alumnado.lista.length +
        ' que hay en el fichero'
      : 'No está. Déjalo en _GESTOR/datos y vuelve a entrar.'));

  /* Qué columnas ha reconocido del RegAlum. Si un día Séneca le cambia
     el título a una, aquí se ve cuál falta, y así se entiende por qué
     la aplicación deja de ofrecer el grupo o la edad. */
  if (alumnado.fichero) {
    if (alumnado.sinAnos) {
      estado.appendChild(App.filaEstado('Año de la matrícula',
        'El fichero no trae años. Se toma como la foto del curso de hoy: ' +
        'todo el que no esté anulado ni trasladado cuenta como matriculado.'));
    }
    if (alumnado.faltan && alumnado.faltan.length) {
      estado.appendChild(App.filaEstado('Columnas que no encuentro',
        alumnado.faltan.join(', ') + '  ·  el fichero trae: ' +
        (alumnado.cabecera || []).join(', ')));
    } else {
      estado.appendChild(App.filaEstado('Columnas del RegAlum',
        'Las reconozco todas.'));
    }
    if (alumnado.solicitantes) {
      estado.appendChild(App.filaEstado('solicitantes.csv',
        alumnado.solicitantes + ' dados de alta a mano, todavía sin matricular'));
    }
  }
  var personal = await Datos.cargar(App.E.datos, 'PERSONAL');
  if (!personal.ficheros.length) {
    estado.appendChild(App.filaEstado('RelPerCen (personal)',
      'No hay ninguno. Déjalos en _GESTOR/datos y vuelve a entrar.'));
  } else {
    personal.ficheros.forEach(function (r) {
      estado.appendChild(App.filaEstado(r.fichero,
        'curso ' + r.curso + '  ·  ' + r.filas + ' personas'));
    });
    estado.appendChild(App.filaEstado('Personal en total',
      personal.enElCentro + ' en el centro (curso ' + personal.curso + ') de ' +
      personal.lista.length + ' fichas' +
      (personal.manuales ? '  ·  ' + personal.manuales + ' de alta a mano' : '')));
  }
  for (var cat in Datos.LISTAS) {
    if (cat === 'PERSONAL' || cat === 'ALUMNADO') continue;
    var l = await Datos.cargar(App.E.datos, cat);
    estado.appendChild(App.filaEstado(Datos.LISTAS[cat].fichero, l.lista.length + ' fichas'));
  }

  var carp = $('estado-carpetas');
  carp.innerHTML = '';
  carp.appendChild(App.filaEstado('Asuntos abiertos', App.E.abiertos.name));
  carp.appendChild(App.filaEstado('Archivo', App.E.archivo.name));

  await App.pintarCopias();
  await App.pintarFichasHuerfanas();
};

/* ---------- los campos de un tipo de asunto ----------

   Se abre en un cuadro ancho (misma clase que usa el visor de
   documentos), porque una lista con el catálogo entero de columnas
   del RegAlum no se puede leer en una columna estrecha.

   Se relee `campos.json` justo al abrir, por si el compañero lo ha
   cambiado desde el otro ordenador mientras tanto. */
App.abrirCamposDeTipo = async function (tipo) {
  var config = await Campos.leer(App.E.gestor);
  App.E.campos = config;
  var catalogo = await Campos.catalogoDeCategoria(App.E.datos, tipo.categoria, config);
  var lista = (config.porTipo[tipo.tipo] || []).map(function (c) { return Object.assign({}, c); });

  var cuadro = document.querySelector('#capa .cuadro');
  cuadro.classList.add('cuadro-ancho');
  var promesa = U.preguntar('Campos de ' + tipo.tipo, '<div id="campos-cuerpo"></div>', 'Guardar');
  App.pintarCuadroDeCampos(lista, catalogo, tipo.categoria);
  var ok = await promesa;
  cuadro.classList.remove('cuadro-ancho');
  if (!ok) return;

  App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
  App.pintarAjustes();
  U.aviso('Campos de ' + tipo.tipo + ' guardados.', 'bueno');
};

/* `lista` se muta en el sitio: al aceptar el cuadro, quien llamó lee
   la misma variable. Así no hace falta ir sacando el estado del DOM. */
App.pintarCuadroDeCampos = function (lista, catalogo, categoria) {
  var caja = $('campos-cuerpo');
  if (!caja) return;

  function textoOrigen(c) {
    return c.origen === 'fichero' ? 'del fichero' : (c.origen === 'calculado' ? 'calculado' : 'propio');
  }

  function catalogoDisponible(filtro) {
    var usadas = {};
    lista.forEach(function (c) { usadas[Campos.claveDeCampo(c)] = true; });
    var q = U.normalizar(filtro || '');
    return catalogo.filter(function (c) {
      if (usadas[Campos.claveDeCampo(c)]) return false;
      if (q && U.normalizar(c.nombre).indexOf(q) === -1) return false;
      return true;
    });
  }

  function pintar() {
    var buscado = $('campos-buscar') ? $('campos-buscar').value : '';
    caja.innerHTML =
      '<p class="explica">Arriba, los campos ya puestos a este tipo, en el orden en que saldrán ' +
      'en el formulario y en el nombre de la carpeta. Con las flechas se reordenan.</p>' +
      '<div id="campos-puestos" class="lista"></div>' +
      '<p class="explica" style="margin-top:18px">Campos disponibles en ' + U.escapar(categoria) +
      ':</p>' +
      '<input id="campos-buscar" class="campo" placeholder="Buscar un campo…" value="' +
      U.escapar(buscado) + '">' +
      '<div id="campos-catalogo" class="lista" style="margin-top:8px"></div>' +
      '<div id="campos-propio-nuevo"></div>' +
      '<button type="button" class="boton" id="campos-btn-propio" style="margin-top:8px">' +
      '+ Crear un campo propio</button>';

    pintarPuestos();
    pintarCatalogo(buscado);
    $('campos-buscar').oninput = function () { pintarCatalogo($('campos-buscar').value); };
    $('campos-btn-propio').onclick = abrirFormularioPropio;
  }

  function pintarPuestos() {
    var cont = $('campos-puestos');
    cont.innerHTML = '';
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio">Ningún campo puesto todavía.</div>';
      return;
    }
    lista.forEach(function (c, i) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(Campos.nombreDeCampo(c, App.E.campos)) +
        '</span><span class="suave">' + textoOrigen(c) + '</span>';

      var oblig = document.createElement('label');
      oblig.className = 'interruptor interruptor-fila';
      var cOblig = document.createElement('input');
      cOblig.type = 'checkbox';
      cOblig.checked = !!c.obligatorio;
      cOblig.onchange = function () { c.obligatorio = cOblig.checked; };
      oblig.appendChild(cOblig);
      var tOblig = document.createElement('span');
      tOblig.textContent = 'Obligatorio';
      oblig.appendChild(tOblig);
      f.appendChild(oblig);

      var enNom = document.createElement('label');
      enNom.className = 'interruptor interruptor-fila';
      var cEnNom = document.createElement('input');
      cEnNom.type = 'checkbox';
      cEnNom.checked = c.enNombre !== false;
      cEnNom.onchange = function () { c.enNombre = cEnNom.checked; };
      enNom.appendChild(cEnNom);
      var tEnNom = document.createElement('span');
      tEnNom.textContent = 'Añadir al nombre';
      enNom.appendChild(tEnNom);
      f.appendChild(enNom);

      var subir = document.createElement('button');
      subir.type = 'button'; subir.className = 'boton'; subir.textContent = '▲';
      subir.title = 'Subirlo un puesto'; subir.disabled = (i === 0);
      subir.onclick = function () { mover(i, -1); };
      f.appendChild(subir);

      var bajar = document.createElement('button');
      bajar.type = 'button'; bajar.className = 'boton'; bajar.textContent = '▼';
      bajar.title = 'Bajarlo un puesto'; bajar.disabled = (i === lista.length - 1);
      bajar.onclick = function () { mover(i, 1); };
      f.appendChild(bajar);

      var quitar = document.createElement('button');
      quitar.type = 'button'; quitar.className = 'boton boton-peligro'; quitar.textContent = 'Quitar';
      quitar.onclick = function () { lista.splice(i, 1); pintar(); };
      f.appendChild(quitar);

      cont.appendChild(f);
    });
  }

  function mover(i, salto) {
    var j = i + salto;
    if (j < 0 || j >= lista.length) return;
    var g = lista[i]; lista[i] = lista[j]; lista[j] = g;
    pintarPuestos();
  }

  function pintarCatalogo(filtro) {
    var cont = $('campos-catalogo');
    var disponibles = catalogoDisponible(filtro);
    if (!disponibles.length) {
      cont.innerHTML = '<div class="vacio">Nada que añadir' + (filtro ? ' con ese texto' : '') + '.</div>';
      return;
    }
    cont.innerHTML = '';
    disponibles.slice(0, 80).forEach(function (c) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(c.nombre) + '</span>' +
        '<span class="suave">' + textoOrigen(c) + '</span>';
      var anadir = document.createElement('button');
      anadir.type = 'button'; anadir.className = 'boton'; anadir.textContent = 'Añadir';
      anadir.onclick = function () {
        var nuevo = { origen: c.origen, obligatorio: false, enNombre: false };
        if (c.origen === 'fichero') nuevo.columna = c.columna; else nuevo.id = c.id;
        lista.push(nuevo);
        pintar();
      };
      f.appendChild(anadir);
      cont.appendChild(f);
    });
  }

  /* ---------- crear un campo propio sin salir de este cuadro ----------

     Misma idea que crear un tipo de documento desde el cuadro de
     nombrar un documento (js/documentos.js): unos campos se insertan
     ahí mismo, en vez de abrir un segundo cuadro. Solo hay un
     `U.preguntar` a la vez en toda la aplicación; abrir otro mientras
     este espera le robaría los botones. */

  function abrirFormularioPropio() {
    if ($('campos-propio-form')) return;
    var caja2 = $('campos-propio-nuevo');
    var d = document.createElement('div');
    d.id = 'campos-propio-form';
    d.style.cssText = 'margin:8px 0;padding:10px 12px;border:1px solid #d7dee6;' +
                      'border-radius:8px;background:#f7f9fb';
    d.innerHTML =
      '<label class="etiqueta">Nombre del campo</label>' +
      '<input id="propio-nombre" class="campo" autocomplete="off" placeholder="Por ejemplo: Trimestre">' +
      '<label class="etiqueta">Clase</label>' +
      '<select id="propio-clase" class="campo">' +
      '<option value="texto">Texto libre</option><option value="lista">Lista cerrada</option></select>' +
      '<div id="propio-valores-caja" class="oculto">' +
      '<label class="etiqueta">Valores, uno por línea</label>' +
      '<textarea id="propio-valores" class="campo" rows="3"></textarea></div>' +
      '<div id="propio-aviso" class="nota"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
      '<button type="button" class="boton" id="propio-cancelar">Cancelar</button>' +
      '<button type="button" class="boton boton-principal" id="propio-crear">Crear y añadir</button>' +
      '</div>';
    caja2.appendChild(d);

    $('propio-clase').onchange = function () {
      $('propio-valores-caja').classList.toggle('oculto', $('propio-clase').value !== 'lista');
    };
    $('propio-nombre').oninput = avisoPropio;
    $('propio-cancelar').onclick = function () { d.remove(); };
    $('propio-crear').onclick = crearPropio;
    avisoPropio();
    $('propio-nombre').focus();
  }

  function avisoPropio() {
    var campo = $('propio-nombre');
    var aviso = $('propio-aviso');
    var crear = $('propio-crear');
    if (!campo) return;
    var nombre = campo.value.trim();
    if (!nombre) {
      crear.disabled = true;
      aviso.textContent = 'Escribe el nombre del campo.';
      return;
    }
    var nombresPropios = (App.E.campos.propios || []).map(function (p) { return p.nombre; });
    var cerca = U.parecidos(nombre, nombresPropios);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      crear.disabled = true;
      aviso.textContent = 'Ya hay un campo propio así, escrito: ' + mismo.nombre + '.';
      return;
    }
    crear.disabled = false;
    aviso.textContent = cerca.length
      ? 'Ojo, se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ') + '.'
      : 'Se creará como campo propio, vale para cualquier tipo de asunto.';
  }

  async function crearPropio() {
    var nombre = $('propio-nombre').value.trim();
    if (!nombre) return;
    var clase = $('propio-clase').value === 'lista' ? 'lista' : 'texto';
    var valores = clase === 'lista'
      ? $('propio-valores').value.split('\n').map(function (v) { return v.trim(); }).filter(Boolean)
      : [];
    var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
                  nombre: nombre, clase: clase, valores: valores };
    try {
      App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) {
        propios.push(nuevo);
        return propios;
      });
      catalogo.push({ origen: 'propio', id: nuevo.id, nombre: nuevo.nombre,
                       clase: nuevo.clase, valores: nuevo.valores });
      lista.push({ origen: 'propio', id: nuevo.id, obligatorio: false, enNombre: false });
      pintar();
      U.aviso('Campo propio ' + nombre + ' creado.', 'bueno');
    } catch (e) {
      U.aviso('No he podido crearlo: ' + e.message, 'malo');
    }
  }

  pintar();
};

/* ---------- el bloque de Campos propios ---------- */

App.pintarCamposPropios = function () {
  var caja = $('tabla-propios');
  if (!caja) return;
  caja.innerHTML = '';
  var propios = (App.E.campos && App.E.campos.propios) || [];
  if (!propios.length) {
    caja.innerHTML = '<div class="vacio">Ningún campo propio todavía.</div>';
    return;
  }
  propios.forEach(function (p) {
    var f = document.createElement('div');
    f.className = 'fila-tipo';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(p.nombre) + '</span>' +
      '<span class="suave" style="flex:1">' +
      (p.clase === 'lista' ? U.escapar(p.valores.join(', ')) : 'Texto libre') + '</span>';
    var quitar = document.createElement('button');
    quitar.className = 'boton boton-peligro';
    quitar.textContent = 'Quitar';
    quitar.onclick = async function () {
      var enUso = Campos.tiposQueUsanPropio(App.E.campos, p.id);
      var ok = await U.preguntar('Quitar el campo ' + p.nombre,
        (enUso.length
          ? '<p>Lo usan estos tipos: <strong>' + enUso.map(U.escapar).join(', ') + '</strong>.</p>' +
            '<p class="nota">Se quita también de ellos. Los asuntos ya creados conservan el ' +
            'valor que tengan guardado.</p>'
          : '<p>No lo usa ningún tipo.</p>'), 'Quitar');
      if (!ok) return;
      try {
        App.E.campos = await Campos.guardarPropios(App.E.gestor, function (lista) {
          return lista.filter(function (x) { return x.id !== p.id; });
        });
        for (var i = 0; i < enUso.length; i++) {
          var claveTipo = enUso[i];
          var restante = (App.E.campos.porTipo[claveTipo] || []).filter(function (c) {
            return !(c.origen === 'propio' && c.id === p.id);
          });
          App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, claveTipo, restante);
        }
        App.pintarCamposPropios();
        U.aviso('Campo propio quitado.', 'bueno');
      } catch (e) {
        U.aviso('No he podido quitarlo: ' + e.message, 'malo');
      }
    };
    f.appendChild(quitar);
    caja.appendChild(f);
  });
};

$('btn-anadir-propio').onclick = async function () {
  var nombre = $('nuevo-propio').value.trim();
  if (!nombre) return;
  var clase = $('nueva-clase-propio').value === 'lista' ? 'lista' : 'texto';
  var hay = (App.E.campos.propios || []).map(function (p) { return p.nombre; });
  if (!await U.dejaCrear(nombre, hay, 'campo propio')) return;

  var valores = [];
  if (clase === 'lista') {
    var ok = await U.preguntar('Valores de ' + nombre,
      '<label class="etiqueta">Uno por línea, en el orden en que quieras que salgan</label>' +
      '<textarea id="propio-valores-alta" class="campo" rows="4"></textarea>', 'Guardar');
    if (!ok) return;
    valores = $('propio-valores-alta').value.split('\n').map(function (v) { return v.trim(); }).filter(Boolean);
  }
  var nuevo = { id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
                nombre: nombre, clase: clase, valores: valores };
  App.E.campos = await Campos.guardarPropios(App.E.gestor, function (propios) {
    propios.push(nuevo);
    return propios;
  });
  $('nuevo-propio').value = '';
  App.pintarCamposPropios();
  U.aviso('Campo propio añadido.', 'bueno');
};

/* ---------- el bloque de Copias de seguridad ---------- */

App.pintarCopias = async function () {
  var caja = $('tabla-copias');
  if (!caja) return;
  caja.innerHTML = '';

  var todas;
  try {
    todas = await Copias.listarTodas(App.E.gestor);
  } catch (e) {
    caja.innerHTML = '<div class="vacio">No he podido leer las copias: ' + U.escapar(e.message) + '</div>';
    return;
  }

  Copias.FICHEROS.forEach(function (nombre) {
    var copias = todas[nombre] || [];
    var f = document.createElement('div');
    f.className = 'fila-tipo';

    var ultima = copias.length ? copias[copias.length - 1] : null;
    var pie = copias.length
      ? copias.length + (copias.length === 1 ? ' copia' : ' copias') +
        '  ·  la última, del ' + U.fechaLegible(ultima.fecha)
      : 'Todavía sin ninguna copia';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(nombre) + '</span>' +
                  '<span class="suave" style="flex:1">' + U.escapar(pie) + '</span>';

    var restaurar = document.createElement('button');
    restaurar.className = 'boton';
    restaurar.textContent = 'Restaurar la última copia';
    restaurar.disabled = !copias.length;
    restaurar.onclick = async function () {
      var ok = await U.preguntar('Restaurar ' + nombre,
        '<p>Se cambia <strong>' + U.escapar(nombre) + '</strong> por su última copia' +
        (ultima ? ', del ' + U.escapar(U.fechaLegible(ultima.fecha)) : '') + '.</p>' +
        '<p class="nota">Lo que hay ahora se guarda también como copia, así que si es un ' +
        'error se puede deshacer. Después se recarga la página.</p>', 'Restaurar');
      if (!ok) return;
      try {
        await Copias.restaurar(App.E.gestor, nombre);
        U.aviso(nombre + ' restaurado.', 'bueno');
        location.reload();
      } catch (e) {
        U.aviso('No he podido restaurarlo: ' + e.message, 'malo');
      }
    };
    f.appendChild(restaurar);
    caja.appendChild(f);
  });
};

/* ---------- los estados del asunto, en Ajustes ----------

   Van en el orden del trámite, no en orden alfabético, así que se
   pueden subir y bajar con las flechas. */

App.pintarTablaEstados = function () {
  var caja = $('tabla-estados');
  caja.innerHTML = '';
  if (!App.E.estados.length) {
    caja.innerHTML = '<div class="vacio">No hay ningún estado. Añade el primero aquí arriba.</div>';
    return;
  }
  App.E.estados.forEach(function (estado, i) {
    var nombre = estado.nombre;
    var f = document.createElement('div');
    f.className = 'fila-tipo';
    f.innerHTML = '<span class="marca-estado ' + App.colorEstado(nombre) + '">' +
                  U.escapar(nombre) + '</span>' +
                  '<span class="nombre-tipo suave">' + App.cuantosCon(nombre) + '</span>';

    /* Esta casilla es la que decide en cuál de las tres tarjetas de
       arriba aparece el asunto. */
    var etiqueta = document.createElement('label');
    etiqueta.className = 'interruptor interruptor-fila';
    var casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.checked = !!estado.espera;
    casilla.onchange = async function () {
      estado.espera = casilla.checked;
      await App.guardarEstados();
      App.pintarTablaEstados();
      App.pintarAbiertos();
    };
    etiqueta.appendChild(casilla);
    var texto = document.createElement('span');
    texto.textContent = 'Depende de otros';
    texto.title = 'Con esto marcado, el asunto sale en "A la espera de terceros"';
    etiqueta.appendChild(texto);
    f.appendChild(etiqueta);

    var subir = document.createElement('button');
    subir.className = 'boton';
    subir.textContent = '▲';
    subir.title = 'Subirlo un puesto';
    subir.disabled = (i === 0);
    subir.onclick = function () { App.moverEstado(i, -1); };
    f.appendChild(subir);

    var bajar = document.createElement('button');
    bajar.className = 'boton';
    bajar.textContent = '▼';
    bajar.title = 'Bajarlo un puesto';
    bajar.disabled = (i === App.E.estados.length - 1);
    bajar.onclick = function () { App.moverEstado(i, 1); };
    f.appendChild(bajar);

    var editar = document.createElement('button');
    editar.className = 'boton';
    editar.textContent = 'Cambiar el nombre';
    editar.onclick = function () { App.renombrarEstado(nombre); };
    f.appendChild(editar);

    var quitar = document.createElement('button');
    quitar.className = 'boton boton-peligro';
    quitar.textContent = 'Quitar';
    quitar.onclick = function () { App.quitarEstado(nombre); };
    f.appendChild(quitar);

    caja.appendChild(f);
  });
};

/* Cuántos asuntos están ahora mismo en ese estado. */
App.contarCon = function (nombre) {
  var n = 0;
  Object.keys(App.E.registro.asuntos).forEach(function (k) {
    if (App.E.registro.asuntos[k].situacion === nombre) n++;
  });
  return n;
};

App.cuantosCon = function (nombre) {
  var n = App.contarCon(nombre);
  if (!n) return 'Ningún asunto';
  return n === 1 ? '1 asunto' : n + ' asuntos';
};

App.moverEstado = async function (i, salto) {
  var j = i + salto;
  if (j < 0 || j >= App.E.estados.length) return;
  var guardado = App.E.estados[i];
  App.E.estados[i] = App.E.estados[j];
  App.E.estados[j] = guardado;
  await App.guardarEstados();
  App.pintarTablaEstados();
  App.pintarFiltroEstado();
  App.pintarAbiertos();
};

/* Al cambiarle el nombre a un estado hay que cambiarlo también en los
   asuntos que lo tienen puesto, abiertos y archivados. */
App.renombrarEstado = async function (viejo) {
  var ok = await U.preguntar('Cambiar el nombre del estado',
    '<label class="etiqueta">Nombre nuevo</label>' +
    '<input id="estado-nuevo-nombre" class="campo" value="' + U.escapar(viejo) + '">' +
    '<p class="nota">Se cambiará también en los asuntos que estén en este estado. ' +
    'Las carpetas no se tocan: el estado no forma parte del nombre.</p>', 'Cambiar');
  if (!ok) return;

  var nuevo = U.limpiarNombre($('estado-nuevo-nombre').value).toUpperCase();
  if (!nuevo || nuevo === viejo) return;
  var repetido = App.E.estados.some(function (e) {
    return e.nombre !== viejo && U.normalizar(e.nombre) === U.normalizar(nuevo);
  });
  if (repetido) { U.aviso('Ya hay otro estado con ese nombre.', 'malo'); return; }

  try {
    App.E.estados.forEach(function (e) { if (e.nombre === viejo) e.nombre = nuevo; });
    await App.guardarEstados();

    await App.cargarRegistro();
    var n = 0;
    Object.keys(App.E.registro.asuntos).forEach(function (k) {
      if (App.E.registro.asuntos[k].situacion === viejo) {
        App.E.registro.asuntos[k].situacion = nuevo;
        n++;
      }
    });
    await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
    App.refrescarFichas();

    App.pintarAjustes();
    App.pintarFiltroEstado();
    App.pintarAbiertos();
    U.aviso('Estado renombrado. Asuntos cambiados: ' + n + '.', 'bueno');
  } catch (e) {
    U.aviso('No he podido cambiarlo: ' + e.message, 'malo');
  }
};

App.quitarEstado = async function (nombre) {
  var n = App.contarCon(nombre);
  var ok = await U.preguntar('Quitar el estado',
    '<p>Se quita <strong>' + U.escapar(nombre) + '</strong> de la lista.</p>' +
    (n ? '<p class="nota">Hay ' + n + ' asunto' + (n === 1 ? '' : 's') +
         ' en este estado. Se quedarán sin estado, y podrás ponerles otro.</p>'
       : '<p class="nota">No hay ningún asunto en este estado.</p>'), 'Quitar');
  if (!ok) return;

  try {
    App.E.estados = App.E.estados.filter(function (e) { return e.nombre !== nombre; });
    await App.guardarEstados();

    if (n) {
      await App.cargarRegistro();
      Object.keys(App.E.registro.asuntos).forEach(function (k) {
        if (App.E.registro.asuntos[k].situacion === nombre) App.E.registro.asuntos[k].situacion = '';
      });
      await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
      App.refrescarFichas();
    }

    App.pintarAjustes();
    App.pintarFiltroEstado();
    App.pintarAbiertos();
    U.aviso('Estado quitado.', 'bueno');
  } catch (e) {
    U.aviso('No he podido quitarlo: ' + e.message, 'malo');
  }
};

App.filaEstado = function (titulo, valor) {
  var d = document.createElement('div');
  d.className = 'fila-tipo';
  d.innerHTML = '<span class="nombre-tipo">' + U.escapar(titulo) + '</span>' +
                '<span class="suave">' + U.escapar(valor) + '</span>';
  return d;
};

/* Al añadir a cualquiera de las tres listas se pasa la misma guardia:
   si el nombre ya está escrito de otra manera no se crea, y si solo se
   parece a otro se avisa antes. Estas listas las comparten los dos
   ordenadores del centro, y dos nombres para la misma cosa ensucian el
   archivo para siempre. */

$('btn-anadir-tipo').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-tipo').value).toUpperCase();
  if (!nombre) return;
  var hay = App.E.tipos.map(function (t) { return t.tipo; });
  if (!await U.dejaCrear(nombre, hay, 'tipo')) return;
  App.E.tipos.push({ tipo: nombre, categoria: $('nueva-categoria').value });
  await App.guardarTipos();
  $('nuevo-tipo').value = '';
  App.pintarAjustes();
  U.aviso('Tipo añadido.', 'bueno');
};

$('btn-anadir-estado').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-estado').value).toUpperCase();
  if (!nombre) return;
  var hay = App.E.estados.map(function (e) { return e.nombre; });
  if (!await U.dejaCrear(nombre, hay, 'estado')) return;
  App.E.estados.push({ nombre: nombre, espera: false });
  await App.guardarEstados();
  $('nuevo-estado').value = '';
  App.pintarTablaEstados();
  App.pintarFiltroEstado();
  U.aviso('Estado añadido.', 'bueno');
};

$('btn-anadir-tipo-doc').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-tipo-doc').value).toUpperCase();
  if (!nombre) return;
  if (!await U.dejaCrear(nombre, App.E.tiposDocumento, 'tipo de documento')) return;
  App.E.tiposDocumento.push(nombre);
  await App.guardarTiposDocumento();
  $('nuevo-tipo-doc').value = '';
  App.pintarAjustes();
  U.aviso('Tipo de documento añadido.', 'bueno');
};

$('btn-olvidar').onclick = async function () {
  var ok = await U.preguntar('Volver a elegir las carpetas',
    '<p>Se olvidan las carpetas de <strong>este</strong> ordenador. ' +
    'No se borra ni se mueve nada.</p>', 'Olvidar');
  if (!ok) return;
  await Almacen.borrar('abiertos');
  await Almacen.borrar('archivo');
  location.reload();
};
