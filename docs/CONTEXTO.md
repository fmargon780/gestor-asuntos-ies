# Proyecto: Gestor de Asuntos / Expedientes — IES Fuente Lucena

Documento de contexto. Léelo entero antes de proponer nada.
Última actualización: 11 de septiembre de 2026 (copia en el repositorio, tabla de ficheros
puesta al día y plan de robustez en `docs/PLAN-ROBUSTEZ-2026-09.md`).

**Este documento vive en dos sitios**: en el proyecto de Claude (`Contexto.md`) y aquí, en
`docs/CONTEXTO.md` del repositorio. Se cambia en el mismo commit en que cambia el código.

---

## 0. LO PRIMERO: la dirección buena cambió el 10-sep-2026

    https://gestor-de-asuntos.vercel.app

**La antigua, `asuntos-ies.vercel.app`, ya no existe.** El proyecto de Vercel que la servía se
borró ese día. Si en algún sitio de este documento o de una conversación vieja aparece
`asuntos-ies`, está desfasado.

Por qué cambió: había **cuatro proyectos de Vercel colgados del mismo repositorio**
(`asuntos-ies`, `gestor-de-asuntos`, `gestor-asuntos` y `gestor-asuntos-ies`). Cada subida al
repositorio disparaba cuatro publicaciones a la vez. Ese día `asuntos-ies` se quedó atrás: su
última publicación fue el commit `c220440` de las 10:32, y los cinco commits siguientes se
publicaron en `gestor-de-asuntos` pero **en `asuntos-ies` no**, sin ningún error y sin ningún
aviso.

Se quedó el proyecto **`gestor-de-asuntos`**, que era el que estaba publicando bien, y se
borraron los otros tres. **Ahora hay un solo proyecto de Vercel. Que siga siendo así.**

**Efecto secundario que hay que saber:** las dos carpetas señaladas y el nombre de usuario se
guardan en el navegador **atados a la dirección**. Al cambiar de dirección, la aplicación
arranca de cero y el botón Entrar sale apagado. **No es un fallo**: hay que volver a señalar
las dos carpetas y escribir el nombre, una vez en cada ordenador. Le pasó a él nada más
cambiar, y a su compañero le pasará igual.

---

## 1. Quién soy y cómo quiero trabajar

Francisco, auxiliar administrativo del IES Fuente Lucena (Alhaurín el Grande, Málaga).
No soy programador. Yo propongo, pruebo y digo si el resultado se ajusta a lo que buscaba.
El diseño y la comprobación del código son tuyos.

Cómo quiero que me escribas:

- Pocas frases. Si escribes mucho, me pierdo.
- Una idea por frase. Sin jerga y sin dar por sabido lo anterior.
- Una sola pregunta o decisión por mensaje. Espera mi respuesta antes de seguir.
- Si hay que elegir, dame las opciones numeradas y marca la recomendada. Contesto con el número.
- No me pidas permiso para cambiar código: aplícalo.
- Verifica tú tu propio trabajo. Solo pídeme comprobar lo que solo yo puedo ver.
- Cuando me guíes por una interfaz, ve paso a paso y dime dónde está cada botón.

**Nada de tareas manuales mías.** Si algo se puede hacer desde la aplicación, se hace desde
la aplicación. Copiar ficheros de una carpeta a otra a mano, o abrir un CSV para tocarlo, es
justo lo que no quiero. **Cada vez que se añade un dato nuevo, hay que preguntarse cómo lo
pone en los que ya estaban dados de alta**: si la respuesta es "editando el fichero a mano",
falta media función. Pasó con el nombre comercial el 10-sep-2026.

**Y donde se usa una cosa, se cambia.** Si tramitando un asunto se ve que falta un paso en la
guía, la guía se escribe ahí, sin salir a Ajustes. Misma idea.

Mi ordenador es un **Chromebook Plus**. Trabajo en el navegador, no en terminal.
En el trabajo uso un monitor bastante más ancho que el del Chromebook.

**Ya no trabajo solo con esto: mi compañero administrativo también lo está usando**
(9-sep-2026). Todo lo que se guarda en `_GESTOR` lo ven los dos.

---

## 2. Qué es este proyecto, y qué NO es

Este proyecto es **el gestor de asuntos del centro**: una aplicación web para crear,
nombrar y archivar las carpetas de cada gestión administrativa.

**No es el proyecto de la base de datos de alumnado.** Ese es otro, con su propio
repositorio (`fmargon780/bd-alumnado-ies`), su propio contexto y su propio cuaderno de
Google Sheets. Si aparece aquí una duda sobre informes de tutores, PIL, repeticiones o
censo NEAE, es del otro proyecto y hay que llevarla allí.

**Lo único que comparten los dos** es el fichero `RegAlum.csv` de Séneca, que aquí se usa
solo para consultar datos de contacto del alumnado y de sus tutores legales.

---

## 3. El problema que resuelve

Por cada gestión administrativa creo una carpeta con nombre estructurado.

- Mientras el asunto está abierto, la carpeta vive en una carpeta de **asuntos abiertos**.
- Al cerrarlo, la muevo al **ARCHIVO**.
- Si se reabre, vuelve a abiertos.

Estructura del ARCHIVO: la raíz `ARCHIVO`, y dentro `ALUMNADO`, `EMPRESAS`, `PERSONAL` y
`OTROS`. Dentro de cada una, una carpeta por tercero. Dentro de cada tercero, las carpetas
de sus asuntos.

Las carpetas viven en el **Dropbox del centro**, sincronizado en mi ordenador.

---

## 4. Las reglas de nombres  ← ES LO IMPORTANTE DEL PROYECTO

### Carpeta de asunto

    AAMMDD TIPO [AÑO ACADÉMICO] [texto libre] Tercero

- `AAMMDD` = fecha de inicio del asunto.
- `TIPO` = el tipo de asunto en mayúsculas: MATRICULA, COMPRA, SANCION...
- El año académico, si procede.
- A veces un texto libre.
- **El tercero va siempre al final.**

### Cómo se escribe el tercero

| Categoría | Formato |
|---|---|
| Alumnado | `Apellido1 Apellido2, Nombre` + número de identificación escolar |
| Personal | `Apellido1 Apellido2, Nombre` + los **4 últimos caracteres** del documento, con la letra: `12345678Z` → `678Z` |
| Empresas | **Razón social** + NIF |

En las empresas manda **la razón social, no el nombre comercial**: es la que viene en las
facturas y la que hay que poder cruzar con la contabilidad. El rótulo del negocio se guarda
aparte y sirve para buscar (sección 5).

### Documento dentro de la carpeta

    AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext

- `AAMMDD` es la fecha **del propio documento** (la que trae impresa la factura), no la
  del día en que se archiva.
- `TIPO` = FACTURA, CERTIFICADO, MATRICULA, SOLICITUD...
- **El último hueco es texto libre** (10-sep-2026). Antes se llamaba "Año académico" y se
  rellenaba solo con el curso; ver la sección 5.

### Lo que entra por correo

El hilo del correo en PDF: `AAMMDD CORREO.pdf`, con la fecha del último mensaje.

