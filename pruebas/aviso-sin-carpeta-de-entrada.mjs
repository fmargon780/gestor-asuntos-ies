/* Prueba en navegador de verdad del aviso «falta señalar la carpeta de entrada».

   Fila 687 de docs/COLA.md (docs/687-AVISO-SIN-CARPETA-DE-ENTRADA.md).

   Cuatro escenarios con el disco de mentira de pruebas/navegador.mjs:
     A. Drive y sin carpeta de entrada: aviso ámbar en Inicio y en «Por clasificar», con «Señalar la
        carpeta»; la comprobación al entrar dice «Falta»; al señalarla, el aviso desaparece y salen los documentos;
     B. Drive, solo consultar: sale el texto y no el botón;
     C. Drive con la carpeta de entrada ya señalada: ningún aviso, y la comprobación dice «Bien»;
     D. carpetas fuera de Drive y sin señalar: ningún aviso, y la comprobación dice «Bien». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const FRASE = 'En este ordenador falta señalar la carpeta de entrada: los documentos sueltos no se ven.';
const DRIVE = `const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    g._hijos.set('rutas.json', window.__disco.fich('rutas.json', JSON.stringify({ nube: 'drive' })));`;

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
const errores = [];

async function comprobar(titulo, real, esperado) {
  const r = await real;
  if (JSON.stringify(r) !== JSON.stringify(esperado)) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(r) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function entrar(antes) {
  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async (antesTexto) => {
    window.__disco.abiertos._hijos.set('Solo en abiertos.pdf', window.__disco.fich('Solo en abiertos.pdf', 'raíz'));
    const entrada = await window.__disco.archivo.getDirectoryHandle('ENTRADA DEL CENTRO', { create: true });
    entrada._hijos.set('Oficio de la entrada.pdf', window.__disco.fich('Oficio de la entrada.pdf', 'oficio'));
    window.__entrada = entrada;
    window.showDirectoryPicker = async () => entrada;
    // eslint-disable-next-line no-new-func
    await (new Function('window', 'return (async () => {' + antesTexto + '})()'))(window);
  }, antes);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.waitForTimeout(800);
  return pagina;
}

const visible = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && e.getClientRects().length > 0; }, sel);
const filaEntrada = (p) => p.evaluate(async () => (await ComprobacionEntrada.revisar()).filter(f => f.id === 'entrada').map(f => f.estado + ' | ' + f.frase));

/* ---------- A. Drive y sin carpeta de entrada ---------- */
{
  const p = await entrar(DRIVE);
  await comprobar('A. en Inicio sale el aviso, con su frase', p.locator('#aviso-sin-entrada-inicio .aviso-sin-entrada-texto').textContent(), FRASE);
  await comprobar('con el botón «Señalar la carpeta»', p.locator('#aviso-sin-entrada-inicio button').textContent(), 'Señalar la carpeta');
  await comprobar('y está a la vista', visible(p, '#aviso-sin-entrada-inicio'), true);
  await comprobar('la comprobación al entrar dice «Falta» con esa frase', filaEntrada(p), ['falta | ' + FRASE]);
  await p.evaluate(() => App.irVista('clasificar'));
  await p.waitForTimeout(500);
  await comprobar('arriba de «Por clasificar» sale el mismo aviso', p.locator('#aviso-sin-entrada-clasificar .aviso-sin-entrada-texto').textContent(), FRASE);
  await comprobar('y está a la vista', visible(p, '#aviso-sin-entrada-clasificar'), true);
  await p.locator('#aviso-sin-entrada-clasificar button').click();
  await p.waitForTimeout(1000);
  await comprobar('al señalar la carpeta desaparece el aviso de Inicio', visible(p, '#aviso-sin-entrada-inicio'), false);
  await comprobar('y el de «Por clasificar»', visible(p, '#aviso-sin-entrada-clasificar'), false);
  await comprobar('y salen los documentos',
    p.locator('#lista-sueltos .tarjeta-suelto .tarjeta-nombre').allTextContents().then(l => l.map(t => t.replace(/^(NUEVO)?(PDF)?/, ''))), ['Oficio de la entrada.pdf']);
  await comprobar('la comprobación ya dice «Bien»', filaEntrada(p).then(l => l[0].split(' | ')[0]), 'bien');
  await p.close();
}

/* ---------- B. solo consultar: el texto sí, el botón no ---------- */
{
  const p = await entrar(DRIVE);
  await p.evaluate(() => { window.SoloConsulta.activo = () => true; Entrada.cargar().then(() => App.verAbiertos()); });
  await p.waitForTimeout(800);
  await comprobar('B. en solo consultar sale el texto', visible(p, '#aviso-sin-entrada-inicio .aviso-sin-entrada-texto'), true);
  await comprobar('y no el botón', visible(p, '#aviso-sin-entrada-inicio button'), false);
  await p.close();
}

/* ---------- C. Drive con la carpeta ya señalada ---------- */
{
  const p = await entrar(DRIVE + "\n    await window.Almacen.guardar('entrada', window.__entrada);");
  await comprobar('C. con la carpeta señalada no sale aviso en Inicio', visible(p, '#aviso-sin-entrada-inicio'), false);
  await comprobar('ni en «Por clasificar»', visible(p, '#aviso-sin-entrada-clasificar'), false);
  await comprobar('y la comprobación dice «Bien»', filaEntrada(p).then(l => l[0].split(' | ')[0]), 'bien');
  await p.close();
}

/* ---------- D. carpetas fuera de Drive y sin señalar ---------- */
{
  const p = await entrar('');
  await comprobar('D. fuera de Drive no sale aviso en Inicio', visible(p, '#aviso-sin-entrada-inicio'), false);
  await comprobar('ni en «Por clasificar»', visible(p, '#aviso-sin-entrada-clasificar'), false);
  await comprobar('y la comprobación dice «Bien»', filaEntrada(p), ['bien | Sin señalar: se usa la de asuntos vivos.']);
  await p.close();
}

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
