# Fila 159 — Responsable «Administración» y los pasos de firma y visto bueno

Cerrado con Francisco el 25-sep-2026 en la conversación del proyecto.

## Qué quiere Francisco

En una guía, un paso no es de una persona: es del puesto. Hoy el desplegable «Responsable por
defecto» del editor de la guía ofrece los nombres de las personas (Francisco Marmolejo González,
Diego Herrera Aragón), además de Dirección, Jefatura, Secretaría y los papeles fijos (el
tercero, el tutor, un relacionado). Quiere que ahí salga **Administración** en lugar de los
nombres.

Además, muchos certificados los firma Secretaría con el visto bueno de Dirección. Eso se
refleja con dos pasos seguidos en la guía, que tienen que venir ya hechos en la biblioteca de
hitos del centro.

## Lo que hay que hacer

1. **Nuevo responsable fijo «Administración»**, siempre presente (no se puede borrar en Ajustes
   › Hitos), con la marca `administracion: true`. Para `Hitos.esDeAdministracion` es de
   Administración.
2. **En el editor de la guía** (desplegable «Responsable por defecto» de cada paso, y cualquier
   otro sitio donde se elija el responsable por defecto de un paso de guía o de la biblioteca de
   hitos): salen «(sin responsable)», **Administración**, los cargos (Dirección, Jefatura,
   Secretaría) y los papeles fijos. **No salen los responsables que son personas** del
   personal de Administración (los que hoy son Francisco y Diego). Averigua en
   `hitos.json → ajustes.responsables` cómo se distingue una persona de un cargo; si no hay
   forma limpia, las personas son los responsables con `administracion: true` que no son
   cargos de `js/cargos.js`.
3. **Migración, una vez y sola**: los pasos de guía (y de la biblioteca de hitos) que tengan
   como responsable por defecto a una de esas personas pasan a Administración. Los hitos de
   asuntos ya creados **no se tocan**: si un hito concreto está a nombre de Francisco o de
   Diego, se queda así.
4. **En los hitos de un asunto concreto** (panel de hitos y la mesa del hito): el desplegable
   de responsable ofrece Administración **y también** las personas, para poder decir «este paso
   lo llevo yo».
5. **«Qué me toca»**: un hito con responsable Administración le aparece a las dos personas. Al
   filtrar por una persona, salen sus hitos y los de Administración. Al filtrar por
   Administración, solo los de Administración.
6. **Biblioteca de hitos del centro**: añade dos hitos ya hechos:
   - «Firma de Secretaría», responsable Secretaría.
   - «Visto bueno de Dirección», responsable Dirección.
   Que se puedan elegir al montar la guía de cualquier tipo de certificado. No los metas tú en
   ninguna guía: eso lo hace Francisco tipo por tipo. Si la carga de biblioteca de Mantenimiento
   («cargar tipos, guías y guiones del instituto») trae un catálogo del centro, añádelos también
   ahí sin duplicar si ya existen con ese título.

## Ficheros que tocar (comprueba antes con el índice de `docs/CONTEXTO.md`)

- `js/hitos.js` (responsables, `normalizarAjustes`, `PAPELES`, `resolverResponsable`) — si pasa
  de 400 líneas, parte primero.
- `js/hitos-a-quien.js` (solo si hace falta para `esDeAdministracion`).
- `js/hitos-ajustes.js` (Administración fija, sin botón de borrar).
- El editor de la guía donde vive «Responsable por defecto» (probablemente `js/guias-editor.js`
  o `js/guias-paso-bloques.js`).
- `js/hitos-panel.js` / `js/hitos-panel-lista.js` / `js/hito-mesa.js`: el desplegable del hito
  concreto.
- `js/que-me-toca.js`: el filtro.
- `js/hitos-biblioteca.js` y `js/cargar-biblioteca.js` (y el fichero de datos de la biblioteca
  del centro si lo hay en `plantillas/` o similar).
- Las pruebas de `pruebas/` que cubran responsables, «Qué me toca» y la biblioteca.
- Cierre: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` de hitos,
  `docs/HISTORIA.md`.

## Cómo trabajar

- Sube directamente a `main`, sin abrir ninguna pull request (salvo que la sesión lo tenga
  forzado: ver la nota de `docs/COLA.md`).
- Cambios quirúrgicos; no reescribas ficheros enteros.
- No leas el repositorio entero: solo los ficheros de arriba y lo que te pidan.
- Una sola prueba al final (`npm test`), no después de cada cambio.
- Reglas de la cola 10 a 19 en vigor (bajar `main` antes de subir, nada de `PLACEHOLDER`,
  como máximo dos o tres subidas).

## Qué verá Francisco

- En Ajustes, al escribir una guía: «Responsable por defecto» ofrece Administración en vez de
  los nombres; los pasos que tenían su nombre o el de Diego dicen Administración.
- En un asunto concreto puede seguir poniendo un hito a su nombre.
- En la biblioteca de hitos aparecen «Firma de Secretaría» y «Visto bueno de Dirección».
