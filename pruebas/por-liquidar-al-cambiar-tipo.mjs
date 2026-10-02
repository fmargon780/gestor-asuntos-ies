/* Fila 253 (docs/POR-LIQUIDAR-AL-CAMBIAR-TIPO.md): un asunto abierto, de un tipo que hay
   que liquidar y sin ningún hito por hacer, pasa solo a «Por liquidar» al cambiarle el tipo,
   al marcar la casilla del tipo y en una pasada al entrar. Con Chromium real y los datos
   inventados de la copia de pruebas (?demo=1&auto=1). */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
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

await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) { /* sin almacenamiento */ }");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 20000 });

/* Un tipo nuevo sin casilla (PRUEBA LIQ), otro con casilla (el seguro escolar de la demo) y
   cuatro asuntos: uno de otro tipo sin hitos, dos de PRUEBA LIQ sin hitos y uno de PRUEBA LIQ
   con un hito por hacer. */
await pagina.evaluate(async () => {
  App.E.tipos.push({ tipo: 'PRUEBA LIQ', categoria: 'ALUMNADO', liquidar: false });
  await App.guardarTipos();
  const g = App.E.gestor;
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify({ 'PRUEBA LIQ': [{ id: 'pl-1', titulo: 'Hacer algo', cuerpo: '', opciones: [], responsable: 'tercero' }] }));
  await w.close();
  const nombres = ['261002 A26-0801 SEGURO ESCOLAR Alta Cero, Ana 7770001', '261002 A26-0802 PRUEBA LIQ Alta Uno, Eva 7770002',
    '261002 A26-0803 PRUEBA LIQ Alta Dos, Rosa 7770003', '261002 A26-0804 PRUEBA LIQ Alta Tres, Pía 7770004'];
  for (const n of nombres) {
    await App.E.abiertos.getDirectoryHandle(n, { create: true });
    await App.anotar(n, { abiertoEl: U.ahora(), tipo: n.indexOf('SEGURO') !== -1 ? 'SEGURO ESCOLAR' : 'PRUEBA LIQ', categoria: 'ALUMNADO', tercero: n.split(' ').slice(-4).join(' '), curso: '26-27', grupo: '', descripcion: '', campos: {} });
  }
  await App.verAbiertos();
  /* Los asuntos con guía (la del seguro escolar de la demo y la de PRUEBA LIQ) reciben su hito
     solos: se dan por hechos los de los tres primeros (sin nada por hacer); el cuarto se queda con el suyo. */
  for (const n of nombres.slice(0, 3)) for (const h of await Hitos.hitosDe(n)) await Hitos.marcar(n, h.id, 'hecho', '');
});
const estado = (trozo) => pagina.evaluate((t) => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(t) !== -1)[0]; return a ? PorLiquidar.estaPorLiquidar(a) : 'no está'; }, trozo);
const nombre = (trozo) => pagina.evaluate((t) => Gestor.asuntos().filter((x) => x.nombre.indexOf(t) !== -1)[0].nombre, trozo);
const avisos = () => pagina.evaluate(() => [...document.querySelectorAll('.mensaje')].map((m) => m.textContent.trim()));

console.log('--- 1. al cambiar el tipo ---');
await comprobar('1. antes: el asunto de seguro escolar sin hitos no está en «Por liquidar»', estado('A26-0801'), false);
await pagina.evaluate(async () => { await PorLiquidar.alCambiarTipo(Gestor.asuntos().filter((x) => x.nombre.indexOf('A26-0801') !== -1)[0].nombre, 'FACTURA', 'SEGURO ESCOLAR'); });
await comprobar('1. cambiado el tipo, pasa solo', estado('A26-0801'), true);
await comprobar('1. con su aviso «Pasa a Por liquidar.» y «Deshacer»', pagina.evaluate(() => [[...document.querySelectorAll('.mensaje')].some((m) => /Pasa a Por liquidar/.test(m.textContent)), !!document.querySelector('.mensaje-boton')]), [true, true]);
await comprobar('1. entra como automático', pagina.evaluate(() => Gestor.asuntos().filter((x) => x.nombre.indexOf('A26-0801') !== -1)[0].ficha.porLiquidar.auto), true);
await pagina.click('.mensaje-boton');
await pagina.waitForTimeout(500);
await comprobar('2. «Deshacer» lo saca de «Por liquidar»', estado('A26-0801'), false);
await comprobar('2. y sigue siendo del mismo tipo', pagina.evaluate(() => Gestor.asuntos().filter((x) => x.nombre.indexOf('A26-0801') !== -1)[0].leido.tipo), 'SEGURO ESCOLAR');
await comprobar('4. un asunto de seguro escolar con un hito por hacer no pasa (el de la demo)',
  pagina.evaluate(async () => { const a = Gestor.asuntos().filter((x) => /SEGURO ESCOLAR/.test(x.nombre) && !PorLiquidar.estaPorLiquidar(x) && x.nombre.indexOf('A26-0801') === -1)[0]; if (!a) return 'no hay'; const antes = PorLiquidar.estaPorLiquidar(a); const hs = await Hitos.hitosDe(a.nombre); const pendiente = hs.some((h) => h.estado !== 'hecho'); await PorLiquidar.alCambiarTipo(a.nombre, 'FACTURA', 'SEGURO ESCOLAR'); return [antes, pendiente, PorLiquidar.estaPorLiquidar(a)]; }),
  [false, true, false]);

