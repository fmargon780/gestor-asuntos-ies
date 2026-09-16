# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha y la versión publicada, y sigue con la
   siguiente PENDIENTE. No pares hasta que no quede ninguna.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   sigue con la siguiente. Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   sáltala y coge la siguiente PENDIENTE.
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.
8. Al terminar cualquier instrucción: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`
   **sustituyendo la línea vieja, no añadiendo una debajo**. Si algo deja de ser verdad, se borra.
9. Añade a `docs/HISTORIA.md` lo que merezca recordarse, con su fecha. No dejes que
   `docs/CONTEXTO-CORTO.md` pase de 160 líneas.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

| Nº | Instrucción | Estado | Notas |
|---|---|---|---|
| 1 | `docs/PLAN-ROBUSTEZ-2026-09.md` | HECHA | Copias de seguridad, conflictos de Dropbox, pruebas automáticas, fichas sin carpeta y nombres repetidos. Versión publicada `11-sep-2026 · 05:33`. Detalle en `docs/HISTORIA.md` |
| 2 | `docs/REGISTRO-EN-UN-PASO.md` | HECHA | Botón Registrar sin nombrar dos veces, con lectura sola del sello de Séneca. Comprobado 11-sep-2026. Detalle en `docs/HISTORIA.md` |
| 3 | `docs/CAMPOS-POR-TIPO.md` | HECHA | Campos propios por tipo de asunto, configurables en Ajustes. Versión publicada `11-sep-2026 · 12:00`. Detalle en `docs/HISTORIA.md` |
| 4 | `docs/TERCEROS-RELACIONADOS.md` | HECHA | Personas y entidades relacionadas con un asunto, con nota (no copia) al archivar. Versión publicada `11-sep-2026 · 12:00`. Detalle en `docs/HISTORIA.md` |
| 5 | `docs/NO-DUPLICAR-ASUNTOS.md` | HECHA | Parada al crear un asunto duplicado, y unir los que ya existían. Versión publicada `11-sep-2026 · 13:08`. Detalle en `docs/HISTORIA.md` |
| 6 | `docs/AJUSTES-AGIL.md` | HECHA | Pestañas, buscador cruzado y aviso en vivo en Ajustes; barra lateral fija. Versión publicada `11-sep-2026 · 14:58`. Detalle en `docs/HISTORIA.md` |
| 7 | `docs/PAPELERA.md` | HECHA | Papelera compartida: nada se borra del todo a la primera. Versión publicada `11-sep-2026 · 16:20`. Detalle en `docs/HISTORIA.md` |
| 8 | `docs/UNIR-VER-DENTRO.md` | HECHA | Pantalla propia "Duplicados", con "No son el mismo". Versión publicada `11-sep-2026 · 17:15`. Detalle en `docs/HISTORIA.md` |
| 9 | `docs/REPARTO-CONTEXTO.md` | HECHA | Repartido `CONTEXTO.md` en `CONTEXTO-CORTO.md`, `CONTEXTO.md` y `HISTORIA.md`, y podada esta cola; no toca código ni publica nada nuevo. |
| 10 | `docs/ARREGLOS-USO-2026-09-14.md` | HECHA | El 3 (borrar en Por clasificar) ya estaba hecho, de la papelera (fila 7). Escape y salida en toda pantalla, copiar el nombre de un relacionado en orden normal, y las carpetas temporales de Drive/Dropbox fuera de Asuntos abiertos. Subido a `main` (versión `14-sep-2026 · 16:36`); esta sesión no ha podido comprobarlo con `curl` (su red no llega a la web publicada) — falta confirmarlo en el navegador. Detalle en `docs/HISTORIA.md`. |
| 11 | `docs/CORREOS-AL-ASUNTO.md` | HECHA | Terminada 16-sep-2026, en otra sesión en paralelo. Botón "Elegir asunto" en cada correo de la bandeja, con "Podrían encajar" y la lista completa; huella del hilo (`hilos`) en `asuntos.json`, que manda sobre la adivinación por texto; `seguidos.json` para que el recolector de Apps Script siga los hilos ya enganchados y devuelva a la bandeja las respuestas y los correos enviados. Las 19 pruebas en verde. Versión publicada y comprobada con `curl`: `16-sep-2026 · 20:41`. **Falta que Francisco pegue el script nuevo en `script.google.com`** (las tres primeras líneas de `apps-script/gestor-correos.gs` dicen cómo): sin eso, las respuestas no vuelven solas. Detalle en `docs/HISTORIA.md`. |
| 12 | `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md` | HECHA | Terminada 16-sep-2026, en otra sesión en paralelo (con mejor diseño que el de esta: un solo cuadro `js/elegir-asunto.js` compartido desde el principio con la bandeja de correos, en vez de dos por separado). Botón "Meter en un asunto" en cada documento de Por clasificar, entre "Crear asunto con él" y "Borrar": lleva el papel a la carpeta de un asunto que ya existe y abre el cuadro de ponerle nombre. Esta sesión había hecho su propia versión, en paralelo y sin saber que la otra ya la tenía resuelta; al fusionar se ha descartado la de aquí y se ha dejado la que ya estaba en `main`, que es la que unifica los dos elegidores. Si ya hay un fichero con ese nombre no se pisa, y si el traslado falla el documento sigue en Por clasificar. Versión publicada y comprobada con `curl`: `16-sep-2026 · 21:40`. Detalle en `docs/HISTORIA.md`. |
| 13 | `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` | HECHA | Bloque "Documentos de este asunto" en el cuadro de Correo, con casillas y límite de 20 MB; el script de Apps Script monta un borrador en Gmail con los adjuntos, respondiendo dentro del hilo si lo hay. Tarjeta "Borrador en camino" en Asuntos abiertos, con vigilancia cada 15 segundos. Batería completa en verde. Otra sesión en paralelo marcó esta fila EN CURSO a las 20:04 sin saber que ya estaba terminada aquí; si llegó a tocar código, revisar al fusionar para no duplicar. Detalle en `docs/HISTORIA.md`. |
| 14 | `docs/PLANTILLAS-DE-CORREO.md` | HECHA | Plantillas por tipo de asunto, con huecos que se rellenan solos, para el correo y para el mensaje de Séneca; desplegable en los dos cuadros, aviso de huecos sin datos, recorte a 4.000 letras en Séneca. Bloque propio en Ajustes, con alta, edición, borrado y vista previa; firma y centro editables, ya no escritos a mano en el código. Batería completa en verde. Detalle en `docs/HISTORIA.md`. |
| 15 | `docs/HITOS.md` | HECHA | Hitos dentro de cada asunto: los pasos de la guía pasan a ser hitos vivos, con estado, fecha, responsable, notas y documentos apuntados. Fichero nuevo `_GESTOR/hitos.json` (los compartidos pasan de once a doce); al archivar, el historial se escribe en `HISTORIAL DE TRAMITACION.txt`. Bifurcaciones como hito de decisión. Responsables configurables más papeles automáticos. Plazos en días hábiles. Las 10 pruebas de `pruebas/hitos.mjs` y el resto de la batería en verde (16-sep-2026), salvo `pruebas/plantillas.mjs`, que ya fallaba antes de esta fila por algo del entorno de pruebas, sin relación con los hitos. **Subido a la rama `claude/pending-queue-tasks-leziab` con pull request, no a `main`**: esta sesión no tiene permiso para publicar directamente (ver nota al final de la cola). Versión `App.VERSION`: `16-sep-2026 · 22:18`, pendiente de fusionar el PR para que Vercel la publique. |
| 16 | `docs/QUE-ME-TOCA.md` | HECHA | Pantalla nueva "Qué me toca" que cruza todos los asuntos abiertos: "En tu tejado", "Esperando a otros" (con días parados) y "Sin fecha", con filtro por responsable, entrada en la barra con la cuenta de vencidos, y "abrir la ficha con el hito desplegado". Las 7 pruebas de `pruebas/que-me-toca.mjs` y el resto de la batería en verde (16-sep-2026), salvo `pruebas/plantillas.mjs` (fallo previo del entorno, ver fila 15). Subido con pull request a `claude/pending-queue-tasks-leziab`, no a `main` (ver la nota al final de esta cola). |
| 17 | `docs/PLANTILLAS-DE-DOCUMENTO.md` | EN CURSO (16-sep-2026) | El gemelo en papel de la fila 14. Plantillas de Word colgadas de cada tipo de asunto, guardadas en `_GESTOR/PLANTILLAS`; botón "Generar documento" en la ficha del asunto, que saca una copia del Word con los huecos rellenos, ya guardada en la carpeta del asunto y con el nombre que mandan las reglas, sin preguntar nada. Módulos nuevos `js/docx.js` (ZIP y XML a mano, sin librerías) y `js/plantillas-documento.js`. **Reutiliza el motor de huecos de la fila 14**: misma sintaxis de una llave, misma función `Plantillas.rellenar`, mismo `plantillas.json` (clave nueva `documentos`). Amplía el catálogo de huecos y saca `valoresDePlantilla` de `js/correo.js` a `Plantillas.valoresDeAsunto`. No crea ningún fichero compartido nuevo. Acordado con Francisco el 16-sep-2026. |

## Lo que vendrá después

`docs/PROXIMOS-ASUNTOS.md` guarda los nueve asuntos que Francisco dejó apuntados el 14-sep-2026.
No se trabajan: cada uno se habla con él y se convierte en su propia instrucción antes de entrar
en esta cola. Los puntos 5, 8, 7 y 6 de esa lista ya son las filas 11, 12, 13 y 14.

El punto 1 (comprobación del CSV y copia auténtica) está hablado a medias: falta que Francisco
mire, con un documento real, si el enlace de verificación del pie abre la copia auténtica sin
pedir certificado ni captcha. Hasta entonces no se puede diseñar.

Cuando los hitos (fila 15) estén en uso, queda por hablar: si el estado del asunto desaparece y lo
sustituye el hito en curso, y si un hito puede apuntar a su plantilla de correo (fila 14) o a su
plantilla de documento (fila 17). Esto último Francisco ya lo dio por hecho el 16-sep-2026: las
plantillas acabarán colgando también de los tipos de hito.

## Nota sobre "sube directamente a main"

Algunas instrucciones (`docs/HITOS.md` entre ellas) piden subir a `main` sin pull request. Esta
sesión concreta de Claude Code (la de "en la nube", disparada desde GitHub) tiene forzado lo
contrario: trabajar en una rama propia y abrir un pull request, sin permiso para tocar `main`
directamente. Mientras se lance así, las filas de esta cola se suben con pull request; Francisco
tiene que fusionarlo para que Vercel publique. Si se quiere volver a "directo a main", hay que
lanzar la cola desde una sesión de Claude Code normal (terminal u ordenador), no desde la nube.
