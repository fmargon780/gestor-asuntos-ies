# El buscador del ARCHIVO: índice guardado y búsqueda por palabras

Acordado con Francisco el 17-sep-2026. Es la primera de tres instrucciones sobre el buscador
del ARCHIVO; las otras dos (filtros por tipo y curso, y una sola caja que busque a la vez en
abiertos y archivados) se diseñarán aparte y **no entran aquí**.

## 0. Antes de nada: apuntar esta instrucción en la cola

Si `docs/COLA.md` todavía no tiene una fila para este documento, añádela **al final de la
tabla**, con el número siguiente al último, estado PENDIENTE, y pon al día la línea "Orden de
trabajo". Después sigue las reglas de la cola como con cualquier otra fila.

## 1. El problema

Hoy la pantalla ARCHIVO (`App.verArchivo` en `js/archivo-personas.js`) recorre el archivo
entero cada vez que se entra (categoría → carpeta del tercero → carpeta del asunto) y busca
con `indexOf` sobre un solo texto: nombre de la carpeta del asunto, nombre de la categoría y
nombre del tercero. De ahí salen cinco fallos reales:

1. **Las palabras sueltas no valen.** Busca el texto tal cual y seguido: "matricula 2025" no
   encuentra `251003 MATRICULA ...`.
2. **No busca en los documentos.** Ni sus nombres ni el número de registro de Séneca
   (`26EM1234`), que solo vive en el nombre del documento. Buscar un registro en el archivo
   no da nada.
3. **No busca en la ficha del asunto** (`_GESTOR/asuntos.json`): estado, vía, quién lo pidió,
   campos propios del tipo, terceros relacionados.
4. **Los asuntos descolocados no existen.** Solo se ven las carpetas que están exactamente a
   tres niveles. Un asunto archivado a mano justo debajo de la categoría no aparece nunca, y
   nadie avisa de que se lo ha saltado.
5. **Lento.** Relee el archivo completo al entrar, y otra vez al reabrir un asunto. Con años
   acumulados y Dropbox sincronizando, esto solo empeora.

## 2. Ficheros que hay que tocar

Esta es la lista entera. No hace falta abrir nada más, y **no se lee el repositorio completo**.

