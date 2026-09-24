# Un tipo que cambia de nombre se lleva todo lo suyo, y cualquier plantilla desde cualquier hito (fila 126)

Cerrado con Francisco el 24-sep-2026.

## Qué ha pasado (caso real)

Francisco tenía el tipo `DESEMPEÑO FUNCIÓN TUTORIAL` (sin nombre corto), con su guía de cinco pasos
y la plantilla «Certificado de función tutorial» unida al paso «Confección del Certificado». La fila
123 metió en `datos-biblioteca/biblioteca-centro.json` la entrada `{ nombreCorto: 'DESEMPEÑO FUNCIÓN
TUTORIAL', nombreLargo: 'Certificado de desempeño de la función tutorial', nuevo: false }`. Al pulsar
«Cargar la biblioteca del centro», `fusionarTipos` (`js/cargar-biblioteca.js`, rama `existente`)
**renombró** el tipo: `tipo` pasó a ser el nombre largo y `nombreCorto` el viejo. Pero lo que cuelga
del tipo por su nombre **se quedó con el nombre viejo**:

- la guía (guías por tipo, `GuiasDelCentro.pasosDe(tipo)` busca por clave exacta): la ficha del
  asunto ofrece «Escribir la guía de Certificado de desempeño de la función tutorial», que está
  vacía, y la guía buena sigue bajo `DESEMPEÑO FUNCIÓN TUTORIAL`;
- por eso `HitosGenerar.idsDelPaso` no encuentra el paso y la mesa del hito no enseña la plantilla;
- las plantillas (`p.tipo` = `DESEMPEÑO FUNCIÓN TUTORIAL`) tampoco salen en «Otras plantillas»,
  porque `Plantillas.documentosDeTipo` compara con el tipo del asunto y no mira nombre corto ni alias.

`App.renombrarTipo` (`js/ajustes.js`) tiene el mismo hueco: renombra carpetas y fichas, apunta el
alias, pero no mueve guía, campos, plantillas ni lo demás que va por nombre de tipo.

## Qué hay que hacer

### 1. Un solo sitio que cambia el nombre de un tipo y se lo lleva todo

Función nueva (p. ej. `TiposNombre.cambiar(tipo, nombreNuevo)`, fichero nuevo `js/tipos-nombre.js`)
que usan **los dos caminos**: `App.renombrarTipo` y la rama `existente` de `fusionarTipos`. Mueve de
la clave vieja a la nueva **todo lo que se guarda por nombre de tipo**: guía (conservando los `id`
de los pasos, para que los hitos de los asuntos vivos sigan casando por `origenGuia`), campos
propios y calculados, plantillas de documento y de correo (`p.tipo`), recurrentes, formularios del
tipo, palabras clave, y cualquier otro fichero de `_GESTOR` que indexe por tipo (buscarlos todos en
`docs/contexto/CAMPOS-Y-TIPOS.md` y `docs/contexto/HITOS-Y-GUIAS.md`; no dejarse ninguno). Guarda
el nombre viejo en `alias`.

Si la clave nueva ya tiene algo (p. ej. una guía vacía creada al abrir la pantalla): si está vacío,
se sustituye; si los dos tienen contenido, se queda el que más tenga (más pasos, más campos) y el
otro va a la papelera, nunca se borra sin más.

### 2. Arreglo solo, al arrancar, de lo que ya se ha quedado atrás

Al cargar los tipos, para cada tipo, si hay guía, campos o plantillas guardados bajo su
`nombreCorto` o bajo alguno de sus `alias` (y no bajo `tipo`), se mueven con la misma función, una
sola vez, sin preguntar, y sale un aviso verde: «He juntado con su tipo la guía de "…"». Así el
caso de Francisco se arregla solo al recargar, sin tocar nada.

### 3. Casar las plantillas con el tipo por cualquiera de sus nombres

`Plantillas.documentosDeTipo` (y el equivalente de correo) casa si `p.tipo`, normalizado, es igual
al `tipo`, al `nombreCorto` o a cualquier `alias` del tipo del asunto.

### 4. La carga de plantillas del centro no duplica

`cargarPlantillasDelCentro` (`js/plantillas-documento.js`): si ya hay una plantilla con el mismo
`nombre` y el mismo `fichero` aunque con otro `tipo`, se le cambia el tipo al del índice en vez de
añadir otra. Y, una vez, quitar los duplicados que ya existan con mismo `nombre` y `fichero` (se
queda la que esté unida a algún paso de guía; la otra, a la papelera). Hoy Francisco tiene
«Certificado de función tutorial» dos veces (una con `CERTIFICADO PERSONAL`, de la fila 110).

### 5. Cualquier plantilla desde cualquier hito

En la mesa del hito, bloque «Formularios y plantillas de este hito» (`js/hito-mesa-documentos.js`,
`pintarPlantillas`), debajo de las del paso y de «Otras plantillas» del tipo, un enlace **«Buscar
otra plantilla…»** que abre, en el mismo sitio (no un segundo cuadro), un buscador con **todas** las
plantillas de documento del centro, de cualquier tipo y categoría, filtrando al escribir. Pulsar
una la genera para este asunto y la apunta a este hito, igual que las demás
(`PlantillasDocumento.generar(a, p, 'abierto', { hito: h })`). Los huecos que no tengan dato salen
en amarillo como siempre. El botón «Generar documento» de la cabecera del hito ofrece lo mismo.

## Ficheros que se tocan

`js/tipos-nombre.js` (nuevo), `js/ajustes.js` (`App.renombrarTipo`), `js/cargar-biblioteca.js`
(`fusionarTipos`), el punto donde se cargan los tipos al arrancar (para el arreglo del punto 2),
`js/plantillas.js` (`documentosDeTipo`), `js/plantillas-documento.js` (`cargarPlantillasDelCentro`),
`js/hito-mesa-documentos.js`, `js/hitos-generar.js`, `index.html`, `pruebas/tipos-nombre.mjs`
(nueva) y la documentación de siempre.

## Cómo trabajar

- **No leas el repositorio entero**: estos ficheros y los hijos de `docs/contexto/` citados.
- Cambios quirúrgicos; partir en dos cualquier fichero que haya que tocar y pase de unas 400 líneas.
- Todo guardado de `_GESTOR` por la cola de siempre (`ColaGuardado`).
- **Una sola prueba al final**, `pruebas/tipos-nombre.mjs`: renombrar un tipo con guía, campos y
  plantilla unida a un paso → todo sigue en el tipo y la mesa del hito de un asunto vivo enseña la
  plantilla; el caso real (guía bajo el nombre corto, tipo ya renombrado) se arregla solo al
  arrancar; la carga de plantillas no duplica; «Buscar otra plantilla…» encuentra una de otro tipo y
  la genera. Datos inventados. `npm test` entero en verde.
- **Sube directamente a `main`, sin abrir ninguna pull request** (si la sesión lo obliga, la fusiona
  sola en cuanto esté en verde). Regla 13 de la cola. Comprobar lo publicado con `curl`.

## Qué verá Francisco

- Al recargar la app, un aviso verde: la guía de su tipo vuelve a su sitio. En el asunto de
  DESEMPEÑO FUNCIÓN TUTORIAL, el hito «Confección del Certificado» ya enseña la plantilla.
- En cualquier hito, «Buscar otra plantilla…» para sacar cualquier documento del centro.
