/* Prueba en navegador de verdad de la fila 205 de docs/COLA.md
   (docs/RESPONSABLE-UNA-ADMINISTRACION.md): una Administración dada de
   alta (la Delegación Territorial) como responsable de un hito.

   1. En la mesa del hito, «Una Administración…» abre un buscador con lo
      dado de alta; al elegirla se guarda `adm:<id>` y una copia del nombre.
   2. Nunca es de Administración: el asunto pasa a terceros y «Esperando
      a Delegación Territorial».
   3. Con departamento: `adm:<id>:<id dep>`, «Delegación Territorial · Inspección».
   4. El filtro de Inicio ofrece la Administración que es responsable de
      algún hito abierto.
   5. En el editor de una guía, el desplegable «Responsable por defecto»
      también la ofrece (buscador en línea, sin cerrar el editor).
   6. Si el organismo se borra, el hito sigue enseñando su nombre guardado. */
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

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const GUIAS = { MATRICULA: [
  { id: 'm1', titulo: 'Pedir informe a la Delegación', cuerpo: '', opciones: [] },
  { id: 'm2', titulo: 'Archivar el expediente', cuerpo: '', opciones: [] }
] };

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([guias, asunto]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
  await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
}, [GUIAS, ASUNTO]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
/* La Delegación, dada de alta con la API de verdad, con un departamento. */
const ids = await pagina.evaluate(async (asunto) => {
  const o = await Administraciones.alta(App.E.datos, { clase: 'organismo', corto: 'Delegación Territorial', oficial: 'Delegación Territorial de Educación en Málaga', superior: '' });
  await Administraciones.anadirDepartamento(App.E.datos, o.id, null, { nombre: 'Inspección' });
  const o2 = Administraciones.enMemoria().organismos.filter((x) => x.id === o.id)[0];
  await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
    tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {} });
  await App.verAbiertos();
  return { org: o.id, dep: o2.departamentos[0].id };
}, ASUNTO);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ASUNTO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(400);

