/* ============================================================
   borrados-fusion.js — fila 77, docs/DETALLES-DE-MANTENIMIENTO.md,
   punto 3: los borrados de tipos.json, estados.json,
   tipos-documento.json y recurrentes.json, fusionados entre
   ordenadores.

   El problema de hoy: borrar uno de estos cuatro es solo quitarlo del
   array en memoria. App.fusionarConDisco (js/nucleo.js) solo SUMA lo
   que el disco tenga de más: si el otro ordenador tenía el mismo
   array cargado desde antes del borrado, la próxima vez que guarde
   algo suyo (sin relación con esto) el elemento vuelve, porque esa
   función nunca quita nada.

   La solución, sin fecha de alta por elemento (ninguno de los cuatro
   ficheros la guarda hoy, y añadirla tocaría más ficheros de los que
   le tocan a esta fila): un fichero nuevo y pequeño,
   `_GESTOR/borrados-listas.json`, con un array de
   `{ clave, borradoEl }` por cada una de las cuatro listas ('tipos',
   'estados', 'tiposDocumento', 'recurrentes').

   - Borrar llama a `Borrados.marcar`: apunta la clave aquí. El
     elemento sigue quitándose del array como hoy; esto solo añade el
     recuerdo de que se quitó.
   - Dar de alta a mano, o devolver algo desde la papelera, llama a
     `Borrados.revivir`: quita la marca. Es un gesto explícito y
     posterior, así que gana siempre a un borrado viejo (no hace
     falta saber fechas de alta para eso).
   - Cada guardarX() de nucleo.js y de recurrentes.js, justo después de
     fusionar con el disco como siempre, llama a
     `Borrados.filtrarActivos`: quita de la lista fusionada cualquier
     clave que siga marcada aquí. Así, aunque el otro ordenador traiga
     de vuelta el elemento por tener una copia vieja en memoria, el
     borrado se respeta.

   Los elementos marcados no se enseñan en ningún sitio (siguen fuera
   de las listas activas), salvo en Ajustes → Mantenimiento
   (js/ajustes-mantenimiento.js), que dice cuántos hay de cada lista y
   deja quitarlos del todo pasados 90 días.

   Fichero compartido más: se relee siempre justo antes de escribirlo
   (como pide docs/CONTEXTO.md), y entra en Copias.FICHEROS
   (js/copias.js) para tener sus propias copias de seguridad.
   ============================================================ */
var Borrados = (function () {

  var FICHERO = 'borrados-listas.json';
  var LISTAS = ['tipos', 'estados', 'tiposDocumento', 'recurrentes'];
  var DIAS_PARA_PURGAR = 90;

  function vacio() {
    var o = {};
    LISTAS.forEach(function (l) { o[l] = []; });
    return o;
  }

  async function leer(gestor) {
    var d;
    try { d = await Carpetas.leerJson(gestor, FICHERO); } catch (e) { d = null; }
    var o = vacio();
    if (d) LISTAS.forEach(function (l) { if (Array.isArray(d[l])) o[l] = d[l]; });
    return o;
  }

  /* Se relee justo antes de escribir, como el resto de ficheros
     compartidos: si el otro ordenador ha marcado o revivido algo
     mientras tanto, no se pisa. */
  async function conFichero(gestor, cambiar) {
    var datos = await leer(gestor);
    cambiar(datos);
    await Copias.guardar(gestor, FICHERO, datos);
    return datos;
  }

  /* Marca 'clave' como borrada en 'lista', con la fecha de hoy. Si ya
     estaba marcada, se deja como estaba (la fecha del primer borrado). */
  async function marcar(gestor, lista, clave) {
    if (LISTAS.indexOf(lista) === -1) return;
    await conFichero(gestor, function (datos) {
      if (datos[lista].some(function (x) { return x.clave === clave; })) return;
      datos[lista].push({ clave: clave, borradoEl: new Date().toISOString() });
    });
  }

  /* Quita la marca de borrado de 'clave' en 'lista': dar de alta a
     mano, o devolverla desde la papelera. */
  async function revivir(gestor, lista, clave) {
    if (LISTAS.indexOf(lista) === -1) return;
    await conFichero(gestor, function (datos) {
      datos[lista] = datos[lista].filter(function (x) { return x.clave !== clave; });
    });
  }

  /* El filtro que usan los guardarX(): quita de 'activos' cualquier
     elemento cuya clave (con la misma función 'clave' que ya usa
     App.fusionarConDisco) siga marcada como borrada en el disco. */
  async function filtrarActivos(gestor, lista, activos, clave) {
    if (LISTAS.indexOf(lista) === -1) return activos;
    var datos = await leer(gestor);
    if (!datos[lista].length) return activos;
    var borradas = {};
    datos[lista].forEach(function (x) { borradas[x.clave] = true; });
    return activos.filter(function (x) { return !borradas[clave(x)]; });
  }

  /* Cuántos borrados hay de cada lista, y cuántos de ellos pasan de
     DIAS_PARA_PURGAR (para el botón de quitarlos del todo). */
  async function contar(gestor) {
    var datos = await leer(gestor);
    var hoy = Date.now();
    var r = {};
    LISTAS.forEach(function (l) {
      var viejas = datos[l].filter(function (x) {
        var t = Date.parse(x.borradoEl);
        return t && (hoy - t) / 86400000 > DIAS_PARA_PURGAR;
      }).length;
      r[l] = { total: datos[l].length, viejas: viejas };
    });
    return r;
  }

  /* Quita del todo, sin vuelta atrás, los borrados de 'lista' de hace
     más de DIAS_PARA_PURGAR días. */
  async function purgarViejas(gestor, lista) {
    if (LISTAS.indexOf(lista) === -1) return;
    await conFichero(gestor, function (datos) {
      var hoy = Date.now();
      datos[lista] = datos[lista].filter(function (x) {
        var t = Date.parse(x.borradoEl);
        return !(t && (hoy - t) / 86400000 > DIAS_PARA_PURGAR);
      });
    });
  }

  return {
    FICHERO: FICHERO, LISTAS: LISTAS, DIAS_PARA_PURGAR: DIAS_PARA_PURGAR,
    marcar: marcar, revivir: revivir, filtrarActivos: filtrarActivos,
    contar: contar, purgarViejas: purgarViejas
  };
})();

