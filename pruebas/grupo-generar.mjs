/* Fila 294 (docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md): «Generar para todos» enseña una muestra, deja el PDF de cada
   persona con su «Ref.» escrita como texto, y «Volver a generar». Chromium real, con la copia de pruebas (?demo=1&auto=1),
   en el asunto de grupo «GRUPO 2ºB».

   1. La muestra: franja con «Así queda el de <persona>. Se van a hacer N iguales…», «Generar los N» y «Cancelar».
   2. «Cancelar»: la carpeta no cambia.
   3. «Generar los N»: sale «Generando … de N…»; N PDF y ningún Word suelto; los N Word en «Versiones previas»; cada PDF trae
      su «Ref.» (el número de su nombre) como texto, en todas sus páginas; la tabla abre el PDF.
   4. Volver a pulsar con la misma plantilla: no hay muestra y no repite ninguno.
   5. «Parar» a medias; al volver a pulsar no se repite ninguno y se completan.
   6. Un Word sin PDF (el PDF falló): al volver a pulsar se le hace solo el PDF.
   7. «Volver a generar»: apagado con registro; con un documento sin registro lo manda a la papelera y lo rehace.
   8. El PDF de un Word de varias páginas lleva la «Ref.» en todas, las mismas páginas que «Guardar PDF», y «Guardar PDF»
      de un documento suelto no la lleva. */
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
async function nuevaPagina() {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });   /* fila 299: la demostración tarda un poco más en montarse */
  await p.waitForTimeout(3500);
  return p;
}
async function abrirTarjeta(p) {
  const n = await p.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
  await p.evaluate((x) => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === x)[0], 'abierto'), n);
  await p.waitForSelector('#pantalla-asunto:not(.oculto)');
  await p.waitForTimeout(1500);
  await p.evaluate(() => FichaTarjetas.abrir('relacionados'));
  await p.waitForSelector('.pg-tabla');
  /* La colocación sola del PDF sellado de la demostración (fila 294) acaba antes de empezar. */
  await p.waitForFunction(async (x) => !(await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(x))).some((f) => f.nombre === 'Certificado firmado 1.pdf'), n, { timeout: 20000 });
  await p.waitForTimeout(800);
  return n;
}
/* Los nombres de la carpeta del asunto y los de «Versiones previas». */
const carpeta = (p, n) => p.evaluate(async (x) => {
  const d = await App.E.abiertos.getDirectoryHandle(x);
  return (await Carpetas.ficheros(d)).map((f) => f.nombre).sort();
}, n);
const previas = (p, n) => p.evaluate(async (x) => {
  const d = await App.E.abiertos.getDirectoryHandle(x);
  return (await VersionesPrevias.listar(d)).map((f) => f.nombre).sort();
}, n);
/* El texto de cada página de un fichero de la carpeta, sin espacios. */
const textoPaginas = (p, n, nombre) => p.evaluate(async ([x, f]) => {
  const d = await App.E.abiertos.getDirectoryHandle(x);
  const t = await RegistroLector.textoPorPagina(await (await d.getFileHandle(f)).getFile());
  return t.map((s) => s.replace(/\s+/g, ''));
}, [n, nombre]);
const pulsarGenerar = async (p) => { await p.click('.pg-generar'); await p.locator('.pg-menu button', { hasText: 'Certificado de notas' }).click(); };
const hoy = (p) => p.evaluate(() => PersonasDelGrupo.fechaLarga(U.hoyIso()));

const pagina = await nuevaPagina();
const demo = await abrirTarjeta(pagina);
const antes = await carpeta(pagina, demo);
const previasAntes = await previas(pagina, demo);

/* ================= 1 y 2. LA MUESTRA, Y CANCELAR ================= */
console.log('--- 1 y 2. la muestra ---');
await pulsarGenerar(pagina);
await pagina.waitForSelector('.word-visor-franja .muestra-generar', { timeout: 30000 });
await pagina.waitForFunction(() => /Noa/.test(document.getElementById('word-visor').textContent), null, { timeout: 15000 });
await comprobar('1. la franja dice de quién es y cuántos se van a hacer, y trae sus dos botones',
  pagina.evaluate(() => [document.querySelector('.word-visor-franja').firstChild.textContent, document.querySelector('.muestra-generar').textContent, document.querySelector('.muestra-cancelar').textContent]),
  ['Así queda el de Castro Reina, Noa. Se van a hacer 8 iguales, uno por persona.', 'Generar los 8', 'Cancelar']);
await comprobar('1. el documento que se ve es el de la primera persona', pagina.evaluate(() => /Noa Castro Reina/.test(document.getElementById('word-visor').textContent)), true);
await pagina.click('.muestra-cancelar');
await pagina.waitForTimeout(800);
await comprobar('2. «Cancelar» cierra el visor y no deja nada en la carpeta ni en «Versiones previas»',
  Promise.all([pagina.evaluate(() => WordVisor.abierto()), carpeta(pagina, demo), previas(pagina, demo)]), [false, antes, previasAntes]);
