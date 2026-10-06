# Si el número ha cambiado, el asunto se crea igual (fila 275)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1FRABeYhjwC1BnuphzkPHFiQ8598qpgTq/view?usp=drivesdk).

## Qué pasó

El compañero de Francisco escribió, desde «Nuevo asunto»: «No se puede crear el asunto, después
de este mensaje». El mensaje de la captura era el ámbar de la fila 239: «Otro ordenador acaba de
usar ese número: el asunto pasa a llamarse … Revísalo y pulsa «Crear el asunto» otra vez.»

La causa, leída en el código (no reproducida todavía):

- `App.crearAsuntoDelFormulario` (`js/asuntos-nuevo-crear.js`) llama a
  `Numeros.reservar('asuntos', App.E.nuevo.numero)`.
- Si el número que enseñaba la vista previa ya no está libre, `reservar` (`js/numeros.js`)
  **gasta el siguiente** (lo deja escrito en `numeros.json`) y devuelve `cambio: true`.
- Quien llama guarda ese número nuevo en `App.E.nuevo.numero`, avisa y **sale sin crear nada**.
- Al pulsar otra vez, `reservar` recibe como esperado un número que el contador ya da por
  gastado (lo gastó la pulsación anterior). Vuelve a decir `cambio: true` y gasta otro. Y así
  sin fin: el asunto no se crea nunca, y cada pulsación pierde un número.

En los documentos (`js/documentos-guardar.js`) no hay bucle, porque `opciones.numeroNuevo` pasa a
`false` tras la primera reserva. Pero pide igualmente pulsar «Guardar» dos veces.

Lo decidido con Francisco: en ese caso la aplicación **crea directamente con el siguiente número
libre y lo dice después**. Nadie elige el número, así que no hay nada que revisar. Y lo mismo al
guardar un documento.

## Qué hay que hacer

### 1. Reproducirlo antes de arreglarlo

Escribe primero la prueba (apartado «Ficheros») y comprueba que **falla** con el código de hoy:
formulario de «Nuevo asunto» relleno, con el número ya en la vista previa; el contador de
`numeros.json` subido por fuera hasta ese mismo número (como haría el otro ordenador); pulsar
«Crear el asunto» dos veces. Hoy no se crea ninguna carpeta y el contador sube dos. Si no falla
así, la causa es otra: búscala antes de seguir y déjalo dicho en la nota de la fila.

### 2. «Nuevo asunto»: crear con el número nuevo, sin segunda pulsación

En `App.crearAsuntoDelFormulario`, cuando `reserva.cambio` es verdadero:

- Se guarda el número nuevo en `App.E.nuevo.numero` y se **vuelve a calcular el nombre** de la
  carpeta con él (`nombreDeCarpetaAjustado`); la variable `nombre` que usa el resto de la función
  tiene que ser la nueva, y la ficha se guarda con ese `numero`.
- **No se sale.** La función sigue y crea la carpeta, la ficha y todo lo demás, como siempre.
- Al final, en vez de «Asunto creado.», el aviso verde dice:
  **«Asunto creado como A26-0096; el A26-0095 lo acaba de usar otro ordenador.»** (con los dos
  números de verdad: el que se ha dado y el que enseñaba la vista previa). Todo lo demás de
  después de crear (copiar el nombre, abrir la mesa del primer hito, los avisos ámbar de lo
  accesorio) queda igual.
- La pregunta «El nombre es muy largo» sigue yendo antes de reservar: el número tiene siempre el
  mismo largo, así que el nombre nuevo mide lo mismo.

Con esto, cada pulsación de «Crear el asunto» que llega a reservar un número termina creando el
asunto con él. Si después falla crear la carpeta, ese número se pierde: se acepta (un número dado
no se reutiliza nunca) y **no** se monta nada para devolverlo.

### 3. Guardar un documento: lo mismo

En `guardar` de `js/documentos-guardar.js`, cuando `reserva.cambio` es verdadero:

- Se vuelve a calcular `nombre` (y lo que cuelgue de él) con el número nuevo, se repinta la vista
  previa del cuadro (`refrescar()`, para que lo que se ve sea lo que se guarda) y **se sigue
  guardando**, sin `return`.
- El aviso verde del final, en vez de «Documento guardado en la carpeta.», dice:
  **«Documento guardado como D26-01235; el D26-01234 lo acaba de usar otro ordenador.»**
- Los avisos ámbar de lo accesorio y el resto del guardado, igual que hoy.

### 4. Lo que no se toca de `Numeros`

`Numeros.reservar` y `Numeros.proximo` se quedan como están: `{ numero, cambio }` sigue siendo
verdad y la prueba `nombres-fijos-con-numero` no cambia. El fallo estaba en quien llama.

Busca si algún otro sitio llama a `reservar` con un número esperado y sale pidiendo repetir. Hoy
solo son estos dos; `js/pdf-separar-unir.js` ya sigue adelante con el número nuevo y no se toca.

### 5. Novedades

