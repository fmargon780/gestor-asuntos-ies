/* ============================================================
   unir-asuntos.js — unir dos asuntos duplicados que ya existen.

   js/duplicados.js se ocupa de la creación de un asunto nuevo: si dos
   carpetas del mismo tercero, tipo y año académico ya existen porque
   se crearon antes de que hubiera parada al crear (o porque se
   crearon a mano), aquí se ofrece unirlas.

   Hasta el 11-sep-2026 esto salía como una franja amarilla encima de
   la lista de asuntos abiertos, una por cada grupo. Con pocos casos
   iba bien, pero con muchos se comía la pantalla antes de ver ni un
   asunto. Ahora los duplicados tienen su propia pantalla:

   - En la cabecera de "Asuntos abiertos", junto al botón "Tablón",
     sale un aviso de una sola línea ("3 posibles duplicados —
     Revisar") si hay alguno; si no hay ninguno, no sale nada.
   - Al pulsarlo se entra en la pantalla "Duplicados" (no está en el
     menú de la izquierda: solo se llega desde ese aviso). Cada grupo
     se ve en columnas, una por asunto, con su nombre (enlaza a su
     ficha), su fecha de apertura, estado, vía y plazo, sus documentos
     (se abren en el visor de siempre) y sus últimas notas.
   - "Unir" hace exactamente lo mismo que hacía el botón de la franja:
     esa lógica no se ha tocado.
   - "No son el mismo" descarta ESE grupo para siempre (o hasta que se
     diga lo contrario): se guarda en _GESTOR/no-duplicados.json, un
     fichero compartido más, con copia de seguridad como los demás.
     Se guarda por la firma exacta del grupo (los nombres de sus
     carpetas, ordenados): si más adelante se crea un tercer asunto
     que encaje en el mismo tercero+tipo+curso, el grupo cambia de
     firma y vuelve a avisar, porque ya no es el mismo grupo que se
     descartó.
   - Los grupos descartados se pueden volver a avisar desde Ajustes,
     en el bloque "Duplicados descartados" que pone este mismo fichero
     (sin tocar js/ajustes.js): "Volver a avisar" por cada uno.

   Cargado justo después de js/asuntos-lista.js, que es quien define
   App.pintarAbiertos: aquí se envuelve, igual que hacen otros módulos
   de la aplicación con otras funciones de App. La pantalla y el
   bloque de Ajustes los crea este fichero por su cuenta, así que
   index.html no necesita más marcado que el enlace a
   css/unir-asuntos.css y el propio <script>.
   ============================================================ */
