/* Prueba de la fila 348 (15-oct-2026, docs/CORREO-AL-TUTOR-DEL-GRUPO.md): el tutor o tutora del grupo en el cuadro de Correo.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1): SANCION de Jimenez Rubio (4º A, tutora con correo), Fuentes
   Calvo (1º Bach A, tutora sin correo), Delgado Prieto (2º B, dos tutores) y Klein Soto (1º C, sin tutor); la actividad «Visita
   Granada» (asunto de grupo con 2º B y 3º A); una BAJA MEDICA (personal).

   1. «+ Tutor/a de <unidad>» junto a «Para» y a «Copia oculta»: añade el correo a su campo, sin repetir al pulsar otra vez.
   2. Sin correo en la ficha del tutor: botón apagado y aviso ámbar «Falta el correo del tutor/a de …»; sin tutor, igual.
   3. Dos tutores: se añaden los dos. Un tercero que no es alumnado: no sale el botón.
   4. Asunto de grupo con dos unidades: «+ Tutores (2 grupos)», añade los que hay y avisa de la unidad que falta.
   5. «Va a:» de la plantilla: con «El tutor o tutora», «Para» lleva solo a los tutores y el saludo es «Buenas:»; con «La familia», solo la familia.
   6. La revisión: el botón «A quién va cada plantilla», su cuadro con un desplegable por plantilla (se guarda al cambiar), y la pasada
      única de la entrada (una vez, con su marca en _GESTOR) .
   7. Las piezas puras: el saludo, y el «Va a» que le toca a cada plantilla. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 560 } });   /* ventana baja: los avisos ámbar siguen a la vista */
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.InformarAlTutor, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

const MARTA = 'motero@correo-demo.es', FERNANDO = 'freyes@correo-demo.es', PATRICIA = 'puceda@correo-demo.es';

async function abrir(frag) {
  await pagina.evaluate((frag) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__cuadro = CorreoNucleo.abrirCuadro(a, false, {});
  }, frag);
  await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
  await pagina.waitForTimeout(800);
}
async function cerrar() {
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
  await pagina.waitForTimeout(300);
}
const botones = () => pagina.evaluate(() => [...document.querySelectorAll('#correo-formulario .correo-tutor-anadir')].map((b) => [b.dataset.zona, b.textContent, b.disabled]));
const faltas = () => pagina.evaluate(() => [...document.querySelectorAll('#correo-formulario .correo-tutor-falta')].map((p) => p.textContent.replace(/ · .*$/, '')));
const para = () => pagina.evaluate(() => ({
  marcadas: [...document.querySelectorAll('#correo-formulario .correo-marca')].filter((c) => c.checked).map((c) => c.value),
  otro: document.getElementById('correo-otro').value, saludo: document.getElementById('correo-cuerpo-texto').value.split('\n')[0],
  cco: [...document.querySelectorAll('#correo-formulario .marcado-chip')].map((c) => c.textContent.replace('×', '').trim())
}));

/* ===== 1. El botón en «Para» y «Copia oculta» ===== */
console.log('--- 1. el botón ---');
await abrir('SANCION Jimenez Rubio');
await comprobar('1. «+ Tutor/a de 4º A» junto a «Para» y a «Copia oculta»', botones(), [['para', '+ Tutor/a de 4º A', false], ['cco', '+ Tutor/a de 4º A', false]]);
await pagina.click('.correo-tutor-anadir[data-zona="para"]');
const p1 = await para();
await comprobar('1. «Para»: el correo de la tutora entra en «Otro correo»', p1.otro.split(/,\s*/).filter((x) => x === MARTA).length, 1);
await pagina.click('.correo-tutor-anadir[data-zona="para"]');
await comprobar('1. y pulsarlo otra vez no lo repite', (await para()).otro.split(/,\s*/).filter((x) => x === MARTA).length, 1);
await pagina.click('.correo-tutor-anadir[data-zona="cco"]');
await comprobar('1. «Copia oculta»: queda su dirección, solo en ese campo', (await para()).cco, [MARTA]);
await pagina.click('.correo-tutor-anadir[data-zona="cco"]');
await comprobar('1. y tampoco se repite', (await para()).cco, [MARTA]);
await comprobar('1. no sale ningún aviso (hay correo)', faltas(), []);
await cerrar();

