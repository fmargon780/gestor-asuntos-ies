/* ============================================================
   campo-desde-el-asunto.js — añadir un campo desde un asunto abierto
   (1-oct-2026, fila 245, docs/CAMPO-DESDE-EL-ASUNTO.md).

   En «Datos del trámite» de la ficha, el botón «+ Añadir campo» abre el
   mismo panel que «+ Añadir campo» de Ajustes del tipo
   (js/campos-catalogo.js, sin los campos que el asunto ya tiene). Elegido
   el campo se pide su valor en el mismo paso y el bloque «¿Dónde se
   guarda?» (js/donde-se-guarda.js):

     (•) En el tipo X        ← marcada; el campo entra en `porTipo` de
                               `_GESTOR/campos.json`, vacío en los demás
     ( ) Solo en este asunto ← la entrada se guarda en
                               `ficha.camposPropiosDelAsunto` (la misma forma
                               que una de `porTipo`) y su valor, con los
                               demás, en `ficha.campos`

   Un campo «solo aquí» sale en la ficha con su marca y un «⋮» con «Pasar
   al tipo» y «Quitar». Los campos de un asunto son los del tipo más estos
   (`Campos.camposDeAsunto`). Tras llevar un campo al tipo, el aviso verde
   lleva «Deshacer» (8 segundos): el tipo vuelve a como estaba y en este
   asunto el campo se queda como «solo aquí», con su valor.

   Sin tipo, o en el ARCHIVO, no hay nada que preguntar: sin tipo se guarda
   directamente «solo aquí»; en el ARCHIVO no sale el botón.
   ============================================================ */
