# Plantillas fuera de uso (fila 321)

Cerrado con Francisco el 9-oct-2026. Segunda de las tres filas que salen de la idea 320. Va
después de `docs/PANTALLA-DE-PLANTILLAS.md` (fila 320): necesita su pantalla y su módulo
`js/plantillas-uso.js`. No depende de la fila 322.

## Qué pidió

En su aviso, Francisco pedía poder «inhabilitar» una plantilla. Hoy solo se puede borrar.

## Qué quiere Francisco (decidido por él el 9-oct-2026)

1. Una plantilla se puede dejar **«Fuera de uso»**. Vale para las de Word y para las de correo.
2. Fuera de uso: **sigue en la lista, en gris**; **deja de ofrecerse** al generar un documento o
   al preparar un correo; y se puede **volver a activar** con un botón.
3. Los documentos ya generados con ella no se tocan.
4. **Borrar sigue existiendo aparte**, para las que sobran de verdad.
5. Si la plantilla está puesta en algún hito, **avisa antes y deja hacerlo**: «La usan 3 hitos de
   2 tipos de asunto», con la lista. Si se sigue, la tarea se queda en el hito, marcada
   **«plantilla fuera de uso»**, y **no genera nada** hasta que se le ponga otra plantilla o se
   vuelva a activar.

## Qué hay que hacer

### 1. La marca

- Una plantilla fuera de uso lleva `fueraDeUso: { desde: '<fecha ISO>', por: '<usuario>' }`,
  tanto en `lista` como en `documentos` de `plantillas.json`. Sin esa clave, está en uso. Todas
  las de hoy están en uso sin tocar nada.
- Una sola función dice si una plantilla está en uso (por ejemplo `Plantillas.enUso(p)`). Nadie
  mira la clave por su cuenta.
- **Cambiar una plantilla no puede perder la marca.** Hoy los dos cuadros de «Cambiar» vuelven a
  montar la fila entera con sus claves conocidas (`abrirCuadroDePlantillaDoc` en
  `js/plantillas-documento-ajustes.js` y `filaDePlantilla` en `js/plantillas-ajustes.js`), así que
  la perderían. Tienen que conservar `fueraDeUso`.
- «Unir con otro tipo», cambiar el nombre de un tipo y «Cargar las plantillas del centro»
  conservan la marca. «Cargar las plantillas del centro» no duplica una plantilla porque la que
  ya hay esté fuera de uso: se queda como está.

### 2. Dejar fuera de uso y volver a activar

En Herramientas → «Plantillas», dentro del «⋮» de cada línea:

- **«Dejar fuera de uso…»**. Abre un cuadro titulado «Dejar fuera de uso «<nombre>»» con:
  - si la usa algún hito: **«La usan N hitos de M tipos de asunto:»** y la lista, una línea por
    sitio («<tipo de asunto> · Hito 2 · <título del hito>»), sacada de `js/plantillas-uso.js`. Con
    más de ocho, las ocho primeras y «y N más», que despliega el resto. Debajo: «Esas tareas se
    quedan en su hito, marcadas «plantilla fuera de uso», y no generan nada hasta que les pongas
    otra plantilla o vuelvas a activar esta.»
  - si no la usa ninguno: «No la usa ningún hito.»
  - siempre: «Deja de ofrecerse al generar un documento o al preparar un correo. Lo ya hecho con
    ella no cambia. Puedes volver a activarla cuando quieras.»
  - botones **«Dejar fuera de uso»** y **«Cancelar»**.
  Al aceptar, aviso verde con **«Deshacer»**. Su texto: `«<nombre>» queda fuera de uso.`
- **«Volver a activar»**, en lugar de la anterior cuando ya está fuera de uso. No pregunta.
  Aviso verde: `«<nombre>» vuelve a estar en uso.`
- En «Aviso de avance» y «Aviso de cierre», «Dejar fuera de uso…» sale apagado, con el motivo al
  pasar el ratón: «La aplicación la necesita para avisar a quien lo pide.»
- Con «solo consultar», las dos salen apagadas.

### 3. Cómo se ve

- En la pantalla de plantillas: la línea va **en gris**, con la etiqueta **«Fuera de uso desde
  el 09/10/2026»** junto al nombre. Las fuera de uso van al final de la lista, en cualquiera de
  los dos órdenes.
- La pestaña cuenta las dos cosas: «Word (12 · 2 fuera de uso)». Sin ninguna fuera de uso, solo
  el número.
- Junto a la casilla «Sin ningún hito», otra casilla: **«Fuera de uso»**. Marcada, se ven solo
  las fuera de uso.
