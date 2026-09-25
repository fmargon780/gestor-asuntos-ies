# Fila 98 — copiar la ruta de la carpeta del asunto

23-sep-2026. Diseñado y cerrado con Francisco el 23-sep-2026 (14:00).

> **Continúa en la fila 152** (`docs/RUTA-QUE-NO-VA-A-BING.md`, 25-sep-2026): el formato de lo
> copiado pasó a `file:///` (para que el navegador lo abra siempre como carpeta, nunca como una
> búsqueda en Bing), sin ruta apuntada ya no se copia el nombre suelto, y el mismo botón salió
> también en los cuadros de Correo y de Séneca.

## 1. Por qué no es «un botón que abra la carpeta»

Francisco pidió un botón que llevara directamente a la carpeta del asunto en su ordenador. **El
navegador no lo permite**, y eso ya estaba en la lista de descartado («abrir la carpeta del
asunto en el explorador de archivos»). Esa línea se queda como está.

Lo acordado el 23-sep-2026 es lo que sí se puede: **copiar la ruta**, para pegarla en el
explorador de archivos.

## 2. El problema de fondo

La aplicación trabaja con manejadores de carpeta del navegador, que **no dan la ruta de verdad**:
solo el nombre de la carpeta. Así que la parte de delante la tiene que decir Francisco una vez.

## 3. Lo que hay que hacer

### 3.1 Dónde se apunta la ruta

En **Ajustes → El centro**, un campo nuevo: «Ruta de la carpeta de asuntos abiertos en este
ordenador», con un ejemplo debajo (`C:\Users\nombre\Dropbox\...\ASUNTOS ABIERTOS`). Y otro para
la del ARCHIVO.

**Se guarda en este ordenador, no en `_GESTOR`** (`localStorage`, como el filtro de «Qué me
toca»): la ruta del ordenador de Francisco no es la de su compañero, y compartirla les daría a
los dos una ruta que no existe. Dejarlo dicho en el propio campo, en gris.

### 3.2 El botón

En la ficha del asunto, en la fila de copiar de un gesto (`js/ficha-nombre-acciones.js`,
`ponerFilaDeCopiar`), detrás de «Asunto»: **«Ruta»**. Reutiliza `Copiar.boton`, con el mismo
aviso «Copiado» de siempre.

Qué copia:

- Asunto abierto: la ruta apuntada + el nombre de la carpeta del asunto.
- Asunto archivado: la ruta del ARCHIVO + categoría + tercero + nombre de la carpeta (lo que ya
  sabe `IndiceArchivo.resolverHandle` a partir de `categoria`, `tercero`, `ruta` y `sueltoEn`).
- Se une con la barra que toque según la ruta apuntada: `\` si empieza por una letra de unidad o
  por `\\`, `/` en los demás casos.

Sin ruta apuntada, el botón copia solo el nombre de la carpeta y deja un aviso de una línea:
«Apunta la ruta de tus carpetas en Ajustes → El centro para copiarla entera.» El botón nunca
desaparece ni se apaga.

En modo consulta (el compañero tiene el mando) el botón sigue activo: copiar no cambia nada
(`esControlDeSoloLectura`, igual que el resto de la fila de copiar).

## 4. Cómo se comprueba

`pruebas/copiar-ruta.mjs` (nueva): con ruta de Windows y con ruta estilo Linux; un asunto abierto
y uno archivado; y sin ruta apuntada, que copia el nombre y avisa.

Sube a `main` sin abrir ninguna petición de cambios.