/* ===== 2. Sin correo ===== */
console.log('--- 2. sin correo ---');
await abrir('SANCION Fuentes Calvo');
await comprobar('2. tutora sin correo: botón apagado y aviso ámbar', Promise.all([botones(), faltas()]),
  [[['para', '+ Tutor/a de 1º Bach A', true], ['cco', '+ Tutor/a de 1º Bach A', true]], ['Falta el correo del tutor/a de 1º Bach A']]);
await comprobar('2. el aviso lleva su enlace a las tablas de datos', pagina.locator('.correo-tutor-completar').count(), 1);
await cerrar();
await abrir('SANCION Klein Soto');
await comprobar('2. unidad sin tutor: botón apagado y aviso', Promise.all([botones().then((b) => b[0][2]), faltas()]), [true, ['Falta el correo del tutor/a de 1º C']]);
await cerrar();

/* ===== 3. Dos tutores, y quien no es alumnado ===== */
console.log('--- 3. dos tutores y no alumnado ---');
await abrir('SANCION Delgado Prieto');
await pagina.click('.correo-tutor-anadir[data-zona="para"]');
await comprobar('3. los dos tutores de 2º B entran en «Para»', (await para()).otro.split(/,\s*/).filter((x) => x === FERNANDO || x === PATRICIA).sort(), [FERNANDO, PATRICIA]);
await cerrar();
await abrir('BAJA MEDICA Otero Campos');
await comprobar('3. un asunto de personal: no sale el botón', botones(), []);
await cerrar();

/* ===== 4. Asunto de grupo ===== */
console.log('--- 4. asunto de grupo ---');
await abrir('GRUPO Visita Granada');
await comprobar('4. un solo botón por campo: «+ Tutores (2 grupos)»', botones(), [['para', '+ Tutores (2 grupos)', false], ['cco', '+ Tutores (2 grupos)', false]]);
await comprobar('4. y el aviso de la unidad a la que le falta el correo', faltas(), ['Falta el correo del tutor/a de 3º A']);
await pagina.click('.correo-tutor-anadir[data-zona="cco"]');
await comprobar('4. añade los correos que hay', (await para()).cco.sort(), [FERNANDO, PATRICIA]);
await cerrar();

/* ===== 5. «Va a:» ===== */
console.log('--- 5. «Va a:» ---');
const idSancion = await pagina.evaluate(async () => {
  const d = await Plantillas.cargar(App.E.gestor);
  return d.lista.filter((p) => /tutor/i.test(p.nombre) && p.tipo === 'SANCION').map((p) => [p.id, p.nombre, p.vaA || null]);
});
await comprobar('5. antes de la revisión, la plantilla de la sanción no dice a quién va', idSancion.map((x) => x[2]), [null]);
const tocadas = await pagina.evaluate(async () => (await PlantillaVaARevision.aplicar()).length);
await comprobar('5. la revisión pone «Va a» a todas las plantillas de correo', pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.every((p) => PlantillaVaA.valido(p.vaA))), true);
await comprobar('5. y la de «Informar al tutor/a de la sanción» queda en «tutor»', pagina.evaluate(async (id) => (await Plantillas.cargar(App.E.gestor)).lista.filter((p) => p.id === id)[0].vaA, idSancion[0][0]), 'tutor');
await abrir('SANCION Jimenez Rubio');
const p5 = await para();
await comprobar('5. «Para» lleva solo a la tutora (nada de la familia) y el saludo es «Buenas:»', [p5.marcadas, p5.otro, p5.saludo], [[], MARTA, 'Buenas:']);
await cerrar();
await pagina.evaluate(async (id) => { await Plantillas.guardar(App.E.gestor, (a) => { a.lista.filter((p) => p.id === id)[0].vaA = 'familia'; return a; }); }, idSancion[0][0]);
await abrir('SANCION Jimenez Rubio');
const p5b = await para();
await comprobar('5. con «La familia», «Para» lleva solo a la familia', [p5b.marcadas.length > 0, p5b.otro, p5b.saludo.indexOf('Buenas') === 0], [true, '', false]);
await cerrar();

