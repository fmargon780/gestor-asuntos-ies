/* ============================================================
   asuntos-nuevo-crear.js — Nuevo asunto: el nombre de la carpeta, la vista previa y crear el asunto.

   Sacado tal cual de js/asuntos-nuevo.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de él.
   ============================================================ */

$('campo-fecha').oninput = function () {
  App.actualizarCursoNuevo();
  App.actualizarLimiteNuevo();
  App.refrescarVista();
};
['campo-curso', 'campo-descripcion'].forEach(function (id) {
  $(id).oninput = function () { App.refrescarVista(); };
});
$('campo-grupo').onchange = function () { App.refrescarVista(); };

/* El nombre de la carpeta lleva el nombre corto del tipo si lo tiene
   (20-sep-2026, fila 79, apartado 4.9): `d.tipo` no se toca, porque
   también alimenta `datosNuevoAsunto.tipo`, que tiene que quedarse
   con el nombre de siempre (lo buscan por él la guía del tipo, las
   cuentas de asuntos con ese tipo...). Solo el nombre que se monta
   pasa por Nombres.tipoParaCarpeta. */
function nombreDeCarpetaPropuesto(d) { return nombreDeCarpetaAjustado(d).nombre; }

/* { nombre, recortado } (fila 130: la carpeta no pasa de 150 caracteres). */
function nombreDeCarpetaAjustado(d) {
  var tipo = App.E.tipos.filter(function (t) { return t.tipo === d.tipo; })[0];
  var copia = Object.assign({}, d, { tipo: tipo ? Nombres.tipoParaCarpeta(tipo) : d.tipo });
  return Nombres.montarAsunto(copia);
}

App.datosDelFormulario = function () {
  var camposParaNombre = App.valoresCamposActuales()
    .filter(function (v) { return v.enNombre && v.valor; })
    .map(function (v) { return v.valor; });
  var loPide = App.loPideNuevoControles ? App.loPideNuevoControles.leer() : null;
  var d = {
    fecha: $('campo-fecha').value,
    tipo: App.E.nuevo.tipo || '',
    curso: $('campo-curso').value.trim(),
    grupo: $('campo-grupo').checked ? App.grupoDelTercero() : '',
    campos: camposParaNombre,
    descripcion: $('campo-descripcion').value.trim(),
    tercero: App.E.nuevo.tercero ? App.textoTercero(App.E.nuevo.tercero) : ''
  };
  /* Solo se añade la clave si hay nombre: dejarlo todo en blanco es
     válido, y entonces el asunto nace sin `loPide` (docs/LO-PIDE.md, 3). */
  if (loPide && loPide.nombre) d.loPide = loPide;
  return d;
};

App.refrescarVista = function () {
  if (!App.E.nuevo.tipo || !App.E.nuevo.tercero) return;
  var d = App.datosDelFormulario();
  var ajustado = nombreDeCarpetaAjustado(d);
  var nombre = ajustado.nombre;
  $('vista-nombre').textContent = nombre;
  Nombres.avisoRecorte($('vista-nombre'), ajustado.recortado);   /* fila 130 */
  $('vista-ruta').textContent = 'En ' + App.E.abiertos.name +
    '. Al cerrarlo irá a ' + App.E.archivo.name + ' / ' + App.E.nuevo.categoria + ' / ' + d.tercero;
  $('btn-crear').disabled = !nombre || nombre.length < 8;
};

/* Las rutas muy largas dan problemas en un Dropbox sincronizado: se
   avisa y se deja decidir, en vez de cortar el nombre a lo tonto. */
App.LARGO_MAXIMO_NOMBRE = 180;

/* «Crear», con el botón en «Guardando…» mientras dura (fila 100: se
   podía pulsar dos veces). */
$('btn-crear').onclick = function () {
  return U.mientrasGuarda($('btn-crear'), App.crearAsuntoDelFormulario);
};

