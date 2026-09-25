/* Prueba (sin navegador) de la fila 166 (25-sep-2026,
   docs/TUTORES-LEGALES-COMO-TERCERO.md): los tutores legales, un tipo de
   tercero propio, sacado del RegAlum y guardado en tutores.csv al ser
   tercero de un asunto. Datos inventados. */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Un disco de mentira: carpetas con ficheros de texto y subcarpetas. */
function carpeta(nombre) { return { nombre, ficheros: {}, sub: {} }; }
const Carpetas = {
  async leerTexto(dir, n) { return Object.prototype.hasOwnProperty.call(dir.ficheros, n) ? dir.ficheros[n] : null; },
  async escribirTexto(dir, n, t) { dir.ficheros[n] = t; },
  async existeFichero(dir, n) { return Object.prototype.hasOwnProperty.call(dir.ficheros, n); },
  async crear(dir, n) { return (dir.sub[n] = dir.sub[n] || carpeta(n)); },
  async subcarpetas(dir) { return Object.keys(dir.sub).map((n) => ({ nombre: n, handle: dir.sub[n] })); }
};
const gestor = carpeta('_GESTOR');
const dirDatos = carpeta('datos');
const archivo = carpeta('ARCHIVO');
archivo.getDirectoryHandle = async (n) => { if (!archivo.sub[n]) throw new Error('no'); const c = archivo.sub[n]; c.getDirectoryHandle = async (m) => { if (!c.sub[m]) throw new Error('no'); return c.sub[m]; }; return c; };

const contexto = { console, Carpetas, window: {}, document: { addEventListener() {}, getElementById() { return null; } } };
contexto.window.Carpetas = Carpetas;
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: { datos: dirDatos, gestor, archivo, listaAbiertos: [] },
  FICHAS_DE_CATEGORIA: {}, trasPintarFicha: [] };
contexto.Gestor = contexto.window.Gestor = { alCrearAsunto: [], alRefrescar: [] };
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'datos.js', 'datos-alumnado.js',
  'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'personas-familias.js', 'tutores-legales.js']) {
  vm.runInContext(fs.readFileSync(raiz + 'js/' + f, 'utf8'), contexto, { filename: f });
}
vm.runInContext('window.TutoresLegales = TutoresLegales; window.PersonasFamilias = PersonasFamilias;', contexto);
const { U, Nombres, Datos, TutoresLegales, App, Gestor } = vm.runInContext(
  '({ U: U, Nombres: Nombres, Datos: Datos, TutoresLegales: TutoresLegales, App: App, Gestor: Gestor })', contexto);

/* El RegAlum de mentira, ya leído: dos hermanos que comparten madre. */
function tutor(n, nombre, ap1, ap2, dni, tel, correo) {
  const o = n === 1 ? 'Primer' : 'Segundo';
  const c = {};
  c['Nombre ' + o + ' tutor'] = nombre;
  c['Primer apellido ' + o + ' tutor'] = ap1;
  c['Segundo apellido ' + o + ' tutor'] = ap2;
  if (dni) c['DNI/Pasaporte ' + o + ' tutor'] = dni;
  if (tel) c['Teléfono ' + o + ' tutor'] = tel;
  if (correo) c['Correo electrónico ' + o + ' tutor'] = correo;
  return c;
}
function alumno(nombre, id, unidad, campos) {
  return { nombre, id, categoria: 'ALUMNADO', matriculado: true, unidad, curso: '1º ESO', campos,
           busca: U.normalizar(nombre + ' ' + id) };
}
const MADRE = tutor(1, 'Inés', 'Prueba', 'Inventada', '11111234X', '600000001', 'ines@ejemplo.es');
const hermanoA = alumno('Ficticio Prueba, Ana', '9001', '1º ESO A', Object.assign({}, MADRE, tutor(2, 'Pablo', 'Ficticio', 'Uno', '22225678Y', '', '')));
const hermanoB = alumno('Ficticio Prueba, Beto', '9002', '3º ESO B', Object.assign({}, MADRE));
const otro = alumno('Otro Sitio, Carla', '9003', '2º ESO A', tutor(1, 'Luis', 'Sitio', 'Lejos', '33339999Z', '', ''));

