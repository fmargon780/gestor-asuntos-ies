# Cada problema, con su solución (fila 291)

Cerrado con Francisco el 6-oct-2026. Segunda de tres filas del mismo diseño. Va después de la 288
(`docs/AJUSTES-EN-CUATRO-PESTANAS.md`), que crea la pestaña «Problemas». La tercera es la 292
(`docs/PROBLEMAS-QUE-SE-PUEDEN-ARREGLAR.md`).

## Qué pasó

Francisco, sobre los avisos de Ajustes: «no sé qué hacer (hitos huérfanos, carpetas
incorrectas…)». Preguntado, las «carpetas incorrectas» son el aviso «Fichas sin carpeta».

Ese aviso ya tiene dos botones, pero no dice cuál es el normal ni qué pasa al pulsarlos. «Hitos
huérfanos» solo deja borrar. Otros avisos solo informan, o mandan a leer un documento del
repositorio, que él no ve. Y varios solo se descubren entrando en Ajustes.

## Qué quiere Francisco

«Es fundamental que los avisos de problemas lleven asociada la explicación clara de su solución.»
Aceptó este esquema, con este ejemplo, el 6-oct-2026:

> **3 asuntos han perdido su carpeta**
> **Qué pasa:** la app tiene apuntado el asunto, pero no encuentra su carpeta en Dropbox.
> **Por qué:** alguien cambió el nombre de la carpeta o la movió a mano, fuera de la app.
> **Qué hacer**, asunto por asunto:
> - **Buscar su carpeta** (lo normal): […]. Si aciertas, el asunto queda como estaba, con sus hitos.
> - **El asunto ya no existe**: se quita de la lista. Queda una copia […], por si era un error.

## Qué hay que hacer

### 1. El esquema, igual para todos

En la pestaña «Problemas», cada problema es una tarjeta, siempre abierta (no se pliega), a todo el
ancho. Lleva, en este orden:

1. **Título**: una frase con el número y sin palabras del código. Nunca «huérfano», «ficha»,
   «envoltura», «json» ni nombres de fichero.
2. **Qué pasa:** una o dos frases.
3. **Por qué:** una frase. Si no se sabe, «No se sabe por qué; no es por nada que hayas hecho.»
4. **Qué hacer:** las acciones. Cada una es un botón y, a su lado, una frase que dice **qué
   ocurre al pulsarlo y si tiene vuelta atrás**. La acción normal va la primera y lleva «(lo
   normal)». Si el problema tiene varios elementos, la lista va debajo, con los botones en cada
   línea.

Reglas para todos los textos:

- Palabras de `docs/VOCABULARIO.md`. Una idea por frase.
- Ningún aviso manda a leer un documento del repositorio. Si hay pasos, van en pantalla, numerados.
- Si arreglarlo no está en manos de quien mira (hay que tocar el script de Google, por ejemplo),
  se dice: «Esto lo hace quien montó la aplicación.» y se ofrece «Avisar por Soporte», que abre el
  cuadro de Soporte con el texto del problema ya escrito.
- En solo consulta, las tarjetas se ven y los botones que cambian algo salen apagados.
- Al arreglar el último elemento, la tarjeta desaparece sola. Sin tarjetas: «Todo en orden. No hay
  nada que arreglar.»

### 2. Las tarjetas

El orden es el de esta lista. Cada tarjeta sustituye a la sección o al texto suelto que hay hoy
(las secciones «Fichas sin carpeta», «Hitos huérfanos», «Conflictos de Dropbox», «Envolturas de
la aplicación» y «Plazo de conservación cumplido» dejan de existir como secciones plegables). La
lógica de detectar y de arreglar es la que ya hay: aquí cambian los textos y la forma. Los botones
que hacen algo nuevo son de la fila 292.

**a) Fichero de alumnado** (hoy: aviso de `js/frescura.js`)

- Título: «Falta el fichero de alumnado» o «El fichero de alumnado tiene N días».
- Qué pasa: «Los datos de contacto del alumnado y de sus familias pueden estar anticuados.» (o
  «No se puede buscar alumnado ni ver su contacto.» si falta).
- Por qué: «El fichero se baja de Séneca a mano y en esta época del curso cambia a menudo.»
- Qué hacer: **Traer el alumnado** (lo normal): «Abre Herramientas, donde se sube el fichero
  nuevo.» · **Ya lo he bajado, vuelve a mirar**: «Comprueba otra vez la fecha del fichero.»

