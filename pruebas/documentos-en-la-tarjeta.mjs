/* Prueba en navegador de verdad de la tarjeta cerrada «Documentos de la
   carpeta» (24-sep-2026, fila 114 de docs/COLA.md,
   docs/DOCUMENTOS-EN-LA-TARJETA.md). Nombres inventados.

   Con 8 documentos, a 1905×1000 y a 1280×800:
     1. Sin la línea «8 documentos».
     2. Como mucho 5 nombres, más «y N más», y los nombres + N = 8.
     3. Ningún renglón más bajo que su alto de línea, y ninguno cortado
        por abajo (todos dentro de la caja del resumen).
     4. Cada renglón lleva `title` con su texto entero.
     5. «y N más» abre la tarjeta en grande. */
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
  await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
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
    const caja = document.querySelector('.ficha-tarjeta[data-tarjeta="documentos"] > .ficha-tarjeta-resumen');
    const lineas = Array.from(caja.querySelectorAll('.ficha-resumen-linea'));
    const cb = caja.getBoundingClientRect();
    return {
      textos: lineas.map((l) => l.textContent),
      nombres: lineas.filter((l) => !l.classList.contains('ficha-resumen-mas')).length,
      mas: (caja.querySelector('.ficha-resumen-mas') || {}).textContent || '',
      aplastadas: lineas.filter((l) => l.getBoundingClientRect().height + 0.5 < parseFloat(getComputedStyle(l).lineHeight)).length,
      cortadas: lineas.filter((l) => l.getBoundingClientRect().bottom > cb.bottom + 0.5).length,
      sinTitle: lineas.filter((l) => l.title !== l.textContent).length
    };
  });
  console.log('   (' + r.nombres + ' nombres y «' + r.mas + '»)');
  await comprobar('1. sin la línea «8 documentos»', Promise.resolve(r.textos.some((t) => /documentos$/.test(t))), false);
  await comprobar('2. como mucho 5 nombres', Promise.resolve(r.nombres >= 1 && r.nombres <= 5), true);
  await comprobar('2. «y N más» cuenta el resto', Promise.resolve(r.mas), 'y ' + (8 - r.nombres) + ' más');
  await comprobar('3. ningún renglón aplastado', Promise.resolve(r.aplastadas), 0);
  await comprobar('3. ninguno cortado por abajo', Promise.resolve(r.cortadas), 0);
  await comprobar('4. cada renglón, con su texto entero en el title', Promise.resolve(r.sinTitle), 0);
  await pagina.click('.ficha-resumen-mas');
  await pagina.waitForTimeout(300);
  await comprobar('5. «y N más» abre Documentos en grande',
    pagina.evaluate(() => document.getElementById('ficha-tarjetas').dataset.abierta), 'documentos');
  await comprobar('sin errores en la consola', Promise.resolve(errores), []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
