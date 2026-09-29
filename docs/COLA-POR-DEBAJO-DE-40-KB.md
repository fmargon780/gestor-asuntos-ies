# Fila 226 — `docs/COLA.md` por debajo de 40 KB, siempre

Diseño cerrado con Francisco el 29-sep-2026 (conversación de Cowork de la fila 219).

## Por qué

`docs/COLA.md` pasa de 100 KB. Las conversaciones de diseño de Cowork no tienen `git push`: solo
pueden subir ficheros enteros con la herramienta MCP de GitHub, y por encima de unos 45 KB la subida
puede quedarse cortada sin avisar (reglas 12 y 17 de la cola). Resultado: el 29-sep-2026 una
conversación de diseño no pudo pasar la fila 219 a PENDIENTE ni apuntar una idea nueva. Además,
cada sesión de Claude Code lee el fichero entero y gasta cuota en filas cerradas.

## Lo que se quiere

1. **Salen de la tabla** las filas HECHA, DESCARTADA y SUSTITUIDA. Su texto completo, tal cual, va a
   `docs/HISTORIA.md` (o a un fichero nuevo `docs/COLA-CERRADAS.md` si `docs/HISTORIA.md` se hace
   inmanejable; decide la sesión, y lo deja dicho en la cabecera de `docs/COLA.md`). No se pierde
   ningún texto.
2. **Excepción: las HECHA del día.** Las filas HECHA con fecha de hoy o de ayer se quedan en la
   tabla hasta el día siguiente, porque la página «Centro de mando» de Francisco saca de ahí su
   «Terminado hoy».
3. **Se quedan en la tabla**: IDEA, EN DISEÑO, PENDIENTE, EN CURSO, BLOQUEADA, DEVUELTA y SIN
   PUBLICACIÓN COMPROBADA, en el mismo orden de trabajo que tienen hoy.
4. **Las notas largas** de debajo de la tabla («Lo que queda por hablar con Francisco», avisos,
   entradas para pegar en la historia) también salen: lo ya resuelto, a `docs/HISTORIA.md`; lo que
   sigue abierto, resumido en una o dos líneas por punto en `docs/COLA.md` o, si es largo, en un
   documento propio de `docs/` enlazado desde ahí.
5. **Las reglas para Claude Code** se pueden resumir si ayuda a bajar de 40 KB, sin perder ninguna
   norma vigente: las explicaciones de «pasó el día tal» pueden ir a `docs/HISTORIA.md` dejando la
   norma en una línea.
6. **Norma nueva, escrita en las reglas de la cola y en `CLAUDE.md`**: toda sesión que deje
   `docs/COLA.md` por encima de 40 KB lo reduce en esa misma subida, con los mismos criterios de los
   puntos 1 a 5.
7. **No cambia el formato de la tabla** (`| Nº | Instrucción | Estado |`, estados al principio de
   la columna Estado, enlaces `claude.ai/code/session_…`): la página «Centro de mando» la lee
   tal cual y tiene que seguir funcionando igual (ideas, diseño, pendientes, «Terminado hoy»,
   botón de copiar la frase).

## Cómo sabemos que está bien

1. `docs/COLA.md` en `main` ocupa menos de 40 KB (`wc -c`).
2. Todas las filas IDEA, EN DISEÑO, PENDIENTE, EN CURSO, BLOQUEADA, DEVUELTA y SIN PUBLICACIÓN
   COMPROBADA que había antes siguen en la tabla, con el mismo texto y en el mismo orden.
3. Cada fila que salió de la tabla está, con su texto completo, en `docs/HISTORIA.md` (o en
   `docs/COLA-CERRADAS.md`): comprobado con un script que busca cada número de fila.
4. La norma de los 40 KB está escrita en las reglas de la cola y en `CLAUDE.md`.
5. Solo documentación: no se publica nada en Vercel.
