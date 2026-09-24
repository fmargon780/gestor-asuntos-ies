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

  function mismo(a, b) { return U.normalizar(String(a || '')) === U.normalizar(String(b || '')); }

  /* ---------- 1. Tipos: altas y nombre corto ---------- */

  async function fusionarTipos(datos, resumen) {
    var mapa = {};
    var renombrados = [];   /* nombreLargo del documento -> el objeto tipo real de App.E.tipos */
    datos.tipos.forEach(function (entrada, i) {
      /* Sin tildes ni mayúsculas (fila 123): «DESEMPEÑO FUNCION TUTORIAL»
         escrito a mano casa con «DESEMPEÑO FUNCIÓN TUTORIAL». */
      var yaConLargo = App.E.tipos.filter(function (t) {
        return mismo(t.tipo, entrada.nombreLargo) || (entrada.nombreCorto && t.nombreCorto && mismo(t.nombreCorto, entrada.nombreCorto));
      })[0];
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
        return mismo(t.tipo, entrada.nombreCorto) && !t.nombreCorto;
      })[0];
      if (existente) {
        /* Se queda con el nombre corto tal como lo tenía escrito (con o sin
           tilde): las carpetas de sus asuntos lo llevan en el nombre. */
        existente.nombreCorto = existente.tipo;
        existente.tipo = entrada.nombreLargo;
        mapa[entrada.nombreLargo] = existente;
        renombrados.push([existente.nombreCorto, existente.tipo]);   /* fila 126 */
        resumen.tiposRenombrados++;
        return;
      }

      resumen.tiposNoEncontrados.push(entrada.nombreCorto || entrada.nombreLargo);
    });
    if (resumen.tiposCreados || resumen.tiposRenombrados) await App.guardarTipos();
    /* Fila 126 (docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md): un tipo renombrado al
       nombre largo se lleva su guía, campos, plantillas y recurrentes, que
       iban guardados por el nombre de antes. */
    for (var r = 0; r < renombrados.length; r++) {
      if (window.TiposNombre) await TiposNombre.mover(renombrados[r][0], renombrados[r][1]);
    }
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

  /* ---------- "Traer los guiones del instituto" (fila 109) ----------

     Pone el `guion` de cada hito modelo del contenido del centro en los
     pasos de guias.json (emparejando por el modelo del que vienen,
     `origenBiblioteca.id`, o por el id del paso) y en los modelos de
     hitos-biblioteca.json (por su id), solo en los que no tengan ya uno.
     Nunca pisa un guion escrito. Todo pasa por GuiasDelCentro.guardarPasos
     y HitosBiblioteca.cambiar, que releen antes de escribir.

     Fila 124 (docs/RENUNCIA-JUNTA-ELECTORAL.md): a un guion que YA está
     escrito solo se le añaden las líneas que el centro marca `nueva: true`
     y que ese guion no tenga (por su id), justo detrás de la línea que
     las precede en el guion del centro (o al final); y las plantillas de
     `plantillasDocumento` del modelo que el paso no tenga. Nada se quita
     ni se cambia de sitio. */
  async function traerGuiones() {
    var datos = await leerDatosEstaticos();
    var porId = {};
    (datos.modelos || []).forEach(function (m) { if (m.guion && m.guion.length) porId[m.id] = m.guion; });
    function copia(g) { return g.map(function (x) { var c = Object.assign({}, x); delete c.nueva; return c; }); }
    var docsPorId = {};
    (datos.modelos || []).forEach(function (m) { if ((m.plantillasDocumento || []).length) docsPorId[m.id] = m.plantillasDocumento; });
    var resumen = { pasos: 0, modelos: 0 };

    /* Fila 124: las líneas nuevas del centro y sus plantillas, sobre un
       paso (o modelo) que ya tiene guion. Devuelve si ha cambiado algo. */
    function completar(p, origen) {
      var cambio = false;
      var delCentro = porId[origen] || [];
      p.guion = p.guion || [];
      delCentro.forEach(function (linea, i) {
        if (!linea.nueva || p.guion.some(function (g) { return g && g.id === linea.id; })) return;
        var anterior = i > 0 ? delCentro[i - 1].id : null;
        var pos = -1;
        p.guion.forEach(function (g, j) { if (anterior && g && g.id === anterior) pos = j; });
        p.guion.splice(pos === -1 ? (i === 0 ? 0 : p.guion.length) : pos + 1, 0, copia([linea])[0]);
        cambio = true;
      });
      (docsPorId[origen] || []).forEach(function (id) {
        p.plantillasDocumento = p.plantillasDocumento || [];
        if (p.plantillasDocumento.indexOf(id) === -1) { p.plantillasDocumento.push(id); cambio = true; }
      });
      return cambio;
    }

    var enDisco = null;
    try { enDisco = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { enDisco = null; }
    enDisco = (enDisco && typeof enDisco === 'object') ? enDisco : {};
    var ultimoTipo = null;
    for (var tipo in enDisco) {
      var cambiado = 0;
      (function recorrer(pasos) {
        (pasos || []).forEach(function (p) {
          if (!p || typeof p !== 'object') return;
          var esPregunta = (p.opciones || []).length > 0;
          var origen = (p.origenBiblioteca && p.origenBiblioteca.id) || p.id;
          if (!esPregunta && !(p.guion && p.guion.length) && porId[origen]) { p.guion = copia(porId[origen]); completar(p, origen); cambiado++; }
          else if (!esPregunta && completar(p, origen)) cambiado++;
          (p.opciones || []).forEach(function (o) { recorrer(o.pasos); });
        });
      })(enDisco[tipo]);
      if (cambiado) { resumen.pasos += cambiado; ultimoTipo = tipo; }
    }
    /* Una sola escritura de guias.json (con su copia de seguridad) y,
       para que la aplicación lo vea, un guardarPasos del último tipo,
       que relee el fichero entero antes de escribir. */
    if (ultimoTipo) {
      await Copias.guardar(App.E.gestor, 'guias.json', enDisco);
      await GuiasDelCentro.guardarPasos(ultimoTipo, enDisco[ultimoTipo]);
    }

    await HitosBiblioteca.cambiar(function (d) {
      (d.modelos || []).forEach(function (m) {
        if (!(m.guion && m.guion.length) && porId[m.id]) { m.guion = copia(porId[m.id]); completar(m, m.id); resumen.modelos++; }
        else if (completar(m, m.id)) resumen.modelos++;
      });
      return d;
    });
    return resumen;
  }

  return { cargar: cargar, traerGuiones: traerGuiones, _leerDatosEstaticos: leerDatosEstaticos };
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
        /* Fila 109: el guion de cada hito, aparte (quien ya cargó la
           biblioteca antes no lo tiene). */
        '<p class="explica" style="margin-top:14px">El guion de cada hito (lo que hay que hacer dentro de él) ' +
        'se trae aparte: solo se pone en los hitos que todavía no tengan uno. A los que ya lo tienen solo ' +
        'se les añaden las líneas nuevas del instituto que les falten, sin tocar lo demás.</p>' +
        '<button type="button" class="boton" id="btn-traer-guiones">Traer los guiones del instituto</button>' +
        '<div id="resultado-traer-guiones"></div>' +
      '</div>';
    pantalla.appendChild(d);
    $('btn-cargar-biblioteca').onclick = ejecutar;
    $('btn-traer-guiones').onclick = ejecutarGuiones;
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
      U.aviso('No he podido cargarla: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function ejecutarGuiones() {
    var boton = $('btn-traer-guiones');
    var salida = $('resultado-traer-guiones');
    try {
      var r = await U.mientrasGuarda(boton, function () { return CargarBiblioteca.traerGuiones(); });
      var texto = (r.pasos || r.modelos)
        ? 'He traído el guion de ' + r.pasos + ' paso(s) de las guías y de ' + r.modelos + ' hito(s) modelo de la biblioteca.'
        : 'No había nada que traer: todos tenían ya su guion completo.';
      salida.innerHTML = '<p class="explica">' + U.escapar(texto) + '</p>';
      U.aviso(texto, 'bueno');
    } catch (e) {
      U.fallo('No he podido traer los guiones', e);
    }
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (App.pantallaALaVista && !App.pantallaALaVista('ajustes')) return;   /* fila 101 */
      if (window.Gestor.carpetaGestor()) bloque();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();
})();
