# 627 — Asunto y extracto compuestos por la app

Tema 623 de la cola («Asunto de las comunicaciones»), diseñado con Francisco el 12-nov-2026.

## Lo que escribió Francisco

(12-nov-2026, al apuntar la idea) «Uno de los problemas que tenemos con el largo de las rutas es porque dentro de la carpeta de la persona las carpetas que incluyo siguen teniendo el nombre de la persona. Esto es un vestigio de cuando yo usaba esta estructura de carpetas sin la app, ya que usaba el nombre de la carpeta como asunto en las comunicaciones. Creo que ahora mismo podríamos tener un nombre más simple en las carpetas y que los asuntos para las comunicaciones se generen en la app, configurables o personalizables, sin tener que tener ese nombre en la carpeta.»

(12-nov-2026, al diseñarla) «Me parece buena idea tener un asunto general que pueda ser personalizable para las plantillas de correo y de Séneca. Ten en cuenta también que para el registro de documentos en Séneca también usabamos el asunto en el campo Extracto. Igual deberíamos generar este campo en la app de forma configurable y distinto en su caso al asunto.»

«El Extracto podría tener más de una línea escrita?» · «Sí se puede, lo he hecho muchas veces.» (en Séneca)

«Claro, necesitamos un tipo de extracto por tipo de documento que vayamos a registrar. El extracto de una factura de proveedor no puede ser el mismo que el de un certificado de matrícula»

## Lo que entendió Claude (acordado con Francisco el 12-nov-2026)

**Asunto de correos y mensajes de Séneca**

- En Ajustes → El centro hay una tarjeta nueva, «Asunto y extracto», con el **asunto general** del centro: un texto de una línea con campos variables, elegidos con el botón «+ Campo variable» de siempre. Debajo, «Así sale», con un asunto de muestra.
- Cada plantilla de correo y cada plantilla de mensaje de Séneca tiene un campo nuevo, «Asunto», debajo del nombre. Vacío, esa plantilla usa el asunto general; el editor lo dice («Vacío: sale el asunto general del centro») y enseña «Así sale».
- El cuadro «Correo de este asunto», el cuadro «Mensaje de Séneca» y el envío a varias personas abren con el asunto compuesto: el de la plantilla elegida si lo tiene; si no, o sin plantilla, el general. Al cambiar de plantilla, el asunto cambia con ella.
- El campo Asunto se sigue viendo y se puede retocar a mano antes de enviar, como hoy. Lo retocado se envía tal cual.
- **El nombre de la carpeta deja de ser el asunto** de correos y mensajes de Séneca.

**Extracto del registro de Séneca**

- En la misma tarjeta de Ajustes está el **extracto general**: un texto que puede tener **varias líneas**, con campos variables. Además de los campos del asunto, puede llevar los del documento (su tipo, su fecha, su número). «Así sale» lo enseña con sus saltos de línea.
- **Cada tipo de documento puede tener su propio extracto.** En Ajustes → Lo de cada día → «Tipos de documento», el menú ⋮ de cada tipo lleva una opción nueva, «Extracto de este tipo», que abre su texto (varias líneas, «+ Campo variable», «Así sale», Guardar y Cancelar). Vacío, ese tipo usa el extracto general. La tarjeta de cada tipo dice «Extracto propio» o «Extracto general».
- Cada documento del asunto lleva un botón nuevo, **«Extracto»**, al lado de su «Ruta», en los dos sitios donde hoy sale «Ruta»: en «Documentos» del hito y en «Documentos de la carpeta». Copia el extracto de ese documento: el de su tipo de documento, o el general, relleno con los datos del asunto y de ese documento, con sus saltos de línea. Sale un aviso «Extracto copiado».
- El botón sale en todos los documentos, también en los ya registrados.
- El extracto no se personaliza por plantilla.

**El número del asunto**

- El número del asunto (`A26-0137`) va **siempre** en el asunto y en el extracto. Si el modelo no lo lleva, la app lo añade **al final** (al final de la última línea en el extracto), separado por « · ». Si el modelo ya lo lleva, no se repite: quien escribe el modelo puede ponerlo donde quiera. La tarjeta de Ajustes lo dice.
- Francisco eligió «al final en los dos» sabiendo la pega: en un asunto largo el número puede quedar cortado a la vista.
- Con ese número la app reconoce las respuestas a un correo cuando no las reconoce por la conversación, y une los apuntes del registro de Séneca con su asunto.

