# Reglas comunes para Claude Code

> El original vive en el repositorio público `fmargon780/metodo-reglas` y solo se cambia allí.
> Cada app guarda una copia en `docs/METODO-COMUN.md`, que no se edita en la app: cada sesión la
> pone al día al empezar (apartado 0). Si una regla de este fichero choca con `CLAUDE.md` de la app, manda `CLAUDE.md` solo en lo
> propio de la app (cómo se publica, ramas, revisores técnicos propios, pruebas propias); en todo
> lo demás manda este fichero. El segundo revisor (apartado 6) se hace en todas las tareas grandes,
> también en las apps cuyo `CLAUDE.md` diga «sin revisor» o tenga un revisor propio: ese otro
> revisor es técnico y se suma, no lo sustituye. Tampoco puede el `CLAUDE.md` de la app permitir
> pruebas que toquen los datos reales (apartado 6.4).

## 0. Antes de nada: poner al día estas reglas

La primera orden de cada sesión, antes de leer nada más, desde la raíz del repositorio de la app:

    curl -fsSL https://raw.githubusercontent.com/fmargon780/metodo-reglas/main/METODO-COMUN.md -o /tmp/METODO-COMUN.md && grep -q '^# Reglas comunes para Claude Code' /tmp/METODO-COMUN.md && cp /tmp/METODO-COMUN.md docs/METODO-COMUN.md

- Si funciona y `docs/METODO-COMUN.md` ha cambiado, lee la copia nueva y súbela junto con la
  primera subida de la fila (la marca EN CURSO).
- Si falla (sin red, GitHub no contesta), sigue con la copia que ya tiene la app y dilo en una
  línea en la nota de la fila. No es un atasco.
- `CLAUDE.md` de cada app repite esta orden en su primera línea, para que funcione aunque la
  copia sea antigua.

## 1. Al empezar cada sesión (y nada más)

Lee solo esto, en este orden:

1. `docs/LECCIONES.md` de la app (errores ya conocidos y qué hacer en su lugar).
2. La sección «Lecciones para Claude Code» de este fichero (abajo).
3. `docs/CONTEXTO-CORTO.md` (o `docs/CONTEXTO.md` si la app no tiene el corto).
4. La fila de `docs/COLA.md` que vas a trabajar, su instrucción y su pantalla de prueba (`docs/pantallas/<nº>.html`), si la tiene.

**Una sola tarea a la vez.** Antes de coger una fila, baja `main` y mira la cola. Si hay una fila EN
CURSO que no es la que te han encargado retomar, no cojas ninguna: no toques nada y dile a la
persona qué fila está en curso y que vuelva a lanzar la suya cuando acabe. Su tarea sigue en la cola.
Manda sobre cualquier regla de `docs/COLA.md` que diga otra cosa, como «sáltala».

Lee código solo cuando lo necesites para la tarea. No leas la historia ni documentos antiguos
salvo que la instrucción lo pida.

## 2. La instrucción manda

1. Se programa solo lo que dicen, en la instrucción de la fila, «Lo que escribió <persona>», «Lo
   que entendió Claude» y la pantalla de prueba (`docs/pantallas/<nº>.html`), si la hay. Nada de
   mejoras de paso. Una pantalla de prueba ligera solo dice qué hay y dónde va: los colores, letras
   y botones son los de la app.
2. «Notas técnicas de Claude» solo dice **cómo** se programa. Si una nota cambiara lo que ve o
   hace la usuaria y eso no está en el texto ni en la pantalla de prueba, no se programa: se
   pregunta (apartado 3.A).
3. Lo de «Qué NO se hace en esta tarea» no se programa.
4. Instrucciones antiguas con «Ficha del cambio» (antes del 29-oct-2026): si la tarea no se ha
   empezado y cambia lo que ve o hace la usuaria, no se programa; vuelve a IDEA para pasar por el
   recorrido nuevo (decidido por Francisco el 30-oct-2026). Si ya estaba programada (DEVUELTA o a
   medias), se termina con su ficha, y lo que esté en «Pendiente» no se programa. Una lista «Cómo
   sabemos que está bien» sirve de guía al segundo revisor; nunca se le pide a Francisco.
