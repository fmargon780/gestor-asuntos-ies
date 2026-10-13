# Aviso cuando la recogida de correos está parada

Idea 336 de Francisco, diseñada con él el 13-oct-2026. Fila 336 de `docs/COLA.md`.

## De dónde sale esto

Francisco notó que no le llegaba ningún correo a la aplicación. Lo comprobado en la conversación:

- En su carpeta de Drive `GESTOR-BANDEJA` (cuenta `fmargon780@g.educaand.es`) la última ficha de
  correo es del 11-sep-2026. Desde entonces no entró ninguno.
- La aplicación sí seguía escribiendo `seguidos.json` en esa carpeta (13-oct-2026 a las 08:19).
- El proyecto de Apps Script «Gestor - Correos» se había borrado el 30-sep-2026 (estaba en la
  papelera de script.google.com). Sin proyecto no hay disparador de cada minuto, y nadie lo avisó.
- Además, Francisco tenía un filtro de Gmail que ponía la etiqueta `GESTOR` a todo el correo
  entrante. Lo quita: a partir de ahora **solo llegan los correos a los que él pone la etiqueta a
  mano** (más las respuestas a hilos ya enganchados a un asunto, que llegan solas como hasta ahora).
  Eso ya es lo que hace el sistema; no hay que cambiar nada para ello.

Francisco restaura el proyecto, quita el filtro y la etiqueta de los correos viejos y vuelve a
ejecutar `prepararTodo`. Eso no es trabajo de esta fila.

Lo que sí es de esta fila: **que no vuelva a pasar sin que nadie se entere.** El fallo duró un mes
porque la aplicación no tiene forma de saber que el recolector ha dejado de trabajar.

## Lo que se pide

### 1. El recolector deja una señal con la hora

En `apps-script/gestor-correos.gs`, al final de `recogerCorreos` (también si no había ningún
correo, y aunque algún hilo haya fallado), se escribe en la carpeta de la bandeja un fichero
`latido.json`:

    { "hora": "<fecha y hora ISO>", "version": VERSION_SCRIPT, "cuenta": "<correo de la cuenta>" }

- Un solo fichero, que se sobrescribe (no uno por vuelta). Si hay dos con ese nombre, se usa el
  primero y se mandan los demás a la papelera.
- Para no escribir en Drive cada minuto, se escribe solo si la última escritura tiene más de 10
  minutos (apuntada en `PropertiesService`).
- Que nunca rompa la vuelta: va dentro de su `try`, y si falla solo se apunta en el registro.
- Se sube `VERSION_SCRIPT` a `13-oct-2026 · fila 336`, para que el aviso de «script viejo» que ya
  existe le diga a Francisco que tiene que volver a pegarlo.

### 2. La aplicación avisa si la señal es vieja

En el módulo que lee la bandeja (`js/bandeja-correos.js`, o uno nuevo pequeño si ese fichero no
admite más líneas), al leer la carpeta de la bandeja se mira `latido.json`:

- **Señal de hace menos de una hora:** nada.
- **Señal de hace más de una hora, o no hay `latido.json`:** aviso en la franja de avisos de
  Inicio (`AvisosLinea.registrar`), con este texto o muy parecido:
  «La recogida de correos está parada desde <día y hora>. Los correos con la etiqueta GESTOR no
  llegan.» Si no hay fichero: «La recogida de correos no da señales: puede estar parada o sin
  actualizar.»
- Al pulsar el aviso se abre un cuadro corto con los pasos, cada uno con su enlace directo:
  1. Abrir https://script.google.com/home con la cuenta del centro y buscar «Gestor - Correos».
     Si no está, mirar la papelera: https://script.google.com/home/trash y «Restaurar».
  2. Abrirlo, elegir `prepararTodo` en el desplegable de arriba y pulsar «Ejecutar».
  3. Si la aplicación avisa de que el script es viejo, pegar antes `apps-script/gestor-correos.gs`
     (el enlace a ese fichero en GitHub, en crudo).
- Se vuelve a mirar cada 5 minutos mientras la aplicación está abierta. Cuando la señal vuelve a
  ser reciente, el aviso desaparece solo.
- Si la carpeta de la bandeja no está señalada en ese ordenador, no se avisa de nada (como hoy:
  sin bandeja, el módulo no enseña nada).
- Al abrir la aplicación, Drive puede tardar unos minutos en bajar el `latido.json` nuevo. Para no
  dar un aviso falso al encender el ordenador, el aviso no sale en los primeros 10 minutos desde
  que se abrió la aplicación.
- Los directivos en «solo consultar» (`Perfil`) no ven este aviso: no usan la bandeja.

### 3. En la copia de pruebas

La demo (`?demo=1`) tiene que poder enseñar los tres casos con un parámetro: señal reciente (sin
aviso), señal vieja (aviso con fecha) y sin fichero (aviso sin fecha). Por ejemplo `latido=viejo`
y `latido=ninguno`. Y sin esperar los 10 minutos del arranque.

### 4. Lo que no cambia

- La etiqueta `GESTOR`, `GESTOR/Hecho`, `seguidos.json` y todo lo demás del recolector.
- «Ha llegado» y «Ver todo».
- El envío de correos desde la aplicación.

## Para Francisco al terminar

Añadir a `docs/TE-TOCA.md`:

`- [ ] (fila 336 · <fecha>) Abre https://script.google.com/home con la cuenta del centro y entra en «Gestor - Correos». Borra todo el código, pega el de https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs y guarda. Elige «prepararTodo» arriba y pulsa «Ejecutar». Después: «Implementar» › «Gestionar implementaciones» › el lápiz › «Nueva versión» › «Implementar». A los diez minutos, el aviso de Inicio «La recogida de correos…» desaparece solo.`

Novedad visible (`js/novedades.js`): «Si la recogida de correos se para, Inicio te avisa y te dice
cómo arreglarlo.»

## Cómo sabemos que está bien

1. En la demo con `latido=viejo`, Inicio enseña el aviso «La recogida de correos está parada
   desde…» con una fecha.
2. En la demo con `latido=ninguno`, Inicio enseña «La recogida de correos no da señales…».
3. En la demo sin parámetro (señal reciente), no sale ningún aviso de recogida de correos.
4. Al pulsar el aviso se abre el cuadro con los pasos y sus enlaces (script.google.com/home, la
   papelera y el fichero en GitHub).
5. Entrando como directivo (`&usuario=<nombre de un directivo de la demo>`) con `latido=viejo`,
   no sale el aviso.
6. Una prueba nueva en `pruebas/` comprueba los tres casos y que el aviso desaparece cuando el
   latido pasa a ser reciente sin recargar.
7. `apps-script/gestor-correos.gs` escribe `latido.json` al final de `recogerCorreos` y tiene
   `VERSION_SCRIPT` de la fila 336 (lo mira la propia sesión leyendo el fichero).
8. [SOLO FRANCISCO] Con el script nuevo pegado y `prepararTodo` ejecutado, en su carpeta
   `GESTOR-BANDEJA` aparece `latido.json` y el aviso de Inicio no sale.
