# Ayuda al pasar el ratón (tema 453, fila 453)

Diseñado con Francisco el 24-oct-2026. Junta la idea 452.

## Qué se pide

Al dejar el ratón quieto sobre una pestaña o un botón del Gestor, aparece un recuadro pequeño con
una explicación breve de qué hace. Así se entiende cada cosa sin preguntar. Solo en el Gestor; las
demás apps se pedirán aparte si esto funciona bien.

## Decisiones cerradas

1. **Dónde sale.** En **todas las pestañas** y en los **botones cuyo nombre no lo explica todo**:
   los que son solo un dibujo o un símbolo (✕, ←, +…) y los de una palabra o frase que no dice qué
   pasa al pulsarlos («Liquidar», «Repartir», «Actualizar», «Restablecer columnas»…). **No sale**
   en los botones obvios: «Guardar», «Cancelar», «Aceptar», «Entrar», «Abrir», «Cerrar», «Volver».
   En caso de duda, mejor con ayuda que sin ella. Cuentan como pestañas todas: la barra principal
   (Inicio, Nuevo asunto, Archivo, Ajustes…), las de Inicio, las de Ajustes y las de tipos de asunto.
   Las pestañas que se crean según la configuración (las de categoría de tipos, `#pestanas-tipos`)
   llevan un texto general común a todas ellas, por ejemplo «Enseña solo los asuntos de esta
   categoría».
2. **Quién escribe los textos.** Los escribe Claude Code, mirando en el código qué hace de verdad
   cada pestaña o botón. Sin revisión previa de Francisco. Todos los textos fijos van juntos en **un
   solo fichero de la app** (por ejemplo `js/ayudas.js`), uno por línea, para que corregir uno sea
   cambiar una línea. Las pestañas y botones se enlazan con su texto por una clave, no copiando el
   texto en cada sitio. Las ayudas que hoy se montan con datos del momento (el subtítulo cortado de
   la ficha, los avisos ámbar de cada campo, las que se pasan como dato a funciones como
   `boton(texto, ayuda…)`) siguen montándose igual, pero se enseñan en el recuadro nuevo.
3. **Cómo son los textos.** Una o dos frases, de 20 palabras como mucho en total. Dicen qué hace o
   qué se ve, no repiten el nombre del botón. Lenguaje de Secretaría, sin palabras informáticas,
   siguiendo `docs/VOCABULARIO-EN-PANTALLA.md`. Ejemplo de tono para «Liquidar»: «Pide la fecha y
   quién entrega y recibe, guarda el PDF de liquidación, lo apunta en el registro y archiva el
   asunto.»
4. **Solo con ratón.** En pantallas táctiles (móvil, tableta) no sale nada: un toque hace lo que hace
   el botón, sin recuadro. Se decide por si el aparato tiene ratón, no por el ancho de la pantalla.
5. **Un solo estilo.** Hoy la app tiene unas 125 ayudas pequeñas grises del navegador (atributo
   `title`). Se cambian todas al recuadro nuevo. Si alguna no está en un botón ni en una pestaña
   (por ejemplo, la que enseña el nombre completo de algo que se ve cortado), también pasa al
   recuadro nuevo con el mismo texto que tiene hoy. Al terminar no queda ninguna ayuda gris del
   navegador en la app. Excepción: los botones obvios de la decisión 1 que hoy llevan ayuda gris
   (por ejemplo, un «Cerrar») la pierden y no llevan recuadro: gana la decisión 1. No se toca el
   título de la pestaña del navegador (`<title>`), que es otra cosa.
6. **Cómo se comporta el recuadro.** Sale cuando el ratón lleva quieto encima algo menos de medio
   segundo (400 milisegundos), para que no salten recuadros al cruzar la pantalla. Se va en cuanto el ratón sale del
   elemento. Nunca tapa el propio botón y nunca se corta por el borde de la pantalla: si no cabe
   debajo, sale encima, y se mueve a un lado si toca un borde. Colores y letra de la app, en claro y
   en oscuro. Solo un recuadro a la vez.
7. **También con teclado.** Si se llega a un botón con la tecla de tabulador, el recuadro sale igual,
   y se va al salir. Ojo: muchos botones de solo un símbolo (⋮, ✕, ↑, ↓) hoy solo tienen nombre
   gracias a la ayuda gris. Al quitarla, cada uno conserva su nombre para los lectores de pantalla
   con `aria-label`. Ningún botón se queda sin nombre.

8. **Botones apagados.** Un botón apagado (en gris) también enseña su recuadro al pasar el ratón.
   Además, el recuadro dice por qué está apagado y qué hay que hacer para encenderlo. Por ejemplo,
   «Liquidar» sin ningún asunto marcado: «Marca antes algún asunto para poder liquidarlo». Esto se
   hace en todos los botones de la app que se apagan según lo que haya en pantalla.

## Ejemplo real

- la pestaña **«Lo de cada día»**, la primera de **Ajustes**;
- el botón **«Liquidar»**, dentro de la pestaña «Por liquidar» de **Inicio** (en la demostración
  sale, porque el seguro escolar pide liquidar).

Los dos deben llevar un texto que explique lo que hacen de verdad, sacado del código.

## Cómo sabré que está bien

(Es la lista «Cómo sabemos que está bien» que pasa el revisor.)

1. En Ajustes, al dejar el ratón quieto sobre la pestaña «Lo de cada día», en menos de un segundo sale un
   recuadro que explica qué se ve en ella.
2. En Inicio, pestaña «Por liquidar», al dejarlo sobre el botón «Liquidar», el recuadro explica qué
   pasa al pulsarlo. Con ningún asunto marcado, el botón está apagado y el recuadro dice que hay
   que marcar antes algún asunto.
3. En Ajustes, al pasar por encima del botón «Guardar» del membrete no sale nada.
4. El recuadro se va en cuanto el ratón sale del botón, y nunca tapa el botón ni se corta por el
   borde de la pantalla.
5. Ya no aparece en ningún sitio la ayuda pequeña gris del navegador.

## Para Claude Code

- Cabe en una sola sesión.
- Prueba automática nueva que cubra: el recuadro sale con ratón tras la espera y se va al salir; no
  sale en «Guardar»; no hay ningún atributo `title` en la página ya pintada (salvo los que el
  navegador necesite por norma, si los hay, explicándolo en el commit); sale con el tabulador; sale en «Liquidar» apagado con el motivo; en
  modo táctil no sale. Foto con Playwright del recuadro sobre «Liquidar» y sobre el botón con ayuda
  que quede más a la derecha en Inicio (por ejemplo, el ⋮ de una fila), para ver que no se corta.
- Antes de cerrar, revisa que cada pestaña tiene su texto y que ningún texto pasa de 20 palabras.
