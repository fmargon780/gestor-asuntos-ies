/* Fila 249 (1-oct-2026, docs/POR-LIQUIDAR.md): los asuntos «Por liquidar». Con
   Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1):
   el seguro escolar es un tipo «Hay que liquidarlo antes de archivar»; tres
   asuntos ya están en «Por liquidar» (1,12 €, 1,12 € y uno sin importe) y un
   cuarto sigue abierto.

   1. La pestaña existe, con su número; esos asuntos no están en «En Administración».
   2. Marcar: «Marcados: 3 asuntos · Total: 2,24 € (1 sin importe)»; la casilla de la
      cabecera marca y desmarca todos.
   3. El botón de la ficha dice «Pasar a Por liquidar» (y «Archivar el asunto» en otro tipo).
   4. Dar por hecho el último hito pasa el asunto solo, con «Deshacer».
   5. «Liquidar»: el cuadro, el PDF en cada carpeta, el registro, el ARCHIVO.
   6. Reabrir uno: vuelve a abierto, sin «Por liquidar», y el PDF sigue.
   7. A 1280 px, las cinco pestañas caben y la tabla no desborda.
   8. Sin ningún tipo con la casilla, la pestaña no existe. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const filas = () => pagina.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')].map((t) => t.dataset.asunto));
const cuentaPestana = (p) => pagina.evaluate((p) => { const b = document.querySelector('.inicio-pestana[data-pestana="' + p + '"]'); return b && !b.classList.contains('oculto') ? b.querySelector('.cuenta-lista').textContent : null; }, p);
async function irAPestana(p) {
  await pagina.click('.inicio-pestana[data-pestana="' + p + '"]');
  await pagina.waitForTimeout(500);
}
const tercerosDe = (nombres) => nombres.map((n) => n.replace(/^\d+ A\d+-\d+ /, ''));

/* ===== 1. La pestaña ===== */

await comprobar('1. la pestaña «Por liquidar» sale, con 3', cuentaPestana('liq'), '3');
await irAPestana('adm');
await comprobar('1. los del seguro escolar no están en «En Administración»', filas().then((f) => f.filter((n) => /SEGURO/.test(n) && /Bermúdez|Castro|Duarte/.test(n)).length), 0);
await irAPestana('todos');
await comprobar('1. sí están en «Todos los abiertos»', filas().then((f) => f.filter((n) => /Bermúdez|Castro Reina|Duarte/.test(n)).length), 3);
await irAPestana('liq');
await comprobar('1. la tabla de «Por liquidar» lleva sus 3 filas', filas().then((f) => f.length), 3);
await comprobar('1. con su cabecera: casilla, Tercero, Tipo, Por liquidar desde, Importe',
  pagina.evaluate(() => [...document.querySelectorAll('#inicio-thead-liquidar th')].map((t) => t.textContent.trim())),
  ['', 'Tercero', 'Tipo', 'Por liquidar desde', 'Importe']);
await comprobar('1. y sin la cabecera normal', pagina.evaluate(() => getComputedStyle(document.getElementById('inicio-thead-normal')).display), 'none');

/* ===== 2. Marcar y sumar ===== */

await comprobar('2. sin nada marcado: «Marcados: 0 asuntos…» y «Liquidar» apagado',
  pagina.evaluate(() => ({ t: document.getElementById('inicio-liquidar-marcados').textContent, apagado: document.getElementById('inicio-liquidar-boton').disabled })),
  { t: 'Marcados: 0 asuntos · Total: 0,00 €', apagado: true });
const casillas = pagina.locator('#inicio-tabla-cuerpo .liq-marca');
await casillas.nth(0).check(); await casillas.nth(1).check(); await casillas.nth(2).check();
await comprobar('2. con los tres marcados, el total dice lo que falta',
  pagina.locator('#inicio-liquidar-marcados').textContent(), 'Marcados: 3 asuntos · Total: 2,24 € (1 sin importe)');
await pagina.locator('#liq-todos').uncheck();
await comprobar('2. la casilla de la cabecera desmarca todos', pagina.locator('#inicio-liquidar-marcados').textContent().then((t) => t.slice(0, 19)), 'Marcados: 0 asuntos');
await pagina.locator('#liq-todos').check();
await comprobar('2. y los marca todos', pagina.locator('#inicio-liquidar-marcados').textContent().then((t) => t.slice(0, 19)), 'Marcados: 3 asuntos');
await comprobar('2. «Liquidar» se enciende', pagina.locator('#inicio-liquidar-boton').isDisabled(), false);

