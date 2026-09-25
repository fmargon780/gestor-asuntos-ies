# Fila 167 — Las Administraciones Públicas, un tipo de tercero propio

Cerrado con Francisco el 25-sep-2026, en conversación. **Va después de la fila 166**: da por
hecho que todas las listas de categorías leen `Nombres.CATEGORIAS`.

## Para qué

El centro trata a diario con organismos (Delegaciones Territoriales, Ayuntamiento, Agencia
Pública Andaluza de Educación, Inspección…) y con otros centros educativos. Hoy van en OTROS o en
EMPRESAS, sin estructura. Hace falta una categoría propia con sus departamentos.

## Qué se ve

1. **Categoría nueva `ADMINISTRACIONES`** en `Nombres.CATEGORIAS`, con carpeta propia en el
   ARCHIVO (`ARCHIVO/ADMINISTRACIONES/<tercero>`), tipos de asunto propios, filtros, Cuentas,
   buscadores, reservados, papelera: igual que las demás categorías.
2. **Dos grupos dentro**, en Personas y empresas y en el buscador de terceros de «Nuevo asunto»:
   - **Organismos** (clase `organismo`), agrupados por el dato opcional **«Depende de»** (la
     Consejería u órgano superior). Sin ese dato, bajo «Otros organismos».
   - **Centros educativos** (clase `centro`): institutos y colegios, públicos y concertados.
3. **El nombre de la carpeta** (regla 4 de `docs/CONTEXTO-CORTO.md`, se añade una línea):
   - Organismo: **un nombre corto y estable que elige Francisco** al darlo de alta (por ejemplo
     `Delegación Educación Málaga`). **Ni el DIR3 ni la Consejería van en el nombre**: los nombres
     de Consejerías y Delegaciones y sus códigos DIR3 cambian varias veces por legislatura.
   - Centro educativo: nombre corto + **código de centro** de 8 cifras (`IES Ejemplo 29000000`),
     que no cambia.
   - Dos organismos con el mismo nombre corto no se permiten (se avisa al darlo de alta).
4. **La ficha del organismo o del centro**: nombre corto, nombre oficial, DIR3 (organismo) o código
   de centro (centro), «Depende de», correo, teléfono, dirección y **el árbol de departamentos**.
   - Cada departamento: nombre, correo, teléfono, persona de contacto, DIR3 (opcional), y sus
     subdepartamentos (sin límite de niveles). Se añaden, cambian y quitan desde la propia ficha.
   - Un centro educativo nuevo trae de partida tres departamentos: Secretaría, Dirección y
     Jefatura de Estudios.
   - **Nombres anteriores**: al cambiar el nombre oficial o el de «Depende de», el viejo se guarda
     en una lista «Antes: …» con la fecha del cambio. El buscador de terceros encuentra también
     por los nombres anteriores.
   - **«Depende de» es un dato compartido**: cambiar el nombre de una Consejería en un sitio lo
     cambia en todos sus organismos (guardar la lista de órganos superiores aparte y enlazarla por
     id, no copiar el texto en cada organismo).
   - **Cambiar el nombre oficial, el DIR3 o «Depende de» nunca renombra carpetas.** Cambiar el
     nombre corto sí (es el nombre del tercero), por `AsuntoRenombrar` y el mismo camino que ya usa
     «editar datos de un tercero dado de alta a mano».
5. **El departamento en el asunto**: al crear o editar un asunto de esta categoría, un
   desplegable opcional «Departamento» con el árbol del organismo elegido. Se guarda en la ficha
   del asunto de `asuntos.json` (`departamento: {id, nombre}`, nombre copiado para que se lea aunque
   luego se borre del árbol). Sale en «Datos del trámite» y en la tarjeta «Datos y contacto».
   **No va en el nombre de la carpeta.**
   - En Correo y en Séneca, el correo del departamento elegido se propone como destinatario (y si
     no tiene, el del organismo). Huecos de plantilla nuevos: `{departamento}`,
     `{departamentocorreo}`, `{organismooficial}`.
6. **Alta a mano**, desde «Nuevo asunto» (sin salir de la pantalla, como el alta de hoy de
   empresas) y desde Personas y empresas. No hay fuente de datos automática.
