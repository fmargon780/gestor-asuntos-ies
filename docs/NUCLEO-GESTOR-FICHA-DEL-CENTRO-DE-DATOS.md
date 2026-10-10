# El Gestor acepta la ficha del alumnado venga de quien venga (plan del núcleo)

Fila 323 de `docs/COLA.md` (si en la tabla lleva otro número, vale el de la tabla). Escrita el
10-oct-2026. Es la única fila del Gestor en el plan «el Centro de datos como núcleo»: **lee antes
`docs/PLAN-NUCLEO.md`** (secciones 2, 3, 5, 6.4, 6.5, 8 y 10). **No tiene condición**: se hace ya.

## Qué quiere Francisco

Hoy `ALUMNADO-BD.json` lo hace la base de datos de alumnado (`bd-alumnado-ies`). Al final del plan
lo hará el Centro de datos. El Gestor tiene que seguir igual ese día, sin que nadie lo toque.

**Decidido por Francisco** (plan, secciones 2 y 3):

1. `ALUMNADO-BD.json` no desaparece: cambia de autor. Su clave en el Centro de datos
   (`alumnado-bd`) y su forma (acuerdo 2 de `docs/ACUERDO-ALUMNADO.md`) no cambian.
2. El contrato del Centro de datos sigue siendo el 2. Lo nuevo se añade; quien no lo conoce, lo ignora.
3. Ninguna pantalla del Gestor cambia de aspecto por este plan (regla 7 de la sección 8).

**Decidido al escribir esta instrucción** (con el código delante):

4. El Gestor ya lo aguanta casi todo. Esta fila lo deja **atado con pruebas** y pone al día los
   documentos. De código solo cambian tres frases, y solo cuando el fichero viene del Centro de datos.
   **Con el fichero de hoy no cambia ni una letra en pantalla**: no hay línea en `js/novedades.js`.
5. Un `origen` que no sea `centro-de-datos-ies` (otro, o ninguno) se trata como hoy.
6. El nombre «Alumnado de la base de datos» y el bloque «Carpeta de la base de datos de alumnado» no cambian.

## Lo que se sabe hoy

El fichero nuevo traerá `origen: "centro-de-datos-ies"` y, en cada elemento de `campos`, un campo
nuevo `dueno`. El `indice.json` traerá `capacidades`, `hechos`, una carpeta nueva `hecho/` y entradas
de una clave nueva, `entrega` (variante `alumnado/bd-alumnado-ies`, tipo `json`). Comprobado:

1. **`origen` no se mira.** `AlumnadoBD.validar` (`js/alumnado-bd.js`, líneas 40-48) solo exige
   `acuerdo: 2`, `campos`, `alumnos` y que todos lleven `idEscolar`. Nadie lee `origen` en `js/`. Pero
   dos textos dan por hecho el autor: el pie de las tarjetas (`js/ficha-persona.js` 144 y
   `js/alumnado-bd-ver.js` 86) y la nota de «Lo que tengo ahora» (`js/datos-que-tengo-ver.js` 72-75).
2. **Los campos que no conoce se ignoran.** De cada campo solo se usan `clave`, `etiqueta`,
   `apartado`, `tipo` y `columnas` (`porClave`, `js/alumnado-bd.js` 211; `apartados` y `texto`,
   `js/alumnado-bd-ver.js` 40-71). `guardar` (línea 81) copia el fichero entero: `dueno` se conserva.
3. **El índice nuevo se tolera.** `leerIndice` (`js/centro-de-datos.js` 71-79) solo pide que `listados`
   sea una lista. `elegir` (175-196) se queda con las claves de `CLAVES` (línea 31): `entrega` no está
   y se ignora. Lo mismo `js/centro-de-datos-ver.js` 111 y `js/comprobacion-entrada.js` 206-213.
4. **Nada depende de `subidoPor` ni de `via` del índice.** `via` no se lee. `subidoPor` solo se
   enseña: `porDondeLlego` (`js/datos-que-tengo.js` 184-189) diría «Lo subió centro-de-datos-ies.».
5. **La regla «si la base no es más vieja que el RegAlum, manda»** (`unir`, `js/alumnado-bd.js`
   219-247) compara `generado` con la fecha de la copia de `RegAlum.csv` en `_GESTOR/datos`. No se
   rompe: si los dos salen del mismo RegAlum, dicen lo mismo. **No se toca en esta fila.**

De la entrada `alumnado-bd` del índice el Gestor necesita: que haya **una sola**, con `ruta`, `subido`
y `huella`. La `ruta` puede estar en cualquier carpeta (`llegarAlFichero`, línea 166, la sigue tal cual).

## Qué hay que hacer

### 1. Atarlo con pruebas

Prueba nueva `pruebas/nucleo-ficha-del-centro.mjs`, calcada de `pruebas/centro-de-datos.mjs` (su
`montar` escribe un índice fijo: aquí hace falta uno que acepte el índice entero). Todo inventado:

1. Un `ALUMNADO-BD.json` con `origen: "centro-de-datos-ies"`, `dueno` en cada campo (unos del Centro
   de datos, otros de `bd-alumnado-ies`) y un campo desconocido en la raíz, en un campo y en un
   alumno: vale, se copia, y la copia de `_GESTOR/datos` conserva `origen` y `dueno`.
2. Ese fichero y el mismo con `origen: "bd-alumnado-ies"` y sin `dueno` dan **lo mismo** en las
   tarjetas de la ficha, en la tabla «ALUMNADO BD» y en los huecos. Solo cambia el pie.
3. Con `origen: "otra-aplicacion"` y sin `origen`: vale, y los textos son los de hoy.
4. Un índice de contrato 2 con `capacidades`, `hechos` (una parte, con `alDia: false`), una entrada
   `entrega` con su fichero, y la de `alumnado-bd` con `subidoPor: "centro-de-datos-ies"` y
   `via: "hecho"`: se toman solo el alumnado y la ficha (apuntes `alumnado|` y `alumnado-bd|`); en
   `_GESTOR/datos` no hay ningún `ENTREGA…`; ni aviso ámbar ni error en la consola; el bloque de
   Ajustes cuenta los mismos listados que sin la entrada `entrega`.
5. La entrada `alumnado-bd` con su `ruta` dentro de `hecho/`: se toma igual.
6. **El relevo.** Con una copia de `bd-alumnado-ies` de ayer, llega la del Centro de datos de hoy:
   la sustituye, y los tres textos del apartado 2 pasan a los nuevos.
7. Después, la carpeta de la base de datos señalada con un fichero más viejo de `bd-alumnado-ies`:
   no se copia, la copia sigue siendo la del Centro de datos y la tabla no dice que haya otro más nuevo.
8. Un fichero con la forma de una parte de `hecho/` (`acuerdoHecho`, `registros`, `id`; sin
   `acuerdo`), y dos entradas `alumnado-bd` en el índice: no se toma nada y sale el ámbar de siempre.

Si una prueba **de antes** pide cambiar un texto esperado, algo va mal. Si una nueva falla porque algo
de «Lo que se sabe hoy» no era verdad, haz el cambio mínimo en ese sitio y dilo en la nota de la fila.

### 2. Tres frases que dicen de dónde viene

Una sola función nueva en `js/alumnado-bd.js` (mira antes que el nombre esté libre; por ejemplo
`AlumnadoBD.hechoPor(datos)`): dice «Centro de datos» solo si `datos.origen` es
`centro-de-datos-ies`. Los textos la usan; ninguno compara `origen` por su cuenta.

| Dónde | Hoy, y con cualquier otro `origen` | Con `origen: "centro-de-datos-ies"` |
|---|---|---|
| Pie de las tarjetas (los dos sitios) | «Datos de la base de datos de alumnado del 20-09-2099» | «Datos del Centro de datos del 20-09-2099» |
| Nota de «Lo que tengo ahora» (`NOTAS` pasa a función; sin copia, la de hoy) | «El alumnado de la base de datos lo hace la base de datos de alumnado, al pulsar allí «Actualizar los datos».» | «El alumnado de la base de datos lo hace el Centro de datos, él solo: no hay que pulsar nada.» |

Y en `porDondeLlego`: si `subidoPor` es exactamente `centro-de-datos-ies`, «Del Centro de datos. Lo
hace el propio Centro de datos.». Con cualquier otro valor, como hoy.

### 3. La copia de demostración

En `js/demo/datos-centro-de-datos.js`, parámetro nuevo `nucleo=1` (`?demo=1&auto=1&nucleo=1`). Con él,
el Centro de datos de mentira es el del final del plan: fichero con `origen: "centro-de-datos-ies"` y
`dueno`; su entrada, con `subidoPor: "centro-de-datos-ies"` y `via: "hecho"`; e índice con `capacidades`,
`hechos` y una entrada `entrega` con su fichero. Sin él, queda **exactamente** como hoy. Todo en `js/demo/`.

### 4. Los documentos

- `docs/ACUERDO-ALUMNADO.md` (sigue en `acuerdo: 2`; **la forma no cambia**). Cabecera: puesto al día
  por `docs/PLAN-NUCLEO.md`, con la fecha. Sección 1: «Todo lo que viene de Séneca sobre alumnado
  entra por el Centro de datos», que lo limpia y lo cruza una sola vez; lo que escribe una persona en
  la base de datos de alumnado (PIL, correcciones, reparto) se lo entrega ella al Centro de datos.
  Sección 2: quién genera el fichero: primero la base de datos de alumnado, después el Centro de datos
  (plan, 6.5, «El relevo»); el Gestor coge el de `generado` más reciente. Sección 3: `origen` es
  `bd-alumnado-ies` o `centro-de-datos-ies`, y quien lee no decide nada por él; cada campo puede
  llevar `dueno`. Sección 4: un campo desconocido (raíz, campo o alumno) se ignora. Sección 5: los
  datos viven también en la carpeta «CENTRO DE DATOS» del Drive del centro. Vive idéntico en
  `bd-alumnado-ies`: esta sesión solo cambia el de aquí y lo dice en la nota de la fila.