/* ===== 3. El botón de la ficha ===== */

await irAPestana('todos');
const abrirFichaDe = async (trozo) => {
  await pagina.locator('#inicio-tabla-cuerpo .tarjeta-nombre', { hasText: trozo }).first().click();
  await pagina.waitForSelector('#ficha-archivar button');
};
await abrirFichaDe('Esteban');
await comprobar('3. un seguro escolar: «Pasar a Por liquidar»', pagina.locator('#ficha-archivar button').textContent(), 'Pasar a Por liquidar');
await pagina.click('#ficha-volver');
await abrirFichaDe('Reservado');
await comprobar('3. otro tipo: «Archivar el asunto»', pagina.locator('#ficha-archivar button').textContent(), 'Archivar el asunto');
await pagina.click('#ficha-volver');

/* ===== 4. Dar por hecho el último hito ===== */

await abrirFichaDe('Esteban');
const claveEsteban = await pagina.evaluate(() => FichaNucleo.actual.nombre);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(300);
await pagina.locator('.hito .hito-titulo').first().click();
await pagina.waitForSelector('.hito-en-mesa .mesa-marcar-hecho');
await pagina.click('.hito-en-mesa .mesa-marcar-hecho');
await pagina.waitForTimeout(800);
await comprobar('4. aviso verde «Pasa a Por liquidar» con «Deshacer»',
  pagina.evaluate(() => [...document.querySelectorAll('.mensaje')].map((m) => m.textContent).filter((t) => /Por liquidar/.test(t)).length > 0 && !!document.querySelector('.mensaje-boton')), true);
await comprobar('4. el asunto está en «Por liquidar»', pagina.evaluate((c) => PorLiquidar.estaPorLiquidar(Gestor.asuntos().filter((a) => a.nombre === c)[0]), claveEsteban), true);
await comprobar('4. en la mesa no sale «Archivar el asunto»',
  pagina.evaluate(() => { const t = document.querySelector('.mesa-todo-hecho'); return { aviso: !!t, archivar: /Archivar el asunto/.test(document.querySelector('#ficha-guia').textContent.replace(/Archivar el asunto\s*$/, '') && (t ? t.textContent : '')) }; }),
  { aviso: true, archivar: false });
await comprobar('4. y en la cabecera de la ficha: «Por liquidar», ni «Listo para archivar» ni «Archivar el asunto»',
  pagina.evaluate(() => {
    const m = [...document.querySelectorAll('#pantalla-ficha .marca-hito, #ficha-asunto-cuerpo .marca-hito, #ficha-guia .marca-hito')].map((e) => e.textContent).join(' / ') + ' ' + document.querySelector('#ficha-asunto-cuerpo .ficha-marcas').textContent;
    return { marca: /Por liquidar/.test(m), listo: /Listo para archivar/.test(m), boton: document.querySelector('#ficha-archivar button').textContent };
  }), { marca: true, listo: false, boton: 'Ir a Por liquidar' });
await pagina.click('.mensaje-boton');
await pagina.waitForTimeout(800);
await comprobar('4. tras «Deshacer», la ficha abierta sigue diciendo «Pasar a Por liquidar»', pagina.locator('#ficha-archivar button').textContent(), 'Pasar a Por liquidar');
await comprobar('4. «Deshacer»: ya no está en «Por liquidar»', pagina.evaluate((c) => PorLiquidar.estaPorLiquidar(Gestor.asuntos().filter((a) => a.nombre === c)[0]), claveEsteban), false);
await comprobar('4. y su hito vuelve a estar sin hacer',
  pagina.evaluate(async (c) => { const hs = await Hitos.hitosDe(c); return hs[0].estado !== 'hecho'; }, claveEsteban), true);
/* Pasa otra vez, y lo desmarcado también lo devuelve. */
await pagina.evaluate(async (c) => { const a = Gestor.asuntos().filter((x) => x.nombre === c)[0]; await PorLiquidar.pasar(a, { auto: true }); }, claveEsteban);
await pagina.evaluate(async (c) => { const hs = await Hitos.hitosDe(c); await Hitos.marcar(c, hs[0].id, 'hecho', ''); }, claveEsteban);
await pagina.evaluate(() => InicioTabla.pintar());
await pagina.waitForTimeout(500);
await comprobar('4. un asunto que entró solo y con hito pendiente vuelve a su pestaña al repintar',
  pagina.evaluate(async (c) => { const hs = await Hitos.hitosDe(c); await Hitos.marcar(c, hs[0].id, 'pendiente', ''); await InicioTabla.pintar(); return PorLiquidar.estaPorLiquidar(Gestor.asuntos().filter((a) => a.nombre === c)[0]); }, claveEsteban), false);
