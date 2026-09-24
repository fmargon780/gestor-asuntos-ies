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
          '<select class="campo sello-elegir">' +
            '<option value="">Elige un documento…</option>' +
            elegibles.map(function (n) {
              return '<option value="' + U.escapar(n) + '">' + U.escapar(n) + '</option>';
            }).join('') +
          '</select>' +
          '<button type="button" class="boton sello-no-es">No es un registro</button>' +
        '</div>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(caja.querySelectorAll('.aviso-sello'), function (div, i) {
      var d = detectados[i];
      var sel = div.querySelector('.sello-elegir');
      var noEs = div.querySelector('.sello-no-es');

      sel.onchange = async function () {
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

  Object.assign(N, {
    pintarSellos: pintarSellos
  });
})();
