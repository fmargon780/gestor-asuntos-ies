/* ============================================================
   soporte.js — el botón «Soporte» (fila 213 de la cola,
   docs/BOTON-DE-SOPORTE.md).

   Un botón pequeño abajo a la derecha, siempre a la vista, que abre
   una ventana para avisar de «Algo no funciona» o proponer una mejora,
   con texto y, si se quiere, una captura pegada (Ctrl+V), arrastrada o
   elegida. Cada aviso va al buzón (apps-script/soporte.gs, un script de
   Google, no Vercel: en el centro solo Google se ve), que lo guarda en
   Drive y apunta una IDEA en la cola.

   La dirección del buzón se guarda en `_GESTOR` (registro.ajustesAvisos.
   urlSoporte, compartido por los dos ordenadores) y se escribe en
   Ajustes → El centro → «Buzón de soporte». Sin dirección, el botón se
   ve igual y al enviar avisa de que el buzón no está configurado.

   La app añade sola: app, pantalla (solo el nombre de la pantalla, nunca
   un nombre de asunto ni de persona: la fila que sale en la cola es
   pública), quién lo envía, fecha y hora, versión y, en «Algo no
   funciona», los últimos errores que este módulo haya visto en la
   consola (los recoge desde que carga la página).

   Va justo después de js/version.js para recoger cuanto antes los
   errores; el botón y la ventana solo usan App/U cuando se pulsan.
   ============================================================ */
