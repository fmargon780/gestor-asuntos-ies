/* ============================================================
   ficha-contacto.js — el contacto del tercero y sus otros asuntos,
   dentro de la ficha de un asunto (17-sep-2026, fila 26).

   Sacado de js/ficha-asunto.js el día en que ese fichero perdió el
   pintado de la guía (js/hitos-panel.js pasa a llevárselo entero) y
   se aprovechó para partirlo, tal y como pedía docs/HITOS-SON-LA-GUIA.md
   (pasaba de 1.100 líneas). No cambia nada de cómo se ve ni de cómo
   se busca: es el mismo código, solo que en su propio fichero.

   Expone window.FichaContacto = { pintarContacto, pintarOtros }, que
   js/ficha-asunto.js llama desde su propio pintar(), dándole el hueco
   ya montado en el HTML (#ficha-contacto-caja y #ficha-otros).

   Se carga después de js/ficha-asunto.js.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function filas(lista) {
    var buenas = lista.filter(function (f) { return f && f.valor; });
    if (!buenas.length) return '<p class="explica">Nada que enseñar aquí.</p>';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- el contacto del tercero ----------

     Se busca en el mismo fichero de datos que usa la pantalla de
     Personas. El nombre del tercero lleva pegado el número de
     identificación, así que si no aparece a la primera se prueba sin
     él. */

  /* La ficha del alumnado trae muchas filas, y ocupaba media pantalla.
     Aquí se enseña pequeña: el nombre y un par de datos de contacto.
     Al pulsarla se abre entera. */
  function contactoPlegado(persona, lista) {
    var buenas = lista.filter(function (f) { return f && f.valor; });
    var resumen = buenas.filter(function (f) {
      return /tel|m[oó]vil|correo|email/i.test(f.titulo);
    }).slice(0, 2);
    if (!resumen.length) resumen = buenas.slice(0, 2);

    return '<details class="ficha-bloque ficha-plegable">' +
             '<summary>' +
               '<span class="ficha-titulo">Contacto del tercero</span>' +
               '<span class="ficha-resumen">' + U.escapar(persona.nombre) +
                 (resumen.length
                   ? ' · ' + U.escapar(resumen.map(function (f) { return f.valor; }).join(' · '))
                   : '') +
               '</span>' +
             '</summary>' +
             '<div class="ficha-plegable-cuerpo">' + filas(buenas) + '</div>' +
           '</details>';
  }

  function contactoSuelto(texto) {
    return '<section class="ficha-bloque">' +
             '<h3 class="ficha-titulo">Contacto del tercero</h3>' +
             '<p class="explica">' + U.escapar(texto) + '</p>' +
           '</section>';
  }

  async function pintarContacto(a) {
    var caja = $('ficha-contacto-caja');
    if (!caja) return;
    caja.innerHTML = contactoSuelto('Buscando…');
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    /* Si la carpeta la creó la aplicación, el tercero está en su ficha.
       Si se creó a mano, se saca del propio nombre: es lo que queda
       después del tipo. */
    var quien = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';

    if (!categoria || !quien || !App.E.datos) {
      caja.innerHTML = contactoSuelto('Este asunto no dice a qué tercero pertenece.');
      return;
    }

    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var encontrados = Datos.buscar(fuente.lista, quien, 1);
      /* El nombre suele llevar pegado el número de identificación o el
         NIF, y a veces el año académico. Si así no aparece, se prueba
         quitando lo de detrás. */
      if (!encontrados.length) {
        encontrados = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      }
      if (!encontrados.length) {
        var corto = quien.replace(/\b\d{2}-\d{2}\b/, '').replace(/\s+\S*\d\S*\s*$/, '').trim();
        if (corto) encontrados = Datos.buscar(fuente.lista, corto, 1);
      }
      if (!encontrados.length) {
        caja.innerHTML = contactoSuelto(quien + ' no aparece en el fichero de ' + categoria + '.');
        return;
      }

      var persona = encontrados[0];
      var lista;
      if (categoria === 'ALUMNADO') lista = Datos.destacadosAlumno(persona).destacados;
      else if (categoria === 'PERSONAL') lista = Datos.destacadosPersona(persona).destacados;
      else {
        lista = Object.keys(persona.campos || {}).slice(0, 8).map(function (c) {
          return { titulo: c, valor: persona.campos[c] };
        });
      }
      caja.innerHTML = contactoPlegado(persona, lista);
    } catch (e) {
      caja.innerHTML = contactoSuelto('No he podido leer el fichero de datos: ' + e.message);
    }
  }

  /* ---------- los otros asuntos del mismo tercero ----------

     Para ver de un vistazo si esto ya se gestionó. Los del mismo tipo
     van marcados, que son los que de verdad pueden estar repetidos.
     La búsqueda la hace duplicados.js. */

  function nombreDelTercero(a) {
    var f = a.ficha || {};
    if (f.tercero) return f.tercero;
    if (a.leido && a.leido.resto) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  function listaDeOtros(titulo, nombres, tipo) {
    if (!nombres.length) return '';
    return '<div class="otros-grupo"><div class="otros-rotulo">' + U.escapar(titulo) + '</div>' +
      nombres.slice(0, 12).map(function (n) {
        var igual = tipo && window.Duplicados &&
                    U.normalizar(window.Duplicados.tipoDeNombre(n)) === U.normalizar(tipo);
        return '<div class="otros-asunto' + (igual ? ' otros-mismo-tipo' : '') + '">' +
               U.escapar(n) + '</div>';
      }).join('') +
      (nombres.length > 12 ? '<p class="nota">Y ' + (nombres.length - 12) + ' más.</p>' : '') +
      '</div>';
  }

  async function pintarOtrosDelTercero(a) {
    var caja = $('ficha-otros');
    if (!caja) return;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = nombreDelTercero(a);

    if (!window.Duplicados || !categoria || !quien) {
      caja.className = 'explica';
      caja.textContent = 'No se sabe de qué tercero es este asunto, así que no se puede buscar.';
      return;
    }

    try {
      var todo = await window.Duplicados.delTercero(categoria, quien);
      var fuera = function (n) { return n !== a.nombre; };
      var abiertos = todo.abiertos.filter(fuera);
      var archivados = todo.archivados.filter(fuera);

      if (!abiertos.length && !archivados.length) {
        caja.className = 'explica';
        caja.textContent = 'Es el único asunto de ' + quien + '.';
        return;
      }
      caja.className = 'otros-lista';
      caja.innerHTML = listaDeOtros('Abiertos', abiertos, tipoDe(a)) +
                       listaDeOtros('En el archivo', archivados, tipoDe(a));
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido mirar el archivo: ' + e.message;
    }
  }

  window.FichaContacto = {
    pintarContacto: pintarContacto,
    pintarOtros: pintarOtrosDelTercero
  };

})();
