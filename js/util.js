/* ============================================================
   util.js — piezas sueltas que usa todo lo demás. Los nombres que se
   parecen están en js/util-parecidos.js y las ayudas de pantalla
   (conservar lo escrito, menú de tres puntos, copiar) en
   js/util-pantalla.js (fila 133).
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
    mientrasGuarda: mientrasGuarda,
    envolver: envolver, envolturasAplicadas: envolturasAplicadas, envolturasFallidas: envolturasFallidas,
    nuevoId: nuevoId
  };
})();