5. Las filas IDEA y EN DISEÑO no son trabajo: nunca se cogen, ni se marcan, ni se estiman, ni se
   mueven. «La primera PENDIENTE» se cuenta saltándolas.

## 3. Cuándo se para la sesión

**A. Pregunta para la persona** (Francisco u otra), solo en un caso: aparece algo que la
instrucción no cubre y que **cambia lo que ve o hace la usuaria**.

Una frase de lanzamiento o una regla de la app que diga «sin preguntarme nada» significa que la
sesión va sola: en ese caso no decide ella, deja la fila BLOQUEADA como se explica abajo.

Cómo se pregunta: en lenguaje llano, una sola pregunta, con las opciones numeradas y sus pros y
contras, **sin marcar ninguna como recomendada**. Si la persona está en la conversación, se le
pregunta allí. Si la sesión va sola, la fila pasa a BLOQUEADA con
«PREGUNTA PARA FRANCISCO: …», `main` no se toca y la sesión para. La respuesta se apunta en la
instrucción, en «Revisión y respuestas durante el trabajo».

**B. Atasco técnico** (no es para la persona): si un mismo arreglo falla **dos veces**, no se
sigue probando a ciegas.
1. Se apunta en la nota de la fila qué se intentó y qué falló, en pocas líneas.
2. La fila pasa a BLOQUEADA con «ATASCO PARA CLAUDE: <resumen en una línea>».
3. `main` no se toca y la sesión para. Lo revisa Claude en la siguiente conversación.

Las demás decisiones técnicas las toma la sesión y las deja escritas en la nota de la fila.

## 4. Aprender de los errores

1. Cuando un error **se repite** o **hace perder más de 15 minutos**, se apunta una línea en
   `docs/LECCIONES.md` de la app: qué falló · por qué, en una frase · qué hacer en su lugar.
2. Si la lección sirve para cualquier app (una herramienta que no funciona, un permiso que no
   existe), se apunta además en la nota de la fila con la etiqueta «LECCIÓN GENERAL», para que
   Claude la pase al método.
3. Si una lección ya no es cierta, se corrige o se borra esa línea, no se añade otra debajo.
4. `docs/LECCIONES.md` no pasa de 60 líneas: si crece, se resume.

## 5. Ahorro de tiempo y de cuota

1. **Pruebas parciales mientras se trabaja** (solo lo tocado, con la orden que diga `CLAUDE.md`).
   **La pasada completa, una vez justo antes de subir; si tarda más de 10 minutos, una vez al día**
   (norma de Francisco, 22-oct-2026):
   - `docs/PASADA-DIARIA.md` guarda una sola línea viva, que se sustituye cada vez:
     `Última pasada completa: <fecha y hora de Madrid> · <minutos> min · <verde | con fallos> · commit <sha corto de main>`.
     Si no existe, la primera sesión que haga una pasada completa lo crea.
   - **Pasada corta** (10 minutos o menos, o sin dato todavía): la completa, una vez justo antes de
     subir. Al terminarla se apunta cuánto ha tardado.
   - **Pasada larga** (más de 10 minutos): al empezar la sesión, si la fecha apuntada no es la de
     hoy (hora de Madrid), lo primero es la pasada completa sobre `main` recién bajado, antes de
     tocar la fila, y se apunta el resultado. Si una prueba falla, se repite a solas: si a solas
     pasa, es fallo de carga, se apunta en una línea y no cuenta; si también falla, se añade la fila
     «Arreglar la prueba <nombre>, que falla en la pasada diaria del <fecha>» encima de todas las
     PENDIENTE y DEVUELTA, y esta sesión trabaja esa fila. Durante la fila, solo
     las pruebas de lo tocado y las fijas que obligue `CLAUDE.md`; no se repite la pasada completa
     antes de subir. Si la sesión hace varias filas seguidas, una sola pasada, al principio. Si en
     el día no se lanza ninguna fila, no hay pasada.
   - El mensaje final de la primera fila del día empieza con «Pasada completa del día: <minutos>
     min, <en verde | con N fallos, arreglo apuntado el primero>.»; las demás no la mencionan.
   - La frontera de 10 minutos se mira siempre con la última medida.
   - Si en la pasada falla una prueba que no tiene que ver con el cambio y a solas pasa, se aparta,
     se dice en una línea de la nota y se sigue. Nunca se sube con pruebas en rojo.
