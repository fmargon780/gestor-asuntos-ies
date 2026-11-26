# 583 — Compras de material de oficina

**Título llano:** Compras del material de oficina
**Para qué:** llevar dentro del Gestor el material de oficina que hace falta, los precios de cada proveedor, los pedidos y la comprobación de lo recibido y de la factura, para pedir bien y a quien conviene.
**Partes:** (filas 750 a 755, en este orden)
1. El catálogo y la lista de lo que falta (750)
2. Los precios de cada proveedor y la pestaña «Proveedores» (751)
3. Pedir comparando proveedores (752)
4. Pedir precios por correo (753)
5. Comprobar lo recibido y la factura (754)
6. Devoluciones y facturas rectificativas (755)

## Lo que escribió Francisco

Aviso de soporte (idea 561, 9-nov-2026, pantalla Inicio): «Debemos empezar a pensar en crear una herramienta de gestión de compras del material fungible de oficina».

En la conversación de diseño (25-nov-2026):
- «Olvídate por ahora del plan. […] Debes tener en cuenta que el material del que nos encargamos es el material de oficina que necesitamos en el centro. Muchas veces preguntamos precios a los distintos proveedores. Estaría bien poder tener en cuenta esta información a la hora de decidir a quién hacer el pedido. También es importante tener bien categorizado el material, ya que a veces lo que cambian son formatos, medidas, gramages, etc.»
- «¿Podemos diferenciar una cartulina de tamaño A3 de color azul satinado de una cartulina de tamaño A4 de color azul mate?»
- «A veces hay que hacer pedidos a proveedores para que los gastos de transporte sean gratis. O por diversificar y que nos puedan mantener descuentos.»
- «¿Y si necesito 2 cajas de folios y quiero comprar una a un proveedor y otra a otro?»
- «¿Queda el pedido registrado en asunto de alguna forma que después facilite la validación de la factura recibida?»

## Lo que entendió Claude (acordado con Francisco el 25-nov-2026)

Común a todas las partes:
- Entrada nueva en el menú de la izquierda, **«Material»**, entre «Cuentas» y «Herramientas». Dentro, cuatro pestañas: **Lo que falta (N) · Pedidos (N) · Catálogo (N) · Proveedores (N)**. Cada parte añade lo suyo; una pestaña cuya parte aún no está no sale.
- Lo usan las dos personas de Administración; todo se guarda en el centro, igual para las dos.
- Precios siempre **sin IVA**; el IVA de la comparación y de las sumas es el 21 %.
- Fuera de esta idea: existencias, inventario y presupuesto por departamento. La factura se sigue metiendo en Séneca igual: la app no lo sustituye.

### Parte 1 · El catálogo y la lista de lo que falta (750)
- **Catálogo.** Columna izquierda: las categorías con su número de artículos y «+ Nueva». Centro: los artículos de la categoría elegida, con una columna por característica, «Se compra por» y «Mejor precio» (vacío hasta la parte 2), y «+ Nuevo artículo». Derecha: el artículo elegido (nombre y «Se compra por …»; los precios llegan en la parte 2).
- **Categoría:** nombre, sus características en orden (p. ej. Formato, Gramaje, Color) y una casilla «El nombre del artículo empieza por el de la categoría» (marcada de entrada: «Papel A4 80 g Blanco»; desmarcada: «Grapas 24/6»). «Cambiar» junto a las características las cambia (añadir, quitar, cambiar el orden) y enseña los valores de cada lista; los artículos que ya hay conservan sus datos.
- **Valores en lista.** Cada característica tiene su lista de valores. Al dar de alta un artículo, cada característica es un desplegable con «—», sus valores y «+ Nuevo valor…», que abre al lado una casilla para escribirlo y queda en la lista. Si lo escrito ya está con otras mayúsculas («azul» y «Azul»), se elige el que había y sale el aviso «Ya estaba en la lista: Azul. Elegido.». Igual para «Se compra por» (paquete de 500 hojas, caja de 50, unidad…), lista común a todo el catálogo.
- **Nuevo artículo:** categoría (con «+ Nueva categoría…» como última opción), sus características y «Se compra por»; debajo, «Se llamará: …» con el nombre que se va formando. No deja guardar dos artículos iguales («Ese artículo ya existe: …»).
- **Lo que falta.** Arriba, una línea para apuntar: buscador («Apuntar: escribe qué hace falta (papel A4, sobres, tóner…)»), desplegable **«Para»** (Administración, Dirección, Jefatura de estudios, Conserjería, departamentos…, con «+ Nuevo…» al final; recuerda el último elegido), cantidad y «Apuntar». El buscador sugiere artículos mientras se escribe (todas las palabras escritas, en cualquier orden), con su «Se compra por»; flechas y Enter eligen; la última sugerencia es «+ Nuevo artículo…», que abre el alta con un aviso «Has buscado «…» y no está en el catálogo.» y sin categoría elegida. Al elegir un artículo, el cursor salta a la cantidad, seleccionada; Enter apunta.
- Si el mismo artículo ya está apuntado **para el mismo destino**, se suma la cantidad («Ya estaba apuntado para …: ahora N × …»). Para otro destino, es otra línea.
- Tabla: casilla, Artículo, Categoría, Para, Cantidad (se cambia ahí mismo) con su unidad, Mejor precio de los últimos seis meses (vacío hasta la parte 2), Apuntado por y Cuándo (los pone la app). Casilla en la cabecera para marcar todas. Encima: «Pedir lo marcado (N)…» (llega en la parte 3; hasta entonces no sale) y «Quitar de la lista».

