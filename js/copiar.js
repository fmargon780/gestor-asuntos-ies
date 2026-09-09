/* ============================================================
   copiar.js — los botones de copiar de un clic.

   Dos datos se pegan todo el día fuera de la aplicación, y los dos
   estaban obligando a seleccionar a mano con el ratón:

     - El Nº de identificación escolar del alumnado, que es lo que se
       escribe en el buscador de Séneca.
     - El nombre de un documento sin su extensión, para pegarlo en el
       registro o en un correo.

   Aquí se ponen los botones que los copian. Cada uno avisa con un
   "Copiado" en el propio botón, para no dudar de si ha funcionado.

   Este fichero se carga el último a propósito: envuelve las funciones
   que pintan, así que sus botones se ponen después de que las demás
   piezas hayan terminado con la tarjeta.
   ============================================================ */
(function () {

  /* ==========================================================
     COPIAR, Y EL BOTÓN DE COPIAR
     ========================================================== */

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

  function boton(opciones) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton ' + (opciones.clase || '');
    b.textContent = opciones.etiqueta;
    b.title = opciones.ayuda || '';
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      copiar(opciones.texto).then(function (ok) {
        if (!ok) { U.aviso('No he podido copiarlo. Es ' + opciones.texto + '.', 'malo'); return; }
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

  function botonDeNie(nie, pequeno) {
    return boton({
      etiqueta: 'Nº ' + nie,
      texto: nie,
      ayuda: 'Copiar ' + nie + ', el Nº de identificación escolar, para pegarlo en Séneca',
      clase: 'boton-nie' + (pequeno ? ' boton-nie-chico' : '')
    });
  }

  /* ==========================================================
     EL Nº DE IDENTIFICACIÓN ESCOLAR
     ========================================================== */

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

  /* ---------- 1. la tarjeta de cada asunto ---------- */

  (function () {
    var comoEra = App.tarjetaAsunto;
    App.tarjetaAsunto = function (a, modo) {
      var div = comoEra(a, modo);
      var nie = nieDeAsunto(a);
      var acciones = div.querySelector('.acciones');
      if (nie && acciones && !acciones.querySelector('.boton-nie')) {
        acciones.insertBefore(botonDeNie(nie), acciones.firstChild);
      }
      return div;
    };
  })();

  /* ---------- 2. la ficha del asunto ----------

     La ficha se repinta ella sola cada vez que se cambia el estado, el
     plazo o la vía, y en ese repintado se lleva por delante el botón.
     Por eso se vigila la pantalla y se vuelve a poner. Lo mismo vale
     para los botones de los documentos, que llegan más tarde, cuando
     se termina de leer la carpeta. */

  (function () {
    var comoEra = App.abrirFicha;
    if (typeof comoEra !== 'function') return;
    var viendo = null;

    App.abrirFicha = function (a, modo) {
      viendo = a;
      comoEra(a, modo);
      repasar();
    };

    function ponerNie() {
      if (!viendo) return;
      var caja = document.getElementById('ficha-acciones');
      if (!caja || caja.querySelector('.boton-nie')) return;
      var nie = nieDeAsunto(viendo);
      if (!nie) return;
      caja.insertBefore(botonDeNie(nie), caja.firstChild);
    }

    function repasar() {
      ponerNie();
      ponerEnDocumentos();
    }

    var pantalla = document.getElementById('pantalla-asunto');
    if (pantalla && window.MutationObserver) {
      new MutationObserver(function () { repasar(); })
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
      pie.appendChild(botonDeNie(m[1], true));
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
      fila.appendChild(botonDeNie(p.id));
      var titulo = caja.querySelector('h4');
      if (titulo && titulo.nextSibling) caja.insertBefore(fila, titulo.nextSibling);
      else caja.insertBefore(fila, caja.firstChild);
      return r;
    };
  })();

  /* ==========================================================
     EL NOMBRE DEL DOCUMENTO, SIN LA EXTENSIÓN

     En la lista de documentos de la ficha del asunto, cada documento
     es un botón que lo abre. Al lado se le pone otro que copia su
     nombre. Se copia sin el .pdf del final, que es como se pega en el
     registro o en el asunto de un correo.
     ========================================================== */

  function sinExtension(nombre) {
    return String(nombre || '').replace(/\.[A-Za-z0-9]{1,8}$/, '').trim();
  }

  function ponerEnDocumentos() {
    var caja = document.getElementById('ficha-documentos');
    if (!caja) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.ficha-documento'), function (b) {
      if (b.getAttribute('data-con-copiar')) return;
      b.setAttribute('data-con-copiar', '1');

      /* El botón del documento lleva dentro la extensión en un recuadro
         y el nombre en otro. El nombre es el último. */
      var trozos = b.querySelectorAll('span');
      var nombre = trozos.length ? trozos[trozos.length - 1].textContent : b.textContent;
      var limpio = sinExtension(nombre);
      if (!limpio) return;

      /* Los documentos van en columna, uno debajo de otro. Cada uno se
         mete en una fila para que su botón de copiar quede al lado y no
         debajo. */
      var fila = document.createElement('div');
      fila.style.cssText = 'display:flex;gap:6px;align-items:stretch';
      b.parentNode.insertBefore(fila, b);
      fila.appendChild(b);
      b.style.flex = '1';
      b.style.minWidth = '0';

      fila.appendChild(boton({
        etiqueta: 'Copiar',
        texto: limpio,
        ayuda: 'Copiar el nombre del documento, sin la extensión',
        clase: 'boton-copiar-nombre'
      }));
    });
  }

})();
