/* Prueba en navegador de verdad de "Borrar con papelera" (docs/PAPELERA.md).

   Sin el arreglo esta prueba falla desde el primer paso: no existe
   `window.Papelera`, no hay botón Borrar en los documentos ni en las
   listas de Ajustes, y no hay bloque "Papelera" en Ajustes.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

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

/* Borrar un documento vive desde la fila 36
   (docs/FILAS-QUE-NO-SE-ESTRUJAN.md) dentro del menú de tres puntos de
   su fila, no suelto: hay que abrirlo antes de poder pulsarlo. */
async function abrirMenuDe(fila) {
  await fila.locator('.menu-acciones .boton-menu').click();
  return fila.locator('.menu-acciones-lista');
}

/* ---------- arranque ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez García, Ana 1234', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');

/* ================================================================
   1. Borrar un documento de un asunto, desde su ficha.
   ================================================================ */
console.log('--- 1. borrar un documento de un asunto ---');

await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  await a.handle.getFileHandle('260415 FACTURA Material de oficina.pdf', { create: true });
});
await pagina.click('#lista-abiertos .nombre-pulsable');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.ficha-documento');
await comprobar('el documento se ve en la ficha',
  pagina.locator('.ficha-documento').count(), 1);

await (await abrirMenuDe(pagina.locator('#ficha-documentos .ficha-documento-fila'))).getByRole('button', { name: 'Borrar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro pregunta si mandar a la papelera',
  pagina.locator('#cuadro-titulo').textContent(), '¿Mandar a la papelera?');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

await comprobar('el documento ya no está en la carpeta del asunto', pagina.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const f = [];
  for await (const p of a.handle.entries()) f.push(p[0]);
  return f;
}), []);

const papelera1 = await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('papelera.json');
  return JSON.parse(await (await h.getFile()).text()).fichas;
});
await comprobar('hay una ficha en papelera.json', papelera1.length, 1);
await comprobar('es un documento, con su origen', papelera1[0].clase === 'documento' &&
  papelera1[0].nombre === '260415 FACTURA Material de oficina.pdf' &&
  papelera1[0].origen.asunto === '260901 MATRICULA 26-27 Pérez García, Ana 1234', true);

await comprobar('está dentro de _GESTOR/PAPELERA', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const p = await g.getDirectoryHandle('PAPELERA');
  const nombres = [];
  for await (const par of p.entries()) nombres.push(par[0]);
  return nombres.length === 1 && nombres[0].indexOf('260415 FACTURA Material de oficina.pdf') !== -1;
}), true);

await comprobar('se apunta una nota en el asunto',
  pagina.locator('#ficha-notas').textContent().then(t => t.indexOf('mandó a la papelera') !== -1), true);

/* ================================================================
   2. Devolverlo desde Ajustes › Papelera.
   ================================================================ */
console.log('--- 2. devolver el documento a su sitio ---');

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
await comprobar('la papelera enseña la ficha', pagina.locator('#tabla-papelera .fila-papelera').count(), 1);

await pagina.getByRole('button', { name: 'Devolver a su sitio' }).click();
await pagina.waitForTimeout(400);
await comprobar('la papelera queda vacía',
  pagina.locator('#tabla-papelera .vacio').count(), 1);
await comprobar('el documento vuelve a la carpeta del asunto, con el mismo nombre', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const a = await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez García, Ana 1234');
  const f = [];
  for await (const p of a.entries()) f.push(p[0]);
  return f;
}), ['260415 FACTURA Material de oficina.pdf']);

/* ================================================================
   3 y 4. Borrar un asunto con documentos, y devolverlo.
   ================================================================ */
console.log('--- 3 y 4. borrar y devolver un asunto entero ---');

await pagina.evaluate(async () => {
  const carpeta = await window.__disco.abiertos.getDirectoryHandle('260801 BECA 26-27 Trujillo Sanz, Hugo 5566', { create: true });
  await carpeta.getFileHandle('a.pdf', { create: true });
  await carpeta.getFileHandle('b.pdf', { create: true });
  await carpeta.getFileHandle('c.pdf', { create: true });
});
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);
/* Se pone el estado con la propia API de la aplicación (App.anotar),
   no escribiendo el JSON a mano: así el estado en memoria
   (App.E.registro) y el del disco quedan de acuerdo, igual que
   pasaría de verdad. */
