# Los encargos de los directivos (fila 289)

Cerrado con Francisco el 6-oct-2026. Segunda de tres filas (287, 289 y 290). **Va después de la
287** y usa su perfil (`Perfil`) y su puerta para escribir (`Perfil.escribir`).

## Qué pasa hoy

Un directivo encarga las cosas a Administración de palabra o por correo. Administración crea el
asunto. Lo que se pidió, para cuándo y con qué papeles queda en la memoria de cada uno.

## Qué quiere Francisco

- Que el directivo deje el encargo dentro de la aplicación: qué pide, a quién afecta, para cuándo y
  con qué documentos.
- Que **el directivo no cree el asunto**. Elegir el tipo y el tercero es oficio de Administración.
  El encargo llega a «Ha llegado» de Inicio y Administración lo convierte en asunto.
- Que Administración pueda decir que un encargo no procede, con el motivo.
- Que el directivo vea en «Mis encargos» cómo va cada cosa que ha pedido, sin preguntar.

## Palabras de este documento

- **Encargo**: lo que un directivo pide a Administración desde la aplicación. No es un asunto hasta
  que Administración lo convierte. Al convertirlo, rellena «El encargo» de la ficha (`ficha.loPide`).
- **Sin atender / En marcha / Terminado / No procede**: cómo va un encargo, visto por el directivo.

## Qué hay que hacer

### 1. Dónde se guardan

- Fichero nuevo `_GESTOR/encargos.json`: `{ encargos: [ … ] }`. Cada encargo:
  `{ id, de, organo, cuando, texto, afecta, paraCuando, documentos, estado, asunto, motivo,
  atendidoPor, atendidoEl }`.
  - `id`: fecha y hora más `U.hueso` del nombre. **Sin contador**: dos ordenadores no pueden
    repartir el mismo número. No se enseña en pantalla.
  - `afecta`: `{ nombre, categoria, clave }` si se eligió del buscador, `{ texto }` si se escribió a
    mano, o nada.
  - `estado`: `sin-atender`, `asunto`, `terminado`, `no-procede` o `retirado`.
  - `asunto`: el número único del asunto (`A26-…`) y su nombre al atenderlo. Comprueba en
    `docs/contexto/NOMBRES-FIJOS.md` que el número se conserva al cambiar el asunto y al archivar.
