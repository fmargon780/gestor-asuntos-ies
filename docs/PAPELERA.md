# Instrucción: borrar con papelera

Acordado con Francisco el 11 de septiembre de 2026.
Lee antes `docs/CONTEXTO.md`. Al terminar, actualiza `docs/CONTEXTO.md` y `docs/COLA.md`.

## La idea en una frase

Hoy no se puede borrar nada desde la aplicación. A partir de ahora sí, pero **nada se borra de
verdad a la primera: se manda a una papelera** de la que se puede devolver a su sitio.

Por qué: las carpetas viven en el Dropbox del centro y lo usan dos administrativos. Un borrado
de verdad desaparece también del ordenador del compañero, sin aviso y sin manera de deshacerlo
desde la aplicación.

---

## 1. Dónde hay botón de borrar, y dónde no

| Sitio | ¿Botón? | Qué hace |
|---|---|---|
| Documento dentro de un asunto (ficha del asunto y cuadro "Gestionar documentos") | Sí | A la papelera |
| Documento suelto ("Por clasificar") | Sí | A la papelera |
| Asunto **abierto**, desde su ficha | Sí | A la papelera, con su ficha de `asuntos.json` |
| Asunto **abierto**, desde la tarjeta de la lista | **No** | Demasiado fácil de pulsar sin querer |
| Asunto **archivado** (pantalla Archivo) | **No** | El ARCHIVO es el rastro y no se toca |
| Tipo de asunto (Ajustes) | Sí | A la papelera, salvo que esté en uso |
| Estado del asunto (Ajustes) | Sí | A la papelera, salvo que esté en uso |
| Tipo de documento (Ajustes) | Sí | A la papelera, siempre |
| Campo propio (Ajustes) | Sí | A la papelera, salvo que esté asociado a un tipo |
| Persona o empresa dada de alta a mano | Sí | A la papelera, salvo que tenga asuntos |
| Persona que viene de Séneca | **No** | Se va sola cuando se actualiza el CSV |
| Nota de un asunto | **No** | Es el rastro de lo que se hizo |
| Nota del tablón | Ya tiene su botón Borrar | **Pásalo por la papelera igual que lo demás** |

Si alguno de esos sitios **ya tiene** hoy un botón de quitar o borrar, no lo dupliques: haz que
ese botón pase por la papelera.

El botón se llama siempre **Borrar**, con el aspecto de botón de peligro (rojo suave, no
relleno). Va siempre el último de su fila, separado de los demás.

---

## 2. Cómo es la papelera

Carpeta `_GESTOR/PAPELERA`, dentro de la carpeta de asuntos abiertos. Es compartida: los dos
administrativos ven lo mismo.

Lo que se borra y es una carpeta o un fichero se **mueve** ahí dentro, cada cosa en su propia
subcarpeta llamada `AAMMDD-HHMM <nombre original>`. Así dos borrados del mismo nombre no
chocan.

El traslado usa lo que ya existe en `js/carpetas.js`: `Carpetas.trasladar` para carpetas y
`Carpetas.moverFichero` para ficheros. Copian, comprueban y solo entonces quitan el original.
**Si la copia no sale completa, no se borra nada** y se dice en pantalla.

Lo que se borra y **no** es un fichero —un tipo de asunto, un estado, un campo propio, una
persona dada de alta a mano, una nota del tablón— no tiene carpeta: se guarda entero su dato
en el índice.

### El índice: `_GESTOR/papelera.json`

Una lista de fichas, la más nueva arriba. Cada ficha:

```json
{
  "id": "1709-1432-7c3",
  "clase": "documento",
  "nombre": "260415 FACTURA Material de oficina.pdf",
  "carpeta": "260911-1432 260415 FACTURA Material de oficina.pdf",
  "origen": { "asunto": "260415 COMPRA Papelería Pintor Palomo 33385414V" },
  "datos": null,
  "quien": "Francisco",
  "cuando": "2026-09-11T14:32:00.000Z"
}
```

- `clase`: `documento` · `suelto` · `asunto` · `tipo` · `estado` · `tipo-documento` ·
  `campo-propio` · `tercero` · `nota-tablon`.
- `carpeta`: el nombre de la subcarpeta de `_GESTOR/PAPELERA`, o `null` si no es un fichero.
- `origen`: lo que hace falta para devolverlo a su sitio.
- `datos`: para lo que no es un fichero, el objeto tal cual estaba en su lista. Para un asunto,
  además, **su ficha entera de `asuntos.json`**, para que al devolverlo vuelva con su estado,
  sus notas, sus pasos marcados y su fecha límite.

