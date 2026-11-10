/* Prueba de la fila 571 (9-nov-2026, docs/571-PAPELETAS-CONSEJO-ESCOLAR.md): papeletas del Consejo Escolar.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. «Papeletas» en la tarjeta «Candidaturas»; la ventana lleva una fila por sector con admitidas y cruces; sin admitidas no deja escribir.
   2. La casilla «La AMPA ha designado representante» baja en uno las cruces de madres y padres.
   3. Sin papeletas en ningún sector, aviso y no se guarda nada.
   4. Con papeletas en dos sectores: dos PDF guardados (tipo PAPELETAS), 10 por hoja hasta 8 admitidas y 8 con más.
   5. Solo las admitidas, por apellidos, con grupo (Alumnado) o AMPA (Madres y padres); sin dígitos de DNI.
   6. Excluir una candidatura baja las admitidas.
   7. «Es de la AMPA» / «Ya no es de la AMPA» solo en Madres y padres.
   8. (fila 575) «¿Quién?»: la persona de la AMPA sale con la cruz ya puesta y «Marca hasta N cruces más»; con «Nadie», como antes. */
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const avisos = () => pagina.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const limpiarAvisos = () => pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((e) => e.remove()));

/* El asunto de las elecciones con candidaturas inventadas (la demo no tiene las nuestras). */
await pagina.evaluate(async () => {
  const T = 'ELECCIONES CONSEJO ESCOLAR';
  const tipo = await App.crearTipo({ nombre: T, categoria: 'OTROS' });
  const t = App.E.tipos.filter((x) => x.tipo === T)[0];
  t.candidaturas = true;
  const numero = (await Numeros.reservar('asuntos', '')).numero;
  const montado = Nombres.montarAsunto({ fecha: U.hoyIso(), tipo: Nombres.tipoParaCarpeta(t), categoria: 'OTROS', curso: '', grupo: '', campos: [], descripcion: '', tercero: 'ELECCIONES 2026', numero });
  await Carpetas.crear(App.E.abiertos, montado.nombre);
  await App.anotar(montado.nombre, { estado: 'abierto', tipo: t.tipo, categoria: 'OTROS', tercero: 'ELECCIONES 2026', descripcion: '', abiertoEl: U.ahora(), abiertoPor: 'Revisor', numero });
  await App.verAbiertos();
  window.__nombre = montado.nombre;
  const a = Gestor.asuntos().filter((x) => x.nombre === montado.nombre)[0];
  const gente = [
    ['ALUMNADO', 'Alcaide Rueda, Paula'], ['ALUMNADO', 'Benítez Gil, Hugo'], ['ALUMNADO', 'Cabello Ortiz, Lucía'],
    ['TUTORES LEGALES', 'Herrero Campos, Rocío'], ['TUTORES LEGALES', 'Iglesias Soto, Andrés'],
    ['PERSONAL', 'Marín Sáez, Ana'], ['PERSONAL', 'Navarro Díaz, Juan'], ['PERSONAL', 'Ocaña Ríos, Bea'], ['PERSONAL', 'Pardo León, Javi'],
    ['PERSONAL', 'Quesada Toro, Inés'], ['PERSONAL', 'Ramos Vela, Pedro'], ['PERSONAL', 'Salas Mena, Carmen'], ['PERSONAL', 'Téllez Bravo, Óscar'],
    ['PERSONAL', 'Urbano Cid, Laura']
  ];
  const sector = { ALUMNADO: 'Alumnado', 'TUTORES LEGALES': 'Madres y padres', PERSONAL: 'Profesorado' };
  for (let i = 0; i < gente.length; i++) {
    const p = { categoria: gente[i][0], nombre: gente[i][1] + ' 12345678Z', visible: gente[i][1], clave: 'prueba' + i };
    await Candidaturas.apuntar(a, p, sector[gente[i][0]], {});
  }
  window.__a = a;
});
const estado = (frag, e) => pagina.evaluate(async ([frag, e]) => {
  const a = window.__a;
  const c = Candidaturas.lista(a).filter((x) => x.persona.visible.indexOf(frag) !== -1)[0];
  await Candidaturas.cambiar(a, c.id, (x) => { x.estado = e; });
}, [frag, e]);
for (const f of ['Alcaide', 'Benítez', 'Herrero', 'Iglesias', 'Marín', 'Navarro', 'Ocaña', 'Pardo', 'Quesada', 'Ramos', 'Salas', 'Téllez', 'Urbano']) await estado(f, 'Admitida');
/* Cabello queda «Presentada»: no sale. */

