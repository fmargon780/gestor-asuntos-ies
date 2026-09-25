# Documentos en una sola vista, y el sello de nuestro centro venga por donde venga

Fila 143 de `docs/COLA.md`. Acordado con Francisco el 25-sep-2026 (Cowork). Diseño cerrado: no
preguntar nada.

## Por qué

1. En la ficha del asunto hay dos vistas de los documentos de la carpeta: el bloque «Documentos de
   la carpeta» (`js/ficha-documentos.js`) y el cuadro que abre «Documentos ▾» (`App.verDocumentos`
   → `Documentos.abrir`, `js/documentos.js`, `pintarLista`). Repiten Copiar nombre, Registrar y
   Borrar. Francisco quiere una sola.
2. El sello de registro solo se detecta si el PDF entra en la carpeta sin el nombre de la
   aplicación (aviso ámbar de `js/ficha-sellos.js`, máquina en `js/registro-sellado.js`). Si entra
   por «Añadir documento» o soltado en un hito, el formulario no lee el sello: hay que marcar el
   registro a mano y el original no pasa a «SIN SELLAR». Francisco quiere **el mismo
   comportamiento venga por donde venga el documento**.
3. `RegistroLector.buscarEnTexto` se queda con el **primer** sello que encuentra. Hay papeles con
   dos sellos: el de salida del emisor y el de entrada del receptor. **Solo vale el sello de
   nuestro centro.**

## Qué hay que hacer

### A. Una sola vista de documentos

Inventario comprobado (25-sep-2026). Lo que hoy solo está en el cuadro y hay que traer al bloque:

- **Añadir documento** (desde el ordenador) → el botón «Documentos ▾» de la cabecera del bloque
  (`ponerBotonGestionar`) pasa a llamarse **«Añadir documento»** y va directo al selector de
  fichero y al formulario de nombre (lo mismo que `Documentos.abrir(a, { irDirectoAAnadir: true })`,
  sin enseñar la lista). Sale también con la carpeta vacía.
- **Poner nombre** → primera opción del menú ⋮ de cada documento (`enMenu`, antes de Separar).
  Abre el formulario de renombrar con el visor a la izquierda (lo mismo que
  `Documentos.abrir(a, { ponerNombre: nombre })`). No sale para el índice del expediente.

Lo que ya está en el bloque se queda igual (ver al lado, Registrar, «Sin registrar», Asociar a un
hito, Copiar, Separar, Unir, Sacar páginas, Ajustar tamaño, Repartir entre terceros, Borrar).

Después, **la pantalla de lista del cuadro deja de enseñarse**. El formulario de nombre (añadir y
renombrar, con visor) se conserva: lo usan los hitos (`js/hitos-anadir.js`,
`js/hito-mesa-documentos.js`, `js/hitos-documento-menu.js`), «Por clasificar»
(`js/documentos-sueltos.js`) y el alta de asunto (`js/asuntos-nuevo-crear.js`). Al cerrar el
formulario se vuelve a la ficha, no a una lista.

Revisa todas las llamadas a `App.verDocumentos` / `Documentos.abrir` sin opciones (por ejemplo, el
botón de `js/asuntos-lista-pintar.js:205`, y lo que envuelve `js/archivo-personas.js`): donde
antes se veía la lista, que abra la ficha del asunto en «Documentos de la carpeta». Mantén
`js/envolturas-esperadas.js` coherente.

### B. Solo el sello de nuestro centro

- El sello de Séneca lleva el código del centro: `2026/29700692/M000000000368ENTRADA…`. Hoy
  `SELLO` en `js/registro-lector.js` no captura ese código.
- Captúralo y quédate **solo con los sellos cuyo código sea el del centro** (el mismo dato que
  usan las plantillas, `datosCentro.codigo`, ver `js/plantillas-valores.js`). Busca todas las
  coincidencias del texto, no solo la primera.
- Si no hay ninguno del centro, el resultado es «sin sello» (`null`), aunque haya sellos de otros
  organismos.
- Si el código del centro no está configurado, se sigue como hoy (primer sello), para no romper
  nada.
- Como `buscarEnTexto` / `leerSello` los usan también Registrar, «Por clasificar» y los adjuntos
  de correo, el arreglo les llega a todos.

### C. La misma detección venga por donde venga

Todo PDF que entra en la carpeta de un asunto se trata igual que hoy el caso del aviso ámbar:

- Caminos: dejado directamente en la carpeta (ya funciona), «Añadir documento», soltado en la mesa
  de un hito, «Por clasificar» y adjunto de correo (`js/bandeja-adjuntos-lector.js`). Revisa si
  hay más.
- Al entrar, se lee el sello (ya con la regla B). Si trae el de nuestro centro, se pregunta
  **«¿De qué documento es el registro?»**, con los documentos del asunto que siguen la norma de
  nombres, más la opción **«Es un documento nuevo»**.
  - Si elige uno: lo mismo que `RegistroSellado.asociar` (el sellado toma el nombre con el número
    de registro, el original pasa a «… SIN SELLAR», nota de registro que sustituye a la anterior,
    se quita de pendientes de registro).
  - Si es un documento nuevo: se nombra con el número de registro ya puesto (formulario con
    «Hay registro» marcado y los campos rellenos con el sello).
- Una sola máquina para todos los caminos: reutiliza `js/registro-sellado.js`, no copies la
  lógica en cada sitio.
- Si el asunto no tiene documentos con los que asociar, se salta la pregunta y va directo a
  «documento nuevo».
- En el formulario de añadir, si el PDF trae sello del centro, rellena y marca el registro solo,
  sin que Francisco lo teclee.

## Comprobación

- Pruebas nuevas (o ampliadas en `pruebas/registro-sin-duplicar.mjs`): un texto con dos sellos
  (otro centro en salida + el nuestro en entrada) devuelve el nuestro; uno solo con sello ajeno
  devuelve `null`; sin código configurado, el primero.
- Prueba de pantalla: el bloque «Documentos de la carpeta» tiene «Añadir documento» y el menú ⋮
  tiene «Poner nombre» el primero; ningún camino enseña ya la lista del cuadro.
- Batería completa en verde. Actualiza contexto e historia según las reglas de la cola.

## Qué verá Francisco

- En la ficha, un solo sitio para los documentos, con «Añadir documento» arriba y «Poner nombre»
  en el menú ⋮.
- Añada como añada un papel sellado, la aplicación le pregunta de qué documento es y lo coloca.
- Si el papel trae el sello del emisor y el nuestro, se usa el nuestro.
