# La cabecera pegada no puede temblar al encogerse

Fila 49 de `docs/COLA.md`. Escrita el 18-sep-2026 con Francisco.
Arregla un defecto de la fila 46 (`docs/CABECERA-QUE-SE-QUEDA.md`), que sigue siendo válida en
todo lo demás.

**Sube el trabajo directamente a `main`. No abras ninguna petición de cambios (pull request).**
Cambios quirúrgicos: no reescribas ficheros enteros. No leas el repositorio entero.

## 1. Qué ve Francisco

Al empezar a bajar en cualquier pantalla, justo antes de que la cabecera se encoja, hay un punto
en el que la cabecera tiembla muy deprisa, como si se encogiera y se estirara muchas veces por
segundo. Si se sigue bajando, se pasa; pero es molesto y pasa siempre en el mismo sitio.

## 2. Por qué pasa

La cabecera está en el flujo normal de la página (`position: sticky`), así que **su alto cuenta
para el alto total del documento**. Al encogerse pierde bastante alto de golpe: se ocultan
`.filtros` y el párrafo `.explica`, el `margin-bottom` baja a 6px y el título pasa de 21px a 17px.

En las pantallas cuyo contenido apenas pasa del alto de la ventana, ese adelgazamiento reduce el
desplazamiento máximo posible. El navegador entonces recorta `window.scrollY` al nuevo máximo, y
ese valor recortado cae por debajo de `DESPLIEGA_A` (40px): la cabecera se vuelve a estirar, la
página vuelve a crecer, el gesto del dedo o la inercia de la rueda empujan otra vez por encima de
`ENCOGE_A` (80px), y vuelta a empezar. Ese bucle es el temblor.

La histéresis de 40/80 que ya hay no lo evita, porque el salto de alto de la cabecera es mayor
que los 40px que separan los dos umbrales.

## 3. Qué hay que hacer

Todo en `js/cabecera-fija.js` (y lo mínimo en `css/cabecera-fija.css`).

### 3.1 Que el alto del documento no cambie al encogerse

Es el arreglo de fondo; los otros dos son cinturón y tirantes.

- La primera vez que se mira una cabecera, con ella desplegada, guarda el alto total del
  documento (`document.documentElement.scrollHeight`).
- Al pasar a encogida, vuelve a medirlo. La diferencia entre los dos altos es lo que hay que
  devolverle a la página.
- Devuélvelo con una variable CSS en `<html>` (por ejemplo `--cabecera-compensa`) que
  `main.contenido` sume a su `padding-bottom` mientras la cabecera esté encogida. Con la cabecera
  desplegada, la variable vale `0px`.
- **Aplica la compensación solo cuando haga falta**: solo si, con la cabecera desplegada, el alto
  del documento es menor que el alto de la ventana más 400px. En las pantallas largas el problema
  no existe y no hay que añadir hueco al final. Francisco no quiere huecos vacíos.
- Vuelve a medir cuando cambie el tamaño de la ventana y cuando se cambie de pantalla: los altos
  guardados son por pantalla, no valen para todas.

### 3.2 Separar más los dos umbrales

`ENCOGE_A` pasa de 80 a 120. `DESPLIEGA_A` pasa de 40 a 24.

### 3.3 Un candado de tiempo

Después de cada cambio de estado (de desplegada a encogida o al revés), no permitas el cambio
contrario durante 400 ms. Un cambio en el mismo sentido no se bloquea. Esto corta cualquier
oscilación que quede por un caso no previsto, sin que se note al usarlo.

### 3.4 Que el encogido no se note como un salto

`css/cabecera-fija.css` ya tiene transición en `padding` y en el tamaño del título. Añádesela
también a `margin-bottom`, con la misma duración (`.15s ease`), para que el cambio de alto sea
suave en vez de seco.

## 4. Lo que no hay que tocar

- El caso especial de "Por clasificar" ("Viendo: …" e "Ir a su fila") se queda exactamente igual.
- `js/documentos-sueltos.js` y `js/visor.js` no se tocan.
- La cabecera sigue siendo `position: sticky` dentro del flujo. No la pases a `position: fixed`:
  perdería el ancho que le da `.contenido`, que es justo lo que se arregló en la fila 46.

## 5. Ficheros que hay que tocar

- `js/cabecera-fija.js` — todo el arreglo.
- `css/cabecera-fija.css` — la variable de compensación en `main.contenido` y la transición de
  `margin-bottom`.
- `pruebas/cabecera-fija.mjs` — añade dos casos: (a) con un documento corto, bajar por encima del
  umbral no deja el estado oscilando (tras encogerse, sigue encogida); (b) con el candado puesto,
  un cambio contrario dentro de los 400 ms no se aplica.
- `js/version.js` — versión nueva, con la hora de `TZ='Europe/Madrid' date`.
- `docs/COLA.md` (fila 49 a HECHA), `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`,
  `docs/HISTORIA.md`.

## 6. Cómo comprobarlo

Una sola comprobación al final: `npm test` en verde y, con `curl`, que la versión publicada en
https://gestor-de-asuntos.vercel.app es la nueva.
