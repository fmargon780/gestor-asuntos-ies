/* ============================================================
   tipos-nombre.js — un tipo que cambia de nombre se lleva todo lo suyo
   (24-sep-2026, fila 126, docs/TIPO-QUE-CAMBIA-DE-NOMBRE.md).

   Lo que en `_GESTOR` va guardado por el NOMBRE del tipo: la guía
   (`guias.json`, clave = nombre), sus campos (`campos.json` → `porTipo`),
   las plantillas de correo y de documento (`plantillas.json`, `p.tipo`) y
   los recurrentes (`recurrentes.json`, `r.tipo`). Los formularios, las
   palabras clave, el plazo y el estado de partida van dentro del propio
   tipo en `tipos.json` y viajan solos. Los hitos casan con la guía por el
   `id` de cada paso (`origenGuia`), que no cambia.

   - `mover(viejo, nuevo)`: lo pasa todo de un nombre a otro. Si el nuevo
     ya tiene guía o campos: vacío, se sustituye; con contenido, se queda
     el que más tenga y el otro va a la papelera (nunca se borra sin más).
     Lo usan `App.renombrarTipo` (aquí abajo, antes en js/ajustes.js) y
     «Cargar la biblioteca del centro» (js/cargar-biblioteca.js,
     `fusionarTipos`), que renombra un tipo al nombre largo.
   - `arreglar()`: una vez al entrar, junta con su tipo lo que se quedó
     guardado bajo su nombre corto o un alias (el caso real: la guía de
     DESEMPEÑO FUNCIÓN TUTORIAL tras la fila 123), y quita las plantillas
     de documento repetidas (mismo nombre y fichero).
   - `nombresDe(tipo)`: el nombre, el corto y los alias de un tipo,
     normalizados, para casar plantillas (js/plantillas.js).

   Cada fichero pasa por su cola (`App.enFila`) y se relee antes de
   escribir. No envuelve nada.
   ============================================================ */
