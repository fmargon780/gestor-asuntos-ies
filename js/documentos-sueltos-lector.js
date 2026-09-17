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
     que volver a pedirlo no vuelve a tocar el disco. */
  function contexto() {
    if (!contextoPromesa) contextoPromesa = construirContexto();
    return contextoPromesa;
  }

  /* El DNI del alumnado no vive en un campo propio (js/dni.js lo saca
     de las columnas del CSV): se cotejan los dos, DNI y Nº de
     identificación escolar, por si el documento trae uno solo de los
     dos. Las dos entradas apuntan a la misma `persona`: si las dos
     coinciden a la vez, LectorDocumentos.analizar las cuenta como un
     único tercero (agrupa por nombre), no como dos. */
  function entradasDeAlumno(p) {
    var dni = (window.Dni && Dni.de(p)) || '';
    var escolar = p.id || '';
    var entradas = [{ nombre: p.nombre, documento: dni || escolar, persona: p }];
    if (dni && escolar && dni !== escolar) entradas.push({ nombre: p.nombre, documento: escolar, persona: p });
    return entradas;
  }

  async function construirContexto() {
    var alumnado = [], personal = [], empresas = [];
    try {
      var a = await Datos.cargar(App.E.datos, 'ALUMNADO');
      a.lista.forEach(function (p) { alumnado = alumnado.concat(entradasDeAlumno(p)); });
    } catch (e) { /* sin RegAlum.csv, se sigue sin alumnado */ }
    try {
      var pe = await Datos.cargar(App.E.datos, 'PERSONAL');
      personal = pe.lista.map(function (p) { return { nombre: p.nombre, documento: p.documento, persona: p }; });
    } catch (e) { /* sin personal.csv, se sigue sin personal */ }
    try {
      var em = await Datos.cargar(App.E.datos, 'EMPRESAS');
      empresas = em.lista.map(function (p) { return { nombre: p.nombre, documento: p.nif, persona: p }; });
    } catch (e) { /* sin empresas.csv, se sigue sin empresas */ }
    return { tipos: App.E.tipos, alumnado: alumnado, personal: personal, empresas: empresas };
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

  /* La línea entera: el texto de lo encontrado y, si hay tipo Y
     tercero claros (y el tipo propuesto todavía existe: Ajustes puede
     haberlo borrado o renombrado mientras tanto), el botón "Aceptar"
     pegado detrás, dentro de la misma línea gris — no en `.acciones`,
     que ya tiene su propia lista fija de botones comprobada en
     pruebas/documentos-sueltos.mjs. Crea el asunto de un clic, con
     App.crearAsuntoConPropuesta (js/asuntos-nuevo.js). */
  function rellenarLinea(linea, s, propuesta) {
    var texto = textoDeLaPropuesta(propuesta);
    if (!texto) { linea.parentNode && linea.parentNode.removeChild(linea); return; }
    linea.textContent = texto;

    if (!propuesta.tipo || !propuesta.tercero) return;
    var tipoObj = (App.E.tipos || []).filter(function (t) { return t.tipo === propuesta.tipo.tipo; })[0];
    if (!tipoObj) return;

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

  function lineasDe(nombre) {
    return Array.prototype.filter.call(document.querySelectorAll('.tarjeta-propuesta'), function (el) {
      return el.dataset.propuestaDe === nombre;
    });
  }

  /* Cuando termina de leerse un documento (o de intentarlo), se
     actualiza su línea si todavía está en pantalla: si no se ha
     encontrado nada, la línea se quita entera y la tarjeta se queda
     exactamente como hoy. */
  function actualizarTarjeta(nombre) {
    var propuesta = resultados[nombre];
    var s = (App.E.sueltos || []).filter(function (x) { return x.nombre === nombre; })[0];
    lineasDe(nombre).forEach(function (linea) { rellenarLinea(linea, s, propuesta); });
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
              analisis.tercero || analisis.tipo) {
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

  var comoEra = App.tarjetaSuelto;
  App.tarjetaSuelto = function (s, pie, esNuevo) {
    var div = comoEra(s, pie, esNuevo);
    if (!esPdf(s.nombre)) return div;   /* Word, imagen, hoja de cálculo... ni se intenta leer */

    var contenedorTexto = div.querySelector('.tarjeta-texto');
    if (!contenedorTexto) return div;

    if (resultados.hasOwnProperty(s.nombre)) {
      var propuesta = resultados[s.nombre];
      if (!textoDeLaPropuesta(propuesta)) return div;   /* nada que proponer: tarjeta como siempre */
      var linea = document.createElement('div');
      linea.className = 'tarjeta-pie tarjeta-propuesta';
      linea.dataset.propuestaDe = s.nombre;
      contenedorTexto.appendChild(linea);
      rellenarLinea(linea, s, propuesta);
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
})();
