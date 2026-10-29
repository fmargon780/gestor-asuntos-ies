/* Prueba en navegador de verdad de "Nuevo asunto más cómodo"
   (fila 489, docs/NUEVO-ASUNTO-MAS-COMODO.md). Un bloque por cada punto de
   «Cómo se comprueba»:
   1-3. el cursor salta solo al siguiente hueco al elegir tipo o persona;
   4-7. el cuadro de alta y de cambio de datos de Alumnado y Personal trae
        «Apellidos» y «Nombre», reparte lo pegado con coma, avisa si lo
        guardado no tiene coma y no deja guardar con una casilla vacía. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'AVISO', categoria: 'PERSONAL' },
  { tipo: 'TRAMITE', categoria: 'PERSONAL' }
];
const CAMPOS = {
  propios: [{ id: 'p1', nombre: 'Observaciones', clase: 'texto', valores: [] }],
  porTipo: { TRAMITE: [{ origen: 'propio', id: 'p1' }] }
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
const foco = () => pagina.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName) : null; });
const leerCsv = (n) => pagina.evaluate(async (nombre) => {
  const d = await (await window.__disco.abiertos.getDirectoryHandle('_GESTOR')).getDirectoryHandle('datos');
  try { return await (await (await d.getFileHandle(nombre)).getFile()).text(); } catch (e) { return ''; }
}, n);
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'), m => m.textContent));

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

/* ---------- 1. tipo primero: el cursor va al buscador de persona ---------- */
console.log('--- 1. elegir tipo sin persona: el cursor va al buscador de persona ---');
await nuevoVacio();
await pagina.getByRole('button', { name: 'AVISO', exact: true }).click();
await comprobar('el cursor está en el buscador de persona', foco(), 'buscar-tercero');
await comprobar('y se ilumina un instante', pagina.locator('#buscar-tercero').evaluate(e => e.classList.contains('salto-cursor')), true);
await pagina.keyboard.type('Lop');
await comprobar('escribir sin pulsar antes: las letras salen en el buscador', pagina.inputValue('#buscar-tercero'), 'Lop');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.waitForTimeout(1200);
await comprobar('el resplandor se apaga solo', pagina.locator('#buscar-tercero').evaluate(e => e.classList.contains('salto-cursor')), false);

await nuevoVacio();
await pagina.fill('#buscar-tipo', 'trami');
await pagina.getByRole('button', { name: 'TRAMITE', exact: true }).click();
await comprobar('eligiéndolo desde «Buscar tipo» pasa igual', foco(), 'buscar-tercero');

/* ---------- 2. persona primero: el cursor va a «Buscar tipo» ---------- */
console.log('--- 2. elegir persona sin tipo: el cursor va a «Buscar tipo» ---');
await nuevoVacio();
await pagina.fill('#buscar-tercero', 'lopez');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('el cursor está en «Buscar tipo»', foco(), 'buscar-tipo');

/* ---------- 3. con persona y tipo: primera casilla vacía, o «Crear el asunto» ---------- */
console.log('--- 3. con persona y tipo: casilla vacía de Datos del asunto, o «Crear el asunto» ---');
await pagina.getByRole('button', { name: 'TRAMITE', exact: true }).click();
await pagina.waitForTimeout(200);
await comprobar('tipo con campos propios: el cursor va a su primera casilla vacía',
  pagina.evaluate(() => !!document.activeElement && !!document.activeElement.closest('#campos-lista-nuevo')), true);
await pagina.getByRole('button', { name: 'AVISO', exact: true }).click();
await pagina.waitForSelector('#btn-crear:not([disabled])');
await pagina.waitForTimeout(200);
await comprobar('tipo sin campos: el cursor va a «Crear el asunto»', foco(), 'btn-crear');
await pagina.keyboard.press('Enter');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('y Intro crea el asunto', pagina.evaluate(() => Object.keys(App.E.registro.asuntos || {}).some(n => n.indexOf('AVISO') !== -1)), true);

await nuevoVacio();
await pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'PERSONAL');
  App.nuevoAsuntoCon({ tercero: f.lista[0], tipo: 'AVISO' });
});
await pagina.waitForTimeout(300);
await comprobar('entrar con «App.nuevoAsuntoCon» no mueve el cursor a ningún sitio de Nuevo asunto',
  pagina.evaluate(() => !document.activeElement || !document.activeElement.closest('#pantalla-nuevo') || document.activeElement.tagName === 'BODY'), true);

