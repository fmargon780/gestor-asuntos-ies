# Comprobar a mano

Fila 69 de la cola (`docs/PRUEBAS-QUE-FALTAN.md`, 3). Lo que ninguna prueba automática cubre, y
Francisco tiene que mirar antes de dar por buena una publicación importante. En forma de lista,
para ir tachando.

---

- [ ] **Persona de las listas con el asunto real (fila 435, `docs/DOCUMENTOS-CON-PERSONA-Y-LINEA-DE-DATOS.md`, parte A).**
      En Ajustes → Tipos de documento → JUSTIFICANTE → Campos del nombre, añade el campo «Alumno» de clase
      «Persona de las listas» (Alumnado). En el asunto de transporte de Nicolás Amortegui (A26-0464), nombra un
      JUSTIFICANTE y escribe «Amortegui»: sale Nicolás y se elige con un clic. Si eliges a otra persona de las
      listas, al guardar sale en «Personas y entidades relacionadas»; Nicolás, que es el titular, no se repite.
      [SOLO FRANCISCO]

- [ ] **Comprobación al entrar, con lo de verdad (fila 204, `docs/COMPROBACION-AL-ENTRAR.md`).**
      (1) Con las carpetas de Dropbox y la bandeja de verdad: quitar el permiso de la carpeta de la
      bandeja en Chrome y recargar; al entrar, la bandeja sale en «Falta» y «Arreglarlo» lleva al
      bloque de la bandeja en Ajustes › Mantenimiento. (2) En la copia sin internet
      (`ABRIR EL GESTOR.html`) aparece la fila «Copia sin internet al día»; en la web, no.
- [ ] **El sonido del aviso del tablón (fila 372, `docs/TABLON-AVISO-A-HORA-FIJA.md`).** En el ordenador del instituto, con el sonido encendido: pegar una nota con hora de dos o tres minutos más tarde y «a la hora justa», y pulsar en cualquier parte de la página. Ver: a la hora sale la ventana «Aviso del tablón» y suena un pitido corto; sin pulsar nada antes, sale sin sonido.
- [ ] **La ruta copiada por el botón «Ruta», en el ordenador del instituto (fila 227,
      `docs/RUTA-NORMAL-DE-WINDOWS.md`).** Pulsar «Ruta» en la ficha de un asunto (o en el cuadro
      de Correo o de Séneca) y pegar lo copiado en la barra del explorador de archivos de Windows,
      y también en la ventana «Abrir archivo» al adjuntar en Séneca. Ver: que en los dos sitios se
      abre la carpeta de verdad, sin buscar nada ni dar error.
- [ ] **El ayudante de Séneca, contra Séneca de verdad.** Pulsarlo dentro de un mensaje de Séneca
      de verdad, con una lista de destinatarios copiada. Ver: que los destinatarios entran uno a
      uno, y que al final dice bien quién se ha quedado sin entrar (si alguno).
- [ ] **El largo del asunto de un correo o mensaje de Séneca.** Mandar uno con el asunto más
      largo que prepara la aplicación (con curso, tipo y tercero largos) y comprobar que
      Comunicaciones de Séneca lo acepta entero, sin cortarlo.
- [ ] **"Ajustar tamaño" con un documento registrado de verdad.** Comprobar que la banda de arriba
      (sello de registro de Séneca) y la de abajo (firma de AutoFirma) quedan libres de texto. Y
      qué pasa si se ajusta el tamaño de un PDF que ya venía firmado digitalmente: si la firma se
      invalida al tocarlo.
- [ ] **Un archivado con Dropbox sincronizando de verdad**, no con el disco de mentira de las
      pruebas: que la carpeta llega entera al otro ordenador, con todos sus documentos.
- [ ] **Los dos ordenadores guardando a la vez en el mismo asunto.** Que sale el aviso de "el
      compañero está dentro" en el segundo, y que si Dropbox deja una copia en conflicto, se
      fusiona sola (`js/conflictos.js`) la próxima vez que se entra.
- [ ] **El script de Google, con un correo de verdad.** Que recoge uno con adjuntos y deja su
      ficha en `GESTOR-BANDEJA`.
