# Gestor de Asuntos

Aplicación web para llevar los expedientes y asuntos de un centro educativo,
trabajando **directamente sobre las carpetas de siempre** (por ejemplo, un
Dropbox sincronizado en los ordenadores del centro).

No hay servidor, no hay base de datos y no hay ninguna cuenta que dar de alta.
La aplicación se abre en el navegador, el usuario le señala una vez sus dos
carpetas, y a partir de ahí crea, nombra, mueve y busca dentro de ellas.

## Qué hace

- **Nuevo asunto.** Se elige primero la categoría (ALUMNADO, PERSONAL,
  EMPRESAS, OTROS) y después el tipo. Se busca al tercero escribiendo tres
  letras y la carpeta aparece ya nombrada en la carpeta de asuntos abiertos.
- **Cerrar.** Lleva la carpeta a `ARCHIVO / CATEGORÍA / TERCERO`, creando por
  el camino lo que falte. Copia primero, comprueba que ha llegado todo y solo
  entonces borra el original.
- **Reabrir.** El mismo camino al revés.
- **Buscador de personas y empresas.** Alumnado desde el `RegAlum.csv` de
  Séneca, con la edad actual y los datos de contacto de los tutores legales
  arriba del todo. Personal, empresas y otros desde tres CSV que mantiene la
  propia aplicación.
- **Los asuntos de un tercero**, abiertos y archivados, en una sola lista.

## El nombre de la carpeta

    AAMMDD  TIPO  [AÑO ACADÉMICO]  [GRUPO]  [DESCRIPCIÓN]  TERCERO

    260907 MATRICULA 26-27 3ºA Cambio de optativa Pérez García, Ana 1234567

El nombre es la ficha del asunto: si siempre se monta igual, el archivo se
puede leer entero años después sin más ayuda que la lista de tipos.

El grupo es opcional y se abrevia. En la ESO no lleva la etapa (`1ºA`), pero en
Bachillerato y en Formación Profesional sí (`1ºBachA`, `1ºFPA`), para que dos
grupos distintos no acaben llamándose igual.

## Dónde vive la configuración

Dentro de la carpeta de asuntos abiertos, en `_GESTOR`:

| Fichero | Qué es |
|---|---|
| `tipos.json` | Los tipos de asunto y a qué categoría va cada uno. Lo comparten todos los ordenadores. |
| `asuntos.json` | El registro: quién abrió cada asunto, cuándo se cerró y dónde está. |
| `datos/RegAlum.csv` | El histórico de matrículas de Séneca. Lo deja el usuario. |
| `datos/personal.csv` | Personal del centro. Lo crea y lo mantiene la aplicación. |
| `datos/empresas.csv` | Proveedores. Igual. |
| `datos/otros.csv` | Todo lo demás. Igual. |

## Requisitos

Google Chrome o Microsoft Edge, en un ordenador donde las carpetas se vean
como carpetas normales. Usa la API de acceso al sistema de ficheros del
navegador, que no existe en Firefox, Safari ni en el móvil.

## Pruebas

- `pruebas/logica.mjs` — nombres, abreviatura del grupo, edad, lectura de CSV
  y movimiento de carpetas, sobre un disco de mentira en memoria.
- `pruebas/navegador.mjs` — la aplicación entera en Chromium: crear un asunto,
  cerrarlo, verlo en el archivo, reabrirlo, buscar una persona y comprobar la
  tabla de abreviaturas de grupo.
