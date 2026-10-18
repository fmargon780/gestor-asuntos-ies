/* Fila 353 (docs/INICIO-MAS-COMPACTO.md): Inicio ocupa menos. Chromium real con los datos de la copia de pruebas
   (?demo=1&auto=1), con lo plegado de fábrica (sin nada guardado en el navegador).

   1. Sin título «Inicio» a la vista (sigue en la página); «Ha llegado» y los avisos dentro de la cabecera, y las
      pestañas más arriba: ya no hay una fila entera entre la cabecera y las pestañas.
   2. Cuadro de avisos plegable: «N avisos ▸», se abre, se recuerda al recargar, se vuelve a plegar.
   3. Tablón plegable: «Tablón (N) ▸» + la nota más reciente, se abre, se recuerda al recargar.
   4. Regla de apertura: con una nota para hoy sin quitar, «Inicio» del menú lo abre aunque esté plegado; si se
      pliega, se queda plegado; y no se guarda como abierto. (La copia de pruebas rehace sus datos al recargar, así
      que el caso «al arrancar» comparte la misma función, `TablonVista.reglaApertura`, y no se repite aquí.)
   5. Al bajar por la lista, «Ha llegado» y los avisos se esconden; al subir del todo, vuelven.
   6. Al cambiar de pestaña, lo de arriba no salta de sitio. */
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
async function entrar(ancho) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: 900 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await p.goto(DIRECCION);
  await cargar(p);
  return p;
}
async function cargar(p) {
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 90000 });
  await p.waitForSelector('#avisos-linea:not(.oculto)', { timeout: 40000 });
  await p.waitForSelector('#tablon.tablon-compacto', { timeout: 40000 });
  await p.waitForTimeout(1500);
}
async function recargar(p) { await p.reload(); await cargar(p); }

/* ================= 1. MÁS COMPACTO, A TRES ANCHOS ================= */
for (const ancho of [1920, 1366, 900]) {
  console.log('--- 1. la cabecera a ' + ancho + ' px ---');
  const p = await entrar(ancho);
  await comprobar('el título «Inicio» no se ve, pero sigue en la página',
    p.evaluate(() => { const h = document.querySelector('#pantalla-abiertos > header.cabecera > h2'); const r = h.getBoundingClientRect(); return [h.textContent, r.width <= 1 && r.height <= 1]; }),
    ['Inicio', true]);
  await comprobar('«Ha llegado» y los avisos están dentro de la cabecera',
    p.evaluate(() => { const c = document.querySelector('#pantalla-abiertos > header.cabecera'); return [c.contains(document.getElementById('inicio-ha-llegado-linea')), c.contains(document.getElementById('avisos-linea'))]; }),
    [true, true]);
  await comprobar('sin fila suelta entre la cabecera y las pestañas',
    p.evaluate(() => {
      const c = document.querySelector('#pantalla-abiertos > header.cabecera').getBoundingClientRect();
      const t = document.getElementById('inicio-pestanas').getBoundingClientRect();
      return t.top - c.bottom < 60;
    }), true);
  await comprobar('nada se monta encima ni se sale por los lados',
    p.evaluate(() => {
      const c = document.querySelector('#pantalla-abiertos > header.cabecera').getBoundingClientRect();
      const ids = ['btn-nuevo-asunto', 'inicio-tablon-hueco', 'buscar-abiertos', 'inicio-ha-llegado-linea', 'avisos-linea'];
      return ids.every((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.right <= c.right + 1 && r.left >= c.left - 1; })
        && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
    }), true);
  if (ancho === 1920) {
    await comprobar('el orden en la primera fila: Nuevo asunto, tablón, buscador, Ha llegado, avisos',
      p.evaluate(() => {
        const x = (id) => document.getElementById(id).getBoundingClientRect().left;
        const y = (id) => document.getElementById(id).getBoundingClientRect().top;
        return x('btn-nuevo-asunto') < x('inicio-tablon-hueco') && x('inicio-tablon-hueco') < x('buscar-abiertos')
          && x('buscar-abiertos') < x('inicio-ha-llegado-linea') && x('inicio-ha-llegado-linea') < x('avisos-linea')
          && Math.abs(y('btn-nuevo-asunto') - y('buscar-abiertos')) < 40;
      }), true);
  }
  await p.close();
}

