# 515 — Detectar documentos firmados

## Lo que escribió Francisco

Tema 392 de la cola, que junta la idea 384 (la idea no trae más texto que su título):

> Tema: detectar documentos firmados. Junta la idea 384: que la app reconozca si un documento ya
> lleva firma digital, igual que hoy reconoce si está registrado de entrada o de salida, para los
> documentos que se ponen a la firma.

> Aviso de usuario: mejora en «Ficha de un asunto»

## Lo que entendió Claude (acordado con Francisco el 5-nov-2026)

Si algo cambia el texto de arriba, manda esto.

**Se parte en dos.** Esta tarea es la primera parte: reconocer la firma. La segunda, una tarea
«firmar» en las guías, es la idea 513.

1. **Firmado guardado encima con «Ruta».** Se pulsa el «Ruta» de un PDF y se guarda encima el PDF
   con firma digital. La app lo reconoce sola, sin preguntar:
   - el original pasa a versiones previas como `<nombre> SIN FIRMAR.pdf`;
   - aviso verde: «Documento firmado. El original sin firmar se conserva en «_Previas».»;
   - nota del asunto: «Firmado el <fecha> · <documento>».
2. **Marca.** El documento lleva «Firmado» en su línea gris, delante del registro: «Firmado ·
   Registro 26SM0123». Sale en todas las listas donde sale esa línea.
3. **Se cuentan las firmas.** Con más de una, la marca dice «Firmado (2)». Si llega una versión con
   una firma más:
   - la versión anterior pasa a previas como `<nombre> CON 1 FIRMA.pdf` (`CON 2 FIRMAS`…);
   - aviso verde: «Documento con 2 firmas. El anterior se conserva en «_Previas».»;
   - nota: «Firmado (2 firmas) el <fecha> · <documento>».
4. **Firmado que llega con otro nombre.** Un PDF con firma, sin nombre de la app y sin sello, sale en
   un aviso ámbar arriba de la ficha, como un papel sellado: «Este papel lleva firma digital.
   ¿De qué documento es?», con tres salidas:
   - «Es un documento nuevo»: el cuadro de poner nombre de siempre; al guardar, marca y nota;
   - «Elige un documento…»: ocupa el nombre de ese documento, como en el punto 1;
   - «No es de este asunto»: el fichero se queda en la carpeta y no se vuelve a preguntar.
5. **Registrado.** Lo que trae sello de registro sigue como hoy. Un documento firmado sigue
   contando como firmado después de registrarse: sale «Firmado · Registro …». Si un PDF trae sello
   y firma, entra por el camino del sello y además se anota la firma.
6. **Llega algo sin firma ni sello encima de un documento sin firmar.** Igual que hoy, cambiando el
   texto del aviso ámbar: «Lo que has guardado encima de <documento> no trae firma ni sello de
   registro. Lo he dejado; el anterior se conserva en «_Previas».»
7. **Llega algo sin firma encima de un documento firmado.** La app pregunta. Aviso ámbar: «Lo que
   has guardado encima de <documento> no trae firma, y el documento anterior estaba firmado. El
   firmado se conserva. ¿Con cuál te quedas?», con dos botones:
   - «Quedarme con el firmado»: vuelve el firmado con su marca; lo llegado va a previas como
     `<nombre> DESCARTADO.pdf`; aviso verde «He vuelto a poner el firmado. Lo que guardaste encima
     se conserva en «_Previas».»; sin nota.
   - «Usar el nuevo»: se queda lo llegado, sin marca; el firmado va a previas como
     `<nombre> ANTERIOR.pdf`; aviso verde «Se queda el nuevo, sin firma. El firmado se conserva en
     «_Previas».»; nota «Sustituido el firmado por una versión sin firma el <fecha> · <documento>».
   - Hasta contestar, el documento sale sin marca y el aviso sigue en la ficha, en los dos
     ordenadores. Francisco sabe que mientras tanto en la carpeta queda el PDF sin firma.

**Lo que desaparece o se sustituye:** el aviso «no trae sello de registro» para un firmado (punto 1)
y su texto en el punto 6.

**Límites que se quedan como hoy:**
- Si se guarda encima sin haber pulsado «Ruta», la app no se entera, igual que con el registrado.
- Los documentos antiguos sin número `D26-…` no llevan línea de datos: reciben la nota, no la marca.

## Pantalla de prueba (aprobada el 5-nov-2026)

- `docs/pantallas/515.html` · https://claude.ai/artifact/4bc5QBXDRCaZqZTqK216eT

## Qué NO se hace en esta tarea

- La tarea «firmar» en las guías, y que el hito avance solo: idea 513.
- Comprobar que la firma es válida, o quién firma. La app solo sabe que hay firmas y cuántas.
- Poner solo el estado del asunto «Firmado»: sigue a mano.
- Recorrer los documentos ya guardados para marcarlos.
- Documentos que no sean PDF.
- Los asuntos de grupo (`js/grupo-registro.js`).

