# Las opciones de cada documento, en un solo sitio (fila 168)

Acordado con Francisco el 25-sep-2026. Diseño cerrado con su «sí».

## El problema

En la ficha del asunto, el bloque «Documentos de la carpeta» tiene las opciones de un documento
repartidas en dos sitios:

- En la propia fila del documento: «Registrar» (si falta), «Asociar a un hito» y el menú ⋮
  (Copiar, Separar, Unir, Sacar páginas, Ajustar tamaño, Repartir entre terceros, Pasar a
  versiones previas, Borrar).
- En el botón «Documentos ▾» del título, que abre la ventana de `App.verDocumentos`
  (`js/documentos.js`) con «Copiar nombre», «Poner nombre», «Borrar» y «Añadir documento».

Francisco quiere todo en la fila, sin ventana aparte, y sin llenar la fila de botones.

## Cómo queda (ficha del asunto, `js/ficha-documentos.js`)

1. **Título del bloque:** «Documentos de la carpeta», la cuenta y, al lado, un botón principal
   **«+ Añadir documento»**. Hace lo mismo que el «Añadir documento» de la ventana de hoy
   (mismo cuadro, mismos campos). El botón «Documentos ▾» desaparece de la ficha.
2. **Cada fila, de izquierda a derecha:**
   - marca de la extensión y nombre (pulsar el nombre sigue abriéndolo en el visor, como hoy);
   - justo detrás del nombre, un **botón pequeño ⧉** que copia el nombre **sin la extensión**
     (lo mismo que hoy hace «Copiar» de `js/copiar.js`, con su aviso). Título: «Copiar el
     nombre, sin la extensión». «Copiar» sale del menú ⋮;
   - la descripción o el hito, como hoy;
   - «Sin registrar» + **«Registrar»**, igual que hoy: solo en los documentos sin registro;
   - **«Poner nombre»**, siempre visible (es de lo que más se usa). Hace lo mismo que el
     «Poner nombre» de la ventana de hoy, para ese documento, y al terminar repinta la lista;
   - «Asociar a un hito», como hoy;
   - menú ⋮ con **solo dos cosas**: «Pasar a versiones previas» y «Borrar» (el último, en rojo,
     con la papelera de siempre).
3. **Las herramientas de PDF pasan al visor.** Separar, Unir, Sacar páginas, Ajustar tamaño y
   Repartir entre terceros salen del menú ⋮ y se ponen en **una barra encima del documento**, en
   el visor de la derecha (`window.Visor`), cuando se abre un PDF de la carpeta de un asunto.
   Mismas condiciones que hoy (solo PDF; «Repartir» solo si `Repartir.puede(a)`; «Ajustar
   tamaño» solo si existe `PrepararDocumento`). Al terminar cualquiera de ellas, se repinta la
   lista de documentos de la ficha, como hoy. Si el documento abierto no es PDF, o el visor se
   abre desde otro sitio (bandeja, «Por clasificar»…), la barra no sale.

Maquetas acordadas: `documentos-propuesta.png` y `visor-propuesta.png` (en la conversación del
25-sep-2026); lo de arriba es lo que cuenta.

## Lo que no cambia

- La ventana de `App.verDocumentos` **se queda**: la usan también la tarjeta de la lista de
  asuntos, «Por clasificar» y «Nuevo asunto». Solo se quita el botón que la abría desde la ficha.
- El índice del expediente sigue sin «Registrar» ni «Asociar a un hito»; tampoco lleva «Poner
  nombre» ni «Borrar» si hoy no los tiene.
- «Versiones previas» plegadas, como hoy.
- El nombre del documento nunca se estruja (fila 36): si falta sitio, se parte en dos líneas,
  como ahora; los botones no.
- Si la mesa del hito (`js/hito-mesa*.js`) enseña documentos con su propio menú, comprobar que
  sigue funcionando; no hace falta cambiarla en esta fila.

## Pruebas

- Una fila de documento sin registro enseña ⧉, «Registrar», «Poner nombre», «Asociar a un hito»
  y ⋮ con solo dos entradas.
- ⧉ copia el nombre sin extensión.
- «Poner nombre» renombra el fichero y repinta.
- «+ Añadir documento» está en el título y abre el cuadro de añadir.
- No queda «Documentos ▾» en la ficha.
- Abrir un PDF del asunto en el visor enseña la barra de herramientas; abrir un no-PDF, no.
- `npm test` entero en verde.
