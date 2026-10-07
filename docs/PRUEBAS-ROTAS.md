# Arreglar o retirar las pruebas que fallan siempre (fila 302 de la cola)

Problema que resuelve: hay pruebas que fallan por el entorno y no por la aplicación; cada fila lo
apunta y sigue, y así nadie se fía del resto de las pruebas.
Sale del repaso de tropiezos del 7-oct-2026 (tropiezo T9). Diseño cerrado y aprobado por Francisco
ese día. No hay nada que preguntarle.

## Qué pasa hoy

- En las notas de la cola aparece desde el 6-oct-2026: «fallan en solitario `cabecera-compacta`,
  `control-registro`, `tutores-legales` y `hacer-este-hito`, también en `main`».
- `control-registro.mjs` y `tutores-legales.mjs` fallan en `main` desde al menos el 4-oct-2026
  (`tutores-legales.mjs`, punto 5: «ninguna lista de categorías escrita a mano»).
- En «Lo que queda por hablar con Francisco» de `docs/COLA.md` hay más nombres:
  `titulos-de-la-tabla-fijos.mjs` (punto 8, a 1280 px) y `tras-cada-accion.mjs` (dos pasos fallan
  también en solitario desde antes de la fila 205).
- La lista `EN_SOLITARIO` de `pruebas/ejecutar.mjs` tiene 18 nombres (uno repetido). `CLAUDE.md`
  («Pruebas», punto 3) dice: «añádela a `EN_SOLITARIO` y sigue, sin investigarla más». Esa frase
  deja que la lista crezca sin que nadie mire por qué.

## Lo que se quiere

Al terminar, la pasada completa (`npm test` sin palabras) en `main` sale **en verde**. Si alguna
prueba se ha retirado, hay una lista corta y escrita de cuáles y por qué.

En pantalla no cambia nada para los usuarios.

## Qué pruebas se miran

1. Las cuatro de arriba: `cabecera-compacta.mjs`, `control-registro.mjs`, `tutores-legales.mjs` y
   `hacer-este-hito.mjs`.
2. `titulos-de-la-tabla-fijos.mjs` y `tras-cada-accion.mjs`.
3. Cualquier otra que falle en una pasada completa hecha al empezar, con `main` sin tocar. Esa
   pasada es la foto de partida: apunta qué falla.

## Qué hacer con cada una

Por este orden:

1. **Averigua por qué falla.** Pásala sola (`npm test -- <nombre>`) y lee qué paso falla.
2. **Si el fallo es de la prueba o del entorno** (tiempos, tamaño de ventana, datos de la
   demostración que cambiaron, un texto de pantalla que cambió a propósito en otra fila): arregla
   la prueba. Tiene que seguir comprobando lo mismo que comprobaba; no vale quitarle el paso que
   falla para que pase.
3. **Si destapa un fallo real de la aplicación:** no arregles la aplicación aquí. Dilo en la nota
   de la fila, en una línea llana, para que Francisco lo vea en su cuadro: qué vería mal un
   usuario y en qué pantalla. Retira esa prueba de la pasada normal (punto siguiente) con ese
   motivo.
4. **Si no tiene arreglo razonable en 20 minutos:** retírala de la pasada normal y deja escrito en
   una línea por qué.

No toques ningún fichero de `js/` ni de `apps-script/`. Solo `pruebas/`, `CLAUDE.md` y `docs/`.

## Cómo se retira una prueba

Hoy no hay forma de retirar una prueba sin borrarla. Hazla así, en `pruebas/ejecutar.mjs`:

1. Una lista nueva, `RETIRADAS`, junto a `EN_SOLITARIO`. Cada entrada lleva tres datos: el nombre
   del fichero, la fecha en que entra y el motivo en una línea.
2. La pasada completa no lanza las pruebas de esa lista.
3. Al final de la pasada, el ejecutor escribe siempre: «N pruebas retiradas:» y, debajo, una línea
   por cada una con su fecha y su motivo. Si no hay ninguna, no escribe nada.
