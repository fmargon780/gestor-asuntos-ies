# Botón "Insertar hueco" en el editor de plantillas

Acordado con Francisco el 17-sep-2026. Es la fila 35 de `docs/COLA.md`.

## El problema

En Ajustes, al crear o editar una plantilla de correo, encima del cuadro de texto hay un muro
de botones con los huecos disponibles (Nombre del tercero, Grupo, Año académico, DNI del
alumnado, Teléfono del primer tutor... más de treinta). Ese muro ocupa casi toda la pantalla.
Francisco no llega a ver la parte de arriba del formulario (el nombre de la plantilla, el tipo
de asunto, el asunto del correo) sin desplazarse, y dice que así la pantalla es inusable.

El catálogo de huecos no sobra: lo que sobra es tenerlo todo desplegado a la vez.

## Lo que hay que hacer

Quitar el muro de botones y poner en su lugar **un solo botón, "Insertar hueco"**, encima del
cuadro de texto.

Al pulsarlo se abre un cuadro pequeño con:

- Un campo de búsqueda arriba, con el cursor ya dentro. Escribiendo "tutor" se queda solo con
  los huecos cuyo nombre lo contenga. La búsqueda ignora mayúsculas y tildes.
- La lista de huecos que encajan, con el nombre en claro ("Teléfono del primer tutor") y, más
  pequeño y en gris, el código que se va a insertar.
- Se elige uno con el ratón, o con las flechas arriba/abajo y Enter.
- Escape cierra sin insertar nada.

Al elegir un hueco, su código entra **donde estuviera el cursor** en el cuadro de texto, el
cuadro se cierra y el cursor vuelve al texto, justo detrás de lo insertado. Si había texto
seleccionado, el hueco lo sustituye.

## El detalle que importa: en qué cuadro entra

El formulario de una plantilla de correo tiene dos campos donde caben huecos: el **asunto** y
el **texto**. El botón sirve para los dos.

- Hay que recordar cuál de los dos campos tuvo el foco por última vez, y es ahí donde se
  inserta.
- Si todavía no se ha hecho clic en ninguno, se inserta al final del cuadro de texto.

Para eso hace falta guardar la posición del cursor (`selectionStart`/`selectionEnd`) del campo
al perder el foco, porque al abrir el cuadro de búsqueda el foco se va.

## Dónde más

Si el mismo muro de botones se pinta también en el editor de plantillas de **mensaje de Séneca**
y en el de plantillas de **documento de Word**, se sustituye igual, con el mismo botón y el
mismo cuadro. Se hace una sola función y se usa en los tres sitios; no se copia tres veces.

## Lo que no cambia

- El catálogo de huecos es el mismo de ahora. No se añade ni se quita ninguno, ni cambia su
  código ni su nombre.
- El resto del formulario (nombre, tipo de asunto, vista previa, guardar, borrar) se queda
  exactamente igual.
- Nada de lo que se guarda en `plantillas.json` cambia.

## Ficheros que hay que tocar

- `js/plantillas-ajustes.js` — es donde se pinta el muro de botones y el formulario. Aquí va
  casi todo el trabajo.
- `js/plantillas-documento.js` — solo si pinta su propio muro de huecos.
- `js/plantillas.js` — solo si el catálogo de huecos hay que exponerlo con nombre y código por
  separado para poder buscarlo. Si ya está así, no se toca.
- La hoja de estilos de `css/` que ya usa el bloque de plantillas de Ajustes, para el cuadro de
  búsqueda.
- Prueba nueva `pruebas/plantillas-huecos.mjs`.

No hay que tocar `js/correo.js`, `js/docx.js` ni `apps-script/gestor-correos.gs`.

## Qué tiene que comprobar la prueba

1. El formulario de plantilla ya no pinta el muro de botones de huecos.
2. El botón "Insertar hueco" abre el cuadro, y el campo de búsqueda filtra (buscar "tutor" deja
   fuera "Grupo").
3. Con el cursor en medio del texto, el hueco elegido entra en esa posición exacta, no al final.
4. Con el foco puesto antes en el asunto, el hueco entra en el asunto y no en el texto.
5. Escape cierra el cuadro sin insertar nada.

## Reglas de esta instrucción

- Cambios quirúrgicos. No reescribir ficheros enteros.
- No leer el repositorio entero: con `docs/CONTEXTO.md` y los ficheros de la lista basta.
- Una sola pasada de pruebas al final, no una después de cada cambio.
- Si `js/plantillas-ajustes.js` pasa de unas 400 líneas al terminar, partirlo en dos.
- **Subir directamente a `main`, sin abrir ningún pull request.** Si la sesión no tiene permiso
  para tocar `main` (sesión en la nube), pull request y fusionarlo solo en cuanto esté en verde,
  según el permiso permanente del final de `docs/COLA.md`.
