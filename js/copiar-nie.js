/* ============================================================
   copiar-nie.js — copiar de un clic el Nº de identificación escolar.

   Es el dato que se pega todo el día en el buscador de Séneca. Aquí
   se pone un botón que lo copia, en los cuatro sitios donde aparece
   un alumno o una alumna:

     - en la tarjeta de cada asunto de alumnado, abierto o archivado;
     - dentro de la ficha del asunto;
     - en la lista de resultados al buscar a alguien;
     - en la ficha del alumno, en Personas y empresas.

   El número sale del final del nombre de la carpeta, que es donde lo
   escribe nombres.js, o del fichero de Séneca cuando hay ficha.

   Este fichero se carga el último a propósito: envuelve las funciones
   que pintan, así que su botón se pone después de que las demás
   piezas hayan terminado con la tarjeta.
   ============================================================ */
(function () {

  /* ---------- de dónde sale el número ---------- */

  /* En el nombre de la carpeta el tercero va el último, y en el
     alumnado el tercero termina en el número. Se piden cinco cifras o
     más para no confundirlo con los cuatro caracteres del documento
     que lleva el personal. */
  function nieDeNombre(nombre) {
    var m = String(nombre || '').match(/(\d{5,})\s*$/);
    return m ? m[1] : '';
  }

  /* La categoría del asunto: la de su ficha, la que se lee del tipo, o
     la carpeta del ARCHIVO donde está guardado. Si no se sabe de qué
     es el asunto, no se pone el botón: más vale no ponerlo que copiar
     el NIF de una empresa creyendo que es un alumno. */
  function categoriaDe(a) {
    if (!a) return '';
    if (a.ficha && a.ficha.categoria) return a.ficha.categoria;
    if (a.leido && a.leido.categoria) return a.leido.categoria;
    if (a.ruta) return String(a.ruta).split('/')[0].trim();
    return '';
  }

  function nieDeAsunto(a) {
    if (categoriaDe(a) !== 'ALUMNADO') return '';
    return nieDeNombre(a && a.nombre);
  }

  /* ---------- el botón ---------- */

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; })
        .catch(function () { return aLaAntigua(texto); });
    }
    return Promise.resolve(aLaAntigua(texto));
  }

  /* Por si el navegador no deja usar el portapapeles nuevo. */
  function aLaAntigua(texto) {
    try {
      var c = document.createElement('textarea');
      c.value = texto;
      c.setAttribute('readonly', '');
      c.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
      document.body.appendChild(c);
      c.select();
      var ok = document.execCommand('copy');
      c.parentNode.removeChild(c);
      return ok;
    } catch (e) { return false; }
  }

  function boton(nie, pequeno) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-nie' + (pequeno ? ' boton-nie-chico' : '');
    b.textContent = 'Nº ' + nie;
    b.title = 'Copiar ' + nie + ', el Nº de identificación escolar, para pegarlo en Séneca';
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      copiar(nie).then(function (ok) {
        if (!ok) { U.aviso('No he podido copiarlo. Es el ' + nie + '.', 'malo'); return; }
        var antes = b.textContent;
        b.textContent = 'Copiado';
        b.classList.add('boton-marcado');
        setTimeout(function () {
          b.textContent = antes;
          b.classList.remove('boton-marcado');
        }, 1400);
      });
    };
    return b;
  }

  /* ---------- 1. la tarjeta de cada asunto ---------- */

  (function () {
    var comoEra = App.tarjetaAsunto;
    App.tarjetaAsunto = function (a, modo) {
      var div = comoEra(a, modo);
      var nie = nieDeAsunto(a);
      var acciones = div.querySelector('.acciones');
      if (nie && acciones && !acciones.querySelector('.boton-nie')) {
        acciones.insertBefore(boton(nie), acciones.firstChild);
      }
      return div;
    };
  })();

  /* ---------- 2. la ficha del asunto ----------

     La ficha se repinta ella sola cada vez que se cambia el estado, el
     plazo o la vía, y en ese repintado se lleva por delante el botón.
     Por eso se vigila la pantalla y se vuelve a poner. */

  (function () {
    var comoEra = App.abrirFicha;
    if (typeof comoEra !== 'function') return;
    var viendo = null;

    App.abrirFicha = function (a, modo) {
      viendo = a;
      comoEra(a, modo);
      poner();
    };

    function poner() {
      if (!viendo) return;
      var caja = document.getElementById('ficha-acciones');
      if (!caja || caja.querySelector('.boton-nie')) return;
      var nie = nieDeAsunto(viendo);
      if (!nie) return;
      caja.insertBefore(boton(nie), caja.firstChild);
    }

    var pantalla = document.getElementById('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { poner(); })
        .observe(pantalla, { childList: true, subtree: true });
    }
  })();

  /* ---------- 3. las listas de resultados ----------

     Debajo del nombre de cada alumno ya se lee "Nº 1139877". De ahí se
     saca el número, así que esto vale igual en el buscador de un
     asunto nuevo y en la pantalla de Personas. */

  function ponerEnResultados(caja) {
    if (!caja) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.resultado'), function (fila) {
      if (fila.querySelector('.boton-nie')) return;
      var pie = fila.querySelector('.resultado-pie');
      if (!pie) return;
      var m = (pie.textContent || '').match(/N[º°o]\s*(\d{5,})/);
      if (!m) return;
      pie.appendChild(boton(m[1], true));
    });
  }

  (function () {
    var comoEra = App.buscarPersonas;
    if (typeof comoEra === 'function') {
      App.buscarPersonas = function () {
        var r = comoEra.apply(this, arguments);
        ponerEnResultados(document.getElementById('lista-personas'));
        return r;
      };
    }
    var comoEra2 = App.buscarTercero;
    if (typeof comoEra2 === 'function') {
      App.buscarTercero = function () {
        var r = comoEra2.apply(this, arguments);
        Promise.resolve(r).then(function () {
          ponerEnResultados(document.getElementById('resultados-tercero'));
        });
        return r;
      };
    }
  })();

  /* ---------- 4. la ficha del alumno, en Personas ---------- */

  (function () {
    var comoEra = App.verFicha;
    if (typeof comoEra !== 'function') return;
    App.verFicha = function (p) {
      var r = comoEra.apply(this, arguments);
      if (!p || p.categoria !== 'ALUMNADO' || !p.id) return r;
      var caja = document.getElementById('ficha-persona');
      if (!caja || caja.querySelector('.boton-nie')) return r;
      var fila = document.createElement('div');
      fila.className = 'fila-nie';
      fila.appendChild(boton(p.id));
      var titulo = caja.querySelector('h4');
      if (titulo && titulo.nextSibling) caja.insertBefore(fila, titulo.nextSibling);
      else caja.insertBefore(fila, caja.firstChild);
      return r;
    };
  })();

})();
