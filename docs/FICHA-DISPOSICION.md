# Poner en orden la ficha de un asunto

Fila 49 de `docs/COLA.md`. Acordado con Francisco el 18-sep-2026, mirando una captura de la
ficha de un asunto de MATRICULA.

Es un cambio **de disposición**, no de funcionamiento. Ninguna función cambia de comportamiento:
lo que se mueve es dónde está cada bloque y cuánto sitio ocupa.

## 1. El problema

En la ficha de hoy:

- El bloque **"Datos del asunto"** repite lo que ya está en la cabecera y en "Datos y contacto":
  Tipo, Tercero, Estado y Fecha límite están en las marcas de arriba; el Tercero, otra vez, en
  "Datos y contacto". Ocupa media columna derecha para no decir nada nuevo.
- Por culpa de eso, **las Notas del asunto caen fuera de la pantalla** y es muy probable que no
  se vean nunca.
- Bloques vacíos ("Documentos de la carpeta", "Personas y entidades relacionadas") gastan una
  tarjeta entera para decir que están vacíos.
- Queda medio panel izquierdo en blanco, y en el monitor ancho del trabajo mucho más.

## 2. La regla de colocación

Arriba a la izquierda, **lo que hay que hacer**. Arriba a la derecha, **lo que hay que saber**.
Lo que casi nunca se mira, **plegado en una línea con su número al lado**.

## 3. Cómo queda la ficha

Cabecera (`<header class="ficha-cabecera">`, `js/ficha-asunto.js` líneas 282-296), sin cambiar lo
que ya tiene, y con **una línea gris nueva debajo del nombre**.

Columna izquierda (`.ficha-izquierda`):

1. Hitos.

Columna del centro (`.ficha-centro`, **nueva**):

2. Documentos de la carpeta.

Columna derecha (`.ficha-derecha`):

3. Datos y contacto.
4. **Notas.**
5. `▸ Otros asuntos de este tercero (N)` — plegado.
6. `▸ Personas y entidades relacionadas (N)` — plegado.
7. Datos del trámite — solo si tiene algo que decir.

En pantallas que no dan para tres columnas, el centro se coloca debajo de la izquierda y la
derecha sigue entera al lado (ver la sección 7).

## 4. La cabecera gana una línea

Justo debajo de `<h2 class="ficha-nombre">`, un `<p class="ficha-subtitulo">` con los datos
sueltos que hoy están en "Datos del asunto" y que no se repiten en ningún otro sitio, separados
por ` · `, en gris y en 13px:

`Abierto el 14/09/2026 · ALUMNADO · 26-27 · 1º BACH-h · Francisco Marmolejo González`

Reglas de esa línea:

- El orden es: **Abierto el** (con su fecha en `dd/mm/aaaa`), **Categoría**, **Año académico**,
  **Descripción**, **Lo abrió**.
- Lo que esté vacío no se pinta, y no deja ni el separador ni un hueco.
- Con la cabecera **encogida** (`header.ficha-cabecera.encogida`, mecanismo de la fila 46) esta
  línea **se esconde**: `display: none`. No entra en el reparto con `order` que ya hay en
  `css/ficha-asunto.css` líneas 18-32.

## 5. "Datos del asunto" se desmonta

La función `datosDelAsunto(a, p)` (`js/ficha-asunto.js`, línea ~600) **deja de pintar** las filas
que ya se ven en otro sitio de la misma pantalla:

| Fila de hoy | Dónde se ve ya |
|---|---|
| Abierto el | línea gris nueva de la cabecera |
| Tipo | marca `.marca-tipo` de la cabecera |
| Tercero | bloque "Datos y contacto" |
| Categoría | línea gris nueva |
| Año académico | línea gris nueva |
| Descripción | línea gris nueva |
| Estado | marca `.marca-estado` |
| Fecha límite | marca `.marca-plazo` |
| Lo abrió | línea gris nueva |

Se quedan, y solo esas: **los campos propios del tipo** (`filasDeCampos`), **Vía de
comunicación**, **Lo pide** y **En el archivo**.

El bloque pasa a llamarse **"Datos del trámite"** y va el último de la columna derecha. **Si no
le queda ninguna fila, el bloque no se pinta en absoluto**: ni el título ni la tarjeta.

## 6. Los dos bloques plegados