7. **Traer lo que ya hay** (Ajustes › Mantenimiento, botón «Pasar a Administraciones»): lista los
   terceros de OTROS y de EMPRESAS con asuntos o con alta; Francisco marca cuáles son organismos o
   centros, y les pone nombre corto (propuesto a partir del actual). La aplicación:
   - da de alta cada uno en la categoría nueva;
   - mueve sus asuntos abiertos y archivados (carpeta y ficha, por `AsuntoRenombrar`, y en el
     ARCHIVO con el mismo mover-y-comprobar de archivar/reabrir);
   - quita su alta vieja de `otros.csv`/`empresas.csv`;
   - avisa al final de cuántos ha movido, y de cualquiera que no haya podido mover (sin parar el
     resto).
   Los **tipos de asunto** de OTROS que son claramente de Administraciones (por ejemplo
   INSPECCION, SUBVENCION, CONVENIO) no se mueven solos: en la misma pantalla, casillas para
   marcar qué tipos pasan también a la categoría nueva.
8. **Los organismos también en los demás sitios donde se elige un tercero**: «Lo pide», terceros
   relacionados, destinatarios de correo y de Séneca, el recuadro de asuntos parecidos, la parada
   de duplicados, «Por clasificar» y la bandeja de Gmail (reconocer por nombre corto, nombre
   oficial, nombres anteriores, DIR3 o código de centro, y por el dominio del correo del
   organismo o de sus departamentos).

## Dónde se guarda

`_GESTOR/datos/administraciones.json` (el árbol no cabe bien en un CSV):
`{ superiores: [{id, nombre, antes: [{nombre, hasta}]}], organismos: [{id, clase, corto, oficial,
dir3, codigoCentro, superior, correo, telefono, direccion, antes: [...], departamentos: [{id,
nombre, correo, telefono, contacto, dir3, hijos: [...]}]}] }`. Escrito **siempre** por
`ColaGuardado`, y dado de alta en `js/conflictos.js` (unir por `id`) y en las copias diarias
(`js/copias.js`).

## Ficheros que se tocan

`js/nombres.js` (categoría y regla del nombre), `js/datos.js` (cargar la categoría desde el JSON,
`destacados`, `pie`), `js/datos-listas.js` (guardar), `js/conflictos.js`, `js/copias.js`,
`js/asuntos-nuevo.js` y `js/asuntos-nuevo-campos.js` (alta y desplegable de departamento),
`js/asuntos-editar.js`, `js/ficha-asunto.js` (Datos del trámite), `js/ficha-tercero.js`,
`js/archivo-personas.js`, `js/correo.js` y `js/plantillas-valores.js` (destinatario y huecos),
`js/duplicados.js`, `js/bandeja-propuesta.js`, `js/documentos-sueltos-sugerencias.js`.
Lógica nueva en módulos propios: `js/administraciones.js` (`window.Administraciones`: datos,
árbol, nombres anteriores), `js/administraciones-ficha.js` (la ficha y su editor de árbol) y
`js/administraciones-traer.js` (el botón de Mantenimiento). Estilos en `css/administraciones.css`.
Enganchados por puntos previstos, **sin envolturas nuevas**. Ningún fichero pasa de 600 líneas.

Documentación de cierre: `docs/contexto/PERSONAS.md` (sección nueva), `docs/CONTEXTO-CORTO.md`
(regla 4 y una línea en la sección 5), `docs/COLA.md`, `docs/HISTORIA.md`.

## Cómo trabajar

- Subir directamente a `main`, sin abrir ninguna pull request (si la sesión lo impide, la nota
  del final de `docs/COLA.md`).
- Cambios quirúrgicos: no reescribir ficheros enteros.
- No leer el repositorio entero: `docs/CONTEXTO.md`, `docs/contexto/PERSONAS.md`,
  `docs/contexto/ASUNTOS.md`, `docs/contexto/ASUNTOS-ARCHIVO.md` y los ficheros de la lista.
- **Una sola prueba al final**, `pruebas/administraciones.mjs`, con datos inventados:
  1. Alta de un organismo con dos niveles de departamentos y de un centro educativo (trae sus tres
     departamentos). Nombres de carpeta: `Delegación Educación Málaga` y `IES Ejemplo 29000000`.
  2. Cambiar el nombre de la Consejería de la que dependen dos organismos: cambia en los dos, se
     guarda el anterior, el buscador encuentra por el anterior y **ninguna carpeta cambia**.
  3. Un asunto con departamento: sale en Datos del trámite y su correo se propone en Correo.
  4. «Pasar a Administraciones» con un tercero de OTROS con un asunto abierto y otro archivado:
     los dos acaban en la categoría nueva, con sus hitos y notas, y el alta vieja desaparece.
  5. `npm test` entero en verde.