- `docs/CENTRO-DE-DATOS-CONTRATO-2.md`: un apartado nuevo, detrás de «Lo que cambia en el contrato»,
  sin tocar el resto: «Lo que añade el plan del núcleo (el contrato sigue en 2)». El Gestor ignora
  `capacidades`, `hechos`, la carpeta `hecho/` y la clave `entrega`; `subidoPor` puede ser el nombre
  de una aplicación; y de la entrada `alumnado-bd` necesita una sola, con `ruta`, `subido` y `huella`.
- `docs/contexto/PERSONAS.md` (apartado «El alumnado de la base de datos…»), `docs/COPIA-DE-PRUEBAS.md`
  (`nucleo=1`), `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` (la prueba), `docs/HISTORIA.md` y
  `docs/CONTEXTO-CORTO.md` (en su tope: **sustituye, no añadas**; su sección 3 dice «Solo comparten `RegAlum.csv`»).

## No se hace en esta fila (plan, sección 10)

- Dejar de leer `RegAlum.csv`. Sacar los tutores legales de la ficha. Leer `hecho/` o usar `capacidades`.
- Cambiar la regla del punto 5 de «Lo que se sabe hoy», ni la fila «Base de datos de alumnado» de la
  comprobación al entrar (`js/comprobacion-entrada.js` 151-187), que compara las mismas dos fechas.

## Cuidado

- **El repositorio es público** (aunque `docs/CONTEXTO-CORTO.md` diga todavía «privado»). Ni un
  nombre real, ni un número de identificación real, ni direcciones, ni ids de carpetas, en el código,
  las pruebas, los documentos, los commits ni la nota de la cola. Solo alumnado inventado.
- Sigue `CLAUDE.md`: rama `fila-323`, revisor en local y, con su APROBADA, a `main`. Mientras
  programas, `npm test -- nucleo alumnado centro-de-datos datos-que-tengo ficha-persona`; la pasada
  completa, una sola vez, antes de fusionar. `App.VERSION` (`js/version.js`) con la hora del reloj.
  `docs/ESTIMACIONES.md` en la subida de EN CURSO. `docs/COLA.md` por debajo de 40 KB (`wc -c`).
- No toques `js/carpetas.js`, `js/nucleo.js` ni `docs/PLAN-NUCLEO.md`. Ningún fichero de `js/` pasa de 600
  líneas. No subas `CONTRATO` ni `ACUERDO`: siguen en 2. No preguntes nada: decide y apúntalo en la nota.

## Qué decirle a Francisco al terminar

En tres frases. Que el Gestor ya está preparado para recibir la ficha del alumnado hecha por el
Centro de datos. Que hoy no va a ver nada distinto en pantalla. Y que el día que el Centro de datos
empiece a hacerla, tres frases lo dirán solas. Esta fila no le deja ningún paso.

## Cómo sabemos que está bien

1. Abrir `?demo=1&auto=1`. Ir a Ajustes → Este ordenador → «Carpeta del Centro de datos» y pulsar
   «Señalar la carpeta». Sale un aviso verde que empieza por «Traído del Centro de datos» y ningún
   aviso ámbar. Debajo del botón se lee cuántos listados hay para el gestor.
2. Ir a Herramientas y abrir «Traer el alumnado». En la fila «Alumnado de la base de datos», la
   columna «Por dónde llegó» dice «Del Centro de datos. Lo subió …», con un nombre detrás. Debajo de
   la tabla se lee que ese alumnado lo hace la base de datos de alumnado, con «Actualizar los datos».
3. Abrir `?demo=1&auto=1&nucleo=1` y señalar la carpeta igual que en el punto 1. Sale el aviso verde,
   ningún aviso ámbar, y el número de listados para el gestor es el mismo que en el punto 1.
4. Ir a Herramientas y abrir «Traer el alumnado». En la fila «Alumnado de la base de datos», la
   columna «Por dónde llegó» dice «Del Centro de datos. Lo hace el propio Centro de datos.».
5. En esa misma pantalla, debajo de la tabla, se lee «El alumnado de la base de datos lo hace el
   Centro de datos, él solo: no hay que pulsar nada.», y ya no se lee «Actualizar los datos».
6. Ir a Personas y empresas y abrir la ficha de cualquier alumno: se abre sin error, con sus tarjetas.
