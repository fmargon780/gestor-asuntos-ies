# El ayudante de Séneca tiene que comprobar, no contar el tiempo

Instrucción de la fila 54. Acordada con Francisco el 18-sep-2026, después de probarlo en Séneca
de verdad con una lista de cuatro profesores.

## Qué pasó en la prueba

De cuatro destinatarios:

- Los dos primeros aparecieron escritos, pero **no se quedaron** como etiqueta.
- El tercero entró bien.
- El cuarto se quedó en pantalla, escrito, esperando al Intro.

O sea: el resultado depende de si Séneca ha tenido tiempo de desplegar su sugerencia. El ayudante
de hoy (`js/seneca-ayudante.js`, fila 47) espera **1400 ms fijos**, lanza la flecha abajo y el
Intro pegados el uno al otro, y **no mira nunca si la persona ha entrado**. Con la red del centro
un poco lenta, o con el navegador ocupado, falla.

No se arregla subiendo el número de milisegundos. Se arregla haciendo que el ayudante mire.

## Qué hay que hacer

Todo el cambio está dentro de la cadena `CODIGO_INTERNO` de `js/seneca-ayudante.js`, que es el
código que se ejecuta **dentro de la página de Séneca**. El resto del fichero (`textoDelMarcador`,
`insertarEnlace`) se toca solo en lo que diga el punto 6.

### 1. Esperar a que aparezca la sugerencia, en vez de contar 1400 ms

Después de escribir el usuario en el campo y disparar `input` y `keyup`:

- Mirar cada **150 ms**, hasta un máximo de **5000 ms**, si ha aparecido en la página algún
  elemento **visible**, distinto del propio campo, cuyo texto contenga el usuario que se acaba de
  escribir (sin la arroba, comparando en minúsculas). Ese es el desplegable de sugerencias de
  Séneca; no hace falta saber cómo se llama su etiqueta.
- Buscarlo también dentro de los `iframe` accesibles, igual que ya hace `buscarCampo()`.
- Si aparece, seguir en cuanto aparezca (así, cuando la red va bien, va más rápido que ahora).
- Si no aparece en 5000 ms, seguir igualmente e intentarlo: puede que Séneca lo pinte de una
  forma que no reconozcamos.

### 2. Separar la flecha abajo del Intro

Hoy van seguidos sin ninguna pausa. Poner **350 ms** entre la flecha abajo y el Intro.

### 3. Comprobar que ha entrado de verdad

Después del Intro, mirar cada **150 ms**, hasta **2500 ms**, si el campo se ha **vaciado** (Séneca
limpia el campo cuando se queda con el destinatario). Si se vacía, esa persona ha entrado.

### 4. Reintentar una vez, más despacio

Si a los 2500 ms el campo sigue con el texto escrito, **reintentar esa misma persona una sola
vez**: volver a escribir el valor, esperar la sugerencia como en el punto 1 pero con un máximo de
**7000 ms**, flecha abajo, pausa de 350 ms, Intro, y volver a comprobar.

Si el reintento tampoco funciona: apuntar esa persona como **fallida**, vaciar el campo a mano
(poner el valor vacío y disparar `input`) para que la siguiente no se escriba pegada a la anterior,
y seguir con la siguiente.

### 5. Contar la verdad al terminar

El cuadro azul de arriba a la derecha:

- Mientras trabaja, sigue diciendo "Metiendo 3 de 12" con su botón "Parar", igual que ahora.
- Al terminar **sin fallos**: "Hecho: N metidos", y se quita solo a los 3 segundos, como ahora.
- Al terminar **con fallos**: "Hechos N de M. No han entrado: @uno, @dos", y **no se quita solo**.
  Lleva dos botones: **"Copiar los que faltan"** (deja esos usuarios en el portapapeles, uno por
  línea, con la arroba) y **"Cerrar"**.
- Entre persona y persona, subir la pausa de 400 a **600 ms**.

### 6. La explicación que lee Francisco

En `insertarEnlace`, cambiar la tercera frase ("Si alguna vez no hace nada…") por esta idea, con
las palabras que parezcan mejores: el ayudante comprueba cada destinatario y, si alguno no entra,
lo dice al final por su nombre para pegarlo a mano con "Copiar el siguiente". Añadir que para un
grupo que se usa todos los meses lo suyo es crearlo una vez en el gestor de contactos del propio
Séneca: este ayudante es para listas de un día.

## Qué NO se toca

- `js/seneca-destinatarios.js`: los chips, "Copiar la lista" y "Copiar el siguiente" se quedan
  exactamente como están.
- `js/correo.js` y el cuadro de Séneca: la fila 53 los va a mover de sitio. Esta fila no entra ahí.
- No cambiar la manera de instalar el marcador: se sigue arrastrando a la barra de marcadores.

## Ficheros que hay que tocar

- `js/seneca-ayudante.js` — el cambio entero.
- La prueba de este fichero en `pruebas/`, si existe; si no, una mínima que compruebe que
  `SenecaAyudante.textoDelMarcador()` empieza por `javascript:` y que el texto incluye la espera
  de la sugerencia, la comprobación del campo vacío y el reintento.
- `docs/CONTEXTO-CORTO.md`, `docs/CONTEXTO.md` y `docs/HISTORIA.md`, según las reglas 8 y 9 de la
  cola: sustituyendo la línea vieja, no añadiendo una debajo.

## Cómo trabajar esta fila

- No leas el repositorio entero: con `js/seneca-ayudante.js` y `docs/CONTEXTO.md` basta.
- Cambios quirúrgicos, no reescribir ficheros enteros.
- **Una sola prueba al final** (`npm test`), no una comprobación después de cada cambio.
- **Sube directamente a `main`, sin abrir ninguna petición de cambios.**
- Como máximo dos subidas (regla 13): una para marcar la fila EN CURSO y otra con todo lo demás.

## Cómo se sabe que ha salido bien

No se puede probar contra Séneca desde aquí. La comprobación de verdad la hace Francisco con una
lista de cuatro o cinco profesores. Lo que sí tiene que quedar claro al terminar: que ninguna
persona se da por metida sin haber comprobado que el campo se ha vaciado, y que al final se dice
por su nombre quién no ha entrado.
