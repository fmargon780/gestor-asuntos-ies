# Lo pide — quién nos ha pedido la gestión

Acordado con Francisco el 17 de septiembre de 2026.

## El problema

Alguien pide un certificado de un alumno. Pasan días. Cuando el documento está listo, ya no se
recuerda quién lo pidió: si el padre, la madre, el propio alumno u otra persona. No se sabe a
quién hay que contestar.

## Lo que hay que hacer

Cada asunto guarda, si se quiere, **quién lo pidió, por qué vía y en qué fecha**. Ese dato se ve
en la ficha y, cuando se prepara un correo, el destinatario viene ya puesto con esa persona.

El dato es **opcional en todos los asuntos**. Un asunto sin él funciona exactamente igual que hoy.
No hay migración de asuntos antiguos: la clave sencillamente no existe en ellos.

---

## 1. Dónde se guarda

Una clave nueva y opcional en la ficha del asunto (`_GESTOR/asuntos.json`), escrita siempre con
`App.anotar(clave, datos)`, nunca con `Carpetas.guardarJson`:

    loPide: {
      nombre,      // texto: el nombre de quien lo pidió, tal y como se enseña
      categoria,   // 'ALUMNADO' | 'PERSONAL' | 'EMPRESAS' | 'OTROS' | '' (vacío si se escribió a mano)
      relacion,    // texto: 'El propio interesado', 'Tutor legal 1', 'Tutor legal 2', o lo que se escriba
      correo,      // texto, opcional: dirección de contacto, si se conoce
      telefono,    // texto, opcional
      via,         // la misma clave de vía que ya usa el asunto (ver punto 4)
      fecha,       // ISO, la del día en que se pidió
      apuntadoPor  // quien lo apuntó, igual que `abiertoPor`
    }

Todos los campos son cadenas. Para vaciar el dato se guarda `loPide: null` (recuerda que
`App.anotar` hace `Object.assign`: pasar `undefined` no borra nada).

**Conflictos de Dropbox:** se acepta el comportamiento de hoy. `js/conflictos.js` fusiona los
asuntos por su clave y, dentro, solo `notas`, `pasosHechos` y `pasosElegidos`; `loPide` es un
campo más que gana el lado elegido. **No toques `js/conflictos.js`.**

---

## 2. Módulo nuevo `js/lo-pide.js`

Para no engordar `js/asuntos-nuevo.js`, `js/ficha-asunto.js` ni `js/correo.js`, toda la lógica vive
en un módulo nuevo, `window.LoPide`, con esta API pública:

- `LoPide.opciones(persona)` → lista de `{ valor, texto, datos }` con los candidatos de un tercero:
  - siempre, `El propio interesado` (con el correo y el teléfono que se le conozcan);
  - si la categoría es `ALUMNADO`, `Tutor legal 1 · <nombre>` y `Tutor legal 2 · <nombre>`, cuando
    existan. **Reutiliza el reconocimiento por patrón que ya hace `datosDeTutor(campos, numero)`
    en `js/plantillas.js`**: sácala de ahí a `js/lo-pide.js`, hazla pública
    (`LoPide.datosDeTutor`) y que `js/plantillas.js` la llame, en vez de tener dos copias;
  - siempre, `Otra persona…`.
- `LoPide.controles(caja, persona, valorInicial)` → pinta los controles (punto 3) dentro de `caja`
  y devuelve `{ leer() }`, donde `leer()` devuelve el objeto `loPide` o `null`.
- `LoPide.texto(ficha)` → una línea legible: `María López (Tutor legal 1) · por teléfono · 17-sep-2026`.
  Cadena vacía si no hay dato.
- `LoPide.correoDe(ficha)` → la dirección de quien lo pide, o cadena vacía.

**El parentesco real (padre, madre, abuela…) no existe en los datos del centro.** El RegAlum no
trae esa columna y la aplicación no la lee en ningún sitio. Por eso la relación se enseña como
`Tutor legal 1` / `Tutor legal 2`, y solo cuando se elige `Otra persona…` se puede escribir a mano.
No inventes una columna nueva.

