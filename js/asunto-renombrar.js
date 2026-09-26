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
          notaFusion = 'Al renombrar, ya había hitos con el nombre nuevo: se han juntado con ' +
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

    var nota = await moverHitosYPresencia(claveVieja, claveNueva);
    if (nota && window.Notas) {
      try { await Notas.anadir({ nombre: claveNueva }, nota); } catch (e) { /* no crítico */ }
    }
    return App.E.registro.asuntos[claveNueva];
  }

  /* Unir dos asuntos (js/unir-asuntos.js): la ficha ya la funde quien
     llama (las reglas de notas/pasosHechos/pasosElegidos son propias
     de esa pantalla); aquí solo se mueven hitos y presencia de
     'seVa' a 'seQueda'. */
  async function fusionar(claveQueda, claveVa) {
    return moverHitosYPresencia(claveVa, claveQueda);
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

  async function huerfanos() {
    if (!window.Hitos) return [];
    var datos = await Hitos.leer();
    var vivos = {};
    (App.E.listaAbiertos || []).forEach(function (a) { vivos[a.nombre] = true; });
    (App.E.listaArchivo || []).forEach(function (a) { vivos[a.nombre] = true; });
    return Object.keys(datos.porAsunto).filter(function (k) { return !vivos[k]; });
  }

  function $(id) { return document.getElementById(id); }

  function bloqueDeAjustes() {
    var ya = $('bloque-hitos-huerfanos');
    if (ya) return ya;
    var pantalla = $('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-hitos-huerfanos';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Hitos huérfanos</span>' +
        '<span class="bloque-pie" id="hitos-huerfanos-pie">De asuntos renombrados antes de este arreglo</span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Antes de este arreglo, renombrar un asunto no movía sus hitos: puede ' +
        'haber quedado en <code>hitos.json</code> alguna entrada con el nombre de una carpeta que ' +
        'ya no existe. No se puede adivinar a qué asunto pertenecía: aquí se cuentan y se pueden ' +
        'borrar.</p>' +
        '<div id="hitos-huerfanos-cuerpo"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  App.pintarHitosHuerfanos = async function () {
    bloqueDeAjustes();
    var claves = await huerfanos();

    var pie = $('hitos-huerfanos-pie');
    if (pie) pie.textContent = claves.length
      ? claves.length + (claves.length === 1 ? ' hito huérfano' : ' hitos huérfanos')
      : 'De asuntos renombrados antes de este arreglo';

    var cuerpo = $('hitos-huerfanos-cuerpo');
    if (!cuerpo) return;
    cuerpo.innerHTML = '';
    if (!claves.length) {
      cuerpo.innerHTML = '<div class="vacio">Ninguno.</div>';
      return;
    }
    var boton = document.createElement('button');
    boton.className = 'boton boton-peligro';
    boton.textContent = 'Borrar ' + claves.length + (claves.length === 1 ? ' hito huérfano' : ' hitos huérfanos');
    boton.onclick = async function () {
      var lista = claves.map(function (c) { return '<li>' + U.escapar(c) + '</li>'; }).join('');
      var ok = await U.preguntar('Borrar hitos huérfanos',
        '<p>Se van a borrar los hitos de estas ' + claves.length + ' entradas de ' +
        '<code>hitos.json</code>, de asuntos que ya no existen con ese nombre:</p>' +
        '<ul>' + lista + '</ul>', 'Borrar');
      if (!ok) return;
      await Hitos.cambiar(function (d) {
        claves.forEach(function (c) { delete d.porAsunto[c]; });
        return d;
      });
      U.aviso('Hitos huérfanos borrados.', 'bueno');
      await App.pintarHitosHuerfanos();
    };
    cuerpo.appendChild(boton);
  };

  return {
    mover: mover, fusionar: fusionar, quitar: quitar, restaurar: restaurar,
    /* para las pruebas */
    _huerfanos: huerfanos
  };
})();
window.AsuntoRenombrar = AsuntoRenombrar;
