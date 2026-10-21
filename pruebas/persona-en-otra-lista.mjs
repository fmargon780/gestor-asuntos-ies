/* Prueba de la fila 386: avisa cuando la persona buscada está en la otra lista (Alumnado/Personal). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'CERTIFICADO', categoria: 'ALUMNADO' },
  { tipo: 'BAJA', categoria: 'PERSONAL' }
];
const GUIAS = {
  CERTIFICADO: [
    { id: 'c1', titulo: 'Primer paso', cuerpo: '', opciones: [], guion: [] },
    { id: 'c2', titulo: 'Segundo paso', cuerpo: '', opciones: [], guion: [] }
  ]
};

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

/* ---------- arranque, con datos de partida ---------- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([tipos, guias]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('guias.json', window.__disco.fich('guias.json', JSON.stringify(guias)));
  const d = await g.getDirectoryHandle('datos', { create: true });

  const regalum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'García López, Lucía;1150111;1º de E.S.O.;1º A;2026;Matriculada;10/02/2013;600111222;tutor1@ejemplo.es',
    'Díaz Pérez, Ana;1150113;2º de E.S.O.;2º B;2026;Matriculada;10/02/2012;600111224;tutor3@ejemplo.es',
    'García Ruiz, Marta;1150112;4º de E.S.O.;4º D;2024;Matriculada;10/02/2011;600111223;tutor2@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));

  const personal = [
    'Nombre;Documento;Puesto;Teléfono;Correo',
    'García Núñez, Pedro;87654321B;Conserje;600333444;pedro@ejemplo.es',
    'Díaz Torres, María;11111111H;Profesora;600777888;maria@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('personal.csv', window.__disco.fich('personal.csv', personal));

  const empresas = [
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
    'Suministros Bermejo SL;;B12345678;;600555666;info@bermejo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', empresas));
}, [TIPOS, GUIAS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Fila 386 (docs/AVISO-PERSONA-EN-OTRA-LISTA.md): aviso si la persona buscada está en la otra lista. */
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.getByRole('button', { name: 'CERTIFICADO', exact: true }).click();

console.log('--- 1. profesora buscada con un tipo de alumnado: aviso ---');
await pagina.fill('#buscar-tercero', 'diaz torres');
await pagina.waitForSelector('#resultados-tercero .aviso-otra-lista');
const aviso = await pagina.locator('#resultados-tercero .aviso-otra-lista').first().textContent();
await comprobar('el aviso dice dónde está', /Díaz Torres, María está en Personal\. Este tipo es de alumnado\./.test(aviso), true);
await comprobar('lleva los dos botones',
  [await pagina.locator('.boton-esa-persona').textContent(), await pagina.locator('.boton-otra-persona').textContent()],
  ['Es esa persona: elegir otro tipo', 'Es otra persona']);

console.log('--- 2. «Es otra persona»: todo como hoy ---');
await pagina.click('.boton-otra-persona');
await pagina.waitForSelector('#resultados-tercero .vacio');
await comprobar('sale el vacío y el botón de alta',
  [await pagina.locator('#resultados-tercero .aviso-otra-lista').count(),
   await pagina.locator('#resultados-tercero button', { hasText: 'Dar de alta' }).count()], [0, 1]);

console.log('--- 3. dar de alta a mano tras «Es otra persona»: no vuelve a avisar ---');
await pagina.click('#resultados-tercero button:has-text("Dar de alta")');
await pagina.waitForTimeout(300);
await comprobar('se abre el cuadro de alta, sin aviso',
  [await pagina.locator('#resultados-tercero .aviso-otra-lista').count(),
   await pagina.locator('.boton-esa-persona').count() ], [0, 0]);
await pagina.keyboard.press('Escape');
await pagina.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); });

console.log('--- 4. «Es esa persona»: queda puesta y solo tipos de personal ---');
await pagina.fill('#buscar-tercero', 'diaz torres ');
await pagina.fill('#buscar-tercero', 'torres diaz');
await pagina.waitForSelector('#resultados-tercero .aviso-otra-lista');
await pagina.click('.boton-esa-persona');
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await comprobar('la persona queda elegida',
  pagina.locator('#tercero-elegido').textContent().then(t => t.indexOf('Díaz Torres') !== -1), true);
await comprobar('la parrilla solo trae el tipo de PERSONAL',
  pagina.locator('#tipos-lista .tipo-boton').allTextContents().then(l => l.join('|').indexOf('BAJA') !== -1 && l.join('|').indexOf('CERTIFICADO') === -1), true);

console.log('--- 5. al pulsar el alta con resultados en la lista, también avisa ---');
await pagina.click('#btn-cambiar-tercero');
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.evaluate(() => App.elegirCategoria('ALUMNADO'));
await pagina.fill('#buscar-tercero', 'diaz');
await pagina.waitForSelector('#resultados-tercero .resultado');
await comprobar('Ana Díaz sí está en alumnado: sin aviso',
  await pagina.locator('#resultados-tercero .aviso-otra-lista').count(), 0);
await pagina.click('#resultados-tercero button:has-text("Dar de alta")');
await pagina.waitForSelector('#resultados-tercero .aviso-otra-lista');
await comprobar('el alta a mano avisa de María',
  pagina.locator('#resultados-tercero .aviso-otra-lista').first().textContent().then(t => t.indexOf('Díaz Torres, María') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
