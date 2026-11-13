/* Prueba en navegador de verdad de la fila 255 de docs/COLA.md
   (docs/CAMPOS-DE-UN-HITO.md): campos de un hito. Con los datos de demostración:
   el tipo FACTURA lleva «Fecha de la factura» en el hito «Tramitar el pago».

   Fila 638: la tarjeta «Campos de este hito» de la mesa (con «+ Añadir campo», su «⋮» y «¿Dónde se guarda?») ya no existe; las
   partes 4, 5 y 6 de esta prueba (todas de esa tarjeta) se han quitado. Quedan:
   1. El hito ya no lleva la tarjeta de campos; el tipo conserva el campo con la marca de su hito.
   2. El valor está en el asunto y sale en «Datos».
   3. El otro asunto del tipo no lo tiene.
   7. Borrar el paso de la guía: el campo pasa a ser del asunto, con su valor.
   Más: las funciones puras, y sin errores en la consola. */
import { chromium } from 'playwright';
import { abrirHito, verLaLista } from './apoyo/hito.mjs';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
/* Fila 530: «+ Añadir campo» abre ahora la ventana de elegir (pruebas/datos-del-asunto.mjs); esta prueba sigue con el panel de siempre. */
await pagina.addInitScript(() => { Object.defineProperty(window, 'CampoElegirEnAsunto', { get() { return undefined; }, set() {}, configurable: true }); });
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto], #inicio-tabla-cuerpo .fila', { timeout: 20000 });

/* 0. Las funciones puras. */
await comprobar('0. repartir: sin hito, por hito y el que ya no existe',
  pagina.evaluate(() => {
    const hitos = [{ id: 'h1', origenGuia: 'g1', titulo: 'Uno' }, { id: 'h2', origenGuia: null, titulo: 'Dos' }];
    const campos = [{ n: 'a' }, { n: 'b', hito: 'g1' }, { n: 'c', hito: 'h2' }, { n: 'd', hito: 'perdido' }, { n: 'e', hito: 'perdido' }];
    const r = CamposDeHito.repartir(campos, hitos, (c) => c.n === 'd');
    return { sin: r.sinHito.map((c) => c.n), por: r.porHito.map((g) => g.hito.titulo + ':' + g.campos.map((c) => c.n).join('')) };
  }), { sin: ['a', 'd'], por: ['Uno:b', 'Dos:c'] });
await comprobar('0. camposDeAsunto: el hito de la ficha se pone al campo del tipo; «hito: \'\'» lo quita',
  pagina.evaluate(() => {
    const tipo = [{ origen: 'propio', id: 'a' }, { origen: 'propio', id: 'b', hito: 'g' }];
    const f = { camposPropiosDelAsunto: [{ origen: 'propio', id: 'a', hito: 'x' }, { origen: 'propio', id: 'b', hito: '' }] };
    return Campos.camposDeAsunto(tipo, f).map((c) => c.id + ':' + (c.hito || '-'));
  }), ['a:x', 'b:-']);

/* Los dos asuntos FACTURA. */
const facturas = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => (a.ficha && a.ficha.tipo) === 'FACTURA' || (a.leido && a.leido.tipo) === 'FACTURA').map((a) => a.nombre));
const A1 = facturas[0], A2 = facturas[1];
const hitosDe = (n) => pagina.evaluate(async (x) => (await Hitos.hitosDe(x)).map((h) => ({ id: h.id, titulo: h.titulo, origen: h.origenGuia })), n);
const H = await hitosDe(A1);
const H2 = await hitosDe(A2);
const quitarAvisos = () => pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove()));
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'), (m) => m.firstChild.textContent));
const fichaDe = (n) => pagina.evaluate((x) => { const f = App.E.registro.asuntos[x] || {}; return { campos: f.campos, solo: f.camposPropiosDelAsunto }; }, n);
const configTipo = () => pagina.evaluate(async () => ((await Carpetas.leerJson(App.E.gestor, 'campos.json')).porTipo || {}).FACTURA || []);