"Otros asuntos de este tercero" y "Personas y entidades relacionadas" pasan a ser plegables, con
el `<details class="ficha-plegable">` **que ya está escrito en `css/ficha-asunto.css` líneas
157-168 y que hoy no usa nadie**. No hay que inventar CSS nuevo para esto:

```
<details class="ficha-bloque ficha-plegable">
  <summary><h3 class="ficha-titulo">…</h3><span class="ficha-resumen">…</span></summary>
  <div class="ficha-plegable-cuerpo"><div id="ficha-otros"></div></div>
</details>
```

- **Cerrados de partida**, los dos.
- El `.ficha-resumen` del `<summary>` lleva la cuenta en palabras, no un número suelto:
  `1 asunto` / `3 asuntos` / `ninguno todavía`; `2 personas` / `nadie todavía`. Lo escribe el
  módulo que pinta el bloque, en cuanto sabe la cuenta, aunque esté cerrado: **la cuenta se
  calcula igual que hoy, no se retrasa a cuando se abra**. Así el número avisa sin abrir nada.
- El contenido se sigue pintando exactamente como hoy (`OtrosDelTercero.pintarEnFicha`,
  `Relacionados.pintarEnFicha`), dentro del `.ficha-plegable-cuerpo`.
- **Con cuenta cero**, el `<summary>` se queda en gris suave y sin negrita; los botones
  "+ Añadir relacionado" y "+ Añadir varios" siguen donde están hoy, dentro del cuerpo.
- **El estado abierto/cerrado se conserva entre repintados.** La ficha se rehace entera con
  `innerHTML` en cada `pintarLaFicha()`, así que hay que guardarlo antes y reponerlo después,
  con el mismo patrón que `volverADesplegar` de `js/hitos-panel.js` línea 245.
- `aplicarModoConsulta()` (`js/ficha-asunto.js`, línea ~383) apaga todo `button, select, input,
  textarea` de la ficha: un `<summary>` no entra ahí, pero **hay que comprobar que abrir y
  cerrar estos dos bloques sigue funcionando en modo consulta** (es leer, no cambiar nada).

Toda la mecánica de estos plegables (montar el `<details>`, escribir el resumen, guardar y
reponer el estado) va en un módulo nuevo y pequeño, `js/ficha-plegables.js`
(`window.FichaPlegables`), para no engordar más `js/ficha-asunto.js`.

## 7. Aprovechar el ancho

En `css/ficha-asunto.css`, la rejilla `.ficha-columnas` (líneas 62-66) pasa a tener tres tramos:

- **Menos de 1000px**: una sola columna. Orden: izquierda, centro, derecha (el del HTML).
- **De 1000px a 1499px**: dos columnas. `grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr)`.
  `.ficha-izquierda` en la columna 1 fila 1, `.ficha-centro` en la columna 1 fila 2, y
  `.ficha-derecha` en la columna 2 ocupando las dos filas (`grid-row: 1 / span 2`). Es lo mismo
  que se ve hoy, con Documentos debajo de Hitos.
- **1500px o más**: tres columnas,
  `grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(320px, 1fr)`, cada bloque en la
  suya, todas en la fila 1. Así en el monitor ancho del trabajo desaparece el hueco en blanco.

Se mantiene tal cual lo que ya hay en las líneas 121-124: con el visor o el lector abiertos
(`body.con-visor`, `body.con-lector`) la ficha sigue siendo de **una sola columna**, sin tres
tramos ni nada.

## 8. Los bloques vacíos no gastan una tarjeta

Clase nueva `.ficha-bloque.vacio` en `css/ficha-asunto.css`: el título y el aviso de vacío van en
**una sola línea**, con el padding reducido (`10px 18px`), el aviso en gris y en 13px, y sin el
margen de abajo de un bloque normal.

Se le pone a "Documentos de la carpeta" cuando la carpeta no tiene ningún documento
(`js/ficha-documentos.js`, donde hoy escribe "La carpeta todavía está vacía."). El texto se
queda igual; lo que cambia es que ocupe una línea y no una tarjeta.

## 9. Lo que no se toca

- El bloque de **Hitos** entero (`js/hitos-panel.js`, `js/hitos-panel-lista.js`) y su nota con el
  botón de la guía.
- **"Datos y contacto"** (`js/ficha-tercero.js`): se queda donde está, el primero de la columna
  derecha, y sigue montando él mismo su propia `<section class="ficha-bloque">`.
