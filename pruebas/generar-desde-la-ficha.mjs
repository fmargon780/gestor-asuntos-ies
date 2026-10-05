/* Prueba de la fila 267 (docs/GENERAR-DOCUMENTO-DESDE-LA-FICHA.md): en la
   tarjeta «Documentos de la carpeta» de la ficha, un botón «Generar
   documento» junto a «+ Añadir documento» que abre el hito actual con el
   desplegable «Generar documento ▾» ya abierto. Solo con hitos y asunto
   abierto; se calcula el hito al pulsar; no se duplica al repintar.
   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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


const GUIA = {
  MATRICULA: [
    { id: 'p1', titulo: 'Tramitar', plantillasDocumento: ['pd-a'] },
    { id: 'p2', titulo: 'Firmar' },
    { id: 'p3', titulo: 'Entregar' }
  ]
};
const PLANTILLAS = {
  documentos: [
    { id: 'pd-a', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Acuse de recibo', fichero: 'acuse.docx', tipoDocumento: 'ACUSE', texto: '' }
  ]
};
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([GUIA, PLANTILLAS]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, d] of [['guias.json', GUIA], ['plantillas.json', PLANTILLAS]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
  }
  const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
  pl._hijos.set('acuse.docx', window.__disco.fich('acuse.docx', 'PK'));
}, [GUIA, PLANTILLAS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const A = '260920 MATRICULA Inventada, Persona 1150001';
const B = '260921 SINGUIA Inventada, Otra 1150002';
await pagina.evaluate(async ([A, B]) => {
  await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  await App.anotar(A, { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Inventada, Persona 1150001', abiertoEl: U.ahora() });
  await window.__disco.abiertos.getDirectoryHandle(B, { create: true });
  await App.anotar(B, { tipo: 'SINGUIA', categoria: 'ALUMNADO', tercero: 'Inventada, Otra 1150002', abiertoEl: U.ahora() });
  await App.verAbiertos();
}, [A, B]);

async function abrir(nombre, modo) {
  await pagina.evaluate(([n, m]) => { App.volverALaLista && App.volverALaLista(); }, [nombre, modo]);
  await pagina.evaluate(([n, m]) => App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === n)[0], m), [nombre, modo]);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(600);
}
const botones = () => pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-documentos-anadir, .ficha-documentos-generar'))
  .filter(b => b.offsetParent !== null).map(b => b.textContent));
const mesa = () => pagina.evaluate(() => {
  const m = document.querySelector('.hito.hito-en-mesa');
  const panel = m && m.querySelector('.mesa-panel-generar');
  return m ? { hito: m.dataset.id, abierto: !!panel && !panel.classList.contains('oculto') } : null;
});

console.log('--- 1. con hitos: dos botones, también con la carpeta vacía ---');
await abrir(A, 'abierto');
await comprobar('«+ Añadir documento» y «Generar documento», en ese orden', botones(), ['+ Añadir documento', 'Generar documento']);
await comprobar('no es el botón principal', pagina.evaluate(() => document.querySelector('.ficha-documentos-generar').classList.contains('boton-principal')), false);

console.log('--- 2. al pulsarlo, la mesa del hito actual con el desplegable abierto ---');
await pagina.click('.ficha-documentos-generar');
await pagina.waitForTimeout(500);
await comprobar('mesa de Tramitar (p1) con «Generar documento ▾» abierto', mesa(), { hito: 'p1', abierto: true });

console.log('--- 6. Escape cierra; entrar por el título no lo abre ---');
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);
await comprobar('Escape cierra el desplegable', mesa(), { hito: 'p1', abierto: false });
await pagina.evaluate(() => HitoMesa.cerrar());
await pagina.evaluate((A) => HitoMesa.abrir(App.E.listaAbiertos.filter(x => x.nombre === A)[0], 'p1'), A);
await pagina.waitForTimeout(300);
await comprobar('abrir por el título: sin desplegable', mesa(), { hito: 'p1', abierto: false });

console.log('--- 4. el hito se calcula al pulsar ---');
await pagina.evaluate(() => HitoMesa.cerrar());
await pagina.evaluate((A) => Hitos.marcar(A, 'p1', 'hecho'), A);
await abrir(A, 'abierto');
await pagina.click('.ficha-documentos-generar');
await pagina.waitForTimeout(500);
await comprobar('con Tramitar hecho, abre Firmar (p2) con el desplegable abierto', mesa(), { hito: 'p2', abierto: true });

console.log('--- 5. todos hechos: el último ---');
await pagina.evaluate(() => HitoMesa.cerrar());
await pagina.evaluate(async (A) => { await Hitos.marcar(A, 'p2', 'hecho'); await Hitos.marcar(A, 'p3', 'hecho'); }, A);
await abrir(A, 'abierto');
await pagina.click('.ficha-documentos-generar');
await pagina.waitForTimeout(500);
await comprobar('abre Entregar (p3)', mesa().then(m => m && m.hito), 'p3');

console.log('--- 8, 9, 11. barra de arriba, mesa y repintado ---');
await comprobar('la barra de arriba sigue sin «Generar documento» (fila 154)',
  pagina.evaluate(() => { const b = document.querySelector('#ficha-acciones .boton-generar-documento'); return !b || b.offsetParent === null; }), true);
await comprobar('dentro de la mesa no hay botón nuevo en su tarjeta de documentos',
  pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .ficha-documentos-generar').length), 0);
await pagina.evaluate(async () => { const a = App.E.listaAbiertos[0]; await FichaDocumentos.pintar(a); await FichaDocumentos.pintar(a); });
await comprobar('repintar no duplica el botón', pagina.evaluate(() => document.querySelectorAll('.ficha-documentos-generar').length), 1);

console.log('--- 7. sin hitos: solo «+ Añadir documento» ---');
await pagina.evaluate(() => HitoMesa.cerrar());
await abrir(B, 'abierto');
/* Desde la fila 129 un tipo sin guía recibe la guía mínima («Tramitar»…), así
   que un asunto abierto sin hitos se simula quitando la marca que pone el panel. */
await pagina.evaluate(() => document.getElementById('pantalla-asunto').classList.remove('asunto-con-hitos'));
await comprobar('sin hitos, un solo botón', botones(), ['+ Añadir documento']);

console.log('--- 10. archivo y consulta ---');
await abrir(A, 'archivado');
await comprobar('en un asunto del ARCHIVO no sale', botones().then(b => b.indexOf('Generar documento')), -1);
await abrir(A, 'consulta');
await comprobar('en modo consulta no sale o está apagado',
  pagina.evaluate(() => { const b = document.querySelector('.ficha-documentos-generar'); return !b || b.offsetParent === null || b.disabled; }), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
