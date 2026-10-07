/* Fila 294 (docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md, apartado 4): reconocer los PDF sellados de Séneca, persona por
   persona. Chromium real, con la copia de pruebas (?demo=1&auto=1), en el asunto de grupo «GRUPO 2ºB»:
   tres personas con su documento (Noa, con registro; Iker, con su Word; Bruno, con un PDF sellado con su «Ref.» en la
   carpeta) y un segundo PDF sellado sin referencia. Los PDF de las pruebas se hacen con pdf-lib con el sello como texto.

   0. La demostración tal cual: Bruno ya tiene su número sin pulsar nada; «PDF sellados sin colocar (1)»; «¿De quién es?»
      solo con la persona pendiente; elegirla lo coloca; no sale el aviso ámbar.
   1. Referencia en el nombre; referencia en el texto, con espacios en medio; la de otro asunto no se toca (sale sin
      colocar); «No es de este trabajo» lo deja para el aviso de siempre.
   2. Un PDF con referencias de cuatro personas (una con dos páginas) se parte en cuatro; el entero, a «Versiones previas»;
      con todos registrados se marca la tarea de registrar, una sola vez.
   3. Con la casilla quitada no se mira nada y no sale la columna «Registrado»; al marcarla, sale, con la línea y «Ruta».
   4. Solo consulta y compañero con el mando: nada se escribe. */
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
async function nuevaPagina(inicio) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); " + (inicio || '') + " } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });   /* fila 299: la demostración tarda un poco más en montarse */
  await p.waitForTimeout(3500);
  /* Ayudas dentro de la página: un documento pendiente de una persona y un PDF «de Séneca». */
  await p.evaluate(() => {
    window.__asunto = App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre;
    window.__ref = (i) => {   /* la referencia del documento de la persona i, si ya lo tiene */
      const f = App.E.registro.asuntos[window.__asunto], r = f.relacionados[i];
      return Object.keys(f.documentos).filter((k) => f.documentos[k].generadoDe === Object.values(f.documentos)[0].generadoDe.split('|')[0] + '|' + r.categoria + '|' + r.nombre)[0] || '';
    };
    window.__crearDoc = async (i) => {   /* un documento generado de la persona i (un PDF), sin registro */
      const n = window.__asunto, f = App.E.registro.asuntos[n], rel = f.relacionados[i];
      const primero = Object.values(f.documentos)[0];
      const numero = (await Numeros.reservar('documentos', '')).numero;
      const nombre = Nombres.montarDocumento({ fecha: primero.fecha, tipo: 'CERTIFICADO', curso: 'x', extension: 'pdf', numeroDoc: numero });
      const PDFLib = await PdfHerramientas.cargarPdfLib();
      const doc = await PDFLib.PDFDocument.create();
      doc.addPage([595, 842]).drawText('Certificado ' + numero, { x: 50, y: 780, size: 12 });
      await Carpetas.escribirBytes(await App.E.abiertos.getDirectoryHandle(n), nombre, await doc.save(), 'application/pdf');
      await DocumentosDatos.anotar(n, numero, { tipo: 'CERTIFICADO', fecha: primero.fecha, texto: '', campos: [], valores: {}, registros: [],
        generadoDe: primero.generadoDe.split('|')[0] + '|' + rel.categoria + '|' + rel.nombre, hito: '' });
      return numero;
    };
    /* paginas: [{ texto, ref: [trozos de la referencia] | '', registro }] */
    window.__crearPdf = async (nombre, paginas) => {
      const PDFLib = await PdfHerramientas.cargarPdfLib();
      const doc = await PDFLib.PDFDocument.create();
      const fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      const d = new Date(), fecha = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
      paginas.forEach((pg) => {
        const pagina = doc.addPage([595, 842]);
        pagina.drawText(pg.texto || 'Certificado', { x: 50, y: 780, size: 12, font: fuente });
        let x = 50;
        (pg.ref || []).forEach((trozo) => { pagina.drawText(trozo, { x, y: 700, size: 9, font: fuente }); x += 60; });
        pagina.drawText('2026/29700692/M0000000' + pg.registro + 'SALIDA Fecha: ' + fecha + ' 09:30:00', { x: 50, y: 40, size: 9, font: fuente });
      });
      await Carpetas.escribirBytes(await App.E.abiertos.getDirectoryHandle(window.__asunto), nombre, await doc.save(), 'application/pdf');
    };
  });
  return p;
}
async function abrirTarjeta(p) {
  await p.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
  await p.waitForSelector('#pantalla-asunto:not(.oculto)');
  await p.evaluate(() => FichaTarjetas.abrir('relacionados'));
  await p.waitForSelector('.pg-tabla');
}
const carpeta = (p) => p.evaluate(async () => (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(window.__asunto))).map((f) => f.nombre).sort());
const previas = (p) => p.evaluate(async () => (await VersionesPrevias.listar(await App.E.abiertos.getDirectoryHandle(window.__asunto))).map((f) => f.nombre).sort());
/* Lo que dice la columna «Registrado» de cada fila (en el orden del grupo). */
const registrados = (p) => p.evaluate(() => {
  const col = [...document.querySelectorAll('.pg-tabla thead th')].map((t) => t.textContent).indexOf('Registrado');
  return col === -1 ? null : [...document.querySelectorAll('.pg-tabla tbody tr')].map((r) => r.children[col].textContent.trim());
});
const esperarRegistro = (p, i, codigo) => p.waitForFunction(([k, c]) => {
  const col = [...document.querySelectorAll('.pg-tabla thead th')].map((t) => t.textContent).indexOf('Registrado');
  const fila = document.querySelectorAll('.pg-tabla tbody tr')[k];
  return col !== -1 && fila && fila.children[col].textContent.trim() === c;
}, [i, codigo], { timeout: 30000 });
const sinColocar = (p) => p.evaluate(() => { const e = document.querySelector('.pg-sin-colocar strong'); return e ? e.textContent : ''; });

