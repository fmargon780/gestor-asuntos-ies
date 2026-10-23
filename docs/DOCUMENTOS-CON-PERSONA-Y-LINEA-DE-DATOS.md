# Datos de los documentos: persona elegida de las listas y línea de datos (tema 390)

Diseñado con Francisco el 23-oct-2026 (tema 390, ideas 378 y 380). Dos filas de la cola:
**parte A** (fila 435) y **parte B** (fila 436). La B empieza con la A HECHA.

## De dónde sale

Dos avisos de Francisco desde el botón de soporte (20-oct-2026). Texto copiado aquí para no
depender de abrirlos:

- **Idea 380 (Ajustes):** «Cuando configuramos un tipo de documento, ya nos deja añadir campos al
  documento. Pero ninguno de esos campos están vinculados con las bases de datos o listas del
  sistema. Deberíamos poder hacerlo, de modo que si, por ejemplo, al documento Presentación de
  Candidaturas le pueda añadir el nombre del candidato (Alumno, profesor, padre o PAS) buscándolo
  en la base de datos del sistema, no como texto sin más.» Captura: Ajustes → Tipos de documento →
  PRESENTACION CANDIDATURA → «Campos del nombre», con dos campos de clase Texto.
- **Idea 378 (Ficha de un asunto):** «La información que vemos de cada elemento [de la lista de
  documentos de la carpeta] actualmente está limitada al tipo de doc (PDF), nombre del archivo, y
  número del registro de entrada o salida, en su caso. Necesito ampliar la información que aparece
  en esta vista a los campos que hemos añadido cuando anotamos el documento.» Captura: asunto
  COMPRA A26-0449, una fila «PDF · 261019 FACTURA D26-00253.pdf · Sin registrar».
- Reflexión de Francisco (23-oct-2026): al elegir un documento para adjuntarlo o enviarlo, con solo
  el nombre no hay certeza de que sea el correcto sin abrirlo. Vale para toda la app.

## Lo que ya hay (no rehacer)

- Campos propios por tipo de DOCUMENTO: `js/documentos-campos.js` (`DocCampos`), guardados en
  `_GESTOR/campos.json`, clave `porTipoDocumento`. Clases hoy: texto, lista cerrada, fecha.
  Contexto: `docs/contexto/DOCUMENTOS.md`, apartado «Campos del tipo de documento en el nombre».
- Desde la fila 239 (`docs/contexto/NOMBRES-FIJOS.md`), un documento con número tiene nombre fijo
  `AAMMDD TIPO D26-01234.ext`: **los campos no entran en el nombre**. Van a la ficha:
  `ficha.documentos[<número>]` con `campos` (valores en orden) y `valores` (mapa id → valor),
  escritos con `DocumentosDatos.anotar` (`js/documentos-datos.js`).
- La fila de cada documento de la carpeta (`js/ficha-documentos.js`, `filaDeDocumento`) ya pinta
  una línea `ficha-documento-datos` con `DocumentosDatos.resumen`: «Registro … · valores · texto»,
  **sin decir qué es cada valor**.

- **Las candidaturas ya existen** (fila 347, `js/candidaturas.js`): en un asunto de tipo con
  «Lleva candidaturas», el cuadro de nombre de un documento SOLICITUD DE CANDIDATURA pregunta
  «¿De quién es esta candidatura?», guarda la persona en `ficha.candidaturas` (`persona: { categoria,
  nombre, visible }`, `documentos: [ficheros]`) y la relaciona con el asunto. **No se toca.**

Esto no cambia: el nombre fijo de los documentos con número. Los documentos antiguos (sin número)
siguen como están; no se intenta sacar sus campos del nombre.

---

## Parte A (fila 435): el campo «Persona de las listas»

### Qué hay que hacer