/* ================= 2. LOS AVISOS SE PLIEGAN ================= */
console.log('--- 2. el cuadro de avisos ---');
const pagina = await entrar(1500);
await comprobar('de fábrica sale plegado: «N avisos ▸»',
  pagina.locator('#avisos-linea-plegado').textContent().then((t) => /^\d+ avisos? ▸$/.test(t.trim())), true);
await comprobar('plegado no se ven los trozos', pagina.locator('#avisos-linea .avisos-linea-trozo').count(), 0);
const nAvisos = await pagina.evaluate(() => AvisosLinea._idsActivos().length);
await comprobar('N es el número de trozos', pagina.locator('#avisos-linea-plegado').textContent().then((t) => parseInt(t, 10)), nAvisos);
const colorPlegado = await pagina.evaluate(() => document.getElementById('avisos-linea').className.indexOf('aviso-rojo') !== -1);
await pagina.click('#avisos-linea-plegado');
await comprobar('al pulsar se abre el cuadro de siempre', pagina.locator('#avisos-linea .avisos-linea-trozo').count().then((n) => n === nAvisos), true);
await comprobar('con la misma urgencia (color)', pagina.evaluate(() => document.getElementById('avisos-linea').className.indexOf('aviso-rojo') !== -1), colorPlegado);
await comprobar('y su ✕ de siempre', pagina.locator('#avisos-linea-ocultar').isVisible(), true);
await recargar(pagina);
await comprobar('al recargar sigue abierto', pagina.locator('#avisos-linea .avisos-linea-trozo').count().then((n) => n === nAvisos), true);
await pagina.click('#avisos-linea-pliega');
await comprobar('se vuelve a plegar', pagina.locator('#avisos-linea-plegado').isVisible(), true);
await recargar(pagina);
await comprobar('al recargar sigue plegado', pagina.locator('#avisos-linea-plegado').isVisible(), true);

/* ================= 3. EL TABLÓN SE PLIEGA ================= */
console.log('--- 3. el tablón ---');
const resumen = () => pagina.evaluate(() => {
  const pend = Tablon.notas().filter(Tablon.laVeo).filter((n) => !n.hecha);
  let mas = null; pend.forEach((n) => { if (!mas || (n.creado || '') > (mas.creado || '')) mas = n; });
  return { n: pend.length, texto: mas ? mas.texto.replace(/\s+/g, ' ') : '' };
});
let r = await resumen();
await comprobar('hay notas en la demo', r.n > 0, true);
await comprobar('de fábrica sale plegado: «Tablón (N) ▸» y la nota más reciente',
  pagina.locator('#tablon-plegado').textContent().then((t) => t.indexOf('Tablón (' + r.n + ') ▸') === 0 && t.indexOf(r.texto.slice(0, 15)) !== -1), true);
await comprobar('plegado no está el campo para escribir', pagina.locator('#tablon-texto').count(), 0);
await pagina.click('#tablon-plegado');
await comprobar('al pulsar se abre el tablón de siempre', pagina.locator('#tablon-texto').isVisible(), true);
await comprobar('y hay botón para plegarlo (nunca desaparece del todo)', pagina.locator('#tablon-pliega').isVisible(), true);
await recargar(pagina);
await comprobar('al recargar sigue abierto', pagina.locator('#tablon-texto').isVisible(), true);
await pagina.click('#tablon-pliega');
await comprobar('se vuelve a plegar', pagina.locator('#tablon-plegado').isVisible(), true);
await recargar(pagina);
await comprobar('al recargar sigue plegado', pagina.locator('#tablon-plegado').isVisible(), true);
await comprobar('lo recordado está en el navegador, no en _GESTOR',
  pagina.evaluate(() => JSON.parse(localStorage.getItem('gestor.inicio.plegados'))), { avisos: true, tablon: true });