await pagina.evaluate(() => App.abrirFicha(window.__a, 'abierto'));
await pagina.waitForSelector('#ficha-candidaturas', { state: 'attached', timeout: 15000 });
await pagina.evaluate(() => FichaTarjetas.abrir('candidaturas'));
await pagina.waitForSelector('#ficha-candidaturas .cand-bloque', { timeout: 15000 });

console.log('--- 1. el botón y la ventana ---');
await comprobar('1. «Papeletas» junto a «Lista de candidaturas»', pagina.evaluate(() => [!!document.getElementById('cand-papeletas'), document.getElementById('cand-papeletas').textContent]), [true, 'Papeletas']);
const unidades = await pagina.evaluate(async () => Datos.unidadesDistintas((await Datos.cargar(App.E.datos, 'ALUMNADO')).lista).length);
const grande = unidades === 0 || unidades >= 12;
const cruces = grande ? [5, 5, 8, 1] : [3, 4, 6, 1];
await pagina.click('#cand-papeletas');
await pagina.waitForSelector('#pap-designada');
await comprobar('1. título y una fila por sector', pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.querySelectorAll('.pap-tabla tbody tr').length]), ['Papeletas', 4]);
await comprobar('1. admitidas (Alumnado 2, Madres y padres 2, Profesorado 9, PAS 0)', pagina.evaluate(() => Array.from(document.querySelectorAll('.pap-tabla tbody tr')).map((t) => t.children[1].textContent.trim().split(' ')[0])), ['2', '2', '9', '0']);
await comprobar('1. cruces ya puestas según las unidades', pagina.evaluate(() => [0, 1, 2, 3].map((i) => +document.getElementById('pap-cruces-' + i).textContent)), cruces);
await comprobar('1. PAS sin admitidas no deja escribir; los demás sí', pagina.evaluate(() => [0, 1, 2, 3].map((i) => document.getElementById('pap-n-' + i).disabled)), [false, false, false, true]);

console.log('--- 2. la AMPA ha designado representante ---');
await pagina.check('#pap-designada');
await comprobar('2. madres y padres baja en uno', pagina.evaluate(() => +document.getElementById('pap-cruces-1').textContent), cruces[1] - 1);
await pagina.uncheck('#pap-designada');
await comprobar('2. desmarcada, lo devuelve', pagina.evaluate(() => +document.getElementById('pap-cruces-1').textContent), cruces[1]);

console.log('--- 3. sin papeletas ---');
await limpiarAvisos();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
const pdfs = () => pagina.evaluate(async () => (await Carpetas.ficheros(window.__a.handle)).filter((x) => /PAPELETAS/.test(x.nombre)).map((x) => x.nombre));
await comprobar('3. aviso y no se guarda nada', [(await avisos()).some((t) => /Escribe cuántas papeletas hacen falta en algún sector/.test(t)), (await pdfs()).length], [true, 0]);

console.log('--- 4. dos PDF ---');
await limpiarAvisos();
await pagina.click('#cand-papeletas');
await pagina.waitForSelector('#pap-n-0');
await pagina.fill('#pap-n-0', '25');
await pagina.fill('#pap-n-2', '17');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#mensajes .mensaje')).some((m) => /Papeletas guardadas/.test(m.textContent)), null, { timeout: 30000 });
const guardados = await pdfs();
await comprobar('4. dos PDF con nombre fijo', [guardados.length, guardados.every((n) => /^\d{6} PAPELETAS D\d{2}-\d+\.pdf$/.test(n))], [2, true]);
const paginas = await pagina.evaluate(async () => {
  const L = await PdfHerramientas.cargarPdfLib();
  const salida = [];
  for (const f of (await Carpetas.ficheros(window.__a.handle)).filter((x) => /PAPELETAS/.test(x.nombre))) {
    const doc = await L.PDFDocument.load(new Uint8Array(await (await f.handle.getFile()).arrayBuffer()));
    salida.push([doc.getTitle(), doc.getPageCount()]);
  }
  return salida.sort();
});
await comprobar('4. Alumnado: 2 admitidas, 25 papeletas, 10 por hoja = 3 hojas; Profesorado: 9 admitidas, 17, 8 por hoja = 3 hojas', paginas, [['Papeletas · Sector Alumnado', 3], ['Papeletas · Sector Profesorado', 3]]);
await comprobar('4. el aviso nombra los dos PDF, uno por línea', avisos().then((m) => { const t = m.filter((x) => /Papeletas guardadas/.test(x))[0] || ''; return [t.split('\n').length, /\(Alumnado\)/.test(t), /\(Profesorado\)/.test(t)]; }), [3, true, true]);
await comprobar('4. el visor lleva un botón por sector', pagina.evaluate(() => Array.from(document.querySelectorAll('.pap-sectores button')).map((b) => b.textContent)), ['Alumnado', 'Profesorado']);
await comprobar('4. la ventana recuerda lo escrito', (async () => { await pagina.evaluate(() => { Visor.cerrar(); FichaTarjetas.abrir('candidaturas'); }); await pagina.waitForSelector('#cand-papeletas', { state: 'visible' }); await pagina.click('#cand-papeletas'); await pagina.waitForSelector('#pap-n-0'); return pagina.evaluate(() => [document.getElementById('pap-n-0').value, document.getElementById('pap-n-2').value]); })(), ['25', '17']);
await pagina.click('#cuadro-cancelar');

