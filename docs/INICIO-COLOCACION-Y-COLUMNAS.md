# Inicio: colocación de la cabecera y orden de columnas por persona (fila 368)

Aviso del botón de soporte de Francisco (19-oct-2026, 03:38), diseñado con él el 19-oct-2026.
Aviso completo y captura: https://drive.google.com/file/d/16HZgbiZcBoVQz21ZdIDDXXEEnEB689G6/view?usp=drivesdk

Sigue el camino de la fila 353 (`docs/INICIO-MAS-COMPACTO.md`) y de la fila 367
(`docs/INICIO-ORDENAR-POR-COLUMNA.md`). No deshace nada de ellas.

## Lo que pide Francisco, con sus palabras

1. Mejorar la ubicación de los elementos. Los botones Actualizar, Filtros y Exportar podrían subir
   y estar al mismo nivel que los de la izquierda (las pestañas). La tarjeta de avisos, al
   desplegarse, que sea un elemento emergente y no mueva lo de abajo. Lo que comparte renglón,
   alineado en vertical y con tamaños parecidos.
2. Que cada usuario pueda cambiar el orden de las columnas a su gusto.

## Parte 1. Colocación de la cabecera de Inicio

1. **Pestañas y botones en el mismo renglón.** La cuenta «(20)», «Actualizar», «Filtros» y
   «Exportar ▾» van en el mismo renglón que las pestañas (En Administración, En espera, Todos los
   abiertos, Dormidos, Por liquidar), pegados al borde derecho. Hoy salen un poco más abajo.
2. **Misma altura y misma línea.** Todo lo que comparte un renglón de la cabecera de Inicio
   (pestañas, botones, cuenta; y en la fila de arriba «Ha llegado», «+ Nuevo asunto», el tablón
   plegado, el buscador y «N avisos ▸») queda centrado en vertical sobre la misma línea y con la
   misma altura. Nada sobresale por arriba ni por abajo.
3. **El cuadro de avisos flota.** Al desplegar «N avisos ▸», el cuadro se abre por encima de la
   lista, como un desplegable, sin empujar hacia abajo lo que hay debajo. Se cierra al volver a
   pulsar «N avisos», con Esc o al pulsar fuera de él. Si los avisos no caben en la ventana, el
   cuadro tiene su propia barra para bajar; nunca se sale por debajo de la ventana. Se sigue
   recordando plegado o abierto como hoy (fila 353, `gestor.inicio.plegados`): cerrar con Esc o
   pulsando fuera cuenta como plegarlo. Si al arrancar estaba abierto, sale abierto y flotando.
   Pulsar un aviso que filtra la tabla (`InicioTabla.filtrarPorAviso`) cierra el cuadro. Si al
   bajar por la lista la cabecera fija se encoge, el cuadro se cierra. Cuidado con las capas: el
   cuadro queda por encima de la cabecera fija de la tabla.
4. Si la ventana es estrecha y no cabe todo en un renglón, los botones pasan al renglón de abajo,
   alineados a la derecha, como hacen hoy. No se corta ni se monta nada.

## Parte 2. Orden de columnas por persona

1. **Se cambia arrastrando el título.** Cogiendo el título de una columna y soltándolo en otro
   sitio, la columna se mueve ahí. Pulsar el título sin arrastrar sigue ordenando por esa columna,
   como hoy (fila 367). Mientras se arrastra, una marca vertical enseña dónde caerá.
2. **Un solo orden para todas las pestañas.** El orden elegido vale en todas las pestañas de
   Inicio. Ojo: «Por liquidar» tiene otras columnas (`js/por-liquidar.js`, `cabecera()`): casilla ·
   Tercero · Tipo · Por liquidar desde · [Importe]. Allí Tercero y Tipo siguen el orden elegido y
   sus columnas propias van detrás, en su orden de siempre; en esa pestaña no se arrastra nada. La
   casilla de selección y la columna «⋮» no se mueven nunca: quedan fijas en sus extremos.
