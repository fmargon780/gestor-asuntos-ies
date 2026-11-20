/* ============================================================
   etiquetas-tutores.js — etiquetas para los tutores legales (fila 721, docs/721-ETIQUETAS-TUTORES-LEGALES.md).

   La pestaña «Tutores legales» de Etiquetas elige al alumnado como «Alumnado» y saca una etiqueta por familia,
   dirigida a sus tutores. Sin efectos y sin pintar:
   - valores(grupo, ctx) → los valores de la etiqueta de una familia (el grupo de hermanos de
     EtiquetasDatos.familias): los de la familia más `tutoresNombres` («Rocío Ponce Duarte y Joaquín Aguilar Reyes»),
     `tutoresDe` («Tutores de Marina y Pablo Aguilar Ponce»; con un solo tutor, «Tutor de …») y `_sinTutores`.
     Los tutores salen una sola vez aunque los compartan los hermanos (clave: documento y, si no hay, nombre), sean
     o no quienes tienen la custodia (fila 578).
   - valeCampo(campo, para) → si un dato de EtiquetasDatos.CAMPOS sirve a un diseño de esa clase.
   ============================================================ */
var EtiquetasTutores = (function () {

  function compacto(t) { return String(t || '').replace(/[^0-9a-z]/gi, '').toUpperCase(); }

  /* Los tutores de todo el grupo, sin repetir, en el orden de las personas del grupo. */
  function tutoresDe(grupo) {
    var vistos = {}, salida = [];
    grupo.forEach(function (p) {
      var lista = [];
      try { lista = Datos.tutoresDe(p) || []; } catch (e) { lista = []; }
      lista.forEach(function (t) {
        var nombre = String(t.nombre || '').replace(/\s+/g, ' ').trim();
        if (!nombre) return;
        var doc = compacto(t.documento), k = doc ? 'd:' + doc : 'n:' + U.normalizar(nombre);
        if (vistos[k]) return;
        vistos[k] = true;
        salida.push(nombre);
      });
    });
    return salida;
  }

  function unir(nombres) {
    if (nombres.length <= 1) return nombres.join('');
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  function valores(grupo, ctx) {
    var v = grupo.length > 1 ? EtiquetasDatos.valoresDeFamilia(grupo, 'alumnado', ctx) : EtiquetasDatos.valores(grupo[0], 'alumnado', ctx);
    var nombres = tutoresDe(grupo);
    v.tutoresNombres = unir(nombres);
    v.tutoresDe = (nombres.length === 1 ? 'Tutor de ' : 'Tutores de ') + EtiquetasDatos.textoFamilia(grupo).replace(/^Familia de /, '');
    v._sinTutores = !nombres.length;
    return v;
  }

  function valeCampo(c, para) {
    return para === 'ambos' || c.para === 'ambos' || c.para === para || (para === 'tutores' && !!c.tutores);
  }

  return { valores: valores, valeCampo: valeCampo, tutoresDe: tutoresDe };
})();
window.EtiquetasTutores = EtiquetasTutores;
