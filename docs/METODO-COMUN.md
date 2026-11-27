# Reglas comunes para Claude Code

> El original vive en el repositorio público `fmargon780/metodo-reglas` y solo se cambia allí.
> Cada app guarda una copia en `docs/METODO-COMUN.md`, que no se edita en la app: cada sesión la
> pone al día al empezar (apartado 0). Si una regla de este fichero choca con `CLAUDE.md` de la app, manda `CLAUDE.md` solo en lo
> propio de la app (cómo se publica, ramas, revisores técnicos propios, pruebas propias); en todo
> lo demás manda este fichero. El segundo revisor (apartado 6) se hace en todas las tareas grandes,
> también en las apps cuyo `CLAUDE.md` diga «sin revisor» o tenga un revisor propio: ese otro
> revisor es técnico y se suma, no lo sustituye. Tampoco puede el `CLAUDE.md` de la app permitir
> pruebas que toquen los datos reales (apartado 6.4).
>
> **Estas reglas mandan también sobre el encargo que abre la sesión.** El encargo solo dice qué
> fila o filas se hacen (apartado 1).

## 0. Antes de nada: poner al día estas reglas

La primera orden de cada sesión, antes de leer nada más, desde la raíz del repositorio de la app:

    curl -fsSL https://raw.githubusercontent.com/fmargon780/metodo-reglas/main/METODO-COMUN.md -o /tmp/METODO-COMUN.md && grep -q '^# Reglas comunes para Claude Code' /tmp/METODO-COMUN.md && cp /tmp/METODO-COMUN.md docs/METODO-COMUN.md

- Si funciona y `docs/METODO-COMUN.md` ha cambiado, lee la copia nueva y súbela junto con la
  primera subida de la fila (la marca EN CURSO).
- Si falla (sin red, GitHub no contesta), sigue con la copia que ya tiene la app y dilo en una
  línea en la nota de la fila. No es un atasco.
- `CLAUDE.md` de cada app repite esta orden en su primera línea, para que funcione aunque la
  copia sea antigua.

## 1. Al empezar cada sesión: qué fila y en qué orden

**Qué fila se hace.** La que nombra el encargo («haz la fila 214»), o las que nombra, en ese
orden (una serie, apartado 8). Si el encargo no nombra ninguna: la primera fila DEVUELTA o PENDIENTE, en el orden de la
cola, saltando las que no son trabajo (apartado 7). Ninguna otra.

**El orden.** Cada paso va antes que el siguiente:

1. Poner al día estas reglas (apartado 0).
2. Bajar `main` y mirar `docs/COLA.md`. **Una sola fila a la vez:** si hay una fila EN CURSO que
   no es la que te han encargado retomar, no cojas ninguna, no toques nada y dile a la persona qué
   fila está en curso y que vuelva a lanzar la suya cuando acabe. Su tarea sigue en la cola.
3. Comprobar que la última publicación salió bien. Si está rota por nuestro código, arreglarla es
   lo único que se hace.
4. Marcar la fila EN CURSO y subir ese cambio a `main`, antes de leer su instrucción o el código.
   Así se ve que hay una sesión trabajando.
5. Si la app es de pasada larga y hoy no se ha hecho, la pasada del día (apartado 5.1).
6. Leer solo esto: `docs/LECCIONES.md` de la app; la tabla «Lecciones para Claude Code» de este
   fichero; `docs/CONTEXTO-CORTO.md` (o `docs/CONTEXTO.md` si la app no tiene el corto); y la
   instrucción de la fila con su pantalla de prueba (`docs/pantallas/<nº>.html`), si la tiene.

**Retomar una fila.** Si está DEVUELTA, lee su nota y retómala desde lo que quedó hecho. Si está
EN CURSO porque la sesión anterior se paró, sube primero una nota en esa fila diciendo que la
retomas y sigue desde lo que ya hay en `main`.

Lee código solo cuando lo necesites para la tarea. No leas la historia ni documentos antiguos
salvo que la instrucción lo pida.

