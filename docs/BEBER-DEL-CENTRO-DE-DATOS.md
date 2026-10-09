# Beber del Centro de datos: los listados

Fila 312 de `docs/COLA.md`. Diseño cerrado con Francisco el 8-oct-2026.

## Por qué

Francisco baja de Séneca los mismos listados para varias aplicaciones y los sube en cada una. Ha
pedido «un centro de datos del que beban las otras apps». Ese centro es un proyecto aparte,
`fmargon780/centro-de-datos-ies`: una página donde se suelta cada listado **una sola vez**, y una
carpeta de Drive, «CENTRO DE DATOS», donde queda guardado con un índice.

Esta fila hace que el gestor **coja de esa carpeta lo que necesita**, él solo, al entrar. Donde hoy
hay un botón para subir un fichero, se verá además «Datos del Centro de datos, de <fecha>».
**La subida a mano se queda**, como reserva.

Esta fila **no depende** de que el Centro de datos esté terminado: sin carpeta señalada todo
funciona como hoy, y se prueba con una carpeta inventada.

## Lo que el Centro de datos promete (copia de su contrato, versión 1)

> **Desde la fila 317 (9-oct-2026) la copia vigente del contrato es `docs/CENTRO-DE-DATOS-CONTRATO-2.md`** (índice de contrato 2, con fichas y varias entradas por clave); lo de abajo es la versión 1, que el gestor sigue entendiendo.

La versión buena vive en `docs/CONTRATO.md` de `centro-de-datos-ies`. Lo que hace falta aquí:

    CENTRO DE DATOS/
    ├── indice.json
    ├── configuracion.json        (fila 313, no esta)
    ├── entrada/  anteriores/  sin-reconocer/  _interno/     (el gestor no las mira)
    └── listados/<clave>/[<variante>/]<nombre del fichero>   (un solo fichero: el vigente)

`indice.json`:

    { "contrato": 1, "actualizado": "…", "web": "https://script.google.com/…/exec",
      "listados": [ { "clave": "alumnado", "variante": "", "titulo": "Alumnado",
        "fichero": "RegAlum.csv", "ruta": "listados/alumnado/RegAlum.csv", "tipo": "csv",
        "cursoEscolar": "", "subido": "2026-10-08T21:39:12+02:00",
        "subidoPor": "fmargon780@g.educaand.es", "via": "pagina", "bytes": 85580, "filas": 812,
        "resumen": "812 alumnos", "huella": "<sha-256 en hexadecimal>", "caducaDias": 30 } ] }

Reglas del contrato que obligan al gestor:

- **El gestor solo lee** esa carpeta. Nunca escribe en ella. La carpeta se pide en modo lectura.
- Los ficheros están **tal como salieron de Séneca**, byte a byte. Se leen como ya se leen hoy.
- Si `contrato` es mayor que 1: no se toca nada y se dice «El Centro de datos es más nuevo que
  esta aplicación».
- Los campos que no se conozcan se ignoran. Las claves que no interesan, también.

Las claves que interesan al gestor:

| `clave` | `variante` | Qué es | Adónde va hoy en el gestor |
|---|---|---|---|
| `alumnado` | — | `RegAlum…csv` | `_GESTOR/datos/RegAlum.csv` (`js/traer-datos.js`) |
| `personal` | curso o `""` | `RelPerCen…csv` | `_GESTOR/datos/<nombre original>` (`js/traer-datos.js`) |
| `alumnado-bd` | — | `ALUMNADO-BD.json` | `_GESTOR/datos/ALUMNADO-BD.json` (`AlumnadoBD.validar` y `guardar`) |
| `tutorias` | — | PDF «Función Tutorial» | `_GESTOR/datos/<nombre original>` (lo lee `TablasDatos.cargar`) |
| `consejo-escolar` | años o `""` | `RegMieConEsc …csv` | `_GESTOR/datos/Tablas/` (`anadirFicherosDelConsejo`) |
| `registro-entrada` | — | listado del registro de entrada | `ControlRegistro.subir` |
| `registro-salida` | — | listado del registro de salida | `ControlRegistro.subir` |

`matricula` no es del gestor: se ignora.

## Decisiones ya tomadas (no se vuelven a discutir)

1. **La carpeta se señala una vez por ordenador**, como la de la base de datos de alumnado. Es la
   carpeta «CENTRO DE DATOS» que Google Drive enseña en el ordenador.
2. **No se escribe ninguna importación nueva.** Cada fichero que se toma pasa por la misma función
   con la que hoy se sube a mano. Si esa función está pegada a un botón, se le saca el trozo que
   importa a una función que valga para los dos caminos, sin cambiar lo que hace.
3. **Lo que se ha tomado se apunta en un fichero común**, `_GESTOR/centro-de-datos.json`. Así el
   ordenador del compañero, que no tiene la carpeta señalada, sabe de cuándo son los datos, y
   ninguno de los dos vuelve a tomar lo mismo.
