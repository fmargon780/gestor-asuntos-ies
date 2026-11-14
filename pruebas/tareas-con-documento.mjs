/* Fila 522 (5-nov-2026, docs/522-TAREAS-CON-DOCUMENTO.md): cada tarea de generar o registrar lleva colgado su documento.
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1): «Vidal Soto, Irene» tiene un
   primer hito con tres tareas (generar con plantilla, registrar en Séneca, comunicar por correo).

   1. Antes de generar, las tareas de registrar y de comunicar dicen «Saldrá aquí al generar …» (fila 638: también la de comunicar).
   2. «Hacer este hito» (fila 638: lanzado a mano con `HacerEsteHito.ejecutar`; ya no hay botón): el documento cuelga de la tarea de generar,
      de la de registrar y de la de comunicar.
   3. «Elegir documento» (lista los del asunto) y «Cambiar»; «Cancelar».
   4. Registrar: con el sellado de otro documento no se marca; con el de su documento, sí (llega solo).
   5. La tarea de generar, hecha, muestra la versión «SIN SELLAR» (sin «Ruta») y la abre; la de registrar, el documento actual.
   6. «Nueva tarea…» con «Qué se hace» y su dato: «solo aquí»; «Cambiar» los cambia; «Pasar a la guía» los lleva y el documento sigue en el asunto.
   7. «Cambiar» de una tarea de la guía llega a la guía.
   8. Un asunto de antes (Hugo) se ve sin errores. */
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
const colgados = () => pagina.$$eval('.hito-en-mesa .mesa-guion .guion-paso', (l) => {
  const o = {};
  l.forEach((p) => { const c = p.querySelector('.tcd'); if (c) o[p.dataset.id] = c.innerText.replace(/\s+/g, ' ').trim(); });
  return o;
});
const lineaDe = (id) => pagina.locator('.hito-en-mesa .guion-paso[data-id="' + id + '"]');
const estado = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  return { docs: h.guionDocumento || null, hechas: Hitos.guionDe(a, h).filter((g) => g.hecho).map((g) => g.id), documentos: h.documentos, cadena: (h.cadena && h.cadena.estado) || null };
}, frag);
const claveDe = (frag) => pagina.evaluate((frag) => Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0].nombre, frag);

/* ===== 1. Antes de generar ===== */
console.log('--- 1. antes de generar ---');
await abrirMesa('Vidal Soto');
await comprobar('1. las tareas de registrar y de comunicar dicen «Saldrá aquí al generar el certificado.»; la de generar, nada', colgados(),
  { 'g-hacer-registrar': 'Saldrá aquí al generar el certificado.', 'g-hacer-comunicar': 'Saldrá aquí al generar el certificado.' });

/* ===== 2. Generar ===== */
console.log('--- 2. «Hacer este hito» ---');
await pagina.evaluate(async () => {
  const a = FichaNucleo.actual;
  const h = Hitos.buscar(await Hitos.hitosDe(a.nombre), HitoMesa.abierta().idHito);
  setTimeout(() => HacerEsteHito.ejecutar(a, h), 0);
});
await pagina.waitForSelector('#word-visor:not(.oculto) .word-visor-franja', { timeout: 30000 });
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => WordVisor.cerrar());
await pagina.waitForTimeout(1500);
const e2 = await estado('Vidal Soto');
await comprobar('2. el documento queda en la tarea de generar, en la de registrar y en la de comunicar, el mismo',
  [Object.keys(e2.docs || {}).sort(), e2.docs && e2.docs['g-hacer-generar'].doc === e2.docs['g-hacer-registrar'].doc && e2.docs['g-hacer-generar'].doc === e2.docs['g-hacer-comunicar'].doc], [['g-hacer-comunicar', 'g-hacer-generar', 'g-hacer-registrar'], true]);
await comprobar('2. sale colgado de las tres, con «Ruta»',
  pagina.evaluate(() => {
    const r = {};
    document.querySelectorAll('.hito-en-mesa .guion-paso').forEach((p) => { r[p.dataset.id] = p.querySelectorAll('.tcd .tcd-abrir').length + ':' + p.querySelectorAll('.tcd .ruta-documento-lugar').length; });
    return r;
  }), { 'g-hacer-generar': '1:1', 'g-hacer-registrar': '1:1', 'g-hacer-comunicar': '1:1' });
