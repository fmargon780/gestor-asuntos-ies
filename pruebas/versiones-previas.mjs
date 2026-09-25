/* Prueba en navegador de verdad de la fila 160 de docs/COLA.md
   (docs/VERSIONES-PREVIAS.md):

   1. Registrar un documento sellado deja el «SIN SELLAR» en la
      subcarpeta «Versiones previas», no en la carpeta del asunto.
   2. Un Word con su PDF pasa a «Versiones previas»; sin PDF, no.
   3. La ficha enseña «N versiones previas · ver» (plegado) y no las
      cuenta; «Sacar de versiones previas» las devuelve.
   4. El índice del expediente no las cuenta.
   5. «Ordenar versiones previas» dos veces: la segunda no hace nada. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const ASUNTO = '260910 CERTIFICADO 26-27 Inventada Uno, Eva 9990001';
const OTRO = '260911 CERTIFICADO 26-27 Inventada Dos, Ana 9990002';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([a1, a2]) => {
  async function poner(d, n) { const f = await d.getFileHandle(n, { create: true }); const w = await f.createWritable(); await w.write('contenido ' + n); await w.close(); }
  const d = await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  for (const n of ['260905 SOLICITUD.pdf', '260905 SELLADO.pdf', '260906 CERTIFICADO.docx', '260906 CERTIFICADO.pdf', '260907 OFICIO.docx']) await poner(d, n);
  const d2 = await window.__disco.abiertos.getDirectoryHandle(a2, { create: true });
  for (const n of ['260901 INFORME SIN SELLAR.pdf', '260901 26EM0001 INFORME.pdf']) await poner(d2, n);
}, [ASUNTO, OTRO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2]) => {
  for (const [n, t] of [[a1, 'Inventada Uno, Eva 9990001'], [a2, 'Inventada Dos, Ana 9990002']]) {
    await App.anotar(n, { abiertoEl: U.ahora(), tipo: 'CERTIFICADO', categoria: 'PERSONAL', tercero: t, curso: '26-27', grupo: '', descripcion: '', campos: {} });
  }
  await App.verAbiertos();
}, [ASUNTO, OTRO]);
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Uno' }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);

const contenido = (a1) => pagina.evaluate(async (a1) => {
  const d = await window.__disco.abiertos.getDirectoryHandle(a1);
  const arriba = [], previas = [];
  for await (const [k, v] of d.entries()) if (v.kind === 'file') arriba.push(k);
  try { const p = await d.getDirectoryHandle('Versiones previas'); for await (const [k] of p.entries()) previas.push(k); } catch (e) { /* no está */ }
  return { arriba: arriba.sort(), previas: previas.sort() };
}, a1);

console.log('--- 1 y 2. registrar ---');
await pagina.evaluate(async () => {
  const a = App.asuntoDeLaFicha();
  await RegistroSellado.asociar(a, '260905 SELLADO.pdf', '260905 SOLICITUD.pdf',
    { anio: '26', serie: 'M', tipo: 'E', numero: '0368', numeroLargo: false, fecha: '10/09/2026' });
});
await comprobar('el registrado, arriba; el «SIN SELLAR» y el Word con su PDF, en «Versiones previas»; el Word sin PDF, arriba',
  contenido(ASUNTO), {
    arriba: ['260905 26EM0368 SOLICITUD.pdf', '260906 CERTIFICADO.pdf', '260907 OFICIO.docx'],
    previas: ['260905 SOLICITUD SIN SELLAR.pdf', '260906 CERTIFICADO.docx']
  });

console.log('--- 3. la ficha ---');
await pagina.evaluate(() => FichaDocumentos.pintar(App.asuntoDeLaFicha()));
await pagina.waitForSelector('.ficha-previas', { state: 'attached' });
await comprobar('«2 versiones previas · ver», plegado',
  pagina.evaluate(() => { const d = document.querySelector('.ficha-previas'); return [d.querySelector('summary').textContent, d.open]; }),
  ['2 versiones previas · ver', false]);
await comprobar('no cuentan entre los documentos',
  pagina.evaluate(() => [document.getElementById('ficha-cuenta-docs').textContent,
    Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento')).map((b) => b.textContent).some((t) => /SIN SELLAR/.test(t))]), ['3', false]);
await pagina.evaluate(async () => {
  await VersionesPrevias.sacar(App.asuntoDeLaFicha().handle, '260906 CERTIFICADO.docx');
  await FichaDocumentos.pintar(App.asuntoDeLaFicha());
});
await comprobar('«Sacar de versiones previas» lo devuelve',
  contenido(ASUNTO).then((c) => [c.arriba.indexOf('260906 CERTIFICADO.docx') > -1, c.previas]), [true, ['260905 SOLICITUD SIN SELLAR.pdf']]);

console.log('--- 4. el índice del expediente ---');
await comprobar('no las cuenta',
  pagina.evaluate(async () => {
    const d = await IndiceExpediente.datosDe(App.asuntoDeLaFicha());
    return d.filas.some((f) => /SIN SELLAR/.test(f.nombre));
  }), false);

console.log('--- 5. «Ordenar versiones previas» ---');
await pagina.evaluate(() => { window.__preguntas = 0; const p = U.preguntar; U.preguntar = function () { window.__preguntas++; const r = p.apply(this, arguments); setTimeout(() => document.getElementById('cuadro-aceptar').click(), 50); return r; }; });
await pagina.evaluate(() => VersionesPrevias.ordenarTodo(null));
await pagina.waitForTimeout(500);
await comprobar('la primera: pregunta y mueve el Word con PDF y el «SIN SELLAR» del otro asunto',
  Promise.all([contenido(ASUNTO), contenido(OTRO), pagina.evaluate(() => window.__preguntas)]).then(([a, b, n]) => [a.previas, b.previas, n]),
  [['260905 SOLICITUD SIN SELLAR.pdf', '260906 CERTIFICADO.docx'], ['260901 INFORME SIN SELLAR.pdf'], 1]);
await pagina.evaluate(() => VersionesPrevias.ordenarTodo(null));
await pagina.waitForTimeout(500);
await comprobar('la segunda: ni pregunta ni cambia nada',
  Promise.all([contenido(ASUNTO), pagina.evaluate(() => window.__preguntas)]).then(([a, n]) => [a.previas.length, a.arriba, n]),
  [2, ['260905 26EM0368 SOLICITUD.pdf', '260906 CERTIFICADO.pdf', '260907 OFICIO.docx'], 1]);

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
