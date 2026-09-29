# El visto bueno de Francisco antes de publicar

Fila 230 de la cola. Diseñada con Francisco el 29-sep-2026 (conversación de Cowork). Tercera fila
del método «purgar los fallos antes de producción», después de la 222 (`docs/COPIA-DE-PRUEBAS.md`)
y la 223 (`docs/REVISOR-ANTES-DE-PUBLICAR.md`). Esta fila **no toca la aplicación**: cambia cómo se
trabaja la cola. Vale para este proyecto; Francisco lo extenderá a los demás cuando funcione.

## Qué quiere Francisco

1. **Calidad antes que velocidad.** Nada pasa de la copia de pruebas a producción (`main`) sin su
   visto bueno. Esto **sustituye** al punto 4 de «Qué quiere Francisco» de
   `docs/REVISOR-ANTES-DE-PUBLICAR.md` («nadie espera a que él mire»): desde hoy, sí se espera.
2. **El revisor automático se queda** como primer filtro. A Francisco solo le llega lo que el
   revisor ya ha aprobado.
3. **Las tareas se acumulan en un paquete.** Mientras Francisco no revisa, la cola sigue: cada
   fila aprobada por el revisor se queda en `pruebas`, encima de las anteriores. Francisco revisa
   cuando puede y aprueba el paquete entero de una vez: una lista, un solo visto bueno.
4. **Una lista de pruebas siempre al día**, en palabras de usuario: lo que ha cambiado en cada
   tarea del paquete, más las funciones principales de la aplicación (sección 3).
5. **Aprueba con una línea fija** en Claude Code: «Publica el paquete de pruebas». Si algo falla,
   escribe qué falla en esa misma línea, y se arregla en `pruebas` antes de publicar.
6. Más adelante, el Centro de mando tendrá un apartado «Esperando tu revisión» con un botón
   «Aprobar». Eso lo hace una conversación de Cowork, no esta fila.
7. Como siempre: **nadie le pregunta nada** a mitad de trabajo. Las decisiones las toma la sesión
   y las deja escritas en la nota de la fila.

## 1. El estado nuevo: EN EL PAQUETE

- Con el revisor en APROBADA, la fila **ya no pasa a `main`**. Pasa a
  `EN EL PAQUETE (fecha hora) · conversación: <enlace>` con la nota de siempre («Revisor: APROBADA
  (N puntos, M solo Francisco)»). La conversación para ahí, con un mensaje final que dice en una
  línea cuántas tareas hay ya en el paquete.
- Añadir EN EL PAQUETE a la cabecera de estados de `docs/COLA.md`, entre DEVUELTA y HECHA.
- **HECHA** queda solo para lo que ya está en producción: una fila pasa de EN EL PAQUETE a HECHA
  cuando se publica el paquete (sección 4).
- Las filas DEVUELTA y BLOQUEADA siguen igual; no entran en el paquete hasta tener su APROBADA.

## 2. La rama `pruebas` ya no se nivela a ciegas

Hoy, al empezar cada fila, `pruebas` se nivela con `main` (`git push --force origin main:pruebas`).
**Eso borraría el paquete.** Cambia así:

- Si **no hay** filas EN EL PAQUETE ni DEVUELTA: nivelar con `main`, como hasta ahora.
- Si **hay** alguna: no se nivela. La fila nueva se trabaja encima de lo que ya tiene `pruebas`.
  Si `main` recibió algo que `pruebas` no tiene (solo debería ser `docs/`), se fusiona `main` en
  `pruebas`, nunca al revés ni con `--force`.
- El revisor pasa la lista de la fila nueva y las tres comprobaciones fijas de siempre, contra la
  copia de pruebas con todo el paquete dentro.
- Las subidas que solo tocan `docs/` (marcar EN CURSO, EN EL PAQUETE, estimaciones) siguen yendo
  a `main` directamente, como ahora.

## 3. La lista de pruebas: `docs/PAQUETE-DE-PRUEBAS.md`

Documento nuevo, creado en esta fila (vacío de tareas). Lo pone al día cada fila que entra en el
paquete, en la misma subida que la marca EN EL PAQUETE. Formato:

```
# Paquete de pruebas

Estado: ESPERANDO TU REVISIÓN (N tareas) — o — VACÍO
Dónde probar: https://pruebas.fmargon.com/?demo=1&auto=1
Versión que se prueba: <App.VERSION de pruebas>
Punto aprobado de `pruebas`: <commit> (el último que aprobó el revisor)

## Lo que ha cambiado
### Fila N — <título en palabras de usuario>
- [ ] <cada punto de su «Cómo sabemos que está bien», copiado tal cual>
(una sección por fila del paquete, en orden)

## Funciones principales (siempre las mismas)
- [ ] Entrar y ver la pantalla de Inicio sin avisos de error.
- [ ] Crear un asunto nuevo y comprobar que el nombre de la carpeta sale bien.
- [ ] Abrir su ficha y añadir un hito.
- [ ] Generar un documento desde una plantilla.
- [ ] Preparar un correo desde el asunto.
- [ ] Archivar el asunto.
- [ ] Buscarlo en el Archivo.
- [ ] Abrir Personas y empresas, y Ajustes.

## Solo con datos reales
Los puntos [SOLO FRANCISCO] de las filas del paquete: se copian aquí y, como hasta ahora, también
a `docs/COMPROBAR-A-MANO.md`.
```

