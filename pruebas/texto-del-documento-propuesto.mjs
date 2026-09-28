/* Prueba de la fila 201 (docs/NOMBRE-DE-DOCUMENTO-PROPUESTO.md,
   apartados 1 y 4): de dónde sale ya escrito el texto adicional y el
   tipo de documento del cuadro de "Cambiar el nombre".

   Parte 1, sin navegador: la regla de prioridad pura
   (N.propuestaDesdeHito, js/documentos-formulario.js) — el nombre ya
   escrito manda sobre el hito, que manda sobre el tipo de documento (o
   la memoria); sin ninguno, vacío.

   Parte 2, en navegador de verdad:
   1. El editor de un paso de la guía pinta y lee "Texto para los
      documentos de este hito" y "Tipo de documento que suele salir de
      aquí"; un paso-pregunta no los lleva.
   2. Un modelo de la biblioteca los hereda al traerlo a un paso, y se
      comparan igual que los demás campos (CAMPOS_COMPARABLES).
   3. Hitos.pasoAHito los copia del paso al hito vivo; un paso-pregunta,
      ninguno de los dos.
   4. Añadir un documento desde un hito con su propio texto y tipo abre
      el cuadro ya relleno, con los huecos resueltos.
   5. Desde un hito que solo tiene el tipo, el texto sale del "Texto por
      defecto" de ese tipo de documento (Ajustes), también con huecos.
   6. Sin nada en el hito ni en el tipo, el cuadro sale vacío, como hoy.
   7. Sin ningún hito de por medio ("Por clasificar"), solo se propone
      el texto del tipo de documento. */
import fs from 'node:fs';
import vm from 'node:vm';
import { chromium } from 'playwright';

let fallos = 0;
function comprobarSync(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  comprobarSync(titulo, real, esperado);
}

/* ================= PARTE 1: sin navegador ================= */
console.log('--- parte 1: la regla de prioridad ---');
const raiz = new URL('../js/', import.meta.url).pathname;
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['documentos.js', 'documentos-formulario.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), ctx, { filename: f });
}
const N = ctx.Documentos._interno;

comprobarSync('lo que ya trae el nombre manda sobre el hito y el tipo',
  N.propuestaDesdeHito({ delNombre: 'DEL NOMBRE', delHito: 'DEL HITO', delTipo: 'DEL TIPO' }), 'DEL NOMBRE');
comprobarSync('sin nombre, manda el hito',
  N.propuestaDesdeHito({ delHito: 'DEL HITO', delTipo: 'DEL TIPO' }), 'DEL HITO');
comprobarSync('sin nombre ni hito, el del tipo de documento (o la memoria)',
  N.propuestaDesdeHito({ delTipo: 'DEL TIPO' }), 'DEL TIPO');
comprobarSync('sin ninguno de los tres, vacío', N.propuestaDesdeHito({}), '');
comprobarSync('una cadena vacía cuenta como "no hay"',
  N.propuestaDesdeHito({ delNombre: '', delHito: '', delTipo: 'DEL TIPO' }), 'DEL TIPO');

/* ================= PARTE 2: en el navegador ================= */
console.log('--- parte 2: en la aplicación ---');
const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Se
   entra con la de "hitos" ya abierta en grande. */
await pagina.addInitScript(() => {
  window.__tarjeta = 'hitos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

/* La guía de BECA: p1 con su propio texto y tipo; p2 solo con el tipo
   (su texto sale del "Texto por defecto" de ese tipo); p3, sin nada. */
const GUIA = {
  BECA: [
    { id: 'p1', titulo: 'Con texto y tipo propios', textoDocumentos: 'Curso {curso}', tipoDocumento: 'CERTIFICADO' },
    { id: 'p2', titulo: 'Solo con el tipo', tipoDocumento: 'FACTURA' },
    { id: 'p3', titulo: 'Sin nada' }
  ]
};
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async (GUIA) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable(); await w.write(JSON.stringify(GUIA)); await w.close();
}, GUIA);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ---------- 1, 2 y 3: el modelo, puros, sin disco ---------- */
console.log('--- 1. el editor de un paso de la guía ---');
await pagina.evaluate(() => {
  App.E.tiposDocumento.push('CERTIFICADO', 'FACTURA');
  window.__editar = Guias.editar('BECA', [
    { id: 'e1', titulo: 'Con datos', textoDocumentos: 'Hola {curso}', tipoDocumento: 'CERTIFICADO' },
    { id: 'e2', titulo: 'Sin datos' }
  ], [], []);
});
await pagina.waitForSelector('#guia-pasos .paso-editor');
await comprobar('el texto del hito sale ya escrito',
  pagina.locator('.paso-texto-documentos').nth(0).inputValue(), 'Hola {curso}');
