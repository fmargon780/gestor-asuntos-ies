# Fila 108 — La ventana de contacto del alumno, en tarjetas

Cerrada con Francisco el 24-sep-2026. Es la ventana que se abre desde la ficha del tercero
(alumnado) con «Ver todo»: hoy tiene cinco columnas (Identificación, Matrícula y grupo, Contacto
del alumno, Tutores legales, Otros datos de la familia) y a Francisco le parece sosa y mal
agrupada.

## Qué está mal hoy (caso real)

Alumno con estas columnas de Séneca para la familia: `Primer apellido Primer tutor`,
`Segundo apellido Primer tutor`, `Nombre Primer tutor`, `Sexo Primer tutor`, y lo mismo con
`Segundo tutor`.

1. **El segundo tutor se mete en la tarjeta del primero.** `numeroDeTitulo` (`js/datos.js`) mira
   primero si el título lleva «primer» y devuelve 1. En `Primer apellido Segundo tutor` la palabra
   «primer» es del apellido, no del tutor: la columna acaba en la tarjeta del tutor 1.
2. **El nombre del tutor sale a trozos.** `tutoresDe` se queda con la primera columna de
   nombre/apellido como título de la tarjeta («García») y cuelga las demás como líneas grises
   («Nombre Primer tutor: Isabel María», «Segundo apellido Primer tutor: Gallego»).
3. **El sexo sale como una línea más** («Sexo Primer tutor: M»).
4. **Lo repetido y lo vacío ocupan sitio**: el teléfono del alumno sale dos veces (Teléfono y
   Teléfono personal, mismo número) y «Otros datos de la familia» sale con «Nada que enseñar aquí».

## Lo que tiene que quedar

Modelo de referencia: el dibujo aprobado en la conversación del 24-sep-2026. Por escrito:

### Cabecera

- Círculo con las iniciales (nombre + primer apellido) y, al lado, el nombre en orden natural:
  **«Ángel Bonilla García»** (no «Bonilla García, Ángel»).
- Debajo, en gris: «13 años · nacido el 29/09/2012» («nacida» si Séneca dice que es mujer; si no
  se sabe, «nacimiento: 29/09/2012»).
- A la derecha, tres etiquetas de color: la **unidad** (3º ESO A, azul), el **estado de la
  matrícula** abreviado (verde si está matriculado; gris si no) y el **NIE** (Nº de identificación
  escolar, gris, con su botón de copiar).

### Tres tarjetas del mismo tamaño, en una fila

Cuadrícula de columnas iguales, a todo el ancho de la ventana. En pantalla estrecha pasan a una
debajo de otra. Una tarjeta por cada una de estas, solo si trae algo:

1. **El alumno** (título con icono, azul): teléfono, correo y DNI.
2. **Tutor 1** y 3. **Tutor 2** (un color cada uno, suave): círculo con iniciales, el **nombre
   completo como título** («Isabel María García Gallego») y debajo una etiqueta pequeña:
   «Tutora 1» si el sexo es M/Mujer, «Tutor 1» si es H/V/Hombre/Varón, «Tutor legal 1» si no se
   sabe. **No poner «Madre»/«Padre»**: el sexo no dice el parentesco. Si Séneca trae una columna de
   relación o parentesco, esa manda y sustituye a la etiqueta.

Dentro de las tres, siempre el mismo orden, una línea por dato, cada una con icono a la izquierda
y botón de copiar: **teléfono(s)**, **correo(s)**, **DNI** (con la palabra «DNI» en gris a la
derecha). Los teléfonos se enseñan en grupos de tres (655 645 995) pero se copian sin espacios.

- Si el alumno tiene el mismo teléfono en dos columnas, sale **una sola vez**.
- Si el teléfono (o el correo) del alumno coincide con el de un tutor, al lado sale en gris
  «mismo que la tutora 1» / «mismo que el tutor 2» (con la etiqueta que lleve esa tarjeta).
- Si falta un tutor, su tarjeta no sale y las demás se reparten el ancho.

### Lo que se quita

- Las columnas «Identificación» y «Matrícula y grupo»: sus datos pasan a la cabecera (nombre,
  edad, fecha, NIE, unidad, estado) y a la tarjeta del alumno (DNI). El «Curso» (3º de E.S.O.)
  sobra: la unidad ya lo dice.
- El sexo de los tutores como línea suelta (ya se usa para la etiqueta).
- «Otros datos de la familia» cuando está vacío. Si trae algo, sale como una cuarta tarjeta gris
  con título «Otros datos de la familia».
- Cualquier dato de un tutor que ya se ha usado para montar su nombre.

### Abajo