/* ---------- 4. el alta trae Apellidos y Nombre ---------- */
console.log('--- 4. alta de solicitante y de Personal: Apellidos y Nombre ---');
await nuevoVacio();
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.fill('#buscar-tercero', 'Martinez');
await pagina.waitForTimeout(400);
await pagina.getByRole('button', { name: '+ Dar de alta un solicitante' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro tiene las dos casillas', Promise.all([pagina.locator('#alta-apellidos').count(), pagina.locator('#alta-nombre-pila').count()]), [1, 1]);
await comprobar('y no la casilla única «Nombre»', pagina.locator('.alta-campo[data-campo="Nombre"]').count(), 0);
await pagina.fill('#alta-apellidos', 'Martínez Martínez');
await comprobar('la línea gris no sale con una sola casilla', pagina.locator('#alta-se-guardara').isVisible(), false);
await pagina.fill('#alta-nombre-pila', 'Daniel');
await comprobar('la línea gris dice cómo se guardará', pagina.locator('#alta-se-guardara').textContent(), 'Se guardará como: Martínez Martínez, Daniel');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('queda guardado como «Apellidos, Nombre» en solicitantes.csv', leerCsv('solicitantes.csv').then(t => t.indexOf('Martínez Martínez, Daniel') !== -1), true);
await comprobar('y elegido en Nuevo asunto', pagina.locator('#tercero-elegido').textContent().then(t => t.indexOf('Martínez Martínez, Daniel') !== -1), true);

await pagina.evaluate(() => { window.__r = null; App.cuadroDeTercero('PERSONAL', {}, 'Dar de alta en PERSONAL').then(v => { window.__r = v || 'null'; }); });
await pagina.waitForSelector('#alta-apellidos');
await comprobar('en Personal también', pagina.locator('.alta-campo[data-campo="Nombre"]').count(), 0);
await pagina.click('#cuadro-cancelar');
await pagina.evaluate(() => { App.cuadroDeTercero('OTROS', {}, 'Dar de alta en OTROS'); });
await pagina.waitForSelector('.alta-campo[data-campo="Nombre"]');
await comprobar('en Otros el cuadro es el de siempre', pagina.locator('#alta-apellidos').count(), 0);
await pagina.click('#cuadro-cancelar');

/* ---------- 5. pegar el nombre entero con coma ---------- */
console.log('--- 5. pegar «García López, Ana» en Apellidos ---');
await pagina.evaluate(() => { App.cuadroDeTercero('PERSONAL', {}, 'Dar de alta en PERSONAL'); });
await pagina.waitForSelector('#alta-apellidos');
await pagina.fill('#alta-apellidos', 'García López, Ana');
await pagina.press('#alta-apellidos', 'Tab');
await comprobar('se reparte sola', Promise.all([pagina.inputValue('#alta-apellidos'), pagina.inputValue('#alta-nombre-pila')]), ['García López', 'Ana']);

/* ---------- 7. con una casilla vacía no se guarda ---------- */
console.log('--- 7. «Guardar» con una casilla vacía no cierra el cuadro ---');
await pagina.fill('#alta-nombre-pila', '');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('el cuadro sigue abierto', pagina.locator('#capa').isVisible(), true);
await comprobar('y avisa «Falta el nombre»', avisos().then(a => a.some(t => t.indexOf('Falta el nombre') !== -1)), true);
await pagina.fill('#alta-apellidos', '');
await pagina.fill('#alta-nombre-pila', 'Ana');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('sin apellidos también se queda y avisa «Faltan los apellidos»',
  Promise.all([pagina.locator('#capa').isVisible(), avisos().then(a => a.some(t => t.indexOf('Faltan los apellidos') !== -1))]), [true, true]);
await pagina.click('#cuadro-cancelar');

/* ---------- 6. cambiar los datos de alguien ya guardado ---------- */
console.log('--- 6. cambiar los datos: las dos casillas salen rellenas ---');
await pagina.evaluate(() => { window.__r = null; App.cuadroDeTercero('PERSONAL', { Nombre: 'Pérez Ruiz,Lucía' }, 'Cambiar los datos', 'Guardar los cambios', { avisarSinComa: true }).then(v => { window.__r = v; }); });
await pagina.waitForSelector('#alta-apellidos');
await comprobar('con coma: «Pérez Ruiz» y «Lucía»', Promise.all([pagina.inputValue('#alta-apellidos'), pagina.inputValue('#alta-nombre-pila')]), ['Pérez Ruiz', 'Lucía']);
await comprobar('sin aviso ámbar', pagina.locator('#alta-aviso-coma').count(), 0);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__r);
await comprobar('sin tocar nada se devuelve lo guardado tal cual', pagina.evaluate(() => window.__r.Nombre), 'Pérez Ruiz,Lucía');

await pagina.evaluate(() => { window.__r = null; App.cuadroDeTercero('PERSONAL', { Nombre: 'Lucía Pérez Ruiz' }, 'Cambiar los datos', 'Guardar los cambios', { avisarSinComa: true }).then(v => { window.__r = v; }); });
await pagina.waitForSelector('#alta-apellidos');
await comprobar('sin coma: todo en Apellidos y Nombre vacío', Promise.all([pagina.inputValue('#alta-apellidos'), pagina.inputValue('#alta-nombre-pila')]), ['Lucía Pérez Ruiz', '']);
await comprobar('con el aviso ámbar', pagina.locator('#alta-aviso-coma').textContent(), 'Este nombre no tiene coma. Revisa qué parte son los apellidos y cuál el nombre.');
await pagina.fill('#alta-apellidos', 'Pérez Ruiz');
await pagina.fill('#alta-nombre-pila', '  María   José ');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__r);
await comprobar('al unir se recortan los espacios y se pone la coma', pagina.evaluate(() => window.__r.Nombre), 'Pérez Ruiz, María José');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
