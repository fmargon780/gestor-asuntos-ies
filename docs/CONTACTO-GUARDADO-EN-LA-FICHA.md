# Fila 66 — El contacto del tercero, guardado en la ficha

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 4, punto 8.

Es trabajo de ahora para un problema de **septiembre de 2027**. Cuanto antes se haga, más asuntos lo
tendrán cuando llegue.

---

## 1. Qué pasa hoy

La ficha de un asunto guarda el **nombre** del tercero, pero no sus datos. El teléfono, el correo,
el grupo, la edad y los tutores legales se van a buscar cada vez al `RegAlum.csv` de
`_GESTOR/datos`, por el nombre.

Funciona bien mientras la persona esté en el fichero.

**En septiembre de 2027 dejará de estarlo.** Al empezar el curso nuevo se baja un `RegAlum.csv`
nuevo, y el alumnado que se fue del centro ya no viene. A partir de ese momento, un asunto de esa
persona que siguiera abierto se queda:

- sin teléfono ni correo en "Datos y contacto",
- sin grupo ni edad,
- sin tutores legales, así que "Lo pide" no puede proponer a nadie,
- sin poder preparar un correo con el destinatario ya puesto.

Y la carpeta sigue ahí, con el nombre y el número escolar, sin forma de contactar con nadie.

Pasa igual con el personal que se traslada (`RelPerCen.csv`) y con los aspirantes a plaza que no
llegaron a matricularse.

## 2. Qué hay que hacer

### 2.1 Guardar una foto del contacto al crear el asunto

Cuando se crea un asunto, además del nombre del tercero, guardar en la ficha un bloque pequeño con
lo que haga falta para seguir trabajando sin el CSV. Algo como `ficha.contacto`:

- nombre completo tal cual,
- documento de identidad y número de identificación escolar,
- grupo y enseñanza,
- fecha de nacimiento,
- teléfonos y correos,
- los tutores legales con su nombre, teléfono, correo y documento,
- de qué fichero y de qué fecha se sacó todo esto.

Solo lo que la aplicación usa de verdad. **No copiar el CSV entero ni columnas que no se miran
nunca**: es una foto para poder trabajar, no un archivo paralelo de datos personales.

Para el personal y las empresas, lo mismo con sus columnas.

### 2.2 Usarlo solo cuando haga falta

El orden al pedir los datos de un tercero tiene que ser:

1. Buscarlo en el CSV, como hoy. Si está, **manda el CSV**: es lo más fresco.
2. Si no está, usar `ficha.contacto`.
3. Si tampoco hay, quedarse como hoy, sin datos.

Así, mientras la persona siga en el centro, no cambia absolutamente nada. La foto solo entra en
juego cuando la persona ha desaparecido.

Cuando se usen los datos de la foto, **decirlo en pantalla**: una línea gris que ponga algo como
"Datos guardados el 5 de septiembre de 2026; esta persona ya no está en el RegAlum". Que nadie llame
a un teléfono creyendo que está comprobado hoy.

El sitio donde tocar esto es `js/datos.js` (de dónde salen los terceros) y `js/ficha-tercero.js` (lo
que se pinta). Buscar todos los sitios que llaman a `Datos.cargar` y decidir cuáles pasan por el
camino nuevo: los de la ficha y los del correo sí; los buscadores de alta, no (ahí se busca en el
CSV a propósito).

### 2.3 Rellenar la foto de los asuntos que ya existen

Los asuntos de hoy no la tienen. Un botón en **Ajustes → Mantenimiento**, "Guardar el contacto de
los asuntos abiertos", que recorra los abiertos, busque cada tercero en el CSV y rellene el bloque
donde falte. Que diga cuántos ha rellenado y cuántos no ha encontrado.

**Hay que pulsarlo antes de que acabe este curso.** Después de septiembre de 2027 ya no habría de
dónde sacarlo para el alumnado que se vaya.

### 2.4 Los aspirantes a plaza

`_GESTOR/datos/solicitantes.csv` lo crea la aplicación y no se limpia nunca: arrastra a todos los
aspirantes de todos los cursos.

Añadir una columna con el curso en el que se dieron de alta, y en Ajustes una línea que diga cuántos
hay de cursos anteriores, con un botón para apartarlos a `solicitantes-anteriores.csv`. Apartar, no
borrar.

## 3. Cómo se comprueba

Prueba nueva, `pruebas/contacto-guardado.mjs`, sin navegador:

1. Se crea un asunto con un alumno que está en el CSV. La ficha guarda su bloque de contacto.
2. Con el alumno en el CSV, la ficha enseña los datos del CSV, no los guardados. Si se cambia un
   teléfono en el CSV, se ve el nuevo.
3. **Se quita al alumno del CSV.** La ficha sigue enseñando teléfono, correo y tutores, con el aviso
   de que son datos guardados y de qué fecha.
4. Un asunto sin bloque de contacto y con el alumno fuera del CSV se comporta como hoy: sin datos,
   sin romperse.
5. El botón de rellenar los abiertos hace lo que dice y cuenta bien.

## 4. Qué NO hay que hacer

- **No** dejar de leer el CSV. Sigue siendo la fuente buena mientras la persona esté.
- **No** copiar el CSV entero dentro de la ficha.
- **No** guardar la foto de los terceros de un asunto **archivado**: esos ya no se tramitan. (Si se
  hace después de la fila 64, la ficha del archivado vive en su carpeta y la foto viaja con ella
  sola, que es lo suyo.)

## 5. Cuánto es

Un día.