/* ================= 0. LA DEMOSTRACIÓN TAL CUAL ================= */
console.log('--- 0. la demostración ---');
let pagina = await nuevaPagina();
await abrirTarjeta(pagina);
await esperarRegistro(pagina, 2, '26SM0413');
await comprobar('0. Bruno (referencia en el texto de su PDF) ya tiene su número, sin pulsar nada; Noa lo tenía; Iker, «Pendiente»',
  registrados(pagina), ['26SM0412', 'Pendiente', '26SM0413', '', '', '', '26SM0430', '26SM0431']);
await comprobar('0. el PDF de Bruno ya no está con el nombre de descarga; su Word de antes, no (era un PDF) y el sin sellar, a «Versiones previas»',
  Promise.all([carpeta(pagina).then((l) => l.indexOf('Certificado firmado 1.pdf') === -1), previas(pagina).then((l) => l.some((n) => /SIN SELLAR/.test(n)))]), [true, true]);
await comprobar('0. encima de la tabla, la línea de Séneca y, debajo, «PDF sellados sin colocar (1)» con su número de registro',
  pagina.evaluate(() => [document.querySelector('.pg-registro-linea').textContent.replace(/\s+/g, ' ').trim(), !!document.querySelector('.pg-registro-linea .boton-copiar-fila'),
    document.querySelector('.pg-sin-colocar strong').textContent, document.querySelector('.pg-sc-codigo').textContent]),
  ['Firma y registra el documento en Séneca y guarda aquí el PDF que descargues. Ruta', true, 'PDF sellados sin colocar (1)', '26SM0414']);
await comprobar('0. «¿De quién es?» solo ofrece a la persona que sigue pendiente (aunque sea una sola, no se decide solo)',
  pagina.locator('.pg-sc-quien option').allTextContents().then((l) => l.map((t) => t.replace(/ \d+$/, ''))), ['¿De quién es?', 'Delgado Prieto, Iker']);