- La lista de funciones principales la aprobó Francisco el 29-sep-2026. No se cambia sin él.
- El **punto aprobado** es importante: si después de la última APROBADA hay en `pruebas` trabajo de
  una fila DEVUELTA o a medias, ese trabajo no se publica (sección 4).
- Palabras de pantalla: siempre las de `docs/VOCABULARIO.md`.

## 4. «Publica el paquete de pruebas»

Cuando Francisco pega esa línea en una conversación de Claude Code nueva:

- **Sin nada más en la línea**: pasar a `main` exactamente el **punto aprobado** de `pruebas` (no
  lo que haya después). Comprobar producción por `curl` como siempre. Marcar HECHA todas las filas
  EN EL PAQUETE, con la hora y «Publicada con el visto bueno de Francisco». Vaciar
  `docs/PAQUETE-DE-PRUEBAS.md` (Estado: VACÍO) y pasar la lista entera a `docs/HISTORIA.md`, con
  la fecha. Mensaje final de una línea: qué se ha publicado.
- **Con lo que falla** (por ejemplo «Publica el paquete de pruebas. Falla: al archivar no sale el
  aviso»): **no se publica nada**. La conversación apunta una fila nueva en la cola con lo que
  falla, la trabaja en `pruebas` encima del paquete, la pasa por el revisor con lo que dijo
  Francisco como lista, y la deja EN EL PAQUETE. El documento del paquete lo marca arriba:
  «Arreglado lo que dijiste el <fecha>: …». Francisco vuelve a revisar y vuelve a pegar la línea.
- Si al pegar la línea el paquete está vacío, se dice en una línea y no se hace nada más.
- Esta conversación también es «una fila, una conversación»: no coge filas PENDIENTE.

## 5. Lo que cambia en los documentos de reglas

Cambios quirúrgicos (sustituir la línea vieja, no añadir debajo), leyendo solo lo que se toca:

- `docs/REVISOR-ANTES-DE-PUBLICAR.md`: punto 4 de «Qué quiere Francisco» (sustituido, con enlace
  aquí); sección 2 (nivelar solo sin paquete; a `main` solo con el visto bueno); sección 4
  (APROBADA → EN EL PAQUETE, no HECHA).
- `CLAUDE.md`: el bloque del revisor y el de publicar: `main` solo recibe código con el visto bueno
  de Francisco; enlace a este documento.
- `docs/COLA.md`: cabecera de estados (EN EL PAQUETE); regla 0 (tras la APROBADA, la fila queda
  EN EL PAQUETE y la conversación para; la línea «Publica el paquete de pruebas»); reglas 13 y 19
  (reparto de subidas y `curl`: la de producción la hace la conversación que publica el paquete).
  La línea para lanzar filas se queda igual.
- `docs/CONTEXTO-CORTO.md`: sección 6, una línea con el método nuevo.
- `docs/REPARTO-DE-LA-COLA-2026-09-27.md` y `docs/AHORRO-CUOTA.md`: donde digan «a `main` solo con
  el revisor», pasa a «a `main` solo con el visto bueno de Francisco».
- `docs/HISTORIA.md`: la entrada del día, con el porqué (Francisco prima la calidad sobre la
  velocidad).

## 6. Cómo sabemos que está bien

Esta fila no cambia la aplicación; su comprobación es el método mismo:

1. Al terminar, `main` tiene `docs/PAQUETE-DE-PRUEBAS.md` (VACÍO, con las ocho funciones
   principales) y las reglas con el texto nuevo; la cabecera de `docs/COLA.md` lista EN EL PAQUETE.
2. La primera fila de código que se trabaje después queda EN EL PAQUETE, no HECHA; `main` no
   recibe su código; `docs/PAQUETE-DE-PRUEBAS.md` la lista con sus puntos.
3. La segunda fila no nivela `pruebas`: la copia de pruebas tiene las dos.
4. Con «Publica el paquete de pruebas», las dos llegan a producción a la vez y pasan a HECHA.

## 7. Ficheros

Nuevo: `docs/PAQUETE-DE-PRUEBAS.md`. Modificados: `CLAUDE.md`, `docs/COLA.md`,
`docs/REVISOR-ANTES-DE-PUBLICAR.md`, `docs/REPARTO-DE-LA-COLA-2026-09-27.md`,
`docs/CONTEXTO-CORTO.md`, `docs/AHORRO-CUOTA.md`, `docs/HISTORIA.md`, `docs/ESTIMACIONES.md`.
Ningún fichero de `js/`, `css/` ni `pruebas/`: esta fila no publica nada en Vercel.