**Dos apps en una sesión.** Si el encargo nombra dos repositorios, la primera es la app de la
tarea y la segunda es solo la que la instrucción dice que se toca.
- La cola, la fila, su «EN CURSO» y su «HECHA», las reglas (apartado 0) y las lecciones son las de
  la primera app. En la segunda solo se escribe lo que la instrucción nombre; su cola no se toca.
- Si la segunda app no está disponible en la sesión, o se niega escribir en ella, la fila pasa a
  BLOQUEADA con «FALTA UN PERMISO: <qué falta y qué frase tiene que escribir la persona>» (apartado
  3.C), sin buscar rodeos.
- La marca `[toca a: <repositorio>]` de la fila dice cuál es la segunda app; solo la lleva una tarea
  que escribe en ella.

**Los mensajes de las subidas** empiezan por «Fila N:». Nunca por «Cola:», que es la marca de lo
que se sube desde una conversación de diseño o desde el Centro de mando.

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
   sabemos que está bien» sirve de guía al segundo revisor; nunca se le pide a la persona.
5. Las filas que no son trabajo (apartado 7) nunca se cogen, ni se marcan, ni se mueven.

## 3. Cuándo se para la sesión

**A. Pregunta para la persona**, solo en un caso: aparece algo que la instrucción no cubre y que
**cambia lo que ve o hace la usuaria**.

**La sesión nunca pregunta en su conversación**, esté o no la persona en la ventana (decidido por
Francisco el 18-nov-2026): la pregunta la escribe para Claude, que se la hace a la persona en
llano. La fila pasa a BLOQUEADA con «PREGUNTA PARA <nombre de la persona>: …» y la sesión para.
En la nota o en la instrucción: una sola pregunta, las opciones numeradas con sus pros y contras,
y cuál elegiría la sesión y por qué. La respuesta se apunta en la
instrucción, en «Revisión y respuestas durante el trabajo».

**B. Atasco técnico** (no es para la persona): si un mismo arreglo falla **dos veces**, no se
sigue probando a ciegas.
1. Se apunta en la nota de la fila qué se intentó y qué falló, en pocas líneas.
2. La fila pasa a BLOQUEADA con «ATASCO PARA CLAUDE: <resumen en una línea>».
3. Lo revisa Claude en la siguiente conversación. Si la sesión hacía una sola fila, para; si
   hacía una serie, sigue con las demás (apartado 8).

**C. Falta un permiso.** Si falta un permiso, o el sistema niega cualquier acción (editar
`CLAUDE.md`, un fichero de reglas o `.github/workflows`, arrancar un programa, abrir una dirección),
no se buscan rodeos ni se reintenta. **Tampoco se pregunta en la ventana de la sesión**, aunque la
persona esté: lo que se negó se deja escrito en un documento de `docs/` si es un cambio, y la fila
pasa a BLOQUEADA con «FALTA UN PERMISO: <qué se negó, y qué frase tiene que escribir la persona
para darlo>». La sesión acaba con el mensaje de 6.8. Sigue como en B.

**D. Tercer arreglo del mismo fallo.** Antes de empezar una fila DEVUELTA, o una que arregla lo
que hizo otra («de la fila N»), apartado 3 de `CUANDO-HACE-FALTA.md` (cómo se baja: final del
apartado 5).

Al bloquear una fila, el código a medias no se sube a `main`; lo único que se sube es la fila de
`docs/COLA.md` con su estado nuevo.

Las demás decisiones técnicas las toma la sesión y las deja escritas en la nota de la fila.

## 4. Aprender de los errores

1. **Lección de la app.** Cuando un error **se repite** o **hace perder más de 15 minutos** y la
   sesión sabe cómo evitarlo la próxima vez, apunta una línea en `docs/LECCIONES.md` de la app:
   qué falló · por qué, en una frase · qué hacer en su lugar.
2. **Tropiezo.** Si algo frena a la sesión, no es parte de la tarea y ella no lo puede evitar (una
   herramienta que no funciona, un permiso que no existe, algo que vale para cualquier app), añade
   una fila `IDEA (fecha · tropiezo)` (apartado 7) con el texto «Tropiezo (de la fila N): qué pasó
   y qué crees que lo evitaría, en dos frases». Si ya hay una para lo mismo, no añade otra. Si nada
   la frena, no escribe nada. Claude la resuelve en la siguiente conversación y, si vale para
   todas las apps, la pasa a estas reglas.
