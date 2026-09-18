# Fila 61 — Guardar sin pisar al compañero

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 2.2, fallo **GRAVE 1**.

**Es el arreglo más urgente de toda la cola.** Va primero.

---

## 1. Qué pasa hoy

`_GESTOR/asuntos.json` es un solo fichero con la ficha de todos los asuntos. Cuando se guarda, se
escribe entero.

Casi todos los sitios que lo escriben llaman antes a `App.cargarRegistro()`, que lo vuelve a leer
del disco. Así, lo que haya escrito el compañero desde el otro ordenador entra en memoria antes de
que este ordenador escriba encima. Están comprobados y lo hacen bien:

- `js/nucleo.js` (`App.anotar`, la puerta por la que pasa casi todo)
- `js/ajustes-centro.js` (renombrar un estado en todos los asuntos)
- `js/asuntos-editar.js` (dos sitios)
- `js/fichas-huerfanas.js` (dos sitios)
- `js/unir-asuntos.js`
- `js/bandeja-correos.js` (dos sitios)
- `js/notas.js` (relee solo las notas del asunto, con `notasFrescas`)

**Hay exactamente dos que no lo hacen.** Los dos están en `js/papelera.js`:

- `mandarAsunto(a)` — mandar un asunto abierto a la papelera.
- `devolverAsunto(ficha)` — sacarlo de la papelera.

Los dos escriben `App.E.registro`, que es la copia que este ordenador tiene en memoria.

## 2. Por qué es grave

Esa copia en memoria se refresca solo cuando **este** ordenador escribe algo. La pantalla de
asuntos abiertos **no vuelve a leer el fichero por su cuenta en ningún momento**: ni en el repaso
de cada 20 segundos (que solo mira nombres de carpetas), ni al cambiar de pantalla.

Así que la copia puede tener horas. Al borrar un asunto con esa copia vieja, se escribe encima del
fichero bueno y **desaparece todo lo que el compañero haya escrito desde entonces**: notas,
estados, plazos, quién lo pide, relacionados. Sin error y sin aviso.

Caso real posible: Francisco abre a las 8:30, consulta toda la mañana sin guardar nada, y a las
13:00 borra un asunto creado por error. Se pierde la mañana entera del compañero.

## 3. Qué hay que hacer

### 3.1 El arreglo, en los dos sitios

En `js/papelera.js`, antes de tocar `App.E.registro`:

- En `mandarAsunto`: llamar a `await App.cargarRegistro()` **después** de haber movido la carpeta a
  la papelera y **antes** de borrar la clave y guardar.
- En `devolverAsunto`: lo mismo, después de trasladar la carpeta de vuelta y antes de poner la
  ficha y guardar.

Ojo con el orden: la relectura tiene que ir lo más pegada posible a la escritura, no al principio
de la función. Entre medias hay copias de carpetas que pueden tardar segundos.

En `mandarAsunto` hay además una trampa: `var datos = JSON.parse(JSON.stringify(a.ficha || {}))`
guarda una copia de la ficha para la papelera, y `a.ficha` viene de la memoria vieja. Después de
releer, hay que volver a coger la ficha buena de `App.E.registro.asuntos[a.nombre]` antes de
guardarla en la papelera; si no, se archiva en la papelera una versión vieja de la ficha y al
devolverla se perdería lo mismo por el otro lado.

### 3.2 Que no pueda volver a pasar

No basta con arreglar los dos sitios: mañana alguien añade un tercero. Hay que cerrar la puerta.

Crear en `js/nucleo.js` una función única, al lado de `App.anotar`, que sea **la única forma
correcta de escribir el registro entero**. Algo como `App.guardarRegistroFresco(cambiar)`:

- vuelve a leer el fichero del disco,
- llama a `cambiar(registro)`, que muta lo que haga falta,
- guarda con `Copias.guardar`,
- llama a `App.refrescarFichas()`.

Es el mismo patrón que ya usa `Hitos.cambiar` en `js/hitos.js`, que está bien hecho y se puede
copiar tal cual.

Después, **pasar por ella los diez sitios** que hoy llaman a `Copias.guardar(..., App.FICHERO_ASUNTOS, App.E.registro)`.
Los ocho que ya releen no cambian de comportamiento; los dos de la papelera se arreglan solos al
pasar por ahí.

Cuando estén los diez pasados, no debe quedar **ninguna** llamada directa a
`Copias.guardar` con `App.FICHERO_ASUNTOS` fuera de `js/nucleo.js`, salvo la de
`js/conflictos.js`, que es distinta a propósito (ahí se está fusionando una copia en conflicto de
Dropbox y el fichero ya se acaba de leer dos líneas antes).

### 3.3 Dejarlo escrito

Una línea en la sección de reglas de `docs/CONTEXTO-CORTO.md`: *el registro de asuntos solo se
escribe por `App.anotar` o por `App.guardarRegistroFresco`, nunca directo.*

## 4. Cómo se comprueba

Prueba nueva, `pruebas/guardar-sin-pisar.mjs`, sin navegador, con el disco de mentira en memoria
que ya usa `pruebas/logica.mjs`:

1. Se monta un registro con dos asuntos, A y B.
2. Se carga la aplicación y se deja la copia en memoria.
3. **Por detrás, se escribe en el fichero del disco** una nota nueva en el asunto B, como si la
   hubiera puesto el compañero.
4. Se manda el asunto A a la papelera.
5. **Se comprueba que la nota del asunto B sigue ahí.** Hoy esta comprobación falla; con el arreglo,
   pasa.
6. Lo mismo al revés: devolver A desde la papelera sin perder lo de B.
7. Una comprobación de que la ficha que se guarda en la papelera es la fresca, no la vieja.

Además, `npm test` entero en verde antes de subir.

## 5. Qué NO hay que hacer

- **No** tocar la fusión de conflictos de `js/conflictos.js`. Está bien y es otro asunto.
- **No** meter aquí la relectura periódica de la pantalla (que la lista se entere sola de lo que
  hace el compañero). Eso es de la fila 64, y hacerlo aquí encarecería esta fila sin necesidad.
- **No** aprovechar para tocar la papelera por ningún otro lado.

## 6. Cuánto es

Medio día, contando la prueba.
