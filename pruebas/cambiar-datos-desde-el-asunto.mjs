/* Prueba en navegador de verdad de la fila 266
   (docs/CAMBIAR-DATOS-DEL-TERCERO-DESDE-EL-ASUNTO.md): «Cambiar los
   datos» del tercero desde la ficha de un asunto abierto, y que las
   carpetas le sigan cuando cambia su texto (NIF, nombre…).

   Una empresa inventada, «TALLERES INVENTADOS SL», NIF B00000001, con dos
   asuntos abiertos y uno archivado. Reutiliza el disco de mentira de
   pruebas/navegador.mjs. */
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
await pagina.waitForTimeout(400);

const nombresAbiertos = () => pagina.evaluate(async () => {
  const salida = [];
  for await (const p of window.__disco.abiertos.entries()) if (p[0][0] !== '_') salida.push(p[0]);
  return salida.sort();
});
const hijos = (...ruta) => pagina.evaluate(async (r) => {
  try {
    let d = window.__disco.archivo;
    for (const n of r) d = await d.getDirectoryHandle(n);
    const salida = [];
    for await (const p of d.entries()) salida.push(p[0]);
    return salida.sort();
  } catch (e) { return null; }
}, ruta);
const csv = () => pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const d = await g.getDirectoryHandle('datos');
  const f = await (await d.getFileHandle('empresas.csv')).getFile();
  return await f.text();
});
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'),
  m => (m.classList.contains('malo') ? 'ROJO: ' : m.classList.contains('ambar') ? 'AMBAR: ' : '') + m.textContent));
const limpiarAvisos = () => pagina.evaluate(() => { document.getElementById('mensajes').innerHTML = ''; });

async function crearAsunto(busqueda, fecha, tipo) {
  await pagina.evaluate(() => App.ir('nuevo'));
  await pagina.waitForTimeout(200);
  await pagina.click('.categoria-boton[data-categoria="EMPRESAS"]');
  await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
  await pagina.click('#tipos-lista .tipo-boton >> nth=' + tipo);
  await pagina.waitForSelector('#bloque-tercero:not(.oculto)');
  await pagina.fill('#buscar-tercero', busqueda);
  await pagina.waitForTimeout(300);
  await pagina.click('#resultados-tercero .resultado');
  await pagina.fill('#campo-fecha', fecha);
  await pagina.click('#btn-crear');
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('#ficha-volver');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
}

console.log('--- preparación: la empresa y sus asuntos ---');
await pagina.evaluate(async () => {
  await Datos.anadirALista(App.E.datos, 'EMPRESAS', {
    'Razón social': 'TALLERES INVENTADOS SL', 'Nombre comercial': '', 'NIF': 'B00000001',
    'Contacto': '', 'Teléfono': '952000001', 'Correo': ''
  });
  await Datos.anadirALista(App.E.datos, 'EMPRESAS', {
    'Razón social': 'OTRA EMPRESA INVENTADA SL', 'Nombre comercial': '', 'NIF': 'B00000009',
    'Contacto': '', 'Teléfono': '', 'Correo': ''
  });
});
await crearAsunto('talleres inventados', '2026-09-05', 0);
/* El primero se archiva: no tiene que cambiar de nombre. */
await pagina.locator('#inicio-tabla-cuerpo .fila-menu-btn').first().click();
await pagina.getByRole('button', { name: 'Archivar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#inicio-tabla-cuerpo .vacio');
await crearAsunto('talleres inventados', '2026-09-10', 1);
await crearAsunto('talleres inventados', '2026-09-12', 2);
await crearAsunto('otra empresa', '2026-09-14', 3);
const abiertosAntes = await nombresAbiertos();
const deTalleres = abiertosAntes.filter(n => n.endsWith('TALLERES INVENTADOS SL B00000001'));
const deOtra = abiertosAntes.filter(n => n.endsWith('OTRA EMPRESA INVENTADA SL B00000009'));
const archivadoAntes = await hijos('EMPRESAS', 'TALLERES INVENTADOS SL B00000001');
await comprobar('dos asuntos abiertos de la empresa, uno de la otra y uno archivado',
  [deTalleres.length, deOtra.length, (archivadoAntes || []).length], [2, 1, 1]);

/* La empresa figura también como relacionada, en un grupo y en un recurrente. */
await pagina.evaluate(async (otra) => {
  const t = 'TALLERES INVENTADOS SL B00000001';
  await App.anotarLista(otra, 'relacionados', { anadir: [{ categoria: 'EMPRESAS', nombre: t }] });
  await Grupos.cargar();
  await Grupos.crear('Grupo de prueba', [{ categoria: 'EMPRESAS', nombre: t }]);
  await Copias.guardar(App.E.gestor, 'recurrentes.json', [
    { id: 'r1', tipo: 'FACTURA', tercero: t, periodo: 'mensual', dia: 1, descripcion: '' }]);
}, deOtra[0]);

const abrirFicha = (nombre) => pagina.evaluate((n) => {
  App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === n)[0], 'abierto');
}, nombre);