await pagina.evaluate(async () => {
  await App.anotar('260801 BECA 26-27 Trujillo Sanz, Hugo 5566', { situacion: 'PENDIENTE' });
});
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);
await pagina.locator('.tarjeta-asunto').filter({ hasText: 'BECA' }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');

await pagina.locator('#ficha-acciones').getByRole('button', { name: 'Borrar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('avisa de que se lleva los documentos',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('Se lleva 3 documentos') !== -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('pide un segundo "¿Seguro?"',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('¿Seguro?') !== -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('la carpeta ya no está en abiertos', pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return nombres.filter(n => n.indexOf('BECA') !== -1).length;
}), 0);
await comprobar('la ficha ya no está en asuntos.json', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  return !!j.asuntos['260801 BECA 26-27 Trujillo Sanz, Hugo 5566'];
}), false);

await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
const fichaAsunto = pagina.locator('#tabla-papelera .fila-papelera').filter({ hasText: 'BECA' });
await comprobar('la papelera enseña el asunto', fichaAsunto.count(), 1);
await fichaAsunto.getByRole('button', { name: 'Devolver a su sitio' }).click();
await pagina.waitForTimeout(400);

await comprobar('la carpeta vuelve, con sus tres documentos', pagina.evaluate(async () => {
  const c = await window.__disco.abiertos.getDirectoryHandle('260801 BECA 26-27 Trujillo Sanz, Hugo 5566');
  const f = [];
  for await (const p of c.entries()) f.push(p[0]);
  return f.sort();
}), ['a.pdf', 'b.pdf', 'c.pdf']);
await comprobar('la ficha vuelve a asuntos.json, con su estado', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const f = j.asuntos['260801 BECA 26-27 Trujillo Sanz, Hugo 5566'];
  return f && f.situacion;
}), 'PENDIENTE');

/* ================================================================
   5. Un tipo de asunto con asuntos vivos no se puede borrar.
   ================================================================ */
console.log('--- 5. un tipo con asuntos no se borra ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.fill('#buscar-tipos', 'matricula');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
const tarjetaMatricula = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'MATRICULA' });
await tarjetaMatricula.locator('.tarjeta-tipo-menu-btn').click();
await tarjetaMatricula.getByRole('button', { name: 'Borrar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el título dice que no se puede borrar',
  pagina.locator('#cuadro-titulo').textContent(), 'No se puede borrar');
await comprobar('el cuerpo dice cuántos asuntos hay con ese tipo',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => /\d asunto/.test(t)), true);
await pagina.click('#cuadro-aceptar');
await pagina.fill('#buscar-tipos', '');

await comprobar('MATRICULA sigue en la lista',
  pagina.evaluate(() => App.E.tipos.some(t => t.tipo === 'MATRICULA')), true);

/* ================================================================
   6. Un estado que algún asunto tiene puesto no se puede borrar.
   ================================================================ */
console.log('--- 6. un estado en uso no se borra ---');

