/* Prueba de la fila 435 (23-oct-2026, docs/DOCUMENTOS-CON-PERSONA-Y-LINEA-DE-DATOS.md, parte A):
   la clase de campo de documento «Persona de las listas». Chromium real con los datos de la copia de pruebas.

   1. Ajustes → Campos del nombre: se puede elegir «Persona de las listas» y marcar las listas; sin ninguna
      marcada no deja guardar («Marca al menos una lista»); se guarda en campos.json con `listas`.
   2. En el cuadro de nombre de un JUSTIFICANTE, escribir parte de un apellido ofrece a la persona (solo de las
      listas marcadas, con su lista al lado) y se elige con un clic.
   3. Al guardar, esa persona queda en «Personas y entidades relacionadas»; el titular del asunto no se repite.
   4. Un nombre que no está en las listas se guarda, sale «escrito a mano» y no se relaciona.
   5. Obligatorio vacío: no deja guardar.
   6. Al abrir el documento de nuevo (Cambiar el nombre) la persona sigue puesta. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const avisos = () => pagina.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const limpiarAvisos = () => pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((e) => e.remove()));
const TIPO = 'JUSTIFICANTE PRUEBA';

/* El tipo de documento y un asunto con su titular (un alumno de la demostración). */
const datos = await pagina.evaluate(async (T) => {
  if (App.E.tiposDocumento.indexOf(T) === -1) { App.E.tiposDocumento.push(T); await App.guardarTiposDocumento(); }
  const alumnos = (await Datos.cargar(App.E.datos, 'ALUMNADO')).lista;
  const a = Gestor.asuntos().filter((x) => x.ficha && x.ficha.categoria === 'ALUMNADO' && x.ficha.tercero)[0];
  window.__asunto = a.nombre;
  const titular = a.ficha.tercero;
  const otro = alumnos.filter((p) => App.textoTercero(p) !== titular && U.normalizar(p.nombre).split(',')[0].length > 4)[0];
  const profe = (await Datos.cargar(App.E.datos, 'PERSONAL')).lista[0];
  return { asunto: a.nombre, titular, otro: otro.nombre, otroTexto: App.textoTercero(otro), apellido: otro.nombre.split(',')[0].trim().slice(0, 6), profe: profe.nombre, profeApellido: profe.nombre.split(',')[0].trim().slice(0, 6) };
}, TIPO);
console.log('   asunto de prueba:', datos.asunto, '· otro alumno:', datos.otro, '· profesor:', datos.profe);

/* ===== 1. Ajustes ===== */
console.log('--- 1. Ajustes: campos del nombre ---');
await pagina.evaluate((T) => { window.__editar = DocCampos.editar(T); }, TIPO);
await pagina.waitForSelector('#doccampos-anadir');
await comprobar('1. el texto dice que se anotan en cada documento', pagina.locator('#cuadro-cuerpo .explica').textContent().then((t) => /Se anotan en cada documento de este tipo y salen debajo de su nombre/.test(t)), true);
await pagina.click('#doccampos-anadir');
await pagina.fill('#doccampos-lista .doccampos-nombre', 'Alumno');
await pagina.selectOption('#doccampos-lista .doccampos-clase', 'persona');
await comprobar('1. la clase «Persona de las listas» está y saca las casillas de las seis listas', pagina.evaluate(() => [
  Array.prototype.map.call(document.querySelectorAll('.doccampos-clase option'), (o) => o.textContent).indexOf('Persona de las listas') !== -1,
  Array.prototype.map.call(document.querySelectorAll('.doccampos-lista-chk + span'), (s) => s.textContent)]),
  [true, ['Alumnado', 'Personal', 'Empresas', 'Otros', 'Tutores legales', 'Administraciones']]);
await pagina.check('#doccampos-lista .doccampos-obligatorio');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('1. sin ninguna lista marcada no guarda: avisa y el cuadro se vuelve a abrir', Promise.all([
  avisos().then((m) => m.some((t) => /Marca al menos una lista/.test(t))),
  pagina.evaluate(() => !!document.querySelector('#doccampos-lista .doccampos-lista-chk') && !document.getElementById('capa').classList.contains('oculto'))]), [true, true]);
await limpiarAvisos();
await pagina.check('#doccampos-lista .doccampos-lista-chk[value="ALUMNADO"]');
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editar);
await comprobar('1. se guarda en campos.json con sus listas', pagina.evaluate((T) => {
  const c = DocCampos.campos(T);
  return c.map((x) => [x.nombre, x.clase, x.listas, x.obligatorio]);
}, TIPO), [['Alumno', 'persona', ['ALUMNADO'], true]]);

/* ===== Abre el cuadro de nombre de un documento que entra ===== */
async function entra(nombreFichero) {
  await pagina.evaluate(([nombre, asunto]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre === asunto)[0];
    window.__abierto = Documentos.abrir(a, { ficheroSoltado: new File(['contenido de prueba'], nombre, { type: 'application/pdf' }) });
  }, [nombreFichero, datos.asunto]);
  await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
  await pagina.waitForTimeout(600);
  await pagina.selectOption('#doc-tipo', TIPO);
  await pagina.waitForSelector('input[data-doc-clase="persona"]');
}
const relacionados = () => pagina.evaluate((n) => ((App.E.registro.asuntos[n] || {}).relacionados || []).map((r) => r.categoria + '|' + r.nombre), datos.asunto);
const valorGuardado = () => pagina.evaluate((n) => {
  const docs = (App.E.registro.asuntos[n] || {}).documentos || {};
  return Object.keys(docs).map((k) => docs[k]).filter((d) => d.tipo === 'JUSTIFICANTE PRUEBA').map((d) => d.valores && Object.keys(d.valores).map((k) => d.valores[k]));
}, datos.asunto);
const antes = await relacionados();

