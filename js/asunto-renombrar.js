/* ============================================================
   asunto-renombrar.js — fila 62 (docs/RENOMBRAR-SIN-PERDER-HITOS.md).

   El nombre de la carpeta de un asunto es la clave con la que se
   guardan tres cosas, en tres ficheros distintos: la ficha
   (asuntos.json), los hitos (hitos.json, porAsunto[clave]) y quién
   está dentro de él ahora mismo (presencia.json). Hasta esta fila,
   renombrar un asunto solo movía la ficha: los hitos (fecha límite,
   responsable, historial, documentos apuntados, lo reunido) se
   quedaban bajo el nombre viejo, y como `crearSiToca` (js/hitos-panel.js)
   ve que el asunto "no tiene hitos" y los vuelve a crear desde la
   guía, la pérdida no daba ningún error: solo salían hitos en blanco.

   Aquí vive el único sitio que mueve las tres cosas a la vez. Los
   cuatro caminos que renombran un asunto (js/asuntos-editar.js ×2,
   js/unir-asuntos.js, js/fichas-huerfanas.js) y el quinto que lo
   borra o lo devuelve (js/papelera.js) pasan por aquí; ninguno vuelve
   a tocar `App.E.registro.asuntos`, `Hitos` o `Presencia` por su
   cuenta para esto.

   Se carga después de js/hitos.js y de js/presencia.js.
   ============================================================ */
