/* ============================================================
   documento-renombrar.js — cambiar el nombre de un documento de la
   carpeta de un asunto, con todo lo que lo recuerda por su nombre
   (fila 265, docs/ARCHIVAR-MIDE-ANTES-LA-RUTA.md).

   Cambiar el nombre del fichero (`Carpetas.renombrarFichero`) no basta:
   la ficha del asunto apunta a veces al documento POR SU NOMBRE. Lo que
   se pone al día, en una búsqueda hecha en la fila 265 de quién guarda
   nombres de fichero:

     - `ficha.pendientesRegistro` (la lista de «pendiente de registro»);
     - en `hitos.json`, para cada hito del asunto: `documentos` (los
       documentos apuntados al hito), `requisitos[].documento` (la
       casilla de «lo que hay que reunir» que se marcó con él) y
       `guionHecho[id].documento` (lo mismo en el guion nuevo).

   Lo demás no guarda el nombre: los datos del documento (`DocumentosDatos`)
   van por su número `D26-01234`, que sale del propio nombre, así que un
   nombre nuevo tiene que conservarlo (lo exige `numeroDe`).

   Solo los documentos de la carpeta del asunto (no los de sus
   subcarpetas, como «Versiones previas») están apuntados en la ficha
   o en un hito: para los de una subcarpeta se pasa `soloFichero`.
   ============================================================ */
var DocumentoRenombrar = (function () {

  /* El número `D26-01234` que lleva el nombre, o ''. Un nombre nuevo no
     puede perderlo: los datos del documento en la ficha cuelgan de él. */
  function numeroDe(nombre) {
    return (window.Numeros && Numeros.delNombreDeDocumento) ? Numeros.delNombreDeDocumento(nombre) : '';
  }

  async function ponerAlDiaLaFicha(asunto, viejo, nuevo) {
    var lista = (App.E.registro.asuntos[asunto.nombre] || asunto.ficha || {}).pendientesRegistro || [];
    var esta = lista.some(function (p) { return App.IDENTIDAD_LISTA.pendientesRegistro(p) === viejo; });
    if (!esta) return;
    await App.anotarLista(asunto.nombre, 'pendientesRegistro', { quitar: [viejo], anadir: [nuevo] });
  }

  async function ponerAlDiaLosHitos(asunto, viejo, nuevo) {
    if (!window.Hitos || !Hitos.cambiar) return;
    await Hitos.cambiar(function (d) {
      var entrada = d.porAsunto && d.porAsunto[asunto.nombre];
      if (!entrada) return d;
      (entrada.hitos || []).forEach(function (h) {
        if (Array.isArray(h.documentos)) {
          var tenia = h.documentos.indexOf(viejo) !== -1;
          h.documentos = h.documentos.filter(function (x) { return x !== viejo; });
          if (tenia && h.documentos.indexOf(nuevo) === -1) h.documentos.push(nuevo);
        }
        (h.requisitos || []).forEach(function (r) { if (r.documento === viejo) r.documento = nuevo; });
        var guion = h.guionHecho || {};
        Object.keys(guion).forEach(function (id) { if (guion[id] && guion[id].documento === viejo) guion[id].documento = nuevo; });
      });
      return d;
    });
  }

  /* `asunto`: { nombre, handle, ficha }. `dir`: la carpeta donde está el
     fichero (la del asunto o una subcarpeta). `opciones.soloFichero`: no
     tocar ficha ni hitos (subcarpetas). Lanza si el cambio del fichero
     falla; si lo falla lo de después, el fichero ya tiene su nombre nuevo
     y se avisa en ámbar (como en `guardar` de js/documentos-guardar.js). */
  async function renombrar(asunto, dir, viejo, nuevo, opciones) {
    if (viejo === nuevo) return;
    await Carpetas.renombrarFichero(dir, viejo, nuevo);
    if (opciones && opciones.soloFichero) return;
    try { await ponerAlDiaLaFicha(asunto, viejo, nuevo); }
    catch (e) { U.accesorio('«' + nuevo + '» ya tiene su nombre nuevo, pero no he podido apuntar si está pendiente de registro', e); }
    try { await ponerAlDiaLosHitos(asunto, viejo, nuevo); }
    catch (e2) { U.accesorio('«' + nuevo + '» ya tiene su nombre nuevo, pero no he podido ponerlo al día en sus hitos', e2); }
  }

  return { renombrar: renombrar, numeroDe: numeroDe };
})();
window.DocumentoRenombrar = DocumentoRenombrar;
