/* ============================================================
   versionar-copia.mjs — prepara la copia de la app que se publica en
   https://gestor-asuntos-ies.github.io (fila 730, docs/718-ABRIR-LA-APP-DESDE-GITHUB.md).

   Lo llama .github/workflows/publicar-github.yml SOLO sobre la copia
   (`_sitio`), nunca sobre el repositorio: lo que queda en git no cambia.

   GitHub Pages guarda 10 minutos cada fichero y no deja cambiar sus
   cabeceras. Para que un index.html viejo no cargue piezas nuevas (ni al
   revés), cada pieza se pide con `?v=<App.VERSION>`: al cambiar la versión
   cambia la dirección de todas a la vez. Se versionan:
     · los `href`/`src` locales de index.html (hojas de estilo, scripts, icono);
     · las piezas de js/cargar-piezas-N.js, que escriben sus <script> con document.write.
   Además pone en index.html la misma Content-Security-Policy que vercel.json
   da por cabecera (una <meta> no admite `frame-ancestors`, que se queda fuera).

   Uso: node scripts/versionar-copia.mjs <carpeta de la copia>
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CSP = "object-src 'none'; base-uri 'self'; script-src 'self' blob: https://script.google.com https://script.googleusercontent.com";

/* «25-nov-2026 · 13:08» -> «25-nov-2026-13-08»: solo letras, cifras y guiones, valga en una dirección. */
export function marcaDeVersion(version) {
  return String(version).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function versionDeJs(textoJs) {
  const m = /^App\.VERSION = '([^']*)';$/m.exec(textoJs);
  return m ? m[1] : null;
}

function esLocal(ruta) {
  return !!ruta && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ruta) && ruta.indexOf('?') === -1;
}

export function versionarIndex(html, marca) {
  const conMarca = html.replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=")([^"]*)(")/g, (todo, antes, ruta, cierre) =>
    esLocal(ruta) ? antes + ruta + '?v=' + marca + cierre : todo);
  const meta = '<meta http-equiv="Content-Security-Policy" content="' + CSP + '">';
  if (conMarca.indexOf('Content-Security-Policy') !== -1) return conMarca;
  return conMarca.replace(/(<meta charset="utf-8">\s*\n?)/i, '$1' + meta + '\n');
}

export function versionarPiezas(textoJs, marca) {
  const viejo = `'<script src="' + f + '">`;
  return textoJs.split(viejo).join(`'<script src="' + f + '?v=${marca}">`);
}

function principal(carpeta) {
  const version = versionDeJs(readFileSync(join(carpeta, 'js/version.js'), 'utf8'));
  if (!version) throw new Error('no encuentro App.VERSION en js/version.js');
  const marca = marcaDeVersion(version);
  const ruta = join(carpeta, 'index.html');
  writeFileSync(ruta, versionarIndex(readFileSync(ruta, 'utf8'), marca));
  const piezas = readdirSync(join(carpeta, 'js')).filter((f) => /^cargar-piezas-\d+\.js$/.test(f));
  for (const f of piezas) {
    const p = join(carpeta, 'js', f);
    const antes = readFileSync(p, 'utf8');
    const despues = versionarPiezas(antes, marca);
    if (despues === antes) throw new Error(f + ': no encuentro dónde escribe sus <script>');
    writeFileSync(p, despues);
  }
  console.log('versionar-copia: ' + version + ' -> ?v=' + marca + ' (' + piezas.length + ' ficheros de piezas)');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) principal(process.argv[2] || '_sitio');