**b) Asuntos que han perdido su carpeta** (hoy: «Fichas sin carpeta»)

- Título: «N asuntos han perdido su carpeta» (o «1 asunto ha perdido su carpeta»).
- Qué pasa y Por qué: los del ejemplo de arriba.
- Qué hacer, por cada asunto (su nombre, su hito actual y cuántas notas tiene):
  **Buscar su carpeta** (lo normal): «Eliges la carpeta que es ahora la suya. El asunto queda como
  estaba, con sus hitos y sus notas.» · **El asunto ya no existe**: «Se quita de la lista. Queda
  en las copias de seguridad durante N días, por si era un error.» (N, la caducidad de las copias
  que haya puesta en Ajustes).
- Si no hay ninguna carpeta sin asunto donde enlazar, «Buscar su carpeta» no falla en rojo: dice
  «No hay ninguna carpeta sin asunto. Puede que la carpeta se haya borrado o esté fuera de la
  carpeta de asuntos abiertos. Si la encuentras, devuélvela a su sitio y vuelve a mirar.»

**c) Hitos de asuntos que ya no existen** (hoy: «Hitos huérfanos»)

- Título: «Hay hitos guardados de N asuntos que ya no existen con ese nombre».
- Qué pasa: «La app guarda los hitos de cada asunto junto al nombre de su carpeta. Estos nombres
  ya no corresponden a ninguna carpeta.»
- Por qué: «El asunto cambió de nombre hace tiempo, o su carpeta se movió a mano.»
- **No se enseñan aquí los que son de un asunto de la tarjeta b)**: se arreglan solos al buscarle
  su carpeta. Si todos son de esos, esta tarjeta no sale.
- Qué hacer, por cada nombre (el nombre viejo y cuántos hitos tiene): **Quitar**: «Borra esos
  hitos. Quedan en las copias de seguridad durante N días.» Encima de la lista, mientras no esté
  la fila 292: «Si reconoces el asunto, no los quites todavía.»
- Comprobar antes cómo se calcula hoy (`huerfanos()` en `js/asunto-renombrar.js`): mira
  `App.E.listaArchivo`, que puede estar sin leer. Tiene que usar la misma fuente que las fichas
  sin carpeta (el índice del ARCHIVO, `js/fichas-huerfanas.js`), para no dar por perdido lo de un
  asunto archivado.

**d) Dos ordenadores guardaron a la vez** (hoy: «Conflictos de Dropbox»)

- Título: «N cosas se guardaron a la vez en dos ordenadores».
- Qué pasa: «Dropbox ha guardado dos versiones y la app no ha podido unirlas sola.»
- Por qué: «Dos personas cambiaron lo mismo casi en el mismo momento.»
- Qué hacer, por cada una (qué es, en palabras: «la lista de asuntos», «el tablón», «los hitos»…):
  los dos botones de hoy, con su frase: «Se queda la de este ordenador. La otra se guarda en las
  copias de seguridad.» y al revés. Ninguno lleva «(lo normal)».

**e) Asuntos archivados que han cumplido su plazo de conservación** (hoy: «Plazo de conservación
cumplido»)

- Los textos de hoy ya explican cada botón: se pasan al esquema sin cambiar lo que dicen.

**f) Una parte de la aplicación no se ha cargado bien** (hoy: «Envolturas de la aplicación»)

- Qué pasa: «Algunas funciones pueden no responder.» Por qué: el de «No se sabe por qué».
- Qué hacer: **Recargar la página** (lo normal): «Vuelve a cargar la aplicación. No se pierde nada
  guardado.» · **Avisar por Soporte**: «Si al recargar sigue saliendo.» El detalle técnico de hoy
  queda dentro de un «Ver el detalle» plegado, y viaja en el aviso de Soporte.

**g) No llegan correos a la bandeja** (hoy: la línea «Último correo recogido: hace N días…» de
«Bandeja de correos»; con la misma condición que la hace salir hoy)

- Qué pasa: «Hace N días que no entra ningún correo en «Ha llegado».» Por qué y Qué hacer: los
  pasos que hoy se dan por sabidos, escritos en pantalla y numerados. Lo que sea del script de
  Google: «Esto lo hace quien montó la aplicación.» y «Avisar por Soporte».

