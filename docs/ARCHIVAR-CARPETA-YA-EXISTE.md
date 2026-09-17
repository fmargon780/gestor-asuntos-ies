# Archivar cuando la carpeta ya existe en el destino

Acordado con Francisco el 17-sep-2026. **Es la primera de la cola**: le está bloqueando un
asunto real ahora mismo.

No leas el repositorio entero. Con este documento, `docs/CONTEXTO.md` y los ficheros que se
nombran aquí basta. Cambios quirúrgicos, no reescribas ficheros enteros.

---

## 1. Lo que pasa

Al archivar un asunto de PERSONAL, la aplicación contestó:

> No se ha podido archivar: Ya hay una carpeta llamada "260917 JUSTIFICACION FALTAS PAS 26-27
> 16.09.26 García Durán, Carlos Javier 535F" en el destino.

Y a partir de ahí, cada intento devuelve lo mismo. Desde la aplicación no hay salida.

El mensaje sale de `Carpetas.trasladar` (js/carpetas.js):

- `trasladar` comprueba que en el destino no haya ya una carpeta con ese nombre.
- Si no la hay, **crea la carpeta de destino**, copia dentro, cuenta los ficheros que han
  llegado y solo entonces borra el original.
- Si la cuenta no cuadra, o si la copia revienta a mitad (Dropbox sincronizando, un fichero
  bloqueado, un PDF a medio bajar), lanza el error **dejando la carpeta de destino a medias**.
  Nadie la limpia.

Desde ese momento, el siguiente intento de archivar ese asunto encuentra la carpeta a medias y
se para. El asunto se queda atascado para siempre.

No es un fallo de la categoría PERSONAL: `App.cerrarAsunto` no distingue categorías. Le puede
pasar a cualquier asunto.

## 2. Lo que hay que conseguir

Que Francisco pulse **Archivar** otra vez y el asunto se archive, sin tocar nada a mano y sin
perder ningún papel. Y que la situación no se vuelva a crear.

## 3. Ficheros que hay que tocar

| Fichero | Qué se hace |
|---|---|
| `js/carpetas.js` | Limpiar el destino a medias cuando la copia falla. Función nueva `fusionarEn`. |
| `js/asuntos-archivar.js` | **Fichero nuevo.** Recibe `App.cerrarAsunto` (y `App.reabrirAsunto`, si está en el mismo sitio), sacados de `js/documentos-sueltos.js`. |
| `js/documentos-sueltos.js` | Se le quita ese bloque. Pasa de más de 400 líneas, y por eso se parte. |
| `index.html` | Cargar `js/asuntos-archivar.js`. **Justo después de `js/documentos-sueltos.js` y antes de `js/relacionados.js` y `js/hitos-archivo.js`**, que envuelven `App.cerrarAsunto` y dejarían de funcionar si se carga después. Compruébalo, no lo des por hecho. |
| `pruebas/archivar-fusion.mjs` | **Prueba nueva.** |
| `docs/COLA.md`, `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md`, `docs/HISTORIA.md` | Lo de siempre al terminar. |

No toques `js/relacionados.js` ni `js/hitos-archivo.js`: siguen envolviendo `App.cerrarAsunto`
igual que hasta ahora.

## 4. Cambios en `js/carpetas.js`

### 4.1 Que una copia fallida no deje basura

En `trasladar`, la carpeta de destino la crea la propia función (justo antes se ha comprobado
que no existía). Por tanto, si algo falla después de crearla, esa carpeta es suya y hay que
borrarla:

- Envuelve en `try/catch` todo lo que va desde `getDirectoryHandle(nombreDestino, {create:true})`
  hasta la comprobación de la cuenta.
- Si salta cualquier error, o si la cuenta no cuadra, borra el destino recién creado
  (`padreDestino.removeEntry(nombreDestino, { recursive: true })`) y vuelve a lanzar el error
  de siempre. El original no se toca nunca.
- El borrado de limpieza va también en su propio `try/catch`: si no se puede borrar, se lanza
  igualmente el error original, que es el que le interesa a quien lo lee.

### 4.2 Función nueva `fusionarEn`

```
fusionarEn(padreOrigen, nombre, padreDestino, nombreDestino)
```

Junta la carpeta de origen con una que ya existe en el destino, sin perder nada:

1. Recorre el origen entero, con sus subcarpetas.
2. Fichero que no está en el destino: se copia.
3. Fichero que está en el destino **con el mismo tamaño**: se da por copiado y no se toca.
4. Fichero que está en el destino **con distinto tamaño**: se copia con un sufijo antes de la
   extensión, `" (2)"`, `" (3)"`… hasta encontrar un nombre libre. Nunca se pisa nada.
