# Fila 88 — "Por clasificar": sugerir un asunto ya existente a partir de lo leído en el documento

Diseño cerrado con Francisco el 21-sep-2026 (conversación del proyecto de Claude). No preguntes nada:
todo lo que había que decidir está aquí.

## Contexto

Desde la fila 41 (`docs/LEER-DOCUMENTOS-POR-CLASIFICAR.md`), cada PDF de "Por clasificar" se lee con
pdf.js (`js/documentos-sueltos-lector.js` + `LectorDocumentos.analizar`) y se propone tipo, fecha,
registro y tercero. Pero **lo leído solo sirve para crear un asunto nuevo** (botón "Aceptar" →
`App.crearAsuntoConPropuesta`). Para meterlo en un asunto que ya existe, "Meter en un asunto"
(`App.meterSueltoEnAsunto`) puntúa **solo con el nombre del fichero**.

La bandeja de correos sí busca asunto existente (ver `docs/contexto/CORREO-Y-SENECA.md`). Esta fila
hace lo mismo con los documentos sueltos, usando lo que el lector ya encuentra dentro del PDF.

Lee antes `docs/contexto/DOCUMENTOS.md` (secciones "El cuadro de elegir asunto, y Por clasificar" y
"Leer los documentos que entran en Por clasificar") y `docs/contexto/ASUNTOS-ARCHIVO.md` (índice del
ARCHIVO, ficha del asunto archivado en su propia carpeta).

## Qué tiene que pasar

Solo cuando el lector **ha reconocido un tercero** en el documento. Sin tercero, la tarjeta se queda
exactamente como hoy.

1. **Buscar los asuntos de ese tercero.** Abiertos (en `asuntos.json`) y archivados (con el índice
   del ARCHIVO que ya existe; no recorrer el ARCHIVO carpeta a carpeta). Un asunto es "de ese
   tercero" si su tercero es el mismo: compara por documento (Nº de identificación escolar, últimos
   caracteres del documento del personal, NIF de empresa) cuando se pueda, y si no por el nombre del
   tercero dentro del nombre de la carpeta (`ElegirAsunto.terceroDentroDe`). Los terceros
   relacionados de un asunto **no** cuentan: solo el tercero principal.

2. **Si tiene asuntos abiertos**, la tarjeta enseña **hasta 3**, en este orden: primero los del mismo
   tipo que ha propuesto el lector, después los demás; dentro de cada grupo, el que se movió más
   recientemente primero. Los que no son del tipo propuesto llevan la marca **«otro tipo»**. Si el
   lector no ha propuesto tipo, todos van sin marca, ordenados por reciente.

3. **Si no tiene ninguno abierto**, la tarjeta enseña **hasta 3 archivados del mismo tipo** que ha
   propuesto el lector, el más reciente primero, con la marca **«archivado»**. Si el lector no ha
   propuesto tipo, o no hay archivados de ese tipo, la tarjeta no sugiere archivados.

4. **Si tiene abiertos, los archivados no salen en la tarjeta** (aunque haya del mismo tipo). Los
   archivados de otro tipo nunca salen en la tarjeta. Todos siguen disponibles en "Meter en un
   asunto".

5. **Cómo se ve.** Debajo de la línea de lo leído (`26EM0368 · 10-sep-2026 · SOLICITUD · García
   Pérez, Ana`), una línea por asunto sugerido: «Podría ir en: <nombre del asunto>» + marca si la
   lleva + botón **«Meter aquí»**, destacado (estilo de botón principal). Mismo criterio que el botón
   "Aceptar" de la fila 41: fuera de `.acciones`, que tiene su lista fija de botones comprobada en
   `pruebas/documentos-sueltos.mjs`.

6. **"Crear asunto nuevo" pasa a discreto** cuando hay alguna sugerencia: el actual "Aceptar" (que
   crea el asunto con tipo y tercero propuestos) se rotula **«Crear asunto nuevo»** y se pinta como
   botón secundario, al lado. Sin sugerencias, se queda exactamente como hoy.

7. **«Meter aquí»** reutiliza el camino de siempre: `App.llevarSueltoA` (copia, comprueba y borra;
   no pisa un fichero existente; avisa si la ruta es demasiado larga) y después el cuadro de ponerle
   nombre. Si el asunto está archivado, antes sale el cuadro que ya existe
   (`ElegirAsunto.preguntarSiReabrir`) con «Reabrir y meterlo aquí» o «Meterlo sin reabrir», igual
   que desde "Meter en un asunto". **Nunca se mete nada solo: siempre hay que pulsar.**

8. **"Meter en un asunto" también usa lo leído.** En `App.meterSueltoEnAsunto`, si el lector ya tiene
   resultado en caché para ese fichero, se suma a la puntuación actual (que no se quita): +50 si el
   tercero leído es el tercero del asunto, +10 si el tipo leído es el del asunto. Así los asuntos del
   tercero salen arriba, en "Podrían encajar". Si el lector aún no ha terminado o no encontró nada,
   la puntuación es la de hoy.

9. **En el panel de la derecha** (`App.accionesDeSuelto`), las sugerencias salen igual que en la
   tarjeta, porque se construye con `App.tarjetaSuelto`.

## Lo que no se toca

- `LectorDocumentos.analizar` y cómo se reconoce el tercero: no cambian.
- La bandeja de correos (`js/bandeja-*.js`), ni `Bandeja.proponer`.
- La cola de lectura de uno en uno y la caché por nombre de fichero: no se lee nada dos veces.
- Un documento que no sea PDF, o un PDF sin texto: igual que hoy.

## Dónde

Preferiblemente en un módulo nuevo (por ejemplo `js/documentos-sueltos-sugerencias.js`) enganchado
por el mismo sitio que la línea del lector, sin envolver nada nuevo si se puede evitar (regla de la
sección 6 de `docs/CONTEXTO-CORTO.md`). Si hace falta envolver, apuntarlo en
`js/envolturas-esperadas.js`.

## Pruebas

Ampliar `pruebas/documentos-sueltos.mjs` o crear `pruebas/sugerir-asunto-existente.mjs`, en navegador
de verdad, con un PDF montado a mano como en `pruebas/dar-de-alta-desde-documento.mjs`:

- Tercero con un asunto abierto del mismo tipo: sale una sugerencia sin marca, «Meter aquí» lo mete.
- Tercero con 4 abiertos (2 del mismo tipo, 2 de otro): salen 3, primero los del mismo tipo, el
  tercero con «otro tipo».
- Tercero sin abiertos y con 2 archivados del mismo tipo y 1 de otro: salen los 2, con «archivado»;
  «Meter aquí» pregunta si reabrir.
- Tercero con abiertos y archivados: solo salen los abiertos.
- Sin tercero reconocido: la tarjeta, idéntica a la de hoy.
- Con sugerencias, el botón de crear se llama «Crear asunto nuevo» y es secundario.
- "Meter en un asunto" pone arriba los asuntos del tercero leído.

## Al terminar

Lo de siempre (reglas 8 y 9 de `docs/COLA.md`): sustituir en `docs/CONTEXTO-CORTO.md` la línea de
"Por clasificar" de la sección 5, actualizar `docs/contexto/DOCUMENTOS.md` y apuntar en
`docs/HISTORIA.md`.

En el mensaje final a Francisco, qué va a ver: al abrir "Por clasificar", los documentos de alguien
que ya tiene asunto dicen «Podría ir en: …» con el botón «Meter aquí».
