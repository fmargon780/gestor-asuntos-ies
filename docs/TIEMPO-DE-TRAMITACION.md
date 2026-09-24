# Fila 140 — Tiempo de tramitación por tipo

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «lo que falta», punto 6). Diseño cerrado con Francisco el 24-sep-2026.

«Cuentas» ya calcula la media y el máximo de días de tramitación, pero solo del total. Falta por
tipo, y falta ver lo que lleva abierto demasiado.

## Reglas de esta fila

- **No leas el repositorio entero.** Lee `docs/CONTEXTO.md`, el hijo de `docs/contexto/` que se
  cita y los ficheros de la lista. Si con `grep` aparece otro fichero que haga falta tocar, tócalo y
  apúntalo en la documentación.
- **Cambios quirúrgicos.** No reescribas ficheros enteros. Lo nuevo va en ficheros nuevos y
  pequeños (menos de 400 líneas), enganchados por un punto previsto, no envolviendo.
- Sube directamente a `main`, sin pull request (o según la nota de la cola si la sesión no puede).
  Dos subidas como mucho (regla 13 de la cola).
- **Una sola tanda de pruebas al final**, con la batería completa en verde.
- Todo guardado de `_GESTOR` por `ColaGuardado`. Todo fallo accesorio, en ámbar, sin parar lo
  principal.
- Al terminar: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y `docs/HISTORIA.md`, sustituyendo lo viejo.

Contexto: `docs/contexto/HITOS-Y-GUIAS.md` (sección de «Cuentas»).

## Ficheros que se tocan

- `js/cuentas.js` (y, si pasa de 400 líneas al tocarlo, un `js/cuentas-tiempos.js` aparte)
- Prueba: ampliar la de Cuentas que ya exista, o `pruebas/tiempo-de-tramitacion.mjs`

## 1. Qué se añade

- En la tabla por tipo, dos columnas: **«Media (días)»** y **«Máximo (días)»**, con
  `tiempoDeTramite` aplicado a los archivados de ese tipo. Sin datos, «—».
- Una tabla nueva, **«Los que más tiempo llevan abiertos»**: los diez asuntos abiertos más
  antiguos, con tipo, días abiertos y hito actual. Pulsar uno abre su ficha.
- Un número arriba: **«Abiertos hace más de 30 días: N»**.
- Todo respeta el filtro de curso que ya tiene la pantalla, y los reservados (fila 135) salen
  tapados si ya existe esa fila.
- El botón de copiar para hoja de cálculo incluye las columnas nuevas.

## 2. La prueba

Dos archivados de un tipo con 10 y 20 días → media 15, máximo 20; un abierto de hace 40 días sale
en la tabla nueva y en el número de arriba.
