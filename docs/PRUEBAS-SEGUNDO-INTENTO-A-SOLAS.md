# Segundo intento a solas en la pasada de pruebas (fila 333 de la cola)

Problema que resuelve: en la pasada completa fallan pruebas que a solas pasan, y la lista donde se
apartaban está llena. Cada fila pierde tiempo con eso y lo apunta como tropiezo.
Sale del repaso de tropiezos del 11-oct-2026 (tropiezos T10 y T9). Aprobada por Francisco ese día.
No hay nada que preguntarle.

## Qué pasa hoy

- La pasada completa (`npm test` sin palabras) lanza varias pruebas a la vez. Con la máquina
  cargada, algunas pruebas que miden esperas fallan. Lanzadas a solas, pasan. La aplicación está
  bien.
- La regla del 7-oct-2026 (fila 302) manda apartarlas a mano en la lista `EN_SOLITARIO` de
  `pruebas/ejecutar.mjs`, que tiene un tope de 20. La lista está llena: 20 de 20.
- Desde entonces, cada fila que se encuentra una prueba así no puede apartarla y lo deja escrito:
  filas 318, 319, 321, 322, 324 y 325 («ninguna prueba nueva puede entrar en `EN_SOLITARIO`»).
- Las que han fallado así estos días: `hitos-no-huerfanos-al-archivar.mjs`,
  `por-liquidar-al-cambiar-tipo.mjs`, `perfil.mjs`, `exportar-asuntos.mjs` y `carpetas-perdidas.mjs`.
  No son siempre las mismas: depende de la carga de ese momento.

## Lo que se quiere

Que el ejecutor haga solo lo que la regla mandaba hacer a mano: la prueba que falla en la tanda en
paralelo se repite una vez, a solas. Si a solas pasa, vale. Si a solas falla, es un fallo de verdad.

Nadie vuelve a añadir nombres a `EN_SOLITARIO` y ninguna fila vuelve a apuntar este tropiezo.

En pantalla no cambia nada para los usuarios.

## Qué cambia en `pruebas/ejecutar.mjs`

1. Después de la tanda en paralelo y de las de `EN_SOLITARIO`, el ejecutor mira qué pruebas **de la
   tanda en paralelo** han fallado. Las vuelve a lanzar, **una por una, sin ninguna otra a la vez**.
   Un solo segundo intento por prueba.
2. Una prueba que pasa en el segundo intento cuenta como buena. La pasada termina en verde (código
   de salida 0) si no queda ningún otro fallo.
3. Una prueba que falla también en el segundo intento es un fallo: la pasada termina en rojo, igual
   que hoy.
4. Las de `EN_SOLITARIO` no tienen segundo intento: ya iban a solas.
5. Vale igual con palabras (`npm test -- hito mesa`) que sin ellas.
6. La salida de los dos intentos se imprime, cada una con su título: `=== nombre.mjs ===` la
   primera y `=== nombre.mjs (segundo intento, a solas) ===` la segunda.
7. El resumen final lo dice aparte, en una línea, antes de «Todas las pruebas pasan»:
   `2 pasaron al segundo intento, a solas: a.mjs, b.mjs`. Sin ninguna, no se escribe esa línea.
8. Si en una pasada pasan al segundo intento **más de 10** pruebas, el resumen añade:
   `Demasiadas pruebas necesitan segundo intento (N). La máquina va muy cargada: prueba con PRUEBAS_A_LA_VEZ=2.`
   Es un aviso; no hace fallar la pasada.
9. `EN_SOLITARIO` se queda como está, con sus 20 nombres y su tope en el código. No hace falta
   vaciarla ni tocarla. Solo cambia su comentario: una línea que diga que desde la fila 333 no se
   añade ninguna más, porque el segundo intento hace ese trabajo.
10. `RETIRADAS` no cambia.

La parte que decide (qué se repite, qué cuenta como bueno, qué líneas lleva el resumen) va en un
módulo aparte, `pruebas/apoyo/segundo-intento.mjs`, con funciones que no lanzan nada: reciben los
resultados y devuelven la decisión. Así se puede probar sin navegador. `pruebas/ejecutar.mjs` no
pasa de 400 líneas.

## La prueba nueva

`pruebas/ejecutor-segundo-intento.mjs`, sin navegador, sobre el módulo de `pruebas/apoyo/`:

1. Una prueba que falla en paralelo y pasa a solas cuenta como buena y sale en la línea «pasaron al
   segundo intento».
2. Una que falla las dos veces queda como fallo.
3. Una de `EN_SOLITARIO` que falla no se repite.
4. Sin ningún fallo, el resumen no lleva la línea del segundo intento.
5. Con 11 recuperadas sale el aviso de «Demasiadas pruebas…»; con 10, no.

Además, una comprobación a mano del ejecutor entero, que no se queda en el repositorio: crea un
fichero de prueba temporal que falle la primera vez que se lanza y pase la segunda (por ejemplo,
dejando una marca en la carpeta temporal del sistema). Lánzalo con `npm test -- <su nombre>` y mira
que la pasada termina en verde y lo nombra en el resumen. Después bórralo, y borra la marca.