const tarjetaPendiente = pagina.locator('#tabla-estados .tarjeta-tipo').filter({ hasText: 'PENDIENTE' });
await tarjetaPendiente.locator('.tarjeta-tipo-menu-btn').click();
await tarjetaPendiente.getByRole('button', { name: 'Borrar' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro dice que hay asuntos en ese estado',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => /\d asunto/.test(t)), true);
await pagina.click('#cuadro-aceptar');
await comprobar('PENDIENTE sigue en la lista',
  pagina.evaluate(() => App.E.estados.some(e => e.nombre === 'PENDIENTE')), true);

/* ================================================================
   7. Devolver un documento cuyo asunto ya no existe.
   ================================================================ */
console.log('--- 7. el asunto de un documento ya no existe ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.find(x => x.nombre.indexOf('MATRICULA') !== -1);
  await a.handle.getFileHandle('260901 SOLICITUD.pdf', { create: true });
});
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await pagina.locator('.tarjeta-asunto').filter({ hasText: 'MATRICULA' }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('.ficha-documento');
await (await abrirMenuDe(pagina.locator('.ficha-documento-fila').filter({ hasText: 'SOLICITUD' })))
  .getByRole('button', { name: 'Borrar' }).click();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

/* Ahora se borra el propio asunto por fuera de la papelera (a mano,
   como si alguien hubiera movido la carpeta desde el explorador),
   para dejar el documento huérfano de verdad. */
await pagina.evaluate(async () => {
  const nombre = App.E.listaAbiertos.find(x => x.nombre.indexOf('MATRICULA') !== -1).nombre;
  await window.__disco.abiertos.removeEntry(nombre, { recursive: true });
});
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
const fichaDoc = pagina.locator('#tabla-papelera .fila-papelera').filter({ hasText: 'SOLICITUD' });
await fichaDoc.getByRole('button', { name: 'Devolver a su sitio' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('avisa de que el asunto ya no existe',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('ya no existe') !== -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);
await comprobar('se ha llevado a Por clasificar', pagina.evaluate(async () => {
  const nombres = [];
  for await (const p of window.__disco.abiertos.entries()) nombres.push(p[0]);
  return nombres.indexOf('260901 SOLICITUD.pdf') !== -1;
}), true);

/* ================================================================
   8. Devolver algo cuando ya hay otra cosa con ese nombre.
   ================================================================ */
console.log('--- 8. no se pisa nada si ya hay algo con ese nombre ---');

await pagina.evaluate(async () => {
  const a = await window.__disco.abiertos.getDirectoryHandle(
    '260901 MATRICULA 26-27 Pérez García, Ana 1234', { create: true });
  await a.getFileHandle('260415 FACTURA Material de oficina.pdf', { create: true });
});
/* La ficha del apartado 1-2 ya volvió a su sitio: se manda otra vez a
   la papelera, y se pone en su carpeta OTRO fichero con el mismo
   nombre, para que al devolver choque. */
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('#btn-recargar');
await pagina.waitForTimeout(300);
await pagina.locator('.tarjeta-asunto').filter({ hasText: 'MATRICULA' }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('.ficha-documento');
await (await abrirMenuDe(pagina.locator('#ficha-documentos .ficha-documento-fila'))).getByRole('button', { name: 'Borrar' }).click();
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.find(x => x.nombre.indexOf('MATRICULA') !== -1);
  await a.handle.getFileHandle('260415 FACTURA Material de oficina.pdf', { create: true });
});
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
const fichaChoque = pagina.locator('#tabla-papelera .fila-papelera').filter({ hasText: 'FACTURA' }).first();
await fichaChoque.getByRole('button', { name: 'Devolver a su sitio' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('avisa de que ya hay algo con ese nombre',
  pagina.locator('#cuadro-cuerpo').textContent().then(t => t.indexOf('Ya hay') !== -1), true);
await pagina.click('#cuadro-aceptar');
await comprobar('sigue en la papelera: no se ha devuelto',
  pagina.locator('#tabla-papelera .fila-papelera').filter({ hasText: 'FACTURA' }).count(), 1);

/* ================================================================
   9. En el ARCHIVO no hay ningún botón Borrar.
   ================================================================ */
console.log('--- 9. en el ARCHIVO no hay botón Borrar ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.click('#btn-recargar-archivo');
await pagina.waitForTimeout(300);
await comprobar('el archivo no tiene ningún botón Borrar',
  pagina.locator('#lista-archivo').getByRole('button', { name: 'Borrar' }).count(), 0);

/* ================================================================
   10. La papelera no se vacía sola.
   ================================================================ */
console.log('--- 10. la papelera no se vacía sola ---');

await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('papelera.json');
  const j = JSON.parse(await (await h.getFile()).text());
  const hace60dias = new Date(Date.now() - 60 * 86400000).toISOString();
  j.fichas.push({
    id: 'vieja1', clase: 'nota-tablon', nombre: 'una nota de hace tiempo', carpeta: null,
    origen: null, datos: { id: 'x', texto: 'una nota de hace tiempo', color: 'amarillo',
      autor: 'Francisco', creado: hace60dias, para: '', privada: false, hecha: false,
      hechaPor: '', hechaEl: '' },
    quien: 'Francisco', cuando: hace60dias
  });
  await (await h.createWritable()).write(JSON.stringify(j));
});
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-papelera .fila-papelera');
await comprobar('la ficha de hace 60 días sigue en la papelera',
  pagina.locator('#tabla-papelera .fila-papelera').filter({ hasText: 'una nota de hace tiempo' }).count(), 1);
await comprobar('el aviso de más de 30 días sale',
  pagina.locator('#aviso-papelera-vieja').isHidden(), false);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
