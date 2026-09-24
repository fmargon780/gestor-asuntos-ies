# Renuncia a formar parte de la Junta Electoral

Fila 124 de `docs/COLA.md`. Diseñado y cerrado con Francisco el 24-sep-2026.

## Por qué

En el sorteo de la Junta Electoral de las elecciones al Consejo Escolar (24-sep-2026), la madre
elegida como titular del sector de familias dijo que no podía formar parte por motivos laborales.
Hubo que hacer a mano un escrito de renuncia para que ella lo firmara y quedara constancia en el
centro. Francisco quiere que la próxima vez salga desde la app.

## Qué hay que hacer

### 1. Plantilla de Word nueva del centro

Añadir a `plantillas/` una plantilla de documento, igual que las demás (`.md` + `.docx`, y su
entrada en `plantillas/indice.json`):

- **Nombre:** «Renuncia a formar parte de la Junta Electoral».
- **Categoría / tipo de asunto:** `OTROS` / `ELECCIONES CONSEJO ESCOLAR` (el tipo ya existe en
  `datos-biblioteca/biblioteca-centro.json`).
- **tipoDocumento:** `RENUNCIA`. **texto:** `junta electoral`.
- **firmante:** vacío o el que permita el formato (la firma es de la persona que renuncia, no de
  un cargo). **vistoBueno:** vacío. Si el formato obliga a un firmante de cargo, que no se pinte
  la firma del cargo en el cuerpo: el documento lo firma la interesada.
- **Destinatario al pie:** «SR./SRA. DIRECTOR/A DEL CENTRO, PRESIDENTE/A DE LA JUNTA ELECTORAL».

**Lo que rellena la app** (huecos que ya existen): `{{MEMBRETE}}`, nombre del centro, curso
académico, lugar y fecha.

**Lo que va en blanco**, para rellenar a mano (el asunto es del centro, no de quien renuncia, así
que la app no sabe quién es): apellidos y nombre, DNI/NIE, sector (con las cuatro casillas:
padres y madres del alumnado / profesorado / alumnado / personal de administración y servicios),
número de censo, designación (casillas: titular / suplente 1, 2 o 3), alumno/a del que es
madre/padre/tutor (solo sector familias), teléfono o correo.

**Cuerpo** (modelo: el escrito que se hizo a mano el 24-sep-2026):

- **EXPONE:** que en el sorteo público celebrado el día ___ para designar a los miembros de la
  Junta Electoral del proceso de elección de representantes del Consejo Escolar de este centro,
  ha resultado designado/a como miembro del sector indicado arriba; y que, por el motivo que
  indica, no puede asistir a las reuniones ni atender las funciones de la Junta Electoral.
  Motivo: casillas «laboral» / «otro: ____».
- **SOLICITA:** que se tenga por presentada su renuncia y se le sustituya por el suplente que
  corresponda según el orden del acta del sorteo.
- Lugar y fecha, «Firma de la persona interesada» y «Fdo.: ______».

**Recuadro final «A cumplimentar por el centro»**, en dos columnas: registro de entrada (número,
fecha, sello) y sustitución («Pasa a ser titular: ______, nº de censo ___. Comunicado el ___»).

Todo en **una sola hoja A4**.

### 2. Asociarla al hito

En `datos-biblioteca/biblioteca-centro.json`, paso `b260` («Constituir la Junta Electoral») de la
guía «Elecciones al Consejo Escolar»:

- Añadir la plantilla nueva a `plantillasDocumento` (con el `id` que le toque según cómo se asignan
  al cargar las plantillas del centro; si el `id` solo existe tras «Cargar las plantillas del
  centro», resolverlo como ya se haga con las demás plantillas asociadas a pasos).
- Añadir al `guion`, **después** de g1 («Comprobar quién forma la Junta Electoral») y antes de la
  convocatoria, una línea nueva: «Recoger las renuncias y avisar al suplente que corresponda», con
  `accion: "generar"`.

Que llegue a los asuntos ya abiertos por el camino que ya existe (los pasos nuevos de una guía
llegan a los asuntos abiertos de su tipo; botones de Mantenimiento para traer guiones).

## Ficheros que se tocan

- `plantillas/renuncia-junta-electoral.md` (nuevo)
- `plantillas/renuncia-junta-electoral.docx` (nuevo)
- `plantillas/indice.json`
- `datos-biblioteca/biblioteca-centro.json` (solo el paso `b260`)
- Documentación de cierre: `docs/COLA.md`, `docs/CONTEXTO-CORTO.md` (solo si cambia alguna línea),
  `docs/HISTORIA.md`.

## Cómo trabajar

- Subir directamente a `main`, **sin abrir ninguna pull request**.
- Cambios quirúrgicos: no reescribir `biblioteca-centro.json` entero a mano (es grande); editarlo
  con un script que lea y escriba el JSON.
- No leer el repositorio entero: basta con `plantillas/`, `js/plantillas-documento.js`,
  `js/guias-documentos.js` y `docs/contexto/CORREO-Y-SENECA.md`.
- Una sola prueba al final: `pruebas/plantillas-del-centro.mjs` en verde y el `.docx` convertido a
  PDF para ver que cabe en una hoja.

## Qué verá Francisco

En Ajustes → Mantenimiento, tras «Cargar las plantillas del centro», en un asunto de Elecciones al
Consejo Escolar, al abrir el hito «Constituir la Junta Electoral» aparece la plantilla de renuncia
con «Generar documento», y en la lista de tareas del hito la línea de recoger renuncias.
