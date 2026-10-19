# Tablón: avisos a hora fija (fila 371)

Tema 370 de la cola (junta la idea 369), diseñado con Francisco el 19-oct-2026.
Aviso completo del botón de soporte: https://drive.google.com/file/d/1g-Ce_G5QH3sBhGWeglxV8hbc9B-RXd4N/view?usp=drivesdk
Captura: https://drive.google.com/file/d/1dnoStz1iWdfmFxKcmpwRP63Fo4Zb67n1/view?usp=drivesdk

Sigue el camino de la fila 353 (`docs/INICIO-MAS-COMPACTO.md`, el tablón plegable y su regla de
apertura) y de la fila 368 (`docs/INICIO-COLOCACION-Y-COLUMNAS.md`). No deshace nada de ellas.
Antes de empezar, lee en `docs/contexto/PANTALLA.md` los apartados «El tablón, en la cabecera,
plegable» y «El tablón de notas rápidas».

## Lo que pide Francisco, con sus palabras

> Que las notas que se peguen en el tablón tengan la opción de que lo pongamos fecha y hora de
> vencimiento y que en ese momento nos avise de algún modo (correo o elemento emergente, sonido,
> etc). Por ejemplo, he pegado una nota para que mañana los tutores de 1º ESO estarán en una
> reunión en el dpto. de orientación a las 9:30 y queremos aprovechar que estarán todos juntos
> para darles los carnés de estudiante del alumnado de sus respectivas unidades.

## Lo que ya existe y no cambia

- Cada nota puede llevar ya un día («para el día», campo `para`, `AAAA-MM-DD`). La fila compacta
  enseña «Atrasada», «Hoy» o el día.
- Las notas «Solo para mí» (`privada`) solo las ve quien las escribió (`Tablon.laVeo`).
- Las notas se guardan en `_GESTOR/tablon.json` por `ColaGuardado.poner`, y la fusión de copias en
  conflicto une las notas por su clave.

## Lo decidido con Francisco

1. **Hora y antelación, opcionales.** Al escribir una nota (y al «Cambiar» una ya escrita), junto
   al campo del día que ya existe, aparece:
   - un campo de **hora** (opcional; solo se puede poner si hay día);
   - un desplegable **«Avisar»** con cuatro valores: «a la hora justa», «15 minutos antes»,
     «30 minutos antes», «1 hora antes». **Viene puesto «15 minutos antes».** Solo se ve cuando
     hay hora.
   Una nota sin hora se comporta exactamente como hoy y nunca avisa.
   **«Cambiar» gana el día, la hora y la antelación** (hoy, en modo edición, `papel()` de
   `js/tablon-compacto.js` solo deja tocar el texto y «Solo para mí»). Si se quita el día, la hora y
   la antelación se quitan con él.
2. **Cómo se ve la nota con hora en el tablón.** La marca de la fila compacta añade un relojito y
   la hora, con el mismo formato de día que hoy (`legible()`): «🕘 Hoy 9:30», «🕘 20/10/2026 9:30».
   En el papel entero (la ventana «y N más»): «Para hoy a las 9:30», «Para el 20/10/2026 a las
   9:30». Las notas del mismo día se ordenan por hora; las de ese día sin hora, detrás.
3. **Cómo avisa: una ventana dentro de la app, con un sonido.** Llegado el momento del aviso
   (hora menos antelación), sale una ventana en el centro de la pantalla, por encima de todo, con:
   - título «Aviso del tablón»;
   - el texto entero de la nota;
   - el día y la hora de la cita («martes 20/10/2026 a las 9:30»);
   - dos botones: **«Entendido»** y **«Recordar en 10 minutos»**.
   Al salir suena un sonido corto (generado en la página, sin fichero aparte). Si el navegador no
   deja sonar todavía (no se ha pulsado nada en la página desde que se abrió), la ventana sale
   igual, sin sonido.
   Mientras haya un aviso sin atender, el título de la pestaña del navegador empieza por «🔔 »,
   para que se note aunque se esté en otra pestaña. Se quita al cerrar la ventana.
   No hay correo.
4. **A quién le sale.** Sigue las reglas de la nota: nota privada, solo a quien la escribió; nota
   compartida, a todos los que ven el tablón (los mismos que hoy la ven en `Tablon.laVeo`). Una
   nota marcada «Hecha» o borrada ya no avisa a nadie.
5. **«Entendido» es de cada persona.** Cierra el aviso solo para quien lo pulsa, y no le vuelve a
   salir nunca, en ningún ordenador. A los demás les sigue saliendo. Se guarda en la propia nota
   dentro de `tablon.json` (quién lo atendió); la fusión de copias en conflicto tiene que unir esa
   lista, no quedarse con una de las dos. Si la persona no puede escribir en `tablon.json` (por
   ejemplo un directivo de solo consulta), se guarda en ese ordenador (`localStorage`) y basta.
6. **«Recordar en 10 minutos»** cierra la ventana y la vuelve a sacar a esa persona 10 minutos
   después, con sonido. Puede pulsarse las veces que se quiera. Vale con recordarlo en ese
   ordenador.
7. **Si la app estaba cerrada.** Si a la hora del aviso la app no estaba abierta y la persona no
   lo había atendido, la ventana le sale en cuanto la abra (y en cuanto vuelva a la pestaña, si
   estaba en otra), aunque sea otro día. En ese caso, bajo el día y la hora pone «era a las 9:30».
   Si hay varios avisos pendientes, salen uno detrás de otro, el más antiguo primero.
