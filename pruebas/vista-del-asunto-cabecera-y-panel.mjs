/* Prueba de la fila 637 (13-nov-2026, docs/637-VISTA-DEL-ASUNTO-CABECERA-Y-PANEL.md): la vista del asunto,
   cabecera de una línea y panel derecho en cinco bloques plegados. Chromium real con los datos de la copia de pruebas
   (?demo=1&auto=1).

   1. Cabecera de un asunto de alumno: una línea con «← Volver», tipo, número y «Apellidos, Nombre + identificación»;
      a la derecha «Ruta» y «Archivar el asunto»; la carpeta no es el título.
   2. El menú «⋯»: Cambiar el asunto, Índice del expediente, Marcar como reservado, Copiar (Asunto, NIE, Nombre) y Borrar.
   3. No salen «Hito N de M · …», «El encargo», «Elegir datos», la fila de copiar ni «Abierto el…» en la cabecera.
   4. La fila de hitos, debajo de la cabecera, con el actual marcado y «+ Añadir hito»; pulsar un hito lo enseña.
   5. Sin pestañas; cinco bloques plegados, en su orden, que se abren y se pliegan.
   6. «Datos»: plegado, la línea con ⧉; abierto, los tres recuadros, «Ver todo», «Elegir qué se ve plegado», «+ Añadir campo»
      y «Abierto el…» al pie. Empresa: «La empresa»; grupo: «El grupo» y sin «Contacto».
   7. «Quién lo pide» y «Por qué vía» en «Campos de este asunto»: salen en el que los tiene rellenos, no en el que no.
   8. Un documento de la carpeta se ve a la derecha tapando los bloques, con el hito a la izquierda; «← Carpeta» lo cierra.
   9. Una nota en «Registro» queda la primera. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);

async function abrir(frag) {
  await pagina.evaluate((f) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(f) !== -1 || ((x.ficha && x.ficha.tercero) || '').indexOf(f) !== -1)[0];
    App.abrirFicha(a, 'abierto');
  }, frag);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto) #ficha-plegables', { timeout: 15000 });
  await pagina.waitForSelector('#ficha-guia .hito, #ficha-guia .explica', { state: 'attached', timeout: 15000 });
  await pagina.waitForTimeout(1800);
}
const textos = (sel) => pagina.evaluate((s) => Array.from(document.querySelectorAll(s)).map((e) => e.textContent.trim().replace(/\s+/g, ' ')), sel);
const titulosDeBloques = () => textos('#ficha-plegables .plegable-titulo');
const abiertos = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-plegables .ficha-plegable.abierto')).map((e) => e.dataset.tarjeta));
const abrirBloque = (t) => pagina.locator('#ficha-plegables .plegable-cab', { hasText: t }).first().click();

/* ---------- el asunto de un alumno ---------- */
console.log('--- 1. cabecera ---');
await abrir('Espejo Montes');
await comprobar('1. «← Volver», tipo, número y el tercero, en una línea',
  pagina.evaluate(() => {
    const l = document.querySelector('.ficha-linea1');
    const dentro = [l.querySelector('#ficha-volver'), l.querySelector('.marca-tipo'), l.querySelector('.marca-numero'), l.querySelector('.ficha-nombre-texto')];
    const arriba = dentro.map((e) => Math.round(e.getBoundingClientRect().top / 20));
    return { textos: dentro.map((e) => e.textContent.trim()), unaLinea: arriba.every((y) => Math.abs(y - arriba[0]) <= 1), alto: l.getBoundingClientRect().height < 60 };
  }), { textos: ['← Volver', 'CERTIFICADO', 'A26-0003', 'Espejo Montes, Carla 2100006'], unaLinea: true, alto: true });
await comprobar('1. el nombre de la carpeta no es el título', pagina.evaluate(() => document.querySelector('.ficha-nombre-texto').textContent.indexOf('261024') === -1), true);
await comprobar('1. a la derecha, «Ruta» y «Archivar el asunto»',
  pagina.evaluate(() => [document.querySelector('#ficha-ruta button'), document.querySelector('#ficha-archivar button')].map((b) => b && b.textContent.trim())), ['Ruta', 'Archivar el asunto']);
await comprobar('1. y están a la derecha de la línea',
  pagina.evaluate(() => document.querySelector('#ficha-archivar button').getBoundingClientRect().right > window.innerWidth - 80 &&
    document.querySelector('#ficha-ruta button').getBoundingClientRect().left > document.querySelector('.ficha-nombre').getBoundingClientRect().right), true);

