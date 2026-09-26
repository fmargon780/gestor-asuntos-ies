/* ============================================================
   ajustes.js — el marco de la pantalla de Ajustes.

   Desde el 17-sep-2026 (fila 39, docs/AJUSTES-POR-TIPO.md) este
   fichero se queda solo con el marco: las tres pestañas de arriba
   (Tipos de asunto · El centro · Mantenimiento), la lista de tipos de
   la primera pestaña con su buscador cruzado, y los ayudantes que
   comparten varios ficheros (el menú de los tres puntos, el aviso en
   vivo de nombre repetido). Lo demás se ha repartido:

     - `js/ajustes-tipo.js`   — la pantalla entera de un tipo de asunto.
     - `js/ajustes-centro.js` — la pestaña "El centro".
     - `js/ajustes-mantenimiento.js` — la pestaña "Mantenimiento".

   Antes vivía todo aquí (52 KB): estados, tipos de documento, campos
   propios, grupos, copias, carpetas... Cada uno se ha movido a su
   nuevo fichero tal cual, sin reescribir su lógica.
   ============================================================ */

/* ---------- Ajustes ágiles (11-sep-2026) ----------

   Con muchos tipos, la lista entera de las cuatro categorías, una
   detrás de otra, obligaba a un scroll casi infinito para ver qué
   había ya y no duplicar. Ahora se ve una categoría cada vez, con
   pestañas arriba y un buscador que sí mira en las cuatro (docs/
   AJUSTES-AGIL.md).

   `App.E.categoriaAjustes` es la categoría que se está viendo: la
   misma que trae puesta el desplegable `#nueva-categoria`, así que
   una nueva alta va siempre a la que se está mirando. Se recuerda en
   `localStorage`, clave `gestor-ajustes-categoria`. */

App.CLAVE_CATEGORIA_AJUSTES = 'gestor-ajustes-categoria';

App.categoriaAjustesInicial = function () {
  try {
    var v = window.localStorage.getItem(App.CLAVE_CATEGORIA_AJUSTES);
    return (v && Nombres.CATEGORIAS.indexOf(v) !== -1) ? v : Nombres.CATEGORIAS[0];
  } catch (e) { return Nombres.CATEGORIAS[0]; }
};
App.E.categoriaAjustes = App.categoriaAjustesInicial();

App.cambiarCategoriaAjustes = function (cat) {
  if (Nombres.CATEGORIAS.indexOf(cat) === -1) return;
  App.E.categoriaAjustes = cat;
  try { window.localStorage.setItem(App.CLAVE_CATEGORIA_AJUSTES, cat); } catch (e) {}
  $('nueva-categoria').value = cat;
  $('buscar-tipos').value = '';
  App.pintarTiposAjustes();
};

/* El botón "Verlo" del aviso de duplicado: cambia a la categoría del
   tipo que ya existe y le da un destello, para encontrarlo sin
   buscarlo a mano. */
App.verTipoEnAjustes = function (tipo) {
  App.cambiarPestanaAjustes('tipos');
  App.cambiarCategoriaAjustes(tipo.categoria);
  var tarjeta = document.querySelector('#tabla-tipos .tarjeta-tipo[data-tipo="' +
    (window.CSS && CSS.escape ? CSS.escape(tipo.tipo) : tipo.tipo) + '"]');
  if (!tarjeta) return;
  tarjeta.scrollIntoView({ block: 'center' });
  tarjeta.classList.remove('destello');
  void tarjeta.offsetWidth; /* reinicia la animación si ya se había dado */
  tarjeta.classList.add('destello');
  setTimeout(function () { tarjeta.classList.remove('destello'); }, 1000);
};

/* ---------- las tres pestañas de arriba (17-sep-2026, fila 39) ----------

   Igual que la categoría: se recuerda en localStorage y no se
   reinicia sola al volver a entrar en Ajustes (solo al elegir otra a
   propósito). */
App.CLAVE_PESTANA_AJUSTES = 'gestor-ajustes-pestana';
App.PESTANAS_AJUSTES = ['tipos', 'centro', 'mantenimiento'];

