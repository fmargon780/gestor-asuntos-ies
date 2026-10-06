/* ============================================================
   demo/franja.js — la entrada y la franja fija de la copia de pruebas
   (fila 222, docs/COPIA-DE-PRUEBAS.md).

   Pone el botón «Entrar con datos de demostración» en la pantalla de
   entrada, hace la entrada (con las carpetas de mentira de
   js/demo/disco.js) y construye el juego de datos (js/demo/datos.js).
   Con `?demo=1&auto=1` entra sola, sin pulsar nada: es lo que usa el
   revisor con Playwright.

   Después de entrar, pone la franja fija de arriba en todas las
   pantallas, con «Volver a empezar» (recarga con el disco vacío).
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function autoPedido() {
    return /(^|[?&])auto=1(&|$)/.test(location.search);
  }

  /* ---------- entrar ---------- */

  var entrando = false;

  async function entrar(boton) {
    if (entrando) return;
    entrando = true;
    if (boton) { boton.disabled = true; boton.textContent = 'Entrando…'; }
    try {
      var disco = Demo.activar();

      App.E.abiertos = disco.abiertos;
      App.marcarCarpeta('estado-abiertos', disco.abiertos.name);
      App.E.archivo = disco.archivo;
      App.marcarCarpeta('estado-archivo', disco.archivo.name);
      $('campo-usuario').value = 'Revisor';
      App.revisarArranque();

      /* Fila 260: con «solo consultar» puesto, los datos se montan con la protección parada y después
         se entra otra vez ya protegido, con el contador de escrituras a cero. */
      var soloConsulta = !!(window.SoloConsulta && SoloConsulta.activo());
      if (soloConsulta) { SoloConsulta.pausar(true); document.body.classList.add('demo-montando'); }
      await $('btn-entrar').onclick();
      await Demo.datos.construir(disco);
      if (window.Gestor && window.Gestor.recargar) await window.Gestor.recargar();
      if (soloConsulta) {
        /* Que acaben las tareas de fondo de la primera entrada (migraciones a los 2-3 s) antes de proteger. */
        await new Promise(function (ok) { setTimeout(ok, 4500); });
        SoloConsulta.pausar(false);
        Demo.reiniciarEscrituras();
        await $('btn-entrar').onclick();
        document.body.classList.remove('demo-montando');
      }
      /* Fila 287: con `&usuario=<nombre>`, los datos se montan como Revisor y se entra otra vez con ese nombre
         (si tiene perfil de directivo, protegido y con su pantalla). */
      var usuarioDemo = new URLSearchParams(window.location.search).get('usuario') || '';
      if (usuarioDemo && !soloConsulta && window.Perfil) {
        document.body.classList.add('demo-montando');
        await new Promise(function (ok) { setTimeout(ok, 4500); });
        Perfil._reiniciar();
        $('campo-usuario').value = usuarioDemo;
        Demo.reiniciarEscrituras();
        await $('btn-entrar').onclick();
        document.body.classList.remove('demo-montando');
      }
      if (typeof App.irVista === 'function') App.irVista(App.E.vista || 'departamento');

      ponerFranja();
    } catch (e) {
      entrando = false;
      if (boton) { boton.disabled = false; boton.textContent = 'Entrar con datos de demostración'; }
      if (window.U && U.aviso) U.aviso('No he podido montar la copia de pruebas: ' + (window.U.mensajeDeError ? U.mensajeDeError(e) : e.message), 'malo');
      else console.error(e);
    }
  }

  function ponerBoton() {
    var paso = $('paso-carpetas');
    if (!paso || $('btn-demo-entrar')) return;
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'btn-demo-entrar';
    boton.className = 'boton boton-ancho';
    boton.style.marginTop = '10px';
    boton.textContent = 'Entrar con datos de demostración';
    boton.onclick = function () { entrar(boton); };

    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.id = 'demo-nota-entrada';
    nota.textContent = 'Datos inventados. Nada se guarda: al recargar, vuelve a empezar.';

    paso.appendChild(boton);
    paso.appendChild(nota);
  }

  /* ---------- la franja fija ---------- */

  function ponerFranja() {
    if ($('franja-demo')) return;
    var franja = document.createElement('div');
    franja.id = 'franja-demo';
    franja.innerHTML =
      '<span>Copia de pruebas · datos inventados · nada se guarda</span>' +
      '<button type="button" id="btn-demo-reiniciar" class="boton">Volver a empezar</button>';
    document.body.insertBefore(franja, document.body.firstChild);
    document.body.classList.add('demo-activo');
    $('btn-demo-reiniciar').onclick = function () { Demo.reiniciar(); };
    medirFranja();
    window.addEventListener('resize', medirFranja, { passive: true });
  }

  function medirFranja() {
    var franja = $('franja-demo');
    if (!franja) return;
    document.documentElement.style.setProperty('--franja-demo-alto', Math.ceil(franja.getBoundingClientRect().height) + 'px');
  }

  /* ---------- arranque de este fichero ----------

     Nada de esperar a DOMContentLoaded: este script se inserta (con
     document.write, desde js/demo/arrancar.js) justo antes de
     js/inicio.js, y el marcado de la pantalla de entrada (#paso-carpetas
     y compañía) ya está parseado —va mucho antes en el propio
     index.html—. Hace falta que `Demo.activar()` cambie `indexedDB` y
     `showDirectoryPicker` AHORA MISMO, de forma síncrona, antes de que
     `js/inicio.js` (el siguiente <script>) llame a `App.arrancar()`. */
  Demo.activar();
  if (autoPedido()) entrar(null); else ponerBoton();
})();
