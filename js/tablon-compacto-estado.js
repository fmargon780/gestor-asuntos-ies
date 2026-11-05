/* ============================================================
   tablon-compacto-estado.js — el estado, el pliegue y los textos de fecha y urgencia (fila 536: trozo de js/tablon-compacto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/tablon-compacto.js.
   ============================================================ */
var TablonCompactoNucleo = TablonCompactoNucleo || {};
(function () {

  var I = TablonCompactoNucleo;
  I.S = I.S || {};
  function alternarTodas() { return I.alternarTodas.apply(this, arguments); }
  function pintar() { return I.pintar.apply(this, arguments); }

  var COLORES = ['amarillo', 'azul', 'verde', 'rosa'];

  I.S.verHechas = false;
  I.S.editando = '';        /* el id de la nota que se está cambiando */
  I.S.colorElegido = 'amarillo';
  I.S.soloParaMi = false;   /* cómo nacerá la próxima nota */

  /* Lo que se lleva escrito en la nota nueva, guardado aquí (no solo
     en el DOM) para que sobreviva aunque algo de fuera destruya la
     columna entera antes de que se pegue la nota (fila 33,
     17-sep-2026). Se actualiza con cada tecla, no solo al repintar. */
  I.S.borrador = '';
  I.S.borradorFecha = '';
  I.S.borradorHora = '';
  I.S.borradorAntes = null;   /* null = la de fábrica (15 minutos antes) */

  /* Fila 353 (docs/INICIO-MAS-COMPACTO.md): el tablón se pliega a una
     línea «Tablón (N) ▸» + la nota más reciente. Lo que se deja se
     recuerda en cada ordenador (js/inicio-plegados.js). `I.S.sesionAbierto`
     es la regla de apertura: con una nota para hoy (o atrasada) sin
     quitar, sale abierto al arrancar y al pulsar «Inicio» en el menú
     aunque se hubiera dejado plegado; no se guarda, y si se pliega se
     queda plegado mientras se siga en Inicio. null = vale lo guardado. */
  I.S.sesionAbierto = null;

  function estaPlegado() {
    if (I.S.sesionAbierto !== null) return !I.S.sesionAbierto;
    return !window.InicioPlegados || InicioPlegados.estaPlegado('tablon');
  }

  function remedir() { if (window.InicioPlegados) InicioPlegados.remedir(); }

  function alternarPliegue() {
    var plegar = !estaPlegado();
    if (plegar && I.S.verTodas) alternarTodas();
    if (I.S.sesionAbierto !== null) I.S.sesionAbierto = !plegar;
    else if (window.InicioPlegados) InicioPlegados.poner('tablon', plegar);
    pintar();
    remedir();
  }

  function reglaApertura() {
    var hoy = hoyIso();
    /* Fila 372: una nota con hora ya pasada (de hoy o de otro día) no lo abre. */
    var hay = Tablon.notas().filter(Tablon.laVeo).some(function (n) {
      return !n.hecha && n.para && n.para <= hoy && !(n.hora && TablonHora.pasada(n));
    });
    I.S.sesionAbierto = hay ? true : null;
    pintar();
    remedir();
  }

  function $(id) { return document.getElementById(id); }
  function cambiar(hacer) { return Tablon.cambiar(hacer); }

  /* ---------- fechas ---------- */

  function hoyIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  function legible(iso) {
    var p = String(iso || '').slice(0, 10).split('-');
    if (p.length !== 3) return '';
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function cuandoTexto(n) {
    var trozos = [];
    if (n.autor) trozos.push(n.autor);
    if (n.creado) trozos.push(legible(n.creado));
    return trozos.join(' · ');
  }

  /* Una nota con fecha puede estar atrasada, ser de hoy, o de más
     adelante. Es lo único que cambia el orden: lo que corre, arriba. */
  function urgencia(n) {
    if (!n.para) return 2;
    if (n.para < hoyIso()) return 0;
    if (n.para === hoyIso()) return 1;
    return 3;
  }

  function ordenar(lista) {
    return lista.slice().sort(function (a, b) {
      var ua = urgencia(a), ub = urgencia(b);
      if (ua !== ub) return ua - ub;
      if (a.para && b.para && a.para !== b.para) return a.para < b.para ? -1 : 1;
      /* Fila 372: el mismo día, por hora; las de ese día sin hora, detrás. */
      if (a.para && a.para === b.para && (a.hora || b.hora)) {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        if (a.hora !== b.hora) return a.hora < b.hora ? -1 : 1;
      }
      return (b.creado || '') < (a.creado || '') ? -1 : 1;
    });
  }

  /* ---------- la columna ---------- */

  I.COLORES = COLORES;
  I.estaPlegado = estaPlegado;
  I.alternarPliegue = alternarPliegue;
  I.reglaApertura = reglaApertura;
  I.$ = $;
  I.cambiar = cambiar;
  I.legible = legible;
  I.cuandoTexto = cuandoTexto;
  I.urgencia = urgencia;
  I.ordenar = ordenar;
})();
