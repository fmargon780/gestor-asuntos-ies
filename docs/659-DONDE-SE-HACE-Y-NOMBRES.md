# 659 — «Dónde se hace», datos nuevos de la tarea y nombres claros

Tercera de las cinco partes del tema 650 («Crear tareas e hitos con fluidez»). Van antes la 651 (acciones que faltan) y la 657 (repaso de la lista común), las dos HECHAS. Detrás va la 660 (crear hitos y tareas desde el asunto) y, después, la bandeja. De dónde se parte: `docs/notas-diseno/650.md`.

## Lo que escribió Francisco

14-nov-2026, durante el diseño del tema 650:

> Tengo dudas sobre la acción En Séneca, porque realmente no es una acción si no una plataforma donde hacer cosas. […] Una cosa es qué hacer y otra dónde se hace.

> Como el fin último de nuestra app es tener un sistema de trabajo lo más completo posible y que sirva de guía incluso a personas no expertas […] elijo la 3. Y haz un repaso al plan con esta idea.

> Hay que intentar que no haya conceptos ambiguos y/o repetidos en las distintas zonas o elementos. Cada uno tiene que tener una nomenclatura clara.

> En vez de poner Otro sitio lo que deberíamos es dar la posibilidad de crear/modificar un sitio, mostrando primero un buen mapa de lo existente.

Sobre «archivar»: es para el papel; el asunto se «cierra» (idea 658, aparte). Sobre los cuatro hitos «Archivar» vacíos: opción 1, se quitan de sus guías.

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

**Regla de nombres.** «Qué se hace» dice el verbo, sin sitio ni vía. El sitio o la vía van solo en «Dónde se hace». Una misma palabra no significa dos cosas en fases, acciones y sitios.

**«Qué se hace» queda así**, en este orden: «Generar documento», «Poner a la firma» (antes «Firmar»), «Registrar», «Enviar» (antes «Comunicar»), «Añadir documento», «Rellenar datos del asunto» (antes «Pedir datos»), «Copiar a otra carpeta», «Llamar» (antes «Llamar por teléfono»), «Grabar o cambiar datos» (antes «En Séneca»), «Entregar» y «Recoger» (antes una sola, «Entregar o recoger en mano»), «Publicar», «Cobrar o pagar», «Comprobar», «Archivar» (nueva) y «Otra cosa».
- «Archivar» es guardar el papel. Se marca a mano y solo clasifica, como las de la fila 651.
- «Poner a la firma» solo cambia de nombre: se sigue marcando sola al llegar el firmado.
- **Fases:** «Elaborar el documento» pasa a «Generar documento» y «Hacer en Séneca» pasa a «Grabar o cambiar datos». Las demás, como en la fila 657.

**«Dónde se hace», dato nuevo de cada tarea.**
- Al elegir «Qué se hace», la app propone el sitio; se puede cambiar. Puede quedar vacío.
- Sitio que propone cada acción: Registrar → «Séneca · Registro»; Grabar o cambiar datos → «Séneca · Alumnado»; Llamar → «Teléfono»; Entregar, Recoger y Cobrar o pagar → «En mano»; Publicar → «Tablón»; Enviar → «Correo electrónico»; Generar documento, Añadir documento, Rellenar datos del asunto y Copiar a otra carpeta → «En esta app». Las demás no proponen.
- Es una casilla que se busca escribiendo, debajo con «Ver todos los sitios…».
- Sale al añadir una tarea, en «Cambiar…» de la tarea y en la guía del tipo.
- La tarea enseña su sitio junto a la etiqueta de su acción.

**«Enviar» según su sitio.**
- Con «Correo electrónico», prepara el correo con su plantilla, como hoy «Comunicar» por correo.
- Con «iPasen», prepara el mensaje de Séneca, como hoy «Comunicar» por mensaje de Séneca.
- Con cualquier otro sitio («Correo postal», «En mano»…), no envía nada: se marca a mano.
- La vía que hoy lleva cada tarea «Comunicar» pasa a ser su sitio: correo → «Correo electrónico»; mensaje de Séneca → «iPasen».

