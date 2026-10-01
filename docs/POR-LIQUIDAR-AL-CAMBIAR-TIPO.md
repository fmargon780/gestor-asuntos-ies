# Por liquidar también al cambiar el tipo (fila 253)

Aviso de usuario del 1-oct-2026 (pantalla Inicio), diseñado con Francisco el mismo día.
Complementa la fila 249 (`docs/POR-LIQUIDAR.md`); léela antes.

## Qué pasa hoy

Francisco cambió el tipo de varios asuntos abiertos a «Cobro Seguro Escolar», un tipo que tiene
marcada en Ajustes la casilla «Hay que liquidarlo antes de archivar» (`tipo.liquidar`). Esos
asuntos no aparecen en la pestaña «Por liquidar» de Inicio.

No es un fallo del código de la fila 249, sino un caso que no cubre: un asunto solo entra en «Por
liquidar» al dar por hecho su último hito (`PorLiquidar.alMarcarHecho`) o con el botón «Pasar a
Por liquidar». Cambiarle el tipo, o marcar la casilla en un tipo que ya tiene asuntos abiertos, no
mueve nada.

## Qué quiere Francisco

Una sola regla, que se aplica en tres momentos:

> Un asunto abierto, de un tipo que hay que liquidar, que no está ya en «Por liquidar» y **no
> tiene ningún hito por hacer** (todos hechos, o ningún hito), pasa solo a «Por liquidar», como
> automático (`porLiquidar.auto = true`, igual que al dar por hecho el último hito).
>
> Si le quedan hitos por hacer, no se toca: entrará cuando se dé por hecho el último, como ya hace
> la fila 249.

Los tres momentos:

1. **Al cambiar el tipo de un asunto abierto** («Cambiar el asunto», y cualquier otro camino que
   cambie el tipo: unir tipos, cambiarle el nombre a un tipo, etc.). Si el tipo nuevo hay que
   liquidarlo y se cumple la regla, pasa. Aviso verde «Pasa a Por liquidar.» con «Deshacer» (el
   «Deshacer» solo lo saca de «Por liquidar»; el cambio de tipo se queda).
2. **Al marcar la casilla «Hay que liquidarlo antes de archivar» en un tipo** (Ajustes). Pasan
   todos sus asuntos abiertos que cumplan la regla. Un solo aviso verde: «N asuntos pasan a Por
   liquidar.» con «Deshacer» (los devuelve todos). Con N = 0, ningún aviso.
3. **Una pasada al entrar en la aplicación**, después de cargar asuntos e hitos, en segundo plano:
   recoge los que ya están en esa situación (los de Francisco de hoy, por ejemplo). Sin aviso
   verde; si pasa alguno, deja la línea automática en el registro del asunto, como siempre. Nunca
   escribe con un guardado en marcha (regla de `ColaGuardado`). Si falla, ámbar
   (`U.accesorio`), nunca rojo.

Al revés no se toca nada: quitar la casilla de un tipo, o cambiar un asunto a un tipo que no hay
que liquidar, **no** saca de «Por liquidar» a los que ya están (se quedan hasta que se liquiden o
se pulse «Deshacer» / el camino que ya exista).

El ARCHIVO no se toca nunca: solo asuntos abiertos.

## Antes de empezar

- Mira cómo saber «no le queda ningún hito por hacer»: `Hitos.aQuienLeToca(entrada.hitos,
  datos.ajustes).listo`, como en `alMarcarHecho`. Un asunto sin entrada de hitos, o con la lista
  vacía, cuenta como «sin hitos por hacer» (en `alMarcarHecho` hoy se descarta: aquí no).
- Pon la regla en una sola función de `js/por-liquidar.js` (por ejemplo
  `PorLiquidar.revisar(asuntos, { aviso })`) y llámala desde los tres sitios. Sin envolturas: si no
  hay punto previsto donde engancharse tras cambiar el tipo, crea uno.
- Los sitios del cambio de tipo están en `js/asuntos-editar.js` y alrededores; la casilla, en
  `js/ajustes-tipo.js` (línea de la fila 249).
- `js/por-liquidar.js` no puede pasar de 600 líneas: si hace falta, parte.

## Ficheros

- `js/por-liquidar.js` (la regla), `js/asuntos-editar.js` (o donde se guarde el tipo nuevo),
  `js/ajustes-tipo.js` (la casilla), el arranque de la app (la pasada al entrar).
- Prueba nueva en `pruebas/` con los tres momentos.
- `js/novedades.js`: una línea («Los asuntos que cambias a un tipo que hay que liquidar, si ya no
  tienen nada por hacer, pasan solos a Por liquidar»).
- Al terminar: `docs/CONTEXTO-CORTO.md` (línea de «Por liquidar», sustituida), el hijo de
  `docs/contexto/` que toque y `docs/HISTORIA.md`.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que al entrar, sus asuntos de Cobro Seguro Escolar ya estarán en «Por liquidar»
(si no les queda ningún hito); y que a partir de ahora pasan solos al cambiarles el tipo o al
marcar la casilla en Ajustes.

## Cómo sabemos que está bien

1. Tipo A con la casilla marcada; asunto abierto de tipo B (sin casilla) sin hitos. «Cambiar el
   asunto» → tipo A: sale «Pasa a Por liquidar.» con «Deshacer» y el asunto está en la pestaña
   «Por liquidar».
2. Pulsar «Deshacer»: el asunto sale de «Por liquidar» y sigue siendo de tipo A.
3. Lo mismo con un asunto de tipo B con todos los hitos hechos: pasa.
4. Lo mismo con un asunto de tipo B con un hito sin hacer: no pasa, ningún aviso. Al dar por hecho
   ese hito, pasa (lo de la fila 249 sigue igual).
5. Tipo C sin casilla con tres asuntos abiertos: dos sin hitos por hacer y uno con un hito
   pendiente. Marcar la casilla en Ajustes: aviso «2 asuntos pasan a Por liquidar.»; «Deshacer»
   los devuelve los dos.
6. Recargar la página con un asunto ya en esa situación (tipo con casilla, sin hitos por hacer,
   fuera de «Por liquidar»): al terminar de cargar está en «Por liquidar», sin aviso verde, y su
   registro lleva «Pasa a Por liquidar».
7. Quitar la casilla de un tipo: sus asuntos que ya están en «Por liquidar» se quedan ahí.
8. Nada del ARCHIVO cambia en ninguno de los pasos.
