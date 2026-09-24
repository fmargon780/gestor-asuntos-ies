# Repartir un PDF entre terceros

Fila 141 de `docs/COLA.md`. Diseño cerrado con Francisco el 25-sep-2026.

## El caso que lo origina

A principio de curso, cada colegio de primaria adscrito entrega los cuestionarios de altas
capacidades del alumnado que viene a 1º de ESO. Hoy se hace un asunto cuyo tercero es el colegio,
y se registra en Séneca un oficio con la relación de documentos y un único PDF con todos los
cuestionarios. Falta que cada cuestionario acabe en el archivo de su alumno.

**El diseño es general**, no solo para estos cuestionarios: vale para cualquier PDF que agrupe
papeles de varias personas (informes de tránsito, justificantes de varios alumnos…).

## Qué tiene que ver Francisco

### 1. El botón

En el menú de cada PDF de la ficha de un asunto, junto a Separar, Unir, Sacar páginas y Ajustar
tamaño: **«Repartir entre terceros»**. Solo en la ficha de un asunto abierto; no en Por clasificar
ni en el ARCHIVO.

Si el asunto no tiene terceros relacionados, el cuadro lo dice arriba y deja seguir igual (se
buscan en todo el alumnado, ver el punto 4), con un enlace a añadir relacionados.

### 2. Dónde empieza cada trozo

Arriba del cuadro, dos datos:

- **«El primer trozo empieza en la página»** (por defecto, 1).
- **«Páginas de cada trozo»**. Valor propuesto: páginas desde esa hasta el final, dividido entre el
  número de terceros relacionados. Si la división no es exacta, aviso ámbar en una línea:
  «120 páginas no se reparten igual entre 29 personas: puede que falte o sobre un cuestionario».

Al cambiar cualquiera de los dos, la lista de trozos se recalcula sola.

Las páginas anteriores a la primera forman un trozo propio marcado **«Se queda en este asunto»**
(ver el punto 5).

### 3. La lista de trozos

Una fila por trozo, de arriba abajo:

- Miniaturas de sus páginas (pequeñas, pintadas a medida que se ven, como en Separar).
- «Páginas 3–6».
- Dos botones: **«+1 página»** y **«−1 página»**. Cambian dónde termina ese trozo; los trozos de
  debajo se recolocan solos. Un trozo nunca se queda en cero páginas; el último absorbe o suelta
  lo que sobre. Si al final sobran páginas, sale un trozo más sin asignar.
- El desplegable del tercero (punto 4).
- Su marca de lectura (punto 6).

### 4. El desplegable del tercero

- Enseña **solo los terceros relacionados del asunto**, en el orden en que están relacionados.
- Opción extra al principio: **«Se queda en este asunto»**.
- Al abrir el cuadro, la app asigna **por orden**: primer trozo, primer relacionado; y así. Si la
  lectura del texto (punto 6) encuentra un nombre, manda la lectura.
- Los terceros ya asignados a otro trozo salen **tachados** (se pueden elegir igual; entonces el
  otro trozo se queda sin asignar y en ámbar).
- Escribiendo en el desplegable se busca en **todo el alumnado** (el buscador de terceros de
  siempre). Si se elige a alguien de fuera, se añade también a los relacionados del asunto.

### 5. Lo que se queda en el asunto de origen (el oficio)

Un trozo con «Se queda en este asunto» se guarda como documento propio del asunto de origen, con
el nombre de siempre (`Nombres.montarDocumento`). Debajo de la lista se elige una vez su tipo de
documento (por ejemplo «OFICIO»). Mismo registro de Séneca y misma fecha que el PDF original.
Sirve igual para páginas sueltas en medio o al final (un índice, una hoja en blanco).

Los asuntos de cada persona **no** llevan copia de ese trozo.

### 6. Leer los nombres dentro del PDF

Solo si el PDF trae texto (hecho en ordenador). Nada de reconocimiento de escaneados.

