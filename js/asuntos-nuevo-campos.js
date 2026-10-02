/* ============================================================
   asuntos-nuevo-campos.js — Nuevo asunto: los campos del tipo, ya rellenos con el tercero, y el tercero elegido.

   Sacado tal cual de js/asuntos-nuevo.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de él.
   ============================================================ */

/* ---------- los campos del tipo, ya rellenos con el tercero ----------

   Después de elegir el tipo y el tercero sale un bloque "Datos del
   asunto" con los campos que ese tipo tenga puestos en Ajustes
   (js/campos.js), en su mismo orden, ya rellenos con lo que se sepa
   de este tercero: la unidad, el puesto, el curso calculado... Si el
   dato viene vacío -la modalidad de un alumno de la ESO-, el campo
   sale vacío y se puede escribir a mano: no es un error.

   Los campos son etiquetas del asunto (fila 251): salen en la ficha y
   al exportar, y no entran en ningún nombre. */

App.filaCampoNuevo = function (item) {
  var cfg = item.cfg;
  var fila = document.createElement('div');
  fila.className = 'campo-fila';

  var etiqueta = document.createElement('label');
  etiqueta.className = 'etiqueta';
  etiqueta.textContent = item.nombre + (cfg.obligatorio ? ' *' : '');
  fila.appendChild(etiqueta);

  /* Fila 244: el control según la clase del campo (lista, fecha, importe, número o texto). */
  var clase = (cfg.origen === 'propio' && cfg.clase) ? cfg.clase : 'texto';
  var molde = document.createElement('div');
  molde.innerHTML = CamposClases.htmlControl('', clase, cfg.valores, item.valorInicial || '');
  var entrada = molde.firstChild;
  entrada.removeAttribute('id');
  entrada.oninput = App.refrescarVista;
  entrada.onchange = App.refrescarVista;
  fila.appendChild(entrada);
  CamposClases.engancharControl(entrada, clase, App.refrescarVista);
  item.clase = clase;

  item.entradaEl = entrada;
  return fila;
};

/* Se llama al fijar el tercero: hasta entonces no hay de quién sacar
   los valores de partida. Un tipo sin campos puestos en Ajustes se
   comporta exactamente igual que antes de este cambio: el bloque ni
   siquiera se enseña. */
App.pintarCamposDelTipo = function () {
  var caja = $('bloque-campos');
  var contenedor = $('campos-lista-nuevo');
  var tipo = App.E.nuevo.tipo;
  var persona = App.E.nuevo.tercero;
  var todos = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];
  /* Fila 255: los campos de un hito no se piden al crear (se rellenan cuando llega su
     hito); solo se guarda su valor de partida, si lo tiene (de fichero o calculado). */
  var lista = todos.filter(function (c) { return !c.hito; });
  App.E.nuevo.camposDeHito = todos.filter(function (c) { return c.hito; }).map(function (cfg) {
    return { clave: Campos.claveDeCampo(cfg), nombre: Campos.nombreDeCampo(cfg, App.E.campos),
             valor: String(Campos.valorInicial(cfg, persona, App.E.campos) || '') };
  });

  if (!lista.length) {
    caja.classList.add('oculto');
    contenedor.innerHTML = '';
    App.E.nuevo.configCampos = [];
    return;
  }

  caja.classList.remove('oculto');
  contenedor.innerHTML = '';
  App.E.nuevo.configCampos = lista.map(function (cfg) {
    /* `porTipo` no guarda la clase ni los valores de un campo propio
       (solo su id): hay que mirarlos en `propios`, que es donde de
       verdad viven y donde pueden cambiar. Sin esto, un campo propio
       de lista siempre salía como texto libre. */
    var cfgParaPintar = cfg;
    if (cfg.origen === 'propio') {
      var p = Campos.propioDe(cfg.id, App.E.campos);
      if (p) cfgParaPintar = Object.assign({}, cfg, { clase: p.clase, valores: p.valores });
    }
    return {
      cfg: cfgParaPintar,
      clave: Campos.claveDeCampo(cfg),
      nombre: Campos.nombreDeCampo(cfg, App.E.campos),
      valorInicial: Campos.valorInicial(cfg, persona, App.E.campos)
    };
  });
  App.E.nuevo.configCampos.forEach(function (item) {
    contenedor.appendChild(App.filaCampoNuevo(item));
  });

};

/* Los valores tal y como están ahora mismo en la pantalla, uno por
   campo configurado. Sirve tanto para la vista previa y la validación
   como para lo que se guarda en la ficha del asunto. */
App.valoresCamposActuales = function () {
  var deHito = (App.E.nuevo.camposDeHito || []).filter(function (x) { return x.valor; }).map(function (x) {
    return { clave: x.clave, nombre: x.nombre, valor: x.valor, texto: x.valor, ok: true, enNombre: false, obligatorio: false };
  });
  return (App.E.nuevo.configCampos || []).map(function (item) {
    /* Fila 244: `valor` es lo que se guarda (importe `1234.50`, fecha `AAAA-MM-DD`);
       `texto`, lo que se ve y va al nombre (`1.234,50 €`, `01/10/2026`). */
    var lc = CamposClases.leerControl(item.entradaEl, item.clase || 'texto');
    return { clave: item.clave, nombre: item.nombre, valor: lc.valor, texto: lc.texto, ok: lc.ok,
             enNombre: false, obligatorio: !!item.cfg.obligatorio };
  }).concat(deHito);
};

/* Antes de crear: si falta un campo obligatorio, no se crea, se dice
   cuál es y se enfoca. */
