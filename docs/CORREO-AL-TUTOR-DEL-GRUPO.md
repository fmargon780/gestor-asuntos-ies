# Fila 348 — Añadir al tutor o tutora del grupo en el correo

Aviso del botón de soporte (Diego Herrera, 15-oct-2026), rediseñado con Francisco el mismo día.
Aviso completo: https://drive.google.com/file/d/1wKgN9mx0k09O8TiYyD9o7p-sMCWHsxgh/view?usp=drivesdk
Captura: https://drive.google.com/file/d/1f_nnZbFpxzm3tHJIGrF_h6mf6ulkPYcG/view?usp=drivesdk

## El problema

En la sanción A26-0321 (alumno de 1º ESO G), el cuadro «Correo de este asunto» con la plantilla
«Informar al tutor/a de la sanción» rellenaba «Para» con el correo personal de la familia y,
detrás, un correo del instituto. El cuerpo empezaba «Estimados tutores legales de…», aunque el
correo era para el tutor o tutora del grupo. Diego quería que en «Para» fuera el tutor de la unidad.

## Lo que se pide (decidido con Francisco)

1. **Botón junto a cada campo.** En el cuadro de Correo (todos los sitios donde sale: ficha,
   mesa de un hito, «Enviar ▾» de un documento), si el tercero del asunto es alumnado matriculado
   este curso (está en el RegAlum actual), junto a «Para», «Copia» y «Copia oculta» sale un botón
   pequeño «+ Tutor/a de 1º ESO G» (con su unidad). Al pulsarlo, se añade el correo del tutor o
   tutora a ese campo, sin quitar lo que ya hubiera y sin repetir una dirección que ya esté.
   El tutor sale de la tabla TUTORIAS, la misma que usa la fila 299.
2. **Asuntos de grupo.** Si el asunto es de grupo (`ficha.grupo`) o tiene varios alumnos
   relacionados de varias unidades, un solo botón por campo: «+ Tutores (3 grupos)», que añade de
   golpe a todos los tutores de las unidades de ese alumnado matriculado. Con una sola unidad, el
   texto es el del punto 1.
3. **Falta algún correo.** El botón sale igual y añade los correos que hay. Debajo de los campos,
   un aviso en ámbar: «Falta el correo del tutor/a de 1º ESO G» (uno por unidad que falte), con un
   enlace que lleva a donde se completa (Herramientas → Tablas de datos, tabla de tutorías). Si no
   hay ningún correo, el botón sale apagado con el mismo aviso.
4. **Cada plantilla de correo dice a quién va.** En la pantalla de una plantilla de correo, un
   campo nuevo «Va a:» con tres opciones: «La familia», «El tutor o tutora del grupo», «Quien lo
   pide». Al abrir el cuadro con esa plantilla, «Para» se rellena solo con eso y con nada más
   (con «El tutor o tutora», sin la familia; en asuntos de grupo, todos los tutores como en el
   punto 2). Si el destino no tiene correo, «Para» queda vacío y sale el aviso del punto 3.
   «Copia» y «Copia oculta» no se rellenan solos. «Sin plantilla» sigue como hoy. Una plantilla
   sin «Va a:» (las viejas antes de la revisión del punto 5) se comporta como hoy.
5. **Revisión única de las plantillas que ya existen.** Una sola vez, al entrar tras publicar:
   las plantillas de correo cuyo nombre diga «tutor/a», «tutor» o «tutora» (sin «tutores legales»)
   pasan a «Va a: El tutor o tutora del grupo»; las demás reciben «Va a» según lo que hacen hoy
   (por defecto «La familia» si hoy rellenan con la familia; «Quien lo pide» si hoy rellenan con
   quien lo pide). Después sale un cuadro con la lista: cada plantilla, su «Va a» y un desplegable
   para cambiarlo ahí mismo; «Hecho» lo cierra. No vuelve a salir (marca en `_GESTOR`, no en
   `localStorage`, para que el compañero no la repita). Respeta «solo consultar» y el perfil
   directivo: si no puede escribir, no hace la revisión y espera a otra entrada.
6. **Saludo.** Si una plantilla va al tutor o tutora, el saludo del cuerpo es «Buenas:», como ya
   hacen los correos de un hito al tutor (fila 299). Si el texto de la plantilla empieza con otro
   saludo («Estimados…», «Estimada familia…», «Hola…», hasta los dos puntos o la coma de la primera
   línea), se sustituye por «Buenas:» al rellenar el cuadro. En la revisión del punto 5, las
   plantillas que pasen a «el tutor o tutora» quedan guardadas ya con «Buenas:».

Nada cambia en los mensajes de Séneca.

## Cómo sabemos que está bien

- En la demostración, un asunto de un alumno matriculado: el cuadro de Correo enseña
  «+ Tutor/a de <unidad>» junto a «Para», «Copia» y «Copia oculta»; cada botón añade el correo del
  tutor solo a su campo, y pulsarlo dos veces no lo repite.
- Un asunto de un tercero que no es alumnado (personal, empresa, alumno antiguo): no sale el botón.
- Un asunto de grupo con alumnado de tres unidades: un botón «+ Tutores (3 grupos)» que añade los
  tres correos. Si a una unidad le falta el correo, se añaden los otros dos y sale el aviso en
  ámbar con su enlace.
- Una plantilla con «Va a: El tutor o tutora del grupo»: «Para» lleva solo al tutor (no la
  familia) y el cuerpo empieza «Buenas:» aunque la plantilla diga «Estimados tutores legales…».
- La plantilla «Informar al tutor/a de la sanción» de la captura queda, tras la revisión, en
  «El tutor o tutora».
- La revisión del punto 5 sale una sola vez, también en el segundo ordenador; en «solo consultar»
  no sale ni escribe.
- Prueba automática nueva que cubra los puntos 1 a 6, con una ventana baja para el aviso en ámbar.
  Pasada completa en verde.
- Línea en `js/novedades.js` (cambia algo visible).
