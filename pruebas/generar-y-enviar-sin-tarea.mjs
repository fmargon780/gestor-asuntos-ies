/* Prueba en navegador de «Generar documento ▾» y «Enviar ▾» de la cabecera del asunto
   (17-nov-2026, fila 695, docs/695-GENERAR-Y-ENVIAR-SIN-TAREA.md): siempre a la vista, sin crear ni marcar
   ninguna tarea, y sin salir con «solo consultar». */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1600, height: 720 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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
async function comprobarQue(titulo, promesa) {
  const real = await promesa;
  if (!real) { fallos++; console.log('FALLA  ' + titulo); }
  else console.log('bien   ' + titulo);
}

const RICO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1140233';
const MINIMO = '260906 CERTIFICADO Otro Proveedor SL 22222222Z';

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([rico, minimo]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [rico]: {
        tercero: 'Pérez Ruiz, Ana 1140233', categoria: 'ALUMNADO', situacion: 'PENDIENTE',
        curso: '26-27', abiertoPor: 'Francisco Marmolejo González'
      },
      [minimo]: {
        tercero: 'Otro Proveedor SL 22222222Z', categoria: 'EMPRESAS', situacion: 'PENDIENTE'
      }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(rico, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(minimo, { create: true });
}, [RICO, MINIMO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombre + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(300);
}


const botones = () => pagina.evaluate(() => ({
  generar: !!document.querySelector('#ficha-generar-enviar .ficha-generar-cab'),
  enviar: !!document.querySelector('#ficha-generar-enviar .ficha-enviar-cab'),
  aviso: document.body.textContent.indexOf('crea antes el hito y su tarea') !== -1 && !!document.querySelector('.hitos-sin-hitos-aviso')
}));

for (const nombre of [RICO, MINIMO]) {
  console.log('--- ' + nombre + ' ---');
  await abrirFicha(nombre);
  await comprobar('los dos botones están a la vista, y el aviso de «crea antes el hito» no sale',
    botones(), { generar: true, enviar: true, aviso: false });
}

await abrirFicha(MINIMO);
await pagina.evaluate(() => {
  window.__marcas = 0;
  const m = Hitos.marcarGuion, p = Hitos.marcarGuionPorAccion;
  if (m) Hitos.marcarGuion = function () { window.__marcas++; return m.apply(this, arguments); };
  if (p) Hitos.marcarGuionPorAccion = function () { window.__marcas++; return p.apply(this, arguments); };
});
await pagina.click('#ficha-generar-enviar .ficha-enviar-cab');
await comprobar('«Enviar ▾» ofrece Correo y Séneca',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')).map((b) => b.textContent.trim())),
  ['Correo', 'Séneca']);
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Correo');
await pagina.waitForSelector('#correo-caja');
await comprobarQue('«Correo» abre el cuadro de correo', pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent === 'Correo de este asunto'));
await comprobar('abrirlo no marca ninguna tarea', pagina.evaluate(() => window.__marcas), 0);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);

await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await comprobarQue('«Generar documento ▾» abre su menú (plantillas del tipo, o el aviso de que no hay)',
  pagina.evaluate(() => document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion').length >= 1));
await pagina.keyboard.press('Escape');

console.log('--- solo consultar ---');
await pagina.evaluate(() => { SoloConsulta.guardar(true); });
await abrirFicha(MINIMO);
await comprobar('con «solo consultar» no salen', botones(), { generar: false, enviar: false, aviso: false });
await pagina.evaluate(() => { SoloConsulta.guardar(false); });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
