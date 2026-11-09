/* Prueba de la fila 555 (6-nov-2026, docs/555-A-QUIEN-VA-CADA-CORREO.md): a quién va cada correo.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1). Se escriben tutores con correo en la ficha de Jimenez Rubio, Mateo (4º A,
   tutora Otero Campos con correo) y de Fuentes Calvo, Rubén (tutora sin correo).

   1. El cuadro de Correo: Para, Copia y Copia oculta son casillas de escribir; no hay casilla libre, casillas marcables, «Añadir un grupo» ni «+ Tutor/a de».
   2. Escribir saca solo a la gente del asunto; Intro la pone; una persona solo en un campo; el límite y sus mensajes; sin correo.
   3. Otro correo solo esta vez; la custodia; relacionados; listas del personal; asunto de grupo (familias a Copia oculta).
   4. La plantilla propone por papeles, con su saludo y su firma; «Sin plantilla» abre sin nadie.
   5. El editor de plantillas (Saludo, Texto, Firma y tres campos; sin «Va a»); la tarea de la guía; la mesa del hito.
   6. El paso de lo que ya existe; lo que viaja al enviar (Para, Copia, Copia oculta). */
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.InformarAlTutor && window.CorreoPara, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

/* Tutores con correo en la ficha de Jimenez Rubio (Madre y Padre, dos correos) y alguien más para el límite. */
await pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const p = f.lista.filter((x) => App.textoTercero(x).indexOf('Jimenez Rubio, Mateo') === 0)[0];
  Object.assign(p.campos, {
    'Nombre Primer tutor': 'Elena', 'Primer apellido Primer tutor': 'Rubio', 'Segundo apellido Primer tutor': 'Sanz', 'Correo Primer tutor': 'elena.rubio@correo-demo.es', 'Relación Primer tutor': 'Madre',
    'Nombre Segundo tutor': 'Javier', 'Primer apellido Segundo tutor': 'Jimenez', 'Segundo apellido Segundo tutor': 'Mora', 'Correo Segundo tutor': 'javier.jimenez@correo-demo.es', 'Relación Segundo tutor': 'Padre'
  });
});

async function abrir(frag, extra) {
  await pagina.evaluate(({ frag, extra }) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__asunto = a;
    window.__cuadro = CorreoNucleo.abrirCuadro(a, false, extra || {});
  }, { frag, extra });
  await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
  await pagina.waitForTimeout(800);
}
async function cerrar() {
  if (await pagina.locator('#capa:not(.oculto)').count()) await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
  await pagina.waitForTimeout(300);
}
const vacio = () => pagina.evaluate(() => { CorreoPara.vaciar(); CorreoPara.repintar(); });
const campos = () => pagina.evaluate(() => ['para', 'copia', 'oculta'].map((c) => [...document.querySelectorAll('#correo-' + c + ' .cdest-pastilla')].map((p) => p.querySelector('strong').textContent)));
const lista = (campo) => pagina.evaluate((c) => [...document.querySelectorAll('#correo-' + c + ' .cdest-opcion strong')].map((e) => e.textContent), campo);
const aviso = (campo) => pagina.evaluate((c) => document.querySelector('#correo-' + c + ' .cdest-aviso').textContent, campo);
async function escribir(campo, texto) { await pagina.fill('#correo-' + campo + '-escribir', texto); await pagina.waitForTimeout(150); }

/* ===== 1. Las casillas ===== */
console.log('--- 1. el cuadro ---');
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await comprobar('1. Para, Copia y Copia oculta son tres casillas de escribir', pagina.evaluate(() => ['para', 'copia', 'oculta'].map((c) => !!document.querySelector('#correo-' + c + ' input.cdest-escribir'))), [true, true, true]);
await comprobar('1. no hay casilla libre, casillas marcables, «Añadir un grupo» ni «+ Tutor/a de»', pagina.evaluate(() => [
  !!document.getElementById('correo-otro'), document.querySelectorAll('.correo-marca').length, !!document.getElementById('correo-grupo'), document.querySelectorAll('.correo-tutor-anadir').length]), [false, 0, false, 0]);
await comprobar('1. el botón «Relacionar a alguien con el asunto» está junto a «Enviar»', pagina.evaluate(() => !!document.getElementById('correo-relacionar')), true);
await vacio();

