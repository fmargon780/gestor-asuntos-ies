/* Fila 560: lista de piezas de código de la página (parte 1 de 3; antes eran las etiquetas <script> de index.html).
   Escribe las etiquetas <script src> en el mismo orden y en el mismo sitio de la página, con document.write, para que
   carguen igual de seguidas, también abiertas desde el disco (file://, copia sin internet). El orden de la lista ES el
   orden de carga: un fichero nuevo de código se apunta aquí, no en index.html (docs/560-PARTIR-FICHEROS-GRANDES.md). */
(function () {
  var piezas = [
    // Piezas sueltas: cada una hace su trabajo y no sabe de las demás.
    'js/util.js',
    // Fila 536: js/ayudas.js partido en trozos, que van antes que él.
    'js/ayudas-textos.js',
    'js/ayudas-rotulos.js',
    'js/ayudas.js',   // fila 462: los textos del recuadro de ayuda
    'js/ayuda-raton.js',   // fila 462: el recuadro (ya no hay ayudas grises del navegador)
    'js/solo-consulta.js',
    'js/util-parecidos.js',
    'js/buscar-o-crear.js',
    'js/util-pantalla.js',
    'js/almacen.js',
    // Fila 90, docs/ARCHIVAR-SIN-AVISOS-FALSOS.md: reintentar una
    // escritura que tropieza con Dropbox sincronizando. Antes de
    // js/carpetas.js, que lo usa.
    // Fila 99 (docs/GUARDAR-EN-FILA.md): los guardados de _GESTOR, de uno
    // en uno por fichero, y el contador de "hay un guardado en marcha".
    // Fila 332, docs/DATOS-1-MEDIDAS.md: el Gestor apunta cuánto tarda cada cosa. Antes de reintentar-escritura.js y carpetas.js.
    'js/medidas.js',
    'js/cola-guardado.js',
    'js/reintentar-escritura.js',
    // Fila 535: js/carpetas.js partido en trozos, que van antes que él.
    'js/carpetas-disco.js',
    'js/carpetas-copiar.js',
    'js/carpetas-ficheros.js',
    'js/carpetas.js',
    // Fila 456: los atajos de Google Drive (.gdoc…) no son documentos. Justo después de js/carpetas.js.
    'js/ficheros-de-google.js',
    // Fila 458 (docs/PASAR-A-DRIVE.md): las fechas de antes del traslado a Drive.
    'js/fechas-de-origen.js',
    'js/copias.js',
    // Fila 455: la carpeta de entrada de documentos sueltos. Después de js/carpetas.js y js/almacen.js.
    'js/entrada.js',
    // Fila 458: el botón «Pasar a Drive» (el traslado; su pantalla va con las de Ajustes).
    'js/pasar-a-drive.js',
    // Fila 459: el otro ordenador, casa y la copia sin internet vieja, después de pasar a Drive.
    'js/carpetas-en-drive.js',
    'js/usuarios.js',
    // Fila 536: js/nombres.js partido en trozos, que van antes que él.
    'js/nombres-tipos.js',
    'js/nombres-montar.js',
    'js/nombres-terceros.js',
    'js/nombres.js',
    // Fila 177 (docs/ARCHIVO-POR-CURSO-Y-RUTAS.md, punto 2): cuánto hueco
    // queda de verdad para un nombre, contando la ruta completa dentro de
    // Dropbox. Va justo después de js/nombres.js (le añade Nombres.topes).
    'js/nombres-topes.js',
    // Fila 239 (docs/NOMBRES-FIJOS-CON-NUMERO.md): el número único de cada
    // asunto y de cada documento, y el nombre corto (tope de 25) de los
    // tipos. Van aquí: los usan nombres.js y nombres-topes.js al montar.
    'js/numeros.js',
    'js/tipos-cortos.js',
    'js/fecha-de-registro.js',   // fila 573
    'js/fecha-de-registro-plazos.js',
    'js/documentos-datos.js',
    'js/plazos.js',
    // Fila 102 (docs/DOCUMENTOS-DESDE-EL-HITO.md): catálogo de plantillas de
    // documento del hito (fila 199: el editor ya no pinta un bloque propio,
    // solo lo usan la vista de solo lectura y la biblioteca).
    'js/guias-documentos.js',
    'js/guias-niveles.js',
    'js/guias-barra.js',
    'js/guias-toca.js',
    'js/guias-plazo.js',
    'js/guias.js',
    'js/guias-vista.js',
    'js/guias-paso-bloques.js',
    'js/guias-convertir.js',
    'js/guias-editor-plazo.js',   // fila 531: trozos de guias-editor.js
    'js/guias-editor-abrir.js',
    'js/guias-editor.js',
    'js/guias-columnas.js',
    'js/guias-cuando.js',   // fila 576: «Cuándo se hace»
    'js/guias-plantilla.js',
    'js/guias-plegado.js',
    'js/guias-opciones-editor.js',
    'js/guias-mapa.js',
    'js/guias-requisitos.js',
    // Fila 109: «Guion de este paso» en el editor de la guía (fila 199:
    // también las tareas que vienen de migrar comunicación y documentos).
    'js/guias-guion.js',
    'js/guias-guion-editor.js',
    // Fila 79, 20-sep-2026, docs/BIBLIOTECA-DE-HITOS.md: la biblioteca de
    // hitos del centro, después de js/guias.js y sus dos ayudantes.
    'js/hitos-biblioteca.js',
    'js/hitos-normativa.js',
    'js/guias-biblioteca.js',
    'js/guias-biblioteca-guardias.js',
    'js/datos.js',
    'js/datos-alumnado.js',
    'js/datos-personal.js',
    'js/datos-personal-hecho.js',
    'js/datos-resumen.js',
    'js/datos-listas.js',
    // Fila 108: los tutores legales de un alumno, sacados de js/datos.js (Datos.tutoresDe).
    'js/datos-tutores.js',
    'js/personas-familias.js',
    // js/genero.js: el masculino o el femenino en las plantillas (fila 111); lo usa js/plantillas.js
    'js/genero.js',
    'js/campos-clases.js',
    // Fila 536: js/campos.js partido en trozos, que van antes que él.
    'js/campos-normalizar.js',
    'js/campos-guardar.js',
    'js/campos-valores.js',
    'js/campos.js',
    // Fila 96 (docs/CAMPOS-EN-EL-NOMBRE-DEL-DOCUMENTO.md): los campos
    // propios de un tipo de documento, que usa js/documentos.js al poner
    // nombre y Ajustes → Tipos de documento.
    'js/documentos-campos.js',
    'js/documentos.js',
    'js/documentos-formulario.js',
    'js/documentos-tipo-nuevo.js',
    'js/documentos-guardar.js',
    'js/documentos-pdf-ajuste.js',
    'js/grupos.js',
    // js/idea.js (fila 47, docs/DESTINATARIOS-EN-SENECA.md): el usuario
    // IdEA de una persona, leído por el título de columna del CSV, como
    // js/dni.js con el DNI. Va antes que js/correo.js, que lo usa para
    // el cuadro de Séneca; no depende de nada más, así que puede ir
    // aquí, junto a js/grupos.js.
    'js/idea.js',
    // El índice guardado del ARCHIVO (fila 44, docs/BUSCADOR-ARCHIVO-INDICE.md).
    // Va después de js/nombres.js y js/carpetas.js (los usa) y antes de
    // js/asuntos-archivar.js y js/archivo-personas.js, que son quienes
    // lo llaman.
    'js/archivo-indice.js',
    // Fila 177: recorrer el disco y reconstruir, partido de archivo-indice.js
    // por tamaño. Va justo después: añade construir/recuentoActual al mismo
    // IndiceArchivo.
    'js/archivo-indice-construir.js',

    // La comodidad de la pantalla. Va antes que la aplicación, para
    // enterarse de los cambios antes de que la pantalla se mueva.
    'js/usabilidad.js',

    // La aplicación, repartida por pantallas.
    'js/nucleo.js',
    'js/nucleo-tipos.js',
    'js/nucleo-registro.js',
    'js/borrados-fusion.js',
    // Fila 364, docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md: un cambio que no se puede guardar queda pendiente y se reintenta solo. Después de js/nucleo.js y js/borrados-fusion.js.
    'js/guardado-pendiente.js',
    'js/version.js',
    // Fila 326, docs/BOTON-UNICO-DE-SOPORTE.md: presenta la app al botón «Soporte» único (que se pide a
    // Google después de cargar la página). Va justo después de la versión para recoger los errores pronto.
    'js/soporte-cargar.js',
    'js/novedades.js',
    'js/novedades-ventana.js',
    'js/inicio-ordenar.js',
    'js/inicio-columnas.js',
    'js/asuntos-lista.js',
    'js/asuntos-lista-montones.js',
    'js/asuntos-lista-pintar.js',
    'js/unir-asuntos.js',
    'js/unir-asuntos-pantalla.js',
    'js/unir-asuntos-unir.js',
    'js/asuntos-editar.js',
    // El cuadro de elegir asunto, compartido por "Por clasificar" y por la
    // bandeja de correos. Va antes que sus dos usuarios, y antes que
    // js/papelera.js, que envuelve la tarjeta del documento suelto.
    'js/elegir-asunto.js',
    'js/documentos-sueltos.js',
    // Fila 191: "mirar cada poco si ha llegado algo" (App.mirando,
    // App.vigilarLaCarpeta, App.mirarLaCarpeta, App.actualizarTitulo),
    // sacado de documentos-sueltos.js para que no pasara de 600 líneas.
    'js/documentos-vigilancia.js',
    // Archivar y reabrir un asunto, sacado de documentos-sueltos.js el
    // 17-sep-2026 (fila 32). Va antes que js/relacionados.js y
    // js/hitos-archivo.js, que envuelven App.cerrarAsunto/App.reabrirAsunto.
    'js/documento-renombrar.js',
    'js/archivar-cabe.js',
    'js/asuntos-archivar.js',
    // Fila 398: archivar sin esperar. Después de js/asuntos-archivar.js y js/guardado-pendiente.js.
    'js/archivar-fondo.js',
    // js/lo-pide.js (fila 28): quién ha pedido la gestión. Va antes que
    // js/asuntos-nuevo.js (pinta su grupo "Lo pide") y que js/plantillas.js
    // (usa LoPide.datosDeTutor).
    'js/lo-pide.js',
    // js/contacto-a-la-vista.js (fila 305): el contacto de «El encargo» junto a «Lo pide».
    'js/contacto-a-la-vista.js',
    'js/asuntos-nuevo.js',
    'js/asuntos-nuevo-campos.js',
    'js/asuntos-nuevo-crear.js',
    'js/asuntos-nuevo-alta.js',
    // Fila 489: el cuadro de los datos de un tercero (Apellidos y Nombre), App.cuadroDeTercero. Solo se usa al ejecutarse.
    'js/tercero-cuadro.js',
    // Fila 489: el cursor salta solo al siguiente hueco de «Nuevo asunto».
    'js/nuevo-siguiente-hueco.js',
    // El buscador de tercero de «Cambiar el asunto» (fila 219): reusa
    // App.buscarEnCategorias/App.claseDeResultado/App.pieDe/App.botonesAlta
    // de js/asuntos-nuevo(-alta).js y App.textoTercero de
    // js/asuntos-nuevo-campos.js. Va después de los tres.
    'js/asuntos-editar-tercero.js',
    // El tipo en una línea con buscador (fila 257): usa BuscarOCrear y App.crearTipo, solo al ejecutarse.
    'js/tipo-en-linea.js',
    'js/archivo-personas.js',
    'js/tercero-renombrar.js',
    'js/tercero-cambiar-datos.js',
    'js/ajustes.js',
    'js/tipos-nombre.js',
    'js/parecido-de-carpetas.js',
    'js/problemas-textos.js',
    'js/problemas.js',
    'js/problemas-personal.js',
    'js/fichas-huerfanas.js',
    'js/puente.js',
    // Los tutores legales como tercero (fila 166). Después de js/puente.js y js/archivo-personas.js (sus puntos previstos).
    'js/tutores-legales.js',
    // Las Administraciones como tercero (fila 167): datos y ficha. Después de js/puente.js, js/archivo-personas.js y js/asuntos-nuevo-campos.js (sus puntos previstos).
    'js/administraciones.js',
    'js/administraciones-ficha.js',

    // Fila 193, apartado 1 (docs/AVISOS-MENU-Y-VOLVER.md): todos los
    // avisos de arriba, en una sola línea. Después de js/puente.js (se
    // engancha a window.Gestor.alRefrescar), antes de los módulos de
    // abajo, que le pasan su trozo con AvisosLinea.registrar.
    'js/inicio-plegados.js',
    'js/avisos-linea.js',
  ];
  document.write(piezas.map(function (f) { return '<script src="' + f + '"><\/script>'; }).join('\n') + '\n');
}());
