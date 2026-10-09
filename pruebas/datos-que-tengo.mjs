/* Fila 319 (docs/LO-QUE-TENGO-AHORA.md): el recuadro «Lo que tengo ahora» de Herramientas → «Traer el alumnado»:
   de cuándo es cada fichero de alumnado y de personal, cuántos trae, por dónde llegó y si hay otro más nuevo.
   Con Chromium real y la copia de pruebas (`masnuevo=`). */
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

async function abrir(parametros, antes, ancho) {
  const pagina = await navegador.newPage({ viewport: { width: ancho || 1280, height: 900 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(BASE + '?demo=1&auto=1' + (parametros || ''));
  await pagina.waitForSelector('#franja-demo', { timeout: 30000 });
  return pagina;
}
/* Abre Herramientas → «Traer el alumnado» y espera a que la tabla termine de mirar. */
async function verTabla(p) {
  await p.evaluate(() => { App.ir('herramientas'); document.getElementById('bloque-traer-alumnado').open = true; });
  await p.waitForSelector('.dqt-tabla', { timeout: 20000 });
  await p.waitForFunction(() => !document.querySelector('.dqt-tabla').textContent.includes('Mirando'), null, { timeout: 20000 });
}
const filas = (p) => p.evaluate(() => [...document.querySelectorAll('.dqt-tabla tbody tr[data-fila]')].map((r) => ({
  id: r.dataset.fila, texto: [...r.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim()), boton: !![...r.querySelectorAll('button')].length })));
const fila = async (p, id) => (await filas(p)).filter((f) => f.id === id)[0];
const CON_HORA = /\d{1,2}-[a-z]{3}-\d{4} · \d{2}:\d{2}/;

/* ---------- 1 ---------- */
console.log('--- 1. al entrar ---');
let p = await abrir('');
await p.waitForTimeout(3000);
await verTabla(p);
await comprobar('1. título y cinco columnas', p.evaluate(() => [document.querySelector('.dqt-titulo').textContent, [...document.querySelectorAll('.dqt-tabla th')].map((t) => t.textContent)]),
  ['Lo que tengo ahora', ['Qué', 'Fecha del fichero', 'Cuántos', 'Por dónde llegó', '¿Hay otro más nuevo?']]);
const f0 = await filas(p);
await comprobar('1. fila de alumnado de Séneca y al menos una de personal', [f0[0].id, f0.some((f) => /^personal/.test(f.id))], ['alumnado', true]);
await comprobar('1. con día y hora, y «No se sabe por dónde llegó.»', f0.filter((f) => f.id !== 'alumnado-bd').every((f) => CON_HORA.test(f.texto[1]) && /No se sabe por dónde llegó\./.test(f.texto[3])), true);
await comprobar('1. y la última columna: ninguna carpeta señalada', f0.filter((f) => f.id !== 'alumnado-bd').every((f) => /No hay ninguna carpeta señalada en este ordenador/.test(f.texto[4])), true);
await comprobar('1. se lee cómo actualizar y que solo se compara con las carpetas señaladas', p.locator('.dqt-notas').textContent().then((t) => [/«Traer ficheros de Séneca»/.test(t), /ninguna carpeta concreta/.test(t), /Solo puedo comparar con las carpetas señaladas en este ordenador/.test(t)]), [true, true, true]);
await comprobar('1. sin línea gris de «Datos del Centro de datos» ni «Última copia» en esta pantalla', p.evaluate(() => { const c = document.getElementById('bloque-traer-alumnado'); return [c.querySelectorAll('.centro-lineas').length, c.textContent.indexOf('Última copia')]; }), [0, -1]);
await comprobar('1. el pie del título, con el bloque cerrado, dice las fechas', (async () => { await p.evaluate(() => { document.getElementById('bloque-traer-alumnado').open = false; }); await p.evaluate(() => DatosQueTengoVer.repintar()); await p.waitForTimeout(100); return p.evaluate(() => /^Alumnado del .* · personal del /.test(document.querySelector('#bloque-traer-alumnado .bloque-pie').textContent)); })(), true);
await p.evaluate(() => { document.getElementById('bloque-traer-alumnado').open = true; });
await comprobar('1. ningún texto cortado con «…» (1280)', p.evaluate(() => [document.querySelector('.dqt-tabla').textContent.includes('…'), document.querySelector('.dqt-tabla').scrollWidth > document.querySelector('.dqt-caja').clientWidth + 1]), [false, false]);
await p.setViewportSize({ width: 1000, height: 900 });
await p.waitForTimeout(300);
await comprobar('1. ni a 1000 de ancho', p.evaluate(() => [document.querySelector('.dqt-tabla').textContent.includes('…'), document.querySelector('.dqt-tabla').scrollWidth > document.querySelector('.dqt-caja').clientWidth + 1]), [false, false]);
await p.setViewportSize({ width: 1280, height: 900 });

/* ---------- 2: a mano ---------- */
console.log('--- 2. traído a mano ---');
const hace3 = Date.now() - 3 * 86400000;
await p.evaluate(async (t) => {
  const texto = await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv');
  window.showOpenFilePicker = async () => [{ kind: 'file', name: 'RegAlum (3).csv', getFile: async () => new File([texto], 'RegAlum (3).csv', { lastModified: t }) }];
}, hace3);
await p.click('#btn-traer-datos');
await p.waitForFunction(() => /Alumnado de Séneca.*A mano/.test(document.querySelector('.dqt-tabla').textContent), null, { timeout: 20000 });
const esperadaHora = await p.evaluate((t) => DatosQueTengo.fechaHora(t), hace3);
const a = await fila(p, 'alumnado');
await comprobar('2. la fila dice la fecha y hora del fichero elegido', a.texto[1], esperadaHora);
await comprobar('2. «A mano. Lo trajo Revisor…»', /^A mano\. Lo trajo Revisor el /.test(a.texto[3]), true);
await comprobar('2. el apunte está en _GESTOR/datos-origen.json', p.evaluate(async () => { const d = await Carpetas.leerJson(App.E.gestor, 'datos-origen.json'); const x = d.ficheros['RegAlum.csv']; return [d._esquema, x.via, x.nombreOriginal, x.traidoPor]; }), [1, 'a-mano', 'RegAlum (3).csv', 'Revisor']);

/* ---------- 3: el Centro de datos ---------- */
console.log('--- 3. señalar el Centro de datos ---');
await p.evaluate(() => CentroDeDatos.senalarCarpeta());
await p.waitForFunction(() => /Del Centro de datos/.test((document.querySelector('.dqt-tabla [data-fila="alumnado"]') || {}).textContent || ''), null, { timeout: 30000 });
await p.waitForFunction(() => !document.querySelector('.dqt-tabla').textContent.includes('Mirando'), null, { timeout: 20000 });
let fs = await filas(p);
await comprobar('3. alumnado y personal: «Del Centro de datos. Lo subió …»', fs.filter((f) => f.id !== 'alumnado-bd').every((f) => /^Del Centro de datos\. Lo subió direccion\.$/.test(f.texto[3])), true);
await comprobar('3. y la base de datos también', /^Del Centro de datos\./.test(fs.filter((f) => f.id === 'alumnado-bd')[0].texto[3]), true);
await comprobar('3. la última columna, en verde, dice que no hay otro más nuevo', p.evaluate(() => [...document.querySelectorAll('.dqt-tabla tbody tr[data-fila]')].every((r) => /No\. Mirado en: Centro de datos\./.test(r.lastElementChild.textContent) && !!r.lastElementChild.querySelector('.dqt-verde'))), true);
await comprobar('3. la fecha es la `subido` de su entrada del índice', p.evaluate(async () => { const r = await CentroDeDatos.leerIndice(await CentroDeDatos.carpeta()); const e = r.indice.listados.filter((x) => x.clave === 'alumnado')[0]; const f = (await DatosQueTengo.estado()).filter((x) => x.id === 'alumnado')[0]; return new Date(f.fecha).getTime() === new Date(e.subido).getTime(); }), true);

/* ---------- 5: cambiado por fuera ---------- */
console.log('--- 5. cambiado por otro camino ---');
await p.waitForTimeout(2500);
await p.evaluate(async () => { const t = await Carpetas.leerTexto(App.E.datos, 'RegAlum.csv'); await Carpetas.escribirTexto(App.E.datos, 'RegAlum.csv', t + '\r\n'); DatosQueTengo.olvidarMirada(); await DatosQueTengoVer.repintar(true); });
await p.waitForFunction(() => /No se sabe por dónde llegó/.test((document.querySelector('.dqt-tabla [data-fila="alumnado"]') || {}).textContent || ''), null, { timeout: 20000 });
const a5 = await fila(p, 'alumnado');
await comprobar('5. vuelve a «No se sabe por dónde llegó.» y «En el gestor desde …»', [/No se sabe por dónde llegó\./.test(a5.texto[3]), /^En el gestor desde el /.test(a5.texto[1])], [true, true]);

/* ---------- 6 y 7: la carpeta de la base de datos ---------- */
console.log('--- 6 y 7. carpeta de la base de datos ---');
await p.evaluate(async () => {
  const dir = Demo.carpetaDeMentira('BD');
  const base = { acuerdo: 2, origen: 'x', cursoAcademico: '', campos: [{ clave: 'pil', etiqueta: 'PIL', apartado: 'A', tipo: 'si-no' }], alumnos: [{ idEscolar: '2100099', matriculado: true, datos: { pil: true } }] };
  window.__bd = { dir, base };
  await Carpetas.guardarJson(dir, 'ALUMNADO-BD.json', Object.assign({}, base, { generado: new Date(Date.now() + 5 * 86400000).toISOString() }));
  await Almacen.guardar('alumnado-bd-carpeta', dir);
  DatosQueTengo.olvidarMirada();
  await DatosQueTengoVer.repintar(true);
});
await p.waitForFunction(() => /carpeta de la base de datos de alumnado hay uno/.test(document.querySelector('.dqt-tabla [data-fila="alumnado-bd"]').textContent), null, { timeout: 20000 });
await comprobar('6. la carpeta de la base de datos anuncia uno más nuevo, con «Traerlo»', p.evaluate(() => !!document.querySelector('[data-fila="alumnado-bd"] [data-traer]')), true);
await p.click('[data-fila="alumnado-bd"] [data-traer]');
await p.waitForFunction(() => /^De la carpeta de la base de datos de alumnado\./.test(document.querySelector('.dqt-tabla [data-fila="alumnado-bd"]').children[3].textContent), null, { timeout: 20000 });
await comprobar('6. traído de su carpeta: «De la carpeta de la base de datos de alumnado.»', (await fila(p, 'alumnado-bd')).texto[3], 'De la carpeta de la base de datos de alumnado.');
await p.evaluate(async () => {
  await Carpetas.guardarJson(window.__bd.dir, 'ALUMNADO-BD.json', { acuerdo: 99, generado: new Date(Date.now() + 9 * 86400000).toISOString(), campos: [], alumnos: [] });
  DatosQueTengo.olvidarMirada();
  await DatosQueTengoVer.repintar(true);
});
await p.waitForFunction(() => /Sí, pero no vale/.test(document.querySelector('.dqt-tabla [data-fila="alumnado-bd"]').textContent), null, { timeout: 20000 });
await comprobar('7. un archivo más nuevo que no vale: «Sí, pero no vale: …» y sin botón', p.evaluate(() => [/acuerdo 99/.test(document.querySelector('[data-fila="alumnado-bd"]').textContent), document.querySelectorAll('[data-fila="alumnado-bd"] button').length]), [true, 0]);

/* ---------- 9 y 10: Ajustes ---------- */
console.log('--- 9 y 10. Ajustes ---');
await p.evaluate(async () => { await Carpetas.guardarJson(window.__bd.dir, 'ALUMNADO-BD.json', Object.assign({}, window.__bd.base, { generado: new Date(Date.now() + 5 * 86400000).toISOString() })); App.ir('ajustes'); App.cambiarPestanaAjustes('centro'); document.getElementById('bloque-alumnado-bd').open = true; await AlumnadoBD.pintarAjustes(); });
await comprobar('9. el bloque no nombra «Datos de matrícula», enseña la línea nueva y el enlace', p.evaluate(() => { const t = document.getElementById('bloque-alumnado-bd').textContent; return [t.includes('Datos de matrícula'), /Lo que tengo ahora: .* alumno.* y .* dato.*, del .* · \d{2}:\d{2}\. Llegó de la carpeta de la base de datos de alumnado\./.test(t), t.includes('Ver todo lo que tengo')]; }), [false, true, true]);
await p.evaluate(() => { document.getElementById('bloque-traer-alumnado').open = false; });
await p.evaluate(() => document.getElementById('alumnado-enlace-lo-que-tengo').click());
await p.waitForFunction(() => document.getElementById('bloque-traer-alumnado').open && !document.getElementById('pantalla-herramientas').classList.contains('oculto'), null, { timeout: 10000 });
await comprobar('9. el enlace lleva a Herramientas con «Traer el alumnado» abierto', p.evaluate(() => !!document.getElementById('bloque-traer-alumnado').offsetParent), true);
await comprobar('10. una carpeta sin ALUMNADO-BD.json: aviso ámbar', p.evaluate(async () => {
  await Almacen.guardar('alumnado-bd-carpeta', Demo.carpetaDeMentira('VACIA'));
  App.irASeccionDeAjustes(document.getElementById('bloque-alumnado-bd'));
  await new Promise((r) => setTimeout(r, 900));
  await AlumnadoBD.pintarAjustes();
  const av = document.getElementById('alumnado-bd-aviso');
  return [av.textContent, av.classList.contains('oculto')];
}), ['En esta carpeta no está ALUMNADO-BD.json. Señala la que lo tiene.', false]);

/* ---------- 11: dos ordenadores ---------- */
console.log('--- 11. dos apuntes del mismo fichero ---');
await comprobar('11. gana el de `traidoEl` más reciente', p.evaluate(() => {
  const viejo = { via: 'a-mano', traidoEl: '2026-10-01T10:00:00.000Z' }, nuevo = { via: 'centro-de-datos', traidoEl: '2026-10-02T10:00:00.000Z' };
  return [DatosQueTengo._elegirApunte(viejo, nuevo).via, DatosQueTengo._elegirApunte(nuevo, viejo).via];
}), ['centro-de-datos', 'centro-de-datos']);
await p.close();

/* ---------- 4: masnuevo ---------- */
console.log('--- 4. masnuevo=alumnado,personal ---');
p = await abrir('&masnuevo=alumnado,personal');
await p.waitForFunction(() => window.Demo && Demo.masNuevoListo, null, { timeout: 60000 });
await verTabla(p);
fs = await filas(p);
const nuevos = fs.filter((f) => f.id === 'alumnado' || f.clave === 'personal' || /^personal/.test(f.id));
await comprobar('4. alumnado y personal en ámbar con «Traerlo»', nuevos.every((f) => /^Sí: en el Centro de datos hay uno del .* · \d{2}:\d{2}\./.test(f.texto[4]) && /Traerlo/.test(f.texto[4])), true);
await comprobar('4. y la base de datos, no', /^No\./.test((await fila(p, 'alumnado-bd')).texto[4]), true);
const anuncio = (await fila(p, 'alumnado')).texto[4].match(/hay uno del (.*?)\./)[1];
await comprobar('4. el pie lo dice sin abrir el bloque', (async () => { await p.evaluate(() => { document.getElementById('bloque-traer-alumnado').open = false; }); await p.evaluate(() => DatosQueTengoVer.repintar()); return p.evaluate(() => document.querySelector('#bloque-traer-alumnado .bloque-pie').textContent.includes('hay algo más nuevo')); })(), true).catch(() => {});
await p.evaluate(() => { document.getElementById('bloque-traer-alumnado').open = true; });
await p.waitForSelector('[data-fila="alumnado"] [data-traer]');
await p.click('[data-fila="alumnado"] [data-traer]');
await p.waitForFunction(() => /No\. Mirado en/.test(document.querySelector('[data-fila="alumnado"]').lastElementChild.textContent), null, { timeout: 30000 });
await comprobar('4. «Traerlo»: la fila pasa a verde y su fecha es la anunciada', (await fila(p, 'alumnado')).texto[1], anuncio);
await p.close();

/* ---------- 8: solo consultar ---------- */
console.log('--- 8. solo consultar ---');
p = await abrir('&masnuevo=alumnado', "try { localStorage.setItem('gestor.soloConsulta', '1'); } catch (e) {}");
await p.waitForSelector('#franja-solo-consulta', { timeout: 30000 });
await p.waitForFunction(() => window.Demo && Demo.masNuevoListo, null, { timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
const antes = await p.evaluate(() => Demo.escrituras());
await verTabla(p);
await comprobar('8. la tabla se ve y no hay botón encendido', p.evaluate(() => [document.querySelectorAll('.dqt-tabla tbody tr[data-fila]').length > 0, [...document.querySelectorAll('.dqt-tabla button[data-traer], .dqt-tabla button[data-dar-permiso]')].every((b) => b.disabled)]), [true, true]);
await comprobar('8. no se apunta ni se escribe nada', p.evaluate(() => Demo.escrituras()), antes);
await p.close();

console.log('--- sin errores ---');
await comprobar('sin errores de consola', errores.filter((e) => !/Failed to load resource|ERR_|masnuevo/.test(e)), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de «Lo que tengo ahora» pasan.');
