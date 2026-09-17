# Filas que no se estrujan, y ancho bien aprovechado

Acordado con Francisco el 17-sep-2026, a partir de una captura suya.

**Sube directamente a `main`, sin abrir ninguna pull request.** Cambios quirúrgicos: no
reescribas ficheros enteros, no leas el repositorio entero, y pasa la batería de pruebas **una
sola vez, al final**.

## 1. El fallo

En la ficha de un asunto, la fila de un documento es:

    [ PDF  nombre del documento ][Copiar][Separar][Unir][Sacar páginas][Borrar]

Todo en una línea. Los botones no se parten ni se encogen; el nombre es el único que cede. Con
el panel de la derecha abierto (o en una ventana pequeña) el nombre acaba a **un carácter por
renglón**, ilegible, y la fila mide medio metro de alto.

La aplicación sabe recolocarse a nivel de pantalla (`css/vista.css`, con `@container`), pero
**no a nivel de fila**. El mismo patrón se repite en muchos sitios.

## 2. La regla general que hay que implantar

Vale para toda la aplicación:

1. **El texto nunca se estruja.** La parte de texto de una fila tiene un ancho mínimo por
   debajo del cual ya no cede.
2. **Si no cabe todo, los botones bajan a una segunda línea**, alineados a la derecha. La fila
   envuelve; no desborda ni aplasta el nombre.
3. **Una fila con más de dos botones deja a la vista los dos importantes y mete el resto tras
   un botón de tres puntos.**

## 3. Qué hay que hacer

### 3.1 Fichero nuevo `css/filas.css`

Enlázalo en `index.html` **el último de todos los `<link>`**, para que gane a las reglas de
módulo que ya existen.

Dentro, la regla de arriba escrita una sola vez y aplicada a las filas que hoy tienen el
problema. El patrón:

```css
.ficha-documento-fila {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
}
.ficha-documento-fila > .ficha-documento {
  flex: 1 1 260px; min-width: 240px;      /* no baja de aquí: nunca un carácter por línea */
}
.ficha-documento-fila > .boton,
.ficha-documento-fila > .marca-sin-registrar { flex: 0 0 auto; }
```

Busca con `grep` las demás filas con el mismo patrón (texto + botones en línea) y dales el
mismo tratamiento, sin inventar clases nuevas donde ya hay una:

- los documentos de la ficha (`.ficha-documento-fila`, `js/ficha-documentos.js`),
- las tarjetas de "Por clasificar" (`js/documentos-sueltos.js`),
- los relacionados (`css/relacionados.css`),
- los hitos (`css/hitos.css`),
- la rejilla de tipos y las listas de Ajustes (`css/ajustes.css`),
- la lista de personas (`#lista-personas`).

Si alguna de esas filas ya envuelve bien, déjala como está y dilo en la fila de la cola.

### 3.2 Los tres puntos: `U.menuDeAcciones` en `js/util.js`

Función nueva, compartida:

    U.menuDeAcciones(botones, opciones)

- `botones`: lista de elementos `<button>` ya montados (los que hoy se cuelgan de la fila).
- Devuelve un `<button>` con el icono de tres puntos que, al pulsarlo, despliega esos botones
  en una lista pequeña debajo, anclada a él.
- Se cierra al elegir uno, al pulsar fuera y con Escape.
- **No abre un cuadro de diálogo**: es un desplegable propio. La regla de "un solo cuadro a la
  vez" (`U.preguntar`) sigue intacta.
- Su CSS va en `css/filas.css`.

**Trampa conocida (fila 31 de la cola):** `aplicarModoConsulta` en `js/ficha-asunto.js`
reactiva sin preguntar todo lo que tenga `disabled` dentro de `#ficha-asunto-cuerpo`. El botón
de tres puntos tiene que apagarse por el camino de siempre (que lo alcance el recorrido de
`aplicarModoConsulta`), y los botones que viven dentro del menú no pueden quedarse encendidos
si el asunto está en modo consulta.

### 3.3 Dónde se usa el menú

En `js/ficha-documentos.js` (`filaDeDocumento`): a la vista se quedan el nombre del documento y
**Registrar** (cuando sale). Dentro del menú, en este orden: **Copiar, Separar, Unir, Sacar
páginas, Borrar**. Ojo: el botón "Copiar" no se monta ahí, lo añade `js/copiar.js` envolviendo
la fila; que siga funcionando, entrando en el menú como los demás.

En `js/documentos-sueltos.js`, las tarjetas de "Por clasificar" tienen tres botones (Crear
asunto con él, Meter en un asunto, Borrar) y los mismos tres de PDF: deja a la vista "Crear
asunto con él" y "Meter en un asunto", y el resto al menú. Recuerda que esa misma tarjeta se
reutiliza dentro del visor (`App.accionesDeSuelto`, fila 25): tiene que seguir saliendo bien
ahí, que es donde menos sitio hay.

### 3.4 La barra azul se pliega sola al abrir un documento

Hoy, con la barra abierta y el panel de la derecha abierto, la zona de trabajo se queda en
nada.

En `js/barra.js`, vigila las clases de `<body>` con un `MutationObserver`:

- Aparece `con-visor` o `con-lector` y la barra está abierta → plegarla, **sin tocar lo
  guardado en `localStorage`**.
- Desaparecen las dos → volver a como estaba (`poner(comoEstaba())`).

Que no se dispare en bucle: si la barra ya está plegada, no hagas nada.

### 3.5 El tope de ancho que sobra

En `css/barra.css`:

    #aplicacion.barra-plegada .contenido { max-width: 1360px; margin-left: 52px; }

Ese `max-width` gana en especificidad al `max-width: none` de `css/vista.css`, así que con la
barra plegada —que es como nace— el contenido se queda en 1360 píxeles y en el monitor ancho
del trabajo deja franjas vacías a los lados. **Quita el `max-width`, deja el `margin-left`.**

## 4. Ficheros que hay que tocar

- `css/filas.css` (nuevo)
- `index.html` (el `<link>` nuevo, el último)
- `js/util.js` (`U.menuDeAcciones`)
- `js/ficha-documentos.js`
- `js/documentos-sueltos.js`
- `js/barra.js`
- `css/barra.css`
- `pruebas/filas-estrechas.mjs` (nuevo)

No toques `apps-script/gestor-correos.gs`. No toques la lógica de ningún módulo: esto es
colocación en pantalla.

## 5. La prueba

`pruebas/filas-estrechas.mjs`, en navegador de verdad (como `pruebas/quedarse-en-el-asunto.mjs`):

1. Con la ventana estrecha, la fila de un documento con nombre largo **envuelve**: el botón del
   nombre mide más de 200 píxeles de ancho y la fila no pasa de dos líneas de alto.
2. El menú de tres puntos abre, ofrece Borrar, y al elegirlo se llama a lo mismo que antes.
3. Al abrir el visor con la barra abierta, la barra se pliega; al cerrarlo, vuelve a abrirse.
4. Con la barra plegada, `.contenido` no tiene tope de ancho.

Comprueba que la 1 falla sin el arreglo.

## 6. Al terminar

Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**, apunta
lo que merezca recordarse en `docs/HISTORIA.md`, marca la fila de `docs/COLA.md` como HECHA con
la versión publicada, y comprueba lo publicado con `curl`.
