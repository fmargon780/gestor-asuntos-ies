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

  var actual = null;      /* el asunto que se está viendo */
  var modoActual = 'abierto';

  /* El nombre del asunto que había en pantalla la ÚLTIMA vez que se
     rehizo el innerHTML: hace falta por separado de `actual`, porque
     al saltar a otro asunto `actual` ya vale el nuevo antes de pintar
     (18-sep-2026, fila 51: para no confundir el abierto/cerrado de
     los dos plegables de uno con el del otro). */
  var ultimoPintado = null;

  /* Si el compañero ya está dentro de este asunto (17-sep-2026, fila
     24): { usuario } mientras se está en modo consulta, o null si el
     asunto está libre o el mando es de uno mismo. La vigilancia de
     verdad —cuándo cambia, cada cuánto se relee— vive en
     js/presencia.js; aquí solo se pinta lo que toca. */
  var ocupacionActual = null;

  function $(id) { return document.getElementById(id); }

  /* La pantalla nueva entra en la lista de pantallas, para que al
     pulsar cualquier pestaña se esconda como las demás. */
  if (App.PANTALLAS.indexOf('asunto') === -1) App.PANTALLAS.push('asunto');

  /* ==========================================================
     ENTRAR Y SALIR
     ========================================================== */

  App.abrirFicha = function (a, modo) {
    actual = a;
    modoActual = modo || 'abierto';
    ocupacionActual = null;
    huellaPintada = null;      /* ficha nueva: nada que comparar todavía */
    /* Cada ficha que se abre empieza su propia nota, aunque sea la
       misma que ya estaba abierta (fila 37, 17-sep-2026): la caja de
       escribir directa de js/notas.js solo sigue metiendo texto en la
       MISMA nota mientras la ficha se repinta sola por debajo. */
    if (window.Notas) window.Notas.olvidarBorrador();
    App.ir('asunto');
    pintar();

    /* Solo se vigila la presencia en un asunto abierto: en el ARCHIVO
       no hay nada que tramitar, así que nadie puede "pisarse". */
    if (!window.Presencia) return;
    if (modoActual !== 'abierto') { Presencia.dejarDeVigilar(); return; }
    Presencia.vigilar(a.nombre, function (cambio) {
      if (actual !== a) return;   /* se ha cambiado de ficha mientras tanto */
      ocupacionActual = cambio.modo === 'consulta' ? { usuario: cambio.usuario } : null;
      pintarPresencia();
      aplicarModoConsulta();
    });
  };

  function volverALaLista() {
    actual = null;
    if (window.Presencia) Presencia.dejarDeVigilar();
    if (window.OtrosDelTercero) OtrosDelTercero.olvidarOrigen();
    App.ir(modoActual === 'archivado' ? 'archivo' : 'abiertos');
  }

  /* Si la ficha se ve de verdad en pantalla (y no solo que `actual`
     se ha quedado puesto porque no se pulsó "Volver" al cambiar de
     pestaña). Un repintado AUTOMÁTICO —el que no ha pedido Francisco
     pulsando un botón— consulta esto antes de tocar nada, y nunca
     navega por su cuenta (fila 30, 17-sep-2026: guardar un documento
     no debe echar de la ficha a la lista de asuntos). */
  function fichaVisible() {
    if (!actual) return false;
    var pantalla = $('pantalla-asunto');
    return !!pantalla && !pantalla.classList.contains('oculto');
  }
  App.fichaAbierta = function () { return fichaVisible() ? actual.nombre : ''; };

  /* Cada vez que se relee la carpeta (App.verAbiertos, envuelta más
     abajo), el asunto que tenía la ficha en la mano deja de ser el
     mismo objeto. Aquí se vuelve a coger de la lista fresca, por su
     nombre, y se repinta en su sitio: así un repaso automático de la
     carpeta (`App.mirarLaCarpeta`) o guardar un documento dentro del
     asunto nunca echan a Francisco a la lista, solo refrescan lo que
     tienen delante. Si el asunto ya no está en absoluto (se ha
     archivado o borrado desde el otro ordenador), entonces sí se
     vuelve, con un aviso de una línea.

     ...pero solo se repinta SI DE VERDAD HA CAMBIADO ALGO (17-sep-2026,
     fila 34). Antes se repintaba en cada pasada: bastaba con que el
     compañero dejara un papel suelto en "Por clasificar" para que la
     ficha abierta se rehiciera entera y se llevara por delante la nota
     a medio escribir. Ahora se compara una huella de texto del asunto
     con la de lo que ya se está enseñando. */
  var huellaPintada = null;

  /* La huella va en dos mitades a propósito. Los hitos no los pinta
     este fichero, sino js/hitos-panel.js dentro de #ficha-guia: si solo
     han cambiado ellos, repintar la ficha entera sería tirar abajo
     media pantalla para nada, y de paso se llevaría por delante la
     nota de hito a medio escribir. Con las dos mitades separadas, un
     cambio de hitos se le pide al panel de hitos, que ya sabe
     conservar lo suyo. */
  async function huellaDe(a) {
    if (!a) return { ficha: '', hitos: '' };
    var trozos = [a.nombre, JSON.stringify(a.leido || {}), JSON.stringify(a.ficha || {})];
    try {
      var ficheros = await Carpetas.ficheros(a.handle);
      trozos.push(ficheros.map(function (f) { return f.nombre; }).join('|'));
    } catch (e) { trozos.push('carpeta-ilegible'); }

    var hitos;
    try {
      var datos = window.Hitos ? await window.Hitos.leer() : null;
      var entrada = datos && datos.porAsunto[a.nombre];
      hitos = JSON.stringify(entrada ? entrada.hitos : []);
    } catch (e) { hitos = 'hitos-ilegibles'; }

    return { ficha: trozos.join('\n'), hitos: hitos };
  }

  /* Después de pintar se apunta la huella de lo que ha quedado en
     pantalla, para que la siguiente pasada tenga con qué comparar. */
  function apuntarHuella() {
    var a = actual;
    return huellaDe(a).then(function (huella) { if (actual === a) huellaPintada = huella; });
  }

  App.reengancharFicha = function () {
    if (!fichaVisible() || modoActual !== 'abierto') return Promise.resolve();
    var mismo = App.E.listaAbiertos.filter(function (x) { return x.nombre === actual.nombre; })[0];
    if (!mismo) {
      U.aviso('Este asunto ya no está en Asuntos abiertos: puede que se haya archivado o ' +
        'borrado desde el otro ordenador.', 'malo');
      volverALaLista();
      return Promise.resolve();
    }
    /* Los datos frescos se le meten DENTRO al objeto que la ficha ya
       tiene en la mano, en vez de cambiarlo por el nuevo, y es ese el
       que se queda en la lista. Los botones ya pintados se quedaron
       con el objeto de su repintado: mientras la pantalla se deja
       quieta (que desde la fila 34 es lo normal), cambiarlo por otro
       los dejaría apuntando a datos viejos —Archivar, por ejemplo,
       volvía a preguntar "¿Dónde va esta carpeta?" con la categoría ya
       puesta—. Con esto, un asunto es un solo objeto en toda la
       aplicación, y quien lo tenga cogido ve siempre lo último. */
    if (mismo !== actual) {
      actual.handle = mismo.handle;
      actual.leido = mismo.leido;
      actual.ficha = mismo.ficha;
      actual.busca = mismo.busca;
      App.E.listaAbiertos[App.E.listaAbiertos.indexOf(mismo)] = actual;
    }

    var elDeLaFicha = actual;
    return huellaDe(elDeLaFicha).then(function (huella) {
      if (actual !== elDeLaFicha || !fichaVisible()) return;
      var antes = huellaPintada || { ficha: null, hitos: null };
      huellaPintada = huella;
      /* Nada ha cambiado: la pantalla se deja quieta. Esto es lo que
         quita el temblor de cada 20 segundos. */
      if (huella.ficha === antes.ficha && huella.hitos === antes.hitos) return;
      if (huella.ficha !== antes.ficha) { pintar(); return; }
      /* Solo han cambiado los hitos (el otro ordenador ha marcado uno,
         por ejemplo): se repinta su panel, no la ficha entera. */
      if (window.HitosPanel) window.HitosPanel.programarRepintado();
    });
  };

  /* App.verAbiertos (js/asuntos-lista.js) relee la carpeta entera y
     crea asuntos nuevos cada vez: se envuelve aquí, en vez de tocar
     ese fichero, para que cualquiera de sus llamadas —el barrido
     automático, el botón "Recargar", meter un suelto o un correo en
     un asunto, añadir un tipo que faltaba— reenganche sola la ficha
     si hay una abierta, sin repetir el apaño en cada sitio. */
  if (typeof App.verAbiertos === 'function') {
    var comoEraVerAbiertos = App.verAbiertos;
    App.verAbiertos = async function (yaLeido) {
      await comoEraVerAbiertos(yaLeido);
      await App.reengancharFicha();
    };
  }

  /* El nombre del asunto, en la tarjeta de la lista, abre la ficha.

     Y ya que dentro de la ficha están todos los botones, la tarjeta se
     queda con lo justo: el desplegable del estado, que es lo que más
     se toca y se hace de un clic sin entrar, copiar el nombre para
     pegarlo en un correo, y archivar el asunto cuando se termina. Lo
     demás (vía, plazo, editar, guía, notas, documentos y los campos
     del tipo) se hace dentro. */
  var BOTONES_DE_LA_TARJETA = ['Copiar nombre', 'Cerrar', 'Reabrir'];

  /* "Cerrar" se llama Archivar, que es lo que de verdad hace: llevar
     la carpeta al ARCHIVO. El texto se cambia aquí, donde ya se está
     tocando la tarjeta. */
  var NOMBRES_NUEVOS = { 'Cerrar': 'Archivar' };

  (function () {
    var comoEra = App.tarjetaAsunto;
    App.tarjetaAsunto = function (a, modo) {
      var div = comoEra(a, modo);

      var nombre = div.querySelector('.tarjeta-nombre');
      if (nombre) {
        nombre.classList.add('nombre-pulsable');
        nombre.title = 'Abrir la ficha de este asunto';
        nombre.onclick = function (ev) {
          ev.stopPropagation();
          App.abrirFicha(a, modo);
        };
      }

      var acciones = div.querySelector('.acciones');
      if (acciones) {
        Array.prototype.slice.call(acciones.children).forEach(function (h) {
          if (h.tagName === 'SELECT') return;            /* el estado se queda */
          var texto = (h.textContent || '').trim();
          if (BOTONES_DE_LA_TARJETA.indexOf(texto) === -1) { acciones.removeChild(h); return; }
          if (NOMBRES_NUEVOS[texto]) {
            h.textContent = NOMBRES_NUEVOS[texto];
            h.title = 'Llevar la carpeta al ARCHIVO';
          }
        });
      }

      return div;
    };
  })();

  /* ==========================================================
     PINTAR LA FICHA
     ========================================================== */

  function tipoDe(a) {
    return (a.leido && a.leido.tipo) || (a.ficha && a.ficha.tipo) || '';
  }

  function bloque(titulo, dentro, id, alLado) {
    return '<section class="ficha-bloque"' + (id ? ' id="' + id + '"' : '') + '>' +
             '<h3 class="ficha-titulo">' + U.escapar(titulo) + (alLado || '') + '</h3>' +
             dentro +
           '</section>';
  }

  function filasHtml(buenas) {
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
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
    return '<p class="ficha-subtitulo">' +
      trozos.map(function (t) { return U.escapar(t); }).join(' · ') + '</p>';
  }

  /* La ficha entera se rehace con innerHTML, y con ella el campo de la
     nota nueva: el repintado pasa por U.conservandoLoEscrito para que
     lo que se esté escribiendo, el foco y el cursor sobrevivan
     (17-sep-2026, fila 34). Y al terminar se apunta la huella de lo
     que ha quedado en pantalla. */
  function pintar() {
    var salida = U.conservandoLoEscrito($('ficha-asunto-cuerpo'), pintarLaFicha);
    if (actual) apuntarHuella();
    return salida;
  }

  function pintarLaFicha() {
    var a = actual;
    var caja = $('ficha-asunto-cuerpo');
    if (!a || !caja) return;
    var abierto = (modoActual === 'abierto');
    var situacion = a.ficha.situacion || '';
    var p = abierto ? App.plazoDe(a) : null;
    var tipo = tipoDe(a);
    var tramite = datosDelAsunto(a);
    /* Los dos plegables se rehacen enteros con el resto de la ficha:
       se guarda qué tenía abierto el asunto que HABÍA en pantalla
       hasta ahora (18-sep-2026, fila 51), y se repone después lo que
       tuviera guardado el asunto que se pasa a ver (el mismo, en un
       repintado, u otro tras saltar: `ultimoPintado` es justo la
       diferencia entre los dos). */
    if (window.FichaPlegables) FichaPlegables.recordar(ultimoPintado, caja);

    caja.innerHTML =
      '<header class="ficha-cabecera">' +
        '<div class="ficha-volver-fila">' +
          '<button type="button" class="boton" id="ficha-volver">← Volver a la lista</button>' +
          '<div id="ficha-volver-origen"></div>' +
        '</div>' +
        '<div class="ficha-marcas">' +
          (tipo ? '<span class="marca-tipo">' + U.escapar(tipo) + '</span>' : '') +
          (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                       U.escapar(situacion) + '</span>' : '') +
          (p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '') +
          (a.ficha.loPide && a.ficha.loPide.nombre
            ? '<span class="marca-lopide">Lo pide: ' + U.escapar(a.ficha.loPide.nombre) + '</span>' : '') +
        '</div>' +
        '<h2 class="ficha-nombre">' + U.escapar(a.nombre) + '</h2>' +
        subtituloDeFicha(a) +
      '</header>' +
      '<div id="ficha-presencia"></div>' +
      '<div id="ficha-sellos"></div>' +
      '<div id="ficha-aviso-tipo"></div>' +
      '<div class="ficha-acciones" id="ficha-acciones"></div>' +
      /* Tres columnas (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md):
         a la izquierda lo que hay que hacer (Hitos); en el centro los
         documentos (llevan botones, hueco ancho); a la derecha lo que
         hay que saber (Datos y contacto primero) y, plegado, lo que
         casi nunca se mira. En pantallas que no dan para tres tramos,
         css/ficha-asunto.css pone el centro debajo de la izquierda. */
      '<div class="ficha-columnas">' +
        '<div class="ficha-izquierda">' +
          bloque('Hitos', '<div id="ficha-guia" class="explica">Leyendo…</div>') +
        '</div>' +
        '<div class="ficha-centro">' +
          bloque('Documentos de la carpeta',
                 '<div id="ficha-documentos" class="explica">Leyendo…</div>', null,
                 '<span class="ficha-cuenta" id="ficha-cuenta-docs"></span>') +
        '</div>' +
        '<div class="ficha-derecha">' +
          '<div id="ficha-contacto-caja"></div>' +
          bloque('Notas', '<div id="ficha-notas"></div>') +
          FichaPlegables.bloque('ficha-plegable-otros', 'Otros asuntos de este tercero',
                                 'ficha-otros', 'Buscando…') +
          FichaPlegables.bloque('ficha-plegable-relacionados', 'Personas y entidades relacionadas',
                                 'ficha-relacionados', 'Leyendo…') +
          (tramite ? bloque('Datos del trámite', tramite) : '') +
        '</div>' +
      '</div>';

    if (window.FichaPlegables) FichaPlegables.reponer(a.nombre, caja);
    ultimoPintado = a.nombre;

    $('ficha-volver').onclick = volverALaLista;

    pintarAcciones(a, abierto, p);
    pintarNotas(a, abierto);
    pintarAvisoDeTipo(a, tipo);
    pintarGuia(a, tipo, abierto);
    pintarContacto(a);
    pintarDocumentos(a);
    pintarOtrosDelTercero(a);
    pintarRelacionados(a, abierto);
    pintarPresencia();
    pintarSellos(a);
    if (window.OtrosDelTercero) OtrosDelTercero.pintarVuelta($('ficha-volver-origen'), a);
    asegurarObservadorConsulta();
    aplicarModoConsulta();
  }

  /* ---------- no pisarse en un mismo asunto (17-sep-2026, fila 24) ----------

     El aviso, arriba del todo, y el botón de tomar el mando. Apagar
     los controles que modifican es cosa de aplicarModoConsulta, un
     poco más abajo: entre los dos no hace falta tocar nada de lo que
     ya pinta cada bloque (guía, hitos, notas, correo, plantillas...). */

  function pintarPresencia() {
    var caja = $('ficha-presencia');
    if (!caja) return;
    if (!ocupacionActual) { caja.className = 'oculto'; caja.innerHTML = ''; return; }

    caja.className = 'aviso aviso-ambar aviso-presencia';
    var texto = document.createElement('div');
    texto.innerHTML = '<strong>' + U.escapar(ocupacionActual.usuario) + ' está en este asunto ahora ' +
      'mismo.</strong> Estás mirando, no puedes modificar.';
    caja.appendChild(texto);

    var tomar = document.createElement('button');
    tomar.type = 'button';
    tomar.className = 'boton boton-presencia-tomar';
    tomar.textContent = 'Tomar el mando';
    tomar.onclick = async function () {
      var ok = await U.preguntar('Tomar el mando',
        '<p>¿Seguro? ' + U.escapar(ocupacionActual.usuario) + ' podría estar escribiendo ahora ' +
        'mismo.</p>', 'Tomar el mando');
      if (!ok || !actual) return;
      await Presencia.tomarElMando(actual.nombre);
      ocupacionActual = null;
      pintar();
    };
    caja.appendChild(tomar);
  }

  /* Apaga (o enciende) todo lo que modifica dentro de la ficha, sin
     que este fichero, ni ningún otro, tenga que marcar uno a uno sus
     propios botones: se recorre lo que haya pintado dentro de
     #ficha-asunto-cuerpo ahora mismo, sea de quien sea. Lo que solo
     lee (abrir un documento, volver, copiar un nombre, desplegar un
     hito, tomar el mando) se queda siempre encendido. */
  function esControlDeSoloLectura(el) {
    if (el.id === 'ficha-volver') return true;
    if (el.id === 'ficha-volver-al-origen') return true;
    if (el.classList.contains('ficha-documento')) return true;
    if (el.classList.contains('hito-desplegar')) return true;
    if (el.classList.contains('boton-presencia-tomar')) return true;
    var texto = (el.textContent || '').trim();
    return texto === 'Copiar' || texto === 'Copiar nombre';
  }

  function aplicarModoConsulta() {
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    var enConsulta = !!ocupacionActual;
    raiz.classList.toggle('ficha-consulta', enConsulta);
    Array.prototype.forEach.call(raiz.querySelectorAll('button, select, input, textarea'), function (el) {
      el.disabled = enConsulta && !esControlDeSoloLectura(el);
    });
  }

  /* ---------- un papel que ya trae el sello del registro ----------

     Fila 20, 17-sep-2026 (docs/REGISTRO-SIN-DUPLICAR.md): si en la
     carpeta hay un PDF sin el nombre de la aplicación y con el sello
     de Séneca dentro, sale aquí arriba, preguntando de qué documento
     es. La máquina de verdad (leer el sello, no repetir la lectura,
     renombrar y avisar) vive en js/registro-sellado.js; aquí solo se
     pinta y se engancha. */

  async function pintarSellos(a) {
    var caja = $('ficha-sellos');
    if (!caja || !window.RegistroSellado) return;
    if (modoActual !== 'abierto') { caja.innerHTML = ''; return; }

    var detectados;
    try { detectados = await RegistroSellado.detectar(a); }
    catch (e) { detectados = []; }
    if (actual !== a) return;   /* se ha cambiado de ficha mientras se leía */

    if (!detectados.length) { caja.innerHTML = ''; return; }

    var lista;
    try { lista = await Carpetas.ficheros(a.handle); }
    catch (e) { lista = []; }
    if (actual !== a) return;

    var elegibles = lista
      .filter(function (f) { return Documentos.pareceDeLaAplicacion(f.nombre); })
      .map(function (f) { return f.nombre; })
      .sort()
      .reverse();

    caja.innerHTML = detectados.map(function (d, i) {
      var s = d.sello;
      var codigo = Nombres.codigoRegistro({ ano: s.anio, sentido: s.tipo, modo: s.serie, numero: s.numero });
      var sentido = s.tipo === 'S' ? 'SALIDA' : 'ENTRADA';
      return '<div class="aviso aviso-ambar aviso-sello" data-sello="' + i + '">' +
        '<strong>Este papel trae el sello de registro ' + U.escapar(codigo || '(sin número)') +
          ' (' + sentido + (s.fecha ? ', ' + U.escapar(s.fecha) : '') + ').</strong>' +
        '<p>¿De qué documento es el registro? <span class="suave">(' + U.escapar(d.nombre) + ')</span></p>' +
        '<div class="sello-fila">' +
          '<select class="campo sello-elegir">' +
            '<option value="">Elige un documento…</option>' +
            elegibles.map(function (n) {
              return '<option value="' + U.escapar(n) + '">' + U.escapar(n) + '</option>';
            }).join('') +
          '</select>' +
          '<button type="button" class="boton sello-no-es">No es un registro</button>' +
        '</div>' +
      '</div>';
    }).join('');

    Array.prototype.forEach.call(caja.querySelectorAll('.aviso-sello'), function (div, i) {
      var d = detectados[i];
      var sel = div.querySelector('.sello-elegir');
      var noEs = div.querySelector('.sello-no-es');

      sel.onchange = async function () {
        if (!sel.value) return;
        var original = sel.value;
        await U.mientrasGuarda(sel, function () {
          return RegistroSellado.asociar(a, d.nombre, original, d.sello);
        });
        if (actual !== a) return;
        pintarDocumentos(a);
        if (window.Notas) {
          a.ficha.notas = await window.Notas.frescas(a);
          pintarNotas(a, modoActual === 'abierto');
        }
        pintarSellos(a);
      };

      noEs.onclick = async function () {
        await U.mientrasGuarda(noEs, function () { return RegistroSellado.marcarIgnorado(a, d.nombre); });
        if (actual !== a) return;
        pintarSellos(a);
      };
    });
  }

  /* La mitad de la ficha se pinta sola, después de este `pintar()`:
     la guía, los documentos, los relacionados son async, y los hitos
     (js/hitos-panel.js), "Generar documento" y "Correo" se cuelgan por
     su cuenta, con su propio MutationObserver o con un pequeño
     retraso. Aplicar el modo consulta una sola vez, al final de
     `pintar()`, se comería todo lo que sale después. Un observador
     sobre el propio #ficha-asunto-cuerpo (el mismo patrón que
     js/hitos-panel.js, con el mismo aviso de docs/CONTEXTO.md sobre
     los MutationObserver) lo vuelve a aplicar cada vez que aparece
     algo nuevo. Solo se observa una vez: el contenedor no se destruye
     entre una ficha y otra, solo su contenido. */
  var observadorConsulta = null;
  var pendienteConsulta = null;

  function programarModoConsulta() {
    if (pendienteConsulta) clearTimeout(pendienteConsulta);
    pendienteConsulta = setTimeout(function () { pendienteConsulta = null; aplicarModoConsulta(); }, 30);
  }

  function asegurarObservadorConsulta() {
    if (observadorConsulta) return;
    var raiz = $('ficha-asunto-cuerpo');
    if (!raiz) return;
    observadorConsulta = new MutationObserver(programarModoConsulta);
    observadorConsulta.observe(raiz, { childList: true, subtree: true });
  }

  /* Los relacionados se pintan y se guardan enteramente en
     js/relacionados.js: aquí solo se le da el hueco. Si por lo que
     sea ese fichero no ha cargado, el hueco se queda con "Leyendo…"
     y no rompe el resto de la ficha. */
  function pintarRelacionados(a, abierto) {
    var caja = $('ficha-relacionados');
    if (!caja || !window.Relacionados) return;
    window.Relacionados.pintarEnFicha(caja, a, abierto, function () {
      pintarRelacionados(a, abierto);
    });
  }

  /* Los campos configurados en Ajustes para el tipo de este asunto,
     con el valor que se guardó al crearlo o al editarlo, uno por
     línea. Solo los que traen valor: un campo vacío no se enseña. Se
     enseñan en el orden de Ajustes; si alguno se guardó con una clave
     que ya no está en la configuración de hoy (se quitó del tipo, o
     se borró el campo propio), se enseña igual al final, con su clave
     como título, para no perder el dato. */
  function filasDeCampos(a) {
    var guardados = (a.ficha && a.ficha.campos) || {};
    var tipo = tipoDe(a);
    var config = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
    var vistos = {};
    var salida = [];
    config.forEach(function (cfg) {
      var clave = Campos.claveDeCampo(cfg);
      vistos[clave] = true;
      var g = guardados[clave];
      if (g && g.valor) salida.push({ titulo: Campos.nombreDeCampo(cfg, App.E.campos), valor: g.valor });
    });
    Object.keys(guardados).forEach(function (clave) {
      if (vistos[clave]) return;
      var g = guardados[clave];
      if (g && g.valor) salida.push({ titulo: clave, valor: g.valor });
    });
    return salida;
  }

  /* "Datos del trámite" (18-sep-2026, fila 51, docs/FICHA-DISPOSICION.md,
     5): ya no repite nada que se vea en otro sitio de la pantalla
     (cabecera, marcas, "Datos y contacto", la línea gris de arriba).
     Solo quedan los campos propios del tipo, la vía, "Lo pide" y en
     qué carpeta del ARCHIVO está. Sin ninguna fila, devuelve null: el
     bloque entero no se pinta, ni el título ni la tarjeta. */
  function datosDelAsunto(a) {
    var f = a.ficha || {};
    var buenas = filasDeCampos(a).concat([
      { titulo: 'Vía de comunicación', valor: App.textoVia(f) },
      { titulo: 'Lo pide', valor: window.LoPide ? LoPide.texto(f) : '' },
      { titulo: 'En el archivo', valor: a.ruta || '' }
    ]).filter(function (x) { return x && x.valor; });
    return buenas.length ? filasHtml(buenas) : null;
  }

  /* ---------- "Lo pide": quién ha pedido esta gestión ----------

     17-sep-2026, fila 28, docs/LO-PIDE.md. Los controles y la lógica
     de verdad viven en js/lo-pide.js; aquí solo se abre el cuadro, se
     busca la persona del tercero (misma búsqueda que pintarContacto,
     un poco más abajo) para ofrecer sus tutores, y se guarda con
     App.anotar. */

  async function personaDelTerceroLoPide(a) {
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var quien = nombreDelTercero(a);
    if (!categoria || !quien || !App.E.datos) return null;
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, quien, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      return lista.length ? lista[0] : null;
    } catch (e) { return null; }
  }

  async function abrirLoPide(a) {
    var persona = await personaDelTerceroLoPide(a);
    var tieneDato = !!(a.ficha.loPide && a.ficha.loPide.nombre);
    var pieQuitar = tieneDato
      ? '<button type="button" class="boton" id="lopide-quitar" style="margin-top:10px">Quitar el dato</button>'
      : '';
    var promesa = U.preguntar('Lo pide',
      '<p class="explica">Quién ha pedido esta gestión, por qué vía y en qué fecha.</p>' +
      '<div id="lopide-caja-ficha"></div>' + pieQuitar, 'Guardar');
    var caja = $('lopide-caja-ficha');
    var controles = LoPide.controles(caja, persona, a.ficha.loPide || null);

    var quitado = false;
    var btnQuitar = $('lopide-quitar');
    if (btnQuitar) {
      btnQuitar.onclick = function () { quitado = true; $('cuadro-cancelar').click(); };
    }

    var ok = await promesa;
    if (quitado) {
      /* `loPide: null`, no `undefined`: App.anotar hace Object.assign, y
         undefined no borra nada (docs/LO-PIDE.md, 1). */
      await App.anotar(a.nombre, { loPide: null });
      return;
    }
    if (!ok) return;
    await App.anotar(a.nombre, { loPide: controles.leer() });
  }

  /* ---------- la barra de botones ----------

     Son los mismos de la tarjeta. Al terminar cada uno se repinta la
     ficha, y los que mueven o renombran la carpeta devuelven a la
     lista, porque el asunto ya no se llama igual. */

  function pintarAcciones(a, abierto, p) {
    var caja = $('ficha-acciones');
    caja.innerHTML = '';

    if (abierto) {
      var sel = document.createElement('select');
      sel.className = 'campo campo-estado';
      sel.title = 'Estado del asunto';
      var situacion = a.ficha.situacion || '';
      var lista = App.E.estados.map(function (e) { return e.nombre; });
      if (situacion && lista.indexOf(situacion) === -1) lista.push(situacion);
      sel.innerHTML = '<option value="">Sin estado</option>' +
        lista.map(function (e) {
          return '<option value="' + U.escapar(e) + '"' + (e === situacion ? ' selected' : '') +
                 '>' + U.escapar(e) + '</option>';
        }).join('');
      sel.onchange = async function () {
        await U.mientrasGuarda(sel, function () { return App.ponerEstado(a, sel.value); });
        pintar();
      };
      caja.appendChild(sel);

      var v = Nombres.via(a.ficha.via);
      var bvia = boton('', App.textoVia(a.ficha) || 'Por dónde prefiere que le hablemos',
        async function (ev) {
          await U.mientrasGuarda(ev.currentTarget, function () { return App.editarVia(a); });
          pintar();
        }, !!a.ficha.via);
      bvia.innerHTML = dibujoVia(a.ficha.via) + '<span>' + U.escapar(v ? v.corto : 'Vía') + '</span>';
      bvia.classList.add('boton-con-dibujo');
      caja.appendChild(bvia);

      caja.appendChild(boton(p ? 'Plazo ✓' : 'Plazo', 'Poner o cambiar la fecha límite',
        async function (ev) {
          await U.mientrasGuarda(ev.currentTarget, function () { return App.editarPlazo(a); });
          pintar();
        }, !!p));

      if (window.LoPide) {
        var tieneLoPide = !!(a.ficha.loPide && a.ficha.loPide.nombre);
        caja.appendChild(boton(tieneLoPide ? 'Lo pide ✓' : 'Lo pide',
          'Quién ha pedido esta gestión, por qué vía y en qué fecha',
          async function (ev) {
            await U.mientrasGuarda(ev.currentTarget, function () { return abrirLoPide(a); });
            pintar();
          }, tieneLoPide));
      }

      caja.appendChild(boton('Editar', 'Cambiar la fecha, el tipo, la descripción o el tercero',
        async function () { await App.editarAsunto(a); volverALaLista(); }));
    }

    caja.appendChild(boton('Copiar nombre', 'Para pegarlo como asunto del correo', function () {
      navigator.clipboard.writeText(a.nombre).then(function () {
        U.aviso('Nombre copiado.', 'bueno');
      });
    }));

    caja.appendChild(boton('Gestionar documentos', 'Nombrar y archivar los documentos de la carpeta',
      async function () { await App.verDocumentos(a); pintarDocumentos(a); }));

    var cerrar = boton(abierto ? 'Archivar el asunto' : 'Reabrir el asunto',
      abierto ? 'Llevar la carpeta al ARCHIVO' : '', async function (ev) {
      await U.mientrasGuarda(ev.currentTarget, function () {
        return abierto ? App.cerrarAsunto(a) : App.reabrirAsunto(a);
      });
      volverALaLista();
    });
    cerrar.classList.add('boton-principal');
    caja.appendChild(cerrar);

    /* Borrar el asunto entero, con papelera (11-sep-2026). Solo desde
       aquí, y solo si está abierto: en el ARCHIVO no hay botón, y en la
       tarjeta de la lista tampoco (BOTONES_DE_LA_TARJETA, más arriba). */
    if (abierto && window.Papelera) {
      var borrarAsunto = window.Papelera.botonBorrar(async function () {
        var docs = [];
        try { docs = await Carpetas.ficheros(a.handle); } catch (e) { docs = []; }
        var ok = await window.Papelera.preguntarBorrar(a.nombre,
          docs.length ? '<p class="nota">Se lleva ' + docs.length + ' documento' +
            (docs.length === 1 ? '' : 's') + '.</p>' : '');
        if (!ok) return;
        if (docs.length) {
          var seguro = await U.preguntar(a.nombre, '<p>¿Seguro?</p>', 'Sí, a la papelera');
          if (!seguro) return;
        }
        borrarAsunto.disabled = true;
        try {
          await Papelera.mandarAsunto(a);
          U.aviso('Asunto mandado a la papelera.', 'bueno');
          volverALaLista();
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
          borrarAsunto.disabled = false;
        }
      });
      caja.appendChild(borrarAsunto);
    }
  }

  /* ---------- el dibujo de la vía de comunicación ----------

     Un botón que pone "Vía" no dice nada de un vistazo. Cada vía
     lleva su dibujo: un teléfono, un sobre, una pantalla o una
     persona. Sin vía puesta, el bocadillo de hablar. */
  var DIBUJOS_VIA = {
    TELEFONO: '<path d="M6.5 3.5h3l1.5 3.7-2 1.4a11 11 0 0 0 4.4 4.4l1.4-2 3.7 1.5v3a1.5 1.5 0 0 1-1.7 1.5C11.4 16.3 7.7 12.6 5 6.2A1.5 1.5 0 0 1 6.5 3.5z"/>',
    CORREO: '<rect x="3" y="5.5" width="18" height="13" rx="1.6"/><path d="M3.6 6.4 12 12.6l8.4-6.2"/>',
    IPASEN: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2"/><path d="M10.5 18.6h3"/>',
    PRESENCIAL: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20.2c.6-3.5 3.3-5.4 6.5-5.4s5.9 1.9 6.5 5.4"/>',
    '': '<path d="M4 5.6A1.6 1.6 0 0 1 5.6 4h12.8A1.6 1.6 0 0 1 20 5.6v8.3a1.6 1.6 0 0 1-1.6 1.6H9.2L5 19.4v-3.9h-.4A.6.6 0 0 1 4 14.9z"/>'
  };

  function dibujoVia(clave) {
    var d = DIBUJOS_VIA[clave || ''] || DIBUJOS_VIA[''];
    return '<svg class="via-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           d + '</svg>';
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

  /* ---------- el tipo que no está en la lista ----------

     Los asuntos de antes traen tipos que nadie ha dado de alta. Desde
     aquí se añaden a la lista del centro sin ir a Ajustes. */

  function pintarAvisoDeTipo(a, tipo) {
    var caja = $('ficha-aviso-tipo');
    if (!caja) return;
    caja.innerHTML = '';
    if (!tipo || (a.leido && a.leido.reconocido)) return;

    caja.className = 'aviso aviso-ambar';
    caja.innerHTML = '<strong>El tipo ' + U.escapar(tipo) + ' no está en la lista del centro.</strong>' +
      '<p>Mientras no esté, este asunto no tiene guía, ni plazo de tipo, ni sale ' +
      'al elegir tipo en un asunto nuevo.</p>';

    var fila = document.createElement('div');
    fila.className = 'alta-tipo';

    var cat = document.createElement('select');
    cat.className = 'campo';
    cat.style.maxWidth = '180px';
    cat.innerHTML = Nombres.CATEGORIAS.map(function (c) {
      var elegida = (a.ficha && a.ficha.categoria) === c;
      return '<option value="' + c + '"' + (elegida ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
    fila.appendChild(cat);

    fila.appendChild(boton('Añadir ' + tipo + ' a la lista', '', async function () {
      await anadirTipo(tipo, cat.value);
    }));

    caja.appendChild(fila);
  }

  async function anadirTipo(tipo, categoria) {
    var nombre = U.limpiarNombre(tipo).toUpperCase();
    if (!nombre) return;
    var repetido = App.E.tipos.some(function (t) {
      return U.normalizar(t.tipo) === U.normalizar(nombre);
    });
    if (repetido) { U.aviso('Ese tipo ya está en la lista.', 'malo'); return; }
    try {
      App.E.tipos.push({ tipo: nombre, categoria: categoria });
      await App.guardarTipos();
      /* App.verAbiertos ya reengancha sola la ficha (más arriba en
         este fichero): no hace falta repetir aquí el apaño de volver
         a coger el asunto de la lista fresca. */
      await App.verAbiertos();
      U.aviso('Tipo ' + nombre + ' añadido a la lista.', 'bueno');
    } catch (e) {
      U.aviso('No he podido añadirlo: ' + e.message, 'malo');
    }
  }

  /* ---------- el enlace de escribir o cambiar la guía ----------

     Los pasos de la guía SON los hitos (docs/HITOS-SON-LA-GUIA.md):
     ya no se leen aquí como texto con casillas, eso lo pinta
     js/hitos-panel.js dentro de este mismo #ficha-guia. Esta función
     deja solo el <p class="nota" id="ficha-guia-nota"> del final, con
     el botón de escribir o cambiar la guía del tipo; es tramitando un
     asunto cuando uno se da cuenta de qué pasos faltan, y hasta el
     10-sep-2026 había que salir a Ajustes para apuntarlos.

     hitos-panel.js localiza esta nota por su id y la conserva al
     repintar el resto de #ficha-guia. */
  function pintarGuia(a, tipo, abierto) {
    var caja = $('ficha-guia');
    if (!caja) return;
    /* Solo se toca la nota, nunca el resto de #ficha-guia: eso es de
       js/hitos-panel.js, y puede que ya haya pintado ahí la lista de
       hitos (por ejemplo, al volver a llamar desde el propio botón de
       más abajo, después de escribir la guía). */
    var anterior = $('ficha-guia-nota');
    if (anterior && anterior.parentNode === caja) anterior.remove();
    if (!abierto || !tipo || !window.GuiasDelCentro) return;

    var pasos = window.GuiasDelCentro.pasosDe(tipo);
    var fila = document.createElement('p');
    fila.className = 'nota';
    fila.id = 'ficha-guia-nota';

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton';
    b.textContent = pasos.length ? 'Cambiar la guía' : ('Escribir la guía de ' + tipo);
    b.onclick = async function () {
      b.disabled = true;
      var hecho = await window.GuiasDelCentro.escribir(tipo);
      b.disabled = false;
      if (hecho) {
        pintarGuia(a, tipo, abierto);
        if (window.HitosPanel) window.HitosPanel.programarRepintado();
      }
    };
    fila.appendChild(b);

    var aviso = document.createElement('span');
    aviso.className = 'suave';
    aviso.style.marginLeft = '8px';
    aviso.textContent = 'Vale para todos los asuntos ' + tipo + ', no solo para este.';
    fila.appendChild(aviso);

    caja.appendChild(fila);
  }

  /* ---------- las notas, escritas aquí mismo ----------

     La caja de escribir directa (guardado automático, sin botón) y su
     lista viven en js/notas.js (`Notas.pintarEnFicha`, fila 37,
     17-sep-2026): aquí solo se le da el hueco, como con los documentos
     o los relacionados. Se llama también por su cuenta (al asociar un
     sello, al borrar un documento con nota). */
  function pintarNotas(a, abierto) {
    if (!window.Notas) return;
    /* `apuntarHuella` como cuarto argumento: el guardado automático de
       la nota cambia `a.ficha` por dentro (fila 37), y sin volver a
       apuntar la huella aquí mismo el próximo repintado en segundo
       plano se creería que algo ha cambiado de verdad y rehace la
       ficha entera sin hacer falta. */
    return window.Notas.pintarEnFicha($('ficha-notas'), a, abierto, apuntarHuella);
  }

  /* ---------- "Datos y contacto" del tercero ----------

     La línea resumen y la ventana "Ver todo" viven en
     js/ficha-tercero.js (fila 37, 17-sep-2026,
     docs/FICHA-DEL-ASUNTO-NUEVA.md): busca al tercero en el mismo
     fichero de datos que usa la pantalla de Personas, y se habla con
     esta ficha solo por `FichaTercero.pintarLinea(caja, a)`, igual que
     `FichaDocumentos.pintar`, para no engordar más este fichero. */
  function pintarContacto(a) {
    if (!window.FichaTercero) return;
    return window.FichaTercero.pintarLinea($('ficha-contacto-caja'), a);
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

  /* El bloque en sí, el salto a otro asunto del mismo tercero y la
     vuelta al de partida viven en js/otros-del-tercero.js (17-sep-2026,
     fila 40, docs/SALTAR-A-OTRO-ASUNTO.md), para no engordar más este
     fichero. Aquí solo se cuelga el hueco, con la categoría, el
     tercero y el tipo ya calculados; si el módulo no ha cargado, el
     hueco se queda como está y la ficha no se rompe. */
  function pintarOtrosDelTercero(a) {
    var caja = $('ficha-otros');
    if (!caja || !window.OtrosDelTercero) return;
    var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    OtrosDelTercero.pintarEnFicha(caja, a, modoActual,
      { categoria: categoria, tercero: nombreDelTercero(a), tipo: tipoDe(a) });
  }

  /* ---------- los documentos que hay en la carpeta ----------

     Van en dos grupos: los papeles del expediente y lo que ha llegado
     por correo. Mezclados, la solicitud se pierde entre hilos y
     adjuntos, que son los que más se acumulan. Vive en
     js/ficha-documentos.js (17-sep-2026, fila 26: se separa de aquí al
     quitarle trabajo la fila "los hitos son la guía"); aquí solo el
     puente, y el repintado de notas que puede hacer falta tras un
     borrado (un documento con nota de registro, por ejemplo). */

  async function repintarNotasTrasDocumento(a) {
    if (!window.Notas) return;
    a.ficha.notas = await window.Notas.frescas(a);
    pintarNotas(a, modoActual === 'abierto');
  }

  function pintarDocumentos(a) {
    if (!window.FichaDocumentos) return;
    FichaDocumentos.pintar(a, function () { return repintarNotasTrasDocumento(a); });
  }

})();
