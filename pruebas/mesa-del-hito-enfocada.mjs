/* Prueba en navegador de verdad de la mesa del hito enfocada (25-sep-2026,
   fila 145 de docs/COLA.md, docs/MESA-DEL-HITO-ENFOCADA.md).

   A 1905×1000 y a 1280×800, sobre un asunto inventado con un hito de
   cinco pasos de guion (dos hechos) y sin documentos:
     1. Dos zonas; la izquierda, más ancha; ninguna tercera columna.
     2. En la cabecera, exactamente «Generar documento ▾», «Comunicar ▾»,
        «Marcar como hecho» y «···».
     3. El tercer paso es el siguiente (resaltado) y su acción es el botón
        principal; los dos hechos no enseñan explicación ni botones.
     4. «No aplica» no se ve sin pasar el ratón, y sí al pasarlo.
     5. «Comunicar ▾» enseña los chips y «Preparar correo»; Escape lo
        cierra y la mesa sigue abierta.
     6. «Buscar otra plantilla…» está dentro de «Generar documento ▾».
     7. Sin documentos, la columna derecha dice «Ninguno todavía.».
   Con CAPTURAS=1, deja pruebas/capturas/mesa-del-hito-enfocada.png (1905×1000). */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Prueba, Eva 9990001';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [], plantillasDocumento: ['pd-c'],
      guion: [
        { id: 'g1', texto: 'Comprobar los datos del alumno', explicacion: 'Nombre, curso y Nº escolar.', accion: '' },
        { id: 'g2', texto: 'Comprobar la firma', explicacion: 'De la familia o del alumno mayor de edad.', accion: '' },
        { id: 'g3', texto: 'Generar el recibí', explicacion: 'Se entrega a la familia.', accion: 'generar' },
        { id: 'g4', texto: 'La solicitud firmada', explicacion: 'El PDF escaneado.', accion: '', reunir: 'documento', obligatorio: true },
        { id: 'g5', texto: 'Avisar a la familia', explicacion: '', accion: 'comunicar' }
      ] },
    { id: 'c2', titulo: 'Resolver', cuerpo: '', opciones: [] },
    { id: 'c3', titulo: 'Archivar el expediente', cuerpo: '', opciones: [] }
  ]
};
const PLANTILLAS = { documentos: [
  { id: 'pd-c', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', nombre: 'Recibí', fichero: 'recibi.docx', tipoDocumento: 'RECIBI', texto: '' }
] };

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
  await pagina.evaluate(async ([guias, plantillas, asunto]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    for (const [n, d] of [['guias.json', guias], ['plantillas.json', plantillas]]) {
      const h = await g.getFileHandle(n, { create: true });
      const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
    }
    const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
    pl._hijos.set('recibi.docx', window.__disco.fich('recibi.docx', 'PK'));
    await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
  }, [GUIAS, PLANTILLAS, ASUNTO]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async (asunto) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
      tercero: 'Inventada Prueba, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
    await Hitos.marcarGuion(asunto, 'c1', 'g1', { hecho: true });
    await Hitos.marcarGuion(asunto, 'c1', 'g2', { hecho: true });
    await Plantillas.cargar(App.E.gestor);
    await App.verAbiertos();
  }, ASUNTO);
  await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Prueba' }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForTimeout(400);
  await abrirHito(pagina, 'c1');
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(500);
  return { pagina, errores };
}

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);

  /* 1. */
  /* Fila 425: el hito entero en una sola columna, la izquierda de «Trabajo»; la carpeta, a la derecha. */
  await comprobar('1. el hito en una sola columna, sin tarjetas de resumen ni tercera zona',
    pagina.evaluate(() => {
      const c = Array.from(document.querySelectorAll('.hito-en-mesa .mesa-col')).filter((e) => e.offsetParent);
      return [c.length, !!(c[0].querySelector('.mesa-grande-guion') || {}).offsetParent, c[0].classList.contains('mesa-col-hito'),
        document.querySelectorAll('.hito-en-mesa .mesa-resumen').length, !!document.querySelector('.hito-en-mesa .mesa-col-consulta, .hito-en-mesa .mesa-col-docs')];
    }), [1, true, true, 0, false]);
  if (ancho === 1905) {
    await comprobar('1. a 1905 px, el hito a la izquierda y la carpeta a la derecha, una al lado de otra',
      pagina.evaluate(() => {
        const i = document.getElementById('trabajo-izq').getBoundingClientRect(), d = document.getElementById('trabajo-der').getBoundingClientRect();
        return i.right <= d.left && Math.abs(i.top - d.top) < 2;
      }), true);
  }

  /* 2. */
  /* Fila 154: más «Registrar», que antes vivía en un paso del guion. */
  await comprobar('2. en la cabecera, exactamente los botones (sin «Registrar», fila 434)',
    pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-acciones button'))
      .filter((b) => b.offsetParent && !b.closest('.mesa-panel') && !b.closest('.ficha-menu')).map((b) => b.textContent.trim())),
    ['Hacer este hito', 'Generar documento ▾', 'Comunicar ▾', 'Marcar como hecho', 'Hito ▾']);   /* fila 434: sin «Registrar»; fila 285: el hito de la prueba tiene tareas de generar */
  await comprobar('2. plazo y responsable, en texto pequeño y pulsable (no etiquetas de color)',
    pagina.evaluate(() => ['.mesa-etq-plazo', '.mesa-etq-resp'].map((s) => {
      const e = document.querySelector('.hito-en-mesa ' + s);
      return e.classList.contains('mesa-meta') && !e.classList.contains('mesa-etq') && e.textContent;
    })), ['Sin plazo', 'Sin responsable']);
  await comprobar('2. la tira ocupa todo el ancho, con el hito abierto marcado',
    pagina.evaluate(() => {
      const t = document.querySelector('.hito-en-mesa .mesa-tira').getBoundingClientRect();
      const c = document.querySelector('.hito-en-mesa .mesa-columnas').getBoundingClientRect();
      const actual = document.querySelector('.hito-en-mesa .mesa-tira-hito.actual');
      return [Math.abs(t.width - c.width) < 4, actual && actual.dataset.id];
    }), [true, 'c1']);

  /* 3. */
  /* Fila 154: los pasos ya no llevan botón de acción (las acciones, solo en la cabecera). */
  await comprobar('3. el tercer paso es el siguiente, sin botón de acción',
    pagina.evaluate(() => {
      const p = document.querySelector('.hito-en-mesa .guion-paso.guion-siguiente');
      const b = p && p.querySelector('.guion-accion-boton');
      return [p && p.dataset.id, !!b, document.querySelectorAll('.hito-en-mesa .guion-siguiente').length];
    }), ['g3', false, 1]);
  await comprobar('3. los dos hechos, sin explicación ni botones a la vista',
    pagina.evaluate(() => ['g1', 'g2'].map((id) => {
      const p = document.querySelector('.hito-en-mesa .guion-paso[data-id="' + id + '"]');
      const vis = (s) => { const e = p.querySelector(s); return !!(e && e.offsetParent); };
      return p.classList.contains('hecho') && !vis('.guion-paso-explicacion') && !vis('.guion-paso-botones') && !vis('.guion-accion-boton');
    })), [true, true]);
  await comprobar('3. los otros pendientes, tampoco',
    pagina.evaluate(() => !!document.querySelector('.hito-en-mesa .guion-paso[data-id="g5"] .guion-accion-boton')), false);

  /* 4. */
  await pagina.mouse.move(2, 2);
  const noAplica = '.hito-en-mesa .guion-paso[data-id="g4"] .guion-noaplica';
  await comprobar('4. «No aplica» no se ve sin pasar el ratón',
    pagina.evaluate((s) => getComputedStyle(document.querySelector(s)).visibility, noAplica), 'hidden');
  await pagina.hover('.hito-en-mesa .guion-paso[data-id="g4"] .guion-paso-texto');
  await comprobar('4. y sí al pasarlo',
    pagina.evaluate((s) => getComputedStyle(document.querySelector(s)).visibility, noAplica), 'visible');

  /* 5. */
  await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
  await pagina.waitForSelector('.hito-en-mesa .mesa-panel-comunicar .mesa-chip');
  await comprobar('5. «Comunicar ▾» enseña los chips y «Preparar correo»',
    pagina.evaluate(() => {
      const p = document.querySelector('.hito-en-mesa .mesa-panel-comunicar');
      return [!!p.offsetParent, p.querySelectorAll('.mesa-chip').length > 0, !!(p.querySelector('.mesa-preparar-correo') || {}).offsetParent];
    }), [true, true, true]);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('5. Escape lo cierra y la mesa sigue abierta',
    pagina.evaluate(() => [!!document.querySelector('.hito-en-mesa .mesa-panel-comunicar').offsetParent,
      !!document.querySelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]')]), [false, true]);

  /* 6. */
  await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="generar"]');
  await comprobar('6. «Buscar otra plantilla…» está dentro de «Generar documento ▾», con las del paso',
    pagina.evaluate(() => {
      const p = document.querySelector('.hito-en-mesa .mesa-panel-generar');
      return [!!p.offsetParent, !!(p.querySelector('.mesa-buscar-plantilla') || {}).offsetParent, p.querySelectorAll('.mesa-plantilla').length];
    }), [true, true, 1]);
  await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
  await comprobar('6. abrir el otro cierra este: uno solo abierto',
    pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-panel')).filter((p) => p.offsetParent).map((p) => p.className)),
    ['mesa-panel mesa-panel-comunicar']);
  await pagina.mouse.click(ancho / 3, alto - 20);
  await comprobar('6. pulsar fuera lo cierra',
    pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-panel')).filter((p) => p.offsetParent).length), 0);

  /* 7. */
  /* Fila 425: lo dice el bloque «Documentos del hito», en una línea. */
  await comprobar('7. sin documentos, «Ninguno todavía.» en una línea',
    pagina.evaluate(() => {
      const e = document.querySelector('.hito-en-mesa .mesa-grande-docs .mesa-sin-docs');
      return e ? e.textContent.trim().indexOf('Ninguno todavía.') === 0 : null;
    }), true);
  await comprobar('7. sin el botón «Añadir nota» (Intro guarda)',
    pagina.evaluate(() => !!(document.querySelector('.hito-en-mesa .hito-nota-anadir') || {}).offsetParent), false);

  if (ancho === 1905 && process.env.CAPTURAS) {
    fs.mkdirSync(new URL('./capturas/', import.meta.url), { recursive: true });
    await pagina.mouse.move(2, 2);
    await pagina.screenshot({ path: new URL('./capturas/mesa-del-hito-enfocada.png', import.meta.url).pathname });
  }

  if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
  await pagina.close();
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
