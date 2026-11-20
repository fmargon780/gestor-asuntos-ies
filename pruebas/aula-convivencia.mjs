/* Prueba de la fila 723 de docs/COLA.md (docs/723-AULA-CONVIVENCIA-NOTA-Y-SEGUIMIENTO.md): el tipo «EXPULSIÓN AULA CONVICENCIA»
   pasa a «Sin hitos» con su guía de tres tareas, sus dos datos, sus dos tipos de documento con recorrido y sus dos plantillas;
   los huecos de la nota (primer día, duración y verbo); la espera de «Recibir la parte firmada» al enviar la nota; y que
   volver a entrar no duplica nada. Con Chromium real y los datos inventados (?demo=1&auto=1&aula=1). */

import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&aula=1';
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
await pagina.waitForFunction(() => App.E.tipos.some((t) => t.tipo === 'EXPULSIÓN AULA CONVICENCIA' && t.sinHitos) && App.E.listaAbiertos.some((x) => /Lara Pardo/.test(x.nombre)), null, { timeout: 30000 });

const TIPO = 'EXPULSIÓN AULA CONVICENCIA';

console.log('--- El tipo y su guía ---');
await comprobar('1. el tipo está marcado «Sin hitos» y no cambia de nombre ni de alias', pagina.evaluate((t) => { const x = App.E.tipos.filter((y) => y.tipo === t)[0]; return [x.sinHitos === true, x.alias]; }, TIPO), [true, ['EXPULSIÓN CASA']]);
await comprobar('2. la guía es una lista de tres tareas, una de ellas sin papel', pagina.evaluate((t) => { const p = GuiasDelCentro.pasosDe(t).filter((x) => x.listaDeTareas); return p.length + ':' + p[0].guion.map((g) => g.texto + '|' + (g.papel || '') + '|' + (g.esperaAlEnviar ? 'e' : '')).join('/'); }, TIPO),
  '1:Nota a la familia|NOTA AULA CONVIVENCIA|/Recibir la parte firmada y el compromiso|FIRMADO AULA CONVIVENCIA|e/Grabar en Séneca la medida, con los días y las fechas||');
await comprobar('3. los pasos de la guía de antes se guardan sin usarse', pagina.evaluate((t) => GuiasDelCentro.todas()[t].filter((p) => !p.listaDeTareas).length, TIPO), 3);
await comprobar('4. los dos datos del asunto se piden al crear', pagina.evaluate(async (t) => { const c = await Campos.leer(App.E.gestor); return (c.porTipo[t] || []).map((e) => { const p = c.propios.filter((x) => x.id === e.id)[0]; return p ? p.nombre + ':' + p.clase + ':' + (e.sinPedirAlCrear ? 'general' : 'crear') : '?'; }); }, TIPO), ['Primer día:fecha:crear', 'Días lectivos:numero:crear']);
await comprobar('5. los dos tipos de documento están, con su recorrido', pagina.evaluate(() => ['NOTA AULA CONVIVENCIA', 'FIRMADO AULA CONVIVENCIA'].map((t) => App.E.tiposDocumento.indexOf(t) !== -1 && RecorridoTipo.tiene(t) && RecorridoTipo.resumen(t))),
  ['Firma: Jefatura de Estudios · se registra de salida · a Familia por Correo electrónico', 'Nos llega · no se registra']);
await comprobar('6. los pasos del recorrido de la nota y del firmado', pagina.evaluate(() => [RecorridoTipo.pasos('NOTA AULA CONVIVENCIA').map((p) => p.t).join(' › '), RecorridoTipo.pasos('FIRMADO AULA CONVIVENCIA').map((p) => p.t).join(' › ')]), ['Generado › Firmado › Registrado › Enviado', 'Recibido']);
await comprobar('7. las dos plantillas, con su firmante, y el correo a los tutores legales con el adjunto', pagina.evaluate(async (t) => {
  const d = await Plantillas.cargar(App.E.gestor);
  const doc = d.documentos.filter((p) => p.tipo === t)[0], cor = d.lista.filter((p) => p.tipo === t)[0];
  return [doc && doc.tipoDocumento, doc && doc.firmante, cor && cor.adjuntar, cor && cor.para];
}, TIPO), ['NOTA AULA CONVIVENCIA', 'jefatura-estudios', 'NOTA AULA CONVIVENCIA', ['legales']]);