/* ===== 6. La revisión ===== */
console.log('--- 6. la revisión ---');
await pagina.evaluate(() => { PlantillasPantalla.abrir({ pestana: 'correo' }); });
await pagina.waitForSelector('#pt-va-a', { timeout: 15000 });
await pagina.click('#pt-va-a');
await pagina.waitForSelector('#capa:not(.oculto) .va-a-select', { timeout: 15000 });
await comprobar('6. el cuadro enseña cada plantilla con su desplegable', pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.querySelectorAll('#va-a-lista tbody tr').length > 0,
  [...document.querySelector('.va-a-select').options].map((o) => o.textContent)]), ['A quién va cada plantilla de correo', true, ['La familia', 'El tutor o tutora del grupo', 'Quien lo pide']]);
const primera = await pagina.evaluate(() => document.querySelector('#va-a-lista tbody tr').getAttribute('data-id'));
await pagina.selectOption('#va-a-lista tbody tr:first-child .va-a-select', 'quien-lo-pide');
await pagina.waitForTimeout(1500);
await comprobar('6. cambiarlo ahí mismo lo guarda', pagina.evaluate(async (id) => (await Plantillas.cargar(App.E.gestor)).lista.filter((p) => p.id === id)[0].vaA, primera), 'quien-lo-pide');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
await pagina.evaluate(() => PlantillasPantalla.cerrar && PlantillasPantalla.cerrar());

console.log('--- 6b. la pasada única ---');
await pagina.evaluate(async () => { await Carpetas.guardarJson(App.E.gestor, PlantillaVaARevision.FICHERO, {}); });
await comprobar('6b. sin marca', pagina.evaluate(async () => !(await PlantillaVaARevision.leerMarca()).revisada), true);
await pagina.evaluate(() => { window.__pasada = PlantillaVaARevision.pasada(false); });
await pagina.waitForSelector('#capa:not(.oculto) .va-a-select', { timeout: 15000 });
await pagina.click('#cuadro-aceptar');
await comprobar('6b. la primera vez enseña la lista y deja su marca en _GESTOR', Promise.all([pagina.evaluate(() => window.__pasada), pagina.evaluate(async () => !!(await PlantillaVaARevision.leerMarca()).revisada)]), [true, true]);
await comprobar('6b. la segunda vez no sale', pagina.evaluate(() => PlantillaVaARevision.pasada(false)), false);

/* ===== 7. Lo puro ===== */
console.log('--- 7. lo puro ---');
await comprobar('7. el saludo: se quita y se sustituye por «Buenas:»', pagina.evaluate(() => [
  PlantillaVaA.sinSaludo('Estimados tutores legales de Ana:\n\nLe informamos.'), PlantillaVaA.sinSaludo('Le informamos.'),
  PlantillaVaA.conSaludoBuenas('Estimada familia, le informamos.'), PlantillaVaA.conSaludoBuenas('Hola: te escribo'), PlantillaVaA.conSaludoBuenas('Sin saludo')]),
  ['Le informamos.', 'Le informamos.', 'Buenas: le informamos.', 'Buenas: te escribo', 'Sin saludo']);
await comprobar('7. el «Va a» que le toca a cada plantilla', pagina.evaluate(() => [
  PlantillaVaA.deducir({ nombre: 'Informar al tutor/a de la sanción', tipo: 'SANCION' }), PlantillaVaA.deducir({ nombre: 'Aviso al tutor del grupo', tipo: 'X' }),
  PlantillaVaA.deducir({ nombre: 'Informar a los tutores legales', tipo: 'X' }), PlantillaVaA.deducir({ nombre: 'Aviso de avance' }), PlantillaVaA.deducir({ nombre: 'Matrícula', tipo: 'MATRICULA' })]),
  ['tutor', 'tutor', 'familia', 'quien-lo-pide', 'familia']);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