App.validarCamposObligatorios = function () {
  var items = App.E.nuevo.configCampos || [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.cfg.obligatorio && !(item.entradaEl.value || '').trim()) {
      U.aviso('Hace falta rellenar "' + item.nombre + '".', 'malo');
      item.entradaEl.focus();
      return false;
    }
    /* Fila 244: un importe, número o fecha que no se entiende no se guarda hasta corregirlo. */
    if (!CamposClases.leerControl(item.entradaEl, item.clase || 'texto').ok) {
      U.aviso('Revisa "' + item.nombre + '": ' + CamposClases.avisoDeAmbar(item.clase) + '.', 'malo');
      item.entradaEl.focus();
      return false;
    }
  }
  return true;
};

/* Lo que los módulos añaden debajo del tercero elegido (fila 167: el
   desplegable «Departamento» de Administraciones): `fn(persona, caja)`. */
App.alFijarTercero = [];

/* Fila 197: fijar el tercero es el momento en que se sabe de verdad la
   categoría del asunto (punto 5 del documento: la categoría del
   asunto es la del tercero), así que se deja como filtro del buscador
   (App.elegirCategoria) y se repinta la parrilla de tipos, que a
   partir de ahora solo enseña los de esa categoría. */
App.fijarTercero = function (p) {
  App.E.nuevo.tercero = p;
  App.elegirCategoria(p.categoria);
  /* Un tipo ya elegido de otra categoría (persona anterior, u otro
     camino) deja de valer para esta persona: se olvida, en vez de
     dejar un asunto a medio montar con tipo y categoría distintos. */
  var tipoActual = App.E.tipos.filter(function (t) { return t.tipo === App.E.nuevo.tipo; })[0];
  if (App.E.nuevo.tipo && (!tipoActual || tipoActual.categoria !== p.categoria)) {
    App.E.nuevo.tipo = null;
  }
  App.pintarTipos();
  var texto = App.textoTercero(p);
  $('resultados-tercero').innerHTML = '';
  $('buscar-tercero').value = '';
  var caja = $('tercero-elegido');
  caja.className = 'elegido';
  caja.innerHTML = '<div class="elegido-caja"><div><strong>' + U.escapar(texto) + '</strong></div>' +
                   '<button class="boton" id="btn-cambiar-tercero">Cambiar</button></div>';
  caja.classList.remove('oculto');
  $('btn-cambiar-tercero').onclick = function () {
    App.E.nuevo.tercero = null;
    caja.classList.add('oculto');
    App.pintarTipos();
    App.refrescarVista();   /* fila 215: bloque-detalles sigue a la vista; el botón dice qué falta */
    $('buscar-tercero').focus();
  };

  var avisa = (p.categoria === 'ALUMNADO' && !p.matriculado) ||
              (p.categoria === 'PERSONAL' && !p.enElCentro);
  if (avisa) {
    caja.querySelector('.elegido-caja > div').innerHTML +=
      '<div class="resultado-pie">' + U.escapar(App.pieDe(p)) + '</div>';
  }

  App.pintarCamposDelTipo();
  App.pintarLoPideNuevo(p);
  App.alFijarTercero.forEach(function (f) {
    try { f(p, caja); } catch (e) { /* un módulo roto no frena el alta del asunto */ }
  });

  App.refrescarVista();   /* deja bloque-detalles a la vista (fila 215) */
};

/* "Lo pide (opcional)": quién ha pedido esta gestión, por qué vía y en
   qué fecha (17-sep-2026, fila 28, docs/LO-PIDE.md). Toda la lógica de
   los controles vive en js/lo-pide.js; aquí solo se monta, con el
   tercero recién elegido, y se guarda lo que devuelva `leer()` en
   `App.loPideNuevoControles`, para que `App.datosDelFormulario()` lo
   lea. Se repinta cada vez que cambia el tercero. */
App.loPideNuevoControles = null;
App.pintarLoPideNuevo = function (persona) {
  if (!window.LoPide) return;
  App.loPideNuevoControles = LoPide.controles($('lopide-caja-nuevo'), persona, null, App.E.nuevo.viaInicial || null);
  /* La fecha de "Lo pide" nace con la de "Fecha de inicio" y la sigue
     mientras el usuario no la toque (fila 173, punto 4). */
  App.fechaLoPideAuto = $('campo-fecha').value || U.hoyIso();
  var campoFecha = $('lopide-caja-nuevo').querySelector('.lopide-fecha');
  if (campoFecha) campoFecha.value = App.fechaLoPideAuto;
};

App.fechaLoPideAuto = '';
App.actualizarFechaLoPideNuevo = function () {
  var campo = $('lopide-caja-nuevo').querySelector('.lopide-fecha');
  if (!campo) return;
  if (campo.value && campo.value !== App.fechaLoPideAuto) return;   /* puesta a mano: no se toca */
  App.fechaLoPideAuto = $('campo-fecha').value;
  campo.value = App.fechaLoPideAuto;
};

App.grupoDelTercero = function () {
  var p = App.E.nuevo.tercero;
  if (!p || p.categoria !== 'ALUMNADO') return '';
  return Nombres.grupoCompacto(p.unidad, p.curso);
};

App.textoTercero = function (p) {
  if (p.categoria === 'ALUMNADO') return Nombres.terceroAlumno(p);
  if (p.categoria === 'PERSONAL') return Nombres.terceroPersonal(p);
  if (p.categoria === 'TUTORES LEGALES') return Nombres.terceroTutor(p);   /* fila 166 */
  if (p.categoria === 'ADMINISTRACIONES') return Nombres.terceroAdministracion(p);   /* fila 167 */
  if (p.categoria === 'EMPRESAS') return Nombres.terceroEmpresa({ nombre: p.nombre, nif: p.nif });
  return U.limpiarNombre(p.nombre + (p.referencia ? ' ' + p.referencia : ''));
};
