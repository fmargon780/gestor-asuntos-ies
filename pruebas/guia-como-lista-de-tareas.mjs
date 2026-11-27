/* Prueba de la fila 701 de docs/COLA.md (docs/701-GUIA-COMO-LISTA-DE-TAREAS.md): la guía de un tipo «sin hitos» es una lista de
   frases con «Solo si» (un dato de lista o la clase del tercero); el asunto nuevo nace con ellas; «⋯» › «Cambiar la guía…»;
   lo añadido a la guía llega a los asuntos abiertos y lo cambiado no; «Falta: <dato>» se rellena ahí mismo. Con Chromium real y
   los datos inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

const tareasPantalla = () => pagina.locator('#ficha-guia .ash-tarea .ash-texto-tarea').allTextContents();
async function abrirFicha(clave) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(300);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .ash', { timeout: 10000 });
  await pagina.waitForTimeout(400);
}
async function aceptarEditor() { await pagina.evaluate(() => (document.getElementById('gsh-guardar') || document.getElementById('cuadro-aceptar')).click()); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); await pagina.waitForTimeout(400); }

console.log('--- el tipo ---');
/* El asunto de la demostración y su tipo pasan a ser «sin hitos»; la clase del tercero es la suya. */
const { NUEVO, TIPO, CLASE, OTRA } = await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const t = App.tipoDeAsunto(a);
  const tipo = App.E.tipos.filter((x) => x.tipo === t)[0];
  tipo.sinHitos = true;
  await App.guardarTipos();
  const clase = SoloSi.valoresDe(SoloSi.asuntoDeClave(a.nombre)).campos[SoloSi.CAMPO_TERCERO] || '';
  return { NUEVO: a.nombre, TIPO: t, CLASE: clase, OTRA: ['Alumnado', 'Personal'].filter((c) => c !== clase)[0] };
});
console.log('   (asunto ' + NUEVO + ', tipo ' + TIPO + ', clase del tercero «' + CLASE + '»)');
await comprobar('1. el tipo es «sin hitos» y el asunto tiene clase de tercero', pagina.evaluate((t) => AsuntoSinHitos.tipoSinHitos(t), TIPO).then(async (v) => [v, CLASE !== '']), [true, true]);

console.log('--- el editor de la guía ---');
pagina.evaluate((t) => GuiasDelCentro.escribir(t, { aviso: 'Vale para todos los asuntos de ' + t + ', no solo para este.' }), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista');
await comprobar('2. es una lista de frases: sin hitos, fases, responsables, plazos ni «Qué se hace»', pagina.evaluate(() => [
  document.querySelectorAll('#cuadro-cuerpo .paso-editor').length, document.querySelectorAll('#cuadro-cuerpo .paso-responsable').length,
  document.querySelectorAll('#cuadro-cuerpo .paso-plazo-dias').length, document.querySelectorAll('#cuadro-cuerpo .guion-accion').length, !!document.getElementById('guia-ver-mapa')]),
  [0, 0, 0, 0, false]);
await comprobar('2. avisa de que vale para todos los asuntos del tipo', pagina.locator('#cuadro-cuerpo .guia-aviso').innerText(), 'Vale para todos los asuntos de ' + TIPO + ', no solo para este.');
for (const t of ['Pedir el certificado', 'Avisar al personal', 'Enviar la carta']) {
  await pagina.click('#gsh-anadir');
  await pagina.locator('#gsh-lista .gsh-texto').last().fill(t);
}
const fila = (n) => pagina.locator('#gsh-lista .gsh-fila').nth(n);
const der = pagina.locator('#gsh-der');   /* fila 737: la tarea elegida, a la derecha */
await comprobar('3. «Cuándo se hace» ofrece «Siempre» y «Solo si el tercero es…»', fila(1).click().then(() => der.locator('.cuando-campo option').allTextContents()).then((l) => l.slice(0, 2)), ['Siempre', 'Solo si el tercero es…']);
await der.locator('.cuando-campo').selectOption({ label: 'Solo si el tercero es…' });
await comprobar('3. salen las clases de tercero del tipo', der.locator('.cuando-valor').evaluateAll((l) => l.map((x) => x.value)), await pagina.evaluate((t) => SoloSi.clasesDelTipo(t), TIPO));
await der.locator('.cuando-campo').selectOption({ label: 'Solo si el alumno es de…' });
await comprobar('3. «Solo si el alumno es de…» ofrece las tres enseñanzas y su nota', [await der.locator('.cuando-valor').evaluateAll((l) => l.map((x) => x.value)), await der.locator('.cuando-nota').first().innerText()],
  [['E.S.O.', 'Bachillerato', 'Formación Profesional'], 'En el asunto, si el alumno es de otra enseñanza, esto no sale.']);
await der.locator('.cuando-campo').selectOption({ label: 'Solo si el tercero es…' });
await der.locator('.cuando-valor[value="' + CLASE + '"]').check();   /* «Avisar al personal»: solo si el tercero es de su clase (sale) */
await fila(2).click();
await pagina.click('#gsh-subir');
await comprobar('3. ↑ sube una tarea', pagina.locator('#gsh-lista .gsh-texto').evaluateAll((l) => l.map((x) => x.value)), ['Pedir el certificado', 'Enviar la carta', 'Avisar al personal']);
await aceptarEditor();
await comprobar('4. se guarda como un paso de lista de tareas con sus frases y su «Solo si»', pagina.evaluate((t) => {
  const p = GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0];
  return p && p.guion.map((g) => [g.texto, g.soloSi ? SoloSi.etiqueta(g.soloSi) : '']);
}, TIPO), [['Pedir el certificado', ''], ['Enviar la carta', ''], ['Avisar al personal', 'Solo si el tercero es ' + CLASE]]);

