/* ============================================================
   guias-paso-tareas.js — convierte «Documentos de este paso» y
   «Comunicación de este paso» en tareas del guion del hito (27-sep-2026,
   fila 199, apartado 4 de docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md).

   Antes esas dos secciones vivían aparte del hito
   (`paso.plantillasDocumento`, `paso.comunicacion`); ahora, como pide el
   encargo, son más tareas del guion (js/guias-guion.js: `accion`
   'generar'/'comunicar' con su `receta`), el mismo sitio que ya lee la
   mesa del hito para generar un documento o comunicar
   (js/hito-mesa-recetas.js, fila 164): convertir no cambia lo que ve un
   asunto abierto, porque sigue siendo la MISMA guía, leída en vivo por
   `origenGuia` — las tareas nuevas funcionan ahí igual que las
   secciones de antes.

   IDEMPOTENTE a propósito: convertir SIEMPRE vacía el campo de origen
   (`plantillasDocumento` a `[]`, `comunicacion` a `null`, que
   `Guias.normalizarComunicacion` deja como los dos canales vacíos) en
   cuanto ha creado su tarea. Como el editor ya no vuelve a escribir en
   esos dos campos (las secciones desaparecen, ver js/guias-paso-bloques.js
   y js/guias-opciones-editor.js), abrir el editor una segunda vez no
   encuentra nada que convertir: no se duplica ninguna tarea. Además,
   por si algo dejara un campo a medio vaciar, `convertirPaso` también
   mira las tareas que ya haya en el guion antes de añadir una de
   documento, así que ni repetir la conversión sobre el mismo `paso` en
   memoria duplica nada.

   Se llama una vez, al abrir el cuadro de la guía entera
   (js/guias-editor.js, `editar()`, justo después de `G.normalizar(lista)`
   y antes del primer `pintar()`), sobre todos los pasos y subpasos, a
   cualquier profundidad de opciones. Convertir «Documentos» es puro
   (los `id` ya son de una plantilla que existe o existió); convertir
   «Comunicación» necesita crear una plantilla de correo/Séneca nueva
   cuando el paso no viniera ya de una (nunca era el caso: antes siempre
   era texto suelto), así que toda la función es asíncrona.
   ============================================================ */
var GuiasPasoTareas = (function () {

  function nuevoId() { return U.nuevoId('g'); }

  function tieneTexto(canal) { return !!(canal && canal.cuerpo && String(canal.cuerpo).trim()); }

  /* Las tareas de una acción que ya hay en el guion (nunca las de una
     pregunta: esas no son tareas sueltas). */
  function tareasDe(guion, accion) {
    return (guion || []).filter(function (g) { return !g.pregunta && g.accion === accion; });
  }

  /* Solo correo, solo Séneca, o los dos (VIAS admite '' = "Correo o
     Séneca") según qué canal tuviera texto. */
  function viaDe(c) {
    var correo = tieneTexto(c.correo), seneca = tieneTexto(c.seneca);
    if (correo && !seneca) return 'correo';
    if (seneca && !correo) return 'seneca';
    return '';
  }

  /* Una plantilla nueva en `plantillas.json` › `lista`, con el texto de
     comunicación del paso: una plantilla general sirve igual para
     correo y para Séneca (como ya hace el resto de la aplicación), así
     que si los dos canales tenían texto se prefiere el de correo para
     el cuerpo principal, y el de Séneca solo si es distinto
     (`textoSeneca`). Una plantilla general no tiene campo de "asunto"
     (lo escribe Francisco cada vez, como ya pasa con las demás), así
     que el asunto del paso no se conserva: es una pérdida pequeña y ya
     inherente al modelo de plantilla que usa el resto de la app, no
     algo nuevo de esta fila. Devuelve el `id` de la plantilla nueva, o
     '' si no se ha podido crear (sin gestor, o falla el guardado): no
     es crítico, `comunicacion` se queda sin vaciar y se reintenta la
     próxima vez que se abra el editor. */
  async function crearPlantillaDeComunicacion(c, nombreHito) {
    if (!window.Plantillas || !window.App || !App.E || !App.E.gestor) return '';
    var correo = c.correo || {}, seneca = c.seneca || {};
    var principal = tieneTexto(correo) ? correo : seneca;
    var fila = {
      id: Plantillas.idNuevo(), tipo: '', categoria: '',
      nombre: String(nombreHito || '').trim() || 'Hito sin título',
      texto: principal.cuerpo || ''
    };
    if (tieneTexto(seneca) && seneca.cuerpo !== principal.cuerpo) fila.textoSeneca = seneca.cuerpo;
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) { actual.lista.push(fila); return actual; });
      return fila.id;
    } catch (e) { return ''; }
  }

  /* Convierte un paso (o un subpaso) suelto: añade al guion las tareas
     que falten y vacía los campos viejos. Sin nada que convertir (paso
     ya migrado, paso-pregunta —que `Guias.normalizar` ya deja con los
     dos campos vacíos—, o un paso que nunca tuvo estas secciones), no
     hace nada. */
  async function convertirPaso(paso, nombreHito) {
    if (!paso) return;
    paso.guion = Array.isArray(paso.guion) ? paso.guion : [];

    var ids = (paso.plantillasDocumento || []).slice();
    if (ids.length) {
      var yaGenerar = tareasDe(paso.guion, 'generar').map(function (g) { return g.receta && g.receta.plantilla; });
      ids.forEach(function (id) {
        if (!id || yaGenerar.indexOf(id) !== -1) return;
        yaGenerar.push(id);
        paso.guion.push({ id: nuevoId(), texto: 'Generar un documento', explicacion: '', accion: 'generar',
                           normativa: null, receta: { plantilla: id } });
      });
      paso.plantillasDocumento = [];
    }

    var c = paso.comunicacion;
    if (c && (tieneTexto(c.correo) || tieneTexto(c.seneca))) {
      var idPlantilla = await crearPlantillaDeComunicacion(c, nombreHito);
      if (idPlantilla) {
        paso.guion.push({ id: nuevoId(), texto: 'Comunicar', explicacion: '', accion: 'comunicar',
                           normativa: null, receta: { a: '', via: viaDe(c), plantilla: idPlantilla } });
        paso.comunicacion = null;
      }
      /* Sin plantilla (sin gestor, o falla el guardado): `comunicacion`
         se queda tal cual, para reintentarlo la próxima vez que se
         abra el editor — sigue siendo idempotente, solo que todavía no
         ha podido convertir esta vez. */
    }
  }

  /* Toda la guía: cada paso, y los pasos de cada opción si es una
     pregunta, a cualquier profundidad (fila 95, preguntas dentro de las
     respuestas). */
  async function convertirGuia(pasos, nombreTipo) {
    async function recorrer(lista) {
      for (var i = 0; i < (lista || []).length; i++) {
        var p = lista[i];
        await convertirPaso(p, p.titulo || nombreTipo);
        for (var j = 0; j < (p.opciones || []).length; j++) {
          await recorrer((p.opciones[j] && p.opciones[j].pasos) || []);
        }
      }
    }
    await recorrer(pasos);
  }

  return {
    convertirGuia: convertirGuia, convertirPaso: convertirPaso,
    /* para las pruebas */
    _crearPlantillaDeComunicacion: crearPlantillaDeComunicacion, _viaDe: viaDe
  };
})();
window.GuiasPasoTareas = GuiasPasoTareas;
