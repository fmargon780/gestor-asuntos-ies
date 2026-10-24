/* ============================================================
   carpetas-en-drive.js — el otro ordenador, casa y la copia sin
   internet, después de «Pasar a Drive» (fila 459,
   docs/PASAR-A-DRIVE.md, apartado «Fila 459»).

   La fila 458 pasa las carpetas a Google Drive desde un ordenador. Los
   demás (el otro del instituto, la copia sin internet vieja) siguen
   apuntando a Dropbox. Al pulsar «Entrar», ANTES de crear nada:

     · si la raíz de «asuntos vivos» (la que esta instalación tiene guardada)
       lleva `PASADO-A-DRIVE.json`, esta instalación aún apunta a Dropbox: no se
       crea `_GESTOR` ni ningún otro fichero allí, sale una franja con «Las carpetas
       están ahora en Google Drive. Señálalas para seguir.» y se piden, una a una,
       la «asuntos vivos» y el ARCHIVO de Drive. Solo se acepta la «asuntos vivos»
       cuyo `_GESTOR/PASADO-A-DRIVE.json` lleve el mismo identificador. Después se
       guardan `abiertos`, `archivo` y `entrada` (la raíz de Dropbox) y se entra;
     · si esta página es la copia sin internet VIEJA (su dirección dice «NO USAR», o
       dice «Dropbox» y las carpetas ya están en Drive), no deja trabajar: dice
       «Esta copia es la vieja. Abre la que está en Google Drive.» con la ruta nueva.

   En casa (Chromebook, versión web) no hace falta nada de esto: la primera vez se
   señalan las carpetas de Drive como en cualquier instalación nueva, y «Por
   clasificar» lo dice con la frase de la fila 455 (js/entrada.js).
   ============================================================ */