**Lo demás**

- El botón «Asunto» de la fila de copiar de la ficha copia el asunto general compuesto, no el nombre de la carpeta.
- Los asuntos de antes, sin número de asunto: siguen con el nombre de la carpeta como asunto y como extracto, igual que hoy.
- Los correos ya enviados y los apuntes ya registrados con el nombre de la carpeta se siguen reconociendo como hoy.
- Modelos de partida, hasta que alguien los cambie: asunto «tipo de asunto · nombre del tercero»; extracto, en dos líneas, «tipo de documento · tipo de asunto» y «nombre del tercero · unidad». Ninguno lleva el número escolar ni el documento del tercero.
- No se cambian los correos que ya traen su propio asunto (el informe de una actividad, el informe de asuntos, el mensaje escrito en un hito).

## Pantalla de prueba

- Aprobada el 12-nov-2026: `docs/pantallas/623.html` · https://claude.ai/artifact/4P7552fhQFjWjEyAsmVZrG
- Es ligera: cada cosa está en el sitio donde irá, sin cuidar colores ni letras. Los nombres de campo que salen entre llaves son de muestra; en la app son los de la lista de campos.
- De la pantalla manda: dónde va cada cosa, los textos de ayuda, qué hace cada botón y cómo sale lo compuesto (número al final, sin repetirse, varias líneas en el extracto).

## Qué NO se hace en esta tarea

- Cambiar el nombre de las carpetas de asunto (idea 621).
- Simplificar la ficha y «Nuevo asunto» (tema 602).
- Un asunto distinto por tipo de asunto: no hay ese nivel; las plantillas ya cuelgan de cada tipo.
- Escribir nada en Séneca: el extracto se copia y se pega allí a mano, como hoy.
- Tocar `apps-script/gestor-correos.gs`.

## Notas técnicas de Claude

- Hoy el asunto sale de `asuntoDelCorreo` (`js/correo.js`), que usan `js/correo-cuadro-cuerpo.js`, `js/seneca-cuadro.js` y `js/grupo-enviar-pantalla.js`. Ese es el punto donde componer. `extra.asuntoListo` (informes y mensaje del hito) sigue mandando sobre todo.
- Componer con lo que ya hay: `Plantillas.valoresDeAsunto` y `Plantillas.rellenar`; los campos se eligen con la ventana de «Campo variable» (`js/campos-elegir.js`, `CamposLista.reunir`). El nombre del tercero sin identificador ya existe como campo («Nombre del tercero»). Si falta algún campo del documento (tipo, fecha, número del documento) en la lista, se añade a la lista única.
- Un hueco sin dato sale vacío y no deja separadores sueltos ni líneas vacías (como en la pantalla de prueba).
- Los dos modelos generales y el extracto de cada tipo de documento son ajustes del centro: se guardan en `_GESTOR` junto a lo suyo (tipos de documento, plantillas), por la cola de guardado. Un cuadro que cambia una plantilla conserva las claves que no conoce.
- `asuntoQueYaExiste` (`js/bandeja-huella.js`): además de buscar el nombre de la carpeta dentro del asunto del correo, buscar el número del asunto y encontrar el asunto por ese número. El orden de `asuntoDeEsteCorreo` no cambia.
- `js/control-registro.js` ya une por el número del asunto dentro del extracto; comprobar que lo encuentra cuando el extracto del listado trae varias líneas.
- Fila de copiar de la ficha: `js/ficha-nombre-acciones.js` y donde viva el botón «Asunto». Botón «Ruta» de cada documento: `js/ficha-documentos-fila.js` y la fila del documento en el hito.
- Asunto sin número (carpetas de antes de la fila 239): asunto y extracto son `a.nombre`, como hoy.
- Solo consulta: quien solo consulta no cambia Ajustes; copiar sí puede.
- Línea en `js/novedades.js`. Poner al día `docs/CONTEXTO-CORTO.md` (4 y 5), `docs/contexto/` de correo y documentos, y marcar `docs/ASUNTO-SIN-ELECCION.md` como sustituido por esta fila.

