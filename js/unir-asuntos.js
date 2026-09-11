/* ============================================================
   unir-asuntos.js — unir dos asuntos duplicados que ya existen.

   js/duplicados.js para la creación de un asunto nuevo: si dos
   carpetas del mismo tercero, tipo y año académico ya existen porque
   se crearon antes de que hubiera parada al crear (o porque se
   crearon a mano), aquí se ofrece unirlas.

   En la pantalla de asuntos abiertos, cuando dos o más asuntos
   coinciden en tercero, tipo y año académico, sale una franja encima
   de la lista: "Parecen el mismo asunto", con sus nombres y un botón
   Unir. El grupo y el texto libre no cuentan para esto, igual que en
   la parada al crear.

   Cargado justo después de js/asuntos-lista.js, que es quien define
   App.pintarAbiertos: aquí se envuelve, igual que hacen otros catorce
   módulos de la aplicación con otras funciones de App.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- quién es cada asunto, para agrupar ---------- */

  function terceroDe(a) {
    if (a.ficha && a.ficha.tercero) return a.ficha.tercero;
    if (a.leido && a.leido.resto && window.Nombres) return Nombres.terceroDeResto(a.leido.resto);
    return '';
  }

  function tipoDe(a) {
    if (App.tipoDeAsunto) return App.tipoDeAsunto(a);
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function cursoDe(a) {
    return window.Duplicados ? window.Duplicados.cursoDe(a.nombre) : '';
  }

  /* La clave por la que se agrupa. Sin tercero o sin tipo no hay nada
     fiable que comparar, así que esos asuntos no entran en ningún
     grupo. */
  function claveDe(a) {
    var tercero = U.normalizar(terceroDe(a));
    var tipo = U.normalizar(tipoDe(a));
    if (!tercero || !tipo) return '';
    return tercero + '|' + tipo + '|' + U.normalizar(cursoDe(a));
  }

  function gruposDuplicados() {
    var por = {};
    (App.E.listaAbiertos || []).forEach(function (a) {
      var k = claveDe(a);
      if (!k) return;
      (por[k] = por[k] || []).push(a);
    });
    return Object.keys(por).map(function (k) { return por[k]; })
      .filter(function (g) { return g.length > 1; });
  }

  /* ---------- la franja, encima de la lista ---------- */

  function cajaDeFranjas() {
    var caja = $('franja-unir');
    if (caja) return caja;
    var zona = $('zona-asuntos');
    var lista = $('lista-abiertos');
    if (!zona || !lista) return null;
    caja = document.createElement('div');
    caja.id = 'franja-unir';
    caja.className = 'oculto';
    zona.insertBefore(caja, lista);
    return caja;
  }

  function pintarFranjas() {
    var caja = cajaDeFranjas();
    if (!caja) return;

    /* En "Por clasificar" no hay asuntos, solo papeles sueltos. */
    var grupos = (App.E.vista === 'clasificar') ? [] : gruposDuplicados();

    caja.innerHTML = '';
    if (!grupos.length) {
      caja.className = 'oculto';
      return;
    }
    caja.className = '';

    grupos.forEach(function (g) {
      var fila = document.createElement('div');
      fila.className = 'aviso aviso-ambar franja-unir-fila';
      fila.innerHTML = '<strong>Parecen el mismo asunto.</strong>' +
        '<ul class="lista-repetidos">' +
          g.map(function (a) { return '<li>' + U.escapar(a.nombre) + '</li>'; }).join('') +
        '</ul>';
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton boton-principal';
      boton.textContent = 'Unir';
      boton.onclick = function () { unirAsuntos(g); };
      fila.appendChild(boton);
      caja.appendChild(fila);
    });
  }

  (function () {
    if (typeof App.pintarAbiertos !== 'function') return;
    var comoEra = App.pintarAbiertos;
    App.pintarAbiertos = function () {
      comoEra();
      try { pintarFranjas(); } catch (e) { /* la franja nunca estorba */ }
    };
  })();

  /* ---------- unir ---------- */

  function porNombreLargo(a, b) { return b.nombre.length - a.nombre.length; }

  /* Devuelve el asunto que se queda, o null si se cancela. De partida,
     el de nombre más largo: suele ser el más completo. */
  async function elegirQuienSeQueda(grupo) {
    var ordenado = grupo.slice().sort(porNombreLargo);
    var opciones = ordenado.map(function (a, i) {
      return '<label class="dup-opcion"><input type="radio" name="unir-cual" value="' + i + '"' +
             (i === 0 ? ' checked' : '') + '> ' + U.escapar(a.nombre) + '</label>';
    }).join('');
    var ok = await U.preguntar('¿Cuál se queda?',
      '<p class="explica">Los documentos y las notas del otro pasan a este, y el otro ' +
      'se borra. Nada se pierde: solo queda una carpeta en vez de dos.</p>' + opciones,
      'Unir');
    if (!ok) return null;
    var marcado = document.querySelector('input[name="unir-cual"]:checked');
    var indice = marcado ? parseInt(marcado.value, 10) : 0;
    return ordenado[indice] || ordenado[0];
  }

  /* Los nombres de fichero que hay en las dos carpetas a la vez. Si
     hay alguno, no se mueve ni se borra nada: se para todo antes de
     tocar el primer fichero. */
  async function nombresQueChocan(seQueda, seVa) {
    var deQueda = (await Carpetas.ficheros(seQueda.handle)).map(function (f) { return f.nombre; });
    var deVa = (await Carpetas.ficheros(seVa.handle)).map(function (f) { return f.nombre; });
    return deVa.filter(function (n) { return deQueda.indexOf(n) !== -1; });
  }

  function fechaDeHoy() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  /* Las notas de los dos, en su orden; los pasos de la guía, del que
     se queda si ya tenía, y si no, los del que se va. Se relee el
     registro justo antes de escribir, como todo lo que toca
     asuntos.json. */
  async function fusionarFicha(seQueda, seVa, fechaTexto) {
    await App.cargarRegistro();
    var fichaQueda = App.E.registro.asuntos[seQueda.nombre] || {};
    var fichaVa = App.E.registro.asuntos[seVa.nombre] || {};

    var notas = (Array.isArray(fichaQueda.notas) ? fichaQueda.notas.slice() : [])
      .concat(Array.isArray(fichaVa.notas) ? fichaVa.notas.slice() : [])
      .sort(function (x, y) { return String(x.cuando || '').localeCompare(String(y.cuando || '')); });

    var pasosHechos = (fichaQueda.pasosHechos && fichaQueda.pasosHechos.length)
      ? fichaQueda.pasosHechos : (fichaVa.pasosHechos || []);
    var pasosElegidos = (fichaQueda.pasosElegidos && Object.keys(fichaQueda.pasosElegidos).length)
      ? fichaQueda.pasosElegidos : (fichaVa.pasosElegidos || {});

    notas.push({
      texto: 'Unido con la carpeta «' + seVa.nombre + '» el ' + fechaTexto,
      quien: App.E.usuario || '',
      cuando: U.ahora()
    });

    App.E.registro.asuntos[seQueda.nombre] = Object.assign({}, fichaQueda, {
      notas: notas, pasosHechos: pasosHechos, pasosElegidos: pasosElegidos
    });
    delete App.E.registro.asuntos[seVa.nombre];

    await Copias.guardar(App.E.gestor, App.FICHERO_ASUNTOS, App.E.registro);
  }

  async function unirAsuntos(grupo) {
    var seQueda = await elegirQuienSeQueda(grupo);
    if (!seQueda) return;
    var demas = grupo.filter(function (a) { return a.nombre !== seQueda.nombre; });

    try {
      /* Nada a medias: si algún fichero choca con cualquiera de los
         demás, se para todo antes de mover el primero. */
      for (var i = 0; i < demas.length; i++) {
        var chocan = await nombresQueChocan(seQueda, demas[i]);
        if (chocan.length) {
          await U.preguntar('No se puede unir todavía',
            '<p>Hay ficheros con el mismo nombre en ' + U.escapar(demas[i].nombre) +
            ' y en ' + U.escapar(seQueda.nombre) + ':</p>' +
            '<ul class="lista-repetidos">' +
              chocan.map(function (n) { return '<li>' + U.escapar(n) + '</li>'; }).join('') +
            '</ul>' +
            '<p class="nota">Cambia el nombre de alguno desde "Gestionar documentos" y ' +
            'vuelve a intentarlo. No se ha movido ni borrado nada.</p>',
            'Entendido', true);
          return;
        }
      }

      var fechaTexto = fechaDeHoy();
      for (var j = 0; j < demas.length; j++) {
        var seVa = demas[j];
        var ficheros = await Carpetas.ficheros(seVa.handle);
        for (var k = 0; k < ficheros.length; k++) {
          await Carpetas.moverFichero(seVa.handle, ficheros[k].nombre, seQueda.handle);
        }
        await fusionarFicha(seQueda, seVa, fechaTexto);
        await App.E.abiertos.removeEntry(seVa.nombre);
      }

      U.aviso('Asuntos unidos.', 'bueno');
      await App.verAbiertos();
    } catch (e) {
      U.aviso('No he podido unirlos: ' + e.message, 'malo');
    }
  }

})();