- [ ] **Conectar el envío de verdad (fila 115, 24-sep-2026, `docs/ENVIAR-DESDE-EL-ASUNTO.md`), con
      la cuenta del centro.** Nadie ha podido probar esto con una cuenta de Google real: no existe
      ninguna en el entorno donde se escribió el código. Cinco pasos, en Ajustes → Mantenimiento →
      "Enviar correo":
      1. Abrir `script.google.com` con la cuenta del centro, entrar en el proyecto
         «Gestor - Correos».
      2. Copiar el código nuevo desde GitHub (`apps-script/gestor-correos.gs`) y pegarlo en lugar
         del viejo. Guardar.
      3. «Implementar» → «Nueva implementación» → tipo «Aplicación web», ejecutar como «Yo»,
         acceso «Cualquier usuario». «Implementar» y aceptar los permisos. Si no aparece
         «Cualquier usuario», la cuenta del centro no deja publicar así y el envío no puede
         funcionar: decírselo a Claude (con «Cualquier usuario de la organización» Google pide
         iniciar sesión y la llamada desde el navegador falla siempre).
      4. Copiar la URL de «Implementar» → «Gestionar implementaciones» (termina en `/exec`; la
         que termina en `/dev` es la de pruebas y no sirve). Después elegir `prepararEnvio` en el
         desplegable de arriba y pulsar «Ejecutar»: solo sirve para sacar la clave, que sale en el
         registro de ejecución.
      5. Pegar en el cuadro de Ajustes `URL?k=clave` y pulsar «Probar».
      Cada vez que se pegue código nuevo en el script: «Gestionar implementaciones» → lápiz →
      Versión: «Nueva versión» → «Implementar» (fila 117). Así la dirección no cambia y no hay que
      volver a pegarla en Ajustes.
      Ver: que llega un correo de prueba a la bandeja de entrada. Después, mandar uno de verdad
      desde el cuadro de Correo de un asunto, con un documento adjunto marcado: comprobar que el
      resumen sale bien, que "Confirmar y enviar" dice "Correo enviado a…", que el correo llega de
      verdad con el documento enganchado, y que si el asunto ya tenía un hilo con ese mismo
      destinatario, responde dentro de él en vez de abrir uno nuevo.
- [ ] **La aplicación desde la red del IES.** Entrar en `https://asuntos.fmargon.com` desde un
      ordenador del centro (no desde casa): que carga y que `vercel.app` sigue bloqueado, para
      confirmar que hace falta el dominio propio.
- [ ] **Las librerías de PDF, una vez al año** (fila 72, docs/DETALLES-DE-MANTENIMIENTO.md, punto
      5). `pdf.js` (`js/lib/pdf.min.mjs`) va por la 4.2.67; `pdf-lib` (`js/lib/pdf-lib.min.js`) por
      la 1.17.1, la última que hay (sin mantenimiento activo desde hace más de un año, según
      npm). Mirar si ha salido una versión nueva con avisos de seguridad de por medio, y si los
      hay, cambiarla y probar a fondo: leer el sello de un PDF registrado
      (`pruebas/registro-lector-navegador.mjs`), las miniaturas de separar/unir
      (`pruebas/separar-unir-navegador.mjs`) y "Ajustar tamaño" (a mano, más arriba en esta
      lista). Solo pdf.js va como módulo (`import()`); si algún día pdf-lib hiciera lo mismo, el
      cambio de `<script>` a `import()` en `js/pdf-herramientas.js` sería igual que el que ya se
      hizo para pdf.js.
- [ ] **La base de datos de alumnado, desde la carpeta de Drive (filas 142 y 144, 25-sep-2026,
      `docs/ALUMNADO-BD-DESDE-DRIVE.md`).** Las pruebas usan alumnos inventados y una carpeta de
      mentira. En el ordenador que tiene Google Drive para ordenador:
      1. Comprobar que la carpeta «Datos de matrícula» de Drive se ve en el Explorador de Windows y
         que tiene dentro `ALUMNADO-BD.json` (lo deja la base de datos al «Actualizar los datos»).
      2. En el gestor, Ajustes → El centro → «Carpeta de la base de datos de alumnado» → «Señalar la
         carpeta», y elegir «Datos de matrícula». Debajo tiene que decir cuántos alumnos y datos trae
         y de qué fecha.
      3. Abrir la ficha de un alumno → «Ver todo»: deben salir sus tarjetas por apartado (plegadas),
         con la fecha al pie. En el otro ordenador (sin carpeta señalada), igual, desde la copia.
      4. En un asunto, «Añadir relacionados» → Alumnado → «Por datos del alumnado»: elegir Curso y
         Centro de procedencia y comprobar que salen los que deben.