**Datos nuevos de la tarea, según su acción** (todos opcionales, casillas que se buscan escribiendo):
- «Qué documento» en Registrar, Poner a la firma y Añadir documento: el tipo de documento, de la lista que la app ya tiene.
- «A quién» en Llamar: Tercero, Familia, Relacionado o Sus profesores. Al pulsar el teléfono, «Apuntar llamada» propone a esa persona.
- Generar documento y Enviar siguen con su plantilla, como hoy.

**Ventana «Sitios»** (como en la pantalla de prueba).
- Se abre con «Ver todos los sitios…» y desde Ajustes → El centro → «Sitios».
- A la izquierda, el mapa: cada sitio con sus zonas (por ejemplo, Séneca → Alumnado) y cuántas tareas usan cada uno.
- Un sitio con zonas se puede elegir también solo («Séneca»).
- Cambiar el nombre lo cambia en todas las tareas.
- Borrar: si lo usa alguna tarea, antes se elige a qué sitio pasan («Pasar y borrar»).
- «+ Sitio nuevo»: se dice si es un sitio o una zona de uno que existe; si se parece a uno que existe, avisa, con «Ir a ese».
- Abierta desde una tarea, «Usar … en la tarea».
- No hay «Otro sitio».
- **Lista de partida:** Séneca (con las zonas Alumnado, Personal, Registro, Documentos y Ventanilla Electrónica), iPasen, Correo electrónico, Correo postal, Teléfono, En mano, Tablón, Expediente del alumno, Archivo del centro y En esta app. Las zonas de Séneca son de partida: Francisco las corrige en «Sitios».

**Repaso de una vez de las tareas que ya existen**, con un botón en Herramientas, «Aplicar el repaso del dónde», como el de la fila 657.
- Pone a cada tarea común su sitio y, donde se ve claro, su «Qué documento» (plan en `docs/659-plan-donde.json`).
- Las tres tareas de archivar o guardar en el expediente pasan de «Otra cosa» a «Archivar», con sitio «Expediente del alumno».
- Las dos tareas que empiezan por «Recoger» pasan de «Entregar o recoger en mano» a «Recoger».
- Quita de sus guías los cuatro hitos «Archivar» vacíos (PAGO AYUDA TRANSPORTE, PROGRAMA DE TRÁNSITO, PROTOCOLO CONDUCTAS SUICIDAS y SOLICITUD NACIONALIDAD): cerrar el asunto es el botón.
- Antes de aplicar, enseña qué va a cambiar sin cambiar nada; lo que el plan no encuentra lo dice. Una tarea que no está en el plan recibe el sitio que propone su acción y sale en la lista.
- Los asuntos abiertos conservan sus tareas como están.
- Una vez aplicado, el botón desaparece.

**Lo que desaparece:** los nombres viejos de las acciones y fases de arriba, y los cuatro hitos «Archivar» vacíos.

## Pantalla de prueba

- Aprobada el 14-nov-2026: `docs/pantallas/650.html` · https://claude.ai/artifact/EQ7UXQK4J5NDc6e2y6Zy2d. De esta tarea salen de ella: «Qué se hace» con sus nombres nuevos, «Dónde se hace», «Qué documento», «A quién», «Cambiar…» de la tarea y la ventana «Sitios». La marca, «+ Añadir hito», los avisos y lo que desaparece son de la fila 660.

## Qué NO se hace en esta tarea

- La marca de la guía, añadir hitos por fase, buscar «Qué se hace» escribiendo, los avisos de igual o parecido y quitar las ventanas de la lista común: fila 660.
- Que «Grabar o cambiar datos», «Entregar», «Recoger», «Publicar», «Cobrar o pagar» o «Comprobar» hagan algo propio: ideas 652 a 656.
- Cerrar el asunto en vez de archivarlo: idea 658.
- La bandeja con hito y tarea: quinta parte del tema 650.

## Notas técnicas de Claude

