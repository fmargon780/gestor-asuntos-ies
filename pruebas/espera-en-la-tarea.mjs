/* Prueba de la fila 702 de docs/COLA.md (docs/702-ESPERA-EN-LA-TAREA.md): la espera es de la tarea, con su día para volver a mirar.
   «Esperando a…» en el ⋮ de una tarea (el día es obligatorio), la línea y los tres botones bajo la tarea, el panel, «En espera» de Inicio,
   el asunto que vuelve a «En Administración» con «Reclamar a…» al llegar el día y el aviso «N esperas por reclamar».
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const TIPO = 'PRUEBA ESPERA EN LA TAREA';
const [A, CON_HITOS] = await pagina.evaluate(() => App.E.listaAbiertos.slice(0, 2).map((a) => a.nombre));
await pagina.evaluate(async ([tipo, a, c]) => {
  App.E.tipos.push({ tipo: tipo, categoria: 'ALUMNADO', sinHitos: true });
  await App.guardarTipos();
  await Hitos.cambiar((d) => { d.porAsunto[c] = { creados: U.hoyIso(), hitos: [Hitos.pasoAHito({ id: 'p1', titulo: 'Primer paso' })] }; delete d.porAsunto[a]; return d; });
  await Hitos.crearDesdeGuia(a, tipo);
  const h = (await Hitos.hitosDe(a))[0];
  for (const t of ['Pedir el certificado', 'Enviar la carta', 'Archivar la copia']) await Hitos.anadirGuionPropio(a, h.id, t);
}, [TIPO, A, CON_HITOS]);

const PRIMERA = '#ficha-guia .ash-tarea:first-child';
const hoy = () => pagina.evaluate(() => U.hoyIso());
const mas = (iso, dias) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); };
const HOY = await hoy();
const MANANA = mas(HOY, 1);

async function abrirFicha(clave) {
  await inicio('todos');   /* en «Todos los abiertos» está siempre, esté donde esté su espera */
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .ash', { timeout: 10000 });
  await pagina.waitForTimeout(400);
}
async function inicio(pestana) {
  await pagina.evaluate(async (p) => { App.ir('abiertos'); InicioTabla.cambiar(p); await InicioTabla.pintar(); }, pestana);
  await pagina.waitForTimeout(500);
}
const panel = () => pagina.locator('#ficha-guia .ash-panel').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
const lineaEspera = () => pagina.locator('#ficha-guia .ash-tarea').first().locator('.ash-espera-texto').innerText().then((t) => t.replace(/\s+/g, ' ').trim()).catch(() => null);
const botonesEspera = () => pagina.locator('#ficha-guia .ash-tarea').first().locator('.ash-espera button').allTextContents();
const fila = (clave) => pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"]');
const textoFila = async (clave) => (await fila(clave).count()) ? (await fila(clave).innerText()).replace(/\s+/g, ' ').trim() : null;
const esperaGuardada = () => pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k))[0];
  return Object.values(h.guionHecho || {}).map((e) => e.espera || null).filter(Boolean);
}, A);
async function ponerDia(dia) { await pagina.fill('#te-dia', dia); }

console.log('--- poner la tarea en espera ---');
await abrirFicha(A);
await pagina.locator('#ficha-guia .ash-tarea').first().locator('.ash-menu-boton').click();
await comprobar('1. «Esperando a…» está en el ⋮ de una tarea sin hacer', pagina.locator(PRIMERA + ' .ash-esperando-opcion').count(), 1);
await pagina.locator(PRIMERA + ' .ash-esperando-opcion').click();
await pagina.waitForSelector('#te-quien');
await comprobar('2. la ventana pide a quién y qué día, y el día nace vacío', pagina.evaluate(() => [document.querySelectorAll('#te-quien option').length > 1, document.getElementById('te-dia').value]), [true, '']);
await pagina.selectOption('#te-quien', 'tutor');
await pagina.click('#te-ok');
await comprobar('3. sin día no deja poner la espera', pagina.evaluate(() => [!!document.getElementById('te-quien'), !document.getElementById('te-aviso').classList.contains('oculto')]), [true, true]);
await comprobar('3. y no se ha guardado nada', esperaGuardada(), []);
await ponerDia(MANANA);
await pagina.click('#te-ok');
await pagina.waitForSelector('#ficha-guia .ash-espera');
await comprobar('4. se guarda en la tarea con su día', esperaGuardada().then((l) => l.map((e) => [e.quien, e.desde, e.volver])), [['tutor', HOY, MANANA]]);
await comprobar('5. bajo la tarea sale la línea con a quién, desde cuándo y cuándo volver', lineaEspera().then((t) => /^Esperando a Familia desde el \d+-\w{3} · volver a mirarlo el \d+-\w{3}$/.test(t)), true);
await comprobar('6. con sus tres botones', botonesEspera(), ['Ya ha llegado', 'Cambiar el día', 'Dejar de esperar']);
await comprobar('7. el panel dice a quién se espera y cuándo volver a mirarlo', panel().then((t) => /^Esperando a Familia · volver a mirarlo el \d+-\w{3}/.test(t)), true);
await comprobar('8. el ⋮ de esa tarea ya no ofrece «Esperando a…»', (async () => {
  await pagina.locator('#ficha-guia .ash-tarea').first().locator('.ash-menu-boton').click();
  const n = await pagina.locator(PRIMERA + ' .ash-esperando-opcion').count();
  await pagina.keyboard.press('Escape');
  return n;
})(), 0);

