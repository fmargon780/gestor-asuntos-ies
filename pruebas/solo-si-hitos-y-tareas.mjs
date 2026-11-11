/* Prueba en navegador de verdad de la fila 576
   (docs/576-SOLO-SI-EN-HITOS-Y-TAREAS.md): «Cuándo se hace» en hitos y tareas, y las
   preguntas de las guías que pasan solas a «Solo si».

   1. El modelo: `soloSi` se guarda en hitos y tareas, solo con al menos un valor; decide
      sale / quita / falta; la etiqueta amarilla dice «Solo si <campo>: <valor> o <valor>».
   2. Los hitos de un asunto: el que no toca no sale (salvo si ya está hecho), con el campo
      vacío salen todos con «Falta: <campo>», y «Paso N de M» solo cuenta lo que sale.
   3. El editor: «Cuándo se hace» en cada hito y cada tarea, con los campos de lista del tipo;
      sin campos de lista solo ofrece «Siempre»; ya no hay casilla de pregunta; un hito
      condicionado se sube con ↑; al guardar queda todo.
   4. La conversión: las preguntas pasan a un campo de lista y sus hitos a la lista única
      (también las de dentro de respuestas), y los asuntos abiertos conservan lo contestado.
   5. De punta a punta: con una guía con pregunta y un asunto abierto, `convertir()` deja el
      campo relleno, los hitos sueltos con su «Solo si» y la guía sin preguntas.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= 1. el modelo ================= */
console.log('--- 1. el modelo ---');
const CAMPOS = { propios: [{ id: 'pq', nombre: 'Quién lo pide', clase: 'lista', valores: ['Familia', 'Alumno mayor de edad', 'Jefatura de Estudios'] }],
                 porTipo: { FACTURA: [{ origen: 'propio', id: 'pq' }] }, calculados: [] };
await comprobar('sin valores marcados, «Cuándo se hace» es «Siempre»', pagina.evaluate(() =>
  [SoloSi.normalizar({ campo: 'X', valores: [] }), SoloSi.normalizar(null), SoloSi.normalizar({ campo: '', valores: ['a'] })]), [null, null, null]);
await comprobar('se guarda en un hito y en una tarea', pagina.evaluate(() => {
  const g = Guias.normalizar([{ id: 'p1', titulo: 'Valorar', soloSi: { campo: 'Quién lo pide', valores: ['Familia', 'Familia', 'Alumno mayor de edad'] },
    guion: [{ id: 'g1', texto: 'Avisar', soloSi: { campo: 'Quién lo pide', valores: ['Familia'] } }, { id: 'g2', texto: 'Archivar' }] }]);
  return [g[0].soloSi, g[0].guion[0].soloSi, g[0].guion[1].soloSi || null];
}), [{ campo: 'Quién lo pide', valores: ['Familia', 'Alumno mayor de edad'] }, { campo: 'Quién lo pide', valores: ['Familia'] }, null]);
await comprobar('sale / quita / falta', pagina.evaluate(() => {
  const c = { campo: 'Quién lo pide', valores: ['Familia', 'Alumno mayor de edad'] };
  const l = { 'Quién lo pide': ['Familia', 'Alumno mayor de edad', 'Jefatura de Estudios'] };
  return [SoloSi.estado(c, { campos: { 'Quién lo pide': 'Familia' }, camposLista: l }),
          SoloSi.estado(c, { campos: { 'quién lo pide': 'alumno mayor de edad' }, camposLista: l }),
          SoloSi.estado(c, { campos: { 'Quién lo pide': 'Jefatura de Estudios' }, camposLista: l }),
          SoloSi.estado(c, { campos: {}, camposLista: l }),
          SoloSi.estado(c, { campos: { 'Quién lo pide': 'Familia' }, camposLista: {} }),
          SoloSi.estado(null, {})];
}), ['sale', 'sale', 'quita', 'falta', 'falta', 'sale']);
await comprobar('la etiqueta amarilla', pagina.evaluate(() =>
  [SoloSi.etiqueta({ campo: 'Quién lo pide', valores: ['Familia', 'Alumno mayor de edad'] }), SoloSi.etiqueta(null)]),
  ['Solo si Quién lo pide: Familia o Alumno mayor de edad', '']);
