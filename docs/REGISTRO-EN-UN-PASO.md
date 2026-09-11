# Registrar un documento sin nombrarlo dos veces

Instrucción para Claude Code. Se lanza **después** del plan de robustez
(`docs/PLAN-ROBUSTEZ-2026-09.md`). Lee antes `docs/CONTEXTO.md` y respeta sus reglas de
trabajo (pocos commits, versión con hora, prueba para cada cambio, releer los ficheros
compartidos antes de escribir, `docs/CONTEXTO.md` al día en el mismo commit, comprobar que
Vercel sirve los ficheros nuevos). No le preguntes nada a Francisco: decide, apunta la
decisión en `docs/CONTEXTO.md` y sigue.

## El problema

Dar registro de entrada o de salida a un documento es de lo más habitual en el puesto. Hoy el
camino es: nombrar el documento sin registro → salir de la ficha → añadir otro documento (la
copia sellada que baja de Séneca) → volver a escribir fecha, tipo y texto, ahora con el número
de registro. Francisco quiere conservar los dos ficheros en el expediente, el original y el
sellado. Lo que sobra es nombrar dos veces y salir de la ficha.

## Lo que hay que hacer

### 1. Botón "Registrar" en cada documento de la ficha del asunto

En la lista de documentos de la ficha (`js/ficha-asunto.js`) y en el cuadro "Gestionar
documentos" (`js/documentos.js`), cada documento **que no lleve ya número de registro** en su
nombre tiene un botón **Registrar**. Al pulsarlo:

1. Se abre el selector de ficheros del navegador (`Carpetas.elegirFichero`), para elegir la
   copia sellada donde esté (normalmente Descargas).
2. Sale un cuadro con **solo el número de registro**, con las mismas cuatro piezas que ya usa
   el cuadro de nombrar documentos: el año (propuesto por la fecha de hoy, se puede cambiar),
   Entrada/Salida, Manual/Automática y los cuatro dígitos. El foco entra en los cuatro dígitos.
   Debajo, en gris, se enseña el nombre que va a tener el fichero, actualizándose al escribir.
3. Al aceptar, la aplicación copia el fichero elegido dentro de la carpeta del asunto con el
   nombre montado por `Nombres`/`Documentos` a partir del original: **misma fecha `AAMMDD`,
   mismo TIPO, mismo texto adicional**, más el registro: `AAMMDD 26EM1234 TIPO TEXTO.ext`.
   La extensión es la del fichero sellado, no la del original.
4. El original se queda como está. La lista de la ficha se repinta y los dos salen juntos.
5. Se apunta una nota en el asunto: "Registrado 26EM1234 · <nombre del documento>".

Reutiliza lo que ya existe: el cuadro de nombrar documentos ya sabe leer el registro y montar
el nombre (`js/documentos.js`, `js/nombres.js`), y "elegir desde la app y guardar una copia con
el nombre montado" ya está hecho (`Carpetas.copiarFicheroEn`). No dupliques esa lógica: llámala.

Si ya existe un fichero con ese nombre en la carpeta, se avisa y no se sobrescribe.

### 2. Casilla "Pendiente de registro"

En el cuadro de nombrar un documento nuevo, una casilla **Pendiente de registro**, apagada de
partida. Solo se enseña si el documento **no** lleva número de registro.

- Lo marcado se guarda en la ficha del asunto en `_GESTOR/asuntos.json`, en una lista
  `pendientesRegistro` con los nombres de fichero. Releer antes de escribir, como siempre
  (`App.anotar`).
- En la ficha del asunto, un documento pendiente lleva una marca ámbar "Sin registrar" al lado
  del nombre, y el botón Registrar sale destacado.
- Al registrarlo (punto 1) se quita de la lista. Si el fichero se renombra desde "Gestionar
  documentos", el nombre de la lista se actualiza; si se borra, se quita.
- En la tarjeta del asunto de la lista de abiertos **no** se añade nada: la tarjeta se queda con
  lo justo, a propósito (ver `BOTONES_DE_LA_TARJETA` en `docs/CONTEXTO.md`).

### 3. Preparado para leer el número solo, más adelante

Deja el cuadro del punto 1 con un hueco para rellenar el registro desde fuera: una función
`Registro.proponer({ anio, tipo, serie, numero })` que rellena las cuatro piezas. Hoy nadie la
llama. Cuando se compruebe con un PDF sellado real de Séneca si el número va como texto dentro
del PDF, se añadirá un módulo que lo lea y llame a esa función. **No lo hagas ahora**: no hay
todavía un PDF de muestra.

## Pruebas

- Prueba de navegador (`pruebas/registro.mjs`): un asunto con `260911 FACTURA Referencia
  123.pdf`; se pulsa Registrar, se elige un fichero del disco de mentira, se escriben `1234`
  con Entrada y Manual, y aparece `260911 26EM1234 FACTURA Referencia 123.pdf` junto al
  original, con la nota apuntada. Otra: con la casilla marcada al nombrar, la marca ámbar sale
  y desaparece al registrar. Otra: un documento que ya lleva registro no tiene botón Registrar.
- Comprobar que la prueba falla sin el cambio antes de darla por buena.

## Documentación

Apartado nuevo en `docs/CONTEXTO.md`, sección 5: "Registrar un documento en un paso", con qué
hace, dónde vive, y el hueco `Registro.proponer` para más adelante. Añade `pendientesRegistro`
a la descripción de `asuntos.json`. Mensaje final a Francisco: tres frases, qué va a ver en la
ficha de un asunto.
