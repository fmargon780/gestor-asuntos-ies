# 555 — A quién va cada correo

## Lo que escribió Francisco

Tema 487 (junta las ideas 481 y 495):

> Aviso de Diego Herrera (28-oct-2026, «Ficha de un asunto»): «Que no salga por defecto el tutor de
> la unidad en Para:»

> Aviso de Francisco (30-oct-2026, «Ficha de un asunto»): «Al crear una plantilla de correo nueva
> desde la pantalla de envío de un correo determinado, la opción Va a: obliga a escoger una de las
> tres opciones que aparecen. Esto impide que siga adelante con la creación de la plantilla,
> porque no es a ninguna de esas tres opciones y no sé si se va a enviar automáticamente a quién
> deje puesto en esa opción.»

En el diseño (6-nov-2026):

> «Que si no predefino nada, poder tener una herramienta que me permita enviar la comunicación a
> quién yo quiera dentro de un límite (si está relacionado con un alumno, no debe dejarme enviarlo
> a otro alumno, ni su familia, pero sí dejarme elegir, entre el alumno del asunto, alguno de sus
> tutores legales (pudiendo saber quién tiene la custodia), su tutor de grupo, alguno de sus
> profesores, a alguno de los grupos relacionados con el equipo directivo. Si necesitara tener que
> enviar la comunicación a Servicios Sociales, por ejemplo, tendría que relacionar a ese tercero
> con el asunto, si no no debería dejarme. Por otro lado, si hubiera predefinido el destinatario en
> algún lugar (aquí te toca a ti proponer dónde), que me propusiera a priori ese destinatario / s.
> Sin impedirme mandarlo a otros de la situación anterior. Para todos estos casos hay que tener en
> cuenta las posibilidades que nos da una comunicación en cuanto a las clases de Destinatarios
> (Para, Con Copia y Con copia Oculta).»

> «No quiero que el correo solo vaya al tutor que tenga la custodia, sino que me muestre quién la
> tiene y que yo pueda elegir si mandárselo solo a ese o a los dos.»

> «Prefiero un sistema en el que el usuario toma la iniciativa de buscar lo que necesita. Por
> ejemplo, si en el campo Para quiero poner al padre, me voy a ese campo y escribo Padr... y me
> aparece el correo del padre; si pongo tutor, me salen el tutor de la unidad y los tutores legales
> (padre y madre).»

> «Me gustaría que en las plantillas de correo fueran definibles el saludo y la firma por el
> usuario.»

## Lo que entendió Claude (acordado con Francisco el 6-nov-2026)

**Quién puede recibir el correo de un asunto (lista cerrada)**
- Solo la gente ligada al asunto: el interesado (el tercero del asunto), sus tutores legales (los
  dos), el tutor o tutora de su grupo, sus profesores, quien lo pide, los terceros relacionados con
  el asunto y las listas de Ajustes › Grupos que tienen solo personal del centro.
- Nadie más. Ni otros alumnos ni sus familias, ni una dirección escrita a mano. Para escribir a
  alguien más (por ejemplo, Servicios Sociales), antes se relaciona con el asunto.
- En un asunto que no es de alumnado (personal, empresa, organismo), lo mismo con lo que haya: el
  interesado, quien lo pide, los relacionados y las listas del personal.
- Una lista de Grupos sale solo si todas sus personas son personal del centro. Cada lista es una
  línea aparte: se pueden poner varias a la vez (la Secretaría en Para y el Director en Copia), sin
  crear una lista que las una.
- Los dos tutores legales salen siempre. Junto al que tiene la custodia sale «tiene la custodia»;
  quien escribe elige si va a uno o a los dos.
- «Sus profesores» son los que dan clase en la unidad del alumno. Salen cuando el Centro de datos
  traiga el horario (idea aparte en `fmargon780/centro-de-datos-ies`); hasta entonces no sale
  ninguno y lo demás funciona igual.

**Cómo se eligen (el cuadro «Correo de este asunto»)**
- «Para», «Copia» y «Copia oculta» son tres casillas que se rellenan escribiendo. Al escribir
  («padr», «tutor», «custodia», «Lengua», «secre»…) salen solo las personas de la lista cerrada que
  encajan por nombre o por lo que son (padre, madre, tutora de 2º ESO B, profesora de Lengua, lista
  del personal…). Se elige con el ratón o con flechas e Intro; cada elegido queda como una pastilla
  con su nombre y su correo, y «×» la quita. Retroceso con la casilla vacía quita la última.
- Una persona solo puede estar en uno de los tres campos: ponerla en otro la quita del anterior.
- Si no encaja nadie: «Nadie de este asunto se llama así. Para escribir a alguien más, relaciónalo
  antes con el asunto.» Si se escribe una dirección de correo: «Solo se escribe a personas de este
  asunto. Para escribir a alguien más, relaciónalo antes con el asunto.»
- Una persona sin correo sale en la búsqueda con «Sin correo: no se puede añadir».
- Pulsando una pastilla ya puesta se puede escribir otro correo de esa persona **solo para este
  envío** (pastilla en ámbar, «(solo esta vez)»); el correo guardado no cambia. «Volver al
  guardado» lo deshace.
- «Relacionar a alguien con el asunto» está en el mismo cuadro, junto a «Enviar».
- **Asunto de grupo:** las familias van siempre a Copia oculta, aunque se pongan en Para o Copia
  (la pastilla pasa sola a Copia oculta), para que ninguna vea las demás. Si «Para» queda vacío,
  hay que poner a alguien (por ejemplo, la Secretaría) para enviar.
- Desaparecen: la casilla libre para escribir cualquier dirección en Para, las casillas marcables
  de los correos de la familia, el desplegable «Añadir un grupo» (sus listas del personal se buscan
  ahora escribiendo; los atajos de familias de otros alumnos ya no salen) y los botones
  «+ Tutor/a de …» junto a los campos.

**Destinatarios propuestos: en la plantilla**
- La plantilla de correo sustituye «Va a:» por tres casillas «Para», «Copia» y «Copia oculta»,
  que se rellenan igual, escribiendo, pero con **papeles**: El interesado, Tutores legales,
  Tutor/a del grupo, Profesores del grupo, Quien lo pide, Relacionados con el asunto, y el nombre de
  cada lista del personal.
- Al preparar un correo con esa plantilla, sus papeles salen ya puestos como personas de ese
  asunto (los dos tutores legales, por ejemplo); se pueden quitar o añadir otras de la lista
  cerrada. Un papel que el asunto no tiene no pone a nadie.
- Una plantilla sin papeles es válida: el correo sale sin nadie puesto y se elige al enviar. Nada se
  envía sin pulsar «Enviar» y confirmar el resumen.
- «Sin plantilla» abre el correo sin nadie puesto.
- Vale igual al crear una plantilla desde el propio correo («Guardar como plantilla nueva»): nada es
  obligatorio.

**Saludo y firma en la plantilla**
- La plantilla tiene «Saludo», «Texto» y «Firma». En los tres se pueden poner campos variables
  («Insertar campo variable», donde esté el cursor).
- Saludo vacío: sale el de siempre, según la persona del asunto. Firma vacía: sale la firma general
  de Ajustes.
- Desaparecen la nota «El saludo y la firma no van en la plantilla» y la regla que cambiaba el
  saludo por «Buenas:» según «Va a».

**La tarea de la guía**
- La tarea «Comunicar» ya no tiene su propio «a quién»: solo elige la plantilla. Debajo se ve
  «A quién va (lo dice la plantilla)» con sus papeles por campo, y «Ver y cambiar la plantilla».
- En la mesa del hito, «Comunicar ▾» pierde las casillas de destinatarios: quedan «Preparar
  correo» y «Mensaje de Séneca».

**Paso de lo que ya existe (una sola vez, sin lista de revisión)**
- «Va a: La familia» → Para: Tutores legales en los tipos de alumnado; Para: El interesado en los
  demás. «Va a: El tutor o tutora del grupo» → Para: Tutor/a del grupo, con saludo «Buenas:».
  «Va a: Quien lo pide» → Para: Quien lo pide. Sin «Va a» → sin papeles.
- El «a quién» de las tareas se pierde: manda el de su plantilla; una tarea sin plantilla queda sin
  nadie propuesto.

## Pantalla de prueba (aprobada el 6-nov-2026)
- `docs/pantallas/487.html` · https://claude.ai/artifact/TBhUUe19JK174SdA5C6ZYA

## Qué NO se hace en esta tarea
- Traer el horario (quién da clase a cada unidad) al Centro de datos: idea aparte en la cola de
  `fmargon780/centro-de-datos-ies`.
- Corregir para siempre un correo mal guardado de una persona: lo trata el tema 503.
- Los mensajes de Séneca no cambian.

## Notas técnicas de Claude
- Ficheros que tocan hoy a quién va un correo: `js/plantilla-va-a.js` y
  `js/plantilla-va-a-revision.js` («Va a» y su revisión de la fila 348), `js/correo-cuadro-destinatarios.js`
  (`destinoDe`, `aplicarDestino`, copia oculta), `js/correo-cuadro-cuerpo.js` (líneas de la fila 299
  y 348 al montar el cuadro), `js/destinatarios.js` (`posibles`, `correosDe`, `delGrupo`),
  `js/correo-grupos.js` («Añadir un grupo»), `js/correo-tutor-botones.js` («+ Tutor/a de …»),
  `js/correo.js` (`saludoDe`, `textoDeLaFirma`, `cuerpoDelMedio`, `correoPreferente`,
  `tutorDelGrupo`), `js/hito-mesa-comunicar.js` (casillas de «Comunicar ▾»),
  `js/hito-mesa-recetas.js` (`elegidosPara`, `receta.a`), `js/hitos-comunicar.js`,
  `js/plantillas-ajustes.js` (los dos editores de plantilla), `js/plantilla-de-lo-escrito.js`
  (fila 270: quita saludo y firma de lo escrito; debe seguir haciéndolo con el saludo y la firma de
  la plantilla).
- Datos: la plantilla de correo guarda `para`, `copia`, `oculta` (listas de papeles: `interesado`,
  `legales`, `tutor`, `profes`, `pide`, `relac`, `grupo:<id>`), `saludo` y `firma`. `vaA` deja de
  usarse; el paso de lo existente se hace una vez al entrar, con marca en `_GESTOR` (como la
  revisión de la fila 348), respetando «solo consultar» y el perfil directivo.
- Lista cerrada: interesado y sus correos (`Destinatarios.correosDe`), tutores legales
  (`Datos.tutoresDe`), tutor del grupo (`TutorDelGrupo.deAsunto` / `paraElCuadro`), quien lo pide
  (`LoPide.correoDe`), relacionados (`ficha.relacionados`, resueltos con `CorreoGrupos.resolverMiembros`),
  listas de `Grupos.lista()` cuyos miembros son todos `categoria: 'PERSONAL'`. Custodia: el campo
  «Tutor con custodia» del asunto (`js/datos-del-asunto.js`; con un solo tutor, ese).
- «Sus profesores»: dejar un punto de enganche que lea del Centro de datos el horario cuando exista
  (por unidad); mientras no exista, devuelve una lista vacía sin aviso.
- La búsqueda compara sin tildes ni mayúsculas contra nombre, papel y lo que es (padre, madre,
  tutora de…, profesor de <materia>, lista del personal, «custodia»).
- Asunto de grupo (`ficha.grupo` o varios alumnos relacionados): los tutores legales van siempre a
  `oculta` (la regla de la fila 21, ahora solo para familias). Las listas del personal pueden ir en
  cualquier campo.
- Enviar sigue por `js/correo-enviar.js` con Para, Copia y Copia oculta separados; el resumen
  previo enseña los tres.
- Pruebas que hoy cubren lo que cambia y habrá que adaptar o retirar: `correo-al-tutor`,
  `correo-tutor-botones`, `informar-al-tutor`, `tutor-del-grupo`, `correos`, `correo-enviar`.
  Prueba nueva para la búsqueda, el límite, la custodia y el paso de plantillas.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. Línea en `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
- En la demostración, el correo de un asunto de un alumno: «Para», «Copia» y «Copia oculta» son
  casillas donde se escribe; no hay casilla libre, ni casillas marcables, ni «Añadir un grupo», ni
  «+ Tutor/a de …».
- Escribir «padr» en Copia saca al padre con su correo; Intro lo pone como pastilla en Copia.
- Escribir «tutor» saca al tutor del grupo y a los dos tutores legales; el que tiene la custodia
  lleva «tiene la custodia».
- Poner en Copia a alguien que estaba en Para lo quita de Para.
- Escribir el apellido de otro alumno, o una dirección de correo, no saca a nadie y enseña el
  mensaje de «relaciónalo antes con el asunto».
- Relacionar un tercero con el asunto hace que salga al buscarlo.
- Una persona sin correo sale con «Sin correo: no se puede añadir» y no se puede elegir.
- Pulsar una pastilla deja escribir otro correo solo para este envío; sale en ámbar con «(solo esta
  vez)» y el resumen de «Enviar» lo usa; el correo guardado de la persona no cambia.
- Las listas de Grupos con solo personal salen al buscarlas por nombre y pueden ir en cualquier
  campo; una lista con algún alumno no sale.
- En un asunto de grupo, poner «tutores legales» en Para los deja en Copia oculta.
- Una plantilla con Para: Tutores legales y Copia oculta: Tutor/a del grupo abre el correo con esas
  personas ya puestas, y se pueden quitar y añadir.
- «Sin plantilla» abre el correo sin nadie puesto. Una plantilla sin papeles se guarda sin aviso.
- El editor de plantillas tiene Saludo, Texto, Firma y las tres casillas de papeles, sin «Va a».
  Un campo variable insertado en el saludo sale relleno en el cuerpo del correo. Saludo vacío: el
  de siempre; firma vacía: la de Ajustes.
- «Guardar como plantilla nueva» desde el correo no obliga a elegir nada.
- La tarea «Comunicar» de la guía no tiene «a quién»; enseña los papeles de su plantilla.
- «Comunicar ▾» en la mesa del hito no tiene casillas de destinatarios.
- Las plantillas viejas se han pasado: una con «Va a: El tutor o tutora» tiene Para: Tutor/a del
  grupo y saludo «Buenas:»; una con «La familia» de un tipo de alumnado, Para: Tutores legales.
- Comparar con `docs/pantallas/487.html`.

## Revisión y respuestas durante el trabajo
Segundo revisor (6-nov-2026), visto en la demostración (`?demo=1&auto=1`), con capturas y sin tocar datos reales. Se añadieron tutores con correo en memoria al alumno «Jimenez Rubio» y, para la custodia, un campo «Tutor con custodia» simulado en memoria (el tipo SANCION de la demo no lo tiene).
- Cuadro «Correo de este asunto»: «Para», «Copia» y «Copia oculta» son casillas donde se escribe; no hay casilla libre, ni casillas marcables de familia, ni «Añadir un grupo», ni «+ Tutor/a de …»: coincide. (La única casilla marcable que queda es la de adjuntos.)
- «padr» en Copia saca a «Pedro Jimenez · Tutor legal · padre» con su correo; Intro lo deja como pastilla en Copia: coincide.
- «tutor» saca a los dos tutores legales y a la tutora del grupo («Otero Campos, Marta · Tutor/a de 4º A»): coincide. «tiene la custodia» sale en la lista desplegable junto a quien la tiene (con la custodia simulada): coincide.
- (Repasado tras la corrección: coincide, la pastilla ahora dice «Marta Rubio · custodia marta@x.es».) Antes NO coincidía: una vez elegido, la pastilla NO llevaba la marca de custodia. En `docs/pantallas/487.html` la pastilla dice «Ortega Lara, Marta · custodia»; en la app («Marta Rubio marta@x.es ×») no sale nada. Quien escribe solo ve quién tiene la custodia mientras busca, no después de elegir.
- NO coincide / aviso: el tipo SANCION de la demo no tiene el campo «Tutor con custodia», así que con dos tutores ninguno sale como «tiene la custodia» (con un solo tutor sí, por la regla del asunto). No es fallo del código nuevo, pero en un tipo sin ese campo la frase de Francisco («pudiendo saber quién tiene la custodia») no se cumple.
- Poner en Copia a quien estaba en Para lo quita de Para (madre en Para pasa a Copia; Para queda vacío), y la lista avisa antes: «Ahora en Para: pasará a este campo»: coincide.
- Escribir «Otero» (apellido de otro alumno), «Garcia» o una dirección «foo@bar.es»: las direcciones y nombres de otros alumnos no salen. Mensajes «Nadie de este asunto se llama así. Para escribir a alguien más, relaciónalo antes con el asunto.» y, con «@», «Solo se escribe a personas de este asunto…»: coincide. (Ojo: «Otero» sí saca a Marta Otero Campos, que es la tutora del grupo, no un alumno: correcto.)
- Relacionar a un tercero: «Relacionar a alguien con el asunto» cierra y abre el selector de relacionados y vuelve al correo con lo que había; el relacionado (Reyes Palma, Fernando, de Personal) sale al buscarlo como «Relacionado con el asunto»: coincide. No he podido probar «Servicios Sociales» porque la demo no tiene administraciones ni empresas que casen.
- Persona sin correo: el interesado sale con «Sin correo: no se puede añadir», el botón está desactivado y con Intro avisa «Sin correo: no se puede añadir a …» sin ponerlo: coincide.
- Pulsar una pastilla deja escribir otro correo solo esta vez; sale «padre.otro@z.es (solo esta vez)»; el resumen de «Enviar» usa «Para: padre.otro@z.es»; el correo guardado del padre sigue siendo el de antes: coincide. (Hay además «Volver al guardado» y «Cancelar».) No he confirmado el envío (la demo no envía).
- Listas de Grupos: «Profesorado» (solo personal) sale al buscarlo y se puede poner en cualquier campo; una lista simulada con un alumno dentro no sale: coincide. Mejora sin pedir: la pastilla de una lista solo enseña la primera dirección (motero@…), aunque el resumen de «Enviar» enseña todas; puede confundir. La demo solo trae esa lista, así que «director» y «secretaría» no salen allí (esperable).
- Asunto de grupo (Museo de Ciencias): «Tutores legales del grupo» puesto desde Para se queda en Copia oculta, y la lista anuncia «pasará a este campo»; las listas del personal van a Para: coincide. No vi un aviso al moverse solo (la pastilla cambia de campo sin más).
- Plantilla «Prueba rev555» (creada desde Ajustes con Para: Tutores legales, Copia oculta: Tutor/a del grupo): al elegirla el correo abre con los dos tutores legales en Para y la tutora en Copia oculta, y se pueden quitar y añadir; «Sin plantilla» abre sin nadie: coincide.
- (Repasado tras la corrección: coincide, de «Informar al tutor/a» a «Aviso de avance» el correo queda sin nadie.) Antes: cambiar de una plantilla con papeles a otra SIN papeles (de «Informar al tutor/a de la sanción» a «Aviso de avance») deja a quien ya estaba puesto (Otero Campos); desde «Sin plantilla» sí sale vacío. El texto dice «sale sin nadie puesto»: dudoso, no coincide del todo.
- Editor de plantillas (Ajustes → tipo → «+ Nueva plantilla»): tiene Nombre, Saludo, Texto, Firma y las tres casillas Para/Copia/Copia oculta que se escriben (con ayuda «Escribe lo que es: tutor, tutores legales…»), sin «Va a»: coincide. Un campo variable insertado en el saludo ({nombreNatural}) y en la firma ({grupo}) sale relleno en el cuerpo del correo («Mateo Jimenez Rubio … 4º A»). Saludo vacío y firma vacía muestran las ayudas «sale el saludo de siempre» y «sale la firma general de Ajustes»: coincide.
- (Repasado tras la corrección: coincide, la nota ya no está.) Antes NO coincidía: en esa misma sección de Ajustes seguía el párrafo «Cada plantilla es solo el cuerpo del medio: el saludo y la firma se ponen solos.», que ya es falso (la plantilla lleva saludo y firma). El texto pedía quitar esa nota.
- «Guardar como plantilla nueva» desde el correo: abre el editor con Para/Copia/Copia oculta opcionales y sin obligar a elegir nada; solo pide nombre y texto («Hace falta el nombre y el texto.»), como antes: coincide. Sale vacío si no se ha escrito nada a mano.
- Tarea «Comunicar» de la guía: no tiene «a quién» propio; solo elige plantilla y debajo enseña «A quién va (lo dice la plantilla): Para: Tutor/a del grupo»: coincide. Pequeña diferencia con la pantalla: el botón dice «Ver y cambiar el texto» y la pantalla de prueba «Ver y cambiar la plantilla». (Esta fila solo la he visto pintando el trozo de la guía; el formulario «Tarea nueva» solo tiene Plantilla.)
- «Comunicar ▾» en la mesa del hito: solo «Preparar correo» y «Mensaje de Séneca» (más la lista de tareas pendientes), sin casillas de destinatarios: coincide.
- Plantillas viejas pasadas: «Informar al tutor/a de la sanción» tiene Para: Tutor/a del grupo y saludo «Buenas:»: coincide. «La familia» en un tipo de alumnado → Tutores legales: no lo he podido ver (las plantillas de la demo «Aviso de avance/cierre» salen sin papeles, y no había otra con «La familia»).
- Hace la app sin que el texto lo pida: aviso amarillo permanente «El script de Gmail es más antiguo que la app … hace falta 6-nov-2026 · fila 555» arriba del cuadro de correo, y en el resumen de «Enviar» un segundo aviso «no sabe mandar Copia» (esperable en la demo; la novedad de la fila 555 lo anuncia); «Escape» cierra solo la lista; «Retroceso» con la casilla vacía quita la última pastilla (sí pedido).
- Sin errores de JavaScript en ninguna de las pruebas.
