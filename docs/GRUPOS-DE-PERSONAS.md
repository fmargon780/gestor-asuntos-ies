# Grupos de personas

Acordado con Francisco el 17 de septiembre de 2026. Fila 21 de `docs/COLA.md`.

Es el punto 3 de `docs/PROXIMOS-ASUNTOS.md`, y crece: él lo pidió para los terceros relacionados,
pero en la conversación quedó claro que el mismo grupo tiene que servir también para poner los
destinatarios de un correo.

## De dónde sale

Hoy, para añadir un relacionado a un asunto, se elige una categoría (ALUMNADO, PERSONAL, EMPRESAS,
OTROS), se busca a la persona y se añade. **Una cada vez.** Para un asunto que afecta a media
clase, eso son veinte vueltas al mismo cuadro.

Francisco pidió, con sus palabras: varios alumnos de una clase, varios profesores, todos los
alumnos de una unidad, de un nivel o de una enseñanza, y también grupos como el equipo directivo o
los tutores de 1º. Y añadió: "no solo relacionar asuntos, pienso que estos grupos también serían
útiles para enviar comunicaciones".

Lo que **no** entra en esta instrucción, porque no es programar sino meter datos que la aplicación
no tiene: departamentos, tutorías y equipos educativos. `personal.csv` solo guarda nombre,
documento, puesto, teléfono y correo. Eso se habla aparte, y hasta entonces esos grupos se montan
a mano como cualquier otro grupo propio (punto 3 de aquí).

## 1. Señalar varios a la vez

El buscador de terceros que ya existe (`App.pintarBuscadorDeTercero`, que usan "Nuevo asunto" y
`js/relacionados.js`) gana un modo nuevo, **opcional**: señalar varios.

- Donde se llame como hasta ahora, se comporta exactamente como hasta ahora. Ni un cambio.
- En el modo nuevo, cada resultado lleva una casilla. Abajo, fija, una barra con la cuenta y el
  botón: `Añadir los 7 señalados`.
- Las casillas señaladas **no se pierden al cambiar la búsqueda**: se puede buscar "García", marcar
  dos, buscar "Pérez" y marcar otro. La barra lleva la cuenta de todos.
- Al lado de la cuenta, un enlace pequeño para ver la lista de lo ya señalado y poder quitar alguno.
- Se puede cambiar de categoría sin perder lo señalado: un grupo puede mezclar alumnado, personal y
  empresas.

Quien estrena este modo es la pantalla de relacionados de la ficha del asunto.

## 2. Grupos de alumnado que salen de los datos

Cuando la categoría es ALUMNADO, encima del buscador salen tres atajos:

    Toda una unidad   [ 3º B ▾ ]
    Todo un nivel     [ 3º ▾ ]
    Toda una enseñanza [ E.S.O. ▾ ]

