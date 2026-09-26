/* ============================================================
   bandeja-adjuntos-lector.js — leer por dentro los PDF adjuntos de
   un correo de la bandeja, para completar la propuesta de tercero y
   tipo con lo que el correo por sí solo no trae (18-sep-2026, fila
   49, docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md).

   Es el hermano de js/documentos-sueltos-lector.js (fila 41): misma
   cola de uno en uno (nunca en paralelo, nunca bloqueando), misma
   caché en memoria mientras dure la pantalla, mismo
   LectorDocumentos.analizar. El contexto (tipos y las tres listas de
   terceros) se monta con ContextoDocumentos.delCentro()
   (js/contexto-documentos.js), sacada de documentos-sueltos-lector.js
   para no montarla dos veces.

   MANDA EL CORREO: lo que ya haya encontrado window.Bandeja.proponer()
   no se toca. El PDF solo rellena el tercero o el tipo cuando el
   correo no los adivina, y aporta dos datos que el correo nunca trae:
   el registro de Séneca y la fecha del propio documento. Si el PDF
   encuentra un tercero distinto del que encontró el correo, gana el
   del correo sin avisar de nada.

   Solo se lee al desplegar la barra "Correos sin clasificar": el
   gancho de js/bandeja-pantalla.js (dentro de `tarjeta(item)`) solo
   llama a `leer()` cuando la barra no está plegada. Con la barra
   plegada no se lee nada, y nunca al arrancar la aplicación.
   ============================================================ */
