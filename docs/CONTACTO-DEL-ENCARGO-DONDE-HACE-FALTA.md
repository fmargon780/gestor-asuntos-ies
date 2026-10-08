# El contacto apuntado en «El encargo», donde hace falta (fila 305)

Cerrado con Francisco el 8-oct-2026. Sale de su aviso 305, enviado desde el botón de soporte
(propuesta de mejora). Sigue a `docs/LO-PIDE.md`, `docs/LO-PIDE-EN-LA-CABECERA.md` (fila 106),
`docs/CABECERA-DEL-ASUNTO.md` (fila 52) y `docs/AVISOS-A-QUIEN-LO-PIDE.md` (fila 195).

## Qué pidió

> Los datos de contacto anotados en la sección de El Encargo (como teléfono o correo electrónico)
> deberían aparecer en los sitios del asunto donde pudieran ser necesarios, como pudieran ser en
> Comunicar - Correo eléctronico.

## Qué pasa hoy

En «Quién lo pide y por qué vía» (Nuevo asunto y «El encargo» de la ficha) hay dos datos de
contacto distintos:

- **El de la persona que lo pide**, que la app saca sola de sus ficheros (`ficha.loPide.correo` y
  `ficha.loPide.telefono`), o el «Correo, si lo tienes» de «Otra persona…».
- **El que se escribe a mano** en el recuadro de debajo de «Por qué vía» («Teléfono, correo o
  aclaración (opcional)»), que se guarda en `ficha.viaDato` junto a `ficha.via`.

El cuadro de Correo solo usa el primero (`LoPide.correoDe`, `js/lo-pide.js`). El escrito a mano no
llega a ningún sitio: solo se ve en la tarjeta «El encargo» de la ficha («Vía de comunicación»),
en la lista de Inicio y en la exportación. El teléfono no se ve en la pantalla de un hito, que es
donde está «Comunicar».

## Qué quiere Francisco (decidido por él el 8-oct-2026)

1. **Cuadro de Correo.** El correo escrito a mano en «El encargo» sale **marcado él solo** en
   «Para», y los demás sin marcar. Es la misma regla que ya vale para el correo de quien lo pide.
   Si no está en la lista, va en «Otro correo».
2. **Cabecera.** El dato de contacto se ve junto a «Lo pide: …», con un botón para copiarlo, en la
   ficha del asunto y en la pantalla de cada hito. Siempre a la vista.
3. **Qué dato sale en la cabecera.** Solo el de la vía elegida: con «Teléfono», el teléfono; con
   «Correo electrónico», el correo. No los dos a la vez.

Decidido por la conversación de diseño, y contado a Francisco:

4. Si la app conoce un correo de esa persona por sus ficheros y además hay uno escrito a mano,
   **gana el escrito a mano**.
5. «Enviar estado» y los avisos «al terminar» y «al cerrar» usan ese mismo correo.
6. Las plantillas de documento y de correo tienen huecos nuevos con ese dato.
7. Si la vía elegida no es teléfono ni correo y no hay nada escrito, la cabecera queda como hoy.

## Qué hay que hacer

### 1. Una sola regla, en un solo sitio

En `js/lo-pide.js`, una función pura nueva, `LoPide.contactoDe(ficha)`, que lee `ficha.loPide`,
`ficha.via` y `ficha.viaDato` y devuelve:

- `correo`: la primera dirección de correo que haya **dentro** de `ficha.viaDato` (el recuadro
  admite texto libre: «maria@ejemplo.es, por las tardes» vale); si no hay ninguna,
  `ficha.loPide.correo`; si tampoco, cadena vacía. Vale aunque el asunto no tenga «quién lo pide»:
  las dos preguntas del cuadro no dependen la una de la otra.
- `telefono`: el primer teléfono que haya dentro de `ficha.viaDato` (nueve cifras, con o sin
  espacios, puntos o guiones, con o sin `+34`); si no, `ficha.loPide.telefono`; si no, vacío.