await pagina.click('#ficha-volver').catch(() => {});

/* ===== 5. Liquidar ===== */

await irAPestana('liq');
await pagina.locator('#liq-todos').check();
await pagina.click('#inicio-liquidar-boton');
await pagina.waitForSelector('#liq-fecha');
const hoy = await pagina.evaluate(() => U.hoyIso());
await comprobar('5. el cuadro trae la fecha de hoy, quien ha entrado y quien ocupa Secretaría',
  pagina.evaluate(() => ({ f: document.getElementById('liq-fecha').value, e: document.getElementById('liq-entrega').value, r: document.getElementById('liq-recibe').value, usuario: App.E.usuario })).then((x) => ({ f: x.f, e: x.e === x.usuario, r: x.r })),
  { f: hoy, e: true, r: 'Reyes Palma, Fernando' });
await comprobar('5. dice el total', pagina.locator('#cuadro-cuerpo').textContent().then((t) => /3 asuntos · Total: 2,24 € \(1 sin importe\)/.test(t)), true);
await pagina.fill('#liq-nota', 'Dinero en efectivo');
const nombresMarcados = await filas();
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => [...document.querySelectorAll('.mensaje')].some((m) => /Liquidados y archivados/.test(m.textContent)), null, { timeout: 30000 });
await comprobar('5. aviso verde con el total', pagina.evaluate(() => [...document.querySelectorAll('.mensaje')].map((m) => m.textContent).filter((t) => /Liquidados/.test(t))[0].trim().slice(0, 56)), 'Liquidados y archivados 3 asuntos. Total: 2,24 €.');
await pagina.waitForTimeout(500);
await comprobar('5. «Por liquidar» queda vacía (la pestaña sigue: hay tipo)', cuentaPestana('liq'), '0');
await comprobar('5. ya no están en Asuntos abiertos',
  pagina.evaluate(async (ns) => { const r = []; for (const n of ns) r.push(await Carpetas.existe(App.E.abiertos, n)); return r; }, nombresMarcados), [false, false, false]);
const pdfs = await pagina.evaluate(async (ns) => {
  const salida = [];
  for (const n of ns) {
    const categoria = 'ALUMNADO';
    const terceros = await Carpetas.subcarpetas(await Carpetas.bajar(App.E.archivo, [categoria], false));
    let hallado = null;
    for (const tt of terceros) {
      const t = tt.nombre;
      const dirT = await Carpetas.bajar(App.E.archivo, [categoria, t], false);
      if (await Carpetas.existe(dirT, n)) {
        const dir = await dirT.getDirectoryHandle(n);
        const ficheros = [];
        for await (const [nombre, h] of dir.entries()) if (h.kind === 'file') ficheros.push(nombre);
        hallado = { t, ficheros };
      }
    }
    salida.push(hallado);
  }
  return salida;
}, nombresMarcados);
await comprobar('5. los tres están en el ARCHIVO', pdfs.map((p) => !!p), [true, true, true]);
await comprobar('5. cada carpeta guarda su LIQUIDACION D26-… .pdf',
  pdfs.map((p) => p && p.ficheros.filter((f) => /^\d{6} LIQUIDACION D\d{2}-\d{5}\.pdf$/.test(f)).length), [1, 1, 1]);
const bytesPdf = await pagina.evaluate(async ([n, t]) => {
  const dir = await (await Carpetas.bajar(App.E.archivo, ['ALUMNADO', t], false)).getDirectoryHandle(n);
  for await (const [nombre, h] of dir.entries()) if (/LIQUIDACION/.test(nombre)) { const f = await h.getFile(); return Array.from(new Uint8Array(await f.arrayBuffer())); }
  return [];
}, [nombresMarcados[0], pdfs[0].t]);
await comprobar('5. el PDF es un PDF de verdad con una página', pagina.evaluate(async (b) => {
  const PDFLib = await PdfHerramientas.cargarPdfLib();
  const d = await PDFLib.PDFDocument.load(new Uint8Array(b));
  return { cabecera: String.fromCharCode(...b.slice(0, 5)), paginas: d.getPageCount(), titulo: d.getTitle() };
}, bytesPdf), { cabecera: '%PDF-', paginas: 1, titulo: 'Liquidación del ' + hoy.split('-').reverse().join('/') });
await comprobar('5. el tipo de documento LIQUIDACION se ha dado de alta', pagina.evaluate(() => App.E.tiposDocumento.indexOf('LIQUIDACION') !== -1), true);

