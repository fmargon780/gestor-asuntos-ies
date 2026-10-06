# El perfil directivo: quién es y qué ve (fila 287)

Cerrado con Francisco el 6-oct-2026. Primera de tres filas (287, 289 y 290) que abren la aplicación
al equipo directivo para **consultar y encargar**, no para tramitar. El análisis previo está en el
proyecto de Claude, `claude/Informe-abrir-al-equipo-directivo-2026-10-06.md`.

Esta fila deja a un directivo **entrar y mirar lo suyo**. Los encargos son la fila 289 y las notas
la 290.

## Qué pasa hoy

La aplicación la usan dos personas de Administración. Entrar es elegir un nombre de una lista; todos
los nombres valen lo mismo y todos ven y cambian todo. El director, la secretaria, el jefe de
estudios y la jefa de estudios adjunta no entran: reciben avisos y un informe por correo.

## Qué quiere Francisco

- Que esas cuatro personas puedan entrar a ver por dónde van **sus** asuntos.
- Que cada una vea solo lo de su órgano (Dirección, Secretaría o Jefatura de Estudios) y lo que ella
  misma ha encargado. Lo demás no aparece en su pantalla.
- Que no puedan cambiar nada de un asunto. Tramitar sigue siendo cosa de Administración.
- Que su pantalla sea corta y clara: sin Ajustes, sin Herramientas, sin Cuentas.

Francisco sabe que esto ordena la pantalla y no es un cierre: las carpetas siguen en el Dropbox de
cada uno. **Ningún texto de la aplicación debe decir ni dar a entender que protege o impide el
acceso.**

## Palabras de este documento

- **Perfil**: lo que es cada nombre de la lista de entrada. Cuatro valores: `ADMIN`
  (Administración, el de siempre), `DIRECCION`, `SECRETARIA` y `JEFATURA`. Los tres últimos son los
  mismos identificadores de `TiposOrgano.ORGANOS` (`js/tipos-organo.js`).
- **Directivo**: quien entra con un perfil que no es `ADMIN`.
- **Sus asuntos**: los asuntos cuyo tipo tiene como órgano el de su perfil
  (`TiposOrgano.deNombre(App.tipoDeAsunto(a))`), más los que nacieron de un encargo suyo
  (algún elemento de la lista `ficha.encargos` con `de` igual a su nombre; la escribe la fila 289).
  Los tipos con órgano «Varios» o
  sin asignar **no** entran, salvo por un encargo suyo.

## Qué hay que hacer

### 1. Dónde se guarda el perfil

- Fichero nuevo `_GESTOR/perfiles.json`: `{ perfiles: { "<nombre>": { perfil, correo } } }`. Un
  nombre que no está ahí es `ADMIN`. No se toca el formato de `usuarios.json` (una versión vieja de
  la aplicación lo reescribe entero al entrar y borraría lo nuevo).
