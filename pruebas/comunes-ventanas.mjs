/* Fila 531 (docs/531-TAREAS-E-HITOS-COMUNES.md): las listas comunes de tareas y de hitos en la pantalla: «+ Añadir tarea» y
   «+ Añadir hito» con su ventana, crear ahí mismo, «Para», «Cambiar», la propuesta de Mantenimiento y el editor de la guía.
   Copia de pruebas (demo), Chromium real: el disco es falso, nunca se tocan datos reales. */
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

const esperar = (ms) => p.waitForTimeout(ms);
const hay = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);

/* Dos asuntos abiertos de tipos distintos, cada uno con un hito que viene de su guía. */
await p.evaluate(async () => {
  const sitio = {};
  for (const x of App.E.listaAbiertos) {
    const tipo = (x.leido && x.leido.tipo) || (x.ficha && x.ficha.tipo);
    const hs = (await Hitos.hitosDe(x.nombre)).filter((h) => h.origenGuia && h.clase !== 'decision');
    const paso = hs[0] && Hitos.pasoDeGuia(x, hs[0]);
    if (tipo && paso && !(paso.opciones && paso.opciones.length) && !sitio[tipo]) sitio[tipo] = { nombre: x.nombre, hito: hs[0].id };
  }
  const tipos = Object.keys(sitio);
  window.__a = { nombre: sitio[tipos[0]].nombre, hito: sitio[tipos[0]].hito, tipo: tipos[0] };
  window.__b = { nombre: sitio[tipos[1]].nombre, hito: sitio[tipos[1]].hito, tipo: tipos[1] };
  window.__asunto = (k) => App.E.listaAbiertos.filter((x) => x.nombre === window[k].nombre)[0];
  window.__hito = async (k) => (await Hitos.hitosDe(window[k].nombre)).filter((h) => h.id === window[k].hito)[0];
  window.__guiaDe = (tipo) => JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe(tipo)));
  window.__lineas = async (k) => Hitos.guionDe(window.__asunto(k), await window.__hito(k)).map((g) => [g.texto, g.comun || '', !!g.propio]);
  window.__preguntas = () => JSON.stringify(Object.entries(GuiasDelCentro.todas()).map(([t, ps]) => [t, ps.filter((x) => x.opciones && x.opciones.length)]));
  window.__antesPreguntas = window.__preguntas();
});
const dosTipos = await p.evaluate(() => [window.__a.tipo, window.__b.tipo]);
console.log('(prueba con los tipos ' + dosTipos.join(' y ') + ')');

/* ------------------------------------------------------------------ */
console.log('--- 1. añadir una tarea de la lista, y crear una nueva ahí mismo ---');
await p.evaluate(async () => { const a = window.__asunto('__a'); ComunesAsunto.anadirTarea(a, await window.__hito('__a')); });
await p.waitForSelector('.capa-campos #cv-crear');
await comprobar('la ventana trae «Para» con las dos opciones y la lista vacía', p.evaluate(() => [
  [...document.querySelectorAll('#cv-para option')].map((o) => o.value), document.querySelectorAll('.comunes-fila').length, document.querySelector('#cv-centro').textContent.indexOf('No hay ninguna tarea') !== -1]), [['guia', 'aqui'], 0, true]);