## Fila 203 (papelera que se vacía sola)

- [ ] Con la carpeta real de Dropbox en dos ordenadores a la vez: que no se pisen al vaciar la papelera
  (cada uno relee `papelera.json` antes de borrar) y que `papelera-borrados.json` viaje bien.

## Fila 239 (nombres fijos con número)

- [ ] Con sus carpetas reales de Dropbox, guardar el documento que le dio el error «El nombre no cabe en la
  ruta de Dropbox»: se guarda sin aviso rojo (se llama `AAMMDD TIPO D26-NNNNN.ext`) y Ajustes → El centro →
  «Largo de las rutas» enseña el margen real (en verde, o el aviso de qué ocupa más). Mirar también, con dos
  ordenadores a la vez, que crear un asunto en cada uno da números distintos.

## Por qué esta lista y no una prueba automática

Todas las pruebas de navegador de este repositorio sustituyen el acceso a carpetas por uno de
mentira en memoria (`pruebas/navegador.mjs` y los discos de mentira de cada fichero de prueba).
Eso prueba bien **cómo reacciona** la aplicación a un fichero que falta, a una copia a medias o a
un permiso perdido — pero no prueba que Dropbox, Séneca o Google **de verdad** se comporten como
se espera. Eso solo se ve entrando de verdad, y por eso esta lista existe: no para sustituir las
pruebas automáticas, sino para cubrir justo lo que ellas no pueden.

## Fila 229 — el registro del asunto (1-oct-2026)

- Abrir un asunto de verdad que ya tuviera notas e historia de antes: están todas en el «Registro» de la ficha, ninguna se ha perdido, y el compañero las ve igual desde su ordenador.

## Fila 241 — exportar asuntos (1-oct-2026)

- Con los datos reales del seguro escolar: en Inicio, Filtros → Tipo de asunto «Seguro escolar» y Fechas del periodo; Exportar ▾ → Informe en PDF, marcar «Incluir también los archivados» y la columna «Importe»: el número de cobros y el total coinciden con lo cobrado.

## Fila 238 — certificado de miembro del Consejo Escolar (1-oct-2026)

- Con los ficheros reales de Séneca (`RegMieConEsc …`) subidos con «Añadir ficheros del Consejo Escolar» (Herramientas → Tablas de datos), generar el certificado de una persona conocida: coincide con la hoja «Consejo Escolar - Historial de miembros 2002-2025» (periodos, cargos y ceses).

## Fila 217 — correo con otra cuenta de Google abierta (1-oct-2026)

- Con la cuenta personal abierta en el navegador, pulsar «Probar» en Ajustes › Enviar correo: debe llegar el correo de prueba; si no, debe salir el aviso claro («Google no ha dejado pasar el envío…»).

## Fila 236 — el correo enviado, en PDF (1-oct-2026)

- Enviar un correo real desde la app: aparece el `CORREO` en el asunto. Cuando el destinatario conteste y la respuesta entre por la bandeja y se guarde en el asunto, aparece el HILO como siempre y el `CORREO` del envío sigue en su sitio.

## Fila 248 — «Qué hay de nuevo» (1-oct-2026)

- Cuando se publique la siguiente tarea con un cambio visible, al recargar sale la ventana solo con esa novedad.

- Fila 249 (Por liquidar): liquidar un asunto reservado de verdad y mirar que en el PDF LIQUIDACION sale «(reservado)» en vez del tercero.

## Fila 254 — añadir un campo desde la ficha (2-oct-2026)

- No se ha podido reproducir el «no pasa nada» que contó Francisco (todas las combinaciones pasan en local). En un asunto real del centro, pulsar «+ Añadir campo» en la tarjeta «Campos del asunto», elegir un campo y guardar: si no se añade, ahora tiene que salir un aviso rojo (o ámbar si tarda) que diga qué ha fallado; contar cuál.

## Fila 255 — campos de un hito (2-oct-2026)

- Con un tipo real, añadir un campo desde la pantalla de un hito, rellenarlo, mirar la ficha (rótulo del hito), exportar con su columna y generar un documento con su hueco: sale igual que un campo del asunto. No se ha probado con datos reales del centro.

## Fila 260 — solo consultar (2-oct-2026)

