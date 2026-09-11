# Cola de instrucciones para Claude Code

Aquí se apuntan, en orden, las instrucciones pendientes. Cada una es un documento de `docs/`.
Francisco lanza siempre la misma línea; Claude Code hace lo que esté pendiente, de arriba abajo.

## Reglas para Claude Code

1. Lee antes `docs/CONTEXTO.md`.
2. Coge la primera instrucción con estado **PENDIENTE**. Cámbiala a **EN CURSO** con la fecha y
   sube ese cambio en el primer commit del trabajo. Así, si otra sesión abre esta cola, sabe que
   ya hay alguien con ella y no la repite.
3. Antes de empezar una instrucción, comprueba si ya está hecha por otro camino (mira si existen
   los ficheros o funciones que pide). Si ya está hecha, márcala **HECHA** con una nota y pasa a
   la siguiente.
4. Al terminar una, márcala **HECHA** con la fecha y la versión publicada, y sigue con la
   siguiente PENDIENTE. No pares hasta que no quede ninguna.
5. Si una instrucción no puede completarse, márcala **BLOQUEADA** con el motivo en una línea y
   sigue con la siguiente. Nunca dejes el repositorio con las pruebas en rojo.
6. Si encuentras una instrucción **EN CURSO** de otra sesión y no eres tú quien la empezó,
   sáltala y coge la siguiente PENDIENTE.
7. No preguntes nada a Francisco. Al final, un mensaje corto: qué instrucciones has hecho, la
   versión publicada, y qué va a ver distinto en pantalla.

## Reglas para Francisco

- Mientras Claude Code está trabajando, **no se lanza otra vez**. Las instrucciones nuevas se
  apuntan aquí y esperan.
- Cuando Claude Code termina, se vuelve a pegar la misma línea. Si no queda nada pendiente,
  Claude Code lo dice y no toca nada.

## La línea para lanzar

    Lee docs/CONTEXTO.md y después docs/COLA.md. Haz en orden todo lo que esté PENDIENTE, siguiendo las reglas de la cola, sin preguntarme nada. Al terminar, dime en pocas frases qué has hecho, qué versión está publicada y qué voy a ver distinto en pantalla.

## La cola

| Nº | Instrucción | Estado | Notas |
|---|---|---|---|
| 1 | `docs/PLAN-ROBUSTEZ-2026-09.md` | HECHA | Ya estaba hecho antes de apuntarse aquí (PR #4, fusionada 11-sep-2026 03:50): copias de seguridad y fichero roto, conflictos de Dropbox, pruebas automáticas en GitHub Actions, fichas sin carpeta, nombres repetidos y documentación. Comprobado de nuevo el 11-sep-2026: ficheros y pruebas en el repo, versión publicada `11-sep-2026 · 05:33` |
| 2 | `docs/REGISTRO-EN-UN-PASO.md` | HECHA | Ya estaba hecho antes de apuntarse aquí (PR #5, fusionada 11-sep-2026 05:01): botón Registrar sin nombrar dos veces, casilla "Pendiente de registro" y lectura sola del sello de Séneca en el PDF. Comprobado de nuevo el 11-sep-2026 |
| 3 | `docs/CAMPOS-POR-TIPO.md` | HECHA | Terminada 11-sep-2026 · 11:59. Cada tipo de asunto puede llevar sus propios campos (de fichero, calculados o propios), configurables en Ajustes con el botón "Campos"; salen ya rellenos al crear el asunto, se pueden marcar obligatorios y añadir al nombre en el orden elegido, se guardan con la ficha y se enseñan al editar y en la ficha del asunto. `pruebas/campos.mjs`, los ocho escenarios del encargo más la edición, todas en verde. Versión publicada `11-sep-2026 · 11:37`; con la corrección de la fila 4, la versión real en la web es `11-sep-2026 · 12:00` |
| 4 | `docs/TERCEROS-RELACIONADOS.md` | HECHA | Terminada 11-sep-2026 · 11:51. Lista de personas o entidades relacionadas con un asunto, en el bloque "Personas y entidades relacionadas" de su ficha. Al archivar se deja una nota (nunca una copia de documentos) en la carpeta de cada relacionado, diciendo dónde está el asunto de verdad; al reabrir se borra sola, salvo que tenga algo más dentro. Pruebas en `pruebas/relacionados.mjs`, todas en verde. La instrucción 3 subió a la vez una versión completa de index.html, ficha-asunto.js y asuntos-nuevo.js basada en una copia anterior a estos cambios, y los borró sin querer; se detectó por el número de versión y se fusionaron ambos cambios en un commit aparte. Versión publicada, ya fusionada y comprobada en la web: `11-sep-2026 · 12:00` |
| 5 | `docs/NO-DUPLICAR-ASUNTOS.md` | HECHA | Terminada 11-sep-2026 · 13:22. Al pulsar "Crear el asunto", si ya hay uno abierto o archivado del mismo tercero, mismo tipo y mismo año académico (el grupo y el texto libre no cuentan), se para y sale "Este asunto ya existe": abrir el que hay, o crear otro de todas formas. Para los que ya existían antes de esto (o se crearon a mano), franja "Parecen el mismo asunto" en Asuntos abiertos, con un botón Unir que junta ficheros y notas y borra el que sobra. Pruebas en `pruebas/duplicados.mjs`, los seis escenarios del encargo, todas en verde; ajustada también `pruebas/campos.mjs`, que creaba a propósito un segundo asunto igual el mismo día para otra cosa. Toda la batería en verde salvo los dos escenarios de sello de Séneca de `pruebas/registro.mjs`, que en esta sesión no se han podido comprobar por no tener aquí `js/lib/pdf.worker.min.js` (no se ha tocado ese fichero); sin relación con este cambio. Versión publicada y comprobada en la web: `11-sep-2026 · 13:08` |
| 6 | `docs/AJUSTES-AGIL.md` | EN CURSO | Empezada 11-sep-2026 · 13:22 (sesión programada) |
| 7 | `docs/PAPELERA.md` | PENDIENTE | Apuntada 11-sep-2026 · 15:10. Borrar con papelera: nada se borra de verdad a la primera. Botón Borrar en los documentos de un asunto, en los sueltos, en un asunto abierto (solo desde su ficha), en las listas de Ajustes, en los terceros dados de alta a mano y en el tablón. Todo va a `_GESTOR/PAPELERA` con su ficha en `papelera.json`, y se devuelve a su sitio desde Ajustes › Papelera. En el ARCHIVO no hay botón. La papelera no se vacía sola |
| 8 | `docs/UNIR-VER-DENTRO.md` | PENDIENTE | Apuntada 11-sep-2026. La franja "Parecen el mismo asunto" se despliega con el enlace "Ver qué hay dentro" y enseña los asuntos en columnas: fecha, estado, vía, documentos y notas. Los documentos se abren en el panel de la derecha con el visor que ya existe. Botón "No son el mismo" que quita la franja para los dos administrativos, guardado en `_GESTOR/no-duplicados.json`, con vuelta atrás desde Ajustes › Duplicados descartados |
