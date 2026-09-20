# Quién mantiene al día los impresos de `formularios/`

20-sep-2026. Acordado con Francisco. **No es una fila de la cola**: no hay trabajo
para Claude Code. Está escrito aquí para que se sepa quién hace esto y por qué.

## El problema

La fila 84 dejó montado el relleno automático de los impresos oficiales: la aplicación
abre el PDF, le pone los datos del centro y lo deja preparado. Para eso necesita el
fichero, no un enlace: por eso los PDF viven en `formularios/` dentro de este
repositorio, y no se piden a la web de la Junta cada vez.

Eso trae un peligro nuevo, y no es el que parece. Un enlace roto se ve enseguida y se
arregla en dos minutos. Lo malo es lo contrario: que la Junta actualice un impreso, que
nuestra copia se quede con la versión vieja, y que se entregue un impreso caducado sin
que nadie se entere. Un enlace roto avisa. Una copia vieja, no.

## Quién lo resuelve

No hace falta nada nuevo en esta aplicación. Ya existe una **tarea programada de Claude**
que se lanza todos los días a las 07:00 (hora de España), llamada *Vigilancia diaria de
normativa del instituto*. Vigila el BOJA, el BOE y la página de normativa de la
Consejería para el proyecto `fmargon780/normativa-escolarizacion`, y en su apartado 1c
ya comprobaba a diario que siguieran vivos los enlaces de descarga de los impresos.

El 20-sep-2026 se le añadió el **apartado 4 bis**, que es lo que la conecta con este
repositorio.

## Qué hace ahora, cuando un impreso cambia

1. Corrige el enlace en el catálogo del proyecto de normativa (documento 16), como
   hacía antes.
2. Baja el PDF nuevo y lo deja en `formularios/`, **con el mismo nombre que ya tenía**
   (la clave `f` de esa entrada en `datos/formularios.json`). El nombre no cambia nunca:
   es lo que une cada impreso con su mapa de casillas en
   `_GESTOR/formularios-campos.json`.
3. Guarda la copia anterior en `formularios/anteriores/<nombre>-<AAAA-MM-DD>.pdf`.
4. Actualiza en `datos/formularios.json` la clave `u` de esa entrada, para que las dos
   listas digan lo mismo.
5. Lo cuenta en el aviso del día a Francisco: qué impreso ha cambiado y de qué norma es.

Todo lo del día va en un solo commit, aunque cambien varios impresos, para no gastar
publicaciones de Vercel.

## Las dos listas

Hay dos catálogos del mismo asunto: el del proyecto de normativa (documento 16) y la
copia que la fila 82 trajo aquí, `datos/formularios.json`. **Manda siempre el del
proyecto de normativa.** El de aquí es una copia suya, nunca al revés. Si alguna vez
discrepan, se corrige el de aquí.

De las 29 entradas del catálogo, solo **once** tienen PDF que guardar (las que llevan
clave `f`). Las demás son protocolos, cuyo texto está en el BOJA, o documentos que
genera y firma Séneca: no hay impreso que descargar.

## Lo que sigue pendiente

La carpeta `formularios/` todavía está vacía: la sesión que hizo la fila 84 no tenía
salida a internet y no pudo bajar los once PDF. Eso es la **fila 85** de `docs/COLA.md`,
y sigue PENDIENTE. Hasta que se haga, el relleno automático de impresos no sirve para
nada, y el vigilante no tiene copia que actualizar.
