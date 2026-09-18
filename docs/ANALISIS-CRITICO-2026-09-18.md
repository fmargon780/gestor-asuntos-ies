# Encargo: análisis crítico de la aplicación (18 de septiembre de 2026)

**Esto no es una fila de la cola.** No se toca ni una línea de código. El resultado es un
documento, y nada más.

Lo pide Francisco. Quiere saber si el proyecto va por buen camino, mientras todavía se está a
tiempo de cambiarlo.

---

## 1. Qué hay que entregar

Un fichero nuevo: `docs/INFORME-CRITICO-2026-09-18.md`.

Se sube a `main` en **una sola subida**, junto con el cambio de estado de este encargo. No se
toca ningún fichero de `js/`, `css/`, `pruebas/` ni `apps-script/`. No se abre pull request si la
sesión puede subir directamente; si no puede, se abre uno y se fusiona según el permiso permanente
que está en `docs/COLA.md`.

Como solo se tocan ficheros de `docs/`, Vercel no publica y no se gasta ninguna publicación del
plan gratuito.

## 2. Cómo hay que escribirlo

Lo va a leer Francisco, que **no es programador**.

- Frases cortas. Una idea por frase.
- Nada de código, ni entero ni en trozos. Ni nombres de funciones sueltos sin explicar.
- Se pueden nombrar ficheros, pero diciendo para qué sirven.
- Cada debilidad se escribe con cuatro cosas: **qué pasa**, **por qué importa**, **cuándo puede
  ocurrir de verdad** y **qué se haría**.
- Si algo es una opinión y no un hecho comprobado, hay que decirlo.
- Ordenado de más grave a menos grave. Lo que pone en riesgo los datos, primero.

## 3. Qué hay que leer antes

1. `docs/CONTEXTO-CORTO.md` — qué es la aplicación y qué está hecho.
2. `docs/CONTEXTO.md` — los módulos por dentro, los ficheros de `_GESTOR`, las trampas técnicas.
3. `docs/COLA.md` — las 60 filas de trabajo y las notas del final, que cuentan lo que se ha roto.
4. El código: `js/`, `css/`, `pruebas/`, `apps-script/`, `index.html`, `vercel.json`.
5. `docs/HISTORIA.md` — **solo** las entradas de los últimos diez días, no el fichero entero.

Se lee para juzgar, no para arreglar.

## 4. La primera parte: la decisión de fondo

Esta es la parte que más le interesa a Francisco, y la que el análisis anterior no trató.

La aplicación se construyó sobre una limitación que no se puede saltar: **ningún dato personal de
alumnado, de sus tutores legales ni del personal puede salir a internet.** De ahí salió todo lo
demás: no hay servidor, no hay base de datos, y los datos viven en carpetas y en ficheros JSON
dentro del Dropbox del centro, que cada navegador lee y escribe directamente.

El informe tiene que responder a tres preguntas sobre esto, con argumentos y sin adornos.

### 4.1 ¿Aguanta la estructura de carpetas y ficheros JSON?

Hay que dar cifras, no impresiones. Cuánto ocupa hoy cada fichero de `_GESTOR` y cuánto va a
ocupar con un curso entero de uso. Cuántas veces se lee y se escribe cada uno en una jornada
normal. Qué pasa cuando `asuntos.json` llegue a varios megabytes: si hay que cargarlo entero en
memoria cada vez, cuánto tarda, y en qué momento el Chromebook de Francisco lo va a notar.

También: qué pasa con el índice del ARCHIVO (`indice-archivo.json`) cuando haya miles de carpetas,
y si "reconstruir el índice" seguirá siendo cuestión de segundos o de minutos.

Y lo más importante: **decir con qué número se rompe**. Cuántos asuntos, cuántos documentos,
cuántas personas escribiendo a la vez. Aunque sea una estimación, hay que mojarse.

### 4.2 ¿Qué datos salen hoy a internet de verdad?

Hoy se da por supuesto que no sale nada. Hay que **comprobarlo**, no creerlo. Sitio por sitio:

- **Vercel.** Qué se publica ahí exactamente. Confirmar que solo viaja el programa, y que ni un
  solo dato de una persona pasa por sus servidores. Mirar también si hay registros, medición de
  visitas o cualquier cosa parecida activada en `vercel.json` o en el proyecto.
- **El navegador.** Recorrer el código buscando toda llamada que salga fuera (`fetch`, `XHR`,
  imágenes, tipografías, librerías traídas de fuera). Decir cuáles hay y qué mandan. Comprobar
  si `pdf.js`, `pdf-lib` y las demás librerías están dentro del repositorio o se traen de un
  servidor ajeno cada vez.
- **Gmail y el script de Apps Script.** Qué sale del centro cuando se lee la bandeja o se prepara
  un borrador. Los correos ya viven en Google, pero hay que decir qué añade la aplicación: si los
  adjuntos con datos de alumnado se copian a algún sitio nuevo, y dónde queda el registro.
- **Séneca.** Qué hace exactamente el ayudante de destinatarios dentro de la página de Séneca, y
  si algo de lo que maneja se guarda fuera.
- **El propio Dropbox.** `RegAlum.csv` es una exportación de Séneca con datos de menores y de sus
  tutores. Está en un Dropbox que ya usa el centro, así que no lo ha creado la aplicación. Pero el
  informe debe decir claramente qué ficheros con datos personales crea o copia la aplicación, y
  dónde los deja, para que Francisco pueda enseñárselo a dirección.

El resultado de este apartado tiene que ser una lista corta y clara: **esto sale, esto no sale, y
esto no lo he podido comprobar desde aquí.**

### 4.3 ¿Hay una forma mejor, sin saltarse el límite?

