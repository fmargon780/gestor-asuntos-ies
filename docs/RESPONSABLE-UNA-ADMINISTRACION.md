# Una Administración como responsable de un hito

Fila 205 de `docs/COLA.md`. Cerrado con Francisco el 27-sep-2026.

## Qué pide Francisco

A veces quien resuelve un procedimiento del IES no es el centro, sino otra Administración: por
ejemplo, la Delegación Territorial de Educación en Málaga. Hoy no se puede poner como responsable
de un hito. La lista solo trae Administración, las personas, los cargos del centro (Dirección,
Jefatura, Secretaría) y los tres papeles (el tercero, el tutor, un relacionado).

## Qué se hace

1. **Opción nueva al final de la lista de responsables: «Una Administración…».** Sale en todos los
   sitios donde hoy sale la lista: el desplegable del hito en la mesa (`js/hito-mesa.js`, línea
   ~339), el de la lista de hitos de la ficha, el «Responsable por defecto» del editor de la guía
   (`js/guias-editor.js`, `js/guias-enganche.js`) y el de los modelos de la biblioteca
   (`js/guias-biblioteca.js`).
2. **Al pulsarla**, se abre un buscador con los organismos y centros ya dados de alta en la
   categoría `ADMINISTRACIONES` (`_GESTOR/datos/administraciones.json`, módulo `Administraciones`).
   Se reutiliza el buscador y la lista agrupada que ya existen (`js/administraciones-ficha.js`);
   no se escribe uno nuevo. Si el organismo tiene departamentos, se puede elegir también uno
   (opcional). Si no hay ninguna Administración dada de alta, el cuadro lo dice y ofrece «Dar de
   alta una Administración» (el alta que ya existe, `App.ALTAS_DE_CATEGORIA`).
3. **Cómo se guarda.** El id del responsable es `adm:<id del organismo>` o
   `adm:<id del organismo>:<id del departamento>`. Junto al id, el hito guarda una copia del
   nombre (`responsableNombre`), para que se siga leyendo aunque el organismo se borre o cambie de
   nombre. El nombre que se enseña es el nombre corto del organismo; con departamento,
   «Nombre corto · Departamento». Si el organismo sigue existiendo, manda su nombre actual.
4. **Nunca es de Administración.** `Hitos.esDeAdministracion` devuelve no para cualquier `adm:…`.
   Así el asunto pasa solo a «Pendiente de terceros» y la cabecera dice
   «Esperando a Delegación Territorial» (la espera automática de la fila 162, sin guardar nada
   más). En la tarjeta, el papel corto es el nombre corto del organismo.
5. **En la guía.** Una guía puede llevar un organismo como responsable por defecto de un paso.
   Los hitos que nacen de ese paso lo heredan como cualquier otro responsable.
6. **«Qué me toca»** (`js/que-me-toca.js`): el filtro por responsable ofrece también los organismos
   que sean responsables de algún hito abierto, uno por uno.
7. **Las listas fijas no cambian**: `Hitos.RESPONSABLES_DEFECTO` y `Hitos.PAPELES` se quedan como
   están. En Ajustes › Hitos no aparece nada nuevo.

## Ficheros que hay que tocar

- `js/responsable-organismo.js` (**nuevo**; mirar antes que el nombre esté libre): la opción
  «Una Administración…», el cuadro de elegir, cómo se forma y se lee el id `adm:…`, y el nombre
  visible. Se engancha por un punto previsto; no envuelve nada.
- `js/hitos-a-quien.js`: `esDeAdministracion` (no para `adm:…`) y `nombreVisible`.
- `js/hitos.js`: solo el punto de enganche mínimo en `resolverResponsable`, si hace falta.
  **Tiene 600 líneas: no puede crecer.** Si hay que añadir algo, va al fichero nuevo.
- `js/hito-mesa.js`, `js/guias-editor.js`, `js/guias-enganche.js`, `js/guias-biblioteca.js`, y el
  fichero que pinta el desplegable de responsable en la lista de hitos de la ficha: añadir la
  opción al final, llamando al fichero nuevo.
- `js/que-me-toca.js`: el filtro.
- `index.html`: cargar el fichero nuevo después de `js/administraciones.js` y de `js/hitos.js`.
- `pruebas/responsable-organismo.mjs` (**nueva**): elegir la Delegación en la mesa, ver
  «Esperando a Delegación Territorial» y el asunto en «Pendiente de terceros»; y que un organismo
  borrado siga enseñando su nombre guardado.
- Documentación: `docs/contexto/ESTADO-DEL-ASUNTO.md` (un apartado corto),
  `docs/CONTEXTO-CORTO.md` (sustituir la línea del estado, sin alargarla mucho), `docs/HISTORIA.md`.

## Cómo trabajar

- No leas el repositorio entero: solo los ficheros de arriba y `docs/CONTEXTO.md`.
- Cambios quirúrgicos. No reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Una sola prueba al final (`npm test` completo), no una después de cada cambio.
- Sube directamente a `main`, sin abrir ninguna pull request, siguiendo las reglas de
  `docs/COLA.md`. Comprueba lo publicado con `curl`.