/* ---------- el bloque de Ajustes → Mantenimiento ----------

   Una línea por lista, con cuántos borrados hay y, si alguno pasa de
   los 90 días, un botón para quitarlos del todo (sin vuelta atrás).
   Se engancha en App.pintarAjustesMantenimiento (js/ajustes-
   mantenimiento.js) con el mismo "si existe la función, se llama" que
   usan ya las fichas huérfanas o la papelera. */
App.NOMBRES_BORRADOS = {
  tipos: 'Tipos de asunto borrados',
  estados: 'Estados borrados',
  tiposDocumento: 'Tipos de documento borrados',
  recurrentes: 'Asuntos recurrentes quitados'
};

App.pintarBorradosFusion = async function () {
  var caja = document.getElementById('tabla-borrados-fusion');
  if (!caja) return;
  caja.innerHTML = '';

  var conteo;
  try {
    conteo = await Borrados.contar(App.E.gestor);
  } catch (e) {
    caja.innerHTML = '<div class="vacio">No he podido leer los borrados: ' + U.escapar(U.mensajeDeError(e)) + '</div>';
    return;
  }

  Borrados.LISTAS.forEach(function (lista) {
    var c = conteo[lista];
    var f = document.createElement('div');
    f.className = 'fila-tipo';

    var pie = c.total
      ? c.total + (c.total === 1 ? ' borrado' : ' borrados') +
        (c.viejas ? '  ·  ' + c.viejas + ' de hace más de ' + Borrados.DIAS_PARA_PURGAR + ' días' : '')
      : 'Ninguno';
    f.innerHTML = '<span class="nombre-tipo">' + U.escapar(App.NOMBRES_BORRADOS[lista]) + '</span>' +
                  '<span class="suave" style="flex:1">' + U.escapar(pie) + '</span>';

    var quitar = document.createElement('button');
    quitar.className = 'boton';
    quitar.textContent = 'Quitar los de hace más de ' + Borrados.DIAS_PARA_PURGAR + ' días';
    quitar.disabled = !c.viejas;
    quitar.onclick = async function () {
      var ok = await U.preguntar('Quitar borrados de ' + App.NOMBRES_BORRADOS[lista].toLowerCase(),
        '<p>Se quitan del todo, sin vuelta atrás, los ' + c.viejas + ' borrados de hace más de ' +
        Borrados.DIAS_PARA_PURGAR + ' días.</p>' +
        '<p class="nota">Esto no afecta a lo que hoy está activo: solo limpia el recuerdo de lo ' +
        'ya borrado, para que el fichero no crezca sin fin.</p>', 'Quitar');
      if (!ok) return;
      try {
        await Borrados.purgarViejas(App.E.gestor, lista);
        U.aviso('Borrados de ' + App.NOMBRES_BORRADOS[lista].toLowerCase() + ' limpiados.', 'bueno');
        App.pintarBorradosFusion();
      } catch (e) {
        U.aviso('No he podido limpiarlos: ' + U.mensajeDeError(e), 'malo');
      }
    };
    f.appendChild(quitar);
    caja.appendChild(f);
  });
};
