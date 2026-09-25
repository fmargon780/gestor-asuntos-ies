# Tutores legales y Administraciones: dos tipos de tercero nuevos

Documento hijo de `docs/CONTEXTO.md` (filas 166 y 167, 25-sep-2026). Se separó de
`docs/contexto/PERSONAS.md` porque ese ya pasaba de 40 KB. Actualízalo al tocar estas dos
categorías o la lista de categorías.

---

### La lista única de categorías (fila 166)

`Nombres.CATEGORIAS` (`js/nombres.js`) es la única lista: `ALUMNADO`, `PERSONAL`, `EMPRESAS`,
`OTROS`, `TUTORES LEGALES`, `ADMINISTRACIONES`. Las nuevas van **al final** a propósito: las pruebas
y la costumbre reconocen los botones por su sitio. Al lado, `Nombres.TEXTOS_CATEGORIA` con cómo se
nombra cada una (`lista`, `descripcion`, `tercero`), `Nombres.textoCategoria(cat, que)` y
`Nombres.opcionesCategorias(select, que)`, que rellena los desplegables `#filtro-personas` y
`#nueva-categoria` (en `index.html` ya no hay ninguna `<option>` de categoría escrita a mano).
`App.DESCRIPCION_CATEGORIA` y la etiqueta del buscador de Nuevo asunto salen de ahí. La bandeja
(`js/bandeja-propuesta.js`) y el editor de campos calculados leen también `Nombres.CATEGORIAS`.
`pruebas/tutores-legales.mjs` falla si vuelve a aparecer una lista a mano.

**Puntos previstos nuevos** (para una categoría que monta otro módulo, sin envolver nada):

| Punto | Dónde | Para qué |
|---|---|---|
| `Datos.registrarFuente(cat, fn)` | `js/datos.js` | `Datos.cargar(dir, cat)` llama a `fn(dir)` |
| `App.FICHAS_DE_CATEGORIA[cat] = { html(p), enganchar(caja, p) }` | `js/archivo-personas.js` | La ficha en Personas y empresas |
| `App.trasPintarFicha` (lista de `fn(p, caja)`) | `js/archivo-personas.js` | Añadir algo a cualquier ficha |
| `App.LISTAS_DE_CATEGORIA[cat] = fn(caja, fuente, texto, tarjeta)` | `js/archivo-personas.js` | La lista pintada a su manera (también la usa el buscador de Nuevo asunto) |
| `App.ALTAS_DE_CATEGORIA[cat] = fn(sugerencia)` | `js/asuntos-nuevo-alta.js` | Alta con cuadro propio; `App.admiteAlta(cat)` dice si hay botón de alta |
| `App.alFijarTercero` (lista de `fn(p, caja)`) | `js/asuntos-nuevo-campos.js` | Algo debajo del tercero elegido en Nuevo asunto |
| `Gestor.alCrearAsunto` (lista de `fn(nombre, datos, tercero)`) | `js/puente.js` | Justo después de crear un asunto (accesorio: un fallo sale en ámbar) |

`Datos.LISTAS` admite `sinAlta: true` (sin botón «Dar de alta»). En «Por clasificar»
(`js/lector-documentos.js`), las categorías de después van en `contexto.otras` y solo se prueban
si ninguna de las tres de siempre cuadra (una solicitud trae el documento del alumno y el de su
madre, y el tercero es el alumno); un mismo tercero con varios nombres cuenta una sola vez.

### Tutores legales (fila 166, `docs/TUTORES-LEGALES-COMO-TERCERO.md`)

`js/tutores-legales.js` (`window.TutoresLegales`). Para los asuntos cuyo interesado es la familia
(Consejo Escolar, AMPA, una reclamación, varios hermanos). No sustituye nada: el tutor sigue en
«Lo pide» y como relacionado.

- **La lista sale sola del RegAlum**: `PersonasFamilias.indice(lista, true)` (con `true`, también
  los hijos que ya no están matriculados), unidos por DNI normalizado (sin DNI, por el nombre
  entero). No hay alta a mano (`sinAlta`).
- **Nombre del tercero**: `Nombres.terceroTutor` = el del personal, «Apellido1 Apellido2, Nombre» +
  4 últimos caracteres del DNI. `Datos.tutoresDe` monta ese orden en `nombreApellidos`, **no
  enumerable** (así quien compara o recorre el tutor sigue viendo los datos de siempre).
- **`_GESTOR/datos/tutores.csv`** (Nombre · Documento · Teléfono · Teléfono 2 · Correo · Correo 2 ·
  Domicilio · Hijos, estos como `Apellidos, Nombre (Nº escolar); …`): se escribe en cuanto un tutor
  es tercero de un asunto (`Gestor.alCrearAsunto`). La lista es la unión del RegAlum y de este
  fichero (`TutoresLegales.unir`, pura); si el RegAlum trae datos distintos de un guardado, mandan
  los suyos y el fichero se pone al día solo. Siempre por `ColaGuardado` (releyendo dentro), con
  una copia del día `_GESTOR/copias/tutores-AAMMDD.csv` antes de escribir. Las copias en conflicto
  de Dropbox se unen como los demás CSV de terceros (`js/conflictos.js`).
