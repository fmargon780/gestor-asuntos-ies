# Actividades extraescolares: el aviso al claustro, con su informe en PDF (fila 309)

Cerrado con Francisco el 8-oct-2026. Segunda de cuatro filas; va después de la 306
(`docs/ACTIVIDADES-EXTRAESCOLARES.md`, que se lee antes: de ahí salen el registro de actividades,
`ficha.actividad` y la tarjeta «La actividad»).

## Qué pasa hoy

El profesor que organiza la actividad entrega unos días antes una documentación en papel. El
compañero de Francisco la escanea y la manda por correo a todo el profesorado, para que sepan qué
alumnado no va a estar en clase.

## Qué decidió Francisco

1. **El aviso es un correo corto con un informe en PDF adjunto**, que genera la aplicación: los
   datos de la actividad y el alumnado que va, por unidades. No va toda la información en el texto
   del correo.
2. **El documento escaneado se adjunta o no**, según el caso, con lo que la aplicación ya tiene
   (se guarda en el asunto y se marca en «Documentos de este asunto» del cuadro de Correo). No hay
   que programar nada para eso.
3. **Se manda a todo el profesorado**, con un grupo propio («Grupos de personas», en Ajustes) que
   crearán él o su compañero. Va en copia oculta, como todos los grupos.
4. Mandarlo solo al profesorado que da clase a esas unidades esos días queda para más adelante
   (`docs/PENDIENTES-DE-DISENAR.md`, punto 3). No se hace nada de eso ahora.

Lo decidió la conversación de diseño, y se le dijo: **si el alumnado cambia después de enviar el
aviso, el informe se vuelve a generar y se reenvía.**

## Qué hay que hacer

### 1. El informe en PDF

Módulo nuevo `js/actividades-informe.js` (`window.ActividadesInforme`). Se hace con pdf-lib y el
membrete del centro, como el PDF de liquidación (`js/por-liquidar-liquidar.js`: `pdfDe`,
`asegurarTipoDeDocumento`, `guardarPdf`).

- `ActividadesInforme.datos(a, actividad, personas)` → sin efectos: lo que lleva el PDF. Se
  prueba sola.
- Contenido, en A4 vertical, **aprovechando el ancho**:
  - Membrete. Título: **«Actividad extraescolar»** y, debajo, el nombre completo de la actividad.
  - Datos en dos columnas: Fecha (`Actividades.fechasLegibles`), Salida y Regreso (solo si se
    apuntaron), Lugar, Departamento.
  - **Profesorado**: «Organiza: …» y «Acompaña: …», con el nombre en orden natural (nombre y
    apellidos).
  - **«Alumnado que va: N»**. Después, por cada unidad, en el orden de `Datos.unidadesDistintas`:
    un título **«2.º ESO B · van 12 de 28»** y los nombres («Apellidos, Nombre») en orden
    alfabético, en tres columnas. Una unidad no se parte entre dos páginas si cabe entera en una.
  - Pie en todas las páginas: «Página N de M» y la fecha y hora en que se generó.
- Se guarda en la carpeta del asunto con el nombre de siempre (fila 239):
  `AAMMDD INFORME ACTIVIDAD D26-01234.pdf`, tipo de documento **INFORME ACTIVIDAD** (se crea solo
  si no existe). En la ficha del documento queda `generadoDe: 'informe-actividad'`.
- Los nombres del alumnado salen de las personas del grupo del asunto y su unidad, de `Datos`.
  Quien ya no esté en ninguna unidad va en un bloque final «Sin unidad».

### 2. El botón «Avisar al claustro»

En la tarjeta «La actividad», abierta en grande, junto a «Cambiar». Apagado si la actividad está
anulada, en solo consulta y para un directivo.

Al pulsarlo:

1. Genera el informe y lo guarda (punto 1). Si falla, rojo y no sigue.
2. Abre el cuadro de Correo de siempre (`CorreoNucleo.abrirCuadro(a, false, extra)`), con:
   - el informe recién generado **ya marcado** entre los adjuntos (`extra.adjuntosMarcados`);
   - la plantilla de correo **«Aviso de actividad extraescolar»** ya elegida;
   - el grupo del profesorado **ya añadido a la copia oculta** (punto 3);
   - «Para»: vacío. Si el envío de verdad exige un «Para» (míralo en `apps-script/`), va la
     dirección de quien envía.
3. El resto es el cuadro de Correo de hoy: se puede cambiar el texto, marcar otro documento del
   asunto (el escaneado) y pulsar «Enviar». Queda el PDF `CORREO` de siempre (fila 236).

### 3. El grupo que recibe el aviso

- En Ajustes → El centro, una sección pequeña **«Aviso de actividades extraescolares»** con un
  desplegable **«Grupo que lo recibe»**, con los grupos propios (`Grupos.lista()`). Se guarda al
  cambiar, en `ajustesAvisos.grupoActividades` (el `id` del grupo). Dala de alta en
  `js/ajustes-reparto.js` y en el buscador de Ajustes.
