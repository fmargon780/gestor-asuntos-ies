/* ============================================================
   tercero-cuadro.js — el cuadro de los datos de un tercero (fila 489,
   docs/NUEVO-ASUNTO-MAS-COMODO.md).

   Antes vivía en js/asuntos-nuevo-alta.js. Lo usan el alta y también
   «Cambiar los datos» (js/tercero-cambiar-datos.js): los campos son los
   mismos, y así no hay dos cuadros que se puedan quedar distintos.

   En Alumnado y Personal, «Nombre» se enseña como dos casillas,
   «Apellidos» y «Nombre», y la app pone la coma al guardar: lo guardado
   sigue siendo una sola columna «Nombre» con `Apellidos, Nombre`.
   ============================================================ */

/* Parte `Apellidos, Nombre` por la PRIMERA coma. Sin coma, todo es apellidos. */
App.partirNombre = function (texto) {
  var t = String(texto || '');
  var i = t.indexOf(',');
  if (i === -1) return { apellidos: t.trim(), nombre: '', conComa: false };
  return { apellidos: t.slice(0, i).trim(), nombre: t.slice(i + 1).trim(), conComa: true };
};

App.unirNombre = function (apellidos, nombre) {
  function limpio(x) { return String(x || '').replace(/\s+/g, ' ').trim(); }
  return limpio(apellidos) + ', ' + limpio(nombre);
};

/* `valores` trae lo que ya se sabe; con el cuadro vacío es un alta.
   `opciones.avisarSinComa` (al cambiar los datos de alguien ya guardado):
   si su nombre no tiene coma, avisa dentro del cuadro.
   Devuelve lo escrito, o null si se cancela. */
App.cuadroDeTercero = async function (categoria, valores, titulo, botonar, opciones) {
  var def = Datos.LISTAS[categoria];
  if (!def) return null;
  valores = valores || {};
  opciones = opciones || {};
  var clavePartida = (categoria === 'ALUMNADO' || categoria === 'PERSONAL') && def.cabecera[0] === 'Nombre'
    ? def.cabecera[0] : null;
  var guardado = clavePartida ? (valores[clavePartida] || '') : '';
  var inicial = App.partirNombre(guardado);

  var campos = def.cabecera.map(function (c) {
    if (c === clavePartida) {
      return '<div class="alta-partido" style="display:grid;grid-template-columns:3fr 2fr;gap:12px">' +
        '<div><label class="etiqueta" for="alta-apellidos">Apellidos</label>' +
        '<input class="campo alta-parte" id="alta-apellidos" value="' + U.escapar(inicial.apellidos) + '"></div>' +
        '<div><label class="etiqueta" for="alta-nombre-pila">Nombre</label>' +
        '<input class="campo alta-parte" id="alta-nombre-pila" value="' + U.escapar(inicial.nombre) + '"></div>' +
        '</div>' +
        '<div class="suave oculto" id="alta-se-guardara"></div>' +
        (opciones.avisarSinComa && guardado && !inicial.conComa
          ? '<div class="aviso aviso-ambar" id="alta-aviso-coma">Este nombre no tiene coma. ' +
            'Revisa qué parte son los apellidos y cuál el nombre.</div>'
          : '');
    }
    return '<label class="etiqueta">' + U.escapar(c) + '</label>' +
           '<input class="campo alta-campo" data-campo="' + U.escapar(c) + '" value="' +
           U.escapar(valores[c] || '') + '">';
  }).join('');
  var aclara = App.ACLARA_ALTA[categoria]
    ? '<p class="explica">' + U.escapar(App.ACLARA_ALTA[categoria]) + '</p>'
    : '';

  var quitarAvisoDeCaptura = null;
  var promesa = U.preguntar(titulo, aclara + campos, botonar || 'Guardar');
  if (clavePartida) quitarAvisoDeCaptura = enganchar();
  var ok;
  try { ok = await promesa; } finally { if (quitarAvisoDeCaptura) quitarAvisoDeCaptura(); }
  if (!ok) return null;

  var puestos = {};
  Array.prototype.forEach.call(document.querySelectorAll('.alta-campo'), function (i) {
    puestos[i.dataset.campo] = i.value.trim();
  });
  if (clavePartida) {
    var ap = document.getElementById('alta-apellidos').value;
    var no = document.getElementById('alta-nombre-pila').value;
    /* Sin tocar ninguna de las dos casillas, se devuelve lo guardado tal cual (así no salta
       la pregunta de renombrar carpetas por un espacio o una coma sin espacio). */
    puestos[clavePartida] = (ap === inicial.apellidos && no === inicial.nombre && guardado)
      ? guardado : App.unirNombre(ap, no);
    return puestos;
  }
  if (!puestos[def.cabecera[0]]) { U.aviso('Hace falta al menos el nombre.', 'malo'); return null; }
  return puestos;

  /* Las dos casillas: la línea gris, el reparto al pegar «Apellidos, Nombre», y el freno de
     «Guardar» (U.preguntar no sabe impedirlo, y el botón es el mismo para todos los cuadros,
     así que el oyente se quita al cerrar este). */
  function enganchar() {
    var apE = document.getElementById('alta-apellidos');
    var noE = document.getElementById('alta-nombre-pila');
    var linea = document.getElementById('alta-se-guardara');
    var aceptar = document.getElementById('cuadro-aceptar');
    function repartir() {
      if (apE.value.indexOf(',') === -1) return;
      var d = App.partirNombre(apE.value);
      apE.value = d.apellidos;
      noE.value = d.nombre;
      pintar();
    }
    function pintar() {
      var lleno = apE.value.trim() && noE.value.trim();
      linea.classList.toggle('oculto', !lleno);
      linea.textContent = lleno ? 'Se guardará como: ' + App.unirNombre(apE.value, noE.value) : '';
    }
    function frenar(ev) {
      repartir();
      var falta = !apE.value.trim() ? apE : (!noE.value.trim() ? noE : null);
      if (!falta) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      U.aviso(falta === apE ? 'Faltan los apellidos' : 'Falta el nombre', 'malo');
      falta.focus();
    }
    apE.addEventListener('blur', repartir);
    apE.addEventListener('input', pintar);
    noE.addEventListener('input', pintar);
    aceptar.addEventListener('click', frenar, true);
    pintar();
    return function () { aceptar.removeEventListener('click', frenar, true); };
  }
};
