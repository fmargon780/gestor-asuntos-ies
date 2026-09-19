/* ============================================================
   duplicados.js — ¿esto no lo hicimos ya?

   Antes de abrir un asunto conviene saber si ese mismo tercero ya
   tuvo otro igual. Aquí se mira, y se mira barato: no se lee el
   ARCHIVO entero, solo la carpeta de ese tercero
   (ARCHIVO / CATEGORÍA / Apellidos, Nombre 1234567) y la lista de
   asuntos abiertos, que ya está en memoria.

   Este fichero hace tres cosas:

   - Deja a mano la consulta, para que la use la ficha del asunto.
   - Pone un aviso en "Nuevo asunto" cuando el tercero y el tipo
     elegidos ya tienen asuntos así. Es solo un aviso: nunca impide
     crear nada, porque dos matrículas del mismo alumno en cursos
     distintos son legítimas.
   - Para el mismo tercero, tipo Y año académico (11-sep-2026, "que no
     se dupliquen los asuntos"), para de verdad al pulsar "Crear el
     asunto" y ofrece abrir el que ya existe, o crear otro de todas
     formas. El grupo y el texto libre no cuentan para esto: son justo
     lo que hizo que dos carpetas del mismo asunto parecieran
     distintas a simple vista.

   Solo funciona cuando se sabe quién es el tercero. En las carpetas
   viejas hechas a mano, muchas veces no se sabe.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- la consulta ---------- */

  /* La carpeta de ese tercero dentro del ARCHIVO, si existe. */
  async function carpetaDelTercero(categoria, tercero) {
    if (!App.E.archivo || !categoria || !tercero) return null;
    try {
      var cat = await App.E.archivo.getDirectoryHandle(categoria);
      return await cat.getDirectoryHandle(tercero);
    } catch (e) {
      return null;    /* todavía no hay nada archivado de ese tercero */
    }
  }

  function tipoDeNombre(nombre) {
    var leido = Nombres.leer(nombre, App.E.tipos);
    return (leido && leido.tipo) || '';
  }

  /* Todos los asuntos de un tercero: los que están en el ARCHIVO y
     los que siguen abiertos. */
  async function delTercero(categoria, tercero) {
    var salida = { archivados: [], abiertos: [] };
    if (!categoria || !tercero) return salida;

    var carpeta = await carpetaDelTercero(categoria, tercero);
    if (carpeta) {
      var hijas = await Carpetas.subcarpetas(carpeta);
      salida.archivados = hijas.map(function (c) { return c.nombre; });
    }

    /* Entre los abiertos se busca por el nombre del tercero, que va
       al final del nombre de la carpeta. */
    var clave = U.normalizar(tercero);
    if (clave) {
      salida.abiertos = App.E.listaAbiertos.filter(function (a) {
        var suyo = (a.ficha && a.ficha.tercero) || (a.leido && a.leido.resto) || '';
        return U.normalizar(suyo).indexOf(clave) !== -1;
      }).map(function (a) { return a.nombre; });
    }
    return salida;
  }

  function delTipo(nombres, tipo) {
    if (!tipo) return [];
    var t = U.normalizar(tipo);
    return (nombres || []).filter(function (n) {
      return U.normalizar(tipoDeNombre(n)) === t;
    });
  }

  /* ---------- el año académico de una carpeta ----------

     El nombre de la carpeta es AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO]
     [DESCRIPCIÓN] TERCERO. Nombres.leer quita la fecha y el tipo, y
     deja el resto tal cual: si hay año académico, es lo primero que
     queda, con la forma AA-AA. */
  function cursoDeNombre(nombre) {
    var leido = Nombres.leer(nombre, App.E.tipos);
    var resto = (leido && leido.resto) || '';
    var m = resto.match(/^(\d{2}[-\/]\d{2})\b/);
    return m ? m[1] : '';
  }

  /* El año académico de un asunto ya guardado: el de su ficha si lo
     tiene (lo que se guarda al crearlo desde la aplicación), y si no,
     el que se pueda leer del propio nombre de la carpeta. Sirve tanto
     para un asunto abierto como para uno archivado: la ficha de los
     dos vive en el mismo registro, _GESTOR/asuntos.json. */
  function cursoDe(nombre) {
    var ficha = (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[nombre]) || {};
    return ficha.curso || cursoDeNombre(nombre);
  }

  /* Si a alguno de los dos le falta el año académico, cuenta como
     coincidencia: más vale preguntar de más que dejar pasar un
     duplicado de verdad. */
  function coincideCurso(a, b) {
    var na = U.normalizar(a), nb = U.normalizar(b);
    if (!na || !nb) return true;
    return na === nb;
  }

  window.Duplicados = {
    delTercero: delTercero,
    delTipo: delTipo,
    tipoDeNombre: tipoDeNombre,
    cursoDeNombre: cursoDeNombre,
    cursoDe: cursoDe,
    coincideCurso: coincideCurso,
    /* Exportada para js/otros-del-tercero.js (fila 40, 17-sep-2026,
       docs/SALTAR-A-OTRO-ASUNTO.md): monta a mano el objeto de un
       asunto del ARCHIVO con una sola lectura de carpeta, sin recorrer
       el ARCHIVO entero como App.verArchivo. */
    carpetaDelTercero: carpetaDelTercero
  };

  /* ---------- el aviso al crear un asunto ----------

     Se engancha a la vista previa del nombre: cada vez que se repinta
     (al elegir tipo, tercero o fecha) se mira si eso ya existe. Se
     recuerda la última consulta para no leer la carpeta a cada tecla. */

  var caja = null;
  var ultimaConsulta = '';

  function cajaDelAviso() {
    if (caja && caja.parentNode) return caja;
    var previa = document.querySelector('#bloque-detalles .vista-previa');
    if (!previa) return null;
    caja = document.createElement('div');
    caja.id = 'aviso-duplicado';
    caja.className = 'oculto';
    previa.parentNode.insertBefore(caja, previa);
    return caja;
  }

  function esconder(c) {
    c.className = 'oculto';
    c.innerHTML = '';
    ultimaConsulta = '';
  }

  function comoLista(nombres) {
    return '<ul class="lista-repetidos">' + nombres.slice(0, 6).map(function (n) {
      return '<li>' + U.escapar(n) + '</li>';
    }).join('') + '</ul>' +
    (nombres.length > 6 ? '<p class="nota">Y ' + (nombres.length - 6) + ' más.</p>' : '');
  }

  async function mirarSiYaExiste() {
    var c = cajaDelAviso();
    if (!c) return;

    var categoria = App.E.nuevo.categoria;
    var tipo = App.E.nuevo.tipo;
    var persona = App.E.nuevo.tercero;
    if (!categoria || !tipo || !persona) { esconder(c); return; }

    var tercero = App.textoTercero(persona);
    var consulta = categoria + '|' + tercero + '|' + tipo;
    if (consulta === ultimaConsulta) return;
    ultimaConsulta = consulta;

    var todo = await delTercero(categoria, tercero);
    /* Si mientras se leía la carpeta el usuario ha cambiado algo, lo
       que acaba de llegar ya no vale. */
    if (consulta !== ultimaConsulta) return;

    var archivados = delTipo(todo.archivados, tipo);
    var abiertos = delTipo(todo.abiertos, tipo);
    if (!archivados.length && !abiertos.length) {
      c.className = 'oculto';
      c.innerHTML = '';
      return;
    }

    c.className = 'aviso aviso-ambar';
    c.innerHTML = '<strong>Este tercero ya tiene asuntos de tipo ' + U.escapar(tipo) + '.</strong>' +
      (abiertos.length
        ? '<p>Abiertos ahora mismo:</p>' + comoLista(abiertos) : '') +
      (archivados.length
        ? '<p>En el archivo:</p>' + comoLista(archivados) : '') +
      '<p class="nota">Es solo un aviso. Si el asunto nuevo es distinto de verdad ' +
      '(otro curso, otra gestión), créalo sin más.</p>';
  }

  /* Se envuelve la función que repinta la vista previa, para no tener
     que tocar la pantalla de Nuevo asunto. */
  U.envolver(App, 'App.refrescarVista', 'duplicados.js', function (comoEra) {
    return function () {
      comoEra();
      try { mirarSiYaExiste(); } catch (e) { /* el aviso nunca estorba */ }
    };
  });

  /* ============================================================
     LA PARADA AL CREAR (11-sep-2026, "que no se dupliquen los asuntos")

     El aviso de arriba nunca impide crear nada: es justo lo que dejó
     pasar las dos carpetas de TRANSPORTE del mismo alumno, el mismo
     día, con la única diferencia del grupo. Aquí, al pulsar "Crear el
     asunto", si ya hay uno igual (mismo tercero, mismo tipo, mismo
     año académico; el grupo y el texto libre no cuentan) se para del
     todo y sale un cuadro: abrir el que ya existe, o crear otro de
     todas formas.
     ============================================================ */

  /* Los candidatos que cuentan como "esto ya existe", para el tercero,
     tipo y año académico que se han elegido en el formulario. */
  async function comprobarAntesDeCrear(categoria, tercero, tipo, curso) {
    var todo = await delTercero(categoria, tercero);
    var mismosAbiertos = delTipo(todo.abiertos, tipo)
      .filter(function (n) { return coincideCurso(cursoDe(n), curso); });
    var mismosArchivados = delTipo(todo.archivados, tipo)
      .filter(function (n) { return coincideCurso(cursoDe(n), curso); });
    return { abiertos: mismosAbiertos, archivados: mismosArchivados };
  }

  /* Con varios candidatos abiertos, el de partida es el que se abrió
     más recientemente: es el que más veces hará falta. */
  function candidatoMasReciente(nombres) {
    var mejor = null;
    (nombres || []).forEach(function (n) {
      var a = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === n; })[0];
      var el = (a && a.ficha && a.ficha.abiertoEl) || '';
      if (!mejor || el > mejor.el) mejor = { nombre: n, el: el };
    });
    return mejor ? mejor.nombre : (nombres && nombres[0]) || '';
  }

  /* El cuadro de "Este asunto ya existe". Devuelve una de estas tres
     cosas:
       { accion: 'cancelar' }
       { accion: 'crear' }                       — seguir y crear otro
       { accion: 'abrir', candidato: {…} }        — abrir el elegido

     Solo hay un cuadro de diálogo en toda la aplicación (#capa), así
     que esto se pinta dentro del mismo U.preguntar de siempre. El
     botón destacado ("Abrir el que ya existe") no es ninguno de los
     dos botones de serie del cuadro: va dentro del cuerpo, y al
     pulsarlo se cierra el cuadro pulsando el propio Cancelar por
     dentro, después de anotar qué se ha elegido. */
  async function mostrarAvisoExistente(candidatos) {
    var opciones = candidatos.abiertos.map(function (n) { return { nombre: n, archivado: false }; })
      .concat(candidatos.archivados.map(function (n) { return { nombre: n, archivado: true }; }));
    if (!opciones.length) return { accion: 'crear' };

    var porDefecto = candidatos.abiertos.length
      ? candidatoMasReciente(candidatos.abiertos)
      : opciones[0].nombre;

    var varios = opciones.length > 1;
    var listaOpciones = varios
      ? opciones.map(function (o, i) {
          return '<label class="dup-opcion"><input type="radio" name="dup-cual" value="' + i + '"' +
                 (o.nombre === porDefecto ? ' checked' : '') + '> <span>' + U.escapar(o.nombre) +
                 (o.archivado ? ' <span class="suave">(en el ARCHIVO)</span>' : '') +
                 '</span></label>';
        }).join('')
      : '<p class="dup-unico"><strong>' + U.escapar(opciones[0].nombre) + '</strong>' +
        (opciones[0].archivado ? ' <span class="suave">(en el ARCHIVO)</span>' : '') + '</p>';

    var cuerpo = '<p>' + (varios ? 'Ya hay asuntos así:' : 'Ya existe:') + '</p>' +
      listaOpciones +
      '<div class="dup-botones">' +
        '<button type="button" id="dup-abrir" class="boton boton-principal">Abrir el que ya existe</button>' +
      '</div>';

    var promesa = U.preguntar('Este asunto ya existe', cuerpo, 'Crear otro de todas formas');

    /* El botón de aceptar de serie es aquí la opción discreta: el
       destacado es el nuevo, "Abrir el que ya existe". Se restaura al
       cerrar, porque el mismo #cuadro-aceptar lo usan todos los demás
       cuadros de la aplicación. */
    var aceptar = $('cuadro-aceptar');
    if (aceptar) aceptar.classList.remove('boton-principal');

    var elegido = null;
    var botonAbrir = $('dup-abrir');
    if (botonAbrir) {
      botonAbrir.onclick = function () {
        var marcado = document.querySelector('input[name="dup-cual"]:checked');
        var indice = marcado ? parseInt(marcado.value, 10) : 0;
        elegido = opciones[indice] || opciones[0];
        var cancelar = $('cuadro-cancelar');
        if (cancelar) cancelar.click();
      };
    }

    var crearOtro = await promesa;
    if (aceptar) aceptar.classList.add('boton-principal');

    if (elegido) return { accion: 'abrir', candidato: elegido };
    return { accion: crearOtro ? 'crear' : 'cancelar' };
  }

  /* Abrir un candidato abierto es la misma navegación que pulsar su
     nombre en la lista de asuntos abiertos (App.abrirFicha, de
     js/ficha-asunto.js). Uno archivado no tiene ficha que abrir desde
     aquí: se lleva a su carpeta en el ARCHIVO. */
  function irAlCandidatoAbierto(nombre) {
    var a = (App.E.listaAbiertos || []).filter(function (x) { return x.nombre === nombre; })[0];
    if (a && App.abrirFicha) { App.abrirFicha(a, 'abierto'); return; }
    App.ir('abiertos');
  }

  function irAlCandidatoArchivado(nombre) {
    App.ir('archivo');
    var campo = $('buscar-archivo');
    if (campo) campo.value = nombre;
    if (App.E.listaArchivo && App.E.listaArchivo.length) App.pintarArchivo();
    else if (App.verArchivo) App.verArchivo();
  }

  /* Se engancha al botón de crear, guardando el manejador de siempre
     para seguir con él si no hay nada que avisar, o si Francisco
     decide crear otro de todas formas. La comprobación nunca debe
     impedir crear un asunto por su cuenta: si algo falla al mirar, se
     sigue como si no hubiera nada. */
  U.envolver($('btn-crear'), 'boton(#btn-crear).onclick', 'duplicados.js', function (creaOriginal) {
    return async function (ev) {
      try {
        var d = App.datosDelFormulario();
        var candidatos = await comprobarAntesDeCrear(
          App.E.nuevo.categoria, d.tercero, d.tipo, d.curso);
        if (candidatos.abiertos.length || candidatos.archivados.length) {
          var res = await mostrarAvisoExistente(candidatos);
          if (res.accion === 'cancelar') return;
          if (res.accion === 'abrir') {
            if (res.candidato.archivado) irAlCandidatoArchivado(res.candidato.nombre);
            else irAlCandidatoAbierto(res.candidato.nombre);
            return;
          }
          /* res.accion === 'crear': se sigue como si no hubiera aviso. */
        }
      } catch (e) { /* la comprobación nunca debe impedir crear */ }
      return creaOriginal.call(this, ev);
    };
  });

})();
