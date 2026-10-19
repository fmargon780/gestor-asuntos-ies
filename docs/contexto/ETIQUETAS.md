# Etiquetas (fila 344)

Herramientas → «Etiquetas» (`#etiquetas-vista`, a todo el ancho) y el botón «Imprimir etiquetas» de la tarjeta
«Personas del grupo» (`js/personas-del-grupo.js`, que abre la pantalla con las personas del grupo y «Volver» regresa a
la ficha). Diseño en `docs/ETIQUETAS.md`.

| Fichero | Qué hace |
|---|---|
| `js/etiquetas-modelos.js` | Las hojas A4: 14 códigos de Avery (L7156–L7166, L7173, J8654, L7651) más 1 × 1, con las medidas de la lista de plantillas de LibreOffice; del código de Apli solo el 02416 (= L7164) está contrastado. Un modelo es siempre filas, columnas, márgenes y separaciones (mm) y, el propio, su tamaño de hoja `hoja: { nombre, ancho, alto }` (A3, A4, A5, Carta, Oficio u «Otro»; sin `hoja`, A4; fila 346); `geometria` calcula el tamaño de cada etiqueta y de la hoja |
| `js/etiquetas-datos.js` | Los datos que puede llevar una etiqueta (`CAMPOS`), `valores(persona, clase)`, la dirección (busca las columnas `Domicilio`, `Código postal`, `Localidad`, `Provincia` por su título, primero las que no son de un tutor) y `familias` (misma persona tutora, `PersonasFamilias.hermanosDe`, y misma dirección) |
| `js/etiquetas-disenos.js` | Los tres diseños de la app (Sobre, Alumno, Profesor), los propios (cada renglón alinea `izq`, `centro` o `der`), `lineas` y `ajustar` (la letra baja hasta el 55 %; si no cabe, «…» y aviso) |
| `js/etiquetas-hoja.js` | `construir` (orden, familias, copias), `paginar` (casillas gastadas de la primera hoja), `preparar` y el dibujo de las hojas |
| `js/etiquetas-pdf.js` | El PDF con pdf-lib, a tamaño real; la misma Helvetica mide la vista previa |
| `js/etiquetas-guardado.js` | `_GESTOR/etiquetas.json` (`{ modelos, disenos }`) por la cola por fichero; un directivo escribe por `Perfil.escribir`; lo último usado, en `localStorage` (`gestor.etiquetas.ultimo`) |
| `js/etiquetas-editor.js` | Los formularios de un modelo (nombre, tamaño de hoja, filas, columnas, márgenes) y de un diseño (renglones, «Alinear todo», «Colocar el texto»: Arriba, Centro, Abajo) |
| `js/etiquetas-pantalla.js` | La pantalla: a quién (buscador de personas, 3 letras; `RepartirFiltro` para el alumnado; clase y departamento, escribiendo, para el personal; «Pegar una lista»; lista con casillas), hoja, diseño, copias, hoja empezada, vista previa y pie fijo |

El alumnado de la copia de pruebas lleva dirección de casa (columnas `Domicilio`, `Código postal`, `Localidad`,
`Provincia`), los hermanos Aguilar Ponce comparten tutora y dirección, y Gallardo Reyes, Vera, no tiene dirección.
«Cambiar» está siempre a la vista en la hoja y en el diseño (fila 346): en uno propio lo sustituye con el mismo `id`; en uno de la app abre el formulario con un aviso y lo guarda como «Copia de …», sin tocar el original.
Pruebas: `pruebas/etiquetas.mjs` y `pruebas/etiquetas-346.mjs`.

**Fila 350 (15-oct-2026, `docs/ETIQUETAS-BUSCADOR-VERTICAL-FILTRO.md`).** Buscador (`#et-buscar-persona`, `CajaConSugerencias` con `minimo: 3`, hasta 10): suma personas a `E.anadidas`; sin filtro, lista pegada ni grupo de partida y con alguien elegido, solo salen las elegidas (`candidatas()`); con filtro, las del filtro más las elegidas. La lista con casillas (`ListaConCasillas`, `#et-lista`) enseña las `candidatas()`; lo desmarcado va a `E.quitadas` (que comparte `E.filtro.desmarcadas`, así «Exportar la lista» solo trae las marcadas). Diseño: `vertical` ('arriba' | 'centro' | 'abajo'; sin él, 'centro' como siempre) y `EtiquetasDisenos.inicioY`, que usan la vista previa y el PDF. Prueba: `pruebas/etiquetas-350.mjs`.

**Fila 373 (19-oct-2026, `docs/LISTA-CON-CASILLAS-SIN-TOPE.md`).** `ListaConCasillas` pinta todos los items, sin tope ni «…y N más» (se quitó `TOPE`, `op.tope` y `op.abierta`). El recuadro `.cc-lista` mide `max(220px, 100vh - 360px)` (unos 30 nombres a 1080 px) con scroll propio; en Etiquetas (`.et-panel .cc-lista`) `max(220px, 100vh - 500px)` para que quepa en el panel de la izquierda sin barra dentro de otra. Pintar 1.000 personas tarda unos 6 ms. Pruebas: sección 7 de `pruebas/etiquetas-350.mjs` y la 8 de `pruebas/repartir-con-filtro.mjs`.