- `aLaVista`: lo que enseña la cabecera, o `null`. Es `{ clase, texto, copia }`:
  - Con algo escrito en `viaDato`: `texto` es lo escrito, tal cual (recortado a 40 caracteres con
    puntos suspensivos, y entero en el `title`). `clase` es `telefono` si la vía es «Teléfono» o
    si lo escrito lleva un teléfono y ningún correo; `correo` si lleva un correo; si no, `texto`.
    `copia` es solo el teléfono o el correo reconocido; si no hay ninguno, lo escrito entero.
  - Sin nada escrito y vía «Teléfono»: el `telefono` de arriba, si lo hay.
  - Sin nada escrito y vía «Correo electrónico»: el `correo` de arriba, si lo hay.
  - Cualquier otro caso: `null`.

`LoPide.correoDe(ficha)` pasa a devolver `contactoDe(ficha).correo`. Así el cuadro de Correo
(`js/correo-cuadro.js`), los avisos y «Enviar estado» (`js/avisos-lo-pide.js`) y la tarjeta «El
encargo» (`js/ficha-bloques.js`, `tieneCorreo`) lo reciben sin tocarlos. Repasa esos tres sitios
y `js/correo.js` (comentario de la línea 375) por si alguno daba por hecho que el correo era
siempre el de `loPide`.

No se guarda nada nuevo en `asuntos.json`: todo esto solo lee.

### 2. El cuadro de Correo

- El orden de quién manda no cambia: la dirección propia de un hito
  (`destinatarioPreferente`), después `LoPide.correoDe`, después la del departamento.
- Con el cambio del apartado 1, el correo escrito a mano sale marcado él solo, o en «Otro correo»
  si no está en la lista (`LoPide.elegirDestinatarios`, sin tocar).
- Para que se entienda por qué está marcado: cuando la dirección viene de lo escrito a mano, la
  línea gris de encima de «Para» lo dice. Con «quién lo pide»: «Lo pidió María López (madre), el
  8 de octubre. Correo apuntado en «El encargo»: maria@ejemplo.es». Sin «quién lo pide»: «Correo
  apuntado en «El encargo»: maria@ejemplo.es».
- La regla de la fila 299 (correo al tutor o tutora del grupo) sigue igual: su prueba no cambia.

### 3. La cabecera de la ficha y la de la pantalla del hito

- Un módulo nuevo y pequeño, `js/contacto-a-la-vista.js` (`ContactoALaVista.html(a)` y
  `ContactoALaVista.enganchar(raiz)`), que pinta el dato y su botón de copiar. Lo usan los dos
  sitios, para que salga igual.
- En la ficha: dentro de la marca «Lo pide: …» de `marcasDeFicha` (`js/ficha-asunto.js`). Queda
  «Lo pide: María López (madre) · Tel. 600 111 222 ⧉». Con correo, «… · maria@ejemplo.es ⧉». Con
  una aclaración que no es teléfono ni correo, «… · llamar por las tardes ⧉».
- Sin «quién lo pide» pero con dato a la vista: una marca propia, «Contacto: Tel. 600 111 222 ⧉».
- El prefijo «Tel.» solo con `clase` `telefono`. El botón ⧉ es el mismo de copiar de los
  documentos (`U.copiar`, `js/util-pantalla.js`) y copia `copia`, sin el «Tel.».
- En la pantalla del hito (`js/hito-mesa.js`, bloque `.mesa-etiquetas`): la misma marca. Tiene
  que verse sin desplazarse y **sin que la cabecera del hito crezca de alto** (fila 145: se midió
  para caber en 250 px). Si no cabe en la línea, se recorta el nombre de quien lo pide con puntos
  suspensivos; el dato de contacto no se recorta nunca. Si la cabecera fija de la ficha ya queda a
  la vista encima de la pantalla del hito con esta marca, no se repite.
- Al cambiar «El encargo» la marca se pone al día sola (`App.repintarAccionesFicha` ya repinta las
  marcas).
- En modo «solo consultar» y con perfil directivo se ve igual, y copiar funciona.

### 4. Los huecos de las plantillas

