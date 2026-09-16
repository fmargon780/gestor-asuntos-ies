# Instrucción: plantillas de correo y de mensaje de Séneca

Acordada con Francisco el 16 de septiembre de 2026. Fila 14 de `docs/COLA.md`.
Es el punto 6 de `docs/PROXIMOS-ASUNTOS.md`.

**Sube directamente a `main`. No abras ninguna pull request.**
**No leas el repositorio entero.** Baja solo los ficheros de la lista de abajo.
**Cambios quirúrgicos.** No reescribas ficheros enteros.
**Una sola pasada de pruebas al final**, no una comprobación después de cada cambio.

---

## 1. Qué pasa hoy, y qué falla

El cuadro "Correo" (`js/correo.js`) deja hecho el saludo y la firma, y el medio en blanco: el
texto se escribe entero cada vez, y los mismos correos se repiten todo el curso.

Además, la firma está escrita dentro del código (`'Un saludo.'`, `App.E.usuario`, la constante
`CENTRO`). Si cambia el centro o la forma de firmar, hay que tocar el programa.

## 2. Qué hay que construir

Decidido con Francisco:

- La plantilla va **pegada al tipo de asunto**. Al abrir el cuadro de Correo aparece ya escrita.
- **La misma plantilla sirve para el correo y para el mensaje de Séneca.** No hay plantillas
  aparte para Séneca.
- La plantilla es **solo el cuerpo del medio**. El saludo y la firma se siguen poniendo solos.
- Las plantillas se crean en **Ajustes**, como los tipos y los estados, y se comparten con el
  compañero.
- El asunto del correo no cambia: sigue siendo el nombre de la carpeta, con su botón de versión
  legible.

### 2.1 Dónde se guardan

Fichero nuevo `_GESTOR/plantillas.json`, junto a los demás compartidos:

```
{
  "firma": "Un saludo.\n{usuario}\n{centro}",
  "centro": "IES Fuente Lucena",
  "lista": [
    { "id": "pl-1", "tipo": "SANCION", "categoria": "ALUMNADO",
      "nombre": "Aviso de inicio", "texto": "Les comunico que …" }
  ]
}
```

- `tipo` y `categoria`: a qué tipo de asunto pertenece. Un tipo puede tener varias plantillas.
- `firma` y `centro` salen de aquí, y **sustituyen** a lo que hoy está escrito en `js/correo.js`
  (la constante `CENTRO` y el texto de `cuerpoDelCorreo`). Si el fichero no existe, se usa lo de
  hoy como valor de partida y se crea al primer guardado.
- Antes de escribirlo, **reléelo**, y escribe con `Copias.guardar`, nunca con
  `Carpetas.guardarJson`. La fusión entre ordenadores va como en `tipos.json` y `estados.json`:
  se fusionan las altas; los borrados no (limitación ya conocida, no la arregles aquí).

### 2.2 Los huecos

Dentro del texto, entre llaves. Se rellenan al abrir el cuadro:

| Hueco | Qué pone |
|---|---|
| `{nombre}` | El tercero sin su número ni su NIF (lo que hoy hace `soloElNombre`) |
| `{grupo}` | El grupo del asunto (`1ºA`, `1ºBachA`) |
| `{curso}` | El año académico (`26-27`) |
| `{tipo}` | El tipo de asunto |
| `{hoy}` | La fecha de hoy, en 16/09/2026 |
| `{limite}` | La fecha límite del asunto, en 16/09/2026 |
| `{usuario}` | `App.E.usuario` |
| `{centro}` | El centro, de `plantillas.json` |
| `{campo:LO QUE SEA}` | Un campo propio del tipo, por su nombre (`js/campos.js`) |

Reglas:

- Un hueco sin valor se queda **vacío**, y encima del cuerpo sale una línea en ámbar: *"Faltan
  datos: grupo, fecha límite"*. Nunca se escribe `{grupo}` en el texto que va al tercero.
- Un hueco que no exista se deja tal cual y se avisa igual. Un hueco mal escrito no puede
  romper el cuadro.
- Las llaves se buscan sin distinguir mayúsculas ni acentos (`U.normalizar` para comparar, no
  para sustituir).

### 2.3 En el cuadro de Correo

Encima del cuerpo, un desplegable **"Plantilla"**:

- Si el tipo del asunto tiene una sola plantilla, sale puesta al abrir el cuadro.
- Si tiene varias, sale la primera y el desplegable deja cambiar.
- Si no tiene ninguna, el desplegable no se pinta y el cuerpo sale como hoy: saludo, hueco en
  blanco y firma.
- Primera opción del desplegable: **"Sin plantilla"**.
- Al cambiar de plantilla se reescribe el cuerpo. **Si ya había algo escrito a mano en el
  medio, se pregunta antes** (`U.preguntar`, un solo cuadro cada vez), porque se pierde.

