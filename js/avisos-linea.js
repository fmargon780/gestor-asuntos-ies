/* ============================================================
   avisos-linea.js — todos los avisos de arriba, en una sola línea
   (27-sep-2026, fila 193, docs/AVISOS-MENU-Y-VOLVER.md, apartado 1).

   Antes había hasta cinco cajas de color apiladas en Inicio (alumnado
   desfasado, fichas sin carpeta, papelera vieja, vencimientos,
   recurrentes) más dos botones sueltos (posibles duplicados, en la
   cabecera; aspirantes sin número, en Inicio), cada uno con su propia
   forma de "ocultar". Aquí se juntan en una sola franja, un trozo de
   texto por aviso, separados por " · ".

   Cada módulo de aviso SIGUE CALCULANDO LO MISMO (js/avisos.js,
   js/frescura.js, js/avisos-que-faltan.js, js/recurrentes.js,
   js/unir-asuntos.js, js/inicio.js): solo deja de pintar su propia
   caja de color y le pasa su trozo a este módulo, con:

     AvisosLinea.registrar(id, texto, urgente, alPulsar)

       - id: una cadena fija por aviso ('vencidos', 'frescura'...), la
         misma en cada llamada, para poder sustituir su trozo o
         quitarlo en la siguiente pasada.
       - texto: el trozo a mostrar ("3 vencidos"). Si es '' (o no hay
         nada que decir ahora), ese trozo se quita de la franja.
       - urgente: true si este trozo, él solo, pone la franja en rojo
         (algo vencido, o falta el fichero de alumnado); false para
         ámbar.
       - alPulsar: la función que hacía el botón de su caja antigua
         (ver los vencidos, crear los recurrentes, ir a Duplicados,
         ir a la papelera, ir a Mantenimiento…). Puede omitirse si ese
         trozo no lleva a ningún sitio.

   Cada módulo llama a esto en cuanto recalcula, aunque sea con texto
   vacío (para poder quitar su trozo si ya no aplica): no hace falta
   que todos lleguen a la vez ni en el mismo instante (varios cálculos
   son asíncronos); cada llamada repinta la franja con lo que se sabe
   hasta ese momento.

   El orden de los trozos es fijo (ORDEN), no el de llegada, para que
   la franja no cambie de orden entre repintados.

   "Ocultar por hoy" (a la derecha de la franja) esconde TODA la
   franja hasta el día siguiente, o antes si aparece un aviso nuevo
   que no estaba activo cuando se ocultó (se guarda el conjunto de
   ids activos en ese momento; si el conjunto de ahora tiene algún id
   que no estaba, la franja vuelve aunque sea el mismo día).

   Enganchado por window.Gestor.alRefrescar, como los demás módulos de
   avisos: en cada vuelta se repinta con lo que hay guardado, por si
   algún módulo no ha vuelto a llamar en este ciclo pero su trozo
   sigue vigente (por ejemplo, uno que solo recalcula al entrar en
   Inicio, no en cada tecla del buscador). */
