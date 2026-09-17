# La cabecera se queda arriba, y se encoge

Acordado con Francisco el 17-sep-2026.

Se apuntó tarde, como **fila 45** de `docs/COLA.md` (ya con las filas 39-44 ocupadas por otras
instrucciones apuntadas mientras esta se quedó sin fila; ver la nota "Orden de trabajo" de la
cola). Este documento decía "fila 43", pero ese número ya lo tenía `docs/BUSCADOR-ARCHIVO-INDICE.md`.

**Va después de `FICHA-DEL-ASUNTO-NUEVA.md`** (ya hecha, era la fila 37) **y de
`AJUSTES-POR-TIPO.md`** (fila 40 con la numeración de hoy): las dos recolocan pantallas que aquí
se tocan. Si `AJUSTES-POR-TIPO.md` sigue pendiente, salta esta fila y vuelve cuando esté hecha.

## 1. El problema, con sus palabras

> "Cuando navegamos hacia abajo en una vista, se suele perder la referencia superior.
> Esto es muy evidente cuando estamos trabajando en un asunto vivo."

Al bajar por la ficha de un asunto largo, el nombre del asunto, su estado y el botón de volver
se van por arriba. A partir de ahí se trabaja a ciegas: no se ve en qué asunto se está. Lo mismo
pasa en las listas largas, donde el buscador y los filtros desaparecen.

La solución habitual —fijar la cabecera entera— roba demasiado alto. Por eso la cabecera se fija
**y se encoge**.

## 2. Qué tiene que pasar en pantalla

1. Al entrar en una pantalla, la cabecera se ve entera, como hoy. Nada cambia.
2. En cuanto se baja más de unos 80 píxeles, la cabecera se queda pegada al borde de arriba y se
   reduce a **una sola línea**.
3. Al volver arriba del todo, se despliega otra vez, entera.
4. El cambio es suave, no un salto. Y el contenido de debajo **no da un brinco** cuando la
   cabecera se encoge: reserva su hueco.
5. La cabecera encogida ocupa **todo el ancho de la zona de trabajo**, sin márgenes vacíos a
   izquierda ni a derecha, y termina en el mismo borde que el contenido de debajo.
6. Se ve por encima de lo que pasa por debajo: fondo opaco (el texto de la lista no se debe
   transparentar) y una sombra fina abajo.

Qué queda en esa línea cuando está encogida, pantalla por pantalla:

| Pantalla | Qué se sigue viendo |
|---|---|
| Ficha del asunto (`.ficha-cabecera`) | Botón "← Volver", nombre del asunto (en una línea, con puntos suspensivos si no cabe), tipo, estado y plazo |
| Asuntos abiertos | Título, buscador, botón Filtros y Actualizar |
| Por clasificar (misma pantalla) | Lo anterior, más el nombre del documento que se está viendo (ver el punto 4) |
| Archivo | Título, buscador y Actualizar |
| Personas y empresas | Título, desplegable de categoría y buscador |
| Ajustes | Título y, cuando existan (fila 39), las pestañas y el buscador |
| Papelera | Vive dentro de Ajustes, en su bloque: le vale la cabecera de Ajustes. No hay que inventarle otra |
| Qué me toca | Título, desplegable Responsable y botón Volver |
| Duplicados | Título y sus acciones |

Qué desaparece al encogerse: los párrafos de explicación (`.explica`), los filtros desplegados,
los subtítulos de bloque y el alto sobrante del título (baja de 21px a 17px).

## 3. Cómo se hace: un solo mecanismo, no siete parches

**Fichero nuevo `js/cabecera-fija.js`.** Una pieza suelta, como las demás, que no sabe nada de
ninguna pantalla en concreto:

- Busca, dentro de la pantalla visible (`section.pantalla` sin la clase `oculto`), su cabecera:
  `header.cabecera` o `header.ficha-cabecera`.
- Escucha el desplazamiento de la ventana (`scroll`, con `requestAnimationFrame`, sin trabajo
  pesado dentro).
- Pone o quita la clase `encogida` en esa cabecera según se pase o no del umbral, con histéresis
  (encoge a 80px, se despliega a 40px) para que no parpadee al quedarse justo en el límite.
