/* ============================================================
   inicio.js — la pantalla de Inicio (27-sep-2026, fila 209,
   docs/INICIO-EN-PESTANAS.md; sustituye a la fila 191,
   docs/INICIO-CUATRO-BLOQUES.md, en todo lo que decía distinto).

   Dos columnas: la izquierda, estrecha, con "Ha llegado" (aquí mismo,
   compacto) y el tablón (js/tablon.js); la derecha, las pestañas y la
   tabla única de Inicio (js/inicio-tabla.js, InicioTabla). Este
   fichero se queda con:

     1. El buscador de la cabecera (para "Ha llegado"; InicioTabla y
        App.pintarAbiertos se buscan a sí mismos con el mismo campo).
     2. "Ha llegado": los documentos sueltos y los correos de la
        bandeja, juntos, en fila compacta.
     3. El badge rojo de vencidos de la pestaña lateral "Inicio".
     4. El aviso de aspirantes sin Nº de identificación escolar, con
        la lista de asuntos que le corresponden (para que, al
        pulsarlo, filtre la tabla si encuentra alguno).
     5. El repintado entero de la pantalla, que llama también a
        InicioTabla.pintar() (un solo punto de enganche a
        window.Gestor.alRefrescar para toda la pantalla).

   Los bloques "Me toca"/"Esperamos a otros" (fila 191) y los plegados
   "Dormidos"/"Sin fecha" (fila 192, js/inicio-plegados.js, borrado en
   esta fila) pasan a ser pestañas de InicioTabla. Va penúltimo en
   index.html (justo antes de js/inicio-tabla.js y de
   js/envolturas-esperadas.js), para tener ya a mano todo lo que usa
   (QueMeToca, Bandeja, BandejaPantalla, App.tarjetaSuelto…).
   ============================================================ */
