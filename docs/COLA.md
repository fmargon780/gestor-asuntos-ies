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
10. **Antes de subir nada, vuelve a bajar `main`.** Marcar la fila EN CURSO no basta: otra sesión
    puede haber fusionado su trabajo mientras tanto, y subir ficheros enteros sin releer pisa lo
    suyo. Pasó el 16-sep-2026 con las filas 13 y 14.

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
| 13 | `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md` | HECHA | Bloque "Documentos de este asunto" en el cuadro de Correo, con casillas y límite de 20 MB; el script de Apps Script monta un borrador en Gmail con los adjuntos, respondiendo dentro del hilo si lo hay. Tarjeta "Borrador en camino" en Asuntos abiertos, con vigilancia cada 15 segundos. Batería completa en verde. **Aviso resuelto 16-sep-2026 · 22:40:** otra sesión marcó esta fila EN CURSO a las 20:04, hizo su propia versión sin saber que esta ya estaba fusionada, y al subirla pisó ficheros de las filas 13 y 14 (entre ellos la línea de `js/plantillas.js` de `index.html`). Se ha deshecho: `main` está otra vez byte a byte como antes de aquello, comprobado con `curl` contra lo publicado, y la batería completa vuelve a pasar. De ahí sale la regla 10 de esta cola. Versión publicada: `16-sep-2026 · 21:48`. Detalle en `docs/HISTORIA.md`. |
| 14 | `docs/PLANTILLAS-DE-CORREO.md` | HECHA | Plantillas por tipo de asunto, con huecos que se rellenan solos, para el correo y para el mensaje de Séneca; desplegable en los dos cuadros, aviso de huecos sin datos, recorte a 4.000 letras en Séneca. Bloque propio en Ajustes, con alta, edición, borrado y vista previa; firma y centro editables, ya no escritos a mano en el código. **Se había marcado HECHA sin estarlo del todo** (el bloque de Ajustes se hizo, pero `js/correo.js` no llegó a usar las plantillas): lo terminó de verdad la misma sesión de la fila 13, en el mismo pull request, con el desplegable en `#correo-comunes` que pedía el encargo. **En paralelo, esta sesión (la de las filas 15-17) hizo su propia versión del mismo arreglo, sin saber que ya estaba resuelto en `main`**; al fusionar, se ha mantenido la de `main` (llegó antes) y se ha descartado la de aquí, dejando solo el cambio que de verdad hacía falta encima: `js/correo.js` ahora llama a `Plantillas.valoresDeAsunto` (fila 17) en vez de tener su propia función de valores. Batería completa en verde. Detalle en `docs/HISTORIA.md`. |
| 15 | `docs/HITOS.md` | HECHA | Hitos dentro de cada asunto: los pasos de la guía pasan a ser hitos vivos, con estado, fecha, responsable, notas y documentos apuntados. Fichero nuevo `_GESTOR/hitos.json` (los compartidos pasan de once a doce); al archivar, el historial se escribe en `HISTORIAL DE TRAMITACION.txt`. Bifurcaciones como hito de decisión. Responsables configurables más papeles automáticos. Plazos en días hábiles. Las 10 pruebas de `pruebas/hitos.mjs` en verde. **Subido a la rama `claude/pending-queue-tasks-leziab` con pull request, no a `main`**: esta sesión no tiene permiso para publicar directamente (ver nota al final de la cola). Versión `App.VERSION`: `16-sep-2026 · 22:18`, pendiente de fusionar el PR para que Vercel la publique. |
| 16 | `docs/QUE-ME-TOCA.md` | HECHA | Pantalla nueva "Qué me toca" que cruza todos los asuntos abiertos: "En tu tejado", "Esperando a otros" (con días parados) y "Sin fecha", con filtro por responsable, entrada en la barra con la cuenta de vencidos, y "abrir la ficha con el hito desplegado". Las 7 pruebas de `pruebas/que-me-toca.mjs` en verde. Subido con pull request a `claude/pending-queue-tasks-leziab`, no a `main` (ver la nota al final de esta cola). |
| 17 | `docs/PLANTILLAS-DE-DOCUMENTO.md` | HECHA | El gemelo en papel de la fila 14. Plantillas de Word colgadas de cada tipo de asunto, guardadas en `_GESTOR/PLANTILLAS`; botón "Generar documento" en la ficha del asunto, que saca una copia del Word con los huecos rellenos, ya guardada en la carpeta del asunto y con el nombre que mandan las reglas, sin preguntar nada. Módulos nuevos `js/docx.js` (ZIP y XML a mano, sin librerías, con reparación de huecos partidos entre `<w:t>`) y `js/plantillas-documento.js`; el bloque de Ajustes de plantillas de correo se sacó a `js/plantillas-ajustes.js` para no engordar `js/plantillas.js`. Reutiliza el motor de huecos de la fila 14: misma sintaxis de una llave, `Plantillas.rellenar`, mismo `plantillas.json` (clave nueva `documentos`, más `localidad`/`direccion`/`codigo`/`cargo`). Catálogo de huecos ampliado; `valoresDeAsunto` (antes privada de `js/correo.js`, con otro nombre en la versión de `main`) ahora es pública y async en `js/plantillas.js`, y es lo único de la fila 14 que ha tenido que tocarse otra vez al fusionar (ver esa fila). No crea ningún fichero compartido nuevo. Las 8 pruebas de `pruebas/plantillas-documento.mjs` (con jsdom, sin navegador) en verde; verificado además abriendo un `.docx` de salida con `unzip -t`/`zipinfo -v`. Subido con pull request a `claude/pending-queue-tasks-leziab`, no a `main` (ver la nota al final de esta cola). Acordado con Francisco el 16-sep-2026. |
| 18 | `docs/CORREO-EN-DOS-BUZONES.md` | EN CURSO (17-sep-2026) | Acordado con Francisco el 17-sep-2026. Un mismo correo en los dos buzones: se guarda la matrícula del mensaje (el `Message-ID`, igual en todos los buzones), la bandeja saca una línea gris "ya está en el asunto X, lo metió Juan" cuando el correo ya lo guardó el otro, y las respuestas del hilo vuelven a los dos buzones. Toca también `apps-script/gestor-correos.gs`: al terminar hay que decirle a Francisco que vuelva a pegarlo en `script.google.com`. |
| 19 | `docs/CSV-DEL-DOCUMENTO.md` | PENDIENTE | Acordado con Francisco el 17-sep-2026; es el punto 1 de `docs/PROXIMOS-ASUNTOS.md`, reducido a lo que se puede hacer. Al abrir un PDF en el visor, se lee el pie, se saca el código de verificación y la dirección que el propio documento imprima, y salen dos botones: "Copiar el código" y "Abrir la verificación". Sin descargas automáticas: se descartó traer la copia auténtica sola, porque esas páginas piden formulario y cada administración tiene la suya. No toca el script de Apps Script. |
| 20 | `docs/REGISTRO-SIN-DUPLICAR.md` | PENDIENTE | Acordado con Francisco el 17-sep-2026; es el punto 9 de `docs/PROXIMOS-ASUNTOS.md`. Se da la vuelta al orden: la aplicación ve sola el PDF sellado que Francisco descarga a la carpeta del asunto, le lee el sello y le pregunta de qué documento es. Ese mismo fichero se renombra con su número de registro (no se genera una copia) y el documento sin sellar se va a la papelera. Además: todos los exploradores de carpetas se abren ya en la carpeta del asunto (`startIn`), y el sello se busca en todas las páginas y con el texto normalizado, que es lo que hacía que unas veces se detectara y otras no. No toca el script de Apps Script. |
| 21 | `docs/GRUPOS-DE-PERSONAS.md` | PENDIENTE | Acordado con Francisco el 17-sep-2026; es el punto 3 de `docs/PROXIMOS-ASUNTOS.md`, y crece. Señalar varios terceros a la vez con casillas; atajos de alumnado por unidad, nivel y enseñanza; grupos propios guardados con nombre en un fichero compartido nuevo, `_GESTOR/grupos.json`, manejados desde Ajustes y con borrado por papelera; y los mismos grupos sirven para poner los destinatarios de un correo, **siempre en copia oculta** por protección de datos. Fuera de esta fila, a falta de datos: departamentos, tutorías y equipos educativos. Toca `apps-script/gestor-correos.gs` (campo `cco`): si se hace en la misma vuelta que la fila 18, Francisco pega el script una sola vez al final. |
| 22 | `docs/SEPARAR-Y-UNIR-PDF.md` | PENDIENTE | Acordado con Francisco el 17-sep-2026; es el punto 4 de `docs/PROXIMOS-ASUNTOS.md`, y con él la lista del 14-sep queda entera. Tres acciones nuevas en el menú de cada PDF, en la carpeta del asunto y también en Por clasificar: Separar (miniaturas con tijera entre páginas), Unir (varios PDF ordenados con flechas) y Sacar páginas (casillas, y el original no se toca). Los originales de separar y unir van a la papelera. Librería nueva `pdf-lib` copiada en `js/lib/` y cargada solo cuando hace falta, como pdf.js: un PDF no se puede partir a mano como se hizo con el `.docx`. No toca el script de Apps Script. |
| 23 | `docs/REFRESCO-DE-PANTALLA.md` | HECHA | **La primera de todas.** La lógica de repintado ya estaba bien (comprobado con el disco de mentira: las tres acciones refrescaban solas); el fallo real es que nada avisaba de que se estaba guardando, y con la carpeta de verdad en Dropbox el guardado tarda lo bastante para parecer que no ha hecho nada. `U.mientrasGuarda(control, fn)` nuevo (`js/util.js`): apaga el control ("Guardando…" en un botón) mientras se guarda. Puesto en estado, vía, plazo, archivar/reabrir y en marcar/cambiar de rama/responsable/fecha/notas/documentos de un hito. Prueba nueva `pruebas/refresco.mjs`. Batería completa en verde. Fusionado con pull request (versión `App.VERSION`: `17-sep-2026 · 04:23`); esta sesión no ha podido comprobarlo con `curl` (su red no llega a la web publicada, igual que la fila 10). Detalle en `docs/HISTORIA.md`. |
| 24 | `docs/NO-PISARSE-EN-UN-ASUNTO.md` | HECHA | **La tercera, después de la 25.** Señal de presencia en `_GESTOR/presencia.json` (módulo nuevo `js/presencia.js`), a propósito fuera de los doce ficheros protegidos: se escribe y relee directo con `Carpetas`, nunca con `Copias.guardar`, y no entra en copias, papelera ni fusión de conflictos. Al abrir la ficha de un asunto libre se anuncia la propia señal (se renueva cada 30 s, caduca a los 3 min); si otro ya está dentro, se entra en modo consulta: aviso arriba y "Tomar el mando", con todos los controles que modifican apagados (recorriendo la ficha entera, sin tocar `js/hitos-panel-lista.js`, `js/correo.js` ni `js/plantillas-documento.js`) salvo una lista blanca de solo lectura. Marca en la tarjeta de la lista (envolviendo `App.tarjetaAsunto`, sin tocar `js/asuntos-lista.js`). Descartada, por ahora, una base de datos en internet para que el aviso fuera instantáneo. Prueba nueva `pruebas/presencia.mjs` (la "otra persona" se simula como en `pruebas/conflictos.mjs`). Batería completa en verde. Detalle en `docs/HISTORIA.md`. |
| 25 | `docs/POR-CLASIFICAR-DOCUMENTO-A-LA-VISTA.md` | HECHA | **La segunda, después de la 23.** El documento que se ve en el panel de la derecha queda marcado en su tarjeta de la lista (`.tarjeta-abierta`), con desplazamiento solo hasta ella; la cabecera del panel enseña el nombre completo, cortado por el medio si no cabe; y los tres botones de la tarjeta (Crear asunto con él, Meter en un asunto, Borrar) salen también dentro del panel, reutilizando la misma tarjeta (`App.accionesDeSuelto`), sin duplicar la lógica. `js/visor.js` gana un marcador y un hueco de acciones, los dos opcionales: `js/ficha-asunto.js` y `js/unir-asuntos.js` siguen igual. Prueba nueva `pruebas/documento-a-la-vista.mjs`. Batería completa en verde. Fusionado con pull request junto a la fila 23, mismo pull request #10. Detalle en `docs/HISTORIA.md`. |