- Si no se ha elegido ninguno, vale el grupo propio que se llame «Profesorado» o «Claustro»
  (comparando con `U.normalizar`).
- Para dejarlo puesto en el cuadro: un `extra.grupoInicial` nuevo (el `id` del grupo), que añade
  ese grupo a la copia oculta **por el mismo camino que el desplegable «Añadir un grupo»**
  (`js/correo-grupos.js`), con su mismo aviso de quién no tiene correo.
- **Si no hay grupo**: el cuadro se abre igual, con una línea ámbar arriba: «No hay ningún grupo
  con el profesorado. Créalo en Ajustes → Grupos de personas.», con un enlace que lleva allí.

### 4. La plantilla de correo

Se crea sola si no existe, como «Aviso de avance» (`js/avisos-lo-pide.js`), colgada del tipo con
la marca de actividades. Nunca pisa una que ya exista con ese nombre.

- Asunto del correo: «Actividad extraescolar: {{ACTIVIDAD}} ({{ACTIVIDAD FECHAS}})».
- Texto: «Buenas:» y, debajo: «Os adjuntamos el informe de la actividad «{{ACTIVIDAD}}», que se
  celebra {{ACTIVIDAD FECHAS}} en {{ACTIVIDAD LUGAR}}. En él está el alumnado que participa, por
  unidades, y el profesorado que lo acompaña.» y la firma de siempre.
- Huecos nuevos, en el catálogo `HUECOS` de `js/plantillas.js`, que valen en plantillas de correo
  y de documento de un asunto con `ficha.actividad`: `{{ACTIVIDAD}}`, `{{ACTIVIDAD FECHAS}}`,
  `{{ACTIVIDAD LUGAR}}`, `{{ACTIVIDAD DEPARTAMENTO}}`, `{{ACTIVIDAD SALIDA}}`,
  `{{ACTIVIDAD REGRESO}}`, `{{ACTIVIDAD ALUMNADO}}` (el número) y `{{ACTIVIDAD PROFESORADO}}`
  (los nombres, separados por comas). Sin actividad, «lo que falta», como cualquier hueco.

### 5. Que se sepa que se avisó, y cuándo hay que volver a avisar

- Al enviarse de verdad el correo abierto desde «Avisar al claustro», se apunta en la ficha del
  asunto, con `App.anotarLista`: `ficha.avisosActividad` += `{ cuando, quien, documento, personas:
  [nombres del alumnado que iba] }`. Engánchalo en el punto que ya avisa del envío hecho
  (el que usa `js/correo-enviado-pdf.js`), no envolviendo.
- La tarjeta «La actividad» dice: **«Aviso enviado el 14-oct-2026»**. Sin aviso: «Sin avisar al
  claustro».
- Si el alumnado de ahora no es el del último aviso, en ámbar: **«La lista ha cambiado desde el
  aviso: 2 personas más, 1 menos.»** y el botón pasa a llamarse **«Volver a avisar»**. Hace lo
  mismo (informe nuevo, con su número nuevo) y el texto del correo empieza por «Este aviso
  sustituye al enviado el 14-oct-2026.».
- La comparación es una función sin efectos: `ActividadesInforme.cambios(personasDeAhora,
  ultimoAviso)` → `{ mas: [...], menos: [...] }`.

## Qué NO se toca

- El cuadro de Correo, salvo `extra.grupoInicial` y la línea ámbar. Ojo: `js/correo-cuadro.js`
  tiene 594 líneas; lo nuevo va en `js/correo-grupos.js` o en el módulo nuevo.
- «Enviar un aviso…» de «Personas del grupo» (es un correo a cada familia; sigue igual).
- La regla de que un grupo va siempre en copia oculta.
- Nada de horarios ni de afinar destinatarios.

## Trampas

- Un informe con 150 personas tiene que caber bien y generarse sin esperas: una sola pasada.
- El informe lleva nombres de menores: se guarda solo en la carpeta del asunto, y nunca se manda
  nada fuera del cuadro de Correo de siempre.
- En la demostración no se envía nada de verdad: el envío es de mentira, como en las demás pruebas
  de correo.

## Antes de empezar