- Con pdf.js, como `js/registro-lector.js`, se saca el texto de cada página del trozo.
- Se buscan en él **solo los terceros relacionados** del asunto.
- La comparación es tolerante: sin tildes ni mayúsculas; da igual el orden («Ana Pérez López» o
  «Pérez López, Ana»); vale sin el segundo apellido; «M.ª»/«Mª»/«M.» igual a «María».
- Tres marcas por trozo:
  - **Verde, «Leído del documento»**: aparece el Nº de identificación escolar, el DNI, o nombre y
    los dos apellidos. No hace falta revisarlo.
  - **Ámbar, «Revísalo»**: solo nombre y primer apellido, o dos personas posibles en el mismo
    trozo, o el trozo quedó sin asignar.
  - **Sin marca**: no se encontró a nadie; se asignó por orden.
- Si el PDF no tiene texto en ninguna página, una línea gris arriba: «Este PDF es escaneado: los
  trozos se han asignado por orden».

### 7. El tipo de asunto que se crea

Debajo de la lista, un desplegable: **«Crear para cada persona un asunto de tipo…»**, y otro:
**«Tipo de documento de cada trozo»**.

En la pantalla de cada tipo de asunto (Ajustes), un dato nuevo: **«Al repartir, crear asuntos de
tipo…»** (y su tipo de documento). Si el tipo del asunto de origen lo tiene, el cuadro sale ya con
esos dos valores. Ejemplo: tipo del colegio → «CUESTIONARIO DE ALTAS CAPACIDADES».

### 8. Antes de crear: el resumen

Botón **«Repartir»**. Antes de escribir nada, dentro del mismo cuadro (nunca un segundo diálogo):

- «Se van a crear N asuntos de tipo X, ya archivados, y M documentos se quedan en este asunto».
- En ámbar, cada tercero relacionado que **se ha quedado sin trozo**, por su nombre.
- En ámbar, cada persona que **ya tiene un asunto de ese mismo tipo** (abierto o archivado), con
  una casilla «Crear igual» marcada por defecto. Sin paradas de duplicado una a una.
- Botones «Confirmar y repartir» y «Volver».

### 9. Lo que hace al confirmar

Por cada trozo asignado a una persona:

1. Crea el asunto: tipo elegido, ese tercero, **fecha AAMMDD = la del documento original**, año
   académico y grupo como en cualquier asunto nuevo. Sin guía ni hitos.
2. Guarda dentro el trozo con `Nombres.montarDocumento`: misma fecha, **mismo registro de Séneca
   que el PDF original** y el tipo de documento elegido.
3. Nota en ese asunto: «Viene de <nombre de la carpeta de origen>, páginas 3–6».
4. Lo **archiva en el momento**, con el archivado de siempre (va a la carpeta de ese tercero en el
   ARCHIVO y hace su índice del expediente).

En el asunto de origen:

- El PDF completo **se queda** tal cual (no va a la papelera).
- Guarda los trozos «Se queda en este asunto».
- Una nota con el reparto: una línea por trozo, «Páginas 3–6 → Pérez López, Ana (asunto …)».
- En su ficha (`asuntos.json`), una lista `repartos`: documento original, fecha, y por trozo
  páginas, tercero, clave del asunto creado y si salió bien.

Mientras trabaja: «Creando 5 de 29…» dentro del cuadro. Al final, aviso verde con cuántos. Si uno
falla, se sigue con los demás; el aviso final es ámbar y dice cuáles fallaron. Volver a pulsar
«Repartir entre terceros» sobre el mismo PDF abre el cuadro con lo ya hecho marcado «Hecho» y sin
volver a crearlo: solo se reintentan los fallidos.

## Qué ficheros tocar

Crear:

- `js/repartir-nucleo.js` (`window.RepartirNucleo`): **solo funciones sin efectos**, sin disco ni
  DOM, para probarlas con `vm`: proponer los trozos (página inicial, páginas por trozo, total),
  mover un corte (+1/−1), asignar por orden, y comparar nombres (normalizar y decidir verde / ámbar
  / nada).
- `js/repartir-pantalla.js` (`window.Repartir`): el cuadro, las miniaturas, los desplegables, la
  lectura del texto con pdf.js y el resumen.
- `js/repartir-crear.js`: crear, guardar el trozo, anotar y archivar cada asunto; y lo del asunto
  de origen. **Reutilizar** las funciones que ya existen para crear un asunto, archivarlo
  (`docs/contexto/ASUNTOS.md` y `docs/contexto/ASUNTOS-ARCHIVO.md` dicen cuáles), partir el PDF
  (`PdfHerramientas.sacarPaginas`), escribir (`Carpetas.escribirBytes`) y anotar (`Notas.anadir`).
  Todo guardado de `asuntos.json` por `ColaGuardado`, nunca directo.
- `css/repartir.css`.
- `pruebas/repartir-entre-terceros.mjs`.

Tocar, con cambios pequeños:

- El sitio donde hoy se ponen los botones de Separar/Unir en la ficha del asunto (según
  `docs/contexto/DOCUMENTOS-PDF.md`, `js/ficha-asunto.js` o el fichero de documentos de la ficha
  al que pasó con la fila 133): un botón más. Si hay un punto de enganche, usarlo; si no, `U.envolver`
  y apuntarlo en `js/envolturas-esperadas.js`.
- `js/ajustes-tipo.js`: el dato «Al repartir, crear asuntos de tipo…» y su tipo de documento
  (`repartirTipo`, `repartirTipoDocumento` en `tipos.json`). Si renombrar un tipo se lleva sus
  referencias (`js/tipos-nombre.js`), que se lleve también `repartirTipo`.
- `index.html`: los tres `<script>` y la hoja de estilo.
- `docs/contexto/DOCUMENTOS-PDF.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`,
  `docs/CONTEXTO-CORTO.md` (una línea en la sección 5, sustituyendo si procede), `docs/HISTORIA.md`,
  `docs/COLA.md`.

Ningún fichero de `js/` puede pasar de 600 líneas; si uno de los que se tocan se acerca, se parte.

## Reglas de trabajo

- **Sube directamente a `main`, sin abrir ninguna pull request.** (Si la sesión solo puede con pull
  request, se aplica el permiso permanente de fusionarlo solo, en verde y sin conflictos.)
- Cambios quirúrgicos: no reescribir ficheros enteros que ya existen.
- No leas el repositorio entero: `docs/CONTEXTO.md`, los hijos citados aquí y los ficheros de esta
  lista.
- Una sola prueba al final: `pruebas/repartir-entre-terceros.mjs` y después `npm test` completo.

## La prueba

`pruebas/repartir-entre-terceros.mjs`:

- Sin navegador (`vm`): trozos propuestos con 2 páginas de oficio y 3 personas de 4 páginas;
  división no exacta avisa; +1/−1 recoloca los siguientes; comparación de nombres (orden
  cambiado, sin tildes, sin segundo apellido → ámbar, Nº escolar → verde, dos posibles → ámbar).
- Con navegador y el disco de mentira: un asunto de colegio con 3 relacionados y un PDF de 14
  páginas con texto (2 de oficio + 3 × 4, con un nombre dentro de cada trozo en distinto orden del
  de los relacionados); se reparte; comprobar que salen 3 asuntos archivados en la carpeta de cada
  tercero, cada uno con su trozo de 4 páginas, el registro del original y la nota «Viene de…»; que
  el oficio queda en el origen como documento propio; que el PDF completo sigue en el origen; y
  que la nota del reparto y `repartos` están en su ficha. Repetir el reparto no crea nada nuevo.

## Al terminar

Lo que va a ver Francisco: en el menú de un PDF de un asunto, «Repartir entre terceros».