- En casa, en el Chromebook: marcar «En este ordenador, solo consultar» en la pantalla de entrada, entrar y mirar unos minutos (Inicio, un asunto, un documento). Después, en Drive («Ordenadores» → la carpeta → `_GESTOR`), ningún fichero tiene fecha de modificación posterior a la hora de entrada.


## Fila 259 — control del registro (2-oct-2026)

- Herramientas → «Control del registro»: poner «Revisar desde el día…» y subir los dos listados reales de Séneca (entrada y salida). Comprobar que se leen enteros (eñes y acentos bien) y que los códigos (`26EM0427`…) coinciden con los de los documentos ya registrados en los asuntos. Mirar que «Con asunto» y «Sin asunto» tienen sentido con lo que se conoce. Los documentos de asuntos abiertos anteriores a la fila 239 (registro en el nombre del fichero) no se miran: esos apuntes pueden salir «Sin asunto» aunque el documento exista; se arreglan con «Es de este asunto…».

## Fila 263 — la ruta larga avisa y no impide crear (5-oct-2026)

- En el ordenador del compañero, con la copia sin internet ya actualizada, repetir el asunto del aviso («Ver todo» → «Crear asunto con él», mismo alumno y mismo tipo): se crea sin ninguna línea de aviso.
- Guardar un documento en un asunto de antes de la fila 239 con un nombre que no cabe ni recortando: sigue saliendo su aviso rojo y «Guardar» apagado (no se pudo montar con datos de demostración; el código de documentos no se ha tocado).

## Fila 265 — archivar mide antes la ruta (5-oct-2026)

- En el ordenador del compañero, con la copia sin internet ya actualizada, archivar el asunto del aviso (ADMISION, abierto el 28-sep-2026): o se archiva, o sale el cuadro «No cabe en el archivo» y se archiva tras acortar. Si sale otro mensaje rojo, dirá el paso y el fichero: mandarlo por el botón de soporte.

## Fila 266 — cambiar los datos del tercero desde el asunto (5-oct-2026)

- Con un aspirante real sin Nº escolar y un asunto abierto suyo: escribirle el Nº escolar desde «Cambiar los datos» (en su ficha de Personas o desde la ficha del asunto). Sale «Cambia el nombre de las carpetas», y con «Adelante» cambia solo el asunto abierto y la carpeta suya del archivo; los asuntos archivados de dentro conservan su nombre.

## Fila 272 — datos del tercero junto al nombre del asunto (6-oct-2026)

- Con los datos reales del centro: abrir el asunto de un alumno y ver su unidad de verdad junto al nombre; con «Elegir datos» cambiar los 3 datos de alumnado en un ordenador y comprobar que el compañero, en el otro, los ve igual al recargar. Tampoco se pudo comprobar en la demostración el modo «solo consultar» (el botón se apaga solo, como los demás de la ficha; lo cubre la prueba `datos-favoritos`).

## Fila 277 — tipos de asunto que son el mismo (6-oct-2026)

- En el centro, con los datos reales: al entrar tras publicarse esta fila, o sale la línea verde «ANULACIÓN» era el nombre antiguo de «ANULACIÓN DE MATRÍCULA». Los he unido., o sale en Inicio el aviso de tipos parecidos con esa pareja. Después de unirlos, al elegir tipo solo queda ANULACIÓN DE MATRÍCULA.

## Fila 280 — convertir un documento en plantilla (6-oct-2026)

- Con un documento Word de verdad del centro, guardado en un asunto real: en su menú ⋮, «Convertir en plantilla». Mirar que los huecos propuestos tienen sentido y que en «Con la plantilla nueva» el documento conserva su aspecto (tablas, negritas, sangrías, sellos). No guardar si no convence: «Cancelar» no escribe nada.

## Fila 281 — convertir en plantilla un PDF sin Word (6-oct-2026)

- Con un PDF de verdad del centro firmado con AutoFirma, guardado en un asunto real y sin su Word: «Convertir en plantilla». Mirar que el texto sale entero y en orden, y que los sellos de firma y de registro se proponen en «Quitar».

## Fila 284 — plazos legales en la biblioteca (6-oct-2026)

- En el centro, al abrir la app tras actualizarse, sale una vez la línea verde «Plazos legales puestos en N hitos de M guías…». En Ajustes, la guía de «Reclamación de calificaciones»: «Remitir el expediente a la Delegación Territorial» dice «3 días hábiles desde «Registrar la reclamación a la Delegación»». Si faltan los festivos, sale debajo el aviso ámbar con «Ponerlos».