- Basta con `docs/CONTEXTO.md`, `docs/ACTIVIDADES-EXTRAESCOLARES.md`,
  `docs/contexto/CORREO-Y-SENECA.md` (el cuadro de Correo, los grupos y las plantillas),
  `docs/contexto/NOMBRES-FIJOS.md`, `js/actividades.js`, `js/actividades-ficha.js`,
  `js/por-liquidar-liquidar.js`, `js/membrete.js`, `js/correo.js`, `js/correo-grupos.js`,
  `js/hitos-comunicar.js`, `js/avisos-lo-pide.js`, `js/plantillas.js` y `js/ajustes-centro.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas.
- Textos con las palabras de `docs/VOCABULARIO.md`. Añade: **«Avisar al claustro»**, **«Volver a
  avisar»**, **informe de la actividad**.
- La demostración tiene que traer además un grupo propio «Profesorado» con las personas de
  PERSONAL, una de ellas sin correo.
- Rama `fila-309`, revisor en local y, con su APROBADA, a `main`. Cláusulas comunes en
  `docs/REPARTO-DE-LA-COLA-2026-09-27.md`.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs actividades correo
  grupos`); la pasada completa, una sola vez al final.

## Ficheros

- `js/actividades-informe.js`: nuevo. El PDF, el botón, `cambios`, el apunte del aviso.
- `js/actividades-ficha.js`: el botón y las dos líneas de la tarjeta.
- `js/correo.js` y `js/correo-grupos.js`: `extra.grupoInicial` y la línea ámbar.
- `js/plantillas.js` (o `js/plantillas-valores.js`): los huecos `{{ACTIVIDAD…}}`.
- `js/ajustes-centro.js`, `js/ajustes-reparto.js`, `js/ajustes-buscador.js`: la sección de Ajustes.
- `index.html`, `css/actividades.css`, `js/novedades.js`, `js/demo/datos-actividades.js`,
  `docs/VOCABULARIO.md`.
- `pruebas/actividades-aviso.mjs`: nueva. Casos: `datos` con dos unidades y una persona sin
  unidad; el PDF se guarda con su nombre y su tipo de documento; el cuadro se abre con el informe
  marcado, la plantilla elegida y el grupo en copia oculta; sin grupo, la línea ámbar; el grupo
  elegido en Ajustes gana al que se llama «Profesorado»; tras enviar, «Aviso enviado el …»;
  `cambios` con altas y bajas; «Volver a avisar»; anulada y solo consulta, botón apagado.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (en la línea de actividades, sustituyendo),
  `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que la tarjeta «La actividad» tiene el botón «Avisar al claustro»; que genera un
informe en PDF con el alumnado por unidades y abre el correo con el informe adjunto y el grupo del
profesorado puesto; que el grupo se elige en Ajustes → El centro; y que, si la lista cambia
después, la tarjeta lo dice y ofrece «Volver a avisar». Y, en una línea, lo que le toca a él: crear
el grupo «Profesorado» en Ajustes → Grupos de personas.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir la actividad prevista de la demostración y su tarjeta «La actividad» en grande: dice «Sin
   avisar al claustro» y hay un botón «Avisar al claustro».
2. Pulsarlo: se abre el cuadro de Correo. Entre los documentos hay uno llamado `… INFORME
   ACTIVIDAD …pdf`, ya marcado.
3. En ese cuadro, la plantilla elegida es «Aviso de actividad extraescolar» y el texto nombra la
   actividad, su fecha y su lugar, sin ningún hueco sin rellenar.
4. En la copia oculta está el grupo «Profesorado», y el cuadro avisa de la persona que no tiene
   correo.
5. Cerrar el cuadro y abrir el informe desde los documentos del asunto: lleva el membrete, el
   nombre de la actividad, la fecha, el lugar, el profesorado separado en «Organiza» y «Acompaña»,
   y el alumnado bajo el título de cada unidad con «van N de M». Los nombres ocupan tres columnas. Un nombre
   largo («Quintero Maldonado, María Concepción Josefa Remedios») se lee entero, partido en dos líneas,
   sin puntos suspensivos.
6. Volver a pulsar «Avisar al claustro» y enviar: la tarjeta dice «Aviso enviado el …» con la
   fecha de hoy.
7. En «La actividad» → «Cambiar», desmarcar a un alumno y guardar: la tarjeta dice en ámbar «La
   lista ha cambiado desde el aviso: … 1 menos.» y el botón se llama «Volver a avisar».
8. Pulsar «Volver a avisar»: el texto del correo empieza por «Este aviso sustituye al enviado
   el …» y el informe marcado es uno nuevo, sin el alumno desmarcado.
9. Ajustes → El centro: hay una sección «Aviso de actividades extraescolares» con el desplegable
   «Grupo que lo recibe». Buscar «actividades» en el buscador de Ajustes la encuentra.
10. Borrar el grupo «Profesorado» y pulsar «Avisar al claustro»: el cuadro se abre con la línea
    «No hay ningún grupo con el profesorado…» y su enlace lleva a «Grupos de personas».
11. En la actividad anulada de la demostración, el botón está apagado.
12. **[SOLO FRANCISCO]** Con el grupo «Profesorado» de verdad creado, avisar de una actividad real:
    el correo llega a todo el profesorado, en copia oculta, con el informe adjunto.
