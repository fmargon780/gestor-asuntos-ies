# Fila 96 — campos propios en el nombre de un documento

23-sep-2026. Diseñado y cerrado con Francisco el 23-sep-2026 (14:00).

## 1. El problema

Un documento se llama `AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext` (`Nombres.montarDocumento`).
Todo lo que no es fecha, registro ni tipo acaba en el texto adicional, escrito a mano. Ahí es
donde se olvidan datos que ese tipo de documento siempre debería llevar.

## 2. Lo acordado

Los campos se definen **en el tipo de documento**, en Ajustes. Se escriben una vez y valen para
todos los asuntos. Francisco descartó definirlos paso a paso en la guía.

**Ojo, no confundir con lo descartado**: sigue descartado meter los campos del tipo de ASUNTO en
el nombre de los documentos (son del asunto, no del papel). Esto es otra cosa: campos del propio
tipo de DOCUMENTO. La línea de la lista de descartado de `docs/CONTEXTO-CORTO.md` se queda tal
como está.

## 3. El dato

Cada tipo de documento (la misma lista que hoy se configura en Ajustes y que rellena el
desplegable del cuadro de poner nombre) gana:

    campos: [ { id, nombre, clase: 'texto' | 'lista' | 'fecha', valores: [], obligatorio: false } ]

`valores` solo lo usa la clase `lista`. Un campo sin nombre no sobrevive, igual que un paso sin
título. Un tipo de documento sin `campos` se comporta exactamente como hoy.

Se escriben donde hoy se gestionan los tipos de documento, con el mismo patrón de añadir, quitar
y mover que ya usan los campos por tipo de asunto (`js/campos.js`) y los requisitos de un paso
(`js/guias-requisitos.js`): `recoger(); mutar; pintar();`.

## 4. En el cuadro de poner nombre

- Al elegir el tipo de documento, debajo salen sus campos, en el orden configurado.
- Su valor entra en el nombre **entre el TIPO y el TEXTO ADICIONAL**, en ese orden, separados por
  un espacio. La vista previa del nombre se actualiza al escribir, como ya hace el resto del
  cuadro.
- Un campo `obligatorio` sin rellenar **no deja guardar**: mismo aviso que el asunto («Hace falta
  rellenar "X".»), sin bloquear ningún botón.
- Vale en los tres caminos que ponen nombre: nombrar un documento nuevo, renombrar uno que ya
  está (`js/documentos.js`) y registrar (`js/registro.js`, que hoy lee el resto del nombre del
  documento original con `Documentos.leerNombre`: los campos viajan dentro de ese resto, no se
  vuelven a preguntar).
- Al renombrar un documento que ya existe, los campos salen vacíos salvo que se reconozcan en el
  nombre (un campo de clase `lista` cuyo valor aparezca tal cual detrás del tipo). No se adivina
  nada más.
- **No se guarda nada nuevo en `asuntos.json`**: el nombre del fichero es el dato, como siempre.

## 5. Cómo se comprueba

`pruebas/campos-del-documento.mjs` (nueva, sin navegador para el montaje del nombre): un tipo con
dos campos, uno obligatorio; el nombre montado en el orden correcto; el aviso al dejar vacío el
obligatorio; un tipo sin campos, que se comporta como antes; y un documento con registro, que
conserva sus cuatro piezas.

Sube a `main` sin abrir ninguna petición de cambios.