await comprobar('2. la tabla sigue como estaba (la cuarta persona, sin nada)',
  pagina.locator('.pg-tabla tbody tr').nth(3).locator('td').allTextContents().then((c) => c[2]), '');

/* ================= 3. GENERAR LOS N ================= */
console.log('--- 3. generar los 8 ---');
await pagina.evaluate(() => {
  window.__textos = [];
  new MutationObserver(() => { const t = document.querySelector('.grupo-barra-texto'); if (t && window.__textos[window.__textos.length - 1] !== t.textContent) window.__textos.push(t.textContent); })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
});
await pulsarGenerar(pagina);
await pagina.waitForSelector('.word-visor-franja .muestra-generar', { timeout: 30000 });
await pagina.click('.muestra-generar');
await pagina.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
await comprobar('3. salió la barra «Generando … de 8…»', pagina.evaluate(() => window.__textos.some((t) => /^Generando \d de 8…$/.test(t))), true);
await comprobar('3. y se quitó al acabar', pagina.evaluate(() => !document.querySelector('.grupo-barra')), true);
await comprobar('3. el resumen dice ocho', pagina.locator('.generar-cada-resumen').textContent(), '8 documentos generados.');
await pagina.click('#cuadro-aceptar');
const fechaHoy = await hoy(pagina);
await pagina.waitForFunction((h) => [...document.querySelectorAll('.pg-tabla tbody tr')].every((r) => r.children[2].textContent.trim() === h), fechaHoy, { timeout: 20000 });
await comprobar('3. todas las filas llevan la fecha de hoy en «Generado»', pagina.locator('.pg-cuenta').textContent().then((t) => /8 generados/.test(t)), true);

const tras = await carpeta(pagina, demo);
const nuevos = tras.filter((n) => antes.indexOf(n) === -1);
await comprobar('3. ocho PDF nuevos en la carpeta y ningún Word nuevo suelto', [nuevos.filter((n) => /\.pdf$/.test(n)).length, nuevos.filter((n) => /\.docx$/.test(n)).length], [8, 0]);
const previasN = (await previas(pagina, demo)).filter((n) => previasAntes.indexOf(n) === -1);
await comprobar('3. los ocho Word, en «Versiones previas», con el mismo nombre', previasN.length === 8 && nuevos.every((n) => previasN.indexOf(n.replace(/\.pdf$/, '.docx')) !== -1), true);
let todasConRef = true, sinRef = [];
for (const n of nuevos.filter((x) => /\.pdf$/.test(x))) {
  const numero = (n.match(/D\d{2}-\d{5}/) || [''])[0];
  const paginas = await textoPaginas(pagina, demo, n);
  if (!paginas.length || !paginas.every((t) => t.indexOf('Ref.' + numero) !== -1)) { todasConRef = false; sinRef.push(n); }
}
await comprobar('3. cada PDF trae «Ref.» y el número de su nombre, como texto, en todas sus páginas ' + sinRef.join(','), todasConRef, true);
await comprobar('3. la tabla ya no ofrece el Word: la fecha de la primera fila abre su PDF',
  pagina.locator('.pg-tabla tbody tr').first().locator('.pg-abrir').getAttribute('data-fichero').then((f) => /\.pdf$/.test(f)), true);

/* ================= 4. LA MISMA PLANTILLA OTRA VEZ ================= */
console.log('--- 4. otra vez, sin repetir ---');
await pulsarGenerar(pagina);
await pagina.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 60000 });
await comprobar('4. sin muestra (no hay nada que hacer) y avisa de que ya estaban',
  pagina.evaluate(() => [!!document.querySelector('.muestra-generar'), /Ya estaban en la carpeta/.test(document.getElementById('cuadro-cuerpo').textContent), document.querySelector('.generar-cada-resumen').textContent]),
  [false, true, '0 documentos generados.']);
await pagina.click('#cuadro-aceptar');
await comprobar('4. no se ha repetido ninguno', carpeta(pagina, demo), tras);

