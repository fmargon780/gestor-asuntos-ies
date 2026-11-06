# 553 — Las partes del hito, ordenar tareas y añadir hitos

## Lo que escribió Francisco

Aviso de usuario (algo no funciona), enviado por Francisco desde el botón de soporte el
6-nov-2026 10:54 (copia sin internet, perfil Administración, pantalla «Ficha de un asunto»):

> Las opciones Qué se hace de la Tarea creo que no debe ser una opción desplegada por defecto, debe ser algo más escondido que se use solo cuando el usuario lo necesite.
> Por otro lado entiendo que haya un botón +Añadir tarea justo debajo de la última tarea creada y que se pueda subir o baja a demanda. pero no entiendo ahí mismo el botón + Añadir Hito
> En el Hito las secciones Tareas, Campos, Documentos y Registro deben estar muy bien diferenciadas y que se vean muy fácilmente

Captura: el hito 2 «Esperar respuesta» abierto, con la caja «Nueva tarea…» y «Qué se hace» a la
vista, y «+ Añadir tarea» y «+ Añadir hito» juntos bajo las tareas. Aviso completo:
https://drive.google.com/file/d/1p71tyny-flAiSHedsN0-0HSjqHVP-FTd/view?usp=drivesdk

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

- No es un fallo del código: es una mejora de la pantalla del hito abierto.
- Regla que se mantiene (`docs/REGLAS-NEGOCIO.md`, 5-nov-2026): la guía de un tipo se crea y se
  modifica desde un asunto concreto. Esta tarea completa lo que faltaba para hacerlo desde ahí.
- **«Qué se hace» no se toca aquí.** La caja «Nueva tarea…», con su «Qué se hace» a la vista,
  desaparece al aplicar el plan de las guías (fila 551, paso 554). Después, «Qué se hace» solo
  sale dentro de «+ Añadir tarea» → «Crear una tarea nueva» y de «Cambiar la tarea».
- **Las cuatro partes del hito, cada una en su recuadro**: Tareas, Campos, Documentos y Registro.
  Cada recuadro con su cabecera de fondo propio y el título más grande y oscuro que hoy, con su
  cuenta al lado («1 de 4», «2», «1», «2 líneas»). Los títulos pasan a ser «Tareas», «Campos»,
  «Documentos» y «Registro». Lo de dentro de cada parte, igual que hoy. «Normativa», plegada al
  pie, igual que hoy.
- **El menú ⋮ de una tarea nunca se corta** por el borde del recuadro ni de la pantalla: si no cabe
  por debajo, se abre hacia arriba.
- **Subir y bajar tareas.** El menú ⋮ de cada tarea lleva, arriba, «Subir» y «Bajar» (apagados en
  la primera y la última), separados por una raya de las opciones de siempre. Mover una tarea
  cambia el orden en este asunto al momento.
- Si el orden de las tareas de la guía queda distinto del de la guía, sale debajo de las tareas una
  franja: «Has cambiado el orden de las tareas en este asunto.» con dos botones:
  - «Guardar también en la guía»: la guía de este tipo guarda el orden nuevo. Los asuntos nuevos
    de este tipo salen así; los demás asuntos abiertos siguen como están.
  - «Solo en este asunto»: la guía no cambia y la franja se va.
  Las tareas «solo aquí» se mueven igual, pero no cuentan para la franja ni van a la guía.
- **«Cambiar la tarea» deja cambiar también «Qué se hace».** La ventana tiene Nombre, «Qué se hace»
  (las mismas acciones que al crear una tarea nueva) y, si genera o comunica, Plantilla (con
  «+ Plantilla nueva…», que abre el editor de plantillas de siempre). Al cambiar «Qué se hace»
  cambian los datos de debajo (plantilla, o lo que pida esa acción, como hoy al crear). El aviso
  de cuántos tipos la usan sigue igual: cambia en todas las guías; los asuntos abiertos siguen como
  están. En una tarea «solo aquí», «Cambiar» hace lo mismo pero solo en este asunto.
- Cada tarea con acción lleva una etiqueta pequeña con ella («Comunicar», «Pedir datos»…), al lado
  del nombre, como en la pantalla de prueba.
- **«+ Añadir hito» sale de debajo de las tareas** y pasa al final de la tira de hitos de arriba.
  Bajo las tareas solo queda «+ Añadir tarea».
