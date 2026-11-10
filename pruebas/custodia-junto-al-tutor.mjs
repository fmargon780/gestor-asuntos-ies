/* Prueba de la fila 578 (10-nov-2026, docs/578-CUSTODIA-JUNTO-AL-TUTOR.md): «tiene la custodia» junto al tutor legal.
   Chromium real con la copia de pruebas (?demo=1&auto=1). Datos de la demo: Aguilar Ponce (2100001) con dos tutores y «Custodia» = el primero
   (escrito «Apellidos, Nombre»); Klein Soto, Ana (2100012) con una tutora y «Custodia» = «Abuela materna»; los demás, sin custodia.
   1. Datos.custodiaDe: coincide aunque cambie el orden del nombre; no coincide; vacío; Datos.mismoNombre.
   2. «Datos y contacto» (FichaTerceroAlumno.familia): la marca junto al tutor correcto, «Custodia: …» sin tutor, nada con la columna vacía; la columna no sale suelta.
   3. El correo (Para, al escribir «custodia»): lo de Séneca y, si el asunto la escribe, manda el asunto; los dos tutores se pueden poner.
   4. Documentos: «Tutor con custodia» cae solo con lo de Séneca, respeta lo ya elegido, y la lista pone primero al de Séneca. */
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.CorreoPara && window.Datos && Datos.custodiaDe, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);

const alumno = (nie) => pagina.evaluateHandle(async (n) => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  return f.lista.filter((x) => x.id === n)[0];
}, nie);

console.log('--- 1. Datos.custodiaDe ---');
await comprobar('1. Aguilar: coincide con el primer tutor aunque la columna ponga «Apellidos, Nombre»', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100001')[0];
  const c = Datos.custodiaDe(p); return [Datos.tutoresDe(p).map((t) => t.nombre), c.texto, c.numeros, c.sinTutor];
}), [['Rocío Ponce Duarte', 'Joaquín Aguilar Reyes'], 'Ponce Duarte, Rocío', [1], '']);
await comprobar('1. Klein: «Abuela materna» no coincide con ningún tutor', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100012')[0];
  const c = Datos.custodiaDe(p); return [c.numeros, c.sinTutor];
}), [[], 'Abuela materna']);
await comprobar('1. Fuentes: sin texto en «Custodia», nada', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100007')[0];
  const c = Datos.custodiaDe(p); return [c.texto, c.numeros, c.sinTutor];
}), ['', [], '']);
await comprobar('1. mismoNombre: cualquier orden, no con otra persona', pagina.evaluate(() => [
  Datos.mismoNombre('Ponce Duarte, Rocío', 'Rocío Ponce Duarte'), Datos.mismoNombre('Rocío Ponce Duarte', 'Joaquín Aguilar Reyes'), Datos.mismoNombre('', 'Rocío')]), [true, false, false]);

console.log('--- 2. Datos y contacto ---');
const tarjetas = (nie) => pagina.evaluate(async (n) => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === n)[0];
  const nodo = FichaTerceroAlumno.familia(p, null, null) || null;
  const caja = (nodo && nodo.nodo) || document.createElement('div');
  return { tutores: [...caja.querySelectorAll('.vt-tarjeta-tutor')].map((t) => [t.querySelector('.vt-tutor-nombre').textContent, !!t.querySelector('.vt-custodia')]),
           sola: [...caja.querySelectorAll('.vt-tarjeta-custodia')].map((t) => t.textContent) };
}, nie);
await comprobar('2. Aguilar: «tiene la custodia» solo junto al primer tutor', (await tarjetas('2100001')), { tutores: [['Rocío Ponce Duarte', true], ['Joaquín Aguilar Reyes', false]], sola: [] });
await comprobar('2. Klein: «Custodia: Abuela materna» junto a los tutores, y la tutora sin marca', (await tarjetas('2100012')), { tutores: [['Elena Soto Mora', false]], sola: ['Custodia: Abuela materna'] });
await comprobar('2. Fuentes: sin tutores ni marca', (await tarjetas('2100007')), { tutores: [], sola: [] });
await comprobar('2. «Custodia» no sale suelta en «Otros datos» de la ficha completa', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100001')[0];
  const r = FichaPersonaReparto.alumno(p); return Object.keys(r).some((k) => r[k].filas.some((x) => /^custodia$/i.test(x.titulo)));
}), false);