### Parte 2 · Los precios de cada proveedor y la pestaña «Proveedores» (751)
- Los proveedores son las empresas de «Personas y empresas»; al elegir uno, la última opción es «+ Nueva empresa…» (el alta de siempre).
- En el artículo elegido del catálogo: tabla de precios, un renglón por proveedor (el último precio de cada uno), ordenada de barato a caro: Proveedor, Precio, Fecha, De dónde. El más barato de los últimos seis meses, en verde; los de hace más de seis meses, en gris (se ven, pero no cuentan como «mejor precio»). Si viene de un presupuesto o una factura, el documento se abre al pulsarlo.
- «+ Añadir precio»: Proveedor, Precio sin IVA, Fecha (hoy), De dónde sale (Llamada, Correo, Presupuesto; con Presupuesto, elegir el documento de la carpeta del asunto donde está). Un precio del mismo proveedor y día sustituye al anterior.
- Columna «Mejor precio» del catálogo y de «Lo que falta»: precio · proveedor (fecha), o «Sin precio reciente».
- **Pestaña «Proveedores»:** una fila por proveedor con algún precio o pedido: Proveedor, Correo, Portes gratis desde (se cambia pulsándolo; vacío = «sin apuntar»), Facturado en el año natural, Pedido sin facturar y una barra hacia el tope del contrato menor de suministros (15.000 € sin IVA) con «N € · N %»; ámbar desde el 80 % («cerca del tope»), rojo al pasarlo («pasado del tope»). Encima, una línea que explica qué es cada columna. Hasta la parte 5, «Facturado» y «Pedido sin facturar» van a cero.

