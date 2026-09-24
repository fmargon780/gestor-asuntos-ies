/* ============================================================
   estado-migracion.js — el paso único de los estados escritos a mano
   a los hitos (fila 129, 24-sep-2026, docs/EL-HITO-ES-EL-ESTADO.md,
   punto 6).

   Una sola vez, sin preguntar, sobre los asuntos abiertos:

     - Un asunto sin hitos recibe los de la guía de su tipo, con lo que
       ya tuviera marcado (pasosHechos/pasosElegidos). Si el tipo no
       tiene guía, antes se le pone la guía mínima (js/estado-hito.js).
       Un asunto sin tipo reconocible se queda sin hitos.
     - Si su estado escrito a mano llevaba la marca de terceros
       (`espera` en estados.json), su hito actual queda «Esperando a»
       tercero, con el nombre del estado viejo como motivo.
     - Nada más. `situacion` se queda quieta en asuntos.json (solo se
       deja de leer) y estados.json no se borra: por si hay que deshacer.

   Todos los hitos van en UNA escritura de hitos.json. Al terminar se
   deja la marca `_GESTOR/estado-migrado.json` (fuera de los dieciocho
   ficheros compartidos, como presencia.json: no necesita copia), y ya
   no se repite, tampoco en el otro ordenador. Si falla, no se deja la
   marca y se intenta otra vez la próxima vez que se entre.
   ============================================================ */
