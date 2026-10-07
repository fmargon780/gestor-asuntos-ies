/* Fila 285 (6-oct-2026, docs/HACER-ESTE-HITO.md): «Hacer este hito». Con Chromium real y los datos inventados de la
   copia de pruebas (?demo=1&auto=1): CERTIFICADO DE NOTAS tiene un primer hito con tres tareas con acción (generar con
   plantilla, registrar en Séneca, comunicar por correo); «Vidal Soto, Irene» lo tiene sin tocar y «Moreno Sanz, Hugo» ya
   esperando el PDF sellado, que está en su carpeta.

   1. Al entrar: «1 listos para enviar» en Inicio, la coletilla «· listo para enviar» y el PDF sellado ya colocado sin preguntar.
   2. Hugo: «Enviar», «El documento ya está sellado.»; el correo con el PDF sellado adjunto y «Todavía no»; sigue en «Enviar».
   3. Enviar de verdad: hito hecho con «Deshacer», sin apunte, y se abre el siguiente; el aviso de Inicio desaparece.
   4. Irene: «Hacer este hito» con su línea; genera, guarda el PDF solo, marca la tarea, se para en el registro (franja,
      «Esperando el PDF sellado», «Dejar de esperar»); en Inicio, «· esperando el sello»; «Dejar de esperar» lo deshace.
   5. Una pregunta sin responder: se para antes, con el aviso ámbar.
   6. Un hito sin tareas de generar ni de comunicar: sin botón, y los tres menús siguen.
   7. Solo consulta: el botón está apagado. */
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
async function paginaNueva(consulta) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); " +
    (consulta ? "if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); }" : '') + " } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  if (consulta) await pagina.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
  await pagina.waitForTimeout(consulta ? 5000 : 3000);
  return pagina;
}

let pagina = await paginaNueva(false);
const avisos = () => pagina.$$eval('#avisos-linea .avisos-linea-trozo', (e) => e.map((x) => x.textContent));
const mensajes = () => pagina.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const hitoDe = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const hs = await Hitos.hitosDe(a.nombre);
  const h = hs[0];
  return { cadena: (h.cadena && h.cadena.estado) || null, estado: h.estado,
    hechas: Hitos.guionDe(a, h).filter((g) => g.hecho).map((g) => g.id), documentos: h.documentos };
}, frag);
const ficheros = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  return (await Carpetas.ficheros(a.handle)).map((f) => f.nombre);
}, frag);
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
  await pagina.waitForTimeout(600);
}
const botones = () => pagina.locator('.hito-en-mesa .mesa-hacer-hito').allTextContents();

/* ===== 1. Al entrar ===== */
console.log('--- 1. al entrar ---');
await comprobar('1. «1 listos para enviar» en el cuadro de avisos', avisos().then((a) => a.filter((t) => /listos para enviar/.test(t))), ['1 listos para enviar']);
await comprobar('1. la fila de Hugo dice «· listo para enviar»',
  pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="Moreno Sanz"] .inicio-tabla-hito').textContent().then((t) => /· listo para enviar/.test(t)), true);
await comprobar('1. el PDF sellado se colocó solo: queda el sellado con el nombre de la aplicación y no el suelto',
  ficheros('Moreno Sanz').then((f) => [f.some((n) => /^\d{6} CERTIFICADO D26-/.test(n)), f.indexOf('29700692 - Fuente Lucena (certificado).pdf') === -1]), [true, true]);
await comprobar('1. el hito de Hugo: listo para enviar y la tarea de registrar hecha', hitoDe('Moreno Sanz').then((h) => [h.cadena, h.hechas]),
  ['listo-para-enviar', ['g-hacer-generar', 'g-hacer-registrar']]);