await comprobar('el tipo de documento sale ya elegido',
  pagina.locator('.paso-tipo-documento').nth(0).inputValue(), 'CERTIFICADO');
await comprobar('un paso sin nada, los dos vacíos',
  pagina.locator('.paso-texto-documentos').nth(1).inputValue(), '');
/* El acordeón (fila 122) nace con todo cerrado: hay que abrir el
   segundo paso antes de poder escribir en sus campos. */
await pagina.click('#guia-pasos > .paso-editor[data-pos="1"] > .paso-cabecera > .paso-numero');
await pagina.locator('.paso-texto-documentos').nth(1).fill('Nuevo texto');
await pagina.locator('.paso-tipo-documento').nth(1).selectOption('FACTURA');
await pagina.click('#cuadro-aceptar');
const guardadoEditor = await pagina.evaluate(async () => {
  const p = await window.__editar;
  return p.map(x => ({ textoDocumentos: x.textoDocumentos, tipoDocumento: x.tipoDocumento }));
});
await comprobar('recoger() lee los dos campos nuevos', Promise.resolve(guardadoEditor[1]),
  { textoDocumentos: 'Nuevo texto', tipoDocumento: 'FACTURA' });
await comprobar('y conserva el primero tal cual', Promise.resolve(guardadoEditor[0]),
  { textoDocumentos: 'Hola {curso}', tipoDocumento: 'CERTIFICADO' });
await comprobar('un paso-pregunta no lleva ninguno de los dos',
  pagina.evaluate(() => {
    const n = Guias.normalizar([{ titulo: 'q', textoDocumentos: 'x', tipoDocumento: 'Y',
      opciones: [{ titulo: 'sí', pasos: [] }, { titulo: 'no', pasos: [] }] }]);
    return [n[0].textoDocumentos, n[0].tipoDocumento];
  }), ['', '']);

console.log('--- 2. la biblioteca ---');
await comprobar('un hito traído de la biblioteca hereda el texto y el tipo',
  pagina.evaluate(() => {
    const modelo = HitosBiblioteca._normalizarModelo({ titulo: 'M', textoDocumentos: 'Hola {curso}', tipoDocumento: 'CERTIFICADO' });
    const paso = HitosBiblioteca.modeloAPaso(modelo);
    return [paso.textoDocumentos, paso.tipoDocumento, paso.origenBiblioteca.id === modelo.id];
  }), ['Hola {curso}', 'CERTIFICADO', true]);
await comprobar('y se comparan igual que los demás campos (CAMPOS_COMPARABLES)',
  pagina.evaluate(() => {
    const modelo = HitosBiblioteca._normalizarModelo({ titulo: 'M', textoDocumentos: 'Hola', tipoDocumento: 'CERTIFICADO' });
    const paso = HitosBiblioteca.modeloAPaso(modelo);
    const sinCambios = HitosBiblioteca.diferencias(paso, modelo).length;
    paso.textoDocumentos = 'Cambiado';
    const cambiado = HitosBiblioteca.diferencias(paso, modelo).map(d => d.campo);
    return [sinCambios, cambiado];
  }), [0, ['textoDocumentos']]);

console.log('--- 3. Hitos.pasoAHito ---');
await comprobar('copia el texto y el tipo del paso al hito vivo',
  pagina.evaluate(() => {
    const h = Hitos.pasoAHito({ id: 'x1', titulo: 'Paso', textoDocumentos: 'Hola', tipoDocumento: 'CERTIFICADO', opciones: [] });
    return [h.textoDocumentos, h.tipoDocumento];
  }), ['Hola', 'CERTIFICADO']);