### Parte 3 · Pedir comparando proveedores (752)
- Se marcan líneas de «Lo que falta» y «Pedir lo marcado (N)…» abre el cuadro **«Pedir N artículos»**: una fila por línea marcada y una columna por cada proveedor con algún precio de esos artículos, más «+ Otro proveedor» (añade la columna de otro proveedor, sin precios).
- Cada casilla: importe de la línea (precio × cantidad) y debajo «precio · fecha». Verde, el más barato de cada artículo con precio de los últimos seis meses; gris, precios de hace más de seis meses; «sin precio» si no hay.
- **Cada línea va a un proveedor:** la casilla elegida lleva recuadro azul y «✓». De entrada, cada línea va al más barato con precio reciente (si no hay, al más barato que haya; si no hay ninguno, sin asignar). Pulsar otra casilla de la fila la cambia. Una casilla «sin precio» pide el precio (el mismo cuadro de «Añadir precio», con el proveedor ya puesto) y, al guardarlo, la línea queda asignada ahí. En la casilla elegida, «Cambiar precio».
- **Partir una línea:** la cantidad se cambia en el cuadro. Si se baja, lo que queda pasa a otra fila del mismo artículo justo debajo, sin asignar (aviso «Partida: N aquí y M en la fila de debajo, sin asignar.»). Una línea sin asignar dice «sin asignar: se queda en «Lo que falta»». Al cancelar, las filas partidas vuelven a juntarse.
- Debajo de cada proveedor: «Lo asignado, sin IVA» (o «—»), «N líneas · con IVA …», «portes gratis desde X €» (se cambia pulsándolo; queda en el proveedor) con «✓ portes gratis» o «te faltan X €», y «este año: X de 15.000 €» (facturado + pedido sin facturar + lo de este pedido), ámbar desde el 80 % y rojo con «se pasa del tope».
- El botón dice «Pedir a <proveedor>» o «Hacer N pedidos». Por cada proveedor con líneas: un **asunto COMPRA nuevo** a su nombre (tercero = la empresa), con su número, como cualquier asunto nuevo, y su **documento de pedido** ya generado (líneas, cantidades, precios, importes y totales), listo para enviarlo desde el asunto como cualquier documento. Las líneas pedidas salen de «Lo que falta»; las sin asignar se quedan. Aviso: «Asunto nuevo A26-… COMPRA …, con su documento de pedido.» o «N asuntos COMPRA nuevos: …».
- **Pestaña «Pedidos»:** un recuadro por asunto COMPRA abierto con líneas: número y nombre (abre el asunto), «pedido el <fecha>», el documento de pedido (se abre) y «Comprobar recibido y factura» (parte 5); tabla Artículo, Cantidad, Precio, Importe y «Total sin IVA · con IVA (21 %)». Sale de aquí cuando se archiva el asunto.

### Parte 4 · Pedir precios por correo (753)
- En «Lo que falta», «Pedir precios de lo marcado…» (junto a «Pedir lo marcado»). Cuadro «Pedir precios»: a la izquierda, los proveedores con su correo y una casilla cada uno; a la derecha, el correo tal como saldrá: asunto «Petición de precios · <nombre del centro>», «Buenos días: Les rogamos nos indiquen precio sin IVA y plazo de entrega de:», la lista (artículo: cantidad × unidad), «Un saludo. Administración».
- «Enviar N correos»: uno a cada proveedor marcado, desde la cuenta de Administración, como los demás correos de la app. Cada línea pedida enseña en «Mejor precio» «precios pedidos el <fecha> a N proveedores». Las respuestas se apuntan como en la parte 2 o desde el cuadro «Pedir».
- Un proveedor sin correo no se puede marcar, y lo dice («sin correo: añádelo en Personas y empresas»).

### Parte 5 · Comprobar lo recibido y la factura (754)
- En el asunto COMPRA, un bloque **«Pedido y factura»** (también se llega desde «Pedidos» › «Comprobar recibido y factura»). Tabla agrupada por pedido («Pedido A26-… · fecha»): Artículo (con «para …» debajo), Pedido (cantidad × precio e importe), Recibido (de entrada, todo lo pedido), Facturado: cantidad, Facturado: precio sin IVA, Importe facturado y Comparación («falta la factura», «✓ cuadra» o en rojo cada diferencia: «recibido 9 de 10», «facturado 10, recibido 9», «precio 2,25 € en vez de 2,15 €»). Las casillas con diferencia, en fondo rojo claro.
- **Una factura para varios pedidos:** «Esta factura incluye también otro pedido de este proveedor: [elige el pedido]» junta otro asunto COMPRA abierto del mismo proveedor; sus líneas salen debajo, con «quitar de esta factura». Con todos juntados: «Esta factura junta N pedidos de este proveedor.»
- **Factura:** Nº, Fecha, Base imponible, IVA y Total. Comprobaciones: «Las líneas suman X, igual que la base imponible» (o la diferencia), «IVA al 21 %» (o cuánto sería) y «Base más IVA da el total». Todo en verde y sin diferencias: «✓ Factura conforme con el pedido y lo recibido.»; si no, «Con diferencias: revisa lo marcado en rojo.»
- «Volver a pedir lo no recibido» (N): lo que falta por recibir vuelve a «Lo que falta» con su destino; solo una vez.
- «Pasar los precios facturados al catálogo» (con la factura completa y su fecha): cada precio facturado entra en el catálogo con la fecha de la factura y «de dónde: Factura <nº>».
- Desde aquí, «Facturado en el año» y «Pedido sin facturar» de la pestaña «Proveedores» y del cuadro «Pedir» salen de verdad: un pedido cuenta como facturado cuando su factura tiene base imponible.

