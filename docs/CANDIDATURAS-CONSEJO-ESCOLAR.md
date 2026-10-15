# Candidaturas a las elecciones al Consejo Escolar

Fila 347 de `docs/COLA.md`. Idea 347 de Francisco (15-oct-2026), diseñada con él ese mismo día.

## De dónde sale esto

Hay elecciones al Consejo Escolar y empiezan a llegar las solicitudes de candidatura de los cuatro
sectores: alumnado, madres y padres (tutores legales), profesorado y PAS. Francisco dudaba entre un
asunto por candidato o uno solo para todas. Decidido con él:

- **Un solo asunto por convocatoria** («Elecciones al Consejo Escolar 2026»), con todas las
  candidaturas dentro, de cualquier sector. Nada de un asunto por candidato.
- Al guardar una solicitud en ese asunto, la app pregunta **de quién es**; esa persona queda
  relacionada con el asunto y su sector se apunta solo.
- Una tarjeta **«Candidaturas»** en la ficha del asunto, por sectores, con estado de cada una y un
  botón que saca en PDF la lista provisional o definitiva para el tablón.
- Los pasos del proceso (plazos, reclamaciones, votación) los escribe Francisco en la guía del tipo,
  como en cualquier otro. Esta fila no crea ninguna guía.

## Lo que se pide

### 1. La marca del tipo

- En Ajustes, en la pantalla de un tipo de asunto, una casilla **«Lleva candidaturas»**
  (`tipo.candidaturas: true`), en la misma sección donde vive «Es de actividades» de la fila 306
  (o la que más se le parezca). Sigue el mismo patrón que `actividades: true`.
- Un asunto de un tipo con la marca es un asunto de grupo: sus personas son `ficha.relacionados`,
  y estas pueden ser **de cualquier categoría** (alumnado, tutores legales, personal). Si hoy los
  relacionados de un asunto solo admiten una categoría, se amplía para estos asuntos.
- El tercero del asunto puede ser el propio centro o un grupo; no importa para esta fila.
- No se crea ningún tipo solo: Francisco lo crea («Buscar o crear» de Ajustes) y marca la casilla.

### 2. Guardar una solicitud: «¿De quién es esta candidatura?»

- Cuando un documento **entra** en un asunto de un tipo con la marca (cuadro de nombre en modo
  `anadir` o `ponerNombre`: desde «Ver todo» con «Guardar aquí», desde la bandeja de Gmail, o
  añadiendo un fichero en la ficha), el cuadro lleva arriba un campo **«¿De quién es esta
  candidatura?»** con el buscador único de personas de «Nuevo asunto» (todas las categorías).
- La app propone a la persona si la reconoce en lo leído del documento (como ya hace la bandeja);
  si no, el campo queda vacío.
- El campo se puede dejar vacío con «No es una candidatura» (por ejemplo, un acta o una
  reclamación): entonces el documento se guarda como hoy, sin más.
- Al elegir a la persona y guardar:
  - queda añadida a `ficha.relacionados` (si ya estaba, no se duplica);
  - se apunta su candidatura en `ficha.candidaturas` (ver punto 4) con estado «Presentada», el
    documento, la fecha y el registro de entrada que lleve el cuadro de nombre;
  - el **sector** se pone solo: alumnado → «Alumnado»; tutor legal → «Madres y padres»; personal
    docente → «Profesorado»; personal no docente → «PAS» (usar la clase de personal de `Datos`,
    nunca abrir el `RelPerCen` por otro lado). Si la persona es de una categoría que no encaja
    (empresa, Administración), avisa en ámbar y deja elegir el sector a mano.
- Si una persona ya tiene candidatura en este asunto, el aviso en ámbar «Ya tiene candidatura» deja
  guardar el documento como un papel más de su candidatura (no crea otra).
- Tipo de documento por defecto en este campo: **SOLICITUD DE CANDIDATURA** (se crea solo si no
  existe, nombre corto `CANDIDATURA`), cambiable como siempre.

### 3. La tarjeta «Candidaturas»

- En la ficha de un asunto de un tipo con la marca, una tarjeta **«Candidaturas»**, con resumen
  plegado «N candidaturas · Alumnado N · Madres y padres N · Profesorado N · PAS N».
- Abierta: cuatro bloques, uno por sector, en orden alfabético de apellidos. Cada fila: nombre,
  fecha y registro de entrada, documento (se abre al pulsar) y **estado**:
  - «Presentada» (al entrar);
  - «Admitida»;
  - «Excluida», que pide el **motivo** (texto) y lo enseña en la fila;
  - «Retirada» (renuncia del candidato).
  El estado se cambia con un desplegable en la propia fila; se guarda al cambiar, sin botón.
- En cada fila, ⋮ con «Cambiar el sector», «Quitar la candidatura» (pregunta antes; la persona
  sigue relacionada y el documento sigue en el asunto) y «Ver su ficha».
- «+ Añadir candidatura» en el título de la tarjeta: abre el mismo buscador para apuntar una
  candidatura sin documento (llegó en papel y aún no se ha escaneado).

### 4. Dónde se guarda

- `ficha.candidaturas = [{ id, persona: { categoria, nombre, clave }, sector, estado, motivo,
  documentos: [nombre de fichero], fecha, registro, creadaPor/El, cambiadaPor/El }]`, en
  `asuntos.json`. Se funde por elemento con `App.anotarLista` (regla de la sección 6 de
  `docs/CONTEXTO-CORTO.md`), nunca sustituyendo la lista entera. Añádela a las listas que ya
  maneja `App.anotarLista` y a las lápidas de `borrados-listas.json` si hace falta.
