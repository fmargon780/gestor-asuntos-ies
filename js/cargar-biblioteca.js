/* ============================================================
   cargar-biblioteca.js — el botón "Cargar la biblioteca del centro"
   (20-sep-2026, fila 80, docs/CARGAR-BIBLIOTECA.md).

   La fila 79 construyó la herramienta (la biblioteca de hitos); esta
   la llena, con el contenido ya preparado para el instituto:
   `datos-biblioteca/biblioteca-centro.json`, generado una sola vez con
   `herramientas/cargar-biblioteca.mjs` a partir de los tres documentos
   de `docs/contenido/`. Ese fichero viaja con la aplicación como un
   dato estático más (como `js/lib/pdf.min.mjs`): se lee con `fetch`,
   nunca con `Carpetas`.

   Fusiona, no pisa (regla del encargo):
   - Un tipo NUEVO que ya exista con ese nombre no se duplica.
   - Un tipo que ya existía se renombra al nombre largo, con su nombre
     de hoy como nombre corto (fila 79, apartado 4.9) — pero solo si
     todavía no tiene nombre corto puesto (una segunda pulsación no lo
     vuelve a tocar).
   - Un modelo que ya exista en la biblioteca, con el mismo id, se deja
     como está.
   - Un tipo que ya tenga guía escrita no se toca: se avisa de cuáles
     se han saltado.
   - Un campo propio que ya exista (por nombre) se reutiliza, no se
     duplica.

   Bloque propio en Ajustes → Mantenimiento, colgado solo (mismo
   patrón que js/hitos-ajustes.js).

   Se carga después de js/hitos-biblioteca.js y js/guias-enganche.js.
   ============================================================ */
var CargarBiblioteca = (function () {

  var URL_DATOS = 'datos-biblioteca/biblioteca-centro.json';
  var datosEstaticos = null;

  async function leerDatosEstaticos() {
    if (datosEstaticos) return datosEstaticos;
    datosEstaticos = await App.leerFicheroDeLaApp(URL_DATOS, 'json');
    return datosEstaticos;
  }

  function propioExistente(campos, nombre) {
    return (campos.propios || []).filter(function (p) { return U.normalizar(p.nombre) === U.normalizar(nombre); })[0] || null;
  }

  function idPropioNuevo(extra) {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36) + extra;
  }

  /* ---------- 1. Tipos: altas y nombre corto ---------- */

  async function fusionarTipos(datos, resumen) {
    var mapa = {};   /* nombreLargo del documento -> el objeto tipo real de App.E.tipos */
    datos.tipos.forEach(function (entrada, i) {
      var yaConLargo = App.E.tipos.filter(function (t) { return t.tipo === entrada.nombreLargo; })[0];
      if (yaConLargo) { mapa[entrada.nombreLargo] = yaConLargo; return; }

      if (entrada.nuevo) {
        var nuevo = { tipo: entrada.nombreLargo, categoria: entrada.categoria };
        if (entrada.nombreCorto) nuevo.nombreCorto = entrada.nombreCorto;
        App.E.tipos.push(nuevo);
        mapa[entrada.nombreLargo] = nuevo;
        resumen.tiposCreados++;
        return;
      }

      var existente = App.E.tipos.filter(function (t) {
        return t.tipo === entrada.nombreCorto && !t.nombreCorto;
      })[0];
      if (existente) {
        existente.nombreCorto = entrada.nombreCorto;
        existente.tipo = entrada.nombreLargo;
        mapa[entrada.nombreLargo] = existente;
        resumen.tiposRenombrados++;
        return;
      }

      resumen.tiposNoEncontrados.push(entrada.nombreCorto || entrada.nombreLargo);
    });
    if (resumen.tiposCreados || resumen.tiposRenombrados) await App.guardarTipos();
    return mapa;
  }

  /* ---------- 2. Campos propios de cada tipo ---------- */

  async function fusionarCampos(datos, mapa, resumen) {
    var campos = await Campos.leer(App.E.gestor);
    for (var nombreLargo in datos.camposPorTipo) {
      var tipoReal = mapa[nombreLargo];
      if (!tipoReal) continue;

      var listaDelTipo = (campos.porTipo && campos.porTipo[tipoReal.tipo]) ? campos.porTipo[tipoReal.tipo].slice() : [];
      var cambiadoEsteTipo = false;
      var contenido = datos.camposPorTipo[nombreLargo];
      for (var i = 0; i < contenido.length; i++) {
        var c = contenido[i];
        var propio = propioExistente(campos, c.nombre);
        if (!propio) {
          propio = { id: idPropioNuevo(i), nombre: c.nombre, clase: c.clase, valores: c.valores };
          campos = await Campos.guardarPropios(App.E.gestor, function (lista) { lista.push(propio); return lista; });
          resumen.camposCreados++;
        }
        var yaAsignado = listaDelTipo.some(function (x) { return x.origen === 'propio' && x.id === propio.id; });
        if (!yaAsignado) { listaDelTipo.push({ origen: 'propio', id: propio.id, obligatorio: false, enNombre: false }); cambiadoEsteTipo = true; }
      }
      if (cambiadoEsteTipo) campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipoReal.tipo, listaDelTipo);
    }
    App.E.campos = campos;
  }

  /* ---------- 3. Los modelos de la biblioteca ---------- */

  async function fusionarModelos(datos, resumen) {
    var biblioteca = await HitosBiblioteca.leer();
    var yaEsta = {};
    biblioteca.modelos.forEach(function (m) { yaEsta[m.id] = true; });
    var faltan = datos.modelos.filter(function (m) { return !yaEsta[m.id]; });
    if (!faltan.length) return;
    await HitosBiblioteca.cambiar(function (d) {
      faltan.forEach(function (m) { d.modelos.push(m); });
      return d;
    });
    resumen.modelosCreados = faltan.length;
  }

  /* ---------- 4. Las guías ----------

     Se relee guias.json directo del disco (no GuiasDelCentro.pasosDe,
     que puede no haberse cargado todavía): un tipo con guía ya escrita
     no se toca. */
  async function fusionarGuias(datos, mapa, resumen) {
    var enDisco = null;
    try { enDisco = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { enDisco = null; }
    enDisco = (enDisco && typeof enDisco === 'object') ? enDisco : {};
    var biblioteca = await HitosBiblioteca.leer();

    for (var nombreLargo in datos.guiasPorTipo) {
      var tipoReal = mapa[nombreLargo];
      if (!tipoReal) continue;
      if (enDisco[tipoReal.tipo] && enDisco[tipoReal.tipo].length) {
        resumen.guiasSaltadas.push(tipoReal.tipo);
        continue;
      }
      var pasos = datos.guiasPorTipo[nombreLargo].map(function (id) {
        var modelo = HitosBiblioteca.buscar(biblioteca, id);
        return modelo ? HitosBiblioteca.modeloAPaso(modelo) : null;
      }).filter(Boolean);
      if (!pasos.length) continue;
      await GuiasDelCentro.guardarPasos(tipoReal.tipo, pasos);
      resumen.guiasCreadas++;
    }
  }

  /* ---------- el conjunto ---------- */

  async function cargar() {
    var datos = await leerDatosEstaticos();
    var resumen = {
      tiposCreados: 0, tiposRenombrados: 0, tiposNoEncontrados: [],
      camposCreados: 0, modelosCreados: 0, guiasCreadas: 0, guiasSaltadas: []
    };
    var mapa = await fusionarTipos(datos, resumen);
    await fusionarCampos(datos, mapa, resumen);
    await fusionarModelos(datos, resumen);
    await fusionarGuias(datos, mapa, resumen);
    return resumen;
  }

  return { cargar: cargar, _leerDatosEstaticos: leerDatosEstaticos };
})();
window.CargarBiblioteca = CargarBiblioteca;

