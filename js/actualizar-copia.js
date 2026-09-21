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
   aquí):
     1. Si no hay carpeta guardada (la copia no se instaló con
        `ABRIR EL GESTOR.html`, p. ej. alguien copió `index.html` a
        mano), no se puede comprobar nada: no hace nada más.
     2. Si el permiso de la carpeta ya no vale (Chrome lo vuelve a
        pedir de vez en cuando), se pinta un aviso ámbar con un botón,
        igual que ya se hace con la carpeta de la bandeja de correos
        (`js/bandeja-pantalla.js`, `pintarCaja`): nunca se vuelve a
        pedir solo, hace falta un clic del usuario.
     3. Compara `version.json` del disco con el de
        `raw.githubusercontent.com/fmargon780/gestor-asuntos-copia/main/`
        (con `cache: 'no-store'`, para no quedarse con una copia vieja
        del propio `fetch`). Si son iguales, no hace nada.
     4. Si hay ficheros nuevos: descarga solo los que cambian de
        sha256, comprueba el sha256 de cada uno antes de escribirlo, y
        borra los que ya no estén en la lista nueva. `version.json` se
        escribe el último: si se corta a medias, la próxima vez se
        vuelve a intentar con lo que falte (el `version.json` de disco
        sigue siendo el de antes).
     5. Si todo fue bien, `location.reload()`.
     6. Sin internet, con el repositorio caído o con cualquier otro
        fallo: un aviso discreto de una línea (`U.aviso`, se borra
        solo) y nada más. Nunca se deja de arrancar por esto.
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

  /* ---------- avisos ---------- */

  function avisoDiscreto(texto) {
    if (window.U && typeof U.aviso === 'function') U.aviso(texto, 'ambar');
  }

  /* Mismo patrón que js/bandeja-pantalla.js (pintarCaja): un aviso
     ámbar persistente con un botón, porque pedir el permiso a solas
     (sin que el usuario acabe de pulsar algo) no funciona en Chrome.
     No hay un hueco fijo en index.html para esto (el permiso puede
     hacer falta antes de entrar o ya dentro), así que se cuelga
     directo del <body>, arriba de todo lo demás. */
  function avisoPermiso(dir) {
    if ($('aviso-copia-permiso')) return;
    var caja = document.createElement('div');
    caja.id = 'aviso-copia-permiso';
    caja.className = 'aviso aviso-ambar';
    caja.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:420px;z-index:9999;box-shadow:0 8px 24px rgba(10,25,45,.25)';
    caja.innerHTML = '<strong>Esta copia sin internet necesita permiso otra vez.</strong>' +
      '<p>El navegador lo pide de nuevo cada cierto tiempo. Sin él no puede comprobar si hay una versión nueva, pero la aplicación sigue funcionando con la que ya tienes.</p>';
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton boton-principal';
    boton.textContent = 'Dar permiso a la copia local';
    boton.onclick = async function () {
      var ok = await pedirPermiso(dir);
      if (ok) { caja.remove(); comprobar(); }
      else avisoDiscreto('Sin permiso no puedo comprobar si hay una versión nueva.');
    };
    caja.appendChild(boton);
    document.body.appendChild(caja);
  }

  /* ---------- el conjunto ---------- */

  async function comprobar() {
    var dir = await obtenerCarpeta();
    if (!dir) return;   /* instalada a mano, sin ABRIR EL GESTOR.html: no hay nada que comprobar */

    var ok = await tienePermiso(dir);
    if (!ok) { avisoPermiso(dir); return; }

    var local = await leerVersionLocal(dir);
    var remoto;
    try {
      remoto = await leerVersionRemota();
    } catch (e) {
      avisoDiscreto('No se ha podido comprobar si hay una versión nueva.');
      return;
    }

    if (local && local.version === remoto.version) return;   /* ya está al día */

    var cambiados = [];
    for (var ruta in remoto.ficheros) {
      if (!local || !local.ficheros || local.ficheros[ruta] !== remoto.ficheros[ruta]) cambiados.push(ruta);
    }

    try {
      for (var i = 0; i < cambiados.length; i++) {
        await descargarYEscribir(dir, cambiados[i], remoto.ficheros[cambiados[i]]);
      }
      if (local && local.ficheros) {
        for (var rutaVieja in local.ficheros) {
          if (!(rutaVieja in remoto.ficheros)) await borrarRuta(dir, rutaVieja);
        }
      }
      /* version.json el último: si algo de arriba falla, el de disco
         sigue siendo el de antes, y la próxima vez se reintenta. */
      await escribirEnRuta(dir, 'version.json', new TextEncoder().encode(JSON.stringify(remoto)));
      location.reload();
    } catch (e) {
      avisoDiscreto('No se ha podido actualizar la copia: ' + (e && e.message ? e.message : e));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comprobar);
  else comprobar();

  /* Para la prueba de actualización (pruebas/), sin tocar nada más. */
  window.ActualizarCopia = { comprobar: comprobar, _BASE_REMOTO: BASE_REMOTO };
})();
