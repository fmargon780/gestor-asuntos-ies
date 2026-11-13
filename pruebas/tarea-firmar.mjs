/* Fila 523 (5-nov-2026, docs/523-TAREA-FIRMAR.md; tema 516): la tarea «Firmar un documento».
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1).

   1. «Nueva tarea…» ofrece «Firmar un documento» con «Firmas necesarias»; la tarea sale «solo aquí» con su dato y su etiqueta
      («Firmar · 2 firmas»; con 1, «Firmar»).
   2. Firmado de su documento: con 2 necesarias, la primera no marca y el aviso dice «falta 1 de 2 firmas»; la segunda marca.
   3. Firmado de otro documento: la tarea no se marca. Reconocer un firmado sin tarea sigue como siempre.
   4. «Hacer este hito»: se para en la tarea de firmar («Esperando el PDF firmado», «Dejar de esperar»); al llegar las firmas, sigue
      con la tarea de registrar (espera el sello). Una tarea de firmar sin documento no se espera (queda pendiente).
   5. El hito con todas las tareas hechas no se cierra solo. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForTimeout(3000);

async function abrirMesa(frag) {
  await pagina.evaluate(() => { const v = document.getElementById('word-visor'); if (v) WordVisor.cerrar(); });
  await pagina.click('button.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + frag + '"] .tarjeta-nombre').first().click();
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  if (!(await pagina.locator('#ficha-guia.con-mesa').count())) await pagina.locator('#ficha-guia .hito .hito-titulo').first().click();
  await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
  const primero = pagina.locator('#ficha-tira .mesa-tira-hito').first();
  if (await primero.count() && !(await primero.evaluate((e) => e.classList.contains('actual')))) await primero.click();
  await pagina.waitForTimeout(800);
}
const lineaDe = (id) => pagina.locator('.hito-en-mesa .guion-paso[data-id="' + id + '"]');
/* Las tareas de firmar del primer hito de un asunto: { texto: { hecha, firmas, doc } }. */
const firmarDe = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const o = {};
  Hitos.guionDe(a, h).filter((g) => g.accion === 'firmar').forEach((g) => {
    const e = TareasConDocumento.de(h, g.id);
    o[g.texto] = { hecha: g.hecho, firmas: GuiasGuion.firmasNecesarias(g), doc: e ? e.doc : null };
  });
  return o;
}, frag);
const llegar = (frag, doc, firmas) => pagina.evaluate(async ([frag, doc, firmas]) => {
  window.__avisos = [];
  if (!window.__avisoEnvuelto) { const o = U.aviso; U.aviso = function (t) { window.__avisos.push(String(t)); return o.apply(this, arguments); }; window.__avisoEnvuelto = true; }
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  await DocumentosFirmados.alLlegar(a, doc, firmas === 1 ? 'firmado' : 'masFirmas', firmas, '_Previas');
  return window.__avisos.slice();
}, [frag, doc, firmas]);

const DOC_A = '261105 RESOLUCION D26-09101.pdf';
const DOC_B = '261105 INFORME D26-09102.pdf';
const DOC_OTRO = '261105 OTRO D26-09103.pdf';

/* ===== 1. La acción nueva ===== */
console.log('--- 1. «Firmar un documento» ---');
await abrirMesa('Vidal Soto');
await pagina.locator('.hito-en-mesa .tcd-abrir-form').click();   /* fila 638: el formulario se abre con «+ Añadir tarea» */
await comprobar('1. «Qué se hace» ofrece «Firmar un documento»',
  pagina.$$eval('.hito-en-mesa .tcd-nueva .tcd-accion option', (o) => o.map((x) => x.textContent).includes('Firmar un documento')), true);
await pagina.locator('#guion-nueva-tarea').fill('Firmar la resolución');
await pagina.locator('.hito-en-mesa .tcd-nueva .tcd-accion').selectOption('firmar');
await comprobar('1. sale «Firmas necesarias» con 1, 2 y 3 (por defecto 1)',
  pagina.evaluate(() => {
    const c = document.querySelector('.hito-en-mesa .tcd-nueva');
    const s = c.querySelector('.guion-receta-firmas');
    return [/Firmas necesarias/.test(c.innerText), s ? [...s.options].map((o) => o.value) : null, s ? s.value : null];
  }), [true, ['1', '2', '3'], '1']);