3. Si una lección ya no es cierta, se corrige o se borra esa línea, no se añade otra debajo.
4. `docs/LECCIONES.md` no pasa de 60 líneas: si crece, se resume.

## 5. Ahorro de tiempo y de cuota

1. **Pruebas parciales mientras se trabaja** (solo lo tocado, con la orden que diga `CLAUDE.md`).
   **La pasada completa, una vez justo antes de subir** (norma de Francisco, 22-oct-2026). Al
   terminarla, se sustituye la única línea de `docs/PASADA-DIARIA.md` (si no existe, se crea):
   `Última pasada completa: <fecha y hora de Madrid> · <minutos> min · <verde | con fallos> · commit <sha corto de main>`.
   - **Pasada larga:** si esa línea dice más de 10 minutos, la app es de pasada larga y la pasada
     va una vez al día, al empezar. Cómo: apartado 1 de `CUANDO-HACE-FALTA.md` (abajo). Las demás
     apps no lo leen.
   - Si falla una prueba que no tiene que ver con el cambio y a solas pasa, se aparta, se dice en
     una línea de la nota y se sigue. Nunca se sube con pruebas en rojo.
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
   añadiendo otra debajo. **Al marcar una fila HECHA**, en esa misma subida, la sesión los mide
   (`wc -c docs/COLA.md`, `wc -l -c docs/CONTEXTO-CORTO.md`). **La cola se mide también cada vez
   que una conversación del chat escribe en ella** (decidido por Francisco el 19-nov-2026: la
   encontró en 44 KB). Solo si alguno se pasa, lo reduce como dice el apartado 2 de
   `CUANDO-HACE-FALTA.md` (abajo).
6. **La cola no pierde filas y está bien escrita.** Antes de escribir en `docs/COLA.md`, baja
   `main` y toca solo tu fila. Antes de subir el cambio, pasa el programa que comprueba la forma
   de las filas (apartado 7) y que no falta ninguna de las que había sin cerrar. **En dos órdenes
   separadas, una detrás de otra, sin mezclar nada más** (el sistema bloquea la orden larga que baja
   y ejecuta de golpe, 19-nov-2026):

       curl -fsSL https://raw.githubusercontent.com/fmargon780/metodo-reglas/main/comprueba-cola.js -o /tmp/comprueba-cola.js

       node /tmp/comprueba-cola.js docs/COLA.md

   Lo que diga que hay que arreglar se arregla antes de subir. Si no se puede bajar o no hay
   `node`, se sube igual y se dice en una línea en la nota de la fila. Después de subir, comprueba
   que siguen todas las filas que había; si falta alguna, la recuperas antes de seguir.
7. **Cómo se sube** (salvo que el `CLAUDE.md` de la app diga otra cosa, por ejemplo una rama por
   fila): directo a `main`, con `git pull --rebase origin main` y `git push origin HEAD:main`. Si
   git rechaza la subida a `main`, se sube a la rama `claude/...`, se abre una petición de cambios
   y se fusiona en ese momento (`merge_pull_request`), sin esperar a nadie: nunca se deja una
   abierta. Nunca se sube código con las herramientas de ficheros de GitHub (`create_or_update_file`,
   `push_files`): los ficheros grandes se cortan. Si git no puede subir de ninguna manera, la fila
   se queda EN CURSO y se dice en el mensaje final.
8. Tiempo: no se estima. Al marcar HECHA se escribe la hora de Madrid: `HECHA (26-oct-2026 14:05)`;
   lo que tardó cada fila sale de esa hora y de la subida que la marcó EN CURSO.

**`CUANDO-HACE-FALTA.md`** guarda lo que solo se necesita a veces (apartados 3.D, 5.1 y 5.5). Las apps no tienen copia: se baja cuando toca y se lee solo el apartado que se nombra.

    curl -fsSL https://raw.githubusercontent.com/fmargon780/metodo-reglas/main/CUANDO-HACE-FALTA.md -o /tmp/CUANDO-HACE-FALTA.md