---

## 3. En la pantalla de crear un asunto (`js/asuntos-nuevo.js`)

Dentro de `#bloque-detalles`, debajo de lo que ya hay, un grupo nuevo titulado **Lo pide
(opcional)**, en línea, **sin cuadro de diálogo**:

- `#campo-lopide`: desplegable con las opciones de `LoPide.opciones(persona)`. Arranca en blanco
  («— sin apuntar —»). Se repinta cuando cambia el tercero elegido (`App.fijarTercero`).
- Si se elige `Otra persona…`, salen dos campos de texto: `#campo-lopide-nombre` («Nombre») y
  `#campo-lopide-relacion` («Qué es del interesado»), más `#campo-lopide-correo` («Correo, si lo
  tienes»). Si se elige cualquier otra opción, esos campos se esconden.
- `#campo-lopide-via`: desplegable con las mismas vías que el asunto (punto 4).
- `#campo-lopide-fecha`: fecha, puesta de partida en `U.hoyIso()`, cambiable.

Dejarlo todo en blanco es válido: entonces no se escribe la clave `loPide`. `App.datosDelFormulario()`
añade `loPide` solo si hay nombre.

**No entra en el nombre de la carpeta.** Ni en el del asunto ni en el de los documentos.

---

## 4. Las vías

Reutiliza las vías que el asunto ya usa (`App.textoVia`, `Nombres.via`, el desplegable
`#campo-via`). No inventes una lista nueva. Si alguna de las que hay no encaja para pedir algo
(por ejemplo una vía que solo tenga sentido de salida), déjala igualmente: es preferible una sola
lista a dos parecidas.

---

## 5. En la ficha del asunto (`js/ficha-asunto.js`)

Dos sitios:

1. **Bloque «Datos del asunto»**, en `datosDelAsunto(a, p)`: una fila más, titulada **Lo pide**,
   con `LoPide.texto(f)`. Ponla justo debajo de `Vía de comunicación`. `filas()` ya descarta las
   vacías, así que un asunto sin el dato no enseña nada.
2. **Cabecera de la ficha**, junto a `.marca-estado` y `.marca-plazo`: si hay dato, una marca más
   `.marca-lopide` con `Lo pide: <nombre>`, para verlo de un vistazo al entrar. Si no hay dato, no
   se pinta nada.

Y un botón para rellenarlo o cambiarlo después:

- En `pintarAcciones(a, abierto, p)`, junto al botón de vía, un botón **Lo pide** que abre
  `U.preguntar` con los mismos controles de `LoPide.controles(...)` (más un botón «Quitar el dato»
  cuando ya lo hay). Al aceptar: `await U.mientrasGuarda(boton, ...)` con `App.anotar`, y después
  `pintar()`.
- **Solo en asuntos abiertos.** En el ARCHIVO (`modo !== 'abierto'`) la fila se ve pero el botón no
  se pinta, como el resto.
- **No lo metas en `esControlDeSoloLectura`**: es un control que modifica, así que tiene que
  apagarse solo en modo consulta cuando el compañero ya está dentro del asunto.
- **No toques `js/asuntos-editar.js`.** El dato se cambia desde este botón, no desde «Editar».

---

## 6. En el cuadro de Correo (`js/correo.js`)

En `cuerpoDeCorreo`, al pintar la lista `#correo-lista`:

- Si el asunto tiene `loPide` con correo (`LoPide.correoDe(a.ficha)`):
  - si esa dirección está entre las de `correosDe(persona)`, **marca solo esa casilla** y desmarca
    las demás;
  - si no está, deja todas las casillas **desmarcadas** y escribe la dirección en `#correo-otro`.
- Encima de la lista, una línea de aviso en gris: `Lo pidió <nombre> (<relación>), el <fecha>.`
- Si `loPide` no tiene correo pero sí nombre, solo la línea de aviso, sin tocar las casillas.
- Si no hay `loPide`, todo queda exactamente como hoy.

Esto va siempre en **Para**, nunca en copia oculta: la copia oculta se reserva a los grupos.

