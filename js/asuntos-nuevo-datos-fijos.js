/* ============================================================
   asuntos-nuevo-datos-fijos.js — «Nuevo asunto»: los cinco datos de siempre
   del asunto, solo en los tipos que los piden (fila 629,
   docs/629-NUEVO-ASUNTO-MAS-SIMPLE.md).

   Año académico, descripción corta, fecha límite, quién lo pide y por qué
   vía ya no son fijos del formulario: cada tipo elige cuáles pide al crear
   (`campos.json` → `datosAlCrear`, se marca en Ajustes → el tipo → Campos).
   Salen en el recuadro «Datos del asunto», junto a los campos propios del
   tipo. El día del cambio ningún tipo pide ninguno.

   Los controles de siempre (`#campo-curso`, `#campo-descripcion`,
   `#campo-limite`, `#lopide-caja-nuevo`) siguen en el formulario aunque no se
   enseñen, y lo que valgan por sí solos se guarda igualmente: el curso en
   marcha (`App.actualizarCursoNuevo`), la fecha límite que sale del plazo de
   la guía (`App.actualizarLimiteNuevo`) y lo que traiga quien llama a
   `App.nuevoAsuntoCon` (la descripción de una nota, el «quién lo pide» de un
   encargo). Se leen igual al crear (js/asuntos-nuevo-crear.js).
   ============================================================ */

/* Qué datos de siempre pide el tipo elegido (lista de claves; vacía sin tipo). */
App.datosFijosQuePide = function () {
  var tipo = App.E.nuevo.tipo;
  if (!tipo || !window.Campos) return [];
  return Campos.datosAlCrearDe(App.E.campos, tipo);
};

/* Enseña solo los datos de siempre que pide el tipo, y el recuadro «Datos del asunto» solo cuando hay
   tipo y tercero y algo que enseñar (un dato de siempre o un campo del tipo). */
App.pintarDatosFijosNuevo = function () {
  var pide = App.datosFijosQuePide();
  var hayTipoYTercero = !!(App.E.nuevo.tipo && App.E.nuevo.tercero);
  var ensenar = hayTipoYTercero ? pide : [];

  $('dato-nuevo-curso').classList.toggle('oculto', ensenar.indexOf('curso') === -1);
  $('dato-nuevo-descripcion').classList.toggle('oculto', ensenar.indexOf('descripcion') === -1);
  $('dato-nuevo-limite').classList.toggle('oculto', ensenar.indexOf('limite') === -1);
  var sinQuien = ensenar.indexOf('lopide') === -1, sinVia = ensenar.indexOf('via') === -1;
  $('grupo-lopide').classList.toggle('oculto', sinQuien && sinVia);
  $('lopide-caja-nuevo').classList.toggle('sin-quien', sinQuien);
  $('lopide-caja-nuevo').classList.toggle('sin-via', sinVia);

  var hayCampos = (App.E.nuevo.configCampos || []).length > 0;
  $('bloque-campos').classList.toggle('oculto', !(hayTipoYTercero && (ensenar.length || hayCampos)));
};
