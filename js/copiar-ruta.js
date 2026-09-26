/* ============================================================
   copiar-ruta.js — el botón «Ruta» de la ficha del asunto, y también
   de los cuadros de Correo y de Mensaje de Séneca (23-sep-2026, fila
   98, docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md; 25-sep-2026, fila 152,
   docs/RUTA-QUE-NO-VA-A-BING.md).

   Abrir la carpeta desde la web sigue sin poderse (lo tiene prohibido
   el navegador, y está en la lista de descartado). Tampoco da la ruta
   de verdad: los manejadores de carpeta solo saben su nombre. Así que
   la parte de delante la apunta cada uno, una vez, en Ajustes → El
   centro → «Rutas de las carpetas en este ordenador».

   Se guarda en ESTE ordenador (localStorage), nunca en `_GESTOR`: la
   ruta del ordenador de Francisco no es la de su compañero.

   Qué copia (fila 152): la ruta entera, en formato `file:///`, para
   que el navegador la abra siempre como carpeta y nunca la busque en
   Bing (antes se copiaba con `\` o `/` a pelo, y sin ruta apuntada
   solo el nombre de la carpeta, que es justo lo que Bing buscaba):
     - abierto:   ruta de abiertos + nombre de la carpeta
     - archivado: ruta del ARCHIVO + lo de en medio (`a.ruta` del índice,
       "CATEGORIA / Tercero", o categoría y tercero si no está) + nombre
   Cada trozo va codificado (`encodeURIComponent`): espacios, `#`, `%`,
   comas y acentos no rompen la ruta. La ruta en Ajustes sigue
   apuntándose como siempre (`C:\...`, `\\servidor\...` o `/home/...`):
   la conversión a `file:///` se hace solo al copiar. Si alguien ya
   apunta ahí una `file:...`, se respeta tal cual.

   Sin ruta apuntada, **ya no se copia nada a medias** (antes copiaba
   el nombre suelto): se pide la ruta en ese momento y se copia ya
   completa. Desde la ficha del asunto, con `U.preguntar` (no hay
   ningún otro cuadro abierto); desde dentro del cuadro de Correo o de
   Séneca, en línea, dentro del propio cuadro (nunca un segundo
   `U.preguntar`), sin perder lo escrito.

   Fila 161 (25-sep-2026, docs/RUTA-SIN-PREGUNTAR.md): la ruta se
   parte en dos. Lo de DENTRO de Dropbox es igual en los dos
   ordenadores y se guarda una vez para todo el centro en
   `_GESTOR/rutas.json` (`{ abiertos, archivo }`, con `/`); dónde está
   Dropbox en ESTE ordenador se deduce: en la copia sin internet, de su
   propia dirección (`location.pathname`); en la web, de
   `localStorage` (`gestor-ruta-dropbox`, o de una ruta completa
   antigua). Solo se pregunta si falta algo, y el cuadro dice qué
   carpeta pide. Las rutas completas antiguas (`gestor-ruta-abiertos`
   y `gestor-ruta-archivo`) se siguen leyendo: rellenan solas
   `rutas.json` y, si no llevan ningún trozo `Dropbox`, se usan tal cual.

   Lo pone js/ficha-nombre-acciones.js en la fila de copiar, detrás de
   «Asunto», con `RutaCarpetas.boton(a, modo)`; y js/correo-cuadro.js y
   js/seneca-cuadro.js, en la cabecera del cuadro, con
   `RutaCarpetas.montarEnCuadro(lugar, contenedorEnLinea, a, modo)`.
   Lleva la clase `boton-copiar-fila`: en modo consulta sigue encendido
   (copiar no cambia nada).
   ============================================================ */
