# Historia — el diario

Esto casi nunca se lee: existe para consultar por qué se hizo algo como se hizo. Entradas
nuevas arriba, de lo más nuevo a lo más viejo.

---

## 12-sep-2026 — Reparto del contexto en tres documentos

`docs/CONTEXTO.md` había crecido hasta 1291 líneas: leerlo entero, en cada conversación y en
cada sesión de Claude Code, se había convertido en el mayor gasto de cuota del proyecto.
`docs/COLA.md` tenía el mismo problema con las notas de las filas HECHAS.

Se repartió en tres documentos:

- `docs/CONTEXTO-CORTO.md` (nuevo, máximo 160 líneas): para **decidir**, se lee siempre.
- `docs/CONTEXTO.md` (reescrito): para **programar**, solo lo que es verdad hoy, sin fechas ni
  relatos.
- `docs/HISTORIA.md` (este documento, nuevo): el diario completo, con fechas, para consultar el
  porqué.

También se podó `docs/COLA.md`: las notas de las filas HECHAS quedan en una sola línea cada
una, con el detalle largo trasladado aquí (ver más abajo, "Notas largas de `COLA.md` antes de
la poda").

Instrucción: `docs/REPARTO-CONTEXTO.md`. No se tocó código ni se ejecutaron pruebas.

A partir de ahora, cada instrucción de la cola debe anotar aquí lo que merezca recordarse, con
su fecha, en vez de dejarlo crecer dentro de `CONTEXTO.md`.

---

## Diario heredado (todo lo anterior al 12-sep-2026)

Lo que sigue es el contenido íntegro de `docs/CONTEXTO.md` tal como estaba antes del reparto de
hoy, sin cambiar una palabra, conservado en su orden original (el documento crecía añadiendo lo
nuevo debajo, así que dentro de este bloque va de lo más viejo a lo más nuevo). La versión
resumida y sin fechas de todo esto vive ahora en `docs/CONTEXTO.md`; lo que sigue siendo cierto
hoy, en `docs/CONTEXTO-CORTO.md`.

> # Proyecto: Gestor de Asuntos / Expedientes — IES Fuente Lucena
>
> Documento de contexto. Léelo entero antes de proponer nada.
> Última actualización: 11 de septiembre de 2026 (plan de robustez de
> `docs/PLAN-ROBUSTEZ-2026-09.md` hecho entero: copias de seguridad, conflictos de Dropbox,
> pruebas automáticas en GitHub Actions, fichas sin carpeta y nombres repetidos. Resumen para
> Francisco en `docs/CAMBIOS-2026-09.md`. Después, el mismo día: "Registrar un documento en un
> paso", "Terceros relacionados con un asunto", "Que no se dupliquen los asuntos", "Ajustes
> ágiles: encontrar y crear tipos sin scroll" y "La papelera: borrar sin miedo" y "Los duplicados,
> a su propia pantalla", sección 5).
>
> **Este documento vive en dos sitios**: en el proyecto de Claude (`Contexto.md`) y aquí, en
> `docs/CONTEXTO.md` del repositorio. Se cambia en el mismo commit en que cambia el código.
>
> ---
>
> ## 0. LO PRIMERO: la dirección buena cambió el 10-sep-2026
>
>     https://gestor-de-asuntos.vercel.app
>
> **La antigua, `asuntos-ies.vercel.app`, ya no existe.** El proyecto de Vercel que la servía se
> borró ese día. Si en algún sitio de este documento o de una conversación vieja aparece
> `asuntos-ies`, está desfasado.
>
> Por qué cambió: había **cuatro proyectos de Vercel colgados del mismo repositorio**
> (`asuntos-ies`, `gestor-de-asuntos`, `gestor-asuntos` y `gestor-asuntos-ies`). Cada subida al
> repositorio disparaba cuatro publicaciones a la vez. Ese día `asuntos-ies` se quedó atrás: su
> última publicación fue el commit `c220440` de las 10:32, y los cinco commits siguientes se
> publicaron en `gestor-de-asuntos` pero **en `asuntos-ies` no**, sin ningún error y sin ningún
> aviso.
>
> Se quedó el proyecto **`gestor-de-asuntos`**, que era el que estaba publicando bien, y se
> borraron los otros tres. **Ahora hay un solo proyecto de Vercel. Que siga siendo así.**
>
> **Efecto secundario que hay que saber:** las dos carpetas señaladas y el nombre de usuario se
> guardan en el navegador **atados a la dirección**. Al cambiar de dirección, la aplicación
> arranca de cero y el botón Entrar sale apagado. **No es un fallo**: hay que volver a señalar
> las dos carpetas y escribir el nombre, una vez en cada ordenador. Le pasó a él nada más
> cambiar, y a su compañero le pasará igual.
>
> ---
>
> ## 1. Quién soy y cómo quiero trabajar
>
> Francisco, auxiliar administrativo del IES Fuente Lucena (Alhaurín el Grande, Málaga).
> No soy programador. Yo propongo, pruebo y digo si el resultado se ajusta a lo que buscaba.
> El diseño y la comprobación del código son tuyos.
>
> Cómo quiero que me escribas:
>
> - Pocas frases. Si escribes mucho, me pierdo.
> - Una idea por frase. Sin jerga y sin dar por sabido lo anterior.
> - Una sola pregunta o decisión por mensaje. Espera mi respuesta antes de seguir.
> - Si hay que elegir, dame las opciones numeradas y marca la recomendada. Contesto con el número.
> - No me pidas permiso para cambiar código: aplícalo.
> - Verifica tú tu propio trabajo. Solo pídeme comprobar lo que solo yo puedo ver.
> - Cuando me guíes por una interfaz, ve paso a paso y dime dónde está cada botón.
>
> **Nada de tareas manuales mías.** Si algo se puede hacer desde la aplicación, se hace desde
> la aplicación. Copiar ficheros de una carpeta a otra a mano, o abrir un CSV para tocarlo, es
> justo lo que no quiero. **Cada vez que se añade un dato nuevo, hay que preguntarse cómo lo
> pone en los que ya estaban dados de alta**: si la respuesta es "editando el fichero a mano",
> falta media función. Pasó con el nombre comercial el 10-sep-2026.
>
> **Y donde se usa una cosa, se cambia.** Si tramitando un asunto se ve que falta un paso en la
> guía, la guía se escribe ahí, sin salir a Ajustes. Misma idea.
>
> Mi ordenador es un **Chromebook Plus**. Trabajo en el navegador, no en terminal.
> En el trabajo uso un monitor bastante más ancho que el del Chromebook.
>
> **Ya no trabajo solo con esto: mi compañero administrativo también lo está usando**
> (9-sep-2026). Todo lo que se guarda en `_GESTOR` lo ven los dos.
>
> ---
>
> ## 2. Qué es este proyecto, y qué NO es
>
> Este proyecto es **el gestor de asuntos del centro**: una aplicación web para crear,
> nombrar y archivar las carpetas de cada gestión administrativa.
>
> **No es el proyecto de la base de datos de alumnado.** Ese es otro, con su propio
> repositorio (`fmargon780/bd-alumnado-ies`), su propio contexto y su propio cuaderno de
> Google Sheets. Si aparece aquí una duda sobre informes de tutores, PIL, repeticiones o
> censo NEAE, es del otro proyecto y hay que llevarla allí.
>
> **Lo único que comparten los dos** es el fichero `RegAlum.csv` de Séneca, que aquí se usa
> solo para consultar datos de contacto del alumnado y de sus tutores legales.
>
> ---
>
> ## 3. El problema que resuelve
>
> Por cada gestión administrativa creo una carpeta con nombre estructurado.
>
> - Mientras el asunto está abierto, la carpeta vive en una carpeta de **asuntos abiertos**.
> - Al cerrarlo, la muevo al **ARCHIVO**.
> - Si se reabre, vuelve a abiertos.
>
> Estructura del ARCHIVO: la raíz `ARCHIVO`, y dentro `ALUMNADO`, `EMPRESAS`, `PERSONAL` y
> `OTROS`. Dentro de cada una, una carpeta por tercero. Dentro de cada tercero, las carpetas
> de sus asuntos.
>
> Las carpetas viven en el **Dropbox del centro**, sincronizado en mi ordenador.
>
> ---
>
> ## 4. Las reglas de nombres ← ES LO IMPORTANTE DEL PROYECTO
>
> ### Carpeta de asunto
>
>     AAMMDD TIPO [AÑO ACADÉMICO] [texto libre] Tercero
>
> - `AAMMDD` = fecha de inicio del asunto.
> - `TIPO` = el tipo de asunto en mayúsculas: MATRICULA, COMPRA, SANCION...
> - El año académico, si procede.
> - A veces un texto libre.
> - **El tercero va siempre al final.**
>
> ### Cómo se escribe el tercero
>
> | Categoría | Formato |
> |---|---|
> | Alumnado | `Apellido1 Apellido2, Nombre` + número de identificación escolar |
> | Personal | `Apellido1 Apellido2, Nombre` + los **4 últimos caracteres** del documento, con la letra: `12345678Z` → `678Z` |
> | Empresas | **Razón social** + NIF |
>
> En las empresas manda **la razón social, no el nombre comercial**: es la que viene en las
> facturas y la que hay que poder cruzar con la contabilidad. El rótulo del negocio se guarda
> aparte y sirve para buscar (sección 5).
>
> ### Documento dentro de la carpeta
>
>     AAMMDD [REGISTRO] TIPO [TEXTO ADICIONAL].ext
>
> - `AAMMDD` es la fecha **del propio documento** (la que trae impresa la factura), no la
>   del día en que se archiva.
> - `TIPO` = FACTURA, CERTIFICADO, MATRICULA, SOLICITUD...
> - **El último hueco es texto libre** (10-sep-2026). Antes se llamaba "Año académico" y se
>   rellenaba solo con el curso; ver la sección 5.
>
> ### Lo que entra por correo
>
> El hilo del correo en PDF: `AAMMDD CORREO.pdf`, con la fecha del último mensaje.
>
> Los adjuntos: `AAMMDD ADJUNTO <el nombre que traían>.ext` (10-sep-2026, decidido por él).
> Gmail los manda como venían —`1000082963.jpg`, `LITNAC2026050413001031751487.pdf`— y esos
> nombres no dicen nada y se mezclaban con los papeles del expediente. El nombre de origen se
> limpia y se recorta a 40 caracteres. Si el adjunto merece un nombre de verdad, se le pone
> después desde "Gestionar documentos".
>
> ### El número de registro de Séneca
>
> Formato `26EM1234`:
>
> - `26` = el año. Se coge de la fecha del día en que se incluye el documento, y se puede cambiar.
> - `E` = entrada · `S` = salida.
> - `M` = serie manual · `A` = serie automática.
> - `1234` = los cuatro dígitos del asiento.
>
> Hacen falta las cuatro piezas porque Séneca lleva dos series y el número se repite cada año.
>
> ### El grupo en el nombre de la carpeta
>
> Hay un interruptor para añadir el grupo del alumno. **Cuidado con Bachillerato:** en la ESO
> el grupo se abrevia `1ºA`; en Bachillerato lleva la etapa, `1ºBachA`, para que no se
> confunda con el `1ºA` de la ESO.
>
> ### Los campos del tipo, en el nombre (11-sep-2026)
>
> El hueco de texto libre se concreta así:
>
>     AAMMDD TIPO [AÑO ACADÉMICO] [GRUPO] [campos del tipo, en el orden de Ajustes] [descripción corta] Tercero
>
> - Solo entran los campos configurados en Ajustes con **"Añadir al nombre"** marcado y con
>   valor. Uno vacío no deja hueco ni doble espacio.
> - Si el tipo trae configurada la columna de la unidad o el campo calculado Curso, el
>   interruptor viejo de "Añadir el grupo" se esconde solo: si no, el grupo saldría dos veces.
> - Ver la sección 5, "Los campos de cada tipo de asunto".
>
> ### Lo que NO va en el nombre
>
> El estado del asunto y la vía de comunicación **no** entran en el nombre de la carpeta.
> Cambian mientras se tramita, y renombrar carpetas en un Dropbox sincronizado cada vez que
> algo avanza sería pedir problemas. Van en `_GESTOR/asuntos.json`, que está en la misma
> carpeta compartida y lo lee cualquiera que abra la aplicación.
>
> ### Comunicaciones
>
> Guardo también copia en PDF de los hilos de correo o de Passen. El asunto del mensaje es
> el nombre de la carpeta del asunto.
>
> ---
>
> ## 5. Cómo funciona la aplicación
>
> Es una **web publicada en Vercel** que trabaja sobre la carpeta de Dropbox **de mi propio
> ordenador**, con el selector de carpetas del navegador (Chrome o Edge).
>
> - Sin cuenta de Dropbox, sin servidor y sin base de datos aparte.
> - Los datos no salen del ordenador.
>
> **Por qué es así:** no tengo la contraseña de la cuenta común de Dropbox del centro, y no
> sé si me la darían. Acabo de llegar y apenas me conocen. **El diseño no puede depender de
> esa contraseña.**
>
> Decisiones de diseño ya aprobadas:
>
> - Primero se elige la **categoría** (ALUMNADO, PERSONAL, EMPRESAS, OTROS), y después el tipo.
> - Los **tipos de asunto** solo se crean en Ajustes, nunca sobre la marcha. Los de DOCUMENTO
>   sí se crean al vuelo, desde el propio cuadro.
> - Se puede ver el archivo completo de un tercero.
> - La ficha del alumnado enseña arriba la edad actual, el DNI y los datos de contacto de los
>   tutores legales.
> - Además de arrastrar un documento a la carpeta, se puede elegir desde la app en la carpeta
>   donde esté: se guarda una copia ya con el nombre montado, y el original se queda donde estaba.
> - **Estado del asunto** (septiembre de 2026). Dice por dónde va la tramitación. La lista la
>   pone el centro en Ajustes, en el orden del trámite, no alfabético. Se guarda en
>   `_GESTOR/estados.json`. De partida: PENDIENTE, EN TRÁMITE, ENVIADO A FIRMA, FIRMADO,
>   A LA ESPERA DEL TERCERO, RESUELTO. La casilla "Depende de otros" decide en cuál de las tres
>   tarjetas de arriba sale el asunto.
> - **Vía de comunicación preferente** (septiembre de 2026). Es del asunto, no del tercero:
>   lo que ha pedido para esa gestión concreta. Teléfono, correo, iPasen o en persona.
>   `js/via-contacto.js` ofrece como botones los teléfonos o correos que ya están en el CSV del
>   tercero, para no escribirlos a mano.
> - **Fecha límite** (`js/plazos.js`). Opcional, va en la ficha de `asuntos.json`, nunca en el
>   nombre: cambia mientras se tramita, y renombrar la carpeta cada vez sería pedir problemas.
>   Los días se cuentan **naturales**, de calendario, que es lo que trae el papel del trámite; si
>   en un caso hace falta contar días hábiles, se cambia la fecha a mano. Un plazo vencido, el de
>   hoy o el de mañana salen en rojo o ámbar en la tarjeta del asunto; el resto, en gris. Los
>   tipos de asunto pueden llevar unos días de plazo por defecto (en Ajustes), para que la fecha
>   límite de un asunto nuevo salga puesta sola.
> - **Asuntos recurrentes** (`js/recurrentes.js`, `_GESTOR/recurrentes.json`). Gestiones que
>   vuelven cada mes, cada tres meses o una vez al año: la misma factura del mismo proveedor, el
>   mismo parte. Se apuntan una vez, con el tipo, el tercero, cada cuánto y el día (y el mes, si
>   es anual), y la aplicación calcula sola cuándo toca la siguiente a partir de la última vez que
>   se creó. **Las carpetas no se crean solas**: sale un aviso arriba de "Asuntos abiertos" y
>   hasta que no se pulsa el botón no se crea nada, para no llenar el Dropbox de carpetas vacías
>   que nadie ha pedido.
> - **¿Esto no lo hicimos ya?** (`js/duplicados.js`). Antes de abrir un asunto se mira si ese
>   tercero ya tuvo otro igual. Se mira barato: solo su carpeta del ARCHIVO y los abiertos.
> - **Buscador de tipos** (`js/tipos-buscador.js`). Con muchos tipos, tres letras filtran la
>   parrilla y arriba salen los más usados.
> - **Las dos listas de la pantalla de asuntos abiertos se distinguen a simple vista**
>   (septiembre de 2026). Documentos sueltos: hoja y franja arena. Asuntos: carpeta y franja azul.
> - **Editar un asunto ya creado** (septiembre de 2026, `js/asuntos-editar.js`). Botón Editar en
>   cada asunto abierto. Cambiar datos es cambiar el nombre de la carpeta, y la ficha viaja con
>   ella. **En el ARCHIVO no hay botón Editar**: el nombre de una carpeta archivada es el rastro
>   de aquel día.
> - **Copiar el Nº de identificación escolar** (9 de septiembre de 2026). Botón `Nº 1139877` en
>   la tarjeta de cada asunto de alumnado, en la ficha del asunto, en las listas de resultados y
>   en la ficha del alumno. **Solo en la categoría ALUMNADO**, para no confundirlo con los
>   cuatro caracteres del documento del personal ni con el NIF de una empresa.
> - **Copiar el nombre de un documento, sin la extensión** (9 de septiembre de 2026). En la
>   ficha del asunto y en el cuadro de gestionar documentos.
> - **Crear el tipo de documento desde el propio cuadro** (9 de septiembre de 2026). La última
>   opción del desplegable abre un campo para crearlo ahí mismo, sin salir a Ajustes.
> - **La guardia contra duplicados, en las cinco puertas** (9 de septiembre de 2026; quinta
>   puerta, 11-sep-2026). El cuadro de documentos, las tres listas de Ajustes —**tipos de
>   asunto, estados y tipos de documento**— y, desde el 11-sep-2026, **los campos propios**
>   (`js/ajustes.js`, sección 5, "Los campos de cada tipo de asunto"). Cada nombre se reduce a
>   su hueso: sin mayúsculas, sin tildes, sin espacios, guiones ni puntos, y sin la S del plural.
>   - Si ya está escrito de otra manera, **no se crea** y se dice cuál es el que hay.
>   - Si solo se parece —una errata a una o dos letras, o un nombre que contiene a otro—, se
>     avisa, se enseñan los parecidos y se deja decidir.
>   Vive en `js/util.js` (`U.parecidos` y `U.dejaCrear`). Si hace falta en otro sitio, se llama
>   desde allí: no se copia.
> - **Aviso de que el RegAlum.csv está viejo** (9 de septiembre de 2026). Al abrir se mira la
>   fecha del propio fichero en `_GESTOR/datos`. Ámbar al pasarse, rojo al doblar el plazo, y
>   rojo también si no hay ningún RegAlum.csv.
>   **Cuántos días es "viejo" depende de la época del año.** Las épocas van en día-mes, sin año,
>   y pueden dar la vuelta al año. Se cambian en Ajustes y se guardan en `_GESTOR/frescura.json`.
>   De partida: comienzo de curso (01-09 a 31-10) cada 7 días; matrícula y verano (01-06 a
>   31-08) cada 15; escolarización (01-03 a 30-04) cada 15; el resto del año, cada 30.
> - **La versión, a la vista** (9 de septiembre de 2026). En la pantalla de entrada y, ya
>   dentro, abajo a la izquierda. Nació de un susto: no veía el tablón porque el navegador tenía
>   la página vieja. **Se cambia en `App.VERSION` cada vez que se publica algo que él tenga que
>   ver.** Desde el 10-sep-2026 la versión lleva también la hora, en formato
>   `10-sep-2026 · 13:55`, hora de España. Es además el termómetro para saber si Vercel ha
>   publicado de verdad: ver más abajo.
> - **Botón de Salir** (9 de septiembre de 2026). Al pie de la barra de la izquierda, debajo de
>   Ajustes, separado por una línea. Salir aquí es **cerrar la sesión**: se recarga la página y
>   se vuelve a la pantalla de entrada, con las dos carpetas ya señaladas. Pide confirmación.
>   Vive en `js/salir.js`.
> - **La barra de la izquierda se pliega, y nace plegada** (10 de septiembre de 2026). Un botón
>   de tres rayas arriba del todo la abre y la cierra. Al elegir una pantalla se vuelve a plegar
>   sola. Lo que él elija se recuerda (`gestor-barra`), pero **de partida está plegada**.
>   Vive en `js/barra.js`.
> - **Botón grande de "+ Nuevo asunto"** (10 de septiembre de 2026). En la cabecera de la
>   pantalla de asuntos abiertos. Lo pone el mismo `js/barra.js`.
> - **El panel de lectura de la derecha** (10 de septiembre de 2026). La aplicación se queda a
>   la izquierda y lo que se lee sale a la derecha. Se cierra con la equis o con Escape. **El
>   borde izquierdo se arrastra**, y el ancho se recuerda (`gestor-lector-ancho`); con doble
>   clic vuelve al 46%. En pantalla estrecha (menos de 1100 píxeles) se pone a lo ancho.
>   Es un servicio para los demás módulos: `Lector.abrir({ titulo, pie, blob, botones })`.
>   Vive en `js/lector.js`.
> - **Comodidades de pantalla** (`js/usabilidad.js`): botón Volver, Cancelar, etiquetas de lo
>   que se está filtrando, vista compacta y la tecla Escape. No toca datos.
>
> ### La ficha de un asunto
>
> Al pulsar el nombre de un asunto se entra en su ficha, y ahí está todo lo suyo: sus datos, el
> contacto del tercero, la guía de su tipo con las casillas, sus notas, sus documentos y los
> demás asuntos del mismo tercero.
>
> **Por eso la tarjeta de la lista se queda con lo justo**: el desplegable del estado, "Copiar
> nombre" y "Archivar". `js/ficha-asunto.js` quita de la tarjeta cualquier otro botón, con una
> lista blanca (`BOTONES_DE_LA_TARJETA`). **Ojo con esto**: un módulo que añada un botón a la
> tarjeta con `window.Gestor.botonesDeTarjeta` **no se verá** si su texto no está en esa lista.
>
> ### Las tarjetas por tipo de asunto (10 de septiembre de 2026)
>
> Dentro de **En el departamento** y de **A la espera de terceros**, encima de la lista, sale
> una fila de tarjetas pequeñas: una por cada tipo de asunto que haya en ese montón, con
> cuántos son y, en rojo, cuántos están fuera de plazo. La primera tarjeta es **Todos**.
>
> - Al pulsar una, la lista de abajo se queda solo con los asuntos de ese tipo.
> - Al volver a pulsarla, o al pulsar Todos, vuelven a salir todos.
> - Al cambiar de montón se empieza siempre viendo todos los tipos.
> - **Con un solo tipo las tarjetas no salen.**
> - Las cuentas se hacen sobre lo que ya han dejado pasar el buscador y los filtros.
> - Si el tipo elegido desaparece del montón se vuelve solo a Todos.
>
> El orden es por cantidad, de más a menos, y a igualdad por orden alfabético. Vive en
> `js/asuntos-lista.js`, y sus estilos en `css/vista.css`.
>
> **Un tropiezo del que hay que aprender.** La primera versión llamó a su función
> `App.elegirTipo`. Ese nombre ya existía en `js/asuntos-nuevo.js`, que se carga **después**. La
> función de las tarjetas se perdía sin dar ningún error. Ahora se llama `App.filtrarPorTipo`.
> **Regla: antes de colgar una función nueva de `App`, comprobar que ese nombre no está ya
> cogido en otro fichero.** Las pruebas de jsdom no lo cazan: hace falta el navegador con la
> aplicación entera.
>
> ### Lo que deja un correo dentro del asunto (10 de septiembre de 2026)
>
> Palabras suyas al ver un asunto que había recibido correos: *"es un poco caótico y con textos
> complejos en las notas"*. De ahí salieron cuatro cosas, y las cuatro están hechas.
>
> - **La nota de un correo es de dos líneas.** *"Correo de Mercedes Pacheco · 09/09/2026"* y
>   debajo el asunto del correo. **El enlace ya no se escribe en el texto**: la nota lo guarda
>   aparte y lo enseña como un botón **Abrir en Gmail**.
>   `Notas.anadir(a, texto, extra)`, con `enlace`, `enlaceTexto` y `correo`.
> - **Un correo no entra dos veces** (`Notas.yaTieneCorreo`).
> - **Los adjuntos entran con nombre de la casa**: `AAMMDD ADJUNTO …`.
> - **Los documentos de la ficha van en dos grupos**: "Del expediente" y "Llegados por correo".
>   Los rótulos solo salen cuando hay de las dos clases. Lo de correo se reconoce por el nombre:
>   CORREO, HILO o ADJUNTO.
>
> Un detalle de fontanería: las fechas que trae el correo se recortan a `AAAA-MM-DD` al leer la
> bandeja. Se comprueba con `pruebas/correos.mjs`.
>
> ### El tablón, desplegado por defecto (10 de septiembre de 2026)
>
> Palabras suyas: *"si no se ve, se olvidará de mirarlo"*. El tablón **se ve siempre**. Solo se
> quita cuando hay algo abierto en el panel de la derecha, porque entonces no cabe.
>
> - El botón **Tablón** de la cabecera lo esconde y lo trae de vuelta a mano.
> - Si lo esconde y se va a otra pantalla, **al volver vuelve a estar desplegado**.
> - Por debajo de 900 píxeles de zona de trabajo se quita.
>
> **Hay DOS paneles a la derecha, no uno.** El de leer un correo pone `con-lector`, y el de ver
> un documento pone `con-visor`. En `js/vista.js` la lista se llama `PANELES_DE_LA_DERECHA`:
> **si nace un tercer panel, hay que apuntarlo ahí.**
>
> **Esa prueba corre a 1905 píxeles a propósito**, el ancho del monitor del trabajo. A 1600 el
> CSS ya quitaba el tablón por su cuenta y la prueba pasaba **con el fallo dentro**.
>
> ### El DNI del alumnado, y el aviso de que falta (10 de septiembre de 2026)
>
> Debajo del nombre de un alumno sale ahora **su DNI**. Y cuando no consta y por edad ya debería
> tenerlo, sale un **aviso**: *"FALTA EL DNI (16 años, ya debería tenerlo)"*.
>
> - La edad son **14 años**, cuando el DNI es obligatorio en España (Real Decreto 1553/2005,
>   artículo 1). Está en una constante, `EDAD_OBLIGATORIA`.
> - El DNI sale del propio `RegAlum.csv`, buscando la columna **por su título**: DNI, NIF, NIE,
>   documento, identidad o pasaporte. **Se dejan fuera las columnas de los tutores.**
> - **Si la descarga no trae ninguna columna de documento, no se enseña nada ni se avisa.**
> - Vale igual el DNI que el NIE que un pasaporte.
>
> **Aviso importante:** si no le sale el DNI de nadie, es que su descarga de Séneca no trae esa
> columna. Se arregla marcándola al generar el RegAlum, no en la aplicación.
>
> Vive en `js/dni.js`, que **no toca ninguna pantalla**: envuelve `App.pieAlumno` y
> `Datos.destacadosAlumno`. Se comprueba con `pruebas/dni.mjs`.
>
> **Un tropiezo del que hay que aprender.** `p.campos` **se queda solo con las columnas que
> traen algo**, así que a los alumnos sin DNI se les caía la columna. La solución: envolver
> también `Datos.cargar` y **guardarse la cabecera del CSV** (`r.cabecera`).
>
> ### Las tres mejoras del buscador de alumnado (10 de septiembre de 2026)
>
> 1. **Se busca también por el DNI y por el Nº de identificación escolar.**
> 2. **El que ya no está sale en naranja.** Lo decide `App.claseDeResultado`, en
>    `js/asuntos-nuevo.js`. Los estilos, en `css/tipos-buscador.css`.
> 3. **El Nº ya no sale dos veces.** Va solo en el botón. Cada fila lleva el número en su
>    `data-nie`, y `js/copiar.js` lo saca de ahí.
>
> ### El nombre comercial de las empresas (10 de septiembre de 2026)
>
> Las empresas tienen una columna más, **Nombre comercial**, la segunda del cuadro de alta.
>
> - **El buscador encuentra al proveedor escribiendo cualquiera de los dos**, y por trozos.
> - **Debajo del nombre se lee `Rótulo: Papelería Pintor Palomo · 33385414V`.** Lo pinta
>   `App.pieEmpresa`.
> - **En el nombre de la carpeta sigue mandando la razón social.**
>
> **Los ficheros viejos siguen valiendo.** `js/datos.js` lee las columnas **por su título**
> (`porTitulo`), con el sitio de antes como reserva. El fichero se reescribe con la cabecera
> nueva la primera vez que se da de alta o se cambia una empresa.
>
> ### Cambiar los datos de un tercero (10 de septiembre de 2026)
>
> En la ficha de **Personas y empresas** sale el botón **Cambiar los datos**. Abre el mismo
> cuadro del alta, relleno con lo que hay, y guarda encima.
>
> - **Solo para los dados de alta a mano** (`p.deSeneca !== true`).
> - Si se cambia el nombre, **las carpetas de sus asuntos de antes conservan el nombre viejo**,
>   y se avisa.
>
> El cuadro es uno solo para el alta y para el cambio: `App.cuadroDeTercero`, en
> `js/asuntos-nuevo.js`. Escribe `Datos.guardarEnLista`. Vive en `js/archivo-personas.js`, y se
> comprueba con `pruebas/empresas.mjs`.
>
> ### "Año académico" pasa a ser "Texto adicional" (10 de septiembre de 2026)
>
> En el cuadro de nombrar un documento ese campo se llama ahora **Texto adicional**, nace vacío y
> **no depende de ningún otro campo**. Al releer el nombre de un fichero se recoge **entero** lo
> que haya después del tipo, **solo si el tipo se ha reconocido**.
>
> Ojo: el campo sigue llamándose `curso` por dentro, y en la ficha del asunto el dato del asunto
> sigue rotulado "Año académico" —ese es otro campo, el del propio asunto—.
>
> ---
>
> ### Las guías del procedimiento
>
> Cada tipo de asunto puede llevar una lista de pasos, con título y explicación con negrita,
> viñetas y enlaces. Van en el orden del trámite. Se guardan en `_GESTOR/guias.json`.
>
> Dentro de un asunto abierto los pasos salen con casilla. Lo marcado se guarda en la ficha del
> asunto (`pasosHechos`), y lo elegido en `pasosElegidos`: lo ve todo el que abra la aplicación.
>
> **Se escriben desde dos sitios**: en **Ajustes**, y en la **ficha de un asunto abierto**, en
> el bloque "Guía del procedimiento". El botón lo pone `js/ficha-asunto.js`, pero **quien guarda
> es `js/guias-enganche.js`**, a través de `window.GuiasDelCentro.escribir(tipo)`. **El fichero
> se relee justo antes de abrir el cuadro**, por si el compañero ha escrito otra.
>
> #### Un paso hecho se pliega (10 de septiembre de 2026)
>
> Al marcar un paso, su explicación se esconde y queda solo el título tachado en verde. El enlace
> **ver** de la esquina lo vuelve a abrir.
>
> #### Preguntas con opciones (10 de septiembre de 2026)
>
> **Un paso puede ser una PREGUNTA.** Se marca con una casilla al escribir la guía y entonces se
> le ponen opciones. Cada opción tiene su nombre y **sus propios pasos**. Al elegir una, aparecen
> **solo** los pasos de esa opción. La cuenta de arriba **suma solo los pasos de la rama elegida**.
>
> Decisiones de diseño, para no rehacerlas:
>
> - **Una bifurcación por paso.** Las opciones no llevan opciones dentro.
> - **Las dos ramas se pintan desde el principio y solo se enseña la elegida.**
> - **Los identificadores viajan en el `data-id` del recuadro**, no por su posición.
> - **Ojo con los selectores al leer el cuadro de escribir la guía**: pedir solo los hijos
>   directos (`:scope >`).
> - Quién se entera de que se ha elegido una opción es un solo hueco, `Guias.cuandoSeElige(fn)`.
>
> Se comprueba con `pruebas/guias.mjs` y `pruebas/opciones.mjs`.
>
> ---
>
> ### La pantalla se mide a sí misma (10 de septiembre de 2026)
>
> `css/vista.css` pone `container-type: inline-size` en `.contenido`, y las reglas miran el
> ancho que le queda de verdad al contenido, no el de la ventana. Bajo 1000 las tres tarjetas
> sueltan la frase que las explica; bajo 900 se quita el tablón y la cabecera baja de línea;
> bajo 620 todo a una columna.
>
> El tope de 1180 píxeles de `css/estilos.css` se anula en `css/vista.css`. Conservan tope las
> dos pantallas que se leen seguidas: Nuevo asunto (940) y Ajustes (1600 desde el 11-sep-2026,
> antes 1040; ver la sección 5, "Ajustes ágiles").
>
> Con esto van los **filtros plegados**, también en `js/vista.js`: estado, plazo y orden se van a
> un panel que abre el botón **Filtros**. Se recuerda si se dejó abierto (`gestor-filtros`).
>
> ### El tablón de notas rápidas
>
> Columna a la derecha de los asuntos abiertos, para lo que llega y todavía no es un asunto.
> Color, autor, fecha y opcionalmente "para el día X". Botones: Hecha, Cambiar, A asunto y
> Borrar. Se guardan en `_GESTOR/tablon.json`.
>
> **Notas "Solo para mí"** (9 de septiembre de 2026). La nota marcada sale únicamente en el
> tablón de quien la escribió. **No es un secreto**: el fichero sigue en la carpeta compartida.
>
> ### Los ficheros de datos, sin trabajo manual (9 de septiembre de 2026)
>
> Los CSV de Séneca van en `_GESTOR/datos`.
>
> - **Los que aparecen un piso más arriba se recogen solos.** Vive en `js/rescate-datos.js`.
>   El traslado usa `Carpetas.moverFichero`: copia, comprueba el tamaño y solo entonces borra.
> - **Botón "Traer ficheros de Séneca".** El de alumnado se guarda **siempre como
>   `RegAlum.csv`**; los de personal **conservan su nombre**. Vive en `js/traer-datos.js`.
>
> ### De un correo a un asunto (9 de septiembre de 2026)
>
> En Gmail se le pone a un correo la etiqueta `GESTOR`. Un script de Apps Script lo recoge cada
> 5 minutos y deja su ficha, el hilo en PDF y sus adjuntos en la carpeta `GESTOR-BANDEJA` de
> Drive. La aplicación lee esa carpeta y enseña los correos arriba, con el tercero, el tipo y la
> fecha ya propuestos. Si el correo es **la respuesta de un asunto que ya existe** se ofrece
> guardarlo dentro. Y si estaba **archivado**, se ofrece **reabrirlo**.
>
> **"Leer el correo"** abre el PDF del hilo en el panel de la derecha. **Gmail no se deja meter
> dentro de otra página.** **Cada uno tiene su bandeja.**
>
> **El detalle entero está en el documento `Correos-a-asuntos.md` del proyecto de Claude.** El
> script vive en `apps-script/gestor-correos.gs`, pero **Apps Script no se despliega desde aquí**.
>
> ### El correo y la mensajería de Séneca (9 de septiembre de 2026)
>
> Dos botones en la ficha del asunto: **Correo** y **Mensaje Séneca**. La aplicación **no envía
> nada**: prepara los campos y los deja listos. Vive en `js/correo.js`. Al copiar el texto o
> abrir la ventana de redactar se apunta sola una nota (**una sola vez por cuadro**).
>
> **Solo Séneca:** **no hay campo Para**, y hay **un solo botón que se va cambiando**:
> "1. Copiar el asunto" → "2. Ahora, copiar el texto" → "Copiado. Pégalo y envía".
>
> ### Registrar un documento en un paso (11-sep-2026)
>
> Dar registro de entrada o salida a un documento era nombrarlo dos veces: se nombraba sin
> registro, había que salir de la ficha, añadir la copia sellada como si fuera otro documento y
> volver a escribir la fecha, el tipo y el texto adicional, ahora con el número de registro. Los
> dos ficheros hay que conservarlos (el original y el sellado), así que lo único que sobraba era
> nombrar dos veces y salir de la ficha.
>
> - **Botón Registrar**, en cada documento que todavía no lleve las cuatro piezas del registro en
>   su nombre: en la lista de "Gestionar documentos" y en la lista de la ficha del asunto. Al
>   pulsarlo se elige la copia sellada donde esté, y luego solo se pide **el número de registro**:
>   el resto del nombre (fecha, tipo, texto adicional) se lee del documento original, con
>   `Documentos.leerNombre`, igual que hace el cuadro de nombrar documentos. El nombre se monta
>   con `Nombres.montarDocumento`, la copia se guarda con `Carpetas.copiarFicheroEn`, el original
>   se queda como está, y se apunta una nota en el asunto: "Registrado 26EM1234 · <nombre del
>   documento>". Si ya hay un fichero con ese nombre, avisa y no lo sobrescribe.
> - **Casilla "Pendiente de registro"**, en el cuadro de nombrar un documento. Solo se enseña
>   cuando el documento no lleva registro. Lo marcado se guarda en la ficha del asunto, en
>   `_GESTOR/asuntos.json`, en una lista `pendientesRegistro` con los nombres de fichero. Un
>   documento pendiente lleva una marca ámbar "Sin registrar" al lado de su nombre, y su botón
>   Registrar sale destacado. Al registrarlo se quita solo de la lista; al renombrarlo desde
>   "Gestionar documentos", el nombre de la lista se actualiza con él.
> - **La tarjeta del asunto no lleva nada de esto**: se queda con lo justo, a propósito (ver
>   `BOTONES_DE_LA_TARJETA` más arriba).
> - Vive en `js/registro.js`, un módulo aparte porque lo usan dos sitios que no comparten cuadro:
>   "Gestionar documentos" (`js/documentos.js`) ya tiene su propio `U.preguntar` abierto, así que
>   ahí se pinta DENTRO de ese mismo cuadro (`Registro.pintarEnContenedor`); la ficha del asunto
>   (`js/ficha-asunto.js`) no tiene ningún cuadro abierto, así que ahí se abre uno nuevo
>   (`Registro.abrirCuadro`). **Solo hay un cuadro de diálogo en toda la aplicación**: abrir un
>   segundo `U.preguntar` mientras el primero sigue esperando le roba los botones al de fuera, y
>   el de fuera se queda colgado para siempre.
> - `Registro.proponer({ anio, tipo, serie, numero })` rellena las cuatro piezas del cuadro ya
>   pintado; `tipo` es `E`/`S` (entrada o salida) y `serie` es `M`/`A` (manual o automática).
> - **Leer el número solo, del sello de Séneca dentro del PDF** (11-sep-2026, más tarde el mismo
>   día). Comprobado con un PDF real: el sello va como texto en la primera página, aunque el
>   documento sea un escaneado (imagen). El texto trae, tal cual:
>
>       2026/29700692/M000000000368ENTRADAFecha: 10/09/2026 13:03:02
>
>   `AÑO / CÓDIGO DEL CENTRO / SERIE + número con ceros por delante`, pegado a `ENTRADA` o
>   `SALIDA`, pegado a `Fecha: dd/mm/aaaa hh:mm:ss`. Ese ejemplo es el registro `26EM0368`.
>   - `js/registro-lector.js` lee el texto de la primera página con **pdf.js** (Mozilla), y lo
>     busca con `(\d{4})\s*\/\s*\d+\s*\/\s*([MA])\s*0*(\d+)\s*(ENTRADA|SALIDA)`, tolerante a
>     espacios y saltos de línea. Si el número tiene más de cuatro cifras, se deja entero (no se
>     recorta) y se avisa; si no, se rellena con ceros por delante hasta cuatro.
>   - Al elegir la copia sellada, si se encuentra el sello, el cuadro de Registrar sale ya
>     relleno, con una línea verde "Leído del sello de Séneca", y **el foco va directo al botón
>     de aceptar**: solo hay que confirmar. Si no se encuentra —no es un PDF, o no trae el
>     sello—, el cuadro sale vacío como siempre, con el foco en los cuatro dígitos.
>   - **Ojo con el foco**: `js/usabilidad.js` vigila cuándo se abre el cuadro (`#capa`) y pone el
>     cursor solo en su primer campo, con un `MutationObserver`. Ese observador se dispara
>     después del código que abre el cuadro, así que pisaría cualquier `.focus()` puesto ahí
>     mismo. El foco de Registrar se pone con `setTimeout(fn, 0)`, para que se aplique después.
>   - La fecha del sello no cambia la fecha `AAMMDD` del nombre, que es la del propio documento:
>     se guarda en la nota, `"Registrado 26EM0368 el 10/09/2026 · <documento>"`.
>   - **pdf.js va copiado en el repositorio**, en `js/lib/pdf.min.js` y `js/lib/pdf.worker.min.js`
>     (versión 3.11.174, la del `build/` de `pdfjs-dist` en npm — no la de `legacy/`, de sobra
>     para Chrome y Edge). No se carga de ninguna dirección externa, y solo se trae la primera
>     vez que se pulsa Registrar sobre un PDF, no al arrancar la aplicación.
>   - El PDF de muestra con el que se comprobó **no está en el repositorio**: lleva datos
>     personales. La prueba monta un PDF mínimo válido en su propio código, con el texto del
>     sello dentro, para no necesitar ninguno de verdad.
> - Se comprueba con `pruebas/registro.mjs`.
>
> ### Terceros relacionados con un asunto (11-sep-2026)
>
> Un asunto puede afectar a más de una persona o entidad, además de su tercero principal: un
> expediente disciplinario donde hay dos alumnos implicados, una incidencia entre dos empresas.
> Antes de esto no había dónde apuntarlo, y no se podía saber, desde la ficha del otro implicado,
> que ese asunto también le afecta.
>
> - **Bloque "Personas y entidades relacionadas"**, en la ficha del asunto (`js/ficha-asunto.js`),
>   al lado de "Otros asuntos de este tercero". **Solo ahí**: la tarjeta de la lista no lleva nada
>   de esto, a propósito (ver `BOTONES_DE_LA_TARJETA` más arriba).
> - Se guarda en la propia ficha del asunto, en `asuntos.json`: `ficha.relacionados`, una lista de
>   `{ categoria, nombre }`. Los asuntos de antes no tienen ese campo, y no hace falta migrar nada:
>   una ficha sin `relacionados` simplemente no tiene ninguno.
> - **Para elegir o dar de alta el relacionado se reutiliza todo lo que ya existía**: el nombre se
>   monta con `App.textoTercero` (las mismas reglas de la sección 4), el alta de uno nuevo con
>   `App.cuadroDeTercero` y `Datos.anadirALista`, y no se repiten dos veces con nombre parecido
>   gracias a `U.parecidos`/`U.dejaCrear`, igual que los tipos o los estados. El propio buscador de
>   "Nuevo asunto" se ha sacado a una función reutilizable, `App.pintarBuscadorDeTercero`
>   (categoría + buscador + resultados + alta), en `js/asuntos-nuevo.js`, para no repetir esa
>   lógica en el módulo nuevo.
> - **Nunca se copia ningún documento del asunto.** Al archivar, si el asunto tiene relacionados,
>   se pregunta a cuáles de ellos avisar (todos marcados por defecto) y, en la carpeta de cada uno
>   dentro de ARCHIVO (se crea si no existe), se deja una carpeta `(RELACIONADO) <nombre del
>   asunto>` con un único fichero de texto, `DONDE ESTA ESTE ASUNTO.txt`, que dice dónde está el
>   asunto de verdad. Al reabrir el asunto, esa carpeta-nota se borra sola; **si alguien ha metido
>   algo más dentro, no se borra**, y se avisa para revisarla a mano.
> - Esas carpetas-nota viven al mismo nivel que un asunto de verdad (`ARCHIVO / categoría /
>   tercero / carpeta`), así que sin más se confundirían con asuntos archivados: `App.verArchivo`
>   y `Duplicados.delTercero` (usado por "Otros asuntos de este tercero") se envuelven para
>   quitarlas de en medio, por su nombre (`(RELACIONADO) `).
> - La ficha de la persona o empresa (`js/archivo-personas.js`, `App.verFicha`) enseña un bloque
>   "Relacionado con este asunto" cuando aparece como relacionada de alguno, esté el asunto abierto
>   o archivado, mirando directamente `App.E.registro.asuntos` (ya está en memoria).
> - Vive en `js/relacionados.js`, cargado después de `js/duplicados.js` (envuelve
>   `Duplicados.delTercero`) y de `js/archivo-personas.js` (envuelve `App.verFicha` y
>   `App.verArchivo`); no importa que cargue antes o después de `js/ficha-asunto.js`, porque a
>   `window.Relacionados` solo se le llama en tiempo de uso, no al cargar el fichero.
> - Se comprueba con `pruebas/relacionados.mjs`: sin relacionados no cambia nada, alta de dos
>   relacionados y su guardado en `asuntos.json`, el propio tercero no se puede añadir como
>   relacionado, ni el mismo relacionado dos veces (ni con un nombre casi igual), las notas al
>   archivar con su texto y su ruta, la carpeta del relacionado se crea si falta, al reabrir se
>   borran las dos notas pero la lista de relacionados sigue en la ficha, una nota con algo más
>   dentro no se borra y avisa, y la ficha de la persona enseña el asunto relacionado, abierto y
>   archivado.
>
> ### Los campos de cada tipo de asunto (11-sep-2026)
>
> Hasta ahora, lo único que distinguía a dos asuntos del mismo tipo y del mismo tercero era la
> descripción corta, texto libre escrito a mano cada vez. Ahora cada tipo de asunto puede llevar
> sus propios **campos**: datos que ya están en los ficheros (la unidad, la modalidad de
> Bachillerato, el puesto, el NIF...), o que Francisco crea a mano, y que salen solos y ya
> rellenos al crear el asunto.
>
> - **De dónde salen los campos disponibles** (`js/campos.js`, `Campos.catalogoDeCategoria`):
>   - **Del fichero de la categoría**, leyendo su **cabecera** (no `p.campos`, que solo trae las
>     columnas que traen algo — el mismo cuidado del DNI). Para ALUMNADO es la cabecera de verdad
>     del RegAlum.csv; para PERSONAL, EMPRESAS y OTROS, la de su propio CSV. Por eso
>     `Datos.cargarLista` (`js/datos.js`) devuelve ahora también `.cabecera` para esas tres, no
>     solo para ALUMNADO.
>   - **Calculados**: de momento uno, **Curso** (`Campos.calcularCurso`), la unidad sin su última
>     letra y sin el espacio que deja al quitarla (`1ºA`→`1º`, `1ºBachA`→`1ºBach`, `2ºFPB B`→
>     `2ºFPB`). Se aplica sobre la forma **compacta** del grupo (`Nombres.grupoCompacto`), no
>     sobre la columna Unidad tal cual la escribe Séneca: así no queda el hueco de en medio.
>   - **Propios**: los que Francisco crea en Ajustes (texto libre o lista cerrada), y valen para
>     cualquier categoría. Al crear uno pasa por `U.dejaCrear`/`U.parecidos` — la misma guardia
>     contra duplicados de tipos, estados y tipos de documento. **Es la quinta puerta** que usa
>     esa guardia.
> - **Cómo se guarda**, en `_GESTOR/campos.json` (ver la tabla de la sección 6): `propios` (con
>   su clase y sus valores) y `porTipo` (indexado por la misma clave que usa `tipos.json`). Cada
>   entrada de `porTipo` guarda solo `origen`, `columna` o `id`, `obligatorio` y `enNombre` — **no**
>   copia la clase ni los valores de un campo propio: quien tenga que pintarlo (`js/asuntos-nuevo.js`,
>   `js/asuntos-editar.js`) los busca en `propios` con `Campos.propioDe`, así un cambio en la lista
>   de valores se ve en todos los tipos que lo usan, sin migrar nada.
> - **Configurar los campos de un tipo**: en Ajustes, cada tipo lleva un botón **Campos**
>   (`App.abrirCamposDeTipo`), con los ya puestos arriba (con flechas para ordenarlos, y sus dos
>   casillas Obligatorio y Añadir al nombre) y el catálogo abajo, con buscador. Al añadir uno del
>   catálogo nace con las dos casillas **sin marcar**: Francisco decide caso por caso. El cuadro
>   usa `cuadro-ancho`, igual que otros cuadros anchos de la aplicación. Bloque nuevo **Campos
>   propios**, para verlos y borrarlos todos juntos; al borrar uno en uso se avisa y se dice en
>   qué tipos está (`Campos.tiposQueUsanPropio`).
> - **Al crear un asunto** (`js/asuntos-nuevo.js`), tras elegir tipo y tercero sale el bloque
>   **Datos del asunto**, con los campos del tipo ya rellenos (`Campos.valorInicial`). Un dato
>   vacío —la modalidad de un alumno de la ESO— no es un error: el campo sale en blanco y se
>   puede escribir a mano. Obligatorio impide crear el asunto hasta rellenarlo (foco en el que
>   falte). La vista previa del nombre se actualiza al escribir o al marcar/desmarcar.
> - **Al editar** (`js/asuntos-editar.js`), el cuadro trae los mismos campos con lo guardado
>   (`App.pintarCamposEditar`); al aceptar, si cambia algo que va al nombre, la carpeta se
>   renombra igual que hoy. Como el cuadro puede quedarse más alto que la pantalla con estos
>   campos de más, se le añade la clase `cuadro-alto` (scroll por dentro) mientras está abierto.
> - **En la ficha del asunto** (`js/ficha-asunto.js`), los campos con valor salen en el bloque de
>   datos del asunto, uno por línea, entre la descripción y el estado.
> - Un tipo sin campos configurados se comporta exactamente igual que antes de este cambio; los
>   asuntos creados antes se quedan sin campos y no pasa nada.
> - Decisiones de diseño, sin preguntar (11-sep-2026): la clave de un campo es `fichero:<columna>`
>   o `<origen>:<id>` (`Campos.claveDeCampo`); el catálogo de PERSONAL/EMPRESAS/OTROS sale de la
>   cabecera que ya devolvía `Datos.cargarLista`, ampliada para exponerla también en esas tres
>   categorías; Curso se calcula sobre el grupo compacto, no sobre la columna en crudo; las dos
>   casillas de un campo nuevo del catálogo nacen sin marcar; y `porTipo` no migra nada al borrar
>   o cambiar un campo propio, porque nunca copia su clase ni sus valores.
> - Se comprueba con `pruebas/campos.mjs` (ocho escenarios más la edición), con capturas a 1905
>   píxeles del bloque "Datos del asunto" y del cuadro de Campos de Ajustes.
>
> ### Que no se dupliquen los asuntos (11-sep-2026)
>
> Caso real: dos carpetas de TRANSPORTE del mismo alumno, mismo curso académico, que solo se
> diferenciaban en el grupo (uno lo llevaba en el nombre y el otro no) — un aviso ámbar nunca las
> hubiera evitado, porque nunca impide crear nada.
>
> - **Al crear un asunto** (`js/duplicados.js`, el `onclick` de `btn-crear` envuelto), si ya hay un
>   asunto abierto o archivado del mismo tercero, mismo tipo y mismo año académico, se para del
>   todo: cuadro "Este asunto ya existe", con "Abrir el que ya existe" (a la ficha si está abierto,
>   o a su carpeta del ARCHIVO si está archivado) o "Crear otro de todas formas". El grupo y el
>   texto libre **no cuentan**: son justo lo que hizo que dos carpetas parecieran distintas a
>   simple vista. Si a alguno de los dos le falta el año académico, cuenta como coincidencia
>   (`Duplicados.coincideCurso`): más vale preguntar de más que dejar pasar un duplicado de verdad.
>   - Con varios candidatos abiertos, el de partida es el que se abrió más recientemente
>     (`Duplicados.candidatoMasReciente`).
>   - La comprobación nunca debe impedir crear un asunto por su cuenta: si algo falla al mirar, se
>     sigue como si no hubiera nada (todo envuelto en `try/catch`).
> - **Unir dos que ya existen** (`js/unir-asuntos.js`), para los creados antes de esta parada o a
>   mano: cuando dos o más coinciden en tercero, tipo y curso, se puede revisar y unir. Desde el
>   11-sep-2026 esto vive en su propia pantalla, ver "Los duplicados, a su propia pantalla" más
>   abajo. Se elige cuál se queda (de partida, el de nombre más largo); los ficheros del otro se
>   mueven a la carpeta que se queda, las notas se juntan (con una nota de la unión al final), los
>   pasos de la guía se copian del que se queda si no tenía, y la carpeta que se va se borra. Si
>   algún fichero choca de nombre entre las dos carpetas, no se mueve ni se borra nada, y se avisa
>   de cuáles.
> - Vive en `js/duplicados.js` (la parada al crear) y `js/unir-asuntos.js` (unir los que ya
>   existen), cargado justo después de `js/asuntos-lista.js`, que es quien define
>   `App.pintarAbiertos`.
> - Se comprueba con `pruebas/duplicados.mjs`: el caso real de TRANSPORTE para al crear; dos
>   MATRICULA del mismo alumno en cursos distintos NO paran; con varios candidatos, el de partida
>   es el abierto más reciente y "Abrir el que ya existe" lleva a su ficha; con un candidato
>   archivado, lleva a su carpeta del ARCHIVO; Unir fusiona ficheros, notas y guía, y borra la
>   carpeta que sobra; y un choque de nombres entre las dos carpetas no mueve ni borra nada. Los
>   escenarios de la pantalla propia de duplicados están en la sección siguiente.
>
> ### Los duplicados, a su propia pantalla (11-sep-2026)
>
> Antes, cuando dos o más asuntos abiertos coincidían en tercero, tipo y curso, salía una franja
> amarilla "Parecen el mismo asunto" encima de la lista de Asuntos abiertos, con las columnas de
> cada grupo una debajo de otra: con varios grupos a la vez, ocupaba media pantalla antes de llegar
> a ver ningún asunto de verdad.
>
> - **Un aviso de una línea**, junto al botón Actualizar de Asuntos abiertos:
>   `⚠ N posible(s) duplicado(s) — Revisar`. Sin ningún duplicado no se ve nada (`#btn-duplicados`
>   queda oculto).
> - **Pantalla propia "Duplicados"**, a la que solo se llega pulsando ese aviso — no está en la
>   barra de la izquierda —, con su botón Volver. Cada grupo se enseña con sus asuntos en columnas,
>   una al lado de otra: el nombre de la carpeta (enlaza a su ficha), una línea con fecha de
>   apertura / estado / vía / fecha límite, sus documentos (se abren en el visor de la derecha de
>   siempre, `Visor.abrir`) y sus notas (las tres últimas, con "y N más" si hay más), con quién la
>   escribió y cuándo.
> - El botón **Unir** es el mismo de siempre, sin cambios en su lógica.
> - Botón nuevo **"No son el mismo"**: descarta ese grupo concreto, hasta que se diga lo contrario.
>   Se guarda por la firma exacta de los nombres del grupo (ordenados y unidos) en
>   `_GESTOR/no-duplicados.json`. Si más adelante se crea o cambia un asunto que amplía ese grupo,
>   la firma ya no coincide, y el aviso vuelve a salir solo, sin que nadie tenga que hacer nada.
> - Reversible desde Ajustes: bloque nuevo **"Duplicados descartados"**, con un botón "Volver a
>   avisar" en cada entrada.
> - Vive entero en `js/unir-asuntos.js` (estilos en `css/unir-asuntos.css`) y no toca `js/ajustes.js`
>   ni la barra de la izquierda: la pantalla y el bloque de Ajustes los crea el propio módulo
>   (`App.PANTALLAS.push`, y enganchado a Ajustes con `window.Gestor.alRefrescar`, igual que
>   `js/frescura.js` o `js/conflictos.js`).
> - `no-duplicados.json` entra en la lista de ficheros protegidos por copia de seguridad
>   (`js/copias.js`).
> - Se comprueba con `pruebas/duplicados.mjs`: ya no sale ninguna franja en Asuntos abiertos; el
>   aviso no se ve sin duplicados y dice cuántos hay cuando los hay; lleva a la pantalla propia;
>   cada columna enseña sus datos, documentos y solo las tres notas más recientes con "y N más";
>   Unir sigue funcionando igual desde la pantalla nueva; "No son el mismo" guarda el descarte (con
>   quién y cuándo) y el grupo deja de avisar; "Volver a avisar" en Ajustes lo deshace; y si al
>   grupo descartado se le suma un tercer asunto que coincide, la firma cambia y vuelve a avisar
>   solo.
>
> ### Ajustes ágiles: encontrar y crear tipos sin scroll (11-sep-2026)
>
> Sus palabras: *"Aunque me pide que elija a qué tipo de tercero asociar el tipo de asunto, debajo
> me aparecen todos los tipos de asuntos empezando por el alumnado, de modo que tengo que hacer un
> scroll-down casi infinito para ver qué tipos existen y no duplicar."* Y del botón de Ajustes en la
> barra: *"no esté debajo del todo, porque si hay mucho desplegado, me tengo que desplazar mucho
> hacia abajo."*
>
> **A. El bloque "Tipos de asunto" de Ajustes** (`js/ajustes.js`, `css/ajustes.css`):
>
> - **Una sola categoría a la vez.** La lista de `#tabla-tipos` obedece al desplegable
>   `#nueva-categoria`: solo se ve la categoría elegida. Se recuerda en `localStorage`
>   (`gestor-ajustes-categoria`), de partida ALUMNADO. `App.E.categoriaAjustes` es el estado; la
>   cambia `App.cambiarCategoriaAjustes(cat)`, que pone de acuerdo el desplegable y las pestañas.
> - **Cuatro pestañas** (`App.pintarPestanasTipos`), ALUMNADO · PERSONAL · EMPRESAS · OTROS, con la
>   cuenta de cada una. Pulsar una pestaña o cambiar el desplegable hace lo mismo: los dos mandos
>   van siempre de acuerdo. Una categoría sin tipos sale igual, con un 0.
> - **Buscador cruzado** (`#buscar-tipos`), a la derecha de las pestañas. Con dos letras o más,
>   `App.pintarTiposAjustes` deja de mirar la pestaña y enseña las coincidencias de **las cuatro
>   categorías**, cada una con su categoría en una etiqueta (`.marca-categoria`, ya existía para
>   otra cosa). Mientras se busca, las pestañas se apagan (clase `.apagadas`) y arriba sale
>   "Buscando en todas las categorías · N resultados" (`#tipos-buscando-info`). Al vaciar el campo
>   vuelve la categoría marcada. Es justo lo que evita duplicar sin verlo: el tipo aparece aunque
>   esté colgado de otra categoría.
> - **Aviso en vivo al escribir un tipo nuevo** (`#aviso-nuevo-tipo`, `App.pintarAvisoNuevoTipo`,
>   con el `oninput` de `#nuevo-tipo`). Usa la misma guardia de siempre (`U.parecidos` /
>   `U.dejaCrear`, `js/util.js`), no una comparación nueva. Si el nombre ya existe (mismo hueso),
>   línea roja "Ya existe: X, en CATEGORIA", el botón Añadir se apaga, y un enlace "Verlo"
>   (`App.verTipoEnAjustes`) cambia a esa categoría y da un destello de un segundo a su tarjeta.
>   Si solo se parece, línea ámbar con los parecidos: es un aviso, no una prohibición, y el botón
>   sigue encendido. Lo mismo, más sencillo (sin categoría), para los estados (`#aviso-nuevo-estado`)
>   y los tipos de documento (`#aviso-nuevo-tipo-doc`), con `App.pintarAvisoSimple`.
> - **Rejilla de tarjetas, no filas.** `#tabla-tipos`, `#tabla-estados` y `#tabla-tipos-documento`
>   pasan de `.fila-tipo` (una fila de lado a lado) a `.rejilla-tipos` con tarjetas `.tarjeta-tipo`:
>   `display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr))`. Cada tarjeta lleva su
>   contenido y, arriba a la derecha, un botón de tres puntos (`App.botonMenuTarjeta`, genérico) con
>   el menú de esa fila: Campos / Cambiar el nombre / Quitar para los tipos, Cambiar el nombre /
>   Quitar para los estados (que siguen con sus flechas de orden fuera del menú, a la vista: el
>   orden del trámite no se toca, solo cambia el sitio en la rejilla, no la columna) y Quitar para
>   los tipos de documento. Quitar sigue pidiendo confirmación en los tres (antes tipos y tipos de
>   documento no la pedían).
> - **Ajustes aprovecha el ancho**: su tope sube de 1040 a 1600 píxeles (`css/vista.css`,
>   `#pantalla-ajustes`). Nuevo asunto conserva su 940. La cabecera y el cuerpo de los bloques
>   comparten el mismo relleno lateral (`#pantalla-ajustes > .cabecera { padding: 0 16px }`), y los
>   párrafos de explicación no pasan de 90 caracteres de ancho (`max-width: 90ch`).
> - **Igual, en pequeño, para Tipos de documento y Estados del asunto**: misma rejilla, mismo menú
>   de tres puntos, mismo aviso en vivo. Campos propios y Asuntos que se repiten no se han tocado.
>
> **B. Llegar a Ajustes sin bajar la página** (`index.html`, `css/estilos.css`, `css/barra.css`,
> `js/barra.js`):
>
> - **La barra de la izquierda se queda fija** (`position: fixed`, con su propio `overflow-y:auto`
>   por si algún día no cupiera). El contenido se desplaza con un `margin-left` (232px, o 52px con
>   la barra plegada) en vez de dejar que la barra se lleve sitio del flujo. Así su pie —y ahora
>   también Ajustes— se ven sin bajar del todo, aunque la pantalla sea larga.
> - **Ajustes sube a la lista de pestañas**, justo después de "Personas y empresas" y separado por
>   una línea fina (`.separador-lateral`). En `.lateral-pie` se quedan solo el nombre de quien ha
>   entrado y el botón Salir. `js/fichas-huerfanas.js` y `js/recurrentes.js` siguen encontrando el
>   botón por `.pestana[data-pantalla="ajustes"]`, así que no hizo falta tocarlos.
> - **Con la barra plegada, un icono de rueda dentada** (`#btn-barra-ajustes`, junto al de las tres
>   rayas, `js/barra.js`) lleva directo a Ajustes, sin tener que abrir la barra primero. Solo se ve
>   plegada (`css/barra.css`).
>
> **Un tropiezo del que aprender.** La primera versión de la rejilla llamó a la tarjeta de un tipo
> `App.tarjetaDeTipo`; ese nombre ya estaba cogido en `js/asuntos-lista.js` (las tarjetas por tipo
> de la lista de asuntos abiertos). Se detectó con `pruebas/nombres-app.mjs` antes de subir nada, y
> se renombró a `App.tarjetaTipoAjustes`. Sigue valiendo la regla de siempre: comprobar con un
> `grep` antes de colgar una función nueva de `App`.
>
> Se comprueba con `pruebas/ajustes-agil.mjs`, a 1905 píxeles: una categoría a la vez, la pestaña y
> el desplegable de acuerdo en los dos sentidos, el buscador encuentra en otra categoría con su
> etiqueta, el aviso en vivo (igual y parecido) en tipos, veinte tipos de prueba en al menos tres
> columnas, la pestaña Ajustes visible sin más scroll con la página larga, y el icono de la rueda
> dentada con la barra plegada. Hizo falta ajustar dos pasos de `pruebas/navegador.mjs` y
> `pruebas/campos.mjs` que abrían "Cambiar el nombre" o "Campos" con un clic directo sobre
> `.fila-tipo`: ahora pasan primero por el menú de los tres puntos de la tarjeta.
>
> ### La papelera: borrar sin miedo (11-sep-2026)
>
> Hasta ahora no se podía borrar nada desde la aplicación. Desde hoy sí, pero **nada se borra de
> verdad a la primera: se manda a una papelera** compartida, de la que se puede devolver a su
> sitio. Por qué: las carpetas viven en el Dropbox del centro y las usan dos administrativos; un
> borrado de verdad desaparecería también del ordenador del compañero, sin aviso y sin deshacer.
> Encargo completo en `docs/PAPELERA.md`.
>
> - **Dónde hay botón Borrar, y dónde no**: documento dentro de un asunto (ficha del asunto y
>   "Gestionar documentos"), documento suelto, un asunto **abierto** desde su ficha (nunca desde la
>   tarjeta de la lista, ni en el ARCHIVO), tipo de asunto, estado, tipo de documento, campo propio
>   y persona o empresa dada de alta a mano (nunca la que viene de Séneca). El botón se llama
>   siempre **Borrar**, con el aspecto de botón de peligro (`.boton-peligro`, ya existía) y va el
>   último de su fila. Los sitios que ya tenían un "Quitar" (tipos, estados, tipos de documento y
>   campos propios en Ajustes; la nota del tablón) se han cambiado para que pasen por la papelera,
>   en vez de duplicar el botón.
> - **La papelera**: carpeta `_GESTOR/PAPELERA`, y su índice `_GESTOR/papelera.json` (una lista de
>   fichas, la más nueva arriba). Lo que es un fichero o una carpeta se mueve dentro, en su propia
>   subcarpeta `AAMMDD-HHMM <nombre>` (así dos borrados del mismo nombre no chocan), con
>   `Carpetas.trasladar` / `Carpetas.moverFichero`: si la copia no sale completa, no se borra nada.
>   Lo que no es un fichero (un tipo, un estado, una persona, una nota…) no tiene carpeta: su dato
>   se guarda entero en la ficha del índice. `papelera.json` es un fichero compartido más: se relee
>   antes de escribirlo y entra en las copias de seguridad de `js/copias.js` (ver más abajo).
> - **Las comprobaciones antes de borrar**: un tipo de asunto no se borra si hay asuntos (abiertos
>   o en `asuntos.json`) con ese tipo — se dice cuántos —, y si tiene guía escrita se avisa de que
>   se va con él (guardada en la papelera, para poder devolverla junto con el tipo). Un estado no
>   se borra si algún asunto lo tiene puesto. Un campo propio no se borra si está asociado a algún
>   tipo — se dice a cuáles —. Un tipo de documento se borra siempre: los documentos ya nombrados
>   conservan su nombre. Una persona o empresa no se borra si tiene asuntos, abiertos o archivados
>   (se mira con `Duplicados.delTercero`), y solo se puede borrar si se dio de alta a mano.
> - **El cuadro de confirmación**: uno solo, "¿Mandar a la papelera?", con el nombre en negrita y
>   "Se podrá recuperar desde Ajustes › Papelera" en gris. Sin escribir nada para confirmar.
>   Excepción: un asunto abierto con documentos dentro lleva un segundo cuadro, "¿Seguro?", después
>   del primero — nunca los dos a la vez, que solo hay un `#capa`.
> - **El bloque Papelera de Ajustes**, el último de todos: cada línea con qué era, el nombre, de
>   dónde salía, quién y cuándo ("hace N días"), y dos botones, **Devolver a su sitio** y **Borrar
>   del todo** (esta última pide su propia confirmación: "Esto sí lo quita de verdad. Dropbox aún
>   lo guarda 30 días más en su propia papelera."). Si hay algo de más de 30 días, aviso ámbar con
>   un botón para borrarlo todo de golpe. **La papelera no se vacía sola, nunca.**
> - **Devolver a su sitio**: si el asunto de un documento ya no existe, se ofrece llevarlo a "Por
>   clasificar" en vez de a su asunto. Si ya hay algo con ese nombre en el destino, no se pisa
>   nada y se dice qué hay. Al devolver algo, sale de `papelera.json` y su subcarpeta (si tenía) se
>   quita también.
> - **El rastro**: al mandar un documento a la papelera desde un asunto, se apunta sola una nota en
>   ese asunto (`Notas.anadir`); al devolverlo, otra nota. Un asunto entero no tiene dónde
>   apuntarlo: el rastro es la propia ficha de `papelera.json`.
> - Vive en `js/papelera.js` (`window.Papelera`), cargado después de `js/dni.js` y antes de
>   `js/inicio.js`. Los sitios donde no había botón todavía (documento suelto, persona dada de alta
>   a mano) lo llevan por **envoltura** (`App.tarjetaSuelto`, `App.verFicha`), como hace
>   `js/dni.js`; donde el botón va dentro de una función privada (los documentos de un asunto, la
>   ficha misma, la nota del tablón, las listas de Ajustes) se ha tocado el fichero directamente.
> - Se comprueba con `pruebas/papelera.mjs`.
>
> ---
>
> ## 6. Cómo trabajamos el código ← LÉELO ANTES DE TOCAR NADA
>
> **El repositorio de GitHub es la versión buena.** Repositorio privado
> `fmargon780/gestor-asuntos-ies`, rama `main`.
>
> 1. Tú escribes el código y lo subes al repositorio.
> 2. Vercel publica solo, en la misma dirección.
>
> Dirección buena: **https://gestor-de-asuntos.vercel.app** — proyecto de Vercel
> `gestor-de-asuntos`, equipo `team_gnCjBLTS8m8PNTFVUf7ST0uN`.
>
> **Un solo proyecto de Vercel. No crear más.** Ver la sección 0.
>
> **Nunca me pidas que edite líneas sueltas. Fichero entero, siempre.**
>
> ### Publicar: comprobarlo siempre, no darlo por hecho ← IMPORTANTE
>
> **Subir al repositorio no garantiza que Vercel publique.** Después de subir algo hay que
> comprobar qué se está sirviendo:
>
>     curl -s "https://gestor-de-asuntos.vercel.app/js/nucleo.js?v=<algo distinto cada vez>"
>     y mirar la línea App.VERSION
>
> El `?v=` es imprescindible: sin él se puede recibir una copia guardada.
>
> Lo aprendido el 10-sep-2026, en un día con veinte publicaciones:
>
> - **Comprobar la versión no basta: hay que comprobar cada fichero que se ha cambiado.** Un
>   `curl` con `grep` de un nombre de función nuevo en cada fichero tocado es la comprobación.
> - **Cada commit es una publicación, y van en cola.** Con la cuenta gratuita cuatro o cinco
>   commits seguidos tardan **quince o veinte minutos**, y mientras tanto la web sirve una mezcla.
>   **Conviene agrupar los ficheros en los menos commits posibles** y comprobar al final.
> - **Una publicación de Vercel es del árbol entero.** Cuando la cola se atasca, **un commit
>   trivial nuevo publica todo lo que hubiera pendiente**.
> - **`curl -sI`** devuelve `x-vercel-cache` y `last-modified`. Si ese `last-modified` no se
>   mueve en quince minutos, está atascado: entonces se fuerza. **Forzar más de dos veces no
>   arregla nada.**
> - **El panel de Vercel solo lo puede mirar él**, y hay que decirle exactamente qué mirar.
>
> **Comprobar que está publicado no es comprobar que funciona.** La comprobación de verdad es la
> prueba en navegador de `pruebas/`.
>
> **El conector de Vercel no sirve para esto:** da 403 y 404.
>
> **`vercel.json`** manda `Cache-Control: public, max-age=0, must-revalidate` para todo.
>
> [Las tablas de ficheros del repositorio, de lo que guarda `_GESTOR`, de las columnas de cada
> CSV y de las carpetas que se señalan en cada ordenador, y el resto de la sección 6 y de la
> sección 7 ("Qué falta por hacer"), se mantienen ahora, ya sin fechas, dentro del propio
> `docs/CONTEXTO.md`, que es donde se consultan para programar. No se repiten aquí para no
> duplicar dos veces el mismo contenido casi literal.]

---

## Notas largas de `COLA.md` antes de la poda (12-sep-2026)

Al podar `docs/COLA.md` el 12-sep-2026, las notas de las filas 1 a 8 (todas HECHA) se dejaron en
una línea cada una. El texto largo que tenían antes era:

- **1 · `docs/PLAN-ROBUSTEZ-2026-09.md`**: Ya estaba hecho antes de apuntarse aquí (PR #4,
  fusionada 11-sep-2026 03:50): copias de seguridad y fichero roto, conflictos de Dropbox,
  pruebas automáticas en GitHub Actions, fichas sin carpeta, nombres repetidos y documentación.
  Comprobado de nuevo el 11-sep-2026: ficheros y pruebas en el repo, versión publicada
  `11-sep-2026 · 05:33`.
- **2 · `docs/REGISTRO-EN-UN-PASO.md`**: Ya estaba hecho antes de apuntarse aquí (PR #5, fusionada
  11-sep-2026 05:01): botón Registrar sin nombrar dos veces, casilla "Pendiente de registro" y
  lectura sola del sello de Séneca en el PDF. Comprobado de nuevo el 11-sep-2026.
- **3 · `docs/CAMPOS-POR-TIPO.md`**: Terminada 11-sep-2026 · 11:59. Cada tipo de asunto puede
  llevar sus propios campos (de fichero, calculados o propios), configurables en Ajustes con el
  botón "Campos"; salen ya rellenos al crear el asunto, se pueden marcar obligatorios y añadir al
  nombre en el orden elegido, se guardan con la ficha y se enseñan al editar y en la ficha del
  asunto. `pruebas/campos.mjs`, los ocho escenarios del encargo más la edición, todas en verde.
  Versión publicada `11-sep-2026 · 11:37`; con la corrección de la fila 4, la versión real en la
  web es `11-sep-2026 · 12:00`.
- **4 · `docs/TERCEROS-RELACIONADOS.md`**: Terminada 11-sep-2026 · 11:51. Lista de personas o
  entidades relacionadas con un asunto, en el bloque "Personas y entidades relacionadas" de su
  ficha. Al archivar se deja una nota (nunca una copia de documentos) en la carpeta de cada
  relacionado, diciendo dónde está el asunto de verdad; al reabrir se borra sola, salvo que tenga
  algo más dentro. Pruebas en `pruebas/relacionados.mjs`, todas en verde. La instrucción 3 subió a
  la vez una versión completa de index.html, ficha-asunto.js y asuntos-nuevo.js basada en una
  copia anterior a estos cambios, y los borró sin querer; se detectó por el número de versión y se
  fusionaron ambos cambios en un commit aparte. Versión publicada, ya fusionada y comprobada en la
  web: `11-sep-2026 · 12:00`.
- **5 · `docs/NO-DUPLICAR-ASUNTOS.md`**: Terminada 11-sep-2026 · 13:22. Al pulsar "Crear el
  asunto", si ya hay uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico
  (el grupo y el texto libre no cuentan), se para y sale "Este asunto ya existe": abrir el que
  hay, o crear otro de todas formas. Para los que ya existían antes de esto (o se crearon a
  mano), franja "Parecen el mismo asunto" en Asuntos abiertos, con un botón Unir que junta
  ficheros y notas y borra el que sobra. Pruebas en `pruebas/duplicados.mjs`, los seis escenarios
  del encargo, todas en verde; ajustada también `pruebas/campos.mjs`, que creaba a propósito un
  segundo asunto igual el mismo día para otra cosa. Toda la batería en verde salvo los dos
  escenarios de sello de Séneca de `pruebas/registro.mjs`, que en esta sesión no se han podido
  comprobar por no tener aquí `js/lib/pdf.worker.min.js` (no se ha tocado ese fichero); sin
  relación con este cambio. Versión publicada y comprobada en la web: `11-sep-2026 · 13:08`.
- **6 · `docs/AJUSTES-AGIL.md`**: Terminada 11-sep-2026 · 14:58. Ajustes: una sola categoría a la
  vez en "Tipos de asunto", con pestañas ALUMNADO/PERSONAL/EMPRESAS/OTROS de acuerdo con el
  desplegable, buscador que mira en las cuatro categorías a la vez (con su etiqueta de categoría)
  y aviso en vivo al escribir un nombre nuevo (rojo si ya existe, con "Verlo"; ámbar si solo se
  parece), en tipos, estados y tipos de documento. Los tres pasan a una rejilla de tarjetas con
  menú de tres puntos. Ajustes sube su tope a 1600px. La barra de la izquierda se queda fija en
  pantalla, Ajustes sube a la lista de pestañas (separado por una línea) y, con la barra plegada,
  un icono de rueda dentada lleva directo a Ajustes. Pruebas en `pruebas/ajustes-agil.mjs`, los
  nueve escenarios del encargo, todas en verde; ajustados también dos pasos de
  `pruebas/navegador.mjs` y `pruebas/campos.mjs` que abrían "Cambiar el nombre" o "Campos" con un
  clic directo, ahora a través del menú de tres puntos. Batería completa (`npm test`, 21
  ficheros) en verde, `js/lib/pdf.worker.min.js` incluido. Versión publicada `11-sep-2026 ·
  14:58`.
- **7 · `docs/PAPELERA.md`**: Terminada 11-sep-2026 · 16:20. Nada se borra de verdad a la primera:
  se manda a `_GESTOR/PAPELERA`, con su ficha en `_GESTOR/papelera.json`. Botón Borrar (rojo
  suave, siempre el último de su fila) en: documentos de un asunto (ficha y "Gestionar
  documentos"), documentos sueltos, un asunto abierto desde su ficha (nunca desde la tarjeta ni
  en el ARCHIVO), tipos de asunto, estados, tipos de documento, campos propios y personas o
  empresas dadas de alta a mano. Los que ya tenían un "Quitar" (tipos, estados, tipos de
  documento, campos propios en Ajustes; la nota del tablón) ahora pasan por la papelera en vez de
  duplicar el botón, y llevan la comprobación que les faltaba: un tipo o un estado en uso, o un
  campo propio asociado a algún tipo, ya no se pueden borrar (antes sí, sin avisar bien). Bloque
  nuevo **Papelera** al final de Ajustes, con Devolver a su sitio y Borrar del todo (esta última
  con su aviso de que es definitivo); si algo lleva más de 30 días, aviso ámbar para vaciar de
  golpe lo viejo. La papelera nunca se vacía sola. Vive en `js/papelera.js`; se expone además
  `Carpetas.trasladar` (ya existía por dentro, pero no se podía llamar desde fuera) y
  `Datos.quitarDeLista`, que hacían falta para esto. Pruebas en `pruebas/papelera.mjs`, los once
  escenarios del encargo, todas en verde. Batería completa (`npm test`, 23 ficheros) en verde
  salvo los dos escenarios de sello de Séneca de `pruebas/registro.mjs`, que en esta sesión
  tampoco se han podido comprobar por no tener aquí `js/lib/pdf.worker.min.js` (pesa más de 1 MB
  y esta sesión no ha podido bajarlo; no se ha tocado ese fichero, sin relación con este cambio,
  mismo aviso que dejó la fila 5). Versión publicada `11-sep-2026 · 16:20`.
- **8 · `docs/UNIR-VER-DENTRO.md`**: Terminada 11-sep-2026 · 17:15. Quitada la franja amarilla
  "Parecen el mismo asunto" de encima de la lista de Asuntos abiertos. En su lugar, un aviso de
  una línea junto a Actualizar (`⚠ N posible(s) duplicado(s) — Revisar`, oculto si no hay
  ninguno) que lleva a una pantalla propia **Duplicados** (fuera de la barra de la izquierda, con
  su botón Volver): cada grupo en columnas, una por asunto, con el nombre como enlace a su ficha,
  sus datos (fecha, estado, vía, plazo), sus documentos (abren en el visor lateral de siempre) y
  sus notas (las tres últimas, con "y N más"). El botón Unir sigue igual. Botón nuevo "No son el
  mismo" que descarta el grupo por la firma de sus nombres, en `_GESTOR/no-duplicados.json`; si
  el grupo cambia de miembros (por ejemplo, un tercer asunto que encaja), la firma ya no coincide
  y vuelve a avisar solo. Reversible desde Ajustes, bloque nuevo "Duplicados descartados" con
  "Volver a avisar". Todo en `js/unir-asuntos.js` y `css/unir-asuntos.css`, sin tocar
  `js/ajustes.js` ni la barra. Pruebas en `pruebas/duplicados.mjs` ampliada con los seis
  escenarios nuevos del encargo (30 en total), todas en verde, comprobado también en rojo antes
  del arreglo. Batería completa (`npm test`, 19 ficheros) en verde salvo los dos escenarios de
  sello de Séneca de `pruebas/registro.mjs`, que en esta sesión tampoco se han podido comprobar
  por no tener aquí `js/lib/pdf.worker.min.js`; no se ha tocado ese fichero, sin relación con
  este cambio, mismo aviso que dejaron las filas 5 y 7.
- **10 · `docs/ARREGLOS-USO-2026-09-14.md`**: Terminada 14-sep-2026 · 16:36. Cuatro arreglos
  pequeños, acordados con Francisco por lo que le pasó a su compañero (se quedó atrapado en una
  pantalla y tuvo que cerrar el navegador). El **3** (borrar un documento en Por clasificar) ya
  estaba hecho desde la papelera (fila 7, `js/papelera.js`, `envolverSueltos`): solo se ha
  comprobado. Los otros tres:
  - **1 · Que de toda pantalla se pueda salir.** El Escape general de `js/usabilidad.js` no hacía
    nada fuera del cuadro (`#capa`), un buscador o el lector de correos: en la ficha de un
    asunto, en la pantalla Duplicados o en Ajustes/Archivo/Personas con historial, no pasaba
    nada. Ahora, sin cuadro ni panel abierto, Escape hace lo mismo que el botón de salida de la
    pantalla que se ve; en Nuevo asunto equivale a Cancelar, preguntando antes si hay algo
    escrito. El visor de un documento (`js/visor.js`) no tenía Escape (solo el aspa): ahora
    también se cierra con Escape, desde el mismo sitio, sin tocar `js/visor.js`. Dos cuadros
    pequeños que ya ponían su propio Escape (el tipo de documento nuevo de `js/documentos.js`, el
    menú de tres puntos de `js/ajustes.js`) se han tocado para que corten la propagación: si no,
    el Escape general de aquí se disparaba también por detrás y cerraba de más (por ejemplo, todo
    el cuadro de "Gestionar documentos" al salir solo del recuadro de crear un tipo).
  - **2 · Copiar el nombre en orden normal.** Cada relacionado de la ficha del asunto lleva ahora
    un botón "Copiar" (`js/relacionados.js`, `Relacionados.nombreEnOrdenNormal`) con el nombre
    como se escribe a mano: de alumnado y personal quita el código final y da la vuelta a
    "Apellidos, Nombre"; en empresas copia la razón social tal cual. No toca cómo se guarda el
    nombre ni cómo se nombran las carpetas.
  - **4 · Carpetas temporales de Drive/Dropbox.** `App.verAbiertos` (`js/asuntos-lista.js`) solo
    descartaba las carpetas que empiezan por `_`: una carpeta temporal de sincronización
    (`.tmp.driveupload`, `.dropbox`, `desktop.ini`...) se colaba como si fuera un asunto abierto
    más. `Carpetas.esCarpetaTemporalDeSincronizacion` (`js/carpetas.js`), en un solo sitio,
    descarta las que empiezan por `.` o `~` y las de siempre (`desktop.ini`, `Icon\r`, un nombre
    con "conflicted copy"); si la carpeta ya tiene ficha en `asuntos.json`, se respeta igual,
    aunque el nombre sea raro.
  Cambios quirúrgicos, sin tocar la arquitectura. Batería completa (`npm test`, 19 ficheros) en
  verde, con `js/lib/pdf.worker.min.js` esta vez sí presente. Subido a `main`, versión
  `14-sep-2026 · 16:36`; **esta sesión no ha podido comprobarlo con `curl` contra la web
  publicada** (la red de esta sesión concreta no llega a `gestor-de-asuntos.vercel.app`: la
  bloquea la política de salida de este contenedor, no algo del código). Queda pendiente de
  confirmar en el navegador la próxima vez que se entre.
- **12 · `docs/DOCUMENTO-A-ASUNTO-EXISTENTE.md`**: Terminada 16-sep-2026 · 20:40. Botón "Meter en
  un asunto" en cada tarjeta de Por clasificar, para mandar un documento suelto a un asunto que
  ya existe en vez de crear uno nuevo. La fila 11 de la cola (`docs/CORREOS-AL-ASUNTO.md`) seguía
  **EN CURSO** de otra sesión al empezar esta (regla 6 de `docs/COLA.md`: se saltó y se cogió la
  siguiente PENDIENTE), así que el elegidor de asuntos nace en su propio módulo,
  `js/elegir-asunto.js` (`window.ElegirAsunto`), pensado para que la bandeja de correos lo
  reutilice cuando esa fila se retome, en vez de duplicar el buscador y la puntuación. El cuadro
  enseña "Podrían encajar" (como mucho cinco, más de 40 puntos) y la lista completa con buscador,
  abiertos primero y archivados con su etiqueta. La puntuación de un documento suelto (en
  `js/documentos-sueltos.js`) sale de las palabras del nombre del fichero, del nombre del
  tercero, de si el asunto está abierto y de si se movió hace menos de 30 días. Al elegir un
  asunto archivado, ofrece reabrirlo (con `App.reabrirAsunto`, que pide su propia confirmación) o
  meterlo sin reabrir. Nada se pierde: nombre repetido en el destino o un traslado a medias dejan
  el documento donde estaba, con aviso. Pruebas nuevas en `pruebas/documentos-sueltos.mjs` (seis
  escenarios del encargo). De paso se arregló `pruebas/logica.mjs`: la fecha de cese del personal
  estaba escrita a mano (`15/09/2026` y `06/09/2026`) y se quedó desfasada al llegar esa fecha,
  igual que ya le pasó una vez a la edad (ver el comentario de "la edad" en ese mismo fichero);
  ahora sale de `fechaHace(0, …)`, relativa a hoy. Batería completa en verde (`npm test`, 20
  ficheros). **Subido a una rama con pull request, no directamente a `main`**: el entorno de
  ejecución de esta sesión (Claude Code en la nube) lo exige así, aunque `docs/CONTEXTO.md` diga
  lo contrario; hace falta que alguien fusione el pull request para que Vercel lo publique.
- **13 · `docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md`**: Terminada 16-sep-2026 · 20:57, en la misma
  sesión y el mismo pull request que la fila 12. Gmail no deja que una página web adjunte
  ficheros, así que la salida sigue siendo la carpeta `GESTOR-BANDEJA`: bloque nuevo "Documentos
  de este asunto" en el cuadro de Correo (`js/correo-adjuntos.js`, solo ahí, nunca en el de
  Séneca), con una casilla por documento (desmarcadas de partida) y un límite de 20 MB. Al
  preparar, se copian los marcados a la bandeja con el nombre `<id> - <original>` y, el último,
  el encargo `<id>.envio.json` (con el hilo del asunto si `hilos` ya existe, de la fila 11; si no,
  cadena vacía y sale como correo nuevo, tal como preveía el propio encargo). Se apunta en
  `_GESTOR/envios.json` (una lista, no un objeto) para que la tarjeta "Borrador en camino" se vea
  aunque se cierre el cuadro; esa tarjeta y su vigilancia (cada 15 segundos, solo mientras haya
  algún encargo vivo) viven en `js/bandeja-correos.js`, que también deja de leer los
  `.envio.json`/`.listo.json`/`.error.json` como si fueran correos recogidos. El script de Apps
  Script (`mandarBorradores()`, en `apps-script/gestor-correos.gs`) monta el borrador con
  `GmailApp.createDraft` o, si hay hilo, `createDraftReply`, siempre como borrador, nunca lo
  envía; el disparador pasa de cinco minutos a uno. Pruebas nuevas en `pruebas/envios.mjs` (los
  seis escenarios del encargo), batería completa en verde. Igual que la fila 12: pendiente de que
  se fusione el pull request para que Vercel lo publique.
