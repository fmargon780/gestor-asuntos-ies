# 694 — Repaso de las cinco tandas contra los datos reales (Claude, con Fable, 27-nov-2026)

Antes de escribir la instrucción del botón «Pasar los tipos al molde nuevo» (`694.md`, «Qué falta»,
punto 3). Datos bajados enteros ese día de `_GESTOR` de la cuenta común: `guias.json` y `tipos.json`
(26-nov-2026), `campos.json`, `plantillas.json`, `tipos-documento.json` y `recorridos-tipos.json`.
Código leído en `main` (commit 4a18b96): `js/aula-convivencia.js` (el precedente de la fila 723),
`js/recorrido-tipo.js`, `js/solo-si.js`, `js/guia-sin-hitos.js`, `js/asunto-sin-hitos-guia.js`,
`js/tarea-papel.js`, `js/tarea-papel-pintar.js`, `js/papel-espera-recibir.js`, `js/tarea-espera.js`
y `js/tipos-unir.js`.

## Lo que cuadra

- Los grupos, recalculados: A 4, B 16, C 15, D1 24, D2 14. Los mismos tipos que en `694.md`.
- Los papeles de las tandas existen todos en la lista de tipos de documento, menos los tres que se
  crean (EXPEDIENTE DE TRASLADO, INFORME VALORACIÓN, CONFORMIDAD SERVICIO).
- Firmas, «a quién» y vías de los recorridos aprobados son valores que la app admite («Otro centro u
  organismo» y «Ventanilla Electrónica», con la fila 782).
- Los datos que usan los «Solo si» existen o están en la lista de datos nuevos. «Curso Abono AITE» ya
  existe (lista 2024/2025 a 2027/2028) y ya está en PAGO AYUDA TRANSPORTE.
- `{hito}` solo sale en un correo: el del Programa de Tránsito (ya previsto).
- Los hitos de cada tipo de D1 son los que describen las tandas; no falta ninguno.

## Lo que no cuadra con el código

1. **Las esperas.** La guía del molde nuevo no sabe decir «al hacer esta tarea, se queda esperando
   a X». Solo existe un caso (`esperaAlEnviar`, fila 723): al enviar un papel, la tarea del papel que
   tiene que volver queda esperando, y siempre a la familia (o «Tercero» si no es alumnado). Las
   tandas lo dan por hecho en siete tareas: MATRICULA 2 (Jefatura), ADMISION 2 (familia), TRASLADO 1 y
   4 (centro de origen), PAGO AYUDA TRANSPORTE 1 (familia), NEAE 2 (Orientación) e INFORME VALORACIÓN
   2 (equipo educativo). Sin tocar nada, esas esperas se ponen a mano con «⋮ › Esperando a…».
   **Pendiente de que Francisco decida** (pregunta hecha el 27-nov-2026).
2. **CREDENCIAL IPASEN.** La segunda tanda le pone el recorrido «lo hacemos · sin firma». Hoy no
   tiene recorrido y por eso la tarea de IPASEN ALUMNADO, que ya se usa, enseña «Añadir documento»
   (la credencial sale de Séneca). Con el recorrido aprobado pasaría a «Generar documento ▾».
   Propuesta de Claude: **no ponerle recorrido**; vale igual para IPASEN TUTOR LEGAL.
3. **Papeles «que hacemos» pero no salen de una plantilla de la app** (INFORME PERSONAL TRASLADO e
   HISTORIAL ACADÉMICO, de Séneca; INFORME VALORACIÓN, del equipo educativo; la FICHA ENTREGA LIBROS;
   muchos CERTIFICADO, de Séneca). La tarea de un papel «que hacemos» solo ofrece «Generar documento ▾»
   con plantillas. El documento se une solo a la tarea si se añade por «Documentos» del asunto, pero
   desde la tarea no se puede. Propuesta de Claude: tarea pequeña delante del botón, «Añadir uno ya
   hecho…» en ese menú.
