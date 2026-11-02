# 499 — Centro de mando: tiempo de reflexión y diseño por app

## Lo que escribió Francisco (manda)
«Lo que quiero es evitar trabajar mucho en una app cuando he planificado darle más importancia a
otra.»

«Poder ver de manera clara que está pasando eso, que estoy dedicando más tiempo y esfuerzo a una
app que para ese periodo era menos importante para mí que la otra. Y ver también si se me está
olvidando desarrollar alguna. Creo que con una lista de las app y con algún tipo de métrica que me
indique el tiempo gastado en reflexión y diseño en cada una sería un buen punto de partida. Una vez
me acostumbre a eso, podremos complicarlo un poco más.»

«Has puesto un mes. ¿Podemos avanzar aquí un poco, que me deje ver los distintos meses y un
acumulado del año actual y un acumulada desde el mes x al mes y?»

## Lo que entendió Claude (aprobado por Francisco el 2-nov-2026)
- Una lista de sus apps con el tiempo de reflexión y diseño de cada una.
- En cada mes las ordena por importancia con flechas; cada mes guarda su propio orden.
- Aviso si una app menos importante lleva más tiempo que otra más importante.
- Aviso «sin tocar» si una app tiene cero horas en el periodo.
- Se puede ver cada mes, el año actual o un tramo de un mes a otro. En los acumulados van de más a
  menos tiempo, sin flechas ni avisos de importancia.

## Pantalla de prueba (aprobada el 2-nov-2026)
- `docs/pantallas/499.html` · https://claude.ai/artifact/2MtFbdnjg89euZ4G2Bw2WX

## Qué NO se hace en esta tarea
- La lista «Lo siguiente» con los temas y la vista «Semanas» de la primera simulación: él pidió
  empezar por lo simple y complicarlo cuando se acostumbre.
- Medir el tiempo de Claude Code.

## Notas técnicas de Claude
- Es una vista nueva del artefacto Centro de mando (https://claude.ai/artifact/7pDUJyXkUbPwuccZRx6J7E):
  no se programa en este repositorio, se publica el artefacto. La fila vive aquí como las demás del
  Centro de mando.
- Tiempo: horas entre las subidas de `docs/COLA.md` de cada app que marcan «en diseño» y las que lo
  cierran («diseñado», «a medias»). Comprobado en dieta-familiar y ausencias-guardias-ies desde el
  30-oct-2026: tema 94, 25 min; tema 65, 46 min. Las pausas cuentan como tiempo (tema 86, casi 3 h).
- Reflexión: hoy solo deja la subida del final. Añadir a la frase que pega «Reflexionar» una subida
  al empezar, con el mismo formato en todas las apps. Hasta entonces, sin dato de reflexión.
- Meses antiguos: mirar si tienen esas marcas; si no, decirlo en la pantalla, sin inventar horas.
- El orden por mes se guarda en este repositorio, en `docs/IMPORTANCIA-APPS.md`, para verlo igual
  desde cualquier dispositivo.

## Cómo lo comprueba el segundo revisor
- Hay un botón por mes, otro del año y un tramo con «desde» y «hasta».
- Las flechas cambian el orden solo de ese mes y se conserva al recargar.
- El aviso «Más tiempo que…» aparece y desaparece al cambiar el orden.
- Con cero horas sale «sin tocar».
- En los acumulados no hay flechas ni avisos de importancia.
- Las horas de una app coinciden con sus subidas de `docs/COLA.md`.

## Revisión y respuestas durante el trabajo
- Programada desde la conversación del método, confirmado por Francisco el 2-nov-2026 («Lo vas a
  programar aquí»). Publicada como versión 75 del Centro de mando.
- Cambio sobre las notas de arriba: las pausas se descuentan con la línea «Tiempo activo: N min» en
  la subida de cierre. Lo anterior cuenta como máximo 90 minutos por diseño; las reflexiones
  anteriores no cuentan.
- Coincide en pruebas con GitHub simulado: meses, año, tramo, flechas, avisos, fallos por app y 390 px.
- Cálculo probado con mensajes reales: tema 94, 25 min; tema 65, 46 min; tema 86, 90 min.
- No lo he podido ver: la página publicada con datos reales y la escritura real de
  `docs/IMPORTANCIA-APPS.md`.
