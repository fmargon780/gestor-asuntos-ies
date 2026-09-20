# Fila 82 · Los formularios oficiales, a un clic

Acordado con Francisco el 20-sep-2026. **Sube directamente a `main`, sin abrir ninguna petición
de cambios.** Cambios quirúrgicos, sin leer el repositorio entero, y una sola pasada de pruebas
al final.

Lee antes `docs/CONTEXTO.md` y `docs/contexto/HITOS-Y-GUIAS.md`. No hace falta ninguna otra zona.

---

## Por qué

Cuando un trámite pide un impreso oficial (una solicitud de admisión, un compromiso de
convivencia, un traslado de matrícula), hoy hay que salir de la aplicación a buscarlo. Unos se
descargan de la Consejería, otros los emite el propio centro, otros son protocolos sin impreso, y
otros se generan dentro de Séneca. Esa diferencia importa: no es lo mismo "descárgalo" que "no
existe impreso, se genera en Séneca".

El catálogo ya está hecho. Vive en el repositorio `fmargon780/normativa-escolarizacion`, en
`datos/formularios.json`, con 29 entradas y esta forma:

    "O:III": {
      "n": "Anexo III · Solicitud de admisión",
      "norma": "Orden de 20 de febrero de 2020",
      "via": "descarga",
      "u": "https://www.juntadeandalucia.es/educacion/portales/documents/.../3_Anexo III_002535_5.pdf",
      "nota": "Impreso oficial de la Consejería. También se cumplimenta en la Secretaría Virtual."
    }

`via` toma cuatro valores: `descarga` (impreso oficial descargable), `centro` (lo emite el
centro y se entrega a la familia), `protocolo` (no hay impreso, es un texto de actuación) y
`seneca` (se genera y se firma en Séneca; el anexo del BOJA es solo el modelo de referencia).

---

## Parte 1 · El catálogo dentro de la aplicación

**Se copia, no se lee en vivo.** La aplicación trabaja sobre ficheros del ordenador y la red del
centro bloquea direcciones que no hacen falta; depender de otra web para pintar una pantalla
sería frágil.

- Fichero nuevo en el repositorio: **`datos/formularios.json`**, con el contenido de
  `fmargon780/normativa-escolarizacion` → `datos/formularios.json`, tal cual. Bájalo con
  `get_file_contents` de ese repositorio y cópialo sin tocar nada.
- Fichero nuevo **`js/formularios.js`** (`window.Formularios`):
  - `Formularios.cargar()`: lee `datos/formularios.json` del propio sitio web (`fetch`
    relativo), una sola vez por sesión, y lo guarda en memoria. Si falla, devuelve `{}` y nadie
    se rompe.
  - `Formularios.buscar(texto)`: función sin efectos. Filtra por nombre y por norma, sin
    mayúsculas y sin tildes, con la misma normalización que ya usa `U.parecidos`.
  - `Formularios.etiquetaDeVia(via)`: devuelve el texto y el color de cada vía:
    `descarga` → "Se descarga" (verde), `centro` → "Lo emite el centro" (azul),
    `protocolo` → "Protocolo, sin impreso" (gris), `seneca` → "Se genera en Séneca" (ámbar).
- **Botón "Actualizar el catálogo" en Ajustes → Mantenimiento**: vuelve a leer el fichero y dice
  cuántos formularios hay. No descarga nada de internet: el fichero viaja con la aplicación, y se
  actualiza cuando se publique una versión nueva.

## Parte 2 · Dónde se ven

### En un hito

`docs/BIBLIOTECA-DE-HITOS.md` (fila 79) ya dio a cada hito su **normativa** citada. Ahora gana
también sus **formularios**: una lista de claves del catálogo (`formularios: ["O:III", "O11:VI"]`),
tanto en el hito modelo de la biblioteca (`_GESTOR/hitos-biblioteca.json`) como en el paso de la
guía de un tipo (`_GESTOR/guias.json`) y, copiada, en el hito vivo del asunto
(`_GESTOR/hitos.json`).

- **Al escribir un paso**, en la pantalla del tipo: un buscador que filtra el catálogo por
  palabras y deja marcar los que hagan falta. Se pinta junto al bloque de normativa que ya
  existe, dentro del mismo `<details>`, para no alargar más la pantalla.
- **En el hito vivo**, en el panel de hitos del asunto: una línea por formulario, con su nombre,
  su etiqueta de vía y, si tiene `u`, un enlace que abre la dirección en una pestaña nueva
  (`target="_blank"`, `rel="noopener"`). La `nota`, si la hay, va debajo en letra pequeña.
  Un formulario de vía `protocolo` o `seneca` **no se pinta como botón de descarga**: se pinta
  como aviso, con su nota, porque no hay nada que bajar.

### En la ficha del asunto

Un formulario puede hacer falta sin estar atado a ningún paso. Por eso, en la ficha del asunto,
dentro de la tarjeta "Datos del asunto", una línea nueva **"Formularios"**:

- Los formularios de todos los hitos del asunto, sin repetir, en el orden de los hitos.
- Más los del **tipo de asunto**: `tipos.json` gana una clave `formularios` (lista de claves del
  catálogo), editable en la pantalla del tipo, sección "Datos del tipo", con el mismo buscador.
- Si no hay ninguno, la línea no se pinta.

### Una pantalla propia

En la barra lateral, dentro de donde ya viven las pantallas de consulta, una pantalla
**"Formularios"**: el catálogo entero, buscable, agrupado por norma, con la etiqueta de vía de
cada uno y su enlace. Sirve para cuando hace falta un impreso sin tener un asunto delante.

---

## Qué hay que actualizar al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: una línea nueva sobre los formularios oficiales.
- `docs/CONTEXTO.md`: la tabla de `_GESTOR` no cambia de ficheros, pero sí el contenido de
  `guias.json`, `hitos.json`, `hitos-biblioteca.json` y `tipos.json` (clave `formularios`).
- `docs/contexto/HITOS-Y-GUIAS.md`: las dos partes de arriba.
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`: `js/formularios.js`, `datos/formularios.json`,
  `pruebas/formularios.mjs`.
- `docs/HISTORIA.md`: una entrada con fecha.

## Pruebas

`pruebas/formularios.mjs` (sin navegador): `buscar` con tildes y sin ellas, `etiquetaDeVia` con
las cuatro vías y con una desconocida, y que un formulario sin `u` no ofrezca enlace.

## Lo que queda para más adelante (no es parte de esta fila)

Ya estaba apuntado en `docs/COLA.md`: que la vigilancia diaria del BOJA del repositorio
`fmargon780/normativa-escolarizacion` deje sola una instrucción en la cola cuando cambie un
artículo citado por un hito. Cuando eso exista, podrá avisar también de que ha cambiado un
formulario.
