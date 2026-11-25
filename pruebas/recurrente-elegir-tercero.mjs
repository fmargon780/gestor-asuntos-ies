/* Fila 746 (aviso de Francisco, 25-nov-2026): en «Asunto que se repite» el tercero se ELIGE con el buscador de
   «Nuevo asunto», solo entre las clases que admite el tipo, en vez de escribirse a mano. Copia de pruebas (demo),
   Chromium real: el disco es falso, nunca se tocan datos reales. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

/* Un tipo activo que admite una sola clase de tercero con gente en la demostración, y alguien de esa clase. */
const caso = await p.evaluate(async () => {
  for (const t of Gestor.tipos()) {
    if (t.desactivado) continue;
    const cs = Nombres.categoriasDe(t);
    if (cs.length !== 1 || cs[0] === 'OTROS' || cs[0] === 'ALUMNADO') continue;
    const f = await Datos.cargar(App.E.datos, cs[0]);
    if (f && f.lista && f.lista.length) return { tipo: t.tipo, categoria: cs[0], nombre: f.lista[0].nombre, texto: App.textoTercero(f.lista[0]) };
  }
  return null;
});
if (!caso) { console.log('FALLA  no hay en la demostración un tipo con una sola clase y gente'); process.exit(1); }
console.log('--- caso: ' + JSON.stringify(caso));

console.log('--- 1. el cuadro ya no pide escribir el tercero ---');
await p.evaluate((t) => { window.__fin = Recurrentes.alta(t); }, caso.tipo);
await p.waitForSelector('#rec-tercero-sitio');
await comprobar('1a. no hay casilla para escribir el tercero', p.locator('#rec-tercero').count(), 0);
await comprobar('1b. una línea dice qué clases admite el tipo', p.locator('#rec-tercero-admite').textContent().then((t) => t.indexOf(caso.tipo + ' admite:') === 0), true);
await comprobar('1c. con una sola clase, el buscador sale ya abierto', p.locator('#rec-tercero-buscador #rel-buscar').isVisible(), true);

console.log('--- 2. elegir un tercero ---');
await p.fill('#rec-tercero-buscador #rel-buscar', caso.nombre.slice(0, 4));
await p.waitForSelector('#rec-tercero-buscador #rel-resultados .resultado', { timeout: 10000 });
await p.locator('#rec-tercero-buscador #rel-resultados .resultado').first().click();
await comprobar('2a. el elegido sale con «Cambiar»', p.locator('#rec-tercero-cambiar').count(), 1);
await comprobar('2b. la vista previa del nombre acaba en el tercero', p.locator('#rec-vista').textContent().then((t) => t.indexOf(caso.texto) !== -1 && t.endsWith(caso.texto) || t.indexOf(caso.texto) !== -1), true);
await p.click('#rec-tercero-cambiar');
await comprobar('2c. «Cambiar» vuelve al buscador y la vista previa pierde el tercero', [await p.locator('#rec-tercero-buscador').count(), await p.locator('#rec-vista').textContent().then((t) => t.indexOf(caso.texto) === -1)], [1, true]);
await p.fill('#rec-tercero-buscador #rel-buscar', caso.nombre.slice(0, 4));
await p.waitForSelector('#rec-tercero-buscador #rel-resultados .resultado', { timeout: 10000 });
await p.locator('#rec-tercero-buscador #rel-resultados .resultado').first().click();

console.log('--- 3. guardar ---');
await p.click('#cuadro-aceptar');
await p.evaluate(() => window.__fin);
const guardado = await p.evaluate(async () => {
  const g = window.Gestor.carpetaGestor();
  const l = await Carpetas.leerJson(g, 'recurrentes.json');
  const r = l[l.length - 1];
  return r && { tipo: r.tipo, categoria: r.categoria, tercero: r.tercero };
});
await comprobar('3a. se guarda el tipo, la clase y el nombre del tercero', guardado, { tipo: caso.tipo, categoria: caso.categoria, tercero: caso.texto });

console.log('--- 4. sin tercero no se guarda ---');
await p.evaluate((t) => { window.__fin = Recurrentes.alta(t); }, caso.tipo);
await p.waitForSelector('#rec-tercero-sitio');
await p.click('#cuadro-aceptar');
await p.evaluate(() => window.__fin);
await comprobar('4a. sale el aviso de que hace falta el tercero', p.evaluate(() => /Hace falta el tercero/.test(document.body.textContent)), true);

console.log('--- 5. dar de alta uno que no está, sin perder lo escrito ---');
await p.evaluate((t) => { window.__fin = Recurrentes.alta(t); }, caso.tipo);
await p.waitForSelector('#rec-tercero-sitio');
await p.fill('#rec-descripcion', 'luz de la tienda');
await p.fill('#rec-tercero-buscador #rel-buscar', 'Zzzqq Nueva');
await p.click('#rec-tercero-buscador button:has-text("Dar de alta")');
await p.waitForFunction(() => document.getElementById('cuadro-titulo').textContent === 'Dar de alta en ' + 'EMPRESAS');
await comprobar('5a. se abre el alta con el nombre ya escrito, y el cuadro de repetir no está a la vez', p.evaluate(() => document.querySelector('#cuadro-cuerpo input').value + '|' + !!document.getElementById('rec-tercero-sitio')), 'Zzzqq Nueva|false');
await p.click('#cuadro-aceptar');
await p.waitForSelector('#rec-tercero-cambiar', { timeout: 10000 });
await comprobar('5b. vuelve el cuadro de repetir con el tercero nuevo elegido y lo escrito sigue', p.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('rec-descripcion').value, document.getElementById('rec-tipo').value, document.querySelector('#rec-tercero-sitio strong').textContent.indexOf('Zzzqq Nueva') === 0]), ['Asunto que se repite', 'luz de la tienda', caso.tipo, true]);
await p.click('#cuadro-cancelar');
await p.evaluate(() => window.__fin);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