console.log('--- 2. el menú «⋯» ---');
await pagina.click('.ficha-nombre-menu-boton');
await pagina.waitForTimeout(300);
await comprobar('2. el menú, en su orden',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) > *')).filter((e) => !e.hidden).map((e) => e.tagName === 'HR' ? '—' : e.textContent.trim()).filter((t) => t !== 'DNI')),
  ['Cambiar el asunto', 'Índice del expediente', 'Marcar como reservado', '—', 'Copiar', 'Asunto', 'NIE', 'Nombre', '—', 'Borrar el asunto']);
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion:has-text("Nombre")');
await pagina.waitForTimeout(300);
await comprobar('2. «Nombre» copia sin romper nada y avisa', pagina.evaluate(() => /Copiado/.test(document.body.innerText)), true);

console.log('--- 3. lo que ya no sale ---');
await comprobar('3. en la cabecera, ni «Hito N de M», ni «El encargo», ni «Elegir datos», ni la fila de copiar, ni «Abierto el»',
  pagina.evaluate(() => {
    const t = document.querySelector('.ficha-cabecera').innerText + ' ' + document.querySelector('.ficha-tira-fila').innerText;
    return [/Hito \d+ de \d+/.test(t), /El encargo/.test(t), /Elegir datos/.test(t), /Abierto el/.test(t), !!document.querySelector('.ficha-copiar-fila')];
  }), [false, false, false, false, false]);
await comprobar('3. ni los botones «Elegir datos» y «El encargo» en ningún sitio', pagina.evaluate(() => !/Elegir datos|El encargo/.test(document.getElementById('pantalla-asunto').innerText)), true);

console.log('--- 4. la fila de hitos ---');
await comprobar('4. debajo de la cabecera, con el actual marcado y «+ Añadir hito» al final',
  pagina.evaluate(() => {
    const t = document.getElementById('ficha-tira');
    const h = Array.from(t.children);
    const cab = document.querySelector('.ficha-cabecera').getBoundingClientRect();
    return { debajo: t.getBoundingClientRect().top >= cab.bottom - 1, hitos: h.filter((x) => x.classList.contains('mesa-tira-hito')).length >= 2,
      actual: h.filter((x) => x.classList.contains('actual')).length, ultimo: h[h.length - 1].textContent.trim(), sinVolverAHitos: !document.getElementById('mesa-volver-hitos') };
  }), { debajo: true, hitos: true, actual: 1, ultimo: '+ Añadir hito', sinVolverAHitos: true });
const hitoAntes = await pagina.evaluate(() => document.querySelector('#ficha-guia .hito-en-mesa').dataset.id);
await pagina.locator('#ficha-tira .mesa-tira-hito').nth(1).click();
await pagina.waitForTimeout(600);
await comprobar('4. pulsar otro hito lo enseña a la izquierda y lo marca', pagina.evaluate((antes) => {
  const en = document.querySelector('#ficha-guia .hito-en-mesa').dataset.id;
  const marcado = document.querySelector('#ficha-tira .mesa-tira-hito.actual').dataset.id;
  return [en !== antes, en === marcado];
}, hitoAntes), [true, true]);

console.log('--- 5. los cinco bloques ---');
await comprobar('5. sin pestañas', pagina.evaluate(() => document.querySelectorAll('.ficha-pestana, #ficha-tarjetas-pestanas').length), 0);
await comprobar('5. los cinco bloques, en su orden', titulosDeBloques(),
  ['Datos', 'Personas y entidades relacionadas', 'Documentos de la carpeta', 'Registro', 'Otros asuntos de este tercero']);
await comprobar('5. todos plegados al entrar', abiertos(), []);
await comprobar('5. a la derecha del hito', pagina.evaluate(() => document.getElementById('ficha-plegables').getBoundingClientRect().left > document.getElementById('ficha-guia').getBoundingClientRect().right - 5), true);
await abrirBloque('Registro');
await comprobar('5. se abre al pulsar su título', abiertos(), ['notas']);
await abrirBloque('Registro');
await comprobar('5. y se pliega al volver a pulsar', abiertos(), []);

console.log('--- 6. «Datos» ---');
await comprobar('6. plegado enseña la línea de datos con sus botones de copiar',
  pagina.evaluate(() => { const l = document.querySelector('[data-resumen-bloque="datos"]'); return [/NIE/.test(l.textContent), l.querySelectorAll('.dato-copiable').length >= 2]; }), [true, true]);
await abrirBloque('Datos');
await pagina.waitForTimeout(500);
await comprobar('6. abierto: la alumna, contacto y campos de este asunto',
  textos('#ficha-datos-bloque .datos-grupo h4'), ['La alumna', 'Contacto', 'Campos de este asunto']);
await comprobar('6. «Ver todo», «Elegir qué se ve plegado», «+ Añadir campo»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-datos-bloque button')).map((b) => b.textContent.trim()).filter((t) => /Ver todo|Elegir qué se ve plegado|Añadir campo/.test(t))),
  ['Ver todo', 'Elegir qué se ve plegado', '+ Añadir campo']);
