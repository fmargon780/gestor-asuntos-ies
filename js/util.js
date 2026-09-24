/* ============================================================
   util.js — piezas sueltas que usa todo lo demás.
   ============================================================ */
var U = (function () {

  /* ---------- envolver (19-sep-2026, fila 70, docs/ENVOLTURAS-COMPROBADAS.md) ----------

     La aplicación se construye "envolviendo" funciones: un fichero
     guarda la que había y la sustituye por otra suya que llama a la
     vieja por dentro. Eso solo funciona si el fichero que envuelve se
     carga DESPUÉS del que define la función, y hasta ahora, si el
     orden fallaba, la envoltura no se aplicaba y no salía ningún
     aviso.

     U.envolver(objeto, nombre, fichero, hacerNueva) hace lo mismo de
     siempre, pero apuntado:
       - objeto: el objeto que tiene la función (App, Datos, un
         elemento del DOM...).
       - nombre: el nombre completo, para que se lea en la lista
         ("App.abrirFicha", "Datos.cargar", "boton(#btn-crear).onclick").
         Solo se usa el trozo después del último punto para buscar la
         función de verdad en el objeto.
       - fichero: el fichero que envuelve (su propio nombre, a mano:
         no hay manera fiable de adivinarlo en todos los sitios donde
         esto se usa, incluidas las pruebas sin navegador).
       - hacerNueva(comoEra): recibe la función de antes y devuelve la
         nueva. Si no la devuelve (porque `comoEra` no era una función,
         o porque `hacerNueva` falla), la envoltura queda como fallo,
         apuntado, y NO SE TOCA `objeto[nombre]`: exactamente lo mismo
         que pasaba antes en silencio, solo que ahora queda dicho.

     Ver `js/envolturas-esperadas.js` (se carga el último de todos) y
     Ajustes → Mantenimiento para la lista completa. */
  var _envolturasAplicadas = [];
  var _envolturasFallidas = [];

  function envolver(objeto, nombre, fichero, hacerNueva) {
    var prop = String(nombre || '').slice(String(nombre || '').lastIndexOf('.') + 1);
    var comoEra = (objeto && prop) ? objeto[prop] : undefined;
    if (typeof comoEra !== 'function') {
      _envolturasFallidas.push({
        nombre: nombre, fichero: fichero,
        motivo: 'no existe "' + prop + '" en el objeto, o no es una función'
      });
      return undefined;
    }
    var nueva;
    try {
      nueva = hacerNueva(comoEra);
    } catch (e) {
      _envolturasFallidas.push({
        nombre: nombre, fichero: fichero,
        motivo: 'al construir la envoltura ha saltado un error: ' + ((e && e.message) || e)
      });
      return undefined;
    }
    if (typeof nueva !== 'function') {
      _envolturasFallidas.push({
        nombre: nombre, fichero: fichero,
        motivo: 'lo que se iba a poner en su lugar no es una función'
      });
      return undefined;
    }
    objeto[prop] = nueva;
    _envolturasAplicadas.push({ nombre: nombre, fichero: fichero });
    return nueva;
  }

  /* Copias, para que nadie de fuera pueda tocar las listas de verdad. */
  function envolturasAplicadas() { return _envolturasAplicadas.slice(); }
  function envolturasFallidas() { return _envolturasFallidas.slice(); }

  /* Quita tildes, sobra de espacios y mayúsculas. Sirve para comparar y buscar. */
  function normalizar(v) {
    return String(v === null || v === undefined ? '' : v)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim().toLowerCase();
  }

  /* Windows no admite estos caracteres en el nombre de una carpeta.
     Tampoco se puede terminar en punto ni en espacio. */
  function limpiarNombre(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/[\\/:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/, '')
      .trim();
  }

  /* Fecha de hoy en formato AAAA-MM-DD, que es el que entiende el campo de fecha. */
  function hoyIso() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  /* AAAA-MM-DD  ->  AAMMDD, que es como empiezan los nombres de las carpetas. */
  function aAaMmDd(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return p[0].slice(2) + p[1] + p[2];
  }

  /* AAMMDD -> texto legible. */
  function fechaLegible(aammdd) {
    if (!/^\d{6}$/.test(aammdd)) return '';
    return aammdd.slice(4, 6) + '/' + aammdd.slice(2, 4) + '/20' + aammdd.slice(0, 2);
  }

  var MESES_FECHA_CORTA = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* "dd/mm/aaaa" -> "10-sep-2026" (fila 71, docs/COSAS-REPETIDAS.md, 2.3:
     lo escribían igual js/bandeja-adjuntos-lector.js y
     js/documentos-sueltos-lector.js). Cadena vacía si no se entiende.

     `js/hitos-archivo.js` y `js/lo-pide.js` tienen cada uno su propio
     `fechaCorta`: no escriben la fecha igual (formatos de entrada
     distintos, y el de hitos-archivo ni siquiera pone el mes en
     letra), así que se quedan como estaban en vez de forzarlos aquí. */
  function fechaCorta(ddmmaaaa) {
    var m = String(ddmmaaaa || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    var mes = MESES_FECHA_CORTA[parseInt(m[2], 10) - 1];
    if (!mes) return '';
    return m[1] + '-' + mes + '-' + m[3];
  }

  /* El año académico al que pertenece una fecha (AAAA-MM-DD). De
     septiembre a diciembre, el que empieza; de enero a agosto, el que
     empezó el año anterior. */
  function cursoDeFecha(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var ano = parseInt(p[0], 10);
    var mes = parseInt(p[1], 10);
    if (!ano || !mes) return '';
    if (mes < 9) ano = ano - 1;
    var a = ano % 100;
    var b = (ano + 1) % 100;
    return String(a).padStart(2, '0') + '-' + String(b).padStart(2, '0');
  }

  /* El año académico que toca hoy. */
  function cursoActual() {
    return cursoDeFecha(hoyIso());
  }

  function ahora() {
    return new Date().toISOString();
  }

  /* El año en que empieza un curso -> el curso académico.
     Séneca escribe 2026 en la columna "Año de la matrícula", y eso es
     el curso 26-27. */
  function cursoDeAno(ano) {
    var a = parseInt(ano, 10);
    if (!a) return '';
    var b = (a + 1) % 100;
    return String(a % 100).padStart(2, '0') + '-' + String(b).padStart(2, '0');
  }

  /* Una fecha de Séneca (DD/MM/AAAA) pasada a Date. Devuelve null si no
     se entiende o si viene vacía. */
  function aFecha(texto) {
    var t = String(texto || '').trim();
    var esp = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    var iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (esp) return new Date(+esp[3], +esp[2] - 1, +esp[1]);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
    return null;
  }

  /* True si esa fecha ya pasó. El mismo día todavía no ha pasado: quien
     cesa hoy sigue estando hoy en el centro. */
  function yaPaso(texto) {
    var f = aFecha(texto);
    if (!f) return false;
    var hoy = new Date();
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return f.getTime() < hoy.getTime();
  }

  /* La edad que tiene hoy alguien nacido en esa fecha.
     Séneca escribe DD/MM/AAAA. Se admite también AAAA-MM-DD. */
  function edadDesde(fecha) {
    var t = String(fecha || '').trim();
    var d, m, a;
    var esp = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    var iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (esp) { d = +esp[1]; m = +esp[2]; a = +esp[3]; }
    else if (iso) { a = +iso[1]; m = +iso[2]; d = +iso[3]; }
    else return '';
    var hoy = new Date();
    var edad = hoy.getFullYear() - a;
    var mesHoy = hoy.getMonth() + 1;
    if (mesHoy < m || (mesHoy === m && hoy.getDate() < d)) edad--;
    if (edad < 0 || edad > 120) return '';
    return edad;
  }

  /* Avisos flotantes de la esquina. Nunca detienen nada. */
  /* `accion` (opcional, fila 119): { boton: 'Ir al asunto', alPulsar: fn }.
     Pone un botón en el aviso, que dura algo más (8 s) y se cierra al pulsarlo. */
  function aviso(texto, clase, accion) {
    var caja = document.getElementById('mensajes');
    var d = document.createElement('div');
    d.className = 'mensaje' + (clase ? ' ' + clase : '');
    d.textContent = texto;
    if (accion && accion.boton && typeof accion.alPulsar === 'function') {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mensaje-boton';
      b.textContent = accion.boton;
      b.onclick = function () { d.remove(); accion.alPulsar(); };
      d.appendChild(b);
    }
    caja.appendChild(d);
    setTimeout(function () { d.remove(); }, clase === 'malo' ? 9000 : (accion ? 8000 : 4500));
  }

  /* Cuadro de confirmación. Devuelve una promesa con true o false.
     Con 'sinCancelar' a true se esconde el botón de Cancelar, para los
     cuadros que solo enseñan algo. */
  /* Solo hay un #capa. Si se abre un cuadro con otro todavía esperando,
     el de antes se da por cancelado (fila 100, docs/AVISOS-QUE-DICEN-LA-VERDAD.md):
     antes su espera se quedaba colgada para siempre. */
  var cuadroEsperando = null;

  function preguntar(titulo, cuerpoHtml, textoAceptar, sinCancelar) {
    if (cuadroEsperando) { var anterior = cuadroEsperando; cuadroEsperando = null; anterior(false); }
    return new Promise(function (resolver) {
      var capa = document.getElementById('capa');
      document.getElementById('cuadro-titulo').textContent = titulo;
      document.getElementById('cuadro-cuerpo').innerHTML = cuerpoHtml;
      var aceptar = document.getElementById('cuadro-aceptar');
      var cancelar = document.getElementById('cuadro-cancelar');
      aceptar.textContent = textoAceptar || 'Aceptar';
      cancelar.classList.toggle('oculto', !!sinCancelar);
      capa.classList.remove('oculto');

      var cerrado = false;
      function cerrar(valor) {
        if (cerrado) return;
        cerrado = true;
        if (cuadroEsperando === cerrarSinTocar) cuadroEsperando = null;
        capa.classList.add('oculto');
        aceptar.onclick = null;
        cancelar.onclick = null;
        resolver(valor);
      }
      /* Lo que hace un cuadro nuevo con este: resolverlo en false sin
         esconder la capa ni quitar los botones, que ya son del nuevo. */
      function cerrarSinTocar(valor) {
        if (cerrado) return;
        cerrado = true;
        resolver(valor);
      }
      cuadroEsperando = cerrarSinTocar;
      aceptar.onclick = function () { cerrar(true); };
      cancelar.onclick = function () { cerrar(false); };
    });
  }

  /* Los tres avisos de una acción (fila 100): rojo si falla lo
     principal, verde si sale bien, y ámbar si lo principal ha salido
     bien pero falla algo de después. Siempre con mensajeDeError, en
     castellano, nunca e.message a pelo. */
  /* Por U.aviso (no por `aviso` a secas): así quien lo sustituye —las
     pruebas, por ejemplo— ve también estos. */
  function avisar(texto, clase) {
    var u = (typeof U !== 'undefined' && U && U.aviso) ? U : null;
    return u ? u.aviso(texto, clase) : aviso(texto, clase);
  }

  function fallo(texto, e) {
    avisar(texto + (e ? ': ' + mensajeDeError(e) : '.'), 'malo');
  }

  function accesorio(texto, e) {
    avisar(texto + (e ? ': ' + mensajeDeError(e) : '.'), 'ambar');
  }

  /* ============================================================
     NOMBRES QUE SE PARECEN

     Sirve para que una lista del centro —tipos de asunto, estados,
     tipos de documento— no acabe con FACTURA, Facturas y
     FACTURA-RECTIFICATIVA conviviendo. Cada nombre se reduce a su
     hueso: sin tildes, sin mayúsculas, sin espacios ni guiones ni
     puntos, y sin la S del plural. Dos nombres con el mismo hueso son
     el mismo nombre escrito de dos maneras.
     ============================================================ */

  function hueso(texto) {
    return String(texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function huesoSinPlural(texto) {
    return hueso(texto).replace(/e?s$/, '');
  }

  /* Cuántas letras hay que cambiar para pasar de una palabra a la otra.
     Sirve para cazar la errata: FACTURA y FCATURA están a dos. */
  function distancia(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var fila = [];
    for (var j = 0; j <= b.length; j++) fila[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var anterior = fila[0];
      fila[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var guardar = fila[k];
        fila[k] = Math.min(
          fila[k] + 1,
          fila[k - 1] + 1,
          anterior + (a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1)
        );
        anterior = guardar;
      }
    }
    return fila[b.length];
  }

  /* Los nombres de la lista que se parecen al que se está escribiendo.
     'igual' quiere decir que es el mismo escrito de otra manera, y
     entonces no hay nada que crear: se usa el que ya está. */
  function parecidos(nombre, lista) {
    var h = hueso(nombre);
    var hp = huesoSinPlural(nombre);
    if (!h) return [];
    var salida = [];
    (lista || []).forEach(function (t) {
      var k = hueso(t);
      var kp = huesoSinPlural(t);
      if (!k) return;
      var d = distancia(h, k);
      var largo = Math.max(h.length, k.length);
      var igual = (k === h) || (kp === hp);
      var cerca = igual ||
                  (largo >= 6 ? d <= 2 : d <= 1) ||
                  (h.length >= 4 && k.length >= 4 && (k.indexOf(h) !== -1 || h.indexOf(k) !== -1));
      if (cerca) salida.push({ nombre: t, igual: igual, distancia: d });
    });
    salida.sort(function (a, b) {
      if (a.igual !== b.igual) return a.igual ? -1 : 1;
      return a.distancia - b.distancia;
    });
    return salida;
  }

  /* La guardia completa, para las pantallas que añaden a una lista.
     Devuelve una promesa: true si se puede crear, false si no.

     - Si ya está escrito de otra manera, no deja y dice cuál es.
     - Si solo se parece, avisa y deja decidir.
     - Si no se parece a nada, pasa sin molestar. */
  function dejaCrear(nombre, lista, queEs) {
    var cerca = parecidos(nombre, lista);
    var mismo = cerca.filter(function (p) { return p.igual; })[0];
    if (mismo) {
      aviso('Ese ' + queEs + ' ya está en la lista, escrito así: ' + mismo.nombre + '.', 'malo');
      return Promise.resolve(false);
    }
    if (!cerca.length) return Promise.resolve(true);
    return preguntar('¿Es otro de verdad?',
      '<p>Vas a añadir <strong>' + escapar(nombre) + '</strong>.</p>' +
      '<p>Ya hay ' + (cerca.length === 1 ? 'uno que se le parece' : 'otros que se le parecen') + ':</p>' +
      '<ul class="lista-repetidos">' +
        cerca.slice(0, 4).map(function (p) { return '<li>' + escapar(p.nombre) + '</li>'; }).join('') +
      '</ul>' +
      '<p class="nota">Si es el mismo con otro nombre, cancela y usa el que ya está. ' +
      'La lista la veis los dos, y dos nombres para lo mismo se acaban pagando.</p>',
      'Añadirlo igualmente');
  }

  /* Traduce al castellano los errores que lanza el navegador al tocar
     el disco (17-sep-2026, fila 45): un NotFoundError en inglés no le
     dice nada a quien lo lee. Un solo sitio para traducir, por
     `e.name`; los errores nuestros ya están en castellano y se
     devuelven tal cual. Los usan `App.cerrarAsunto` y
     `App.reabrirAsunto` en su `catch`: nunca más un mensaje en inglés
     en pantalla. */
  function mensajeDeError(e) {
    var nombre = e && e.name;
    if (nombre === 'NotFoundError') {
      return 'No encuentro la carpeta o el fichero. Puede que se haya movido o que lo esté ' +
        'sincronizando Dropbox en este momento.';
    }
    if (nombre === 'NotAllowedError') {
      return 'El navegador ha retirado el permiso sobre la carpeta. Vuelve a señalarla en Ajustes.';
    }
    if (nombre === 'NoModificationAllowedError' || nombre === 'InvalidStateError') {
      return 'Hay un fichero en uso, seguramente abierto en otro programa o sincronizándose. ' +
        'Espera un momento y vuelve a intentarlo.';
    }
    if (nombre === 'QuotaExceededError') return 'No queda sitio en el disco.';
    if (nombre === 'AbortError') return 'La operación se ha interrumpido.';
    if (nombre === 'NotReadableError') {
      return 'No he podido leer un fichero: seguramente Dropbox lo estaba sincronizando. ' +
        'Espera un momento y vuelve a intentarlo.';
    }
    if (nombre === 'TypeMismatchError') return 'Hay un fichero donde tendría que haber una carpeta, o al revés.';
    if (nombre === 'SecurityError') return 'El navegador no deja hacer esto aquí. Vuelve a señalar la carpeta en Ajustes.';
    return (e && e.message) || String(e);
  }

  function escapar(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Deja un control (botón o desplegable) apagado mientras 'hacer' hace
     su trabajo, y lo devuelve a como estaba al terminar, tanto si sale
     bien como si falla. En un botón, además, el texto pasa a
     "Guardando…" mientras tanto: así se ve que la aplicación está
     haciendo algo y no se puede pulsar dos veces mientras se guarda
     (17-sep-2026, fila 23 de la cola). 'hacer' puede devolver una
     promesa o no devolver nada; el resultado se pasa tal cual. */
  /* Desde la fila 100 marca el control con `data-guardando`: el modo
     consulta de la ficha (aplicarModoConsulta) no lo vuelve a encender
     mientras dura, y un segundo clic mientras guarda no hace nada. */
  function mientrasGuarda(el, hacer) {
    if (!el) return Promise.resolve().then(hacer);
    if (el.dataset && el.dataset.guardando) return Promise.resolve();
    var esBoton = el.tagName === 'BUTTON';
    var textoDeAntes = esBoton ? el.textContent : null;
    el.disabled = true;
    if (el.dataset) el.dataset.guardando = '1';
    if (esBoton) el.textContent = 'Guardando…';
    function devolver() {
      if (el.dataset) delete el.dataset.guardando;
      el.disabled = false;
      if (esBoton) el.textContent = textoDeAntes;
    }
    return Promise.resolve().then(hacer).then(
      function (v) { devolver(); return v; },
      function (e) { devolver(); throw e; }
    );
  }

  /* ---------- un repintado no puede tirar lo que se está escribiendo ----------

     (17-sep-2026, filas 33 y 34 de la cola.) Media aplicación repinta
     bloques enteros con innerHTML, y algunos de esos bloques se
     repintan solos cada pocos segundos, sin que nadie los toque. Si
     Francisco está a media nota cuando eso pasa, lo escrito
     desaparece, y con él el foco y el cursor.

     Se envuelve el repintado con esta ayuda: antes apunta lo que hay
     escrito en cada campo de escribir de `raiz`, y después se lo
     devuelve a los que hayan vuelto a salir Y ESTÉN VACÍOS (nunca se
     pisa un valor que el propio repintado haya traído con contenido),
     más el foco y la posición del cursor al que lo tenía.

     La identidad de un campo es su `id`; si no tiene, su
     `data-clave`. Y si tampoco, quien llama puede pasar un
     `clavePara(campo)` propio que la saque de donde sepa: los hitos,
     por ejemplo, la sacan del `data-id` de su fila
     (`hito-nota-<id del hito>`), porque dentro de una misma ficha hay
     un cuerpo de hito por hito y ninguno de sus campos puede llevar
     id. Un campo del que no salga ninguna clave no se apunta: no
     habría forma de reconocerlo después del repintado.

     `hacer` puede devolver una promesa o no devolver nada; el
     resultado se pasa tal cual, y si se cae, lo escrito se devuelve
     igualmente antes de propagar el error. */

  var TIPOS_DE_ESCRIBIR = {
    text: 1, search: 1, email: 1, tel: 1, url: 1, number: 1, password: 1,
    date: 1, 'datetime-local': 1, month: 1, time: 1, week: 1
  };

  function claveDelCampo(el, clavePara) {
    if (el.id) return el.id;
    var puesta = el.getAttribute('data-clave');
    if (puesta) return puesta;
    if (!clavePara) return '';
    try { return clavePara(el) || ''; } catch (e) { return ''; }
  }

  function camposDeEscribir(raiz, clavePara) {
    var buenos = [];
    var todos;
    try { todos = raiz.querySelectorAll('textarea, input'); } catch (e) { return buenos; }
    Array.prototype.forEach.call(todos, function (el) {
      if (el.tagName === 'INPUT' && !TIPOS_DE_ESCRIBIR[(el.type || 'text').toLowerCase()]) return;
      if (!claveDelCampo(el, clavePara)) return;
      buenos.push(el);
    });
    return buenos;
  }

  function conservandoLoEscrito(raiz, hacer, clavePara) {
    if (!raiz) return hacer();

    var apuntes = [];
    var conFoco = document.activeElement;
    camposDeEscribir(raiz, clavePara).forEach(function (el) {
      var apunte = { clave: claveDelCampo(el, clavePara), valor: el.value, tenia: el === conFoco,
                     inicio: null, fin: null };
      if (apunte.tenia) {
        /* selectionStart no existe en todos los tipos de campo (los de
           fecha, por ejemplo, lo dan por error): sin cursor apuntado,
           se devuelve solo el foco. */
        try { apunte.inicio = el.selectionStart; apunte.fin = el.selectionEnd; } catch (e) { /* sin cursor */ }
      }
      apuntes.push(apunte);
    });

    function devolver() {
      if (!apuntes.length) return;
      var porClave = {};
      camposDeEscribir(raiz, clavePara).forEach(function (el) {
        var clave = claveDelCampo(el, clavePara);
        if (!porClave[clave]) porClave[clave] = el;
      });
      var devolverElFocoA = null, apunteDelFoco = null;
      apuntes.forEach(function (apunte) {
        var el = porClave[apunte.clave];
        if (!el) return;            /* ese campo ya no existe: no pasa nada */
        if (apunte.valor && !el.value) {
          try { el.value = apunte.valor; } catch (e) { /* no se ha podido: se deja como esté */ }
        }
        if (apunte.tenia) { devolverElFocoA = el; apunteDelFoco = apunte; }
      });
      if (!devolverElFocoA) return;
      try {
        devolverElFocoA.focus({ preventScroll: true });
        if (apunteDelFoco.inicio !== null && devolverElFocoA.setSelectionRange) {
          devolverElFocoA.setSelectionRange(apunteDelFoco.inicio, apunteDelFoco.fin);
        }
      } catch (e) { /* el campo ya no admite foco: se deja como esté */ }
    }

    var salida;
    try { salida = hacer(); }
    catch (e) { devolver(); throw e; }

    if (salida && typeof salida.then === 'function') {
      return salida.then(
        function (v) { devolver(); return v; },
        function (e) { devolver(); throw e; }
      );
    }
    devolver();
    return salida;
  }

  /* ---------- el menú de tres puntos de una fila (17-sep-2026, fila 36,
     docs/FILAS-QUE-NO-SE-ESTRUJAN.md) ----------

     `botones` es una lista de elementos <button> ya montados, con su
     propio onclick puesto (los mismos que hoy se cuelgan sueltos de la
     fila). Se devuelve un envoltorio para colgar en la fila, con un
     botón de tres puntos que despliega esos botones debajo, anclado a
     él. Se cierra al elegir uno, al pulsar fuera y con Escape.

     No abre ningún U.preguntar: es un desplegable propio, así que la
     regla de "un solo cuadro a la vez" sigue intacta.

     Los botones viven siempre en el documento (dentro del envoltorio,
     ocultos con la clase "oculto" hasta que se abre), no solo cuando el
     menú está desplegado: así aplicarModoConsulta (que recorre todo
     #ficha-asunto-cuerpo con querySelectorAll) los alcanza y los apaga
     igual que a los demás, estén el menú abierto o cerrado. Y así otra
     pieza (js/copiar.js, con el botón "Copiar") puede seguir
     añadiendo botones al menú después de montado, buscándolo por su
     clase ("fila-menu"). */
  function menuDeAcciones(botones) {
    var envoltorio = document.createElement('div');
    envoltorio.className = 'fila-menu-envoltorio';
    if (!botones || !botones.length) return envoltorio;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'fila-menu-btn';
    boton.title = 'Más acciones';
    boton.setAttribute('aria-haspopup', 'true');
    boton.setAttribute('aria-expanded', 'false');
    boton.textContent = '⋮';

    var menu = document.createElement('div');
    menu.className = 'fila-menu oculto';
    botones.forEach(function (b) { menu.appendChild(b); });

    function abierto() { return !menu.classList.contains('oculto'); }

    function cerrar() {
      if (!abierto()) return;
      menu.classList.add('oculto');
      boton.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', alPulsarFuera, true);
      document.removeEventListener('keydown', alPulsarTecla, true);
    }
    function alPulsarFuera(e) { if (!envoltorio.contains(e.target)) cerrar(); }
    function alPulsarTecla(e) { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } }

    boton.onclick = function (e) {
      e.stopPropagation();
      if (abierto()) { cerrar(); return; }
      menu.classList.remove('oculto');
      boton.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', alPulsarFuera, true);
      document.addEventListener('keydown', alPulsarTecla, true);
    };

    /* Al elegir cualquiera de los botones del menú, se cierra: el click
       ya ha disparado el onclick propio del botón (que puede seguir
       siendo async) antes de llegar aquí, así que no se le quita nada. */
    menu.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('button')) cerrar();
    });

    envoltorio.appendChild(boton);
    envoltorio.appendChild(menu);
    return envoltorio;
  }

  /* ==========================================================
     COPIAR AL PORTAPAPELES (fila 71, docs/COSAS-REPETIDAS.md)

     Doce sitios lo hacían cada uno a su manera: unos solo con
     navigator.clipboard, otros con una reserva por si el navegador no
     lo deja, y la mitad sin avisar cuando fallaba. Queda uno solo.
     ========================================================== */

  function copiarALaAntigua(texto) {
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

  /* Copia `texto` al portapapeles. Si se le pasa `boton`, al terminar
     le pone "Copiado" (con el aviso azul de boton-marcado) y lo
     devuelve a su texto de antes al cabo de 1.400 ms. Si el navegador
     no deja copiar, avisa con U.aviso en vez de quedarse callado.

     `opciones.avisoFallo` cambia el mensaje del aviso; `opciones.sinAviso`
     lo calla del todo, para cuando quien llama ya avisa por su cuenta
     (así lo usa `Copiar.copiar`, en js/copiar.js, que no lleva botón).

     Devuelve una promesa que se cumple con true o false. */
  function copiar(texto, boton, opciones) {
    opciones = opciones || {};
    function marcar(ok) {
      if (!ok) {
        if (!opciones.sinAviso) aviso(opciones.avisoFallo || 'No he podido copiarlo.', 'malo');
        return false;
      }
      if (boton) {
        var antes = boton.textContent;
        boton.textContent = 'Copiado';
        boton.classList.add('boton-marcado');
        setTimeout(function () {
          boton.textContent = antes;
          boton.classList.remove('boton-marcado');
        }, 1400);
      }
      return true;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return marcar(true); })
        .catch(function () { return marcar(copiarALaAntigua(texto)); });
    }
    return Promise.resolve(marcar(copiarALaAntigua(texto)));
  }

  /* ==========================================================
     IDENTIFICADORES NUEVOS (fila 71, docs/COSAS-REPETIDAS.md)

     La forma que ya usaban grupos, hitos, guías y sus requisitos: la
     letra o letras del módulo, más la hora en base 36, más unas
     cuantas letras al azar. `js/papelera.js` genera los suyos de otra
     manera (con cifras, no en base 36) y se queda como está: no es de
     los cinco que compartían esta forma, es un formato propio.

     La parte al azar lleva más letras que la de cada sitio por
     separado (tres, antes): con solo tres, muchos creados en el mismo
     milisegundo (una lista entera, de golpe) sí llegaban a chocar. */
  function nuevoId(prefijo) {
    return prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  return {
    normalizar: normalizar, limpiarNombre: limpiarNombre, hoyIso: hoyIso,
    aAaMmDd: aAaMmDd, fechaLegible: fechaLegible, fechaCorta: fechaCorta, cursoActual: cursoActual,
    cursoDeFecha: cursoDeFecha, cursoDeAno: cursoDeAno, edadDesde: edadDesde,
    aFecha: aFecha, yaPaso: yaPaso,
    ahora: ahora, aviso: aviso, preguntar: preguntar, escapar: escapar, mensajeDeError: mensajeDeError,
    fallo: fallo, accesorio: accesorio,
    parecidos: parecidos, dejaCrear: dejaCrear, mientrasGuarda: mientrasGuarda,
    conservandoLoEscrito: conservandoLoEscrito, menuDeAcciones: menuDeAcciones,
    envolver: envolver, envolturasAplicadas: envolturasAplicadas, envolturasFallidas: envolturasFallidas,
    copiar: copiar, nuevoId: nuevoId
  };
})();
