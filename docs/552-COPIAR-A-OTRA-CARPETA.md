# 552 — Tarea «Copiar a otra carpeta»

## Lo que escribió Francisco

Tema 550 (6-nov-2026), parte que viene de la idea 548, tal cual:

> Carpeta de destino por tipo: que un tipo de asunto pueda llevar una carpeta de fuera del asunto (por ejemplo, Ausencias) adonde el documento registrado se copie solo, y poder ponerle el nombre especial que pida el destinatario. Sustituiría la tarea «Copiar el documento registrado a la carpeta Ausencias» del plan de la 544. Apuntada por Francisco al hacer la 544.

En el diseño, el 6-nov-2026: «Adelante según tus propuestas». Sobre la pantalla: «Está bien
diseñado».

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

Si algo cambia el texto de arriba, manda esto.

1. **No va en el tipo, sino en una tarea.** Lo que hace una tarea tiene una clase nueva en la lista
   fija: **«Copiar a otra carpeta»**. Así se ve en el hito, en su momento, y una sola tarea común
   sirve para todos los tipos que copian a la misma carpeta.
2. **Al crearla o cambiarla:** «Carpeta», elegida con «Elegir carpeta» (la ventana del ordenador
   para señalarla); «Qué copia»: el documento de la tarea de registrar de ese hito, cuando llega
   registrado; y «Nombre del fichero copiado», con texto y campos («Insertar campo» abre la misma
   ventana de elegir campo de las plantillas), y debajo «Saldrá así: …» con un ejemplo.
3. **Se hace sola:** cuando llega el registrado, la tarea copia el documento a la carpeta con ese
   nombre y se marca hecha, con la línea «Copiado a <carpeta> como «<nombre>».».
4. **Sin permiso sobre la carpeta** en ese ordenador: no se copia; la tarea queda pendiente
   («Pendiente: falta permiso sobre la carpeta.») y sale un aviso ámbar con «Dar permiso». Al
   darlo, se copia y se marca.
5. **Si ya hay un fichero con ese nombre** en la carpeta, no se pisa nunca: la copia se guarda con
   « (2)» al final del nombre (« (3)» si también existe…), y la línea de la tarea lo dice.
6. La tarea «Copiar el documento registrado a la carpeta Ausencias» que deja la fila 551 se pasa a
   esta clase con «Cambiar la tarea», eligiendo la carpeta Ausencias y el nombre (paso de
   Francisco, abajo).

## Pantalla de prueba (aprobada el 6-nov-2026)

- `docs/pantallas/550.html` · https://claude.ai/artifact/C6myJgyge276vxwrWPZJSP
- Solo la parte «Copiar a otra carpeta». La pestaña «Aplicar el plan» que lleva oculta no cuenta:
  es la fila 551, sin pantalla.
- En la pantalla, «Insertar campo» enseña unos pocos campos de ejemplo; en la app es la ventana de
  elegir campo de siempre (`CamposElegir`).

## Qué NO se hace en esta tarea

- Poner la carpeta de destino en el tipo de asunto (se descartó a favor de la tarea).
- Copiar documentos que no llegan registrados.

## Notas técnicas de Claude

- Clase nueva en `Comunes.HACE` (`js/comunes.js`), con su configuración en la `receta` de la tarea
  (`GuiasGuion.normalizarReceta`): carpeta y patrón del nombre.
- La carpeta se recuerda por ordenador, como las demás carpetas recordadas; su permiso se pide con
  `PermisosCarpetas.pedir`, nunca mandando a señalarla otra vez (CONTEXTO-CORTO, regla 6).
- El momento de copiar es el mismo en que hoy se reconoce el registrado que llega encima
  (`js/registro-asunto.js`, tema 477). El documento es el colgado de la tarea de registrar del
  mismo hito (fila 522). Si el hito no tiene tarea de registrar, la de copiar no se hace sola y se
  marca a mano, como cualquier otra.
- Los campos se rellenan con lo que ya usan las plantillas (`CamposLista`); un campo vacío no deja
  huecos dobles en el nombre. Caracteres no válidos en nombres de fichero, fuera.
- Escribir en la carpeta de destino solo cuando lo provoca la llegada del registrado o «Dar
  permiso», y mirando antes `SoloConsulta.activo()`.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Al crear una tarea, «Qué hace» ofrece «Copiar a otra carpeta» y enseña Carpeta, Qué copia y
  Nombre del fichero copiado, con «Saldrá así: …».
- «Insertar campo» abre la ventana de elegir campo de las plantillas y mete el campo en el nombre.
- Con el registrado llegando a un hito con esta tarea, el fichero aparece en la carpeta con el
  nombre de los campos y la tarea queda hecha con su línea «Copiado a…».
- Sin permiso sobre la carpeta: aviso ámbar con «Dar permiso»; al darlo, se copia y se marca.
- Con un fichero de igual nombre ya en la carpeta, la copia sale con « (2)» y el de antes sigue.
- [SOLO FRANCISCO] En el instituto: cambiar la tarea «Copiar el documento registrado a la carpeta
  Ausencias» a «Copiar a otra carpeta», elegir la carpeta Ausencias y el nombre que pide quien la
  recibe, y ver una copia real.

