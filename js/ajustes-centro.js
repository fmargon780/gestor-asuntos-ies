/* ============================================================
   ajustes-centro.js — la pestaña "El centro" de Ajustes (17-sep-2026,
   fila 39, docs/AJUSTES-POR-TIPO.md).

   Las listas que valen para todos los tipos de asunto, sacadas tal
   cual de js/ajustes.js cuando ese fichero se partió: estados de
   tramitación, tipos de documento, catálogo de campos propios, grupos
   de personas, ficheros de datos y cómo se abrevia cada grupo. Nada
   de lógica nueva, solo el mismo código apuntando a su sitio de
   siempre dentro de la pestaña "El centro" en vez de a la pantalla de
   Ajustes entera.

   "Datos del centro y firma" también vive en esta pestaña, pero sus
   campos son estáticos en index.html y quien los rellena y los
   guarda es js/plantillas-ajustes.js (`PlantillasAjustes.
   pintarFirmaYCentro`), enganchado solo. Los responsables y los días
   no lectivos de los hitos son el bloque "Hitos" de js/hitos-ajustes.js,
   que se engancha aquí igual que antes: crea su `<details>` dentro de
   `#ajustes-tab-centro` en vez de dentro de `#pantalla-ajustes`.
   ============================================================ */

/* ---------- estados del asunto ----------

   Van en el orden del trámite, no en orden alfabético, así que se
   pueden subir y bajar con las flechas. */

App.pintarTablaEstados = function () {
  var caja = $('tabla-estados');
  if (!caja) return;
  caja.innerHTML = '';
  if (!App.E.estados.length) {
    caja.innerHTML = '<div class="vacio">No hay ningún estado. Añade el primero aquí arriba.</div>';
    return;
  }
  App.E.estados.forEach(function (estado, i) {
    var nombre = estado.nombre;
    var f = document.createElement('div');
    f.className = 'tarjeta-tipo';
    f.dataset.estado = nombre;

    var linea1 = document.createElement('div');
    linea1.className = 'tarjeta-tipo-linea';
    linea1.innerHTML = '<span class="marca-estado ' + App.colorEstado(nombre) + '">' +
                  U.escapar(nombre) + '</span>' +
                  '<span class="suave">' + App.cuantosCon(nombre) + '</span>';
    f.appendChild(linea1);

    /* Estos no van al menú: se usan mucho y conviene tenerlos a la
       vista. El orden del trámite no se toca con esto (A7): las
       flechas siguen moviendo el sitio en la secuencia, no la columna
       de la rejilla. */
    var linea2 = document.createElement('div');
    linea2.className = 'tarjeta-tipo-linea tarjeta-tipo-sub';

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
    linea2.appendChild(etiqueta);

    var subir = document.createElement('button');
    subir.type = 'button';
    subir.className = 'boton';
    subir.textContent = '▲';
    subir.title = 'Subirlo un puesto';
    subir.disabled = (i === 0);
    subir.onclick = function () { App.moverEstado(i, -1); };
    linea2.appendChild(subir);

    var bajar = document.createElement('button');
    bajar.type = 'button';
    bajar.className = 'boton';
    bajar.textContent = '▼';
    bajar.title = 'Bajarlo un puesto';
    bajar.disabled = (i === App.E.estados.length - 1);
    bajar.onclick = function () { App.moverEstado(i, 1); };
    linea2.appendChild(bajar);

    f.appendChild(linea2);

    f.appendChild(App.botonMenuTarjeta([
      { texto: 'Cambiar el nombre', onclick: function () { App.renombrarEstado(nombre); } },
      { texto: 'Borrar', peligro: true, onclick: function () { App.quitarEstado(nombre); } }
    ]));

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
    /* 20-sep-2026, fila 79, apartado 9: mismo arreglo que App.renombrarTipo
       (js/ajustes.js) para que el nombre viejo no resucite solo. */
    await Borrados.marcar(App.E.gestor, 'estados', viejo);
    await Borrados.revivir(App.E.gestor, 'estados', nuevo);
    await App.guardarEstados();

    var n = 0;
    await App.guardarRegistroFresco(function (registro) {
      Object.keys(registro.asuntos).forEach(function (k) {
        if (registro.asuntos[k].situacion === viejo) {
          registro.asuntos[k].situacion = nuevo;
          n++;
        }
      });
    });

    App.pintarTablaEstados();
    App.pintarFiltroEstado();
    App.pintarAbiertos();
    U.aviso('Estado renombrado. Asuntos cambiados: ' + n + '.', 'bueno');
  } catch (e) {
    U.aviso('No he podido cambiarlo: ' + U.mensajeDeError(e), 'malo');
  }
};

/* Borrar un estado, con papelera (11-sep-2026). Si algún asunto lo
   tiene puesto, no se borra: se dice cuántos. */
App.quitarEstado = async function (nombre) {
  var n = App.contarCon(nombre);
  if (n) {
    await U.preguntar('No se puede borrar',
      '<p>Hay ' + n + ' asunto' + (n === 1 ? '' : 's') + ' en el estado <strong>' +
      U.escapar(nombre) + '</strong>. No se puede borrar mientras tenga alguno.</p>', 'Vale', true);
    return;
  }

  var ok = await window.Papelera.preguntarBorrar(nombre);
  if (!ok) return;

  try {
    var pos = -1;
    for (var i = 0; i < App.E.estados.length; i++) { if (App.E.estados[i].nombre === nombre) { pos = i; break; } }
    var estadoObjeto = pos !== -1 ? App.E.estados[pos] : { nombre: nombre, espera: false };
    App.E.estados = App.E.estados.filter(function (e) { return e.nombre !== nombre; });
    await Borrados.marcar(App.E.gestor, 'estados', nombre);
    await App.guardarEstados();
    await window.Papelera.mandarDato('estado', nombre, null, { estado: estadoObjeto, posicion: pos });

    App.pintarTablaEstados();
    App.pintarFiltroEstado();
    App.pintarAbiertos();
    U.aviso('Estado mandado a la papelera.', 'bueno');
  } catch (e) {
    U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
  }
};

$('nuevo-estado').oninput = function () {
  App.pintarAvisoSimple('nuevo-estado', 'aviso-nuevo-estado', 'btn-anadir-estado',
    function () { return App.E.estados.map(function (e) { return e.nombre; }); });
};

$('btn-anadir-estado').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-estado').value).toUpperCase();
  if (!nombre) return;
  var hay = App.E.estados.map(function (e) { return e.nombre; });
  if (!await U.dejaCrear(nombre, hay, 'estado')) return;
  await Borrados.revivir(App.E.gestor, 'estados', nombre);
  App.E.estados.push({ nombre: nombre, espera: false });
  await App.guardarEstados();
  $('nuevo-estado').value = '';
  $('nuevo-estado').oninput();
  App.pintarTablaEstados();
  App.pintarFiltroEstado();
  U.aviso('Estado añadido.', 'bueno');
};

