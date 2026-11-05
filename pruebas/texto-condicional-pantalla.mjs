/* Fila 510 (docs/510-PARRAFOS-SEGUN-EL-ASUNTO.md): los textos condicionales en pantalla, con Chromium real y la copia de pruebas.
   A. Editor de plantillas de correo: el recuadro «Insertar» con «Campo variable» y «Texto condicional» (ya no hay «Insertar hueco»);
      el cuadro ofrece solo los campos de lista del tipo y sus valores; «Poner la marca» la escribe al principio del párrafo del
      cursor y cambia la que hubiera; Escape cierra el cuadro sin cerrar el de la plantilla; el texto para Séneca también lo tiene.
   B. Un tipo sin campos de lista: el cuadro lo dice.
   C. «Retocar» una plantilla de Word: «Texto condicional…» al final del menú, en azul; pone la marca (morada) al principio del
      párrafo; una segunda vez la cambia (una sola línea); la ✕ la quita. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const PROT = 'Protocolo de absentismo iniciado';

const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.addInitScript(() => {
  try {
    const abiertas = {};
    ['datos', 'campos', 'pasos', 'correo', 'word', 'plazo', 'palabras', 'repite'].forEach((s) => { abiertas['tipo:' + s] = true; });
    window.localStorage.setItem('gestor-ajustes-plegado', JSON.stringify(abiertas));
  } catch (e) { /* sin localStorage */ }
});
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

/* Un campo de lista para un tipo (como si se hubiera creado en Ajustes). */
const darCampoDeLista = (tipo) => p.evaluate(([t, nombre]) => {
  const c = App.E.campos = App.E.campos || {};
  c.propios = (c.propios || []).filter((x) => x.id !== 'pcond');
  c.propios.push({ id: 'pcond', nombre, clase: 'lista', valores: ['Sí', 'No'] });
  c.porTipo = c.porTipo || {};
  c.porTipo[t] = (c.porTipo[t] || []).filter((x) => x.id !== 'pcond').concat([{ origen: 'propio', id: 'pcond' }]);
}, [tipo, PROT]);
const quitarCampoDeLista = (tipo) => p.evaluate((t) => { App.E.campos.porTipo[t] = (App.E.campos.porTipo[t] || []).filter((x) => x.id !== 'pcond'); }, tipo);

/* ---------- A ---------- */
console.log('--- A. el editor de plantillas de correo ---');
await p.click('.pestana[data-pantalla="ajustes"]');
await p.waitForSelector('#tabla-tipos .tarjeta-tipo');
await p.locator('#tabla-tipos .tarjeta-tipo').first().locator('.tarjeta-tipo-nombre').click();
await p.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await p.waitForSelector('#tipo-plantillas-nueva');
await p.click('#tipo-plantillas-nueva');
await p.waitForSelector('#capa:not(.oculto)');
await p.waitForSelector('#pl-texto');
const tipo = await p.evaluate(() => document.getElementById('pl-tipo').value);
await darCampoDeLista(tipo);

await comprobar('A. el recuadro «Insertar» con sus dos botones', p.evaluate(() => {
  const c = document.querySelector('#pl-texto').closest('#capa').querySelector('.insertar-caja');
  return [c.querySelector('legend').textContent, [...c.querySelectorAll('button')].map((b) => b.textContent), document.body.innerText.indexOf('Insertar hueco') === -1];
}), ['Insertar', ['Campo variable', 'Texto condicional'], true]);
await comprobar('A. el texto para Séneca también tiene «Texto condicional»', p.locator('#pl-texto-seneca-condicional').count(), 1);

await p.fill('#pl-texto', 'Hola.\n\nPrimer párrafo.\n\nSegundo párrafo.');
await p.evaluate(() => { const t = document.getElementById('pl-texto'); t.focus(); t.setSelectionRange(10, 10); });
await p.click('#pl-texto-condicional');
await p.waitForSelector('#texto-cond-cuadro');
await comprobar('A. el cuadro ofrece el campo de lista del tipo y sus valores', p.evaluate(() => [
  [...document.querySelectorAll('#tc-campo option')].map((o) => o.textContent), [...document.querySelectorAll('#tc-valor option')].map((o) => o.textContent),
  [...document.querySelectorAll('#texto-cond-cuadro button')].map((b) => b.textContent)]),
  [[PROT], ['Sí', 'No'], ['Cancelar', 'Poner la marca']]);
await p.keyboard.press('Escape');
await comprobar('A. Escape cierra el cuadro y deja el de la plantilla', [await p.locator('#texto-cond-cuadro').count(), await p.locator('#capa:not(.oculto) #pl-texto').count()], [0, 1]);