## Fila 285 — «Hacer este hito» (6-oct-2026)

- En el centro, con un certificado de verdad: «Hacer este hito», firmar, registrar en Séneca y guardar el PDF sellado en la carpeta del asunto. La app lo reconoce sin preguntar y el correo sale preparado con ese PDF.

## Fila 291 — problemas con su solución (7-oct-2026)

- Con los datos del centro: abrir Ajustes → Problemas y decir si con cada tarjeta se entiende qué hacer sin preguntar a nadie.

## Fila 292 — problemas que se pueden arreglar (7-oct-2026)

- Con los datos del centro: si en Ajustes → Problemas hay hitos de asuntos que ya no existen, comprobar con uno que «Parece este:» propone el asunto correcto.

## Fila 294 — el PDF de cada persona y el registro de Séneca (7-oct-2026)

- Con un certificado de verdad de un trabajo en bloque: firmarlo y darle registro de salida en Séneca, descargarlo y guardarlo en la carpeta del asunto. La tabla marca sola a esa persona como registrada. Si no lo hace y el PDF sale en «PDF sellados sin colocar», Séneca no conserva la referencia: decírselo a Claude, con el nombre con el que Séneca da el fichero y si los da de uno en uno o todos juntos.

## Fila 295 — enviar a todas las personas del grupo y los avisos (7-oct-2026)

- En el centro, con un grupo de verdad de dos o tres personas (por ejemplo, tú y tu compañero como personal): «Enviar un aviso…» y comprobar que a cada uno le llega su correo, con su nombre, y que al contestar la respuesta llega a quien lo envió.

## Fila 296 — formar un grupo pegando una lista (7-oct-2026)

- Con un listado de verdad exportado de Séneca (por ejemplo, el de transporte escolar): «Nuevo asunto» → «Es para un grupo de personas» → «Pegar una lista» → «o elige un fichero». Casi todas las personas tienen que salir en «Reconocidas». Si muchas van a «No encontradas», decirle a Claude el nombre del listado.

## Fila 299 — el correo al tutor o tutora del grupo (7-oct-2026)

- En el centro, abrir un asunto de SANCIÓN de verdad: el hito se llama «Informar al tutor/a» y, al preparar su correo (Comunicar ▾ → «Tutor/a del grupo»), sale el tutor o tutora real del grupo de ese alumno. Si no sale («No sé quién es el tutor o tutora de…»), mirar cómo escribe Séneca la unidad en la relación de tutorías (Herramientas → Tablas de datos) y en el fichero de alumnado, y decírselo a Claude.

## Fila 303 — asuntos que han perdido su carpeta (8-oct-2026)

- En el centro, Ajustes → Problemas: mirar que el traslado del recorte de la idea 303 sale en la lista «La app ha encontrado la carpeta de N de ellos» con su carpeta del ARCHIVO, repasar la lista, desmarcar lo que no cuadre y pulsar «Enlazar los N». Decir cuántos de los 21 quedan sin encontrar.

## Fila 312 — beber del Centro de datos (9-oct-2026)

- Con datos reales: en Ajustes → Este ordenador, «Carpeta del Centro de datos» → «Señalar la carpeta» y elegir la carpeta «CENTRO DE DATOS» de Google Drive para ordenador. Ver que sale el aviso verde «Traído del Centro de datos: …» con lo que había nuevo, y que en Herramientas → «Traer ficheros de Séneca» sale la línea gris «Datos del Centro de datos, del …».

## Fila 313 — datos del centro y firma desde el Centro de datos (9-oct-2026)

- Con datos reales: escribir los datos del centro y la firma en el Centro de datos, entrar en el gestor y mirar Ajustes → El centro → «Datos del centro y firma»: los campos con valor salen sin poder escribirse y con «Se cambia en el Centro de datos».

## Fila 314 — la fecha «Revisar desde el día» (9-oct-2026)

- En el centro: abrir Herramientas → «Control del registro»: la fecha sale vacía (ya no 01/01/0020), poner la buena escribiendo el año entero y subir los listados.

## Fila 317 — contrato 2 del Centro de datos (9-oct-2026)

- Cuando el Centro de datos haya terminado de recolocar (su fila 7): señalar la carpeta «CENTRO DE DATOS» en Ajustes → Este ordenador y ver que el aviso verde trae el personal docente y el no docente.