### Parte 6 · Devoluciones y facturas rectificativas (755)
- Columna **«Devuelto»** en el bloque (de entrada, 0). Con algo devuelto, la Comparación añade «devuelto N: abono de X €» y sale **«Factura rectificativa (abono de lo devuelto: X € sin IVA)»** con Nº, Fecha, Base imponible, IVA y Total; se comprueba igual («Lo devuelto suma X, igual que la base imponible», IVA al 21 %, base más IVA da el total), aceptando los importes en negativo o en positivo.
- «Factura conforme» exige también que el abono cuadre («…, y el abono cuadra»).
- El botón pasa a «Volver a pedir lo no recibido o devuelto (N)»: lo devuelto también vuelve a «Lo que falta».

## Pantalla de prueba
- Aprobada el 25-nov-2026: `docs/pantallas/583.html` · https://claude.ai/artifact/TgEbrsVqLt16vmbRDsaaCf
- Manda la pantalla. Lo que en ella es simulado: los correos no salen, los documentos no se abren, el asunto se ve solo por su bloque «Pedido y factura».

## Qué NO se hace en esta tarea
- Existencias, inventario y presupuesto por departamento (fuera, decidido por Francisco).
- Meter la factura en Séneca (se sigue haciendo igual).
- La guía (lista de tareas) del tipo COMPRA: se escribe cuando se use el trámite, como las demás.

## Notas técnicas de Claude
- Datos nuevos en `_GESTOR/material/` (por ejemplo `catalogo.json` con categorías, valores y artículos; `falta.json`; `precios.json`), siempre por `ColaGuardado`, fundiendo por elemento como `App.anotarLista` (dos personas a la vez) y lápidas para lo quitado (como `borrados-listas.json`). Lo de cada pedido (líneas, recibido, devuelto, facturado, factura, rectificativa, pedidos juntados) va en la ficha del asunto COMPRA en `asuntos.json`. Portes gratis y correo, en la ficha de la empresa (`empresas.csv`; añadir la columna si no existe, mirando la cabecera).
- Entrada del menú: como «Cuentas» en `js/barra.js`. Ficheros nuevos `js/material-*.js`, cada uno por debajo de 400 líneas, apuntados en `js/cargar-piezas-N.js`. Cuadros con la regla común `.capa > .cuadro`.
- Crear el asunto COMPRA: por el mismo camino que `crearUno` de `js/recurrentes.js` (número con `Numeros.reservar`, nombre con `Nombres.montar`, tipo COMPRA de la categoría EMPRESAS). El documento de pedido: tipo de documento PEDIDO con su plantilla, que se pueda cambiar como las demás; las líneas como tabla; nombre `AAMMDD PEDIDO D26-0…` con su número de documento.
- El correo de petición de precios, por el envío de siempre de la app (`js/correo.js` y el script de Gmail); remitente, la cuenta común de Administración.
- Datos de demostración en `js/demo/` (categorías, artículos con precios recientes y antiguos, proveedores cerca del tope y con portes, dos pedidos del mismo proveedor) y casos en `docs/CASOS-DE-PRUEBA.md`.
- Los importes se redondean a céntimos antes de comparar (diferencia de menos de 0,01 € = igual).