- **La ventana de «+ Añadir hito»** (la de la lista común, con buscar, «+ Crear un hito nuevo» y
  «Para», como hoy) añade «Va detrás de»: un desplegable con todos los hitos del asunto, con el
  último marcado por defecto («(al final)»). El hito nuevo entra donde diga.
- **«Hito ▾» pierde «Crear».** Para hitos nuevos queda solo «+ Añadir hito». «Cambiar», «Borrar» y
  el resto de «Hito ▾» se quedan como están.

## Pantalla de prueba (aprobada el 6-nov-2026)

- `docs/pantallas/553.html` · https://claude.ai/artifact/1v2TDESpsDGkWTDAcsfJoS
- La pantalla enseña el hito como quedará después de aplicar el plan de las guías (sin la caja
  «Nueva tarea…»). Los botones que dicen «igual que hoy» no cambian.
- Las listas, los tipos y las plantillas de la pantalla son inventados; en la app son los de la
  lista común y de las plantillas del centro.

## Qué NO se hace en esta tarea

- La caja «Nueva tarea…» y su «Qué se hace»: los quita el plan de las guías (fila 551, paso 554).
- «Llamar por teléfono» como «Qué se hace», con su registro de llamadas: idea 557.
- Nada cambia en los asuntos abiertos al guardar un orden o una tarea en la guía.

## Notas técnicas de Claude

- Ficheros que tocan esto: `js/hitos-panel-lista.js` (`cuerpoDeHito`: las secciones), `js/hito-mesa-guion.js`
  (cabecera «Tareas», etiqueta de acción, franja del orden), `js/hito-mesa-tarea-menu.js`
  (`opciones`: «Subir»/«Bajar»), `js/comunes-asunto.js` (`botonesHTML` sin «+ Añadir hito»;
  `anadirHito`/`ponerHito` con la posición elegida), `js/comunes-ventana.js` y
  `js/comunes-ventana-nuevo.js` («Va detrás de»), `js/hito-mesa.js` (la tira con «+ Añadir hito»;
  `opcionesMas` sin «Crear»), `js/comunes-cambiar.js` (`tarea`: «Qué se hace» con `Comunes.HACE` y
  los datos de cada acción, incluido `TareaCopiarEditor` de la fila 552), `css/hito-mesa.css`.
- El orden en este asunto se guarda en el propio hito del asunto (por ejemplo, la lista de `id` de
  su guion) y `Hitos.guionDe` lo respeta; tareas que no estén en esa lista (nuevas de la guía) van
  al final, en su orden. El orden de la guía se guarda con `GuiasDelCentro.guardarPasos` sobre el
  paso del hito, sin repartirlo a los asuntos abiertos.
- «Va detrás de» usa `HitosDesdeElAsuntoNucleo.colocarTrasAncla` con el hito elegido, en el asunto
  y, con «este asunto y los siguientes», en la guía (`pasoAnclaDeHito`).
- Al cambiar la acción de una tarea común: lista común → `ComunesGuardado.fijarEnAbiertos` →
  `repartirEnGuias`, como hoy con el nombre y la plantilla. La receta vieja que ya no sirva a la
  acción nueva se quita.
- Un recuadro no lleva `overflow: hidden` (cortaría el menú ⋮); la esquina redonda de la cabecera va
  en la propia cabecera.
- Ningún fichero de `js/` pasa de 600 líneas (regla de `docs/CONTEXTO-CORTO.md`).
- Esta tarea deja hacer el paso 556 (cambiar una tarea a «Copiar a otra carpeta» con «Cambiar la
  tarea»), que hoy no se puede.

## Cómo lo comprueba el segundo revisor

- Con el hito abierto, Tareas, Campos, Documentos y Registro salen cada uno en su recuadro, con
  cabecera de fondo propio, título «Tareas», «Campos», «Documentos», «Registro» y su cuenta.
- El menú ⋮ de la última tarea se ve entero (se abre hacia arriba si no cabe).
- ⋮ → «Subir» y «Bajar» mueven la tarea; «Subir» está apagado en la primera y «Bajar» en la última.
- Tras mover una tarea de la guía sale la franja; «Guardar también en la guía» guarda el orden en la
  guía (un asunto nuevo del tipo sale con ese orden; otro asunto abierto del tipo, no cambia);
  «Solo en este asunto» deja la guía igual y quita la franja.
- Mover solo tareas «solo aquí» no hace salir la franja.
- ⋮ → «Cambiar la tarea» enseña Nombre, «Qué se hace» y, si genera o comunica, Plantilla; cambiar
  «Qué se hace» cambia los datos de debajo; al guardar, la etiqueta de la tarea dice la acción
  nueva y un asunto abierto del mismo tipo conserva la vieja.
