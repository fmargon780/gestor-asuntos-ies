# Fila 170 · Las plantillas sacadas de los documentos del compañero

Acordado con Francisco el 25-sep-2026: Claude escribe las plantillas con lo que estime
necesario y Francisco las corrige con el uso. **Sube directamente a `main`, sin abrir ninguna
petición de cambios.** Cambios quirúrgicos, sin leer el repositorio entero, y una sola pasada de
pruebas al final.

Lee antes `docs/CONTEXTO.md`, `docs/contexto/DOCUMENTOS-PDF.md`,
`docs/contexto/CORREO-Y-SENECA.md` y `docs/PLANTILLAS-DEL-CENTRO.md` (fila 83: formato de los
`.md`, el script y el botón «Cargar las plantillas del centro»).

## Por qué

El compañero administrativo emitía sus documentos reutilizando la última copia de Word. Se han
leído unos 1.035 ficheros suyos y se han reducido a plantillas. El análisis completo está en el
proyecto de Claude («Plantillas del compañero»); lo que hace falta para programar está aquí.

## Parte 1 · Pasar las plantillas a `plantillas/`

`docs/plantillas-nuevas/generar.py` escribe **50 ficheros ya en el formato de `plantillas/`**:
34 de documento y 16 de correo (los que empiezan por `correo-`). Va como script para no subir
cincuenta ficheros sueltos desde la conversación.

1. Desde la raíz del repositorio, `python3 docs/plantillas-nuevas/generar.py`: deja los 50 `.md`
   en `plantillas/`. Después borra la carpeta `docs/plantillas-nuevas/`.
2. `node scripts/hacer-plantillas.mjs` para crear los `.docx` y rehacer `plantillas/indice.json`.
3. **Ya se ha comprobado** (25-sep-2026, en una copia del repositorio) que todos los huecos
   `{{…}}` están en el catálogo y que `pruebas/plantillas-del-centro.mjs` sale en verde con ellos.
   No reescribas los textos: si algo no pasa, toca solo lo imprescindible y apúntalo en
   `docs/DATOS-QUE-FALTAN-EN-PLANTILLAS.md`.
4. En `plantillas/peticion-historial.md`, cambia `{campo:Centro de procedencia}` por
   `{{DATO ALUMNADO BD: Centro de procedencia}}` si la prueba lo admite. Si no, déjalo.
5. `participacion-actividad.md` (OTROS · ACTIVIDAD EXTRAESCOLAR) está pensada para la fila 171:
   sus huecos de persona saldrán de cada profesor relacionado. Hasta entonces se generaría con el
   tercero del asunto. La de PERSONAL · CERTIFICADO PERSONAL sirve ya para un profesor suelto.

## Parte 2 · Texto propio para Séneca en las plantillas de correo

Hoy la misma plantilla sirve para el correo y para el mensaje de Séneca. No vale: Séneca no
adjunta ficheros (fila 153), y el correo dice «le enviamos adjunto».

- Los correos nuevos traen, después del cuerpo, una línea `=== SÉNECA ===` y debajo el texto para
  Séneca.
- `scripts/hacer-plantillas.mjs`: parte el cuerpo por esa línea; lo de arriba es `cuerpo`, lo de
  abajo `cuerpoSeneca` en `plantillas/indice.json`. Sin la línea, no hay `cuerpoSeneca`.
- «Cargar las plantillas del centro» (`js/plantillas-centro.js`) lleva `cuerpoSeneca` a la fila de
  `plantillas.json` (campo nuevo `textoSeneca`, junto a `texto`).
- El cuadro de Séneca usa `textoSeneca` si lo hay; si no, `texto`, como hoy. El de correo no cambia.
- En Ajustes, el editor de una plantilla de correo enseña un segundo recuadro, plegado, «Texto
  para Séneca (opcional)». Mismo patrón que el editor de la fila 151.
- Prueba: añade a `pruebas/plantillas-del-centro.mjs` que un correo con la línea da los dos textos
  y que ninguno de los dos contiene `=== SÉNECA ===`.

## Parte 3 · Saludo y firma repetidos en los correos que ya había

