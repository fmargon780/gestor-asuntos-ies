# «Rellenar» un campo que el asunto ya tiene, y botones apagados que se ven apagados (fila 276)

Cerrado con Francisco el 6-oct-2026. Sale de un aviso de usuario enviado con el botón de soporte
(aviso completo: https://drive.google.com/file/d/12SR_Dn82S4K6RRkc-HFRs-_VSvaHDNpb/view?usp=drivesdk).

## Qué pasó

Francisco, en la ficha de un asunto del tipo «COBRO SEGURO ESCOLAR», pulsó «+ Añadir campo», fue a
la pestaña «Míos» y pulsó «Añadir» en la fila «Importe cobrado». Escribió: «Quiero añadir un nuevo
campo a un asunto y tras darle a añadir no hace nada». En su captura la tarjeta «Campos del asunto»
está vacía.

La causa más probable (sale del código y de la captura; **no se han podido ver sus datos reales**):

- «Importe cobrado» ya está puesto en ese tipo (o en su hito «Cobro»). Por eso el botón «Añadir»
  de la fila está apagado (`anadir.disabled = !!yaPuesto` en `js/campos-catalogo.js`).
- Un botón `.boton` apagado **se ve exactamente igual que uno encendido**: mismo color, mismo
  sombreado al pasar el ratón, misma mano. El motivo («Ya está puesto en este tipo») solo sale si
  se deja el ratón quieto encima.
- La tarjeta «Campos del asunto» solo enseña los campos que tienen valor (fila 51). Como en ese
  asunto el campo estaba vacío, parecía que el asunto no lo tenía.

Resultado: un botón que parece vivo, no hace nada y no dice por qué.

## Qué quiere Francisco

- Que un campo que el asunto ya tiene, pero vacío, se pueda rellenar desde ese mismo cuadro.
- Que un botón apagado se vea apagado y diga por qué.

## Qué hay que hacer

### 1. Un botón apagado se ve apagado, en toda la app

- Regla de estilo para `.boton:disabled`: texto gris (`var(--tinta-suave)`), sin el sombreado de
  `:hover`, cursor normal (no la mano).
- `.boton-peligro:disabled`: igual, en gris (borde incluido), no en rojo.
- `.boton-principal:disabled` se queda **como hoy** (fondo `#b6c3d0`, texto blanco). Ojo: la regla
  nueva no puede cambiarle el color del texto.
- No se cambia cuándo se apaga cada botón. Solo cómo se ve.

### 2. El panel de campos dice por qué un botón está apagado

En `js/campos-catalogo.js`, pestañas «Míos» y «Calculados». Una fila cuyo campo ya está en la
lista lleva hoy «Añadir» apagado y un `title`. Ahora, además:

- El texto gris de la fila (el `<span class="suave">`, que hoy dice la clase: «importe en eu…»)
  pasa a decir el motivo, y **se tiene que leer entero** (sin puntos suspensivos) a 1280 px:
  - Abierto desde Ajustes de un tipo: **«ya está en este tipo»**.
  - Abierto desde un asunto (ficha o mesa de un hito): **«ya está en este asunto»**.
- El texto llega por una opción nueva de `CamposCatalogo.abrir` (por ejemplo
  `opciones.textoYaPuesto`); sin ella vale «ya está en este tipo». El `title` del botón dice lo mismo.

### 3. «Rellenar», solo desde la ficha del asunto

Vale para «+ Añadir campo» de la tarjeta «Campos del asunto» (`CampoDesdeElAsunto.abrir(a)` **sin**
hito). Desde la mesa de un hito no hay «Rellenar» (ver «Qué NO se toca»).

**Qué campos.** Los del asunto (`Campos.camposDeAsunto(config del tipo, ficha fresca)`, de
cualquier origen, con hito o sin él, también los «solo aquí») cuyo valor guardado
(`ficha.campos[clave].valor`) está vacío o son solo espacios. Les llamo aquí «sin rellenar».

**Dónde salen.**

- Pestaña «De la ficha» (la que se abre primero): arriba, el grupo
  **«Ya están en este asunto, sin rellenar»**, con todos los campos sin rellenar, cada uno con su
  nombre y el botón **«Rellenar»**. Es el mismo grupo de la fila 255 (`opciones.yaEstan` y
  `onYaEsta`), ahora con el título y el texto del botón configurables. Sin ningún campo sin
  rellenar, el grupo no sale. El buscador lo filtra, como hoy.
- Pestañas «Míos» y «Calculados»: en la fila de un campo sin rellenar, el botón dice **«Rellenar»**
  y está encendido (en vez de «Añadir» apagado). El texto gris de la fila dice
  **«en este asunto, sin rellenar»**, entero. «Cambiar», «Duplicar» y «Quitar», como hoy.
- Un campo del asunto que **sí** tiene valor: en «Míos» y «Calculados», «Añadir» apagado y «ya está
  en este asunto» (punto 2). En «De la ficha» sigue sin salir, como hoy.

**Qué hace «Rellenar».** Cierra el panel y abre el cuadro del valor, el mismo de hoy
(`pedirValorYDonde`) con estas diferencias:

- Título: **«Rellenar el campo «X»»**. Botón: «Guardar».
- **Sin** el bloque «¿Dónde se guarda?»: el campo ya existe, no hay nada que decidir.
- Sin el texto «(se puede dejar vacío)».
- El control, según la clase del campo (`CamposClases`), como hoy. Valor de partida, como hoy
  (`valorDePartida`: lo que el fichero sepa de la persona; un campo propio empieza vacío). Intro
  guarda, como hoy.
- Un importe, número o fecha que no se entiende: aviso ámbar y se vuelve a pedir con lo escrito,
  como hoy.

**Qué guarda.** Solo el valor, en la ficha del asunto: `escribirEnAsunto(a, clave, { valor })`,
sin `anadir` ni `quitar`. **No toca** la configuración del tipo (`campos.json`) ni
`camposPropiosDelAsunto`. Después:

- Aviso verde: **«Campo «X» rellenado.»** y la ficha se repinta (`repintar`): el campo aparece en
  la tarjeta «Campos del asunto» (bajo el nombre de su hito si es de un hito, fila 255).
- Si se pulsa «Guardar» con el valor vacío: no se escribe nada y sale el aviso ámbar
  **«No has escrito nada: «X» sigue vacío.»**
- Si falla al guardar: aviso rojo «No he podido rellenar el campo» con el motivo. Si tarda, el
  aviso ámbar de espera de hoy (`vigilar`).

### 4. Por si la causa fuera otra

Antes de programar, reproduce el aviso en la copia de demostración: un campo propio de clase
«Importe en euros» puesto en un tipo, y un asunto abierto de ese tipo con ese campo vacío.
Comprueba también el caso contrario: un campo propio de clase importe que el asunto **no** tiene,
pulsando «Añadir» en «Míos», tiene que pedir el valor y «¿Dónde se guarda?». Si encuentras otro
camino por el que «Añadir» no hace nada con el botón encendido, arréglalo en esta misma fila y
dilo en el mensaje final.

## Qué NO se toca

- La tarjeta «Campos del asunto» sigue enseñando solo los campos con valor (y los «solo aquí»).
- Desde la mesa de un hito («Campos de este hito» → «+ Añadir campo»): nada de «Rellenar». El
  grupo «Ya están en este asunto» sigue con su título, su botón «Añadir» y lo que hace hoy (llevar
  el campo al hito). Lo único nuevo ahí es el punto 2.
- En Ajustes de un tipo, lo único nuevo es el punto 2. Qué se guarda y cuándo, igual.
- «Cambiar el asunto» y «Nuevo asunto».
- La forma de los datos guardados. **No hay nada que migrar.**

## Antes de empezar

- No leas el repositorio entero. Con `docs/CONTEXTO.md`, `docs/contexto/CAMPOS-Y-TIPOS.md`,
  `docs/CAMPO-DESDE-EL-ASUNTO.md` (fila 245) y `docs/CAMPOS-DE-UN-HITO.md` (fila 255) basta.
- Cambios quirúrgicos: no reescribas ficheros enteros.
- Ningún fichero de `js/` pasa de 600 líneas. `js/campos-catalogo.js` tiene 494 y
  `js/campo-desde-el-asunto.js` 375: lo nuevo cabe en ellos. Si no cupiera, un fichero nuevo y
  pequeño al que se le llama; nada envuelve nada.
- `CamposCatalogo` no sabe nada de asuntos: quién está «sin rellenar» y qué hace «Rellenar» se lo
  pasa `js/campo-desde-el-asunto.js` por `opciones`. Sin esas opciones (Ajustes de un tipo, mesa
  de un hito), el panel se porta como hoy más el punto 2.
- Textos de pantalla con las palabras de `docs/VOCABULARIO.md`.
- Rama `fila-276`, revisor en local y, con su APROBADA, a `main`. Nada se queda en una petición de
  cambios abierta ni en borrador.
- Mientras trabajas, solo las pruebas de lo tocado (`node pruebas/ejecutar.mjs rellenar-campo
  campo-desde-el-asunto campos-catalogo campos-de-hito campos-importe`); la pasada completa, una
  sola vez al final.
- Ningún dato real de personas en las pruebas ni en los documentos: inventados.

## Ficheros

- `css/estilos.css` (o la hoja que toque): los botones apagados (punto 1).
- `css/ajustes.css`: que el texto del motivo se lea entero en las filas de «Míos» y «Calculados».
- `js/campos-catalogo.js`: el motivo a la vista; título y texto del botón del grupo de arriba
  configurables; «Rellenar» en las filas de «Míos» y «Calculados» cuando se lo piden por `opciones`.
- `js/campo-desde-el-asunto.js`: calcular los campos sin rellenar, pasarlos al panel, y el camino
  «Rellenar» (cuadro del valor sin «¿Dónde se guarda?» y guardado solo del valor). Pon al día su
  comentario de cabecera.
- `pruebas/rellenar-campo-que-ya-esta.mjs` (nueva, con navegador, con los puntos de abajo).
- `pruebas/campo-desde-el-asunto.mjs`, `pruebas/campos-catalogo.mjs` y `pruebas/campos-de-hito.mjs`:
  solo si algún paso da por hecho el texto gris de la clase en una fila ya puesta.
- `js/novedades.js`: «En «+ Añadir campo» de un asunto, un campo que el asunto ya tiene pero está
  vacío lleva el botón «Rellenar»: pide el valor ahí mismo. Y los botones apagados ahora se ven en
  gris.»
- Al terminar: `docs/CONTEXTO-CORTO.md` (en la línea de los campos del asunto, sin alargarla),
  `docs/contexto/CAMPOS-Y-TIPOS.md` y `docs/HISTORIA.md`. `docs/CAMPO-DESDE-EL-ASUNTO.md` y
  `docs/CAMPOS-DE-UN-HITO.md` son instrucciones ya cerradas: no se reescriben.

## Qué dirá Claude Code a Francisco al terminar

En pocas frases: que en «+ Añadir campo» de un asunto, un campo que el asunto ya tiene pero está
vacío lleva «Rellenar» y pide el valor ahí mismo; que un campo que ya tiene valor sale con el botón
en gris y «ya está en este asunto»; y que los botones apagados se ven ahora en gris en toda la
app. Si al reproducirlo encontró otra causa, cuál era.

Y la respuesta para quien mandó el aviso, en una línea: «El campo ya estaba en ese tipo de asunto,
pero vacío: por eso no se veía en la ficha y su botón estaba apagado sin decirlo. Ahora ese botón
dice «Rellenar» y pide el valor ahí mismo.»

## Cómo sabemos que está bien

Preparación, en la copia de demostración. Elegir un tipo de asunto que tenga al menos dos asuntos
abiertos. En Ajustes → tipos de asunto → ese tipo → «Campos» → «+ Añadir campo» → «Míos» →
«+ Crear un campo propio»: nombre «Importe de prueba», clase «Importe en euros», «Crear y añadir»;
volver y «Guardar campos». Hace falta además otro campo propio que ese tipo **no** tenga (si no hay
ninguno, se crea desde otro tipo).

1. En Ajustes de ese tipo → «Campos» → «+ Añadir campo» → «Míos»: en la fila «Importe de prueba»
   el botón «Añadir» se ve en gris, no se sombrea al pasar el ratón y el cursor no es la mano. En
   la fila se lee entero «ya está en este tipo».
2. Abrir un asunto abierto de ese tipo: la tarjeta «Campos del asunto» no enseña «Importe de
   prueba» (está vacío).
3. Pulsar «+ Añadir campo» en esa tarjeta: el cuadro se abre en «De la ficha» y arriba sale el
   grupo «Ya están en este asunto, sin rellenar», con «Importe de prueba» y el botón «Rellenar».
4. Pestaña «Míos»: la fila «Importe de prueba» lleva el botón «Rellenar», encendido, y el texto
   «en este asunto, sin rellenar», entero. La fila del otro campo propio (el que el tipo no tiene)
   lleva «Añadir» encendido, como siempre.
5. Pulsar «Rellenar» en «Míos»: se abre el cuadro «Rellenar el campo «Importe de prueba»», con la
   caja del importe y el botón «Guardar». **No** sale «¿Dónde se guarda?».
6. Escribir 12,50 y «Guardar»: aviso verde «Campo «Importe de prueba» rellenado.» y, sin recargar,
   la tarjeta «Campos del asunto» enseña «Importe de prueba» con 12,50 €.
7. Pulsar otra vez «+ Añadir campo»: «Importe de prueba» ya no está en el grupo de arriba (si no
   queda ningún campo sin rellenar, el grupo no sale). En «Míos», su botón «Añadir» está en gris y
   en la fila se lee «ya está en este asunto».
8. En Ajustes de ese tipo, la lista de campos del tipo es la misma que antes del punto 5. El otro
   asunto abierto del mismo tipo sigue sin enseñar «Importe de prueba».
9. En ese otro asunto: «+ Añadir campo» → «Rellenar» desde el grupo de arriba de «De la ficha»:
   se abre el mismo cuadro del punto 5.
10. En ese cuadro, escribir «abc» y «Guardar»: aviso ámbar y el cuadro vuelve a salir con «abc»
    escrito. «Cancelar»: no se guarda nada; el campo sigue sin rellenar.
11. Otra vez «Rellenar», dejar la caja vacía y «Guardar»: aviso ámbar «No has escrito nada:
    «Importe de prueba» sigue vacío.» y nada cambia en la ficha.
12. En «Míos», pulsar «Añadir» en el otro campo propio (el que el asunto no tiene): pide el valor
    y enseña «¿Dónde se guarda?», como antes de esta fila.
13. Desde la mesa de un hito de ese asunto, «Campos de este hito» → «+ Añadir campo»: en ninguna
    pestaña sale «Rellenar». Si sale el grupo de arriba, se llama «Ya están en este asunto» y su
    botón es «Añadir», como antes. En «Míos», un campo que el asunto ya tiene lleva «Añadir» en
    gris y «ya está en este asunto».
14. Un botón principal apagado se ve como antes: en «+ Crear un campo propio», con el nombre
    vacío, «Crear y añadir» sale con fondo azul claro y texto blanco.
15. En un asunto del ARCHIVO y en solo consulta sigue sin salir «+ Añadir campo».