- Valores internos sin cambiar (`comunicar`, `firmar`, `pedir`, `llamar`, `seneca`, `entregar`…); solo cambian sus textos en `HACE` de `js/comunes.js` y en la lista del formulario de `js/guias-guion.js`. Nuevos: `recoger` y `archivar`, que se tratan como la acción vacía (sin botón, a mano). Las fases `elaborar` y `seneca` cambian solo su texto; poner los textos de las fases junto a `FASES` en `js/comunes.js`.
- Sitios: fichero nuevo en `_GESTOR` (por ejemplo `sitios.json`), por `ColaGuardado`, con `id` por sitio y por zona. La tarea guarda `donde: { sitio, zona }` por `id`, para que cambiar el nombre no toque las tareas. Si no existe el fichero, se crea con la lista de partida (`sitios` de `docs/659-plan-donde.json`). Borrar un sitio lleva lápida como las listas de la ficha.
- `documento` (texto de `App.E.tiposDocumento`) y `aQuien` (clave de `PAPELES` de `js/guias-toca.js`) son campos nuevos de la tarea en la guía, en la lista común y en el asunto. `Llamadas.abrir` (`js/llamadas-ventana.js`) recibe la tarea y preselecciona a esa persona.
- «Enviar»: hoy la vía está en `receta.via` (`js/hito-mesa-recetas.js`, `canalDe`). Pasa a decidirse por el sitio: «Correo electrónico» → `correo`; «iPasen» → `seneca`; otro → sin botón, a mano. Al leer una tarea vieja sin `donde`, se deduce de `receta.via`. El repaso lo deja escrito.
- Repaso: plan en `docs/659-plan-donde.json` (tareas por texto, con `accion`, `donde`, `documento` si lo hay y `antes` si cambia la acción; `hitosQueSeQuitan`). Pasarlo a `datos-biblioteca/` como en la 657. Se busca por texto normalizado. «Qué documento» solo se pone si ese tipo existe en `App.E.tiposDocumento`; si no, se queda vacío y se dice. Copia antes con `Copias.guardar`; marca de aplicado en `_GESTOR`. Una tarea con `receta.via` `seneca` va a «iPasen» aunque el plan diga otra cosa.
- Una versión anterior de la app no debe borrar `donde`, `documento` ni `aQuien` al guardar, ni el fichero de sitios (comprobarlo como en la 651).
- Textos: repasar `js/ayudas-rotulos.js`, `js/ayudas-textos.js` y `docs/VOCABULARIO.md` (los nombres viejos no deben quedar en ninguna pantalla).
- Para las pruebas, los datos reales de `pruebas/apoyo/datos-657/` con el repaso de la 657 aplicado.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- «+ Añadir tarea» y «Cambiar…»: «Qué se hace» trae los nombres nuevos en el orden de arriba, con «Archivar»; no queda «Comunicar», «Firmar», «Pedir datos», «Llamar por teléfono», «En Séneca» ni «Entregar o recoger en mano» en ninguna pantalla.
- Al elegir cada acción, «Dónde se hace» propone el sitio de la lista de arriba; se puede cambiar y dejar vacío.
- Registrar, Poner a la firma y Añadir documento piden «Qué documento»; Llamar pide «A quién»; las demás, ninguno de los dos.
- Una tarea «Llamar» con «A quién: Familia»: «Apuntar llamada» propone la familia.
- «Enviar» con «Correo electrónico» prepara el correo; con «iPasen», el mensaje de Séneca; con «Correo postal», no hay botón y se marca a mano.
- «Sitios» desde la tarea y desde Ajustes: el mapa con sus cuentas; cambiar un nombre lo cambia en la tarea; borrar uno en uso pide a dónde pasan; «+ Sitio nuevo» avisa si se parece; no existe «Otro sitio».
- «Aplicar el repaso del dónde» con los datos de prueba: la vista previa no cambia nada; al aplicar, todas las tareas del plan tienen su sitio, las tres de archivar son «Archivar», las dos de recoger son «Recoger», los cuatro hitos «Archivar» vacíos ya no están; el botón desaparece y hay copia.
- Un asunto abierto antes del repaso conserva sus tareas.
- Fases: donde hoy se lea la fase, dice «Generar documento» y «Grabar o cambiar datos».

## Qué mirar al terminar

- En el instituto, Herramientas → «Aplicar el repaso del dónde»: mira la vista previa y pulsa «Aplicar».
- En un asunto, «+ Añadir tarea», elige «Registrar»: mira el sitio propuesto y «Qué documento».
- Abre «Ver todos los sitios…» y corrige las zonas de Séneca.
- En la guía de CERT. MATRICULA, mira que «Enviar el documento al solicitante» lleva su sitio.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
