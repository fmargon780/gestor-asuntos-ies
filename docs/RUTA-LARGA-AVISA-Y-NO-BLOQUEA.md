# La ruta larga avisa, pero no impide crear el asunto (fila 263)

Aviso de usuario del 5-oct-2026 (pantalla «Nuevo asunto»), diseñado con Francisco el mismo día.
La fila 264 era el mismo aviso enviado dos veces: queda descartada por repetida.
Toca lo que dejó la fila 239 (`docs/NOMBRES-FIJOS-CON-NUMERO.md`, apartado 6); no hace falta leerla
entera.

## Qué pasa hoy

El compañero de Francisco intentó crear un asunto corriente desde «Ver todo» → «Crear asunto con
él». El nombre de la carpeta tenía 67 caracteres (tipo de 19, tercero de 31). Debajo del nombre
salió la línea roja «El nombre no cabe en la ruta de Dropbox: el tercero o el tipo son demasiado
largos…» y el botón «Crear el asunto» quedó apagado. No pudo crear el asunto.

La cuenta que decide eso (`Nombres.cabeEnRuta`, `js/nombres-topes.js`) es demasiado prudente, por
tres sitios a la vez:

1. **Dónde está Dropbox.** `raizDeEsteOrdenador()` devuelve `Math.max(45, <lo apuntado>)`: nunca
   menos de 45 caracteres, aunque se sepa la ruta de verdad. En ese ordenador la aplicación se abre
   desde la copia sin internet, en `C:\Users\Usuario\Dropbox\…`: 25 caracteres con la barra. Sobran
   20. Además solo mira `localStorage`, no lo que se deduce de la dirección de la copia.
2. **El tope.** Corta en 240, y Windows admite 259 caracteres de ruta completa.
3. **El peor documento.** Cuenta siempre `_Previas/` y el tipo de documento más largo del centro.
   Esto se queda como está: es el peor caso de verdad dentro de esa carpeta.

Con una ruta de ARCHIVO como `ADMINISTRACIÓN/REGISTROS/ARCHIVO` (32 caracteres; la real no la
sabemos, es un ejemplo), la cuenta de hoy da 243 contra 240: se pasa por 3. Con la cuenta
corregida da 223 contra 259: sobran 36.

## Qué quiere Francisco

1. **El largo de la ruta ya nunca impide crear ni guardar un asunto.** Ni en «Nuevo asunto» ni en
   «Cambiar el asunto». El botón no se apaga por eso y el guardado no se para por eso.
2. **La cuenta se hace con los datos de verdad** (lo de abajo, «La cuenta nueva»).
3. **Si aun así la ruta se pasa**, debajo del nombre de la carpeta sale una línea **ámbar** (no
   roja), con este texto exacto:
   - En «Nuevo asunto»: «La ruta de esta carpeta sale muy larga. El asunto se crea igual; puede
     que Word o Windows protesten al abrir algún documento suyo.»
   - En «Cambiar el asunto»: «La ruta de esta carpeta sale muy larga. El cambio se guarda igual;
     puede que Word o Windows protesten al abrir algún documento suyo.»
4. La línea roja de antes y su texto («El nombre no cabe en la ruta de Dropbox…») desaparecen de
   esas dos pantallas.

Motivo de Francisco: una ruta larga no rompe nada en la aplicación; lo peor es que Word o el
explorador de Windows protesten con algún documento. Dejar a alguien sin poder trabajar es peor.

Se acepta a sabiendas que la ruta depende del ordenador: un asunto creado sin aviso en uno puede
salir algo más largo en otro, donde Dropbox esté en una carpeta de nombre más largo. No se hace
nada con eso.

## La cuenta nueva

En `js/nombres-topes.js`, y solo ahí:

