/* Prueba en navegador de verdad de la fila 151 de docs/COLA.md
   (docs/PLANTILLA-DESDE-EL-CUADRO.md): crear o editar la plantilla
   desde el propio cuadro de Séneca y de Correo.

   1. Tipo sin ninguna plantilla: sale «Crear plantilla», no el
      desplegable.
   2. «Crear plantilla» abre el editor DENTRO del mismo cuadro (nunca un
      segundo U.preguntar); se inserta un hueco; la vista previa sale
      con los datos del asunto en el que se está.
   3. Al guardar: se vuelve al cuadro, el desplegable ya se pinta con la
      plantilla elegida, y el cuerpo del mensaje sale relleno con ella
      (sin confirmar, porque no había nada escrito a mano).
   4. «Editar plantilla» sobre la existente, con texto escrito a mano en
      el cuerpo: al guardar, pide confirmar antes de pisarlo.
   5. No se pierde el «Para» ni el asunto al ir y volver del editor
      (cuadro de Correo). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260910 CONVALIDACION 26-27 Inventada Prueba, Eva 9990001';

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

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (asunto) => {
  await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, ASUNTO);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async (asunto) => {
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO',
    tercero: 'Inventada Prueba, Eva 9990001', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
}, ASUNTO);
await pagina.locator('.tarjeta-nombre', { hasText: 'Inventada Prueba' }).first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(300);

/* ---------- 1-3: el cuadro de Séneca ---------- */

/* Fila 154: con hitos, «Comunicar» de arriba va escondido (vive en la mesa del hito); su menú se pulsa por debajo. */
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.waitForTimeout(100);
await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Mensaje de Séneca');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(200);

await comprobar('1. sin plantilla, sale «Crear plantilla», no el desplegable',
  pagina.evaluate(() => [!!document.getElementById('seneca-plantilla-crear'), !!document.getElementById('seneca-plantilla')]),
  [true, false]);

await pagina.click('#seneca-plantilla-crear');
await pagina.waitForSelector('#seneca-plantilla-editor:not(.oculto) #pl2-nombre');
await comprobarQue('2. el editor sale DENTRO del cuadro (el formulario se esconde, no hay un segundo #capa)',
  pagina.evaluate(() => document.getElementById('seneca-formulario').classList.contains('oculto') &&
    document.querySelectorAll('#capa').length === 1));

await pagina.fill('#pl2-nombre', 'Aviso de convalidación');
await pagina.fill('#pl2-texto', 'Le informamos sobre ');
await pagina.click('#pl2-insertar-hueco');
await pagina.waitForSelector('.huecos-cuadro', { state: 'visible' });
await pagina.fill('.huecos-buscar', 'nombre');
await pagina.waitForTimeout(150);
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(150);
await comprobarQue('2. se ha insertado el hueco {nombre} en el texto',
  pagina.locator('#pl2-texto').inputValue().then((v) => v.indexOf('{nombre}') !== -1));
await comprobarQue('2. la vista previa sale con los datos del asunto en el que se está (no vacía)',
  pagina.evaluate(() => {
    const t = document.getElementById('pl2-previa').textContent;
    return t.indexOf('Inventada Prueba') !== -1 || t.indexOf('Eva') !== -1;
  }));

await pagina.click('#pl2-guardar');
await pagina.waitForSelector('#seneca-formulario:not(.oculto) #seneca-plantilla');
await pagina.waitForTimeout(200);

await comprobar('3. el desplegable ya se pinta, con la plantilla elegida',
  pagina.locator('#seneca-plantilla').inputValue().then(async (id) => {
    const nombre = await pagina.locator('#seneca-plantilla option:checked').textContent();
    return nombre;
  }), 'Aviso de convalidación');
await comprobarQue('3. el mensaje sale relleno con ella (sin pedir confirmar: no había nada a mano)',
  pagina.locator('#seneca-cuerpo-texto').inputValue().then((v) => v.indexOf('informamos sobre') !== -1));
await comprobar('3. sin el aviso de confirmar (no había texto escrito a mano)',
  pagina.evaluate(() => (document.getElementById('seneca-plantilla-confirmar') || {}).className), 'oculto');

/* ---------- 4: editar, con texto a mano → confirmar ---------- */

await pagina.fill('#seneca-cuerpo-texto', 'Un texto escrito a mano, distinto del programado.');
await pagina.click('#seneca-plantilla-editar');
await pagina.waitForSelector('#seneca-plantilla-editor:not(.oculto) #pl2-nombre');
await comprobar('4. el editor trae el texto de la plantilla existente',
  pagina.locator('#pl2-texto').inputValue().then((v) => v.indexOf('{nombre}') !== -1), true);
await pagina.fill('#pl2-texto', 'Le informamos, de nuevo, sobre {nombre}.');
await pagina.click('#pl2-guardar');
await pagina.waitForSelector('#seneca-formulario:not(.oculto)');
await pagina.waitForTimeout(200);

await comprobarQue('4. con texto a mano, pide confirmar antes de pisarlo',
  pagina.evaluate(() => {
    const c = document.getElementById('seneca-plantilla-confirmar');
    return c && c.textContent.indexOf('se perderá') !== -1;
  }));
await comprobarQue('4. el texto a mano sigue ahí (no se ha pisado todavía)',
  pagina.locator('#seneca-cuerpo-texto').inputValue().then((v) => v.indexOf('escrito a mano') !== -1));
await pagina.click('button:has-text("Cambiar de todas formas")');
await comprobarQue('4. al confirmar, el cuerpo se rellena con la plantilla editada',
  pagina.locator('#seneca-cuerpo-texto').inputValue().then((v) => v.indexOf('de nuevo') !== -1));

await pagina.keyboard.press('Escape');
await pagina.waitForSelector('#capa', { state: 'hidden' });

/* ---------- 5: el cuadro de Correo, no se pierde «Para» ni el asunto ---------- */

/* Fila 154: con hitos, «Comunicar» de arriba va escondido (vive en la mesa del hito); su menú se pulsa por debajo. */
await pagina.waitForSelector('.boton-comunicar', { state: 'attached' });
await pagina.waitForTimeout(100);
await pagina.evaluate((t) => Array.from(document.querySelector('.boton-comunicar').closest('.ficha-menu-envoltorio').querySelectorAll('.ficha-menu-opcion')).find((o) => o.textContent.trim() === t).click(), 'Correo electrónico');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.waitForTimeout(200);

await comprobarQue('5. con plantilla ya creada, «Editar plantilla» también en el cuadro de Correo',
  pagina.evaluate(() => !!document.getElementById('correo-plantilla-editar')));
await pagina.fill('#correo-otro', 'alguien@example.com');
await pagina.fill('#correo-asunto', 'Un asunto de prueba para no perderlo');
await pagina.click('#correo-plantilla-editar');
await pagina.waitForSelector('#correo-plantilla-editor:not(.oculto) #pl2-nombre');
await pagina.click('#pl2-cancelar');
await pagina.waitForSelector('#correo-formulario:not(.oculto)');
await comprobar('5. «Para» sigue como se dejó',
  pagina.locator('#correo-otro').inputValue(), 'alguien@example.com');
await comprobar('5. el asunto sigue como se dejó',
  pagina.locator('#correo-asunto').inputValue(), 'Un asunto de prueba para no perderlo');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await pagina.close();

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
await navegador.close();
process.exit(fallos ? 1 : 0);
