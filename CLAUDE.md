# Gestor de asuntos del IES

Antes de nada, lee `docs/CONTEXTO.md` y después `docs/COLA.md`, como dice la cola.

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
