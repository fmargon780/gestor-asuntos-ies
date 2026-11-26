/* Prueba en navegador de verdad de «Nuevo asunto, más simple» (fila 629,
   docs/629-NUEVO-ASUNTO-MAS-SIMPLE.md). Un bloque por cada punto de
   «Cómo lo comprueba el segundo revisor»:
   1. la pantalla vacía: tres recuadros en fila y nada más;
   2. las clases de tercero, botones pequeños que se fijan y se sueltan;
   3. un tipo que no pide nada: no salen los cinco datos y se crea;
   4. un tipo que los pide: salen en «Datos del asunto» y se guardan en la ficha;
   5. otro tipo con otros datos, y el recuadro se va al cambiar a uno que no pide;
   6. lo que sigue como hoy. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'AVISO', categoria: 'PERSONAL', organo: 'SECRETARIA' },
  { tipo: 'TRAMITE', categoria: 'PERSONAL', organo: 'JEFATURA' },
  { tipo: 'FACTURA', categoria: 'PERSONAL' }
];
const CAMPOS = {
  propios: [{ id: 'p1', nombre: 'Observaciones', clase: 'texto', valores: [] }],
  porTipo: { TRAMITE: [{ origen: 'propio', id: 'p1' }] },
  datosAlCrear: { TRAMITE: ['limite', 'lopide', 'via'], FACTURA: ['curso', 'descripcion'] }
};

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
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
const visible = (sel) => pagina.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, sel);

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([tipos, campos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('campos.json', window.__disco.fich('campos.json', JSON.stringify(campos)));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const csv = ['Nombre;Documento;Puesto;Teléfono;Correo',
    'López García, Marta;12345678A;Conserje;600111222;marta@ejemplo.es'].join('\r\n') + '\r\n';
  d._hijos.set('personal.csv', window.__disco.fich('personal.csv', csv));
}, [TIPOS, CAMPOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

async function nuevoVacio() {
  await pagina.click('.pestana[data-pantalla="abiertos"]');
  await pagina.click('.pestana[data-pantalla="nuevo"]');
  await pagina.waitForSelector('#tipos-lista .tipo-boton');
}
async function elegirPersonaYTipo(tipo) {
  await pagina.fill('#buscar-tercero', 'lopez');
  await pagina.waitForSelector('#resultados-tercero .resultado');
  await pagina.click('#resultados-tercero .resultado');
  await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
  await pagina.getByRole('button', { name: tipo, exact: true }).click();
  await pagina.waitForTimeout(250);
}

console.log('--- 1. la pantalla vacía ---');
await nuevoVacio();
await comprobar('no hay título «Nuevo asunto» encima del formulario',
  pagina.evaluate(() => Array.prototype.filter.call(document.querySelectorAll('#pantalla-nuevo h2'), h => h.offsetParent !== null).length), 0);
await comprobar('pero sigue el «← Volver» de la cabecera', visible('#pantalla-nuevo .cabecera .boton-volver'), true);
await comprobar('tres recuadros: fecha de inicio, tipo y tercero, en este orden',
  pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('.nuevo-tres-recuadros > .recuadro-nuevo .recuadro-titulo'), t => t.textContent.trim())),
  ['Fecha de inicio', 'Qué tipo de asunto', 'Tercero']);
await comprobar('van en una sola fila (misma altura de arriba)',
  pagina.evaluate(() => { const t = Array.prototype.map.call(document.querySelectorAll('.nuevo-tres-recuadros > .recuadro-nuevo'), e => Math.round(e.getBoundingClientRect().top)); return t.every(x => x === t[0]); }), true);
await comprobar('la fecha de inicio es estrecha',
  pagina.evaluate(() => document.getElementById('bloque-fecha').getBoundingClientRect().width < 260), true);
await comprobar('sin rótulos de departamento', pagina.locator('#tipos-lista .tipos-grupo-organo').count(), 0);
await comprobar('sin desplegable de unidad', pagina.locator('#unidad-tercero').count(), 0);
for (const id of ['campo-curso', 'campo-descripcion', 'campo-limite', 'grupo-lopide', 'bloque-campos', 'vista-nombre']) {
  await comprobar('no se ve «' + id + '»', visible('#' + id), false);
}
await comprobar('no sale «Se creará esta carpeta» ni la nota del nombre de la carpeta',
  pagina.evaluate(() => /Se creará esta carpeta|no salen en el nombre de la carpeta/.test(document.getElementById('pantalla-nuevo').innerText)), false);

console.log('--- 2. las clases de tercero ---');
await comprobar('botones pequeños en fila (no tarjetas)',
  pagina.evaluate(() => { const b = document.querySelector('.categoria-boton'); return !!b && b.getBoundingClientRect().height < 40 && !b.querySelector('small'); }), true);
await pagina.click('.categoria-boton[data-categoria="PERSONAL"]');
await comprobar('pulsar fija', pagina.evaluate(() => document.querySelector('.categoria-boton[data-categoria="PERSONAL"]').classList.contains('elegido')), true);
await pagina.click('.categoria-boton[data-categoria="PERSONAL"]');
await comprobar('volver a pulsar suelta', pagina.evaluate(() => document.querySelector('.categoria-boton[data-categoria="PERSONAL"]').classList.contains('elegido')), false);
await pagina.getByRole('button', { name: 'AVISO', exact: true }).click();
await comprobar('con un tipo elegido, sale «TIPO admite: …»', pagina.locator('#categorias-admite').textContent().then(t => /^AVISO admite: /.test(t)), true);

console.log('--- 3. un tipo que no pide ningún dato ---');
await nuevoVacio();
await elegirPersonaYTipo('AVISO');
for (const id of ['campo-curso', 'campo-descripcion', 'campo-limite', 'grupo-lopide', 'bloque-campos']) {
  await comprobar('AVISO: no se ve «' + id + '»', visible('#' + id), false);
}
await comprobar('AVISO: el curso en marcha se guarda igualmente', pagina.inputValue('#campo-curso').then(v => /^\d\d-\d\d$/.test(v)), true);
await pagina.waitForFunction(() => !document.getElementById('btn-crear').disabled);
await comprobar('se puede crear', pagina.locator('#btn-crear').isEnabled(), true);

console.log('--- 4. un tipo que pide fecha límite, quién lo pide y por qué vía ---');
await nuevoVacio();
await elegirPersonaYTipo('TRAMITE');
await comprobar('«Datos del asunto» sale', visible('#bloque-campos'), true);
await comprobar('a todo el ancho: más ancho que el recuadro del tercero',
  pagina.evaluate(() => document.getElementById('bloque-campos').getBoundingClientRect().width > document.getElementById('bloque-tercero').getBoundingClientRect().width * 1.5), true);
await comprobar('sale la fecha límite', visible('#campo-limite'), true);
await comprobar('salen «Quién lo pide» y «Por qué vía», sin «Fecha»',
  pagina.evaluate(() => ['.lopide-quien', '.lopide-via', '.lopide-fecha'].map(s => !!document.querySelector('#lopide-caja-nuevo ' + s).offsetParent)), [true, true, false]);
await comprobar('no salen el año académico ni la descripción corta', Promise.all([visible('#campo-curso'), visible('#campo-descripcion')]), [false, false]);
await comprobar('sale el campo propio del tipo junto a ellos', visible('#campos-lista-nuevo .campo-fila'), true);
await pagina.fill('#campo-limite', '2026-12-20');
await pagina.selectOption('#lopide-caja-nuevo .lopide-via', 'TELEFONO');
await pagina.waitForFunction(() => !document.getElementById('btn-crear').disabled);
await pagina.click('#btn-crear');
await pagina.waitForTimeout(800);
await comprobar('el asunto creado guarda la fecha límite y la vía en su ficha',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const j = JSON.parse(await (await (await g.getFileHandle('asuntos.json')).getFile()).text());
    const f = Object.keys(j.asuntos).filter(n => /TRAMITE/.test(n)).map(n => j.asuntos[n])[0];
    return !!f && f.limite === '2026-12-20' && f.via === 'TELEFONO';
  }), true);

console.log('--- 5. un tipo que pide el año académico y la descripción ---');
await nuevoVacio();
await elegirPersonaYTipo('FACTURA');
await comprobar('salen año académico y descripción corta, no la fecha límite',
  Promise.all([visible('#campo-curso'), visible('#campo-descripcion'), visible('#campo-limite')]), [true, true, false]);
await comprobar('«Quién lo pide» no sale', visible('#grupo-lopide'), false);
await pagina.getByRole('button', { name: 'AVISO', exact: true }).click();
await pagina.waitForTimeout(250);
await comprobar('al cambiar a un tipo que no pide nada, el recuadro se va', visible('#bloque-campos'), false);

console.log('--- 6. lo que sigue como hoy ---');
await comprobar('sigue «Es para un grupo de personas»', visible('#btn-grupo-nuevo'), true);
await comprobar('sigue «+ Crear tipo nuevo»', pagina.locator('#btn-crear-tipo-al-vuelo').count().then(n => n > 0), true);
await comprobar('el botón de crear sigue a la vista', visible('#btn-crear'), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallo(s).' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