console.log('--- 1. el botón en la ficha del asunto ---');
await abrirFicha(deTalleres[0]);
await pagina.waitForSelector('#tercero-cambiar-datos');
await comprobar('sale «Cambiar los datos» en la tarjeta del tercero', pagina.locator('#tercero-cambiar-datos').textContent(), 'Cambiar los datos');
await pagina.click('#tercero-cambiar-datos');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro sale relleno con los datos de la empresa',
  pagina.locator('.alta-campo[data-campo="NIF"]').inputValue(), 'B00000001');

console.log('--- 2. cambiar solo el teléfono ---');
await pagina.fill('.alta-campo[data-campo="Teléfono"]', '952999999');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(600);
await comprobar('no sale ningún cuadro más', pagina.locator('#capa').evaluate(e => e.classList.contains('oculto')), true);
await comprobar('el teléfono nuevo se ve en la ficha del asunto',
  pagina.locator('#ficha-asunto-cuerpo').textContent().then(t => t.indexOf('952999999') !== -1), true);
await comprobar('ninguna carpeta cambia de nombre', nombresAbiertos(), abiertosAntes);

console.log('--- 3 y 4. cambiar el NIF y cancelar ---');
await limpiarAvisos();
await pagina.click('#tercero-cambiar-datos');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="NIF"]', 'B00000002');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await pagina.waitForSelector('#capa:not(.oculto)');
const cuadro = await pagina.locator('#cuadro-cuerpo').textContent();
const titulo = await pagina.locator('#cuadro-titulo').textContent();
await comprobar('sale «Cambia el nombre de las carpetas»', titulo, 'Cambia el nombre de las carpetas');
await comprobar('con el texto de antes y el de después',
  cuadro.indexOf('«TALLERES INVENTADOS SL B00000001»') !== -1 && cuadro.indexOf('«TALLERES INVENTADOS SL B00000002»') !== -1, true);
await comprobar('«Asuntos abiertos (2)» con las dos carpetas',
  cuadro.indexOf('Asuntos abiertos (2)') !== -1 && deTalleres.every(n => cuadro.indexOf(n) !== -1), true);
await comprobar('con la línea de la carpeta del archivo y sin el asunto archivado',
  cuadro.indexOf('Su carpeta del archivo cambia de nombre') !== -1 && archivadoAntes.every(n => cuadro.indexOf(n) === -1), true);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(400);
await comprobar('«Cancelar»: empresas.csv sigue con B00000001', csv().then(t => t.indexOf('B00000001') !== -1 && t.indexOf('B00000002') === -1), true);
await comprobar('«Cancelar»: ninguna carpeta ha cambiado', nombresAbiertos(), abiertosAntes);

console.log('--- 5, 6 y 7. «Adelante» ---');
await limpiarAvisos();
await pagina.click('#tercero-cambiar-datos');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="NIF"]', 'B00000002');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
const nuevos = deTalleres.map(n => n.replace('B00000001', 'B00000002'));
await comprobar('empresas.csv tiene B00000002', csv().then(t => t.indexOf('B00000002') !== -1 && t.indexOf('B00000001') === -1), true);
await comprobar('las dos carpetas abiertas terminan en el texto nuevo',
  nombresAbiertos().then(ns => nuevos.every(n => ns.indexOf(n) !== -1) && deTalleres.every(n => ns.indexOf(n) === -1)), true);
await comprobar('la ficha y los hitos viajan con ellas',
  pagina.evaluate(async (par) => {
    const reg = App.E.registro.asuntos;
    const hitos = await Hitos.leer();
    return par.map(([v, n]) => [!!reg[n], !reg[v], !!hitos.porAsunto[n] || !hitos.porAsunto[v]]);
  }, deTalleres.map((v, i) => [v, nuevos[i]])),
  [[true, true, true], [true, true, true]]);
await comprobar('la ficha del asunto sigue abierta, con el nombre nuevo en la cabecera',
  pagina.locator('#pantalla-asunto').evaluate(e => !e.classList.contains('oculto')).then(async v =>
    v && (await pagina.locator('.ficha-nombre').first().textContent()).indexOf('B00000002') !== -1), true);
const av = await avisos();
await comprobar('sin ningún aviso rojo ni ámbar', av.filter(x => x.indexOf('ROJO') === 0 || x.indexOf('AMBAR') === 0), []);
await comprobar('aviso verde con las carpetas cambiadas', av.some(x => x.indexOf('Datos cambiados. 2 carpetas con el nombre nuevo.') !== -1), true);

console.log('--- 7 (archivo) ---');
await comprobar('en el archivo, la carpeta lleva el texto nuevo y ya no está la vieja',
  pagina.evaluate(async () => {
    const cat = await window.__disco.archivo.getDirectoryHandle('EMPRESAS');
    const n = [];
    for await (const p of cat.entries()) n.push(p[0]);
    return n.sort();
  }), ['TALLERES INVENTADOS SL B00000002']);
await comprobar('dentro, el asunto archivado conserva su nombre de antes',
  hijos('EMPRESAS', 'TALLERES INVENTADOS SL B00000002'), archivadoAntes);