## Cómo lo comprueba el segundo revisor
(cada parte, lo suyo, con `?demo=1&auto=1`)
- Parte 1: «Material» está entre «Cuentas» y «Herramientas»; se crea la categoría «Cartulina» (Formato, Color, Acabado, Gramaje) y dos artículos «Cartulina A3 Azul Satinado …» y «Cartulina A4 Azul Mate …» que salen como dos filas; «+ Nuevo valor…» con «azul» cuando existe «Azul» elige «Azul» con su aviso; un artículo repetido no se guarda; categoría sin nombre delante da «Grapas 24/6»; cambiar el orden de las características conserva los datos; apuntar «a4 80» con Enter, cantidad y Enter añade la línea con Para, Apuntado por y Cuándo; apuntar lo mismo para el mismo destino suma, para otro destino crea otra línea; «Quitar de la lista» quita lo marcado.
- Parte 2: añadir un precio a un artículo lo pone en su tabla y en «Mejor precio»; uno de hace más de seis meses sale gris y no cuenta; pestaña «Proveedores» con la barra ámbar en un proveedor de demo por encima del 80 %; cambiar «portes gratis» se guarda.
- Parte 3: con cinco líneas marcadas, cada una sale asignada al más barato reciente; pulsar otra casilla la cambia y los totales cambian; «te faltan …» y «✓ portes gratis» según el importe; bajar una cantidad de 20 a 12 crea la fila de 8 sin asignar, y cancelar las junta; «sin precio» pide el precio y asigna; «+ Otro proveedor» añade columna; «Hacer 2 pedidos» crea dos asuntos COMPRA con su documento de pedido y las líneas pasan a «Pedidos»; una línea sin asignar se queda en «Lo que falta».
- Parte 4: «Pedir precios de lo marcado…» enseña el correo con las líneas; con dos proveedores marcados, el botón dice «Enviar 2 correos» y las líneas enseñan «precios pedidos el …»; un proveedor sin correo no se puede marcar.
- Parte 5: en un pedido de demo, cambiar «Recibido» marca la diferencia en rojo y activa «Volver a pedir lo no recibido»; facturado igual que lo pedido con base, IVA y total correctos da «✓ Factura conforme»; un precio distinto da «Con diferencias»; juntar el otro pedido del mismo proveedor añade sus líneas y la suma; «Pasar los precios facturados al catálogo» deja el precio con «Factura <nº>» en el catálogo.
- Parte 6: «Devuelto» 1 hace salir la rectificativa con el abono esperado; base −2,15, IVA −0,45, total −2,60 da las tres comprobaciones en verde; «Volver a pedir…» devuelve también lo devuelto.

## Qué mirar al terminar
- Parte 1: en el instituto, dar de alta las categorías y los artículos reales que más se compran, y apuntar lo que falte esa semana (te pido: hacerlo con Diego).
- Parte 2: apuntar los precios del último presupuesto real de un proveedor.
- Parte 3: hacer un pedido real y mirar el documento de pedido antes de enviarlo.
- Parte 4: mandar una petición de precios real a un proveedor.
- Parte 5: comprobar una factura real que llegue.
- Parte 6: lo verás la primera vez que haya una devolución.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code, para Claude: qué ha hecho, qué no ha podido ver y sus dudas)
- Parte 2 (fila 751, 26-nov-2026), revisor con contexto limpio en local con `?demo=1&auto=1`: APROBADA a la primera. Coincide: tabla de precios por proveedor de barato a caro; verde el más barato de seis meses y gris el antiguo; «+ Añadir precio» con «+ Nueva empresa…»; mismo proveedor y día sustituye; presupuesto con documento (pide asunto y luego documento, se abre al pulsar); «Mejor precio» en catálogo y «Lo que falta»; pestaña «Proveedores» con barra ámbar (87 %) y roja (104 %); portes que se cambian y se vacían; sin pestaña «Pedidos» ni «Pedir lo marcado»; consola sin errores; pantallas principales abren; crear y cerrar un asunto bien.
- No lo he podido ver: la app con datos reales (la prueba fue solo con demostración). «Facturado» y «Pedido sin facturar» van a cero en datos reales; solo la demostración trae cifras de partida (`cifras` de `material-precios.json`) para ver la barra.
- Decisión técnica: los portes gratis van en `material-precios.json` (por proveedor) y no en la columna nueva de `empresas.csv` que decían las notas: ese fichero lo comparte el Centro de datos y no se toca. El correo sí se lee de `empresas.csv`.
- Aviso menor visto por el revisor (no es de esta fila): en el buscador de asuntos, cada fila repite el NIF del tercero pegado al nombre.
