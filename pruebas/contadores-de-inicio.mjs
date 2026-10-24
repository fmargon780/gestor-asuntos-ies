/* Prueba en navegador de verdad de la fila 451 (24-oct-2026,
   docs/CONTADORES-DE-INICIO-QUE-CUADRAN.md): en Inicio, En Administración +
   En espera + Por liquidar suman siempre «Todos los abiertos»; «Dormidos» ya
   no es pestaña sino una marca «Dormido · N días» en la fila, con el filtro
   «Solo dormidos»; los asuntos sin hito por hacer van al final de «En
   Administración» con «Añade un hito o archívalo».

   Datos (tipo TRASLADO normal y tipo LIQ, que se liquida):
     - A: hito de Administración en curso, vencido.            → En Administración
     - B: hito de la familia (tutor).                          → En espera
     - C: SIN hitos, sin novedades desde hace 75 días.         → En Administración, al final, dormido
     - E: un hito, ya hecho (nada por hacer).                  → En Administración, al final
     - F: tipo LIQ, un hito ya hecho.                          → pasa solo a Por liquidar
     - G: hito de Administración marcado «Esperando a…».       → En espera
     - H: hito de la familia, sin novedades desde hace 80 días.→ En espera, dormido */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const K = {
  A: '260901 TRASLADO 26-27 Uno Vencido, Ana 1111',
  B: '260902 TRASLADO 26-27 Dos Espera, Bea 2222',
  C: '260903 TRASLADO 26-27 Tres Dormido, Cris 3333',
  E: '260905 TRASLADO 26-27 Cinco Terminado, Eva 5555',
  F: '260906 LIQ 26-27 Seis Liquidar, Fran 6666',
  G: '260907 TRASLADO 26-27 Siete Esperando, Gus 7777',
  H: '260908 TRASLADO 26-27 Ocho Dormido, Hugo 8888'
};
const FECHA_AYER = isoHaceDias(1);
const HACE_75 = new Date(Date.now() - 75 * 86400000).toISOString();
const HACE_80 = new Date(Date.now() - 80 * 86400000).toISOString();

await pagina.evaluate(async ({ K, FECHA_AYER, HACE_75, HACE_80 }) => {
  const abiertos = window.__disco.abiertos;
  for (const k of Object.keys(K)) await abiertos.getDirectoryHandle(K[k], { create: true });
  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }
  await escribir('tipos.json', [
    { tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' },
    { tipo: 'LIQ', categoria: 'ALUMNADO', organo: 'SECRETARIA', liquidar: true }
  ]);
  const fAsuntos = await g.getFileHandle('asuntos.json', { create: true });
  const j = JSON.parse(await (await fAsuntos.getFile()).text() || '{"asuntos":{}}');
  const base = { estado: 'abierto', categoria: 'ALUMNADO', abiertoPor: 'Francisco' };
  j.asuntos[K.A] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Uno Vencido, Ana 1111', limite: FECHA_AYER });
  j.asuntos[K.B] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Dos Espera, Bea 2222' });
  j.asuntos[K.C] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Tres Dormido, Cris 3333', notaEl: HACE_75 });
  j.asuntos[K.E] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Cinco Terminado, Eva 5555' });
  j.asuntos[K.F] = Object.assign({}, base, { tipo: 'LIQ', tercero: 'Seis Liquidar, Fran 6666' });
  j.asuntos[K.G] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Siete Esperando, Gus 7777' });
  j.asuntos[K.H] = Object.assign({}, base, { tipo: 'TRASLADO', tercero: 'Ocho Dormido, Hugo 8888', notaEl: HACE_80 });
  await escribir('asuntos.json', j);
  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: {
      [K.A]: { creados: '2026-09-01', hitos: [{ id: 'a1', titulo: 'Revisar', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }] },
      [K.B]: { creados: '2026-09-02', hitos: [{ id: 'b1', titulo: 'Esperar a la familia', estado: 'encurso', responsable: 'tutor' }] },
      [K.E]: { creados: '2026-09-05', hitos: [{ id: 'e1', titulo: 'Hecho', estado: 'hecho', responsable: 'administracion', hechoEl: '2026-09-06' }] },
      [K.F]: { creados: '2026-09-06', hitos: [{ id: 'f1', titulo: 'Hecho', estado: 'hecho', responsable: 'administracion', hechoEl: '2026-09-07' }] },
      [K.G]: { creados: '2026-09-07', hitos: [{ id: 'g1', titulo: 'Reclamar', estado: 'encurso', responsable: 'administracion', esperandoA: 'tutor' }] },
      [K.H]: { creados: '2026-09-08', hitos: [{ id: 'h1', titulo: 'Esperar a la familia', estado: 'encurso', responsable: 'tutor' }] }
    }
  });
  await App.cargarRegistro();
  await App.cargarTipos();
}, { K, FECHA_AYER, HACE_75, HACE_80 });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-tabla-cuerpo .inicio-tabla-fila');
/* F pasa sola a «Por liquidar» al pintar Inicio. */
await pagina.waitForFunction(() => {
  const c = document.querySelector('.inicio-pestana[data-pestana="liq"] .cuenta-lista');
  return c && c.textContent === '1';
}, null, { timeout: 15000 });

