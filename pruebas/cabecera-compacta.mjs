/* Prueba en navegador de verdad de la cabecera compacta (24-sep-2026,
   fila 112 de docs/COLA.md, docs/CABECERA-COMPACTA.md). Nombres
   inventados.

   A 1600×920, con un hito abierto:
     1. La cabecera del asunto en dos líneas: «← Volver», tipo, nombre y
        «Archivar» en la primera; estado, plazo, encargo, «Comunicar» y la
        línea gris en la segunda.
     2. Sin «Volver a las tarjetas», «Volver a la lista de hitos» ni la
        línea de ruta; sin el título «Hitos» del recuadro.
     3. El título «GUION DEL HITO», a 250 px o menos del borde de arriba.
     4. El nombre del hito, sus etiquetas y «Marcar hito como hecho», en
        una sola línea.
     5. Pulsar otra vez la pestaña «Hitos»: primero a la lista de hitos;
        otra vez, a las tarjetas. Sin salir nunca de la ficha.
   A 800×900: nada se sale por la derecha (sin desplazamiento lateral). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [], plantillasDocumento: ['pd-b'],
      guion: [
        { id: 'g1', texto: 'Comprobar que la solicitud está firmada', explicacion: '', accion: '' },
        { id: 'g2', texto: 'Generar el recibí', explicacion: '', accion: 'generar', normativa: { cita: 'Decreto 21/2020, art. 5' } },
        { id: 'g3', texto: 'Comunicar a la familia', explicacion: '', accion: 'comunicar' }
      ] },
    { id: 'm2', titulo: '¿Qué supuesto es?', opciones: [
      { id: 'o1', titulo: 'Ordinario', pasos: [{ id: 'm2a', titulo: 'Grabar en Séneca', cuerpo: '' }] },
      { id: 'o2', titulo: 'Extraordinario', pasos: [{ id: 'm2b', titulo: 'Pedir informe a la Delegación', cuerpo: '' }] }
    ] },
    { id: 'm3', titulo: 'Archivar el expediente', cuerpo: '', opciones: [] }
  ]
};
const PLANTILLAS = { documentos: [
  { id: 'pd-b', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Recibí', fichero: 'recibi.docx', tipoDocumento: 'RECIBI', texto: '' }
] };
const DOCS = ['260901 SOLICITUD.pdf', '260901 SOLICITUD.docx', '260902 26EM0617 JUSTIFICANTE.pdf'];

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
  await pagina.evaluate(async ([guias, plantillas, docs, asunto]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    for (const [n, d] of [['guias.json', guias], ['plantillas.json', plantillas]]) {
      const h = await g.getFileHandle(n, { create: true });
      const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
    }
    const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
    pl._hijos.set('recibi.docx', window.__disco.fich('recibi.docx', 'PK'));
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    docs.forEach((d) => c._hijos.set(d, window.__disco.fich(d, '%PDF-1.4')));
  }, [GUIAS, PLANTILLAS, DOCS, ASUNTO]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, docs]) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
      tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {} });
    await Hitos.anadirDocumento(asunto, 'm1', docs[0]);
    await Hitos.anadirDocumento(asunto, 'm1', docs[2]);
    await Plantillas.cargar(App.E.gestor);
    /* Sin Word de verdad: el rellenado se sustituye (como en pruebas/documentos-desde-el-hito.mjs). */
    window.Docx.rellenar = async () => ({ blob: new Blob(['doc']), faltan: [] });
    await App.verAbiertos();
  }, [ASUNTO, DOCS]);
  await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  return { pagina, errores };
}


function alto(pagina, selector) {
  return pagina.evaluate((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }, selector);
}

async function abrirMesa(pagina) {
  await pagina.locator('#ficha-guia .hito[data-id="m1"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="m1"]');
  await pagina.waitForTimeout(300);
}

{
  const { pagina, errores } = await preparar(1600, 920);
  await abrirMesa(pagina);

  /* 1. */
  const v = await alto(pagina, '#ficha-volver');
  const a = await alto(pagina, '#ficha-archivar .boton-principal');
  const n = await alto(pagina, '.ficha-nombre');
  const e = await alto(pagina, '#ficha-acciones select.campo-estado');
  const s = await alto(pagina, '.ficha-subtitulo');
  await comprobar('1. «← Volver», nombre y «Archivar», en la misma línea',
    Promise.resolve([Math.abs(v.top - a.top) < 12, Math.abs(v.top - n.top) < 12]), [true, true]);
  await comprobar('1. «Archivar» a la derecha', Promise.resolve(a.left > n.left), true);
  await comprobar('1. el estado y la línea gris, en la segunda línea',
    Promise.resolve([e.top > v.bottom - 2, Math.abs((s.top + s.bottom) / 2 - (e.top + e.bottom) / 2) < 16]), [true, true]);
  await comprobar('1. el texto del botón de volver', pagina.locator('#ficha-volver').textContent(), '← Volver');

  /* 2. */
  await comprobar('2. ya no hay botones de volver repetidos ni línea de ruta',
    pagina.evaluate(() => [...document.querySelectorAll('#pantalla-asunto button, #pantalla-asunto span')]
      .filter((b) => /Volver a las tarjetas|Volver a la lista de hitos|Asuntos abiertos ›/.test(b.textContent) && b.offsetParent).length), 0);
  await comprobar('2. sin el título «Hitos» del recuadro',
    pagina.evaluate(() => { const t = document.querySelector('.ficha-tarjeta.abierta > .ficha-titulo'); return !!(t && t.offsetParent); }), false);
  await comprobar('2. la pestaña abierta dice cómo volver',
    pagina.locator('.ficha-pestana.activa').getAttribute('title'), 'Volver a las tarjetas');

  /* 3. */
  const guion = await alto(pagina, '.mesa-guion .mesa-bloque-titulo');
  console.log('   (GUION DEL HITO a ' + Math.round(guion.top) + ' px)');
  await comprobar('3. «GUION DEL HITO» a 250 px o menos del borde', Promise.resolve(guion.top <= 250), true);

  /* 4. */
  const t = await alto(pagina, '.mesa-titulo');
  const et = await alto(pagina, '.mesa-etiquetas');
  const h = await alto(pagina, '.mesa-marcar-hecho');
  await comprobar('4. nombre, etiquetas y «Hecho» en una sola línea',
    Promise.resolve([Math.abs(t.top - et.top) < 14, Math.abs(t.top - h.top) < 14]), [true, true]);

  /* 5. */
  await pagina.click('.ficha-pestana.activa');
  await pagina.waitForTimeout(300);
  await comprobar('5. pestaña «Hitos» otra vez: a la lista de hitos',
    pagina.evaluate(() => [!!document.querySelector('#ficha-guia.con-mesa'), document.getElementById('ficha-tarjetas').dataset.abierta || '']),
    [false, 'hitos']);
  await pagina.click('.ficha-pestana.activa');
  await pagina.waitForTimeout(300);
  await comprobar('5. y otra vez: a las tarjetas, sin salir de la ficha',
    pagina.evaluate(() => [document.getElementById('ficha-tarjetas').dataset.abierta || '',
      !document.getElementById('pantalla-asunto').classList.contains('oculto')]), ['', true]);

  await comprobar('sin errores en la página', Promise.resolve(errores), []);
  await pagina.close();
}

{
  const { pagina, errores } = await preparar(800, 900);
  await comprobar('estrecha: sin desplazamiento lateral en la ficha',
    pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await abrirMesa(pagina);
  await comprobar('estrecha: tampoco con el hito abierto',
    pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await comprobar('estrecha: sin errores', Promise.resolve(errores), []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
