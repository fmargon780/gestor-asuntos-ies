# Filtrar con varios criterios en «Añadir varios relacionados» y exportar la lista filtrada

Fila 345 de `docs/COLA.md`. Aviso del botón de soporte de Francisco (15-oct-2026, perfil
Administración, copia sin internet, pantalla «Nuevo asunto», versión 14-oct-2026 · 17:30),
diseñado con él ese mismo día.
Aviso completo: https://drive.google.com/file/d/1c6QkImmO801YjeoUwcuPrqqWltSPOAIr/view?usp=drivesdk

## De dónde sale esto

Francisco quiere crear un asunto de grupo con «todo el alumnado de 1º de ESO que no sea
repetidor». En el cuadro «Añadir varios relacionados» no puede: los atajos de unidad, nivel y
enseñanza **señalan al elegir** (fila 338), y «Por datos del alumnado» señala por su lado. Cada
criterio **suma** gente; ninguno **quita**. Él creía que ya estaba arreglado porque la fila 342
(`docs/REPARTIR-CON-FILTRO.md`) puso un filtro con varios criterios a la vez, pero solo en los
cuadros de reparto (y después en Etiquetas, fila 344).

También pide poder sacar a Excel o PDF la lista que sale de un filtro.

## Lo que se pide

### 1. El filtro en «Añadir varios relacionados»

- En la pestaña Alumnado del cuadro «Añadir varios relacionados» (`js/relacionados.js`, el que se
  abre desde Nuevo asunto y desde la ficha de un asunto), el bloque «Señalar alumnado por…» (los
  tres atajos que señalan al elegir) y la fila «Por datos del alumnado» se sustituyen por **la
  misma zona «Filtrar el alumnado» de los cuadros de reparto** (`js/repartir-filtro.js`,
  `RepartirFiltro`). Reutilízala; no la copies. Si hace falta, adapta `RepartirFiltro` para que
  sirva también aquí sin cambiar cómo se ve ni cómo funciona en reparto y etiquetas.
- Se pueden poner varios criterios (unidad, nivel, enseñanza y cualquier dato del alumnado), cada
  uno como pastilla con su ✕. Un alumno entra solo si cumple **todos**.
- Junto al filtro, «N alumnos en el filtro» y el botón **«Señalar los N»** (con N = 1, «Señalar 1»).
  **Nadie se señala hasta pulsarlo.** Lo señalado va al pie fijo de siempre (fila 338) y se añade
  al asunto con «Añadir al asunto los N», como hoy.
- Lo ya señalado no se quita al cambiar el filtro: el filtro solo decide quién se señala al pulsar.
- El resto del cuadro no cambia: pestañas, buscador, «Meter un grupo entero», «Pegar una lista»,
  la pregunta de descartar y el pie.
- La palabra del botón y los textos, con `docs/VOCABULARIO.md`.

### 2. «Exportar la lista ▾» dentro del filtro

- Dentro de la zona «Filtrar el alumnado», debajo de «N alumnos en el filtro» (o «Salen N»), un
  botón **«Exportar la lista ▾»** con dos opciones: **Excel** y **PDF**.
- Como la zona es la misma, el botón sale solo en todos los sitios donde está el filtro: «Añadir
  varios relacionados», los dos cuadros de reparto y Etiquetas. Apagado si no hay ningún criterio
  puesto o no sale nadie.
- Exporta **los que cumplen el filtro** (no los señalados ni los asignados).
- **Columnas fijas**, sin elegir nada:
  - Alumnado: Apellidos y nombre · Nº escolar · Unidad · una columna por cada criterio de «datos
    del alumnado» usado en el filtro (por ejemplo, «Repetidor»), con su valor para ese alumno.
  - Personal (el filtro de personal de Etiquetas): Apellidos y nombre · Puesto · una columna por
    cada criterio usado.
- Orden: por unidad y, dentro, por apellidos (personal: por apellidos).
- **Excel**: un `.xlsx` con una hoja, la fila de títulos en negrita y fija. Reutiliza lo que ya
  hace `js/exportar-hoja.js` (o `js/actividades-exportar.js`) para escribir la hoja.
- **PDF**: con el membrete del centro, la fecha de hoy, un título «Lista filtrada» y los criterios
  del filtro escritos en una línea («Nivel: 1º ESO · Repetidor: No»), la tabla y al final «N
  alumnos». Sale en el visor de siempre, con «Guardar PDF» e «Imprimir». Reutiliza el camino del
  informe en PDF que ya existe (`js/actividades-informe.js` o `js/exportar-informe.js`).
- Nombre del fichero: `AAMMDD Lista filtrada.xlsx` / `.pdf`. No se guarda en ningún asunto: se
  descarga.