console.log('--- 3. el correo ---');
async function abrir(frag) {
  await pagina.evaluate((frag) => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0]; window.__asunto = a; window.__cuadro = CorreoNucleo.abrirCuadro(a, false, { plantilla: '' }); }, frag);
  await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
  await pagina.waitForTimeout(800);
}
async function cerrar() {
  if (await pagina.locator('#capa:not(.oculto)').count()) await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
  await pagina.waitForTimeout(300);
}
const lista = (campo) => pagina.evaluate((c) => [...document.querySelectorAll('#correo-' + c + ' .cdest-opcion')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()), campo);
async function escribir(campo, texto) { await pagina.fill('#correo-' + campo + '-escribir', texto); await pagina.waitForTimeout(200); }
const marcas = () => pagina.evaluate(() => CorreoPara.candidatos().filter((c) => c.papel === 'legales' && /^legal\d/.test(c.id)).map((c) => [c.nombre, !!c.custodia, c.custodiaSin || '']));
await abrir('Aguilar Ponce, Marina');
await comprobar('3. Aguilar: la custodia es del primer tutor, el segundo no la lleva', marcas(), [['Rocío Ponce Duarte', true, ''], ['Joaquín Aguilar Reyes', false, '']]);
await escribir('copia', 'custodia');
await comprobar('3. «custodia» saca solo al que la tiene, con su marca', (await lista('copia')).map((t) => /Rocío Ponce Duarte/.test(t) && /tiene la custodia/.test(t)), [true]);
await escribir('copia', 'tutor legal');
await comprobar('3. «tutor legal» saca a los dos: la custodia no quita a ninguno', (await lista('copia')).filter((t) => /Ponce Duarte|Aguilar Reyes/.test(t)).length, 2);
await pagina.evaluate(() => { CorreoPara.vaciar(); CorreoPara.ponerElegido('para', 'legal1'); CorreoPara.ponerElegido('copia', 'legal2'); CorreoPara.repintar(); });
await comprobar('3. se pueden poner los dos tutores, uno en Para y otro en Copia', pagina.evaluate(() => ['para', 'copia'].map((c) => [...document.querySelectorAll('#correo-' + c + ' .cdest-pastilla')].length)), [1, 1]);
await cerrar();
await abrir('Aguilar Ponce, Pablo');
await pagina.evaluate(async () => { /* el asunto escribe otra custodia: manda el asunto */
  const a = window.__asunto; a.ficha = a.ficha || {}; a.ficha.campos = a.ficha.campos || {};
  const c = DatosDelAsunto.camposDelAsunto(a).filter((x) => DatosDelAsunto.esTutorConCustodia(x.nombre))[0];
  if (c) a.ficha.campos[c.clave] = { valor: 'Joaquín Aguilar Reyes' };
  window.__hayCampo = !!c;
});
if (await pagina.evaluate(() => window.__hayCampo)) {
  await cerrar(); await abrir('Aguilar Ponce, Pablo');
  await comprobar('3. si el asunto escribe quién tiene la custodia, manda el asunto', marcas(), [['Rocío Ponce Duarte', false, ''], ['Joaquín Aguilar Reyes', true, '']]);
} else console.log('aviso  3. el tipo de asunto de Pablo no tiene el campo «Tutor con custodia»: no se prueba que mande el asunto');
await cerrar();
await abrir('Aguilar Ponce, Marina');
await cerrar();

console.log('--- 4. documentos ---');
await comprobar('4. «Tutor con custodia» cae solo con lo de Séneca (aunque el nombre vaya «Apellidos, Nombre»)', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100001')[0];
  const v = { tutor1: 'Ponce Duarte, Rocío', tutor2: 'Aguilar Reyes, Joaquín', campos: {} };
  DatosDelAsunto.completar(v, p); return v.campos[DatosDelAsunto.TUTOR_CON_CUSTODIA];
}), 'Ponce Duarte, Rocío');
await comprobar('4. lo ya elegido a mano en el asunto se respeta', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100001')[0];
  const v = { tutor1: 'Ponce Duarte, Rocío', tutor2: 'Aguilar Reyes, Joaquín', campos: { 'Tutor con custodia': 'Aguilar Reyes, Joaquín' } };
  DatosDelAsunto.completar(v, p); return v.campos['Tutor con custodia'];
}), 'Aguilar Reyes, Joaquín');
await comprobar('4. Séneca sin decirlo, con dos tutores: no cae solo (se elige como hoy); con uno, cae solo', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100007')[0];
  const dos = { tutor1: 'A, A', tutor2: 'B, B', campos: {} }; DatosDelAsunto.completar(dos, p);
  const uno = { tutor1: 'A, A', tutor2: '', campos: {} }; DatosDelAsunto.completar(uno, p);
  return [dos.campos['Tutor con custodia'] || '', uno.campos['Tutor con custodia']];
}), ['', 'A, A']);
await comprobar('4. la lista para elegir pone primero al de Séneca', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO'); const p = f.lista.filter((x) => x.id === '2100001')[0];
  const p2 = { campos: Object.assign({}, p.campos, { Custodia: 'Aguilar Reyes, Joaquín' }) };   /* la custodia es del segundo tutor */
  const v = { tutor1: 'Ponce Duarte, Rocío', tutor2: 'Aguilar Reyes, Joaquín', campos: {} };
  DatosDelAsunto.completar(v, p2);
  return DatosDelAsunto.infoDe('Tutor con custodia', Gestor.asuntos()[0], v).valores;
}), ['Aguilar Reyes, Joaquín', 'Ponce Duarte, Rocío']);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
