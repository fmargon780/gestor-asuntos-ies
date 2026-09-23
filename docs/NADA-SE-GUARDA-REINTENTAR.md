# Fila 92 — «Reintentar is not defined»: la aplicación no puede guardar nada

23-sep-2026. Acordado con Francisco en la conversación del 23-sep-2026 (14:00).

## 1. El síntoma

A Francisco le sale mucho, en rojo:

    No se ha podido reconstruir el índice: Reintentar is not defined

No es un problema del índice del ARCHIVO. `Carpetas.escribirTexto` y `Carpetas.escribirBytes`
(`js/carpetas.js`) llaman desde la fila 90 a `Reintentar.escritura(...)`, así que **en la versión
que Francisco tiene abierta falla CUALQUIER escritura**: `asuntos.json`, `hitos.json`,
`_ficha.json`, las copias diarias, todo. El mensaje del índice es solo el primero que se ve.

`js/reintentar-escritura.js` existe en el repositorio y **sí** está en `index.html` de `main`
(justo antes de `js/carpetas.js`). Por tanto lo que corre en el navegador de Francisco no es lo
que hay en `main`: es una versión a medias, con `js/carpetas.js` nuevo y un `index.html` que no
carga el fichero nuevo.

## 2. Lo que hay que hacer (por este orden)

### 2.1 Que no vuelva a pasar nunca por esto

En `js/carpetas.js`, las dos escrituras dejan de depender de que el módulo exista:

- Una función interna, `conReintento(intento)`: si `window.Reintentar && Reintentar.escritura`,
  llama a `Reintentar.escritura(intento)`; si no, llama a `intento()` directamente.
- `escribirTexto` y `escribirBytes` pasan a usarla.

Así, sin el módulo la aplicación pierde el reintento de Dropbox, pero **guarda**. Nunca un
`ReferenceError` que deja la aplicación sin poder escribir.

Además, `js/reintentar-escritura.js` termina exponiéndose como el resto de módulos:
`window.Reintentar = Reintentar;`.

### 2.2 Averiguar de dónde sale la versión a medias

Comprobar, en este orden, y arreglar lo que aparezca:

1. Lo publicado, con `curl`: `https://asuntos.fmargon.com/index.html` y
   `https://gestor-de-asuntos.vercel.app/index.html`. ¿Aparece `js/reintentar-escritura.js`?
   ¿Y el fichero, con `curl .../js/reintentar-escritura.js`?
2. La copia sin internet (`docs/COPIA-SIN-INTERNET.md`, fila 89, y la fila 91 pendiente): si el
   instalador o el generador de la copia lleva una **lista de ficheros escrita a mano**, le falta
   el fichero nuevo. Esa es la causa más probable. Arreglar la lista y, de paso, dejarla sacada
   de `index.html` en vez de escrita aparte.
3. Caché del navegador: si `index.html` se sirve con caché larga, el navegador puede quedarse con
   uno viejo mientras baja los `.js` nuevos. Comprobar las cabeceras de `vercel.json` y, si hace
   falta, que `index.html` no se cachee.

### 2.3 Una prueba que lo cace

`pruebas/scripts-cargados.mjs` (nueva, sin navegador): recorre `js/*.js` del repositorio y falla
si alguno no aparece en `index.html`. Y si la copia sin internet tiene su propia lista de
ficheros, comprueba también que las dos listas coinciden.

## 3. Cómo se comprueba

- `npm test` en verde, con la prueba nueva.
- Con `curl`, que lo publicado carga `js/reintentar-escritura.js`.
- Simulando que el módulo no existe (borrándolo del `index.html` de una prueba), guardar un
  fichero sigue funcionando.

Sube a `main` sin abrir ninguna petición de cambios.
