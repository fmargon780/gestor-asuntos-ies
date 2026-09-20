# Pulsar la tarjeta para abrir, y avisos que se pueden ocultar

Fila 86 de `docs/COLA.md`. Acordada con Francisco el 20-sep-2026, usando la aplicación con
trabajo real. Son dos cosas independientes y pequeñas, en una sola fila para gastar una sola
tanda de subidas (regla 13).

**Sube directamente a `main`, sin abrir ninguna petición de cambios.** Cambios quirúrgicos: no
reescribas ningún fichero entero, no hace falta partir ninguno, y **no leas el repositorio
entero** — solo los ficheros que se nombran aquí. Una sola pasada de pruebas al final.

---

## Parte 1. Pulsar sobre la tarjeta de un documento lo abre

### El problema, con sus palabras

> "Para abrir y visualizar un documento que esté en la bandeja Por Clasificar hay que dar a los 3
> puntitos e ir y pulsar la opción Abrir. Son varios clicks más de los necesarios. Con pulsar
> sobre la tarjeta del documento debería ser suficiente."

Y, al preguntarle si valía la pena hacerlo en toda la aplicación de una vez:

> "Si operativamente es mejor que cualquier documento desde cualquier lugar de la app pueda
> abrirse pulsando sobre su tarjeta, ahora sería el momento."

### La regla, para toda la aplicación

**Donde se enseñe un documento con su nombre, pulsar sobre él lo abre en el visor de la derecha
(`Visor.abrir`).** Sin pasar por ningún menú.

Dos condiciones que no se pueden romper:

1. **Pulsar un botón o un enlace de la fila no abre el documento.** Ni "Crear asunto con él", ni
   "Meter en un asunto", ni "Aceptar", ni "Dar de alta", ni "Registrar", ni el menú de tres
   puntos, ni nada que se añada en el futuro. La forma de conseguirlo es una sola comprobación en
   el `onclick` de la tarjeta:

   ```js
   if (ev.target.closest('button, a, input, select, textarea, label, .acciones')) return;
   ```

   Es preferible a ir poniendo `stopPropagation()` botón a botón: los botones los ponen varios
   ficheros por envoltura (`js/papelera.js`, `js/documentos-sueltos-lector.js`) y cualquiera nuevo
   quedaría cubierto solo.
2. **Nada de dobles aperturas.** Si una fila ya abre el documento al pulsar su nombre, no se le
   añade nada: se deja como está.

### Dónde hay que tocar

Empieza por comprobar, con `grep`, cuáles de estos sitios pintan una lista de documentos y qué
hace hoy cada uno al pulsar. Solo se toca el que no cumpla la regla.

| Fichero | Qué lista es | Lo que se sabe hoy |
|---|---|---|
| `js/documentos-sueltos.js` | "Por clasificar" | **Hay que cambiarlo.** `App.tarjetaSuelto` no tiene `onclick` en el `div` de la tarjeta; "Abrir" vive dentro del menú de tres puntos y llama a `App.abrirSuelto(s)`, que ya es el visor con su marcador. Basta con colgar ese mismo `App.abrirSuelto(s)` del `div`, con la comprobación de arriba |
| `js/ficha-documentos.js` | Documentos de un asunto abierto | **Ya cumple**: `filaDeDocumento` pinta el nombre como un `<button class="ficha-documento">` que llama a `abrirDocumento(f)`. No tocar |
| `js/papelera.js` | Lo que hay en la papelera | Comprobar. Si un documento de la papelera se puede enseñar en el visor sin sacarlo de la papelera, que pulsar su fila lo enseñe. Si el fichero ya no está accesible por un `handle`, no se toca y se anota en `docs/HISTORIA.md` por qué |
| `js/ficha-archivo.js` | Documentos de un asunto archivado | Comprobar y, si hace falta, igualar a `js/ficha-documentos.js` |
| `js/documentos.js` | Cuadro "Documentos ▾" (nombrar y archivar) | Comprobar e igualar |
| `js/bandeja-correos.js` | Correos y adjuntos de la bandeja de Gmail | Comprobar. Los adjuntos que ya están en disco se abren en el visor; lo que sea un correo sin descargar se queda como está |
| `js/duplicados.js` | Asuntos duplicados | Solo si enseña documentos. Si son carpetas, no se toca |

Si encuentras alguna otra lista de documentos que no esté en esta tabla, aplícale la misma regla
y apúntala en `docs/HISTORIA.md`.

### Que se vea que se puede pulsar

- En la tarjeta de "Por clasificar": `cursor: pointer`, un realce suave al pasar por encima (el
  mismo que ya usen las filas pulsables de la aplicación, no uno nuevo) y `title` con **"Pulsa
  para verlo al lado del programa"**.