- Cada tarea con acción enseña su etiqueta.
- Bajo las tareas solo está «+ Añadir tarea»; «+ Añadir hito» está al final de la tira de hitos.
- La ventana de «+ Añadir hito» tiene «Va detrás de», con el último hito marcado «(al final)»; el
  hito entra donde se elige, eligiendo de la lista y creando uno nuevo.
- «Hito ▾» no tiene «Crear»; sí «Cambiar» y «Borrar».
- Comparar todo con `docs/pantallas/553.html`.

## Revisión y respuestas durante el trabajo

- Revisor (6-nov-2026, vuelta 1): COINCIDE (cuatro recuadros): con el hito abierto (CERTIFICADO A26-0003 y BAJA MEDICA A26-0014) salen Tareas, Campos, Documentos y Registro, cada uno en su recuadro con cabecera de fondo azul grisáceo propio y título en negrita mayor; cuentas «0 de 4», «1» (Campos con un campo), «1» (Documentos), «1 línea» (Registro). Campos/Documentos/Registro vacíos salen sin cuenta o con «0» (Documentos); la pantalla de prueba solo enseña los casos con datos. «Normativa» no la vi en estos hitos (no la trae la demo): NO LO HE PODIDO VER.
- Revisor (6-nov-2026, vuelta 1): COINCIDE (menú ⋮ no se corta): con ventana 1500x650 y la última tarea pegada al borde inferior de la columna, el menú se abre hacia arriba y se ve entero (Subir/Bajar/Anotar/Cambiar la tarea/Borrar/Abrir en la guía); con la tarea más arriba se abre hacia abajo y también cabe. Ojo: hoy la última tarea nunca está pegada al borde porque debajo aún está la caja «Nueva tarea…» (la quita el 554).
- Revisor (6-nov-2026, vuelta 1): COINCIDE (Subir/Bajar): el menú ⋮ lleva Subir y Bajar arriba, raya, y luego Anotar / Cambiar la tarea / Borrar / Abrir en la guía. «Subir» apagado en la primera y «Bajar» apagado en la última (comprobado con 4 tareas). Subir/Bajar cambia el orden al momento. En una tarea «solo aquí» el menú es: Subir / Bajar / Anotar / Cambiar / Pasar a la guía / Borrar.
- Revisor (6-nov-2026, vuelta 1): COINCIDE (franja y guía): al subir una tarea de la guía sale «Has cambiado el orden de las tareas en este asunto.» con «Guardar también en la guía» y «Solo en este asunto». Antes de pulsar nada, `GuiasDelCentro.pasosDe('CERTIFICADO')` sigue con el orden viejo. «Guardar también en la guía»: la guía pasa a A, C, B y la franja se va. «Solo en este asunto»: la guía queda A, B, C y la franja se va. Otro asunto abierto del mismo tipo (CERTIFICADO A26-0004, reservado) conserva A, B, C tras guardar el orden nuevo en la guía. «Un asunto nuevo del tipo sale con ese orden»: NO LO HE PODIDO VER por pantalla (no creé un asunto nuevo); solo vi que el orden guardado en la guía es el nuevo.
- Revisor (6-nov-2026, vuelta 1): COINCIDE (solo aquí no dispara la franja): mover una tarea «solo aquí» arriba y abajo no hace salir la franja ni toca la guía.
- Revisor (6-nov-2026, vuelta 1): COINCIDE con una pega de texto (Cambiar la tarea): ⋮ → «Cambiar la tarea» enseña Nombre y «Qué se hace» (Generar documento, Firmar, Registrar, Comunicar, Añadir documento, Pedir datos, Copiar a otra carpeta, Otra cosa) y, si es Generar o Comunicar, Plantilla (cada una con su lista, con «Plantilla nueva…» al final, que abre «Nueva plantilla de documento»); «Copiar a otra carpeta» enseña «Nombre del fichero copiado»; Añadir/Firmar/Registrar no enseñan nada debajo. Al guardar un cambio de Pedir datos a Comunicar la etiqueta pasa a «Comunicar» y la guía guarda `comunicar`. El aviso «Esta tarea se usa en 1 tipo: CERTIFICADO. Cambiará en todos. Los otros asuntos abiertos siguen como están.» sale. Que un asunto abierto del mismo tipo conserve la acción vieja: NO LO HE PODIDO VER (el único otro CERTIFICADO está reservado y las tareas de la prueba las creé yo). En una tarea «solo aquí», «Cambiar» abre un editor dentro de la propia fila (no ventana) con «Qué se hace» sin las opciones «Copiar a otra carpeta» y «Otra cosa», y al pasar a Comunicar salen «Por dónde» y «Plantilla de correo» sin «+ Plantilla nueva…»; guarda y la etiqueta cambia, la guía no cambia. El texto dice «las mismas acciones que al crear»: en la ventana de crear la etiqueta del campo es «Qué hace», no «Qué se hace».
- Revisor (6-nov-2026, vuelta 1): COINCIDE (etiquetas de acción): «Comunicar», «Pedir datos» salen en pequeño junto al nombre; una tarea sin acción no lleva etiqueta; una «solo aquí» lleva «solo aquí».
- Revisor (6-nov-2026, vuelta 1): COINCIDE (+ Añadir hito): bajo las tareas solo queda «+ Añadir tarea» (más la caja «Nueva tarea…» vieja, que es del 554) y «+ Añadir hito» está al final de la tira («← Hitos | 1. … | 2. … | + Añadir hito»), único botón así en pantalla.
- Revisor (6-nov-2026, vuelta 1): COINCIDE (ventana «Va detrás de»): la ventana «Elegir un hito» tiene buscar, lista, «Va detrás de» con el último marcado «(al final)», «Para» y «+ Crear un hito nuevo». Creando: detrás del 1 con «solo este asunto» entra el 2; detrás del último entra al final; con «guía» entra también en la guía en medio (Preparar / GuiaMedio / Entregarlo). Eligiendo de la lista (un hito común recién creado) con «Va detrás de» = 1: entró en el puesto 2. La lista de la demo empieza vacía («No hay ningún hito así»), así que solo pude probar la lista con un hito que creé yo.
- Revisor (6-nov-2026, vuelta 1): COINCIDE («Hito ▾» sin «Crear»): el menú trae Cambiar / Borrar / Dejarlo solo informativo / Cambiar la guía… / Enviar estado; no hay «Crear».
- Revisor (6-nov-2026, vuelta 1): COINCIDE con diferencias de maquetación (comparar con 553.html): cabeceras, etiquetas, tira con «+ Añadir hito» y menú con raya parecen a la pantalla de prueba. Diferencias: (1) en la app la columna del hito es estrecha (la ficha va en dos columnas) y la franja del orden envuelve: «Solo en este asunto» cae a una segunda línea; en la pantalla de prueba va en una sola fila a todo el ancho. (2) La franja sale debajo de las tareas pero encima de la caja vieja «Nueva tarea…», no entre las tareas y «+ Añadir tarea» como en la pantalla; se arregla solo cuando el 554 quite la caja. (3) El PDF/ejemplo de la pantalla muestra la barra verde de progreso en «Tareas»; en la app solo se ve una barra casi invisible cuando hay 0 hechas. (4) La pantalla de prueba se me ve con tildes rotas (falta `charset` al servirla en local; no es la app).
- Revisor: lo que hace la app y el texto no pide: (a) en la ventana de «Cambiar la tarea» de una tarea de guía, el desplegable no ofrece «Sin acción» (sí «Otra cosa»), mientras que el editor de «solo aquí» sí ofrece «Sin acción» y no ofrece «Otra cosa»/«Copiar a otra carpeta»; es una diferencia entre las dos formas de cambiar. (b) Aparecen enlaces «No aplica» y «Ver los datos» bajo algunas tareas, y la primera tarea sale resaltada en amarillo con botón de acción («Enviar correo»); parece anterior a esta fila. (c) Con 0 tareas el contador dice «0 de 0» y con tareas solo aquí cuenta también esas («0 de 4» con una «solo aquí»); el texto no dice si las «solo aquí» cuentan en el «N de M».
- Respuesta de Claude Code (6-nov-2026): «Qué hace» en la ventana de crear una tarea nueva es de la fila 531 y no se toca aquí. La franja y la barra de progreso se quedan como están (la franja envuelve en columna estrecha). «Cambiar el hito» de un hito común se queda bajo las tareas (el texto solo habla de quitar «+ Añadir hito»). Lo que el revisor no pudo ver (asunto nuevo con el orden de la guía; asunto abierto que conserva la acción vieja) lo cubre `pruebas/partes-del-hito.mjs` (3a, 3c, 6f). «Normativa» no cambia y no se pudo ver en la demo.
