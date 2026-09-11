# Terceros relacionados con un asunto

Instrucción para Claude Code. Diseño cerrado con Francisco el 11 de septiembre de 2026.
Lee antes `docs/CONTEXTO.md`.

---

## 1. El problema

Hoy un asunto tiene **un solo tercero**, y va al final del nombre de su carpeta. Al archivar,
la carpeta se mueve a `ARCHIVO/<CATEGORÍA>/<Tercero>/`.

Hay asuntos que se tramitan con un tercero pero **afectan a otras personas**.

El caso real que lo destapó: el director manda a la sección de Recursos Humanos de la
Delegación Territorial la **propuesta de valoración del complemento de productividad** del PAS.

- El tercero con el que nos relacionamos es la Delegación Territorial. Va en el nombre.
- Pero el asunto afecta a **cada trabajador del PAS valorado**.
- Dentro de dos años, al mirar la carpeta de archivo de un trabajador, ese asunto **no aparece
  por ningún sitio**. Y es suyo.

Pasa igual con muchas gestiones: una compra que afecta a un departamento, una sanción que
afecta a un profesor además del alumno, un parte de accidente.

## 2. Qué hay que hacer, en una frase

Que un asunto pueda llevar apuntados **otros terceros relacionados**, y que al archivarlo quede
**rastro del asunto en la carpeta de archivo de cada uno**.

## 3. Las cuatro decisiones que ya están tomadas

**No las rediscutas. Están cerradas con Francisco.**

### 3.1 En la carpeta del relacionado se deja un marcador, NO una copia de los documentos

No se copian los ficheros del asunto. Se crea una **carpeta vacía con un aviso dentro**.

Por qué, y esto no se cambia:

- Copiar los documentos los duplica. Si mañana se corrige uno, quedan dos versiones distintas
  en dos sitios y nadie sabe cuál manda.
- En el caso real, el documento de la propuesta nombra a **todo el PAS**. Dejarle a cada
  trabajador una copia entera reparte información de sus compañeros.

### 3.2 Los relacionados se eligen en la ficha del asunto, en cualquier momento

Y al archivar se enseñan **ya marcados**, para confirmar o añadir alguno más. No es un paso
nuevo obligatorio: si no hay ninguno, archivar sigue siendo un clic.

### 3.3 La carpeta marcador se llama igual que el asunto, con `(RELACIONADO)` al final

    260911 PRODUCTIVIDAD Delegación Territorial Málaga (RELACIONADO)

El sufijo al final, no delante: así el nombre sigue empezando por la fecha y la carpeta queda
ordenada por orden cronológico entre los asuntos propios del trabajador. Y se distingue a
simple vista, para que nadie meta documentos ahí dentro.

### 3.4 Al reabrir un asunto, sus marcadores se quitan

Y se vuelven a crear cuando se archive otra vez. El marcador dice dónde está la carpeta del
asunto; si el asunto se reabre esa dirección deja de ser cierta y el aviso engañaría.

Borrar el marcador no pierde nada: dentro solo hay un aviso escrito por la aplicación, y la
relación sigue guardada en la ficha del asunto.

---

## 4. Lo que hay que construir

### 4.1 Dónde se guarda la relación

En `_GESTOR/asuntos.json`, en la ficha del asunto, un campo nuevo:

```json
"relacionados": [
  { "categoria": "PERSONAL", "nombre": "Ruiz Ortega, Marta 4412H" },
  { "categoria": "PERSONAL", "nombre": "Lara Vega, Antonio 9087B" }
]
```

- El `nombre` se guarda **ya montado con las reglas de la sección 4 de CONTEXTO.md**, igual que
  el tercero principal: es el nombre de su carpeta en el ARCHIVO.
- Una ficha sin el campo es una ficha sin relacionados. **Los asuntos que ya existen no hay que
  tocarlos ni migrarlos.**
- Relee `asuntos.json` antes de escribirlo, como se hace ya. Son dos ordenadores.

### 4.2 El bloque nuevo en la ficha del asunto

En la pantalla de un asunto (`js/ficha-asunto.js`), un bloque más: **Personas y entidades
relacionadas**.

- Lista de los que haya, cada uno con su categoría delante y un botón para quitarlo.
- Botón **Añadir relacionado**.
- El botón abre el **buscador de terceros que ya existe** en `js/asuntos-nuevo.js`, el mismo de
  crear un asunto. Busca en **las cuatro categorías**: ALUMNADO, PERSONAL, EMPRESAS y OTROS.
- Si el relacionado **no está dado de alta**, se da de alta ahí mismo, con
  `App.cuadroDeTercero`. **No se le manda a Ajustes ni a otra pantalla.**
- **El tercero principal del asunto no puede añadirse como relacionado.** Si se intenta, se dice
  y no se añade.
- **Nadie puede estar dos veces.** Misma comparación de nombres parecidos que ya usa la
  aplicación (`U.parecidos` / `U.dejaCrear` en `js/util.js`): no la copies, llámala.
- Este bloque funciona **en cualquier momento**, con el asunto abierto. No hace falta archivar.

**Que no salga en la tarjeta de la lista.** La tarjeta se queda como está. Recuerda la lista
blanca `BOTONES_DE_LA_TARJETA` de `js/ficha-asunto.js`.

### 4.3 Al archivar

Localiza la función que archiva un asunto (el botón **Archivar** de la tarjeta y de la ficha).

- Si el asunto **no tiene relacionados**, archivar funciona exactamente como hoy. Sin cuadros
  nuevos, sin preguntas.
- Si **sí los tiene**, antes de mover la carpeta sale un cuadro con la lista, **todos marcados**,
  y un botón para añadir alguno más con el mismo buscador de 4.2. Botones: Archivar y Cancelar.
