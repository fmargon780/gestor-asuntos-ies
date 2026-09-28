# Fila 221 — Tutorías: el texto del margen del PDF se come una fila

Diseñada con Francisco el 28-sep-2026 (Cowork). Es un arreglo pequeño, en
`js/tablas-datos-leer.js`, más su prueba.

## Lo que pasó

El certificado de función tutorial de Pareja de Vicente, Rosa María no trae el
curso 2013-2014, aunque sí los demás. El PDF de ese curso («FUNCION TUTORIAL 2013-2014.pdf», de
Séneca) se lee bien (sale 2013/2014 en Herramientas → Tablas de datos), pero su fila
«1º ESO A · Pareja de Vicente, Rosa María · (su DNI) · 01/09/2013 - 31/08/2014» no llega a la
tabla TUTORIAS: el lector devuelve 32 filas y falta justo esa.

## La causa (comprobada con el PDF real y el lector de la app)

Los PDF «Relación de funciones tutoriales» de Séneca llevan en el margen izquierdo un texto
vertical, `Ref.Doc.: RelFunTut`, en x ≈ 20. En ese PDF cae en y = 560,4; la fila de Rosa María
está en y = 562,8. `lineasDe` agrupa los trozos a ±3 de altura, así que el texto del margen entra
en la línea de ella y, al ordenar por x, queda **el primero**. La línea empieza entonces por
«Ref.Doc.: RelFunTut 1º ESO A …», `RE_IGNORAR` la toma por un pie de página y
`tutoriasDeTrozos` **tira la línea entera**.

Puede pasarle a cualquier persona en cualquier PDF de tutorías: basta con que su fila coincida en
altura con un trozo del margen o de un pie.

## Qué hay que cambiar

1. En `js/tablas-datos-leer.js`, **descartar trozo a trozo** los que casan con `RE_IGNORAR`
   (`Pág.`, `Ref.Doc`, `Cód. centro`, `Fecha generación`…) **antes de agrupar en líneas**, en vez
   de ignorar la línea completa. Así el texto del margen desaparece y la fila de datos queda
   intacta. Mantener, además, el descarte de líneas que solo tengan cabeceras o pies.
2. Por seguridad, descartar también los trozos girados (el `transform` de pdf.js con
   `b` o `c` distintos de 0) si al comprobarlo resulta que el del margen lo está. Si no lo está,
   con el punto 1 basta; no inventar más reglas.
3. Nada más cambia: ni la unión por DNI, ni los huecos, ni la plantilla.

## La prueba

En `pruebas/tablas-datos.mjs`, un caso nuevo que dibuje con pdf-lib la disposición de este PDF
real, con **nombres y DNI inventados**: cabecera `Unidad · Empleado/a · D.N.I. · Periodo`
(x 51, 126, 290, 370), filas cada 12,8 de altura, y el texto `Ref.Doc.: RelFunTut` en x 20 a
2,4 por debajo de una de las filas. Debe salir esa fila con su grupo, nombre, DNI y periodo, y
el número total de filas correcto. Los casos que ya había siguen pasando.

## Al terminar

- Publicar y comprobar como siempre.
- Poner al día `docs/contexto/TABLAS-DE-DATOS.md` (la línea de TUTORIAS: los pies y el margen se
  quitan trozo a trozo) y `docs/HISTORIA.md`.
- Francisco no tiene que hacer nada: al volver a abrir la app se relee el PDF, y el certificado
  de Rosa María ya saldrá con 2013-2014 al generarlo de nuevo.
