# Fila 131 — Plazos bien contados

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, punto 2.2). Diseño cerrado con Francisco el 24-sep-2026.

## El problema

`Plazos.sumarDiasHabiles` (`js/plazos.js`) salta sábados, domingos y los **días no lectivos** de
Ajustes › Hitos. Eso mezcla dos cosas distintas:

- **Días hábiles** (procedimiento administrativo): sin sábados, domingos ni **festivos**. Las
  vacaciones escolares **sí** son hábiles. Un plazo de diez días hábiles que cruza la Navidad hoy
  se alarga de más.
- **Días lectivos** (normativa de convivencia y algunos plazos del centro): sin sábados,
  domingos, festivos ni días no lectivos.

Hacen falta las dos cosas, y también los días naturales.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/HITO-MESA.md` y los ficheros de la lista.
- **Cambios quirúrgicos.** `js/guias.js` (993 líneas) y `js/hitos.js` (587) no se parten en esta
  fila: el selector nuevo va en un fichero propio, y en ellos solo se tocan las líneas del plazo.
- Sube directamente a `main`, sin pull request. Dos subidas como mucho.
- **Una sola tanda de pruebas al final**, con la batería completa en verde.

## Ficheros que se tocan

- `js/plazos.js` — el cálculo
- `js/hitos.js` — `aplicarPlazosDependientes`, la copia del plazo al crear hitos, ajustes
  normalizados (`festivos` junto a `noLectivos`)
- `js/hito-mesa.js` — la cuenta de «quedan N días» (línea ~118) con el mismo modo
- `js/guias.js` — leer y guardar `plazo.cuenta` del paso
- Nuevo `js/guias-plazo.js` — el desplegable «Cómo se cuenta» en el editor del paso
- `js/hitos-ajustes.js` — la caja de festivos
- `js/hitos-archivo.js`, `js/conflictos.js` — normalizar y fusionar `festivos` como ya se hace con
  `noLectivos`
- `js/guias-mapa.js`, `js/guias-biblioteca.js` — el texto del plazo
- `index.html` — una línea de `<script>`
- Prueba nueva: `pruebas/plazos-bien-contados.mjs`
- Documentación: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/contexto/HITOS-Y-GUIAS.md`,
  `docs/contexto/HITO-MESA.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`

---

## 1. Cada plazo dice cómo se cuenta

El plazo de un paso de la guía pasa de `{ dias, desde }` a `{ dias, desde, cuenta }`, con
`cuenta` en uno de estos tres valores:

| Valor | En pantalla | Qué días se saltan |
|---|---|---|
| `habiles` | Días hábiles | sábados, domingos y festivos |
| `lectivos` | Días lectivos | sábados, domingos, festivos y días no lectivos |
| `naturales` | Días naturales | ninguno; pero si el último día cae en sábado, domingo o festivo, pasa al siguiente hábil |

- **Por defecto, `habiles`.** Un plazo sin `cuenta` (todos los que ya existen, en guías y en
  hitos) se lee como `habiles`. No hace falta pasar nada: se completa al leer.
- El hito copia `cuenta` de su paso, igual que ya copia `dias` y `desde`.
- En el editor del paso, junto a los días y al «desde», un desplegable: **Días hábiles / Días
  lectivos / Días naturales**.
- En el mapa y en la biblioteca, el texto dice el modo: «10 días hábiles», «2 días lectivos».

## 2. El cálculo

En `js/plazos.js`, una función que recibe la fecha de partida, los días, el modo, los festivos y
los no lectivos. Se empieza a contar el día siguiente, como hoy. Deja `sumarDiasHabiles` como
envoltorio de compatibilidad si algo más la usa, o cambia sus dos llamadas.

`js/hito-mesa.js` calcula al revés («quedan N días»): tiene que usar el mismo modo del hito.

## 3. Ajustes › Hitos: dos listas

- **Festivos** (caja nueva, encima de la de no lectivos): una fecha por línea, igual que la de no
  lectivos. Se guarda en `_GESTOR/hitos.json`, en `ajustes.festivos`.
- **Días no lectivos**: la de siempre, sin cambios. Lo que ya hay pegado se queda ahí.
- Una línea de ayuda bajo cada caja:
  - Festivos: «Nacionales, de Andalucía y locales. Cuentan para todos los plazos.»
  - No lectivos: «Vacaciones y días sin clase del calendario escolar. Solo cuentan para los plazos
    en días lectivos.»
- Un festivo **no hace falta repetirlo** en no lectivos: los lectivos saltan las dos listas.
- Si la lista de festivos está vacía, en el resumen del título plegado: «Faltan los festivos».
  Ámbar.

## 4. La prueba

`pruebas/plazos-bien-contados.mjs`, sin navegador:

- 10 días hábiles desde el 18-dic-2026, con el 25-dic y el 1-ene y el 6-ene como festivos y del
  23-dic al 7-ene como no lectivos: termina el 5-ene-2027 (las vacaciones cuentan).
- Lo mismo en días lectivos: termina después del 7-ene.
- 15 días naturales que caen en domingo: pasa al lunes; si el lunes es festivo, al martes.
- Un plazo viejo sin `cuenta` se calcula como hábiles.

## 5. Qué va a ver Francisco

- En la guía, cada plazo tiene un desplegable nuevo: días hábiles, lectivos o naturales.
- En Ajustes › Hitos, una caja nueva para los festivos, con un aviso hasta que la rellene.
- Los plazos que ya tenía pasan a contarse en días hábiles. Si alguno era de convivencia (por
  ejemplo, una reclamación contra una corrección), tiene que cambiarlo a días lectivos en su guía.