/* ---------- tipos de documento ---------- */

App.pintarTiposDeDocumento = function () {
  var tdoc = $('tabla-tipos-documento');
  if (!tdoc) return;
  tdoc.innerHTML = '';
  if (!App.E.tiposDocumento.length) {
    tdoc.innerHTML = '<div class="vacio">Todavía no hay ningún tipo de documento.</div>';
  }
  App.E.tiposDocumento.forEach(function (nombre) {
    var f = document.createElement('div');
    f.className = 'tarjeta-tipo';
    f.dataset.tipoDoc = nombre;
    var linea = document.createElement('div');
    linea.className = 'tarjeta-tipo-linea';
    /* Los campos del nombre (fila 96, js/documentos-campos.js). */
    var susCampos = window.DocCampos ? DocCampos.campos(nombre) : [];
    linea.innerHTML = '<span class="tarjeta-tipo-nombre">' + U.escapar(nombre) + '</span>' +
      (susCampos.length ? '<span class="suave"> · ' + susCampos.map(function (c) {
        return U.escapar(c.nombre) + (c.obligatorio ? ' *' : '');
      }).join(', ') + '</span>' : '');
    f.appendChild(linea);
    f.appendChild(App.botonMenuTarjeta([
      { texto: 'Campos del nombre', onclick: function () { if (window.DocCampos) DocCampos.editar(nombre); } },
      { texto: 'Borrar', peligro: true, onclick: function () { App.borrarTipoDocumento(nombre); } }
    ]));
    tdoc.appendChild(f);
  });
};