`papelera.json` es un fichero compartido más: **se relee justo antes de escribirlo**, entra en
las copias de seguridad de `js/copias.js` y, si está roto, se trata como los demás (no se
escribe encima).

---

## 3. La pantalla de la papelera

Bloque nuevo en **Ajustes**, llamado **Papelera**, el último de todos. Un `<details>` como los
demás. Pie del bloque: *"Lo borrado se guarda aquí hasta que tú lo quites"*.

Cada línea enseña: qué era (con un icono de hoja, de carpeta o de lista), el nombre, de dónde
salía, quién lo borró y cuándo, en lenguaje llano (*"hace 3 días"*).

Dos botones por línea:

- **Devolver a su sitio**
- **Borrar del todo**

Arriba del bloque, si hay elementos de más de 30 días, un aviso ámbar:
*"Hay N cosas en la papelera desde hace más de 30 días"*, con el botón
**Borrar del todo lo de más de 30 días**.

**La papelera no se vacía sola nunca.** Ni al arrancar, ni por antigüedad, ni por número de
elementos.

Si la papelera está vacía, el bloque lo dice y no enseña nada más.

---

## 4. Devolver a su sitio

| Clase | A dónde vuelve |
|---|---|
| `documento` | A la carpeta de su asunto |
| `suelto` | A la raíz de la carpeta de asuntos abiertos |
| `asunto` | A la carpeta de asuntos abiertos, **y su ficha vuelve a `asuntos.json`** |
| `tipo`, `estado`, `tipo-documento`, `campo-propio` | A su lista, en el sitio que ocupaba si se puede |
| `tercero` | A su CSV, como una fila más |
| `nota-tablon` | A `tablon.json` |

Casos raros, y qué hacer en cada uno:

- **El asunto de un documento ya no existe** (lo archivaron o lo borraron): no se devuelve.
  Se dice en pantalla y se ofrece devolverlo a "Por clasificar", como documento suelto.
- **Ya hay algo con ese nombre en el destino**: no se pisa nada. Se dice qué hay y no se
  devuelve. `Carpetas.trasladar` ya lanza ese error; hay que enseñarlo con palabras claras.
- **Un tipo o estado con ese nombre ya existe otra vez**: no se devuelve; se dice que ya está.
- Al devolver algo, su ficha sale de `papelera.json`, pero **la subcarpeta vacía de la papelera
  se quita también**.

---

## 5. Las comprobaciones antes de borrar

Antes de enseñar el cuadro de confirmación:

- **Tipo de asunto**: se cuentan los asuntos abiertos y las fichas de `asuntos.json` con ese
  tipo. Si hay alguno, **no se borra**: se dice cuántos son. Si no hay ninguno pero tiene guía
  escrita, se avisa de que la guía se va con él (y se guarda en `datos`, para poder devolverla).
- **Estado**: si algún asunto lo tiene puesto, **no se borra**; se dice cuántos.
- **Tipo de documento**: se borra siempre. En el cuadro se aclara que los documentos ya
  nombrados **conservan su nombre**: esta lista solo sirve para nombrar los nuevos.
- **Campo propio**: si está asociado a algún tipo de asunto, **no se borra**; se dice a cuáles.
- **Persona o empresa**: si tiene carpeta en el ARCHIVO o algún asunto abierto, **no se borra**;
  se dice cuántos asuntos tiene. Y solo se puede borrar si se dio de alta a mano
  (`p.deSeneca !== true`), igual que pasa hoy con "Cambiar los datos".
- **Asunto abierto**: se cuentan sus documentos.

Cuando algo no se puede borrar, el cuadro **no ofrece borrar igualmente**. Solo se explica por
qué y se cierra.

---

## 6. El cuadro de confirmación

Uno solo, con `U.preguntar`. Título: **¿Mandar a la papelera?**

Dentro, el nombre completo de lo que se va a borrar, en negrita y en su propia línea. Debajo,
en gris: *"Se podrá recuperar desde Ajustes › Papelera."*

Botones: **Cancelar** y **Sí, a la papelera**.

**Nada de escribir palabras para confirmar.** Nada de casillas que marcar.

Excepción, y única: **un asunto abierto que tiene documentos dentro**. Entonces el cuadro dice
*"Se lleva N documentos"* y, al aceptar, sale **un segundo cuadro** que repite el nombre y
pregunta *"¿Seguro?"*.

**Cuidado**: solo hay un `#capa` en toda la aplicación. Hay que cerrar el primer cuadro antes
de abrir el segundo, o el segundo no se ve (está apuntado en `docs/CONTEXTO.md`).

