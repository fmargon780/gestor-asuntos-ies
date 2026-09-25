/* Prueba en navegador de verdad de la mesa del hito en tarjetas (25-sep-2026,
   fila 147 de docs/COLA.md, docs/MESA-TARJETAS-QUE-SE-ABREN.md).

   A 1905×1000 y a 1280×800, sobre un asunto inventado con un hito de cinco
   pasos de guion (dos hechos), dos documentos (uno registrado, con su
   gemelo sin sellar) y dos notas:
     1. Al abrir el hito, en grande está el guion; a la derecha, las
        tarjetas pequeñas de Documentos y de Notas, sin botones dentro. La de
        Documentos dice «26SM0617» y «Sin registrar».
     2. Pulsar la de Documentos: la tabla sale en grande, con el nombre del
        fichero entero (sin «…») y el gemelo debajo; a la derecha, la tarjeta
        pequeña del guion con «2 de 5» y el siguiente paso en negrita.
     3. Escape vuelve al guion y la mesa sigue abierta. Otro Escape la cierra.
     4. Abrir Notas, escribir sin guardar, forzar un repintado: la tarjeta
        sigue abierta y el texto en la caja. Intro guarda; la nota sale arriba
        y en el resumen de la tarjeta pequeña.
     5. Cambiar de hito con la tira: se abre con el guion en grande.
     6. Con CAPTURAS=1, una captura de cada tarjeta abierta a 1905×1000 en
        pruebas/capturas/ (datos inventados). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Prueba, Eva 9990001';
const GUIAS = {
  CONVALIDACION: [
    { id: 'c1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [],
      guion: [
        { id: 'g1', texto: 'Comprobar los datos del alumno', explicacion: 'Nombre, curso y Nº escolar.', accion: '' },
        { id: 'g2', texto: 'Comprobar la firma', explicacion: '', accion: '' },
        { id: 'g3', texto: 'Registrar la solicitud en Séneca', explicacion: 'Con su número de entrada.', accion: '' },
        { id: 'g4', texto: 'Pedir el certificado académico', explicacion: '', accion: '' },
        { id: 'g5', texto: 'Avisar a la familia', explicacion: '', accion: 'comunicar' }
      ] },
    { id: 'c2', titulo: 'Resolver', cuerpo: '', opciones: [] }
  ]
};
const REGISTRADO = '260902 26SM0617 JUSTIFICANTE DE ENTREGA DE LA SOLICITUD DE CONVALIDACION FIRMADA POR LA FAMILIA.pdf';
const GEMELO = '260902 JUSTIFICANTE DE ENTREGA DE LA SOLICITUD DE CONVALIDACION FIRMADA POR LA FAMILIA SIN SELLAR.pdf';
const SIN_REG = '260901 SOLICITUD.pdf';

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
  await pagina.evaluate(async ([guias, asunto, docs]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const h = await g.getFileHandle('guias.json', { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    docs.forEach((d) => c._hijos.set(d, window.__disco.fich(d, '%PDF-1.4')));
  }, [GUIAS, ASUNTO, [REGISTRADO, GEMELO, SIN_REG]]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, reg, sinReg]) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
      tercero: 'Inventada Prueba, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {},
      notas: [
        { texto: 'La familia llamó por teléfono', quien: 'Francisco', cuando: U.ahora(), hito: 'c1', hitoTitulo: 'Recoger la solicitud' },
        { texto: 'Traen el certificado el lunes\nsegunda línea', quien: 'Ana', cuando: U.ahora(), hito: 'c1', hitoTitulo: 'Recoger la solicitud' }
      ] });
    await Hitos.marcarGuion(asunto, 'c1', 'g1', { hecho: true });
    await Hitos.marcarGuion(asunto, 'c1', 'g2', { hecho: true });
    await Hitos.anadirDocumento(asunto, 'c1', reg);
    await Hitos.anadirDocumento(asunto, 'c1', sinReg);
    await App.verAbiertos();
  }, [ASUNTO, REGISTRADO, SIN_REG]);
  await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Prueba' }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  await pagina.locator('#ficha-guia .hito[data-id="c1"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(500);
  return { pagina, errores };
}

/* Qué se ve: la tarjeta grande y las pequeñas de la derecha. */
function queSeVe(pagina) {
  return pagina.evaluate(() => {
    const vis = (e) => !!(e && e.offsetParent);
    const m = document.querySelector('.hito-en-mesa');
    return {
      grande: Array.from(m.querySelectorAll('.mesa-grande')).filter(vis).map((e) => e.dataset.tarjeta),
      pequenas: Array.from(m.querySelectorAll('.mesa-resumen')).filter(vis).map((e) => e.dataset.tarjeta)
    };
  });
}

