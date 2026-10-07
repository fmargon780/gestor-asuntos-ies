# Vocabulario de la aplicación

Acordado con Francisco el 26-sep-2026. **Todo texto que vea el usuario usa estas palabras**, en
todas las pantallas, avisos, cuadros, títulos (`title`), ayudas y en la futura ayuda contextual.
Toda instrucción nueva de la cola que añada o cambie textos de pantalla tiene que respetarlo.

Esto es solo para lo que se **ve**. Los nombres internos (variables, funciones, claves de
`_GESTOR`, nombres de fichero, clases CSS) no se tocan.

| Cosa | Palabra | No usar |
|---|---|---|
| El modelo de tramitación de un tipo de asunto | **guía** | «pasos del trámite» |
| Cada paso de la guía, y de un asunto concreto | **hito** («Hito 3 de 7», «Hito actual») | paso, «Paso N de M», «Paso actual» |
| Cada línea dentro de un hito | **tarea** | paso del guion, guion, receta, «qué hay que hacer», «cosas por reunir» |
| La tarjeta de la ficha de un asunto donde viven sus campos (fila 254) | **Campos del asunto** (con «+ Añadir campo») | «Datos del trámite» |
| La tarjeta de la mesa de un hito donde viven sus campos (fila 255) | **Campos de este hito** (con «+ Añadir campo») | datos del hito |
| El modo de un ordenador que no guarda nada en las carpetas (fila 260) | **solo consulta** («En este ordenador, solo consultar») | «solo lectura», «modo lectura» |
| La lista de tareas de un hito | **tareas del hito** | guion |
| Un hito guardado para reutilizar en varias guías | **hito de la biblioteca** | modelo, hito modelo |
| La persona o entidad de un asunto | **tercero** | interesado, «con quién es el asunto» |
| Los tutores legales de un alumno, como grupo | **familia** | «la familia (tutores legales)», tutores (en general) |
| Documento que genera la app (correo, Séneca, Word) | **plantilla** | modelo |
| Documento que rellena otra persona | **impreso** (con etiqueta «de la Junta» o «del centro» cuando se sepa) | formulario, impreso oficial |
| Meter un documento en un asunto que ya existe | **guardar en el asunto** («Guardar en un asunto», «Guardar aquí», «Guardar en ese asunto») | meter, meter aquí, elegir asunto, apuntar |
| Editar algo | **cambiar** («Cambiar el nombre», «Cambiar el asunto») | editar, renombrar, poner nombre |
| Eliminar algo que va a la papelera | **borrar** | |
| Eliminar algo que no va a la papelera (sacar de una lista) | **quitar** | |
| Dejar un cuadro sin hacer nada | **cancelar** | dejarlo |
| El bloque de hitos que le tocan a Administración, con o sin fecha | **En Administración** | Me toca |
| El bloque de asuntos cuyo hito actual espera a otro responsable | **En espera** | Esperamos a otros |
| Una tarea que existe solo en este asunto, no en la guía | **solo aquí** | propia, propio del asunto |
| Escribir una nota desde una tarea del hito | **Anotar** | apuntar, comentar |
| La clase de un campo propio con cifras en euros / con cifras / con día | **Importe en euros**, **Número**, **Fecha** (junto a «Texto libre» y «Lista cerrada») | cantidad, moneda, numérico |
| El código único de un asunto (`A26-0137`) o de un documento (`D26-01234`) | **número del asunto**, **número del documento** | código, referencia, expediente |
| Un asunto terminado de un tipo que hay que liquidar antes de archivar / el paso de entregar lo cobrado | **Por liquidar** (pestaña de Inicio), **Liquidar**, **liquidación** (el PDF) | pendiente de cobro, cierre de caja |
| Lo que es cada nombre de quien entra (Administración, Dirección, Secretaría o Jefatura de Estudios) / quien entra con uno que no es de Administración | **perfil** / **directivo** | rol, permisos, usuario restringido |
| Lo que un directivo pide a Administración desde la aplicación (no es un asunto hasta que Administración lo convierte) / cómo va, visto por quien lo pidió | **encargo** («Nuevo encargo», «Mis encargos»); **Sin atender**, **En marcha**, **Terminado**, **No procede** | petición, solicitud, tarea, ticket |
| Lo que un directivo escribe en un asunto suyo / la que Administración aún no ha visto | **nota de directivo**; **sin ver**, **Vista** | mensaje, comentario, aviso del directivo |
| Una línea del registro de entrada o de salida de Séneca (en el control del registro) | **apunte** («apuntes sin asunto», «Apunte de registro») | asiento, entrada del registro |
| Lo que la aplicación ha encontrado mal y hay que arreglar, con qué pasa, por qué y qué hacer (fila 291) | **problema** («N problemas por resolver», pestaña «Problemas») | huérfano, huérfana, ficha sin carpeta, envoltura, aviso de fallo |
| Pasar los hitos guardados bajo un nombre viejo a un asunto vivo (fila 292) / lo que difiere entre dos versiones guardadas a la vez | **Son de este asunto…**, **Pasar los hitos**, **Unir los hitos**; **Qué cambia** | mover, fusionar, diff |
| Un asunto cuyo tercero es un grupo de personas (fila 293) / las personas de ese grupo / lo que se le hace a todas con una plantilla | **asunto de grupo** («Es para un grupo de personas»), **Personas del grupo**; **Generado**, **Registrado**, **Enviado** (columnas) | lote, masivo, bloque, tanda, mailing |
| Enviar a todas las personas del grupo / un correo sin documento / lo que sale mal o queda para mañana (fila 295) | **«Enviar… (28)»**, **«Enviar un aviso…»**, **«Se envía a N personas»**, «Sin correo (M)», «Ya enviado (K)», «Sin registrar todavía (J)», «A quién», **«Enviar a los 28»**, «Enviando 12 de 28… No cierres esta pestaña.», **«Reintentar los 2»**, «No ha salido: …», «Pendiente de enviar», **«Seguir enviando (140)»**, «N envíos por terminar» | mailing, masivo, lote, cola de envío, reenviar |
| La vista previa de «Generar para todos» / su barra / lo que no se ha podido colocar de Séneca (fila 294) | **«Así queda el de…»** con «Generar los N» y «Cancelar»; **«Generando 12 de 30…»** con «Parar»; **«Estos documentos se registran en Séneca»**, «Pendiente», **«PDF sellados sin colocar»**, «¿De quién es?», «No es de este trabajo», «Volver a generar»; la **«Ref.»** de cada PDF | previsualización, progreso, huérfano, reintentar |
| Formar un grupo pegando un listado de Séneca o de una hoja de cálculo (fila 296) | **«Pegar una lista»**, «Pega aquí la lista: una persona por línea.», «o elige un fichero», **«Reconocer»**; **«Reconocidas (41)»**, **«Hay que elegir (3)»**, **«No encontradas (2)»** con «Copiar»; **«Señalar las N»**; «Guardar también como grupo, con el nombre…» | importar, cargar, lote, no reconocidas, ambiguas |

La diferencia entre plantilla e impreso: si la app lo rellena y lo genera, es plantilla; si se
entrega para que alguien lo rellene, es impreso (aunque la app ponga los datos del centro).