await comprobar('0. no sale el aviso ámbar de «este papel trae el sello de registro»', pagina.evaluate(() => document.querySelectorAll('#ficha-sellos .aviso-sello').length), 0);
await pagina.locator('.pg-sc-quien').selectOption({ index: 1 });
await esperarRegistro(pagina, 1, '26SM0414');
await comprobar('0. elegirla lo coloca: su fila tiene el número y la lista de sin colocar desaparece',
  Promise.all([registrados(pagina), sinColocar(pagina)]), [['26SM0412', '26SM0414', '26SM0413', '', '', '', '26SM0430', '26SM0431'], '']);
await comprobar('0. el PDF sellado ocupa el nombre del documento (con su número), y su Word, a «Versiones previas» como «SIN SELLAR»',
  Promise.all([carpeta(pagina), previas(pagina)]).then(([c, pr]) => [c.filter((n) => /^\d{6} CERTIFICADO D26-\d{5}\.pdf$/.test(n)).length, c.indexOf('Certificado firmado 2.pdf') === -1, pr.filter((n) => /SIN SELLAR\.docx$/.test(n)).length]),
  [4, true, 2]);
await pagina.close();

/* ================= 1. NOMBRE, TEXTO CON ESPACIOS, OTRO ASUNTO ================= */
console.log('--- 1. nombre, texto, otro asunto ---');
pagina = await nuevaPagina();
const n3 = await pagina.evaluate(() => window.__crearDoc(3));
const n4 = await pagina.evaluate(() => window.__crearDoc(4));
await pagina.evaluate(([a, b]) => Promise.all([
  window.__crearPdf('Descarga de Séneca ' + a + '.pdf', [{ texto: 'Certificado de una persona', registro: '00415' }]),
  window.__crearPdf('Séneca dos.pdf', [{ texto: 'Certificado de otra persona', ref: ['Ref. ' + b.slice(0, 2), b.slice(2, 6), b.slice(6)], registro: '00416' }]),
  window.__crearPdf('Séneca tres.pdf', [{ texto: 'Certificado de otro asunto', ref: ['Ref. D26-99999'], registro: '00417' }])
]), [n3, n4]);
await abrirTarjeta(pagina);
await esperarRegistro(pagina, 3, '26SM0415');
await esperarRegistro(pagina, 4, '26SM0416');
await comprobar('1. la referencia en el nombre y la del texto, con espacios en medio, se colocan sin preguntar', registrados(pagina), ['26SM0412', 'Pendiente', '26SM0413', '26SM0415', '26SM0416', '', '26SM0430', '26SM0431']);
await pagina.waitForTimeout(500);
await comprobar('1. la de otro asunto no se toca: queda con su nombre y sale sin colocar, junto al otro sin referencia',
  Promise.all([carpeta(pagina).then((l) => [l.indexOf('Séneca tres.pdf') !== -1, l.indexOf('Certificado firmado 2.pdf') !== -1]), sinColocar(pagina)]), [[true, true], 'PDF sellados sin colocar (2)']);
await comprobar('1. sin referencia no se decide: «¿De quién es?» ofrece a quien sigue pendiente',
  pagina.locator('.pg-sc-quien').first().locator('option').allTextContents().then((l) => l.length), 2);
const filaSin = pagina.locator('.pg-sin-colocar li', { hasText: 'Séneca tres.pdf' });
await filaSin.locator('.pg-sc-no').click();
await pagina.waitForFunction(() => document.querySelectorAll('.pg-sin-colocar li').length === 1);
await comprobar('1. «No es de este trabajo» lo quita de la lista y deja su PDF como estaba', Promise.all([sinColocar(pagina), carpeta(pagina).then((l) => l.indexOf('Séneca tres.pdf') !== -1)]), ['PDF sellados sin colocar (1)', true]);
await pagina.evaluate(() => App.abrirFicha(App.E.listaAbiertos.filter((a) => a.nombre === window.__asunto)[0], 'abierto'));
await pagina.waitForSelector('#ficha-sellos .aviso-sello', { timeout: 20000 });
await comprobar('1. ese sí sale en el aviso ámbar de siempre de la ficha', pagina.evaluate(() => [document.querySelectorAll('#ficha-sellos .aviso-sello').length, /Séneca tres\.pdf/.test(document.getElementById('ficha-sellos').textContent)]), [1, true]);
await pagina.close();

