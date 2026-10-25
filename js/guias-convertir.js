/* ============================================================
   guias-convertir.js — «Documentos de este paso» y «Comunicación de
   este paso» pasan a tareas del guion, la primera vez que se abre el
   editor de un tipo que todavía las tuviera.

   Sacado tal cual de js/guias-editor.js en la fila 463
   (docs/EDITOR-DE-LA-GUIA-CLARO.md: aquel fichero pasaba de las 400
   líneas), sin cambiar nada de lo que hace. Se carga justo antes de
   js/guias-editor.js; deja `Guias.convertirDocumentosYComunicacion` (con
   E/S) y `Guias._convertirDocumentosYComunicacion` (pura, para las
   pruebas, pruebas/documentos-comunicacion-a-tareas.mjs).
   ============================================================ */
(function () {
  var G = window.Guias || Guias;

  /* ==========================================================
     DOCUMENTOS Y COMUNICACIÓN DE UN HITO PASAN A TAREAS

     27-sep-2026, fila 199, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md,
     apartado 4. «Documentos de este paso» y «Comunicación de este
     paso» ya no se editan aparte (fuera de js/guias-paso-bloques.js):
     su contenido pasa a tareas del guion, la primera vez que se abre
     el editor de un tipo que todavía las tuviera.

     `convertirDocumentosYComunicacionPuro` es la parte sin E/S (fácil
     de probar): recorre `pasos` (y sus subpasos, a cualquier
     profundidad) y, en cada uno:
       - cada `id` de `plantillasDocumento` se convierte en una tarea
         «Generar un documento → nombre», con `receta: { plantilla:
         id }`, y `plantillasDocumento` se vacía;
       - si `comunicacion` tiene texto (correo o Séneca), se convierte
         en una o dos tareas «Comunicar» con una plantilla NUEVA (nunca
         había una: el texto vivía suelto en el paso), y `comunicacion`
         se vacía. Un asunto escrito a mano pasa como primera línea del
         cuerpo (27-sep-2026, corrección de fila 199, decidido con
         Francisco: nada se pierde sin decirlo). Con los dos canales
         iguales, una tarea con `via:''` (vale para cualquiera). Con
         los dos DISTINTOS, una sola plantilla (`texto`+`textoSeneca`,
         igual que ya hace `js/plantillas-ajustes.js`) pero DOS tareas,
         una `via:'correo'` y otra `via:'seneca'` — decidido con
         Francisco: "los dos, como dos avisos", nunca uno solo. Con un
         solo canal, una tarea con ESE `via` exacto: dejarlo en `''`
         haría que `js/hito-mesa-recetas.js` la disparase por correo
         por defecto aunque el texto fuera solo de Séneca (un fallo
         real, corregido de paso).
     Repetirlo no duplica nada: sin `plantillasDocumento` ni texto de
     comunicación que convertir, no toca el paso. Devuelve las filas
     de plantilla nuevas que hay que guardar en `plantillas.json`.
     ========================================================== */
  function textoDelCanal(asunto, cuerpo) {
    var a = String(asunto || '').trim();
    return a ? (a + '\n\n' + cuerpo) : cuerpo;
  }

  function tareaComunicar(idPlantilla, via, nombrePlantilla) {
    return { id: G.nuevoId(), texto: 'Comunicar → ' + nombrePlantilla, explicacion: '',
             accion: 'comunicar', receta: { a: '', via: via, plantilla: idPlantilla }, normativa: null };
  }
  function convertirDocumentosYComunicacionPuro(pasos, nombreTipo, categoria, opciones) {
    opciones = opciones || {};
    var idPlantilla = opciones.idPlantilla || function () { return G.nuevoId(); };
    var nombreDocumento = opciones.nombreDocumento || function (id) { return id; };
    var nuevasPlantillas = [];

    function convertirUno(p) {
      if (!p) return;
      if (G.esPregunta(p)) {
        (p.opciones || []).forEach(function (o) { (o && o.pasos || []).forEach(convertirUno); });
        return;
      }
      if (Array.isArray(p.plantillasDocumento) && p.plantillasDocumento.length) {
        p.guion = Array.isArray(p.guion) ? p.guion : [];
        p.plantillasDocumento.forEach(function (id) {
          p.guion.push({
            id: G.nuevoId(), texto: 'Generar un documento → ' + nombreDocumento(id),
            explicacion: '', accion: 'generar', receta: { plantilla: id }, normativa: null
          });
        });
        p.plantillasDocumento = [];
      }
      var c = p.comunicacion;
      var tieneCorreo = !!(c && c.correo && String(c.correo.cuerpo || '').trim());
      var tieneSeneca = !!(c && c.seneca && String(c.seneca.cuerpo || '').trim());
      if (tieneCorreo || tieneSeneca) {
        var textoCorreo = tieneCorreo ? textoDelCanal(c.correo.asunto, c.correo.cuerpo) : '';
        var textoSeneca = tieneSeneca ? textoDelCanal(c.seneca.asunto, c.seneca.cuerpo) : '';
        var idNuevo = idPlantilla();
        var nombrePlantilla = p.titulo || 'Comunicación sin título';
        var fila = { id: idNuevo, tipo: nombreTipo, categoria: categoria || '', nombre: nombrePlantilla,
                     texto: tieneCorreo ? textoCorreo : textoSeneca };
        p.guion = Array.isArray(p.guion) ? p.guion : [];
        if (tieneCorreo && tieneSeneca && textoCorreo.trim() !== textoSeneca.trim()) {
          fila.textoSeneca = textoSeneca;
          p.guion.push(tareaComunicar(idNuevo, 'correo', nombrePlantilla));
          p.guion.push(tareaComunicar(idNuevo, 'seneca', nombrePlantilla));
        } else {
          p.guion.push(tareaComunicar(idNuevo, tieneCorreo && tieneSeneca ? '' : (tieneCorreo ? 'correo' : 'seneca'), nombrePlantilla));
        }
        nuevasPlantillas.push(fila);
        p.comunicacion = { correo: { asunto: '', cuerpo: '' }, seneca: { asunto: '', cuerpo: '' } };
      }
    }

    (pasos || []).forEach(convertirUno);
    return nuevasPlantillas;
  }

  /* La parte con E/S: guarda en `plantillas.json` las que haga falta.
     Sin `App.E.gestor` (sin carpeta señalada, por ejemplo en una
     prueba) no se convierte nada: se deja para la próxima vez que se
     abra el editor con la carpeta a mano. `Plantillas.documentoPorId`
     trabaja con lo último leído (`GuiasDocumentos.precargar`, ya
     llamado por `js/guias-enganche.js` justo antes de abrir el
     editor); sin nada leído, se usa el propio id como nombre. */
  async function convertirDocumentosYComunicacion(pasos, nombreTipo, categoria) {
    if (!window.Plantillas || !window.App || !App.E || !App.E.gestor) return;
    var nuevas;
    try {
      nuevas = convertirDocumentosYComunicacionPuro(pasos, nombreTipo, categoria, {
        idPlantilla: Plantillas.idNuevo,
        nombreDocumento: function (id) {
          var d = Plantillas.documentoPorId(id);
          return (d && (d.nombre || d.fichero)) || id;
        }
      });
    } catch (e) { return; }
    if (!nuevas.length) return;
    try {
      await Plantillas.guardar(App.E.gestor, function (actual) {
        nuevas.forEach(function (f) { actual.lista.push(f); });
        return actual;
      });
    } catch (e) {
      U.accesorio('He convertido documentos y comunicación de este hito a tareas, pero no he ' +
        'podido guardar su plantilla de comunicación', e);
    }
  }

  Object.assign(G, {
    convertirDocumentosYComunicacion: convertirDocumentosYComunicacion,
    _convertirDocumentosYComunicacion: convertirDocumentosYComunicacionPuro
  });
})();
