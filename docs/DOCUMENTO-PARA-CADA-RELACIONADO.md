# Fila 171 · Un documento para cada relacionado (certificados de actividad extraescolar)

Acordado con Francisco el 25-sep-2026. **Va después de la fila 170**, que trae la plantilla
«Participación del profesorado en actividad extraescolar» (OTROS · ACTIVIDAD EXTRAESCOLAR), que
pide Actividad, Lugar, Fechas y Horas (la aplicación los pregunta si el tipo no los tiene). **Sube directamente a `main`, sin abrir
ninguna petición de cambios.** Cambios quirúrgicos, sin leer el repositorio entero, y una sola
pasada de pruebas al final.

Lee antes `docs/CONTEXTO.md`, `docs/contexto/DOCUMENTOS-PDF.md`, `docs/contexto/HITO-MESA.md` y
`docs/contexto/CORREO-Y-SENECA.md`. Mira cómo lo hace «Repartir un PDF entre terceros» (fila 141,
`js/repartir-*.js`): el reparto por persona ya está resuelto allí.

## Por qué

El documento que más emitía el compañero (más de 420 copias) es el certificado de participación
de un profesor en una actividad extraescolar. Una actividad lleva de dos a diez profesores, y hoy
habría que crear un asunto por profesor y generar uno a uno.

Con esta fila: un asunto por actividad, los profesores como terceros relacionados, y un botón
que genera el certificado de cada uno y se lo manda.

## Qué hace

1. En la mesa de un hito, «Generar documento ▾» ofrece, junto a cada plantilla, **«… para cada
   relacionado (N)»** cuando el asunto tiene relacionados. N es el número de relacionados.
2. Al pulsarlo, la aplicación genera **un documento por relacionado**, con la misma plantilla:
   - Los huecos de la persona (`{{NOMBRE NATURAL}}`, `{{DNI}}`, `{{ESPECIALIDAD}}`,
     `{{REFERENCIA}}`, `{{CORREO}}`, el género de «D./Dña.», «profesor/a»…) salen del relacionado.
   - Los del asunto (`{campo:Actividad}`, `{campo:Fechas}`, `{campo:Horas}`, `{{CURSO}}`…) y los
     del centro y los firmantes, iguales para todos.
   - Lo que falte se pregunta **una sola vez** si es del asunto; si falta un dato de una persona
     (p. ej. su DNI), se dice al final, por persona, sin parar el lote.
3. Cada documento se guarda en la carpeta del asunto, con el nombre de siempre y, como texto
   adicional, el tercero de esa persona (`… CERTIFICADO participacion Apellido1 Apellido2, Nombre`).
   Pasa a «Versiones previas» igual que los demás cuando tenga su PDF.
4. Al terminar, un resumen: «8 certificados generados. A 2 personas les falta el DNI».
5. **«Enviar a cada uno»**: en el mismo resumen, un botón que manda **un correo por persona**,
   con su certificado adjunto y la plantilla de correo del tipo («Envío del certificado de
   participación en una actividad»), con el saludo a esa persona. Con confirmación antes, y nunca
   dos veces a la misma persona por el mismo documento (como el envío de hoy). Quien no tenga
   correo sale en la lista, para Séneca.

## Qué no hace

- No se firma nada: la firma digital sigue fuera de la aplicación.
- No crea un asunto por profesor (eso lo hace «Repartir», y aquí no hace falta: al archivar, cada
  relacionado recibe su carpeta marcador «(RELACIONADO)» y se encuentra buscándolo).
- No se toca la generación de un documento normal.

## Ficheros que se tocan

El módulo que monta «Generar documento ▾» en la mesa del hito, el que rellena los huecos
(`js/plantillas-valores.js`: una función que reciba la persona a usar en vez del tercero
principal; sin tocar la de siempre), el envío de correo (`js/correo.js`) solo para reutilizar el
envío con adjunto, y un módulo nuevo `js/generar-para-relacionados.js` enganchado por un punto
previsto (regla de `docs/CONTEXTO-CORTO.md`, sección 6). Ningún fichero de `js/` pasa de 600 líneas.

## Pruebas

Una prueba nueva, `pruebas/generar-para-relacionados.mjs`: un asunto con tres relacionados
(uno sin DNI) genera tres documentos, con el nombre de cada uno en su documento y en el nombre
del fichero, los campos del asunto iguales en los tres, y el aviso del DNI que falta.

## Al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: una línea («Generar para cada relacionado: un documento
  por persona y un correo a cada una»).
- `docs/contexto/HITO-MESA.md` y `docs/contexto/DOCUMENTOS-PDF.md`.
- `docs/DATOS-QUE-FALTAN-EN-PLANTILLAS.md`, sección 5: borra la línea «El documento para cada
  relacionado».
- `docs/HISTORIA.md`: una entrada con fecha.