App.pestanaAjustesInicial = function () {
  try {
    var v = window.localStorage.getItem(App.CLAVE_PESTANA_AJUSTES);
    return (v && App.PESTANAS_AJUSTES.indexOf(v) !== -1) ? v : App.PESTANAS_AJUSTES[0];
  } catch (e) { return App.PESTANAS_AJUSTES[0]; }
};
App.E.pestanaAjustes = App.pestanaAjustesInicial();

App.cambiarPestanaAjustes = function (cual) {
  if (App.PESTANAS_AJUSTES.indexOf(cual) === -1) return;
  App.E.pestanaAjustes = cual;
  try { window.localStorage.setItem(App.CLAVE_PESTANA_AJUSTES, cual); } catch (e) {}
  App.pintarPestanaAjustes();
};

App.pintarPestanaAjustes = function () {
  var cual = App.E.pestanaAjustes;
  App.PESTANAS_AJUSTES.forEach(function (p) {
    var caja = $('ajustes-tab-' + p);
    if (caja) caja.classList.toggle('oculto', p !== cual);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pestana-ajustes'), function (b) {
    b.classList.toggle('activa', b.dataset.ajustesPestana === cual);
  });
};

Array.prototype.forEach.call(document.querySelectorAll('.pestana-ajustes'), function (b) {
  b.onclick = function () { App.cambiarPestanaAjustes(b.dataset.ajustesPestana); };
});

/* ---------- el menú de los tres puntos, para las tarjetas de tipos,
   estados y tipos de documento ----------

   `opciones` es una lista de { texto, onclick, peligro }. Se cierra al
   elegir una, al pulsar fuera o con Escape; nunca se dejan dos abiertos
   a la vez. */
App.botonMenuTarjeta = function (opciones) {
  var envoltorio = document.createElement('div');
  envoltorio.className = 'tarjeta-tipo-menu-envoltorio';

  var boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tarjeta-tipo-menu-btn';
  boton.title = 'Más opciones';
  boton.setAttribute('aria-haspopup', 'true');
  boton.textContent = '⋮';
  envoltorio.appendChild(boton);

  var menu = null;
  function cerrar() {
    if (!menu) return;
    menu.remove();
    menu = null;
    document.removeEventListener('mousedown', alPulsarFuera, true);
    document.removeEventListener('keydown', alPulsarTecla, true);
  }
  function alPulsarFuera(e) { if (!envoltorio.contains(e.target)) cerrar(); }
  function alPulsarTecla(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }

  boton.onclick = function (e) {
    e.stopPropagation();
    if (menu) { cerrar(); return; }
    menu = document.createElement('div');
    menu.className = 'tarjeta-tipo-menu';
    opciones.forEach(function (op) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = op.texto;
      if (op.peligro) b.className = 'boton-peligro';
      b.onclick = function (ev) { ev.stopPropagation(); cerrar(); op.onclick(); };
      menu.appendChild(b);
    });
    envoltorio.appendChild(menu);
    document.addEventListener('mousedown', alPulsarFuera, true);
    document.addEventListener('keydown', alPulsarTecla, true);
  };

  return envoltorio;
};

/* Una fila de "algo: valor", reutilizada por varios bloques (Ficheros
   de datos en "El centro", Carpetas de este ordenador en
   "Mantenimiento"...). */
App.filaEstado = function (titulo, valor) {
  var d = document.createElement('div');
  d.className = 'fila-tipo';
  d.innerHTML = '<span class="nombre-tipo">' + U.escapar(titulo) + '</span>' +
                '<span class="suave">' + U.escapar(valor) + '</span>';
  return d;
};

/* La casilla de días de plazo de un tipo: la usan tanto la tarjeta de
   la rejilla (compacta) como la sección "Plazo" de la pantalla del
   tipo (js/ajustes-tipo.js). Una sola función, para no duplicar el
   onchange que guarda. */
App.construirCasillaPlazo = function (tipo, conTexto) {
  var etiqueta = document.createElement('label');
  etiqueta.className = 'plazo-tipo';
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
  etiqueta.appendChild(casilla);
  if (conTexto !== false) {
    var texto = document.createElement('span');
    texto.className = 'suave';
    texto.textContent = 'días de plazo';
    etiqueta.appendChild(texto);
  }
  return etiqueta;
};