## Notas técnicas de Claude

- `PdfMargenes.pareceFirmado` (`js/pdf-margenes.js`) sigue igual para quien lo usa. Función nueva al
  lado que cuenta las firmas: las apariciones de `/ByteRange`; si no hay ninguna y sí `/Type /Sig`, 1.
- `RutaCopia.queHaLlegado` (`js/ruta-copia.js`) está preparada para esto: la decisión sigue en esa
  función, con casos `registrado`, `firmado`, `sinSello` y uno nuevo para el punto 7.
- La duda del punto 7 se guarda en la lista compartida `_GESTOR/copias-ruta.json` (marca en el
  elemento, con las firmas que tenía), no en memoria: así la ven los dos ordenadores y sobrevive a
  recargar. La copia sigue en `_copia-ruta` hasta contestar, y la mirada no la vuelve a resolver.
- Las firmas se guardan en los datos del documento por `DocumentosDatos.anotar` (campo `firmas`) y
  la línea sale de `resumen` / `lineaHTML` (`js/documentos-datos.js`). Al renombrar o registrar no
  se pierden. Un registrado nunca baja el número: se queda el mayor.
- El aviso del punto 4 vive junto al del sello (`js/ficha-sellos.js`, `pintarSellos`). Conviene
  reutilizar `RegistroSellado` (`nombreLibreEntre`, ignorados, leer una sola vez cada fichero) y
  dejar el código nuevo en un módulo propio, enganchado sin envolver (`CONTEXTO-CORTO`, sección 6).
- Las notas, con `Notas.sustituir` y clave propia, para no repetirlas al repetirse la mirada.
- Todo lo que escribe en segundo plano mira `SoloConsulta.activo()`; los cuadros usan la regla común.
- Palabras de pantalla según `docs/VOCABULARIO.md`. Línea en `js/novedades.js`. La ayuda del botón
  «Ruta» de documento añade que también reconoce el firmado.
- Demo: el disco de demostración debe permitir simular los cuatro casos de guardar encima y el
  firmado con otro nombre (`?demo=1&auto=1`). Prueba nueva: `pruebas/documentos-firmados.mjs`.

## Cómo lo comprueba el segundo revisor

1. Punto 1: tras «Ruta» y guardar encima un PDF con firma: aviso verde, previas «SIN FIRMAR», nota,
   sin ventanas; repetir la mirada no añade otra nota.
2. Punto 2: la marca sale delante del registro, en la ficha y en la mesa del hito.
3. Punto 3: una segunda firma da «Firmado (2)», previas «CON 1 FIRMA» y su nota.
4. Punto 4: las tres salidas hacen lo descrito; con «No es de este asunto» el aviso no vuelve.
5. Punto 5: un firmado que luego se registra sale «Firmado · Registro …», con «SIN SELLAR» en previas.
6. Punto 6: aviso ámbar con el texto nuevo y «ANTERIOR» en previas.
7. Punto 7: sale la pregunta; los dos botones hacen lo descrito; recargar con la pregunta sin
   contestar la deja en la ficha, sin marca.
8. Sin cambios en: registrar a mano, «Ajustar tamaño» y comprimir con un PDF firmado, asuntos de grupo.
9. La pantalla coincide con `docs/pantallas/515.html`.
10. **[SOLO FRANCISCO]** Con un PDF real firmado con AutoFirma, y otro firmado dentro de Séneca:
    que la app los reconozca y cuente bien las firmas. Claude no ha visto ninguno. Si lo firmado en
    Séneca no lleva firma interna, no se reconocerá; se copia a `docs/COMPROBAR-A-MANO.md`.

## Revisión y respuestas durante el trabajo

