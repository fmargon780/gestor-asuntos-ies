# Hitos dentro de un asunto

Encargo acordado con Francisco el 16 de septiembre de 2026. Es la fila 15 de `docs/COLA.md`.
La pantalla que cruza todos los asuntos va aparte, en `docs/QUE-ME-TOCA.md` (fila 16).

## Reglas de esta instrucción

- **Sube directamente a `main`. No abras ninguna pull request.**
- Cambios quirúrgicos. No reescribas ficheros enteros.
- **No leas el repositorio entero.** Solo los ficheros de la lista de abajo.
- **Una sola prueba al final**, con `npm test`, no una comprobación después de cada cambio.
- Si alguno de los ficheros que tocas pasa de unas 400 líneas, pártelo en dos.
- Comprueba lo publicado con `curl`. Nunca des la publicación por hecha.
- Antes de colgar una función nueva de `App`, comprueba que el nombre no está cogido.

## 1. Qué es un hito

Hoy cada tipo de asunto tiene una **guía**: una lista de pasos, con preguntas y opciones, que se
guarda en `_GESTOR/guias.json` y que es igual para todos los asuntos de ese tipo. Dentro de un
asunto abierto, los pasos se marcan con casilla y lo marcado se guarda en `pasosHechos` y
`pasosElegidos`, dentro de `asuntos.json`.

Un **hito** es ese mismo paso, pero vivo dentro de un asunto concreto. Además de estar marcado o
no, lleva estado, fecha límite, responsable, notas, documentos apuntados y plantilla.

Dicho corto: la guía deja de ser texto que se lee y pasa a ser la lista de hitos que se trabaja.

## 2. Dónde se guarda

### 2.1. Fichero nuevo `_GESTOR/hitos.json`

Los hitos **no** van en `asuntos.json`. Van en un fichero nuevo, `_GESTOR/hitos.json`.

Motivo: `asuntos.json` se lee en todas las pantallas y se escribe entero cada vez. Si engorda,
todo va más lento y los conflictos de Dropbox entre los dos ordenadores son más frecuentes y
peores de arreglar. `hitos.json` solo se lee al abrir un asunto y en la pantalla "Qué me toca".

Estructura:

```
{
  "ajustes": {
    "responsables": [ { "id": "director", "nombre": "Dirección", "clase": "centro" } ],
    "noLectivos": [ "2026-12-24", "2026-12-25" ]
  },
  "porAsunto": {
    "<clave del asunto, la misma que en asuntos.json>": {
      "creados": "2026-09-17",
      "hitos": [ ... ]
    }
  }
}
```

Un hito:

```
{
  "id": "h3",
  "titulo": "Firma del director",
  "origenGuia": "<data-id del paso de la guía, o null si lo añadió Francisco a mano>",
  "clase": "paso" | "decision",
  "estado": "pendiente" | "encurso" | "hecho" | "noaplica",
  "desde": "2026-09-17",
  "responsable": "director",
  "fecha": "2026-09-30",
  "plazo": { "dias": 10, "desde": "h2" },
  "notas": [ { "texto": "...", "quien": "...", "cuando": "..." } ],
  "documentos": [ "260917 26ES0123 ACTA.pdf" ],
  "plantilla": null,
  "opciones": [ { "id": "o1", "texto": "...", "hitos": [ ... ] } ],
  "elegida": "o1"
}
```

`opciones` y `elegida` solo existen en los hitos de clase `decision`. `documentos` guarda
**nombres de fichero**, no copias: el documento sigue siendo del asunto y vive en su carpeta de
Dropbox. Un mismo documento puede estar apuntado por varios hitos. **No se crean subcarpetas por
hito, ni se mueve ningún fichero.**

### 2.2. Lo que hay que tocar para que el fichero nuevo funcione

Este repositorio tiene un camino fijo para los ficheros compartidos de `_GESTOR`. Síguelo:

1. **`js/copias.js`**: añade `hitos.json` a la lista de ficheros compartidos. Pasan de once a
   **doce**. Así entra en la copia diaria de `_GESTOR/copias` y en `Copias.comprobarTodos`.
