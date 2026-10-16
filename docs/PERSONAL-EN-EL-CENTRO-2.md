# Personal en el centro, segunda vuelta (fila 354)

Aviso del botón de soporte de Francisco, 16-oct-2026, diseñado con él el mismo día.
Aviso completo: https://drive.google.com/file/d/1YvI2K-S_fYjRF9LSRYQIJj5Gjd28PTjO/view?usp=drivesdk

## 1. Qué pasa

La fila 340 (13-oct-2026, `docs/PERSONAL-EN-EL-CENTRO.md`) intentó arreglar que el personal que
sigue en el centro sale como «Ya no está en el centro». No lo arregló: el aviso es de la versión
15-oct-2026 · 17:08, posterior a esa fila. La fila 340 se hizo sin ningún caso real delante.

**Caso real (el ejemplo de esta fila):**

- Persona: **Marmolejo González, Francisco Javier**, personal **no docente**, puesto «Auxiliar
  administrativo/a».
- En el listado de Séneca del personal no docente (`RelPerCenNoDocente.csv`): fecha de toma de
  posesión `01/09/2026`, **fecha de cese vacía**. Es decir, está en el centro este curso.
- Dónde lo vio: «Nuevo asunto», buscador de la persona, al escribir «Marmole». Se usó la copia
  sin internet (`file://`), perfil Administración.
- Lo que sale (recuadro ámbar), copiado de su captura:
  `Auxiliar administrativo/a · Ya no está en el centro (su último curso aquí: 26-27) · DNI …`
- Francisco dice que pasa igual con docentes que están hoy en el centro.

**Lo que dice ese texto:** «su último curso aquí: 26-27» sale de `App.motivoFuera`
(`js/asuntos-nuevo.js`) cuando `p.esteCurso` es falso. `p.cursoUltimo` es `26-27`, que es el
curso de hoy (`U.cursoActual()`). Así que la aplicación sabe que la persona sale en un dato de
este curso y aun así decide que no está «este curso». El fallo está en `r.esteCurso` de
`js/datos-personal.js` (bloque de la fila 340: «el curso más alto de su clase»), o en algo que
llega antes a ese cálculo (clase o curso mal leídos de un listado o de una parte del Centro de
datos). Pista: como el texto dice «su último curso aquí: 26-27», la persona no tiene datos de
ningún curso posterior; lo más probable es que se la haya medido con la regla de «todo» o de
«docente» (por ejemplo, una fila de una parte del Centro de datos sin `tipoPersonal` se compara con
el curso más alto de todos los datos, y si ese curso es mayor que 26-27 queda fuera). La lista de
personal calculada (`I.CACHE`) vive solo en memoria y se rehace al recargar: no es la causa.

## 2. Qué hay que hacer

1. **Encontrar la causa de verdad** antes de cambiar nada. Reproducirla en una prueba con un
   caso como el de Francisco: listado no docente de 26-27 con la persona sin cese, y a la vez
   otros datos de personal que pueda haber en la carpeta (listado docente, listado «todo», partes
   del Centro de datos con o sin `tipoPersonal`, y un listado o parte cuyo curso salga mayor que
   el de hoy). La prueba tiene que fallar con el código de hoy. Apuntar la causa en
   `docs/HISTORIA.md`.
