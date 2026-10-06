/* ============================================================
   campo-desde-el-asunto.js — añadir un campo desde un asunto abierto
   (1-oct-2026, fila 245, docs/CAMPO-DESDE-EL-ASUNTO.md).

   En la tarjeta «Campos del asunto» de la ficha (antes «Datos del trámite»), el botón «+ Añadir campo» abre el
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

   Fila 276: desde la ficha, un campo que el asunto ya tiene pero está vacío lleva
   «Rellenar» (en el grupo de arriba de «De la ficha» y en «Míos»/«Calculados»): pide
   solo el valor, sin «¿Dónde se guarda?», y lo escribe en la ficha del asunto.

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
  function entradaLimpia(c, marcaDeHito) {
    var e = c.origen === 'fichero' ? { origen: 'fichero', columna: c.columna } : { origen: c.origen, id: c.id };
    if (marcaDeHito || c.hito) e.hito = marcaDeHito || c.hito;   /* fila 255 */
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

  /* Fila 276: los campos del asunto cuyo valor guardado está vacío (o solo espacios). */
  function sinRellenar(a, lista) {
    var campos = fichaFresca(a).campos;
    campos = (campos && !Array.isArray(campos)) ? campos : {};
    return lista.filter(function (c) {
      var g = campos[Campos.claveDeCampo(c)];
      return !(g && String(g.valor === undefined || g.valor === null ? '' : g.valor).trim());
    });
  }

  /* ---------- 1. elegir el campo (el panel de Ajustes) ---------- */

  async function elegirCampo(a, tipo, categoria, hito) {
    var lista = Campos.camposDeAsunto(configDelTipo(tipo), fichaFresca(a)).map(copia);
    var inicial = lista.length;
    var elegido = null;
    var capa = document.querySelector('#capa .cuadro');
    var espera = U.preguntar(hito ? 'Añadir un campo al hito «' + hito.titulo + '»' : 'Añadir un campo',
      '<div id="cad-panel"></div>', 'Cerrar');
    if (capa) capa.classList.add('cuadro-campos');
    /* Fila 276: desde la ficha (sin hito), los campos del asunto que están vacíos se rellenan. */
    var vacios = hito ? [] : sinRellenar(a, lista);
    var clavesVacias = {};
    vacios.forEach(function (c) { clavesVacias[Campos.claveDeCampo(c)] = true; });
    function elegirRellenar(c) {
      if (elegido) return;
      elegido = Object.assign({}, c, { rellenar: true });
      $('cuadro-cancelar').click();
    }
    CamposCatalogo.abrir($('cad-panel'), { tipo: tipo, categoria: categoria }, lista, {
      textoVolver: '← Volver',
      textoYaPuesto: 'ya está en este asunto',
      /* Fila 255: desde un hito, arriba los campos del asunto que no son de ningún hito. */
      yaEstan: hito ? lista.filter(function (c) { return !c.hito; }) : vacios,
      tituloYaEstan: hito ? undefined : 'Ya están en este asunto, sin rellenar',
      textoBotonYaEstan: hito ? undefined : 'Rellenar',
      sinRellenar: clavesVacias,
      onRellenar: elegirRellenar,
      onYaEsta: function (c) {
        if (!hito) { elegirRellenar(c); return; }
        if (elegido) return;
        elegido = Object.assign({}, c, { yaEsta: true });
        $('cuadro-cancelar').click();
      },
      onCambio: function () {
        if (lista.length < inicial) { inicial = lista.length; return; }   /* se ha borrado un campo propio */
        if (elegido || lista.length === inicial) return;
        elegido = lista[lista.length - 1];
        $('cuadro-cancelar').click();
      },
      onVolver: function () { $('cuadro-cancelar').click(); }
    });
    await espera;
    if (capa) capa.classList.remove('cuadro-campos');
    return elegido;
  }

  /* ---------- 2 y 3. el valor y «¿Dónde se guarda?» ---------- */

  function opcionesDeDonde(a, tipoCorto, hito) {
    return { tipoCorto: tipoCorto, opcionTipo: 'En el tipo ' + tipoCorto, vacio: true,
      otros: DondeSeGuarda.otrosAbiertos(a).length, hitoCampo: hito ? { titulo: hito.titulo } : null };
  }

  /* Un campo que ya estaba en el asunto y se lleva a un hito: no hay valor que pedir,
     solo «¿Dónde se guarda?». 'tipo', 'aqui' o null (se cancela). */
  async function pedirSoloDonde(a, tipo, cfg, hito) {
    if (!tipo || !hito.enGuia) return 'aqui';
    var r = await DondeSeGuarda.preguntar(Object.assign({
      titulo: 'Llevar «' + Campos.nombreDeCampo(cfg, App.E.campos) + '» al hito «' + hito.titulo + '»', aceptar: 'Guardar'
    }, opcionesDeDonde(a, DondeSeGuarda.nombreCortoDe(tipo), hito)));
    return r === null ? null : (r === 'guia' ? 'tipo' : 'aqui');
  }

  /* { valor, donde: 'tipo' | 'aqui' } o null (Escape o Cancelar). */
  async function pedirValorYDonde(a, tipo, cfg, categoria, previo, hito, soloValor) {
    var nombre = Campos.nombreDeCampo(cfg, App.E.campos);
    var propio = cfg.origen === 'propio' ? Campos.propioDe(cfg.id, App.E.campos) : null;
    var inicial = previo !== undefined ? previo
      : await vigilar(valorDePartida(a, cfg, categoria), 'Estoy preparando el campo «' + nombre + '»…', 2500);
    /* Fila 244: el control según la clase (lista, fecha, importe, número o texto). */
    var clase = (propio && propio.clase) || 'texto';
    var control = CamposClases.htmlControl('cad-valor', clase, propio && propio.valores, inicial);
    var tipoCorto = tipo ? DondeSeGuarda.nombreCortoDe(tipo) : '';
    /* Fila 276: «Rellenar» un campo que el asunto ya tiene: sin «¿Dónde se guarda?», nada que decidir. */
    var conPregunta = !soloValor && !!tipo && (!hito || hito.enGuia);   /* fila 255: un hito solo de este asunto no pregunta */
    var bloque = conPregunta ? DondeSeGuarda.bloqueHTML(opcionesDeDonde(a, tipoCorto, hito)) : '';
    var espera = U.preguntar(soloValor ? 'Rellenar el campo «' + nombre + '»' : 'Añadir el campo «' + nombre + '»',
      '<label class="etiqueta">' + U.escapar(nombre) + (soloValor ? '' : ' <span class="suave">(se puede dejar vacío)</span>') + '</label>' +
      control + bloque, 'Guardar');
    if (conPregunta) DondeSeGuarda.enganchar();
    var campo = $('cad-valor');
    DondeSeGuarda.introAcepta(campo);
    CamposClases.engancharControl(campo, clase);
    if (campo) campo.focus();
    var ok = await espera;
    if (!ok) return null;
    var leido = CamposClases.leerControl(campo, clase);
    var donde = conPregunta && DondeSeGuarda.elegido() === 'guia' ? 'tipo' : 'aqui';
    if (!leido.ok) {
      /* Un importe, número o fecha que no se entiende no se guarda: se vuelve a pedir, con lo escrito. */
      U.aviso('Revisa «' + nombre + '»: ' + CamposClases.avisoDeAmbar(clase) + '.', 'ambar');
      return pedirValorYDonde(a, tipo, cfg, categoria, leido.texto, hito, soloValor);
    }
    return { valor: leido.valor, donde: donde };
  }

  /* ---------- lo que se escribe ---------- */

  /* El campo entra en la configuración del tipo (al final, sin
     «Obligatorio» ni «Añadir al nombre»). Si ya estaba y ahora se le pone hito
     (fila 255), se le pone la marca, sin duplicarlo. Devuelve cómo estaba la
     lista del tipo antes y cómo queda, para «Deshacer». */
  function anadirAlTipo(tipo, entrada) {
    var clave = Campos.claveDeCampo(entrada);
    var res = null;
    return App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
      var antes = copia(lista);
      var i = -1;
      lista.forEach(function (c, k) { if (Campos.claveDeCampo(c) === clave) i = k; });
      var nueva;
      if (i === -1) nueva = lista.concat([entrada]);
      else if (entrada.hito && !lista[i].hito) {
        nueva = lista.map(function (c, k) { return k === i ? Object.assign({}, c, { hito: entrada.hito, obligatorio: false }) : c; });
      } else { res = { antes: antes, despues: antes }; return actual; }
      var config = await Campos.guardarConfigDeTipo(App.E.gestor, tipo, nueva);
      res = { antes: antes, despues: copia((config.porTipo && config.porTipo[tipo]) || []) };
      return config;
    }).then(function (config) { App.E.campos = config; return res; });
  }

  /* Fila 255: a un campo del tipo se le quita la marca de hito (pasa a ser del asunto). */
  function quitarHitoEnElTipo(tipo, clave) {
    return App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = ((actual.porTipo && actual.porTipo[tipo]) || []).map(function (c) {
        if (Campos.claveDeCampo(c) !== clave) return c;
        var n = Object.assign({}, c); delete n.hito; return n;
      });
      return Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista);
    }).then(function (config) { App.E.campos = config; });
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
      /* Fila 255: guardar solo un valor no toca la lista de «solo aquí». */
      if (o.anadir || o.quitar) {
        var lista = (ficha.camposPropiosDelAsunto || []).filter(function (c) { return Campos.claveDeCampo(c) !== clave; });
        if (o.anadir) lista.push(o.anadir);
        if (lista.length) ficha.camposPropiosDelAsunto = lista; else delete ficha.camposPropiosDelAsunto;
      }
    });
  }

  /* Fila 254: nada de lo que tarde se queda en silencio. Si `promesa` no ha
     acabado en `ms`, sale un aviso ámbar; al acabar (bien o mal) ya no. */
  function vigilar(promesa, texto, ms) {
    var t = setTimeout(function () { U.aviso(texto, 'ambar'); }, ms);
    return promesa.then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }

  /* Volver a pintar la ficha es lo de después: si falla, el campo ya está
     guardado y el aviso es ámbar (principal y accesorio por separado). */
  function repintar(a) {
    try { repintarYa(a); }
    catch (e) { U.accesorio('El campo se ha guardado, pero no he podido refrescar la ficha', e); }
  }

  function repintarYa(a) {
    var N = window.FichaNucleo;
    if (N && N.actual && N.actual.nombre === a.nombre) {
      var fresca = App.E.registro && App.E.registro.asuntos && App.E.registro.asuntos[a.nombre];
      if (fresca) N.actual.ficha = fresca;
      N.pintar();
    }
  }

  /* ---------- «Deshacer» ---------- */

  async function deshacer(a, tipo, entrada, cambio, tipoCorto) {
    var clave = Campos.claveDeCampo(entrada);
    var parcial = false;
    try {
      await App.enFila('campos.json', async function () {
        var actual = await Campos.leer(App.E.gestor);
        var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
        if (JSON.stringify(lista) !== JSON.stringify(cambio.despues)) { parcial = true; return; }
        App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo, cambio.antes);
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
    var cambio = await anadirAlTipo(tipo, entrada);
    try {
      await escribirEnAsunto(a, clave, { valor: valor, quitar: true });
    } catch (e) {
      U.accesorio('El campo ya está en el tipo, pero no he podido guardar su valor en este asunto', e);
      return;
    }
    U.aviso(textoAlTipo(tipoCorto, otros), 'bueno', {
      boton: 'Deshacer', alPulsar: function () { deshacer(a, tipo, entrada, cambio, tipoCorto); }
    });
    repintar(a);
  }

  async function guardarSoloAqui(a, entrada, valor, hito) {
    await escribirEnAsunto(a, Campos.claveDeCampo(entrada), { valor: valor, anadir: entrada });
    U.aviso(hito ? 'Campo añadido al hito «' + hito.titulo + '», solo en este asunto.' : 'Campo añadido solo a este asunto.', 'bueno');
    repintar(a);
  }

  /* Fila 276: «Rellenar» un campo que el asunto ya tiene, vacío. Solo escribe el valor en la
     ficha: no toca la configuración del tipo ni la lista de «solo aquí». */
  async function rellenar(a, tipo, cfg, categoria) {
    var nombre = Campos.nombreDeCampo(cfg, App.E.campos);
    var r = await pedirValorYDonde(a, tipo, cfg, categoria, undefined, undefined, true);
    if (!r) return;
    if (!String(r.valor === undefined || r.valor === null ? '' : r.valor).trim()) {
      U.aviso('No has escrito nada: «' + nombre + '» sigue vacío.', 'ambar');
      return;
    }
    try {
      await vigilar(escribirEnAsunto(a, Campos.claveDeCampo(cfg), { valor: r.valor }), 'Sigo guardando el campo «' + nombre +
        '». Si tarda mucho, mira que Dropbox no esté sincronizando.', 6000);
    } catch (e) { U.fallo('No he podido rellenar el campo', e); return; }
    U.aviso('Campo «' + nombre + '» rellenado.', 'bueno');
    repintar(a);
  }

  /* ---------- el botón «+ Añadir campo» ---------- */

  /* `hito` (fila 255): { marca, titulo, enGuia } si se abre desde la pantalla de un hito. */
  async function abrir(a, hito) {
    try {
      var tipo = tipoDe(a);
      var categoria = categoriaDe(a, tipo);
      var cfg = await elegirCampo(a, tipo, categoria, hito);
      if (!cfg) return;
      var r;
      if (cfg.rellenar) { await rellenar(a, tipo, cfg, categoria); return; }
      if (cfg.yaEsta) {
        var donde = await pedirSoloDonde(a, tipo, cfg, hito);
        if (!donde) return;
        r = { valor: undefined, donde: donde };
      } else {
        r = await pedirValorYDonde(a, tipo, cfg, categoria, undefined, hito);
        if (!r) return;
      }
      var entrada = entradaLimpia(cfg, hito && hito.marca);
      var guardando = r.donde === 'tipo' ? guardarEnElTipo(a, tipo, entrada, r.valor) : guardarSoloAqui(a, entrada, r.valor, hito);
      await vigilar(guardando, 'Sigo guardando el campo «' + Campos.nombreDeCampo(cfg, App.E.campos) +
        '». Si tarda mucho, mira que Dropbox no esté sincronizando.', 6000);
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

  /* El botón, en el título de la tarjeta «Campos del asunto» (fila 254):
     siempre a la vista, solo en un asunto abierto (en modo consulta la
     ficha apaga los botones sola). Pulsarlo no abre ni cierra la tarjeta
     (js/ficha-tarjetas.js no hace caso a los botones). */
  function botonTituloHtml() {
    var N = window.FichaNucleo;
    if (N && N.modoActual !== 'abierto') return '';
    return ' <button type="button" class="boton ficha-campo-anadir" id="ficha-campo-anadir">+ Añadir campo</button>';
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
    botonTituloHtml: botonTituloHtml,
    alPintar: alPintar,
    abrir: abrir,
    _i: { escribirEnAsunto: escribirEnAsunto, entradaLimpia: entradaLimpia, configDelTipo: configDelTipo,
          repintar: repintar, quitarHitoEnElTipo: quitarHitoEnElTipo, pasarAlTipo: pasarAlTipo, quitar: quitar }
  };
})();
