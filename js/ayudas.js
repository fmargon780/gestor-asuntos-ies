/* ============================================================
   ayudas.js — los textos del recuadro de ayuda al pasar el ratón (fila 462,
   24-oct-2026, docs/AYUDA-AL-PASAR-EL-RATON.md). TODOS los textos fijos viven
   aquí, uno por línea: corregir una ayuda es cambiar una línea de este fichero.

   Cómo se enlaza un botón o una pestaña con su texto (js/ayuda-raton.js lo
   pregunta con `Ayudas.de(elemento)`), por este orden:
     1. `data-ayuda-clave="…"` en el elemento → TEXTOS[clave];
     2. su `id` → POR_ID;
     3. la pestaña a la que pertenece (`data-pantalla`, `data-pestana`,
        `data-ajustes-pestana`, `data-tarjeta`) → POR_PESTANA;
     4. su rótulo (lo que se lee en el botón, sin números ni flechas) → POR_ROTULO.
   Un botón con `data-ayuda` (un dato del momento, como el nombre entero de algo
   cortado) enseña ese texto y nada más. Los botones OBVIOS no llevan recuadro.

   Reglas de los textos: una o dos frases, 20 palabras como mucho, lo que hace
   o lo que se ve (no repiten el nombre del botón), lenguaje de Secretaría
   (docs/VOCABULARIO-EN-PANTALLA.md). Los motivos de un botón apagado dicen
   por qué y qué hay que hacer para encenderlo.
   ============================================================ */
