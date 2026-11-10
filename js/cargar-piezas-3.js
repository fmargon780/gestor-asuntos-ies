/* Fila 560: lista de piezas de código de la página (parte 3 de 3; antes eran las etiquetas <script> de index.html).
   Escribe las etiquetas <script src> en el mismo orden y en el mismo sitio de la página, con document.write, para que
   carguen igual de seguidas, también abiertas desde el disco (file://, copia sin internet). El orden de la lista ES el
   orden de carga: un fichero nuevo de código se apunta aquí, no en index.html (docs/560-PARTIR-FICHEROS-GRANDES.md). */
(function () {
  var piezas = [
    // Apps Script que manda el correo de verdad, y pinta el bloque
    // Ajustes → Mantenimiento → "Enviar correo". Va después de
    // js/bandeja-correos.js (mismo bloque de Ajustes) y antes de
    // js/correo-cuadro.js, que lo usa.
    'js/correo-enviar.js',
    'js/correo-version.js',
    // Fila 480: lo que la app le pide a Gmail (leído, archivar, recibidos). Después de js/correo-enviar.js.
    'js/correo-gmail.js',
    // js/correo-cuadro.js (fila 58, 18-sep-2026,
    // docs/AJUSTES-DE-USO-2026-09-18.md, 5): el cuadro de "Correo
    // electrónico", sacado de js/correo.js igual que se hizo con Séneca
    // en la fila 53. Va después de js/correo.js (usa
    // `window.CorreoNucleo`), js/plantillas.js/js/plantillas-ajustes.js
    // (Plantillas.*, para el desplegable "Plantilla"), js/correo-adjuntos.js
    // (para pesar y leer los documentos) y js/correo-enviar.js (para el
    // botón "Enviar", fila 115), los cuatro ya definidos en tiempo de
    // carga.
    'js/correo-enviado-pdf.js',
    // Fila 536: js/correo-cuadro.js partido en trozos, que van antes que él.
    'js/correo-cuadro-destinatarios.js',
    'js/correo-cuadro-cuerpo.js',
    'js/correo-cuadro-enganche.js',
    'js/correo-cuadro.js',
    // Fila 299, docs/CORREO-AL-TUTOR-DEL-GRUPO.md: el correo al tutor o tutora del grupo y la plantilla que adjunta sola un documento.
    'js/correos-a-mano.js',
    'js/tutor-del-grupo.js',
    'js/correo-tutor.js',
    'js/correo-adjunto-plantilla.js',
    'js/plantilla-adjuntar.js',
    'js/campo-destinatarios.js',   // fila 555
    'js/plantilla-papeles.js',   // fila 555
    'js/horario.js',   // fila 572
    'js/correo-para.js',   // fila 555
    'js/correo-relacionar.js',   // fila 555
    'js/correo-tutor-botones.js',
    'js/barra.js',
    'js/vista.js',
    'js/cabecera-fija.js',
    // Fila 204 (docs/COMPROBACION-AL-ENTRAR.md): las cosas que se configuran una vez, revisadas al entrar.
    'js/permisos-carpetas.js',
    'js/entrada-ajustes.js',
    'js/pasar-a-drive-ajustes.js',
    'js/datos-que-tengo.js',
    'js/datos-que-tengo-ver.js',
    'js/comprobacion-entrada.js',
    'js/comprobacion-entrada-ver.js',
    // Fila 107, 24-sep-2026, docs/FICHA-EN-TARJETAS.md: la ficha del asunto
    // en tarjetas. Lo llama js/ficha-asunto.js al pintar; va después de todo
    // lo que pinta dentro de las tarjetas (documentos, hitos, notas,
    // relacionados, otros asuntos del tercero) y del visor.
    'js/ficha-tarjetas-resumen.js',
    'js/ficha-tarjetas.js',
    // Fila 425: el documento abierto, en la columna derecha de «Trabajo». Después de js/ficha-tarjetas.js; lo llaman js/visor.js y js/word-visor.js.
    'js/ficha-trabajo-visor.js',
    // Fila 426: la franja «Datos del asunto» de «Trabajo». La llama js/ficha-asunto.js; usa js/ficha-tercero.js y js/ficha-bloques.js.
    'js/ficha-datos-a-mano.js',
    // Fila 109, docs/EL-HITO-A-PANTALLA-COMPLETA.md: el hito a pantalla completa,
    // la mesa de trabajo. Después de los hitos, de la tarjeta de Hitos y del visor.
    'js/hito-mesa.js',
    'js/tareas-con-documento.js',
    'js/tareas-con-documento-vista.js',
    // Fila 524: lo que falta por firmar o registrar (cuadros de marcar, archivar y enviar, y «Sin registrar»). Antes de js/hito-mesa-documentos.js.
    'js/avisos-de-lo-que-falta.js',
    'js/hito-mesa-guion.js',
    'js/donde-se-guarda.js',
    'js/donde-se-guarda-tareas.js',
    'js/hito-mesa-tarea-menu.js',
    'js/hito-mesa-documentos.js',
    'js/generar-para-relacionados.js',
    'js/hito-mesa-comunicar.js',
    'js/hito-mesa-recetas.js',
    'js/perfil.js',
    'js/hacer-este-hito.js',
    'js/hacer-este-hito-sello.js',
    'js/tarea-firmar.js',
    'js/tarea-copiar.js',
    'js/tarea-copiar-editor.js',
    'js/grupo-enviar.js',   // fila 295: enviar a todas las personas del grupo; usa GrupoEnviarPantalla y GrupoAvisos al pulsar
    'js/grupo-enviar-pantalla.js',
    'js/grupo-avisos.js',
    'js/esperas.js',
    'js/perfil-ajustes.js',
    'js/encargos.js',
    'js/encargos-nuevo.js',
    'js/encargos-mios.js',
    'js/encargos-llegada.js',
    'js/notas-directivos.js',
    'js/dni.js',
    'js/presencia.js',
    // Fila 176, punto 3: el vistazo de 20 s también relee asuntos.json e
    // hitos.json si han cambiado. Envuelve App.mirarLaCarpeta
    // (js/documentos-sueltos.js) y usa Hitos.alCambiar, App.pantallaALaVista
    // (js/puente.js) y App.reengancharFicha (js/ficha-asunto.js, ya
    // cargado): va después de todos ellos.
    'js/vistazo-registro.js',
    'js/asunto-renombrar.js',
    // Fila 303: encontrar y enlazar la carpeta de un asunto perdido, también si está archivada. Después de js/archivo-indice.js, js/ficha-archivo.js, js/hitos-archivo.js, js/parecido-de-carpetas.js y js/asunto-renombrar.js.
    'js/carpetas-perdidas-buscar.js',
    'js/carpetas-perdidas-enlazar.js',
    'js/hitos-de-asuntos-perdidos.js',
    'js/papelera.js',
    'js/papelera-devolver.js',
    'js/papelera-ajustes.js',
    'js/papelera-vaciado.js',
    // Fila 68 (docs/AVISOS-QUE-FALTAN.md), 1 y 3: va después de
    // js/papelera.js y js/papelera-vaciado.js (Papelera.leer/loQueSeBorraPronto/fechaBreve)
    // y de js/archivo-indice.js (window.IndiceArchivo), y envuelve
    // App.verAbiertos, ya definido en js/asuntos-lista.js.
    'js/avisos-que-faltan.js',
    // Fila 408: el tipo de la ficha y el de la carpeta se ponen al día al entrar. Después de js/asunto-renombrar.js y js/hitos-cambio-de-tipo.js.
    'js/tipo-del-nombre-al-dia.js',
    'js/hitos-ajustes.js',
    // Fila 104: a quién le toca cada asunto, por su hito abierto. Después de
    // js/hitos-archivo.js (usa Hitos.resolverResponsable).
    'js/hitos-a-quien.js',
    'js/responsable-organismo.js',   // fila 205: después de js/administraciones-ficha.js y js/hitos.js
    // Fila 206, docs/HITOS-DESDE-EL-ASUNTO.md: crear, cambiar y borrar hitos
    // desde la mesa. Después de js/hito-mesa.js, js/guias-enganche.js,
    // js/guias.js, js/guias-plazo.js y js/responsable-organismo.js.
    // Fila 535: js/hitos-desde-el-asunto.js partido en trozos, que van antes que él.
    'js/hitos-desde-el-asunto-puras.js',
    'js/hitos-desde-el-asunto-formulario.js',
    'js/hitos-desde-el-asunto-propagar.js',
    'js/hitos-desde-el-asunto-cambiar.js',
    'js/hitos-desde-el-asunto.js',
    'js/hitos-desde-el-asunto-guia.js',
    'js/estado-hito.js',
    'js/estado-migracion.js',
    // Unir dos tipos en uno (27-sep-2026, fila 207, docs/UNIR-DOS-TIPOS.md):
    // después de js/tipos-nombre.js, js/guias-enganche.js, js/campos.js,
    // js/plantillas.js, js/recurrentes.js, js/asunto-renombrar.js,
    // js/papelera.js, js/borrados-fusion.js y js/estado-hito.js (todos ya
    // cargados más arriba), y antes de js/ajustes-tipo.js, que pone el
    // botón.
    'js/tipos-unir.js',
    // Fila 277: tipos que son el mismo (la unión sola y el aviso de Inicio); después de js/tipos-unir.js y js/avisos-linea.js.
    'js/tipos-parecidos.js',
    'js/tipos-parecidos-cuadro.js',
    // Fila 422: desactivar / activar un tipo; lo usan js/ajustes-tipo.js y js/buscar-o-crear.js en el momento de pulsar.
    'js/tipos-desactivar.js',

    // Ajustes por tipo (17-sep-2026, fila 39, docs/AJUSTES-POR-TIPO.md):
    // js/ajustes.js se quedó solo con el marco (las tres pestañas, la
    // lista de tipos y el buscador cruzado); estos tres van después de
    // todos los módulos que envuelven (campos, guías, plantillas de
    // correo y de documento, recurrentes, grupos, hitos, conflictos,
    // copias, papelera, huérfanas, frescura, bandeja, duplicados
    // descartados), para que sus funciones ya existan cuando el tipo o
    // "El centro" o "Mantenimiento" se pintan por primera vez.
    // Campos calculados y el panel de "+ Añadir campo" (fila 56,
    // 18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md): van después de
    // js/campos.js (que ya cargó mucho más arriba) y antes de
    // js/ajustes-tipo.js, que los llama al pintar la sección Campos.
    // js/campos-calculo.js no depende de nada de aquí abajo (solo de
    // U y Nombres, ya cargados); los otros dos sí llaman a App.E.
    // Fila 529: los pasos de un campo creado a partir de otros. Antes de js/campos-calculo.js, que los usa.
    'js/campos-datos-cache.js',
    'js/campos-pasos.js',
    'js/campos-calculo.js',
    'js/campos-catalogo.js',
    // Fila 528 (docs/528-LISTA-DE-CAMPOS.md): la lista única de campos y la ventana de elegir; después de campos-catalogo.js y de campos-calculados-editor.js.
    'js/campos-lista.js',
    'js/campos-lista-datos.js',
    'js/campos-manual-nuevo.js',
    'js/campos-elegir.js',
    'js/campos-lista-pantalla.js',
    'js/campos-de-hito.js',
    'js/campo-desde-el-asunto-escribir.js',   // fila 530
    'js/campo-desde-el-asunto.js',
    // Fila 530 (docs/530-DATOS-EN-EL-ASUNTO.md): los datos que piden las plantillas se escriben en el asunto.
    'js/datos-del-asunto.js',
    'js/datos-de-plantilla.js',
    'js/campo-colocar.js',
    'js/datos-del-asunto-vista.js',
    'js/campo-elegir-en-asunto.js',
    'js/datos-de-la-tarea.js',
    'js/datos-del-asunto-cuadro.js',
    // Fila 531 (docs/531-TAREAS-E-HITOS-COMUNES.md): las listas comunes de tareas y de hitos.
    'js/comunes.js',
    'js/comunes-guardado.js',
    'js/comunes-ventana.js',
    'js/comunes-ventana-nuevo.js',
    'js/comunes-cambiar.js',
    'js/comunes-asunto.js',
    'js/comunes-guia.js',
    'js/comunes-propuesta.js',
    'js/plan-guias.js',   // fila 551
    'js/plan-guias-listas.js',
    'js/plan-guias-aplicar.js',
    'js/plan-guias-pantalla.js',
    'js/tipos-y-su-uso.js',   // fila 543
    'js/tipos-y-su-uso-enviar.js',
    'js/campos-calculados-pasos.js',
    'js/campos-calculados-editor.js',
    // Fila 274: el apartado «Al terminar el asunto»; antes de js/ajustes-tipo.js, que lo cuelga.
    'js/ajustes-tipo-al-terminar.js',
    'js/ajustes-tipo-clases.js',   // fila 493
    'js/ajustes-tipo.js',
    'js/ajustes-tipo-palabras-clave.js',
    // Fila 198, apartado 1, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md: la
    // lista de comprobación de arriba de la pantalla del tipo. Después de
    // js/guias-enganche.js, js/guias-guion.js, js/tipos-organo.js y
    // js/conservacion.js (todos ya cargados más arriba), y antes de
    // js/ajustes-plegado.js, cuyo `resumirTipo()` la llama.
    'js/ajustes-tipo-comprobacion.js',
    'js/ajustes-centro.js',
    'js/ajustes-mantenimiento.js',
    // Fila 200, apartado 7, docs/AJUSTES-DEL-TIPO-Y-HERRAMIENTAS.md: la
    // pestaña "Herramientas". Solo llama a los módulos de siempre, así
    // que basta con que esté cargado antes de que se pueda pulsar esa
    // pestaña.
    'js/control-registro.js',
    'js/control-registro-pantalla.js',
    'js/control-registro-avisos.js',
    'js/herramientas.js',
    // «Pasar a Administraciones» (fila 167), en Mantenimiento.
    'js/administraciones-traer.js',
    // Fila 105, 24-sep-2026, docs/AJUSTES-PLEGADO.md: todo Ajustes plegado,
    // con un resumen en cada título y la memoria de lo abierto.
    'js/ajustes-plegado.js',
    'js/ajustes-reparto.js',
    'js/ajustes-buscador.js',
    // Fila 80, 20-sep-2026, docs/CARGAR-BIBLIOTECA.md: el botón que
    // carga el contenido de la biblioteca del centro, en Mantenimiento.
    'js/cargar-biblioteca.js',
    'js/plazos-del-centro.js',
    // Fila 306: las actividades extraescolares. Después de js/encargos.js, js/asunto-de-grupo.js, js/personas-del-grupo.js y js/ficha-tarjetas.js.
    'js/actividades.js',
    'js/actividades-formulario.js',
    'js/actividades-informe.js',
    'js/actividades-antigua.js',   // fila 310
    'js/actividades-exportar.js',
    'js/actividades-pantalla.js',
    // Fila 344: las etiquetas. Después de js/repartir-filtro.js, js/personas-familias.js y js/pdf-herramientas.js.
    'js/etiquetas-modelos.js',
    'js/etiquetas-datos.js',
    'js/etiquetas-disenos.js',
    'js/etiquetas-hoja.js',
    'js/etiquetas-pdf.js',
    'js/etiquetas-guardado.js',
    'js/etiquetas-editor.js',
    'js/etiquetas-tarjetas.js',
    // Fila 536: js/etiquetas-pantalla.js partido en trozos, que van antes que él.
    'js/etiquetas-pantalla-calculo.js',
    'js/etiquetas-pantalla-vista.js',
    'js/etiquetas-pantalla.js',
    'js/actividades-ficha.js',
    'js/candidaturas.js',   // fila 347
    'js/candidaturas-ficha.js',
    'js/candidaturas-lista.js',
    'js/candidaturas-papeletas.js',   // fila 571
    'js/actividades-tabla.js',   // fila 311: la tabla de datos y el tipo del certificado
    'js/nuevo-unidad.js',   // fila 501: el desplegable «Unidad» de Nuevo asunto
    'js/libros-hecho.js',   // fila 501: los libros por nivel y su cruce con la matrícula
    'js/libros-ficha.js',   // fila 501: la ficha de entrega de libros
    'js/informar-al-tutor.js',   // fila 299: «Informar al tutor/a» en la guía de las sanciones
    'js/plantilla-va-a-revision.js',   // fila 555: el paso único de «Va a:» a papeles

    // Fila 222, docs/COPIA-DE-PRUEBAS.md: decide si esta visita es la copia
    // de pruebas y, si lo es, mete el resto de js/demo/ con document.write
    // (la Content-Security-Policy no deja hacerlo en línea). Va aquí,
    // justo antes de arrancar, porque necesita que todos los módulos de
    // arriba (Guias, Hitos, Campos, Plantillas, Nombres, Carpetas...) ya
    // estén cargados, y antes de que App.arrancar() (al final de
    // js/inicio.js) llame a Almacen.leer, que usa indexedDB.
    'js/demo/arrancar.js',

    // Y ahora sí, a arrancar.
    'js/inicio.js',
    // Fila 209, docs/INICIO-EN-PESTANAS.md: las pestañas y la tabla
    // única de Inicio ("En Administración"/"En espera"/"Todos los
    // abiertos"/"Dormidos"). Después de js/inicio.js (lo llama desde
    // repintarTodo). Sustituye a js/inicio-plegados.js (fila 192).
    'js/inicio-tabla.js',
    // Fila 249, docs/POR-LIQUIDAR.md: los asuntos «Por liquidar» (la pestaña de Inicio)
    // y el cuadro «Liquidar» con su PDF. Después de js/inicio-tabla.js.
    'js/por-liquidar.js',
    'js/por-liquidar-liquidar.js',

    // Fila 70, docs/ENVOLTURAS-COMPROBADAS.md: EL ÚLTIMO de todos los
    // <script>, sin excepción. Cuando este fichero se ejecuta, todos los
    // demás ya han corrido de arriba abajo, y U.envolturasAplicadas() /
    // U.envolturasFallidas() tienen ya la foto completa.
    // Fila 332: las medidas (envío, tarjeta y las cuatro envolturas), justo antes de la lista de envolturas.
    'js/medidas-enviar.js',
    'js/medidas-pantalla.js',
    // Fila 334: las tablas para informes (código de persona y filas, apuntes, poner al día y tarjeta).
    'js/base-filas.js',
    'js/base.js',
    'js/base-poner-al-dia.js',
    'js/base-pantalla.js',
    'js/medidas-enganches.js',
    'js/envolturas-esperadas.js',
  ];
  document.write(piezas.map(function (f) { return '<script src="' + f + '"><\/script>'; }).join('\n') + '\n');
}());