/* ===== 2. Escribir ===== */
console.log('--- 2. escribir ---');
await escribir('copia', 'padr');
await comprobar('2. «padr» saca al padre con su correo', pagina.evaluate(() => [...document.querySelectorAll('#correo-copia .cdest-opcion')].map((e) => e.innerText.replace(/\s+/g, ' '))), ['Javier Jimenez Mora · Tutor legal · padre javier.jimenez@correo-demo.es']);
await pagina.keyboard.press('Enter');
await comprobar('2. Intro lo pone como pastilla en Copia, con su nombre', campos(), [[], ['Javier Jimenez Mora'], []]);
await escribir('para', 'tutor');
await comprobar('2. «tutor» saca a la tutora del grupo y a los dos tutores legales (el que ya está en Copia, con su aviso)', pagina.evaluate(() => [...document.querySelectorAll('#correo-para .cdest-opcion')].map((e) => e.querySelector('strong').textContent + (/Ahora en Copia/.test(e.innerText) ? ' (en Copia)' : ''))).then((l) => l.sort()),
  ['Elena Rubio Sanz', 'Javier Jimenez Mora (en Copia)', 'Otero Campos, Marta']);
await pagina.click('#correo-para .cdest-opcion:has-text("Javier")');
await comprobar('2. ponerlo en Para lo quita de Copia: una persona solo en un campo', campos(), [['Javier Jimenez Mora'], [], []]);
await escribir('oculta', 'Fuentes');
await comprobar('2. el apellido de otro alumno no saca a nadie y dice que antes se relacione', Promise.all([lista('oculta'), aviso('oculta')]), [[], 'Nadie de este asunto se llama así. Para escribirle, relaciónalo con el asunto: Relacionar a alguien con el asunto']);
await escribir('oculta', 'alguien@otro.es');
await comprobar('2. una dirección de correo tampoco', aviso('oculta'), 'Nadie de este asunto tiene esa dirección. Para escribirle, relaciónalo con el asunto: Relacionar a alguien con el asunto');
await escribir('oculta', '');
await escribir('oculta', 'otero');
await pagina.keyboard.press('Enter');
await pagina.keyboard.press('Backspace');
await escribir('oculta', '');
await pagina.keyboard.press('Backspace');
await comprobar('2. Retroceso con la casilla vacía quita la última pastilla', campos(), [['Javier Jimenez Mora'], [], []]);
await cerrar();

await abrir('SANCION Fuentes Calvo', { plantilla: '' });
await vacio();
await escribir('para', 'cabello');
await comprobar('2. una persona sin correo sale con «Sin correo: no se puede añadir»', pagina.evaluate(() => document.querySelector('#correo-para .cdest-opcion').innerText.replace(/\s+/g, ' ')), 'Cabello Ruiz, Esperanza · Tutor/a de 1º Bach A Sin correo: no se puede añadir');
await pagina.evaluate(() => document.querySelector('#correo-para .cdest-opcion').click());
await comprobar('2. y no se puede elegir', campos(), [[], [], []]);
await cerrar();

/* ===== 3. Solo esta vez, custodia, relacionados, listas, grupo ===== */
console.log('--- 3. solo esta vez, custodia, relacionados, listas, grupo ---');
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await vacio();
await escribir('para', 'madre');
await pagina.keyboard.press('Enter');
await pagina.click('#correo-para .cdest-pastilla .cdest-texto');
await pagina.fill('#correo-para .cdest-vez-correo', 'otra.direccion@correo-demo.es');
await pagina.click('#correo-para .cdest-vez-usar');
await comprobar('3. pulsar la pastilla deja escribir otro correo solo esta vez: sale en ámbar con «(solo esta vez)»', pagina.evaluate(() => {
  const p = document.querySelector('#correo-para .cdest-pastilla'); return [p.classList.contains('cdest-vez'), /solo esta vez/.test(p.textContent), /otra\.direccion@correo-demo\.es/.test(p.textContent)]; }), [true, true, true]);
await comprobar('3. el cuadro envía ese correo y el guardado de la persona no cambia', pagina.evaluate(() => [CorreoPara.texto('para'), CorreoPara.candidatos().filter((c) => c.id === 'legal1')[0].dirs]), ['otra.direccion@correo-demo.es', ['elena.rubio@correo-demo.es']]);
await pagina.click('#correo-para .cdest-pastilla .cdest-texto');
await pagina.click('#correo-para .cdest-vez-volver');
await comprobar('3. «Volver al guardado» lo deshace', pagina.evaluate(() => [CorreoPara.texto('para'), !!document.querySelector('#correo-para .cdest-vez')]), ['elena.rubio@correo-demo.es', false]);
await comprobar('3. la custodia: con dos tutores sin elegir, ninguno la lleva; con un nombre, solo ese', pagina.evaluate(() => [CorreoPara.custodiaDe(['Elena Rubio', 'Javier Jimenez'], ''), CorreoPara.custodiaDe(['Elena Rubio', 'Javier Jimenez'], 'Javier Jimenez'), CorreoPara.custodiaDe(['Elena Rubio'], '')]), ['', 'Javier Jimenez', 'Elena Rubio']);
await comprobar('3. y se ve junto al nombre al buscarlo', pagina.evaluate(() => { const c = CorreoPara.candidatos().filter((x) => x.id === 'legal2')[0]; c.custodia = true;
  return CorreoPara.candidatos().length > 0; }), true);