- Si el documento cambia de nombre o se lleva a la papelera, la candidatura lo sigue o lo pierde
  como hacen los hitos con sus documentos.

### 5. La lista en PDF para el tablón

- Botón **«Lista de candidaturas ▾»** en la tarjeta, con «Provisional» y «Definitiva».
- PDF con membrete de la Junta (como la liquidación de la fila 249, `pdf-lib`): título «Lista
  provisional (o definitiva) de candidaturas — Elecciones al Consejo Escolar», el nombre del
  centro, y un bloque por sector, en orden alfabético de apellidos.
  - Provisional: admitidas y presentadas en la lista de candidaturas; las excluidas, aparte al
    final de su sector, con el motivo.
  - Definitiva: solo admitidas; las excluidas, aparte con el motivo. Presentadas sin resolver no
    salen y, si queda alguna, la app avisa antes «Hay N candidaturas sin resolver».
  - Las retiradas no salen en ninguna.
  - Al pie: localidad y fecha, y firma de quien ocupe la Presidencia de la Junta Electoral si existe
    ese cargo en `cargos.json`; si no, la de Dirección.
  - Solo nombre y apellidos; ni DNI ni Nº escolar (es para el tablón).
- Se guarda en el asunto como `AAMMDD LISTA CANDIDATURAS D26-….pdf` (tipo de documento LISTA DE
  CANDIDATURAS, se crea solo si no existe) y se abre en el visor, con «Imprimir».

### 6. En la ficha de la persona

- En «Sus asuntos» de la ficha de cada candidato sale el asunto de las elecciones (ya ocurre con
  los relacionados; comprobarlo), y junto a él su estado de candidatura.

## Qué ficheros tocar

- Un módulo nuevo `js/candidaturas.js` (`Candidaturas`): la tarjeta, los estados y los datos;
  y otro `js/candidaturas-lista.js` para el PDF. Ninguno pasa de 600 líneas.
- El cuadro de nombre del documento: enganchar el campo «¿De quién es esta candidatura?» por un
  punto previsto; si no lo hay, crear uno, no envolver.
- La pantalla del tipo en Ajustes: la casilla.
- `js/novedades.js`: una línea (cambia lo que se ve).
- `docs/contexto/` que toque (asuntos de grupo / actividades) y `docs/CONTEXTO-CORTO.md`, sección 5.
- Textos de pantalla con `docs/VOCABULARIO.md`; añadir allí «candidatura» y «sector» si no están.

## Reglas de trabajo

- Las de `CLAUDE.md`: rama `fila-347`, revisor en local, fusión en `main` y una sola publicación a
  propósito.
- Todo cuadro nuevo con la regla común de la fila 341 (cabecera y pie fijos).
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leas el repositorio entero: `docs/CONTEXTO.md`, los hijos de `docs/contexto/` de asuntos de
  grupo, personas y actividades, `docs/ACTIVIDADES-EXTRAESCOLARES.md` si existe, `docs/POR-LIQUIDAR.md`
  (para el PDF) y los ficheros de esta lista.
- Pruebas: mientras trabajas, `node pruebas/ejecutar.mjs candidaturas`; la pasada completa, una vez
  al final.

## La prueba

`pruebas/candidaturas.mjs`, con navegador y el disco de mentira:

- Crear un tipo «Elecciones Consejo Escolar» con «Lleva candidaturas» y un asunto de ese tipo.
- Guardar cuatro documentos en el asunto eligiendo en «¿De quién es esta candidatura?» un alumno,
  un tutor legal, un docente y un no docente: quedan relacionados y cada uno en su sector.
- Guardar un quinto documento con «No es una candidatura»: no crea candidatura.
- Guardar otro documento del mismo alumno: aviso «Ya tiene candidatura» y no se crea una segunda.
- Cambiar estados: una admitida, una excluida con motivo, una retirada, una presentada.
- Lista provisional: salen admitida y presentada, la excluida aparte con su motivo, la retirada no.
- Lista definitiva: avisa de 1 sin resolver; sale solo la admitida y la excluida aparte.
- El PDF queda guardado en el asunto y no lleva DNI ni Nº escolar.
- Un asunto de un tipo sin la marca no enseña ni la tarjeta ni el campo del cuadro de nombre.

## Para Francisco al terminar

Lo que va a ver: en Ajustes, en un tipo de asunto, la casilla «Lleva candidaturas». En los asuntos
de ese tipo, al guardar un documento la app pregunta de quién es la candidatura, y en la ficha hay
una tarjeta «Candidaturas» por sectores, con su estado y el botón de la lista para el tablón.
Lo que le toca: crear el tipo de las elecciones, marcar la casilla y crear el asunto.

## Cómo sabemos que está bien

1. En la demo, en Ajustes, un tipo de asunto tiene la casilla «Lleva candidaturas» y se guarda al
   marcarla.
2. En un asunto de ese tipo, al guardar un documento sale «¿De quién es esta candidatura?» con el
   buscador de todas las categorías.
3. Al elegir a un alumno, un tutor legal, un docente y un no docente, cada uno queda relacionado
   con el asunto y en la tarjeta «Candidaturas» bajo su sector (Alumnado, Madres y padres,
   Profesorado, PAS).
4. «No es una candidatura» guarda el documento sin crear candidatura; una segunda solicitud de la
   misma persona no crea otra.
5. El estado de cada candidatura se cambia en su fila; «Excluida» pide motivo y lo enseña.
6. «Lista de candidaturas ▾ → Provisional» y «→ Definitiva» sacan el PDF con las reglas del punto 5,
   lo guardan en el asunto y no llevan DNI ni Nº escolar.
7. En un asunto de un tipo sin la casilla no cambia nada.