await p.evaluate(() => { const t = document.getElementById('pl-texto'); t.focus(); t.setSelectionRange(10, 10); });
await p.click('#pl-texto-condicional');
await p.waitForSelector('#texto-cond-cuadro');
await p.selectOption('#tc-valor', 'No');
await p.click('#tc-poner');
await comprobar('A. la marca va al principio del párrafo del cursor', p.inputValue('#pl-texto'), 'Hola.\n\n{si:' + PROT + '=No} Primer párrafo.\n\nSegundo párrafo.');
await comprobar('A. y se dice debajo', p.textContent('#pl-texto-cond-aviso'), 'Marca puesta: el párrafo solo saldrá si «' + PROT + '» es «No».');
await p.evaluate(() => { const t = document.getElementById('pl-texto'); t.focus(); t.setSelectionRange(12, 12); });
await p.click('#pl-texto-condicional');
await p.waitForSelector('#texto-cond-cuadro');
await p.selectOption('#tc-valor', 'Sí');
await p.click('#tc-poner');
await comprobar('A. una segunda vez cambia la marca, no añade otra', p.inputValue('#pl-texto'), 'Hola.\n\n{si:' + PROT + '=Sí} Primer párrafo.\n\nSegundo párrafo.');
await comprobar('A. «Campo variable» abre la ventana de elegir un campo (fila 528)', (async () => {
  await p.click('#pl-insertar-hueco'); await p.waitForSelector('.capa-campos #ce-buscar');
  const r = await p.evaluate(() => document.getElementById('ce-buscar').placeholder);
  await p.keyboard.press('Escape'); return r;
})(), 'Buscar por campo, tabla o columna');

/* ---------- B ---------- */
console.log('--- B. un tipo sin campos de lista ---');
await quitarCampoDeLista(tipo);
await p.click('#pl-texto-condicional');
await p.waitForSelector('#texto-cond-cuadro');
await comprobar('B. lo dice en vez de enseñar desplegables vacíos', p.evaluate(() => [!!document.getElementById('tc-sin-campos'), document.querySelectorAll('#texto-cond-cuadro select').length]), [true, 0]);
await p.keyboard.press('Escape');
await p.click('#capa #cuadro-cancelar');
await p.waitForTimeout(300);

/* ---------- C ---------- */
console.log('--- C. «Retocar» una plantilla de Word ---');
await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-plantillas').open = true; });
await p.waitForFunction(() => /\d+ de Word · \d+ de correo/.test(document.getElementById('plantillas-resumen').textContent), null, { timeout: 15000 });
await p.click('#plantillas-abrir');
await p.waitForSelector('.pt-tabla');
const tipoWord = await p.evaluate(() => Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Aviso de revisión')[0].tipo);
await darCampoDeLista(tipoWord);
await p.locator('.pt-tabla tbody tr').filter({ has: p.locator('.pt-nombre', { hasText: 'Aviso de revisión' }) }).locator('[data-accion="retocar"]').click();
await p.waitForSelector('#retocar-plantilla .cep-doc .cep-hoja-interior p', { timeout: 20000 });
await p.waitForTimeout(1200);
async function seleccionar(frase) {
  await p.evaluate((f) => {
    const w = document.createTreeWalker(document.querySelector('#retocar-plantilla .cep-doc .cep-hoja-interior'), NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const i = n.nodeValue.indexOf(f);
      if (i !== -1) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + f.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); break; }
    }
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }, frase);
  await p.waitForTimeout(400);
}
await seleccionar('antes del 30 de junio');
await comprobar('C. el menú acaba con «Texto condicional…», en azul', p.evaluate(() => {
  const bs = [...document.querySelectorAll('.cep-menu-sel button')];
  return [bs.map((b) => b.textContent).pop(), bs[bs.length - 1].classList.contains('cep-menu-nuevo')];
}), ['Texto condicional…', true]);
await p.locator('.cep-menu-sel button', { hasText: 'Texto condicional…' }).click();
await p.waitForSelector('#texto-cond-cuadro');
await p.selectOption('#tc-valor', 'No');
await p.click('#tc-poner');
await p.waitForTimeout(1500);
await comprobar('C. la marca queda en morado al principio del párrafo', p.evaluate(() => {
  const m = document.querySelector('#retocar-plantilla mark.cep-condicion');
  return [m && m.textContent, m && m.closest('p').textContent.indexOf(m.textContent) === 0];
}), ['{si:' + PROT + '=No}', true]);
await comprobar('C. una línea en «Lo que has cambiado»', p.evaluate(() => [...document.querySelectorAll('#retocar-plantilla .cep-linea')].map((l) => l.innerText.replace(/\s+/g, ' ').replace(/ ?✕$/, '').trim())),
  ['Texto condicional: «Se informa de que el alunmo {{NOMBRE…» solo sale si «' + PROT + '» es «No»']);
