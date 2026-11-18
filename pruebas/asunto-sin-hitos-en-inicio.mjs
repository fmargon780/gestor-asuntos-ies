/* Prueba de la fila 700 de docs/COLA.md (docs/700-ASUNTO-SIN-HITOS-EN-INICIO.md): un asunto «lista de tareas» sale en Inicio con
   «Tarea N de M · frase», «Listo para cerrar» o «Sin tareas»; en «En Administración»; con su plazo; y ningún texto dice «hito».
   Los asuntos con hitos salen como siempre. Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1). */
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

const TIPO = 'PRUEBA SIN HITOS INICIO';
const claves = await pagina.evaluate(() => App.E.listaAbiertos.slice(0, 3).map((a) => a.nombre));
const [A, B, CON_HITOS] = claves;

/* A: lista de tareas con tres tareas; B: lista de tareas sin tareas; CON_HITOS: un asunto de siempre. */
await pagina.evaluate(async ([tipo, a, b, c]) => {
  App.E.tipos.push({ tipo: tipo, categoria: 'ALUMNADO', sinHitos: true });
  await App.guardarTipos();
  await Hitos.cambiar((d) => { d.porAsunto[c] = { creados: U.hoyIso(), hitos: [Hitos.pasoAHito({ id: 'p1', titulo: 'Primer paso' })] }; delete d.porAsunto[a]; delete d.porAsunto[b]; return d; });
  await Hitos.crearDesdeGuia(a, tipo);
  await Hitos.crearDesdeGuia(b, tipo);
  const h = (await Hitos.hitosDe(a))[0];
  for (const t of ['Pedir el certificado', 'Enviar la carta', 'Archivar la copia']) await Hitos.anadirGuionPropio(a, h.id, t);
}, [TIPO, A, B, CON_HITOS]);
const ponerPlazo = (clave, iso) => pagina.evaluate(async ([k, f]) => {
  await App.anotar(k, { limite: f, limiteEl: U.ahora(), limitePor: App.E.usuario });
  const x = App.E.listaAbiertos.filter((y) => y.nombre === k)[0];
  if (x && x.ficha) x.ficha.limite = f;
}, [clave, iso]);
const marcarTarea = (clave, indice, hecha) => pagina.evaluate(async ([k, i, h]) => {
  const a = App.E.listaAbiertos.filter((y) => y.nombre === k)[0];
  const hito = (await Hitos.hitosDe(k))[0];
  const t = Hitos.guionDe(a, hito)[i];
  await Hitos.marcarGuion(k, hito.id, t.id, { hecho: h });
}, [clave, indice, hecha]);
async function inicio(pestana) {
  await pagina.evaluate(async (p) => { App.ir('abiertos'); InicioTabla.cambiar(p); await InicioTabla.pintar(); }, pestana);
  await pagina.waitForTimeout(500);
}
const fila = (clave) => pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"]');
const celda = async (clave, n) => (await fila(clave).locator('td').nth(n).innerText()).replace(/\s+/g, ' ').trim();
const columnas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#inicio-thead-normal th')).map((t) => t.dataset.col || ''));
async function texto(clave, col) { const i = (await columnas()).indexOf(col); return celda(clave, i); }

console.log('--- Inicio: tareas sin hacer ---');
await ponerPlazo(A, '2000-01-03');
await inicio('adm');
await comprobar('1. sale en «En Administración» con «Tarea 1 de 3 · frase»', [await fila(A).count(), await texto(A, 'hito')], [1, 'Tarea 1 de 3 · Pedir el certificado']);
await comprobar('1. «Le toca a» dice Administración', texto(A, 'quien'), 'Administración');
await comprobar('1. el plazo es el del asunto (vencido)', fila(A).locator('td .marca-plazo.plazo-vencido').count(), 1);
await comprobar('1. cuenta en el número rojo de vencidos', pagina.evaluate(() => Number(document.querySelector('.inicio-pestana[data-pestana="adm"] .cuenta-roja').textContent) || 0).then((n) => n >= 1), true);
await marcarTarea(A, 0, true);
await inicio('adm');
await comprobar('2. al marcar la primera, pasa a «Tarea 2 de 3 · …»', texto(A, 'hito'), 'Tarea 2 de 3 · Enviar la carta');

