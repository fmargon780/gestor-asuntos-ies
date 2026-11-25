/* Fila 747 (docs/747-CAMPO-UNA-PERSONA-DEL-ASUNTO.md): el campo «Una persona del asunto».
   Copia de pruebas (demo), Chromium real. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

const T = 'Recibe {campo:Quién recibe}.';
const T2 = 'Otra: {campo:Quién recibe} y {campo:Quién recibe (teléfono)}.';
const VALORES = { nombreNatural: 'Alumna Uno', dni: '11111111H', tutor1: 'Tutor, Uno', tutor1dni: '22222222J', tutor2: 'Tutor, Dos', tutor2dni: '', custodiaDeSeneca: 'Tutor, Dos' };

await comprobar('1. «Una persona del asunto» es una clase de dato que se puede crear', p.evaluate(async () => {
  App.E.campos = await Campos.guardarPropios(App.E.gestor, (ps) => ps.concat([{ id: 'pq747', nombre: 'Quién recibe', clase: 'personaAsunto', valores: [], grupo: 'Asunto' }]));
  return [CamposClases.esValida('personaAsunto'), CamposClases.nombreDe('personaAsunto')];
}), [true, 'Una persona del asunto']);

await comprobar('2. la lista: tercero, quien lo pide, relacionados y tutores, con Tutor legal y custodia', p.evaluate(([v]) => {
  const a = App.E.listaAbiertos[0];
  const f = { categoria: 'ALUMNADO', tercero: 'Alumna Uno', loPide: { nombre: 'Abuela Pérez', relacion: 'abuela' }, relacionados: [{ categoria: 'PERSONAL', nombre: 'Profe Ana' }] };
  const b = { nombre: 'sin-ficha-en-el-registro', ficha: f, leido: {} };
  return PersonaDelAsunto.etiquetas(b, v);
}, [VALORES]), ['Alumna Uno · el tercero', 'Abuela Pérez · abuela, quien lo pide', 'Profe Ana', 'Tutor, Uno · Tutor legal 1', 'Tutor, Dos · Tutor legal 2 · tiene la custodia']);

await comprobar('3. el desplegable de «Faltan datos» ofrece esas personas, sin reglas de edad', p.evaluate(([v]) => {
  const a = App.E.listaAbiertos[0];
  const info = DatosDelAsunto.infoDe('Quién recibe', a, v);
  return [info.clase, info.valores.length > 0];
}, [VALORES]), ['lista', true]);

await comprobar('4. elegir una persona la guarda en el asunto y el documento lleva su nombre y su DNI', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  const quien = lista[0];
  const r = await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(quien));
  const v = await Plantillas.valoresDeAsunto(a);
  const f = App.E.registro.asuntos[a.nombre];
  const guardado = Object.values(f.campos).filter((c) => c.persona)[0];
  return [r.ok, r.valor === quien.nombre, !!guardado, Plantillas.rellenar('Recibe {campo:Quién recibe}.', v).texto.indexOf(quien.nombre) !== -1];
}), [true, true, true, true]);

await comprobar('5. otra plantilla con el mismo campo no vuelve a preguntar; el teléfono y el DNI están a mano', p.evaluate(async ([t2]) => {
  const a = App.E.listaAbiertos[0];
  const v = await Plantillas.valoresDeAsunto(a);
  const r = Plantillas.rellenar(t2, v);
  return [r.faltan.filter((x) => x === 'Quién recibe').length, 'Quién recibe (DNI)' in v.campos, 'Quién recibe (nombre)' in v.campos];
}, [T2]), [0, true, true]);

await comprobar('6. cambiar la elección: el siguiente documento usa la nueva persona', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  const otra = lista[lista.length - 1];
  await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(otra));
  const v = await Plantillas.valoresDeAsunto(a);
  return v.campos['Quién recibe (nombre)'] === otra.nombre;
}), true);

await comprobar('7. una persona sin DNI: el documento lo pide (DNI de Quién recibe) y, escrito, lo lleva', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: 'Vecina Sin Dni', persona: { dni: '', telefono: '', correo: '', relacion: '' }, anadir: { origen: 'propio', id: 'pq747' } });
  const v = await Plantillas.valoresDeAsunto(a);
  const antes = Plantillas.rellenar('{campo:Quién recibe}', v);
  v.aMano = { 'DNI de Quién recibe': '33333333P' };
  const despues = Plantillas.rellenar('{campo:Quién recibe}', v).texto;
  return [antes.faltan, despues];
}), [['DNI de Quién recibe'], 'Vecina Sin Dni, con DNI 33333333P']);

await comprobar('8. «DNI de Quién recibe» guardado en el asunto: ya no se pide', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const r = await DatosDelAsunto.guardar(a, 'DNI de Quién recibe', '33333333P');
  const v = await Plantillas.valoresDeAsunto(a);
  const t = Plantillas.rellenar('{campo:Quién recibe}', v);
  return [r.ok, t.faltan, t.texto];
}), [true, [], 'Vecina Sin Dni, con DNI 33333333P']);

await comprobar('9. «Tutor con custodia» sigue igual', p.evaluate(() => {
  const dos = DatosDelAsunto.completar({ tutor1: 'Ana', tutor2: 'Luis', campos: {} }).campos['Tutor con custodia'];
  return [dos || '', DatosDelAsunto.infoDe('Tutor con custodia', App.E.listaAbiertos[0], { tutor1: 'Ana', tutor2: 'Luis' }).valores];
}), ['', ['Ana', 'Luis']]);

await comprobar('10. no hay errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('persona-del-asunto: todo bien');
