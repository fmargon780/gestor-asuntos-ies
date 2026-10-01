# Exportar la lista de asuntos (hoja de cálculo e informe en PDF) y filtro de fechas

Fila 241 de `docs/COLA.md`. Diseñada con Francisco el 1-oct-2026 a partir de su aviso desde el
botón de soporte (aviso completo:
https://drive.google.com/file/d/1Auau5XbzEdNtfseNWBEsJ7Bs1XysVte5/view?usp=drivesdk).

## 0. Para qué

Caso real que lo motiva: el cobro del seguro escolar. Cuando la Secretaria no está, el alumnado
lo paga en Administración. Se crea un asunto por cada cobro y **se archiva en el momento**. Al
acabar el periodo hay que decirle a la Secretaria cuántos se han cobrado y qué importe se le
entrega. Para eso hace falta listar asuntos **archivados**, acotados por tipo y por fechas, con su
importe sumado, sin tener que dejar decenas de asuntos abiertos en Inicio.

Uso esperado: Inicio → Filtros → «Tipo de asunto: Seguro escolar» + «Fechas: desde … hasta …» →
«Exportar ▾» → «Informe en PDF» → marcar «Incluir también los archivados» → columnas Tercero,
Inicio, Importe → sale el PDF con «N asuntos · total X €», listo para entregar.

## 1. Filtro nuevo «Fechas» en Inicio

- Sexto filtro, junto a Responsable, Situación, Plazo, Lo encarga y Tipo de asunto, dentro del
  mismo bloque plegable de «Filtros». Dos campos de fecha: «Desde» y «Hasta». Cualquiera de los dos
  puede ir vacío.
- Mira la **fecha de inicio del asunto** (la de la columna «Inicio» y la del nombre de la
  carpeta). Los dos extremos entran («desde 1-oct hasta 31-oct» incluye el 1 y el 31).
- Vale en las cuatro pestañas, igual que los otros cinco (fila 216): cuenta para el número de cada
  pestaña, para «Filtros (N)» y para «Quitar».
- En la línea de filtros aplicados se escribe «Fechas: del 1-oct-2026 al 31-oct-2026» (o «desde
  …» / «hasta …» si falta un extremo).

## 2. Botón «Exportar ▾» en Inicio

- Junto a «Filtros». Dos opciones: «Hoja de cálculo» e «Informe en PDF». Las dos abren la misma
  ventana (apartado 3), con el título de lo elegido.
- **Se exporta lo que se ve**: los asuntos de la pestaña abierta, con todos los filtros puestos
  (los seis) y lo escrito en el buscador de la cabecera, en el mismo orden que en pantalla.
- Si la vista no tiene ningún asunto y no se marca «Incluir también los archivados», el botón de
  la ventana avisa en gris «No hay asuntos que exportar con estos filtros» y no genera nada.

## 3. La ventana de exportar

Una sola ventana (`U.preguntar` o el cuadro que use la app; un solo cuadro a la vez), con:

1. **«Incluir también los archivados»** (casilla, desmarcada por defecto). Marcada, a los
   abiertos de la vista se suman los asuntos del ARCHIVO que cumplen **los mismos filtros**: tipo,
   fechas, responsable, lo encarga y el buscador. Los filtros que solo tienen sentido para un
   asunto abierto (Situación, Plazo, la pestaña) no excluyen a los archivados. Hay que leer los
   archivados de todos los cursos que caigan dentro de las fechas (o de todos, si no hay fechas),
   usando el índice del ARCHIVO por curso que ya existe; si un curso no está indexado todavía, se
   indexa en ese momento con un aviso de espera. La hoja y el PDF llevan una columna «Situación»
   que dice «Abierto» o «Archivado».
2. **Las columnas**, con una casilla cada una, agrupadas:
   - Del asunto: todas las que tenga la ficha y tengan sentido en una lista (número de asunto,
     tipo, nombre corto del tipo, quién lo encarga, tercero, categoría del tercero, fecha de
     inicio, fecha límite, hito actual, «Le toca a», situación, quién lo pide y por qué vía,
     reservado, fecha de archivo, nombre de la carpeta, número de documentos, notas…). La lista
     exacta la decide la sesión mirando lo que guarda `asuntos.json`; mejor de más que de menos.
   - **Campos propios del tipo** (los de «+ Añadir campo», como «Importe»): todos los de los tipos
     que aparecen en la exportación. Un asunto de un tipo sin ese campo deja la celda vacía.
   - Por defecto, la primera vez, van marcadas las de la tabla de Inicio: Plazo, Tercero, Tipo,
     Hito actual, Le toca a e Inicio.
   - **Se recuerda la última elección** (por ordenador; donde la app guarde ya preferencias de
     este tipo), y por separado para la hoja y para el PDF.
3. **«Incluir los hitos»** (casilla, solo en el PDF; desmarcada por defecto).
4. Botón «Exportar». Mientras lee los archivados, aviso de espera; nunca bloquea sin decir nada.

## 4. La hoja de cálculo

- Fichero `.xlsx` que **se descarga directamente** (nombre: `AAMMDD Asuntos.xlsx`, con la fecha
  del día; si hay un solo tipo filtrado, `AAMMDD Asuntos TIPO.xlsx`).
- Pestaña «Asuntos»: una fila por asunto, con las columnas elegidas. Fechas como fechas y
  cantidades como números (no como texto), para que se puedan sumar y ordenar en la hoja.
- Pestaña «Hitos»: **siempre**, una fila por cada hito de cada asunto exportado: número de asunto,
  tercero, tipo, nº y título del hito, estado, responsable, plazo, fecha en que se terminó.
- Al final de la pestaña «Asuntos»: una línea con el número de asuntos y, debajo de cada columna
  de cantidades (campos numéricos o de importe), su suma.
- Si no hay librería para escribir `.xlsx`, se añade una pequeña dentro de `lib/` (sin depender
  de internet al usarla: la copia sin internet tiene que seguir funcionando).

## 5. El informe en PDF

- Se abre en **el visor de la aplicación**, el mismo de los Word, con «Guardar PDF» e «Imprimir».
- Membrete de la Junta (el que ya dibuja la app). Título «Listado de asuntos», fecha de hoy y una
  línea con los filtros aplicados (pestaña, filtros, buscador y si incluye archivados).
- Tabla con las columnas elegidas; apaisado si no caben en vertical. Mismo orden que la pantalla.
- Con «Incluir los hitos», debajo de cada asunto sus hitos en letra pequeña: título, estado,
  responsable y fecha.
- Al final, igual que en la hoja: «N asuntos» y la suma de cada columna de cantidades
  («Total Importe: 345,00 €»). Formato de cantidades español (coma decimal, punto de miles).

## 6. Asuntos reservados

Salen, pero **sin el nombre del tercero** (ni su identificador), tanto en la hoja como en el PDF,
igual que en la tabla de Inicio: en su lugar, «Reservado». Ninguna columna elegida puede
descubrirlo (nombre de la carpeta incluido: también se oculta). Sin opción para cambiarlo.

## 7. Lo que no se hace

- Nada en la pantalla de Archivo: la exportación vive en Inicio.
- No se guarda ningún fichero en el Dropbox del centro.
- No hay más informes PDF que este (ni agrupados por tipo ni por responsable).

## Cómo sabemos que está bien

1. Abrir Inicio, desplegar «Filtros» y poner en «Fechas» un «Desde» y un «Hasta»: la tabla y los
   números de las cuatro pestañas solo cuentan los asuntos iniciados entre esas dos fechas, y la
   línea de filtros lo dice.
2. Pulsar «Exportar ▾» → «Hoja de cálculo», dejar las columnas por defecto y exportar: se
   descarga un fichero con una pestaña «Asuntos» con los mismos asuntos y en el mismo orden que la
   tabla, otra pestaña «Hitos», y al final la línea con el número de asuntos.
3. Archivar un asunto de un tipo con un campo de cantidad, filtrar por ese tipo, pulsar
   «Exportar ▾» → «Informe en PDF», marcar «Incluir también los archivados» y la columna de ese
   campo: el PDF se abre en el visor con membrete, sale el asunto archivado marcado «Archivado», y
   al final «N asuntos» y el total de esa columna.
4. Volver a abrir la ventana de exportar: salen marcadas las columnas que se eligieron la vez
   anterior.
5. Con un asunto reservado en la vista, exportar a PDF con la columna Tercero: ese asunto sale
   como «Reservado», sin su nombre.
6. Exportar a PDF con «Incluir los hitos» marcada: debajo de cada asunto salen sus hitos en letra
   pequeña.
7. [SOLO FRANCISCO] Con los datos reales del seguro escolar: filtrar por su tipo y las fechas del
   periodo, exportar a PDF con los archivados y la columna «Importe», y comprobar que el número de
   cobros y el total coinciden con lo cobrado.
