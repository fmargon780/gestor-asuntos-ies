/* Prueba en navegador de verdad de la fila 257
   (docs/TIPO-EN-UNA-LINEA-AL-CAMBIAR.md): el tipo de asunto en una línea
   con «Cambiar», con buscador vacío, en «Cambiar el asunto» y en «Nuevo
   asunto» cuando llega con el tipo reconocido.

   1. Sin desplegable: el tipo se ve en una línea con «Cambiar».
   2. «Cambiar»: caja vacía con el cursor dentro y nada debajo.
   3. Escribir: como mucho 8, de varias categorías, con tildes/mayúsculas/otro
      orden y por alias; «y N más: sigue escribiendo».
   4. Elegir (ratón, o flechas e Intro): vuelve la línea; se guarda de verdad.
   5. ✕ y Esc: queda el que había y el cuadro sigue abierto.
   6. Sin parecidos: «Ninguno es el que busco: crear «…»»; el cuadro vuelve con
      el tipo nuevo y sin perder lo escrito.
   7. A 1280 × 720 con cuatro campos: cabe entero, tres columnas arriba.
   8. «Nuevo asunto» con el tipo reconocido: línea; en blanco, como siempre. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TIPOS = [
  { tipo: 'EXPEDIENTE', categoria: 'ALUMNADO' },
  { tipo: 'COMPRA MATERIAL', categoria: 'EMPRESAS' },
  { tipo: 'SEGURO ESCOLAR', categoria: 'ALUMNADO' },
  { tipo: 'MÉDICA BAJA', categoria: 'PERSONAL', alias: ['LICENCIA ANTIGUA'] }
].concat(['GENERAL', 'TRANSPORTE', 'COMEDOR', 'LIBROS', 'UNIFORME', 'EXCURSIÓN', 'GUARDERÍA', 'ACOGIDA', 'MOCHILA', 'IDIOMAS']
  .map((x, i) => ({ tipo: 'AYUDA ' + x, categoria: i % 2 ? 'ALUMNADO' : 'EMPRESAS' })));
const CAMPOS = {
  propios: ['uno', 'dos', 'tres', 'cuatro'].map(x => ({ id: x, nombre: 'Dato ' + x, clase: 'texto', valores: [] })),
  porTipo: { EXPEDIENTE: ['uno', 'dos', 'tres', 'cuatro'].map(x => ({ origen: 'propio', id: x, obligatorio: false, enNombre: false })) }
};

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
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
await pagina.evaluate(async ([tipos, campos]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  g._hijos.set('tipos.json', window.__disco.fich('tipos.json', JSON.stringify(tipos)));
  g._hijos.set('campos.json', window.__disco.fich('campos.json', JSON.stringify(campos)));
  const d = await g.getDirectoryHandle('datos', { create: true });
  const regalum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Teléfono del tutor;Correo del tutor',
    'García López, Lucía;1150111;1º de E.S.O.;1º A;2026;Matriculada;10/02/2013;600111222;tutor1@ejemplo.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regalum));
}, [TIPOS, CAMPOS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

const NOMBRE = '260901 EXPEDIENTE García López, Lucía 1150111';
await pagina.evaluate(async (nombre) => {
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await App.anotar(nombre, { abiertoEl: U.ahora(), tipo: 'EXPEDIENTE', categoria: 'ALUMNADO',
                             tercero: 'García López, Lucía 1150111', curso: '26-27', grupo: '1ºA',
                             descripcion: 'inicial', campos: {} });
  await App.verAbiertos();
}, NOMBRE);

async function abrirEditar() {
  await pagina.evaluate((nombre) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === nombre)[0];
    window.__editando = App.editarAsunto(a);
  }, NOMBRE);
  await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo-cambiar');
}
const lineaDeTipo = () => pagina.locator('#ed-tipo-nombre').textContent();
const resultados = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#ed-tipo-resultados .tipo-resultado')).map(e => e.dataset.tipo));
const cuadroAbierto = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto'));

/* 1 y 7. La línea y el tamaño del cuadro. */
console.log('--- 1 y 7. la línea y el cuadro compacto ---');
await abrirEditar();
await comprobar('1. no hay desplegable de tipos', pagina.evaluate(() => document.querySelectorAll('select#ed-tipo, #capa select[id="ed-tipo"]').length), 0);
await comprobar('1. el tipo se ve en una línea con «Cambiar»', lineaDeTipo(), 'EXPEDIENTE');
await comprobar('1. y «Cambiar» está a su lado', pagina.locator('#ed-tipo-cambiar').textContent(), 'Cambiar');
await comprobar('7. el cuadro cabe entero a 1280×720, sin barra de desplazamiento y con Guardar a la vista',
  pagina.evaluate(() => {
    const c = document.querySelector('#capa .cuadro');
    const r = document.getElementById('cuadro-aceptar').getBoundingClientRect();
    return { sinBarra: c.scrollHeight <= c.clientHeight + 1, guardarVisible: r.bottom <= window.innerHeight && r.top >= 0,
             campos: document.querySelectorAll('#ed-campos .campo-fila').length };
  }), { sinBarra: true, guardarVisible: true, campos: 4 });