await comprobar('los grupos son lo que hace cada tarea, con «Otra cosa» al final', p.evaluate(() => [...document.querySelectorAll('.campos-grupo > span:first-child')].map((s) => s.textContent)),
  ['Todas', 'Generar documento', 'Firmar', 'Registrar', 'Comunicar', 'Añadir documento', 'Pedir datos', 'Copiar a otra carpeta', 'Otra cosa']);
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Firmar por la Dirección');
await p.selectOption('#cn-hace', 'firmar');
await p.click('#cn-crear');
await esperar(900);
await comprobar('1a. «Crear y añadir» (para la guía) deja la tarea en la lista y en la guía con su marca', p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const paso = window.__guiaDe(window.__a.tipo).filter((x) => x.id === window.__a.pasoId || (x.guion || []).some((g) => g.comun))[0];
  const t = l.tareas[0];
  return [l.tareas.map((x) => [x.nombre, x.accion]), !!paso, paso && paso.guion.filter((g) => g.comun === t.id).map((g) => [g.texto, g.accion]), document.querySelector('.capa-campos') === null];
}), [[['Firmar por la Dirección', 'firmar']], true, [['Firmar por la Dirección', 'firmar']], true]);
await comprobar('1b. la tarea sale ya en el asunto', p.evaluate(async () => (await window.__lineas('__a')).filter((x) => x[1]).map((x) => x[0])), ['Firmar por la Dirección']);

await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('#cv-buscar');
await comprobar('2a. la línea dice en cuántos tipos se usa; el grupo «Firmar» cuenta 1', p.evaluate(() => [document.querySelector('.comunes-fila').textContent, [...document.querySelectorAll('.campos-grupo')].filter((g) => g.textContent.indexOf('Firmar') === 0).map((g) => g.textContent)]),
  ['Firmar por la Direcciónse usa en 1 tipo', ['Firmar1']]);
await p.fill('#cv-buscar', 'zzz');
await comprobar('2b. el buscador filtra por nombre', p.evaluate(() => document.querySelectorAll('.comunes-fila').length), 0);
await p.fill('#cv-buscar', 'direcc');
await comprobar('2c. y encuentra por parte del nombre', p.evaluate(() => document.querySelectorAll('.comunes-fila').length), 1);
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Firmar por la Secretaría');
await comprobar('3a. un nombre parecido enseña las parecidas', p.evaluate(() => [...document.querySelectorAll('#cn-par [data-par]')].map((b) => b.textContent)), ['Firmar por la Dirección']);
await p.fill('#cn-nombre', 'firmar por la direccion');
await p.click('#cn-crear');
await comprobar('3b. el mismo nombre no se duplica', p.evaluate(() => document.querySelector('#cn-err').textContent), 'Ya existe con ese nombre.');
await p.fill('#cn-nombre', '   ');
await p.click('#cn-crear');
await comprobar('3c. sin nombre, lo dice', p.evaluate(() => document.querySelector('#cn-err').textContent), 'Ponle un nombre.');
await p.fill('#cn-nombre', 'Generar la resolución de baja');
await p.selectOption('#cn-hace', 'generar');
await comprobar('4a. una tarea de generar pide plantilla, y se puede crear una nueva', p.evaluate(() => {
  const o = [...document.querySelectorAll('#cn-pl option')];
  return [o.length > 2, o[0].textContent, o[o.length - 1].textContent];
}), [true, 'Sin plantilla fija', 'Plantilla nueva…']);
const guiaAntes = await p.evaluate(() => JSON.stringify(window.__guiaDe(window.__a.tipo)));
await p.selectOption('#cn-pl', { index: 1 });
await p.selectOption('#cv-para', 'aqui');
await p.click('#cn-crear');
await esperar(900);
await comprobar('4b. «Solo este asunto» no toca la guía y deja la tarea solo aquí (sin marca)', p.evaluate(async (antes) => {
  const l = await ComunesGuardado.leer();
  const t = l.tareas.filter((x) => x.nombre === 'Generar la resolución de baja')[0];
  const propia = (await window.__hito('__a')).guionPropio || [];
  return [JSON.stringify(window.__guiaDe(window.__a.tipo)) === antes, !!(t && t.receta && t.receta.plantilla), propia.map((g) => [g.texto, g.accion, !!(g.receta && g.receta.plantilla), g.comun || ''])];
}, guiaAntes), [true, false, [['Generar la resolución de baja', 'generar', true, '']]]);
/* Fila 539: lo creado «solo este asunto» ya no entra en la lista; las pruebas de abajo la necesitan, así que se añade aparte. */
await p.evaluate(async () => { const g = (await window.__hito('__a')).guionPropio.filter((x) => x.texto === 'Generar la resolución de baja')[0]; await ComunesGuardado.anadir('tareas', { nombre: 'Generar la resolución de baja', accion: 'generar', receta: g.receta }); });