window.Soporte = (function () {

  var APP = 'Gestor de Asuntos';
  var REPO = 'fmargon780/gestor-asuntos-ies';
  var CLAVE_NOMBRE = 'gestor-soporte-nombre';
  var CLAVE_CORREO = 'gestor-soporte-correo';
  var ANCHO_MAXIMO = 1500;
  var LIMITE_MS = 45000;
  var MAX_ERRORES = 10;

  var PANTALLAS = {
    abiertos: 'Inicio', asunto: 'Ficha de un asunto', nuevo: 'Nuevo asunto', archivo: 'Archivo',
    personas: 'Personas y empresas', herramientas: 'Herramientas', ajustes: 'Ajustes',
    'tipo-asunto': 'Ajustes de un tipo de asunto', impresos: 'Impresos', cuentas: 'Cuentas'
  };

  /* ---------- los errores de la consola ---------- */

  var errores = [];

  function hora() {
    var d = new Date();
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    return dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  function apuntarError(texto) {
    errores.push(hora() + ' ' + String(texto).replace(/\s+/g, ' ').slice(0, 300));
    if (errores.length > MAX_ERRORES) errores.shift();
  }

  window.addEventListener('error', function (e) {
    var donde = e && e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '';
    apuntarError((e && e.message) + donde);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    apuntarError('Promesa rechazada: ' + ((r && r.message) || r));
  });
  (function () {
    if (!window.console || typeof console.error !== 'function') return;
    var original = console.error;
    console.error = function () {
      try {
        apuntarError(Array.prototype.map.call(arguments, function (a) {
          return (a && a.message) ? a.message : String(a);
        }).join(' '));
      } catch (e) { /* recoger errores nunca puede dar errores */ }
      return original.apply(console, arguments);
    };
  })();

  /* ---------- lo que la app sabe ---------- */

  function registro() { return (window.App && App.E && App.E.registro) || null; }

  function direccion() {
    var r = registro();
    var url = r && r.ajustesAvisos && r.ajustesAvisos.urlSoporte;
    return (typeof url === 'string') ? url.trim() : '';
  }

  function nombrePantalla() {
    var p = document.querySelector('.pantalla:not(.oculto)');
    if (!p || !p.id) return 'Pantalla de entrada';
    var clave = p.id.replace(/^pantalla-/, '');
    if (PANTALLAS[clave]) return PANTALLAS[clave];
    return clave.charAt(0).toUpperCase() + clave.slice(1).replace(/-/g, ' ');
  }

  function quienSabido() {
    var u = window.App && App.E && App.E.usuario;
    if (u) return String(u);
    try { return localStorage.getItem(CLAVE_NOMBRE) || ''; } catch (e) { return ''; }
  }

  function recordarNombre(n) {
    try { localStorage.setItem(CLAVE_NOMBRE, n); } catch (e) { /* sin memoria, se pregunta otra vez */ }
  }

  /* Fila 269 (docs/SOPORTE-MANDA-EL-CORREO.md): el correo de quien avisa, para poder
     escribirle cuando quede resuelto. Se pide una sola vez en cada ordenador. */
  function correoSabido() {
    try { return localStorage.getItem(CLAVE_CORREO) || ''; } catch (e) { return ''; }
  }

  function recordarCorreo(c) {
    try { localStorage.setItem(CLAVE_CORREO, c); } catch (e) { /* sin memoria, se pregunta otra vez */ }
  }

  /* PURA. ¿Tiene forma de dirección de correo? */
  function correoBueno(c) {
    c = String(c || '').trim();
    return c.length <= 120 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(c);
  }

  function fechaHora() {
    var d = new Date();
    function dos(x) { return (x < 10 ? '0' : '') + x; }
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  }

  /* ---------- la captura ---------- */

  function leerComoUrl(fichero) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onload = function () { resolver(lector.result); };
      lector.onerror = function () { rechazar(new Error('No he podido leer la imagen.')); };
      lector.readAsDataURL(fichero);
    });
  }

  function cargarImagen(url) {
    return new Promise(function (resolver, rechazar) {
      var img = new Image();
      img.onload = function () { resolver(img); };
      img.onerror = function () { rechazar(new Error('Eso no parece una imagen.')); };
      img.src = url;
    });
  }

  /* La imagen se reduce a JPEG de como mucho 1.500 px de ancho. Devuelve
     { vista: 'data:image/jpeg;base64,…', base64: '…' }. */
  async function reducir(fichero) {
    var img = await cargarImagen(await leerComoUrl(fichero));
    var ancho = img.naturalWidth || img.width;
    var alto = img.naturalHeight || img.height;
    if (ancho > ANCHO_MAXIMO) { alto = Math.round(alto * ANCHO_MAXIMO / ancho); ancho = ANCHO_MAXIMO; }
    var lienzo = document.createElement('canvas');
    lienzo.width = ancho; lienzo.height = alto;
    var c = lienzo.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, ancho, alto);
    c.drawImage(img, 0, 0, ancho, alto);
    var vista = lienzo.toDataURL('image/jpeg', 0.8);
    return { vista: vista, base64: vista.split(',')[1] || '' };
  }

  /* ---------- enviar ---------- */

  /* Devuelve { ok: true } o { ok: false, motivo }. Nunca lanza. */
  async function enviar(datos) {
    var url = direccion();
    if (!url) return { ok: false, motivo: 'El buzón de soporte aún no está configurado. Pídele a Francisco que ponga su dirección en Ajustes → El centro.' };
    var corte = (typeof AbortController === 'function') ? new AbortController() : null;
    var reloj = corte ? setTimeout(function () { corte.abort(); }, LIMITE_MS) : null;
    var respuesta;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(datos),
        signal: corte ? corte.signal : undefined
      });
    } catch (e) {
      if (reloj) clearTimeout(reloj);
      if (e && e.name === 'AbortError') return { ok: false, motivo: 'El buzón tarda demasiado en contestar. Inténtalo otra vez en un rato.' };
      return { ok: false, motivo: 'No he podido contactar con el buzón. ¿Hay internet?' };
    }
    if (reloj) clearTimeout(reloj);
    var json = null;
    try { json = JSON.parse(await respuesta.text()); } catch (e) { json = null; }
    if (!respuesta.ok || !json) return { ok: false, motivo: 'El buzón no ha contestado bien. Revisa su dirección en Ajustes → El centro.' };
    if (!json.ok) return { ok: false, motivo: json.motivo || 'El buzón no ha aceptado el aviso.' };
    return { ok: true };
  }

  /* ---------- la ventana ---------- */

  var estado = null;   /* { tipo, captura, enviando } mientras la ventana está abierta */

  function el(etiqueta, clase, texto) {
    var e = document.createElement(etiqueta);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  }

  /* Fila 240. El guion gris: no obliga a nada, solo sugiere qué contar. */
  var GUION = 'Cuéntalo con todo el detalle que quieras; no hay límite de tamaño. Te sugerimos:\n\n' +
    '· Qué pasa o qué propones\n· En qué pantalla o en qué paso\n' +
    '· Qué esperabas que pasara, o cómo lo harías tú\n· Casos y ejemplos concretos\n' +
    '· Otras posibilidades o variantes que se te ocurran';

  /* PURA. Cuántas palabras tiene un texto. */
  function contarPalabras(t) {
    var m = String(t || '').match(/\S+/g);
    return m ? m.length : 0;
  }

  /* PURA. «0 palabras», «1 palabra», «N palabras». */
  function textoPalabras(n) { return n + (n === 1 ? ' palabra' : ' palabras'); }

  /* El cuadro crece con lo escrito hasta ocupar casi toda la altura de la
     ventana (deja sitio a la cabecera, el nombre, la captura y los botones,
     que siguen a la vista); a partir de ahí, barra de desplazamiento dentro. */
  function altoMaximo() { return Math.max(260, (window.innerHeight || 800) - 400); }
  function crecer(texto) {
    texto.style.height = 'auto';
    texto.style.height = Math.min(texto.scrollHeight + 2, altoMaximo()) + 'px';
  }
  function alCambiarVentana() {
    var t = document.getElementById('soporte-texto');
    if (t && t.value) crecer(t);
  }

  function cerrar() {
    window.removeEventListener('resize', alCambiarVentana);
    var capa = document.getElementById('capa-soporte');
    if (capa) capa.remove();
    document.removeEventListener('keydown', alTeclear, true);
    estado = null;
  }

  function alTeclear(e) {
    if (e.key === 'Escape' && estado && !estado.enviando) { e.stopPropagation(); cerrar(); }
  }

  function decir(mensaje, malo) {
    var caja = document.getElementById('soporte-mensaje');
    if (!caja) return;
    caja.textContent = mensaje || '';
    caja.className = 'soporte-mensaje' + (mensaje ? (malo ? ' soporte-mal' : ' soporte-bien') : ' oculto');
  }

  function pintarCaptura() {
    var zona = document.getElementById('soporte-captura');
    if (!zona) return;
    zona.textContent = '';
    if (estado.captura) {
      var img = el('img', 'soporte-vista');
      img.src = estado.captura.vista;
      img.alt = 'Captura de pantalla adjunta';
      var quitar = el('button', 'boton', 'Quitar la captura');
      quitar.type = 'button';
      quitar.id = 'soporte-quitar';
      quitar.onclick = function () { estado.captura = null; pintarCaptura(); };
      zona.appendChild(img);
      zona.appendChild(quitar);
    } else {
      zona.appendChild(el('span', 'suave', 'Pega aquí la captura con Ctrl+V, arrástrala o '));
      var elegir = el('button', 'enlace', 'elige un fichero');
      elegir.type = 'button';
      elegir.id = 'soporte-elegir';
      elegir.onclick = function () { document.getElementById('soporte-fichero').click(); };
      zona.appendChild(elegir);
    }
  }

  async function ponerCaptura(fichero) {
    if (!fichero || !/^image\//.test(fichero.type || '')) { decir('Eso no es una imagen.', true); return; }
    try {
      estado.captura = await reducir(fichero);
      decir('');
      pintarCaptura();
    } catch (e) {
      decir((e && e.message) || 'No he podido usar esa imagen.', true);
    }
  }

  function imagenDe(lista) {
    for (var i = 0; lista && i < lista.length; i++) {
      var f = lista[i].kind === 'file' ? lista[i].getAsFile() : lista[i];
      if (f && /^image\//.test(f.type || '')) return f;
    }
    return null;
  }

  async function pulsarEnviar() {
    if (!estado || estado.enviando) return;
    var texto = document.getElementById('soporte-texto').value.trim();
    if (!estado.tipo) { decir('Elige primero qué es: «Algo no funciona» o «Propongo una mejora».', true); return; }
    if (!texto) { decir('Cuéntalo con unas palabras en el recuadro.', true); return; }
    var campoNombre = document.getElementById('soporte-nombre');
    var quien = quienSabido();
    if (!quien) {
      quien = campoNombre ? campoNombre.value.trim() : '';
      if (!quien) { decir('Escribe tu nombre para que sepamos quién avisa.', true); return; }
    }
    var campoCorreo = document.getElementById('soporte-correo');
    var correo = correoSabido();
    if (campoCorreo) {
      correo = campoCorreo.value.trim();
      if (!correo) { decir('Escribe tu correo para avisarte cuando esté resuelto.', true); return; }
      if (!correoBueno(correo)) { decir('Ese correo no parece correcto. Revísalo.', true); return; }
    }
    var boton = document.getElementById('soporte-enviar');
    estado.enviando = true;
    boton.disabled = true;
    boton.textContent = 'Enviando…';
    decir('');
    var datos = {
      app: APP, repo: REPO, tipo: estado.tipo, texto: texto,
      pantalla: estado.pantalla, quien: quien, correo: correo, fecha: fechaHora(),
      version: (window.App && App.VERSION) || ''
    };
    if (estado.tipo === 'error' && errores.length) datos.errores = errores.join('\n');
    if (estado.captura) datos.captura = estado.captura.base64;
    var r = await enviar(datos);
    if (!estado) return;
    estado.enviando = false;
    if (!r.ok) {
      boton.disabled = false;
      boton.textContent = 'Enviar';
      decir(r.motivo, true);      /* el texto se queda en la ventana para reintentar */
      return;
    }
    if (!quienSabido()) recordarNombre(quien);
    recordarCorreo(correo);
    cerrar();
    if (window.U && U.aviso) U.aviso('Recibido. Gracias', 'bueno');
  }

  /* El campo «Tu correo» (la primera vez, o tras «Cambiar») o la línea «Te avisaremos en …». */
  function pintarCorreo(bloque, sabido, previo) {
    bloque.textContent = '';
    if (sabido) {
      var linea = el('p', 'soporte-pie');
      linea.id = 'soporte-correo-sabido';
      linea.appendChild(document.createTextNode('Te avisaremos en '));
      linea.appendChild(el('strong', null, sabido));
      linea.appendChild(document.createTextNode(' · '));
      var cambiar = el('button', 'enlace', 'Cambiar');
      cambiar.type = 'button'; cambiar.id = 'soporte-cambiar-correo';
      cambiar.onclick = function () { pintarCorreo(bloque, '', sabido); };
      linea.appendChild(cambiar);
      bloque.appendChild(linea);
      return;
    }
    var campo = el('input', 'campo soporte-nombre');
    campo.id = 'soporte-correo'; campo.type = 'email';
    campo.placeholder = 'Tu correo';
    campo.setAttribute('aria-label', 'Tu correo');
    campo.autocomplete = 'email';
    if (previo) campo.value = previo;
    bloque.appendChild(campo);
    bloque.appendChild(el('p', 'suave soporte-pie', 'Te escribiremos a esta dirección cuando tu aviso esté resuelto.'));
    if (previo) campo.focus();
  }

  /* `previo` (fila 291, «Avisar por Soporte» de una tarjeta de Problemas): el texto ya escrito. */
  function abrir(previo) {
    if (document.getElementById('capa-soporte')) return;
    estado = { tipo: '', captura: null, enviando: false, pantalla: nombrePantalla() };

    var capa = el('div', 'capa');
    capa.id = 'capa-soporte';
    var cuadro = el('div', 'cuadro soporte-cuadro');
    cuadro.setAttribute('role', 'dialog');
    cuadro.setAttribute('aria-label', 'Soporte');

    var cabecera = el('div', 'soporte-cabecera');
    cabecera.appendChild(el('h3', null, 'Soporte'));
    var x = el('button', 'soporte-x', '✕');
    x.type = 'button'; x.id = 'soporte-x'; x.setAttribute('aria-label', 'Cerrar');
    x.onclick = function () { if (!estado.enviando) cerrar(); };
    cabecera.appendChild(x);
    cuadro.appendChild(cabecera);

    var tipos = el('div', 'soporte-tipos');
    [['error', 'Algo no funciona'], ['mejora', 'Propongo una mejora']].forEach(function (par) {
      var b = el('button', 'boton soporte-tipo', par[1]);
      b.type = 'button'; b.dataset.tipo = par[0];
      b.onclick = function () {
        estado.tipo = par[0];
        Array.prototype.forEach.call(tipos.children, function (o) {
          o.classList.toggle('boton-marcado', o === b);
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
      };
      tipos.appendChild(b);
    });
    cuadro.appendChild(tipos);
    if (typeof previo === 'string' && previo && tipos.firstChild) tipos.firstChild.onclick();   /* «Algo no funciona» */

    var texto = el('textarea', 'campo soporte-texto');
    texto.id = 'soporte-texto';
    /* Fila 240 (docs/SOPORTE-TEXTO-SIN-LIMITE.md): sin límite de tamaño, abre alto
       (14 renglones), crece solo al escribir y lleva un guion gris que sugiere qué contar. */
    texto.rows = 14;
    texto.placeholder = GUION;
    cuadro.appendChild(texto);
    var palabras = el('p', 'suave soporte-pie soporte-palabras', textoPalabras(0));
    palabras.id = 'soporte-palabras';
    cuadro.appendChild(palabras);
    texto.addEventListener('input', function () {
      crecer(texto);
      palabras.textContent = textoPalabras(contarPalabras(texto.value));
    });
    window.addEventListener('resize', alCambiarVentana);
    if (typeof previo === 'string' && previo) {
      texto.value = previo;
      palabras.textContent = textoPalabras(contarPalabras(previo));
    }

    if (!quienSabido()) {
      var nombre = el('input', 'campo soporte-nombre');
      nombre.id = 'soporte-nombre'; nombre.type = 'text';
      nombre.placeholder = 'Tu nombre';
      cuadro.appendChild(nombre);
    }

    var bloqueCorreo = el('div', 'soporte-correo');
    bloqueCorreo.id = 'soporte-bloque-correo';
    cuadro.appendChild(bloqueCorreo);
    pintarCorreo(bloqueCorreo, correoSabido());

    var zona = el('div', 'soporte-captura');
    zona.id = 'soporte-captura';
    cuadro.appendChild(zona);
    var fichero = el('input');
    fichero.type = 'file'; fichero.accept = 'image/*'; fichero.id = 'soporte-fichero';
    fichero.className = 'oculto';
    fichero.onchange = function () { if (fichero.files[0]) ponerCaptura(fichero.files[0]); fichero.value = ''; };
    cuadro.appendChild(fichero);

    cuadro.appendChild(el('p', 'suave soporte-pie', 'Se añade solo: la pantalla en la que estás (' + estado.pantalla + '), tu nombre, la fecha y la versión.'));
    cuadro.appendChild(el('div', 'soporte-mensaje oculto')).id = 'soporte-mensaje';

    var botones = el('div', 'cuadro-botones');
    var cancelar = el('button', 'boton', 'Cancelar');
    cancelar.type = 'button'; cancelar.id = 'soporte-cancelar';
    cancelar.onclick = function () { if (!estado.enviando) cerrar(); };
    var enviarB = el('button', 'boton boton-principal', 'Enviar');
    enviarB.type = 'button'; enviarB.id = 'soporte-enviar';
    enviarB.onclick = pulsarEnviar;
    botones.appendChild(cancelar);
    botones.appendChild(enviarB);
    cuadro.appendChild(botones);

    capa.appendChild(cuadro);
    document.body.appendChild(capa);

    capa.addEventListener('paste', function (e) {
      var f = imagenDe(e.clipboardData && e.clipboardData.items);
      if (f) { e.preventDefault(); ponerCaptura(f); }
    });
    capa.addEventListener('dragover', function (e) { e.preventDefault(); });
    capa.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = imagenDe(e.dataTransfer && e.dataTransfer.files);
      if (f) ponerCaptura(f);
    });
    document.addEventListener('keydown', alTeclear, true);

    pintarCaptura();
    texto.focus();
    if (typeof previo === 'string' && previo) crecer(texto);
  }

  /* ---------- el botón ---------- */

  function ponerBoton() {
    if (document.getElementById('btn-soporte') || !document.body) return;
    var b = el('button', 'boton-soporte', 'Soporte');
    b.type = 'button'; b.id = 'btn-soporte';
    b.title = 'Avisar de un error o proponer una mejora';
    b.onclick = abrir;
    document.body.appendChild(b);
  }

  /* ---------- Ajustes → El centro → «Buzón de soporte» ---------- */

  function pintarAjustes() {
    var campo = document.getElementById('soporte-url');
    if (!campo || !window.App || !App.guardarRegistroFresco) return;
    campo.value = direccion();
    campo.onchange = async function () {
      var nueva = campo.value.trim();
      if (nueva && !/^https:\/\//i.test(nueva)) {
        campo.value = direccion();
        U.aviso('La dirección del buzón tiene que empezar por https://', 'malo');
        return;
      }
      try {
        await App.guardarRegistroFresco(function (reg) {
          reg.ajustesAvisos = reg.ajustesAvisos || {};
          if (nueva) reg.ajustesAvisos.urlSoporte = nueva; else delete reg.ajustesAvisos.urlSoporte;
        });
        U.aviso(nueva ? 'Dirección del buzón de soporte guardada.' : 'Buzón de soporte quitado.', 'bueno');
      } catch (e) {
        U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ponerBoton);
  else ponerBoton();

  return {
    correoBueno: correoBueno, contarPalabras: contarPalabras, textoPalabras: textoPalabras, GUION: GUION, abrir: abrir, cerrar: cerrar, enviar: enviar, direccion: direccion, pintarAjustes: pintarAjustes,
    errores: function () { return errores.slice(); }, reducir: reducir
  };
})();