2. Escríbelo **siempre con `Copias.guardar`**, nunca con `Carpetas.guardarJson` directo.
3. **Reléelo justo antes de escribirlo** y fusiónalo con lo del disco, como hace `App.anotar`.
4. **`js/conflictos.js`**: `hitos.json` se **fusiona solo**, como `asuntos.json` y `tablon.json`.
   Se unen los asuntos por su clave, y dentro de cada uno los hitos por su `id`, sin repetir. En
   `ajustes`, se unen las altas de `responsables` y `noLectivos` (los borrados no se fusionan,
   igual que en el resto).
5. Trata el error **`FicheroRoto`** de `Carpetas.leerJson`. "Roto" no es "no existe".

### 2.3. Al archivar: el historial sale del fichero vivo

Cuando se archiva un asunto, sus hitos **salen de `hitos.json`** y se escriben en la carpeta del
asunto, ya dentro del ARCHIVO, como un fichero de texto llamado

    HISTORIAL DE TRAMITACION.txt

Legible sin la aplicación, con un bloque por hito: título, estado final, fechas, responsable,
notas y documentos apuntados. Mismo criterio que la nota de terceros relacionados
(`DONDE ESTA ESTE ASUNTO.txt`): **no se copia ningún documento**.

Si el asunto se reabre y el fichero sigue ahí, se vuelven a cargar los hitos desde él a
`hitos.json` y el fichero se borra. Si no se puede leer, se avisa y el asunto se reabre sin
hitos, sin borrar nada.

Así el fichero vivo solo contiene lo que está abierto y no crece nunca.

## 3. De dónde salen los hitos

### 3.1. Asuntos nuevos

Al crear un asunto, la aplicación copia los pasos de la guía de su tipo y los convierte en hitos.
Si el tipo no tiene guía, el asunto nace sin hitos y con un botón para añadirlos a mano.

Dentro del asunto se pueden **añadir, quitar y reordenar** hitos. Tocar los hitos de un asunto
**nunca** cambia la guía del tipo. Son cosas distintas.

### 3.2. Asuntos que ya existen

**No reciben hitos solos.** Al abrir un asunto que todavía no los tiene, en el sitio de la guía
sale un botón **"Crear los hitos de la guía"**. Al pulsarlo:

- Se crean los hitos desde la guía del tipo.
- Se importa lo que ya estaba marcado: los pasos de `pasosHechos` nacen en estado `hecho`, y las
  opciones de `pasosElegidos` nacen ya elegidas, con su rama abierta.
- `pasosHechos` y `pasosElegidos` se quedan en `asuntos.json` tal cual, sin borrarlos, por si hay
  que volver atrás.

A partir de ese momento, ese asunto se gobierna por sus hitos y ya no por las casillas viejas.

## 4. Las bifurcaciones

La guía admite un paso que es una **pregunta con opciones**, cada una con sus propios pasos. Hay
una sola bifurcación por paso: **las opciones no llevan opciones dentro** (está en la lista de
descartado, no lo cambies).

En hitos eso se convierte en un hito de **clase `decision`**:

- No se completa marcándolo, sino **eligiendo una opción**.
- Mientras no se elige, **la lista de hitos se corta ahí**. No se ve nada de lo que viene después.
- Al elegir, se insertan debajo los hitos de la rama elegida, en orden.
- El hito de decisión se puede **volver a abrir y cambiar la rama**. Entonces los hitos de la rama
  vieja se quitan, avisando antes si alguno tenía notas o documentos apuntados; los que tengan
  algo no se borran, se marcan `noaplica` y quedan al final, plegados.

## 5. Lo que lleva un hito por dentro

| Dato | Qué es |
|---|---|
| Título | Sale del paso de la guía, y se puede cambiar en el asunto |
| Estado | Pendiente · En curso · Hecho · No aplica |
| Fecha límite | A mano, o calculada por el plazo (sección 7) |
| Responsable | Quién lo tiene en su tejado (sección 6) |
| Notas | Igual que las notas del asunto: texto, quién y cuándo |
| Documentos | Nombres de ficheros ya registrados en el asunto, apuntados a este hito |
| Plantilla | Hueco preparado, sin uso todavía (sección 9) |

**En pantalla solo se ve lo que esté relleno.** Un hito simple tiene que ser una línea: casilla,
título y nada más. Lo demás aparece al desplegarlo.

Solo puede haber **un hito en curso** a la vez. Al marcar uno como hecho, el siguiente que esté
pendiente pasa a `encurso` solo, y se le anota `desde` con la fecha de hoy.

