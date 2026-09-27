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
await pagina.evaluate(() => window.App.irVista('departamento'));
await pagina.waitForTimeout(300);

await comprobar('los tres asuntos salen', pagina.locator('#inicio-tabla-cuerpo tr').count(), 3);
/* Fila 192: la fila de tarjetas «Por tipo de asunto» pasa a ser el
   filtro #filtro-tipo-asunto (un <select>), dentro del panel de
   filtros de siempre. */
if (await pagina.locator('#filtros-abiertos').isHidden()) await pagina.click('#btn-filtros');
const opciones = pagina.locator('#filtro-tipo-asunto option');
const rotulos = await opciones.allTextContents();
await comprobar('los filtros enseñan el nombre corto, y el de siempre si no hay (dos TRASLEXP: dos tipos distintos)',
  Promise.resolve(rotulos.slice().sort()), ['MATRICULA', 'TRASLEXP', 'TRASLEXP', 'Todos']);
await comprobar('cada opción sigue siendo de su tipo de verdad',
  opciones.evaluateAll(os => os.map(o => o.value).sort()),
  ['', 'MATRICULA', LARGO2, LARGO].sort());
await comprobar('el nombre largo sale al pasar el ratón por la opción',
  pagina.locator(`#filtro-tipo-asunto option[value="${LARGO}"]`).getAttribute('title'),
  LARGO);

await pagina.selectOption('#filtro-tipo-asunto', LARGO);
await pagina.waitForTimeout(300);
await comprobar('elegir un TRASLEXP deja solo el suyo, no el del otro tipo con el mismo corto',
  pagina.locator('#inicio-tabla-cuerpo tr').count(), 1);
await pagina.selectOption('#filtro-tipo-asunto', '');
await pagina.waitForTimeout(300);

const marca = pagina.locator('#inicio-tabla-cuerpo tr:has-text("Aguilar") .marca-tipo');
await comprobar('la etiqueta de la fila enseña el corto', marca.textContent(), 'TRASLEXP');
await comprobar('y el largo al pasar el ratón', marca.getAttribute('title'), LARGO);
const marca2 = pagina.locator('#inicio-tabla-cuerpo tr:has-text("Bermúdez") .marca-tipo');
await comprobar('una carpeta vieja con el nombre largo también enseña el corto', marca2.textContent(), 'TRASLEXP');
const marca3 = pagina.locator('#inicio-tabla-cuerpo tr:has-text("Trujillo") .marca-tipo');
await comprobar('sin nombre corto, el de siempre', marca3.textContent(), 'MATRICULA');

async function buscar(texto) {
  await pagina.fill('#buscar-abiertos', texto);
  await pagina.waitForTimeout(300);
  return pagina.locator('#inicio-tabla-cuerpo tr').allTextContents();
}
/* Fila 192, decisión 5: el buscador de Inicio pasa al mismo mecanismo
   simple que "Me toca"/"Esperamos a otros" (nombre, tipo y tercero,
   subcadena literal, ya no palabra a palabra). El tipo que entra en la
   búsqueda es siempre el de verdad (el largo): buscar por el corto
   («traslexp») ya no encuentra la carpeta que lleva el nombre largo. */
let r = await buscar('expediente solicitado');
await comprobar('buscar por el nombre largo encuentra el asunto cuya carpeta lleva el corto',
  Promise.resolve(r.length === 1 && r[0].indexOf('Aguilar') > -1), true);
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
