# Nombres fijos con número de asunto y de documento (fila 239)

Diseño: `docs/NOMBRES-FIJOS-CON-NUMERO.md`. Sustituye a los nombres de largo libre y al recorte
silencioso de la fila 130/177. Solo lo creado desde esta versión lleva número y estructura fija;
**lo que ya existe no se renombra** y se sigue leyendo igual.

## Los números (`js/numeros.js`, `Numeros`)

- Asunto `A26-0137` (A, año natural de dos cifras, cuatro cifras); documento `D26-01234` (cinco
  cifras). El año es el de la creación real (hoy), no el de la fecha del asunto. Vuelven a 1 cada año.
- Contador en `_GESTOR/numeros.json` (`{ asuntos: { "26": 137 }, documentos: { "26": 1234 } }`, por
  `Copias.guardar`, dentro de `App.enFila`). Antes de dar uno se relee el disco y se mira lo ocupado: la
  ficha (`numero`, o las claves de `documentos`) de todos los asuntos (abiertos y archivados) y el
  índice del ARCHIVO. Si está ocupado se salta al siguiente libre; un número dado no se reutiliza nunca.
- `Numeros.proximo(clase, fecha)` lo calcula SIN gastarlo (la vista previa); `Numeros.reservar(clase,
  esperado)` lo gasta y dice `{ numero, cambio }` (`cambio` si otro ordenador se quedó el esperado: se
  enseña el nombre nuevo y hay que volver a pulsar «Crear»/«Guardar»).
- Mismo fichero, mismo número: `Numeros.deOrigen`/`recordarOrigen` (en este ordenador, por nombre +
  tamaño + fecha del fichero de origen) para guardar el mismo documento en dos asuntos. Repartir entre
  terceros da UN número de documento a todas sus copias.

## Los nombres (`js/nombres.js`)

- Carpeta con `datos.numero`: `AAMMDD A26-0137 TIPO Tercero`, sin recorte; año académico, grupo,
  campos y texto libre siguen en la ficha. Sin `numero` (asuntos de antes), la estructura de siempre.
  `Nombres.leer` saca `numero` si viene justo detrás de la fecha.
- Documento con `datos.numeroDoc`: `AAMMDD TIPO D26-01234.ext` (tipo por su nombre corto,
  `Nombres.cortoDeTipoDocumento`). Sin él, la de siempre (`AAMMDD [REGISTRO] TIPO [CAMPOS] [TEXTO]`).
  `Documentos.leerNombre` reconoce las dos y saca `numero`; con número, el registro, los campos y el
  texto salen de la ficha (`DocumentosDatos.enriquecer`).
- Quién da número: Nuevo asunto, recurrentes, repartir (asuntos nuevos); añadir un documento desde el
  ordenador, traerlo de «Por clasificar» (si su nombre no sigue la norma), generar un Word/impreso,
  separar/unir/sacar páginas, repartir (documentos). «Cambiar el nombre» a un documento que ya sigue la
  norma de antes, «Cambiar el asunto» de uno antiguo y unir/cambiar tipos: conservan su estructura.
- Un asunto con número lo conserva siempre (cambiar tipo, tercero o fecha, archivar, reabrir, unir).

## Datos del documento (`js/documentos-datos.js`, `DocumentosDatos`)

`ficha.documentos[<número>] = { tipo, fecha, registros: [{ ano, sentido, modo, numero, codigo }], campos:
[valores], valores: {mapa}, texto, hito, generadoDe }`. Se escribe con `DocumentosDatos.anotar` (dentro de
`App.guardarRegistroFresco`; `anadirRegistro` suma un registro sin repetir). El registro de Séneca de un
documento con número se apunta en la ficha (puede haber varios); el índice del ARCHIVO lo suma a los que
salen de los nombres. La fila del documento en la ficha enseña «Registro 26EM0123 · campos · texto».

## «_Previas» (`js/versiones-previas.js`)

Lo nuevo va a `_Previas`; una «Versiones previas» que ya exista se sigue leyendo, y si el asunto ya la
tiene, lo nuevo va a esa misma. Registrar un documento con número: el original pasa a `… SIN SELLAR` en
previas y el sellado se queda con el mismo nombre y número (`Registro.guardar`, `RegistroSellado.asociar`).

## Nombres cortos (`js/tipos-cortos.js`)

Tope 25 caracteres (casilla con contador en Ajustes y en «+ Crear tipo nuevo»). Los tipos de documento
no tenían dónde apuntarlo: `TiposDocumentoCortos` (`_GESTOR/tipos-documento-cortos.json`, menú ⋮
«Nombre corto»). Los que ya pasan de 25 no se bloquean: `TiposLargos.lista()` los cuenta en la
comprobación al entrar («Nombres cortos de los tipos») y «Arreglarlo» abre UNA lista con casilla y
contador por tipo, que guarda al salir de cada casilla. Acortar no renombra nada.

## Largo de las rutas (`js/nombres-topes.js`, `js/largo-de-rutas.js`)

`Nombres.topes()` queda solo para nombres de antes. `Nombres.cabeEnRuta(nombre, tercero, categoria)`
cuenta `<Dropbox>/<ARCHIVO>/<CATEGORÍA>/<tercero>/<asunto>/_Previas/<peor documento>` contra 240; si no
cabe, `montarAsunto` devuelve `noCabe` (aviso rojo al elegir tercero o tipo, y no deja crear). Sin
`rutas.json` señalado no hay con qué calcular y se da por bueno. `Nombres.medidor()` calcula el peor caso
de todo el centro (categoría, tercero y tipos más largos) y lo enseña Ajustes → El centro → «Largo de las
rutas» (verde; ámbar por debajo de 20; rojo si no cabe, y entonces entra en la comprobación al entrar
con lo que más ocupa).

Pruebas: `pruebas/nombres-fijos-con-numero.mjs`.