console.log('--- Inicio: En espera ---');
await inicio('esp');
await comprobar('9. el asunto está en «En espera» con «Esperando a Familia · hasta el día»', textoFila(A).then((t) => !!t && /Esperando a Familia · hasta el \d+-\w{3}/.test(t)), true);
await comprobar('10. y «Le toca a» Familia', textoFila(A).then((t) => !!t && / Familia( |$)/.test(t.replace(/Esperando a Familia/, ''))), true);
await inicio('adm');
await comprobar('11. ya no está en «En Administración»', textoFila(A), null);
await comprobar('12. sin esperas vencidas no sale el aviso', pagina.evaluate(() => AvisosLinea._idsActivos().indexOf('esperas-por-reclamar') === -1), true);

console.log('--- llega el día: vuelve a Administración ---');
await abrirFicha(A);
await pagina.locator('#ficha-guia .ash-espera-dia').click();
await pagina.waitForSelector('#te-dia');
await comprobar('13. «Cambiar el día» solo pide el día, vacío', pagina.evaluate(() => [!!document.getElementById('te-quien'), document.getElementById('te-dia').value]), [false, '']);
await ponerDia(HOY);
await pagina.click('#te-ok');
await pagina.waitForFunction(() => /Tocaba volver/.test(document.querySelector('#ficha-guia .ash-espera-texto').innerText), null, { timeout: 8000 });
await comprobar('14. el panel dice «Toca volver a mirarlo: la tarea»', panel().then((t) => t.indexOf('Toca volver a mirarlo: Pedir el certificado') === 0), true);
await comprobar('15. bajo la tarea: «Se espera a… Tocaba volver a mirarlo el…»', lineaEspera().then((t) => /^Se espera a Familia desde el \d+-\w{3}\. Tocaba volver a mirarlo el \d+-\w{3}\.$/.test(t)), true);
await comprobar('16. «Cambiar el día» pasa a «Seguir esperando…»', botonesEspera(), ['Ya ha llegado', 'Seguir esperando…', 'Dejar de esperar']);
await inicio('adm');
await comprobar('17. el asunto vuelve a «En Administración» con «Reclamar a Familia · espera desde el día»', textoFila(A).then((t) => !!t && /Reclamar a Familia · espera desde el \d+-\w{3}/.test(t)), true);
await pagina.evaluate(() => { InicioPlegados.poner('avisos', false); AvisosLinea.refrescar(); });   /* la línea de avisos viene plegada: se despliega */
await pagina.waitForTimeout(300);
await comprobar('18. el aviso «1 espera por reclamar» sale en Inicio', pagina.evaluate(() => AvisosLinea._idsActivos().indexOf('esperas-por-reclamar') !== -1 && document.querySelector('#avisos-linea [data-aviso="esperas-por-reclamar"]').textContent === '1 espera por reclamar'), true);
await comprobar('19. pulsarlo enseña solo esos asuntos', (async () => {
  await pagina.locator('.avisos-linea-trozo', { hasText: 'por reclamar' }).first().click();
  await pagina.waitForTimeout(600);
  return pagina.evaluate(() => Array.from(document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')).length);
})(), 1);
await pagina.click('#inicio-quitar-filtro');
await pagina.waitForTimeout(600);
await comprobar('20. «Ver todo» lo quita', pagina.evaluate(() => document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length > 1), true);

console.log('--- dejar de esperar y ya ha llegado ---');
await abrirFicha(A);
await pagina.locator('#ficha-guia .ash-espera-dejar').click();
await pagina.waitForFunction(() => !document.querySelector('#ficha-guia .ash-espera'), null, { timeout: 8000 });
await comprobar('21. «Dejar de esperar» vuelve a por hacer, sin espera guardada', Promise.all([panel().then((t) => t.indexOf('Ahora toca: Pedir el certificado') === 0), esperaGuardada()]), [true, []]);
await pagina.evaluate(async ([k, t]) => { const h = (await Hitos.hitosDe(k))[0]; const g = Hitos.guionDe(null, h)[0]; await Hitos.cambiar((d) => { const x = Hitos.buscar(d.porAsunto[k].hitos, h.id); x.guionHecho = x.guionHecho || {}; x.guionHecho[g.id] = { espera: { quien: 'tercero', desde: t, volver: t } }; return d; }); }, [A, HOY]);
await abrirFicha(A);
await pagina.locator('#ficha-guia .ash-espera-llegado').click();
await pagina.waitForFunction(() => !document.querySelector('#ficha-guia .ash-espera'), null, { timeout: 8000 });
await comprobar('22. «Ya ha llegado» deja la tarea hecha y sin espera', Promise.all([
  pagina.locator('#ficha-guia .ash-tarea').first().evaluate((x) => x.classList.contains('hecha')), esperaGuardada()]), [true, []]);
await inicio('esp');
await comprobar('23. sin ninguna espera viva, el asunto no está en «En espera»', textoFila(A), null);

console.log('--- lo de siempre ---');
await comprobar('24. un asunto con hitos no cambia', pagina.evaluate(async (k) => { const d = await Hitos.leer(); const r = Hitos.aQuienLeToca(d.porAsunto[k].hitos, d.ajustes); return [!!r.reclamar, !!r.listaDeTareas]; }, CON_HITOS), [false, false]);
await comprobar('25. sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
