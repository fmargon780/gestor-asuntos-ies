/* Prueba en navegador de verdad de las fichas sin carpeta (bloque 4
   del plan de robustez): cuando alguien renombra o mueve una carpeta
   a mano, por fuera de la aplicación, su ficha se queda huérfana.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage();
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
/* La barra nace plegada (10-sep-2026): se abre para ver la pestaña de
   Ajustes y el punto ámbar que cuelga de ella. */
await pagina.click('#btn-barra');

console.log('--- se prepara una ficha huérfana y una carpeta sin ficha ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Carpeta Nueva 111', { create: true });
  const registro = {
    asuntos: {
      '260901 MATRICULA 26-27 Nombre Viejo 111': {
        tipo: 'MATRICULA', situacion: 'PENDIENTE',
        notas: [{ texto: 'Primera nota', cuando: '2026-09-01T08:00:00.000Z' }]
      }
    }
  };
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify(registro)));
  await App.cargarRegistro();
  await App.verAbiertos();
});

await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { document.getElementById('bloque-huerfanas').open = true; });
await pagina.waitForTimeout(200);

await comprobar('aparece como huérfana',
  pagina.locator('#tabla-huerfanas .fila-tipo').count(), 1);
await comprobar('el punto ámbar sale en el botón de Ajustes',
  pagina.locator('#punto-huerfanas').isHidden(), false);

console.log('--- se enlaza con la carpeta que no tenía ficha ---');
await pagina.getByRole('button', { name: 'Enlazar con una carpeta' }).click();
await pagina.waitForSelector('#huerfana-destino');
await pagina.selectOption('#huerfana-destino', '260901 MATRICULA 26-27 Carpeta Nueva 111');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

const registroTrasEnlazar = await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const h = await g.getFileHandle('asuntos.json');
  return JSON.parse(await (await h.getFile()).text());
});
await comprobar('la ficha ha pasado a la carpeta nueva',
  Object.keys(registroTrasEnlazar.asuntos), ['260901 MATRICULA 26-27 Carpeta Nueva 111']);
await comprobar('con sus notas de siempre',
  registroTrasEnlazar.asuntos['260901 MATRICULA 26-27 Carpeta Nueva 111'].notas[0].texto,
  'Primera nota');
await comprobar('ya no queda ninguna huérfana', pagina.locator('#punto-huerfanas').isHidden(), true);

console.log('--- borrar una ficha huérfana ---');
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  await App.cargarRegistro();
  App.E.registro.asuntos['260902 COMPRA 26-27 Nadie 222'] = { tipo: 'COMPRA', notas: [] };
  await Copias.guardar(g, App.FICHERO_ASUNTOS, App.E.registro);
});
await pagina.evaluate(() => App.pintarAjustes());
await pagina.waitForTimeout(200);
await comprobar('sale la nueva huérfana', pagina.locator('#tabla-huerfanas .fila-tipo').count(), 1);

await pagina.getByRole('button', { name: 'Borrar la ficha' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);

await comprobar('la ficha borrada ha desaparecido, y la que tenía carpeta se queda',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle('asuntos.json');
    const r = JSON.parse(await (await h.getFile()).text());
    return Object.keys(r.asuntos);
  }), ['260901 MATRICULA 26-27 Carpeta Nueva 111']);
await comprobar('pero antes se ha guardado una copia', pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const c = await g.getDirectoryHandle('copias');
  const n = [];
  for await (const p of c.entries()) n.push(p[0]);
  return n.some(x => x.indexOf('asuntos-') === 0);
}), true);
await comprobar('sin huérfanas, no sale el punto', pagina.locator('#punto-huerfanas').isHidden(), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
