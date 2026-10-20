# Botones de copiar siempre a la vista en la ficha del asunto

Fila 382 de `docs/COLA.md`. Idea 382: aviso del botón de soporte (20-oct-2026, «error» en «Ficha
de un asunto», aviso completo:
https://drive.google.com/file/d/1h4ZM6kobzH4i0pfiI_VpHKEp7bW46MEH/view?usp=drivesdk). Diseñada con
Francisco el 20-oct-2026.

## El problema

En la ficha de un asunto con una lista larga de documentos, al bajar más de 120 px la cabecera se
encoge (`js/cabecera-fija.js`, `ENCOGE_A`). Al encogerse, `css/ficha-asunto.css` esconde
`.ficha-apertura` (la parte derecha de la segunda línea) y, con ella, la fila de copiar
`.ficha-copiar-fila` (botones Asunto, Ruta, NIE, Nombre y DNI/CIF, que pone
`js/ficha-nombre-acciones.js` dentro de `.ficha-apertura`). Esos botones se usan a diario y
desaparecen justo cuando la lista es larga.

## Lo que hay que hacer

1. Con la cabecera encogida, la fila de copiar **se sigue viendo**, en el mismo sitio de siempre:
   la segunda línea (`.ficha-linea2`), a la derecha, después de la barra de acciones `#ficha-acciones` (los
   botones de paso o hito, «Esperando a…», el plazo, «El encargo», «Comunicar»…). En este documento,
   «el renglón de las etiquetas de colores» es esa segunda línea, no `.ficha-marcas` de la primera.
2. Con la cabecera encogida, de `.ficha-apertura` solo se esconde **la línea gris de datos**
   (`.ficha-subtitulo`). Hoy lo esconden dos reglas de `css/ficha-asunto.css`:
   `.ficha-cabecera.encogida .ficha-apertura { display: none; }` y
   `.ficha-cabecera.encogida .ficha-copiar-fila { display: none; }`. Las dos se quitan y se pone
   una que esconda solo `.ficha-subtitulo`. Todo lo demás de la cabecera encogida queda como hoy: la primera línea
   (Volver, tipo, nombre recortado con «…», «⋯», Archivar) y la barra de acciones de la segunda.
3. Se ven los **cinco** botones que haya en la fila de copiar (Asunto, Ruta, NIE —solo si el asunto
   lo tiene—, Nombre, DNI o CIF), con el mismo aspecto y el mismo comportamiento que hoy. Nombre y
   DNI/CIF salen solo cuando llegan los datos del tercero (`FichaTercero.datosBasicos`) y, si no hay
   dato, no salen: eso no cambia. «Ruta» sigue con su aviso verde «Ruta copiada: …»
   (`js/copiar-ruta.js`). No se crean botones nuevos ni se cambia lo que copian.
4. Con la cabecera encogida, la fila de copiar va siempre en **un solo renglón** (sin partirse
   por dentro) y no se encoge. Si la segunda línea no cabe a lo ancho, la fila de copiar baja
   **entera** a un renglón debajo, alineada a la derecha; la barra de acciones no se parte por
   culpa de ella. Nunca se esconde un botón. Nunca desplazamiento lateral. El nombre del
   asunto de la primera línea se sigue recortando con «…» como hoy.
5. Al subir del todo (la cabecera se despliega), todo vuelve a como está hoy, línea gris incluida.
6. Ojo con el cálculo de alto de `js/cabecera-fija.js` (`--cabecera-compensa`, fila 50,
   `docs/CABECERA-NO-TIEMBLA.md`): la cabecera encogida ahora puede ser algo más alta. Comprueba que
   en una pantalla corta (alto 700 px) no tiembla al cruzar el umbral. Como Nombre y DNI aparecen
   después de medir, y pueden hacer que la fila baje de renglón, vuelve a medir cuando la cabecera
   cambie de alto (por ejemplo, con un `ResizeObserver` sobre la cabecera), no solo al cambiar de
   pantalla o de tamaño de ventana.
7. Solo la ficha del asunto (`#pantalla-asunto`). Revisadas el 20-oct-2026 las demás pantallas con
   cabecera que se encoge: allí solo se esconden filtros desplegados y textos de explicación, que
   se hizo a propósito; no se tocan.
8. Pon al día el comentario de `css/ficha-asunto.css` sobre `.ficha-copiar-fila` (hoy dice que se
   esconde con la cabecera encogida) y las pruebas que lo daban por hecho (sobre todo
   `pruebas/cabecera-del-asunto.mjs`, punto 11, que hoy comprueba que se esconde; y
   `pruebas/copiar-fila.mjs`, `pruebas/cabecera-fija.mjs`, `pruebas/cabecera-compacta.mjs` u otras
   que fallen por esto). Añade
   una prueba nueva que baje la lista de una ficha larga y compruebe que los botones de copiar se
   ven y funcionan con la cabecera encogida, esperando a que Nombre y DNI se muestren (a una
   condición, no a una pausa fija), a 1920 y a 1366 px, y con el visor de PDF abierto.
9. Línea en `js/novedades.js` (regla 21 de la cola): «En la ficha de un asunto, los botones de
   copiar (Asunto, Ruta, Nombre, DNI…) ya no se esconden al bajar por la lista.»

## Ejemplo con datos reales

El asunto «261016 A26-0432 ELEC. CONSEJO ESCOLAR Junta Electoral IES Fuente Lucena», tipo
«Elecciones al Consejo Escolar», en el hito 2 de 5 («Recoger candidaturas»). Tiene más de veinte
documentos (D26-00239 a D26-00264 y otros sin registrar) y el visor de PDF abierto al lado. Es el de
la captura del aviso. En la copia de pruebas (`?demo=1`) no existe: usa el asunto de la demo con más
documentos (mira `js/demo/`), y si ninguno llega a llenar la pantalla, añádele documentos en la
prueba nueva. Para el visor, ábrelo pulsando un PDF de la lista («Verlo al lado del programa»).

## Cómo sabré que está bien

1. Abro un asunto con muchos documentos (el A26-0432) y bajo hasta el final de la lista. Arriba
   siguen a la vista: «Volver», el título, «Archivar el asunto», el renglón de las etiquetas de
   colores y, en ese renglón, los botones Asunto, Ruta, Nombre y DNI (y NIE, si el asunto lo tiene).
2. Con la lista bajada, pulso «DNI»: el botón dice «Copiado» y al pegar sale el DNI del tercero.
   Pulso «Ruta»: sale el aviso verde «Ruta copiada» (en la copia de pruebas, si la ruta no está
   apuntada, sale la ventana para apuntarla, como hoy).
3. Al bajar, solo desaparece la línea gris de datos. Al subir del todo, todo vuelve a como estaba.
4. En la pantalla de un portátil (1366 px de ancho) no se esconde ningún botón: si no caben en el
   renglón de las etiquetas, pasan juntos a una línea debajo. El título se corta con «…».
5. Con el visor de PDF abierto al lado, como en la captura del aviso, pasa lo mismo.
