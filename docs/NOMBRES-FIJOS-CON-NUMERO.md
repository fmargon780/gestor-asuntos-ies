# Nombres fijos con número de asunto y de documento (fila 239)

Diseño cerrado con Francisco el 30-sep-2026. Conversación de diseño:
https://claude.ai/code/session_01EjMcmYFHYiBpRgFHKQCP3b

## El problema

Al guardar un documento en un asunto desde la aplicación, salió en rojo «El nombre no cabe en la
ruta de Dropbox: acorta el texto» y no le dejó seguir. Causa: `Nombres.topes()`
(`js/nombres-topes.js`) calcula el hueco del documento como si la carpeta del asunto tuviera el
largo máximo y como si el documento fuera a «Versiones previas», y los nombres de hoy llevan
piezas de largo libre (campos propios, texto libre, año académico, grupo, registro).

**Regla que no se negocia:** el nombre de la carpeta y del documento es **exactamente** el que la
aplicación enseña. Nunca se recorta en silencio al guardar. Lo que se consigue con esta fila es
que el nombre tenga un largo máximo conocido de antemano, con una estructura fija.

**Antes de empezar:** lee `docs/contexto/ASUNTOS.md`, `docs/contexto/DOCUMENTOS.md` y
`docs/contexto/CAMPOS-Y-TIPOS.md`. No leas el repositorio entero.

## 1. Número de asunto

- Cada asunto **nuevo** recibe un número único: `A` + dos cifras del año natural + guion + cuatro
  cifras correlativas. Ejemplo: `A26-0137`. El contador vuelve a `0001` cada 1 de enero (año de la
  fecha de creación real, no de la fecha de inicio del asunto).
- Contador en `_GESTOR` (fichero nuevo, p. ej. `_GESTOR/numeros.json`, con `{ asuntos: { "26": 137 },
  documentos: { "26": 1234 } }`), guardado siempre por `ColaGuardado`.
- **Dos ordenadores a la vez** (Francisco y su compañero): antes de dar un número, releer el fichero
  del disco, y comprobar además que el número no aparece ya en ninguna ficha abierta ni en el índice
  del ARCHIVO. Si aparece, se salta al siguiente libre. Un número dado no se reutiliza nunca, aunque
  el asunto se borre.
- El número se guarda en la ficha (`numero`), se enseña en la cabecera de la ficha, en la mesa y en
  la tabla de Inicio (junto al tipo o en su propia columna estrecha), y el buscador lo encuentra.
- **No cambia nunca**: ni al cambiar el tipo, el tercero o la fecha, ni al archivar, reabrir o unir
  (en una unión, se queda el del asunto que se queda).

## 2. Número de documento

- Cada documento **nuevo** que la aplicación guarda o genera recibe su propio número, independiente
  del asunto: `D` + dos cifras del año + guion + cinco cifras. Ejemplo: `D26-01234`. Mismo contador
  anual y mismas comprobaciones que el de asunto.
- **No lleva el número del asunto**: un mismo documento puede estar en varios asuntos (por ejemplo,
  «Repartir entre terceros», o guardar un documento suelto en dos asuntos). Todas sus copias llevan
  el **mismo** número.
- **La versión sellada y la sin sellar son el mismo documento**: mismo número. La sin sellar va a la
  subcarpeta de versiones previas; la sellada queda en la carpeta del asunto. Igual el Word y su PDF.
- Los datos de cada documento (tipo, fecha, sus registros de Séneca —uno o varios: entrada y salida,
  p. ej. solicitud y resolución en el mismo papel—, campos del tipo de documento, texto adicional,
  hito) viven en la ficha del asunto, junto a la lista de documentos, ya no en el nombre. La
  aplicación los enseña en la fila del documento y el buscador los sigue encontrando (hoy el índice
  saca el registro del nombre: pasa a sacarlo de la ficha, **sin dejar de leerlo del nombre en los
  documentos antiguos**).

## 3. La estructura fija

**Carpeta del asunto:** `AAMMDD A26-0137 TIPO Tercero`

- `AAMMDD`: fecha de inicio, como ahora. `TIPO`: el nombre corto del tipo (`nombreCorto`, o el
  nombre si no tiene), en mayúsculas. `Tercero`: como ahora, siempre al final.
- **Salen del nombre**: el año académico, el grupo, los campos propios del tipo, los campos
  calculados y el texto libre. No se pierden: siguen en la ficha, se ven en la aplicación y el
  buscador los encuentra.

**Documento:** `AAMMDD TIPO D26-01234.ext`

- `AAMMDD`: fecha del propio documento. `TIPO`: nombre corto del tipo de documento, en mayúsculas.
- **Salen del nombre**: el registro de Séneca, los campos del tipo de documento y el texto
  adicional. Quedan en los datos del documento (punto 2).

