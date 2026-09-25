# Fila 160 — «Versiones previas»: fuera de la vista lo que ya no es el documento bueno

Cerrado con Francisco el 25-sep-2026 en la conversación del proyecto.

## Qué quiere Francisco

En cada asunto se acumulan documentos que ya no son los buenos pero que no se deben borrar:

- el original «SIN SELLAR» que deja el registro de un documento (`RegistroSellado.nombreSinSellar`);
- el borrador de Word (`.doc`/`.docx`) generado desde una plantilla, cuando ya existe su versión
  en PDF.

Hoy salen siempre, en la ficha, en la mesa del hito y en la carpeta de Dropbox. Es mucho ruido.
Quiere esconderlos **con la certeza de que siguen ahí**, por si hacen falta más adelante.

## La regla

1. **Subcarpeta `Versiones previas`** dentro de la carpeta de cada asunto. Se crea solo cuando
   hace falta (nunca vacía).
2. **Al registrar un documento**, el original «SIN SELLAR» va directamente a
   `Versiones previas/` (mismo nombre que hoy, con la numeración «(2)», «(3)» si ya existe allí).
3. **Borrador de Word**: se queda a la vista mientras no exista su versión en PDF. Así recuerda
   que hay trabajo pendiente. En cuanto aparece en la carpeta un PDF con la misma clave de gemelo
   (la que ya usa `js/hito-mesa-documentos.js`: sin extensión, sin «SIN SELLAR», sin código de
   registro), el `.doc`/`.docx` se mueve a `Versiones previas/`. Esto se comprueba al guardar un
   PDF desde la app (incluido el «Guardar PDF» de la fila 155, si ya está hecha) y al registrar.
4. **Un Word sin PDF nunca se mueve solo.**
5. Si en `Versiones previas/` ya hay un fichero con ese nombre, se numera; nunca se pisa nada.
6. Nada de esto es un borrado: no pasa por la papelera.

## Dónde se ve

- **Ficha del asunto** (`js/ficha-documentos.js`) y **mesa del hito**
  (`js/hito-mesa-documentos.js`): solo los documentos de la carpeta principal. Debajo de la lista,
  una línea discreta en gris: «N versiones previas · ver». Al pulsarla se despliegan debajo, en
  gris claro, cada una con su «Abrir» y su ⋯. Plegado por defecto. Sin versiones previas, la línea
  no sale.
- Los gemelos que cuelgan de un documento en la mesa siguen colgando de él aunque vivan en
  `Versiones previas/` (se buscan también allí), pero plegados con el resto: solo se ven al
  desplegar.
- **Tarjeta cerrada de Documentos** (`js/ficha-tarjetas-resumen.js`): no cuenta las versiones
  previas en los 5 nombres ni en «y N más».
- **Índice del expediente** (`js/indice-expediente.js`): no las incluye. Quitar de ahí la marca
  de «SIN SELLAR», que ya no hará falta.
- **Buscador del ARCHIVO** (`js/archivo-indice.js`): se siguen indexando, para poder encontrarlas.
- En el ⋯ de cada documento: «Pasar a versiones previas» (para los de la carpeta principal) y
  «Sacar de versiones previas» (para los de dentro). Así se corrige a mano cualquier caso raro.

## Lo que no cambia

- Archivar, reabrir, renombrar y fusionar carpetas mueven la carpeta entera: la subcarpeta viaja
  con ella. Comprobar que la fusión de carpetas (archivar sobre un destino que ya existe) funde
  también `Versiones previas/` si existe en los dos lados, sin pisar ficheros.
- «Por clasificar» y el recuento de documentos del asunto no deben tratar `Versiones previas`
  como un documento ni como una carpeta suelta.
- Los hitos siguen teniendo apuntados sus documentos: si un documento apuntado a un hito pasa a
  `Versiones previas/`, se actualiza su ruta en el hito (no se pierde el enlace).

## Mantenimiento: ordenar lo que ya existe

En Ajustes › Mantenimiento (`js/ajustes-mantenimiento.js`), botón **«Ordenar versiones
previas»**:

1. Recorre las carpetas de los asuntos abiertos y del ARCHIVO.
2. Primero cuenta y lo dice: «Se moverán N documentos de M asuntos a Versiones previas».
   Confirmar con `U.preguntar`.
3. Aplica las reglas 2 y 3 (los «SIN SELLAR» siempre; los Word solo si tienen su PDF).
4. Al terminar: verde con el total; ámbar con la lista de los que no pudo mover.
5. Se puede pulsar dos veces sin daño: lo ya ordenado no se toca.

## Ficheros que hay que tocar

- `js/registro-sellado.js` y `js/registro.js` (regla 2 y la comprobación de la regla 3).
- `js/plantillas-documento.js` / `js/hitos-generar.js` solo si es ahí donde se guarda el PDF.
- `js/ficha-documentos.js`, `js/hito-mesa-documentos.js`, `js/ficha-tarjetas-resumen.js`.
- `js/hitos-documento-menu.js` (las dos opciones del ⋯).
- `js/indice-expediente.js`.
- `js/ajustes-mantenimiento.js` (el botón). Si pasa de 600 líneas, partir en un fichero nuevo
  `js/versiones-previas.js` con la lógica común (`window.VersionesPrevias`: nombre de la
  subcarpeta, `mover`, `sacar`, `listar`, `ordenarAsunto`), y que los demás la usen.
- Una prueba nueva en `pruebas/versiones-previas.mjs`: registrar deja el «SIN SELLAR» en la
  subcarpeta; un Word con su PDF se mueve y sin PDF no; la ficha enseña «1 versión previa · ver»;
  el índice no la cuenta; «Ordenar versiones previas» dos veces no cambia nada la segunda.
  Ajustar `pruebas/indice-del-expediente.mjs`, que hoy espera el «SIN SELLAR» en la lista.
- `docs/CONTEXTO-CORTO.md` (sección 5, sustituyendo la línea de «Registrar un documento…»),
  `docs/contexto/DOCUMENTOS-PDF.md`, `docs/contexto/HITO-MESA.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md` y `docs/COLA.md`.

## Cómo trabajar

- Después de la fila 155 si está pendiente (usa su «Guardar PDF»); si no, sin esperar.
- No leer el repositorio entero: solo los ficheros de arriba y sus hijos de `docs/contexto/`.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- Subir directamente a `main`, sin abrir ninguna pull request.
- Una sola pasada de pruebas al final. Comprobar lo publicado con `curl`.
