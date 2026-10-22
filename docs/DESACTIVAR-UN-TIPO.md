# Desactivar un tipo de asunto

Fila 422 de `docs/COLA.md`. Tema 404 (idea 401), diseñado con Francisco el 22-oct-2026.

## Por qué

Hoy un tipo de asunto se crea, se cambia de nombre, se une con otro o se borra. Falta poder
**apagarlo sin borrarlo**: que no se use mientras esté apagado, sin perder nada de lo suyo (campos,
hitos, plantillas, plazo, recurrencia) y sin tocar los asuntos que ya lo tienen. Y poder volver a
encenderlo cuando se quiera.

## Qué hay que hacer

### 1. El dato

- Cada tipo guarda si está desactivado (por ejemplo `desactivado: true`), en la misma lista de tipos
  compartida de la carpeta GESTOR donde ya vive todo lo suyo. Un tipo sin ese dato está activo: los
  tipos de hoy no se tocan ni hay que ponerles nada.
- Desactivar o activar **no borra ni cambia nada más** del tipo.

### 2. Qué deja de pasar con un tipo desactivado

- **No sale para elegir** en ningún sitio donde se escoge el tipo de un asunto **nuevo o cambiado**:
  crear un asunto (`js/asuntos-nuevo*.js`), crear un asunto desde un correo de la bandeja
  (`js/bandeja-*.js`), cambiar el tipo de un asunto ya creado, y cualquier otro selector o buscador de
  tipos con ese fin (`js/tipos-buscador.js`). También el reparto de carpetas (`js/repartir-crear.js`),
  los encargos (`js/encargos-llegada.js`), las candidaturas (`js/candidaturas.js`), el registro y los
  documentos sueltos. Busca todos los sitios; no te quedes en el primero. Mejor un solo filtro común
  («tipos para elegir») que cada selector por su cuenta.
- **El lector automático no lo propone** (`js/documentos-sueltos-lector.js`, `js/lector-documentos.js`):
  si un documento casaría con un tipo desactivado, se comporta como si no hubiera reconocido ningún
  tipo.
- **Su recurrencia se para**: no se crean asuntos automáticos de ese tipo mientras esté desactivado
  (`js/recurrentes.js`).
- **Al volver a activarlo, espera a la siguiente fecha que le toque contando desde el día en que se
  activa.** No se crea ninguno ese día, ni de golpe los que «se habrían creado» mientras estuvo
  apagado. Ejemplo: un tipo mensual apagado en noviembre y activado el 10 de enero no crea el de enero;
  el siguiente sale en febrero. Ojo: hoy la próxima fecha se calcula desde la última creación; al
  activar hay que recalcularla para que no salga una fecha ya pasada.
- **El botón «Activo / Parado» de cada asunto que se repite** (sección «Se repite» del tipo) conserva su
  propio estado y no se toca. Mientras el tipo esté desactivado, esa sección muestra una línea: «Parado
  porque el tipo está desactivado». Al activar el tipo, cada uno vuelve a como estaba (el que estaba
  «Parado» sigue parado).

### 3. Qué sigue igual

- Los asuntos ya creados de ese tipo, abiertos o archivados: se ven, se abren y se trabajan igual que
  antes (hitos, documentos, plantillas, correos, archivar, reabrir).
- El tipo sigue saliendo en búsquedas y filtros de asuntos (para encontrar los que ya lo tienen).
- Dentro de Ajustes, el tipo desactivado se puede abrir y cambiar como cualquier otro (campos, hitos,
  plantillas, plazo, recurrencia, nombre, unir, borrar).
- La detección de tipos repetidos (`js/tipos-parecidos.js`) y «Unir» lo siguen teniendo en cuenta:
  sigue existiendo. Al unir dos tipos, el que se queda conserva su estado (activo o desactivado).
- Al editar un asunto que ya tiene un tipo desactivado, su tipo actual se sigue mostrando, marcado
  «Desactivado», y el asunto se guarda sin obligar a cambiarlo. Lo que no sale es la opción de
  elegirlo para otro asunto.
- Si alguien intenta crear un tipo nuevo (en Ajustes o con «+ Crear tipo nuevo» al crear un asunto)
  con el mismo nombre o nombre corto que uno desactivado, la app avisa de que ya existe y está
  desactivado, y ofrece un botón «Activarlo». No crea uno repetido.

### 4. Cómo se ve en Ajustes › Tipos de asunto

- En su categoría, la tarjeta de un tipo desactivado sale **en gris, al final de la lista** de esa
  categoría, con la palabra **«Desactivado»** bien visible.
- Al buscar, también sale (en gris y con «Desactivado»).
- El contador de la categoría (por ejemplo «ALUMNADO 57») sigue contando todos, también los
  desactivados.
- Junto a «Cambiar el nombre» y «Borrar» hay un botón **«Desactivar»**. En un tipo desactivado, ese
  botón dice **«Activar»**.
- Al pulsar «Desactivar», la app pregunta antes y dice cuántos asuntos abiertos tienen ese tipo, y que
  seguirán igual, y cuántos asuntos que se repiten tiene y que se van a parar. Por ejemplo: «Hay 3
  asuntos abiertos de SANCION ALUMNADO. Seguirán igual. El tipo dejará de salir al crear asuntos
  nuevos». Si tiene asuntos que se repiten, añade: «Se pararán sus 2 asuntos que se repiten». Si no
  hay asuntos abiertos, lo dice también. «Activar» no pregunta.
- Lo pueden hacer los mismos que hoy pueden borrar un tipo: usa exactamente la misma comprobación que
  «Borrar». En modo consulta, el botón no sale o sale apagado, como «Borrar».

### 5. Ejemplo con datos reales

El tipo **SANCION ALUMNADO** (categoría ALUMNADO). Se desactiva: deja de salir al crear un asunto, su
tarjeta queda en gris al final de ALUMNADO con «Desactivado», y un asunto ya abierto de ese tipo se
sigue trabajando igual. Se activa: todo vuelve a como estaba.

### 6. Pruebas y documentos

- Prueba automática nueva (`pruebas/`) que cubra las comprobaciones de abajo, más: la recurrencia de un
  tipo desactivado no crea asuntos; al activarlo no crea ninguno ese día y sí en la siguiente fecha; el
  «Parado» de un asunto que se repite se conserva; la bandeja y el lector no ofrecen un tipo
  desactivado; crear un tipo con el nombre de uno desactivado avisa. Datos inventados.
- Poner al día `docs/contexto/CAMPOS-Y-TIPOS.md` (y el documento hijo de recurrentes o de asuntos si
  lo tocas).

## Cómo sabré que está bien

1. En Ajustes › Tipos de asunto › ALUMNADO, la tarjeta «SANCION ALUMNADO» sale en gris, al final de la
   lista, con la palabra «Desactivado».
2. Al crear un asunto nuevo, «SANCION ALUMNADO» no aparece entre los tipos para elegir.
3. Un asunto ya abierto de tipo «SANCION ALUMNADO» se abre y se trabaja igual que antes.
4. Al pulsar «Activar», la tarjeta vuelve a su color y a su sitio, y el tipo vuelve a salir al crear un
   asunto.
