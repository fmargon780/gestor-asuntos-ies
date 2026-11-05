/* Fila 530 (docs/530-DATOS-EN-EL-ASUNTO.md): los datos que piden las plantillas se escriben en el asunto.
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

const T1 = 'Dato {campo:Fecha de alegaciones} y {si:Protocolo X=Sí}párrafo.';
const T2 = 'Otra plantilla con {campo:Fecha de alegaciones}.';

await comprobar('1. la lista de una plantilla marca lo que falta', p.evaluate(async ([t1]) => {
  const a = App.E.listaAbiertos[0];
  const v = await Plantillas.valoresDeAsunto(a);
  return DatosDePlantilla.datosDeTextos([t1], v, a).map((d) => [d.nombre, d.falta]);
}, [T1]), [['Protocolo X', true], ['Fecha de alegaciones', true]]);

await comprobar('2. escribir un dato lo guarda en el asunto (campo «solo aquí») y no se vuelve a pedir', p.evaluate(async ([t1, t2]) => {
  const a = App.E.listaAbiertos[0];
  const r = await DatosDelAsunto.guardar(a, 'Fecha de alegaciones', 'a mano');
  const f = App.E.registro.asuntos[a.nombre];
  const v = await Plantillas.valoresDeAsunto(a);
  return [r.ok, (f.camposPropiosDelAsunto || []).length, DatosDePlantilla.datosDeTextos([t2], v, a).map((d) => [d.nombre, d.valor, d.falta]),
    Plantillas.rellenar(t1, v).texto.indexOf('a mano') !== -1];
}, [T1, T2]), [true, 1, [['Fecha de alegaciones', 'a mano', false]], true]);

await comprobar('3. cambiar el dato: regenerar usa el nuevo; el texto ya generado no cambia', p.evaluate(async ([t2]) => {
  const a = App.E.listaAbiertos[0];
  const antes = Plantillas.rellenar(t2, await Plantillas.valoresDeAsunto(a)).texto;
  await DatosDelAsunto.guardar(a, 'Fecha de alegaciones', 'nuevo');
  const despues = Plantillas.rellenar(t2, await Plantillas.valoresDeAsunto(a)).texto;
  return [antes, despues];
}, [T2]), ['Otra plantilla con a mano.', 'Otra plantilla con nuevo.']);

await comprobar('4. un campo de lista que decide un texto condicional se elige y se guarda', p.evaluate(async () => {
  const c = App.E.campos = App.E.campos || {};
  c.propios = (c.propios || []).concat([{ id: 'pq', nombre: 'Protocolo Q', clase: 'lista', valores: ['Sí', 'No'] }]);
  const a = App.E.listaAbiertos[0];
  const r = await DatosDelAsunto.guardar(a, 'Protocolo Q', 'No', ['Sí', 'No']);
  const v = await Plantillas.valoresDeAsunto(a);
  return [r.ok, Plantillas.rellenar('{si:Protocolo Q=Sí}Sí.\n\n{si:Protocolo Q=No}No.', v).texto];
}), [true, 'No.']);

await comprobar('5. un importe que no se entiende no se guarda', p.evaluate(async () => {
  App.E.campos.propios.push({ id: 'pi', nombre: 'Importe Z', clase: 'importe', valores: [] });
  const r = await DatosDelAsunto.guardar(App.E.listaAbiertos[0], 'Importe Z', 'abc');
  return [r.ok, !!r.aviso];
}), [false, true]);

await comprobar('6. la lista dibuja filas con «Pedirlo antes» en lo que falta', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const d = [{ nombre: 'Falta uno', valor: '', falta: true, info: { clase: 'texto' } }, { nombre: 'Está', valor: 'x', falta: false, info: { clase: 'texto' } }];
  const caja = document.createElement('div');
  caja.innerHTML = DatosDelAsuntoVista.html(a, d, { titulo: 'Plantilla «P»' });
  return [caja.querySelector('.dap-resumen').textContent, caja.querySelectorAll('.dap-antes-boton').length, caja.querySelectorAll('.dap-control').length];
}), ['Plantilla «P». Falta 1 de 2 datos; el resto ya está.', 1, 1]);

await comprobar('7. Tutor con custodia: cae solo con un tutor; con dos, no', p.evaluate(() => {
  const uno = DatosDelAsunto.completar({ tutor1: 'Ana', tutor2: '', campos: {} }).campos['Tutor con custodia'];
  const dos = DatosDelAsunto.completar({ tutor1: 'Ana', tutor2: 'Luis', campos: {} }).campos['Tutor con custodia'];
  return [uno, dos || '', DatosDelAsunto.infoDe('Tutor con custodia', App.E.listaAbiertos[0], { tutor1: 'Ana', tutor2: 'Luis' }).valores];
}), ['Ana', '', ['Ana', 'Luis']]);

await comprobar('8. «Pedirlo antes» solo este asunto en un hito no cambia el tipo', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const tipo = DatosDelAsunto.tipoDe(a);
  const antes = JSON.stringify(App.E.campos.porTipo[tipo] || []);
  const e = (await DatosDelAsunto.entradaDe('Protocolo Q', a)).entrada;
  await CampoColocar.colocar(a, e, { hito: 'h-x', titulo: 'X' }, 'aqui');
  const f = App.E.registro.asuntos[a.nombre];
  return [JSON.stringify(App.E.campos.porTipo[tipo] || []) === antes, (f.camposPropiosDelAsunto || []).some((c) => c.id === 'pq' && c.hito === 'h-x')];
}), [true, true]);

await comprobar('9. «Pedirlo antes» en la parte general sin pedirlo al crear: marca nueva en el tipo', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const tipo = DatosDelAsunto.tipoDe(a);
  await CampoColocar.colocar(a, { origen: 'propio', id: 'pi' }, 'general', 'guia');
  const c = (App.E.campos.porTipo[tipo] || []).filter((x) => x.id === 'pi')[0];
  const enNuevo = (App.E.campos.porTipo[tipo] || []).filter((x) => !x.hito && !x.sinPedirAlCrear).some((x) => x.id === 'pi');
  return [!!(c && c.sinPedirAlCrear), enNuevo];
}), [true, false]);

await comprobar('10. la acción «Pedir datos» guarda sus campos', p.evaluate(() => {
  const l = GuiasGuion.normalizar([{ texto: 'Pide', accion: 'pedir', receta: { campos: [{ origen: 'propio', id: 'pq' }, { origen: 'propio', id: 'pq' }, { origen: 'x', id: 'y' }] } }]);
  return [l[0].accion, l[0].receta.campos.length, Hitos.ACCIONES_GUION.indexOf('pedir') !== -1];
}), ['pedir', 1, true]);

await comprobar('11. «Dónde se pide» dice lo que hace cada tipo', p.evaluate(() => {
  const cfg = { porTipo: { A: [{ origen: 'propio', id: 'q' }], B: [{ origen: 'propio', id: 'q', sinPedirAlCrear: true }], C: [{ origen: 'propio', id: 'q', hito: 'h1' }] }, propios: [{ id: 'q', nombre: 'Q' }] };
  const c = CamposLista.reunir({ config: cfg, textos: [] }).filter((x) => x.propioId === 'q')[0];
  return c.dondeDetalle.map((d) => CamposLista.textoDonde(d, 'Título'));
}), ['A: al crear el asunto', 'B: en la parte general, sin pedirlo al crear', 'C: hito «Título»']);

await comprobar('12. «Faltan datos» fuera de una tarea guarda en el asunto', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const resp = WordFaltan.preguntar(['Dato nuevo W'], { asunto: a });
  await new Promise((r) => setTimeout(r, 300));
  document.getElementById('word-falta-0').value = 'escrito';
  document.getElementById('cuadro-aceptar').click();
  const r = await resp;
  const v = await Plantillas.valoresDeAsunto(a);
  return [r.accion, v.campos['Dato nuevo W']];
}), ['generar', 'escrito']);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
