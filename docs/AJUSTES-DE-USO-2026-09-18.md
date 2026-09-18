# Ajustes de uso — 18 de septiembre de 2026

Instrucción para Claude Code. Acordada con Francisco el 18-sep-2026, después de usar la
aplicación con trabajo real. Son seis arreglos de uso diario, independientes entre sí.

Lee antes `docs/CONTEXTO-CORTO.md` y, de `docs/CONTEXTO.md`, **solo los apartados de los
módulos que vas a tocar**. No leas el repositorio entero.

## Reglas de esta instrucción

- **Cambios quirúrgicos.** No reescribas ficheros enteros: toca lo justo de cada uno.
- **Sube directamente a `main`, sin abrir ninguna petición de cambios** (si la sesión es de las
  de la nube y no puede tocar `main`, pull request y fusionarlo tú mismo en verde).
- **Como máximo dos subidas** (regla 13 de la cola): una para marcar la fila EN CURSO y otra al
  terminar con todo dentro.
- **Una sola prueba al final**, no una comprobación después de cada punto.
- Cualquier fichero que pase de unas 400 líneas y haya que tocar mucho, pártelo en dos.
- `App.VERSION` con la hora de verdad (`TZ='Europe/Madrid' date`).

---

## 1. Copiar de un solo gesto: cuatro botones

**El problema.** El nombre del asunto es la referencia de todo: del correo, del mensaje de
Séneca y del registro. Hoy hay que abrir el menú de tres puntos para copiarlo. Lo mismo pasa
con los números del tercero, que Francisco pega una y otra vez en Séneca.

**Qué hacer.** En la ficha de un asunto, debajo del nombre (`<h2>`), una fila de botones
**siempre visible**, sin menú y sin desplegar nada:

| Botón | Qué copia |
|---|---|
| **Asunto** | El nombre completo de la carpeta, tal cual |
| **Nombre** | `Apellido1 Apellido2, Nombre` del tercero. En empresas, la razón social |
| **NIE** | El Nº de identificación escolar del alumno |
| **DNI** (o **CIF**) | El documento del tercero. En empresas el botón se llama CIF |

- Cada botón copia al portapapeles y avisa en verde, como ya hace `js/copiar.js`. Reutiliza esa
  función, no escribas otra.
- **Un botón que no tenga dato no se enseña.** Personal y empresas no tienen NIE. Un alumno sin
  documento no enseña DNI.
- El botón "Copiar el nombre" **se quita** del menú de tres puntos: ya está aquí. El icono de
  copiar el número que hoy está pegado al `<h2>` también se quita, para no tener dos caminos.
- La fila es discreta: botones pequeños, en una sola línea, que no roben altura a la ficha.
  Si no caben, que envuelvan; nunca que desaparezcan.

Ficheros de partida: `js/ficha-nombre-acciones.js`, `js/ficha-menus.js`, `js/ficha-asunto.js`,
`js/ficha-tercero.js` (de ahí salen nombre, NIE y documento), `js/copiar.js` y su CSS.

## 2. "Preparar el documento" pasa a llamarse "Ajustar tamaño"

El nombre de hoy no dice nada. Cambia el texto del botón y el título de su cuadro a **Ajustar
tamaño**, en los dos sitios donde sale: la ficha del asunto y "Por clasificar". Dentro del
cuadro, la explicación de siempre (deja libre la banda del sello y la de la firma) se queda.

No cambies nombres de ficheros ni de funciones: solo el texto que se ve.

Ficheros de partida: `js/preparar-documento.js`, `js/ficha-documentos.js`,
`js/documentos-sueltos.js`.

## 3. Las notas ya no se guardan solas mientras se escribe

**El problema.** Francisco escribe una nota y se guarda antes de que termine la frase.

**Qué hacer.** En las notas del asunto:

- Quita el guardado automático por tiempo mientras se escribe. Nada de guardar cada pocos
  segundos ni al teclear.
- La nota se guarda **solo** al pulsar *Guardar*, o al salir del recuadro (perder el foco) si
  hay algo escrito.
- Si se intenta cerrar la ficha o cambiar de pantalla con texto sin guardar, avisar: "Tienes una
  nota sin guardar", con *Guardar y salir* / *Salir sin guardar*.
- Lo escrito no se pierde con un repintado: sigue valiendo `U.conservandoLoEscrito`.

Ficheros de partida: `js/notas.js` (y donde se enganche en `js/ficha-asunto.js`).