await comprobar('7. fecha, grupo y año en la misma fila',
  pagina.evaluate(() => ['ed-fecha', 'ed-grupo', 'ed-curso'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top))
    .every((t, _, a) => t === a[0])), true);
await comprobar('7. nada se sale por la derecha',
  pagina.evaluate(() => {
    const c = document.querySelector('#capa .cuadro').getBoundingClientRect();
    return Array.from(document.querySelectorAll('#capa .cuadro input, #capa .cuadro .vista-previa, #capa .cuadro .elegido-caja'))
      .every(e => e.getBoundingClientRect().right <= c.right + 1);
  }), true);
await comprobar('7. los campos van en dos columnas',
  pagina.evaluate(() => {
    const t = Array.from(document.querySelectorAll('#ed-campos .campo-fila')).map(e => Math.round(e.getBoundingClientRect().top));
    return t[0] === t[1] && t[2] === t[3] && t[2] > t[0];
  }), true);

/* 2. «Cambiar»: caja vacía, cursor dentro, nada debajo. */
console.log('--- 2 y 3. buscar ---');
await pagina.click('#ed-tipo-cambiar');
await comprobar('2. caja vacía con el cursor dentro',
  pagina.evaluate(() => { const i = document.getElementById('ed-tipo-buscar'); return { vacia: i.value === '', foco: document.activeElement === i, ayuda: i.placeholder }; }),
  { vacia: true, foco: true, ayuda: 'Escribe para buscar un tipo' });
await comprobar('2. nada debajo', resultados(), []);

/* 3. Escribir. */
await pagina.fill('#ed-tipo-buscar', 'ayu');
await comprobar('3. tres letras: como mucho 8, de varias categorías', pagina.evaluate(() => {
  const t = Array.from(document.querySelectorAll('#ed-tipo-resultados .tipo-resultado'));
  return { n: t.length, cats: Array.from(new Set(t.map(e => e.querySelector('.resultado-categoria').textContent))).sort() };
}), { n: 8, cats: ['ALUMNADO', 'EMPRESAS'] });
await comprobar('3. «y N más: sigue escribiendo»', pagina.locator('.tipo-resultado-mas').textContent(), 'y 2 más: sigue escribiendo');
await pagina.fill('#ed-tipo-buscar', 'MEDICA baja');
await comprobar('3. tildes y mayúsculas da igual', resultados(), ['MÉDICA BAJA']);
await pagina.fill('#ed-tipo-buscar', 'baja medica');
await comprobar('3. otro orden de palabras', resultados(), ['MÉDICA BAJA']);
await pagina.fill('#ed-tipo-buscar', 'licencia antigua');
await comprobar('3. por un alias', resultados(), ['MÉDICA BAJA']);
await pagina.fill('#ed-tipo-buscar', 'ayuda comedor');
await comprobar('3. por dos palabras', (await resultados())[0], 'AYUDA COMEDOR');

/* 4. Elegir con el teclado. */
console.log('--- 4. elegir ---');
await pagina.fill('#ed-tipo-buscar', 'seguro');
await pagina.keyboard.press('ArrowDown');
await pagina.keyboard.press('Enter');
await comprobar('4. flechas e Intro: vuelve la línea con el tipo nuevo', lineaDeTipo(), 'SEGURO ESCOLAR');
await comprobar('4. y «Se llamará» lo lleva', pagina.locator('#ed-vista').textContent().then(t => t.indexOf('SEGURO ESCOLAR') !== -1), true);
await comprobar('4. el cuadro sigue abierto', cuadroAbierto(), true);

/* 5. ✕ y Esc. */
console.log('--- 5. ✕ y Esc ---');
await pagina.fill('#ed-descripcion', 'cambiada');
await pagina.click('#ed-tipo-cambiar');
await pagina.fill('#ed-tipo-buscar', 'compra');
await pagina.click('#ed-tipo-dejar');
await comprobar('5. ✕: queda el tipo que había', lineaDeTipo(), 'SEGURO ESCOLAR');
await comprobar('5. ✕: el cuadro sigue abierto con lo demás intacto',
  Promise.all([cuadroAbierto(), pagina.locator('#ed-descripcion').inputValue()]), [true, 'cambiada']);
await pagina.click('#ed-tipo-cambiar');
await pagina.fill('#ed-tipo-buscar', 'compra');
await pagina.keyboard.press('Escape');
await comprobar('5. Esc: queda el tipo que había', lineaDeTipo(), 'SEGURO ESCOLAR');
await comprobar('5. Esc: el cuadro sigue abierto con lo demás intacto',
  Promise.all([cuadroAbierto(), pagina.locator('#ed-descripcion').inputValue()]), [true, 'cambiada']);
await pagina.keyboard.press('Escape');
await comprobar('5. un segundo Esc, sin búsqueda abierta, sí cierra el cuadro', cuadroAbierto(), false);
await pagina.evaluate(() => window.__editando);

