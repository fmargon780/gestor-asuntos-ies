# Lecciones de Gestor de asuntos

Errores ya conocidos en esta app y qué hacer en su lugar. Claude Code lo lee al empezar.
Máximo 60 líneas. Si una lección deja de ser cierta, se corrige o se borra.

| Qué falló | Por qué, en una frase | Qué hacer en su lugar | Fecha |
|---|---|---|---|
| `npm test` se cae al arrancar con «AssertionError … undici … !this.paused» | Un fallo de `fetch` de Node 22 cuando hay otra tanda o un servidor cargando | Repetirlo hasta que arranque (a veces 3 veces); no es de la app | 4-nov-2026 |
| `npm test` se cae al arrancar con «AssertionError … undici … !this.paused» y reintentar no arregla nada | Quedan servidores `python3 -m http.server 81xx` de tandas anteriores caídas, y el ejecutor se ahoga con ellos | `ps -eo pid,args \| grep http.server` y `kill <PID>` de cada uno (nunca `pkill -f`); luego repetir | 5-nov-2026 |

- **5-nov-2026, idea 460 (ya pasada a `LECCIONES.md` del método, parte 2):** Claude guió a Francisco por las pantallas de Google Drive buscando una opción sin saber si existía, sin decírselo y sin recordarle para qué era: «No tengo claro qué estamos haciendo y la impresión que me das es de no tener dominio de esto». En su lugar: antes del primer paso en un programa ajeno, decirle para qué sirve el paso y qué se sabe seguro y qué no; si la ayuda oficial no confirma la opción, decirlo antes de mandarle a buscarla.

- (5-nov-2026, tema 518; de valor general: falta pasarla a `LECCIONES.md` del método, parte 2, porque esta sesión no pudo escribir allí) Abrir un tema con un análisis largo, lleno de nombres de ventanas y de partes y pegas: «no me he enterado de casi nada». En su lugar: primero devolverle en dos o tres frases lo que quiere conseguir, y comprobar que es eso, antes de entrar en cómo está la app.