Si no se puede bajar: la pasada completa va justo antes de subir, como en una app corta; la cola y
el resumen se quedan sin reducir; un arreglo se trata como una fila más.
Se dice en una línea en la nota de la fila.

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
   BLOQUEADA con «ATASCO PARA CLAUDE» (apartado 3.B). El revisor nunca deja una fila DEVUELTA: ese
   estado solo lo pone la persona.
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
   puede entrar; si no puede, lo deja escrito en la nota y la fila queda HECHA igual: no se abre
   ninguna comprobación más (decidido por Francisco el 27-nov-2026). Si no se puede comprobar la publicación por una
   causa ajena (por ejemplo, Vercel contesta 402 por el tope de publicaciones: no se reintenta),
   queda SIN PUBLICACIÓN COMPROBADA, con el motivo en una línea, y no se empieza otra fila (salvo en
   una serie, o si el `CLAUDE.md` de la app dice que la cola sigue). «En verde», en lo que se deja
   escrito, solo se dice si la publicación también lo está.
6. Una publicación por tarea, al terminar. Cómo se publica en esta app lo dice su `CLAUDE.md`.
7. Si la persona dice que no ve un cambio, primero se comprueba si se publicó. Nunca se supone
   caché del navegador sin comprobarlo.
8. **Mensaje final: solo la frase** «He terminado. Vuelve al Centro de mando.», sin nada escrito
   delante ni detrás: ni resumen, ni informe, ni lista de lo hecho (decidido por Francisco el
   18-nov-2026; aclarado el 19-nov-2026). La sesión no le habla a la persona: informa a Claude, por
   escrito.
   Lo que ha quedado hecho, lo que no se pudo ver y cualquier aviso (por ejemplo, el de 6.5) van
   en la nota de la fila y en «Revisión y respuestas durante el trabajo» de la instrucción. Si la
   instrucción no tiene «Qué mirar al terminar» (instrucciones de antes del 7-nov-2026), la sesión
   lo escribe en ella a partir de lo hecho, en la subida que marca HECHA.

## 7. La cola: cómo se escribe una fila y qué estados hay

Es el único sitio donde está escrito. Vale igual para Claude Code, para la conversación de diseño
y para el Centro de mando.

**La fila.** `docs/COLA.md` lleva una sola tabla, con esta cabecera:

    | Nº | Instrucción | Estado | Notas |

- Una fila por línea. Empieza y acaba con una barra y tiene cuatro casillas, ni una más ni una
  menos. Dentro de una casilla no se escribe ninguna barra; un salto de línea se escribe `<br>`.
- **Nº:** el siguiente al más alto de la cola. No se cambia nunca.
- **Instrucción:** el texto de la idea o el enlace a `docs/<nº>-<nombre>.md`. Si la fila arregla
  lo que hizo otra, el texto lo dice: «(de la fila N)» (apartado 3.D).
- **Estado:** empieza por el estado, en mayúsculas, y detrás su fecha entre paréntesis:
  `PENDIENTE (15-nov-2026)`. Lo que haya que añadir va dentro del paréntesis, detrás de « · »:
  `IDEA (15-nov-2026 · tropiezo)`. Un motivo corto va después, tras dos puntos:
  `DESCARTADA (15-nov-2026): ya lo hace la app`.
- **Notas:** lo demás, en una línea. El detalle va a la instrucción. Si la fila no se puede
  programar hasta que otra esté publicada, la nota dice «Necesita la fila N»: el Centro de mando no
  la lanza mientras la N no esté HECHA (o cerrada).
- Una fila nueva se añade al final. Cambiar el orden es mover la línea entera.
- **Tamaño:** quien escribe en la cola, también desde el chat, mide `wc -c docs/COLA.md` en esa
  subida; si pasa de 40 KB, la reduce ahí mismo (apartado 5.5).

**Los estados.** Son estos y ninguno más. Una fila con otro estado, o mal escrita, sale en
«Filas que no entiendo» del Centro de mando, y el programa del apartado 5.6 no la deja subir.

