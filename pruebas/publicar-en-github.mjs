/* Fila 730 (docs/718-ABRIR-LA-APP-DESDE-GITHUB.md, parte 1): la copia que se publica en
   https://gestor-asuntos-ies.github.io, preparada por scripts/versionar-copia.mjs, con Chromium real.
   Monta la copia como la acción .github/workflows/publicar-github.yml (solo la app), la sirve con un
   servidor propio que ignora el `?v=` y comprueba: todas las piezas piden `?v=<versión>`, la
   Content-Security-Policy va en index.html, la app arranca sin errores y el flujo existe. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, marcaDeVersion, versionDeJs, versionarIndex, versionarPiezas } from '../scripts/versionar-copia.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (ok) console.log('bien   ' + titulo);
  else { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
}

/* ---------- la copia, montada como la acción ---------- */
const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'sitio-'));
const FUERA = new Set(['_sitio', '.git', 'node_modules', 'docs', 'pruebas', 'plantilla', 'apps-script', 'herramientas', '.github',
  'CLAUDE.md', '.claude', '.gitignore', '.vercelignore', 'vercel.json', 'README.md', 'package.json', 'package-lock.json', 'scripts']);
for (const e of fs.readdirSync(RAIZ)) { if (!FUERA.has(e)) fs.cpSync(path.join(RAIZ, e), path.join(copia, e), { recursive: true }); }
const version = versionDeJs(fs.readFileSync(path.join(copia, 'js/version.js'), 'utf8'));
const marca = marcaDeVersion(version);
comprobar('la marca de la versión es solo letras, cifras y guiones', /^[A-Za-z0-9-]+$/.test(marca), true);
comprobar('«25-nov-2026 · 13:08» pasa a «25-nov-2026-13-08»', marcaDeVersion('25-nov-2026 · 13:08'), '25-nov-2026-13-08');

const indexAntes = fs.readFileSync(path.join(copia, 'index.html'), 'utf8');
fs.writeFileSync(path.join(copia, 'index.html'), versionarIndex(indexAntes, marca));
const piezas = fs.readdirSync(path.join(copia, 'js')).filter((f) => /^cargar-piezas-\d+\.js$/.test(f));
for (const f of piezas) {
  const p = path.join(copia, 'js', f);
  const antes = fs.readFileSync(p, 'utf8');
  const despues = versionarPiezas(antes, marca);
  comprobar(f + ' cambia el modo de escribir sus <script>', despues !== antes, true);
  fs.writeFileSync(p, despues);
}

/* ---------- lo escrito ---------- */
const index = fs.readFileSync(path.join(copia, 'index.html'), 'utf8');
const locales = [...index.matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)="([^"]*)"/g)].map((m) => m[1]).filter((r) => !/^(https?:|\/\/|#)/.test(r));
comprobar('index.html: todo lo local lleva ?v=' + marca, locales.filter((r) => r.indexOf('?v=' + marca) === -1), []);
comprobar('index.html: hay hojas de estilo y scripts versionados', locales.length > 40, true);
comprobar('index.html lleva la Content-Security-Policy y sin frame-ancestors',
  index.indexOf('<meta http-equiv="Content-Security-Policy" content="' + CSP + '">') !== -1 && CSP.indexOf('frame-ancestors') === -1, true);
comprobar('la Content-Security-Policy va antes de cualquier script', index.indexOf('Content-Security-Policy') < index.indexOf('<script'), true);
comprobar('el icono y la hoja principal siguen apuntando a su fichero',
  index.indexOf('href="favicon.svg?v=' + marca + '"') !== -1 && index.indexOf('href="css/estilos.css?v=' + marca + '"') !== -1, true);
for (const f of piezas) {
  const t = fs.readFileSync(path.join(copia, 'js', f), 'utf8');
  comprobar(f + ' escribe sus <script> con ?v=', t.indexOf("'?v=" + marca + '">') !== -1, true);
}
comprobar('versionar dos veces no repite el ?v= en index.html', versionarIndex(index, marca), index);
const vercel = JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8'));
const cspVercel = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
comprobar('la <meta> repite la de vercel.json (menos frame-ancestors)', cspVercel.replace(/^frame-ancestors[^;]*;\s*/, ''), CSP);

/* ---------- la acción existe y hace lo que dice ---------- */
const flujo = fs.readFileSync(path.join(RAIZ, '.github/workflows/publicar-github.yml'), 'utf8');
comprobar('el flujo se lanza solo a mano', /^on:\n  workflow_dispatch:\n\n/m.test(flujo) && flujo.indexOf('push:') === -1, true);
comprobar('el flujo usa PAGES_TOKEN y sube al repositorio de la organización',
  flujo.indexOf('secrets.PAGES_TOKEN') !== -1 && flujo.indexOf('gestor-asuntos-ies/gestor-asuntos-ies.github.io.git') !== -1, true);
comprobar('el flujo pone la hora de la versión, versiona y comprueba la versión servida',
  ['version-al-publicar.mjs', 'versionar-copia.mjs', 'js/version.js?v='].every((t) => flujo.indexOf(t) !== -1), true);
const fuera = [...flujo.matchAll(/--exclude '\/([^']+)'/g)].map((m) => m[1]);
const pagesFuera = [...fs.readFileSync(path.join(RAIZ, '.github/workflows/pruebas-pages.yml'), 'utf8').matchAll(/--exclude '\/([^']+)'/g)].map((m) => m[1]);
comprobar('deja fuera lo mismo que la dirección de prueba', [...new Set(fuera)].sort(), [...new Set(pagesFuera)].sort());

/* ---------- Chromium real, sirviendo la copia (ignora el ?v=) ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const pedidos = [];
const servidor = http.createServer((q, r) => {
  const url = new URL(q.url, 'http://x');
  pedidos.push(url.pathname + url.search);
  let f = path.join(copia, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!f.startsWith(copia) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  r.end(fs.readFileSync(f));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const puerto = servidor.address().port;

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--host-resolver-rules=MAP gestor-asuntos-ies.github.io 127.0.0.1']
});
const pagina = await navegador.newPage();
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto('http://gestor-asuntos-ies.github.io:' + puerto + '/');
await pagina.waitForLoadState('load', { timeout: 60000 });
await pagina.waitForSelector('#arranque', { timeout: 20000 });
await pagina.waitForTimeout(800);
comprobar('la app de la copia arranca sin errores de consola (la CSP no la rompe)', errores, []);
comprobar('la versión que enseña la app es la de la copia', await pagina.evaluate(() => window.App && App.VERSION), version);
comprobar('no hay demostración ni franja', await pagina.locator('#franja-demo, #btn-demo-entrar').count(), 0);
comprobar('ofrece señalar carpetas', await pagina.locator('#btn-abiertos, #btn-archivo').count(), 2);
const jsPedidos = pedidos.filter((p) => /^\/js\/[^/]+\.js/.test(p));
comprobar('todas las piezas de js/ se piden con ?v=' + marca, jsPedidos.filter((p) => p.indexOf('?v=' + marca) === -1), []);
comprobar('se pidieron muchas piezas', jsPedidos.length > 100, true);
comprobar('ninguna petición falla (404)', await pagina.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.responseStatus === 404).map((e) => e.name)), []);

await navegador.close();
servidor.close();
fs.rmSync(copia, { recursive: true, force: true });
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de publicar en GitHub pasan.');
process.exit(fallos ? 1 : 0);