await comprobar('4. «Nuevo asunto» y Ajustes hablan de tareas, no de hitos', pagina.evaluate((t) => {
  const tipo = App.E.tipos.filter((x) => x.tipo === t)[0];
  const comp = (window.AjustesTipoComprobacion && AjustesTipoComprobacion.calcular ? AjustesTipoComprobacion.calcular(tipo) : []).filter((i) => i.id === 'guia').map((i) => i.texto);
  return [/3 tareas/.test(Guias.resumenDeTipo(tipo).texto), /hito/.test(Guias.resumenDeTipo(tipo).texto), comp.every((x) => !/hito/.test(x))];
}, TIPO), [true, false, true]);

console.log('--- el asunto nuevo ---');
await pagina.evaluate(async ([k, t]) => {   /* como un asunto recién nacido: sin hitos todavía, y nace al crearlos */
  await Hitos.cambiar((d) => { delete d.porAsunto[k]; return d; });
  await Hitos.crearDesdeGuia(k, t);
}, [NUEVO, TIPO]);
await abrirFicha(NUEVO);
await comprobar('5. nace con las tareas de su guía, en su orden', tareasPantalla(), ['Pedir el certificado', 'Enviar la carta', 'Avisar al personal']);
await comprobar('5. las de la guía no llevan «solo aquí»', pagina.locator('#ficha-guia .ash-etq').count(), 0);
await comprobar('5. el hito oculto lleva la copia, con su «Solo si»', pagina.evaluate(async (k) => {
  const h = (await Hitos.hitosDe(k)).filter((x) => x.listaDeTareas)[0];
  return h.guionPropio.map((g) => [g.texto, !!g.deGuia, g.soloSi ? g.soloSi.campo : '']);
}, NUEVO), [['Pedir el certificado', true, ''], ['Enviar la carta', true, ''], ['Avisar al personal', true, 'Clase del tercero']]);

console.log('--- «Cambiar la guía…» ---');
await comprobar('6. «⋯» lleva «Cambiar la guía…»', pagina.evaluate(() => { const b = document.querySelector('.ficha-nombre [data-clave="cambiar-guia"]'); return !!b && !b.hidden; }), true);
await pagina.click('.ficha-nombre-menu-boton');
await pagina.click('.ficha-menu:not(.oculto) [data-clave="cambiar-guia"]');
await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista');
await comprobar('6. avisa de que vale para todos los asuntos del tipo y abre la guía de ese tipo', pagina.evaluate(() => [
  document.querySelector('#cuadro-cuerpo .guia-aviso').textContent, document.getElementById('cuadro-titulo').textContent]),
  ['Vale para todos los asuntos de ' + TIPO + ', no solo para este.', 'Guía de ' + TIPO]);

