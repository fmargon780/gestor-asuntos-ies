# Método de trabajo con ficha del cambio

Acordado con Francisco el 25-oct-2026 para **todos** sus proyectos. Nace de un problema real:
cambios que acababan en horas de programación y en tener que cambiar de estrategia, porque se
suponía más de lo que Francisco había dicho. Manda sobre cualquier otra regla de este
repositorio que diga lo contrario, salvo la regla general de publicación de `CLAUDE.md`.

Francisco no es programador. Conoce muy bien el negocio. Todo lo que se le pregunte o se le
enseñe va en lenguaje llano, una idea por frase, sin palabras técnicas.

## Parte 1 — La conversación de diseño (chat o Cowork, antes de escribir la fila)

1. **Francisco cuenta la idea** como le salga. Todavía no se propone nada.
2. **Pedirle la información que falta**, no solo las dudas: datos, documentos, cómo se hace
   hoy y **al menos un ejemplo real** (una clienta, una factura, una situación concreta).
3. **Preguntar de una en una** hasta que no quede ninguna duda. Si hay duda, se pregunta; no
   se elige por él.
4. **Revisar la app entera** buscando todo lo que el cambio toca. Si un sistema nuevo sustituye
   a otro, se revisa **todo lo que dependía del antiguo** (pantallas, avisos, saldos, informes,
   facturas, datos guardados, tareas automáticas). Esto se hace después de hablar con él, no
   antes.
5. **Escribir la ficha del cambio** (plantilla abajo) y **enseñarle un dibujo de la pantalla**
   tal como quedará.
6. Francisco acepta o corrige cada suposición y cada punto de «Qué más se ve afectado».
7. Con su **sí explícito** a la ficha completa, la ficha se guarda dentro de la instrucción de
   la fila en `docs/`, y la fila pasa a PENDIENTE en `docs/COLA.md`. Sin ese sí no se sube nada.
8. Si la ficha es grande, se parte en varias filas pequeñas, cada una con algo que se pueda ver
   en pantalla.

Lo deduce Claude, nunca se le pregunta a Francisco: en qué ficheros, repositorios o documentos
hay que aplicar algo, ni cómo se programa.

## Plantilla de la ficha

```
## Ficha del cambio

### Qué verá y hará la usuaria cuando esté terminado
- …

### Qué NO cambia
- …

### Qué NO se hace en esta tarea
- …

### Qué más se ve afectado (y qué pasa con cada cosa)
- <pantalla, aviso, informe, dato…>: <qué le pasa> — confirmado por Francisco

### Lo que Claude había supuesto (cada punto, aceptado o corregido por Francisco)
- <suposición> → <aceptada | corregida: …>

### Ejemplo real que ha dado Francisco
- …

### Cómo se comprueba (un punto por cada línea de «Qué verá y hará la usuaria»)
- …

### Respuestas de Francisco durante el trabajo
- (las apunta Claude Code si tiene que preguntarle algo)
```

**Lo que no está en la ficha no se programa.**

## Parte 2 — Claude Code, al trabajar una fila con ficha

1. **Se programa solo lo que dice la ficha.** Nada de mejoras de paso.
2. **Se para y pregunta** (y en estos dos casos esto manda sobre cualquier regla de este
   repositorio que diga «no se para a preguntar a Francisco»):
   - Aparece algo que la ficha no cubre y que **cambia lo que ve o hace la usuaria**.
   - El cambio resulta **bastante más grande** de lo previsto en la estimación (más del doble).
   Las decisiones técnicas que no cambian nada para la usuaria las sigue tomando la sesión,
   como hasta ahora.
3. **Cómo se pregunta:**
   - Si Francisco está en la conversación: se le pregunta allí, en lenguaje llano, una sola
     pregunta, sobre lo que ve o hace la usuaria, con la opción recomendada marcada.
   - Si la sesión va sola (lanzada por la tarea programada): la fila pasa a **BLOQUEADA** con la
     nota «PREGUNTA PARA FRANCISCO: <la pregunta, en lenguaje llano, con la opción
     recomendada>», `main` no se toca y la sesión para.
   - La respuesta se apunta en la ficha, en «Respuestas de Francisco durante el trabajo».
4. **Pruebas:** solo las de «Cómo se comprueba», más la comprobación general de que lo que ya
   funcionaba sigue funcionando (las pruebas del repositorio, según sus reglas).
5. **Al terminar, antes de publicar:** repasar la ficha **punto por punto** y dejar escrito en la
   nota de la fila (y en el PR, si lo hay) cada punto con «cumplido» o «no cumplido» y por qué.
   Un punto no cumplido no se publica.
6. **Una sola publicación por ficha**, según la regla de publicación del repositorio.
7. Si durante el trabajo se decide algo del negocio, se añade al documento de reglas del
   negocio (abajo).

## Parte 3 — Después de Claude Code

Claude, en la conversación con Francisco, revisa el trabajo contra la ficha **antes** de decirle
que está hecho. Si falta algo, vuelve a Claude Code, no a Francisco. A Francisco solo se le pide
mirar en pantalla lo de «Qué verá y hará la usuaria».

## Reglas del negocio

Cada proyecto guarda las decisiones de negocio ya tomadas, con la frase de Francisco y su fecha,
para que ninguna conversación nueva las contradiga. Es el documento de reglas de negocio que ya
tenga el proyecto (por ejemplo `claude/libro-de-la-aplicacion.md`); si no tiene ninguno,
`docs/REGLAS-NEGOCIO.md`, que se crea la primera vez que haga falta. La conversación de diseño lo
lee antes de escribir la ficha.

## Filas antiguas

Las filas PENDIENTE escritas antes del 25-oct-2026 no tienen ficha. Se trabajan como hasta ahora,
pero los puntos 2 y 3 de la Parte 2 (parar y preguntar) se aplican también a ellas.
