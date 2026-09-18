/* ============================================================
   contexto-documentos.js — las tres listas de terceros y los tipos
   con los que LectorDocumentos.analizar coteja un documento.

   Antes vivía solo dentro de js/documentos-sueltos-lector.js (17-sep-
   2026, fila 41). La fila 49 (18-sep-2026,
   docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md) necesita exactamente lo
   mismo para leer los adjuntos de un correo de la bandeja, así que se
   saca aquí para no escribirlo dos veces. Nada cambia de cómo
   funcionaba antes: mismo Datos.cargar (con su propia caché), mismo
   window.Dni para el DNI del alumnado.
   ============================================================ */
var ContextoDocumentos = (function () {

  /* El DNI del alumnado no vive en un campo propio (js/dni.js lo saca
     de las columnas del CSV): se cotejan los dos, DNI y Nº de
     identificación escolar, por si el documento trae uno solo de los
     dos. Las dos entradas apuntan a la misma `persona`: si las dos
     coinciden a la vez, LectorDocumentos.analizar las cuenta como un
     único tercero (agrupa por nombre), no como dos. */
  function entradasDeAlumno(p) {
    var dni = (window.Dni && Dni.de(p)) || '';
    var escolar = p.id || '';
    var entradas = [{ nombre: p.nombre, documento: dni || escolar, persona: p }];
    if (dni && escolar && dni !== escolar) entradas.push({ nombre: p.nombre, documento: escolar, persona: p });
    return entradas;
  }

  async function delCentro() {
    var alumnado = [], personal = [], empresas = [];
    try {
      var a = await Datos.cargar(App.E.datos, 'ALUMNADO');
      a.lista.forEach(function (p) { alumnado = alumnado.concat(entradasDeAlumno(p)); });
    } catch (e) { /* sin RegAlum.csv, se sigue sin alumnado */ }
    try {
      var pe = await Datos.cargar(App.E.datos, 'PERSONAL');
      personal = pe.lista.map(function (p) { return { nombre: p.nombre, documento: p.documento, persona: p }; });
    } catch (e) { /* sin personal.csv, se sigue sin personal */ }
    try {
      var em = await Datos.cargar(App.E.datos, 'EMPRESAS');
      empresas = em.lista.map(function (p) { return { nombre: p.nombre, documento: p.nif, persona: p }; });
    } catch (e) { /* sin empresas.csv, se sigue sin empresas */ }
    return { tipos: App.E.tipos, alumnado: alumnado, personal: personal, empresas: empresas };
  }

  return { delCentro: delCentro };
})();