await p.evaluate(async () => ComunesAsunto.anadirTarea(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('#cv-crear');
await p.selectOption('#cv-para', 'aqui');
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Enviar el correo a la familia');
await p.selectOption('#cn-hace', 'comunicar');
await p.selectOption('#cn-pl', '__nueva');
await p.waitForSelector('#pl-nombre');
await comprobar('4c. «Plantilla nueva…» abre el editor de plantillas de siempre y cierra la ventana mientras tanto', p.evaluate(() => [document.querySelector('#cuadro-titulo').textContent, document.querySelector('.capa-campos') === null]), ['Nueva plantilla', true]);
await p.fill('#pl-nombre', 'Correo de prueba 531');
await p.fill('#pl-texto', 'Hola {nombre}.');
await p.click('#cuadro-aceptar');
await p.waitForSelector('#cn-pl');
await comprobar('4d. al guardarla, la ventana vuelve con lo escrito y la plantilla nueva elegida', p.evaluate(() => [document.querySelector('#cn-nombre').value, document.querySelector('#cn-hace').value, document.querySelector('#cn-pl').selectedOptions[0].textContent.indexOf('Correo de prueba 531') !== -1, document.querySelector('#cv-para').value]), ['Enviar el correo a la familia', 'comunicar', true, 'aqui']);
await p.click('#cn-crear');
await esperar(900);
await comprobar('4e. la tarea se crea en el asunto con esa plantilla (fila 539: no en la lista)', p.evaluate(async () => {
  const t = ((await window.__hito('__a')).guionPropio || []).filter((x) => x.texto === 'Enviar el correo a la familia')[0];
  const pl = Plantillas.enMemoria().lista.filter((x) => x.nombre === 'Correo de prueba 531')[0];
  return [t.accion, !!pl && t.receta.plantilla === pl.id];
}), ['comunicar', true]);

/* ------------------------------------------------------------------ */
console.log('--- 2. cambiar la tarea ---');
await p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const t = l.tareas.filter((x) => x.nombre === 'Firmar por la Dirección')[0];
  window.__tc = t.id;
  /* La misma tarea común en la guía del otro tipo, sin repartir nada. */
  await GuiasDelCentro.cambiarPasos(window.__b.tipo, (pasos) => {
    const hb = Hitos.pasoDeGuia(window.__asunto('__b'), { origenGuia: null });
    const paso = pasos.filter((x) => !(x.opciones && x.opciones.length))[0];
    paso.guion = (paso.guion || []).concat([Comunes.lineaDeTarea(t)]);
    window.__b.paso = paso.id;
  }, { sinLlevar: true });
});
const hitoB = await p.evaluate(async () => {
  const hs = (await Hitos.hitosDe(window.__b.nombre)).filter((h) => h.origenGuia === window.__b.paso);
  if (hs[0]) window.__b.hito = hs[0].id;
  return !!hs[0];
});
await comprobar('5a. el otro tipo tiene la tarea común en un hito de su asunto abierto', p.evaluate(async () => (await window.__lineas('__b')).filter((x) => x[1]).map((x) => x[0])), hitoB ? ['Firmar por la Dirección'] : []);
const preguntasAntes = await p.evaluate(() => window.__preguntas());
await p.evaluate(async () => {
  const t = (await ComunesGuardado.leer()).tareas.filter((x) => x.id === window.__tc)[0];
  ComunesCambiar.tarea(t, { claveActual: window.__a.nombre });
});
await p.waitForSelector('#cc-usos');
await comprobar('6a. avisa, antes de guardar, de en qué tipos se usa y de que los otros asuntos siguen', p.evaluate((tipos) => {
  const t = document.querySelector('#cc-usos').textContent;
  return [t.indexOf('Esta tarea se usa en 2 tipos: ') === 0, tipos.every((x) => t.indexOf(x) !== -1), t.endsWith('Cambiará en todos. Los otros asuntos abiertos siguen como están.')];
}, dosTipos), [true, true, true]);
await p.fill('#cc-nombre', 'Firmar por la Dirección del centro');
await p.click('#cc-guardar');
await esperar(1200);
await comprobar('6b. cambia en la lista y en las guías de los dos tipos', p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const de = (tipo) => window.__guiaDe(tipo).flatMap((x) => x.guion || []).filter((g) => g.comun === window.__tc).map((g) => g.texto);
  return [l.tareas.map((x) => x.nombre).filter((n) => n.indexOf('Firmar') === 0), de(window.__a.tipo), de(window.__b.tipo)];
}), [['Firmar por la Dirección del centro'], ['Firmar por la Dirección del centro'], ['Firmar por la Dirección del centro']]);
await comprobar('6c. el asunto desde el que se cambia lo ve cambiado', p.evaluate(async () => (await window.__lineas('__a')).filter((x) => x[1]).map((x) => x[0])), ['Firmar por la Dirección del centro']);
if (hitoB) await comprobar('6d. el asunto abierto del otro tipo sigue como estaba (con su tarea de antes)', p.evaluate(async () => (await window.__lineas('__b')).filter((x) => x[0].indexOf('Firmar por la Dirección') === 0).map((x) => [x[0], x[2]])), [['Firmar por la Dirección', true]]);
await comprobar('6e. las guías con preguntas y ramas siguen igual', p.evaluate(() => window.__preguntas()), preguntasAntes);
await comprobar('6f. sin repartir: no se ha añadido ninguna tarea extra a los asuntos', p.evaluate(async () => (await window.__lineas('__a')).filter((x) => x[1] || x[2]).length), 3);