Con esto ya no hace falta distinguir nada añadiendo números a la fecha: el número lo hace único.
Poner al día `docs/VOCABULARIO.md` si cambia algún texto de pantalla, y la sección 4 de
`docs/CONTEXTO-CORTO.md` (reglas de nombres) sustituyendo las líneas viejas.

## 4. «_Previas»

La subcarpeta «Versiones previas» pasa a llamarse **«_Previas»** para lo nuevo. La aplicación
tiene que seguir reconociendo y leyendo las «Versiones previas» que ya existen (no se renombran
solas). Si en un asunto ya hay «Versiones previas», lo nuevo va a esa misma, para no tener dos.

## 5. Tipos con el nombre corto demasiado largo

- Tope: **25 caracteres** para el nombre corto de un tipo de asunto y de un tipo de documento. Si un
  tipo de documento no tiene todavía campo de nombre corto, se le añade, igual que el de asunto.
- Al crear o cambiar un tipo, el campo del nombre corto lleva contador y no deja guardar con más de
  25 caracteres.
- **Los que ya existen y pasan de 25 no se bloquean**: se siguen usando con su nombre entero (igual
  en la app y en Dropbox). La comprobación al entrar (fila 204, «⚠ N por configurar») los cuenta;
  «Arreglarlo» abre **una sola lista** con todos los tipos largos, de asunto y de documento, cada uno
  con su casilla de nombre corto y su contador, y se guarda al cambiar (sin botón «Guardar»).
- Acortar un tipo **no renombra nada** de lo que ya existe.

## 6. Medidor de margen en Ajustes → El centro

- Una sección «Largo de las rutas» que calcula el peor caso con la ruta real (`rutas.json`, raíz de
  Dropbox de este ordenador): la categoría más larga, el tercero más largo del catálogo, el tipo de
  asunto más largo, el tipo de documento más largo, la subcarpeta de previas y los números.
- Dice «Quedan N caracteres de margen» en verde; en ámbar por debajo de 20; en rojo si no cabe.
  Con rojo, entra también en la comprobación al entrar, diciendo qué es lo que más ocupa (tipo,
  tercero o ruta de la carpeta ARCHIVO).
- Las carpetas ASUNTOS ABIERTOS y ARCHIVO **no se mueven**: decisión de Francisco; el medidor dirá
  si algún día hace falta.
- `Nombres.topes()` se sustituye por este cálculo: con la estructura fija el nombre ya no se
  recorta. Si en un caso concreto la ruta real no cabe (tercero larguísimo), el aviso rojo lo dice
  en el momento de elegir el tercero o el tipo, no al final al guardar, y explica qué hacer. El
  nombre nunca se recorta a escondidas.

## 7. Lo que ya existe

Carpetas y documentos existentes se quedan con su nombre, sin número y sin renombrar. La aplicación
tiene que seguir leyéndolos, buscándolos y archivándolos como hasta ahora (las funciones que sacan
fecha, registro, tipo o tercero del nombre siguen valiendo para los nombres antiguos). Un asunto
antiguo que se cambia («Cambiar el asunto») **no** recibe número ni cambia de estructura. Solo lo
creado desde esta versión lleva número y estructura fija.

## 8. Pruebas

Prueba nueva `pruebas/nombres-fijos-con-numero.mjs` y poner al día las que comprueben nombres
(`nombres`, `tercero-con-buscador-al-cambiar`, etc.). Datos de demostración: algún asunto y
documento con número, y alguno antiguo sin número, para que el revisor vea los dos.

## Cómo sabemos que está bien

1. En la copia de pruebas, crear un asunto nuevo: la carpeta se llama `AAMMDD A26-NNNN TIPO Tercero`,
   sin año académico, grupo, campos ni texto libre, y la vista previa enseña exactamente ese nombre.
2. Crear otro asunto del mismo tipo, mismo tercero y mismo día: sale con el número siguiente y no hay
   ningún aviso de duplicado de nombre.
3. Guardar un documento en ese asunto: se llama `AAMMDD TIPO D26-NNNNN.ext`; su fila enseña el
   registro, los campos y el texto adicional, y el buscador lo encuentra por el registro.
4. Registrar a mano un fichero distinto (sellado): el sellado y el sin sellar llevan el mismo número;
   el sin sellar está en «_Previas».
5. Guardar un documento suelto en dos asuntos: las dos copias llevan el mismo número de documento.
6. Un tipo con nombre corto de más de 25 caracteres sale en «⚠ por configurar»; «Arreglarlo» abre la
   lista y, al acortarlo, desaparece del aviso. Mientras tanto, se puede crear un asunto de ese tipo.
7. Ajustes → El centro enseña «Largo de las rutas» con el margen en verde.
8. Un asunto antiguo de la demostración (sin número) se abre, se busca, se cambia y se archiva sin
   recibir número ni cambiar de nombre.
9. [SOLO FRANCISCO] Con sus carpetas reales, guardar el documento que le dio el error: se guarda sin
   aviso rojo, y el medidor de Ajustes enseña el margen real.