2. **Arreglarla**, y además poner esta regla, que manda sobre la de la fila 340 (decidido con
   Francisco): **está en el centro quien sale en algún dato de personal del curso de hoy
   (`U.cursoActual()`) o de uno posterior, y no tiene una fecha de cese ya pasada.** Siempre,
   tenga los cursos que tenga el resto de los datos. La regla de la fila 340 («sale en el dato más
   reciente de su clase») se queda solo para cuando la persona no sale en ningún dato del curso de
   hoy ni posterior.
   - Decidido con Francisco: el curso de hoy es el de `U.cursoActual()` tal como está (dura hasta el
     31 de agosto). Quien se vaya en junio sin fecha de cese en Séneca sale «En el centro» hasta
     el 31 de agosto; se acepta así. No se adelanta el curso nuevo al 1 de julio.
   - La regla cambia **`esteCurso` y `enElCentro` a la vez**: con ella, `esteCurso` es verdadero, y
     así quien tenga un cese ya pasado en el curso de hoy sale «(cesó el …)» y no «su último curso
     aquí: …» (`App.motivoFuera` exige `esteCurso` para ese texto).
   - **Solo cuentan los datos cuyo curso se sabe**: un listado con el curso en su nombre, o una parte
     del Centro de datos (que lleva su curso). Un listado sin curso en el nombre (al que
     `cursoDelFichero` le supone el de hoy) no basta por sí solo para esta regla; para él sigue la
     de la fila 340.
   - Un curso «posterior al de hoy» solo vale si es de verdad: si sale de leer mal un nombre (un
     año suelto, como «2027», tomado por un curso) o de una parte mal fechada, se corrige esa
     lectura en vez de aceptarlo.
   - La fecha de cese que cuenta es la de la persona en el curso de hoy. Si sale en dos listados de
     ese curso (por ejemplo, docente con cese y no docente sin cese), manda el que no tiene cese o
     el que lo tiene más tarde; no el orden de lectura de los ficheros.
3. Quien se fue de verdad sigue como hasta ahora: recuadro ámbar con el motivo (cese ya pasado,
   o «su último curso aquí: …» de un curso anterior al de hoy), y se le puede crear el asunto
   igual. No se cambia ningún texto de pantalla.

## 3. Ficheros

- `js/datos-personal.js` (cálculo de `esteCurso` y `enElCentro`). Es el sitio principal.
- Solo si la causa está ahí: `js/datos-personal-hecho.js` (filas de las partes del Centro de
  datos) o donde se guarde la lista de personal.
- `pruebas/personal-en-el-centro.mjs`: añadir el caso de esta fila (ver sección 1).
- `docs/contexto/PERSONAS.md`, `docs/CONTEXTO-CORTO.md` (sustituir la línea, no añadir),
  `docs/HISTORIA.md`, `js/novedades.js` (una línea: cambia lo que se ve).
- No tocar `js/asuntos-nuevo.js`, `js/ficha-persona.js`, `js/ficha-tercero.js` ni
  `js/datos-resumen.js`: leen `enElCentro`, `esteCurso` y `cursoUltimo`, y con el dato bien
  calculado salen bien solos.

## 4. Cómo trabajar

- No leas el repositorio entero: con `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md`,
  `docs/PERSONAL-EN-EL-CENTRO.md` y los ficheros de la sección 3 basta.
- Cambios quirúrgicos; no reescribas ficheros enteros. Ningún fichero de `js/` pasa de 600
  líneas.
- Las reglas de la cola de siempre (`docs/COLA.md`, `CLAUDE.md`): rama `fila-354`, revisor,
  fusión en `main`, una publicación a propósito.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs personal`); la
  pasada completa, una vez al final.

## 5. Cómo sabré que está bien

Acordadas con Francisco el 16-oct-2026:

1. En «Nuevo asunto», al escribir «Marmole», la ficha de Marmolejo González, Francisco Javier
   sale sin el recuadro ámbar y sin «Ya no está en el centro».
2. Lo mismo con cualquier profesor o profesora que esté hoy en el centro.
3. En «Personas y empresas», su ficha dice «En el centro».
4. Quien se fue de verdad (por ejemplo, con fecha de cese ya pasada) sigue saliendo en ámbar, con
   el motivo.

Para el revisor, en la copia de pruebas: una persona no docente con datos solo del curso de hoy
y sin cese, junto a datos de otra clase o de un curso posterior, sale «En el centro»; otra con
cese pasado sale en ámbar con «(cesó el …)».
