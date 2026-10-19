/* Prueba en navegador de verdad de los avisos a hora fija del tablón
   (fila 372, docs/TABLON-AVISO-A-HORA-FIJA.md): hora y antelación al
   escribir, la marca en el tablón, la ventana del aviso («Entendido» y
   «Recordar»), la que sale tarde («era a las…»), quién la ve, «Cambiar»,
   la regla de apertura y la fusión de copias en conflicto.
   El reloj de los avisos se adelanta con TablonAvisos._interno.ponerReloj;
   el sonido no se comprueba (el navegador sin cabeza no deja sonar). */
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
const tablon = () => pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('tablon.json');
  return JSON.parse(await (await h.getFile()).text()).notas;
});
const hayVentana = () => pagina.evaluate(() => !!document.getElementById('tablon-aviso'));
const adelantar = (min) => pagina.evaluate((m) => { TablonAvisos._interno.ponerReloj(() => new Date(Date.now() + m * 60000)); return TablonAvisos.revisar(); }, min);
const pasar = () => pagina.waitForTimeout(250);

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Alguien 1140233', { create: true });
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const f = await g.getFileHandle('estado-migrado.json', { create: true });
  const w = await f.createWritable(); await w.write('{}'); await w.close();
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);

console.log('--- 1) escribir una nota con día, hora y antelación ---');
if (await pagina.locator('#tablon-plegado').count()) await pagina.click('#tablon-plegado');
await pagina.click('#tablon-texto');
await comprobar('sin día, la hora no se puede poner', pagina.locator('#tablon-hora').isDisabled(), true);
await comprobar('y «Avisar» no se ve', pagina.locator('#tablon-antes').isVisible(), false);
const cita = await pagina.evaluate(() => {
  const d = new Date(Date.now() + 20 * 60000), z = (x) => String(x).padStart(2, '0');
  return { dia: d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()), hora: z(d.getHours()) + ':' + z(d.getMinutes()), corta: d.getHours() + ':' + z(d.getMinutes()) };
});
await pagina.fill('#tablon-texto', 'Reunión de tutores de 1º ESO: darles los carnés');
await pagina.fill('#tablon-para', cita.dia);
await comprobar('con día, la hora se puede poner', pagina.locator('#tablon-hora').isDisabled(), false);
await pagina.fill('#tablon-hora', cita.hora);
await comprobar('con hora, «Avisar» se ve y viene en 15 minutos antes', pagina.locator('#tablon-antes').evaluate(e => [e.offsetParent !== null, e.value]), [true, '15']);
await pagina.click('.tablon-pegar');
await pagina.waitForTimeout(500);
await comprobar('la nota se guarda con hora y antelación', tablon().then(l => l.map(n => [n.hora, n.antes, n.atendido])), [[cita.hora, 15, []]]);
await comprobar('su marca lleva el relojito, «Hoy» y la hora',
  pagina.locator('.tablon-fila-compacta-fecha').first().textContent(), '🕘 Hoy ' + cita.corta);
await comprobar('todavía no ha llegado su aviso', hayVentana(), false);

console.log('--- 2) la ventana sale a la hora del aviso ---');
await adelantar(4);
await comprobar('4 minutos después (faltan 16 para la cita) no sale', hayVentana(), false);
await adelantar(6);
await pasar();
await comprobar('a los 6 minutos (aviso 15 antes) sale', hayVentana(), true);
await comprobar('lleva el título, el texto y el día con la hora',
  pagina.evaluate(() => [document.getElementById('tablon-aviso-titulo').textContent,
    document.querySelector('.tablon-aviso-texto').textContent,
    /^[a-záéíóú]+ \d\d\/\d\d\/\d{4} a las \d+:\d\d$/.test(document.querySelector('.tablon-aviso-dia').textContent),
    !document.querySelector('.tablon-aviso-era')]),
  ['Aviso del tablón', 'Reunión de tutores de 1º ESO: darles los carnés', true, true]);
