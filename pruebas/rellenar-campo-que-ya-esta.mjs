/* Prueba en navegador de la fila 276 de docs/COLA.md (docs/RELLENAR-CAMPO-QUE-YA-ESTA.md):
   «Rellenar» un campo que el asunto ya tiene vacío, el motivo a la vista en el panel de
   campos y los botones apagados que se ven apagados. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
const ASUNTO_1 = '260915 CONVALIDACION 26-27 Sola Uno, Eva 9990201';
const ASUNTO_2 = '260916 CONVALIDACION 26-27 Sola Dos, Ana 9990202';
const CAMPOS = {
  propios: [
    { id: 'p1', nombre: 'Importe de prueba', clase: 'importe', valores: [] },
    { id: 'p2', nombre: 'Otro campo', clase: 'texto', valores: [] }
  ],
  porTipo: { CONVALIDACION: [{ origen: 'propio', id: 'p1', obligatorio: false, enNombre: false }] }
};

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([campos, a1, a2]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('campos.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(campos)); await w.close();
  await window.__disco.abiertos.getDirectoryHandle(a1, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(a2, { create: true });
}, [CAMPOS, ASUNTO_1, ASUNTO_2]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async ([a1, a2]) => {
  await App.anotar(a1, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO', tercero: 'Sola Uno, Eva 9990201', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.anotar(a2, { abiertoEl: U.ahora(), tipo: 'CONVALIDACION', categoria: 'ALUMNADO', tercero: 'Sola Dos, Ana 9990202', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
  window.__avisos = [];
  const o = U.aviso;
  U.aviso = function (m, t) { window.__avisos.push(String(m) + '|' + t); return o.apply(this, arguments); };
}, [ASUNTO_1, ASUNTO_2]);

async function abrirFichaDe(corto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('.tarjeta-nombre, .nombre-pulsable', { hasText: corto }).first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-campo-anadir', { state: 'attached' });
  await pagina.waitForTimeout(300);
}
async function abrirPanel() {
  await pagina.click('#ficha-campo-anadir');
  await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
}
async function pestana(id) {
  await pagina.click('#campos-catalogo-pestanas [data-pestana="' + id + '"]');
  await pagina.waitForTimeout(150);
}
const filaMios = (n) => pagina.locator('#campos-mios-lista .fila-tipo', { hasText: n });
const ultimoAviso = () => pagina.evaluate(() => window.__avisos[window.__avisos.length - 1]);
const datosDeLaFicha = () => pagina.evaluate(() => document.getElementById('ficha-datos-tramite').textContent.replace(/\s+/g, ' ').trim());
const cerrarPanel = () => pagina.click('#cuadro-cancelar').catch(() => {});

console.log('--- 1. el motivo y los botones apagados, en Ajustes (sin asunto) ---');
await comprobar('1. en Ajustes de un tipo, el motivo es «ya está en este tipo» y el botón se ve apagado', pagina.evaluate(async () => {
  const caja = document.createElement('div'); document.body.appendChild(caja);
  const lista = [{ origen: 'propio', id: 'p1', obligatorio: false, enNombre: false }];
  CamposCatalogo.abrir(caja, { tipo: 'CONVALIDACION', categoria: 'ALUMNADO' }, lista, { onCambio() {}, onVolver() {} });
  await new Promise((r) => setTimeout(r, 400));
  caja.querySelector('[data-pestana="mios"]').click();
  await new Promise((r) => setTimeout(r, 300));
  const fila = Array.from(caja.querySelectorAll('.fila-tipo')).filter((f) => /Importe de prueba/.test(f.textContent))[0];
  const b = fila.querySelector('button');
  const e = getComputedStyle(b);
  const normal = getComputedStyle(fila.querySelectorAll('button')[1]);
  const r = [fila.querySelector('.suave').textContent, b.textContent, b.disabled, e.cursor, e.color !== normal.color];
  caja.remove();
  return r;
}), ['ya está en este tipo', 'Añadir', true, 'default', true]);

console.log('--- 2 a 7. desde la ficha del asunto ---');
await abrirFichaDe('Sola Uno');
await comprobar('2. la tarjeta «Campos del asunto» no enseña «Importe de prueba» (está vacío)', (await datosDeLaFicha()).indexOf('Importe de prueba') === -1, true);
await abrirPanel();
await comprobar('3. arriba, «Ya están en este asunto, sin rellenar» con «Importe de prueba» y «Rellenar»', pagina.evaluate(() => {
  const g = document.getElementById('campos-catalogo-yaestan');
  return [g.querySelector('.etiqueta').textContent, g.querySelector('.nombre-tipo').textContent, g.querySelector('button').textContent];
}), ['Ya están en este asunto, sin rellenar', 'Importe de prueba', 'Rellenar']);
await pestana('mios');
await comprobar('4. «Míos»: «Rellenar» encendido y el motivo entero; el otro campo, «Añadir» encendido', pagina.evaluate(() => {
  const filas = Array.from(document.querySelectorAll('#campos-mios-lista .fila-tipo'));
  const f1 = filas.filter((f) => /Importe de prueba/.test(f.textContent))[0];
  const f2 = filas.filter((f) => /Otro campo/.test(f.textContent))[0];
  const m = f1.querySelector('.suave');
  return [f1.querySelector('button').textContent, f1.querySelector('button').disabled, m.textContent, m.scrollWidth <= m.clientWidth + 1,
    f2.querySelector('button').textContent, f2.querySelector('button').disabled];
}), ['Rellenar', false, 'en este asunto, sin rellenar', true, 'Añadir', false]);
await filaMios('Importe de prueba').getByRole('button', { name: 'Rellenar' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await comprobar('5. el cuadro «Rellenar el campo «Importe de prueba»», con «Guardar» y sin «¿Dónde se guarda?»', pagina.evaluate(() => [
  document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-aceptar').textContent,
  document.getElementById('cuadro-cuerpo').textContent.indexOf('Dónde se guarda') !== -1,
  document.getElementById('cuadro-cuerpo').textContent.indexOf('se puede dejar vacío') !== -1]),
  ['Rellenar el campo «Importe de prueba»', 'Guardar', false, false]);
await pagina.fill('#cad-valor', '12,50');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(700);
await comprobar('6. aviso verde y la tarjeta enseña el campo con 12,50 €', [await ultimoAviso(), /Importe de prueba.*12,50/.test(await datosDeLaFicha())],
  ['Campo «Importe de prueba» rellenado.|bueno', true]);
await abrirPanel();
await comprobar('7. ya no sale el grupo de arriba', pagina.evaluate(() => {
  const g = document.getElementById('campos-catalogo-yaestan');
  return !g || g.classList.contains('oculto') || !g.querySelector('.fila-tipo');
}), true);
await pestana('mios');
await comprobar('7. en «Míos», «Añadir» apagado y «ya está en este asunto»', pagina.evaluate(() => {
  const f = Array.from(document.querySelectorAll('#campos-mios-lista .fila-tipo')).filter((x) => /Importe de prueba/.test(x.textContent))[0];
  return [f.querySelector('button').textContent, f.querySelector('button').disabled, f.querySelector('.suave').textContent];
}), ['Añadir', true, 'ya está en este asunto']);
await cerrarPanel();

console.log('--- 8. el tipo y el otro asunto no cambian ---');
await comprobar('8. la configuración del tipo es la misma', pagina.evaluate(async () =>
  ((await Carpetas.leerJson(App.E.gestor, 'campos.json')).porTipo || {}).CONVALIDACION.length), 1);
await comprobar('8. el otro asunto sigue sin valor', pagina.evaluate((n) => {
  const f = App.E.registro.asuntos[n] || {}; return !f.campos || !f.campos['propio:p1'] || !f.campos['propio:p1'].valor;
}, ASUNTO_2), true);

console.log('--- 9 a 12. el otro asunto ---');
await abrirFichaDe('Sola Dos');
await abrirPanel();
await pagina.locator('#campos-catalogo-yaestan button', { hasText: 'Rellenar' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await comprobar('9. desde el grupo de arriba, el mismo cuadro', pagina.locator('#cuadro-titulo').textContent(), 'Rellenar el campo «Importe de prueba»');
await pagina.fill('#cad-valor', 'abc');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await comprobar('10. «abc»: aviso ámbar y el cuadro vuelve con lo escrito', [(await ultimoAviso()).split('|')[1], await pagina.locator('#cad-valor').inputValue()], ['ambar', 'abc']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(300);
await comprobar('10. «Cancelar»: no se guarda nada', pagina.evaluate((n) => {
  const f = App.E.registro.asuntos[n] || {}; return !f.campos || !f.campos['propio:p1'] || !f.campos['propio:p1'].valor;
}, ASUNTO_2), true);
await abrirPanel();
await pagina.locator('#campos-catalogo-yaestan button', { hasText: 'Rellenar' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await pagina.fill('#cad-valor', '');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('11. caja vacía: aviso ámbar «No has escrito nada…»', await ultimoAviso(), 'No has escrito nada: «Importe de prueba» sigue vacío.|ambar');
await abrirPanel();
await pestana('mios');
await filaMios('Otro campo').getByRole('button', { name: 'Añadir' }).click();
await pagina.waitForSelector('#capa:not(.oculto) #cad-valor');
await comprobar('12. un campo que el asunto no tiene: pide el valor y «¿Dónde se guarda?»', pagina.evaluate(() => [
  document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-cuerpo').textContent.indexOf('Dónde se guarda') !== -1]),
  ['Añadir el campo «Otro campo»', true]);
await pagina.click('#cuadro-cancelar');

console.log('--- 13. desde la mesa de un hito ---');
await comprobar('13. sin «Rellenar» en ninguna pestaña; el motivo, «ya está en este asunto»', (async () => {
  await pagina.evaluate((n) => { CampoDesdeElAsunto.abrir(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], { marca: 'h1', titulo: 'Hito de prueba', enGuia: false }); }, ASUNTO_2);
  await pagina.waitForSelector('#capa:not(.oculto) #campos-catalogo-pestanas');
  const ficha = await pagina.evaluate(() => /Rellenar/.test(document.getElementById('cad-panel').textContent));
  await pestana('mios');
  const mios = await pagina.evaluate(() => {
    const f = Array.from(document.querySelectorAll('#campos-mios-lista .fila-tipo')).filter((x) => /Importe de prueba/.test(x.textContent))[0];
    return [/Rellenar/.test(document.getElementById('cad-panel').textContent), f.querySelector('button').textContent, f.querySelector('button').disabled, f.querySelector('.suave').textContent];
  });
  await pagina.click('#cuadro-cancelar');
  return [ficha, mios];
})(), [false, [false, 'Añadir', true, 'ya está en este asunto']]);

console.log('--- 14. el botón principal apagado, como antes ---');
await abrirFichaDe('Sola Dos');
await abrirPanel();
await pestana('mios');
await pagina.click('#campos-mios-crear');
await pagina.waitForSelector('#propio-crear');
await comprobar('14. «Crear y añadir» con el nombre vacío: fondo azul claro y texto blanco', pagina.evaluate(() => {
  const b = document.getElementById('propio-crear'); const e = getComputedStyle(b);
  return [b.disabled, e.backgroundColor, e.color];
}), [true, 'rgb(182, 195, 208)', 'rgb(255, 255, 255)']);
await pagina.click('#cuadro-cancelar');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
