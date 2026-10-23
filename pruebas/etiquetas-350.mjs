/* Prueba de la fila 350 (15-oct-2026, docs/ETIQUETAS-BUSCADOR-VERTICAL-FILTRO.md): buscador de personas, texto colocado
   arriba, en el centro o abajo, filtro que se escribe y lista con casillas. Chromium real con la copia de pruebas.

   1. Buscador: con 2 letras no sale nada; con 3 salen las personas que lo contienen; elegir una, sin filtro, deja una sola
      etiqueta; elegirla otra vez no la repite; con un filtro de unidad, la elegida se suma.
   2. Lista con casillas: todas marcadas; desmarcar dos baja la cuenta y las etiquetas en dos; «Desmarcar todas» deja 0.
   3. Filtro que se escribe: la caja de unidad enseña solo lo que contiene lo escrito; Intro elige.
   4. Colocar el texto: el editor guarda `vertical`; en el PDF, «Abajo» deja el último renglón a RELLENO_MM del borde de abajo,
      «Arriba» el primero a RELLENO_MM del de arriba y sin `vertical` sale como «Centro».
   5. Personal: la caja del departamento se escribe.
   6. El filtro común: lo desmarcado no cuenta en f.personas() ni en la lista que se exporta. */
import { chromium } from 'playwright';
import { tarjetasSolas } from './apoyo/etiquetas-tarjetas.mjs';

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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
tarjetasSolas(pagina);
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const resumen = () => pagina.locator('#et-resumen').textContent();
const escribir = async (id, texto) => { await pagina.fill('#' + id, texto); };
async function abrirEtiquetas() {
  await pagina.evaluate(() => App.ir('herramientas'));
  await pagina.waitForSelector('#bloque-etiquetas');
  await pagina.evaluate(() => { document.getElementById('bloque-etiquetas').open = true; });
  await pagina.click('#etiquetas-abrir');
  await pagina.waitForSelector('.et-hoja');
  await pagina.waitForTimeout(300);
}

/* Los datos de la prueba: quién contiene «ver» y a quién usar. */
const datos = await pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const m = (f.lista || []).filter((p) => p.matriculado);
  const norm = (t) => U.normalizar(String(t || ''));
  const ver = m.filter((p) => norm(p.nombre).indexOf('ver') !== -1).map((p) => p.nombre);
  const dosB = m.filter((p) => p.unidad === '2º B').map((p) => p.nombre);
  const fuera = m.filter((p) => p.unidad !== '2º B')[0];
  return { total: m.length, ver, dosB, fuera: fuera.nombre, fueraUnidad: fuera.unidad };
});
console.log('(datos: ' + datos.total + ' alumnos; ' + datos.ver.length + ' con «ver»; 2º B: ' + datos.dosB.length + ')');

console.log('--- 1. el buscador ---');
await abrirEtiquetas();
await comprobar('1. al abrir, sin filtro, no sale nadie y la hoja lo dice (fila 450)', [await resumen(), await pagina.locator('.et-vacio').textContent()],
  ['0 personas · 0 etiquetas', 'Elige un grupo, busca personas o pega una lista.']);
await escribir('et-buscar-persona', 've');
await comprobar('1. con 2 letras no sale nadie y se dice', pagina.evaluate(() => [document.querySelectorAll('#et-buscar-persona ~ .csg-lista li[data-i]').length, document.querySelector('#et-buscar-persona ~ .csg-lista').textContent]), [0, 'Escribe al menos 3 letras.']);
await escribir('et-buscar-persona', 'ver');
const salen = await pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#et-buscar-persona ~ .csg-lista li[data-i] span:first-child'), (s) => s.textContent));
await comprobar('1. con 3 letras salen las personas que lo contienen (hasta 10)', salen.slice().sort(), datos.ver.slice(0, 10).sort());
await escribir('et-buscar-persona', datos.fuera.split(',')[0].slice(0, 6));
await pagina.press('#et-buscar-persona', 'Enter');
await comprobar('1. elegir a alguien, sin filtro: solo sale esa persona', resumen(), '1 persona · 1 etiqueta');
await comprobar('1. la caja se vacía y la persona sale en la lista como añadida', pagina.evaluate(() => [document.getElementById('et-buscar-persona').value, document.querySelectorAll('#et-lista .cc-lista li').length, !!document.querySelector('#et-lista .cc-marca')]), ['', 1, true]);
await escribir('et-buscar-persona', datos.fuera.split(',')[0].slice(0, 6));
await pagina.press('#et-buscar-persona', 'Enter');
await comprobar('1. elegirla otra vez no la repite y lo dice en gris', [await resumen(), await pagina.locator('#et-buscar-aviso').textContent()], ['1 persona · 1 etiqueta', 'Ya está en la lista.']);
await pagina.evaluate(() => { document.querySelector('.repartir-filtro').open = true; });
await pagina.fill('#rf-unidad', '2º B');
await pagina.press('#rf-unidad', 'Enter');
await pagina.waitForSelector('.bd-grupo-cond');
const esperado1 = datos.dosB.length + (datos.fueraUnidad === '2º B' ? 0 : 1);
await comprobar('1. con el filtro de 2º B, la elegida se suma a las de la unidad', resumen(), esperado1 + ' personas · ' + esperado1 + ' etiquetas');

