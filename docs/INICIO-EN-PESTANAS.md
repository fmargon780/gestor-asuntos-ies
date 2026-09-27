# Inicio, segunda versión: pestañas arriba y una sola tabla (fila 209)

Acordado con Francisco el 27-sep-2026. Diseño cerrado, con boceto aprobado:
**`docs/boceto-inicio-2.html`** (ábrelo en el navegador antes de empezar; se puede pulsar: pestañas,
avisos y «Filtros»). **Manda sobre `docs/INICIO-CUATRO-BLOQUES.md`** (filas 191 y 192) en todo lo que
diga distinto. Valen las cláusulas comunes de `docs/REPARTO-DE-LA-COLA-2026-09-27.md` (a `main` sin
pull request, como mucho tres subidas, nada se sube con `npm test` en rojo).

## Por qué

Francisco vio la pantalla de las filas 191-193 con datos reales y no le sirve:

- «Me toca» salía vacío («Nada pendiente por ahora») aunque había trabajo de Administración: solo
  contaba los hitos **con fecha**. Echa de menos lo que antes daba el montón «Pendiente de
  Administración».
- Las tarjetas de «Ha llegado» y «Esperamos a otros» ocupan mucho; la columna de «Esperamos» es
  estrecha y larguísima.
- La tabla «Todos los asuntos abiertos» queda tan abajo que no sirve de nada.

## Cómo tiene que quedar (ver el boceto)

1. **Cabecera y línea de avisos**: como ahora (fila 193).
2. **Debajo, dos columnas a todo el ancho**:
   - **Izquierda, estrecha (unos 380 px)**: «Ha llegado» arriba y **el tablón** debajo. Es lo primero
     que se mira.
   - **Derecha, el resto**: las pestañas y la tabla.
   - Por debajo de 1000 px de ancho de la zona de trabajo, una sola columna (primero la izquierda).
3. **«Ha llegado», compacto**: cada documento o correo en tres líneas cortas (etiqueta PDF/Correo +
   nombre en una línea cortada con «…»; la línea gris de lo leído; las acciones como **enlaces
   pequeños en una línea**: «Crear asunto», «Guardar en un asunto» / «Guardar en ese asunto»,
   «Leer», «⋮»). Nada de botones grandes ni de huecos vacíos en la tarjeta. «Ver todo» a la derecha
   del título, como ahora (abre la pantalla completa de siempre).
4. **Pestañas encima de la tabla, con su número**:
   - **«En Administración»** (sustituye a «Me toca»): el hito actual de cada asunto abierto cuyo
     responsable es Administración o una de las personas de Administración, **tenga fecha o no**.
     Orden: vencidos, después por fecha, y al final los «Sin plazo». El número rojo si hay vencidos.
   - **«En espera»** (sustituye a «Esperamos a otros»): asuntos cuyo hito actual es de otro
     responsable (Dirección, Secretaría, familia, otra Administración…) o están «Esperando a…».
     Orden: los que llevan más días esperando, arriba. La columna Plazo enseña los días de espera
     (ámbar desde 7, rojo desde 15).
   - **«Todos los abiertos»**.
   - **«Dormidos»** (lo que hoy está plegado al final; «Sin fecha» desaparece como bloque: esos
     hitos ya salen en «En Administración» con «Sin plazo»).
   - Se recuerda la última pestaña elegida (por ordenador).
5. **Una sola tabla para todas las pestañas**, una línea por asunto, con estas columnas:
   **Plazo** (etiqueta de color; en «En espera», los días de espera), **Tercero** (en negrita; en
   un reservado, «🔒 Reservado»), **Tipo**, **Hito actual**, **Le toca a** e **Inicio** (la fecha
   de apertura del asunto, la `AAMMDD` de su carpeta), y el ⋮ con «Copiar el nombre» / «Archivar».
   **Ya no hay columna con el nombre entero de la carpeta**: el tipo ya va en su columna (cambio de
   Francisco sobre la tabla de la fila 192). Pulsar la fila: en «En Administración» abre **la mesa
   del hito**; en las demás, la ficha. Pulsar la cabecera «Inicio» ordena por fecha de inicio (otra
   vez, al revés); y «Ordenar ▾» ofrece: Plazo, Fecha de inicio (más antiguos / más nuevos),
   Tercero y Tipo. Se recuerda el orden elegido.