await comprobar('2. la de generar, hecha, no lleva «Cambiar»; la de registrar, pendiente, sí',
  pagina.evaluate(() => [...document.querySelectorAll('.hito-en-mesa .guion-paso')].map((p) => p.dataset.id + ':' + p.querySelectorAll('.tcd-cambiar').length)),
  ['g-hacer-generar:0', 'g-hacer-registrar:1', 'g-hacer-comunicar:1']);
const nombreDoc = e2.docs['g-hacer-generar'].doc;

/* ===== 3. Elegir documento / Cambiar ===== */
console.log('--- 3. «Elegir documento» y «Cambiar» ---');
await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  await TareasConDocumento.asignar(a.nombre, h.id, 'g-hacer-registrar', '');
  HitosPanel.programarRepintado();
});
await pagina.waitForTimeout(1500);
await comprobar('3. sin documento: «Elegir documento»', lineaDe('g-hacer-registrar').locator('.tcd').innerText().then((t) => t.trim()), 'Elegir documento');
await lineaDe('g-hacer-registrar').locator('.tcd-elegir').click();
await pagina.waitForSelector('.hito-en-mesa .tcd-selector');
await comprobar('3. el desplegable lista los documentos del asunto', pagina.$$eval('.hito-en-mesa .tcd-selector option', (o) => o.slice(1).some((x) => /CERTIFICADO/.test(x.value))), true);
await lineaDe('g-hacer-registrar').locator('.tcd-cancelar').click();
await comprobar('3. «Cancelar» vuelve a «Elegir documento»', lineaDe('g-hacer-registrar').locator('.tcd').innerText().then((t) => t.trim()), 'Elegir documento');
await lineaDe('g-hacer-registrar').locator('.tcd-elegir').click();
await pagina.waitForSelector('.hito-en-mesa .tcd-selector');
await lineaDe('g-hacer-registrar').locator('.tcd-selector').selectOption({ index: 1 });
await pagina.waitForTimeout(1500);
const e3 = await estado('Vidal Soto');
await comprobar('3. elegido: la tarea lleva ese documento y ahora ofrece «Cambiar»',
  [!!(e3.docs && e3.docs['g-hacer-registrar']), await lineaDe('g-hacer-registrar').locator('.tcd-cambiar').count()], [true, 1]);
await lineaDe('g-hacer-registrar').locator('.tcd-cambiar').click();
await pagina.waitForSelector('.hito-en-mesa .tcd-selector');
await lineaDe('g-hacer-registrar').locator('.tcd-cancelar').click();
await comprobar('3. «Cambiar» y «Cancelar»: el documento sigue', lineaDe('g-hacer-registrar').locator('.tcd-abrir').count(), 1);
/* La tarea queda con el documento generado, como al generar. */
await pagina.evaluate(async (doc) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  await TareasConDocumento.asignar(a.nombre, h.id, 'g-hacer-registrar', doc);
  HitosPanel.programarRepintado();
}, nombreDoc);
await pagina.waitForTimeout(1200);

/* ===== 4. Registrar solo con su documento ===== */
console.log('--- 4. registrar solo con su documento ---');
await comprobar('4. con el sellado de otro documento no se marca',
  pagina.evaluate(async () => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    const h = (await Hitos.hitosDe(a.nombre))[0];
    const r = await Hitos.marcarGuionPorAccion(a, h.id, 'registrar', '261105 OTRO DOCUMENTO D26-09999.pdf');
    const h2 = (await Hitos.hitosDe(a.nombre))[0];
    return [r, Hitos.guionDe(a, h2).filter((g) => g.hecho).map((g) => g.id)];
  }), [null, ['g-hacer-generar']]);