/* ------------------------------------------------------------------ */
console.log('--- 3. añadir un hito de la lista ---');
await p.evaluate(async () => ComunesAsunto.anadirHito(window.__asunto('__a'), await window.__hito('__a')));
await p.waitForSelector('#cv-crear');
await comprobar('7a. la ventana de hitos no tiene grupos y dice que no hay ninguno', p.evaluate(() => [document.querySelectorAll('.campos-grupo').length, document.querySelector('#cv-centro').textContent.indexOf('ningún hito') !== -1]), [0, true]);
await p.click('#cv-crear');
await p.fill('#cn-nombre', 'Elaborar la resolución');
await p.fill('#cn-exp', 'Se preparan los documentos que hay que firmar.');
await p.selectOption('#cn-at', { label: 'Firmar por la Dirección del centro' });
await p.selectOption('#cn-at', { label: 'Generar la resolución de baja' });
await comprobar('7b. el hito nuevo se monta con tareas de la lista', p.evaluate(() => [...document.querySelectorAll('#cv-nuevo li')].map((li) => li.textContent.replace('Quitar', '').trim())), ['Firmar por la Dirección del centro', 'Generar la resolución de baja']);
await p.click('#cn-crear');
await esperar(1500);
await comprobar('7c. «para la guía»: el hito entra en la guía con su marca, sus tareas y sin plazo', p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const hc = l.hitos[0];
  window.__hc = hc.id;
  const paso = window.__guiaDe(window.__a.tipo).filter((x) => x.comun === hc.id)[0];
  return [l.hitos.map((x) => x.nombre), !!paso, paso && paso.plazo, paso && paso.guion.map((g) => [g.texto, !!g.comun])];
}), [['Elaborar la resolución'], true, null, [['Firmar por la Dirección del centro', true], ['Generar la resolución de baja', true]]]);
await comprobar('7d. y llega al asunto, con sus tareas', p.evaluate(async () => {
  const hs = (await Hitos.hitosDe(window.__a.nombre)).filter((h) => h.titulo === 'Elaborar la resolución');
  return [hs.length, hs[0] && Hitos.guionDe(window.__asunto('__a'), hs[0]).map((g) => g.texto)];
}), [1, ['Firmar por la Dirección del centro', 'Generar la resolución de baja']]);

