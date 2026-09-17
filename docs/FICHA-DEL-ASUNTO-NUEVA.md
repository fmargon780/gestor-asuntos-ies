# La ficha del asunto, colocada de otra manera

Acordado con Francisco el 17-sep-2026, en la misma conversación que
`docs/FILAS-QUE-NO-SE-ESTRUJAN.md`. Va **después** de esa fila.

**Sube directamente a `main`, sin abrir ninguna pull request.** Cambios quirúrgicos: no
reescribas ficheros enteros, no leas el repositorio entero, y pasa la batería de pruebas **una
sola vez, al final**.

## 1. La disposición nueva

Hoy la ficha es: izquierda hitos y notas; derecha documentos, otros asuntos, y datos y
contacto. Pasa a ser:

    IZQUIERDA (lo que se trabaja)      DERECHA (lo que se consulta y se anota)
      1. Hitos                           1. Datos y contacto   ← la primera
      2. Documentos de la carpeta        2. Otros asuntos
                                         3. Notas del asunto

El porqué: los documentos llevan botones y necesitan la columna ancha; las notas del asunto se
usan poco desde que casi todo se escribe como nota de un hito, así que se van a la derecha.

En `css/ficha-asunto.css`, la izquierda se queda algo más ancha que ahora:
`grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr)`.

Con el panel de la derecha abierto (`body.con-visor` o `body.con-lector`) o por debajo de 1000
píxeles, una sola columna, en este orden: Hitos, Documentos, Datos y contacto, Otros asuntos,
Notas.

## 2. Las notas, al estilo del tablón

En la derecha, el bloque de notas pasa a ser una caja de escribir directa, como el tablón: se
escribe encima y se guarda solo, sin tener que pulsar antes "Añadir nota".

**Trampa conocida (filas 33 y 34 de la cola):** un bloque que se repinta solo no puede tirar lo
que se está escribiendo. Ese `textarea` va envuelto en `U.conservandoLoEscrito(raiz, fn)`, como
ya hace `pintarNotas()`. Y el guardado automático usa `U.mientrasGuarda` (fila 23), con un
retardo de aproximadamente un segundo desde la última tecla, nunca una escritura por pulsación.

## 3. "Datos y contacto", en una línea

El bloque deja de ser una tabla de filas y pasa a ser **una sola línea**:

    Pérez Ruiz, Ana · 2º ESO B · 15 años · Madre: 612 34 56 78 ⧉ · DNI 12345678Z ⧉   [ Ver todo ]

Reglas de esa línea, para alumnado:

- El nombre, tal cual.
- El grupo de este curso, o una **etiqueta de estado** en su lugar (punto 3.1).
- La **edad actual**, calculada con `U.edadDesde(alumno.fechaNac)`. Si no hay fecha de
  nacimiento, ese trozo no sale.
- **Un solo teléfono.** Si el alumno es menor de edad, el del primer tutor legal, etiquetado con
  su relación ("Tutor legal 1:" mientras Séneca no dé el parentesco de verdad; ver la nota de la
  fila 28). Si es mayor de edad, el suyo.
- El DNI, con el aviso de `js/dni.js` si falta y tocaría tenerlo. Eso no cambia.
- El teléfono y el correo del propio alumno **bajan a la ventana**: son secundarios.

Para personal, empresas y otros, la misma línea con lo suyo: nombre, puesto o razón social,
teléfono, y documento o NIF.

Cada dato de la línea se copia pulsándolo, con `js/copiar.js`, que ya sabe hacerlo.

### 3.1 Las etiquetas de estado

Van en el sitio del grupo, con color:

| Caso | Etiqueta | Color | Debajo, en pequeño |
|---|---|---|---|
| Matriculado este curso | (ninguna: sale el grupo) | — | — |
| No matriculado este curso | `NO MATRICULADO 26-27` | ámbar | `última matrícula: 25-26 · 4º ESO A` |
| Solicitante | `SOLICITANTE` | azul | — |
| Personal que ya no está | `YA NO ESTÁ` | ámbar | `último curso aquí: 25-26` |

Los datos ya existen: `alumno.matriculado`, `alumno.solicitante`, `alumno.anoUltima`,
`alumno.cursoUltima`, `alumno.unidadUltima`, `persona.enElCentro`, `persona.cursoUltimo`. Usa
los colores que ya hay en `css/estilos.css` (`--ambar`, `--ambar-linea`, `--azul`,
`--azul-claro`), sin inventar tonos nuevos.

## 4. La ventana "Ver todo"

Se abre con `U.preguntar` (un solo cuadro a la vez, regla de siempre), ancha, con un solo botón
de cerrar. Dentro, sin scroll cuando quepa, a dos columnas si hay sitio:

1. **Identificación** — nombre, DNI, Nº de identificación escolar, fecha de nacimiento, edad.
2. **Matrícula y grupo** — curso, unidad, estado de la matrícula, última matrícula si no está.
3. **Contacto del alumno** — sus teléfonos y correos.
4. **Tutores legales** — una tarjeta por tutor (punto 4.1).
5. **Otros datos de la familia** — lo de familia que no se haya podido asignar a un tutor.
6. **Todo lo que trae Séneca** — plegado, el volcado de siempre (`resto` de
   `Datos.destacadosAlumno`).

Para personal, empresas y otros: Identificación, Situación en el centro, Contacto, y el volcado
plegado.

### 4.1 Los tutores, agrupados por persona

Esto es lo que hoy no está: `Datos.destacadosAlumno` vuelca cada columna de Séneca que case con
`/tutor|padre|madre|responsable|familia/` como una fila suelta, con el título tal cual y los
datos de los dos tutores mezclados.

Función nueva en `js/datos.js`:

    Datos.tutoresDe(alumno)   ->   [ { numero, nombre, relacion, telefonos[], correos[], documento, otros[] }, ... ]

Cómo agrupa, leyendo **el título de cada columna**, normalizado con `U.normalizar`:

- El número sale de `1`/`2`, o de `primer`/`segundo`/`primero`/`segunda`, aparezca donde
  aparezca en el título (`Tutor1 - Teléfono`, `Primer tutor: correo`, `Tutor 2 Móvil`...).
- La clase de dato sale de la otra mitad del título: `nombre`/`apellidos` → nombre;
  `telefono`/`movil` → teléfonos; `correo`/`email` → correos; `dni`/`documento`/`nif` →
  documento; `relacion`/`parentesco` → relación. Lo que no case va a `otros`.
- Una columna de familia **sin número reconocible** no se pierde: sale en "Otros datos de la
  familia".
- Las tarjetas van ordenadas por número, y solo salen las que tengan algo.

Cada tarjeta enseña nombre, relación, teléfonos y correos, cada dato con su copiar, y un botón
**Escribirle** que abre el cuadro de Correo de siempre con ese destinatario puesto
(`js/correo.js`; si eso pide más de tres líneas de enganche, deja el botón solo donde ya haya
correo y dilo en la fila de la cola).

`Datos.destacadosAlumno` se queda como está para lo demás: no la rompas, que la usan la pantalla
de Personas y `js/asuntos-nuevo.js`.

## 5. Ficheros que hay que tocar

- `js/datos.js` — `Datos.tutoresDe` y `Datos.resumenDeTercero` (la línea del punto 3), las dos
  puras y probables sin navegador.
- `js/ficha-tercero.js` (nuevo) — la línea resumen y la ventana "Ver todo". `js/ficha-asunto.js`
  ya anda por las 1.100 líneas: **no lo engordes**, que se hablen por
  `window.FichaTercero.pintarLinea(caja, tercero)` igual que `window.FichaDocumentos.pintar`.
- `css/ficha-tercero.css` (nuevo) y `css/ficha-asunto.css` (el orden de las columnas).
- `js/ficha-asunto.js` — solo el orden de los bloques y la llamada a `FichaTercero`.
- `js/notas.js` — la caja de escribir directa.
- `index.html` — los dos ficheros nuevos, en su sitio del orden de `<script>`.
- `pruebas/ficha-tercero.mjs` (nuevo).

## 6. La prueba

`pruebas/ficha-tercero.mjs`, sin navegador (jsdom), con estos escenarios:

1. `tutoresDe` con títulos al estilo `Tutor1 - ...` / `Tutor 2 ...`: dos tarjetas, cada dato en
   la suya.
2. Lo mismo con `Primer tutor` / `Segundo tutor`.
3. Una columna de familia sin número: no se pierde, cae en "otros".
4. Un alumno sin tutores: ninguna tarjeta, y la ventana no se rompe.
5. `resumenDeTercero` de un menor: el teléfono es el del primer tutor.
6. `resumenDeTercero` de un mayor de edad: el teléfono es el suyo.
7. Alumno no matriculado: etiqueta ámbar y renglón de última matrícula.
8. Solicitante: etiqueta azul, sin renglón de última matrícula.

Y un escenario en `pruebas/hitos.mjs` o en la prueba de navegador que ya recorra la ficha: que
los bloques salen en el orden nuevo y que escribir en la nota del asunto no se pierde al
repintar.

## 7. Al terminar

Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, apunta
lo que merezca recordarse en `docs/HISTORIA.md`, marca la fila de `docs/COLA.md` como HECHA con
la versión publicada, y comprueba lo publicado con `curl`.