/* Un interruptor sí/no guardado directamente como un campo del propio
   tipo (fila 57, 18-sep-2026, docs/HUECO-PARA-SELLO-Y-FIRMA.md: usado
   por "llevaSello" y "llevaFirma", en la sección "Datos del tipo" de
   js/ajustes-tipo.js). Un tipo sin ese campo en tipos.json se comporta
   con 'porDefecto': nada que migrar. */
App.construirInterruptorDeTipo = function (tipo, campo, porDefecto, texto, ayuda) {
  var etiqueta = document.createElement('label');
  etiqueta.className = 'interruptor interruptor-fila';
  var casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = (tipo[campo] === undefined) ? porDefecto : !!tipo[campo];
  if (ayuda) casilla.title = ayuda;
  casilla.onchange = async function () {
    tipo[campo] = casilla.checked;
    await App.guardarTipos();
  };
  etiqueta.appendChild(casilla);
  var span = document.createElement('span');
  span.textContent = texto;
  if (ayuda) span.title = ayuda;
  etiqueta.appendChild(span);
  return etiqueta;
};

/* ---------- el aviso en vivo al escribir un nombre nuevo (A4 y A7) ----------

   Uno para tipos (que además dice de qué categoría es el que ya
   existe, y ofrece "Verlo"), y uno más sencillo, igual para estados y
   para tipos de documento (usado desde js/ajustes-centro.js). Mismo
   criterio de "igual" o "parecido" que ya vive en `U.parecidos` /
   `U.dejaCrear` (js/util.js): no se inventa una comparación nueva. */

App.pintarAvisoNuevoTipo = function () {
  var campo = $('nuevo-tipo'), aviso = $('aviso-nuevo-tipo'), boton = $('btn-anadir-tipo');
  if (!campo || !aviso || !boton) return;
  var nombre = U.limpiarNombre(campo.value).toUpperCase();
  if (!nombre) { aviso.className = 'aviso-en-vivo'; aviso.innerHTML = ''; boton.disabled = false; return; }

  var nombres = App.E.tipos.map(function (t) { return t.tipo; });
  var cerca = U.parecidos(nombre, nombres);
  var mismo = cerca.filter(function (p) { return p.igual; })[0];
  if (mismo) {
    var tipoExistente = App.E.tipos.filter(function (t) { return t.tipo === mismo.nombre; })[0];
    aviso.className = 'aviso-en-vivo aviso-en-vivo-malo';
    aviso.innerHTML = 'Ya existe: ' + U.escapar(mismo.nombre) + ', en ' + U.escapar(tipoExistente.categoria) +
      '. <button type="button" class="enlace" id="aviso-nuevo-tipo-verlo">Verlo</button>';
    boton.disabled = true;
    $('aviso-nuevo-tipo-verlo').onclick = function () { App.verTipoEnAjustes(tipoExistente); };
    return;
  }
  boton.disabled = false;
  if (cerca.length) {
    aviso.className = 'aviso-en-vivo aviso-en-vivo-ambar';
    aviso.textContent = 'Se parece a: ' + cerca.slice(0, 3).map(function (p) {
      var t = App.E.tipos.filter(function (x) { return x.tipo === p.nombre; })[0];
      return p.nombre + (t ? ' (' + t.categoria + ')' : '');
    }).join(', ');
  } else {
    aviso.className = 'aviso-en-vivo'; aviso.innerHTML = '';
  }
};

/* Uno genérico para estados y tipos de documento: no llevan categoría,
   así que el aviso es más corto. */
App.pintarAvisoSimple = function (idCampo, idAviso, idBoton, listaDeNombres) {
  var campo = $(idCampo), aviso = $(idAviso), boton = $(idBoton);
  if (!campo || !aviso || !boton) return;
  var nombre = U.limpiarNombre(campo.value).toUpperCase();
  if (!nombre) { aviso.className = 'aviso-en-vivo'; aviso.innerHTML = ''; boton.disabled = false; return; }

  var cerca = U.parecidos(nombre, listaDeNombres());
  var mismo = cerca.filter(function (p) { return p.igual; })[0];
  if (mismo) {
    aviso.className = 'aviso-en-vivo aviso-en-vivo-malo';
    aviso.textContent = 'Ya existe: ' + mismo.nombre;
    boton.disabled = true;
    return;
  }
  boton.disabled = false;
  if (cerca.length) {
    aviso.className = 'aviso-en-vivo aviso-en-vivo-ambar';
    aviso.textContent = 'Se parece a: ' + cerca.slice(0, 3).map(function (p) { return p.nombre; }).join(', ');
  } else {
    aviso.className = 'aviso-en-vivo'; aviso.innerHTML = '';
  }
};

