/* Fila 322 (docs/RETOCAR-UNA-PLANTILLA.md): «Retocar» una plantilla de Word. Con Chromium real y la copia de pruebas.
   1. «Retocar» abre la pantalla con el documento, sus huecos resaltados y la lista vacía; «Guardar los cambios», apagado.
   2. Cambiar por otro texto, la ✕ que lo deshace, y las demás opciones del menú.
   3. Guardar: fichero nuevo, el de antes sigue, mismo id, «Deshacer»; generar con ella.
   4. Un fichero compartido pregunta; cancelar con y sin cambios; la tarjeta de Ajustes; solo consultar. */
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

async function abrir(antes) {
  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1');
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  await pagina.waitForTimeout(2500);
  return pagina;
}
async function irALaLista(p) {
  await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-plantillas').open = true; });
  await p.waitForFunction(() => /\d+ de Word · \d+ de correo/.test(document.getElementById('plantillas-resumen').textContent), null, { timeout: 15000 });
  await p.click('#plantillas-abrir');
  await p.waitForSelector('.pt-tabla');
}
const fila = (p, nombre) => p.locator('.pt-tabla tbody tr').filter({ has: p.locator('.pt-nombre', { hasText: nombre }) });
const textoDoc = (p) => p.evaluate(() => document.querySelector('#retocar-plantilla .cep-doc').innerText.replace(/\s+/g, ' '));
const lineas = (p) => p.evaluate(() => [...document.querySelectorAll('#retocar-plantilla .cep-linea')].map((l) => l.innerText.replace(/\s+/g, ' ').replace(/ ?✕$/, '').trim()));
const avisosVerdes = (p) => p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].map((m) => m.textContent));
async function seleccionar(p, frase) {
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
async function opcion(p, texto) { await p.locator('.cep-menu-sel button', { hasText: texto }).click(); }
async function cambiarPorTexto(p, frase, nuevo) {
  await seleccionar(p, frase);
  await opcion(p, 'Cambiar por otro texto…');
  await p.waitForSelector('#cep-texto-nuevo');
  await p.fill('#cep-texto-nuevo', nuevo);
  await p.click('#cuadro-aceptar');
  await p.waitForTimeout(1500);
}
async function retocar(p, nombre) {
  await fila(p, nombre).locator('[data-accion="retocar"]').click();
  await p.waitForSelector('#retocar-plantilla .cep-doc .cep-hoja-interior p', { timeout: 20000 });
  await p.waitForTimeout(1200);
}
const ficheroDe = (p, nombre) => p.evaluate((n) => Plantillas.enMemoria().documentos.filter((d) => d.nombre === n)[0].fichero, nombre);

/* ---------- 1: el botón y la pantalla ---------- */
console.log('--- 1. el botón y la pantalla ---');
let p = await abrir();
await irALaLista(p);
await comprobar('1. cada línea tiene «Ver», «Retocar», «Cambiar», en ese orden', fila(p, 'Aviso de revisión').locator('.pt-acciones > button').allTextContents(), ['Ver', 'Retocar', 'Cambiar']);
const idAntes = await p.evaluate(() => Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Aviso de revisión')[0].id);
const ficheroAntes = await ficheroDe(p, 'Aviso de revisión');
await retocar(p, 'Aviso de revisión');
await comprobar('1. título, ayuda, lista vacía y nota del pie', p.evaluate(() => {
  const c = document.getElementById('retocar-plantilla');
  return [c.querySelector('.cer-titulo').textContent, c.querySelector('.cep-lateral').textContent.indexOf('Selecciona con el ratón el trozo que quieras cambiar.') !== -1,
    c.querySelector('.cep-lineas').textContent, /Para añadir párrafos, tablas o cambiar el formato: corrígelo en Word y usa «Sustituir el fichero»\./.test(c.querySelector('.cep-lateral').textContent)];
}), ['Retocar «Aviso de revisión»', true, 'Todavía no has cambiado nada.', true]);
await comprobar('1. el documento, con sus huecos resaltados', p.evaluate(() => [document.querySelector('#retocar-plantilla .cep-doc').innerText.indexOf('el alunmo') !== -1, [...document.querySelectorAll('#retocar-plantilla mark.cep-hueco')].map((m) => m.textContent).join('|')]), [true, '{{NOMBRE NATURAL}}|{{HOY}}']);
await comprobar('1. «Guardar los cambios» apagado', p.locator('#cer-guardar').isDisabled(), true);
await comprobar('1. ni propuestas del asistente ni datos de la plantilla', p.evaluate(() => {
  const t = document.getElementById('retocar-plantilla').textContent;
  return [/Datos de este asunto|Quien firma|Para que sirva con hombre/.test(t), !!document.getElementById('cep-nombre-plantilla')];
}), [false, false]);

/* ---------- 2: cambiar ---------- */
console.log('--- 2. cambiar por otro texto y deshacer ---');
await seleccionar(p, 'el alunmo');
await comprobar('2. el menú tiene las cinco opciones', p.locator('.cep-menu-sel button').allTextContents(), ['Cambiar por un dato…', 'Cambiar por otro texto…', 'Esto se pregunta cada vez', 'Quitar del documento', 'Quitar el párrafo entero']);
await opcion(p, 'Cambiar por otro texto…');
await p.waitForSelector('#cep-texto-nuevo');
await comprobar('2. el cuadro lleva el trozo escrito y «Antes»', p.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('cep-texto-nuevo').value, document.getElementById('cuadro-cuerpo').textContent.indexOf('Antes: el alunmo') !== -1, document.getElementById('cuadro-aceptar').textContent]), ['Cambiar este texto', 'el alunmo', true, 'Cambiar']);
await p.click('#cuadro-aceptar');
await p.waitForTimeout(600);
await comprobar('2. sin cambiar nada, «Cambiar» no hace nada', [(await lineas(p)).length, await p.locator('#cer-guardar').isDisabled()], [0, true]);
await cambiarPorTexto(p, 'el alunmo', 'el alumno');
await comprobar('2. la línea «antes → ahora», el documento lo enseña y se enciende «Guardar»', [(await lineas(p))[0], /el alumno/.test(await textoDoc(p)), /alunmo/.test(await textoDoc(p)), await p.locator('#cer-guardar').isDisabled(), await p.locator('#retocar-plantilla mark.cep-cambio').count() > 0], ['el alunmo → el alumno · 1 vez', true, false, false, true]);
await cambiarPorTexto(p, '2025', '2026');
await comprobar('2. «2025» aparece dos veces y cambian las dos', [(await lineas(p))[1], /2025/.test(await textoDoc(p)), ((await textoDoc(p)).match(/2026/g) || []).length], ['2025 → 2026 · 2 veces', false, 2]);
await p.locator('#retocar-plantilla .cep-linea', { hasText: '2025 → 2026' }).locator('.cer-x').click();
await p.waitForTimeout(1500);
await comprobar('2. la ✕ lo deshace: vuelve «2025» las dos veces y «el alumno» sigue', [((await textoDoc(p)).match(/2025/g) || []).length, /el alumno/.test(await textoDoc(p)), (await lineas(p)).length], [2, true, 1]);