await comprobar('y los dos botones', pagina.evaluate(() => [...document.querySelectorAll('#tablon-aviso button')].map(b => b.textContent)), ['Entendido', 'Recordar en 10 minutos']);
await comprobar('la pestaña empieza por la campana', pagina.evaluate(() => document.title.indexOf('🔔 ') === 0), true);
await comprobar('la ventana no cuelga del tablón', pagina.evaluate(() => !document.getElementById('tablon').contains(document.getElementById('tablon-aviso'))), true);
await pagina.evaluate(() => { App.pintarAbiertos(); });
await pagina.waitForTimeout(100);
await comprobar('un repintado de Inicio no la destruye', hayVentana(), true);

console.log('--- 3) «Recordar en 10 minutos» ---');
await pagina.click('#tablon-aviso-recordar');
await comprobar('cierra la ventana y quita la campana', pagina.evaluate(() => [!document.getElementById('tablon-aviso'), document.title.indexOf('🔔') === -1]), [true, true]);
await adelantar(12);
await comprobar('a los 6 minutos de recordarla, no', hayVentana(), false);
await adelantar(17);
await pasar();
await comprobar('pasados los 10 minutos vuelve a salir', hayVentana(), true);

console.log('--- 4) «Entendido» ---');
await pagina.click('#tablon-aviso-entendido');
await pasar();
await comprobar('se cierra', hayVentana(), false);
await comprobar('queda apuntado en la nota quién lo atendió, con el momento',
  tablon().then(l => l[0].atendido.map(a => [a.q, a.m === cita.dia + ' ' + cita.hora + ' 15'])), [['Ana', true]]);
await adelantar(30);
await pasar();
await comprobar('y no vuelve a salir', hayVentana(), false);

console.log('--- 5) una nota de otro que ya pasó, sin atender: «era a las…» ---');
await pagina.evaluate(async () => {
  TablonAvisos._interno.ponerReloj(null);
  await Tablon.cambiar((l) => {
    l.push({ id: 'otra1', texto: 'Entregar la hoja de guardias', color: 'rosa', autor: 'Luis', creado: new Date().toISOString(),
      para: '2026-10-18', hora: '09:30', antes: 15, atendido: [], privada: false, hecha: false, hechaPor: '', hechaEl: '' });
    l.push({ id: 'priv1', texto: 'Solo para Luis', color: 'azul', autor: 'Luis', creado: new Date().toISOString(),
      para: '2026-10-18', hora: '08:00', antes: 15, atendido: [], privada: true, hecha: false, hechaPor: '', hechaEl: '' });
    l.push({ id: 'hecha1', texto: 'Ya hecha', color: 'verde', autor: 'Luis', creado: new Date().toISOString(),
      para: '2026-10-18', hora: '07:00', antes: 15, atendido: [], privada: false, hecha: true, hechaPor: 'Luis', hechaEl: new Date().toISOString() });
    return l;
  });
  await TablonAvisos.revisar();
});
await pasar();
await comprobar('sale la de Luis, con «era a las 9:30»', pagina.evaluate(() => [
  !!document.getElementById('tablon-aviso'),
  document.querySelector('.tablon-aviso-texto').textContent,
  (document.querySelector('.tablon-aviso-era') || {}).textContent]), [true, 'Entregar la hoja de guardias', 'era a las 9:30']);
await comprobar('la privada de otro y la hecha no avisan (solo hay una esperando: ninguna más)',
  pagina.evaluate(() => !document.querySelector('.tablon-aviso-mas')), true);
await pagina.click('#tablon-aviso-entendido');
await pasar();
await comprobar('«Entendido» y ya no queda ninguna', hayVentana(), false);
await comprobar('a Ana se le apunta solo a ella; la nota no se toca en otra cosa',
  tablon().then(l => l.filter(n => n.id === 'otra1').map(n => n.atendido.map(a => a.q))), [['Ana']]);

console.log('--- 6) en la marca y en el papel, una nota pasada ---');
await pagina.evaluate(() => TablonVista.pintar());
await comprobar('la marca dice «pasada» y no «Atrasada»', pagina.evaluate(() => {
  const m = [...document.querySelectorAll('.tablon-fila-compacta')].map(f => f.querySelector('.tablon-fila-compacta-fecha').textContent);
  return m.filter(t => /pasada$/.test(t)).length === 1 && m.indexOf('Atrasada') === -1;
}), true);
await comprobar('el papel entero también', pagina.evaluate(() => TablonHora.marcaLarga({ para: '2026-10-18', hora: '09:30', antes: 15 })), 'Pasada: 18/10/2026 a las 9:30');