/* ===== 2. Hugo: Enviar y «Todavía no» ===== */
console.log('--- 2. Hugo: «Enviar» ---');
await abrirMesa('Moreno Sanz');
await comprobar('2. el botón dice «Enviar»', botones(), ['Enviar']);
await comprobar('2. «El documento ya está sellado.»', pagina.locator('.mesa-hacer-linea').allTextContents(), ['El documento ya está sellado.']);
await comprobar('2. sin aviso ámbar de sello preguntando de qué documento es', pagina.locator('#ficha-sellos .aviso-sello').count(), 0);
await pagina.locator('.hito-en-mesa .mesa-hacer-hito').click();
await pagina.waitForSelector('#capa:not(.oculto) #correo-caja', { timeout: 15000 });
await pagina.waitForTimeout(1200);
await comprobar('2. el cuadro de Correo, con el PDF sellado adjunto y «Todavía no»',
  pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-aceptar').textContent,
    [...document.querySelectorAll('#correo-caja input[type=checkbox]:checked')].some((c) => /^\d{6} CERTIFICADO D26-/.test(c.dataset.nombre || c.value || ''))]),
  ['Correo de este asunto', 'Todavía no', true]);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('2. «Todavía no»: el cuadro se cierra y el botón sigue en «Enviar»', Promise.all([pagina.locator('#capa:not(.oculto)').count(), botones()]), [0, ['Enviar']]);
await comprobar('2. el hito sigue listo para enviar', hitoDe('Moreno Sanz').then((h) => h.cadena), 'listo-para-enviar');

/* ===== 3. Enviar de verdad ===== */
console.log('--- 3. enviar de verdad ---');
await pagina.locator('.hito-en-mesa .mesa-hacer-hito').click();
await pagina.waitForSelector('#capa:not(.oculto) #correo-caja');
await pagina.waitForTimeout(1200);
await pagina.locator('#correo-caja button:text-is("Enviar")').click();
await pagina.waitForTimeout(600);
await pagina.locator('#cuadro-cuerpo button:visible', { hasText: /^(Sí|Mandar|Enviar ahora|Enviar|Confirmar)/ }).last().click();
await pagina.waitForTimeout(3000);
await comprobar('3. tras enviar, el botón de cerrar vuelve a «Cerrar»', pagina.locator('#cuadro-aceptar').textContent(), 'Cerrar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('3. aviso verde «Hito hecho: …» con «Deshacer»', mensajes().then((m) => m.filter((t) => /^Hito hecho: «Preparar y enviar el certificado»\./.test(t)).length), 1);
await comprobar('3. el hito está hecho y sin apunte', hitoDe('Moreno Sanz').then((h) => [h.estado, h.cadena]), ['hecho', null]);
await comprobar('3. se abre la mesa del siguiente', pagina.locator('.mesa-titulo').allTextContents(), ['Archivar el expediente']);
await comprobar('3. en Inicio ya no hay «listos para enviar»', avisos().then((a) => a.filter((t) => /listos para enviar/.test(t)).length), 0);

/* ===== 4. Irene: la cadena entera ===== */
console.log('--- 4. Irene ---');
await abrirMesa('Vidal Soto');
await comprobar('4. «Hacer este hito»', botones(), ['Hacer este hito']);
await comprobar('4. la línea de lo que hará', pagina.locator('.mesa-hacer-linea').allTextContents(),
  ['Genera «Certificado de notas» → espera el registro en Séneca → correo al tercero']);
await comprobar('4. los tres menús de siempre siguen', pagina.locator('.hito-en-mesa .mesa-abrir-panel').allTextContents(), ['Generar documento ▾', 'Comunicar ▾']);
/* 5. pregunta sin responder (se prueba antes de generar) */
console.log('--- 5. pregunta sin responder ---');
await pagina.evaluate(() => {
  window.__guionDe = Hitos.guionDe;
  Hitos.guionDe = function (a, h) {
    const l = window.__guionDe(a, h);
    return [{ id: 'q1', texto: '¿Es mayor de edad?', pregunta: true, hecho: false, noaplica: false, accion: '', opciones: [] }].concat(l);
  };
});
await pagina.locator('.hito-en-mesa .mesa-hacer-hito').click();
await pagina.waitForTimeout(1500);
await comprobar('5. aviso ámbar «Antes hay que responder: …»', pagina.$$eval('#mensajes .mensaje.ambar', (e) => e.map((x) => x.textContent)), ['Antes hay que responder: «¿Es mayor de edad?».']);
await comprobar('5. no se ha abierto nada ni se ha guardado ningún PDF', Promise.all([pagina.locator('#word-visor:not(.oculto)').count(), ficheros('Vidal Soto').then((f) => f.filter((n) => /\.pdf$/.test(n)).length)]), [0, 0]);
await pagina.evaluate(() => { Hitos.guionDe = window.__guionDe; });

console.log('--- 4b. generar, guardar el PDF y pararse en el registro ---');
await pagina.locator('.hito-en-mesa .mesa-hacer-hito').click();
await pagina.waitForSelector('#word-visor:not(.oculto) .word-visor-franja', { timeout: 30000 });
await pagina.waitForTimeout(1500);
await comprobar('4. el Word se abre en grande con la franja verde',
  pagina.locator('#word-visor .word-visor-franja').textContent().then((t) => /^Documento listo\. Ahora toca firmarlo y registrarlo en Séneca\./.test(t)), true);
await comprobar('4. el botón «Ruta» está en la franja', pagina.locator('#word-visor .word-visor-franja .boton-copiar-fila').count(), 1);
await comprobar('4. el PDF se guardó solo', ficheros('Vidal Soto').then((f) => f.filter((n) => /^\d{6} CERTIFICADO D26-.*\.pdf$/.test(n)).length), 1);
await comprobar('4. la tarea de generar, marcada; el hito esperando el sello', hitoDe('Vidal Soto').then((h) => [h.hechas, h.cadena]), [['g-hacer-generar'], 'esperando-sello']);
await pagina.evaluate(() => WordVisor.cerrar());
await pagina.waitForTimeout(1200);
await comprobar('4. el botón dice «Esperando el PDF sellado» (apagado) con «Dejar de esperar»',
  Promise.all([botones(), pagina.locator('.hito-en-mesa .mesa-hacer-espera').isDisabled(), pagina.locator('.hito-en-mesa .mesa-hacer-dejar').count()]),
  [['Esperando el PDF sellado'], true, 1]);
await comprobar('4. en Inicio, la fila dice «· esperando el sello»', (async () => {
  await pagina.click('button.pestana[data-pantalla="abiertos"]');
  await pagina.evaluate(() => Gestor.recargar());
  await pagina.waitForTimeout(2000);
  return pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="Vidal Soto"] .inicio-tabla-hito').textContent().then((t) => /· esperando el sello/.test(t));
})(), true);
await abrirMesa('Vidal Soto');
await pagina.locator('.hito-en-mesa .mesa-hacer-dejar').click();
await pagina.waitForTimeout(1500);
await comprobar('4. «Dejar de esperar»: el botón vuelve a «Hacer este hito» y no hay apunte', Promise.all([botones(), hitoDe('Vidal Soto').then((h) => h.cadena)]), [['Hacer este hito'], null]);