await comprobar('dos condiciones a la vez: las dos tienen que cumplirse', pagina.evaluate(() => {
  const c = SoloSi.sumar({ campo: 'A', valores: ['1'] }, { campo: 'B', valores: ['x'] });
  const l = { A: ['1', '2'], B: ['x', 'y'] };
  return [c.ademas.length, SoloSi.estado(c, { campos: { A: '1', B: 'x' }, camposLista: l }), SoloSi.estado(c, { campos: { A: '1', B: 'y' }, camposLista: l }),
          SoloSi.estado(c, { campos: { A: '1' }, camposLista: l }), SoloSi.detalle(c, { campos: { A: '1' }, camposLista: l }).campo];
}), [1, 'sale', 'quita', 'falta', 'B']);

/* ================= 2. los hitos de un asunto ================= */
console.log('--- 2. los hitos de un asunto ---');
const hitosPrueba = () => pagina.evaluate((CAMPOS) => {
  const si = { campo: 'Quién lo pide', valores: ['Familia', 'Alumno mayor de edad'] };
  const lista = () => ['h1', 'h2', 'h3', 'h4'].map((id, i) => Hitos.normalizarHito({ id, titulo: id, estado: i === 0 ? 'hecho' : 'pendiente', soloSi: i === 1 || i === 0 ? si : null }));
  const v = (valor) => ({ campos: valor ? { 'Quién lo pide': valor } : {}, camposLista: { 'Quién lo pide': CAMPOS.propios[0].valores } });
  const ver = (valor) => { const l = lista(); SoloSi.marcarLista(l, v(valor)); return [Hitos.visibles(l).map(h => h.id), Hitos.cuenta(l), l[1].faltaCampo || '']; };
  return { familia: ver('Familia'), jefatura: ver('Jefatura de Estudios'), vacio: ver('') };
}, CAMPOS);
const hp = await hitosPrueba();
await comprobar('el campo vale uno de los marcados: sale', Promise.resolve(hp.familia), [['h1', 'h2', 'h3', 'h4'], { hechos: 1, total: 4 }, '']);
await comprobar('otro valor: el que no toca desaparece, el hecho se queda', Promise.resolve(hp.jefatura), [['h1', 'h3', 'h4'], { hechos: 1, total: 3 }, '']);
await comprobar('campo vacío: salen todos y el condicionado lleva «Falta»', Promise.resolve(hp.vacio), [['h1', 'h2', 'h3', 'h4'], { hechos: 1, total: 4 }, 'Quién lo pide']);

/* ================= 3. el editor ================= */
console.log('--- 3. el editor ---');
const GUIA = [
  { id: 'p1', titulo: 'Recibir la solicitud' },
  { id: 'p2', titulo: 'Valorar', guion: [{ id: 'g1', texto: 'Avisar a la familia' }, { id: 'g2', texto: 'Archivar' }] },
  { id: 'p3', titulo: 'Resolver' }
];
async function abrir(tipo, campos) {
  await pagina.evaluate(([GUIA, tipo, campos]) => {
    App.E.campos = campos;
    window.__guardada = Guias.editar(tipo, JSON.parse(JSON.stringify(GUIA)), [], []);
  }, [GUIA, tipo, campos]);
  await pagina.waitForSelector('#guia-pasos .paso-editor', { state: 'attached' });
}
async function elegirHito(id) { await pagina.click('#guia-lista .guia-lista-item[data-paso-id="' + id + '"]'); await pagina.waitForTimeout(50); }
const E = (id) => '#guia-pasos > .paso-editor[data-paso-id="' + id + '"]';

await abrir('FACTURA', CAMPOS);
await comprobar('cada hito tiene «Cuándo se hace», con «Siempre» y el campo de lista del tipo', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos > .paso-editor')).map(e => Array.from(e.querySelectorAll(':scope > .cuando-bloque .cuando-campo option')).map(o => o.textContent))),
  [0, 1, 2].map(() => ['Siempre', 'Solo si el campo «Quién lo pide» vale…', '+ Nuevo campo de lista…']));   /* fila 615: la última opción */
