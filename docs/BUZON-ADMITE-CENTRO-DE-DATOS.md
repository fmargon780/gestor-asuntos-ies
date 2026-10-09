# El buzón de soporte admite el Centro de datos (fila 315 de la cola)

Diseño cerrado con Francisco el 9-oct-2026, en Cowork (conversación del proyecto «Centro de datos
ies»).

## Qué se quiere

El Centro de datos (`fmargon780/centro-de-datos-ies`, la aplicación donde se sueltan una sola vez
los listados de Séneca) va a tener el mismo botón «Soporte» que el Gestor: es la fila 4 de su cola
(`docs/04-BOTON-DE-SOPORTE.md` de ese repositorio). Hoy el buzón (`apps-script/soporte.gs`)
rechaza sus avisos, porque ese repositorio no está en `REPOS_PERMITIDOS`. Esta fila lo añade.

Es una aplicación del instituto: sus avisos van al **mismo buzón y a la misma carpeta de Drive**
(`SOPORTE-AVISOS`, subcarpeta `Centro de datos`) que los de las demás.

Esta fila solo toca el buzón, su prueba y sus documentos. No toca el botón del Gestor
(`js/soporte.js`) ni nada de lo que se ve en la aplicación.

## 1. La lista de repositorios permitidos

Añade `'fmargon780/centro-de-datos-ies'` a `REPOS_PERMITIDOS`, escrito exactamente así: es lo que
manda el botón del Centro de datos en el campo `repo`. En el campo `app` manda `Centro de datos`.

Nada más cambia en el script. La cola del Centro de datos es una tabla de cuatro columnas
(`| Nº | Instrucción | Estado | Notas |`), que el buzón ya sabe escribir desde la fila 261.

Cambia `VERSION_SCRIPT`.

## 2. Los pasos de Francisco

Pon al día `docs/PONER-EN-MARCHA-SOPORTE.md`: en el paso 1, la lista de repositorios del permiso
de GitHub lleva también `centro-de-datos-ies`.

Añade a `docs/TE-TOCA.md` (una línea sin marcar, con su formato), a `docs/COMPROBAR-A-MANO.md` y a
«Lo que queda por hablar con Francisco» de la cola sus dos pasos, en lenguaje llano:

1. En GitHub, abrir el permiso «Soporte del Gestor»
   (https://github.com/settings/personal-access-tokens), «Repository access», añadir
   `centro-de-datos-ies` y guardar. El permiso *Contents: Read and write* ya lo tiene.
2. Volver a pegar `apps-script/soporte.gs` en el proyecto «Gestor - Soporte», ejecutar
   `prepararTodo` (el registro tiene que decir «Bien: fmargon780/centro-de-datos-ies») e
   «Implementar» → «Gestionar implementaciones» → el lápiz → «Nueva versión» → «Implementar». La
   dirección del buzón no cambia.

Si todavía tenía pendiente algún pegado anterior del buzón, es el mismo pegado: uno solo vale para
todos.

## 3. Pruebas

En `pruebas/soporte-script.mjs` (Drive, GitHub y correo falsos):

- Un aviso de `fmargon780/centro-de-datos-ies` se acepta.
- Su fila, en una cola de cuatro columnas, tiene cuatro celdas, con `IDEA (fecha)` sola en la
  tercera y el enlace en la cuarta, y no lleva el texto del usuario.
- Un aviso de un repositorio que no está en la lista se sigue rechazando.

`npm test` completo en verde antes de publicar.

## 4. Fuera de esta fila

- El botón del Centro de datos: fila 4 de su cola.
- Que el Gestor lea la dirección del buzón del Centro de datos: fila 316 de esta cola.
- El botón del Gestor y cualquier otro cambio del buzón.

## Cómo sabemos que está bien

Esta fila no cambia nada que se vea en la aplicación; se comprueba con la prueba del script.

1. `node pruebas/soporte-script.mjs` termina en verde y su salida nombra los casos del punto 3.
2. En esa salida, un aviso de `fmargon780/centro-de-datos-ies` se acepta, y uno de
   `fmargon780/otro-cualquiera` se rechaza con «Este repositorio no puede mandar avisos.»
3. En esa salida, la fila escrita para el Centro de datos tiene cuatro celdas, con `IDEA (fecha)`
   sola en la tercera.
4. `REPOS_PERMITIDOS` de `apps-script/soporte.gs` tiene `fmargon780/centro-de-datos-ies` y
   `VERSION_SCRIPT` ha cambiado.
5. `docs/PONER-EN-MARCHA-SOPORTE.md` nombra `centro-de-datos-ies` en la lista del paso 1.
6. Abrir la aplicación con datos de demostración: el botón «Soporte» sigue abajo a la derecha y
   su ventana se abre y se cierra como antes (no se ha tocado).
7. **[SOLO FRANCISCO]** Añadir `centro-de-datos-ies` al permiso de GitHub, pegar el script y
   ejecutar `prepararTodo`: el registro dice «Bien: fmargon780/centro-de-datos-ies».
8. **[SOLO FRANCISCO]** Tras «Nueva versión», y con el botón del Centro de datos ya publicado,
   enviar un aviso desde el Centro de datos: sale «Recibido. Gracias.» y aparece una IDEA nueva
   del Centro de datos en el Centro de mando.