(function () {

  var TOPE_HA_LLEGADO = 6;

  function $(id) { return document.getElementById(id); }

  /* ==========================================================
     EL BUSCADOR DE LA CABECERA
     ========================================================== */

  function textoBuscado() {
    var campo = $('buscar-abiertos');
    return campo ? U.normalizar(campo.value) : '';
  }

  function coincideTexto(texto, campos) {
    return !texto || U.normalizar(campos.filter(Boolean).join(' ')).indexOf(texto) !== -1;
  }

  /* ==========================================================
     EL BADGE ROJO DE VENCIDOS, EN LA PROPIA PESTAÑA "INICIO"
     ========================================================== */

  function pintarCuentaVencidos(items) {
    var el = $('cuenta-vencidos-inicio');
    if (!el) return;
    var n = QueMeToca.vencidos(items);
    el.textContent = n ? String(n) : '';
    el.classList.toggle('oculto', !n);
  }

  /* ==========================================================
     "HA LLEGADO": SUELTOS Y CORREOS, JUNTOS, COMPACTOS
     ========================================================== */

  async function reunirHaLlegado(texto) {
    var sueltos = (App.E.sueltos || []).filter(function (s) {
      return coincideTexto(texto, [s.nombre]);
    });
    var items = [];
    for (var i = 0; i < sueltos.length; i++) {
      var s = sueltos[i];
      var fecha = await App.fechaDeSuelto(s);
      items.push({ tipo: 'suelto', suelto: s, fecha: fecha });
    }

    var correos = window.Bandeja ? window.Bandeja.correos() : null;
    if (Array.isArray(correos)) {
      correos.filter(function (item) {
        var d = item.datos;
        return coincideTexto(texto, [d.asunto, d.de && (d.de.nombre || d.de.correo)]);
      }).forEach(function (item) {
        var d = item.datos;
        var f = new Date(String(d.fecha || '') + 'T00:00:00');
        items.push({ tipo: 'correo', item: item, fecha: isNaN(f.getTime()) ? null : f });
      });
    }

    items.sort(function (a, b) {
      var ta = a.fecha ? a.fecha.getTime() : 0;
      var tb = b.fecha ? b.fecha.getTime() : 0;
      return tb - ta;
    });
    return items;
  }

  /* Fila compacta (fila 209, apartado 3 de docs/INICIO-EN-PESTANAS.md):
     el 4º parámetro `compacta` de App.tarjetaSuelto/BandejaPantalla.tarjeta
     recorta a un par de acciones visibles + el menú ⋮, sin tocar el modo
     normal de "Ver todo"/la bandeja a pantalla completa. */
  function nodoDeHaLlegado(it) {
    var nodo;
    if (it.tipo === 'suelto') {
      var s = it.suelto;
      var pie = it.fecha ? 'Puesto ahí el ' + it.fecha.toLocaleDateString('es-ES') + ' a las ' +
        String(it.fecha.getHours()).padStart(2, '0') + ':' + String(it.fecha.getMinutes()).padStart(2, '0') : '';
      nodo = App.tarjetaSuelto(s, pie, !!App.E.reciales[s.nombre], true);
    } else {
      nodo = window.BandejaPantalla ? window.BandejaPantalla.tarjeta(it.item, true) : document.createElement('div');
    }
    nodo.classList.add('inicio-fila-compacta');
    return nodo;
  }

  async function pintarHaLlegado(texto) {
    var caja = $('inicio-ha-llegado-lista');
    if (!caja) return;
    var items = await reunirHaLlegado(texto);
    var n = items.length;

    var cuenta = $('inicio-ha-llegado-n');
    if (cuenta) cuenta.textContent = n ? String(n) : '';

    /* El botón "Ver todo" reaprovechado (.panel[data-vista="clasificar"])
       enseña el mismo número: sueltos + correos, coherente con "Ha
       llegado". */
    var cuentaClasificar = $('cuenta-clasificar');
    if (cuentaClasificar) {
      cuentaClasificar.textContent = String(n);
      cuentaClasificar.classList.toggle('cuenta-ambar', n > 0);
    }

    caja.innerHTML = '';
    if (!n) {
      caja.innerHTML = '<div class="vacio">No ha llegado nada nuevo.</div>';
      return;
    }
    items.slice(0, TOPE_HA_LLEGADO).forEach(function (it) { caja.appendChild(nodoDeHaLlegado(it)); });
  }

  /* ==========================================================
     EL AVISO DE ASPIRANTES SIN Nº DE IDENTIFICACIÓN ESCOLAR

     Fila 193: un trozo más de la franja única de js/avisos-linea.js.
     Fila 209, apartado 7: además del texto y la acción de siempre (ir
     a Personas), le pasa la lista de asuntos abiertos que son de un
     aspirante sin número (emparejados por nombre normalizado), para
     que pulsarlo filtre la tabla, como "vencidos". Si no encuentra
     ninguno, la acción de siempre (ir a Personas) sigue siendo la
     única, de respaldo.
     ========================================================== */

  async function pintarAvisoAspirantes() {
    if (!window.AvisosLinea) return;
    var aspirantes = await QueMeToca.reunirAspirantesSinNumero();
    var n = aspirantes.length;
    var texto = n ? (n + ' ' + (n === 1 ? 'aspirante' : 'aspirantes') + ' sin Nº de identificación escolar') : '';
    var asuntos = (App.E.listaAbiertos || []).filter(function (a) {
      return aspirantes.some(function (p) { return U.normalizar(p.nombre) === U.normalizar(QueMeToca.terceroDe(a)); });
    });
    AvisosLinea.registrar('aspirantes', texto, false, function () {
      if ($('filtro-personas')) $('filtro-personas').value = 'ALUMNADO';
      if ($('buscar-personas')) $('buscar-personas').value = '';
      App.ir('personas');
      if (App.pintarPersonas) App.pintarPersonas();
    }, asuntos);
  }

  /* ==========================================================
     EL REPINTADO ENTERO
     ========================================================== */

  var turno = 0;

  /* Con un solo punto de enganche a window.Gestor.alRefrescar para
     toda la pantalla (fila 209), repintarTodo llama a
     InicioTabla.pintar(), que para la pestaña "Todos los abiertos"
     llama a App.pintarAbiertos(), y esa función SIEMPRE termina
     llamando a App.avisarALosModulos() (js/puente.js) — que vuelve a
     recorrer TODO window.Gestor.alRefrescar, repintarTodo incluido.
     Sin este cerrojo, esa vuelta relanzaría otro repintarTodo entero,
     que volvería a llamar a InicioTabla.pintar()… sin parar nunca. Una
     llamada que llega mientras otra ya está en marcha no hace falta:
     la que ya está en marcha, en cuanto lea QueMeToca.reunir() y
     repinte, ya reflejará lo que haya ahora mismo. */
  var repintando = false;

  async function repintarTodo() {
    if (repintando) return;
    if (!$('inicio-lado') || !window.QueMeToca) return;
    repintando = true;
    try {
      var esteTurno = ++turno;
      var texto = textoBuscado();

      var datos = await QueMeToca.reunir();
      if (esteTurno !== turno) return;
      pintarCuentaVencidos(datos.items);

      if (window.InicioTabla) await InicioTabla.pintar();
      if (esteTurno !== turno) return;

      await pintarHaLlegado(texto);
      if (esteTurno !== turno) return;
      await pintarAvisoAspirantes();
    } finally {
      repintando = false;
    }
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */

  function enganchar() {
    if (!$('pantalla-abiertos')) return;

    if ($('btn-ha-llegado-volver')) {
      $('btn-ha-llegado-volver').onclick = function () { App.irVista('departamento'); };
    }

    /* El buscador de la cabecera ya lleva su propio .oninput
       (js/asuntos-lista-pintar.js, para el legado): este se añade sin
       pisarlo, así que los dos conviven. */
    if ($('buscar-abiertos')) $('buscar-abiertos').addEventListener('input', repintarTodo);

    if (window.Gestor) window.Gestor.alRefrescar.push(repintarTodo);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  window.Inicio = { repintar: repintarTodo };

})();

App.arrancar();