/* 4 (guardar de verdad) y 6 (crear uno nuevo). */
console.log('--- 4 y 6. guardar y crear ---');
await abrirEditar();
await pagina.fill('#ed-descripcion', 'otra');
await pagina.fill('#ed-grupo', '2ºB');
await pagina.click('#ed-tipo-cambiar');
await pagina.fill('#ed-tipo-buscar', 'zzz inventado');
await comprobar('6. sin parecidos: «Ninguno es el que busco: crear…»',
  pagina.locator('#ed-tipo-crear button').textContent(), 'Ninguno es el que busco: crear «ZZZ INVENTADO»');
await pagina.click('#ed-tipo-crear button');
await pagina.waitForSelector('#cuadro-titulo:has-text("¿En qué categoría?")');
await comprobar('6. propone la categoría del tipo que tenía', pagina.locator('#bc-categoria').inputValue(), 'ALUMNADO');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa:not(.oculto) #ed-tipo-cambiar');
await comprobar('6. el cuadro vuelve con el tipo nuevo elegido', lineaDeTipo(), 'ZZZ INVENTADO');
await comprobar('6. sin perder la descripción ni el grupo',
  Promise.all([pagina.locator('#ed-descripcion').inputValue(), pagina.locator('#ed-grupo').inputValue()]), ['otra', '2ºB']);
await comprobar('6. el tipo está creado', pagina.evaluate(() => App.E.tipos.some(t => t.tipo === 'ZZZ INVENTADO' && t.categoria === 'ALUMNADO')), true);
await pagina.click('#cuadro-aceptar');
await pagina.evaluate(() => window.__editando);
await comprobar('4. Guardar cambia el tipo de verdad (la carpeta y la ficha)',
  pagina.evaluate(() => App.E.listaAbiertos.map(a => ({ n: a.nombre, t: a.ficha && a.ficha.tipo })).filter(x => x.n.indexOf('ZZZ INVENTADO') !== -1).map(x => x.t)),
  ['ZZZ INVENTADO']);

/* 8. Nuevo asunto. */
console.log('--- 8. Nuevo asunto ---');
await pagina.evaluate(() => App.nuevoAsuntoCon({ tipo: 'SEGURO ESCOLAR' }));
await pagina.waitForSelector('#tipo-linea-nuevo:not(.oculto)');
await comprobar('8. sale «Tipo de asunto: SEGURO ESCOLAR» y no la parrilla',
  pagina.evaluate(() => ({ linea: document.getElementById('tipo-linea-nuevo').textContent.replace(/\s+/g, ' ').trim(),
    parrilla: document.getElementById('tipos-lista').offsetParent !== null })),
  { linea: 'Tipo de asunto: SEGURO ESCOLARALUMNADOCambiar', parrilla: false });
await pagina.click('#nuevo-tipo-cambiar');
await comprobar('8. «Cambiar»: caja vacía, sin parrilla ni lista',
  pagina.evaluate(() => ({ v: document.getElementById('nuevo-tipo-buscar').value, hay: document.querySelectorAll('#nuevo-tipo-resultados .tipo-resultado').length,
    parrilla: document.getElementById('tipos-lista').offsetParent !== null })), { v: '', hay: 0, parrilla: false });
await pagina.fill('#nuevo-tipo-buscar', 'a');
await comprobar('8. escribir: hasta 8, y solo de la categoría de la persona/tipo',
  pagina.evaluate(() => { const t = Array.from(document.querySelectorAll('#nuevo-tipo-resultados .tipo-resultado')); return t.length <= 8 && t.length > 0 &&
    t.every(e => e.querySelector('.resultado-categoria').textContent === 'ALUMNADO'); }), true);
await pagina.fill('#nuevo-tipo-buscar', 'expediente');
await pagina.click('#nuevo-tipo-resultados .tipo-resultado');
await comprobar('8. elegir: vuelve la línea con el tipo nuevo',
  Promise.all([pagina.locator('#nuevo-tipo-nombre').textContent(), pagina.evaluate(() => App.E.nuevo.tipo)]), ['EXPEDIENTE', 'EXPEDIENTE']);
await pagina.click('#nuevo-tipo-cambiar');
await pagina.fill('#nuevo-tipo-buscar', 'seg');
await pagina.click('#nuevo-tipo-dejar');
await comprobar('8. ✕: deja el que había', pagina.locator('#nuevo-tipo-nombre').textContent(), 'EXPEDIENTE');
/* Salir y entrar en blanco: buscador, 8 más usados y «Ver todos», como siempre. */
await pagina.evaluate(() => App.ir('nuevo'));
await comprobar('8. «Nuevo asunto» en blanco: buscador y parrilla, sin la línea',
  pagina.evaluate(() => ({ linea: !document.getElementById('tipo-linea-nuevo').classList.contains('oculto'),
    parrilla: document.getElementById('tipos-lista').offsetParent !== null,
    buscador: !!document.getElementById('buscar-tipo') && document.getElementById('buscar-tipo').offsetParent !== null,
    visibles: document.querySelectorAll('#tipos-lista .tipo-boton:not(.oculto)').length,
    verTodos: document.getElementById('btn-ver-tipos').textContent })),
  { linea: false, parrilla: true, buscador: true, visibles: 8, verTodos: 'Ver todos (15)' });

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien');