await comprobar('el índice del archivo no apunta a la carpeta vieja',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const texto = [];
    const buscar = async (d) => {
      for await (const [n, h] of d.entries()) {
        if (h.kind === 'directory') await buscar(h);
        else if (/indice-archivo/.test(n) || n.endsWith('.json') && d.name === 'indice-archivo') texto.push(await (await h.getFile()).text());
      }
    };
    await buscar(g);
    const todo = texto.join('');
    return todo.indexOf('B00000001') === -1;
  }), true);

console.log('--- 10. los demás sitios con el texto viejo ---');
await comprobar('relacionado de otro asunto, una sola vez',
  pagina.evaluate((otra) => (App.E.registro.asuntos[otra].relacionados || []).map(r => r.nombre), deOtra[0]),
  ['TALLERES INVENTADOS SL B00000002']);
await comprobar('miembro de un grupo', pagina.evaluate(() => Grupos.lista()[0].miembros.map(m => m.nombre)),
  ['TALLERES INVENTADOS SL B00000002']);
await comprobar('asunto recurrente', pagina.evaluate(async () => {
  const g = await Carpetas.leerJson(App.E.gestor, 'recurrentes.json');
  return g.map(r => r.tercero);
}), ['TALLERES INVENTADOS SL B00000002']);

console.log('--- 8, 9, 11 y 12. desde Personas y empresas; uno ocupado; la carpeta nueva ya existía ---');
await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('EMPRESAS');
  const ya = await cat.getDirectoryHandle('TALLERES INVENTADOS SL B00000003', { create: true });
  await ya.getDirectoryHandle('260101 A26-0001 FACTURA TALLERES INVENTADOS SL B00000003', { create: true });
});
await abrirFicha(nuevos[1]);   /* otra ficha cualquiera: se sale de ella */
await pagina.evaluate(() => { App.E.ocupados[App.E.listaAbiertos.filter(x => x.nombre.endsWith('TALLERES INVENTADOS SL B00000002') && /^260912/.test(x.nombre))[0].nombre] = true; });
await pagina.evaluate(() => App.ir('personas'));
await pagina.waitForTimeout(300);
await pagina.selectOption('#filtro-personas', 'EMPRESAS');
await pagina.fill('#buscar-personas', 'talleres');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#cambiar-tercero');
await limpiarAvisos();
await pagina.click('#cambiar-tercero');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="NIF"]', 'B00000003');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('mismo cuadro desde Personas y empresas',
  pagina.locator('#cuadro-titulo').textContent(), 'Cambia el nombre de las carpetas');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
const ocupado = nuevos.filter(n => /^260912/.test(n))[0];
const libre = nuevos.filter(n => /^260910/.test(n))[0];
await comprobar('el libre cambia y el ocupado no',
  nombresAbiertos().then(ns => [ns.indexOf(libre.replace('B00000002', 'B00000003')) !== -1, ns.indexOf(ocupado) !== -1]), [true, true]);
await comprobar('sale el aviso ámbar del asunto que no ha cambiado',
  avisos().then(a => a.some(x => x.indexOf('AMBAR: 1 asunto(s) no han cambiado de nombre porque están abiertos en otro ordenador') !== -1 && x.indexOf(ocupado) !== -1)), true);
await comprobar('en el archivo queda una sola carpeta, con los asuntos de las dos dentro',
  hijos('EMPRESAS').then(async (cs) => [cs.filter(c => c.indexOf('TALLERES') === 0), (await hijos('EMPRESAS', 'TALLERES INVENTADOS SL B00000003')).length]),
  [['TALLERES INVENTADOS SL B00000003'], 2]);
await comprobar('la ficha de la persona enseña los abiertos y el archivado',
  pagina.locator('#asuntos-del-tercero').textContent().then(t => t.indexOf('260910') !== -1 && t.indexOf(archivadoAntes[0].slice(0, 6)) !== -1), true);

console.log('--- 13 y 14. quién no lleva el botón ---');
await comprobar('un alumno de Séneca no lleva botón',
  pagina.evaluate(() => App.sePuedeCambiarElTercero({ categoria: 'ALUMNADO', id: '1139877', nombre: 'X', matriculado: true })), false);
await comprobar('ni el personal de Séneca',
  pagina.evaluate(() => App.sePuedeCambiarElTercero({ categoria: 'PERSONAL', deSeneca: true, nombre: 'X' })), false);
const libreNuevo = libre.replace('B00000002', 'B00000003');
await abrirFicha(libreNuevo);
await pagina.waitForSelector('#tercero-cambiar-datos');
await comprobar('en la ficha de un asunto abierto sale', pagina.locator('#tercero-cambiar-datos').count(), 1);
/* Un asunto en modo archivado (la misma ficha, vista desde el ARCHIVO). */
await pagina.evaluate((n) => { App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === n)[0], 'archivado'); }, libreNuevo);
await pagina.waitForSelector('#tercero-ver-todo');
await comprobar('en la ficha de un asunto archivado no sale', pagina.locator('#tercero-cambiar-datos').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