5. Subcarpeta que ya existe en el destino: se entra y se aplica lo mismo dentro.
6. Al terminar, **se comprueba**: cada fichero del origen tiene que estar en el destino, con su
   nombre o con el sufijo, y con el mismo tamaño. Si falta alguno, se lanza un error diciendo
   cuántos han llegado y cuántos no, **sin borrar nada del origen**.
7. Solo con la comprobación en verde se quita el origen. Si en `js/papelera.js` ya hay una
   función que mande una carpeta de asunto entera a la papelera, se usa esa. Si no la hay, se
   borra con `removeEntry(nombre, { recursive: true })`, igual que hace hoy `trasladar` después
   de comprobar. No inventes una papelera de carpetas para esto.
8. Devuelve un objeto con: ficheros copiados, ficheros que ya estaban, y ficheros guardados con
   sufijo (con sus nombres).

`trasladar`, `mover` y `renombrar` **se quedan como están** en su comportamiento normal: si el
destino existe, siguen fallando. Solo el archivado (y el reabrir) usan `fusionarEn`.

## 5. Cambios en `App.cerrarAsunto`

La función se mueve tal cual a `js/asuntos-archivar.js` y allí se le hacen estos cambios:

1. **Antes de enseñar el cuadro de confirmación**, mira si el destino ya existe, sin crear nada:
   baja por `ARCHIVO / categoria / tercero` con `Carpetas.bajar(..., false)` dentro de un
   `try/catch`, y si llega, `Carpetas.existe(destino, a.nombre)`.
2. Si ya existe, añade al cuadro de confirmación una línea de aviso, con estas palabras:

   > En el archivo ya hay una carpeta con este mismo nombre, seguramente de un intento anterior
   > que se quedó a medias. Se juntarán las dos: no se pierde ningún documento, y si algún papel
   > coincide en nombre pero no en contenido, se guarda al lado con un (2) detrás.

   El botón sigue siendo **Archivar el asunto**. **No se le pregunta nada más a Francisco**: un
   solo clic, el de siempre.
3. Al archivar, si el destino existe se llama a `Carpetas.fusionarEn`; si no existe, a
   `Carpetas.mover`, como hasta ahora.
4. `App.anotar` se llama igual en los dos casos, con `ficheros` = el total que hay al final en la
   carpeta del destino.
5. El aviso final:
   - Fusión sin coincidencias raras: `Asunto archivado. Se ha completado un archivado anterior
     que se había quedado a medias.`
   - Fusión con ficheros guardados con sufijo: lo mismo, más `Hay N documento(s) guardados con
     un (2) detrás porque había otro con el mismo nombre y distinto contenido.`
   - Sin fusión: `Asunto archivado.`, como hoy.

## 6. Reabrir un asunto

Si `App.reabrirAsunto` (o como se llame la función que devuelve la carpeta a Asuntos abiertos)
usa `Carpetas.mover`, dale el mismo trato: si en Asuntos abiertos ya hay una carpeta con ese
nombre, `fusionarEn`. Es el mismo atasco al revés.

## 7. La prueba nueva: `pruebas/archivar-fusion.mjs`

Con el disco de mentira de `pruebas/`, sin navegador si se puede. Escenarios:

1. Destino libre: se archiva como siempre; el origen desaparece.
2. Destino con una carpeta del mismo nombre a medias (le faltan dos ficheros): se archiva; el
   destino acaba con todos; el origen desaparece.
3. Destino con un fichero de mismo nombre y **mismo** tamaño: no se duplica.
4. Destino con un fichero de mismo nombre y **distinto** tamaño: aparecen los dos, el segundo
   con `(2)` antes de la extensión, y ninguno se pierde.
5. Subcarpetas: la fusión baja dentro y hace lo mismo.
6. La copia falla a mitad: el origen sigue entero donde estaba, y **el destino no se queda a
   medias** (se ha limpiado).
7. La comprobación final falla: no se borra nada del origen.

Una sola pasada de la batería completa (`npm test`) al final, no después de cada cambio.

## 8. Al terminar

- Sube directo a `main`, **sin abrir ninguna pull request**.
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`), nunca a ojo.
- Comprueba lo publicado con `curl`.
- Marca la fila 32 de `docs/COLA.md` como HECHA, y actualiza `CONTEXTO-CORTO.md` y `CONTEXTO.md`
  **sustituyendo la línea vieja**, más lo que merezca la pena en `HISTORIA.md`.