console.log('--- 7) «Cambiar» gana día, hora y antelación, y vuelve a armar el aviso ---');
await pagina.evaluate(() => { TablonAvisos._interno.ponerReloj(null); });
await pagina.evaluate(() => {
  const f = [...document.querySelectorAll('.tablon-fila-compacta')].find(x => x.textContent.indexOf('Reunión de tutores') !== -1);
  f.click();
});
await pagina.getByRole('button', { name: 'Cambiar', exact: true }).first().click();
await pagina.waitForSelector('#papel-hora');
await comprobar('en el papel aparecen día, hora y «Avisar»', pagina.evaluate(() => [document.getElementById('papel-para').value, document.getElementById('papel-hora').value, document.getElementById('papel-antes').value]), [cita.dia, cita.hora, '15']);
await pagina.selectOption('#papel-antes', '0');
await pagina.getByRole('button', { name: 'Guardar', exact: true }).click();
await pagina.waitForTimeout(500);
await comprobar('la antelación cambia y la lista de quién lo atendió se vacía',
  tablon().then(l => l.filter(n => /Reunión/.test(n.texto)).map(n => [n.antes, n.atendido.length])), [[0, 0]]);
await comprobar('y a su nuevo momento vuelve a salir', pagina.evaluate(async () => { TablonAvisos._interno.ponerReloj(() => new Date(Date.now() + 25 * 60000)); await TablonAvisos.revisar(); return !!document.getElementById('tablon-aviso'); }), true);
await pagina.click('#tablon-aviso-entendido');
await pasar();

console.log('--- 8) una nota que nace con su aviso ya pasado: quien la escribe, atendida ---');
await pagina.evaluate(() => TablonAvisos._interno.ponerReloj(null));
const proxima = await pagina.evaluate(() => {
  const d = new Date(Date.now() + 5 * 60000), z = (x) => String(x).padStart(2, '0');
  return { dia: d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()), hora: z(d.getHours()) + ':' + z(d.getMinutes()) };
});
await pagina.click('#tablon-texto');
await pagina.fill('#tablon-texto', 'Llamar al inspector');
await pagina.fill('#tablon-para', proxima.dia);
await pagina.fill('#tablon-hora', proxima.hora);
await pagina.click('.tablon-pegar');
await pagina.waitForTimeout(500);
await comprobar('(cita en 5 minutos, aviso 15 antes) ya va atendida por Ana',
  tablon().then(l => l.filter(n => n.texto === 'Llamar al inspector').map(n => n.atendido.map(a => a.q))), [['Ana']]);
await adelantar(1);
await pasar();
await comprobar('y no le sale la ventana', hayVentana(), false);