const guiaA = await p.evaluate(() => JSON.stringify(window.__guiaDe(window.__a.tipo)));
await p.evaluate(async () => ComunesAsunto.anadirHito(window.__asunto('__b'), await window.__hito('__b')));
await p.waitForSelector('.comunes-fila');
await p.selectOption('#cv-para', 'aqui');
await p.click('.comunes-fila');
await esperar(1200);
await comprobar('8. «solo este asunto»: el hito queda solo aquí, con sus tareas, y la guía no se toca', p.evaluate(async (antes) => {
  const hs = (await Hitos.hitosDe(window.__b.nombre)).filter((h) => h.titulo === 'Elaborar la resolución');
  return [hs.length, hs[0] && (hs[0].guionPropio || []).map((g) => g.texto), hs[0] && !!hs[0].origenGuia, JSON.stringify(window.__guiaDe(window.__a.tipo)) === antes,
    window.__guiaDe(window.__b.tipo).some((x) => x.comun === window.__hc)];
}, guiaA), [1, ['Firmar por la Dirección del centro', 'Generar la resolución de baja'], false, true, false]);

/* ------------------------------------------------------------------ */
console.log('--- 4. cambiar el hito ---');
await p.evaluate(async () => {
  const hc = (await ComunesGuardado.leer()).hitos[0];
  const hs = (await Hitos.hitosDe(window.__a.nombre)).filter((h) => h.titulo === 'Elaborar la resolución');
  ComunesCambiar.hito(hc, { claveActual: window.__a.nombre, asunto: window.__a.nombre, hitoDelAsunto: hs[0].id });
});
await p.waitForSelector('#cc-usos');
await comprobar('9a. avisa de en qué tipos se usa el hito', p.evaluate(() => document.querySelector('#cc-usos').textContent), 'Este hito se usa en 1 tipo: ' + dosTipos[0] + '. Cambiará en todos. Los otros asuntos abiertos siguen como están.');
await p.fill('#cc-nombre', 'Preparar la resolución');
await p.click('#cc-guardar');
await esperar(1200);
await comprobar('9b. cambia en la lista, en la guía y en este asunto; las tareas siguen', p.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const paso = window.__guiaDe(window.__a.tipo).filter((x) => x.comun === window.__hc)[0];
  const hs = (await Hitos.hitosDe(window.__a.nombre)).filter((h) => h.titulo === 'Preparar la resolución');
  return [l.hitos.map((x) => x.nombre), paso && paso.titulo, paso && paso.guion.length, hs.length];
}), [['Preparar la resolución'], 'Preparar la resolución', 2, 1]);