/* ================= 7. VOLVER A GENERAR ================= */
console.log('--- 7. «Volver a generar» ---');
await pagina.waitForTimeout(500);
const estadoFilas = () => pagina.evaluate(async (n) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
  const d = await App.E.abiertos.getDirectoryHandle(n);
  const est = PersonasDelGrupo.estado(a, (await Carpetas.ficheros(d)).map((f) => f.nombre));
  const t = est.trabajos[est.trabajos.length - 1].clave;
  return est.personas.map((p) => (p.hechos[t] ? p.hechos[t].generado.numero : ''));
}, demo);
const numerosAntes = await estadoFilas();
/* La fila de Noa: ya registrada (la del demo) pero su documento de hoy no: se registra a mano para la prueba. */
await pagina.evaluate(async (n) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
  const d = await App.E.abiertos.getDirectoryHandle(n);
  const est = PersonasDelGrupo.estado(a, (await Carpetas.ficheros(d)).map((f) => f.nombre));
  const t = est.trabajos[est.trabajos.length - 1].clave;
  await DocumentosDatos.anotar(n, est.personas[0].hechos[t].generado.numero, { anadirRegistro: { ano: '26', sentido: 'S', modo: 'M', numero: '0999', codigo: '26SM0999' } });
}, demo);
await pagina.evaluate((n) => PersonasDelGrupo.repintar(App.E.listaAbiertos.filter((x) => x.nombre === n)[0]), demo);
await pagina.waitForFunction(() => document.querySelector('.pg-tabla tbody tr td.pg-registrado').textContent.indexOf('26SM0999') !== -1);
await pagina.locator('.pg-tabla tbody tr').nth(0).locator('.pg-mas').click();
await comprobar('7. con su documento ya registrado, «Volver a generar» está apagado',
  pagina.locator('.pg-menu button', { hasText: 'Volver a generar' }).isDisabled(), true);
await pagina.keyboard.press('Escape');
await pagina.locator('.pg-tabla tbody tr').nth(3).locator('.pg-mas').click();
await comprobar('7. con uno sin registrar, encendido', pagina.locator('.pg-menu button', { hasText: 'Volver a generar' }).isDisabled(), false);
await pagina.locator('.pg-menu button', { hasText: 'Volver a generar' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-aceptar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 60000 });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1200);
const numerosDespues = await estadoFilas();
await comprobar('7. su fila sigue con «Generado», con otro número; las demás, las mismas',
  numerosDespues.map((x, i) => (x && x !== numerosAntes[i]) ? 'nuevo' : (x === numerosAntes[i] ? 'igual' : 'vacío')), ['igual', 'igual', 'igual', 'nuevo', 'igual', 'igual', 'igual', 'igual']);
await comprobar('7. en la papelera está su documento anterior (Word y PDF)',
  pagina.evaluate(async (num) => (await Papelera.leer()).filter((f) => String(f.nombre || '').indexOf(num) !== -1).length, numerosAntes[3]), 2);
await comprobar('7. y la carpeta no tiene el viejo', carpeta(pagina, demo).then((l) => l.filter((n) => n.indexOf(numerosAntes[3]) !== -1).length), 0);

/* ================= 8. VARIAS PÁGINAS, Y «GUARDAR PDF» SIN REFERENCIA ================= */
console.log('--- 8. varias páginas ---');
const multi = await pagina.evaluate(async (n) => {
  const P = Demo.plantilla;
  const parrafos = [];
  for (let i = 0; i < 3; i++) {
    if (i) parrafos.push(P.p(['<w:r><w:br w:type="page"/></w:r>']));
    parrafos.push(P.p([P.r('Página ' + (i + 1) + ' del documento de prueba.')]));
  }
  const blob = new Blob([P.docx(parrafos)], { type: P.WORD });
  const conRef = await WordVisor.pdfDe(blob, { referencia: 'Ref. D26-99999' });
  const d = await App.E.abiertos.getDirectoryHandle(n);
  await Carpetas.escribirBytes(d, 'prueba-con-ref.pdf', new Uint8Array(await conRef.arrayBuffer()), 'application/pdf');
  await WordVisor.abrir({ blob: blob, nombre: '261004 CERTIFICADO D26-99999.docx', carpeta: d });
  await new Promise((r) => setTimeout(r, 1500));
  await WordVisor.guardarPdfAhora({ sinCerrar: true });
  WordVisor.cerrar();
  return true;
}, demo);
const conRef = await textoPaginas(pagina, demo, 'prueba-con-ref.pdf');
const guardado = await carpeta(pagina, demo).then((l) => l.filter((x) => /^261004 CERTIFICADO D26-99999.*\.pdf$/.test(x))[0]);
const suelto = await textoPaginas(pagina, demo, guardado);
await comprobar('8. un Word de varias páginas da un PDF de varias páginas, con la «Ref.» en todas', [conRef.length === 3, conRef.every((t) => t.indexOf('Ref.D26-99999') !== -1)], [true, true]);
await comprobar('8. «Guardar PDF» de un documento suelto: mismas páginas y sin «Ref.»', [suelto.length === conRef.length, suelto.some((t) => t.indexOf('Ref.') !== -1)], [true, false]);

await comprobar('sin errores de consola (parte principal)', Promise.resolve(errores), []);
await pagina.close();