$('nuevo-tipo').oninput = App.pintarAvisoNuevoTipo;

/* Cambiarle el nombre a un tipo de asunto (`App.renombrarTipo`) vive en
   js/tipos-nombre.js desde la fila 126: se lleva también su guía, sus
   campos, sus plantillas y sus recurrentes. */

/* La tarjeta de un tipo, en la rejilla. `mostrarCategoria` es para los
   resultados del buscador (A3), que mezcla las cuatro categorías.

   Pulsar la tarjeta abre su pantalla entera (17-sep-2026, fila 39):
   el menú de los tres puntos se queda solo con Cambiar el nombre y
   Quitar, porque los campos ya viven dentro de esa pantalla. */
App.tarjetaTipoAjustes = function (tipo, mostrarCategoria) {
  var f = document.createElement('div');
  f.className = 'tarjeta-tipo tarjeta-tipo-pulsable';
  f.dataset.tipo = tipo.tipo;
  f.tabIndex = 0;
  f.setAttribute('role', 'button');

  var linea1 = document.createElement('div');
  linea1.className = 'tarjeta-tipo-linea';
  linea1.innerHTML = '<span class="tarjeta-tipo-nombre">' + U.escapar(tipo.tipo) + '</span>' +
    (mostrarCategoria ? '<span class="marca-categoria">' + U.escapar(tipo.categoria) + '</span>' : '') +
    ((tipo.alias && tipo.alias.length)
      ? '<span class="suave tarjeta-tipo-antes">antes: ' + U.escapar(tipo.alias.join(', ')) + '</span>' : '');
  f.appendChild(linea1);

  /* Los días de plazo de este tipo. En blanco, el tipo no pone fecha
     límite y el asunto nace sin plazo. */
  var linea2 = document.createElement('div');
  linea2.className = 'tarjeta-tipo-linea tarjeta-tipo-sub';
  linea2.appendChild(App.construirCasillaPlazo(tipo));
  f.appendChild(linea2);

  f.appendChild(App.botonMenuTarjeta([
    { texto: 'Cambiar el nombre', onclick: function () { App.renombrarTipo(tipo); } },
    { texto: 'Borrar', peligro: true, onclick: function () { App.borrarTipo(tipo); } }
  ]));

  /* Cualquier clic que no venga de un campo, un botón o el menú abre
     la pantalla del tipo. */
  f.addEventListener('click', function (e) {
    if (e.target.closest('input, button, .plazo-tipo, .tarjeta-tipo-menu-envoltorio')) return;
    App.abrirTipoDeAsunto(tipo);
  });
  f.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target !== f) return;
    e.preventDefault();
    App.abrirTipoDeAsunto(tipo);
  });

  return f;
};

/* ---------- borrar un tipo de asunto, con papelera (11-sep-2026) ----------

   No se borra si hay asuntos (abiertos o en `asuntos.json`) con este
   tipo: se dice cuántos. Si no hay ninguno pero tiene guía escrita, se
   avisa de que la guía se va con él, y se guarda para poder devolverla
   junto con el tipo. */
/* Fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): la ficha de un
   asunto archivado ya no está en App.E.registro.asuntos, así que para
   no borrar un tipo que siguen usando cientos de asuntos ya
   archivados se mira también el índice del ARCHIVO (una lectura de un
   fichero, no un recorrido del disco). Sin índice hecho, se cuentan
   solo abiertos: no es peor que antes de esta fila para quien no lo
   tenga construido. */
App.contarAsuntosConTipo = async function (nombreTipo) {
  var vistos = {};
  (App.E.listaAbiertos || []).forEach(function (a) {
    var t = (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo);
    if (t === nombreTipo) vistos[a.nombre] = true;
  });
  Object.keys((App.E.registro && App.E.registro.asuntos) || {}).forEach(function (k) {
    if (App.E.registro.asuntos[k].tipo === nombreTipo) vistos[k] = true;
  });
  if (window.IndiceArchivo) {
    try {
      var resultado = await IndiceArchivo.leerDisco({ todos: true });
      if (resultado.ok) {
        resultado.datos.asuntos.forEach(function (e) {
          if (e.tipo === nombreTipo) vistos[e.nombre] = true;
        });
      }
    } catch (e) { /* sin índice usable, se cuenta solo lo de memoria */ }
  }
  return Object.keys(vistos).length;
};

