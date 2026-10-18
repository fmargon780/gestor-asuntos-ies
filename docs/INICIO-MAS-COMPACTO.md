# Inicio más compacto (fila 353)

Idea 353 de Francisco (aviso del botón de soporte, 16-oct-2026, perfil Administración, copia sin
internet), diseñada con él el 16 y el 18-oct-2026. Aviso completo:
https://drive.google.com/file/d/1R_zF67tcKTP54vciIB3ku6UHAxgbWGOu/view?usp=drivesdk
(la captura está en la misma carpeta: `2026-10-16 084558 mejora.jpg`).

Lo que pidió, con sus palabras: «Aprovechar mejor el espacio de todo lo que está por encima de la
lista de asuntos. Reubicando los distintos elementos y hacer plegables las tarjetas que ocupen
demasiado espacio.» La segunda mejora del mismo aviso (ordenar pulsando la cabecera de una
columna) es la fila 367, `docs/INICIO-ORDENAR-POR-COLUMNA.md`: **no se hace en esta fila**.

Francisco dejó el reparto concreto en manos de Claude; lo de abajo es lo que se acordó con él.

## Qué hay hoy encima de la lista (pantalla `#pantalla-abiertos`, `index.html`)

1. La cabecera (`header.cabecera`): el título `<h2>Inicio</h2>`, «+ Nuevo asunto» (lo cuelga
   `js/barra.js`), el tablón compacto (`#inicio-tablon-hueco`, `js/tablon.js`,
   `js/tablon-compacto.js`) y el buscador `#buscar-abiertos`.
2. La fila `#inicio-fila-superior`: «Ha llegado» (`#inicio-ha-llegado-linea`, `js/inicio.js`) a
   la izquierda y el cuadro de avisos (`#avisos-linea`, `js/avisos-linea.js`) a la derecha.
3. Las pestañas con la cuenta, «Actualizar», «Filtros», «Exportar ▾» y «Ordenar».
4. Lo que solo sale a veces: el panel de filtros abierto, «Filtrado por…», la barra de
   «Por liquidar» y las franjas sueltas (por ejemplo, «La recogida de correos está parada»).

## Lo que cambia

1. **Fuera el título «Inicio».** El `<h2>` de la cabecera de Inicio deja de verse (el menú de la
   izquierda ya lo dice). **No se borra**: `js/barra.js` busca ese `h2` para colocar «+ Nuevo
   asunto» detrás, y `css/cabecera-fija.css` lo encoge al bajar. Se deja en la página, oculto solo
   a la vista (clase de solo lectores de pantalla), y se revisa que la cabecera fija no le reserve
   hueco. Solo en Inicio: el título de las demás pantallas no se toca.
2. **Una fila menos.** «Ha llegado» y el cuadro de avisos suben a la fila de la cabecera, detrás
   del buscador, en este orden de izquierda a derecha: «+ Nuevo asunto» · tablón · buscador ·
   «Ha llegado» · avisos. La fila `#inicio-fila-superior` desaparece de la vista. Si no cabe todo
   en una fila (ventana estrecha), se hace como hoy con el tablón: lo que no cabe baja a una
   segunda línea con `@container`, nunca se monta encima ni provoca desplazamiento lateral.
   Anchos de pantalla a probar: 1920 (monitor ancho del centro), 1366 (Chromebook) y 900.
3. **Al bajar por la lista, «Ha llegado» y el cuadro de avisos se esconden** (decisión de
   Francisco del 18-oct-2026). Se usa el mismo mecanismo que ya esconde los filtros desplegados:
   la clase `encogida` que pone y quita `js/cabecera-fija.js` (reglas en `css/cabecera-fija.css`,
   «Lo que desaparece al encogerse»). Al subir y desplegarse la cabecera, vuelven a salir. El
   tablón y el buscador se quedan como hoy en la cabecera encogida. Ojo con el temblor de la
   fila 50 (`docs/CABECERA-NO-TIEMBLA.md`): lo que se esconde cambia el alto de la cabecera, así
   que tiene que entrar en la medida que ya hace `js/cabecera-fija.js` (`--cabecera-compensa`).
4. **Cuadro de avisos plegable.** Plegado, es una sola línea: «N avisos ▸» (N = número de trozos
   que hoy salen en el cuadro, no de cosas: un trozo «3 vencidos» suma 1; en rojo con la misma
   regla de urgente de hoy, campo `urgente` de `js/avisos-linea.js`, que incluye por ejemplo que
   falte el fichero de alumnado). Al pulsar la línea se abre el cuadro de siempre, con «▾». Al pulsar otra
   vez, se pliega. Sin avisos, no sale nada (como hoy). La ✕ que los calla todos por hoy sigue
   igual, solo dentro del cuadro abierto; si se han callado por hoy, no sale nada, tampoco la
   línea plegada.