**h) El envío de correo está anticuado** (hoy: «El script de Gmail es más antiguo que la app…
Vuelve a pegarlo: docs/ENVIO-CUENTA-DEL-SCRIPT.md»)

- Qué pasa: «Los correos se siguen enviando, pero sin las últimas mejoras.» Qué hacer: «Esto lo
  hace quien montó la aplicación.», con los pasos de ese documento escritos en pantalla, y «Avisar
  por Soporte».

**i) La ruta más larga no cabe** (hoy: el texto sin botón de «Largo de las rutas»)

- Qué pasa: «Algún documento puede no guardarse en este ordenador porque su ruta completa es
  demasiado larga.» Por qué: el «Lo que más ocupa es …» de hoy. Qué hacer: lo que de verdad lo
  arregla, sacado de `js/largo-de-rutas.js` y `docs/` (acortar lo que más ocupa), con un botón
  «Ver las rutas» que lleva a su sección de «Este ordenador».

**j) Faltan cosas por configurar en este ordenador** (hoy: la marca «⚠ N por configurar» de la
barra lateral)

- Título: «Faltan N cosas por configurar en este ordenador». Qué hacer: **Verlas** (lo normal):
  «Abre la lista, con un botón «Arreglarlo» en cada una.» Abre el panel de la comprobación al
  entrar, que no cambia. Lo marcado como «No lo uso en este ordenador» no cuenta.

**k) Tareas de puesta a punto pendientes** (hoy: «N fichas por poner en orden», «N asuntos sin
guardar» en sus secciones, ahora en Herramientas)

- Una tarjeta por cada una que tenga algo pendiente, con Qué pasa en una frase y su botón de hoy,
  con lo que hace y la confirmación que ya tiene.

### 3. Que se vea sin entrar en Ajustes

- En el cuadro de avisos de Inicio, un trozo nuevo **«N problemas por resolver»** (N = número de
  tarjetas), ámbar, que lleva a Ajustes → «Problemas». Sustituye al trozo «N fichas sin carpeta».
  El trozo del fichero de alumnado se queda (puede ser urgente, en rojo) y al pulsarlo lleva a su
  tarjeta.
- En el menú, el botón «Ajustes» lleva el punto ámbar cuando hay alguna tarjeta, con el texto «N
  problemas por resolver» al pasar el ratón. Hoy solo cubre las fichas sin carpeta y solo se
  calcula al entrar en Ajustes: pasa a calcularse al entrar en la aplicación y en cada refresco de
  Inicio.
- El botón de la pestaña pasa a decir «Problemas (N)».
- La cuenta no puede costar: no se fuerza ninguna lectura del ARCHIVO, no se mira nada con un
  guardado en marcha, y lo caro se calcula como mucho cada diez minutos (como la papelera).

## Lo que no cambia

- Los avisos de trabajo de Inicio (vencidos, recurrentes, duplicados, papelera, apuntes de
  registro, tipos parecidos): no son problemas de la aplicación y se quedan donde están.
- El panel de la comprobación al entrar y la pantalla de entrada («Un fichero no se puede leer»).
- Los resúmenes ámbar de los títulos de sección («Faltan los festivos», «faltan N datos»).
- Qué detecta cada aviso, salvo la fuente de los hitos de la tarjeta c).

## Cómo hacerlo (orientación; decide la sesión)

- Un módulo nuevo y pequeño que pinta tarjetas a partir de una descripción (título, qué pasa, por
  qué, acciones, elementos) y lleva la cuenta. Cada módulo de aviso deja de pintar su sección y le
  pasa su descripción, igual que hicieron con `AvisosLinea.registrar` en la fila 193. Sin
  envolver nada: por un punto previsto.
- Cambios quirúrgicos en cada módulo: solo el trozo que pinta. No leas el repositorio entero.

## Ficheros

- `js/problemas.js`: nuevo. Las tarjetas, la cuenta y el punto de enganche.
- `js/problemas-textos.js`: nuevo, si hace falta para no pasar de 600 líneas. Los textos.
- `js/fichas-huerfanas.js`, `js/asunto-renombrar.js`, `js/conflictos.js`, `js/conservacion.js`,
  `js/envolturas-esperadas.js`, `js/frescura.js`, `js/bandeja-ajustes.js`, `js/correo-enviar.js`,
  `js/largo-de-rutas.js`, `js/comprobacion-entrada-ver.js`, `js/ficha-archivo.js`,
  `js/contacto-migracion.js`: solo lo que pinta el aviso.
