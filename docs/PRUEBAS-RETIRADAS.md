# Pruebas retiradas de la pasada completa

Fila 302 (7-oct-2026, `docs/PRUEBAS-ROTAS.md`). La lista está en `pruebas/ejecutar.mjs` (`RETIRADAS`).
La pasada completa (`npm test`) no las lanza y las enseña al final con su fecha y su motivo; pedidas por
su nombre (`npm test -- <nombre>`) sí se lanzan. El fichero de la prueba no se borra.

| Prueba | Desde | Motivo | Qué haría falta para volver a meterla |
|---|---|---|---|
| `cambiar-tipo-y-guia.mjs` | 9-nov-2026 | Fallo real (idea 569): el botón de cancelar del cuadro de cambio de tipo debe decir «Dejar los hitos como están», pero `U.preguntar` (`js/util.js`, fila 524) lo pisa con «Cancelar». | Arreglar la idea 569 (pasar el texto por `textoCancelar`); entonces se quita de `RETIRADAS`. |
| `notas-de-directivos.mjs` | 10-nov-2026 | Fallo real (idea 595): los cuadros «Vista» con documentos sin guardar y «archivar con notas sin ver» enseñan «Cancelar» en vez de «Guardarlos ahora» y «Verlas» (`js/notas-directivos.js`, líneas 246 y 338; misma causa que la 569). | Arreglar la idea 595; entonces se quita de `RETIRADAS`. |
| `categorias-del-control-de-registro.mjs` | 10-nov-2026 | Fallo real (idea 594): `js/control-registro-pantalla.js` (línea 269) lleva su lista de categorías escrita a mano; no reconoce a tutores legales ni administraciones. Salió de `tutores-legales.mjs` (paso 5). | Que salga de `Nombres.CATEGORIAS`; entonces se quita de `RETIRADAS`. |
| `etiquetas-desde-el-grupo.mjs` | 10-nov-2026 | Fallo real (idea 593): «Imprimir etiquetas» de un asunto de grupo no abre la pantalla (`js/herramientas.js`, fila 551, cierra Etiquetas tras un `await` y la deja oculta). Salió de `etiquetas.mjs` (paso 9). | Arreglar la idea 593; entonces se quita de `RETIRADAS`. |
| `plantillas-desde-un-tipo.mjs` | 10-nov-2026 | Fallo real (idea 593): «Ver todas las plantillas» desde la pantalla de un tipo no abre la pantalla, por la misma causa. Salió de `plantillas-pantalla.mjs` (paso 20). | Arreglar la idea 593; entonces se quita de `RETIRADAS`. |

Fila 584 (10-nov-2026): se revisaron una a una las 20 pruebas que fallaban y las 9 apartadas. Las demás eran pruebas
desfasadas y se pusieron al día; `opciones.mjs` se borró (comprobaba cómo se creaban hitos-pregunta, que la fila 576
quitó). Desde ahora solo se aparta una prueba que destapa un fallo real, y su motivo nombra su idea.

## Texto propuesto para `CLAUDE.md` (apartado «Pruebas», punto 3)

Ya aplicado en `CLAUDE.md` en la fila 302. Se deja aquí por si hay que volver a ponerlo:

3. Si en esa pasada falla una prueba: arréglalo y repite **solo esa prueba y las de lo que hayas
   vuelto a tocar**, no las 170. Y además:
   - (11-oct-2026, fila 333, `docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md`) El ejecutor repite solo, una
     vez y a solas, cada prueba que falla en la tanda en paralelo. Si pasa en ese segundo intento,
     la pasada sale en verde y no hay nada que apuntar ni que apartar: **a `EN_SOLITARIO` ya no se
     añade ninguna prueba**.
   - Excepción: si la que ha necesitado segundo intento es una prueba **de tu fila** (nueva, o que
     has tocado), no vale. Arréglala para que espere a una condición y no a una pausa fija.
   - Una prueba que falla **también en el segundo intento**: si es de tu cambio, se arregla. Si
     falla igual en `main` sin tu cambio (fila 584, 10-nov-2026): **no se cierra la fila con una prueba en rojo
     «porque ya fallaba»**. Se abre la fila «Arreglar la prueba <nombre>…» delante de las demás (`docs/METODO-COMUN.md`
     5.1). Solo va a `RETIRADAS` (mismo fichero, con fecha y motivo) una prueba que destapa un **fallo real de la
     app**, y su motivo tiene que nombrar su IDEA en `docs/COLA.md` («idea N»); el ejecutor no arranca sin ella.
