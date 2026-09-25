/* ============================================================
   ficha-asunto.js — la pantalla de un asunto.

   Al pulsar el nombre de un asunto se entra aquí. En una sola
   pantalla está todo lo suyo: sus datos, el contacto del tercero, la
   guía de su tipo con las casillas, sus notas, sus documentos y los
   demás asuntos de ese mismo tercero. Y todos los botones de
   siempre, sin volver a la lista.

   Este fichero no guarda nada por su cuenta: para cambiar el estado,
   la vía, el plazo, el nombre o el archivado llama a lo que ya hace
   la aplicación. Así no hay dos sitios que hagan lo mismo.

   Como aquí dentro está todo, la tarjeta de la lista se queda con el
   desplegable del estado, "Copiar nombre" y "Archivar". Esa poda
   también se hace aquí, un poco más abajo.
   ============================================================ */
(function () {

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): este fichero se parte por
     temas, sin cambiar nada de lo que hace. Aquí queda el núcleo (entrar
     y salir, pintar la ficha y la barra de acciones); el resto vive en
     js/ficha-huella.js (repintar solo si algo ha cambiado),
     js/ficha-en-la-lista.js (la tarjeta de la lista abre la ficha),
     js/ficha-consulta.js (no pisarse: presencia y modo consulta),
     js/ficha-sellos.js (un papel que ya trae el sello) y
     js/ficha-bloques.js (los bloques de dentro y "El encargo"). El estado
     de la ficha y lo que se piden entre ellos va en `window.FichaNucleo`
     (N), que solo usan estos seis ficheros. */
  var N = window.FichaNucleo = {
    actual: null,             /* el asunto que se está viendo */
    modoActual: 'abierto',
    ocupacionActual: null,    /* el compañero dentro (fila 24), o null */
    huellaPintada: null,      /* ver js/ficha-huella.js */
    ultimaListaFicheros: ''
  };


  /* Si el compañero ya está dentro de este asunto (17-sep-2026, fila
     24): { usuario } mientras se está en modo consulta, o null si el
     asunto está libre o el mando es de uno mismo. La vigilancia de
     verdad —cuándo cambia, cada cuánto se relee— vive en
     js/presencia.js; aquí solo se pinta lo que toca. */

  function $(id) { return document.getElementById(id); }

  /* La pantalla nueva entra en la lista de pantallas, para que al
     pulsar cualquier pestaña se esconda como las demás. */
  if (App.PANTALLAS.indexOf('asunto') === -1) App.PANTALLAS.push('asunto');

  /* ==========================================================
     ENTRAR Y SALIR
     ========================================================== */

  App.abrirFicha = function (a, modo) {
    N.actual = a;
    N.modoActual = modo || 'abierto';
    N.ocupacionActual = null;
    N.huellaPintada = null;      /* ficha nueva: nada que comparar todavía */
    /* Cada ficha que se abre empieza su propia nota, aunque sea la
       misma que ya estaba abierta (fila 37, 17-sep-2026): la caja de
       escribir directa de js/notas.js solo sigue metiendo texto en la
       MISMA nota mientras la ficha se repinta sola por debajo. */
    if (window.Notas) window.Notas.olvidarBorrador();
    /* Al entrar, siempre la cuadrícula de tarjetas (fila 107). */
    FichaTarjetas.alEntrar(a);
    if (window.Navegacion) Navegacion.apuntar();   /* fila 119: de dónde se viene */
    App.ir('asunto');
    pintar();

    /* Solo se vigila la presencia en un asunto abierto: en el ARCHIVO
       no hay nada que tramitar, así que nadie puede "pisarse". */
    if (!window.Presencia) return;
    if (N.modoActual !== 'abierto') { Presencia.dejarDeVigilar(); return; }
    Presencia.vigilar(a.nombre, function (cambio) {
      if (N.actual !== a) return;   /* se ha cambiado de ficha mientras tanto */
      N.ocupacionActual = cambio.modo === 'consulta' ? { usuario: cambio.usuario } : null;
      N.pintarPresencia();
      N.aplicarModoConsulta();
    });
  };

  /* Las marcas de arriba (tipo y quién lo pide). "Lo pide" lleva la
     relación entre paréntesis, en minúscula (fila 106, docs/LO-PIDE-EN-
     LA-CABECERA.md): es el único sitio de la cabecera donde sale. */
  function marcasDeFicha(a, tipo) {
    var lp = a.ficha.loPide;
    return (tipo ? '<span class="marca-tipo">' + U.escapar(tipo) + '</span>' : '') +
      (lp && lp.nombre
        ? '<span class="marca-lopide">Lo pide: ' + U.escapar(LoPide.etiqueta(lp)) + '</span>' : '');
  }

  /* Tras cambiar el estado, el plazo, la vía o el encargo, se repinta
     solo la barra de acciones (y las marcas), no la ficha entera, y se
     pone al día la huella sin leer el disco: si no, el siguiente
     vistazo a la carpeta vería la ficha "cambiada" y la rehacía de
     golpe (fila 101, docs/REPINTAR-SOLO-LO-QUE-CAMBIA.md). `clave`
     (opcional): solo si la ficha abierta es la de ese asunto. */
  App.repintarAccionesFicha = function (clave) {
    if (!fichaVisible()) return;
    if (clave && N.actual.nombre !== clave) return;
    var a = N.actual;
    var fresca = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
    if (fresca) a.ficha = fresca;
    var marcas = document.querySelector('#ficha-asunto-cuerpo .ficha-marcas');
    if (marcas) marcas.innerHTML = marcasDeFicha(a, tipoDe(a));
    pintarAcciones(a, N.modoActual === 'abierto');
    if (N.huellaPintada) N.huellaPintada.ficha = N.huellaFichaSin(a, N.ultimaListaFicheros);
  };

  function volverALaLista() {
    N.actual = null;
    if (window.Presencia) Presencia.dejarDeVigilar();
    if (window.OtrosDelTercero) OtrosDelTercero.olvidarOrigen();
    var defecto = N.modoActual === 'archivado' ? 'archivo' : 'abiertos';
    if (window.Navegacion) Navegacion.volver(defecto); else App.ir(defecto);
  }

  /* Expuesta para js/ficha-nombre-acciones.js (18-sep-2026, fila 52):
     "Editar el asunto" y "Borrar el asunto" viven ahora en el menú de
     tres puntos del nombre, en su propio fichero, y necesitan volver a
     la lista exactamente igual que hacían los botones de siempre. */
  App.volverALaLista = volverALaLista;

  /* Si la ficha se ve de verdad en pantalla (y no solo que `actual`
     se ha quedado puesto porque no se pulsó "Volver" al cambiar de
     pestaña). Un repintado AUTOMÁTICO —el que no ha pedido Francisco
     pulsando un botón— consulta esto antes de tocar nada, y nunca
     navega por su cuenta (fila 30, 17-sep-2026: guardar un documento
     no debe echar de la ficha a la lista de asuntos). */
  function fichaVisible() {
    if (!N.actual) return false;
    var pantalla = $('pantalla-asunto');
    return !!pantalla && !pantalla.classList.contains('oculto');
  }
  App.fichaAbierta = function () { return fichaVisible() ? N.actual.nombre : ''; };
  /* Fila 155: el asunto de la ficha a la vista (para guardar el PDF de un Word en su carpeta). */
  App.asuntoDeLaFicha = function () { return fichaVisible() ? N.actual : null; };


  /* ==========================================================
     PINTAR LA FICHA
     ========================================================== */

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  /* `extra` (fila 101): la fila «Formularios» oculta que rellena
     js/formularios.js; antes este segundo parámetro se ignoraba y la
     fila no salía nunca. */
  function filasHtml(buenas, extra) {
    /* `id`: js/formularios.js (fila 82) rellena ahí su propia fila
       "Formularios", async, y solo la enseña cuando de verdad hay
       alguno: nace oculta (`extra`). */
    return '<div class="ficha-datos" id="ficha-datos-tramite">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + (extra || '') + '</div>';
  }

  /* La línea gris bajo el nombre (18-sep-2026, fila 51,
     docs/FICHA-DISPOSICION.md, 4): lo suelto que antes vivía en "Datos
     del asunto" y no se repite en ningún otro sitio de la pantalla.
     Lo que esté vacío no deja ni el separador ni un hueco. Se esconde
     entera con la cabecera encogida (css/ficha-asunto.css). */
  function subtituloDeFicha(a) {
    var f = a.ficha || {};
    var trozos = [
      a.leido.fecha ? 'Abierto el ' + U.fechaLegible(a.leido.fecha) : '',
      f.categoria || a.leido.categoria || '',
      f.curso || a.leido.curso || '',
      f.descripcion || '',
      f.abiertoPor || ''
    ].filter(Boolean);
    if (!trozos.length) return '';
    var linea = trozos.join(' · ');
    return '<p class="ficha-subtitulo" title="' + U.escapar(linea) + '">' + U.escapar(linea) + '</p>';
  }

  /* La ficha entera se rehace con innerHTML, y con ella el campo de la
     nota nueva: el repintado pasa por U.conservandoLoEscrito para que
     lo que se esté escribiendo, el foco y el cursor sobrevivan
     (17-sep-2026, fila 34). Y al terminar se apunta la huella de lo
     que ha quedado en pantalla. */
  function pintar() {
    var salida = U.conservandoLoEscrito($('ficha-asunto-cuerpo'), pintarLaFicha);
    if (N.actual) N.apuntarHuella();
    return salida;
  }

  function pintarLaFicha() {
    var a = N.actual;
    var caja = $('ficha-asunto-cuerpo');
    if (!a || !caja) return;
    var abierto = (N.modoActual === 'abierto');
    var tipo = tipoDe(a);
    var tramite = N.datosDelAsunto(a);
    caja.innerHTML =
      /* Dos líneas (24-sep-2026, fila 112, docs/CABECERA-COMPACTA.md):
         volver, tipo, nombre y «⋯», con «Archivar» a la derecha; debajo,
         la barra de acciones y, a la derecha, en gris, la fila de copiar
         (js/ficha-nombre-acciones.js) y la línea de apertura. */
      '<header class="ficha-cabecera">' +
        '<div class="ficha-linea1">' +
          '<div class="ficha-volver-fila">' +
            '<button type="button" class="boton" id="ficha-volver" title="Volver a la lista">← Volver</button>' +
            '<div id="ficha-volver-origen"></div>' +
          '</div>' +
          '<div class="ficha-marcas">' + marcasDeFicha(a, tipo) + '</div>' +
          '<h2 class="ficha-nombre"><span class="ficha-nombre-texto">' + U.escapar(a.nombre) + '</span></h2>' +
          '<div class="ficha-archivar" id="ficha-archivar"></div>' +
        '</div>' +
        '<div class="ficha-linea2">' +
          '<div class="ficha-acciones" id="ficha-acciones"></div>' +
          '<div class="ficha-apertura">' + subtituloDeFicha(a) + '</div>' +
        '</div>' +
      '</header>' +
      '<div id="ficha-presencia"></div>' +
      '<div id="ficha-sellos"></div>' +
      '<div id="ficha-aviso-tipo"></div>' +
      /* Tarjetas (24-sep-2026, fila 107, docs/FICHA-EN-TARJETAS.md): la
         cuadrícula, abrir una en grande y la franja de documentos viven
         en js/ficha-tarjetas.js; los huecos de dentro (#ficha-guia,
         #ficha-documentos, #ficha-notas…) son los mismos de siempre. */
      FichaTarjetas.html(tramite);

    /* Antes de volver a la lista, si queda una nota sin guardar en la
       caja de la ficha, avisa (18-sep-2026, fila 58,
       docs/AJUSTES-DE-USO-2026-09-18.md, 3): esto es lo que pulsa
       tanto el botón como Escape (js/usabilidad.js, que pulsa este
       mismo `#ficha-volver`). Solo aquí, no en `volverALaLista()`:
       esa función también la llama sola `App.reengancharFicha` cuando
       el asunto ya no está en la lista, y ahí no tiene sentido
       preguntar nada. */
    $('ficha-volver').onclick = async function () {
      if (window.Notas && !(await Notas.confirmarSalirDeFicha())) return;
      volverALaLista();
    };

    pintarAcciones(a, abierto);
    N.pintarNotas(a, abierto);
    N.pintarAvisoDeTipo(a, tipo);
    N.pintarGuia(a, tipo, abierto);
    N.pintarContacto(a);
    N.pintarDocumentos(a);
    N.pintarOtrosDelTercero(a);
    N.pintarRelacionados(a, abierto);
    N.pintarPresencia();
    N.pintarSellos(a);
    if (window.OtrosDelTercero) OtrosDelTercero.pintarVuelta($('ficha-volver-origen'), a);
    N.asegurarObservadorConsulta();
    N.aplicarModoConsulta();
    FichaTarjetas.alPintar(caja, a);
  }


  /* ---------- la barra de botones ----------

     Son los mismos de la tarjeta. Al terminar cada uno se repinta la
     ficha, y los que mueven o renombran la carpeta devuelven a la
     lista, porque el asunto ya no se llama igual. */

  /* La barra de acciones queda en cinco elementos y nada más
     (18-sep-2026, fila 52, docs/CABECERA-DEL-ASUNTO.md, 3): el
     hito actual (fila 129; antes, el desplegable de estado), el vencimiento, "El encargo", "Comunicar"
     (lo añade js/correo.js) y "Archivar"/"Reabrir". "Editar", "Borrar"
     y "Copiar nombre" viven en el menú de tres puntos del nombre
     (js/ficha-nombre-acciones.js); "Gestionar documentos", en la
     cabecera del bloque de documentos (js/ficha-documentos.js). */
  function pintarAcciones(a, abierto) {
    var caja = $('ficha-acciones');
    caja.innerHTML = '';

    if (abierto) {
      /* Fila 129 (docs/EL-HITO-ES-EL-ESTADO.md): en vez del desplegable
         de estado, el hito actual («Paso N de M · título», que abre su
         mesa) y «Esperando a…» / «Ya ha llegado» (js/estado-hito.js). */
      if (window.EstadoHito) EstadoHito.pintarEnFicha(caja, a);

      var et = Plazos.etiquetaVencimiento(a.ficha.limite);
      var bplazo = document.createElement('button');
      bplazo.type = 'button';
      bplazo.className = 'boton-vencimiento' + (et.clase ? ' ' + et.clase : '');
      bplazo.textContent = et.texto;
      bplazo.title = 'Poner o cambiar la fecha límite';
      bplazo.onclick = async function (ev) {
        try { await App.editarPlazo(a, ev.currentTarget); } finally { App.repintarAccionesFicha(); }
      };
      caja.appendChild(bplazo);

      if (window.LoPide) {
        var envoltorioEncargo = document.createElement('div');
        envoltorioEncargo.className = 'ficha-encargo';
        var tieneEncargo = !!((a.ficha.loPide && a.ficha.loPide.nombre) || a.ficha.via);
        envoltorioEncargo.appendChild(boton('El encargo',
          'Quién ha pedido esta gestión, por qué vía y en qué fecha',
          async function (ev) {
            try { await N.abrirLoPide(a, ev.currentTarget); } finally { App.repintarAccionesFicha(); }
          }, tieneEncargo));
        /* Sin línea debajo (fila 106): quién lo pide ya sale arriba, en
           su etiqueta, y la vía se ve al abrir "El encargo". */
        caja.appendChild(envoltorioEncargo);
      }
    }

    /* "Comunicar" (js/correo.js) entra aquí, y "Archivar"/"Reabrir" se
       queda el último, pegado al borde derecho. */
    var cerrar = boton(abierto ? 'Archivar el asunto' : 'Reabrir el asunto',
      abierto ? 'Llevar la carpeta al ARCHIVO' : '', async function (ev) {
      await U.mientrasGuarda(ev.currentTarget, function () {
        return abierto ? App.cerrarAsunto(a) : App.reabrirAsunto(a);
      });
      /* Reabierto: a su ficha de asunto abierto (fila 119). */
      if (!abierto && window.Navegacion && Navegacion.abrirAbierto(a.nombre)) return;
      volverALaLista();
    });
    cerrar.classList.add('boton-principal');
    /* En la primera línea de la cabecera, a la derecha (fila 112). */
    var sitioArchivar = $('ficha-archivar');
    if (sitioArchivar) { sitioArchivar.innerHTML = ''; sitioArchivar.appendChild(cerrar); }
    else caja.appendChild(cerrar);
  }

  function boton(texto, ayuda, alPulsar, marcado) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton' + (marcado ? ' boton-marcado' : '');
    b.textContent = texto;
    if (ayuda) b.title = ayuda;
    b.onclick = alPulsar;
    return b;
  }

  Object.assign(N, {
    boton: boton,
    fichaVisible: fichaVisible,
    filasHtml: filasHtml,
    pintar: pintar,
    tipoDe: tipoDe,
    volverALaLista: volverALaLista
  });
})();
