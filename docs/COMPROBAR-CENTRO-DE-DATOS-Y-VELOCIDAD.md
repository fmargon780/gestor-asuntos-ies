# Comprobar el Centro de datos y la velocidad (fila 335)

Idea 335 de Francisco, diseñada con él el 12-oct-2026. Texto de la idea:

> Necesito que se me confirme que esta app ya toma todos los datos que en Centro de datos estén
> disponibles, y que todos los cambios estructurales encaminados a mejorar la velocidad de la misma
> han surtido efecto y están operativos.

## Qué es

Una **revisión única**, no una función nueva. No se cambia la app, no se publica y no pasa por el
revisor de pantalla. El resultado es un informe corto para Francisco.

## Cuándo

**No antes del 18-oct-2026.** Si la cola llega a esta fila antes de esa fecha, déjala PENDIENTE sin
tocarla y sigue con la siguiente. El motivo: la velocidad se juzga con una semana de medidas reales
(fila 332, `docs/DATOS-1-MEDIDAS.md`, empezó a medir el 11-oct-2026).

## Qué hay que comprobar

### 1. ¿El Gestor coge todo lo que ofrece el Centro de datos?

- Lee la carpeta «CENTRO DE DATOS» (su `indice.json` y `configuracion.json`) y el contrato
  (`docs/BEBER-DEL-CENTRO-DE-DATOS.md`, `docs/CENTRO-DE-DATOS-CONTRATO-2.md` y lo que cite el
  repositorio `fmargon780/centro-de-datos-ies`).
- Haz la lista de **todo** lo que el Centro de datos ofrece hoy (cada lista, fichero y dato del
  centro).
- Para cada cosa, di si el Gestor la coge, de dónde la coge si no es del Centro de datos (por
  ejemplo, un CSV de Séneca subido a mano o la BD Alumnado) y si la usa en alguna pantalla.
- Mira también `_GESTOR/centro-de-datos.json`: ¿la última vez que entró cogió lo nuevo?
- Si no puedes leer la carpeta real, compruébalo con el código y con los datos de demostración, y
  dilo en el informe.

### 2. ¿Los cambios para ir más rápido funcionan?

- Busca en `docs/COLA.md`, `docs/HISTORIA.md` y en los documentos de cada fila **todos** los cambios
  hechos para que la app vaya más rápida o cargue menos (carga de pantallas, lectura de carpetas,
  índices, cachés, pasadas al entrar, etc.). Haz la lista con el número de fila de cada uno.
- Para cada uno, comprueba que **sigue puesto** en el código de `main` y en la web publicada (que
  ninguna fila posterior lo haya deshecho o saltado).
- Con las medidas de la semana (fila 332: tiempos de entrar, abrir un asunto, archivar, leer y
  guardar ficheros; reintentos, conflictos y fallos), di si los tiempos son buenos o si hay algo
  lento. Las medidas están en el buzón de soporte (`fmargon780/soporte-apps`). Si el buzón todavía
  no las tiene, dilo en el informe y apunta en `docs/TE-TOCA.md` qué tiene que mirar Francisco en
  la tarjeta «Medidas» (Herramientas → Puesta a punto) y en qué ordenador; no intentes sacarlas de
  otra manera.

## El informe

- Fichero nuevo: `docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md`. Enlázalo desde la fila 335.
- Para Francisco, que no es programador: lenguaje llano, una idea por frase, sin código.
- Arriba, dos líneas: «Centro de datos: sí / no» y «Velocidad: sí / no», cada una con una frase.
- Debajo, el detalle: la lista de lo que ofrece el Centro de datos con lo que hace el Gestor con
  cada cosa, y la lista de cambios de velocidad con «puesto / no puesto» y las cifras de la semana.
- **No se arregla nada en esta fila.** Cada cosa que falle se apunta al final de `docs/COLA.md` como
  `IDEA (fecha)`, una por fila, en una línea, con «sale del informe de la fila 335». Francisco las
  diseña después.

## Cómo sabemos que está bien

1. Existe `docs/INFORME-335-CENTRO-DE-DATOS-Y-VELOCIDAD.md` con las dos líneas de arriba.
2. Cada cosa del Centro de datos y cada cambio de velocidad tiene su fila y su respuesta.
3. La parte de velocidad lleva cifras de al menos siete días, o dice claramente por qué no.
4. Cada fallo está apuntado como IDEA en la cola, y no hay ningún cambio en el código de la app.
