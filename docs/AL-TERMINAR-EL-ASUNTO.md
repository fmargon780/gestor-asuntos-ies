# Apartado «Al terminar el asunto» en Ajustes de un tipo (fila 274)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/1Vz0NSaJ6ch9qkFehhkzMaot9mMO5DxwG/view?usp=drivesdk).

## Qué pasó

Francisco abrió Ajustes del tipo «COBRO SEGURO ESCOLAR» y escribió: «A este tipo de asunto le
habíamos diseñado la opción de que se categorizara como "Pendiente de liquidar", pero ahora no veo
esa opción disponible».

No se ha perdido nada. La casilla de la fila 249 sigue en su sitio y funciona. Pero no se encuentra:

- Está dentro del apartado «Datos del tipo», que nace plegado. En su captura está cerrado.
- Se llama «Hay que liquidarlo antes de archivar»: no lleva las palabras «Por liquidar», que son
  las que él busca.
- Con el apartado plegado solo se lee la categoría («ALUMNADO»). Nada dice si el tipo se liquida.
- La lista de comprobación de arriba tampoco la nombra (es opcional, y así debe seguir).

## Qué quiere Francisco

Ver de un vistazo, sin abrir nada, qué pasa con los asuntos de un tipo cuando se terminan, y
encontrar la casilla sin tener que saber dónde está.

## Qué hay que hacer

### 1. Un apartado nuevo

- En la pantalla de un tipo de asunto, columna izquierda, **justo debajo de «Guía» y encima de
  «Plazo»**, un apartado plegable más, igual que los otros (`AjustesPlegado.seccion`).
- Identificador del apartado: `al-terminar`.
- Título: **«Al terminar el asunto»**.
- Texto gris de al lado: «Qué pasa con un asunto de este tipo cuando se termina.»
- Nace plegado, como los demás, y recuerda si se dejó abierto (lo hace ya `seccion`).

### 2. Lo que dice sin abrirlo

El resumen del título (`ponerResumen`), siempre con texto:

- Tipo sin la casilla de liquidar: **«se archiva»**.
- Tipo con la casilla: **«pasa a Por liquidar»**.
- Si además tiene marcado «Al cerrar el asunto, avisar a quien lo pide», se añade
  **« · avisa a quien lo pide»**. Ejemplos: «se archiva · avisa a quien lo pide»,
  «pasa a Por liquidar · avisa a quien lo pide».

Cambia solo al marcar o desmarcar, como el resto de resúmenes (ya lo hace `alCambiar`).

### 3. Lo que lleva dentro

Dos cosas que hoy están en «Datos del tipo» **se mudan** aquí, en este orden. No se duplican: en
«Datos del tipo» dejan de salir.

1. La casilla de liquidar (`tipo.liquidar`). Cambia de texto:
   **«Al terminar, pasa a «Por liquidar» en vez de archivarse»**.
   Debajo, una línea de nota: «Los asuntos terminados de este tipo esperan en la pestaña «Por
   liquidar» de Inicio hasta que se liquidan.»
2. La casilla **«Al cerrar el asunto, avisar a quien lo pide»** (`tipo.avisarLoPideCierre`), con
   su desplegable «Con la plantilla:» debajo cuando está marcada. Texto y comportamiento, los de hoy.

Todo se sigue guardando al cambiar, sin botón «Guardar».

### 4. Lo que tiene que seguir pasando igual

- Al marcar o desmarcar la casilla de liquidar: se repinta Inicio (`InicioTabla.pintar`) y se
  llama a `PorLiquidar.alMarcarCasilla(tipo)` (fila 253), exactamente como hoy.
- El dato guardado no cambia: mismos campos en `tipos.json` (`liquidar`, `avisarLoPideCierre`,
  `avisarLoPideCierrePlantilla`). **No hay nada que migrar**: lo que ya esté marcado en cada tipo
  sale marcado en el apartado nuevo.
- En «solo consultar», las casillas apagadas igual que el resto de la pantalla.

### 5. La lista de comprobación de arriba

- No se le añade ninguna línea.
- La línea «Plantilla de correo — Falta la plantilla del aviso al cerrar» abría «Datos del tipo»
  (`js/ajustes-tipo-comprobacion.js`, `seccionCorreo`). Ahora tiene que abrir **«Al terminar el
  asunto»** (`al-terminar`), que es donde queda esa casilla. Pon al día también su comentario.

## Qué NO se toca

- «Datos del tipo» conserva todo lo demás: nombre, categoría, quién lo encarga, reservado,
  conservación, repartir, nombre corto, «Lleva el sello…», «Lleva la firma…» e impresos. Su
  resumen plegado sigue igual.
