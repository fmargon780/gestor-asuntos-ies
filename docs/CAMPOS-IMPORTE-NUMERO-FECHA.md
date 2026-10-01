# Campos de clase Importe, Número y Fecha (fila 244)

Diseñado con Francisco el 1-oct-2026 en Cowork, a partir de su aviso de soporte (fila 244):
https://drive.google.com/file/d/16f35pXwBGSFUtf3epTcps7MgaCE1osQU/view?usp=drivesdk

## Qué quiere Francisco

Al crear un campo propio de un tipo de asunto (Ajustes → la pantalla del tipo → «+ Añadir campo»
→ «Míos»), el desplegable «Clase» solo ofrece «Texto libre» y «Lista cerrada». Quiere poder decir
que un campo es un **importe en euros**. De paso se añaden **Número** y **Fecha**. Y se podrá
**cambiar la clase** de un campo ya creado.

## Antes de empezar

- Lee `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md` (campos de cada tipo de asunto) y,
  para el exportar, `docs/EXPORTAR-ASUNTOS.md`. **No leas el repositorio entero.**
- **Depende de la fila 245** (`docs/CAMPO-DESDE-EL-ASUNTO.md`), que toca también
  `js/campos-catalogo.js`. Trabaja sobre `main` con la 245 ya fusionada; si sigue EN CURSO, esta
  fila espera (regla 0 de la cola). Las clases nuevas tienen que valer también en los campos
  «solo aquí» de la 245.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (añade allí «Importe en euros»,
  «Número» y «Fecha» si no están).
- Cambios quirúrgicos. Nada de reescribir módulos ni envolver (`docs/CONTEXTO-CORTO.md`, §6).
- Método de la fila 242 (`docs/REVISOR-EN-LOCAL.md`): rama `fila-244`, revisor en local, y solo
  con su APROBADA a `main`. Una sola publicación de código.

## 1. Las clases nuevas

En el desplegable «Clase» del formulario de campo propio (`js/campos-catalogo.js`,
`abrirFormularioPropio`), por este orden: **Texto libre · Lista cerrada · Importe en euros ·
Número · Fecha**. Valores internos: `texto`, `lista`, `importe`, `numero`, `fecha`.
`Campos` (`js/campos.js`, normalización de `propios`, hoy en torno a las líneas 105 y 151) deja de
reducir a `texto` todo lo que no sea `lista`: acepta las cinco.

- **Importe en euros**: solo números; acepta coma o punto como separador decimal y el signo menos
  (**negativos permitidos**: devoluciones, rectificativas). Se guarda como número con dos
  decimales y se ve siempre `1.234,56 €` (punto de miles, coma decimal, dos decimales, espacio y €).
- **Número**: solo números, con decimales y negativos. Se ve con punto de miles y coma decimal,
  sin ceros de sobra (`1.234,5`; `12`).
- **Fecha**: se elige con el calendario del navegador (`<input type="date">`). Se guarda en
  `AAAA-MM-DD` y se ve `01/10/2026`.
- **Vacío permitido** en las tres, como en los demás campos (salvo que el campo sea
  «Obligatorio» en el tipo, que ya funciona igual que hoy).

Una función pura en `js/campos.js` (por ejemplo `Campos.leerValor(clase, texto)` y
`Campos.mostrarValor(clase, valor)`) para entender lo escrito y para enseñarlo. La usan todos los
sitios de abajo; nadie formatea por su cuenta.

## 2. Dónde se escribe el valor

En todos los sitios donde hoy se pinta el control de un campo propio según su clase (hoy solo
distinguen `lista`): **Nuevo asunto** (`js/asuntos-nuevo-campos.js`), **Cambiar el asunto**
(`js/asuntos-editar.js`), la ficha del asunto (`js/ficha-bloques.js`) y el paso del valor de la
fila 245.

- Importe y Número: caja de texto con `inputmode="decimal"`. Al salir de la caja, se reescribe ya
  formateada. Si lo escrito no se entiende como número, la caja se pone en ámbar con «Escribe solo
  la cifra, por ejemplo 125,50» y **no se guarda** ese valor hasta corregirlo.
- Fecha: `<input type="date">`.
- La vista previa del nombre y los huecos de las plantillas (`{{Nombre del campo}}`) reciben el
  valor **ya formateado** (`1.234,56 €`, `01/10/2026`).

## 3. Cambiar la clase de un campo ya creado

- En el formulario de un campo propio existente («Guardar los cambios»), el desplegable «Clase»
  se puede cambiar.
- Al guardar con una clase distinta, la app recorre las fichas de **todos los asuntos abiertos y
  del índice del ARCHIVO que tengan ese campo** y convierte cada valor con `Campos.leerValor`:
  - Si se entiende (por ejemplo `125,5`, `125.50 €`, `1.200`, `3/10/2026`): se guarda ya en la
    clase nueva.
  - Si no se entiende (por ejemplo «unos 30 euros»): **se deja tal cual**, sin borrar nada.
- Antes de guardar, una sola pregunta (`U.preguntar`): «Vas a cambiar «<campo>» a <clase>.
  N valores se pasarán solos; M no se entienden y quedarán en ámbar para corregirlos a mano.
  ¿Seguimos?». Si M es 0, sin la segunda frase.
