/* Prueba en navegador de verdad del nombre comercial de las empresas.

   Lo que tiene que pasar:
     - se busca igual por la razón social que por el rótulo del negocio,
     - debajo del nombre se lee el rótulo,
     - un empresas.csv escrito ANTES de que existiera esta columna se
       sigue leyendo bien (el NIF estaba en la segunda columna),
     - se pueden cambiar los datos de una empresa ya dada de alta,
     - lo de Séneca no se puede cambiar desde la ficha.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
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

/* Un empresas.csv de los VIEJOS: cinco columnas, el NIF en la segunda.
   Es el que él ya tiene en su carpeta. */
await pagina.evaluate(async () => {
  const csv = [
    'Razón social;NIF;Contacto;Teléfono;Correo',
    'PAPELES DEL SUR SL;B29111222;Lola;952000000;lola@papelesdelsur.es'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', csv));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(500);

console.log('--- un fichero viejo se sigue leyendo bien ---');
await comprobar('el NIF de la segunda columna se lee igual',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
    const p = f.lista[0];
    return { nombre: p.nombre, nif: p.nif, comercial: p.comercial, pie: App.pieDe(p) };
  }),
  { nombre: 'PAPELES DEL SUR SL', nif: 'B29111222', comercial: '', pie: 'B29111222' });

console.log('--- dando de alta con nombre comercial ---');
await comprobar('se guarda y se lee',
  pagina.evaluate(async () => {
    await Datos.anadirALista(App.E.datos, 'EMPRESAS', {
      'Razón social': 'ADOLFO GONZÁLEZ DE LEÓN',
      'Nombre comercial': 'Papelería Pintor Palomo',
      'NIF': '33385414V',
      'Contacto': '', 'Teléfono': '', 'Correo': ''
    });
    const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
    const p = f.lista.filter(x => x.nombre === 'ADOLFO GONZÁLEZ DE LEÓN')[0];
    return { nif: p.nif, comercial: p.comercial, pie: App.pieDe(p) };
  }),
  { nif: '33385414V', comercial: 'Papelería Pintor Palomo',
    pie: 'Rótulo: Papelería Pintor Palomo  ·  33385414V' });

/* Al escribir el fichero con la cabecera nueva, el de antes tiene que
   seguir con su NIF en su sitio: es el paso donde se podría estropear. */
await comprobar('y el viejo no se estropea al reescribir el fichero',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
    const p = f.lista.filter(x => x.nombre === 'PAPELES DEL SUR SL')[0];
    return { nif: p.nif, contacto: p.campos['Contacto'] || '' };
  }),
  { nif: 'B29111222', contacto: 'Lola' });

console.log('--- buscando ---');
const buscar = (q) => pagina.evaluate(async (texto) => {
  const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
  return Datos.buscar(f.lista, texto, 30).map(p => p.nombre);
}, q);
await comprobar('por la razón social', buscar('adolfo'), ['ADOLFO GONZÁLEZ DE LEÓN']);
await comprobar('por el rótulo del negocio', buscar('pintor palomo'), ['ADOLFO GONZÁLEZ DE LEÓN']);
await comprobar('por el principio del rótulo', buscar('papeleria'), ['ADOLFO GONZÁLEZ DE LEÓN']);
await comprobar('por el NIF', buscar('33385414V'), ['ADOLFO GONZÁLEZ DE LEÓN']);
await comprobar('la otra empresa sigue apareciendo', buscar('papeles'), ['PAPELES DEL SUR SL']);

console.log('--- el nombre de la carpeta no cambia ---');
await comprobar('manda la razón social, no el rótulo',
  pagina.evaluate(async () => {
    const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
    const p = f.lista.filter(x => x.nombre === 'ADOLFO GONZÁLEZ DE LEÓN')[0];
    return App.textoTercero(p);
  }),
  'ADOLFO GONZÁLEZ DE LEÓN 33385414V');

console.log('--- cambiando los datos de una que ya estaba ---');
await comprobar('se le puede poner el rótulo después',
  pagina.evaluate(async () => {
    await Datos.guardarEnLista(App.E.datos, 'EMPRESAS', 'PAPELES DEL SUR SL', {
      'Razón social': 'PAPELES DEL SUR SL',
      'Nombre comercial': 'Copistería La Vega',
      'NIF': 'B29111222',
      'Contacto': 'Lola', 'Teléfono': '952000000', 'Correo': 'lola@papelesdelsur.es'
    });
    const f = await Datos.cargar(App.E.datos, 'EMPRESAS');
    const p = f.lista.filter(x => x.nombre === 'PAPELES DEL SUR SL')[0];
    return { comercial: p.comercial, cuantas: f.lista.length };
  }),
  { comercial: 'Copistería La Vega', cuantas: 2 });
await comprobar('y ya se busca por él', buscar('la vega'), ['PAPELES DEL SUR SL']);

console.log('--- el botón de cambiar, en la ficha ---');
await pagina.evaluate(() => App.ir('personas'));
await pagina.waitForTimeout(300);
await pagina.selectOption('#filtro-personas', 'EMPRESAS');
await pagina.waitForTimeout(300);
await pagina.fill('#buscar-personas', 'adolfo');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.click('#lista-personas .resultado');
await pagina.waitForTimeout(400);

await comprobar('sale el botón de cambiar los datos',
  pagina.locator('#cambiar-tercero').isVisible(), true);
await comprobar('y la ficha enseña el nombre comercial',
  pagina.locator('#ficha-persona').textContent().then(t => t.indexOf('Papelería Pintor Palomo') !== -1),
  true);

console.log('--- lo de Séneca no se cambia desde aquí ---');
await comprobar('un alumno de Séneca no lleva botón',
  pagina.evaluate(() => App.sePuedeCambiarElTercero(
    { categoria: 'ALUMNADO', deSeneca: true, nombre: 'X' })), false);
await comprobar('una empresa dada de alta a mano sí',
  pagina.evaluate(() => App.sePuedeCambiarElTercero(
    { categoria: 'EMPRESAS', deSeneca: false, nombre: 'X' })), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