console.log('--- 5. lo que sale en cada papeleta ---');
await comprobar('5. hojas: 10 hasta 8 admitidas, 8 con más', pagina.evaluate(() => [CandidaturasPapeletas.porHoja(8), CandidaturasPapeletas.porHoja(9)]), [10, 8]);
await comprobar('5. «Marca hasta N cruces» y «cruz» en singular', pagina.evaluate(() => [CandidaturasPapeletas.textoMarca(5), CandidaturasPapeletas.textoMarca(1)]), ['Marca hasta 5 cruces', 'Marca hasta 1 cruz']);
const sale = (s) => pagina.evaluate((s) => CandidaturasPapeletas.admitidasDe(Candidaturas.lista(window.__a), s, {}).map((c) => c.nombre), s);
await comprobar('5. Alumnado: solo las admitidas y por apellidos (la presentada no sale)', sale('Alumnado'), ['Alcaide Rueda, Paula', 'Benítez Gil, Hugo']);
await comprobar('5. ni DNI ni número escolar', pagina.evaluate(() => /\d/.test(JSON.stringify(Candidaturas.SECTORES.map((s) => CandidaturasPapeletas.admitidasDe(Candidaturas.lista(window.__a), s, {}).map((c) => [c.nombre, c.derecha]))))), false);

console.log('--- 6. excluir una candidatura ---');
await estado('Alcaide', 'Excluida');
await comprobar('6. sale una admitida menos', sale('Alumnado'), ['Benítez Gil, Hugo']);
await estado('Alcaide', 'Admitida');

console.log('--- 7. «Es de la AMPA» ---');
await pagina.evaluate(() => CandidaturasFicha.repintar());
await pagina.waitForTimeout(800);
const menu = (frag) => pagina.locator('.cand-fila', { hasText: frag }).locator('.cand-menu button').first();
async function opciones(frag) {
  await menu(frag).click();
  const t = await pagina.locator('.cand-fila', { hasText: frag }).locator('.fila-menu button').allTextContents();
  await pagina.keyboard.press('Escape');
  await pagina.click('h1, header', { force: true }).catch(() => {});
  return t;
}
await comprobar('7. en Madres y padres el ⋮ ofrece «Es de la AMPA»', (await opciones('Herrero')).includes('Es de la AMPA'), true);
await comprobar('7. en Alumnado no la ofrece', (await opciones('Alcaide')).includes('Es de la AMPA'), false);
await menu('Herrero').click();
await pagina.locator('.cand-fila', { hasText: 'Herrero' }).locator('.fila-menu button', { hasText: 'Es de la AMPA' }).click();
await pagina.waitForSelector('#cand-ampa');
await pagina.fill('#cand-ampa', 'AMPA Los Olivos');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('7. la fila enseña la etiqueta', pagina.locator('.cand-fila', { hasText: 'Herrero' }).locator('.cand-ampa').textContent(), 'AMPA Los Olivos');
await comprobar('7. en la papeleta sale a la derecha del nombre', pagina.evaluate(() => CandidaturasPapeletas.admitidasDe(Candidaturas.lista(window.__a), 'Madres y padres', {}).map((c) => [c.nombre, c.derecha])), [['Herrero Campos, Rocío', 'AMPA Los Olivos'], ['Iglesias Soto, Andrés', '']]);
await comprobar('7. «Ya no es de la AMPA» lo quita', (async () => {
  await menu('Herrero').click();
  await pagina.locator('.cand-fila', { hasText: 'Herrero' }).locator('.fila-menu button', { hasText: 'Ya no es de la AMPA' }).click();
  await pagina.waitForTimeout(1500);
  return pagina.locator('.cand-fila', { hasText: 'Herrero' }).locator('.cand-ampa').count();
})(), 0);