## Cómo lo comprueba el segundo revisor

- Ajustes → El centro tiene la tarjeta «Asunto y extracto» con los dos textos, «+ Campo variable» en cada uno y «Así sale»; el extracto admite varias líneas.
- Con el asunto general sin el número, «Así sale» termina en « · » y el número del asunto; con el campo del número dentro del modelo, no se repite.
- En el editor de una plantilla de correo y de una de Séneca hay un campo «Asunto»; vacío, «Así sale» enseña el general.
- «Correo de este asunto»: sin plantilla sale el asunto general; al elegir una plantilla con asunto propio, cambia a ese; se puede retocar a mano. En ningún caso sale el nombre de la carpeta. Lo mismo en «Mensaje de Séneca» y en el envío a varias personas.
- En «Tipos de documento», el menú ⋮ de un tipo tiene «Extracto de este tipo»; al guardar uno, su tarjeta dice «Extracto propio»; al vaciarlo, «Extracto general».
- En la ficha, cada documento tiene «Extracto» junto a «Ruta», en el hito y en «Documentos de la carpeta». Copia el de su tipo de documento (o el general), con los datos de ese documento, sus líneas y el número del asunto al final.
- El botón «Asunto» de la ficha copia el asunto compuesto.
- Un asunto de antes, sin número, sigue dando el nombre de la carpeta como asunto y como extracto.
- Un correo que llega con un asunto que lleva el número de un asunto abierto se propone para ese asunto (prueba nueva).
- Lo que no pueda ver (pegar en Séneca, respuesta real de Gmail), lo dice.

## Qué mirar al terminar

- En Ajustes → El centro → «Asunto y extracto», cambia el asunto general y mira «Así sale».
- En «Tipos de documento», dale un extracto propio a FACTURA y otro a CERTIFICADO.
- Abre un asunto, pulsa «Extracto» en un documento y pégalo en la casilla Extracto de Séneca: mira que entra con sus líneas.
- Abre «Preparar correo» sin plantilla y con plantilla, y mira el asunto.
- Envía un correo de prueba, contéstalo desde fuera cambiando el principio del asunto pero dejando el número, y mira que la bandeja lo propone para su asunto.
- Abre un asunto de los de antes, sin número, y mira que el asunto del correo sigue siendo el nombre de la carpeta.

## Revisión y respuestas durante el trabajo

- 12-nov-2026, primer revisor: RECHAZADA por un punto: «Enviar un aviso…» a las personas del grupo abría con el asunto vacío. Arreglado (commit 370584e).
- 12-nov-2026, segundo revisor (desde cero): RECHAZADA por un solo punto, menor: en «Correo de este asunto» y «Mensaje de Séneca», al abrir «Cambiar la plantilla», ponerle Asunto y pulsar Guardar, el cuerpo se refresca pero el Asunto del cuadro sigue siendo el general (esperaba el de la plantilla guardada; al reelegir la plantilla sí cambia). Todo lo demás, BIEN. Punto 10 (correo entrante reconocido por el número del asunto): NO COMPROBADO en pantalla (la demo no tiene bandeja real; sí lo cubre `pruebas/asunto-y-extracto.mjs`).
- Detalles menores vistos, no rechazados: «+ Campo variable» pega el campo sin espacio entre campos seguidos (la pantalla 623 añadía uno); el «Así sale» del editor de plantilla usa siempre el mismo asunto de ejemplo.
- Dudas de la sesión (elegido lo más pequeño): botón «Guardar asunto y extracto» en la tarjeta de Ajustes (la pantalla no dibuja ninguno); modelo general vacío = modelos de partida; al cambiar de plantilla el asunto retocado a mano se sustituye; el extracto propio de un tipo de documento borrado o renombrado queda huérfano en `plantillas.json`.
- Qué queda: arreglar solo ese punto (tras guardar en «Cambiar la plantilla», recomponer el asunto con la plantilla guardada) y pasar un revisor nuevo. Todo el trabajo está en la rama `claude/gestor-asuntos-filas-613-618-627-oi05zc`, sin fusionar en `main` ni publicado.
- (las apunta Claude Code)
