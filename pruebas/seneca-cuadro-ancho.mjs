/* Prueba en navegador de verdad del cuadro de "Mensaje de Séneca"
   rehecho para que se vea entero (fila 53, 18-sep-2026,
   docs/SENECA-CUADRO-ANCHO.md). Comprueba justo la lista de la sección
   5 del encargo: el ancho en dos columnas, el asunto entero con su
   cuenta de caracteres, el aviso cuando el tipo no tiene plantilla,
   los dos botones numerados, la explicación plegada, y que a menos de
   900px cae en una sola columna. Mismo patrón que
   pruebas/cabecera-del-asunto.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 800 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const ASUNTO = '260905 CERT. MATRICULA 26-27 Albarracín Beltrán, María Teresa 1140233';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async (asunto) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [asunto]: {
        tercero: 'Albarracín Beltrán, María Teresa 1140233', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        curso: '26-27', grupo: '1ºBachA', abiertoPor: 'Francisco Marmolejo González'
      }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, ASUNTO);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(300);

await pagina.click('.boton-comunicar');
await pagina.waitForTimeout(100);
await pagina.getByRole('button', { name: 'Mensaje de Séneca', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(150);

/* ============================================================
   1. EL ANCHO, EN DOS COLUMNAS
   ============================================================ */
console.log('--- 1. el ancho, en dos columnas ---');
await comprobarQue('1. el cuadro lleva la clase que lo ensancha',
  pagina.evaluate(() => document.querySelector('#capa .cuadro').classList.contains('cuadro-seneca')));
await comprobar('1. el cuadro llega hasta 1100px como máximo',
  pagina.evaluate(() => Math.round(document.querySelector('#capa .cuadro').getBoundingClientRect().width)), 1100);
await comprobarQue('1. el cuerpo va en dos columnas (grid-template-columns con dos valores)',
  pagina.evaluate(() => getComputedStyle(document.querySelector('.seneca-grid')).gridTemplateColumns.trim().split(' ').length === 2));
await comprobarQue('1. el asunto y el texto están en columnas distintas',
  pagina.evaluate(() => {
    const izq = document.querySelector('.seneca-col-izq').getBoundingClientRect();
    const der = document.querySelector('.seneca-col-der').getBoundingClientRect();
    return document.getElementById('seneca-asunto').getBoundingClientRect().left < der.left &&
      document.getElementById('seneca-cuerpo-texto').getBoundingClientRect().left >= izq.right;
  }));

/* ============================================================
   2. EL ASUNTO, ENTERO, CON SU CUENTA DE CARACTERES
   ============================================================ */
console.log('--- 2. el asunto entero, con su cuenta de caracteres ---');
await comprobarQue('2. el campo del asunto es un textarea, no un input de una línea',
  pagina.evaluate(() => document.getElementById('seneca-asunto').tagName === 'TEXTAREA'));
await comprobar('2. de partida trae la cuenta de caracteres correcta',
  pagina.evaluate(() => {
    const campo = document.getElementById('seneca-asunto');
    return document.getElementById('seneca-caracteres').textContent === campo.value.length + ' caracteres';
  }), true);
await pagina.fill('#seneca-asunto', 'Un asunto de prueba, bastante más corto');
await comprobar('2. la cuenta se actualiza al escribir',
  pagina.locator('#seneca-caracteres').textContent(), 'Un asunto de prueba, bastante más corto'.length + ' caracteres');
/* Devuelve el valor al nombre de la carpeta para el resto de la
   prueba: desde la fila 55 (docs/ASUNTO-SIN-ELECCION.md) ya no hay
   botones para elegir, así que se rellena a mano. */
await pagina.fill('#seneca-asunto', ASUNTO);

/* ============================================================
   3. SIN PLANTILLA DE SÉNECA: EL AVISO, NO EL HUECO VACÍO
   ============================================================ */
