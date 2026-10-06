# Dos tipos de asunto que son el mismo: la app los une o avisa (fila 277)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1RFY_16AID4Vl5RPPUY1RcvqQ4aNV2emh/view?usp=drivesdk).

La segunda mitad del mismo diseño (avisar **antes** de crear un tipo repetido) es la fila 279,
`docs/AVISAR-ANTES-DE-CREAR-UN-TIPO-REPETIDO.md`. Esta fila va primero: la 279 usa su módulo.

## Qué pasó

Francisco, desde la ficha de un asunto: «Se me da el caso del Tipo de Asunto ANULACIÓN que después
lo pasamos a ANULACIÓN DE MATRÍCULA. No recuerdo cómo se hizo la fusión, si es que se hizo, pero
ahora nos aparecen dos tipos de asunto elegibles. Debemos estudiar estos casos en los que un Tipo
de Asunto se cambia, para evitar duplicidades, por otro».

**No se han podido ver sus datos reales.** Hay dos caminos posibles:

- Se le cambió el nombre al tipo (`App.renombrarTipo` guarda el nombre viejo en `tipo.alias`) y el
  nombre viejo volvió a aparecer como tipo aparte. Ya pasó en septiembre (fila 79, apartado 9).
- No se cambió el nombre: se creó ANULACIÓN DE MATRÍCULA como tipo nuevo y el antiguo se quedó.

La app ya tiene «Cambiar el nombre» y «Unir con otro tipo» (fila 207, `js/tipos-unir.js`), los dos
en Ajustes, en la pantalla de un tipo. Lo que falta es que **la app se dé cuenta sola** de que hay
dos tipos que son el mismo.

## Qué quiere Francisco

1. Si un tipo es el nombre antiguo de otro, la app los une ella sola y lo dice en una línea. Solo
   si el antiguo no tiene nada propio; si lo tiene, avisa y decide él.
2. Si dos tipos solo se parecen, la app avisa en el cuadro de avisos de Inicio, con «Unir» y «No
   son el mismo». Con «No son el mismo» no vuelve a preguntar por esa pareja.

## Palabras de este documento

- **Nombre antiguo**: un tipo A «es el nombre antiguo» de otro tipo B cuando el nombre de A está en
  `B.alias` (comparando con `TiposNombre.n`: sin tildes ni mayúsculas). En pantalla, Ajustes ya lo
  enseña como «antes: …» y «Antes se llamó».
- **Se parecen**: la regla del punto 2 de abajo. No es `U.parecidos` tal cual.

## Qué hay que hacer

Todo en un módulo nuevo y pequeño, `js/tipos-parecidos.js` (`window.TiposParecidos`), que no
envuelve nada: se engancha por `window.Gestor.alRefrescar`, como `js/por-liquidar.js`.

### 1. El nombre antiguo de otro tipo: se unen solos

**Cuándo se mira.** Una pasada al entrar (mismo patrón que `PorLiquidar.alEntrar`: en segundo
plano, esperando a que no haya ningún guardado en marcha, `ColaGuardado.hayGuardado()`). Y otra
vez cada vez que cambie la lista de tipos durante la sesión: en `Gestor.alRefrescar`, comparar una
firma barata (nombres y alias de `App.E.tipos`) con la de la última pasada; si no ha cambiado, no
se hace nada. Nunca dos pasadas a la vez.

**Qué pareja se une sola.** Un tipo A que cumple **todo** esto:

- Su nombre es el nombre antiguo de **un solo** tipo B, y el nombre de B no es nombre antiguo de A.
- A no tiene nada propio: sin guía (vacía o la mínima, `EstadoHito.esGuiaMinima`), sin campos
  propios (`campos.json › porTipo[A]`), sin plantillas de correo ni de documento con ese tipo, sin
  recurrentes, sin impresos (`formularios`) y sin palabras clave.
- A no lleva marcado «reservado» ni «Hay que liquidarlo antes de archivar» si B no lo lleva.
- Este ordenador no está en solo consulta (`SoloConsulta.activo()`).
- Ningún otro usuario está ahora mismo dentro de un asunto abierto de A (presencia,
  `js/presencia.js`). Si lo hay, esa pareja se deja para la pasada siguiente, sin aviso.