| Estado | Qué quiere decir | Quién lo pone |
|---|---|---|
| `IDEA` | Apuntada, sin diseñar. Con `· paso de <nombre>` es algo que solo puede hacer esa persona (apartado 9); con `· tropiezo`, algo que frenó a Claude Code (apartado 4) | Cualquiera |
| `DECIDIDA (fecha · tema)` | Un tema: varias ideas juntas, a la espera de diseño | Claude, al reflexionar |
| `EN TEMA N` | Idea que entró en el tema N | Claude, al reflexionar |
| `EN DISEÑO` | Se está diseñando en una conversación. En una app de dos personas, con el nombre: `EN DISEÑO (fecha, Marcos)` | Claude |
| `PENDIENTE` | Diseñada, con su instrucción, lista para programar. Si la nota dice «no antes del <fecha>», no se coge hasta ese día | Claude |
| `APLAZADA hasta <fecha>` | Lista, pero no se coge antes de esa fecha | Claude o la persona |
| `ESPERA A LA IDEA M` | No puede terminarse hasta que la fila M esté HECHA (apartado 9) | Claude Code |
| `EN CURSO` | Una sesión la está programando | Claude Code |
| `ESPERA TU VISTAZO` | Programada y a la vista en una dirección de prueba; no se publica hasta que Claude en el chat (o la persona) la mire. Solo en las apps cuyo `CLAUDE.md` trabaja así | Claude Code |
| `HECHA (fecha hora)` | En `main` y publicada. **Cierra la fila**: no se espera nada más de ella (decidido por Francisco el 27-nov-2026). Lo que se vea después, en la app real o en un aparato, es una fila nueva: una `IDEA` con «Fallo (de la fila N): qué pasa» si no es lo acordado, o la idea que sea; si solo puede hacerlo la persona, un paso (apartado 9). La nota no lleva «mirada», «vista (» ni «te queda»; las notas que ya los llevan quedan como historia y la página no los lee | Claude Code |
| `SIN PUBLICACIÓN COMPROBADA` | Terminada, pero no se pudo comprobar la publicación (apartado 6.5) | Claude Code |
| `BLOQUEADA` | Parada. La nota empieza por «PREGUNTA PARA <nombre>», «ATASCO PARA CLAUDE» o «FALTA UN PERMISO» (apartado 3) | Claude Code |
| `DEVUELTA` | La persona miró la app y no es lo acordado. La nota dice qué falla | La persona, o Claude en su nombre |
| `SUSTITUIDA` | Ya no cuenta por sí sola. Un tema diseñado: `SUSTITUIDA (fecha): diseñado en las filas N a M`. Sus ideas: `SUSTITUIDA (fecha): diseñada en el tema N` | Claude |
| `DESCARTADA (fecha): motivo` | No se hará | Claude o la persona |

**Lo que el Centro de mando lee de una fila** (lo escribe Claude en el chat, en llano; Claude Code
no lo toca, salvo las marcas que ya mandan estas reglas):
- **Un tema:** «Tema: <título llano>. Para qué: <una o dos frases>. [orden: N · motivo]». Ningún
  tema se aparca. Diseñado, queda `SUSTITUIDA (fecha):
  diseñado en las filas N a M`.
- **Una parte de un tema:** la nota empieza por «parte de N · «<título llano>»». Una tarea
  diseñada sola: la nota empieza por ««<título llano>» · para qué: <frase>».
- **Un arreglo de una parte** dice «(de la fila N)» en su texto (apartado 3.D); sin eso y sin tema,
  es un arreglo suelto.
- **Lo que se le pide a la persona:** en la nota, «te pido: <frase llana>» y, si solo se puede en
  un sitio, `[solo en: <sitio>]`. También cuenta una IDEA «paso de <nombre>».

**No son trabajo para Claude Code:** IDEA, DECIDIDA, EN TEMA, EN DISEÑO, APLAZADA con fecha por
llegar, PENDIENTE con «no antes del» una fecha por llegar, ESPERA A LA IDEA cuya idea no esté
HECHA, una fila con «Necesita la fila N» y la N sin HECHA, ESPERA TU VISTAZO y todas las cerradas.

## 8. Series de filas

Una sesión puede hacer varias filas seguidas si el encargo las nombra (decidido por Francisco el
5-nov-2026).

1. De una en una y en el orden del encargo; nunca dos a la vez. Cada fila se marca EN CURSO, se
   hace y se termina como cualquier otra (segundo revisor si es grande, publicada, comprobada y
   HECHA) antes de pasar a la siguiente. No se coge ninguna fila que el encargo no nombre.
2. **`docs/PARAR.md`.** Antes de la primera fila se escribe en él «SEGUIR · filas N, M y P», con
   las filas del encargo en su orden, y se sube; si no existe, se crea. El Centro de mando lo lee
   para enseñar la tanda. Antes de empezar cada fila nueva se baja `main` y se mira: si dice
   «PARAR», se cambia a «SEGUIR · filas N, M y P» (las mismas filas), se sube y no se empieza
   ninguna fila más. Si la serie se para por otra causa (punto 3), la línea se queda como está.
   Solo cuando se han hecho todas las filas se deja «SEGUIR» solo.
3. **La serie se para del todo** solo en estos casos: una fila queda BLOQUEADA con «PREGUNTA
   PARA», hace falta algo que solo puede hacer la persona, o la publicación sale rota por nuestro
   código. Las filas que falten siguen en la cola como estaban. La sesión no le pregunta nada a la
   persona: lo deja escrito (apartado 3.A).
4. **La serie sigue** si una fila queda BLOQUEADA con «ATASCO PARA CLAUDE» o «FALTA UN PERMISO»,
   o SIN PUBLICACIÓN COMPROBADA: se deja así y se pasa a las demás, saltando sin tocarlas las que
   necesiten esa fila.
5. Al acabar, qué filas se han hecho, cuáles no y por qué se ha parado se escribe en la nota de
   cada fila. El mensaje final es el mismo de 6.8.

## 9. Lo que solo puede hacer la persona

Si al terminar queda algo que solo la persona puede hacer (pegar código en Apps Script, poner una
clave, dar un permiso, decidir algo):

1. Se añade una fila `IDEA (fecha · paso de <nombre>)`. Su texto empieza por «Paso de <nombre>
   (de la fila N):» y dice en llano qué tiene que hacer, con el enlace directo a la página donde
   tiene que hacerlo. Si las instrucciones están en un fichero del repositorio, se escribe su ruta
   y se sube a `main`. La persona lo resolverá con Claude en una conversación aparte.
2. No se apuntan comprobaciones («abre la app y mira que…»), ni copias entre repositorios, ni
   nada que pueda hacer Claude. Si ya hay una fila de paso para lo mismo, no se añade otra.
3. Si la fila no puede quedar terminada sin ese paso, queda `ESPERA A LA IDEA M (fecha)` en lugar
   de HECHA (M es el número del paso), con todo lo demás terminado y en la nota qué falta. Lo
   mismo con cualquier fila PENDIENTE que no pueda funcionar sin ese paso. El Centro de mando la
   devuelve sola a las pendientes cuando la fila M está HECHA.

Es el único camino: no se usan `docs/TE-TOCA.md` ni marcas en las notas.

## 10. Si la persona escribe en la sesión

La persona no habla con la sesión: le cuenta a Claude lo que vea (decidido por Francisco el
18-nov-2026). Si aun así escribe después del mensaje final, la sesión no programa nada más:
1. Apunta lo que dijo, tal cual, en la nota de la fila. Si es que falla algo de lo que hizo la
   fila, la pasa a DEVUELTA con esa frase.
2. Sube solo ese cambio de `docs/COLA.md` y contesta: «Lo he apuntado. Vuelve al Centro de mando.»

Lo que llegue después de acabar y no sea de la persona (avisos de GitHub, notificaciones de
publicación o de revisión) no se contesta con texto ni se apunta: la sesión ya terminó.

## Lecciones para Claude Code (de todas las apps)

| Qué no funciona | Por qué | Qué hacer en su lugar |
|---|---|---|
| Subir ficheros de código grandes con las herramientas de ficheros de GitHub | Se cortan al subir | Subir con git. Si no hay git que funcione, decirlo y parar antes de subir código; la fila se queda EN CURSO |
| Crear repositorios desde la sesión | Las sesiones solo tienen permiso sobre sus propios repositorios | No se intenta; se apunta como paso de la persona (apartado 9) |
