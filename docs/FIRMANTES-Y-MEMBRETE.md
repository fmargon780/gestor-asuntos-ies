# Fila 81 · Los firmantes del centro y el membrete

Acordado con Francisco el 20-sep-2026. **Sube directamente a `main`, sin abrir ninguna petición
de cambios.** Cambios quirúrgicos: no reescribas ficheros enteros que no cambien, no leas el
repositorio entero, y haz una sola pasada de pruebas al final.

Lee antes `docs/CONTEXTO.md` y `docs/contexto/DOCUMENTOS-PDF.md` (sección "Plantillas de
documento de Word"). No hace falta ninguna otra zona.

---

## Por qué

Hoy un documento generado sale sin membrete y con una firma fija escrita a mano en
`plantillas.json` (`firma`, `cargo`). Dos problemas:

1. **Las personas que ocupan un cargo cambian.** Si la firma es un texto fijo, hay que corregirla
   a mano cada vez que cambia el equipo directivo, y los documentos antiguos no dicen quién
   firmaba entonces.
2. **El membrete lleva el nombre de la Consejería, que también cambia.** Si va dentro de una
   imagen, hay que rehacer la imagen cada vez.

Esta fila resuelve las dos cosas.

---

## Parte 1 · Los cargos del centro, con fechas

### El fichero

Fichero compartido nuevo: **`_GESTOR/cargos.json`**.

    {
      "cargos": [
        {
          "id": "direccion",
          "nombre": "Dirección",
          "orden": 1,
          "tratamiento": "El Director",
          "ocupantes": [
            { "id": "...", "persona": "Nombre Apellido1 Apellido2", "desde": "2025-07-01", "hasta": "" }
          ]
        }
      ]
    }

- `persona`: el nombre tal cual debe salir firmado. Texto libre.
- `desde` y `hasta`: `AAAA-MM-DD`. `hasta` vacío significa que sigue en el cargo.
- `tratamiento`: cómo se nombra el cargo en un documento ("El Director", "La Secretaria"…).
  Se escribe a mano, porque depende del sexo de quien ocupe el cargo; al cerrar un ocupante y
  abrir otro, la pantalla recuerda revisarlo.
- `orden`: para pintarlos siempre en el mismo orden, no alfabético.

**Es uno de los ficheros compartidos**: pasa por `Copias.guardar`, se relee antes de escribir
(`App.fusionarConDisco`), entra en la comprobación de fichero roto de `Copias.comprobarTodos` y
en el bloque de conflictos de Ajustes (se elige a mano con cuál quedarse, como `guias.json`: es
un fichero que cambia poco). **Los "catorce ficheros compartidos" pasan a ser quince**: corrige
esa cuenta en `docs/CONTEXTO.md` y en `docs/CONTEXTO-CORTO.md` allí donde aparezca.

Si el fichero no existe, se crea con estos cargos de fábrica, sin ningún ocupante:

| id | nombre | tratamiento de partida |
|---|---|---|
| `direccion` | Dirección | El Director |
| `vicedireccion` | Vicedirección | El Vicedirector |
| `jefatura-estudios` | Jefatura de Estudios | El Jefe de Estudios |
| `secretaria` | Secretaría | El Secretario |
| `administracion` | Administración | El Auxiliar Administrativo |
| `orientacion` | Orientación | El Orientador |

Se pueden añadir, renombrar y borrar cargos. El borrado pasa por `Papelera.botonBorrar`
(clase `'cargo'`), con la misma limitación conocida que `'plantilla'`: `js/papelera.js` no sabe
devolverlo.

### El módulo

Fichero nuevo **`js/cargos.js`** (`window.Cargos`), enganchado en `index.html` antes de
`js/plantillas.js`:

- `Cargos.cargar()` / `Cargos.guardar(datos)`: lectura y escritura, con relectura previa.
- `Cargos.enFecha(idCargo, fecha)`: devuelve `{ persona, tratamiento, nombre }` del ocupante
  vigente en esa fecha, o `null` si no hay ninguno. La comparación es por texto de fecha
  `AAAA-MM-DD`, sin objetos `Date`: `desde <= fecha` y (`hasta` vacío o `fecha <= hasta`).
- `Cargos.vigente(idCargo)`: `enFecha(idCargo, hoy)`.
- `Cargos.solapes(cargo)`: función sin efectos, devuelve los pares de ocupantes cuyas fechas se
  pisan. Solo sirve para avisar en pantalla; nunca impide guardar.

**Nada de fechas escritas a mano en las pruebas** (regla de `docs/CONTEXTO.md`): en
`pruebas/cargos.mjs` (sin navegador, con `vm`) las fechas se cuentan desde hoy. Casos: ocupante
único sin cese, dos ocupantes en cadena, una fecha anterior a todos, una fecha entre el cese de
uno y el alta del siguiente (devuelve `null`), un solape, y un cargo sin ocupantes.

### La pantalla

**Ajustes → El centro**, bloque nuevo **"Cargos del centro"**, debajo de "Datos del centro y
firma":

- Una tarjeta por cargo, en su `orden`, con su nombre, su tratamiento y su ocupante vigente en
  grande.
- Dentro de cada tarjeta, un `<details>` "Quién lo ha ocupado" con la lista completa, de la más
  reciente a la más antigua, cada una con sus dos fechas editables.
- Botones: **Añadir persona** (pide nombre y fecha de inicio; si hay un ocupante vigente, propone
  cerrarlo el día anterior, sin obligar) y **Cerrar** en el ocupante vigente (pide la fecha de
  cese).
- Avisos en ámbar, que no impiden nada: cargo sin ocupante vigente, y fechas que se solapan.
- Todo lo que guarda usa `U.mientrasGuarda(control, fn)`.

---

## Parte 2 · Quién firma cada plantilla

En `_GESTOR/plantillas.json`, cada fila de `documentos[]` gana dos claves nuevas:

- `firmante`: el `id` de un cargo, o vacío.
- `vistoBueno`: el `id` de un cargo, o vacío.

`limpio()` las normaliza a `''` en los ficheros viejos, igual que hizo con `documentos`.

En **Ajustes → Plantillas de documento**, el alta y la edición ganan dos desplegables:
"Quién firma" y "Visto bueno (opcional)", con los cargos de `cargos.json`.

### Huecos nuevos

En `Plantillas.HUECOS` y en `Plantillas.valoresDeAsunto(asunto)` (`js/plantillas.js`):

| Hueco | Qué trae |
|---|---|
| `{{FIRMANTE}}` | El nombre de la persona que ocupa el cargo firmante **en la fecha del documento** |
| `{{CARGO FIRMANTE}}` | El `nombre` de ese cargo |
| `{{TRATAMIENTO FIRMANTE}}` | El `tratamiento` de ese cargo ("El Director") |
| `{{VISTO BUENO}}` | Igual, para el cargo del visto bueno |
| `{{CARGO VISTO BUENO}}` | |
| `{{TRATAMIENTO VISTO BUENO}}` | |
| `{{CONSEJERIA}}` | El nombre de la Consejería de Ajustes (ver la parte 3) |

**La fecha con la que se resuelve el cargo** es la fecha del documento que se está generando (hoy).
`valoresDeAsunto` recibe un segundo argumento opcional `opciones` con `{ fecha, plantilla }`;
sin él, hoy y sin firmante, como hasta ahora. `js/plantillas-documento.js` se lo pasa al generar.

Si el cargo no tiene ocupante en esa fecha, el hueco se queda vacío y sale en el aviso de
"huecos sin datos" que ya existe, que no impide generar nada.

---

## Parte 3 · El membrete

### La imagen

**Ajustes → El centro**, bloque nuevo **"Membrete"**:

- Un botón para elegir una imagen (PNG o JPG) del ordenador. Se guarda tal cual en
  `_GESTOR/PLANTILLAS/membrete.png` con `Carpetas.escribirBytes`. Es la única vez que la
  aplicación escribe en `PLANTILLAS`; el resto sigue siendo solo lectura.
- Un campo de texto **"Nombre de la Consejería"**, guardado en `plantillas.json` como clave de
  raíz nueva `consejeria` (junto a `centro`, `localidad`, `direccion`, `codigo`, `cargo`).
- Un `<details>` **"Dónde va el nombre de la Consejería"** con cuatro números, en **porcentaje**
  del ancho o del alto de la imagen, guardados en `plantillas.json` como `membreteCaja`:

  | Clave | Qué es | Por defecto |
  |---|---|---|
  | `x` | Borde izquierdo del texto, en % del ancho | 10,3 |
  | `y` | Línea base del texto, en % del alto | 43,2 |
  | `ancho` | Ancho máximo del texto, en % del ancho | 20,7 |
  | `alto` | Altura máxima de la letra, en % del alto | 10,0 |

  Son porcentajes a propósito: así la misma caja vale aunque la imagen se cambie por otra de
  distinto tamaño.
- **Vista previa en vivo**: debajo, la imagen montada con el nombre escrito encima, que se
  rehace al cambiar cualquiera de los seis valores.

### El montaje

Fichero nuevo **`js/membrete.js`** (`window.Membrete`), sin librerías:

- `Membrete.medir(texto, caja, anchoImagen, altoImagen)`: función **sin efectos**, probada
  suelta. Devuelve `{ tamano, lineas }`: empieza por el tamaño máximo (`caja.alto` % del alto) y
  lo baja de punto en punto mientras el texto no quepa en `caja.ancho`, hasta un mínimo del 55 %
  del máximo; si con ese mínimo sigue sin caber, parte el texto en dos líneas por el espacio que
  deje las dos mitades más parejas y devuelve las dos.
- `Membrete.montar()`: lee `membrete.png` de `_GESTOR/PLANTILLAS` y los ajustes, dibuja la imagen
  en un `<canvas>` de su tamaño original, escribe encima el nombre de la Consejería
  (`font` Arial/Helvetica, color `#1E1A1E`, `textBaseline: 'alphabetic'`) y devuelve
  `{ bytes, ancho, alto }` en PNG. Con dos líneas, la primera sube y la segunda baja,
  repartidas alrededor de la línea base de la caja.
- Si no hay imagen guardada, devuelve `null` y quien llama sigue sin membrete, sin fallar.

### Meter el membrete en el documento

En **`js/docx.js`**, función nueva
`Docx.ponerImagen(bufferDocx, nombreHueco, bytesPng, anchoPx, altoPx)`, que se aplica **antes**
de `Docx.rellenar` y devuelve otro buffer:

- Busca el párrafo que contenga el hueco `{{MEMBRETE}}` en `word/document.xml` y en cada
  `word/header*.xml`, y **sustituye el párrafo entero** por uno con un `<w:drawing>` en línea
  que apunte a la imagen.
- Añade la entrada `word/media/membrete.png` al ZIP (sin comprimir, método 0, con su CRC-32,
  como ya hace el resto del fichero).
- Añade la relación en el `_rels` que le toque (`word/_rels/document.xml.rels` o
  `word/_rels/headerN.xml.rels`), con un `Id` que no esté cogido (`rIdMembrete1`, y si está,
  el siguiente libre), tipo `.../image`.
- Añade a `[Content_Types].xml`, si no está ya, `<Default Extension="png" ContentType="image/png"/>`.
- **El ancho**: la imagen se mete a 17 cm de ancho (el ancho útil de un A4 con márgenes
  normales), y el alto en proporción. En unidades de Word: `17 cm = 6120000 EMU`
  (1 cm = 360000 EMU).
- Si el documento no trae el hueco `{{MEMBRETE}}` en ninguna parte, no toca nada y devuelve el
  buffer tal cual.

`js/plantillas-documento.js`, al generar: monta el membrete con `Membrete.montar()`, lo mete con
`Docx.ponerImagen` si lo hay, y después rellena los huecos como hasta ahora.

---

## Qué hay que actualizar al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: sustituye la línea de las plantillas por una que diga que
  el documento sale con membrete y con la firma del cargo vigente en su fecha.
- `docs/CONTEXTO.md`: la tabla de `_GESTOR` (fichero `cargos.json` nuevo, `plantillas.json` con
  `consejeria`, `membreteCaja`, `firmante` y `vistoBueno`), y la cuenta de ficheros compartidos,
  que pasa de catorce a quince.
- `docs/contexto/DOCUMENTOS-PDF.md`: las tres partes de arriba.
- `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`: `js/cargos.js`, `js/membrete.js`,
  `pruebas/cargos.mjs`, `pruebas/membrete.mjs`.
- `docs/HISTORIA.md`: una entrada con fecha.

## Pruebas

- `pruebas/cargos.mjs` (sin navegador): lo dicho arriba.
- `pruebas/membrete.mjs` (sin navegador): `Membrete.medir` con un nombre corto (una línea, tamaño
  máximo), uno largo (dos líneas) y uno intermedio (una línea, tamaño reducido).
- `pruebas/plantillas-documento.mjs` (la que ya existe): añade un caso con `{{FIRMANTE}}` y
  `{{MEMBRETE}}`, comprobando que la imagen queda dentro del ZIP y que el hueco del firmante se
  rellena con el ocupante de la fecha.