- A la izquierda, dos botones:
  - **«Correo a la familia»**: abre el cuadro de Correo de siempre con los correos de los dos
    tutores ya puestos como destinatarios. La aplicación nunca envía nada. Si no hay ningún
    correo de tutor, el botón no sale.
  - **«Copiar todo el contacto»**: copia en texto plano, una línea por persona:
    `Ángel Bonilla García (3º ESO A) · 655645995 · abongar2909@g.educaand.es`, y lo mismo por cada
    tutor con su etiqueta delante (`Tutora 1: Isabel María García Gallego · ...`).
- A la derecha, el desplegable «Todo lo que trae Séneca», igual que hoy.
- El botón «Cerrar», igual que hoy.

## Cómo montar el nombre del tutor (el arreglo de fondo)

En `Datos.tutoresDe`:

1. **El número del tutor es el que va pegado a la palabra «tutor/tutora»**, no el primer ordinal
   del título: buscar primero `(primer|segund)\w*\s+tutor` o `tutor\w*\s*(\d)`; solo si no hay nada
   pegado a «tutor», caer en la regla de hoy.
2. Separar por clase: `nombre` (el título dice «nombre»), `apellido1` («primer apellido»),
   `apellido2` («segundo apellido»), `sexo` («sexo»), además de las que ya hay.
3. El nombre completo es `nombre + apellido1 + apellido2`, separados por un espacio y sin huecos
   dobles si falta alguno. Si Séneca trae una sola columna con el nombre ya entero, se usa tal
   cual; si viene como «Apellidos, Nombre», se le da la vuelta.
4. Devolver además `sexo` (normalizado a `M`, `H` o vacío) e `iniciales`. **No cambiar la forma
   del objeto que ya se devuelve**: solo añadir campos. Hoy `tutoresDe` solo se usa en `js/ficha-tercero.js` y
   dentro de `js/datos.js` (el teléfono de la línea resumen, «Tutor legal N»): comprobar con un
   `grep` que sigue siendo así y que ninguno se rompe.

## Ficheros que hay que tocar

- `js/datos.js` (1.104 líneas: pasa de 400). **Sacar el bloque de los tutores** (`numeroDeTitulo`,
  `claseDeTitulo`, `tutoresDe`) a un fichero nuevo `js/datos-tutores.js` que siga publicando
  `Datos.tutoresDe`, y hacer ahí el arreglo. En `datos.js`, solo quitar el bloque y llamar a
  `Datos.tutoresDe` donde hoy se llama a `tutoresDe` a secas. Cargarlo en `index.html` justo
  después de `datos.js`.
- `js/ficha-tercero.js`: reescribir `ventanaAlumnado` y `tarjetaTutor` (y lo que necesiten) para
  la cabecera, las tarjetas y los dos botones. `ventanaPersonal` y `ventanaGenerica` no se tocan.
- `css/ficha-tercero.css`: los estilos nuevos (cabecera, etiquetas, cuadrícula de tarjetas,
  círculos de iniciales). Colores suaves con texto oscuro del mismo tono; sin sombras.
- `index.html`: la línea del `<script>` nuevo.
- `pruebas/ficha-tercero.mjs`: ampliar (ver abajo).
- `docs/contexto/PERSONAS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/CONTEXTO-CORTO.md`, `docs/HISTORIA.md`, `docs/COLA.md`, `js/version.js`.

## Cómo trabajar

- **No leas el repositorio entero.** Con `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md` y los
  ficheros de arriba basta.
- **Cambios quirúrgicos**: no reescribir ficheros enteros que no lo pidan.
- **Sube directamente a `main`, sin abrir ninguna pull request** (si la sesión no puede, las
  reglas de `docs/COLA.md` sobre fusionar solo).
- **Una sola prueba al final**, no una comprobación después de cada cambio:
  - En `pruebas/ficha-tercero.mjs`, un alumno con las ocho columnas de tutores del caso real de
    arriba. Tiene que salir: dos tarjetas, «Isabel María García Gallego» con «Tutora 1» y «Jesús
    Bonilla Fernández» con «Tutor 2»; ninguna línea «Sexo…» ni «Primer apellido Segundo tutor…»;
    el teléfono del alumno una sola vez con «mismo que la tutora 1»; sin «Otros datos de la
    familia». Comprobar que la prueba **falla** con el código de hoy antes de darla por buena.
  - Una foto con Playwright a 1905 px de ancho (el monitor del trabajo) para mirar que las tres
    tarjetas llenan el ancho sin huecos.
  - `npm test` entero en verde y comprobar lo publicado con `curl`.
- Al terminar, lo de siempre: `docs/CONTEXTO-CORTO.md` (sustituir la línea de la ficha del
  tercero), `docs/contexto/PERSONAS.md`, `docs/HISTORIA.md` y la fila 108 como HECHA.
- En `docs/COLA.md`, en «Lo que queda por hablar con Francisco», la línea de la fila 28 (el
  parentesco de verdad) sigue igual: esto no lo resuelve.