console.log('--- 8. el representante de la AMPA en la papeleta (fila 575) ---');
await pagina.evaluate(() => CandidaturasFicha.repintar());
await pagina.waitForTimeout(800);
await menu('Herrero').click();
await pagina.locator('.cand-fila', { hasText: 'Herrero' }).locator('.fila-menu button', { hasText: 'Es de la AMPA' }).click();
await pagina.waitForSelector('#cand-ampa');
await pagina.fill('#cand-ampa', 'AMPA Los Olivos');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => { CandidaturasPapeletas.olvidar(); });
await pagina.click('#cand-papeletas');
await pagina.waitForSelector('#pap-designada');
await comprobar('8. el desplegable está oculto sin la casilla', pagina.evaluate(() => document.getElementById('pap-quien-caja').hidden), true);
await pagina.check('#pap-designada');
await comprobar('8. al marcar la casilla sale «¿Quién?»', pagina.evaluate(() => [document.getElementById('pap-quien-caja').hidden, document.querySelector('label[for=pap-quien]').textContent]), [false, '¿Quién?']);
await comprobar('8. opciones: las dos admitidas y «Nadie»; viene elegida la de la AMPA', pagina.evaluate(() => {
  const s = document.getElementById('pap-quien');
  return [Array.from(s.options).map((o) => o.textContent), s.selectedOptions[0].textContent];
}), [['Herrero Campos, Rocío', 'Iglesias Soto, Andrés', 'Nadie (no sale en la papeleta)'], 'Herrero Campos, Rocío']);
await pagina.uncheck('#pap-designada');
await comprobar('8. al desmarcar se oculta otra vez', pagina.evaluate(() => document.getElementById('pap-quien-caja').hidden), true);
await pagina.check('#pap-designada');
await pagina.fill('#pap-n-1', '10');
await pagina.evaluate(async () => {
  const L = await PdfHerramientas.cargarPdfLib();
  window.__dib = [];
  const t = L.PDFPage.prototype.drawText, l = L.PDFPage.prototype.drawLine;
  L.PDFPage.prototype.drawText = function (x, o) { window.__dib.push(['t', x]); return t.call(this, x, o); };
  L.PDFPage.prototype.drawLine = function (o) { window.__dib.push(['l']); return l.call(this, o); };
});
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#mensajes .mensaje')).some((m) => /Papeletas guardadas/.test(m.textContent) && /Madres y padres/.test(m.textContent)), null, { timeout: 30000 });
const dib = await pagina.evaluate(() => window.__dib);
const grande2 = grande ? 4 : 3;
await comprobar('8. arriba pone «Marca hasta N cruces más» (ya rebajada en uno)', dib.some((d) => d[0] === 't' && d[1] === 'Marca hasta ' + grande2 + ' cruces más'), true);
await comprobar('8. la AMPA sale con su nombre a la derecha, y la cruz (dos líneas) en cada una de las 10 papeletas', [dib.some((d) => d[0] === 't' && d[1] === 'AMPA Los Olivos'), dib.filter((d) => d[0] === 'l').length], [true, 20]);
await comprobar('8. «Marca hasta N cruces» sin «más» si se pregunta con «Nadie»', pagina.evaluate(() => [CandidaturasPapeletas.textoMarca(4, true), CandidaturasPapeletas.textoMarca(4, false), CandidaturasPapeletas.textoMarca(1, true)]), ['Marca hasta 4 cruces más', 'Marca hasta 4 cruces', 'Marca hasta 1 cruz más']);
await pagina.evaluate(() => { Visor.cerrar(); FichaTarjetas.abrir('candidaturas'); });
await pagina.waitForSelector('#cand-papeletas', { state: 'visible' });
await pagina.click('#cand-papeletas');
await pagina.waitForSelector('#pap-quien');
await comprobar('8. la ventana recuerda la casilla y a quién', pagina.evaluate(() => [document.getElementById('pap-designada').checked, document.getElementById('pap-quien').selectedOptions[0].textContent]), [true, 'Herrero Campos, Rocío']);
await pagina.selectOption('#pap-quien', '');
await pagina.evaluate(() => { window.__dib = []; });
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__dib.length > 0, null, { timeout: 30000 });
const dib2 = await pagina.evaluate(() => window.__dib);
await comprobar('8. con «Nadie»: sin «más», sin cruz y sin nombre de la AMPA marcada', [dib2.some((d) => d[0] === 't' && d[1] === 'Marca hasta ' + grande2 + ' cruces'), dib2.some((d) => d[0] === 't' && /más$/.test(d[1])), dib2.filter((d) => d[0] === 'l').length], [true, false, 0]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