En el cuadro de Séneca, el mismo desplegable y las mismas plantillas. Allí, si el texto pasa de
**4.000 letras**, se recorta al pegarlo y se dice en una línea que se ha recortado.

### 2.4 En Ajustes

Bloque nuevo **"Plantillas de correo"**, pintado desde `js/plantillas.js` —igual que hace
`js/bandeja-correos.js` con el suyo—. **No engordes `js/ajustes.js`**, que ya pasa de 47 KB.

Dentro:

- Las plantillas agrupadas por tipo de asunto, con el buscador cruzado que ya tienen los demás
  bloques de Ajustes.
- Alta, edición y borrado. El borrado va por la papelera, con el camino de siempre.
- Al escribir, una fila de botones que meten los huecos en el sitio del cursor, con su nombre en
  cristiano ("Nombre del tercero", "Grupo", "Fecha límite"…).
- Debajo, **vista previa** con un asunto de ejemplo: el primero que haya abierto de ese tipo, o
  datos de muestra si no hay ninguno.
- Aparte, un bloque pequeño **"Firma"**: el texto de la firma y el nombre del centro, que hasta
  hoy estaban dentro del código.

### 2.5 Lo que no se toca

- El asunto del correo ni sus dos botones.
- El rastro que queda en las notas del asunto, ni el botón de ponerlo a la espera del tercero.
- Las guías del procedimiento (`js/guias.js`): son otra cosa y no se mezclan.
- La bandeja de correos y la papelera.

## 3. Ficheros que hay que tocar

| Fichero | Qué |
|---|---|
| `js/plantillas.js` | **Nuevo.** Leer y guardar `plantillas.json`, rellenar los huecos, y el bloque de Ajustes con su vista previa |
| `js/correo.js` | Desplegable de plantilla en los dos cuadros; saludo, firma y centro sacados de `plantillas.json`; aviso de huecos sin datos; recorte en Séneca |
| `index.html` | Añadir `js/plantillas.js` **antes** de `js/correo.js` |
| `pruebas/plantillas.mjs` | **Nuevo.** Pruebas de la sección 4 |
| `docs/CONTEXTO-CORTO.md` | Sustituir la línea del correo y quitar de "Qué falta" lo de las plantillas y la firma escrita a mano. Máximo 160 líneas |
| `docs/CONTEXTO.md` | El detalle: `plantillas.json`, la tabla de huecos, el bloque de Ajustes |
| `docs/HISTORIA.md` | Anotar el cambio con su fecha |
| `docs/COLA.md` | Fila 14 a EN CURSO al empezar y a HECHA al terminar |

Comprueba que el nombre de cada función nueva de `App` no esté ya cogido. Ojo con el orden de
los `<script>` de `index.html`: `js/correo.js` envuelve `App.abrirFicha`, así que las
plantillas tienen que estar cargadas antes.

## 4. Pruebas

En `pruebas/plantillas.mjs`, con el mismo montaje de mentira que usan las demás. Cada prueba
debe fallar sin su cambio antes de darla por buena.

1. Un asunto de un tipo con una plantilla abre el cuadro con el cuerpo ya escrito, y los huecos
   sustituidos por los datos de ese asunto.
2. Un hueco sin valor sale vacío y aparece el aviso "Faltan datos: …".
3. Un tipo con dos plantillas enseña el desplegable, y cambiar de plantilla reescribe el cuerpo.
4. Si el medio está escrito a mano, cambiar de plantilla pregunta antes de pisarlo.
5. La firma sale de `plantillas.json`; si el fichero no existe, sale la de siempre y nada falla.
6. Un tipo sin plantillas se comporta exactamente como hoy: sin desplegable.
7. En el cuadro de Séneca, un texto de más de 4.000 letras se recorta y se avisa.

Levanta `python3 -m http.server 8123` y ejecuta las pruebas con Playwright usando
`executablePath '/opt/pw-browsers/chromium'`. No ejecutes `npx playwright install`.
No dejes el repositorio con las pruebas en rojo.

## 5. Al terminar

- Versión `App.VERSION` con fecha y hora de España.
- Comprueba con `curl` que `https://gestor-de-asuntos.vercel.app` sirve los ficheros nuevos,
  usando `?v=<algo distinto>`. No des la publicación por hecha.
- Actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea vieja**.
- Fila 14 de `docs/COLA.md` a HECHA, con fecha y versión.
- Mensaje corto para Francisco, en español, sin jerga: qué has hecho, qué versión está
  publicada, si las pruebas están en verde, y que las plantillas empiezan vacías: las escribe él
  en Ajustes, en "Plantillas de correo".