await comprobar('6. «Abierto el… · quién» al pie', pagina.evaluate(() => /^Abierto el \d\d\/\d\d\/\d{4}/.test(document.querySelector('#ficha-datos-bloque .datos-pie').textContent)), true);
await comprobar('6. abierto no repite la línea plegada', pagina.evaluate(() => getComputedStyle(document.querySelector('[data-resumen-bloque="datos"]')).display), 'none');
await pagina.locator('#ficha-datos-bloque button', { hasText: 'Ver todo' }).click();
await pagina.waitForTimeout(500);
await comprobar('6. «Ver todo» abre la ventana de siempre', pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto')), true);
await pagina.keyboard.press('Escape');
await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar') || document.getElementById('cuadro-cancelar'); if (!document.getElementById('capa').classList.contains('oculto') && c) c.click(); });
await pagina.waitForTimeout(300);

console.log('--- 7. «Quién lo pide» y «Por qué vía» ---');
await comprobar('7. en un asunto que tiene la vía, «Por qué vía» sale en «Campos de este asunto»',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-datos-bloque .datos-grupo.ancho .ficha-dato > span:first-child')).map((e) => e.textContent.trim()).filter((t) => /Quién lo pide|Por qué vía/.test(t))), ['Por qué vía']);

console.log('--- 8. un documento de la carpeta ---');
await abrirBloque('Documentos de la carpeta');
await pagina.waitForTimeout(400);
await pagina.locator('#ficha-documentos .ficha-documento-fila .ficha-documento-nombre, #ficha-documentos .ficha-documento-fila .ficha-documento', { hasText: 'Fuente Lucena' }).first().click();
await pagina.waitForTimeout(1800);
await comprobar('8. se ve a la derecha tapando los bloques; el hito sigue a la izquierda',
  pagina.evaluate(() => ({ visor: !!document.querySelector('#trabajo-der > .en-trabajo:not(.oculto)'), bloques: document.getElementById('ficha-plegables').offsetParent === null, hito: !!document.getElementById('ficha-guia').offsetParent })),
  { visor: true, bloques: true, hito: true });
await pagina.evaluate(() => { const b = Array.from(document.querySelectorAll('#trabajo-der button')).filter((x) => /Carpeta|Volver/.test(x.textContent) && x.offsetParent)[0]; if (b) b.click(); });
await pagina.waitForTimeout(600);
await comprobar('8. «← Carpeta» lo cierra y vuelven los bloques', pagina.evaluate(() => document.getElementById('ficha-plegables').offsetParent !== null), true);

console.log('--- 9. «Registro» ---');
await abrirBloque('Registro');
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { const c = document.querySelector('#ficha-notas textarea, #ficha-notas input'); c.focus(); });
await pagina.keyboard.type('Nota de prueba de la fila 637');
await pagina.keyboard.press('Enter');
await pagina.waitForTimeout(1500);
await comprobar('9. la nota queda la primera del registro',
  pagina.evaluate(() => { const lineas = Array.from(document.querySelectorAll('#ficha-notas .nota-linea, #ficha-notas .registro-linea, #ficha-notas li, #ficha-notas .nota-texto')).map((e) => e.textContent); return lineas.length ? /Nota de prueba de la fila 637/.test(lineas[0]) : /Nota de prueba de la fila 637/.test(document.getElementById('ficha-notas').innerText); }), true);

/* ---------- una empresa y un grupo ---------- */
console.log('--- 10. empresa y grupo ---');
await abrir('Suministros Escolares');
await abrirBloque('Datos');
await pagina.waitForTimeout(500);
await comprobar('10. empresa: «La empresa» y «Contacto»', textos('#ficha-datos-bloque .datos-grupo h4'), ['La empresa', 'Contacto', 'Campos de este asunto']);
await comprobar('10. en la empresa, «Quién lo pide» no sale si no lo tiene ni lo pide el tipo',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-datos-bloque .ficha-dato > span:first-child')).map((e) => e.textContent.trim()).filter((t) => /Quién lo pide/.test(t))), []);
await abrir('GRUPO Museo');
await abrirBloque('Datos');
await pagina.waitForTimeout(500);
await comprobar('10. grupo: «El grupo» y sin «Contacto»', textos('#ficha-datos-bloque .datos-grupo h4').then((t) => t.filter((x) => x !== 'Campos de este asunto')), ['El grupo']);
await comprobar('10. el asunto de grupo lleva su actividad antes que «Datos»', titulosDeBloques().then((t) => t.slice(0, 2)), ['La actividad', 'Datos']);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
