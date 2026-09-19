/* ============================================================
   ajustes-mantenimiento.js — la pestaña "Mantenimiento" de Ajustes
   (17-sep-2026, fila 39, docs/AJUSTES-POR-TIPO.md).

   Lo que no relaciona nada con nada: los avisos de vencimiento (de
   este ordenador), las carpetas señaladas y el nombre de usuario, las
   copias de seguridad y la papelera, sacados tal cual de
   js/ajustes.js. La carpeta de la bandeja de correo (js/bandeja-
   correos.js), el aviso de RegAlum.csv viejo (js/frescura.js), los
   conflictos de Dropbox (js/conflictos.js), los duplicados
   descartados (js/unir-asuntos.js) y las fichas sin carpeta (js/
   fichas-huerfanas.js) se enganchan solos, como ya hacían: solo se ha
   cambiado a qué contenedor apuntan (`#ajustes-tab-mantenimiento` en
   vez de `#pantalla-ajustes`), no cómo funcionan por dentro.
   ============================================================ */

/* ---------- Copias de seguridad ---------- */

App.pintarCopias = async function () {
  var caja = $('tabla-copias');
  if (!caja) return;
  caja.innerHTML = '';

  var todas;
  try {
    todas = await Copias.listarTodas(App.E.gestor);
  } catch (e) {
    caja.innerHTML = '<div class="vacio">No he podido leer las copias: ' + U.escapar(e.message) + '</div>';
    return;
  }

  Copias.FICHEROS.forEach(function (nombre) {
    var copias = todas[nombre] || [];
    var f = document.createElement('div');
    f.className = 'fila-tipo';

    var ultima = copias.length ? copias[copias.length - 1] : null;
    var pie = copias.length
      ? copias.length + (copias.length === 1 ? ' copia' : ' copias') +
        '  ·  la última, del ' + U.fechaLegible(ultima.fecha)
      : 'Todavía sin ninguna copia';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(nombre) + '</span>' +
                  '<span class="suave" style="flex:1">' + U.escapar(pie) + '</span>';

    var restaurar = document.createElement('button');
    restaurar.className = 'boton';
    restaurar.textContent = 'Restaurar la última copia';
    restaurar.disabled = !copias.length;
    restaurar.onclick = async function () {
      var ok = await U.preguntar('Restaurar ' + nombre,
        '<p>Se cambia <strong>' + U.escapar(nombre) + '</strong> por su última copia' +
        (ultima ? ', del ' + U.escapar(U.fechaLegible(ultima.fecha)) : '') + '.</p>' +
        '<p class="nota">Lo que hay ahora se guarda también como copia, así que si es un ' +
        'error se puede deshacer. Después se recarga la página.</p>', 'Restaurar');
      if (!ok) return;
      try {
        await Copias.restaurar(App.E.gestor, nombre);
        U.aviso(nombre + ' restaurado.', 'bueno');
        location.reload();
      } catch (e) {
        U.aviso('No he podido restaurarlo: ' + e.message, 'malo');
      }
    };
    f.appendChild(restaurar);
    caja.appendChild(f);
  });
};

/* ---------- Carpetas de este ordenador ---------- */

App.pintarCarpetasDeEsteOrdenador = function () {
  var carp = $('estado-carpetas');
  if (!carp) return;
  carp.innerHTML = '';
  carp.appendChild(App.filaEstado('Asuntos abiertos', App.E.abiertos.name));
  carp.appendChild(App.filaEstado('Archivo', App.E.archivo.name));
};

$('btn-olvidar').onclick = async function () {
  var ok = await U.preguntar('Volver a elegir las carpetas',
    '<p>Se olvidan las carpetas de <strong>este</strong> ordenador. ' +
    'No se borra ni se mueve nada.</p>', 'Olvidar');
  if (!ok) return;
  await Almacen.borrar('abiertos');
  await Almacen.borrar('archivo');
  location.reload();
};

/* ---------- el orquestador de esta pestaña ---------- */

App.pintarAjustesMantenimiento = async function () {
  App.pintarCarpetasDeEsteOrdenador();
  if (window.SenecaAyudante) SenecaAyudante.insertarEnlace($('ayudante-seneca-ajustes'));
  await App.pintarCopias();
  if (typeof App.pintarFichasHuerfanas === 'function') await App.pintarFichasHuerfanas();
  if (typeof App.pintarHitosHuerfanos === 'function') await App.pintarHitosHuerfanos();
  if (typeof App.pintarFichasDelArchivo === 'function') await App.pintarFichasDelArchivo();
  if (typeof App.pintarPapelera === 'function') await App.pintarPapelera();
};