**Orden de trabajo:** primero la 23, después la 25, después la 24, y solo entonces las filas 18 a
22. Las tres primeras son fallos y estorbos del uso diario; las otras cinco son funciones nuevas.

## Lo que vendrá después

Los nueve asuntos que Francisco dejó apuntados el 14-sep-2026 en `docs/PROXIMOS-ASUNTOS.md` están
ya todos hablados y metidos en esta cola: el 1 es la fila 19, el 2 la 17, el 3 la 21, el 4 la 22,
el 5 la 11, el 6 la 14, el 7 la 13, el 8 la 12 y el 9 la 20. Esa lista queda cerrada.

De la fila 21 se quedaron fuera, por falta de datos y no por falta de código: los departamentos del
personal, las tutorías y los equipos educativos. `personal.csv` no guarda nada de eso. Hay que
hablar con Francisco qué se puede sacar de Séneca antes de diseñar nada.

Guardado por si algún día se replantea (17-sep-2026): una base de datos pequeña en internet para
que el aviso de la fila 24 sea instantáneo en vez de tardar lo que tarde Dropbox. Descartada ahora
por la configuración y por depender de la conexión. Si se hace, solo viajarían el identificador
del asunto y el nombre de quien lo abre, nunca el nombre de la carpeta ni dato alguno de alumnado
o personal, y con servidor en la Unión Europea.

