/* Prueba en navegador de verdad de los «Documentos de la carpeta» en la columna derecha de «Trabajo»
   (24-sep-2026, fila 114 de docs/COLA.md, docs/DOCUMENTOS-EN-LA-TARJETA.md; adaptada el 22-oct-2026 a la
   fila 425, docs/FICHA-VISTA-DE-TRABAJO.md: ya no hay tarjeta cerrada con «y N más»). Nombres inventados.

   Con 8 documentos, a 1905×1000 y a 1280×800:
     1. Sin la línea «8 documentos» (el número va en el círculo del título).
     2. Salen los 8, con el nombre entero de cada uno.
     3. Ningún renglón se solapa con el siguiente.
     4. La columna se desplaza por su cuenta si no caben, y la página no baja. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [] },
    { id: 'm2', titulo: 'Comprobar el expediente', cuerpo: '', opciones: [] },
    { id: 'm3', titulo: 'Grabar en Séneca', cuerpo: '', opciones: [] }
  ]
};
const DOCS = ['260901 SOLICITUD.pdf', '260902 JUSTIFICANTE.pdf', '260903 DNI.pdf', '260904 FOTO.pdf',
  '260905 LIBRO DE FAMILIA.pdf', '260906 EMPADRONAMIENTO.pdf', '260907 CERTIFICADO DE NOTAS DEL CURSO ANTERIOR CON UN NOMBRE MUY LARGO.pdf', '260908 RECIBI.pdf'];

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function preparar(ancho, alto) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async ([guias, docs, asunto]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const h = await g.getFileHandle('guias.json', { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    docs.forEach((d) => c._hijos.set(d, window.__disco.fich(d, '%PDF-1.4 de mentira')));
  }, [GUIAS, DOCS, ASUNTO]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, docs]) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
      tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {},
      notas: [{ texto: 'Llamó la madre para preguntar por el plazo', quien: 'Francisco', cuando: new Date().toISOString() }] });
    await Hitos.anadirDocumento(asunto, 'm1', docs[0]);
    await App.verAbiertos();
  }, [ASUNTO, DOCS]);
  await pagina.waitForTimeout(300);
  return { pagina, errores };
}

async function abrirFicha(pagina) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ASUNTO + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForTimeout(500);
}


for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  await abrirFicha(pagina);
  await pagina.waitForTimeout(300);
  const r = await pagina.evaluate(() => {
    const col = document.getElementById('trabajo-der');
    const filas = Array.from(col.querySelectorAll('#ficha-documentos .ficha-documento-fila'));
    return {
      nombres: filas.map((f) => f.dataset.doc),
      solapadas: filas.filter((f, i) => i && f.getBoundingClientRect().top < filas[i - 1].getBoundingClientRect().bottom - 1).length,
      cuenta: (document.getElementById('ficha-cuenta-docs') || {}).textContent,
      lineaN: Array.from(col.querySelectorAll('#ficha-documentos > *')).some((e) => /^8 documentos$/.test(e.textContent.trim())),
      paginaBaja: document.documentElement.scrollHeight > window.innerHeight + 2
    };
  });
  await comprobar('1. sin la línea «8 documentos»; el número, en el círculo', Promise.resolve([r.lineaN, r.cuenta]), [false, '8']);
  await comprobar('2. salen los 8, con el nombre entero', Promise.resolve(r.nombres.slice().sort()), DOCS.slice().sort());
  await comprobar('3. ningún renglón solapa al siguiente', Promise.resolve(r.solapadas), 0);
  await comprobar('4. la página no baja (la columna se desplaza sola)', Promise.resolve(r.paginaBaja), false);
  await comprobar('sin errores en la consola', Promise.resolve(errores), []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