- `raizDeEsteOrdenador()`: si `RutaCarpetas.dropboxDeEsteOrdenador().valor` trae algo (ya junta la
  copia sin internet, lo apuntado en `localStorage` y las rutas completas antiguas), devuelve **su
  largo más 1** (la barra que la separa de lo de dentro). Sin `Math.max`: si se sabe, manda lo que
  se sabe, sea corto o largo. Solo si no se sabe nada, los 45 de siempre.
- `TOPE_TOTAL_RUTA` pasa de 240 a **259**. Vale para todo lo que lo usa: `cabeEnRuta`, `topes()` y
  el medidor de Ajustes (que ya enseña el tope que haya).
- El resto de la cuenta (categoría, tercero, asunto, `_Previas`, peor documento) no cambia.
- Sin `rutas.json` señalado sigue sin haber con qué calcular: se da por bueno, sin aviso.

`montarAsunto` puede seguir devolviendo `noCabe` y `margen` como hasta ahora: lo que cambia es qué
hacen las pantallas con ello.

## Qué NO se toca

- **Los documentos.** `js/documentos-guardar.js` sigue igual, con su aviso rojo y su botón apagado
  para los nombres de antes que no caben ni recortando. Los documentos nuevos (fila 239) nunca dan
  `noCabe`. Ojo: `Nombres.avisoRecorte` lo comparten documentos y asuntos; el texto y el color
  nuevos son solo para los asuntos (un parámetro más, o una función aparte, lo que salga más
  limpio).
- El cuadro «El nombre es muy largo» de más de 180 caracteres (`App.LARGO_MAXIMO_NOMBRE`).
- Ajustes → El centro → «Largo de las rutas» y su fila de la comprobación al entrar: mismos textos
  y colores. Solo cambian los números, porque la cuenta de debajo es la nueva.
- Ninguna carpeta ni asunto existente.

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/NOMBRES-FIJOS.md`
  (apartado «Largo de las rutas») y los ficheros de la lista de abajo basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Los sitios exactos:
  - `js/asuntos-nuevo-crear.js`: la vista previa (`Nombres.avisoRecorte($('vista-nombre'), …)` y
    `$('btn-crear').disabled = … || !!ajustado.noCabe`) y, en `App.crearAsuntoDelFormulario`, el
    `if (ajustado.noCabe) { U.aviso(Nombres.AVISO_NO_CABE, 'malo'); return; }`.
  - `js/asuntos-editar.js`: `refrescar()` (`Nombres.avisoRecorte($('ed-vista'), …)`) y, al
    guardar, `if (ajustadoFinal.noCabe) { … return { ok: false }; }`.
  - `js/nombres.js`: `AVISO_NO_CABE` y `avisoRecorte`.
- `js/nombres.js` tiene 635 líneas y la regla es 600 como mucho. Ya que se toca, déjalo por debajo:
  saca a `js/nombres-topes.js` (202 líneas) los avisos de la vista previa (`AVISO_RECORTE`,
  `AVISO_NO_CABE`, `avisoRecorte`) y lo poco más que haga falta, sin cambiar los nombres con que se
  llaman desde fuera (`Nombres.avisoRecorte`, etc.).
- En solo consulta (fila 260) no cambia nada: ahí «Crear el asunto» ya está apagado por su motivo.
- Sigue las reglas de la cola: rama `fila-263`, revisor en local y, con su APROBADA, a `main`. Nada
  se queda en una petición de cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs nombres`); la pasada
  completa, una sola vez al final.
- Al marcar la fila EN CURSO, si `docs/COLA.md` pasa de 40 KB, aplica la regla 20.

## Ficheros

- `js/nombres-topes.js` (la cuenta; y los avisos que vengan de `js/nombres.js`).
- `js/nombres.js` (texto y color del aviso para asuntos; bajar de 600 líneas).
- `js/asuntos-nuevo-crear.js` y `js/asuntos-editar.js` (dejar de apagar y de parar).
- `pruebas/nombres-fijos-con-numero.mjs`: el punto «con un tercero larguísimo, la vista previa de
  Nuevo asunto avisa en rojo y no deja crear» pasa a decir lo nuevo. Y una prueba nueva,
  `pruebas/ruta-larga-avisa.mjs`, con los puntos de «Cómo sabemos que está bien» (se puede simular
  dónde está Dropbox apuntando `gestor-ruta-dropbox` en `localStorage`).