- Revisor 2 (5-nov-2026) · punto 1: coincide. «Ruta» + firmado encima del CERTIFICADO: aviso verde «Documento firmado. El original sin firmar se conserva en «_Previas».» (palabra por palabra), `261103 CERTIFICADO D26-00002 SIN FIRMAR.pdf` en «_Previas», nota «Firmado el 05/11/2026 · 261103 CERTIFICADO D26-00002.pdf», ninguna ventana; tres miradas más no añaden nota ni aviso.
- Revisor 2 (5-nov-2026) · punto 2: NO coincide en la mesa del hito. En la ficha sale bien delante: «Firmado · Registro 26EM0555 · Firmas: documento 1». En la mesa del hito sale detrás del registro: «05/11/2026 · 26EM0777 · Firmado» (y sin registro «05/11/2026 · — · Firmado»). El texto pide «Firmado» delante del registro en todas las listas; lo esperado allí sería algo como «05/11/2026 · Firmado · 26EM0777».
- Revisor 2 (5-nov-2026) · punto 3: coincide. «Firmado (2)» en la línea, `261103 INFORME D26-00003 CON 1 FIRMA.pdf` en previas, aviso «Documento con 2 firmas. El anterior se conserva en «_Previas».», nota «Firmado (2 firmas) el 05/11/2026 · 261103 INFORME D26-00003.pdf». También sobre un firmado ya registrado: «Firmado (2) · Registro 26EM0555».
- Revisor 2 (5-nov-2026) · punto 4: coincide. Aviso ámbar «Este papel lleva firma digital.» / «¿De qué documento es? (resolución firmada descargada.pdf)» con «Es un documento nuevo», «Elige un documento…» y «No es de este asunto». Nuevo: cuadro de nombre de siempre; al guardar, «Firmado» en la línea y nota «Firmado el 05/11/2026 · 261105 CERTIFICADO D26-00017.pdf». Elegir el CERTIFICADO: igual que el punto 1 (SIN FIRMAR, aviso verde, nota). «No es de este asunto»: el fichero se queda, el aviso se va y no vuelve al mirar otra vez ni al salir y volver a la ficha.
- Revisor 2 (5-nov-2026) · punto 5: coincide. Firmado y luego registrado (sello sin firma): «Firmado · Registro 26EM0555», «SIN SELLAR» en previas, sin pregunta. Sello y firma juntos sobre un documento sin firmar: «Firmado (2) · Registro 26EM0557», solo «SIN SELLAR» y solo la nota de registro (no hay nota «Firmado»; el texto dice «se anota la firma», y la marca sí se anota). Caso límite: si el sello no se puede anotar (ESCRITO: «…trae sello de registro, pero el nombre del documento no permite anotarlo…», igual que hoy sin firma), la firma tampoco se anota y el documento queda sin «Firmado».
- Revisor 2 (5-nov-2026) · punto 6: coincide. Aviso ámbar «Lo que has guardado encima de 261103 ESCRITO D26-00005.pdf no trae firma ni sello de registro. Lo he dejado; el anterior se conserva en «_Previas».» (palabra por palabra) y `… ANTERIOR.pdf` en previas.
- Revisor 2 (5-nov-2026) · punto 7: coincide. Pregunta en la ficha con el texto exacto y los dos botones; mientras tanto la línea sale sin «Firmado». La pregunta sigue al ir a otro asunto y volver, y al mirar otra vez (una recarga de página entera no se puede probar en la copia de pruebas: empieza con disco nuevo; dos ordenadores, no lo he podido ver). «Quedarme con el firmado»: vuelve «Firmado», `DESCARTADO.pdf` en previas, aviso «He vuelto a poner el firmado. Lo que guardaste encima se conserva en «_Previas».», sin nota, el fichero vuelve a tener la firma. «Usar el nuevo»: sin marca, `ANTERIOR.pdf` en previas, aviso «Se queda el nuevo, sin firma. El firmado se conserva en «_Previas».», nota «Sustituido el firmado por una versión sin firma el 05/11/2026 · 261103 INFORME D26-00003.pdf».
- Revisor 2 (5-nov-2026) · punto 8: coincide. Registrar a mano un firmado: cuadro de siempre, «Documento registrado.», sale «Firmado · Registro 26EM0321». «Ajustar tamaño» de un firmado: el aviso de siempre («Este PDF ya está firmado digitalmente…»). Comprimir y asuntos de grupo no los he probado en pantalla; su código no cambia en este trabajo.
- Revisor 2 (5-nov-2026) · punto 9: coincide en textos y botones de los dos avisos ámbar, la línea gris y los avisos verdes. Diferencia: tras «Es un documento nuevo» la pantalla de prueba da el verde «Documento firmado guardado como <nombre>.» y la app da «Nombre del documento cambiado.» (el texto acordado no pide aviso ahí). El desplegable lista los documentos en otro orden (de más nuevo a más viejo), sin importancia.
- Revisor 2 (5-nov-2026) · punto 10: no lo he podido ver: es [SOLO FRANCISCO] (PDF reales de AutoFirma y Séneca).
- Revisor 2 (5-nov-2026) · Hace sin que el texto lo pida: entrada en «Qué hay de nuevo» y cambia la ayuda del botón «Ruta» («…Si guardas aquí el registrado o el firmado, la app conserva el original y lo apunta sola.»); con «Es un documento nuevo» el documento se apunta al hito actual y marca sola la tarea «Reunir el libro de familia» («Marcado: …»), igual que hoy con el papel sellado; acepta sin preguntar una versión con más firmas y sin sello encima de un documento registrado (se queda «Registro …» aunque el PDF nuevo ya no trae sello). Solo en la copia de pruebas: la cajita de la prueba tapa el botón «Guardar» del cuadro de nombre, y la vista previa de ese cuadro enseña el PDF como texto (el disco de pruebas da a todos los ficheros tipo text/plain; no es de esta tarea).