## Fila 318 — permisos de las carpetas al entrar (9-oct-2026)

- [ ] En el ordenador del centro, con la copia sin internet ya actualizada: al pulsar «Entrar», el navegador enseña un cuadro por carpeta (alumnado, bandeja y, si está señalada, Centro de datos). Elegir «Permitir en cada visita» en cada uno. A la mañana siguiente, al entrar, no sale ningún cuadro y el panel no enseña esas filas. Si el cuadro no ofrece «Permitir en cada visita», decírselo a Claude: queda una pulsación en «Permitir» por carpeta cada mañana.

## Fila 319 — Lo que tengo ahora (9-oct-2026)

- [ ] En el ordenador del centro, con la copia sin internet ya actualizada: descargar el alumnado de Séneca, traerlo con «Traer ficheros de Séneca» y mirar que la fila «Alumnado de Séneca» de Herramientas → «Traer el alumnado» dice el día y la hora de esa descarga y «A mano. Lo trajo Francisco…».

## Fila 320 — la pantalla de plantillas (9-oct-2026)

- [ ] En el ordenador del centro: abrir Herramientas → «Plantillas» y mirar que están todas las plantillas del centro, que las que cuelgan de un hito lo dicen, y que «Ver» abre bien un Word de verdad del centro.

## Fila 322 — retocar una plantilla de Word (9-oct-2026)

- [ ] En el ordenador del centro: retocar una plantilla de verdad del centro (corregir una palabra), guardarla, generar un documento con ella y mirar que el Word generado conserva el formato, el membrete y las tablas tal como estaban.

## Fila 309 — aviso al claustro de una actividad (9-oct-2026)

- [ ] Con el grupo «Profesorado» de verdad creado, avisar de una actividad real: el correo llega a todo el profesorado, en copia oculta, con el informe adjunto.

## Fila 325 — la versión nueva, sin franja (10-oct-2026)

- [ ] 11. [SOLO FRANCISCO] En el ordenador del centro, **a partir de la segunda mañana** con esta versión: al pulsar «Entrar» con una versión nueva publicada, el navegador enseña un cuadro para la carpeta de la copia. Elegir «Permitir en cada visita» si lo ofrece. La aplicación dice «Actualizando el Gestor…», se recarga y entra sola, sin franja. Durante la mañana, si llega otra versión, no sale la franja: sale «hay versión nueva» junto al número de versión. Si el cuadro no ofrece «Permitir en cada visita», decírselo a Claude.

## Fila 326 — el botón «Soporte» único (11-oct-2026)

- [ ] [SOLO FRANCISCO] En el centro, con la copia sin internet ya actualizada: abajo a la derecha sale el botón «Soporte». Pulsarlo, elegir «Propongo una mejora», escribir «Prueba del botón único» y enviar. Sale «Recibido. Gracias.» sin pedir el correo, y en el Centro de mando aparece una idea nueva del Gestor. Repetirlo una vez en la web, desde casa. (Esta entrada sustituye a las de las filas 213, 240, 261, 262, 268, 269, 315 y 316: el buzón ya no es de este repositorio.)

## Fila 327 — el personal ya preparado (11-oct-2026)

- [ ] [SOLO FRANCISCO] En el ordenador con la carpeta del Centro de datos señalada: Herramientas → «Traer el alumnado»; la fila «Personal 26-27» dice que lo hace el propio Centro de datos y trae las mismas personas que la página del Centro de datos.

## Fila 328 — las empresas, entregadas al Centro de datos (11-oct-2026)

- [ ] [SOLO FRANCISCO] En el ordenador con la carpeta del Centro de datos señalada: al pulsar «Entrar» el navegador pide permiso para editar la carpeta; aceptarlo. Ajustes → Este ordenador → «Carpeta del Centro de datos» dice «Empresas entregadas al Centro de datos: …»; pasado un cuarto de hora, la página del Centro de datos dice «Empresas: …» con el mismo número.

## Fila 329 — las Administraciones, entregadas al Centro de datos (11-oct-2026)

- [ ] [SOLO FRANCISCO] En el ordenador con la carpeta del Centro de datos señalada: Ajustes → Este ordenador → «Carpeta del Centro de datos» dice «Administraciones entregadas al Centro de datos: …»; pasado un cuarto de hora, la página del Centro de datos dice «Administraciones: …» con el mismo número.