(function () {

  /* El orden en que salen los trozos, igual que el ejemplo del
     encargo: vencidos, próximos, recurrentes, duplicados, papelera,
     fichero de alumnado, fichas sin carpeta, aspirantes. */
  var ORDEN = ['vencidos', 'proximos', 'recurrentes', 'duplicados',
    'papelera-vieja', 'frescura', 'problemas', 'aspirantes',   /* fila 291: «N problemas por resolver» sustituye a «N fichas sin carpeta» */
   
    'registro-sin-asunto', 'registro-atrasado', 'tipos-parecidos', 'listos-para-enviar', 'envios-pendientes', 'notas-directivos'];   /* fila 290 */   /* fila 285 */   /* filas 259 y 277 */

  var piezas = {};   /* id -> { texto, urgente, alPulsar } */

  var CLAVE_OCULTO = 'avisos-linea-oculto-el';

  function $(id) { return document.getElementById(id); }

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function idsActivos() {
    return ORDEN.filter(function (id) { return !!piezas[id]; });
  }

  function leerOculto() {
    try {
      var v = JSON.parse(window.localStorage.getItem(CLAVE_OCULTO));
      if (!v || v.dia !== hoy() || !Array.isArray(v.ids)) return null;
      return v;
    } catch (e) { return null; }
  }

  /* Sigue oculta si el conjunto de avisos activos de ahora es el
     mismo que había cuando se ocultó, o un subconjunto de aquel
     (alguno ha desaparecido, ninguno nuevo). Cualquier id de ahora que
     no estuviera entonces la hace volver. */
  function sigueOculta(idsAhora) {
    var g = leerOculto();
    if (!g) return false;
    for (var i = 0; i < idsAhora.length; i++) {
      if (g.ids.indexOf(idsAhora[i]) === -1) return false;
    }
    return true;
  }

  function ocultarPorHoy() {
    try {
      window.localStorage.setItem(CLAVE_OCULTO, JSON.stringify({ dia: hoy(), ids: idsActivos() }));
    } catch (e) { /* sin localStorage, no se puede recordar: se queda visible */ }
    pintar();
  }

  /* Fila 209, docs/INICIO-EN-PESTANAS.md, apartado 7: si el aviso lleva
     una lista de asuntos, pulsarlo filtra la tabla de Inicio (el
     "chip" de InicioTabla, js/inicio-tabla.js) en vez de (o antes de)
     lo que hiciera su `alPulsar` de siempre. Con la lista vacía (no se
     ha encontrado ningún asunto para este aviso), `alPulsar` sigue
     siendo la única acción: así un aviso como "aspirantes" no se queda
     mudo cuando no hay ningún asunto suyo que filtrar. */
  function alPulsarTrozo(id) {
    var p = piezas[id];
    if (!p) return;
    if (p.asuntos && p.asuntos.length && window.InicioTabla && InicioTabla.filtrarPorAviso) {
      InicioTabla.filtrarPorAviso(id, p.texto, p.asuntos);
      return;
    }
    if (typeof p.alPulsar === 'function') p.alPulsar();
  }

  function trozoDe(id) {
    var p = piezas[id];
    var trozo;
    var pulsable = typeof p.alPulsar === 'function' || (p.asuntos && p.asuntos.length);
    if (pulsable) {
      trozo = document.createElement('button');
      trozo.type = 'button';
      trozo.onclick = function () { alPulsarTrozo(id); };
    } else {
      trozo = document.createElement('span');
    }
    trozo.className = 'avisos-linea-trozo' +
      (window.InicioTabla && InicioTabla.avisoActivo && InicioTabla.avisoActivo() &&
       InicioTabla.avisoActivo().id === id ? ' avisos-linea-trozo-activo' : '');
    trozo.dataset.aviso = id;
    trozo.textContent = p.texto;
    return trozo;
  }

  function pintar() {
    var caja = $('avisos-linea');
    if (!caja) return;

    var ids = idsActivos();
    if (!ids.length || sigueOculta(ids)) {
      caja.className = 'oculto';
      caja.innerHTML = '';
      return;
    }

    var urgente = ids.some(function (id) { return piezas[id].urgente; });
    caja.className = 'avisos-linea ' + (urgente ? 'aviso-rojo' : 'aviso-ambar');
    caja.innerHTML = '';

    var texto = document.createElement('div');
    texto.className = 'avisos-linea-texto';
    ids.forEach(function (id, i) {
      if (i) {
        var sep = document.createElement('span');
        sep.className = 'avisos-linea-sep';
        sep.textContent = ' · ';
        texto.appendChild(sep);
      }
      texto.appendChild(trozoDe(id));
    });
    caja.appendChild(texto);

    /* Fila 212 (docs/INICIO-A-TODO-EL-ANCHO.md, apartado 2): "Ocultar
       por hoy" pasa de botón de texto a una ✕ pequeña, porque el cuadro
       ya no ocupa todo el ancho: solo mide lo que mide su texto. */
    var ocultar = document.createElement('button');
    ocultar.type = 'button';
    ocultar.id = 'avisos-linea-ocultar';
    ocultar.className = 'avisos-linea-ocultar';
    ocultar.title = 'Ocultar por hoy';
    ocultar.setAttribute('aria-label', 'Ocultar por hoy');
    ocultar.textContent = '✕';
    ocultar.onclick = ocultarPorHoy;
    caja.appendChild(ocultar);
  }

  /* `asuntos` (fila 209, opcional, 5º parámetro: nunca rompe a quien
     llama con los cuatro de siempre): null o la lista de objetos-asunto
     (como App.E.listaAbiertos) que este aviso deja filtrar en la tabla
     de Inicio al pulsarlo. */
  function registrar(id, texto, urgente, alPulsar, asuntos) {
    if (texto) piezas[id] = { texto: texto, urgente: !!urgente, alPulsar: alPulsar, asuntos: asuntos || null };
    else delete piezas[id];
    pintar();
  }

  function enganchar() {
    if (!window.Gestor) return;
    window.Gestor.alRefrescar.push(pintar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enganchar);
  } else {
    enganchar();
  }

  window.AvisosLinea = {
    registrar: registrar,
    /* Repinta la franja con lo que ya hay guardado en `piezas`, sin
       recalcular ningún aviso (fila 209): lo usa js/inicio-tabla.js
       después de cambiar el chip "Filtrado por…", para que el trozo
       activo (.avisos-linea-trozo-activo) se ponga al día. */
    refrescar: pintar,
    /* para las pruebas */
    _idsActivos: idsActivos,
    _sigueOculta: sigueOculta
  };

})();
