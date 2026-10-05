/* Prueba en navegador de verdad de la fila 263 de docs/COLA.md
   (docs/RUTA-LARGA-AVISA-Y-NO-BLOQUEA.md): el largo de la ruta avisa en
   ámbar, pero nunca impide crear ni cambiar un asunto. La cuenta usa
   dónde está Dropbox de verdad y el tope de 259. Nombres inventados. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const NUEVO = 'La ruta de esta carpeta sale muy larga. El asunto se crea igual; puede que Word o Windows protesten al abrir algún documento suyo.';
const CAMBIO = 'La ruta de esta carpeta sale muy larga. El cambio se guarda igual; puede que Word o Windows protesten al abrir algún documento suyo.';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.addInitScript(() => { try { localStorage.setItem('gestor-ruta-dropbox', 'C:\\Users\\Usuario\\Dropbox'); } catch (e) { /* sin almacén */ } });
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013;600111222;tutor.marina@correo.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.evaluate(async () => {
  await Carpetas.guardarJson(App.E.gestor, 'rutas.json', { abiertos: 'ABIERTOS', archivo: 'ADMINISTRACIÓN/REGISTROS/ARCHIVO' });
  await RutaCarpetas.cargarComun();
});

console.log('--- la cuenta ---');
await comprobar('el tope es 259 y la raíz es la de verdad (25 con la barra)', pagina.evaluate(async () => {
  const m = await Nombres.medidor();
  return [m.tope, m.partes.filter(p => p.clave === 'dropbox')[0].largo];
}), [259, 25]);
await comprobar('un tercero de 31 con el tipo corto cabe', pagina.evaluate(() => {
  const r = Nombres.montarAsunto({ fecha: '2026-09-07', tipo: 'INFORMACION PERSONAL', tercero: 'X'.repeat(31), numero: 'A26-0001', categoria: 'ALUMNADO' });
  return [r.noCabe];
}), [false]);
await comprobar('con un tercero de 150 la cuenta dice que no cabe', pagina.evaluate(() => {
  const r = Nombres.montarAsunto({ fecha: '2026-09-07', tipo: 'MATRICULA', tercero: 'X'.repeat(150), numero: 'A26-0001', categoria: 'ALUMNADO' });
  return [r.noCabe];
}), [true]);

console.log('--- Nuevo asunto ---');
async function abrirNuevo() {
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.click('#categorias-lista .categoria-boton:nth-child(1)');
  const boton = pagina.getByRole('button', { name: 'MATRICULA', exact: true });
  if (!(await boton.isVisible())) {
    const ver = pagina.locator('#btn-ver-tipos');
    if (await ver.isVisible() && /^Ver todos/.test((await ver.textContent()).trim())) await ver.click();
  }
  await boton.click();
  await pagina.fill('#buscar-tercero', 'marina');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.waitForFunction(() => /^\d{6} A\d{2}-\d{4} /.test(document.getElementById('vista-nombre').textContent));
}
const estado = () => pagina.evaluate(() => {
  const av = document.querySelector('#vista-nombre + .vista-recorte');
  return [av ? av.textContent : null, av ? av.className.indexOf('aviso-ambar') >= 0 : null, document.getElementById('btn-crear').disabled];
});
await abrirNuevo();
await comprobar('con un nombre corriente: sin aviso y «Crear el asunto» encendido', estado(), [null, null, false]);
await pagina.evaluate(() => {
  App.E.nuevo.tercero = Object.assign({}, App.E.nuevo.tercero, { nombre: 'Razón social inventada '.repeat(7), id: '' });
  App.refrescarVista();
});
await comprobar('con un tercero larguísimo: aviso ámbar con el texto exacto y el botón sigue encendido', estado(), [NUEVO, true, false]);
await pagina.click('#btn-crear');
await pagina.waitForTimeout(500);
for (let i = 0; i < 2; i++) {
  const seguir = pagina.locator('#capa:not(.oculto) button').filter({ hasText: /Seguir|Crear|Sí/ }).first();
  if (await seguir.count()) { await seguir.click(); await pagina.waitForTimeout(400); }
}
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 15000 });
await comprobar('«Crear el asunto» lo crea y no sale ningún aviso rojo', pagina.evaluate(async () => {
  const n = []; for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
  return [n.filter(x => /MATRICULA Razón social/.test(x)).length, Array.from(document.querySelectorAll('.aviso-rojo')).filter(e => /no cabe en la ruta/.test(e.textContent)).length];
}), [1, 0]);

console.log('--- Cambiar el asunto ---');
await comprobar('el aviso de «Cambiar» es ámbar, con su texto, y nunca el rojo de antes', pagina.evaluate(() => {
  const el = document.createElement('div'); el.id = 'prueba-vista'; document.body.appendChild(el);
  Nombres.avisoRecorte(el, false, true, 'cambio');
  const av = el.nextElementSibling;
  const r = [av.textContent, av.className.indexOf('aviso-ambar') >= 0, av.className.indexOf('aviso-rojo') >= 0];
  Nombres.avisoRecorte(el, false, false, 'cambio');
  return r.concat([el.nextElementSibling === null]);
}), [CAMBIO, true, false, true]);
await comprobar('guardar con un tercero larguísimo no se para por la ruta', pagina.evaluate(() => {
  const a = App.E.listaAbiertos.filter(x => /MATRICULA Razón social/.test(x.nombre))[0];
  const r = Nombres.montarAsunto(Object.assign({}, App.piezasDelAsunto(a), { campos: [] }));
  return [r.noCabe, !!r.nombre];
}), [true, true]);
await comprobar('el texto de antes ya no existe en el código de la pantalla', pagina.evaluate(async () => {
  const f = await Promise.all(['js/asuntos-editar.js', 'js/asuntos-nuevo-crear.js'].map(u => fetch(u).then(r => r.text())));
  return f.map(t => t.indexOf('AVISO_NO_CABE') >= 0);
}), [false, false]);

console.log('--- sin saber dónde está Dropbox ---');
await comprobar('sin nada apuntado, vale la suposición de 45 y el caso corriente sigue sin aviso', pagina.evaluate(async () => {
  localStorage.removeItem('gestor-ruta-dropbox');
  const m = await Nombres.medidor();
  const r = Nombres.montarAsunto({ fecha: '2026-09-07', tipo: 'INFORMACION PERSONAL', tercero: 'X'.repeat(31), numero: 'A26-0001', categoria: 'ALUMNADO' });
  return [m.partes.filter(p => p.clave === 'dropbox')[0].largo, r.noCabe];
}), [45, false]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
