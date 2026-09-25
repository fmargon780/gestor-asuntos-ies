# Fila 156 — Reparar los documentos que rompió el cierre de la fila 151

Encontrado el 25-sep-2026 a las 11:24, desde la conversación del proyecto.

## Qué pasó

El commit `d3e5cf6` («docs: fila 151 HECHA», 11:23) subió tres documentos con la palabra
`__READ__` como único contenido, en vez del documento entero (el mismo fallo de las reglas 11 y 14
de `docs/COLA.md`):

- `docs/COLA.md` — **ya reparado** en `df36241` y en el commit de esta fila (fila 151 marcada
  HECHA a mano).
- `docs/CONTEXTO-CORTO.md` — **roto**.
- `docs/contexto/CORREO-Y-SENECA.md` — **roto**.

## Lo que hay que hacer

1. Devolver los dos documentos rotos a su versión buena, la del commit `c214ee6` (el anterior):
   con `git`, `git checkout c214ee6 -- docs/CONTEXTO-CORTO.md docs/contexto/CORREO-Y-SENECA.md`;
   sin `git push`, bajarlos con `get_file_contents` (`ref` = `c214ee6`) y subirlos **enteros**,
   uno por llamada, comprobando el tamaño después (13.998 y 35.186 bytes).
2. Volver a poner en los dos lo que la fila 151 quería añadir (ver `docs/PLANTILLA-DESDE-EL-CUADRO.md`
   y el código de `c214ee6`): una línea en `CONTEXTO-CORTO.md`, sección 5 (las plantillas se crean
   o editan desde el propio cuadro de Correo y de Séneca), y lo que toque en `CORREO-Y-SENECA.md`.
   **Sustituyendo, no añadiendo**, y sin pasar de 14.000 caracteres en `CONTEXTO-CORTO.md`.
3. Una línea en `docs/HISTORIA.md` con la fecha.

## Cómo trabajar

- Solo estos ficheros. No leas el repositorio entero.
- Es solo documentación: no gasta publicación de Vercel.
- Subir directamente a `main`, sin pull request (o según la nota de `docs/COLA.md` si la sesión no
  puede).
- Comprobación final: bajar los dos ficheros de `main` y ver que empiezan por su título
  (`# Contexto corto — léelo siempre` y `# La bandeja de Gmail, sus adjuntos…`), no por `__READ__`.