**Cómo se une.** Antes de tocar nada, se relee la lista de tipos del disco (por si el otro
ordenador ya lo ha hecho) y se comprueba que A sigue existiendo y sigue cumpliendo lo de arriba.
Después, `TiposUnir.unir(A, B)`: A desaparece y B se queda, igual que con el botón «Unir con otro
tipo». Y lo mismo que hace `App.unirTipoConOtro` después de unir (`App.verAbiertos`, repintar
Ajustes, cerrar la pantalla de A si estaba abierta, `PorLiquidar.alMarcarCasilla(B)` si B lleva la
casilla). **Saca ese trozo de `App.unirTipoConOtro` a una función común** y úsala desde los tres
sitios (el botón de siempre, esta pasada y el cuadro del punto 2); no lo copies.

**Qué se ve.**

- Aviso verde: **«A» era el nombre antiguo de «B». Los he unido.** Si se han pasado asuntos
  abiertos, sigue: **N asuntos abiertos pasan a «B».** (en singular con uno).
- Si alguna carpeta no se pudo cambiar de nombre: el mismo texto en ámbar, con cuáles, como hoy.
- Si la unión falla: `U.accesorio('No he podido unir «A» con «B»', e)`, y esa pareja no se vuelve a
  intentar en esta sesión: sale en el aviso del punto 2.
- Con varias parejas, una detrás de otra, nunca en paralelo.

**La pareja que no se une sola** (A tiene algo propio, o es nombre antiguo de dos tipos, o los dos
lo son uno del otro) sale en el aviso del punto 2, con su motivo.

### 2. Dos tipos que se parecen: aviso en Inicio

**Cuándo «se parecen» dos tipos.** Se sacan las palabras de cada nombre: sin tildes ni mayúsculas,
partiendo por todo lo que no sea letra o número y quitando las palabras de enlace (de, del, la, el,
los, las, y, e, a, en, por, para, con). Dos palabras cuentan como la misma si son iguales o si una
es la otra más «s» o «es» («CLASE» y «CLASES», «TUTOR» y «TUTORES»). Se parecen si pasa alguna de
estas cosas:

- Tienen las mismas palabras, en cualquier orden («BAJA MÉDICA» y «MEDICA BAJAS»; «ANULACIÓN
  MATRÍCULA» y «ANULACIÓN DE MATRÍCULA»).
- Las palabras de uno son **el principio** de las del otro, en el mismo orden, y el corto tiene al
  menos una palabra de cuatro letras o más («ANULACIÓN» y «ANULACIÓN DE MATRÍCULA»). Solo el
  principio: «MATRÍCULA» y «ANULACIÓN DE MATRÍCULA» **no** se parecen.
- Solo cambia una letra: `U.hueso` de los dos a distancia 1 (la `distancia` que devuelve
  `U.parecidos`), los dos con seis caracteres o más, y la letra que cambia no es un número.
- El nombre de uno es el nombre corto del otro.

No se usa la regla de `U.parecidos` de «uno contiene al otro» (pega nombres sin mirar palabras y
daría demasiadas parejas falsas).

**Qué parejas salen.** Las que se parecen, más las del punto 1 que no se han unido solas. Menos
las que alguien marcó «No son el mismo».

**El aviso.** Un trozo más del cuadro de avisos de Inicio (`AvisosLinea.registrar`, id
`tipos-parecidos`, no urgente): **«2 tipos de asunto parecidos»** con una pareja, **«Tipos de
asunto parecidos: N parejas»** con más. Sin parejas, no sale. En solo consulta, no sale. Se
recalcula tras cada pasada del punto 1 y cada vez que cambia la lista de tipos.

**Al pulsarlo**, un cuadro (`U.preguntar`, uno solo a la vez) **«Tipos de asunto parecidos»**, con
un único botón «Cerrar» y una fila por pareja:

- Los dos nombres, cada uno con su categoría y cuántos asuntos abiertos tiene.
- Si es del punto 1, debajo, en gris: «A» es el nombre antiguo de «B».
- Dos botones: **«Unir»** y **«No son el mismo»**.

**«No son el mismo».** La fila se va del cuadro sin cerrarlo, y la pareja queda apuntada para todo
el centro en un fichero nuevo de `_GESTOR` (por ejemplo `tipos-distintos.json`: lista de parejas,
cada una con las dos claves `TiposNombre.n` ordenadas, quién y cuándo). Se guarda por su cola
(`App.enFila`), releyendo antes de escribir y fundiendo por elemento, para que dos ordenadores no
se pisen. Si la pareja era del punto 1, además se quita ese nombre de `B.alias` (deja de ser su
nombre antiguo) y se guardan los tipos: si no, la app volvería a intentar unirlos. Sin filas, el
cuadro se cierra solo.