window.CampoDesdeElAsunto = (function () {

  function $(id) { return document.getElementById(id); }
  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  function tipoDe(a) { return DondeSeGuarda.tipoDe(a); }

  function configDelTipo(tipo) {
    return ((App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || []);
  }

  function fichaFresca(a) {
    return (App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre]) || a.ficha || {};
  }

  function categoriaDe(a, tipo) {
    var deTipo = tipo ? Nombres.categoriaDeTipo(App.E.tipos, tipo) : '';
    return deTipo || (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || 'OTROS';
  }

  /* La entrada tal como se guarda en la configuración de un tipo: sin lo
     que solo vale dentro de la ficha (`soloAqui`). */
  function entradaLimpia(c) {
    var e = c.origen === 'fichero' ? { origen: 'fichero', columna: c.columna } : { origen: c.origen, id: c.id };
    e.obligatorio = false;
    e.enNombre = false;
    return e;
  }

  function textoLlegada(n) {
    return n === 1 ? '1 asunto abierto' : n + ' asuntos abiertos';
  }

  /* PURA. El aviso verde de después de llevar un campo al tipo. */
  function textoAlTipo(tipoCorto, otros) {
    return 'Campo añadido al tipo ' + tipoCorto + (otros ? ' y a ' + textoLlegada(otros) : '') + '.';
  }

  /* ---------- el valor de partida ---------- */

  /* De fichero o calculado: lo que ya sepa la persona del tercero. Sin
     persona (o con un campo propio), vacío. */
  async function valorDePartida(a, cfg, categoria) {
    if (cfg.origen === 'propio') return '';
    try {
      var quien = ((a.ficha && a.ficha.tercero) || '').trim();
      if (!quien || !App.E.datos) return '';
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var lista = Datos.buscar(fuente.lista, quien, 1);
      if (!lista.length) lista = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      return lista.length ? (Campos.valorInicial(cfg, lista[0], App.E.campos) || '') : '';
    } catch (e) { return ''; }
  }

  /* ---------- 1. elegir el campo (el panel de Ajustes) ---------- */

  async function elegirCampo(a, tipo, categoria) {
    var lista = Campos.camposDeAsunto(configDelTipo(tipo), fichaFresca(a)).map(copia);
    var inicial = lista.length;
    var elegido = null;
    var capa = document.querySelector('#capa .cuadro');
    var espera = U.preguntar('Añadir un campo', '<div id="cad-panel"></div>', 'Cerrar');
    if (capa) capa.classList.add('cuadro-alto');
    CamposCatalogo.abrir($('cad-panel'), { tipo: tipo, categoria: categoria }, lista, {
      textoVolver: '← Volver',
      onCambio: function () {
        if (lista.length < inicial) { inicial = lista.length; return; }   /* se ha borrado un campo propio */
        if (elegido || lista.length === inicial) return;
        elegido = lista[lista.length - 1];
        $('cuadro-cancelar').click();
      },
      onVolver: function () { $('cuadro-cancelar').click(); }
    });
    await espera;
    if (capa) capa.classList.remove('cuadro-alto');
    return elegido;
  }

  /* ---------- 2 y 3. el valor y «¿Dónde se guarda?» ---------- */

  /* { valor, donde: 'tipo' | 'aqui' } o null (Escape o Cancelar). */
  async function pedirValorYDonde(a, tipo, cfg, categoria) {
    var nombre = Campos.nombreDeCampo(cfg, App.E.campos);
    var propio = cfg.origen === 'propio' ? Campos.propioDe(cfg.id, App.E.campos) : null;
    var inicial = await valorDePartida(a, cfg, categoria);
    var control = (propio && propio.clase === 'lista')
      ? '<select id="cad-valor" class="campo"><option value="">Sin elegir</option>' +
        (propio.valores || []).map(function (v) {
          return '<option value="' + U.escapar(v) + '"' + (v === inicial ? ' selected' : '') + '>' + U.escapar(v) + '</option>';
        }).join('') + '</select>'
      : '<input id="cad-valor" class="campo" autocomplete="off" value="' + U.escapar(inicial) + '">';
    var tipoCorto = tipo ? DondeSeGuarda.nombreCortoDe(tipo) : '';
    var bloque = tipo ? DondeSeGuarda.bloqueHTML({
      tipoCorto: tipoCorto, opcionTipo: 'En el tipo ' + tipoCorto, vacio: true,
      otros: DondeSeGuarda.otrosAbiertos(a).length
    }) : '';
    var espera = U.preguntar('Añadir el campo «' + nombre + '»',
      '<label class="etiqueta">' + U.escapar(nombre) + ' <span class="suave">(se puede dejar vacío)</span></label>' +
      control + bloque, 'Guardar');
    if (tipo) DondeSeGuarda.enganchar();
    var campo = $('cad-valor');
    DondeSeGuarda.introAcepta(campo);
    if (campo) campo.focus();
    var ok = await espera;
    if (!ok) return null;
    return { valor: (campo.value || '').trim(), donde: tipo && DondeSeGuarda.elegido() === 'guia' ? 'tipo' : 'aqui' };
  }

  /* ---------- lo que se escribe ---------- */

  /* El campo entra en la configuración del tipo (al final, sin
     «Obligatorio» ni «Añadir al nombre»). Devuelve las claves que tenía el
     tipo antes, para «Deshacer». */
  function anadirAlTipo(tipo, entrada) {
    var clave = Campos.claveDeCampo(entrada);
    var antes = null;
    return App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
      antes = lista.map(Campos.claveDeCampo);
      if (antes.indexOf(clave) !== -1) return actual;
      return Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista.concat([entrada]));
    }).then(function (config) { App.E.campos = config; return antes; });
  }

  /* Una sola escritura de la ficha del asunto, releída del disco justo
     antes. `o`: valor (si no viene, se deja el que tenía), anadir (una
     entrada para `camposPropiosDelAsunto`), quitar (true: sale de la lista
     «solo aquí»; con `borrarValor`, también su valor). */
  function escribirEnAsunto(a, clave, o) {
    return App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(a.nombre);
      var ficha = registro.asuntos[a.nombre] || (registro.asuntos[a.nombre] = {});
      var campos = (ficha.campos && !Array.isArray(ficha.campos)) ? Object.assign({}, ficha.campos) : {};
      if (o.borrarValor) delete campos[clave];
      else if (o.valor !== undefined) campos[clave] = { valor: o.valor, enNombre: false };
      ficha.campos = campos;
      var lista = (ficha.camposPropiosDelAsunto || []).filter(function (c) { return Campos.claveDeCampo(c) !== clave; });
      if (o.anadir) lista.push(o.anadir);
      if (lista.length) ficha.camposPropiosDelAsunto = lista; else delete ficha.camposPropiosDelAsunto;
    });
  }

  function repintar(a) {
    var N = window.FichaNucleo;
    if (N && N.actual && N.actual.nombre === a.nombre) {
      var fresca = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
      if (fresca) N.actual.ficha = fresca;
      N.pintar();
    }
  }

  /* ---------- «Deshacer» ---------- */

  async function deshacer(a, tipo, entrada, antes, tipoCorto) {
    var clave = Campos.claveDeCampo(entrada);
    var parcial = false;
    try {
      await App.enFila('campos.json', async function () {
        var actual = await Campos.leer(App.E.gestor);
        var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
        var claves = lista.map(Campos.claveDeCampo);
        var esperado = antes.concat([clave]);
        if (JSON.stringify(claves) !== JSON.stringify(esperado)) { parcial = true; return; }
        App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista.slice(0, antes.length));
      });
      await escribirEnAsunto(a, clave, { anadir: entrada });
    } catch (e) { U.fallo('No he podido deshacerlo', e); return; }
    repintar(a);
    if (parcial) U.aviso('No he podido deshacerlo del todo: el tipo ha cambiado por otro lado y no lo he pisado.', 'ambar');
    else U.aviso('Deshecho: se queda solo en este asunto.', 'bueno');
  }

  /* ---------- guardar ---------- */

  /* Lleva el campo al tipo, con su aviso y su «Deshacer». `valor`
     undefined: el asunto se queda con el que tenía. */
  async function guardarEnElTipo(a, tipo, entrada, valor) {
    var clave = Campos.claveDeCampo(entrada);
    var tipoCorto = DondeSeGuarda.nombreCortoDe(tipo);
    var otros = DondeSeGuarda.otrosAbiertos(a).length;
    var antes = await anadirAlTipo(tipo, entrada);
    try {
      await escribirEnAsunto(a, clave, { valor: valor, quitar: true });
    } catch (e) {
      U.accesorio('El campo ya está en el tipo, pero no he podido guardar su valor en este asunto', e);
      return;
    }
    repintar(a);
    U.aviso(textoAlTipo(tipoCorto, otros), 'bueno', {
      boton: 'Deshacer', alPulsar: function () { deshacer(a, tipo, entrada, antes, tipoCorto); }
    });
  }

  async function guardarSoloAqui(a, entrada, valor) {
    await escribirEnAsunto(a, Campos.claveDeCampo(entrada), { valor: valor, anadir: entrada });
    repintar(a);
    U.aviso('Campo añadido solo a este asunto.', 'bueno');
  }

  /* ---------- el botón «+ Añadir campo» ---------- */

  async function abrir(a) {
    try {
      var tipo = tipoDe(a);
      var categoria = categoriaDe(a, tipo);
      var cfg = await elegirCampo(a, tipo, categoria);
      if (!cfg) return;
      var r = await pedirValorYDonde(a, tipo, cfg, categoria);
      if (!r) return;
      var entrada = entradaLimpia(cfg);
      if (r.donde === 'tipo') await guardarEnElTipo(a, tipo, entrada, r.valor);
      else await guardarSoloAqui(a, entrada, r.valor);
    } catch (e) {
      U.fallo('No he podido añadir el campo', e);
    }
  }

  /* ---------- un campo «solo aquí»: «⋮» ---------- */

  async function pasarAlTipo(a, clave) {
    var tipo = tipoDe(a);
    var entrada = ((fichaFresca(a).camposPropiosDelAsunto) || []).filter(function (c) { return Campos.claveDeCampo(c) === clave; })[0];
    if (!tipo || !entrada) return;
    try { await guardarEnElTipo(a, tipo, entradaLimpia(entrada), undefined); }
    catch (e) { U.fallo('No he podido pasarlo al tipo', e); }
  }

  async function quitar(a, clave, nombre) {
    var ok = await U.preguntar('Quitar el campo',
      '<p>¿Quitar «' + U.escapar(nombre) + '» de este asunto? Se pierde también su valor.</p>', 'Quitar');
    if (!ok) return;
    try {
      await escribirEnAsunto(a, clave, { quitar: true, borrarValor: true });
      repintar(a);
      U.aviso('Campo quitado de este asunto.', 'bueno');
    } catch (e) { U.fallo('No he podido quitarlo', e); }
  }

  /* ---------- lo que pinta la ficha ---------- */

  /* La fila del botón, al final de «Datos del trámite» (solo en un asunto
     abierto; en modo consulta la ficha apaga los botones sola). */
  function filaAnadirHtml() {
    return '<div class="ficha-dato ficha-dato-anadir"><span></span><span>' +
      '<button type="button" class="boton" id="ficha-campo-anadir">+ Añadir campo</button></span></div>';
  }

  /* Tras pintar la ficha: engancha el botón y los «⋮». */
  function alPintar(caja, a) {
    var b = caja.querySelector('#ficha-campo-anadir');
    if (b) b.onclick = function () { abrir(a); };
    Array.prototype.forEach.call(caja.querySelectorAll('.campo-aqui-menu'), function (boton) {
      var clave = boton.dataset.clave;
      var nombre = boton.dataset.nombre || clave;
      if (!window.FichaMenus) return;
      FichaMenus.montar(boton, [
        { texto: 'Pasar al tipo', deshabilitado: !tipoDe(a), title: tipoDe(a) ? '' : 'Este asunto no tiene tipo',
          alPulsar: function () { pasarAlTipo(a, clave); } },
        { texto: 'Quitar', clase: 'ficha-menu-peligro', alPulsar: function () { quitar(a, clave, nombre); } }
      ]);
    });
  }

  return {
    textoAlTipo: textoAlTipo,
    filaAnadirHtml: filaAnadirHtml,
    alPintar: alPintar,
    abrir: abrir
  };
})();