function ponerRegAlum(lista) {
  Datos.olvidar();
  Datos._interno.CACHE.ALUMNADO = { lista, fichero: 'RegAlum.csv', cabecera: [] };
}
ponerRegAlum([hermanoA, hermanoB, otro]);

/* 1. La madre sale una sola vez, con los dos hijos. */
let fuente = await Datos.cargar(dirDatos, 'TUTORES LEGALES');
const madres = fuente.lista.filter((p) => p.documento === '11111234X');
comprobar('1. la madre sale una sola vez', madres.length, 1);
const madre = madres[0];
comprobar('1. con sus dos hijos', madre.hijos.map((h) => h.id), ['9001', '9002']);
comprobar('1. son tres tutores en total (madre, padre de Ana y el de Carla)', fuente.lista.length, 3);
comprobar('1. se busca por su DNI y por su teléfono', [Datos.buscar(fuente.lista, '11111234x').length, Datos.buscar(fuente.lista, '600000001').length], [1, 1]);

/* 2. El nombre de su carpeta. */
comprobar('2. carpeta: «Apellido1 Apellido2, Nombre» + 4 últimos del DNI', Nombres.terceroTutor(madre), 'Prueba Inventada, Inés 234X');
comprobar('2. el pie dice sus hijos', TutoresLegales.pie(madre), 'DNI 11111234X  ·  Tutor/a de Ana (1º ESO A), Beto (3º ESO B)');

/* 3. Crear un asunto a su nombre la guarda en tutores.csv; quitar a los hijos del RegAlum no la borra. */
comprobar('3. antes de nada, no hay tutores.csv', await Carpetas.leerTexto(dirDatos, 'tutores.csv'), null);
comprobar('3. hay un enganche al crear', Gestor.alCrearAsunto.length, 1);
await Gestor.alCrearAsunto[0]('260925 RECLAMACION Prueba Inventada, Inés 234X', { categoria: 'TUTORES LEGALES' }, madre);
const csv = await Carpetas.leerTexto(dirDatos, 'tutores.csv');
comprobar('3. tutores.csv tiene su fila', /Prueba Inventada, Inés;11111234X;600000001;;ines@ejemplo\.es;;;"Ficticio Prueba, Ana \(9001\); Ficticio Prueba, Beto \(9002\)"/.test(csv), true);
await Gestor.alCrearAsunto[0]('x', {}, fuente.lista.find((p) => p.documento === '33339999Z'));
comprobar('3. un segundo tutor se añade sin quitar el primero', (await Carpetas.leerTexto(dirDatos, 'tutores.csv')).split('\r\n').filter(Boolean).length, 3);
ponerRegAlum([otro]);
fuente = await Datos.cargar(dirDatos, 'TUTORES LEGALES');
const sigue = fuente.lista.find((p) => p.documento === '11111234X');
comprobar('3. sin hijos en el RegAlum, sigue en la lista', !!sigue, true);
comprobar('3. con sus datos guardados', sigue && [sigue.nombre, sigue.telefonos, sigue.hijos.map((h) => h.id), sigue.enRegAlum],
  ['Prueba Inventada, Inés', ['600000001'], ['9001', '9002'], false]);
comprobar('3. el padre de Ana, que nunca fue tercero, ya no sale', fuente.lista.some((p) => p.documento === '22225678Y'), false);
comprobar('3. mismo nombre de carpeta que antes', Nombres.terceroTutor(sigue), 'Prueba Inventada, Inés 234X');

