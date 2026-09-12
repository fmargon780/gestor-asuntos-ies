# Instrucción: repartir el contexto en tres documentos

Acordado con Francisco el 12 de septiembre de 2026.

**No se toca nada de código en esta instrucción. Solo documentos.**

## El problema

`docs/CONTEXTO.md` es un diario: cada día se le añade lo nuevo debajo y nunca se borra lo que
quedó superado. Ha crecido tanto que leerlo entero, en cada conversación y en cada sesión de
Claude Code, se ha convertido en el mayor gasto de cuota del proyecto.

`docs/COLA.md` tiene el mismo problema: las notas de las filas HECHAS ocupan párrafos enteros
y se leen en cada arranque.

## Lo que hay que hacer

### 1. `docs/CONTEXTO-CORTO.md` (nuevo)

Para **decidir**. Es el que se lee siempre, en toda conversación. **Máximo 160 líneas.**
Se escribe a partir de lo que ya hay en `docs/CONTEXTO.md`, con estas secciones y nada más:

1. Lo básico: dirección publicada, repositorio, un solo proyecto de Vercel.
2. Quién es Francisco y cómo hay que escribirle.
3. Qué es la aplicación y qué no es.
4. Las reglas de nombres: carpeta de asunto, cómo se escribe cada tercero, nombre de documento,
   número de registro de Séneca, y qué no va en el nombre.
5. Qué está hecho: **una línea por cosa**, sin detalle de implementación.
6. Las reglas de código que no se pueden olvidar (las de la sección 6 de `CONTEXTO.md`,
   resumidas en una línea cada una).
7. Descartado, no volver a proponerlo: la lista, una línea cada uno.
8. Qué falta.
9. Cuándo hay que leer `CONTEXTO.md` entero.

Nada de fechas de cuándo se hizo cada cosa. Nada de "un tropiezo del que aprender". Nada de
"antes se llamaba así". Todo eso va a `HISTORIA.md`.

### 2. `docs/CONTEXTO.md` (se reescribe)

Para **programar**. Solo lo que es verdad hoy:

- Las tablas: ficheros del repositorio, ficheros de `_GESTOR`, columnas de cada CSV, carpetas
  que se señalan en cada ordenador.
- Cómo funciona cada módulo por dentro, en presente. Sin la fecha en que se hizo.
- Las trampas técnicas y los avisos: el orden de los `<script>`, el cuadro de diálogo único,
  los nombres de `App` que no se pueden repetir, `p.campos` frente a la cabecera del CSV, y
  todos los demás "ojo con...".
- Cómo se publica y cómo se comprueba.
- Lo descartado.
- Qué falta.

Quita de aquí: los relatos con fecha, los "un tropiezo del que aprender" contados como
historia (la enseñanza se queda, en una línea, como aviso), los "antes esto se llamaba X",
y el porqué de decisiones ya tomadas.

### 3. `docs/HISTORIA.md` (nuevo)

El **diario**. Todo lo que salga de los dos anteriores entra aquí, sin perder una palabra, en
orden de fecha, de lo más nuevo a lo más viejo. Este documento casi nunca se lee: existe para
poder consultar por qué se hizo algo como se hizo.

**Comprueba que no se pierde nada**: cada párrafo que quites de `CONTEXTO.md` tiene que
aparecer en `HISTORIA.md`.

### 4. `docs/COLA.md` (se poda)

- Las notas de las filas **HECHAS** se dejan en **una sola línea** cada una: qué se hizo y la
  versión publicada. Todo el detalle largo que hoy tienen se traslada a `HISTORIA.md`.
- Las reglas de la cola se quedan como están, más las dos nuevas del punto 5.

### 5. La regla que faltaba, y que hay que escribir en los tres documentos

Al terminar cualquier instrucción de la cola, Claude Code tiene que:

- Actualizar `CONTEXTO-CORTO.md` y `CONTEXTO.md` **sustituyendo la línea vieja, no añadiendo
  una debajo**. Si algo deja de ser verdad, se borra.
- Añadir a `HISTORIA.md` lo que merezca recordarse, con su fecha.
- No dejar que `CONTEXTO-CORTO.md` pase de 160 líneas.

Escribe esta regla al principio de `CONTEXTO-CORTO.md`, en la sección 6 de `CONTEXTO.md` y en
las reglas de `COLA.md`.

## Cómo trabajar esta instrucción, para gastar poco

- Los únicos ficheros que hay que leer son `docs/CONTEXTO.md`, `docs/COLA.md` y
  `docs/AHORRO-CUOTA.md`. **No leas el código, ni las pruebas, ni el resto del repositorio.**
- Sube los cuatro documentos en **un solo commit**.
- **No hace falta ejecutar las pruebas**: no se toca código. Tampoco cambia `App.VERSION`.

## Al terminar

Un mensaje corto para Francisco: cuántas líneas tiene ahora cada documento, y confirmación de
que nada se ha perdido.
