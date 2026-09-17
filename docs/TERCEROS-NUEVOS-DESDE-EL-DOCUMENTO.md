# Dar de alta un tercero desde el documento que se está clasificando

Acordado con Francisco el 17 de septiembre de 2026. Va **después** de
`docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md`, y no tiene sentido sin ella.

Aquella instrucción hace que la aplicación lea el documento y proponga el tercero. Falta el caso
contrario: el documento dice sin ninguna duda de quién es, pero ese tercero **no está todavía en
ninguna lista**. Pasa con empresas nuevas, con personal que acaba de llegar y, sobre todo, con los
aspirantes a plaza, que no salen en `RegAlum.csv` porque aún no son alumnos del centro.

## Lo que se decidió, y no se vuelve a discutir

- **La aplicación nunca da de alta un tercero sola.** Propone, abre el alta con los datos ya
  escritos, y Francisco mira y guarda. En una empresa, la razón social tiene que ser la exacta, y
  un papel puede traer el nombre comercial o una abreviatura.
- **El alumnado matriculado sigue saliendo solo de `RegAlum.csv`.** No se da de alta a mano: si un
  alumno matriculado no aparece, lo que falta es el listado, no el alumno.
- **Los aspirantes sí se dan de alta a mano**, como categoría propia.
- El Nº de identificación escolar de un aspirante **es opcional**. Muchos ya lo traen, porque
  vienen del sistema educativo andaluz. Los que no, lo tendrán en cuanto su solicitud se registre
  en Séneca.

## 1. La propuesta de alta

Cuando el análisis del documento encuentra un documento de identidad válido (DNI, NIE o NIF) que
**no cuadra con ningún tercero conocido**, y a su lado un nombre o una razón social:

- En la tarjeta del documento, debajo de la línea de la propuesta, un botón:
  **"Dar de alta: Talleres Alhaurín, S.L. — B29…"**.
- Al pulsarlo se abre el alta de tercero que ya existe, con los datos escritos dentro. No se
  escribe un formulario nuevo: se reutiliza el que hay.
- Si no aparece ningún documento de identidad pero el nombre está claro, el botón sale igual y el
  hueco del documento se queda vacío, esperando.
- La categoría se propone por lo que diga el propio papel: un NIF de empresa propone empresa; una
  solicitud de plaza propone aspirante. Francisco puede cambiarla antes de guardar.
- Guardado el tercero, se vuelve a la lista con el documento ya asignado a él, sin repetir pasos.

## 2. Alumnado pendiente (los aspirantes)

Categoría nueva de tercero, junto a alumnado, personal y empresas.

- Datos: apellidos, nombre, documento de identidad, Nº de identificación escolar (opcional),
  teléfono, correo y tutores, si el papel los trae.
- Se guardan donde ya se guardan los terceros dados de alta a mano. **No inventes un fichero
  nuevo** sin mirar antes qué hay en `docs/CONTEXTO.md`; si de verdad hace falta uno, que siga la
  misma mecánica de fusión entre ordenadores que los demás.
- Aparecen en el buscador de terceros, con la marca "aspirante" bien visible, para no confundirlos
  con el alumnado matriculado.

## 3. El nombre de la carpeta

- Con Nº de identificación escolar, se nombra como cualquier alumno: `Apellido1 Apellido2, Nombre`
  + el número.
- Sin él, se nombra solo con apellidos y nombre. No se inventa ningún número ni se usan las
  últimas cifras del DNI.
- El aspirante sin número queda marcado como **"pendiente de número"**.

## 4. Cuando llega el número

- Francisco escribe el número una vez, en la ficha del tercero.
- Al guardarlo, la aplicación **renombra sola las carpetas de los asuntos abiertos** de ese
  tercero, con el mismo camino que ya usa editar un asunto. Antes de tocar nada, enseña la lista
  de carpetas que va a renombrar y espera un "Adelante".
- **Las carpetas ya archivadas no se tocan.** Se quedan con el nombre que tenían.
- Si el aspirante acaba apareciendo en `RegAlum.csv` con ese mismo documento de identidad, la
  aplicación lo reconoce, avisa de que ya es alumno matriculado y deja de tratarlo como aspirante.
  No se crea un tercero duplicado.

## 5. El aviso

En la pantalla "Qué me toca", un aviso mientras haya aspirantes pendientes de número:
"3 aspirantes sin Nº de identificación escolar". Se pulsa y lleva a la lista de esos terceros.
Es un aviso, no un hito: no lleva fecha límite ni responsable.

## 6. Ficheros que hay que tocar

- `js/lector-documentos.js` — decidir cuándo un documento de identidad es "desconocido".
- `js/documentos-sueltos.js` — el botón "Dar de alta".
- `js/archivo-personas.js` y `js/datos.js` — la categoría nueva y el alta.
- `js/asuntos-nuevo.js` — el buscador de terceros, con la marca de aspirante.
- `js/nombres.js` — el nombre de carpeta sin número.
- `js/asuntos-editar.js` — el renombrado de las carpetas abiertas al llegar el número.
- `js/que-me-toca.js` — el aviso.
- `index.html` si hace falta un `<script>` nuevo.
- `pruebas/`, y al terminar `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md`,
  `docs/COLA.md`.

Si algún nombre de módulo no cuadra con lo que hay de verdad, manda el repositorio: mira
`docs/CONTEXTO.md` y usa el que sea, sin cambiar la arquitectura.

## 7. Cómo trabajar esta instrucción

- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no lo permite (ver
  la nota del final de `docs/COLA.md`), abre el pull request y fúsalo tú mismo en cuanto esté en
  verde y sin conflictos.
- Cambios quirúrgicos, no reescribir ficheros enteros. No leer el repositorio entero.
- Cualquier fichero que toques y pase de unas 400 líneas, pártelo.
- **Una sola tanda de pruebas al final** (`npm test`). Comprobar lo publicado con `curl`.
- No preguntes nada a Francisco. Al final, un mensaje corto de qué verá distinto.

## 8. Pruebas

1. Un documento con un NIF desconocido: sale el botón de alta con la razón social.
2. Un documento con el DNI de un tercero que ya existe: **no** sale el botón de alta.
3. Un aspirante sin número: su carpeta se nombra sin número y queda marcado como pendiente.
4. Al escribir el número, se renombran los asuntos abiertos y no los archivados.
5. Un aspirante cuyo documento de identidad aparece luego en `RegAlum.csv`: no se duplica.

## 9. Al terminar

Lo de siempre: fila **HECHA** con fecha y versión, `CONTEXTO-CORTO.md` y `CONTEXTO.md`
sustituyendo la línea vieja, `HISTORIA.md` con lo que merezca recordarse, y `App.VERSION` con la
hora de verdad (`TZ='Europe/Madrid' date`).
