# Fila 74 — Cuentas por tipo, para la memoria de fin de curso

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 4, punto 4. Estaba ya apuntado en
`docs/CONTEXTO-CORTO.md`, en "Qué falta".

**Esto llega en junio, y llega de golpe.** Conviene tenerlo hecho antes, no en junio.

---

## 1. Qué pasa hoy

No hay forma de contestar a "cuántos certificados de matrícula hemos hecho este curso". Habría que
ir contando carpetas a mano.

Y esa es exactamente la pregunta que se hace al escribir la memoria de fin de curso.

## 2. Qué hay que hacer

Una pantalla nueva, **"Cuentas"**, con su botón en la barra de siempre.

### 2.1 Lo que enseña

Una tabla, con un desplegable arriba para elegir el curso académico (26-27, 25-26…, sacado de los
nombres de las carpetas):

| Categoría | Tipo de asunto | Cuántos | Abiertos | Archivados |
|---|---|---|---|---|

Ordenada por categoría y, dentro, de más a menos. Con el total abajo.

Y debajo, tres cuentas más que cuestan poco y sirven para la memoria:

- **Por mes**: cuántos asuntos se abrieron cada mes del curso. Sale de la fecha del nombre de la
  carpeta.
- **Por quién lo pidió**: cuántos vienen de familia, de alumnado, del propio centro, de una empresa.
  Sale de `ficha.loPide`.
- **Cuánto se tarda**: de los archivados, los días entre abrir y archivar. La media y el que más
  tardó. Sale de `abiertoEl` y `cerradoEl`.

### 2.2 De dónde salen los números

De sitios que ya existen. **No hay que recorrer el disco.**

- Los **archivados**, del índice del ARCHIVO (`_GESTOR/indice-archivo.json`), que ya guarda
  categoría, tipo, curso y grupo de cada uno.
- Los **abiertos**, de la lista en memoria y de `asuntos.json`.
- Si el índice no está hecho, decirlo y ofrecer el botón de reconstruirlo, en vez de dar números a
  medias.

Las cuentas de "quién lo pidió" y "cuánto se tarda" necesitan la ficha. Para los abiertos está en
memoria. Para los archivados, hoy también (están en `asuntos.json`); **después de la fila 64
ya no**, así que esas dos cuentas necesitarían que el índice guarde `loPide`, `abiertoEl` y
`cerradoEl`. Es poco y son campos cortos: si la 64 va antes, se añaden ahí.

### 2.3 Sacarlo en un papel

Un botón **"Copiar la tabla"** que deje las cuentas en el portapapeles en texto separado por
tabuladores, listo para pegar en un documento o en una hoja de cálculo. Eso es lo que se necesita
para la memoria, y cuesta nada.

No hace falta generar un PDF ni un Word. Si algún día lo pide, se hace.

## 3. Cómo se comprueba

Prueba nueva, `pruebas/cuentas.mjs`, sin navegador:

1. Con un índice y un registro conocidos, las cuentas por tipo salen exactas.
2. El desplegable de curso enseña solo los cursos que de verdad hay.
3. Un asunto sin tipo reconocible se cuenta aparte, en una fila "Sin clasificar", y no se pierde: la
   suma de la tabla tiene que dar el total.
4. Sin índice hecho, sale el aviso y no números a medias.
5. "Copiar la tabla" deja el texto con tantas líneas como filas.

## 4. Qué NO hay que hacer

- **No** recorrer el ARCHIVO para contar. Para eso está el índice.
- **No** hacer gráficos. Una tabla que se pueda pegar vale más para una memoria.
- **No** inventar una cuenta "por estado": el estado cambia mientras se tramita y no significa nada a
  final de curso.

## 5. Cuándo

**Antes de junio de 2027.** Mejor después de la fila 64, para que el índice ya lleve los campos que
hacen falta.

## 6. Cuánto es

Dos días.
