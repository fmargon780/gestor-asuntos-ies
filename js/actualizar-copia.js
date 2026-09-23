/* ============================================================
   actualizar-copia.js — la copia sin internet se actualiza sola, al
   abrirla (21-sep-2026, fila 89, docs/COPIA-SIN-INTERNET.md, punto 4).

   Solo actúa si `location.protocol === 'file:'`: en la web normal
   (Vercel) no hace nada. La instalación de la primera vez (elegir la
   carpeta, traer todos los ficheros) la hace `ABRIR EL GESTOR.html`,
   por su cuenta y sin depender de ningún fichero de la aplicación
   (autónomo, ver el propio fichero, generado por
   `scripts/copia-local.mjs`); una vez instalada, este módulo es quien
   comprueba si hay versión nueva cada vez que se abre `index.html`.

   DÓNDE VIVE EL IDENTIFICADOR DE LA CARPETA: `ABRIR EL GESTOR.html` no
   puede cargar `js/almacen.js` en su primera instalación (todavía no
   existe en disco), así que lleva su propio código, mínimo, de
   IndexedDB — pero apuntando a LA MISMA base de datos, almacén y
   clave que ya usa `Almacen` (`js/almacen.js`: base `gestor-asuntos`,
   almacén `ajustes`, clave `copiaCarpeta`): así lo que guarda el
   instalador lo puede releer este fichero, con el `Almacen` de
   siempre, sin duplicar nada más que ese primer guardado.

   QUÉ HACE, SIN BLOQUEAR NUNCA EL ARRANQUE (la aplicación sigue
   arrancando igual, con lo que ya tenga en disco, pase lo que pase
   aquí). Rehecho el 23-sep-2026 (fila 91, docs/COPIA-SE-ACTUALIZA.md):
   antes, sin carpeta guardada, se callaba, y sin permiso solo pintaba
   un aviso pequeño abajo que no decía que había versión nueva.
     1. PRIMERO lee el `version.json` de
        `raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/`
        (con `cache: 'no-store'`), haya o no carpeta y permiso. Si su
        `version` es igual a `App.VERSION`, no hace nada más: ni pide
        permiso ni toca el disco. (Un ordenador que ya recibió la
        versión nueva por Dropbox cae aquí.)
     2. Si es distinta y hay carpeta guardada con permiso, se
        actualiza sola: descarga solo los ficheros que cambian de
        sha256, comprueba el sha256 de cada uno antes de escribirlo,
        borra los que ya no están en la lista nueva y escribe
        `version.json` el último (si se corta a medias, la próxima vez
        se reintenta). Después, `location.reload()`.
     3. Sin carpeta, sin permiso, o si la actualización falla: la
        franja ámbar de arriba del todo («Hay una versión nueva…»),
        con el botón «Actualizar ahora». El botón pide el permiso o la
        carpeta (un clic del usuario, así que Chrome deja), la guarda
        para la próxima vez, actualiza y recarga. La ✕ la calla hasta
        la próxima vez que se abra la aplicación.
     4. CONTRA EL BUCLE: antes de recargar se apunta en
        `sessionStorage` a qué versión se ha actualizado y en qué
        carpeta. Si al volver `App.VERSION` sigue sin ser la remota,
        es que se escribió en otra copia que no es la que abre esta
        ventana: no se vuelve a recargar, se olvida la carpeta
        guardada y la franja lo dice.
     5. Sin internet, con el repositorio caído o con cualquier otro
        fallo al leer la versión remota: un aviso discreto de una
        línea (`U.aviso`, se borra solo) y nada más.
   ============================================================ */