await pagina.locator('.hito-en-mesa .tcd-nueva .guion-receta-firmas').selectOption('2');
await pagina.locator('#guion-nueva-tarea').press('Enter');
await pagina.waitForTimeout(1500);
await pagina.locator('.hito-en-mesa .tcd-abrir-form').click();
await pagina.locator('#guion-nueva-tarea').fill('Firmar el informe');
await pagina.locator('.hito-en-mesa .tcd-nueva .tcd-accion').selectOption('firmar');
await pagina.locator('#guion-nueva-tarea').press('Enter');
await pagina.waitForTimeout(1500);
const ids = await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const o = {};
  Hitos.guionDe(a, h).filter((g) => g.accion === 'firmar').forEach((g) => { o[g.texto] = [g.id, g.propio, g.receta]; });
  return o;
});
await comprobar('1. «Firmar la resolución»: solo aquí, 2 firmas', [ids['Firmar la resolución'][1], ids['Firmar la resolución'][2]], [true, { firmas: '2' }]);
await comprobar('1. «Firmar el informe»: solo aquí, 1 firma (no se guarda el dato)', [ids['Firmar el informe'][1], ids['Firmar el informe'][2]], [true, null]);
await comprobar('1. la etiqueta de la tarea: «Firmar · 2 firmas» y «Firmar»',
  pagina.evaluate((ids) => [ids[0], ids[1]].map((i) => { const c = document.querySelector('.hito-en-mesa .guion-paso[data-id="' + i + '"] .guion-tarea-clase'); return c ? c.textContent : null; }),
    [ids['Firmar la resolución'][0], ids['Firmar el informe'][0]]), ['Firmar · 2 firmas', 'Firmar']);
await pagina.evaluate(async ([idA, idB, a, b]) => {
  const x = Gestor.asuntos().filter((y) => y.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(x.nombre))[0];
  await TareasConDocumento.asignar(x.nombre, h.id, idA, a);
  await TareasConDocumento.asignar(x.nombre, h.id, idB, b);
  HitosPanel.programarRepintado();
}, [ids['Firmar la resolución'][0], ids['Firmar el informe'][0], DOC_A, DOC_B]);
await pagina.waitForTimeout(1200);
await comprobar('1. «Cambiar» (⋮) enseña la acción y sus firmas',
  (async () => {
    await lineaDe(ids['Firmar la resolución'][0]).locator('.guion-tarea-menu-boton').click();
    await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar' }).first().click();
    await pagina.waitForSelector('.hito-en-mesa .guion-tarea-editar .tcd-accion');
    const r = await pagina.evaluate(() => { const c = document.querySelector('.hito-en-mesa .guion-tarea-editar'); return [c.querySelector('.tcd-accion').value, c.querySelector('.guion-receta-firmas').value]; });
    await pagina.locator('.hito-en-mesa .guion-tarea-editar .guion-receta-firmas').selectOption('3');
    await pagina.locator('.hito-en-mesa .guion-tarea-editar .guion-receta-firmas').selectOption('2');
    await pagina.locator('.hito-en-mesa .guion-tarea-editar-guardar').click();
    await pagina.waitForTimeout(1500);
    return r;
  })(), ['firmar', '2']);

/* ===== 2 y 3. Llega el firmado ===== */
console.log('--- 2. el firmado llega ---');
const av0 = await llegar('Vidal Soto', DOC_OTRO, 1);
await comprobar('3. firmado de otro documento: ninguna tarea se marca',
  (await firmarDe('Vidal Soto'), Object.values(await firmarDe('Vidal Soto')).map((t) => t.hecha)), [false, false]);
await comprobar('3. y el aviso no habla de tareas', av0.some((t) => /Marcado|tarea/.test(t)), false);
const av1 = await llegar('Vidal Soto', DOC_A, 1);
await comprobar('2. con 2 necesarias y 1 firma: no se marca', (await firmarDe('Vidal Soto'))['Firmar la resolución'].hecha, false);
await comprobar('2. el aviso dice «Aún no se marca la tarea: falta 1 de 2 firmas.»', av1.some((t) => t.indexOf('Aún no se marca la tarea: falta 1 de 2 firmas.') !== -1), true);
const av2 = await llegar('Vidal Soto', DOC_A, 2);
await comprobar('2. con la segunda firma se marca', (await firmarDe('Vidal Soto'))['Firmar la resolución'].hecha, true);
await comprobar('2. el aviso lleva « Marcado: Firmar la resolución.»', av2.some((t) => t.indexOf(' Marcado: Firmar la resolución.') !== -1), true);
await comprobar('3. la otra tarea (otro documento) sigue sin marcar', (await firmarDe('Vidal Soto'))['Firmar el informe'].hecha, false);
await comprobar('2. el documento lleva «Firmado (2)» en sus datos',
  pagina.evaluate((doc) => { const a = Gestor.asuntos().filter((y) => y.nombre.indexOf('Vidal Soto') !== -1)[0]; const d = DocumentosDatos.deFichero(a.ficha, doc); return d ? d.firmas : null; }, DOC_A), 2);
const av3 = await llegar('Vidal Soto', DOC_B, 1);
await comprobar('2. con 1 necesaria y 1 firma: se marca', (await firmarDe('Vidal Soto'))['Firmar el informe'].hecha, true);
await comprobar('2. y no se repite el aviso de «falta» ni se marca otra vez', av3.some((t) => /falta/.test(t)), false);
await comprobar('8. reconocer un firmado sin tarea sigue igual (aviso de siempre, sin tareas)',
  (async () => { const av = await llegar('Vidal Soto', '261105 SUELTO D26-09104.pdf', 1); return av.some((t) => /^Documento firmado\./.test(t) && !/Marcado|Aún/.test(t)); })(), true);