window.RutaCarpetas = (function () {

  var CLAVES = { abiertos: 'gestor-ruta-abiertos', archivo: 'gestor-ruta-archivo' };
  var CLAVE_DROPBOX = 'gestor-ruta-dropbox';
  var FICHERO = 'rutas.json';

  function leerLocal(clave) {
    try { return (window.localStorage.getItem(clave) || '').trim(); } catch (e) { return ''; }
  }
  function guardarLocal(clave, valor) {
    try { window.localStorage.setItem(clave, String(valor || '').trim()); } catch (e) { /* sin memoria: nada */ }
  }

  /* La ruta completa antigua (fila 98), tal como se apuntó. */
  function leer(cual) { return leerLocal(CLAVES[cual]); }
  function guardar(cual, valor) { guardarLocal(CLAVES[cual], valor); }

  function separadorDe(base) {
    return (/^[A-Za-z]:/.test(base) || /^\\\\/.test(base)) ? '\\' : '/';
  }

  /* Une la base con las piezas, con el separador que toque y sin
     barras repetidas por delante ni por detrás de cada pieza. */
  function unir(base, piezas) {
    var sep = separadorDe(base);
    var limpia = base.replace(/[\\\/]+$/, '');
    var resto = piezas.filter(Boolean).map(function (p) { return String(p).replace(/^[\\\/]+|[\\\/]+$/g, ''); });
    return [limpia].concat(resto).join(sep);
  }

  /* ---------- las dos mitades de una ruta (fila 161) ---------- */

  function esTrozoDropbox(t) { return t === 'Dropbox' || /^Dropbox \(/.test(t); }

  /* Una ruta en `file:` pasa a ruta normal, para poder partirla. */
  function sinFileUrl(ruta) {
    if (!/^file:/i.test(ruta)) return ruta;
    var r = ruta.replace(/^file:/i, '');
    try { r = decodeURIComponent(r); } catch (e) { /* se queda como está */ }
    if (/^\/\/\/[A-Za-z]:/.test(r)) return r.slice(3);
    if (/^\/\/\//.test(r)) return r.slice(2);
    if (/^\/\//.test(r)) return '\\\\' + r.slice(2).replace(/\//g, '\\');
    return r;
  }

  /* { dropbox, comun } o null si la ruta no lleva ningún trozo
     `Dropbox`. `dropbox` es lo de delante, con el trozo incluido y con
     el separador de siempre; `comun`, lo de detrás, con `/`. */
  function partir(ruta) {
    ruta = sinFileUrl(String(ruta || '').trim());
    if (!ruta) return null;
    var re = /[\\\/]+/g, m, inicio = 0;
    while (true) {
      m = re.exec(ruta);
      var fin = m ? m.index : ruta.length;
      var t = ruta.slice(inicio, fin);
      if (esTrozoDropbox(t)) {
        var resto = ruta.slice(fin).split(/[\\\/]+/).filter(Boolean).join('/');
        return { dropbox: ruta.slice(0, fin), comun: resto };
      }
      if (!m) return null;
      inicio = re.lastIndex;
    }
  }

  function ultimoTrozo(comun) {
    var t = String(comun || '').split('/').filter(Boolean);
    return t.length ? t[t.length - 1] : '';
  }

  /* El nombre de la carpeta señalada (abiertos o ARCHIVO). */
  function nombreCarpeta(cual) {
    var h = window.App && App.E && (cual === 'archivo' ? App.E.archivo : App.E.abiertos);
    return (h && h.name) || (cual === 'archivo' ? 'ARCHIVO' : 'ASUNTOS ABIERTOS');
  }

  /* La parte común vale solo si acaba en la carpeta señalada. */
  function cuadraCon(cual, comun) {
    var h = window.App && App.E && (cual === 'archivo' ? App.E.archivo : App.E.abiertos);
    if (!h || !h.name) return !!comun;
    return ultimoTrozo(comun).toLowerCase() === String(h.name).toLowerCase();
  }

  /* ---------- dónde está Dropbox en ESTE ordenador ---------- */

  function direccion() { return window.location; }

  function dropboxDeLaCopia() {
    var loc = direccion();
    if (!loc || loc.protocol !== 'file:') return '';
    var camino = loc.pathname || '';
    try { camino = decodeURIComponent(camino); } catch (e) { /* tal cual */ }
    if (/^\/[A-Za-z]:/.test(camino)) camino = camino.slice(1).replace(/\//g, '\\');
    var p = partir(camino);
    return p ? p.dropbox : '';
  }

  function dropboxDeEsteOrdenador() {
    var deLaCopia = dropboxDeLaCopia();
    if (deLaCopia) return { valor: deLaCopia, deducido: true };
    var apuntado = leerLocal(CLAVE_DROPBOX);
    if (apuntado) return { valor: apuntado, deducido: false };
    var antiguas = [leer('abiertos'), leer('archivo')];
    for (var i = 0; i < antiguas.length; i++) {
      var p = partir(antiguas[i]);
      if (p) return { valor: p.dropbox, deducido: false };
    }
    return { valor: '', deducido: false };
  }

  /* ---------- la parte de dentro de Dropbox, para todo el centro ---------- */

  var comun = {};   /* lo último leído de _GESTOR/rutas.json */

  function limpiarComun(v) {
    return String(v || '').split(/[\\\/]+/).map(function (t) { return t.trim(); }).filter(Boolean).join('/');
  }

  async function leerFichero() {
    if (!window.App || !App.E || !App.E.gestor) return null;
    try { return (await Carpetas.leerJson(App.E.gestor, FICHERO)) || {}; }
    catch (e) { return null; }
  }

  /* Relee antes de guardar y solo cambia las claves que se le dan
     (`soloSiFalta`: no pisa una que ya esté). */
  async function guardarComun(cambios, soloSiFalta) {
    if (!window.App || !App.E || !App.E.gestor) return;
    var hacer = async function () {
      var disco = (await leerFichero()) || {};
      var cambia = false;
      Object.keys(cambios).forEach(function (k) {
        var v = limpiarComun(cambios[k]);
        if (soloSiFalta && disco[k]) return;
        if (disco[k] === v) return;
        if (v) disco[k] = v; else delete disco[k];
        cambia = true;
      });
      comun = disco;
      if (cambia) await Copias.guardar(App.E.gestor, FICHERO, disco);
    };
    if (window.ColaGuardado) await ColaGuardado.poner(FICHERO, hacer);
    else await hacer();
  }

  /* Relee `rutas.json` y, si le falta una clave que se puede sacar de
     una ruta completa antigua de este navegador, la rellena. */
  async function cargarComun() {
    var leido = await leerFichero();
    if (leido) comun = leido;
    var falta = {};
    ['abiertos', 'archivo'].forEach(function (cual) {
      if (comun[cual]) return;
      var p = partir(leer(cual));
      if (p && p.comun && cuadraCon(cual, p.comun)) falta[cual] = p.comun;
    });
    if (Object.keys(falta).length) {
      try { await guardarComun(falta, true); }
      catch (e) { Object.keys(falta).forEach(function (k) { comun[k] = limpiarComun(falta[k]); }); }
    }
    return comun;
  }

  /* La ruta de la carpeta (abiertos o ARCHIVO) en este ordenador, o ''.
     `falta`: 'dropbox', 'comun' o ''. */
  function rutaDe(cual) {
    var db = dropboxDeEsteOrdenador().valor;
    var c = comun[cual];
    if (db && c) return { ruta: unir(db, c.split('/')), falta: '' };
    var antigua = leer(cual);
    if (antigua) return { ruta: antigua, falta: '' };
    return { ruta: '', falta: !db ? 'dropbox' : 'comun' };
  }

  /* Lo de en medio de un asunto archivado, en piezas. */
  function piezasDelArchivo(a) {
    if (a.ruta) return String(a.ruta).split(' / ').map(function (x) { return x.trim(); }).filter(Boolean);
    var ficha = a.ficha || {};
    var categoria = a.categoria || ficha.categoria || '';
    var tercero = a.tercero !== undefined ? a.tercero : (ficha.tercero || '');
    return [categoria, tercero].filter(Boolean);
  }

  /* ---------- convertir a `file:///`, que el navegador siempre abre
     como carpeta (fila 152) ---------- */

  function esFileUrl(base) { return /^file:/i.test(base); }
  function esRed(base) { return /^\\\\/.test(base); }
  function esWindows(base) { return /^[A-Za-z]:/.test(base); }
  function trozo(t) { return encodeURIComponent(String(t)); }

  function comoFileUrl(base, piezas) {
    var restos = piezas.filter(Boolean).map(trozo);
    if (esFileUrl(base)) {
      return [base.replace(/[\/]+$/, '')].concat(restos).join('/');
    }
    if (esRed(base)) {
      var partesRed = base.replace(/^\\\\/, '').split(/[\\\/]+/).filter(Boolean).map(trozo);
      return 'file://' + partesRed.concat(restos).join('/');
    }
    if (esWindows(base)) {
      var unidad = base.slice(0, 2);
      var partesWin = base.slice(2).split(/[\\\/]+/).filter(Boolean).map(trozo);
      return 'file:///' + unidad + '/' + partesWin.concat(restos).join('/');
    }
    var partesLinux = base.split(/[\\\/]+/).filter(Boolean).map(trozo);
    return 'file:///' + partesLinux.concat(restos).join('/');
  }

  /* { texto, completa }: completa es false si falta la ruta apuntada.
     `texto` es la URL `file:///...`, lista para pegar en el navegador
     o en el explorador de archivos; sin ruta apuntada, vacío: ya no se
     copia el nombre suelto (fila 152, antes de esto Bing lo buscaba). */
  function de(a, modo) {
    var archivado = modo === 'archivado';
    var base = rutaDe(archivado ? 'archivo' : 'abiertos').ruta;
    if (!base) return { texto: '', completa: false };
    return {
      texto: comoFileUrl(base, (archivado ? piezasDelArchivo(a) : []).concat([a.nombre])),
      completa: true
    };
  }

  /* ---------- pedir la ruta cuando falta (fila 152) ----------

     Una sola función de verdad para las dos formas (regla del
     encargo): construye el HTML del formulario; quien la llama decide
     si va dentro de `U.preguntar` (la ficha del asunto, donde no hay
     ningún cuadro abierto) o en línea, dentro de un cuadro ya abierto
     (Correo/Séneca), y qué hacer al guardar. */
  function cuerpoPedirRutaHTML(idCampo, cual) {
    var nombre = nombreCarpeta(cual);
    var c = comun[cual];
    var ejemplo = c ? 'C:\\Users\\tu usuario\\Dropbox\\' + c.split('/').join('\\')
                    : 'C:\\Users\\tu usuario\\Dropbox\\...\\' + nombre;
    return '<label class="etiqueta" style="margin-top:0">Pega la ruta de la carpeta <b>' + U.escapar(nombre) +
        '</b> de este ordenador</label>' +
      '<input id="' + idCampo + '" class="campo" placeholder="' + U.escapar(ejemplo) + '">' +
      '<p class="nota">Por ejemplo: ' + U.escapar(ejemplo) + '<br>En el explorador de archivos, abre esa carpeta, ' +
      'pulsa en la barra de arriba y copia.</p>';
  }

  /* Guarda lo que falte y copia ya la ruta completa del asunto,
     avisando con el propio botón (mismo patrón que U.copiar en el
     resto de la aplicación). La ruta pegada se parte por el trozo
     `Dropbox`: lo de delante, a este ordenador; lo de detrás, a
     `rutas.json` para todo el centro (si no estaba). Primero se copia
     y después se guarda: el navegador solo deja copiar justo después
     del clic. */
  function guardarYCopiar(cual, valor, a, modo, boton) {
    valor = String(valor || '').trim();
    if (!valor) return false;
    var p = partir(valor);
    var paraElCentro = null;
    if (p && p.comun) {
      if (!cuadraCon(cual, p.comun)) {
        U.aviso('Esa ruta no acaba en la carpeta ' + nombreCarpeta(cual) + '. Pega la de esa carpeta.', 'malo');
        return false;
      }
      if (!dropboxDeLaCopia()) guardarLocal(CLAVE_DROPBOX, p.dropbox);
      if (!comun[cual]) { comun[cual] = limpiarComun(p.comun); paraElCentro = {}; paraElCentro[cual] = p.comun; }
    } else {
      guardar(cual, valor);
    }
    var r = de(a, modo);
    if (r.completa) U.copiar(r.texto, boton, { avisoFallo: 'No he podido copiarlo. Es ' + r.texto + '.' });
    if (paraElCentro) {
      guardarComun(paraElCentro, true).catch(function (e) {
        U.accesorio('Copiado, pero no he podido guardar la ruta para todo el centro', e);
      });
    }
    return true;
  }

  /* Desde la ficha del asunto: con `U.preguntar`, el único cuadro de
     diálogo que hay cuando no hay ninguno abierto todavía. */
  async function pedirRutaConPreguntar(a, modo, boton) {
    var cual = modo === 'archivado' ? 'archivo' : 'abiertos';
    var idCampo = 'ruta-pedida-ficha';
    var ok = await U.preguntar('Ruta de la carpeta ' + nombreCarpeta(cual), cuerpoPedirRutaHTML(idCampo, cual), 'Guardar y copiar');
    if (!ok) return;
    var campo = document.getElementById(idCampo);
    guardarYCopiar(cual, campo ? campo.value : '', a, modo, boton);
  }

  /* Desde dentro del cuadro de Correo o de Séneca: en línea, en un
     bloque hermano del formulario (nunca un segundo `U.preguntar`),
     sin perder nada de lo escrito. */
  function pedirRutaEnLinea(contenedor, a, modo, boton) {
    if (!contenedor) return;
    var cual = modo === 'archivado' ? 'archivo' : 'abiertos';
    var idCampo = 'ruta-pedida-en-linea';
    contenedor.className = 'ruta-en-linea';
    contenedor.innerHTML = cuerpoPedirRutaHTML(idCampo, cual) +
      '<div class="correo-botones" style="margin-top:8px">' +
        '<button type="button" class="boton boton-principal" id="ruta-en-linea-guardar">Guardar y copiar</button>' +
        '<button type="button" class="boton" id="ruta-en-linea-cancelar">Cancelar</button>' +
      '</div>';
    function cerrar() { contenedor.className = 'oculto'; contenedor.innerHTML = ''; }
    document.getElementById('ruta-en-linea-cancelar').onclick = cerrar;
    document.getElementById('ruta-en-linea-guardar').onclick = function () {
      var campo = document.getElementById(idCampo);
      if (guardarYCopiar(cual, campo ? campo.value : '', a, modo, boton)) cerrar();
    };
  }

  /* `opciones.enLinea`: cuando el botón vive dentro de un cuadro ya
     abierto (Correo/Séneca), `opciones.contenedor` es el elemento
     hermano donde pintar el formulario en línea si falta la ruta. Sin
     `opciones`, se pide con `U.preguntar` (la ficha del asunto). */
  function boton(a, modo, opciones) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton boton-copiar-fila';
    b.textContent = 'Ruta';
    b.title = 'Copiar la ruta de la carpeta, para pegarla en el navegador o en el explorador de archivos';
    b.onclick = async function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      await cargarComun();
      var r = de(a, modo);
      if (!r.completa) {
        if (opciones && opciones.enLinea) pedirRutaEnLinea(opciones.contenedor, a, modo, b);
        else pedirRutaConPreguntar(a, modo, b);
        return;
      }
      U.copiar(r.texto, b, { avisoFallo: 'No he podido copiarlo. Es ' + r.texto + '.' });
    };
    return b;
  }

  /* Monta el botón «Ruta» en la cabecera de un cuadro de Comunicar
     (Correo o Séneca): `lugar` es donde vive el botón, `contenedorEnLinea`
     el bloque hermano, inicialmente oculto, para pedir la ruta sin
     salir del cuadro (fila 152, punto 3). Una sola función para los
     dos cuadros; no duplicar. */
  function montarEnCuadro(lugar, contenedorEnLinea, a, modo) {
    if (!lugar) return;
    lugar.innerHTML = '';
    lugar.appendChild(boton(a, modo, { enLinea: true, contenedor: contenedorEnLinea }));
  }

  /* ---------- el bloque de Ajustes → El centro ---------- */

  function ponerBloque() {
    var tab = document.getElementById('ajustes-tab-centro');
    if (!tab || document.getElementById('bloque-rutas')) return;
    var det = document.createElement('details');
    det.className = 'bloque-ajustes';
    det.id = 'bloque-rutas';
    det.innerHTML =
      '<summary><span class="bloque-titulo">Rutas de las carpetas</span>' +
      '<span class="bloque-pie">Para el botón «Ruta» de la ficha del asunto</span></summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="nota">Dentro de Dropbox (para todo el centro): es igual en los dos ordenadores.</p>' +
        '<label class="etiqueta">Carpeta de asuntos abiertos, dentro de Dropbox</label>' +
        '<input id="ruta-comun-abiertos" class="campo" placeholder="ADMINISTRACIÓN/.../ASUNTOS ABIERTOS">' +
        '<label class="etiqueta">Carpeta ARCHIVO, dentro de Dropbox</label>' +
        '<input id="ruta-comun-archivo" class="campo" placeholder="ADMINISTRACIÓN/.../ARCHIVO">' +
        '<label class="etiqueta">Dropbox en este ordenador</label>' +
        '<div id="ruta-dropbox-lugar"></div>' +
      '</div>';
    tab.appendChild(det);
    det.addEventListener('toggle', function () { if (det.open) pintarBloque(); });
    pintarBloque();
  }

  async function pintarBloque() {
    var lugar = document.getElementById('ruta-dropbox-lugar');
    if (!lugar) return;
    try { await cargarComun(); } catch (e) { /* se pinta con lo que haya */ }
    ['abiertos', 'archivo'].forEach(function (cual) {
      var campo = document.getElementById('ruta-comun-' + cual);
      if (document.activeElement !== campo) campo.value = comun[cual] || '';
      campo.onchange = async function () {
        var cambios = {}; cambios[cual] = campo.value;
        try {
          await guardarComun(cambios, false);
          U.aviso('Ruta guardada para todo el centro.', 'bueno');
        } catch (e) { U.fallo('No he podido guardar la ruta', e); }
      };
    });
    var db = dropboxDeEsteOrdenador();
    if (dropboxDeLaCopia()) {
      lugar.innerHTML = '<p class="nota" id="ruta-dropbox-deducida">' + U.escapar(db.valor) +
        ' <span class="nota">(sale sola de la dirección de esta copia)</span></p>';
      return;
    }
    lugar.innerHTML = '<input id="ruta-dropbox" class="campo" placeholder="C:\\Users\\tu usuario\\Dropbox">';
    var campo = document.getElementById('ruta-dropbox');
    campo.value = db.valor;
    campo.onchange = function () {
      guardarLocal(CLAVE_DROPBOX, campo.value);
      U.aviso('Guardado en este ordenador.', 'bueno');
    };
  }

  ponerBloque();

  /* Lo último leído de `_GESTOR/rutas.json` ({abiertos, archivo}), sin
     esperar a nada: para cálculos síncronos como Nombres.topes()
     (fila 177). Puede venir vacío si `cargarComun()` no se ha llamado
     todavía en esta sesión. */
  function comunActual() { return comun; }

  return {
    leer: leer, guardar: guardar, unir: unir, de: de, boton: boton,
    montarEnCuadro: montarEnCuadro, comoFileUrl: comoFileUrl, ponerBloque: ponerBloque,
    partir: partir, cargarComun: cargarComun, dropboxDeEsteOrdenador: dropboxDeEsteOrdenador,
    pintarBloque: pintarBloque, comunActual: comunActual
  };
})();