/* Se borra siempre: los documentos ya nombrados conservan su nombre,
   esta lista solo sirve para nombrar los nuevos. Con papelera
   (11-sep-2026). */
App.borrarTipoDocumento = async function (nombre) {
  var ok = await window.Papelera.preguntarBorrar(nombre,
    '<p class="nota">Los documentos ya nombrados conservan su nombre: ' +
    'esta lista solo sirve para nombrar los nuevos.</p>');
  if (!ok) return;
  var pos = App.E.tiposDocumento.indexOf(nombre);
  try {
    App.E.tiposDocumento = App.E.tiposDocumento.filter(function (x) { return x !== nombre; });
    await Borrados.marcar(App.E.gestor, 'tiposDocumento', nombre);
    await App.guardarTiposDocumento();
    await window.Papelera.mandarDato('tipo-documento', nombre, null, { nombre: nombre, posicion: pos });
    App.pintarTiposDeDocumento();
    U.aviso('Tipo de documento mandado a la papelera.', 'bueno');
  } catch (e) {
    U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
  }
};

$('nuevo-tipo-doc').oninput = function () {
  App.pintarAvisoSimple('nuevo-tipo-doc', 'aviso-nuevo-tipo-doc', 'btn-anadir-tipo-doc',
    function () { return App.E.tiposDocumento; });
};

$('btn-anadir-tipo-doc').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-tipo-doc').value).toUpperCase();
  if (!nombre) return;
  if (!await U.dejaCrear(nombre, App.E.tiposDocumento, 'tipo de documento')) return;
  await Borrados.revivir(App.E.gestor, 'tiposDocumento', nombre);
  App.E.tiposDocumento.push(nombre);
  await App.guardarTiposDocumento();
  $('nuevo-tipo-doc').value = '';
  $('nuevo-tipo-doc').oninput();
  App.pintarTiposDeDocumento();
  U.aviso('Tipo de documento añadido.', 'bueno');
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
    var borrar = document.createElement('button');
    borrar.className = 'boton boton-peligro';
    borrar.textContent = 'Borrar';
    borrar.onclick = function () { App.borrarCampoPropio(p); };
    f.appendChild(borrar);
    caja.appendChild(f);
  });
};

/* ---------- borrar un campo propio, con papelera (11-sep-2026) ----------

   Si está asociado a algún tipo, no se borra: se dice a cuáles. */