var TiposNombre = (function () {

  function n(t) { return U.normalizar(String(t || '')).trim(); }

  function tipoPorNombre(nombre) {
    var k = n(nombre);
    return (App.E.tipos || []).filter(function (t) {
      return n(t.tipo) === k || (t.nombreCorto && n(t.nombreCorto) === k) ||
        (t.alias || []).some(function (x) { return n(x) === k; });
    })[0] || null;
  }

  /* Todos los nombres del tipo que se llame (o se llamó) así. */
  function nombresDe(nombre) {
    var t = tipoPorNombre(nombre);
    var lista = t ? [t.tipo, t.nombreCorto].concat(t.alias || []) : [nombre];
    var salida = [];
    lista.forEach(function (x) { if (x && salida.indexOf(n(x)) === -1) salida.push(n(x)); });
    if (salida.indexOf(n(nombre)) === -1) salida.push(n(nombre));
    return salida;
  }

  function cuentaPasos(pasos) { return (pasos || []).length; }

  /* ---------- mover ---------- */

  async function moverGuia(viejo, nuevo, r) {
    var g = App.E.gestor;
    var guias = null;
    try { guias = await Carpetas.leerJson(g, 'guias.json'); } catch (e) { guias = null; }
    guias = (guias && typeof guias === 'object') ? guias : {};
    var origen = guias[viejo] || [];
    if (!origen.length) { if (guias[viejo]) await GuiasDelCentro.guardarPasos(viejo, []); return; }
    var destino = guias[nuevo] || [];
    var queda = origen;
    /* Fila 129: la guía mínima sin tocar (js/estado-hito.js) no compite:
       se queda la de verdad, sin mandar nada a la papelera. */
    if (window.EstadoHito && EstadoHito.esGuiaMinima(destino)) destino = [];
    if (destino.length) {
      var sobra = cuentaPasos(destino) >= cuentaPasos(origen) ? origen : destino;
      queda = sobra === origen ? destino : origen;
      if (window.Papelera) {
        await Papelera.mandarDato('guia', sobra === origen ? viejo : nuevo, null,
          { tipo: sobra === origen ? viejo : nuevo, pasos: sobra });
      }
      r.papelera++;
    }
    /* Los `id` de los pasos se conservan tal cual: los hitos casan por ellos. */
    if (queda !== destino) await GuiasDelCentro.guardarPasos(nuevo, queda);
    await GuiasDelCentro.guardarPasos(viejo, []);
    r.guia = true;
  }

  async function moverCampos(viejo, nuevo, r) {
    var g = App.E.gestor;
    var actual = await Campos.leer(g);
    var origen = (actual.porTipo || {})[viejo] || [];
    if (!origen.length) return;
    var destino = (actual.porTipo || {})[nuevo] || [];
    var queda = origen;
    if (destino.length) {
      var sobraOrigen = destino.length >= origen.length;
      queda = sobraOrigen ? destino : origen;
      if (window.Papelera) {
        await Papelera.mandarDato('campos-de-tipo', sobraOrigen ? viejo : nuevo, null,
          { tipo: sobraOrigen ? viejo : nuevo, campos: sobraOrigen ? origen : destino });
      }
      r.papelera++;
    }
    if (queda !== destino) await Campos.guardarConfigDeTipo(g, nuevo, queda);
    App.E.campos = await Campos.guardarConfigDeTipo(g, viejo, []);
    r.campos = true;
  }

  async function moverPlantillas(viejo, nuevo, r) {
    var k = n(viejo);
    var datos = await Plantillas.cargar(App.E.gestor);
    var hay = (datos.lista || []).concat(datos.documentos || []).some(function (p) { return n(p.tipo) === k; });
    if (!hay) return;
    await Plantillas.guardar(App.E.gestor, function (a) {
      (a.lista || []).concat(a.documentos || []).forEach(function (p) {
        if (n(p.tipo) === k) { p.tipo = nuevo; r.plantillas++; }
      });
      return a;
    });
  }

  async function moverRecurrentes(viejo, nuevo, r) {
    var g = App.E.gestor;
    var lista = null;
    try { lista = await Carpetas.leerJson(g, 'recurrentes.json'); } catch (e) { lista = null; }
    if (!Array.isArray(lista)) return;
    var cambiados = 0;
    lista.forEach(function (x) { if (x && x.tipo === viejo) { x.tipo = nuevo; cambiados++; } });
    if (!cambiados) return;
    await Copias.guardar(g, 'recurrentes.json', lista);
    r.recurrentes += cambiados;
    if (window.Recurrentes && Recurrentes._cargar) { try { await Recurrentes._cargar(); } catch (e) { /* se relee al volver */ } }
  }

  function vacio() { return { guia: false, campos: false, plantillas: 0, recurrentes: 0, papelera: 0 }; }

  async function mover(viejo, nuevo) {
    var r = vacio();
    if (!viejo || !nuevo || viejo === nuevo || !App.E.gestor) return r;
    /* Cada parte, solo si su módulo está cargado. */
    if (window.GuiasDelCentro) await App.enFila('guias.json', function () { return moverGuia(viejo, nuevo, r); });
    if (window.Campos) await App.enFila('campos.json', function () { return moverCampos(viejo, nuevo, r); });
    if (window.Plantillas) await App.enFila('plantillas.json', function () { return moverPlantillas(viejo, nuevo, r); });
    await App.enFila('recurrentes.json', function () { return moverRecurrentes(viejo, nuevo, r); });
    /* Fila 141: los tipos que, al repartir un PDF, crean asuntos de este. */
    var apuntan = (App.E.tipos || []).filter(function (t) { return t.repartirTipo === viejo; });
    if (apuntan.length) {
      apuntan.forEach(function (t) { t.repartirTipo = nuevo; });
      try { await App.enFila(App.FICHERO_TIPOS, function () { return App.guardarTipos(); }); } catch (e) { /* se guarda con el nombre */ }
    }
    return r;
  }

  function hayAlgo(r) { return r && (r.guia || r.campos || r.plantillas || r.recurrentes); }

  function textoDe(r) {
    var partes = [];
    if (r.guia) partes.push('la guía');
    if (r.campos) partes.push('los campos');
    if (r.plantillas) partes.push(r.plantillas === 1 ? '1 plantilla' : r.plantillas + ' plantillas');
    if (r.recurrentes) partes.push(r.recurrentes === 1 ? '1 recurrente' : r.recurrentes + ' recurrentes');
    if (!partes.length) return '';
    var t = partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0];
    return 'Se ha llevado ' + t + '.';
  }

  /* ---------- plantillas de documento repetidas ---------- */

  /* Pura: los grupos de repetidas (mismo nombre y fichero), cada uno con
     la que se queda (la unida a algún paso; si no, la primera). */
  function repetidas(documentos, idsUnidos) {
    var grupos = {};
    (documentos || []).forEach(function (d) {
      if (!d.fichero) return;
      var k = n(d.nombre) + '|' + d.fichero;
      (grupos[k] = grupos[k] || []).push(d);
    });
    return Object.keys(grupos).map(function (k) { return grupos[k]; })
      .filter(function (g) { return g.length > 1; })
      .map(function (g) {
        var queda = g.filter(function (d) { return idsUnidos[d.id]; })[0] || g[0];
        return { queda: queda, sobran: g.filter(function (d) { return d !== queda; }) };
      });
  }

  function idsUnidosEnGuias(guias) {
    var ids = {};
    (function recorrer(pasos) {
      (pasos || []).forEach(function (p) {
        (p.plantillasDocumento || []).forEach(function (id) { ids[id] = true; });
        (p.opciones || []).forEach(function (o) { recorrer(o.pasos); });
      });
    })(Object.keys(guias || {}).reduce(function (a, k) { return a.concat(guias[k] || []); }, []));
    return ids;
  }

  async function quitarRepetidas() {
    var g = App.E.gestor;
    var guias = null;
    try { guias = await Carpetas.leerJson(g, 'guias.json'); } catch (e) { guias = null; }
    var datos = await Plantillas.cargar(g);
    var grupos = repetidas(datos.documentos, idsUnidosEnGuias(guias));
    if (!grupos.length) return 0;
    var fuera = {};
    for (var i = 0; i < grupos.length; i++) {
      for (var j = 0; j < grupos[i].sobran.length; j++) {
        var d = grupos[i].sobran[j];
        fuera[d.id] = true;
        if (window.Papelera) await Papelera.mandarDato('plantilla-documento', d.nombre, null, { plantilla: d });
      }
    }
    await App.enFila('plantillas.json', function () {
      return Plantillas.guardar(g, function (a) {
        a.documentos = (a.documentos || []).filter(function (d) { return !fuera[d.id]; });
        return a;
      });
    });
    return Object.keys(fuera).length;
  }

  /* ---------- arreglo al entrar ---------- */

  async function arreglar() {
    if (!App.E.gestor || !(App.E.tipos || []).length) return { juntados: [], repetidas: 0 };
    var guias = null, campos = null, recurrentes = null;
    try { guias = await Carpetas.leerJson(App.E.gestor, 'guias.json'); } catch (e) { guias = null; }
    try { campos = await Campos.leer(App.E.gestor); } catch (e) { campos = null; }
    try { recurrentes = await Carpetas.leerJson(App.E.gestor, 'recurrentes.json'); } catch (e) { recurrentes = null; }
    guias = guias || {};
    var porTipo = (campos && campos.porTipo) || {};
    var nombresReales = {};
    App.E.tipos.forEach(function (t) { nombresReales[t.tipo] = true; });
    var juntados = [];
    for (var i = 0; i < App.E.tipos.length; i++) {
      var t = App.E.tipos[i];
      var otros = [t.nombreCorto].concat(t.alias || []).filter(function (x, k, arr) {
        return x && x !== t.tipo && !nombresReales[x] && arr.indexOf(x) === k;
      });
      for (var j = 0; j < otros.length; j++) {
        var viejo = otros[j];
        var tiene = (guias[viejo] || []).length || (porTipo[viejo] || []).length ||
          (Array.isArray(recurrentes) && recurrentes.some(function (x) { return x && x.tipo === viejo; }));
        if (!tiene) continue;
        var r = await mover(viejo, t.tipo);
        if (hayAlgo(r)) juntados.push(t.tipo);
      }
    }
    var quitadas = await quitarRepetidas();
    return { juntados: juntados, repetidas: quitadas };
  }

  (function () {
    var hecho = false;
    function enganchar() {
      if (!window.Gestor) return;
      window.Gestor.alRefrescar.push(function () {
        if (hecho || !window.Gestor.carpetaGestor() || !(App.E.tipos || []).length || !window.GuiasDelCentro) return;
        hecho = true;
        arreglar().then(function (r) {
          if (r.juntados.length) {
            U.aviso('He juntado con su tipo la guía de «' + r.juntados.join('», «') + '».', 'bueno');
          }
          if (r.repetidas) {
            U.aviso('He quitado ' + (r.repetidas === 1 ? 'una plantilla repetida' : r.repetidas + ' plantillas repetidas') +
              ' (están en la papelera).', 'bueno');
          }
        }, function (e) { U.accesorio('No he podido juntar la guía de un tipo con su nombre nuevo', e); });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enganchar);
    else enganchar();
  })();

  return {
    mover: mover, arreglar: arreglar, nombresDe: nombresDe, tipoPorNombre: tipoPorNombre,
    hayAlgo: hayAlgo, textoDe: textoDe, repetidas: repetidas, quitarRepetidas: quitarRepetidas
  };
})();
window.TiposNombre = TiposNombre;

/* ---------- cambiarle el nombre a un tipo de asunto ----------

   Los asuntos ABIERTOS se renombran: son pocos y es el trabajo vivo.

   El ARCHIVO no se toca. Renombrar allí obligaría a copiar y borrar
   carpeta por carpeta, con Dropbox resincronizando de fondo, y el
   nombre de una carpeta archivada es el rastro de lo que se hizo aquel
   día. En su lugar, el nombre viejo se guarda como alias del tipo: las
   carpetas antiguas se siguen reconociendo y se enseñan con el nombre
   nuevo, sin mover un solo fichero. */
App.renombrarTipo = async function (tipo) {
  var ok = await U.preguntar('Cambiar el nombre del tipo',
    '<label class="etiqueta">Nombre nuevo</label>' +
    '<input id="tipo-nuevo-nombre" class="campo" value="' + U.escapar(tipo.tipo) + '">' +
    '<p class="nota">Se cambiará en los asuntos abiertos que lo usen. ' +
    'Las carpetas del archivo no se tocan: se seguirán llamando como se llaman, ' +
    'y el buscador las encontrará igual.</p>', 'Cambiar');
  if (!ok) return;

  var nombreNuevo = U.limpiarNombre($('tipo-nuevo-nombre').value).toUpperCase();
  if (!nombreNuevo || nombreNuevo === tipo.tipo) return;

  var repetido = App.E.tipos.some(function (t) {
    return t !== tipo && U.normalizar(t.tipo) === U.normalizar(nombreNuevo);
  });
  if (repetido) { U.aviso('Ya hay otro tipo con ese nombre.', 'malo'); return; }

  var nombreViejo = tipo.tipo;
  var afectadas = App.E.listaAbiertos.filter(function (a) {
    return a.leido.reconocido && a.leido.tipo === nombreViejo;
  });

  var cambiadas = 0, fallos = [];
  for (var i = 0; i < afectadas.length; i++) {
    var a = afectadas[i];
    var nombreCarpeta = a.nombre.replace(a.nombre.slice(7, 7 + nombreViejo.length), nombreNuevo);
    try {
      await Carpetas.renombrar(App.E.abiertos, a.nombre, nombreCarpeta);
      var ficha = App.E.registro.asuntos[a.nombre];
      if (ficha) {
        ficha.tipo = nombreNuevo;
        await App.anotar(nombreCarpeta, ficha);
      }
      cambiadas++;
    } catch (e) {
      fallos.push(a.nombre + ': ' + U.mensajeDeError(e));
    }
  }

  tipo.alias = tipo.alias || [];
  if (tipo.alias.indexOf(nombreViejo) === -1) tipo.alias.push(nombreViejo);
  tipo.tipo = nombreNuevo;

  /* 20-sep-2026, fila 79, apartado 9: sin esto, App.fusionarConDisco
     veía el nombre viejo como algo que el otro ordenador tiene de más
     y lo devolvía a la vida como tipo fantasma en cuanto alguien
     guardara cualquier otra cosa (mismo mecanismo de la fila 77). Se
     revive el nombre nuevo por si alguna vez se borró él mismo: si no,
     renombrar a un nombre que se borró en el pasado lo haría
     desaparecer al guardar. */
  await Borrados.marcar(App.E.gestor, 'tipos', nombreViejo);
  await Borrados.revivir(App.E.gestor, 'tipos', nombreNuevo);
  await App.guardarTipos();

  /* Fila 126: la guía, los campos, las plantillas y los recurrentes se
     van con el tipo. Lo principal (el nombre) ya está guardado: si esto
     falla, ámbar. */
  var llevado = null;
  try { llevado = await TiposNombre.mover(nombreViejo, nombreNuevo); }
  catch (e) { U.accesorio('Tipo renombrado, pero no he podido llevarle su guía, campos o plantillas', e); }

  await App.verAbiertos();
  App.pintarAjustes();
  if (App.E.tipoAjustesActual === tipo && typeof App.pintarTipoDeAsunto === 'function') {
    App.pintarTipoDeAsunto();
  }

  if (fallos.length) {
    U.aviso('Cambiadas ' + cambiadas + ' carpetas. ' + fallos.length + ' no se han podido.', 'malo');
  } else {
    U.aviso('Tipo renombrado. Carpetas abiertas cambiadas: ' + cambiadas + '.' +
      (llevado && TiposNombre.hayAlgo(llevado) ? ' ' + TiposNombre.textoDe(llevado) : ''), 'bueno');
  }
};

