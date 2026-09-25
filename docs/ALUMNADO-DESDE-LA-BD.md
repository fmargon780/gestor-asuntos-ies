# El alumnado, desde la base de datos de alumnado

Fila 142 de `docs/COLA.md`. Cerrada con Francisco el 25-sep-2026.

## Qué quiere Francisco

Séneca tiene muchas listas útiles sobre el alumnado. Quiere que el gestor las aproveche para
relacionarlas con terceros y asuntos, y más adelante hacer informes potentes. Se decidió que esas
listas entren **por la base de datos de alumnado** (`fmargon780/bd-alumnado-ies`), que ya las limpia
y las cruza, y que el gestor **consulte su resultado**. Así cada lista se prepara una sola vez.

Lo que une las dos aplicaciones está en `docs/ACUERDO-ALUMNADO.md`. **Léelo entero antes de empezar.**
La otra mitad (que la base de datos ofrezca la dirección) es la fila 4 de la cola de
`bd-alumnado-ies`. Esta fila no depende de que esa esté hecha: se prueba con un fichero inventado.

## Qué hay que hacer

1. **Ajustes › Ficheros de datos**: un bloque «Base de datos de alumnado» con una caja para pegar la
   dirección (con su `?k=`), botón «Probar» (dice cuántos alumnos trae y de qué fecha) y la fecha de
   la última copia. La dirección es del centro: se guarda en los ajustes de `_GESTOR`, como las
   demás, no en el navegador. Rechazar sin llamar una dirección sin `?k=`.
2. **Traer los datos**: al entrar, una vez al día, y con un botón «Traer el alumnado ahora» en
   Mantenimiento. Guarda lo recibido en `_GESTOR/datos/ALUMNADO-BD.json` **por la cola de guardado**
   (`ColaGuardado`), nunca directo. Si la dirección falla o no está puesta, no pasa nada: se sigue con
   la última copia. Aviso ámbar solo si falla la llamada con la dirección puesta (`U.accesorio`).
   Comprueba antes si `script.google.com` responde desde el navegador con `fetch` (el envío de correo
   ya lo hace así): usa el mismo camino.
3. **Quién manda**: si hay `ALUMNADO-BD.json` válido (sección 4 del acuerdo), sus datos mandan sobre
   los de `RegAlum.csv` para cada alumno que traiga (unidos por Nº de identificación escolar). Lo que
   no traiga, sigue saliendo de `RegAlum.csv` como hoy. Sin fichero válido, todo como hoy. Nada de lo
   que hoy funciona con `RegAlum.csv` puede dejar de funcionar.
4. **Ficha del alumno**: una tarjeta nueva «Datos académicos» (unidad, repeticiones, PIL,
   pendientes, materias no superadas, NEAE), con la fecha de los datos al pie («Datos de la base de
   datos de alumnado del 25-09-2026»). La NEAE sale solo como «Sí» o nada. Sin fichero, la tarjeta no
   sale.
5. **Plantillas**: los campos del fichero se pueden usar como huecos por el mismo camino que las
   tablas de datos (`{{DATO …}}`, `docs/contexto/TABLAS-DE-DATOS.md`), unidos por Nº escolar en vez
   de por DNI. Es la base de los informes futuros.
6. **Aviso de frescura**: el de `RegAlum.csv` viejo (`js/frescura.js`) mira también la fecha
   `generado` del fichero nuevo, con la misma regla de épocas.
7. **Copia sin internet**: con el fichero ya guardado funciona igual; si no llega a la dirección,
   no avisa más que una vez.

## Ficheros que hay que tocar

- Nuevo: `js/alumnado-bd.js` (leer, validar, traer y guardar el fichero; unirlo al alumnado).
- `js/datos-alumnado.js` (el punto donde se une; enganche, sin envolver).
- `js/ficha-tercero-alumno.js` (la tarjeta), `js/tablas-datos-leer.js` (los huecos),
  `js/frescura.js` (el aviso), el bloque de Ajustes de «Ficheros de datos» y el de Mantenimiento.
- `index.html` (cargar el fichero nuevo) y la lista de ficheros de la copia sin internet si la hay.
- Prueba nueva: `pruebas/alumnado-desde-la-bd.mjs`, con un `ALUMNADO-BD.json` de **alumnos
  inventados** (tres: uno matriculado con NEAE, uno antiguo, uno con `acuerdo: 99` que debe
  rechazarse).
- Documentación: `docs/CONTEXTO-CORTO.md`, el hijo de `docs/contexto/` que toque,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/HISTORIA.md`, `docs/COMPROBAR-A-MANO.md`
  (los pasos de Francisco para pegar la dirección).

## Cómo trabajar

- **Sube directamente a `main`, sin abrir ninguna petición de cambios** (si la sesión no puede,
  sigue la nota de `docs/COLA.md`).
- Cambios quirúrgicos: no reescribas ficheros enteros. Ninguno de `js/` pasa de 600 líneas.
- No leas el repositorio entero: `docs/CONTEXTO.md`, este documento, el acuerdo y los ficheros de
  la lista.
- Una sola prueba al final (`npm test` completo), no una comprobación tras cada cambio.
- Si algo del acuerdo no encaja con lo que el gestor necesita, **no lo cambies por tu cuenta**:
  apúntalo en «Lo que queda por hablar con Francisco» de `docs/COLA.md` y sigue con lo demás.