## 4. Al registrar, el original sin sellar se conserva

**El problema.** Hoy, cuando la aplicación encuentra el PDF sellado en la carpeta, renombra y
manda el original a la papelera. Francisco quiere conservarlo: si el registro sale mal y hay que
repetirlo, no tiene que volver a escanear el documento.

**Qué hacer.** El original **no va a la papelera**. Se queda en la misma carpeta del asunto,
renombrado con `SIN SELLAR` al final del texto adicional de su nombre. Ejemplo:

    260918 SOLICITUD Beca comedor.pdf        →  260918 SOLICITUD Beca comedor SIN SELLAR.pdf
    260918 26EM0368 SOLICITUD Beca comedor.pdf  (el sellado, como hasta ahora)

- Si ya existiera un fichero con ese nombre, se numera `(2)`, como en el resto de la aplicación.
- La nota que se apunta en el asunto lo dice en una frase: se conserva el original sin sellar.
- En la lista de documentos de la ficha, el que lleva `SIN SELLAR` sale en gris claro, debajo de
  su sellado, para que no confunda.

Ficheros de partida: `js/registro-sellado.js`, `js/registro.js`, `js/ficha-documentos.js`.

## 5. El cuadro de Correo, que se vea entero

**El problema.** El cuadro es muy alto y estrecho: no se ve ni la cabecera ni los botones de
abajo. Y por eso Francisco no encuentra la lista de documentos del asunto para adjuntar — la
lista **ya existe** (`js/correo-adjuntos.js`), pero se le queda fuera de la pantalla.

**Qué hacer.** Rehacer la disposición del cuadro igual que se hizo con el de Séneca en la fila
53 (`js/seneca-cuadro.js` + `css/seneca.css`): mira cómo quedó y sigue el mismo patrón.

- Ancho: ocupa el ancho disponible hasta 1100 px.
- A partir de 900 px, **dos columnas**: a la izquierda destinatarios, asunto y los documentos
  que se adjuntan; a la derecha el texto del correo.
- Cabecera y botonera **fijas**: el botón de preparar el borrador se ve siempre, sin bajar.
  Solo el cuerpo se desplaza.
- La lista de documentos del asunto sale desplegada de partida, con una casilla por documento y
  su tamaño al lado. Es lo que se adjunta al borrador.
- Nada de funcionamiento nuevo: el borrador se sigue dejando en Gmail, la app no envía.

Ficheros de partida: `js/correo.js`, `js/correo-adjuntos.js` y su CSS. **Si `js/correo.js` pasa
de 400 líneas, saca el cuadro a un fichero propio** (`js/correo-cuadro.js` + `css/correo.css`),
como se hizo con Séneca.

## 6. Asociar un documento a un hito, desde el documento

**El problema.** Hoy solo se puede desde el hito, con "Apuntar un documento". Francisco no lo
encuentra y no ve qué documentos tiene cada hito.

**Qué hacer.**

- En la lista de documentos de la ficha, cada documento lleva **Asociar a un hito**: un menú con
  los hitos del asunto, y "Ninguno" para soltarlo. Usa el menú pequeño de `js/ficha-menus.js`.
- Un documento ya asociado enseña el nombre del hito en pequeño, debajo del suyo.
- En el panel de hitos, cada hito enseña debajo sus documentos apuntados, con su nombre. Al
  pulsarlos se abren en el panel de lectura, como en la lista de documentos.
- El dato es el mismo que ya guarda "Apuntar un documento": no inventes otro sitio donde
  guardarlo.

Ficheros de partida: `js/hitos-documentos.js`, `js/hitos-panel.js`, `js/hitos-panel-lista.js`,
`js/ficha-documentos.js`, `js/ficha-menus.js`.

---

## Pruebas

Una sola tanda al final, con `npm test` en verde. Añade lo justo:

- Los cuatro botones de copiar salen en la ficha, y no sale el que no tiene dato.
- Al registrar un documento sellado, el original sigue en la carpeta con `SIN SELLAR` y no está
  en la papelera.
- Una nota no se guarda al teclear; se guarda al pulsar Guardar.
- Asociar un documento a un hito desde la lista de documentos lo deja apuntado en ese hito.

## Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`, **sustituyendo la línea vieja**, no añadiendo
  otra debajo. `docs/HISTORIA.md`, una entrada con la fecha.
- Mensaje final a Francisco: tres o cuatro frases, qué va a ver distinto en pantalla.