console.log('--- 9) regla de apertura y orden ---');
await pagina.evaluate(async () => {
  TablonAvisos._interno.ponerReloj(null);
  await Tablon.cambiar(() => []);
});
await pagina.evaluate(async () => {
  const hoy = TablonHora.hoyIso(new Date()), z = (x) => String(x).padStart(2, '0');
  const ahora = new Date(), mas = new Date(Date.now() + 3 * 3600000), antes = new Date(Date.now() - 3 * 3600000);
  const h = (d) => z(d.getHours()) + ':' + z(d.getMinutes());
  window.__h = { mas: h(mas), antes: h(antes), hoy, cruza: mas.getDate() !== ahora.getDate() || antes.getDate() !== ahora.getDate() };
});
const dia = await pagina.evaluate(() => window.__h);
if (!dia.cruza) {
  await pagina.evaluate(async () => {
    await Tablon.cambiar((l) => {
      const base = { color: 'amarillo', autor: 'Ana', creado: new Date().toISOString(), privada: false, atendido: [], hecha: false, hechaPor: '', hechaEl: '', antes: 0 };
      l.push(Object.assign({}, base, { id: 'p1', texto: 'sin hora', para: window.__h.hoy, hora: '' }));
      l.push(Object.assign({}, base, { id: 'p2', texto: 'tarde', para: window.__h.hoy, hora: window.__h.mas }));
      l.push(Object.assign({}, base, { id: 'p3', texto: 'temprano', para: window.__h.hoy, hora: window.__h.antes }));
      return l;
    });
    await Tablon.cambiar((l) => l.filter(n => n.id !== 'p1'));
  });
  await pagina.waitForTimeout(300);
  await comprobar('mismo día: por hora; el de ese día sin hora, detrás', pagina.evaluate(async () => {
    await Tablon.cambiar((l) => { l.push({ id: 'p1', texto: 'sin hora', color: 'amarillo', autor: 'Ana', creado: new Date().toISOString(), para: window.__h.hoy, hora: '', antes: 0, atendido: [], privada: false, hecha: false, hechaPor: '', hechaEl: '' }); return l; });
    return [...document.querySelectorAll('.tablon-fila-compacta-texto')].map(t => t.textContent);
  }), ['temprano', 'tarde', 'sin hora']);
  await comprobar('hay una nota de hoy con hora futura: el tablón abre', pagina.evaluate(() => { TablonVista.reglaApertura(); return !!document.getElementById('tablon-texto'); }), true);
  await pagina.evaluate(async () => { await Tablon.cambiar((l) => l.filter(n => n.id === 'p3')); TablonVista.reglaApertura(); });
  await pagina.click('#tablon-pliega');
  await comprobar('solo con una nota de hoy con hora pasada, no abre', pagina.evaluate(() => { TablonVista.reglaApertura(); return !!document.getElementById('tablon-plegado'); }), true);
}

console.log('--- 10) solo consulta: «Entendido» no escribe tablon.json ---');
await pagina.evaluate(async () => {
  await Tablon.cambiar(() => [{ id: 'c1', texto: 'Aviso para consulta', color: 'amarillo', autor: 'Ana', creado: new Date().toISOString(),
    para: '2026-10-18', hora: '10:00', antes: 15, atendido: [], privada: false, hecha: false, hechaPor: '', hechaEl: '' }]);
  window.__escrituras = 0;
  const comoEra = Tablon.cambiar;
  Tablon.cambiar = function () { window.__escrituras++; return comoEra.apply(this, arguments); };
  window.__activo = SoloConsulta.activo;
  SoloConsulta.activo = () => true;
  await TablonAvisos.revisar();
});
await pasar();
await comprobar('sale la ventana', hayVentana(), true);
await pagina.click('#tablon-aviso-entendido');
await pasar();
await comprobar('no intenta escribir; queda en este ordenador',
  pagina.evaluate(() => [window.__escrituras, JSON.parse(localStorage.getItem('gestor.tablon.entendidos')).c1]), [0, '2026-10-18 10:00 15']);
await pagina.evaluate(() => { SoloConsulta.activo = window.__activo; });

console.log('--- 11) fusión de copias en conflicto: se unen los «Entendido» ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const base = { id: 'f1', texto: 'Fusionar', color: 'amarillo', autor: 'Ana', creado: 'x', para: '2026-10-20', hora: '09:30', antes: 15, privada: false, hecha: false };
  const real = { notas: [Object.assign({}, base, { atendido: [{ q: 'Ana', m: '2026-10-20 09:30 15' }] })] };
  const conflicto = { notas: [Object.assign({}, base, { atendido: [{ q: 'Luis', m: '2026-10-20 09:30 15' }, { q: 'Eva', m: '2026-10-20 09:00 15' }] })] };
  g._hijos.set('tablon.json', window.__disco.fich('tablon.json', JSON.stringify(real)));
  g._hijos.set('tablon (copia en conflicto de PC2 2026-10-19).json',
    window.__disco.fich('tablon (copia en conflicto de PC2 2026-10-19).json', JSON.stringify(conflicto)));
  await window.Conflictos.revisar();
});
await comprobar('quedan Ana y Luis; el de una hora vieja (Eva) no revive',
  tablon().then(l => l[0].atendido.map(a => a.q).sort()), ['Ana', 'Luis']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
