# Control del registro de entrada y de salida (fila 259)

Aviso de usuario del 2-oct-2026 (pantalla Inicio), diseñado con Francisco el mismo día.

> «Implementar un sistema de control de los registros de entrada y salida para tener la mayor
> seguridad posible de que no se nos escape ningún asunto que pase por ambos registros.»

## Qué quiere Francisco

Saber qué apuntes del registro de entrada y de salida de Séneca **no están en ningún asunto** de
la aplicación. La aplicación conoce el registro de los documentos que pasan por ella, pero no la
lista completa de Séneca. Francisco la descarga de Séneca y la sube; la aplicación compara y
enseña lo que no encuentra.

Decidido con él:

1. Los listados se suben a mano (no se deducen de los saltos de numeración).
2. Hay una fecha «Revisar desde el día…»: lo registrado antes no se revisa ni avisa.
3. Un apunte se puede dar por «No necesita asunto», y una clase de documento entera por «nunca
   lleva asunto»; no desaparecen: quedan en un apartado plegado, con su cuenta.
4. Si pasan más de 7 días sin subir el listado, aviso en Inicio.

En pantalla, la palabra es **apunte** (no «asiento» ni «entrada del registro»): añádela a
`docs/VOCABULARIO.md`.

## Los dos listados de Séneca

Son dos CSV, uno por libro (Séneca los llama `RegLibEntCen.csv` y `RegLibSalCen.csv`, pero **no te
fíes del nombre**: el libro se sabe por los títulos de las columnas). Latin-1, separados por comas,
todo entre comillas, primera fila de títulos, lo más nuevo arriba. Léelos como ya se leen los CSV
de las tablas de datos (`Carpetas.leerTexto` + `Datos.aTabla`, Latin-1 si no es UTF-8).

Entrada (hay columna `Remitente`):

    "Nº.Registro","Fecha de trabajo","Fecha de registro","Extracto","Clase de documento","Estado","Tipo de remitente","Remitente","Procedencia","Modo de recepción","Doc. Adjunta"
    "2026/29700692/M000000000427","02/10/2026","02/10/2026","261002 A26-0024 INSTANCIA Pérez Ruiz, Ana 1234567","","Incompleto","","","","","S"
    "2026/29700692/A000000000447","02/10/2026","02/10/2026","HORAS PT","Comunicación electrónica de la Delegación/Consejería","Completo","Unidad administrativa","Servicio de Ordenación Educativa (Málaga)","","Comunicación electrónica de la Adm.","N"

Salida (hay columna `Destinatario`; el título del número lleva un espacio, `Nº .Registro`, y el
número una cola ` - ` o ` - N` que se tira):

    "Nº .Registro","Fecha de trabajo","Fecha de registro","Extracto","Clase de documento","Estado","Tipo de destinatario","Destinatario","Destino","Modo de envío","Doc. Adjunta"
    "2026/29700692/M000000000674 - ","02/10/2026","02/10/2026","261001 A26-0014 CERT. MATRICULA López Gil, Luis 7654321","Certificados","Completo","Alumnado","López Gil, Luis","Alumnado","Bandeja de firmas","S"
    "2026/29700692/M000000000669 - ","02/10/2026","02/10/2026","261002 A26-0019 CERTIFICADO Ruiz Mora, Eva","Certificados","Anulado","Persona física","Ruiz Mora, Eva","Profesorado","Bandeja de firmas","S"

(Los ejemplos son inventados. En el repositorio no entra nunca un listado real: llevan datos de
personas.)

- Busca las columnas **por su título**, sin distinguir mayúsculas, acentos, espacios ni puntos (así
  valen `Nº.Registro` y `Nº .Registro`). Si falta `Remitente` y `Destinatario`, o la del número, el
  fichero se rechaza con un aviso claro («No parece un listado del registro de Séneca») y no se
  guarda nada.
- El número: `2026/29700692/M000000000427` = año / código del centro / serie (`M` manual, `A`
  automática) + número. En la aplicación es `26EM0427`: año de dos cifras + `E` o `S` (el libro) +
  serie + número. Móntalo con la misma función que ya usa la aplicación (`Nombres.codigoRegistro`
  o la que lo haga hoy): el código tiene que salir idéntico al que llevan los documentos.
