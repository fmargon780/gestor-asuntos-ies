# Fila 136 — Cuánto tiempo se guarda cada asunto

Sale del análisis crítico del 24-sep-2026 (proyecto de Claude, `Analisis-critico-2026-09-24.md`,
Parte 2, «lo que falta», punto 2). Diseño cerrado con Francisco el 24-sep-2026.

Hoy un asunto archivado se guarda para siempre. La ley de protección de datos pide no guardar
datos personales más de lo necesario. La Junta publica tablas de valoración con los plazos de
conservación de cada serie de documentos. Cada tipo de asunto llevará su plazo, y la aplicación
avisará. **Nunca borra nada sola.**

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

Contexto: `docs/contexto/ASUNTOS-ARCHIVO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md`.

## Ficheros que se tocan

- `js/ajustes-tipo.js` (el campo del tipo)
- `js/archivo-indice.js` (la fecha de archivo en cada entrada)
- `js/ajustes-mantenimiento.js` (el aviso), `js/avisos.js` si los avisos viven ahí
- `js/papelera.js` (mandar un archivado a la papelera, reutilizando lo que ya hay)
- Nuevo `js/conservacion.js`, `index.html`
- Prueba nueva: `pruebas/plazo-de-conservacion.mjs`

## 1. El dato

- En `tipos.json`, cada tipo puede llevar `conservarAnios` (número entero). Vacío = sin plazo, y
  entonces nunca avisa.
- En Ajustes de un tipo: «Conservar ___ años después de archivar», con una línea debajo y el
  enlace: «Plazos de referencia: tablas de valoración de la Junta de Andalucía»
  (`https://www.juntadeandalucia.es/organismos/culturapatrimoniohistoricoydeporte/areas/cultura/archivos/cavad/tablas-valoracion.html`).
- Cada entrada del índice del ARCHIVO guarda `archivadoEl` (la fecha de cierre de la ficha,
  `cerradoEl`). Para los archivados de antes sin esa fecha, se usa la del nombre de la carpeta y
  se marca como aproximada.
- La ficha del asunto archivado puede llevar `conservarHasta` (AAAA-MM-DD), que manda sobre el
  cálculo.

## 2. El aviso

- Al entrar, una vez al día como mucho, `js/conservacion.js` recorre el índice del ARCHIVO.
- Un asunto ha cumplido su plazo si `archivadoEl + conservarAnios` (o `conservarHasta`) es
  anterior a hoy.
- Si hay alguno: aviso en Ajustes › Mantenimiento, con resumen en el título plegado: «N asuntos
  han cumplido su plazo de conservación».
- Dentro, la lista: nombre, tipo, archivado el, plazo, con casilla para elegir varios. Dos
  botones:
  - **«Mandar a la papelera»**: la carpeta y su ficha van a la papelera como cualquier borrado,
    con confirmación que dice cuántos.
  - **«Conservar más tiempo…»**: pide cuántos años y apunta `conservarHasta` en su ficha.
- Nunca se borra nada sin pulsar.

## 3. La prueba

Tipo con 4 años, asunto archivado hace 5 → sale en el aviso; con `conservarHasta` en el futuro →
no sale; tipo sin plazo → nunca sale; «Mandar a la papelera» lo deja en la papelera, no borrado.
