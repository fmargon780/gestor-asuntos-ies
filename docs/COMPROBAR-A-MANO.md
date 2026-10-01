# Comprobar a mano

Fila 69 de la cola (`docs/PRUEBAS-QUE-FALTAN.md`, 3). Lo que ninguna prueba automática cubre, y
Francisco tiene que mirar antes de dar por buena una publicación importante. En forma de lista,
para ir tachando.

---

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