## 6. Responsables

Un hito puede estar en el tejado de cualquiera, no solo de Francisco y su compañero.

Hay dos clases de responsable:

1. **Personas del centro**, clase `centro`: una lista configurable en Ajustes. Se crea con estos
   de partida, y Francisco los cambia: `yo`, `companero`, `direccion`, `jefatura`, `secretaria`.
2. **Papeles**, clase `papel`: los resuelve la aplicación en cada asunto, con datos que ya tiene.
   Son fijos, no configurables: `tercero` (el tercero del asunto), `tutor` (el tutor del alumnado
   del asunto, según `RegAlum.csv`) y `relacionado` (uno de los terceros relacionados). Si en un
   asunto no se puede resolver un papel, se enseña el papel tal cual, en gris, y se puede cambiar
   a mano.

Cada paso de la guía puede llevar apuntado su responsable por defecto. En el hito se puede
cambiar sin tocar la guía.

Un hito en curso cuyo responsable **no** sea `yo` ni `companero` cuenta como **esperando a otro**.
Eso es lo que usará la pantalla "Qué me toca" (fila 16).

## 7. Plazos y fechas

Un paso de la guía puede llevar apuntado un plazo: **tantos días desde que se complete otro paso**
(por ejemplo, diez días desde la notificación). Cuando ese paso anterior se marca como hecho, la
aplicación pone sola la fecha límite del hito. Francisco puede cambiarla a mano; si lo hace, deja
de recalcularse.

Los días se cuentan **hábiles**: de lunes a viernes, descontando además los días no lectivos de la
lista de Ajustes. Esa lista se pega una vez por curso.

Pon el cálculo en **`js/plazos.js`**, que es donde ya vive la fecha límite de los asuntos, y
expónlo como una función con nombre propio para que la use también la pantalla de la fila 16.

Ojo con las pruebas: **nada de fechas escritas a mano**. Se cuentan desde hoy.

## 8. El estado del asunto

Cada paso de la guía puede llevar apuntado un **estado del asunto**, elegido de `estados.json`.

- Cuando el hito pasa a `encurso`, el asunto pasa solo a ese estado.
- Si el paso no lleva ninguno, el estado del asunto **no se toca**.
- Francisco siempre puede cambiar el estado a mano, y eso manda: no se le vuelve a pisar hasta que
  otro hito con estado apuntado se ponga en curso.

**Importante para el futuro**: Francisco quiere dejar abierta la puerta a que, más adelante, el
estado del asunto desaparezca y lo sustituya el propio hito en curso. Así que el estado se calcula
en **una sola función**, en `js/hitos.js`, y nadie más lo deduce por su cuenta. Que se pueda
cambiar esa función sin tocar diez sitios.

## 9. Plantillas

El campo `plantilla` se crea y se guarda, pero **no se usa todavía**. Las plantillas de correo y
mensaje son la fila 14 de la cola (`docs/PLANTILLAS-DE-CORREO.md`). Cuando se hagan, un hito podrá
apuntar a la suya. Aquí solo hay que dejar el hueco y no enseñarlo en pantalla.

## 10. Dónde se ve

En la **ficha del asunto**, en el mismo sitio donde hoy se pinta la guía. No hay pantalla nueva en
esta instrucción.

- La lista de hitos sustituye a la lista de pasos.
- Arriba, la cuenta: "3 de 8", contando solo la rama elegida, como ya hace la guía.
- Cada hito: casilla, título y, si tiene, fecha y responsable a la derecha. Al desplegarlo, la
  explicación del paso, las notas, los documentos apuntados y los botones.
- **Aprovecha el ancho.** Francisco trabaja en un monitor ancho y le molestan los renglones
  estrechos con hueco a los lados. El título y el cuerpo del hito terminan en el mismo borde.
- Si el asunto no tiene hitos todavía, el botón "Crear los hitos de la guía" (sección 3.2).
- El botón de escribir la guía del tipo sigue donde está y sigue funcionando igual.

Hazlo **envolviendo** lo que hoy pinta la guía en la ficha, en un módulo nuevo que se cargue
después, como hacen `js/relacionados.js` y `js/papelera.js`. No reescribas `js/ficha-asunto.js`.

## 11. Escribir la guía: tres campos nuevos por paso

