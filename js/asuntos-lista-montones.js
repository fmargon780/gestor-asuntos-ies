/* ============================================================
   asuntos-lista-montones.js — las tres tarjetas de arriba, los montones por tipo de asunto, a qué montón va cada asunto, las cuentas y el filtro por montón.

   Sacado tal cual de js/asuntos-lista.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de él.
   ============================================================ */

/* ---------- las tres tarjetas de arriba ----------

   El trabajo de la pantalla se reparte en tres montones, según dónde
   esté ahora mismo: papeles que aún no son un asunto, asuntos que nos
   toca mover, y asuntos que dependen de que conteste otro. Se ve un
   montón cada vez, para no mezclarlos. */

App.VISTAS = ['clasificar', 'departamento', 'espera'];
App.DIAS_DE_AVISO = 15;

App.vistaGuardada = function () {
  var v = '';
  try { v = window.localStorage.getItem('vista-abiertos') || ''; } catch (e) {}
  return App.VISTAS.indexOf(v) !== -1 ? v : 'departamento';
};

App.irVista = function (cual) {
  App.E.vista = App.VISTAS.indexOf(cual) !== -1 ? cual : 'departamento';
  try { window.localStorage.setItem('vista-abiertos', App.E.vista); } catch (e) {}

  /* Al cambiar de montón se empieza viendo todos los tipos. */
  App.tipoElegido = '';

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
    b.classList.toggle('activo', b.dataset.vista === App.E.vista);
  });
  var esClasificar = App.E.vista === 'clasificar';
  $('zona-clasificar').classList.toggle('oculto', !esClasificar);
  $('zona-asuntos').classList.toggle('oculto', esClasificar);
  /* La bandeja de correos arranca siempre plegada al entrar aquí, se
     dejara como se dejara la última vez (fila 27, 17-sep-2026): sin
     memoria en localStorage, a propósito. */
  if (esClasificar && window.BandejaPantalla) window.BandejaPantalla.plegar();
  /* Ordenar y filtrar por estado o por plazo solo tiene sentido con asuntos. */
  $('filtro-estado').parentNode.querySelectorAll('#filtro-estado, #filtro-plazo, #orden-abiertos')
    .forEach(function (el) { el.classList.toggle('oculto', esClasificar); });
  Array.prototype.forEach.call(document.querySelectorAll('.etiqueta-en-linea'), function (el) {
    el.classList.toggle('oculto', esClasificar);
  });

  App.pintarAbiertos();
  App.pintarSueltos();
};

Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
  b.onclick = function () { App.irVista(b.dataset.vista); };
});

/* ---------- los montones por tipo de asunto ----------

   Dentro de "Pendiente de Administración" y de "Pendiente de terceros", los
   asuntos se agrupan además por su tipo: una tarjeta pequeña por tipo,
   encima de la lista. Al pulsar una, la lista se queda solo con los de
   ese tipo; al volver a pulsarla, vuelven a salir todos. */

App.tipoElegido = '';
App.SIN_TIPO = 'Sin tipo';

App.tipoDeAsunto = function (a) {
  return a.leido.tipo || (a.ficha && a.ficha.tipo) || App.SIN_TIPO;
};

/* Ojo con el nombre: `App.elegirTipo` ya existe, y es el de elegir el
   tipo al crear un asunto nuevo (js/asuntos-nuevo.js). Aquel fichero se
   carga después que este, así que si se repitiera el nombre este se
   perdería sin decir nada, y las tarjetas no harían nada al pulsarlas.
   Pasó el 10-sep-2026. */
App.filtrarPorTipo = function (tipo) {
  App.tipoElegido = (App.tipoElegido === tipo) ? '' : tipo;
  App.pintarAbiertos();
};

/* La fila de tarjetas vive dentro de la zona de asuntos, justo encima
   de la lista. Se crea la primera vez que hace falta. */
App.cajaDeTipos = function () {
  var caja = $('grupos-tipo');
  if (caja) return caja;
  var zona = $('zona-asuntos');
  var lista = $('lista-abiertos');
  if (!zona || !lista) return null;
  caja = document.createElement('div');
  caja.id = 'grupos-tipo';
  caja.className = 'grupos-tipo oculto';
  zona.insertBefore(caja, lista);
  return caja;
};

/* Los montones, del más gordo al más flaco. A igualdad de asuntos, por
   orden alfabético, para que no bailen de sitio. */
App.montonesPorTipo = function (lista) {
  var por = {};
  lista.forEach(function (a) {
    var t = App.tipoDeAsunto(a);
    if (!por[t]) por[t] = { tipo: t, cuantos: 0, vencidos: 0 };
    por[t].cuantos++;
    var p = App.plazoDe(a);
    if (p && p.dias <= 0) por[t].vencidos++;
  });
  return Object.keys(por).map(function (k) { return por[k]; })
    .sort(function (a, b) {
      if (a.cuantos !== b.cuantos) return b.cuantos - a.cuantos;
      return a.tipo < b.tipo ? -1 : 1;
    });
};

App.tarjetaDeTipo = function (tipo, texto, cuantos, vencidos) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'grupo' + (App.tipoElegido === tipo ? ' activo' : '');
  b.dataset.tipo = tipo;
  b.title = tipo
    ? (App.tipoElegido === tipo ? 'Volver a ver todos los tipos'
                                : 'Ver solo los asuntos de tipo ' + tipo)
    : 'Ver todos los tipos';

  var n = document.createElement('span');
  n.className = 'grupo-nombre';
  n.textContent = texto;
  b.appendChild(n);

  var c = document.createElement('span');
  c.className = 'grupo-cuenta';
  c.textContent = cuantos;
  b.appendChild(c);

  if (vencidos) {
    var v = document.createElement('span');
    v.className = 'grupo-vencidos';
    v.textContent = vencidos + ' fuera de plazo';
    b.appendChild(v);
  }

  b.onclick = function () { App.filtrarPorTipo(tipo); };
  return b;
};

