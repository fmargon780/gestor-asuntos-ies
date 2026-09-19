/* ============================================================
   contacto-migracion.js — "Guardar el contacto de los asuntos abiertos".

   19-sep-2026, fila 66 de la cola (docs/CONTACTO-GUARDADO-EN-LA-
   FICHA.md, 2.3). Los asuntos de hoy no traen `ficha.contacto`: solo
   lo llevan los que se crean desde ahora (js/asuntos-nuevo.js). Este
   botón, en Ajustes → Mantenimiento, recorre los asuntos abiertos que
   todavía no tienen esa foto, busca a cada tercero en el CSV de hoy y
   se la rellena.

   **Hay que pulsarlo antes de que acabe este curso**: después de
   septiembre de 2027 ya no habrá de dónde sacarlo para quien se haya
   ido del centro.

   Sigue el mismo patrón que js/ficha-archivo.js (fila 64): un número
   barato al pintar la pestaña, sin tocar disco, y el trabajo de
   verdad solo al desplegar el bloque o pulsar el botón.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* Sin ningún acceso a disco: solo el registro que ya está en
     memoria. */
  function abiertosSinContacto() {
    var asuntos = App.E.registro.asuntos || {};
    return Object.keys(asuntos).filter(function (k) {
      var f = asuntos[k];
      return f.estado === 'abierto' && !f.contacto && f.categoria && f.tercero;
    });
  }

  /* Busca al tercero de un asunto en el CSV de hoy y le rellena la
     foto. true si lo ha encontrado y guardado, false si no. Se relee
     el registro justo antes de guardar (App.guardarRegistroFresco),
     así que no pisa lo que el compañero guarde mientras tanto, y si
     alguien le puso ya una foto entretanto no se toca. */
  async function rellenarUno(clave) {
    var ficha = App.E.registro.asuntos[clave];
    if (!ficha || !App.E.datos) return false;
    try {
      var fuente = await Datos.cargar(App.E.datos, ficha.categoria);
      var encontrados = Datos.buscar(fuente.lista, ficha.tercero, 1);
      if (!encontrados.length) return false;
      var contacto = Datos.fotoDeContacto(encontrados[0], ficha.categoria);
      await App.guardarRegistroFresco(function (registro) {
        var actual = registro.asuntos[clave];
        if (actual && !actual.contacto) actual.contacto = contacto;
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /* onProgreso(hechos, total) se llama después de cada uno. Devuelve
     { rellenados, sinEncontrar[] }. */
  async function rellenarTodos(onProgreso) {
    var claves = abiertosSinContacto();
    var rellenados = 0, sinEncontrar = [];
    for (var i = 0; i < claves.length; i++) {
      var ok = await rellenarUno(claves[i]);
      if (ok) rellenados++; else sinEncontrar.push(claves[i]);
      if (onProgreso) onProgreso(i + 1, claves.length);
    }
    return { rellenados: rellenados, sinEncontrar: sinEncontrar };
  }

  /* ---------- el bloque de Ajustes → Mantenimiento ---------- */

  function bloqueDeAjustes() {
    var ya = $('bloque-contacto-migracion');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-contacto-migracion';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Guardar el contacto de los asuntos abiertos</span>' +
        '<span class="bloque-pie" id="contacto-migracion-pie"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Guarda en cada asunto abierto una foto pequeña del contacto de su ' +
        'tercero (teléfonos, correos, tutores legales), sacada del CSV de hoy. Si esa persona ' +
        'deja de estar en el fichero el curso que viene, la ficha seguirá enseñando estos datos, ' +
        'avisando de que son una foto guardada y no de hoy.</p>' +
        '<div id="contacto-migracion-cuerpo" class="explica">Comprobando…</div>' +
      '</div>';
    pantalla.appendChild(d);
    d.addEventListener('toggle', function () {
      if (d.open) pintarCuerpo();
    });
    return d;
  }

  async function pintarCuerpo() {
    var cuerpo = $('contacto-migracion-cuerpo');
    if (!cuerpo) return;
    var claves = abiertosSinContacto();
    cuerpo.className = '';
    cuerpo.innerHTML = '';
    if (!claves.length) {
      cuerpo.innerHTML = '<div class="vacio">Todos los asuntos abiertos ya tienen guardado el contacto.</div>';
      return;
    }

    var boton = document.createElement('button');
    boton.className = 'boton';
    boton.textContent = 'Guardar el contacto de ' + claves.length +
      (claves.length === 1 ? ' asunto' : ' asuntos');
    var progreso = document.createElement('div');
    progreso.className = 'explica oculto';

    boton.onclick = async function () {
      var ok = await U.preguntar('Guardar el contacto de los asuntos abiertos',
        '<p>Se va a buscar en el CSV de hoy al tercero de ' + claves.length +
        (claves.length === 1 ? ' asunto abierto' : ' asuntos abiertos') +
        ' y guardarle una foto de su contacto.</p>', 'Adelante');
      if (!ok) return;
      await U.mientrasGuarda(boton, async function () {
        progreso.classList.remove('oculto');
        var resultado = await rellenarTodos(function (hechos, total) {
          progreso.textContent = 'Guardando… ' + hechos + ' de ' + total;
        });
        var mensaje = resultado.rellenados +
          (resultado.rellenados === 1 ? ' asunto rellenado.' : ' asuntos rellenados.');
        if (resultado.sinEncontrar.length) {
          mensaje += ' ' + resultado.sinEncontrar.length + ' sin encontrar en el CSV, sin tocar.';
        }
        U.aviso(mensaje, 'bueno');
        App.pintarContactoGuardado();
      });
    };

    cuerpo.appendChild(boton);
    cuerpo.appendChild(progreso);
  }

  /* Se llama al pintar Ajustes → Mantenimiento. */
  App.pintarContactoGuardado = async function () {
    var bloque = bloqueDeAjustes();
    var n = abiertosSinContacto().length;
    var pie = $('contacto-migracion-pie');
    if (pie) pie.textContent = n
      ? n + (n === 1 ? ' asunto sin guardar' : ' asuntos sin guardar')
      : 'Ya está todo guardado';
    if (bloque && bloque.open) await pintarCuerpo();
  };

  window.ContactoMigracion = {
    /* para las pruebas */
    _abiertosSinContacto: abiertosSinContacto,
    _rellenarTodos: rellenarTodos
  };
})();
