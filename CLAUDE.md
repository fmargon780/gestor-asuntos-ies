# Gestor de asuntos del IES

Antes de nada, lee `docs/CONTEXTO.md` y después `docs/COLA.md`, como dice la cola.

**Una sola sesión y una sola fila** (27-sep-2026): nunca trabajan dos sesiones de Claude Code a la
vez en este repositorio. Cada lanzamiento hace solo la primera fila PENDIENTE de `docs/COLA.md`,
la publica, comprueba la publicación y para. Detalle en la regla 0 de la cola.

**Subir directamente a `main`, sin peticiones de cambios** (28-sep-2026, pedido por Francisco para
que cada fila tarde menos; manda sobre cualquier otra regla de la cola que diga lo contrario):

1. No abras peticiones de cambios (pull requests) ni fusiones ramas por GitHub. Aunque trabajes en
   una rama `claude/...`, sube con `git push origin HEAD:main` (antes, `git pull --rebase origin main`).
2. No esperes a GitHub Actions ni arregles sus fallos como condición para publicar. Lo que vale es
   `npm test` en tu sesión y la publicación comprobada en Vercel (regla general de abajo). Si
   Actions falla en una prueba que en tu sesión pasa, no la persigas: apúntala en una línea en
   `docs/COLA.md` («Lo que queda por hablar con Francisco») y sigue.
3. Una fila son, como mucho, tres subidas a `main`: la marca EN CURSO (con las estimaciones), el
   cambio con su documentación y `version.js`, y, tras comprobar la publicación, la marca HECHA.
   No hagas subidas sueltas fichero a fichero.

**Estimación de tiempo** (28-sep-2026, pedida por Francisco): en la misma subida que marca una fila
EN CURSO, y ya leída su instrucción y el código que toca, pon al día `docs/ESTIMACIONES.md`: una
línea por cada fila que queda (la EN CURSO y todas las PENDIENTE), con los minutos que calculas
para cada una entera (programar, pruebas, publicar y comprobar) y el motivo en pocas palabras.
Borra las filas ya HECHAS. Esa subida tiene que llegar a `main`, no solo a la rama de trabajo: la
página de estado de Francisco lee `main`. No es una subida más: va en la misma de la marca.

## Regla general de publicación (manda sobre cualquier otra regla)

Acordada con Francisco el 26-sep-2026 para todos sus proyectos. Ese día, en otro proyecto,
ninguna publicación salió bien durante horas y se marcaron filas como HECHAS «con todo en
verde», porque solo se probaba en el entorno de trabajo. Para que no pase:

1. **Una fila solo es HECHA cuando está publicada y comprobada.** Probar en tu entorno (tipos,
   pruebas, compilar) es necesario, pero no basta. Hay que comprobar al menos una de estas dos
   cosas: (a) la dirección publicada sirve la versión nueva; (b) la plataforma de publicación
   dice que la publicación de ese commit terminó bien.
2. **Al empezar cualquier sesión, lo primero:** comprobar que la última publicación salió bien.
   Si no salió, arreglarla es lo único que se hace hasta que vuelva a publicar. Nada nuevo
   encima de una publicación rota.
3. **Si no puedes comprobarlo desde tu sesión:** la fila no se marca HECHA. Se deja como
   **SIN PUBLICACIÓN COMPROBADA**, no se empieza otra fila, y tu mensaje final empieza
   exactamente con: «AVISO: no he podido comprobar que los cambios estén publicados.» Esto
   sustituye el «déjalo anotado para que otra sesión lo compruebe» de la regla 19 de
   `docs/COLA.md`.
4. **Si Francisco dice que no ve un cambio,** lo primero es comprobar si se publicó. Nunca
   suponer que es la caché del navegador sin haberlo comprobado.
5. **«En verde»** en un mensaje a Francisco solo se dice si la publicación también lo está.

Cómo se comprueba en este proyecto: se publica en Vercel. `App.VERSION` de la web publicada
(`js/version.js?v=<algo distinto>`) tiene que ser de después de tu subida; con la herramienta
de Vercel, `list_deployments` con el `sha` del commit. Detalle en la regla 19 de `docs/COLA.md`.
