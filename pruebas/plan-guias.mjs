/* Fila 551 (docs/551-APLICAR-EL-PLAN-DE-LAS-GUIAS.md): Herramientas → «Aplicar el plan de las guías». Copia de pruebas (demo),
   Chromium real: el disco es falso, nunca se tocan datos reales. La demostración trae cuatro guías con nombres del plan
   (js/demo/datos-plan-guias.js). */
import { chromium } from 'playwright';
import { abrirHito } from './apoyo/hito.mjs';

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

const hay = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const visible = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.offsetParent !== null; }, sel);
const guia = (tipo) => p.evaluate((t) => GuiasDelCentro.pasosDe(t), tipo);
const titulos = (tipo) => guia(tipo).then((ps) => ps.map((x) => x.titulo));
const lineas = (tipo, hito) => guia(tipo).then((ps) => ((ps.filter((x) => x.titulo === hito)[0] || {}).guion || []).map((g) => [g.texto, g.accion || '', !!g.comun]));

/* Lo que ve cada asunto abierto de sus hitos, antes de aplicar. */
const abiertos = () => p.evaluate(async () => {
  const r = {};
  for (const x of App.E.listaAbiertos) r[x.nombre] = (await Hitos.hitosDe(x.nombre)).map((h) => [h.titulo, JSON.stringify(Hitos.guionDe(x, h).map((g) => g.texto))]);
  return r;
});
const abiertosAntes = await abiertos();
const guiasAntes = await p.evaluate(() => JSON.stringify(GuiasDelCentro.todas()));

console.log('--- 1. el bloque de Herramientas enseña lo que cambiaría, sin cambiar nada ---');
await p.evaluate(() => App.ir('herramientas'));
await p.waitForSelector('#bloque-plan-guias', { state: 'attached' });
await comprobar('1a. «Aplicar el plan de las guías» sale en Herramientas', p.evaluate(() => !!document.getElementById('bloque-plan-guias').closest('#pantalla-herramientas')), true);
await comprobar('1b. antes de abrirlo no hay informe', hay('#btn-plan-guias-aplicar'), false);
await p.evaluate(() => { document.getElementById('bloque-plan-guias').open = true; });
await p.waitForSelector('#btn-plan-guias-aplicar');
const informe = await p.evaluate(() => document.getElementById('plan-guias-salida').textContent);
await comprobar('1c. dice que todavía no se ha cambiado nada y enseña lo que se quita, lo que se une, lo que queda separado y lo que no encuentra',
  ['todavía no se ha cambiado nada', 'Se quita', 'Se une', 'Quedan separadas', 'No encontrado'].map((t) => informe.indexOf(t) !== -1), [true, true, true, true, true]);
await comprobar('1d. lo que no encuentra: el plan nombra tipos que la demostración no tiene', p.evaluate(() => /no encuentro ese tipo con guía/.test(document.querySelector('.plan-guias-informe').textContent)), true);
await comprobar('1e. las tareas «Enviar correo de aviso» con otra plantilla quedan separadas', p.evaluate(() => /Enviar correo de aviso».*2 maneras/.test(document.querySelector('.plan-guias-informe').textContent)), true);
await comprobar('1f. mirar no cambia ninguna guía ni ninguna lista', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, (await ComunesGuardado.leer()).tareas.length], guiasAntes), [true, 0]);