En el cuadro de escribir la guía de un tipo (`window.GuiasDelCentro.escribir(tipo)`), cada paso
gana tres campos, todos opcionales y plegados:

- **Responsable por defecto** — desplegable con las personas de Ajustes y los papeles.
- **Estado del asunto** — desplegable de `estados.json`, con "(ninguno)" de partida.
- **Plazo** — número de días y desde qué paso se cuentan.

Recuerda las reglas de ese cuadro: los identificadores viajan en el `data-id`, no por su posición,
y al leerlo se piden solo los hijos directos (`:scope >`).

Una guía que ya existe y no tenga estos campos sigue funcionando: todos vacíos.

## 12. Ajustes: bloque nuevo

Un bloque propio, **sin tocar `js/ajustes.js`**, como hicieron `js/copias.js` y `js/papelera.js`.
Se llama **"Hitos"** y tiene dos cosas:

1. **Responsables**: alta, baja y cambio de nombre de las personas del centro. Los papeles se
   listan pero no se pueden tocar. Pasa las altas por la guardia de duplicados de `U.parecidos`.
2. **Días no lectivos**: una caja donde se pegan fechas, una por línea, en cualquiera de los
   formatos habituales. Se guardan normalizadas.

Los dos se guardan en `ajustes`, dentro de `hitos.json`.

## 13. Ficheros que hay que tocar

Nuevos:

- `js/hitos.js` — el modelo: leer y escribir `hitos.json`, crear desde la guía, bifurcaciones,
  estado del asunto, importar `pasosHechos`/`pasosElegidos`.
- `js/hitos-panel.js` — pintar los hitos en la ficha del asunto, envolviendo lo de la guía.
- `js/hitos-ajustes.js` — el bloque "Hitos" de Ajustes.
- `css/hitos.css`
- `pruebas/hitos.mjs`

Que se tocan:

- `js/copias.js` — `hitos.json` entra en la lista de ficheros compartidos (pasan a doce).
- `js/conflictos.js` — fusión sola de `hitos.json`.
- `js/plazos.js` — el cálculo en días hábiles con días no lectivos.
- `js/guias.js` y `css/guias.css` — los tres campos nuevos por paso.
- `js/relacionados.js` — al archivar ya escribe en la carpeta; ahí va también
  `HISTORIAL DE TRAMITACION.txt`, o desde `js/hitos.js` envolviendo la misma función.
- `index.html` — las líneas de `<script>` y el `<link>` del CSS.
- `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

Orden en `index.html`: `js/hitos.js` después de `js/guias.js` y de `js/plazos.js`;
`js/hitos-panel.js` después de `js/ficha-asunto.js`; `js/hitos-ajustes.js` después de
`js/ajustes.js`. Los tres antes de `js/inicio.js`.

Si `js/hitos.js` se te va de las 400 líneas, pártelo: el modelo por un lado y las bifurcaciones y
el historial de archivo por otro.

## 14. Qué hay que probar

Una sola prueba nueva, `pruebas/hitos.mjs`, en navegador, a 1905 píxeles. Escenarios:

1. Un asunto nuevo de un tipo con guía nace con sus hitos, y el primero está en curso.
2. Un asunto viejo no tiene hitos; el botón los crea e importa lo ya marcado.
3. Marcar un hito como hecho pone el siguiente en curso.
4. La lista se corta en el hito de decisión; al elegir, aparecen los de la rama.
5. Cambiar de rama quita los hitos vacíos de la rama vieja y marca `noaplica` los que tenían algo.
6. Un paso con estado apuntado cambia el estado del asunto al ponerse en curso.
7. Un plazo de diez días hábiles, con un no lectivo por medio, da la fecha correcta (contada desde
   hoy, nunca escrita a mano).
8. Un responsable de clase `papel` se resuelve con el tercero del asunto.
9. Al archivar, los hitos salen de `hitos.json` y aparece `HISTORIAL DE TRAMITACION.txt`.
10. `hitos.json` roto no deja entrar y se puede restaurar desde la copia.

Después, `npm test` entero una vez, y comprobar lo publicado con `curl`.

## 15. Al terminar

- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja, no
  añadiendo una debajo**. En `CONTEXTO.md` entra `hitos.json` en la tabla de `_GESTOR` y cambia la
  cuenta de "los once ficheros" a doce.
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- Marca la fila 15 de `docs/COLA.md` como HECHA, con la versión publicada.