4. **Nunca se sustituye un dato por otro más viejo** (ya pasó una mezcla el 2-oct-2026, fila 260).
5. **La carpeta de la base de datos de alumnado sigue valiendo.** Si están las dos, gana el
   `ALUMNADO-BD.json` de `generado` más reciente, que es la regla que ya hay.
6. Sin carpeta señalada y sin nada apuntado: no se enseña nada nuevo salvo el bloque de Ajustes.
   El gestor no puede ponerse a pedir una carpeta a quien no la usa.

## Qué hay que hacer

### 1. Señalar la carpeta

Ajustes → «Este ordenador» → bloque nuevo **«Carpeta del Centro de datos»**
(`#bloque-centro-de-datos`), calcado del de la base de datos de alumnado:

- Botón «Señalar la carpeta» (`showDirectoryPicker({ id: 'gestor-centro-de-datos', mode: 'read' })`),
  guardada en el almacén del ordenador con la clave `centro-de-datos-carpeta`.
- Debajo, lo que hay: «Índice del 8-oct-2026 21:40 · 6 listados para el gestor». Si `indice.json`
  trae `web`, un enlace «Abrir el Centro de datos».
- Si la carpeta señalada no tiene `indice.json`: «Esta carpeta no es la del Centro de datos», en
  ámbar, y no se guarda.
- Si el navegador ha perdido el permiso: línea ámbar con «Volver a dar permiso» (hace falta un
  clic; al entrar solo se mira con `queryPermission`).
- Registrar el bloque en `js/ajustes-reparto.js` (`donde: 'ordenador'`, con palabras para el
  buscador: centro de datos, listados, Séneca, Drive).

### 2. Coger lo nuevo

Módulo nuevo `js/centro-de-datos.js`. Se engancha a `window.Gestor.alRefrescar`, igual que
`AlumnadoBD.alEntrar`: una sola vez por sesión, a los 1,5 segundos.

Antes de empezar: si `SoloConsulta.activo()`, no hace nada; si `ColaGuardado.hayGuardado()`,
espera y reintenta (como `PorLiquidar.alEntrar`, hasta 10 veces).

Para cada listado del índice que interesa, **se toma solo si se cumplen las tres**:

- su `huella` es distinta de la apuntada en `centro-de-datos.json` para esa clave y variante;
- su `subido` es posterior al `subido` apuntado (si hay algo apuntado);
- el fichero que el gestor ya tiene de eso no es más reciente que `subido` (se mira la fecha de
  modificación del fichero de `_GESTOR/datos`; para `alumnado-bd`, su `generado`).

Tomarlo es leer el fichero por su `ruta`, **como bytes**, y entregarlo a su función de siempre
(tabla de arriba). Cada entrega va en `js/centro-de-datos-reparto.js`, una función corta por clave.

Después se apunta en `_GESTOR/centro-de-datos.json`, **por `ColaGuardado`**:

    { "_esquema": 1,
      "tomado": { "alumnado|": { "huella": "…", "subido": "…", "fichero": "RegAlum.csv",
                                 "resumen": "812 alumnos", "tomadoEl": "…", "tomadoPor": "Francisco" } } }

La clave de cada apunte es `clave + "|" + variante`. Añadir el fichero a las copias diarias y a su
`_esquema`, como los demás de `_GESTOR`.

Al terminar, **un solo aviso verde**: «Traído del Centro de datos: Alumnado (8-oct), Personal
(8-oct).» Si no había nada nuevo, ningún aviso. Si uno falla, los demás siguen y el fallo sale en
ámbar con `U.accesorio` y `U.mensajeDeError`.

Después de tomar algo, se recarga lo que dependa de ello con las funciones que ya existen
(`cargarAlumnado`, `cargarPersonal`, `TablasDatos.cargar`), sin recargar la página.

### 3. El registro de entrada y salida, con cuidado

«Control del registro» exige tener puesta la fecha «Revisar desde» antes de subir. Si no está
puesta, los dos listados del registro **no se toman**, y en la pantalla de «Control del registro»
sale una línea: «Hay listados nuevos del registro en el Centro de datos. Pon la fecha «Revisar
desde» y se traerán solos.» Al ponerla, se toman en ese momento.

### 4. Decirlo donde hoy se sube a mano

Una línea gris, encima o al lado del botón que ya hay, **solo cuando haya algo apuntado** de esa
clave: «Datos del Centro de datos, del 8-oct-2026 · 812 alumnos · los subió fmargon780». En:

- Herramientas → «Traer ficheros de Séneca»: alumnado, personal y alumnado de la base de datos.
- Herramientas → «Tablas de datos»: función tutorial y Consejo Escolar.
- Herramientas → «Control del registro»: entrada y salida.

Y en Herramientas → «Traer ficheros de Séneca», un botón más: **«Traer ahora del Centro de
datos»**, que hace lo mismo que al entrar y contesta siempre («No hay nada nuevo» si no lo hay).

Las líneas y el bloque de Ajustes van en `js/centro-de-datos-ver.js`.

### 5. La comprobación al entrar

En `js/comprobacion-entrada.js`, una función y una línea nuevas en `LISTA`, id `centro-de-datos`,
título «Carpeta del Centro de datos»:

- **bien**: carpeta señalada, con permiso e índice legible. Frase: de cuándo es el índice.
- **bien**: sin carpeta señalada pero con apuntes en `centro-de-datos.json`. Frase: «Este
  ordenador usa lo que trae el otro. Último: 8-oct-2026.»
- **ámbar**: carpeta señalada sin permiso, o `contrato` mayor que 1.
- **falta**: ni carpeta ni apuntes. «Arreglarlo» lleva a `#bloque-centro-de-datos`. Vale «No lo
  uso aquí», como en las demás.

### 6. La copia de pruebas

`js/demo/disco.js`: una cuarta carpeta de mentira para la `id` `gestor-centro-de-datos`.
`js/demo/datos.js`: dentro, un `indice.json` y sus ficheros inventados (alumnado, personal y los
dos del registro bastan), escritos con las funciones de siempre.

## Ficheros que se tocan (lista completa)

Nuevos: `js/centro-de-datos.js`, `js/centro-de-datos-reparto.js`, `js/centro-de-datos-ver.js`,
`pruebas/centro-de-datos.mjs`.

Se cambian, con el mínimo de líneas:

- `index.html`: los tres `<script>` y el bloque de Ajustes.
- `js/traer-datos.js`: sacar a una función lo que copia un fichero de alumnado o de personal a
  `_GESTOR/datos`, para que valga con un fichero de la carpeta; hueco para la línea gris y botón nuevo.
- `js/alumnado-bd.js`: aceptar un archivo leído de la carpeta nueva (misma `validar`, misma `guardar`).
- `js/tablas-datos-pantalla.js`: que `anadirFicherosDelConsejo` valga con ficheros de la carpeta;
  hueco para las líneas grises.
- `js/control-registro-pantalla.js`: la línea de «hay listados nuevos» y el hueco de la línea gris.
  `js/control-registro.js` **no se toca**: se llama a `ControlRegistro.subir` tal como está.
- `js/comprobacion-entrada.js`, `js/ajustes-reparto.js`.
- `js/demo/disco.js`, `js/demo/datos.js`.
- `js/novedades.js`: una línea, en el mismo commit del código.
- El fichero donde se declaran las copias diarias y los `_esquema` de `_GESTOR` (búscalo con un
  `grep` de `_esquema`).

**No tocar** `js/carpetas.js` (599 líneas) ni `js/nucleo.js` (ya pasa de 600): todo lo nuevo va en
los módulos nuevos. Ningún fichero de `js/` puede pasar de 600 líneas al terminar.

Documentos: `docs/CONTEXTO-CORTO.md` (**está a 2 caracteres de su tope de 40.000**: sustituye, no
añadas; una línea en la sección 5 y lo que haga falta quitar de otra), `docs/contexto/TABLAS-DE-DATOS.md`,
`docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`, y **`docs/LOS-DATOS-DEL-CENTRO.md`**:
hoy dice que ningún listado de alumnado ni de personal sale del Dropbox del centro. Hay que añadir,
en llano, que los listados de Séneca se guardan además en el Centro de datos: una carpeta privada
de Drive de la cuenta del instituto de Francisco, a la que solo entran él y su compañero, y que el
gestor solo la lee.

## Cómo sabemos que está bien

Prueba nueva `pruebas/centro-de-datos.mjs`, con una carpeta de mentira, calcada de
`pruebas/alumnado-desde-la-bd.mjs` y de `pruebas/control-registro.mjs` (usa sus CSV inventados):

1. Sin carpeta señalada y sin apuntes, el gestor se comporta exactamente como hoy.
2. Con la carpeta y un índice con alumnado y personal nuevos: al entrar quedan copiados **byte a
   byte** en `_GESTOR/datos`, apuntados en `centro-de-datos.json`, y sale un solo aviso verde.
3. Entrar otra vez no copia nada ni avisa de nada.
4. Un listado con la misma `huella` que la apuntada no se toma. Uno con `subido` anterior al
   apuntado, tampoco.
5. Si el `RegAlum.csv` del gestor es más reciente que el `subido` del índice, no se pisa.
6. Con `SoloConsulta.activo()`, no se escribe nada. Con un guardado en marcha, espera.
7. Con `contrato: 2`, no se toca nada y se dice.
8. Los dos listados del registro: sin «Revisar desde», no se toman y sale la línea; al ponerla, se
   toman y los apuntes del registro aparecen como si se hubieran subido a mano.
9. Un fichero del índice que falla al leerse no impide tomar los demás; su fallo sale en ámbar.
10. El ordenador sin carpeta pero con apuntes enseña las líneas grises y da «bien» en la
    comprobación al entrar.
11. Las pruebas de siempre de lo tocado siguen en verde: `npm test -- alumnado control-registro
    consejo tablas comprobacion solo-consulta`.

Para Francisco, una sola cosa que solo se ve con datos reales, en `docs/COMPROBAR-A-MANO.md`:
señalar la carpeta «CENTRO DE DATOS» en Ajustes → Este ordenador y ver que, al entrar, sale el
aviso verde con lo traído.
