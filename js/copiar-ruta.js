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

   Lo pone js/ficha-nombre-acciones.js en la fila de copiar, detrás de
   «Asunto», con `RutaCarpetas.boton(a, modo)`; y js/correo-cuadro.js y
   js/seneca-cuadro.js, en la cabecera del cuadro, con
   `RutaCarpetas.montarEnCuadro(lugar, contenedorEnLinea, a, modo)`.
   Lleva la clase `boton-copiar-fila`: en modo consulta sigue encendido
   (copiar no cambia nada).
   ============================================================ */
window.RutaCarpetas = (function () {

  var CLAVES = { abiertos: 'gestor-ruta-abiertos', archivo: 'gestor-ruta-archivo' };

  function leer(cual) {
    try { return (window.localStorage.getItem(CLAVES[cual]) || '').trim(); } catch (e) { return ''; }
  }

  function guardar(cual, valor) {
    try { window.localStorage.setItem(CLAVES[cual], String(valor || '').trim()); } catch (e) { /* sin memoria: nada */ }
  }

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
    var base = leer(archivado ? 'archivo' : 'abiertos');
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
  function cuerpoPedirRutaHTML(idCampo) {
    return '<label class="etiqueta" style="margin-top:0">Ruta de la carpeta en este ordenador</label>' +
      '<input id="' + idCampo + '" class="campo" placeholder="C:\\Users\\nombre\\Dropbox\\...">' +
      '<p class="nota">Cópiala de la barra del explorador de archivos.</p>';
  }

  /* Guarda la ruta que falte y copia ya la ruta completa del asunto,
     avisando con el propio botón (mismo patrón que U.copiar en el
     resto de la aplicación). */
  function guardarYCopiar(cual, valor, a, modo, boton) {
    if (!String(valor || '').trim()) return false;
    guardar(cual, valor);
    var r = de(a, modo);
    if (r.completa) U.copiar(r.texto, boton, { avisoFallo: 'No he podido copiarlo. Es ' + r.texto + '.' });
    return true;
  }

  /* Desde la ficha del asunto: con `U.preguntar`, el único cuadro de
     diálogo que hay cuando no hay ninguno abierto todavía. */
  async function pedirRutaConPreguntar(a, modo, boton) {
    var cual = modo === 'archivado' ? 'archivo' : 'abiertos';
    var idCampo = 'ruta-pedida-ficha';
    var ok = await U.preguntar('Ruta de la carpeta', cuerpoPedirRutaHTML(idCampo), 'Guardar y copiar');
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
    contenedor.innerHTML = cuerpoPedirRutaHTML(idCampo) +
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
    b.onclick = function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
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
      '<summary><span class="bloque-titulo">Rutas de las carpetas en este ordenador</span>' +
      '<span class="bloque-pie">Para el botón «Ruta» de la ficha del asunto</span></summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="nota">Se guardan solo en este ordenador, no en la carpeta compartida: la ruta ' +
        'de cada ordenador es distinta. Cópiala de la barra del explorador de archivos.</p>' +
        '<label class="etiqueta">Ruta de la carpeta de asuntos abiertos en este ordenador</label>' +
        '<input id="ruta-abiertos" class="campo" placeholder="C:\\Users\\nombre\\Dropbox\\...\\ASUNTOS ABIERTOS">' +
        '<label class="etiqueta">Ruta de la carpeta ARCHIVO en este ordenador</label>' +
        '<input id="ruta-archivo" class="campo" placeholder="C:\\Users\\nombre\\Dropbox\\...\\ARCHIVO">' +
      '</div>';
    tab.appendChild(det);
    ['abiertos', 'archivo'].forEach(function (cual) {
      var campo = document.getElementById('ruta-' + cual);
      campo.value = leer(cual);
      campo.onchange = function () { guardar(cual, campo.value); U.aviso('Ruta guardada en este ordenador.', 'bueno'); };
    });
  }

  ponerBloque();

  return {
    leer: leer, guardar: guardar, unir: unir, de: de, boton: boton,
    montarEnCuadro: montarEnCuadro, comoFileUrl: comoFileUrl, ponerBloque: ponerBloque
  };
})();