- Los documentos adjuntos esperan en `_GESTOR/encargos/<id>/`, con su nombre original.
- Alta del fichero donde toca: `FICHEROS` de `js/copias.js`, `Copias.guardar` dentro de
  `App.enFila`, y **fusión automática por `id`** en `js/conflictos.js` (si los dos lados cambian el
  mismo encargo, gana el de `atendidoEl` más reciente, y un encargo atendido gana a uno sin atender).
  Fila nueva en `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- En la ficha del asunto, lista nueva `ficha.encargos`: `[{ id, de, cuando }]`, fundida por
  elemento con `App.anotarLista` (alta en `App.IDENTIDAD_LISTA`, identidad `id`). Es lo que
  `Perfil.veAsunto` ya mira desde la fila 287.

### 2. El directivo: «Nuevo encargo»

- Entrada nueva en su menú, debajo de «Inicio»: **«Nuevo encargo»**. Solo la ve un directivo.
- Pantalla a todo el ancho, sin desplazamiento, con cuatro cosas:
  1. **«¿Qué necesitas?»** Cuadro de texto grande. Obligatorio.
  2. **«¿A quién afecta?»** Opcional. El buscador único de «Nuevo asunto» (fila 197), pero cada
     resultado enseña solo el nombre y, en el alumnado, su unidad. Si no está, «No está en la
     lista» deja escribirlo a mano.
  3. **«¿Para cuándo?»** Opcional. Una fecha.
  4. **«Documentos»** Opcional. Soltar ficheros o elegirlos.
- Botón **«Enviar el encargo»**. Guarda por `Perfil.escribir`: los documentos en su carpeta y el
  encargo en `encargos.json`, con estado `sin-atender`. Aviso verde: «Encargo enviado a
  Administración.», y pasa a «Mis encargos».
- Si falla la escritura, el texto no se pierde: se queda en el cuadro, con el aviso rojo de siempre.

### 3. El directivo: «Mis encargos»

- Entrada nueva en su menú, debajo de «Nuevo encargo»: **«Mis encargos»**.
- Una tabla con sus encargos, del más nuevo al más viejo: **Fecha**, **Qué pedí** (el principio del
  texto; pulsarlo lo enseña entero con sus documentos), **A quién afecta**, **Para cuándo** y
  **Cómo va**:
  - «Sin atender», con un botón «Retirar» (pasa a `retirado` y sale de la tabla).
  - «En marcha · Hito N de M · título». Pulsarlo abre la ficha del asunto, en consulta.
  - «Terminado».
  - «No procede: <motivo>».
- Se pone al día con el vistazo periódico de siempre, sin recargar.

### 4. Administración: el encargo llega

- La fila de Inicio pasa a decir «Ha llegado: N correos · N documentos por clasificar · **N
  encargos**». El trozo nuevo se resalta si hay alguno sin atender y abre «Ver todo» solo con los
  encargos (tercera clase junto a `correos` y `documentos`, con su «Ver también…»).
- En «Ver todo», los encargos sin atender van **arriba**, antes de la bandeja de correo. Cada uno es
  una tarjeta: quién lo pide y su órgano, cuándo, el texto entero, a quién afecta, para cuándo y sus
  documentos (se abren en el panel de lectura). Tres botones:
  1. **«Crear asunto con él»**. Abre «Nuevo asunto» por `App.nuevoAsuntoCon` con lo ya sabido: el
     tercero (si se eligió del buscador), la fecha límite («Para cuándo») y «Quién lo pide» (el
     directivo, con su órgano y el correo que tenga en `perfiles.json`). El tipo lo elige
     Administración.
  2. **«Guardar en un asunto que ya existe»**. El mismo selector de asunto que usan los documentos
     sueltos.
  3. **«No procede»**. Pide el motivo, obligatorio, y lo guarda.
- Al crear o al guardar en un asunto:
  - el encargo pasa a `asunto`, con el número y el nombre del asunto, quién lo atendió y cuándo;
  - se añade `{ id, de, cuando }` a `ficha.encargos`;
  - el texto queda como nota del asunto: «Encargo de <nombre> (<órgano>): <texto>»;
  - sus documentos pasan uno detrás de otro por el cuadro de ponerles nombre, como los adjuntos de
    un correo de la bandeja, y al terminar se borra `_GESTOR/encargos/<id>/`.
- Con el correo del directivo en «Quién lo pide», los avisos de avance y de cierre que ya existen
  (fila 195) le llegan solos. No hay que tocarlos.

### 5. Lo que le pasa después al asunto

Lo escribe la sesión de Administración que hace el cambio, nunca la del directivo:

- Al **archivar** un asunto con `ficha.encargos`: esos encargos pasan a `terminado`. Al **reabrir**,
  vuelven a `asunto`.
- Al mandarlo a la **papelera**: pasan a `no-procede`, motivo «El asunto se ha borrado». Al
  recuperarlo, vuelven a `asunto`.
- Al **unir** o **cambiar** el asunto, `ficha.encargos` viaja con la ficha (`AsuntoRenombrar`) y el
  nombre guardado en el encargo se pone al día.

## Qué NO se toca

- «Nuevo asunto»: sus pasos, su buscador y su vista previa. Solo llega con más cosas ya sabidas.
- Los documentos sueltos y la bandeja de correo, salvo el sitio de la tercera clase.
- Los avisos a quien lo pide (fila 195).
- Un directivo sigue sin poder cambiar nada de un asunto.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/PERFIL-DIRECTIVO.md`,
  `docs/contexto/DOCUMENTOS.md` («Ver todo»), `docs/contexto/ASUNTOS.md` («Nuevo asunto» y «Lo
  pide») y los ficheros de la lista de abajo.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas. Rozan el tope
  `js/documentos-sueltos.js` (538), `js/asuntos-lista-pintar.js` (555) y `js/nucleo.js` (656): ahí,
  solo la llamada; el código va en los módulos nuevos.
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Un bloque que se repinta nunca tira lo que se está escribiendo (`U.conservandoLoEscrito`): el
  cuadro de «¿Qué necesitas?» sobre todo.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. Añade ahí «encargo» y sus cuatro
  estados.
- La demostración trae cuatro encargos de «Jefa de estudios de prueba»: uno sin atender con un
  documento y un alumno elegido, uno en marcha, uno terminado y uno que no procede. Y uno sin
  atender de «Directora de prueba».
- Rama `fila-289`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs encargos perfil
  inicio por-clasificar lo-pide conflictos solo-consulta`); la pasada completa, una sola vez al
  final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/encargos.js`: nuevo (`Encargos`; mira antes que el nombre esté libre). Leer, guardar, cambiar
  de estado, encontrar el asunto de un encargo y su hito actual.
