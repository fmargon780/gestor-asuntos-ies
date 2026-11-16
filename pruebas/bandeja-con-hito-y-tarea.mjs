/* Fila 661 (14-nov-2026, docs/661-BANDEJA-CON-HITO-Y-TAREA.md): un documento de la bandeja (suelto de «Por clasificar» o adjunto de un
   correo) entra en el asunto al pulsar «Guardar», con su hito y su tarea.

   Con Chromium real y los datos de la copia de pruebas (?demo=1&auto=1&latido=hoy: dos sueltos, un correo con dos adjuntos, la matrícula
   de Pablo con tareas de «Añadir documento» y el asunto «PEDIDO Imprenta Sol», sin hitos). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&latido=hoy';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Bandeja && BandejaNucleo.correos() && BandejaNucleo.correos().length >= 3 && App.E.sueltos.length >= 3, null, { timeout: 60000 });
await pagina.waitForTimeout(2000);

const PABLO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /MATRICULA Aguilar Ponce, Pablo/.test(x))[0]);
const PEDIDO = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((x) => /PEDIDO Imprenta Sol/.test(x))[0]);

const avisos = () => pagina.evaluate(() => window.__av);
await pagina.evaluate(() => { window.__av = []; const o = U.aviso; U.aviso = function (t) { window.__av.push(t); return o.apply(this, arguments); }; });

async function abrirSuelto(nombre, asunto) {
  await pagina.evaluate(([n, a]) => {
    const s = App.E.sueltos.filter((x) => x.nombre === n)[0];
    window.__p = App.meterSueltoEnAsuntoElegido(s, { nombre: a, ficha: App.E.registro.asuntos[a] });
  }, [nombre, asunto]);
  await pagina.waitForSelector('#doc-tarea-bloque h4', { timeout: 15000 });
  await pagina.waitForTimeout(300);
}
const bloque = () => pagina.evaluate(() => document.querySelector('#doc-tarea-bloque').innerText.replace(/\n+/g, ' | '));
const enAbiertos = (n) => pagina.evaluate(async (n) => { try { await App.E.abiertos.getFileHandle(n); return true; } catch (e) { return false; } }, n);
const enCarpeta = (asunto, patron) => pagina.evaluate(async ([a, p]) => {
  const d = await App.E.abiertos.getDirectoryHandle(a);
  return (await Carpetas.ficheros(d)).map((f) => f.nombre).filter((x) => new RegExp(p).test(x));
}, [asunto, patron]).then((l) => l.map((x) => x.replace(/^\d{6} /, 'FECHA ').replace(/D26-\d{5}/, 'D26-N')));
const tareas = (asunto) => pagina.evaluate(async (n) => {
  const a = { nombre: n, ficha: App.E.registro.asuntos[n], leido: Nombres.leer(n, App.E.tipos) };
  return (await Hitos.hitosDe(n)).map((h) => Hitos.guionDe(a, h).map((g) => (g.hecho ? '[x] ' : '[ ] ') + g.texto));
}, asunto);

console.log('--- 1. un suelto: entra al pulsar «Guardar» ---');
await abrirSuelto('justificante.pdf', PABLO);
await comprobar('1. el cuadro dice que entra al pulsar «Guardar»', pagina.evaluate(() => document.querySelector('.doc-campos .explica').childNodes[0].textContent), 'El documento entra en el asunto al pulsar «Guardar».');
await comprobar('1. el fichero sigue en la bandeja y no está en la carpeta del asunto', Promise.all([enAbiertos('justificante.pdf'), enCarpeta(PABLO, 'JUSTIFICANTE D26-000(1[0-9]|2[0-9])')]), [true, []]);
await pagina.selectOption('#doc-tipo', 'JUSTIFICANTE');
await pagina.waitForTimeout(300);
await comprobar('1. con una tarea que espera ese tipo, el bloque la propone', bloque(),
  '¿De qué tarea es? | Hito: 2. Comprobar la documentación (el actual) | Tarea: Recibir el justificante del seguro escolar | Esa tarea espera un documento de tipo JUSTIFICANTE. Queda hecha. | Cambiar');
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.waitForTimeout(300);
await comprobar('1. con un tipo que nadie espera, el bloque sale vacío', bloque(),
  '¿De qué tarea es? | Ninguna tarea espera un documento de tipo FACTURA. Elige el hito y la tarea. | Hito | Elige el hito… | 1. Recibir la solicitud | 2. Comprobar la documentación (el actual) | 3. Registrar la matrícula en Séneca | + Añadir hito');
/* Fila 680: sin hito ni tarea ya no corta; el destino sale «sin tarea» (el guardado real, en documentos-sin-tarea). */
await comprobar('1. sin hito el destino sale «sin tarea» (ya no avisa)', pagina.evaluate(() => DocumentoTareaBloque.destino()), { hitoId: '', tareaId: null, sinTarea: true });
await pagina.selectOption('#dtb-hito', { index: 2 });
await pagina.waitForTimeout(200);
await comprobar('1. con el hito y sin tarea tampoco avisa: sale «sin tarea»', pagina.evaluate(() => { const d = DocumentoTareaBloque.destino(); return [!!d.sinTarea, !!d.hitoId, d.tareaId]; }), [true, true, null]);
await pagina.selectOption('#doc-tipo', 'JUSTIFICANTE');
await pagina.waitForTimeout(300);
await comprobar('1. lo elegido a mano no se toca al cambiar el tipo (solo el nombre de «Tarea nueva»)', pagina.evaluate(() => ({
  hito: document.querySelector('#dtb-hito').value !== '', nueva: document.querySelector('#doc-tarea-bloque .pt-op:last-child').innerText.split('\n')[0] })), { hito: true, nueva: 'Tarea nueva: «JUSTIFICANTE»' });