console.log('--- 2. la lista con casillas ---');
await comprobar('2. todas marcadas', pagina.evaluate(() => [document.querySelectorAll('#et-lista .cc-lista input').length, document.querySelectorAll('#et-lista .cc-lista input:checked').length, document.querySelector('#et-lista .cc-cuenta').textContent]), [esperado1, esperado1, esperado1 + ' de ' + esperado1 + ' marcadas']);
await pagina.uncheck('#et-lista .cc-lista input >> nth=0');
await pagina.uncheck('#et-lista .cc-lista input >> nth=1');
await comprobar('2. desmarcar dos baja la cuenta y las etiquetas en dos', [await pagina.locator('#et-lista .cc-cuenta').textContent(), await resumen()], [(esperado1 - 2) + ' de ' + esperado1 + ' marcadas', (esperado1 - 2) + ' personas · ' + (esperado1 - 2) + ' etiquetas']);
await pagina.click('#et-lista [data-cc="ninguna"]');
await comprobar('2. «Desmarcar todas» deja 0', resumen(), '0 personas · 0 etiquetas');
await pagina.click('#et-lista [data-cc="todas"]');
await comprobar('2. «Marcar todas» las devuelve', resumen(), esperado1 + ' personas · ' + esperado1 + ' etiquetas');
await pagina.click('#et-lista [data-cc-quitar]');
await comprobar('2. la ✕ de la añadida la quita', resumen(), datos.dosB.length + ' personas · ' + datos.dosB.length + ' etiquetas');

console.log('--- 3. el filtro se escribe ---');
await pagina.click('#rf-nivel');
const todos = await pagina.evaluate(() => document.querySelectorAll('#rf-nivel ~ .csg-lista li[data-i]').length);
await pagina.fill('#rf-nivel', '2');
const con2 = await pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#rf-nivel ~ .csg-lista li[data-i]'), (l) => l.textContent));
await comprobar('3. al escribir salen solo los niveles que lo contienen', con2.length > 0 && con2.length < todos && con2.every((t) => t.indexOf('2') !== -1), true);
await pagina.press('#rf-nivel', 'Enter');
await comprobar('3. Intro lo pone como criterio', pagina.evaluate(() => document.querySelectorAll('.bd-grupo-cond').length), 2);

console.log('--- 4. colocar el texto ---');
await pagina.click('#et-diseno-nuevo');
await pagina.fill('#ed-nombre', 'Abajo');
await pagina.click('[data-vertical="abajo"]');
await comprobar('4. el botón «Abajo» queda marcado', pagina.evaluate(() => document.querySelector('[data-vertical="abajo"]').classList.contains('et-activa')), true);
await pagina.click('#ed-guardar');
await pagina.waitForSelector('#et-diseno');
await comprobar('4. el diseño guardado lleva vertical: abajo y la lista lo dice', pagina.evaluate(async () => [(await Carpetas.leerJson(App.E.gestor, 'etiquetas.json')).disenos[0].vertical, document.querySelector('.et-renglones-ver').textContent.indexOf('Texto abajo') !== -1]), ['abajo', true]);

const geometria = (vertical) => pagina.evaluate(async (vertical) => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const persona = f.lista.filter((p) => p.matriculado)[0];
  const modelo = EtiquetasModelos.todos().filter((m) => m.id === 'avery-L7159')[0];
  const base = EtiquetasDisenos.integrados()[1];   // Alumno: tres renglones
  const diseno = Object.assign({}, base); if (vertical) diseno.vertical = vertical;
  const medir = await EtiquetasPdf.medidor();
  const items = EtiquetasHoja.construir([persona], 'alumnado', diseno, { copias: 1, ctx: {} });
  const pag = EtiquetasHoja.paginar(items, modelo, {});
  const prep = EtiquetasHoja.preparar(items, diseno, modelo, medir);
  const bytes = await EtiquetasPdf.generar(pag, modelo, prep);
  const L = await PdfHerramientas.cargarPdfLib();
  const d = await L.PDFDocument.load(bytes);
  const c = d.getPage(0).node.Contents();
  const lista = c instanceof L.PDFArray ? c.asArray().map((r) => d.context.lookup(r)) : [c];
  const texto = lista.map((st) => new TextDecoder('latin1').decode(st.dict.get(L.PDFName.of('Filter')) ? L.decodePDFRawStream(st).decode() : st.contents)).join('\n');
  const tm = [...texto.matchAll(/1 0 0 1 ([\d.\-]+) ([\d.\-]+) Tm/g)].map((m) => Number(m[2]));
  const tf = [...texto.matchAll(/\/\S+ ([\d.]+) Tf/g)].map((m) => Number(m[1]));
  const g = EtiquetasModelos.geometria(modelo), MM = 72 / 25.4;
  return { baselines: tm, tamanos: tf, H: g.hojaAlto * MM, yArriba: g.y0 * MM, alto: g.alto * MM, relleno: EtiquetasDisenos.RELLENO_MM * MM };
}, vertical);
const abajo = await geometria('abajo'), arriba = await geometria('arriba'), centro = await geometria('centro'), sin = await geometria('');
const cerca = (a, b) => Math.abs(a - b) < 0.06;
const ultimo = (r) => { const i = r.baselines.length - 1; return r.baselines[i] - 0.25 * r.tamanos[i]; };   // borde de abajo del último renglón (en el PDF, y crece hacia arriba)
await comprobar('4. «Abajo»: el último renglón termina a RELLENO_MM del borde de abajo de la etiqueta', cerca(ultimo(abajo) - (abajo.H - (abajo.yArriba + abajo.alto)), abajo.relleno), true);
await comprobar('4. «Arriba»: el primer renglón empieza a RELLENO_MM del borde de arriba', cerca((arriba.H - arriba.yArriba) - (arriba.baselines[0] + 0.95 * arriba.tamanos[0]) , arriba.relleno), true);
await comprobar('4. sin «vertical» sale como «Centro» (mismas posiciones)', JSON.stringify(sin.baselines), JSON.stringify(centro.baselines));
await comprobar('4. «Abajo» y «Arriba» no colocan igual', JSON.stringify(abajo.baselines) !== JSON.stringify(arriba.baselines), true);