- En un ordenador con «solo consultar» o perfil directivo, exportar funciona (no escribe nada en
  las carpetas).

## Qué ficheros tocar

- `js/relacionados.js`: sustituir los atajos que señalan al elegir y la fila de «Por datos del
  alumnado» por la zona de `RepartirFiltro`, con su «Señalar los N».
- `js/repartir-filtro.js`: lo que haga falta para usarlo aquí, la lista de los que cumplen el filtro
  con sus valores y el botón «Exportar la lista ▾». Si pasa de 600 líneas, la exportación va a un
  fichero nuevo, por ejemplo `js/filtro-exportar.js`, añadido a `index.html`.
- `js/alumnado-bd-ver.js`: solo si hace falta exponer algo; `pintarGrupo` puede quedar sin uso (no
  lo borres si lo usa alguien más).
- `js/etiquetas-pantalla.js`: comprobar que el botón sale bien en su filtro (también el de personal).
- `js/novedades.js`: una línea (cambia lo que se ve).
- Al terminar: el hijo de `docs/contexto/` que hable de relacionados y del reparto, y media línea en
  `docs/CONTEXTO-CORTO.md` (la de «Terceros relacionados»).

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-345`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Cambios quirúrgicos: no reescribir ficheros enteros. Ningún fichero de `js/` pasa de 600 líneas.
- No leas el repositorio entero: `docs/CONTEXTO.md`, `docs/REPARTIR-CON-FILTRO.md`,
  `docs/ANADIR-VARIOS-MAS-CLARO.md`, `docs/ETIQUETAS.md` y los ficheros de esta lista.
- Pruebas: mientras trabajas, `npm test -- relacionados repartir etiquetas varios`; la pasada
  completa, una vez al final. Las pruebas viejas que miraban los atajos que señalan al elegir se
  ponen al día con el comportamiento nuevo.

## La prueba

`pruebas/filtro-anadir-varios-y-exportar.mjs`, con navegador y el disco de mentira:

- Alumnado de demostración con alumnos de 1º ESO repetidores y no repetidores, y de otro nivel (si
  la demo no tiene el dato «Repetidor», usa otro dato del alumnado de dos valores; dilo en la nota).
- Nuevo asunto → «Añadir varios relacionados» → Alumnado: elegir el nivel no señala a nadie; añadir
  el segundo criterio deja en «N alumnos en el filtro» solo a los que cumplen los dos; «Señalar los
  N» los pasa al pie; «Añadir al asunto los N» los relaciona.
- Quitar un criterio con su ✕ cambia la cuenta y no quita a los ya señalados.
- «Exportar la lista ▾» → Excel: el `.xlsx` descargado tiene una fila por alumno del filtro, en orden
  de unidad y apellidos, con las columnas fijas y la del criterio.
- «Exportar la lista ▾» → PDF: el visor sale con el membrete, la línea de criterios y «N alumnos».
- El botón sale también en el cuadro de reparto y en Etiquetas.
- `repartir-con-filtro.mjs`, `etiquetas*.mjs` y las de añadir varios siguen pasando.

## Para Francisco al terminar

Lo que va a ver: en «Añadir varios relacionados» hay el mismo filtro que en repartir, con varios
criterios a la vez; nadie se señala hasta pulsar «Señalar los N». Y en todos los filtros, un botón
«Exportar la lista ▾» que saca a Excel o a PDF a los que cumplen el filtro. No tiene que hacer nada.

## Cómo sabemos que está bien

1. En la demo, en Nuevo asunto → «Añadir varios relacionados» → Alumnado, hay una zona «Filtrar el
   alumnado» y ya no están los atajos que señalaban al elegir.
2. Elegir un nivel no señala a nadie; la cuenta dice cuántos alumnos hay en el filtro.
3. Al añadir un segundo criterio, la cuenta baja a los que cumplen los dos.
4. «Señalar los N» pasa a esos N al pie; «Añadir al asunto los N» los relaciona con el asunto.
5. Quitar un criterio con su ✕ cambia la cuenta y no quita a los ya señalados.
6. «Exportar la lista ▾» está apagado sin criterios y encendido con ellos.
7. «Exportar la lista ▾» → Excel descarga una hoja con una fila por alumno del filtro, ordenada por
   unidad y apellidos, con Apellidos y nombre, Nº escolar, Unidad y una columna por criterio usado.
8. «Exportar la lista ▾» → PDF abre el visor con el membrete, la fecha, la línea de criterios, la
   tabla y «N alumnos».
9. El mismo botón sale en el filtro del cuadro de reparto y en el de Etiquetas.
10. El cuadro de reparto y Etiquetas filtran igual que antes.
