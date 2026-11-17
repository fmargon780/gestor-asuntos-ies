# 698 — El recorrido de cada tipo de documento

Parte del tema 692 (el molde nuevo). Es la primera.

## Lo que escribió Francisco
«Sinceramente pienso que debe ser la 2. Estoy dispuesto a hacer el trabajo en esa dirección que sea necesario.» (que el papel con su recorrido entre ya en el molde)

De la pantalla «Recorrido de un tipo de documento»: «Lo veo completo.»

## Lo que entendió Claude (acordado con Francisco el 17-nov-2026)
- El recorrido de un papel se escribe una sola vez, en su tipo de documento, y vale para todos los documentos de ese tipo en todos los trámites.
- Está en Ajustes › El centro › Tipos de documento › ⋮ de cada tipo › **«Recorrido»**, junto a «Campos del nombre», «Texto por defecto» y «Extracto de este tipo».
- La ventana pregunta, como en la pantalla de prueba:
  - **Este papel:** «Lo hacemos nosotros» o «Nos llega».
  - Si nos llega: una casilla «Se registra de entrada».
  - Si lo hacemos nosotros: **«Quién lo firma»** (Nadie, Administración, Secretaría, Secretaría con visto bueno de Dirección, Dirección, Jefatura de Estudios); casilla «Se registra de salida»; casilla «Se envía» y, si se envía, **«A quién»** (Familia, Interesado, Quien lo pide, Tutor/a del grupo, Personas relacionadas) y **«Por dónde»** (Correo electrónico, iPasen, Correo postal, En mano, Tablón).
  - Debajo, «Así saldrá en la tarea»: los pasos en una línea («Generado › Firmado › Registrado › Enviado», o «Recibido › Registrado de entrada») y el resumen en una frase.
- **Los tipos se ponen de acuerdo, una vez y sin preguntar:** RESOLUCIÓN (con tilde) se une con RESOLUCION y CERTIFICACION con CERTIFICADO, también en las plantillas que los usan; ACUERDO, DILIGENCIA, CITACION, AUTORIZACION, RENUNCIA y FICHA ENTREGA LIBROS se añaden a la lista del centro.
- Esta fila solo guarda el recorrido. No cambia nada más de la app: lo usan las filas siguientes.

**No estaba en la pantalla de prueba; lo propuso Claude y Francisco lo aprobó el 17-nov-2026 («1»):**
- Un tipo que nunca ha tenido recorrido sale como «Nos llega · no se registra», y en la lista de tipos lleva al lado, en gris, «sin recorrido» hasta que se guarda el suyo.
- La app no rellena sola ningún recorrido a partir de las plantillas.

## Pantalla de prueba
- Aprobada el 17-nov-2026: `docs/pantallas/692.html` · https://claude.ai/artifact/HyjmGcwogUBkAmwcq6TEwV

## Qué NO se hace en esta tarea
- Usar el recorrido en las tareas: filas 703 a 705.
- Que la plantilla de documento pueda decir otra firma: fila 703.
- La línea «2 plantillas firman distinto» en esta ventana: no está aprobada.
- Un plazo de firma por tipo de documento: descartado (un solo número para todo el centro, fila 704).

## Notas técnicas de Claude
- Leer antes `docs/notas-diseno/692.md` («Lo visto en el código») y `docs/notas-diseno/692-documentos.md`. Reglas del plan (`docs/PLAN-2026-11.md`): lo nuevo se añade, no sustituye; un asunto con hitos y un tipo sin la marca no cambian en nada.
- Cambios quirúrgicos: se tocan solo los ficheros nombrados aquí y los nuevos. Ficheros nuevos por debajo de 400 líneas, apuntados en su lista `js/cargar-piezas-N.js`. Una sola tanda de pruebas al final.
- Colores, letras y botones, los de la app; la pantalla de prueba solo dice qué hay y dónde va.
- El menú ⋮ del tipo de documento está en `js/ajustes-centro.js` (junto a «Extracto de este tipo»): añadir ahí «Recorrido», que llama a un fichero nuevo `js/recorrido-tipo.js` (ventana con `U.preguntar` y la regla común de cuadros).
- Dónde se guarda: decide la sesión. `tipos-documento.json` es hoy una lista de nombres; lo demás del tipo está en `campos.json` (`porTipoDocumento`) y `plantillas.json` (`extractosPorTipo`). Guardar por `ColaGuardado`. Dejar `RecorridoTipo.de(tipo)`, que devuelve `{ entra, firma, registro, envia, aquien, via }`, y `RecorridoTipo.pasos(tipo)`, como `pasosDe` de la pantalla de prueba.
- «Por dónde»: de `js/sitios.js` (`_GESTOR/sitios.json`), solo las vías de envío.
- Poner de acuerdo los tipos: una vez al entrar, con su marca de hecho en `_GESTOR`, como `js/baja-matricula*.js`; mirar `js/documentos-tipo-nuevo.js` y el campo `tipoDocumento` de `plantillas.json`. No tocar los nombres de los ficheros ya guardados en las carpetas.
- En «solo consultar» no se escribe nada (`SoloConsulta.activo()`).

## Cómo lo comprueba el segundo revisor
- En Ajustes › El centro › Tipos de documento, el ⋮ de un tipo ofrece «Recorrido» junto a los otros tres.
- La ventana tiene las preguntas de la pantalla de prueba, con esas palabras, y cambia según «Lo hacemos nosotros» o «Nos llega».
- «Así saldrá en la tarea» cambia al momento con lo que se elige.
- Tras guardar y recargar, el recorrido sigue ahí.
- En la lista de tipos hay un solo RESOLUCION y un solo CERTIFICADO, y están los seis añadidos.
- Un tipo sin recorrido guardado lleva «sin recorrido».
- Nada más de la app ha cambiado.

## Qué mirar al terminar
- Ajustes › El centro › Tipos de documento › ⋮ de COMUNICACION › «Recorrido»: escribir el suyo y guardar.
- Mirar que RESOLUCION y CERTIFICADO salen una sola vez.

## Revisión y respuestas durante el trabajo
- (las apunta Claude Code)