async function capturar(pagina, nombre) {
  if (!process.env.CAPTURAS) return;
  fs.mkdirSync(new URL('./capturas/', import.meta.url), { recursive: true });
  await pagina.mouse.move(2, 2);
  await pagina.screenshot({ path: new URL('./capturas/' + nombre + '.png', import.meta.url).pathname });
}

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);
  const fotos = ancho === 1905;

  /* 1. */
  await comprobar('1. en grande, el guion; a la derecha, Documentos y Notas', queSeVe(pagina),
    { grande: ['guion'], pequenas: ['docs', 'notas'] });
  await comprobar('1. las tarjetas pequeñas, sin botones dentro',
    pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-resumen button, .hito-en-mesa .mesa-resumen input').length), 0);
  await comprobar('1. la de Documentos dice «26SM0617» y «Sin registrar», con la cuenta',
    pagina.evaluate(() => {
      const t = document.querySelector('.hito-en-mesa .mesa-resumen[data-tarjeta="docs"]');
      return [Array.from(t.querySelectorAll('.mesa-resumen-etq')).map((e) => e.textContent).sort(),
        t.querySelector('.mesa-resumen-cuenta').textContent];
    }), [['26SM0617', 'Sin registrar'], '· 2']);
  await comprobar('1. la de Notas, la primera línea de la última y quién',
    pagina.evaluate(() => {
      const t = document.querySelector('.hito-en-mesa .mesa-resumen[data-tarjeta="notas"]');
      return [t.querySelector('.mesa-resumen-nota').textContent, t.querySelector('.mesa-resumen-pie').textContent.indexOf('Última: Ana') === 0,
        t.querySelector('.mesa-resumen-cuenta').textContent];
    }), ['Traen el certificado el lunes', true, '· 2 notas']);
  if (fotos) await capturar(pagina, 'mesa-tarjeta-guion');

  /* 2. */
  await pagina.locator('.hito-en-mesa .mesa-resumen[data-tarjeta="docs"]').click();
  await comprobar('2. pulsar Documentos la abre en grande; el guion pasa a la derecha', queSeVe(pagina),
    { grande: ['docs'], pequenas: ['guion', 'notas'] });
  await comprobar('2. el nombre del fichero, entero y sin «…»',
    pagina.evaluate((reg) => {
      const b = document.querySelector('.hito-en-mesa .mesa-grande-docs .hito-documento[data-doc="' + reg + '"] .hito-doc-abrir');
      const s = getComputedStyle(b);
      return [b.textContent, b.scrollWidth <= b.clientWidth + 1, s.textOverflow !== 'ellipsis' || s.overflow === 'visible'];
    }, REGISTRADO), [REGISTRADO, true, true]);
  await comprobar('2. el gemelo, debajo de su documento, con su «Abrir»',
    pagina.evaluate((reg) => {
      const f = document.querySelector('.hito-en-mesa .mesa-grande-docs .hito-documento[data-doc="' + reg + '"]');
      const g = f && f.querySelector('.mesa-doc-gemelo-fila');
      const n = f && f.querySelector('.mesa-doc-nombre');
      return [!!g && g.textContent.indexOf('Original sin sellar') === 0, !!g && g.getBoundingClientRect().top >= n.getBoundingClientRect().bottom - 1,
        !!g && g.querySelector('.mesa-doc-gemelo').textContent];
    }, REGISTRADO), [true, true, 'Abrir']);
  await comprobar('2. la pequeña del guion dice «2 de 5» y el siguiente, en negrita',
    pagina.evaluate(() => {
      const t = document.querySelector('.hito-en-mesa .mesa-resumen[data-tarjeta="guion"]');
      const s = t.querySelector('.mesa-resumen-siguiente');
      return [t.querySelector('.mesa-resumen-cuenta').textContent, s && s.textContent, s && Number(getComputedStyle(s).fontWeight) >= 600];
    }), ['· 2 de 5', '→ Registrar la solicitud en Séneca', true]);
  if (fotos) await capturar(pagina, 'mesa-tarjeta-documentos');

  /* 3. */
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. Escape vuelve al guion, con la mesa abierta',
    pagina.evaluate(() => [document.getElementById('ficha-guia').classList.contains('con-mesa'),
      Array.from(document.querySelectorAll('.hito-en-mesa .mesa-grande')).filter((e) => e.offsetParent).map((e) => e.dataset.tarjeta)]),
    [true, ['guion']]);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('3. otro Escape cierra la mesa',
    pagina.evaluate(() => document.getElementById('ficha-guia').classList.contains('con-mesa')), false);

  /* 4. */
  await pagina.locator('#ficha-guia .hito[data-id="c1"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(300);
  await pagina.locator('.hito-en-mesa .mesa-resumen[data-tarjeta="notas"]').focus();
  await pagina.keyboard.press('Enter');
  await comprobar('4. Intro sobre la tarjeta de Notas la abre en grande', queSeVe(pagina),
    { grande: ['notas'], pequenas: ['guion', 'docs'] });
  const caja = '.hito-en-mesa .mesa-grande-notas .hito-nota-texto';
  await pagina.click(caja);
  await pagina.keyboard.type('Pendiente de la firma');
  await pagina.evaluate(() => HitosPanel.programarRepintado());
  await pagina.waitForTimeout(900);
  await comprobar('4. tras un repintado, la tarjeta sigue abierta y el texto en la caja',
    Promise.all([queSeVe(pagina).then((v) => v.grande), pagina.inputValue(caja)]), [['notas'], 'Pendiente de la firma']);
  await pagina.press(caja, 'Enter');
  await pagina.waitForTimeout(1000);
  await comprobar('4. Intro guarda: la nota sale arriba y la caja se vacía',
    pagina.evaluate(() => {
      const n = document.querySelector('.hito-en-mesa .mesa-grande-notas .mesa-notas .hito-nota');
      return [n && n.textContent.indexOf('Pendiente de la firma') !== -1, document.querySelector('.hito-en-mesa .hito-nota-texto').value];
    }), [true, '']);
  await comprobar('4. y la tarjeta sigue en grande',
    queSeVe(pagina).then((v) => v.grande), ['notas']);
  await comprobar('4. notas e historia, en dos columnas (una sola por debajo de 1100 px)',
    pagina.evaluate(() => {
      const r = Array.from(document.querySelectorAll('.hito-en-mesa .mesa-notas-columnas > .mesa-bloque')).map((e) => e.getBoundingClientRect());
      return Math.abs(r[0].top - r[1].top) < 2 && r[0].width > r[1].width;
    }), true);
  if (fotos) await capturar(pagina, 'mesa-tarjeta-notas');
  await pagina.locator('.hito-en-mesa .mesa-resumen[data-tarjeta="docs"]').click();
  await comprobar('4. la pequeña de Notas trae la nueva',
    pagina.locator('.hito-en-mesa .mesa-resumen[data-tarjeta="notas"] .mesa-resumen-nota').textContent(), 'Pendiente de la firma');

  /* 5. */
  await pagina.locator('.hito-en-mesa .mesa-tira-hito[data-id="c2"]').click();
  await pagina.waitForSelector('.hito-en-mesa[data-id="c2"]');
  await pagina.waitForTimeout(300);
  await comprobar('5. cambiar de hito con la tira abre el guion en grande', queSeVe(pagina),
    { grande: ['guion'], pequenas: ['docs', 'notas'] });

  if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
  await pagina.close();
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
