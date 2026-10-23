/* Prueba en navegador de verdad de la mesa del hito, en una sola columna
   (25-sep-2026, fila 147 de docs/COLA.md; adaptada el 22-oct-2026 a la fila 425,
   docs/FICHA-VISTA-DE-TRABAJO.md: antes eran tres tarjetas, una en grande y dos de resumen).

   A 1905×1000 y a 1280×800, sobre un asunto inventado con un hito de cinco
   pasos de guion (dos hechos), dos documentos (uno registrado, con su
   gemelo sin sellar) y dos notas:
     1. Al abrir el hito, el guion, los documentos del hito y el registro están a la vez,
        de arriba abajo, sin tarjetas de resumen.
     2. En los documentos, el nombre del fichero entero (sin «…») y el gemelo debajo,
        con «26SM0617» y «Sin registrar».
     3. Escape cierra la mesa (la lista de hitos) y no se vuelve a abrir sola.
     4. Escribir una nota sin guardar y forzar un repintado: el texto sigue en la caja.
        Intro guarda; la nota sale arriba del registro.
     5. Cambiar de hito con la tira: se abre su mesa.
     6. Con CAPTURAS=1, una captura a 1905×1000 en pruebas/capturas/ (datos inventados). */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';
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
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(500);
  return { pagina, errores };
}

/* Qué se ve: los bloques del hito, de arriba abajo. */
function queSeVe(pagina) {
  return pagina.evaluate(() => {
    const vis = (e) => !!(e && e.offsetParent);
    const m = document.querySelector('.hito-en-mesa');
    return Array.from(m.querySelectorAll('.mesa-col-hito > section')).filter(vis)
      .map((e) => e.dataset.tarjeta || (e.classList.contains('mesa-campos-hito') ? 'campos' : '?'));
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
  await comprobar('1. tareas, campos, documentos y registro, de arriba abajo', queSeVe(pagina), ['guion', 'campos', 'docs', 'notas']);
  await comprobar('1. sin tarjetas de resumen ni «← Volver al guion»',
    pagina.evaluate(() => document.querySelectorAll('.hito-en-mesa .mesa-resumen, .hito-en-mesa .mesa-volver-guion').length), 0);
  await comprobar('1. el guion dice «2 de 5»',
    pagina.evaluate(() => document.querySelector('.hito-en-mesa .mesa-guion-cuenta').textContent), '2 de 5');
  await comprobar('1. los documentos dicen cuántos son',
    pagina.evaluate(() => document.querySelector('.hito-en-mesa .mesa-grande-docs .mesa-docs-cuenta').textContent), '· 2');
  await comprobar('1. el registro dice «2 líneas»',
    pagina.evaluate(() => document.querySelector('.hito-en-mesa .mesa-grande-notas .mesa-docs-cuenta').textContent), '· 2 líneas');
  if (fotos) await capturar(pagina, 'mesa-una-columna');

  /* 2. */
  await comprobar('2. «26SM0617» y «Sin registrar»',
    pagina.evaluate(() => Array.from(document.querySelectorAll('.hito-en-mesa .mesa-grande-docs .mesa-doc-estado, .hito-en-mesa .mesa-grande-docs .mesa-doc-registro')).map((e) => e.textContent).filter((t) => t !== '—').sort()),
    ['26SM0617', 'Registrado', 'Sin registrar']);
  /* Fila 439: una sola línea; un nombre larguísimo puede cortarse con «…» y entonces se ve entero en el title. */
  await comprobar('2. el nombre del fichero, entero (o cortado con «…» y entero en el title)',
    pagina.evaluate((reg) => {
      const b = document.querySelector('.hito-en-mesa .mesa-grande-docs .hito-documento[data-doc="' + reg + '"] .hito-doc-abrir');
      const s = getComputedStyle(b);
      return [b.textContent, b.title, b.scrollWidth <= b.clientWidth + 1 || (s.textOverflow === 'ellipsis' && b.title === b.textContent)];
    }, REGISTRADO), [REGISTRADO, REGISTRADO, true]);
  await comprobar('2. el gemelo, debajo de su documento, con su «Abrir»',
    pagina.evaluate((reg) => {
      const f = document.querySelector('.hito-en-mesa .mesa-grande-docs .hito-documento[data-doc="' + reg + '"]');
      const g = f && f.querySelector('.mesa-doc-gemelo-fila');
      const n = f && f.querySelector('.mesa-doc-nombre');
      return [!!g && g.textContent.indexOf('Original sin sellar') === 0, !!g && g.getBoundingClientRect().top >= n.getBoundingClientRect().bottom - 1,
        !!g && g.querySelector('.mesa-doc-gemelo').textContent];
    }, REGISTRADO), [true, true, 'Abrir']);

  /* 3. */
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  await comprobar('3. Escape cierra la mesa y enseña la lista de hitos',
    pagina.evaluate(() => [document.getElementById('ficha-guia').classList.contains('con-mesa'), document.querySelectorAll('#ficha-guia .hito').length]), [false, 2]);
  await pagina.evaluate(() => HitosPanel.programarRepintado());
  await pagina.waitForTimeout(500);
  await comprobar('3. un repintado no la reabre',
    pagina.evaluate(() => document.getElementById('ficha-guia').classList.contains('con-mesa')), false);

  /* 4. */
  await abrirHito(pagina, 'c1');
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="c1"]');
  await pagina.waitForTimeout(300);
  const caja = '.hito-en-mesa .mesa-grande-notas .hito-nota-texto';
  await pagina.click(caja);
  await pagina.keyboard.type('Pendiente de la firma');
  await pagina.evaluate(() => HitosPanel.programarRepintado());
  await pagina.waitForTimeout(900);
  await comprobar('4. tras un repintado, el texto sigue en la caja', pagina.inputValue(caja), 'Pendiente de la firma');
  await pagina.press(caja, 'Enter');
  await pagina.waitForTimeout(1000);
  await comprobar('4. Intro guarda: la nota sale arriba y la caja se vacía',
    pagina.evaluate(() => {
      const n = document.querySelector('.hito-en-mesa .mesa-grande-notas .mesa-notas .hito-nota');
      return [n && n.textContent.indexOf('Pendiente de la firma') !== -1, document.querySelector('.hito-en-mesa .hito-nota-texto').value];
    }), [true, '']);
  await comprobar('4. «Registro»: una sola lista por fechas, sin columna de Historia (fila 229)',
    pagina.evaluate(() => [document.querySelectorAll('.hito-en-mesa .mesa-grande-notas .hito-notas').length,
      document.querySelectorAll('.hito-en-mesa .mesa-historia, .hito-en-mesa .mesa-notas-columnas').length,
      document.querySelector('.hito-en-mesa .mesa-grande-notas .mesa-grande-titulo').textContent]), [1, 0, 'Registro']);

  /* 5. */
  await pagina.locator('.hito-en-mesa .mesa-tira-hito[data-id="c2"]').click();
  await pagina.waitForSelector('.hito-en-mesa[data-id="c2"]');
  await pagina.waitForTimeout(300);
  await comprobar('5. cambiar de hito con la tira abre su mesa', queSeVe(pagina).then((v) => v.indexOf('guion') !== -1 && v.indexOf('notas') !== -1), true);

  if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
  await pagina.close();
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