- Al cambiar de pantalla (`App.ir`, o la clase `oculto` de las secciones) vuelve a mirar cuál es
  la cabecera de turno y limpia la anterior.

**Fichero nuevo `css/cabecera-fija.css`.** Todo el aspecto vive aquí:

- `header.cabecera, header.ficha-cabecera { position: sticky; top: 0; z-index: 20; }` con fondo
  `var(--fondo)` y el mismo relleno lateral que `.contenido`, en negativo
  (`margin: 0 -32px; padding: 0 32px;`) para llegar de borde a borde.
- `.encogida` reduce el alto, encoge el título y esconde lo que dice el punto 2 de arriba.
- `scroll-margin-top` en los bloques a los que se salta, para que la cabecera no tape aquello a
  lo que se acaba de ir.
- En pantalla estrecha (`max-width: 900px`), los márgenes negativos pasan a 16px, que es lo que
  ahí vale `.contenido`.

**Por qué el desplazamiento es el de la ventana**: `.lateral` está fija y `.contenido` va en el
flujo normal, así que quien se desplaza es la página. `position: sticky` basta; no hace falta
ningún contenedor con `overflow`.

## 4. El único caso que pide algo más: Por clasificar

Cuando hay un documento abierto en el panel de la derecha, la cabecera encogida añade, al final
de su línea: `Viendo: <nombre del documento>` y un botón **"Ir a su fila"** que lleva a su tarjeta
en la lista (`scrollIntoView`, con la tarjeta ya marcada como está hoy).

No se duplican ahí los botones del documento: sus acciones ya están dentro del visor, a la
derecha. Esto lo hace `js/cabecera-fija.js` mirando la tarjeta con la clase `tarjeta-abierta`;
no hay que tocar `js/documentos-sueltos.js` ni `js/visor.js`.

## 5. Con qué hay que tener cuidado

- `js/barra.js` (línea 139) ya busca `#pantalla-abiertos .cabecera` para su propio trabajo.
  Comprobar que sigue funcionando igual.
- El tablón de notas y el panel de la derecha (`con-lector`, `con-visor`) cambian el ancho de la
  zona de trabajo: la cabecera pegada tiene que seguir el ancho de verdad, como hace
  `css/vista.css`, no el de la ventana.
- Los cuadros de diálogo (`.capa`, z-index 50) y los mensajes (z-index 60) tienen que seguir por
  encima de la cabecera.
- El repintado de la ficha no puede perder el estado encogido ni lo que se esté escribiendo:
  sigue valiendo `U.conservandoLoEscrito`.
- Antes de colgar nada de `App`, comprobar que el nombre no esté cogido.

## 6. Ficheros que hay que tocar, y nada más

- `js/cabecera-fija.js` — **nuevo**.
- `css/cabecera-fija.css` — **nuevo**.
- `index.html` — el `<link>` con los demás, y el `<script>` justo después de `js/vista.js`.
- `js/ficha-asunto.js` — solo si hace falta un retoque quirúrgico en su cabecera; no reescribirlo.
  Tiene más de 400 líneas: si hubiera que tocarlo de verdad, partirlo antes.
- `css/ficha-asunto.css`, `css/ajustes.css`, `css/que-me-toca.css` — solo los ajustes mínimos que
  no quepan en el fichero nuevo.

No hay que leer el repositorio entero.

## 7. Cómo se cierra

- Cambios quirúrgicos, no reescrituras.
- **Subir directamente a `main`, sin abrir ninguna pull request.** Si la sesión no puede tocar
  `main`, vale la nota del final de `docs/COLA.md`: rama y pull request, y fusionarlo Claude Code
  solo en cuanto esté en verde.
- **Una sola prueba al final**, no una después de cada cambio: `npm test` y, ya publicado,
  comprobar con `curl` que la versión nueva está en https://gestor-de-asuntos.vercel.app
- La hora de `App.VERSION` sale del reloj de verdad (`TZ='Europe/Madrid' date`).
- Al terminar: actualizar `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea
  vieja**, y anotar en `docs/HISTORIA.md` lo que merezca recordarse.
