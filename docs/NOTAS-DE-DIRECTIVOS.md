# Las notas de los directivos en un asunto (fila 290)

Cerrado con Francisco el 6-oct-2026. Tercera de tres filas (287, 289 y 290). **Va después de la
289**: usa el perfil y la puerta para escribir de la 287, y el paso de documentos por el cuadro de
nombre que la 289 deja preparado.

## Qué pasa hoy

Cuando un directivo quiere añadir algo a un asunto abierto («aquí tienes el informe que faltaba»),
lo dice de palabra o por correo. Dentro del asunto no queda nada.

## Qué quiere Francisco

- Que un directivo pueda dejar una nota en un asunto suyo, con documentos si quiere.
- Que la nota quede en el asunto con su nombre.
- Que a Administración le salga un aviso en Inicio por cada nota nueva.
- Que eso sea lo único que un directivo puede añadir a un asunto.

## Palabras de este documento

- **Nota de directivo**: una nota de `ficha.notas` con `deDirectivo: true`. Lleva además `organo`,
  `documentos` (nombres de fichero) y, cuando Administración la ha visto, `vistaPor` y `vistaEl`.
- **Sin ver**: una nota de directivo sin `vistaPor`.

## Qué hay que hacer

### 1. El directivo deja la nota

- En la ficha de un asunto que ve, la tarjeta «Notas» lleva, solo para él, una caja **«Escribe una
  nota para Administración…»**, un botón **«Adjuntar documento»** y **«Enviar»**.
- «Enviar» guarda por `Perfil.escribir`:
  - los documentos, con su nombre original, en `_GESTOR/notas-directivos/<id>/`, donde `id` es la
    fecha y hora más `U.hueso` del nombre (sin contador);
  - la nota, por el camino de siempre (`App.anotarLista(nombre, 'notas', { anadir })`), con
    `{ texto, quien, cuando, deDirectivo: true, organo, documentos, carpeta: id }`.
- Sin texto no se envía. Aviso verde: «Nota enviada a Administración.». Si falla, el texto se queda
  en la caja.
- La nota sale en la lista de notas del asunto con su nombre y su órgano: «Jefa de estudios
  (Jefatura de Estudios)». Sus documentos se abren en el panel de lectura.
- El directivo no puede cambiar ni borrar notas, ni las suyas.
- No vale en el Archivo: en un asunto archivado no sale la caja.

### 2. Administración se entera

- Trozo nuevo en el cuadro de avisos de Inicio: **«N notas de directivos»**
  (`AvisosLinea.registrar('notas-directivos', …)`, con su sitio en `ORDEN`). Cuenta las notas sin
  ver de los asuntos abiertos. Pulsarlo filtra la tabla a esos asuntos, con «Filtrado por: … ✕
  Quitar», como los demás avisos.
- En la fila de la tabla de Inicio de un asunto con notas sin ver, una marca pequeña junto al
  tercero, con el texto de ayuda «Nota de un directivo sin ver».

### 3. Administración la atiende

- En la ficha, una nota de directivo sin ver sale resaltada, arriba de las demás, con:
  - **«Vista»**: le pone `vistaPor` y `vistaEl` (volviendo a guardar la misma nota: la identidad
    `cuando|texto` no cambia). Deja de contar en el aviso.
  - por cada documento, **«Guardar en el asunto»**: pasa por el cuadro de ponerle nombre, igual que
    los documentos de un encargo. Guardado el último, se borra su carpeta de espera.
- Marcarla «Vista» con documentos sin guardar avisa antes: «Tiene N documentos sin guardar en el
  asunto.», con «Guardarlos ahora» y «Marcar como vista de todos modos».
- Para contestar, Administración escribe una nota normal. El directivo la ve al abrir el asunto.
- Al **archivar** un asunto con notas de directivo sin ver, se pregunta antes: «Tiene N notas de
  directivos sin ver.», con «Verlas» y «Archivar de todos modos».

## Qué NO se toca