/* `lista` son los asuntos del montón de arriba, ya pasados por el
   buscador y los filtros, pero todavía sin quedarnos con un tipo. */
App.pintarGruposTipo = function (lista) {
  var caja = App.cajaDeTipos();
  if (!caja) return;

  var grupos = App.montonesPorTipo(lista);

  /* Con un solo tipo, las tarjetas no dicen nada que no diga ya la
     lista de abajo. En "Por clasificar" no hay asuntos, solo papeles. */
  if (App.E.vista === 'clasificar' || grupos.length < 2) {
    caja.classList.add('oculto');
    caja.innerHTML = '';
    return;
  }

  caja.innerHTML = '';
  caja.classList.remove('oculto');

  var rotulo = document.createElement('span');
  rotulo.className = 'grupos-rotulo';
  rotulo.textContent = 'Por tipo de asunto';
  caja.appendChild(rotulo);

  caja.appendChild(App.tarjetaDeTipo('', 'Todos', lista.length, 0));
  grupos.forEach(function (g) {
    /* Se enseña el nombre corto; se agrupa y filtra por el de verdad
       (fila 97): dos tipos con el mismo corto siguen siendo dos tarjetas. */
    caja.appendChild(App.tarjetaDeTipo(g.tipo, Nombres.tipoParaVer(g.tipo, App.E.tipos), g.cuantos, g.vencidos));
  });
};

/* A qué montón va un asunto (fila 104, docs/ESTADO-POR-EL-HITO.md):
   "Pendiente de Administración" o "Pendiente de terceros", según su
   hito actual (js/hitos-a-quien.js). Desde la fila 129, sin hitos va
   a Administración: el estado escrito a mano ya no se lee. */
App.ladoDe = function (a) {
  if (window.Hitos && Hitos.ladoDeAsunto) return Hitos.ladoDeAsunto(a);
  return { lado: 'administracion', quien: '', hito: null, sinHitos: true, texto: 'Sin hitos' };
};

/* Cuántos días lleva esperando: desde el «Esperando a…» o desde que su
   hito está en curso; si no, desde que se abrió. */
App.diasEnEstado = function (a) {
  var d = new Date(App.ladoDe(a).desde || a.ficha.abiertoEl || '');
  if (isNaN(d.getTime())) return -1;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

App.deLaVista = function (a, vista) {
  var terceros = App.ladoDe(a).lado === 'terceros';
  return vista === 'espera' ? terceros : !terceros;
};

App.pintarCuentas = function () {
  var enEspera = App.E.listaAbiertos.filter(function (a) { return App.deLaVista(a, 'espera'); });
  $('cuenta-clasificar').textContent = App.E.sueltos.length;
  $('cuenta-departamento').textContent = App.E.listaAbiertos.length - enEspera.length;
  $('cuenta-espera').textContent = enEspera.length;

  var viejo = enEspera.some(function (a) { return App.diasEnEstado(a) >= App.DIAS_DE_AVISO; });
  $('cuenta-espera').classList.toggle('cuenta-roja', viejo);
  $('cuenta-clasificar').classList.toggle('cuenta-ambar', App.E.sueltos.length > 0);
};

/* El desplegable de arriba (fila 129): ya no filtra por estado escrito
   a mano, sino por montón, según el hito actual de cada asunto. */
App.FILTROS_MONTON = [
  { valor: '', texto: 'Todos' },
  { valor: 'administracion', texto: 'Nos toca' },
  { valor: 'terceros', texto: 'Esperan a terceros' },
  { valor: 'esperando', texto: 'Con «Esperando a…»' },
  { valor: 'listo', texto: 'Listos para archivar' },
  { valor: 'sinhitos', texto: 'Sin hitos' }
];

App.pintarFiltroEstado = function () {
  var sel = $('filtro-estado');
  var antes = sel.value;
  sel.innerHTML = App.FILTROS_MONTON.map(function (f) {
    return '<option value="' + f.valor + '">' + U.escapar(f.texto) + '</option>';
  }).join('');
  sel.value = antes;
  if (sel.selectedIndex === -1) sel.value = '';
};

App.pasaFiltroMonton = function (a, filtro) {
  if (!filtro) return true;
  var l = App.ladoDe(a);
  if (filtro === 'esperando') return !!l.esperando;
  if (filtro === 'listo') return !!l.listo;
  if (filtro === 'sinhitos') return !!l.sinHitos;
  return l.lado === filtro;
};

App.ordenElegido = function () {
  var v = '';
  try { v = window.localStorage.getItem('orden-abiertos') || ''; } catch (e) {}
  return App.ORDENES[v] ? v : 'fecha-asc';
};

/* Si la lista no se ve (la ficha está delante, por ejemplo), no se
   repinta: se deja pendiente y se pinta al volver a ella (fila 101,
   docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md). */
App.E.listaPendiente = false;

App.listaALaVista = function () {
  var p = $('pantalla-abiertos');
  return !p || !p.classList.contains('oculto');
};

App.pintarAbiertosSiPendiente = function () {
  if (App.E.listaPendiente && App.listaALaVista()) App.pintarAbiertos();
};