- `Estado`: `Completo`, `Incompleto` o `Anulado`. Las fechas, `dd/mm/aaaa`; la que cuenta es
  `Fecha de registro`.
- Un fichero con filas de las dos clases, o subido dos veces, no rompe nada: cada apunte se guarda
  por su código, y el que ya estaba se sustituye por el nuevo (el estado puede haber cambiado).

## Cómo se empareja un apunte con un asunto

Se calcula **cada vez que se pinta**, no se guarda: así un asunto creado después resuelve su apunte
solo. Se mira en asuntos abiertos y archivados (índice del ARCHIVO, todos los cursos que haga
falta). Por este orden:

1. **Por el registro**: algún documento de un asunto lleva ese código (`ficha.documentos[n]
   .registros[].codigo`, el registro del nombre en los documentos de antes, y `registros` del
   índice del ARCHIVO).
2. **Por el número del asunto en el extracto**: el extracto trae `A26-0024` y existe un asunto con
   ese número.
3. **Por el nombre**: el extracto, sin mayúsculas, acentos ni espacios repetidos, es el nombre de la
   carpeta de un asunto (los de antes de la fila 239 no llevan número).
4. **A mano**: alguien pulsó «Es de este asunto…» o «Crear asunto» desde el apunte (ver abajo).

Con los caminos 2, 3 o 4, si ningún documento del asunto lleva ese registro, el apunte cuenta como
«con asunto», con una nota gris: «el registro no está apuntado en el asunto».

Cada apunte acaba en uno de estos cuatro grupos:

- **Anulado** (`Estado` = `Anulado`): nunca cuenta como pendiente.
- **Con asunto**.
- **No necesita asunto**: lo dijo alguien de ese apunte, o su `Clase de documento` está en la lista
  de clases que nunca llevan asunto (por libro). Un apunte de una de esas clases que sí empareja
  con un asunto sale en «Con asunto».
- **Sin asunto**: todo lo demás. Es lo que hay que mirar.

## Qué se guarda

En `_GESTOR`, por `ColaGuardado`, con `_esquema`, como el resto (copias, conflictos de Dropbox):

- `control-registro.json`: `{ desde: 'AAAA-MM-DD', subidas: { E: { el, por, hasta }, S: {…} },
  decisiones: { '<código>': { que: 'no-necesita' | 'asunto', numero, carpeta, por, el } },
  clasesSinAsunto: { E: [ … ], S: [ … ] } }`. Es pequeño y se escribe con cada decisión.
  `decisiones` y `clasesSinAsunto` se funden por elemento, nunca se sustituyen enteros (dos
  ordenadores a la vez).
- Los apuntes, aparte, **un fichero por año de registro** (por ejemplo
  `control-registro/2026.json`, `{ apuntes: { '<código>': { … las columnas … } } }`): solo se
  escribe al subir un listado, fundiendo por código.
- Solo se guardan apuntes con `Fecha de registro` igual o posterior a `desde`. Al subir se dice
  cuántos se han dejado fuera por ser anteriores.
- Una decisión `asunto` apunta al número del asunto (`A26-0137`) si lo tiene y, si no, al nombre de
  la carpeta. Si ya no se encuentra ni por uno ni por otro, el apunte **vuelve a «Sin asunto»**
  (que reaparezca, nunca que se pierda). Si `AsuntoRenombrar` tiene un punto previsto para
  engancharse, úsalo para poner al día la carpeta; si no, no envuelvas nada.

## La pantalla

En **Herramientas**, «Control del registro». A todo el ancho, densa, sin huecos: es una tabla de
trabajo (Francisco tiene monitor ancho y no quiere renglones estrechos ni desplazarse de más). Si
dentro de Herramientas no cabe bien como un bloque más, que el bloque tenga un botón «Abrir el
control del registro» y la tabla sustituya la vista, con «← Volver».

Arriba, en una fila:

- «Subir listados de Séneca»: admite uno o varios ficheros a la vez (también soltándolos encima).
  Sabe cuál es el de entrada y cuál el de salida. Al terminar, aviso verde: «Entrada: 120 apuntes,
  14 nuevos. Salida: 85 apuntes, 9 nuevos.»