await comprobar('ya no hay casilla de pregunta en un hito normal', pagina.locator('#guia-pasos .paso-es-pregunta-fila').count(), 0);
await elegirHito('p2');
await pagina.selectOption(E('p2') + ' > .cuando-bloque .cuando-campo', 'Quién lo pide');
await comprobar('al elegir el campo salen sus opciones como casillas, sin marcar', pagina.evaluate((s) =>
  Array.from(document.querySelectorAll(s + ' > .cuando-bloque .cuando-valor')).map(c => [c.value, c.checked]), E('p2')),
  [['Familia', false], ['Alumno mayor de edad', false], ['Jefatura de Estudios', false]]);
await comprobar('y la nota de abajo', pagina.evaluate((s) => document.querySelector(s + ' > .cuando-bloque .cuando-nota').textContent, E('p2')),
  'En el asunto, si el campo tiene otro valor, esto no sale.');
await pagina.check(E('p2') + ' > .cuando-bloque .cuando-valor[value="Familia"]');
await pagina.check(E('p2') + ' > .cuando-bloque .cuando-valor[value="Alumno mayor de edad"]');
await comprobar('la tira de hitos lleva la etiqueta amarilla', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-lista .guia-lista-item')).map(b => (b.querySelector('.solo-si-etiqueta') || {}).textContent || '')),
  ['', 'Solo si Quién lo pide: Familia o Alumno mayor de edad', '']);
/* una tarea */
await pagina.click(E('p2') + ' .guion-fila[data-id="g1"] > .guion-resumen');
await comprobar('la tarea abierta tiene «Cuándo se hace»', pagina.locator(E('p2') + ' .guion-fila[data-id="g1"] > .cuando-bloque .cuando-campo').count(), 1);
await pagina.selectOption(E('p2') + ' .guion-fila[data-id="g1"] > .cuando-bloque .cuando-campo', 'Quién lo pide');
await pagina.check(E('p2') + ' .guion-fila[data-id="g1"] > .cuando-bloque .cuando-valor[value="Familia"]');
await comprobar('la línea de la tarea lleva su etiqueta', pagina.evaluate((s) => {
  const e = document.querySelector(s + ' .guion-fila[data-id="g1"] > .guion-resumen .guion-resumen-si');
  return e && !e.hidden ? e.textContent : '';
}, E('p2')), 'Solo si Quién lo pide: Familia');
/* sube con ↑ */
await pagina.click(E('p2') + ' .paso-mandos button[data-ayuda="Subir este hito"]');
await comprobar('el hito condicionado se sube con ↑', pagina.evaluate(() => Array.from(document.querySelectorAll('#guia-lista .guia-lista-titulo')).map(t => t.textContent)),
  ['Valorar', 'Recibir la solicitud', 'Resolver']);
/* un campo sin ningún valor se guarda como «Siempre» */
await elegirHito('p3');
await pagina.selectOption(E('p3') + ' > .cuando-bloque .cuando-campo', 'Quién lo pide');
await pagina.evaluate(() => { const bs = Array.from(document.querySelectorAll('#capa .cuadro button')); bs.filter(b => /^Guardar$/.test(b.textContent.trim()))[0].click(); });
await pagina.waitForTimeout(300);
const guardada = await pagina.evaluate(() => window.__guardada);
await comprobar('al guardar: el hito y la tarea llevan su condición; sin valores es «Siempre»', Promise.resolve([
  guardada.map(p => p.id),
  guardada.find(p => p.id === 'p2').soloSi,
  guardada.find(p => p.id === 'p2').guion.find(g => g.id === 'g1').soloSi,
  guardada.find(p => p.id === 'p2').guion.find(g => g.id === 'g2').soloSi || null,
  guardada.find(p => p.id === 'p3').soloSi || null]),
  [['p2', 'p1', 'p3'], { campo: 'Quién lo pide', valores: ['Familia', 'Alumno mayor de edad'] }, { campo: 'Quién lo pide', valores: ['Familia'] }, null, null]);

