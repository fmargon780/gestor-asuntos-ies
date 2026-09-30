/* ============================================================
   tipos-unir.js — unir dos tipos de asunto en uno (27-sep-2026,
   fila 207, docs/UNIR-DOS-TIPOS.md).

   El tipo cuya pantalla está abierta ("el que desaparece") se funde en
   otro que se elige aquí ("el que se queda"). Orden, siempre: primero
   todo lo de `_GESTOR` (guía, campos, plantillas, recurrentes, alias,
   lápida); si algo de eso falla, aviso rojo y no se toca ningún
   asunto. Después, los asuntos ABIERTOS del que desaparece, uno detrás
   de otro (sus carpetas se renombran al tipo que se queda); si algo de
   esto falla, ámbar, pero el tipo ya cuenta como unido. El ARCHIVO no
   se toca nunca.

   La guía y los campos llevan su propia regla (tabla del encargo),
   DISTINTA de la que usa `TiposNombre.mover` para renombrar un tipo:
   - Guía: se queda siempre la del tipo que se queda, salvo que esté
     vacía o sea la mínima (`EstadoHito.esGuiaMinima`); en ese caso se
     queda la del que desaparece. La que se descarta va a la papelera.
   - Campos propios: se SUMAN (los que no existan ya por nombre, sin
     tildes ni mayúsculas, se añaden al final); nada se borra ni se
     compara por tamaño.
   Plantillas, recurrentes y `repartirTipo` sí valen igual que al
   renombrar: se reutilizan `TiposNombre.moverPlantillas/moverRecurrentes`
   tal cual.

   Los asuntos pasados llevan `tipoUnidoDe` en su ficha: sus hitos son
   los de la guía de antes, y no deben recibir los pasos nuevos de la
   guía del tipo que se queda (js/hitos-sincronizar.js lo salta por
   esto). No se les ofrece la guía nueva porque no se pasa por
   `App.editarAsunto`/`ofrecerGuiaNueva`: aquí se renombra igual que
   "Cambiar" un asunto (`Carpetas.renombrar` + `AsuntoRenombrar.mover`),
   sin pasar por ese cuadro.

   Cada fichero de `_GESTOR` por su propia cola (`App.enFila`),
   releyendo antes de escribir, como en js/tipos-nombre.js.
   ============================================================ */