2. No se espera ni se persigue a GitHub Actions si solo pasa pruebas, salvo que la publicación
   misma vaya por ahí.
3. Como mucho tres subidas por fila (EN CURSO, el cambio, HECHA), nunca fichero a fichero.
4. **Ficheros de código: tope de 400 líneas, pero nunca se parte uno en mitad de una tarea.** Un
   fichero nuevo nace por debajo del tope. Los que ya lo pasan solo se parten en una tarea aparte,
   sin cambiar nada de lo que ve la usuaria, que Claude apunta en la cola cuando un fichero grande
   se toca a menudo (decidido por Francisco el 7-nov-2026).
5. **Tamaño de la cola y del resumen.** `docs/COLA.md` no pasa de 40 KB (40.000 bytes según
   `wc -c`) y `docs/CONTEXTO-CORTO.md` no pasa de 160 líneas ni de 20 KB (20.000 bytes), porque
   lo leen todas las conversaciones de la app. Se actualizan sustituyendo la línea vieja, no
   añadiendo otra debajo.
   **Al marcar una fila HECHA**, en esa misma subida, la sesión los mide (`wc -c docs/COLA.md`,
   `wc -l -c docs/CONTEXTO-CORTO.md`) y, si alguno se pasa, lo reduce:
   - **Cola:** las filas HECHA, SUSTITUIDA y DESCARTADA salen de la cola y pasan, con su texto
     completo, a `docs/HISTORIA.md`. Las HECHA de hoy y de ayer se quedan un día más, porque el
     Centro de mando saca de la cola su «Terminado hoy». Las notas largas de las filas que siguen
     vivas se dejan en una línea; el detalle va a la instrucción de la fila. El formato de la cola
     (columnas, estados al principio, enlaces a sesiones) no cambia: el Centro de mando la lee así.
   - **Resumen:** lo que ya es pasado va a `docs/HISTORIA.md`; el detalle largo que sigue vigente
     va a `docs/CONTEXTO.md`, y en el resumen queda una línea que remite a él.
   - No se pierde ningún texto. Si `docs/HISTORIA.md` o `docs/CONTEXTO.md` no existen, se crean.
   - Si no se puede bajar del límite sin quitar algo vigente, se dice en la nota de la fila.
6. **La cola no pierde filas.** Antes de escribir en `docs/COLA.md`, baja `main`. Después de
   subir, comprueba que siguen todas las filas que había. Si falta alguna, la recuperas antes de
   seguir.
7. **Cómo se sube** (salvo que el `CLAUDE.md` de la app diga otra cosa, por ejemplo una rama por
   fila): directo a `main`, con `git pull --rebase origin main` y `git push origin HEAD:main`. Si
   git rechaza la subida a `main`, se sube a la rama `claude/...`, se abre una petición de cambios
   y se fusiona en ese momento (`merge_pull_request`), sin esperar a nadie: nunca se deja una
   abierta. Nunca se sube código con las herramientas de ficheros de GitHub (`create_or_update_file`,
   `push_files`): los ficheros grandes se cortan. Si git no puede subir de ninguna manera, la fila
   se queda EN CURSO y se dice en el mensaje final.
8. Tiempo: no se estima. Al marcar HECHA se escribe la hora de Madrid: `HECHA (26-oct-2026 14:05)`;
   lo que tardó cada fila sale de esa hora y de la subida que la marcó EN CURSO.

## 6. Segundo revisor, comprobar y publicar

