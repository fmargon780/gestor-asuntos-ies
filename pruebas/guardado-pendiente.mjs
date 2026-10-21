/* Prueba en navegador de verdad de la fila 364
   (docs/GUARDAR-SIN-PERDER-Y-ARCHIVAR-RAPIDO.md, parte 1): un cambio
   de datos que no se puede guardar no se tira.

   Disco de mentira de pruebas/navegador.mjs, con `asuntos.json`
   fallando siempre con InvalidStateError (lo que da Dropbox
   sincronizando) mientras `window.__romper` sea true.

   1. Falla siempre: sale el aviso rojo fijo, el cambio se ve en la
      pantalla, queda apuntado en el navegador, no sale el aviso rojo
      de un solo uso y quien pidió guardar sigue esperando.
   2. Se deja de forzar el fallo: se guarda solo, el aviso se quita,
      quien esperaba recibe su «guardado» y el cambio está en el disco.
   3. Un guardado posterior con el fallo activo no deshace el pendiente
      (los dos cambios acaban en el disco).
   4. «Recargar la pestaña»: lo apuntado en el navegador se recupera y
      se escribe.
   5. Si mientras tanto otro ordenador archivó ese asunto, el cambio se
      tira: aviso rojo con botón de cerrar, número real del asunto, y
      el aviso fijo se quita. */
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

const NOMBRE = 'A26-0364 MATRICULA 26-27 Pendiente Uno, Ana 3640001';
const NOMBRE_B = 'A26-0365 MATRICULA 26-27 Pendiente Dos, Luis 3640002';

await pagina.evaluate(async ([a, b]) => {
  for (const [nombre, tercero] of [[a, 'Pendiente Uno, Ana 3640001'], [b, 'Pendiente Dos, Luis 3640002']]) {
    await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
    const actual = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json') || { asuntos: {} };
    actual.asuntos[nombre] = { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: tercero, estado: 'abierto', notas: [] };
    await window.Carpetas.guardarJson(window.App.E.gestor, 'asuntos.json', actual);
  }
  await window.App.cargarRegistro();

  /* asuntos.json falla mientras __romper sea true. */
  window.__romper = false;
  const g = window.App.E.gestor;
  const getFile = g.getFileHandle.bind(g);
  g.getFileHandle = async function (n, o) {
    const h = await getFile(n, o);
    if (n === 'asuntos.json' && !h.__vigilado) {
      h.__vigilado = true;
      const crear = h.createWritable.bind(h);
      h.createWritable = async function () {
        if (window.__romper) { const e = new Error('Dropbox está sincronizando'); e.name = 'InvalidStateError'; throw e; }
        return crear();
      };
    }
    return h;
  };
}, [NOMBRE, NOMBRE_B]);

const enElDisco = (nombre, campo) => pagina.evaluate(async ([nombre, campo]) => {
  const r = await window.Carpetas.leerJson(window.App.E.gestor, 'asuntos.json');
  return r.asuntos[nombre] && r.asuntos[nombre][campo];
}, [nombre, campo]);

console.log('--- 1. la escritura falla siempre ---');
await pagina.evaluate(([n]) => {
  window.__romper = true;
  window.__fin = 'esperando';
  window.App.anotar(n, { limite: '2026-12-01' }).then(() => { window.__fin = 'guardado'; }, (e) => { window.__fin = 'error:' + e.name; });
}, [NOMBRE]);
await pagina.waitForSelector('#aviso-guardado-pendiente:not(.oculto)', { timeout: 12000 });
await comprobar('1. el aviso fijo dice lo acordado',
  pagina.locator('#aviso-guardado-pendiente').innerText(), 'Un cambio no se ha guardado todavía. La aplicación lo sigue intentando.');
await comprobar('1. el aviso fijo no tiene botón de cerrar', pagina.locator('#aviso-guardado-pendiente button').count(), 0);
await comprobar('1. no sale ningún aviso rojo de un solo uso', pagina.locator('.mensaje.malo').count(), 0);
await comprobar('1. quien pidió guardar sigue esperando', pagina.evaluate(() => window.__fin), 'esperando');
await comprobar('1. el cambio se ve en la memoria de la pestaña', pagina.evaluate((n) => window.App.E.registro.asuntos[n].limite, NOMBRE), '2026-12-01');
await comprobar('1. el disco todavía no lo tiene', enElDisco(NOMBRE, 'limite'), undefined);
await comprobar('1. queda apuntado en el navegador', pagina.evaluate(async () => {
  const t = await window.Almacen.leer('guardado-pendiente');
  return !!(t && t._GESTOR && t._GESTOR['asuntos.json']);
}), true);

console.log('--- 3. otro guardado con el fallo activo no deshace el pendiente ---');
await pagina.evaluate(([n]) => {
  window.__fin2 = 'esperando';
  window.App.anotar(n, { viaDato: 'segundo cambio' }).then(() => { window.__fin2 = 'guardado'; }, (e) => { window.__fin2 = 'error:' + e.name; });
}, [NOMBRE]);
await pagina.waitForFunction(() => window.App.E.registro.asuntos['A26-0364 MATRICULA 26-27 Pendiente Uno, Ana 3640001'].viaDato === 'segundo cambio', null, { timeout: 12000 });
await comprobar('3. en pantalla están los dos cambios', pagina.evaluate((n) => {
  const a = window.App.E.registro.asuntos[n]; return [a.limite, a.viaDato];
}, NOMBRE), ['2026-12-01', 'segundo cambio']);