6. **«Filtros ▾» y «Ordenar ▾» a la derecha de las pestañas**. El filtro **«Responsable»** (el que
   estaba a la vista en «Me toca») pasa **dentro** del panel de Filtros, junto a Situación, Plazo,
   Lo encarga, Tipo de asunto y reservados.
7. **Los avisos de la línea de arriba filtran la tabla**. Pulsar «2 hitos vencidos» deja en la tabla
   solo esos asuntos; «1 aspirante sin Nº…», solo ese asunto; y así cada aviso que tenga asuntos
   detrás. Encima de la tabla sale «Filtrado por: <aviso> ✕ Quitar». Volver a pulsar el aviso, o
   «Quitar», o cambiar de pestaña, lo quita. Los avisos que no son de asuntos (fichero de alumnado,
   papelera…) siguen abriendo lo que abren hoy.
8. **Fuera**: los bloques «Me toca» y «Esperamos a otros» en columnas, el tablón en la cuarta
   columna, la tabla de abajo del todo como sección aparte y los plegados «Dormidos»/«Sin fecha».
9. El buscador de la cabecera sigue filtrando «Ha llegado» y la tabla a la vez.
10. Textos: añadir «En Administración» y «En espera» a `docs/VOCABULARIO.md`, sustituyendo «Me toca» y
    «Esperamos a otros»; poner al día la prueba de palabras prohibidas si hace falta.

## Ficheros que se tocan

- `index.html` (`#pantalla-abiertos`: las dos columnas, la barra de pestañas; fuera los huecos viejos)
- `js/inicio.js` (bloques → pestañas; «En Administración» sin exigir fecha)
- `js/asuntos-lista-pintar.js` (la tabla sirve a las cuatro pestañas; Responsable en el panel de filtros)
- `js/asuntos-lista-montones.js` (si aún guarda la «Situación» que ahora dan las pestañas)
- `js/inicio-plegados.js` («Dormidos» pasa a pestaña; «Sin fecha» fuera)
- `js/avisos-linea.js` (cada aviso de asuntos puede llevar la lista de asuntos que filtra)
- `js/avisos.js`, `js/avisos-que-faltan.js`, `js/recurrentes.js`, `js/unir-asuntos.js` (solo para
  pasar esa lista al registrar su aviso)
- `js/documentos-sueltos.js` y `js/bandeja-pantalla.js` (la fila compacta de «Ha llegado»)
- `js/que-me-toca.js` (solo si hay que exponer o cambiar el cálculo «con fecha»)
- `js/tablon.js` (el tablón en la columna izquierda)
- `css/inicio.css`, `css/tablon.css`
- `docs/VOCABULARIO.md`
- Las pruebas de `pruebas/` que busquen «Me toca», «Esperamos a otros», los bloques o los plegados

No leas el repositorio entero. Cambios quirúrgicos: no reescribas ficheros enteros. Si un fichero
pasa de 600 líneas, pártelo por temas. Nada de envolturas nuevas (engánchate por
`window.Gestor.alRefrescar` o un punto previsto).

## Reglas que no hay que romper

- El tablón no se borra mientras se escribe (`U.conservandoLoEscrito`). No se esconde nunca.
- Se repinta solo lo que cambia; repintados asíncronos con contador de turno.
- La lista vuelve a la misma altura al volver de una ficha.
- Los reservados siguen tapados (candado, sin tercero). Y ya que se toca: el responsable «tercero»
  de un hito tampoco se enseña en «Le toca a» de un asunto reservado (aviso anotado por la fila 192).

## Prueba

Una sola prueba nueva en `pruebas/` (navegador), con asuntos de ejemplo: «Ha llegado» y el tablón a
la izquierda; un hito de Administración **sin fecha** sale en «En Administración» con «Sin plazo»;
un vencido sale el primero; un asunto esperando a Dirección sale en «En espera»; pulsar el aviso de
vencidos deja solo los vencidos y «Quitar» los devuelve; «Responsable» está dentro de «Filtros» y
no a la vista; la tabla tiene la columna «Tercero» y no la del nombre de la carpeta, y ordenar por
«Fecha de inicio» cambia el orden. Y `npm test` entero en verde, una sola vez al final.

## Al terminar

Reglas de siempre de `docs/COLA.md`. En `docs/CONTEXTO-CORTO.md`, sustituir la línea de «Inicio».
Poner al día `docs/contexto/PANTALLA.md` y `docs/contexto/ASUNTOS.md`. Entrada en `docs/HISTORIA.md`.
Publicar y comprobar con `curl`.
