# Fila 240 — Botón de soporte: texto sin límite y cuadro grande con guion

Diseñada con Francisco en Cowork el 30-sep-2026. Diseño cerrado por él.

## Por qué

El botón «Soporte» lo van a usar personas muy técnicas, con mucha capacidad de describir y
analizar. Cuanta más información manden, mejor se diseña después la tarea. Hoy el cuadro corta en
5.000 caracteres y abre con solo 5 renglones: invita a escribir poco. Francisco quiere lo
contrario: un cuadro atractivo para escribir en él y explicar todos los aspectos y posibilidades
de la idea.

## Qué hay que hacer

### 1. Sin límite de tamaño del texto

- `js/soporte.js`: quitar `maxLength` del `textarea` y el `texto.slice(0, MAX_TEXTO)` al enviar.
  Quitar `MAX_TEXTO` si ya no se usa.
- `apps-script/soporte.gs`: quitar la comprobación `d.texto.length > MAX_TEXTO` (y la constante).
  Queda como único tope el del mensaje entero, `MAX_CUERPO` (6 millones de caracteres), que en la
  práctica no se alcanza con texto. Si el mensaje entero pasa de ese tope, el aviso que ve el
  usuario tiene que decirlo en llano y **el texto se queda en la ventana** (como ya pasa hoy con
  cualquier fallo al enviar).
- Comprobar que el `.txt` de Drive guarda el texto entero, sin cortes, y que la fila IDEA de
  `docs/COLA.md` sigue sin llevar el texto del usuario (el repositorio es público).
- Sube `VERSION_SCRIPT` de `soporte.gs` («… · fila 240»).

### 2. Cuadro grande, que crece al escribir

- `css/soporte.css` y `js/soporte.js`: la ventana de soporte más ancha (que aproveche la pantalla:
  hasta unos 900 px, o casi todo el ancho en pantallas pequeñas).
- El cuadro de texto abre alto (unos 14 renglones) y crece solo mientras se escribe, hasta ocupar
  casi toda la altura de la ventana; a partir de ahí, barra de desplazamiento dentro del cuadro.
  Los botones «Enviar», el nombre y la zona de captura siguen siempre a la vista, sin tener que
  bajar.
- Letra cómoda para textos largos (la del resto de campos de la app, con interlineado algo mayor).

### 3. Guion gris dentro del cuadro

Sustituir el texto de ayuda actual por un guion de varias líneas (texto gris que desaparece al
empezar a escribir). No obliga a nada; solo sugiere qué contar:

```
Cuéntalo con todo el detalle que quieras; no hay límite de tamaño. Te sugerimos:

· Qué pasa o qué propones
· En qué pantalla o en qué paso
· Qué esperabas que pasara, o cómo lo harías tú
· Casos y ejemplos concretos
· Otras posibilidades o variantes que se te ocurran
```

- Añadir debajo del cuadro, en letra pequeña, un contador discreto: «N palabras». Sin tope.

## Pruebas

- Poner al día `pruebas/soporte.mjs` y `pruebas/soporte-script.mjs`: un texto de 50.000
  caracteres se envía y se guarda entero; ya no existe el error «El texto es demasiado largo»; el
  guion sale como texto de ayuda; el cuadro crece al escribir.

## Lo que tiene que hacer Francisco

El `soporte.gs` no se publica solo. Al terminar, en la entrega, dile en una sola línea que tiene
que pegar `apps-script/soporte.gs` entero en el proyecto «Gestor - Soporte» de
https://script.google.com y guardar (pasos en `docs/PONER-EN-MARCHA-SOPORTE.md`). Hasta que lo
pegue, el servidor seguirá rechazando textos de más de 5.000 caracteres («El texto es demasiado
largo»); el texto no se pierde porque se queda en la ventana.
