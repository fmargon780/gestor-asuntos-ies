# Fila 95 — preguntas dentro de las respuestas, en tantos niveles como haga falta

23-sep-2026. Diseñado y cerrado con Francisco el 23-sep-2026 (14:00).

## 1. Lo que pasa hoy

Un paso de la guía puede ser una PREGUNTA con opciones, y cada opción lleva sus propios pasos.
Pero ahí se acaba: `normalizarOpciones` (`js/guias.js`) fuerza `opciones: []` en los subpasos, y
el editor no ofrece marcarlos como pregunta. Un procedimiento con dos decisiones encadenadas no
se puede escribir.

**Esto estaba en la lista de descartado** de `docs/CONTEXTO-CORTO.md` («opciones dentro de
opciones en la guía»). Francisco lo reabre a propósito el 23-sep-2026: los procedimientos reales
del centro lo necesitan. **Quita esa línea de la lista de descartado** al terminar.

## 2. Lo acordado

Sin límite de niveles. Y en el editor, a partir del segundo nivel **no se anida en pantalla**: se
entra y se sale, como en carpetas. Francisco eligió esto sabiendo que es más trabajo, porque los
recuadros dentro de recuadros no se leen.

## 3. El modelo

Un paso es un paso a cualquier profundidad, con los mismos campos: `id`, `titulo`, `cuerpo`,
`opciones`, `requisitos`, `comunicacion`, `responsable`, `estadoAsunto`, `plazo`,
`soloInformativo`, `normativa`, `formularios`, `origenBiblioteca`.

- `normalizarOpciones` deja de vaciar `opciones` y de recortar campos: los pasos de una opción se
  normalizan con `normalizar()` entero, que ya es recursivo.
- Sigue en pie la regla de siempre: un **paso-pregunta** no lleva requisitos, comunicación,
  normativa ni formularios; se resuelve eligiendo una opción. Vale a cualquier nivel.
- El plazo («tantos días desde otro paso») solo puede apuntar a un paso **del mismo nivel**: es
  lo único que se puede ofrecer sin un desplegable imposible de leer.
- `guias.json` no cambia de formato: ya guarda árboles. Las guías escritas hasta hoy siguen
  valiendo tal cual, sin migración.

## 4. El editor

- El primer nivel, igual que hoy: la lista de pasos, y un paso-pregunta con sus opciones a la
  vista y los pasos de cada opción dentro.
- Un paso **dentro de una opción** gana la misma casilla «Este paso es una pregunta». Al
  marcarla, ese paso **no** se dibuja anidado: se queda como una línea con su título, una marca
  «pregunta» y un botón «Entrar».
- «Entrar» no abre otro cuadro (solo hay un `U.preguntar` en toda la aplicación): cambia lo que
  se ve **dentro del mismo cuadro**. Arriba, una línea de camino pulsable:
  `Guía de TRASLADO › ¿Cómo se recibió? › En mano`, y un botón «Volver».
- Antes de entrar o de volver, siempre `recoger()`: no se pierde nada de lo escrito.
- «Guardar» guarda la guía entera, esté donde esté Francisco, y sale del cuadro.
- La biblioteca de hitos sigue sin admitir pasos-pregunta (`HitosBiblioteca.esPasoValido`), a
  cualquier nivel. Traer un modelo dentro de una opción sí vale.

## 5. Dentro de un asunto (los hitos)

- `Hitos.pasoAHito`, `Hitos.crearDesdeGuia*`, `Hitos.visibles` y `Hitos.huerfanos` tienen que
  funcionar a cualquier profundidad: al elegir una opción aparecen sus pasos, y si uno de ellos
  es una pregunta, la lista se corta ahí hasta que se responda.
- Cambiar una respuesta de arriba arrastra a todas las de debajo: los hitos vacíos de esa rama se
  quitan y los que tenían notas o documentos quedan «no aplica», plegados al final. Mismo
  criterio de siempre, aplicado a todo el subárbol.
- La vista de solo lectura (`Guias.vista`) ya es recursiva: comprobar que pinta bien tres niveles.
- Los formularios del asunto (`Formularios.clavesDelAsunto`) siguen contando solo los hitos
  visibles, ahora del camino entero.

## 6. Cómo se comprueba

- `pruebas/guias.mjs` y `pruebas/opciones.mjs`, ampliadas: una guía de tres niveles se guarda, se
  relee y se pinta igual; un paso-pregunta de tercer nivel no admite requisitos.
- `pruebas/hitos.mjs`: elegir en cascada, cambiar una respuesta de arriba, y que lo trabajado no
  se pierde.
- Una prueba en navegador de verdad del entrar/volver del editor: entrar dos niveles, escribir,
  volver, y que lo escrito sigue ahí al guardar.

Sube a `main` sin abrir ninguna petición de cambios.
