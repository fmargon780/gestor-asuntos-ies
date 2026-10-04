# El buzón de soporte admite Focus Lingo (fila 262 de la cola)

Diseño cerrado con Francisco el 4-oct-2026, en Cowork (conversación del proyecto Focus Lingo).

## Qué se quiere

Focus Lingo (la app con la que los hijos de Francisco preparan el B1 de inglés) va a tener el
mismo botón «Soporte» que el Gestor: es la fila 13 de su cola (`docs/07-BOTON-DE-SOPORTE.md` de
`fmargon780/Focus_Lingo`). Hoy el buzón (`apps-script/soporte.gs`) rechaza sus avisos, porque ese
repositorio no está en `REPOS_PERMITIDOS`. Esta fila lo añade.

Decisión de Francisco: los avisos de Focus Lingo van al **mismo buzón y a la misma carpeta de
Drive** (`SOPORTE-AVISOS`, subcarpeta `Focus Lingo`) que los de las demás apps. Con esto queda
contestado, para Focus Lingo, lo que el punto 8 de `docs/BUZON-PARA-TODAS-LAS-APPS.md` dejaba
pendiente sobre las apps que no son del instituto.

Esta fila solo toca el buzón, su prueba y sus documentos. No toca el botón del Gestor
(`js/soporte.js`) ni nada de lo que se ve en la aplicación.

## 1. La lista de repositorios permitidos

Añade `'fmargon780/Focus_Lingo'` a `REPOS_PERMITIDOS`, escrito exactamente así (con la F y la L
en mayúscula y el guion bajo): es lo que manda el botón de Focus Lingo en el campo `repo`.

Nada más cambia en el script. La cola de Focus Lingo es una tabla de cuatro columnas
(`| Nº | Instrucción | Estado | Notas |`), que el buzón ya sabe escribir desde la fila 261.

Cambia `VERSION_SCRIPT`.

## 2. Los pasos de Francisco

Pon al día `docs/PONER-EN-MARCHA-SOPORTE.md`: en el paso 1, la lista de repositorios del permiso
de GitHub lleva también `Focus_Lingo`.

Añade a `docs/COMPROBAR-A-MANO.md` y a «Lo que queda por hablar con Francisco» de la cola una
línea con sus dos pasos, en lenguaje llano:

1. En GitHub, abrir el permiso «Soporte del Gestor»
   (https://github.com/settings/personal-access-tokens), «Repository access», añadir
   `Focus_Lingo` y guardar. El permiso *Contents: Read and write* ya lo tiene.
2. Volver a pegar `apps-script/soporte.gs`, ejecutar `prepararTodo` (el registro tiene que decir
   «Bien: fmargon780/Focus_Lingo») e «Implementar» → «Administrar implementaciones» → «Nueva
   versión».

Si todavía tenía pendiente el pegado de las filas 240 o 261, es el mismo pegado: uno solo vale
para todas.

## 3. Pruebas

En `pruebas/soporte-script.mjs` (Drive, GitHub y correo falsos):

- Un aviso de `fmargon780/Focus_Lingo` se acepta.
- Su fila, en una cola de cuatro columnas, tiene cuatro celdas, con `IDEA (fecha)` sola en la
  tercera y el enlace en la cuarta, y no lleva el texto del usuario.
- Un aviso de un repositorio que no está en la lista se sigue rechazando.

`npm test` completo en verde antes de publicar.

## 4. Fuera de esta fila

- El botón de Focus Lingo: fila 13 de su cola.
- El botón del Gestor y cualquier otro cambio del buzón.

## Cómo sabemos que está bien

Esta fila no cambia nada que se vea en la aplicación; se comprueba con la prueba del script.

1. `node pruebas/soporte-script.mjs` termina en verde y su salida nombra los casos del punto 3.
2. En esa salida, un aviso de `fmargon780/Focus_Lingo` se acepta, y uno de
   `fmargon780/otro-cualquiera` se rechaza con «Este repositorio no puede mandar avisos.»
3. En esa salida, la fila escrita para Focus Lingo tiene cuatro celdas, con `IDEA (fecha)` sola
   en la tercera.
4. `REPOS_PERMITIDOS` de `apps-script/soporte.gs` tiene `fmargon780/Focus_Lingo` y
   `VERSION_SCRIPT` ha cambiado.
5. `docs/PONER-EN-MARCHA-SOPORTE.md` nombra `Focus_Lingo` en la lista del paso 1.
6. Abrir la aplicación con datos de demostración: el botón «Soporte» sigue abajo a la derecha y
   su ventana se abre y se cierra como antes (no se ha tocado).
7. **[SOLO FRANCISCO]** Añadir `Focus_Lingo` al permiso de GitHub, pegar el script y ejecutar
   `prepararTodo`: el registro dice «Bien: fmargon780/Focus_Lingo».
8. **[SOLO FRANCISCO]** Tras «Nueva versión», y con el botón de Focus Lingo ya publicado, enviar
   un aviso desde Focus Lingo: sale «Recibido. Gracias.» y aparece una IDEA nueva de Focus Lingo
   en el Centro de mando.