(function () {
  if (typeof LectorDocumentos === 'undefined' || typeof RegistroLector === 'undefined') return;

  var MAX_ADJUNTOS = 3;
  var PAGINAS = 5;

  /* id del correo -> { texto, tercero, tipo } ya calculado, o null
     mientras no se ha llegado a leer nada de él. `tercero` y `tipo`
     solo llevan algo cuando son nuevos de verdad (el correo no los
     tenía): eso es exactamente lo que hay que aplicar en la pantalla
     de asunto nuevo si se acepta crear el asunto. */
  var resultados = {};
  var enCola = {};
  var cola = [];
  var procesando = false;
  var contextoPromesa = null;

  /* Quien espera a que termine de leerse un correo en concreto
     (window.Bandeja.llevarANuevo, más abajo), antes de que le haya
     tocado su turno en la cola. */
  var esperando = {};

  function contexto() {
    if (!contextoPromesa) contextoPromesa = ContextoDocumentos.delCentro();
    return contextoPromesa;
  }

  function esPdf(nombre) {
    if (window.PdfHerramientas && PdfHerramientas.esPdf) return PdfHerramientas.esPdf(nombre, '');
    return /\.pdf$/i.test(nombre || '');
  }

  /* Como mucho los 3 primeros adjuntos que sean PDF, sin contar nunca
     el PDF del hilo entero ni el del mensaje suelto: ahí no hay nada
     que el texto del correo no tenga ya. */
  function adjuntosAPdf(d) {
    return (d.adjuntos || []).filter(function (n) {
      return n !== d.pdf && n !== d.pdfMensaje && esPdf(n);
    }).slice(0, MAX_ADJUNTOS);
  }

  /* Si hay varios adjuntos, se juntan los análisis: gana el primero
     que traiga cada dato. */
  function juntarAnalisis(lista) {
    var salida = { registro: null, fecha: '', tipo: null, tercero: null };
    lista.forEach(function (a) {
      if (!a) return;
      if (!salida.registro && a.registro) salida.registro = a.registro;
      if (!salida.fecha && a.fecha) salida.fecha = a.fecha;
      if (!salida.tipo && a.tipo) salida.tipo = a.tipo;
      if (!salida.tercero && a.tercero) salida.tercero = a.tercero;
    });
    return salida;
  }

  async function leerAdjuntos(carpetaBandeja, d) {
    var nombres = adjuntosAPdf(d);
    if (!nombres.length) return null;
    var ctx = await contexto();
    var analisis = [];
    for (var i = 0; i < nombres.length; i++) {
      try {
        var h = await carpetaBandeja.getFileHandle(nombres[i]);
        var fichero = await h.getFile();
        var texto = await RegistroLector.textoDe(fichero, PAGINAS);
        if (texto) analisis.push(LectorDocumentos.analizar(texto, ctx));
      } catch (e) { /* un adjunto que falle no para a los demás: mejor esfuerzo */ }
    }
    return analisis.length ? juntarAnalisis(analisis) : null;
  }

  /* La mezcla del punto 2 de la instrucción: manda el correo. El PDF
     solo entra donde el correo dejó un hueco (tercero, tipo), y
     aporta el registro y la fecha del documento, que el correo nunca
     trae. Devuelve null si, mezclado, no hay nada que enseñar. */
  function mezclar(delPdf, propuestaCorreo) {
    if (!delPdf) return null;
    var pc = propuestaCorreo || {};
    var tercero = pc.tercero ? null : (delPdf.tercero || null);
    var tipo = pc.tipo ? null : (delPdf.tipo || null);
    var trozos = [];
    if (delPdf.registro && window.Nombres) {
      var codigo = Nombres.codigoRegistro({
        ano: delPdf.registro.anio, sentido: delPdf.registro.tipo,
        modo: delPdf.registro.serie, numero: delPdf.registro.numero
      });
      if (codigo) trozos.push(codigo);
    }
    var fecha = U.fechaCorta(delPdf.fecha);
    if (fecha) trozos.push(fecha);
    if (tipo) trozos.push(tipo.tipo);
    if (tercero) trozos.push((window.App && App.textoTercero) ? App.textoTercero(tercero) : tercero.nombre);
    if (!trozos.length) return null;
    return { texto: trozos.join(' · '), tercero: tercero, tipo: tipo };
  }

  function lineasDe(id) {
    return Array.prototype.filter.call(document.querySelectorAll('.tarjeta-adjuntos-correo'), function (el) {
      return el.dataset.adjuntosDe === id;
    });
  }

  /* Aplica el resultado a una línea en concreto: si no hay nada que
     enseñar, se quita entera y la tarjeta queda como antes de esta
     fila. Recibe el elemento ya en la mano (no lo busca en el
     documento): `tarjeta(item)` (js/bandeja-pantalla.js) llama a esto
     con la línea recién creada, que todavía puede no estar enganchada
     al documento en ese momento (se engancha justo después, al
     terminar de montar la tarjeta entera) — buscarla con
     document.querySelectorAll no la encontraría. */
  function aplicar(el, r) {
    if (!el) return;
    if (!r || !r.texto) { el.remove(); return; }
    el.className = 'tarjeta-pie tarjeta-adjuntos-correo';
    el.innerHTML = '<span class="marca-tipo">Del documento</span>' + U.escapar(r.texto);
  }

  /* Al terminar de leerse un correo (o de intentarlo) le puede tocar a
     varias líneas a la vez si se ha repintado más de una tarjeta suya
     mientras se leía: esas sí están ya en el documento, así se buscan. */
  function actualizarLinea(id) {
    lineasDe(id).forEach(function (el) { aplicar(el, resultados[id]); });
  }

  async function procesarUno(item) {
    var d = item.datos;
    var id = d.id;
    var r = null;
    var carpetaBandeja = window.Bandeja && window.Bandeja.carpeta();
    if (carpetaBandeja) {
      try {
        var delPdf = await leerAdjuntos(carpetaBandeja, d);
        if (delPdf) {
          var propuestaCorreo = await window.Bandeja.proponer(d);
          r = mezclar(delPdf, propuestaCorreo);
        }
      } catch (e) { r = null; }
    }
    resultados[id] = r;
    actualizarLinea(id);
    (esperando[id] || []).forEach(function (resolver) { resolver(r); });
    delete esperando[id];
  }

  async function procesarCola() {
    if (procesando) return;
    procesando = true;
    try {
      while (cola.length) {
        var item = cola.shift();
        delete enCola[item.datos.id];
        await procesarUno(item);
      }
    } finally { procesando = false; }
  }

  function encolar(item) {
    var id = item.datos.id;
    if (enCola[id] || resultados.hasOwnProperty(id)) return;
    enCola[id] = true;
    cola.push(item);
    procesarCola();
  }

  /* Lo que ha salido de leer los adjuntos de este correo, esperando a
     que termine si todavía no le ha tocado el turno. Null si el
     correo no tenía nada que leer, o si no ha aportado nada nuevo.
     La usa el enganche de window.Bandeja.llevarANuevo, más abajo. */
  function completado(item) {
    var id = item.datos.id;
    if (resultados.hasOwnProperty(id)) return Promise.resolve(resultados[id]);
    if (!adjuntosAPdf(item.datos).length) return Promise.resolve(null);
    encolar(item);
    return new Promise(function (resolver) {
      (esperando[id] = esperando[id] || []).push(resolver);
    });
  }

  /* El gancho mínimo dentro de `tarjeta(item)` (js/bandeja-pantalla.js,
     `tarjeta` no está exportada): crea la línea "Leyendo…" y encola la
     lectura, o dice enseguida que aquí no hay nada que leer. */
  function pintarEn(item, elLinea, plegada) {
    if (plegada) return;
    var id = item.datos.id;
    if (!adjuntosAPdf(item.datos).length) { elLinea.remove(); return; }
    if (resultados.hasOwnProperty(id)) { aplicar(elLinea, resultados[id]); return; }
    elLinea.className = 'tarjeta-pie tarjeta-adjuntos-correo';
    elLinea.textContent = 'Leyendo los documentos…';
    encolar(item);
  }

  /* Completa la propuesta que ya haya dejado el correo en la pantalla
     de "Nuevo asunto", solo cuando el correo no dejó nada puesto: si
     ya hay tipo o tercero (App.elegirTipo y App.elegirCategoria
     reinician lo que venga detrás en su propio orden — categoría,
     tipo, tercero — para el camino normal de elegir a mano), tocar
     cualquiera de los dos ahora borraría lo que el correo ya acertó.
     En ese caso el dato del PDF se queda solo en la línea de la
     tarjeta, para que Francisco lo vea y lo escriba él si hace falta.
     window.Bandeja.llevarANuevo ya ha hecho todo lo suyo (categoría,
     tipo, tercero, fecha, descripción) antes de que esto se ejecute.
     No se toca js/bandeja-correos.js. */
  function engancharLlevarANuevo() {
    if (window.Bandeja && window.Bandeja.llevarANuevo && window.Bandeja.llevarANuevo.__conAdjuntos) return;
    U.envolver(window.Bandeja, 'window.Bandeja.llevarANuevo', 'bandeja-adjuntos-lector.js', function (comoEra) {
      var nueva = async function (item) {
        await comoEra(item);
        var r;
        try { r = await completado(item); } catch (e) { r = null; }
        if (!r || (!r.tercero && !r.tipo)) return;
        /* El correo ya dejó algo puesto (fila 173: el tercero puede
           estar solo "propuesto", esperando a que se elija el tipo,
           sin tipo todavía). */
        if (App.E.nuevo.tercero || App.E.nuevo.tipo || App.E.nuevo.terceroPropuesto) return;
        try {
          if (r.tipo) App.elegirTipo(r.tipo);
          else if (r.tercero) App.elegirCategoria(r.tercero.categoria);
          if (r.tercero) App.fijarTercero(r.tercero);
          App.actualizarCursoNuevo();
          App.actualizarLimiteNuevo();
          App.refrescarVista();
        } catch (e) { /* la pantalla se queda tal como la dejó el correo */ }
      };
      nueva.__conAdjuntos = true;
      return nueva;
    });
  }
  engancharLlevarANuevo();

  window.BandejaAdjuntosLector = { pintarEn: pintarEn };
})();
