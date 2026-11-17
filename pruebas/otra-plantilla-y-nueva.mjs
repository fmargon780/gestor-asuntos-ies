/* Prueba en navegador de «Otra plantilla…» y «+ Nueva plantilla…» en «Generar documento ▾» de la cabecera del asunto
   (17-nov-2026, fila 697, docs/697-OTRA-PLANTILLA-Y-NUEVA.md). */
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



const opciones = () => pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) .ficha-menu-opcion')).map((b) => b.textContent.trim()));

await pagina.evaluate(async () => {
  await Plantillas.guardar(App.E.gestor, (d) => {
    d.documentos.push({ id: 'pd-a', nombre: 'Certificado de matrícula', tipo: 'MATRICULA', categoria: 'ALUMNADO', fichero: 'a.docx', tipoDocumento: 'Certificado' });
    d.documentos.push({ id: 'pd-b', nombre: 'Carta de bienvenida', tipo: 'MATRICULA', categoria: 'ALUMNADO', fichero: 'b.docx', tipoDocumento: 'Carta' });
    d.documentos.push({ id: 'pd-c', nombre: 'Plantilla vieja', tipo: 'MATRICULA', categoria: 'ALUMNADO', fichero: 'c.docx', tipoDocumento: 'Vieja', fueraDeUso: true });
    return d;
  });
  Plantillas.olvidar();
  window.__generadas = [];
  PlantillasDocumento.generar = async function (a, p, modo, o) { window.__generadas.push([p.id, modo, JSON.stringify(o)]); };
});

await abrirFicha(MINIMO);
await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await comprobar('tipo sin plantillas: «Otra plantilla…» y «+ Nueva plantilla…», y sin el aviso de antes', opciones(), ['Otra plantilla…', '+ Nueva plantilla…']);
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=Otra plantilla…');
await pagina.waitForSelector('.plantilla-buscar-opcion');
await comprobar('«Otra plantilla…» enseña las del centro en uso (no las fuera de uso)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('.plantilla-buscar-opcion')).map((b) => b.dataset.id).sort()), ['pd-a', 'pd-b']);
await pagina.fill('.plantilla-buscar-campo', 'bienvenida');
await comprobar('se busca escribiendo', pagina.evaluate(() => Array.from(document.querySelectorAll('.plantilla-buscar-opcion')).map((b) => b.dataset.id)), ['pd-b']);
await pagina.click('.plantilla-buscar-opcion');
await pagina.waitForTimeout(200);
await comprobar('al elegir una de otro tipo se genera sin tarea ni hito', pagina.evaluate(() => window.__generadas), [['pd-b', 'abierto', '{}']]);
await comprobarQue('el cuadro se cierra', pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')));

await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=+ Nueva plantilla…');
await pagina.waitForSelector('#pd-nombre');
await comprobar('«+ Nueva plantilla…» abre el editor con el tipo del asunto',
  pagina.evaluate(() => [document.getElementById('cuadro-titulo').textContent, document.getElementById('pd-tipo').value]),
  ['Nueva plantilla de documento', 'CERTIFICADO']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(200);

console.log('--- tipo con plantillas ---');
await abrirFicha(RICO);
await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await comprobar('primero las del tipo, luego «Otra plantilla…» y «+ Nueva plantilla…»', opciones(),
  ['Certificado de matrícula', 'Carta de bienvenida', 'Otra plantilla…', '+ Nueva plantilla…']);
await pagina.keyboard.press('Escape');

console.log('--- guardar una nueva: sale en el menú ---');
await pagina.evaluate(() => {
  window.__tipoPreset = null;
  PlantillasDocumento.abrirCuadroDePlantillaDoc = async function (ex, preset, alGuardar) {
    window.__tipoPreset = preset && preset.tipo;
    await Plantillas.guardar(App.E.gestor, (d) => { d.documentos.push({ id: 'pd-n', nombre: 'Aaa nueva', tipo: 'MATRICULA', categoria: 'ALUMNADO', fichero: 'n.docx', tipoDocumento: 'Nueva' }); return d; });
    alGuardar();
  };
});
await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await pagina.click('.ficha-menu:not(.oculto) .ficha-menu-opcion >> text=+ Nueva plantilla…');
await pagina.waitForTimeout(500);
await comprobar('el editor se abre con el tipo del asunto', pagina.evaluate(() => window.__tipoPreset), 'MATRICULA');
await pagina.click('#ficha-generar-enviar .ficha-generar-cab');
await comprobar('la nueva sale entre las del tipo', opciones(),
  ['Certificado de matrícula', 'Carta de bienvenida', 'Aaa nueva', 'Otra plantilla…', '+ Nueva plantilla…']);
await comprobar('sigue habiendo un solo botón «Generar documento»', pagina.evaluate(() => document.querySelectorAll('#ficha-generar-enviar .ficha-generar-cab').length), 1);
await pagina.keyboard.press('Escape');

console.log('--- solo consultar ---');
await pagina.evaluate(() => { SoloConsulta.guardar(true); });
await abrirFicha(MINIMO);
await comprobar('con «solo consultar» no sale el botón', pagina.evaluate(() => !!document.querySelector('#ficha-generar-enviar .ficha-generar-cab')), false);
await pagina.evaluate(() => { SoloConsulta.guardar(false); });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