console.log('--- lo añadido llega, lo cambiado no ---');
await pagina.locator('#gsh-lista .gsh-texto').first().fill('Pedir el certificado de notas');   /* un cambio de frase */
await pagina.click('#gsh-anadir');
await pagina.locator('#gsh-lista .gsh-texto').last().fill('Archivar la copia');
await aceptarEditor();
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea').length === 4, null, { timeout: 8000 });
await comprobar('7. la tarea añadida sale en el asunto abierto y la frase cambiada en la guía no cambia la del asunto', tareasPantalla(), ['Pedir el certificado', 'Enviar la carta', 'Avisar al personal', 'Archivar la copia']);
await comprobar('7. la tarea nueva sin marca «solo aquí»', pagina.locator('#ficha-guia .ash-etq').count(), 0);
await pagina.locator('#ficha-guia .ash-tarea').nth(3).locator('.ash-menu-boton').click();
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Borrar');
await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea').length === 3);
await pagina.evaluate((t) => AsuntoSinHitosGuia.llevar(t, GuiasDelCentro.pasosDe(t)), TIPO);
await pagina.waitForTimeout(300);
await comprobar('7. una tarea borrada en el asunto no vuelve a llegar', pagina.evaluate(async (k) => (await Hitos.hitosDe(k)).filter((x) => x.listaDeTareas)[0].guionPropio.map((g) => g.texto), NUEVO), ['Pedir el certificado', 'Enviar la carta', 'Avisar al personal']);

console.log('--- «Solo si»: la clase del tercero ---');
await comprobar('8. con un tercero de otra clase la tarea no sale; con la suya, sí', pagina.evaluate(([c, otra]) => {
  const si = SoloSi.normalizar({ campo: SoloSi.CAMPO_TERCERO, valores: [c] });
  const v = (valor) => ({ campos: { [SoloSi.CAMPO_TERCERO]: valor }, camposLista: { [SoloSi.CAMPO_TERCERO]: [c, otra] } });
  return [SoloSi.estado(si, v(c)), SoloSi.estado(si, v(otra)), SoloSi.estado(si, { campos: {}, camposLista: v(c).camposLista }), SoloSi.etiqueta(si)];
}, [CLASE, OTRA]), ['sale', 'quita', 'falta', 'Solo si el tercero es ' + CLASE]);

console.log('--- «Solo si»: la enseñanza del alumno (fila 781) ---');
await comprobar('8b. con un alumno de ESO sale, de Bachillerato no, sin unidad «falta», y la etiqueta', pagina.evaluate(() => {
  const si = SoloSi.normalizar({ campo: SoloSi.CAMPO_ENSENANZA, valores: ['E.S.O.'] });
  const v = (valor) => ({ campos: valor ? { [SoloSi.CAMPO_ENSENANZA]: valor } : {}, camposLista: { [SoloSi.CAMPO_ENSENANZA]: SoloSi.ENSENANZAS } });
  return [SoloSi.estado(si, v('E.S.O.')), SoloSi.estado(si, v('Bachillerato')), SoloSi.estado(si, v('')), SoloSi.etiqueta(si)];
}), ['sale', 'quita', 'falta', 'Solo si el alumno es de E.S.O.']);
await comprobar('8b. la enseñanza sale de la unidad (la Diversificación cuenta como E.S.O.)', pagina.evaluate(() =>
  ['3º ESO A', '1º Bachillerato B', '2º FP Básica', '2º PMAR', 'sin número', ''].map((u) => SoloSi.ensenanzaDeUnidad(u))),
  ['E.S.O.', 'Bachillerato', 'Formación Profesional', 'E.S.O.', '', '']);
await comprobar('8b. en un asunto, la enseñanza de la unidad de su ficha', pagina.evaluate((k) => {
  const a = SoloSi.asuntoDeClave(k);
  const con = (g) => { a.ficha = Object.assign({}, a.ficha, { grupo: g }); const v = SoloSi.valoresDe(a); return [v.campos[SoloSi.CAMPO_ENSENANZA] || '', v.camposLista[SoloSi.CAMPO_ENSENANZA].length]; };
  return [con('3º ESO A'), con('1º Bachillerato B')];
}, NUEVO), [['E.S.O.', 3], ['Bachillerato', 3]]);