/* un tipo sin campos de lista: solo «Siempre» */
await abrir('SIN-CAMPOS', { propios: [], porTipo: {}, calculados: [] });
await comprobar('sin campos de lista, el desplegable solo ofrece «Siempre»', pagina.evaluate(() =>
  Array.from(document.querySelectorAll('#guia-pasos > .paso-editor .cuando-campo option')).map(o => o.textContent).filter((t, i, a) => a.indexOf(t) === i)), ['Siempre']);
await pagina.evaluate(() => { const bs = Array.from(document.querySelectorAll('#capa .cuadro button')); (bs.filter(b => /^(Cancelar|Cerrar)$/.test(b.textContent.trim()))[0] || bs[0]).click(); });

/* ================= 4. la conversión ================= */
console.log('--- 4. la conversión ---');
const PREG = [
  { id: 'p1', titulo: 'Registrar' },
  { id: 'q1', titulo: '¿Quién lo pide?', opciones: [
    { id: 'a', titulo: 'Familia', pasos: [{ id: 'a1', titulo: 'Sellar' },
      { id: 'q2', titulo: '¿Viene completa?', opciones: [{ id: 's', titulo: 'Sí', pasos: [{ id: 's1', titulo: 'Archivar copia' }] }, { id: 'n', titulo: 'No', pasos: [{ id: 'n1', titulo: 'Pedir lo que falta' }] }] }] },
    { id: 'b', titulo: 'Alumno mayor de edad', pasos: [{ id: 'b1', titulo: 'Comprobar el DNI' }] }] },
  { id: 'p9', titulo: 'Firma del director' }
];
const conv = await pagina.evaluate((PREG) => {
  const G = GuiasSinPreguntas;
  const plan = G.planificar(Guias.normalizar(PREG), [{ id: 'x', nombre: '¿Quién lo pide?', clase: 'lista', valores: ['Familia'] }]);
  const pasos = G.aplanarPasos(Guias.normalizar(PREG), plan);
  return {
    campos: plan.campos.map(c => [c.nombre, c.valores, c.nuevo]),
    ids: pasos.map(p => p.id),
    si: pasos.map(p => p.soloSi ? SoloSi.etiqueta(p.soloSi) : ''),
    sinPreguntas: !G.hayPreguntas(pasos)
  };
}, PREG);
await comprobar('la pregunta se llama «(respuesta)» si el campo que ya había no casa; la de dentro también es un campo',
  Promise.resolve(conv.campos), [['¿Quién lo pide? (respuesta)', ['Familia', 'Alumno mayor de edad'], true], ['¿Viene completa?', ['Sí', 'No'], true]]);
await comprobar('los hitos de las respuestas pasan a la lista única, en el sitio de la pregunta', Promise.resolve(conv.ids), ['p1', 'a1', 's1', 'n1', 'b1', 'p9']);
await comprobar('cada uno con su «Solo si», sumando las condiciones de arriba', Promise.resolve(conv.si),
  ['', 'Solo si ¿Quién lo pide? (respuesta): Familia', 'Solo si ¿Quién lo pide? (respuesta): Familia y ¿Viene completa?: Sí',
   'Solo si ¿Quién lo pide? (respuesta): Familia y ¿Viene completa?: No', 'Solo si ¿Quién lo pide? (respuesta): Alumno mayor de edad', '']);
await comprobar('la guía ya no tiene preguntas', Promise.resolve(conv.sinPreguntas), true);