Cuando los hitos (fila 15) estén en uso, queda por hablar: si el estado del asunto desaparece y lo
sustituye el hito en curso, y si un hito puede apuntar a su plantilla de correo (fila 14) o a su
plantilla de documento (fila 17). Esto último Francisco ya lo dio por hecho el 16-sep-2026: las
plantillas acabarán colgando también de los tipos de hito.

## Nota sobre "sube directamente a main"

Algunas instrucciones (`docs/HITOS.md` entre ellas) piden subir a `main` sin pull request. Esta
sesión concreta de Claude Code (la de "en la nube", disparada desde GitHub) tiene forzado lo
contrario: trabajar en una rama propia y abrir un pull request, sin permiso para tocar `main`
directamente. Mientras se lance así, las filas de esta cola se suben con pull request. Si se
quiere volver a "directo a main", hay que lanzar la cola desde una sesión de Claude Code normal
(terminal u ordenador), no desde la nube.

**Permiso permanente de Francisco (16-sep-2026): fusionar el pull request lo hace Claude Code
solo**, sin esperar a que Francisco lo haga a mano. Antes de fusionar: la batería de pruebas
(`npm test`) tiene que estar en verde, el PR sin conflictos con `main` (`mergeable_state: clean`)
y sin ningún comentario de revisión pendiente de responder. Fusionado eso, Vercel publica solo:
comprobar lo publicado con `curl` sigue haciendo falta después, no antes.