- En la pantalla de un tipo de asunto: la tarjeta de una plantilla fuera de uso va en gris, con
  la misma etiqueta, y con el botón «Volver a activar».
- La línea del bloque de Herramientas las cuenta: «12 de Word · 30 de correo · 2 fuera de uso».

### 4. Dónde deja de ofrecerse

En **todos** los sitios donde hoy se elige una plantilla. Los conocidos:

- «Generar documento ▾» de la mesa del hito y de la ficha, y su cuadro de elegir
  (`js/plantillas-documento.js`: `plantillasDelAsunto`, `elegirPlantilla`; `js/hitos-generar.js`).
- «Buscar otra plantilla…» (`js/plantilla-buscar.js`).
- El desplegable de plantillas del cuadro de Correo y de Séneca (`js/correo.js`).
- Los avisos a quien lo pide: el desplegable de plantilla del aviso «al terminar» de un hito y
  del aviso «al cerrar» de un tipo (`js/avisos-lo-pide.js` y los editores de la guía y del tipo).
- Los asuntos de grupo: «Generar para todos», «Enviar…» y «Enviar un aviso…»
  (`js/personas-del-grupo.js`, `js/grupo-generar.js`, `js/grupo-enviar-pantalla.js`).
- El desplegable «plantilla» de una tarea de generar o de comunicar, en el editor de la guía
  (`js/guias-guion.js`, `plantillasPara`). Aquí hay una excepción: **la que ya tiene puesta la
  tarea sigue saliendo en su desplegable**, con «(fuera de uso)» detrás del nombre, para que al
  guardar la guía no se pierda. Las demás fuera de uso no salen.
- «Informar al tutor» (`js/informar-al-tutor.js`), si elige plantilla.

La forma recomendada: `Plantillas.deTipo` y `Plantillas.documentosDeTipo` **dejan fuera las que
no están en uso** y admiten una opción para pedirlas todas, que usan solo las listas de Ajustes y
la pantalla de plantillas. `PlantillaBuscar` filtra su catálogo. Busca además en `js/` quién lee
`datos.lista` o `datos.documentos` directamente y decide en cada caso: si es para **ofrecer**,
filtra; si es para **encontrar por su `id`** una plantilla que ya está puesta, no filtra.

El asistente «Convertir en plantilla» sigue contando las fuera de uso para avisar de un nombre
repetido y para ofrecer «Sustituirla».

### 5. La tarea de un hito cuya plantilla está fuera de uso

- **En la mesa del hito**: la tarea lleva, detrás de su texto, la marca ámbar **«plantilla fuera
  de uso»**. Su botón de hacer (generar o comunicar) **no genera ni prepara nada**: al pulsarlo,
  aviso ámbar «La plantilla «<nombre>» está fuera de uso. Vuelve a activarla en Herramientas →
  Plantillas, o pon otra en la tarea.» La tarea se puede seguir marcando como hecha a mano, y
  «Generar documento ▾» sigue ofreciendo las demás plantillas del tipo.
- **«Hacer este hito»** (`js/hacer-este-hito.js`): al llegar a esa tarea **se para**, con el
  mismo aviso ámbar. No la salta en silencio ni da el hito por hecho.
- **Aviso «al terminar» o «al cerrar»** con una plantilla fuera de uso: el cuadro del aviso se
  abre como hoy, pero sin plantilla puesta y con una línea ámbar arriba: «La plantilla de este
  aviso, «<nombre>», está fuera de uso.»
- **En el editor de la guía**: la tarea enseña la misma marca, y su desplegable deja elegir otra
  (punto 4).
- **La lista de comprobación de la pantalla de un tipo** (`js/ajustes-tipo-comprobacion.js`):
  una tarea con plantilla fuera de uso cuenta como si no tuviera plantilla. La línea «Plantilla
  de documento» o «Plantilla de correo» sale pendiente.
- Una plantilla que ya no existe (borrada) se sigue comportando como hoy. Esto es solo para las
  que existen y están fuera de uso.

### 6. La copia de demostración

Con el parámetro `&fueradeuso=1`, la demostración arranca con una plantilla de Word y una de
correo ya fuera de uso, las dos puestas en una tarea de un hito de un asunto abierto que se
pueda abrir. Sin el parámetro, ninguna está fuera de uso.

## Lo que no cambia

- Borrar, y la Papelera.
- Los documentos ya generados y los correos ya enviados.
- Quién puede ver cada asunto, y lo que hace un directivo.
- La pantalla de plantillas de la fila 320, salvo lo que se dice aquí.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-321`, revisor en local y, con su aprobación, a `main`.
- Antes de empezar, comprueba que la fila 320 está en `main` (`js/plantillas-pantalla.js` y
  `js/plantillas-uso.js` existen). Si no, deja esta fila BLOQUEADA con ese motivo.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/PANTALLA-DE-PLANTILLAS.md`, `docs/contexto/DOCUMENTOS-PDF.md`,
  `docs/contexto/HITO-MESA.md` (las tareas con acción) y los ficheros de abajo.