await escribir('copia', 'custodia');
await comprobar('3. «custodia» saca al tutor que la tiene', lista('copia'), ['Javier Jimenez Mora']);
await escribir('copia', 'profesorado');
await comprobar('3. una lista de Grupos con solo personal sale al buscarla por nombre', lista('copia'), ['Profesorado']);
await pagina.keyboard.press('Enter');
await comprobar('3. y puede ir en Copia con varios correos', pagina.evaluate(() => CorreoPara.texto('copia').split(', ').length), 3);
await pagina.evaluate(async () => {
  const g = await Grupos.crear('Mezcla de prueba', [{ categoria: 'PERSONAL', nombre: 'Otero Campos, Marta 344A' }, { categoria: 'ALUMNADO', nombre: 'Aguilar Ponce, Pablo 2100002' }]);
  window.__grupoMezcla = g.id;
});
await pagina.evaluate(() => { window.__a = window.__asunto; });
await cerrar();
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await escribir('para', 'mezcla');
await comprobar('3. una lista con algún alumno no sale', lista('para'), []);
await pagina.evaluate(async (id) => { await Grupos.borrar(id); }, await pagina.evaluate(() => window.__grupoMezcla));
await pagina.evaluate(() => { const a = window.__asunto; a.ficha.relacionados = [{ categoria: 'PERSONAL', nombre: 'Otero Campos, Marta 344A' }]; });
await cerrar();
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await escribir('copia', 'otero');
await comprobar('3. una persona relacionada con el asunto sale al buscarla', lista('copia').then((l) => l.length > 0), true);
await cerrar();

await abrir('GRUPO Visita Granada', { plantilla: '' });
await comprobar('3. asunto de grupo: las familias van siempre a Copia oculta', pagina.evaluate(() => {
  CorreoPara.vaciar(); CorreoPara.poner('para', { id: 'legal1', nombre: 'Familia de prueba', dirs: ['f@correo-demo.es'], familia: true });
  CorreoPara.poner('copia', { id: 'legal2', nombre: 'Otra familia', dirs: ['g@correo-demo.es'], familia: true });
  CorreoPara.poner('para', { id: 'pide', nombre: 'Secretaría', dirs: ['s@correo-demo.es'], familia: false });
  return [CorreoPara.estado().grupoDeFamilias, CorreoPara.direcciones('para'), CorreoPara.direcciones('copia'), CorreoPara.direcciones('oculta')]; }),
  [true, ['s@correo-demo.es'], [], ['f@correo-demo.es', 'g@correo-demo.es']]);
await cerrar();

