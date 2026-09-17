# "Lo pide": el nombre del tutor legal, no un número

Fecha: 17-sep-2026. Módulo: `js/lo-pide.js` (y de rebote `js/plantillas.js`).

## El fallo, visto por Francisco

En el bloque **"Lo pide"** (pantalla de Nuevo asunto y cuadro de la ficha), al desplegar
"Quién lo pide" en un asunto de alumnado, las opciones de los tutores legales salen así:

    Tutor legal 1 · 12345678
    Tutor legal 2 · 87654321

Es decir: sale un número en lugar del nombre de la persona. Se elige a ciegas.

## Por qué pasa

`LoPide.datosDeTutor(campos, numero)` (en `js/lo-pide.js`) coge todas las columnas del
RegAlum cuyo título hable de "tutor" y de ese número, descarta las de teléfono y las de
correo, y se queda con **la primera que quede** como nombre:

```
var claveNombre = Object.keys(propios).filter(function (k) {
  var t = U.normalizar(k);
  return !RE_TELEFONO.test(t) && !RE_CORREO.test(t);
})[0];
```

En el RegAlum del centro esa primera columna no es el nombre: es un documento o un número
de identificación del tutor. De ahí el número en pantalla.

La misma función alimenta los huecos `{tutor1}` y `{tutor2}` de las plantillas de correo
(`js/plantillas.js`), así que ahí también se está colando el número.

## Lo que hay que hacer

Cambiar **solo** cómo `datosDeTutor` elige la columna del nombre. Todo lo demás
(teléfono, correo, opciones, guardado) se queda igual.

### 1. Columnas que nunca son el nombre

Además de teléfono y correo, descartar las columnas cuyo título (normalizado con
`U.normalizar`) hable de:

- documento, dni, nif, nie, pasaporte
- identificacion, identificador, ident
- numero, num, nº, codigo
- parentesco, relacion, sexo
- fecha, nacimiento
- domicilio, direccion, localidad, municipio, provincia, pais, nacionalidad, postal

### 2. Cómo se arma el nombre, por orden

De las columnas que sobrevivan:

1. Si hay una que hable de **apellidos** y otra que hable de **nombre**, el nombre es
   `Apellidos, Nombre` (una sola coma; si el valor de apellidos ya trae coma, se deja tal
   cual y no se añade nada).
2. Si solo hay una que hable de **nombre** (suele traer el nombre completo), se usa entera.
3. Si solo hay una que hable de **apellidos**, se usa entera.
4. Si ninguna habla de nombre ni de apellidos, se usa la primera que quede (como hasta ahora).

### 3. Red de seguridad

El valor elegido tiene que contener **al menos una letra** (vale con acentos y con ñ). Si no
la tiene —es un número suelto—, el nombre se queda vacío. Así nunca vuelve a salir un número
haciéndose pasar por una persona.

### 4. Qué se ve cuando no hay nombre

Hoy, si no hay nombre, la opción del tutor no se ofrece. Eso no puede empeorar con este
cambio: si el RegAlum no trae el nombre pero sí el correo o el teléfono del tutor, la opción
se sigue ofreciendo, con el texto **"Tutor legal 1"** a secas (sin " · " ni nada detrás).

Al guardar ese caso, en `loPide` se apunta `nombre: 'Tutor legal 1'` (o 2) y `relacion: ''`,
para que la línea de la ficha salga limpia: `Tutor legal 1 · por teléfono · 17-sep-2026`.
Cuando sí hay nombre, no cambia nada: `María López Ruiz (Tutor legal 1) · …`.

## Pruebas

Añadir pruebas de `LoPide.datosDeTutor` con varios juegos de columnas, al menos:

- `{"Nº identificación tutor 1": "12345678", "Nombre tutor 1": "María López Ruiz", "Teléfono tutor 1": "600...", "Correo tutor 1": "m@x.es"}` → nombre `María López Ruiz`.
- Apellidos y nombre en columnas distintas → `López Ruiz, María`.
- Solo la columna del número → nombre vacío.
- Ninguna columna del tutor 2 → los tres campos vacíos, y la opción no aparece.
- Que `{tutor1}` de `js/plantillas.js` sigue funcionando y ahora trae el nombre.

Y comprobar lo publicado con `curl`, como siempre.

## Al terminar

- Sustituir en `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` la línea que toque sobre "Lo pide"
  (no añadir otra debajo).
- Anotar en `docs/HISTORIA.md` lo que merezca recordarse, con la fecha.
- Marcar la fila en `docs/COLA.md` como HECHA.
