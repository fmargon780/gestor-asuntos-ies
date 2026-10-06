# Comprobar a mano

Fila 69 de la cola (`docs/PRUEBAS-QUE-FALTAN.md`, 3). Lo que ninguna prueba automática cubre, y
Francisco tiene que mirar antes de dar por buena una publicación importante. En forma de lista,
para ir tachando.

---

- [ ] **El correo de quien avisa (fila 269, `docs/SOPORTE-MANDA-EL-CORREO.md`).** Con la web ya
      publicada, en un ordenador real: pulsar «Soporte», escribir un aviso con tu correo y enviarlo.
      Si el vigilante (fila 268) ya está en marcha, cuando la fila del aviso esté HECHA te llega el
      correo «tu aviso ya está resuelto». Al abrir «Soporte» otra vez, sale «Te avisaremos en…» y
      «Cambiar».
- [ ] **El vigilante (fila 268, `docs/VIGILANTE-Y-CORREOS.md`).** Volver a pegar
      `apps-script/soporte.gs`, ejecutar `prepararTodo` y aceptar el permiso nuevo que pida Google
      (una sola vez). Llega un correo de resumen que dice a qué direcciones llegarán los avisos,
      qué repositorios vigila y, de cada app, su dirección y si se llega a la app entera o solo a
      la entrada de Google. Después «Implementar» → «Administrar implementaciones» → «Nueva
      versión». A los veinte minutos, en tu Drive, en `SOPORTE-AVISOS`, está `ESTADO-VIGILANTE.json`
      con una hora de hace menos de veinte minutos. Y envía un aviso de prueba desde cualquier app,
      de día: te llega «aviso nuevo de un usuario» en menos de un minuto. Para pararlo: en el
      proyecto de Google, «Activadores», borrar el de `vigilar`.
- [ ] **Buzón de soporte para todas las apps (fila 261, `docs/BUZON-PARA-TODAS-LAS-APPS.md`).**
      Volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (autorizar el permiso de
      correo y leer el registro: ningún repositorio en «OJO»; llega el correo de prueba) e
      «Implementar» → «Administrar implementaciones» → «Nueva versión». Después, enviar un aviso
      desde Ausencias y Guardias: aparece una IDEA nueva de esa app en el Centro de mando. Si aún
      tenías pendiente el pegado de la fila 240, es el mismo pegado.
- [ ] **El botón «Soporte», con el buzón de verdad (fila 213, `docs/BOTON-DE-SOPORTE.md`).**
      Primero, los cinco pasos de `docs/PONER-EN-MARCHA-SOPORTE.md`. Después: (1) pegar una
      captura con Ctrl+V en la ventana: se ve en pequeño, se quita con «Quitar la captura»; (2)
      enviar un aviso: sale «Recibido. Gracias», está entero en Drive (`SOPORTE-AVISOS`) y hay una
      IDEA nueva en el Centro de mando sin el texto escrito; (3) en la copia sin internet
      (`ABRIR EL GESTOR.html`) el botón y la ventana funcionan igual y la app arranca como siempre.
- [ ] **Comprobación al entrar, con lo de verdad (fila 204, `docs/COMPROBACION-AL-ENTRAR.md`).**
      (1) Con las carpetas de Dropbox y la bandeja de verdad: quitar el permiso de la carpeta de la
      bandeja en Chrome y recargar; al entrar, la bandeja sale en «Falta» y «Arreglarlo» lleva al
      bloque de la bandeja en Ajustes › Mantenimiento. (2) En la copia sin internet
      (`ABRIR EL GESTOR.html`) aparece la fila «Copia sin internet al día»; en la web, no.
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

## Fila 240 — soporte con texto sin límite (1-oct-2026)

- Pegar `apps-script/soporte.gs` entero en el proyecto «Gestor - Soporte» (pasos en `docs/PONER-EN-MARCHA-SOPORTE.md`), guardar, y mandar un aviso largo (más de 5.000 caracteres): llega entero al `.txt` de Drive y la fila IDEA de la cola no lleva el texto. Hasta que se pegue, el servidor sigue rechazando los de más de 5.000.

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

## Fila 262 — el buzón admite Focus Lingo (4-oct-2026)

- En GitHub, abrir el permiso «Soporte del Gestor» (https://github.com/settings/personal-access-tokens), «Repository access», añadir `Focus_Lingo` y guardar. El permiso *Contents: Read and write* ya lo tiene.
- Volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (el registro tiene que decir «Bien: fmargon780/Focus_Lingo») e «Implementar» → «Administrar implementaciones» → «Nueva versión». Es el mismo pegado que el de las filas 240 y 261.
- Cuando el botón de Focus Lingo esté publicado, enviar un aviso desde allí: sale «Recibido. Gracias.» y aparece una IDEA nueva de Focus Lingo en el Centro de mando.

## Fila 263 — la ruta larga avisa y no impide crear (5-oct-2026)

- En el ordenador del compañero, con la copia sin internet ya actualizada, repetir el asunto del aviso («Ver todo» → «Crear asunto con él», mismo alumno y mismo tipo): se crea sin ninguna línea de aviso.
- Guardar un documento en un asunto de antes de la fila 239 con un nombre que no cabe ni recortando: sigue saliendo su aviso rojo y «Guardar» apagado (no se pudo montar con datos de demostración; el código de documentos no se ha tocado).

## Fila 265 — archivar mide antes la ruta (5-oct-2026)

- En el ordenador del compañero, con la copia sin internet ya actualizada, archivar el asunto del aviso (ADMISION, abierto el 28-sep-2026): o se archiva, o sale el cuadro «No cabe en el archivo» y se archiva tras acortar. Si sale otro mensaje rojo, dirá el paso y el fichero: mandarlo por el botón de soporte.

## Fila 266 — cambiar los datos del tercero desde el asunto (5-oct-2026)

- Con un aspirante real sin Nº escolar y un asunto abierto suyo: escribirle el Nº escolar desde «Cambiar los datos» (en su ficha de Personas o desde la ficha del asunto). Sale «Cambia el nombre de las carpetas», y con «Adelante» cambia solo el asunto abierto y la carpeta suya del archivo; los asuntos archivados de dentro conservan su nombre.

## Fila 272 — datos del tercero junto al nombre del asunto (6-oct-2026)

- Con los datos reales del centro: abrir el asunto de un alumno y ver su unidad de verdad junto al nombre; con «Elegir datos» cambiar los 3 datos de alumnado en un ordenador y comprobar que el compañero, en el otro, los ve igual al recargar. Tampoco se pudo comprobar en la demostración el modo «solo consultar» (el botón se apaga solo, como los demás de la ficha; lo cubre la prueba `datos-favoritos`).
