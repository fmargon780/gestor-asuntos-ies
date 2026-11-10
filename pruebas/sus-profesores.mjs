/* Prueba de la fila 572 (docs/572-SUS-PROFESORES-POR-ALUMNO.md): «Sus profesores» en el correo de un asunto.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1): js/demo/datos-tutor.js deja el profesorado del curso de hoy
   (4º A: Otero Campos da Matemáticas y Física y Química, Reyes Palma Lengua, Cabello Ruiz —sin correo— Inglés, y Uceda Molina
   Geografía e Historia, que no le da clase a Jimenez Rubio, Mateo; 1º Bach A: Fuentes Calvo, Rubén tiene Inglés con Cabello Ruiz).

   1. Las funciones puras: juntar materias de un profesor, la ficha del personal, el curso, el alumno.
   2. El correo de un alumno: «profesor» saca solo los suyos, «Profesor/a de <materia>»; una materia saca a su profesor; uno con dos materias, una sola vez.
   3. Un profesor sin correo: sale con «Sin correo» y el aviso «Falta el correo de…» con su casilla; al guardarlo ya se puede elegir.
   4. Asunto de grupo: todos los del grupo; varios alumnos: los de todos sin repetir; sin el dato del curso: ninguno.
   5. La plantilla: el papel se llama «Sus profesores» y, puesto en Copia, los coloca (el que no tiene correo, no).
   6. El Centro de datos: las partes `profesorado-*` se toman byte a byte, con huella, sin repetir. */
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.Horario && window.CorreoPara, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

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
const opciones = (campo) => pagina.evaluate((c) => [...document.querySelectorAll('#correo-' + c + ' .cdest-opcion')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), campo);
async function escribir(campo, texto) { await pagina.fill('#correo-' + campo + '-escribir', texto); await pagina.waitForTimeout(150); }

/* ===== 1. Las funciones puras ===== */
console.log('--- 1. funciones puras ---');
await comprobar('1. un profesor con dos materias sale una vez, con las dos', pagina.evaluate(() => Horario.juntar([
  { profesor: 'Otero Campos, Marta', materia: 'Matemáticas', fichaId: '' }, { profesor: 'Reyes Palma, Fernando', materia: 'Lengua' },
  { profesor: 'OTERO CAMPOS, MARTA', materia: 'Física y Química', fichaId: '11223344A' }, { profesor: 'Otero Campos, Marta', materia: 'matemáticas' }])
  .map((p) => [p.nombre, Horario.textoDeMaterias(p.materias), p.fichaId])),
  [['Otero Campos, Marta', 'Matemáticas y Física y Química', '11223344A'], ['Reyes Palma, Fernando', 'Lengua', '']]);
await comprobar('1. el curso de un asunto: «2026/2027», «26-27» o nada', pagina.evaluate(() => [Horario.cursoCorto('2026/2027'), Horario.cursoCorto('26-27'), Horario.cursoCorto('1º ESO'), Horario.cursoCorto('')]), ['26-27', '26-27', '', '']);
await comprobar('1. al alumno se le encuentra por su número y, si no, por su nombre', pagina.evaluate(() => {
  const alumnos = { registros: [{ id: '1', datos: { alumno: 'Pérez Gil, Ana' } }, { id: '2', datos: { alumno: 'Sanz Mora, Luis' } }] };
  return [Horario.registroDelAlumno(alumnos, { id: '2' }).id, Horario.registroDelAlumno(alumnos, { id: '', nombre: 'PEREZ GIL, ANA' }).id, Horario.registroDelAlumno(alumnos, { id: '9', nombre: 'Nadie' })]; }), ['2', '1', null]);

/* ===== 2. El correo de un alumno ===== */
console.log('--- 2. el correo de un alumno ---');
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await vacio();
await escribir('para', 'profesor');
await comprobar('2. «profesor» saca solo a los profesores de sus materias (Uceda Molina no le da clase), cada uno una vez y como «Profesor/a de <materia>»',
  opciones('para').then((l) => l.filter((t) => t.indexOf('Lista del personal') === -1).map((t) => t.replace(/ Sin correo.*$/, '').replace(/ [^ ]*@correo-demo\.es$/, '')).sort()),
  ['Cabello Ruiz, Esperanza · Profesor/a de Inglés', 'Otero Campos, Marta · Profesor/a de Matemáticas y Física y Química', 'Reyes Palma, Fernando · Profesor/a de Lengua Castellana y Literatura']);