/* ================= 2. UN PDF CON VARIAS REFERENCIAS ================= */
console.log('--- 2. un PDF con varias referencias ---');
pagina = await nuevaPagina();
await pagina.evaluate(async () => {
  window.__marcas = 0;
  const original = Hitos.marcarGuionPorAccion;
  Hitos.marcarGuionPorAccion = function (a, h, accion) { if (accion === 'registrar') window.__marcas++; return original.apply(this, arguments); };
  window.__avisos = [];
  new MutationObserver(() => { document.querySelectorAll('#mensajes .mensaje').forEach((e) => { if (/están registrados/.test(e.textContent) && !e.__visto) { e.__visto = true; window.__avisos.push(e.textContent); } }); })
    .observe(document.body, { childList: true, subtree: true });
});
const r3 = await pagina.evaluate(() => window.__crearDoc(3));
const r4 = await pagina.evaluate(() => window.__crearDoc(4));
const r5 = await pagina.evaluate(() => window.__crearDoc(5));
const r1 = await pagina.evaluate(() => window.__ref(1));
await pagina.evaluate(([a, b, c, d]) => window.__crearPdf('Séneca junto.pdf', [
  { texto: 'uno', ref: ['Ref. ' + a], registro: '00420' }, { texto: 'dos', ref: ['Ref. ' + b], registro: '00421' },
  { texto: 'tres', ref: ['Ref. ' + c], registro: '00422' }, { texto: 'tres bis', registro: '00422' }, { texto: 'cuatro', ref: ['Ref. ' + d], registro: '00423' }]), [r1, r3, r4, r5]);
await abrirTarjeta(pagina);
await esperarRegistro(pagina, 5, '26SM0423');
await comprobar('2. las cuatro personas del PDF juntas quedan registradas, cada una con su número',
  registrados(pagina), ['26SM0412', '26SM0420', '26SM0413', '26SM0421', '26SM0422', '26SM0423', '26SM0430', '26SM0431']);
await comprobar('2. el PDF entero, a «Versiones previas», y ya no está en la carpeta ni quedan trozos sueltos',
  Promise.all([carpeta(pagina).then((l) => l.filter((n) => /Séneca junto/.test(n)).length), previas(pagina).then((l) => l.filter((n) => /^Séneca junto\.pdf$/.test(n)).length)]), [0, 1]);
await comprobar('2. no queda nada sin colocar (lo de «Certificado firmado 2» sigue: no tiene referencia)', sinColocar(pagina), 'PDF sellados sin colocar (1)');
await comprobar('2. la tarea de registrar del hito actual, marcada una sola vez, con su aviso verde',
  pagina.evaluate(async () => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === window.__asunto)[0];
    await GrupoRegistro.revisar(a); await GrupoRegistro._interno.reiniciar(); await GrupoRegistro.pasada();
    const h = PersonasDelGrupo.hitoActual(a);
    return [window.__marcas, Hitos.guionDe(a, h).filter((g) => g.accion === 'registrar').map((g) => g.hecho), window.__avisos.length, !!App.E.registro.asuntos[a.nombre].registroPorPersonaMarcado];
  }), [1, [true], 1, true]);
await pagina.close();

