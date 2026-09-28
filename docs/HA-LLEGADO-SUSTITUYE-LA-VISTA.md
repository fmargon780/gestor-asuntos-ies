# Fila 214 — «Ha llegado» sustituye la vista de Inicio, con «← Volver a Inicio»

Diseñada con Francisco el 28-sep-2026. Diseño cerrado.

## El fallo que ve Francisco

En Inicio, la línea «Ha llegado: N correos · N documentos por clasificar» (fila 212,
`js/inicio.js`, `trozoHaLlegado`) llama a `App.irVista('clasificar', soloQue)`. Esa función
(`js/asuntos-lista-montones.js`) solo quita `oculto` a `#zona-clasificar`, que en `index.html`
está **debajo** de `#inicio-cuerpo` (pestañas, filtros y la tabla de asuntos). La lista aparece
abajo del todo, fuera de la vista, y parece que el enlace no hace nada. Pasa lo mismo con el
botón de compatibilidad `.panel[data-vista="clasificar"]` («Ver todo», las dos cosas juntas).

## Lo que tiene que pasar

1. **Al entrar** en «clasificar» (con `soloQue` o sin él), `#zona-clasificar` **sustituye** a la
   vista de Inicio: se esconden `#inicio-cuerpo` (pestañas, filtros, «Filtrado por», tabla) y
   `#inicio-fila-superior` (la línea «Ha llegado» y el cuadro de avisos). La cabecera de Inicio
   (título, «+ Nuevo asunto», buscador) puede quedarse. La lista queda **arriba**, justo bajo la
   cabecera, y la página sube hasta arriba (`scrollTo(0, 0)` o `scrollIntoView` de la zona).
   Hacerlo con una clase en `#pantalla-abiertos` (p. ej. `.viendo-clasificar`) y CSS, sin mover
   el HTML de sitio si no hace falta.
2. **El botón de volver** (`#btn-ha-llegado-volver`, ya existe) pasa a decir **«← Volver a
   Inicio»**, a la izquierda de la cabecera de la zona, siempre visible. Un solo clic.
3. **Al volver**, Inicio queda exactamente como estaba: la misma pestaña, los mismos filtros
   (fila 216), el mismo texto en el buscador y el **mismo punto de desplazamiento** de la página.
   Guardar `window.scrollY` al entrar y devolverlo al salir, después de repintar.
4. El enlace «Ver también los correos / los documentos» (`#sueltos-ver-tambien`) sigue igual y
   no cambia el punto de vuelta: «Volver a Inicio» vuelve siempre al Inicio de antes de entrar.
5. Si mientras se está dentro deja de haber nada que clasificar, se sigue dentro (con el
   «No hay…» que ya corresponda) hasta pulsar «Volver a Inicio». No saltar solo a Inicio.
6. Cambiar de pantalla desde el menú lateral y volver a Inicio deja Inicio normal (sin la zona
   de clasificar a la vista), como ahora.

## Pruebas

- Prueba nueva `pruebas/ha-llegado-sustituye-la-vista.mjs`: con correos y documentos sueltos,
  pulsar cada enlace de «Ha llegado» → `#inicio-cuerpo` no visible, `#zona-clasificar` visible y
  en la parte de arriba de la ventana; cambiar antes de pestaña y bajar la página, pulsar
  «← Volver a Inicio» → misma pestaña, mismo filtro, mismo `scrollY` (con margen de pocos px).
- Lo mismo con `.panel[data-vista="clasificar"]` (las dos juntas).
- `pruebas/tras-cada-accion.mjs` lleva en rojo desde la fila 212 en los pasos «3. al volver, la
  misma altura» y «3. y repintar la lista no la sube arriba» (aviso en `docs/COLA.md`). Mírala
  aquí: es el mismo asunto (volver a Inicio a la misma altura). Si el fallo es este, déjala en
  verde; si es otra cosa, apúntalo en una línea y no la toques.
- Las pruebas que ya pulsan `.panel[data-vista="clasificar"]` o `#btn-ha-llegado-volver` deben
  seguir en verde; si alguna miraba la tabla estando dentro de «clasificar», se ajusta.

## Qué verá Francisco

Pulsa «2 correos» o «1 documento por clasificar» y la tabla de asuntos se sustituye por esa
lista, arriba. Con «← Volver a Inicio» vuelve a Inicio tal como lo dejó.

## Cómo sabemos que está bien

Escrita por la sesión que coge esta fila (28-sep-2026), a partir de este mismo documento: es
anterior a la fila 223 y no la traía.

1. En Inicio, con correos o documentos por clasificar, pulsar «N correos» o «N documentos por
   clasificar»: la lista sustituye a la tabla de asuntos, arriba de la pantalla, sin tener que
   bajar para verla.
2. Con esa lista abierta, pulsar «← Volver a Inicio»: se vuelve a la misma pestaña y los mismos
   filtros que había antes de entrar.
3. Cambiar de pestaña y bajar la página antes de pulsar «N correos» o «N documentos», entrar y
   pulsar «← Volver a Inicio»: se recupera esa misma pestaña y el mismo punto de la pantalla en
   el que se estaba.
4. Dentro de esa lista, clasificar el último correo o documento pendiente: la pantalla se queda
   ahí (con el aviso de que no queda nada), sin saltar sola a Inicio, hasta pulsar «← Volver a
   Inicio».
5. Ir a otra pantalla desde el menú (por ejemplo Archivo) y volver a Inicio: Inicio aparece
   normal, sin la lista de clasificar a la vista.