console.log('--- Inicio: todas hechas y sin tareas ---');
await marcarTarea(A, 1, true);
await marcarTarea(A, 2, true);
await inicio('adm');
await comprobar('3. con todas hechas dice «Listo para cerrar» y sigue en «En Administración»', [await fila(A).count(), await texto(A, 'hito')], [1, 'Listo para cerrar']);
await comprobar('3. «Listo para cerrar» sigue contando en vencidos con el plazo pasado', pagina.evaluate(() => Number(document.querySelector('.inicio-pestana[data-pestana="adm"] .cuenta-roja').textContent) || 0).then((n) => n >= 1), true);
await comprobar('3. sin tareas dice «Sin tareas» y va en «En Administración»', [await fila(B).count(), await texto(B, 'hito')], [1, 'Sin tareas']);
await comprobar('3. y no sale en «En espera»', inicio('esp').then(() => fila(B).count()), 0);

console.log('--- el filtro «Situación» y «Todos los abiertos» ---');
await marcarTarea(A, 2, false);
await inicio('todos');
await comprobar('4. en «Todos los abiertos» dice lo mismo', texto(A, 'hito'), 'Tarea 3 de 3 · Archivar la copia');
const filtrar = async (valor) => {
  await pagina.evaluate(async (v) => { const s = document.getElementById('filtro-estado'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, valor);
  await pagina.waitForTimeout(400);
};
await filtrar('administracion');
await comprobar('4. «Nos toca» lo incluye', fila(A).count(), 1);
await filtrar('terceros');
await comprobar('4. «Esperan a terceros» no lo incluye', fila(A).count(), 0);
await filtrar('listo');
await comprobar('4. «Listos para cerrar» no incluye el que aún tiene tareas', fila(A).count(), 0);
await marcarTarea(A, 2, true);
await pagina.evaluate(() => App.pintarAbiertos());
await filtrar('listo');
await comprobar('4. «Listos para cerrar» sí lo incluye con todas hechas', fila(A).count(), 1);
await filtrar('');
await marcarTarea(A, 2, false);

console.log('--- ningún texto dice «hito» ---');
await inicio('adm');
await comprobar('5. en la fila de Inicio no se lee «hito»', pagina.evaluate((k) => /hito/i.test(document.querySelector('#inicio-tabla-cuerpo tr[data-asunto="' + k + '"]').innerText), A), false);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + A + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('#ficha-guia .ash', { state: 'attached', timeout: 10000 });
await pagina.waitForTimeout(600);
const hitoEnFicha = () => pagina.evaluate(() => {
  const ruido = /(Hito actual|Hito ▾)/;
  return Array.from(document.querySelectorAll('#pantalla-asunto *')).filter((e) => e.children.length === 0 && /hito/i.test(e.textContent) && !e.closest('.oculto') && e.offsetParent !== null)
    .map((e) => e.textContent.trim()).filter((t) => !ruido.test(t));
});
await comprobar('5. en la ficha no se lee «hito» en nada que se vea', hitoEnFicha(), []);
await pagina.evaluate(async (k) => {
  const a = App.E.listaAbiertos.filter((y) => y.nombre === k)[0];
  const h = (await Hitos.hitosDe(k))[0];
  await NotasHito.anadirDesdeTarea(a, h, Hitos.guionDe(a, h)[0], 'Pedir el certificado: llamada hecha');
}, A);
await pagina.waitForTimeout(500);
await comprobar('5. el Registro no nombra el hito en sus líneas', pagina.evaluate(() => Array.from(document.querySelectorAll('#pantalla-asunto .nota-hito')).length), 0);

console.log('--- guardar un documento desde la bandeja ---');
await comprobar('6. el bloque «¿De qué tarea es?» no pregunta hito ni tarea', pagina.evaluate(async (k) => {
  const a = App.E.listaAbiertos.filter((y) => y.nombre === k)[0];
  const caja = document.createElement('div');
  document.body.appendChild(caja);
  await DocumentoTareaBloque.montar(caja, a, { tipo: () => 'CERTIFICADO' });
  const salida = [caja.querySelectorAll('select').length, /hito/i.test(caja.textContent), DocumentoTareaBloque.destino().sinTarea === true];
  caja.remove();
  return salida;
}, A), [0, false, true]);

console.log('--- los asuntos con hitos, como siempre ---');
await inicio('adm');
const t = await texto(CON_HITOS, 'hito');
await comprobar('7. un asunto con hitos sigue diciendo «Hito N de M»', /^Hito 1 de 1 · Primer paso/.test(t), true);
await comprobar('7. y no tiene marca de lista de tareas', pagina.evaluate(async (k) => {
  const r = Hitos.aQuienLeToca((await Hitos.hitosDe(k)), null);
  return !!r.listaDeTareas;
}, CON_HITOS), false);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