**«Unir».** En el mismo cuadro (no otro encima), la fila pasa a preguntar **«¿Con cuál te
quedas?»**: los dos nombres como dos opciones, una marcada de partida, y debajo el mismo resumen
que da hoy «Unir con otro tipo» («X» desaparece y todo pasa a «Y». Se van a pasar N asuntos
abiertos (su carpeta cambia de nombre). La guía que vale desde ahora es la de «Y». El ARCHIVO no
se toca.), que cambia al cambiar la opción. Botones «Unir» y «Volver».

- Opción marcada de partida: en una pareja del punto 1, B. En las demás, el que tenga guía de
  verdad; si los dos o ninguno, el que tenga más asuntos abiertos; si empatan, el de nombre más
  largo.
- Al pulsar «Unir»: `TiposUnir.unir(el que desaparece, el que se queda)`, la función común de
  después de unir y el aviso verde de siempre («Unidos. N asuntos abiertos pasados a «Y».»). Si
  quedan más parejas, el cuadro vuelve a abrirse con las que quedan.

### 3. Lo de siempre

- `js/solo-consulta.js`: «Unir» y «No son el mismo» son acciones (lista `ACCION`), por si el
  cuadro llegara a abrirse.
- `index.html`: cargar el módulo nuevo después de `js/tipos-unir.js` y `js/avisos-linea.js`.
- `js/novedades.js`: «Si un tipo de asunto es el nombre antiguo de otro, la app los une sola y lo
  dice. Y si dos tipos se parecen, lo avisa en Inicio para unirlos o decir que no son el mismo.»

## Qué NO se toca

- Qué hace `TiposUnir.unir` (guía, campos, plantillas, recurrentes, alias, lápida, asuntos
  abiertos con `tipoUnidoDe`). Solo se le llama.
