# Ajustes plegado: ver solo lo que se está tocando

Instrucción para Claude Code. Fila 105 de `docs/COLA.md`. Cerrada con Francisco el 23-sep-2026.

Lee antes `docs/CONTEXTO-CORTO.md` y `docs/contexto/CAMPOS-Y-TIPOS.md` (apartado "Ajustes: tres
pestañas, y la pantalla propia de un tipo"). **No leas el repositorio entero**: basta con los
ficheros de la lista de abajo. No le preguntes nada a Francisco: decide, apunta la decisión en
`docs/contexto/CAMPOS-Y-TIPOS.md` y sigue.

## El problema

Francisco dice que la zona de Ajustes está complicada: aparecen demasiadas cosas a la vez. La
pantalla de cada tipo de asunto enseña sus ocho secciones siempre abiertas. "El centro" tiene
ocho bloques. "Mantenimiento" mezcla lo de uso normal con avisos de fallos que casi nunca hay.

## La regla, para las tres zonas

1. **Todo nace plegado.** Cada sección o bloque es una línea con su título.
2. **El título dice lo que hay dentro, sin abrirlo.** Un resumen corto al lado del nombre. Ejemplos
   más abajo. El resumen se pone al día en cuanto se guarda algo dentro de esa sección.
3. **Si dentro hay un aviso, el título lo dice**, en ámbar (por ejemplo "⚠ 1 paso desactualizado"
   en Pasos del trámite). Un problema nunca queda escondido por estar plegado.
4. **Se recuerda lo que se dejó abierto**, en este ordenador (`localStorage`, clave
   `gestor-ajustes-plegado`, un objeto `{ idDeSeccion: true }`). En la pantalla de un tipo se
   recuerda por sección, no por tipo: si dejas abierto "Campos", al entrar en otro tipo "Campos"
   sale abierto también. La primera vez, todo plegado.
5. Usa el mismo elemento que ya usa "El centro" (`<details class="bloque-ajustes">`), para que las
   tres zonas se vean y se comporten igual. Pulsar en cualquier sitio del título abre y cierra.

## 1. La pantalla de un tipo de asunto (`#pantalla-tipo-asunto`)

Las ocho secciones pasan a plegables, en el mismo orden y en las mismas dos columnas. Resúmenes:

| Sección | Resumen en el título |
|---|---|
| Datos del tipo | categoría · nombre corto (si lo tiene) |
| Campos | número de campos, o "ninguno" |
| Pasos del trámite | número de pasos, o "sin guía"; aviso ámbar si hay pasos desactualizados |
| Plantillas de correo y de Séneca | número, o "ninguna" |
| Plantilla de documento de Word | número, o "ninguna" |
| Plazo | "N días" o "sin plazo" |
| Palabras clave | número, o "ninguna" |
| Se repite | "no", o cada cuánto |

Hasta ahora, al abrir un tipo la sección "Campos" salía desplegada. Eso se quita: manda la regla 4.

`js/ajustes-tipo.js` ya pasa de 400 líneas: **no lo engordes**. Lo nuevo (montar el plegable,
calcular resúmenes, recordar lo abierto) va en un fichero nuevo, `js/ajustes-plegado.js`, que
sirve a las tres zonas. En `js/ajustes-tipo.js`, solo las pocas líneas que llamen a ese fichero.

## 2. La pestaña "El centro"

Todos los bloques plegados, con su resumen. Nuevo orden, de más a menos uso:

1. Estados del asunto — número de estados.
2. Tipos de documento — número.
3. Grupos de personas — número.
4. Campos propios — número.
5. Hitos (responsables y días no lectivos) — "N responsables · N días no lectivos".
6. Datos del centro y firma — "completos", o "faltan N datos" en ámbar.
7. Cómo se abrevia cada grupo — número.
8. Ficheros de datos — "N cargados", o en ámbar cuál falta.

Si un bloque no tiene forma sencilla de contar lo que lleva, pon solo el título: mejor sin resumen
que con uno que engañe.

## 3. La pestaña "Mantenimiento"

**Los avisos de fallo solo aparecen cuando hay un fallo.** Son tres: conflictos de Dropbox
(`js/conflictos.js`), fichas sin carpeta (`js/fichas-huerfanas.js`) y RegAlum.csv viejo
(`js/frescura.js`). Si no hay nada, el bloque no se ve en absoluto. Si hay algo, sale **arriba del
todo, desplegado**, en ámbar.

Hazlo desde `js/ajustes-mantenimiento.js` o `js/ajustes-plegado.js`, mirando si el bloque trae
contenido, sin tocar esos tres módulos por dentro. Solo si no hay otra forma, una línea en el
módulo que haga falta.

Lo demás, plegado y con resumen:

| Bloque | Resumen |
|---|---|
| Carpetas de este ordenador | "N señaladas", o en ámbar cuál falta |
| Carpeta de la bandeja de correo | "señalada" o "sin señalar" |
| Copias de seguridad | fecha de la última copia |
| Papelera | "N cosas"; en ámbar "N de más de 30 días" si las hay |
| Avisos de vencimiento | lo que esté configurado, en pocas palabras |
| Duplicados descartados | número |

Los botones sueltos de la pestaña (cargar tipos y guías del instituto, cargar plantillas, poner en
orden las fichas del ARCHIVO, guardar el contacto de los asuntos abiertos…) van juntos dentro de
un bloque plegado "Herramientas", al final.

## Lo que no se toca

- La pestaña "Tipos de asunto" (pestañas de categoría, buscador y rejilla de tarjetas) se queda
  como está.
- Ninguna lógica de guardado. Solo cambia cómo se enseña.
- El tablón y el resto de pantallas.

## Ficheros que se tocan

- `js/ajustes-plegado.js` (nuevo).
- `js/ajustes-tipo.js` (pocas líneas).
- `js/ajustes-centro.js` (orden y resúmenes).
- `js/ajustes-mantenimiento.js` (avisos que solo salen con fallo, bloque Herramientas).
- `index.html` (el `<script>` nuevo, después de `js/ajustes-mantenimiento.js`; y quitar `open` de
  los `<details>` de Ajustes si lo llevan).
- `css/ajustes.css` (el título con su resumen y el ámbar).
- `js/version.js` (la versión, con la hora del reloj de verdad, como dice la regla 4 de la cola).
- `pruebas/ajustes-plegado.mjs` (nueva).
- `pruebas/ajustes-por-tipo.mjs` y `pruebas/ajustes-agil.mjs`, solo si se rompen porque ahora
  hay que desplegar una sección antes de tocarla.
- Documentación: `docs/contexto/CAMPOS-Y-TIPOS.md` (sustituir la frase "ocho secciones siempre
  desplegadas" y lo que deje de ser verdad), `docs/CONTEXTO-CORTO.md` (la línea de Ajustes de la
  sección 5), `docs/HISTORIA.md` y `docs/COLA.md`.

## Cómo se trabaja

- **Sube directamente a `main`, sin abrir ninguna pull request.** Si la sesión no deja tocar
  `main`, abre la pull request y fusiónala tú en cuanto esté en verde (permiso permanente de
  Francisco, nota al final de `docs/COLA.md`).
- **Cambios quirúrgicos**: no reescribas ficheros enteros.
- Antes de colgar una función nueva de `App`, comprueba que el nombre no está cogido.
- Respeta las reglas 10 a 18 de `docs/COLA.md` al subir.

## La prueba (una sola, al final)

`pruebas/ajustes-plegado.mjs`, en navegador de verdad:

- Al abrir un tipo, las ocho secciones salen plegadas y cada título lleva su resumen correcto
  (un tipo con 2 campos dice "2"; uno sin plazo dice "sin plazo").
- Se despliega "Campos", se sale, se entra en otro tipo: "Campos" sale desplegada.
- Se añade un campo y se guarda: el resumen pasa de 2 a 3 sin salir de la pantalla.
- Un paso desactualizado pone el aviso ámbar en el título de "Pasos del trámite", aun plegado.
- "El centro": bloques plegados, en el orden nuevo.
- "Mantenimiento": sin conflictos ni fichas sin carpeta, esos bloques no se ven; con una ficha
  sin carpeta de mentira, su bloque sale arriba y desplegado.

Comprueba que la prueba falla sin el cambio. Después, `npm test` completo en verde.

## Al terminar

Mensaje a Francisco, tres frases: la versión publicada, y que en Ajustes todo sale plegado con un
resumen en cada título, y que los avisos de fallo de Mantenimiento solo aparecen cuando hay uno.