En `js/plantillas-valores.js` (junto a `quienlopidevia`) y en la lista de `js/plantillas.js`:

- `quienlopidecontacto`: lo de la cabecera, sin el «Tel.» → «Quien lo pide: contacto apuntado».
- `quienlopidetelefono`: `contactoDe(f).telefono` → «Quien lo pide: teléfono».
- `quienlopidecorreo`: `contactoDe(f).correo` → «Quien lo pide: correo».

Vacíos cuando no hay dato, como cualquier otro hueco (salen en «Faltan datos»).

## Lo que no cambia

- El cuadro «Quién lo pide y por qué vía»: mismos campos, mismo guardado.
- La tarjeta «El encargo», la vía en la lista de Inicio y la exportación.
- El mensaje de Séneca, los envíos de un asunto de grupo y el correo de un hito con dirección
  propia.
- Nada escribe en las carpetas: no hace falta mirar `SoloConsulta` más que para comprobar que se
  ve igual.

## Cómo hacerlo (orientación; decide la sesión)

- Sigue `CLAUDE.md`: rama `fila-305`, revisor en local y, con su aprobación, a `main`.
- Cambios quirúrgicos. No leas el repositorio entero: `docs/CONTEXTO.md`,
  `docs/contexto/ASUNTOS.md`, `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/HITO-MESA.md` y
  los ficheros de abajo.
- `js/correo-cuadro.js` tiene 589 líneas y `js/hito-mesa.js` 522: lo nuevo va en `js/lo-pide.js`
  y en el módulo nuevo; en esos dos solo la llamada. Ningún fichero pasa de 600 líneas.
- Mientras programas, solo las pruebas de lo tocado (`npm test -- lo-pide contacto avisos correo
  cabecera mesa`). La pasada completa, una sola vez, al final.

## Ficheros

- `js/lo-pide.js`: `contactoDe`, y `correoDe` apoyado en ella.
- `js/contacto-a-la-vista.js`: nuevo. La marca y su botón de copiar.
- `js/ficha-asunto.js`: `marcasDeFicha` usa la marca nueva.
- `js/hito-mesa.js`: la marca en `.mesa-etiquetas` (solo la llamada).
- `js/correo-cuadro.js`: la frase de la línea gris (`avisoLoPideHtml`).
- `js/plantillas-valores.js` y `js/plantillas.js`: los tres huecos.
- `js/avisos-lo-pide.js`, `js/ficha-bloques.js`, `js/correo.js`: solo repasar; tocar si hace falta.
- `css/`: el estilo de la marca, en la hoja donde ya está `marca-lopide`.
- `index.html`: el módulo nuevo, después de `js/lo-pide.js`.
- `js/demo/datos.js`: tres asuntos abiertos de la demostración quedan así (elige tres que ya
  existan, de alumnado con correos de tutores en su fichero, y escribe sus nombres en la lista de
  «Cómo sabemos que está bien» antes de llamar al revisor, en el sitio de ASUNTO A, B y C):
  - **ASUNTO A**: lo pide su madre o tutora (con correo en el fichero), vía «Correo electrónico»,
    y escrito a mano `otra.direccion@ejemplo.es`, que no está entre los correos del alumno.
  - **ASUNTO B**: lo pide su padre o tutor (con correo en el fichero), vía «Teléfono», y escrito a
    mano `600 111 222`.
  - **ASUNTO C**: sin «quién lo pide», vía «Correo electrónico», y escrito a mano uno de los
    correos que el alumno ya tiene en su fichero.
- `pruebas/lo-pide.mjs`: casos de `contactoDe` (correo dentro de un texto, teléfono con espacios y
  con `+34`, aclaración sin dato, vía sin nada escrito, sin `loPide`, gana lo escrito a mano).
- `pruebas/contacto-del-encargo.mjs`: nueva. La marca en la ficha y en la pantalla del hito, copiar,
  el cuadro de Correo en los tres asuntos y los tres huecos.