- `js/ajustes-reparto.js`, `js/ajustes-plegado.js`: fuera las secciones de fallo (`FALLOS`).
- `js/avisos-que-faltan.js`, `js/avisos-linea.js`: el trozo nuevo de Inicio (y su sitio en `ORDEN`).
- `js/soporte.js`: poder abrir el cuadro con el texto ya escrito, si no se puede ya.
- `css/ajustes.css`: la tarjeta.
- `js/demo/datos.js`: que la demostración traiga, además de la ficha sin carpeta de la fila 288,
  unos hitos de un asunto que ya no existe, una cosa guardada a la vez en dos ordenadores y el
  fichero de alumnado viejo.
- `pruebas/`: se ponen al día `huerfanas.mjs`, `conflictos.mjs`, `plazo-de-conservacion.mjs` y las
  que busquen esas secciones por su título. Una prueba nueva, `pruebas/problemas.mjs`: cada
  tarjeta con sus cuatro partes, ningún texto prohibido en un título, la cuenta en la pestaña, en
  Inicio y en el menú, «Todo en orden», solo consulta, y que los hitos de un asunto con ficha sin
  carpeta no salen en la tarjeta c).
- `js/novedades.js`: «En Ajustes → Problemas, cada aviso dice qué pasa, por qué y qué hacer, y
  cada botón explica qué ocurre al pulsarlo. Inicio avisa con «N problemas por resolver».»
- Al terminar: `docs/CONTEXTO-CORTO.md`, `docs/contexto/PANTALLA.md`, `docs/VOCABULARIO.md` (una
  línea: «problema», y que no se usan «huérfano» ni «ficha sin carpeta» en pantalla) y
  `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que cada aviso de «Problemas» dice qué pasa, por qué y qué hacer; que Inicio y
el menú avisan con el número; y qué puntos de la lista le tocan a él.

## Cómo sabemos que está bien

En la copia de demostración.

1. Abrir Inicio: en el cuadro de avisos sale «N problemas por resolver», y no sale «fichas sin
   carpeta». En el menú, «Ajustes» lleva un punto ámbar.
2. Pulsar «N problemas por resolver»: abre Ajustes en la pestaña «Problemas (N)», con N tarjetas.
3. Cada tarjeta lleva, a la vista y sin abrir nada, un título, «Qué pasa:», «Por qué:» y «Qué
   hacer:».
4. En ninguna tarjeta, ni en sus botones, salen las palabras «huérfano», «huérfana», «ficha sin
   carpeta», «envoltura», «json» ni el nombre de un fichero del repositorio.
5. En la tarjeta de los asuntos que han perdido su carpeta: cada asunto lleva «Buscar su carpeta
   (lo normal)» y «El asunto ya no existe», cada uno con una frase al lado que dice qué pasa al
   pulsarlo.
6. Pulsar «Buscar su carpeta», elegir una y aceptar: el asunto desaparece de la tarjeta y vuelve a
   salir en Inicio con sus hitos. El número de la pestaña, el de Inicio y el punto del menú bajan.
7. En la tarjeta de los hitos de asuntos que ya no existen no sale ningún asunto de los que están
   en la tarjeta de las carpetas perdidas.
8. En la tarjeta de lo guardado a la vez en dos ordenadores: cada línea dice qué es con palabras
   («la lista de asuntos», «el tablón»…) y sus dos botones llevan su frase.
9. En la tarjeta del fichero de alumnado, pulsar «Traer el alumnado»: abre Herramientas en esa
   sección.
10. Marcar «En este ordenador, solo consultar» y volver a «Problemas»: las tarjetas se ven y los
    botones que cambian algo están apagados. Desmarcarlo.
11. Arreglar o quitar todo lo que quede: la pestaña dice «Todo en orden. No hay nada que
    arreglar.», se llama «Problemas» sin número, y desaparecen el trozo de Inicio y el punto del
    menú.
12. Pulsar «Avisar por Soporte» en una tarjeta que lo tenga: se abre el cuadro de Soporte con el
    texto del problema ya escrito.
13. **[SOLO FRANCISCO]** Con los datos del centro: abrir Ajustes → Problemas y decir si con cada
    tarjeta se entiende qué hacer sin preguntar a nadie.
