# Fila 94 — al cambiar el tipo de un asunto, ofrecer la guía del tipo nuevo

23-sep-2026. Diseñado y cerrado con Francisco el 23-sep-2026 (14:00).

## 1. Lo que pasa hoy

Los hitos de un asunto se crean una sola vez, la primera vez que se abre su ficha
(`js/hitos-panel.js`, `Hitos.crearDesdeGuiaImportando`, idempotente). Si después se cambia el
tipo en «Editar el asunto» (`App.editarAsunto`, `js/asuntos-editar.js`), la carpeta se renombra y
`ficha.tipo` cambia, pero **los hitos siguen siendo los del tipo viejo** y la aplicación no dice
nada.

## 2. Lo acordado

Que **pregunte**. Francisco eligió preguntar, no cambiar solo: a veces cambiará el tipo para
corregir el nombre de la carpeta, sin querer tocar el trabajo hecho.

## 3. Cómo

En `App.editarAsunto`, al terminar bien el guardado (después de `Carpetas.renombrar` y de
`AsuntoRenombrar.mover`, o del `App.anotar` si el nombre no cambia), si se cumplen las tres
cosas:

- el tipo ha cambiado (`p.tipo !== d.tipo`),
- el asunto tiene hitos (`Hitos.hitosDe`),
- el tipo nuevo tiene guía (`GuiasDelCentro.pasosDe(tipoNuevo)` con pasos),

se abre **un solo** `U.preguntar` (el cuadro de editar ya está cerrado en ese punto; no hay dos a
la vez):

- Título: «El tipo ha cambiado».
- Texto: «Este asunto era TIPO VIEJO y ahora es TIPO NUEVO. Sus pasos siguen siendo los del tipo
  viejo. ¿Traigo la guía de TIPO NUEVO?»
- Botón: «Traer la guía nueva». Cancelar: «Dejar los pasos como están».

Si dice que sí:

1. Se crean los hitos del tipo nuevo, con el mismo camino de siempre (`Hitos.pasoAHito` sobre los
   pasos de la guía del tipo nuevo).
2. Los hitos viejos **no se borran a ciegas**: los que están intactos (estado `pendiente`, sin
   notas, sin documentos apuntados, sin requisitos marcados y sin historial) se quitan; los que
   tienen algo, o están `hecho`/`encurso`, se conservan al final de la lista, marcados `noaplica`
   y plegados — exactamente lo que ya hace cambiar de rama en una pregunta (`Hitos.huerfanos`).
3. El primero pendiente de la guía nueva pasa a «en curso» (`Hitos.recomputeEnCurso`).
4. Una nota en el asunto y una línea en el historial: «Cambiado el tipo de TIPO VIEJO a TIPO
   NUEVO · fecha».

Si dice que no, no se toca nada.

Si el tipo nuevo **no tiene guía**, no se pregunta: un aviso de una línea («El tipo nuevo no
tiene guía escrita: los pasos se quedan como estaban.») y nada más.

El orden importa: primero la carpeta y la ficha, y solo si eso ha salido bien, los hitos. Si
falla el renombrado, no se pregunta nada.

## 4. Cómo se comprueba

`pruebas/cambiar-tipo-y-guia.mjs` (nueva): cambiar el tipo con hitos intactos (se sustituyen
todos); con un hito hecho y otro con una nota (los dos se conservan abajo como «no aplica»);
diciendo que no (nada cambia); tipo nuevo sin guía; y cambiar otra cosa que no sea el tipo (no
pregunta).

Sube a `main` sin abrir ninguna petición de cambios.