- Las unidades ya se sacan hoy con `Datos.unidadesDistintas(lista)` (se usa en Ajustes).
- El nivel y la enseñanza se sacan del texto de la unidad, que Séneca escribe largo ("1º de E.S.O.
  A"). `js/nombres.js` ya sabe partir eso para `grupoCompacto`; hay que sacar de ahí una función
  pública, `Nombres.nivelYEnsenanza(unidad)`, que devuelva `{ nivel: '1º', ensenanza: 'E.S.O.' }`, y
  usarla en los dos sitios. No se duplica el análisis del texto.
- Los desplegables se rellenan con lo que haya en los datos cargados, sin listas escritas a mano en
  el código: si el centro tiene ciclos formativos, saldrán sus enseñanzas solas.
- **Solo alumnado matriculado este curso** (`matriculado`). El alumnado de cursos anteriores no
  entra en estos atajos.
- Al elegir uno, no se añade nada todavía: se señalan sus alumnos en el modo del punto 1, con su
  cuenta a la vista. Así se puede quitar a dos antes de añadir. Nada entra sin que Francisco pulse
  el botón de añadir.

## 3. Grupos propios, guardados con nombre

Un grupo propio es una lista de personas con un nombre: "equipo directivo", "tutores de 1º", "los
del departamento de Lengua". Se monta una vez y se usa muchas.

**Dónde se guarda.** Fichero compartido nuevo, `_GESTOR/grupos.json`. Es el decimotercero de los
compartidos: hay que sumarlo donde se cuentan y se copian (`js/copias.js`), y pasa por
`Copias.guardar` como todos los demás. Forma:

    {
      "grupos": [
        { "id": "g...", "nombre": "Equipo directivo",
          "miembros": [ { "categoria": "PERSONAL", "nombre": "..." } ],
          "creadoPor": "...", "creadoEl": "2026-09-17T09:14:00" }
      ]
    }

**Dónde se manejan.** Bloque propio en Ajustes, "Grupos", con la misma rejilla y el mismo aire que
los bloques que ya hay allí (tipos de asunto, estados, tipos de documento). Alta, cambiar el
nombre, añadir y quitar miembros —con el buscador del punto 1—, y borrar. **Borrar un grupo pasa por
la papelera** (`Papelera.mandarDato`), como todo lo demás desde la fila 7.

**Personas que ya no están.** Un miembro que desaparece de las listas (un profesor que se va) no se
borra solo del grupo: se pinta en gris con la nota "ya no está en las listas", y hay un botón para
quitarlo. Nunca se toca un grupo sin que se lo manden.

**Usarlos.** En la pantalla de relacionados, encima de todo: `Meter un grupo entero [ desplegable ]`.
Al elegirlo, sus miembros quedan señalados en el modo del punto 1, no añadidos: se revisan y se
pulsa añadir.

## 4. Los grupos en el correo

En el cuadro de Correo (`js/correo.js`), un desplegable nuevo: `Añadir un grupo`. Con los grupos
propios y, para el alumnado, los mismos atajos de unidad, nivel y enseñanza del punto 2.

- Se meten los correos de los miembros que tengan correo.
- Los que no tengan correo no se pierden en silencio: debajo, una línea gris con su número y sus
  nombres: "4 no tienen correo: ...". Francisco decide qué hace con ellos.
- Direcciones repetidas, una sola vez.

**Copia oculta, siempre.** Decisión de Francisco, 17-sep-2026: cuando los destinatarios vienen de un
grupo, van **en copia oculta**, nunca a la vista. Si cada familia viera los correos de las demás
sería un problema de protección de datos en un centro educativo. Esto significa:

- El encargo que la aplicación deja para el recolector (`<id>.envio.json`, ver
  `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md`) gana un campo `cco`, con la lista de direcciones.
- En `apps-script/gestor-correos.gs`, `mandarUnBorrador` pasa ese campo a Gmail como `bcc` en las
  opciones de `createDraft` y de `createDraftReply`.
- En pantalla se ve claro: los destinatarios de un grupo salen en un renglón rotulado **Copia
  oculta**, separado del renglón de Para, con su cuenta.
- Si el correo no lleva ningún destinatario en Para, se pone la propia dirección de Francisco, que
  es lo que hace todo el mundo con un envío en copia oculta. Gmail no admite un borrador sin nadie
  en Para.
- Sigue siendo un **borrador**: nada se envía solo, como hasta hoy.

Esto toca el script de Apps Script. Al terminar hay que decirle a Francisco que vuelva a pegarlo en
`script.google.com`; si esta fila y la 18 se hacen en la misma vuelta, con pegarlo una sola vez al
final basta, y así hay que decírselo.

## 5. Lo que no se hace

- Ningún grupo se recalcula solo dentro de un asunto. Lo que se guarda en `ficha.relacionados` son
  las personas, una por una, como hoy: `{ categoria, nombre }`. Un asunto no guarda "3ºB", porque
  el alumnado de 3ºB cambia y el asunto no debe cambiar con él.
- No se toca la nota que cada relacionado recibe al archivar (fila 4). Lo de esta fila es solo la
  manera de elegirlos.
- No se manda ningún correo de verdad, ni se envía nada sin borrador.

## 6. Pruebas

Fichero nuevo `pruebas/grupos.mjs`:

1. `Nombres.nivelYEnsenanza` con unidades reales de Séneca: E.S.O., Bachillerato y un ciclo
   formativo.
2. Un nivel junta las unidades de ese nivel y ninguna más.
3. Una enseñanza junta todos sus niveles.
4. El alumnado no matriculado este curso no entra en los atajos.
5. Lo señalado no se pierde al cambiar de búsqueda ni de categoría.
6. Añadir un grupo no mete dos veces a quien ya estaba en los relacionados.
7. Un miembro que ya no está en las listas se marca, y no se borra del grupo.
8. Los correos del grupo van en `cco`, sin repetidos, y los que no tienen correo se devuelven
   aparte para poder avisar.

La batería completa (`npm test`) tiene que quedar en verde.

## 7. Al terminar

- `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md`: sustituir la línea de los ficheros compartidos
  (ahora son trece) y la de los relacionados. No añadir líneas debajo de las viejas.
- `docs/HISTORIA.md`: esto, y la decisión de la copia oculta con su motivo.
- En `docs/PROXIMOS-ASUNTOS.md`, dejar dicho que el punto 3 se hace en esta fila, salvo
  departamentos, tutorías y equipos educativos, que esperan a tener los datos.
- Decirle a Francisco que tiene que volver a pegar el script (ver el punto 4).