(function () {

  var FICHERO_DESCARTES = 'no-duplicados.json';
  var SEPARADOR_FIRMA = '';

  function $(id) { return document.getElementById(id); }

  /* ---------- quién es cada asunto, para agrupar ----------

     Igual que antes de este cambio: sin tercero o sin tipo no hay
     nada fiable que comparar, así que esos asuntos no entran en
     ningún grupo. */

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

  function claveDe(a) {
    var tercero = U.normalizar(terceroDe(a));
    var tipo = U.normalizar(tipoDe(a));
    if (!tercero || !tipo) return '';
    return tercero + '|' + tipo + '|' + U.normalizar(cursoDe(a));
  }

  function todosLosGrupos() {
    var por = {};
    (App.E.listaAbiertos || []).forEach(function (a) {
      var k = claveDe(a);
      if (!k) return;
      (por[k] = por[k] || []).push(a);
    });
    return Object.keys(por).map(function (k) { return por[k]; })
      .filter(function (g) { return g.length > 1; });
  }

  /* La firma de un grupo: los nombres de sus carpetas, ordenados y
     unidos. Si el grupo gana o pierde un miembro, la firma cambia, y
     un descarte guardado con la firma vieja deja de encajar: por eso
     un grupo descartado vuelve a avisar solo si cambia quién lo forma. */
  function firmaDe(grupo) {
    return grupo.map(function (a) { return a.nombre; }).slice().sort().join(SEPARADOR_FIRMA);
  }

  /* ---------- los descartes: "no son el mismo" ----------

     _GESTOR/no-duplicados.json, un fichero compartido más: se lee al
     entrar y se relee justo antes de escribir, como todo lo que se
     comparte entre los dos ordenadores del centro. */

  var descartes = [];       /* [{ firma, nombres, el, por }] */
  var descartesLeidos = false;

  function normalizarDescartes(leido) {
    var lista = (leido && leido.descartados) || [];
    return lista.filter(function (d) { return d && d.firma && Array.isArray(d.nombres); }).map(function (d) {
      return {
        firma: String(d.firma),
        nombres: d.nombres.map(function (n) { return String(n); }),
        el: String(d.el || ''),
        por: String(d.por || '')
      };
    });
  }

  async function cargarDescartes() {
    if (!App.E.gestor) return;
    try {
      var leido = await Carpetas.leerJson(App.E.gestor, FICHERO_DESCARTES);
      descartes = normalizarDescartes(leido);
    } catch (e) {
      descartes = [];
    }
    descartesLeidos = true;
  }

  async function guardarDescartes(lista) {
    await Copias.guardar(App.E.gestor, FICHERO_DESCARTES, { descartados: lista });
    descartes = lista;
  }

  function estaDescartado(grupo) {
    var firma = firmaDe(grupo);
    return descartes.some(function (d) { return d.firma === firma; });
  }

  /* Se relee el fichero justo antes de escribir: el compañero puede
     haber descartado o devuelto otro grupo desde el otro ordenador
     mientras tanto. */
  async function descartarGrupo(grupo) {
    var firma = firmaDe(grupo);
    await cargarDescartes();
    if (descartes.some(function (d) { return d.firma === firma; })) return;   /* ya estaba */
    var lista = descartes.concat([{
      firma: firma,
      nombres: grupo.map(function (a) { return a.nombre; }).slice().sort(),
      el: U.ahora(),
      por: App.E.usuario || ''
    }]);
    await guardarDescartes(lista);
  }

  async function volverAAvisar(firma) {
    await cargarDescartes();
    var lista = descartes.filter(function (d) { return d.firma !== firma; });
    await guardarDescartes(lista);
  }

  /* Los grupos que de verdad hay que enseñar: los que se parecen y no
     se han descartado. */
  function gruposActivos() {
    return todosLosGrupos().filter(function (g) { return !estaDescartado(g); });
  }

  /* ---------- el aviso de una línea, junto a "Tablón" ---------- */

  var botonAviso = null;

  function cajaDelAviso() {
    if (botonAviso && botonAviso.parentNode) return botonAviso;
    var acciones = document.querySelector('#pantalla-abiertos .cabecera .acciones');
    if (!acciones) return null;
    botonAviso = document.createElement('button');
    botonAviso.type = 'button';
    botonAviso.id = 'btn-duplicados';
    botonAviso.className = 'boton boton-ambar oculto';
    botonAviso.onclick = function () { irADuplicados(); };
    var antesDe = $('btn-tablon') || $('btn-recargar');
    if (antesDe && antesDe.parentNode === acciones) acciones.insertBefore(botonAviso, antesDe);
    else acciones.appendChild(botonAviso);
    return botonAviso;
  }

  function pintarAviso() {
    var b = cajaDelAviso();
    if (!b) return;
    var n = gruposActivos().length;
    if (!n) { b.classList.add('oculto'); return; }
    b.textContent = '⚠ ' + (n === 1 ? '1 posible duplicado' : n + ' posibles duplicados') + ' — Revisar';
    b.classList.remove('oculto');
  }

  (function () {
    if (typeof App.pintarAbiertos !== 'function') return;
    var comoEra = App.pintarAbiertos;
    App.pintarAbiertos = function () {
      comoEra();
      try { pintarAviso(); } catch (e) { /* el aviso nunca estorba */ }
    };
  })();

  /* Al abrir o cerrar sesión, cambiar de asunto, etc. el aviso también
     debe repasarse: se engancha al refresco general de los módulos,
     igual que hacen frescura.js y conflictos.js. */
  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (!descartesLeidos && App.E.gestor) { cargarDescartes().then(pintarAviso); return; }
        try { pintarAviso(); } catch (e) {}
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  /* ---------- la pantalla de Duplicados ----------

     La crea este fichero, dinámicamente: no está en index.html ni en
     el menú de la izquierda. Solo se llega a ella desde el aviso. */

  App.PANTALLAS.push('duplicados');

  var pantallaConstruida = false;

  function construirPantalla() {
    if (pantallaConstruida) return;
    var contenido = document.querySelector('main.contenido');
    if (!contenido) return;
    var seccion = document.createElement('section');
    seccion.id = 'pantalla-duplicados';
    seccion.className = 'pantalla oculto';
    seccion.innerHTML =
      '<header class="cabecera">' +
        '<h2>Posibles duplicados</h2>' +
        '<div class="acciones">' +
          '<button type="button" id="dup-pantalla-volver" class="boton">← Volver a asuntos abiertos</button>' +
        '</div>' +
      '</header>' +
      '<p class="explica">Asuntos que coinciden en tercero, tipo y año académico, y que parece que ' +
      'son la misma gestión repetida por error. El grupo y el texto libre del nombre no cuentan ' +
      'para esta comparación.</p>' +
      '<div id="duplicados-lista"></div>';
    contenido.appendChild(seccion);
    $('dup-pantalla-volver').onclick = function () { App.ir('abiertos'); };
    pantallaConstruida = true;
  }

  /* Se construye ya, al cargar el script: App.ir espera que exista
     #pantalla-<cada nombre de App.PANTALLAS>, así que la sección tiene
     que estar en el DOM desde el principio (oculta), no solo la
     primera vez que se visita. El script se carga con el body ya
     parseado, así que main.contenido ya existe en este punto. */
  construirPantalla();

  function irADuplicados() {
    construirPantalla();
    App.ir('duplicados');
    pintarPantallaDuplicados();
  }

  /* ---------- una columna por asunto, dentro de un grupo ---------- */

  function lineaDatos(a) {
    var f = a.ficha || {};
    var trozos = [];
    if (a.leido && a.leido.fecha) trozos.push('Abierto el ' + U.fechaLegible(a.leido.fecha));
    trozos.push(f.situacion ? f.situacion : 'Sin estado');
    var via = App.textoVia ? App.textoVia(f) : '';
    if (via) trozos.push(via);
    var p = App.plazoDe ? App.plazoDe(a) : null;
    if (p) trozos.push(p.texto);
    return trozos.join('  ·  ');
  }

  function columnaDeAsunto(a) {
    var col = document.createElement('div');
    col.className = 'columna-duplicado';

    var nombre = document.createElement('button');
    nombre.type = 'button';
    nombre.className = 'columna-nombre';
    nombre.textContent = a.nombre;
    nombre.title = 'Abrir la ficha de este asunto';
    nombre.onclick = function () { App.abrirFicha(a, 'abierto'); };
    col.appendChild(nombre);

    var datos = document.createElement('div');
    datos.className = 'columna-datos';
    datos.textContent = lineaDatos(a);
    col.appendChild(datos);

    var rotuloDocs = document.createElement('div');
    rotuloDocs.className = 'columna-rotulo';
    rotuloDocs.textContent = 'Documentos';
    col.appendChild(rotuloDocs);

    var docs = document.createElement('div');
    docs.className = 'columna-documentos';
    docs.textContent = 'Leyendo…';
    col.appendChild(docs);

    Carpetas.ficheros(a.handle).then(function (lista) {
      docs.innerHTML = '';
      if (!lista.length) {
        docs.innerHTML = '<p class="nota">Sin documentos.</p>';
        return;
      }
      lista.forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'columna-documento';
        b.textContent = f.nombre;
        b.onclick = function () { Visor.abrir(f.handle, f.nombre); };
        docs.appendChild(b);
      });
    }).catch(function () { docs.innerHTML = '<p class="nota">No he podido leer la carpeta.</p>'; });

    var rotuloNotas = document.createElement('div');
    rotuloNotas.className = 'columna-rotulo';
    rotuloNotas.textContent = 'Notas';
    col.appendChild(rotuloNotas);

    var notas = document.createElement('div');
    notas.className = 'columna-notas';
    var todas = (window.Notas ? window.Notas.de(a) : []).slice();
    if (!todas.length) {
      notas.innerHTML = '<p class="nota">Sin notas.</p>';
    } else {
      var ultimas = todas.slice(-3).reverse();
      notas.innerHTML = ultimas.map(function (n) {
        return '<div class="columna-nota">' +
          '<div class="columna-nota-cabeza">' +
            (n.quien ? '<span class="nota-quien">' + U.escapar(n.quien) + '</span>' : '') +
            '<span class="nota-cuando">' + U.escapar(window.Notas.cuando(n.cuando)) + '</span>' +
          '</div>' +
          '<div class="columna-nota-texto">' + U.escapar(n.texto) + '</div>' +
        '</div>';
      }).join('');
      if (todas.length > 3) {
        var mas = document.createElement('p');
        mas.className = 'nota';
        mas.textContent = 'y ' + (todas.length - 3) + ' más.';
        notas.appendChild(mas);
      }
    }
    col.appendChild(notas);

    return col;
  }

  /* ---------- un grupo entero, con sus botones ---------- */

  function bloqueDeGrupo(grupo) {
    var d = document.createElement('div');
    d.className = 'grupo-duplicado';

    var cab = document.createElement('div');
    cab.className = 'grupo-duplicado-cabecera';
    cab.innerHTML = '<strong>Parecen el mismo asunto.</strong>';

    var unir = document.createElement('button');
    unir.type = 'button';
    unir.className = 'boton boton-principal';
    unir.textContent = 'Unir';
    unir.onclick = function () { unirAsuntos(grupo); };
    cab.appendChild(unir);

    var noSon = document.createElement('button');
    noSon.type = 'button';
    noSon.className = 'boton';
    noSon.textContent = 'No son el mismo';
    noSon.title = 'No volver a avisar de este grupo';
    noSon.onclick = async function () {
      noSon.disabled = true;
      try {
        await descartarGrupo(grupo);
        U.aviso('No se volverá a avisar de este grupo. Puedes deshacerlo en Ajustes, ' +
          '"Duplicados descartados".', 'bueno');
        pintarPantallaDuplicados();
        pintarAviso();
      } catch (e) {
        noSon.disabled = false;
        U.aviso('No he podido descartarlo: ' + e.message, 'malo');
      }
    };
    cab.appendChild(noSon);

    d.appendChild(cab);

    var columnas = document.createElement('div');
    columnas.className = 'grupo-columnas';
    grupo.forEach(function (a) { columnas.appendChild(columnaDeAsunto(a)); });
    d.appendChild(columnas);

    return d;
  }

  function pintarPantallaDuplicados() {
    var caja = $('duplicados-lista');
    if (!caja) return;
    var grupos = gruposActivos();
    caja.innerHTML = '';
    if (!grupos.length) {
      caja.innerHTML = '<div class="vacio">No hay ningún posible duplicado ahora mismo.</div>';
      return;
    }
    grupos.forEach(function (g) { caja.appendChild(bloqueDeGrupo(g)); });
  }

  /* ---------- unir: la misma lógica de siempre, sin tocar ---------- */

  function porNombreLargo(a, b) { return b.nombre.length - a.nombre.length; }

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

  async function fusionarFicha(seQueda, seVa, fechaTexto) {
    await App.guardarRegistroFresco(function (registro) {
      var fichaQueda = registro.asuntos[seQueda.nombre] || {};
      var fichaVa = registro.asuntos[seVa.nombre] || {};

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

      registro.asuntos[seQueda.nombre] = Object.assign({}, fichaQueda, {
        notas: notas, pasosHechos: pasosHechos, pasosElegidos: pasosElegidos
      });
      delete registro.asuntos[seVa.nombre];
    });
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
      /* Si se ha unido desde la pantalla de Duplicados, se sigue
         viendo esa pantalla con la lista al día: no se saca a nadie
         de donde estaba mirando. */
      if (pantallaConstruida && !$('pantalla-duplicados').classList.contains('oculto')) {
        pintarPantallaDuplicados();
      }
    } catch (e) {
      U.aviso('No he podido unirlos: ' + e.message, 'malo');
    }
  }

  /* ---------- el bloque de Ajustes: "Duplicados descartados" ----------

     Lo crea este mismo módulo, enganchado al refresco general de la
     aplicación (igual que frescura.js y conflictos.js), sin tocar
     js/ajustes.js. */

  function bloqueDeAjustes() {
    var ya = $('bloque-duplicados-descartados');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-duplicados-descartados';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Duplicados descartados</span>' +
        '<span class="bloque-pie" id="duplicados-descartados-pie">Grupos marcados como "No son el mismo"</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Cuando en la pantalla de Duplicados se dice que dos asuntos ' +
        '"No son el mismo", ese grupo deja de avisar. Aquí se puede volver a avisar de ' +
        'cualquiera de ellos. Si entre tanto se crea otro asunto que encaje en el mismo ' +
        'grupo, vuelve a avisar solo, sin hacer falta nada de esto.</p>' +
        '<div id="tabla-duplicados-descartados" class="lista"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    var pie = $('duplicados-descartados-pie');
    if (pie) pie.textContent = descartes.length
      ? descartes.length + (descartes.length === 1 ? ' grupo descartado' : ' grupos descartados')
      : 'Grupos marcados como "No son el mismo"';

    var caja = $('tabla-duplicados-descartados');
    if (!caja) return;
    caja.innerHTML = '';
    if (!descartes.length) {
      caja.innerHTML = '<div class="vacio">Ninguno.</div>';
      return;
    }
    descartes.forEach(function (d) {
      var f = document.createElement('div');
      f.className = 'fila-tipo';
      f.innerHTML = '<span class="nombre-tipo">' + U.escapar(d.nombres.join('  ·  ')) + '</span>' +
        '<span class="suave" style="flex:1">' +
        U.escapar((d.por ? 'Descartado por ' + d.por : 'Descartado') +
          (d.el ? ', ' + (window.Notas ? window.Notas.cuando(d.el) : d.el) : '')) +
        '</span>';
      var volver = document.createElement('button');
      volver.className = 'boton';
      volver.textContent = 'Volver a avisar';
      volver.onclick = async function () {
        volver.disabled = true;
        try {
          await volverAAvisar(d.firma);
          pintarBloqueAjustes();
          pintarAviso();
          U.aviso('Se volverá a avisar de ese grupo si sigue pareciendo el mismo.', 'bueno');
        } catch (e) {
          volver.disabled = false;
          U.aviso('No he podido deshacerlo: ' + e.message, 'malo');
        }
      };
      f.appendChild(volver);
      caja.appendChild(f);
    });
  }

  (function () {
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (!$('pantalla-ajustes')) return;
        if (!descartesLeidos && App.E.gestor) {
          cargarDescartes().then(pintarBloqueAjustes);
          return;
        }
        try { pintarBloqueAjustes(); } catch (e) {}
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

})();
