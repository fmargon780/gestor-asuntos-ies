# Filas nuevas para `docs/COLA.md` (20-sep-2026)

Acordadas con Francisco el 20-sep-2026. **Lo primero que tienes que hacer es apuntarlas en
`docs/COLA.md`**, y después hacerlas. Este documento existe solo porque quien las acordó no podía
reescribir `docs/COLA.md` entero sin riesgo de erratas (ver la nota del 19-sep-2026 en la propia
cola).

## Qué hacer con este documento

1. Abre `docs/COLA.md`.
2. Añade estas cuatro filas al final de la tabla, en este orden.
3. Sustituye la nota que dice "**No queda ninguna fila PENDIENTE**" por una que diga que quedan
   las filas 81, 82, 83 y 84, en ese orden.
4. Borra este documento (`docs/COLA-NUEVAS-2026-09-20.md`) en la misma subida.
5. Haz las cuatro filas, en orden, siguiendo las reglas de siempre de la cola.

## Las filas

| Nº | Instrucción | Estado |
|---|---|---|
| 81 | `docs/FIRMANTES-Y-MEMBRETE.md` | PENDIENTE |
| 82 | `docs/FORMULARIOS-OFICIALES.md` | PENDIENTE |
| 83 | `docs/PLANTILLAS-DEL-CENTRO.md` | PENDIENTE |
| 84 | `docs/FORMULARIOS-CON-LOS-DATOS-DEL-CENTRO.md` | PENDIENTE |

**El orden importa.** La 82 va antes que la 83 y que la 84, porque las dos usan su catálogo de
formularios. La 83 usa además los cargos y el membrete de la 81. La 81 y la 82 son
independientes entre sí. La 84 puede hacerse antes que la 83 si conviene, pero nunca antes que
la 82.

## Las cuatro, en una línea cada una

**81 · Los firmantes del centro y el membrete.** Cada cargo del centro (Dirección, Jefatura de
Estudios, Secretaría…) lleva la lista de quién lo ha ocupado, con fecha de inicio y de cese, en
un fichero compartido nuevo `_GESTOR/cargos.json`. Al generar un documento, la firma y el visto
bueno los pone la persona que ocupaba ese cargo **en la fecha del documento**. Y el membrete
deja de ser una imagen fija: la imagen se sube una vez en Ajustes, sin el nombre de la
Consejería, y ese nombre se escribe encima con lo que diga Ajustes, así que cuando la Consejería
cambie de nombre basta con corregir una línea. Ficheros nuevos: `js/cargos.js`,
`js/membrete.js`, `pruebas/cargos.mjs`, `pruebas/membrete.mjs`.

**82 · Los formularios oficiales, a un clic.** Se copia al repositorio el catálogo de 29
formularios que ya existe en `fmargon780/normativa-escolarizacion` (`datos/formularios.json`),
con su norma, su enlace y su vía (se descarga, lo emite el centro, es un protocolo sin impreso, o
se genera en Séneca). Cada hito y cada tipo de asunto pueden señalar los suyos, y se ven en el
panel de hitos y en la ficha del asunto. Más una pantalla propia con el catálogo entero,
buscable. Ficheros nuevos: `js/formularios.js`, `datos/formularios.json`,
`pruebas/formularios.mjs`.

**83 · Las plantillas del centro.** Los textos que hoy faltan: el documento de Word y el correo
de cada tipo de asunto que los necesite, escritos a partir de la biblioteca de la fila 80, con la
norma citada, el pie de firma de la fila 81 y los formularios de la fila 82. Las plantillas viven
en `plantillas/` del repositorio como texto, un script las convierte en `.docx`, y un botón de
Ajustes → Mantenimiento las carga en `_GESTOR/PLANTILLAS` sin que nadie suba nada a mano.
Ficheros nuevos: `plantillas/`, `scripts/hacer-plantillas.mjs`,
`pruebas/plantillas-del-centro.mjs`.

**84 · El impreso, con los datos del centro ya puestos.** Antes de imprimir un impreso oficial o
de mandárselo a una familia, a un trabajador o a una empresa, un botón lo prepara: escribe en él
**solo los datos del centro y el año académico**, y lo guarda en la carpeta del asunto listo para
adjuntar. Los datos de la persona los sigue escribiendo ella, **a propósito**, para poder
comprobar al recibir el impreso si alguno ha cambiado. Ficheros nuevos:
`js/formularios-rellenar.js`, `formularios/`, `pruebas/formularios-rellenar.mjs`.

## Una cosa que Francisco tiene que hacer, una sola vez

Cuando la fila 81 esté publicada: entrar en **Ajustes → El centro → Membrete** y subir la imagen
del membrete sin la línea de la Consejería, que ya tiene preparada. Después, escribir en ese
mismo bloque el nombre actual de la Consejería, y rellenar los cargos con las personas que los
ocupan hoy.
