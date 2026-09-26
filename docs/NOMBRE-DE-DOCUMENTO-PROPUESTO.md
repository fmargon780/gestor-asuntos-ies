# El nombre del documento sale propuesto, y cada hito dice de dónde viene (fila 185)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Cierra el punto 1 de
`docs/PENDIENTES-DE-DISENAR.md` (17-sep-2026). **Va después de la fila 184** (usa las tareas como
único sitio de documentos del hito).

Idea de fondo: el texto adicional del nombre de un documento («matrícula 2º ESO B») se escribe a
mano cada vez, y cada persona lo escribe distinto. Se escribe **una vez** en el sitio que mande, y
el cuadro de «Cambiar el nombre» sale relleno. Para que no haya duplicados, la regla vive sobre
todo en la **biblioteca de hitos**, que ya existe (`docs/BIBLIOTECA-DE-HITOS.md`). Y, condición de
Francisco: **la relación entre un hito de una guía y la biblioteca tiene que verse siempre, sin
pensar.**

## Ficheros que se tocan

- `js/hitos-biblioteca.js` (el campo nuevo del modelo; `modeloAPaso`, `CAMPOS_COMPARABLES`)
- `js/guias-biblioteca.js` (416 líneas: partir antes; puntos 2 y 3: etiqueta, buscador al teclear,
  pregunta al guardar)
- `js/guias-editor.js`, `js/guias-paso-bloques.js` (punto 1: el campo en el paso; punto 2: la
  etiqueta)
- `js/documentos-tipo-nuevo.js` o donde se editen los tipos de documento en Ajustes (punto 1: texto
  por defecto del tipo de documento; se guarda en `tipos-documento.json`)
- `js/documentos-formulario.js`, `js/documentos-guardar.js`, `js/documentos-campos.js` (punto 4:
  el cuadro sale relleno)
- `js/hitos-anadir.js`, `js/hito-mesa-documentos.js` (punto 4: desde qué hito se añade)
- `js/plantillas-valores.js` (los huecos)
- `js/util.js` (`U.parecidos`, ya existe: se usa, no se copia)
- `docs/contexto/HITOS-Y-GUIAS.md`, `docs/contexto/DOCUMENTOS.md`
- Una prueba nueva en `pruebas/`

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Dónde se escribe el texto

Tres sitios, por orden de prioridad:

1. **El hito** (de la biblioteca o propio de una guía): campo nuevo en el editor del paso, **«Texto
   para los documentos de este hito»**, con los huecos de siempre (`{{TERCERO}}`, `{{CURSO}}`,
   `{{GRUPO}}`, `{{TIPO}}`, y los campos del tipo por su nombre) y, al lado, **«Tipo de documento
   que suele salir de aquí»** (desplegable, opcional). En un hito traído de la biblioteca, los dos
   vienen con el modelo (`CAMPOS_COMPARABLES`) y se heredan; en uno propio, se escriben ahí.
2. **El tipo de documento** (Ajustes › Tipos de documento): campo **«Texto por defecto»**, con los
   mismos huecos.
3. Nada: el cuadro sale como hoy.

### 2. Cada hito de una guía dice de dónde viene (siempre a la vista)

En el editor de la guía, al lado del título de cada paso, una etiqueta pequeña que no se puede
plegar: **«De la biblioteca»** (paso con `origenBiblioteca` sin `divergido`), **«De la biblioteca ·
cambiado aquí»** (con `divergido`) o **«Propio de este tipo»** (sin origen). Pulsar la etiqueta de
un hito de la biblioteca enseña el nombre del modelo y «Ver en la biblioteca».

### 3. La biblioteca se ofrece sola, y pregunta claro

- **Al escribir el título de un paso nuevo**, mientras se teclea (desde tres letras), la app busca en
  la biblioteca con `U.parecidos` y, si hay algo, lo dice debajo del campo: «En la biblioteca hay
  “Firma de Secretaría” · **Usarlo**». Pulsar «Usarlo» hace lo mismo que «+ Traer de la biblioteca»
  con ese modelo (sustituye el paso a medio escribir). Si no se pulsa, el paso sigue siendo propio.
- **Al guardar un paso de la biblioteca que ha cambiado**, la pregunta que ya existe se reescribe en
  una sola frase con dos botones: «¿Este cambio es solo para CERTIFICADO, o también para la
  biblioteca? (lo usan 4 tipos más)» → **«Solo aquí»** / **«También en la biblioteca»**. Con «Solo
  aquí», la etiqueta pasa a «cambiado aquí».
- **Un paso propio lleva el botón «Guardar en la biblioteca»** (ya existe) con una línea de ayuda
  debajo: «Para poder usarlo en otros tipos». Al pulsarlo, si hay un modelo parecido por el título,
  avisa: «Ya hay uno parecido: “…”. ¿Crear otro o usar ese?».
- **El texto para los documentos también pasa por la guardia de parecidos**: al escribirlo en un
  hito propio o en un tipo de documento, si otro hito o tipo ya tiene uno igual salvo tildes,
  mayúsculas o espacios, avisa y ofrece copiarlo tal cual.

### 4. El cuadro de «Cambiar el nombre» sale relleno

Al añadir o nombrar un documento **desde un hito** (mesa, «Añadir documento», «Generar» tras
guardar el PDF, «Guardar en el asunto» eligiendo hito): tipo de documento = el del hito si lo tiene
(si no, el que la lectura del PDF propuso; si no, el primero como hoy), y texto adicional = el del
hito con los huecos rellenos (si no, el del tipo de documento; si no, vacío). Los campos del nombre
del tipo de documento (fila 96) siguen entrando como hoy. Desde «Por clasificar» o sin hito: solo el
del tipo de documento. **Siempre se puede cambiar antes de guardar.** Lo que la fila 174 rellena
(fecha y registro leídos) se mantiene y manda sobre esto.

## Lo que no se hace

- No se normalizan las guías ni se tocan los asuntos abiertos.
- No se renombra ningún documento ya existente.
- No se cambia la regla del nombre (`AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL]`).

## Prueba

Prueba sin navegador para la regla (hito manda sobre tipo de documento, huecos rellenos, sin nada
queda vacío) y una de navegador: en el editor de la guía cada paso lleva su etiqueta; escribir
«Firma de Sec» ofrece «Usarlo»; añadir un documento desde el hito 3 abre el cuadro con el texto del
modelo de la biblioteca; desde «Por clasificar», con el texto del tipo de documento. `npm test`
entero al final.

## Al terminar

`docs/contexto/HITOS-Y-GUIAS.md` (el campo del modelo, la etiqueta, el buscador al teclear, la
pregunta), `docs/contexto/DOCUMENTOS.md` (el texto propuesto y su orden), `docs/CONTEXTO.md` (tabla
de `_GESTOR`: `tipos-documento.json` con `textoPorDefecto`), `docs/CONTEXTO-CORTO.md` sección 5.
Quitar el punto 1 de `docs/PENDIENTES-DE-DISENAR.md`. Entrada en `docs/HISTORIA.md`. Sube
directamente a `main`, sin pull request, en como mucho dos subidas.
