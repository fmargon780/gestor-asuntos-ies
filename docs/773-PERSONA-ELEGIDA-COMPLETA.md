# 773 — La persona elegida, completa en las plantillas

Sale del tema 765 y de las ideas 763 y 764. Arregla y completa lo de la fila 747
(`docs/747-CAMPO-UNA-PERSONA-DEL-ASUNTO.md`).

**Título llano:** La persona elegida, completa en las plantillas
**Para qué:** que una plantilla con «Una persona del asunto» funcione aunque solo use el nombre o el DNI, y que diga en calidad de qué actúa esa persona (padre, madre, alumno, alumna…).

## Lo que escribió Francisco
- Idea 763 (26-nov-2026): campo de plantilla «en calidad de» para la persona elegida en «Una persona del asunto»: que la app guarde la clase de cada persona (alumno/a, tutor/a legal, empresa, quien lo pide…) y ofrezca el campo hermano `{campo:Nombre (en calidad de)}` junto a `(nombre)`, `(DNI)`, `(teléfono)` y `(correo)`.
- Idea 764 (26-nov-2026): que «Una persona del asunto» pregunte la lista de personas aunque la plantilla solo lleve los campos con sufijo, como `{campo:Nombre (Nombre)}` o `{campo:Nombre (DNI)}`, sin el campo principal `{campo:Nombre}`. Hoy los trata como datos sueltos y pide escribirlos a mano en «Faltan datos para este documento». Visto con la plantilla «AITE - Persona Perceptora».
- Al diseñar (26-nov-2026): «Creo que hay una forma de acertar el 99% de los casos con el padre o madre. Sería mirando el sexo del tutor 1 o 2. Si es hombre convendremos que es el padre, si mujer, la madre. Existe la posibilidad de que no fuera (cambio de género o tutoría legal). Por este motivo, sería un valor por defecto que se debería poder cambiar.»

## Lo que entendió Claude (acordado con Francisco el 26-nov-2026)
- Un campo de plantilla con un paréntesis detrás del nombre de un campo «Una persona del asunto» es parte de esa persona: `(nombre)`, `(DNI)`, `(teléfono)`, `(correo)` y el nuevo `(en calidad de)`. Da igual mayúsculas o minúsculas, y tildes o no: `{campo:Nombre (Nombre)}` vale igual que `{campo:Nombre (nombre)}`.
- Al generar un documento que solo lleva esos campos con paréntesis (sin el campo entero), la app pregunta «¿Quién?» con la lista de personas de siempre, una sola vez, como si llevara el campo entero. Ya no salen como datos sueltos para escribir a mano en «Faltan datos para este documento».
- Todos esos campos se rellenan solos con la persona elegida. Si es una persona sin DNI, se pide el DNI como ya se hace hoy.
- Nuevo campo `{campo:<nombre del campo> (en calidad de)}`. Su valor por defecto lo pone la app según de dónde sale la persona:
  - Tutor legal 1 o 2: «padre» si Séneca dice que es hombre; «madre» si dice que es mujer; «tutor/a legal» si no se sabe.
  - Quien lo pide: la relación escrita al apuntarlo, en minúscula (por ejemplo «madre»). Sin relación, como el resto según su clase.
  - El tercero y los relacionados, según su clase: Alumnado → «alumno» o «alumna» («alumno/a» sin el sexo); Tutores legales → «padre», «madre» o «tutor/a legal», como arriba; Personal → «personal del centro».
  - Si no hay de dónde sacarlo (otra clase, o una persona escrita a mano sin relación): al generar, la app lo pide como cualquier dato que falta («En calidad de <campo>») y lo guarda en el asunto.
- Es un valor por defecto que se puede cambiar. En la ficha del asunto, «Campos de este asunto», la persona elegida ya tiene «Cambiar» (fila 747); debajo de ella sale «En calidad de: <valor>» con su propio «Cambiar», que deja escribir otro texto (por ejemplo «tutora legal»). Lo escrito vale para ese asunto y lo usan todas sus plantillas.
- Si se cambia de persona, «en calidad de» vuelve al valor por defecto de la nueva (lo escrito a mano para la anterior se quita, como ya pasa con el DNI).
- Nada desaparece de la app. «Tutor con custodia» sigue igual.

## Pantalla de prueba
Tarea pequeña: sin pantalla de prueba.

## Qué NO se hace en esta tarea
- Cambiar las plantillas que ya existen (se cambian a mano, una a una).
- Guardar un rol en los terceros relacionados: su «en calidad de» sale de su clase.
- Tocar «Tutor con custodia».