## Revisión y respuestas durante el trabajo

- Segundo revisor (6-nov-2026): 1. «Qué hace» ofrece «Copiar a otra carpeta» y sale Carpeta («Elegir carpeta»), Qué copia, Nombre del fichero copiado con «Insertar campo» y «Saldrá así: …» (probado en la ventana real «Tarea nueva» de «+ Añadir tarea»; sin carpeta no deja crear: «Elige la carpeta de destino.») — coincide (detalles de pantalla: el formulario queda estrecho, apretado junto a Nombre y Qué hace, y el aviso «Elige la carpeta de destino.» se queda en pantalla aunque ya se haya elegido; «Saldrá así» usa el primer asunto abierto de la lista, no el asunto en el que se está).
- Segundo revisor (6-nov-2026): 2. «Insertar campo» abre la misma ventana de elegir campo de las plantillas y mete el campo en el nombre (en «Tarea nueva» y en «Cambiar la tarea») — coincide.
- Segundo revisor (6-nov-2026): 3. Al llegar el registrado a un hito con la tarea, el fichero aparece en la carpeta con el nombre de los campos («Registro Vidal Soto, Irene.pdf», con el mismo contenido) y la tarea queda marcada hecha — coincide; pero la línea «Copiado a <carpeta> como «<nombre>».» no coincide: se guarda y está en la página, pero la regla css/hito-mesa.css:129 oculta (display:none) la explicación de toda tarea hecha, así que la usuaria ve la tarea marcada («Revisor · 6-nov») sin esa línea. Mirado también tras repintar y reabrir el asunto.
- Segundo revisor (6-nov-2026): 4. Sin permiso: no copia, queda «Pendiente: falta permiso sobre la carpeta.» con aviso ámbar y «Dar permiso»; pulsarlo con el permiso aún denegado no copia ni marca; al concederse, copia, marca y desaparece el aviso — coincide (permiso simulado cambiando queryPermission/requestPermission del manejador de la demo; el permiso real del navegador no se ha podido ver).
- Segundo revisor (6-nov-2026): 5. Con «Registro Vidal Soto, Irene.pdf» ya en la carpeta, la copia sale «Registro Vidal Soto, Irene (2).pdf», el anterior sigue con sus bytes, y la tercera sale « (3)»; la línea de la tarea lo dice (en datos) — coincide (sujeto a lo dicho en el punto 3 sobre que la línea no se ve en pantalla).
- Segundo revisor (6-nov-2026): 6. Campos vacíos o que no existen no dejan huecos dobles y los caracteres no válidos (\ / : * ? " < > |) salen del nombre («Aus … 5 A.pdf»); con el patrón vacío usa el nombre del documento — coincide.
- Segundo revisor (6-nov-2026): 7. Solo escribe en la carpeta de destino al llegar el registrado o con «Dar permiso»; con SoloConsulta.activo() simulado no se escribe nada y la tarea no cambia — coincide.
- Segundo revisor (6-nov-2026): 8. Cosas que hace la app y el texto no pide — no coincide del todo: (a) dos avisos pendientes más («Pendiente: falta elegir la carpeta de destino.» y «Pendiente: no encuentro el documento registrado en la carpeta del asunto.»); (b) «Dar permiso» abre la ventana de elegir carpeta si en ese ordenador no se había señalado, y avisa si la elegida tiene otro nombre; (c) aviso verde «Copiado a <carpeta>.» al dar permiso; (d) la tarea antes de registrar no enseña «Se hará sola cuando llegue el registrado.» como la pantalla de prueba (no se ve nada especial); (e) «Cambiar la tarea» también exige carpeta y la lista común distingue dos «Copiar» con el mismo nombre por carpeta. Nada dañino, pero (d) y lo de la línea oculta del punto 3 difieren de la pantalla aprobada.
- Segundo revisor (6-nov-2026): [SOLO FRANCISCO] cambiar en el instituto la tarea «Copiar el documento registrado a la carpeta Ausencias» a esta clase y ver una copia real — no lo he podido ver: es de Francisco y la demo no usa carpetas reales (ni el permiso real del navegador).
- Segundo revisor, segunda vuelta (6-nov-2026): 3. La línea «Copiado a Ausencias como «Registro Vidal Soto, Irene.pdf».» ya se ve en la mesa bajo la tarea hecha (visible, también tras repintar y reabrir el asunto) — coincide.
- Segundo revisor, segunda vuelta (6-nov-2026): 8(d). Antes de registrar, la tarea enseña «Se hará sola cuando llegue el registrado.» como la pantalla de prueba — coincide.
- Segundo revisor, segunda vuelta (6-nov-2026): 1 (aviso). Al elegir la carpeta, «Elige la carpeta de destino.» desaparece — coincide. Siguen como estaban el formulario estrecho y que «Saldrá así» use el primer asunto abierto (menores, no bloquean).
