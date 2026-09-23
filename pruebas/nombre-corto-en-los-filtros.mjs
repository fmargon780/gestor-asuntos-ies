/* Prueba en navegador de verdad de la fila 97
   (docs/NOMBRE-CORTO-EN-LOS-FILTROS.md): el nombre corto del tipo, en
   las tarjetas de filtro «Por tipo de asunto» y en la etiqueta del tipo
   de cada tarjeta de asunto, con el nombre largo al pasar el ratón; y
   el buscador encuentra el asunto por los dos nombres, abierto y en el
   ARCHIVO (IndiceArchivo.textoDeBusqueda, sin tocar la VERSION del
   índice). Dos tipos con el mismo nombre corto siguen siendo dos
   tarjetas. Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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

const LARGO = 'TRASLADO DE EXPEDIENTE SOLICITADO AL CENTRO DE ORIGEN';
const LARGO2 = 'TRASLADO DE EXPEDIENTE AL CENTRO DE DESTINO';

/* Tres tipos: uno con nombre corto, otro con el MISMO nombre corto
   (Ajustes avisa, pero la lista tiene que aguantarlo) y uno sin él. */
await pagina.evaluate(async ([LARGO, LARGO2]) => {
  App.E.tipos = App.E.tipos.filter(t => t.tipo !== 'MATRICULA').concat([
    { tipo: LARGO, categoria: 'ALUMNADO', nombreCorto: 'TRASLEXP' },
    { tipo: LARGO2, categoria: 'ALUMNADO', nombreCorto: 'TRASLEXP' },
    { tipo: 'MATRICULA', categoria: 'ALUMNADO' }
  ]);
  const nombres = [
    '260901 TRASLEXP 26-27 Aguilar Ponce, Marina 1140233',
    '260902 ' + LARGO2 + ' 26-27 Bermúdez Ortiz, Álvaro 1140501',
    '260903 MATRICULA 26-27 Trujillo Sanz, Hugo 1120044'
  ];
  for (const n of nombres) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
  await App.verAbiertos();
}, [LARGO, LARGO2]);
await pagina.click('.panel[data-vista="departamento"]');
await pagina.waitForTimeout(300);

await comprobar('los tres asuntos salen', pagina.locator('#lista-abiertos .tarjeta').count(), 3);
const rotulos = await pagina.locator('#grupos-tipo .grupo-nombre').allTextContents();
await comprobar('los filtros enseñan el nombre corto, y el de siempre si no hay (dos TRASLEXP: dos tipos distintos)',
  Promise.resolve(rotulos.slice().sort()), ['MATRICULA', 'TRASLEXP', 'TRASLEXP', 'Todos']);
await comprobar('cada tarjeta de filtro sigue siendo de su tipo de verdad',
  pagina.locator('#grupos-tipo .grupo').evaluateAll(bs => bs.map(b => b.dataset.tipo).sort()),
  ['', 'MATRICULA', LARGO2, LARGO].sort());
await comprobar('el nombre largo sale al pasar el ratón por el filtro',
  pagina.locator(`#grupos-tipo .grupo[data-tipo="${LARGO}"]`).getAttribute('title'),
  'Ver solo los asuntos de tipo ' + LARGO);

await pagina.click(`#grupos-tipo .grupo[data-tipo="${LARGO}"]`);
await pagina.waitForTimeout(300);
await comprobar('pulsar un TRASLEXP deja solo el suyo, no el del otro tipo con el mismo corto',
  pagina.locator('#lista-abiertos .tarjeta').count(), 1);
await pagina.click(`#grupos-tipo .grupo[data-tipo="${LARGO}"]`);
await pagina.waitForTimeout(300);

const marca = pagina.locator('#lista-abiertos .tarjeta:has-text("Aguilar") .marca-tipo');
await comprobar('la etiqueta de la tarjeta enseña el corto', marca.textContent(), 'TRASLEXP');
await comprobar('y el largo al pasar el ratón', marca.getAttribute('title'), LARGO);
const marca2 = pagina.locator('#lista-abiertos .tarjeta:has-text("Bermúdez") .marca-tipo');
await comprobar('una carpeta vieja con el nombre largo también enseña el corto', marca2.textContent(), 'TRASLEXP');
const marca3 = pagina.locator('#lista-abiertos .tarjeta:has-text("Trujillo") .marca-tipo');
await comprobar('sin nombre corto, el de siempre', marca3.textContent(), 'MATRICULA');

async function buscar(texto) {
  await pagina.fill('#buscar-abiertos', texto);
  await pagina.waitForTimeout(300);
  return pagina.locator('#lista-abiertos .tarjeta').allTextContents();
}
let r = await buscar('solicitado origen');
await comprobar('buscar por el nombre largo encuentra el asunto cuya carpeta lleva el corto',
  Promise.resolve(r.length === 1 && r[0].indexOf('Aguilar') > -1), true);
r = await buscar('traslexp bermudez');
await comprobar('buscar por el corto encuentra el asunto cuya carpeta lleva el largo',
  Promise.resolve(r.length === 1 && r[0].indexOf('Bermúdez') > -1), true);
await buscar('');

/* El ARCHIVO: el texto de búsqueda del índice lleva los dos nombres,
   resueltos desde los tipos de hoy, con la entrada tal como está
   guardada (sin rehacer el índice). */
await comprobar('en el ARCHIVO, el texto de búsqueda lleva los dos nombres',
  pagina.evaluate(([LARGO]) => {
    const t = IndiceArchivo.textoDeBusqueda({ nombre: '250101 TRASLEXP Aguilar Ponce, Marina 1140233', tipo: LARGO });
    return t.indexOf(U.normalizar('solicitado al centro de origen')) > -1 && t.indexOf('traslexp') > -1;
  }, [LARGO]), true);
await comprobar('en el ARCHIVO, una carpeta con el largo también se encuentra por el corto',
  pagina.evaluate(([LARGO2]) => {
    const t = IndiceArchivo.textoDeBusqueda({ nombre: '250101 ' + LARGO2 + ' Bermúdez', tipo: LARGO2 });
    return t.split(' ').indexOf('traslexp') > -1 && t.indexOf(U.normalizar('al centro de destino')) > -1;
  }, [LARGO2]), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