var TiposUnir = (function () {

  function n(t) {
    return (window.TiposNombre && TiposNombre.n) ? TiposNombre.n(t) : U.normalizar(String(t || '')).trim();
  }

  /* ---------- guía ---------- */

  async function moverGuiaUnir(viejo, nuevo, r) {
    var g = App.E.gestor;
    var guias = null;
    try { guias = await Carpetas.leerJson(g, 'guias.json'); } catch (e) { guias = null; }
    guias = (guias && typeof guias === 'object') ? guias : {};
    var origen = guias[viejo] || [];
    var destino = guias[nuevo] || [];
    var destinoVale = destino.length && !(window.EstadoHito && EstadoHito.esGuiaMinima(destino));
    if (destinoVale) {
      /* Se queda la del tipo que se queda: la del que desaparece, si
         tenía algo de verdad, va a la papelera. */
      if (origen.length) {
        if (window.Papelera) await Papelera.mandarDato('guia', viejo, null, { tipo: viejo, pasos: origen });
        await GuiasDelCentro.guardarPasos(viejo, []);
        r.papelera++;
      }
      return;
    }
    if (!origen.length) return;   /* ninguno de los dos tenía guía de verdad */
    /* El que se queda no tenía guía, o solo la mínima: se queda la del
       que desaparece (nunca a la papelera: no se pierde nada). */
    await GuiasDelCentro.guardarPasos(nuevo, origen);
    await GuiasDelCentro.guardarPasos(viejo, []);
    r.guia = true;
  }

  /* ---------- campos propios: se suman, por nombre normalizado ---------- */

  async function moverCamposUnir(viejo, nuevo, r) {
    var g = App.E.gestor;
    var actual = await Campos.leer(g);
    var origen = (actual.porTipo || {})[viejo] || [];
    if (!origen.length) return;
    var destino = (actual.porTipo || {})[nuevo] || [];
    var yaHay = {};
    destino.forEach(function (c) { yaHay[n(Campos.nombreDeCampo(c, actual))] = true; });
    var anadidos = origen.filter(function (c) {
      var clave = n(Campos.nombreDeCampo(c, actual));
      if (!clave || yaHay[clave]) return false;
      yaHay[clave] = true;
      return true;
    });
    if (anadidos.length) {
      await Campos.guardarConfigDeTipo(g, nuevo, destino.concat(anadidos));
      r.campos = anadidos.length;
    }
    /* El que desaparece se queda sin campos propios: los suyos, si
       hacía falta alguno, ya han pasado al que se queda. */
    App.E.campos = await Campos.guardarConfigDeTipo(g, viejo, []);
  }

  /* ---------- palabras clave: se suman, sin repetir ---------- */

  function palabrasUnidas(desaparece, seQueda) {
    var yaHay = {};
    (seQueda.palabrasClave || []).forEach(function (p) { yaHay[n(p)] = true; });
    var nuevas = (desaparece.palabrasClave || []).filter(function (p) {
      var k = n(p);
      if (!p || yaHay[k]) return false;
      yaHay[k] = true;
      return true;
    });
    return nuevas.length ? (seQueda.palabrasClave || []).concat(nuevas) : seQueda.palabrasClave;
  }

  /* ---------- alias: el nombre, el corto y los alias del que
     desaparece, como alias del que se queda ---------- */

  function aliasUnidos(desaparece, seQueda) {
    var candidatos = [desaparece.tipo].concat(desaparece.nombreCorto ? [desaparece.nombreCorto] : [], desaparece.alias || []);
    var existentes = [seQueda.tipo].concat(seQueda.nombreCorto ? [seQueda.nombreCorto] : [], seQueda.alias || []).map(n);
    var alias = (seQueda.alias || []).slice();
    candidatos.forEach(function (c) {
      if (!c) return;
      var k = n(c);
      if (existentes.indexOf(k) === -1) { existentes.push(k); alias.push(c); }
    });
    return alias;
  }

  /* ---------- todo lo de _GESTOR, en orden ---------- */

  async function unirGestor(desaparece, seQueda) {
    var viejo = desaparece.tipo, nuevo = seQueda.tipo;
    var r = { guia: false, campos: 0, plantillas: 0, recurrentes: 0, papelera: 0, palabrasClave: false };

    if (window.GuiasDelCentro) await moverGuiaUnir(viejo, nuevo, r);
    if (window.Campos) await App.enFila('campos.json', function () { return moverCamposUnir(viejo, nuevo, r); });
    if (window.Plantillas && window.TiposNombre) {
      await App.enFila('plantillas.json', function () { return TiposNombre.moverPlantillas(viejo, nuevo, r); });
    }
    if (window.TiposNombre) {
      await App.enFila('recurrentes.json', function () { return TiposNombre.moverRecurrentes(viejo, nuevo, r); });
    }

    /* Fila 141: los tipos que, al repartir un PDF, crean asuntos del que
       desaparece, pasan a apuntar al que se queda (igual que TiposNombre.mover). */
    (App.E.tipos || []).forEach(function (t) { if (t.repartirTipo === viejo) t.repartirTipo = nuevo; });

    var palabras = palabrasUnidas(desaparece, seQueda);
    if (palabras !== seQueda.palabrasClave) { seQueda.palabrasClave = palabras; r.palabrasClave = true; }
    seQueda.alias = aliasUnidos(desaparece, seQueda);

    App.E.tipos = (App.E.tipos || []).filter(function (t) { return t !== desaparece; });
    await Borrados.marcar(App.E.gestor, 'tipos', viejo);
    await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); });

    return r;
  }

  /* ---------- los asuntos abiertos, uno detrás de otro ----------

     Mismo cálculo del nombre que usa "Cambiar" un asunto
     (js/asuntos-editar.js) con el tipo ya sustituido: sus piezas son
     privadas de aquel fichero (que esta fila no toca), así que se
     recalculan aquí a partir de la ficha, que es de fiar en un asunto
     que la propia aplicación creó. */

  function piezasDe(a) {
    var fecha6 = (a.leido && a.leido.fecha) || '';
    var fecha = /^\d{6}$/.test(fecha6)
      ? '20' + fecha6.slice(0, 2) + '-' + fecha6.slice(2, 4) + '-' + fecha6.slice(4, 6) : '';
    var f = a.ficha || {};
    return {
      fecha: fecha, curso: f.curso || '', grupo: f.grupo || '',
      campos: (f.campos && typeof f.campos === 'object') ? f.campos : {},
      descripcion: f.descripcion || '', tercero: f.tercero || '',
      numero: f.numero || (a.leido && a.leido.numero) || ''   /* fila 239 */
    };
  }

  function nombreNuevoDeAsunto(a, seQueda) {
    var p = piezasDe(a);
    var datos = {
      fecha: p.fecha, tipo: Nombres.tipoParaCarpeta(seQueda), curso: p.curso, grupo: p.grupo,
      campos: App.valoresGuardadosParaNombre(seQueda.tipo, p.campos),
      descripcion: p.descripcion, tercero: p.tercero, numero: p.numero
    };
    return Nombres.montarAsunto(datos).nombre;
  }

  async function unirAsuntos(desaparece, seQueda) {
    var viejo = desaparece.tipo;
    var afectados = (App.E.listaAbiertos || []).filter(function (a) { return App.tipoDeAsunto(a) === viejo; });
    /* Excepción de la tabla: si el que desaparece era reservado y el
       que se queda no, cada asunto pasado queda reservado uno a uno
       (fila 135, js/reservados.js), para que no se destape nada. */
    var marcarReservado = desaparece.reservado === true && seQueda.reservado !== true;
    var pasados = 0, saltados = [];
    for (var i = 0; i < afectados.length; i++) {
      var a = afectados[i];
      try {
        var nombreNuevo = nombreNuevoDeAsunto(a, seQueda);
        if (nombreNuevo !== a.nombre && await Carpetas.existe(App.E.abiertos, nombreNuevo)) {
          saltados.push(a.nombre + ': ya hay una carpeta abierta con ese nombre');
          continue;
        }
        if (nombreNuevo !== a.nombre) await Carpetas.renombrar(App.E.abiertos, a.nombre, nombreNuevo);
        var datosExtra = {
          tipo: seQueda.tipo, categoria: seQueda.categoria,
          /* Fila 207: para que no se le ofrezca la guía nueva ni le
             lleguen sus pasos nuevos (js/hitos-sincronizar.js). */
          tipoUnidoDe: viejo
        };
        if (marcarReservado) datosExtra.reservado = true;
        await AsuntoRenombrar.mover(a.nombre, nombreNuevo, datosExtra);
        pasados++;
      } catch (e) {
        saltados.push(a.nombre + ': ' + U.mensajeDeError(e));
      }
    }
    return { pasados: pasados, saltados: saltados };
  }

  /* ---------- lo de fuera ---------- */

  async function unir(desaparece, seQueda) {
    if (!desaparece || !seQueda || desaparece === seQueda || !App.E.gestor) {
      throw new Error('Elige un tipo distinto con el que unirlo.');
    }
    var gestor = await unirGestor(desaparece, seQueda);   /* si falla, no se toca ningún asunto */
    var asuntos = { pasados: 0, saltados: [] };
    try {
      asuntos = await unirAsuntos(desaparece, seQueda);
    } catch (e) {
      asuntos.error = e;   /* el tipo ya está unido: esto es accesorio */
    }
    return { gestor: gestor, asuntos: asuntos };
  }

  return { unir: unir };
})();
window.TiposUnir = TiposUnir;

