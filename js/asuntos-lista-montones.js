/* ============================================================
   asuntos-lista-montones.js — la tarjeta "Ver todo", a qué montón va
   cada asunto y el filtro «Situación» (antes «Montón»).

   Sacado tal cual de js/asuntos-lista.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md). Se carga justo detrás de él.

   Fila 192 (docs/INICIO-CUATRO-BLOQUES.md, apartado 5): la tabla
   "Todos los asuntos abiertos" enseña todos los asuntos a la vez, sin
   montones. Se han quitado las tarjetas "Por tipo de asunto"
   (App.pintarGruposTipo y compañía, pasan a ser el filtro «Tipo de
   asunto» de js/asuntos-lista-pintar.js), las cuentas de los montones
   (App.pintarCuentas, sin llamador) y App.deLaVista.
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

/* Fila 192: la tabla "Todos los asuntos abiertos" enseña todos los
   asuntos a la vez, sin montones (App.deLaVista, que filtraba por
   App.E.vista, ha desaparecido). App.irVista se queda solo con lo que
   sigue haciendo falta: «Ver todo» (App.E.vista === 'clasificar')
   enseña #zona-clasificar (sueltos y correos) a pantalla completa; el
   resto de valores de App.E.vista solo pliega la bandeja y repinta.

   `soloQue` (fila 212, docs/INICIO-A-TODO-EL-ANCHO.md, opcional, nunca
   rompe a quien llama con un solo parámetro): 'correos' o 'documentos'
   deja #zona-clasificar enseñando solo esa parte, con un enlace "Ver
   también…" para volver a las dos juntas (App.pintarSoloQueClasificar,
   más abajo). Lo usan los dos enlaces de "Ha llegado" (js/inicio.js);
   el botón de siempre (o cualquier otro sitio que llame sin este
   parámetro) sigue enseñando las dos juntas, como toda la vida. */
App.irVista = function (cual, soloQue) {
  var estabaEnClasificar = App.E.vista === 'clasificar';
  var vistaNueva = App.VISTAS.indexOf(cual) !== -1 ? cual : 'departamento';
  var esClasificar = vistaNueva === 'clasificar';

  /* Fila 214: guardar el desplazamiento de antes de entrar en
     "clasificar" ANTES de esconder #inicio-cuerpo (más abajo, con la
     clase "viendo-clasificar"): en cuanto la tabla desaparece, la
     página se queda sin alto de sobra y el navegador recorta scrollY
     él solo al nuevo máximo (le pasa lo mismo a la cabecera fija, fila
     50, docs/CABECERA-NO-TIEMBLA.md); leído después, ya habría llegado
     recortado a 0. */
  if (esClasificar && !estabaEnClasificar) App.E.scrollAlEntrarClasificar = window.scrollY;

  App.E.vista = vistaNueva;
  try { window.localStorage.setItem('vista-abiertos', App.E.vista); } catch (e) {}

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
    b.classList.toggle('activo', b.dataset.vista === App.E.vista);
  });
  $('zona-clasificar').classList.toggle('oculto', !esClasificar);

  /* "clasificar" sustituye del todo a la vista de Inicio
     (css/inicio.css, #pantalla-abiertos.viendo-clasificar), en vez de
     enseñarse debajo de la tabla, fuera de la pantalla. Al entrar, la
     página sube arriba del todo; al salir, se devuelve el
     desplazamiento guardado, después de repintar (el alto de la
     página cambia al volver a enseñar la tabla). */
  var pantalla = $('pantalla-abiertos');
  if (pantalla) pantalla.classList.toggle('viendo-clasificar', esClasificar);
  if (esClasificar && !estabaEnClasificar) {
    window.scrollTo(0, 0);
  } else if (!esClasificar && estabaEnClasificar) {
    var y = App.E.scrollAlEntrarClasificar || 0;
    App.E.scrollAlEntrarClasificar = null;
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  if (esClasificar) {
    App.E.soloQueClasificar = (soloQue === 'correos' || soloQue === 'documentos' || soloQue === 'encargos') ? soloQue : '';
    App.pintarSoloQueClasificar();
    /* La bandeja de correos arranca siempre plegada al entrar aquí, se
       dejara como se dejara la última vez (fila 27, 17-sep-2026): sin
       memoria en localStorage, a propósito. Con "solo correos" (fila
       212) arranca desplegada, porque es lo único que hay que ver. */
    if (window.BandejaPantalla) {
      if (App.E.soloQueClasificar === 'correos') window.BandejaPantalla.desplegar();
      else window.BandejaPantalla.plegar();
    }
  }

  App.pintarSueltos();
};

/* El enlace "Ver también los correos"/"Ver también los documentos" de
   la cabecera de #zona-clasificar, y las clases que esconden la mitad
   que no toca. Aparte de App.irVista (al entrar), lo repinta
   js/inicio.js cada vez que cambian las cuentas de "Ha llegado". */
App.pintarSoloQueClasificar = function () {
  var zona = $('zona-clasificar');
  var enlace = $('sueltos-ver-tambien');
  if (!zona || !enlace) return;
  var cual = App.E.soloQueClasificar || '';
  if (window.EncargosLlegada) EncargosLlegada.pintar();   /* fila 289 */
  zona.classList.toggle('solo-encargos', cual === 'encargos');
  zona.classList.toggle('solo-correos', cual === 'correos');
  zona.classList.toggle('solo-documentos', cual === 'documentos');
  enlace.classList.toggle('oculto', !cual);
  if (!cual) return;
  enlace.textContent = cual === 'correos' ? 'Ver también los documentos' : (cual === 'encargos' ? 'Ver también los correos y los documentos' : 'Ver también los correos');
  enlace.onclick = function () { App.irVista('clasificar'); };
};

Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (b) {
  b.onclick = function () { App.irVista(b.dataset.vista); };
});

/* ---------- el tipo de asunto ----------

   Fila 192: las tarjetas "Por tipo de asunto" pasan a ser el filtro
   «Tipo de asunto» (js/asuntos-lista-pintar.js,
   App.pintarFiltroTipoAsunto), que sigue reutilizando
   App.montonesPorTipo tal cual. */

App.SIN_TIPO = 'Sin tipo';

App.tipoDeAsunto = function (a) {
  return a.leido.tipo || (a.ficha && a.ficha.tipo) || App.SIN_TIPO;
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

/* El desplegable de arriba (fila 129): ya no filtra por estado escrito
   a mano, sino por montón, según el hito actual de cada asunto. */
App.FILTROS_MONTON = [
  { valor: '', texto: 'Todos' },
  { valor: 'administracion', texto: 'Nos toca' },
  { valor: 'terceros', texto: 'Esperan a terceros' },
  { valor: 'esperando', texto: 'Con «Esperando a…»' },
  { valor: 'listo', texto: 'Listos para archivar' },
  { valor: 'sinhitos', texto: 'Sin hitos' },
  { valor: 'porliquidar', texto: 'Por liquidar' }   /* fila 249 */
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
  if (filtro === 'porliquidar') return !!(window.PorLiquidar && PorLiquidar.estaPorLiquidar(a));
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