Aquí se pide juicio, no una lista de tecnologías.

Dado que el límite no se puede tocar, ¿es esto lo mejor que se puede hacer, o hay una forma más
sólida de guardar lo que pasa? Por ejemplo, una base de datos que viva en el propio ordenador, o
un formato distinto para el registro, o guardar los cambios uno detrás de otro en vez de
reescribir el fichero entero cada vez.

De cada alternativa: qué arreglaría, qué rompería, cuánto trabajo sería, y si merece la pena
**ahora** o es mejor esperar.

Si la conclusión es que lo que hay es lo correcto y no hay que cambiar nada de fondo, hay que
decirlo así de claro. Eso también es una respuesta útil.

## 5. La segunda parte: qué sigue vivo del análisis anterior

El 11 de septiembre de 2026 se hizo un análisis crítico de esta misma aplicación. Detectó estas
debilidades. Hay que ir una por una, mirar el código de hoy, y decir si **sigue viva, está
resuelta, o está resuelta a medias**:

1. Un `asuntos.json` dañado se borraba solo, sin aviso. Se pidieron copias de seguridad diarias y
   no escribir nunca encima de un fichero roto.
2. Dos ordenadores podían pisarse: Dropbox tarda entre 5 y 30 segundos en sincronizar, y crea
   ficheros "copia en conflicto" que la aplicación no miraba. Además, varios ficheros de ajustes
   no se releían antes de escribir.
3. Si alguien mueve o renombra una carpeta a mano desde el explorador, su ficha se queda huérfana.
4. Las pruebas existían pero no se ejecutaban solas.
5. La aplicación se construyó "envolviendo" unas funciones con otras: 17 sitios donde un fichero
   modifica lo que hace otro. Depende del orden exacto de los `<script>` de `index.html`, y los
   fallos que provoca son silenciosos.
6. Los documentos de contexto se quedaban atrás del código.
7. `bandeja-correos.js` era un fichero muy grande que lo hacía todo con los correos.
8. Puntos sueltos: firma y centro escritos a pelo en el código, versión a mano, leer el ARCHIVO
   recorriendo todas las carpetas, el nombre de usuario sin control.

`docs/CONTEXTO-CORTO.md` dice que las copias de seguridad, la detección de fichero roto, la fusión
de conflictos y las pruebas automáticas están hechas. **No hay que creérselo: hay que comprobarlo
en el código** y decir si están hechas de verdad y bien.

## 6. La tercera parte: la deuda de la última semana

Entre el 11 y el 18 de septiembre se han hecho 24 filas de la cola. Es un ritmo muy alto. Hay que
mirar qué ha dejado atrás.

- **El código.** Cuántos ficheros hay ahora, cuántas líneas, cuáles se han hecho demasiado
  grandes, y dónde hay dos sitios que hacen lo mismo.
- **Las pruebas.** Cuántas hay, si pasan todas, y sobre todo **qué partes no prueba nadie**.
  Señalar en concreto qué módulos de los añadidos esta semana no tienen ninguna prueba.
- **Los documentos.** `docs/CONTEXTO.md` (225 KB) y `docs/HISTORIA.md` (217 KB) se quedaron sin
  actualizar en las filas 53 a 56, porque ya no caben en una subida. Eso es un problema real de
  método, no un descuido. Hay que decir cómo se arregla: partirlos, recortarlos, o cambiar la
  forma de mantenerlos.
- **El método de trabajo en sí.** Si la cola, tal como está montada, se sostiene con 60 filas y
  varias sesiones. Las notas del final de `docs/COLA.md` cuentan tres días de ficheros pisados,
  truncados y con texto de relleno. Decir si eso es mala suerte o es una señal.
- **La interfaz.** Con tantos módulos añadidos deprisa, si hay pantallas que se han quedado
  incoherentes entre sí, o botones que hacen lo mismo con nombres distintos.

## 7. La cuarta parte: lo que va a faltar

No son fallos. Son cosas que el uso va a pedir. Hay que verlas venir y decir cuándo tocará
hacerlas.

Como mínimo: el cambio de curso en septiembre de 2027 (alumnado que se va con asuntos abiertos),
buscar dentro de las notas, cuentas por tipo para la memoria de fin de curso, la entrada de una
tercera persona, y el relevo (hoy el repositorio, el dominio y la publicación están todos en las
cuentas personales de Francisco).

Añadir lo que se vea, sin límite de lista.

## 8. Cómo termina el informe

Con una propuesta de orden de trabajo. Pocas cosas, numeradas, lo más grave primero, y diciendo
en cada una si es un día de trabajo o una semana.

Y con una respuesta directa a la pregunta que ha hecho Francisco: **¿vamos por buen camino, sí o
no?** Si la respuesta es que no, hay que decir en qué punto exacto se torció y qué habría que
deshacer.

No hay que suavizar nada. Un informe que solo diga cosas buenas no sirve para lo que se pide.

## 9. Qué NO hay que hacer

- No arreglar nada. Ni siquiera algo pequeño que se vea de paso. Si se ve, se apunta en el informe.
- No añadir filas a `docs/COLA.md`. Eso lo decide Francisco después de leer.
- No preguntarle nada a Francisco.
- No reescribir `docs/CONTEXTO.md` ni `docs/HISTORIA.md` en esta sesión.

## 10. El mensaje final

Cuando termine, un mensaje corto en el chat: que el informe está en
`docs/INFORME-CRITICO-2026-09-18.md`, cuántas debilidades graves ha encontrado, y la respuesta en
una línea a si vamos por buen camino.

---

**Estado de este encargo: HECHA (18-sep-2026).** El informe está en
`docs/INFORME-CRITICO-2026-09-18.md`.