var AsuntoRenombrar = (function () {

  /* Si en el destino ya había hitos (caso raro: unir dos asuntos, o
     enlazar una huérfana con una carpeta que ya tenía los suyos), no
     se pisan: se fusionan por identificador, igual que
     Conflictos.unirPorId hace con una copia en conflicto de Dropbox.
     Sin js/conflictos.js cargado (no debería pasar nunca en la
     aplicación de verdad, pero las pruebas no siempre cargan todo),
     se cae en una unión sencilla que tampoco pierde nada. */
  function unirHitos(a, b) {
    if (window.Conflictos && typeof window.Conflictos.unirPorId === 'function') {
      return window.Conflictos.unirPorId(a, b);
    }
    var vistos = {}, salida = [];
    (a || []).concat(b || []).forEach(function (h) {
      if (!h || !h.id || vistos[h.id]) return;
      vistos[h.id] = true;
      salida.push(h);
    });
    return salida;
  }

  /* Mueve (o fusiona) la entrada de hitos.json de 'claveVieja' a
     'claveNueva', y la señal de presencia.json. Devuelve una nota para
     el asunto si ha habido que fusionar, o null si no hacía falta. */
  async function moverHitosYPresencia(claveVieja, claveNueva) {
    if (claveVieja === claveNueva) return null;
    var notaFusion = null;

    if (window.Hitos) {
      await Hitos.cambiar(function (d) {
        var deVieja = d.porAsunto[claveVieja];
        var deNueva = d.porAsunto[claveNueva];
        if (deVieja && deNueva && (deVieja.hitos || []).length) {
          notaFusion = 'Al cambiar el nombre, ya había hitos con el nombre nuevo: se han juntado con ' +
            'los del nombre anterior, sin perder ninguno.';
          d.porAsunto[claveNueva] = {
            creados: deNueva.creados || deVieja.creados,
            hitos: unirHitos(deNueva.hitos, deVieja.hitos)
          };
        } else if (deVieja) {
          d.porAsunto[claveNueva] = deVieja;
        }
        delete d.porAsunto[claveVieja];
        return d;
      });
    }

    if (window.Presencia && typeof window.Presencia.mover === 'function') {
      try { await Presencia.mover(claveVieja, claveNueva); } catch (e) { /* no crítico */ }
    }

    return notaFusion;
  }

  /* El camino normal: el asunto 'claveVieja' pasa a llamarse
     'claveNueva'. 'datosExtra' se funde encima de la ficha que ya
     tenía (igual que hacía cada sitio a mano hasta ahora). Devuelve la
     ficha final, ya guardada. */
  async function mover(claveVieja, claveNueva, datosExtra) {
    await App.guardarRegistroFresco(async function (registro) {
      var antes = registro.asuntos[claveVieja] || {};
      registro.asuntos[claveNueva] = Object.assign({}, antes, datosExtra || {});
      if (claveVieja !== claveNueva) {
        delete registro.asuntos[claveVieja];
        /* Fila 176, punto 2: la lápida de la clave vieja, en la misma
           operación de la cola que la borra. */
        if (window.Borrados) await Borrados.marcar(App.E.gestor, 'asuntos', claveVieja, 'renombrado');
      }
    });

    if (window.Encargos) await Encargos.alMoverAsunto(claveVieja, claveNueva);   /* fila 289: el nombre guardado en sus encargos */
    var nota = await moverHitosYPresencia(claveVieja, claveNueva);
    if (nota && window.Notas) {
      try { await Notas.anadirAuto({ nombre: claveNueva }, nota); } catch (e) { /* no crítico */ }
    }
    return App.E.registro.asuntos[claveNueva];
  }

  /* Unir dos asuntos (js/unir-asuntos.js): la ficha ya la funde quien
     llama (las reglas de notas/pasosHechos/pasosElegidos son propias
     de esa pantalla); aquí solo se mueven hitos y presencia de
     'seVa' a 'seQueda'. */
  async function fusionar(claveQueda, claveVa) {
    if (window.Encargos) await Encargos.alMoverAsunto(claveVa, claveQueda);   /* fila 289 */
    return moverHitosYPresencia(claveVa, claveQueda);
  }

  /* Fila 292 (docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md, 1): los hitos guardados bajo un nombre que ya no
     existe pasan a un asunto vivo. Si el asunto ya tenía hitos, se unen: los del mismo título cuentan como
     uno, y se queda el que esté hecho. Devuelve lo que había antes, para `deshacerPasarHitos`. */
  function unirPorTitulo(dest, vieja) {
    var salida = (dest || []).slice();
    var t = function (h) { return window.U && U.normalizar ? U.normalizar(h.titulo || '') : String(h.titulo || ''); };
    (vieja || []).forEach(function (h) {
      var i = -1;
      salida.forEach(function (x, j) { if (i < 0 && (x.id === h.id || (t(x) && t(x) === t(h)))) i = j; });
      if (i < 0) salida.push(h);
      else if (h.estado === 'hecho' && salida[i].estado !== 'hecho') salida[i] = h;
    });
    return salida;
  }

  async function pasarHitos(claveVieja, claveNueva) {
    var antes = { vieja: null, nueva: null };
    await Hitos.cambiar(function (d) {
      var v = d.porAsunto[claveVieja], n = d.porAsunto[claveNueva];
      antes.vieja = v ? JSON.parse(JSON.stringify(v)) : null;
      antes.nueva = n ? JSON.parse(JSON.stringify(n)) : null;
      if (!v || claveVieja === claveNueva) return d;
      d.porAsunto[claveNueva] = (n && (n.hitos || []).length)
        ? { creados: n.creados || v.creados, hitos: unirPorTitulo(n.hitos, v.hitos),
            pasosConocidos: (n.pasosConocidos || []).concat(v.pasosConocidos || []) }
        : v;
      delete d.porAsunto[claveVieja];
      return d;
    });
    return antes;
  }

  async function deshacerPasarHitos(claveVieja, claveNueva, antes) {
    await Hitos.cambiar(function (d) {
      if (antes.nueva) d.porAsunto[claveNueva] = antes.nueva; else delete d.porAsunto[claveNueva];
      if (antes.vieja) d.porAsunto[claveVieja] = antes.vieja;
      return d;
    });
  }

  /* Borrar un asunto (mandarlo a la papelera): saca los hitos de
     hitos.json (para que la papelera los lleve dentro de su ficha) y
     quita la señal de presencia. La ficha de asuntos.json la borra
     quien llama (js/papelera.js ya lo hacía y sigue igual). */
  async function quitar(clave) {
    var hitos = null;
    if (window.Hitos) {
      await Hitos.cambiar(function (d) {
        hitos = d.porAsunto[clave] || null;
        delete d.porAsunto[clave];
        return d;
      });
    }
    if (window.Presencia && typeof window.Presencia.borrarClave === 'function') {
      try { await Presencia.borrarClave(clave); } catch (e) { /* no crítico */ }
    }
    return hitos;
  }

  /* Lo contrario de quitar: al devolver un asunto desde la papelera,
     pone sus hitos de vuelta bajo 'clave'. Si mientras tanto ese
     asunto ha vuelto a tener hitos por otro camino (raro, pero
     posible), se fusionan en vez de perder unos u otros. */
  async function restaurar(clave, hitosGuardados) {
    if (!hitosGuardados || !window.Hitos) return;
    await Hitos.cambiar(function (d) {
      var yaHay = d.porAsunto[clave];
      if (yaHay && (yaHay.hitos || []).length) {
        d.porAsunto[clave] = {
          creados: yaHay.creados || hitosGuardados.creados,
          hitos: unirHitos(yaHay.hitos, hitosGuardados.hitos)
        };
      } else {
        d.porAsunto[clave] = hitosGuardados;
      }
      return d;
    });
  }

  /* ==========================================================
     LIMPIAR LO QUE YA ESTÁ ROTO (sección 3.3 del encargo)

     Antes de este arreglo puede haber quedado, en hitos.json, alguna
     entrada de un asunto que se renombró y cuyo nombre viejo ya no
     existe en ningún lado. No se puede adivinar a qué asunto
     pertenecía: solo se cuenta y se ofrece borrarla.
     ========================================================== */

  /* Fila 291 (docs/PROBLEMAS-CON-SU-SOLUCION.md): mira la misma fuente que las fichas sin carpeta
     (el índice del ARCHIVO; si no está hecho, el ARCHIVO si ya se leyó), para no dar por perdido
     lo de un asunto archivado. Sin ninguna de las dos, un asunto cerrado no se puede comprobar:
     no se acusa. */
  async function huerfanos(soloLoLeido) {
    if (!window.Hitos) return [];
    /* `soloLoLeido` (el cálculo de fondo de «Problemas»): sin volver a leer hitos.json. */
    var datos = soloLoLeido ? Hitos.ultimosLeidos() : await Hitos.leer();
    if (!datos) return [];
    var vivos = {};
    (App.E.listaAbiertos || []).forEach(function (a) { vivos[a.nombre] = true; });
    var indice = window.IndiceArchivo ? await IndiceArchivo.leerDisco({ todos: true }) : { ok: false };
    var archivoConocido = false;
    if (indice.ok) {
      archivoConocido = true;
      indice.datos.asuntos.forEach(function (e) { vivos[e.nombre] = true; });
    }
    if (App.E.listaArchivo && App.E.listaArchivo.length) {
      archivoConocido = true;
      App.E.listaArchivo.forEach(function (a) { vivos[a.nombre] = true; });
    }
    var fichas = (App.E.registro && App.E.registro.asuntos) || {};
    return Object.keys(datos.porAsunto).filter(function (k) {
      if (vivos[k]) return false;
      return archivoConocido || !(fichas[k] && fichas[k].estado === 'cerrado');
    });
  }

  function $(id) { return document.getElementById(id); }

  /* La tarjeta «Hay hitos guardados de N asuntos que ya no existen» de «Problemas». Los de un
     asunto de la tarjeta «han perdido su carpeta» no salen aquí: se arreglan solos al buscarle su carpeta. */
  var turno = 0;   /* si llegan dos cálculos a la vez, solo vale el último */

  async function pintarTarjeta(forzar) {
    var mio = ++turno;
    var claves = await huerfanos(forzar !== true);
    if (window.FichasHuerfanas) {
      var conFicha = await FichasHuerfanas.calcular();
      claves = claves.filter(function (k) { return conFicha.indexOf(k) === -1; });
    }
    if (mio !== turno) return claves;
    if (!window.Problemas || !window.ProblemasTextos) return claves;
    if (!claves.length) { Problemas.registrar('hitos', null); return claves; }
    var datos = Hitos.ultimosLeidos ? Hitos.ultimosLeidos() : null;
    var d = ProblemasTextos.hitos(claves.map(function (c) {
      var n = datos && datos.porAsunto[c] ? (datos.porAsunto[c].hitos || []).length : 0;
      return { nombre: c, detalle: n === 1 ? '1 hito' : n + ' hitos' };
    }));
    claves.forEach(function (c, i) {
      d.elementos[i].acciones[0].alPulsar = function () {   /* fila 292: «Son de este asunto…» */
        return window.HitosDeAsuntosPerdidos ? HitosDeAsuntosPerdidos.elegir(c) : null;
      };
      d.elementos[i].acciones[1].alPulsar = async function () {
        var ok = await U.preguntar('Quitar estos hitos',
          '<p>Se quitan los hitos guardados de <strong>' + U.escapar(c) + '</strong>, un asunto que ya no existe con ese nombre.</p>' +
          '<p class="nota">Quedan en las copias de seguridad, por si era un error.</p>', 'Quitar');
        if (!ok) return;
        await Hitos.cambiar(function (h) { delete h.porAsunto[c]; return h; });
        U.aviso('Hitos quitados.', 'bueno');
        await Problemas.recalcular('hitos');
      };
    });
    Problemas.registrar('hitos', d);
    return claves;
  }

  App.pintarHitosHuerfanos = pintarTarjeta;
  if (window.Problemas) Problemas.calculador('hitos', pintarTarjeta, 10 * 60 * 1000);   /* de fondo, con lo ya leído; al abrir Ajustes, leyendo de verdad */

  return {
    mover: mover, fusionar: fusionar, quitar: quitar, restaurar: restaurar,
    pasarHitos: pasarHitos, deshacerPasarHitos: deshacerPasarHitos,
    unirHitosPorTitulo: unirPorTitulo,   /* fila 303: lo usa js/carpetas-perdidas-enlazar.js */
    /* para las pruebas */
    _huerfanos: huerfanos
  };
})();
window.AsuntoRenombrar = AsuntoRenombrar;