/* ================= 4. LA REGLA DE APERTURA ================= */
console.log('--- 4. con una nota para hoy, «Inicio» abre el tablón ---');
const hoy = await pagina.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
await pagina.evaluate((h) => Tablon.cambiar((l) => { l.push({ id: 'n-hoy', texto: 'Llamar al inspector', color: 'amarillo', autor: 'Francisco', creado: new Date().toISOString(), para: h, privada: false, hecha: false }); return l; }), hoy);
await pagina.waitForTimeout(500);
await comprobar('sigue plegado (no hay vuelta a Inicio todavía)', pagina.locator('#tablon-plegado').isVisible(), true);
await pagina.evaluate(() => App.ir('archivo'));
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(400);
await comprobar('pulsar «Inicio» en el menú lo abre', pagina.locator('#tablon-texto').isVisible(), true);
await comprobar('y no se guarda como abierto', pagina.evaluate(() => JSON.parse(localStorage.getItem('gestor.inicio.plegados')).tablon), true);
await pagina.click('#tablon-pliega');
await comprobar('si se pliega, se queda plegado mientras se siga en Inicio', pagina.locator('#tablon-plegado').isVisible(), true);
await pagina.evaluate(() => App.ir('archivo'));
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(300);
await comprobar('volver sin pasar por el menú no lo reabre', pagina.locator('#tablon-plegado').isVisible(), true);
await pagina.evaluate(() => App.ir('archivo'));
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(300);
await comprobar('«Inicio» del menú otra vez, sí', pagina.locator('#tablon-texto').isVisible(), true);
await pagina.evaluate(() => Tablon.cambiar((l) => { l.forEach((n) => { if (n.id === 'n-hoy') n.hecha = true; }); return l; }));
await recargar(pagina);
await comprobar('sin nota para hoy, sale como se dejó (plegado)', pagina.locator('#tablon-plegado').isVisible(), true);
await recargar(pagina);

/* ================= 5. AL BAJAR POR LA LISTA ================= */
console.log('--- 5. al bajar, «Ha llegado» y los avisos se esconden ---');
await pagina.evaluate(() => { document.getElementById('avisos-linea-plegado') && document.getElementById('avisos-linea-plegado').click(); });
await comprobar('arriba se ven los dos', pagina.evaluate(() => [document.getElementById('inicio-ha-llegado-linea'), document.getElementById('avisos-linea')].map((e) => e.getBoundingClientRect().height > 0)), [true, true]);
await pagina.evaluate(() => { const f = document.createElement('div'); f.id = 'relleno-prueba'; f.style.height = '3000px'; document.querySelector('main.contenido').appendChild(f); });
await pagina.evaluate(() => window.scrollTo(0, 800));
await pagina.waitForTimeout(700);
await comprobar('la cabecera se encoge', pagina.evaluate(() => document.querySelector('#pantalla-abiertos > header.cabecera').classList.contains('encogida')), true);
await comprobar('«Ha llegado» y los avisos desaparecen', pagina.evaluate(() => [document.getElementById('inicio-ha-llegado-linea'), document.getElementById('avisos-linea')].map((e) => e.getBoundingClientRect().height > 0)), [false, false]);
await comprobar('el buscador y el tablón se quedan', pagina.evaluate(() => [document.getElementById('buscar-abiertos'), document.getElementById('inicio-tablon-hueco')].map((e) => e.getBoundingClientRect().height > 0)), [true, true]);
await comprobar('los títulos fijos de la tabla siguen bajo la cabecera',
  pagina.evaluate(() => {
    const c = document.querySelector('#pantalla-abiertos > header.cabecera').getBoundingClientRect();
    const p = document.getElementById('inicio-pestanas').getBoundingClientRect();
    return p.top >= c.bottom - 2 && p.top <= c.bottom + 60;
  }), true);
await pagina.evaluate(() => window.scrollTo(0, 0));
await pagina.waitForTimeout(900);
await comprobar('al subir del todo vuelven', pagina.evaluate(() => [document.getElementById('inicio-ha-llegado-linea'), document.getElementById('avisos-linea')].map((e) => e.getBoundingClientRect().height > 0)), [true, true]);

/* ================= 6. AL CAMBIAR DE PESTAÑA NO SALTA ================= */
console.log('--- 6. cambiar de pestaña no mueve lo de arriba ---');
const alto = () => pagina.evaluate(() => Math.round(document.getElementById('inicio-pestanas').getBoundingClientRect().top));
const antes = await alto();
for (const nombre of ['adm', 'todos']) {
  const b = pagina.locator('.inicio-pestana[data-pestana="' + nombre + '"]');
  if (await b.count()) { await b.click(); await pagina.waitForTimeout(300); await comprobar('las pestañas siguen en su sitio tras «' + nombre + '»', alto(), antes); }
}

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\nFALLARON ' + fallos : '\nTodo bien');
process.exit(fallos ? 1 : 0);
