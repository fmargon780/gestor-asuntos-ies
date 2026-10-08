/* ============================================================
   actividades-ficha.js — la tarjeta «La actividad» de la ficha del asunto
   (8-oct-2026, fila 306, docs/ACTIVIDADES-EXTRAESCOLARES.md).

   Solo sale en un asunto de un tipo marcado para actividades (o que ya lleve
   `ficha.actividad`). Cerrada, un resumen; abierta, todos los datos, con
   «Cambiar», «Anular la actividad» y «Deshacer la anulación». Un asunto de ese
   tipo que aún no tiene la actividad apuntada ofrece «Apuntar los datos de la
   actividad». Los datos viven en js/actividades.js; el formulario, en
   js/actividades-formulario.js. Se pinta desde js/ficha-asunto.js.
   ============================================================ */
var ActividadesFicha = (function () {

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(String(v === undefined || v === null ? '' : v)); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  var actual = null;   /* el asunto cuya tarjeta está a la vista */

  /* ---------- lo que dice la tarjeta ---------- */

  function actividadDe(a) {
    var f = (a && a.ficha) || {};
    return f.actividad && f.actividad.id ? Actividades.porId(f.actividad.id) : null;
  }

  function resumenDe(act) {
    var s = Actividades.situacion(act, U.hoyIso());
    return [Actividades.fechaCorta(act.inicio), act.lugar, plural(act.alumnado, 'alumno/a', 'alumnos/as'),
      plural(act.profesorado.length, 'profesor/a', 'profesores/as'), Actividades.textoSituacion(s)].filter(Boolean).join(' · ');
  }

  function dato(titulo, valor) {
    return valor ? '<dt>' + esc(titulo) + '</dt><dd>' + esc(valor) + '</dd>' : '';
  }

  function lista(titulo, gente) {
    return '<h4>' + esc(titulo) + '</h4>' + (gente.length ? '<ul>' + gente.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '<p class="nota">Nadie.</p>');
  }

  function cuerpoDe(act) {
    var s = Actividades.situacion(act, U.hoyIso());
    var horario = [act.salida && 'salida a las ' + act.salida, act.regreso && 'regreso a las ' + act.regreso].filter(Boolean).join(' · ');
    return '<div class="act-ficha">' +
      '<div class="act-ficha-col"><h4>' + esc(act.nombre) + '</h4><dl>' +
        dato('Fechas', Actividades.fechasLegibles(act)) + dato('Horario', horario) + dato('Lugar', act.lugar) +
        dato('Departamento', act.departamento) + (act.horas !== null ? dato('Horas de dedicación', String(act.horas).replace('.', ',')) : '') +
        '<dt>Situación</dt><dd><span class="act-situacion act-sit-' + s + '">' + esc(Actividades.textoSituacion(s)) + '</span></dd>' +
      '</dl></div>' +
      '<div class="act-ficha-col"><h4>Unidades convocadas</h4>' +
        (act.unidades.length ? '<ul>' + act.unidades.map(function (u) { return '<li>' + esc(u.unidad) + ' · van ' + u.van + ' de ' + u.de + '</li>'; }).join('') + '</ul>' : '<p class="nota">Ninguna.</p>') +
        '<p class="nota">' + esc(plural(act.alumnado, 'alumno/a', 'alumnos/as')) + ' en total.</p></div>' +
      '<div class="act-ficha-col">' +
        lista('Organiza', act.profesorado.filter(function (p) { return p.papel === 'organiza'; }).map(function (p) { return p.nombre; })) +
        lista('Acompaña', act.profesorado.filter(function (p) { return p.papel !== 'organiza'; }).map(function (p) { return p.nombre; })) +
      '</div></div>' +
      '<div class="act-ficha-botones">' +
        '<button type="button" class="boton" id="act-cambiar">Cambiar</button>' +
        (act.anulada
          ? '<button type="button" class="boton" id="act-deshacer-anulacion">Deshacer la anulación</button>'
          : '<button type="button" class="boton" id="act-anular">Anular la actividad</button>') +
      '</div>';
  }

  function pintar(a) {
    actual = a || null;
    var caja = $('ficha-actividad');
    if (!caja || !a) return;
    var act = actividadDe(a);
    if (!act) {
      caja.dataset.resumen = 'Sin apuntar todavía';
      caja.dataset.accion = 'apuntar';
      delete caja.dataset.nombre;
      caja.className = '';
      caja.innerHTML = '<p>Este asunto es de una actividad extraescolar, pero todavía no tiene apuntados sus datos: cuándo es, dónde, qué unidades van y quién las acompaña.</p>' +
        '<div class="act-ficha-botones"><button type="button" class="boton boton-principal" id="act-apuntar-datos">Apuntar los datos de la actividad</button></div>';
      $('act-apuntar-datos').onclick = function () { apuntar(a); };
      return;
    }
    caja.dataset.resumen = resumenDe(act);
    caja.dataset.nombre = act.nombre;
    delete caja.dataset.accion;
    caja.className = '';
    caja.innerHTML = cuerpoDe(act);
    $('act-cambiar').onclick = function () { cambiar(a); };
    var anular = $('act-anular'), deshacer = $('act-deshacer-anulacion');
    if (anular) anular.onclick = function () { anularActividad(a, act); };
    if (deshacer) deshacer.onclick = function () { deshacerAnulacion(a, act); };
  }

  /* ---------- «Cambiar» y «Apuntar los datos» ---------- */

  async function personalPorTexto() {
    var mapa = {};
    try { ((await Datos.cargar(App.E.datos, 'PERSONAL')).lista || []).forEach(function (p) { mapa[App.textoTercero(p)] = p; }); }
    catch (e) { /* sin lista, sin clave */ }
    return mapa;
  }

  /* El estado con el que se abre el formulario: lo guardado, o lo que el asunto ya sabe. */
  async function estadoInicial(a, act) {
    var F = ActividadesFormulario._interno, ficha = a.ficha || {};
    var S = F.estadoVacio();
    var al = await Actividades.alumnosDe(ficha);
    S.id = act ? act.id : U.nuevoId('act');
    S.corto = (ficha.grupo && ficha.grupo.nombre) || '';
    S.cortoManual = true;
    if (act) {
      S.nombre = act.nombre; S.inicio = act.inicio; S.fin = act.fin; S.finManual = true; S.salida = act.salida; S.regreso = act.regreso;
      S.lugar = act.lugar; S.departamento = act.departamento; S.horas = act.horas === null ? '' : String(act.horas);
      S.profesorado = act.profesorado.map(function (p) { return { nombre: p.nombre, clave: p.clave, papel: p.papel }; });
    } else {
      var personal = await personalPorTexto();
      S.profesorado = (ficha.relacionados || []).filter(function (r) { return r.categoria === 'PERSONAL'; }).map(function (r) {
        var p = personal[r.nombre] || {};
        return { nombre: r.nombre, clave: Datos.clavePersona(p.documento, p.nombre || r.nombre), papel: 'acompana' };
      });
    }
    var unidades = {};
    al.van.forEach(function (p) { if (p.unidad) unidades[p.unidad] = true; });
    S.unidades = Object.keys(unidades).sort();
    var estan = {};
    al.van.forEach(function (p) { estan['ALUMNADO|' + p.nombreRel] = true; });
    S.unidades.forEach(function (u) {
      Relacionados.filtrarPorUnidad(al.todos, u).forEach(function (p) {
        var k = 'ALUMNADO|' + App.textoTercero(p);
        if (!estan[k]) S.quitados[k] = true;
      });
    });
    return S;
  }

  /* A quien ya se le ha generado o enviado algo no se le puede desmarcar. */
  async function bloqueadasDe(a) {
    var salida = {};
    if (!window.PersonasDelGrupo || !PersonasDelGrupo.estado) return salida;
    try {
      var ficheros = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; });
      PersonasDelGrupo.estado(a, ficheros).personas.forEach(function (p) {
        if (p.categoria === 'ALUMNADO' && Object.keys(p.hechos).length) salida[p.categoria + '|' + p.nombre] = 'Ya tiene documentos o envíos en este asunto: no se puede quitar.';
      });
    } catch (e) { /* sin ficheros, sin bloqueos */ }
    return salida;
  }

  /* Renombrar el grupo por el mismo camino que «Cambiar el asunto»: la carpeta, la ficha y los hitos a la vez. */
  async function renombrarGrupo(a, corto) {
    var f = a.ficha || {};
    var tipoObj = (App.E.tipos || []).filter(function (t) { return t.tipo === App.tipoDeAsunto(a); })[0];
    var fecha6 = (a.leido && a.leido.fecha) || '';
    var fecha = /^\d{6}$/.test(fecha6) ? '20' + fecha6.slice(0, 2) + '-' + fecha6.slice(2, 4) + '-' + fecha6.slice(4, 6) : '';
    var nombreNuevo = Nombres.montarAsunto({
      fecha: fecha, tipo: Nombres.tipoParaCarpeta(tipoObj || App.tipoDeAsunto(a)), categoria: f.categoria, curso: f.curso || '', grupo: '',
      campos: App.valoresGuardadosParaNombre(App.tipoDeAsunto(a), (f.campos && typeof f.campos === 'object') ? f.campos : {}),
      descripcion: f.descripcion || '', tercero: 'GRUPO ' + corto, numero: f.numero || (a.leido && a.leido.numero) || ''
    }).nombre;
    if (nombreNuevo === a.nombre) return a.nombre;
    if (await Carpetas.existe(App.E.abiertos, nombreNuevo)) throw new Error('Ya hay otro asunto abierto que se llama así.');
    (App.E.recienRenombrados = App.E.recienRenombrados || {})[a.nombre] = nombreNuevo;
    await Carpetas.renombrar(App.E.abiertos, a.nombre, nombreNuevo);
    await AsuntoRenombrar.mover(a.nombre, nombreNuevo, {
      tercero: 'GRUPO ' + corto, grupo: AsuntoDeGrupo.grupoRenombrado(a, { nombreDelGrupo: corto })
    });
    return nombreNuevo;
  }

  async function guardar(a, act, r, soloAnadir) {
    var f = a.ficha || {}, nombre = a.nombre;
    var al = await Actividades.alumnosDe(f);
    var presentadas = {};
    al.van.forEach(function (p) { presentadas['ALUMNADO|' + p.nombreRel] = true; });
    var queremos = {};
    r.alumnos.forEach(function (m) { queremos[m.categoria + '|' + m.nombre] = m; });
    var anadir = r.alumnos.filter(function (m) { return !(f.relacionados || []).some(function (x) { return x.categoria === m.categoria && x.nombre === m.nombre; }); })
      .map(function (m) { return { categoria: m.categoria, nombre: m.nombre }; });
    var quitar = soloAnadir ? [] : Object.keys(presentadas).filter(function (k) { return !queremos[k]; })
      .map(function (k) { return { categoria: 'ALUMNADO', nombre: k.slice('ALUMNADO|'.length) }; });
    if (anadir.length || quitar.length) await App.anotarLista(nombre, 'relacionados', { anadir: anadir, quitar: quitar });
    if (!(f.actividad && f.actividad.id)) await App.anotar(nombre, { actividad: { id: r.id } });
    var fresca = (App.E.registro.asuntos || {})[nombre] || f;
    var nueva = Actividades.construir(Object.assign({}, r, { asunto: { numero: fresca.numero || '', nombre: nombre } }), act);
    nueva.antigua = act ? act.antigua : false;
    nueva.anulada = act ? act.anulada : false;
    nueva.enPapelera = act ? act.enPapelera : false;
    await Actividades.guardarActividad(nueva);
    var grupoActual = f.grupo && typeof f.grupo === 'object' ? f.grupo.nombre : '';
    if (grupoActual && r.corto && r.corto !== grupoActual) await renombrarGrupo(Object.assign({}, a, { ficha: fresca }), r.corto);
  }

  async function terminar(a, mensaje) {
    try { await App.verAbiertos(); } catch (e) { U.accesorio('Hecho, pero no he podido poner la lista al día. Pulsa Recargar', e); }
    if (mensaje) U.aviso(mensaje, 'bueno');
    Actividades.avisarCambio();
  }

  async function cambiar(a) {
    var act = actividadDe(a);
    var r = await ActividadesFormulario.abrir({
      titulo: 'La actividad', inicial: await estadoInicial(a, act), bloqueadas: await bloqueadasDe(a), textoSeguir: 'Guardar'
    });
    if (!r) return;
    try { await guardar(a, act, r, false); await terminar(a, 'Actividad guardada.'); }
    catch (e) { U.fallo('No he podido guardar la actividad', e); }
  }

  async function apuntar(a) {
    var r = await ActividadesFormulario.abrir({
      titulo: 'La actividad', inicial: await estadoInicial(a, null), bloqueadas: await bloqueadasDe(a), textoSeguir: 'Guardar'
    });
    if (!r) return;
    try { await guardar(a, null, r, true); await terminar(a, 'Actividad apuntada.'); }
    catch (e) { U.fallo('No he podido apuntar la actividad', e); }
  }

  async function anularActividad(a, act) {
    var ok = await U.preguntar('Anular la actividad',
      '<p>¿Anular «' + esc(act.nombre) + '»? Dejará de contar como realizada. El asunto sigue abierto y se puede deshacer.</p>', 'Anular la actividad');
    if (!ok) return;
    try { await Actividades.marcarAnulada(act.id, true); pintar(a); }
    catch (e) { U.fallo('No he podido anular la actividad', e); }
  }

  async function deshacerAnulacion(a, act) {
    try { await Actividades.marcarAnulada(act.id, false); pintar(a); }
    catch (e) { U.fallo('No he podido deshacer la anulación', e); }
  }

  /* Si el registro cambia (otro ordenador, la cuenta al día…), la tarjeta a la vista se repinta. */
  if (window.Actividades && Actividades.alCambiar) {
    Actividades.alCambiar.push(function () {
      var caja = $('ficha-actividad');
      if (actual && caja && caja.isConnected) {
        var fresca = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[actual.nombre];
        if (fresca) actual.ficha = fresca;
        pintar(actual);
      }
    });
  }

  return { pintar: pintar, cambiar: cambiar, apuntar: apuntar, apuntarActual: function () { if (actual) apuntar(actual); }, resumenDe: resumenDe };
})();
window.ActividadesFicha = ActividadesFicha;
