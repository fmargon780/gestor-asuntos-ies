/* ============================================================
   ficha-asunto.js — la pantalla de un asunto.

   Al pulsar el nombre de un asunto se entra aquí. En una sola
   pantalla está todo lo suyo: sus datos, el contacto del tercero, sus
   hitos, sus notas, sus documentos y los demás asuntos de ese mismo
   tercero. Y todos los botones de siempre, sin volver a la lista.

   Este fichero no guarda nada por su cuenta: para cambiar el estado,
   la vía, el plazo, el nombre o el archivado llama a lo que ya hace
   la aplicación. Así no hay dos sitios que hagan lo mismo.

   Como aquí dentro está todo, la tarjeta de la lista se queda con el
   desplegable del estado, "Copiar nombre" y "Archivar". Esa poda
   también se hace aquí, un poco más abajo.

   El contacto del tercero y sus otros asuntos viven en
   js/ficha-contacto.js (sacados de aquí el 17-sep-2026, fila 26, para
   no dejar crecer más este fichero); los hitos —lo que hoy pinta
   #ficha-guia— viven enteros en js/hitos-panel.js y
   js/hitos-panel-lista.js: este fichero solo deja el hueco.
   ============================================================ */
(function () {

  var actual = null;      /* el asunto que se está viendo */
  var modoActual = 'abierto';

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
    App.ir(modoActual === 'archivado' ? 'archivo' : 'abiertos');
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

  function filas(lista) {
    var buenas = lista.filter(function (f) { return f && f.valor; });
    if (!buenas.length) return '<p class="explica">Nada que enseñar aquí.</p>';
    return '<div class="ficha-datos">' + buenas.map(function (f) {
      return '<div class="ficha-dato"><span>' + U.escapar(f.titulo) + '</span>' +
             '<span>' + U.escapar(f.valor) + '</span></div>';
    }).join('') + '</div>';
  }

  function pintar() {
    var a = actual;
    var caja = $('ficha-asunto-cuerpo');
    if (!a || !caja) return;
    var abierto = (modoActual === 'abierto');
    var situacion = a.ficha.situacion || '';
    var p = abierto ? App.plazoDe(a) : null;
    var tipo = tipoDe(a);

    caja.innerHTML =
      '<header class="ficha-cabecera">' +
        '<button type="button" class="boton" id="ficha-volver">← Volver a la lista</button>' +
        '<div class="ficha-marcas">' +
          (tipo ? '<span class="marca-tipo">' + U.escapar(tipo) + '</span>' : '') +
          (situacion ? '<span class="marca-estado ' + App.colorEstado(situacion) + '">' +
                       U.escapar(situacion) + '</span>' : '') +
          (p ? '<span class="marca-plazo ' + p.clase + '">' + U.escapar(p.texto) + '</span>' : '') +
        '</div>' +
        '<h2 class="ficha-nombre">' + U.escapar(a.nombre) + '</h2>' +
      '</header>' +
      '<div id="ficha-presencia"></div>' +
      '<div id="ficha-sellos"></div>' +
      '<div id="ficha-aviso-tipo"></div>' +
      '<div class="ficha-acciones" id="ficha-acciones"></div>' +
      '<div class="ficha-columnas">' +
        '<div class="ficha-izquierda">' +
          bloque('Hitos', '<div id="ficha-guia" class="explica">Leyendo…</div>') +
          bloque('Notas', '<div id="ficha-notas"></div>') +
        '</div>' +
        '<div class="ficha-derecha">' +
          bloque('Documentos de la carpeta',
                 '<div id="ficha-documentos" class="explica">Leyendo…</div>', null,
                 '<span class="ficha-cuenta" id="ficha-cuenta-docs"></span>') +
          bloque('Otros asuntos de este tercero',
                 '<div id="ficha-otros" class="explica">Buscando…</div>') +
          bloque('Personas y entidades relacionadas',
                 '<div id="ficha-relacionados" class="explica">Leyendo…</div>') +
          bloque('Datos del asunto', datosDelAsunto(a, p)) +
          '<div id="ficha-contacto-caja"></div>' +
        '</div>' +
      '</div>';

    $('ficha-volver').onclick = volverALaLista;

    pintarAcciones(a, abierto, p);
    pintarNotas(a, abierto);
    pintarAvisoDeTipo(a, tipo);
    if (window.FichaContacto) window.FichaContacto.pintarContacto(a);
    pintarDocumentos(a);
    if (window.FichaContacto) window.FichaContacto.pintarOtros(a);
    pintarRelacionados(a, abierto);
    pintarPresencia();
    pintarSellos(a);
    asegurarObservadorConsulta();
    aplicarModoConsulta();
  }

  /* Los hitos —lo que sale dentro de #ficha-guia— se pintan solos,
     desde js/hitos-panel.js: envuelve App.abrirFicha (arriba) y vigila
     #ficha-asunto-cuerpo con su propio MutationObserver, así que este
     fichero no tiene que llamar a nada más para que aparezcan. */

  /* ---------- no pisarse en un mismo asunto (17-sep-2026, fila 24) ----------

     El aviso, arriba del todo, y el botón de tomar el mando. Apagar
     los controles que modifican es cosa de aplicarModoConsulta, un
     poco más abajo: entre los dos no hace falta tocar nada de lo que
     ya pinta cada bloque (hitos, notas, correo, plantillas...). */

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
     los hitos, los documentos, los relacionados son async, y "Generar
     documento" y "Correo" se cuelgan por su cuenta, con su propio
     MutationObserver o con un pequeño retraso. Aplicar el modo
     consulta una sola vez, al final de `pintar()`, se comería todo lo
     que sale después. Un observador sobre el propio
     #ficha-asunto-cuerpo (el mismo patrón que js/hitos-panel.js, con
     el mismo aviso de docs/CONTEXTO.md sobre los MutationObserver) lo
     vuelve a aplicar cada vez que aparece algo nuevo. Solo se observa
     una vez: el contenedor no se destruye entre una ficha y otra,
     solo su contenido. */
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

  function datosDelAsunto(a, p) {
    var f = a.ficha || {};
    return filas([
      { titulo: 'Abierto el', valor: a.leido.fecha ? U.fechaLegible(a.leido.fecha) : '' },
      { titulo: 'Tipo', valor: tipoDe(a) },
      { titulo: 'Tercero', valor: f.tercero || a.leido.resto || '' },
      { titulo: 'Categoría', valor: f.categoria || a.leido.categoria || '' },
      { titulo: 'Año académico', valor: f.curso || a.leido.curso || '' },
      { titulo: 'Descripción', valor: f.descripcion || '' }
    ].concat(filasDeCampos(a)).concat([
      { titulo: 'Estado', valor: f.situacion || 'Sin estado' },
      { titulo: 'Vía de comunicación', valor: App.textoVia(f) },
      { titulo: 'Fecha límite', valor: p ? Plazos.legible(p.limite) + ' · ' + p.texto : '' },
      { titulo: 'Lo abrió', valor: f.abiertoPor || '' },
      { titulo: 'En el archivo', valor: a.ruta || '' }
    ]));
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
      await App.verAbiertos();
      /* La carpeta se lee otra vez, así que hay que volver a coger el
         asunto: el de antes ya no es el mismo objeto. */
      var mismo = App.E.listaAbiertos.filter(function (x) { return x.nombre === actual.nombre; })[0];
      if (mismo) actual = mismo;
      pintar();
      U.aviso('Tipo ' + nombre + ' añadido a la lista.', 'bueno');
    } catch (e) {
      U.aviso('No he podido añadirlo: ' + e.message, 'malo');
    }
  }

  /* ---------- las notas, escritas aquí mismo ---------- */

  function pintarNotas(a, abierto) {
    var caja = $('ficha-notas');
    if (!caja || !window.Notas) return;
    var notas = window.Notas.de(a);

    caja.innerHTML =
      (abierto
        ? '<div class="nota-nueva">' +
            '<textarea id="ficha-nota-texto" class="campo" rows="2" ' +
              'placeholder="Qué ha pasado hoy en este asunto"></textarea>' +
            '<div class="nota-botonera">' +
              '<span class="nota-aviso" id="ficha-nota-aviso">Las notas no se borran.</span>' +
              '<button type="button" id="ficha-nota-anadir" class="boton boton-principal">Añadir nota</button>' +
            '</div>' +
          '</div>'
        : '<p class="explica">Asunto archivado: las notas se leen, pero ya no se escriben.</p>') +
      '<div id="ficha-notas-lista" class="notas-lista">' + window.Notas.pintar(notas) + '</div>';

    if (!abierto) return;

    var campo = $('ficha-nota-texto');
    var boton = $('ficha-nota-anadir');
    var guardando = false;

    async function guardar() {
      var texto = (campo.value || '').trim();
      if (!texto || guardando) return;
      guardando = true;
      boton.disabled = true;
      try {
        var lista = await window.Notas.anadir(a, texto);
        campo.value = '';
        $('ficha-notas-lista').innerHTML = window.Notas.pintar(lista);
        $('ficha-nota-aviso').textContent = lista.length === 1
          ? '1 nota guardada.' : lista.length + ' notas guardadas.';
      } catch (e) {
        U.aviso('No he podido guardar la nota: ' + e.message, 'malo');
      }
      boton.disabled = false;
      guardando = false;
    }

    boton.onclick = guardar;
    campo.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); guardar(); }
    };
  }

  /* ---------- los documentos que hay en la carpeta ----------

     Van en dos grupos: los papeles del expediente y lo que ha llegado
     por correo. Mezclados, la solicitud se pierde entre hilos y
     adjuntos, que son los que más se acumulan. */

  /* Lo que la aplicación mete cuando entra un correo: el hilo en PDF
     (CORREO, y HILO en las primeras versiones) y sus adjuntos. */
  var DE_CORREO = /(^|[\s_-])(CORREO|HILO|ADJUNTO)([\s_.\-(]|$)/i;

  function esDeCorreo(nombre) {
    return DE_CORREO.test(String(nombre || ''));
  }

  /* El nombre empieza por la fecha, así que por orden alfabético
     quedan en orden de antigüedad. */
  function porNombre(a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  }

  function filaDeDocumento(f, a) {
    var ext = Nombres.extensionDe(f.nombre);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ficha-documento';
    b.title = 'Verlo al lado del programa';
    b.innerHTML = (ext ? '<span class="marca-ext">' + U.escapar(ext.toUpperCase()) + '</span>' : '') +
                  '<span>' + U.escapar(f.nombre) + '</span>';
    b.onclick = function () { abrirDocumento(f); };

    var fila = document.createElement('div');
    fila.className = 'ficha-documento-fila';
    fila.appendChild(b);

    if (window.Registro && !Registro.tieneRegistro(f.nombre)) {
      var pendiente = Registro.pendiente(a, f.nombre);
      if (pendiente) {
        var marca = document.createElement('span');
        marca.className = 'marca-sin-registrar';
        marca.textContent = 'Sin registrar';
        fila.appendChild(marca);
      }

      var reg = document.createElement('button');
      reg.type = 'button';
      reg.className = 'boton' + (pendiente ? ' boton-ambar' : '');
      reg.title = 'Dar registro de entrada o salida a este documento';
      reg.textContent = 'Registrar';
      reg.onclick = async function () {
        reg.disabled = true;
        await Registro.abrirCuadro(a, f.nombre, function () { pintarDocumentos(a); });
        reg.disabled = false;
      };
      fila.appendChild(reg);
    }

    /* Separar, Unir y Sacar páginas (17-sep-2026, fila 22,
       docs/SEPARAR-Y-UNIR-PDF.md): solo para PDF. */
    if (window.PdfSepararUnir && window.PdfHerramientas && PdfHerramientas.esPdf(f.nombre, '')) {
      function botonPdf(texto, ayuda, accion) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'boton';
        boton.title = ayuda;
        boton.textContent = texto;
        boton.onclick = function () {
          accion({
            modo: 'asunto', dir: a.handle, nombre: f.nombre, handle: f.handle, asunto: a,
            alTerminar: function () { pintarDocumentos(a); }
          });
        };
        return boton;
      }
      fila.appendChild(botonPdf('Separar', 'Partirlo en varios documentos', PdfSepararUnir.separar));
      fila.appendChild(botonPdf('Unir', 'Juntarlo con otro PDF del asunto', PdfSepararUnir.unir));
      fila.appendChild(botonPdf('Sacar páginas', 'Sacar una copia con solo algunas páginas', PdfSepararUnir.sacarPaginas));
    }

    /* Borrar, con papelera (11-sep-2026): siempre el último, separado
       de lo demás. */
    if (window.Papelera) {
      var borrar = window.Papelera.botonBorrar(async function () {
        var ok = await window.Papelera.preguntarBorrar(f.nombre);
        if (!ok) return;
        borrar.disabled = true;
        try {
          await Papelera.mandarDocumentoDeAsunto(a, f.nombre);
          U.aviso('Documento mandado a la papelera.', 'bueno');
          pintarDocumentos(a);
          if (window.Notas) {
            a.ficha.notas = await window.Notas.frescas(a);
            pintarNotas(a, modoActual === 'abierto');
          }
        } catch (e) {
          U.aviso('No he podido mandarlo a la papelera: ' + e.message, 'malo');
          borrar.disabled = false;
        }
      });
      fila.appendChild(borrar);
    }

    return fila;
  }

  function grupoDeDocumentos(caja, titulo, ficheros, conRotulo, a) {
    if (!ficheros.length) return;
    if (conRotulo) {
      var r = document.createElement('div');
      r.className = 'ficha-grupo-docs';
      r.textContent = titulo + '  (' + ficheros.length + ')';
      caja.appendChild(r);
    }
    ficheros.sort(porNombre).forEach(function (f) { caja.appendChild(filaDeDocumento(f, a)); });
  }

  async function pintarDocumentos(a) {
    var caja = $('ficha-documentos');
    var cuenta = $('ficha-cuenta-docs');
    if (!caja) return;
    try {
      var lista = await Carpetas.ficheros(a.handle);
      if (cuenta) cuenta.textContent = lista.length || '';
      if (!lista.length) {
        caja.className = 'explica';
        caja.textContent = 'La carpeta todavía está vacía.';
        return;
      }
      caja.className = 'ficha-documentos';
      caja.innerHTML = '';

      var correos = lista.filter(function (f) { return esDeCorreo(f.nombre); });
      var expediente = lista.filter(function (f) { return !esDeCorreo(f.nombre); });

      /* Con un solo grupo no hacen falta rótulos: sobran. */
      var conRotulo = correos.length > 0 && expediente.length > 0;
      grupoDeDocumentos(caja, 'Del expediente', expediente, conRotulo, a);
      grupoDeDocumentos(caja, 'Llegados por correo', correos, conRotulo, a);
    } catch (e) {
      caja.className = 'explica';
      caja.textContent = 'No he podido leer la carpeta: ' + e.message;
    }
  }

  /* Se abre en la columna de la derecha, al lado del programa, para
     poder trabajar con el papel delante. */
  async function abrirDocumento(f) {
    if (window.Visor) return window.Visor.abrir(f.handle, f.nombre);
    try {
      var fichero = await f.handle.getFile();
      var url = URL.createObjectURL(fichero);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      U.aviso('No he podido abrirlo: ' + e.message, 'malo');
    }
  }

})();
