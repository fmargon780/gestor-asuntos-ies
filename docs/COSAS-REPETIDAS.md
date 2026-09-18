# Fila 71 — Las cosas repetidas, a la caja común

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 3.1.

Fila de limpieza. Ninguna pantalla cambia.

---

## 1. Qué pasa hoy

Contado, no estimado:

| Qué se repite | Cuántas veces | Dónde |
|---|---|---|
| Copiar algo al portapapeles | **12** | `asuntos-lista`, `asuntos-nuevo`, `copiar`, `correo-cuadro`, `documentos`, `ficha-tercero`, `lector`, `plantillas-documento`, `relacionados`, `seneca-ayudante`, `seneca-cuadro`, `seneca-destinatarios` |
| Inventar un identificador nuevo | **5** | `grupos`, `guias-requisitos`, `guias`, `hitos`, `papelera` |
| Escribir una fecha corta | **4** | `bandeja-adjuntos-lector`, `documentos-sueltos-lector`, `hitos-archivo`, `lo-pide` |
| Buscar un elemento por su nombre | **39** | casi todos |

`js/util.js` comparte 21 utilidades. Ninguna de estas cuatro está entre ellas, así que cada fichero
se lo ha montado por su cuenta.

Consecuencia visible: hay **ocho sitios** que escriben "Copiado" en un botón y lo vuelven a cambiar
después de un rato, cada uno con su propio cronómetro y su propio retardo (1.200 ms en uno, 1.400 en
otro). Se nota: el mismo gesto se comporta distinto según el botón.

## 2. Qué hay que hacer

Cuatro utilidades en `js/util.js`, y que todos tiren de ahí.

### 2.1 Copiar — lo que más rinde

`U.copiar(texto, boton)`:

- copia al portapapeles,
- si se le pasa un botón, le pone "Copiado" y lo devuelve a su texto al cabo de **1.400 ms**, el
  retardo que usan la mayoría,
- si el navegador no deja copiar, avisa en vez de quedarse callado. **Esto hoy no lo hace casi
  ninguna de las doce**, y es un fallo de verdad, no solo repetición.

Pasar las doce. Ojo con tres casos que no son iguales:

- `js/seneca-ayudante.js` — el código que copia va **dentro del texto del marcador**, en una cadena
  que se ejecuta en la página de Séneca. Ahí no existe `U`. **Se queda como está.**
- `js/seneca-destinatarios.js` — "Copiar el siguiente" avanza por una lista; el texto del botón no
  vuelve al de antes, cambia al siguiente. Adaptarlo, no forzarlo.
- `js/copiar.js` — es el módulo de los botones de copiar de las tarjetas. Ahí conviene que use
  `U.copiar` por dentro y que no cambie nada de lo que expone.

### 2.2 Identificadores

`U.nuevoId(prefijo)`, con la forma que ya usan los cinco: la letra o letras del módulo, más la hora
en base 36, más unas cuantas letras al azar. Pasar los cinco, cada uno con su prefijo de siempre
(`g` para grupos, `h` para hitos…), **sin cambiar el formato**: hay identificadores guardados en
`_GESTOR` y tienen que seguir valiendo.

### 2.3 Fecha corta

`U.fechaCorta(fecha)`. Antes de unificar, **mirar si las cuatro escriben la fecha igual**. Si alguna
lo hace distinto a propósito, se deja como está y se anota por qué en un comentario. Unificar por
unificar y cambiar lo que se ve en pantalla sería peor que la repetición.

### 2.4 El buscador de elementos

Las 39 copias de la línea que busca un elemento por su nombre. Esta es la menos importante de las
cuatro: es una línea, no hace daño, y cada módulo la tiene dentro de su propia función anónima por
un motivo razonable.

**Recomiendo dejarla.** Si se toca, que sea solo añadiendo `U.$` para los módulos nuevos, sin ir a
cambiar los 39.

## 3. Cómo se comprueba

Aquí no hay pantalla nueva que probar: lo que hay que demostrar es que **nada ha cambiado**.

1. `npm test` entero en verde. Es la comprobación principal.
2. Prueba nueva, `pruebas/utilidades-comunes.mjs`, sin navegador: que `U.copiar` copia, que pone y
   quita el "Copiado", y que avisa si el navegador no deja; que `U.nuevoId` no repite en 10.000
   tiradas y respeta el prefijo.
3. A mano en el navegador, los botones de copiar de: la tarjeta de un asunto, la ficha del tercero,
   la fila de copiar bajo el nombre (fila 58), el cuadro de Séneca y el de Correo.

## 4. Qué NO hay que hacer

- **No** cambiar el formato de los identificadores. Hay datos guardados con el formato de hoy.
- **No** tocar el código del marcador de Séneca.
- **No** aprovechar para arreglar otras cosas que se vean de paso. Si se ve algo, se apunta.
- **No** ir a por las 39 copias del buscador de elementos.

## 5. Cuándo hacerla

Es la fila menos urgente de la cola. **No corre ninguna prisa.**

Si al hacer otra fila ya se están tocando esos ficheros, se aprovecha y se hace ahí la parte que
toque. Si no, se hace entera cuando no haya nada mejor que hacer.

## 6. Cuánto es

Medio día.
