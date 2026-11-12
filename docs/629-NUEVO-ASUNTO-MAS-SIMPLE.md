# 629 — «Nuevo asunto», más simple

## Lo que escribió Francisco

Fila 585 de la cola (apartada por Francisco al diseñar el tema 519):

> «Nuevo asunto», revisar su primera vista: que fijos queden solo el tercero, el tipo y la fecha de inicio, y que lo demás (año académico, descripción corta, fecha límite, quién lo pide y por qué vía) salga de la lista única de campos, eligiendo cada tipo qué pide al crear. Hoy esos datos son iguales para todos los tipos, «Año académico» ya no entra en la carpeta, la «Fecha» de quién lo pide repite la de inicio y las seis tarjetas de clase ocupan media pantalla.

Durante el diseño (12-nov-2026), sobre la pantalla de prueba:

> No entiendo el despegable que me dice todas y dos unidades. ¿Por qué esta?. Tampoco sé porque poner Secretaría, Jefatura de Estudios y Varios. Yo pondría la fecha arriba a la izquierda. Debajo a la izquierda el tipo de asunto y a la derecha el tipo de tercero. Y pondría alguna línea para separar o un relieve.

> Quitalos. También la unidad. […] El cuadro de la fecha es demasiado ancho. Debería ajustarse al ancho. La etiqueta Nuevo asunto […] es redundante.

> Lo de la unidad de antes no hace falta porque ya tenemos la opción de que es para un grupo de personas. Me preocupa el espacio libre a la derecha de la Fecha de Inicio.

## Lo que entendió Claude (acordado con Francisco el 12-nov-2026)

Todo esto es de la pantalla «Nuevo asunto». Manda la pantalla de prueba.

- Fijos quedan solo tres cosas, en una sola fila y cada una en su recuadro con el título sombreado: «Fecha de inicio» (estrecha, a la izquierda, del ancho de la fecha), «Qué tipo de asunto» y «Tercero».
- Las clases de tercero dejan de ser seis tarjetas grandes: son una fila de botones pequeños. Funcionan igual que hoy (se fijan pulsando y se sueltan pulsando otra vez; con un tipo elegido, solo se pueden pulsar las que el tipo admite, y sigue saliendo «TIPO admite: …»).
- Los tipos salen en una sola lista seguida, sin los rótulos de departamento (Secretaría, Jefatura de estudios, Varios, Sin asignar).
- Desaparece el desplegable de unidad junto al buscador de terceros. Para una unidad entera está «Es para un grupo de personas».
- Desaparece el título «Nuevo asunto» de encima del formulario (el nombre ya está en el menú).
- Año académico, descripción corta, fecha límite, quién lo pide y por qué vía dejan de ser fijos: pasan a la lista única de campos y salen en «Datos del asunto» solo en los tipos que los pidan al crear. Cada tipo lo elige donde ya elige hoy qué pide al crear de sus otros campos.
- El día del cambio, ningún tipo pide ninguno de esos cinco datos: se marcan tipo a tipo. Francisco sabe que hasta entonces los asuntos nacen sin plazo escrito a mano ni «quién lo pide».
- «Datos del asunto» es un recuadro a todo el ancho, debajo de la fila de arriba. Solo aparece cuando hay tipo y tercero elegidos y el tipo pide algo; lleva juntos esos datos y los campos propios del tipo.
- Desaparecen: la «Fecha» de quién lo pide, el recuadro «Se creará esta carpeta» y la nota «El estado y la fecha límite no salen en el nombre de la carpeta…».
- Siguen como hoy: el aviso «Ya tiene abierto un asunto de este tipo», «Es para un grupo de personas», «+ Crear tipo nuevo», el buscador de tipos, las altas de personas desde el buscador, el salto del cursor al siguiente hueco y el botón final con lo que falta («Falta elegir la persona y el tipo de asunto» → «Crear el asunto») y «Cancelar».
- Esos cinco datos se siguen viendo y cambiando en la ficha del asunto donde hoy, se pidan o no al crear.

## Pantalla de prueba

- Aprobada el 12-nov-2026: `docs/pantallas/602.html` · https://claude.ai/artifact/NY8nF8uDYo5bMB3vFmvEMk
- En la prueba, para que se vea la diferencia, algunos tipos inventados piden datos al crear; en la app, el día del cambio no los pide ninguno.