- Alta del fichero donde toca: lista `FICHEROS` de `js/copias.js`, guardado siempre con
  `Copias.guardar` dentro de `App.enFila`, y fusión automática en `js/conflictos.js` (por nombre;
  si los dos lados cambian el mismo nombre, gana el fichero real). Fila nueva en
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`.
- Módulo nuevo `js/perfil.js` (`Perfil`; mira antes que el nombre esté libre): `cargar`, `de(nombre)`,
  `esDirectivo()`, `organo()`, `correo()`, `veAsunto(a)`, `guardar(nombre, datos)`.

### 2. Dónde se pone: Ajustes → El centro → «Quién usa la aplicación»

- Sección nueva, plegada como las demás, con una fila por nombre de `usuarios.json`:
  nombre, desplegable **Perfil** («Administración», «Dirección», «Secretaría», «Jefatura de
  Estudios») y **Correo** (opcional).
- «+ Añadir persona»: escribe un nombre nuevo en `usuarios.json`, para dar de alta a un directivo
  antes de que entre por primera vez.
- Se guarda al cambiar, sin botón «Guardar». Resumen de la sección plegada: «2 de Administración ·
  3 directivos».
- Solo la ve Administración (un directivo no tiene Ajustes).

### 3. Al entrar como directivo

- El perfil se sabe **antes** de `SoloConsulta.proteger` y antes de cualquier escritura. Hoy
  `btn-entrar` protege las carpetas antes de fijar el usuario y de abrir `_GESTOR`: hay que leer
  `perfiles.json` sin crear nada, y decidir después.
- Una sesión de directivo va **protegida como «En este ordenador, solo consultar»**: la misma
  envoltura de carpetas, las mismas tareas de fondo saltadas (copias, presencia, «Por liquidar»,
  fusión de conflictos, índices, apuntar el nombre), los mismos controles apagados y la ficha
  siempre en modo consulta, sin «Tomar el mando». La forma más corta: que `SoloConsulta.activo()`
  sea verdad también cuando `Perfil.esDirectivo()`.
- Dos diferencias con «solo consultar»:
  1. No sale su franja ni su «Quitar». Sale una línea fija y discreta arriba:
     **«Entras como <Dirección | Secretaría | Jefatura de Estudios>. Ves los asuntos de tu órgano.»**
  2. Hay **una única puerta para escribir**, `Perfil.escribir(fn)`, que levanta la protección solo
     mientras dura `fn`. En esta fila nadie la usa: la estrenan las filas 289 y 290. Todo lo que no
     pase por ella sigue rechazado.
- El permiso sobre las carpetas se pide **de escritura** (la puerta lo necesita), no de solo lectura
  como en «solo consultar».
- La puerta no puede servir de paso a las tareas de fondo que coincidan en ese rato: no uses el
  `pausar` general de `SoloConsulta`. Lo permitido se marca de otra forma (por ejemplo, pasando a
  `fn` la carpeta `_GESTOR` sin envolver).
- Un intento rechazado sale en ámbar: «Con tu perfil no se puede cambiar esto.»
- Si ese ordenador tiene además marcado «solo consultar», manda «solo consultar» (con su franja).

### 4. Lo que ve un directivo

- **Menú de la izquierda**: solo «Inicio» y «Archivo». Fuera «Nuevo asunto», «Personas y empresas»,
  «Impresos», «Cuentas», «Herramientas» y «Ajustes», la marca de comprobación al entrar y el botón
  «+ Nuevo asunto» de la cabecera. El botón «Soporte» y «Qué hay de nuevo» se quedan.
- **Inicio**: sin tablón, sin la fila «Ha llegado» y sin el cuadro de avisos (son de Administración).
  Una sola lista, la de «Todos los abiertos», sin las demás pestañas. Mismas columnas. Filtros como
  hoy, menos «Lo encarga». El buscador de la cabecera busca solo entre sus asuntos.
- **Archivo**: solo sus asuntos archivados (por el órgano del tipo leído del nombre). Sin «Reabrir»
  ni nada que cambie algo.
- **Ficha del asunto**: como en solo consulta. Ve cabecera, hitos, documentos (se abren en el panel
  de lectura), notas y «El encargo». La mesa de un hito se abre para leer.
- **Ficha de una persona** (si llega a ella desde un asunto): en «Sus asuntos», solo los que
  `Perfil.veAsunto` deja ver.
- **Reservados**: igual que hoy. Los de su órgano salen con candado y «Mostrar reservados» los
  destapa.

**Regla única**: todo sitio que liste o busque asuntos pasa por `Perfil.veAsunto(a)` cuando quien
entra es directivo. Para Administración, `veAsunto` devuelve siempre verdadero y nada cambia.

## Qué NO se toca

- Nada de lo que ve o hace Administración, salvo la sección nueva de Ajustes.
- `usuarios.json` (su formato) y la pantalla de entrada: el nombre se sigue eligiendo de la lista.
- La casilla «En este ordenador, solo consultar» y su franja.
- Los órganos de los tipos, las guías y los responsables de los hitos.
- No se añade contraseña ni nada que parezca un control de acceso.

## Antes de empezar

- No leas el repositorio entero. Basta con `docs/CONTEXTO.md`, `docs/contexto/PANTALLA.md`,
  `docs/SOLO-CONSULTA-EN-ESTE-ORDENADOR.md`, y los ficheros de la lista de abajo.
- Cambios quirúrgicos. Ningún fichero de `js/` pasa de 600 líneas. **`js/nucleo.js` ya pasa (656)**:
  ahí, como mucho, la llamada a `Perfil`; el resto va en `js/perfil.js`. `js/asuntos-lista-pintar.js`
  tiene 555: una sola condición nueva.
- Un módulo nuevo no envuelve: se engancha por un punto previsto o por uno nuevo.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`. Añade ahí «perfil» y «directivo».
- La demostración trae tres nombres más, ya con perfil: «Directora de prueba» (Dirección),
  «Secretario de prueba» (Secretaría) y «Jefa de estudios de prueba» (Jefatura de Estudios), y
  asuntos abiertos y archivados de los tres órganos, de «Varios» y sin asignar. Y admite
  `&usuario=<nombre>` junto a `?demo=1&auto=1` para entrar con ese nombre (solo en la demostración).