1. **Segundo revisor, solo en las tareas grandes.** Una tarea es pequeña si su instrucción lo dice
   («Tarea pequeña»); todas las demás son grandes. En una grande, al terminar de programar, y antes
   de publicar, lanza otro ayudante (la herramienta de agentes) que no haya visto cómo se programó.
   Pásale solo: el texto de la persona, lo entendido por Claude, la pantalla de prueba si la hay,
   «Cómo lo comprueba el segundo revisor» y dónde están los cambios. Pídele que compare **lo que
   verá y hará la usuaria** con eso, punto por punto, y que diga también qué hace la app que el
   texto no pide. En una pequeña no hay segundo revisor: la sesión compara ella misma lo hecho con
   la instrucción y lo apunta igual que lo haría el revisor.
2. El revisor (o la sesión, en una tarea pequeña) escribe en la instrucción, en «Revisión y
   respuestas durante el trabajo», una línea por punto: coincide / no coincide y por qué / no lo he
   podido ver y por qué. Nunca da por bueno lo que no ha podido ver.
3. Lo que no coincide se corrige y el revisor vuelve a mirarlo. Lo que hace la app sin que el
   texto lo pida se quita. Si después de dos vueltas sigue sin coincidir, la fila pasa a
   BLOQUEADA con «ATASCO PARA CLAUDE».
4. Pruebas: las que se necesiten para lo tocado, más una comprobación general de que lo que ya
   funcionaba sigue funcionando.
   **Las pruebas nunca tocan los datos reales**: no se crea, cambia ni borra nada en los datos de
   verdad para probar. Si la app tiene copia de prueba, se prueba allí; su copia de los datos se
   saca de nuevo antes de probar, con los datos personales (nombres, teléfonos, correos,
   direcciones, documentos de identidad) cambiados por otros inventados, y cifras, fechas,
   productos e importes como están. Si no la tiene y algo solo se puede comprobar cambiando
   datos, no se cambia: el revisor lo deja como «no lo he podido ver» y por qué. Esto manda
   también sobre el `CLAUDE.md` de la app (decidido por Francisco el 30-oct-2026).
5. **Una fila solo es HECHA cuando está en `main`, publicada y comprobada** en la dirección real.
   Después de publicar, el revisor (o la sesión, en una tarea pequeña) mira la app publicada si
   puede entrar; si no puede, lo deja escrito. Si no se puede comprobar la publicación por una
   causa ajena, queda SIN PUBLICACIÓN COMPROBADA, con el motivo en una línea, no se empieza otra
   fila (salvo que el `CLAUDE.md` de la app diga que la cola sigue) y el mensaje final empieza con
   «AVISO: no he podido comprobar que los cambios estén publicados.» «En verde», en un mensaje a la
   persona, solo se dice si la publicación también lo está.
6. Al empezar cada sesión, lo primero es comprobar que la última publicación salió bien. Si está
   rota por nuestro código, arreglarla es lo único que se hace.
7. Una publicación por tarea. Cómo se publica en esta app lo dice su `CLAUDE.md`.
8. Si la persona dice que no ve un cambio, primero se comprueba si se publicó. Nunca se supone
   caché del navegador sin comprobarlo.
9. Mensaje final para la persona: qué ha quedado hecho, en una línea; qué no se pudo ver; y lo que
   dice «Qué mirar al terminar» de la instrucción, una cosa por línea. Si la instrucción no tiene
   ese apartado (instrucciones de antes del 7-nov-2026), la sesión lo escribe en ella a partir de
   lo hecho, en la subida que marca HECHA.

## Lecciones para Claude Code (de todas las apps)

Copia de las lecciones generales de `LECCIONES.md` del método que afectan a Claude Code.

| Qué no funciona | Por qué | Qué hacer en su lugar |
|---|---|---|
| Subir ficheros de código grandes con las herramientas de ficheros de GitHub | Se cortan al subir | Subir con git. Si git no puede, dejar la fila EN CURSO y decirlo |
| Crear repositorios desde la sesión | Las sesiones solo tienen permiso sobre sus propios repositorios | No se intenta; lo hace Claude desde la conversación (ver `LECCIONES.md` del método) |