await escribir('para', 'profesora');
const soloProfes = () => opciones('para').then((l) => l.filter((t) => t.indexOf('Lista del personal') === -1).length);
await escribir('para', 'profesora');
await comprobar('2. «profesora» también', soloProfes(), 3);
await escribir('para', 'profesores');
await comprobar('2. y «profesores»', soloProfes(), 3);
await escribir('para', 'fisica');
await comprobar('2. el nombre de una materia saca a quien la da (aunque dé otra más)', opciones('para').then((l) => l.map((t) => t.replace(/ [^ ]*@correo-demo\.es$/, ''))), ['Otero Campos, Marta · Profesor/a de Matemáticas y Física y Química']);
await escribir('para', 'lengua');
await comprobar('2. «lengua» saca a su profesor', opciones('para').then((l) => l.length), 1);
await escribir('para', 'geografia');
await comprobar('2. la materia de quien no le da clase no saca a nadie', opciones('para'), []);
await escribir('para', 'reyes');
await pagina.keyboard.press('Enter');
await escribir('copia', 'otero');
await pagina.keyboard.press('Enter');
await comprobar('2. se eligen como cualquier otra persona, cada una en un solo campo', campos(), [['Reyes Palma, Fernando'], ['Otero Campos, Marta'], []]);
await comprobar('2. con su correo', pagina.evaluate(() => [CorreoPara.texto('para'), CorreoPara.texto('copia')]), ['freyes@correo-demo.es', 'motero@correo-demo.es']);

await cerrar();
const idPl = await pagina.evaluate(async () => {
  const id = Plantillas.idNuevo();
  await Plantillas.guardar(App.E.gestor, (a) => { a.lista.push({ id, tipo: 'SANCION', categoria: 'ALUMNADO', nombre: 'Prueba 572', texto: 'Texto.', para: ['legales'], copia: ['profes'], migradaA555: true }); return a; });
  await Plantillas.cargar(App.E.gestor);
  return id;
});
await abrir('SANCION Jimenez Rubio', { plantilla: idPl });
await comprobar('5. con «Sus profesores» en Copia salen ya puestos los que tienen correo (el que no lo tiene, no)', campos().then((c) => [c[1], c[2]]), [['Otero Campos, Marta', 'Reyes Palma, Fernando'], []]);
await cerrar();
await abrir('SANCION Jimenez Rubio', { plantilla: '' });
await vacio();

/* ===== 3. Un profesor sin correo ===== */
console.log('--- 3. sin correo ---');
await escribir('para', 'cabello');
await comprobar('3. sale con «Sin correo: no se puede añadir»', opciones('para'), ['Cabello Ruiz, Esperanza · Profesor/a de Inglés Sin correo: no se puede añadir']);
await comprobar('3. y debajo, el aviso «Falta el correo de…» con su casilla', pagina.evaluate(() => [...document.querySelectorAll('#correo-tutor-faltas .correo-tutor-falta')].map((p) => p.firstChild.textContent + '|' + !!p.querySelector('input'))),
  ['Falta el correo de Cabello Ruiz, Esperanza (profesor/a de Inglés)|true']);
await escribir('para', '');
await pagina.fill('#correo-tutor-faltas .correo-tutor-escribir', 'ecabello@correo-demo.es');
await pagina.click('#correo-tutor-faltas .correo-tutor-guardar');
await pagina.waitForFunction(() => !document.querySelector('#correo-tutor-faltas'), null, { timeout: 10000 });
await comprobar('3. al guardarlo, el aviso desaparece y ya está en Para', campos(), [['Cabello Ruiz, Esperanza'], [], []]);
await comprobar('3. y queda recordado para otros correos', pagina.evaluate(async () => { Horario.olvidar();
  const p = await Horario.profesoresDeUnidades({ ficha: { grupo: { nombre: '4º A' } } }, { persona: null, relacionados: [] });
  return p.filter((x) => x.nombre.indexOf('Cabello') === 0)[0].correos; }), ['ecabello@correo-demo.es']);
await cerrar();

/* ===== 4. Grupo, varios alumnos, sin dato ===== */
console.log('--- 4. grupo, varios alumnos, sin el dato ---');
await comprobar('4. un asunto de grupo: todos los profesores del grupo, cada uno una vez', pagina.evaluate(async () => {
  Horario.olvidar();
  const r = await Horario.profesoresDeUnidades({ ficha: { grupo: { nombre: '4º A' }, relacionados: [] } }, { persona: null, relacionados: [] });
  return r.map((x) => x.nombre + ' · ' + x.materia + (x.correos.length ? ' · con correo' : ' · sin correo')); }),
  ['Otero Campos, Marta · Matemáticas y Física y Química · con correo', 'Reyes Palma, Fernando · Lengua Castellana y Literatura · con correo',
   'Cabello Ruiz, Esperanza · Inglés · con correo', 'Uceda Molina, Patricia · Geografía e Historia · con correo']);
await comprobar('4. varios alumnos: los de todos, cada profesor una vez y con todas sus materias', pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const por = (n) => f.lista.filter((x) => App.textoTercero(x).indexOf(n) === 0)[0];
  const r = await Horario.profesoresDeUnidades({ ficha: {} }, { persona: por('Jimenez Rubio, Mateo'), relacionados: [{ nombre: 'x', persona: por('Fuentes Calvo, Rubén') }] });
  return r.map((x) => x.nombre + ' · ' + x.materia); }),
  ['Otero Campos, Marta · Matemáticas y Física y Química', 'Reyes Palma, Fernando · Lengua Castellana y Literatura', 'Cabello Ruiz, Esperanza · Inglés']);