El **Borrar del todo** de la pantalla de la papelera pide también su propia confirmación, con
esta frase debajo: *"Esto sí lo quita de verdad. Dropbox aún lo guarda 30 días más en su
propia papelera."*

---

## 7. El rastro

- Al mandar un **documento** a la papelera desde un asunto, se apunta sola una nota en ese
  asunto: *"<Quien> mandó a la papelera: <nombre del documento>"*. Con `Notas.anadir`.
- Al mandar un **asunto entero**, no hay dónde apuntarlo: el rastro es la ficha de
  `papelera.json`, que guarda quién y cuándo.
- Al **devolver** algo a un asunto, otra nota: *"<Quien> devolvió de la papelera: <nombre>"*.
- Al **borrar del todo**, la ficha sale de `papelera.json` y no queda rastro dentro de la
  aplicación. Es lo que se espera de un borrado definitivo.

---

## 8. Ficheros

Nuevos:

| Fichero | Qué hace |
|---|---|
| `js/papelera.js` | Todo lo de la papelera: mandar, devolver, borrar del todo, el bloque de Ajustes y los botones que se añaden a las demás pantallas |
| `css/papelera.css` | El bloque de la papelera y el aspecto del botón Borrar |
| `pruebas/papelera.mjs` | Las pruebas |
| `docs/PAPELERA.md` | Este documento |

`js/papelera.js` se carga **después de `js/dni.js` y antes de `js/inicio.js`**, para que pueda
envolver lo que ya está pintado. Si para algún sitio la envoltura sale peor que tocar el
fichero, toca el fichero: `docs/CONTEXTO.md` ya lo dice.

**Antes de colgar nada de `App`, comprueba que el nombre no está cogido** (`grep` por `js/`).
Nombres sugeridos, todos dentro de un solo objeto: `window.Papelera`.

Hay que tocar además: `index.html` (las dos líneas nuevas), `js/version.js` (subir
`App.VERSION`), y `docs/CONTEXTO.md` (sección 5, la tabla de ficheros, la tabla de lo que se
guarda en `_GESTOR`, y quitar de la sección 7 lo que este trabajo resuelva).

---

## 9. Las pruebas

En `pruebas/papelera.mjs`, con el disco de mentira que ya usan las demás. Y comprueba que cada
prueba **falla** sin el arreglo antes de darla por buena.

1. Borrar un documento de un asunto: desaparece de la carpeta del asunto, aparece en
   `_GESTOR/PAPELERA`, hay ficha en `papelera.json` y hay nota en el asunto.
2. Devolverlo: vuelve a la carpeta de su asunto, con el mismo nombre y el mismo tamaño, y su
   ficha sale de `papelera.json`.
3. Borrar un asunto con tres documentos: la carpeta sale de asuntos abiertos con los tres
   dentro, y su ficha sale de `asuntos.json` y queda guardada en `papelera.json`.
4. Devolver ese asunto: vuelven la carpeta, los tres documentos y la ficha entera, con su
   estado y sus notas.
5. Un tipo de asunto con asuntos vivos no se puede borrar, y el mensaje dice cuántos hay.
6. Un estado que algún asunto tiene puesto no se puede borrar.
7. Devolver un documento cuyo asunto ya no existe: no rompe, avisa, y lo deja en "Por
   clasificar".
8. Devolver algo cuando ya hay otra cosa con ese nombre en el destino: no pisa nada y avisa.
9. Si el traslado falla a mitad, el original sigue donde estaba y `papelera.json` no se toca.
10. En la pantalla Archivo no hay ningún botón Borrar.
11. La papelera no se vacía sola: tras arrancar la aplicación con fichas de hace 60 días,
    siguen ahí.

Y una prueba de navegador con Playwright que haga el recorrido entero: borrar un documento
desde la ficha, ir a Ajustes › Papelera, devolverlo y verlo otra vez en su asunto.

---

## 10. Lo que NO hay que hacer

- **No vaciar la papelera sola.** Ni por días, ni por tamaño, ni al arrancar.
- **No poner botón de borrar en el ARCHIVO.**
- **No poner botón de borrar en la tarjeta de la lista de asuntos** (además, `js/ficha-asunto.js`
  poda la tarjeta con su lista blanca y no se vería).
- **No borrar notas de un asunto.**
- **No pedir que se escriba una palabra para confirmar.**
- **No borrar nada con `removeEntry` directamente** desde un módulo que no sea `js/carpetas.js`.
