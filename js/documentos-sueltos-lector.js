/* ============================================================
   documentos-sueltos-lector.js — la propuesta de tipo, fecha,
   registro y tercero de cada documento suelto en "Por clasificar"
   (17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md).

   Envuelve App.tarjetaSuelto, igual que hace js/papelera.js con el
   botón Borrar: no toca su HTML por dentro, le añade una línea debajo
   del nombre del fichero y, cuando hay tipo y tercero claros, un botón
   "Aceptar" que crea el asunto de un clic (App.crearAsuntoConPropuesta,
   en js/asuntos-nuevo.js).

   Solo se lee al abrir "Por clasificar" (App.tarjetaSuelto solo se
   llama con esa pantalla a la vista: desde App.pintarSueltos y desde
   App.accionesDeSuelto, del panel del visor), nunca al arrancar. Los
   ficheros se leen de uno en uno, con una cola: nunca en paralelo, y
   nunca se bloquea la pantalla. Lo leído se guarda en memoria con el
   nombre del fichero como clave, mientras dure la pantalla: volver a
   la lista no vuelve a leer nada.

   17-sep-2026, fila 42 (docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md):
   cuando el análisis trae `terceroDesconocido` (un documento de
   identidad que no cuadra con nadie, con un nombre o una razón social al
   lado), debajo de la línea de la propuesta sale un botón "Dar de alta:
   ... — ...", que abre App.cuadroDeTercero (el alta que ya existe) con
   los datos ya escritos. La aplicación nunca da de alta sola: solo al
   guardar el cuadro se escribe el CSV. Guardado, la propuesta se
   actualiza sola con el tercero ya encontrado, sin volver a leer el PDF.
   ============================================================ */
