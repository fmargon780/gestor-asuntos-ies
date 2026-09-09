/* ============================================================
   guias-enganche.js — pone las guías dentro de la aplicación.

   guias.js sabe pintar y escribir una guía, pero no sabe nada de la
   aplicación. Este fichero es el que la enchufa: guarda las guías en
   _GESTOR/guias.json, pone el botón de cada tipo en Ajustes y el
   botón "Guía" en cada asunto abierto.

   Lo que se marca como hecho se guarda en la ficha del asunto, en
   asuntos.json, así que lo ve todo el que abra la aplicación.
   ============================================================ */
(function () {

  var FICHERO = 'guias.json';

  var guias = {};        /* { "MATRICULA": [pasos], ... } */
  var yaLeido = false;

  function $(id) { return document.getElementById(id); }

  function pasosDe(tipo) {
    return (guias && guias[tipo]) ? guias[tipo] : [];
  }

  async function cargar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    var leido = await Carpetas.leerJson(g, FICHERO);
    guias = (leido && typeof leido === 'object') ? leido : {};
  }

  async function guardar() {
    var g = window.Gestor.carpetaGestor();
    if (!g) return;
    await Carpetas.guardarJson(g, FICHERO, guias);
  }

  /* ---------- el botón de cada asunto abierto ---------- */

  /* El tipo del asunto sale del nombre de la carpeta, y si no, de su
     ficha: así también funciona en carpetas creadas a mano. */
  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function botonDeTarjeta(a, modo) {
    if (modo !== 'abierto') return null;
    var pasos = pasosDe(tipoDe(a));
    if (!pasos.length) return null;

    var hechos = (a.ficha && a.ficha.pasosHechos) || [];
    var cuantos = Guias.hechosDe(pasos, hechos);

    var b = document.createElement('button');
    b.className = 'boton' + (cuantos ? ' boton-marcado' : '');
    b.textContent = 'Guía ' + cuantos + '/' + pasos.length;
    b.title = 'Los pasos de un asunto de tipo ' + tipoDe(a) +
              ', para ir marcando lo que ya está hecho';
    b.onclick = function () { abrirGuiaDe(a); };
    return b;
  }

  async function abrirGuiaDe(a) {
    var tipo = tipoDe(a);
    var pasos = pasosDe(tipo);
    var hechos = (a.ficha && a.ficha.pasosHechos) || [];

    /* Se guarda en cuanto se marca, no al cerrar: si el navegador se
       cierra a media lista, lo marcado ya está a salvo. */
    var ultimo = hechos.slice();
    var guardando = false;

    async function apuntar(marcados) {
      ultimo = marcados;
      if (guardando) return;
      guardando = true;
      try {
        await window.Gestor.anotar(a.nombre, {
          pasosHechos: ultimo,
          pasosEl: U.ahora(),
          pasosPor: window.Gestor.usuario()
        });
      } catch (e) {
        U.aviso('No he podido guardar lo marcado: ' + e.message, 'malo');
      }
      guardando = false;
    }

    await Guias.abrir('Guía de ' + tipo, pasos, hechos, apuntar);
    await window.Gestor.recargar();
  }

  /* ---------- la tabla de Ajustes ---------- */

  function pintarTabla() {
    var caja = $('tabla-guias');
    if (!caja) return;
    caja.innerHTML = '';

    var tipos = window.Gestor.tipos();
    if (!tipos.length) {
      caja.innerHTML = '<div class="vacio">Primero hacen falta tipos de asunto, ' +
                       'aquí mismo en Ajustes.</div>';
      return;
    }

    Nombres.CATEGORIAS.forEach(function (cat) {
      var deEsta = tipos.filter(function (t) { return t.categoria === cat; });
      if (!deEsta.length) return;
      var t = document.createElement('h4');
      t.textContent = cat;
      t.style.cssText = 'margin:16px 0 4px;font-size:13px;color:#5d6b7a';
      caja.appendChild(t);

      deEsta.forEach(function (tipo) {
        var pasos = pasosDe(tipo.tipo);
        var f = document.createElement('div');
        f.className = 'fila-tipo';
        f.innerHTML = '<span class="nombre-tipo">' + U.escapar(tipo.tipo) + '</span>' +
          '<span class="suave" style="flex:1">' +
          (pasos.length
            ? (pasos.length === 1 ? '1 paso' : pasos.length + ' pasos')
            : 'sin guía todavía') + '</span>';

        var b = document.createElement('button');
        b.className = 'boton' + (pasos.length ? ' boton-marcado' : '');
        b.textContent = pasos.length ? 'Cambiar la guía' : 'Escribir la guía';
        b.onclick = function () { escribirGuia(tipo.tipo); };
        f.appendChild(b);

        caja.appendChild(f);
      });
    });
  }

  async function escribirGuia(nombreTipo) {
    var pasos = await Guias.editar(nombreTipo, pasosDe(nombreTipo));
    if (pasos === null || pasos === false || pasos === undefined) return;

    if (pasos.length) guias[nombreTipo] = pasos;
    else delete guias[nombreTipo];

    try {
      await guardar();
      pintarTabla();
      await window.Gestor.recargar();
      U.aviso(pasos.length
        ? 'Guía de ' + nombreTipo + ' guardada: ' + pasos.length + ' pasos.'
        : nombreTipo + ' se queda sin guía.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarla: ' + e.message, 'malo');
    }
  }

  /* ---------- arranque ---------- */

  async function arrancar() {
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    yaLeido = true;
    await cargar();
    pintarTabla();
    await window.Gestor.recargar();
  }

  function enganchar() {
    if (!window.Gestor) return;

    /* El botón de cada tarjeta de asunto abierto. */
    window.Gestor.botonesDeTarjeta.push(botonDeTarjeta);

    window.Gestor.alRefrescar.push(function () {
      if (!yaLeido && window.Gestor.carpetaGestor()) arrancar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