App.borrarTipo = async function (tipo) {
  /* 20-sep-2026, fila 79, apartado 9: mientras un tipo fantasma (el
     nombre viejo de otro ya renombrado) siga existiendo, las carpetas
     ya archivadas con ese nombre se le siguen adjudicando a él, y el
     guardián de "no se puede borrar un tipo con asuntos" lo bloquearía
     para siempre. Esas carpetas se seguirán reconociendo igual, por el
     alias, así que no hace falta contarlas aquí. */
  var esAliasDeOtro = App.E.tipos.some(function (t) {
    return t !== tipo && (t.alias || []).indexOf(tipo.tipo) !== -1;
  });
  var n = esAliasDeOtro ? 0 : await App.contarAsuntosConTipo(tipo.tipo);
  if (n) {
    await U.preguntar('No se puede borrar',
      '<p>Hay ' + n + ' asunto' + (n === 1 ? '' : 's') + ' con el tipo <strong>' +
      U.escapar(tipo.tipo) + '</strong>. No se puede borrar mientras tenga alguno.</p>', 'Vale', true);
    return;
  }

  var guia = null;
  try {
    var guias = await Carpetas.leerJson(App.E.gestor, 'guias.json');
    if (guias && guias[tipo.tipo] && guias[tipo.tipo].length) guia = guias[tipo.tipo];
  } catch (e) { guia = null; }

  var ok = await window.Papelera.preguntarBorrar(tipo.tipo,
    guia ? '<p class="nota">Este tipo tiene guía escrita. Se va con él, guardada para poder devolverla.</p>' : '');
  if (!ok) return;

  try {
    App.E.tipos = App.E.tipos.filter(function (x) { return x.tipo !== tipo.tipo; });
    await Borrados.marcar(App.E.gestor, 'tipos', tipo.tipo);
    await App.guardarTipos();
    if (guia) {
      var guiasActual = (await Carpetas.leerJson(App.E.gestor, 'guias.json')) || {};
      delete guiasActual[tipo.tipo];
      await Copias.guardar(App.E.gestor, 'guias.json', guiasActual);
    }
    await window.Papelera.mandarDato('tipo', tipo.tipo, null, { tipo: tipo, guia: guia });
    if (App.E.tipoAjustesActual === tipo) App.cerrarTipoDeAsunto();
    App.pintarTiposAjustes();
    U.aviso('Tipo mandado a la papelera.', 'bueno');
  } catch (e) {
    U.aviso('No he podido mandarlo a la papelera: ' + U.mensajeDeError(e), 'malo');
  }
};

/* Las cuatro pestañas de categoría, con la cuenta de cada una. Cambiar
   de pestaña cambia también el desplegable de alta, y al revés: los
   dos mandos van siempre de acuerdo (A2). */
App.pintarPestanasTipos = function (apagadas) {
  var cont = $('pestanas-tipos');
  if (!cont) return;
  cont.innerHTML = '';
  Nombres.CATEGORIAS.forEach(function (cat) {
    var n = App.E.tipos.filter(function (t) { return t.categoria === cat; }).length;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pestana-categoria' + (!apagadas && cat === App.E.categoriaAjustes ? ' activa' : '');
    b.innerHTML = U.escapar(cat) + ' <span class="pestana-cuenta">' + n + '</span>';
    b.onclick = function () { App.cambiarCategoriaAjustes(cat); };
    cont.appendChild(b);
  });
  cont.classList.toggle('apagadas', !!apagadas);
};

/* A1 (una sola categoría cada vez) y A3 (el buscador, que mira en las
   cuatro). Con dos letras o más el buscador manda; con menos, manda la
   categoría de la pestaña / del desplegable. */
