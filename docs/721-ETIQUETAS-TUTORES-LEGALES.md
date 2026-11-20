# 721 — Etiquetas para los tutores legales

**Título llano:** Etiquetas para los tutores legales
**Para qué:** que en la herramienta Etiquetas se pueda sacar una etiqueta dirigida a los tutores o representantes legales del alumnado, con sus nombres y la dirección de casa, sin tener que montar un diseño a mano.

Parte del tema 624 (idea 614, aviso de Diego).

## Lo que escribió Diego (aviso de soporte del 11-nov-2026, perfil Administración, copia sin internet, versión 10-nov-2026 · 21:35)
«En la herramienta Etiquetas, añadir en A quien los tutores o representantes legales del alumno o alumna»

Aviso completo, con su captura: https://drive.google.com/file/d/17OkmORav9u1zCxL1upNDdA_kJ-iSgrWC/view?usp=drivesdk

## Lo que entendió Claude (acordado con Francisco el 20-nov-2026)
- En «A quién» hay tres pestañas, en este orden: **Alumnado**, **Tutores legales** y **Personal**.
- En «Tutores legales» se elige al alumnado igual que en «Alumnado»: grupo y filtros, lista pegada y buscador. Es la misma selección: al pasar de una pestaña a otra no se pierde lo elegido.
- La etiqueta va a los tutores de cada alumno: **una por familia**, no una por tutor. Los hermanos que comparten tutor y dirección salen juntos, como en «Sobre».
- La app trae un diseño nuevo, **«Tutores»**, con estos renglones:
  - Los nombres de los tutores (nombre y apellidos, unidos con «y»), en negrita.
  - «Tutores de Ana y Luis Pérez García» (con un solo tutor, «Tutor de …»). Los nombres del alumnado se unen como en «Familia de…».
  - La dirección de casa: calle, código postal y localidad, provincia.
- Salen siempre **los dos tutores** que traiga el RegAlum, tenga o no la custodia (regla del 10-nov-2026, fila 578). La custodia no se usa aquí.
- La dirección es la del alumno, la misma que usa «Sobre».
- Si a un alumno o a una familia no le sale ningún tutor, la etiqueta sale igual con el aviso en ámbar «Sin tutores» en la vista previa, y se cuenta abajo, junto al de «Sin dirección».
- Un diseño propio puede ser «para tutores legales»: en el formulario del diseño, «Para quién vale» ofrece también «Tutores legales». En la pestaña «Tutores legales» salen solo los diseños para tutores; en las otras dos, los de antes.
- Los diseños de siempre (Sobre, Alumno, Profesor) y los propios ya guardados no cambian.
- En la pestaña «Tutores legales» la casilla «Copias por persona» dice «Copias por familia». El orden es el de siempre: unidad y apellidos, con la familia en el sitio de su primer hermano.
- Lo demás de la pantalla (hojas, huecos gastados, vista previa, PDF e imprimir) funciona igual.
- Qué desaparece de la app: nada.

## Pantalla de prueba
- No se pidió: es la pantalla de hoy con una pestaña más.

## Qué NO se hace en esta tarea
- Un sobre distinto para cada tutor, con su propia dirección.
- Elegir tutores por custodia, o poner solo al que la tiene.
- Tratamientos («D.», «Dña.») delante de los nombres.
- Cambiar «A quién» en el reparto entre terceros ni en ninguna otra pantalla.