Los adjuntos: `AAMMDD ADJUNTO <el nombre que traían>.ext` (10-sep-2026, decidido por él).
Gmail los manda como venían —`1000082963.jpg`, `LITNAC2026050413001031751487.pdf`— y esos
nombres no dicen nada y se mezclaban con los papeles del expediente. El nombre de origen se
limpia y se recorta a 40 caracteres. Si el adjunto merece un nombre de verdad, se le pone
después desde "Gestionar documentos".

### El número de registro de Séneca

Formato `26EM1234`:

- `26` = el año. Se coge de la fecha del día en que se incluye el documento, y se puede cambiar.
- `E` = entrada · `S` = salida.
- `M` = serie manual · `A` = serie automática.
- `1234` = los cuatro dígitos del asiento.

Hacen falta las cuatro piezas porque Séneca lleva dos series y el número se repite cada año.

### El grupo en el nombre de la carpeta

Hay un interruptor para añadir el grupo del alumno. **Cuidado con Bachillerato:** en la ESO
el grupo se abrevia `1ºA`; en Bachillerato lleva la etapa, `1ºBachA`, para que no se
confunda con el `1ºA` de la ESO.

### Lo que NO va en el nombre

El estado del asunto y la vía de comunicación **no** entran en el nombre de la carpeta.
Cambian mientras se tramita, y renombrar carpetas en un Dropbox sincronizado cada vez que
algo avanza sería pedir problemas. Van en `_GESTOR/asuntos.json`, que está en la misma
carpeta compartida y lo lee cualquiera que abra la aplicación.

### Comunicaciones

Guardo también copia en PDF de los hilos de correo o de Passen. El asunto del mensaje es
el nombre de la carpeta del asunto.

---

## 5. Cómo funciona la aplicación

Es una **web publicada en Vercel** que trabaja sobre la carpeta de Dropbox **de mi propio
ordenador**, con el selector de carpetas del navegador (Chrome o Edge).

- Sin cuenta de Dropbox, sin servidor y sin base de datos aparte.
- Los datos no salen del ordenador.

**Por qué es así:** no tengo la contraseña de la cuenta común de Dropbox del centro, y no
sé si me la darían. Acabo de llegar y apenas me conocen. **El diseño no puede depender de
esa contraseña.**

Decisiones de diseño ya aprobadas:

- Primero se elige la **categoría** (ALUMNADO, PERSONAL, EMPRESAS, OTROS), y después el tipo.
- Los **tipos de asunto** solo se crean en Ajustes, nunca sobre la marcha. Los de DOCUMENTO
  sí se crean al vuelo, desde el propio cuadro.
- Se puede ver el archivo completo de un tercero.
- La ficha del alumnado enseña arriba la edad actual, el DNI y los datos de contacto de los
  tutores legales.
- Además de arrastrar un documento a la carpeta, se puede elegir desde la app en la carpeta
  donde esté: se guarda una copia ya con el nombre montado, y el original se queda donde estaba.
- **Estado del asunto** (septiembre de 2026). Dice por dónde va la tramitación. La lista la
  pone el centro en Ajustes, en el orden del trámite, no alfabético. Se guarda en
  `_GESTOR/estados.json`. De partida: PENDIENTE, EN TRÁMITE, ENVIADO A FIRMA, FIRMADO,
  A LA ESPERA DEL TERCERO, RESUELTO. La casilla "Depende de otros" decide en cuál de las tres
  tarjetas de arriba sale el asunto.
- **Vía de comunicación preferente** (septiembre de 2026). Es del asunto, no del tercero:
  lo que ha pedido para esa gestión concreta. Teléfono, correo, iPasen o en persona.
  `js/via-contacto.js` ofrece como botones los teléfonos o correos que ya están en el CSV del
  tercero, para no escribirlos a mano.
- **Fecha límite** (`js/plazos.js`). Opcional, va en la ficha de `asuntos.json`, nunca en el
  nombre. Los días se cuentan naturales. Lo que vence sale en rojo en las tarjetas.
- **Asuntos recurrentes** (`js/recurrentes.js`, `_GESTOR/recurrentes.json`). Gestiones que
  vuelven cada mes, trimestre o curso. Se apuntan una vez y la aplicación avisa cuando toca.
  **Las carpetas no se crean solas**: hasta que no se pulsa el botón no se crea nada.
- **¿Esto no lo hicimos ya?** (`js/duplicados.js`). Antes de abrir un asunto se mira si ese
  tercero ya tuvo otro igual. Se mira barato: solo su carpeta del ARCHIVO y los abiertos.
- **Buscador de tipos** (`js/tipos-buscador.js`). Con muchos tipos, tres letras filtran la
  parrilla y arriba salen los más usados.
- **Las dos listas de la pantalla de asuntos abiertos se distinguen a simple vista**
  (septiembre de 2026). Documentos sueltos: hoja y franja arena. Asuntos: carpeta y franja azul.
- **Editar un asunto ya creado** (septiembre de 2026, `js/asuntos-editar.js`). Botón Editar en
  cada asunto abierto. Cambiar datos es cambiar el nombre de la carpeta, y la ficha viaja con
  ella. **En el ARCHIVO no hay botón Editar**: el nombre de una carpeta archivada es el rastro
  de aquel día.
- **Copiar el Nº de identificación escolar** (9 de septiembre de 2026). Botón `Nº 1139877` en
  la tarjeta de cada asunto de alumnado, en la ficha del asunto, en las listas de resultados y
  en la ficha del alumno. **Solo en la categoría ALUMNADO**, para no confundirlo con los
  cuatro caracteres del documento del personal ni con el NIF de una empresa.
- **Copiar el nombre de un documento, sin la extensión** (9 de septiembre de 2026). En la
  ficha del asunto y en el cuadro de gestionar documentos.
- **Crear el tipo de documento desde el propio cuadro** (9 de septiembre de 2026). La última
  opción del desplegable abre un campo para crearlo ahí mismo, sin salir a Ajustes.
- **La guardia contra duplicados, en las cuatro puertas** (9 de septiembre de 2026). El cuadro
  de documentos y las tres listas de Ajustes: **tipos de asunto, estados y tipos de
  documento**. Cada nombre se reduce a su hueso: sin mayúsculas, sin tildes, sin espacios,
  guiones ni puntos, y sin la S del plural.
  - Si ya está escrito de otra manera, **no se crea** y se dice cuál es el que hay.
  - Si solo se parece —una errata a una o dos letras, o un nombre que contiene a otro—, se
    avisa, se enseñan los parecidos y se deja decidir.
  Vive en `js/util.js` (`U.parecidos` y `U.dejaCrear`). Si hace falta en otro sitio, se llama
  desde allí: no se copia.
- **Aviso de que el RegAlum.csv está viejo** (9 de septiembre de 2026). Al abrir se mira la
  fecha del propio fichero en `_GESTOR/datos`. Ámbar al pasarse, rojo al doblar el plazo, y
  rojo también si no hay ningún RegAlum.csv.
  **Cuántos días es "viejo" depende de la época del año.** Las épocas van en día-mes, sin año,
  y pueden dar la vuelta al año. Se cambian en Ajustes y se guardan en `_GESTOR/frescura.json`.
  De partida: comienzo de curso (01-09 a 31-10) cada 7 días; matrícula y verano (01-06 a
  31-08) cada 15; escolarización (01-03 a 30-04) cada 15; el resto del año, cada 30.
