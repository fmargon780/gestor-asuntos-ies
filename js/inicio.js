/* ============================================================
   inicio.js — la pantalla de Inicio (28-sep-2026, fila 212,
   docs/INICIO-A-TODO-EL-ANCHO.md; sobre la fila 209,
   docs/INICIO-EN-PESTANAS.md, en todo lo que decía distinto).

   Sin columna izquierda: las pestañas y la tabla única de Inicio
   (js/inicio-tabla.js, InicioTabla) ocupan todo el ancho. "Ha
   llegado" pasa a ser una sola línea, justo debajo de la cabecera,
   junto al cuadro de avisos (js/avisos-linea.js); el tablón
   (js/tablon.js) se va a la propia cabecera. Este fichero se queda
   con:

     1. El buscador de la cabecera (para "Ha llegado"; InicioTabla y
        App.pintarAbiertos se buscan a sí mismos con el mismo campo).
     2. "Ha llegado": «N correos · N documentos por clasificar», cada
        trozo un enlace que abre «Ver todo» enseñando solo esa parte
        (App.irVista('clasificar', 'correos'|'documentos')).
     3. El badge rojo de vencidos de la pestaña lateral "Inicio".
     4. El aviso de aspirantes sin Nº de identificación escolar, con
        la lista de asuntos que le corresponden (para que, al
        pulsarlo, filtre la tabla si encuentra alguno).
     5. El repintado entero de la pantalla, que llama también a
        InicioTabla.pintar() (un solo punto de enganche a
        window.Gestor.alRefrescar para toda la pantalla).

   Los bloques "Me toca"/"Esperamos a otros" (fila 191) y los plegados
   "Dormidos"/"Sin fecha" (fila 192, js/inicio-plegados.js, borrado en
   esa fila) son pestañas de InicioTabla. Va penúltimo en index.html
   (justo antes de js/inicio-tabla.js y de js/envolturas-esperadas.js),
   para tener ya a mano todo lo que usa (QueMeToca, Bandeja,
   BandejaPantalla, App.tarjetaSuelto…).
   ============================================================ */
(function () {

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
     "HA LLEGADO": UNA SOLA LÍNEA, CON DOS ENLACES (fila 212,
     docs/INICIO-A-TODO-EL-ANCHO.md, apartado 2)
     ========================================================== */

  function contarCorreos(texto) {
    var correos = window.Bandeja ? window.Bandeja.correos() : null;
    if (!Array.isArray(correos)) return 0;
    return correos.filter(function (item) {
      var d = item.datos;
      return coincideTexto(texto, [d.asunto, d.de && (d.de.nombre || d.de.correo)]);
    }).length;
  }

  function contarSueltos(texto) {
    return (App.E.sueltos || []).filter(function (s) {
      return coincideTexto(texto, [s.nombre]);
    }).length;
  }

  function trozoHaLlegado(n, singular, plural, soloQue, resaltar) {
    if (!n) return null;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'enlace inicio-ha-llegado-trozo' + (resaltar ? ' inicio-ha-llegado-nuevo' : '');
    b.innerHTML = '<strong>' + n + ' ' + (n === 1 ? singular : plural) + '</strong>';
    b.onclick = function () { App.irVista('clasificar', soloQue); };
    return b;
  }

  function pintarHaLlegado(texto) {
    var caja = $('inicio-ha-llegado-linea');
    if (!caja) return;

    var nCorreos = contarCorreos(texto);
    var nSueltos = contarSueltos(texto);
    var hayNuevos = Object.keys(App.E.reciales || {}).length > 0;

    caja.innerHTML = '';
    if (!nCorreos && !nSueltos) {
      caja.innerHTML = '<span class="inicio-ha-llegado-vacio">No ha llegado nada.</span>';
      /* Si #zona-clasificar está a la vista con un filtro puesto (se ha
         llegado desde uno de los dos enlaces y, mientras tanto, ha
         dejado de haber nada de esa clase), se pone al día. */
      if (App.pintarSoloQueClasificar) App.pintarSoloQueClasificar();
      return;
    }

    var etiqueta = document.createElement('span');
    etiqueta.className = 'inicio-ha-llegado-etiqueta';
    etiqueta.textContent = 'Ha llegado: ';
    caja.appendChild(etiqueta);

    var trozos = [
      trozoHaLlegado(nCorreos, 'correo', 'correos', 'correos', false),
      trozoHaLlegado(nSueltos, 'documento por clasificar', 'documentos por clasificar', 'documentos', hayNuevos)
    ].filter(Boolean);

    trozos.forEach(function (trozo, i) {
      if (i) caja.appendChild(document.createTextNode(' · '));
      caja.appendChild(trozo);
    });

    if (App.pintarSoloQueClasificar) App.pintarSoloQueClasificar();
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
    if (!$('inicio-ha-llegado-linea') || !window.QueMeToca) return;
    repintando = true;
    var guarda = null;
    try {
      var esteTurno = ++turno;
      var texto = textoBuscado();

      var datos = await QueMeToca.reunir();
      if (esteTurno !== turno) return;
      /* Fila 256 (docs/LISTA-A-LA-MISMA-ALTURA-AL-VOLVER.md): la franja de avisos,
         «Ha llegado» y el filtro de responsable cambian de alto por encima de la
         lista mientras se repinta, y el «scroll anchoring» del navegador movía
         la lista esos píxeles (unos 41) cada vez. Se apunta la altura (a estas
         alturas, quien navega ya la ha puesto) y se devuelve al terminar. */
      guarda = guardarAltura();
      pintarCuentaVencidos(datos.items);

      if (window.InicioTabla) await InicioTabla.pintar();
      if (esteTurno !== turno) return;

      await pintarHaLlegado(texto);
      if (esteTurno !== turno) return;
      await pintarAvisoAspirantes();
    } finally {
      if (guarda) guarda.devolver();
      repintando = false;
    }
  }

  /* Apunta `scrollY`, apaga el anclaje del navegador mientras Inicio se repinta y,
     con `devolver()`, deja la lista donde estaba salvo que la persona haya tocado la
     pantalla (rueda, tacto, tecla o ratón) entre medias: entonces se le devuelve el
     anclaje y se la deja en paz. Se vuelve a mirar en los dos cuadros siguientes,
     que es cuando el navegador termina de recolocar la página. El anclaje solo se
     apaga durante el repintado: el resto del tiempo lo necesita la cabecera fija
     (js/cabecera-fija.js) para no dar saltos al encogerse. */
  function guardarAltura() {
    var raiz = document.documentElement;
    var anclajeAntes = raiz.style.overflowAnchor;
    var pedida = window.Navegacion && Navegacion.alturaPedida ? Navegacion.alturaPedida() : null;
    var alto = pedida !== null ? pedida : window.scrollY, tocada = false, activa = true;
    var eventos = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    function soltar() {
      if (!activa) return;
      activa = false;
      raiz.style.overflowAnchor = anclajeAntes;
      eventos.forEach(function (e) { window.removeEventListener(e, tocar, true); });
    }
    function tocar() { tocada = true; soltar(); }
    raiz.style.overflowAnchor = 'none';
    eventos.forEach(function (e) { window.addEventListener(e, tocar, { capture: true, passive: true }); });
    function poner() { if (!tocada && Math.abs(window.scrollY - alto) > 2) window.scrollTo(0, alto); }
    var paso = window.requestAnimationFrame ? function (f) { window.requestAnimationFrame(f); } : function (f) { setTimeout(f, 16); };
    return {
      devolver: function () {
        poner();
        paso(function () {
          poner();
          paso(function () { poner(); soltar(); });
        });
      }
    };
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