- `js/encargos-nuevo.js`: nuevo. La pantalla «Nuevo encargo».
- `js/encargos-mios.js`: nuevo. La pantalla «Mis encargos».
- `js/encargos-llegada.js`: nuevo. Las tarjetas en «Ver todo» y sus tres botones.
- `js/inicio.js` (`pintarHaLlegado`): el tercer trozo.
- `js/asuntos-lista-montones.js` (`App.irVista`) y `css/inicio.css`: la tercera clase, `encargos`.
- `js/bandeja-guardar.js` o el módulo que lleve los adjuntos de la bandeja al cuadro de nombre: solo
  si hace falta abrirle un punto para reutilizarlo.
- `js/lo-pide.js`: solo si `App.nuevoAsuntoCon` no admite ya «Quién lo pide» relleno.
- Donde se archiva, se reabre, se manda a la papelera y se recupera un asunto: la llamada del punto 5.
- `js/asunto-renombrar.js`: el nombre guardado en el encargo.
- `js/copias.js`, `js/conflictos.js`, `js/nucleo.js` (`App.IDENTIDAD_LISTA`): las altas.
- `js/barra.js`, `index.html`, `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/encargos.mjs`: nueva. Casos: un directivo envía un encargo y queda `sin-atender` con sus
  documentos en su carpeta; sin texto no deja enviar; la escritura pasa por `Perfil.escribir` y
  ninguna otra escritura del directivo pasa; «Ha llegado» cuenta el encargo; «Crear asunto con él»
  llega a «Nuevo asunto» con tercero, fecha límite y quién lo pide; al crear, estado `asunto`,
  `ficha.encargos`, nota y documentos por el cuadro de nombre; «Guardar en un asunto que ya existe»
  hace lo mismo sin crear; «No procede» exige motivo; «Mis encargos» enseña los cuatro estados y
  «Retirar» solo en el primero; archivar, reabrir, papelera y recuperar mueven el estado; cambiar el
  asunto no rompe el enlace; el encargo de otro directivo no sale en «Mis encargos»; conflicto de
  `encargos.json` fundido por `id`.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/DOCUMENTOS.md`,
  `docs/contexto/ASUNTOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/VOCABULARIO.md` y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que un directivo tiene en su menú «Nuevo encargo» y «Mis encargos»; que el encargo
os aparece en «Ha llegado» de Inicio, con «Crear asunto con él», «Guardar en un asunto que ya
existe» y «No procede»; que al crear el asunto llegan ya puestos el tercero, la fecha límite y quién
lo pide; y que el directivo ve en «Mis encargos» por qué hito va cada cosa.

## Cómo sabemos que está bien

En la copia de demostración.

1. Entrar con `&usuario=Jefa de estudios de prueba`. El menú tiene «Inicio», «Nuevo encargo», «Mis
   encargos» y «Archivo».
2. «Nuevo encargo»: con «¿Qué necesitas?» vacío, «Enviar el encargo» no envía y lo dice.
3. Escribir un texto, buscar un alumno en «¿A quién afecta?» (el resultado enseña solo nombre y
   unidad), poner una fecha, adjuntar un documento y enviar: aviso verde «Encargo enviado a
   Administración.» y se abre «Mis encargos» con el encargo nuevo arriba, «Sin atender».
4. «Mis encargos» enseña también uno «En marcha · Hito … de …», uno «Terminado» y uno «No procede:
   …». No sale el de la Directora de prueba.
5. Pulsar el que está en marcha: se abre la ficha de su asunto, sin ningún botón que cambie algo.
6. «Retirar» en uno sin atender: desaparece de la tabla.
7. Entrar como «Revisor». En Inicio, «Ha llegado» dice también «N encargos», resaltado.
8. Pulsar «N encargos»: «Ver todo» enseña solo los encargos, cada uno con quién lo pide, su texto,
   a quién afecta, para cuándo, sus documentos y tres botones.
9. «Crear asunto con él»: «Nuevo asunto» llega con el tercero ya elegido, la fecha límite puesta y
   quién lo pide relleno. Elegir un tipo y crear: se abre el cuadro de ponerle nombre al documento
   adjunto. Al terminar, el asunto tiene una nota «Encargo de Jefa de estudios de prueba (Jefatura
   de Estudios): …» y el documento.
10. Volver a «Ver todo»: ese encargo ya no está. Con otro, «No procede» sin motivo no deja seguir;
    con motivo, desaparece.
11. Con otro, «Guardar en un asunto que ya existe»: se elige un asunto y queda la nota en él.
12. Entrar otra vez como la Jefa de estudios de prueba: en «Mis encargos», el del punto 9 está «En
    marcha» con su hito, y el del punto 10, «No procede» con el motivo. Ese asunto sale en su
    Inicio aunque el tipo elegido sea de otro órgano.
13. Como «Revisor», archivar el asunto del punto 9. Como la Jefa de estudios: «Terminado».
14. Sin errores en la consola en ningún punto.