console.log('--- 3. las demás opciones ---');
await seleccionar(p, 'En caso de no presentar los documentos');
await opcion(p, 'Quitar el párrafo entero');
await p.waitForTimeout(1500);
await comprobar('3. el párrafo entero desaparece y la línea empieza por «Quitar el párrafo»', [/En caso de no presentar/.test(await textoDoc(p)), (await lineas(p)).some((l) => /^Quitar el párrafo: «En caso de no presentar/.test(l))], [false, true]);
await seleccionar(p, 'documentación');
await opcion(p, 'Quitar del documento');
await p.waitForTimeout(1500);
await comprobar('3. «Quitar del documento» quita solo esa palabra', [/documentación/.test(await textoDoc(p)), /presentar su antes del 30/.test(await textoDoc(p)), /Se informa de que/.test(await textoDoc(p))], [false, true, true]);
await seleccionar(p, 'Localidad de pruebas');
await opcion(p, 'Cambiar por un dato…');
await p.waitForSelector('#huecos-buscar');
await p.fill('#huecos-buscar', 'grupo');
await p.keyboard.press('Enter');
await p.waitForTimeout(1800);
await comprobar('3. «Cambiar por un dato…»: queda su hueco resaltado', p.evaluate(() => [...document.querySelectorAll('#retocar-plantilla mark.cep-hueco')].map((m) => m.textContent).filter((t) => /grupo/.test(t)).length), 1);
await seleccionar(p, 'Se informa de que');
await opcion(p, 'Esto se pregunta cada vez');
await p.waitForSelector('#cep-nombre-dato');
await p.fill('#cep-nombre-dato', 'Quién informa');
await p.click('#cuadro-aceptar');
await p.waitForTimeout(1500);
await comprobar('3. «Esto se pregunta cada vez» deja su campo', [(await lineas(p)).some((l) => /Se pregunta cada vez: Quién informa/.test(l)), /\{campo:Quién informa\}/.test(await textoDoc(p))], [true, true]);
await seleccionar(p, '{{NOMBRE NATURAL}}');
await comprobar('3. un hueco entero también se puede seleccionar', p.locator('.cep-menu-sel button').count(), 5);
await p.keyboard.press('Escape');