var CarpetasEnDrive = (function () {
  'use strict';

  var MARCA = 'PASADO-A-DRIVE.json';
  var TEXTO_FRANJA = 'Las carpetas están ahora en Google Drive. Señálalas para seguir.';
  var TEXTO_NO_ES = 'Esa no es la carpeta que se pasó a Drive. Si acabáis de hacer el traslado, puede que Google Drive aún no haya terminado de subirla: espera y vuelve a probar.';
  var TEXTO_VIEJA = 'Esta copia es la vieja. Abre la que está en Google Drive.';

  /* La dirección de esta página; `window.__DIRECCION_COPIA__` ({ protocolo, ruta }) solo la usan las pruebas. */
  function direccion() {
    if (window.__DIRECCION_COPIA__) return window.__DIRECCION_COPIA__;
    var camino = window.location.pathname || '';
    try { camino = decodeURIComponent(camino); } catch (e) { /* tal cual */ }
    return { protocolo: window.location.protocol, ruta: camino };
  }

  function sinRaw(h) { return window.FechasOrigen ? FechasOrigen.crudo(h) : h; }
  function crudo(h) { return window.SoloConsulta && SoloConsulta.crudo ? SoloConsulta.crudo(sinRaw(h)) : sinRaw(h); }

  async function leerJsonSuave(dir, nombre) {
    try { return (await Carpetas.leerJson(dir, nombre)) || null; } catch (e) { return null; }
  }
  async function subcarpeta(dir, nombre) {
    try { return await dir.getDirectoryHandle(nombre); } catch (e) { return null; }
  }

  /* ---------- la copia vieja ---------- */

  /* ¿Esta página es una copia sin internet que ya no vale? `hayDrive`: las carpetas ya están en Drive. */
  function esCopiaVieja(dir, hayDrive) {
    var d = dir || direccion();
    if (d.protocolo !== 'file:') return false;
    var ruta = String(d.ruta || '');
    if (/NO USAR/i.test(ruta)) return true;
    return !!hayDrive && /(^|[\\\/])Dropbox( \([^)]*\))?([\\\/]|$)/i.test(ruta);
  }

  /* La ruta de la copia nueva, o una frase si no se sabe la ruta entera. */
  function rutaDeLaCopiaNueva(marca) {
    var nombre = (marca && marca.copia) || '';
    var raiz = '';
    try { raiz = window.RutaCarpetas ? (RutaCarpetas.raizDeLaNube().valor || '') : ''; } catch (e) { raiz = ''; }
    if (nombre && raiz && RutaCarpetas.nubeDeRuta(raiz) === 'drive') {
      return { ruta: RutaCarpetas.unir(RutaCarpetas.sinFileUrl(raiz), [nombre]), exacta: true };
    }
    return { ruta: nombre ? 'Mi unidad\\' + nombre : '', exacta: false };
  }

  /* ---------- la marca ---------- */

  /* { marca, enDropbox } o null. La marca de Dropbox está en la raíz de «asuntos vivos»; la de Drive,
     dentro de su `_GESTOR` (con el mismo identificador). */
  async function leerMarca(abiertos) {
    if (!abiertos) return null;
    var raiz = crudo(abiertos);
    var m = await leerJsonSuave(raiz, MARCA);
    if (m && m.id) return { marca: m, enDropbox: true };
    var g = await subcarpeta(raiz, App.CARPETA_GESTOR);
    if (!g) return null;
    m = await leerJsonSuave(g, MARCA);
    if (m && m.id) return { marca: m, enDropbox: false };
    var r = await leerJsonSuave(g, 'rutas.json');
    if (r && r.nube === 'drive') return { marca: { id: '', copia: '' }, enDropbox: false };
    return null;
  }

  /* ---------- la franja ---------- */

  function sitio() {
    return document.getElementById('paso-carpetas');
  }

  function quitarFranja() {
    var f = document.getElementById('franja-drive-nuevas');
    if (f && f.parentNode) f.parentNode.removeChild(f);
  }

  function crearFranja() {
    quitarFranja();
    var f = document.createElement('div');
    f.id = 'franja-drive-nuevas';
    f.className = 'franja-drive-nuevas';
    f.setAttribute('role', 'status');
    var boton = document.getElementById('btn-entrar');
    var padre = sitio();
    if (padre && boton && boton.parentNode === padre) padre.insertBefore(f, boton);
    else if (padre) padre.appendChild(f);
    else document.body.insertBefore(f, document.body.firstChild);
    return f;
  }

  function elegir(id) {
    return window.showDirectoryPicker({ id: id, mode: 'readwrite' });
  }

  async function esLaMisma(a, b) {
    try { return !!(a && b && a.isSameEntry && await a.isSameEntry(sinRaw(b))); } catch (e) { return false; }
  }

  /* Los tres pasos: lo que se pide, cómo se llama el botón y si la carpeta señalada vale (devuelve '' o el error). */
  async function validar(paso, h, marca, viejos, nuevos) {
    if (!h || h.kind !== 'directory') return TEXTO_NO_ES;
    var nombre = String(h.name || '').trim().toLowerCase();
    if (paso === 'abiertos') {
      var g = await subcarpeta(h, App.CARPETA_GESTOR);
      var m = g ? await leerJsonSuave(g, MARCA) : null;
      return (m && m.id && m.id === marca.id) ? '' : TEXTO_NO_ES;
    }
    if (paso === 'archivo') {
      if (marca.archivo && nombre !== String(marca.archivo).trim().toLowerCase()) return TEXTO_NO_ES;
      if (await esLaMisma(h, viejos.archivo) || await esLaMisma(h, nuevos.abiertos)) return TEXTO_NO_ES;
      return '';
    }
    /* la carpeta de la copia sin internet: la de Drive, con la aplicación dentro */
    if (marca.copia && nombre !== String(marca.copia).trim().toLowerCase()) return TEXTO_NO_ES;
    try { await h.getFileHandle('index.html'); } catch (e) { return TEXTO_NO_ES; }
    return '';
  }

  var ROTULOS = {
    abiertos: { boton: 'Señalar la carpeta de asuntos abiertos de Drive', id: 'gestor-drive-abiertos' },
    archivo: { boton: 'Señalar el ARCHIVO de Drive', id: 'gestor-drive-archivo' },
    copia: { boton: 'Señalar la carpeta de esta copia en Drive', id: 'gestor-drive-copia' }
  };

  async function guardarYEntrar(marca, viejos, nuevos) {
    await Almacen.guardar('abiertos', nuevos.abiertos);
    await Almacen.guardar('archivo', nuevos.archivo);
    await Almacen.guardar('entrada', viejos.abiertos);   /* la raíz de Dropbox pasa a ser solo la entrada de sueltos */
    if (nuevos.copia) await Almacen.guardar('copiaCarpeta', nuevos.copia);
    if (window.RutaCarpetas && RutaCarpetas.olvidarRutaDeOtraNube) RutaCarpetas.olvidarRutaDeOtraNube('drive');
    App.E.abiertos = nuevos.abiertos;
    App.E.archivo = nuevos.archivo;
    if (App.marcarCarpeta) {
      App.marcarCarpeta('estado-abiertos', nuevos.abiertos.name);
      App.marcarCarpeta('estado-archivo', nuevos.archivo.name);
    }
    quitarFranja();
    var entrar = document.getElementById('btn-entrar');
    if (entrar) entrar.click();
  }

  /* La franja de señalar las carpetas de Drive (esta instalación aún apunta a Dropbox). */
  function mostrarSenalar(marca) {
    var f = crearFranja();
    var pasos = ['abiertos', 'archivo'];
    if (direccion().protocolo === 'file:' && marca.copia) pasos.push('copia');
    var viejos = { abiertos: App.E.abiertos, archivo: App.E.archivo };
    var nuevos = {};
    var i = 0;

    f.innerHTML = '<p class="franja-drive-texto"></p><p class="franja-drive-error oculto" id="franja-drive-error"></p>' +
      '<button type="button" class="boton boton-principal" id="franja-drive-senalar"></button>';
    f.querySelector('.franja-drive-texto').textContent = TEXTO_FRANJA;
    var boton = f.querySelector('#franja-drive-senalar');
    var error = f.querySelector('#franja-drive-error');
    function rotular() { boton.textContent = ROTULOS[pasos[i]].boton; }
    rotular();

    boton.onclick = async function () {
      error.classList.add('oculto');
      var paso = pasos[i];
      var h;
      try { h = await elegir(ROTULOS[paso].id); }
      catch (e) {
        if (e && e.name === 'AbortError') return;
        error.textContent = 'No he podido usar esa carpeta: ' + U.mensajeDeError(e);
        error.classList.remove('oculto');
        return;
      }
      var fallo = await validar(paso, h, marca, viejos, nuevos);
      if (fallo) { error.textContent = fallo; error.classList.remove('oculto'); return; }
      nuevos[paso] = h;
      i++;
      if (i < pasos.length) { rotular(); return; }
      boton.disabled = true;
      try { await guardarYEntrar(marca, viejos, nuevos); }
      catch (e) {
        boton.disabled = false;
        error.textContent = 'No he podido guardar las carpetas: ' + U.mensajeDeError(e);
        error.classList.remove('oculto');
      }
    };
  }

  /* La franja de la copia vieja: no deja trabajar. */
  function mostrarVieja(marca) {
    var f = crearFranja();
    f.classList.add('franja-drive-vieja');
    var nueva = rutaDeLaCopiaNueva(marca);
    f.innerHTML = '<p class="franja-drive-texto"></p>' +
      (nueva.ruta ? '<p class="franja-drive-ruta"><code></code></p><button type="button" class="boton" id="franja-drive-copiar">Copiar la ruta</button>' : '');
    f.querySelector('.franja-drive-texto').textContent = TEXTO_VIEJA;
    if (nueva.ruta) {
      f.querySelector('code').textContent = nueva.ruta;
      f.querySelector('#franja-drive-copiar').onclick = function () { U.copiar(nueva.ruta, this); };
    }
    var entrar = document.getElementById('btn-entrar');
    if (entrar) entrar.disabled = true;
  }

  /* Al pulsar «Entrar», antes de crear nada. Devuelve true si la entrada se para aquí. */
  async function alEntrar(abiertos) {
    var d = null;
    try { d = await leerMarca(abiertos); } catch (e) { d = null; }
    if (esCopiaVieja(null, !!d)) { mostrarVieja(d && d.marca); return true; }
    if (d && d.enDropbox) { mostrarSenalar(d.marca); return true; }
    return false;
  }

  /* Al cargar la página: una copia que está en «NO USAR» lo dice ya, sin esperar a «Entrar». */
  function alCargar() {
    if (esCopiaVieja(null, false) && sitio()) mostrarVieja(null);
  }

  alCargar();

  return {
    alEntrar: alEntrar, esCopiaVieja: esCopiaVieja, leerMarca: leerMarca, rutaDeLaCopiaNueva: rutaDeLaCopiaNueva,
    TEXTO_FRANJA: TEXTO_FRANJA, TEXTO_NO_ES: TEXTO_NO_ES, TEXTO_VIEJA: TEXTO_VIEJA, MARCA: MARCA
  };
})();
window.CarpetasEnDrive = CarpetasEnDrive;
