/* ============================================================
   novedades.js — la lista de «Qué hay de nuevo» (fila 248,
   docs/NOVEDADES-AL-RECARGAR.md). Solo datos, lo más nuevo primero.
   `id`: el número de fila (o "248b" si una fila deja dos líneas);
   `texto`: una frase corta, con las palabras de la usuaria, sin
   nombres de ficheros ni de funciones. Cada fila que cambia algo
   visible añade su línea AL PRINCIPIO, en el mismo commit del código.
   Es un .js (no un JSON) para que valga también en la copia sin
   internet (file://), donde fetch de un JSON no funciona.
   ============================================================ */
window.NOVEDADES = [
  { id: '266', fecha: '2026-10-05', texto: 'Los datos de una empresa, o de cualquier tercero dado de alta a mano, se pueden cambiar desde la ficha del asunto. Si cambia el NIF o el nombre, las carpetas de sus asuntos abiertos y la suya del archivo cambian de nombre solas.' },
  { id: '265', fecha: '2026-10-05', texto: 'Si al archivar algún documento tiene un nombre demasiado largo para el archivo, la aplicación lo dice y deja acortarlo ahí mismo, en vez de fallar.' },
  { id: '263', fecha: '2026-10-05', texto: 'Un asunto ya no se queda sin crear porque su ruta salga larga: se crea igual y, si de verdad es muy larga, avisa en ámbar.' },
  { id: '259', fecha: '2026-10-02', texto: 'Herramientas → Control del registro: sube los listados de Séneca y mira qué apuntes no tienen asunto; Inicio avisa de los que faltan y de cuándo toca volver a subirlos.' },
  { id: '257', fecha: '2026-10-02', texto: 'Cambiar el asunto: el tipo se busca escribiendo, en una línea como el tercero, y el cuadro cabe entero en pantalla.' },
  { id: '260', fecha: '2026-10-02', texto: 'En un ordenador que trabaja sobre una copia de las carpetas se puede marcar «En este ordenador, solo consultar»: la aplicación no guarda nada ahí.' },
  { id: '255', fecha: '2026-10-02', texto: 'Campos de un hito: en la pantalla de cada hito hay «+ Añadir campo»; se rellenan ahí y salen también en la ficha, debajo del nombre de su hito.' },
  { id: '254', fecha: '2026-10-02', texto: 'En la ficha de un asunto, la tarjeta se llama ahora «Campos del asunto», con «+ Añadir campo» siempre a la vista; la ventana para elegir un campo es ancha y en columnas, y si algo falla al añadirlo, el aviso lo dice.' },
  { id: '256', fecha: '2026-10-02', texto: 'Al volver de una ficha a Inicio, la lista se queda exactamente a la misma altura, sin dar un saltito hacia abajo.' },
  { id: '253', fecha: '2026-10-02', texto: 'Los asuntos que cambias a un tipo que hay que liquidar, si ya no tienen nada por hacer, pasan solos a Por liquidar; también al marcar la casilla del tipo en Ajustes.' },
  { id: '252', fecha: '2026-10-01', texto: 'La ficha de una persona, en Personas y empresas, va ahora en tarjetas plegables con su resumen (familia, asuntos, matrícula, materias…); lo mismo sale en «Ver todo» dentro de un asunto.' },
  { id: '251', fecha: '2026-10-01', texto: 'Los campos ya no ofrecen «Añadir al nombre»: son etiquetas del asunto, salen en la ficha y al exportar.' },
  { id: '250', fecha: '2026-10-01', texto: 'Ajustes: para crear un tipo de asunto o de documento, primero se busca; si no está, se crea desde la misma caja.' },
  { id: '249', fecha: '2026-10-01', texto: 'Los asuntos que hay que liquidar (como el seguro escolar) pasan a la pestaña «Por liquidar» de Inicio, donde se marcan varios y se liquidan con su PDF.' },
  { id: '228', fecha: '2026-10-01', texto: 'Al cambiar o crear un hito desde un asunto, también se puede escribir su explicación, con viñetas.' },
  { id: '248', fecha: '2026-10-01', texto: 'Al entrar con una versión nueva sale esta ventana, «Qué hay de nuevo», y se vuelve a ver pulsando el número de versión de la barra lateral.' },
  { id: '247', fecha: '2026-10-01', texto: 'Los nombres de pila muy largos se acortan en los nombres de carpeta (el primero entero, los demás con su inicial).' },
  { id: '234', fecha: '2026-10-01', texto: 'Nuevo responsable de un hito: «Secretaría con V.º B.º de Dirección».' },
  { id: '233', fecha: '2026-10-01', texto: 'Un papel con sello se puede registrar como documento nuevo desde su aviso.' },
  { id: '245', fecha: '2026-10-01', texto: 'En la ficha de un asunto, «Datos del trámite» queda siempre a la vista.' },
  { id: '244', fecha: '2026-10-01', texto: 'Los campos de importe, número y fecha se escriben y se ven con el formato de siempre en España.' },
  { id: '243', fecha: '2026-10-01', texto: 'En Inicio, las pestañas y los títulos de la tabla se quedan fijos al bajar.' },
  { id: '238', fecha: '2026-10-01', texto: 'Ya se puede preparar el certificado de miembro del Consejo Escolar.' },
  { id: '236', fecha: '2026-10-01', texto: 'Un correo enviado desde la aplicación se guarda como PDF en el asunto.' },
  { id: '241', fecha: '2026-09-30', texto: 'Los asuntos de Inicio se pueden filtrar por fechas.' },
  { id: '240', fecha: '2026-09-30', texto: 'En el botón de soporte se puede escribir un texto largo, en un cuadro grande.' },
  { id: '239', fecha: '2026-09-30', texto: 'Los asuntos y documentos nuevos llevan un nombre fijo con su número.' },
  { id: '235', fecha: '2026-09-30', texto: 'Al aceptar un documento, la aplicación pregunta «¿Dónde se guarda?».' },
  { id: '232', fecha: '2026-09-30', texto: 'Los enlaces a la normativa llevan siempre al artículo.' },
  { id: '217', fecha: '2026-09-30', texto: 'El correo funciona aunque haya otra cuenta de Google abierta en el navegador.' },
  { id: '213', fecha: '2026-09-30', texto: 'Hay un botón de soporte para avisar de un fallo o proponer una mejora.' },
  { id: '227', fecha: '2026-09-29', texto: 'El botón «Ruta» copia la ruta normal de la carpeta.' },
  { id: '203', fecha: '2026-09-29', texto: 'La papelera se vacía sola a los 90 días.' }
];