1. **Clase nueva de campo de documento: «Persona de las listas».** En Ajustes → El centro → Tipos
   de documento → menú ⋮ → «Campos del nombre» (`DocCampos.editar`), el desplegable de clase gana
   esta opción. Al elegirla, salen casillas para marcar **en qué listas busca**: todas las
   categorías de terceros de la app, con su nombre de siempre (Alumnado, Personal, Tutores legales,
   Empresas, Administraciones, Otros). Al menos una marcada; si no, no deja guardar («Marca al
   menos una lista»). Se guarda en el mismo `campos.json`, en el propio campo (por ejemplo
   `listas: ['alumnado','personal','familias']`). Los campos de otras clases no cambian.
2. **Elegir buscando.** En el cuadro de anotar o nombrar un documento (`js/documentos.js`,
   `js/documentos-formulario.js`, `DocCampos.pintar`), un campo de esta clase es una caja de
   búsqueda: al escribir, salen debajo las personas que coinciden, solo de las listas marcadas, con
   la lista a la que pertenecen al lado (por ejemplo «Personal», «Alumnado · 2º ESO B»). Se elige
   con un clic o con Intro. Es una caja dentro del mismo cuadro, no otra ventana (la app no abre
   dos a la vez): monta con las piezas que ya hay, `App.buscarEnCategorias` (busca en varias
   listas) y `CajaConSugerencias` (la caja con sugerencias). Mira cómo lo hace `js/candidaturas.js`.
3. **Qué se guarda.** Como en las candidaturas: `{ categoria, nombre, visible }`, donde `nombre`
   es el de `App.textoTercero` (sirve para relacionar) y `visible` es «Apellidos, Nombre», lo que se
   enseña. `campos` (los valores en orden) sigue llevando solo texto (`visible`). Si guardas un
   objeto en `valores`, adapta todo lo que hoy espera texto: `DocCampos.faltaObligatorio`,
   `pintar`, `leerDe`, `enOrden`/`valorParaNombre`. Apunta la forma en
   `docs/contexto/NOMBRES-FIJOS.md`, apartado «Datos del documento».
4. **Si no está en las listas.** Se puede escribir el nombre a mano y guardar. Queda guardado sin
   identificador y marcado como escrito a mano; en el cuadro, junto a la caja, se lee «escrito a
   mano». Para cambiarlo por la persona de la lista, se abre el cuadro del documento con «Cambiar
   el nombre» (menú ⋮ del documento) y se elige.
   Nada más: ningún aviso ni ninguna búsqueda automática después.
5. **Relacionar con el asunto.** Al guardar un documento con una persona elegida de las listas (no
   la escrita a mano), esa persona se añade sola a «Personas y entidades relacionadas» del asunto
   (`js/relacionados.js`), si no estaba ya, **sin preguntar nada** (usa `App.anotarLista` como
   `candidaturas.js`, no `Relacionados.validarYAgregar`, que pregunta). Si la persona es el titular
   del asunto (su tercero), no se añade. No se quita nunca sola, aunque se cambie el campo.
7. El texto del cuadro de Ajustes «Campos del nombre» dice que entran en el nombre del documento:
   desde la fila 239 no es así en los documentos con número. Cámbialo a «Se anotan en cada documento
   de este tipo y salen debajo de su nombre.»
8. No toques el tipo SOLICITUD DE CANDIDATURA ni `js/candidaturas.js`.
6. Un campo de esta clase marcado Obligatorio exige que tenga algo (elegido o escrito a mano).

### Cómo sabré que está bien (parte A)

1. En Ajustes → Tipos de documento → JUSTIFICANTE → Campos del nombre, al añadir un campo se puede
   elegir «Persona de las listas» y marcar las listas en las que busca.
2. En el asunto de transporte de Nicolás Amortegui (A26-0464), al nombrar un JUSTIFICANTE y
   escribir «Amortegui» en el campo «Alumno», sale Nicolás y se elige con un clic.
3. Si en ese campo se elige a otra persona de las listas, al guardar aparece en «Personas y
   entidades relacionadas» del asunto. Nicolás, que ya es el titular, no se repite.
4. Si se escribe un nombre que no está en las listas, deja guardar y sale marcado «escrito a mano».

### Ejemplo con datos reales

