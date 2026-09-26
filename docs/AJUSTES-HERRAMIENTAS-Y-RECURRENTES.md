# Ajustes › Herramientas, y el tercero de un recurrente con buscador (fila 182)

Acordado con Francisco el 26-sep-2026. Diseño cerrado. Cuarta y última parte de la «tanda 3».
**Va después de la fila 181.** Palabras de `docs/VOCABULARIO.md`.

## Ficheros que se tocan

- `index.html` (`#pestanas-ajustes` y una pestaña nueva `#ajustes-tab-herramientas`)
- `js/ajustes.js` (la pestaña nueva y cuál se abre al entrar)
- `js/ajustes-plegado.js` (orden de los bloques)
- `js/papelera-ajustes.js`, `js/alumnado-bd.js`, `js/tablas-datos-pantalla.js`, `js/copias.js` o
  quien pinte «Copias de seguridad» (mover sus bloques)
- `js/avisos-linea.js` (fila 178) y los que lleven a la papelera o a «Traer el alumnado» desde un
  aviso: que apunten a la pestaña nueva
- `js/recurrentes.js` (el tercero con buscador)
- Las pruebas de `pruebas/` que abran esos bloques en su pestaña vieja

No leas el repositorio entero. Cambios quirúrgicos.

## Qué hay que hacer

### 1. Pestaña «Herramientas», la primera de Ajustes

- Pestañas de Ajustes en este orden: **Herramientas · Tipos de asunto · El centro ·
  Mantenimiento**.
- En Herramientas, plegados como el resto de Ajustes y con su resumen, estos cuatro bloques
  (se **mueven**, no se copian; el contenido y los botones no cambian):
  1. **Papelera** (con su buscador de la fila 172).
  2. **Traer el alumnado** (hoy en Mantenimiento, lo pinta `js/alumnado-bd.js`).
  3. **Tablas de datos** (hoy en Mantenimiento).
  4. **Copias de seguridad** (hoy en Mantenimiento), con «Restaurar…».
- Al entrar en Ajustes se abre la última pestaña usada (como hoy, `gestor-ajustes-pestana`); si
  no hay ninguna recordada, **Herramientas**.
- Todo enlace o aviso que hoy lleve a la papelera, a «Traer el alumnado», a las tablas o a las
  copias, lleva a la pestaña nueva con ese bloque abierto.
- De paso, en El centro: juntar «Caducidad de las copias de seguridad» dentro del bloque de copias
  de Herramientas (es su ajuste), y «Asuntos dormidos» junto a «Avisos de vencimiento» (los dos son
  «a partir de cuántos días avisar»), en El centro. «Avisos de vencimiento» sigue siendo de este
  ordenador y lo dice.

### 2. El tercero de un asunto que se repite, con buscador

En el cuadro «Asunto que se repite» (`js/recurrentes.js`, hoy el campo «Tercero» es texto libre
«Tal cual va al final del nombre»): usar el buscador de tercero reutilizable
(`App.pintarBuscadorDeTercero`, `js/asuntos-nuevo-alta.js`), limitado a la categoría del tipo.
Se guarda el texto del tercero exactamente como hoy (el que resulta de `App.textoTercero`), así
que los recurrentes que ya existen siguen valiendo. Al cambiar uno que ya existe, se ve el
tercero guardado y un botón «Cambiar» que abre el buscador.

## Prueba

Una prueba nueva en `pruebas/` (navegador): Ajustes abre en Herramientas la primera vez, con los
cuatro bloques; la papelera sigue devolviendo; el recurrente se crea eligiendo al tercero con el
buscador y guarda el mismo texto que hoy. Y `npm test` entero en verde.

## Al terminar

Reglas de siempre de `docs/COLA.md`. Poner al día la línea de Ajustes de `docs/CONTEXTO-CORTO.md`
y lo que toque de `docs/contexto/ASUNTOS-ARCHIVO.md` (papelera). Entrada en `docs/HISTORIA.md`.