## Notas técnicas de Claude
- La pestaña «Tutores legales» comparte con «Alumnado» la selección (`E.pest.alumnado`, el filtro y el buscador de `js/etiquetas-pantalla-calculo.js`); lo que cambia es el modo con el que se construyen las etiquetas y qué diseños valen. Cuidar el trabajo recordado (`guardarTrabajo`/`restaurar`, fila 450): que guarde y recupere también cuál de las tres pestañas estaba abierta.
- Diseños: `para` admite `'tutores'` en `EtiquetasDisenos.limpiar` y en `js/etiquetas-editor.js` (línea del desplegable «Para quién vale»); un diseño para tutores es siempre «Una por familia». `vale(d)` en `js/etiquetas-pantalla-calculo.js`. Añadir el integrado `tutores` en `integrados()`. Nuevos datos en `EtiquetasDatos.CAMPOS`, solo para `'tutores'`: los nombres de los tutores y «Tutores de …».
- Valores: función nueva (por ejemplo `EtiquetasDatos.valoresDeTutores(grupo, ctx)`) que une los tutores de todo el grupo con `Datos.tutoresDe`, sin repetir (clave: documento compactado y, si no hay, nombre normalizado, como en `PersonasFamilias.indice`), en el orden de las personas del grupo. El texto «Tutores de …» sale de `textoFamilia`. `sinTutores` se calcula como `_sinDireccion` y se pinta y cuenta igual en `EtiquetasHoja.vistaHtml` y en el pie de `js/etiquetas-pantalla-vista.js`.
- `EtiquetasHoja.construir` ya agrupa por familia (`EtiquetasDatos.familias`): reutilizarlo; el modo «tutores» fuerza esa agrupación.
- Código nuevo en un fichero nuevo `js/etiquetas-tutores.js` (por debajo de 400 líneas), apuntado en `js/cargar-piezas-3.js` junto a los demás `js/etiquetas-*.js`. `js/etiquetas-pantalla-vista.js` (327 líneas) no debe pasar de 400: lo que no quepa va al fichero nuevo.
- Demostración (`js/demo/datos-ficheros.js`): hoy solo los dos hermanos Aguilar traen tutor. Añadir lo mínimo para probar: una familia con dos tutores de nombres distintos y un alumno sin ningún tutor, y apuntar los casos nuevos en `docs/CASOS-DE-PRUEBA.md`. Sin cambiar el resto del juego pequeño.
- Prueba: ampliar `pruebas/etiquetas.mjs`: pestaña «Tutores legales» con el diseño «Tutores»; hermanos Aguilar en una sola etiqueta con su tutor una sola vez; familia con dos tutores con los dos nombres; alumno sin tutores con el aviso «Sin tutores»; un diseño propio «para tutores» no sale en «Alumnado»; el trabajo recordado devuelve la pestaña abierta.
- Actualizar `docs/ETIQUETAS.md` (apartados 2, 4 y 5) y la línea de Etiquetas de `docs/contexto/` que corresponda, sustituyendo lo viejo.
- Línea en `js/novedades.js`: sí, cambia lo que se ve.
- Textos con las palabras de `docs/VOCABULARIO.md`.

## Cómo lo comprueba el segundo revisor
- Etiquetas tiene tres pestañas, en este orden: Alumnado, Tutores legales, Personal.
- En «Tutores legales» la selección del alumnado funciona igual que en «Alumnado», y pasar de una a otra no pierde lo elegido.
- Con el diseño «Tutores», una familia con dos tutores sale en una etiqueta con los dos nombres, «Tutores de …» y la dirección de casa.
- Los dos hermanos que comparten tutor salen en una sola etiqueta, con el tutor una sola vez y «Tutores de» con los dos nombres.
- Un alumno sin tutores sale con el aviso ámbar «Sin tutores», y el pie lo cuenta.
- En «Tutores legales» la casilla dice «Copias por familia» y repite cada etiqueta seguida.
- Un diseño propio marcado «Tutores legales» sale solo en esa pestaña; «Sobre», «Alumno» y «Profesor» siguen como antes en las suyas.
- Dejar la pantalla y volver recuerda la pestaña abierta y lo elegido.
- Guardar PDF da las hojas que dice el pie.
- Alumnado y Personal funcionan como antes (`npm test -- etiquetas` sin cambios en lo viejo).

## Qué mirar al terminar
- Lo mira Claude en la demostración: Herramientas → Etiquetas → «Tutores legales», elegir un grupo y ver las etiquetas con el diseño «Tutores».
- Tú, cuando tengas los datos reales: sacar una hoja con un grupo y mirar que los nombres de los tutores y la dirección son los que esperas.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- 20-nov-2026, segundo revisor (agente nuevo, servidor local, demostración): APROBADA. Coincide: las tres pestañas en orden; selección compartida; etiqueta con dos tutores, «Tutores de…» y dirección; hermanos Aguilar en una etiqueta con los tutores una vez; «Sin tutores» ámbar y cuenta en el pie; «Copias por familia» con copias seguidas; diseño propio para tutores solo en su pestaña; recuerda pestaña y selección; PDF con las hojas del pie; Alumnado y Personal como antes; consola sin errores. «Archivar» no existe como botón: el asunto de prueba se cerró con «Liquidar y cerrar». Hace sin pedirlo: nada.
- Aviso: el vocabulario dice «familia» y no «tutores» para los tutores legales como grupo; aquí se han usado los textos que pedía la instrucción («Tutores legales», «Tutores de…», «Sin tutores»).
- Dos tutores se cuentan una sola vez por documento o, si no hay, por nombre; en una familia de más de dos tutores salen «A, B y C».
