/* ============================================================
   campo-desde-el-asunto-escribir.js — lo que se escribe al añadir un campo
   a un asunto o a un tipo (fila 530: trozo de js/campo-desde-el-asunto.js,
   que se pasaba de 400 líneas; mismo código, solo cambia de fichero).
   Se carga antes de js/campo-desde-el-asunto.js.

   anadirAlTipo(tipo, entrada)          el campo entra en `porTipo` (con «Deshacer»)
   quitarHitoEnElTipo(tipo, clave)      a un campo del tipo se le quita la marca de hito
   escribirEnAsunto(a, clave, o)        una escritura de la ficha del asunto
   ============================================================ */
window.CampoDesdeElAsuntoEscribir = (function () {

  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  /* El campo entra en la configuración del tipo (al final, sin
     «Obligatorio» ni «Añadir al nombre»). Si ya estaba y ahora se le pone hito
     (fila 255), se le pone la marca, sin duplicarlo. Devuelve cómo estaba la
     lista del tipo antes y cómo queda, para «Deshacer». */
  function anadirAlTipo(tipo, entrada) {
    var clave = Campos.claveDeCampo(entrada);
    var res = null;
    return App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = (actual.porTipo && actual.porTipo[tipo]) || [];
      var antes = copia(lista);
      var i = -1;
      lista.forEach(function (c, k) { if (Campos.claveDeCampo(c) === clave) i = k; });
      var nueva;
      if (i === -1) nueva = lista.concat([entrada]);
      else if (entrada.hito && !lista[i].hito) {
        nueva = lista.map(function (c, k) { return k === i ? Object.assign({}, c, { hito: entrada.hito, obligatorio: false }) : c; });
      } else if (entrada.sinPedirAlCrear && !lista[i].hito && !lista[i].sinPedirAlCrear) {
        /* Fila 530: «en la parte general, sin pedirlo al crear». */
        nueva = lista.map(function (c, k) { return k === i ? Object.assign({}, c, { sinPedirAlCrear: true, obligatorio: false }) : c; });
      } else { res = { antes: antes, despues: antes }; return actual; }
      var config = await Campos.guardarConfigDeTipo(App.E.gestor, tipo, nueva);
      res = { antes: antes, despues: copia((config.porTipo && config.porTipo[tipo]) || []) };
      return config;
    }).then(function (config) { App.E.campos = config; return res; });
  }

  /* Fila 255: a un campo del tipo se le quita la marca de hito (pasa a ser del asunto). */
  function quitarHitoEnElTipo(tipo, clave) {
    return App.enFila('campos.json', async function () {
      var actual = await Campos.leer(App.E.gestor);
      var lista = ((actual.porTipo && actual.porTipo[tipo]) || []).map(function (c) {
        if (Campos.claveDeCampo(c) !== clave) return c;
        var n = Object.assign({}, c); delete n.hito; return n;
      });
      return Campos.guardarConfigDeTipo(App.E.gestor, tipo, lista);
    }).then(function (config) { App.E.campos = config; });
  }

  /* Una sola escritura de la ficha del asunto, releída del disco justo
     antes. `o`: valor (si no viene, se deja el que tenía), anadir (una
     entrada para `camposPropiosDelAsunto`), quitar (true: sale de la lista
     «solo aquí»; con `borrarValor`, también su valor). */
  function escribirEnAsunto(a, clave, o) {
    return App.guardarRegistroFresco(async function (registro) {
      await App.comprobarNoCerrado(a.nombre);
      var ficha = registro.asuntos[a.nombre] || (registro.asuntos[a.nombre] = {});
      var campos = (ficha.campos && !Array.isArray(ficha.campos)) ? Object.assign({}, ficha.campos) : {};
      if (o.borrarValor) delete campos[clave];
      else if (o.valor !== undefined) campos[clave] = { valor: o.valor, enNombre: false };
      ficha.campos = campos;
      /* Fila 255: guardar solo un valor no toca la lista de «solo aquí». */
      if (o.anadir || o.quitar) {
        var lista = (ficha.camposPropiosDelAsunto || []).filter(function (c) { return Campos.claveDeCampo(c) !== clave; });
        if (o.anadir) lista.push(o.anadir);
        if (lista.length) ficha.camposPropiosDelAsunto = lista; else delete ficha.camposPropiosDelAsunto;
      }
    });
  }

  return { anadirAlTipo: anadirAlTipo, quitarHitoEnElTipo: quitarHitoEnElTipo, escribirEnAsunto: escribirEnAsunto, copia: copia };
})();