- `js/archivo-indice.js` — **nuevo**. El módulo del índice (`window.IndiceArchivo`).
- `js/archivo-personas.js` — la pantalla ARCHIVO pasa a leer del índice.
- `js/asuntos-archivar.js` — alta y baja en el índice al archivar y al reabrir.
- `index.html` — el `<script>` nuevo, y el botón y la línea de estado de la pantalla ARCHIVO.
- `pruebas/archivo-indice.mjs` — **nueva**.
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md`, `docs/COLA.md` al terminar.

**No tocar** `js/asuntos-lista.js` (la tarjeta `App.tarjetaAsunto` se sigue usando tal cual, en
modo `archivado`), ni `js/datos.js`, ni `js/copias.js`, ni `js/papelera.js`, ni
`js/conflictos.js`, ni `apps-script/gestor-correos.gs`.

## 3. El fichero del índice

`_GESTOR/indice-archivo.json`, en la carpeta del centro, así que lo comparten los dos
ordenadores.

    {
      "version": 1,
      "hechoEl": "2026-09-17T18:40:00",
      "hechoPor": "Francisco",
      "recuento": { "CATEGORIA": 12 },
      "asuntos": [
        {
          "nombre": "251003 MATRICULA 25-26 1ESO A Perez Perez, Ana 1234567",
          "categoria": "ALUMNADO",
          "tercero": "Perez Perez, Ana 1234567",
          "ruta": "ALUMNADO / Perez Perez, Ana 1234567",
          "fecha": "251003",
          "tipo": "MATRICULA",
          "curso": "25-26",
          "grupo": "1ESO A",
          "documentos": ["251003 26EM1234 SOLICITUD.pdf"],
          "registros": ["26EM1234"],
          "sueltoEn": ""
        }
      ]
    }

- `fecha`, `tipo`, `curso`, `grupo` salen de `Nombres.leer(nombre, App.E.tipos)`, igual que
  ahora. Lo que `Nombres.leer` no sepa se deja en blanco; nada se inventa.
- `documentos` son los nombres de los ficheros de la carpeta del asunto, y de un nivel más si
  esa carpeta tiene subcarpetas. **Solo los nombres**: nunca el contenido de los ficheros.
- `registros` son los sellos de Séneca que aparezcan en esos nombres, con el patrón que ya
  conoce la aplicación (`26EM1234`). Si no hay ninguno, lista vacía.
- `recuento` guarda, por categoría, cuántas carpetas de tercero tenía el archivo cuando se
  construyó el índice. Sirve solo para la comprobación del punto 6.
- `sueltoEn` es para el punto 5: vacío en los asuntos normales.

**Nada de la ficha del asunto se copia al índice.** El estado, la vía, los campos propios, los
relacionados y quién lo pidió se leen en el momento de buscar, de `App.E.registro.asuntos`,
que ya está en memoria: así un cambio en la ficha se nota al instante y sin reconstruir nada.

El índice se escribe y se relee **directamente con `Carpetas`, nunca con `Copias.guardar`**,
igual que hace `js/presencia.js` con `_GESTOR/presencia.json`. No entra en las copias de
seguridad, ni en la papelera, ni en la fusión de conflictos de Dropbox: es un fichero que se
puede rehacer entero en cualquier momento, y engordaría las copias diarias sin motivo.

Antes de escribirlo hay que **releerlo del disco y fusionar**, como hace `Grupos.guardar`: el
compañero puede haber archivado un asunto desde el otro ordenador mientras tanto. La clave para
comparar es el nombre de la carpeta del asunto. Lo suyo que no tengamos se suma.

## 4. Construir el índice

Un botón **"Reconstruir el índice"** en la pantalla ARCHIVO, al lado del de recargar. Recorre
el archivo entero una vez y escribe el fichero. Mientras trabaja, la línea de arriba
(`#explica-archivo`) va diciendo por dónde va: *"Leyendo el archivo… ALUMNADO / 340 asuntos"*.
Esa línea se actualiza por categoría, no por asunto, para no pelear con la pantalla.

Si algo falla a mitad (permiso, Dropbox), no se escribe un índice a medias: se avisa con
`U.aviso` y se deja el que hubiera.

## 5. Los asuntos descolocados

Aprovechando que el recorrido es el mismo, el índice también recoge las carpetas de asunto que
**no** están a tres niveles:

- Una carpeta directamente debajo de la categoría cuyo nombre `Nombres.leer` reconozca como
  asunto (tiene fecha y tipo): entra en el índice con `tercero` vacío y
  `sueltoEn: "bajo la categoría"`.
- Una carpeta de asunto a cuatro niveles o más: entra con `sueltoEn` a la ruta donde estaba.

Salen en los resultados como cualquier otro, y en el pie de su tarjeta se ve su ruta, que ya
pinta `App.tarjetaAsunto` en modo `archivado`. Además, si hay alguno, la línea de estado lo
dice al final: *"…y 3 asuntos colocados fuera de su sitio"*. No se mueve nada: solo se enseña.

## 6. Cuándo el índice se queda corto

Tres casos, y en los tres la aplicación sigue funcionando:

1. **El fichero no existe, está roto o es de otra `version`.** Se lee el archivo recorriendo
   carpetas, como hoy, y en la línea de estado sale *"El índice no está hecho. Reconstruir el
   índice"* con el botón al lado.
2. **Se ha quedado desfasado.** Al entrar en la pantalla, y solo para comprobar, se cuentan las
   categorías y las carpetas de tercero de cada una (un nivel, no los asuntos: es barato) y se
   comparan con `recuento`. Si no cuadran, la pantalla enseña el índice igual, con la línea
   *"El índice puede no estar al día. Reconstruir el índice"*. No se reconstruye solo.