## Reglas que cambian

En `CLAUDE.md`, apartado «Pruebas: parciales mientras trabajas, completas una sola vez», punto 3.
Sus tres guiones (el de «va a `EN_SOLITARIO`», el de «**Tope: 20**» y el de «falla **también en
solitario**») se cambian por estos tres:

    - (11-oct-2026, fila 333, `docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md`) El ejecutor repite solo, una
      vez y a solas, cada prueba que falla en la tanda en paralelo. Si pasa en ese segundo intento,
      la pasada sale en verde y no hay nada que apuntar ni que apartar: **a `EN_SOLITARIO` ya no se
      añade ninguna prueba**.
    - Excepción: si la que ha necesitado segundo intento es una prueba **de tu fila** (nueva, o que
      has tocado), no vale. Arréglala para que espere a una condición y no a una pausa fija.
    - Una prueba que falla **también en el segundo intento**: si es de tu cambio, se arregla. Si
      falla igual en `main` sin tu cambio, va a `RETIRADAS` (mismo fichero) con fecha y motivo, y se
      dice en la nota de la fila en una línea.

La misma regla está copiada en `docs/PRUEBAS-RETIRADAS.md` (líneas 19 a 26, más o menos): se cambia
igual. En `docs/CONTEXTO.md`, la frase que habla de `EN_SOLITARIO` (hacia la línea 384) gana una
frase: «Desde la fila 333 el ejecutor repite a solas la que falla en paralelo, y a esa lista no se
añade ninguna más».

No se tocan las instrucciones de otras filas (`docs/PERSONAL-DEL-CENTRO-DE-DATOS.md`,
`docs/FECHA-REAL-DEL-LISTADO.md`, `docs/BOTON-UNICO-DE-SOPORTE.md`, `docs/PRUEBAS-ROTAS.md`,
`docs/PRUEBAS-MAS-RAPIDAS.md`) ni `docs/HISTORIA.md`: son el relato de lo que se hizo.

### Si el entorno no deja editar `CLAUDE.md`

Ha pasado en otros proyectos (tropiezo T12). Si pasa aquí:

- No lo reintentes ni busques otro camino.
- Haz todo lo demás de esta fila. El texto nuevo ya está escrito aquí arriba.
- Añade a `docs/TE-TOCA.md` esta línea: `- [ ] (fila 333 · <fecha>) Pega en la conversación del
  Gestor: «Te doy permiso expreso para cambiar en CLAUDE.md el punto 3 de "Pruebas", como dice
  docs/PRUEBAS-SEGUNDO-INTENTO-A-SOLAS.md».`
- La fila se marca HECHA igualmente, con la nota «falta el cambio de `CLAUDE.md`, ver Te toca a
  ti» y `TROPIEZO T12: el entorno negó editar CLAUDE.md`. **No la dejes BLOQUEADA**: el ejecutor
  nuevo ya hace que la regla vieja no se dispare.

## La nota de la fila

Corta, en lenguaje llano: cuántas pruebas pasaron al segundo intento en la pasada completa de esta
fila, y cuáles. El detalle va a `docs/HISTORIA.md`.

Desde esta fila, ninguna nota vuelve a llevar «`EN_SOLITARIO` está en el tope de 20».

## Cómo se trabaja y se publica

Rama `fila-333`, como cualquier fila. No se toca la aplicación (`js/`, `css/`, `index.html`,
`apps-script/`) y no hay versión nueva. No hay nada que mirar en pantalla, así que el revisor no
tiene lista que pasar: los puntos de abajo los compruebas tú. **No se publica en Vercel**: esta
fila no cambia la app. La fila es HECHA cuando su commit está en `main` y la pasada completa ha
salido como dice el punto 1 de abajo.

## Cómo sabemos que está bien

1. `npm test` (pasada completa) en la rama de la fila termina en verde. Si alguna prueba ha
   necesitado segundo intento, el resumen la nombra.
2. `npm test -- ejecutor-segundo-intento` pasa, y falla si se deshace el cambio del módulo de
   `pruebas/apoyo/`.
3. La comprobación a mano del fichero temporal ha salido bien, y ni el fichero ni su marca quedan
   en el repositorio (`git status` limpio de ellos).
4. Una prueba que falla siempre (por ejemplo, el fichero temporal cambiado para fallar las dos
   veces) deja la pasada en rojo y sale en «Fallan:».
5. Una prueba de `EN_SOLITARIO` forzada a fallar no se repite.
6. `EN_SOLITARIO` tiene los mismos 20 nombres que antes de la fila.
7. `CLAUDE.md` y `docs/PRUEBAS-RETIRADAS.md` ya no mandan añadir pruebas a `EN_SOLITARIO` ni hablan
   del tope de 20 como regla (o, si el entorno lo negó, está la línea en `docs/TE-TOCA.md`).
8. `git diff --stat` de la fila no enseña ningún fichero de `js/`, `css/` ni `apps-script/`, ni
   `index.html`.
9. `pruebas/ejecutar.mjs` y `pruebas/apoyo/segundo-intento.mjs` no pasan de 400 líneas.
10. `docs/COLA.md` ocupa menos de 40 KB.