const asunto = await pagina.evaluate((PREG) => {
  const G = GuiasSinPreguntas;
  const plan = G.planificar(Guias.normalizar(PREG), []);
  const hitos = Guias.normalizar(PREG).map(Hitos.pasoAHito);
  const q1 = hitos[1];
  q1.elegida = 'a'; q1.estado = 'hecho';
  q1.opciones[0].hitos[0].estado = 'hecho';
  q1.opciones[1].hitos[0].estado = 'noaplica';
  const r = G.aplanarHitos(hitos, plan);
  return { ids: r.hitos.map(h => [h.id, h.estado, h.soloSi ? SoloSi.etiqueta(h.soloSi) : '']), valores: r.valores, hayDecision: r.hitos.some(h => h.clase === 'decision') };
}, PREG);
await comprobar('un asunto que ya contestó: el campo queda con la respuesta', Promise.resolve(asunto.valores), { '¿Quién lo pide?': 'Familia' });
await comprobar('sus hitos pasan a la lista única; lo de la otra respuesta vuelve a pendiente', Promise.resolve(asunto.ids),
  [['p1', 'pendiente', ''], ['a1', 'hecho', 'Solo si ¿Quién lo pide?: Familia'], ['s1', 'pendiente', 'Solo si ¿Quién lo pide?: Familia y ¿Viene completa?: Sí'],
   ['n1', 'pendiente', 'Solo si ¿Quién lo pide?: Familia y ¿Viene completa?: No'], ['b1', 'pendiente', 'Solo si ¿Quién lo pide?: Alumno mayor de edad'], ['p9', 'pendiente', '']]);
await comprobar('no queda ningún hito-pregunta', Promise.resolve(asunto.hayDecision), false);

/* ================= 5. de punta a punta ================= */
console.log('--- 5. convertir() con el disco de mentira ---');
const punta = await pagina.evaluate(async ([PREG]) => {
  const clave = '260101 FACTURA Pepe';
  App.E.campos = { propios: [], porTipo: {}, calculados: [] };
  await App.guardarRegistroFresco(function (registro) {
    registro.asuntos = registro.asuntos || {};
    registro.asuntos[clave] = { tipo: 'FACTURA', campos: {} };
  });
  const hitos = Guias.normalizar(PREG).map(Hitos.pasoAHito);
  hitos[1].elegida = 'b'; hitos[1].estado = 'hecho';
  await Hitos.cambiar(d => { d.porAsunto[clave] = { creados: U.hoyIso(), hitos }; return d; });
  /* La guía va la última: al guardarla, la aplicación se refresca y la conversión arranca sola. */
  await GuiasDelCentro._guardarTipo('FACTURA', Guias.normalizar(PREG));
  await GuiasDelCentro.recargar();
  const r = await GuiasSinPreguntas.convertir();
  const hasta = Date.now() + 15000;
  while ((GuiasSinPreguntas.ocupado() || GuiasDelCentro.todas().FACTURA.some(p => (p.opciones || []).length)) && Date.now() < hasta) await new Promise(ok => setTimeout(ok, 100));
  const datos = await Hitos.leer();
  return {
    fallo: GuiasSinPreguntas.error(),
    guia: GuiasDelCentro.todas().FACTURA.map(p => p.id),
    sinPreguntas: !GuiasDelCentro.todas().FACTURA.some(p => (p.opciones || []).length),
    campos: App.E.campos.propios.slice(0, 2).map(p => [p.nombre, p.valores]),
    enElTipo: (App.E.campos.porTipo.FACTURA || []).length,
    ficha: Object.keys(App.E.registro.asuntos[clave].campos).map(k => App.E.registro.asuntos[clave].campos[k].valor),
    hitos: datos.porAsunto[clave].hitos.map(h => [h.id, h.cond || ''])
  };
}, [PREG]);
await comprobar('la guía guardada ya no tiene preguntas y sí los hitos sueltos', Promise.resolve([punta.guia, punta.sinPreguntas]), [['p1', 'a1', 's1', 'n1', 'b1', 'p9'], true]);
await comprobar('los campos están creados y puestos en el tipo', Promise.resolve([punta.campos, punta.enElTipo]),
  [[['¿Quién lo pide?', ['Familia', 'Alumno mayor de edad']], ['¿Viene completa?', ['Sí', 'No']]], 2]);
await comprobar('el asunto abierto tiene el campo con lo que había contestado', Promise.resolve(punta.ficha), ['Alumno mayor de edad']);
await comprobar('y solo salen los hitos que tocan', Promise.resolve(punta.hitos), [['p1', ''], ['a1', 'quita'], ['s1', 'quita'], ['n1', 'quita'], ['b1', ''], ['p9', '']]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
