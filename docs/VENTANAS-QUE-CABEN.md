# Ventanas emergentes que caben en la pantalla (fila 142)

Decidido con Francisco el 25-sep-2026.

## Problema real

En «Añadir varios relacionados» (ficha del asunto), al meter un grupo entero salen 283
señalados. La ventana crece más que la pantalla y el botón **Cancelar** queda por debajo, fuera
de la vista. No hay forma de llegar a él con el ratón. Escape sí cierra (`js/usabilidad.js`).

La causa es general: `.cuadro` (`css/estilos.css`, línea ~373) no tiene altura máxima, y `.capa`
centra sin desplazamiento. Cualquier ventana que use la capa común (`#capa`, `#cuadro-cuerpo`,
`.cuadro-botones`) puede dejar los botones fuera. Solo la del correo está arreglada, con
`.cuadro-correo` en `css/correo.css` (fila 58).

## Qué hacer

1. En `css/estilos.css`, lleva a `.cuadro` (para **todas** las ventanas) lo mismo que ya hace
   `.cuadro-correo`:
   - `max-height: calc(100vh - 40px)`, `display: flex`, `flex-direction: column`.
   - `#cuadro-titulo` y `.cuadro-botones` con `flex: 0 0 auto` (siempre visibles).
   - `#cuadro-cuerpo` con `flex: 1 1 auto; min-height: 0; overflow-y: auto`: lo que sobre se
     desplaza por dentro.
   - No cambies el `max-width` de 520px de `.cuadro`.
2. En `css/correo.css`, quita de `.cuadro-correo` lo que ya queda repetido en `.cuadro`. Deja
   solo lo suyo (el ancho grande y el `padding-right`). Mira también `.cuadro-seneca`
   (`css/seneca.css`) por si choca.
3. En «Añadir varios relacionados» (`js/relacionados.js`, `abrirAnadirRelacionados`): si la
   lista de señalados tiene su propio desplazamiento interno, comprueba que no quedan dos barras
   de desplazamiento anidadas. Si quedan, deja solo una.
4. Busca otras ventanas que **no** usen la capa común y puedan crecer más que la pantalla
   (búsqueda de `position: fixed` en `css/`, sin leer ficheros enteros; `css/ajustes.css` ~273
   es una). Si alguna puede dejar su botón de salida fuera de la vista, aplícale el mismo arreglo.
5. Apunta en `docs/HISTORIA.md` qué ventanas se han revisado y cuáles cambiaron.

## Ficheros que se tocan

- `css/estilos.css`
- `css/correo.css`
- Solo si hace falta: `css/seneca.css`, `js/relacionados.js`, `css/ajustes.css`
- `js/version.js` (versión nueva), `docs/COLA.md`, `docs/HISTORIA.md`

## Cómo trabajar

- Si `docs/COLA.md` todavía no tiene la fila 142, añádela debajo de la 141:
  `| 142 | \`docs/VENTANAS-QUE-CABEN.md\` (que Cancelar y Aceptar se vean siempre en las ventanas emergentes largas) | PENDIENTE |`
- Cambios quirúrgicos. No reescribas ficheros enteros.
- No leas el repositorio entero.
- Sube directamente a `main`. **No abras ninguna pull request.**
- Una sola prueba al final: con la ventana del navegador de unos 800 px de alto, abre «Añadir
  varios relacionados», mete un grupo entero y comprueba que Cancelar y el botón de añadir se
  ven sin desplazar la página. Comprueba lo mismo con la ventana del correo, que no debe haber
  cambiado de aspecto.