/* ============================================================
   El botón y el cuadro, en Ajustes › pantalla de un tipo (js/ajustes-
   tipo.js llama aquí). Un solo U.preguntar (regla del proyecto: nunca
   un segundo cuadro encima), con el buscador de tipos y el resumen de
   la confirmación en el mismo cuadro: el resumen sale en cuanto se
   elige un tipo, y "Unir" solo se enciende entonces.
   ============================================================ */
App.unirTipoConOtro = async function (tipo) {
  var otros = (App.E.tipos || []).filter(function (t) { return t !== tipo; })
    .sort(function (a, b) { return a.tipo < b.tipo ? -1 : (a.tipo > b.tipo ? 1 : 0); });
  if (!otros.length) { U.aviso('No hay otro tipo con el que unir «' + tipo.tipo + '».', 'ambar'); return; }

  var afectados = (App.E.listaAbiertos || []).filter(function (a) { return App.tipoDeAsunto(a) === tipo.tipo; }).length;
  var elegido = null;

  var botones = otros.map(function (t, i) {
    return '<button type="button" class="tipo-boton" data-i="' + i + '">' + U.escapar(t.tipo) + '</button>';
  }).join('');

  var promesa = U.preguntar('Unir con otro tipo',
    '<p class="explica">«' + U.escapar(tipo.tipo) + '» desaparece y todo pasa al tipo que elijas aquí abajo.</p>' +
    '<label class="etiqueta">Tipo con el que se queda</label>' +
    '<input id="unir-buscar-tipo" type="search" class="campo" placeholder="Buscar tipo: escribe unas letras">' +
    '<div id="unir-tipos-lista" class="tipos">' + botones + '</div>' +
    '<div id="unir-tipos-vacio" class="nota oculto">Ningún tipo se llama así.</div>' +
    '<p class="nota" id="unir-resumen"></p>', 'Unir');

  var aceptar = document.getElementById('cuadro-aceptar');
  if (aceptar) aceptar.disabled = true;
  var lista = document.getElementById('unir-tipos-lista');
  var buscar = document.getElementById('unir-buscar-tipo');
  var resumen = document.getElementById('unir-resumen');

  function pintarResumen() {
    if (!resumen) return;
    if (!elegido) { resumen.textContent = ''; return; }
    resumen.innerHTML = '«' + U.escapar(tipo.tipo) + '» desaparece y todo pasa a «' + U.escapar(elegido.tipo) + '». ' +
      'Se van a pasar ' + afectados + (afectados === 1 ? ' asunto abierto' : ' asuntos abiertos') +
      ' (su carpeta cambia de nombre). La guía que vale desde ahora es la de «' + U.escapar(elegido.tipo) +
      '». El ARCHIVO no se toca.';
  }

  if (lista) {
    Array.prototype.forEach.call(lista.querySelectorAll('.tipo-boton'), function (b) {
      b.onclick = function () {
        elegido = otros[parseInt(b.dataset.i, 10)];
        Array.prototype.forEach.call(lista.querySelectorAll('.tipo-boton'), function (x) {
          x.classList.toggle('elegido', x === b);
        });
        if (aceptar) aceptar.disabled = false;
        pintarResumen();
      };
    });
  }
  if (buscar && lista) {
    buscar.oninput = function () {
      var q = U.normalizar(buscar.value);
      var vistos = 0;
      Array.prototype.forEach.call(lista.querySelectorAll('.tipo-boton'), function (b) {
        var cabe = !q || U.normalizar(b.textContent).indexOf(q) !== -1;
        b.classList.toggle('oculto', !cabe);
        if (cabe) vistos++;
      });
      var vacio = document.getElementById('unir-tipos-vacio');
      if (vacio) vacio.classList.toggle('oculto', vistos > 0);
    };
  }

  var ok = await promesa;
  if (!ok || !elegido) return;

  var resultado;
  try {
    resultado = await TiposUnir.unir(tipo, elegido);
  } catch (e) {
    U.fallo('No se han podido unir', e);
    return;
  }

  await App.verAbiertos();
  App.cerrarTipoDeAsunto();
  App.pintarAjustes();

  var pasados = resultado.asuntos.pasados, saltados = resultado.asuntos.saltados || [];
  var base = 'Unidos. ' + pasados + (pasados === 1 ? ' asunto abierto pasado a «' : ' asuntos abiertos pasados a «') +
    elegido.tipo + '».';
  if (saltados.length) {
    U.aviso(base + ' ' + saltados.length + (saltados.length === 1 ? ' no se ha podido cambiar: ' : ' no se han podido cambiar: ') +
      saltados.join('; '), 'ambar');
  } else {
    U.aviso(base, 'bueno');
  }
  if (resultado.asuntos.error) {
    U.accesorio('El tipo ya está unido, pero no he podido terminar de pasar sus asuntos abiertos', resultado.asuntos.error);
  }
};
