# Cuadros con los botones siempre a la vista

Fila 341 de `docs/COLA.md`. Diseñada con Francisco el 13-oct-2026 a partir de un aviso del
botón de soporte (copia sin internet, perfil Administración; aviso completo:
https://drive.google.com/file/d/1MStquUr6I58NJ4CPEGt7Facv5f-AyQLz/view?usp=drivesdk; la
captura está en la misma carpeta de Drive, `2026-10-13 130653 error.jpg`).

## De dónde sale esto

El aviso dice: «Otra vista que se hace tan larga que no permite ver los botones de aceptar,
cancelar, etc. Sería conveniente hacer una revisión completa para detectar otras posibles vistas
en el app en las que pueda estar pasando lo mismo.»

La captura enseña la ficha del asunto «260922 ALTAS CAPACIDADES 26-27…» (asunto de grupo, 61
personas relacionadas), pestaña «Documentos de la carpeta», con el visor de un PDF abierto a la
derecha (barra con «Separar», «Unir», «Sacar páginas», «Ajustar tamaño», «Repartir entre
terceros»). Encima hay un cuadro con una lista de casillas, todas marcadas, una por persona
(«ALUMNADO · Apellidos, Nombre Nº escolar»). La lista pasa del borde de abajo de la pantalla y
no se ve ni un botón. Es el mismo fallo que la fila 338 arregló solo para «Añadir varios
relacionados».

La causa común: el cuadro común (`.cuadro` en `css/estilos.css`, marcado en `index.html` con su
pie `.cuadro-botones` y `#cuadro-cancelar`) no tiene alto máximo, así que crece con su
contenido y el pie se queda fuera de la pantalla. Algunos cuadros propios lo resolvieron cada uno
a su manera (`.cuadro-varios`, `.cuadro-actividad`…), con `overflow: auto` en el cuadro entero,
que desplaza también los botones.

Francisco eligió (opción 1 de 2): **una regla para todos los cuadros**, no un arreglo uno a uno.

## Lo que se pide

### 1. La regla común

En **todos** los cuadros de la aplicación (el común y los propios):

- El cuadro nunca es más alto que la pantalla (con un margen arriba y abajo).
- Tiene tres partes: cabecera (título y ✕), cuerpo y pie (botones). **Cabecera y pie quedan
  fijos y siempre a la vista**; solo el cuerpo se desplaza por dentro cuando no cabe.
- La ✕ de arriba y la tecla Esc siguen haciendo lo mismo que hoy en cada cuadro. Si el cuadro
  común no tiene ✕, no se le añade aquí: basta con que el pie se vea siempre.
- Se hace una sola vez, en el cuadro común y en una clase o regla compartida que los cuadros
  propios usen. Nada de un arreglo distinto en cada cuadro. Los cuadros propios que hoy llevan
  `overflow: auto` en el cuadro entero pasan a la regla común.
- Un cuadro que cambia de contenido mientras está abierto (pestañas, filtros, listas que crecen)
  mantiene el pie a la vista en todo momento.
- En pantallas estrechas igual: pie siempre a la vista, sin desplazamiento de lado.

### 2. El cuadro de la captura

Encontrar qué cuadro es (lista de casillas por persona del asunto, abierto desde la ficha de un
asunto de grupo con el visor de un documento abierto; mirar los cuadros que trabajan con un
documento y los relacionados: repartir, asociar o enviar a personas del grupo) y comprobar con la
demostración, con más de 60 personas relacionadas, que sus botones se ven sin desplazarse.

### 3. Revisión de todos los cuadros

Repasar uno a uno los cuadros de la aplicación (todo lo que use el cuadro común, `U.preguntar` o
un cuadro propio) y comprobar que cumplen la regla con un contenido muy largo. Los que no la
cumplan se pasan a la regla. Apuntar en `docs/HISTORIA.md` la lista de cuadros revisados y cuáles
hubo que cambiar.

### 4. Comprobación automática

Una prueba nueva (en `pruebas/`) que abra en la demostración los cuadros que pueden crecer (al
menos el de la captura, «Añadir varios relacionados» y otro de lista larga) con mucho contenido,
en una ventana baja (por ejemplo 700 px de alto), y compruebe que el pie con sus botones está
dentro de la pantalla y se puede pulsar. Así un cuadro nuevo no vuelve a fallar.

### 5. Nada más cambia

No cambian los textos, los botones ni lo que hace cada cuadro. Solo dónde se ven.

### 6. Regla para el futuro

Añadir a la sección 6 de `docs/CONTEXTO-CORTO.md` una línea: todo cuadro nuevo usa la regla
común (cabecera y pie fijos, cuerpo que se desplaza); nunca `overflow` en el cuadro entero.

## Novedades

Una línea en `js/novedades.js`: «Los cuadros largos ya no esconden sus botones: Aceptar,
Cancelar y los demás se ven siempre abajo.»

## Cómo sabemos que está bien

- En la demostración, el cuadro de la captura con más de 60 personas: los botones se ven sin
  desplazarse, y la lista se desplaza por dentro.
- «Añadir varios relacionados» sigue como lo dejó la fila 338.
- La prueba nueva pasa y falla si se quita la regla común.
- `docs/HISTORIA.md` lleva la lista de cuadros revisados.
- La pasada completa de pruebas, en verde.