/* ===== 6. Un hito sin tareas de generar ni de comunicar ===== */
console.log('--- 6. un hito sin esas tareas ---');
await pagina.close();
pagina = await paginaNueva(false);
await abrirMesa('Aguilar Ponce, Marina');
await comprobar('6. sin botón «Hacer este hito», y los tres menús siguen',
  Promise.all([pagina.locator('.hito-en-mesa .mesa-hacer-hito').count(), pagina.locator('.hito-en-mesa .mesa-abrir-panel').allTextContents(), pagina.locator('.hito-en-mesa .mesa-registrar').count()]),
  [0, ['Generar documento ▾', 'Comunicar ▾'], 1]);
await pagina.close();

/* ===== 7. Solo consulta ===== */
console.log('--- 7. solo consultar ---');
const consulta = await paginaNueva(true);
await consulta.locator('#inicio-tabla-cuerpo tr[data-asunto*="Vidal Soto"] .tarjeta-nombre').first().click();
await consulta.waitForTimeout(1200);
await consulta.evaluate(() => FichaTarjetas.abrir('hitos'));
await consulta.locator('#ficha-guia .hito .hito-titulo').first().click();
await consulta.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
await consulta.waitForTimeout(600);
await comprobar('7. el botón está apagado', consulta.locator('.hito-en-mesa .mesa-hacer-hito').isDisabled(), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