- El ARCHIVO: ninguna carpeta archivada cambia de nombre.
- El botón «Unir con otro tipo» de Ajustes sigue donde está y hace lo mismo.
- Las puertas por las que se crea un tipo: son la fila 279.
- Los tipos de documento: esta fila es solo de tipos de asunto.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md`,
  `docs/UNIR-DOS-TIPOS.md` (fila 207), `js/tipos-unir.js`, `js/tipos-nombre.js`,
  `js/por-liquidar.js` (solo `alEntrar`) y `js/avisos-linea.js` basta.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas: si `js/tipos-parecidos.js` se
  acerca, el cuadro va en un segundo fichero (`js/tipos-parecidos-cuadro.js`).
- Todo lo que esta fila escribe sin que lo pida un botón (la unión sola) mira antes
  `SoloConsulta.activo()` y `ColaGuardado.hayGuardado()` (regla de `docs/CONTEXTO-CORTO.md`,
  sección 6).
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` (tipo, guía, asunto, cambiar).
- Rama `fila-277`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs tipos-que-son
  tipos-unir por-liquidar buscar-o-crear`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- Nuevo: `js/tipos-parecidos.js` (y `js/tipos-parecidos-cuadro.js` si hace falta).
- Nuevo: `pruebas/tipos-que-son-el-mismo.mjs`, con disco de mentira (escribiendo `tipos.json` a
  mano para montar cada caso):
  1. A es nombre antiguo de B y no tiene nada propio: tras la pasada, A no está, tiene lápida, y
     sus dos asuntos abiertos llevan el tipo B en la carpeta y en la ficha. El archivado no cambia.
  2. A es nombre antiguo de B pero tiene guía (y otro caso con una plantilla, y otro con «reservado»
     que B no lleva): no se unen; la pareja sale en `TiposParecidos.parejas()` con motivo de nombre
     antiguo.
  3. En solo consulta: no se une nada y no hay aviso.
  4. Con un guardado en marcha: la pasada espera.
  5. La regla de «se parecen», caso a caso: los cuatro que sí (uno por regla) y estos que no:
     «MATRÍCULA» / «ANULACIÓN DE MATRÍCULA»; «CERTIFICADO DE NOTAS» / «CERTIFICADO DE MATRÍCULA»;
     «ACTA 1» / «ACTA 2»; «ALTA» / «BAJA».
  6. «No son el mismo»: la pareja deja de salir, también tras releer del disco; en una pareja de
     nombre antiguo, el nombre sale de `B.alias` y la pasada siguiente no los une.
  7. «Unir» desde el cuadro, eligiendo quedarse con el que no venía marcado.
- Cambiar: `js/tipos-unir.js` (solo sacar la función común de después de unir),
  `js/solo-consulta.js` (dos textos), `index.html`, `js/novedades.js`, y el CSS que toque para las
  filas del cuadro.
- Al terminar: `docs/CONTEXTO-CORTO.md` (una línea en la sección 5, junto a «Unir con otro tipo»,
  sin alargar), `docs/contexto/CAMPOS-Y-TIPOS.md`, `docs/contexto/FICHEROS-DEL-REPOSITORIO.md` y
  `docs/HISTORIA.md`. `docs/UNIR-DOS-TIPOS.md` es una instrucción cerrada: no se reescribe.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que si un tipo de asunto es el nombre antiguo de otro, la app los une sola al
entrar y lo dice en una línea verde; que si dos tipos solo se parecen, sale un aviso en Inicio con
«Unir» y «No son el mismo»; y que al entrar en el centro verá una de las dos cosas para ANULACIÓN.

Y la respuesta para quien mandó el aviso, en una línea: «La app ya se da cuenta sola de cuándo dos
tipos de asunto son el mismo: si uno es el nombre antiguo del otro, los une; si solo se parecen, lo
avisa en Inicio para unirlos con un botón.»

## Cómo sabemos que está bien

En la copia de demostración. Elegir en Ajustes → Tipos de asunto un tipo que tenga al menos un
asunto abierto; aquí se llama T. Apuntar cuántos asuntos abiertos tiene.

1. Abrir T → «Cambiar el nombre» → escribir «ZZ PRUEBA UNO» → «Cambiar». En su tarjeta de Ajustes
   se lee «antes: T».
2. En la caja «Buscar o crear» de Tipos de asunto, escribir el nombre de antes (T) y crear el tipo
   (si pregunta por parecidos, crear igualmente; elegir cualquier categoría).
3. Sin recargar, en pocos segundos sale un aviso verde que dice que «T» era el nombre antiguo de
   «ZZ PRUEBA UNO» y que los ha unido.
4. En Ajustes → Tipos de asunto, buscando T: no hay ningún tipo que se llame T. Sale «ZZ PRUEBA
   UNO», con «antes: T».
5. En Inicio, los asuntos que eran de T siguen ahí, los mismos que al principio, con el tipo «ZZ
   PRUEBA UNO».
6. En Ajustes, crear con «Buscar o crear» el tipo «ZZ PRUEBA UNO BIS» (si pregunta por parecidos,
   crear igualmente).
7. En Inicio, el cuadro de avisos lleva un trozo sobre tipos de asunto parecidos («2 tipos de
   asunto parecidos», o «Tipos de asunto parecidos: N parejas» si la demostración ya traía otras).
8. Al pulsarlo se abre el cuadro «Tipos de asunto parecidos». Entre sus filas está la pareja «ZZ
   PRUEBA UNO» / «ZZ PRUEBA UNO BIS», con los botones «Unir» y «No son el mismo».
9. Pulsar «Unir» en esa fila: sin abrirse otro cuadro encima, pregunta «¿Con cuál te quedas?», con
   una de las dos opciones marcada y un resumen que dice cuál desaparece, cuántos asuntos abiertos
   pasan y que el ARCHIVO no se toca. Al marcar la otra opción, el resumen cambia.
10. Elegir quedarse con «ZZ PRUEBA UNO» y pulsar «Unir»: aviso verde «Unidos. …». En Ajustes ya no
    existe «ZZ PRUEBA UNO BIS».
11. Crear otro tipo, «ZZ PRUEBA UNO TER». En Inicio vuelve a salir el aviso. Abrir el cuadro y
    pulsar «No son el mismo» en esa pareja: la fila desaparece sin que se cierre el cuadro (si era
    la única, se cierra).
12. Ir a otra pantalla y volver a Inicio: esa pareja no vuelve a salir en el aviso. Los dos tipos
    siguen existiendo en Ajustes.
13. Una pareja como «CERTIFICADO DE NOTAS» y «CERTIFICADO DE MATRÍCULA» (crear los dos si no
    están) **no** sale en el cuadro.
14. Ajustes → un tipo → «Unir con otro tipo» sigue funcionando como antes (mismo cuadro, mismo
    aviso final).
15. Marcar «En este ordenador, solo consultar»: el aviso de tipos parecidos no sale en Inicio.
16. (Lo cubre la prueba `tipos-que-son-el-mismo`, no el revisor.) Un tipo que es nombre antiguo de
    otro pero tiene guía propia no se une solo: sale en el cuadro, con la línea gris «… es el
    nombre antiguo de …».
17. **[SOLO FRANCISCO]** En el centro, con los datos reales: al entrar tras publicarse esta fila,
    o sale la línea verde «ANULACIÓN» era el nombre antiguo de «ANULACIÓN DE MATRÍCULA». Los he
    unido., o sale en Inicio el aviso de tipos parecidos con esa pareja. Después de unirlos, al
    elegir tipo solo queda ANULACIÓN DE MATRÍCULA.