console.log('--- «Solo si» con un dato de lista: «Falta: …» se rellena ahí mismo ---');
await pagina.evaluate(async (t) => {
  App.E.campos.propios = (App.E.campos.propios || []).concat([{ id: 'pq701', nombre: 'Motivo 701', clase: 'lista', valores: ['Traslado', 'Otro'] }]);
  App.E.campos.porTipo = App.E.campos.porTipo || {};
  App.E.campos.porTipo[t] = (App.E.campos.porTipo[t] || []).concat([{ origen: 'propio', id: 'pq701', obligatorio: false, enNombre: false }]);
  const pasos = GuiasDelCentro.pasosDe(t);
  pasos.filter((p) => p.listaDeTareas)[0].guion.push({ id: 'gx', texto: 'Pedir el traslado', soloSi: { campo: 'Motivo 701', valores: ['Traslado'] } });
  await GuiasDelCentro.guardarPasos(t, pasos);
  await AsuntoSinHitosGuia.llevar(t, GuiasDelCentro.pasosDe(t));
}, TIPO);
await abrirFicha(NUEVO);
await comprobar('9. con el dato vacío la tarea sale en amarillo con «Falta: Motivo 701»', pagina.locator('#ficha-guia .ash-tarea.falta .ash-falta').allTextContents(), ['Falta: Motivo 701']);
await comprobar('9. y cuenta en «N de M»', pagina.locator('#ficha-guia .ash-cuenta').textContent(), '0 de 4 tareas hechas');
await pagina.click('#ficha-guia .ash-falta');
await pagina.selectOption('#ficha-guia .ash-rellenar-valor', 'Otro');
await pagina.waitForFunction(() => !document.querySelector('#ficha-guia .ash-falta') && document.querySelectorAll('#ficha-guia .ash-tarea').length === 3, null, { timeout: 8000 });
await comprobar('9. al elegir «Otro» la tarea que no toca desaparece y no cuenta', [await tareasPantalla(), await pagina.locator('#ficha-guia .ash-cuenta').textContent()],
  [['Pedir el certificado', 'Enviar la carta', 'Avisar al personal'], '0 de 3 tareas hechas']);
await comprobar('9. el dato queda guardado en «Datos» del asunto', pagina.evaluate((k) => JSON.stringify(App.E.registro.asuntos[k].campos || {}).indexOf('Otro') !== -1, NUEVO), true);

await comprobar('9. en Inicio tampoco cuentan las que no salen', pagina.evaluate((k) => Hitos.ladoDeAsunto(Gestor.asuntos().filter((x) => x.nombre === k)[0]).texto, NUEVO), 'Tarea 1 de 3 · Pedir el certificado');