async function abrirMesa(nombre, idHito) {
  await pagina.evaluate(() => { if (window.HitoMesa && HitoMesa.estaAbierta()) HitoMesa.cerrar(); });
  await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'); }, nombre);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(500);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  await abrirHito(pagina, '' + idHito + '');
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + idHito + '"]');
  await pagina.waitForTimeout(400);
}
const tarjeta = () => pagina.locator('#ficha-guia .hito-en-mesa .mesa-campos-hito');
const resumenTarjeta = () => pagina.evaluate(() => {
  const t = document.querySelector('#ficha-guia .hito-en-mesa .mesa-campos-hito');
  return t ? { titulo: t.querySelector('.mesa-bloque-titulo').textContent, boton: (t.querySelector('.mesa-campo-hito-anadir') || {}).textContent,
    campos: Array.prototype.map.call(t.querySelectorAll('.mesa-campo-hito > .etiqueta'), (e) => e.textContent.trim()) } : null;
});

/* Fila 638 (docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md): el hito ya no lleva la tarjeta «Campos de este hito» (con su «+ Añadir campo»,
   «⋮» y la ventana «¿Dónde se guarda?»): los campos están en el bloque «Datos» de la derecha. Se comprueba lo que sigue en pie: el hito
   sin la tarjeta, el campo con la marca de su hito en el tipo, el valor en el asunto y en el otro asunto vacío. */

/* 1. Sin tarjeta. */
await abrirMesa(A1, H[1].id);
await comprobar('1. «Tramitar el pago»: el hito ya no lleva tarjeta de campos', pagina.evaluate(() => document.querySelectorAll('#ficha-guia .hito-en-mesa .mesa-campos-hito').length), 0);
await comprobar('1. el tipo sigue llevando «Fecha de la factura» con la marca de ese hito',
  configTipo().then((c) => c.filter((x) => x.id === 'p-fecha-factura').map((x) => x.hito === H[1].origen)), [true]);

/* 2. El valor, en el asunto (se escribe como lo hacía la tarjeta) y a la vista en «Datos». */
await quitarAvisos();
await pagina.evaluate(async (n) => {
  const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
  await CampoDesdeElAsunto._i.escribirEnAsunto(a, 'propio:p-fecha-factura', { valor: '2026-09-30' });
  CampoDesdeElAsunto._i.repintar(a);
}, A1);
await pagina.waitForTimeout(800);
await comprobar('2. el valor está en la ficha del asunto', fichaDe(A1).then((f) => f.campos['propio:p-fecha-factura'].valor), '2026-09-30');
await pagina.evaluate(() => FichaTarjetas.abrir('datos'));
await pagina.waitForTimeout(700);
await comprobar('2. en «Datos» sale en «Campos de este asunto» con su valor',
  pagina.evaluate(() => /Fecha de la factura\s*30\/09\/2026/.test(document.getElementById('ficha-datos-bloque').innerText.replace(/\s+/g, ' '))), true);
await pagina.evaluate(() => FichaTarjetas.plegar('datos'));

/* 3. El otro asunto. */
await abrirMesa(A2, H2[1].id);
await comprobar('3. en el otro asunto el campo no tiene valor',
  fichaDe(A2).then((f) => !f.campos || !f.campos['propio:p-fecha-factura'] || !f.campos['propio:p-fecha-factura'].valor), true);

/* 7. Borrar el paso de la guía: el campo del tipo pasa a ser del asunto. */
await comprobar('8. «Fecha de la factura» sigue con hito antes de borrar el paso',
  configTipo().then((c) => c.filter((x) => x.id === 'p-fecha-factura').map((x) => !!x.hito)), [true]);
await pagina.evaluate(async () => {
  await GuiasDelCentro.cambiarPasos('FACTURA', (pasos) => { pasos.splice(1, 1); });
});
await pagina.waitForTimeout(800);
await comprobar('8. sin el paso, el campo pasa a ser del asunto',
  configTipo().then((c) => c.filter((x) => x.id === 'p-fecha-factura').map((x) => !x.hito)), [true]);
await comprobar('8. y el valor se conserva', fichaDe(A1).then((f) => f.campos['propio:p-fecha-factura'].valor), '2026-09-30');

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
