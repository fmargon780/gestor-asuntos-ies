# Nombres de pila largos: se acortan con iniciales (fila 247)

Aviso de usuario del 1-oct-2026 (pantalla Inicio), de Francisco:
https://drive.google.com/file/d/1F9nlRXkO45yDLpPhg8RBXk-rCHrFqSYe/view?usp=drivesdk

## El problema

Una alumna importada de Séneca tiene cuatro nombres de pila. El tercero aparece dos veces en la
ruta: en la carpeta del tercero y en el nombre de la carpeta del asunto
(`<Dropbox>/<ARCHIVO>/<CATEGORÍA>/<tercero>/<AAMMDD A26-0137 TIPO tercero>/_Previas/<documento>`).
Con un nombre así, `Nombres.cabeEnRuta` (`js/nombres-topes.js`, tope 240) da `noCabe` y la app no
deja crear el asunto (aviso rojo).

## Lo que decidió Francisco

1. **Regla.** Si el nombre de una persona, tal como se escribe en el tercero
   (`Apellido1 Apellido2, Nombre…`, sin el número de identificación ni los 4 caracteres del
   documento), **pasa de 40 caracteres**, los nombres de pila se acortan así: **el primero se queda
   entero y los demás pasan a su inicial con punto**. Los apellidos no se tocan nunca, ni el número
   escolar / los 4 caracteres del documento que van detrás.
   - Ejemplo: `García López, María Concepción Josefa Remedios 1234567` →
     `García López, María C. J. R. 1234567`.
   - Partículas sueltas dentro de los nombres de pila (`de`, `del`, `de la`, `los`…) se quitan al
     acortar: `María de los Ángeles Rocío` → `María Á. R.`.
   - Con 40 caracteres o menos, el nombre queda igual que hoy.
   - Si después de acortar todavía no cabe en la ruta, se mantiene el aviso rojo de siempre (no se
     inventa otro recorte).
2. **A quién se aplica:** alumnado (`terceroAlumno`), personal (`terceroPersonal`) y tutores
   legales (`terceroTutor`), en `js/nombres.js`. No a empresas ni a Administraciones.
3. **Solo en los nombres de carpetas y ficheros.** El nombre completo se sigue viendo en la ficha
   del asunto, en la ficha de la persona, en Personas y empresas, en los buscadores y en los
   documentos que se generan (certificados, correos, Word…). Si hoy alguno de esos sitios sale
   del nombre de la carpeta, que pase a sacarlo de los datos de la persona.
4. **Lo que ya existe no se toca.** Ninguna carpeta se renombra.

## Cuidado: no partir a una persona en dos carpetas

Si una persona ya tiene carpeta de tercero con el nombre largo (creada antes de este cambio), un
asunto nuevo suyo tiene que ir **a esa misma carpeta**, no a una nueva con el nombre corto. Buscar
la carpeta del tercero por su número escolar (alumnado) o por los 4 caracteres del documento más
los apellidos (personal y tutores), no solo por el texto exacto del nombre. Si ya existe, se usa
ese nombre de carpeta tal cual; el nombre corto solo se usa cuando la carpeta no existe todavía.
Lo mismo al reconocer asuntos de una persona (hermanos, «lo que ya tiene el tercero», duplicados,
índice del ARCHIVO): la forma corta y la larga son la misma persona.

## Dónde mirar

- `js/nombres.js`: `terceroAlumno`, `terceroPersonal`, `terceroTutor`, `U.limpiarNombre`. Una sola
  función nueva (p. ej. `Nombres.acortarNombrePila(nombre)`) que usen las tres.
- `js/nombres-topes.js` (`cabeEnRuta`, `medidor`): el medidor de Ajustes → El centro → «Largo de
  las rutas» debe calcular el peor caso con el nombre ya acortado.
- Donde se busca o se crea la carpeta del tercero (`Carpetas.bajar` con `[categoria, tercero]`, en
  `js/asuntos-archivar.js` y en la creación de asuntos).
- Datos de demostración (`js/demo/`): añadir una alumna con cuatro nombres de pila.

## Cómo sabemos que está bien

1. En la copia de pruebas, Nuevo asunto para la alumna de cuatro nombres de pila: la vista previa
   enseña `Apellido1 Apellido2, Nombre I. I. I. <número>`, sin aviso rojo, y el asunto se crea.
2. La ficha de ese asunto y la ficha de la alumna enseñan el nombre completo.
3. Una persona con nombre de 40 caracteres o menos sale exactamente igual que antes.
4. Una persona que ya tenía carpeta de tercero con el nombre largo: su asunto nuevo se guarda
   dentro de esa carpeta, no en una nueva.
5. Las partículas (`de`, `del`, `de la`, `los`) desaparecen al acortar, y los apellidos compuestos
   no se tocan.
6. Una empresa o una Administración con nombre largo no cambia.
7. Prueba nueva `pruebas/nombres-de-pila-largos.mjs` con estos casos, en verde, y
   `pruebas/nombres-fijos-con-numero.mjs` sigue en verde.

## Al terminar

Poner al día `docs/contexto/NOMBRES-FIJOS.md` y la sección 4 de `docs/CONTEXTO-CORTO.md` (una
línea: nombres de pila de más de 40 caracteres, primero entero y el resto en inicial).