const hito = (id) => pagina.evaluate(async ([asunto, id]) => {
  const d = await Hitos.leer();
  return Hitos.buscar(d.porAsunto[asunto].hitos, id);
}, [ASUNTO, id]);
async function abrirMesa(id) {
  await pagina.locator('#ficha-guia .hito[data-id="' + id + '"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + id + '"]');
  await pagina.waitForTimeout(300);
}
async function elegirUnaAdministracion(conDepartamento) {
  await pagina.locator('.hito-en-mesa .mesa-etq-resp').click();
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Una Administración…' }).first().click();
  await pagina.waitForSelector('#ro-caja .ro-organismo');
  await pagina.locator('#ro-caja .ro-organismo', { hasText: 'Delegación Territorial' }).click();
  if (conDepartamento) await pagina.selectOption('#ro-caja .ro-dep', ids.dep);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForTimeout(600);
}

console.log('--- 1. la mesa del hito ---');
await abrirMesa('m1');
await pagina.locator('.hito-en-mesa .mesa-etq-resp').click();
await comprobar('la lista de responsables acaba con «Una Administración…»',
  pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion').last().textContent(), 'Una Administración…');
await pagina.keyboard.press('Escape');
await pagina.locator('.hito-en-mesa .mesa-etq-resp').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Una Administración…' }).first().click();
await pagina.waitForSelector('#ro-caja .ro-organismo');
await comprobar('el buscador enseña lo dado de alta', pagina.locator('#ro-caja .ro-organismo').count(), 1);
await pagina.fill('#ro-caja .ro-buscar', 'zzzz');
await comprobar('un texto que no coincide no deja nada', pagina.locator('#ro-caja .ro-organismo').count(), 0);
await pagina.fill('#ro-caja .ro-buscar', 'delegac');
await comprobar('buscando «delegac» sale la Delegación', pagina.locator('#ro-caja .ro-organismo').count(), 1);
await pagina.locator('#ro-caja .ro-organismo').click();
await comprobar('al pulsarla, se ofrece su departamento (opcional)', pagina.locator('#ro-caja .ro-dep option').count(), 2);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('se guarda el id del organismo', hito('m1').then((h) => h.responsable), 'adm:' + ids.org);
await comprobar('y una copia de su nombre', hito('m1').then((h) => h.responsableNombre), 'Delegación Territorial');
await comprobar('un hito normal no lleva copia de nombre',
  pagina.evaluate(async ([asunto]) => Object.prototype.hasOwnProperty.call(Hitos.buscar((await Hitos.leer()).porAsunto[asunto].hitos, 'm2'), 'responsableNombre'), [ASUNTO]), false);
await comprobar('la etiqueta de la mesa dice su nombre corto',
  pagina.locator('.hito-en-mesa .mesa-etq-resp').textContent(), 'Delegación Territorial');

console.log('--- 2. nunca es de Administración ---');
const estado = await pagina.evaluate(async ([asunto]) => {
  const d = await Hitos.leer();
  const q = Hitos.aQuienLeToca(d.porAsunto[asunto].hitos, d.ajustes, {});
  return { esAdm: Hitos.esDeAdministracion('adm:x', d.ajustes), lado: q.lado, quien: q.quien,
           espera: q.esperando && q.esperando.nombre };
}, [ASUNTO]);
await comprobar('«adm:…» no es de Administración', estado.esAdm, false);
await comprobar('el asunto pasa a «Pendiente de terceros»', estado.lado, 'terceros');
await comprobar('esperando a la Delegación', [estado.quien, estado.espera], ['Delegación Territorial', 'Delegación Territorial']);
await comprobar('la cabecera lo dice («Esperando a Delegación Territorial»)',
  pagina.evaluate(() => /Esperando a Delegación Territorial/.test(document.body.innerText)), true);

console.log('--- 3. con departamento ---');
await elegirUnaAdministracion(true);
await comprobar('el id lleva también el departamento', hito('m1').then((h) => h.responsable), 'adm:' + ids.org + ':' + ids.dep);
await comprobar('«Delegación Territorial · Inspección»', hito('m1').then((h) => h.responsableNombre), 'Delegación Territorial · Inspección');
await comprobar('la etiqueta también', pagina.locator('.hito-en-mesa .mesa-etq-resp').textContent(), 'Delegación Territorial · Inspección');

console.log('--- 4. el filtro de Inicio ---');
await pagina.evaluate(async () => { await App.verAbiertos(); await InicioTabla.pintar(); });
await pagina.waitForTimeout(600);
await comprobar('el filtro «Responsable» ofrece la Administración',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#inicio-me-toca-responsable option')).map((o) => o.textContent)
    .filter((t) => /Delegación/.test(t))), ['Delegación Territorial · Inspección']);

console.log('--- 5. el editor de una guía ---');
const abierto = await pagina.evaluate(() => {
  window.__edicion = Guias.editar('MATRICULA', [
    { id: 'g1', titulo: 'Pedir informe', cuerpo: '', opciones: [], responsable: '' }
  ], [{ id: 'direccion', nombre: 'Dirección' }], [], {});
  return true;
});
await pagina.waitForSelector('.paso-responsable', { state: 'attached' });
await pagina.click('#guia-pasos > .paso-editor[data-pos="0"] > .paso-cabecera > .paso-resumen');   /* la guía es un acordeón */
await pagina.locator('details.paso-extra > summary').first().click();
await comprobar('«Una Administración…» es la última opción del desplegable',
  pagina.evaluate(() => Array.from(document.querySelector('.paso-responsable').options).map((o) => o.textContent).pop()), 'Una Administración…');
await pagina.selectOption('.paso-responsable', '__adm__');
await pagina.waitForSelector('.ro-en-linea .ro-organismo');
await comprobar('el buscador sale en línea, sin cerrar el editor', pagina.locator('.paso-responsable').isVisible(), true);
await pagina.locator('.ro-en-linea .ro-organismo').click();
await pagina.click('.ro-en-linea .ro-elegir');
await comprobar('el desplegable queda en la Administración elegida',
  pagina.evaluate(() => { const s = document.querySelector('.paso-responsable'); return [s.value, s.options[s.selectedIndex].textContent]; }),
  ['adm:' + ids.org, 'Delegación Territorial']);
await comprobar('y el buscador en línea se cierra', pagina.locator('.ro-en-linea').count(), 0);
await pagina.click('#cuadro-aceptar');
const pasos = await pagina.evaluate(() => window.__edicion);
await comprobar('la guía guarda el organismo (solo el id: el hito nace con su copia)',
  [pasos && pasos[0].responsable, pasos && pasos[0].responsableNombre], ['adm:' + ids.org, undefined]);

console.log('--- 6. el organismo ya no está ---');
await pagina.evaluate(async (org) => { await Administraciones.quitar(App.E.datos, org); }, ids.org);
await comprobar('el hito sigue enseñando el nombre guardado',
  pagina.evaluate(async ([asunto]) => {
    const d = await Hitos.leer();
    const h = Hitos.buscar(d.porAsunto[asunto].hitos, 'm1');
    return Hitos.resolverResponsable(h.responsable, d.ajustes, {}).texto;
  }, [ASUNTO]), 'Delegación Territorial · Inspección');

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
