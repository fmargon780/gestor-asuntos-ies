/* Fila 677 (docs/677-DOCUMENTO-GUARDADO-TARDA-EN-SALIR.md): con la ficha abierta, un documento guardado
   desde fuera en la carpeta del asunto sale solo en «Documentos». Disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const UNO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const DOS = '260906 CERTIFICADO Otro Alumno 5678';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([uno, dos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({ asuntos: {
    [uno]: { tercero: 'Pérez Ruiz, Ana 1234', categoria: 'ALUMNADO', situacion: 'PENDIENTE', curso: '26-27' },
    [dos]: { tercero: 'Otro Alumno 5678', categoria: 'ALUMNADO', situacion: 'PENDIENTE' } } })));
  for (const n of [uno, dos]) {
    const c = await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
    c._hijos.set('Primero.pdf', window.__disco.fich('Primero.pdf', 'x'));
  }
}, [UNO, DOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombre + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(400);
}
/* Deja un fichero en la carpeta del asunto, como si lo guardara Word desde fuera. */
const dejar = (asunto, fichero) => pagina.evaluate(async ([a, f]) => {
  const c = await window.__disco.abiertos.getDirectoryHandle(a);
  c._hijos.set(f, window.__disco.fich(f, 'x'));
}, [asunto, fichero]);
const documentos = () => pagina.evaluate(() => document.getElementById('ficha-documentos').textContent);
/* Cuenta las veces que se repinta «Documentos». */
await pagina.evaluate(() => {
  window.__pintadas = 0;
  const o = FichaDocumentos.pintar;
  FichaDocumentos.pintar = function () { window.__pintadas++; return o.apply(this, arguments); };
});
const pintadas = () => pagina.evaluate(() => window.__pintadas);
const mirar = async () => { await pagina.evaluate(() => FichaCarpetaVigilar.mirar()); await pagina.waitForTimeout(300); };

await abrirFicha(UNO);
await mirar();   /* la primera mirada solo apunta */
const base = await pintadas();

console.log('--- (a) aparece un fichero y sale solo ---');
await dejar(UNO, 'Nuevo desde Word.docx');
await mirar();
await comprobar('(a) sale en Documentos', (await documentos()).indexOf('Nuevo desde Word') !== -1, true);

console.log('--- (d) sin cambios no repinta ---');
const antesD = await pintadas();
await mirar(); await mirar();
await comprobar('(d) no repinta', (await pintadas()) - antesD, 0);

console.log('--- (f) un temporal de Word no repinta ---');
await dejar(UNO, '~$Nuevo desde Word.docx');
await mirar();
await comprobar('(f) no repinta', (await pintadas()) - antesD, 0);

console.log('--- (b) lo escrito, el foco y el cursor siguen ---');
await pagina.evaluate(() => {
  const t = document.createElement('textarea');
  t.id = 'prueba-escribir'; t.value = 'borrador a medias';
  document.getElementById('ficha-asunto-cuerpo').appendChild(t);
  t.focus(); t.setSelectionRange(3, 7);
});
await dejar(UNO, 'Otro más.pdf');
await mirar();
await comprobar('(b) sale el nuevo', (await documentos()).indexOf('Otro más') !== -1, true);
await comprobar('(b) lo escrito y el cursor',
  pagina.evaluate(() => { const t = document.getElementById('prueba-escribir'); return t ? [t.value, document.activeElement === t, t.selectionStart, t.selectionEnd] : null; }),
  ['borrador a medias', true, 3, 7]);
await pagina.evaluate(() => document.getElementById('prueba-escribir').remove());

console.log('--- (c) con un cuadro abierto no repinta; al cerrarlo, sí ---');
await pagina.evaluate(() => { window.__c = U.preguntar('Prueba', '<p>x</p>', 'Aceptar'); });
await dejar(UNO, 'Con cuadro.pdf');
const antesC = await pintadas();
await mirar();
await comprobar('(c) con el cuadro, no repinta', (await pintadas()) - antesC, 0);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(200);
await mirar();
await comprobar('(c) cerrado, sale', (await documentos()).indexOf('Con cuadro') !== -1, true);

console.log('--- (e) al cambiar de asunto no repinta el anterior ---');
await dejar(UNO, 'Para el anterior.pdf');
await abrirFicha(DOS);
const antesE = await pintadas();
await mirar();   /* primera mirada del otro asunto: solo apunta */
await comprobar('(e) no sale el del anterior', (await documentos()).indexOf('Para el anterior') === -1, true);
await comprobar('(e) la primera mirada del nuevo asunto no repinta', (await pintadas()) - antesE, 0);

await comprobar('sin errores en consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien');