- **La versión, a la vista** (9 de septiembre de 2026). En la pantalla de entrada y, ya
  dentro, abajo a la izquierda. Nació de un susto: no veía el tablón porque el navegador tenía
  la página vieja. **Se cambia en `App.VERSION` cada vez que se publica algo que él tenga que
  ver.** Desde el 10-sep-2026 la versión lleva también la hora, en formato
  `10-sep-2026 · 13:55`, hora de España. Es además el termómetro para saber si Vercel ha
  publicado de verdad: ver más abajo.
- **Botón de Salir** (9 de septiembre de 2026). Al pie de la barra de la izquierda, debajo de
  Ajustes, separado por una línea. Salir aquí es **cerrar la sesión**: se recarga la página y
  se vuelve a la pantalla de entrada, con las dos carpetas ya señaladas. Pide confirmación.
  Vive en `js/salir.js`.
- **La barra de la izquierda se pliega, y nace plegada** (10 de septiembre de 2026). Un botón
  de tres rayas arriba del todo la abre y la cierra. Al elegir una pantalla se vuelve a plegar
  sola. Lo que él elija se recuerda (`gestor-barra`), pero **de partida está plegada**.
  Vive en `js/barra.js`.
- **Botón grande de "+ Nuevo asunto"** (10 de septiembre de 2026). En la cabecera de la
  pantalla de asuntos abiertos. Lo pone el mismo `js/barra.js`.
- **El panel de lectura de la derecha** (10 de septiembre de 2026). La aplicación se queda a
  la izquierda y lo que se lee sale a la derecha. Se cierra con la equis o con Escape. **El
  borde izquierdo se arrastra**, y el ancho se recuerda (`gestor-lector-ancho`); con doble
  clic vuelve al 46%. En pantalla estrecha (menos de 1100 píxeles) se pone a lo ancho.
  Es un servicio para los demás módulos: `Lector.abrir({ titulo, pie, blob, botones })`.
  Vive en `js/lector.js`.
- **Comodidades de pantalla** (`js/usabilidad.js`): botón Volver, Cancelar, etiquetas de lo
  que se está filtrando, vista compacta y la tecla Escape. No toca datos.

### La ficha de un asunto

Al pulsar el nombre de un asunto se entra en su ficha, y ahí está todo lo suyo: sus datos, el
contacto del tercero, la guía de su tipo con las casillas, sus notas, sus documentos y los
demás asuntos del mismo tercero.