console.log('--- 4. cancelar ---');
await p.click('#retocar-plantilla .cep-pie button:has-text("Cancelar")');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('4. con cambios pregunta, con las dos respuestas', p.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]), ['Has cambiado 5 cosas. ¿Salir sin guardar?', 'Salir sin guardar', 'Seguir retocando']);
await p.click('#cuadro-cancelar');
await p.waitForTimeout(400);
await comprobar('4. «Seguir retocando»: no se pierde nada', [(await lineas(p)).length, await p.locator('#retocar-plantilla').count(), await p.evaluate(() => document.getElementById('cuadro-cancelar').textContent)], [5, 1, 'Cancelar']);

/* ---------- 5: guardar ---------- */
console.log('--- 5. guardar, generar y deshacer ---');
await p.click('#cer-guardar');
await p.waitForSelector('#retocar-plantilla', { state: 'detached', timeout: 20000 });
await p.waitForFunction(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].some((m) => /Plantilla retocada\./.test(m.textContent)), null, { timeout: 10000 });
const ficheroNuevo = await ficheroDe(p, 'Aviso de revisión');
await comprobar('5. aviso verde con «Deshacer», y se vuelve a la lista', p.evaluate(() => { const m = [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /Plantilla retocada/.test(x.textContent))[0]; return [m.querySelector('button').textContent, !!document.querySelector('.pt-tabla')]; }), ['Deshacer', true]);
await comprobar('5. el fichero es otro, el id es el mismo, y el de antes sigue en la carpeta', p.evaluate(async (a) => {
  const d = await PlantillasDocumento._interno.carpetaDePlantillas(); const nombres = (await Carpetas.ficheros(d)).map((f) => f.nombre);
  return [nombres.indexOf(a.antes) !== -1, nombres.indexOf(a.nuevo) !== -1, a.nuevo !== a.antes, Plantillas.enMemoria().documentos.filter((x) => x.nombre === 'Aviso de revisión')[0].id === a.id];
}, { antes: ficheroAntes, nuevo: ficheroNuevo, id: idAntes }), [true, true, true, true]);
await comprobar('5. la columna «Fichero» enseña el nuevo', fila(p, 'Aviso de revisión').locator('.pt-fichero').textContent(), ficheroNuevo);
const generado = await p.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => /Herrera/.test(x.nombre))[0];
  const pl = (await Plantillas.cargar(App.E.gestor)).documentos.filter((x) => x.nombre === 'Aviso de revisión')[0];
  const hitos = Hitos.visibles(await Hitos.hitosDe(a.nombre));
  window.__generando = PlantillasDocumento.generar(a, pl, 'abierto', { hito: hitos[0] || null }).catch(() => {});   /* no se espera: acaba al cerrar el visor */
  return a.nombre;
});
await p.waitForSelector('#word-visor:not(.oculto) .docx, #word-faltan, #word-falta-0', { timeout: 20000 }).catch(() => {});
const respondiendo = await p.locator('#word-falta-0').count();
if (respondiendo) { await p.fill('#word-falta-0', 'Ana Gil'); await p.click('#cuadro-aceptar'); await p.waitForSelector('#word-visor:not(.oculto) .docx', { timeout: 20000 }); }
await p.waitForTimeout(1500);
const textoGenerado = await p.evaluate(async (nombre) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === nombre)[0];
  const f = (await Carpetas.ficheros(a.handle)).filter((x) => /\.docx$/i.test(x.nombre) && /AVISO/.test(x.nombre)).pop();
  if (!f) return null;
  const bytes = new Uint8Array(await (await f.handle.getFile()).arrayBuffer());
  return DocxSustituir.textosDeParrafos(await Docx.leerEntradaDeTexto(bytes, 'word/document.xml')).join('\n');
}, generado);
await comprobar('5. el documento generado lleva el texto corregido y no el párrafo quitado', textoGenerado && [/el alumno /.test(textoGenerado), /alunmo|En caso de no presentar/.test(textoGenerado)], [true, false]);
await p.evaluate(() => WordVisor.cerrar());
await p.waitForTimeout(500);