(function () {
  if (location.protocol !== 'file:') return;

  /* `window.__COPIA_BASE_REMOTO__`: solo para las pruebas
     (pruebas/copia-sin-internet.mjs), que apuntan aquí su propio
     servidor local en vez del de verdad. En producción nunca está
     puesto. */
  var BASE_REMOTO = window.__COPIA_BASE_REMOTO__ || 'https://raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/';
  var CLAVE_CARPETA = 'copiaCarpeta';

  function $(id) { return document.getElementById(id); }

  async function obtenerCarpeta() {
    if (!window.Almacen) return null;
    try { return await Almacen.leer(CLAVE_CARPETA); } catch (e) { return null; }
  }

  function tienePermiso(dir) {
    var opciones = { mode: 'readwrite' };
    return dir.queryPermission(opciones).then(function (estado) { return estado === 'granted'; });
  }

  function pedirPermiso(dir) {
    var opciones = { mode: 'readwrite' };
    return dir.requestPermission(opciones).then(function (estado) { return estado === 'granted'; },
      function () { return false; });
  }

  async function leerVersionLocal(dir) {
    try {
      var fh = await dir.getFileHandle('version.json');
      var f = await fh.getFile();
      var datos = JSON.parse(await f.text());
      return (datos && typeof datos === 'object') ? datos : null;
    } catch (e) { return null; }
  }

  async function leerVersionRemota() {
    var resp = await fetch(BASE_REMOTO + 'version.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('http ' + resp.status);
    var datos = await resp.json();
    if (!datos || typeof datos.ficheros !== 'object') throw new Error('version.json remoto ilegible');
    return datos;
  }

  async function sha256Hex(bytes) {
    var buffer = await crypto.subtle.digest('SHA-256', bytes);
    var vista = new Uint8Array(buffer);
    var hex = '';
    for (var i = 0; i < vista.length; i++) hex += vista[i].toString(16).padStart(2, '0');
    return hex;
  }

  async function escribirEnRuta(dirRaiz, ruta, bytes) {
    var partes = ruta.split('/');
    var dir = dirRaiz;
    for (var i = 0; i < partes.length - 1; i++) dir = await dir.getDirectoryHandle(partes[i], { create: true });
    var fh = await dir.getFileHandle(partes[partes.length - 1], { create: true });
    var flujo = await fh.createWritable();
    /* Como Carpetas.escribirBytes (js/carpetas.js): un Blob, no los
       bytes sueltos. */
    await flujo.write(new Blob([bytes]));
    await flujo.close();
  }

  async function borrarRuta(dirRaiz, ruta) {
    var partes = ruta.split('/');
    var dir = dirRaiz;
    try {
      for (var i = 0; i < partes.length - 1; i++) dir = await dir.getDirectoryHandle(partes[i]);
      await dir.removeEntry(partes[partes.length - 1]);
    } catch (e) { /* ya no está, o su carpeta tampoco: no pasa nada */ }
  }

  async function descargarYEscribir(dir, ruta, shaEsperado) {
    var resp = await fetch(BASE_REMOTO + ruta, { cache: 'no-store' });
    if (!resp.ok) throw new Error('no se pudo descargar ' + ruta + ' (' + resp.status + ')');
    var bytes = new Uint8Array(await resp.arrayBuffer());
    var sha = await sha256Hex(bytes);
    if (sha !== shaEsperado) throw new Error('el sha256 de ' + ruta + ' no coincide');
    await escribirEnRuta(dir, ruta, bytes);
  }

  function nombreDe(dir) { return (dir && dir.name) || 'de la copia'; }

  /* Descarga lo cambiado respecto al `version.json` del disco y
     escribe `version.json` el último. Lanza si algo falla. */
  async function actualizarEn(dir, remoto) {
    var local = await leerVersionLocal(dir);
    for (var ruta in remoto.ficheros) {
      if (!local || !local.ficheros || local.ficheros[ruta] !== remoto.ficheros[ruta]) {
        await descargarYEscribir(dir, ruta, remoto.ficheros[ruta]);
      }
    }
    if (local && local.ficheros) {
      for (var rutaVieja in local.ficheros) {
        if (!(rutaVieja in remoto.ficheros)) await borrarRuta(dir, rutaVieja);
      }
    }
    /* version.json el último: si algo de arriba falla, el de disco
       sigue siendo el de antes, y la próxima vez se reintenta. */
    await escribirEnRuta(dir, 'version.json', new TextEncoder().encode(JSON.stringify(remoto)));
  }

  /* ---------- contra el bucle de recargas (sessionStorage) ---------- */

  var CLAVE_RECARGA = 'gestor-copia-recargada';

  function leerMarca() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_RECARGA) || 'null'); } catch (e) { return null; }
  }
  function borrarMarca() {
    try { sessionStorage.removeItem(CLAVE_RECARGA); } catch (e) { /* nada */ }
  }
  function recargar(dir, remoto) {
    try { sessionStorage.setItem(CLAVE_RECARGA, JSON.stringify({ version: remoto.version, carpeta: nombreDe(dir) })); } catch (e) { /* nada */ }
    location.reload();
  }

  /* ---------- avisos ---------- */

  function avisoDiscreto(texto) {
    if (window.U && typeof U.aviso === 'function') U.aviso(texto, 'ambar');
  }

  /* La franja de arriba del todo, a todo el ancho. Se cuelga directo
     del <body>: puede hacer falta antes de entrar o ya dentro, y no
     hay un hueco fijo en index.html para ella. */
  function franja(remoto, dir, textoFijo) {
    var caja = $('franja-copia');
    if (!caja) {
      caja = document.createElement('div');
      caja.id = 'franja-copia';
      caja.setAttribute('role', 'alert');
      caja.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;display:flex;align-items:center;gap:12px;flex-wrap:wrap;' +
        'padding:10px 48px 10px 16px;background:#fff4d6;border-bottom:2px solid #e0b34a;color:#1b2430;font-size:15px;box-shadow:0 4px 12px rgba(10,25,45,.18)';
      document.body.appendChild(caja);
    }
    caja.innerHTML = '';

    var texto = document.createElement('span');
    texto.id = 'franja-copia-texto';
    caja.appendChild(texto);

    var detalle = document.createElement('span');
    detalle.id = 'franja-copia-detalle';
    detalle.style.cssText = 'color:#8a5a00';

    if (textoFijo) {
      texto.innerHTML = textoFijo;
    } else {
      texto.innerHTML = 'Hay una versión nueva del Gestor (<strong></strong>). Esta copia tiene la <strong></strong>.';
      var negritas = texto.querySelectorAll('strong');
      negritas[0].textContent = remoto.version;
      negritas[1].textContent = App.VERSION;

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.id = 'franja-copia-actualizar';
      boton.className = 'boton boton-principal';
      boton.textContent = 'Actualizar ahora';
      boton.onclick = function () { actualizarAhora(remoto, dir, boton); };
      caja.appendChild(boton);
    }
    caja.appendChild(detalle);

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.id = 'franja-copia-cerrar';
    cerrar.title = 'Cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    cerrar.textContent = '✕';
    cerrar.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);border:0;background:none;font-size:18px;cursor:pointer;color:#5d6b7a';
    cerrar.onclick = function () { caja.remove(); };
    caja.appendChild(cerrar);
  }

  function detalleFranja(texto) {
    var d = $('franja-copia-detalle');
    if (d) d.textContent = texto;
  }

  async function esCarpetaDeLaCopia(dir) {
    try {
      await dir.getFileHandle('index.html');
      await dir.getFileHandle('version.json');
      return true;
    } catch (e) { return false; }
  }

  /* El botón «Actualizar ahora»: la carpeta que ya se tenga (o la que
     elija ahora), el permiso, y lo mismo que haría sola. */
  async function actualizarAhora(remoto, dir, boton) {
    if (!dir) {
      if (typeof window.showDirectoryPicker !== 'function') {
        detalleFranja('Este navegador no puede actualizar la copia: hace falta Google Chrome o Microsoft Edge.');
        return;
      }
      detalleFranja('Elige la carpeta donde está esta copia (la que tiene «ABRIR EL GESTOR.html»).');
      try {
        dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'gestor-copia' });
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        detalleFranja('No se ha podido abrir el selector de carpetas.');
        return;
      }
      if (!(await esCarpetaDeLaCopia(dir))) {
        detalleFranja('Esa carpeta no tiene la copia (le faltan index.html y version.json). Pulsa otra vez y elige la buena.');
        return;
      }
    }
    if (!(await tienePermiso(dir)) && !(await pedirPermiso(dir))) {
      detalleFranja('Sin permiso sobre la carpeta no puedo actualizar la copia.');
      return;
    }
    try { await Almacen.guardar(CLAVE_CARPETA, dir); } catch (e) { /* se pedirá otra vez la próxima */ }

    var textoBoton = boton ? boton.textContent : '';
    if (boton) { boton.disabled = true; boton.textContent = 'Actualizando…'; }
    detalleFranja('');
    try {
      await actualizarEn(dir, remoto);
      recargar(dir, remoto);
    } catch (e) {
      if (boton) { boton.disabled = false; boton.textContent = textoBoton; }
      detalleFranja('No se ha podido actualizar: ' + (e && e.message ? e.message : e));
    }
  }

  /* ---------- el conjunto ---------- */

  async function comprobar() {
    var remoto;
    try {
      remoto = await leerVersionRemota();
    } catch (e) {
      avisoDiscreto('No se ha podido comprobar si hay una versión nueva.');
      return;
    }

    var marca = leerMarca();
    borrarMarca();

    if (remoto.version === App.VERSION) return;   /* ya está al día: ni permiso ni disco */

    if (marca && marca.version === remoto.version) {
      /* Se actualizó una carpeta y se recargó, pero esta ventana sigue
         con la versión vieja: esa carpeta no es la que abre la
         ventana. Ni otra recarga ni volver a escribir allí. */
      if (window.Almacen) { try { await Almacen.borrar(CLAVE_CARPETA); } catch (e) { /* nada */ } }
      var nombre = document.createElement('strong');
      nombre.textContent = marca.carpeta || '';
      franja(remoto, null, 'He actualizado la carpeta ' + nombre.outerHTML + ', pero esta ventana abre otra copia. ' +
        'Abre la aplicación desde la carpeta ' + nombre.outerHTML + '.');
      return;
    }

    var dir = await obtenerCarpeta();
    var permiso = false;
    if (dir) { try { permiso = await tienePermiso(dir); } catch (e) { permiso = false; } }
    if (!dir || !permiso) { franja(remoto, dir, null); return; }

    try {
      await actualizarEn(dir, remoto);
      recargar(dir, remoto);
    } catch (e) {
      franja(remoto, dir, null);
      detalleFranja('No se ha podido actualizar sola: ' + (e && e.message ? e.message : e));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comprobar);
  else comprobar();

  /* Para la prueba de actualización (pruebas/), sin tocar nada más. */
  window.ActualizarCopia = { comprobar: comprobar, _BASE_REMOTO: BASE_REMOTO };
})();