Una línea al principio de `js/novedades.js`, en el mismo commit del código: «Si el otro ordenador
se queda el número mientras creas un asunto o guardas un documento, se crea con el siguiente y te
lo dice; ya no hay que pulsar otra vez.»

## Qué NO se toca

- Los números ya perdidos el 6-oct-2026 (el salto a partir del A26-0095) no se recuperan ni se
  rellenan. Francisco ya lo sabe.
- La vista previa del número mientras se escribe, y cuándo se pide (`App.pedirNumeroNuevo`).
- La forma del número, el contador por año y la regla de que un número dado no se reutiliza.
- Los demás sitios que reservan sin esperado (`reservar(clase, '')`): recurrentes, repartir,
  plantillas, impresos, liquidar, generar para relacionados.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/NOMBRES-FIJOS.md` y los
  ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros. `js/asuntos-nuevo-crear.js` tiene 304
  líneas y `js/documentos-guardar.js` 236: sobra sitio.
- Rama `fila-275`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs numero
  nuevo-asunto documento`); la pasada completa, una sola vez al final.
- Ningún dato real de personas ni de empresas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/asuntos-nuevo-crear.js` (`App.crearAsuntoDelFormulario`).
- `js/documentos-guardar.js` (`guardar`).
- `js/novedades.js` (la línea nueva).
- `pruebas/numero-cambiado-crea-igual.mjs` (nueva; con navegador y el disco de mentira, como
  `pruebas/nombres-fijos-con-numero.mjs`, que ya cambia `numeros.json` «por fuera»). Comprueba:
  1. «Nuevo asunto» relleno, vista previa con el número N; contador subido por fuera a N; **una**
     pulsación de «Crear el asunto»: existe la carpeta con N+1, la ficha lleva `numero` N+1, el
     aviso verde nombra N+1 y N, y el contador queda en N+1.
  2. No queda ninguna carpeta con el número N creada por esta ventana.
  3. El asunto siguiente, creado a continuación sin tocar nada por fuera, sale con N+2 y con
     «Asunto creado.» (sin salto y sin el aviso largo).
  4. Sin cambio por fuera, crear un asunto sigue igual que antes: una pulsación, «Asunto
     creado.», el número de la vista previa.
  5. Documento nuevo en un asunto, vista previa con el número M; contador de documentos subido
     por fuera a M; **una** pulsación de «Guardar»: el fichero queda con M+1, la ficha lo tiene
     apuntado con M+1, el aviso verde nombra M+1 y M, y el contador queda en M+1.
  6. Sin cambio por fuera, guardar un documento sigue igual que antes.
- Al terminar: `docs/contexto/NOMBRES-FIJOS.md` (la línea que explica `cambio`: sustituyéndola
  por lo que queda siendo verdad), `docs/CONTEXTO-CORTO.md` (solo si alguna línea deja de ser
  verdad; sin alargarlo) y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En dos o tres frases: que si el otro ordenador se queda el número mientras se crea un asunto o se
guarda un documento, la aplicación lo crea con el siguiente y lo dice después, sin pulsar otra
vez; y que ya no se puede quedar atascada perdiendo números.

## Cómo sabemos que está bien

Los puntos 4 a 7 necesitan que «otro ordenador» gaste un número mientras el formulario está
abierto. La copia de demostración guarda su disco en la memoria de cada pestaña, así que dos
pestañas no lo comparten: si el revisor no puede cambiar el contador por fuera, esos cuatro
puntos quedan cubiertos por la prueba `numero-cambiado-crea-igual` y se dice así en la nota de la
fila.

Para todos los puntos: una empresa inventada («Suministros Inventados, SL») y un tipo de asunto
cualquiera de los de demostración.

1. Crear un asunto para esa empresa: con una sola pulsación de «Crear el asunto» sale «Asunto
   creado.» y la carpeta lleva el número que enseñaba «Se creará esta carpeta».
2. Crear otro a continuación: su número es el siguiente al del punto 1, sin salto.
3. En uno de esos asuntos, añadir un documento: con una sola pulsación de «Guardar» sale
   «Documento guardado en la carpeta.» y el fichero lleva el número que enseñaba el cuadro.
4. Con «Nuevo asunto» relleno y el número ya a la vista, hacer que otro ordenador gaste ese
   número; pulsar «Crear el asunto» **una vez**: el asunto se crea, con el número siguiente.
5. El aviso verde de ese momento dice «Asunto creado como …; el … lo acaba de usar otro
   ordenador.», con los dos números.
6. Crear otro asunto después: sale con el número siguiente al del punto 4, sin salto, y con el
   aviso corto «Asunto creado.».
7. Con el cuadro de un documento nuevo abierto y su número a la vista, hacer que otro ordenador
   gaste ese número; pulsar «Guardar» **una vez**: el documento queda guardado con el número
   siguiente y el aviso verde dice «Documento guardado como …; el … lo acaba de usar otro
   ordenador.».
8. En ningún caso aparece ya el texto «pulsa «Crear el asunto» otra vez» ni «pulsa «Guardar» otra
   vez».
9. Al entrar tras actualizar, «Qué hay de nuevo» enseña la línea de esta fila.