var EstadoMigracion = (function () {

  var MARCA = 'estado-migrado.json';
  var hecho = false;
  var corriendo = false;

  /* Función pura: qué hacer con cada asunto. `asuntos` son
     { nombre, tipo, ficha, ficheros }; `porAsunto` lo leído de
     hitos.json; `pasosDe(tipo)` la guía (ya con la mínima puesta).
     Cambia `porAsunto` y devuelve { creados, enEspera }. */
  function aplicar(porAsunto, ajustes, asuntos, estados, pasosDe) {
    var deEspera = {};
    (estados || []).forEach(function (e) { if (e && e.espera) deEspera[e.nombre] = true; });
    var creados = 0, enEspera = 0;
    (asuntos || []).forEach(function (a) {
      var f = a.ficha || {};
      var entrada = porAsunto[a.nombre];
      if ((!entrada || !(entrada.hitos || []).length) && a.tipo) {
        var pasos = pasosDe(a.tipo) || [];
        if (pasos.length) {
          var lista = Hitos.listaImportando(pasos, f.pasosHechos, f.pasosElegidos);
          Hitos.recomputeEnCurso(lista);
          entrada = porAsunto[a.nombre] = { creados: U.hoyIso(), hitos: lista };
          creados++;
        }
      }
      if (!entrada || !f.situacion || !deEspera[f.situacion]) return;
      var yaEspera = false;
      (function mirar(l) {
        (l || []).forEach(function (h) {
          if (h.esperandoA) yaEspera = true;
          if (h.clase === 'decision') (h.opciones || []).forEach(function (o) { mirar(o.hitos); });
        });
      })(entrada.hitos);
      if (yaEspera) return;
      if (EstadoHito.ponerEsperaEn(entrada.hitos, ajustes, 'tercero', f.situacion, a.ficheros || [])) enEspera++;
    });
    return { creados: creados, enEspera: enEspera };
  }

  /* Fila 132: la lista de estados ya no se carga al entrar; se lee estados.json aquí, una
     vez. Las primeras versiones guardaban solo el nombre: la marca de
     espera sale entonces de los de fábrica o del propio nombre. */
  async function estadosViejos(g) {
    var leido = null;
    try { leido = await Carpetas.leerJson(g, 'estados.json'); } catch (e) { leido = null; }
    var lista = normalizarEstados(leido);
    /* Sin fichero (o vacío), los de fábrica, como hacía antes App.cargarEstados. */
    if (!lista.length && window.Nombres && Nombres.ESTADOS_POR_DEFECTO) {
      lista = Nombres.ESTADOS_POR_DEFECTO.map(function (x) { return { nombre: x.nombre, espera: !!x.espera }; });
    }
    return lista;
  }

  function normalizarEstados(lista) {
    var deFabrica = {};
    ((window.Nombres && Nombres.ESTADOS_POR_DEFECTO) || []).forEach(function (e) { deFabrica[e.nombre] = e.espera; });
    return (Array.isArray(lista) ? lista : []).map(function (e) {
      if (typeof e === 'string') {
        var n = U.normalizar(e);
        return { nombre: e, espera: (e in deFabrica) ? !!deFabrica[e] : (n.indexOf('espera') !== -1 || n.indexOf('tercero') !== -1) };
      }
      return { nombre: String((e && e.nombre) || ''), espera: !!(e && e.espera) };
    }).filter(function (e) { return e.nombre; });
  }

  async function nombresDe(a) {
    if (!a.handle) return [];
    try {
      return (await Carpetas.ficheros(a.handle)).map(function (x) { return x.nombre; })
        .filter(function (n) { return !/^[._~]/.test(n); });
    } catch (e) { return []; }
  }

  async function hacer() {
    var g = window.Gestor && Gestor.carpetaGestor();
    if (!g || !window.Hitos || !window.EstadoHito || !window.GuiasDelCentro) return;
    if (await Carpetas.existeFichero(g, MARCA)) { hecho = true; return; }

    var lista = (App.E.listaAbiertos || []).map(function (a) {
      return { nombre: a.nombre, handle: a.handle, ficha: a.ficha || {},
        tipo: (typeof App.tipoDeAsunto === 'function' ? App.tipoDeAsunto(a) : '') || (a.ficha && a.ficha.tipo) || '' };
    });
    var datos = await Hitos.leer();
    var sinHitos = lista.filter(function (a) {
      var e = datos.porAsunto[a.nombre];
      return a.tipo && (!e || !(e.hitos || []).length);
    });

    /* La guía mínima, antes, a los tipos que la necesiten (una vez cada uno). */
    var guias = {};
    for (var i = 0; i < sinHitos.length; i++) {
      var t = sinHitos[i].tipo;
      if (guias[t]) continue;
      guias[t] = GuiasDelCentro.pasosDe(t);
      if (!guias[t].length) guias[t] = await EstadoHito.guiaMinima(t);
    }
    var estados = await estadosViejos(g);
    var conEspera = {};
    estados.forEach(function (e) { if (e.espera) conEspera[e.nombre] = true; });
    for (var k = 0; k < lista.length; k++) {
      if (conEspera[lista[k].ficha.situacion]) lista[k].ficheros = await nombresDe(lista[k]);
    }

    var cuenta = { creados: 0, enEspera: 0 };
    await Hitos.cambiar(function (d) {
      cuenta = aplicar(d.porAsunto, d.ajustes, lista, estados, function (tipo) {
        return guias[tipo] || GuiasDelCentro.pasosDe(tipo);
      });
      return d;
    });
    await Carpetas.guardarJson(g, MARCA, { hechoEl: U.ahora(), hechoPor: App.E.usuario || '', creados: cuenta.creados, enEspera: cuenta.enEspera });
    hecho = true;
    if (cuenta.creados || cuenta.enEspera) {
      U.aviso('He puesto al día los asuntos abiertos: el estado de cada uno es ahora su paso actual' +
        (cuenta.enEspera ? ' (' + cuenta.enEspera + (cuenta.enEspera === 1 ? ' queda' : ' quedan') + ' «Esperando a» tercero)' : '') +
        '. Usa «Estamos en este paso» para ponerlos en su sitio.', 'bueno');
      /* La lista se repinta sola: Hitos.alCambiar (js/hitos-a-quien.js). */
    }
  }

  function intentar() {
    if (hecho || corriendo) return;
    if (!window.Gestor || !Gestor.carpetaGestor() || !App.E || !App.E.listaAbiertos) return;
    corriendo = true;
    /* Un poco después de entrar: que las guías y la lista ya estén leídas. */
    setTimeout(function () {
      hacer().catch(function (e) {
        U.accesorio('No he podido poner al día el estado de los asuntos abiertos (se intentará al volver a entrar)', e);
        hecho = true;
      }).then(function () { corriendo = false; });
    }, 3000);
  }

  function enganchar() {
    if (window.Gestor && Gestor.alRefrescar) Gestor.alRefrescar.push(intentar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
  else enganchar();

  return { aplicar: aplicar, hacer: hacer, MARCA: MARCA, normalizarEstados: normalizarEstados };
})();
window.EstadoMigracion = EstadoMigracion;
