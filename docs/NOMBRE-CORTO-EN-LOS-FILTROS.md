# Fila 97 — el nombre corto del tipo, también en los filtros y en la tarjeta

23-sep-2026. Diseñado y cerrado con Francisco el 23-sep-2026 (14:00).

## 1. Lo que pasa hoy

Desde la fila 79 cada tipo puede tener un **nombre corto** (`nombreCorto` en `tipos.json`,
`Nombres.tipoParaCarpeta`), y es el que se usa para nombrar la carpeta. Pero las tarjetas de
filtro «Por tipo de asunto» (`js/asuntos-lista.js`) y la etiqueta del tipo en la tarjeta del
asunto siguen enseñando el nombre largo. Un tipo como «TRASLADO DE EXPEDIENTE ACADÉMICO
SOLICITADO AL CENTRO DE ORIGEN» se come una fila entera de filtros él solo.

## 2. Lo acordado

1. Los filtros «Por tipo de asunto» enseñan el **nombre corto** cuando el tipo lo tenga; si no,
   el de siempre.
2. La etiqueta del tipo en la tarjeta del asunto, igual.
3. En los dos sitios, el nombre largo sale al pasar el ratón por encima (atributo `title`).
4. El buscador encuentra un asunto **por los dos nombres**, el largo y el corto.

## 3. Cuidado con esto

- El filtro sigue agrupando por el tipo de verdad, no por el texto que se enseña: dos tipos
  distintos con el mismo nombre corto no se pueden mezclar en una sola tarjeta. (Ajustes ya avisa
  en rojo de un nombre corto repetido, pero la lista tiene que aguantarlo igual.)
- La búsqueda en el ARCHIVO pasa por `IndiceArchivo.textoDeBusqueda`. El nombre corto y el largo
  se resuelven al buscar, desde `App.E.tipos`, **sin subir la `VERSION` del índice**: así nadie
  tiene que reconstruirlo.
- Cambiar el nombre corto de un tipo no renombra ninguna carpeta ya creada, como hasta ahora.

## 4. Cómo se comprueba

`pruebas/nombre-corto-de-tipo.mjs`, ampliada: un tipo con nombre corto y otro sin él, las tarjetas
de filtro y la etiqueta del asunto con el texto que toca y su `title`, y que buscar por el nombre
largo y por el corto encuentra el mismo asunto, abierto y archivado.

Sube a `main` sin abrir ninguna petición de cambios.