console.log('--- 2. se deja de forzar el fallo ---');
await pagina.evaluate(() => { window.__romper = false; });
await pagina.waitForSelector('#aviso-guardado-pendiente', { state: 'hidden', timeout: 30000 });
await pagina.waitForFunction(() => window.__fin === 'guardado' && window.__fin2 === 'guardado', null, { timeout: 5000 });
await comprobar('2. el aviso fijo se ha quitado solo', pagina.locator('#aviso-guardado-pendiente').isVisible(), false);
await comprobar('2. el primer cambio está en el disco', enElDisco(NOMBRE, 'limite'), '2026-12-01');
await comprobar('2. el segundo cambio está en el disco', enElDisco(NOMBRE, 'viaDato'), 'segundo cambio');
await comprobar('2. el navegador ya no guarda nada pendiente', pagina.evaluate(async () => {
  const t = await window.Almacen.leer('guardado-pendiente'); return t === undefined || t === null || !t._GESTOR;
}), true);
await comprobar('2. medidas: salió tarde, no «sin remedio»', pagina.evaluate(() => {
  const c = window.Medidas.leerDia(window.Medidas.hoy()).cuentas;
  return [!!c['tarde:asuntos.json'], !!c['sin-remedio:asuntos.json']];
}), [true, false]);

console.log('--- 4. «recargar la pestaña»: lo apuntado en el navegador se recupera ---');
/* Se simula con una copia nueva del módulo (estado vacío) y lo apuntado de la sesión anterior en el almacén. */
await pagina.evaluate(() => { window.__romper = true; window.__fin3 = 'esperando'; });
await pagina.evaluate(([n]) => {
  window.App.anotar(n, { viaDato: 'antes de cerrar la pestaña' }).then(() => { window.__fin3 = 'guardado'; }, (e) => { window.__fin3 = 'error:' + e.name; });
}, [NOMBRE]);
await pagina.waitForSelector('#aviso-guardado-pendiente:not(.oculto)', { timeout: 12000 });
await pagina.evaluate(async () => {
  const guardadoEnElNavegador = JSON.parse(JSON.stringify(await window.Almacen.leer('guardado-pendiente')));
  window.GuardadoPendiente.guardado('asuntos.json', false);       /* la pestaña «muere»... */
  await new Promise((r) => setTimeout(r, 100));
  await window.Almacen.guardar('guardado-pendiente', guardadoEnElNavegador);   /* ...pero el navegador se acuerda */
  const texto = await (await fetch('js/guardado-pendiente.js')).text();
  window.GuardadoPendiente = (0, eval)(texto + '\n;GuardadoPendiente');       /* la pestaña nueva */
  await window.App.cargarRegistro();
});
await comprobar('4. al volver a entrar, el aviso fijo está otra vez', pagina.locator('#aviso-guardado-pendiente').isVisible(), true);
await comprobar('4. y el cambio se ve en pantalla', pagina.evaluate((n) => window.App.E.registro.asuntos[n].viaDato, NOMBRE), 'antes de cerrar la pestaña');
await pagina.evaluate(() => { window.__romper = false; });
await pagina.waitForSelector('#aviso-guardado-pendiente', { state: 'hidden', timeout: 30000 });
await comprobar('4. se ha escrito en el disco', enElDisco(NOMBRE, 'viaDato'), 'antes de cerrar la pestaña');

console.log('--- 5. otro ordenador archivó el asunto mientras tanto ---');
await pagina.evaluate(([n]) => {
  window.__romper = true;
  window.__fin5 = 'esperando';
  window.App.anotar(n, { limite: '2027-01-01' }).then(() => { window.__fin5 = 'guardado'; }, (e) => { window.__fin5 = 'error:' + e.name + (e.yaAvisado ? ':yaAvisado' : ''); });
}, [NOMBRE_B]);
await pagina.waitForSelector('#aviso-guardado-pendiente:not(.oculto)', { timeout: 12000 });
await pagina.evaluate(async ([n]) => {
  await window.Borrados.marcar(window.App.E.gestor, 'asuntos', n, 'archivado');   /* lo que haría el otro ordenador */
  window.__romper = false;
}, [NOMBRE_B]);
await pagina.waitForSelector('.guardado-pendiente-cerrable', { timeout: 30000 });
await comprobar('5. aviso rojo cerrable con el número real y el motivo',
  pagina.locator('.guardado-pendiente-cerrable span').innerText(),
  'Un cambio en el asunto A26-0365 no se ha guardado porque otro ordenador lo archivó antes. Ábrelo desde el Archivo y repítelo si hace falta.');
await comprobar('5. tiene botón de cerrar', pagina.locator('.guardado-pendiente-cerrable button').count(), 1);
await comprobar('5. el aviso fijo se ha quitado', pagina.locator('#aviso-guardado-pendiente').isVisible(), false);
await comprobar('5. quien esperaba recibe el rechazo ya avisado (sin verde ni segundo rojo)',
  pagina.evaluate(() => window.__fin5), 'error:AsuntoCerrado:yaAvisado');
await comprobar('5. no sale el verde ni un rojo repetido', pagina.locator('.mensaje.bueno, .mensaje.malo').count(), 0);
await comprobar('5. el cambio tirado no está en el disco', enElDisco(NOMBRE_B, 'limite'), undefined);
await comprobar('5. medidas: cuenta como «sin remedio»', pagina.evaluate(() => {
  return window.Medidas.leerDia(window.Medidas.hoy()).cuentas['sin-remedio:asuntos.json'];
}), 1);
await pagina.click('.guardado-pendiente-cerrable button');
await comprobar('5. el aviso se cierra', pagina.locator('.guardado-pendiente-cerrable').count(), 0);

await comprobar('sin errores de consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobaciones fallan.'); process.exit(1); }
console.log('\nTodo bien.');
