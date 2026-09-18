# Fila 69 — Las pruebas que faltan

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 3.2.

---

## 1. Dónde se está hoy

Esto hay que decirlo primero, porque está bien: **70 ficheros de prueba, 1.478 comprobaciones, todas
en verde**, ejecutándose solas en GitHub en cada subida. 50 de ellas arrancan un navegador de verdad
y manejan la aplicación como lo haría una persona. Cada fila de la cola desde la 37 ha traído su
prueba. Eso no es lo normal en un proyecto así.

Lo que sigue es lo que falta, no una queja.

## 2. Lo que no prueba nadie

### 2.1 Editar el nombre de un asunto — **lo cubre la fila 62**

Ninguna prueba lo hace. Y ahí está uno de los dos fallos graves del informe. No es casualidad.

Si la fila 62 se hace antes que esta, esta parte ya está; si no, se hace aquí.

### 2.2 Unir dos asuntos — 611 líneas sin ninguna red

`js/unir-asuntos.js` funde dos carpetas y dos fichas, junta las notas, decide qué pasos hechos se
quedan y renombra ficheros que chocan. Nada de eso lo prueba nadie. `pruebas/duplicados.mjs` cubre la
pantalla de duplicados, que es otra cosa.

Prueba nueva, `pruebas/unir-asuntos.mjs`, sin navegador, con el disco de mentira:

- Dos asuntos con notas, pasos hechos y documentos. Se unen.
- La carpeta que se queda tiene todos los documentos de las dos.
- Un documento con el mismo nombre en las dos no se pisa: entra con " (2)".
- Las notas de las dos salen ordenadas por fecha, y se añade la nota de "Unido con la carpeta…".
- La ficha que se va desaparece del registro.
- Los hitos de las dos se juntan (esto es de la fila 62; si ya está, se comprueba aquí también).
- Si la copia falla a medias, **no se borra nada del origen**.

### 2.3 Los asuntos recurrentes — 487 líneas sin ninguna prueba

`js/recurrentes.js` avisa de los asuntos que se repiten y los crea. Se ejecuta solo, en segundo
plano, y toca `asuntos.json`. Si un día empieza a crear duplicados o a no avisar, nadie se entera
hasta que Francisco lo vea.

Prueba nueva, `pruebas/recurrentes.mjs`: que avisa cuando toca, que no avisa dos veces del mismo,
que crear desde el aviso monta la carpeta y la ficha bien, y que "Ocultar por hoy" hace lo que dice.

### 2.4 El disco de verdad

**Todas** las pruebas de navegador sustituyen el acceso a carpetas por uno de mentira en memoria.
Está bien para probar la lógica. Pero significa que **nada prueba el acceso real a carpetas, y nada
prueba Dropbox**.

Justo lo que más problemas ha dado —copias en conflicto, ficheros que desaparecen a mitad de una
copia, permisos que se pierden, carpetas temporales de sincronización— es lo que no toca ninguna
prueba. Se prueba cómo **reacciona** la aplicación a esos casos, que ya es mucho; no que los
**detecte** en un Dropbox de verdad.

Esto no se puede arreglar con una prueba automática. Se arregla con el punto 3.

### 2.5 El script de Google

`apps-script/gestor-correos.gs`, 490 líneas. No se ejecuta desde el repositorio y no lo prueba nadie.
Es el trozo que más datos personales mueve y el único sin red de seguridad ninguna.

Lo que sí se puede hacer sin montar nada: sacar a funciones puras las partes que no hablan con Gmail
ni con Drive (leer `seguidos.json`, montar la ficha de un hilo, sacar la matrícula de una cabecera,
armar el enlace al correo) y probarlas desde `pruebas/`, copiando el fichero y llamando a esas
funciones. No cubre el envío, pero cubre la parte que más veces se ha tocado.

**Si esto se complica, se deja y se apunta.** No merece una fila entera.

## 3. La lista de lo que solo se puede comprobar a mano

Documento nuevo, `docs/COMPROBAR-A-MANO.md`: lo que ninguna prueba cubre y **Francisco tiene que
mirar antes de dar por buena una publicación importante**. Corto, en forma de lista para ir
tachando:

- El ayudante de Séneca, contra Séneca de verdad: que los destinatarios entran, y que al final dice
  bien quién no ha entrado.
- Que Comunicaciones de Séneca acepta el largo del asunto que se le da.
- "Ajustar tamaño" con un documento registrado de verdad: que las bandas del sello y de la firma
  quedan libres, y qué pasa si el PDF ya venía firmado digitalmente.
- Un archivado con Dropbox sincronizando de verdad.
- Los dos ordenadores guardando a la vez en el mismo asunto: que sale el aviso de "el compañero está
  dentro", y que las copias en conflicto se fusionan.
- Que el script de Google recoge un correo con adjuntos y deja el borrador.
- Que la aplicación entra en `https://asuntos.fmargon.com` desde la red del IES.

Cada línea, con qué hay que ver para darla por buena.

## 4. Cómo se comprueba

Que `npm test` sigue en verde con las pruebas nuevas dentro, y que las nuevas **fallan de verdad** si
se rompe a propósito lo que prueban. Una prueba que pasa siempre no vale para nada: comprobarlo una
por una, rompiendo el código a mano un momento y viendo que salta.

## 5. Qué NO hay que hacer

- **No** montar un sistema de medición de cobertura. Aquí lo que importa no es el porcentaje, es
  saber qué caminos no tienen red.
- **No** tocar el código de producción en esta fila. Si al escribir una prueba aparece un fallo, se
  apunta en `docs/COLA.md` como fila nueva; solo se arregla aquí si es de una línea y evidente.
- **No** intentar probar el ayudante de Séneca de forma automática. Está descartado y bien
  descartado.

## 6. Cuánto es

Un día, más lo que se quiera estirar con el script de Google.
