# El DNI del personal, a la vista

Acordado con Francisco el 17-sep-2026. Es la fila 29 de `docs/COLA.md`.

**No leas el repositorio entero.** Con este documento, `docs/CONTEXTO.md` y los tres ficheros que
se nombran abajo hay bastante. Cambios quirúrgicos, no reescribir ficheros.

**Sube directamente a `main`. No abras ningún pull request** (si la sesión no puede tocar `main`,
vale la nota del final de `docs/COLA.md`).

**Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.

---

## El problema

En la ficha de una persona del centro (pantalla **Personas y empresas**, y el mismo bloque allá
donde se enseñan los datos de un tercero) el DNI no se ve. Sí está: viene en la columna
`DNI/Pasaporte` del `RelPerCen` de Séneca, o en la columna `Documento` de `personal.csv` para quien
se dio de alta a mano. Pero `Datos.destacadosPersona` no lo sube a los destacados, así que cae en
`resto`, y `resto` está escondido detrás del botón «Ver los demás datos del fichero».

Con el alumnado esto ya está resuelto desde hace tiempo, en `js/dni.js`. Al personal le falta.

## Lo que hay que hacer

### 1. El DNI, arriba del todo en la ficha del personal

En `js/datos.js`, dentro de `destacadosPersona`:

- Si `persona.documento` tiene algo, mete una fila **`DNI`** con ese valor **la primera de todas**,
  por encima de `Puesto`.
- Si no tiene nada, no metas la fila ni ningún aviso. El personal no lleva el aviso por edad que
  lleva el alumnado: aquí, si no consta, se calla.
- Que no se repita abajo: quita de `resto` la columna de la que sale ese documento. Hazlo como en
  `js/dni.js`, comparando el valor de la columna con el documento, para que valga tanto para
  `DNI/Pasaporte` (Séneca) como para `Documento` (`personal.csv`).

Con eso el DNI sale solo en los tres sitios que usan esa función.

### 2. El DNI, en la línea de debajo del nombre

En `js/asuntos-nuevo.js`, en la función que pinta el pie de un resultado de búsqueda
(`App.pieDe`), en la rama del personal: añade al final `  ·  DNI <documento>` cuando
`p.documento` tenga algo. Si no tiene, la línea se queda como está.

Es lo mismo que ya hace `js/dni.js` con el alumnado, y sirve para el buscador de Nuevo asunto y
para la lista de Personas y empresas.

No toques `js/dni.js`: ese fichero es del alumnado y de su aviso por edad.

## Ficheros que hay que tocar

- `js/datos.js` — `destacadosPersona`.
- `js/asuntos-nuevo.js` — `App.pieDe`, rama del personal.
- La prueba: si ya hay una prueba del DNI en `pruebas/`, añádele los dos casos nuevos. Si no la
  hay, crea `pruebas/dni-personal.mjs`, sin navegador.

Ninguno de los tres pasa de las 400 líneas por este cambio, así que no hay que partir nada.

## Qué tiene que comprobar la prueba

1. Una persona de Séneca con `DNI/Pasaporte`: la primera fila de los destacados es `DNI`, y ese
   valor ya no aparece en `resto`.
2. Una persona dada de alta a mano con `Documento`: lo mismo.
3. Una persona sin documento: no hay fila `DNI` y no se avisa de nada.

## Al terminar

- Sustituye en `docs/CONTEXTO-CORTO.md` la línea «DNI del alumnado a la vista, con aviso si falta
  y ya tocaría tenerlo» por una que diga también que el DNI del personal sale arriba en su ficha y
  debajo de su nombre en las búsquedas. **Sustituir la línea vieja, no añadir otra debajo.**
- Anota en `docs/HISTORIA.md` lo que merezca recordarse, con su fecha.
- Marca la fila 29 de `docs/COLA.md` como HECHA, con la fecha y la versión publicada.