console.log('--- 3. sin plantilla, el aviso en vez del hueco vacío ---');
await comprobarQue('3. sale el aviso de "no tiene plantilla"',
  pagina.locator('#seneca-sin-plantilla').textContent().then((t) => t.indexOf('no tiene plantilla de') !== -1));
await comprobar('3. no hay desplegable de plantilla (ninguna donde elegir)',
  pagina.locator('#seneca-plantilla').count(), 0);

/* ============================================================
   4. LOS DOS BOTONES NUMERADOS
   ============================================================ */
console.log('--- 4. los dos botones numerados, cada uno copia lo suyo ---');
await comprobar('4. de partida, "1. Copiar el asunto" es el destacado',
  pagina.evaluate(() => document.getElementById('seneca-copiar-asunto').classList.contains('boton-principal')), true);
await comprobar('4. y "2. Copiar el texto" no lo es todavía',
  pagina.evaluate(() => document.getElementById('seneca-copiar-texto').classList.contains('boton-principal')), false);

await pagina.click('#seneca-copiar-texto');
await pagina.waitForFunction(() => document.getElementById('seneca-copiar-texto').textContent.trim() === 'Copiado');
await comprobar('4. "Copiar el texto" copia de verdad el texto del mensaje',
  pagina.evaluate(() => navigator.clipboard.readText()),
  await pagina.locator('#seneca-cuerpo-texto').inputValue());
await comprobar('4. tras copiar el texto, se destaca el botón del asunto (se pulse en el orden que se pulse)',
  pagina.evaluate(() => document.getElementById('seneca-copiar-asunto').classList.contains('boton-principal')), true);

await pagina.click('#seneca-copiar-asunto');
await pagina.waitForFunction(() => document.getElementById('seneca-copiar-asunto').textContent.trim() === 'Copiado');
await comprobar('4. y "Copiar el asunto" copia de verdad el asunto',
  pagina.evaluate(() => navigator.clipboard.readText()),
  await pagina.locator('#seneca-asunto').inputValue());

await comprobarQue('4. copiar el texto ha dejado rastro en las notas del asunto',
  pagina.evaluate(async (asunto) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const j = JSON.parse(await (await h.getFile()).text());
    const notas = (j.asuntos[asunto] && j.asuntos[asunto].notas) || [];
    return notas.some((n) => String(n.texto || n).indexOf('Mensaje por Séneca') !== -1);
  }, ASUNTO));

/* ============================================================
   5. LA EXPLICACIÓN DEL AYUDANTE, PLEGADA
   ============================================================ */
console.log('--- 5. la explicación del ayudante está plegada ---');
await comprobarQue('5. el enlace de instalar está a la vista, fuera del desplegable',
  pagina.locator('.seneca-ayudante-caja > #seneca-ayudante-enlace a').isVisible());
await comprobar('5. el <details> empieza cerrado',
  pagina.evaluate(() => document.querySelector('.seneca-explica-detalles').open), false);
await comprobarQue('5. la explicación de siempre está dentro del <details>',
  pagina.locator('.seneca-explica-detalles').textContent().then((t) => t.indexOf('barra de marcadores') !== -1));

/* ============================================================
   6. ESTRECHANDO LA VENTANA, UNA SOLA COLUMNA
   ============================================================ */
console.log('--- 6. por debajo de 900px, una sola columna ---');
await pagina.setViewportSize({ width: 700, height: 800 });
await pagina.waitForTimeout(150);
await comprobarQue('6. una sola columna (grid-template-columns con un valor)',
  pagina.evaluate(() => getComputedStyle(document.querySelector('.seneca-grid')).gridTemplateColumns.trim().split(' ').length === 1));
await comprobarQue('6. nada se sale del cuadro (el cuadro cabe en el ancho de la ventana)',
  pagina.evaluate(() => document.querySelector('#capa .cuadro').getBoundingClientRect().width <= 700));

await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await comprobarQue('la clase que ensancha el cuadro se quita al cerrar',
  pagina.evaluate(() => !document.querySelector('#capa .cuadro').classList.contains('cuadro-seneca')));

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
