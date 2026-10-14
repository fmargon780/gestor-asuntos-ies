# Etiquetas (fila 344)

Herramientas → «Etiquetas» (`#etiquetas-vista`, a todo el ancho) y el botón «Imprimir etiquetas» de la tarjeta
«Personas del grupo» (`js/personas-del-grupo.js`, que abre la pantalla con las personas del grupo y «Volver» regresa a
la ficha). Diseño en `docs/ETIQUETAS.md`.

| Fichero | Qué hace |
|---|---|
| `js/etiquetas-modelos.js` | Las hojas A4: 14 códigos de Avery (L7156–L7166, L7173, J8654, L7651) más 1 × 1, con las medidas de la lista de plantillas de LibreOffice; del código de Apli solo el 02416 (= L7164) está contrastado. Un modelo es siempre filas, columnas, márgenes y separaciones (mm); `geometria` calcula el tamaño de cada etiqueta |
| `js/etiquetas-datos.js` | Los datos que puede llevar una etiqueta (`CAMPOS`), `valores(persona, clase)`, la dirección (busca las columnas `Domicilio`, `Código postal`, `Localidad`, `Provincia` por su título, primero las que no son de un tutor) y `familias` (misma persona tutora, `PersonasFamilias.hermanosDe`, y misma dirección) |
| `js/etiquetas-disenos.js` | Los tres diseños de la app (Sobre, Alumno, Profesor), los propios, `lineas` y `ajustar` (la letra baja hasta el 55 %; si no cabe, «…» y aviso) |
| `js/etiquetas-hoja.js` | `construir` (orden, familias, copias), `paginar` (casillas gastadas de la primera hoja), `preparar` y el dibujo de las hojas |
| `js/etiquetas-pdf.js` | El PDF con pdf-lib, a tamaño real; la misma Helvetica mide la vista previa |
| `js/etiquetas-guardado.js` | `_GESTOR/etiquetas.json` (`{ modelos, disenos }`) por la cola por fichero; un directivo escribe por `Perfil.escribir`; lo último usado, en `localStorage` (`gestor.etiquetas.ultimo`) |
| `js/etiquetas-editor.js` | Los formularios de un modelo (nombre, filas, columnas, «Ajustar márgenes») y de un diseño (renglones) |
| `js/etiquetas-pantalla.js` | La pantalla: a quién (`RepartirFiltro` para el alumnado; clase y departamento para el personal; «Pegar una lista»), hoja, diseño, copias, hoja empezada, vista previa y pie fijo |

El alumnado de la copia de pruebas lleva dirección de casa (columnas `Domicilio`, `Código postal`, `Localidad`,
`Provincia`), los hermanos Aguilar Ponce comparten tutora y dirección, y Gallardo Reyes, Vera, no tiene dirección.
Prueba: `pruebas/etiquetas.mjs`.
