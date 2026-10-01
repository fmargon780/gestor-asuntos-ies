/* Prueba en navegador de «Los campos son etiquetas: fuera "Añadir al nombre"»
   (fila 251, docs/CAMPOS-SIN-ANADIR-AL-NOMBRE.md). Reutiliza el disco de
   mentira de pruebas/navegador.mjs. */
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

console.log('--- Cambiar el asunto: sin casilla, y lo de antes se conserva ---');
const r = await pagina.evaluate(() => {
  App.E.campos = { propios: [{ id: 'q1', nombre: 'Uno', clase: 'texto', valores: [] }, { id: 'q2', nombre: 'Dos', clase: 'texto', valores: [] }],
    porTipo: { CONVALIDACION: [{ origen: 'propio', id: 'q1', obligatorio: false, enNombre: true }, { origen: 'propio', id: 'q2', obligatorio: false, enNombre: true }] } };
  const x = App.pintarCamposEditar('CONVALIDACION', { 'propio:q1': { valor: 'viejo', enNombre: true } }, {});
  return { items: x.items.map(i => i.nombre + ':' + i.enNombre), casilla: /Añadir al nombre|-en"/.test(x.html) };
});
await comprobar('sin casilla; solo cuenta la marca guardada (aunque el tipo diga enNombre: true)', r,
  { items: ['Uno:true', 'Dos:false'], casilla: false });

console.log('--- Nuevo asunto: sin interruptor de grupo, sin casilla ---');
await comprobar('no hay interruptor «Añadir el grupo al nombre»',
  pagina.evaluate(() => !document.getElementById('campo-grupo') && document.body.innerHTML.indexOf('Añadir el grupo al nombre') === -1), true);
await comprobar('filaCampoNuevo no pinta «Añadir al nombre»',
  pagina.evaluate(() => {
    const f = App.filaCampoNuevo({ cfg: { origen: 'propio', clase: 'texto', valores: [], obligatorio: false, enNombre: true }, clave: 'propio:q1', nombre: 'Uno', valorInicial: '' });
    return f.textContent.indexOf('Añadir al nombre') === -1 && !f.querySelector('input[type=checkbox]');
  }), true);
await comprobar('valoresCamposActuales nunca marca enNombre',
  pagina.evaluate(() => {
    App.E.nuevo.configCampos = [{ cfg: { origen: 'propio', clase: 'texto', valores: [], enNombre: true }, clave: 'propio:q1', nombre: 'Uno', valorInicial: 'x' }];
    App.E.nuevo.configCampos[0].entradaEl = App.filaCampoNuevo(App.E.nuevo.configCampos[0]).querySelector('input,select');
    return App.valoresCamposActuales().map(v => v.enNombre);
  }), [false]);

console.log('--- el texto de Ajustes ---');
await comprobar('la sección Campos dice que no entran en ningún nombre',
  pagina.evaluate(async () => (await (await fetch('js/ajustes-tipo.js')).text()).indexOf('no entran en ningún nombre') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