3. **Falta un asunto concreto.** Al archivar (`App.cerrarAsunto`) se añade su entrada, y al
   reabrir (`App.reabrirAsunto`) se quita. Las dos cosas, después de que el traslado de la
   carpeta haya salido bien, y sin romper nada si el índice todavía no existe. `App.verArchivo`
   deja de llamarse desde `App.reabrirAsunto`: con el índice al día, basta repintar.

## 7. Cómo busca

`App.pintarArchivo` deja de usar `indexOf` sobre un solo texto:

- Lo escrito se normaliza (`U.normalizar`) y se parte por espacios en palabras.
- Cada asunto tiene un texto de búsqueda que junta: nombre de la carpeta, categoría, tercero,
  ruta, tipo, curso, grupo, nombres de sus documentos, sus registros de Séneca, y de la ficha
  de `App.E.registro.asuntos` el estado, la vía y su dato, el nombre de quien lo pidió, los
  nombres de los terceros relacionados y los valores de los campos propios del tipo.
- Sale el asunto que tenga **todas** las palabras en ese texto, en cualquier orden y en
  cualquiera de esos datos. Una palabra vale si aparece dentro de otra (`perez` encuentra
  `Perez Perez`).
- El texto de búsqueda de cada asunto se calcula una vez al cargar el índice y se guarda en
  memoria; en cada tecleo solo se comparan palabras.

Lo demás de la pantalla se queda como está: el mismo orden (del asunto más nuevo al más
viejo), el mismo tope de 300 resultados con su aviso, y las mismas tarjetas con Copiar nombre,
Documentos y Reabrir. El "ver más" y los filtros son de las instrucciones siguientes.

Cuando no haya resultados, el texto vacío deja de ser "Nada que mostrar": dice *"Ningún asunto
archivado tiene todas esas palabras."*, y si el índice no está hecho lo recuerda ahí también.

## 8. Lo que NO entra en esta instrucción

- El contenido de los PDF. Obligaría a abrir miles de ficheros; descartado a propósito.
- Los filtros por tipo, categoría, curso, grupo y rango de fechas, y el selector de orden.
- La caja única que busque a la vez en abiertos y archivados.
- Quitar el tope de 300 y poner "ver más".
- Exportar la lista de resultados.

## 9. La prueba

Una sola, al final, cuando esté todo hecho: `pruebas/archivo-indice.mjs`, con el disco de
mentira de `pruebas/navegador.mjs`, sin navegador si se puede. Escenarios:

1. Se construye el índice de un archivo con dos categorías y varios asuntos, y el fichero
   queda con todos.
2. Buscar "matricula 2025 perez" encuentra el asunto aunque esas palabras estén en tres sitios
   distintos y en otro orden.
3. Buscar `26EM1234` encuentra el asunto por el nombre de uno de sus documentos.
4. Buscar el nombre de un tercero relacionado (que está en la ficha, no en el nombre de la
   carpeta) encuentra el asunto.
5. Archivar un asunto lo añade al índice; reabrirlo lo quita.
6. Un asunto colocado directamente bajo la categoría sale en los resultados, con su ruta.
7. Sin fichero de índice, la pantalla enseña los asuntos igual y avisa de que hay que
   reconstruirlo.
8. Con `recuento` desfasado, la pantalla enseña el índice y avisa, sin reconstruir sola.
9. Escribir el índice cuando el compañero ha añadido otro asunto en el disco no pierde el suyo.

## 10. Reglas de trabajo

- **Subir directamente a `main`**, sin abrir ninguna pull request.
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leer el repositorio completo; con los ficheros del punto 2 basta.
- Una sola pasada de pruebas al final, no una comprobación después de cada cambio.
- Si al tocar un fichero pasa de unas 400 líneas, partirlo.
- `App.VERSION` con la hora del reloj de verdad (`TZ='Europe/Madrid' date`).
- Al terminar: actualizar `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea
  vieja**, anotar en `docs/HISTORIA.md` y marcar su fila de `docs/COLA.md` como HECHA.