- Las notas de Administración: cómo se escriben, se cambian y se borran.
- El tablón.
- La identidad de una nota (`cuando|texto`).
- Un directivo sigue sin poder cambiar nada más de un asunto.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/PERFIL-DIRECTIVO.md`,
  `docs/ENCARGOS-DE-DIRECTIVOS.md`, `js/notas.js`, `js/avisos-linea.js` y `js/ficha-consulta.js`.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas. `js/notas.js` tiene 506: el
  código nuevo va en un módulo aparte, enganchado por un punto de `js/notas.js`.
- En modo consulta, la caja de la nota es el único control encendido de la ficha de un directivo:
  añádela a lo que `aplicarModoConsulta` deja pasar, sin abrir nada más.
- Un bloque que se repinta nunca tira lo que se está escribiendo en la caja
  (`U.conservandoLoEscrito`).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- La demostración trae un asunto abierto de Jefatura de Estudios con una nota de directivo sin ver,
  con un documento, y otro con una nota ya vista.
- Rama `fila-290`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs notas-de-directivos
  notas avisos-linea perfil encargos solo-consulta`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/notas-directivos.js`: nuevo (`NotasDirectivos`; mira antes que el nombre esté libre). La caja,
  el envío, contar las sin ver, «Vista» y «Guardar en el asunto».
- `js/notas.js`: solo el punto de enganche para pintar la caja y la nota resaltada.
- `js/ficha-consulta.js`: dejar encendida la caja para el directivo.
- `js/avisos-linea.js`: el `id` nuevo en `ORDEN`.
- `js/inicio-tabla.js`: la marca en la fila.
- Donde se archiva un asunto: la pregunta previa.
- `js/encargos-llegada.js` (o donde la fila 289 dejara el paso al cuadro de nombre): reutilizarlo.
- `css/…`, `js/novedades.js`, `js/demo/…`.
- `pruebas/notas-de-directivos.mjs`: nueva. Casos: un directivo envía una nota con un documento y
  queda en `ficha.notas` con `deDirectivo` y el documento en su carpeta de espera; sin texto no
  envía; la escritura pasa por `Perfil.escribir`; en un asunto archivado no sale la caja; el aviso
  cuenta las sin ver y filtra la tabla; «Vista» la quita del aviso sin duplicar la nota; «Guardar
  en el asunto» pasa por el cuadro de nombre y borra la carpeta de espera al terminar; «Vista» con
  documentos sin guardar avisa; archivar con notas sin ver pregunta; Administración no ve la caja
  de directivo; dos notas enviadas a la vez desde dos ordenadores quedan las dos.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/ASUNTOS.md`,
  `docs/contexto/PANTALLA.md`, `docs/VOCABULARIO.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que un directivo puede dejar una nota con documentos en un asunto suyo; que os sale
«N notas de directivos» en el cuadro de avisos de Inicio; que en la ficha la nota sale resaltada,
con «Vista» y con «Guardar en el asunto» en cada documento; y que al archivar un asunto con notas
sin ver la aplicación pregunta antes.

## Cómo sabemos que está bien

En la copia de demostración.

1. Entrar con `&usuario=Jefa de estudios de prueba` y abrir un asunto. En «Notas» hay una caja
   «Escribe una nota para Administración…», «Adjuntar documento» y «Enviar». Es lo único de la
   ficha que se puede usar para cambiar algo.
2. «Enviar» con la caja vacía: no envía y lo dice.
3. Escribir un texto, adjuntar un documento y enviar: aviso verde «Nota enviada a Administración.».
   La nota sale en la lista con «Jefa de estudios de prueba (Jefatura de Estudios)» y su documento.
4. No hay forma de cambiar ni de borrar esa nota desde esa sesión.
5. Abrir un asunto del Archivo: no hay caja de nota.
6. Entrar como «Revisor». El cuadro de avisos de Inicio dice «N notas de directivos». Pulsarlo:
   la tabla se queda con esos asuntos y sale «Filtrado por: … ✕ Quitar».
7. La fila del asunto del punto 3 lleva la marca de nota sin ver.
8. Abrirlo: la nota sale resaltada, arriba, con «Vista» y, en su documento, «Guardar en el asunto».
9. «Vista» sin guardar el documento: avisa de que tiene un documento sin guardar, con «Guardarlos
   ahora» y «Marcar como vista de todos modos».
10. «Guardarlos ahora»: se abre el cuadro de ponerle nombre. Al guardar, el documento está en los
    documentos del asunto.
11. «Vista»: la nota deja de estar resaltada, sigue en la lista una sola vez, y el número del aviso
    de Inicio baja.
12. En otro asunto con una nota sin ver, «Archivar»: pregunta antes, con «Verlas» y «Archivar de
    todos modos».
13. Como «Revisor», la tarjeta «Notas» no tiene la caja de directivo: tiene la de siempre.
14. Sin errores en la consola en ningún punto.