/* El sellado llega: el papel con sello en la carpeta, y la pasada de fondo lo coloca sola. */
const clave = await claveDe('Vidal Soto');
await pagina.evaluate(async (clave) => {
  const carpeta = await App.E.abiertos.getDirectoryHandle(clave);
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const doc = await PDFLib.PDFDocument.create();
  const fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  const d = new Date();
  p.drawText('Certificado de notas de Irene Vidal Soto (copia de pruebas)', { x: 50, y: 780, size: 12, font: fuente });
  p.drawText('2026/29700692/M000000000800SALIDA Fecha: ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() + ' 09:30:00', { x: 50, y: 40, size: 9, font: fuente });
  await Carpetas.escribirBytes(carpeta, '29700692 - Fuente Lucena (certificado Irene).pdf', await doc.save(), 'application/pdf');
  HacerEsteHitoSello._reiniciar();
  await HacerEsteHitoSello.pasada();
}, clave);
await pagina.waitForTimeout(2500);
const e4 = await estado('Vidal Soto');
await comprobar('4. con el sellado de su documento sí: la tarea de registrar queda hecha', e4.hechas, ['g-hacer-generar', 'g-hacer-registrar']);

/* ===== 5. Versiones ===== */
console.log('--- 5. versiones ---');
await abrirMesa('Vidal Soto');
await comprobar('5. la de generar guarda la versión «SIN SELLAR»; la de registrar, no',
  pagina.evaluate(async () => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    const h = (await Hitos.hitosDe(a.nombre))[0];
    return [/ SIN SELLAR\.pdf$/.test((h.guionDocumento['g-hacer-generar'] || {}).version || ''), !!(h.guionDocumento['g-hacer-registrar'] || {}).version];
  }), [true, false]);
await comprobar('5. la de generar muestra la versión, sin «Ruta»; la de registrar, el actual con «Ruta»',
  pagina.evaluate(() => {
    const f = (id) => { const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="' + id + '"]'); return [p.querySelectorAll('.tcd-abrir-version').length, p.querySelectorAll('.tcd-abrir').length, p.querySelectorAll('.tcd .ruta-documento-lugar').length]; };
    return [f('g-hacer-generar'), f('g-hacer-registrar')];
  }), [[1, 0, 0], [0, 1, 1]]);
await comprobar('5. pulsar la versión la abre (en _Previas)',
  pagina.evaluate(async () => {
    window.__abierta = null;
    const orig = VersionesPrevias.abrir;
    VersionesPrevias.abrir = (a, n) => { window.__abierta = n; };
    document.querySelector('.hito-en-mesa .tcd-abrir-version').click();
    VersionesPrevias.abrir = orig;
    return /SIN SELLAR/.test(window.__abierta || '');
  }), true);
await comprobar('5. la versión existe en _Previas (no sale «ya no está»)',
  pagina.locator('.hito-en-mesa .tcd-abrir-version').innerText().then((t) => /ya no está/.test(t)), false);

/* ===== 6. Nueva tarea con «Qué se hace»; Cambiar; Pasar a la guía ===== */
console.log('--- 6. «Qué se hace» ---');
await pagina.locator('.hito-en-mesa .tcd-abrir-form').click();   /* fila 638: el formulario se abre con «+ Añadir tarea» */
await pagina.locator('#guion-nueva-tarea').fill('Registrar la entrada del acuse');
await pagina.locator('.hito-en-mesa .tcd-nueva .tcd-accion').selectOption('registrar');
await pagina.locator('.hito-en-mesa .tcd-nueva .guion-receta-sentido').selectOption('entrada');
await pagina.locator('.hito-en-mesa .tcd-anadir').click();
await pagina.waitForTimeout(1800);
const nueva = () => pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const g = Hitos.guionDe(a, h).filter((x) => x.texto === 'Registrar la entrada del acuse')[0];
  return g ? { propio: g.propio, accion: g.accion, receta: g.receta, id: g.id } : null;
});
const n1 = await nueva();
await comprobar('6. la tarea nueva es «solo aquí», de registrar, con su dato', n1 && [n1.propio, n1.accion, n1.receta], [true, 'registrar', { sentido: 'entrada' }]);
await pagina.locator('.hito-en-mesa .tcd-abrir-form').click();
await comprobar('6. el formulario se cerró al añadir, y al abrirlo otra vez vuelve a «Otra cosa»', pagina.locator('.hito-en-mesa .tcd-nueva .tcd-accion').inputValue(), '');
await comprobar('6. sin elegir nada, una tarea nueva sale como siempre (sin acción)',
  (async () => {
    await pagina.locator('#guion-nueva-tarea').fill('Llamar a la familia');
    await pagina.locator('#guion-nueva-tarea').press('Enter');
    await pagina.waitForTimeout(1500);
    return pagina.evaluate(async () => {
      const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
      const h = (await Hitos.hitosDe(a.nombre))[0];
      const g = Hitos.guionDe(a, h).filter((x) => x.texto === 'Llamar a la familia')[0];
      return g ? [g.propio, g.accion, g.receta] : null;
    });
  })(), [true, '', null]);