console.log('--- 5. personal ---');
await pagina.click('[data-clase="personal"]');
await pagina.waitForSelector('#et-pdepto');
await pagina.click('#et-pdepto');
const deptosTodos = await pagina.evaluate(() => document.querySelectorAll('#et-pdepto ~ .csg-lista li[data-i]').length);
await pagina.fill('#et-pdepto', 'mat');
const conMat = await pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#et-pdepto ~ .csg-lista li[data-i]'), (l) => l.textContent));
await comprobar('5. al escribir «mat» sale Matemáticas y menos que sin escribir', [conMat.includes('Matemáticas'), conMat.length < deptosTodos], [true, true]);
await pagina.press('#et-pdepto', 'Enter');
await comprobar('5. Intro lo elige', resumen(), '1 persona · 1 etiqueta');

console.log('--- 6. el filtro común: lo desmarcado no cuenta ---');
const f6 = await pagina.evaluate(async () => {
  const fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const f = await RepartirFiltro.crear({ lista: fuente.lista.filter((p) => p.matriculado) }, []);
  f.conds.push({ tipo: 'unidad', valor: '2º B' });
  const todas = f.todas().length;
  f.desmarcadas[f.clave(f.todas()[0])] = true; f.cacheMarcadas = null;
  return { todas: todas, marcadas: f.personas().length, nombres: f.nombres().length, exportadas: FiltroExportar.listaDeAlumnado(f).filas.length,
           entra: f.entra(App.textoTercero(f.todas()[0])), html: RepartirFiltro.html(f).indexOf('cc-lista') !== -1 };
});
await comprobar('6. una desmarcada: baja personas(), nombres(), entra() y lo exportado, y la lista sale', f6, { todas: datos.dosB.length, marcadas: datos.dosB.length - 1, nombres: datos.dosB.length - 1, exportadas: datos.dosB.length - 1, entra: false, html: true });

console.log('--- 7. más de 200 personas: salen todas (fila 373) ---');
const f7 = await pagina.evaluate(() => {
  const items = []; const desmarcadas = {};
  for (let i = 1; i <= 300; i++) items.push({ clave: 'p' + i, texto: 'Alumno ' + i });
  const caja = document.createElement('div'); document.body.appendChild(caja);
  let cambios = 0;
  const pintar = () => { caja.innerHTML = ListaConCasillas.html(items, desmarcadas, { id: 'et' }); ListaConCasillas.enganchar(caja, items, desmarcadas, { alCambiar: () => { cambios++; pintar(); } }); };
  pintar();
  const salen = caja.querySelectorAll('.cc-lista input').length;
  const sinMas = caja.textContent.indexOf('más (cuentan igual)') === -1;
  const ultima = caja.querySelector('[data-cc-clave="p300"]');
  ultima.scrollIntoView();
  ultima.click();
  const tras = caja.querySelector('.cc-cuenta').textContent;
  const sigueAbajo = caja.querySelector('.cc-lista').scrollTop > 0;
  caja.querySelector('[data-cc="ninguna"]').click();
  const ninguna = caja.querySelector('.cc-cuenta').textContent;
  caja.querySelector('[data-cc="todas"]').click();
  const todas = caja.querySelector('.cc-cuenta').textContent;
  caja.remove();
  return { salen, sinMas, tras, sigueAbajo, ninguna, todas };
});
await comprobar('7. con 300 personas salen las 300, sin «más (cuentan igual)», desmarcar la última baja la cuenta en uno y la lista no vuelve arriba, y «Marcar todas» / «Desmarcar todas» valen con todas', Promise.resolve(f7),
  { salen: 300, sinMas: true, tras: '299 de 300 marcadas', sigueAbajo: true, ninguna: '0 de 300 marcadas', todas: '300 de 300 marcadas' });

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