- `js/novedades.js`: una línea, «Un asunto ya no se queda sin crear porque su ruta salga larga: se
  crea igual y, si de verdad es muy larga, avisa en ámbar.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (la frase «El largo de la ruta completa dentro de Dropbox
  se comprueba con `Nombres.cabeEnRuta`…», sustituida), `docs/contexto/NOMBRES-FIJOS.md` (apartado
  «Largo de las rutas», sustituido: tope 259, raíz real, aviso ámbar que no impide) y
  `docs/HISTORIA.md`.

Ningún dato real de personas en las pruebas ni en los documentos: nombres inventados.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que el asunto que no se pudo crear ya se puede crear; que la aplicación ya no
impide crear ni cambiar un asunto por el largo de la ruta; y que, si alguna vez una ruta sale de
verdad muy larga, lo dirá en una línea ámbar debajo del nombre, sin parar nada.

## Cómo sabemos que está bien

Para los puntos 1 a 6: con la ruta de la carpeta ARCHIVO apuntada como
`ADMINISTRACIÓN/REGISTROS/ARCHIVO` y Dropbox de este ordenador en `C:\Users\Usuario\Dropbox`.

1. Abrir «Nuevo asunto», elegir un alumno cuyo tercero mida 31 caracteres y un tipo de nombre corto
   «INFORMACION PERSONAL»: debajo del nombre de la carpeta no sale ninguna línea de aviso y
   «Crear el asunto» está encendido.
2. Pulsar «Crear el asunto»: el asunto se crea y se abre su ficha.
3. Abrir «Nuevo asunto» con un tercero dado de alta a mano cuya razón social mida 150 caracteres:
   debajo del nombre sale, en ámbar, «La ruta de esta carpeta sale muy larga. El asunto se crea
   igual; puede que Word o Windows protesten al abrir algún documento suyo.», y «Crear el asunto»
   está encendido.
4. Pulsar «Crear el asunto» en ese caso (y «seguir» si pregunta por el nombre de más de 180
   caracteres): el asunto se crea, su carpeta existe en ASUNTOS ABIERTOS y no sale ningún aviso
   rojo.
5. Abrir un asunto corriente, «Cambiar el asunto», y ponerle ese tercero de 150 caracteres: debajo
   del nombre sale, en ámbar, «La ruta de esta carpeta sale muy larga. El cambio se guarda igual;
   puede que Word o Windows protesten al abrir algún documento suyo.». Pulsar «Guardar»: se guarda
   y la carpeta cambia de nombre.
6. Buscar en las dos pantallas el texto «El nombre no cabe en la ruta de Dropbox»: ya no aparece
   en ninguna.
7. Borrar dónde está Dropbox en este ordenador (sin nada apuntado y abriendo la aplicación desde la
   web): el caso del punto 1 sigue sin aviso (con los 45 caracteres supuestos, la ruta sigue
   por debajo de 259).
8. Abrir Ajustes → El centro → «Largo de las rutas»: el detalle dice «Tope de la ruta entera:
   259.» y el margen sale con su color de siempre.
9. Guardar un documento en un asunto de antes de la fila 239 con un nombre que no cabe ni
   recortando: sigue saliendo su aviso rojo y «Guardar» sigue apagado, como hasta ahora.
10. **[SOLO FRANCISCO]** En el ordenador del compañero, con la copia sin internet ya actualizada,
    repetir el asunto del aviso («Ver todo» → «Crear asunto con él», mismo alumno y mismo tipo):
    se crea sin ninguna línea de aviso.
