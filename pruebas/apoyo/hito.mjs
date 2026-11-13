/* Ayudas de las pruebas de navegador para moverse por los hitos de la ficha.

   Desde la fila 425 (22-oct-2026, docs/FICHA-VISTA-DE-TRABAJO.md), al entrar en un asunto ya está
   abierta la mesa de su hito actual (el primero sin hacer): la lista de hitos solo se ve con «← Hitos».
   Estas dos funciones dejan a una prueba en el sitio que necesita sin repetir cómo se llega. */

/* Abre la mesa del hito `id`: si ya está abierta, nada; si no, su celda de la tira; si no, su título en la lista. */
export async function abrirHito(pagina, id) {
  const sel = '#ficha-guia .hito-en-mesa[data-id="' + id + '"]';
  const limite = Date.now() + 20000;
  while (Date.now() < limite) {
    if (await pagina.locator(sel).count()) return;
    const tira = pagina.locator('#ficha-tira .mesa-tira-hito[data-id="' + id + '"]');
    const titulo = pagina.locator('#ficha-guia .hito[data-id="' + id + '"] .hito-titulo');
    try {
      if (await tira.count() && await tira.isVisible()) { await tira.click({ timeout: 2000 }); }
      else if (await titulo.count() && await titulo.isVisible()) { await titulo.click({ timeout: 2000 }); }
    } catch (e) { /* el panel se estaba repintando: se vuelve a mirar */ }
    await pagina.waitForTimeout(250);
  }
  await pagina.waitForSelector(sel, { timeout: 1000 });
}

/* Deja a la vista la lista de hitos («← Hitos»), con una línea por hito. */
export async function verLaLista(pagina) {
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForTimeout(150);   /* que el panel termine de pintar (y de abrir el hito actual) */
  if (await pagina.locator('#ficha-guia.con-mesa').count()) {
    await pagina.evaluate(() => HitoMesa.cerrar());   /* fila 637: «← Hitos» ya no existe */
  }
  await pagina.waitForSelector('#ficha-guia:not(.con-mesa) .hito', { state: 'attached' });
}

/* Fila 638: ya no hay «Comunicar ▾» ni «Preparar correo» sueltos en el hito (todo se comunica desde una tarea). Esto abre el
   cuadro de Correo (o de Séneca) del hito abierto en la mesa, con la misma función que usa el botón de una tarea. */
export async function comunicarDelHito(pagina, canal, opciones) {
  await pagina.evaluate(async ([c, o]) => {
    const a = FichaNucleo.actual;
    const h = Hitos.buscar(await Hitos.hitosDe(a.nombre), HitoMesa.abierta().idHito);
    HitosComunicar.comunicar(a, h, c || 'correo', o || {});
  }, [canal || 'correo', opciones || {}]);
}