console.log('--- Ajustes › Guía de un tipo sin hitos ---');
await pagina.evaluate((t) => App.abrirTipoDeAsunto(App.E.tipos.filter((x) => x.tipo === t)[0]), TIPO);
await pagina.waitForSelector('#pantalla-tipo-asunto details[data-seccion="pasos"] .gsh-vista', { state: 'attached' });
const textoGuia = () => pagina.evaluate(() => { const d = document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"]'); return d.textContent; });
const sinHito = () => pagina.evaluate(() => {
  const d = document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"]');
  const comp = document.querySelector('#pantalla-tipo-asunto').textContent;
  return [/hito|bifurcaci/i.test(d.textContent), /Guía \(\d+ hitos?\)/.test(comp), /5 tareas/.test(d.querySelector('summary').textContent), !!d.querySelector('.guia-vista, .tarjeta-paso'), !!Array.prototype.some.call(d.querySelectorAll('button'), (b) => b.textContent === 'Ver mapa')];
});
await comprobar('11. Ajustes › Guía enseña las tareas y habla solo de tareas', sinHito(), [false, false, true, false, false]);
await comprobar('11. las frases salen en su orden, con su «Solo si»', pagina.locator('#pantalla-tipo-asunto .gsh-vista li').allTextContents(),
  ['Pedir el certificado de notas', 'Enviar la carta', 'Avisar al personal · Solo si el tercero es ' + CLASE, 'Archivar la copia', 'Pedir el traslado · Solo si Motivo 701: Traslado']);
pagina.evaluate((t) => GuiasDelCentro.escribir(t), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #gsh-lista');
await pagina.locator('#gsh-lista .gsh-fila').nth(2).click();
await comprobar('11. la nota de «Solo si el tercero es…» habla del tercero', pagina.locator('#gsh-der .cuando-nota').first().innerText(), 'En el asunto, si el tercero es de otra clase, esto no sale.');
await pagina.click('#gsh-cancelar');
await pagina.waitForTimeout(300);
await comprobar('11. «Nuevo asunto» de un tipo sin hitos y sin guía no habla de hitos', pagina.evaluate(() => {
  const t = { tipo: 'PRUEBA 701 SIN GUIA', categoria: App.E.tipos[0].categoria, sinHitos: true };
  App.E.tipos.push(t); const r = Guias.resumenDeTipo(t).texto; App.E.tipos.pop(); return r;
}), 'Sin guía: el asunto se crea con la lista de tareas vacía.');
await pagina.locator('#pantalla-tipo-asunto details[data-seccion="datos"]').evaluate((d) => { d.open = true; });
await pagina.locator('#pantalla-tipo-asunto label', { hasText: 'Sin hitos: el asunto es una lista de tareas' }).locator('input').uncheck();
await pagina.waitForFunction(() => !document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"] .gsh-vista'), null, { timeout: 8000 });
await comprobar('11. al desmarcar la casilla, la Guía vuelve a la de hitos sin volver a entrar', pagina.evaluate(() => /bifurcaciones/.test(document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"] summary').textContent)), true);
await comprobar('11. al desmarcar, la lista de tareas guardada no sale como un hito', pagina.evaluate((t) => [GuiasDelCentro.pasosDe(t).some((p) => p.listaDeTareas), /Tareas/.test(document.querySelector('#pantalla-tipo-asunto details[data-seccion="pasos"] .bloque-cuerpo').textContent)], TIPO), [false, false]);
await pagina.locator('#pantalla-tipo-asunto label', { hasText: 'Sin hitos: el asunto es una lista de tareas' }).locator('input').check();
await pagina.waitForSelector('#pantalla-tipo-asunto details[data-seccion="pasos"] .gsh-vista', { state: 'attached', timeout: 8000 });
await comprobar('11. al marcarla, vuelve la lista de tareas sin volver a entrar', sinHito(), [false, false, true, false, false]);
await comprobar('11. en «Campos» de un tipo sin hitos no se elige hito', pagina.locator('#pantalla-tipo-asunto details[data-seccion="campos"] .campo-hito-select').count(), 0);
await pagina.evaluate(() => App.cerrarTipoDeAsunto());

console.log('--- sin cambios en los demás ---');
await pagina.evaluate(async (t) => { App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = false; await App.guardarTipos(); }, TIPO);
pagina.evaluate((t) => GuiasDelCentro.escribir(t), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo .guia-dos-col');
await comprobar('10. un tipo sin la casilla se edita con el editor de siempre', pagina.evaluate(() => [!!document.getElementById('gsh-lista'), !!document.getElementById('guia-anadir')]), [false, true]);
await comprobar('10. y no enseña la lista de tareas guardada como un hito', pagina.evaluate(() => /Tareas/.test(Array.prototype.map.call(document.querySelectorAll('#cuadro-cuerpo .paso-titulo, #cuadro-cuerpo input.paso-titulo'), (x) => x.value || x.textContent).join('|'))), false);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('10. al guardar la guía de hitos, la lista de tareas guardada se conserva', pagina.evaluate(async (t) => { await GuiasDelCentro.ponerAlDia(); App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = true; const n = AsuntoSinHitosGuia.tareasDe(GuiasDelCentro.pasosDe(t)).length; App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = false; return n; }, TIPO), 5);

console.log('--- «Solo si» por enseñanza, con la unidad que da el Centro de datos (fila 781) ---');
await comprobar('8c. un tercero que no es alumno sigue con «Falta» (sin unidad)', pagina.evaluate(() => SoloSi.estado(SoloSi.normalizar({ campo: SoloSi.CAMPO_ENSENANZA, valores: ['E.S.O.'] }), SoloSi.valoresDe(SoloSi.asuntoDeClave(App.E.listaAbiertos[0].nombre)))), 'falta');
await comprobar('8c. un alumno recién abierto lo pide al Centro de datos y la enseñanza llega sola', pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => /Jimenez Rubio/i.test(x.nombre))[0];
  const si = SoloSi.normalizar({ campo: SoloSi.CAMPO_ENSENANZA, valores: ['E.S.O.'] });
  const antes = SoloSi.estado(si, SoloSi.valoresDe(SoloSi.asuntoDeClave(a.nombre)));
  let despues = antes;
  for (let i = 0; i < 40 && despues === 'falta'; i++) { await new Promise((r) => setTimeout(r, 100)); despues = SoloSi.estado(si, SoloSi.valoresDe(SoloSi.asuntoDeClave(a.nombre))); }
  return [antes, despues];
}), ['falta', 'sale']);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
