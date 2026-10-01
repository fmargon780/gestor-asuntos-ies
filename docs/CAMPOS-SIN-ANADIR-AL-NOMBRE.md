# Fila 251 — Los campos son etiquetas: fuera «Añadir al nombre»

Aviso de usuario (1-oct-2026, botón de soporte, pantalla «Ajustes de un tipo de asunto»), diseñado
con Francisco el mismo día.

## Qué pasa ahora

Desde la fila 239 (`docs/NOMBRES-FIJOS-CON-NUMERO.md`) el nombre de una carpeta de asunto nueva es
`AAMMDD A26-0137 TIPO Tercero` y el de un documento nuevo `AAMMDD TIPO D26-01234.ext`. Los campos
ya no entran en ningún nombre: viven en la ficha. Desde la fila 241 salen también al exportar.

Pero la interfaz sigue ofreciendo meterlos en el nombre, y eso confunde:

- `js/ajustes-tipo.js`: cada campo puesto lleva la casilla «Añadir al nombre», y el texto de la
  sección dice «…en el orden en que saldrán en el formulario y en el nombre de la carpeta.»
- `js/asuntos-nuevo-campos.js` (Nuevo asunto) y `js/asuntos-editar.js` (Cambiar el asunto): cada
  campo lleva también su «Añadir al nombre».
- `js/campos.js` habla de un interruptor «Añadir el grupo al nombre».
- `js/documentos-formulario.js`, línea ~202: nota «Lo que quieras añadir al nombre: el curso, una
  referencia…».

## Lo que quiere Francisco

Los campos son **etiquetas del asunto o del documento**, para clasificar y para usarlos después en
informes y herramientas. **No forman parte del nombre de nada**: ni de la carpeta, ni del asunto,
ni de los documentos.

## Qué hay que hacer

1. Quitar la casilla «Añadir al nombre» de todas partes donde salga para un campo: Ajustes de un
   tipo de asunto, Ajustes de un tipo de documento (si la lleva), Nuevo asunto, Cambiar el asunto y
   «+ Añadir campo» desde la ficha. Quitar también el interruptor «Añadir el grupo al nombre», esté
   donde esté.
2. Cambiar el texto de la sección «Campos» de Ajustes de un tipo por: «Los campos de este tipo, en
   el orden en que saldrán en el formulario. Sirven para clasificar el asunto: salen en la ficha y
   al exportar; no entran en ningún nombre.» Si los filtros de Inicio ya permiten filtrar por un
   campo, añadir «en los filtros»; si no, no mencionarlos.
3. Revisar la nota de `js/documentos-formulario.js` (y cualquier otro texto de pantalla que hable
   de «añadir al nombre» un campo o un texto): que diga que va a la ficha del documento, con las
   palabras de `docs/VOCABULARIO.md`.
4. Comprobar que ningún camino que quede (crear, cambiar, reabrir, archivar, cambiar el tipo, unir
   tipos) sigue metiendo un campo en un nombre nuevo por el valor `enNombre` guardado.
   `enNombre` puede seguir en los datos guardados (`campos.json`, fichas) por compatibilidad, pero
   ya no decide nada.
5. **Lo existente no se toca**: un asunto o documento de antes de la fila 239 que ya lleve campos
   en el nombre conserva su nombre tal cual, también al cambiarlo con «Cambiar el asunto» si no se
   toca nada que cambie el nombre. No se renombra nada en bloque.
6. Si alguna prueba de `pruebas/` marca o comprueba «Añadir al nombre», ajustarla.
7. Línea en `js/novedades.js` (regla 21): «Los campos ya no ofrecen “Añadir al nombre”: son
   etiquetas del asunto, salen en la ficha y al exportar.»

## Cómo sabemos que está bien

1. Ajustes → un tipo de asunto con campos: ningún campo lleva «Añadir al nombre»; el texto de la
   sección es el nuevo.
2. Ajustes → un tipo de documento con campos: tampoco hay «Añadir al nombre».
3. Nuevo asunto de un tipo con campos: se rellenan, sin casilla «Añadir al nombre»; la carpeta
   creada es `AAMMDD A26-NNNN TIPO Tercero`, sin los campos; los valores están en la ficha.
4. Cambiar el asunto (uno nuevo): sin casilla; cambiar un campo no cambia el nombre de la carpeta.
5. Un asunto antiguo con campos en el nombre: al abrirlo y cambiarle solo un campo, el nombre de
   su carpeta no cambia.
6. «+ Añadir campo» desde la ficha: sin casilla; el campo se guarda como hasta ahora.
7. Exportar a hoja de cálculo: los campos salen como columnas, igual que antes.
8. En ninguna pantalla queda el texto «Añadir al nombre» referido a un campo.

Nada de esto es solo para Francisco: todo se comprueba con los datos de demostración.