async function cuentas() {
  return pagina.evaluate(() => {
    const n = (p) => parseInt(document.querySelector('.inicio-pestana[data-pestana="' + p + '"] .cuenta-lista').textContent, 10);
    return { adm: n('adm'), esp: n('esp'), todos: n('todos'), liq: n('liq') };
  });
}
async function suma() { const c = await cuentas(); return [c.adm + c.esp + c.liq, c.todos]; }
async function irA(p) { await pagina.click('.inicio-pestana[data-pestana="' + p + '"]'); await pagina.waitForTimeout(250); }
/* Va a la pestaña y espera a que la tabla tenga tantas filas como dice su número. */
async function filasTras(p) {
  await irA(p);
  await pagina.waitForFunction((p) => {
    const n = parseInt(document.querySelector('.inicio-pestana[data-pestana="' + p + '"] .cuenta-lista').textContent, 10);
    return !!document.querySelector('.inicio-pestana.activa[data-pestana="' + p + '"]') &&
      document.querySelectorAll('#inicio-tabla-cuerpo .inicio-tabla-fila').length === n;
  }, p);
  return filas();
}
function filas() { return pagina.evaluate(() => [...document.querySelectorAll('#inicio-tabla-cuerpo .inicio-tabla-fila')].map((f) => f.dataset.asunto)); }

console.log('--- 1. la suma cuadra ---');
await comprobar('1. no hay pestaña «Dormidos»', pagina.locator('.inicio-pestana[data-pestana="dorm"]').count(), 0);
await comprobar('1. las pestañas, en orden', pagina.evaluate(() => [...document.querySelectorAll('.inicio-pestana:not(.oculto)')].map((b) => b.dataset.pestana)), ['adm', 'esp', 'todos', 'liq']);
await comprobar('1. En Administración + En espera + Por liquidar = Todos los abiertos (7)', suma(), [7, 7]);
await comprobar('1. En Administración 3 (A, C, E), En espera 3 (B, G, H), Por liquidar 1 (F)', cuentas(), { adm: 3, esp: 3, todos: 7, liq: 1 });

console.log('--- 2. «Dormido · N días», marca en la fila ---');
await irA('adm');
await comprobar('2. C lleva la marca en En Administración', pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + K.C + '"] .marca-dormido').textContent(), 'Dormido · 75 días');
await irA('esp');
await comprobar('2. H lleva la marca en En espera', pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + K.H + '"] .marca-dormido').textContent(), 'Dormido · 80 días');
await comprobar('2. B no la lleva', pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + K.B + '"] .marca-dormido').count(), 0);
await irA('todos');
await comprobar('2. en Todos los abiertos salen las dos marcas', pagina.locator('#inicio-tabla-cuerpo .marca-dormido').count(), 2);

console.log('--- 3. sin hito por hacer: al final, «Añade un hito o archívalo» ---');
await irA('adm');
const filasAdm = await filasTras('adm');
await comprobar('3. A primero; C y E (sin nada por hacer) después', [filasAdm[0], filasAdm.slice(1).sort()], [K.A, [K.C, K.E].sort()]);
await comprobar('3. C dice «Añade un hito o archívalo»', pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + K.C + '"] .inicio-sin-hito').textContent(), 'Añade un hito o archívalo');
await comprobar('3. G (Administración «Esperando a…») está en En espera', filasTras('esp').then((f) => f.includes(K.G)), true);

console.log('--- 4. «Solo dormidos» ---');
await pagina.click('#btn-filtros');
await pagina.waitForSelector('#filtros-abiertos:not(.oculto)');
await pagina.selectOption('#filtro-estado', 'dormidos');
await pagina.waitForTimeout(300);
await comprobar('4. la suma sigue cuadrando', suma(), [2, 2]);
await comprobar('4. En espera: solo H', filasTras('esp'), [K.H]);
await comprobar('4. En Administración: solo C', filasTras('adm'), [K.C]);
await comprobar('4. Todos los abiertos: C y H', filasTras('todos').then((f) => f.sort()), [K.C, K.H].sort());
await comprobar('4. Por liquidar: ninguno', cuentas().then((c) => c.liq), 0);
await pagina.selectOption('#filtro-estado', '');
await pagina.waitForTimeout(300);
await comprobar('4. sin el filtro vuelven los siete', suma(), [7, 7]);

console.log('--- 5. la suma cuadra con una búsqueda ---');
await pagina.fill('#buscar-abiertos', 'Dormido');
await pagina.waitForTimeout(400);
await comprobar('5. buscando «Dormido»: C y H', cuentas().then((c) => [c.adm + c.esp + c.liq, c.todos]), [2, 2]);
await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(400);
await comprobar('5. sin búsqueda, siete', suma(), [7, 7]);

console.log('--- 6. al hacer algo en un dormido, la marca desaparece ---');
await pagina.evaluate(async (k) => { await App.anotar(k, { notaEl: new Date().toISOString() }); }, K.C);
await pagina.evaluate(async (k) => { await Hitos.marcar(k, 'h1', 'hecho'); }, K.H);
await pagina.evaluate(() => Inicio.repintar());
await pagina.waitForTimeout(500);
await irA('todos');
await comprobar('6. ninguna marca de dormido', pagina.locator('#inicio-tabla-cuerpo .marca-dormido').count(), 0);
await comprobar('6. y la suma sigue cuadrando', suma(), [7, 7]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