console.log('--- Los huecos de la nota ---');
await comprobar('8. «lunes 23 de noviembre», «3 días lectivos» y «comenzarán»', pagina.evaluate(() => { const v = {}; v.campos = { 'Primer día': '23/11/2026', 'Días lectivos': '3' }; AulaConvivenciaTexto.poner(v); return [v['primer día'], v['duración'], v['comenzarán']]; }), ['lunes 23 de noviembre', '3 días lectivos', 'comenzarán']);
await comprobar('9. con 1 día: «1 día lectivo» y «comenzará»', pagina.evaluate(() => { const v = { campos: { 'Primer día': '2026-11-24', 'Días lectivos': '1' } }; AulaConvivenciaTexto.poner(v); return [v['primer día'], v['duración'], v['comenzarán']]; }), ['martes 24 de noviembre', '1 día lectivo', 'comenzará']);
await comprobar('10. sin datos, los huecos salen vacíos y se piden por su nombre', pagina.evaluate(() => {
  const v = { campos: {} }; AulaConvivenciaTexto.poner(v);
  const r = Plantillas.rellenar('{{PRIMER DÍA}}|{{DURACIÓN}}|{{COMENZARÁN}}', v);
  return [r.texto, r.faltan];
}), ['|?|comenzarán'.replace('?', ''), ['Primer día', 'Días lectivos']]);

console.log('--- Los asuntos ---');
async function abrirFicha(clave) {
  await pagina.evaluate(async () => { App.ir('abiertos'); InicioTabla.cambiar('todos'); await InicioTabla.pintar(); });
  await pagina.waitForTimeout(400);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + clave + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(700);
}
const claves = await pagina.evaluate((t) => App.E.listaAbiertos.filter((a) => a.leido && a.leido.tipo === t).map((a) => a.nombre), TIPO);
const NUEVO = claves.filter((c) => /Rubio Vega/.test(c))[0], SIN = claves.filter((c) => /Lara Pardo/.test(c))[0], VIEJO = claves.filter((c) => /Soto Lara/.test(c))[0];
await comprobar('11. hay tres asuntos del tipo', [!!NUEVO, !!SIN, !!VIEJO], [true, true, true]);
await abrirFicha(NUEVO);
await pagina.waitForSelector('#ficha-guia .ash', { timeout: 10000 });
await comprobar('12. el asunto nuevo enseña las tres tareas, en orden y sin rótulos', pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .ash-tarea')).map((t) => t.querySelector('.ash-texto-tarea, .tp-texto, .tp-centro').textContent.replace(/\s+/g, ' ').trim().slice(0, 40)).length + ':' + document.querySelectorAll('#ficha-guia .ash-rotulo').length), '3:0');
await comprobar('13. la nota y el firmado son tareas de papel, y lo de Séneca lleva casilla', pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .ash-tarea')).map((t) => !!t.querySelector('.tp-recorrido') + '/' + !!t.querySelector('.ash-casilla'))), ['true/false', 'true/false', 'false/true']);
await comprobar('14. «Grabar en Séneca» se marca a mano y deja quién y qué día', (async () => {
  await pagina.locator('#ficha-guia .ash-tarea').nth(2).locator('.ash-casilla').check();
  await pagina.waitForFunction(() => document.querySelectorAll('#ficha-guia .ash-tarea.hecha').length >= 1, null, { timeout: 8000 });
  return pagina.evaluate(async (k) => { const h = (await Hitos.hitosDe(k)).filter((x) => x.listaDeTareas)[0], g = Hitos.guionDe(null, h)[2]; return [!!g.hecho, !!g.quien, !!g.cuando]; }, NUEVO);
})(), [true, true, true]);
await comprobar('15. los valores de la nota de este asunto: lunes 23 de noviembre, 3 días lectivos', pagina.evaluate(async (k) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === k)[0], v = await Plantillas.valoresDeAsunto(a, {});
  return [v['primer día'], v['duración'], v['comenzarán']];
}, NUEVO), ['lunes 23 de noviembre', '3 días lectivos', 'comenzarán']);
await comprobar('16. el asunto sin datos pide «Primer día» y «Días lectivos»', pagina.evaluate(async (k) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === k)[0], v = await Plantillas.valoresDeAsunto(a, {});
  return Plantillas.rellenar('{{PRIMER DÍA}} {{DURACIÓN}}', v).faltan;
}, SIN), ['Primer día', 'Días lectivos']);