/* Si el RegAlum trae un teléfono nuevo, manda ese y el fichero se pone al día. */
const madreNueva = Object.assign({}, MADRE, { 'Teléfono Primer tutor': '699999999' });
ponerRegAlum([alumno('Ficticio Prueba, Ana', '9001', '2º ESO A', madreNueva), otro]);
fuente = await Datos.cargar(dirDatos, 'TUTORES LEGALES');
comprobar('3. el RegAlum manda', fuente.lista.find((p) => p.documento === '11111234X').telefonos, ['699999999']);
await new Promise((r) => setTimeout(r, 20));
comprobar('3. y tutores.csv se pone al día', /Inés;11111234X;699999999;/.test(await Carpetas.leerTexto(dirDatos, 'tutores.csv')), true);
comprobar('3. con copia del día en _GESTOR/copias', Object.keys((gestor.sub.copias || { ficheros: {} }).ficheros).some((n) => /^tutores-\d{6}\.csv$/.test(n)), true);

/* 4. La ficha del alumno: «Asuntos de sus tutores». */
ponerRegAlum([hermanoA, hermanoB, otro]);
App.E.listaAbiertos = [{ nombre: '260925 RECLAMACION Prueba Inventada, Inés 234X',
  ficha: { categoria: 'TUTORES LEGALES', tercero: 'Prueba Inventada, Inés 234X' } },
{ nombre: '260925 MATRICULA Ficticio Prueba, Ana 9001', ficha: { categoria: 'ALUMNADO', tercero: 'Ficticio Prueba, Ana 9001' } }];
const cat = await Carpetas.crear(archivo, 'TUTORES LEGALES');
const ter = await Carpetas.crear(cat, 'Prueba Inventada, Inés 234X');
await Carpetas.crear(ter, '250910 CONSEJO ESCOLAR Prueba Inventada, Inés 234X');
const deBeto = await TutoresLegales.asuntosDeSusTutores(hermanoB);
comprobar('4. Beto ve el asunto abierto y el archivado de su madre', deBeto.map((a) => [a.nombre, a.donde]),
  [['260925 RECLAMACION Prueba Inventada, Inés 234X', 'Abierto'], ['250910 CONSEJO ESCOLAR Prueba Inventada, Inés 234X', 'Archivado']]);
comprobar('4. Carla no tiene ninguno (no sale el bloque)', (await TutoresLegales.asuntosDeSusTutores(otro)).length, 0);
comprobar('4. la ficha de Personas tiene su enganche', [typeof App.FICHAS_DE_CATEGORIA['TUTORES LEGALES'].html, App.trasPintarFicha.length], ['function', 1]);

/* 5. Nombres.CATEGORIAS tiene las cinco, y no queda ninguna lista escrita a mano. */
comprobar('5. las cinco categorías (y, desde la fila 167, ADMINISTRACIONES)', Nombres.CATEGORIAS.slice().sort(),
  ['ADMINISTRACIONES', 'ALUMNADO', 'EMPRESAS', 'OTROS', 'PERSONAL', 'TUTORES LEGALES']);
const aMano = [];
for (const f of fs.readdirSync(raiz + 'js').filter((x) => x.endsWith('.js'))) {
  const texto = fs.readFileSync(raiz + 'js/' + f, 'utf8');
  if (f !== 'nombres.js' && /\[\s*'ALUMNADO'\s*,\s*'PERSONAL'/.test(texto)) aMano.push(f);
}
const html = fs.readFileSync(raiz + 'index.html', 'utf8');
if (/<option value="(EMPRESAS|OTROS|PERSONAL)"/.test(html)) aMano.push('index.html');
comprobar('5. ninguna lista de categorías escrita a mano', aMano, []);
comprobar('5. js/tutores-legales.js se carga después de js/puente.js y de js/archivo-personas.js',
  html.indexOf('js/tutores-legales.js') > html.indexOf('js/puente.js') && html.indexOf('js/tutores-legales.js') > html.indexOf('js/archivo-personas.js'), true);

if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodo bien.');
