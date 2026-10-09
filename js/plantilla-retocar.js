/* ============================================================
   plantilla-retocar.js — «Retocar» una plantilla de Word (fila 322,
   docs/RETOCAR-UNA-PLANTILLA.md): la lógica, sin pantalla.

   Se parte siempre de los bytes del .docx original y de una lista de
   cambios (cambiar un trozo por un dato o por otro texto, quitar un trozo,
   quitar un párrafo entero). Cada vez se aplican TODOS desde el original
   con js/docx-sustituir.js: deshacer un cambio es volver a aplicar los que
   quedan. Al guardar se escribe un fichero nuevo en `_GESTOR/PLANTILLAS`
   (el de antes no se borra) y la plantilla pasa a apuntar a él, con
   «Deshacer» (js/plantillas-fichero.js).
   ============================================================ */
var PlantillaRetocar = (function () {

  function plano(t) { return DocxSustituir.normalizar(String(t || '').replace(/\s+/g, ' ').trim()); }
  function porLargo(a, b) { return b.buscar.length - a.buscar.length; }

  /* Lo que enseña una línea de la lista: { antes, despues }. `despues` vacío en «Quitar el párrafo». */
  function descripcion(l) {
    if (l.tipo === 'parrafo') return { antes: 'Quitar el párrafo: «' + l.resumen + '»', despues: '' };
    if (l.tipo === 'quitar') return { antes: l.buscar, despues: 'se quita' };
    if (l.tipo === 'cadavez') return { antes: l.buscar, despues: 'Se pregunta cada vez: ' + l.nombreDato };
    return { antes: l.buscar, despues: l.poner };
  }

  /* El principio de un párrafo, para la línea de la lista. */
  function principio(texto) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40).replace(/\s+\S*$/, '') + '…' : t;
  }

  /* Qué párrafo del Word original es el que se ve en la posición `posicion` de la pantalla.
     `textosDom`: el texto de cada párrafo pintado; `textosTrabajo`: el de cada párrafo del Word de trabajo;
     `sobrevivientes`: el índice original de cada uno de estos. Devuelve el índice original, o null si no se puede
     saber con seguridad cuál es. */
  function parrafoOriginal(textosDom, posicion, textosTrabajo, sobrevivientes) {
    var D = textosDom.map(plano), W = textosTrabajo.map(plano), t = D[posicion];
    if (!t || W.length !== sobrevivientes.length) return null;
    var k = -1;
    if (D.length === W.length && W[posicion] === t) k = posicion;
    else {
      var cand = [];
      W.forEach(function (w, i) { if (w === t) cand.push(i); });
      if (cand.length === 1) k = cand[0];
    }
    if (k === -1) return null;
    return sobrevivientes[k];
  }

  /* Una sesión de retoque sobre los bytes de un .docx. */
  function nueva(buffer) {
    var original = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var s = { lineas: [], trabajo: null, cuenta: 0 };

    function opciones() {
      var cambios = s.lineas.filter(function (l) { return l.tipo !== 'parrafo'; })
        .map(function (l) { return { id: l.id, buscar: l.buscar, poner: l.poner }; }).sort(porLargo);
      return {
        cambios: cambios, sobrevivientes: [],
        quitarParrafos: s.lineas.filter(function (l) { return l.tipo === 'parrafo'; }).map(function (l) { return l.indice; })
      };
    }

    /* El Word con todos los cambios, desde el original. */
    s.aplicar = async function () {
      var op = opciones();
      var r = await DocxSustituir.aplicar(original, op);
      r.sobrevivientes = op.sobrevivientes;
      r.textos = (await DocxSustituir.leerParrafos(r.bytes)).cuerpo;
      s.trabajo = r;
      return r;
    };

    s.veces = function (l) { return l.tipo === 'parrafo' ? 1 : ((s.trabajo && s.trabajo.veces[l.id]) || 0); };
    s.tocado = function () { return s.lineas.length > 0; };

    /* Añade un cambio: { tipo: 'texto'|'dato'|'cadavez'|'quitar', buscar, poner, nombreDato? } o
       { tipo: 'parrafo', indice, resumen }. Devuelve { linea } o { aviso } si no se puede. */
    s.anadir = async function (m) {
      s.cuenta++;
      var linea = Object.assign({ id: 'ret' + s.cuenta }, m);
      if (linea.tipo === 'parrafo') {
        if (s.lineas.some(function (l) { return l.tipo === 'parrafo' && l.indice === linea.indice; })) return { aviso: 'Ese párrafo ya está quitado.' };
        s.lineas.push(linea);
        await s.aplicar();
        return { linea: linea };
      }
      s.lineas.push(linea);
      await s.aplicar();
      if (s.veces(linea)) return { linea: linea };
      /* No está en el Word original: ¿es un trozo de algo que ya has cambiado? Entonces se corrige ese cambio. */
      s.lineas.pop();
      var previa = s.lineas.filter(function (l) { return l.tipo !== 'parrafo' && l.tipo !== 'cadavez' && l.poner && plano(l.poner).indexOf(plano(linea.buscar)) !== -1; });
      if (previa.length === 1) {
        var p = previa[0], i = plano(p.poner).indexOf(plano(linea.buscar));
        p.poner = p.poner.slice(0, i) + linea.poner + p.poner.slice(i + linea.buscar.length);
        p.tipo = 'texto';
        await s.aplicar();
        return { linea: p, corregida: true };
      }
      await s.aplicar();
      return { aviso: 'No encuentro ese trozo en el Word original. Puede que ya lo hayas cambiado: quita ese cambio de la lista y vuelve a probar.' };
    };

    s.quitar = async function (id) {
      s.lineas = s.lineas.filter(function (l) { return l.id !== id; });
      return s.aplicar();
    };

    s.parrafoOriginal = function (textosDom, posicion) {
      if (!s.trabajo) return null;
      return parrafoOriginal(textosDom, posicion, s.trabajo.textos, s.trabajo.sobrevivientes);
    };

    s.original = original;
    return s;
  }

  /* Guarda el Word retocado como fichero nuevo y apunta la plantilla `p` a él. `alTerminar()` repinta lo de fuera.
     Devuelve true si se ha guardado. Si algo falla, avisa y no cambia nada. */
  async function guardar(p, sesion, alTerminar) {
    var r;
    try {
      r = await sesion.aplicar();
      var c = await PlantillasFichero.comprobarWord(r.blob);
      if (!c.ok) { U.aviso('No he podido preparar el Word retocado: ' + c.motivo + '. No se ha guardado nada.', 'malo'); return false; }
    } catch (e) { U.aviso('No he podido preparar el Word retocado: ' + U.mensajeDeError(e) + '. No se ha guardado nada.', 'malo'); return false; }
    var datos = await Plantillas.cargar(App.E.gestor);
    var alcance = await PlantillasFichero.preguntarAlcance(PlantillasFichero.otrasConElMismoFichero(datos, p), 'Retocar la plantilla');
    if (!alcance) return false;
    var nombre;
    try {
      nombre = await PlantillasFichero.guardarBytes(r.bytes, PlantillasFichero.baseDe(p.fichero).replace(/ \(\d+\)$/, ''));
    } catch (e) { U.aviso('No he podido guardar el Word: ' + U.mensajeDeError(e), 'malo'); return false; }
    return PlantillasFichero.apuntarAlNuevo(p, nombre, alcance, alTerminar,
      { hecho: 'Plantilla retocada.', devuelto: 'Plantilla devuelta a como estaba.' });
  }

  return { nueva: nueva, guardar: guardar, descripcion: descripcion, principio: principio, parrafoOriginal: parrafoOriginal };
})();
window.PlantillaRetocar = PlantillaRetocar;
