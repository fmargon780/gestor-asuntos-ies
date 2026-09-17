/* Prueba en navegador de verdad de los aspirantes a plaza sin Nº de
   identificación escolar (17-sep-2026, fila 42,
   docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md, secciones 2 a 5).

   Reutiliza el disco de mentira de pruebas/navegador.mjs, igual que
   pruebas/dni.mjs.

   Escenarios 3, 4 y el aviso de la sección 5:
     - un aspirante sin número se nombra sin número y queda marcado
       "pendiente de número";
     - al escribir el número, se renombran solas las carpetas de sus
       asuntos ABIERTOS (con la lista antes y "Adelante"), y las
       archivadas no se tocan;
     - "Qué me toca" avisa mientras queden aspirantes sin número. */
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

console.log('--- dar de alta un aspirante sin número ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(200);
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
await pagina.click('#tipos-lista .tipo-boton');
await pagina.waitForSelector('#bloque-tercero:not(.oculto)');
await pagina.fill('#buscar-tercero', 'Pendiente De Numero, Nora');
await pagina.waitForTimeout(300);
await pagina.click('#resultados-tercero button');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="Nombre"]', 'Pendiente De Numero, Nora');
await pagina.fill('.alta-campo[data-campo="Fecha de nacimiento"]', '02/02/2013');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('queda marcada como solicitante, pendiente de número',
  pagina.locator('#resultados-tercero .resultado-pie').first().textContent()
    .then(t => t.indexOf('Solicitante') !== -1 && t.indexOf('pendiente de número') !== -1), true);
await pagina.click('#resultados-tercero .resultado');
await comprobar('la carpeta se monta sin número, solo con el nombre',
  pagina.locator('#vista-nombre').textContent()
    .then(t => t.indexOf('Pendiente De Numero, Nora') !== -1 && !/Nora \d/.test(t)), true);

console.log('--- un asunto abierto y uno archivado, los dos suyos ---');
await pagina.fill('#campo-fecha', '2026-09-05');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await comprobar('el primer asunto se crea sin número en el nombre',
  nombresAbiertos().then(ns => ns.some(n => /^260905 \S+( \d{2}-\d{2})? Pendiente De Numero, Nora$/.test(n))), true);

/* Este primero se archiva ahora mismo, para comprobar después que el
   renombrado no lo toca. */
await pagina.getByRole('button', { name: 'Archivar', exact: true }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#lista-abiertos .vacio');
const nombreArchivado = (await pagina.evaluate(async () => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Pendiente De Numero, Nora');
  const salida = [];
  for await (const p of ter.entries()) salida.push(p[0]);
  return salida;
}))[0];

/* Y un segundo asunto, este se queda abierto. */
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(200);
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.waitForSelector('#bloque-tipos:not(.oculto)');
/* Un tipo distinto al del primer asunto, para no chocar con el aviso
   de asunto duplicado (mismo tercero, mismo tipo): no es lo que se
   está probando aquí. */
await pagina.click('#tipos-lista .tipo-boton >> nth=1');
await pagina.waitForSelector('#bloque-tercero:not(.oculto)');
await pagina.fill('#buscar-tercero', 'pendiente de numero');
await pagina.waitForTimeout(300);
await pagina.click('#resultados-tercero .resultado');
await pagina.fill('#campo-fecha', '2026-09-10');
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
const nombreAbierto = (await nombresAbiertos())[0];
await comprobar('el segundo asunto también se crea sin número',
  /^260910 \S+( \d{2}-\d{2})? Pendiente De Numero, Nora$/.test(nombreAbierto), true);

console.log('--- "Qué me toca" avisa mientras queda pendiente ---');
await pagina.evaluate(() => window.QueMeToca.abrir());
await pagina.waitForTimeout(300);
await comprobar('el aviso cuenta el aspirante sin número',
  pagina.locator('.qmt-aviso-aspirantes').textContent()
    .then(t => t.indexOf('1 aspirante sin Nº de identificación escolar') !== -1), true);

console.log('--- escribe el número: renombra el abierto, no el archivado ---');
await pagina.click('.qmt-aviso-aspirantes');
await pagina.waitForSelector('#pantalla-personas:not(.oculto)');
await pagina.waitForTimeout(300);
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#cambiar-tercero');
await pagina.click('#cambiar-tercero');
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="Nº Id. Escolar"]', '1170444');
await pagina.click('#cuadro-aceptar');

/* Se cierra el primer cuadro y se abre el segundo, el de "Adelante". */
await pagina.waitForTimeout(300);
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('el cuadro de renombrado lista solo el asunto abierto',
  pagina.locator('#cuadro-cuerpo').textContent()
    .then(t => t.indexOf(nombreAbierto) !== -1 && t.indexOf(nombreArchivado) === -1), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

await comprobar('la carpeta del asunto abierto se renombra con el número',
  nombresAbiertos().then(ns => ns.some(n => n.indexOf('Pendiente De Numero, Nora 1170444') !== -1)), true);
await comprobar('el asunto viejo ya no está con su nombre de antes',
  nombresAbiertos().then(ns => ns.indexOf(nombreAbierto)), -1);
await comprobar('la carpeta archivada no se toca', pagina.evaluate(async (nombre) => {
  const cat = await window.__disco.archivo.getDirectoryHandle('ALUMNADO');
  const ter = await cat.getDirectoryHandle('Pendiente De Numero, Nora');
  const salida = [];
  for await (const p of ter.entries()) salida.push(p[0]);
  return salida.indexOf(nombre) !== -1;
}, nombreArchivado), true);

console.log('--- ya no queda ningún aspirante pendiente ---');
await pagina.evaluate(() => window.QueMeToca.abrir());
await pagina.waitForTimeout(300);
await comprobar('el aviso desaparece', pagina.locator('.qmt-aviso-aspirantes').count(), 0);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