App.pintarTiposAjustes = function () {
  var caja = $('tabla-tipos');
  var info = $('tipos-buscando-info');
  if (!caja) return;
  $('nueva-categoria').value = App.E.categoriaAjustes;

  var buscado = U.normalizar($('buscar-tipos').value || '');
  var enBusqueda = buscado.length >= 2;
  App.pintarPestanasTipos(enBusqueda);

  var items;
  if (enBusqueda) {
    items = App.E.tipos.filter(function (t) { return U.normalizar(t.tipo).indexOf(buscado) !== -1; });
    info.textContent = 'Buscando en todas las categorías · ' + items.length +
      (items.length === 1 ? ' resultado' : ' resultados');
    info.classList.remove('oculto');
  } else {
    items = App.E.tipos.filter(function (t) { return t.categoria === App.E.categoriaAjustes; });
    info.classList.add('oculto');
    info.textContent = '';
  }

  caja.innerHTML = '';
  if (!items.length) {
    caja.innerHTML = '<div class="vacio">' +
      (enBusqueda ? 'Nada encontrado con ese texto.' : 'Todavía no hay ningún tipo en esta categoría.') +
      '</div>';
    return;
  }
  items.forEach(function (tipo) { caja.appendChild(App.tarjetaTipoAjustes(tipo, enBusqueda)); });
};

Nombres.opcionesCategorias($('nueva-categoria'), 'clave');   /* fila 166: la lista única */
$('nueva-categoria').onchange = function () { App.cambiarCategoriaAjustes($('nueva-categoria').value); };
$('buscar-tipos').oninput = function () { App.pintarTiposAjustes(); };

/* Guarda un tipo nuevo: la parte de después de la guardia de nombres
   (U.dejaCrear), que cada sitio comprueba con lo suyo antes de llamar
   aquí. La usan tanto "Añadir" de aquí abajo como "+ Crear tipo
   nuevo" de Nuevo asunto (fila 128, js/tipo-al-vuelo.js): una sola
   forma de guardar un tipo, no dos. */
App.crearTipo = async function (datos) {
  var tipo = { tipo: datos.nombre, categoria: datos.categoria };
  if (datos.nombreCorto) tipo.nombreCorto = datos.nombreCorto;
  if (datos.organo) tipo.organo = datos.organo;   /* fila 134 */
  await Borrados.revivir(App.E.gestor, 'tipos', datos.nombre);
  App.E.tipos.push(tipo);
  await App.guardarTipos();
  return tipo;
};

/* Al añadir se pasa la misma guardia que a estados y tipos de
   documento (js/ajustes-centro.js): si el nombre ya está escrito de
   otra manera no se crea, y si solo se parece a otro se avisa antes.
   Esta lista la comparten los dos ordenadores del centro, y dos
   nombres para la misma cosa ensucian el archivo para siempre. */
$('btn-anadir-tipo').onclick = async function () {
  var nombre = U.limpiarNombre($('nuevo-tipo').value).toUpperCase();
  if (!nombre) return;
  var hay = App.E.tipos.map(function (t) { return t.tipo; });
  if (!await U.dejaCrear(nombre, hay, 'tipo')) return;
  await App.crearTipo({ nombre: nombre, categoria: $('nueva-categoria').value });
  $('nuevo-tipo').value = '';
  App.pintarAvisoNuevoTipo();
  App.pintarTiposAjustes();
  U.aviso('Tipo añadido.', 'bueno');
};

/* ---------- el orquestador ----------

   Pinta la pestaña 1 (aquí mismo) y llama a las otras dos, que viven
   en sus propios ficheros. Los bloques que se enganchan solos
   (plantillas, hitos, conflictos, frescura, bandeja, huérfanas,
   duplicados descartados) se repintan por su cuenta, con
   `window.Gestor.alRefrescar`; no hace falta llamarlos desde aquí. */
App.pintarAjustes = async function () {
  App.pintarPestanaAjustes();
  App.pintarTiposAjustes();
  /* «Quién encarga cada tipo» (fila 134, js/tipos-organo.js). */
  if (window.TiposOrgano) TiposOrgano.pintarAjustes();
  if (typeof App.pintarAjustesCentro === 'function') await App.pintarAjustesCentro();
  if (typeof App.pintarAjustesMantenimiento === 'function') await App.pintarAjustesMantenimiento();
  if (window.AlumnadoBD) AlumnadoBD.pintarAjustes();
};