/* ===== 2 y 3. Elegir buscando ===== */
console.log('--- 2 y 3. elegir buscando y relacionar ---');
await entra('justificante uno.pdf');
await pagina.click('input[data-doc-clase="persona"]');
await pagina.fill('input[data-doc-clase="persona"]', datos.apellido);
await pagina.waitForSelector('.csg-lista li[data-i]', { timeout: 10000 });
await comprobar('2. salen personas de Alumnado, con su lista al lado', pagina.evaluate(() => {
  const li = Array.prototype.map.call(document.querySelectorAll('.csg-lista li[data-i]'), (l) => l.textContent);
  return [li.length > 0, li.every((t) => /Alumnado/.test(t))];
}), [true, true]);
await comprobar('2. no sale ningún profesor aunque se busque su apellido (solo busca en las listas marcadas)', (async () => {
  await pagina.fill('input[data-doc-clase="persona"]', datos.profeApellido);
  await pagina.waitForTimeout(400);
  return pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.csg-lista li[data-i]'), (l) => l.textContent).some((t) => /Personal/.test(t)));
})(), false);
await pagina.fill('input[data-doc-clase="persona"]', datos.apellido);
await pagina.waitForSelector('.csg-lista li[data-i]');
await pagina.locator('.csg-lista li[data-i]', { hasText: datos.otro }).first().click();
await comprobar('2. al elegirla, la caja lleva su nombre y no pone «escrito a mano»', pagina.evaluate(() => [
  document.querySelector('input[data-doc-clase="persona"]').value, document.querySelector('.doc-persona-mano').classList.contains('oculto')]), [datos.otro, true]);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('3. la persona elegida queda en las relacionadas del asunto', relacionados().then((r) => r.filter((x) => antes.indexOf(x) === -1)), ['ALUMNADO|' + datos.otroTexto]);
await comprobar('3. en la ficha del documento queda {categoria, nombre, visible}', valorGuardado(), [[{ categoria: 'ALUMNADO', nombre: datos.otroTexto, visible: datos.otro }]]);

/* ===== 6. Volver a abrirlo con «Cambiar el nombre» ===== */
console.log('--- 6. cambiar el nombre: la persona sigue puesta ---');
await pagina.waitForSelector('[data-renombrar]', { timeout: 10000 });
await pagina.locator('.fila-documento', { hasText: 'JUSTIFICANTE PRUEBA' }).first().locator('[data-renombrar]').click();
await pagina.waitForSelector('input[data-doc-clase="persona"]', { timeout: 10000 });
await pagina.waitForTimeout(400);
await comprobar('6. la caja trae a la persona elegida, sin «escrito a mano»', pagina.evaluate(() => [
  document.querySelector('input[data-doc-clase="persona"]').value, document.querySelector('.doc-persona-mano').classList.contains('oculto'),
  DocCampos.leerDe(document.getElementById('doc-campos-tipo'))[Object.keys(DocCampos.leerDe(document.getElementById('doc-campos-tipo')))[0]].categoria]), [datos.otro, true, 'ALUMNADO']);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(300);

/* El titular no se repite. */
await limpiarAvisos();
await entra('justificante dos.pdf');
await pagina.fill('input[data-doc-clase="persona"]', datos.titular.split(',')[0].slice(0, 6));
await pagina.waitForSelector('.csg-lista li[data-i]');
const titularVisible = await pagina.evaluate((t) => Array.prototype.map.call(document.querySelectorAll('.csg-lista li[data-i] span:first-child'), (l) => l.textContent).filter((x) => t.indexOf(x) !== -1)[0], datos.titular);
await pagina.locator('.csg-lista li[data-i]', { hasText: titularVisible }).first().click();
const antes2 = await relacionados();
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('3. el titular del asunto no se añade a las relacionadas', relacionados(), antes2);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(300);

/* ===== 4. A mano ===== */
console.log('--- 4. escrito a mano ---');
await limpiarAvisos();
await entra('justificante tres.pdf');
await pagina.fill('input[data-doc-clase="persona"]', 'Zzyzx Qwerty, Nadie');
await pagina.waitForTimeout(400);
await comprobar('4. sin coincidencias sale «escrito a mano» y el valor queda como tal', pagina.evaluate(() => [
  !document.querySelector('.doc-persona-mano').classList.contains('oculto'),
  Object.values(DocCampos.leerDe(document.getElementById('doc-campos-tipo')))]),
  [true, [{ visible: 'Zzyzx Qwerty, Nadie', manual: true }]]);
const antes3 = await relacionados();
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('4. se guarda y no se relaciona con el asunto', relacionados(), antes3);
await comprobar('4. queda marcado como escrito a mano', valorGuardado().then((v) => v.some((l) => l.some((x) => x && x.manual === true && x.visible === 'Zzyzx Qwerty, Nadie'))), true);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(300);

/* ===== 5. Obligatorio ===== */
console.log('--- 5. obligatorio ---');
await limpiarAvisos();
await entra('justificante cuatro.pdf');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(600);
await comprobar('5. vacío, no se guarda y dice cuál falta', avisos().then((m) => m.some((t) => /Hace falta rellenar "Alumno"/.test(t))), true);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
