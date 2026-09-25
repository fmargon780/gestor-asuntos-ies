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

  /* La copia a secas, sin botón: la usa js/ficha-nombre-acciones.js
     (`Copiar.copiar`), que se encarga ella sola del aviso y del botón.
     Por eso lleva `sinAviso`: si avisara aquí también, saldrían dos
     avisos con el fallo. */
  function copiar(texto) {
    return U.copiar(texto, null, { sinAviso: true });
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
      U.copiar(opciones.texto, b, { avisoFallo: 'No he podido copiarlo. Es ' + opciones.texto + '.' });
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

  U.envolver(App, 'App.tarjetaAsunto', 'copiar.js', function (comoEra) {
    return function (a, modo) {
      var div = comoEra(a, modo);
      var nie = nieDeAsunto(a);
      var acciones = div.querySelector('.acciones');
      if (nie && acciones && !acciones.querySelector('.boton-nie')) {
        acciones.insertBefore(botonDeNie(nie), acciones.firstChild);
      }
      return div;
    };
  });

  /* ---------- 2. la ficha del asunto ----------

     Desde la fila 168 (docs/DOCUMENTOS-EN-UN-SOLO-SITIO.md) el botón ⧉
     que copia el nombre de un documento lo pinta la propia fila, en
     js/ficha-documentos.js: aquí ya no se vigila la ficha. */

  /* ---------- 3. las listas de resultados ----------

     Cada fila trae el número en su `data-nie`, que se lo ponen
     js/asuntos-nuevo.js y js/archivo-personas.js. Así el número se
     escribe una sola vez, en el botón, y no dos.

     Si un día una fila llegara sin `data-nie`, se busca en el texto de
     debajo del nombre, que es como se hacía antes. */

  function nieDeLaFila(fila) {
    var puesto = fila.dataset ? String(fila.dataset.nie || '').trim() : '';
    if (/^\d{5,}$/.test(puesto)) return puesto;
    var pie = fila.querySelector('.resultado-pie');
    var m = pie && (pie.textContent || '').match(/N[º°o]\s*(\d{5,})/);
    return m ? m[1] : '';
  }

  function ponerEnResultados(caja) {
    if (!caja) return;
    Array.prototype.forEach.call(caja.querySelectorAll('.resultado'), function (fila) {
      if (fila.querySelector('.boton-nie')) return;
      var pie = fila.querySelector('.resultado-pie');
      if (!pie) return;
      var nie = nieDeLaFila(fila);
      if (!nie) return;
      pie.appendChild(botonDeNie(nie, true));
    });
  }

  U.envolver(App, 'App.buscarPersonas', 'copiar.js', function (comoEra) {
    return function () {
      var r = comoEra.apply(this, arguments);
      ponerEnResultados(document.getElementById('lista-personas'));
      return r;
    };
  });
  U.envolver(App, 'App.buscarTercero', 'copiar.js', function (comoEra) {
    return function () {
      var r = comoEra.apply(this, arguments);
      Promise.resolve(r).then(function () {
        ponerEnResultados(document.getElementById('resultados-tercero'));
      });
      return r;
    };
  });

  /* ---------- 4. la ficha del alumno, en Personas ---------- */

  U.envolver(App, 'App.verFicha', 'copiar.js', function (comoEra) {
    return function (p) {
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
  });

  /* Expuesto para js/ficha-nombre-acciones.js (18-sep-2026, fila 58,
     docs/AJUSTES-DE-USO-2026-09-18.md, 1): la fila de botones de copiar
     de un gesto reutiliza `boton()` (el mismo copiado con aviso "Copiado"
     de aquí), `nieDeAsunto()` (el número, sacado del nombre de la
     carpeta, sin tener que leer el fichero de datos) y `categoriaDe()`
     (para saber sin esperar a ningún fichero si el botón del documento
     se llama DNI o CIF). `copiar()`, el copiado a secas, la usa esa
     misma fila para los dos botones que solo se pueden rellenar del
     todo cuando responde el fichero de datos. */
  window.Copiar = { boton: boton, nieDeAsunto: nieDeAsunto, categoriaDe: categoriaDe, copiar: copiar };

})();