- La **barra de acciones** `#ficha-acciones`, los avisos `#ficha-presencia`, `#ficha-sellos` y
  `#ficha-aviso-tipo`: siguen entre la cabecera y las columnas, en ese orden.
- El **contenido** de las notas (`js/notas.js`): solo cambia el sitio donde se cuelga
  `#ficha-notas`, no lo que pinta ni el autoguardado.
- La ficha del **ARCHIVO** y la vuelta al asunto de origen (`OtrosDelTercero.pintarVuelta`).
- **Nada de la pantalla de lista**, ni de "Qué me toca", ni del tablón.

## 10. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/ficha-asunto.js` | La línea gris de la cabecera; la tercera columna `.ficha-centro`; el orden nuevo de los bloques; `datosDelAsunto` recortada y "Datos del trámite" que no se pinta si está vacío; llamar a `FichaPlegables` |
| `js/ficha-plegables.js` | **Nuevo.** Los dos bloques plegables: montarlos, escribir el resumen, guardar y reponer el abierto/cerrado |
| `js/otros-del-tercero.js` | Pasar la cuenta al resumen del `<summary>` |
| `js/relacionados.js` | Lo mismo, solo en `pintarEnFicha` |
| `js/ficha-documentos.js` | Poner la clase `vacio` al bloque cuando no hay documentos |
| `css/ficha-asunto.css` | Los tres tramos de la rejilla; `.ficha-subtitulo` (y escondida al encoger); `.ficha-bloque.vacio`; el resumen en gris cuando la cuenta es cero |
| `index.html` | El `<script>` de `js/ficha-plegables.js`, **después** de `js/ficha-asunto.js` |
| `pruebas/ficha-disposicion.mjs` | **Nueva** (ver la sección 11) |

`js/ficha-asunto.js` tiene 936 líneas y `js/relacionados.js` 737: los dos pasan de las 400 desde
antes de esta fila. **No se parten aquí**, por el mismo criterio de las filas 45 y 47: partirlos
obligaría a tocar pruebas que los cargan sueltos, y eso es lo contrario de un cambio quirúrgico.
Por eso la mecánica nueva va a `js/ficha-plegables.js` en vez de sumarse a `ficha-asunto.js`.

## 11. La prueba

`pruebas/ficha-disposicion.mjs`, en navegador de verdad, con el disco de mentira de
`pruebas/navegador.mjs` (como `pruebas/cabecera-fija.mjs`). Escenarios:

1. Abierta la ficha de un asunto, el orden de los hijos de `.ficha-derecha` es: Datos y contacto,
   Notas, Otros asuntos, Relacionados (y Datos del trámite si toca).
2. `#ficha-notas` está **por encima** de `#ficha-otros` en el documento.
3. La línea `.ficha-subtitulo` trae la fecha de apertura, la categoría, el año académico y quién
   lo abrió; no trae ni el tipo ni el estado ni la fecha límite.
4. El bloque "Datos del asunto" ya no existe. Con un asunto sin campos propios, sin vía y sin
   "Lo pide", tampoco existe "Datos del trámite".
5. Con un asunto que sí tiene campos propios, "Datos del trámite" sale y **no** trae las filas
   Tipo, Tercero, Estado ni Fecha límite.
6. Los dos bloques plegables arrancan cerrados, su `.ficha-resumen` trae la cuenta correcta con
   el bloque todavía cerrado, y abierto uno de ellos y forzado un repintado de la ficha, sigue
   abierto.
7. Con la carpeta vacía, el bloque de Documentos lleva la clase `vacio`.
8. A 1600px de ancho la rejilla tiene tres columnas; a 1200px, dos, con `.ficha-centro` debajo de
   `.ficha-izquierda`; con `body.con-lector`, una sola.

**Una sola pasada de la batería completa al final**, no una comprobación después de cada cambio.

## 12. Cómo trabajar esta fila

- **Sube directamente a `main`. No abras ninguna pull request** (si la sesión es de las que no
  pueden tocar `main`, vale el pull request y lo fusionas tú al estar en verde).
- **Cambios quirúrgicos.** No reescribas ficheros enteros.
- **No leas el repositorio entero.** Con `docs/CONTEXTO-CORTO.md`, la parte de `docs/CONTEXTO.md`
  que habla de la ficha y los ficheros de la sección 10 basta.
- **Como máximo dos subidas** (regla 13 de la cola).
- Al terminar: `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, y
  la entrada en `docs/HISTORIA.md`.