/* ===== 6. Reabrir uno ===== */

const reabierto = await pagina.evaluate(async ([n, t]) => {
  const dirT = await Carpetas.bajar(App.E.archivo, ['ALUMNADO', t], false);
  const a = { nombre: n, padre: dirT, ficha: { categoria: 'ALUMNADO', tercero: t, estado: 'cerrado' }, leido: Nombres.leer ? (Nombres.leer(n) || {}) : {} };
  const esperar = App.reabrirAsunto(a);
  await new Promise((r) => setTimeout(r, 300));
  document.getElementById('cuadro-aceptar').click();
  await esperar;
  const ab = Gestor.asuntos().filter((x) => x.nombre === n)[0];
  const ficheros = [];
  for await (const [nombre, h] of (await App.E.abiertos.getDirectoryHandle(n)).entries()) ficheros.push(nombre);
  return { abierto: !!ab, porLiquidar: ab ? PorLiquidar.estaPorLiquidar(ab) : null, pdf: ficheros.some((f) => /LIQUIDACION/.test(f)) };
}, [nombresMarcados[0], pdfs[0].t]);
await comprobar('6. reabierto: vuelve a abiertos, no en «Por liquidar», y el PDF sigue en su carpeta', reabierto, { abierto: true, porLiquidar: false, pdf: true });

/* ===== 7. A 1280 px ===== */

await pagina.evaluate(() => App.verAbiertos());
await pagina.waitForTimeout(500);
await irAPestana('liq');
await comprobar('7. cinco pestañas, a 1280 px caben en una fila y la tabla no desborda',
  pagina.evaluate(() => {
    const p = document.getElementById('inicio-pestanas');
    const botones = [...p.querySelectorAll('.inicio-pestana')].filter((b) => !b.classList.contains('oculto'));
    const tops = new Set(botones.map((b) => Math.round(b.getBoundingClientRect().top)));
    return { n: botones.length, unaFila: tops.size === 1, paginaAncha: document.documentElement.scrollWidth <= window.innerWidth,
      tabla: !document.querySelector('.inicio-tabla-envoltorio').classList.contains('desborda') };
  }), { n: 5, unaFila: true, paginaAncha: true, tabla: true });

/* ===== 8. Sin tipos que liquidar ===== */

await pagina.evaluate(async () => { App.E.tipos.forEach((t) => { t.liquidar = false; }); await App.guardarTipos(); });
await pagina.evaluate(() => InicioTabla.pintar());
await pagina.waitForTimeout(500);
await comprobar('8. sin tipos con la casilla (y sin asuntos), la pestaña no está', cuentaPestana('liq'), null);
await comprobar('8. y se vuelve a «Todos los abiertos»', pagina.evaluate(() => InicioTabla._pestanaActual()), 'todos');

/* La casilla de Ajustes: se marca en el tipo, se guarda sola y vuelve la pestaña. */
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(400);
await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'SEGURO ESCOLAR' }).locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
const casilla = pagina.locator('#pantalla-tipo-asunto label.interruptor', { hasText: 'Hay que liquidarlo antes de archivar' }).locator('input');
await comprobar('8. Ajustes: el tipo lleva la casilla «Hay que liquidarlo antes de archivar», desmarcada', casilla.isChecked(), false);
await casilla.evaluate((el) => { el.checked = true; el.dispatchEvent(new Event('change')); });
await pagina.waitForTimeout(500);
await comprobar('8. al marcarla se guarda en el tipo', pagina.evaluate(() => App.E.tipos.filter((t) => t.tipo === 'SEGURO ESCOLAR')[0].liquidar), true);
await pagina.click('.pestana[data-pantalla="abiertos"]').catch(() => pagina.evaluate(() => App.verAbiertos()));
await pagina.waitForTimeout(600);
await comprobar('8. y la pestaña «Por liquidar» vuelve a salir (fila 253: sin asuntos que pasen solos, con 0)', cuentaPestana('liq'), '0');
await casilla.evaluate((el) => { el.checked = false; el.dispatchEvent(new Event('change')); });
await pagina.waitForTimeout(400);
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(600);
await comprobar('8. desmarcada otra vez desde Ajustes, la pestaña se va aunque queden asuntos', cuentaPestana('liq'), null);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await pagina.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
