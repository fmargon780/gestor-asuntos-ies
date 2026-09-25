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

   Cada uno lleva al lado su "Añadir al nombre", que nace como esté
   puesto en Ajustes pero se puede cambiar aquí, solo para este asunto. */

App.filaCampoNuevo = function (item) {
  var cfg = item.cfg;
  var fila = document.createElement('div');
  fila.className = 'campo-fila';

  var etiqueta = document.createElement('label');
  etiqueta.className = 'etiqueta';
  etiqueta.textContent = item.nombre + (cfg.obligatorio ? ' *' : '');
  fila.appendChild(etiqueta);

  var entrada;
  if (cfg.origen === 'propio' && cfg.clase === 'lista') {
    entrada = document.createElement('select');
    entrada.className = 'campo';
    entrada.innerHTML = '<option value="">Sin elegir</option>' +
      (cfg.valores || []).map(function (v) {
        return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>';
      }).join('');
  } else {
    entrada = document.createElement('input');
    entrada.className = 'campo';
    entrada.value = item.valorInicial || '';
  }
  entrada.oninput = App.refrescarVista;
  entrada.onchange = App.refrescarVista;
  fila.appendChild(entrada);

  var interruptor = document.createElement('label');
  interruptor.className = 'interruptor interruptor-fila';
  var casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = cfg.enNombre !== false;
  casilla.onchange = App.refrescarVista;
  interruptor.appendChild(casilla);
  var span = document.createElement('span');
  span.textContent = 'Añadir al nombre';
  interruptor.appendChild(span);
  fila.appendChild(interruptor);

  item.entradaEl = entrada;
  item.casillaEl = casilla;
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
  var lista = (App.E.campos && App.E.campos.porTipo && App.E.campos.porTipo[tipo]) || [];

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

  /* Si el tipo ya trae la unidad o el curso calculado, el interruptor
     viejo de "Añadir el grupo" se esconde: si no, el grupo saldría dos
     veces en el nombre. */
  if (Campos.usaUnidadOCurso(lista, App.E.campos)) {
    $('bloque-grupo').classList.add('oculto');
    $('campo-grupo').checked = false;
  }
};

/* Los valores tal y como están ahora mismo en la pantalla, uno por
   campo configurado. Sirve tanto para la vista previa y la validación
   como para lo que se guarda en la ficha del asunto. */
App.valoresCamposActuales = function () {
  return (App.E.nuevo.configCampos || []).map(function (item) {
    var valor = (item.entradaEl ? item.entradaEl.value : '').trim();
    var enNombre = !!(item.casillaEl && item.casillaEl.checked);
    return { clave: item.clave, nombre: item.nombre, valor: valor,
             enNombre: enNombre, obligatorio: !!item.cfg.obligatorio };
  });
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
  }
  return true;
};

/* Lo que los módulos añaden debajo del tercero elegido (fila 167: el
   desplegable «Departamento» de Administraciones): `fn(persona, caja)`. */
App.alFijarTercero = [];

App.fijarTercero = function (p) {
  App.E.nuevo.tercero = p;
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
    $('bloque-detalles').classList.add('oculto');
    $('buscar-tercero').focus();
  };

  /* El grupo solo tiene sentido en el alumnado, y solo en quien sigue
     matriculado este curso. Al que ya no está no se le ofrece. */
  var grupo = (p.categoria === 'ALUMNADO' && p.matriculado)
    ? Nombres.grupoCompacto(p.unidad, p.curso) : '';
  if (grupo) {
    $('grupo-vista').textContent = '(' + grupo + ')';
    $('bloque-grupo').classList.remove('oculto');
  } else {
    $('campo-grupo').checked = false;
    $('bloque-grupo').classList.add('oculto');
  }
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

  $('bloque-detalles').classList.remove('oculto');
  App.refrescarVista();
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
  App.loPideNuevoControles = LoPide.controles($('lopide-caja-nuevo'), persona, null);
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