4. **El plazo de una tarea.** ADMISION 3 lleva «2 días hábiles». En el molde nuevo el plazo es del
   asunto (decidido el 17-nov-2026), no de la tarea. Propuesta: va escrito en la frase («…, en 2 días
   hábiles»); no hay fecha calculada.
5. **Dos tareas con el mismo papel en un asunto** (TRASLADO: dos OFICIO y dos EXPEDIENTE DE TRASLADO
   cuando el expediente no está en Séneca). Un documento que llega por la bandeja no se une solo a
   ninguna de las dos; hay que añadirlo desde su tarea o con «Vincular a una tarea». Se dice en «Cómo
   se hace».
6. **El recibí de la ayuda de transporte.** Su plantilla de Word da un documento del mismo tipo que
   la tarea 4 («nos llega · se registra de entrada»). Al generarlo para imprimir, la tarea lo coge y
   dice «Recibido» antes de que la familia firme; queda bien cuando llega el sellado. Se dice en
   «Cómo se hace».
7. **Tres tipos de C tienen una tarea de verdad** dentro de «Tramitar»: CERTIFICADO e INFORME FINAL
   ETAPA («Registrar») y SOLICITUD NACIONALIDAD («Solicitud a los tutores documento de
   nacionalidad»). Propuesta: SOLICITUD NACIONALIDAD nace con esa única tarea («Pedir a los tutores el
   documento de nacionalidad»); los otros dos, vacíos (registrar lo trae el recorrido del papel).

## Para la instrucción (técnico, lo decide Claude)

- **Buscar cada tipo por su nombre exacto**, no por nombre corto ni alias como hace
  `AulaConvivencia.buscarTipo`: 24 nombres los comparten dos tipos (por ejemplo «FUNCIÓN TUTORIAL» es
  un tipo y el nombre corto del que se une con él; «BAJA» es alias de dos tipos activos).
- IPASEN TUTOR LEGAL no tiene ningún dato: hay que colgarle «Cómo llega la petición» (ya existe).
  La guía real de IPASEN ALUMNADO tiene cinco tareas; se copian las cuatro que no son «Rechazar…», y
  las dos últimas quedan «Siempre».
- Orden: unir tipos (función tutorial; CALENDARIO DE COORDINACIÓN) → tipos de documento → recorridos
  (sin pisar el que ya exista) → datos → guías (sin pisar una lista de tareas ya escrita) → correos →
  casilla «Sin hitos». Con marca en `_GESTOR` y lista previa de lo que cambia.
- Los hitos de antes se quedan guardados sin usarse, como en la fila 723; los asuntos abiertos no
  cambian. Unir los dos tipos de función tutorial sí renombra las carpetas de sus asuntos abiertos:
  hay que hacerlo con las carpetas a mano (en el instituto, o en casa con la cuenta común).
- El recorrido es de todo el centro: los de SOLICITUD, CERTIFICADO, OFICIO… valen también en los
  cuatro tipos que ya están en el molde y en cualquier tarea de papel que se añada a mano.

## Esto no se ha pedido (por preguntar, una cosa cada vez)

- Tipos activos repetidos, además de la función tutorial: PETICIÓN INFORME e INFORME ALUMNADO (este
  tiene «PETICIÓN INFORME» de nombre corto: sus carpetas se llaman igual); DATOS PERSONAL INTERINO y
  «Alta y actualización de datos» (mismo caso); INFORME UNGENCIAS (personal) e INFORME URGENCIAS
  (alumnado).
- ~~PARTE DE CONFORMIDAD~~ Resuelto el 27-nov-2026: es el mismo papel que CONFORMIDAD SERVICIO («1»); no se crea el tipo nuevo.
- La plantilla «Acuerdo del Consejo Escolar o del Claustro» (tipo CONSEJO ESCOLAR, desactivado) tiene
  por fichero «AITE - RECIBÍ GENÉRICO (13).docx»: parece un fichero equivocado.