5. **Tablón plegable.** Plegado, es una sola línea: «Tablón (N) ▸» seguido del texto recortado de
   la nota más reciente que vea este usuario. Al pulsar la línea se abre el tablón compacto de
   siempre.
   - N cuenta solo las notas pendientes (sin quitar) que ve este usuario. «La más reciente» es la
     de fecha de creación más nueva entre esas. Sin ninguna nota, la línea dice «Tablón (0) ▸» y
     al abrirlo se puede escribir la primera, como hoy.
   - **Regla de apertura**: si hay alguna nota «para el día» de hoy o anterior y sin quitar, el
     tablón sale abierto al entrar en Inicio aunque se hubiera dejado plegado; si no, sale como
     se dejó. Se aplica **solo al arrancar la app y al pulsar «Inicio» en el menú**; no al volver
     de la ficha de un asunto («← Volver») ni en los repintados (`Gestor.alRefrescar`), y no se
     guarda como «abierto»: si se pliega, se queda plegado mientras se siga en Inicio.
   - Esto **cambia una decisión vieja**: la fila 191 y la sección 7 de `docs/CONTEXTO-CORTO.md`
     decían «Esconder el tablón: descartado». Francisco aceptó el 16-oct-2026 que se **pliegue**
     (sigue a la vista como una línea con su número y la nota más reciente; nunca desaparece).
     Actualiza esa línea de la sección 7 y lo que diga `docs/contexto/PANTALLA.md` sobre el
     tablón, para que nadie lo vuelva a rechazar. `pruebas/tablon.mjs` comprueba que no hay botón
     que lo esconda: ajústala a lo nuevo (sigue sin poder desaparecer).
6. **Se recuerda en cada ordenador** si el cuadro de avisos y el tablón se dejaron plegados o
   abiertos: `localStorage` (`gestor.inicio.plegados`), envuelto en try/catch, nunca en
   `_GESTOR`. La primera vez, los dos salen **plegados** (salvo la regla de apertura del tablón).
7. **El perfil directivo no cambia**: hoy no ve tablón, «Ha llegado» ni avisos
   (`body.perfil-directivo`); que siga igual (solo se le quita el título, como a todos). Ojo: hoy
   lo consigue escondiendo la fila `#inicio-fila-superior` (`css/estilos.css`), y la vista
   «clasificar» (`viendo-clasificar`, fila 214, `css/inicio.css`) también esconde esa fila. Al
   mover «Ha llegado» y los avisos, pasa las dos reglas a `#inicio-ha-llegado-linea` y
   `#avisos-linea` (o a su nuevo contenedor), y compruébalo en las pruebas de perfil directivo y
   de «clasificar».
8. **Volver a medir la cabecera al plegar o desplegar.** `js/cabecera-fija.js` guarda el alto de
   cada pantalla (`alturaPorPantalla`) y solo lo recalcula al cambiar de pantalla o de tamaño de
   ventana. Plegar o desplegar el tablón o los avisos cambia ese alto: después de cada pliegue,
   tira la medida guardada de Inicio y vuelve a calcularla, para que `--cabecera-compensa` y los
   títulos fijos de la tabla sigan bien.
9. Nada más cambia: pestañas, «Filtros», «Exportar», «Ordenar» (lo quita la fila 367), la
   cabecera fija al bajar (fila 243) y «Ver todo» (fila 214) siguen funcionando. Comprueba en
   especial que los títulos fijos de la tabla siguen pegados bajo la cabecera con su nueva altura,
   y que «← Volver a Inicio» deja la página en el mismo sitio (fila 256).

## Ejemplo con datos reales

En el centro, con perfil Administración y la copia sin internet: el día del aviso, encima de la
lista había tres filas antes de las pestañas (cabecera, «Ha llegado» + avisos, pestañas). Después
de esta fila tiene que haber dos (cabecera con todo, pestañas). La misma pantalla en la demo
(`?demo=1&auto=1`) sirve para el revisor: tiene notas en el tablón y avisos.

## Cómo sabré que está bien

(Acordado con Francisco; es lo que mira el revisor en la demo y en la web publicada.)

1. Al entrar en Inicio, ya no sale el título «Inicio». En la primera fila están «+ Nuevo asunto»,
   el tablón, el buscador, «Ha llegado» y los avisos. Las pestañas quedan más arriba que hoy.
2. El cuadro de avisos plegado dice «N avisos ▸». Al pulsarlo se abre. Al volver a entrar, sigue
   como lo dejaste.
3. El tablón plegado es una línea con el número de notas y la más reciente. Si hay una nota para
   hoy, sale abierto.
4. Al bajar por la lista, «Ha llegado» y los avisos desaparecen de arriba; al subir del todo,
   vuelven.
5. Al cambiar de pestaña, todo lo de arriba sigue igual y no salta de sitio.

## Al terminar

- Línea en `js/novedades.js`: «Inicio ocupa menos: el título se va, “Ha llegado” y los avisos
  suben a la primera fila, y los avisos y el tablón se pueden plegar.»
- Pon al día `docs/CONTEXTO-CORTO.md` (línea de «Inicio» de la sección 5 y la sección 7) y
  `docs/contexto/PANTALLA.md`, sustituyendo lo viejo.
- Prueba nueva `pruebas/inicio-compacto.mjs`: una fila menos antes de las pestañas (compara la
  posición de `#inicio-pestanas` con la de la cabecera), plegar y desplegar avisos y tablón, que
  se recuerda al recargar, la regla de la nota para hoy y que «Ha llegado» y los avisos no se ven
  con la cabecera encogida.