/* Retocar otra vez y «Deshacer» */
await irALaLista(p);   /* generar el documento ha llevado a la ficha del asunto */
await retocar(p, 'Aviso de revisión');
await cambiarPorTexto(p, 'AVISO', 'COMUNICADO');
await p.click('#cer-guardar');
await p.waitForSelector('#retocar-plantilla', { state: 'detached', timeout: 20000 });
await p.waitForFunction((f) => Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Aviso de revisión')[0].fichero !== f, ficheroNuevo, { timeout: 10000 });
const ficheroTercero = await ficheroDe(p, 'Aviso de revisión');
await p.evaluate(() => [...document.querySelectorAll('#mensajes .mensaje.bueno')].filter((x) => /Plantilla retocada/.test(x.textContent)).pop().querySelector('button').click());
await p.waitForFunction((f) => Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Aviso de revisión')[0].fichero === f, ficheroNuevo, { timeout: 10000 });
await comprobar('5. «Deshacer» vuelve al fichero de antes del segundo retoque', [ficheroTercero !== ficheroNuevo, await fila(p, 'Aviso de revisión').locator('.pt-fichero').textContent()], [true, ficheroNuevo]);

/* ---------- 6: un fichero compartido ---------- */
console.log('--- 6. un fichero que usan dos plantillas ---');
const cobroAntes = await ficheroDe(p, 'Justificante de cobro');
await retocar(p, 'Justificante de pago');
await cambiarPorTexto(p, 'registros', 'archivos');
await p.click('#cer-guardar');
await p.waitForSelector('#capa:not(.oculto) #pf-solo-esta', { timeout: 15000 });
await comprobar('6. la pregunta nombra a la otra y ofrece las tres respuestas', p.evaluate(() => [document.getElementById('cuadro-cuerpo').textContent.indexOf('Justificante de cobro') !== -1, document.getElementById('pf-solo-esta').textContent, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]), [true, 'Solo en esta', 'En todas', 'Cancelar']);
await p.click('#pf-solo-esta');
await p.waitForSelector('#retocar-plantilla', { state: 'detached', timeout: 20000 });
await p.waitForTimeout(800);
await comprobar('6. «Solo en esta»: la otra sigue con su fichero', [await ficheroDe(p, 'Justificante de cobro'), (await ficheroDe(p, 'Justificante de pago')) !== cobroAntes], [cobroAntes, true]);

/* ---------- 7: salir sin cambios ---------- */
console.log('--- 7. salir sin cambiar nada ---');
await retocar(p, 'Nota de baja médica');
await p.click('#retocar-plantilla .cep-pie button:has-text("Cancelar")');
await p.waitForTimeout(500);
await comprobar('7. sin cambios, Cancelar cierra sin preguntar', [await p.locator('#retocar-plantilla').count(), await p.locator('#capa:not(.oculto)').count()], [0, 0]);
await retocar(p, 'Nota de baja médica');
await cambiarPorTexto(p, 'figura', 'consta');
await p.keyboard.press('Escape');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('7. Escape con cambios también pregunta', p.locator('#cuadro-titulo').textContent(), 'Has cambiado 1 cosa. ¿Salir sin guardar?');
await p.click('#cuadro-aceptar');
await p.waitForTimeout(500);
await comprobar('7. «Salir sin guardar» cierra y no escribe nada', [await p.locator('#retocar-plantilla').count(), await p.evaluate(() => Plantillas.enMemoria().documentos.filter((d) => d.nombre === 'Nota de baja médica')[0].fichero)], [0, 'Nota de baja médica.docx']);

/* ---------- 8: la tarjeta de Ajustes ---------- */
console.log('--- 8. la tarjeta del tipo de asunto ---');
await p.evaluate(async () => {
  const d = document.createElement('div'); d.id = 'prueba-tarjetas'; document.body.appendChild(d);
  await PlantillasDocumento.pintarDeTipo(d, App.E.tipos.filter((t) => t.tipo === 'BAJA MEDICA')[0]);
});
await comprobar('8. la tarjeta de «Aviso de revisión» tiene «Retocar» antes de «Cambiar»', p.evaluate(() => {
  const t = [...document.querySelectorAll('#prueba-tarjetas .tarjeta-tipo')].filter((x) => /Aviso de revisión/.test(x.textContent))[0];
  return [...t.querySelectorAll('.acciones button')].map((b) => b.textContent).slice(0, 2);
}), ['Retocar', 'Cambiar']);
await p.evaluate(() => [...document.querySelectorAll('#prueba-tarjetas .tarjeta-tipo')].filter((x) => /Aviso de revisión/.test(x.textContent))[0].querySelector('.acciones button').click());
await p.waitForSelector('#retocar-plantilla .cep-doc .cep-hoja-interior p', { timeout: 20000 });
await comprobar('8. y abre la misma pantalla', p.locator('.cer-titulo').textContent(), 'Retocar «Aviso de revisión»');
await p.keyboard.press('Escape');
await p.evaluate(() => document.getElementById('prueba-tarjetas').remove());
await p.close();

/* ---------- 9: solo consultar ---------- */
console.log('--- 9. solo consultar ---');
p = await abrir("try { localStorage.setItem('gestor.soloConsulta', '1'); } catch (e) {}");
await p.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
await irALaLista(p);
await p.waitForTimeout(600);
await comprobar('9. «Retocar» apagado', p.evaluate(() => [...document.querySelectorAll('[data-accion="retocar"]')].map((b) => b.disabled)).then((l) => l.length > 0 && l.every(Boolean)), true);
await p.close();

await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de «Retocar» pasan.');