console.log('--- 2. «Aplicar» pide confirmación ---');
await p.click('#btn-plan-guias-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await comprobar('2a. la ventana dice qué hace', p.evaluate(() => document.querySelector('#capa').textContent.indexOf('copia de las guías') !== -1), true);
await p.evaluate(() => document.getElementById('cuadro-cancelar') && document.getElementById('cuadro-cancelar').click());
await p.waitForTimeout(400);
await comprobar('2b. cancelar no cambia nada', p.evaluate(async (antes) => [JSON.stringify(GuiasDelCentro.todas()) === antes, PlanGuiasAplicar.aplicado()], guiasAntes), [true, false]);

console.log('--- 3. aplicar ---');
await p.click('#btn-plan-guias-aplicar');
await p.waitForSelector('#capa:not(.oculto)');
await p.click('#cuadro-aceptar');
await p.waitForFunction(() => PlanGuiasAplicar.aplicado(), null, { timeout: 30000 });
await p.waitForTimeout(800);
await comprobar('3a. se guardó una copia de las guías de antes y la marca de aplicado', p.evaluate(async () => {
  const nombres = []; for await (const [k] of App.E.gestor.entries()) nombres.push(k);
  const copia = nombres.filter((k) => /^guias-antes-del-plan-\d{8}-\d{4}\.json$/.test(k))[0];
  const dentro = copia ? await Carpetas.leerJson(App.E.gestor, copia) : null;
  return [!!copia, !!dentro && !!dentro['CAMBIO DE GRUPO'], nombres.indexOf('plan-guias-aplicado.json') !== -1];
}), [true, true, true]);

console.log('--- 4. las guías quedan como dice el plan ---');
await comprobar('4a. «Archivar» sale de todas las guías', p.evaluate(() => Object.entries(GuiasDelCentro.todas()).filter(([t, ps]) => t !== 'Alta y actualización de datos' && JSON.stringify(ps).indexOf('"titulo":"Archivar"') !== -1).map(([t]) => t)), []);
await comprobar('4b. CAMBIO DE GRUPO: se quitan «Valorar la petición» y «Resolver»', titulos('CAMBIO DE GRUPO'),
  ['Recoger la solicitud o la propuesta', 'Modificar el grupo en Séneca', 'Comunicar a la familia, a las dos tutorías y al equipo docente']);
await comprobar('4c. CONVALIDACIÓN CURSO: «Informe del departamento» se va y su tarea pasa al final de «Recoger la solicitud»', [await titulos('CONVALIDACIÓN CURSO'), (await lineas('CONVALIDACIÓN CURSO', 'Recoger la solicitud')).map((l) => l[0])],
  [['Recoger la solicitud', 'Resolver o remitir, según el supuesto', 'Anotar en el expediente y en Séneca', 'Comunicar a la familia y a la tutoría'],
   ['Registrar de entrada el documento', 'Pasar la solicitud al departamento que corresponde']]);
await comprobar('4d. los hitos con nombres distintos quedan con uno solo, y «Firma del director» pasa a «Poner a la firma» con Dirección de responsable',
  [await titulos('CERTIFICADO DEL PLAN'), (await guia('CERTIFICADO DEL PLAN')).map((x) => x.responsable)],
  [['Registro de entrada', 'Preparar el certificado', 'Poner a la firma', 'Enviar el certificado'], ['administracion', 'administracion', 'Dirección', 'administracion']]);
await comprobar('4e. las tareas de registrar y de firmar se unen con su nombre y su acción',
  [await lineas('CERTIFICADO DEL PLAN', 'Registro de entrada'), await lineas('CERTIFICADO DEL PLAN', 'Poner a la firma')],
  [[['Registrar de entrada el documento', 'registrar', true]], [['Firmar un documento', 'firmar', true]]]);
await comprobar('4f. «Registrar la salida en Séneca si se remite» pasa a «Registrar de salida el documento» con la condición en su explicación',
  p.evaluate(async () => { const t = (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Registrar de salida el documento')[0]; return t && [t.accion, t.receta, t.explicacion]; }),
  ['registrar', { sentido: 'salida' }, 'Si se remite.']);
await comprobar('4g. «Enviar el certificado» lleva la tarea de enviar el documento como comunicación',
  await lineas('CERTIFICADO DEL PLAN', 'Enviar el certificado'), [['Enviar el documento al solicitante por la vía acordada', 'comunicar', true]]);

console.log('--- 5. las listas comunes ---');
await comprobar('5a. igual nombre y distinta explicación: una sola tarea con todas las explicaciones, sin repetir',
  p.evaluate(async () => { const l = (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Registrar de entrada el documento'); return [l.length, l[0].explicacion.split('\n\n').sort()]; }),
  [1, ['Anotar el número en la ficha.', 'Con su fecha de hoy.', 'El que falte.', 'Solo si llega en papel.']]);
await comprobar('5b. todas las líneas de esas guías llevan la marca de la misma tarea común',
  p.evaluate(async () => {
    const t = (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Registrar de entrada el documento')[0];
    const g = GuiasDelCentro.todas(); const ids = [];
    (function rec(ps) { ps.forEach((x) => { (x.guion || []).forEach((l) => { if (l.texto === 'Registrar de entrada el documento') ids.push(l.comun === t.id); (l.opciones || []).forEach((o) => (o.lineas || []).forEach((m) => { if (m.texto === 'Registrar de entrada el documento') ids.push(m.comun === t.id); })); }); (x.opciones || []).forEach((o) => rec(o.pasos || [])); }); })(g['CAMBIO DE GRUPO'].concat(g['CONVALIDACIÓN CURSO'], g['CERTIFICADO DEL PLAN']));
    return [ids.length, ids.every(Boolean)];
  }), [4, true]);
await comprobar('5c. igual nombre y distinta plantilla: dos tareas distintas, cada una con su plantilla',
  p.evaluate(async () => (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Enviar correo de aviso').map((x) => x.receta.plantilla).sort()), ['pl-plan-a', 'pl-plan-b']);
await comprobar('5d. igual nombre y otra acción: «Enviar el documento al solicitante…» como comunicar y sin acción quedan separadas',
  p.evaluate(async () => (await ComunesGuardado.leer()).tareas.filter((x) => x.nombre === 'Enviar el documento al solicitante por la vía acordada').map((x) => x.accion).sort()), ['', 'comunicar']);
await comprobar('5e. una tarea dentro de una pregunta pasa a la lista',
  p.evaluate(() => { const ps = GuiasDelCentro.pasosDe('CERTIFICADO DEL PLAN'); const q = ps.filter((x) => x.titulo === 'Preparar el certificado')[0].guion.filter((g) => g.pregunta)[0]; return [q.opciones[0].lineas[0].id, !!q.opciones[0].lineas[0].comun]; }),
  ['g-plan-10', true]);
await comprobar('5f. los hitos con el mismo nombre y las mismas tareas son uno solo en la lista de hitos; el que tiene una pregunta dentro se queda fuera',
  p.evaluate(async () => { const l = await ComunesGuardado.leer(); const ps = GuiasDelCentro.pasosDe('CERTIFICADO DEL PLAN'); return [l.hitos.filter((h) => h.nombre === 'Poner a la firma').length, !!ps.filter((x) => x.titulo === 'Preparar el certificado')[0].comun, ps.filter((x) => x.comun).length]; }),
  [1, false, 3]);
await comprobar('5g. las listas están en el disco', p.evaluate(async () => { const l = await ComunesGuardado.leer(); return [l.tareas.length > 5, l.hitos.length > 5]; }), [true, true]);

console.log('--- 6. los asuntos abiertos no cambian ---');
await comprobar('6a. cada asunto abierto tiene los mismos hitos y las mismas tareas que antes', abiertos(), abiertosAntes);

console.log('--- 7. lo viejo ya no está ---');
await comprobar('7a. en Herramientas no están «Aplicar el plan», «Tipos y su uso», la propuesta ni «Cargar la biblioteca del centro»',
  p.evaluate(() => App.ir('ajustes') || true).then(async () => { await p.waitForTimeout(500); await p.evaluate(() => App.ir('herramientas')); await p.waitForTimeout(800);
    return p.evaluate(() => ['bloque-plan-guias', 'bloque-tipos-uso', 'bloque-comunes-propuesta', 'bloque-cargar-biblioteca'].map((id) => { const e = document.getElementById(id); return !e || getComputedStyle(e).display === 'none'; })); }),
  [true, true, true, true]);
await comprobar('7b. el editor de la guía no tiene añadir hito o tarea en blanco ni «+ Traer un hito de otro tipo», y sí las de la lista', (async () => {
  await p.evaluate(() => { GuiasDelCentro.escribir('CAMBIO DE GRUPO'); });
  await p.waitForSelector('#guia-anadir-comun');
  const r = [await visible('#guia-anadir'), await visible('#guia-traer-biblioteca'), await visible('#guia-anadir-comun')];
  await p.evaluate(() => { const d = document.querySelector('.paso-guion'); if (d) d.open = true; });
  r.push(await visible('.guion-anadir'), await visible('.comunes-anadir-tarea-guia'));
  return r;
})(), [false, false, true, false, true]);
await p.evaluate(() => { const c = document.getElementById('cuadro-cancelar'); if (c) c.click(); });
await p.waitForTimeout(400);
await comprobar('7c. en un asunto no está el formulario de «Nueva tarea» (fila 638: con el plan aplicado, «+ Añadir tarea» abre la lista común) y sí «+ Añadir tarea»', (async () => {
  const n = await p.evaluate(() => App.E.listaAbiertos.filter((x) => (x.leido && x.leido.tipo || x.ficha && x.ficha.tipo) === 'MATRICULA')[0].nombre);
  await p.evaluate((nombre) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === nombre)[0], 'abierto'), n);
  const id = await p.evaluate(async (nombre) => (await Hitos.hitosDe(nombre))[0].id, n);
  await abrirHito(p, id);
  await p.waitForSelector('.hito-en-mesa .comunes-anadir-tarea');
  return [await hay('.hito-en-mesa .tcd-nueva'), await visible('.hito-en-mesa .tcd-nueva'), await visible('.hito-en-mesa .comunes-anadir-tarea')];
})(), [false, false, true]);

console.log('--- 8. activar un tipo después ---');
const antesActivar = await p.evaluate(() => JSON.stringify(GuiasDelCentro.pasosDe('Alta y actualización de datos').map((x) => (x.guion || []).map((g) => !!g.comun))));
await comprobar('8a. un tipo desactivado conserva su guía sin tocar al aplicar el plan', antesActivar, '[[false,false],[],[]]');
const tareasAntes = await p.evaluate(async () => (await ComunesGuardado.leer()).tareas.length);
await p.evaluate(async () => { await TiposDesactivar.activar(App.E.tipos.filter((t) => t.tipo === 'Alta y actualización de datos')[0]); });
await p.waitForTimeout(800);
await comprobar('8b. al activarlo, su guía pasa a las listas: lo igual se une con lo que ya estaba y lo nuevo entra nuevo', p.evaluate(async (antes) => {
  const g = GuiasDelCentro.pasosDe('Alta y actualización de datos');
  const l = await ComunesGuardado.leer();
  return [g.map((x) => x.titulo), g.map((x) => (x.guion || []).map((m) => !!m.comun)), l.tareas.length - antes, g[0].guion[0].texto];
}, tareasAntes), [['Recoger los datos', 'Grabar en Séneca'], [[true, true], [], ], 1, 'Registrar de entrada el documento']);
await comprobar('8c. y avisa de cuántas ya estaban y cuántas entran', p.evaluate(() => /ha pasado a las listas comunes: 1 tarea ya estaba en la lista y 1 entra nueva/.test(document.body.textContent)), true);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\ntodo bien');
process.exit(fallos ? 1 : 0);