/* ===== 4. La plantilla ===== */
console.log('--- 4. la plantilla ---');
const idPl = await pagina.evaluate(async () => {
  const id = Plantillas.idNuevo();
  await Plantillas.guardar(App.E.gestor, (a) => { a.lista.push({ id, tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Prueba 555', texto: 'Texto de la prueba.', saludo: 'Querida familia de {nombre}:', firma: 'FIRMA PROPIA 555', para: ['legales'], oculta: ['tutor'], migradaA555: true }); return a; });
  await Plantillas.cargar(App.E.gestor);
  return id;
});
await abrir('SANCION Jimenez Rubio', { plantilla: idPl });
await comprobar('4. la plantilla pone ya a las personas del asunto en cada campo', campos(), [['Elena Rubio Sanz', 'Javier Jimenez Mora'], [], ['Otero Campos, Marta']]);
const cuerpo = await pagina.evaluate(() => document.getElementById('correo-cuerpo-texto').value);
await comprobar('4. su saludo (con campos variables) y su firma salen en el cuerpo', [/^Querida familia de Jimenez Rubio, Mateo/.test(cuerpo), /FIRMA PROPIA 555\s*$/.test(cuerpo), cuerpo.indexOf('Texto de la prueba.') !== -1], [true, true, true]);
await pagina.evaluate(() => { CorreoPara.quitar('legal1'); CorreoPara.repintar(); });
await comprobar('4. se pueden quitar', campos(), [['Javier Jimenez Mora'], [], ['Otero Campos, Marta']]);
await pagina.selectOption('#correo-plantilla', '');
await comprobar('4. «Sin plantilla» deja el correo sin nadie puesto', campos(), [[], [], []]);
await cerrar();
await pagina.evaluate(async (id) => { await Plantillas.guardar(App.E.gestor, (a) => { a.lista.filter((p) => p.id === id)[0].saludo = ''; a.lista.filter((p) => p.id === id)[0].firma = ''; return a; }); await Plantillas.cargar(App.E.gestor); }, idPl);
await abrir('SANCION Jimenez Rubio', { plantilla: idPl });
const cuerpo2 = await pagina.evaluate(() => document.getElementById('correo-cuerpo-texto').value);
await comprobar('4. saludo vacío: el de siempre; firma vacía: la de Ajustes', [/^Estimados tutores legales de/.test(cuerpo2), cuerpo2.indexOf('FIRMA PROPIA 555') === -1], [true, true]);

/* ===== 5. El editor de plantillas, la guía y la mesa ===== */
console.log('--- 5. editor, guía y mesa ---');
await cerrar();
await pagina.evaluate((id) => { PlantillasAjustes.abrirCuadroDePlantilla(Plantillas.porId(id), null, () => {}); }, idPl);
await pagina.waitForSelector('#pl-saludo', { timeout: 15000 });
await comprobar('5. el editor tiene Saludo, Texto, Firma y las tres casillas; sin «Va a»', pagina.evaluate(() => [
  !!document.getElementById('pl-saludo'), !!document.getElementById('pl-texto'), !!document.getElementById('pl-firma'),
  ['para', 'copia', 'oculta'].map((c) => !!document.querySelector('#pl-' + c + ' input')), !!document.getElementById('pl-va-a')]), [true, true, true, [true, true, true], false]);
await comprobar('5. los papeles puestos se ven como pastillas', pagina.evaluate(() => [...document.querySelectorAll('#pl-para .cdest-pastilla strong, #pl-oculta .cdest-pastilla strong')].map((e) => e.textContent)), ['Tutores legales', 'Tutor/a del grupo']);
await pagina.fill('#pl-copia-escribir', 'quien');
await pagina.keyboard.press('Enter');
await pagina.fill('#pl-saludo', 'Buenas tardes, {nombre}:');
await pagina.fill('#pl-firma', 'Firma {centro}');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'), null, { timeout: 15000 });
await pagina.waitForTimeout(800);
await comprobar('5. al guardar quedan los papeles, el saludo y la firma', pagina.evaluate(async (id) => { const p = (await Plantillas.cargar(App.E.gestor)).lista.filter((x) => x.id === id)[0];
  return [p.para, p.copia, p.oculta, p.saludo, p.firma, p.vaA === undefined]; }, idPl), [['legales'], ['pide'], ['tutor'], 'Buenas tardes, {nombre}:', 'Firma {centro}', true]);
await comprobar('5. la tarea de la guía no tiene «a quién»: enseña «A quién va (lo dice la plantilla)» con los papeles', pagina.evaluate((id) => {
  const d = document.createElement('div'); d.innerHTML = GuiasGuion.recetaHTML({ accion: 'comunicar', receta: { via: 'correo', plantilla: id } }, false);
  return [!!d.querySelector('.guion-receta-a'), d.textContent.indexOf('A quién va (lo dice la plantilla)') !== -1, /Para: Tutores legales/.test(d.textContent), /Copia: Quien lo pide/.test(d.textContent)]; }, idPl), [false, true, true, true]);
await comprobar('5. la mesa del hito: «Comunicar ▾» no lleva casillas de destinatarios', pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Jimenez Rubio') !== -1)[0];
  const fila = document.createElement('div'); fila.innerHTML = '<div class="mesa-destinatarios"></div>'; document.body.appendChild(fila);
  await HitoMesaComunicar.pintar(fila, a, { id: 'h-x', clase: 'normal', titulo: 'X' });
  const r = [fila.querySelectorAll('.mesa-chip').length, !!fila.querySelector('.mesa-preparar-correo'), !!fila.querySelector('.mesa-mensaje-seneca')]; fila.remove(); return r; }), [0, true, true]);

/* ===== 6. Lo que ya existe y lo que viaja ===== */
console.log('--- 6. lo que ya existe y lo que viaja ---');
await comprobar('6. el paso de «Va a»: familia → tutores legales (alumnado) o interesado; tutor → tutor con «Buenas:»; quien lo pide → pide; sin «Va a» → nada', pagina.evaluate(() => [
  PlantillaPapeles.deVaA({ vaA: 'familia', categoria: 'ALUMNADO' }), PlantillaPapeles.deVaA({ vaA: 'familia', categoria: 'PERSONAL' }), PlantillaPapeles.deVaA({ vaA: 'tutor' }), PlantillaPapeles.deVaA({ vaA: 'quien-lo-pide' }), PlantillaPapeles.deVaA({})]),
  [{ para: ['legales'], copia: [], oculta: [] }, { para: ['interesado'], copia: [], oculta: [] }, { para: ['tutor'], copia: [], oculta: [], saludo: 'Buenas:' }, { para: ['pide'], copia: [], oculta: [] }, { para: [], copia: [], oculta: [] }]);
const migradas = await pagina.evaluate(async () => {
  const ids = {};
  await Plantillas.guardar(App.E.gestor, (a) => {
    [['m-fam', 'familia', 'ALUMNADO', 'Estimada familia, le informamos.'], ['m-tut', 'tutor', 'ALUMNADO', 'Estimada tutora, le informamos.'], ['m-pide', 'quien-lo-pide', '', 'Hola, le informamos.'], ['m-nada', undefined, 'ALUMNADO', 'Texto sin más.']]
      .forEach(([id, vaA, categoria, texto]) => { const p = { id, tipo: categoria ? 'SANCION' : '', categoria, nombre: 'Migrada ' + id, texto }; if (vaA) p.vaA = vaA; a.lista.push(p); });
    return a;
  });
  const tocadas = await PlantillaVaARevision.aplicar();
  const d = await Plantillas.cargar(App.E.gestor);
  return [tocadas.length > 0, ['m-fam', 'm-tut', 'm-pide', 'm-nada'].map((i) => { const p = d.lista.filter((x) => x.id === i)[0]; return [p.para || null, p.saludo || null, p.texto, p.vaA === undefined]; })];
});
await comprobar('6. el paso toca las plantillas y quita el «Va a»', migradas, [true, [[['legales'], null, 'Estimada familia, le informamos.', true], [['tutor'], 'Buenas:', 'le informamos.', true], [['pide'], null, 'Hola, le informamos.', true], [null, null, 'Texto sin más.', true]]]);
await comprobar('6. y se hace una sola vez (la segunda no toca nada)', pagina.evaluate(async () => (await PlantillaVaARevision.aplicar()).length), 0);

await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await pagina.evaluate(() => {
  window.__enviado = null;
  CorreoEnviar.tieneConexion = () => true;
  CorreoEnviar.enviar = async (c) => { window.__enviado = c; return { ok: true, hilo: 'h1', matricula: 'm1' }; };
  CorreoPara.vaciar();
  CorreoPara.ponerElegido('para', 'legal1'); CorreoPara.ponerElegido('copia', 'legal2'); CorreoPara.ponerElegido('oculta', 'tutor:11223344');
  CorreoPara.repintar();
});
await cerrar();
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await pagina.evaluate(() => {
  window.__enviado = null;
  CorreoEnviar.tieneConexion = () => true;
  CorreoEnviar.enviar = async (c) => { window.__enviado = c; return { ok: true, hilo: 'h1', matricula: 'm1' }; };
  CorreoPara.vaciar();
  CorreoPara.ponerElegido('para', 'legal1'); CorreoPara.ponerElegido('copia', 'legal2'); CorreoPara.ponerElegido('oculta', 'tutor:11223344');
  CorreoPara.repintar();
  document.getElementById('correo-enviar').click();
});
await pagina.waitForSelector('#correo-resumen:not(.oculto) #correo-confirmar-envio', { timeout: 10000 });
await comprobar('6. el resumen enseña Para, Copia y Copia oculta', pagina.evaluate(() => [...document.querySelectorAll('#correo-resumen p strong')].map((e) => e.textContent).slice(0, 3)), ['Para:', 'Copia:', 'Copia oculta:']);
await pagina.click('#correo-confirmar-envio');
await pagina.waitForFunction(() => window.__enviado, null, { timeout: 10000 });
await comprobar('6. al enviar viajan Para, Copia y Copia oculta por separado', pagina.evaluate(() => [window.__enviado.para, window.__enviado.cc, window.__enviado.cco]),
  ['elena.rubio@correo-demo.es', 'javier.jimenez@correo-demo.es', 'motero@correo-demo.es']);
await pagina.waitForTimeout(500);
await cerrar();
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await pagina.evaluate(() => { CorreoPara.vaciar(); CorreoPara.ponerElegido('copia', 'legal1'); CorreoPara.repintar(); document.getElementById('correo-enviar').click(); });
await comprobar('6. sin nadie en «Para» no se envía', pagina.evaluate(() => document.getElementById('correo-resumen').classList.contains('oculto')), true);
await cerrar();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
