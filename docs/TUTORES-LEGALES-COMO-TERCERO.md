# Fila 166 — Los tutores legales, un tipo de tercero propio

Cerrado con Francisco el 25-sep-2026, en conversación.

## Para qué

Hay asuntos cuyo interesado es el padre, la madre o el tutor legal, no el alumno: miembros del
Consejo Escolar, del AMPA, reclamaciones de una familia, gestiones que afectan a varios hermanos.
Hoy solo se pueden meter en OTROS (a mano) o a nombre de un hijo, que no es verdad.

**No sustituye nada.** Un asunto del alumno sigue siendo del alumno; el tutor sigue pudiendo ir
en «Lo pide» y como tercero relacionado, como hoy.

## Qué se ve

1. **Categoría nueva `TUTORES LEGALES`**, al lado de ALUMNADO, PERSONAL, EMPRESAS y OTROS: en
   «Nuevo asunto», en la parrilla de tipos, en Personas y empresas, en el ARCHIVO
   (`ARCHIVO/TUTORES LEGALES/<tercero>`), en Cuentas, en filtros y buscadores. Los tipos de asunto
   se pueden crear en ella como en cualquier otra.
2. **Nombre del tercero** (regla 4 de `docs/CONTEXTO-CORTO.md`, se añade una línea): igual que el
   personal, `Apellido1 Apellido2, Nombre` + los **4 últimos caracteres del DNI**. Para montar
   «Apellidos, Nombre» a partir de las columnas del RegAlum, usar la misma lógica que
   `LoPide.datosDeTutor` (columnas de apellidos y nombre por separado cuando existan). Sin DNI,
   solo el nombre (y el aviso habitual de dato que falta).
3. **Los datos salen solos del `RegAlum.csv`**: el índice de tutores que ya monta
   `PersonasFamilias.indice` (unidos por DNI normalizado) es la lista de esta categoría. **No hay
   alta a mano**: ni botón de alta ni fichero que rellenar.
4. **Ficha del tutor** (Personas y empresas, y la tarjeta «Datos y contacto» de su asunto): nombre,
   DNI, teléfonos, correos, domicilio si viene, y **sus hijos** (matriculados y antiguos), cada uno
   pulsable a su ficha. Debajo, sus asuntos, como en cualquier tercero.
5. **Ficha del alumno**: un bloque o fila nueva «Asuntos de sus tutores», con los asuntos
   (abiertos y del ARCHIVO) de sus tutores legales. Sin ninguno, no sale.
6. **Si el alumno deja el centro, el tutor no desaparece.** En cuanto un tutor es tercero de un
   asunto, se guarda su foto de datos en `_GESTOR/datos/tutores.csv` (nombre, DNI, teléfonos,
   correos, domicilio, Nº escolar de sus hijos). La lista de la categoría es la unión de lo que
   saque el RegAlum y de ese fichero; si el RegAlum trae datos más nuevos, mandan esos y el fichero
   se pone al día. Escribir ese CSV **siempre** por `ColaGuardado`, como los demás CSV de terceros,
   y darlo de alta en `js/conflictos.js` y en las copias diarias (`js/copias.js`).
7. **Los tutores también en los demás sitios donde se elige un tercero**: «Lo pide», terceros
   relacionados, destinatarios de correo y de Séneca, el recuadro de asuntos parecidos (fila 163),
   la parada de duplicados, el reconocimiento de tercero en «Por clasificar» y en la bandeja de
   Gmail (`js/bandeja-propuesta.js`), campos calculados y plantillas (huecos de nombre, DNI,
   correo; «el padre/la madre» no: el sexo del tutor no viene en los datos, usar «el/la tutor/a
   legal»).
8. **Asuntos reservados**, papelera, índice del ARCHIVO, fichas huérfanas y demás: la categoría
   nueva funciona igual que las otras, sin excepciones.

## Ficheros que se tocan

La lista de categorías está escrita a mano en muchos sitios (`['ALUMNADO', 'PERSONAL',
'EMPRESAS', 'OTROS']`). **Primer paso**: que todos lean `Nombres.CATEGORIAS` (`js/nombres.js`) en
vez de su copia, y añadir allí `TUTORES LEGALES`. Ficheros donde aparece hoy (comprobar con
`grep -rn "'EMPRESAS'" js`):

`js/nombres.js`, `js/datos.js`, `js/asuntos-nuevo.js`, `js/asuntos-nuevo-campos.js`,
`js/ficha-tercero.js`, `js/ficha-nombre-acciones.js`, `js/plantillas-valores.js`,
`js/datos-resumen.js`, `js/cuentas.js`, `js/contexto-documentos.js`, `js/genero.js`,
`js/relacionados-ficha.js`, `js/documentos-sueltos-sugerencias.js`, `js/lector-documentos.js`,
`js/bandeja-propuesta.js`, `js/campos-calculados-editor.js`.

Además: `js/personas-familias.js` (el índice pasa a ser también la lista de la categoría),
`js/archivo-personas.js`, `js/datos-listas.js` (el CSV nuevo), `js/conflictos.js`, `js/copias.js`,
`js/duplicados.js`, `js/lo-pide.js`. Lógica nueva en un módulo propio, `js/tutores-legales.js`
(`window.TutoresLegales`), enganchado por puntos previstos, **sin envolturas nuevas**. Ningún
fichero de `js/` pasa de 600 líneas: si alguno se pasa, se parte.

Documentación de cierre: `docs/contexto/PERSONAS.md` (sección nueva), `docs/CONTEXTO-CORTO.md`
(regla 4 con la línea del tutor; en la sección 5, una línea), `docs/COLA.md`, `docs/HISTORIA.md`.

## Cómo trabajar

- Subir directamente a `main`, sin abrir ninguna pull request (si la sesión lo impide, la nota
  del final de `docs/COLA.md`).
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leer el repositorio entero: `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md`,
  `docs/contexto/ASUNTOS.md` y los ficheros de la lista.
- **Una sola prueba al final**, `pruebas/tutores-legales.mjs` (sin navegador si se puede), con
  datos inventados:
  1. Un RegAlum con dos hermanos que comparten madre: la madre sale una sola vez en la categoría,
     con los dos hijos.
  2. Nombre de carpeta del tutor: `Apellido1 Apellido2, Nombre 1234` (4 últimos del DNI).
  3. Crear un asunto a nombre del tutor lo guarda en `tutores.csv`; quitar a los hijos del RegAlum
     no le hace desaparecer.
  4. La ficha del alumno enseña «Asuntos de sus tutores».
  5. `Nombres.CATEGORIAS` tiene las cinco, y ya no queda ninguna lista de categorías escrita a
     mano (`grep`).
  6. `npm test` entero en verde.