**Por eso la tarjeta de la lista se queda con lo justo**: el desplegable del estado, "Copiar
nombre" y "Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una
lista blanca (`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la
tarjeta con `window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.

### Las tarjetas por tipo de asunto (10 de septiembre de 2026)

Dentro de **En el departamento** y de **A la espera de terceros**, encima de la lista, sale
una fila de tarjetas pequeñas: una por cada tipo de asunto que haya en ese montón, con
cuántos son y, en rojo, cuántos están fuera de plazo. La primera tarjeta es **Todos**.

- Al pulsar una, la lista de abajo se queda solo con los asuntos de ese tipo.
- Al volver a pulsarla, o al pulsar Todos, vuelven a salir todos.
- Al cambiar de montón se empieza siempre viendo todos los tipos.
- **Con un solo tipo las tarjetas no salen.**
- Las cuentas se hacen sobre lo que ya han dejado pasar el buscador y los filtros.
- Si el tipo elegido desaparece del montón se vuelve solo a Todos.

El orden es por cantidad, de más a menos, y a igualdad por orden alfabético. Vive en
`js/asuntos-lista.js`, y sus estilos en `css/vista.css`.

**Un tropiezo del que hay que aprender.** La primera versión llamó a su función
`App.elegirTipo`. Ese nombre ya existía en `js/asuntos-nuevo.js`, que se carga **después**. La
función de las tarjetas se perdía sin dar ningún error. Ahora se llama `App.filtrarPorTipo`.
**Regla: antes de colgar una función nueva de `App`, comprobar que ese nombre no está ya
cogido en otro fichero.** Las pruebas de jsdom no lo cazan: hace falta el navegador con la
aplicación entera.

### Lo que deja un correo dentro del asunto (10 de septiembre de 2026)

Palabras suyas al ver un asunto que había recibido correos: *"es un poco caótico y con textos
complejos en las notas"*. De ahí salieron cuatro cosas, y las cuatro están hechas.

- **La nota de un correo es de dos líneas.** *"Correo de Mercedes Pacheco · 09/09/2026"* y
  debajo el asunto del correo. **El enlace ya no se escribe en el texto**: la nota lo guarda
  aparte y lo enseña como un botón **Abrir en Gmail**.
  `Notas.anadir(a, texto, extra)`, con `enlace`, `enlaceTexto` y `correo`.
- **Un correo no entra dos veces** (`Notas.yaTieneCorreo`).
- **Los adjuntos entran con nombre de la casa**: `AAMMDD ADJUNTO …`.
- **Los documentos de la ficha van en dos grupos**: "Del expediente" y "Llegados por correo".
  Los rótulos solo salen cuando hay de las dos clases. Lo de correo se reconoce por el nombre:
  CORREO, HILO o ADJUNTO.

Un detalle de fontanería: las fechas que trae el correo se recortan a `AAAA-MM-DD` al leer la
bandeja. Se comprueba con `pruebas/correos.mjs`.

### El tablón, desplegado por defecto (10 de septiembre de 2026)

Palabras suyas: *"si no se ve, se olvidará de mirarlo"*. El tablón **se ve siempre**. Solo se
quita cuando hay algo abierto en el panel de la derecha, porque entonces no cabe.

- El botón **Tablón** de la cabecera lo esconde y lo trae de vuelta a mano.
- Si lo esconde y se va a otra pantalla, **al volver vuelve a estar desplegado**.
- Por debajo de 900 píxeles de zona de trabajo se quita.

**Hay DOS paneles a la derecha, no uno.** El de leer un correo pone `con-lector`, y el de ver
un documento pone `con-visor`. En `js/vista.js` la lista se llama `PANELES_DE_LA_DERECHA`:
**si nace un tercer panel, hay que apuntarlo ahí.**

**Esa prueba corre a 1905 píxeles a propósito**, el ancho del monitor del trabajo. A 1600 el
CSS ya quitaba el tablón por su cuenta y la prueba pasaba **con el fallo dentro**.

### El DNI del alumnado, y el aviso de que falta (10 de septiembre de 2026)

Debajo del nombre de un alumno sale ahora **su DNI**. Y cuando no consta y por edad ya debería
tenerlo, sale un **aviso**: *"FALTA EL DNI (16 años, ya debería tenerlo)"*.

- La edad son **14 años**, cuando el DNI es obligatorio en España (Real Decreto 1553/2005,
  artículo 1). Está en una constante, `EDAD_OBLIGATORIA`.
- El DNI sale del propio `RegAlum.csv`, buscando la columna **por su título**: DNI, NIF, NIE,
  documento, identidad o pasaporte. **Se dejan fuera las columnas de los tutores.**
- **Si la descarga no trae ninguna columna de documento, no se enseña nada ni se avisa.**
- Vale igual el DNI que el NIE que un pasaporte.

**Aviso importante:** si no le sale el DNI de nadie, es que su descarga de Séneca no trae esa
columna. Se arregla marcándola al generar el RegAlum, no en la aplicación.

Vive en `js/dni.js`, que **no toca ninguna pantalla**: envuelve `App.pieAlumno` y
`Datos.destacadosAlumno`. Se comprueba con `pruebas/dni.mjs`.

**Un tropiezo del que hay que aprender.** `p.campos` **se queda solo con las columnas que
traen algo**, así que a los alumnos sin DNI se les caía la columna. La solución: envolver
también `Datos.cargar` y **guardarse la cabecera del CSV** (`r.cabecera`).

### Las tres mejoras del buscador de alumnado (10 de septiembre de 2026)

1. **Se busca también por el DNI y por el Nº de identificación escolar.**
2. **El que ya no está sale en naranja.** Lo decide `App.claseDeResultado`, en
   `js/asuntos-nuevo.js`. Los estilos, en `css/tipos-buscador.css`.
3. **El Nº ya no sale dos veces.** Va solo en el botón. Cada fila lleva el número en su
   `data-nie`, y `js/copiar.js` lo saca de ahí.

### El nombre comercial de las empresas (10 de septiembre de 2026)

Las empresas tienen una columna más, **Nombre comercial**, la segunda del cuadro de alta.

- **El buscador encuentra al proveedor escribiendo cualquiera de los dos**, y por trozos.
- **Debajo del nombre se lee `Rótulo: Papelería Pintor Palomo · 33385414V`.** Lo pinta
  `App.pieEmpresa`.
- **En el nombre de la carpeta sigue mandando la razón social.**

**Los ficheros viejos siguen valiendo.** `js/datos.js` lee las columnas **por su título**
(`porTitulo`), con el sitio de antes como reserva. El fichero se reescribe con la cabecera
nueva la primera vez que se da de alta o se cambia una empresa.

### Cambiar los datos de un tercero (10 de septiembre de 2026)

En la ficha de **Personas y empresas** sale el botón **Cambiar los datos**. Abre el mismo
cuadro del alta, relleno con lo que hay, y guarda encima.

- **Solo para los dados de alta a mano** (`p.deSeneca !== true`).
- Si se cambia el nombre, **las carpetas de sus asuntos de antes conservan el nombre viejo**,
  y se avisa.

El cuadro es uno solo para el alta y para el cambio: `App.cuadroDeTercero`, en
`js/asuntos-nuevo.js`. Escribe `Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, y se
comprueba con `pruebas/empresas.mjs`.

### "Año académico" pasa a ser "Texto adicional" (10 de septiembre de 2026)

En el cuadro de nombrar un documento ese campo se llama ahora **Texto adicional**, nace vacío y
**no depende de ningún otro campo**. Al releer el nombre de un fichero se recoge **entero** lo
que haya después del tipo, **solo si el tipo se ha reconocido**.

Ojo: el campo sigue llamándose `curso` por dentro, y en la ficha del asunto el dato del asunto
sigue rotulado "Año académico" —ese es otro campo, el del propio asunto—.

---

### Las guías del procedimiento

Cada tipo de asunto puede llevar una lista de pasos, con título y explicación con negrita,
viñetas y enlaces. Van en el orden del trámite. Se guardan en `_GESTOR/guias.json`.

Dentro de un asunto abierto los pasos salen con casilla. Lo marcado se guarda en la ficha del
asunto (`pasosHechos`), y lo elegido en `pasosElegidos`: lo ve todo el que abra la aplicación.

**Se escriben desde dos sitios**: en **Ajustes**, y en la **ficha de un asunto abierto**, en
el bloque "Guía del procedimiento". El botón lo pone `js/ficha-asunto.js`, pero **quien guarda
es `js/guias-enganche.js`**, a través de `window.GuiasDelCentro.escribir(tipo)`. **El fichero
se relee justo antes de abrir el cuadro**, por si el compañero ha escrito otra.

#### Un paso hecho se pliega (10 de septiembre de 2026)

Al marcar un paso, su explicación se esconde y queda solo el título tachado en verde. El enlace
**ver** de la esquina lo vuelve a abrir.

#### Preguntas con opciones (10 de septiembre de 2026)

**Un paso puede ser una PREGUNTA.** Se marca con una casilla al escribir la guía y entonces se
le ponen opciones. Cada opción tiene su nombre y **sus propios pasos**. Al elegir una, aparecen
**solo** los pasos de esa opción. La cuenta de arriba **suma solo los pasos de la rama elegida**.

Decisiones de diseño, para no rehacerlas:

- **Una bifurcación por paso.** Las opciones no llevan opciones dentro.
- **Las dos ramas se pintan desde el principio y solo se enseña la elegida.**
- **Los identificadores viajan en el `data-id` del recuadro**, no por su posición.
- **Ojo con los selectores al leer el cuadro de escribir la guía**: pedir solo los hijos
  directos (`:scope >`).
- Quién se entera de que se ha elegido una opción es un solo hueco, `Guias.cuandoSeElige(fn)`.

Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.

---

### La pantalla se mide a sí misma (10 de septiembre de 2026)

`css/vista.css` pone `container-type: inline-size` en `.contenido`, y las reglas miran el
ancho que le queda de verdad al contenido, no el de la ventana. Bajo 1000 las tres tarjetas
sueltan la frase que las explica; bajo 900 se quita el tablón y la cabecera baja de línea;
bajo 620 todo a una columna.

El tope de 1180 píxeles de `css/estilos.css` se anula en `css/vista.css`. Conservan tope las
dos pantallas que se leen seguidas: Nuevo asunto (940) y Ajustes (1040).

Con esto van los **filtros plegados**, también en `js/vista.js`: estado, plazo y orden se van a
un panel que abre el botón **Filtros**. Se recuerda si se dejó abierto (`gestor-filtros`).

### El tablón de notas rápidas

Columna a la derecha de los asuntos abiertos, para lo que llega y todavía no es un asunto.
Color, autor, fecha y opcionalmente "para el día X". Botones: Hecha, Cambiar, A asunto y
Borrar. Se guardan en `_GESTOR/tablon.json`.

**Notas "Solo para mí"** (9 de septiembre de 2026). La nota marcada sale únicamente en el
tablón de quien la escribió. **No es un secreto**: el fichero sigue en la carpeta compartida.

### Los ficheros de datos, sin trabajo manual (9 de septiembre de 2026)

Los CSV de Séneca van en `_GESTOR/datos`.

- **Los que aparecen un piso más arriba se recogen solos.** Vive en `js/rescate-datos.js`.
  El traslado usa `Carpetas.moverFichero`: copia, comprueba el tamaño y solo entonces borra.
- **Botón "Traer ficheros de Séneca".** El de alumnado se guarda **siempre como
  `RegAlum.csv`**; los de personal **conservan su nombre**. Vive en `js/traer-datos.js`.

### De un correo a un asunto (9 de septiembre de 2026)

En Gmail se le pone a un correo la etiqueta `GESTOR`. Un script de Apps Script lo recoge cada
5 minutos y deja su ficha, el hilo en PDF y sus adjuntos en la carpeta `GESTOR-BANDEJA` de
Drive. La aplicación lee esa carpeta y enseña los correos arriba, con el tercero, el tipo y la
fecha ya propuestos. Si el correo es **la respuesta de un asunto que ya existe** se ofrece
guardarlo dentro. Y si estaba **archivado**, se ofrece **reabrirlo**.

**"Leer el correo"** abre el PDF del hilo en el panel de la derecha. **Gmail no se deja meter
dentro de otra página.** **Cada uno tiene su bandeja.**

**El detalle entero está en el documento `Correos-a-asuntos.md` del proyecto de Claude.** El
script vive en `apps-script/gestor-correos.gs`, pero **Apps Script no se despliega desde aquí**.

### El correo y la mensajería de Séneca (9 de septiembre de 2026)

Dos botones en la ficha del asunto: **Correo** y **Mensaje Séneca**. La aplicación **no envía
nada**: prepara los campos y los deja listos. Vive en `js/correo.js`. Al copiar el texto o
abrir la ventana de redactar se apunta sola una nota (**una sola vez por cuadro**).

**Solo Séneca:** **no hay campo Para**, y hay **un solo botón que se va cambiando**:
"1. Copiar el asunto" → "2. Ahora, copiar el texto" → "Copiado. Pégalo y envía".

---

## 6. Cómo trabajamos el código  ← LÉELO ANTES DE TOCAR NADA

**El repositorio de GitHub es la versión buena.** Repositorio privado
`fmargon780/gestor-asuntos-ies`, rama `main`.

1. Tú escribes el código y lo subes al repositorio.
2. Vercel publica solo, en la misma dirección.

Dirección buena: **https://gestor-de-asuntos.vercel.app** — proyecto de Vercel
`gestor-de-asuntos`, equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`.

**Un solo proyecto de Vercel. No crear más.** Ver la sección 0.

**Nunca me pidas que edite líneas sueltas. Fichero entero, siempre.**

### Publicar: comprobarlo siempre, no darlo por hecho  ← IMPORTANTE

**Subir al repositorio no garantiza que Vercel publique.** Después de subir algo hay que
comprobar qué se está sirviendo:

    curl -s "https://gestor-de-asuntos.vercel.app/js/nucleo.js?v=<algo distinto cada vez>"
    y mirar la línea App.VERSION

El `?v=` es imprescindible: sin él se puede recibir una copia guardada.

Lo aprendido el 10-sep-2026, en un día con veinte publicaciones:

- **Comprobar la versión no basta: hay que comprobar cada fichero que se ha cambiado.** Un
  `curl` con `grep` de un nombre de función nuevo en cada fichero tocado es la comprobación.
- **Cada commit es una publicación, y van en cola.** Con la cuenta gratuita cuatro o cinco
  commits seguidos tardan **quince o veinte minutos**, y mientras tanto la web sirve una mezcla.
  **Conviene agrupar los ficheros en los menos commits posibles** y comprobar al final.
- **Una publicación de Vercel es del árbol entero.** Cuando la cola se atasca, **un commit
  trivial nuevo publica todo lo que hubiera pendiente**.
- **`curl -sI`** devuelve `x-vercel-cache` y `last-modified`. Si ese `last-modified` no se
  mueve en quince minutos, está atascado: entonces se fuerza. **Forzar más de dos veces no
  arregla nada.**
- **El panel de Vercel solo lo puede mirar él**, y hay que decirle exactamente qué mirar.

**Comprobar que está publicado no es comprobar que funciona.** La comprobación de verdad es la
prueba en navegador de `pruebas/`.

**El conector de Vercel no sirve para esto:** da 403 y 404.

**`vercel.json`** manda `Cache-Control: public, max-age=0, must-revalidate` para todo.

### Ficheros del repositorio

En el orden en que los carga `index.html`. **Ese orden importa**: un módulo que envuelve algo
de `App` va después del fichero que lo define.

| Fichero | Qué hace |
|---|---|
| `index.html` | La página |
| `vercel.json` | Que el navegador no se quede con copias viejas |
| `css/estilos.css` | El aspecto general. Los demás `css/` van con su módulo del mismo nombre |
| `css/vista.css` | El ancho de la pantalla, los filtros plegados y las tarjetas por tipo |
| `css/guias.css` | La guía: pasos, plegado, preguntas y opciones |
| `css/tipos-buscador.css` | Las listas de resultados, y la marca naranja del que ya no está |
| `css/copiar-nie.css` | Los estilos de `js/copiar.js` (nombre viejo del módulo) |
| `js/util.js` | Utilidades comunes, y la comparación de nombres parecidos |
| `js/almacen.js` | Guarda los ajustes en el navegador |
| `js/carpetas.js` | Habla con el selector de carpetas del navegador. Lee y escribe los JSON |
| `js/copias.js` | Copia de seguridad diaria de los ficheros de `_GESTOR`, y detección de fichero roto |
| `js/conflictos.js` | Las copias en conflicto que deja Dropbox: fusión sola o aviso para elegir |
| `js/fichas-huerfanas.js` | Fichas de `asuntos.json` cuya carpeta ya no está: enlazar o borrar |
| `js/nombres.js` | Monta los nombres de carpetas y documentos |
| `js/plazos.js` | La fecha límite de los asuntos |
| `js/guias.js` | Pintar y escribir una guía, con sus preguntas y opciones |
| `js/datos.js` | Lee los CSV; el nombre comercial y las columnas leídas por su título |
| `js/documentos.js` | Nombra los documentos, con el texto adicional y los tipos sin duplicados |
| `js/usabilidad.js` | Volver, Cancelar, etiquetas de filtros, vista compacta y Escape |
| `js/nucleo.js` | El estado, el arranque y el cambio de pantalla |
| `js/version.js` | `App.VERSION`, la fecha y hora de la última publicación |
| `js/asuntos-lista.js` | Asuntos abiertos: las tres tarjetas, las tarjetas por tipo y la lista |
| `js/asuntos-editar.js` | Editar un asunto abierto: renombra la carpeta y mueve su ficha |
| `js/documentos-sueltos.js` | Los papeles sin asunto, **cerrar y reabrir**, y la vigilancia de la carpeta |
| `js/asuntos-nuevo.js` | Crear un asunto, el cuadro de datos de un tercero y los pies |
| `js/archivo-personas.js` | Personas y empresas, el ARCHIVO, y **cambiar los datos de un tercero** |
| `js/ajustes.js` | La pantalla de Ajustes: tipos, estados y tipos de documento |
| `js/puente.js` | El enganche de los módulos que se añaden por fuera (`window.Gestor`) |
| `js/avisos.js` | El aviso de lo que vence |
| `js/frescura.js` | El aviso de que el RegAlum.csv está viejo, y sus épocas |
| `js/recurrentes.js` | Los asuntos que se repiten cada mes, trimestre o curso |
| `js/guias-enganche.js` | Las guías dentro de la app, y `window.GuiasDelCentro` |
| `js/notas.js` | Las notas de cada asunto, con su enlace y su botón |
| `js/ficha-asunto.js` | La pantalla de un asunto: guía, notas, documentos y contacto |
| `js/duplicados.js` | ¿Esto no lo hicimos ya? Asuntos iguales del mismo tercero |
| `js/visor.js` | El panel de la derecha para ver un documento (`con-visor`) |
| `js/tipos-buscador.js` | Buscar el tipo de asunto por letras, y los más usados arriba |
| `js/via-contacto.js` | Los teléfonos y correos del tercero, como botones |
| `js/tablon.js` | El tablón de notas rápidas, con las notas "Solo para mí" |
| `js/copiar.js` | Los botones de copiar: el Nº escolar y el nombre del documento |
| `js/correo.js` | El correo y el mensaje de Séneca, con su rastro |
| `js/salir.js` | El botón de Salir del pie de la barra |
| `js/rescate-datos.js` | Recoge los CSV que se hayan quedado un piso más arriba |
| `js/traer-datos.js` | El botón de traer los CSV de Séneca desde donde estén |
| `js/lector.js` | El panel de la derecha para leer, con su borde para estirarlo |
| `js/bandeja-correos.js` | La bandeja de correos y lo que deja un correo dentro del asunto |
| `js/barra.js` | La barra plegable y el botón grande de Nuevo asunto |
| `js/vista.js` | Los filtros plegados y cuándo se ve el tablón |
| `js/dni.js` | El DNI del alumnado, el aviso de que falta y la búsqueda por DNI |
| `js/inicio.js` | La última línea: `App.arrancar()` |
| `package.json` | Las dependencias de las pruebas (`playwright`, `jsdom`) y `npm test` |
| `pruebas/ejecutar.mjs` | Levanta el servidor local y ejecuta todas las pruebas de esta carpeta |
| `.github/workflows/pruebas.yml` | Ejecuta `npm test` en cada subida y cada pull request a `main` |
| `pruebas/logica.mjs` | Pruebas de la lógica, sin navegador |
| `pruebas/copias.mjs` | Prueba de las copias de seguridad y del fichero roto |
| `pruebas/conflictos.mjs` | Prueba de las copias en conflicto de Dropbox |
| `pruebas/huerfanas.mjs` | Prueba de las fichas sin carpeta |
| `pruebas/nombres-app.mjs` | Falla si dos ficheros definen la misma función de `App` |
| `pruebas/navegador.mjs` | Prueba de la aplicación entera |
| `pruebas/tipos.mjs` | Prueba de las tarjetas por tipo |
| `pruebas/correos.mjs` | Prueba de lo que deja un correo dentro de un asunto |
| `pruebas/tablon.mjs` | Prueba de cuándo se ve el tablón (a 1905 píxeles) |
| `pruebas/dni.mjs` | Prueba del DNI, del aviso y de las tres mejoras del buscador |
| `pruebas/empresas.mjs` | Prueba del nombre comercial y de cambiar los datos de un tercero |
| `pruebas/guias.mjs` | Prueba de escribir la guía desde la ficha, y del plegado |
| `pruebas/opciones.mjs` | Prueba de las preguntas con opciones, con el caso de la factura |
| `apps-script/gestor-correos.gs` | El script de Gmail. No se ejecuta desde la web |
| `docs/CONTEXTO.md` | Este documento |
| `docs/PLAN-ROBUSTEZ-2026-09.md` | El plan de robustez de septiembre de 2026 |
| `README.md` | — |

### Lo que la aplicación guarda en `_GESTOR`

Dentro de la carpeta de asuntos abiertos, y por tanto compartido:

| Fichero | Qué es |
|---|---|
| `tipos.json` | Tipos de asunto y su categoría |
| `tipos-documento.json` | Tipos de documento |
| `estados.json` | Estados de tramitación, en el orden del trámite |
| `asuntos.json` | Ficha de cada asunto: quién lo abrió, estado, vía, notas, cierre, pasos, fecha límite |
| `guias.json` | Los pasos de cada tipo de asunto, con sus preguntas y opciones |
| `recurrentes.json` | Los asuntos que se repiten y cuándo tocan |
| `frescura.json` | Cada cuántos días avisar de que el RegAlum.csv está viejo |
| `tablon.json` | Las notas rápidas del tablón, con su marca de privada |
| `datos/*.csv` | Alumnado (Séneca), personal, empresas y otros |
| `copias/*.json` | Copias de seguridad de los ocho ficheros de arriba, una por día, 30 como mucho de cada uno |

**Los CSV van en `datos`, no en `_GESTOR`.** `js/rescate-datos.js` los baja solos al entrar.

Cada nota de `asuntos.json` es `{ texto, quien, cuando }`, y las de correo llevan además
`correo`, `enlace` y `enlaceTexto`. La ficha de un asunto guarda también `pasosHechos` y
`pasosElegidos`.

**Todo fichero compartido se relee justo antes de escribirlo.** Son dos ordenadores sobre la
misma carpeta: sin releer, el último en guardar borra lo del otro. Hoy lo hacen `asuntos.json`,
`guias.json` y `tablon.json`; el plan de robustez lo extiende a todos.

**Copias de seguridad y fichero roto** (11-sep-2026, bloque 1 del plan de robustez).
`Carpetas.leerJson` ya no confunde "no existe" con "no se puede leer": si el fichero existe pero
el JSON está roto, lanza un error `FicheroRoto` en vez de devolver `null`. Antes se trataba igual
que si no existiera, y el siguiente guardado lo escribía encima: se perdía todo.

- `js/copias.js` guarda, antes de escribir cualquiera de los ocho ficheros compartidos
  (`asuntos.json`, `guias.json`, `tipos.json`, `estados.json`, `tipos-documento.json`,
  `tablon.json`, `recurrentes.json`, `frescura.json`), una copia de cómo estaba justo antes,
  en `_GESTOR/copias/<nombre>-AAMMDD.json`. Una copia por fichero y día; se conservan las
  últimas 30 de cada uno.
- Todo lo que escribe uno de esos ocho ficheros llama a `Copias.guardar` en vez de a
  `Carpetas.guardarJson` directamente.
- Al pulsar Entrar se comprueban los ocho ficheros (`Copias.comprobarTodos`). Si alguno está
  roto, **no se entra**: sale un aviso en rojo con un botón para restaurar la última copia de
  cada uno. El fichero roto se aparta como `<nombre>-roto-AAMMDD-HHMM.json` y no se borra nunca.
- En Ajustes, el bloque **Copias de seguridad** enseña cuántas copias hay de cada fichero y deja
  restaurar cualquiera a mano, por si hiciera falta sin que nada esté roto.
- Se comprueba con `pruebas/copias.mjs`.

**Copias en conflicto de Dropbox, y releer siempre** (11-sep-2026, bloque 2 del plan de
robustez). Si los dos ordenadores guardan casi a la vez, Dropbox no pisa nada: deja aparte un
fichero como `asuntos (copia en conflicto de PC2 2026-09-11).json`. Antes nadie lo miraba, y el
cambio del otro se perdía en la práctica.

- `js/conflictos.js` busca esos ficheros al entrar y cada cinco minutos.
- `asuntos.json` y `tablon.json` se fusionan solos, porque los dos ordenadores escriben ahí
  todo el rato: se unen los asuntos (o las notas del tablón) por su clave, y dentro de cada uno
  se unen las notas, los pasos hechos y los pasos elegidos, sin repetir nada.
- Los demás (`tipos.json`, `estados.json`, `tipos-documento.json`, `guias.json`,
  `recurrentes.json`, `frescura.json`) cambian mucho menos y no se fusionan solos: salen en el
  bloque **Conflictos de Dropbox** de Ajustes, con dos botones para elegir con cuál de los dos
  ordenadores quedarse. El que no se elige no se pierde: los dos se guardan en
  `_GESTOR/copias` antes de decidir.
- **Releer antes de escribir**, en todos los ficheros compartidos que faltaban: `recurrentes.js`
  y los tres que mantiene `App` (`tipos.json`, `estados.json`, `tipos-documento.json`). Antes de
  guardar se relee el fichero y se suma lo que el otro ordenador haya añadido y nosotros no
  tengamos (`App.fusionarConDisco`). No se detectan sus borrados —si él quita algo y nosotros
  todavía lo tenemos en memoria, volvería a aparecer—, pero eso es raro en estas listas: se
  tocan pocas veces, y casi siempre para añadir. `asuntos.json` y `tablon.json` ya releían del
  todo desde antes (`App.anotar`, `tablon.js`).
- Se comprueba con `pruebas/conflictos.mjs`.

**Pruebas automáticas en cada subida** (11-sep-2026, bloque 3 del plan de robustez).
`package.json` trae `playwright` y `jsdom` como dependencias, y `npm test` (que ejecuta
`pruebas/ejecutar.mjs`) levanta el servidor local y corre **todas** las pruebas de `pruebas/`
una detrás de otra; falla si falla cualquiera. `.github/workflows/pruebas.yml` lo lanza en cada
subida y en cada pull request a `main`, con Ubuntu, Node 20 y Chromium instalado por Playwright.

- Las pruebas de navegador ya no llevan la ruta de Chromium escrita a fuego: leen
  `process.env.CHROMIUM_PATH`, y si no está, Playwright usa el suyo (así funcionan igual en
  local, donde hace falta apuntar al Chromium ya instalado, y en Actions, donde Playwright se
  instala el suyo propio).
- Arregladas las dos comprobaciones de `pruebas/logica.mjs` que daban por hecho que
  "hoy" era el 07-sep-2026 (`U.edadDesde`, `U.yaPaso`): ahora se calculan a partir de la fecha
  real, como ya hacía `dni.mjs`.
- Arreglada `pruebas/navegador.mjs`, desfasada desde varios cambios de interfaz de estos días:
  la barra y los filtros nacen plegados y hay que abrirlos antes de tocarlos; el botón "Cerrar"
  de la tarjeta se llama "Archivar"; el botón "Documentos" ya no está en la tarjeta, está dentro
  de la ficha del asunto ("Gestionar documentos"); cada documento de la lista lleva ahora dos
  botones ("Copiar nombre" y "Poner nombre"); y el "Texto adicional" del nombre de un documento
  ya no se rellena solo con el curso, así que la prueba lo escribe a mano.
- Se añade `README.md` → cómo se ejecutan las pruebas.

**Fichas sin carpeta** (11-sep-2026, bloque 4 del plan de robustez). La ficha de un asunto se
busca por el nombre exacto de la carpeta. Si alguien renombra o mueve una carpeta a mano, por
fuera de la aplicación (desde el explorador de archivos, no desde "Editar"), la ficha se queda
huérfana: sigue en `asuntos.json`, pero no se ve en ningún lado.

- En Ajustes, el bloque **Fichas sin carpeta** (`js/fichas-huerfanas.js`) calcula, al abrirlo,
  qué claves de `asuntos.json` no tienen carpeta ni en abiertos ni en el archivo (si el archivo
  no se ha leído todavía esta sesión, lo lee).
- Cada huérfana se enseña con su estado y un resumen de sus notas, y dos botones: **Enlazar con
  una carpeta** (con las carpetas de abiertos y archivo que no tienen ficha) y **Borrar la
  ficha** (con confirmación; antes se guarda copia, como todo lo que toca `asuntos.json` desde
  el bloque 1).
- Un punto ámbar en el botón de Ajustes de la barra avisa de que hay huérfanas, sin tener que
  entrar a mirar.
- Se comprueba con `pruebas/huerfanas.mjs`.

**Nombres repetidos y código muerto** (11-sep-2026, bloque 5 del plan de robustez).

- `pruebas/nombres-app.mjs`, sin navegador: lee todos los `js/*.js`, busca las líneas
  `App.algo = function` y falla si el mismo nombre se define en dos ficheros. Es justo lo que
  pasó con `App.elegirTipo` el 10-sep-2026 (sección 5, "Las tarjetas por tipo de asunto"): se
  perdió sin ningún error, y esta prueba lo habría avisado. Entra en `npm test`.
- Quitado el botón "Guía n/m" de `js/guias-enganche.js` (`botonDeTarjeta`, `abrirGuiaDe`):
  existía, pero `js/ficha-asunto.js` lo poda de la tarjeta desde el 10-sep-2026
  (`BOTONES_DE_LA_TARJETA`) porque los pasos de la guía, con sus casillas, se ven y se marcan
  dentro de la ficha del asunto. No se ha añadido a la lista blanca: la tarjeta se queda con lo
  justo, a propósito.
- `App.VERSION` sale de `js/nucleo.js` y pasa a `js/version.js`, cargado justo después. Así
  cambiar la versión —que se hace en casi todos los commits— no obliga a resubir `nucleo.js`
  entero, que es de los ficheros más grandes.

### Las columnas de cada CSV que mantiene la aplicación

| Fichero | Columnas |
|---|---|
| `solicitantes.csv` | Nombre · Nº Id. Escolar · Fecha de nacimiento · Teléfono de contacto · Correo de contacto |
| `personal.csv` | Nombre · Documento · Puesto · Teléfono · Correo |
| `empresas.csv` | Razón social · **Nombre comercial** · NIF · Contacto · Teléfono · Correo |
| `otros.csv` | Nombre · Referencia · Teléfono · Correo |

La primera columna es siempre el nombre, y es la clave con la que se busca al cambiar los
datos. **Las demás se leen por su título, no por su sitio.**

### Las carpetas que se señalan en cada ordenador

En el navegador (IndexedDB), con `Almacen`, y no se comparten entre ordenadores:

| Clave | Qué es |
|---|---|
| `abiertos` | La carpeta de asuntos abiertos |
| `archivo` | La carpeta ARCHIVO |
| `usuario` | El nombre de quien entra. **Es lo que distingue a uno de otro** |
| `bandeja` | La carpeta de Drive con los correos recogidos (opcional) |

**Van atadas a la dirección de la web.** Si la dirección cambia, hay que volver a señalarlas.

Aparte, en `localStorage`: `gestor-barra`, `gestor-filtros` y `gestor-lector-ancho`.
**El tablón no se recuerda**: nace desplegado siempre, a propósito.

### Cosas prácticas de la sesión

- **Antes de colgar una función nueva de `App`, comprobar que el nombre no está cogido.**
  Un `grep` por todos los `js/` basta. Pasó con `App.elegirTipo` el 10-sep-2026.
- **Solo hay un cuadro de diálogo.** `U.preguntar` usa siempre el mismo `#capa`: hay que
  cerrar el primero antes de abrir otro.
- **La aplicación entera se puede probar en local, y es lo único que caza los fallos de
  verdad.** `python3 -m http.server 8123` y las pruebas de `pruebas/`, que traen su disco de
  mentira. En Ajustes los bloques son `<details>` cerrados; hay que abrirlos antes de escribir.
  Para el portapapeles, dar `permissions: ['clipboard-read','clipboard-write']`.
- **`pruebas/logica.mjs` tiene dos comprobaciones que fallan desde el 8-sep-2026**: dan por
  hecho que hoy es 07/09/2026. Hay que hacerlas relativas a hoy, como ya hace `dni.mjs`.
- **Una prueba de pantalla ancha, a la anchura donde el fallo se ve.** Y siempre: comprobar que
  la prueba **falla** sin el arreglo, antes de darla por buena.
- Para un módulo suelto sale más barato `jsdom` cargando el `index.html` de verdad, con dobles
  de App, Carpetas, Datos, Almacen, Gestor y Notas. **Pero jsdom solo carga el fichero que se
  prueba**, así que no ve los choques de nombres ni el orden de carga. En jsdom un
  `DOMContentLoaded` no llega a dispararse nunca. El doble de un fichero del disco tiene que
  traer su `getFile()`.
- **Para lo que se ve, una foto.** Captura con Playwright con el CSS de verdad.
- Un módulo nuevo puede crearse su propio bloque en Ajustes, su propia columna, su propio botón
  en la barra o su propio panel. Así el `index.html` solo necesita la línea del `<script>`.
  Para meter un botón en un panel que se repinta entero vale un `MutationObserver`.
- **Envolver una función que ya existe es la mejor manera de añadir algo a muchas pantallas a
  la vez.** Hay 17 envolturas así. La condición es cargarse **después** del fichero que define
  lo que se envuelve. **Pero no siempre compensa**: cuando lo que hay que cambiar está dentro de
  una función privada, sale mejor tocar ese fichero.
- **Ojo con lo que se lee de la ficha de una persona.** `p.campos` solo trae las columnas que
  vienen con algo. Para saber si una columna **existe** hay que mirar la cabecera del CSV.
- **Ojo con los MutationObserver sobre la clase de un elemento que uno mismo cambia.**
- **Ojo con el orden de los `<script>` de `index.html`.** `ficha-asunto.js` poda la tarjeta con
  su lista blanca, así que un módulo que quiera poner un botón ahí tiene que cargarse después.
  `lector.js` va antes que `bandeja-correos.js`. `dni.js` va casi el último; `inicio.js`, el último.

### Descartado, y no proponer otra vez

- **Publicar con el conector de Vercel sobre un proyecto ya existente.** Da 403.
- **Crear un proyecto de Vercel más "por si acaso".** Un repositorio, un proyecto, una dirección.
- **Abrir la carpeta del asunto en el explorador de archivos del ordenador.** Una página web no
  tiene permiso.
- **Opciones dentro de opciones en la guía.** Una bifurcación por paso.
- **Una hoja de Google Sheets como interfaz.**
- **Enlazar un correo de Gmail con `#all/<identificador del hilo>`.** Se enlaza por el
  `Message-ID`: `#search/rfc822msgid:<id>`.
- **Meter Gmail dentro de la aplicación, en un marco.** Google no lo permite.
- **Esconder el tablón para dejar sitio.** Rechazado por él el 10-sep-2026.
- **Sacar el DNI de la columna del tutor.**
- **Poner el nombre comercial en el nombre de la carpeta de un asunto de empresa.**
- **Reescribir la arquitectura de módulos y envolturas.** Funciona y el ritmo va a bajar; se
  protege con una prueba de nombres repetidos (plan de robustez, bloque 5).

---

## 7. Qué falta por hacer

**Primero, el plan de robustez** (`docs/PLAN-ROBUSTEZ-2026-09.md`, del análisis del
11-sep-2026): copias de seguridad y fichero roto, copias en conflicto de Dropbox, pruebas
automáticas en cada subida, fichas sin carpeta, nombres repetidos y documentación.

Después:

1. **Avisar al compañero de la dirección nueva** (`gestor-de-asuntos.vercel.app`) y de que
   tendrá que volver a señalar las dos carpetas y escribir su nombre.
2. Coordinar con mi compañero la **lista de tipos de asunto**. Está aceptado empezar sin ella.
3. Coordinar con él también la **lista de estados**.
4. **Poner en marcha el script de Gmail** en la cuenta `g.educaand.es`, y señalar la carpeta
   `GESTOR-BANDEJA` en Ajustes. **Pendiente además volver a pegar el script**.
5. Ver con el uso si la bandeja **acierta con el tipo**. Si falla mucho, palabras clave por tipo.
6. **Plantillas de correo y de mensaje por tipo de asunto**, con huecos que se rellenan solos.
   Acordado hacerlo **después**, cuando el uso diga qué correos se repiten.
7. Comprobar, con Séneca delante, si desde el perfil de administrativo la pantalla de
   Comunicaciones es la misma, y si el asunto admite el largo que le estamos dando.
8. Pendiente de decidir: si el aviso de fichero viejo debe vigilar también el `RelPerCen`.
9. **Cuando tengan una cuenta de correo común**, replantear la bandeja: una sola compartida.
10. Descartado por ahora: un filtro de Gmail que etiquete **todo** el correo entrante.
11. La firma del correo lleva su nombre y "IES Fuente Lucena" escritos a pelo en
    `js/correo.js`. Sacarlos a Ajustes con las plantillas del punto 6.
12. Ver con el uso si el panel de la derecha se queda corto para leer: hoy el 46%.
13. Ver con el uso si las tarjetas por tipo se quedan cortas: hoy son solo del tipo.
14. Mirar si el tablón debería ensancharse: hoy son 320 píxeles fijos.
15. **Arreglar `pruebas/navegador.mjs`** — en el plan de robustez, bloque 3.
16. **Arreglar las dos comprobaciones de `pruebas/logica.mjs`** — plan de robustez, bloque 3.
17. Las notas viejas de correo se quedan como están: son el rastro.
18. Sacar `App.VERSION` a `js/version.js` — plan de robustez, bloque 5.
19. Si el DNI no sale de nadie, **marcar la columna del documento al generar el RegAlum**.
20. Ver con el uso si el aviso de "falta el DNI" conviene también en la tarjeta del asunto.
21. **El botón "Guía n/m" de la tarjeta no llega a verse** — plan de robustez, bloque 5.
22. Ver con el uso si el botón "Cambiar los datos" hace falta también en el buscador de Nuevo
    asunto.
23. Ver con el uso si a las preguntas de la guía les hace falta algo más.
24. **Cuando el uso lo pida** (análisis del 11-sep-2026): búsqueda dentro de las notas, cuentas
    por tipo para la memoria de fin de curso, qué hacer con los asuntos vivos al cambiar de
    curso, y pasar el repositorio y Vercel a una cuenta del centro para el relevo.
