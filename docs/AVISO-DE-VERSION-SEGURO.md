# El aviso de versión nueva de la copia sin internet, que no se pierda (fila 121)

Cerrado con Francisco el 24-sep-2026.

## El problema

La copia sin internet de Francisco se quedó en la versión de las 07:35 cuando ya estaba publicada la
de las 10:44, y no vio ningún aviso. Si la copia no puede leer `version.json` de GitHub (red que lo
bloquea, sin internet…), `js/actualizar-copia.js` solo sacaba un aviso pequeño que se borra a los
4,5 segundos, casi siempre sin que nadie lo vea. Se actualizó a mano con `ABRIR EL GESTOR.html`.

## Lo que quiere Francisco

1. Al entrar o refrescar, la copia sigue mirando si hay versión nueva (como ya hacía).
2. Si **no puede comprobarlo**, en vez del aviso que se borra, la franja amarilla de arriba, fija
   hasta que se cierre: «No he podido comprobar si hay una versión nueva (esta copia tiene la X)»,
   con el botón «Cómo actualizar a mano», que enseña los pasos de `docs/INSTALAR-COPIA.md` («Si la
   copia se ha quedado en una versión vieja»).
3. Con la aplicación abierta mucho rato, vuelve a comprobarlo sola cada 30 minutos. En esa
   comprobación nunca se recarga sola la página (se podría perder lo que se está escribiendo): si hay
   versión nueva, sale la franja de siempre con «Actualizar ahora».
4. Si se cierra la franja de «no he podido comprobar», no vuelve a salir en esa ventana; al volver a
   entrar o refrescar, sí.
