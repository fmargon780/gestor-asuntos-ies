# Fila 93 — no salir del asunto salvo cuando el usuario lo pide

23-sep-2026. Acordado con Francisco en la conversación del 23-sep-2026 (14:00).

## 1. El síntoma

Al asociar un documento a un asunto, la aplicación devuelve a Francisco a la lista de asuntos
abiertos. Pierde el sitio y tiene que volver a entrar.

La fila 30 (`docs/QUEDARSE-EN-EL-ASUNTO.md`) ya arregló esto para guardar un documento, pero
quedaron caminos sueltos.

## 2. La regla

**De la ficha de un asunto solo se sale en cuatro casos:**

1. Francisco pulsa «Volver» o Escape.
2. Edita el asunto (cambia el nombre de la carpeta).
3. Lo archiva o lo reabre.
4. Lo borra.

Y uno más, que no es una acción suya: el asunto ha dejado de estar abierto desde el otro
ordenador. Entonces sí se vuelve a la lista, con un aviso de una línea, como ya hace
`App.reengancharFicha()`.

Cualquier otra cosa —asociar un documento a un asunto o a un hito, meter un documento suelto,
registrar, generar un documento de plantilla, separar o unir un PDF, marcar un hito, comunicar—
**deja a Francisco donde estaba**, con la ficha repintada en su sitio.

## 3. Lo que hay que hacer

1. Buscar en todo `js/` cada salida de la ficha: `volverALaLista`, `App.ir('abiertos')`,
   `App.ir(` hacia otra pantalla, y cualquier sitio que oculte `#pantalla-asunto`.
2. Dejar solo las cuatro de la regla. Las demás se sustituyen por `App.verAbiertos()` +
   `App.reengancharFicha()`, que es el camino que ya funciona.
3. Mirar con lupa, porque son los que Francisco ha notado: asociar un documento a un hito
   (`js/hitos-documentos.js`, `js/ficha-documentos.js`, «Asociar a un hito»), «Meter en un
   asunto» y «Meter aquí» de Por clasificar (`js/documentos-sueltos.js`,
   `js/documentos-sueltos-sugerencias.js`) cuando el asunto de destino es **el que ya está
   abierto en la ficha**, y el cuadro «Documentos ▾» (`js/documentos.js`).
4. Al terminar, dejar la lista completa de caminos revisados en
   `docs/contexto/ASUNTOS.md`, sustituyendo la línea vieja de la fila 30.

## 4. Cómo se comprueba

`pruebas/quedarse-en-el-asunto.mjs`, ampliada: un caso por cada camino de la lista, comprobando
que `#pantalla-asunto` sigue visible después de la acción, y los cuatro casos en los que sí se
sale.

Sube a `main` sin abrir ninguna petición de cambios.