## Qué NO se hace en esta tarea

- La vista del asunto no se toca. Francisco la vio «tremendamente recargada» y se rehace en su propio diseño: idea 622 de la cola, con la dirección en `docs/notas-diseno/622.md`.
- No se crea ningún ajuste por tipo para enseñar el desplegable de unidad: Francisco decidió que no hace falta.
- No se cambia la ficha del asunto ni «Cambiar el asunto».

## Notas técnicas de Claude

- La pantalla está en `js/pagina-inicio-y-asuntos.js` (`#pantalla-nuevo`) y la mueven `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`, `js/asuntos-nuevo-crear.js`, `js/nuevo-siguiente-hueco.js`, `js/nuevo-unidad.js` (el desplegable de unidad; se retira de esta pantalla) y `js/lo-pide.js`.
- Qué pide cada tipo al crear ya existe para los campos del tipo: `App.E.campos.porTipo[tipo]`, con `sinPedirAlCrear` y `hito` (`js/campo-colocar.js`, `js/campos-normalizar.js`, `js/campos-lista.js`). Los cinco datos entran en ese mismo mecanismo como campos fijos de la app (no se pueden borrar ni cambiar de nombre), en la lista única (`CamposLista.reunir`).
- Los valores se siguen guardando donde hoy (`curso`, `descripcion`, `limite` y lo de `js/lo-pide.js` en la ficha de `asuntos.json`): nada de lo que los lee cambia (plazos, avisos, «avisar a quien lo pide», plantillas, índice del archivo, exportar).
- Cuando el tipo no pide el año académico, se guarda el del curso en marcha, como hoy sale ya escrito. Cuando no pide la fecha límite, se guarda igualmente la que hoy se calcula sola desde la guía (`App.limiteNuevoAuto`), si la hay.
- Tipos ya existentes: sin migrar nada en sus datos; que un tipo sin marca para esos cinco datos signifique «no se pide al crear».
- Con «Es para un grupo de personas» y con una actividad (`#actividad-nuevo-caja`) todo sigue igual; solo cambia el sitio de las cosas.
- Línea en `js/novedades.js` y, al terminar, poner al día `docs/contexto/ASUNTOS.md` y `docs/VOCABULARIO.md` si hace falta.

## Cómo lo comprueba el segundo revisor

- Con la pantalla vacía: una fila con tres recuadros (fecha estrecha a la izquierda, tipo, tercero), sin título «Nuevo asunto» encima, sin tarjetas grandes, sin rótulos de departamento, sin desplegable de unidad, sin «Año académico», «Descripción corta», «Fecha límite», «Quién lo pide y por qué vía», ni «Se creará esta carpeta», ni la nota del nombre de la carpeta.
- Las clases de tercero son botones pequeños en fila; pulsar fija y volver a pulsar suelta; con un tipo elegido, las que no admite no se pueden pulsar y sale «TIPO admite: …».
- Con un tipo cualquiera de la demostración y un tercero: no sale ninguno de los cinco datos; se puede crear el asunto, y se crea.
- Marcando en un tipo que pida al crear «Fecha límite» y «Quién lo pide» (donde hoy se elige para sus otros campos): salen en «Datos del asunto», a todo el ancho, junto a los campos propios del tipo; «Quién lo pide» no trae «Fecha»; lo escrito queda en la ficha del asunto creado.
- Un asunto creado sin pedir esos datos: en su ficha se pueden escribir después la fecha límite y quién lo pide, y el plazo sale en Inicio.
- Un tipo cuya guía pone plazo: el asunto nace con su fecha límite aunque no se pida.
- Sigue saliendo «Ya tiene abierto un asunto de este tipo» cuando toca, y «Es para un grupo de personas» sigue funcionando.
- La pantalla coincide con `docs/pantallas/602.html` en dónde está cada cosa.

## Qué mirar al terminar

- Abre «Nuevo asunto»: fecha, tipo y tercero en una fila, y nada más.
- Elige un alumno y un tipo: se puede crear sin rellenar nada más.
- En un tipo, marca que pida al crear la fecha límite; vuelve a «Nuevo asunto» con ese tipo y mira que aparece en «Datos del asunto».
- Crea un asunto sin fecha límite y pónsela después desde su ficha.

## Revisión y respuestas durante el trabajo

- (las apunta Claude Code)
