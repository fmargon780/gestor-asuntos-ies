# Estimaciones de la cola

La pone al día la sesión que trabaja `docs/COLA.md`, cada vez que marca una fila EN CURSO (ver
`CLAUDE.md`), y la conversación de diseño al dejar una fila PENDIENTE. Minutos por fila entera:
programar, pruebas, publicar y comprobar. La página «Estado de la cola» de Francisco lee esta
tabla desde `main`.

Última puesta al día: 07-oct-2026 (filas 293 a 296 PENDIENTE, desde la conversación de diseño; 288 EN CURSO)

Desde la fila 223, cada fila de código (no solo documentación) pasa antes por el revisor: los
minutos de abajo cuentan la fila entera, revisor incluido (uno o dos intentos).

| Nº | Minutos | Motivo |
|---|---|---|
| 288 | 270 | Dos ficheros nuevos (el reparto de unas cuarenta secciones en cuatro pestañas con una sola tabla, y el buscador con sus otras palabras), ocho secciones mudadas a Herramientas, tres cambios de nombre, el salto común a una sección, unas treinta pruebas que entran en Ajustes por su pestaña, una prueba nueva y el revisor con 17 puntos |
| 289 | 270 | Un fichero nuevo con fusión por `id` y cuatro módulos nuevos: «Nuevo encargo», «Mis encargos», la llegada a «Ver todo» como tercera clase y sus tres botones; el paso a «Nuevo asunto» con lo ya sabido, los documentos por el cuadro de nombre, el estado del encargo al archivar, reabrir, borrar y cambiar el asunto, cinco encargos en la demostración, una prueba nueva con doce casos y el revisor con 14 puntos |
| 290 | 150 | Un módulo nuevo: la caja de nota del directivo como único control encendido en consulta, los documentos en espera, el aviso de Inicio y su filtro, «Vista» y «Guardar en el asunto» reutilizando el paso de la fila 289, las dos preguntas previas, dos asuntos en la demostración, una prueba nueva con once casos y el revisor con 14 puntos |
| 291 | 210 | Un módulo nuevo de tarjetas y doce módulos de aviso que le pasan su descripción en vez de pintar su sección, los textos de once problemas, la cuenta en la pestaña, en Inicio y en el menú sin lecturas caras, cuatro problemas en la demostración, una prueba nueva y el revisor con 13 puntos |
| 292 | 180 | Tres módulos nuevos (el parecido entre nombres, el cuadro que devuelve los hitos a su asunto con «Deshacer», la diferencia entre dos versiones), el cuadro de «Buscar su carpeta», dos avisos de Inicio, la lista de borrados que no se pintaba, datos de demostración, tres pruebas nuevas y el revisor con 11 puntos |
| 293 | 270 | Dos módulos nuevos y el apartado de la ficha de la persona: el paso de grupo en «Nuevo asunto» sobre el buscador de señalar varios, el tercero `GRUPO …` en todos los sitios que buscan a la persona del asunto, la tabla calculada con sus filtros, datos de demostración, dos pruebas nuevas y el revisor con 15 puntos |
| 294 | 270 | Dos módulos nuevos: sacar el PDF del visor a una función que pinta fuera de la vista, la muestra previa, la barra con «Parar», la referencia escrita con pdf-lib, reconocerla en el nombre y en el texto del PDF sellado, partir un PDF con varias, la lista de sin colocar, PDF sellados de demostración, dos pruebas nuevas y el revisor con 13 puntos |
| 295 | 240 | Tres módulos nuevos: la pantalla de dos columnas con la muestra y «A quién», la tanda de uno en uno con apunte cada diez, los fallos y el tope diario con «Seguir enviando», el aviso de Inicio, los avisos sin documento como un trabajo más, un PDF `CORREO` por tanda, retirar «Enviar a cada uno», dos pruebas nuevas y el revisor con 15 puntos |
| 296 | 150 | Un módulo nuevo: partir lo pegado o el fichero, el reconocimiento por número, DNI y nombre con su índice, el cuadro con tres apartados, guardar como grupo, dos tocayos en la demostración, una prueba nueva con quince casos y el revisor con 11 puntos |
