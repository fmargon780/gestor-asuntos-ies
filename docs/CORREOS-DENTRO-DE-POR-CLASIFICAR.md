# La bandeja de correos, dentro de "Por clasificar" y plegada

Acordado con Francisco el 17-sep-2026. No es una función nueva: la bandeja ya funciona, lo que
cambia es dónde vive y que deja de estar siempre abierta.

## El problema

Hoy la bandeja de correos se pinta como un bloque suelto debajo de las tres tarjetas de
`#pantalla-abiertos`, siempre desplegada y a la vista con cualquiera de las tres vistas. Ocupa la
parte de arriba de la pantalla todo el rato, se trabaje con ella o no.

## Cómo tiene que quedar

1. La bandeja se ve **solo dentro de "Por clasificar"** (`App.irVista('clasificar')`,
   `#zona-clasificar`). En "Departamento" y "En espera" no aparece.
2. Arriba de esa zona, encima de `#lista-sueltos`, una barra que se puede pulsar:
   **"Correos sin clasificar (3)"**.
3. Al pulsarla se despliega la bandeja entera, tal como está hoy, y se trabaja igual.
4. Al pulsarla otra vez se pliega.
5. **Siempre arranca plegada** al entrar en "Por clasificar", aunque se dejara abierta la última
   vez. Nada de recordar el estado en `localStorage`.
6. Si no hay correos, la barra sale igual, con **(0)** apagado y sin desplegar nada.
7. El botón "Mirar ahora" se va dentro del bloque desplegado.

## Qué ficheros hay que tocar

- `index.html` — dentro de `#zona-clasificar`, antes de `#lista-sueltos`: el botón de la barra
  (`#btn-correos-sin-clasificar`, con `aria-expanded`) y el contenedor `#bandeja-correos`, que
  ahora nace aquí y ya no se crea desde JavaScript.
- `js/bandeja-correos.js` — `caja()` deja de insertar el bloque debajo de `.paneles` y pasa a usar
  el contenedor de `#zona-clasificar`. `pintarBandeja()` escribe el número en la barra y respeta
  el plegado. Quitar la cabecera `.rotulo-lista` "Correos por convertir en asunto" con su
  `.cuenta-lista`: la sustituye la barra.
- `js/asuntos-lista.js` — en `App.irVista`, al entrar en `clasificar`, dejar la barra plegada.
- `css/` — el plegado se hace como el de "Filtros" (`engancharFiltros()` en `js/vista.js`): botón
  con `aria-expanded` y `classList.toggle('oculto')`. **No uses `<details>`**: recuerda el estado
  abierto y aquí no se quiere.

## Decisiones ya tomadas, no las replantees

- **La caja de envíos (`#bandeja-envios`, la tarjeta "Borrador en camino") se queda donde está**,
  debajo de las tres tarjetas. Hoy se ancla con `$('bandeja-correos') || paneles.nextSibling`: al
  mudarse la bandeja, esa línea se queda sin referencia. **Fíjala explícitamente** a
  `paneles.nextSibling`.
- La barra plegable no lleva memoria. Siempre cerrada al entrar.

## Trampas que hay que evitar

- **La lectura de correos no se para al plegar.** `mirar()` cada `SEGUNDOS_ENTRE_MIRADAS = 90`
  (enganchado a `window.Gestor.alRefrescar`), `revisarEnvios()` con su `temporizadorEnvios`, y
  `App.mirarLaCarpeta` cada `App.SEGUNDOS_ENTRE_MIRADAS = 20` tienen que seguir corriendo con el
  bloque plegado. Lo que se esconde es el pintado, no la lectura: si no, el número de la barra se
  queda congelado.
- **No copies el patrón de `App.pintarSueltos()`**, que sale antes de pintar si la vista no es
  `clasificar`. El recuento de correos tiene que actualizarse aunque no se esté mirando esa vista.
- **Parte `js/bandeja-correos.js`**: son 1.478 líneas. Saca la parte de pantalla (`caja`,
  `pintarBandeja`, `tarjeta`, `lineaYaGuardado`) a un `js/bandeja-pantalla.js` nuevo. En
  `index.html` va después de `js/asuntos-lista.js` (necesita `#zona-clasificar`) y antes de
  `js/bandeja-enlace.js` y `js/correo-adjuntos.js`.
- **Nombres ya cogidos**: `window.Bandeja` existe y lo usan `js/bandeja-enlace.js` y
  `js/correo-adjuntos.js` (`sinElRe`, `estaArchivado`, `personasDelCorreo`, `guardarEnAsunto`,
  `reabrirYGuardar`, `asuntoDelHilo`, `escribirSeguidos`, `carpeta`, `avisarEnvioNuevo`). Si hace
  falta algo nuevo, se añade; no se renombra nada. En `App` ya están cogidos `App.pintarSueltos`,
  `App.pintarCuentas`, `App.irVista`, `App.tarjetaSuelto`, `App.mirando`, `App.vigilarLaCarpeta`.
- `js/bandeja-correos.js` va después de `js/puente.js` (usa `window.Gestor.alRefrescar`) y de
  `js/documentos-sueltos.js`. No cambies ese orden.
- Usa `U.mientrasGuarda(control, fn)` en las acciones que guardan y repintan.

## Pruebas

- `pruebas/correos.mjs` y `pruebas/correo-dos-buzones.mjs` se rompen: hacen `App.ir('abiertos')` y
  van directas a `#bandeja-correos`. En su ayudante `mirarLaBandeja()` hay que añadir el click en
  `.panel[data-vista="clasificar"]` y el click en la barra plegable.
- Revisa `pruebas/envios.mjs` (usa `#bandeja-envios`, que hoy se ancla a `#bandeja-correos`) y
  `pruebas/refresco.mjs`.
- Añade una prueba de que al entrar en "Por clasificar" la bandeja está **plegada**, y de que el
  número de la barra se actualiza aunque no se despliegue.
- Una sola pasada de la batería completa al final.

## Cómo publicar

- Cambios quirúrgicos. No releas el repositorio entero: te basta con este documento,
  `docs/CONTEXTO.md` y los ficheros citados aquí.
- **Sube directamente a `main`, sin abrir ninguna pull request.** Si tu sesión no puede tocar
  `main`, abre la pull request y **fusiónala tú mismo** en cuanto esté en verde y sin conflictos
  (permiso permanente de Francisco, ver el final de `docs/COLA.md`).
- Comprueba lo publicado con `curl` después de fusionar.
- Al terminar: actualiza `docs/CONTEXTO-CORTO.md` y `docs/CONTEXTO.md` **sustituyendo la línea
  vieja** (la de la bandeja de correos deja de ser verdad tal como está) y anota en
  `docs/HISTORIA.md` lo que merezca recordarse.