- «Revisar desde el día [fecha]». La primera vez está vacía y **no se puede subir nada sin
  ponerla** (propone hoy). Si se adelanta, los apuntes anteriores se quitan; si se atrasa, aviso:
  «Vuelve a subir los listados para revisar esos días».
- «Entrada: hasta el 02/10/2026 · subido el … por …» y lo mismo de Salida.

Si en una serie (año + libro + `M`/`A`) faltan números entre el más bajo y el más alto subidos,
una línea ámbar: «Faltan 3 números de entrada (serie manual) entre el 0412 y el 0427: ¿el listado
está completo?».

Debajo, dos pestañas: «Entrada (N sin asunto)» y «Salida (N sin asunto)». En cada una:

- La tabla **«Sin asunto»**, a la vista, lo más nuevo arriba: Registro (`26EM0427`), Fecha,
  Extracto, Clase de documento, Remitente o Destinatario, Vía (modo de recepción o de envío) y
  «Incompleto» si lo está. En cada fila:
  - **«Crear asunto»**: abre Nuevo asunto por `App.nuevoAsuntoCon`, con la fecha del apunte y, si
    el remitente o destinatario encaja con un tercero, ese tercero ya elegido (cambiable). Al
    crearlo queda la decisión `asunto` de ese apunte.
  - **«No necesita asunto»**: decisión `no-necesita`, aviso verde con «Deshacer».
  - En «⋮»: **«Es de este asunto…»** (buscador de asuntos abiertos y archivados; guarda la
    decisión `asunto`) y **«Esta clase nunca lleva asunto»** (solo si el apunte tiene clase;
    pregunta antes diciendo la clase y a cuántos apuntes sin asunto afecta; «Deshacer» después).
- Plegados, cada uno con su cuenta en el título:
  - «Con asunto (N)»: la misma tabla más el asunto, que se abre al pulsarlo (un asunto reservado
    se nombra como en las listas, con candado y sin el tercero), y la nota gris si toca.
  - «No necesitan asunto (N)»: arriba, las clases que nunca llevan asunto, cada una con «✕ Quitar»;
    cada apunte, con «Sí necesita asunto» (lo devuelve a «Sin asunto»).
  - «Anulados (N)».
  - «En la aplicación y no en Séneca (N)»: registros de ese libro apuntados en documentos de la
    aplicación cuyo número cae entre el más bajo y el más alto subidos de su serie, y que no están
    en el listado. Sirve para cazar números mal tecleados. Cada uno, con su asunto, que se abre.

Con «En este ordenador, solo consultar» (fila 260) la pantalla se ve, pero subir y decidir quedan
apagados, como el resto de controles.

## Los avisos de Inicio

Dos trozos nuevos en el cuadro de avisos (`AvisosLinea`, `js/avisos-linea.js`), como los demás:

- «N apuntes de registro sin asunto» (entrada + salida). Al pulsarlo, abre el control.
- «Registro sin revisar desde el DD/MM»: cuando la última subida de alguno de los dos libros tiene
  más de N días (7). Si solo se ha quedado atrás uno: «Registro de salida sin revisar desde…». Al
  pulsarlo, abre el control.

Sin fecha «Revisar desde» puesta (nadie ha usado esto todavía), **ningún aviso**.

En Ajustes → El centro → «Días de aviso», un campo más: «Registro de Séneca sin revisar: [7]
días» (`ajustesAvisos.diasRegistro`), que se guarda al cambiar como los otros.

## Antes de empezar

- No leas el repositorio entero. Lee `docs/contexto/DOCUMENTOS.md` y `NOMBRES-FIJOS.md` (dónde está
  el registro de un documento), `ASUNTOS-ARCHIVO.md` (índice del ARCHIVO), `TABLAS-DE-DATOS.md`
  (leer un CSV de Séneca) y `PANTALLA.md` (Herramientas, avisos).
- Módulo nuevo: no envuelve nada; se engancha por puntos previstos (`window.Gestor.alRefrescar`,
  `AvisosLinea`, `App.pintarHerramientas`).
- Nada de fondo escribe en las carpetas: aquí solo se escribe al subir o al decidir.
- Ningún fichero de `js/` pasa de 600 líneas: sale partido desde el principio.
- Cambios quirúrgicos en lo que ya existe; una sola pasada completa de pruebas al final.