4. Pedida por su nombre (`npm test -- <nombre>`), una prueba retirada sí se lanza. Así se puede
   trabajar en ella.
5. El fichero de la prueba no se borra.

## La lista `EN_SOLITARIO`, con tope y con fechas

1. Quita el nombre repetido.
2. Cada entrada lleva la fecha en que entró. A las que ya están, ponles `antes del 7-oct-2026`.
3. **Tope: 20 pruebas.** El ejecutor falla, con un mensaje claro, si la lista pasa de 20.
4. Cambia el punto 3 de «Pruebas» de `CLAUDE.md`. La regla nueva, en pocas líneas:
   - Una prueba que falla en la pasada completa y en solitario pasa, y no tiene que ver con tu
     cambio, va a `EN_SOLITARIO` con la fecha de hoy.
   - Si la lista ya tiene 20, no entra ninguna más: antes hay que arreglar o retirar una.
   - Una prueba que falla también en solitario **no** va a `EN_SOLITARIO`. Si es de tu cambio, se
     arregla. Si falla igual en `main` sin tu cambio, va a `RETIRADAS` con fecha y motivo, y se
     dice en la nota de la fila en una línea.
   - Borra la frase «sin investigarla más».
5. Si el entorno no te deja modificar `CLAUDE.md`: haz todo lo demás, deja el texto exacto que
   propones en `docs/PRUEBAS-RETIRADAS.md` y dilo en la nota de la fila. No bloquees la fila por
   eso.

## Documento de las retiradas

Si retiras alguna, crea `docs/PRUEBAS-RETIRADAS.md`: una línea por prueba, con la fecha, el motivo
y qué haría falta para volver a meterla. Si no retiras ninguna, no lo crees (salvo el caso del
punto 5 de arriba).

## Limpieza de las notas viejas

Las notas de `docs/COLA.md` que hablan de estas pruebas («En la pasada completa fallan también en
`main`…», «`tutores-legales.mjs` falla también en `main`…», «Prueba `pruebas/tras-cada-accion.mjs`…»)
dejan de ser verdad. Quita de cada nota la parte de las pruebas, sin tocar el resto de la nota.
`docs/COLA.md` tiene que seguir por debajo de 40 KB.

## La nota de la fila

Corta, en lenguaje llano:

- Cuántas pruebas has arreglado y cuántas has retirado.
- Una línea por cada fallo real de la aplicación que haya salido.

El detalle (por qué fallaba cada una y qué cambiaste) va a `docs/HISTORIA.md`.

## Cómo se trabaja y se publica

Rama `fila-302`, como cualquier fila. No se toca la aplicación y no hay versión nueva: no hay nada
que mirar en pantalla, así que el revisor no tiene lista que pasar; los puntos de abajo los
compruebas tú con `npm test`. La fila es HECHA cuando su commit está en `main` y la pasada completa
ha salido como dice el punto 1 de abajo.

## Cómo sabemos que está bien

1. `npm test` (pasada completa) en la rama de la fila termina en verde, sin ninguna prueba en rojo.
2. Si hay retiradas, la pasada las enseña al final con su fecha y su motivo, y son las mismas que
   las de `docs/PRUEBAS-RETIRADAS.md`.
3. `npm test -- <nombre de una retirada>` lanza esa prueba.
4. `EN_SOLITARIO` no tiene nombres repetidos, no pasa de 20 y cada entrada lleva fecha. Con 21
   entradas puestas a propósito, el ejecutor falla y lo dice.
5. Cada una de las seis pruebas de «Qué pruebas se miran» está en uno de estos tres casos:
   arreglada y en verde, retirada con motivo, o retirada con un fallo real apuntado en la nota.
6. Ninguna prueba arreglada ha perdido pasos: comprueba lo mismo que antes.
7. `CLAUDE.md` ya no dice «sin investigarla más» y dice el tope de 20.
8. `git diff --stat` de la fila no enseña ningún fichero de `js/` ni de `apps-script/`.
9. `docs/COLA.md` ya no tiene notas que digan que estas pruebas fallan en `main`, y ocupa menos de
   40 KB.