console.log('--- La espera al enviar la nota ---');
const esperaDe = (k) => pagina.evaluate(async (c) => { const h = (await Hitos.hitosDe(c)).filter((x) => x.listaDeTareas)[0], l = Hitos.guionDe(null, h); return l.map((g) => g.espera ? [g.espera.quien, g.espera.desde === U.hoyIso(), !!g.espera.volver && g.espera.volver > U.hoyIso()] : null); }, k);
await comprobar('17. al principio, ninguna tarea espera', esperaDe(NUEVO), [null, null, null]);
await pagina.evaluate(async (k) => { await PapelEsperaRecibir.alEnviar(App.E.listaAbiertos.filter((x) => x.nombre === k)[0]); }, NUEVO);
await comprobar('18. al enviar un papel, solo «Recibir la parte firmada» queda esperando a la familia, con un día por delante', esperaDe(NUEVO), [null, ['tutor', true, true], null]);
await pagina.evaluate(async (k) => { await PapelEsperaRecibir.alEnviar(App.E.listaAbiertos.filter((x) => x.nombre === k)[0]); }, NUEVO);
await comprobar('19. enviar otra vez no cambia nada', esperaDe(NUEVO), [null, ['tutor', true, true], null]);
await abrirFicha(NUEVO);
await comprobar('20. la ficha lo dice bajo la tarea, con sus botones', pagina.evaluate(() => { const e = document.querySelector('#ficha-guia .ash-tarea:nth-child(2) .ash-espera'); return e ? [e.textContent.replace(/\s+/g, ' ').trim().slice(0, 18), !!e.querySelector('.ash-espera-llegado'), !!e.querySelector('.ash-espera-dia')] : null; }), ['Esperando a Famili', true, true]);
await comprobar('21. un asunto de otro tipo no espera nada al enviar', pagina.evaluate(async (k) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === k)[0];
  return PapelEsperaRecibir.alEnviar(a);
}, VIEJO), 0);

console.log('--- Volver a entrar ---');
await comprobar('22. la pasada otra vez no duplica nada', pagina.evaluate(async (t) => {
  const antes = JSON.stringify([GuiasDelCentro.todas()[t].length, App.E.tiposDocumento.length, (await Plantillas.cargar(App.E.gestor)).documentos.length, (await Plantillas.cargar(App.E.gestor)).lista.length, (await Campos.leer(App.E.gestor)).propios.length, (await Campos.leer(App.E.gestor)).porTipo[t].length]);
  const r = await AulaConvivencia.pasada({ forzar: true });
  const despues = JSON.stringify([GuiasDelCentro.todas()[t].length, App.E.tiposDocumento.length, (await Plantillas.cargar(App.E.gestor)).documentos.length, (await Plantillas.cargar(App.E.gestor)).lista.length, (await Campos.leer(App.E.gestor)).propios.length, (await Campos.leer(App.E.gestor)).porTipo[t].length]);
  return [antes === despues, r.tareas, r.camposNuevos, r.tiposDocumentoNuevos, r.plantillasNuevas];
}, TIPO), [true, 0, 0, 0, 0]);
await comprobar('23. un asunto abierto de antes sigue con sus hitos', (async () => {
  await abrirFicha(VIEJO);
  return pagina.evaluate(() => [!!document.querySelector('#ficha-guia .ash'), /Preparar y enviar/.test(document.getElementById('ficha-guia').innerText)]);
})(), [false, true]);
await comprobar('24. la consola, sin errores', errores, []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' comprobaciones fallan.' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