## Notas técnicas de Claude
- Punto de partida: `js/persona-del-asunto.js` (`personas`, `guardar`, `cerrar`, `pedirDni`), `js/plantillas.js` (`resolverUnHueco`, rama `campo:`; hoy busca el campo con sufijo como un campo suelto y lo añade a `faltan`), `js/plantillas-valores.js` (línea con `PersonaDelAsunto.alDocumento`), `js/word-faltan.js`, `js/ficha-campos-lista-vacia.js` y `js/ficha-bloques.js` (el «Cambiar» de la persona).
- Reconocer el sufijo: separar `Nombre (sufijo)` por el último paréntesis, normalizar (`U.normalizar`) y mirar si la base es un campo de clase `personaAsunto` (`Campos.claseDeCampo`). Si lo es y la persona no está elegida, en `faltan` va el campo base (una sola vez), no cada hermano; así «Faltan datos» enseña el desplegable de siempre (`DatosDelAsunto.infoDe` ya lo convierte en lista). Ojo con los sitios que reúnen los campos de una plantilla antes de generar (`CamposLista.reunir`, `Plantillas.camposDe` o similar): que un hermano cuente como su campo base.
- `cerrar`: buscar los hermanos sin mayúsculas ni tildes (hoy se crean como `(nombre)`, `(DNI)`…; `buscarCampo` debe encontrarlos con `(Nombre)`). Añadir `salida[nombre + ' (en calidad de)']`.
- Valor por defecto de «en calidad de»: calcularlo en `personas()` (campo `calidad` de cada persona) y guardarlo en `persona.calidad` al elegir. Sexo: `Genero` (`sexosDeAsunto` para tercero, tutor1, tutor2; `Genero.sexoDe(persona, categoria)` para quien lo pide y relacionados). Lo escrito a mano va en `persona.calidadAMano` (o un dato «En calidad de <campo>» con `DatosDelAsunto.guardar`, como el DNI); al cambiar de persona se borra.
- Sin valor por defecto: `salida.sinCalidad` igual que `salida.sinDni`, y se pide solo si la plantilla usa `(en calidad de)`.
- Ficheros por debajo de 400 líneas: si `js/persona-del-asunto.js` (210) crece mucho, lo nuevo en `js/persona-del-asunto-calidad.js`, apuntado en su `js/cargar-piezas-N.js`.
- Prueba: ampliar `pruebas/persona-del-asunto.mjs` con plantilla solo con hermanos (mayúscula), «padre»/«madre»/«tutor/a legal», «alumna», sin valor (pide), «Cambiar» y vuelta al valor por defecto al cambiar de persona. Una tanda: `npm test -- persona plantilla word`. Casos en la demostración grande (`js/demo/datos-grande-*.js`): una plantilla con solo `{campo:… (Nombre)}`, `(DNI)` y `(en calidad de)`.
- Novedades visibles: línea al principio de `js/novedades.js`.

## Cómo lo comprueba el segundo revisor
Tarea pequeña: sin segundo revisor. El revisor de siempre comprueba:
- Una plantilla con solo `{campo:X (Nombre)}` y `{campo:X (DNI)}` (X de clase «Una persona del asunto») pregunta «¿Quién?» con la lista de personas, una vez, y no pide esos datos a mano.
- El documento lleva el nombre y el DNI de la elegida, y `{campo:X (en calidad de)}` sale «padre» o «madre» según el sexo del tutor, y «alumno» o «alumna» para el tercero alumno.
- En «Campos de este asunto», «En calidad de» se cambia con «Cambiar» y el documento siguiente lleva lo escrito.
- Al cambiar de persona, «en calidad de» vuelve al valor por defecto de la nueva.
- Una persona sin valor por defecto: al generar se pide «En calidad de…» y se guarda.
- Una plantilla con el campo entero `{campo:X}` sigue igual que antes.

## Qué mirar al terminar
- Generar una plantilla con solo `(Nombre)`, `(DNI)` y `(en calidad de)` en un asunto de alumno con dos tutores: sale «¿Quién?» una vez.
- Elegir el padre y la madre: «padre» y «madre»; elegir al alumno o alumna.
- Cambiar «en calidad de» a «tutora legal» y volver a generar.
- Solo Francisco, con sus datos: la plantilla «AITE - Persona Perceptora» `[solo en: la app real]`.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- 27-nov-2026, revisor aparte: APROBADA. Coincide: plantilla solo con `(Nombre)`/`(DNI)` pregunta la persona una vez; «padre» según el sexo del tutor; «en calidad de» sin valor se pide («En calidad de <campo>») y escrito se guarda; en la ficha, fila «En calidad de» con su «Cambiar» (vacío vuelve al valor de la app); cambiar de persona no arrastra lo escrito; el campo entero sigue igual.
- No lo he podido ver: la plantilla «AITE - Persona Perceptora» con datos reales (solo Francisco); la demostración no trae ninguna plantilla de Word con estos campos, se probó con `Plantillas.rellenar`. El sexo de quien lo pide y de los relacionados no se consulta (la lista es síncrona): su «alumno/a» sale sin sexo; los tutores y el tercero sí lo usan.
- Una persona elegida antes de esta fila no lleva «en calidad de» guardado: se pide al generar, o se escribe con «Cambiar».
- Nueva dirección: la acción de publicación terminó bien, pero la sesión no puede abrir gestor-asuntos-ies.github.io (proxy 403): versión sin comprobar allí.