/* ===== 4 y 5. «Hacer este hito» ===== */
console.log('--- 4. «Hacer este hito» espera la firma ---');
await abrirMesa('Aguilar Ponce');
const prep = await pagina.evaluate(async ([docX]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0];
  let h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.clase !== 'decision' && x.estado !== 'hecho')[0];
  for (const g of Hitos.guionDe(a, h)) await Hitos.marcarGuion(a.nombre, h.id, g.id, { noaplica: true });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Firmar sin documento', { accion: 'firmar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Firmar con documento', { accion: 'firmar', receta: null });
  await Hitos.anadirGuionPropio(a.nombre, h.id, 'Registrar con documento', { accion: 'registrar', receta: null });
  h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === h.id)[0];
  const g = Hitos.guionDe(a, h);
  const id = (t) => g.filter((x) => x.texto === t)[0].id;
  await TareasConDocumento.asignar(a.nombre, h.id, id('Firmar con documento'), docX);
  await TareasConDocumento.asignar(a.nombre, h.id, id('Registrar con documento'), docX);
  return { hito: h.id, sin: id('Firmar sin documento'), con: id('Firmar con documento'), reg: id('Registrar con documento') };
}, [DOC_A]);
const estadoHito = () => pagina.evaluate(async ([idH, ids]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0];
  const g = Hitos.guionDe(a, h);
  const hecha = (id) => g.filter((x) => x.id === id)[0].hecho;
  return { cadena: h.cadena ? [h.cadena.estado, h.cadena.tarea === ids.con ? 'con' : h.cadena.tarea === ids.reg ? 'reg' : h.cadena.tarea, h.cadena.documento] : null,
    sin: hecha(ids.sin), con: hecha(ids.con), reg: hecha(ids.reg), estado: h.estado,
    boton: HacerEsteHito.botonHTML(a, h).replace(/<[^>]+>/g, '|').replace(/\|+/g, '|') };
}, [prep.hito, prep]);
await pagina.evaluate(async (idH) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0];
  await HacerEsteHito.ejecutar(a, h);
}, prep.hito);
const e4 = await estadoHito();
await comprobar('4. se para en la tarea con documento, esperando la firma', e4.cadena, ['esperando-firma', 'con', DOC_A]);
await comprobar('4. la tarea sin documento no se espera: queda pendiente', [e4.sin, e4.con, e4.reg], [false, false, false]);
await comprobar('4. el botón dice «Esperando el PDF firmado» y «Dejar de esperar»', /Esperando el PDF firmado/.test(e4.boton) && /Dejar de esperar/.test(e4.boton), true);
/* Fila 638: la mesa ya no enseña «Esperando el PDF firmado» ni «Dejar de esperar» (el botón de la cabecera se quitó); se quita el apunte a mano. */
await comprobar('4. quitar el apunte de la cadena quita la espera',
  (async () => {
    await pagina.evaluate(async (idH) => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0]; await Hitos.guardarCampos(a.nombre, idH, { cadena: null }); }, prep.hito);
    await pagina.waitForTimeout(800);
    return (await estadoHito()).cadena;
  })(), null);
await pagina.evaluate(async (idH) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre)).filter((x) => x.id === idH)[0];
  await HacerEsteHito.ejecutar(a, h);
}, prep.hito);
await comprobar('4. se vuelve a esperar', (await estadoHito()).cadena, ['esperando-firma', 'con', DOC_A]);
const avA = await llegar('Aguilar Ponce', '261105 AJENO D26-09110.pdf', 1);
await comprobar('4. el firmado de otro documento no la mueve', (await estadoHito()).cadena, ['esperando-firma', 'con', DOC_A]);
await llegar('Aguilar Ponce', DOC_A, 1);
const e5 = await estadoHito();
await comprobar('4. al llegar la firma, la tarea se marca y «Hacer este hito» sigue: espera el sello', [e5.con, e5.cadena], [true, ['esperando-sello', 'reg', DOC_A]]);
await comprobar('4. la tarea sin documento sigue pendiente', e5.sin, false);

/* ===== 5. El hito no se cierra solo ===== */
console.log('--- 5. el hito no se cierra solo ---');
await pagina.evaluate(async ([idH, ids]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Aguilar Ponce') !== -1)[0];
  await Hitos.marcarGuion(a.nombre, idH, ids.sin, { hecho: true });
  await Hitos.marcarGuion(a.nombre, idH, ids.reg, { hecho: true });
  HitosPanel.programarRepintado();
}, [prep.hito, prep]);
await pagina.waitForTimeout(1500);
const e6 = await estadoHito();
await comprobar('5. con todas las tareas hechas, el hito no se marca solo', [e6.sin, e6.con, e6.reg, e6.estado === 'hecho'], [true, true, true, false]);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