En el cuadro de Séneca, `aQuien(a)` devuelve el nombre de quien lo pide cuando lo hay, y lo de hoy
cuando no.

---

## 7. En las plantillas (`js/plantillas.js`)

Cuatro huecos nuevos en `HUECOS` y sus valores en `valoresDeAsunto(asunto)`:

- `{quienlopide}` — «Quien lo pide»
- `{quienlopiderelacion}` — «Quien lo pide: qué es del interesado»
- `{quienlopidevia}` — «Quien lo pide: por dónde lo pidió»
- `{quienlopidefecha}` — «Quien lo pide: fecha»

Nada más: `CONOCIDOS`, el desplegable de Ajustes y los botones de insertar salen de `HUECOS`, y
`js/docx.js` usa el mismo motor. Un hueco sin valor sale vacío y se apunta en «Faltan datos», que
es justo lo que queremos en un asunto sin solicitante.

Recuerda sacar `datosDeTutor` a `js/lo-pide.js` y llamarla desde aquí (punto 2).

---

## 8. Ficheros que hay que tocar

- `js/lo-pide.js` — **nuevo**.
- `index.html` — una línea de `<script>` para el módulo nuevo, **antes** de `js/asuntos-nuevo.js` y
  de `js/plantillas.js`; y los controles nuevos de `#bloque-detalles` si los declaras ahí.
- `js/asuntos-nuevo.js` — el grupo «Lo pide (opcional)» y `App.datosDelFormulario()`.
- `js/ficha-asunto.js` — la fila, la marca de cabecera y el botón.
- `js/correo.js` — destinatario precargado, línea de aviso y `aQuien(a)`.
- `js/plantillas.js` — los cuatro huecos, sus valores, y `datosDeTutor` llamada desde el módulo nuevo.
- `css/` — lo mínimo para `.marca-lopide` y el grupo nuevo, reutilizando las clases que ya hay.
- `pruebas/lo-pide.mjs` — **nueva**.
- `js/version.js`, `docs/CONTEXTO.md`, `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`.

**No toques:** `js/conflictos.js`, `js/asuntos-editar.js`, `js/papelera.js`, `js/asuntos-lista.js`,
`apps-script/gestor-correos.gs`.

---

## 9. Cómo trabajar

- **Sube directamente a `main`, sin abrir ninguna pull request.** Si tu sesión no tiene permiso
  para tocar `main`, abre el pull request y **fusiónalo tú** en cuanto la batería esté en verde y
  no haya conflictos (permiso permanente de Francisco, al final de `docs/COLA.md`).
- Cambios quirúrgicos. No reescribas ficheros enteros.
- No leas el repositorio entero: con `docs/CONTEXTO.md` y los ficheros de la lista basta.
- **Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.
- Si algún fichero que tengas que tocar pasa de unas 400 líneas por culpa de este cambio, pártelo
  en dos.
- Comprueba lo publicado con `curl` y `?v=`, nunca des la publicación por hecha.

## 10. La prueba

`pruebas/lo-pide.mjs`, sin navegador (jsdom o `vm`, como `pruebas/plantillas-documento.mjs`), con
estos escenarios:

1. Un asunto sin `loPide` se pinta igual que antes: ni fila, ni marca, ni línea en el correo.
2. Crear un asunto con «Tutor legal 1» guarda `loPide` con su nombre y su correo.
3. `LoPide.texto` monta la línea legible con nombre, relación, vía y fecha.
4. En el cuadro de Correo, con solicitante conocido, queda marcada **solo** su casilla.
5. Con un solicitante escrito a mano cuyo correo no está en la lista, la dirección acaba en
   `#correo-otro` y ninguna casilla queda marcada.
6. Los cuatro huecos nuevos se rellenan; en un asunto sin solicitante salen vacíos y aparecen en
   «Faltan datos».
7. «Quitar el dato» deja la ficha sin `loPide` (guardado como `null`, no `undefined`).

Nada de fechas escritas a mano: cuéntalas desde hoy. Comprueba que la prueba falla sin el arreglo.
