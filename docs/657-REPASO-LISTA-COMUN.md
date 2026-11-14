# 657 — Repaso de una vez de la lista común de hitos y tareas

Segunda de las cuatro partes del tema 650 («Crear tareas e hitos con fluidez»). La primera es la fila 651 (acciones que faltan); esta va detrás de ella. De dónde se parte: `docs/notas-diseno/650.md`. El plan entero, para leer: `docs/657-PLAN-REPASO.md`.

## Lo que escribió Francisco

14-nov-2026, durante el diseño del tema 650:

> ¿Hay forma de ponerle sentido o sistema racional a las listas de tareas y de hitos? Mi idea es que si tenemos Hitos comunes a distintos tipos de asunto bien configurados con sus tareas, acciones y plantillas nos ahorraría mucho tiempo. Y con el método que propones me temo que crearíamos muchos hitos para lo mismo. Lo mismo ocurre con las tareas.

> Creo que aquí estamos en un momento crucial y creo que con esa perspectiva que tienes ahora, deberías revisar todas las tareas e hitos que tenemos ahora en la app, para ver que nos vamos a encontrar y si nos hemos olvidado de algo.

Eligió que el repaso sea una parte propia del tema, con un plan preparado por Claude y aplicado con un botón. Sobre las reglas del repaso: «Hagamos como tú propones». Sobre «Tramitar»: la opción 2 (se queda, con la fase «recibir», en las guías que no tienen nada más).

## Lo que entendió Claude (acordado con Francisco el 14-nov-2026)

**Las fases.** Once, fijas, que dicen lo que hace quien usa la app (no el trámite jurídico): recibir, pedir, comprobar, elaborar el documento, poner a la firma, publicar, enviar o entregar, hacer en Séneca, cobrar o pagar, esperar, archivar.

**El repaso** (el detalle, hito por hito y guía por guía, en `docs/657-PLAN-REPASO.md`):
- Cada hito común lleva su fase.
- Los hitos comunes con la misma fase y las mismas tareas se unen en uno, con un solo nombre. Quedan 101 de 118.
- En cada guía, los hitos seguidos de la misma fase se juntan en uno (14 juntas en 12 guías), salvo que lleven distinta condición, distinto responsable, o esperen documentos que llegan en momentos distintos.
- Un hito sin tareas recibe una tarea que dice lo mismo que su nombre, con su acción.
- Cada tarea lleva su acción, con las cinco de la fila 651. Quedan 17 tareas como «Otra cosa» (de 85).
- Seis tareas se unen a otra igual con distinto nombre, y diez se quitan (las hace la app sola o son pasos de otra pantalla). Salen de la lista común las 27 tareas que no usa ninguna guía activa.
- Algunos hitos cambian de nombre al unirse (por ejemplo, «Firma de Dirección» y «Firma digital Dirección» pasan a «Poner a la firma»).
- Las líneas «Hay que reunirlo» y las preguntas de las guías se quedan como están.
- «Tramitar» se queda, con la fase «recibir», en las 17 guías que solo tienen «Tramitar · Esperar respuesta». Se quita en CONFORMIDAD y CERTIFICADO C.E.
- Solo se tocan los 65 tipos activos.

**Cómo se aplica** (igual que el plan de las guías, fila 551):
1. Botón «Aplicar el repaso de la lista común» en Herramientas.
2. Al pulsarlo, enseña antes qué va a cambiar, sin cambiar nada: hitos que se juntan, que cambian de nombre o se quitan, guía por guía; tareas que se unen o se quitan; y lo que no encuentra.
3. «Aplicar» pide confirmación, guarda una copia de las guías y de las dos listas comunes, y aplica el plan tal cual.
4. Lo que el plan no encuentra (porque la guía cambió después del 13-nov-2026) se salta y se dice. No se inventa nada.
5. Los asuntos ya abiertos no cambian: el repaso toca las guías y las listas comunes. Los asuntos nuevos nacen con las guías repasadas.
6. Una vez aplicado, el botón desaparece.

**Lo que se ve después:** las guías de los tipos con sus hitos juntos y renombrados, y las tareas con su acción en la etiqueta. La fase se guarda en cada hito común, pero todavía no se ve ni se elige en ninguna pantalla: eso es la parte 3.