- **Pie en los buscadores**: «DNI … · Tutor/a de Ana (1º ESO A), Beto» y, si ya no tiene hijos en
  el RegAlum, «datos guardados».
- **Ficha del tutor** (Personas y empresas): DNI, teléfonos, correos, domicilio (si viene en una
  columna suya), y sus hijos, cada uno pulsable a su ficha. En la tarjeta «Datos y contacto» de su
  asunto, lo de siempre (los hijos van en «Ver todo»).
- **Ficha del alumno**: «Asuntos de sus tutores» (abiertos y del ARCHIVO), antes de «Ver sus
  asuntos»; sin ninguno, no sale. Los abiertos se pulsan para ir a su ficha.
- Plantillas: `{dni}` es el DNI entero y `{referencia}` sus 4 últimos, como el personal. Cuentas:
  sus asuntos cuentan como «Familia».

### Administraciones (fila 167, `docs/ADMINISTRACIONES-COMO-TERCERO.md`)

Tres módulos: `js/administraciones.js` (`window.Administraciones`: datos, árbol, nombres
anteriores, unión de conflictos), `js/administraciones-ficha.js` (alta, ficha, lista agrupada,
desplegable del departamento) y `js/administraciones-traer.js` («Pasar a Administraciones»).
Estilos en `css/administraciones.css`.

- **Dos clases**: `organismo` (agrupados por «Depende de»; sin él, «Otros organismos») y `centro`
  (institutos y colegios).
- **Nombre del tercero** (`Nombres.terceroAdministracion`): el organismo, su nombre corto y estable
  (ni el DIR3 ni la Consejería); el centro, nombre corto + código de centro de 8 cifras. No se
  permiten dos con el mismo nombre corto ni dos centros con el mismo código.
- **`_GESTOR/datos/administraciones.json`**: `{ superiores: [{id, nombre, antes}], organismos: [{id,
  clase, corto, oficial, dir3, codigoCentro, superior, correo, telefono, direccion, antes,
  departamentos: [{id, nombre, correo, telefono, contacto, dir3, hijos}]}] }`. «Depende de» vive en
  `superiores` y se enlaza por `id`: cambiarle el nombre cambia en todos sus organismos y guarda el
  de antes. Cambiar el nombre oficial (o a otro «Depende de») guarda el viejo en `antes`, con fecha.
  Siempre por `ColaGuardado` (`Administraciones.cambiar`), releyendo dentro, con copia del día
  `_GESTOR/copias/administraciones-AAMMDD.json`. La copia en conflicto de Dropbox se une por `id`
  (`Administraciones.unirDatos`, llamado desde `js/conflictos.js`), sin perder organismos,
  departamentos ni nombres anteriores.
- **El buscador** encuentra por nombre corto, oficial, nombres anteriores (suyos y de su «Depende
  de»), DIR3, código de centro, correo y nombres de sus departamentos.
- **Cambiar el nombre oficial, el DIR3 o «Depende de» nunca renombra carpetas.** El nombre corto sí:
  renombra los asuntos abiertos por `AsuntoRenombrar` (como «Cambiar los datos» de un tercero de
  alta a mano); los archivados no se tocan.
- **Un centro nuevo** trae Secretaría, Dirección y Jefatura de Estudios.
- **El departamento en el asunto**: desplegable opcional al crear (`App.alFijarTercero`) y al editar
  (`AdministracionesFicha.htmlEditar`/`leerEditar` en `js/asuntos-editar.js`). Se guarda
  `departamento: {id, nombre, correo}` en `asuntos.json` (copiado, para que se lea aunque se quite
  del árbol); no va en el nombre. Sale en «Datos del trámite» y en «Datos y contacto». En Correo, su
  correo se propone como destinatario (detrás del del hito y del de «Lo pide»; si no tiene, el del
  organismo). Huecos nuevos: `{departamento}`, `{departamentocorreo}`, `{organismooficial}`.
- **Alta a mano** desde Nuevo asunto y desde Personas y empresas (cuadro propio,
  `App.ALTAS_DE_CATEGORIA`).
- **Reconocer**: la bandeja de Gmail, por el correo de un departamento o por el dominio (solo si un
  único organismo lo tiene: el de la Junta no decide nada); «Por clasificar», por el nombre corto o
  el oficial (se propone con el corto).
- **«Pasar a Administraciones»** (Ajustes › Mantenimiento): los terceros de OTROS y EMPRESAS con
  asuntos o con alta; se marcan, se elige organismo o centro y se pone el nombre corto (propuesto sin
  el código del final; un número de 8 cifras al final propone centro). Por cada uno: alta, abiertos
  renombrados por `AsuntoRenombrar` (ficha, hitos, notas y presencia), archivados trasladados a
  `ARCHIVO/ADMINISTRACIONES/<nuevo>` con `Carpetas.trasladar` (y su `_ficha.json` al día), alta vieja
  fuera de su CSV; si ha movido archivados, rehace el índice del ARCHIVO. Uno que falle no para al
  resto (aviso ámbar con cuáles). Casillas para pasar también tipos de asunto de OTROS/EMPRESAS.

Se comprueba con `pruebas/tutores-legales.mjs` (sin navegador) y `pruebas/administraciones.mjs`
(navegador).
