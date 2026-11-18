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
async function aceptarEditor() { await pagina.click('#cuadro-aceptar'); await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto')); await pagina.waitForTimeout(400); }

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
await comprobar('3. «Cuándo se hace» ofrece «Siempre» y «Solo si el tercero es…»', fila(1).locator('.cuando-campo option').allTextContents().then((l) => l.slice(0, 2)), ['Siempre', 'Solo si el tercero es…']);
await fila(1).locator('.cuando-campo').selectOption({ label: 'Solo si el tercero es…' });
await comprobar('3. salen las clases de tercero del tipo', fila(1).locator('.cuando-valor').evaluateAll((l) => l.map((x) => x.value)), await pagina.evaluate((t) => SoloSi.clasesDelTipo(t), TIPO));
await fila(1).locator('.cuando-valor[value="' + CLASE + '"]').check();   /* «Avisar al personal»: solo si el tercero es de su clase (sale) */
await fila(2).locator('button', { hasText: '↑' }).click();
await comprobar('3. ↑ sube una tarea', pagina.locator('#gsh-lista .gsh-texto').evaluateAll((l) => l.map((x) => x.value)), ['Pedir el certificado', 'Enviar la carta', 'Avisar al personal']);
await aceptarEditor();
await comprobar('4. se guarda como un paso de lista de tareas con sus frases y su «Solo si»', pagina.evaluate((t) => {
  const p = GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas)[0];
  return p && p.guion.map((g) => [g.texto, g.soloSi ? SoloSi.etiqueta(g.soloSi) : '']);
}, TIPO), [['Pedir el certificado', ''], ['Enviar la carta', ''], ['Avisar al personal', 'Solo si el tercero es ' + CLASE]]);

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

console.log('--- sin cambios en los demás ---');
await pagina.evaluate(async (t) => { App.E.tipos.filter((x) => x.tipo === t)[0].sinHitos = false; await App.guardarTipos(); }, TIPO);
pagina.evaluate((t) => GuiasDelCentro.escribir(t), TIPO);
await pagina.waitForSelector('#capa:not(.oculto) #cuadro-cuerpo .guia-dos-col');
await comprobar('10. un tipo sin la casilla se edita con el editor de siempre', pagina.evaluate(() => [!!document.getElementById('gsh-lista'), !!document.getElementById('guia-anadir')]), [false, true]);
await pagina.click('#cuadro-cancelar');

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