**Lo que desaparece:** los hitos y tareas que el plan quita o une (lista completa en el plan), y las 27 tareas comunes sin uso.

## Pantalla de prueba

- Sin pantalla: no cambia ninguna pantalla; cambia el contenido de las guías y de las listas, que está entero en `docs/657-PLAN-REPASO.md`. El botón es igual que el de la fila 551.

## Qué NO se hace en esta tarea

- Ver o elegir la fase al añadir un hito, la lista de fases en Ajustes, la marca de la guía y crear tareas e hitos en el asunto: parte 3 del tema 650.
- La bandeja con hito y tarea: parte 4 del tema 650.
- Rellenar las 17 guías que solo tienen «Tramitar · Esperar respuesta», o las 11 de tipos activos sin guía.
- Los tres hitos de TRASLADO DE EXPEDIENTE ACADÉMICO… que parecen repetir los de «Si no está en Séneca»: se dejan como están.
- Los tipos desactivados: sus guías no se tocan.

## Notas técnicas de Claude

- Va detrás de la fila 651: necesita los valores de acción `seneca`, `entregar`, `publicar`, `cobrar` y `comprobar`.
- Los datos del plan están en `docs/657-plan-guias.json`: por tipo, la lista de hitos nuevos en su orden, cada uno con `titulo`, `fase` (`recibir`, `pedir`, `comprobar`, `elaborar`, `firma`, `publicar`, `enviar`, `seneca`, `cobrar`, `esperar`, `archivar`), `de` (los `id` de los hitos de la guía de hoy que lo forman), `antes` (el nombre de hoy, si cambia) y `tareas` (cada una con `texto`, `accion`, `tipo` —`null`, `pregunta` o `reunir`— y `de`, el `id` de la línea de la guía de hoy, o `null` si es nueva). Pasarlos a un fichero de datos que viaje con la app, como `datos-biblioteca/`; `docs/` no se publica.
- Se busca por `id` (hitos y líneas de la guía); si el `id` no está, por nombre exacto (sin distinguir mayúsculas ni espacios dobles); si tampoco, va a «No encontrado».
- Juntar hitos de una guía: `toca`, `tocaA`, `estadoAsunto`, `soloSi` y `responsable` del primero; `plazo` del último; `plantillasDocumento`, `formularios`, `normativa` y `requisitos` unidos sin repetir; `cuerpo` uno debajo de otro, sin repetir los iguales. Las líneas de guion que vienen de un hito viejo conservan su `id`, `receta`, `explicacion`, `normativa`, `reunir`, `obligatorio`, `pregunta` y `opciones`.
- Las listas comunes se rehacen desde las guías repasadas: un hito común por cada pareja (fase, juego de tareas); los tres partes de BAJA MEDICA, uno por parte. El hito común lleva `fase`. Conservar el `id` común de hoy cuando el hito venía de uno solo; al unir, el del más usado. Una tarea común por texto, con su acción.
- Las versiones anteriores de la app que lean un hito común con `fase` no deben borrarla al guardar (comprobarlo como en la 651).
- Aplicar escribe por `ColaGuardado`, con la copia de `Copias.guardar` antes. Se apunta en `_GESTOR` que el repaso está aplicado; con esa marca desaparece el botón.
- Copia de los cuatro ficheros reales del 13-nov-2026 (sin datos de personas) en `pruebas/apoyo/datos-657/`, para las pruebas y el revisor.
- Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor

- Prueba automática con `pruebas/apoyo/datos-657/`: aplicar el repaso da 101 hitos comunes, todos con una de las once fases, y las guías de los 65 tipos activos iguales a `docs/657-plan-guias.json` (títulos, orden, tareas y acciones); «No encontrado» vacío.
- Con esos datos: MATRICULA queda con seis hitos, en este orden: «Registro de entrada», «Grabar en Séneca la unidad y las optativas», «Preparar Ficha libros», «Comunicar al equipo educativo y entregar el horario», «Foto para Séneca», «Abrir/Guardar en el Expediente».
- CERT. MATRICULA termina en «Enviar el certificado», con «Registrar de salida el documento» y «Enviar el documento al solicitante por la vía acordada».
- IPASEN ALUMNADO sigue con «Tramitar · Esperar respuesta»; CONFORMIDAD ya no tiene «Tramitar».
- Las líneas «Hay que reunirlo» de «Alta y actualización de datos» siguen igual; «Recoger la cuenta corriente» ya no está.
- Las guías de los tipos desactivados y los asuntos abiertos no cambian.
- Antes de aplicar, la vista previa enseña los cambios sin tocar nada; después de aplicar, el botón ya no está y existe la copia.
- [SOLO FRANCISCO] Pulsar «Aplicar el repaso de la lista común» en el instituto, con los datos reales.

## Qué mirar al terminar

- En el instituto, Herramientas → «Aplicar el repaso de la lista común»: mira la vista previa y pulsa «Aplicar».
- Abre la guía de MATRICULA: seis hitos, con los pasos de Séneca juntos.
- Crea un asunto de CERT. MATRICULA: el último hito, «Enviar el certificado», trae el registro de salida y el envío.
- En cualquier guía, mira que las tareas llevan su acción en la etiqueta («En Séneca», «Comprobar»…).

## Revisión y respuestas durante el trabajo

- Segundo revisor (14-nov-2026, ayudante sin haber visto el código). **Coincide:** 101 hitos comunes, todos con una de las once fases; las guías de los 54 tipos con guía igual que `docs/657-plan-guias.json` (títulos, orden, tareas, acciones, líneas «Hay que reunirlo» y preguntas); las 10 guías revisadas a mano (MATRICULA, CERT. MATRICULA, ANULACIÓN MATRÍCULA, COMPRA, CONFORMIDAD, CERTIFICADO C.E, PROY. PRÁCTICAS, BAJA MEDICA, IPASEN ALUMNADO, Alta y actualización de datos); al juntar hitos se conservan los campos como dice el texto; no se pierde nada salvo las 10 tareas que se quitan y las 6 que se unen; ningún `id` común queda huérfano; los tipos desactivados quedan byte a byte iguales; el botón (vista previa sin cambiar nada, confirmación, copias de guías y de listas, desaparece al aplicar, sin errores de consola); lo no encontrado se salta y se dice.
- **No coincidía y se corrigió:** al crear el hito común, el cuerpo de un hito se mezclaba con el de otras guías (22 hitos con texto de otra guía, sin espacio). Ahora cada guía conserva su cuerpo y solo se juntan los de los hitos que se unen dentro de una guía (comprobado en la prueba 1m). El aviso «Los asuntos abiertos no cambian» era demasiado fuerte: ahora dice que conservan las tareas que tenían.
- **No coincide con el texto, y se deja así (lo manda el plan en datos):** salen 145 tareas comunes (134 del plan + 2 de dentro de preguntas + 9 líneas «Hay que reunirlo») y 19 «Otra cosa» (17 + 2 de dentro de preguntas); «Enviar el certificado» y «Pedir la documentación al centro de origen» quedan cada uno como dos hitos comunes (con distintas tareas, según `docs/657-plan-guias.json`); los dos hitos con una pregunta dentro («Registro de entrada de la factura», «Envío de la Comunicación») no son hito común y no tienen fase. Responsable: «del primero» en los hitos que se juntan (IDENTIFICACION TUTOR LEGAL pierde «administracion» del segundo).
- **No lo he podido ver:** un asunto abierto con hito de guía (la demostración no lo tiene): el repaso congela en él lo que cambia o se quita de una tarea, pero un hito abierto conservado puede mostrar en vivo tareas nuevas de la guía. Una versión anterior de la app que guarde las listas comunes borra la `fase` (se resuelve recargando la versión nueva en todos los ordenadores). Una línea de la guía que la usuaria hubiera editado y se encuentre por `id` se sobrescribe con la del plan.
- La sesión: pruebas completas en verde salvo «copiar-ruta» (falla también sin este cambio, por el entorno); «hacer-este-hito» e «inicio-columnas» fallaron en la tanda por carga y pasan a solas.
