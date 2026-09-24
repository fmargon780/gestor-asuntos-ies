# Comprobar a mano

Fila 69 de la cola (`docs/PRUEBAS-QUE-FALTAN.md`, 3). Lo que ninguna prueba automática cubre, y
Francisco tiene que mirar antes de dar por buena una publicación importante. En forma de lista,
para ir tachando.

---

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

## Por qué esta lista y no una prueba automática

Todas las pruebas de navegador de este repositorio sustituyen el acceso a carpetas por uno de
mentira en memoria (`pruebas/navegador.mjs` y los discos de mentira de cada fichero de prueba).
Eso prueba bien **cómo reacciona** la aplicación a un fichero que falta, a una copia a medias o a
un permiso perdido — pero no prueba que Dropbox, Séneca o Google **de verdad** se comporten como
se espera. Eso solo se ve entrando de verdad, y por eso esta lista existe: no para sustituir las
pruebas automáticas, sino para cubrir justo lo que ellas no pueden.