await comprobar('4. sin el dato de ese curso no sale nadie', pagina.evaluate(async () => {
  Horario.olvidar();
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const p = f.lista.filter((x) => App.textoTercero(x).indexOf('Jimenez Rubio, Mateo') === 0)[0];
  return (await Horario.profesoresDeUnidades({ ficha: { curso: '19-20' } }, { persona: p, relacionados: [] })).length; }), 0);
await abrir('GRUPO Visita Granada', { plantilla: '' });
await comprobar('4. el cuadro de un asunto de grupo se abre y sus listas no fallan', pagina.evaluate(() => CorreoPara.candidatos().length > 0), true);
await cerrar();

/* ===== 5. La plantilla ===== */
console.log('--- 5. la plantilla ---');
await comprobar('5. el papel se llama «Sus profesores»', pagina.evaluate(() => [PlantillaPapeles.nombreDe('profes')]), ['Sus profesores']);
await pagina.evaluate((id) => { PlantillasAjustes.abrirCuadroDePlantilla(Plantillas.porId(id), null, () => {}); }, idPl);
await pagina.waitForSelector('#pl-saludo', { timeout: 15000 });
await comprobar('5. en el editor de la plantilla se ve «Sus profesores»', pagina.evaluate(() => [...document.querySelectorAll('#pl-copia .cdest-pastilla strong')].map((e) => e.textContent)), ['Sus profesores']);
await pagina.click('#cuadro-cancelar').catch(() => {});
await pagina.waitForTimeout(500);
if (await pagina.locator('#capa:not(.oculto)').count()) await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);

/* ===== 6. El Centro de datos ===== */
console.log('--- 6. el Centro de datos ---');
await comprobar('6. las partes de profesorado de un índice: las de los dos conjuntos con curso, y nada más', pagina.evaluate(() => CentroDeDatosProfesorado.partes({ hechos: [
  { conjunto: 'profesorado-grupos', parte: 'curso', ruta: 'a/b.json', cursoEscolar: '26-27' }, { conjunto: 'profesorado-alumnos', parte: 'curso', ruta: 'c/d.json', cursoEscolar: '26-27' },
  { conjunto: 'tutorias', parte: 'curso', ruta: 'e.json', cursoEscolar: '26-27' }, { conjunto: 'profesorado-grupos', parte: 'curso', ruta: 'f.json', cursoEscolar: '2026' }] }).map((e) => e.conjunto)),
  ['profesorado-grupos', 'profesorado-alumnos']);
const toma = await pagina.evaluate(async () => {
  const curso = '31-32';
  const texto = (conjunto) => JSON.stringify({ acuerdoHecho: 1, conjunto, parte: 'curso', cursoEscolar: curso, registros: [{ id: 'x', datos: { unidad: '1º A', materia: 'Música', profesor: 'Prueba Gil, Eva' } }] });
  const cuerpos = { 'profesorado-grupos': texto('profesorado-grupos'), 'profesorado-alumnos': texto('profesorado-alumnos') };
  const sha = async (t) => { const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t))); return [...h].map((b) => b.toString(16).padStart(2, '0')).join(''); };
  const dir = { getDirectoryHandle: async () => dir, getFileHandle: async (n) => ({ getFile: async () => new File([cuerpos[n.replace('.json', '')]], n) }) };
  const indice = { hechos: [] };
  for (const c of Object.keys(cuerpos)) indice.hechos.push({ conjunto: c, parte: 'curso', ruta: c + '/' + curso + '/' + c + '.json', cursoEscolar: curso, huella: await sha(cuerpos[c]), hecho: '2026-11-09T10:00:00Z', registros: 1, acuerdoHecho: 1 });
  const primera = await CentroDeDatosProfesorado.tomar(dir, indice, {}, {});
  const leido = [await Carpetas.leerTexto(App.E.datos, 'PROFESORADO-GRUPOS-HECHO ' + curso + '.json'), await Carpetas.leerTexto(App.E.datos, 'PROFESORADO-ALUMNOS-HECHO ' + curso + '.json')];
  const apuntes = { tomado: primera.nuevos };
  const segunda = await CentroDeDatosProfesorado.tomar(dir, indice, apuntes, {});
  indice.hechos[0].huella = 'f'.repeat(64);
  const mala = await CentroDeDatosProfesorado.tomar(dir, indice, {}, {});
  return [Object.keys(primera.nuevos).sort(), leido[0] === cuerpos['profesorado-grupos'], leido[1] === cuerpos['profesorado-alumnos'], Object.keys(segunda.nuevos).length, Object.keys(mala.nuevos)];
});
await comprobar('6. se toman byte a byte, con su apunte; la segunda vez no se repiten; con la huella mala no se toma esa', toma,
  [['hecho-profesorado-alumnos|31-32', 'hecho-profesorado-grupos|31-32'], true, true, 0, ['hecho-profesorado-alumnos|31-32']]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