await comprobar('C. se dice que la marca está puesta', p.evaluate((n) => [...document.querySelectorAll('#mensajes .mensaje')].some((m) => m.textContent.indexOf('Marca puesta: el párrafo solo saldrá si «' + n + '» es «No».') !== -1), PROT), true);

await seleccionar('debe presentar');
await p.locator('.cep-menu-sel button', { hasText: 'Texto condicional…' }).click();
await p.waitForSelector('#texto-cond-cuadro');
await p.selectOption('#tc-valor', 'Sí');
await p.click('#tc-poner');
await p.waitForTimeout(1500);
await comprobar('C. otra vez en el mismo párrafo: cambia la marca y sigue habiendo una línea', p.evaluate(() => [
  [...document.querySelectorAll('#retocar-plantilla mark.cep-condicion')].map((m) => m.textContent), document.querySelectorAll('#retocar-plantilla .cep-linea').length]),
  [['{si:' + PROT + '=Sí}'], 1]);
await p.click('#retocar-plantilla .cep-linea .cer-x');
await p.waitForTimeout(1500);
await comprobar('C. la ✕ quita la marca', p.evaluate(() => [document.querySelectorAll('#retocar-plantilla mark.cep-condicion').length, document.querySelectorAll('#retocar-plantilla .cep-linea').length]), [0, 0]);

/* ---------- D ---------- */
console.log('--- D. con un asunto de verdad y «Faltan datos» ---');
await p.keyboard.press('Escape');
await p.waitForTimeout(500);
const tipoAsunto = await p.evaluate(() => App.E.listaAbiertos[0].leido.tipo);
await darCampoDeLista(tipoAsunto);
await comprobar('D. los valores del asunto traen los campos de lista del tipo', p.evaluate(async () => (await Plantillas.valoresDeAsunto(App.E.listaAbiertos[0])).camposLista), { [PROT]: ['Sí', 'No'] });
const MARCA = '{si:' + PROT + '=Sí} Sale si es Sí.';
await comprobar('D. con el campo vacío sale con «[falta: …]»', p.evaluate(async (m) => {
  const v = await Plantillas.valoresDeAsunto(App.E.listaAbiertos[0]);
  const r = Plantillas.rellenar(m, v);
  return [r.texto, r.faltan];
}, MARCA), ['[falta: ' + PROT + '] Sale si es Sí.', [PROT]]);
await comprobar('D. con el campo elegido en el asunto, sale sin marca', p.evaluate(async (m) => {
  const a = App.E.listaAbiertos[0];
  a.ficha.campos = Object.assign({}, a.ficha.campos, { 'propio:pcond': { valor: 'Sí' } });
  const v = await Plantillas.valoresDeAsunto(a);
  return Plantillas.rellenar(m, v).texto;
}, MARCA), 'Sale si es Sí.');
await p.evaluate(async (n) => {
  const a = App.E.listaAbiertos[0];
  a.ficha.campos = {};
  const v = await Plantillas.valoresDeAsunto(a);
  Plantillas.rellenar('{si:' + n + '=Sí} x', v);   /* anota las opciones del campo que falta */
  window.__respuesta = WordFaltan.preguntar([n]);
}, PROT);
await p.waitForSelector('#word-falta-0');
await comprobar('D. «Faltan datos» pide el campo con un desplegable con sus opciones', p.evaluate(() => {
  const c = document.getElementById('word-falta-0');
  return [c.tagName, [...c.options].map((o) => o.textContent)];
}), ['SELECT', ['—', 'Sí', 'No']]);
await p.selectOption('#word-falta-0', 'No');
await p.click('#cuadro-aceptar');
await comprobar('D. y lo elegido decide el párrafo de ese documento', p.evaluate(async (n) => {
  const r = await window.__respuesta;
  const v = Object.assign(await Plantillas.valoresDeAsunto(App.E.listaAbiertos[0]), { aMano: r.aMano });
  return [r.accion, r.aMano, Plantillas.rellenar('{si:' + n + '=Sí} Sí.\n\n{si:' + n + '=No} No.', v).texto];
}, PROT), ['generar', { [PROT]: 'No' }, 'No.']);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