- Los guardados de las fichas, por la cola por fichero (`ColaGuardado`, §6 del contexto corto);
  los del ARCHIVO, solo los que hay que tocar.
- Un valor que no encaja con su clase sale **en ámbar en la ficha del asunto**, con el texto
  original y un aviso al pasar el ratón: «No es un importe: corrígelo». Al corregirlo, se quita
  el ámbar. Pasar de Importe/Número/Fecha a Texto libre nunca deja nada en ámbar.
- Pasar de Lista cerrada a otra clase: los valores de la lista se convierten igual; la lista de
  valores del campo se olvida. Pasar a Lista cerrada: los valores que no estén en la lista nueva,
  en ámbar.

## 4. Exportar

En `js/exportar-datos.js`, la columna de un campo propio toma su clase **de la declarada**, no de
adivinarla por el contenido:

- Importe → `numero` con sufijo ` €` y suma al final (lo que hoy hace `sufijoDeMoneda`, pero
  seguro). En la hoja de cálculo, número de verdad con formato de moneda.
- Número → `numero`, con suma.
- Fecha → `fecha`, para poder ordenar en la hoja de cálculo.
- Un valor en ámbar (no encaja): sale como texto en su celda y **no entra en la suma**.
- Los campos de clase Texto libre o Lista cerrada siguen como hoy (incluida la detección de
  importes por el contenido, para los asuntos de antes).

## 5. Campos calculados y de documentos

- Un campo calculado que use un campo de estas clases recibe el valor formateado (como texto).
  No se añaden operaciones aritméticas nuevas.
- Los campos propios de tipos de DOCUMENTO (`js/documentos-campos.js`) ya tienen Fecha; **no se
  tocan** en esta fila.

## Ficheros

- `js/campos.js`: clases nuevas en la normalización, `leerValor` y `mostrarValor`, y la función
  que convierte los valores al cambiar de clase.
- `js/campos-catalogo.js`: el desplegable con las cinco clases y el cambio de clase con su
  pregunta.
- `js/asuntos-nuevo-campos.js`, `js/asuntos-editar.js`, `js/ficha-bloques.js` y el módulo de la
  fila 245: los controles nuevos y el ámbar.
- `js/exportar-datos.js` (y `js/exportar-hoja.js` si hace falta para el formato de moneda/fecha).
- CSS del ámbar del campo, si no hay ya una clase que sirva.
- Si algún fichero pasa de 600 líneas, se parte por temas (§6 del contexto corto).
- Pruebas: nueva `pruebas/campos-importe-numero-fecha.mjs` con los puntos de «Cómo sabemos que
  está bien»; pasar `pruebas/campos.mjs` y las de exportar.
- Datos de demostración: un tipo con un campo «Importe» (con un valor normal, uno negativo y uno
  de texto «unos 30 euros» guardado como Texto libre, para probar el cambio de clase) y un campo
  «Fecha de la factura».
- Documentación al terminar: `docs/CONTEXTO-CORTO.md` (§5, línea de campos propios, sustituyendo),
  `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/VOCABULARIO.md`, `docs/HISTORIA.md` y `docs/COLA.md`.

## Qué dirá Claude Code a Francisco al terminar

Al crear un campo hay tres clases nuevas: Importe en euros, Número y Fecha. Un campo ya creado
puede cambiar de clase; lo que no se entienda queda en ámbar en la ficha para corregirlo. Al
exportar, los importes y números suman y las fechas se ordenan.

## Cómo sabemos que está bien

1. Ajustes → un tipo → «+ Añadir campo» → «Míos» → crear: el desplegable «Clase» trae Texto
   libre, Lista cerrada, Importe en euros, Número y Fecha.
2. Crear «Importe» de clase Importe en euros. En «Nuevo asunto» de ese tipo, escribir `1234,5`
   y salir de la caja: se ve `1.234,50 €`. Escribir `-80`: `-80,00 €`. Escribir `hola`: la caja se
   pone en ámbar con el aviso y no deja guardar ese valor.
3. Crear un campo Número y uno Fecha: el Número enseña `1.234,5`; la Fecha saca calendario y en la
   ficha se ve `01/10/2026`.
4. Un hueco `{{Importe}}` de una plantilla de documento sale como `1.234,50 €`.
5. En los datos de demostración, cambiar el campo de Texto libre a Importe en euros: la pregunta
   dice cuántos valores se pasan y que 1 queda en ámbar. Tras aceptar, los asuntos con `125,5`
   enseñan `125,50 €`; el de «unos 30 euros» lo enseña tal cual, en ámbar. Corregirlo a `30`: se
   quita el ámbar.
6. Volver a cambiarlo a Texto libre: nada en ámbar y ningún valor perdido.
7. Inicio → «Exportar ▾» → hoja de cálculo con la columna Importe: sale como número con €, y la
   suma al final no incluye el valor en ámbar. La columna Fecha se puede ordenar como fecha.
8. Un campo «solo aquí» de la fila 245 de clase Importe funciona igual que uno del tipo.
9. Un tipo antiguo con campos de Texto libre y Lista cerrada se ve y exporta exactamente igual
   que antes.