window.Ayudas = (function () {

  /* Las pestañas que se crean según la configuración (las categorías de tipos de asunto). */
  var TEXTO_CATEGORIA = 'Enseña solo los tipos de asunto de esta categoría.';

  /* Los que se explican solos: ni recuadro. (Rótulo en minúsculas.) */
  var OBVIOS = ['guardar', 'cancelar', 'aceptar', 'entrar', 'abrir', 'cerrar', 'volver', 'sí', 'no'];

  /* ---------- 1. por clave (data-ayuda-clave) ---------- */
  var TEXTOS = {
    'a-que-hora-es-si-tiene': 'La hora de la nota, si la tiene. Hace falta poner el día.',
    'abre-el-alta-con-estos-datos': 'Abre el alta con estos datos ya escritos. Hay que revisar y guardar.',
    'abre-el-hito-actual-con-sus': 'Abre el hito actual, con sus plantillas para generar documentos.',
    'abrir-correo-enviado': 'Abre el PDF del correo que se envió.',
    'abrir-en-otra-pestana': 'Abre el documento en otra pestaña del navegador.',
    'abrir-este-hito': 'Abre la mesa de trabajo de este hito.',
    'abrir-la-ficha-de-este-asunto': 'Abre la ficha de este asunto.',
    'abrir-mesa-del-hito': 'Abre la mesa de trabajo de este hito.',
    'abrir-su-documento': 'Abre el documento que se generó.',
    'abrir-su-ficha': 'Abre la ficha de este asunto.',
    'adjuntar-al-correo-del-hito': 'Marca el documento para adjuntarlo al correo del hito.',
    'ajustes': 'Abre los ajustes de la aplicación.',
    'al-ancho': 'Ajusta el documento al ancho de la columna.',
    'ampliar': 'Hace más grande el documento que se está viendo.',
    'anadir-subdepartamento': 'Añade un departamento dentro de este.',
    'arrastralo-a-la-barra-de-marcadores': 'Arrástralo a la barra de marcadores del navegador. No se pulsa.',
    'asunto-reservado': 'Asunto reservado: solo lo ve quien tiene permiso.',
    'bajar': 'Baja esta línea un puesto en la lista.',
    'bajarlo-un-puesto': 'Baja este elemento un puesto en la lista.',
    'cambiar-el-orden': 'Cambia el orden de la lista: de más nuevo a más viejo y al revés.',
    'cambiar-la-fecha-el-tipo-la': 'Cambia la fecha, el tipo, la descripción o el tercero de este asunto.',
    'cambiar-o-borrar': 'Abre un menú para cambiar o borrar esta línea.',
    'cancelar': 'Cierra esto sin cambiar nada.',
    'casilla-gastada': 'Casilla ya gastada de la hoja. Púlsala para volver a usarla.',
    'cerrar': 'Cierra esta ventana sin cambiar nada.',
    'cerrar-este-aviso': 'Quita este aviso de la pantalla.',
    'cerrar-panel': 'Cierra el panel de lectura.',
    'cerrar-visor': 'Cierra el visor y vuelve a la ficha.',
    'como-se-cuentan-dias': 'Elige si los días del plazo son naturales o hábiles.',
    'comprobacion-al-entrar-pulsa-para-ver': 'Comprobación hecha al entrar: púlsalo para ver el detalle.',
    'copiar-contacto': 'Copia el dato para pegarlo en otro sitio.',
    'copiar-la-ruta-de-este-documento': 'Copia la ruta de este documento para pegarla al adjuntarlo. Si guardas aquí el registrado de Séneca, la app conserva el original y apunta el registro sola.',
    'copiar-la-ruta-de-la-carpeta': 'Copia la ruta de la carpeta para pegarla en el navegador o en el explorador de archivos.',
    'copiar-nombre-documento': 'Copia el nombre del documento, sin la extensión.',
    'copiar-nombre-normal': 'Copia el nombre en orden normal, nombre y apellidos, para pegarlo en un documento.',
    'correo-anterior': 'Enseña el correo de la persona anterior de la lista.',
    'correo-siguiente': 'Enseña el correo de la siguiente persona de la lista.',
    'cortar-aqui': 'Divide el PDF por aquí para separar el trozo de antes.',
    'crea-el-asunto-con-lo-leido': 'Crea el asunto con lo leído y guarda el documento dentro.',
    'dar-por-hechos-anteriores': 'Marca como hechos los hitos anteriores que sigan sin terminar.',
    'dar-registro': 'Pide el número de registro de entrada o de salida para este documento.',
    'datos-del-asunto-plegar': 'Enseña u oculta los datos del asunto.',
    'deja-el-tercero-elegido-a-la': 'Deja elegido el tercero y espera a que elijas el tipo de asunto.',
    'dejar-el-tipo': 'Descarta el cambio y deja el tipo de asunto que había.',
    'dejar-este-asunto-sin-crear-y': 'Descarta este asunto sin crearlo y vuelve.',
    'deshacer-este-cambio': 'Deshace este cambio y deja el texto como estaba.',
    'documento-por-relacionado': 'Genera un documento para cada persona o entidad relacionada, con sus datos.',
    'documento-ya-no-esta': 'El documento ya no está en la carpeta del asunto.',
    'escribir-un-correo-o-un-mensaje': 'Escribe un correo o un mensaje de Séneca sobre este asunto.',
    'explicacion-a-quien-le-toca-normativa': 'Explicación, a quién le toca, normativa y otros ajustes de este hito.',
    'guion-con-pregunta': 'Esta tarea hace una pregunta antes de seguir.',
    'hito-de-este-campo': 'Elige en qué hito se rellena este campo.',
    'la-guia-entera-de-un-vistazo': 'Enseña la guía entera de un vistazo, con el camino de este asunto.',
    'la-veras-solo-tu-en-este': 'Esta nota solo la verás tú, en este tablón.',
    'lista-con-vinetas': 'Convierte las líneas seleccionadas en una lista con viñetas.',
    'llevar-la-carpeta-al-archivo': 'Lleva la carpeta del asunto al ARCHIVO.',
    'lo-abre-en-otra-pestana-para': 'Abre el documento en otra pestaña para verlo.',
    'lo-lleva-a-la-carpeta-de': 'Guarda el documento en un asunto que ya existe.',
    'lo-tiene-ahora': 'La persona que tiene ahora este asunto en sus manos.',
    'marcar-para-liquidar': 'Marca este asunto para liquidarlo junto con los demás marcados.',
    'marcar-todos-los-que-se-ven': 'Marca o desmarca todos los asuntos que hay en la lista.',
    'mas': 'Abre un menú con más acciones.',
    'mas-acciones': 'Abre un menú con más acciones para esta fila.',
    'mas-acciones-sobre-el-asunto': 'Abre un menú con más cosas que se pueden hacer con este asunto.',
    'mas-opciones': 'Abre un menú con más cosas que se pueden hacer aquí.',
    'menu-del-hito': 'Menú para crear un hito, cambiar el actual o borrarlo.',
    'negrita': 'Pone en negrita el texto seleccionado.',
    'no-volver-a-avisar-de-este': 'Deja de avisar de este grupo: no son asuntos repetidos.',
    'nota-de-un-directivo-sin-ver': 'Hay una nota de un directivo que aún no has visto.',
    'nota-del-asunto': 'Nota del asunto en general, no unida a ningún hito.',
    'numero-del-asunto': 'Número que identifica este asunto en el registro.',
    'obligatorio': 'Hay que reunirlo para poder seguir con el hito.',
    'ocultar-por-hoy': 'Esconde los avisos durante el resto del día.',
    'para-pegarlo-como-asunto-del-correo': 'Copia el nombre del asunto para pegarlo como asunto de un correo.',
    'para-que-dia-es-si-tiene': 'El día para el que es la nota, si lo tiene.',
    'pasar-antes': 'Pasa esta página un puesto hacia el principio.',
    'pasar-despues': 'Pasa esta página un puesto hacia el final.',
    'perfil': 'Elige el perfil de esta persona: qué pantallas ve y qué puede cambiar.',
    'plantilla-fuera-de-uso': 'Está fuera de uso. Actívala en Herramientas, Plantillas, o elige otra en la tarea.',
    'plegar-el-tablon': 'Pliega el tablón para que ocupe menos.',
    'plegar-los-avisos': 'Pliega la línea de avisos para que ocupe menos.',
    'poner-enlace': 'Convierte el texto seleccionado en un enlace a una dirección web.',
    'poner-o-cambiar-la-fecha-limite': 'Pone o cambia la fecha límite del asunto.',
    'pulsa-para-leer-el-correo-al': 'Abre el correo al lado del programa para leerlo.',
    'pulsa-para-verlo': 'Abre el documento para verlo.',
    'pulsa-para-verlo-al-lado-del': 'Abre el documento al lado del programa para leerlo.',
    'pulsa-para-verlo-sin-sacarlo-de': 'Abre el elemento para verlo sin sacarlo de la papelera.',
    'quitar': 'Quita a esta persona de la lista. No se borra de ningún sitio más.',
    'quitar-de-copia-oculta': 'Quita esta dirección de la copia oculta del correo.',
    'quitar-de-la-lista': 'Quita este usuario de la lista de direcciones.',
    'quitar-de-lo-senalado': 'Lo quita de lo que has señalado. No se borra de ningún sitio más.',
    'quitar-esta-opcion-y-sus-hitos': 'Quita esta opción y los hitos que dependen de ella.',
    'quitar-este-filtro': 'Quita este filtro y vuelve a enseñar todos.',
    'quitar-formato': 'Deja el texto seleccionado sin negrita ni viñetas.',
    'quitar-la-busqueda-y-los-filtros': 'Borra la búsqueda y todos los filtros.',
    'quitar-la-fila': 'Quita esta línea de la lista de cosas que hay que reunir.',
    'quitar-referencia': 'Quita esta cita de normativa del hito.',
    'quitar-respuesta': 'Quita esta respuesta posible de la pregunta.',
    'recorre-el-archivo-entero-una-vez': 'Recorre el archivo entero una vez y guarda el índice de búsqueda.',
    'reducir': 'Hace más pequeño el documento que se está viendo.',
    'rellena-los-datos-del-centro-y': 'Rellena los datos del centro y del curso y lo guarda en la carpeta del asunto.',
    'reunir-dato': 'Hay que reunir un dato para hacer esta tarea.',
    'reunir-documento': 'Hay que reunir un documento para hacer esta tarea.',
    'sacar-la-lista-en-pdf-para': 'Prepara la lista de candidaturas en PDF para colgarla en el tablón.',
    'sacar-una-copia-de-una-plantilla': 'Sacar una copia de una plantilla de Word con los huecos ya rellenos',
    'seleccionar': 'Marca este documento para hacer algo con varios a la vez.',
    'sexo-para-las-plantillas': 'Sirve para poner bien el género en las plantillas.',
    'solo-aqui-hito': 'Este hito solo está en este asunto: no forma parte de la guía del tipo.',
    'solo-aqui-tarea': 'Esta tarea solo está en este asunto: no forma parte de la guía del tipo.',
    'solo-para-mi': 'Nota privada: solo la ves tú.',
    'subir': 'Sube esta línea un puesto en la lista.',
    'subirlo-un-puesto': 'Sube este elemento un puesto en la lista.',
    'tirador-lector': 'Arrastra para ensanchar o estrechar el panel de lectura.',
    'tirador-visor': 'Arrastra para ensanchar o estrechar el visor.',
    'traer-un-documento-del-ordenador-a': 'Copia un documento de tu ordenador a esta carpeta, ya con su nombre montado.',
    'un-fichero-por-persona-crea-el': 'Con un fichero por persona, crea el asunto de cada una, ya archivado.',
    'va-a-la-papelera': 'Lo manda a la papelera: de ahí se puede recuperar.',
    'vacio-sigue-en-el-cargo': 'Si lo dejas vacío, la persona sigue en el cargo.',
    'ver-explicacion-del-hito': 'Enseña u oculta la explicación de este hito de la guía.',
    'ver-mas': 'Despliega este hito para ver sus tareas, sus documentos y sus notas.',
    'ver-miniatura-en-grande': 'Enseña la miniatura del impreso en grande.',
    'ver-notas-tarea': 'Enseña las notas apuntadas en esta tarea.',
    'ver-que-hay-de-nuevo': 'Enseña las novedades de la aplicación.',
    'ver-y-escribir-las-opciones-de': 'Abre las opciones de esta pregunta para verlas y escribirlas.',
    'verlo-al-lado': 'Enseña el documento junto a la aplicación, para leerlo mientras trabajas.',
    'verlo-al-lado-del-programa': 'Abre el documento al lado del programa para leerlo.',
    'volver-a-la-pantalla-anterior': 'Vuelve a la pantalla de donde venías.',
    'volver-a-los-hitos': 'Cierra la mesa de trabajo y vuelve a la lista de hitos del asunto.',
    'volver-lista-documentos': 'Cierra el documento y vuelve a la lista de documentos de la carpeta.',
    'ya-copiado': 'Esta dirección ya está copiada: no hace falta copiarla otra vez.',
    'ya-no-esta-en-las-listas': 'Ya no está en las listas del centro, pero se conserva hasta que lo quites.'
  };


  /* ---------- 2. por identificador ---------- */
  var POR_ID = {
    'btn-abiertos': 'Señala en tu ordenador la carpeta donde están los asuntos que siguen abiertos.',
    'btn-archivo': 'Señala en tu ordenador la carpeta donde se guardan los asuntos ya cerrados.',
    'btn-recargar': 'Vuelve a leer las carpetas para poner al día la lista con lo que haya cambiado.',
    'btn-filtros': 'Enseña u oculta los desplegables para quedarte solo con algunos asuntos.',
    'btn-exportar': 'Saca a una hoja de cálculo o a un informe lo que se ve.',
    'btn-exportar-hoja': 'Guarda la lista que ves en una hoja de cálculo.',
    'btn-exportar-pdf': 'Prepara un informe en PDF con la lista que ves.',
    'restablecer-columnas': 'Devuelve las columnas de la tabla a su orden y anchura de siempre.',
    'inicio-quitar-filtro': 'Deja de filtrar y vuelve a enseñar todos los asuntos de la pestaña.',
    'inicio-liquidar-boton': 'Pide la fecha y quién entrega y recibe, guarda el PDF de liquidación y archiva el asunto.',
    'sueltos-ver-tambien': 'Cambia a la otra lista de lo que está por clasificar.',
    'btn-sueltos-visto': 'Quita el aviso de documentos nuevos: ya has mirado los que había.',
    'btn-correos-sin-clasificar': 'Enseña u oculta los correos que aún no están en ningún asunto.',
    'btn-grupo-nuevo': 'Crea un solo asunto para varias personas a la vez, como un grupo.',
    'guia-resumen-nuevo': 'Enseña u oculta los hitos que tiene este tipo de asunto.',
    'ir-a-ajustes': 'Abre Ajustes para completar la guía, los campos y las plantillas de un tipo.',
    'btn-crear': 'Crea la carpeta del asunto con el nombre que ves abajo y abre su ficha.',
    'control-registro-abrir': 'Abre la pantalla que compara los listados de Séneca con los asuntos.',
    'actividades-abrir': 'Abre la lista de actividades extraescolares.',
    'etiquetas-abrir': 'Abre la pantalla para imprimir etiquetas de alumnado o de personal.',
    'plantillas-abrir': 'Abre la lista de plantillas de Word y de correo.',
    'btn-vaciar-registro': 'Borra del todo la lista de lo que se ha borrado. No se puede deshacer.',
    'copias-enlace-restaurar': 'Va al apartado donde se elige una copia de seguridad para recuperarla.',
    'btn-anadir-grupo': 'Crea una lista de personas para usarla como destinatarios en copia oculta.',
    'plantillas-guardar-firma': 'Guarda la firma y los datos del centro que salen en los documentos.',
    'membrete-elegir-logo': 'Elige en tu ordenador la imagen del logo para el membrete.',
    'membrete-quitar-logo': 'Quita el logo del membrete. El fichero va a la papelera.',
    'alumnado-enlace-traer': 'Va al apartado donde se trae el alumnado desde la base de datos.',
    'alumnado-enlace-carpeta-bd': 'Va al apartado donde se señala la carpeta de la base de datos de alumnado.',
    'btn-olvidar': 'Olvida las carpetas señaladas y pide elegirlas otra vez.',
    'btn-salir': 'Cierra la sesión y vuelve a la pantalla de entrada.',
  };

  /* ---------- 3. por pestaña (el valor del atributo que las identifica) ---------- */
  var POR_PESTANA = {
    /* La barra de la izquierda (data-pantalla) */
    'pantalla:abiertos': 'Los asuntos abiertos ahora, en pestañas según quién los tiene, con avisos y plazos.',
    'pantalla:encargo-nuevo': 'Pide a Administración que abra un asunto: qué necesitas, a quién afecta y para cuándo.',
    'pantalla:encargos-mios': 'Los encargos que has enviado, con cómo va cada uno.',
    'pantalla:nuevo': 'Abre la carpeta de un asunto nuevo: se elige la persona, el tipo y los datos.',
    'pantalla:archivo': 'Los asuntos ya cerrados, por curso, para buscarlos o reabrirlos.',
    'pantalla:personas': 'Alumnado, personal, empresas y Administraciones, con todos los asuntos de cada una.',
    'pantalla:formularios': 'Los impresos de la Junta y del centro, para rellenarlos con los datos de una persona.',
    'pantalla:cuentas': 'Recuentos para la memoria de fin de curso: asuntos por tipo, por mes y tiempo que llevan.',
    'pantalla:herramientas': 'Papelera, alumnado, tablas de datos, plantillas, etiquetas, actividades y copias de seguridad.',
    'pantalla:ajustes': 'Tipos de asunto, datos del centro, plazos, copias y todo lo que se configura.',
    'pantalla:que-me-toca': 'Lo que te toca hacer a ti ahora, ordenado por plazo.',
    /* Las de Inicio (data-pestana) */
    'inicio:adm': 'Asuntos que están en manos de Administración y hay que mover.',
    'inicio:esp': 'Asuntos que esperan una respuesta o un documento de otra persona.',
    'inicio:todos': 'Todos los asuntos abiertos, estén donde estén.',
    'inicio:liq': 'Asuntos que hay que liquidar antes de archivarlos.',
    /* Las de Ajustes (data-ajustes-pestana) */
    'ajustes:dia': 'Los tipos de asunto: crearlos, ordenarlos y completar su guía, campos y plantillas.',
    'ajustes:centro': 'Los datos del centro: plazos, cargos, membrete, firma, impresos y copias de seguridad.',
    'ajustes:ordenador': 'Lo que solo vale en este ordenador: carpetas señaladas, Séneca y solo consulta.',
    'ajustes:problemas': 'Cosas que la aplicación ha detectado y que conviene arreglar, con el botón para hacerlo.',
    /* Las tarjetas de la ficha de un asunto (data-tarjeta) */
    'tarjeta:trabajo': 'Los hitos del asunto y los documentos de su carpeta.',
    'tarjeta:actividad': 'Los datos de la actividad extraescolar y el aviso al claustro.',
    'tarjeta:candidaturas': 'Las candidaturas presentadas a estas elecciones.',
    'tarjeta:contacto': 'Teléfonos, correos y datos de la persona de este asunto.',
    'tarjeta:tramite': 'Los campos propios de este tipo de asunto, con sus valores.',
    'tarjeta:notas': 'El registro del asunto: notas y todo lo que ha ido pasando, con su fecha.',
    'tarjeta:otros': 'Los demás asuntos, abiertos y cerrados, de la misma persona o entidad.',
    'tarjeta:relacionados': 'Las personas y entidades que también tienen que ver con este asunto.',
    'tarjeta:hoja': 'Elige el modelo de hoja de etiquetas y las casillas ya gastadas.',
    'tarjeta:diseno': 'Elige o cambia lo que se escribe en cada etiqueta.',
    'tarjeta:orden': 'Elige en qué orden salen las etiquetas.'
  };

  /* ---------- 4. por rótulo (en minúsculas, sin números ni flechas) ---------- */
  var POR_ROTULO = {
    /* pestañas con rótulo (las de Control del registro, Etiquetas, Plantillas, Cuentas…) */
    'entrada': 'Los apuntes de entrada del registro de Séneca.',
    'salida': 'Los apuntes de salida del registro de Séneca.',
    'alumnado': 'Hace las etiquetas de las personas del alumnado.',
    'personal': 'Hace las etiquetas del personal del centro.',
    'word': 'Las plantillas de documentos de Word.',
    'correo': 'Las plantillas de correo.',
    'el original': 'El documento tal como estaba, para compararlo.',
    'con la plantilla nueva': 'Cómo queda el documento con los huecos de la plantilla.',
    'trabajo': 'Los hitos del asunto y los documentos de su carpeta.',
    'la actividad': 'Los datos de la actividad extraescolar y el aviso al claustro.',
    'candidaturas': 'Las candidaturas presentadas a estas elecciones.',
    'datos y contacto': 'Teléfonos, correos y datos de la persona de este asunto.',
    'campos del asunto': 'Los campos propios de este tipo de asunto, con sus valores.',
    'registro': 'El registro del asunto: notas y todo lo que ha ido pasando, con su fecha.',
    'otros asuntos de este tercero': 'Los demás asuntos, abiertos y cerrados, de la misma persona o entidad.',
    'personas y entidades relacionadas': 'Las personas y entidades que también tienen que ver con este asunto.',
    'inicio': 'Los asuntos abiertos ahora, en pestañas según quién los tiene, con avisos y plazos.',
    'nuevo encargo': 'Pide a Administración que abra un asunto: qué necesitas, a quién afecta y para cuándo.',
    'mis encargos': 'Los encargos que has enviado, con cómo va cada uno.',
    'nuevo asunto': 'Abre la carpeta de un asunto nuevo: se elige la persona, el tipo y los datos.',
    'archivo': 'Los asuntos ya cerrados, por curso, para buscarlos o reabrirlos.',
    'personas y empresas': 'Alumnado, personal, empresas y Administraciones, con todos los asuntos de cada una.',
    'impresos': 'Los impresos de la Junta y del centro, para rellenarlos con los datos de una persona.',
    'cuentas': 'Recuentos para la memoria de fin de curso: asuntos por tipo, por mes y tiempo que llevan.',
    'herramientas': 'Papelera, alumnado, tablas de datos, plantillas, etiquetas, actividades y copias de seguridad.',
    'ajustes': 'Tipos de asunto, datos del centro, plazos, copias y todo lo que se configura.',
    'salir': 'Cierra la sesión y vuelve a la pantalla de entrada.',
    'lo de cada día': 'Los tipos de asunto: crearlos, ordenarlos y completar su guía, campos y plantillas.',
    'el centro': 'Los datos del centro: plazos, cargos, membrete, firma, impresos y copias de seguridad.',
    'este ordenador': 'Lo que solo vale en este ordenador: carpetas señaladas, Séneca y solo consulta.',
    'problemas': 'Cosas que la aplicación ha detectado y que conviene arreglar, con el botón para hacerlo.',

    /* Inicio y listas */
    'actualizar': 'Vuelve a leer las carpetas para poner al día la lista con lo que haya cambiado.',
    'filtros': 'Enseña u oculta los desplegables para quedarte solo con algunos asuntos.',
    'exportar': 'Saca a una hoja de cálculo o a un informe lo que se ve.',
    'exportar la lista': 'Saca a una hoja de cálculo o a un PDF lo que se ve.',
    'excel': 'Guarda la lista en una hoja de cálculo.',
    'pdf': 'Prepara un informe en PDF con la lista.',
    'hoja de cálculo': 'Guarda la lista en una hoja de cálculo.',
    'informe en pdf': 'Prepara un informe en PDF con la lista que ves.',
    'quitar': 'Quita esto de la lista. Lo demás no se toca.',
    'liquidar': 'Pide la fecha y quién entrega y recibe, guarda el PDF de liquidación y archiva el asunto.',
    'restablecer columnas': 'Devuelve las columnas de la tabla a su orden y anchura de siempre.',
    'ya los he visto': 'Quita el aviso de documentos nuevos: ya has mirado los que había.',
    'elegir carpeta': 'Señala en tu ordenador la carpeta de este apartado.',
    'volver a elegir las carpetas': 'Olvida las carpetas señaladas y pide elegirlas otra vez.',
    'ver todo': 'Enseña todos, no solo los últimos.',
    'ver más grande': 'Abre el documento en grande para leerlo mejor.',
    'ver mapa': 'Enseña todos los hitos de la guía de un vistazo, con sus tareas.',
    'cerrar el mapa': 'Quita el mapa de hitos y vuelve a la edición.',
    'ver': 'Enseña su contenido sin cambiar nada.',
    'ver todas las plantillas': 'Quita el filtro y enseña todas las plantillas.',
    'ver todo lo que tengo': 'Enseña los datos que hay ahora mismo en este ordenador.',
    'es para un grupo de personas': 'Crea un solo asunto para varias personas a la vez, como un grupo.',
    'otra persona': 'Elige a otra persona distinta para este asunto.',
    'pegar una lista': 'Pega una lista de nombres desde otro documento y los reconoce.',
    'reconocer': 'Busca en las listas del centro a quién corresponde cada nombre pegado.',
    'usar esta lista': 'Usa la lista de personas elegida para las etiquetas.',
    'señalar': 'Marca como elegidos los nombres reconocidos.',
    'ninguna': 'Desmarca todas las opciones.',
    'marcar todas': 'Marca todas las casillas de la lista.',
    'desmarcar todas': 'Quita la marca de todas las casillas.',
    'marcar todos': 'Marca todas las personas de la lista.',
    'desmarcar todos': 'Quita la marca de todas las personas.',

    /* Fichas y asuntos */
    'añadir nota': 'Escribe una nota que queda apuntada en el registro del asunto.',
    'añadir documento': 'Añade un documento a este asunto desde una plantilla o desde tu ordenador.',
    'añadir un hito': 'Añade un hito nuevo a la guía de este tipo de asunto.',
    'añadir línea': 'Añade una línea más a la lista.',
    'añadir respuesta': 'Añade una opción de respuesta a la pregunta.',
    'añadir una tarea': 'Añade una tarea más a este hito.',
    'añadir campo': 'Añade un campo propio a este tipo de asunto.',
    'añadir un campo': 'Añade un dato más a los que pide este documento.',
    'añadir relacionado': 'Apunta una persona o entidad más que tenga que ver con este asunto.',
    'añadir relacionados': 'Apunta varias personas o entidades que tienen que ver con este asunto.',
    'añadir varios': 'Apunta de una vez varias personas o entidades relacionadas.',
    'añadir referencia': 'Añade una cita de normativa a este hito.',
    'añadir algo que falte': 'Añade a la lista un papel o dato que hay que reunir antes de seguir.',
    'añadir candidatura': 'Apunta una candidatura nueva a estas elecciones.',
    'añadir persona': 'Añade una persona a la lista de este perfil.',
    'añadir personas': 'Añade personas al grupo.',
    'añadir profesorado': 'Añade profesorado a la actividad.',
    'añadir a alguien de otra unidad': 'Apunta a alguien que no es del grupo elegido.',
    'añadir a alguien que ya no está en el centro': 'Apunta a alguien que dejó el centro pero participó.',
    'añadir ficheros del consejo escolar': 'Añade los ficheros del Consejo Escolar a las tablas de datos.',
    'añadir una época': 'Añade un periodo del año con su propio plazo de aviso.',
    'añadir': 'Añade lo escrito a la lista.',
    'hecha': 'Marca la tarea como hecha.',
    'hacer este hito': 'Abre la mesa de trabajo del hito, con sus tareas y sus documentos.',
    'dejar de esperar': 'Quita la espera: el asunto vuelve a estar en nuestras manos.',
    'no ha llegado nada': 'Apunta que todavía no ha llegado lo que esperábamos y sigue esperando.',
    'esperando el pdf sellado': 'Queda pendiente del PDF con el sello de registro.',
    'cambiar': 'Cambia este dato.',
    'cambiar los datos': 'Cambia los datos de esta persona o entidad.',
    'cambiarle el nombre': 'Cambia el nombre de esta entidad.',
    'cambiar de rama': 'Elige otra rama de la guía para este asunto.',
    'cambiar el nombre': 'Cambia el nombre del documento.',
    'cambiar la plantilla': 'Elige otra plantilla de correo para este envío.',
    'borrar': 'Borra esto. Va a la papelera, de donde se puede recuperar.',
    'borrar este modelo': 'Borra el modelo de hoja de etiquetas.',
    'copiar': 'Copia el texto para pegarlo en otro sitio.',
    'copiar el nombre': 'Copia el nombre para pegarlo en otro sitio.',
    'copiar nombre': 'Copia el nombre del documento, sin la extensión.',
    'copiar la ruta': 'Copia la ruta de la carpeta para pegarla donde la necesites.',
    'copiar la lista': 'Copia la lista de direcciones para pegarla en el correo.',
    'copiar el siguiente': 'Copia el siguiente grupo de direcciones.',
    'copiar la tabla': 'Copia la tabla para pegarla en un documento o una hoja.',
    'copiar los nombres': 'Copia los nombres de las personas para pegarlos en otro sitio.',
    'copiar asunto': 'Copia el asunto del correo.',
    'copiar cuerpo': 'Copia el texto del correo.',
    'copiar para': 'Copia las direcciones de los destinatarios.',
    'copiarlo tal cual': 'Pega el texto en el hueco sin cambiarlo.',
    '1. copiar el asunto': 'Copia el asunto del mensaje para pegarlo en Séneca.',
    '2. copiar el texto': 'Copia el texto del mensaje para pegarlo en Séneca.',
    'guardar pdf': 'Guarda el documento como PDF en la carpeta del asunto.',
    'guardar como otra': 'Guarda esta plantilla con otro nombre, sin tocar la original.',
    'guardar como plantilla nueva': 'Guarda el texto como una plantilla nueva para usarla otras veces.',
    'guardar días no lectivos': 'Guarda los días que no cuentan para los plazos.',
    'guardar festivos': 'Guarda los festivos que no cuentan para los plazos.',
    'guardar el diseño': 'Guarda el diseño de etiqueta para usarlo otras veces.',
    'guardar el modelo': 'Guarda el modelo de hoja para usarlo otras veces.',
    'guardar en el asunto': 'Guarda la nota en la carpeta del asunto.',
    'guardar y copiar': 'Guarda la ruta y la copia para pegarla.',
    'imprimir': 'Abre la ventana de impresión con lo que ves.',
    'imprimir etiquetas': 'Prepara las etiquetas de las personas del grupo.',
    'enviar': 'Envía el correo con lo que has escrito.',
    'enviar el encargo': 'Manda el encargo a Administración.',
    'enviar estado': 'Envía por correo cómo va el asunto.',
    'enviar por correo': 'Prepara un correo con este documento adjunto.',
    'enviar un aviso': 'Prepara un aviso por correo para las personas del grupo.',
    'confirmar y enviar': 'Envía el correo a quienes aparecen en la lista.',
    'confirmar y repartir': 'Reparte los trozos del PDF entre los terceros elegidos.',
    'comunicar': 'Elige cómo avisar: correo, mensaje de Séneca u otro.',
    'mensaje de séneca': 'Prepara el mensaje para copiarlo en Séneca.',
    'preparar correo': 'Prepara el correo con los datos de este hito.',
    'pedir lo que falta': 'Prepara el aviso pidiendo lo que aún no ha llegado.',
    'abrir el que ya existe': 'Abre el asunto parecido que ya estaba creado.',
    'abrir en gmail': 'Abre el correo ya redactado en Gmail.',
    'abrir en el correo del ordenador': 'Abre el correo ya redactado en el programa de correo de este ordenador.',
    'abrir para imprimir': 'Abre el documento listo para imprimir.',
    'abrir el control del registro': 'Abre la pantalla que compara los listados de Séneca con los asuntos.',
    'abrir las etiquetas': 'Abre la pantalla para imprimir etiquetas de alumnado o de personal.',
    'abrir las plantillas': 'Abre la lista de plantillas de Word y de correo.',
    'activarlo': 'Vuelve a activar este tipo de asunto, que estaba apartado.',
    'actualizar el catálogo': 'Vuelve a leer la lista de impresos por si hay alguno nuevo.',
    'adjuntar documento': 'Adjunta un documento de tu ordenador a la nota.',
    'ancho': 'Ajusta el documento al ancho de la columna.',
    'fuera': 'Abre el documento en otra pestaña del navegador.',
    'anular la actividad': 'Marca la actividad como anulada. Se puede deshacer.',
    'deshacer la anulación': 'La actividad vuelve a estar en marcha.',
    'apuntar la actividad': 'Guarda la actividad con su fecha y el profesorado elegido.',
    'apuntar los datos de la actividad': 'Guarda los datos de la actividad en su asunto.',
    'apuntar una actividad antigua': 'Apunta una actividad ya hecha, con su grupo y profesorado.',
    'asignarlo igualmente': 'Asigna el trozo a esa persona aunque no coincida.',
    'buscar otra plantilla': 'Busca entre todas las plantillas en lugar de las sugeridas.',
    'con la plantilla nueva': 'Cómo queda el documento con los huecos de la plantilla.',
    'crear': 'Crea lo que has escrito.',
    'crear asunto': 'Crea un asunto con este apunte del registro.',
    'crear plantilla': 'Crea una plantilla de correo con este texto.',
    'crear un campo calculado': 'Crea un campo que se calcula solo a partir de otros.',
    'crear un campo propio': 'Crea un campo para que lo rellene quien tramita.',
    'crear y usar': 'Crea el tipo de documento y lo usa en este documento.',
    'dar de alta una administración': 'Apunta una Administración nueva en las listas del centro.',
    'dar permiso': 'Pide el permiso del navegador para leer esa carpeta.',
    'volver a dar permiso': 'Pide otra vez el permiso del navegador para leer esa carpeta.',
    'departamento': 'Añade un departamento dentro de esta Administración.',
    'dentro': 'Añade un subdepartamento dentro de este.',
    'descartar': 'Descarta lo elegido y sigue sin cambiar nada.',
    'duplicar': 'Hace una copia para poder retocarla sin tocar la original.',
    'elegir': 'Elige esta opción.',
    'elegir datos': 'Elige hasta 3 datos para verlos arriba en todos los asuntos.',
    'elegir otros ficheros': 'Vuelve a elegir qué ficheros se reparten.',
    'empezar de cero': 'Borra la selección actual y empieza de nuevo.',
    'entregar ahora': 'Entrega la lista a la aplicación con lo que hay.',
    'entregar de todos modos': 'Entrega la lista aunque haya avisos pendientes.',
    'entregar la lista vacía de administraciones': 'Entrega la lista sin Administraciones, tal como está.',
    'entregar la lista vacía de empresas': 'Entrega la lista sin empresas, tal como está.',
    'es de este asunto': 'Une este apunte del registro a un asunto concreto.',
    'es un documento nuevo': 'Este sello es de un documento nuevo, no de uno ya registrado.',
    'esta clase nunca lleva asunto': 'Los apuntes de esta clase no se vuelven a pedir con asunto.',
    'generar documento': 'Saca un documento de una plantilla con los datos de este asunto.',
    'generar igualmente': 'Genera el documento aunque falten datos.',
    'generar para todos': 'Genera el documento de todas las personas del grupo a la vez.',
    'hito': 'Crea, cambia o borra el hito.',
    'insertar hueco': 'Pone en el texto un hueco que se rellena con un dato del asunto.',
    'leer las casillas del pdf': 'Lee del PDF qué casillas se pueden rellenar.',
    'mover a otro hito': 'Cambia el documento al hito que elijas.',
    'no es de este trabajo': 'Este apunte no pertenece a este asunto.',
    'no es un registro': 'Este sello no es de registro de Séneca.',
    'no está en la lista': 'Escribe el nombre a mano si la persona no aparece.',
    'no lo uso en este ordenador': 'Apunta que este ordenador no usa esta comprobación.',
    'no necesita asunto': 'Marca los apuntes de esta clase como que no necesitan asunto.',
    'no son el mismo': 'Mantén los dos tipos separados: no se vuelve a preguntar.',
    'nueva actividad': 'Apunta una actividad extraescolar nueva.',
    'nueva plantilla': 'Crea una plantilla nueva desde cero.',
    'nuevo diseño': 'Crea un diseño de etiqueta desde cero.',
    'nuevo modelo': 'Crea un modelo de hoja de etiquetas desde cero.',
    'olvidarla': 'Olvida la carpeta señalada.',
    'ordenar versiones previas': 'Pasa a su subcarpeta los borradores antiguos del documento.',
    'parar': 'Detiene el envío cuando acabe el correo en curso.',
    'pasar los marcados': 'Pasa a la lista del centro los elementos marcados.',
    'poner': 'Pone el enlace en el texto seleccionado.',
    'poner al día ahora': 'Vuelve a construir ahora la base de datos de la aplicación.',
    'probar': 'Manda un correo de prueba a tu dirección.',
    'probar con otro': 'Prueba la fórmula con otro asunto de ejemplo.',
    'quitar el dato': 'Quita el valor escrito en este campo.',
    'quitar este hito': 'Quita este hito de la guía de este asunto.',
    'quitar formato': 'Deja el texto seleccionado sin negrita ni viñetas.',
    'quitar la lista': 'Quita la lista de personas elegida.',
    'quitar todos los huecos': 'Vuelve a dejar todas las casillas de la hoja como libres.',
    'reconstruir el índice': 'Vuelve a leer las carpetas para rehacer el índice de fichas.',
    'registrar': 'Da registro de entrada o de salida a este documento.',
    'repartir': 'Reparte el PDF en trozos entre terceros.',
    'retocar': 'Abre la plantilla para cambiar su texto y sus huecos.',
    'seguir': 'Continúa con lo elegido.',
    'seguir eligiendo': 'Vuelve a la lista para marcar más.',
    'señalar la carpeta': 'Señala en tu ordenador la carpeta de la base de datos.',
    'solo en esta': 'Aplica el cambio solo a esta plantilla.',
    'subir listados de séneca': 'Sube los listados de entrada y salida que bajaste de Séneca.',
    'sustituir el fichero': 'Pon otro fichero en lugar del actual.',
    'sustituirlo': 'Cambia la lista guardada por esta.',
    'traer ahora del centro de datos': 'Trae ahora los datos desde el Centro de datos.',
    'traer el alumnado': 'Trae el alumnado desde la base de datos del centro.',
    'traer el alumnado ahora': 'Trae el alumnado desde la base de datos del centro.',
    'traer las tareas del instituto': 'Trae las guías y tareas ya preparadas por el instituto.',
    'traer un hito de otro tipo': 'Copia aquí un hito de la guía de otro tipo de asunto.',
    'traer un word del ordenador': 'Elige un documento de Word de tu ordenador como plantilla.',
    'traerlas': 'Trae las cosas que faltan a la lista.',
    'traerlo': 'Trae ese dato ahora.',
    'unir': 'Une los dos tipos en uno solo, sin perder asuntos.',
    'unir con él': 'Une este tipo con el que ya existía con ese nombre.',
    'usarlo': 'Usa este texto en el hueco.',
    'usar este': 'Usa este tipo ya existente en lugar de crear uno.',
    'verlo': 'Enseña el asunto que ya existe con ese nombre.',
    'vista': 'Cómo quedaría la nota al guardarla.',
    'volver a activar': 'Vuelve a poner esta plantilla en uso.',
    'volver a empezar': 'Borra lo que hayas hecho en la demostración y vuelve a empezar.',
    'volver a leer': 'Vuelve a leer los ficheros de la carpeta.',
    'volver a mirar': 'Vuelve a mirar si ya hay datos disponibles.',
    'volver a revisarla': 'Repite la comprobación con los datos de ahora.',
    'ya lo he bajado, vuelve a mirar': 'Repite la comprobación ahora que has bajado el fichero.',
    'viñetas': 'Convierte las líneas seleccionadas en una lista con viñetas.',
    'enlace': 'Pone un enlace en el texto seleccionado.',
    'a quién va cada plantilla': 'Elige qué plantillas usa cada tipo de asunto y a quién van.',
    'dejar fuera de uso': 'Deja de ofrecer esta plantilla. Se puede volver a activar.',
    'poner al día': 'Pone al día lo que se ve.',
  };

  /* ---------- 5. los botones apagados: por qué y qué hay que hacer ---------- */
  var TEXTO_CONSULTA = 'Este ordenador está en «solo consulta»: se puede mirar, pero no cambiar nada.';
  var TEXTO_OCUPADO = 'Espera un momento: se está haciendo ahora mismo.';
  var TEXTO_GENERAL = 'Ahora no se puede: falta algo por rellenar o elegir en esta pantalla.';

  var MOTIVOS = {
    'actividad-anulada': 'La actividad está anulada: primero hay que deshacer la anulación.',
    'en-solo-consultar': 'Este ordenador no puede cambiar nada: ábrelo desde el ordenador del centro para pasar las carpetas a Drive.',
    'plantilla-de-la-app-borrar': 'La aplicación vuelve a crear esta plantilla sola: no se puede borrar.',
    'plantilla-de-la-app-fuera': 'La aplicación necesita esta plantilla para avisar a quien lo pide: no se puede dejar fuera.',
    'sin-correo-de-tutores': 'La familia no tiene ningún correo apuntado: añade uno en su ficha.',
    'consulta': TEXTO_CONSULTA
  };

  var MOTIVO_POR_ID = {
    'inicio-liquidar-boton': 'Marca antes algún asunto para poder liquidarlo.',
    'btn-crear': 'Rellena antes lo que falta: la persona, el tipo de asunto y su descripción.',
    'lp-senalar': 'Marca antes algún nombre de la lista.',
    'base-boton': 'Ya se está poniendo al día: espera a que termine.',
    'doc-guardar': 'El nombre del documento tiene que tener al menos 10 letras y caber en la ruta.',
    'btn-vaciar-registro': 'No hay nada que vaciar: el registro está vacío.',
    'copias-enlace-restaurar': 'Todavía no hay ninguna copia de seguridad que restaurar.',
    'act-avisar': 'La actividad está anulada: primero hay que deshacer la anulación.'
  };
  var MOTIVO_POR_ROTULO = {
    'liquidar': 'Marca antes algún asunto para poder liquidarlo.',
    'aceptar': 'Falta algo por rellenar o elegir en este cuadro.',
    'crear': 'Escribe antes el nombre y comprueba que no está repetido.',
    'enviar': 'Falta algo por rellenar o elegir antes de enviar.',
    'guardar': 'Falta algo por rellenar o cambiar antes de guardar.',
    'guardar pdf': 'Elige antes la carpeta donde guardarlo.',
    'repartir': 'Elige antes los ficheros y a quién va cada trozo.',
    'añadir': 'Escribe o elige antes lo que quieres añadir.',
    'subir': 'Ya es el primero de la lista: no se puede subir más.',
    'bajar': 'Ya es el último de la lista: no se puede bajar más.',
    '↑': 'Ya es el primero de la lista: no se puede subir más.',
    '↓': 'Ya es el último de la lista: no se puede bajar más.',
    '◀': 'Ya estás en el primero.',
    '▶': 'Ya estás en el último.',
    'retocar': 'El fichero de la plantilla no está en la carpeta de plantillas.',
    'borrar': 'Este elemento no se puede borrar ahora.',
    'enviar estado': 'Falta el correo de la persona a la que se envía.',
    'poner al día ahora': 'Ya se está poniendo al día: espera a que termine.',
    'pasar los marcados': 'Marca antes algún elemento de la lista.',
    'restaurar': 'Elige antes una copia de seguridad.'
  };

  /* ---------- la búsqueda ---------- */

  function limpio(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  /* El rótulo de un botón: lo que se lee, sin cifras, paréntesis, flechas ni signos de los extremos. */
  function rotulo(el) {
    var t = limpio(el.textContent);
    t = t.replace(/\([^)]*\)/g, ' ').replace(/\b\d+\b/g, ' ');
    t = t.replace(/^[←→↑↓▲▼◀▶✕×+\-–−⋮⋯⧉⚑📎✎💬\s]+(?=\S)/, '');
    t = t.replace(/[▾▸▼▲\s]+$/g, '').replace(/[.:…]+$/, '');
    t = limpio(t).toLowerCase();
    return t;
  }

  /* El rótulo de un botón de solo un símbolo: el propio símbolo. */
  function simbolo(el) {
    var t = limpio(el.textContent);
    return /^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]{1,3}$/.test(t) ? t : '';
  }

  function esDeLaPestana(el) {
    var d = el.dataset || {};
    if (d.pantalla) return 'pantalla:' + d.pantalla;
    if (d.pestana && el.classList.contains('inicio-pestana')) return 'inicio:' + d.pestana;
    if (d.ajustesPestana) return 'ajustes:' + d.ajustesPestana;
    if (d.tarjeta && el.tagName === 'BUTTON') return 'tarjeta:' + d.tarjeta;
    return '';
  }

  function parecePestana(el) {
    var c = el.className;
    return typeof c === 'string' && /(^|[\s-])pestana(s)?([\s-]|$)|pestana-categoria|ficha-pestana|\bcr-pestana\b|\bpt-pestana\b|\bet-pestana\b|\bcep-pestana\b/.test(c);
  }

  /* ¿Es un elemento al que le toca recuadro por su cuenta (botón, pestaña, símbolo…)? */
  function esBoton(el) {
    return el.tagName === 'BUTTON' || el.tagName === 'SUMMARY' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab';
  }

  function esObvio(el) {
    var r = rotulo(el);
    if (!r) return false;
    if (OBVIOS.indexOf(r) !== -1) return true;
    return /^volver( a (inicio|la lista|herramientas|ver todo|la lista de documentos))?$/.test(r);
  }

  /* El texto de ayuda de un elemento apagado o no. Para uno apagado, el `data-ayuda` es el MOTIVO (lo pone js/ayuda-raton.js). */
  function de(el, apagado) {
    if (!el || el.nodeType !== 1) return '';
    var clave = el.getAttribute('data-ayuda-clave');
    if (clave && TEXTOS[clave]) return TEXTOS[clave];
    var propio = el.getAttribute('data-ayuda');
    if (!esBoton(el) && !parecePestana(el)) return apagado ? '' : (propio || '');
    if (el.id && POR_ID[el.id]) return POR_ID[el.id];
    var p = esDeLaPestana(el);
    if (p && POR_PESTANA[p]) return POR_PESTANA[p];
    if (esObvio(el)) return '';   /* el recuadro no sale en «Guardar», «Cancelar», «Cerrar»… aunque hoy lleven ayuda gris */
    if (propio && !apagado) return propio;
    if (el.closest && el.closest('#pestanas-tipos') && parecePestana(el)) return TEXTO_CATEGORIA;
    var r = rotulo(el);
    if (r && POR_ROTULO[r]) return POR_ROTULO[r];
    return '';
  }

  function ocupado(el) {
    if (el.dataset && el.dataset.guardando) return true;
    return /…\s*$/.test(limpio(el.textContent)) && /^(guardando|actualizando|enlazando|parando|comprobando|enviando|generando)/i.test(limpio(el.textContent));
  }

  /* Por qué está apagado un botón (o '' si el elemento no es un botón). `dicho` es el motivo que ya trae el propio
     botón (un `data-ayuda` que puso el código); gana a los motivos generales, no a los de «solo consulta», «ocupado»
     ni a los de un botón concreto. */
  function motivo(el, soloConsulta, dicho) {
    if (!esBoton(el) && !parecePestana(el)) return '';
    var d = el.dataset || {};
    if (d.apagadoPorSoloConsulta || d.apagadoPorConsulta) return TEXTO_CONSULTA;
    if (ocupado(el)) return TEXTO_OCUPADO;
    if (el.id && MOTIVO_POR_ID[el.id]) return MOTIVO_POR_ID[el.id];
    var r = rotulo(el), s = simbolo(el);
    if (s && MOTIVO_POR_ROTULO[s]) return MOTIVO_POR_ROTULO[s];
    if (dicho) return dicho;
    if (soloConsulta) return TEXTO_CONSULTA;
    if (r && MOTIVO_POR_ROTULO[r]) return MOTIVO_POR_ROTULO[r];
    return TEXTO_GENERAL;
  }

  return {
    de: de,
    motivo: motivo,
    rotulo: rotulo,
    TEXTOS: TEXTOS,
    POR_ID: POR_ID,
    POR_PESTANA: POR_PESTANA,
    POR_ROTULO: POR_ROTULO,
    MOTIVOS: MOTIVOS,
    MOTIVO_POR_ID: MOTIVO_POR_ID,
    MOTIVO_POR_ROTULO: MOTIVO_POR_ROTULO,
    TEXTO_CATEGORIA: TEXTO_CATEGORIA,
    TEXTO_CONSULTA: TEXTO_CONSULTA,
    TEXTO_OCUPADO: TEXTO_OCUPADO,
    TEXTO_GENERAL: TEXTO_GENERAL,
    OBVIOS: OBVIOS
  };
})();
