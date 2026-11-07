# Lecciones de Gestor de asuntos

Errores ya conocidos en esta app y qué hacer en su lugar. Claude Code lo lee al empezar.
Máximo 60 líneas. Si una lección deja de ser cierta, se corrige o se borra.

| Qué falló | Por qué, en una frase | Qué hacer en su lugar | Fecha |
|---|---|---|---|
| `npm test` se cae al arrancar con «AssertionError … undici … !this.paused» | Un fallo de `fetch` de Node 22 cuando hay otra tanda o un servidor cargando | Repetirlo hasta que arranque (a veces 3 veces); no es de la app | 4-nov-2026 |
| `npm test` se cae al arrancar con «AssertionError … undici … !this.paused» y reintentar no arregla nada | Quedan servidores `python3 -m http.server 81xx` de tandas anteriores caídas, y el ejecutor se ahoga con ellos | `ps -eo pid,args \| grep http.server` y `kill <PID>` de cada uno (nunca `pkill -f`); luego repetir | 5-nov-2026 |
| `npm test` se cae al arrancar con undici aunque no queden servidores | El `fetch` de Node 22 de este entorno falla contra el servidor local | Lanzarlo con un fichero que sustituya `globalThis.fetch` por un `http.get` (`NODE_OPTIONS="--import <fichero>"`, fuera del repositorio), o lanzar cada prueba suelta con `DIRECCION=http://127.0.0.1:<puerto>/index.html node pruebas/<f>.mjs` | 6-nov-2026 |

- (5-nov-2026, tema 518) Poner un ejemplo con varias expulsiones dentro de un mismo asunto. Un asunto es un solo hecho, no un contenedor en el tiempo: cada expulsión es un asunto distinto, aunque sea del mismo alumno y tipo. En su lugar: diseñar con un valor de cada dato por asunto.

Las lecciones de diseño generales que estaban aquí (ideas 460 y 544, temas 518 y 540) pasaron a `LECCIONES.md` del método el 7-nov-2026, o ya son regla.
