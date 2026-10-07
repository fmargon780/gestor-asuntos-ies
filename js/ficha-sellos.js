/* ============================================================
   ficha-sellos.js — un papel que ya trae el sello del registro, avisado arriba de la ficha.

   Sacado tal cual de js/ficha-asunto.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   El estado de la ficha (el asunto que se ve, su modo, la huella…) y lo
   de los demás ficheros de la ficha se piden a `window.FichaNucleo` (N).
   Se carga justo detrás de js/ficha-asunto.js.
   ============================================================ */
(function () {
  var N = window.FichaNucleo;
  if (!N) return;

  function $(id) { return document.getElementById(id); }

  /* ---------- un papel que ya trae el sello del registro ----------

     Fila 20, 17-sep-2026 (docs/REGISTRO-SIN-DUPLICAR.md): si en la
     carpeta hay un PDF sin el nombre de la aplicación y con el sello
     de Séneca dentro, sale aquí arriba, preguntando de qué documento
     es. La máquina de verdad (leer el sello, no repetir la lectura,
     renombrar y avisar) vive en js/registro-sellado.js; aquí solo se
     pinta y se engancha. */

  async function pintarSellos(a) {
    var caja = $('ficha-sellos');
    if (!caja || !window.RegistroSellado) return;
    if (N.modoActual !== 'abierto') { caja.innerHTML = ''; return; }

    var detectados;
    try { detectados = await RegistroSellado.detectar(a); }
    catch (e) { detectados = []; }
    if (N.actual !== a) return;   /* se ha cambiado de ficha mientras se leía */
    /* Fila 285: con un hito esperando su PDF sellado, se coloca solo sin preguntar (si no hay dudas). */
    if (window.HacerEsteHitoSello) detectados = await HacerEsteHitoSello.alDetectar(a, detectados);
    if (N.actual !== a) return;
    /* Fila 294: en un asunto con «Estos documentos se registran en Séneca», esos PDF van a la lista de la tarjeta. */
    if (window.GrupoRegistro) detectados = await GrupoRegistro.filtrarAviso(a, detectados);
    if (N.actual !== a) return;

    if (!detectados.length) { caja.innerHTML = ''; return; }

    var lista;
    try { lista = await Carpetas.ficheros(a.handle); }
    catch (e) { lista = []; }
    if (N.actual !== a) return;

    var elegibles = lista
      .filter(function (f) { return Documentos.pareceDeLaAplicacion(f.nombre); })
      .map(function (f) { return f.nombre; })
      .sort()
      .reverse();

    caja.innerHTML = detectados.map(function (d, i) {
      var s = d.sello;
      var codigo = Nombres.codigoRegistro({ ano: s.anio, sentido: s.tipo, modo: s.serie, numero: s.numero });
      var sentido = s.tipo === 'S' ? 'SALIDA' : 'ENTRADA';
      return '<div class="aviso aviso-ambar aviso-sello" data-sello="' + i + '">' +
        '<strong>Este papel trae el sello de registro ' + U.escapar(codigo || '(sin número)') +
          ' (' + sentido + (s.fecha ? ', ' + U.escapar(s.fecha) : '') + ').</strong>' +
        '<p>¿De qué documento es el registro? <span class="suave">(' + U.escapar(d.nombre) + ')</span></p>' +
        '<div class="sello-fila">' +
          /* Fila 233: «Es un documento nuevo» va el primero, y sin ningún documento de la
             aplicación en la carpeta no sale un desplegable vacío. */
          '<button type="button" class="boton boton-principal sello-nuevo">Es un documento nuevo</button>' +
          (elegibles.length
            ? '<select class="campo sello-elegir">' +
                '<option value="">Elige un documento…</option>' +
                elegibles.map(function (n) {
                  return '<option value="' + U.escapar(n) + '">' + U.escapar(n) + '</option>';
                }).join('') +
              '</select>'
            : '') +
          '<button type="button" class="boton sello-no-es">No es un registro</button>' +
        '</div>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(caja.querySelectorAll('.aviso-sello'), function (div, i) {
      var d = detectados[i];
      var sel = div.querySelector('.sello-elegir');
      var noEs = div.querySelector('.sello-no-es');

      var nuevo = div.querySelector('.sello-nuevo');
      nuevo.onclick = function () { esDocumentoNuevo(a, d, nuevo); };

      if (sel) sel.onchange = async function () {
        if (!sel.value) return;
        var original = sel.value;
        try {
          await U.mientrasGuarda(sel, function () {
            return RegistroSellado.asociar(a, d.nombre, original, d.sello);
          });
        } catch (e) {
          U.fallo('No he podido asociar el sello', e);
        }
        if (N.actual !== a) return;
        try {
          N.pintarDocumentos(a);
          if (window.Notas) {
            a.ficha.notas = await window.Notas.frescas(a);
            N.pintarNotas(a, N.modoActual === 'abierto');
          }
        } finally {
          pintarSellos(a);
        }
      };

      noEs.onclick = async function () {
        try { await U.mientrasGuarda(noEs, function () { return RegistroSellado.marcarIgnorado(a, d.nombre); }); }
        catch (e) { U.fallo('No he podido guardarlo', e); }
        if (N.actual !== a) return;
        pintarSellos(a);
      };
    });
  }

  /* Fila 233 (docs/SELLO-DOCUMENTO-NUEVO.md): el papel sellado es un documento nuevo, sin ningún
     documento anterior en la carpeta. Se abre el mismo cuadro de poner nombre de siempre, ya con
     el sello leído (registro y fecha) y asociado al hito en curso. Al guardar: la nota «Registrado
     …» del asunto y la tarea de registro del hito, marcada sola. Cerrar sin guardar no cambia nada. */
  async function esDocumentoNuevo(a, d, boton) {
    var antes = [];
    try { antes = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { antes = []; }
    var hito = null;
    try {
      await Hitos.leer();
      hito = Hitos.hitoActualDeAsunto ? Hitos.hitoActualDeAsunto(a) : null;
    } catch (e1) { hito = null; }
    boton.disabled = true;
    try {
      await App.verDocumentos(a, { ponerNombre: d.nombre, propuesta: { fecha: d.sello.fecha, registro: d.sello }, hito: hito });
    } finally { boton.disabled = false; }
    if (N.actual !== a) return;
    var despues = [];
    try { despues = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; }); } catch (e2) { despues = []; }
    var nombreNuevo = despues.filter(function (n) { return antes.indexOf(n) === -1; })[0];
    if (nombreNuevo && despues.indexOf(d.nombre) === -1) {
      await alGuardarComoNuevo(a, d, nombreNuevo, hito);
    }
    N.pintarDocumentos(a);
    pintarSellos(a);
  }

  async function alGuardarComoNuevo(a, d, nombreNuevo, hito) {
    var s = d.sello;
    try {
      var codigo = Nombres.codigoRegistro({ ano: s.anio, sentido: s.tipo, modo: s.serie, numero: s.numero });
      if (window.Notas && codigo) {
        await window.Notas.sustituir(a, 'Registrado ' + codigo + (s.fecha ? ' el ' + s.fecha : '') + ' · ' + nombreNuevo,
          'registroDeDocumento', nombreNuevo, { auto: true });
        a.ficha.notas = await window.Notas.frescas(a);
        N.pintarNotas(a, N.modoActual === 'abierto');
      }
    } catch (e) { U.accesorio('Documento guardado, pero no he podido apuntar el registro en las notas', e); }
    /* La tarea de registro o de descarga del hito, si la tiene y está sin marcar. */
    if (hito && hito.id && Hitos.marcarGuionPorAccion) {
      try {
        var paso = await Hitos.marcarGuionPorAccion(a, hito.id, 'registrar');
        if (!paso) await Hitos.marcarGuionPorAccion(a, hito.id, 'anadir');
      } catch (e2) { /* no crítico */ }
    }
  }

  Object.assign(N, {
    pintarSellos: pintarSellos
  });
})();