await pagina.click('#doc-volver');
await pagina.waitForTimeout(800);
await comprobar('1. «Volver» no guarda nada: sigue en «Por clasificar», el cuadro se cierra y la carpeta no cambia', Promise.all([enAbiertos('justificante.pdf'),
  pagina.locator('#capa:not(.oculto) .cuadro').count(), enCarpeta(PABLO, 'JUSTIFICANTE D26-000(1[0-9]|2[0-9])')]), [true, 0, []]);

await abrirSuelto('justificante.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'JUSTIFICANTE');
await pagina.waitForTimeout(300);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('1. al guardar con la propuesta: el documento entra en la carpeta y sale de la bandeja', Promise.all([enAbiertos('justificante.pdf'), enCarpeta(PABLO, 'JUSTIFICANTE D26-000(1[0-9]|2[0-9])')]), [false, ['FECHA JUSTIFICANTE D26-N.pdf']]);
await comprobar('1. la tarea «Recibir el justificante…» queda hecha', (await tareas(PABLO))[1][1], '[x] Recibir el justificante del seguro escolar');
await comprobar('1. y el documento cuelga de ella', pagina.evaluate(async (n) => {
  const h = (await Hitos.hitosDe(n))[1];
  return Object.keys(h.guionDocumento || {}).length;
}, PABLO), 1);

console.log('--- 2. «Tarea nueva» ---');
await abrirSuelto('escaneo_0012.pdf', PABLO);
await pagina.selectOption('#doc-tipo', 'FACTURA');
await pagina.selectOption('#dtb-hito', { index: 3 });
await pagina.waitForTimeout(200);
await comprobar('2. «Tarea nueva» dice a dónde va (la marca está apagada: solo este asunto)',
  pagina.evaluate(() => document.querySelector('#doc-tarea-bloque .pt-op:last-child').innerText), 'Tarea nueva: «FACTURA»\nLa app la crea en ese hito y la deja hecha, solo en este asunto.');
await pagina.check('#doc-tarea-bloque input[value="nueva"]');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('2. la tarea nueva se crea en el hito, hecha', (await tareas(PABLO))[2], ['[x] FACTURA']);

console.log('--- 3. un asunto sin hitos ---');
await abrirSuelto('solicitud escaneada.pdf', PEDIDO);
await comprobar('3. el bloque pide añadir el hito y el desplegable sale apagado', [await bloque(), await pagina.$eval('#dtb-hito', (e) => e.disabled)],
  ['¿De qué tarea es? | Este asunto no tiene hitos. Añade el hito del que cuelga el documento. | Hito | No hay hitos | + Añadir hito', true]);
await comprobar('3. sin hitos el destino sale «sin tarea» (ya no avisa)', pagina.evaluate(() => !!DocumentoTareaBloque.destino().sinTarea), true);
await pagina.click('#dtb-anadir-hito');
await pagina.waitForSelector('.anadir-hito-capa', { timeout: 10000 });
await comprobar('3. «+ Añadir hito» abre la ventana de la fila 660', pagina.evaluate(() => document.querySelector('.anadir-hito-capa h3').textContent), 'Añadir hito');
await pagina.click('#ah-cerrar');
await pagina.waitForTimeout(500);
await comprobar('3. cancelar la ventana deja el cuadro como estaba', [await pagina.locator('.anadir-hito-capa').count(), (await bloque()).indexOf('No hay hitos') !== -1], [0, true]);
await pagina.click('#doc-volver');
await pagina.waitForTimeout(500);

console.log('--- 4. un correo con dos adjuntos ---');
const CORREO = () => pagina.evaluate(async () => {
  const salida = {};
  const bd = BandejaNucleo.carpeta();
  salida.bandeja = []; for await (const [k] of bd.entries()) salida.bandeja.push(k);
  salida.bandeja = salida.bandeja.filter((x) => /demo-correo-3|solicitud firmada|recibo seguro/.test(x)).sort();
  return salida;
});
async function guardarCorreo() {
  await pagina.evaluate((n) => {
    const it = BandejaNucleo.correos().filter((x) => x.datos.id === 'demo-correo-3')[0];
    window.__p = Bandeja.guardarEnAsunto(it, { nombre: n, ficha: App.E.registro.asuntos[n] });
  }, PABLO);
  await pagina.waitForSelector('#doc-tarea-bloque h4', { timeout: 15000 });
  await pagina.waitForTimeout(400);
}
const registroCorreo = () => pagina.evaluate(async (n) => (await Notas.frescas({ nombre: n, ficha: App.E.registro.asuntos[n] })).filter((x) => x.correo).map((x) => x.texto), PABLO);
await guardarCorreo();
await comprobar('4. el primer cuadro dice de quién es el correo y «adjunto 1 de 2»', pagina.evaluate(() => document.querySelector('.doc-campos .nota').textContent), 'Correo de Marina Ponce Ruiz · adjunto 1 de 2');
await comprobar('4. el PDF del correo y el del hilo ya están en la carpeta; los adjuntos siguen en la bandeja',
  [await enCarpeta(PABLO, 'CORREO|HILO'), (await CORREO()).bandeja],
  [['FECHA CORREO Matrícula de Pablo documentación.pdf', 'FECHA HILO Matrícula de Pablo documentación.pdf'], ['demo-correo-3 - hilo.pdf', 'demo-correo-3 - mensaje.pdf', 'demo-correo-3.json', 'recibo seguro escolar.pdf', 'solicitud firmada.pdf']]);
await comprobar('4. el Registro lleva una sola línea del correo, sin hito', registroCorreo(), ['Correo recibido de Marina Ponce Ruiz: «Matrícula de Pablo: documentación»']);
await comprobar('4. los PDF del correo y del hilo no llevan la marca «sin tarea»', pagina.evaluate(async (n) => {
  const hitos = await Hitos.hitosDe(n);
  return ['261114 CORREO Matrícula de Pablo documentación.pdf', '261114 HILO Matrícula de Pablo documentación.pdf', '261114 JUSTIFICANTE D26-00099.pdf'].map((x) => DocumentoATarea.sinTarea(hitos, x));
}, PABLO), [false, false, true]);
await pagina.selectOption('#doc-tipo', 'SOLICITUD');
await pagina.waitForTimeout(300);
await comprobar('4. el primer adjunto (SOLICITUD) trae su tarea propuesta', (await bloque()).indexOf('Tarea: Recibir la solicitud de matrícula') !== -1, true);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('4. tras guardar el primero, sale el segundo en el mismo cuadro', pagina.evaluate(() => document.querySelector('.doc-campos .nota').textContent), 'Correo de Marina Ponce Ruiz · adjunto 2 de 2');
await pagina.click('#doc-volver');
await pagina.waitForTimeout(1500);
await comprobar('4. «Volver» en el segundo: el primero guardado, el segundo sigue en la bandeja con el correo, y el aviso lo dice', [
  (await CORREO()).bandeja, (await avisos()).slice(-1)[0]],
  [['demo-correo-3 - hilo.pdf', 'demo-correo-3 - mensaje.pdf', 'demo-correo-3.json', 'recibo seguro escolar.pdf'], 'El correo queda en el Registro. Un adjunto no se ha guardado: sigue en la bandeja, con el correo.']);
await guardarCorreo();
await comprobar('4. al guardarlo otra vez en ese asunto solo se pide el adjunto que falta', pagina.evaluate(() => document.querySelector('.doc-campos .nota').textContent), 'Correo de Marina Ponce Ruiz · adjunto 1 de 1');
await pagina.selectOption('#doc-tipo', 'INFORME');
await pagina.selectOption('#dtb-hito', { index: 1 });
await pagina.check('#doc-tarea-bloque input[value="nueva"]');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('4. sin otra línea en el Registro; al terminar, el correo sale de la bandeja con todo', [await registroCorreo(), (await CORREO()).bandeja], [['Correo recibido de Marina Ponce Ruiz: «Matrícula de Pablo: documentación»'], []]);

console.log('--- sin errores en la consola ---');
await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan.'); process.exit(1); }
console.log('\nTodas las comprobaciones de la bandeja con hito y tarea pasan.');
