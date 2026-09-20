# Filas nuevas para `docs/COLA.md` (20-sep-2026)

Acordadas con Francisco el 20-sep-2026. **Lo primero que tienes que hacer es apuntarlas en
`docs/COLA.md`**, y después hacerlas. Este documento existe solo porque quien las acordó no podía
reescribir `docs/COLA.md` entero sin riesgo de erratas (ver la nota del 19-sep-2026 en la propia
cola).

## Qué hacer con este documento

1. Abre `docs/COLA.md`.
2. Añade estas tres filas al final de la tabla, en este orden.
3. Sustituye la nota que dice "**No queda ninguna fila PENDIENTE**" por una que diga que quedan
   las filas 81, 82 y 83, en ese orden.
4. Borra este documento (`docs/COLA-NUEVAS-2026-09-20.md`) en la misma subida.
5. Haz las tres filas, en orden, siguiendo las reglas de siempre de la cola.

## Las filas

| Nº | Instrucción | Estado |
|---|---|---|
| 81 | `docs/FIRMANTES-Y-MEMBRETE.md` | PENDIENTE |
| 82 | `docs/FORMULARIOS-OFICIALES.md` | PENDIENTE |
| 83 | `docs/PLANTILLAS-DEL-CENTRO.md` | PENDIENTE |

**El orden importa.** La 83 usa lo que montan la 81 y la 82, así que va la última. La 81 y la 82
son independientes entre sí.

## Las tres, en una línea cada una

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

## Una cosa que Francisco tiene que hacer, una sola vez

Cuando la fila 81 esté publicada: entrar en **Ajustes → El centro → Membrete** y subir la imagen
del membrete sin la línea de la Consejería, que ya tiene preparada. Después, escribir en ese
mismo bloque el nombre actual de la Consejería, y rellenar los cargos con las personas que los
ocupan hoy.