3. **Se recuerda por persona.** Cada persona (el nombre con el que entra en la app) ve su orden en
   cualquier ordenador. Hoy no existe en `_GESTOR` ningún sitio para preferencias por persona: hay
   que crearlo, con **un fichero por persona** (no uno compartido, para no crear conflictos en
   Dropbox) y el nombre de la persona limpiado antes de usarlo como nombre de fichero. Lo guardado
   se lee antes del primer pintado de la tabla. Los directivos también guardan su orden: se escribe
   por `Perfil.escribir(fn)`, con el mismo patrón que `escribir()` de `js/encargos.js`. En un
   ordenador marcado «solo consultar» (`SoloConsulta`, la copia de Drive de casa), donde no se
   puede escribir en `_GESTOR`, el orden se guarda en ese ordenador (`localStorage`) y se usa ahí;
   nunca sale el aviso ámbar «Solo consulta: no se ha guardado nada» por mover columnas. Si
   guardar falla por otra causa (sin conexión, error), el orden vale hasta recargar, sin avisos.
4. **Volver al orden de siempre.** Dentro del cuadro de «Filtros», un enlace «Restablecer
   columnas». Solo sale si esa persona ha movido alguna columna. Al pulsarlo, vuelve el orden de
   siempre y se borra lo guardado de esa persona.
5. **Lo que no cambia.** «Exportar» (hoja de cálculo e informe en PDF) no se toca: tiene su propio
   catálogo de columnas (`js/exportar-datos.js`) y no debe leer las columnas de la pantalla. El orden de las filas (fila 367) no se toca. Las demás pantallas con
   tablas no cambian.

## Notas técnicas para quien lo programe

- Hoy todo va por posición: las celdas de cada fila se crean en orden fijo en
  `App.filaTablaAsunto` (`js/asuntos-lista-pintar.js`); `InicioOrden.decorar` asigna la columna a
  cada título por su número (`COLUMNAS_NORMAL`); la fila «vacía» usa `colspan`. Hay que identificar
  cada columna por su nombre en títulos y celdas.
- Separar clic y arrastre: cada título lleva hoy `th.onclick` (fila 367). Solo es arrastre si el
  ratón se mueve unos píxeles con el botón pulsado; si no, es clic y ordena.
- Revisar las pruebas de `pruebas/` que localizan celdas con `nth-child`.
- La parte 1.1 es sobre todo de estilos: los tres botones ya están en el mismo contenedor que las
  pestañas (`.inicio-tabla-cabecera`).

## Ejemplo real (de Francisco)

Hoy: Plazo · Tercero · Tipo · Hito actual · Le toca a · Inicio.
Francisco las quiere así: **Inicio · Tipo · Tercero · Plazo · Hito actual · Le toca a**.

## Cómo sabré que está bien

1. En Inicio, «Actualizar», «Filtros» y «Exportar» están en el mismo renglón que las pestañas, a
   la derecha, y todo lo de ese renglón tiene la misma altura y la misma línea (a 1920 y a 1366 px
   de ancho).
2. Al desplegar «N avisos», el cuadro sale flotando encima de la lista: la lista no baja de sitio.
   Se cierra con Esc, al pulsar fuera y al volver a pulsar «N avisos».
3. Arrastrando los títulos se deja el orden Inicio · Tipo · Tercero · Plazo · Hito actual · Le
   toca a. Se mantiene al cambiar de pestaña y al recargar. Pulsar un título (sin arrastrar) sigue
   ordenando las filas.
4. Entrando con otro nombre (`Demo.entrarComo`) se ve el orden de siempre; al volver al primer
   nombre, su orden sigue ahí. Un directivo también puede mover columnas y se le recuerda.
5. En «Filtros» sale «Restablecer columnas» solo tras mover alguna; al pulsarlo vuelve
   el orden de siempre y el enlace desaparece.

[SOLO FRANCISCO] Con sus datos reales, en el ordenador del centro y después en otro, poner el orden
del ejemplo y comprobar que lo ve igual en los dos.

## Pruebas

Una prueba nueva `pruebas/inicio-columnas.mjs` con los puntos 3, 4 y 5, y la comprobación de que
el cuadro de avisos abierto no cambia la posición de la primera fila de la lista (punto 2).