- Se archiva como siempre: la carpeta se mueve al ARCHIVO del tercero principal. **Eso no cambia.**
- Y después, **por cada relacionado marcado**, se crea su carpeta marcador.

### 4.4 La carpeta marcador

Ruta: `ARCHIVO/<CATEGORÍA DEL RELACIONADO>/<Nombre del relacionado>/<nombre del asunto> (RELACIONADO)/`

Si la carpeta del relacionado no existe todavía en el ARCHIVO, **se crea**, igual que se hace
con el tercero principal.

Dentro, **un solo fichero**: `DONDE ESTA ESTE ASUNTO.txt`, con este contenido:

```
Este asunto no está guardado aquí. Aquí solo queda constancia de que le afecta.

Asunto:             260911 PRODUCTIVIDAD Delegación Territorial Málaga
Tercero principal:  Delegación Territorial Málaga  (OTROS)
Está guardado en:   ARCHIVO/OTROS/Delegación Territorial Málaga/260911 PRODUCTIVIDAD Delegación Territorial Málaga

Aparece aquí porque:  Ruiz Ortega, Marta 4412H  es una de las personas a las que afecta.

Archivado el 11/09/2026 por Francisco.

Escrito por el Gestor de Asuntos. No borres ni cambies esta carpeta a mano:
la aplicación la quita sola si el asunto se reabre.
```

Sin tildes en el **nombre** del fichero, por si algún sistema se atraganta; el texto de dentro
va con sus tildes.

### 4.5 Al reabrir

En `App.reabrirAsunto`: antes o después de devolver la carpeta a los asuntos abiertos, **borrar
la carpeta marcador de cada relacionado**.

- Borrar solo si dentro está **únicamente** `DONDE ESTA ESTE ASUNTO.txt` y nada más. Si alguien
  ha metido algo, **no se borra**: se deja y se avisa en pantalla de cuál es.
- La lista de relacionados **se queda en la ficha**. No se borra. Al volver a archivar, los
  marcadores se crean otra vez.

### 4.6 Al quitar un relacionado de un asunto ya archivado

Si se quita a alguien de la lista y el asunto está archivado, hay que **borrar su marcador**,
con la misma cautela de 4.5.

### 4.7 En la ficha del tercero

En la pantalla **Personas y empresas** / ARCHIVO (`js/archivo-personas.js`), debajo de los
asuntos propios del tercero, un apartado aparte:

**Asuntos en los que aparece como relacionado**

- Sale solo si hay alguno.
- Cada línea dice el nombre del asunto y, en pequeño, **el tercero principal**.
- Se calcula recorriendo `asuntos.json`, no leyendo carpetas: así salen también **los asuntos
  todavía abiertos**, que aún no tienen marcador en ninguna parte.
- Al pulsar, se entra en la ficha de ese asunto si sigue abierto.

### 4.8 Cuando cambian los datos de un tercero

`js/archivo-personas.js` ya avisa de que las carpetas de sus asuntos viejos conservan el nombre
antiguo. **No hay que renombrar marcadores ni fichas.** Mismo criterio de siempre: el nombre
archivado es el rastro de aquel día.

---

## 5. Lo que NO hay que hacer

- **No copiar los documentos del asunto.** Ver 3.1.
- **No meter a los relacionados en el nombre de la carpeta del asunto.** Manda el tercero
  principal, y solo él. Los relacionados cambian mientras se tramita.
- **No crear un tipo de asunto nuevo ni una categoría nueva.**
- **No tocar los asuntos que ya existen.** Sin relacionados se comportan exactamente igual.
- **No añadir un botón a la tarjeta de la lista.**

---

## 6. Cómo hay que comprobarlo

Prueba nueva, `pruebas/relacionados.mjs`, con el disco de mentira de las demás pruebas:

1. Un asunto sin relacionados se archiva igual que antes, y **no aparece ninguna carpeta nueva**
   en ningún sitio.
2. Se añaden dos relacionados de PERSONAL desde la ficha; se guardan en `asuntos.json`.
3. El tercero principal no se deja añadir como relacionado.
4. El mismo relacionado no se deja añadir dos veces, ni escrito de otra manera.
5. Al archivar se crean las dos carpetas `… (RELACIONADO)`, cada una con su
   `DONDE ESTA ESTE ASUNTO.txt` dentro, y con la ruta correcta escrita en el texto.
6. Se crea también la carpeta del relacionado en el ARCHIVO si no existía.
7. Al reabrir, las dos carpetas marcador desaparecen, y la lista de relacionados sigue en la
   ficha.
8. Un marcador con un fichero extra dentro **no se borra** al reabrir, y se avisa.
9. La ficha del tercero enseña el asunto en el apartado de relacionados, estando el asunto
   abierto y estando archivado.

Y además:

- `grep` por todos los `js/` antes de colgar una función nueva de `App`: que el nombre no esté
  cogido. Pasó con `App.elegirTipo` el 10-sep-2026.
- Las pruebas que ya hay tienen que seguir en verde.
- Una foto con Playwright del bloque nuevo de la ficha, a 1905 píxeles.

---

## 7. Al terminar

- Sube `App.VERSION` con la fecha y la hora de España.
- Apunta la funcionalidad en `docs/CONTEXTO.md`: en la sección 5, entre las decisiones de diseño
  ya aprobadas, y la línea del fichero nuevo en la tabla de ficheros.
- Comprueba que Vercel ha publicado de verdad, con `curl` y `?v=`, fichero por fichero de los
  que hayas tocado.
- Marca esta instrucción como **HECHA** en `docs/COLA.md`.