Asunto real de transporte de **Nicolás Amortegui (A26-0464)**. Tipo de documento JUSTIFICANTE, con
un campo «Alumno» de clase Persona de las listas (Alumnado). Lo crea Francisco en Ajustes; tú no
toques sus tipos reales. En las pruebas, con los datos de demostración, reproduce el mismo caso con
un alumno de mentira. Las comprobaciones 2 y 3 con el asunto real
quedan [SOLO FRANCISCO] en `docs/COMPROBAR-A-MANO.md`.

---

## Parte B (fila 436): la línea de datos en todas las listas de documentos

Empieza con la fila 435 HECHA.

### Qué hay que hacer

1. **La línea dice qué es cada dato.** `DocumentosDatos.resumen` (o una función nueva a su lado)
   enseña cada campo anotado como «Nombre del campo: valor», separados por « · ». Ejemplo:
   «Candidato: Garrido Mérida, Francisco Manuel». El nombre del campo sale de `campos.json`
   (`porTipoDocumento` del tipo del documento) por su id. Si el campo ya no existe en el tipo, se
   enseña solo el valor, como hoy.
2. **Las candidaturas también.** Un documento que esté en `documentos` de una candidatura de
   `ficha.candidaturas` lleva en su línea «Candidato: <visible>» (de `Candidaturas`), aunque no
   tenga campos anotados.
3. **Solo los campos anotados.** Decidido con Francisco: por ahora la línea lleva los campos
   anotados. El registro y el texto adicional siguen como se ven hoy (no añadir hito, fecha, firmado
   ni enviado). Un documento sin campos anotados se ve igual que hoy.
4. **En todas las listas de documentos de la app**, no solo en la carpeta:
   - la carpeta del asunto (`js/ficha-documentos.js`), también dentro de la pestaña «Trabajo»;
   - los documentos del hito (`js/hito-mesa-documentos.js`): allí el registro ya tiene su columna,
     así que la línea lleva **solo los campos** (sin «Registro …», para no repetirlo);
   - apuntar documentos a un hito (`js/hitos-documentos.js`);
   - la lista para elegir adjuntos de un correo (`js/correo-adjuntos.js`, `pintarBloque`);
   - si eligen documentos de un asunto, `js/seneca-cuadro.js` y `js/grupo-enviar-pantalla.js`.
   Busca cualquier otra lista donde se elija un documento de un asunto para enviarlo o adjuntarlo, y
   ponla también. Una sola función que pinte la línea, usada en todas.
5. La línea va debajo del nombre, en letra pequeña gris, como la de hoy. Si es larga, se corta con
   «…» al final y el texto entero sale al pasar el ratón.

### Cómo sabré que está bien (parte B)

1. En la carpeta del asunto de Elecciones al Consejo Escolar, bajo la solicitud de candidatura de
   Francisco Manuel Garrido Mérida, se lee «Candidato: Garrido Mérida, Francisco Manuel».
2. La misma línea sale en los documentos del hito y en la lista para elegir adjuntos de un correo.
3. Un documento sin campos anotados se ve igual que hoy.

### Ejemplo con datos reales

La solicitud de candidatura de **Francisco Manuel Garrido Mérida** en el asunto real de Elecciones
al Consejo Escolar, y el JUSTIFICANTE del asunto de Nicolás Amortegui (A26-0464) de la parte A. La comprobación 1 con el asunto real queda
[SOLO FRANCISCO] en `docs/COMPROBAR-A-MANO.md`; con datos de demostración, en la prueba.

---

## Lo que no entra (apuntado como idea suelta, fila 437)

Una miniatura de la primera página del documento al pasar el ratón. No se hace aquí.

## Cómo se trabaja

Las reglas de `docs/COLA.md`: sube a `main`, pasa el revisor antes de publicar, prueba en navegador
de verdad que falla sin el cambio y pasa con él, `npm test` en verde, comprueba la publicación.
Pon al día `docs/contexto/DOCUMENTOS.md` y `docs/contexto/NOMBRES-FIJOS.md`.

## Al terminar

Mensaje a Francisco en pocas frases: qué versión está publicada y qué va a ver distinto en
pantalla.