## Fila 330 — los cargos, entregados al Centro de datos (11-oct-2026)

- [ ] [SOLO FRANCISCO] Ajustes → Este ordenador → «Carpeta del Centro de datos» dice «Cargos entregados al Centro de datos: …»; pasado un cuarto de hora, la página del Centro de datos dice «Cargos: …» con el mismo número.

## Fila 343 — repartir cortando por alumno (13-oct-2026)

- [ ] [SOLO FRANCISCO] Con el PDF real del Informe final de etapa de Primaria (CEIP Jorge Guillén, 896 páginas), en un asunto sin relacionados: «Repartir entre terceros» debe proponer 150 trozos, con las dos alumnas que tienen dos informes en dos trozos cada una (ámbar suave «Mismo alumno…»).

## Fila 344 — etiquetas (14-oct-2026)

- [ ] [SOLO FRANCISCO] Imprime una hoja de etiquetas en papel normal (Herramientas → Etiquetas, tamaño real 100 %) y ponla a contraluz sobre una hoja de etiquetas de verdad: si no cuadra, «Ajustar márgenes» en ese modelo. Comprueba también que las direcciones del RegAlum real salen en «Sobre» (si faltan, dime los títulos de las columnas de la dirección).

## Fila 349 — comprimir PDF y pasar a A4 (15-oct-2026)

- [ ] [SOLO FRANCISCO] Con un PDF real que llegó enorme al centro: guárdalo en un asunto (se pasa a A4), súbelo a Séneca y mira que el sello sale a su tamaño normal. Y con un PDF que llegue por la bandeja de Gmail, que salga la casilla «Pasarlas a A4» si sus hojas son grandes.

## Fila 352 — aviso al claustro desde el personal docente (16-oct-2026)

- [ ] [SOLO FRANCISCO] Con los datos reales, en una actividad pulsa «Avisar al claustro»: la Copia oculta lleva al profesorado que está hoy en el centro y **no** sale el correo de Bonilla Cascado, Manuel (ya no está), ni el del personal no docente. Si a algún docente le falta el correo, sale el aviso ámbar con su nombre.
- [ ] **El orden de columnas de Inicio, con los datos reales y en dos ordenadores (fila 368, `docs/INICIO-COLOCACION-Y-COLUMNAS.md`).**
      En el ordenador del centro, arrastrar los títulos de Inicio hasta dejar Inicio · Tipo · Tercero · Plazo · Hito actual · Le
      toca a; después entrar con el mismo nombre en otro ordenador. Ver: que sale en el mismo orden en los dos, y que
      «Restablecer columnas» (en «Filtros») vuelve al de siempre.

## Fila 408 — cambiar el tipo renombra la carpeta y trae la guía (21-oct-2026)

- [ ] [SOLO FRANCISCO] Al entrar con los datos reales: el asunto A26-0465 de Álvaro Baute sale en Inicio con el tipo «Expulsión del Centro»; su carpeta conserva 261020, A26-0465 y el alumno (solo cambia el tipo); y te pregunta si traer la guía de «Expulsión del Centro» (lo ya hecho en sus hitos sigue ahí).

## Fila 398 — archivar sin esperar (21-oct-2026)

- [ ] [SOLO FRANCISCO] Con el primer asunto real que archives después de publicar (`docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md`, parte 2): al pulsar «Archivar» sale de la lista al instante y puedes abrir otro; arriba sale «Archivando…» y se quita solo cuando la carpeta ya está en el archivo de Dropbox. Si Dropbox tiene un fichero abierto y el traslado falla, el asunto vuelve a la lista y sale un aviso rojo con botón de cerrar.

## Fila 411 — correo desde la cuenta común (21-oct-2026)

Después de los pasos de `docs/TE-TOCA.md` (fila 411):

- [ ] [SOLO FRANCISCO] Etiquetas «GESTOR» un correo en la cuenta común y aparece en «Ha llegado» del Gestor, en el ordenador de Francisco y en el de Diego.
- [ ] [SOLO FRANCISCO] Envías un correo desde un asunto: quien lo recibe ve «Administración · IES Fuente Lucena» y la dirección 29700692.administracion@g.educaand.es.
- [ ] [SOLO FRANCISCO] Ese correo queda en «Enviados» de la cuenta común, no en la de Francisco.
- [ ] [SOLO FRANCISCO] Un correo etiquetado «GESTOR» en la cuenta personal de Francisco ya no aparece en el Gestor.

