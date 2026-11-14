/* Fila 661 (docs/661-BANDEJA-CON-HITO-Y-TAREA.md): desde la bandeja, el documento entra en el asunto al pulsar «Guardar» y el cuadro del nombre
   pide el hito y la tarea (bloque «¿De qué tarea es?»). Estas ayudas dejan a una prueba antigua, que solo quería ver entrar el documento, en el
   sitio de antes sin repetir cómo se elige. */

/* Antes de abrir el cuadro: el asunto necesita un hito donde colgar el documento. */
export async function conUnHito(pagina, asunto) {
  await pagina.evaluate(async (a) => { await window.Hitos.anadirHito(a, 'Hito de la prueba'); }, asunto);
}

/* Con el cuadro abierto: elige el hito y la «Tarea nueva» (con la propuesta, o sin ella). Devuelve cuando el bloque está listo. */
export async function elegirHitoYTareaNueva(pagina) {
  await pagina.waitForSelector('#doc-tarea-bloque h4', { timeout: 15000 });
  await pagina.waitForSelector('#dtb-hito, #dtb-cambiar');
  if (await pagina.locator('#dtb-cambiar').count()) await pagina.click('#dtb-cambiar');
  if (!(await pagina.$eval('#dtb-hito', (e) => e.value))) await pagina.selectOption('#dtb-hito', { index: 1 });   /* si se llega desde un hito, ya viene puesto */
  await pagina.check('#doc-tarea-bloque input[value="nueva"]');
}

/* Todo junto: elige y pulsa «Guardar». */
export async function guardarEnElHito(pagina) {
  await elegirHitoYTareaNueva(pagina);
  await pagina.click('#doc-guardar');
}
