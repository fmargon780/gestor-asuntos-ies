/* ============================================================
   frescura.js — el aviso de que el fichero de Séneca está viejo.

   El RegAlum.csv que se deja en _GESTOR/datos es una foto del día en
   que se descargó. Si pasan semanas, la aplicación sigue funcionando
   pero enseña grupos y teléfonos de antes, y nadie se entera.

   Aquí se mira la fecha del propio fichero (la que le puso el
   ordenador al guardarlo) y, si ha pasado más tiempo del que toca, se
   avisa arriba al abrir la aplicación.

   Cuánto es "más tiempo del que toca" depende de la época del año: en
   septiembre el alumnado cambia todas las semanas, y en febrero casi
   nada. Por eso las épocas se ponen en Ajustes, y se guardan en
   _GESTOR/frescura.json, o sea, para todo el centro.
   ============================================================ */
(function () {

  var FICHERO = 'frescura.json';
  var CLAVE_CERRADO = 'frescura-cerrado-el';
  var PREFIJO = 'RegAlum';

  /* La propuesta de partida. Las fechas son día-mes, sin año, porque se
     repiten todos los cursos. */
  var POR_DEFECTO = {
    resto: 30,
    periodos: [
      { nombre: 'Comienzo de curso', desde: '01-09', hasta: '31-10', dias: 7 },
      { nombre: 'Matrícula y verano', desde: '01-06', hasta: '31-08', dias: 15 },
      { nombre: 'Escolarización', desde: '01-03', hasta: '30-04', dias: 15 }
    ]
  };

  var ajustes = null;      /* lo leído de _GESTOR/frescura.json */
  var yaMirado = false;

  function $(id) { return document.getElementById(id); }

  /* ---------- los ajustes ---------- */

  function normalizar(leido) {
    var salida = { resto: POR_DEFECTO.resto, periodos: [] };
    if (leido && typeof leido === 'object') {
      var n = parseInt(leido.resto, 10);
      if (!isNaN(n) && n > 0) salida.resto = n;
      (leido.periodos || []).forEach(function (p) {
        if (!p || !esDiaMes(p.desde) || !esDiaMes(p.hasta)) return;
        var d = parseInt(p.dias, 10);
        if (isNaN(d) || d < 1) return;
        salida.periodos.push({
          nombre: String(p.nombre || '').trim() || 'Sin nombre',
          desde: p.desde, hasta: p.hasta, dias: d
        });
      });
    }
    return salida;
  }

  function esDiaMes(v) {
    var m = String(v || '').match(/^(\d{2})-(\d{2})$/);
    if (!m) return false;
    var dia = +m[1], mes = +m[2];
    return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12;
  }

  async function cargar() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) { ajustes = normalizar(null); return; }
    try {
      var leido = await Carpetas.leerJson(g, FICHERO);
      if (!leido) {
        ajustes = normalizar(POR_DEFECTO);
        await guardar();
      } else {
        ajustes = normalizar(leido);
      }
    } catch (e) {
      ajustes = normalizar(POR_DEFECTO);
      U.aviso('No he podido leer las épocas de frescura: ' + U.mensajeDeError(e), 'malo');
    }
  }

  async function guardar() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return;
    await Copias.guardar(g, FICHERO, ajustes);
  }

  /* ---------- la época en que estamos ----------

     Un periodo puede dar la vuelta al año: del 15 de diciembre al 15 de
     enero. Por eso el día y el mes se comparan como un número MMDD, que
     así el orden es el del calendario. */

  function mmdd(diaMes) {
    var m = String(diaMes).match(/^(\d{2})-(\d{2})$/);
    return m ? (+m[2]) * 100 + (+m[1]) : 0;
  }

  function mmddDeFecha(fecha) {
    return (fecha.getMonth() + 1) * 100 + fecha.getDate();
  }

  function dentroDe(p, fecha) {
    var hoy = mmddDeFecha(fecha);
    var a = mmdd(p.desde), b = mmdd(p.hasta);
    if (a <= b) return hoy >= a && hoy <= b;
    return hoy >= a || hoy <= b;   /* da la vuelta al año */
  }

  /* La primera época que cuadre manda. Si no cuadra ninguna, el resto
     del año. */
  function epocaDe(fecha) {
    var lista = (ajustes && ajustes.periodos) || [];
    for (var i = 0; i < lista.length; i++) {
      if (dentroDe(lista[i], fecha)) return lista[i];
    }
    return { nombre: 'Resto del año', dias: (ajustes ? ajustes.resto : POR_DEFECTO.resto) };
  }

  /* ---------- la fecha del fichero ---------- */

  async function mirarElFichero() {
    var g = window.Gestor && window.Gestor.carpetaGestor();
    if (!g) return { falta: true };
    var lista = [];
    try {
      var dir = await g.getDirectoryHandle('datos');
      lista = await Carpetas.ficheros(dir);
    } catch (e) { return { falta: true }; }

    var mejor = null;
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i].nombre;
      if (!/\.csv$/i.test(n)) continue;
      if (U.normalizar(n).indexOf(U.normalizar(PREFIJO)) !== 0) continue;
      mejor = lista[i];
    }
    if (!mejor) return { falta: true };

    try {
      var f = await mejor.handle.getFile();
      var cuando = new Date(f.lastModified);
      var hoy = new Date();
      var dias = Math.floor((hoy.getTime() - cuando.getTime()) / 86400000);
      return { falta: false, nombre: mejor.nombre, cuando: cuando, dias: dias < 0 ? 0 : dias };
    } catch (e) {
      return { falta: true };
    }
  }

  /* ---------- el panel de arriba ---------- */

  function hoyTexto() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function cerradoHoy() {
    try { return window.localStorage.getItem(CLAVE_CERRADO) === hoyTexto(); } catch (e) { return false; }
  }

  function cerrarPorHoy() {
    try { window.localStorage.setItem(CLAVE_CERRADO, hoyTexto()); } catch (e) {}
  }

  function caja() {
    var c = $('panel-frescura');
    if (c) return c;
    var avisos = $('panel-avisos');
    if (!avisos || !avisos.parentNode) return null;
    c = document.createElement('div');
    c.id = 'panel-frescura';
    c.className = 'oculto';
    avisos.parentNode.insertBefore(c, avisos);
    return c;
  }

  function legible(fecha) {
    return String(fecha.getDate()).padStart(2, '0') + '/' +
           String(fecha.getMonth() + 1).padStart(2, '0') + '/' + fecha.getFullYear();
  }

  function pintarPanel(estado) {
    var c = caja();
    if (!c) return;

    if (cerradoHoy()) { c.className = 'oculto'; c.innerHTML = ''; return; }

    var epoca = epocaDe(new Date());
    var texto = '';
    var color = '';

    if (estado.falta) {
      color = 'aviso-rojo';
      texto = '<strong>No hay ningún RegAlum.csv en la carpeta de datos.</strong>' +
              '<p>Sin él no salen los alumnos al crear un asunto. Descárgalo de Séneca y ' +
              'déjalo en _GESTOR/datos, dentro de la carpeta de asuntos abiertos.</p>';
    } else if (estado.dias > epoca.dias) {
      color = estado.dias > epoca.dias * 2 ? 'aviso-rojo' : 'aviso-ambar';
      texto = '<strong>El fichero de alumnado tiene ' + estado.dias + ' días.</strong>' +
              '<p>' + U.escapar(estado.nombre) + ' es del ' + legible(estado.cuando) + '. ' +
              'Estamos en ' + U.escapar(epoca.nombre) + ', y en esta época conviene bajarlo de ' +
              'Séneca cada ' + epoca.dias + ' días.</p>';
    } else {
      c.className = 'oculto';
      c.innerHTML = '';
      return;
    }

    c.className = 'aviso ' + color;
    c.innerHTML = texto;

    var botones = document.createElement('div');
    botones.className = 'avisos-botones';

    var b = document.createElement('button');
    b.className = 'boton';
    b.textContent = 'Ocultar por hoy';
    b.onclick = function () { cerrarPorHoy(); pintarPanel(estado); };
    botones.appendChild(b);

    /* Para cuando se acaba de bajar el fichero y se quiere ver que ya
       está: la aplicación solo mira la carpeta al abrirse. */
    var b3 = document.createElement('button');
    b3.className = 'boton';
    b3.textContent = 'Ya lo he bajado, vuelve a mirar';
    b3.onclick = function () { repasar(); };
    botones.appendChild(b3);

    var b2 = document.createElement('button');
    b2.className = 'boton';
    b2.textContent = 'Cambiar cada cuánto se avisa';
    b2.onclick = function () {
      App.ir('ajustes');
      /* 17-sep-2026, fila 39: este bloque vive en la pestaña
         "Mantenimiento". */
      if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('mantenimiento');
      var d = $('bloque-frescura');
      if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); }
    };
    botones.appendChild(b2);

    c.appendChild(botones);
  }

  /* ---------- el bloque de Ajustes ----------

     Lo crea este mismo módulo: así el index.html no tiene que saber
     nada de él. */

  function bloqueDeAjustes() {
    var ya = $('bloque-frescura');
    if (ya) return ya;
    /* 17-sep-2026, fila 39: este bloque vive en la pestaña
       "Mantenimiento", no en la pantalla de Ajustes entera. */
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;

    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-frescura';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Aviso de fichero de alumnado viejo</span>' +
        '<span class="bloque-pie">Cada cuántos días hay que volver a bajar RegAlum.csv, según la época</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Al abrir la aplicación se mira la fecha del RegAlum.csv que hay ' +
        'en _GESTOR/datos. Si tiene más días de los que dice la época en la que estemos, ' +
        'sale un aviso arriba. Las épocas se escriben en día-mes, sin año, porque se ' +
        'repiten todos los cursos. Esta lista se comparte con el resto de ordenadores.</p>' +
        '<div id="tabla-frescura" class="lista"></div>' +
        '<div class="alta-tipo">' +
          '<button id="btn-anadir-epoca" class="boton">+ Añadir una época</button>' +
        '</div>' +
        '<div class="alta-tipo">' +
          '<label class="etiqueta-en-linea" for="frescura-resto">El resto del año, avisar a los</label>' +
          '<input id="frescura-resto" type="number" min="1" class="campo campo-plazo">' +
          '<span class="suave">días</span>' +
        '</div>' +
      '</div>';
    pantalla.appendChild(d);

    $('btn-anadir-epoca').onclick = function () {
      ajustes.periodos.push({ nombre: 'Época nueva', desde: '01-01', hasta: '31-01', dias: 15 });
      guardar();
      pintarTabla();
    };
    $('frescura-resto').onchange = function () {
      var n = parseInt($('frescura-resto').value, 10);
      if (isNaN(n) || n < 1) { $('frescura-resto').value = String(ajustes.resto); return; }
      ajustes.resto = n;
      guardar();
      repasar();
      U.aviso('El resto del año se avisará a los ' + n + ' días.', 'bueno');
    };
    return d;
  }

  function pintarTabla() {
    var caja = $('tabla-frescura');
    if (!caja || !ajustes) return;
    $('frescura-resto').value = String(ajustes.resto);
    caja.innerHTML = '';

    if (!ajustes.periodos.length) {
      caja.innerHTML = '<div class="vacio">Sin épocas: se avisa igual todo el año.</div>';
      return;
    }

    var hoy = new Date();
    ajustes.periodos.forEach(function (p, i) {
      var fila = document.createElement('div');
      fila.className = 'fila-tipo';
      var ahora = dentroDe(p, hoy);

      var nombre = document.createElement('input');
      nombre.className = 'campo';
      nombre.style.maxWidth = '200px';
      nombre.value = p.nombre;
      nombre.onchange = function () {
        p.nombre = nombre.value.trim() || 'Sin nombre';
        guardar(); pintarTabla(); repasar();
      };
      fila.appendChild(nombre);

      fila.appendChild(rotulo('del'));
      fila.appendChild(campoFecha(p, 'desde'));
      fila.appendChild(rotulo('al'));
      fila.appendChild(campoFecha(p, 'hasta'));
      fila.appendChild(rotulo('avisar a los'));

      var dias = document.createElement('input');
      dias.type = 'number';
      dias.min = '1';
      dias.className = 'campo campo-plazo';
      dias.value = String(p.dias);
      dias.onchange = function () {
        var n = parseInt(dias.value, 10);
        if (isNaN(n) || n < 1) { dias.value = String(p.dias); return; }
        p.dias = n;
        guardar(); repasar();
      };
      fila.appendChild(dias);
      fila.appendChild(rotulo('días'));

      if (ahora) {
        var marca = document.createElement('span');
        marca.className = 'marca-estado';
        marca.textContent = 'Es la de hoy';
        fila.appendChild(marca);
      }

      var quitar = document.createElement('button');
      quitar.className = 'boton';
      quitar.textContent = 'Quitar';
      quitar.onclick = function () {
        ajustes.periodos.splice(i, 1);
        guardar(); pintarTabla(); repasar();
      };
      fila.appendChild(quitar);

      caja.appendChild(fila);
    });
  }

  function rotulo(texto) {
    var s = document.createElement('span');
    s.className = 'suave';
    s.textContent = texto;
    return s;
  }

  function campoFecha(p, cual) {
    var c = document.createElement('input');
    c.className = 'campo';
    c.style.maxWidth = '90px';
    c.value = p[cual];
    c.placeholder = 'dd-mm';
    c.onchange = function () {
      var v = c.value.trim().replace(/\//g, '-');
      if (!esDiaMes(v)) {
        U.aviso('La fecha se escribe día-mes, así: 01-09.', 'malo');
        c.value = p[cual];
        return;
      }
      p[cual] = v;
      guardar(); pintarTabla(); repasar();
    };
    return c;
  }

  /* ---------- arranque ---------- */

  async function repasar() {
    if (!ajustes) return;
    var estado = await mirarElFichero();
    pintarPanel(estado);
    /* Fila 105 (js/ajustes-plegado.js): si hay aviso, su bloque de Ajustes sube arriba. */
    var d = $('bloque-frescura'); if (d) d.dataset.aviso = estado.falta ? 'falta' : (estado.dias > epocaDe(new Date()).dias ? estado.dias + ' días' : '');
  }

  async function arrancar() {
    if (yaMirado) return;
    if (!window.Gestor || !window.Gestor.carpetaGestor()) return;
    yaMirado = true;
    await cargar();
    bloqueDeAjustes();
    pintarTabla();
    await repasar();
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(function () {
      if (!yaMirado) arrancar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }
})();