(function () {
  if (typeof App.tarjetaSuelto !== 'function') return;
  if (typeof LectorDocumentos === 'undefined' || typeof RegistroLector === 'undefined') return;

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "dd/mm/aaaa" -> "10-sep-2026", el mismo estilo que App.VERSION.
     Cadena vacía si no se entiende. */
  function fechaCorta(ddmmaaaa) {
    var m = String(ddmmaaaa || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    var mes = MESES[parseInt(m[2], 10) - 1];
    if (!mes) return '';
    return m[1] + '-' + mes + '-' + m[3];
  }

  /* nombre del fichero -> lo que ha devuelto analizar(), o null si no
     había nada que proponer (o el fichero no se ha podido leer). */
  var resultados = {};
  var enCola = {};
  var cola = [];
  var procesando = false;
  var contextoPromesa = null;

  /* El contexto de analizar() (los tipos y las tres listas de
     terceros) se monta una sola vez por pantalla: App.E.tipos ya está
     en memoria, y Datos.cargar tiene su propia caché (js/datos.js), así
     que volver a pedirlo no vuelve a tocar el disco. Cómo se montan
     esas listas vive en js/contexto-documentos.js (18-sep-2026, fila
     49): lo usa también js/bandeja-adjuntos-lector.js, para no
     escribirlo dos veces. */
  function contexto() {
    if (!contextoPromesa) contextoPromesa = ContextoDocumentos.delCentro();
    return contextoPromesa;
  }

  /* La línea de lo encontrado, separada por puntos. Lo que no se haya
     encontrado, no sale. */
  function textoDeLaPropuesta(propuesta) {
    if (!propuesta) return '';
    var trozos = [];
    if (propuesta.registro && window.Nombres) {
      var codigo = Nombres.codigoRegistro({
        ano: propuesta.registro.anio, sentido: propuesta.registro.tipo,
        modo: propuesta.registro.serie, numero: propuesta.registro.numero
      });
      if (codigo) trozos.push(codigo);
    }
    var fecha = fechaCorta(propuesta.fecha);
    if (fecha) trozos.push(fecha);
    if (propuesta.tipo) trozos.push(propuesta.tipo.tipo);
    if (propuesta.tercero) trozos.push(propuesta.tercero.nombre);
    return trozos.join(' · ');
  }

  /* Con qué columna del alta de cada categoría se rellena el documento
     de identidad encontrado. La primera columna (el nombre o la razón
     social) es siempre `def.cabecera[0]`, así que no hace falta aquí. */
  var COLUMNA_DOCUMENTO = { EMPRESAS: 'NIF', PERSONAL: 'Documento', ALUMNADO: 'Documento de identidad' };

  /* El botón "Dar de alta: nombre — documento" (o "Dar de alta: nombre"
     sin el documento, si no se ha encontrado ninguno). Abre el alta que
     ya existe (App.cuadroDeTercero, js/asuntos-nuevo.js) con los datos
     ya escritos: la aplicación nunca da de alta sola. Guardado, la
     propuesta se actualiza con el tercero recién creado —ya no hace
     falta buscarlo a mano— y, si el tipo también estaba claro, el botón
     "Aceptar" aparece solo, sin volver a leer el documento. */
  function botonDarDeAlta(propuesta, s) {
    var td = propuesta && propuesta.terceroDesconocido;
    if (!td || typeof Datos === 'undefined' || !Datos.LISTAS[td.categoria]) return null;
    var def = Datos.LISTAS[td.categoria];

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton boton-principal boton-dar-de-alta';
    boton.textContent = 'Dar de alta: ' + td.nombre + (td.documento ? ' — ' + td.documento : '');
    boton.title = 'Abre el alta con estos datos ya escritos. No se da de alta sola: hay que revisar y guardar.';
    boton.onclick = async function (ev) {
      if (ev) ev.stopPropagation();
      var valores = {};
      valores[def.cabecera[0]] = td.nombre;
      var columnaDoc = COLUMNA_DOCUMENTO[td.categoria];
      if (columnaDoc && td.documento) valores[columnaDoc] = td.documento;
      var titulo = td.categoria === 'ALUMNADO' ? 'Dar de alta un solicitante' : 'Dar de alta en ' + td.categoria;

      boton.disabled = true;
      var puestos = await App.cuadroDeTercero(td.categoria, valores, titulo);
      if (!puestos) { boton.disabled = false; return; }

      var fresca;
      try {
        fresca = await Datos.anadirALista(App.E.datos, td.categoria, puestos);
      } catch (e) {
        U.aviso('No he podido dar de alta: ' + e.message, 'malo');
        boton.disabled = false;
        return;
      }
      U.aviso('Dado de alta.', 'bueno');
      contextoPromesa = null;   /* el próximo cotejo tiene que verlo ya */

      var nombreNuevo = puestos[def.cabecera[0]];
      var persona = (fresca.lista || []).filter(function (p) { return p.nombre === nombreNuevo; })[0];
      propuesta.tercero = persona
        ? { categoria: td.categoria, nombre: nombreNuevo, persona: persona, por: 'documento' }
        : null;
      propuesta.terceroDesconocido = null;
      actualizarTarjeta(s.nombre);
    };
    return boton;
  }

  /* La línea entera: el texto de lo encontrado y, si hay tipo Y
     tercero claros (y el tipo propuesto todavía existe: Ajustes puede
     haberlo borrado o renombrado mientras tanto), el botón "Aceptar"
     pegado detrás, dentro de la misma línea gris — no en `.acciones`,
     que ya tiene su propia lista fija de botones comprobada en
     pruebas/documentos-sueltos.mjs. Crea el asunto de un clic, con
     App.crearAsuntoConPropuesta (js/asuntos-nuevo.js).

     Debajo, en su propia línea, el botón "Dar de alta" cuando toque
     (fila 42): las dos cosas no salen a la vez, porque solo se propone
     dar de alta cuando no hay tercero claro, y "Aceptar" solo cuando sí
     lo hay. */
  function rellenarLinea(grupo, s, propuesta) {
    grupo.className = 'tarjeta-propuesta';   /* por si venía de "Leyendo el documento…" */
    grupo.innerHTML = '';
    var texto = textoDeLaPropuesta(propuesta);
    var botonAlta = botonDarDeAlta(propuesta, s);
    if (!texto && !botonAlta) { grupo.parentNode && grupo.parentNode.removeChild(grupo); return; }

    if (texto) {
      var linea = document.createElement('div');
      linea.className = 'tarjeta-pie';
      linea.textContent = texto;

      var tipoObj = propuesta.tipo && propuesta.tercero &&
        (App.E.tipos || []).filter(function (t) { return t.tipo === propuesta.tipo.tipo; })[0];
      if (tipoObj) {
        var aceptar = document.createElement('button');
        aceptar.type = 'button';
        aceptar.className = 'boton boton-principal';
        aceptar.style.marginLeft = '10px';
        aceptar.textContent = 'Aceptar';
        aceptar.title = 'Crea el asunto con lo encontrado y mete el documento dentro, sin preguntar nada más';
        aceptar.onclick = async function (ev) {
          if (ev) ev.stopPropagation();
          aceptar.disabled = true;
          try {
            await App.crearAsuntoConPropuesta(tipoObj, propuesta.tercero.persona, s);
          } catch (e) {
            U.aviso('No he podido crear el asunto: ' + e.message, 'malo');
            aceptar.disabled = false;
          }
        };
        linea.appendChild(aceptar);
      }
      grupo.appendChild(linea);
    }

    if (botonAlta) {
      var lineaAlta = document.createElement('div');
      lineaAlta.className = 'tarjeta-pie';
      lineaAlta.appendChild(botonAlta);
      grupo.appendChild(lineaAlta);
    }
  }

  function lineasDe(nombre) {
    return Array.prototype.filter.call(document.querySelectorAll('.tarjeta-propuesta'), function (el) {
      return el.dataset.propuestaDe === nombre;
    });
  }

  /* Cuando termina de leerse un documento (o de intentarlo), se
     actualiza su bloque si todavía está en pantalla: si no se ha
     encontrado nada, se quita entero y la tarjeta se queda exactamente
     como hoy. */
  function actualizarTarjeta(nombre) {
    var propuesta = resultados[nombre];
    var s = (App.E.sueltos || []).filter(function (x) { return x.nombre === nombre; })[0];
    lineasDe(nombre).forEach(function (grupo) { rellenarLinea(grupo, s, propuesta); });
  }

  async function procesarUno(nombre) {
    var s = (App.E.sueltos || []).filter(function (x) { return x.nombre === nombre; })[0];
    var propuesta = null;
    if (s) {
      try {
        var fichero = await s.handle.getFile();
        var texto = await RegistroLector.textoDe(fichero, 5);
        if (texto) {
          var ctx = await contexto();
          var analisis = LectorDocumentos.analizar(texto, ctx);
          if (analisis.registro || analisis.fecha || analisis.documentos.length ||
              analisis.tercero || analisis.tipo || analisis.terceroDesconocido) {
            propuesta = analisis;
          }
        }
      } catch (e) {
        propuesta = null;   /* mejor esfuerzo: si algo falla, se queda como hoy */
      }
    }
    resultados[nombre] = propuesta;
    actualizarTarjeta(nombre);
  }

  async function procesarCola() {
    if (procesando) return;
    procesando = true;
    try {
      while (cola.length) {
        var nombre = cola.shift();
        delete enCola[nombre];
        await procesarUno(nombre);
      }
    } finally {
      procesando = false;
    }
  }

  function encolar(nombre) {
    if (enCola[nombre] || resultados.hasOwnProperty(nombre)) return;
    enCola[nombre] = true;
    cola.push(nombre);
    procesarCola();
  }

  function esPdf(nombre) {
    if (window.PdfHerramientas && PdfHerramientas.esPdf) return PdfHerramientas.esPdf(nombre, '');
    return /\.pdf$/i.test(nombre || '');
  }

  U.envolver('App.tarjetaSuelto', window.App, 'tarjetaSuelto', 'js/documentos-sueltos-lector.js', function (comoEra) {
    return function (s, pie, esNuevo) {
      var div = comoEra(s, pie, esNuevo);
      if (!esPdf(s.nombre)) return div;   /* Word, imagen, hoja de cálculo... ni se intenta leer */

      var contenedorTexto = div.querySelector('.tarjeta-texto');
      if (!contenedorTexto) return div;

      if (resultados.hasOwnProperty(s.nombre)) {
        var propuesta = resultados[s.nombre];
        var hayAlgo = textoDeLaPropuesta(propuesta) || (propuesta && propuesta.terceroDesconocido);
        if (!hayAlgo) return div;   /* nada que proponer: tarjeta como siempre */
        var grupo = document.createElement('div');
        grupo.className = 'tarjeta-propuesta';
        grupo.dataset.propuestaDe = s.nombre;
        contenedorTexto.appendChild(grupo);
        rellenarLinea(grupo, s, propuesta);
        return div;
      }

      var leyendo = document.createElement('div');
      leyendo.className = 'tarjeta-pie tarjeta-propuesta';
      leyendo.dataset.propuestaDe = s.nombre;
      leyendo.textContent = 'Leyendo el documento…';
      contenedorTexto.appendChild(leyendo);
      encolar(s.nombre);
      return div;
    };
  });
})();