- Rama `fila-287`, revisor en local y, con su APROBADA, a `main`. Nada en una petición de cambios
  abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs perfil solo-consulta
  usuarios inicio filtros asuntos-reservados conflictos`); la pasada completa, una sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos.

## Ficheros

- `js/perfil.js`: nuevo. Todo lo de arriba que no sea pintar Ajustes.
- `js/perfil-ajustes.js`: nuevo. La sección «Quién usa la aplicación».
- `js/ajustes-centro.js`: solo el sitio de la sección.
- `js/nucleo.js`: solo leer el perfil en `btn-entrar`, antes de proteger.
- `js/solo-consulta.js`: `activo()` cuenta al directivo; la puerta; sin franja para él.
- `js/ficha-consulta.js`: sin «Tomar el mando» para el directivo.
- `js/asuntos-lista-pintar.js` (`App.pasaFiltrosInicio`), `js/inicio.js`, `js/inicio-tabla.js`,
  `js/archivo-personas.js`, `js/ficha-persona.js` y el buscador de la cabecera: `Perfil.veAsunto`.
- `js/barra.js`, `index.html`, `css/…`: el menú y la cabecera del directivo, y la línea de arriba.
- `js/copias.js`, `js/conflictos.js`: el fichero nuevo.
- `js/usuarios.js`: una función para añadir un nombre desde Ajustes, si no vale la que hay.
- `js/demo/…`, `js/novedades.js`.
- `pruebas/perfil.mjs`: nueva. Casos: un nombre sin perfil es Administración y nada cambia; con
  perfil `JEFATURA` solo se listan los asuntos de tipos de Jefatura, en Inicio, en el buscador y en
  el Archivo; un tipo «Varios» o sin asignar no sale; un asunto con un elemento en `ficha.encargos` cuyo
  `de` es su nombre sale aunque sea de otro órgano; la sesión de directivo no escribe nada al entrar ni al
  abrir una ficha (ni presencia, ni copias, ni `usuarios.json`); una escritura fuera de
  `Perfil.escribir` se rechaza y una dentro pasa; el menú solo tiene Inicio y Archivo; cambiar el
  perfil en Ajustes se guarda al cambiar; conflicto de `perfiles.json` fundido por nombre.
- Al cerrar: `docs/CONTEXTO-CORTO.md` (sustituyendo, no añadiendo), `docs/contexto/PANTALLA.md`,
  `docs/contexto/FICHEROS-DEL-REPOSITORIO.md`, `docs/VOCABULARIO.md` y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Ajustes → El centro hay una sección «Quién usa la aplicación» donde se dice
quién es de Dirección, de Secretaría o de Jefatura de Estudios; que quien entra con uno de esos
nombres ve solo Inicio y Archivo con los asuntos de su órgano, sin poder cambiar nada; que los tipos
con órgano «Varios» o sin asignar no los ve ningún directivo; y que para instalarlo en el ordenador
de un directivo hay que entrar primero una vez con un nombre de Administración, señalar las
carpetas, y después entrar con el nombre del directivo.

## Cómo sabemos que está bien

En la copia de demostración, entrando como «Revisor» salvo que se diga otra cosa.

1. Ajustes → El centro: existe la sección «Quién usa la aplicación», con los nombres, su perfil y su
   correo. Plegada, su resumen cuenta cuántos hay de Administración y cuántos directivos.
2. Cambiar el perfil de un nombre y recargar la sección: el cambio sigue ahí, sin haber pulsado
   ningún «Guardar».
3. «+ Añadir persona» con un nombre nuevo: aparece en la lista con perfil «Administración».
4. Entrar con `&usuario=Jefa de estudios de prueba`: arriba sale «Entras como Jefatura de Estudios.
   Ves los asuntos de tu órgano.». El menú solo tiene «Inicio» y «Archivo». No hay tablón, ni «Ha
   llegado», ni cuadro de avisos, ni «+ Nuevo asunto».
5. En Inicio hay una sola lista. Todos los asuntos son de tipos de Jefatura de Estudios. No sale
   ninguno de Secretaría, de Dirección, de «Varios» ni sin asignar.
6. Escribir en el buscador de la cabecera el nombre de un tercero que solo tiene asuntos de
   Secretaría: no sale nada.
7. Abrir un asunto: se ven sus hitos, documentos y notas. No hay ningún botón encendido que cambie
   algo, ni «Tomar el mando». Abrir un documento: se lee en el panel.
8. Archivo: solo asuntos de tipos de Jefatura de Estudios. No hay «Reabrir».
9. Un asunto reservado de Jefatura sale con candado; «Mostrar reservados» lo destapa.
10. Entrar con `&usuario=Directora de prueba`: los asuntos son los de Dirección, y no los de
    Jefatura.
11. Volver a entrar como «Revisor»: todo como siempre (menú completo, pestañas, tablón, avisos).
12. En ninguna pantalla hay un texto que hable de permisos, de acceso restringido o de seguridad.
    Sin errores en la consola en ningún punto.