await comprobar('6. la tarea de registrar nueva, pendiente y sin documento, ofrece «Elegir documento»',
  lineaDe(n1.id).locator('.tcd').innerText().then((t) => t.trim()), 'Elegir documento');
/* Cuelga un documento de ella, para ver que sigue a «Pasar a la guía». */
await lineaDe(n1.id).locator('.tcd-elegir').click();
await pagina.waitForSelector('.hito-en-mesa .tcd-selector');
await lineaDe(n1.id).locator('.tcd-selector').selectOption({ index: 1 });
await pagina.waitForTimeout(1200);
/* Cambiar: «Qué se hace» y su dato. */
await lineaDe(n1.id).locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar' }).first().click();
await pagina.waitForSelector('.hito-en-mesa .guion-tarea-editar .tcd-accion');
await comprobar('6. con «Cambiar» abierto, el documento de las otras tareas no cambia (sin «ya no está»)',
  pagina.$$eval('.hito-en-mesa .tcd', (l) => l.map((x) => /ya no está|\.docx/.test(x.innerText)).filter(Boolean).length), 0);
await comprobar('6. «Cambiar» enseña «Qué se hace» y su dato como están', pagina.evaluate(() => {
  const c = document.querySelector('.hito-en-mesa .guion-tarea-editar');
  return [c.querySelector('.tcd-accion').value, c.querySelector('.guion-receta-sentido').value];
}), ['registrar', 'entrada']);
await pagina.locator('.hito-en-mesa .guion-tarea-editar .guion-receta-sentido').selectOption('salida');
await pagina.locator('.hito-en-mesa .guion-tarea-editar-guardar').click();
await pagina.waitForTimeout(1500);
const n2 = await nueva();
await comprobar('6. «Cambiar» guarda el dato nuevo solo en este asunto', n2 && [n2.propio, n2.accion, n2.receta], [true, 'registrar', { sentido: 'salida' }]);
/* Pasar a la guía. */
await lineaDe(n1.id).locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Pasar a la guía' }).first().click();
await pagina.waitForTimeout(2500);
const trasPasar = await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const paso = GuiasDelCentro.pasosDe('CERTIFICADO DE NOTAS').filter((p) => p.id === h.origenGuia)[0];
  const enGuia = paso && paso.guion.filter((g) => g.texto === 'Registrar la entrada del acuse')[0];
  const g = Hitos.guionDe(a, h).filter((x) => x.texto === 'Registrar la entrada del acuse')[0];
  return { guia: enGuia ? [enGuia.accion, enGuia.receta] : null, propio: g ? g.propio : null, docEnAsunto: !!(g && h.guionDocumento && h.guionDocumento[g.id]), idCambio: g ? g.id !== undefined : false };
});
await comprobar('6. «Pasar a la guía» lleva «Qué se hace» y su dato a la guía', trasPasar.guia, ['registrar', { sentido: 'salida' }]);
await comprobar('6. la tarea ya no es «solo aquí» y el documento se queda en el asunto', [trasPasar.propio, trasPasar.docEnAsunto], [false, true]);

/* ===== 7. Cambiar una tarea de la guía ===== */
console.log('--- 7. «Cambiar» de una tarea de la guía ---');
await lineaDe('g-hacer-registrar').locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar' }).first().click();
await pagina.waitForSelector('.hito-en-mesa .guion-tarea-editar .tcd-accion');
await pagina.locator('.hito-en-mesa .guion-tarea-editar .guion-receta-sentido').selectOption('salida');
await pagina.locator('.hito-en-mesa .guion-tarea-editar-guardar').click();
await pagina.waitForTimeout(2500);
await comprobar('7. el cambio llega a la guía del tipo',
  pagina.evaluate(() => {
    const paso = GuiasDelCentro.pasosDe('CERTIFICADO DE NOTAS')[0];
    const g = paso.guion.filter((x) => x.id === 'g-hacer-registrar')[0];
    return [g.accion, g.receta];
  }), ['registrar', { sentido: 'salida' }]);

/* ===== 8. Un asunto de antes ===== */
console.log('--- 8. un asunto de antes ---');
await abrirMesa('Aguilar Ponce');
await comprobar('8. el asunto de antes se ve sin errores', pagina.locator('.hito-en-mesa .mesa-guion').count(), 1);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