App.crearAsuntoDelFormulario = async function () {
  if (!App.validarCamposObligatorios()) return;
  var d = App.datosDelFormulario();
  var nombre = nombreDeCarpetaPropuesto(d);
  if (!nombre) return;

  if (nombre.length > App.LARGO_MAXIMO_NOMBRE) {
    var seguir = await U.preguntar('El nombre es muy largo',
      '<p>Este nombre tiene ' + nombre.length + ' caracteres:</p>' +
      '<p class="nota">' + U.escapar(nombre) + '</p>' +
      '<p>Las rutas muy largas dan problemas en un Dropbox sincronizado.</p>', 'Crear igual');
    if (!seguir) return;
  }

  /* Lo principal: la carpeta y su ficha. Lo de después (meter el
     documento traído, limpiar el formulario, la lista, el cuadro de
     documentos) es accesorio: si falla, ámbar (fila 100). */
  var carpeta;
  try {
    if (await Carpetas.existe(App.E.abiertos, nombre)) {
      U.aviso('Ya hay un asunto abierto con ese mismo nombre.', 'malo');
      return;
    }
    carpeta = await Carpetas.crear(App.E.abiertos, nombre);
  } catch (e0) {
    U.fallo('No he podido crear la carpeta', e0);
    return;
  }
  try {

    var camposParaGuardar = {};
    App.valoresCamposActuales().forEach(function (v) {
      camposParaGuardar[v.clave] = { valor: v.valor, enNombre: v.enNombre };
    });

    var datosNuevoAsunto = {
      estado: 'abierto', tipo: d.tipo, categoria: App.E.nuevo.categoria,
      tercero: d.tercero, curso: d.curso, grupo: d.grupo, descripcion: d.descripcion,
      campos: camposParaGuardar,
      via: $('campo-via').value,
      viaDato: $('campo-via-dato').value.trim(),
      limite: $('campo-limite').value,
      abiertoEl: U.ahora(), abiertoPor: App.E.usuario
    };
    if (d.loPide) datosNuevoAsunto.loPide = d.loPide;
    /* La foto del contacto (fila 66, docs/CONTACTO-GUARDADO-EN-LA-
       FICHA.md): se guarda solo si el tercero se ha cogido del CSV
       (App.E.nuevo.tercero), nunca para uno dado de alta a mano sin
       ese paso. Sirve para el día en que ya no esté en el fichero. */
    if (App.E.nuevo.tercero) {
      datosNuevoAsunto.contacto = Datos.fotoDeContacto(App.E.nuevo.tercero, App.E.nuevo.categoria);
    }
    await App.anotar(nombre, datosNuevoAsunto);
  } catch (e1) {
    U.accesorio('La carpeta está creada, pero no he podido guardar su ficha. Ábrela y vuelve a ' +
      'poner el estado', e1);
    try { await App.verAbiertos(); } catch (e3) { /* solo pintar */ }
    return;
  }

  try {
    /* Si el asunto se ha empezado desde un documento suelto, ese
       documento se mete ahora en la carpeta recién creada. */
    var traido = App.E.pendiente;
    if (traido) {
      try {
        await Carpetas.moverFichero(App.E.abiertos, traido.nombre, carpeta);
      } catch (e2) {
        U.accesorio('El asunto está creado, pero el documento no ha podido entrar', e2);
        traido = null;
      }
      App.E.pendiente = null;
      App.pintarPendiente();
    }

    U.aviso('Asunto creado.', 'bueno');
    U.copiar(nombre);
    App.E.nuevo = { tipo: null, categoria: null, tercero: null, configCampos: [] };
    $('campo-descripcion').value = '';
    $('campo-via').value = '';
    $('campo-via-dato').value = '';
    $('campo-limite').value = '';
    App.limiteNuevoAuto = '';
    $('campo-grupo').checked = false;
    App.loPideNuevoControles = null;
    $('lopide-caja-nuevo').innerHTML = '';
    $('bloque-tipos').classList.add('oculto');
    $('bloque-grupo').classList.add('oculto');
    $('bloque-campos').classList.add('oculto');
    $('campos-lista-nuevo').innerHTML = '';
    $('bloque-tercero').classList.add('oculto');
    $('bloque-detalles').classList.add('oculto');
    await App.verAbiertos();
    /* Fila 119: se abre la ficha del recién creado; si no aparece, la lista. */
    var recien = App.E.listaAbiertos.filter(function (a) { return a.nombre === nombre; })[0];
    if (!(recien && window.Navegacion && Navegacion.abrirAbierto(nombre))) App.ir('abiertos');

    /* Con el documento ya dentro, se abre el cuadro de siempre para
       ponerle el nombre que le toca (encima de la ficha nueva). */
    if (traido && recien) await App.verDocumentos(recien);
  } catch (e) {
    U.accesorio('Asunto creado, pero no he podido terminar de poner la pantalla al día. Pulsa Recargar', e);
  }
};

/* Crea un asunto entero de un tirón, reutilizando tal cual el mismo
   camino manual (categoría → tipo → tercero → "Crear"), con el
   documento ya enganchado en App.E.pendiente: lo usa el botón
   "Aceptar" de "Por clasificar" (js/documentos-sueltos-lector.js,
   17-sep-2026, fila 41, docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md) para
   la propuesta que ha leído del documento. No se escribe ningún otro
   camino: se llama a los mismos App.elegirCategoria/elegirTipo/
   fijarTercero de siempre y se dispara el mismo botón "Crear", con su
   aviso de duplicado (js/duplicados.js) funcionando exactamente igual. */
App.crearAsuntoConPropuesta = async function (tipo, tercero, documentoSuelto) {
  App.E.pendiente = documentoSuelto;
  delete App.E.reciales[documentoSuelto.nombre];
  App.actualizarTitulo();
  App.ir('nuevo');
  App.elegirCategoria(tipo.categoria);
  App.elegirTipo(tipo);
  App.fijarTercero(tercero);
  await $('btn-crear').onclick();
};
