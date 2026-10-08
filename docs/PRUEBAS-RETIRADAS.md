# Pruebas retiradas de la pasada completa

Fila 302 (7-oct-2026, `docs/PRUEBAS-ROTAS.md`). La lista está en `pruebas/ejecutar.mjs` (`RETIRADAS`).
La pasada completa (`npm test`) no las lanza y las enseña al final con su fecha y su motivo; pedidas por
su nombre (`npm test -- <nombre>`) sí se lanzan. El fichero de la prueba no se borra.

| Prueba | Desde | Motivo | Qué haría falta para volver a meterla |
|---|---|---|---|
| `tutores-legales.mjs` | 7-oct-2026 | Fallo real de la aplicación (punto 5, «ninguna lista de categorías escrita a mano»): `js/control-registro-pantalla.js`, en `terceroQueEncaja`, tiene escrita a mano `['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS']`. Al crear un asunto desde el control de registro, no reconoce como tercero ya conocido a un tutor legal ni a una administración. | Que la aplicación use `Nombres.CATEGORIAS` en ese sitio (fila de aplicación, no de pruebas); entonces se quita de `RETIRADAS`. |
| `hacer-este-hito.mjs` | 8-oct-2026 | Falla igual en `main` sin la fila 303, también en solitario: el PDF sellado no se coloca solo (el hito se queda en «esperando-sello»). | Averiguar por qué no se coloca el sellado en esta copia y arreglarlo; entonces se quita de `RETIRADAS`. |
| `conflictos-que-cambia.mjs` | 8-oct-2026 | Falla igual en `main` sin la fila 303, también en solitario: no sale de qué ordenador es la otra versión. | Averiguar qué dato de la copia de pruebas falta y arreglarlo; entonces se quita de `RETIRADAS`. |

## Texto propuesto para `CLAUDE.md` (apartado «Pruebas», punto 3)

Ya aplicado en `CLAUDE.md` en la fila 302. Se deja aquí por si hay que volver a ponerlo:

3. Si en esa pasada falla una prueba: arréglalo y repite **solo esa prueba y las de lo que hayas
   vuelto a tocar**, no las 170. Y además:
   - Una prueba que falla en la pasada completa y **en solitario pasa**, y no tiene que ver con tu
     cambio, va a `EN_SOLITARIO` de `pruebas/ejecutar.mjs` con la fecha de hoy.
   - **Tope: 20.** Si la lista ya tiene 20, no entra ninguna más (el ejecutor se niega a arrancar):
     antes hay que arreglar de verdad una de las que están (esperar a una condición en vez de una
     pausa fija) o retirar otra.
   - Una prueba que falla **también en solitario** no va a `EN_SOLITARIO`. Si es de tu cambio, se
     arregla. Si falla igual en `main` sin tu cambio, va a `RETIRADAS` con fecha y motivo, y se dice
     en la nota de la fila en una línea.