/* ================= 3. LA CASILLA ================= */
console.log('--- 3. la casilla ---');
pagina = await nuevaPagina();
await pagina.evaluate(() => App.anotar(window.__asunto, { registroPorPersona: false }));
const q3 = await pagina.evaluate(() => window.__crearDoc(3));
await pagina.evaluate((a) => window.__crearPdf('Descarga ' + a + '.pdf', [{ texto: 'Certificado', registro: '00415' }]), q3);
await abrirTarjeta(pagina);
await pagina.evaluate(async () => { GrupoRegistro._interno.reiniciar(); await GrupoRegistro.pasada(); });
await pagina.waitForTimeout(1500);
await comprobar('3. sin la casilla: no sale la columna «Registrado», no sale la lista y no se coloca nada',
  Promise.all([pagina.locator('.pg-tabla thead th').allTextContents(), carpeta(pagina).then((l) => [l.indexOf('Certificado firmado 1.pdf') !== -1, l.indexOf('Descarga ' + q3 + '.pdf') !== -1]), sinColocar(pagina), pagina.locator('.pg-registro-por').isChecked()]),
  [['Persona', 'Unidad', 'Generado', 'Enviado', ''], [true, true], '', false]);
await pagina.check('.pg-registro-por');
await pagina.waitForFunction(() => [...document.querySelectorAll('.pg-tabla thead th')].some((t) => t.textContent === 'Registrado'));
await esperarRegistro(pagina, 3, '26SM0415');
await comprobar('3. al marcarla sale la columna «Registrado» y se coloca lo que traía su referencia; Iker, «Pendiente»',
  Promise.all([registrados(pagina), pagina.evaluate(() => document.querySelector('.pg-registro-linea').textContent.replace(/\s+/g, ' ').trim().replace(/ Ruta$/, ''))]),
  [['26SM0412', 'Pendiente', '26SM0413', '26SM0415', '', '', '26SM0430', '26SM0431'], 'Firma y registra el documento en Séneca y guarda aquí el PDF que descargues.']);
await comprobar('3. y la elección se guarda en el asunto', pagina.evaluate(() => App.E.registro.asuntos[window.__asunto].registroPorPersona), true);
await pagina.close();

/* ================= 4. SOLO CONSULTA Y COMPAÑERO CON EL MANDO ================= */
console.log('--- 4. solo consulta, compañero con el mando ---');
pagina = await nuevaPagina("localStorage.setItem('gestor.soloConsulta', '1');");
await abrirTarjeta(pagina);
await pagina.evaluate(async () => { GrupoRegistro._interno.reiniciar(); await GrupoRegistro.pasada(); });
await pagina.waitForTimeout(1500);
await comprobar('4. solo consulta: nada se coloca (Bruno sin número), los dos PDF salen sin colocar y los controles, apagados',
  Promise.all([registrados(pagina), carpeta(pagina).then((l) => [l.indexOf('Certificado firmado 1.pdf') !== -1, l.indexOf('Certificado firmado 2.pdf') !== -1]), sinColocar(pagina),
    pagina.evaluate(() => [...document.querySelectorAll('.pg-sc-quien, .pg-sc-no, .pg-registro-por')].every((e) => e.disabled))]),
  [['26SM0412', 'Pendiente', 'Pendiente', '', '', '', '26SM0430', '26SM0431'], [true, true], 'PDF sellados sin colocar (2)', true]);
await comprobar('4. y no se ha escrito nada', pagina.evaluate(() => Demo.escrituras()), 0);
await pagina.close();

pagina = await nuevaPagina();
await pagina.evaluate(() => { Presencia.ocupantePor = () => 'Marta'; });
await abrirTarjeta(pagina);
await pagina.evaluate(async () => { GrupoRegistro._interno.reiniciar(); await GrupoRegistro.pasada(); });
await pagina.waitForTimeout(1500);
await comprobar('4. con el compañero al mando: no se coloca nada',
  Promise.all([registrados(pagina), carpeta(pagina).then((l) => [l.indexOf('Certificado firmado 1.pdf') !== -1, l.indexOf('Certificado firmado 2.pdf') !== -1])]),
  [['26SM0412', 'Pendiente', 'Pendiente', '', '', '', '26SM0430', '26SM0431'], [true, true]]);
await pagina.close();

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de grupo-registro pasan.');
process.exit(fallos ? 1 : 0);