- Ningún fichero pasa de 600 líneas.
- Guardar siempre por `Plantillas.guardar` con función. Tras guardar, `Plantillas.olvidar()` o lo
  que haga falta para que el otro ordenador y los desplegables ya abiertos vean el cambio al
  volver a pintarse.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. «Fuera de uso» es palabra nueva:
  apúntala ahí, frente a «inhabilitada», «desactivada» y «archivada», que no se usan.
- Mientras programas, solo las pruebas de lo tocado
  (`npm test -- plantillas hito correo grupo avisos hacer-este-hito`). La pasada completa, una
  sola vez, al final.

## Ficheros

- `js/plantillas.js`: `enUso`, y el filtro en `deTipo` y `documentosDeTipo` con su opción de
  pedirlas todas. Tiene 435 líneas: cabe.
- `js/plantillas-fuera-de-uso.js`: nuevo. El cuadro de «Dejar fuera de uso…», «Volver a
  activar», «Deshacer» y la marca que pintan los demás.
- `js/plantillas-pantalla.js` (y su fichero de acciones, si existe): las dos entradas del «⋮»,
  el gris, la etiqueta, la casilla, los números de las pestañas y del bloque.
- `js/plantillas-documento-ajustes.js` y `js/plantillas-ajustes.js`: conservar la marca al
  cambiar; la tarjeta en gris con «Volver a activar»; pedir todas.
- `js/plantilla-buscar.js`, `js/plantillas-documento.js`, `js/hitos-generar.js`, `js/correo.js`,
  `js/avisos-lo-pide.js`, `js/personas-del-grupo.js`, `js/grupo-generar.js`,
  `js/grupo-enviar-pantalla.js`, `js/informar-al-tutor.js`: dejar de ofrecer (punto 4), solo
  donde haga falta tras el cambio de `js/plantillas.js`.
- `js/guias-guion.js`: el desplegable de la tarea, con su excepción.
- `js/hito-mesa-recetas.js`, `js/hacer-este-hito.js`: la tarea que no genera y la parada.
- `js/ajustes-tipo-comprobacion.js`: la lista de comprobación.
- `js/plantillas-centro.js`, `js/tipos-nombre.js`: comprobar que no pierden la marca; tocar solo
  si la pierden.
- `css/plantillas-pantalla.css`: el gris y la etiqueta.
- `js/demo/`: el parámetro `fueradeuso=`.
- `pruebas/plantillas-fuera-de-uso.mjs`: nueva, con Chromium real y la demostración. Comprueba:
  1. «Dejar fuera de uso…» en una plantilla que usa un hito: el cuadro dice cuántos hitos y de
     cuántos tipos, y los lista. En una que no usa nadie: «No la usa ningún hito.»
  2. Al aceptar: la línea en gris, al final, con la etiqueta y la fecha; el número de la pestaña;
     `plantillas.json` lleva `fueraDeUso`. «Deshacer» la quita.
  3. «Cambiar» una plantilla fuera de uso y guardar: sigue fuera de uso (Word y correo).
  4. Con una de Word fuera de uso: no sale en «Generar documento ▾» ni en «Buscar otra
     plantilla…» de un asunto de su tipo.
  5. Con una de correo fuera de uso: no sale en el desplegable del cuadro de Correo.
  6. Con `fueradeuso=1`: en la mesa del hito, la tarea lleva «plantilla fuera de uso»; su botón
     da el aviso ámbar y no crea ningún fichero en la carpeta del asunto.
  7. «Hacer este hito» se para en esa tarea con el aviso ámbar, y el hito no queda hecho.
  8. En el editor de la guía: el desplegable de esa tarea la enseña con «(fuera de uso)»; el de
     otra tarea no la ofrece.
  9. «Volver a activar»: la línea deja de estar en gris y la plantilla vuelve a ofrecerse.
  10. «Aviso de avance»: «Dejar fuera de uso…» apagado.
  11. La casilla «Fuera de uso» deja solo las fuera de uso.
  12. Con «solo consultar»: las dos entradas, apagadas.
- Las pruebas de plantillas, del hito y del correo que ya hay siguen en verde.
- `js/novedades.js`: «Una plantilla se puede dejar «Fuera de uso» desde Herramientas →
  «Plantillas»: sigue en la lista, en gris, pero deja de ofrecerse al generar un documento o al
  preparar un correo. Antes avisa de los hitos que la usan. Se vuelve a activar con un botón.»