8. **Pasada la hora de la cita.** La nota se queda en el tablón. Su marca enseña la hora en gris y
   la palabra «pasada» («🕘 Hoy 9:30 · pasada», «🕘 19/10/2026 9:30 · pasada»), en lugar de
   «Atrasada», también si es de un día anterior. En el papel entero: «Pasada: 19/10/2026 a las
   9:30». Se quita a mano, como ahora («Hecha» o «Borrar»). Las notas con día y sin hora siguen
   como hoy («Atrasada»).
9. **Una nota que nace con su aviso ya pasado.** Si se escribe (o se cambia) una nota cuya hora de
   aviso ya ha pasado, quien la escribe la da por atendida al guardarla: a él no le sale la
   ventana. A los demás sí, con «era a las …». «Devolver» una nota hecha no toca quién la atendió.
10. **Cambiar la hora vuelve a armar el aviso.** Si con «Cambiar» se modifica el día, la hora o la
   antelación, la lista de quién lo atendió se vacía y el aviso vuelve a salir a todos a su nuevo
   momento.
11. **Regla de apertura del tablón (fila 353).** Una nota con hora para hoy, todavía no pasada,
    cuenta como nota para hoy: el tablón sale abierto, como ya pasa con las notas con día. **Una
    nota con hora ya pasada (de hoy o de otro día) ya no lo abre**, aunque no esté «Hecha»: se queda
    en el tablón, en gris, hasta que se quite. Cambia `reglaApertura()` en consecuencia; las notas
    con día y sin hora siguen como hoy.

## Por dentro (lo decide quien programa; aquí solo lo que no debe olvidarse)

- Campos nuevos en cada nota de `tablon.json`, opcionales, para que las notas viejas sigan
  valiendo: hora (`HH:MM`), antelación en minutos (0, 15, 30 o 60) y quién lo ha atendido.
  `normalizar()` de `js/tablon.js` los tiene que conservar; hoy los tiraría.
- El momento del aviso se comprueba cada 30 segundos con un temporizador propio, y además al
  arrancar y al volver a la pestaña (`visibilitychange`), porque el navegador frena los
  temporizadores de las pestañas que no se ven. No depende de `Gestor.alRefrescar`.
- La ventana del aviso no debe destruirse con los repintados de Inicio ni con la vigilancia de la
  carpeta (ver `docs/TABLON-NO-SE-BORRA.md`): cuélgala fuera de `#pantalla-abiertos`.
- Respeta el tope de 600 líneas por fichero: si `js/tablon-compacto.js` (hoy 669) no admite más,
  pon la ventana del aviso y su temporizador en un fichero nuevo (por ejemplo
  `js/tablon-avisos.js`) cargado detrás.
- Actualiza `docs/contexto/PANTALLA.md` (apartado del tablón) y añade la novedad visible según la
  regla de la fila 248.

- **Quién lo atendió**: cada «Entendido» se guarda con el momento de aviso al que respondía. Al
  leer, los que no coinciden con el momento actual de la nota no cuentan. Así, si un ordenador
  cambia la hora y otro pulsa «Entendido» a la vez, la fusión (`fusionarTablonYa`,
  `js/conflictos.js`, que hoy pisa campo a campo con `Object.assign`) puede unir las dos listas sin
  resucitar un «Entendido» viejo. Los nombres se comparan con `U.normalizar`, como en `laVeo`. Si
  `quienSoy()` está vacío, no se guarda «Entendido» compartido: solo en ese ordenador.
- **Solo consulta**: con `SoloConsulta.activo()`, «Entendido» va directo a `localStorage`, sin
  intentar escribir `tablon.json` (si no, sale el aviso de «No he podido guardar la nota»). Los
  botones de la ventana no deben colgar de `#tablon` ni coincidir con los que `apagarControles`
  apaga.
- **«Recordar en 10 minutos»** se guarda en `localStorage` (no solo en memoria), para que al
  recargar no salga antes de tiempo.
- **Borradores**: la hora y la antelación a medio escribir tienen su propio borrador, como
  `borradorFecha`, para no perderse con los repintados (`docs/TABLON-NO-SE-BORRA.md`).
- **Datos frescos**: justo antes de sacar la ventana, relee `tablon.json`. Si la nota ya está
  hecha, borrada, atendida o cambiada de hora, no la saques.
- **Copia de pruebas** (`js/demo/datos.js`, `crearTablon()`): añade una nota compartida con hora
  dos minutos después de cargar la demo y «a la hora justa», y otra de ayer ya «pasada» sin atender
  (que da la ventana con «era a las …» al entrar). Así el revisor lo ve sin esperar.
- **El sonido** no lo puede comprobar el revisor: dalo por no comprobable en la nota de la fila.

## Ejemplo con datos reales

La nota de Francisco: **«Reunión de tutores de 1º ESO en el dpto. de orientación: darles los
carnés de estudiante»**, compartida, para el **martes 20-oct-2026 a las 9:30**, avisar «15 minutos
antes». A las **9:15** a todos los que ven el tablón les sale la ventana con ese texto y «martes
20-oct a las 9:30». En el tablón la nota pone «🕘 Hoy 9:30» y, desde las 9:30, «🕘 Hoy 9:30 ·
pasada».

Para probarlo en la copia de pruebas, usa ese mismo texto con una hora de dos o tres minutos más
tarde que la del momento de la prueba, y «a la hora justa».

## Cómo sabré que está bien

1. Al escribir una nota hay un hueco opcional para día y hora, y la antelación ya viene puesta en
   «15 minutos antes».
2. La nota con hora enseña en el tablón un relojito con el día y la hora.
3. A la hora del aviso sale una ventana con el texto de la nota y suena. «Recordar en 10 minutos»
   la vuelve a sacar; «Entendido» la cierra para siempre.
4. Si la app estaba cerrada, la ventana sale al abrirla y dice «era a las 9:30».
5. Pasada la hora, la nota sigue con la hora en gris y «pasada». Una nota privada no avisa a nadie
   más.