- Cómo funciona «Por liquidar» (pestaña, «Liquidar», el PDF, la regla `PorLiquidar.revisar`).
- Cómo funciona el aviso al cerrar.
- La rejilla de tipos de Ajustes y sus tarjetas.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md`
  (apartado de la pantalla de un tipo) y los ficheros de la lista basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. `js/ajustes-tipo.js` tiene 522 y
  `js/ajustes-plegado.js` 572. Por eso el apartado va en un **fichero nuevo y pequeño**,
  `js/ajustes-tipo-al-terminar.js`, con dos funciones públicas: una que construye el apartado para
  un tipo y otra que devuelve el texto del resumen. A él se **mudan** (no se copian) las líneas de
  las dos casillas que hoy están en `construirSeccionDatos` (líneas 169-213 de
  `js/ajustes-tipo.js`). En `js/ajustes-tipo.js` queda solo la línea que cuelga el apartado en la
  columna, y en `js/ajustes-plegado.js` solo la que pone su resumen dentro de `resumirTipo`.
- Lo nuevo no envuelve nada: se le llama.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md` («Por liquidar», «archivar»).
- Rama `fila-274`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs al-terminar
  por-liquidar ajustes-por-tipo lista-comprobacion avisos-a-quien`); la pasada completa, una sola
  vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `js/ajustes-tipo-al-terminar.js` (nuevo: el apartado y su resumen).
- `index.html` (cargar el fichero nuevo, antes de `js/ajustes-tipo.js`) y la lista de ficheros de
  la copia sin internet.
- `js/ajustes-tipo.js` (quitar las dos casillas de «Datos del tipo» y colgar el apartado nuevo
  entre «Guía» y «Plazo»; el comentario de cabecera, si enumera los apartados).
- `js/ajustes-plegado.js` (una línea en `resumirTipo`).
- `js/ajustes-tipo-comprobacion.js` (la línea de «Plantilla de correo» abre `al-terminar`).
- `js/por-liquidar.js` (solo el comentario de cabecera, que cita el texto viejo de la casilla).
- `pruebas/al-terminar-el-asunto.mjs` (nueva, con los puntos de abajo).
- `pruebas/por-liquidar.mjs` y `pruebas/por-liquidar-al-cambiar-tipo.mjs`: buscan la casilla por
  el texto «Hay que liquidarlo antes de archivar»; pasan a buscarla por el texto nuevo.
- `pruebas/ajustes-por-tipo.mjs`: su lista `SECCIONES` cuenta ocho apartados; ahora son nueve.
- `pruebas/lista-comprobacion-tipo.mjs` y `pruebas/avisos-a-quien-lo-pide.mjs`: solo si alguno de
  sus pasos da por hecho que la casilla del aviso al cerrar está en «Datos del tipo».
- `js/novedades.js`: «En Ajustes de un tipo de asunto hay un apartado nuevo, «Al terminar el
  asunto»: sin abrirlo dice si el asunto se archiva o pasa a «Por liquidar». Ahí están ahora esa
  casilla y la de avisar a quien lo pide.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de «Por liquidar», el texto nuevo de la
  casilla y dónde está; en la de «Ajustes», el apartado nuevo, sin alargarlas),
  `docs/contexto/CAMPOS-Y-TIPOS.md` (la lista de apartados de la pantalla de un tipo) y
  `docs/HISTORIA.md`. `docs/POR-LIQUIDAR.md` y `docs/POR-LIQUIDAR-AL-CAMBIAR-TIPO.md` son
  instrucciones ya cerradas: no se reescriben.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en Ajustes de cada tipo hay un apartado «Al terminar el asunto», que sin
abrirlo dice «se archiva» o «pasa a Por liquidar», y que dentro están la casilla de liquidar (con
nombre nuevo) y la de avisar a quien lo pide. Que no ha cambiado nada de lo ya marcado.

Y la respuesta para quien mandó el aviso, en una línea: «La opción no se había perdido: estaba
dentro de «Datos del tipo». Ahora tiene su apartado, «Al terminar el asunto», y se ve sin abrirlo.»

## Cómo sabemos que está bien

Para todos los puntos, en la copia de demostración: el tipo del seguro escolar (trae marcada la
casilla de liquidar) y otro tipo cualquiera que no la traiga. Se entra por Ajustes → pestaña de
tipos de asunto → pulsar la tarjeta del tipo.

1. En la pantalla de un tipo hay nueve apartados. En la columna izquierda, en este orden: «Datos
   del tipo», «Campos», «Guía», «Al terminar el asunto», «Plazo», «Palabras clave».
2. «Al terminar el asunto» sale plegado la primera vez, con el texto gris «Qué pasa con un asunto
   de este tipo cuando se termina.»
3. En el tipo del seguro escolar, sin abrir el apartado, su título dice «pasa a Por liquidar».
4. En el otro tipo, sin abrirlo, dice «se archiva».
5. Al abrirlo salen dos casillas, en este orden: «Al terminar, pasa a «Por liquidar» en vez de
   archivarse» (con su nota debajo) y «Al cerrar el asunto, avisar a quien lo pide».
6. En el tipo del seguro escolar la primera sale marcada; en el otro, desmarcada.
7. En el otro tipo, marcar la primera casilla: sin pulsar nada más, el título del apartado pasa a
   decir «pasa a Por liquidar». Salir a Ajustes y volver a entrar en el tipo: sigue marcada.
8. Con esa casilla marcada, en Inicio sale la pestaña «Por liquidar». (Ya salía por el seguro
   escolar: comprobar que sigue.)
9. Desmarcarla: el título vuelve a «se archiva».
10. Marcar «Al cerrar el asunto, avisar a quien lo pide»: aparece debajo «Con la plantilla:» con
    su desplegable, y el título del apartado acaba en « · avisa a quien lo pide». Desmarcarla: el
    desplegable se esconde y el título pierde ese trozo.
11. Con esa casilla marcada y sin plantilla elegida, la lista de comprobación de arriba enseña
    «Plantilla de correo — Falta la plantilla del aviso al cerrar». Pulsar esa línea abre el
    apartado «Al terminar el asunto» (no «Datos del tipo»).
12. Abrir «Datos del tipo»: ya no están ninguna de las dos casillas. Siguen «Lleva el sello de
    registro de Séneca» y «Lleva la firma digital del director», el nombre corto y los impresos.
    Plegado, su título sigue diciendo solo la categoría (y el nombre corto, si lo tiene).
13. En ningún sitio de la pantalla queda el texto «Hay que liquidarlo antes de archivar».
14. Dejar abierto «Al terminar el asunto», salir y entrar en otro tipo: sigue abierto (se recuerda
    por apartado, como los demás).