App.borrarCampoPropio = async function (p) {
  var enUso = Campos.tiposQueUsanPropio(App.E.campos, p.id);
  if (enUso.length) {
    await U.preguntar('No se puede borrar',
      '<p>Lo usan estos tipos: <strong>' + enUso.map(U.escapar).join(', ') + '</strong>.</p>' +
      '<p class="nota">Quítalo primero de esos tipos, en su pantalla de "Campos".</p>', 'Vale', true);
    return;
  }
  var ok = await window.Papelera.preguntarBorrar(p.nombre);
  if (!ok) return;
  try {
    App.E.campos = await Campos.guardarPropios(App.E.gestor, function (lista) {
      return lista.filter(function (x) { return x.id !== p.id; });
    });
    await window.Papelera.mandarDato('campo-propio', p.nombre, null, { propio: p });
    App.pintarCamposPropios();
    U.aviso('Campo propio mandado a la papelera.', 'bueno');
  } catch (e) {
    U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
  }
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

/* ---------- Grupos de personas (17-sep-2026, fila 21,
   docs/GRUPOS-DE-PERSONAS.md) ---------- */

App.pintarGruposPersonas = function () {
  var caja = $('tabla-grupos-personas');
  if (!caja) return;
  var grupos = ((window.Grupos && Grupos.lista()) || []).slice()
    .sort(function (a, b) { return a.nombre < b.nombre ? -1 : (a.nombre > b.nombre ? 1 : 0); });
  caja.innerHTML = '';
  if (!grupos.length) {
    caja.innerHTML = '<div class="vacio">Todavía no hay ningún grupo.</div>';
    return;
  }
  grupos.forEach(function (g) {
    var f = document.createElement('div');
    f.className = 'tarjeta-tipo';
    var linea = document.createElement('div');
    linea.className = 'tarjeta-tipo-linea';
    linea.innerHTML = '<span class="tarjeta-tipo-nombre">' + U.escapar(g.nombre) + '</span>' +
      '<span class="suave"> · ' + g.miembros.length +
      (g.miembros.length === 1 ? ' persona' : ' personas') + '</span>';
    f.appendChild(linea);
    f.appendChild(App.botonMenuTarjeta([
      { texto: 'Ver y cambiar los miembros', onclick: function () { App.editarMiembrosDeGrupo(g); } },
      { texto: 'Cambiar el nombre', onclick: function () { App.renombrarGrupo(g); } },
      { texto: 'Borrar', peligro: true, onclick: function () { App.borrarGrupo(g); } }
    ]));
    caja.appendChild(f);
  });
};

App.crearGrupo = async function () {
  var ok = await U.preguntar('Crear un grupo',
    '<label class="etiqueta">Nombre del grupo</label>' +
    '<input id="grupo-nuevo-nombre" class="campo" placeholder="Equipo directivo">', 'Crear');
  if (!ok) return;
  var nombre = U.limpiarNombre($('grupo-nuevo-nombre').value);
  if (!nombre) return;
  var repetido = Grupos.lista().some(function (g) { return U.normalizar(g.nombre) === U.normalizar(nombre); });
  if (repetido) { U.aviso('Ya hay un grupo con ese nombre.', 'malo'); return; }
  var g = await Grupos.crear(nombre, []);
  App.pintarGruposPersonas();
  U.aviso('Grupo creado. Ahora añade sus miembros.', 'bueno');
  await App.editarMiembrosDeGrupo(g);
};

App.renombrarGrupo = async function (g) {
  var ok = await U.preguntar('Cambiar el nombre del grupo',
    '<label class="etiqueta">Nombre nuevo</label>' +
    '<input id="grupo-nuevo-nombre" class="campo" value="' + U.escapar(g.nombre) + '">', 'Cambiar');
  if (!ok) return;
  var nombreNuevo = U.limpiarNombre($('grupo-nuevo-nombre').value);
  if (!nombreNuevo || nombreNuevo === g.nombre) return;
  var repetido = Grupos.lista().some(function (x) {
    return x !== g && U.normalizar(x.nombre) === U.normalizar(nombreNuevo);
  });
  if (repetido) { U.aviso('Ya hay otro grupo con ese nombre.', 'malo'); return; }
  await Grupos.renombrar(g.id, nombreNuevo);
  App.pintarGruposPersonas();
  U.aviso('Nombre cambiado.', 'bueno');
};

App.borrarGrupo = async function (g) {
  var ok = await window.Papelera.preguntarBorrar(g.nombre,
    '<p class="nota">Los asuntos ya relacionados a través de este grupo no cambian: el grupo ' +
    'solo sirve para elegir de golpe.</p>');
  if (!ok) return;
  try {
    await Grupos.borrar(g.id);
    App.pintarGruposPersonas();
    U.aviso('Grupo mandado a la papelera.', 'bueno');
  } catch (e) {
    U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
  }
};

/* Los miembros se ven y se cambian con el mismo buscador de "señalar
   varios" que usa Relacionados (App.pintarBuscadorDeTercero, en modo
   `multiple`), ya con los de hoy señalados (`marcadosIniciales`). Al
   pulsar "Añadir los N señalados" se guarda esa lista entera como los
   miembros nuevos del grupo: no se suma a la de antes, porque desde
   aquí también hay que poder QUITAR a alguien, y la barra de señalados
   ya deja hacerlo con su × antes de guardar. Un miembro que ya no
   aparezca en las listas actuales se queda igual en la barra (nunca se
   pierde solo): solo desaparece si se quita a mano con la ×. */
App.editarMiembrosDeGrupo = function (g) {
  return new Promise(function (resolver) {
    var capa = $('capa');
    $('cuadro-titulo').textContent = 'Miembros de ' + g.nombre;
    var cuerpo = $('cuadro-cuerpo');
    cuerpo.innerHTML = '<div id="grupo-picker"></div>';
    $('cuadro-aceptar').classList.add('oculto');
    capa.classList.remove('oculto');

    function cerrar() {
      capa.classList.add('oculto');
      $('cuadro-aceptar').classList.remove('oculto');
      $('cuadro-cancelar').onclick = null;
    }
    $('cuadro-cancelar').onclick = function () { cerrar(); resolver(false); };

    App.pintarBuscadorDeTercero($('grupo-picker'), null, async function (marcados) {
      cerrar();
      try {
        await Grupos.ponerMiembros(g.id,
          marcados.map(function (m) { return { categoria: m.categoria, nombre: m.nombre }; }));
        App.pintarGruposPersonas();
        U.aviso('Miembros guardados.', 'bueno');
        resolver(true);
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
        resolver(false);
      }
    }, { multiple: true, marcadosIniciales: g.miembros });
  });
};

$('btn-anadir-grupo').onclick = function () { App.crearGrupo(); };

/* ---------- Ficheros de datos, y cómo se abrevia cada grupo ----------

   Las dos únicas cosas de esta pestaña que hay que releer cada vez
   (dependen de los CSV de _GESTOR/datos), así que van en el
   orquestador de abajo, no en un enganche aparte. */

App.pintarFicherosDeDatos = async function () {
  var estado = $('estado-datos');
  if (!estado) return;
  estado.innerHTML = '';
  var alumnado = await Datos.cargar(App.E.datos, 'ALUMNADO');

  /* Cómo queda abreviado cada grupo. Es lo único de esta pestaña que
     hay que mirar con datos reales delante: si un grupo de Bachillerato
     o de un ciclo saliera mal, se ve aquí de un vistazo. */
  var grupos = $('tabla-grupos');
  if (grupos) {
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
  }

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
    await App.pintarSolicitantesAnteriores(estado);
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
};

/* ---------- solicitantes de cursos anteriores (19-sep-2026, fila 66,
   docs/CONTACTO-GUARDADO-EN-LA-FICHA.md, 2.4) ----------

   `solicitantes.csv` no se limpia solo: arrastraría a todos los
   aspirantes de todos los cursos. Aquí se dice cuántos son de un curso
   que no es el de hoy, y se dejan apartar (no borrar) a
   `solicitantes-anteriores.csv`. */
App.pintarSolicitantesAnteriores = async function (estado) {
  var anteriores = await Datos.contarSolicitantesAnteriores(App.E.datos);
  if (!anteriores) return;

  var fila = document.createElement('div');
  fila.className = 'fila-tipo';
  var texto = document.createElement('span');
  texto.className = 'nombre-tipo';
  texto.textContent = 'Solicitantes de cursos anteriores';
  var accion = document.createElement('span');
  accion.className = 'suave';
  accion.appendChild(document.createTextNode(
    anteriores + (anteriores === 1 ? ' de otro curso' : ' de otros cursos') + '  '));

  var boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'boton';
  boton.textContent = 'Apartar a solicitantes-anteriores.csv';
  boton.onclick = async function () {
    var ok = await U.preguntar('Apartar solicitantes de cursos anteriores',
      '<p>Se van a mover ' + anteriores + (anteriores === 1 ? ' solicitante' : ' solicitantes') +
      ' a <code>solicitantes-anteriores.csv</code>. No se borran, solo se apartan.</p>', 'Adelante');
    if (!ok) return;
    await U.mientrasGuarda(boton, async function () {
      var n = await Datos.apartarSolicitantesAnteriores(App.E.datos);
      U.aviso(n + (n === 1 ? ' solicitante apartado.' : ' solicitantes apartados.'), 'bueno');
      App.pintarFicherosDeDatos();
    });
  };
  accion.appendChild(boton);

  fila.appendChild(texto);
  fila.appendChild(accion);
  estado.appendChild(fila);
};

/* ---------- Sello y firma en el papel (18-sep-2026, fila 57,
   docs/HUECO-PARA-SELLO-Y-FIRMA.md) ----------

   Las dos medidas que usa "Preparar el documento" (js/preparar-
   documento.js): cuánto hueco dejar arriba (para el sello de registro
   de Séneca) y abajo (para la firma digital del director). Se guardan
   en _GESTOR/margenes-pdf.json, para todo el centro. Son solo dos
   números, así que no hace falta fusionar con el disco como las
   listas: el último que guarda, manda (mismo criterio que "Datos del
   centro y firma", aquí arriba). */

var FICHERO_MARGENES_PDF = 'margenes-pdf.json';
App.MARGENES_PDF_POR_DEFECTO = { arribaCm: 1.5, abajoCm: 2.5 };

function limpiarMargenCm(v, porDefecto) {
  var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.'));
  if (isNaN(n) || n < 0 || n > 6) return porDefecto;
  return Math.round(n * 10) / 10;
}

/* La usa también js/preparar-documento.js al abrir el cuadro: relee el
   fichero cada vez (como campos.json), para no pisar lo que haya
   cambiado el compañero desde otro ordenador. */
App.margenesPdfLeer = async function () {
  if (!App.E.gestor) return App.MARGENES_PDF_POR_DEFECTO;
  var leido = null;
  try { leido = await Carpetas.leerJson(App.E.gestor, FICHERO_MARGENES_PDF); }
  catch (e) { leido = null; }
  return {
    arribaCm: limpiarMargenCm(leido && leido.arribaCm, App.MARGENES_PDF_POR_DEFECTO.arribaCm),
    abajoCm: limpiarMargenCm(leido && leido.abajoCm, App.MARGENES_PDF_POR_DEFECTO.abajoCm)
  };
};

App.pintarMargenesPdf = async function () {
  if (!$('margen-sello')) return;
  var m = await App.margenesPdfLeer();
  $('margen-sello').value = m.arribaCm;
  $('margen-firma').value = m.abajoCm;
};

async function guardarMargenesPdf() {
  var valores = {
    arribaCm: limpiarMargenCm($('margen-sello').value, App.MARGENES_PDF_POR_DEFECTO.arribaCm),
    abajoCm: limpiarMargenCm($('margen-firma').value, App.MARGENES_PDF_POR_DEFECTO.abajoCm)
  };
  $('margen-sello').value = valores.arribaCm;
  $('margen-firma').value = valores.abajoCm;
  try {
    await Copias.guardar(App.E.gestor, FICHERO_MARGENES_PDF, valores);
    U.aviso('Medidas guardadas.', 'bueno');
  } catch (e) {
    U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
  }
}

if ($('margen-sello')) $('margen-sello').onchange = guardarMargenesPdf;
if ($('margen-firma')) $('margen-firma').onchange = guardarMargenesPdf;

/* ---------- caducidad de las copias de seguridad (19-sep-2026, fila 72,
   docs/DETALLES-DE-MANTENIMIENTO.md, punto 4) ----------

   Mismo patrón que App.diasDormido()/App.guardarDiasDormido() en
   js/que-me-toca.js. js/copias.js lee este mismo valor directamente de
   App.E.registro.ajustesAvisos para podar las copias; aquí solo está el
   campo de Ajustes y el guardado. */

App.diasCaducidadCopias = function () {
  var n = App.E.registro.ajustesAvisos && App.E.registro.ajustesAvisos.diasCaducidadCopias;
  return (typeof n === 'number' && n > 0) ? n : 90;
};

App.guardarDiasCaducidadCopias = async function (n) {
  await App.guardarRegistroFresco(function (registro) {
    registro.ajustesAvisos = registro.ajustesAvisos || {};
    registro.ajustesAvisos.diasCaducidadCopias = n;
  });
};

App.pintarDiasCaducidadCopias = function () {
  var campo = $('dias-caducidad-copias');
  if (!campo) return;
  campo.value = String(App.diasCaducidadCopias());
  campo.onchange = async function () {
    var n = parseInt(campo.value, 10);
    if (isNaN(n) || n < 1) { campo.value = String(App.diasCaducidadCopias()); return; }
    try {
      await App.guardarDiasCaducidadCopias(n);
      U.aviso('Las copias de más de ' + n + ' días se irán borrando solas.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  };
};

/* ---------- el orquestador de esta pestaña ---------- */

App.pintarAjustesCentro = async function () {
  App.pintarTablaEstados();
  App.pintarTiposDeDocumento();
  App.pintarCamposPropios();
  App.pintarGruposPersonas();
  await App.pintarMargenesPdf();
  await App.pintarFicherosDeDatos();
  if (typeof App.pintarDiasDormido === 'function') App.pintarDiasDormido();
  App.pintarDiasCaducidadCopias();
  /* 20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md. */
  if (window.Cargos && Cargos.pintarEnAjustes) await Cargos.pintarEnAjustes();
  if (window.Membrete && Membrete.pintarEnAjustes) await Membrete.pintarEnAjustes();
  /* 20-sep-2026, fila 84, docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md. */
  if (window.FormulariosRellenar) await FormulariosRellenar.pintarPantallaImpresos();
};