/* ---------- el bloque de Ajustes → Mantenimiento ---------- */

(function () {
  function $(id) { return document.getElementById(id); }

  function bloque() {
    var ya = $('bloque-cargar-biblioteca');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-cargar-biblioteca';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Biblioteca del centro</span>' +
        '<span class="bloque-pie">Tipos, campos y hitos modelo ya preparados para el instituto</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Da de alta los tipos de asunto que falten, les pone el nombre corto, ' +
        'crea los campos propios que hagan falta y escribe la guía de cada uno, con sus hitos ' +
        'modelo y su normativa. Se puede pulsar más de una vez: nada de lo que ya tengas escrito ' +
        'se toca.</p>' +
        '<button type="button" class="boton boton-principal" id="btn-cargar-biblioteca">' +
        'Cargar la biblioteca del centro</button>' +
        '<div id="resultado-cargar-biblioteca"></div>' +
      '</div>';
    pantalla.appendChild(d);
    $('btn-cargar-biblioteca').onclick = ejecutar;
    return d;
  }

  function filaResumen(texto) { return '<li>' + U.escapar(texto) + '</li>'; }

  function textoResumen(r) {
    var lineas = [];
    lineas.push(filaResumen(
      (r.tiposCreados ? r.tiposCreados + ' tipo(s) nuevo(s)' : 'Ningún tipo nuevo') +
      (r.tiposRenombrados ? ', ' + r.tiposRenombrados + ' con su nombre corto puesto' : '') + '.'));
    lineas.push(filaResumen(r.modelosCreados
      ? r.modelosCreados + ' hito(s) modelo nuevo(s) en la biblioteca.'
      : 'Ningún hito modelo nuevo (ya estaban todos).'));
    lineas.push(filaResumen(
      (r.guiasCreadas ? r.guiasCreadas + ' guía(s) escrita(s)' : 'Ninguna guía nueva') +
      (r.guiasSaltadas.length ? ' · ' + r.guiasSaltadas.length + ' saltada(s) porque ya tenían guía' : '') + '.'));
    if (r.camposCreados) lineas.push(filaResumen(r.camposCreados + ' campo(s) propio(s) creado(s).'));
    if (r.tiposNoEncontrados.length) {
      lineas.push(filaResumen('No he encontrado estos tipos con el nombre esperado; ' +
        'revísalos a mano: ' + r.tiposNoEncontrados.join(', ') + '.'));
    }
    return '<ul class="lista-repetidos">' + lineas.join('') + '</ul>';
  }

  async function ejecutar() {
    var boton = $('btn-cargar-biblioteca');
    var salida = $('resultado-cargar-biblioteca');
    var ok = await U.preguntar('Cargar la biblioteca del centro',
      '<p>Se van a dar de alta los tipos, campos y guías que falten, con el contenido ya ' +
      'preparado para el instituto. Nada de lo que ya tengas escrito se pisa.</p>', 'Cargar');
    if (!ok) return;
    try {
      var resumen = await U.mientrasGuarda(boton, function () { return CargarBiblioteca.cargar(); });
      salida.innerHTML = textoResumen(resumen);
      if (typeof App.pintarAjustes === 'function') App.pintarAjustes();
      U.aviso('Biblioteca cargada.', 'bueno');
    } catch (e) {
      U.aviso('No he podido cargarla: ' + e.message, 'malo');
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () { if (window.Gestor.carpetaGestor()) bloque(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();
})();