- Al terminar: `docs/contexto/DOCUMENTOS-PDF.md`, `docs/contexto/HITO-MESA.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/VOCABULARIO.md`, `docs/COPIA-DE-PRUEBAS.md`
  (el parámetro `fueradeuso=`), `docs/HISTORIA.md`. En `docs/CONTEXTO-CORTO.md`, sección 5, tras lo
  añadido por la fila 320: «Una plantilla puede estar fuera de uso (fila 321, `fueraDeUso`,
  `Plantillas.enUso`): no se ofrece, y la tarea de un hito que la lleva no genera.» En la sección
  6, una línea: «Para **ofrecer** plantillas, siempre `Plantillas.deTipo` o
  `Plantillas.documentosDeTipo` (dejan fuera las que no están en uso); `datos.lista` y
  `datos.documentos` a pelo, solo para encontrar una por su `id`. Un cuadro que cambia una
  plantilla conserva las claves que no conoce (fila 321).»

## Qué dirá Claude Code a Francisco al terminar

En tres frases: que en Herramientas → «Plantillas», el «⋮» de cada una tiene «Dejar fuera de
uso…», que avisa de los hitos que la usan; que la plantilla sigue en la lista en gris y deja de
ofrecerse; y que se vuelve a activar desde el mismo sitio.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir `?demo=1&auto=1`, ir a Herramientas → «Plantillas» y, en la pestaña «Word», abrir «⋮» en
   «Certificado de notas» y pulsar «Dejar fuera de uso…». Sale un cuadro que dice cuántos hitos
   la usan y de cuántos tipos de asunto, con la lista debajo, y explica que esas tareas no
   generarán nada. Tiene los botones «Dejar fuera de uso» y «Cancelar».
2. Pulsar «Cancelar»: no cambia nada.
3. Repetir y pulsar «Dejar fuera de uso»: sale un aviso verde con «Deshacer». La línea pasa a
   gris, baja al final de la lista y lleva la etiqueta «Fuera de uso desde el» con la fecha de
   hoy. La pestaña «Word» dice cuántas hay y cuántas están fuera de uso.
4. Pulsar «Deshacer»: la línea deja de estar en gris y la etiqueta desaparece.
5. Dejarla otra vez fuera de uso. Pulsar «Cambiar» en ella, cambiarle el nombre y guardar: sigue
   en gris y con la etiqueta.
6. Abrir «⋮» en una plantilla que no usa ningún hito y pulsar «Dejar fuera de uso…»: el cuadro
   dice «No la usa ningún hito.»
7. Marcar la casilla «Fuera de uso»: solo se ven las que están fuera de uso. Desmarcarla.
8. En la pestaña «Correo», abrir «⋮» en «Aviso de avance»: «Dejar fuera de uso…» está apagado.
9. Dejar fuera de uso otra plantilla de correo. Abrir un asunto de su tipo, abrir el cuadro de
   Correo y mirar el desplegable de plantillas: esa no está.
10. Abrir `?demo=1&auto=1&fueradeuso=1`. Abrir el asunto que tiene la tarea de generar el
    certificado y entrar en ese hito: la tarea lleva la marca «plantilla fuera de uso». Pulsar su
    botón: sale un aviso ámbar que nombra la plantilla y dice dónde volver a activarla, y no se
    abre ningún documento.
11. En ese mismo hito, abrir «Generar documento ▾»: la plantilla fuera de uso no está entre las
    que se ofrecen. Abrir «Buscar otra plantilla…» y escribir su nombre: tampoco sale.
12. Pulsar «Hacer este hito»: se para con el mismo aviso ámbar y el hito no queda marcado como
    hecho.
13. Ir a Ajustes, abrir ese tipo de asunto y su guía, y abrir ese hito: la tarea lleva la misma
    marca, y su desplegable de plantilla enseña la plantilla con «(fuera de uso)».
14. En la pantalla de ese tipo, la tarjeta de esa plantilla está en gris, con la etiqueta y el
    botón «Volver a activar». En la lista de comprobación de arriba, la línea de la plantilla de
    documento sale pendiente.
15. Pulsar «Volver a activar»: la tarjeta deja de estar en gris. Volver al asunto y a su hito: la
    marca ya no está y el botón de la tarea abre el documento.
16. Abrir `?demo=1&auto=1&fueradeuso=1` con «En este ordenador, solo consultar» marcado, e ir a
    Herramientas → «Plantillas»: «Dejar fuera de uso…» y «Volver a activar» no se pueden pulsar.
