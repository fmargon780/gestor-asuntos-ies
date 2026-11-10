/* Fila 560: lista de piezas de código de la página (parte 2 de 3; antes eran las etiquetas <script> de index.html).
   Escribe las etiquetas <script src> en el mismo orden y en el mismo sitio de la página, con document.write, para que
   carguen igual de seguidas, también abiertas desde el disco (file://, copia sin internet). El orden de la lista ES el
   orden de carga: un fichero nuevo de código se apunta aquí, no en index.html (docs/560-PARTIR-FICHEROS-GRANDES.md). */
(function () {
  var piezas = [
    // Los módulos que se enganchan al puente.
    'js/avisos.js',
    'js/frescura.js',
    'js/conflictos.js',
    // Los CSV de terceros, administraciones.json y "los terceros se
    // releen solos" (fila 176, docs/PARTIR-FICHEROS-GRANDES.md): sacado
    // de js/conflictos.js, comparte lo necesario por
    // Conflictos._interno.
    'js/conflictos-datos.js',
    'js/conflictos-diferencias.js',
    'js/recurrentes.js',
    'js/guias-enganche.js',
    // El modelo de los hitos de un asunto: después de js/guias.js y de
    // js/plazos.js (los usa), y después de js/puente.js (usa
    // window.Gestor). js/hitos-panel.js pinta los hitos dentro de la
    // ficha del asunto, así que va después de js/ficha-asunto.js.
    // js/hitos-archivo.js va después de js/relacionados.js: envuelve
    // App.cerrarAsunto/App.reabrirAsunto detrás de esa envoltura.
    // Fila 535: js/hitos.js partido en trozos, que van antes que él.
    'js/hitos-normalizar.js',
    'js/hitos-fichero.js',
    'js/hitos-arbol.js',
    'js/hitos.js',
    'js/hitos-administracion.js',
    // Los cálculos de "qué toca" a cada asunto abierto (fila 16; ya no
    // es una pantalla propia desde la fila 191, docs/INICIO-CUATRO-
    // BLOQUES.md): cruza los hitos `pendiente`/`encurso` de todos los
    // asuntos abiertos. Usa Hitos.leer/visibles y, al abrir la mesa de
    // un hito, window.HitosPanel.desplegarAlAbrir (definido más abajo,
    // en js/hitos-panel.js), así que el orden entre ambos no importa: se
    // llama solo desde js/inicio.js, ya con todo cargado.
    'js/que-me-toca.js',
    // "Cuentas" (fila 74): las cuentas de fin de curso, por tipo, mes y
    // quién lo pidió. Va después de js/nombres.js y de js/archivo-indice.js
    // (los usa) y de js/puente.js (usa window.Gestor.asuntos()), y antes
    // de js/barra.js, que le añade su pestaña.
    'js/cuentas.js',
    'js/cuentas-tiempos.js',
    // js/cuentas-informe.js (fila 196, docs/AVISOS-A-QUIEN-LO-PIDE.md,
    // apartado 4): "Preparar informe para dirección". Después de
    // js/cuentas.js (usa Cuentas.cargar/_porOrgano/_tiempoDeTramite).
    'js/cuentas-informe.js',
    'js/notas.js',
    // Fila 89, docs/COPIA-SIN-INTERNET.md: leer un dato estático (JSON o
    // binario) tanto por http(s) (fetch) como abierto desde el disco
    // (file://, la copia sin internet), y la carga compartida de
    // pdf.js. Va antes que js/registro-lector.js, js/preparar-documento.js
    // y js/pdf-separar-unir.js (los tres llaman a App.cargarPdfJs()), y
    // antes que js/cargar-biblioteca.js, js/formularios.js,
    // js/formularios-rellenar.js y js/plantillas-documento.js (llaman a
    // App.leerFicheroDeLaApp), todos más abajo.
    'js/cargar-fichero.js',
    // js/actualizar-copia.js (fila 89): solo actúa si location.protocol
    // es "file:". Necesita js/util.js y js/almacen.js, ya cargados.
    'js/marca-version.js',
    'js/entrar-sola.js',
    'js/actualizar-copia.js',
    'js/aviso-version-web.js',
    'js/registro-lector.js',
    'js/lector-documentos.js',
    'js/contexto-documentos.js',
    'js/documentos-sueltos-sugerencias.js',
    'js/documentos-sueltos-lector.js',
    'js/verificacion.js',
    'js/registro.js',
    'js/registro-sellado.js',
    'js/documentos-firmados.js',
    'js/versiones-previas.js',
    'js/ruta-copia.js',
    'js/pdf-herramientas.js',
    'js/pdf-margenes.js',
    'js/pdf-comprimir.js',
    'js/preparar-documento.js',
    'js/pdf-separar-unir.js',
    // Repartir un PDF entre terceros (fila 141): las cuentas, la pantalla y lo que escribe.
    'js/repartir-nucleo.js',
    'js/repartir-crear.js',
    'js/filtro-exportar.js',   // fila 345: «Exportar la lista ▾» del filtro; usa ExportarHoja y ExportarInforme solo al pulsar
    'js/caja-con-sugerencias.js',   // fila 350
    'js/lista-con-casillas.js',
    'js/repartir-filtro.js',
    'js/repartir-pantalla.js',
    'js/repartir-visor.js',
    'js/repartir-ficheros.js',
    'js/ficha-asunto.js',
    'js/ficha-huella.js',
    'js/ficha-en-la-lista.js',
    'js/ficha-consulta.js',
    'js/ficha-sellos.js',
    'js/ficha-firmas.js',
    'js/ficha-bloques.js',
    // Fila 119: de qué pantalla se viene a una ficha, y la altura de la lista.
    'js/navegacion.js',
    // El menú pequeño reutilizable de la cabecera (fila 52, 18-sep-2026,
    // docs/CABECERA-DEL-ASUNTO.md): lo usan los tres puntos del nombre
    // (js/ficha-nombre-acciones.js, justo debajo) y "Comunicar"
    // (js/correo.js, más abajo).
    'js/ficha-menus.js',
    // El menú de tres puntos del nombre del asunto (fila 52, 18-sep-2026):
    // Editar, Copiar el nombre y Borrar, que antes vivían sueltos en la
    // barra de acciones. Va después de js/ficha-asunto.js (envuelve
    // App.abrirFicha) y de js/ficha-menus.js (usa FichaMenus.montar).
    // Fila 98 (docs/COPIAR-LA-RUTA-DE-LA-CARPETA.md): el botón «Ruta» que
    // pone js/ficha-nombre-acciones.js, y su bloque en Ajustes → El centro.
    'js/copiar-ruta.js',
    'js/largo-de-rutas.js',
    'js/ficha-nombre-acciones.js',
    // Los documentos de la carpeta del asunto, separado de
    // js/ficha-asunto.js el 17-sep-2026 (fila 26) al quitarle trabajo la
    // fila "los hitos son la guía". Se habla con él por
    // window.FichaDocumentos.pintar.
    'js/ficha-generar-documento.js',
    'js/ficha-documentos-fila.js',   // fila 560: la fila de cada documento, movida de js/ficha-documentos.js
    'js/ficha-documentos.js',
    // "Datos y contacto" del tercero, la línea resumen y la ventana "Ver
    // todo" (fila 37, 17-sep-2026): para no engordar js/ficha-asunto.js,
    // igual que js/ficha-documentos.js. Se habla con él por
    // window.FichaTercero.pintarLinea. Va después de js/datos.js y de
    // js/dni.js si estuviera antes, pero dni.js carga más abajo: llama a
    // window.Dni en tiempo de ejecución, no al cargar, así que el orden
    // entre los dos no importa.
    // Fila 108: la ventana «Ver todo» de un alumno, en tarjetas.
    'js/ficha-tercero-alumno.js',
    'js/ficha-tercero.js',
    // Fila 272: datos del tercero junto al nombre del asunto.
    'js/datos-favoritos.js',
    'js/ficha-datos-favoritos.js',
    'js/hitos-panel.js',
    'js/hitos-panel-lista.js',
    // Apuntar un documento a un hito (fila 31, 17-sep-2026): el cuadro de
    // elegir, con casillas. Lo usa el botón que pone js/hitos-panel-lista.js.
    'js/hitos-documentos.js',
    'js/duplicados.js',
    'js/duplicados-aviso.js',
    'js/varios-cuadro.js',
    'js/relacionados.js',
    'js/lista-pegada.js',
    'js/lista-pegada-pantalla.js',
    'js/relacionados-ficha.js',
    'js/relacionados-archivar.js',
    'js/asunto-de-grupo.js',
    'js/personas-del-grupo.js',
    'js/personas-del-grupo-ficha.js',
    'js/grupo-generar.js',   // fila 294
    'js/grupo-registro.js',
    // Saltar a otro asunto del mismo tercero, y volver (fila 40,
    // 17-sep-2026): se lleva el bloque "Otros asuntos de este tercero"
    // de js/ficha-asunto.js. Va después de js/ficha-asunto.js (cuelga el
    // hueco #ficha-otros) y de js/duplicados.js (usa
    // Duplicados.delTercero/carpetaDelTercero/tipoDeNombre).
    'js/otros-del-tercero.js',
    'js/hitos-archivo.js',
    // Fila 118: los pasos nuevos de una guía llegan a los asuntos abiertos. Detrás de
    // js/hitos-archivo.js, enganchado a window.Hitos sin envolver nada.
    'js/hitos-sincronizar.js',
    // Fila 94 (docs/CAMBIAR-EL-TIPO-CAMBIA-LA-GUIA.md): al cambiar el tipo
    // de un asunto, ofrecer la guía del nuevo. Usa Hitos y GuiasDelCentro;
    // lo llama App.editarAsunto.
    'js/hitos-cambio-de-tipo.js',
    // Fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md): va después de
    // js/hitos-archivo.js, para envolver App.cerrarAsunto/App.reabrirAsunto
    // por fuera de todo lo demás (los hitos ya se han movido antes de que
    // la ficha baje a la carpeta), y después de js/archivo-indice.js (usa
    // IndiceArchivo.resolverHandle para completar una tarjeta del ARCHIVO
    // que no trae manejador de carpeta).
    'js/ficha-archivo.js',
    // Fila 66 (docs/CONTACTO-GUARDADO-EN-LA-FICHA.md): el botón de
    // Ajustes → Mantenimiento que rellena `ficha.contacto` en los
    // asuntos abiertos que todavía no lo tienen. Usa Datos.fotoDeContacto
    // y App.guardarRegistroFresco, así que va después de js/datos.js y
    // de js/nucleo.js (los dos cargan mucho antes).
    'js/contacto-migracion.js',
    'js/hitos-requisitos.js',
    // Fila 109: el guion de un hito (Hitos.guionDe, marcarGuion…).
    'js/hitos-guion.js',
    'js/hitos-guion-marcar.js',
    'js/hitos-guion-reunir.js',
    'js/hitos-guion-orden.js',
    'js/visor.js',
    // Quién encarga cada tipo (fila 134): antes de js/tipos-buscador.js y js/tipo-al-vuelo.js, que lo usan.
    'js/tipos-organo.js',
    // Asuntos reservados (fila 135): la regla, en un solo sitio.
    'js/reservados.js',
    // Plazo de conservación (fila 136): después de js/puente.js (se apunta a window.Gestor.alRefrescar).
    'js/conservacion.js',
    // Índice del expediente (fila 137): usa js/pdf-herramientas.js (pdf-lib) al pulsar o al archivar.
    'js/indice-expediente.js',
    // «Lo que hay que reunir» pasa al guion, una sola vez (fila 138). Después de js/puente.js.
    'js/reunir-migracion.js',
    // Una sola libreta de notas por asunto (fila 139). Después de js/puente.js.
    'js/notas-migracion.js',
    // El registro del asunto (fila 229). Después de js/hitos.js y js/notas-migracion.js.
    'js/registro-asunto.js',
    // El alumnado desde la base de datos de alumnado (fila 142). Después de js/puente.js (se apunta a window.Gestor.alRefrescar).
    'js/alumnado-bd.js',
    'js/alumnado-bd-ver.js',
    'js/ficha-persona-reparto.js',
    'js/ficha-persona.js',
    'js/tipos-buscador.js',
    'js/tipo-al-vuelo.js',
    'js/via-contacto.js',
    'js/tablon.js',
    // Fila 536: js/tablon-compacto.js partido en trozos, que van antes que él.
    'js/tablon-compacto-estado.js',
    'js/tablon-compacto-pintar.js',
    'js/tablon-compacto-lista.js',
    'js/tablon-compacto-formulario.js',
    'js/tablon-compacto.js',
    'js/tablon-hora.js',
    'js/tablon-avisos.js',
    'js/copiar.js',
    // js/cargos.js (fila 81, 20-sep-2026, docs/FIRMANTES-Y-MEMBRETE.md): los
    // cargos del centro y quién los ha ocupado, con fechas. Va antes que
    // js/plantillas.js: Plantillas.valoresDeAsunto usa Cargos.enFecha para
    // los huecos {{FIRMANTE}} y compañía.
    'js/cargos.js',
    // js/plantillas.js va antes que js/correo.js: el cuadro de Correo usa
    // Plantillas.cargar/deTipo/rellenar/valoresDeAsunto para su desplegable
    // "Plantilla" (docs/PLANTILLAS-DE-CORREO.md, 2.3).
    // Fila 510: los textos condicionales {si:Campo=Valor}; antes de js/plantillas.js y js/docx.js, que los resuelven.
    'js/texto-condicional.js',
    'js/plantillas.js',
    'js/plantillas-valores.js',
    // js/huecos-buscador.js va antes que quien lo use: el botón "Insertar
    // hueco" del editor de plantillas (docs/HUECOS-INSERTAR.md, fila 35).
    'js/huecos-buscador.js',
    'js/texto-condicional-cuadro.js',
    'js/plantillas-ajustes-centro.js',   // fila 560: «Datos del centro y firma», antes que js/plantillas-ajustes.js
    'js/plantillas-ajustes.js',
    'js/plantillas-ajustes-editor.js',   // fila 560: el editor en línea, después de js/plantillas-ajustes.js
    // Fila 270: «Guardar como plantilla nueva» (lo usan los cuadros de Correo y de Séneca).
    'js/plantilla-de-lo-escrito.js',
    'js/destinatarios.js',
    'js/correo.js',
    'js/correo-grupos.js',
    'js/correo-rastro.js',
    'js/hitos-comunicar.js',
    // js/avisos-lo-pide.js (fila 195, docs/AVISOS-A-QUIEN-LO-PIDE.md):
    // avisar a quien lo pide y "Enviar estado". Va después de
    // js/correo.js (usa CorreoNucleo.abrirCuadro) y de
    // js/ficha-archivo.js (envuelve App.cerrarAsunto por fuera de esa
    // envoltura, para avisar antes de mover la carpeta).
    'js/avisos-lo-pide.js',
    // js/seneca-destinatarios.js (fila 47, docs/DESTINATARIOS-EN-SENECA.md):
    // la lista de usuarios IdEA del cuadro de Séneca, en chips. Va
    // después de js/correo.js: usa `window.CorreoGrupos`, que expone,
    // y js/correo.js solo llama a `window.SenecaDestinatarios` en
    // tiempo de ejecución (al abrir el cuadro), así que el orden entre
    // los dos no importa a esa parte, pero CorreoGrupos sí tiene que
    // existir ya cuando se elige un grupo.
    'js/seneca-destinatarios.js',
    // js/seneca-cuadro.js (fila 53, 18-sep-2026, docs/SENECA-CUADRO-ANCHO.md):
    // el cuadro de "Mensaje de Séneca", sacado de js/correo.js. Va
    // después de js/correo.js y de js/seneca-destinatarios.js: usa
    // `window.CorreoNucleo` y `window.SenecaDestinatarios`, los dos ya
    // definidos en tiempo de carga. El orden con js/seneca-ayudante.js
    // no importa: a ese solo lo llama en tiempo de ejecución.
    'js/seneca-cuadro.js',
    // js/seneca-ayudante.js (fila 47): genera el texto del enlace-marcador
    // y lo pinta, tanto en Ajustes (js/ajustes-mantenimiento.js) como en
    // el cuadro de Séneca (js/seneca-cuadro.js). No depende de ningún
    // otro módulo de la aplicación: solo de `window.U` para el aviso, si
    // está disponible.
    'js/seneca-ayudante.js',
    // js/membrete.js (fila 81, 20-sep-2026, docs/FIRMANTES-Y-MEMBRETE.md; desde
    // la fila 149, docs/MEMBRETE-LETRA-DEL-MANUAL.md): dibuja el membrete
    // entero, con el símbolo, la Consejería, el centro y el logo. Va antes que js/plantillas-documento.js, que lo usa al
    // generar.
    'js/membrete.js',
    // js/docx.js y js/plantillas-documento.js van después de js/correo.js
    // (docs/PLANTILLAS-DE-DOCUMENTO.md, 7): usan Plantillas.valoresDeAsunto
    // y, para el botón "Generar documento" de la ficha, el mismo enganche
    // de App.abrirFicha que ya usa js/correo.js.
    'js/docx.js',
    'js/word-faltan.js',
    'js/word-visor.js',
    'js/exportar-datos.js',   // fila 241: los datos de la exportación; antes de js/exportar-ventana.js
    'js/exportar-hoja.js',
    'js/exportar-agrupar.js',   // fila 278: el cálculo de los bloques del informe agrupado
    'js/exportar-informe-comprobar.js',   // fila 307: la cuenta antes de guardar o imprimir
    'js/exportar-informe.js',
    'js/exportar-ventana.js',
    // Fila 110: el membrete (sacado de docx.js) y las tablas de Word.
    'js/docx-imagen.js',
    'js/docx-pie.js',
    'js/docx-tabla.js',
    'js/plantillas-documento-elegir.js',   // fila 530
    'js/plantillas-documento.js',
    'js/plantillas-documento-ajustes.js',
    'js/plantillas-uso.js',
    'js/plantillas-fichero.js',
    'js/plantillas-fuera-de-uso.js',
    'js/plantillas-pantalla.js',
    // Fila 280, «Convertir en plantilla»: detrás de js/plantillas-documento-ajustes.js; js/plantilla-de-lo-escrito.js y js/genero.js ya están cargados.
    'js/docx-sustituir.js',
    'js/convertir-en-plantilla-propuestas.js',
    'js/docx-crear.js',
    'js/pdf-a-parrafos.js',
    'js/convertir-en-plantilla.js',
    'js/plantilla-seleccion.js',
    'js/plantilla-retocar.js',
    'js/plantilla-retocar-pantalla.js',
    'js/convertir-en-plantilla-pantalla.js',
    'js/plantillas-centro.js',
    'js/plantilla-buscar.js',
    // Fila 110, docs/TABLAS-DE-DATOS.md: las tablas de datos (tutorías, Tablas/) y sus huecos.
    'js/tablas-datos-leer.js',
    'js/tablas-datos-cursos.js',
    'js/tablas-datos-consejo.js',
    'js/tablas-datos-tutorias.js',
    'js/tablas-datos.js',
    'js/tablas-datos-pantalla.js',
    // Fila 102 (docs/DOCUMENTOS-DESDE-EL-HITO.md): «Generar documento»
    // dentro de un hito; usa PlantillasDocumento.
    'js/hitos-generar.js',
    // Fila 103 (docs/EL-HITO-MESA-DE-TRABAJO.md): «Añadir documento» (los
    // tres caminos) y el menú de tres puntos de cada documento del hito.
    // Van después de js/documentos.js, js/documentos-sueltos.js,
    // js/registro.js, js/pdf-herramientas.js, js/preparar-documento.js,
    // js/pdf-separar-unir.js y js/ficha-documentos.js: todos ya cargados
    // más arriba.
    'js/hitos-anadir.js',
    'js/hitos-sacar-documento.js',
    'js/hitos-documento-menu.js',
    // js/formularios.js (fila 82, 20-sep-2026, docs/FORMULARIOS-OFICIALES.md):
    // va después de js/ficha-asunto.js (envuelve App.abrirFicha, que se
    // define ahí) y de js/hitos-panel-lista.js (Formularios.listaHTML
    // se llama desde su cuerpoDeHito, en tiempo de ejecución, así que el
    // orden entre los dos no importa de verdad, pero van juntos).
    'js/formularios.js',
    // js/formularios-rellenar.js (fila 84, 20-sep-2026,
    // docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md): va después de
    // js/formularios.js (el botón cuelga de `data-clave-formulario`,
    // que pinta ese fichero) y de js/pdf-herramientas.js (pdf-lib).
    // Fila 146: las casillas con nombre legible (antes) y la pantalla de Ajustes (después).
    'js/formularios-casillas.js',
    'js/formularios-rellenar.js',
    'js/formularios-ajustes.js',
    'js/salir.js',
    'js/rescate-datos.js',
    'js/traer-datos.js',
    'js/centro-de-datos.js',
    'js/centro-de-datos-reparto.js',
    'js/centro-de-datos-personal.js',
    'js/centro-de-datos-libros.js',   // fila 501: la lista de libros de texto ya preparada
    'js/centro-de-datos-tutorias.js',
    'js/centro-de-datos-profesorado.js',   // fila 572
    'js/centro-de-datos-entregar.js',
    'js/centro-de-datos-configuracion.js',
    'js/centro-de-datos-ver.js',
    'js/lector.js',
    'js/bandeja-correos.js',
    'js/bandeja-huella.js',
    'js/bandeja-propuesta.js',
    'js/bandeja-guardar.js',
    'js/bandeja-ajustes.js',
    'js/bandeja-latido.js',
    // La bandeja en pantalla (fila 27, 17-sep-2026): necesita
    // window.Bandeja, así que va después de js/bandeja-correos.js, y
    // antes de js/bandeja-enlace.js y js/correo-adjuntos.js.
    'js/bandeja-pantalla.js',
    // Lee por dentro los adjuntos PDF de un correo (18-sep-2026, fila 49,
    // docs/ADJUNTOS-DE-CORREO-POR-DENTRO.md): necesita
    // window.RegistroLector, window.LectorDocumentos, window.Bandeja y
    // el gancho de js/bandeja-pantalla.js, así que va después de los
    // tres.
    'js/bandeja-adjuntos-lector.js',
    'js/bandeja-enlace.js',
    'js/correo-adjuntos.js',
    // js/correo-enviar.js (fila 115, 24-sep-2026,
    // docs/ENVIAR-DESDE-EL-ASUNTO.md): habla con la aplicación web de
  ];
  document.write(piezas.map(function (f) { return '<script src="' + f + '"><\/script>'; }).join('\n') + '\n');
}());