await comprobar('un paso-pregunta no lleva ninguno de los dos',
  pagina.evaluate(() => {
    const h = Hitos.pasoAHito({ id: 'x2', titulo: 'Pregunta', textoDocumentos: 'Hola', tipoDocumento: 'CERTIFICADO',
      opciones: [{ id: 'o1', titulo: 'sí', pasos: [] }] });
    return [h.textoDocumentos, h.tipoDocumento];
  }), ['', '']);

/* ---------- 4 a 7: el cuadro de "Cambiar el nombre" ---------- */
console.log('--- 4 a 7. el cuadro sale relleno (o no) ---');
/* "Texto por defecto" de FACTURA (Ajustes → El centro → Tipos de
   documento), para el hito que solo trae el tipo (apartado 1, punto 2). */
await pagina.evaluate(async () => {
  App.E.campos = await Campos.guardarTextoPorDefectoDeDocumento(App.E.gestor, 'FACTURA', 'Por defecto {tipo}');
});

const A = '260920 BECA Uno, Ana 1150001';
await pagina.evaluate(async (A) => {
  await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  await App.anotar(A, { tipo: 'BECA', categoria: 'ALUMNADO', tercero: 'Uno, Ana 1150001', curso: '25-26', abiertoEl: U.ahora() });
  await App.verAbiertos();
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  await App.abrirFicha(a, 'abierto');
}, A);
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]');
await pagina.waitForTimeout(300);   /* los hitos se crean solos, en cuanto se pinta la ficha */

async function abrirDesdeHito(idHito) {
  return pagina.evaluate(async ([A, idHito]) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
    const hito = (await Hitos.hitosDe(A)).filter(h => h.id === idHito)[0];
    window.__doc = Documentos.abrir(a, { hito: hito, irDirectoAAnadir: true });
  }, [A, idHito]);
}
async function cerrarCuadro() {
  await pagina.click('#doc-volver');
  await pagina.waitForSelector('#doc-anadir');   /* de vuelta a la lista, vacía o no */
  await pagina.click('#cuadro-aceptar');
  await pagina.evaluate(() => window.__doc);
}

await abrirDesdeHito('p1');
await pagina.waitForSelector('#doc-vista');
await pagina.waitForTimeout(200);
await comprobar('4. el tipo sale el del hito', pagina.inputValue('#doc-tipo'), 'CERTIFICADO');
await comprobar('4. el texto sale el del hito, con sus huecos rellenos',
  pagina.inputValue('#doc-curso'), 'Curso 25-26');
await cerrarCuadro();

await abrirDesdeHito('p2');
await pagina.waitForSelector('#doc-vista');
await pagina.waitForTimeout(200);
await comprobar('5. sin texto propio, el tipo sigue siendo el del hito', pagina.inputValue('#doc-tipo'), 'FACTURA');
await comprobar('5. el texto sale el del tipo de documento elegido, con sus huecos',
  pagina.inputValue('#doc-curso'), 'Por defecto BECA');
await cerrarCuadro();

await abrirDesdeHito('p3');
await pagina.waitForSelector('#doc-vista');
await pagina.waitForTimeout(200);
await comprobar('6. sin nada en el hito ni en el tipo, el texto sale vacío', pagina.inputValue('#doc-curso'), '');
await cerrarCuadro();

/* "Por clasificar" / sin ningún hito: solo el texto del tipo de
   documento (el tipo, por la memoria de la fila 174, como haría
   "Por clasificar" al no tener nada más concreto). */
await pagina.evaluate(() => localStorage.setItem('gestor-ultimo-tipo-doc', JSON.stringify({ BECA: 'FACTURA' })));
await pagina.evaluate(async (A) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  window.__doc = Documentos.abrir(a, { irDirectoAAnadir: true });
}, A);
await pagina.waitForSelector('#doc-vista');
await pagina.waitForTimeout(200);
await comprobar('7. sin hito, el tipo sale el de la memoria (fila 174)', pagina.inputValue('#doc-tipo'), 'FACTURA');
await comprobar('7. y el texto, el del tipo de documento (nada que sacar de ningún hito)',
  pagina.inputValue('#doc-curso'), 'Por defecto BECA');
await cerrarCuadro();

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