La aplicación pone sola el saludo y la firma alrededor de la plantilla (`cuerpoDelMedio`). Los
cuatro correos que ya estaban en `plantillas/` (`comunicacion-baja.md`, `aviso-citacion.md`,
`reclamacion-proveedor.md`, `comunicacion-resolucion-permiso.md`) los llevan escritos, y salen
dos veces. Quítales la primera línea de saludo («Buenos días…») y el cierre («Un saludo.» y
`{{CENTRO}}`). Los nuevos ya vienen sin ellos.

Las plantillas ya cargadas en `_GESTOR` no se tocan (el botón no pisa): basta con el repositorio.

## Parte 4 · Tipos y campos nuevos en la biblioteca del centro

En `datos-biblioteca/biblioteca-centro.json`, sin tocar lo que ya hay:

- **Tipos nuevos** (con nombre corto y largo, como los demás):

  | Categoría | Tipo (corto) | Nombre largo | Quién lo encarga |
  |---|---|---|---|
  | ALUMNADO | JUSTIFICANTE ASISTENCIA | Justificante de asistencia de la familia al centro | Secretaría |
  | PERSONAL | AUTORIZACION | Autorización de la Dirección a una persona del centro | Dirección |
  | OTROS | OFERTA EDUCATIVA | Oferta educativa: materias de diseño propio y proyectos | Dirección |
  | OTROS | CERTIFICADO CENTRO | Certificado sobre datos del propio centro | Secretaría |

  Cada uno con una guía mínima de tres pasos, como los tipos sencillos que ya hay: preparar el
  documento, firma (los hitos «Firma de Secretaría» o «Visto bueno de Dirección» de la fila 159,
  según el firmante de su plantilla) y enviar.
- **Campos por tipo**: los de la sección 4 de `docs/DATOS-QUE-FALTAN-EN-PLANTILLAS.md`, todos de
  texto salvo los que empiezan por «Fecha» o «Día» (fecha). Con el nombre **exacto** que usa la
  plantilla (lo de entre paréntesis forma parte del nombre).
- Sube `version` de la biblioteca, para que «Cargar la biblioteca del centro» los traiga.

## Parte 5 · La Consejería por defecto

`{{CONSEJERIA}}` vale por defecto «Consejería de Educación». Cambia **solo el valor por defecto**
a «Consejería de Desarrollo Educativo y Formación Profesional». Lo que el centro tenga ya
guardado en Ajustes no se toca.

## Qué no se hace

- Nada de la sección 1, 2, 3 y 5 de `docs/DATOS-QUE-FALTAN-EN-PLANTILLAS.md` salvo lo dicho aquí:
  son decisiones de Francisco, pendientes.
- No se cambia el texto de las plantillas que ya existían, salvo la Parte 3.

## Ficheros que se tocan

`plantillas/` (50 `.md` nuevos, los de `generar.py`, sus `.docx`, `indice.json` y los 4 correos de la Parte 3),
`scripts/hacer-plantillas.mjs`, `js/plantillas-centro.js`, el módulo del cuadro de Séneca y el
editor de plantillas de Ajustes (búscalos en `docs/contexto/CORREO-Y-SENECA.md`), el fichero de
los valores por defecto de `plantillas.json` (donde viva `CONSEJERIA`),
`datos-biblioteca/biblioteca-centro.json`, `pruebas/plantillas-del-centro.mjs`.

## Al terminar

- `docs/CONTEXTO-CORTO.md`, sección 5: la línea de las plantillas dice que el centro tiene sus
  plantillas de documento y de correo (con texto propio para Séneca), sacadas de los documentos
  del compañero; y en la sección 8, «Cargar la biblioteca» y «Cargar plantillas» otra vez.
- `docs/contexto/CORREO-Y-SENECA.md` y `docs/contexto/DOCUMENTOS-PDF.md`.
- `docs/HISTORIA.md`: una entrada con fecha.
- Mensaje final a Francisco: que pulse, en Ajustes › Mantenimiento, «Cargar la biblioteca del
  centro» y después «Cargar las plantillas del centro».