- Siguen en verde, sin cambiar lo que comprueban: `pruebas/avisos-a-quien-lo-pide.mjs`,
  `pruebas/correo-enviar.mjs`, `pruebas/cabecera-fija.mjs`, `pruebas/cabecera-compacta.mjs`,
  `pruebas/hito-mesa.mjs`.
- `js/novedades.js`: «El teléfono o el correo que apuntas en «El encargo» se ve ahora en la
  cabecera del asunto y de cada hito, con un botón para copiarlo. Si es un correo, sale ya marcado
  en «Para» al escribir un correo.»
- Al terminar: `docs/CONTEXTO-CORTO.md`, `docs/contexto/ASUNTOS.md`,
  `docs/contexto/CORREO-Y-SENECA.md`, `docs/contexto/HITO-MESA.md`, `docs/VOCABULARIO.md` (si entra
  la palabra «Contacto:») y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que el teléfono o el correo apuntado en «El encargo» se ve en la cabecera del
asunto y de cada hito, con botón de copiar; que el correo escrito a mano sale marcado en «Para» y
lo usan también «Enviar estado» y los avisos; y que hay tres huecos nuevos para las plantillas.

## Cómo sabemos que está bien

En la copia de demostración. ASUNTO A, B y C son los tres de `js/demo/datos.js` (la sesión escribe
aquí sus nombres antes de llamar al revisor).

1. Abrir ASUNTO B. En la cabecera, la marca «Lo pide: …» termina en «· Tel. 600 111 222» y lleva un
   botón de copiar.
2. Pulsar el botón de copiar: sale el aviso de copiado de siempre. Lo copiado es `600 111 222`, sin
   «Tel.».
3. En ASUNTO B, abrir el hito actual: en su cabecera, sin desplazarse, se ve el mismo teléfono con
   su botón de copiar. La cabecera del hito no ha crecido: «QUÉ HAY QUE HACER» sigue a la vista
   sin bajar.
4. En ASUNTO B, «Comunicar ▾» → «Correo electrónico»: las casillas de «Para» están como antes de
   este cambio (la del correo de quien lo pide, si lo tiene). La línea gris no habla de ningún
   correo apuntado.
5. Abrir ASUNTO A. La marca de la cabecera termina en «· otra.direccion@ejemplo.es», sin «Tel.».
6. En ASUNTO A, abrir el cuadro de Correo: ninguna casilla de «Para» está marcada, «Otro correo»
   trae `otra.direccion@ejemplo.es`, y la línea gris dice «Correo apuntado en «El encargo»:
   otra.direccion@ejemplo.es».
7. En ASUNTO A, «Enviar estado» (tarjeta «El encargo»): el cuadro sale con esa misma dirección.
8. Abrir ASUNTO C. No hay marca «Lo pide: …»; hay una marca «Contacto: …» con el correo.
9. En ASUNTO C, abrir el cuadro de Correo: en «Para» solo está marcada la casilla de ese correo; las
   demás, sin marcar; «Otro correo», vacío.
10. En ASUNTO B, cambiar «El encargo»: vía «Correo electrónico» y borrar lo escrito. Al guardar, la
    marca de la cabecera pasa a enseñar el correo de quien lo pide (el de su fichero), sin recargar.
11. En ASUNTO B, cambiar «El encargo»: vía «En persona» y nada escrito. Al guardar, la marca queda
    en «Lo pide: …» y nada más.
12. En ASUNTO B, cambiar «El encargo»: vía «En persona» y escribir «llamar por las tardes». La marca
    termina en «· llamar por las tardes», sin «Tel.».
13. En Ajustes, en una plantilla de documento, la lista de huecos ofrece «Quien lo pide: contacto
    apuntado», «Quien lo pide: teléfono» y «Quien lo pide: correo».
14. Un asunto sin nada apuntado en «El encargo»: su cabecera está igual que antes, sin marca nueva.
15. Entrar con «En este ordenador, solo consultar» y abrir ASUNTO A: la marca se ve y copiar
    funciona.
16. Con la ventana a 1280 px de ancho, la cabecera de ASUNTO A y la de su hito no se descuadran ni
    tapan ningún botón.