/* ------------------------------------------------------------------ */
console.log('--- 5. la propuesta de pasar las guías (solo se ve) ---');
const antesTodo = await p.evaluate(async () => JSON.stringify([GuiasDelCentro.todas(), await ComunesGuardado.leer()]));
await p.evaluate(() => { App.pantallaALaVista = () => true; Gestor.alRefrescar.forEach((f) => { try { f(); } catch (e) { /* solo pintar */ } }); });
await p.waitForSelector('#bloque-comunes-propuesta', { state: 'attached' });
await p.evaluate(() => document.getElementById('btn-comunes-propuesta').click());
await p.waitForSelector('.comunes-propuesta', { state: 'attached' });
await comprobar('10a. dice que es solo una propuesta y enseña lo que se uniría y lo que se queda', p.evaluate(() => {
  const t = document.getElementById('resultado-comunes-propuesta').textContent;
  return [t.indexOf('no se ha cambiado nada') !== -1, t.indexOf('Se unirían') !== -1, t.indexOf('Quedarían separadas') !== -1, t.indexOf('Se quedan como están') !== -1, t.indexOf('Nada se pierde') !== -1];
}), [true, true, true, true, true]);
await comprobar('10b. no cambia ninguna guía ni ninguna lista, y no hay botón de aplicar', p.evaluate(async (antes) => [JSON.stringify([GuiasDelCentro.todas(), await ComunesGuardado.leer()]) === antes,
  [...document.querySelectorAll('#bloque-comunes-propuesta button')].map((b) => b.textContent)], antesTodo), [true, ['Preparar la propuesta', 'Copiar la propuesta como texto']]);

await comprobar('10c. yendo directo a Herramientas, sin pasar por Ajustes, el bloque sale y está en Herramientas', p.evaluate(async () => {
  document.getElementById('bloque-comunes-propuesta')?.remove();
  document.querySelectorAll('.pantalla').forEach((x) => x.classList.add('oculto'));
  document.getElementById('pantalla-herramientas').classList.remove('oculto');
  App.pantallaALaVista = (c) => c === 'herramientas';
  Gestor.alRefrescar.forEach((f) => { try { f(); } catch (e) { /* solo pintar */ } });
  await new Promise((r) => setTimeout(r, 800));
  const b = document.getElementById('bloque-comunes-propuesta');
  return [!!b, !!(b && b.closest('#pantalla-herramientas'))];
}), [true, true]);

/* ------------------------------------------------------------------ */
console.log('--- 6. en el editor de la guía ---');
await p.evaluate(() => { window.__fin = GuiasDelCentro.escribir(window.__a.tipo); });
await p.waitForSelector('#guia-anadir-comun');
await comprobar('11a. junto a «+ Añadir un hito» sale «+ Añadir un hito de la lista» (el de siempre sigue)', p.evaluate(() => [document.getElementById('guia-anadir').textContent, document.getElementById('guia-anadir-comun').textContent]), ['+ Añadir un hito', '+ Añadir un hito de la lista']);
const nHitos = await p.evaluate(() => document.querySelectorAll('#guia-lista > *').length);
await p.click('#guia-anadir-comun');
await p.waitForSelector('.comunes-fila');
await p.click('.comunes-fila');
await esperar(500);
await comprobar('11b. elegir un hito de la lista lo mete en la guía, con «Cambiar el hito»', p.evaluate((n) => [document.querySelectorAll('#guia-lista > *').length - n, !!document.querySelector('.comunes-cambiar-hito')], nHitos), [1, true]);
await comprobar('11c. sus tareas llevan «Cambiar la tarea» y la marca de la lista', p.evaluate(() => [!!document.querySelector('.guion-fila[data-comun]'), !!document.querySelector('.comunes-cambiar-tarea'), !!document.querySelector('.comunes-anadir-tarea-guia')]), [true, true, true]);
await p.click('.comunes-anadir-tarea-guia:visible');
await p.waitForSelector('.comunes-fila');
await comprobar('11d. «+ Añadir una tarea de la lista» abre la ventana de tareas', p.evaluate(() => [document.querySelector('.capa-campos h3').textContent, document.querySelectorAll('.comunes-fila').length >= 2]), ['Elegir una tarea', true]);
await p.keyboard.press('Escape');
await p.click('#cuadro-cancelar');
await p.evaluate(() => window.__fin);
await comprobar('11e. al cancelar el editor, la guía queda como estaba', p.evaluate(() => window.__guiaDe(window.__a.tipo).filter((x) => x.comun === window.__hc).length), 1);
await comprobar('12. las guías con preguntas siguen igual tras todo', p.evaluate(() => window.__preguntas()), preguntasAntes);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