/* ================= 5. PARAR A MEDIAS ================= */
console.log('--- 5. parar ---');
const p2 = await nuevaPagina();
const demo2 = await abrirTarjeta(p2);
const antes2 = await carpeta(p2, demo2);
await pulsarGenerar(p2);
await p2.waitForSelector('.word-visor-franja .muestra-generar', { timeout: 30000 });
await p2.click('.muestra-generar');
await p2.waitForSelector('.grupo-barra-parar');
await p2.click('.grupo-barra-parar');
await p2.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
const parados = await p2.evaluate(() => [document.querySelector('.generar-cada-resumen').textContent, /Lo has parado/.test(document.getElementById('cuadro-cuerpo').textContent)]);
await p2.click('#cuadro-aceptar');
const nuevos2 = (await carpeta(p2, demo2)).filter((n) => antes2.indexOf(n) === -1);
const hechos2 = nuevos2.filter((n) => /\.pdf$/.test(n)).length;
await comprobar('5. «Parar» termina el que estaba a medias y no sigue (se hizo al menos uno y no los ocho)', [hechos2 >= 1 && hechos2 < 8, parados[1], nuevos2.filter((n) => /\.docx$/.test(n)).length], [true, true, 0]);
await pulsarGenerar(p2);
await p2.waitForSelector('.word-visor-franja .muestra-generar, #capa:not(.oculto) .generar-cada-resumen', { timeout: 60000 });
if (await p2.locator('.muestra-generar').count()) {
  await comprobar('5. la muestra cuenta solo los que faltan', p2.evaluate(() => document.querySelector('.muestra-generar').textContent), 'Generar los ' + (8 - hechos2));
  await p2.click('.muestra-generar');
  await p2.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
}
await p2.click('#cuadro-aceptar');
const final2 = (await carpeta(p2, demo2)).filter((n) => antes2.indexOf(n) === -1);
const numeros2 = final2.map((n) => (n.match(/D\d{2}-\d{5}/) || [''])[0]);
await comprobar('5. al volver a pulsar se completan los ocho, sin repetir ninguno', [final2.length, new Set(numeros2).size], [8, 8]);
await p2.close();

/* ================= 6. UN WORD SIN PDF ================= */
console.log('--- 6. un Word sin PDF ---');
const p3 = await nuevaPagina();
const demo3 = await abrirTarjeta(p3);
const antes3 = await carpeta(p3, demo3);
await p3.evaluate(() => {   /* el PDF de la tercera persona falla una vez */
  const original = GrupoGenerar.hacerPdf;
  let veces = 0;
  GrupoGenerar.hacerPdf = function () { veces++; if (veces === 3) return Promise.reject(new Error('fallo de prueba')); return original.apply(this, arguments); };
  window.__restaurar = () => { GrupoGenerar.hacerPdf = original; };
});
await pulsarGenerar(p3);
await p3.waitForSelector('.word-visor-franja .muestra-generar', { timeout: 30000 });
await p3.click('.muestra-generar');
await p3.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
await comprobar('6. el resumen dice cuántos y a quién no se le hizo el PDF',
  p3.evaluate(() => [document.querySelector('.generar-cada-resumen').textContent, /su Word está hecho, pero no el PDF: fallo de prueba/.test(document.getElementById('cuadro-cuerpo').textContent)]), ['7 documentos generados.', true]);
await p3.click('#cuadro-aceptar');
const t3 = (await carpeta(p3, demo3)).filter((n) => antes3.indexOf(n) === -1);
await comprobar('6. siete PDF y un Word suelto (el del que falló)', [t3.filter((n) => /\.pdf$/.test(n)).length, t3.filter((n) => /\.docx$/.test(n)).length], [7, 1]);
await p3.evaluate(() => window.__restaurar());
const docsAntes = await p3.evaluate((n) => Object.keys(App.E.registro.asuntos[n].documentos).length, demo3);
await pulsarGenerar(p3);
await p3.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 60000 });
await comprobar('6. sin muestra (solo falta uno) y se le hace solo el PDF', p3.evaluate(() => [!!document.querySelector('.muestra-generar'), document.querySelector('.generar-cada-resumen').textContent]), [false, '1 documento generado.']);
await p3.click('#cuadro-aceptar');
const f3 = (await carpeta(p3, demo3)).filter((n) => antes3.indexOf(n) === -1);
await comprobar('6. ahora ocho PDF y ningún Word suelto; ningún documento nuevo en la ficha',
  Promise.all([Promise.resolve([f3.filter((n) => /\.pdf$/.test(n)).length, f3.filter((n) => /\.docx$/.test(n)).length]), p3.evaluate((n) => Object.keys(App.E.registro.asuntos[n].documentos).length, demo3)]),
  [[8, 0], docsAntes]);
await comprobar('sin errores de consola', Promise.resolve(errores), []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de grupo-generar pasan.');
process.exit(fallos ? 1 : 0);