- [ ] [SOLO FRANCISCO] (fila 414) En Ajustes → tipo «Elecc. Consejo Escolar» → guía, el hito de recepción de candidaturas tiene «Recibe varios documentos» (marcarla es el paso de la fila 415); al guardar una candidatura real, la casilla de espera no sale, el hito sigue abierto y la candidatura queda dentro.

## Fila 416 — la guía manda en los hitos (22-oct-2026)

- [ ] [SOLO FRANCISCO] Tipo «Elecc. Consejo Escolar», hito «Registrar de salida en Séneca»: cambia su título en la guía y mira que sale nuevo en los asuntos abiertos donde no está empezado y sigue viejo donde ya hay una tarea marcada. Quita un hito de la guía y mira que desaparece solo de los que no lo habían empezado.

## Fila 417 — traer un hito de otro tipo (22-oct-2026)

- [ ] [SOLO FRANCISCO] En la guía de «Certificado», «+ Traer un hito de otro tipo», busca «Registrar de salida»: sale bajo «Elecc. Consejo Escolar»; lo eliges, entra con sus tareas, y si lo cambias aquí el de «Elecc. Consejo Escolar» sigue igual.

## Fila 423 — botón «Ruta» de cada documento (22-oct-2026)

- [ ] [SOLO FRANCISCO] En Séneca, al adjuntar, pega la ruta copiada con «Ruta» de la factura D26-00259 en la ventana de elegir fichero: abre directamente la factura, sin buscarla.

## Fila 425 — la ficha con vista de trabajo, parte A (22-oct-2026)

- [ ] [SOLO FRANCISCO] Abre el asunto de Nicolás Amortegui (A26-0464) y el de Elecciones al Consejo Escolar: se ven a la vez el hito (a la izquierda) y la carpeta (a la derecha), y en Elecciones los documentos del hito abierto llevan su marca «Hito N».

- (Fila 426, 23-oct-2026) En el asunto de Nicolás (4º ESO E), la franja «Datos del asunto» de «Trabajo» enseña 4º ESO E y su NIE, y se copian con un clic.

## Fila 436 — la línea de datos en las listas de documentos, parte B (23-oct-2026)

- [ ] [SOLO FRANCISCO] En la carpeta del asunto real de Elecciones al Consejo Escolar, bajo la solicitud de candidatura de Francisco Manuel Garrido Mérida, se lee «Candidato: Garrido Mérida, Francisco Manuel»; la misma línea sale en los documentos del hito y en la lista de adjuntos de un correo. En el JUSTIFICANTE del asunto A26-0464 (parte A) sale «Alumno: …».

## Fila 439 — cada documento en una sola línea (23-oct-2026)

- [ ] [SOLO FRANCISCO] En el asunto A26-0464 (Nicolás Amortegui), los cuatro documentos de la carpeta caben a la vista sin bajar y se lee en cada línea lo necesario para saber cuál es.

## Fila 440 — todo el correo de la cuenta común entra solo (23-oct-2026)

- [ ] [SOLO FRANCISCO] Un correo que Gmail manda a spam no aparece en «Ha llegado».
- [ ] [SOLO FRANCISCO] Al descartar un correo desaparece; si contestan en esa conversación, el mensaje nuevo sí aparece.
- [ ] [SOLO FRANCISCO] Un correo antiguo al que pones la etiqueta GESTOR aparece en «Ha llegado».
- [ ] [SOLO FRANCISCO] Una respuesta a un correo de un asunto entra en ese asunto y no sale repetida en «Ha llegado».
- [ ] [SOLO FRANCISCO] (fila 441) Contestas desde un asunto a un correo recibido, dejando el asunto que trae el cuadro: el destinatario lo recibe con ese asunto, no con «Re:» y el suyo; si contesta, su respuesta entra en el mismo asunto de la app.
- [ ] [SOLO FRANCISCO] (fila 441) Si en el cuadro escribes el mismo asunto que puso el remitente, la respuesta sale dentro de su conversación.
- [ ] [SOLO FRANCISCO] (fila 449) Guardas un documento de «Ver todo» en el asunto A26-0464 (Nicolás Amortegui) en el ordenador del centro: el aviso «Ir al asunto» se queda hasta cerrarlo, abre «Trabajo» en el hito y «← Volver a Ver todo» te devuelve; lo mismo con un correo de Gmail.