/* Un asunto con todos sus hitos hechos, pero de otra guía: el tipo nuevo trae pasos que aún no tiene
   (se le añadirán al abrir su ficha), así que no pasa. */
await pagina.evaluate(async () => {
  const n = '261002 A26-0805 SEGURO ESCOLAR Alta Cinco, Lía 7770005';
  await App.E.abiertos.getDirectoryHandle(n, { create: true });
  await App.anotar(n, { abiertoEl: U.ahora(), tipo: 'SEGURO ESCOLAR', categoria: 'ALUMNADO', tercero: 'Alta Cinco, Lía 7770005', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
  const base = (await Hitos.hitosDe('261002 A26-0801 SEGURO ESCOLAR Alta Cero, Ana 7770001'))[0];
  await Hitos.cambiar((d) => { d.porAsunto[n] = { creados: '2026-10-02', hitos: [Object.assign({}, base, { id: 'otra-1', origenGuia: 'otra-1', estado: 'hecho' })], pasosConocidos: ['otra-1'] }; return d; });
  await PorLiquidar.alCambiarTipo(n, 'FACTURA', 'SEGURO ESCOLAR');
});
await comprobar('3. con todos sus hitos hechos pero faltándole pasos de la guía del tipo nuevo, no pasa', estado('A26-0805'), false);

console.log('--- 5. al marcar la casilla en un tipo ---');
await comprobar('5. PRUEBA LIQ sin casilla: ninguno en «Por liquidar»', Promise.all([estado('A26-0802'), estado('A26-0803'), estado('A26-0804')]), [false, false, false]);
await pagina.evaluate(() => document.querySelectorAll('.mensaje').forEach((m) => m.remove()));
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(400);
await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'PRUEBA LIQ' }).locator('.tarjeta-tipo-nombre').click().catch(async () => {
  await pagina.fill('#buscar-tipos', 'PRUEBA LIQ'); await pagina.waitForTimeout(300);
  await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'PRUEBA LIQ' }).locator('.tarjeta-tipo-nombre').click();
});
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
const casilla = pagina.locator('#pantalla-tipo-asunto label.interruptor', { hasText: 'Hay que liquidarlo antes de archivar' }).locator('input');
await casilla.evaluate((el) => { el.checked = true; el.dispatchEvent(new Event('change')); });
await pagina.waitForTimeout(1200);
await comprobar('5. pasan los dos sin hitos por hacer y no el que tiene uno', Promise.all([estado('A26-0802'), estado('A26-0803'), estado('A26-0804')]), [true, true, false]);
await comprobar('5. un solo aviso: «2 asuntos pasan a Por liquidar.»', avisos().then((a) => a.filter((t) => /Por liquidar/.test(t)).map((t) => t.replace(/Deshacer$/, '').trim())), ['2 asuntos pasan a Por liquidar.']);
await pagina.locator('.mensaje-boton').first().click();
await pagina.waitForTimeout(800);
await comprobar('5. «Deshacer» los devuelve a los dos', Promise.all([estado('A26-0802'), estado('A26-0803')]), [false, false]);

console.log('--- 6. la pasada al entrar ---');
await pagina.evaluate(() => document.querySelectorAll('.mensaje').forEach((m) => m.remove()));
await pagina.evaluate(() => PorLiquidar._alEntrar());
await pagina.waitForTimeout(3600);
await comprobar('6. recoge los dos que ya estaban en esa situación (y no el del hito por hacer)', Promise.all([estado('A26-0802'), estado('A26-0803'), estado('A26-0804')]), [true, true, false]);
await comprobar('6. sin aviso verde', avisos().then((a) => a.filter((t) => /Por liquidar/.test(t)).length), 0);
await comprobar('6. y deja la línea en el registro del asunto',
  pagina.evaluate(async () => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('A26-0802') !== -1)[0]; return JSON.stringify(a.ficha).indexOf('Pasa a Por liquidar') !== -1 || JSON.stringify(App.E.registro.asuntos[a.nombre] || {}).indexOf('Pasa a Por liquidar') !== -1; }),
  true);

console.log('--- 7. quitar la casilla no saca a nadie ---');
await casilla.evaluate((el) => { el.checked = false; el.dispatchEvent(new Event('change')); });
await pagina.waitForTimeout(500);
await comprobar('7. los que ya estaban en «Por liquidar» se quedan', Promise.all([estado('A26-0802'), estado('A26-0803')]), [true, true]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