- El estilo va en el CSS donde ya viva `.tarjeta-suelto` (búscalo con `grep`, probablemente
  `css/filas.css` o `css/estilos.css`). No crear un fichero CSS nuevo para esto.
- El realce al pasar por encima no se aplica sobre los botones de la propia fila.

### Lo que no cambia

- El botón "Abrir" se queda dentro del menú de tres puntos, tal cual.
- El panel del visor sigue quitando "Abrir" de sus acciones (`App.accionesDeSuelto`), porque ahí
  el documento ya se está viendo.
- La marca de la tarjeta que se está viendo (`tarjeta-abierta`) sigue funcionando igual.

---

## Parte 2. El aviso de fichas sin carpeta se puede ocultar

### El problema, con sus palabras

> "El aviso sobre las carpetas sin fichas ahora mismo está fijo. Deberíamos poder ocultarlo, si
> no pretendemos trabajar en ese asunto en ese momento."

Es el aviso ámbar `panel-huerfanas` de la pantalla de Asuntos abiertos, que pinta
`js/avisos-que-faltan.js`.

### Lo acordado

- A la derecha del aviso, después del botón "Verlas", una **✕** con `title` **"Ocultar este aviso
  durante 7 días"**.
- Al pulsarla, el aviso desaparece de la pantalla en el momento y **no vuelve a salir durante 7
  días**.
- **Vuelve antes de los 7 días si aparecen más fichas sin carpeta que las que había al
  ocultarlo.** Es decir: se guarda también cuántas eran, y si el número de ahora es mayor, el
  aviso se pinta otra vez y el silencio se termina.
- Pasados los 7 días, vuelve a salir solo.
- Se guarda en el navegador (`localStorage`), no en `_GESTOR`: es una preferencia del momento de
  quien está delante, no un dato del centro. Que cada ordenador lo lleve por su cuenta es lo
  correcto aquí. Como cualquier otro uso de `localStorage` en esta aplicación, dentro de
  `try/catch`: si el navegador no lo deja, el aviso sale siempre y no pasa nada.
- Clave: `aviso-huerfanas-callado`, con el momento hasta el que está callado y cuántas fichas
  había. Un valor ilegible o corrupto se ignora, y el aviso sale.

### Lo que no se toca

- **El aviso de la papelera vieja (`panel-papelera-vieja`) se queda como está, sin ✕.** Lo dice
  su propio comentario en el fichero, y sigue siendo lo correcto: la única salida de ahí es
  decidir, porque son datos de menores.
- El botón "Verlas" y el salto a Ajustes → Mantenimiento no cambian.
- `js/fichas-huerfanas.js` no se toca: el cálculo sigue donde está.

### Cómo dejarlo probado

La decisión de si el aviso se pinta o no tiene que salir de una función sin pantalla, que reciba
el número de fichas de ahora y lo guardado, y devuelva sí o no. Exponla junto a las que ya hay
para pruebas en `window.AvisosQueFaltan` y pruébala en `pruebas/avisos-que-faltan.mjs`: recién
ocultado no sale; a los 3 días no sale; a los 8 días sale; con una ficha más sale; sin nada
guardado sale.

---

## Ficheros

**Seguro:**

- `js/documentos-sueltos.js` (parte 1)
- `js/avisos-que-faltan.js` (parte 2)
- el CSS donde viva `.tarjeta-suelto` (parte 1)
- `pruebas/documentos-sueltos.mjs` — **ojo**: comprueba la lista fija de botones de la tarjeta.
  Ampliarla para el clic nuevo, sin romper lo que ya comprueba.
- `pruebas/avisos-que-faltan.mjs`
- `js/version.js` (la hora, del reloj de verdad: `TZ='Europe/Madrid' date`)

**Según lo que encuentres al comprobar la tabla de la parte 1:** `js/papelera.js`,
`js/ficha-archivo.js`, `js/documentos.js`, `js/bandeja-correos.js`, `js/duplicados.js`.

**Al terminar:** `docs/COLA.md` (fila 86 HECHA), `docs/CONTEXTO-CORTO.md` y el hijo de
`docs/contexto/` que toque (sustituyendo la línea vieja, no añadiendo una debajo), y
`docs/HISTORIA.md`.

## Lo que Francisco va a ver distinto

1. En "Por clasificar", pulsa el nombre de un documento —o el hueco de su tarjeta— y el documento
   sale a la derecha. Los botones de la tarjeta siguen haciendo lo suyo.
2. Lo mismo en cualquier otra lista de documentos de la aplicación.
3. El aviso de fichas sin carpeta tiene una ✕ que lo calla una semana.
