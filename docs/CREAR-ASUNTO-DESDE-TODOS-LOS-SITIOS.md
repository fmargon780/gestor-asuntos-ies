# Fila 220 — Crear un asunto: el mismo formulario nuevo desde todos los sitios, y sin bloqueos

Apuntada el 28-sep-2026 desde una conversación de Cowork. Francisco confirmó que el diseño está
cerrado. Es un arreglo de la fila 215 (`docs/NUEVO-ASUNTO-CATEGORIA-GUIA.md`), no un diseño nuevo.

## Lo que ve Francisco

Tras publicarse la fila 215 (web en `App.VERSION` `28-sep-2026 · 11:22`, comprobado):

- Según desde dónde crea el asunto, el formulario sale con lo nuevo de la 215 o sin ello.
- **Incluso desde un mismo sitio**, unas veces salen las opciones y la colocación nuevas y otras
  no.
- A veces el formulario **se bloquea** y no deja crear el asunto.

## Qué hay que hacer

1. **Hacer la lista de todas las entradas a «Nuevo asunto».** Como mínimo (comprobar que no hay
   más, con `grep` de `App.ir('nuevo')`, `App.nuevoAsuntoCon`, `prepararNuevo` y similares):
   - el botón de la barra (`js/barra.js`);
   - el tablón compacto (`js/tablon-compacto.js`);
   - «+ Nuevo asunto para esta persona» (`js/archivo-personas.js`);
   - documentos sueltos (`js/documentos-sueltos.js`);
   - la propuesta de la bandeja de correos (`js/bandeja-propuesta.js`);
   - `js/asuntos-nuevo-crear.js` (línea con `App.ir('nuevo')`) y la navegación (`js/navegacion.js`,
     `js/nucleo.js` → `App.prepararNuevo`).
   Apuntar la lista en `docs/contexto/ASUNTOS.md`.

2. **Que todas pasen por el mismo camino.** Una sola función que prepara el formulario desde cero
   cada vez (limpia lo que quedara de la vez anterior: `App.E.nuevo`, categoría, tipo, tercero,
   propuesta, filtros, foco) y después aplica lo que traiga esa entrada (tercero, tipo, propuesta).
   Ninguna entrada puede pintar el formulario por su cuenta ni saltarse esa preparación.

3. **Encontrar la causa de «unas veces sí y otras no» y quitarla.** Pistas a comprobar, sin darlas
   por buenas:
   - restos de la visita anterior al formulario (estado que no se limpia al volver a entrar);
   - `categoriaDeLaParrilla()` da prioridad a tercero y propuesto sobre la pastilla: cuando la
     entrada trae un tercero, pulsar la pastilla puede no filtrar nada y parecer «lo de antes».
     Decidir un comportamiento que Francisco perciba como coherente: **la pastilla que pulsa
     manda siempre sobre la parrilla de tipos**;
   - orden de carga o de pintado (algo que se pinta antes de que lleguen los datos de tipos o de
     personas y no se repinta después);
   - la caché del navegador parece descartada (`vercel.json` ya manda
     `Cache-Control: max-age=0, must-revalidate`), pero confirmarlo.
   Escribir la causa encontrada en `docs/HISTORIA.md`.

4. **Encontrar y quitar el bloqueo.** Reproducirlo (entrar varias veces seguidas, desde sitios
   distintos, alternando con y sin tercero, pulsando pastillas, volviendo atrás). «Crear el
   asunto» nunca puede quedarse inservible sin decir por qué: si falta algo, el botón lo dice (como
   pide la 215); si hay un error, se ve un aviso, no un formulario muerto.

## Pruebas

- Una prueba nueva que recorre **cada entrada de la lista del punto 1**, dos veces seguidas y
  alternando entre ellas, y comprueba en todas: pastillas de categoría encima del buscador de
  personas; la pastilla filtra la parrilla de tipos; 8 más usados + «Ver todos»; «Crear el asunto»
  visible; se puede crear el asunto de principio a fin.
- Al terminar, `npm test` completo.
- Comprobar en la web publicada (`curl`) que la versión nueva está servida, como en la 215.

## Cómo trabajar

- Reglas de la cola (una fila, subida con `git`, `docs/HISTORIA.md` y `CONTEXTO-CORTO.md` al día).
- Si se descubre que alguna entrada debería crear el asunto de otra forma por diseño (no por
  error), no inventar: dejarlo anotado en «Lo que queda por hablar con Francisco» de
  `docs/COLA.md`.
