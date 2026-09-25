# El estado sigue a los hitos (fila 162)

Cerrado con Francisco el 25-sep-2026. Va **después de la fila 154** (que ya pide que «Paso N de
M», «Hitos N/M» y la barra digan lo mismo): esta fila termina ese trabajo. Si al empezar la 154
ya lo ha resuelto en parte, se hace solo lo que falte (regla 3 de la cola).

## Lo que vio Francisco

Asunto «260924 DESEMPEÑO FUNCIÓN TUTORIAL …», cinco hitos:

1. Recibir la solicitud — hecho
2. Confección del Certificado — hecho
3. Puesta a la firma — sin marcar, responsable «Secretaría»
4. Registro de Salida — sin marcar, borde amarillo (en curso)
5. Envío del certificado — sin marcar

La cabecera decía **«Paso 4 de 5 · Registro de Salida»**. Tenía que decir «Paso 3 de 5 · Puesta
a la firma». Además, el botón «Estamos en este paso» salía en los hitos 4 y 5, y Francisco lo
leyó como una marca de estado («estamos en dos pasos a la vez»).

## Por qué pasa

En `js/hitos-a-quien.js`, `aQuienLeToca` toma como candidatos el primer hito abierto **y todos
los que estén «en curso»**, y si alguno es de Administración, gana ese. «Puesta a la firma» es de
Secretaría (no marcada como Administración) y «Registro de Salida» estaba en curso y es de
Administración: ganó el paso 4.

## Lo que hay que hacer

1. **El hito actual es siempre el primer hito sin terminar**, en el orden de la lista (mismas
   exclusiones de hoy: solo informativo, no aplica, preguntas ya respondidas). Se quita la regla
   de «si hay otros en curso y alguno es de Administración, gana Administración». El montón
   (Administración / terceros) sale de ese hito, con las reglas de `ladoDeHito` de hoy.
2. **Se recalcula con cualquier cambio en los hitos**: marcar, desmarcar, añadir, borrar,
   reordenar, cambiar el responsable o la marca «Nos toca / Esperamos a…». La cabecera de la
   ficha, la tarjeta de Asuntos abiertos, «Hitos N/M» y la barra se ponen al día sin recargar.
   Comprobar que `EstadoHito.refrescarFicha` se dispara también al cambiar el responsable (la
   firma de `firmaDe` no incluye el responsable: añadirlo).
3. **«Esperando a…» se rellena solo con el responsable del hito actual** cuando ese responsable
   no es de Administración (en el caso de arriba: «Esperando a Secretaría»). Se ve igual que la
   espera puesta a mano, sin botón «Ya ha llegado» (no hay nada que quitar: es el paso).
   - Si el responsable es de Administración o no hay responsable, no sale «Esperando a…» solo.
   - **Puesto a mano manda**, pero solo mientras el hito actual sea el mismo. Al cambiar el hito
     actual (se marca, se desmarca otro anterior, se borra…), la espera a mano se borra y vuelve a
     mandar el responsable del nuevo paso. Hoy ya se quita al marcar hecho ese hito
     (`Hitos.marcar`); falta quitarla en los demás casos en que cambia el hito actual.
4. **«Estamos en este paso» deja de parecer una marca.** El botón sigue haciendo lo mismo
   (`Hitos.situarEn`), pero se llama **«Saltar a este paso»**. El hito actual lleva, en su lugar,
   una etiqueta fija **«Paso actual»** (no pulsable, con el mismo color que la marca de la
   cabecera). Así se ve un solo «Paso actual» en la lista y en la mesa.

## Ficheros que hay que tocar

- `js/hitos-a-quien.js` — punto 1 y la espera automática (punto 3) dentro de `aQuienLeToca`
  (`esperando` con una marca `auto: true` cuando viene del responsable).
- `js/estado-hito.js` — punto 2 (`firmaDe`), punto 3 (pintar la espera automática sin «Ya ha
  llegado»; quitar la espera a mano cuando cambia el hito actual) y punto 4 (textos del botón y
  la etiqueta «Paso actual»).
- `js/hitos-panel-lista.js` y `js/hito-mesa.js` — solo donde se pinta el botón de situar, para
  poner la etiqueta «Paso actual» en el hito actual.
- `pruebas/` — una prueba nueva con el caso de arriba (Secretaría sin marca de Administración,
  paso 4 en curso de Administración): el estado es «Paso 3 de 5 · Puesta a la firma», espera
  automática «Secretaría», y al marcar el 3 pasa a «Paso 4 de 5 · Registro de Salida» sin espera.
- Documentación al cerrar: `docs/CONTEXTO-CORTO.md` (sustituir la línea «El estado del asunto es
  su hito actual…»), el hijo de `docs/contexto/` de hitos y `docs/HISTORIA.md`.

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (si la sesión la fuerza, fusiónala
  tú, como dice la nota de la cola).
- Cambios quirúrgicos: no reescribas ficheros enteros. No leas el repositorio entero.
- Ningún fichero de `js/` pasa de 600 líneas; si alguno de los tocados se pasa, pártelo.
- Una sola prueba al final (`npm test`), no una después de cada cambio.
- Comprueba lo publicado con `curl`.