## Ficheros

- Nuevos: `js/control-registro.js` (leer los CSV, guardar, emparejar: sin pantalla, probado sin
  navegador), `js/control-registro-pantalla.js` (la pantalla y sus acciones),
  `js/control-registro-avisos.js` (los dos trozos de Inicio), y su CSS donde vaya el de
  Herramientas.
- Tocados: `index.html` (cargar los guiones y el hueco en Herramientas), `js/herramientas.js`,
  `js/ajustes-centro.js` («Días de aviso»), `js/novedades.js` (una línea: «Herramientas → Control
  del registro: sube los listados de Séneca y mira qué apuntes no tienen asunto»), la copia sin
  internet si lleva lista de ficheros, y `js/demo/datos.js` solo si hace falta para el revisor.
- Prueba nueva `pruebas/control-registro.mjs`, con dos CSV inventados en Latin-1 dentro de
  `pruebas/` (nunca datos reales).
- Documentos al terminar: `docs/VOCABULARIO.md` (apunte), `docs/CONTEXTO-CORTO.md` (una línea en la
  sección 5), `docs/CONTEXTO.md` (los dos ficheros nuevos de `_GESTOR`),
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/contexto/DOCUMENTOS.md` (un apartado corto) y
  `docs/HISTORIA.md`.

Sigue las reglas de la cola: rama `fila-259`, revisor en local, una sola publicación.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Herramientas tiene «Control del registro»; que la primera vez pone la
fecha «Revisar desde el día…» y sube los dos listados de Séneca; y que desde entonces Inicio le
avisa de los apuntes sin asunto y de cuándo toca volver a subirlos.

## Cómo sabemos que está bien

1. Sin fecha «Revisar desde», «Subir listados de Séneca» no deja subir y pide la fecha; en Inicio
   no hay ningún aviso del registro.
2. Con la fecha puesta, subir a la vez un CSV de entrada y otro de salida (Latin-1, con eñes y
   acentos): cada uno cae en su pestaña, los textos se leen bien y el aviso verde da las cuentas.
3. Un apunte anterior a la fecha no aparece en ningún sitio, y el aviso dice cuántos se han dejado
   fuera.
4. Un apunte cuyo código lleva un documento de un asunto abierto sale en «Con asunto»; otro cuyo
   código solo está en un asunto archivado, también.
5. Un apunte con `A26-…` en el extracto de un asunto que existe, sin el registro apuntado, sale en
   «Con asunto» con la nota gris; uno cuyo extracto es el nombre de una carpeta de antes, igual.
6. Un apunte `Anulado` sale solo en «Anulados» y no cuenta en la pestaña.
7. «No necesita asunto» lo pasa a su apartado y baja la cuenta; «Deshacer» y «Sí necesita asunto»
   lo devuelven.
8. «Esta clase nunca lleva asunto» pregunta con el número de apuntes afectados, los pasa todos, y
   un apunte nuevo de esa clase subido después entra directo en «No necesitan asunto»; «✕ Quitar»
   la clase los devuelve a «Sin asunto».
9. «Crear asunto» abre Nuevo asunto con la fecha y el tercero; al crearlo, el apunte pasa a «Con
   asunto». «Es de este asunto…» hace lo mismo con uno que ya existe.
10. Un documento de la aplicación con un registro que no está en el listado, dentro del rango
    subido, sale en «En la aplicación y no en Séneca»; fuera del rango, no.
11. Con un salto en la numeración de una serie sale la línea ámbar de «Faltan N números».
12. Volver a subir el mismo listado no duplica nada ni borra las decisiones; recargar la página
    conserva todo.
13. Inicio: «N apuntes de registro sin asunto» con la cuenta de las dos pestañas; con la última
    subida de hace 8 días, «Registro sin revisar desde…»; cambiando los días en Ajustes, cambia.
14. Con «solo consultar», la pantalla se ve y no deja subir ni decidir.
15. [SOLO FRANCISCO] Subir los dos listados reales del centro: se leen enteros y los códigos
    coinciden con los de los documentos ya registrados (`docs/COMPROBAR-A-MANO.md`).
