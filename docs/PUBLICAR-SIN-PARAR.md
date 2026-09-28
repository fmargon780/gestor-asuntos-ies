# Publicar sin parar la cola (fila 211)

Acordado con Francisco el 28-sep-2026. Norma para todos sus proyectos.

## Qué pasó

El 28-sep-2026 Vercel dejó de publicar: la API respondió 402 «Resource is limited»
(`api-deployments-free-per-day`, tope de 100 publicaciones al día del plan gratuito). La regla
general de publicación decía «si no se puede comprobar, no se empieza otra fila», así que la cola
se quedó parada por una causa que no tiene nada que ver con el código.

Francisco: **el tope de Vercel no puede impedir que Claude Code siga trabajando.**

## La norma nueva (ya está escrita en `CLAUDE.md`, subida desde Cowork el 28-sep-2026)

Se distinguen dos casos:

- **Publicación rota por nuestro código** (la construcción falla, la web da error, falta un
  fichero que debería estar): arreglarla sigue siendo lo único que se hace. Esto no cambia.
- **Vercel no publica por una causa ajena** (tope diario, publicación que no arranca, cola lenta
  de más de 20 minutos): no es una publicación rota. La fila queda **SIN PUBLICACIÓN
  COMPROBADA**, con el motivo en una línea, y **la cola sigue**. Cuando Vercel vuelva a publicar,
  la siguiente publicación lleva todo lo acumulado en `main`.

Y dos reglas que acompañan:

- **Al empezar cada sesión**, se miran las filas SIN PUBLICACIÓN COMPROBADA. Si la web ya sirve
  una `App.VERSION` igual o posterior a la de esa fila, pasan a HECHA en la misma subida que
  marca la nueva fila EN CURSO. No cuesta una subida más.
- **Como mucho un `create_deployment` a mano por sesión.** Si responde 402, no se reintenta:
  cada intento puede gastar cupo. Se apunta y se sigue.

## Qué tiene que hacer esta fila

1. **Aplicar la norma en `docs/COLA.md`**: en la regla 0 y en la regla 19, que digan lo mismo que
   `CLAUDE.md` (sustituir el texto viejo, no añadir debajo). En la tabla, la fila 200 ya aplica
   esta norma.
2. **Averiguar qué gastó las 100 publicaciones del 28-sep-2026.** Con la herramienta de Vercel,
   `list_deployments` del proyecto para ese día (hora de Madrid): cuántas fueron de `main`,
   cuántas de otras ramas, cuántas lanzadas a mano por la API, y cuántas salieron como saltadas
   por el `ignoreCommand`. Apuntar las cifras en `docs/HISTORIA.md` (esto resuelve la duda
   abierta de `docs/NO-GASTAR-PUBLICACIONES.md`: si las saltadas cuentan o no).
3. **Cortar lo que sobre, según lo que salga en el punto 2**:
   - Si lo que se come el cupo son reintentos a mano por la API: basta con la regla de «un
     `create_deployment` por sesión». Nada más.
   - Si las saltadas cuentan para el tope: aplicar la «salida siguiente» que ya describe
     `docs/NO-GASTAR-PUBLICACIONES.md` (apagar las publicaciones automáticas de Git y publicar
     con un *deploy hook* desde una acción de GitHub, solo cuando cambie algo fuera de `docs/`,
     `pruebas/`, `.github/` y ficheros `.md`). Solo si puedes dejarlo funcionando entero sin
     pedirle nada a Francisco. Si hace falta algo que solo él puede hacer, no lo hagas: apúntalo
     en una línea en «Lo que queda por hablar con Francisco» y cierra la fila con el resto.
   - Si es otra cosa: la solución más sencilla que no necesite a Francisco, y el porqué en
     `docs/HISTORIA.md`.
4. Si esta fila cambia algo de cómo se publica, su prueba en `pruebas/` (como la de
   `vercel.json` que ya existe).

Mensaje final a Francisco: dos frases. Qué gastaba las publicaciones y qué se ha hecho.
